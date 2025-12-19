/**
 * ARCHON KV Storage API
 * Uses Upstash Redis for fast key-value storage
 */

import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Initialize Redis client
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

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

    const value = await redis.get(key);

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
  } catch (error: any) {
    console.error('KV GET Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get value' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value, ttl } = await req.json();

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: 'Key and value are required' },
        { status: 400 }
      );
    }

    // Set with optional TTL (in seconds)
    if (ttl) {
      await redis.setex(key, ttl, value);
    } else {
      await redis.set(key, value);
    }

    return NextResponse.json({
      success: true,
      key,
      ttl: ttl || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('KV POST Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to set value' },
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

    await redis.del(key);

    return NextResponse.json({
      success: true,
      key,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('KV DELETE Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete key' },
      { status: 500 }
    );
  }
}
