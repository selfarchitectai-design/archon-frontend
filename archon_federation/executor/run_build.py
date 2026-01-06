"""
ARCHON Compact Federation - Build Runner
Version: 2.5.1
Purpose: Executes build pipeline and collects telemetry
"""

import subprocess
import json
import time
import os
import sys
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('ARCHON.BuildRunner')


class BuildRunner:
    """
    Executes build, test, and deploy operations
    Collects telemetry for Supervisor feedback
    """
    
    def __init__(self, plan: Dict[str, Any] = None):
        self.plan = plan or {}
        self.plan_id = self.plan.get('plan_id', f"build-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        self.telemetry = {
            'plan_id': self.plan_id,
            'start_time': datetime.now(timezone.utc).isoformat(),
            'steps': [],
            'errors': [],
            'metrics': {}
        }
        
        logger.info(f"Build Runner initialized for plan: {self.plan_id}")
    
    def run_step(self, name: str, command: List[str], check: bool = True) -> Dict[str, Any]:
        """
        Run a single build step
        """
        logger.info(f"▶️ Running step: {name}")
        start = time.time()
        
        step_result = {
            'name': name,
            'command': ' '.join(command),
            'start_time': datetime.now(timezone.utc).isoformat(),
            'success': False,
            'output': '',
            'error': '',
            'duration_seconds': 0
        }
        
        try:
            result = subprocess.run(
                command,
                capture_output=True,
                text=True,
                check=check
            )
            
            step_result['success'] = result.returncode == 0
            step_result['output'] = result.stdout[:1000] if result.stdout else ''
            step_result['error'] = result.stderr[:500] if result.stderr else ''
            step_result['return_code'] = result.returncode
            
            if step_result['success']:
                logger.info(f"✅ Step '{name}' completed successfully")
            else:
                logger.warning(f"⚠️ Step '{name}' completed with warnings")
                
        except subprocess.CalledProcessError as e:
            step_result['error'] = str(e)
            logger.error(f"❌ Step '{name}' failed: {e}")
            self.telemetry['errors'].append({
                'step': name,
                'error': str(e)
            })
            
        except Exception as e:
            step_result['error'] = str(e)
            logger.error(f"❌ Step '{name}' exception: {e}")
            
        finally:
            step_result['duration_seconds'] = round(time.time() - start, 2)
            step_result['end_time'] = datetime.now(timezone.utc).isoformat()
            self.telemetry['steps'].append(step_result)
        
        return step_result
    
    def run_build(self) -> Dict[str, Any]:
        """
        Execute full build pipeline
        """
        logger.info("🏗️ Starting build pipeline")
        build_start = time.time()
        
        # Step 1: Install dependencies
        self.run_step(
            'install_dependencies',
            ['npm', 'ci'],
            check=False
        )
        
        # Step 2: Lint
        self.run_step(
            'lint',
            ['npm', 'run', 'lint'],
            check=False
        )
        
        # Step 3: Build
        build_result = self.run_step(
            'build',
            ['npm', 'run', 'build'],
            check=False
        )
        
        # Update metrics
        self.telemetry['metrics']['build_duration'] = round(time.time() - build_start, 2)
        self.telemetry['metrics']['build_success'] = build_result['success']
        
        return build_result
    
    def run_tests(self) -> Dict[str, Any]:
        """
        Execute test suite
        """
        logger.info("🧪 Running tests")
        
        test_result = self.run_step(
            'test',
            ['npm', 'run', 'test', '--', '--passWithNoTests'],
            check=False
        )
        
        self.telemetry['metrics']['tests_passed'] = test_result['success']
        
        return test_result
    
    def run_deploy(self, target: str = 'production') -> Dict[str, Any]:
        """
        Execute deployment (placeholder - actual deploy via Vercel Action)
        """
        logger.info(f"🚀 Deploying to {target}")
        
        # In actual pipeline, this is handled by Vercel Action
        # This is for local testing
        deploy_result = {
            'name': 'deploy',
            'target': target,
            'success': True,
            'message': 'Deploy handled by Vercel Action in CI/CD'
        }
        
        self.telemetry['steps'].append(deploy_result)
        self.telemetry['metrics']['deploy_target'] = target
        
        return deploy_result
    
    def run_full_pipeline(self) -> Dict[str, Any]:
        """
        Execute complete build → test → deploy pipeline
        """
        pipeline_start = time.time()
        logger.info("=" * 50)
        logger.info("🚀 ARCHON Federation Build Pipeline")
        logger.info("=" * 50)
        
        results = {
            'plan_id': self.plan_id,
            'status': 'success',
            'steps': {}
        }
        
        # Build
        build = self.run_build()
        results['steps']['build'] = build['success']
        
        if not build['success']:
            results['status'] = 'build_failed'
            logger.error("❌ Build failed - aborting pipeline")
        else:
            # Test
            test = self.run_tests()
            results['steps']['test'] = test['success']
            
            if not test['success']:
                results['status'] = 'test_failed'
                logger.warning("⚠️ Tests failed but continuing")
            
            # Deploy
            deploy_target = self.plan.get('deploy_target', 'production')
            deploy = self.run_deploy(deploy_target)
            results['steps']['deploy'] = deploy['success']
        
        # Finalize telemetry
        self.telemetry['end_time'] = datetime.now(timezone.utc).isoformat()
        self.telemetry['total_duration'] = round(time.time() - pipeline_start, 2)
        self.telemetry['final_status'] = results['status']
        
        # Save telemetry
        self.save_telemetry()
        
        logger.info("=" * 50)
        logger.info(f"Pipeline complete: {results['status']}")
        logger.info("=" * 50)
        
        return results
    
    def save_telemetry(self, path: str = '../telemetry/telemetry.json'):
        """
        Save telemetry data to file
        """
        try:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            with open(path, 'w') as f:
                json.dump(self.telemetry, f, indent=2)
            logger.info(f"📊 Telemetry saved to {path}")
        except Exception as e:
            logger.error(f"Failed to save telemetry: {e}")
    
    def get_telemetry(self) -> Dict[str, Any]:
        """
        Get current telemetry data
        """
        return self.telemetry


def build_pipeline():
    """
    Main entry point for build pipeline
    """
    # Check for plan from environment
    plan_json = os.environ.get('ARCHON_PLAN')
    plan = json.loads(plan_json) if plan_json else {}
    
    runner = BuildRunner(plan)
    result = runner.run_full_pipeline()
    
    # Print result for CI logging
    print(json.dumps(result, indent=2))
    
    # Exit with appropriate code
    if result['status'] == 'success':
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    build_pipeline()
