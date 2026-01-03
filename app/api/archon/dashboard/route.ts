import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

export async function GET() {
  try {
    const res = await fetch(`${N8N_BASE}/dashboard-api`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!res.ok) {
      throw new Error(`N8N responded with ${res.status}`)
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      system: { status: 'offline', score: 0 },
      trust: { level: 'UNKNOWN', score: 0 }
    }, { status: 500 })
  }
}
