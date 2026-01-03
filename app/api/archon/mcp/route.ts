import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const res = await fetch(`${N8N_BASE}/mcp`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    
    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('MCP API error:', error)
    return NextResponse.json({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32000, message: 'Failed to connect to N8N MCP Server' }
    }, { status: 500 })
  }
}
