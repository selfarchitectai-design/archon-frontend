import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, query } = body

    if (!mode || !query) {
      return NextResponse.json(
        { error: 'Mode and query are required' },
        { status: 400 }
      )
    }

    // Map modes to N8N webhook endpoints
    const webhookMap: Record<string, string> = {
      executive: 'daily',
      cto: 'decisions',
      operations: 'decision-action',
      health: 'archon/health',
    }

    const webhook = webhookMap[mode]
    if (!webhook) {
      return NextResponse.json(
        { error: 'Invalid mode' },
        { status: 400 }
      )
    }

    // Call N8N webhook
    const n8nResponse = await fetch(
      `https://n8n.selfarchitectai.com/webhook/${webhook}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          mode,
          timestamp: new Date().toISOString(),
        }),
      }
    )

    if (!n8nResponse.ok) {
      throw new Error(`N8N returned ${n8nResponse.status}`)
    }

    const data = await n8nResponse.json()

    return NextResponse.json({
      success: true,
      mode,
      response: data.message || data.response || JSON.stringify(data),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    modes: ['executive', 'cto', 'operations', 'health'],
    message: 'ARCHON Mode API is running',
  })
}
