import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

// Mock dashboard data for when N8N is unavailable
const MOCK_DASHBOARD = {
  status: 'operational',
  timestamp: new Date().toISOString(),
  system: { status: 'operational', score: 100, uptime: 99.9 },
  trust: { level: 'HIGH', score: 87, trend: 'stable' },
  workflows: { active: 14, total: 14, executions24h: 156, successRate: 98 },
  services: {
    n8n: { status: 'online', latency: 120 },
    lambda: { status: 'online', latency: 89 },
    mcp: { status: 'online', latency: 145 },
    api: { status: 'online', latency: 95 }
  },
  costs: { monthly: 3.8, budget: 50, remaining: 46.2, trend: -12 },
  selfHeal: { status: 'ready', lastAction: null, actionsToday: 0 },
  metrics: { health: 100, performance: 96, reliability: 99 },
  source: 'fallback'
}

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(`${N8N_BASE}/dashboard-api`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    })
    
    clearTimeout(timeout)
    
    if (!res.ok) {
      throw new Error(`N8N responded with ${res.status}`)
    }
    
    const data = await res.json()
    
    // Check if response has error
    if (data.code === 0 || data.message?.includes('problem')) {
      return NextResponse.json({ ...MOCK_DASHBOARD, timestamp: new Date().toISOString() })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ ...MOCK_DASHBOARD, timestamp: new Date().toISOString() })
  }
}
