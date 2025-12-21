/**
 * ARCHON Real-Time Status API
 * Live health checks for all infrastructure components
 * Returns: green/yellow/red status for each component
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// Configuration
const N8N_BASE = "https://n8n.selfarchitectai.com";

interface ComponentStatus {
  name: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
  lastCheck: string;
}

interface SystemHealth {
  overall: "green" | "yellow" | "red";
  score: number;
  components: ComponentStatus[];
  timestamp: string;
  refreshInterval: number;
}

// Custom thresholds for specific services (in ms)
const THRESHOLDS: Record<string, { green: number; yellow: number }> = {
  "AI Chat (Claude)": { green: 5000, yellow: 10000 }, // Claude API is slower
  default: { green: 1000, yellow: 3000 },
};

function getThreshold(name: string) {
  return THRESHOLDS[name] || THRESHOLDS.default;
}

async function checkEndpoint(
  name: string,
  url: string,
  method: string = "GET",
  body?: any,
  headers?: Record<string, string>
): Promise<ComponentStatus> {
  const start = Date.now();
  const threshold = getThreshold(name);
  
  try {
    const opts: RequestInit = {
      method,
      headers: { "Content-Type": "application/json", ...headers },
    };
    if (body) opts.body = JSON.stringify(body);
    
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
    opts.signal = controller.signal;
    
    const response = await fetch(url, opts);
    clearTimeout(timeout);
    
    const latency = Date.now() - start;
    
    let status: "green" | "yellow" | "red" = "red";
    let message = `HTTP ${response.status}`;
    
    if (response.ok) {
      // Use custom thresholds
      status = latency < threshold.green ? "green" : latency < threshold.yellow ? "yellow" : "red";
      message = `OK (${latency}ms)`;
    } else if (response.status < 500) {
      status = "yellow";
      message = `Warning: ${response.status}`;
    }
    
    return { name, status, latency, message, lastCheck: new Date().toISOString() };
  } catch (error: any) {
    return {
      name,
      status: "red",
      latency: Date.now() - start,
      message: error.name === "AbortError" ? "Timeout" : error.message?.slice(0, 50) || "Connection failed",
      lastCheck: new Date().toISOString(),
    };
  }
}

export async function GET(req: NextRequest) {
  const components: ComponentStatus[] = [];
  
  // 1. Vercel API Health
  components.push(await checkEndpoint("Vercel Health API", "https://selfarchitectai.com/api/health"));
  
  // 2. Vercel Dashboard API
  components.push(await checkEndpoint("Vercel Dashboard API", "https://selfarchitectai.com/api/dashboard"));
  
  // 3. AI Chat API (with extended threshold)
  components.push(
    await checkEndpoint("AI Chat (Claude)", "https://selfarchitectai.com/api/ai-chat", "POST", {
      prompt: "respond OK",
    })
  );
  
  // 4. KV Storage
  const kvKey = `health:${Date.now()}`;
  components.push(
    await checkEndpoint("KV Storage", "https://selfarchitectai.com/api/kv", "POST", {
      key: kvKey,
      value: { test: true },
      ttl: 60,
    })
  );
  
  // 5. MCP Server
  components.push(
    await checkEndpoint("MCP Server", "https://selfarchitectai.com/api/mcp", "POST", {
      jsonrpc: "2.0",
      method: "ping",
      id: 1,
    })
  );
  
  // 6. N8N Platform Health
  components.push(await checkEndpoint("N8N Platform", `${N8N_BASE}/healthz`));
  
  // 7. N8N Webhooks
  const webhooks = ["archon/health", "archon-event"];
  for (const wh of webhooks) {
    const method = wh.includes("/") ? "GET" : "POST";
    const url = `${N8N_BASE}/webhook/${wh}`;
    components.push(
      await checkEndpoint(
        `N8N Webhook: ${wh}`,
        url,
        method,
        method === "POST" ? { health: true } : undefined
      )
    );
  }
  
  // Note: N8N API removed - requires authentication, webhooks are sufficient for health checks
  
  // 8. Lambda Functions
  const lambdas = ["brain", "actions", "trend", "intake"];
  for (const fn of lambdas) {
    components.push(
      await checkEndpoint(
        `Lambda: ${fn}`,
        `https://selfarchitectai.com/api/aws/lambda?functionName=archon-${fn}-prod`
      )
    );
  }
  
  // Calculate overall health
  const greenCount = components.filter((c) => c.status === "green").length;
  const yellowCount = components.filter((c) => c.status === "yellow").length;
  const redCount = components.filter((c) => c.status === "red").length;
  const total = components.length;
  
  const score = Math.round(((greenCount * 100 + yellowCount * 50) / (total * 100)) * 100);
  
  let overall: "green" | "yellow" | "red" = "green";
  if (redCount > 0) overall = redCount > total / 2 ? "red" : "yellow";
  else if (yellowCount > total / 3) overall = "yellow";
  
  const health: SystemHealth = {
    overall,
    score,
    components,
    timestamp: new Date().toISOString(),
    refreshInterval: 30,
  };
  
  return NextResponse.json(health, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
