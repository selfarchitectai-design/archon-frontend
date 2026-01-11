// components/ServiceStatusBadge.tsx
// Displays individual service status with icon and label

'use client';

import React from 'react';

interface ServiceStatusBadgeProps {
  name: string;
  status: 'online' | 'offline' | 'degraded' | 'operational' | 'loading';
  icon?: React.ReactNode;
  latency?: number;
}

export function ServiceStatusBadge({ name, status, icon, latency }: ServiceStatusBadgeProps) {
  const getStatusConfig = (s: string) => {
    switch (s) {
      case 'online':
      case 'operational':
        return {
          dot: 'bg-green-500',
          text: 'text-green-500',
          label: 'ONLINE',
          dotClass: 'status-healthy',
        };
      case 'degraded':
        return {
          dot: 'bg-yellow-500',
          text: 'text-yellow-500',
          label: 'DEGRADED',
          dotClass: 'status-warning',
        };
      case 'loading':
        return {
          dot: 'bg-blue-500 animate-pulse',
          text: 'text-blue-500',
          label: 'LOADING',
          dotClass: 'status-loading',
        };
      case 'offline':
      default:
        return {
          dot: 'bg-red-500',
          text: 'text-red-500',
          label: 'OFFLINE',
          dotClass: 'status-critical',
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg bg-archon-panel/50 border border-white/5"
      style={{ opacity: 1, transform: 'none' }}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="text-archon-accent">
            {icon}
          </div>
        )}
        <span className="text-sm">{name}</span>
      </div>
      <div className="flex items-center gap-2">
        {latency !== undefined && (
          <span className="text-xs text-archon-text-dim font-mono">{latency}ms</span>
        )}
        <span className={`status-dot ${config.dotClass}`}></span>
        <span className={`text-xs font-mono ${config.text}`}>{config.label}</span>
      </div>
    </div>
  );
}

export default ServiceStatusBadge;
