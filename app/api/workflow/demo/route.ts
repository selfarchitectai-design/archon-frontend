/**
 * ARCHON Workflow Demo API
 * Demonstrates AI + KV integration
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

export async function POST(req: NextRequest) {
  try {
    const { task, mode = 'assisted' } = await req.json();

    if (!task) {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    // Generate unique workflow ID
    const workflowId = `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store workflow start state
    await redis.set(
      `workflow:${workflowId}:state`,
      JSON.stringify({
        status: 'running',
        task,
        mode,
        startTime: new Date().toISOString(),
      })
    );

    // Use AI to analyze the task
    const { text } = await generateText({
      model: anthropic('claude-sonnet-4-20250514', {
        baseURL: process.env.AI_GATEWAY_URL,
      }),
      prompt: `You are ARCHON V2.2, an AI operations platform. Analyze this task and provide a structured execution plan:

Task: ${task}
Mode: ${mode}

Provide your analysis in this format:
1. Task Understanding: [brief summary]
2. Execution Steps: [numbered steps]
3. Expected Outcome: [brief outcome]
4. Confidence Score: [0-100]

Keep it concise and actionable.`,
    });

    // Update workflow with results
    await redis.set(
      `workflow:${workflowId}:result`,
      JSON.stringify({
        analysis: text,
        completedAt: new Date().toISOString(),
      }),
      { ex: 3600 } // Expire after 1 hour
    );

    // Update state to completed
    await redis.set(
      `workflow:${workflowId}:state`,
      JSON.stringify({
        status: 'completed',
        task,
        mode,
        startTime: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      }),
      { ex: 3600 }
    );

    return NextResponse.json({
      workflowId,
      status: 'completed',
      analysis: text,
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Workflow Demo Error:', error);
    return NextResponse.json(
      { error: error.message || 'Workflow execution failed' },
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

    // Get workflow state and result
    const [stateStr, resultStr] = await Promise.all([
      redis.get(`workflow:${workflowId}:state`),
      redis.get(`workflow:${workflowId}:result`),
    ]);

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
  } catch (error: any) {
    console.error('Workflow GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get workflow' },
      { status: 500 }
    );
  }
}
