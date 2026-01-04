import { NextResponse } from 'next/server'

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
const GPT_MODEL = process.env.GPT_MODEL || 'gpt-4-turbo-preview'

interface ObservationAnalysis {
  timestamp: string
  url: string
  analysis_type: 'diff' | 'anomaly' | 'trend'
  findings: {
    category: string
    severity: 'info' | 'warning' | 'critical'
    description: string
    recommendation: string
  }[]
  trend_summary: {
    direction: 'stable' | 'improving' | 'degrading'
    confidence: number
    key_metrics: Record<string, any>
  }
  gpt5_insights: string[]
  raw_analysis?: string
}

// Store analysis results
const analysisHistory: ObservationAnalysis[] = []
const MAX_ANALYSIS_HISTORY = 50

async function analyzeWithGPT5(data: any): Promise<any> {
  if (!OPENAI_API_KEY) {
    return { error: 'OPENAI_API_KEY not configured' }
  }

  const systemPrompt = `You are ARCHON Observation Analyzer, part of the Claude Assisted Observation Architecture (CAOA).

Analyze the provided website/API observation data and return JSON only:
{
  "findings": [
    {
      "category": "ui_change|api_change|performance|error|content",
      "severity": "info|warning|critical",
      "description": "what changed",
      "recommendation": "what action to take"
    }
  ],
  "trend_summary": {
    "direction": "stable|improving|degrading",
    "confidence": 0.0-1.0,
    "key_metrics": {}
  },
  "insights": ["insight1", "insight2", "insight3"],
  "anomaly_detected": true/false,
  "requires_action": true/false
}`

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
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analyze this observation data:\n${JSON.stringify(data, null, 2)}` }
        ],
        temperature: 0.2,
        max_tokens: 1000
      })
    })

    if (!res.ok) {
      return { error: `GPT API error: ${res.status}` }
    }

    const result = await res.json()
    const content = result.choices[0].message.content

    try {
      const cleaned = content.replace(/```json\n?/g, '').replace(/```/g, '').trim()
      return JSON.parse(cleaned)
    } catch {
      return { raw: content }
    }
  } catch (e) {
    return { error: String(e) }
  }
}

async function sendToLambdaBridge(analysis: ObservationAnalysis) {
  try {
    await fetch('https://mbjd75sopjbqu5smvdfngwh5wa0kgewv.lambda-url.us-east-1.on.aws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'archon_cgpt_cf42eb69efc09a13e937e6d2374c0eb7'
      },
      body: JSON.stringify({
        action: 'store_observation',
        data: {
          type: 'observation_analysis',
          analysis
        }
      })
    })
  } catch (e) {
    console.error('Lambda Bridge notification failed:', e)
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'archon-observation-analyzer',
    gpt5_connected: !!OPENAI_API_KEY,
    model: GPT_MODEL,
    analysis_count: analysisHistory.length,
    recent_analyses: analysisHistory.slice(0, 5).map(a => ({
      timestamp: a.timestamp,
      url: a.url,
      type: a.analysis_type,
      findings_count: a.findings.length,
      trend: a.trend_summary.direction
    }))
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { site_diff, url, timestamp, origin, diff_data, anomalies } = body
    
    const analysisTimestamp = new Date().toISOString()
    const targetUrl = url || site_diff?.url || 'unknown'
    
    // Prepare data for GPT-5 analysis
    const dataToAnalyze = {
      url: targetUrl,
      timestamp,
      origin: origin || 'observation-pipeline',
      diff: site_diff || diff_data,
      anomalies: anomalies || site_diff?.anomalies || [],
      changes: site_diff?.changes || diff_data?.changes || []
    }
    
    // Get GPT-5 analysis
    const gptAnalysis = await analyzeWithGPT5(dataToAnalyze)
    
    // Build analysis result
    const analysis: ObservationAnalysis = {
      timestamp: analysisTimestamp,
      url: targetUrl,
      analysis_type: anomalies?.length > 0 ? 'anomaly' : 'diff',
      findings: gptAnalysis.findings || [{
        category: 'observation',
        severity: 'info',
        description: 'Observation recorded',
        recommendation: 'Continue monitoring'
      }],
      trend_summary: gptAnalysis.trend_summary || {
        direction: 'stable',
        confidence: 0.8,
        key_metrics: {}
      },
      gpt5_insights: gptAnalysis.insights || [],
      raw_analysis: gptAnalysis.raw
    }
    
    // Store analysis
    analysisHistory.unshift(analysis)
    if (analysisHistory.length > MAX_ANALYSIS_HISTORY) analysisHistory.pop()
    
    // Send to Lambda Bridge for ARCHON Memory
    await sendToLambdaBridge(analysis)
    
    return NextResponse.json({
      success: true,
      timestamp: analysisTimestamp,
      url: targetUrl,
      gpt5_connected: !!OPENAI_API_KEY,
      analysis,
      requires_action: gptAnalysis.requires_action || false,
      anomaly_detected: gptAnalysis.anomaly_detected || false
    })
    
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
