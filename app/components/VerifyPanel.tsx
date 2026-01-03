'use client'

import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  ShieldCheck, 
  Play, 
  CheckCircle, 
  XCircle,
  Loader2,
  Clock,
  Hash
} from 'lucide-react'
import { useState } from 'react'

interface VerifyResponse {
  success: boolean
  timestamp: string
  verification: {
    status: string
    checksum: string
    validated: boolean
  }
  details?: Record<string, unknown>
}

async function runVerification(target: string = 'all'): Promise<VerifyResponse> {
  const res = await fetch('/api/archon/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target, mode: 'full' })
  })
  return res.json()
}

export function VerifyPanel() {
  const [verifications, setVerifications] = useState<Array<{
    id: string
    timestamp: string
    status: 'success' | 'failed' | 'pending'
    target: string
  }>>([])

  const verifyMutation = useMutation({
    mutationFn: runVerification,
    onMutate: (target: string) => {
      const id = `verify_${Date.now()}`
      setVerifications(prev => [{
        id,
        timestamp: new Date().toISOString(),
        status: 'pending' as const,
        target
      }, ...prev].slice(0, 5))
      return { id }
    },
    onSuccess: (data, _, context) => {
      setVerifications(prev => prev.map(v => 
        v.id === (context as { id: string }).id 
          ? { ...v, status: (data.verification?.validated ? 'success' : 'failed') as 'success' | 'failed' }
          : v
      ))
    },
    onError: (_, __, context) => {
      setVerifications(prev => prev.map(v =>
        v.id === (context as { id: string })?.id
          ? { ...v, status: 'failed' as const }
          : v
      ))
    },
  })

  const targets = [
    { name: 'Workflows', value: 'workflows', description: 'Verify all N8N workflows' },
    { name: 'Config', value: 'config', description: 'Verify system configuration' },
    { name: 'Trust', value: 'trust', description: 'Verify trust metrics' },
    { name: 'Full', value: 'all', description: 'Complete system verification' },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-archon-success" />
      case 'failed': return <XCircle className="w-4 h-4 text-archon-danger" />
      case 'pending': return <Loader2 className="w-4 h-4 text-archon-warning animate-spin" />
      default: return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-success/10">
            <ShieldCheck className="w-6 h-6 text-archon-success" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Verify Loop</h2>
            <p className="text-sm text-archon-text-dim">System integrity checks</p>
          </div>
        </div>
      </div>

      {/* Verification Targets */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {targets.map((target) => (
          <motion.button
            key={target.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => verifyMutation.mutate(target.value)}
            disabled={verifyMutation.isPending}
            className="p-4 rounded-xl bg-archon-panel/50 border border-white/5 hover:border-archon-success/30 transition-all text-left group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{target.name}</span>
              <Play className="w-4 h-4 text-archon-text-dim group-hover:text-archon-success transition-colors" />
            </div>
            <p className="text-xs text-archon-text-dim">{target.description}</p>
          </motion.button>
        ))}
      </div>

      {/* Verification History */}
      <div>
        <h3 className="text-sm font-medium text-archon-text-dim uppercase tracking-wider mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Verifications
        </h3>
        
        <div className="space-y-2">
          {verifications.length === 0 ? (
            <p className="text-sm text-archon-text-dim text-center py-4">
              No recent verifications
            </p>
          ) : (
            verifications.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-lg bg-archon-panel/30 border border-white/5"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(v.status)}
                  <div>
                    <p className="text-sm font-medium capitalize">{v.target}</p>
                    <p className="text-xs text-archon-text-dim font-mono">
                      {new Date(v.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Hash className="w-3 h-3 text-archon-text-dim" />
                  <span className="text-xs font-mono text-archon-text-dim">
                    {v.id.slice(-8)}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  )
}
