"""
ARCHON Compact Federation - Trust Engine
Version: 2.5.1
Purpose: Evaluates AI output trust, cohesion, and cost efficiency
"""

import json
import sqlite3
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Tuple, List
from pathlib import Path

logger = logging.getLogger('ARCHON.TrustEngine')


class TrustEngine:
    """
    Trust evaluation engine for AI decision pool
    Calculates trust scores based on historical performance and output quality
    """
    
    def __init__(self, db_path: str = None):
        self.db_path = db_path or Path(__file__).parent.parent / 'telemetry' / 'memory_store.sqlite'
        
        # Default trust weights (can be updated dynamically)
        self.default_weights = {
            'gpt4o': 0.30,
            'gpt5': 0.15,
            'gemini': 0.20,
            'claude': 0.20,
            'deepseek': 0.15
        }
        
        # Performance history (loaded from DB)
        self.performance_history = {}
        self._load_history()
        
        logger.info("Trust Engine initialized")
    
    def _load_history(self):
        """Load performance history from database"""
        try:
            if Path(self.db_path).exists():
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                cursor.execute("""
                    SELECT ai_id, 
                           AVG(CASE WHEN success = 1 THEN 1.0 ELSE 0.0 END) as success_rate,
                           AVG(latency_ms) as avg_latency,
                           COUNT(*) as total_tasks
                    FROM ai_performance
                    GROUP BY ai_id
                """)
                
                for row in cursor.fetchall():
                    self.performance_history[row[0]] = {
                        'success_rate': row[1] or 0.5,
                        'avg_latency': row[2] or 1000,
                        'total_tasks': row[3] or 0
                    }
                
                conn.close()
        except Exception as e:
            logger.warning(f"Could not load history: {e}")
    
    def evaluate_trust(self, plan: Dict[str, Any]) -> Tuple[float, float, float]:
        """
        Evaluate trust score for a plan
        Returns: (trust_score, cohesion_score, cost_efficiency)
        """
        # Get AI contributions from plan
        ai_contributions = plan.get('ai_contributions', {})
        
        # Calculate weighted trust score
        trust_score = self._calculate_trust_score(ai_contributions)
        
        # Calculate cohesion (how well AI outputs align)
        cohesion_score = self._calculate_cohesion(plan)
        
        # Calculate cost efficiency
        cost_efficiency = self._calculate_cost_efficiency(plan)
        
        logger.info(f"Trust evaluation: trust={trust_score:.2f}, cohesion={cohesion_score:.2f}, cost_eff={cost_efficiency:.2f}")
        
        return trust_score, cohesion_score, cost_efficiency
    
    def _calculate_trust_score(self, ai_contributions: Dict[str, float]) -> float:
        """
        Calculate weighted trust score based on AI contributions and history
        """
        if not ai_contributions:
            return 0.75  # Default trust for plans without contribution data
        
        total_score = 0.0
        total_weight = 0.0
        
        for ai_id, contribution in ai_contributions.items():
            # Base trust from default weights
            base_trust = self.default_weights.get(ai_id, 0.1)
            
            # Historical performance modifier
            history = self.performance_history.get(ai_id, {})
            success_rate = history.get('success_rate', 0.5)
            
            # Calculate AI-specific trust
            ai_trust = base_trust * (0.5 + 0.5 * success_rate)
            
            # Weight by contribution
            total_score += ai_trust * contribution
            total_weight += contribution
        
        if total_weight > 0:
            return min(1.0, total_score / total_weight)
        return 0.75
    
    def _calculate_cohesion(self, plan: Dict[str, Any]) -> float:
        """
        Calculate how well different AI outputs align with each other
        Higher cohesion = AI models agree on approach
        """
        # Check for conflicting signals in plan
        conflicts = 0
        alignments = 0
        
        actions = plan.get('actions', [])
        
        # Simple heuristic: check action consistency
        if 'build' in actions and 'test' in actions and 'deploy' in actions:
            alignments += 3  # Standard pipeline is coherent
        
        if 'rollback' in actions and 'deploy' in actions:
            conflicts += 1  # Conflicting signals
        
        # Check AI contribution distribution
        contributions = plan.get('ai_contributions', {})
        if contributions:
            values = list(contributions.values())
            variance = sum((v - sum(values)/len(values))**2 for v in values) / len(values)
            if variance < 0.05:
                alignments += 2  # Balanced contribution is good
        
        # Calculate cohesion score
        total_signals = conflicts + alignments + 1  # +1 to avoid division by zero
        cohesion = alignments / total_signals
        
        # Apply baseline
        return max(0.5, min(1.0, 0.6 + cohesion * 0.4))
    
    def _calculate_cost_efficiency(self, plan: Dict[str, Any]) -> float:
        """
        Calculate cost efficiency of the plan
        """
        estimated_cost = plan.get('estimated_cost', 0.5)
        estimated_value = plan.get('estimated_value', 1.0)
        
        if estimated_cost <= 0:
            return 1.0
        
        efficiency = min(1.0, estimated_value / (estimated_cost * 2))
        return max(0.3, efficiency)
    
    def update_weights(self, ai_contributions: Dict[str, float], success: bool):
        """
        Update AI trust weights based on build outcome
        """
        if not ai_contributions:
            return
        
        # Learning rate
        alpha = 0.1 if success else 0.15  # Learn faster from failures
        
        for ai_id, contribution in ai_contributions.items():
            if ai_id in self.default_weights:
                current = self.default_weights[ai_id]
                
                if success:
                    # Increase weight for contributing AIs on success
                    adjustment = alpha * contribution * 0.05
                    self.default_weights[ai_id] = min(0.4, current + adjustment)
                else:
                    # Decrease weight on failure
                    adjustment = alpha * contribution * 0.1
                    self.default_weights[ai_id] = max(0.05, current - adjustment)
        
        # Normalize weights to sum to 1.0
        self._normalize_weights()
        
        logger.info(f"Updated weights: {self.default_weights}")
    
    def _normalize_weights(self):
        """Normalize weights to sum to 1.0"""
        total = sum(self.default_weights.values())
        if total > 0:
            for ai_id in self.default_weights:
                self.default_weights[ai_id] /= total
    
    def get_weights(self) -> Dict[str, float]:
        """Get current trust weights"""
        return self.default_weights.copy()
    
    def set_weights(self, weights: Dict[str, float]):
        """Set trust weights (used by GPT-5 optimizer)"""
        self.default_weights = weights.copy()
        self._normalize_weights()
    
    def generate_trust_report(self) -> Dict[str, Any]:
        """Generate comprehensive trust report"""
        report = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'current_weights': self.default_weights,
            'performance_history': self.performance_history,
            'recommendations': []
        }
        
        # Generate recommendations
        for ai_id, weight in self.default_weights.items():
            history = self.performance_history.get(ai_id, {})
            success_rate = history.get('success_rate', 0.5)
            
            if success_rate < 0.6 and weight > 0.15:
                report['recommendations'].append({
                    'ai_id': ai_id,
                    'action': 'reduce_weight',
                    'reason': f'Low success rate ({success_rate:.2%}) with high weight ({weight:.2%})'
                })
            elif success_rate > 0.9 and weight < 0.25:
                report['recommendations'].append({
                    'ai_id': ai_id,
                    'action': 'increase_weight',
                    'reason': f'High success rate ({success_rate:.2%}) with low weight ({weight:.2%})'
                })
        
        return report


class PolicyValidator:
    """
    Validates plans against OPA policies
    """
    
    def __init__(self, policy_path: str = '../config/policy_rules.rego'):
        self.policy_path = policy_path
    
    def validate(self, plan: Dict[str, Any], evaluation: Dict[str, Any]) -> Tuple[bool, List[str]]:
        """
        Validate plan against policies
        Returns: (is_valid, list_of_violations)
        """
        violations = []
        
        # Trust threshold check
        if evaluation.get('trust_score', 0) < 0.7:
            violations.append("Trust score below threshold (0.7)")
        
        # Cohesion threshold check
        if evaluation.get('cohesion_score', 0) < 0.6:
            violations.append("Cohesion score below threshold (0.6)")
        
        # Check for unsafe actions
        actions = plan.get('actions', [])
        unsafe_actions = ['delete_all', 'drop_database', 'disable_security']
        for action in actions:
            if action in unsafe_actions:
                violations.append(f"Unsafe action detected: {action}")
        
        # Check source
        source = plan.get('source', '')
        valid_sources = ['GPT-5', 'Claude', 'Supervisor', 'system', 'GPT-4o']
        if source and source not in valid_sources:
            violations.append(f"Invalid source: {source}")
        
        is_valid = len(violations) == 0
        return is_valid, violations


# Standalone test
if __name__ == "__main__":
    engine = TrustEngine()
    
    # Test evaluation
    test_plan = {
        "plan_id": "test-001",
        "actions": ["build", "test", "deploy"],
        "ai_contributions": {
            "gpt4o": 0.4,
            "claude": 0.3,
            "gemini": 0.2,
            "deepseek": 0.1
        },
        "estimated_cost": 0.5,
        "estimated_value": 2.0
    }
    
    trust, cohesion, cost_eff = engine.evaluate_trust(test_plan)
    print(f"Trust Score: {trust:.2f}")
    print(f"Cohesion Score: {cohesion:.2f}")
    print(f"Cost Efficiency: {cost_eff:.2f}")
    
    # Generate report
    report = engine.generate_trust_report()
    print(json.dumps(report, indent=2))
