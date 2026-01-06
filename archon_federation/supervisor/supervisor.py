"""
ARCHON Compact Federation - Supervisor Engine
Version: 2.5.1
Purpose: Manages AI collaboration, trust evaluation, and pipeline triggering
"""

import json
import sqlite3
import requests
import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, Optional
from pathlib import Path

# Local imports
from trust_engine import TrustEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('../logs/archon_runtime.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('ARCHON.Supervisor')


class SupervisorEngine:
    """
    ARCHON Supervisor Engine
    Manages AI decision pool, evaluates trust, and triggers build pipeline
    """
    
    def __init__(self, config_path: str = '../config/decision_pool.yaml'):
        self.config = self._load_config(config_path)
        self.trust_engine = TrustEngine()
        self.db_path = Path(__file__).parent.parent / 'telemetry' / 'memory_store.sqlite'
        self._init_database()
        
        # Thresholds
        self.trust_threshold = self.config.get('supervisor', {}).get('trust_threshold', 0.7)
        self.cohesion_threshold = self.config.get('supervisor', {}).get('cohesion_threshold', 0.6)
        
        # API Configuration
        self.github_token = os.environ.get('GITHUB_TOKEN')
        self.github_repo = os.environ.get('GITHUB_REPO', 'selfarchitectai-design/archon-frontend')
        self.archon_api = os.environ.get('ARCHON_API_URL', 'https://www.selfarchitectai.com')
        
        logger.info("Supervisor Engine initialized")
    
    def _load_config(self, config_path: str) -> Dict:
        """Load configuration from YAML file"""
        import yaml
        try:
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return {}
    
    def _init_database(self):
        """Initialize SQLite database for decision logging"""
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Decisions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                plan_id TEXT,
                plan_content TEXT,
                trust_score REAL,
                cohesion_score REAL,
                cost_efficiency REAL,
                approved INTEGER,
                triggered INTEGER,
                result TEXT
            )
        """)
        
        # AI Performance table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_performance (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ai_id TEXT,
                task_type TEXT,
                success INTEGER,
                latency_ms REAL,
                token_usage INTEGER,
                cost_usd REAL
            )
        """)
        
        # Build History table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS build_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                build_id TEXT,
                trigger_source TEXT,
                status TEXT,
                duration_seconds REAL,
                error_message TEXT
            )
        """)
        
        conn.commit()
        conn.close()
        logger.info("Database initialized")
    
    def evaluate_plan(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate an AI-generated plan
        Returns trust scores and approval decision
        """
        logger.info(f"Evaluating plan: {plan.get('plan_id', 'unknown')}")
        
        # Get trust scores from trust engine
        trust_score, cohesion_score, cost_efficiency = self.trust_engine.evaluate_trust(plan)
        
        # Determine approval
        approved = (
            trust_score >= self.trust_threshold and
            cohesion_score >= self.cohesion_threshold
        )
        
        evaluation = {
            'plan_id': plan.get('plan_id', f"plan-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
            'trust_score': trust_score,
            'cohesion_score': cohesion_score,
            'cost_efficiency': cost_efficiency,
            'approved': approved,
            'thresholds': {
                'trust': self.trust_threshold,
                'cohesion': self.cohesion_threshold
            },
            'timestamp': datetime.now(timezone.utc).isoformat()
        }
        
        # Log decision
        self._log_decision(plan, evaluation)
        
        if approved:
            logger.info(f"✅ Plan APPROVED - Trust: {trust_score:.2f}, Cohesion: {cohesion_score:.2f}")
        else:
            logger.warning(f"⚠️ Plan REJECTED - Trust: {trust_score:.2f}, Cohesion: {cohesion_score:.2f}")
        
        return evaluation
    
    def trigger_pipeline(self, plan: Dict[str, Any], evaluation: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trigger GitHub MCP build pipeline
        """
        if not evaluation.get('approved'):
            return {'success': False, 'error': 'Plan not approved'}
        
        logger.info("Triggering build pipeline...")
        
        # GitHub workflow dispatch
        webhook_url = f"https://api.github.com/repos/{self.github_repo}/dispatches"
        
        payload = {
            "event_type": "archon_build_trigger",
            "client_payload": {
                "plan_id": evaluation['plan_id'],
                "trust_score": evaluation['trust_score'],
                "triggered_by": "Supervisor",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "plan": plan
            }
        }
        
        headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.github_token}",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        try:
            response = requests.post(webhook_url, headers=headers, json=payload)
            
            if response.status_code == 204:
                logger.info("✅ Pipeline triggered successfully")
                self._log_build_trigger(evaluation['plan_id'], 'success')
                
                # Notify ARCHON dashboard
                self._notify_dashboard({
                    'event': 'pipeline_triggered',
                    'plan_id': evaluation['plan_id'],
                    'trust_score': evaluation['trust_score']
                })
                
                return {'success': True, 'message': 'Pipeline triggered'}
            else:
                error = f"Trigger failed: {response.status_code} - {response.text}"
                logger.error(error)
                self._log_build_trigger(evaluation['plan_id'], 'failed', error)
                return {'success': False, 'error': error}
                
        except Exception as e:
            error = f"Trigger exception: {str(e)}"
            logger.error(error)
            return {'success': False, 'error': error}
    
    def process_telemetry(self, telemetry: Dict[str, Any]):
        """
        Process incoming telemetry from build pipeline
        """
        logger.info(f"Processing telemetry: {telemetry.get('build_id', 'unknown')}")
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO build_history (timestamp, build_id, trigger_source, status, duration_seconds, error_message)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            datetime.now(timezone.utc).isoformat(),
            telemetry.get('build_id'),
            telemetry.get('trigger_source', 'unknown'),
            telemetry.get('status', 'unknown'),
            telemetry.get('duration_seconds'),
            telemetry.get('error_message')
        ))
        
        conn.commit()
        conn.close()
        
        # Update trust weights based on results
        if telemetry.get('status') == 'success':
            self.trust_engine.update_weights(telemetry.get('ai_contributions', {}), success=True)
        else:
            self.trust_engine.update_weights(telemetry.get('ai_contributions', {}), success=False)
    
    def get_ai_pool_status(self) -> Dict[str, Any]:
        """
        Get current status of all AI models in the pool
        """
        ai_pool = self.config.get('ai_pool', {})
        status = {}
        
        for ai_id, ai_config in ai_pool.items():
            status[ai_id] = {
                'role': ai_config.get('role'),
                'active': ai_config.get('active', False),
                'trust_weight': ai_config.get('trust_weight', 0),
                'model': ai_config.get('model')
            }
        
        return status
    
    def _log_decision(self, plan: Dict, evaluation: Dict):
        """Log decision to database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO decisions (timestamp, plan_id, plan_content, trust_score, cohesion_score, 
                                   cost_efficiency, approved, triggered, result)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now(timezone.utc).isoformat(),
            evaluation['plan_id'],
            json.dumps(plan),
            evaluation['trust_score'],
            evaluation['cohesion_score'],
            evaluation['cost_efficiency'],
            1 if evaluation['approved'] else 0,
            0,
            'pending'
        ))
        
        conn.commit()
        conn.close()
    
    def _log_build_trigger(self, plan_id: str, status: str, error: str = None):
        """Update decision record with trigger status"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            UPDATE decisions 
            SET triggered = 1, result = ?
            WHERE plan_id = ?
        """, (status if not error else f"failed: {error}", plan_id))
        
        conn.commit()
        conn.close()
    
    def _notify_dashboard(self, event: Dict[str, Any]):
        """Send notification to ARCHON dashboard"""
        try:
            requests.post(
                f"{self.archon_api}/api/archon/telemetry",
                json=event,
                timeout=5
            )
        except Exception as e:
            logger.warning(f"Dashboard notification failed: {e}")
    
    def run_decision_cycle(self, plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Complete decision cycle: evaluate → approve → trigger
        """
        logger.info("=" * 50)
        logger.info("Starting decision cycle")
        logger.info("=" * 50)
        
        # Step 1: Evaluate plan
        evaluation = self.evaluate_plan(plan)
        
        # Step 2: Trigger if approved
        if evaluation['approved']:
            trigger_result = self.trigger_pipeline(plan, evaluation)
            evaluation['trigger_result'] = trigger_result
        else:
            evaluation['trigger_result'] = {'success': False, 'reason': 'Plan not approved'}
        
        logger.info("Decision cycle complete")
        return evaluation


# CLI Interface
if __name__ == "__main__":
    import sys
    
    supervisor = SupervisorEngine()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "status":
            status = supervisor.get_ai_pool_status()
            print(json.dumps(status, indent=2))
            
        elif command == "test":
            # Run test decision cycle
            test_plan = {
                "plan_id": f"test-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "type": "build",
                "target": "production",
                "actions": ["build", "test", "deploy"],
                "ai_contributions": {
                    "gpt4o": 0.4,
                    "claude": 0.3,
                    "gemini": 0.2,
                    "deepseek": 0.1
                }
            }
            result = supervisor.run_decision_cycle(test_plan)
            print(json.dumps(result, indent=2))
    else:
        print("ARCHON Supervisor Engine")
        print("Usage: python supervisor.py [status|test]")
