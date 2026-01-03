import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

export async function GET() {
  try {
    const res = await fetch(`${N8N_BASE}/archon/health`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!res.ok) {
      throw new Error(`N8N responded with ${res.status}`)
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Health API error:', error)
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch from N8N',
      workflows: { active: 0, total: 0 },
      system: { status: 'offline', score: 0 }
    }, { status: 500 })
  }
}
