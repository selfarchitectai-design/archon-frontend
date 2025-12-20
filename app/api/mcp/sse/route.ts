/**
 * ARCHON MCP SSE Endpoint
 * Server-Sent Events transport for MCP clients
 */

import { NextRequest } from "next/server";

export const runtime = "edge";

const API_BASE = "https://selfarchitectai.com/api";

// MCP Tools (same as main endpoint)
const MCP_TOOLS = [
  { name: "get_system_health", description: "Get ARCHON system health status", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "get_system_status", description: "Get detailed infrastructure status", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "get_dashboard", description: "Get dashboard summary", inputSchema: { type: "object", properties: {}, required: [] } },
  { name: "trigger_n8n_workflow", description: "Trigger N8N workflow", inputSchema: { type: "object", properties: { webhook_path: { type: "string" }, payload: { type: "object" } }, required: ["webhook_path"] } },
  { name: "run_ai_analysis", description: "Run AI analysis", inputSchema: { type: "object", properties: { task: { type: "string" }, mode: { type: "string" } }, required: ["task"] } },
  { name: "chat_with_ai", description: "Chat with Claude AI", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } },
  { name: "store_kv", description: "Store KV value", inputSchema: { type: "object", properties: { key: { type: "string" }, value: { type: "object" }, ttl: { type: "number" } }, required: ["key", "value"] } },
  { name: "get_kv", description: "Get KV value", inputSchema: { type: "object", properties: { key: { type: "string" } }, required: ["key"] } },
  { name: "get_lambda_info", description: "Get Lambda info", inputSchema: { type: "object", properties: { function_name: { type: "string" } }, required: ["function_name"] } }
];

async function executeTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case "get_system_health": return await fetch(`${API_BASE}/health`).then(r => r.json());
      case "get_system_status": return await fetch(`${API_BASE}/system-status`).then(r => r.json());
      case "get_dashboard": return await fetch(`${API_BASE}/dashboard`).then(r => r.json());
      case "trigger_n8n_workflow": return await fetch(`${API_BASE}/n8n/trigger`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ webhookPath: args.webhook_path, payload: args.payload || {} }) }).then(r => r.json());
      case "run_ai_analysis": return await fetch(`${API_BASE}/workflow/demo`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: args.task, mode: args.mode || "assisted" }) }).then(r => r.json());
      case "chat_with_ai": return await fetch(`${API_BASE}/ai-chat`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: args.prompt }) }).then(r => r.json());
      case "store_kv": return await fetch(`${API_BASE}/kv`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: args.key, value: args.value, ttl: args.ttl }) }).then(r => r.json());
      case "get_kv": return await fetch(`${API_BASE}/kv?key=${encodeURIComponent(args.key)}`).then(r => r.json());
      case "get_lambda_info": return await fetch(`${API_BASE}/aws/lambda?functionName=${encodeURIComponent(args.function_name)}`).then(r => r.json());
      default: return { error: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      // Send server info
      const serverInfo = {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {
          serverInfo: { name: "ARCHON", version: "2.2.0" },
          capabilities: { tools: { listChanged: false } }
        }
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(serverInfo)}

`));
      
      // Keep connection alive
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`: keepalive

`));
      }, 30000);
      
      // Clean up on close
      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { method, params, id } = body;

    let result: any;

    switch (method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          serverInfo: { name: "ARCHON", version: "2.2.0" },
          capabilities: { tools: { listChanged: false } }
        };
        break;
      case "tools/list":
        result = { tools: MCP_TOOLS };
        break;
      case "tools/call":
        const toolResult = await executeTool(params.name, params.arguments || {});
        result = { content: [{ type: "text", text: JSON.stringify(toolResult, null, 2) }] };
        break;
      case "ping":
        result = {};
        break;
      default:
        return Response.json({ jsonrpc: "2.0", id, error: { code: -32601, message: "Method not found" } });
    }

    return Response.json({ jsonrpc: "2.0", id, result });
  } catch (error: any) {
    return Response.json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: error.message } }, { status: 400 });
  }
}
