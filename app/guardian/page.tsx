'use client';

import React, { useState, useEffect } from 'react';

// Inline styles
const styles = {
  container: {
    minHeight: '100vh',
    padding: '24px',
    color: 'white',
    fontFamily: 'system-ui, sans-serif',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  backLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#888',
    textDecoration: 'none',
    fontSize: '14px',
    cursor: 'pointer'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  grid4: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  grid2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  card: {
    background: 'rgba(15,15,26,0.9)',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.1)'
  },
  statValue: {
    fontSize: '36px',
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#888'
  },
  progressBar: {
    height: '8px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '4px',
    overflow: 'hidden',
    marginTop: '12px'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block',
    marginRight: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const
  },
  tableHeader: {
    textAlign: 'left' as const,
    padding: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    fontSize: '12px',
    color: '#888',
    textTransform: 'uppercase' as const
  },
  tableCell: {
    padding: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)'
  },
  tierBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600'
  }
};

// Helper functions
const formatBytes = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getHealthColor = (percent: number) => {
  if (percent < 70) return '#10b981';
  if (percent < 80) return '#f59e0b';
  if (percent < 90) return '#f97316';
  return '#ef4444';
};

const getHealthStatus = (percent: number) => {
  if (percent < 70) return { label: 'Healthy', color: '#10b981' };
  if (percent < 80) return { label: 'Warning', color: '#f59e0b' };
  if (percent < 90) return { label: 'Critical', color: '#f97316' };
  return { label: 'Emergency', color: '#ef4444' };
};

const getTierStyle = (tier: number) => {
  switch (tier) {
    case 0: return { background: 'rgba(239,68,68,0.2)', color: '#ef4444' };
    case 1: return { background: 'rgba(245,158,11,0.2)', color: '#f59e0b' };
    case 2: return { background: 'rgba(16,185,129,0.2)', color: '#10b981' };
    default: return { background: 'rgba(255,255,255,0.1)', color: '#888' };
  }
};

// Mock data
const getMockData = () => ({
  storage: {
    disk_total_bytes: 21474836480,
    disk_used_bytes: 13743895347,
    disk_used_percent: 64,
    growth_bytes_7d_avg: 268435456,
    days_to_80_percent: 25,
    health_status: 'healthy',
    component_breakdown: {
      docker: { total: 3221225472 },
      postgres: { total: 4831838208 },
      logs: { total: 1610612736 },
      n8n: { data: 1073741824 },
      vector: { items: 0, embeddings: 0 }
    }
  },
  cleanup_summary: [
    { cleanup_date: '2024-12-21', total_actions: 6, successful: 6, failed: 0, total_bytes_freed: 1288490189 },
    { cleanup_date: '2024-12-20', total_actions: 6, successful: 5, failed: 1, total_bytes_freed: 858993459 }
  ],
  cleanup_totals: {
    total_freed_7d: 8589934592,
    total_runs_7d: 14,
    failures_7d: 1
  },
  feature_flags: {
    vector_enabled: false,
    vector_write_enabled: false,
    vector_search_enabled: false,
    auto_cleanup_tier2: true,
    storage_alerts_enabled: true
  },
  vector_status: {
    enabled: false,
    write_enabled: false,
    search_enabled: false,
    items_count: 0,
    embeddings_count: 0
  }
});

export default function GuardianPage() {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    // Use mock data for now
    setData(getMockData());
  }, []);

  if (!mounted) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🛡️</div>
          <p style={{ color: '#888' }}>Loading Storage Guardian...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { storage, cleanup_summary, cleanup_totals, feature_flags, vector_status } = data;
  const healthStatus = getHealthStatus(storage?.disk_used_percent || 0);
  const diskPercent = storage?.disk_used_percent || 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <a href="/dashboard" style={styles.backLink}>
            ← Back to Dashboard
          </a>
          <h1 style={{ ...styles.title, marginTop: '8px' }}>
            <span>🛡️</span>
            Storage Guardian
          </h1>
        </div>
        <div style={{ ...styles.badge, background: `${healthStatus.color}20`, color: healthStatus.color }}>
          <span style={{ ...styles.statusDot, background: healthStatus.color }} />
          {healthStatus.label}
        </div>
      </div>

      {/* Main Stats */}
      <div style={styles.grid4}>
        {/* Disk Usage */}
        <div style={{ ...styles.card, background: `${getHealthColor(diskPercent)}10`, border: `1px solid ${getHealthColor(diskPercent)}40` }}>
          <div style={{ ...styles.statValue, color: getHealthColor(diskPercent) }}>{diskPercent}%</div>
          <div style={styles.statLabel}>Disk Used</div>
          <div style={styles.progressBar}>
            <div style={{ 
              height: '100%', 
              width: `${diskPercent}%`,
              background: getHealthColor(diskPercent),
              borderRadius: '4px'
            }} />
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
            {formatBytes(storage?.disk_used_bytes)} / {formatBytes(storage?.disk_total_bytes)}
          </div>
        </div>

        {/* Growth Rate */}
        <div style={{ ...styles.card, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ ...styles.statValue, color: '#f59e0b' }}>
            {formatBytes(storage?.growth_bytes_7d_avg || 0)}
          </div>
          <div style={styles.statLabel}>Daily Growth (7d avg)</div>
        </div>

        {/* Days to 80% */}
        <div style={{ ...styles.card, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div style={{ ...styles.statValue, color: '#3b82f6' }}>
            {storage?.days_to_80_percent || '∞'}
          </div>
          <div style={styles.statLabel}>Days to 80%</div>
        </div>

        {/* Cleanup Stats */}
        <div style={{ ...styles.card, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ ...styles.statValue, color: '#10b981' }}>
            {formatBytes(cleanup_totals?.total_freed_7d || 0)}
          </div>
          <div style={styles.statLabel}>Freed (7 days)</div>
        </div>
      </div>

      {/* Storage Breakdown & Vector Status */}
      <div style={styles.grid2}>
        {/* Storage by Component */}
        <div style={styles.card}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            📊 Storage Breakdown
          </h3>
          <div>
            {[
              { name: 'PostgreSQL', key: 'postgres', icon: '🐘', color: '#3b82f6' },
              { name: 'Docker', key: 'docker', icon: '🐳', color: '#2563eb' },
              { name: 'Logs', key: 'logs', icon: '📋', color: '#8b5cf6' },
              { name: 'N8N', key: 'n8n', icon: '⚙️', color: '#f59e0b' },
              { name: 'Vector Memory', key: 'vector', icon: '🧠', color: '#10b981' }
            ].map(item => {
              const bytes = storage?.component_breakdown?.[item.key]?.total || 
                           storage?.component_breakdown?.[item.key]?.data || 0;
              const percent = storage?.disk_used_bytes ? 
                           (bytes / storage.disk_used_bytes * 100).toFixed(1) : 0;
              return (
                <div key={item.key} style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '20px', marginRight: '12px' }}>{item.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px' }}>{item.name}</span>
                      <span style={{ fontSize: '14px', color: '#888' }}>{formatBytes(bytes)} ({percent}%)</span>
                    </div>
                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${Math.min(Number(percent), 100)}%`,
                        background: item.color,
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Vector Memory Status */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧠 Vector Memory
            </h3>
            <span style={{ 
              ...styles.badge, 
              background: vector_status?.enabled ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
              color: vector_status?.enabled ? '#10b981' : '#ef4444'
            }}>
              {vector_status?.enabled ? 'ENABLED' : 'DISABLED'}
            </span>
          </div>
          <div style={styles.grid3}>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#888' }}>
                {vector_status?.items_count || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Items</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#888' }}>
                {vector_status?.embeddings_count || 0}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Embeddings</div>
            </div>
            <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#888' }}>
                0 B
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>Index Size</div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(139,92,246,0.1)', borderRadius: '8px', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div style={{ fontSize: '13px', color: '#a78bfa' }}>
              <strong>Status:</strong> Schema ready, awaiting activation
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              Write: {feature_flags?.vector_write_enabled ? '✅' : '❌'} | 
              Search: {feature_flags?.vector_search_enabled ? '✅' : '❌'}
            </div>
          </div>
        </div>
      </div>

      {/* Cleanup Activity & Protection Tiers */}
      <div style={styles.grid2}>
        {/* Cleanup Activity */}
        <div style={styles.card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🧹 Cleanup Activity
            </h3>
            <span style={{ fontSize: '12px', color: '#888' }}>
              {cleanup_totals?.total_runs_7d || 0} runs / 7 days
            </span>
          </div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Actions</th>
                <th style={styles.tableHeader}>Freed</th>
                <th style={styles.tableHeader}>Status</th>
              </tr>
            </thead>
            <tbody>
              {(cleanup_summary || []).slice(0, 5).map((day: any, i: number) => (
                <tr key={i}>
                  <td style={styles.tableCell}>{day.cleanup_date}</td>
                  <td style={styles.tableCell}>{day.total_actions}</td>
                  <td style={styles.tableCell}>{formatBytes(day.total_bytes_freed)}</td>
                  <td style={styles.tableCell}>
                    {day.failed > 0 ? (
                      <span style={{ color: '#ef4444' }}>⚠️ {day.failed} failed</span>
                    ) : (
                      <span style={{ color: '#10b981' }}>✅ All success</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Protection Tiers */}
        <div style={styles.card}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🛡️ Protection Tiers
          </h3>
          <div>
            {[
              { tier: 0, name: 'CRITICAL', desc: 'Core DB, Vector Memory, Backups', action: 'Never auto-delete', color: '#ef4444' },
              { tier: 1, name: 'MANAGED', desc: 'Metrics, N8N Executions, Old Logs', action: 'Retention policies', color: '#f59e0b' },
              { tier: 2, name: 'EPHEMERAL', desc: 'Docker cache, /tmp, journald', action: 'Auto-prune', color: '#10b981' }
            ].map(tier => (
              <div key={tier.tier} style={{ 
                padding: '12px', 
                marginBottom: '8px', 
                background: `${tier.color}10`, 
                borderRadius: '8px',
                borderLeft: `4px solid ${tier.color}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ ...styles.tierBadge, ...getTierStyle(tier.tier) }}>
                    Tier {tier.tier}
                  </span>
                  <span style={{ fontWeight: '600', color: tier.color }}>{tier.name}</span>
                </div>
                <div style={{ fontSize: '13px', color: '#888' }}>{tier.desc}</div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                  Action: {tier.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div style={styles.card}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🚦 Feature Flags
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {Object.entries(feature_flags || {}).map(([key, enabled]) => (
            <div key={key} style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: enabled ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              border: `1px solid ${enabled ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span style={{ 
                ...styles.statusDot, 
                background: enabled ? '#10b981' : '#ef4444'
              }} />
              <span style={{ fontSize: '13px' }}>
                {key.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
