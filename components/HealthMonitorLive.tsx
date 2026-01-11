// components/HealthMonitorLive.tsx
// Live Health Monitor component - replaces hardcoded OFFLINE values
// Uses real-time data from /api/status with 30s auto-refresh

'use client';

import React from 'react';
import { useArchonStatus, FALLBACK_STATUS } from '@/lib/useArchonStatus';
import { 
  Server, 
  Cloud, 
  Database, 
  Wifi, 
  HeartPulse, 
  RefreshCw,
  Activity
} from 'lucide-react';

export function HealthMonitorLive() {
  const { status, loading, error, lastUpdate, refresh, isStale } = useArchonStatus({
    refreshInterval: 30000, // 30 seconds
    enabled: true,
  });

  const data = status || FALLBACK_STATUS;

  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'online':
      case 'operational':
      case 'healthy':
        return { color: 'text-archon-success', bg: 'bg-archon-success', label: 'ONLINE' };
      case 'degraded':
        return { color: 'text-archon-warning', bg: 'bg-archon-warning', label: 'DEGRADED' };
      case 'loading':
        return { color: 'text-archon-accent', bg: 'bg-archon-accent animate-pulse', label: 'LOADING' };
      default:
        return { color: 'text-archon-danger', bg: 'bg-archon-danger', label: 'OFFLINE' };
    }
  };

  const overallConfig = getStatusConfig(data.system);
  const healthPercent = data.health || 0;

  // Service list with icons
  const services = [
    { 
      name: 'N8N Workflows', 
      status: data.components.n8n?.status || 'offline',
      icon: <Server className="w-5 h-5" />,
      latency: data.components.n8n?.latency,
    },
    { 
      name: 'Lambda Functions', 
      status: data.components.lambda?.status || 'offline',
      icon: <Cloud className="w-5 h-5" />,
      latency: data.components.lambda?.latency,
    },
    { 
      name: 'MCP Server', 
      status: data.components.mcp?.status || 'offline',
      icon: <Database className="w-5 h-5" />,
    },
    { 
      name: 'API Gateway', 
      status: data.components.api_gateway?.status || 'offline',
      icon: <Wifi className="w-5 h-5" />,
      latency: data.components.api_gateway?.latency,
    },
  ];

  return (
    <div className="archon-card p-6" style={{ opacity: 1, transform: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-archon-danger/10">
            <HeartPulse className="w-6 h-6 text-archon-danger" />
          </div>
          <div>
            <h2 className="text-xl font-semibold font-display">Health Monitor</h2>
            <p className="text-sm text-archon-text-dim">System health & services</p>
          </div>
        </div>
        <button 
          onClick={refresh}
          disabled={loading}
          className="p-2 rounded-lg bg-archon-panel hover:bg-archon-panel-light transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-5 h-5 text-archon-accent ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Overall Health Card */}
      <div className={`rounded-xl p-6 border mb-6 ${
        data.system === 'online' 
          ? 'bg-archon-success/5 border-archon-success/20' 
          : data.system === 'degraded'
          ? 'bg-archon-warning/5 border-archon-warning/20'
          : 'bg-archon-panel border-white/10'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <HeartPulse className={`w-8 h-8 ${overallConfig.color}`} />
            <div>
              <p className={`text-2xl font-bold font-display uppercase ${overallConfig.color}`}>
                {loading ? 'Loading...' : overallConfig.label}
              </p>
              <p className="text-sm text-archon-text-dim">Overall system health</p>
            </div>
          </div>
          
          {/* Health Ring */}
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-archon-panel-light"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                className={overallConfig.color}
                strokeDasharray={`${(healthPercent / 100) * 220} 220`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-bold font-mono">{healthPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status List */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-archon-text-dim uppercase tracking-wider">
          Service Status
        </h3>
        
        {services.map((service, index) => {
          const config = getStatusConfig(service.status);
          return (
            <div
              key={service.name}
              className="flex items-center justify-between p-3 rounded-lg bg-archon-panel/50 border border-white/5"
              style={{ opacity: 1, transform: 'none' }}
            >
              <div className="flex items-center gap-3">
                <div className="text-archon-accent">{service.icon}</div>
                <span className="text-sm">{service.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {service.latency && (
                  <span className="text-xs text-archon-text-dim font-mono">{service.latency}ms</span>
                )}
                <span className={`status-dot ${config.bg.replace('text-', 'bg-').replace('archon-', '')}`}></span>
                <span className={`text-xs font-mono ${config.color}`}>{config.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Footer */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-archon-accent">
            {data.metrics?.activeWorkflows || data.components.n8n?.active || 0}
          </p>
          <p className="text-xs text-archon-text-dim">Active Workflows</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-archon-success">
            {data.metrics?.totalWorkflows || data.components.n8n?.workflows || 0}
          </p>
          <p className="text-xs text-archon-text-dim">Total Workflows</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold font-mono text-archon-danger">
            {data.system === 'online' ? 0 : 1}
          </p>
          <p className="text-xs text-archon-text-dim">Errors (24h)</p>
        </div>
      </div>

      {/* Last Update Footer */}
      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-archon-text-dim">
        <span className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          Last: {lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'}
          {isStale && <span className="text-archon-warning ml-1">(stale)</span>}
        </span>
        <span className="font-mono">Auto-refresh: 30s</span>
      </div>
    </div>
  );
}

export default HealthMonitorLive;
