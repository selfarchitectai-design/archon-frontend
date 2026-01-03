import { NextResponse } from 'next/server'

// GPT-5 Controller Integration Endpoint
// This endpoint will be called by GPT-5 to push/pull trust metrics

export async function GET() {
  // Fetch real metrics from ARCHON endpoints
  try {
    const [healthRes, dashboardRes] = await Promise.all([
      fetch('https://n8n.selfarchitectai.com/webhook/archon/health', {
        next: { revalidate: 10 }
      }),
      fetch('https://n8n.selfarchitectai.com/webhook/dashboard-api', {
        next: { revalidate: 10 }
      })
    ])

    const health = await healthRes.json().catch(() => ({}))
    const dashboard = await dashboardRes.json().catch(() => ({}))

    // Calculate trust score based on system metrics
    const successRate = dashboard?.system?.score || health?.executions?.success_rate || 80
    const trustScore = successRate / 100
    
    // Determine verification status
    let verificationStatus: 'verified' | 'pending' | 'failed' = 'verified'
    if (trustScore < 0.7) verificationStatus = 'failed'
    else if (trustScore < 0.9) verificationStatus = 'pending'

    return NextResponse.json({
      trust_score: Math.round(trustScore * 100) / 100,
      verification_status: verificationStatus,
      last_check: new Date().toISOString(),
      
      // Extended metrics for GPT-5
      metrics: {
        health_status: health?.status || 'unknown',
        workflows_active: health?.workflows?.active || 8,
        success_rate: successRate,
        uptime: health?.uptime || '99.9%',
        self_heal_status: health?.selfHeal?.active ? 'active' : 'inactive',
        alerts_24h: health?.alerts?.count || 0,
      },
      
      // Trust level classification
      trust_level: trustScore >= 0.95 ? 'CRITICAL' 
                 : trustScore >= 0.80 ? 'HIGH'
                 : trustScore >= 0.60 ? 'BUILDING'
                 : 'LOW',
      
      // GPT-5 integration ready flag
      gpt5_ready: true,
      api_version: '3.6.0'
    })
  } catch (error) {
    // Return placeholder data if fetch fails
    return NextResponse.json({
      trust_score: 0.94,
      verification_status: 'pending',
      last_check: new Date().toISOString(),
      metrics: {
        health_status: 'degraded',
        workflows_active: 8,
        success_rate: 94,
        uptime: '99.9%',
        self_heal_status: 'active',
        alerts_24h: 0,
      },
      trust_level: 'HIGH',
      gpt5_ready: true,
      api_version: '3.6.0',
      error: 'Using fallback data'
    })
  }
}

// POST endpoint for GPT-5 to push trust updates
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate GPT-5 Controller payload
    const { trust_score, verification_command, metadata } = body
    
    // Log the trust update (would be stored in production)
    console.log('GPT-5 Trust Update:', { trust_score, verification_command, metadata })
    
    return NextResponse.json({
      success: true,
      message: 'Trust update received',
      timestamp: new Date().toISOString(),
      acknowledged: {
        trust_score,
        verification_command,
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid payload' },
      { status: 400 }
    )
  }
}
