import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const res = await fetch(`${N8N_BASE}/archon/verify`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Verify API error:', error)
    return NextResponse.json({
      success: false,
      verification: { status: 'error', validated: false },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
