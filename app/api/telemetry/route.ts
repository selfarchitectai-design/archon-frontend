import { NextRequest, NextResponse } from 'next/server';

// ARCHON V7 Telemetry API Route
// Proxies requests to the FastAPI telemetry service

const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://n8n.selfarchitectai.com';

// Telemetry state (for fallback when external service unavailable)
let telemetryState = {
  trust_delta: 0.88,
  latency_p95: 950,
  drift_level: 0.17,
  system_health: 100,
  active_workflows: 22,
  lambda_count: 14,
  success_rate: 100.0,
  reflection_depth: 3,
  ethics_score: 0.95,
  memory_utilization: 0.42,
  glow_intensity: 0.5,
  trust_zone: 'GREEN',
  timestamp: new Date().toISOString()
};

// Simulate realistic metric drift
function simulateDrift() {
  telemetryState.trust_delta = Math.round(
    Math.max(0.7, Math.min(1.0, telemetryState.trust_delta + (Math.random() - 0.5) * 0.04)) * 1000
  ) / 1000;
  
  telemetryState.latency_p95 = Math.max(
    800, Math.min(1200, telemetryState.latency_p95 + Math.floor((Math.random() - 0.5) * 40))
  );
  
  telemetryState.drift_level = Math.round(
    Math.max(0.1, Math.min(0.4, telemetryState.drift_level + (Math.random() - 0.5) * 0.02)) * 1000
  ) / 1000;
  
  telemetryState.ethics_score = Math.round(
    Math.max(0.85, Math.min(1.0, telemetryState.ethics_score + (Math.random() - 0.5) * 0.02)) * 1000
  ) / 1000;
  
  telemetryState.memory_utilization = Math.round(
    Math.max(0.3, Math.min(0.7, telemetryState.memory_utilization + (Math.random() - 0.5) * 0.04)) * 1000
  ) / 1000;
  
  telemetryState.glow_intensity = Math.round((0.3 + 0.7 * telemetryState.trust_delta) * 1000) / 1000;
  
  telemetryState.trust_zone = 
    telemetryState.trust_delta > 0.85 ? 'GREEN' : 
    telemetryState.trust_delta > 0.7 ? 'YELLOW' : 'RED';
  
  telemetryState.timestamp = new Date().toISOString();
}

export async function GET(request: NextRequest) {
  try {
    // Try to fetch from N8N first
    const n8nResponse = await fetch(`${N8N_BASE_URL}/webhook/archon/status`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 2 } // Cache for 2 seconds
    });

    if (n8nResponse.ok) {
      const n8nData = await n8nResponse.json();
      
      // Merge with local state
      return NextResponse.json({
        ...telemetryState,
        system_health: n8nData.health || 100,
        active_workflows: n8nData.workflows?.active || 22,
        n8n_status: n8nData.status,
        source: 'n8n'
      });
    }
  } catch (error) {
    console.log('N8N fetch failed, using local simulation');
  }

  // Fallback: simulate drift and return local state
  simulateDrift();
  
  return NextResponse.json({
    ...telemetryState,
    source: 'simulation'
  });
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Update telemetry state
    if (data.trust_delta !== undefined) telemetryState.trust_delta = data.trust_delta;
    if (data.latency_p95 !== undefined) telemetryState.latency_p95 = data.latency_p95;
    if (data.drift_level !== undefined) telemetryState.drift_level = data.drift_level;
    if (data.system_health !== undefined) telemetryState.system_health = data.system_health;
    if (data.ethics_score !== undefined) telemetryState.ethics_score = data.ethics_score;
    
    telemetryState.timestamp = new Date().toISOString();
    
    return NextResponse.json({
      updated: true,
      state: telemetryState
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update telemetry' },
      { status: 400 }
    );
  }
}

// CORS headers
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
