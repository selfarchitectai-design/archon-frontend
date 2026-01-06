#!/usr/bin/env python3
"""
ARCHON Compact Federation - Trust Engine
Version: 2.5.1
Purpose: Evaluate trust, cohesion, and cost efficiency of AI outputs

The Trust Engine provides:
1. Trust score calculation based on AI source and plan quality
2. Cohesion score for multi-AI agreement
3. Cost efficiency estimation
4. Dynamic weight adjustment based on historical performance
"""

import json
import sqlite3
import os
import yaml
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from dataclasses import dataclass
from collections import defaultdict


@dataclass
class TrustScore:
    """Trust score components"""
    overall: float
    source_trust: float
    content_trust: float
    historical_trust: float


@dataclass
class AIPerformance:
    """AI model performance metrics"""
    ai_id: str
    success_rate: float
    avg_latency_ms: float
    total_builds: int
    successful_builds: int
    current_weight: float


class TrustEngine:
    """
    ARCHON Trust Engine
    Evaluates and manages trust scores for AI decision pool
    """
    
    # Base trust weights for each AI model
    BASE_WEIGHTS = {
        "gpt4o": 0.30,
        "gpt5": 0.15,
        "gemini": 0.20,
        "claude": 0.20,
        "deepseek": 0.15
    }
    
    # Trust modifiers based on plan characteristics
    TRUST_MODIFIERS = {
        "low_risk": 0.10,
        "medium_risk": 0.00,
        "high_risk": -0.15,
        "tested_code": 0.05,
        "documentation": 0.03,
        "error_handling": 0.05
    }
    
    def __init__(self, db_path: str = "../telemetry/memory_store.sqlite"):
        self.db_path = os.path.join(os.path.dirname(__file__), '..', 'telemetry', 'memory_store.sqlite')
        self.weights = self.BASE_WEIGHTS.copy()
        self._load_dynamic_weights()
    
    def _load_dynamic_weights(self):
        """Load weights from database if available"""
        try:
            if os.path.exists(self.db_path):
                conn = sqlite3.connect(self.db_path)
                cursor = conn.cursor()
                
                # Check if weights table exists
                cursor.execute("""
                    SELECT name FROM sqlite_master 
                    WHERE type='table' AND name='ai_weights'
                """)
                
                if cursor.fetchone():
                    cursor.execute("SELECT ai_id, weight FROM ai_weights")
                    for row in cursor.fetchall():
                        if row[0] in self.weights:
                            self.weights[row[0]] = row[1]
                
                conn.close()
        except Exception as e:
            print(f"Warning: Could not load dynamic weights: {e}")
    
    def evaluate_trust(self, plan: Dict[str, Any], source: str) -> float:
        """
        Calculate overall trust score for a plan
        
        Args:
            plan: The plan to evaluate
            source: The AI model that generated the plan
            
        Returns:
            Trust score between 0.0 and 1.0
        """
        # Source trust (based on AI model weight)
        source_trust = self._get_source_trust(source)
        
        # Content trust (based on plan quality)
        content_trust = self._evaluate_content_trust(plan)
        
        # Historical trust (based on past performance)
        historical_trust = self._get_historical_trust(source)
        
        # Weighted combination
        overall = (
            source_trust * 0.35 +
            content_trust * 0.40 +
            historical_trust * 0.25
        )
        
        # Clamp to valid range
        return max(0.0, min(1.0, overall))
    
    def _get_source_trust(self, source: str) -> float:
        """Get base trust score for AI source"""
        # Convert weight to trust score (normalize to 0-1)
        base_weight = self.weights.get(source, 0.10)
        # Scale weight to trust score (max weight 0.30 -> trust 0.85)
        return 0.55 + (base_weight * 1.0)
    
    def _evaluate_content_trust(self, plan: Dict[str, Any]) -> float:
        """Evaluate trust based on plan content"""
        trust = 0.70  # Base content trust
        
        # Risk level modifier
        risk_level = plan.get('risk_level', 'medium').lower()
        trust += self.TRUST_MODIFIERS.get(f"{risk_level}_risk", 0)
        
        # Quality indicators
        if plan.get('has_tests', False):
            trust += self.TRUST_MODIFIERS['tested_code']
        
        if plan.get('has_documentation', False):
            trust += self.TRUST_MODIFIERS['documentation']
        
        if plan.get('has_error_handling', False):
            trust += self.TRUST_MODIFIERS['error_handling']
        
        # Complexity penalty
        estimated_tokens = plan.get('estimated_tokens', 0)
        if estimated_tokens > 10000:
            trust -= 0.05
        elif estimated_tokens > 50000:
            trust -= 0.10
        
        # Cost penalty for expensive operations
        estimated_cost = plan.get('estimated_cost', 0)
        if estimated_cost > 1.0:
            trust -= 0.05
        elif estimated_cost > 5.0:
            trust -= 0.10
        
        return max(0.0, min(1.0, trust))
    
    def _get_historical_trust(self, source: str) -> float:
        """Get historical trust based on past performance"""
        try:
            if not os.path.exists(self.db_path):
                return 0.75  # Default historical trust
            
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get success rate for this AI
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful
                FROM decisions
                WHERE source = ?
                AND created_at > datetime('now', '-30 days')
            """, (source,))
            
            row = cursor.fetchone()
            conn.close()
            
            total, successful = row[0] or 0, row[1] or 0
            if total == 0:
                return 0.75  # Default if no history
            
            success_rate = successful / total
            # Convert to trust score (50% success = 0.6 trust, 100% = 0.95)
            return 0.45 + (success_rate * 0.50)
            
        except Exception as e:
            print(f"Warning: Could not get historical trust: {e}")
            return 0.75
    
    def evaluate_cohesion(self, plan: Dict[str, Any]) -> float:
        """
        Evaluate cohesion score - how well the plan aligns with system goals
        
        Args:
            plan: The plan to evaluate
            
        Returns:
            Cohesion score between 0.0 and 1.0
        """
        cohesion = 0.75  # Base cohesion
        
        # Check for required fields
        required_fields = ['task', 'description']
        for field in required_fields:
            if field in plan:
                cohesion += 0.05
        
        # Check for clear objectives
        if plan.get('objectives'):
            cohesion += 0.05
        
        # Check for success criteria
        if plan.get('success_criteria'):
            cohesion += 0.05
        
        # Check for rollback plan
        if plan.get('rollback_plan'):
            cohesion += 0.05
        
        # Penalty for unclear plans
        description = plan.get('description', '')
        if len(description) < 20:
            cohesion -= 0.10
        
        return max(0.0, min(1.0, cohesion))
    
    def evaluate_cost_efficiency(self, plan: Dict[str, Any]) -> float:
        """
        Evaluate cost efficiency of the plan
        
        Args:
            plan: The plan to evaluate
            
        Returns:
            Cost efficiency score between 0.0 and 1.0
        """
        efficiency = 0.80  # Base efficiency
        
        # Token cost efficiency
        estimated_tokens = plan.get('estimated_tokens', 1000)
        if estimated_tokens < 500:
            efficiency += 0.10
        elif estimated_tokens < 2000:
            efficiency += 0.05
        elif estimated_tokens > 10000:
            efficiency -= 0.10
        elif estimated_tokens > 50000:
            efficiency -= 0.20
        
        # Dollar cost efficiency
        estimated_cost = plan.get('estimated_cost', 0.1)
        if estimated_cost < 0.10:
            efficiency += 0.10
        elif estimated_cost < 0.50:
            efficiency += 0.05
        elif estimated_cost > 2.0:
            efficiency -= 0.10
        elif estimated_cost > 5.0:
            efficiency -= 0.20
        
        # Time efficiency
        estimated_time = plan.get('estimated_time_seconds', 60)
        if estimated_time < 30:
            efficiency += 0.05
        elif estimated_time > 300:
            efficiency -= 0.05
        elif estimated_time > 600:
            efficiency -= 0.10
        
        return max(0.0, min(1.0, efficiency))
    
    def update_weights_from_telemetry(self, telemetry: Dict[str, Any]):
        """
        Update AI weights based on telemetry data
        
        Args:
            telemetry: Build telemetry data
        """
        decision_id = telemetry.get('decision_id')
        if not decision_id:
            return
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get source AI for this decision
            cursor.execute(
                "SELECT source FROM decisions WHERE id = ?",
                (decision_id,)
            )
            row = cursor.fetchone()
            if not row:
                conn.close()
                return
            
            source = row[0]
            build_status = telemetry.get('build_status', 'unknown')
            
            # Calculate weight adjustment
            if build_status == 'success':
                adjustment = 0.01  # Small increase on success
            elif build_status == 'failed':
                adjustment = -0.02  # Larger decrease on failure
            else:
                adjustment = 0.0
            
            if adjustment != 0 and source in self.weights:
                old_weight = self.weights[source]
                new_weight = max(0.05, min(0.50, old_weight + adjustment))
                self.weights[source] = new_weight
                
                # Log weight change
                cursor.execute("""
                    INSERT INTO ai_weights_history (timestamp, ai_id, old_weight, new_weight, reason)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    datetime.now(timezone.utc).isoformat(),
                    source,
                    old_weight,
                    new_weight,
                    f"Telemetry update: {build_status}"
                ))
                
                # Update or insert current weight
                cursor.execute("""
                    INSERT OR REPLACE INTO ai_weights (ai_id, weight, updated_at)
                    VALUES (?, ?, ?)
                """, (source, new_weight, datetime.now(timezone.utc).isoformat()))
                
                conn.commit()
                print(f"📊 Weight updated for {source}: {old_weight:.3f} → {new_weight:.3f}")
            
            conn.close()
            
        except Exception as e:
            print(f"Warning: Could not update weights: {e}")
    
    def get_ai_performance(self, ai_id: str) -> AIPerformance:
        """
        Get performance metrics for an AI model
        
        Args:
            ai_id: AI model identifier
            
        Returns:
            AIPerformance object
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get performance stats
            cursor.execute("""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful
                FROM decisions
                WHERE source = ?
            """, (ai_id,))
            
            row = cursor.fetchone()
            total, successful = row[0] or 0, row[1] or 0
            success_rate = successful / total if total > 0 else 0.0
            
            # Get average latency from telemetry
            cursor.execute("""
                SELECT AVG(latency_ms)
                FROM telemetry t
                JOIN decisions d ON t.decision_id = d.id
                WHERE d.source = ?
            """, (ai_id,))
            avg_latency = cursor.fetchone()[0] or 0.0
            
            conn.close()
            
            return AIPerformance(
                ai_id=ai_id,
                success_rate=success_rate,
                avg_latency_ms=avg_latency,
                total_builds=total,
                successful_builds=successful,
                current_weight=self.weights.get(ai_id, 0.10)
            )
            
        except Exception as e:
            print(f"Warning: Could not get AI performance: {e}")
            return AIPerformance(
                ai_id=ai_id,
                success_rate=0.0,
                avg_latency_ms=0.0,
                total_builds=0,
                successful_builds=0,
                current_weight=self.weights.get(ai_id, 0.10)
            )
    
    def get_all_weights(self) -> Dict[str, float]:
        """Get current weights for all AI models"""
        return self.weights.copy()
    
    def normalize_weights(self):
        """Normalize weights to sum to 1.0"""
        total = sum(self.weights.values())
        if total > 0:
            self.weights = {k: v/total for k, v in self.weights.items()}


# ================================
# STANDALONE TESTING
# ================================

def test_trust_engine():
    """Test the trust engine"""
    engine = TrustEngine()
    
    # Test plan
    plan = {
        "task": "deploy_update",
        "description": "Deploy new feature to production dashboard",
        "risk_level": "low",
        "estimated_tokens": 2000,
        "estimated_cost": 0.08,
        "has_tests": True,
        "has_documentation": True,
        "objectives": ["Add new panel", "Update styling"],
        "success_criteria": ["All tests pass", "No regression"]
    }
    
    print("Testing Trust Engine")
    print("=" * 50)
    
    for source in ["gpt4o", "claude", "gemini", "deepseek", "gpt5"]:
        trust = engine.evaluate_trust(plan, source)
        print(f"{source}: Trust Score = {trust:.3f}")
    
    print(f"\nCohesion Score: {engine.evaluate_cohesion(plan):.3f}")
    print(f"Cost Efficiency: {engine.evaluate_cost_efficiency(plan):.3f}")
    print(f"\nCurrent Weights: {engine.get_all_weights()}")


if __name__ == "__main__":
    test_trust_engine()
