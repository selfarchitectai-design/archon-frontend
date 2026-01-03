'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Shield, 
  Cpu, 
  Zap,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react'

interface TrustData {
  trust_score: number
  verification_status: 'verified' | 'pending' | 'failed'
  last_check: string
  metrics: {
    health_status: string
    workflows_active: number
    success_rate: number
    uptime: string
    self_heal_status: string
    alerts_24h: number
  }
  trust_level: string
  gpt5_ready: boolean
  api_version: string
}

async function fetchTrust(): Promise<TrustData> {
  const res = await fetch('/api/archon/trust')
  if (!res.ok) throw new Error('Trust fetch failed')
  return res.json()
}

export function TrustAnalyzer() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['trust'],
    queryFn: fetchTrust,
    refetchInterval: 15000, // 15 seconds for trust data
  })

  const trustScore = data?.trust_score || 0
  const trustLevel = data?.trust_level || 'BUILDING'
  const verificationStatus = data?.verification_status || 'pending'

  const getTrustColor = () => {
    if (trustScore >= 0.9) return 'text-archon-success'
    if (trustScore >= 0.7) return 'text-archon-warning'
    return 'text-archon-danger'
  }

  const getTrustGlow = () => {
    if (trustScore >= 0.9) return 'glow-green'
    if (trustScore >= 0.7) return 'glow-yellow'
    return 'glow-red'
  }

  const getStatusIndicator = () => {
    switch (verificationStatus) {
      case 'verified':
        return { icon: CheckCircle2, color: 'text-archon-success', label: 'Verified', bg: 'bg-archon-success/10' }
      case 'pending':
        return { icon: Loader2, color: 'text-archon-warning', label: 'Pending', bg: 'bg-archon-warning/10', spin: true }
      case 'failed':
        return { icon: AlertTriangle, color: 'text-archon-danger', label: 'Failed', bg: 'bg-archon-danger/10' }
      default:
        return { icon: Clock, color: 'text-archon-text-dim', label: 'Unknown', bg: 'bg-archon-panel' }
    }
  }

  const status = getStatusIndicator()

  const trustMetrics = [
    { label: 'Health', value: data?.metrics?.health_status?.toUpperCase() || '--', icon: Shield },
    { label: 'Workflows', value: data?.metrics?.workflows_active?.toString() || '8', icon: Cpu },
    { label: 'Success Rate', value: `${data?.metrics?.success_rate || 0}%`, icon: TrendingUp },
    { label: 'Self-Heal', value: data?.metrics?.self_heal_status?.toUpperCase() || '--', icon: Zap },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className={`archon-card p-6 relative overflow-hidden ${getTrustGlow()}`}
    >
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-archon-accent/5 to-transparent pointer-events-none" />
      
      {/* Header */}
      <div className="relative flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="p-2 rounded-lg bg-gradient-to-br from-archon-accent/20 to-archon-purple/20"
          >
            <Brain className="w-6 h-6 text-archon-accent" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold font-display gradient-text">Trust Analyzer</h2>
            <p className="text-sm text-archon-text-dim">GPT-5 Controller Interface</p>
          </div>
        </div>
        
        {/* GPT-5 Ready Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-archon-purple/10 border border-archon-purple/30">
          <span className="w-2 h-2 rounded-full bg-archon-purple animate-pulse" />
          <span className="text-xs font-mono text-archon-purple">GPT-5 READY</span>
        </div>
      </div>

      {/* Main Trust Display */}
      <div className="relative mb-8">
        <div className="flex items-center justify-center">
          {/* Trust Score Ring */}
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48 transform -rotate-90">
              {/* Background ring */}
              <circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-archon-panel-light"
              />
              {/* Progress ring */}
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                className={getTrustColor()}
                initial={{ strokeDasharray: '0 553' }}
                animate={{ strokeDasharray: `${trustScore * 553} 553` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
              {/* Accent glow */}
              <motion.circle
                cx="96"
                cy="96"
                r="88"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className={getTrustColor()}
                style={{ filter: 'blur(4px)' }}
                initial={{ strokeDasharray: '0 553' }}
                animate={{ strokeDasharray: `${trustScore * 553} 553` }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            
            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {isLoading ? (
                <Loader2 className="w-12 h-12 text-archon-accent animate-spin" />
              ) : (
                <>
                  <span className={`text-5xl font-bold font-display metric-value ${getTrustColor()}`}>
                    {(trustScore * 100).toFixed(0)}
                  </span>
                  <span className="text-sm text-archon-text-dim">Trust Score</span>
                  <span className={`text-xs font-mono mt-1 ${getTrustColor()}`}>
                    {trustLevel}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className={`flex items-center justify-center gap-3 p-4 rounded-xl ${status.bg} border border-white/5 mb-6`}>
        <status.icon className={`w-5 h-5 ${status.color} ${status.spin ? 'animate-spin' : ''}`} />
        <div className="text-center">
          <p className={`text-lg font-semibold ${status.color}`}>
            {status.label}
          </p>
          <p className="text-xs text-archon-text-dim">
            {verificationStatus === 'pending' ? 'Awaiting GPT-5 Verification...' : 'Verification Status'}
          </p>
        </div>
      </div>

      {/* Trust Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {trustMetrics.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.8 + index * 0.1 }}
            className="p-3 rounded-lg bg-archon-panel/30 border border-white/5 text-center"
          >
            <metric.icon className="w-4 h-4 text-archon-accent mx-auto mb-1" />
            <p className="text-sm font-bold font-mono text-archon-text">{metric.value}</p>
            <p className="text-xs text-archon-text-dim">{metric.label}</p>
          </motion.div>
        ))}
      </div>

      {/* GPT-5 Controller Info */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-archon-purple/10 to-archon-accent/10 border border-archon-purple/20">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="w-5 h-5 text-archon-purple" />
          <span className="text-sm font-medium">GPT-5 Controller Interface</span>
        </div>
        <p className="text-xs text-archon-text-dim mb-2">
          External GPT-5 Controller will connect to <code className="px-1 py-0.5 rounded bg-archon-panel font-mono">/api/archon/trust</code> to push real-time trust metrics and verification commands.
        </p>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-archon-text-dim">
            API Version: <span className="text-archon-accent font-mono">{data?.api_version || '3.6.0'}</span>
          </span>
          <span className="text-archon-text-dim">
            Last Check: <span className="text-archon-accent font-mono">
              {data?.last_check ? new Date(data.last_check).toLocaleTimeString() : '--'}
            </span>
          </span>
        </div>
      </div>
    </motion.div>
  )
}
