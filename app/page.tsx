'use client';

import { useEffect, useState } from 'react';

// Navbar Component
const Navbar = () => (
  <nav className="bg-gray-900 text-white p-4 fixed top-0 left-0 right-0 z-50">
    <div className="container mx-auto flex justify-between items-center">
      <a href="/" className="text-2xl font-bold hover:text-purple-400 transition-colors">
        ARCHON<span className="text-purple-400">.ai</span>
      </a>
      <div className="flex items-center space-x-6">
        <a href="/demos" className="hover:text-purple-400 transition-colors font-medium">Demos</a>
        <a href="/case-studies" className="hover:text-purple-400 transition-colors font-medium">Case Studies</a>
        <a href="/modes" className="hover:text-purple-400 transition-colors font-medium">Persona Modes</a>
        <a href="/workflows" className="hover:text-purple-400 transition-colors font-medium">Workflows</a>
        <a href="/dashboard" className="hover:text-purple-400 transition-colors font-medium">Dashboard</a>
        <a href="/pricing" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:scale-105 transition-transform font-semibold">
          Get Started
        </a>
      </div>
    </div>
  </nav>
);

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
    <>
      <Navbar />
      <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 pt-16">
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
                Enterprise-grade AI infrastructure that learns, adapts, and optimizes itself.
                Built on AWS Lambda, N8N workflows, and advanced AI orchestration.
              </p>
              
              <div className="flex justify-center gap-4 flex-wrap">
                <a href="/dashboard" className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold hover:scale-105 transition-transform shadow-lg shadow-purple-500/25">
                  View Dashboard →
                </a>
                <a href="/demos" className="px-8 py-4 bg-white/10 backdrop-blur rounded-xl text-white font-semibold hover:bg-white/20 transition-colors border border-white/20">
                  Explore Demos
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white">{status?.infrastructure?.lambda?.total || 6}</div>
              <div className="text-gray-400">Lambda Functions</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white">20+</div>
              <div className="text-gray-400">N8N Workflows</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-white">{status?.metrics?.performanceScore || 95}%</div>
              <div className="text-gray-400">Performance Score</div>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
              <div className="text-3xl font-bold text-emerald-400">{status?.costs?.estimated || '$15-30'}</div>
              <div className="text-gray-400">Monthly Cost</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Core Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-colors">
              <div className="text-4xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold text-white mb-2">AI Brain</h3>
              <p className="text-gray-400">Claude Haiku-powered decision engine with 85% cost optimization</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-colors">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-semibold text-white mb-2">Auto Actions</h3>
              <p className="text-gray-400">Self-healing workflows with automatic error recovery</p>
            </div>
            <div className="bg-white/5 backdrop-blur rounded-2xl p-8 border border-white/10 hover:border-purple-500/50 transition-colors">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-time Monitoring</h3>
              <p className="text-gray-400">Live dashboard with network topology and health metrics</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-white/10 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center">
              <div className="text-gray-400">© 2024 ARCHON. Self-Architect AI.</div>
              <div className="flex gap-6">
                <a href="/dashboard" className="text-gray-400 hover:text-white transition-colors">Dashboard</a>
                <a href="https://github.com/selfarchitectai-design" className="text-gray-400 hover:text-white transition-colors">GitHub</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
