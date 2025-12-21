'use client';

import React from 'react';
import HealthGauge from './HealthGauge';
import { workflows } from '../data/workflows';
import { lambdaFunctions, awsServices } from '../data/services';

export default function HomePage() {
  const activeWorkflows = workflows.filter(w => w.active).length;
  const zeroErrorWorkflows = workflows.filter(w => w.zeroError).length;

  const stats = [
    { label: 'Workflows', value: workflows.length, active: activeWorkflows, icon: '⚙️', color: 'cyan' },
    { label: 'Lambdas', value: lambdaFunctions.length, active: lambdaFunctions.length, icon: '⚡', color: 'amber' },
    { label: 'AWS Services', value: awsServices.length, active: awsServices.length, icon: '☁️', color: 'emerald' },
    { label: 'Zero Error', value: zeroErrorWorkflows, active: zeroErrorWorkflows, icon: '✅', color: 'blue' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">ARCHON Dashboard</h1>
          <p className="text-slate-400">Real-time system monitoring and control</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
            <span className="text-emerald-400">🟢 All Systems Operational</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Health Gauge */}
        <div className="lg:col-span-1">
          <HealthGauge score={95} label="System Health" />
        </div>

        {/* Quick Stats */}
        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div 
              key={i}
              className={`bg-slate-800/30 rounded-xl p-4 border border-slate-700/50 hover:border-${stat.color}-500/30 transition-all`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{stat.icon}</span>
                <span className="text-sm text-slate-400">{stat.label}</span>
              </div>
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-xs text-emerald-400">{stat.active} active</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Active Workflows */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚙️ Recent Workflows</h3>
          <div className="space-y-3">
            {workflows.filter(w => w.active).slice(0, 5).map(wf => (
              <div key={wf.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>{wf.icon}</span>
                  <div>
                    <div className="text-sm text-white">{wf.name}</div>
                    <div className="text-xs text-slate-500">{wf.interval}</div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            ))}
          </div>
        </div>

        {/* Lambda Status */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">⚡ Lambda Status</h3>
          <div className="space-y-3">
            {lambdaFunctions.map(lambda => (
              <div key={lambda.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span>{lambda.icon}</span>
                  <div>
                    <div className="text-sm text-white">{lambda.name}</div>
                    <div className="text-xs text-slate-500">{lambda.runtime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">{lambda.memory}</span>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cost Optimization Banner */}
      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white">💰 Cost Optimization Active</h3>
            <p className="text-sm text-slate-400">
              Claude Haiku model + Optimized schedules = ~85% cost reduction
            </p>
          </div>
          <div className="flex items-center gap-4">
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
}
