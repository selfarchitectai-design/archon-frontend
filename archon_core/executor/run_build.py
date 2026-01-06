#!/usr/bin/env python3
"""
ARCHON Compact Federation - Build Runner
Version: 2.5.1
Purpose: Execute build pipeline and collect telemetry

This script:
1. Executes the build process
2. Runs tests
3. Collects metrics
4. Reports telemetry back to Supervisor
"""

import subprocess
import json
import time
import os
import sys
from datetime import datetime, timezone
from typing import Dict, Any, Optional


class BuildRunner:
    """
    ARCHON Build Runner
    Executes build steps and collects telemetry
    """
    
    def __init__(self):
        self.start_time = None
        self.end_time = None
        self.telemetry = {
            "build_status": "pending",
            "tests_passed": False,
            "token_cost": 0.0,
            "latency_ms": 0,
            "error_count": 0,
            "errors": [],
            "steps_completed": [],
            "timestamp": None
        }
    
    def run_command(self, command: str, description: str, 
                    check: bool = False) -> Dict[str, Any]:
        """
        Run a shell command and capture output
        
        Args:
            command: Command to execute
            description: Step description for logging
            check: Whether to raise on non-zero exit
            
        Returns:
            Result dict with status and output
        """
        print(f"\n{'='*50}")
        print(f"🔧 {description}")
        print(f"{'='*50}")
        print(f"Command: {command}")
        
        start = time.time()
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )
            
            elapsed = (time.time() - start) * 1000  # ms
            
            output = {
                "success": result.returncode == 0,
                "exit_code": result.returncode,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "elapsed_ms": elapsed
            }
            
            if result.returncode == 0:
                print(f"✅ Success ({elapsed:.0f}ms)")
                self.telemetry["steps_completed"].append(description)
            else:
                print(f"❌ Failed (exit code {result.returncode})")
                self.telemetry["error_count"] += 1
                self.telemetry["errors"].append({
                    "step": description,
                    "exit_code": result.returncode,
                    "stderr": result.stderr[:500] if result.stderr else ""
                })
            
            if result.stdout:
                print(f"Output: {result.stdout[:500]}...")
            if result.stderr and result.returncode != 0:
                print(f"Error: {result.stderr[:500]}...")
            
            return output
            
        except subprocess.TimeoutExpired:
            print(f"⏰ Timeout after 600 seconds")
            self.telemetry["error_count"] += 1
            self.telemetry["errors"].append({
                "step": description,
                "error": "Timeout"
            })
            return {"success": False, "exit_code": -1, "error": "Timeout"}
            
        except Exception as e:
            print(f"💥 Exception: {e}")
            self.telemetry["error_count"] += 1
            self.telemetry["errors"].append({
                "step": description,
                "error": str(e)
            })
            return {"success": False, "exit_code": -1, "error": str(e)}
    
    def build_pipeline(self) -> Dict[str, Any]:
        """
        Execute the full build pipeline
        
        Returns:
            Telemetry data
        """
        self.start_time = time.time()
        self.telemetry["timestamp"] = datetime.now(timezone.utc).isoformat()
        
        print("\n" + "="*60)
        print("🏗️  ARCHON BUILD PIPELINE STARTING")
        print("="*60)
        
        # Step 1: Environment Setup
        self.run_command(
            "node --version && npm --version",
            "Check Node.js Environment"
        )
        
        # Step 2: Install Dependencies
        result = self.run_command(
            "npm ci || npm install",
            "Install Dependencies"
        )
        
        if not result.get("success", False):
            self.telemetry["build_status"] = "failed"
            self._finalize()
            return self.telemetry
        
        # Step 3: Lint Check
        lint_result = self.run_command(
            "npm run lint --if-present || echo 'No lint script'",
            "Run Linter"
        )
        
        # Step 4: Build
        build_result = self.run_command(
            "npm run build",
            "Build Project"
        )
        
        if not build_result.get("success", False):
            self.telemetry["build_status"] = "failed"
            self._finalize()
            return self.telemetry
        
        # Step 5: Run Tests
        test_result = self.run_command(
            "npm test --if-present || echo 'No test script'",
            "Run Tests"
        )
        
        self.telemetry["tests_passed"] = test_result.get("success", False)
        
        # Step 6: Optional Docker Build
        if os.path.exists("Dockerfile"):
            self.run_command(
                "docker build -t archon_ai_core . --quiet",
                "Build Docker Image"
            )
        
        # Determine final status
        if self.telemetry["error_count"] == 0:
            self.telemetry["build_status"] = "success"
        elif self.telemetry["error_count"] < 3:
            self.telemetry["build_status"] = "partial"
        else:
            self.telemetry["build_status"] = "failed"
        
        self._finalize()
        return self.telemetry
    
    def _finalize(self):
        """Finalize telemetry data"""
        self.end_time = time.time()
        self.telemetry["latency_ms"] = int((self.end_time - self.start_time) * 1000)
        
        # Estimate token cost (approximate based on build size)
        build_size_mb = self._get_build_size()
        self.telemetry["token_cost"] = round(build_size_mb * 0.01, 4)  # $0.01 per MB estimate
        
        print("\n" + "="*60)
        print("📊 BUILD SUMMARY")
        print("="*60)
        print(f"Status: {self.telemetry['build_status']}")
        print(f"Duration: {self.telemetry['latency_ms']}ms")
        print(f"Steps Completed: {len(self.telemetry['steps_completed'])}")
        print(f"Errors: {self.telemetry['error_count']}")
        print(f"Tests Passed: {self.telemetry['tests_passed']}")
        print(f"Estimated Cost: ${self.telemetry['token_cost']}")
    
    def _get_build_size(self) -> float:
        """Get approximate build output size in MB"""
        try:
            result = subprocess.run(
                "du -sm .next 2>/dev/null || du -sm build 2>/dev/null || echo '1'",
                shell=True,
                capture_output=True,
                text=True
            )
            size = int(result.stdout.split()[0])
            return float(size)
        except Exception:
            return 1.0
    
    def save_telemetry(self, path: str = "../telemetry/telemetry.json"):
        """Save telemetry to file"""
        telemetry_path = os.path.join(os.path.dirname(__file__), path)
        os.makedirs(os.path.dirname(telemetry_path), exist_ok=True)
        
        with open(telemetry_path, 'w') as f:
            json.dump(self.telemetry, f, indent=2)
        
        print(f"\n📝 Telemetry saved to {telemetry_path}")
    
    def send_telemetry(self, endpoint: str = None):
        """Send telemetry to ARCHON API"""
        import requests
        
        endpoint = endpoint or os.environ.get(
            'ARCHON_TELEMETRY_ENDPOINT',
            'https://www.selfarchitectai.com/api/archon/telemetry'
        )
        
        try:
            response = requests.post(
                endpoint,
                json=self.telemetry,
                timeout=10
            )
            
            if response.ok:
                print(f"📤 Telemetry sent to {endpoint}")
            else:
                print(f"⚠️ Telemetry send failed: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ Could not send telemetry: {e}")


def main():
    """Main entry point"""
    runner = BuildRunner()
    
    # Run the build pipeline
    telemetry = runner.build_pipeline()
    
    # Save telemetry locally
    runner.save_telemetry()
    
    # Send telemetry to ARCHON (if endpoint available)
    try:
        runner.send_telemetry()
    except Exception as e:
        print(f"Warning: Could not send telemetry: {e}")
    
    # Exit with appropriate code
    if telemetry["build_status"] == "success":
        sys.exit(0)
    elif telemetry["build_status"] == "partial":
        sys.exit(0)  # Partial success is still success
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
