/**
 * ARCHON Workflow Demo API
 * Simplified version without external SDKs
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper function for Redis REST API
async function redisCommand(command: string, ...args: (string | number)[]): Promise<any> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    return null;
  }

  const response = await fetch(`${url}/${command}/${args.join('/')}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return data.result;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const task = body.task as string;
    const mode = body.mode as string || 'assisted';

    if (!task) {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store workflow state in KV
    await redisCommand(
      'SET',
      `workflow:${workflowId}:state`,
      JSON.stringify({
        status: 'running',
        task,
        mode,
        startTime: new Date().toISOString(),
      })
    );

    // Call Anthropic API directly
    const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AI_GATEWAY_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{
          role: 'user',
          content: `Analyze this task: ${task} (Mode: ${mode}). Provide brief analysis with steps.`
        }],
      }),
    });

    if (!aiResponse.ok) {
      throw new Error('AI request failed');
    }

    const aiData = await aiResponse.json() as any;
    const analysisText = aiData.content?.[0]?.text || 'Analysis not available';

    // Store result
    await redisCommand(
      'SETEX',
      `workflow:${workflowId}:result`,
      3600,
      JSON.stringify({
        analysis: analysisText,
        completedAt: new Date().toISOString(),
      })
    );

    return NextResponse.json({
      workflowId,
      status: 'completed',
      analysis: analysisText,
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Workflow Demo Error:', error);
    return NextResponse.json(
      { error: 'Workflow execution failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workflowId = searchParams.get('id');

    if (!workflowId) {
      return NextResponse.json(
        { error: 'Workflow ID is required' },
        { status: 400 }
      );
    }

    const stateStr = await redisCommand('GET', `workflow:${workflowId}:state`);
    const resultStr = await redisCommand('GET', `workflow:${workflowId}:result`);

    if (!stateStr) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    const state = JSON.parse(stateStr as string);
    const result = resultStr ? JSON.parse(resultStr as string) : null;

    return NextResponse.json({
      workflowId,
      state,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Workflow GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to get workflow' },
      { status: 500 }
    );
  }
}
