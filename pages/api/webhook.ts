import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

const N8N_WEBHOOKS = {
  deploy: 'https://n8n.selfarchitectai.com/webhook/archon-deploy',
  github: 'https://n8n.selfarchitectai.com/webhook/archon-github-webhook',
  customer: 'https://n8n.selfarchitectai.com/webhook/archon-customer'
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'deploy';
  
  const webhookUrl = N8N_WEBHOOKS[type as keyof typeof N8N_WEBHOOKS];
  
  if (!webhookUrl) {
    return NextResponse.json({ error: 'Invalid webhook type' }, { status: 400 });
  }

  try {
    const body = await req.json();
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        source: 'vercel-edge',
        timestamp: new Date().toISOString()
      })
    });

    return NextResponse.json({
      success: response.ok,
      webhook: type,
      status: response.status
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
