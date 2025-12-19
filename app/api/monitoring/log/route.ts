/**
 * ARCHON Monitoring & Observability
 * Centralized logging, metrics, and health monitoring
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper for Redis
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
 * Log Event
 * POST /api/monitoring/log
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const level = body.level as string || 'info'; // 'info' | 'warn' | 'error'
    const message = body.message as string;
    const context = body.context || {};
    const source = body.source as string || 'unknown';

    if (!message) {
      return NextResponse.json(
        { error: 'message is required' },
        { status: 400 }
      );
    }

    const logId = `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const logEntry = {
      id: logId,
      level,
      message,
      source,
      context,
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development',
    };

    // Store log in KV (with TTL)
    await redisCommand(
      'SETEX',
      `log:${logId}`,
      86400, // 24 hours
      JSON.stringify(logEntry)
    );

    // Increment metrics
    await redisCommand('INCR', `metrics:logs:${level}:count`);
    await redisCommand('INCR', `metrics:logs:${source}:count`);

    // Send to external monitoring (if configured)
    const sentryDsn = process.env.SENTRY_DSN;
    if (sentryDsn && level === 'error') {
      await fetch('https://sentry.io/api/0/store/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Sentry-Auth': `Sentry sentry_key=${sentryDsn}`,
        },
        body: JSON.stringify({
          message,
          level: 'error',
          tags: { source, environment: process.env.VERCEL_ENV },
          extra: context,
        }),
      }).catch(() => {}); // Silent fail
    }

    return NextResponse.json({
      logId,
      logged: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Logging Error:', error);
    return NextResponse.json(
      { error: 'Failed to log event' },
      { status: 500 }
    );
  }
}

/**
 * Get Logs
 * GET /api/monitoring/log?level=error&limit=10
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level') || 'all';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get recent logs from KV
    // In production, would query a proper logging service

    return NextResponse.json({
      logs: [],
      level,
      limit,
      message: 'Log retrieval - implement with proper logging service',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Get Logs Error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve logs' },
      { status: 500 }
    );
  }
}

/**
 * Get Metrics
 * GET /api/monitoring/metrics
 */
export async function PATCH(req: NextRequest) {
  try {
    // Get metrics from Redis
    const [
      infoCount,
      warnCount,
      errorCount,
      apiCalls,
      workflowExecutions,
    ] = await Promise.all([
      redisCommand('GET', 'metrics:logs:info:count'),
      redisCommand('GET', 'metrics:logs:warn:count'),
      redisCommand('GET', 'metrics:logs:error:count'),
      redisCommand('GET', 'metrics:api:calls:count'),
      redisCommand('GET', 'metrics:workflows:count'),
    ]);

    return NextResponse.json({
      logs: {
        info: parseInt(infoCount || '0'),
        warn: parseInt(warnCount || '0'),
        error: parseInt(errorCount || '0'),
      },
      api: {
        calls: parseInt(apiCalls || '0'),
      },
      workflows: {
        executions: parseInt(workflowExecutions || '0'),
      },
      uptime: process.uptime ? process.uptime() : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Metrics Error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}
