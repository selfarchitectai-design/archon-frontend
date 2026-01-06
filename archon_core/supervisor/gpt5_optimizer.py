#!/usr/bin/env python3
"""
ARCHON GPT-5 Optimization Scheduler
Version: 2.5.1
Purpose: Weekly meta-strategic optimization of AI model weights

GPT-5 analyzes:
1. Build success patterns
2. AI model performance
3. Cost efficiency trends
4. Latency patterns

Outputs:
- Updated decision_pool.yaml
- Optimization report
- Weight adjustment recommendations
"""

import os
import json
import yaml
import requests
import sqlite3
from datetime import datetime, timezone, timedelta
from typing import Dict, Any, List, Optional

class GPT5Optimizer:
    """
    ARCHON GPT-5 Meta-Strategic Optimizer
    Runs weekly to analyze and optimize AI federation weights
    """
    
    def __init__(self, config_path: str = "../config/decision_pool.yaml"):
        self.config_path = os.path.join(os.path.dirname(__file__), config_path)
        self.db_path = os.path.join(os.path.dirname(__file__), "../telemetry/memory_store.sqlite")
        self.api_key = os.environ.get("OPENAI_API_KEY", "")
        self.model = "gpt-5"  # Or gpt-4o as fallback
        self.last_optimization = None
    
    def load_config(self) -> Dict:
        """Load current configuration"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: Could not load config: {e}")
            return {}
    
    def get_telemetry_summary(self, days: int = 7) -> Dict[str, Any]:
        """Get telemetry summary for analysis"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Build statistics
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_builds,
                    SUM(CASE WHEN build_status = 'success' THEN 1 ELSE 0 END) as success_count,
                    AVG(latency_ms) as avg_latency,
                    SUM(cost_usd) as total_cost,
                    SUM(token_usage) as total_tokens
                FROM telemetry
                WHERE timestamp >= datetime('now', ?)
            """, (f'-{days} days',))
            
            row = cursor.fetchone()
            
            # AI performance
            cursor.execute("""
                SELECT 
                    source as ai_id,
                    COUNT(*) as decisions,
                    AVG(trust_score) as avg_trust,
                    SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approvals
                FROM decisions
                WHERE timestamp >= datetime('now', ?)
                GROUP BY source
            """, (f'-{days} days',))
            
            ai_stats = {}
            for ai_row in cursor.fetchall():
                ai_stats[ai_row[0]] = {
                    "decisions": ai_row[1],
                    "avg_trust": ai_row[2],
                    "approvals": ai_row[3],
                    "approval_rate": ai_row[3] / max(1, ai_row[1])
                }
            
            conn.close()
            
            return {
                "period_days": days,
                "build_stats": {
                    "total_builds": row[0] or 0,
                    "success_count": row[1] or 0,
                    "success_rate": (row[1] or 0) / max(1, row[0] or 1),
                    "avg_latency_ms": row[2] or 0,
                    "total_cost_usd": row[3] or 0,
                    "total_tokens": row[4] or 0
                },
                "ai_performance": ai_stats
            }
            
        except Exception as e:
            print(f"Error getting telemetry: {e}")
            return {
                "period_days": days,
                "build_stats": {},
                "ai_performance": {},
                "error": str(e)
            }
    
    def call_gpt5(self, prompt: str) -> str:
        """Call GPT-5 API for optimization analysis"""
        if not self.api_key:
            return json.dumps({
                "error": "No API key configured",
                "recommendations": "Configure OPENAI_API_KEY environment variable"
            })
        
        try:
            response = requests.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": """You are ARCHON's Meta-Strategist AI (GPT-5).
Your role is to analyze AI federation performance and recommend weight adjustments.

Output ONLY valid JSON with this structure:
{
  "analysis_summary": "Brief analysis",
  "recommended_weights": {
    "gpt4o": 0.30,
    "claude": 0.20,
    "gemini": 0.20,
    "deepseek": 0.15,
    "gpt5": 0.15
  },
  "optimization_actions": ["action1", "action2"],
  "confidence": 0.85
}"""
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 2000,
                    "temperature": 0.5
                },
                timeout=120
            )
            
            if response.ok:
                return response.json()["choices"][0]["message"]["content"]
            else:
                return json.dumps({"error": f"API error: {response.status_code}"})
                
        except Exception as e:
            return json.dumps({"error": str(e)})
    
    def run_optimization(self) -> Dict[str, Any]:
        """Run full optimization cycle"""
        print("\n" + "="*60)
        print("🧠 GPT-5 META-OPTIMIZATION CYCLE")
        print("="*60)
        
        # Get current state
        config = self.load_config()
        telemetry = self.get_telemetry_summary(7)
        
        current_weights = {}
        if "ai_pool" in config:
            for ai_id, ai_config in config["ai_pool"].items():
                current_weights[ai_id] = ai_config.get("trust_weight", 0.2)
        
        print(f"\n📊 Current Weights: {current_weights}")
        print(f"📈 Build Success Rate: {telemetry['build_stats'].get('success_rate', 0):.1%}")
        
        # Prepare prompt
        prompt = f"""
ARCHON Federation Weekly Performance Review

Current AI Weights:
{json.dumps(current_weights, indent=2)}

Last 7 Days Telemetry:
{json.dumps(telemetry, indent=2)}

Analyze:
1. Which AI models are underperforming?
2. Are current weights optimal for build success?
3. What weight adjustments would improve performance?
4. Any structural recommendations?

Weights must sum to 1.0 and each weight must be between 0.05 and 0.40.
"""
        
        print("\n🤖 Calling GPT-5 for analysis...")
        response = self.call_gpt5(prompt)
        
        # Parse response
        try:
            # Clean response (remove markdown if present)
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
            
            analysis = json.loads(clean_response)
        except json.JSONDecodeError:
            analysis = {
                "error": "Failed to parse GPT-5 response",
                "raw_response": response[:500]
            }
        
        # Create optimization report
        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "period": "weekly",
            "current_weights": current_weights,
            "telemetry_summary": telemetry,
            "gpt5_analysis": analysis,
            "status": "success" if "error" not in analysis else "partial"
        }
        
        # Save report
        report_path = os.path.join(
            os.path.dirname(__file__), 
            f"../reports/optimization_{datetime.now().strftime('%Y%m%d')}.json"
        )
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n📄 Report saved: {report_path}")
        
        # Apply weight updates if recommended
        if "recommended_weights" in analysis:
            self._apply_weight_updates(analysis["recommended_weights"])
        
        self.last_optimization = report
        return report
    
    def _apply_weight_updates(self, new_weights: Dict[str, float]):
        """Apply weight updates to configuration"""
        try:
            config = self.load_config()
            
            if "ai_pool" not in config:
                return
            
            # Validate weights sum to 1
            total = sum(new_weights.values())
            if abs(total - 1.0) > 0.01:
                print(f"⚠️ Weights don't sum to 1.0 ({total}), normalizing...")
                new_weights = {k: v/total for k, v in new_weights.items()}
            
            # Update weights
            for ai_id, weight in new_weights.items():
                if ai_id in config["ai_pool"]:
                    old_weight = config["ai_pool"][ai_id].get("trust_weight", 0.2)
                    config["ai_pool"][ai_id]["trust_weight"] = round(weight, 3)
                    print(f"  {ai_id}: {old_weight:.3f} → {weight:.3f}")
            
            # Save updated config
            with open(self.config_path, 'w') as f:
                yaml.dump(config, f, default_flow_style=False)
            
            print("✅ Weights updated in decision_pool.yaml")
            
        except Exception as e:
            print(f"❌ Failed to apply weights: {e}")
    
    def get_last_optimization(self) -> Optional[Dict]:
        """Get last optimization report"""
        return self.last_optimization


def main():
    """Run GPT-5 optimization"""
    optimizer = GPT5Optimizer()
    result = optimizer.run_optimization()
    print(f"\n📊 Optimization Result:\n{json.dumps(result, indent=2)}")


if __name__ == "__main__":
    main()
