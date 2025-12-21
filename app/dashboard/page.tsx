'use client';

import React, { useState, Suspense } from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for code splitting - SSR disabled for client components
const Sidebar = dynamic(() => import('./components/Sidebar'), { ssr: false });
const HomePage = dynamic(() => import('./components/HomePage'), { ssr: false });
const WorkflowList = dynamic(() => import('./components/WorkflowList'), { ssr: false });
const LambdaCards = dynamic(() => import('./components/LambdaCards'), { ssr: false });

// Loading fallback component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="relative">
      <div className="w-12 h-12 border-4 border-cyan-500/20 rounded-full animate-spin border-t-cyan-500" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-6 h-6 bg-cyan-500/20 rounded-full animate-pulse" />
      </div>
    </div>
  </div>
);

// Placeholder components for other pages
const AtomsPage = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">⚛️ Atom Components</h2>
    <p className="text-slate-400">6 UI atoms for the ARCHON dashboard</p>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {['HealthGauge', 'QuickStats', 'PerformancePanel', 'NetworkTopology', 'ComponentCards', 'AtomErrorBoundary'].map(atom => (
        <div key={atom} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <div className="text-lg font-semibold text-white mb-2">{atom}</div>
          <div className="text-sm text-slate-400">Status: Active ✅</div>
        </div>
      ))}
    </div>
  </div>
);

const AwsPage = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">☁️ AWS Services</h2>
    <p className="text-slate-400">6 AWS services powering ARCHON</p>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { name: 'DynamoDB', icon: '🗄️', details: '3 tables' },
        { name: 'Route 53', icon: '🌐', details: 'selfarchitectai.com' },
        { name: 'Secrets Manager', icon: '🔐', details: '8 secrets' },
        { name: 'CloudWatch', icon: '📊', details: '5 alarms' },
        { name: 'IAM', icon: '👤', details: '4 roles' },
        { name: 'S3', icon: '📦', details: '2 buckets' },
      ].map(svc => (
        <div key={svc.name} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{svc.icon}</span>
            <div className="text-lg font-semibold text-white">{svc.name}</div>
          </div>
          <div className="text-sm text-slate-400">{svc.details}</div>
        </div>
      ))}
    </div>
  </div>
);

const IntegrationsPage = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">🔗 Integrations</h2>
    <p className="text-slate-400">External services connected to ARCHON</p>
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { name: 'Claude API', icon: '🤖', status: 'Haiku Model Active' },
        { name: 'Vercel', icon: '▲', status: 'Auto Deploy Active' },
        { name: 'GitHub', icon: '🐙', status: 'Webhooks Connected' },
        { name: 'N8N', icon: '⚙️', status: '20 Workflows' },
        { name: 'Slack', icon: '💬', status: 'Alerts Active' },
        { name: 'PostgreSQL', icon: '🐘', status: 'Connected' },
      ].map(int => (
        <div key={int.name} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{int.icon}</span>
              <div className="text-lg font-semibold text-white">{int.name}</div>
            </div>
            <div className="text-sm text-emerald-400">{int.status}</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const McpPage = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white">🔌 MCP Servers</h2>
    <p className="text-slate-400">Model Context Protocol endpoints</p>
    <div className="grid md:grid-cols-2 gap-4">
      {[
        { name: 'N8N MCP Server', icon: '⚙️', tools: 3, status: 'active' },
        { name: 'AWS MCP Server', icon: '☁️', tools: 9, status: 'active' },
        { name: 'ARCHON Core MCP', icon: '🏛️', tools: 8, status: 'active' },
        { name: 'GitHub MCP', icon: '🐙', tools: 6, status: 'active' },
        { name: 'Slack MCP', icon: '💬', tools: 4, status: 'active' },
      ].map(mcp => (
        <div key={mcp.name} className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{mcp.icon}</span>
              <div className="text-lg font-semibold text-white">{mcp.name}</div>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-sm text-slate-400">{mcp.tools} tools available</div>
        </div>
      ))}
    </div>
  </div>
);

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'workflows':
        return <WorkflowList />;
      case 'lambdas':
        return <LambdaCards />;
      case 'atoms':
        return <AtomsPage />;
      case 'aws':
        return <AwsPage />;
      case 'integrations':
        return <IntegrationsPage />;
      case 'mcp':
        return <McpPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Sidebar - Lazy loaded */}
      <Suspense fallback={<div className="fixed left-0 top-0 h-full w-64 bg-slate-900/95" />}>
        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      </Suspense>

      {/* Main Content */}
      <main className="ml-64 p-6 min-h-screen">
        <Suspense fallback={<LoadingSpinner />}>
          {renderPage()}
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 p-2 z-50">
        <div className="flex justify-around">
          {[
            { id: 'home', icon: '🏠' },
            { id: 'workflows', icon: '⚙️' },
            { id: 'lambdas', icon: '⚡' },
            { id: 'integrations', icon: '🔗' },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`p-3 rounded-xl ${
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
