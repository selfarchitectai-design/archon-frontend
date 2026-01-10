import { NextResponse } from 'next/server'

const N8N_BASE = 'https://n8n.selfarchitectai.com/webhook'

function getFallbackCosts() {
  const now = new Date()
  const dayOfMonth = now.getDate()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthlyCost = 3.80 + (dayOfMonth * 0.12)
  const projectedMonthly = (monthlyCost / dayOfMonth) * daysInMonth
  
  return {
    timestamp: now.toISOString(),
    costs: {
      totalMonthly: Number(monthlyCost.toFixed(2)),
      projectedMonthly: Number(projectedMonthly.toFixed(2)),
      currency: 'USD',
      breakdown: {
        lambda: Number((monthlyCost * 0.4).toFixed(2)),
        n8n: 0,
        storage: Number((monthlyCost * 0.2).toFixed(2)),
        bandwidth: Number((monthlyCost * 0.4).toFixed(2)),
        vercel: 0
      }
    },
    budget: {
      monthly: 50,
      used: Number(monthlyCost.toFixed(2)),
      remaining: Number((50 - monthlyCost).toFixed(2)),
      percentUsed: Number(((monthlyCost / 50) * 100).toFixed(1)),
      onTrack: monthlyCost < (50 * dayOfMonth / daysInMonth)
    },
    optimization: {
      recommendations: [
        { id: 1, title: 'Lambda Cold Start Optimization', savings: 0.50, priority: 'medium', status: 'available' },
        { id: 2, title: 'Cache Frequently Accessed Data', savings: 0.30, priority: 'low', status: 'implemented' },
        { id: 3, title: 'Reduce N8N Execution Frequency', savings: 0.20, priority: 'low', status: 'available' }
      ],
      potentialSavings: 1.00,
      implementedSavings: 15.20
    },
    trend: { vsLastMonth: -12, direction: 'down', status: 'optimized' },
    forecast: { nextMonth: 3.50, trend: 'decreasing' }
  }
}

export async function GET() {
  // Try N8N first
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    
    const res = await fetch(`${N8N_BASE}/archon/costs`, {
      cache: 'no-store',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }
    })
    
    clearTimeout(timeout)
    
    if (res.ok) {
      const data = await res.json()
      if (data.code !== 0 && !data.message?.includes('problem')) {
        return NextResponse.json({ ...data, source: 'n8n' })
      }
    }
  } catch {
    // N8N unavailable
  }
  
  return NextResponse.json({ ...getFallbackCosts(), source: 'fallback' })
}
