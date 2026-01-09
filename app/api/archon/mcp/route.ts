import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

// MCP Tools list for fallback
const MCP_TOOLS = [
  { name: 'archon/health', description: 'Get ARCHON system health status', category: 'monitoring' },
  { name: 'archon/trust', description: 'Get trust metrics and levels', category: 'trust' },
  { name: 'archon/costs', description: 'Get cost analysis and optimization', category: 'costs' },
  { name: 'archon/report', description: 'Get system report and insights', category: 'reporting' },
  { name: 'archon/heal', description: 'Trigger self-healing process', category: 'operations' },
  { name: 'archon/deploy', description: 'Trigger deployment pipeline', category: 'deploy' },
  { name: 'archon/verify', description: 'Verify action completion', category: 'operations' },
  { name: 'archon/db/status', description: 'Get PostgreSQL status', category: 'database' },
  { name: 'archon/db/query', description: 'Execute database query', category: 'database' },
  { name: 'archon/db/backup', description: 'Create database backup', category: 'database' },
  { name: 'archon/backup', description: 'Create system backup', category: 'backup' },
  { name: 'archon/restore', description: 'Restore from backup', category: 'backup' },
  { name: 'archon/dr-status', description: 'Get disaster recovery status', category: 'backup' },
  { name: 'archon/security/audit', description: 'Run security audit', category: 'security' },
  { name: 'archon/security/scan', description: 'Run vulnerability scan', category: 'security' },
  { name: 'archon/alert', description: 'Trigger manual alert', category: 'alerting' },
  { name: 'archon/alerts', description: 'Get active alerts', category: 'alerting' },
  { name: 'archon/metrics', description: 'Get telemetry metrics', category: 'telemetry' },
  { name: 'archon/telemetry', description: 'Send telemetry data', category: 'telemetry' },
  { name: 'archon/pipeline', description: 'Get pipeline status', category: 'orchestration' },
  { name: 'archon/orchestrate', description: 'Trigger orchestration', category: 'orchestration' }
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const method = body.method || 'unknown'
    
    // Handle tools/list locally
    if (method === 'tools/list' || method === 'list_tools' || method === 'list') {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id || 1,
        result: {
          tools: MCP_TOOLS.map(t => ({
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
          })),
          server: {
            name: 'ARCHON MCP Server',
            version: '3.6',
            capabilities: ['tools', 'resources', 'prompts'],
            totalTools: MCP_TOOLS.length
          }
        }
      })
    }
    
    // Try N8N for other methods
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
    
    const data = await res.json()
    
    // Check if response has error
    if (data.code === 0 || data.message?.includes('problem')) {
      return NextResponse.json({
        jsonrpc: '2.0',
        id: body.id || 1,
        error: { code: -32000, message: 'N8N MCP Server temporarily unavailable' }
      })
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('MCP API error:', error)
    return NextResponse.json({
      jsonrpc: '2.0',
      id: 1,
      error: { code: -32000, message: 'Failed to connect to N8N MCP Server' }
    }, { status: 500 })
  }
}
