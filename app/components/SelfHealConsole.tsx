'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Wrench, 
  RotateCcw, 
  Camera, 
  Play,
  CheckCircle,
  Loader2,
  AlertCircle,
  Terminal
} from 'lucide-react'
import { useState } from 'react'

interface HealResponse {
  success: boolean
  action: string
  timestamp: string
  details: {
    errorsFound?: number
    autoHealApplied?: boolean
    strategies?: string[]
    message?: string
    snapshotId?: string
    target?: string
    scope?: string
    executed?: boolean
    requiresApproval?: boolean
    created?: boolean
    includes?: string[]
  }
  errorSummary?: {
    recent: number
    byWorkflow: Record<string, unknown>
  }
}

async function triggerHeal(target: string = 'all'): Promise<HealResponse> {
  const res = await fetch('https://n8n.selfarchitectai.com/webhook/archon/heal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, strategy: 'auto' })
  })
  return res.json()
}

async function triggerRollback(scope: string = 'config'): Promise<HealResponse> {
  const res = await fetch('https://n8n.selfarchitectai.com/webhook/archon/rollback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scope, target: 'last_snapshot' })
  })
  return res.json()
}

async function createSnapshot(): Promise<HealResponse> {
  const res = await fetch('https://n8n.selfarchitectai.com/webhook/archon/snapshot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  return res.json()
}

export function SelfHealConsole() {
  const [logs, setLogs] = useState<string[]>([
    '[SYSTEM] Self-Heal Console initialized',
    '[INFO] Monitoring for anomalies...',
  ])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`].slice(-10))
  }

  const healMutation = useMutation({
    mutationFn: triggerHeal,
    onMutate: () => addLog('[ACTION] Triggering self-heal...'),
    onSuccess: (data) => {
      addLog(`[SUCCESS] Heal complete: ${data.details?.errorsFound || 0} errors found`)
      if (data.details?.strategies?.length) {
        addLog(`[INFO] Strategies applied: ${data.details.strategies.join(', ')}`)
      }
    },
    onError: () => addLog('[ERROR] Heal operation failed'),
  })

  const rollbackMutation = useMutation({
    mutationFn: (scope: string) => triggerRollback(scope),
    onMutate: () => addLog('[ACTION] Initiating rollback...'),
    onSuccess: (data) => addLog(`[SUCCESS] Rollback: ${data.details?.message || 'Complete'}`),
    onError: () => addLog('[ERROR] Rollback failed'),
  })

  const snapshotMutation = useMutation({
    mutationFn: createSnapshot,
    onMutate: () => addLog('[ACTION] Creating snapshot...'),
    onSuccess: (data) => addLog(`[SUCCESS] Snapshot created: ${data.details?.snapshotId || 'snap_' + Date.now()}`),
    onError: () => addLog('[ERROR] Snapshot failed'),
  })

  const isAnyLoading = healMutation.isPending || rollbackMutation.isPending || snapshotMutation.isPending

  const actions = [
    {
      name: 'Self-Heal',
      description: 'Auto-detect and fix issues',
      icon: Wrench,
      color: 'text-archon-success',
      bgColor: 'bg-archon-success/10 hover:bg-archon-success/20',
      onClick: () => healMutation.mutate('all'),
      isPending: healMutation.isPending,
    },
    {
      name: 'Rollback',
      description: 'Revert to last good state',
      icon: RotateCcw,
      color: 'text-archon-warning',
      bgColor: 'bg-archon-warning/10 hover:bg-archon-warning/20',
      onClick: () => rollbackMutation.mutate('config'),
      isPending: rollbackMutation.isPending,
    },
    {
      name: 'Snapshot',
      description: 'Save current system state',
      icon: Camera,
      color: 'text-archon-accent',
      bgColor: 'bg-archon-accent/10 hover:bg-archon-accent/20',
      onClick: () => snapshotMutation.mutate(),
      isPending: snapshotMutation.isPending,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-success/10">
            <Wrench className="w-6 h-6 text-archon-success" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Self-Heal Console</h2>
            <p className="text-sm text-archon-text-dim">Automated recovery operations</p>
          </div>
        </div>
        
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${isAnyLoading ? 'bg-archon-warning/10' : 'bg-archon-success/10'}`}>
          {isAnyLoading ? (
            <Loader2 className="w-4 h-4 text-archon-warning animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4 text-archon-success" />
          )}
          <span className={`text-xs font-mono ${isAnyLoading ? 'text-archon-warning' : 'text-archon-success'}`}>
            {isAnyLoading ? 'PROCESSING' : 'READY'}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {actions.map((action) => (
          <motion.button
            key={action.name}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={action.onClick}
            disabled={isAnyLoading}
            className={`p-4 rounded-xl ${action.bgColor} border border-white/5 transition-all disabled:opacity-50`}
          >
            <div className="flex flex-col items-center gap-2">
              {action.isPending ? (
                <Loader2 className={`w-6 h-6 ${action.color} animate-spin`} />
              ) : (
                <action.icon className={`w-6 h-6 ${action.color}`} />
              )}
              <span className="text-sm font-medium">{action.name}</span>
              <span className="text-xs text-archon-text-dim">{action.description}</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Console Output */}
      <div className="rounded-xl bg-black/50 border border-white/5 overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2 border-b border-white/5 bg-archon-panel/50">
          <Terminal className="w-4 h-4 text-archon-accent" />
          <span className="text-xs font-mono text-archon-text-dim">Console Output</span>
        </div>
        
        <div className="p-4 h-40 overflow-y-auto font-mono text-xs space-y-1">
          <AnimatePresence>
            {logs.map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className={`
                  ${log.includes('ERROR') ? 'text-archon-danger' : ''}
                  ${log.includes('SUCCESS') ? 'text-archon-success' : ''}
                  ${log.includes('ACTION') ? 'text-archon-warning' : ''}
                  ${log.includes('INFO') ? 'text-archon-accent' : ''}
                  ${log.includes('SYSTEM') ? 'text-archon-text-dim' : ''}
                `}
              >
                {log}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
