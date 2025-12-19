import { NextRequest, NextResponse } from 'next/server';

const ENDPOINTS = {
  brain: 'https://jl67xd5pckkhjwdmnvhco2bg440grmtu.lambda-url.us-east-1.on.aws/',
  actions: 'https://qtomhtef66vivt7wzyit5nuzve0nzvbk.lambda-url.us-east-1.on.aws/',
  trend: 'https://mjfhxhcsi2u3o2pqhkj55rrlge0ucncm.lambda-url.us-east-1.on.aws/',
  intake: 'https://wbhdgr46itplcvosjioitclvga0mxlec.lambda-url.us-east-1.on.aws/',
  n8n: 'https://n8n.selfarchitectai.com/healthz',
  api: 'https://d6gy1zr8vj.execute-api.us-east-1.amazonaws.com/prod/health'
};

export const config = {
  runtime: 'edge',
};

async function checkEndpoint(name: string, url: string) {
  const start = Date.now();
  try {
    const response = await fetch(url, {
      method: name === 'n8n' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: name === 'n8n' ? undefined : JSON.stringify({ action: 'health' })
    });
    const latency = Date.now() - start;
    return { name, status: response.ok ? 'healthy' : 'degraded', latency, code: response.status };
  } catch (error) {
    return { name, status: 'error', latency: Date.now() - start, error: String(error) };
  }
}

export default async function handler(req: NextRequest) {
  const results = await Promise.all(
    Object.entries(ENDPOINTS).map(([name, url]) => checkEndpoint(name, url))
  );

  const healthy = results.filter(r => r.status === 'healthy').length;
  const total = results.length;

  return NextResponse.json({
    status: healthy === total ? 'healthy' : healthy > total / 2 ? 'degraded' : 'critical',
    summary: `${healthy}/${total} services healthy`,
    timestamp: new Date().toISOString(),
    services: results
  }, {
    headers: { 'Cache-Control': 'max-age=30' }
  });
}
