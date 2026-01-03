'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  HeartPulse, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Server,
  Database,
  Cloud,
  Wifi
} from 'lucide-react'
import { useState } from 'react'

interface HealthResponse {
  status: string
  timestamp: string
  workflows: { active: number; total: number; list?: Array<{ id: string; name: string }> }
  executions: { success_rate?: number; rate?: number; total: number; errors?: number; error?: number }
  uptime?: string
  system?: { status: string; score: number; uptime: number }
  selfHeal?: { active?: boolean; status?: string; lastAction?: string; auto_fixes_today?: number }
  self_heal?: { status: string; auto_fixes_today: number }
  services?: Array<{ name: string; status: string; details?: string }> | Record<string, boolean>
  lambdas?: { count: number; status: string }
  trust?: { level: string; mode: string; successRate: number }
}

async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch('/api/archon/health')
  if (!res.ok) throw new Error('Health fetch failed')
  return res.json()
}

export function ArchonHealthMonitor() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['health-monitor'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refetch()
    setTimeout(() => setIsRefreshing(false), 1000)
  }

  const status = data?.status || 'unknown'
  const successRate = data?.executions?.rate ?? data?.executions?.success_rate ?? 0

  const getStatusIcon = () => {
    switch (status?.toLowerCase()) {
      case 'healthy': return <CheckCircle2 className="w-8 h-8 text-archon-success" />
      case 'critical': return <XCircle className="w-8 h-8 text-archon-danger" />
      case 'warning': return <AlertTriangle className="w-8 h-8 text-archon-warning" />
      default: return <HeartPulse className="w-8 h-8 text-archon-text-dim" />
    }
  }

  const getStatusBg = () => {
    switch (status?.toLowerCase()) {
      case 'healthy': return 'bg-archon-success/10 border-archon-success/30'
      case 'critical': return 'bg-archon-danger/10 border-archon-danger/30'
      case 'warning': return 'bg-archon-warning/10 border-archon-warning/30'
      default: return 'bg-archon-panel border-white/10'
    }
  }

  const services = [
    { name: 'N8N Workflows', icon: Server, status: (data?.workflows?.active ?? 0) > 0 },
    { name: 'Lambda Functions', icon: Cloud, status: (data?.lambdas?.count ?? 0) > 0 || data?.lambdas?.status === 'online' },
    { name: 'MCP Server', icon: Database, status: data?.status === 'healthy' },
    { name: 'API Gateway', icon: Wifi, status: data?.status === 'healthy' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-danger/10">
            <HeartPulse className="w-6 h-6 text-archon-danger" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Health Monitor</h2>
            <p className="text-sm text-archon-text-dim">System health & services</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="p-2 rounded-lg bg-archon-panel hover:bg-archon-panel-light transition-colors"
        >
          <RefreshCw className={`w-5 h-5 text-archon-accent ${isRefreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Status */}
      <div className={`rounded-xl p-6 border ${getStatusBg()} mb-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getStatusIcon()}
            <div>
              <p className="text-2xl font-bold font-display uppercase">
                {isLoading ? 'Loading...' : status}
              </p>
              <p className="text-sm text-archon-text-dim">
                Overall system health
              </p>
            </div>
          </div>
          
          {/* Success Rate Ring */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-archon-panel-light"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className={successRate >= 90 ? 'text-archon-success' : successRate >= 70 ? 'text-archon-warning' : 'text-archon-danger'}
                initial={{ strokeDasharray: '0 220' }}
                animate={{ strokeDasharray: `${(successRate / 100) * 220} 220` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold font-mono">{Math.round(successRate)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-archon-text-dim uppercase tracking-wider">
          Service Status
        </h3>
        
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="flex items-center justify-between p-3 rounded-lg bg-archon-panel/50 border border-white/5"
          >
            <div className="flex items-center gap-3">
              <service.icon className="w-5 h-5 text-archon-accent" />
              <span className="text-sm">{service.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`status-dot ${service.status ? 'status-healthy' : 'status-critical'}`} />
              <span className={`text-xs font-mono ${service.status ? 'text-archon-success' : 'text-archon-danger'}`}>
                {service.status ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-archon-accent">
            {data?.workflows?.active || 8}
          </p>
          <p className="text-xs text-archon-text-dim">Active Workflows</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-archon-success">
            {data?.executions?.total || 0}
          </p>
          <p className="text-xs text-archon-text-dim">Total Executions</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-archon-danger">
            {data?.executions?.errors ?? data?.executions?.error ?? 0}
          </p>
          <p className="text-xs text-archon-text-dim">Errors (24h)</p>
        </div>
      </div>
    </motion.div>
  )
}
