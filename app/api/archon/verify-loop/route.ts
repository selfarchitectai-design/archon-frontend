import { NextResponse } from 'next/server'

const VERIFY_ENDPOINTS = [
  { name: 'health', url: '/api/archon/health', critical: true },
  { name: 'trust', url: '/api/archon/trust', critical: true },
  { name: 'gpt5', url: '/api/gpt5', critical: false },
  { name: 'dashboard', url: '/api/archon/dashboard', critical: true },
  { name: 'mcp', url: '/api/archon/mcp', critical: false },
]

const AUTO_HEAL_THRESHOLD = 0.85

interface VerifyResult {
  endpoint: string
  status: 'healthy' | 'degraded' | 'failed'
  latency: number
  critical: boolean
  error?: string
}

async function verifyEndpoint(endpoint: typeof VERIFY_ENDPOINTS[0], baseUrl: string): Promise<VerifyResult> {
  const start = Date.now()
  try {
    const res = await fetch(`${baseUrl}${endpoint.url}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    })
    const latency = Date.now() - start
    
    if (!res.ok) {
      return {
        endpoint: endpoint.name,
        status: 'failed',
        latency,
        critical: endpoint.critical,
        error: `HTTP ${res.status}`
      }
    }
    
    return {
      endpoint: endpoint.name,
      status: latency < 2000 ? 'healthy' : 'degraded',
      latency,
      critical: endpoint.critical
    }
  } catch (e) {
    return {
      endpoint: endpoint.name,
      status: 'failed',
      latency: Date.now() - start,
      critical: endpoint.critical,
      error: String(e)
    }
  }
}

async function triggerAutoHeal(failedEndpoints: string[]) {
  console.log(`[Auto-Heal] Triggered for: ${failedEndpoints.join(', ')}`)
  
  // Call heal endpoint
  try {
    const res = await fetch('https://n8n.selfarchitectai.com/webhook/archon/heal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'auto_heal',
        failed_endpoints: failedEndpoints,
        timestamp: new Date().toISOString()
      })
    })
    return res.ok
  } catch {
    return false
  }
}

export async function GET(request: Request) {
  const timestamp = new Date().toISOString()
  const baseUrl = new URL(request.url).origin
  
  // Run all verifications in parallel
  const results = await Promise.all(
    VERIFY_ENDPOINTS.map(ep => verifyEndpoint(ep, baseUrl))
  )
  
  // Calculate health score
  const criticalEndpoints = results.filter(r => r.critical)
  const healthyCritical = criticalEndpoints.filter(r => r.status === 'healthy').length
  const healthScore = criticalEndpoints.length > 0 
    ? healthyCritical / criticalEndpoints.length 
    : 0
  
  // Check if auto-heal needed
  const failedCritical = results
    .filter(r => r.critical && r.status === 'failed')
    .map(r => r.endpoint)
  
  let autoHealTriggered = false
  if (healthScore < AUTO_HEAL_THRESHOLD && failedCritical.length > 0) {
    autoHealTriggered = await triggerAutoHeal(failedCritical)
  }
  
  // Determine overall status
  let overallStatus = 'healthy'
  if (healthScore < 0.5) overallStatus = 'critical'
  else if (healthScore < AUTO_HEAL_THRESHOLD) overallStatus = 'degraded'
  
  return NextResponse.json({
    timestamp,
    overall_status: overallStatus,
    health_score: Math.round(healthScore * 100) / 100,
    threshold: AUTO_HEAL_THRESHOLD,
    auto_heal_triggered: autoHealTriggered,
    verify_results: results,
    summary: {
      total: results.length,
      healthy: results.filter(r => r.status === 'healthy').length,
      degraded: results.filter(r => r.status === 'degraded').length,
      failed: results.filter(r => r.status === 'failed').length,
    },
    next_check: '10m',
    policy: '/archon/config/policy.yaml'
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'force_verify') {
      // Trigger immediate verification
      const baseUrl = new URL(request.url).origin
      const results = await Promise.all(
        VERIFY_ENDPOINTS.map(ep => verifyEndpoint(ep, baseUrl))
      )
      
      return NextResponse.json({
        action: 'force_verify',
        timestamp: new Date().toISOString(),
        results
      })
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
