// /api/claude/trigger/route.ts
// Claude Event Trigger API - GPT-5 controlled wake-on-event system
// ARCHON V3.6 Dual-AI Architecture

import { NextRequest, NextResponse } from 'next/server';

interface ClaudeTriggerPayload {
  trigger: string;
  source: string;
  payload: {
    approved: boolean;
    build_target: string;
    snapshot_id?: string;
    reason?: string;
    trust_score?: number;
  };
}

interface TriggerState {
  lastTriggered: Date | null;
  cooldownUntil: Date | null;
  totalTriggers: number;
  dailyTriggers: number;
}

// In-memory state (would use Redis in production)
const triggerState: TriggerState = {
  lastTriggered: null,
  cooldownUntil: null,
  totalTriggers: 0,
  dailyTriggers: 0
};

const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const MAX_DAILY_TRIGGERS = 10;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('x-archon-key');
    const expectedKey = process.env.ARCHON_LAMBDA_KEY || 'archon_cgpt_cf42eb69efc09a13e937e6d2374c0eb7';
    
    if (authHeader !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid API key' },
        { status: 401 }
      );
    }

    const body: ClaudeTriggerPayload = await request.json();
    
    // Validate source
    if (body.source !== 'GPT-5' && body.source !== 'system') {
      return NextResponse.json(
        { error: 'Invalid source', message: 'Only GPT-5 or system can trigger Claude' },
        { status: 403 }
      );
    }

    // Check cooldown
    if (triggerState.cooldownUntil && new Date() < triggerState.cooldownUntil) {
      const remainingMs = triggerState.cooldownUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return NextResponse.json(
        { 
          error: 'Cooldown active',
          message: `Claude is in cooldown. Try again in ${remainingMin} minutes.`,
          cooldown_remaining_ms: remainingMs
        },
        { status: 429 }
      );
    }

    // Check daily limit
    if (triggerState.dailyTriggers >= MAX_DAILY_TRIGGERS) {
      return NextResponse.json(
        { 
          error: 'Daily limit reached',
          message: `Maximum ${MAX_DAILY_TRIGGERS} Claude triggers per day. Cost optimization active.`,
          daily_triggers: triggerState.dailyTriggers
        },
        { status: 429 }
      );
    }

    // Validate trust score if provided
    if (body.payload.trust_score !== undefined && body.payload.trust_score < 0.90) {
      return NextResponse.json(
        { 
          error: 'Trust threshold not met',
          message: 'Trust score must be >= 0.90 for Claude trigger',
          current_trust: body.payload.trust_score
        },
        { status: 403 }
      );
    }

    // Process trigger
    const triggerResult = await processClaudeTrigger(body);

    // Update state
    triggerState.lastTriggered = new Date();
    triggerState.cooldownUntil = new Date(Date.now() + COOLDOWN_MS);
    triggerState.totalTriggers++;
    triggerState.dailyTriggers++;

    // Log trigger event
    await logTriggerEvent(body, triggerResult);

    return NextResponse.json({
      success: true,
      message: 'Claude triggered successfully',
      trigger_id: generateTriggerId(),
      trigger_type: body.trigger,
      source: body.source,
      cooldown_until: triggerState.cooldownUntil.toISOString(),
      daily_triggers_remaining: MAX_DAILY_TRIGGERS - triggerState.dailyTriggers,
      result: triggerResult
    });

  } catch (error) {
    console.error('Claude trigger error:', error);
    return NextResponse.json(
      { error: 'Trigger failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'ready',
    mode: 'event-triggered',
    cooldown_active: triggerState.cooldownUntil ? new Date() < triggerState.cooldownUntil : false,
    cooldown_until: triggerState.cooldownUntil?.toISOString() || null,
    last_triggered: triggerState.lastTriggered?.toISOString() || null,
    total_triggers: triggerState.totalTriggers,
    daily_triggers: triggerState.dailyTriggers,
    daily_limit: MAX_DAILY_TRIGGERS,
    daily_remaining: MAX_DAILY_TRIGGERS - triggerState.dailyTriggers,
    allowed_sources: ['GPT-5', 'system'],
    available_triggers: [
      'claude_deploy_handler',
      'claude_recovery_handler',
      'claude_analysis_handler'
    ]
  });
}

async function processClaudeTrigger(payload: ClaudeTriggerPayload): Promise<object> {
  const triggerHandlers: Record<string, () => Promise<object>> = {
    'claude_deploy_handler': async () => {
      // Trigger deploy execution
      return {
        action: 'deploy',
        target: payload.payload.build_target,
        snapshot: payload.payload.snapshot_id,
        status: 'initiated'
      };
    },
    'claude_recovery_handler': async () => {
      // Trigger recovery mode
      return {
        action: 'recovery',
        reason: payload.payload.reason,
        status: 'initiated'
      };
    },
    'claude_analysis_handler': async () => {
      // Trigger deep analysis
      return {
        action: 'analysis',
        status: 'initiated'
      };
    }
  };

  const handler = triggerHandlers[payload.trigger];
  if (!handler) {
    throw new Error(`Unknown trigger: ${payload.trigger}`);
  }

  return handler();
}

async function logTriggerEvent(payload: ClaudeTriggerPayload, result: object): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    trigger: payload.trigger,
    source: payload.source,
    payload: payload.payload,
    result,
    triggered_by: 'GPT-5',
    claude_invoked: true
  };

  // Send to n8n for logging
  try {
    await fetch('https://n8n.selfarchitectai.com/webhook/claude-trigger-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
  } catch (error) {
    console.error('Failed to log trigger event:', error);
  }
}

function generateTriggerId(): string {
  return `ct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
