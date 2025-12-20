/**
 * ARCHON MCP Server Endpoint
 * Model Context Protocol (MCP) implementation for Vercel Edge
 * Supports: Claude Desktop, Cursor, and any MCP client
 */

import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

// ARCHON API Base
const API_BASE = "https://selfarchitectai.com/api";

// MCP Tool Definitions
const MCP_TOOLS = [
  {
    name: "get_system_health",
    description: "Get ARCHON system health status including all integrations",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "get_system_status", 
    description: "Get detailed ARCHON infrastructure status - Lambda, DynamoDB, S3, CloudFormation",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "get_dashboard",
    description: "Get ARCHON dashboard summary - active workflows, tasks completed, recent activity",
    inputSchema: { type: "object", properties: {}, required: [] }
  },
  {
    name: "trigger_n8n_workflow",
    description: "Trigger an N8N automation workflow via webhook",
    inputSchema: {
      type: "object",
      properties: {
        webhook_path: { type: "string", description: "Webhook path (e.g., archon-event, decision-action)" },
        payload: { type: "object", description: "Optional payload data" }
      },
      required: ["webhook_path"]
    }
  },
  {
    name: "run_ai_analysis",
    description: "Run AI-powered analysis workflow with Claude",
    inputSchema: {
      type: "object", 
      properties: {
        task: { type: "string", description: "Analysis task description" },
        mode: { type: "string", enum: ["assisted", "autonomous"], description: "Operation mode" }
      },
      required: ["task"]
    }
  },
  {
    name: "chat_with_ai",
    description: "Send a prompt to ARCHON AI (Claude Sonnet 4)",
    inputSchema: {
      type: "object",
      properties: {
        prompt: { type: "string", description: "Message or question to send" }
      },
      required: ["prompt"]
    }
  },
  {
    name: "store_kv",
    description: "Store a value in ARCHON KV storage (Redis)",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Storage key" },
        value: { type: "object", description: "JSON value to store" },
        ttl: { type: "number", description: "Optional TTL in seconds" }
      },
      required: ["key", "value"]
    }
  },
  {
    name: "get_kv",
    description: "Retrieve a value from ARCHON KV storage",
    inputSchema: {
      type: "object",
      properties: {
        key: { type: "string", description: "Storage key to retrieve" }
      },
      required: ["key"]
    }
  },
  {
    name: "get_lambda_info",
    description: "Get AWS Lambda function information",
    inputSchema: {
      type: "object",
      properties: {
        function_name: { type: "string", description: "Lambda function name" }
      },
      required: ["function_name"]
    }
  }
];

// MCP Resources
const MCP_RESOURCES = [
  {
    uri: "archon://docs/api",
    name: "API Documentation",
    description: "ARCHON API endpoint documentation",
    mimeType: "text/markdown"
  },
  {
    uri: "archon://workflows",
    name: "N8N Workflows", 
    description: "Available N8N automation workflows",
    mimeType: "text/markdown"
  },
  {
    uri: "archon://status",
    name: "Live Status",
    description: "Current system status (live)",
    mimeType: "application/json"
  }
];

// Tool execution
async function executeTool(name: string, args: any): Promise<any> {
  try {
    switch (name) {
      case "get_system_health":
        return await fetch(`${API_BASE}/health`).then(r => r.json());
      
      case "get_system_status":
        return await fetch(`${API_BASE}/system-status`).then(r => r.json());
      
      case "get_dashboard":
        return await fetch(`${API_BASE}/dashboard`).then(r => r.json());
      
      case "trigger_n8n_workflow":
        return await fetch(`${API_BASE}/n8n/trigger`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookPath: args.webhook_path, payload: args.payload || {} })
        }).then(r => r.json());
      
      case "run_ai_analysis":
        return await fetch(`${API_BASE}/workflow/demo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: args.task, mode: args.mode || "assisted" })
        }).then(r => r.json());
      
      case "chat_with_ai":
        return await fetch(`${API_BASE}/ai-chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: args.prompt })
        }).then(r => r.json());
      
      case "store_kv":
        return await fetch(`${API_BASE}/kv`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: args.key, value: args.value, ttl: args.ttl })
        }).then(r => r.json());
      
      case "get_kv":
        return await fetch(`${API_BASE}/kv?key=${encodeURIComponent(args.key)}`).then(r => r.json());
      
      case "get_lambda_info":
        return await fetch(`${API_BASE}/aws/lambda?functionName=${encodeURIComponent(args.function_name)}`).then(r => r.json());
      
      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (error: any) {
    return { error: error.message };
  }
}

// Resource content
async function getResourceContent(uri: string): Promise<string> {
  switch (uri) {
    case "archon://docs/api":
      return `# ARCHON API Documentation

## Base URL
https://selfarchitectai.com/api

## Endpoints

### Health & Status
- GET /health - System health check
- GET /system-status - Detailed infrastructure status  
- GET /dashboard - Dashboard summary

### AI & Workflows
- POST /ai-chat - Chat with Claude AI
- POST /workflow/demo - Run AI analysis workflow
- POST /n8n/trigger - Trigger N8N workflow

### Storage
- GET /kv?key=X - Get KV value
- POST /kv - Store KV value

### AWS
- GET /aws/lambda?functionName=X - Lambda info`;

    case "archon://workflows":
      return `# ARCHON N8N Workflows

## Active Webhooks (POST)
- archon-event - Event intake
- decision-action - Decision workflow  
- github-webhook - Auto deploy
- mcp-execute - MCP tool executor
- policy-gate - Policy validation

## Active Webhooks (GET)
- archon/health - Health check
- archon/status - Status check`;

    case "archon://status":
      const status = await fetch(`${API_BASE}/system-status`).then(r => r.json());
      return JSON.stringify(status, null, 2);

    default:
      return `Resource not found: ${uri}`;
  }
}

// JSON-RPC handler
async function handleJsonRpc(request: any): Promise<any> {
  const { method, params, id } = request;

  switch (method) {
    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          serverInfo: {
            name: "ARCHON",
            version: "2.2.0"
          },
          capabilities: {
            tools: { listChanged: false },
            resources: { subscribe: false, listChanged: false }
          }
        }
      };

    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS }
      };

    case "tools/call":
      const toolResult = await executeTool(params.name, params.arguments || {});
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(toolResult, null, 2) }]
        }
      };

    case "resources/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { resources: MCP_RESOURCES }
      };

    case "resources/read":
      const content = await getResourceContent(params.uri);
      return {
        jsonrpc: "2.0",
        id,
        result: {
          contents: [{ uri: params.uri, mimeType: "text/plain", text: content }]
        }
      };

    case "ping":
      return { jsonrpc: "2.0", id, result: {} };

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      };
  }
}

// GET - Server info
export async function GET(req: NextRequest) {
  return NextResponse.json({
    name: "ARCHON MCP Server",
    version: "2.2.0",
    protocol: "MCP 2024-11-05",
    transport: "HTTP",
    tools: MCP_TOOLS.length,
    resources: MCP_RESOURCES.length,
    endpoints: {
      mcp: "/api/mcp",
      sse: "/api/mcp/sse"
    },
    documentation: "https://selfarchitectai.com/api/mcp"
  });
}

// POST - JSON-RPC handler
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Handle batch requests
    if (Array.isArray(body)) {
      const results = await Promise.all(body.map(handleJsonRpc));
      return NextResponse.json(results);
    }
    
    const result = await handleJsonRpc(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error", data: error.message }
    }, { status: 400 });
  }
}

// OPTIONS - CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
}
