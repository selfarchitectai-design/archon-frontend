import { NextResponse } from 'next/server'

// In-memory snapshot storage
interface Snapshot {
  url: string
  timestamp: string
  content: string
  contentType: string
  statusCode: number
  responseTime: number
  contentLength: number
  hash: string
}

const snapshots: Map<string, Snapshot[]> = new Map()
const MAX_SNAPSHOTS_PER_URL = 10

function hashContent(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16)
}

async function fetchUrl(url: string): Promise<Snapshot> {
  const start = Date.now()
  
  try {
    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'User-Agent': 'ARCHON-Observation-Bot/1.0',
        'Accept': 'text/html,application/json,*/*'
      },
      signal: AbortSignal.timeout(30000)
    })
    
    const responseTime = Date.now() - start
    const contentType = res.headers.get('content-type') || 'unknown'
    const content = await res.text()
    
    return {
      url,
      timestamp: new Date().toISOString(),
      content,
      contentType,
      statusCode: res.status,
      responseTime,
      contentLength: content.length,
      hash: hashContent(content)
    }
  } catch (e) {
    return {
      url,
      timestamp: new Date().toISOString(),
      content: '',
      contentType: 'error',
      statusCode: 0,
      responseTime: Date.now() - start,
      contentLength: 0,
      hash: 'error-' + Date.now()
    }
  }
}

function storeSnapshot(snapshot: Snapshot) {
  const existing = snapshots.get(snapshot.url) || []
  existing.unshift(snapshot)
  if (existing.length > MAX_SNAPSHOTS_PER_URL) existing.pop()
  snapshots.set(snapshot.url, existing)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')
  
  if (url) {
    const urlSnapshots = snapshots.get(url) || []
    return NextResponse.json({
      url,
      snapshot_count: urlSnapshots.length,
      snapshots: urlSnapshots.map(s => ({
        timestamp: s.timestamp,
        statusCode: s.statusCode,
        responseTime: s.responseTime,
        contentLength: s.contentLength,
        hash: s.hash
      }))
    })
  }
  
  const allUrls = Array.from(snapshots.keys())
  return NextResponse.json({
    status: 'active',
    service: 'archon-observation-fetcher',
    tracked_urls: allUrls.length,
    urls: allUrls.map(u => ({
      url: u,
      snapshots: snapshots.get(u)?.length || 0,
      latest: snapshots.get(u)?.[0]?.timestamp
    }))
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { urls, url } = body
    
    const targetUrls = urls || (url ? [url] : [
      'https://www.selfarchitectai.com',
      'https://dashboard.selfarchitectai.com',
      'https://n8n.selfarchitectai.com/webhook/archon/health'
    ])
    
    const results: Snapshot[] = []
    
    for (const targetUrl of targetUrls) {
      console.log(`[Observation] Fetching: ${targetUrl}`)
      const snapshot = await fetchUrl(targetUrl)
      storeSnapshot(snapshot)
      results.push(snapshot)
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      fetched: results.length,
      results: results.map(r => ({
        url: r.url,
        statusCode: r.statusCode,
        responseTime: r.responseTime,
        contentLength: r.contentLength,
        contentType: r.contentType,
        hash: r.hash,
        hasContent: r.content.length > 0
      }))
    })
    
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
