'use client'

export default function CaseStudiesPage() {
  const cases = [
    {
      company: "TechStartup Inc",
      industry: "SaaS Platform",
      challenge: "Managing 50+ microservices with manual deployment and monitoring",
      solution: "Full ARCHON deployment with AI-powered orchestration",
      results: [
        { metric: "97%", label: "Reduction in deployment time", icon: "⚡" },
        { metric: "$18K", label: "Monthly cost savings", icon: "💰" },
        { metric: "99.9%", label: "Uptime achieved", icon: "🎯" },
        { metric: "3 hrs", label: "Saved per engineer daily", icon: "⏰" }
      ],
      quote: "ARCHON transformed our infrastructure from a maintenance nightmare into a self-managing system. Our team can now focus on building features instead of firefighting.",
      author: "Sarah Chen",
      role: "CTO",
      color: "from-blue-600 to-cyan-600"
    },
    {
      company: "E-commerce Giant",
      industry: "Retail Platform",
      challenge: "Black Friday traffic spikes causing $500K+ in lost sales",
      solution: "Predictive scaling with ARCHON's cost optimizer",
      results: [
        { metric: "100%", label: "Uptime during peak", icon: "🚀" },
        { metric: "73%", label: "Infrastructure cost reduction", icon: "📉" },
        { metric: "0", label: "Manual interventions needed", icon: "🤖" },
        { metric: "15min", label: "Auto-scaling response time", icon: "⚡" }
      ],
      quote: "Last Black Friday, we handled 10x traffic with zero downtime and actually reduced our AWS bill. ARCHON's predictive scaling is like magic.",
      author: "Michael Rodriguez",
      role: "VP Engineering",
      color: "from-purple-600 to-pink-600"
    },
    {
      company: "HealthTech Co",
      industry: "Medical Devices",
      challenge: "HIPAA compliance + real-time monitoring of 10K+ IoT devices",
      solution: "ARCHON IoT module + automated compliance reporting",
      results: [
        { metric: "100%", label: "HIPAA compliance maintained", icon: "🔒" },
        { metric: "10K+", label: "Devices monitored", icon: "📡" },
        { metric: "<1s", label: "Anomaly detection time", icon: "🎯" },
        { metric: "90%", label: "Reduction in false alarms", icon: "✅" }
      ],
      quote: "Managing IoT devices at scale while maintaining compliance was our biggest headache. ARCHON automated everything and our audit went perfectly.",
      author: "Dr. Amanda Park",
      role: "Chief Medical Officer",
      color: "from-green-600 to-teal-600"
    }
  ]

  const metrics = {
    totalCustomers: 127,
    avgROI: 850,
    avgTimeSaved: 120,
    avgCostReduction: 68
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4 px-4 py-2 bg-indigo-500/20 rounded-full border border-indigo-500/30">
            <span className="text-indigo-300 text-sm font-semibold">
              Real Results from Real Companies
            </span>
          </div>
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-white via-indigo-200 to-white bg-clip-text text-transparent">
            Success Stories
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            See how companies are transforming their infrastructure with ARCHON
          </p>
        </div>

        {/* Aggregate Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-4xl font-bold text-blue-400 mb-2">{metrics.totalCustomers}+</div>
            <div className="text-sm text-gray-400">Production Deployments</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-4xl font-bold text-green-400 mb-2">{metrics.avgROI}%</div>
            <div className="text-sm text-gray-400">Average ROI</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-4xl font-bold text-purple-400 mb-2">{metrics.avgTimeSaved}h</div>
            <div className="text-sm text-gray-400">Saved per Month</div>
          </div>
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10 text-center">
            <div className="text-4xl font-bold text-yellow-400 mb-2">{metrics.avgCostReduction}%</div>
            <div className="text-sm text-gray-400">Cost Reduction</div>
          </div>
        </div>

        {/* Case Studies */}
        <div className="space-y-12">
          {cases.map((caseStudy, idx) => (
            <div
              key={idx}
              className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden hover:border-white/30 transition-all"
            >
              <div className={`h-2 bg-gradient-to-r ${caseStudy.color}`}></div>
              
              <div className="p-8">
                {/* Company Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-bold mb-2">{caseStudy.company}</h3>
                    <div className="inline-block px-3 py-1 bg-white/10 rounded-full">
                      <span className="text-sm text-gray-300">{caseStudy.industry}</span>
                    </div>
                  </div>
                </div>

                {/* Challenge & Solution */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div>
                    <h4 className="text-xl font-bold text-red-400 mb-3">❌ Challenge</h4>
                    <p className="text-gray-300">{caseStudy.challenge}</p>
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-green-400 mb-3">✅ Solution</h4>
                    <p className="text-gray-300">{caseStudy.solution}</p>
                  </div>
                </div>

                {/* Results Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {caseStudy.results.map((result, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                      <div className="text-3xl mb-2">{result.icon}</div>
                      <div className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        {result.metric}
                      </div>
                      <div className="text-xs text-gray-400">{result.label}</div>
                    </div>
                  ))}
                </div>

                {/* Quote */}
                <div className={`bg-gradient-to-r ${caseStudy.color} bg-opacity-10 rounded-2xl p-6 border-l-4`}>
                  <p className="text-lg italic mb-4">"{caseStudy.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${caseStudy.color} flex items-center justify-center text-xl font-bold`}>
                      {caseStudy.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold">{caseStudy.author}</div>
                      <div className="text-sm text-gray-400">{caseStudy.role}, {caseStudy.company}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-12">
          <h2 className="text-4xl font-bold mb-4">Ready to write your success story?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join 127+ companies already transforming their infrastructure with ARCHON
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/demos"
              className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold text-lg hover:scale-105 transition-transform"
            >
              Try Live Demo
            </a>
            <a
              href="/contact"
              className="px-8 py-4 bg-white/20 backdrop-blur rounded-xl font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
            >
              Schedule Call
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
