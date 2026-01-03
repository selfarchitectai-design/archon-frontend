import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

export async function GET() {
  try {
    const res = await fetch(`${N8N_BASE}/archon/costs`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!res.ok) {
      throw new Error(`N8N responded with ${res.status}`)
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Costs API error:', error)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      costs: { totalMonthly: 0, currency: 'USD' },
      optimization: { recommendations: [], potentialSavings: 0 },
      budget: { monthly: 50, used: 0, remaining: 50, onTrack: true }
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const res = await fetch(`${N8N_BASE}/archon/optimize`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed' }, { status: 500 })
  }
}
