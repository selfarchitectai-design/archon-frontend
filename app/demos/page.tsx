'use client'

import { useState } from 'react'

export default function DemosPage() {
  const [activeDemo, setActiveDemo] = useState('swarm')
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoResult, setDemoResult] = useState<any>(null)

  const demos = {
    swarm: {
      title: "AI Swarm",
      icon: "🤖",
      gradient: "from-purple-600 to-blue-600"
    },
    healing: {
      title: "Self-Healing",
      icon: "🔄",
      gradient: "from-green-600 to-teal-600"
    },
    cost: {
      title: "Cost Optimizer",
      icon: "💰",
      gradient: "from-orange-600 to-red-600"
    }
  }

  const runDemo = async (type: string) => {
    setDemoRunning(true)
    setDemoResult(null)
    await new Promise(r => setTimeout(r, 2000))
    
    const results: any = {
      swarm: { consensus: 8.4, models: 3 },
      healing: { recovery: "1.5s" },
      cost: { savings: 73 }
    }
    
    setDemoResult(results[type])
    setDemoRunning(false)
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-6xl font-black mb-16 text-center bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
          Live Demonstrations
        </h1>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(demos).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => setActiveDemo(key)}
              className={`p-8 rounded-3xl border-2 transition-all ${
                activeDemo === key ? 'border-purple-500 scale-105' : 'border-white/10'
              }`}
            >
              <div className="text-5xl mb-4">{demo.icon}</div>
              <h3 className="text-2xl font-bold">{demo.title}</h3>
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-12">
          <h2 className="text-3xl font-bold mb-6">
            {demos[activeDemo as keyof typeof demos].icon} {demos[activeDemo as keyof typeof demos].title}
          </h2>

          <button
            onClick={() => runDemo(activeDemo)}
            disabled={demoRunning}
            className={`px-8 py-4 rounded-2xl font-bold bg-gradient-to-r ${demos[activeDemo as keyof typeof demos].gradient}`}
          >
            {demoRunning ? '⏳ Running...' : '▶ Run Demo'}
          </button>

          {demoResult && (
            <div className="mt-8 p-6 rounded-2xl bg-purple-900/20 border border-purple-500/30">
              <pre className="text-sm">{JSON.stringify(demoResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
