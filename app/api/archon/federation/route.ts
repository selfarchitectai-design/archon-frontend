// app/api/archon/federation/route.ts
// ARCHON Compact Federation - Federation Status API

import { NextRequest, NextResponse } from 'next/server';

const FEDERATION_VERSION = '2.5.1';

interface AIModel {
  id: string;
  role: string;
  trust_weight: number;
  active: boolean | 'manual';
  last_used?: string;
  success_rate?: number;
}

// AI Pool configuration
const aiPool: AIModel[] = [
  { id: 'gpt4o', role: 'planner_coder', trust_weight: 0.30, active: true },
  { id: 'gpt5', role: 'meta_strategist', trust_weight: 0.15, active: 'manual' },
  { id: 'gemini', role: 'research_analyst', trust_weight: 0.20, active: true },
  { id: 'claude', role: 'deploy_architect', trust_weight: 0.20, active: true },
  { id: 'deepseek', role: 'performance_analyst', trust_weight: 0.15, active: true }
];

export async function GET(request: NextRequest) {
  const status = {
    name: 'ARCHON Compact Federation',
    version: FEDERATION_VERSION,
    timestamp: new Date().toISOString(),
    status: 'operational',
    
    components: {
      ai_pool: {
        status: 'active',
        models: aiPool,
        active_count: aiPool.filter(m => m.active === true).length
      },
      supervisor: {
        status: 'active',
        trust_threshold: 0.7,
        cohesion_threshold: 0.6
      },
      trigger: {
        status: 'ready',
        method: 'github_workflow_dispatch',
        cooldown_active: false
      },
      executor: {
        platform: 'github_mcp',
        status: 'ready',
        last_build: null
      },
      telemetry: {
        status: 'collecting',
        storage: 'sqlite'
      },
      production_line: {
        status: 'idle',
        auto_deploy: true
      }
    },
    
    endpoints: {
      supervisor: '/api/archon/supervisor',
      telemetry: '/api/archon/telemetry',
      trust: '/api/archon/trust',
      federation: '/api/archon/federation',
      trigger: '/api/claude/trigger'
    },
    
    architecture: {
      flow: 'AI Pool → Supervisor → Trigger → GitHub MCP → Telemetry → Learning',
      layers: [
        'Core Intelligence (AI Decision Pool)',
        'Supervisor (Trust Evaluation)',
        'Trigger (Webhook Dispatch)',
        'Executor (GitHub Actions)',
        'Telemetry (Metrics)',
        'Policy Guard (OPA)',
        'Production Line (Automation)'
      ]
    }
  };
  
  return NextResponse.json(status);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'update_weights':
        const { weights } = body;
        if (weights) {
          for (const [id, weight] of Object.entries(weights)) {
            const model = aiPool.find(m => m.id === id);
            if (model) {
              model.trust_weight = weight as number;
            }
          }
        }
        return NextResponse.json({ success: true, message: 'Weights updated', aiPool });
        
      case 'get_weights':
        return NextResponse.json({ 
          success: true, 
          weights: Object.fromEntries(aiPool.map(m => [m.id, m.trust_weight]))
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Action failed' },
      { status: 500 }
    );
  }
}
