'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Minus,
  FileText,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react'

interface ReportData {
  timestamp: string
  reportType: string
  summary: {
    status: string
    headline: string
  }
  metrics: {
    last24h: {
      executions: number
      success: number
      errors: number
      successRate: number
    }
    lastWeek?: {
      executions: number
      success: number
      errors: number
      successRate: number
    }
  }
  trust: {
    level: string
    score: number
  }
  trend: {
    direction: string
    delta: number
    vsYesterday: string
    forecast: string
  }
  insights: string[]
}

interface TrendData {
  timestamp: string
  trend: {
    direction: string
    delta: number
    forecast: string
  }
  metrics: {
    last24h: {
      successRate: number
    }
  }
}

async function fetchReport(): Promise<ReportData> {
  const res = await fetch('/api/archon/report')
  if (!res.ok) throw new Error('Report fetch failed')
  return res.json()
}

async function fetchTrend(): Promise<TrendData> {
  const res = await fetch('/api/archon/report?type=trend')
  if (!res.ok) throw new Error('Trend fetch failed')
  return res.json()
}

export function ReportPanel() {
  const { data: report, isLoading: reportLoading } = useQuery({
    queryKey: ['report'],
    queryFn: fetchReport,
    refetchInterval: 60000,
  })

  const { data: trend } = useQuery({
    queryKey: ['trend'],
    queryFn: fetchTrend,
    refetchInterval: 60000,
  })

  const getTrendIcon = (direction: string) => {
    switch (direction?.toLowerCase()) {
      case 'up': return <TrendingUp className="w-5 h-5 text-archon-success" />
      case 'down': return <TrendingDown className="w-5 h-5 text-archon-danger" />
      default: return <Minus className="w-5 h-5 text-archon-text-dim" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'excellent': return 'text-archon-success bg-archon-success/10 border-archon-success/30'
      case 'good': return 'text-archon-accent bg-archon-accent/10 border-archon-accent/30'
      case 'needs_attention': return 'text-archon-warning bg-archon-warning/10 border-archon-warning/30'
      case 'critical': return 'text-archon-danger bg-archon-danger/10 border-archon-danger/30'
      default: return 'text-archon-text-dim bg-archon-panel border-white/10'
    }
  }

  const metrics = report?.metrics?.last24h || { executions: 0, success: 0, errors: 0, successRate: 0 }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-purple/10">
            <BarChart3 className="w-6 h-6 text-archon-purple" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Report Hub</h2>
            <p className="text-sm text-archon-text-dim">Analytics & insights</p>
          </div>
        </div>
        
        {/* Last updated */}
        <div className="flex items-center gap-2 text-xs text-archon-text-dim">
          <Clock className="w-4 h-4" />
          <span className="font-mono">
            {report?.timestamp ? new Date(report.timestamp).toLocaleTimeString() : '--'}
          </span>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`rounded-xl p-4 border mb-6 ${getStatusColor(report?.summary?.status || '')}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-semibold">{report?.summary?.headline || 'Loading...'}</p>
            <p className="text-sm opacity-80 capitalize">{report?.summary?.status || '--'}</p>
          </div>
          <div className="flex items-center gap-2">
            {getTrendIcon(trend?.trend?.direction || '')}
            <span className="text-xl font-bold font-mono">
              {report?.trend?.vsYesterday || '--'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Executions', value: metrics.executions, icon: FileText, color: 'text-archon-accent' },
          { label: 'Success', value: metrics.success, icon: CheckCircle2, color: 'text-archon-success' },
          { label: 'Errors', value: metrics.errors, icon: XCircle, color: 'text-archon-danger' },
          { label: 'Rate', value: `${Math.round(metrics.successRate)}%`, icon: TrendingUp, color: metrics.successRate >= 90 ? 'text-archon-success' : 'text-archon-warning' },
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="p-3 rounded-lg bg-archon-panel/50 border border-white/5 text-center"
          >
            {reportLoading ? (
              <div className="skeleton h-12 w-full rounded" />
            ) : (
              <>
                <metric.icon className={`w-4 h-4 ${metric.color} mx-auto mb-1`} />
                <p className={`text-xl font-bold font-mono ${metric.color}`}>{metric.value}</p>
                <p className="text-xs text-archon-text-dim">{metric.label}</p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      {/* Insights */}
      <div>
        <h3 className="text-sm font-medium text-archon-text-dim uppercase tracking-wider mb-3">
          AI Insights
        </h3>
        <div className="space-y-2">
          {reportLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-8 w-full rounded" />
              ))}
            </div>
          ) : (
            report?.insights?.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="flex items-center gap-2 p-2 rounded-lg bg-archon-panel/30"
              >
                <span className="text-lg">{insight.slice(0, 2)}</span>
                <span className="text-sm">{insight.slice(2)}</span>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Trend Forecast */}
      <div className="mt-6 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-archon-text-dim">Forecast</span>
          <span className={`text-sm font-medium capitalize ${
            trend?.trend?.forecast === 'improving' ? 'text-archon-success' :
            trend?.trend?.forecast === 'declining' ? 'text-archon-danger' :
            'text-archon-text-dim'
          }`}>
            {trend?.trend?.forecast || 'Stable'}
          </span>
        </div>
      </div>
    </motion.div>
  )
}
