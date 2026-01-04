# Lambda Bridge: Vercel Deploy Light
# ARCHON V3.6 Dual-AI Architecture
# GPT-5 controlled deployment with Claude wake-on-event

import json
import os
import requests
from datetime import datetime, timezone
from typing import Optional, Dict, Any

# Configuration
VERCEL_TOKEN = os.environ.get('VERCEL_TOKEN', 'yYAXPpzetqNFiQvXYzyxdf6N')
TEAM_ID = os.environ.get('VERCEL_TEAM_ID', 'team_1ObevaGr4rOEodjKXBbPrsLN')
PROJECT_ID = os.environ.get('VERCEL_PROJECT_ID', 'prj_OguVxu6oPwGbcIwwEtYq6JkSNj2s')
ARCHON_API = os.environ.get('ARCHON_API', 'https://www.selfarchitectai.com')
N8N_WEBHOOK = os.environ.get('N8N_WEBHOOK', 'https://n8n.selfarchitectai.com/webhook')

class DeploymentManager:
    """Handles Vercel deployments triggered by GPT-5"""
    
    def __init__(self):
        self.vercel_api = "https://api.vercel.com"
        self.headers = {
            "Authorization": f"Bearer {VERCEL_TOKEN}",
            "Content-Type": "application/json"
        }
    
    def deploy_light(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        GPT-5 approved lightweight deployment
        Claude is NOT invoked for standard deploys
        """
        if not payload.get("approved"):
            return {
                "success": False,
                "error": "Deployment not approved",
                "claude_invoked": False
            }
        
        try:
            # Create deployment via Vercel API
            deploy_data = {
                "name": "archon-frontend",
                "project": PROJECT_ID,
                "target": payload.get("build_target", "production"),
                "gitSource": {
                    "type": "github",
                    "repoId": "1118487516",
                    "ref": payload.get("branch", "main")
                }
            }
            
            response = requests.post(
                f"{self.vercel_api}/v13/deployments?teamId={TEAM_ID}",
                headers=self.headers,
                json=deploy_data
            )
            
            log = {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": response.status_code,
                "triggered_by": payload.get("source", "GPT-5"),
                "claude_invoked": False,  # Light deploy doesn't need Claude
                "deployment_id": response.json().get("id") if response.ok else None
            }
            
            # Send log to ARCHON monitor
            self._send_to_monitor(log)
            
            return {
                "success": response.ok,
                "status_code": response.status_code,
                "deployment": response.json() if response.ok else None,
                "error": response.text if not response.ok else None,
                "claude_invoked": False,
                "log": log
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "claude_invoked": False
            }
    
    def trigger_claude_deploy(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Complex deployment that requires Claude intervention
        Only called when GPT-5 determines Claude is needed
        """
        claude_trigger_payload = {
            "trigger": "claude_deploy_handler",
            "source": "GPT-5",
            "payload": {
                "approved": True,
                "build_target": payload.get("build_target", "vercel"),
                "snapshot_id": f"auto-{datetime.now().strftime('%Y-%m-%d-%H:%M')}",
                "trust_score": payload.get("trust_score", 1.0),
                "complexity": "high"
            }
        }
        
        try:
            response = requests.post(
                f"{ARCHON_API}/api/claude/trigger",
                headers={
                    "Content-Type": "application/json",
                    "x-archon-key": os.environ.get('ARCHON_LAMBDA_KEY', 'archon_cgpt_cf42eb69efc09a13e937e6d2374c0eb7')
                },
                json=claude_trigger_payload
            )
            
            return {
                "success": response.ok,
                "claude_invoked": True,
                "response": response.json() if response.ok else None,
                "error": response.text if not response.ok else None
            }
            
        except Exception as e:
            return {
                "success": False,
                "claude_invoked": True,
                "error": str(e)
            }
    
    def check_deployment_status(self, deployment_id: str) -> Dict[str, Any]:
        """Check status of a deployment"""
        try:
            response = requests.get(
                f"{self.vercel_api}/v13/deployments/{deployment_id}?teamId={TEAM_ID}",
                headers=self.headers
            )
            
            if response.ok:
                data = response.json()
                return {
                    "success": True,
                    "id": data.get("id"),
                    "state": data.get("readyState"),
                    "url": data.get("url"),
                    "created": data.get("createdAt"),
                    "target": data.get("target")
                }
            else:
                return {"success": False, "error": response.text}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_latest_deployments(self, limit: int = 5) -> Dict[str, Any]:
        """Get recent deployments"""
        try:
            response = requests.get(
                f"{self.vercel_api}/v6/deployments?projectId={PROJECT_ID}&teamId={TEAM_ID}&limit={limit}",
                headers=self.headers
            )
            
            if response.ok:
                data = response.json()
                return {
                    "success": True,
                    "deployments": [
                        {
                            "id": d.get("uid"),
                            "state": d.get("state"),
                            "url": d.get("url"),
                            "created": d.get("created"),
                            "target": d.get("target")
                        }
                        for d in data.get("deployments", [])
                    ]
                }
            else:
                return {"success": False, "error": response.text}
                
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _send_to_monitor(self, log: Dict[str, Any]) -> None:
        """Send deployment log to ARCHON monitor"""
        try:
            requests.post(
                f"{ARCHON_API}/api/archon/trust/log",
                json=log,
                timeout=5
            )
        except Exception:
            pass  # Non-critical, don't fail deployment


class HealthChecker:
    """System health monitoring"""
    
    @staticmethod
    def check_all() -> Dict[str, Any]:
        """Comprehensive health check"""
        checks = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {}
        }
        
        # Check Vercel
        try:
            r = requests.get(
                f"https://api.vercel.com/v9/projects/{PROJECT_ID}?teamId={TEAM_ID}",
                headers={"Authorization": f"Bearer {VERCEL_TOKEN}"},
                timeout=10
            )
            checks["services"]["vercel"] = {
                "status": "healthy" if r.ok else "degraded",
                "response_time_ms": r.elapsed.total_seconds() * 1000
            }
        except Exception as e:
            checks["services"]["vercel"] = {"status": "error", "error": str(e)}
        
        # Check N8N
        try:
            r = requests.get(f"{N8N_WEBHOOK}/health", timeout=10)
            checks["services"]["n8n"] = {
                "status": "healthy" if r.ok else "degraded",
                "response_time_ms": r.elapsed.total_seconds() * 1000
            }
        except Exception:
            checks["services"]["n8n"] = {"status": "unknown"}
        
        # Check ARCHON API
        try:
            r = requests.get(f"{ARCHON_API}/api/archon/trust", timeout=10)
            checks["services"]["archon_api"] = {
                "status": "healthy" if r.ok else "degraded",
                "response_time_ms": r.elapsed.total_seconds() * 1000
            }
        except Exception as e:
            checks["services"]["archon_api"] = {"status": "error", "error": str(e)}
        
        # Calculate overall health
        statuses = [s.get("status") for s in checks["services"].values()]
        if all(s == "healthy" for s in statuses):
            checks["overall_status"] = "healthy"
        elif any(s == "error" for s in statuses):
            checks["overall_status"] = "critical"
        else:
            checks["overall_status"] = "degraded"
        
        return checks


# Lambda Handler
def handler(event, context=None):
    """
    AWS Lambda handler for ARCHON V3.6
    Routes requests to appropriate handlers
    """
    try:
        # Parse request
        if isinstance(event, str):
            body = json.loads(event)
        elif 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        action = body.get('action', 'health')
        
        dm = DeploymentManager()
        
        # Route to appropriate handler
        handlers = {
            'deploy_light': lambda: dm.deploy_light(body.get('payload', {})),
            'deploy_claude': lambda: dm.trigger_claude_deploy(body.get('payload', {})),
            'status': lambda: dm.check_deployment_status(body.get('deployment_id', '')),
            'list': lambda: dm.get_latest_deployments(body.get('limit', 5)),
            'health': lambda: HealthChecker.check_all()
        }
        
        if action not in handlers:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': f'Unknown action: {action}'})
            }
        
        result = handlers[action]()
        
        return {
            'statusCode': 200 if result.get('success', True) else 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-ARCHON-Version': '3.6'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


# For local testing
if __name__ == "__main__":
    # Test health check
    result = handler({'action': 'health'})
    print(json.dumps(json.loads(result['body']), indent=2))
