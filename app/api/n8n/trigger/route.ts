/**
 * ARCHON N8N Webhook Integration
 * Simplified for Edge Runtime
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const N8N_WEBHOOK_BASE = "https://n8n.selfarchitectai.com/webhook";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const webhookPath = body.webhookPath as string;
    const workflowId = body.workflowId as string;
    const payload = body.payload || {};

    if (!webhookPath && !workflowId) {
      return NextResponse.json(
        { error: "webhookPath or workflowId is required" },
        { status: 400 }
      );
    }

    const webhookUrl = webhookPath
      ? `${N8N_WEBHOOK_BASE}/${webhookPath}`
      : `${N8N_WEBHOOK_BASE}-test/${workflowId}`;

    const n8nResponse = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, source: "archon-api" }),
    });

    const result = await n8nResponse.json();

    return NextResponse.json({
      success: true,
      webhookPath,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "N8N trigger failed", details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({
    service: "n8n-trigger",
    status: "ready",
    webhookBase: "https://n8n.selfarchitectai.com/webhook",
  });
}
