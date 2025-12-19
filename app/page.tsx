'use client';

import { useEffect, useState } from 'react';

interface SystemStatus {
  version: string;
  status: string;
  infrastructure: {
    lambda: { total: number; active: number };
    dynamodb: { tables: string[] };
    s3: { buckets: string[] };
  };
  costs: { estimated: string };
  metrics: { performanceScore: number; autonomyLevel: number };
}

export default function Home() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/system-status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2"></span>
              <span className="text-purple-300 text-sm font-medium">
                {loading ? 'Loading...' : `v${status?.version || '2.2.0'} • ${status?.status || 'operational'}`}
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent">
                ARCHON
              </span>
              <br />
              <span className="text-3xl md:text-4xl text-gray-300">
                Self-Evolving AI Operations Platform
              </span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-12">
              Enterprise-grade autonomous AI infrastructure that learns, adapts, and optimizes itself.
              Powered by 19-layer neural architecture.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <a href="/demos" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold text-white hover:opacity-90 transition-all transform hover:scale-105">
                Live Demo
              </a>
              <a href="/case-studies" className="px-8 py-4 bg-white/10 border border-white/20 rounded-lg font-semibold text-white hover:bg-white/20 transition-all">
                Case Studies
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Lambda Functions', value: status?.infrastructure?.lambda?.total || 14 },
            { label: 'DynamoDB Tables', value: status?.infrastructure?.dynamodb?.tables?.length || 4 },
            { label: 'Performance Score', value: `${status?.metrics?.performanceScore || 99.1}%` },
            { label: 'Monthly Cost', value: status?.costs?.estimated || '$20' }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Platform Capabilities</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: '🧠', title: 'Neural Orchestration', desc: 'Master orchestrator coordinates 14 Lambda functions with sub-100ms latency' },
            { icon: '📈', title: 'Trend Analysis', desc: 'Real-time pattern recognition across HackerNews, GitHub, and ArXiv' },
            { icon: '🔄', title: 'Self-Evolution', desc: 'Autonomous system optimization with 99.5% autonomy level' },
            { icon: '💰', title: 'Cost Optimization', desc: 'Reduced from $60/month to $20/month - 67% savings' },
            { icon: '🔗', title: 'N8N Integration', desc: '14 automated workflows for business process automation' },
            { icon: '🛡️', title: 'Enterprise Security', desc: 'OPA-based authorization with IAM integration' }
          ].map((feature, i) => (
            <div key={i} className="bg-gradient-to-br from-white/5 to-white/0 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-all">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-3xl p-12 text-center border border-purple-500/20">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Deploy ARCHON?</h2>
          <p className="text-xl text-gray-300 mb-8">Start with our free tier - no credit card required</p>
          <a href="/pricing" className="inline-flex px-8 py-4 bg-white text-purple-900 rounded-lg font-semibold hover:bg-gray-100 transition-all">
            View Pricing
          </a>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          <p>© 2025 ARCHON by SelfArchitect AI. All rights reserved.</p>
          <p className="text-sm mt-2">selfarchitectai.com</p>
        </div>
      </footer>
    </main>
  );
}
