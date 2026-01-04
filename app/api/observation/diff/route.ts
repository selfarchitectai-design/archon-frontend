import { NextResponse } from 'next/server'

interface DiffResult {
  url: string
  timestamp: string
  previous_timestamp: string | null
  has_changes: boolean
  change_summary: {
    content_changed: boolean
    status_changed: boolean
    size_change_percent: number
    response_time_delta: number
  }
  changes: DiffChange[]
  anomalies: Anomaly[]
}

interface DiffChange {
  type: 'added' | 'removed' | 'modified'
  location: string
  description: string
  severity: 'info' | 'warning' | 'critical'
}

interface Anomaly {
  type: string
  message: string
  severity: 'info' | 'warning' | 'critical'
  detected_at: string
}

// Stored diffs
const diffHistory: Map<string, DiffResult[]> = new Map()
const MAX_DIFFS_PER_URL = 20

// Simple text diff - finds differences between two strings
function findTextDiffs(previous: string, current: string): DiffChange[] {
  const changes: DiffChange[] = []
  
  // Compare by lines
  const prevLines = previous.split('\n')
  const currLines = current.split('\n')
  
  // Very basic diff - just note size changes
  const sizeDiff = currLines.length - prevLines.length
  
  if (sizeDiff > 0) {
    changes.push({
      type: 'added',
      location: 'content',
      description: `${sizeDiff} lines added`,
      severity: 'info'
    })
  } else if (sizeDiff < 0) {
    changes.push({
      type: 'removed',
      location: 'content',
      description: `${Math.abs(sizeDiff)} lines removed`,
      severity: Math.abs(sizeDiff) > 50 ? 'warning' : 'info'
    })
  }
  
  // Check for specific patterns
  if (current.includes('error') && !previous.includes('error')) {
    changes.push({
      type: 'added',
      location: 'error_indicator',
      description: 'Error content detected in page',
      severity: 'critical'
    })
  }
  
  if (previous.includes('healthy') && !current.includes('healthy')) {
    changes.push({
      type: 'removed',
      location: 'health_status',
      description: 'Health indicator removed',
      severity: 'warning'
    })
  }
  
  return changes
}

function detectAnomalies(current: any, previous: any | null): Anomaly[] {
  const anomalies: Anomaly[] = []
  const now = new Date().toISOString()
  
  // Status code anomaly
  if (current.statusCode !== 200) {
    anomalies.push({
      type: 'status_error',
      message: `HTTP ${current.statusCode} response`,
      severity: current.statusCode >= 500 ? 'critical' : 'warning',
      detected_at: now
    })
  }
  
  // Response time anomaly
  if (current.responseTime > 5000) {
    anomalies.push({
      type: 'latency_spike',
      message: `Response time ${current.responseTime}ms exceeds 5s threshold`,
      severity: 'warning',
      detected_at: now
    })
  }
  
  // Content missing
  if (current.contentLength === 0) {
    anomalies.push({
      type: 'content_missing',
      message: 'No content returned from URL',
      severity: 'critical',
      detected_at: now
    })
  }
  
  // Large content change
  if (previous) {
    const changePercent = Math.abs(current.contentLength - previous.contentLength) / (previous.contentLength || 1) * 100
    if (changePercent > 50) {
      anomalies.push({
        type: 'major_content_change',
        message: `Content size changed by ${changePercent.toFixed(1)}%`,
        severity: changePercent > 80 ? 'critical' : 'warning',
        detected_at: now
      })
    }
  }
  
  return anomalies
}

async function fetchLatestSnapshots(url: string) {
  // Fetch from our observation fetcher
  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : 'https://dashboard.selfarchitectai.com'
    
    const res = await fetch(`${baseUrl}/api/observation/fetch?url=${encodeURIComponent(url)}`, {
      cache: 'no-store'
    })
    
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (url) {
    const diffs = diffHistory.get(url) || []
    return NextResponse.json({
      url,
      diff_count: diffs.length,
      diffs: diffs.slice(0, 10)
    })
  }
  
  // Return all diffs summary
  const allUrls = Array.from(diffHistory.keys())
  return NextResponse.json({
    status: 'active',
    service: 'archon-diff-engine',
    tracked_urls: allUrls.length,
    urls: allUrls.map(u => ({
      url: u,
      diff_count: diffHistory.get(u)?.length || 0,
      latest_change: diffHistory.get(u)?.[0]?.timestamp,
      has_anomalies: (diffHistory.get(u)?.[0]?.anomalies?.length ?? 0) > 0
    }))
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { url, current, previous } = body
    
    if (!url || !current) {
      return NextResponse.json({ error: 'url and current snapshot required' }, { status: 400 })
    }
    
    const timestamp = new Date().toISOString()
    
    // Calculate diff
    const changes: DiffChange[] = []
    
    // Check if hash changed
    const hashChanged = previous ? current.hash !== previous.hash : true
    
    // Calculate size change
    const sizeChangePct = previous 
      ? (current.contentLength - previous.contentLength) / (previous.contentLength || 1) * 100 
      : 0
    
    // Response time delta
    const responseTimeDelta = previous 
      ? current.responseTime - previous.responseTime 
      : 0
    
    // Find text differences if content changed
    if (hashChanged && previous?.content && current.content) {
      changes.push(...findTextDiffs(previous.content, current.content))
    }
    
    // Detect anomalies
    const anomalies = detectAnomalies(current, previous)
    
    const diffResult: DiffResult = {
      url,
      timestamp,
      previous_timestamp: previous?.timestamp || null,
      has_changes: hashChanged,
      change_summary: {
        content_changed: hashChanged,
        status_changed: previous ? current.statusCode !== previous.statusCode : false,
        size_change_percent: Math.round(sizeChangePct * 100) / 100,
        response_time_delta: responseTimeDelta
      },
      changes,
      anomalies
    }
    
    // Store diff
    const existing = diffHistory.get(url) || []
    existing.unshift(diffResult)
    if (existing.length > MAX_DIFFS_PER_URL) existing.pop()
    diffHistory.set(url, existing)
    
    return NextResponse.json({
      success: true,
      diff: diffResult
    })
    
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
