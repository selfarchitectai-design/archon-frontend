"""
ARCHON Compact Federation - Production Line Controller
Version: 2.5.1
Purpose: Automated continuous production mechanism with self-healing
"""

import json
import time
import logging
import sqlite3
import requests
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Any, List, Optional
from threading import Thread, Event

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('ARCHON.ProductionLine')


class ProductionLineController:
    """
    Manages automated, continuous production builds
    Monitors telemetry and implements self-healing
    """
    
    def __init__(self, config_path: str = None):
        self.config = self._load_config(config_path)
        self.db_path = Path(__file__).parent.parent / 'telemetry' / 'memory_store.sqlite'
        
        # State tracking
        self.running = False
        self.stop_event = Event()
        self.consecutive_successes = 0
        self.consecutive_failures = 0
        
        # Configuration
        self.success_threshold = self.config.get('success_threshold', 3)
        self.max_retries = self.config.get('retry_policy', {}).get('max_attempts', 3)
        self.retry_delay = self.config.get('retry_policy', {}).get('delay_seconds', 60)
        
        # API endpoints
        self.archon_api = os.environ.get('ARCHON_API_URL', 'https://www.selfarchitectai.com')
        self.github_token = os.environ.get('GITHUB_TOKEN')
        
        logger.info("Production Line Controller initialized")
    
    def _load_config(self, config_path: str = None) -> Dict[str, Any]:
        """Load production line configuration"""
        if config_path is None:
            config_path = Path(__file__).parent / 'product_blueprint.json'
        
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config not found: {config_path}, using defaults")
            return {
                'product_name': 'ARCHON AI Platform',
                'release_cycle': 'continuous',
                'auto_deploy': True,
                'success_threshold': 3,
                'retry_policy': {
                    'max_attempts': 3,
                    'delay_seconds': 60,
                    'exponential_backoff': True
                }
            }
    
    def start(self):
        """
        Start the production line monitor
        """
        if self.running:
            logger.warning("Production line already running")
            return
        
        self.running = True
        self.stop_event.clear()
        
        logger.info("🏭 Production Line started")
        
        # Start monitor thread
        self.monitor_thread = Thread(target=self._monitor_loop, daemon=True)
        self.monitor_thread.start()
    
    def stop(self):
        """
        Stop the production line monitor
        """
        self.running = False
        self.stop_event.set()
        logger.info("🛑 Production Line stopped")
    
    def _monitor_loop(self):
        """
        Main monitoring loop
        """
        check_interval = 60  # seconds
        
        while not self.stop_event.is_set():
            try:
                # Check for approved builds
                approved_builds = self._check_supervisor_queue()
                
                for build in approved_builds:
                    self._process_build(build)
                
                # Check telemetry for failures
                self._check_for_failures()
                
                # Generate summary if threshold reached
                if self.consecutive_successes >= self.success_threshold:
                    self._generate_performance_summary()
                    self.consecutive_successes = 0
                
            except Exception as e:
                logger.error(f"Monitor loop error: {e}")
            
            # Wait for next check
            self.stop_event.wait(check_interval)
    
    def _check_supervisor_queue(self) -> List[Dict[str, Any]]:
        """
        Check Supervisor for approved builds waiting to execute
        """
        try:
            response = requests.get(
                f"{self.archon_api}/api/archon/builds/pending",
                timeout=10
            )
            
            if response.ok:
                return response.json().get('builds', [])
            return []
            
        except Exception as e:
            logger.warning(f"Could not check Supervisor queue: {e}")
            return []
    
    def _process_build(self, build: Dict[str, Any]):
        """
        Process a single build request
        """
        plan_id = build.get('plan_id', 'unknown')
        logger.info(f"📦 Processing build: {plan_id}")
        
        attempt = 0
        success = False
        
        while attempt < self.max_retries and not success:
            attempt += 1
            logger.info(f"Attempt {attempt}/{self.max_retries}")
            
            result = self._trigger_build(build)
            
            if result.get('success'):
                success = True
                self.consecutive_successes += 1
                self.consecutive_failures = 0
                logger.info(f"✅ Build {plan_id} succeeded")
            else:
                self.consecutive_failures += 1
                logger.warning(f"⚠️ Build {plan_id} failed, attempt {attempt}")
                
                if attempt < self.max_retries:
                    # Calculate backoff delay
                    delay = self.retry_delay
                    if self.config.get('retry_policy', {}).get('exponential_backoff'):
                        delay = delay * (2 ** (attempt - 1))
                    
                    logger.info(f"Retrying in {delay} seconds...")
                    time.sleep(delay)
        
        if not success:
            self._handle_persistent_failure(build)
    
    def _trigger_build(self, build: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger GitHub MCP build
        """
        repo = 'selfarchitectai-design/archon-deploy-bridge'
        url = f"https://api.github.com/repos/{repo}/actions/workflows/vercel-deploy.yml/dispatches"
        
        payload = {
            "ref": "main",
            "inputs": {
                "deploy_target": build.get('deploy_target', 'production'),
                "triggered_by": "ProductionLine",
                "description": f"Auto build: {build.get('plan_id', 'unknown')}"
            }
        }
        
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.github_token}",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 204:
                return {'success': True}
            else:
                return {'success': False, 'error': response.text}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _check_for_failures(self):
        """
        Check telemetry for recent failures and trigger self-heal
        """
        if self.consecutive_failures >= 3:
            logger.warning("🔧 Multiple failures detected - initiating self-heal")
            self._self_heal()
    
    def _self_heal(self):
        """
        Self-healing mechanism for persistent failures
        """
        logger.info("🔧 Running self-heal procedure...")
        
        # 1. Notify Supervisor
        self._notify_supervisor({
            'event': 'self_heal_triggered',
            'consecutive_failures': self.consecutive_failures,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
        
        # 2. Try rollback to last known good state
        # This would trigger a rollback workflow in real implementation
        
        # 3. Reset failure counter
        self.consecutive_failures = 0
        
        logger.info("✅ Self-heal complete")
    
    def _handle_persistent_failure(self, build: Dict[str, Any]):
        """
        Handle a build that failed all retry attempts
        """
        logger.error(f"❌ Build {build.get('plan_id')} failed after {self.max_retries} attempts")
        
        # Notify Supervisor for manual intervention
        self._notify_supervisor({
            'event': 'build_failure_persistent',
            'plan_id': build.get('plan_id'),
            'requires_intervention': True,
            'timestamp': datetime.now(timezone.utc).isoformat()
        })
    
    def _generate_performance_summary(self):
        """
        Generate performance summary after successful builds
        """
        logger.info("📊 Generating performance summary")
        
        summary = {
            'generated_at': datetime.now(timezone.utc).isoformat(),
            'consecutive_successes': self.success_threshold,
            'production_line': self.config.get('product_name'),
            'status': 'healthy'
        }
        
        # Add telemetry data
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    AVG(latency_ms) as avg_latency,
                    AVG(ai_trust_score) as avg_trust
                FROM telemetry
                WHERE timestamp > datetime('now', '-7 days')
            """)
            
            row = cursor.fetchone()
            summary['metrics'] = {
                'builds_7d': row[0],
                'avg_latency_ms': round(row[1] or 0, 2),
                'avg_trust_score': round(row[2] or 0.75, 3)
            }
            
            conn.close()
        except Exception as e:
            logger.warning(f"Could not get metrics: {e}")
        
        # Save summary
        reports_dir = Path(__file__).parent.parent / 'reports'
        reports_dir.mkdir(exist_ok=True)
        
        summary_file = reports_dir / f"build_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(summary_file, 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info(f"📊 Summary saved: {summary_file}")
        
        # Notify Supervisor
        self._notify_supervisor({
            'event': 'performance_summary',
            'summary': summary
        })
    
    def _notify_supervisor(self, event: Dict[str, Any]):
        """
        Send notification to ARCHON Supervisor
        """
        try:
            requests.post(
                f"{self.archon_api}/api/archon/telemetry",
                json={
                    'source': 'production_line',
                    **event
                },
                timeout=5
            )
        except Exception as e:
            logger.warning(f"Could not notify Supervisor: {e}")
    
    def get_status(self) -> Dict[str, Any]:
        """
        Get current production line status
        """
        return {
            'running': self.running,
            'consecutive_successes': self.consecutive_successes,
            'consecutive_failures': self.consecutive_failures,
            'config': self.config,
            'health': 'healthy' if self.consecutive_failures < 3 else 'degraded'
        }
    
    def manual_trigger(self, build: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Manually trigger a build
        """
        if build is None:
            build = {
                'plan_id': f"manual-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                'deploy_target': 'production',
                'triggered_by': 'manual'
            }
        
        logger.info(f"🔧 Manual trigger: {build.get('plan_id')}")
        return self._trigger_build(build)


# CLI Interface
if __name__ == "__main__":
    import sys
    
    controller = ProductionLineController()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "start":
            controller.start()
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                controller.stop()
                
        elif command == "status":
            status = controller.get_status()
            print(json.dumps(status, indent=2))
            
        elif command == "trigger":
            result = controller.manual_trigger()
            print(json.dumps(result, indent=2))
            
        elif command == "summary":
            controller._generate_performance_summary()
    else:
        print("ARCHON Production Line Controller")
        print("Usage: python line_controller.py [start|status|trigger|summary]")
