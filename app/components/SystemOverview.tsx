'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, Cpu, Zap, Shield, Server, Brain, TrendingUp, Clock } from 'lucide-react'

interface HealthData {
  status: string
  timestamp: string
  workflows: { active: number; total: number }
  executions: { success_rate: number; total: number }
  uptime: string
  selfHeal: { active: boolean }
}

interface DashboardData {
  system: { score: number; status: string }
  trust: { level: string; score: number }
}

async function fetchHealth(): Promise<HealthData> {
  const res = await fetch('/api/archon/health')
  if (!res.ok) throw new Error('Health fetch failed')
  return res.json()
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch('/api/archon/dashboard')
  if (!res.ok) throw new Error('Dashboard fetch failed')
  return res.json()
}

export function SystemOverview() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
    refetchInterval: 30000,
  })

  const { data: dashboard, isLoading: dashLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    refetchInterval: 30000,
  })

  const isLoading = healthLoading || dashLoading
  const status = health?.status || 'unknown'
  const score = dashboard?.system?.score || health?.executions?.success_rate || 0

  const getStatusColor = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'healthy': return 'text-archon-success'
      case 'critical': return 'text-archon-danger'
      case 'warning': return 'text-archon-warning'
      default: return 'text-archon-text-dim'
    }
  }

  const getStatusGlow = (s: string) => {
    switch (s?.toLowerCase()) {
      case 'healthy': return 'glow-green'
      case 'critical': return 'glow-red'
      case 'warning': return 'glow-yellow'
      default: return ''
    }
  }

  const metrics = [
    { 
      icon: Activity, 
      label: 'System Status', 
      value: status?.toUpperCase() || '--',
      color: getStatusColor(status),
      glow: getStatusGlow(status)
    },
    { 
      icon: Cpu, 
      label: 'Workflows', 
      value: health?.workflows?.active?.toString() || '8',
      color: 'text-archon-accent'
    },
    { 
      icon: TrendingUp, 
      label: 'Success Rate', 
      value: `${Math.round(score)}%`,
      color: score >= 90 ? 'text-archon-success' : score >= 70 ? 'text-archon-warning' : 'text-archon-danger'
    },
    { 
      icon: Shield, 
      label: 'Trust Level', 
      value: dashboard?.trust?.level || 'BUILDING',
      color: 'text-archon-purple'
    },
    { 
      icon: Zap, 
      label: 'Self-Heal', 
      value: health?.selfHeal?.active ? 'ACTIVE' : 'STANDBY',
      color: health?.selfHeal?.active ? 'text-archon-success' : 'text-archon-text-dim'
    },
    { 
      icon: Clock, 
      label: 'Uptime', 
      value: health?.uptime || '99.9%',
      color: 'text-archon-accent'
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-archon-accent/10 ${getStatusGlow(status)}`}>
            <Brain className="w-6 h-6 text-archon-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display gradient-text">System Overview</h2>
            <p className="text-sm text-archon-text-dim">Real-time ARCHON metrics</p>
          </div>
        </div>
        
        {/* Live indicator */}
        <div className="flex items-center gap-2">
          <span className="status-dot status-healthy" />
          <span className="text-xs text-archon-text-dim font-mono">LIVE</span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className={`glass glass-hover rounded-xl p-4 ${metric.glow || ''}`}
          >
            {isLoading ? (
              <div className="space-y-2">
                <div className="skeleton h-5 w-5 rounded" />
                <div className="skeleton h-4 w-20 rounded" />
                <div className="skeleton h-6 w-16 rounded" />
              </div>
            ) : (
              <>
                <metric.icon className={`w-5 h-5 ${metric.color} mb-2`} />
                <p className="text-xs text-archon-text-dim uppercase tracking-wider">{metric.label}</p>
                <p className={`text-lg font-bold font-mono metric-value ${metric.color}`}>
                  {metric.value}
                </p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
        <span className="text-xs text-archon-text-dim font-mono">
          Last updated: {health?.timestamp ? new Date(health.timestamp).toLocaleTimeString() : '--'}
        </span>
        <span className="text-xs text-archon-accent font-mono">
          Auto-refresh: 30s
        </span>
      </div>
    </motion.div>
  )
}
