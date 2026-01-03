'use client'

import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingDown, 
  Lightbulb,
  ArrowRight,
  Zap,
  Loader2
} from 'lucide-react'

interface CostData {
  timestamp: string
  costs: {
    current: Record<string, { cost: number; unit: string }>
    totalMonthly: number
    currency: string
  }
  optimization: {
    recommendations: Array<{
      service: string
      action: string
      savings: string
      risk: string
    }>
    potentialSavings: number
    savingsPercent: number
  }
  trend: {
    vsLastMonth: string
    vsLastWeek: string
    status: string
  }
  budget: {
    monthly: number
    used: number
    remaining: number
    onTrack: boolean
  }
}

async function fetchCosts(): Promise<CostData> {
  const res = await fetch('/api/archon/costs')
  if (!res.ok) throw new Error('Cost fetch failed')
  return res.json()
}

async function triggerOptimize() {
  const res = await fetch('/api/archon/costs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'analyze' })
  })
  return res.json()
}

export function CostPanel() {
  const { data, isLoading } = useQuery({
    queryKey: ['costs'],
    queryFn: fetchCosts,
    refetchInterval: 60000, // 1 minute
  })

  const optimizeMutation = useMutation({
    mutationFn: triggerOptimize,
  })

  const totalCost = data?.costs?.totalMonthly || 0
  const budget = data?.budget?.monthly || 50
  const budgetPercent = (totalCost / budget) * 100
  const savings = data?.optimization?.potentialSavings || 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="archon-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-warning/10">
            <DollarSign className="w-6 h-6 text-archon-warning" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Cost Optimizer</h2>
            <p className="text-sm text-archon-text-dim">AWS cost analysis & savings</p>
          </div>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => optimizeMutation.mutate()}
          disabled={optimizeMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-archon-accent/10 hover:bg-archon-accent/20 text-archon-accent text-sm font-medium transition-colors"
        >
          {optimizeMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Zap className="w-4 h-4" />
          )}
          Optimize
        </motion.button>
      </div>

      {/* Main Cost Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Current Cost */}
        <div className="p-4 rounded-xl bg-archon-panel/50 border border-white/5">
          <p className="text-xs text-archon-text-dim uppercase tracking-wider mb-1">Monthly Cost</p>
          {isLoading ? (
            <div className="skeleton h-10 w-24 rounded" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-archon-accent">
                ${totalCost.toFixed(2)}
              </span>
              <span className="text-sm text-archon-text-dim">/mo</span>
            </div>
          )}
          <div className="flex items-center gap-1 mt-2 text-archon-success text-sm">
            <TrendingDown className="w-4 h-4" />
            <span>{data?.trend?.vsLastMonth || '-12%'} vs last month</span>
          </div>
        </div>

        {/* Potential Savings */}
        <div className="p-4 rounded-xl bg-archon-success/5 border border-archon-success/20">
          <p className="text-xs text-archon-text-dim uppercase tracking-wider mb-1">Potential Savings</p>
          {isLoading ? (
            <div className="skeleton h-10 w-24 rounded" />
          ) : (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-mono text-archon-success">
                ${savings.toFixed(2)}
              </span>
              <span className="text-sm text-archon-text-dim">/mo</span>
            </div>
          )}
          <p className="text-sm text-archon-success mt-2">
            {data?.optimization?.savingsPercent || 0}% of current spend
          </p>
        </div>
      </div>

      {/* Budget Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-archon-text-dim">Budget Usage</span>
          <span className="text-sm font-mono">
            ${totalCost.toFixed(2)} / ${budget.toFixed(2)}
          </span>
        </div>
        <div className="h-2 bg-archon-panel rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(budgetPercent, 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              budgetPercent > 90 ? 'bg-archon-danger' :
              budgetPercent > 70 ? 'bg-archon-warning' :
              'bg-archon-success'
            }`}
          />
        </div>
        <p className={`text-xs mt-1 ${data?.budget?.onTrack ? 'text-archon-success' : 'text-archon-warning'}`}>
          {data?.budget?.onTrack ? '✓ On track' : '⚠ Watch spending'}
        </p>
      </div>

      {/* Recommendations */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-archon-text-dim uppercase tracking-wider flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-archon-warning" />
          Recommendations
        </h3>
        
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : (
          data?.optimization?.recommendations?.slice(0, 3).map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-archon-panel/50 border border-white/5 hover:border-archon-accent/20 transition-colors cursor-pointer group"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{rec.service}</p>
                <p className="text-xs text-archon-text-dim">{rec.action}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-archon-success">{rec.savings}</span>
                <ArrowRight className="w-4 h-4 text-archon-text-dim group-hover:text-archon-accent transition-colors" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
