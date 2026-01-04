// /api/claude/trigger/route.ts
// Claude Event Trigger API - GPT-5 Trusted Event Exception System
// ARCHON V3.6 Dual-AI Architecture
// Updated: 2026-01-04

import { NextRequest, NextResponse } from 'next/server';

// ==============================
// TYPES
// ==============================

interface ClaudeTriggerPayload {
  trigger: string;
  source: string;
  approved?: boolean;
  trusted_override?: boolean;
  payload: {
    approved: boolean;
    build_target: string;
    snapshot_id?: string;
    reason?: string;
    trust_score?: number;
    deploy_mode?: string;
    description?: string;
  };
}

interface TriggerState {
  lastTriggered: Date | null;
  cooldownUntil: Date | null;
  totalTriggers: number;
  dailyTriggers: number;
  lastReset: Date;
}

interface SecurityGateResult {
  allowed: boolean;
  reason: string;
  gate?: string;
}

// ==============================
// CONFIGURATION
// ==============================

const TRUSTED_SOURCES = {
  "GPT-5": {
    allow_override: true,
    description: "GPT-5 may issue deploy triggers during supervisor mode",
    min_trust_score: 0.90
  },
  "system": {
    allow_override: true,
    description: "Internal system events for recovery and self-heal",
    min_trust_score: 0.85
  }
};

const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes
const MAX_DAILY_TRIGGERS = 10;

// In-memory state (would use Redis in production)
const triggerState: TriggerState = {
  lastTriggered: null,
  cooldownUntil: null,
  totalTriggers: 0,
  dailyTriggers: 0,
  lastReset: new Date()
};

// ==============================
// SECURITY GATES
// ==============================

function validateTrustedSource(source: string): boolean {
  return source in TRUSTED_SOURCES && TRUSTED_SOURCES[source as keyof typeof TRUSTED_SOURCES].allow_override;
}

function checkSecurityGates(payload: ClaudeTriggerPayload): SecurityGateResult {
  const source = payload.source;
  const trustScore = payload.payload?.trust_score ?? 1.0;
  
  // Gate 1: Source validation
  if (!validateTrustedSource(source)) {
    return {
      allowed: false,
      reason: `Source '${source}' not in trusted sources`,
      gate: "source_validation"
    };
  }
  
  // Gate 2: Trust score check
  const minTrust = TRUSTED_SOURCES[source as keyof typeof TRUSTED_SOURCES]?.min_trust_score ?? 0.90;
  if (trustScore < minTrust) {
    return {
      allowed: false,
      reason: `Trust score ${trustScore} below minimum ${minTrust}`,
      gate: "trust_score"
    };
  }
  
  // Gate 3: Approval check
  if (!payload.approved && !payload.trusted_override && !payload.payload?.approved) {
    return {
      allowed: false,
      reason: "Event not approved",
      gate: "approval_check"
    };
  }
  
  return {
    allowed: true,
    reason: "All security gates passed"
  };
}

function applyTrustedOverride(payload: ClaudeTriggerPayload): ClaudeTriggerPayload {
  const source = payload.source;
  const approved = payload.approved || payload.payload?.approved;
  
  // ✅ GPT-5 Trusted Exception Layer
  if (source in TRUSTED_SOURCES && approved) {
    const trustedSource = TRUSTED_SOURCES[source as keyof typeof TRUSTED_SOURCES];
    if (trustedSource.allow_override) {
      return {
        ...payload,
        trusted_override: true,
        payload: {
          ...payload.payload,
          deploy_via_supervisor: true,
          override_timestamp: new Date().toISOString(),
          override_reason: `Trusted source: ${source}`
        }
      };
    }
  }
  
  return payload;
}

// Reset daily counters at midnight
function resetDailyCountersIfNeeded() {
  const now = new Date();
  const lastResetDate = triggerState.lastReset.toDateString();
  const todayDate = now.toDateString();
  
  if (lastResetDate !== todayDate) {
    triggerState.dailyTriggers = 0;
    triggerState.lastReset = now;
  }
}

// ==============================
// HANDLERS
// ==============================

export async function POST(request: NextRequest) {
  try {
    // Reset daily counters if needed
    resetDailyCountersIfNeeded();
    
    // Auth check
    const authHeader = request.headers.get('x-archon-key');
    const expectedKey = process.env.ARCHON_LAMBDA_KEY || 'archon_cgpt_cf42eb69efc09a13e937e6d2374c0eb7';
    
    if (authHeader !== expectedKey) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Invalid API key' },
        { status: 401 }
      );
    }

    let body: ClaudeTriggerPayload = await request.json();
    
    // Apply trusted override if applicable
    body = applyTrustedOverride(body);
    
    // Security gates check
    const securityCheck = checkSecurityGates(body);
    if (!securityCheck.allowed) {
      return NextResponse.json(
        {
          error: 'Security gate failed',
          message: securityCheck.reason,
          gate: securityCheck.gate,
          claude_mode: 'supervisor',
          claude_handled_as: 'security_gate_failed'
        },
        { status: 403 }
      );
    }

    // Check cooldown (bypass for trusted_override with high priority)
    const isHighPriority = body.trigger === 'claude_recovery_handler';
    if (!isHighPriority && triggerState.cooldownUntil && new Date() < triggerState.cooldownUntil) {
      const remainingMs = triggerState.cooldownUntil.getTime() - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60000);
      return NextResponse.json(
        {
          error: 'Cooldown active',
          message: `Claude is in cooldown. Try again in ${remainingMin} minutes.`,
          cooldown_remaining_ms: remainingMs,
          trusted_override: body.trusted_override,
          claude_mode: 'supervisor'
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
          daily_triggers: triggerState.dailyTriggers,
          trusted_override: body.trusted_override,
          claude_mode: 'supervisor'
        },
        { status: 429 }
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
      message: 'Claude triggered successfully via trusted override',
      trigger_id: generateTriggerId(),
      trigger_type: body.trigger,
      source: body.source,
      trusted_override: body.trusted_override,
      claude_mode: 'supervisor',
      claude_handled_as: 'trusted_override',
      cooldown_until: triggerState.cooldownUntil.toISOString(),
      daily_triggers_remaining: MAX_DAILY_TRIGGERS - triggerState.dailyTriggers,
      security_gates: 'passed',
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
  resetDailyCountersIfNeeded();
  
  return NextResponse.json({
    status: 'ready',
    mode: 'supervisor',
    trusted_override_enabled: true,
    cooldown_active: triggerState.cooldownUntil ? new Date() < triggerState.cooldownUntil : false,
    cooldown_until: triggerState.cooldownUntil?.toISOString() || null,
    last_triggered: triggerState.lastTriggered?.toISOString() || null,
    total_triggers: triggerState.totalTriggers,
    daily_triggers: triggerState.dailyTriggers,
    daily_limit: MAX_DAILY_TRIGGERS,
    daily_remaining: MAX_DAILY_TRIGGERS - triggerState.dailyTriggers,
    trusted_sources: Object.keys(TRUSTED_SOURCES),
    available_triggers: [
      'claude_deploy_handler',
      'claude_recovery_handler',
      'claude_analysis_handler'
    ],
    security_gates: [
      'source_validation',
      'trust_score',
      'approval_check'
    ]
  });
}

// ==============================
// HELPER FUNCTIONS
// ==============================

async function processClaudeTrigger(payload: ClaudeTriggerPayload): Promise<object> {
  const triggerHandlers: Record<string, () => Promise<object>> = {
    'claude_deploy_handler': async () => {
      return {
        action: 'deploy',
        target: payload.payload.build_target,
        snapshot: payload.payload.snapshot_id,
        deploy_mode: payload.payload.deploy_mode || 'production',
        description: payload.payload.description,
        status: 'initiated',
        trusted_override: payload.trusted_override,
        via_supervisor: true
      };
    },
    'claude_recovery_handler': async () => {
      return {
        action: 'recovery',
        reason: payload.payload.reason,
        status: 'initiated',
        priority: 'high',
        trusted_override: payload.trusted_override,
        via_supervisor: true
      };
    },
    'claude_analysis_handler': async () => {
      return {
        action: 'analysis',
        status: 'initiated',
        trusted_override: payload.trusted_override,
        via_supervisor: true
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
    trusted_override: payload.trusted_override,
    payload: payload.payload,
    result,
    claude_mode: 'supervisor',
    claude_handled_as: 'trusted_override',
    security_gates: 'passed'
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

  // Also send to ARCHON trust log
  try {
    await fetch('https://www.selfarchitectai.com/api/archon/trust/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    });
  } catch (error) {
    console.error('Failed to log to ARCHON:', error);
  }
}

function generateTriggerId(): string {
  return `ct-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
