#!/usr/bin/env python3
"""
ARCHON R Intelligence Bridge
Connects Python orchestrator to R analytics engine
"""

import subprocess
import json
import os
from datetime import datetime
from typing import Dict, Any, Optional

class RIntelligenceBridge:
    """Bridge between Python and R Intelligence Layer"""
    
    def __init__(self, r_script_path: str = None):
        self.r_script_path = r_script_path or os.path.join(
            os.path.dirname(__file__), "analysis_engine.R"
        )
        self.last_analysis = None
        self.last_run_time = None
    
    def run_analysis(self) -> Dict[str, Any]:
        """Execute R analysis and return results"""
        try:
            result = subprocess.run(
                ["Rscript", self.r_script_path],
                capture_output=True,
                text=True,
                timeout=120
            )
            
            if result.returncode == 0:
                # Parse JSON output from R
                output = result.stdout.strip()
                if output:
                    self.last_analysis = json.loads(output)
                    self.last_run_time = datetime.now().isoformat()
                    return self.last_analysis
                else:
                    return {"status": "success", "message": "Analysis complete, no output"}
            else:
                return {
                    "status": "error",
                    "error": result.stderr,
                    "returncode": result.returncode
                }
                
        except subprocess.TimeoutExpired:
            return {"status": "error", "error": "R analysis timed out"}
        except FileNotFoundError:
            return {"status": "error", "error": "Rscript not found"}
        except json.JSONDecodeError:
            return {"status": "error", "error": "Failed to parse R output"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def get_recommended_weights(self) -> Optional[Dict[str, float]]:
        """Get AI weight recommendations from last analysis"""
        if self.last_analysis and "recommended_weights" in self.last_analysis:
            return self.last_analysis["recommended_weights"]
        return None
    
    def get_performance_summary(self) -> Optional[Dict[str, Any]]:
        """Get build performance summary"""
        if self.last_analysis and "build_performance" in self.last_analysis:
            return self.last_analysis["build_performance"]
        return None


def main():
    """Test R Intelligence Bridge"""
    bridge = RIntelligenceBridge()
    
    print("🧠 Testing R Intelligence Bridge...")
    result = bridge.run_analysis()
    print(f"Result: {json.dumps(result, indent=2)}")
    
    weights = bridge.get_recommended_weights()
    if weights:
        print(f"\nRecommended Weights: {weights}")


if __name__ == "__main__":
    main()
