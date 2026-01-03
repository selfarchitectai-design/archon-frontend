import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'report'
  
  try {
    const endpoint = type === 'trend' ? 'archon/trend' : 'archon/report'
    const res = await fetch(`${N8N_BASE}/${endpoint}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' }
    })
    
    if (!res.ok) {
      throw new Error(`N8N responded with ${res.status}`)
    }
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Report API error:', error)
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      summary: { status: 'offline', headline: 'Unable to fetch report' },
      metrics: { last24h: { executions: 0, success: 0, errors: 0, successRate: 0 } },
      insights: ['⚠️ Connection to N8N failed']
    }, { status: 500 })
  }
}
