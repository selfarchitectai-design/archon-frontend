/**
 * ARCHON AI Chat API
 * Uses Vercel AI Gateway with Anthropic Claude
 */

import { anthropic } from '@ai-sdk/anthropic';
import { generateText } from 'ai';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { prompt, model = 'claude-sonnet-4-20250514' } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Use AI SDK with AI Gateway
    const { text, usage } = await generateText({
      model: anthropic(model, {
        baseURL: process.env.AI_GATEWAY_URL,
      }),
      prompt,
    });

    return NextResponse.json({
      response: text,
      usage,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI request failed' },
      { status: 500 }
    );
  }
}
