import { NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GPT_MODEL = process.env.GPT_MODEL || 'gpt-4-turbo-preview'

interface TrustMetrics {
  trust_score: number
  verification_status: string
  last_check: string
  metrics: {
    health_status: string
    workflows_active: number
    success_rate: number
    uptime: string
    self_heal_status: string
    alerts_24h: number
  }
  trust_level: string
  gpt5_ready: boolean
  gpt5_connected: boolean
  gpt5_analysis?: GPT5Analysis
  last_gpt5_sync?: string
  api_version: string
}

interface GPT5Analysis {
  trust_score?: number
  trust_level?: string
  fault_source?: string
  trust_delta?: number
  cause?: string
  recommended_action?: string
  insights?: string[]
  verification_status?: string
  raw?: string
}

// In-memory store for GPT-5 data (in production, use Redis/DB)
let gpt5Data: GPT5Analysis | null = null
let lastGpt5Update: string | null = null

async function fetchHealthData() {
  try {
    const res = await fetch('https://n8n.selfarchitectai.com/webhook/archon/health', {
      cache: 'no-store'
    })
    if (!res.ok) throw new Error('Health fetch failed')
    return await res.json()
  } catch (e) {
    console.error('Health fetch error:', e)
    return null
  }
}

async function callGPT5ForAnalysis(healthData: any): Promise<GPT5Analysis | null> {
  if (!OPENAI_API_KEY) return null

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: GPT_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are ARCHON Trust Analyzer. Analyze system health and return JSON only:
{"trust_score":0.0-1.0,"trust_level":"CRITICAL|HIGH|BUILDING|LOW","fault_source":"none|workflow|lambda|database","cause":"brief issue description or none","recommended_action":"action or maintain current state","insights":["insight1","insight2","insight3"]}`
          },
          {
            role: 'user',
            content: `Analyze this ARCHON system health data and provide trust assessment:\n${JSON.stringify(healthData, null, 2)}`
          }
        ],
        temperature: 0.2,
        max_tokens: 500
      })
    })

    if (!res.ok) {
      console.error('GPT API error:', res.status)
      return null
    }

    const data = await res.json()
    const content = data.choices[0].message.content
    
    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```/g, '').trim()
      return JSON.parse(cleaned)
    } catch {
      return { raw: content }
    }
  } catch (e) {
    console.error('GPT-5 analysis error:', e)
    return null
  }
}

export async function GET() {
  const timestamp = new Date().toISOString()
  
  // Fetch current health
  const healthData = await fetchHealthData()
  
  // Calculate base trust score from health data
  const successRate = healthData?.executions?.rate ?? healthData?.executions?.success_rate ?? 0
  const workflowsActive = healthData?.workflows?.active ?? 0
  const systemStatus = healthData?.status ?? 'unknown'
  
  // Base trust score calculation
  let trustScore = successRate / 100
  if (systemStatus !== 'healthy') trustScore *= 0.8
  if (workflowsActive < 5) trustScore *= 0.9
  
  // Determine trust level
  let trustLevel = 'LOW'
  let verificationStatus = 'failed'
  
  if (trustScore >= 0.95) {
    trustLevel = 'CRITICAL'
    verificationStatus = 'verified'
  } else if (trustScore >= 0.80) {
    trustLevel = 'HIGH'
    verificationStatus = 'verified'
  } else if (trustScore >= 0.60) {
    trustLevel = 'BUILDING'
    verificationStatus = 'pending'
  }

  // Check GPT-5 connection
  const gpt5Connected = !!OPENAI_API_KEY
  
  // Get GPT-5 analysis if connected and no recent data
  let gpt5Analysis = gpt5Data
  const shouldRefresh = !lastGpt5Update || 
    (Date.now() - new Date(lastGpt5Update).getTime()) > 60000 // Refresh every 60s
  
  if (gpt5Connected && shouldRefresh && healthData) {
    const newAnalysis = await callGPT5ForAnalysis(healthData)
    if (newAnalysis) {
      gpt5Data = newAnalysis
      gpt5Analysis = newAnalysis
      lastGpt5Update = timestamp
      
      // Override trust score with GPT-5 analysis if available
      if (newAnalysis.trust_score !== undefined) {
        trustScore = newAnalysis.trust_score
      }
      if (newAnalysis.trust_level) {
        trustLevel = newAnalysis.trust_level
      }
      if (newAnalysis.verification_status) {
        verificationStatus = newAnalysis.verification_status
      }
    }
  }

  const response: TrustMetrics = {
    trust_score: Math.round(trustScore * 100) / 100,
    verification_status: verificationStatus,
    last_check: timestamp,
    metrics: {
      health_status: systemStatus,
      workflows_active: workflowsActive,
      success_rate: successRate,
      uptime: healthData?.system?.uptime?.toString() ?? '99.9%',
      self_heal_status: healthData?.self_heal?.status ?? 'inactive',
      alerts_24h: healthData?.alerts?.count ?? 0
    },
    trust_level: trustLevel,
    gpt5_ready: true,
    gpt5_connected: gpt5Connected,
    api_version: '3.6.1'
  }

  if (gpt5Analysis) {
    response.gpt5_analysis = gpt5Analysis
  }
  
  if (lastGpt5Update) {
    response.last_gpt5_sync = lastGpt5Update
  }

  return NextResponse.json(response)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { trust_score, verification_command, metadata, analysis } = body

    // Store GPT-5 pushed data
    if (metadata?.source === 'gpt5_controller' || analysis) {
      gpt5Data = analysis || body
      lastGpt5Update = new Date().toISOString()
    }

    console.log('GPT-5 Trust Update:', { trust_score, verification_command, metadata })

    return NextResponse.json({
      status: 'received',
      success: true,
      timestamp: new Date().toISOString(),
      trust_score_updated: trust_score !== undefined,
      command: verification_command,
      gpt5_data_stored: !!gpt5Data
    })
  } catch (e) {
    return NextResponse.json({ error: String(e), success: false }, { status: 400 })
  }
}
