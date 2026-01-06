#!/usr/bin/env python3
"""
ARCHON Compact Federation - AI Pool Manager
Version: 2.5.1
Purpose: Manage and coordinate AI decision pool (GPT-4o, Claude, Gemini, DeepSeek, GPT-5)

This module:
1. Loads AI configurations from decision_pool.yaml
2. Routes requests to appropriate AI models
3. Aggregates responses for Supervisor evaluation
4. Tracks usage and performance metrics
"""

import json
import os
import yaml
import requests
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from enum import Enum
import hashlib


class AIRole(Enum):
    """AI model roles in the federation"""
    PLANNER_CODER = "planner_coder"
    META_STRATEGIST = "meta_strategist"
    RESEARCH_ANALYST = "research_analyst"
    DEPLOY_ARCHITECT = "deploy_architect"
    PERFORMANCE_ANALYST = "performance_analyst"


@dataclass
class AIResponse:
    """Response from an AI model"""
    ai_id: str
    role: str
    content: str
    tokens_used: int
    latency_ms: float
    cost_usd: float
    timestamp: str
    success: bool
    error: Optional[str] = None


@dataclass
class AggregatedPlan:
    """Aggregated plan from multiple AI responses"""
    task: str
    description: str
    responses: List[AIResponse]
    consensus_score: float
    estimated_cost: float
    estimated_tokens: int
    risk_level: str
    created_at: str


class AIPoolManager:
    """
    ARCHON AI Pool Manager
    Coordinates the 5-model AI decision pool
    """
    
    def __init__(self, config_path: str = "../config/decision_pool.yaml"):
        self.config_path = os.path.join(os.path.dirname(__file__), config_path)
        self.config = self._load_config()
        self.ai_pool = self.config.get('ai_pool', {})
        
        # Load API keys from environment (AWS Secrets Manager in production)
        self.api_keys = {
            'openai': os.environ.get('OPENAI_API_KEY', ''),
            'anthropic': os.environ.get('ANTHROPIC_API_KEY', ''),
            'google': os.environ.get('GOOGLE_API_KEY', ''),
            'deepseek': os.environ.get('DEEPSEEK_API_KEY', '')
        }
        
        # Usage tracking
        self.session_usage = {
            'total_tokens': 0,
            'total_cost': 0.0,
            'requests': []
        }
    
    def _load_config(self) -> Dict:
        """Load configuration from YAML"""
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except Exception as e:
            print(f"Warning: Could not load config: {e}")
            return {}
    
    def _generate_request_id(self) -> str:
        """Generate unique request ID"""
        timestamp = datetime.now(timezone.utc).isoformat()
        return f"req-{hashlib.sha256(timestamp.encode()).hexdigest()[:8]}"
    
    # ================================
    # AI MODEL CALLERS
    # ================================
    
    def call_gpt4o(self, prompt: str, task_type: str = "planning") -> AIResponse:
        """
        Call GPT-4o for task planning and code generation
        Role: Chief Planner & Coder
        """
        ai_config = self.ai_pool.get('gpt4o', {})
        
        if not ai_config.get('active', False):
            return self._inactive_response('gpt4o', 'planner_coder')
        
        start_time = datetime.now()
        
        try:
            response = requests.post(
                ai_config.get('endpoint', 'https://api.openai.com/v1/chat/completions'),
                headers={
                    "Authorization": f"Bearer {self.api_keys['openai']}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": ai_config.get('model', 'gpt-4o'),
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are the Chief Planner of ARCHON AI Federation. Create detailed, actionable plans with cost estimates."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.7
                },
                timeout=60
            )
            
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.ok:
                data = response.json()
                content = data['choices'][0]['message']['content']
                tokens = data.get('usage', {}).get('total_tokens', 0)
                cost = tokens * 0.00001  # Approximate cost
                
                return AIResponse(
                    ai_id='gpt4o',
                    role='planner_coder',
                    content=content,
                    tokens_used=tokens,
                    latency_ms=latency,
                    cost_usd=cost,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    success=True
                )
            else:
                return self._error_response('gpt4o', 'planner_coder', 
                                           f"API error: {response.status_code}", latency)
                
        except Exception as e:
            latency = (datetime.now() - start_time).total_seconds() * 1000
            return self._error_response('gpt4o', 'planner_coder', str(e), latency)
    
    def call_claude(self, prompt: str, task_type: str = "deployment") -> AIResponse:
        """
        Call Claude for CI/CD and deployment architecture
        Role: Deployment Architect
        """
        ai_config = self.ai_pool.get('claude', {})
        
        if not ai_config.get('active', False):
            return self._inactive_response('claude', 'deploy_architect')
        
        start_time = datetime.now()
        
        try:
            response = requests.post(
                ai_config.get('endpoint', 'https://api.anthropic.com/v1/messages'),
                headers={
                    "x-api-key": self.api_keys['anthropic'],
                    "anthropic-version": "2023-06-01",
                    "Content-Type": "application/json"
                },
                json={
                    "model": ai_config.get('model', 'claude-sonnet-4-20250514'),
                    "max_tokens": 4096,
                    "messages": [
                        {"role": "user", "content": prompt}
                    ],
                    "system": "You are the Deployment Architect of ARCHON. Design CI/CD pipelines, Dockerfiles, and infrastructure configurations."
                },
                timeout=60
            )
            
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.ok:
                data = response.json()
                content = data['content'][0]['text']
                tokens = data.get('usage', {}).get('input_tokens', 0) + data.get('usage', {}).get('output_tokens', 0)
                cost = tokens * 0.000015
                
                return AIResponse(
                    ai_id='claude',
                    role='deploy_architect',
                    content=content,
                    tokens_used=tokens,
                    latency_ms=latency,
                    cost_usd=cost,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    success=True
                )
            else:
                return self._error_response('claude', 'deploy_architect',
                                           f"API error: {response.status_code}", latency)
                
        except Exception as e:
            latency = (datetime.now() - start_time).total_seconds() * 1000
            return self._error_response('claude', 'deploy_architect', str(e), latency)
    
    def call_gemini(self, prompt: str, task_type: str = "research") -> AIResponse:
        """
        Call Gemini for web research and insights
        Role: Research Analyst
        """
        ai_config = self.ai_pool.get('gemini', {})
        
        if not ai_config.get('active', False):
            return self._inactive_response('gemini', 'research_analyst')
        
        start_time = datetime.now()
        
        try:
            response = requests.post(
                f"{ai_config.get('endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent')}?key={self.api_keys['google']}",
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "maxOutputTokens": 4096,
                        "temperature": 0.7
                    }
                },
                timeout=60
            )
            
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.ok:
                data = response.json()
                content = data['candidates'][0]['content']['parts'][0]['text']
                tokens = len(content.split()) * 1.3  # Approximate
                cost = tokens * 0.000005
                
                return AIResponse(
                    ai_id='gemini',
                    role='research_analyst',
                    content=content,
                    tokens_used=int(tokens),
                    latency_ms=latency,
                    cost_usd=cost,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    success=True
                )
            else:
                return self._error_response('gemini', 'research_analyst',
                                           f"API error: {response.status_code}", latency)
                
        except Exception as e:
            latency = (datetime.now() - start_time).total_seconds() * 1000
            return self._error_response('gemini', 'research_analyst', str(e), latency)
    
    def call_deepseek(self, prompt: str, task_type: str = "analysis") -> AIResponse:
        """
        Call DeepSeek for code analysis and performance metrics
        Role: Performance Analyst
        """
        ai_config = self.ai_pool.get('deepseek', {})
        
        if not ai_config.get('active', False):
            return self._inactive_response('deepseek', 'performance_analyst')
        
        start_time = datetime.now()
        
        try:
            response = requests.post(
                ai_config.get('endpoint', 'https://api.deepseek.com/v1/chat/completions'),
                headers={
                    "Authorization": f"Bearer {self.api_keys['deepseek']}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": ai_config.get('model', 'deepseek-coder'),
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are the Performance Analyst of ARCHON. Analyze code quality, performance metrics, and suggest optimizations."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 4096,
                    "temperature": 0.3
                },
                timeout=60
            )
            
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.ok:
                data = response.json()
                content = data['choices'][0]['message']['content']
                tokens = data.get('usage', {}).get('total_tokens', 0)
                cost = tokens * 0.000002
                
                return AIResponse(
                    ai_id='deepseek',
                    role='performance_analyst',
                    content=content,
                    tokens_used=tokens,
                    latency_ms=latency,
                    cost_usd=cost,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    success=True
                )
            else:
                return self._error_response('deepseek', 'performance_analyst',
                                           f"API error: {response.status_code}", latency)
                
        except Exception as e:
            latency = (datetime.now() - start_time).total_seconds() * 1000
            return self._error_response('deepseek', 'performance_analyst', str(e), latency)
    
    def call_gpt5(self, prompt: str, task_type: str = "strategy") -> AIResponse:
        """
        Call GPT-5 for meta-strategic optimization (manual trigger only)
        Role: Meta Strategist
        """
        ai_config = self.ai_pool.get('gpt5', {})
        
        # GPT-5 is manual-only
        if ai_config.get('active') != 'manual':
            return self._inactive_response('gpt5', 'meta_strategist')
        
        start_time = datetime.now()
        
        try:
            response = requests.post(
                ai_config.get('endpoint', 'https://api.openai.com/v1/chat/completions'),
                headers={
                    "Authorization": f"Bearer {self.api_keys['openai']}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": ai_config.get('model', 'gpt-5'),
                    "messages": [
                        {
                            "role": "system",
                            "content": "You are the Meta Strategist of ARCHON. Analyze system performance and optimize AI model weights for better outcomes. Focus on long-term structural improvements."
                        },
                        {"role": "user", "content": prompt}
                    ],
                    "max_tokens": 8192,
                    "temperature": 0.5
                },
                timeout=120
            )
            
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            if response.ok:
                data = response.json()
                content = data['choices'][0]['message']['content']
                tokens = data.get('usage', {}).get('total_tokens', 0)
                cost = tokens * 0.00003  # GPT-5 is more expensive
                
                return AIResponse(
                    ai_id='gpt5',
                    role='meta_strategist',
                    content=content,
                    tokens_used=tokens,
                    latency_ms=latency,
                    cost_usd=cost,
                    timestamp=datetime.now(timezone.utc).isoformat(),
                    success=True
                )
            else:
                return self._error_response('gpt5', 'meta_strategist',
                                           f"API error: {response.status_code}", latency)
                
        except Exception as e:
            latency = (datetime.now() - start_time).total_seconds() * 1000
            return self._error_response('gpt5', 'meta_strategist', str(e), latency)
    
    # ================================
    # AGGREGATION & CONSENSUS
    # ================================
    
    def generate_plan(self, task: str, description: str, 
                      include_research: bool = True) -> AggregatedPlan:
        """
        Generate an aggregated plan from multiple AI models
        
        Args:
            task: Task name
            description: Detailed task description
            include_research: Whether to include Gemini research
            
        Returns:
            AggregatedPlan with consensus from multiple AIs
        """
        print(f"\n{'='*60}")
        print(f"🧠 ARCHON AI POOL: Generating Plan")
        print(f"{'='*60}")
        print(f"Task: {task}")
        print(f"Description: {description[:100]}...")
        
        responses = []
        
        # 1. GPT-4o: Primary planning
        print("\n📋 Consulting GPT-4o (Planner)...")
        gpt4o_response = self.call_gpt4o(
            f"Task: {task}\nDescription: {description}\n\nCreate a detailed execution plan with:\n1. Step-by-step actions\n2. Estimated tokens and cost\n3. Risk assessment\n4. Success criteria"
        )
        responses.append(gpt4o_response)
        print(f"   {'✅' if gpt4o_response.success else '❌'} GPT-4o: {gpt4o_response.tokens_used} tokens")
        
        # 2. Gemini: Research (optional)
        if include_research:
            print("\n🔍 Consulting Gemini (Research)...")
            gemini_response = self.call_gemini(
                f"Research task: {task}\n\nProvide insights on:\n1. Best practices\n2. Potential issues\n3. Community recommendations"
            )
            responses.append(gemini_response)
            print(f"   {'✅' if gemini_response.success else '❌'} Gemini: {gemini_response.tokens_used} tokens")
        
        # 3. Claude: Deployment architecture
        print("\n🚀 Consulting Claude (Deployment)...")
        claude_response = self.call_claude(
            f"Design deployment for: {task}\n\nProvide:\n1. CI/CD pipeline structure\n2. Docker configuration\n3. Environment setup"
        )
        responses.append(claude_response)
        print(f"   {'✅' if claude_response.success else '❌'} Claude: {claude_response.tokens_used} tokens")
        
        # 4. DeepSeek: Performance analysis
        print("\n📊 Consulting DeepSeek (Analysis)...")
        deepseek_response = self.call_deepseek(
            f"Analyze task: {task}\n\nProvide:\n1. Code quality considerations\n2. Performance metrics to track\n3. Optimization suggestions"
        )
        responses.append(deepseek_response)
        print(f"   {'✅' if deepseek_response.success else '❌'} DeepSeek: {deepseek_response.tokens_used} tokens")
        
        # Calculate consensus and aggregate
        successful = [r for r in responses if r.success]
        consensus = len(successful) / len(responses) if responses else 0
        
        total_tokens = sum(r.tokens_used for r in responses)
        total_cost = sum(r.cost_usd for r in responses)
        
        # Determine risk level
        if consensus >= 0.9:
            risk_level = "low"
        elif consensus >= 0.7:
            risk_level = "medium"
        else:
            risk_level = "high"
        
        plan = AggregatedPlan(
            task=task,
            description=description,
            responses=responses,
            consensus_score=consensus,
            estimated_cost=total_cost,
            estimated_tokens=total_tokens,
            risk_level=risk_level,
            created_at=datetime.now(timezone.utc).isoformat()
        )
        
        print(f"\n📊 Plan Summary:")
        print(f"   Consensus: {consensus:.1%}")
        print(f"   Total Tokens: {total_tokens}")
        print(f"   Estimated Cost: ${total_cost:.4f}")
        print(f"   Risk Level: {risk_level}")
        
        # Track usage
        self.session_usage['total_tokens'] += total_tokens
        self.session_usage['total_cost'] += total_cost
        
        return plan
    
    def request_optimization(self, telemetry_summary: Dict) -> AIResponse:
        """
        Request meta-optimization from GPT-5 (weekly strategy review)
        
        Args:
            telemetry_summary: Summary of recent build performance
            
        Returns:
            GPT-5 optimization recommendations
        """
        print("\n🧠 Requesting GPT-5 Meta-Optimization...")
        
        prompt = f"""
        ARCHON System Performance Review
        
        Telemetry Summary:
        {json.dumps(telemetry_summary, indent=2)}
        
        Current AI Weights:
        - GPT-4o: {self.ai_pool.get('gpt4o', {}).get('trust_weight', 0.3)}
        - Claude: {self.ai_pool.get('claude', {}).get('trust_weight', 0.2)}
        - Gemini: {self.ai_pool.get('gemini', {}).get('trust_weight', 0.2)}
        - DeepSeek: {self.ai_pool.get('deepseek', {}).get('trust_weight', 0.15)}
        - GPT-5: {self.ai_pool.get('gpt5', {}).get('trust_weight', 0.15)}
        
        Please analyze and provide:
        1. Recommended weight adjustments
        2. Structural improvements
        3. Cost optimization strategies
        4. Performance enhancement suggestions
        
        Output as JSON with new_weights and recommendations.
        """
        
        return self.call_gpt5(prompt, task_type="optimization")
    
    # ================================
    # HELPER METHODS
    # ================================
    
    def _inactive_response(self, ai_id: str, role: str) -> AIResponse:
        """Return response for inactive AI"""
        return AIResponse(
            ai_id=ai_id,
            role=role,
            content="",
            tokens_used=0,
            latency_ms=0,
            cost_usd=0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            success=False,
            error="AI model is inactive"
        )
    
    def _error_response(self, ai_id: str, role: str, error: str, latency: float) -> AIResponse:
        """Return error response"""
        return AIResponse(
            ai_id=ai_id,
            role=role,
            content="",
            tokens_used=0,
            latency_ms=latency,
            cost_usd=0,
            timestamp=datetime.now(timezone.utc).isoformat(),
            success=False,
            error=error
        )
    
    def get_active_models(self) -> List[str]:
        """Get list of active AI models"""
        return [
            ai_id for ai_id, config in self.ai_pool.items()
            if config.get('active', False) == True
        ]
    
    def get_session_usage(self) -> Dict[str, Any]:
        """Get current session usage statistics"""
        return {
            **self.session_usage,
            'active_models': self.get_active_models()
        }
    
    def export_plan_json(self, plan: AggregatedPlan) -> str:
        """Export plan to JSON for Supervisor"""
        return json.dumps({
            "task": plan.task,
            "description": plan.description,
            "consensus_score": plan.consensus_score,
            "estimated_cost": plan.estimated_cost,
            "estimated_tokens": plan.estimated_tokens,
            "risk_level": plan.risk_level,
            "created_at": plan.created_at,
            "ai_responses": [
                {
                    "ai_id": r.ai_id,
                    "role": r.role,
                    "success": r.success,
                    "tokens_used": r.tokens_used,
                    "cost_usd": r.cost_usd
                }
                for r in plan.responses
            ]
        }, indent=2)


# ================================
# MAIN EXECUTION
# ================================

def main():
    """Test AI Pool Manager"""
    pool = AIPoolManager()
    
    print("ARCHON AI Pool Manager Test")
    print("=" * 50)
    print(f"Active Models: {pool.get_active_models()}")
    
    # Generate a test plan
    plan = pool.generate_plan(
        task="deploy_dashboard_update",
        description="Deploy a new dashboard component with real-time metrics visualization",
        include_research=False  # Skip research for faster test
    )
    
    # Export plan
    plan_json = pool.export_plan_json(plan)
    print(f"\n📄 Plan JSON:\n{plan_json}")
    
    # Show usage
    usage = pool.get_session_usage()
    print(f"\n📊 Session Usage: {json.dumps(usage, indent=2)}")


if __name__ == "__main__":
    main()
