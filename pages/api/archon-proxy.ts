import { NextRequest, NextResponse } from 'next/server';

const LAMBDA_URLS = {
  brain: 'https://jl67xd5pckkhjwdmnvhco2bg440grmtu.lambda-url.us-east-1.on.aws/',
  actions: 'https://qtomhtef66vivt7wzyit5nuzve0nzvbk.lambda-url.us-east-1.on.aws/',
  trend: 'https://mjfhxhcsi2u3o2pqhkj55rrlge0ucncm.lambda-url.us-east-1.on.aws/',
  intake: 'https://wbhdgr46itplcvosjioitclvga0mxlec.lambda-url.us-east-1.on.aws/'
};

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const service = searchParams.get('service') || 'brain';
  
  const targetUrl = LAMBDA_URLS[service as keyof typeof LAMBDA_URLS];
  
  if (!targetUrl) {
    return NextResponse.json({ error: 'Invalid service' }, { status: 400 });
  }

  try {
    const body = await req.json();
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store',
        'X-ARCHON-Service': service,
        'X-ARCHON-Latency': response.headers.get('x-amzn-requestid') || 'unknown'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Proxy error', details: String(error) }, { status: 500 });
  }
}
