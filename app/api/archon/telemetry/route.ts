// app/api/archon/telemetry/route.ts
// ARCHON Compact Federation - Telemetry API Endpoint

import { NextRequest, NextResponse } from 'next/server';

interface TelemetryData {
  decision_id?: string;
  build_status: string;
  latency_ms?: number;
  token_usage?: number;
  cost_usd?: number;
  error_count?: number;
  triggered_by?: string;
  trust_score?: number;
  timestamp?: string;
  metadata?: Record<string, unknown>;
}

// In-memory storage (replace with database in production)
const telemetryStore: TelemetryData[] = [];

export async function POST(request: NextRequest) {
  try {
    const data: TelemetryData = await request.json();
    
    // Add timestamp if not provided
    const record = {
      ...data,
      timestamp: data.timestamp || new Date().toISOString(),
      id: `tel-${Date.now()}`
    };
    
    telemetryStore.push(record);
    
    // Keep only last 1000 records
    if (telemetryStore.length > 1000) {
      telemetryStore.shift();
    }
    
    console.log('[ARCHON Telemetry] Received:', record);
    
    return NextResponse.json({
      success: true,
      message: 'Telemetry recorded',
      record_id: record.id
    });
  } catch (error) {
    console.error('[ARCHON Telemetry] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record telemetry' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const decision_id = searchParams.get('decision_id');
  
  let results = [...telemetryStore].reverse();
  
  if (decision_id) {
    results = results.filter(t => t.decision_id === decision_id);
  }
  
  results = results.slice(0, limit);
  
  // Calculate summary
  const summary = {
    total_records: telemetryStore.length,
    success_count: telemetryStore.filter(t => t.build_status === 'success').length,
    failed_count: telemetryStore.filter(t => t.build_status === 'failed').length,
    avg_latency_ms: telemetryStore.length > 0 
      ? telemetryStore.reduce((sum, t) => sum + (t.latency_ms || 0), 0) / telemetryStore.length 
      : 0,
    total_cost_usd: telemetryStore.reduce((sum, t) => sum + (t.cost_usd || 0), 0)
  };
  
  return NextResponse.json({
    success: true,
    summary,
    records: results
  });
}
