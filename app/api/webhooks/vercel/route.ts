import { NextResponse } from 'next/server'

// Vercel Webhook Event Handler for ARCHON Deployment Pipeline
// Handles: deployment.created, deployment.ready, deployment.error

interface VercelWebhookPayload {
  type: string
  createdAt: number
  payload: {
    deployment: {
      id: string
      name: string
      url: string
      meta?: Record<string, string>
    }
    project: {
      id: string
      name: string
    }
    target?: string
    user?: {
      id: string
      email: string
    }
  }
}

// In-memory event log (production would use DB)
const deployEvents: Array<{
  type: string
  timestamp: string
  deploymentId: string
  status: string
  url?: string
}> = []

async function notifyLambdaBridge(event: any) {
  try {
    const res = await fetch('https://mbjd75sopjbqu5smvdfngwh5wa0kgewv.lambda-url.us-east-1.on.aws', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'archon_cgpt_cf42eb69efc09a13e937e6d2374c0eb7'
      },
      body: JSON.stringify({
        action: 'log_event',
        event_type: 'vercel_deploy',
        data: event
      })
    })
    return res.ok
  } catch (e) {
    console.error('Lambda Bridge notification failed:', e)
    return false
  }
}

async function triggerTrustUpdate(status: string) {
  try {
    await fetch('/api/archon/trust', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verification_command: 'deploy_complete',
        metadata: { source: 'vercel_webhook', status }
      })
    })
  } catch (e) {
    console.error('Trust update failed:', e)
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'archon-vercel-webhook',
    events_logged: deployEvents.length,
    recent_events: deployEvents.slice(-5),
    supported_events: [
      'deployment.created',
      'deployment.ready', 
      'deployment.succeeded',
      'deployment.error',
      'deployment.canceled'
    ]
  })
}

export async function POST(request: Request) {
  try {
    const payload: VercelWebhookPayload = await request.json()
    const timestamp = new Date().toISOString()
    
    console.log(`[Vercel Webhook] ${payload.type} received`)
    
    const event = {
      type: payload.type,
      timestamp,
      deploymentId: payload.payload?.deployment?.id || 'unknown',
      status: 'received',
      url: payload.payload?.deployment?.url
    }
    
    // Handle different event types
    switch (payload.type) {
      case 'deployment.created':
        event.status = 'building'
        console.log(`[Deploy] Build started: ${event.deploymentId}`)
        break
        
      case 'deployment.ready':
      case 'deployment.succeeded':
        event.status = 'success'
        console.log(`[Deploy] ✅ Success: ${event.url}`)
        // Trigger trust update on successful deploy
        await triggerTrustUpdate('success')
        break
        
      case 'deployment.error':
        event.status = 'failed'
        console.log(`[Deploy] ❌ Failed: ${event.deploymentId}`)
        // Could trigger auto-rollback here
        break
        
      case 'deployment.canceled':
        event.status = 'canceled'
        break
        
      default:
        event.status = 'unknown'
    }
    
    // Log event
    deployEvents.push(event)
    if (deployEvents.length > 100) deployEvents.shift() // Keep last 100
    
    // Notify Lambda Bridge
    const lambdaNotified = await notifyLambdaBridge(event)
    
    return NextResponse.json({
      received: true,
      event_type: payload.type,
      deployment_id: event.deploymentId,
      status: event.status,
      lambda_notified: lambdaNotified,
      timestamp
    })
    
  } catch (e) {
    console.error('Webhook processing error:', e)
    return NextResponse.json({ error: String(e) }, { status: 400 })
  }
}
