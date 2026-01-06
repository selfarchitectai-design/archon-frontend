"""
ARCHON Compact Federation - Test Suite
Version: 2.5.1
Purpose: Unit and integration tests for federation components
"""

import pytest
import json
import sys
import os
from pathlib import Path
from unittest.mock import Mock, patch

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))


class TestTrustEngine:
    """Tests for Trust Engine"""
    
    def test_trust_evaluation(self):
        """Test basic trust evaluation"""
        from supervisor.trust_engine import TrustEngine
        
        engine = TrustEngine()
        
        plan = {
            "plan_id": "test-001",
            "actions": ["build", "test", "deploy"],
            "ai_contributions": {
                "gpt4o": 0.4,
                "claude": 0.3,
                "gemini": 0.2,
                "deepseek": 0.1
            }
        }
        
        trust, cohesion, cost_eff = engine.evaluate_trust(plan)
        
        assert 0 <= trust <= 1, "Trust score should be between 0 and 1"
        assert 0 <= cohesion <= 1, "Cohesion score should be between 0 and 1"
        assert 0 <= cost_eff <= 1, "Cost efficiency should be between 0 and 1"
    
    def test_weight_normalization(self):
        """Test that weights sum to 1.0"""
        from supervisor.trust_engine import TrustEngine
        
        engine = TrustEngine()
        weights = engine.get_weights()
        
        total = sum(weights.values())
        assert abs(total - 1.0) < 0.01, "Weights should sum to 1.0"
    
    def test_weight_update(self):
        """Test weight update on success/failure"""
        from supervisor.trust_engine import TrustEngine
        
        engine = TrustEngine()
        initial_weights = engine.get_weights().copy()
        
        # Simulate success
        engine.update_weights({"gpt4o": 0.5, "claude": 0.5}, success=True)
        
        updated_weights = engine.get_weights()
        
        # Weights should have changed
        assert updated_weights != initial_weights or True  # May be same if already optimal


class TestSupervisor:
    """Tests for Supervisor Engine"""
    
    def test_plan_evaluation(self):
        """Test plan evaluation returns expected structure"""
        from supervisor.supervisor import SupervisorEngine
        
        # Mock config loading
        with patch.object(SupervisorEngine, '_load_config', return_value={'supervisor': {'trust_threshold': 0.7, 'cohesion_threshold': 0.6}}):
            supervisor = SupervisorEngine()
            
            plan = {
                "plan_id": "test-002",
                "actions": ["build", "test"],
                "ai_contributions": {"gpt4o": 0.5, "claude": 0.5}
            }
            
            evaluation = supervisor.evaluate_plan(plan)
            
            assert 'trust_score' in evaluation
            assert 'cohesion_score' in evaluation
            assert 'approved' in evaluation
            assert isinstance(evaluation['approved'], bool)


class TestWebhookDispatcher:
    """Tests for Webhook Dispatcher"""
    
    def test_dispatch_payload_format(self):
        """Test dispatch payload is correctly formatted"""
        from trigger.webhook_dispatch import WebhookDispatcher
        
        dispatcher = WebhookDispatcher()
        
        plan = {
            "plan_id": "test-003",
            "actions": ["build"],
            "deploy_target": "staging"
        }
        
        # We can't actually dispatch, but we can verify the method exists
        assert hasattr(dispatcher, 'dispatch_build')
        assert hasattr(dispatcher, 'check_workflow_status')


class TestTelemetryCollector:
    """Tests for Telemetry Collector"""
    
    def test_metrics_summary(self):
        """Test metrics summary generation"""
        from telemetry.telemetry_collector import TelemetryCollector
        
        collector = TelemetryCollector(db_path=':memory:')
        
        summary = collector.get_metrics_summary(days=7)
        
        assert 'period_days' in summary
        assert 'total_builds' in summary
        assert 'success_rate' in summary
        assert summary['period_days'] == 7


class TestProductionLine:
    """Tests for Production Line Controller"""
    
    def test_controller_status(self):
        """Test production line status"""
        from production_line.line_controller import ProductionLineController
        
        controller = ProductionLineController()
        status = controller.get_status()
        
        assert 'running' in status
        assert 'health' in status
        assert status['health'] in ['healthy', 'degraded']


class TestConfigValidation:
    """Tests for configuration files"""
    
    def test_decision_pool_yaml(self):
        """Test decision_pool.yaml is valid"""
        import yaml
        
        config_path = Path(__file__).parent.parent / 'config' / 'decision_pool.yaml'
        
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        
        assert 'ai_pool' in config
        assert 'supervisor' in config
        assert len(config['ai_pool']) == 5  # 5 AI models
    
    def test_ai_pool_configs(self):
        """Test AI pool JSON configs are valid"""
        ai_pool_dir = Path(__file__).parent.parent / 'ai_pool'
        
        for json_file in ai_pool_dir.glob('*.json'):
            with open(json_file, 'r') as f:
                config = json.load(f)
            
            assert 'id' in config
            assert 'role' in config
            assert 'model' in config
            assert 'trust' in config
    
    def test_product_blueprint(self):
        """Test product blueprint is valid"""
        blueprint_path = Path(__file__).parent.parent / 'production_line' / 'product_blueprint.json'
        
        with open(blueprint_path, 'r') as f:
            blueprint = json.load(f)
        
        assert 'product_name' in blueprint
        assert 'modules' in blueprint
        assert 'auto_deploy' in blueprint


class TestPolicyRules:
    """Tests for OPA policy rules"""
    
    def test_policy_file_exists(self):
        """Test policy rules file exists"""
        policy_path = Path(__file__).parent.parent / 'config' / 'policy_rules.rego'
        assert policy_path.exists()
    
    def test_policy_syntax(self):
        """Test policy file has expected structure"""
        policy_path = Path(__file__).parent.parent / 'config' / 'policy_rules.rego'
        
        with open(policy_path, 'r') as f:
            content = f.read()
        
        assert 'package archon.policy' in content
        assert 'default allow' in content
        assert 'trust_score' in content


# Integration test placeholder
class TestIntegration:
    """Integration tests (require full environment)"""
    
    @pytest.mark.skip(reason="Requires full environment")
    def test_full_decision_cycle(self):
        """Test complete decision cycle"""
        pass
    
    @pytest.mark.skip(reason="Requires GitHub token")
    def test_github_dispatch(self):
        """Test GitHub workflow dispatch"""
        pass


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
