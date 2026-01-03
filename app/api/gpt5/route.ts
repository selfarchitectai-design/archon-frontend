import { NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GPT_MODEL = process.env.GPT_MODEL || 'gpt-4-turbo-preview'
const ARCHON_HEALTH_URL = 'https://n8n.selfarchitectai.com/webhook/archon/health'

interface GPTMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

async function fetchArchonHealth() {
  try {
    const res = await fetch(ARCHON_HEALTH_URL, { cache: 'no-store' })
    if (!res.ok) throw new Error('Health fetch failed')
    return await res.json()
  } catch (e) {
    console.error('Health fetch error:', e)
    return null
  }
}

async function callOpenAI(messages: GPTMessage[], maxTokens = 1000): Promise<string | { error: string }> {
  if (!OPENAI_API_KEY) {
    return { error: 'OPENAI_API_KEY not configured' }
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages,
        temperature: 0.2,
        max_tokens: maxTokens
      })
    })

    if (!res.ok) {
      const error = await res.text()
      return { error: `OpenAI API error: ${res.status} - ${error}` }
    }

    const data = await res.json()
    return data.choices[0].message.content
  } catch (e) {
    return { error: String(e) }
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    service: 'archon-gpt5-controller',
    model: GPT_MODEL,
    configured: !!OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action = 'analyze', query } = body
    const timestamp = new Date().toISOString()

    // Health check
    if (action === 'health') {
      return NextResponse.json({
        status: 'healthy',
        service: 'archon-gpt5-controller',
        model: GPT_MODEL,
        configured: !!OPENAI_API_KEY,
        timestamp
      })
    }

    // Verify GPT connection
    if (action === 'verify') {
      const testResponse = await callOpenAI([
        { role: 'user', content: 'Respond with exactly: ARCHON GPT-5 Controller Active' }
      ], 50)

      const isConnected = typeof testResponse === 'string' && !testResponse.includes('error')
      
      return NextResponse.json({
        status: 'ok',
        gpt5_connected: isConnected,
        response: testResponse,
        timestamp
      })
    }

    // Main analysis
    if (action === 'analyze' || action === 'trust') {
      // Fetch current ARCHON health
      const healthData = await fetchArchonHealth()

      // Build GPT prompt
      const systemPrompt = `You are ARCHON GPT-5 Controller, an AI system analyst for the ARCHON autonomous orchestration platform.

Analyze system health and provide actionable insights. Respond ONLY with valid JSON:
{
  "trust_score": 0.0-1.0,
  "trust_level": "CRITICAL|HIGH|BUILDING|LOW",
  "fault_source": "none|workflow|lambda|database|network",
  "trust_delta": -0.1 to +0.1,
  "cause": "brief description",
  "recommended_action": "specific action",
  "insights": ["insight1", "insight2", "insight3"],
  "verification_status": "verified|pending|failed"
}`

      const healthSummary = healthData ? JSON.stringify(healthData, null, 2) : 'Health data unavailable'
      
      const userPrompt = `Analyze ARCHON system:

${healthSummary}

${query ? `Query: ${query}` : ''}

JSON response only:`

      const analysis = await callOpenAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ])

      // Parse analysis
      let analysisJson: any = {}
      if (typeof analysis === 'string') {
        try {
          const cleanJson = analysis.replace(/```json\n?/g, '').replace(/```/g, '').trim()
          analysisJson = JSON.parse(cleanJson)
        } catch {
          analysisJson = {
            raw_analysis: analysis,
            trust_score: 0.5,
            trust_level: 'BUILDING',
            verification_status: 'pending'
          }
        }
      } else {
        analysisJson = analysis
      }

      return NextResponse.json({
        timestamp,
        source: 'gpt5-controller',
        model: GPT_MODEL,
        gpt5_connected: true,
        health_snapshot: {
          status: healthData?.status,
          workflows_active: healthData?.workflows?.active,
          success_rate: healthData?.executions?.rate,
          uptime: healthData?.system?.uptime
        },
        analysis: analysisJson
      })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })

  } catch (e) {
    console.error('GPT-5 Controller error:', e)
    return NextResponse.json({ 
      error: String(e),
      gpt5_connected: false 
    }, { status: 500 })
  }
}
