import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

const MOCK_TRUST = {
  trustLevel: 'HIGH',
  score: 87,
  trend: 'stable',
  components: {
    health: { score: 100, weight: 0.3 },
    performance: { score: 96, weight: 0.25 },
    reliability: { score: 98, weight: 0.25 },
    security: { score: 96, weight: 0.2 }
  },
  history: [85, 86, 87, 87, 87],
  recommendation: 'System operating within trusted parameters',
  source: 'fallback'
}

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(`${N8N_BASE}/archon/event`, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'trust_check' })
    })
    
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error('N8N error')
    
    const data = await res.json()
    if (data.code === 0 || data.message?.includes('problem')) {
      return NextResponse.json(MOCK_TRUST)
    }
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(MOCK_TRUST)
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(`${N8N_BASE}/archon/event`, {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    clearTimeout(timeout)
    
    const data = await res.json()
    if (data.code === 0 || data.message?.includes('problem')) {
      return NextResponse.json({ ...MOCK_TRUST, event: body })
    }
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(MOCK_TRUST)
  }
}
