import { NextResponse } from 'next/server'

const MCP_TOOLS = [
  { name: 'archon/health', description: 'Get system health status', category: 'monitoring' },
  { name: 'archon/metrics', description: 'Get telemetry metrics', category: 'monitoring' },
  { name: 'archon/alerts', description: 'Get active alerts', category: 'monitoring' },
  { name: 'archon/heal', description: 'Trigger self-healing', category: 'operations' },
  { name: 'archon/deploy', description: 'Trigger deployment', category: 'operations' },
  { name: 'archon/verify', description: 'Verify system state', category: 'operations' },
  { name: 'archon/rollback', description: 'Rollback to previous state', category: 'operations' },
  { name: 'archon/snapshot', description: 'Create system snapshot', category: 'operations' },
  { name: 'archon/db/status', description: 'PostgreSQL status', category: 'database' },
  { name: 'archon/db/query', description: 'Execute database query', category: 'database' },
  { name: 'archon/db/backup', description: 'Create database backup', category: 'database' },
  { name: 'archon/security/audit', description: 'Run security audit', category: 'security' },
  { name: 'archon/security/scan', description: 'Security vulnerability scan', category: 'security' },
  { name: 'archon/backup', description: 'System backup', category: 'backup' },
  { name: 'archon/restore', description: 'Restore from backup', category: 'backup' },
  { name: 'archon/dr-status', description: 'Disaster recovery status', category: 'backup' },
  { name: 'archon/report', description: 'Generate system report', category: 'reporting' },
  { name: 'archon/costs', description: 'Cost analysis', category: 'reporting' },
  { name: 'archon/trust', description: 'Trust score metrics', category: 'reporting' },
  { name: 'archon/pipeline', description: 'Pipeline status', category: 'orchestration' },
  { name: 'archon/orchestrate', description: 'Run orchestration', category: 'orchestration' }
]

export async function GET() {
  return NextResponse.json({
    status: 'connected',
    protocol: 'JSON-RPC 2.0',
    version: 'v2.0',
    endpoint: 'https://n8n.selfarchitectai.com/webhook/archon/mcp',
    tools: MCP_TOOLS,
    toolCount: MCP_TOOLS.length,
    categories: ['monitoring', 'operations', 'database', 'security', 'backup', 'reporting', 'orchestration'],
    lastSync: new Date().toISOString()
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  
  // Handle MCP JSON-RPC requests
  if (body.method === 'tools/list') {
    return NextResponse.json({
      jsonrpc: '2.0',
      id: body.id || 1,
      result: { tools: MCP_TOOLS }
    })
  }
  
  return NextResponse.json({
    jsonrpc: '2.0',
    id: body.id || 1,
    error: { code: -32601, message: 'Method not found' }
  })
}
