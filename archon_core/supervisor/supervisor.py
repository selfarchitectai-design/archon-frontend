#!/usr/bin/env python3
"""
ARCHON Compact Federation - Supervisor Engine
Version: 2.5.1
Purpose: Central orchestration, trust evaluation, and pipeline triggering

The Supervisor is the brain of ARCHON - it:
1. Receives plans from AI Decision Pool
2. Evaluates trust, cohesion, and cost efficiency
3. Approves or rejects plans
4. Triggers build pipeline via webhook
5. Logs decisions and updates memory
"""

import json
import sqlite3
import requests
import os
import yaml
import hashlib
from datetime import datetime, timezone
from typing import Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# Import trust engine
from trust_engine import TrustEngine, TrustScore

# ================================
# CONFIGURATION
# ================================

class Config:
    """Supervisor configuration loaded from decision_pool.yaml"""
    
    def __init__(self, config_path: str = "../config/decision_pool.yaml"):
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.supervisor = self.config.get('supervisor', {})
        self.executor = self.config.get('executor', {})
        self.trigger = self.config.get('trigger', {})
        
        # Thresholds
        self.trust_threshold = self.supervisor.get('trust_threshold', 0.70)
        self.cohesion_threshold = self.supervisor.get('cohesion_threshold', 0.60)
        self.cost_threshold = self.supervisor.get('cost_efficiency_threshold', 0.50)
        
        # Database
        self.memory_db = self.supervisor.get('memory_db', 'telemetry/memory_store.sqlite')
        
        # Trigger
        self.github_dispatch_url = self.trigger.get('github_dispatch_url', '')


class DecisionStatus(Enum):
    """Decision status enumeration"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    EXECUTING = "executing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Decision:
    """Represents a decision made by the Supervisor"""
    id: str
    timestamp: str
    source: str
    plan: Dict[str, Any]
    trust_score: float
    cohesion_score: float
    cost_efficiency: float
    status: DecisionStatus
    reason: str = ""
    build_id: Optional[str] = None


# ================================
# SUPERVISOR ENGINE
# ================================

class SupervisorEngine:
    """
    ARCHON Supervisor Engine
    Central orchestration and decision-making component
    """
    
    def __init__(self, config_path: str = "../config/decision_pool.yaml"):
        self.config = Config(config_path)
        self.trust_engine = TrustEngine()
        self._init_database()
        
        # Load secrets from environment or AWS
        self.github_token = os.environ.get('GITHUB_TOKEN', '')
        self.archon_api_url = os.environ.get('ARCHON_API_URL', 'https://www.selfarchitectai.com')
    
    def _init_database(self):
        """Initialize SQLite database for decision logging"""
        db_path = os.path.join(os.path.dirname(__file__), '..', self.config.memory_db)
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        self.conn = sqlite3.connect(db_path)
        cursor = self.conn.cursor()
        
        # Create decisions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS decisions (
                id TEXT PRIMARY KEY,
                timestamp TEXT NOT NULL,
                source TEXT NOT NULL,
                plan TEXT NOT NULL,
                trust_score REAL NOT NULL,
                cohesion_score REAL NOT NULL,
                cost_efficiency REAL NOT NULL,
                status TEXT NOT NULL,
                reason TEXT,
                build_id TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Create telemetry table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                decision_id TEXT,
                build_status TEXT,
                latency_ms REAL,
                token_usage INTEGER,
                cost_usd REAL,
                error_count INTEGER DEFAULT 0,
                metadata TEXT,
                FOREIGN KEY (decision_id) REFERENCES decisions(id)
            )
        """)
        
        # Create AI weights history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_weights_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp TEXT NOT NULL,
                ai_id TEXT NOT NULL,
                old_weight REAL,
                new_weight REAL,
                reason TEXT
            )
        """)
        
        self.conn.commit()
    
    def _generate_decision_id(self, plan: Dict) -> str:
        """Generate unique decision ID"""
        content = json.dumps(plan, sort_keys=True) + datetime.now(timezone.utc).isoformat()
        return f"dec-{hashlib.sha256(content.encode()).hexdigest()[:12]}"
    
    def evaluate_plan(self, plan: Dict[str, Any], source: str) -> Decision:
        """
        Evaluate a plan from the AI Decision Pool
        
        Args:
            plan: The plan to evaluate (from GPT-4o, Claude, etc.)
            source: The AI that generated the plan
            
        Returns:
            Decision object with evaluation results
        """
        decision_id = self._generate_decision_id(plan)
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Get trust scores from trust engine
        trust_score = self.trust_engine.evaluate_trust(plan, source)
        cohesion_score = self.trust_engine.evaluate_cohesion(plan)
        cost_efficiency = self.trust_engine.evaluate_cost_efficiency(plan)
        
        print(f"\n{'='*50}")
        print(f"🧠 SUPERVISOR EVALUATION")
        print(f"{'='*50}")
        print(f"Decision ID: {decision_id}")
        print(f"Source: {source}")
        print(f"Trust Score: {trust_score:.2f} (threshold: {self.config.trust_threshold})")
        print(f"Cohesion Score: {cohesion_score:.2f} (threshold: {self.config.cohesion_threshold})")
        print(f"Cost Efficiency: {cost_efficiency:.2f} (threshold: {self.config.cost_threshold})")
        
        # Determine if plan is approved
        if (trust_score >= self.config.trust_threshold and 
            cohesion_score >= self.config.cohesion_threshold):
            status = DecisionStatus.APPROVED
            reason = "All thresholds met"
            print(f"✅ APPROVED: {reason}")
        else:
            status = DecisionStatus.REJECTED
            reasons = []
            if trust_score < self.config.trust_threshold:
                reasons.append(f"trust_score {trust_score:.2f} < {self.config.trust_threshold}")
            if cohesion_score < self.config.cohesion_threshold:
                reasons.append(f"cohesion_score {cohesion_score:.2f} < {self.config.cohesion_threshold}")
            reason = "; ".join(reasons)
            print(f"⚠️ REJECTED: {reason}")
        
        decision = Decision(
            id=decision_id,
            timestamp=timestamp,
            source=source,
            plan=plan,
            trust_score=trust_score,
            cohesion_score=cohesion_score,
            cost_efficiency=cost_efficiency,
            status=status,
            reason=reason
        )
        
        # Log decision
        self._log_decision(decision)
        
        return decision
    
    def _log_decision(self, decision: Decision):
        """Log decision to SQLite database"""
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO decisions (id, timestamp, source, plan, trust_score, 
                                   cohesion_score, cost_efficiency, status, reason, build_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            decision.id,
            decision.timestamp,
            decision.source,
            json.dumps(decision.plan),
            decision.trust_score,
            decision.cohesion_score,
            decision.cost_efficiency,
            decision.status.value,
            decision.reason,
            decision.build_id
        ))
        self.conn.commit()
    
    def trigger_pipeline(self, decision: Decision) -> Dict[str, Any]:
        """
        Trigger the build pipeline via GitHub Actions webhook
        
        Args:
            decision: Approved decision to execute
            
        Returns:
            Trigger result with status
        """
        if decision.status != DecisionStatus.APPROVED:
            return {
                "success": False,
                "error": f"Cannot trigger pipeline for {decision.status.value} decision"
            }
        
        print(f"\n🚀 Triggering build pipeline for decision {decision.id}")
        
        # Update decision status
        decision.status = DecisionStatus.EXECUTING
        self._update_decision_status(decision.id, DecisionStatus.EXECUTING)
        
        # Prepare payload for GitHub Actions
        payload = {
            "ref": "main",
            "inputs": {
                "deploy_target": "production",
                "triggered_by": f"supervisor-{decision.source}",
                "description": f"ARCHON Build: {decision.id}",
                "decision_id": decision.id,
                "trust_score": str(decision.trust_score)
            }
        }
        
        try:
            # Trigger GitHub Actions workflow
            response = requests.post(
                self.config.config['trigger']['github_dispatch_url'],
                headers={
                    "Accept": "application/vnd.github+json",
                    "Authorization": f"Bearer {self.github_token}"
                },
                json=payload,
                timeout=30
            )
            
            if response.status_code == 204:
                print("✅ Pipeline triggered successfully")
                
                # Notify ARCHON dashboard
                self._notify_dashboard(decision, "pipeline_triggered")
                
                return {
                    "success": True,
                    "decision_id": decision.id,
                    "status": "triggered",
                    "message": "Build pipeline started"
                }
            else:
                print(f"❌ Pipeline trigger failed: {response.status_code}")
                decision.status = DecisionStatus.FAILED
                self._update_decision_status(decision.id, DecisionStatus.FAILED)
                
                return {
                    "success": False,
                    "error": f"GitHub API returned {response.status_code}",
                    "response": response.text
                }
                
        except Exception as e:
            print(f"❌ Pipeline trigger error: {e}")
            decision.status = DecisionStatus.FAILED
            self._update_decision_status(decision.id, DecisionStatus.FAILED)
            
            return {
                "success": False,
                "error": str(e)
            }
    
    def _update_decision_status(self, decision_id: str, status: DecisionStatus):
        """Update decision status in database"""
        cursor = self.conn.cursor()
        cursor.execute(
            "UPDATE decisions SET status = ? WHERE id = ?",
            (status.value, decision_id)
        )
        self.conn.commit()
    
    def _notify_dashboard(self, decision: Decision, event: str):
        """Send notification to ARCHON dashboard"""
        try:
            requests.post(
                f"{self.archon_api_url}/api/archon/trust/log",
                json={
                    "event": event,
                    "decision_id": decision.id,
                    "source": decision.source,
                    "trust_score": decision.trust_score,
                    "status": decision.status.value,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                timeout=5
            )
        except Exception as e:
            print(f"Warning: Failed to notify dashboard: {e}")
    
    def process_telemetry(self, telemetry_data: Dict[str, Any]):
        """
        Process telemetry data from completed builds
        
        Args:
            telemetry_data: Build results and metrics
        """
        print(f"\n📊 Processing telemetry data")
        
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO telemetry (timestamp, decision_id, build_status, 
                                   latency_ms, token_usage, cost_usd, error_count, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now(timezone.utc).isoformat(),
            telemetry_data.get('decision_id'),
            telemetry_data.get('build_status'),
            telemetry_data.get('latency_ms'),
            telemetry_data.get('token_usage'),
            telemetry_data.get('cost_usd'),
            telemetry_data.get('error_count', 0),
            json.dumps(telemetry_data.get('metadata', {}))
        ))
        self.conn.commit()
        
        # Update decision status based on telemetry
        decision_id = telemetry_data.get('decision_id')
        if decision_id:
            build_status = telemetry_data.get('build_status')
            if build_status == 'success':
                self._update_decision_status(decision_id, DecisionStatus.COMPLETED)
            elif build_status == 'failed':
                self._update_decision_status(decision_id, DecisionStatus.FAILED)
        
        # Trigger trust weight updates if needed
        self.trust_engine.update_weights_from_telemetry(telemetry_data)
    
    def get_recent_decisions(self, limit: int = 10) -> list:
        """Get recent decisions from database"""
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT id, timestamp, source, trust_score, status, reason
            FROM decisions
            ORDER BY created_at DESC
            LIMIT ?
        """, (limit,))
        
        return [
            {
                "id": row[0],
                "timestamp": row[1],
                "source": row[2],
                "trust_score": row[3],
                "status": row[4],
                "reason": row[5]
            }
            for row in cursor.fetchall()
        ]
    
    def get_system_health(self) -> Dict[str, Any]:
        """Get overall system health status"""
        cursor = self.conn.cursor()
        
        # Get recent success rate
        cursor.execute("""
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful
            FROM decisions
            WHERE created_at > datetime('now', '-24 hours')
        """)
        row = cursor.fetchone()
        total, successful = row[0] or 0, row[1] or 0
        success_rate = successful / total if total > 0 else 1.0
        
        # Get average trust score
        cursor.execute("""
            SELECT AVG(trust_score)
            FROM decisions
            WHERE created_at > datetime('now', '-24 hours')
        """)
        avg_trust = cursor.fetchone()[0] or 0.75
        
        return {
            "status": "healthy" if success_rate >= 0.8 else "degraded",
            "success_rate_24h": success_rate,
            "total_decisions_24h": total,
            "successful_builds_24h": successful,
            "average_trust_score": avg_trust,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    
    def close(self):
        """Close database connection"""
        self.conn.close()


# ================================
# MAIN EXECUTION
# ================================

def main():
    """Main execution for testing"""
    supervisor = SupervisorEngine()
    
    # Example plan from GPT-4o
    sample_plan = {
        "task": "deploy_update",
        "description": "Deploy new dashboard component",
        "files_modified": ["app/components/NewPanel.tsx"],
        "estimated_tokens": 1500,
        "estimated_cost": 0.05,
        "risk_level": "low"
    }
    
    # Evaluate the plan
    decision = supervisor.evaluate_plan(sample_plan, source="gpt4o")
    
    # If approved, trigger pipeline
    if decision.status == DecisionStatus.APPROVED:
        result = supervisor.trigger_pipeline(decision)
        print(f"\nTrigger result: {json.dumps(result, indent=2)}")
    
    # Get system health
    health = supervisor.get_system_health()
    print(f"\nSystem Health: {json.dumps(health, indent=2)}")
    
    supervisor.close()


if __name__ == "__main__":
    main()
