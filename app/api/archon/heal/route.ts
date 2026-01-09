import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

const MOCK_HEAL = {
  status: 'ready',
  capabilities: ['workflow_restart', 'config_rollback', 'cache_clear', 'connection_reset'],
  lastAction: null,
  actionsToday: 0,
  healthBefore: null,
  healthAfter: null,
  source: 'fallback'
}

export async function GET() {
  return NextResponse.json(MOCK_HEAL)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(`${N8N_BASE}/archon/heal`, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    clearTimeout(timeout)
    
    const data = await res.json()
    if (data.code === 0 || data.message?.includes('problem')) {
      return NextResponse.json({
        ...MOCK_HEAL,
        status: 'simulated',
        action: body.action || 'diagnose',
        result: 'Self-heal simulation - N8N backend temporarily unavailable',
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      ...MOCK_HEAL,
      status: 'simulated',
      result: 'Self-heal endpoint unavailable',
      timestamp: new Date().toISOString()
    })
  }
}
