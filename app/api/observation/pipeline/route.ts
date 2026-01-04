import { NextResponse } from 'next/server'

// ARCHON Observation Pipeline Orchestrator
// Coordinates the full observation cycle:
// 1. Fetch content from targets
// 2. Compare with previous snapshots
// 3. Send diffs to GPT-5 for analysis
// 4. Generate observation report
// 5. Store in ARCHON memory

interface PipelineResult {
  timestamp: string
  pipeline_id: string
  stages: {
    name: string
    status: 'success' | 'failed' | 'skipped'
    duration_ms: number
    result?: any
    error?: string
  }[]
  summary: {
    total_duration_ms: number
    stages_completed: number
    stages_failed: number
    changes_detected: boolean
    anomalies_detected: boolean
  }
}

const pipelineHistory: PipelineResult[] = []

async function runPipelineStage(
  name: string,
  fn: () => Promise<any>
): Promise<{ status: 'success' | 'failed'; duration_ms: number; result?: any; error?: string }> {
  const start = Date.now()
  try {
    const result = await fn()
    return {
      status: 'success',
      duration_ms: Date.now() - start,
      result
    }
  } catch (e) {
    return {
      status: 'failed',
      duration_ms: Date.now() - start,
      error: String(e)
    }
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'archon-observation-pipeline',
    version: '1.0.0',
    description: 'Claude Assisted Observation Architecture (CAOA)',
    stages: [
      { name: 'fetch', endpoint: '/api/observation/fetch' },
      { name: 'diff', endpoint: '/api/observation/diff' },
      { name: 'analyze', endpoint: '/api/observation/analyze' },
      { name: 'report', endpoint: '/api/observation/report' }
    ],
    pipeline_runs: pipelineHistory.length,
    recent_runs: pipelineHistory.slice(0, 5).map(p => ({
      timestamp: p.timestamp,
      id: p.pipeline_id,
      duration: p.summary.total_duration_ms,
      stages_completed: p.summary.stages_completed,
      changes: p.summary.changes_detected
    }))
  })
}

export async function POST(request: Request) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  const pipelineId = `PIPE-${Date.now()}`
  
  try {
    const body = await request.json().catch(() => ({}))
    const { 
      targets = [
        'https://www.selfarchitectai.com',
        'https://dashboard.selfarchitectai.com',
        'https://n8n.selfarchitectai.com/webhook/archon/health'
      ],
      skip_stages = []
    } = body
    
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://dashboard.selfarchitectai.com'
    
    const stages: PipelineResult['stages'] = []
    let changesDetected = false
    let anomaliesDetected = false
    let fetchResults: any = null
    
    // Stage 1: Fetch content
    if (!skip_stages.includes('fetch')) {
      const fetchStage = await runPipelineStage('fetch', async () => {
        const res = await fetch(`${baseUrl}/api/observation/fetch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urls: targets })
        })
        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
        return await res.json()
      })
      stages.push({ name: 'fetch', ...fetchStage })
      fetchResults = fetchStage.result
    } else {
      stages.push({ name: 'fetch', status: 'skipped', duration_ms: 0 })
    }
    
    // Stage 2: Diff analysis
    if (!skip_stages.includes('diff') && fetchResults?.results) {
      const diffStage = await runPipelineStage('diff', async () => {
        const diffs = []
        for (const result of fetchResults.results) {
          const res = await fetch(`${baseUrl}/api/observation/diff`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: result.url,
              current: result,
              previous: null // Would fetch from storage in production
            })
          })
          if (res.ok) {
            const diff = await res.json()
            diffs.push(diff)
            if (diff.diff?.has_changes) changesDetected = true
            if (diff.diff?.anomalies?.length > 0) anomaliesDetected = true
          }
        }
        return { diffs, count: diffs.length }
      })
      stages.push({ name: 'diff', ...diffStage })
    } else {
      stages.push({ name: 'diff', status: 'skipped', duration_ms: 0 })
    }
    
    // Stage 3: GPT-5 Analysis
    if (!skip_stages.includes('analyze')) {
      const analyzeStage = await runPipelineStage('analyze', async () => {
        const res = await fetch(`${baseUrl}/api/observation/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            site_diff: fetchResults?.results?.[0],
            url: targets[0],
            timestamp,
            origin: 'observation-pipeline'
          })
        })
        if (!res.ok) throw new Error(`Analyze failed: ${res.status}`)
        return await res.json()
      })
      stages.push({ name: 'analyze', ...analyzeStage })
    } else {
      stages.push({ name: 'analyze', status: 'skipped', duration_ms: 0 })
    }
    
    // Stage 4: Generate Report
    if (!skip_stages.includes('report')) {
      const reportStage = await runPipelineStage('report', async () => {
        const res = await fetch(`${baseUrl}/api/observation/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format: 'json' })
        })
        if (!res.ok) throw new Error(`Report failed: ${res.status}`)
        return await res.json()
      })
      stages.push({ name: 'report', ...reportStage })
    } else {
      stages.push({ name: 'report', status: 'skipped', duration_ms: 0 })
    }
    
    // Build result
    const result: PipelineResult = {
      timestamp,
      pipeline_id: pipelineId,
      stages,
      summary: {
        total_duration_ms: Date.now() - startTime,
        stages_completed: stages.filter(s => s.status === 'success').length,
        stages_failed: stages.filter(s => s.status === 'failed').length,
        changes_detected: changesDetected,
        anomalies_detected: anomaliesDetected
      }
    }
    
    // Store result
    pipelineHistory.unshift(result)
    if (pipelineHistory.length > 50) pipelineHistory.pop()
    
    return NextResponse.json({
      success: true,
      ...result
    })
    
  } catch (e) {
    return NextResponse.json({ 
      error: String(e),
      pipeline_id: pipelineId,
      timestamp
    }, { status: 500 })
  }
}
