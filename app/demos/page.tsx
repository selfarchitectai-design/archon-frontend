'use client'

import { useState } from 'react'

export default function PremiumDemos() {
  const [activeDemo, setActiveDemo] = useState('swarm')
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoResult, setDemoResult] = useState<any>(null)

  const demos = {
    swarm: {
      title: "AI Swarm Orchestration",
      icon: "🤖",
      description: "Watch 6 AI models collaborate in real-time",
      gradient: "from-purple-600 to-blue-600",
      time: "~15s"
    },
    healing: {
      title: "Self-Healing Demo",
      icon: "🔄",
      description: "See automatic recovery from API failures",
      gradient: "from-green-600 to-teal-600",
      time: "~8s"
    },
    cost: {
      title: "Cost Optimization",
      icon: "💰",
      description: "Real-time infrastructure analysis",
      gradient: "from-orange-600 to-red-600",
      time: "~5s"
    }
  }

  const runDemo = async (demoType: string) => {
    setDemoRunning(true)
    setDemoResult(null)

    await new Promise(resolve => setTimeout(resolve, 2000))

    const mockResults = {
      swarm: {
        synthesized: "Strong startup concept with exceptional market timing. The AI-powered meal planning space shows 340% YoY growth, with clear differentiation opportunities in personalization and dietary compliance.",
        breakdown: [
          { model: "Claude Sonnet 4", score: 8.7, insight: "Excellent product-market fit", color: "purple" },
          { model: "GPT-4", score: 8.3, insight: "Strong competitive positioning", color: "blue" },
          { model: "Gemini Pro", score: 8.1, insight: "Health tech momentum", color: "green" },
        ],
        consensus: 8.4,
        recommendation: "Proceed with MVP - prioritize mobile-first experience"
      },
      healing: {
        timeline: [
          { time: "0ms", event: "Request initiated", status: "info", icon: "🚀" },
          { time: "120ms", event: "429 Rate Limit detected", status: "error", icon: "⚠️" },
          { time: "125ms", event: "Switched to backup endpoint", status: "success", icon: "✅" },
          { time: "250ms", event: "Request queued (position: 3)", status: "info", icon: "⏳" },
          { time: "1500ms", event: "Retry successful - 200 OK", status: "success", icon: "🎉" },
        ],
        recovery_time: "1.5s",
        success: true
      },
      cost: {
        current: 45,
        optimized: 12,
        savings: 73,
        recommendations: [
          { action: "Reduce Lambda memory: 2048MB → 512MB", savings: "$18/mo", impact: "High" },
          { action: "Enable ARM64 architecture", savings: "$8/mo", impact: "Medium" },
          { action: "Implement smart caching layer", savings: "$7/mo", impact: "Medium" }
        ]
      }
    }

    setDemoResult(mockResults[demoType as keyof typeof mockResults])
    setDemoRunning(false)
  }

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8b5cf620_1px,transparent_1px),linear-gradient(to_bottom,#8b5cf620_1px,transparent_1px)] bg-[size:4rem_4rem]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-6 py-3 rounded-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 backdrop-blur-xl">
            <span className="text-sm font-medium bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
              Interactive Playground
            </span>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            Live Demonstrations
          </h1>
          
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Experience ARCHON's capabilities in real-time. No sign-up required.
          </p>
        </div>

        {/* Demo Selector */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {Object.entries(demos).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => setActiveDemo(key)}
              className={`group relative p-8 rounded-3xl text-left transition-all ${
                activeDemo === key
                  ? 'scale-105 shadow-2xl'
                  : 'hover:scale-102'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${demo.gradient} ${
                activeDemo === key ? 'opacity-20' : 'opacity-5 group-hover:opacity-10'
              } rounded-3xl transition-opacity`} />
              
              <div className={`absolute inset-0 border-2 ${
                activeDemo === key ? 'border-purple-500' : 'border-white/10 group-hover:border-white/20'
              } rounded-3xl transition-colors`} />

              <div className="relative">
                <div className="text-5xl mb-4">{demo.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{demo.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{demo.description}</p>
                <div className="inline-block px-3 py-1 rounded-full bg-white/10 border border-white/20">
                  <span className="text-xs text-gray-300">⏱️ {demo.time}</span>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Demo Execution Area */}
        <div className="relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-8 md:p-12">
          <div className={`absolute inset-0 bg-gradient-to-br ${demos[activeDemo as keyof typeof demos].gradient} opacity-5 rounded-3xl`} />
          
          <div className="relative">
            {/* Demo Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                  <span className="text-4xl">{demos[activeDemo as keyof typeof demos].icon}</span>
                  {demos[activeDemo as keyof typeof demos].title}
                </h2>
                <p className="text-gray-400">{demos[activeDemo as keyof typeof demos].description}</p>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={() => runDemo(activeDemo)}
              disabled={demoRunning}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                demoRunning ? '' : 'hover:scale-105'
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${demos[activeDemo as keyof typeof demos].gradient} rounded-2xl`} />
              <span className="relative flex items-center gap-2">
                {demoRunning ? (
                  <>
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span>▶</span>
                    Run Demo
                  </>
                )}
              </span>
            </button>

            {/* Results */}
            {demoResult && activeDemo === 'swarm' && (
              <div className="mt-8 space-y-6 animate-fadeIn">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                    <span>🎯</span>
                    Synthesized Analysis
                  </h3>
                  <p className="text-gray-300 mb-4">{demoResult.synthesized}</p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30">
                    <span className="font-bold text-green-400">Consensus: {demoResult.consensus}/10</span>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  {demoResult.breakdown.map((result: any, idx: number) => (
                    <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-semibold text-sm">{result.model}</span>
                        <span className={`text-2xl font-black text-${result.color}-400`}>{result.score}</span>
                      </div>
                      <p className="text-sm text-gray-400">{result.insight}</p>
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30">
                  <h3 className="font-bold mb-2">✅ Recommendation</h3>
                  <p className="text-lg">{demoResult.recommendation}</p>
                </div>
              </div>
            )}

            {demoResult && activeDemo === 'healing' && (
              <div className="mt-8 space-y-6 animate-fadeIn">
                {demoResult.timeline.map((event: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/5">
                    <span className="text-2xl">{event.icon}</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold">{event.event}</span>
                        <span className="text-sm text-gray-500">{event.time}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="p-6 rounded-2xl bg-gradient-to-r from-green-600/20 to-blue-600/20 border border-green-500/30">
                  <h3 className="font-bold mb-2">✅ Recovery Complete</h3>
                  <p>Total time: <span className="font-bold text-green-400">{demoResult.recovery_time}</span></p>
                  <p className="text-sm text-gray-400 mt-2">Zero downtime • Automatic failover • Request preserved</p>
                </div>
              </div>
            )}

            {demoResult && activeDemo === 'cost' && (
              <div className="mt-8 space-y-6 animate-fadeIn">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/30">
                    <div className="text-sm text-gray-400 mb-2">Current</div>
                    <div className="text-4xl font-black text-red-400">${demoResult.current}</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-green-500/10 border border-green-500/30">
                    <div className="text-sm text-gray-400 mb-2">Optimized</div>
                    <div className="text-4xl font-black text-green-400">${demoResult.optimized}</div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                  <div className="p-6 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                    <div className="text-sm text-gray-400 mb-2">Savings</div>
                    <div className="text-4xl font-black text-blue-400">{demoResult.savings}%</div>
                    <div className="text-sm text-gray-500">reduction</div>
                  </div>
                </div>

                <div className="space-y-3">
                  {demoResult.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-white/5 flex justify-between items-center">
                      <div>
                        <span className="font-semibold">{rec.action}</span>
                        <span className={`ml-3 text-xs px-2 py-1 rounded-full ${
                          rec.impact === 'High' ? 'bg-red-500/20 text-red-400' :
                          rec.impact === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>{rec.impact}</span>
                      </div>
                      <span className="font-bold text-green-400">{rec.savings}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-3xl font-bold mb-4">Want a personalized demo?</h3>
          <p className="text-gray-400 mb-6">See ARCHON with your actual infrastructure</p>
          <a
            href="/pricing"
            className="inline-block px-8 py-4 rounded-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 hover:scale-105 transition-transform"
          >
            Get Started Free →
          </a>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}

  const [activeDemo, setActiveDemo] = useState('swarm')
  const [demoRunning, setDemoRunning] = useState(false)
  const [demoResult, setDemoResult] = useState<any>(null)

  const demos = {
    swarm: {
      title: "🤖 AI Swarm Orchestration",
      description: "Watch 6 different AI models tackle a complex problem in parallel",
      input: "Analyze this startup idea: 'AI-powered meal planning app'",
      models: ["Claude Sonnet", "Claude Haiku", "GPT-4", "Gemini Pro", "Llama 3", "Mixtral"],
      estimatedTime: "15s"
    },
    healing: {
      title: "🔄 Self-Healing Demo",
      description: "Simulate API failure and watch automatic recovery",
      input: "POST request → Simulated 429 Rate Limit",
      recovery: ["Detect failure", "Switch to backup", "Queue request", "Retry with backoff"],
      estimatedTime: "8s"
    },
    cost: {
      title: "💰 Cost Optimization",
      description: "Real-time analysis of your infrastructure costs",
      input: "Current Lambda configuration",
      analysis: ["Memory optimization", "Cold start reduction", "Spot instance suggestions"],
      estimatedTime: "5s"
    }
  }

  const runDemo = async (demoType: string) => {
    setDemoRunning(true)
    setDemoResult(null)

    // Simulate demo execution
    await new Promise(resolve => setTimeout(resolve, 2000))

    const mockResults = {
      swarm: {
        synthesized: "This is a strong startup concept with high market potential...",
        breakdown: [
          { model: "Claude Sonnet", score: 8.5, insight: "Strong product-market fit" },
          { model: "GPT-4", score: 8.2, insight: "Competitive market but differentiated" },
          { model: "Gemini Pro", score: 7.9, insight: "Good timing, health tech trending" },
        ],
        consensus: 8.2,
        recommendation: "Proceed with MVP development"
      },
      healing: {
        timeline: [
          { time: "0ms", event: "Request initiated", status: "info" },
          { time: "120ms", event: "429 Rate Limit detected", status: "error" },
          { time: "125ms", event: "Switched to backup endpoint", status: "success" },
          { time: "250ms", event: "Request queued", status: "info" },
          { time: "1500ms", event: "Retry successful", status: "success" },
        ],
        recovery_time: "1.5s",
        success: true
      },
      cost: {
        current: 45,
        optimized: 12,
        savings: 73,
        recommendations: [
          { action: "Reduce Lambda memory: 2048MB → 512MB", savings: "$18/mo" },
          { action: "Enable Provisioned Concurrency", savings: "$8/mo" },
          { action: "Migrate to ARM64 architecture", savings: "$7/mo" }
        ]
      }
    }

    setDemoResult(mockResults[demoType as keyof typeof mockResults])
    setDemoRunning(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent">
            Interactive Demos
          </h1>
          <p className="text-xl text-gray-300">
            Experience ARCHON's capabilities in real-time
          </p>
        </div>

        {/* Demo Selector */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {Object.entries(demos).map(([key, demo]) => (
            <button
              key={key}
              onClick={() => setActiveDemo(key)}
              className={`p-6 rounded-2xl text-left transition-all ${
                activeDemo === key
                  ? 'bg-gradient-to-br from-blue-600 to-purple-600 scale-105 shadow-xl'
                  : 'bg-white/5 hover:bg-white/10 border border-white/10'
              }`}
            >
              <div className="text-3xl mb-2">{demo.title.split(' ')[0]}</div>
              <h3 className="text-xl font-bold mb-2">{demo.title.substring(3)}</h3>
              <p className="text-sm text-gray-300">{demo.description}</p>
              <div className="mt-4 text-xs text-gray-400">
                ⏱️ {demo.estimatedTime}
              </div>
            </button>
          ))}
        </div>

        {/* Active Demo */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-8">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-4">
              {demos[activeDemo as keyof typeof demos].title}
            </h2>
            <p className="text-gray-300 mb-6">
              {demos[activeDemo as keyof typeof demos].description}
            </p>

            {/* Demo Input */}
            <div className="bg-black/30 rounded-xl p-4 mb-6 font-mono text-sm">
              <div className="text-gray-400 mb-2">Input:</div>
              <div className="text-green-400">
                {demos[activeDemo as keyof typeof demos].input}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={() => runDemo(activeDemo)}
              disabled={demoRunning}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {demoRunning ? '⏳ Running Demo...' : '▶️ Run Demo'}
            </button>
          </div>

          {/* Demo Results */}
          {demoRunning && (
            <div className="border-t border-white/10 pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg">Processing...</span>
              </div>
            </div>
          )}

          {demoResult && activeDemo === 'swarm' && (
            <div className="border-t border-white/10 pt-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-3">🎯 Synthesized Result</h3>
                <p className="text-gray-300">{demoResult.synthesized}</p>
                <div className="mt-4 inline-block px-4 py-2 bg-green-500/20 rounded-full border border-green-500/30">
                  <span className="text-green-400 font-bold">
                    Consensus Score: {demoResult.consensus}/10
                  </span>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-3">🤖 Individual Model Results</h3>
                <div className="space-y-3">
                  {demoResult.breakdown.map((result: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">{result.model}</span>
                        <span className="text-2xl font-bold text-blue-400">{result.score}</span>
                      </div>
                      <p className="text-sm text-gray-400">{result.insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-green-500/30">
                <h3 className="text-xl font-bold mb-2">✅ Recommendation</h3>
                <p className="text-lg">{demoResult.recommendation}</p>
              </div>
            </div>
          )}

          {demoResult && activeDemo === 'healing' && (
            <div className="border-t border-white/10 pt-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-4">🔄 Recovery Timeline</h3>
                <div className="space-y-3">
                  {demoResult.timeline.map((event: any, idx: number) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className={`w-3 h-3 rounded-full mt-1 ${
                        event.status === 'success' ? 'bg-green-500' :
                        event.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                      }`}></div>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">{event.event}</span>
                          <span className="text-sm text-gray-400">{event.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-green-500/30">
                <h3 className="text-xl font-bold mb-2">✅ Recovery Complete</h3>
                <p className="text-lg">
                  Total recovery time: <span className="font-bold text-green-400">{demoResult.recovery_time}</span>
                </p>
                <p className="text-sm text-gray-300 mt-2">
                  Zero downtime • Automatic failover • Request preserved
                </p>
              </div>
            </div>
          )}

          {demoResult && activeDemo === 'cost' && (
            <div className="border-t border-white/10 pt-8 space-y-6">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-red-500/10 rounded-xl p-6 border border-red-500/30">
                  <div className="text-sm text-gray-400 mb-2">Current Cost</div>
                  <div className="text-4xl font-bold text-red-400">${demoResult.current}</div>
                  <div className="text-sm text-gray-400">per month</div>
                </div>
                <div className="bg-green-500/10 rounded-xl p-6 border border-green-500/30">
                  <div className="text-sm text-gray-400 mb-2">Optimized Cost</div>
                  <div className="text-4xl font-bold text-green-400">${demoResult.optimized}</div>
                  <div className="text-sm text-gray-400">per month</div>
                </div>
                <div className="bg-blue-500/10 rounded-xl p-6 border border-blue-500/30">
                  <div className="text-sm text-gray-400 mb-2">Savings</div>
                  <div className="text-4xl font-bold text-blue-400">{demoResult.savings}%</div>
                  <div className="text-sm text-gray-400">reduction</div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-4">💡 Recommended Actions</h3>
                <div className="space-y-3">
                  {demoResult.recommendations.map((rec: any, idx: number) => (
                    <div key={idx} className="bg-white/5 rounded-lg p-4 flex justify-between items-center">
                      <span>{rec.action}</span>
                      <span className="font-bold text-green-400">{rec.savings}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-green-500/30">
                <p className="text-lg">
                  💰 Annual savings: <span className="font-bold text-green-400">${(demoResult.current - demoResult.optimized) * 12}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Additional Demos CTA */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold mb-4">Want to see more?</h3>
          <p className="text-gray-300 mb-6">
            Schedule a personalized demo with your actual infrastructure
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl font-bold hover:scale-105 transition-transform"
          >
            Book Custom Demo
          </a>
        </div>
      </div>
    </div>
  )
}
