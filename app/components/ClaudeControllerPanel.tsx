'use client';

// ClaudeControllerPanel.tsx
// ARCHON V3.6 - Claude Event Trigger Status Panel
// Shows Claude wake-on-event status and GPT-5 control interface

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface ClaudeTriggerStatus {
  status: string;
  mode: string;
  cooldown_active: boolean;
  cooldown_until: string | null;
  last_triggered: string | null;
  total_triggers: number;
  daily_triggers: number;
  daily_limit: number;
  daily_remaining: number;
  allowed_sources: string[];
  available_triggers: string[];
}

interface TriggerResult {
  success: boolean;
  message: string;
  trigger_id?: string;
  cooldown_until?: string;
  daily_triggers_remaining?: number;
  error?: string;
}

// Inline styles for consistent rendering
const styles = {
  container: {
    backgroundColor: '#111827',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #1F2937'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#F9FAFB',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusBadge: (active: boolean) => ({
    padding: '4px 12px',
    borderRadius: '9999px',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: active ? 'rgba(234, 179, 8, 0.2)' : 'rgba(34, 197, 94, 0.2)',
    color: active ? '#FBBF24' : '#22C55E'
  }),
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px',
    marginBottom: '20px'
  },
  metricCard: {
    backgroundColor: '#1F2937',
    borderRadius: '8px',
    padding: '16px'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginBottom: '4px'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#F9FAFB'
  },
  progressBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#374151',
    borderRadius: '4px',
    marginTop: '8px',
    overflow: 'hidden'
  },
  progressFill: (percentage: number) => ({
    height: '100%',
    backgroundColor: percentage > 80 ? '#EF4444' : percentage > 50 ? '#FBBF24' : '#22C55E',
    width: `${percentage}%`,
    transition: 'width 0.3s ease'
  }),
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #374151'
  },
  infoLabel: {
    color: '#9CA3AF',
    fontSize: '14px'
  },
  infoValue: {
    color: '#F9FAFB',
    fontSize: '14px',
    fontWeight: '500'
  },
  triggerButton: (disabled: boolean) => ({
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '600',
    cursor: disabled ? 'not-allowed' : 'pointer',
    backgroundColor: disabled ? '#374151' : '#8B5CF6',
    color: disabled ? '#6B7280' : '#FFFFFF',
    marginTop: '16px',
    transition: 'background-color 0.2s ease'
  }),
  footer: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#1F2937',
    borderRadius: '8px',
    fontSize: '12px',
    color: '#9CA3AF'
  }
};

export default function ClaudeControllerPanel() {
  const queryClient = useQueryClient();
  const [selectedTrigger, setSelectedTrigger] = useState('claude_deploy_handler');

  // Fetch Claude trigger status
  const { data: status, isLoading, error } = useQuery<ClaudeTriggerStatus>({
    queryKey: ['claude-trigger-status'],
    queryFn: async () => {
      const res = await fetch('/api/claude/trigger');
      if (!res.ok) throw new Error('Failed to fetch Claude status');
      return res.json();
    },
    refetchInterval: 30000 // 30 seconds
  });

  // Trigger Claude mutation
  const triggerMutation = useMutation({
    mutationFn: async (triggerType: string) => {
      const res = await fetch('/api/claude/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-archon-key': 'archon_cgpt_cf42eb69efc09a13e937e6d2374c0eb7'
        },
        body: JSON.stringify({
          trigger: triggerType,
          source: 'GPT-5',
          payload: {
            approved: true,
            build_target: 'vercel',
            trust_score: 1.0
          }
        })
      });
      return res.json() as Promise<TriggerResult>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claude-trigger-status'] });
    }
  });

  const formatTime = (isoString: string | null) => {
    if (!isoString) return 'Never';
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCooldown = (isoString: string | null) => {
    if (!isoString) return 'None';
    const remaining = new Date(isoString).getTime() - Date.now();
    if (remaining <= 0) return 'Ready';
    const minutes = Math.ceil(remaining / 60000);
    return `${minutes}m remaining`;
  };

  if (isLoading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '40px' }}>
          Loading Claude Controller...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', color: '#EF4444', padding: '40px' }}>
          Error loading Claude status
        </div>
      </div>
    );
  }

  const dailyUsagePercent = status ? (status.daily_triggers / status.daily_limit) * 100 : 0;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.title}>
          <span>🤖</span>
          <span>Claude Controller</span>
        </div>
        <div style={styles.statusBadge(status?.cooldown_active || false)}>
          {status?.cooldown_active ? '⏳ Cooldown' : '✅ Ready'}
        </div>
      </div>

      {/* Metrics Grid */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Daily Triggers</div>
          <div style={styles.metricValue}>
            {status?.daily_triggers || 0}/{status?.daily_limit || 10}
          </div>
          <div style={styles.progressBar}>
            <div style={styles.progressFill(dailyUsagePercent)} />
          </div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Triggers</div>
          <div style={styles.metricValue}>{status?.total_triggers || 0}</div>
        </div>
      </div>

      {/* Status Info */}
      <div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Mode</span>
          <span style={styles.infoValue}>{status?.mode || 'event-triggered'}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Last Triggered</span>
          <span style={styles.infoValue}>{formatTime(status?.last_triggered || null)}</span>
        </div>
        <div style={styles.infoRow}>
          <span style={styles.infoLabel}>Cooldown</span>
          <span style={styles.infoValue}>{formatCooldown(status?.cooldown_until || null)}</span>
        </div>
        <div style={{ ...styles.infoRow, borderBottom: 'none' }}>
          <span style={styles.infoLabel}>Remaining Today</span>
          <span style={styles.infoValue}>{status?.daily_remaining || 0} triggers</span>
        </div>
      </div>

      {/* Trigger Selector */}
      <select
        value={selectedTrigger}
        onChange={(e) => setSelectedTrigger(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          borderRadius: '8px',
          backgroundColor: '#1F2937',
          border: '1px solid #374151',
          color: '#F9FAFB',
          marginTop: '16px'
        }}
      >
        {status?.available_triggers?.map((trigger) => (
          <option key={trigger} value={trigger}>
            {trigger.replace(/_/g, ' ').replace(/handler/i, '')}
          </option>
        ))}
      </select>

      {/* Trigger Button */}
      <button
        onClick={() => triggerMutation.mutate(selectedTrigger)}
        disabled={status?.cooldown_active || triggerMutation.isPending || (status?.daily_remaining || 0) <= 0}
        style={styles.triggerButton(
          status?.cooldown_active || triggerMutation.isPending || (status?.daily_remaining || 0) <= 0
        )}
      >
        {triggerMutation.isPending ? '⏳ Triggering...' : '🚀 Trigger Claude'}
      </button>

      {/* Mutation Result */}
      {triggerMutation.data && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          borderRadius: '8px',
          backgroundColor: triggerMutation.data.success ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
          color: triggerMutation.data.success ? '#22C55E' : '#EF4444',
          fontSize: '13px'
        }}>
          {triggerMutation.data.message}
          {triggerMutation.data.trigger_id && (
            <div style={{ marginTop: '4px', fontSize: '11px', color: '#9CA3AF' }}>
              ID: {triggerMutation.data.trigger_id}
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div style={styles.footer}>
        <div style={{ marginBottom: '4px', fontWeight: '500', color: '#D1D5DB' }}>
          💡 Cost Optimization Active
        </div>
        <div>
          Claude is in passive mode. Only GPT-5 can trigger Claude for deployments 
          and recovery. Daily limit: {status?.daily_limit || 10} triggers.
        </div>
      </div>
    </div>
  );
}
