/**
 * ARCHON KV Storage API
 * Uses Upstash Redis for fast key-value storage
 */

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Helper function to make Redis REST API calls
async function redisCommand(command: string, ...args: (string | number)[]): Promise<any> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  
  if (!url || !token) {
    throw new Error('KV credentials not configured');
  }

  const response = await fetch(`${url}/${command}/${args.join('/')}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Redis command failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.result;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    const value = await redisCommand('GET', key);

    if (value === null) {
      return NextResponse.json(
        { error: 'Key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      key,
      value,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('KV GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to get value' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const key = body.key as string;
    const value = body.value;
    const ttl = body.ttl as number | undefined;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Set with optional TTL (in seconds)
    if (ttl) {
      await redisCommand('SETEX', key, ttl, JSON.stringify(value));
    } else {
      await redisCommand('SET', key, JSON.stringify(value));
    }

    return NextResponse.json({
      success: true,
      key,
      ttl: ttl || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('KV POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to set value' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Key parameter is required' },
        { status: 400 }
      );
    }

    await redisCommand('DEL', key);

    return NextResponse.json({
      success: true,
      key,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('KV DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete key' },
      { status: 500 }
    );
  }
}
