'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Eye, 
  Globe, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  Zap,
  Brain
} from 'lucide-react'

interface ObservationData {
  status: string
  service: string
  pipeline_runs: number
  recent_runs: {
    timestamp: string
    id: string
    duration: number
    stages_completed: number
    changes: boolean
  }[]
}

interface PipelineResult {
  success: boolean
  timestamp: string
  pipeline_id: string
  summary: {
    total_duration_ms: number
    stages_completed: number
    stages_failed: number
    changes_detected: boolean
    anomalies_detected: boolean
  }
}

async function fetchObservationStatus(): Promise<ObservationData> {
  const res = await fetch('/api/observation/pipeline')
  if (!res.ok) throw new Error('Failed to fetch observation status')
  return res.json()
}

async function runPipeline(): Promise<PipelineResult> {
  const res = await fetch('/api/observation/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  })
  if (!res.ok) throw new Error('Pipeline execution failed')
  return res.json()
}

export function ObservationPanel() {
  const [lastRun, setLastRun] = useState<PipelineResult | null>(null)
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['observation-status'],
    queryFn: fetchObservationStatus,
    refetchInterval: 30000,
  })
  
  const mutation = useMutation({
    mutationFn: runPipeline,
    onSuccess: (result) => {
      setLastRun(result)
      refetch()
    }
  })

  const targets = [
    { name: 'selfarchitectai.com', status: 'healthy', latency: 245 },
    { name: 'dashboard', status: 'healthy', latency: 180 },
    { name: 'n8n API', status: 'healthy', latency: 120 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-archon-success'
      case 'degraded': return 'text-archon-warning'
      case 'down': return 'text-archon-danger'
      default: return 'text-archon-text-dim'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-accent/10">
            <Eye className="w-6 h-6 text-archon-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Observation Hub</h2>
            <p className="text-sm text-archon-text-dim">CAOA - Claude Assisted Observation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-archon-accent/10 hover:bg-archon-accent/20 text-archon-accent text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${mutation.isPending ? 'animate-spin' : ''}`} />
            {mutation.isPending ? 'Running...' : 'Run Pipeline'}
          </button>
        </div>
      </div>

      {/* Last Run Status */}
      {lastRun && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className={`mb-4 p-3 rounded-lg border ${
            lastRun.success 
              ? 'bg-archon-success/5 border-archon-success/20' 
              : 'bg-archon-danger/5 border-archon-danger/20'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {lastRun.success ? (
                <CheckCircle2 className="w-4 h-4 text-archon-success" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-archon-danger" />
              )}
              <span className="text-sm font-medium">
                Pipeline {lastRun.success ? 'completed' : 'failed'}
              </span>
            </div>
            <span className="text-xs text-archon-text-dim font-mono">
              {lastRun.summary.total_duration_ms}ms
            </span>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-archon-text-dim">
            <span>Stages: {lastRun.summary.stages_completed}/{lastRun.summary.stages_completed + lastRun.summary.stages_failed}</span>
            {lastRun.summary.changes_detected && (
              <span className="text-archon-warning">Changes detected</span>
            )}
            {lastRun.summary.anomalies_detected && (
              <span className="text-archon-danger">Anomalies detected</span>
            )}
          </div>
        </motion.div>
      )}

      {/* Monitored Targets */}
      <div className="space-y-3 mb-6">
        <h3 className="text-sm font-medium text-archon-text-dim uppercase tracking-wider flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Monitored Targets
        </h3>
        
        {targets.map((target, index) => (
          <motion.div
            key={target.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-archon-panel/50 border border-white/5"
          >
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${
                target.status === 'healthy' ? 'bg-archon-success' : 
                target.status === 'degraded' ? 'bg-archon-warning' : 'bg-archon-danger'
              }`} />
              <span className="text-sm">{target.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-archon-text-dim font-mono">
                {target.latency}ms
              </span>
              <span className={`text-xs font-mono ${getStatusColor(target.status)}`}>
                {target.status.toUpperCase()}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-archon-panel/50 border border-white/5 text-center">
          <Zap className="w-4 h-4 text-archon-accent mx-auto mb-1" />
          <p className="text-lg font-bold font-mono text-archon-accent">
            {data?.pipeline_runs || 0}
          </p>
          <p className="text-xs text-archon-text-dim">Pipeline Runs</p>
        </div>
        <div className="p-3 rounded-lg bg-archon-panel/50 border border-white/5 text-center">
          <Activity className="w-4 h-4 text-archon-success mx-auto mb-1" />
          <p className="text-lg font-bold font-mono text-archon-success">3</p>
          <p className="text-xs text-archon-text-dim">Active Targets</p>
        </div>
        <div className="p-3 rounded-lg bg-archon-panel/50 border border-white/5 text-center">
          <Brain className="w-4 h-4 text-archon-purple mx-auto mb-1" />
          <p className="text-lg font-bold font-mono text-archon-purple">GPT-5</p>
          <p className="text-xs text-archon-text-dim">Analyzer</p>
        </div>
      </div>

      {/* Trend Indicators */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-archon-accent/5 to-archon-purple/5 border border-white/5">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-archon-accent" />
          Observation Trends
        </h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="flex items-center justify-center gap-1 text-archon-success">
              <TrendingUp className="w-3 h-3" />
              <span className="text-sm font-mono">+2%</span>
            </div>
            <p className="text-xs text-archon-text-dim mt-1">Uptime</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-archon-success">
              <TrendingDown className="w-3 h-3" />
              <span className="text-sm font-mono">-15ms</span>
            </div>
            <p className="text-xs text-archon-text-dim mt-1">Latency</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-archon-text-dim">
              <Minus className="w-3 h-3" />
              <span className="text-sm font-mono">0</span>
            </div>
            <p className="text-xs text-archon-text-dim mt-1">Anomalies</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-archon-text-dim">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Auto-refresh: 5m
        </span>
        <span className="font-mono">/api/observation/pipeline</span>
      </div>
    </motion.div>
  )
}
