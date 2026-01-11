// components/HeaderStatusBadge.tsx
// Live status badge for header/navigation
// Shows system status with auto-refresh

'use client';

import React from 'react';
import { useArchonStatus } from '@/lib/useArchonStatus';

export function HeaderStatusBadge() {
  const { status, loading } = useArchonStatus({
    refreshInterval: 30000,
    enabled: true,
  });

  const getStatusConfig = () => {
    if (loading && !status) {
      return { 
        dot: 'status-loading', 
        text: 'text-blue-500', 
        label: 'LOADING...' 
      };
    }
    
    const system = status?.system || 'offline';
    
    switch (system) {
      case 'online':
        return { dot: 'status-healthy', text: 'text-archon-success', label: 'OPERATIONAL' };
      case 'degraded':
        return { dot: 'status-warning', text: 'text-archon-warning', label: 'DEGRADED' };
      default:
        return { dot: 'status-critical', text: 'text-archon-danger', label: 'OFFLINE' };
    }
  };

  const config = getStatusConfig();

  return (
    <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/5">
      <span className={`status-dot ${config.dot}`}></span>
      <span className="text-sm text-archon-text-dim">System</span>
      <span className={`text-sm font-medium ${config.text}`}>{config.label}</span>
    </div>
  );
}

export default HeaderStatusBadge;
