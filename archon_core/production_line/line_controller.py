#!/usr/bin/env python3
"""
ARCHON Compact Federation - Production Line Controller
Version: 2.5.1
Purpose: Automated continuous production mechanism

The Production Line:
1. Monitors Supervisor for build_approved events
2. Launches build cycles via MCP
3. Monitors telemetry for success/failure
4. Implements self-healing on failures
5. Generates performance summaries
"""

import json
import time
import os
import sqlite3
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum


class BuildState(Enum):
    """Build state enumeration"""
    IDLE = "idle"
    BUILDING = "building"
    TESTING = "testing"
    DEPLOYING = "deploying"
    SUCCESS = "success"
    FAILED = "failed"
    SELF_HEALING = "self_healing"


@dataclass
class ProductionCycle:
    """Represents a production cycle"""
    id: str
    started_at: str
    state: BuildState
    build_count: int
    success_count: int
    failure_count: int
    last_error: Optional[str]


class ProductionLineController:
    """
    ARCHON Production Line Controller
    Manages automated build and deploy cycles
    """
    
    # Configuration
    MAX_RETRY_ATTEMPTS = 3
    RETRY_DELAY_SECONDS = 60
    SUCCESS_THRESHOLD = 3  # Generate summary after N successes
    POLLING_INTERVAL = 30  # seconds
    
    def __init__(self):
        self.state = BuildState.IDLE
        self.current_cycle: Optional[ProductionCycle] = None
        self.consecutive_successes = 0
        self.consecutive_failures = 0
        
        # Load configuration
        self.config = self._load_config()
        
        # API endpoints
        self.archon_api = os.environ.get('ARCHON_API_URL', 
                                         'https://www.selfarchitectai.com')
        self.github_token = os.environ.get('GITHUB_TOKEN', '')
        
        # Database for cycle tracking
        self.db_path = os.path.join(os.path.dirname(__file__), 
                                    '..', 'telemetry', 'memory_store.sqlite')
        self._init_database()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load production line configuration"""
        blueprint_path = os.path.join(os.path.dirname(__file__), 
                                      'product_blueprint.json')
        
        if os.path.exists(blueprint_path):
            with open(blueprint_path, 'r') as f:
                return json.load(f)
        
        return {
            "product_name": "ARCHON AI Platform",
            "release_cycle": "weekly",
            "modules": ["AI Core", "Telemetry Engine", "Supervisor Interface"],
            "build_target": "GitHub MCP Runner",
            "auto_deploy": True
        }
    
    def _init_database(self):
        """Initialize database tables"""
        if not os.path.exists(os.path.dirname(self.db_path)):
            os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS production_cycles (
                id TEXT PRIMARY KEY,
                started_at TEXT NOT NULL,
                ended_at TEXT,
                state TEXT NOT NULL,
                build_count INTEGER DEFAULT 0,
                success_count INTEGER DEFAULT 0,
                failure_count INTEGER DEFAULT 0,
                last_error TEXT,
                summary TEXT
            )
        """)
        
        conn.commit()
        conn.close()
    
    def start_cycle(self) -> ProductionCycle:
        """Start a new production cycle"""
        cycle_id = f"cycle-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
        self.current_cycle = ProductionCycle(
            id=cycle_id,
            started_at=datetime.now(timezone.utc).isoformat(),
            state=BuildState.IDLE,
            build_count=0,
            success_count=0,
            failure_count=0,
            last_error=None
        )
        
        self._save_cycle()
        
        print(f"\n{'='*60}")
        print(f"🏭 PRODUCTION CYCLE STARTED: {cycle_id}")
        print(f"{'='*60}")
        
        return self.current_cycle
    
    def _save_cycle(self):
        """Save current cycle to database"""
        if not self.current_cycle:
            return
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT OR REPLACE INTO production_cycles 
            (id, started_at, state, build_count, success_count, 
             failure_count, last_error)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            self.current_cycle.id,
            self.current_cycle.started_at,
            self.current_cycle.state.value,
            self.current_cycle.build_count,
            self.current_cycle.success_count,
            self.current_cycle.failure_count,
            self.current_cycle.last_error
        ))
        
        conn.commit()
        conn.close()
    
    def check_supervisor_approval(self) -> Optional[Dict]:
        """Check Supervisor for approved builds"""
        try:
            response = requests.get(
                f"{self.archon_api}/api/archon/trust",
                timeout=10
            )
            
            if response.ok:
                data = response.json()
                
                # Check for pending approved decisions
                if data.get('pending_builds'):
                    return data['pending_builds'][0]
                
                # Check trust score
                if data.get('trust_score', 0) >= 0.7:
                    return {
                        "approved": True,
                        "trust_score": data.get('trust_score'),
                        "source": "supervisor_api"
                    }
            
            return None
            
        except Exception as e:
            print(f"⚠️ Could not check supervisor: {e}")
            return None
    
    def trigger_build(self, decision: Dict) -> bool:
        """Trigger a build via GitHub Actions"""
        if not self.current_cycle:
            self.start_cycle()
        
        self.current_cycle.state = BuildState.BUILDING
        self.current_cycle.build_count += 1
        self._save_cycle()
        
        print(f"\n🔨 Triggering build #{self.current_cycle.build_count}")
        
        try:
            # Dispatch to GitHub Actions
            response = requests.post(
                "https://api.github.com/repos/selfarchitectai-design/archon-deploy-bridge/actions/workflows/vercel-deploy.yml/dispatches",
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {self.github_token}"
                },
                json={
                    "ref": "main",
                    "inputs": {
                        "deploy_target": "production",
                        "triggered_by": "production-line",
                        "description": f"Production cycle {self.current_cycle.id}",
                        "decision_id": decision.get('decision_id', self.current_cycle.id)
                    }
                },
                timeout=30
            )
            
            if response.status_code == 204:
                print("✅ Build triggered successfully")
                return True
            else:
                print(f"❌ Build trigger failed: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ Build trigger error: {e}")
            self.current_cycle.last_error = str(e)
            return False
    
    def monitor_build_result(self, timeout_seconds: int = 300) -> str:
        """Monitor build result from telemetry"""
        if not self.current_cycle:
            return "no_cycle"
        
        self.current_cycle.state = BuildState.TESTING
        self._save_cycle()
        
        print(f"👀 Monitoring build result (timeout: {timeout_seconds}s)...")
        
        start_time = time.time()
        
        while time.time() - start_time < timeout_seconds:
            try:
                # Check telemetry API
                response = requests.get(
                    f"{self.archon_api}/api/archon/telemetry/latest",
                    timeout=10
                )
                
                if response.ok:
                    data = response.json()
                    
                    if data.get('build_status') == 'success':
                        return 'success'
                    elif data.get('build_status') == 'failed':
                        return 'failed'
                
            except Exception:
                pass
            
            time.sleep(self.POLLING_INTERVAL)
        
        return 'timeout'
    
    def handle_success(self):
        """Handle successful build"""
        if not self.current_cycle:
            return
        
        self.current_cycle.state = BuildState.SUCCESS
        self.current_cycle.success_count += 1
        self.consecutive_successes += 1
        self.consecutive_failures = 0
        self._save_cycle()
        
        print(f"✅ Build successful! ({self.consecutive_successes} consecutive)")
        
        # Generate summary after threshold
        if self.consecutive_successes >= self.SUCCESS_THRESHOLD:
            self.generate_summary()
            self.consecutive_successes = 0
    
    def handle_failure(self, error: str = ""):
        """Handle failed build with self-healing"""
        if not self.current_cycle:
            return
        
        self.current_cycle.state = BuildState.FAILED
        self.current_cycle.failure_count += 1
        self.current_cycle.last_error = error
        self.consecutive_failures += 1
        self.consecutive_successes = 0
        self._save_cycle()
        
        print(f"❌ Build failed! ({self.consecutive_failures} consecutive)")
        
        # Self-healing logic
        if self.consecutive_failures < self.MAX_RETRY_ATTEMPTS:
            self.self_heal()
        else:
            print(f"⚠️ Max retries ({self.MAX_RETRY_ATTEMPTS}) reached. Manual intervention required.")
            self._notify_alert("Max build retries reached")
    
    def self_heal(self):
        """Attempt to self-heal from failure"""
        if not self.current_cycle:
            return
        
        self.current_cycle.state = BuildState.SELF_HEALING
        self._save_cycle()
        
        print(f"\n🔧 Self-healing attempt #{self.consecutive_failures}")
        print(f"   Waiting {self.RETRY_DELAY_SECONDS}s before retry...")
        
        time.sleep(self.RETRY_DELAY_SECONDS)
        
        # Retry build with increased delay
        self.trigger_build({
            "source": "self_heal",
            "retry_attempt": self.consecutive_failures
        })
    
    def generate_summary(self):
        """Generate production summary report"""
        if not self.current_cycle:
            return
        
        summary = {
            "cycle_id": self.current_cycle.id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "total_builds": self.current_cycle.build_count,
            "successful_builds": self.current_cycle.success_count,
            "failed_builds": self.current_cycle.failure_count,
            "success_rate": self.current_cycle.success_count / max(1, self.current_cycle.build_count),
            "product_name": self.config.get("product_name"),
            "modules": self.config.get("modules", [])
        }
        
        # Save summary
        summary_path = os.path.join(os.path.dirname(__file__), 
                                    '..', 'reports', 'build_summary.json')
        os.makedirs(os.path.dirname(summary_path), exist_ok=True)
        
        with open(summary_path, 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📋 Production Summary Generated")
        print(f"   File: {summary_path}")
        print(f"   Success Rate: {summary['success_rate']:.1%}")
        
        # Notify dashboard
        self._notify_dashboard("summary_generated", summary)
        
        return summary
    
    def _notify_dashboard(self, event: str, data: Dict):
        """Notify ARCHON dashboard"""
        try:
            requests.post(
                f"{self.archon_api}/api/archon/trust/log",
                json={
                    "event": event,
                    "source": "production_line",
                    "data": data,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                timeout=5
            )
        except Exception:
            pass
    
    def _notify_alert(self, message: str):
        """Send alert notification"""
        print(f"🚨 ALERT: {message}")
        self._notify_dashboard("production_alert", {"message": message})
    
    def run_continuous(self, max_iterations: int = None):
        """Run continuous production loop"""
        print("\n" + "="*60)
        print("🏭 ARCHON PRODUCTION LINE STARTING")
        print("="*60)
        
        self.start_cycle()
        iteration = 0
        
        while max_iterations is None or iteration < max_iterations:
            iteration += 1
            print(f"\n--- Iteration {iteration} ---")
            
            # Check for approved builds
            approval = self.check_supervisor_approval()
            
            if approval and approval.get('approved'):
                # Trigger build
                if self.trigger_build(approval):
                    # Monitor result
                    result = self.monitor_build_result()
                    
                    if result == 'success':
                        self.handle_success()
                    elif result == 'failed':
                        self.handle_failure("Build failed")
                    else:
                        self.handle_failure(f"Build {result}")
            else:
                print("⏳ No approved builds. Waiting...")
            
            # Wait before next check
            time.sleep(self.POLLING_INTERVAL)
        
        print("\n✅ Production line completed")
        return self.generate_summary()


def main():
    """Main entry point"""
    controller = ProductionLineController()
    
    # Run a single test cycle
    controller.start_cycle()
    
    # Simulate a build
    print("\n[TEST MODE] Simulating build cycle...")
    
    controller.current_cycle.build_count = 3
    controller.current_cycle.success_count = 3
    
    summary = controller.generate_summary()
    print(f"\nSummary: {json.dumps(summary, indent=2)}")


if __name__ == "__main__":
    main()
