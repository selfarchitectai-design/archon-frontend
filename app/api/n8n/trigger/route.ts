/**
 * ARCHON N8N Webhook Integration
 * Trigger and monitor N8N workflows
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// N8N Configuration
const N8N_BASE_URL = process.env.N8N_BASE_URL || 'https://your-n8n-instance.com';
const N8N_API_KEY = process.env.N8N_API_KEY || '';

// Helper function for Redis (workflow state)
async function redisCommand(command: string, ...args: (string | number)[]): Promise<any> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) return null;

  const response = await fetch(`${url}/${command}/${args.join('/')}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.result;
}

/**
 * Trigger N8N Workflow
 * POST /api/n8n/trigger
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const workflowId = body.workflowId as string;
    const payload = body.payload || {};
    const webhookPath = body.webhookPath as string;

    if (!workflowId && !webhookPath) {
      return NextResponse.json(
        { error: 'workflowId or webhookPath is required' },
        { status: 400 }
      );
    }

    // Generate execution ID
    const executionId = `n8n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store execution state
    await redisCommand(
      'SET',
      `n8n:execution:${executionId}`,
      JSON.stringify({
        workflowId,
        status: 'triggered',
        payload,
        triggeredAt: new Date().toISOString(),
      })
    );

    // Trigger N8N workflow via webhook
    const webhookUrl = webhookPath 
      ? `${N8N_BASE_URL}/webhook/${webhookPath}`
      : `${N8N_BASE_URL}/webhook-test/${workflowId}`;

    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_API_KEY ? { 'X-N8N-API-KEY': N8N_API_KEY } : {})
      },
      body: JSON.stringify({
        ...payload,
        executionId,
        source: 'archon',
      }),
    });

    if (!n8nResponse.ok) {
      throw new Error(`N8N webhook failed: ${n8nResponse.statusText}`);
    }

    const result = await n8nResponse.json();

    // Update execution state
    await redisCommand(
      'SETEX',
      `n8n:execution:${executionId}`,
      3600,
      JSON.stringify({
        workflowId,
        status: 'completed',
        payload,
        result,
        triggeredAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      executionId,
      workflowId,
      status: 'completed',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('N8N Trigger Error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger N8N workflow' },
      { status: 500 }
    );
  }
}

/**
 * Get N8N Execution Status
 * GET /api/n8n/trigger?executionId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const executionId = searchParams.get('executionId');

    if (!executionId) {
      return NextResponse.json(
        { error: 'executionId is required' },
        { status: 400 }
      );
    }

    // Get execution from KV
    const executionStr = await redisCommand('GET', `n8n:execution:${executionId}`);

    if (!executionStr) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    const execution = JSON.parse(executionStr as string);

    return NextResponse.json({
      executionId,
      ...execution,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('N8N Status Error:', error);
    return NextResponse.json(
      { error: 'Failed to get execution status' },
      { status: 500 }
    );
  }
}

/**
 * List Recent N8N Executions
 * GET /api/n8n/trigger?list=true
 */
export async function OPTIONS(req: NextRequest) {
  // CORS for N8N webhooks calling back
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-N8N-API-KEY',
    },
  });
}
