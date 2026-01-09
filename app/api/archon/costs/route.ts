import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

const MOCK_COSTS = {
  costs: {
    totalMonthly: 3.8,
    breakdown: {
      lambda: 0.8,
      n8n: 2.5,
      storage: 0.3,
      api: 0.2
    }
  },
  budget: {
    total: 50,
    used: 3.8,
    remaining: 46.2,
    percentUsed: 7.6
  },
  trend: -12,
  recommendations: [
    { id: 1, action: 'Optimize Lambda cold starts', savings: '$0.20/mo', priority: 'medium' },
    { id: 2, action: 'Enable caching for frequent queries', savings: '$0.15/mo', priority: 'low' }
  ],
  forecast: {
    nextMonth: 3.5,
    trend: 'decreasing'
  },
  source: 'fallback'
}

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(`${N8N_BASE}/archon/costs`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    })
    
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error('N8N error')
    
    const data = await res.json()
    if (data.code === 0 || data.message?.includes('problem')) {
      return NextResponse.json(MOCK_COSTS)
    }
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(MOCK_COSTS)
  }
}
