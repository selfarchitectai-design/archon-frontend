/**
 * ARCHON AI Chat API
 * Direct Anthropic API integration
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const prompt = body.prompt as string;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Direct Anthropic API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.AI_GATEWAY_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI request failed: ${errorText}`);
    }

    const data = await response.json() as any;

    return NextResponse.json({
      response: data.content?.[0]?.text || 'No response',
      usage: data.usage,
      model: 'claude-sonnet-4-20250514',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: 'AI request failed' },
      { status: 500 }
    );
  }
}
