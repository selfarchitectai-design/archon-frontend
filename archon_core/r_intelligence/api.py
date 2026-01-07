#!/usr/bin/env python3
"""
ARCHON R Intelligence Layer - API Bridge
Version: 2.5.1
Purpose: Bridge between R analytics and ARCHON system
"""

import os
import json
import sqlite3
import subprocess
from datetime import datetime, timezone
from typing import Dict, Any, Optional

class RIntelligenceAPI:
    """
    Python wrapper for R Intelligence Layer
    Provides API access to R analytics
    """
    
    def __init__(self, db_path: str = "../telemetry/memory_store.sqlite"):
        self.db_path = os.path.join(os.path.dirname(__file__), db_path)
        self.reports_dir = os.path.join(os.path.dirname(__file__), "../reports")
        
        # Ensure reports directory exists
        os.makedirs(self.reports_dir, exist_ok=True)
    
    def run_r_script(self, script_name: str = "analytics.R") -> Dict[str, Any]:
        """
        Execute R analytics script
        
        Returns:
            Result dict with status and output
        """
        script_path = os.path.join(os.path.dirname(__file__), script_name)
        
        try:
            result = subprocess.run(
                ["Rscript", script_path],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            return {
                "success": result.returncode == 0,
                "stdout": result.stdout,
                "stderr": result.stderr,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "R script timeout"}
        except FileNotFoundError:
            return {"success": False, "error": "R not installed or script not found"}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def get_build_stats(self, days: int = 7) -> Dict[str, Any]:
        """
        Get build statistics from SQLite
        
        Args:
            days: Number of days to analyze
            
        Returns:
            Build statistics dict
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute(f"""
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN build_status = 'success' THEN 1 ELSE 0 END) as successful,
                    AVG(latency_ms) as avg_latency,
                    SUM(cost_usd) as total_cost
                FROM telemetry 
                WHERE timestamp >= datetime('now', '-{days} days')
            """)
            
            row = cursor.fetchone()
            conn.close()
            
            total = row[0] or 0
            successful = row[1] or 0
            
            return {
                "period_days": days,
                "total_builds": total,
                "successful_builds": successful,
                "success_rate": successful / total if total > 0 else 0,
                "avg_latency_ms": row[2] or 0,
                "total_cost_usd": row[3] or 0,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
        except Exception as e:
            return {"error": str(e)}
    
    def get_ai_weights(self) -> Dict[str, float]:
        """
        Get current AI model weights
        
        Returns:
            Dict of AI model weights
        """
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute("SELECT ai_id, weight FROM ai_weights")
            rows = cursor.fetchall()
            conn.close()
            
            return {row[0]: row[1] for row in rows}
        except Exception as e:
            # Return defaults
            return {
                "gpt4o": 0.30,
                "claude": 0.20,
                "gemini": 0.20,
                "deepseek": 0.15,
                "gpt5": 0.15
            }
    
    def update_ai_weight(self, ai_id: str, new_weight: float) -> bool:
        """
        Update AI model weight
        
        Args:
            ai_id: Model identifier
            new_weight: New weight value (0-1)
            
        Returns:
            Success boolean
        """
        if not 0 <= new_weight <= 1:
            return False
        
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Log history
            cursor.execute(
                "SELECT weight FROM ai_weights WHERE ai_id = ?",
                (ai_id,)
            )
            old_weight = cursor.fetchone()
            old_weight = old_weight[0] if old_weight else 0
            
            cursor.execute("""
                INSERT INTO ai_weights_history (timestamp, ai_id, old_weight, new_weight, reason)
                VALUES (?, ?, ?, ?, ?)
            """, (datetime.now(timezone.utc).isoformat(), ai_id, old_weight, new_weight, "R Intelligence optimization"))
            
            # Update weight
            cursor.execute("""
                INSERT OR REPLACE INTO ai_weights (ai_id, weight, updated_at)
                VALUES (?, ?, ?)
            """, (ai_id, new_weight, datetime.now(timezone.utc).isoformat()))
            
            conn.commit()
            conn.close()
            return True
        except Exception as e:
            print(f"Error updating weight: {e}")
            return False
    
    def get_weekly_report(self) -> Optional[Dict]:
        """
        Get latest weekly report
        
        Returns:
            Report dict or None
        """
        report_path = os.path.join(self.reports_dir, "weekly_report.json")
        
        if os.path.exists(report_path):
            with open(report_path, 'r') as f:
                return json.load(f)
        return None
    
    def generate_recommendations(self) -> Dict[str, Any]:
        """
        Generate optimization recommendations
        
        Returns:
            Recommendations dict
        """
        stats = self.get_build_stats(7)
        weights = self.get_ai_weights()
        
        recommendations = []
        
        # Analyze and recommend
        success_rate = stats.get("success_rate", 0)
        avg_latency = stats.get("avg_latency_ms", 0)
        
        if success_rate < 0.7:
            recommendations.append({
                "type": "trust_threshold",
                "message": "Increase trust threshold - current success rate too low",
                "priority": "high"
            })
        
        if avg_latency > 10000:
            recommendations.append({
                "type": "performance",
                "message": "Optimize build pipeline - high latency detected",
                "priority": "medium"
            })
        
        if stats.get("total_cost_usd", 0) > 5:
            recommendations.append({
                "type": "cost",
                "message": "Review token usage for cost optimization",
                "priority": "low"
            })
        
        if not recommendations:
            recommendations.append({
                "type": "status",
                "message": "System performing optimally",
                "priority": "info"
            })
        
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "stats": stats,
            "current_weights": weights,
            "recommendations": recommendations
        }


# CLI interface
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="ARCHON R Intelligence API")
    parser.add_argument("--stats", action="store_true", help="Get build stats")
    parser.add_argument("--weights", action="store_true", help="Get AI weights")
    parser.add_argument("--recommend", action="store_true", help="Get recommendations")
    parser.add_argument("--run-r", action="store_true", help="Run R analytics")
    
    args = parser.parse_args()
    api = RIntelligenceAPI()
    
    if args.stats:
        print(json.dumps(api.get_build_stats(), indent=2))
    elif args.weights:
        print(json.dumps(api.get_ai_weights(), indent=2))
    elif args.recommend:
        print(json.dumps(api.generate_recommendations(), indent=2))
    elif args.run_r:
        print(json.dumps(api.run_r_script(), indent=2))
    else:
        # Default: show recommendations
        print(json.dumps(api.generate_recommendations(), indent=2))
