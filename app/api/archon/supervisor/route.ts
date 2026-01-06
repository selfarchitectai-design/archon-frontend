// app/api/archon/supervisor/route.ts
// ARCHON Compact Federation - Supervisor API Endpoint

import { NextRequest, NextResponse } from 'next/server';

interface Decision {
  id: string;
  timestamp: string;
  source: string;
  plan: Record<string, unknown>;
  trust_score: number;
  cohesion_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  reason?: string;
}

// In-memory storage
const decisions: Decision[] = [];
const TRUST_THRESHOLD = 0.7;
const COHESION_THRESHOLD = 0.6;

function generateDecisionId(): string {
  return `dec-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`;
}

function evaluateTrust(plan: Record<string, unknown>, source: string): { trust: number; cohesion: number } {
  // Base trust by source
  const sourceTrust: Record<string, number> = {
    'gpt4o': 0.85,
    'claude': 0.85,
    'gemini': 0.80,
    'deepseek': 0.75,
    'gpt5': 0.90,
    'orchestrator': 0.80,
    'production-line': 0.75,
    'manual': 0.95
  };
  
  let trust = sourceTrust[source] || 0.70;
  
  // Adjust based on plan quality
  if (plan.risk_level === 'low') trust += 0.05;
  if (plan.risk_level === 'high') trust -= 0.10;
  if (plan.has_tests) trust += 0.03;
  if (plan.has_documentation) trust += 0.02;
  
  // Cohesion score
  const cohesion = plan.consensus_score 
    ? Number(plan.consensus_score) 
    : 0.75;
  
  return { 
    trust: Math.min(1.0, Math.max(0.0, trust)), 
    cohesion: Math.min(1.0, Math.max(0.0, cohesion)) 
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, source } = body;
    
    if (!plan || !source) {
      return NextResponse.json(
        { success: false, error: 'Missing plan or source' },
        { status: 400 }
      );
    }
    
    // Evaluate trust and cohesion
    const { trust, cohesion } = evaluateTrust(plan, source);
    
    // Make decision
    const approved = trust >= TRUST_THRESHOLD && cohesion >= COHESION_THRESHOLD;
    
    const decision: Decision = {
      id: generateDecisionId(),
      timestamp: new Date().toISOString(),
      source,
      plan,
      trust_score: trust,
      cohesion_score: cohesion,
      status: approved ? 'approved' : 'rejected',
      reason: approved 
        ? 'All thresholds met' 
        : `Trust: ${trust.toFixed(2)} (min ${TRUST_THRESHOLD}), Cohesion: ${cohesion.toFixed(2)} (min ${COHESION_THRESHOLD})`
    };
    
    decisions.push(decision);
    
    // Keep only last 500 decisions
    if (decisions.length > 500) {
      decisions.shift();
    }
    
    console.log(`[ARCHON Supervisor] Decision ${decision.id}: ${decision.status}`);
    
    return NextResponse.json({
      success: true,
      decision: {
        id: decision.id,
        status: decision.status,
        trust_score: decision.trust_score,
        cohesion_score: decision.cohesion_score,
        reason: decision.reason
      }
    });
  } catch (error) {
    console.error('[ARCHON Supervisor] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Supervisor evaluation failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const status = searchParams.get('status');
  
  let results = [...decisions].reverse();
  
  if (status) {
    results = results.filter(d => d.status === status);
  }
  
  results = results.slice(0, limit);
  
  // System health
  const recent = decisions.slice(-20);
  const approved = recent.filter(d => d.status === 'approved' || d.status === 'completed').length;
  const health = {
    status: approved / Math.max(1, recent.length) >= 0.7 ? 'healthy' : 'degraded',
    total_decisions: decisions.length,
    recent_success_rate: approved / Math.max(1, recent.length),
    thresholds: {
      trust: TRUST_THRESHOLD,
      cohesion: COHESION_THRESHOLD
    }
  };
  
  return NextResponse.json({
    success: true,
    health,
    decisions: results
  });
}
