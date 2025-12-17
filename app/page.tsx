'use client'

import { useState, useEffect } from 'react'

export default function PremiumHome() {
  const [metrics, setMetrics] = useState({
    lambdaCount: 45,
    workflowsActive: 14,
    requestsToday: 2341,
    costSavings: 8750
  })

  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        requestsToday: prev.requestsToday + Math.floor(Math.random() * 3)
      }))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* Animated Background Grid */}
      <div className="fixed inset-0 opacity-20">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            transform: `translateY(${scrollY * 0.5}px)`
          }}
        />
      </div>

      {/* Gradient Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-1/3 -right-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-1/4 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      {/* Hero Section */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24">
          {/* Floating Badge */}
          <div className="flex justify-center mb-8 animate-float">
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/30 backdrop-blur-xl">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm font-medium bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                Production Ready • 14 Workflows Active
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-center mb-6">
            <div className="text-7xl md:text-9xl font-black tracking-tight leading-none">
              <span className="block bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent animate-gradient-x">
                ARCHON
              </span>
              <span className="block text-5xl md:text-7xl mt-4 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                V2.2 Ultimate
              </span>
            </div>
          </h1>

          {/* Tagline */}
          <p className="text-center text-xl md:text-3xl text-gray-400 max-w-4xl mx-auto mb-12 leading-relaxed">
            The AI platform that <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-semibold">builds itself</span>,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-semibold">heals itself</span>, and{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 font-semibold">optimizes itself</span>{' '}
            while you sleep
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <a
              href="/demos"
              className="group relative px-8 py-4 rounded-2xl font-bold text-lg overflow-hidden transition-all hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 transition-all" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center gap-2">
                <span>Try Live Demos</span>
                <span className="text-2xl group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </a>
            
            <a
              href="/case-studies"
              className="group px-8 py-4 rounded-2xl font-bold text-lg border-2 border-purple-500/30 hover:border-purple-500/60 backdrop-blur-xl bg-black/50 transition-all hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <span>View Success Stories</span>
                <span className="text-xl group-hover:rotate-45 transition-transform">✦</span>
              </span>
            </a>
          </div>

          {/* Live Metrics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { value: metrics.lambdaCount, label: 'Lambda Functions', color: 'from-green-400 to-emerald-600', icon: '⚡' },
              { value: metrics.workflowsActive, label: 'Active Workflows', color: 'from-blue-400 to-cyan-600', icon: '🔄' },
              { value: metrics.requestsToday.toLocaleString(), label: 'Requests Today', color: 'from-purple-400 to-pink-600', icon: '📊', animate: true },
              { value: `${metrics.costSavings}%`, label: 'ROI', color: 'from-yellow-400 to-orange-600', icon: '💰' }
            ].map((metric, idx) => (
              <div
                key={idx}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-6 hover:border-white/30 transition-all hover:scale-105"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative">
                  <div className="text-4xl mb-3">{metric.icon}</div>
                  <div className={`text-4xl font-black mb-2 bg-gradient-to-r ${metric.color} bg-clip-text text-transparent ${metric.animate ? 'transition-all duration-300' : ''}`}>
                    {metric.value}
                  </div>
                  <div className="text-sm text-gray-400 uppercase tracking-wider">{metric.label}</div>
                </div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features Showcase */}
      <div className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              Autonomous Intelligence
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Stop managing infrastructure. Let ARCHON handle everything.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: '🤖',
                title: 'AI Swarm Orchestration',
                description: 'Coordinate 6 AI models in parallel. Get synthesized insights 89% faster.',
                metric: '89% faster',
                color: 'from-purple-600 to-blue-600'
              },
              {
                icon: '🔄',
                title: 'Self-Healing Systems',
                description: 'Automatic failover, request queuing, and recovery. 99.2% uptime guaranteed.',
                metric: '99.2% uptime',
                color: 'from-green-600 to-teal-600'
              },
              {
                icon: '💰',
                title: 'Intelligent Cost Optimizer',
                description: 'ML-powered resource allocation. Average savings: $1,800 per year.',
                metric: '$1.8K saved/year',
                color: 'from-orange-600 to-red-600'
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-xl p-8 hover:border-white/30 transition-all hover:scale-[1.02]"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity`} />
                
                <div className="relative">
                  <div className="text-6xl mb-6">{feature.icon}</div>
                  <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                  <p className="text-gray-400 mb-6">{feature.description}</p>
                  
                  <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-white/20">
                    <span className={`font-bold bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                      {feature.metric}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className="relative py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center bg-gradient-to-r from-purple-900/20 to-blue-900/20 rounded-3xl border border-purple-500/30 backdrop-blur-xl p-12">
            <div className="grid md:grid-cols-3 gap-12">
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  127+
                </div>
                <div className="text-gray-400">Production Deployments</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent mb-2">
                  850%
                </div>
                <div className="text-gray-400">Average ROI</div>
              </div>
              <div>
                <div className="text-5xl font-black bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent mb-2">
                  99.2%
                </div>
                <div className="text-gray-400">System Uptime</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="relative py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-purple-200 to-white bg-clip-text text-transparent">
            Ready to go autonomous?
          </h2>
          <p className="text-xl text-gray-400 mb-10">
            Deploy ARCHON in your AWS account. Watch it optimize itself.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/pricing"
              className="group relative px-10 py-5 rounded-2xl font-bold text-xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 animate-gradient-x" />
              <span className="relative">Get Started Free →</span>
            </a>
            
            <a
              href="/demos"
              className="px-10 py-5 rounded-2xl font-bold text-xl border-2 border-purple-500/50 hover:border-purple-500 backdrop-blur-xl bg-black/50 transition-all"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </div>

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
        
        .animate-blob {
          animation: blob 7s ease-in-out infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
}
