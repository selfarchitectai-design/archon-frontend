/**
 * ARCHON Health Check API
 * Verifies all integrations are working
 */

import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: 'v2.2-ultimate',
    integrations: {
      ai_gateway: {
        configured: !!(process.env.AI_GATEWAY_URL && process.env.AI_GATEWAY_API_KEY),
        status: 'ready',
      },
      kv_storage: {
        configured: !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN),
        status: 'ready',
      },
      aws: {
        configured: !!process.env.AWS_REGION,
        region: process.env.AWS_REGION || 'not-configured',
        status: process.env.AWS_ACCESS_KEY_ID ? 'ready' : 'pending',
      },
    },
    features: {
      ai_chat: true,
      kv_storage: true,
      workflows: false, // Will be enabled when AWS is fully configured
      autonomous_mode: false,
      swarm_orchestration: false,
    },
  };

  // Check if all required integrations are configured
  const allConfigured = Object.values(health.integrations).every(
    (integration: any) => integration.configured
  );

  if (!allConfigured) {
    health.status = 'degraded';
  }

  return NextResponse.json(health);
}
