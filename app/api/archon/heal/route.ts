import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action = 'heal' } = body
    
    let endpoint = 'archon/heal'
    if (action === 'rollback') endpoint = 'archon/rollback'
    if (action === 'snapshot') endpoint = 'archon/snapshot'
    
    const res = await fetch(`${N8N_BASE}/${endpoint}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Heal API error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to connect to N8N',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
