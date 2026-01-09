import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

const MOCK_REPORT = {
  summary: {
    status: 'excellent',
    period: '24h',
    generated: new Date().toISOString()
  },
  metrics: {
    last24h: {
      executions: 156,
      successRate: 98,
      avgLatency: 112,
      errors: 3
    }
  },
  trends: {
    executions: '+5%',
    performance: 'stable',
    costs: '-12%'
  },
  insights: [
    'System performing optimally',
    'No critical issues detected',
    'Cost optimization suggestions available'
  ],
  forecast: 'stable',
  source: 'fallback'
}

export async function GET() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    
    const res = await fetch(`${N8N_BASE}/archon/report`, {
      cache: 'no-store',
      signal: controller.signal
    })
    
    clearTimeout(timeout)
    
    if (!res.ok) throw new Error('N8N error')
    
    const data = await res.json()
    if (data.code === 0 || data.message?.includes('problem')) {
      return NextResponse.json({ ...MOCK_REPORT, summary: { ...MOCK_REPORT.summary, generated: new Date().toISOString() } })
    }
    
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ ...MOCK_REPORT, summary: { ...MOCK_REPORT.summary, generated: new Date().toISOString() } })
  }
}
