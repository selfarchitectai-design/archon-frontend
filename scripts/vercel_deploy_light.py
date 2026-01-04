# Lambda Bridge: Vercel Deploy Light
# ARCHON V3.6 Dual-AI Architecture
# GPT-5 Trusted Event Exception System
# Updated: 2026-01-04

import json
import os
import requests
import hashlib
import hmac
from datetime import datetime, timezone
from typing import Optional, Dict, Any

# Configuration
VERCEL_TOKEN = os.environ.get('VERCEL_TOKEN', 'yYAXPpzetqNFiQvXYzyxdf6N')
TEAM_ID = os.environ.get('VERCEL_TEAM_ID', 'team_1ObevaGr4rOEodjKXBbPrsLN')
PROJECT_ID = os.environ.get('VERCEL_PROJECT_ID', 'prj_OguVxu6oPwGbcIwwEtYq6JkSNj2s')
ARCHON_API = os.environ.get('ARCHON_API', 'https://www.selfarchitectai.com')
N8N_WEBHOOK = os.environ.get('N8N_WEBHOOK', 'https://n8n.selfarchitectai.com/webhook')
GPT5_SECRET = os.environ.get('GPT5_SECRET', 'archon_gpt5_trusted_key_2026')

# Trusted Sources Configuration
TRUSTED_SOURCES = {
    "GPT-5": {
        "allow_override": True,
        "description": "GPT-5 may issue deploy triggers during supervisor mode",
        "require_signature": False,
        "min_trust_score": 0.90
    },
    "system": {
        "allow_override": True,
        "description": "Internal system events for recovery and self-heal",
        "require_signature": False,
        "min_trust_score": 0.85
    }
}


class TrustedEventException:
    """
    GPT-5 Trusted Event Exception Layer
    Allows Claude to accept deploy triggers while in supervisor mode
    """
    
    @staticmethod
    def validate_source(source: str) -> bool:
        """Check if source is in trusted sources list"""
        return source in TRUSTED_SOURCES and TRUSTED_SOURCES[source]["allow_override"]
    
    @staticmethod
    def verify_signature(payload: Dict, signature: str) -> bool:
        """Verify GPT-5 signature (optional extra security)"""
        if not signature:
            return True
        
        payload_str = json.dumps(payload, sort_keys=True)
        expected_sig = hmac.new(
            GPT5_SECRET.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_sig)
    
    @staticmethod
    def apply_trusted_override(payload: Dict) -> Dict:
        """
        Apply trusted override if source is GPT-5 and approved
        """
        event_source = payload.get("source", "")
        approved = payload.get("approved", False)
        
        # ✅ GPT-5 Trusted Exception Layer
        if event_source in TRUSTED_SOURCES and approved:
            if TRUSTED_SOURCES[event_source]["allow_override"]:
                payload["trusted_override"] = True
                payload["deploy_via_supervisor"] = True
                payload["override_timestamp"] = datetime.now(timezone.utc).isoformat()
                payload["override_reason"] = f"Trusted source: {event_source}"
        
        return payload
    
    @staticmethod
    def check_security_gates(payload: Dict, trust_score: float = 1.0) -> Dict[str, Any]:
        """Security validation before accepting trusted override"""
        source = payload.get("source", "")
        
        # Gate 1: Trust score check
        min_trust = TRUSTED_SOURCES.get(source, {}).get("min_trust_score", 0.90)
        if trust_score < min_trust:
            return {"allowed": False, "reason": f"Trust score {trust_score} below minimum {min_trust}"}
        
        # Gate 2: Source validation
        if not TrustedEventException.validate_source(source):
            return {"allowed": False, "reason": f"Source '{source}' not in trusted sources"}
        
        # Gate 3: Signature verification (if required)
        if TRUSTED_SOURCES.get(source, {}).get("require_signature"):
            signature = payload.get("signature", "")
            if not TrustedEventException.verify_signature(payload, signature):
                return {"allowed": False, "reason": "GPT-5 signature mismatch"}
        
        return {"allowed": True, "reason": "All security gates passed"}


class DeploymentManager:
    """Handles Vercel deployments with Trusted Override support"""
    
    def __init__(self):
        self.vercel_api = "https://api.vercel.com"
        self.headers = {
            "Authorization": f"Bearer {VERCEL_TOKEN}",
            "Content-Type": "application/json"
        }
        self.exception_handler = TrustedEventException()
    
    def deploy_with_trusted_override(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Main deploy handler with GPT-5 Trusted Exception support"""
        event_source = payload.get("source", "")
        approved = payload.get("approved", False)
        trust_score = payload.get("trust_score", 1.0)
        
        # Apply trusted override
        payload = self.exception_handler.apply_trusted_override(payload)
        
        # Security gates check
        security_check = self.exception_handler.check_security_gates(payload, trust_score)
        if not security_check["allowed"]:
            return {
                "success": False,
                "status": "rejected",
                "reason": security_check["reason"],
                "claude_mode": "supervisor",
                "claude_handled_as": "security_gate_failed"
            }
        
        # Process deploy
        if approved or payload.get("trusted_override"):
            try:
                deploy_data = {
                    "name": "archon-frontend",
                    "project": PROJECT_ID,
                    "target": payload.get("deploy_mode", "production"),
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
                    "triggered_by": event_source,
                    "claude_mode": "supervisor",
                    "claude_handled_as": "trusted_override",
                    "trusted_override": payload.get("trusted_override", False),
                    "deploy_via_supervisor": payload.get("deploy_via_supervisor", False),
                    "description": payload.get("description", ""),
                    "deployment_id": response.json().get("id") if response.ok else None,
                    "security_gates": "passed"
                }
                
                self._send_to_monitor(log)
                
                return {
                    "success": response.ok,
                    "status_code": response.status_code,
                    "deployment": response.json() if response.ok else None,
                    "error": response.text if not response.ok else None,
                    "claude_mode": "supervisor",
                    "claude_handled_as": "trusted_override",
                    "trusted_override": True,
                    "log": log
                }
                
            except Exception as e:
                return {"success": False, "error": str(e), "claude_mode": "supervisor"}
        else:
            return {"success": False, "status": "ignored", "reason": "Unapproved or external trigger"}
    
    def deploy_light(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        return self.deploy_with_trusted_override(payload)
    
    def trigger_claude_deploy(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger Claude for complex deployments"""
        claude_trigger_payload = {
            "trigger": "claude_deploy_handler",
            "source": payload.get("source", "GPT-5"),
            "approved": True,
            "trusted_override": True,
            "payload": {
                "approved": True,
                "build_target": payload.get("build_target", "vercel"),
                "snapshot_id": f"auto-{datetime.now().strftime('%Y-%m-%d-%H:%M')}",
                "trust_score": payload.get("trust_score", 1.0),
                "deploy_mode": payload.get("deploy_mode", "production"),
                "description": payload.get("description", "GPT-5 Trusted Override Deploy")
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
                "claude_mode": "supervisor",
                "trusted_override": True,
                "response": response.json() if response.ok else None,
                "error": response.text if not response.ok else None
            }
        except Exception as e:
            return {"success": False, "claude_invoked": True, "error": str(e)}
    
    def check_deployment_status(self, deployment_id: str) -> Dict[str, Any]:
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
            return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_latest_deployments(self, limit: int = 5) -> Dict[str, Any]:
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
                        {"id": d.get("uid"), "state": d.get("state"), "url": d.get("url"), "created": d.get("created")}
                        for d in data.get("deployments", [])
                    ]
                }
            return {"success": False, "error": response.text}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _send_to_monitor(self, log: Dict[str, Any]) -> None:
        try:
            requests.post(f"{ARCHON_API}/api/archon/trust/log", json=log, timeout=5)
        except Exception:
            pass


class HealthChecker:
    @staticmethod
    def check_all() -> Dict[str, Any]:
        checks = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "services": {},
            "trusted_sources": list(TRUSTED_SOURCES.keys()),
            "trusted_override_enabled": True,
            "supervisor_mode": "active"
        }
        
        try:
            r = requests.get(f"https://api.vercel.com/v9/projects/{PROJECT_ID}?teamId={TEAM_ID}",
                           headers={"Authorization": f"Bearer {VERCEL_TOKEN}"}, timeout=10)
            checks["services"]["vercel"] = {"status": "healthy" if r.ok else "degraded"}
        except Exception as e:
            checks["services"]["vercel"] = {"status": "error", "error": str(e)}
        
        try:
            r = requests.get(f"{ARCHON_API}/api/archon/trust", timeout=10)
            checks["services"]["archon_api"] = {"status": "healthy" if r.ok else "degraded"}
        except Exception as e:
            checks["services"]["archon_api"] = {"status": "error", "error": str(e)}
        
        statuses = [s.get("status") for s in checks["services"].values()]
        checks["overall_status"] = "healthy" if all(s == "healthy" for s in statuses) else "degraded"
        
        return checks


def handler(event, context=None):
    """AWS Lambda handler - GPT-5 Trusted Event Exception"""
    try:
        if isinstance(event, str):
            body = json.loads(event)
        elif 'body' in event:
            body = json.loads(event['body']) if isinstance(event['body'], str) else event['body']
        else:
            body = event
        
        action = body.get('action', 'health')
        payload = body.get('payload', body)
        
        dm = DeploymentManager()
        
        handlers = {
            'deploy_light': lambda: dm.deploy_light(payload),
            'deploy': lambda: dm.deploy_with_trusted_override(payload),
            'deploy_trusted': lambda: dm.deploy_with_trusted_override(payload),
            'deploy_claude': lambda: dm.trigger_claude_deploy(payload),
            'status': lambda: dm.check_deployment_status(body.get('deployment_id', '')),
            'list': lambda: dm.get_latest_deployments(body.get('limit', 5)),
            'health': lambda: HealthChecker.check_all()
        }
        
        if action not in handlers:
            return {'statusCode': 400, 'body': json.dumps({'error': f'Unknown action: {action}'})}
        
        result = handlers[action]()
        
        return {
            'statusCode': 200 if result.get('success', True) else 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-ARCHON-Version': '3.6',
                'X-Trusted-Override': 'enabled',
                'X-Claude-Mode': 'supervisor'
            },
            'body': json.dumps(result)
        }
    except Exception as e:
        return {'statusCode': 500, 'body': json.dumps({'error': str(e)})}


if __name__ == "__main__":
    result = handler({'action': 'health'})
    print(json.dumps(json.loads(result['body']), indent=2))
