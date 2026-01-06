"""
ARCHON Compact Federation - Webhook Dispatch
Version: 2.5.1
Purpose: Triggers GitHub MCP build pipeline via repository dispatch
"""

import json
import requests
import os
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger('ARCHON.Trigger')


class WebhookDispatcher:
    """
    Dispatches build triggers to GitHub Actions via repository_dispatch
    """
    
    def __init__(self):
        self.github_token = os.environ.get('GITHUB_TOKEN')
        self.github_repo = os.environ.get('GITHUB_REPO', 'selfarchitectai-design/archon-frontend')
        self.archon_api = os.environ.get('ARCHON_API_URL', 'https://www.selfarchitectai.com')
        
        # Also support deploy bridge
        self.deploy_bridge_repo = 'selfarchitectai-design/archon-deploy-bridge'
        
        self.headers = {
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {self.github_token}",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
        logger.info("Webhook Dispatcher initialized")
    
    def dispatch_build(self, plan: Dict[str, Any], use_bridge: bool = True) -> Dict[str, Any]:
        """
        Dispatch build trigger to GitHub
        
        Args:
            plan: The approved plan to execute
            use_bridge: If True, use archon-deploy-bridge for safer deploys
        """
        repo = self.deploy_bridge_repo if use_bridge else self.github_repo
        url = f"https://api.github.com/repos/{repo}/dispatches"
        
        payload = {
            "event_type": "archon_build_trigger",
            "client_payload": {
                "plan_id": plan.get('plan_id', f"plan-{datetime.now().strftime('%Y%m%d%H%M%S')}"),
                "trust_score": plan.get('trust_score', 0.75),
                "cohesion_score": plan.get('cohesion_score', 0.7),
                "triggered_by": plan.get('triggered_by', 'Supervisor'),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "actions": plan.get('actions', ['build', 'test', 'deploy']),
                "deploy_target": plan.get('deploy_target', 'production'),
                "ai_contributions": plan.get('ai_contributions', {})
            }
        }
        
        logger.info(f"Dispatching to {repo}...")
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            
            if response.status_code == 204:
                result = {
                    'success': True,
                    'message': 'Build triggered successfully',
                    'repository': repo,
                    'plan_id': payload['client_payload']['plan_id'],
                    'timestamp': payload['client_payload']['timestamp']
                }
                logger.info(f"✅ Dispatch successful: {result['plan_id']}")
                
                # Log to ARCHON
                self._log_trigger(result)
                
                return result
            else:
                error = f"Dispatch failed: {response.status_code} - {response.text}"
                logger.error(error)
                return {'success': False, 'error': error}
                
        except Exception as e:
            error = f"Dispatch exception: {str(e)}"
            logger.error(error)
            return {'success': False, 'error': error}
    
    def dispatch_workflow(self, workflow_file: str, inputs: Dict[str, str] = None) -> Dict[str, Any]:
        """
        Dispatch a specific workflow file with inputs
        """
        repo = self.deploy_bridge_repo
        url = f"https://api.github.com/repos/{repo}/actions/workflows/{workflow_file}/dispatches"
        
        payload = {
            "ref": "main",
            "inputs": inputs or {
                "deploy_target": "production",
                "triggered_by": "ARCHON-Federation",
                "description": "Auto deploy via ARCHON Compact Federation"
            }
        }
        
        logger.info(f"Dispatching workflow: {workflow_file}")
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            
            if response.status_code == 204:
                result = {
                    'success': True,
                    'workflow': workflow_file,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }
                logger.info(f"✅ Workflow dispatch successful")
                return result
            else:
                error = f"Workflow dispatch failed: {response.status_code}"
                logger.error(error)
                return {'success': False, 'error': error}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def check_workflow_status(self, run_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Check status of workflow runs
        """
        repo = self.deploy_bridge_repo
        
        if run_id:
            url = f"https://api.github.com/repos/{repo}/actions/runs/{run_id}"
        else:
            url = f"https://api.github.com/repos/{repo}/actions/runs?per_page=5"
        
        try:
            response = requests.get(url, headers=self.headers)
            
            if response.ok:
                data = response.json()
                
                if run_id:
                    return {
                        'success': True,
                        'run': {
                            'id': data['id'],
                            'status': data['status'],
                            'conclusion': data.get('conclusion'),
                            'created_at': data['created_at']
                        }
                    }
                else:
                    runs = data.get('workflow_runs', [])
                    return {
                        'success': True,
                        'runs': [
                            {
                                'id': r['id'],
                                'name': r['name'],
                                'status': r['status'],
                                'conclusion': r.get('conclusion'),
                                'created_at': r['created_at']
                            }
                            for r in runs[:5]
                        ]
                    }
            else:
                return {'success': False, 'error': response.text}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    def _log_trigger(self, result: Dict[str, Any]):
        """Log trigger event to ARCHON dashboard"""
        try:
            requests.post(
                f"{self.archon_api}/api/archon/telemetry",
                json={
                    'event': 'build_triggered',
                    'source': 'federation_dispatcher',
                    **result
                },
                timeout=5
            )
        except Exception as e:
            logger.warning(f"Failed to log trigger: {e}")


class N8NTrigger:
    """
    Alternative trigger via N8N webhook
    """
    
    def __init__(self):
        self.n8n_url = os.environ.get('N8N_WEBHOOK_URL', 'https://n8n.selfarchitectai.com/webhook')
        self.n8n_key = os.environ.get('N8N_API_KEY')
    
    def trigger_workflow(self, workflow_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger N8N workflow"""
        url = f"{self.n8n_url}/{workflow_id}"
        
        try:
            response = requests.post(
                url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=30
            )
            
            if response.ok:
                return {'success': True, 'response': response.json()}
            else:
                return {'success': False, 'error': response.text}
                
        except Exception as e:
            return {'success': False, 'error': str(e)}


def dispatch_trigger(final_plan: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main dispatch function - called by Supervisor
    """
    dispatcher = WebhookDispatcher()
    return dispatcher.dispatch_build(final_plan, use_bridge=True)


# CLI Interface
if __name__ == "__main__":
    import sys
    
    dispatcher = WebhookDispatcher()
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "status":
            result = dispatcher.check_workflow_status()
            print(json.dumps(result, indent=2))
            
        elif command == "trigger":
            test_plan = {
                "plan_id": f"cli-{datetime.now().strftime('%Y%m%d%H%M%S')}",
                "actions": ["build", "test", "deploy"],
                "deploy_target": "production",
                "triggered_by": "CLI"
            }
            result = dispatcher.dispatch_build(test_plan)
            print(json.dumps(result, indent=2))
            
        elif command == "workflow":
            result = dispatcher.dispatch_workflow("vercel-deploy.yml", {
                "deploy_target": "production",
                "triggered_by": "ARCHON-CLI",
                "description": "CLI trigger test"
            })
            print(json.dumps(result, indent=2))
    else:
        print("ARCHON Webhook Dispatcher")
        print("Usage: python webhook_dispatch.py [status|trigger|workflow]")
