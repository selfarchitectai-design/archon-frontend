#!/usr/bin/env python3
"""
ARCHON Compact Federation - Webhook Dispatch
Version: 2.5.1
Purpose: Trigger GitHub Actions workflows via webhook dispatch

This module handles:
1. Dispatching build triggers to GitHub MCP
2. Managing trigger cooldowns
3. Logging trigger events
4. Retry logic for failed triggers
"""

import json
import requests
import os
import time
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from dataclasses import dataclass
import sqlite3


@dataclass
class TriggerResult:
    """Result of a trigger operation"""
    success: bool
    status_code: int
    message: str
    timestamp: str
    decision_id: Optional[str] = None
    retry_count: int = 0


class WebhookDispatcher:
    """
    Webhook dispatcher for GitHub Actions
    Triggers build pipelines based on Supervisor decisions
    """
    
    # GitHub API endpoints
    GITHUB_API_BASE = "https://api.github.com"
    
    # Cooldown settings
    DEFAULT_COOLDOWN_SECONDS = 300  # 5 minutes
    MAX_RETRIES = 3
    RETRY_DELAY_SECONDS = 30
    
    def __init__(self):
        self.github_token = os.environ.get('GITHUB_TOKEN', '')
        self.repo = os.environ.get('GITHUB_REPO', 'selfarchitectai-design/archon-frontend')
        self.deploy_bridge_repo = os.environ.get('GITHUB_DEPLOY_BRIDGE_REPO', 
                                                  'selfarchitectai-design/archon-deploy-bridge')
        self.archon_api_url = os.environ.get('ARCHON_API_URL', 'https://www.selfarchitectai.com')
        
        self.last_trigger_time = 0
        self.cooldown_seconds = self.DEFAULT_COOLDOWN_SECONDS
    
    def dispatch_build(self, 
                       decision_id: str,
                       plan: Dict[str, Any],
                       source: str,
                       trust_score: float) -> TriggerResult:
        """
        Dispatch a build trigger to GitHub Actions
        
        Args:
            decision_id: Supervisor decision ID
            plan: Build plan details
            source: AI source that generated the plan
            trust_score: Trust score from supervisor
            
        Returns:
            TriggerResult with operation status
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        # Check cooldown
        if not self._check_cooldown():
            remaining = self.cooldown_seconds - (time.time() - self.last_trigger_time)
            return TriggerResult(
                success=False,
                status_code=429,
                message=f"Cooldown active. {remaining:.0f}s remaining.",
                timestamp=timestamp,
                decision_id=decision_id
            )
        
        print(f"\n🚀 Dispatching build trigger")
        print(f"   Decision ID: {decision_id}")
        print(f"   Source: {source}")
        print(f"   Trust Score: {trust_score:.3f}")
        
        # Prepare dispatch payload
        payload = {
            "ref": "main",
            "inputs": {
                "deploy_target": plan.get('deploy_target', 'production'),
                "triggered_by": f"archon-supervisor-{source}",
                "description": plan.get('description', f'ARCHON Build {decision_id}'),
                "decision_id": decision_id,
                "trust_score": str(trust_score)
            }
        }
        
        # Try to dispatch with retries
        result = self._dispatch_with_retry(payload, decision_id)
        
        if result.success:
            self.last_trigger_time = time.time()
            self._log_trigger(decision_id, source, trust_score, "success")
            self._notify_dashboard(decision_id, "build_triggered", {"source": source})
        else:
            self._log_trigger(decision_id, source, trust_score, "failed", result.message)
        
        return result
    
    def _dispatch_with_retry(self, payload: Dict, decision_id: str) -> TriggerResult:
        """Dispatch with retry logic"""
        last_error = ""
        
        for attempt in range(self.MAX_RETRIES):
            try:
                # Use deploy bridge for workflow dispatch
                url = f"{self.GITHUB_API_BASE}/repos/{self.deploy_bridge_repo}/actions/workflows/vercel-deploy.yml/dispatches"
                
                response = requests.post(
                    url,
                    headers={
                        "Accept": "application/vnd.github+json",
                        "Authorization": f"Bearer {self.github_token}",
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 204:
                    return TriggerResult(
                        success=True,
                        status_code=204,
                        message="Build triggered successfully",
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        decision_id=decision_id,
                        retry_count=attempt
                    )
                elif response.status_code == 422:
                    # Validation error - don't retry
                    return TriggerResult(
                        success=False,
                        status_code=response.status_code,
                        message=f"Validation error: {response.text}",
                        timestamp=datetime.now(timezone.utc).isoformat(),
                        decision_id=decision_id,
                        retry_count=attempt
                    )
                else:
                    last_error = f"HTTP {response.status_code}: {response.text}"
                    print(f"   Attempt {attempt + 1} failed: {last_error}")
                    
            except requests.exceptions.Timeout:
                last_error = "Request timeout"
                print(f"   Attempt {attempt + 1} timeout")
            except requests.exceptions.RequestException as e:
                last_error = str(e)
                print(f"   Attempt {attempt + 1} error: {e}")
            
            # Wait before retry (unless last attempt)
            if attempt < self.MAX_RETRIES - 1:
                time.sleep(self.RETRY_DELAY_SECONDS)
        
        return TriggerResult(
            success=False,
            status_code=500,
            message=f"All {self.MAX_RETRIES} attempts failed. Last error: {last_error}",
            timestamp=datetime.now(timezone.utc).isoformat(),
            decision_id=decision_id,
            retry_count=self.MAX_RETRIES
        )
    
    def dispatch_repository_event(self, event_type: str, payload: Dict) -> TriggerResult:
        """
        Dispatch a repository_dispatch event
        
        Args:
            event_type: Event type (e.g., 'archon_build_trigger')
            payload: Client payload to send
            
        Returns:
            TriggerResult
        """
        timestamp = datetime.now(timezone.utc).isoformat()
        
        url = f"{self.GITHUB_API_BASE}/repos/{self.repo}/dispatches"
        
        data = {
            "event_type": event_type,
            "client_payload": payload
        }
        
        try:
            response = requests.post(
                url,
                headers={
                    "Accept": "application/vnd.github.everest-preview+json",
                    "Authorization": f"Bearer {self.github_token}"
                },
                json=data,
                timeout=30
            )
            
            if response.status_code == 204:
                return TriggerResult(
                    success=True,
                    status_code=204,
                    message=f"Repository dispatch '{event_type}' triggered",
                    timestamp=timestamp
                )
            else:
                return TriggerResult(
                    success=False,
                    status_code=response.status_code,
                    message=f"Dispatch failed: {response.text}",
                    timestamp=timestamp
                )
                
        except Exception as e:
            return TriggerResult(
                success=False,
                status_code=500,
                message=str(e),
                timestamp=timestamp
            )
    
    def _check_cooldown(self) -> bool:
        """Check if cooldown period has passed"""
        elapsed = time.time() - self.last_trigger_time
        return elapsed >= self.cooldown_seconds
    
    def _log_trigger(self, decision_id: str, source: str, trust_score: float, 
                     status: str, error: str = ""):
        """Log trigger event to database"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 
                                   'telemetry', 'memory_store.sqlite')
            
            if not os.path.exists(db_path):
                return
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            # Ensure triggers table exists
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS triggers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp TEXT NOT NULL,
                    decision_id TEXT,
                    source TEXT,
                    trust_score REAL,
                    status TEXT,
                    error TEXT
                )
            """)
            
            cursor.execute("""
                INSERT INTO triggers (timestamp, decision_id, source, trust_score, status, error)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                datetime.now(timezone.utc).isoformat(),
                decision_id,
                source,
                trust_score,
                status,
                error
            ))
            
            conn.commit()
            conn.close()
            
        except Exception as e:
            print(f"Warning: Could not log trigger: {e}")
    
    def _notify_dashboard(self, decision_id: str, event: str, metadata: Dict = None):
        """Notify ARCHON dashboard of trigger event"""
        try:
            requests.post(
                f"{self.archon_api_url}/api/archon/trust/log",
                json={
                    "event": event,
                    "decision_id": decision_id,
                    "metadata": metadata or {},
                    "timestamp": datetime.now(timezone.utc).isoformat()
                },
                timeout=5
            )
        except Exception as e:
            print(f"Warning: Could not notify dashboard: {e}")
    
    def get_trigger_history(self, limit: int = 10) -> list:
        """Get recent trigger history"""
        try:
            db_path = os.path.join(os.path.dirname(__file__), '..', 
                                   'telemetry', 'memory_store.sqlite')
            
            if not os.path.exists(db_path):
                return []
            
            conn = sqlite3.connect(db_path)
            cursor = conn.cursor()
            
            cursor.execute("""
                SELECT timestamp, decision_id, source, trust_score, status, error
                FROM triggers
                ORDER BY id DESC
                LIMIT ?
            """, (limit,))
            
            history = [
                {
                    "timestamp": row[0],
                    "decision_id": row[1],
                    "source": row[2],
                    "trust_score": row[3],
                    "status": row[4],
                    "error": row[5]
                }
                for row in cursor.fetchall()
            ]
            
            conn.close()
            return history
            
        except Exception as e:
            print(f"Warning: Could not get trigger history: {e}")
            return []
    
    def set_cooldown(self, seconds: int):
        """Set custom cooldown period"""
        self.cooldown_seconds = max(0, seconds)
    
    def get_status(self) -> Dict[str, Any]:
        """Get dispatcher status"""
        elapsed = time.time() - self.last_trigger_time if self.last_trigger_time > 0 else float('inf')
        cooldown_remaining = max(0, self.cooldown_seconds - elapsed)
        
        return {
            "ready": cooldown_remaining == 0,
            "cooldown_remaining_seconds": cooldown_remaining,
            "last_trigger_time": datetime.fromtimestamp(self.last_trigger_time, timezone.utc).isoformat() 
                                 if self.last_trigger_time > 0 else None,
            "cooldown_period_seconds": self.cooldown_seconds,
            "github_repo": self.repo,
            "deploy_bridge_repo": self.deploy_bridge_repo
        }


# ================================
# MAIN EXECUTION
# ================================

def main():
    """Test webhook dispatcher"""
    dispatcher = WebhookDispatcher()
    
    print("ARCHON Webhook Dispatcher Test")
    print("=" * 50)
    
    # Get status
    status = dispatcher.get_status()
    print(f"\nDispatcher Status: {json.dumps(status, indent=2)}")
    
    # Test dispatch (dry run without actual trigger)
    test_plan = {
        "deploy_target": "production",
        "description": "Test build from webhook dispatcher"
    }
    
    print("\n[DRY RUN] Would dispatch build with:")
    print(f"  Decision ID: test-decision-001")
    print(f"  Source: gpt4o")
    print(f"  Trust Score: 0.85")
    print(f"  Plan: {test_plan}")
    
    # Uncomment to actually trigger:
    # result = dispatcher.dispatch_build(
    #     decision_id="test-decision-001",
    #     plan=test_plan,
    #     source="gpt4o",
    #     trust_score=0.85
    # )
    # print(f"\nResult: {result}")


if __name__ == "__main__":
    main()
