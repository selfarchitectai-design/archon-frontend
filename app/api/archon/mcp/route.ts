import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

const MCP_TOOLS = [
  { name: 'archon/health', description: 'Get ARCHON system health status', category: 'monitoring' },
  { name: 'archon/metrics', description: 'Get telemetry metrics', category: 'monitoring' },
  { name: 'archon/alerts', description: 'Get active alerts', category: 'monitoring' },
  { name: 'archon/heal', description: 'Trigger self-healing process', category: 'operations' },
  { name: 'archon/deploy', description: 'Trigger deployment pipeline', category: 'operations' },
  { name: 'archon/verify', description: 'Verify action completion', category: 'operations' },
  { name: 'archon/rollback', description: 'Rollback to previous state', category: 'operations' },
  { name: 'archon/snapshot', description: 'Create system snapshot', category: 'operations' },
  { name: 'archon/db/status', description: 'Get PostgreSQL status', category: 'database' },
  { name: 'archon/db/query', description: 'Execute database query', category: 'database' },
  { name: 'archon/db/backup', description: 'Create database backup', category: 'database' },
  { name: 'archon/security/audit', description: 'Run security audit', category: 'security' },
  { name: 'archon/security/scan', description: 'Run vulnerability scan', category: 'security' },
  { name: 'archon/backup', description: 'Create system backup', category: 'backup' },
  { name: 'archon/restore', description: 'Restore from backup', category: 'backup' },
  { name: 'archon/dr-status', description: 'Get disaster recovery status', category: 'backup' },
  { name: 'archon/report', description: 'Generate system report', category: 'reporting' },
  { name: 'archon/costs', description: 'Get cost analysis', category: 'reporting' },
  { name: 'archon/trust', description: 'Get trust score metrics', category: 'reporting' },
  { name: 'archon/pipeline', description: 'Get pipeline status', category: 'orchestration' },
  { name: 'archon/orchestrate', description: 'Run orchestration workflow', category: 'orchestration' }
]

const MCP_SERVER_INFO = {
  name: 'ARCHON MCP Server',
  version: '3.6',
  capabilities: ['tools', 'resources', 'prompts'],
  totalTools: MCP_TOOLS.length
}

function getToolsWithSchema() {
  return MCP_TOOLS.map(t => ({
    name: t.name,
    description: t.description,
    category: t.category,
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', description: 'Action to perform' },
        params: { type: 'object', description: 'Action parameters' }
      }
    }
  }))
}

export async function GET() {
  return NextResponse.json({
    status: 'connected',
    protocol: 'JSON-RPC 2.0',
    version: 'v2.0',
    endpoint: `${N8N_BASE}/archon/mcp`,
    tools: MCP_TOOLS,
    toolCount: MCP_TOOLS.length,
    categories: ['monitoring', 'operations', 'database', 'security', 'backup', 'reporting', 'orchestration'],
    server: MCP_SERVER_INFO,
    lastSync: new Date().toISOString(),
    source: 'api'
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const method = body.method || 'unknown'
    
    // Handle tools/list locally for faster response
    if (method === 'tools/list' || method === 'list_tools' || method === 'list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id || 1,
        result: {
          tools: getToolsWithSchema(),
          server: MCP_SERVER_INFO
        }
      })
    }
    
    // Try N8N for tool execution
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      
      const res = await fetch(`${N8N_BASE}/mcp`, {
        method: 'POST',
        cache: 'no-store',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      
      clearTimeout(timeout)
      
      if (res.ok) {
        const data = await res.json()
        if (data.code !== 0 && !data.message?.includes('problem')) {
          return NextResponse.json(data)
        }
      }
    } catch {
      // N8N unavailable
    }
    
    // Return error for tool calls when N8N is unavailable
    if (method === 'tools/call' || method.startsWith('archon/')) {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id || 1,
        error: { 
          code: -32000, 
          message: 'N8N MCP Server temporarily unavailable. Tool listing is available.' 
        }
      })
    }
    
    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id || 1,
      error: { code: -32601, message: 'Method not found' }
    })
  } catch (error) {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32000, message: 'Failed to process MCP request' }
    }, { status: 500 })
  }
}
