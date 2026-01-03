'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plug, 
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Terminal
} from 'lucide-react'
import { useState } from 'react'

interface MCPTool {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required: string[]
  }
}

interface MCPListResponse {
  jsonrpc: string
  id: number
  result: {
    tools: MCPTool[]
  }
}

interface MCPCallResponse {
  jsonrpc: string
  id: number
  result?: {
    content: Array<{
      type: string
      text: string
    }>
  }
  error?: {
    code: number
    message: string
  }
}

async function fetchMCPTools(): Promise<MCPListResponse> {
  const res = await fetch('/api/archon/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    })
  })
  return res.json()
}

async function callMCPTool(toolName: string): Promise<MCPCallResponse> {
  const res = await fetch('/api/archon/mcp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: {}
      }
    })
  })
  return res.json()
}

export function MCPToolsPanel() {
  const [expandedTool, setExpandedTool] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<{ tool: string; result: string } | null>(null)

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mcp-tools'],
    queryFn: fetchMCPTools,
    refetchInterval: 60000,
  })

  const callMutation = useMutation({
    mutationFn: callMCPTool,
    onSuccess: (response, toolName) => {
      if (response.result?.content?.[0]?.text) {
        setLastResult({
          tool: toolName,
          result: response.result.content[0].text
        })
      }
    },
  })

  const tools = data?.result?.tools || []
  const isConnected = tools.length > 0

  const getToolCategory = (name: string) => {
    if (name.includes('health') || name.includes('dashboard')) return { color: 'text-archon-success', category: 'Health' }
    if (name.includes('decision') || name.includes('event') || name.includes('policy')) return { color: 'text-archon-purple', category: 'Decision' }
    if (name.includes('heal') || name.includes('rollback') || name.includes('snapshot')) return { color: 'text-archon-warning', category: 'Self-Heal' }
    if (name.includes('cost') || name.includes('optimize')) return { color: 'text-archon-accent', category: 'Cost' }
    if (name.includes('report') || name.includes('trend')) return { color: 'text-archon-danger', category: 'Report' }
    return { color: 'text-archon-text-dim', category: 'Other' }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-accent/10">
            <Plug className="w-6 h-6 text-archon-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">MCP Tools</h2>
            <p className="text-sm text-archon-text-dim">Model Context Protocol interface</p>
          </div>
        </div>
        
        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
          isConnected ? 'bg-archon-success/10' : 'bg-archon-danger/10'
        }`}>
          {isConnected ? (
            <>
              <CheckCircle className="w-4 h-4 text-archon-success" />
              <span className="text-xs font-mono text-archon-success">CONNECTED</span>
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-archon-danger" />
              <span className="text-xs font-mono text-archon-danger">DISCONNECTED</span>
            </>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-archon-panel/50 border border-white/5 text-center">
          <p className="text-2xl font-bold font-mono text-archon-accent">{tools.length}</p>
          <p className="text-xs text-archon-text-dim">Tools</p>
        </div>
        <div className="p-3 rounded-lg bg-archon-panel/50 border border-white/5 text-center">
          <p className="text-2xl font-bold font-mono text-archon-success">JSON-RPC</p>
          <p className="text-xs text-archon-text-dim">Protocol</p>
        </div>
        <div className="p-3 rounded-lg bg-archon-panel/50 border border-white/5 text-center">
          <p className="text-2xl font-bold font-mono text-archon-purple">v2.0</p>
          <p className="text-xs text-archon-text-dim">Version</p>
        </div>
      </div>

      {/* Tools List */}
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          tools.map((tool, index) => {
            const { color, category } = getToolCategory(tool.name)
            const isExpanded = expandedTool === tool.name

            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="rounded-lg bg-archon-panel/50 border border-white/5 overflow-hidden"
              >
                {/* Tool Header */}
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-archon-panel-light/50 transition-colors"
                  onClick={() => setExpandedTool(isExpanded ? null : tool.name)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${color.replace('text-', 'bg-')}`} />
                    <div>
                      <p className="text-sm font-medium font-mono">{tool.name}</p>
                      <p className="text-xs text-archon-text-dim">{category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation()
                        callMutation.mutate(tool.name)
                      }}
                      disabled={callMutation.isPending && callMutation.variables === tool.name}
                      className="p-1.5 rounded-lg bg-archon-accent/10 hover:bg-archon-accent/20 transition-colors"
                    >
                      {callMutation.isPending && callMutation.variables === tool.name ? (
                        <Loader2 className="w-4 h-4 text-archon-accent animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 text-archon-accent" />
                      )}
                    </motion.button>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-archon-text-dim" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-archon-text-dim" />
                    )}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5"
                    >
                      <div className="p-3 text-xs">
                        <p className="text-archon-text-dim mb-2">{tool.description}</p>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-archon-panel text-archon-accent font-mono">
                            POST
                          </span>
                          <span className="text-archon-text-dim font-mono">
                            /webhook/mcp
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })
        )}
      </div>

      {/* Last Result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 rounded-lg bg-black/50 border border-white/5 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5 bg-archon-panel/30">
              <Terminal className="w-4 h-4 text-archon-accent" />
              <span className="text-xs font-mono text-archon-text-dim">
                {lastResult.tool} response
              </span>
              <button
                onClick={() => setLastResult(null)}
                className="ml-auto text-archon-text-dim hover:text-white"
              >
                ×
              </button>
            </div>
            <pre className="p-3 text-xs font-mono text-archon-text overflow-auto max-h-32">
              {lastResult.result}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
