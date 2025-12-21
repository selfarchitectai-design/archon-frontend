'use client';

import React, { useState, useEffect } from 'react';

// ============================================
// STATIC DATA - SSR Safe
// ============================================

const workflows = [
  { id: 'fIuv9S3gJGY3D8GZ', name: 'WF1_Daily_Insight', icon: '📊', active: true, interval: '24h', category: 'reporting' },
  { id: 'XJG2I1FB52vN0gPc', name: 'GitHub Auto Deploy', icon: '🚀', active: true, interval: 'Push', category: 'deployment' },
  { id: 'oWdgoWs2sDf8zJZy', name: 'Trend Pipeline', icon: '🔥', active: true, interval: '6h', category: 'monitoring' },
  { id: 'SWDbn0KdaOMdiC5S', name: 'Decision_Action', icon: '⚡', active: true, interval: 'On-demand', category: 'automation' },
  { id: '5v5HmKAxNND52hrp', name: 'EVENT_INTAKE', icon: '📥', active: true, interval: 'Real-time', category: 'core' },
  { id: 'pABo8he8J4X5ihFR', name: 'Auto Optimizer', icon: '⚡', active: true, interval: '6h', category: 'optimization' },
  { id: 'VtMbs0Rjv3URPQ1T', name: 'CONTROL_TOWER', icon: '🗼', active: true, interval: '24h', category: 'reporting' },
  { id: 'DZedS8NLoLHGbzCz', name: 'Cost Optimizer V2', icon: '💰', active: true, interval: '24h', category: 'cost', zeroError: true },
  { id: 'ZEXkGRNcRwJKDGwZ', name: 'Lambda Health', icon: '🔥', active: true, interval: '30m', category: 'monitoring' },
  { id: '5Xd33x0k05CwhS2w', name: 'API Health', icon: '🩺', active: true, interval: '30m', category: 'monitoring' },
  { id: 'W7MU2KihgmS3gkc1', name: 'MCP Bridge', icon: '🔧', active: true, interval: 'On-demand', category: 'core' },
  { id: 'WGnAak2W6Vws6svY', name: 'EC2 Disk Monitor', icon: '🔴', active: true, interval: '6h', category: 'monitoring' },
  { id: 'nxGOMTIK3V0zk1kV', name: 'WEBHOOK_MASTER', icon: '🎛️', active: true, interval: 'Real-time', category: 'core' },
  { id: 'PNTVM4WVOjcErMLd', name: 'Health Monitor V2', icon: '🏥', active: true, interval: '1h', category: 'monitoring' },
  { id: 'GA4UNzvW2dj2UVyf', name: 'Self-Heal Engine', icon: '🏥', active: true, interval: 'On-demand', category: 'self-heal' },
  { id: 'JwXyGJtrzHHTI28R', name: 'Decision Queue V2', icon: '📋', active: true, interval: 'On-demand', category: 'automation', zeroError: true },
  { id: 'N0LtPF3MAwKU92wr', name: 'POLICY_GATE', icon: '🔐', active: true, interval: 'On-demand', category: 'security' },
  { id: 'EbVU2XwkLM9CYs0r', name: 'GitHub Sync V2', icon: '🔗', active: true, interval: 'Event', category: 'integration', zeroError: true },
  { id: 'e9luGj0NmEUgc1l8', name: 'Slack Alert', icon: '🔔', active: true, interval: '1h', category: 'alerting' },
];

const lambdas = [
  { id: 'brain', name: 'ARCHON Brain', icon: '🧠', memory: '512MB', runtime: 'Python 3.11', model: 'Haiku' },
  { id: 'actions', name: 'ARCHON Actions', icon: '⚡', memory: '256MB', runtime: 'Python 3.11', model: 'Haiku' },
  { id: 'trend', name: 'Trend Collector', icon: '📈', memory: '256MB', runtime: 'Python 3.11', model: 'Haiku' },
  { id: 'intake', name: 'Event Intake', icon: '📥', memory: '128MB', runtime: 'Python 3.11', model: '-' },
];

const menuItems = [
  { id: 'home', icon: '🏠', label: 'Dashboard' },
  { id: 'workflows', icon: '⚙️', label: 'N8N Workflows' },
  { id: 'lambdas', icon: '⚡', label: 'Lambda Functions' },
  { id: 'integrations', icon: '🔗', label: 'Integrations' },
];

// ============================================
// COMPONENTS - Inline (No dynamic imports)
// ============================================

const HealthGauge = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 90 ? '#10b981' : score >= 70 ? '#f59e0b' : '#ef4444';

  return (
    <div className="bg-gradient-to-br from-emerald-500/20 to-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#334155" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="45" fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-emerald-400">{score}%</span>
            <span className="text-xs text-slate-400">System Health</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ currentPage, setCurrentPage }: { currentPage: string; setCurrentPage: (p: string) => void }) => (
  <aside className="fixed left-0 top-0 h-full w-64 bg-slate-900/95 backdrop-blur-xl border-r border-slate-700/50 z-50 flex flex-col">
    <div className="p-6 border-b border-slate-700/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/25">A</div>
        <div>
          <h1 className="text-lg font-bold text-white">ARCHON</h1>
          <p className="text-xs text-slate-400">V2.5 Dashboard</p>
        </div>
      </div>
    </div>
    <nav className="flex-1 p-4 overflow-y-auto">
      <ul className="space-y-1">
        {menuItems.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                currentPage === item.id
                  ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
    <div className="p-4 border-t border-slate-700/50">
      <div className="bg-slate-800/50 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-slate-300">System Online</span>
        </div>
        <div className="text-xs text-slate-500">Cost: ~$15-30/mo (Haiku)</div>
      </div>
    </div>
  </aside>
);

const HomePage = () => {
  const activeWorkflows = workflows.filter(w => w.active).length;
  const zeroErrorCount = workflows.filter(w => w.zeroError).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">ARCHON Dashboard</h1>
          <p className="text-slate-400">Real-time system monitoring • Cost optimized</p>
        </div>
        <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <span className="text-emerald-400">🟢 All Systems Operational</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <HealthGauge score={95} />
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Workflows', value: workflows.length, active: activeWorkflows, icon: '⚙️', border: 'border-cyan-500/30' },
            { label: 'Lambdas', value: lambdas.length, active: lambdas.length, icon: '⚡', border: 'border-amber-500/30' },
            { label: 'Model', value: 'Haiku', active: '85% savings', icon: '🤖', border: 'border-emerald-500/30' },
            { label: 'Zero Error', value: zeroErrorCount, active: `${zeroErrorCount} WFs`, icon: '✅', border: 'border-blue-500/30' },
          ].map((stat, i) => (
            <div key={i} className={`bg-slate-800/30 rounded-xl p-4 border ${stat.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-sm text-slate-400">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-emerald-400">{stat.active}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚙️ Active Workflows</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {workflows.slice(0, 8).map(wf => (
              <div key={wf.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>{wf.icon}</span>
                  <div>
                    <div className="text-sm text-white">{wf.name}</div>
                    <div className="text-xs text-slate-500">{wf.interval}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {wf.zeroError && <span className="text-xs text-emerald-400">ZE</span>}
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚡ Lambda Status (Haiku)</h3>
          <div className="space-y-3">
            {lambdas.map(lambda => (
              <div key={lambda.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>{lambda.icon}</span>
                  <div>
                    <div className="text-sm text-white">{lambda.name}</div>
                    <div className="text-xs text-slate-500">{lambda.runtime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-cyan-400">{lambda.model}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">💰 Cost Optimization Active</h3>
            <p className="text-sm text-slate-400">Claude Haiku + Optimized schedules = ~85% reduction</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">$15-30</div>
              <div className="text-xs text-slate-500">Est. Monthly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-400">~136</div>
              <div className="text-xs text-slate-500">Daily Calls</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WorkflowsPage = () => {
  const [filter, setFilter] = useState('all');
  const categories = ['all', 'monitoring', 'core', 'automation', 'reporting'];
  const filtered = filter === 'all' ? workflows : workflows.filter(w => w.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">⚙️ N8N Workflows</h2>
          <p className="text-slate-400">{workflows.length} workflows • {workflows.filter(w => w.zeroError).length} zero-error</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg text-sm transition-all ${
              filter === cat ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-slate-800/50 text-slate-400'
            }`}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>
      <div className="grid gap-3">
        {filtered.map(wf => (
          <div key={wf.id} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4 hover:border-cyan-500/30 transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{wf.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{wf.name}</span>
                    {wf.zeroError && <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">Zero Error</span>}
                  </div>
                  <div className="text-sm text-slate-400">{wf.category} • {wf.interval}</div>
                </div>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const LambdasPage = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold text-white">⚡ Lambda Functions</h2>
      <p className="text-slate-400">4 functions • All using Claude Haiku model</p>
    </div>
    <div className="grid md:grid-cols-2 gap-4">
      {lambdas.map(lambda => (
        <div key={lambda.id} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{lambda.icon}</span>
            <div>
              <div className="font-semibold text-white">{lambda.name}</div>
              <div className="text-sm text-slate-400">{lambda.id}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-slate-500">Memory</div>
              <div className="text-white">{lambda.memory}</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-slate-500">Runtime</div>
              <div className="text-white">{lambda.runtime}</div>
            </div>
            <div className="bg-cyan-500/10 rounded-lg p-3 col-span-2">
              <div className="text-xs text-slate-500">AI Model</div>
              <div className="text-cyan-400 font-medium">{lambda.model} (85% cost savings)</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const IntegrationsPage = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">🔗 Integrations</h2>
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { name: 'Claude API', icon: '🤖', status: 'Haiku Model', color: 'emerald' },
        { name: 'Vercel', icon: '▲', status: 'Auto Deploy', color: 'blue' },
        { name: 'GitHub', icon: '🐙', status: 'Webhooks', color: 'purple' },
        { name: 'N8N', icon: '⚙️', status: '19 Workflows', color: 'amber' },
        { name: 'Slack', icon: '💬', status: 'Alerts', color: 'pink' },
        { name: 'PostgreSQL', icon: '🐘', status: 'Connected', color: 'cyan' },
      ].map(int => (
        <div key={int.name} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{int.icon}</span>
              <span className="font-semibold text-white">{int.name}</span>
            </div>
            <span className="text-sm text-emerald-400">{int.status}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ============================================
// MAIN COMPONENT
// ============================================

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState('home');
  const [mounted, setMounted] = useState(false);

  // Hydration fix: Only render interactive content after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'workflows': return <WorkflowsPage />;
      case 'lambdas': return <LambdasPage />;
      case 'integrations': return <IntegrationsPage />;
      default: return <HomePage />;
    }
  };

  // SSR-safe: Show loading state until client hydration completes
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500/20 rounded-full animate-spin border-t-cyan-500 mx-auto mb-4" />
          <div className="text-white font-semibold">ARCHON V2.5</div>
          <div className="text-slate-400 text-sm">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 p-4 md:p-6 min-h-screen pb-20 md:pb-6">
        {renderPage()}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 p-2 z-50">
        <div className="flex justify-around">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`p-3 rounded-xl transition-all ${
                currentPage === item.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
