'use client';

import React, { useEffect, useState, useCallback } from 'react';

interface TelemetryData {
  trust_delta: number;
  latency_p95: number;
  drift_level: number;
  system_health: number;
  active_workflows: number;
  lambda_count: number;
  success_rate: number;
  reflection_depth: number;
  ethics_score: number;
  memory_utilization: number;
  glow_intensity: number;
  trust_zone: 'GREEN' | 'YELLOW' | 'RED';
  timestamp: string;
  source?: string;
}

interface TelemetryDashboardProps {
  showFullDashboard?: boolean;
  className?: string;
}

export default function TelemetryDashboard({ 
  showFullDashboard = false,
  className = '' 
}: TelemetryDashboardProps) {
  const [data, setData] = useState<TelemetryData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Connect to SSE stream
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/telemetry/stream');
        
        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          console.log('✅ Connected to telemetry stream');
        };
        
        eventSource.onmessage = (event) => {
          try {
            const newData = JSON.parse(event.data);
            setData(newData);
          } catch (e) {
            console.error('Failed to parse telemetry data:', e);
          }
        };
        
        eventSource.onerror = () => {
          setIsConnected(false);
          setError('Connection lost. Reconnecting...');
          eventSource?.close();
          
          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
      } catch (e) {
        setError('Failed to connect to telemetry stream');
        console.error(e);
      }
    };

    connect();

    return () => {
      eventSource?.close();
    };
  }, []);

  // Get zone color
  const getZoneColor = useCallback((zone: string) => {
    switch (zone) {
      case 'GREEN': return '#00ff88';
      case 'YELLOW': return '#ffcc00';
      case 'RED': return '#ff4444';
      default: return '#00d4ff';
    }
  }, []);

  // Format value for display
  const formatValue = useCallback((value: number, type: string) => {
    if (type === 'percentage') return `${value}%`;
    if (type === 'latency') return `${value}ms`;
    if (type === 'decimal') return value.toFixed(3);
    return value.toString();
  }, []);

  if (!data) {
    return (
      <div className={`telemetry-loading ${className}`} style={{
        padding: '20px',
        textAlign: 'center',
        color: '#8892a4'
      }}>
        <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
        <div>Connecting to telemetry stream...</div>
      </div>
    );
  }

  // Compact view (for integration into existing dashboard)
  if (!showFullDashboard) {
    return (
      <div className={`telemetry-compact ${className}`} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        background: 'rgba(20, 27, 45, 0.8)',
        borderRadius: '12px',
        border: `1px solid ${getZoneColor(data.trust_zone)}40`
      }}>
        {/* Connection indicator */}
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: isConnected ? '#00ff88' : '#ff4444',
          animation: 'pulse 2s ease-in-out infinite'
        }} />
        
        {/* Trust Zone */}
        <div style={{
          padding: '4px 12px',
          borderRadius: '12px',
          background: `${getZoneColor(data.trust_zone)}20`,
          color: getZoneColor(data.trust_zone),
          fontSize: '12px',
          fontWeight: 600
        }}>
          {data.trust_zone}
        </div>
        
        {/* Key Metrics */}
        <div style={{ display: 'flex', gap: '20px', fontSize: '14px' }}>
          <span>ΔT: <strong style={{ color: getZoneColor(data.trust_zone) }}>
            {data.trust_delta.toFixed(3)}
          </strong></span>
          <span>Latency: <strong>{data.latency_p95}ms</strong></span>
          <span>Drift: <strong>{data.drift_level.toFixed(3)}</strong></span>
          <span>Ethics: <strong>{data.ethics_score.toFixed(2)}</strong></span>
        </div>
      </div>
    );
  }

  // Full dashboard view
  return (
    <div className={`telemetry-dashboard ${className}`} style={{
      padding: '24px',
      background: 'rgba(10, 15, 26, 0.95)',
      borderRadius: '16px',
      border: '1px solid #1f2940'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px'
      }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          📊 ARCHON V7 Telemetry
        </h2>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? '#00ff88' : '#ff4444'
          }} />
          <span style={{ fontSize: '14px', color: '#8892a4' }}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Trust Zone Banner */}
      <div style={{
        padding: '16px',
        marginBottom: '24px',
        borderRadius: '12px',
        background: `${getZoneColor(data.trust_zone)}15`,
        border: `1px solid ${getZoneColor(data.trust_zone)}40`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '14px', color: '#8892a4', marginBottom: '4px' }}>
            Trust Zone
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 700,
            color: getZoneColor(data.trust_zone)
          }}>
            {data.trust_zone}
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', color: '#8892a4', marginBottom: '4px' }}>
            Glow Intensity
          </div>
          <div style={{ 
            fontSize: '28px', 
            fontWeight: 700,
            color: '#00d4ff'
          }}>
            {(data.glow_intensity * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '16px'
      }}>
        {/* Trust Delta */}
        <MetricCard 
          label="Trust Delta (ΔT)"
          value={formatValue(data.trust_delta, 'decimal')}
          color={getZoneColor(data.trust_zone)}
        />
        
        {/* Latency */}
        <MetricCard 
          label="Latency P95"
          value={formatValue(data.latency_p95, 'latency')}
          color="#00d4ff"
        />
        
        {/* Drift Level */}
        <MetricCard 
          label="Drift Level"
          value={formatValue(data.drift_level, 'decimal')}
          color="#ffcc00"
        />
        
        {/* System Health */}
        <MetricCard 
          label="System Health"
          value={formatValue(data.system_health, 'percentage')}
          color="#00ff88"
        />
        
        {/* Ethics Score */}
        <MetricCard 
          label="Ethics Score"
          value={formatValue(data.ethics_score, 'decimal')}
          color="#a855f7"
        />
        
        {/* Active Workflows */}
        <MetricCard 
          label="Active Workflows"
          value={data.active_workflows.toString()}
          color="#00d4ff"
        />
      </div>

      {/* Timestamp */}
      <div style={{
        marginTop: '20px',
        fontSize: '12px',
        color: '#8892a4',
        textAlign: 'center'
      }}>
        Last update: {new Date(data.timestamp).toLocaleTimeString()}
        {data.source && ` (${data.source})`}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Metric Card Component
function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{
      padding: '16px',
      background: 'rgba(20, 27, 45, 0.8)',
      borderRadius: '12px',
      border: '1px solid #1f2940',
      textAlign: 'center'
    }}>
      <div style={{ 
        fontSize: '12px', 
        color: '#8892a4',
        marginBottom: '8px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px'
      }}>
        {label}
      </div>
      <div style={{ 
        fontSize: '24px', 
        fontWeight: 700,
        color: color
      }}>
        {value}
      </div>
    </div>
  );
}
