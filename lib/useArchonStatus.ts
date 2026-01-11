// lib/useArchonStatus.ts
// Custom hook for fetching ARCHON system status with auto-refresh

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface ComponentStatus {
  status: 'online' | 'offline' | 'degraded';
  latency?: number;
  workflows?: number;
  active?: number;
  model?: string;
  url?: string;
  endpoint?: string;
}

export interface ArchonStatus {
  status: string;
  system: string;
  health: number;
  timestamp: string;
  version: string;
  phase: string;
  service: string;
  components: {
    n8n: ComponentStatus;
    lambda: ComponentStatus;
    claude: ComponentStatus;
    gpt: ComponentStatus;
    mcp: ComponentStatus;
    api_gateway: ComponentStatus;
    dashboard: ComponentStatus;
  };
  services: Record<string, string>;
  metrics: {
    uptime: string;
    responseTime: string;
    activeWorkflows: number;
    totalWorkflows: number;
  };
  updated_at: string;
}

interface UseArchonStatusOptions {
  refreshInterval?: number;
  enabled?: boolean;
}

interface UseArchonStatusReturn {
  status: ArchonStatus | null;
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  refresh: () => Promise<void>;
  isStale: boolean;
}

const STATUS_ENDPOINT = '/api/status';
const DEFAULT_REFRESH_INTERVAL = 30000; // 30 seconds
const STALE_THRESHOLD = 60000; // 1 minute

export function useArchonStatus(options: UseArchonStatusOptions = {}): UseArchonStatusReturn {
  const { 
    refreshInterval = DEFAULT_REFRESH_INTERVAL, 
    enabled = true 
  } = options;

  const [status, setStatus] = useState<ArchonStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isStale, setIsStale] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const staleCheckRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled) return;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(STATUS_ENDPOINT, {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ArchonStatus = await response.json();
      
      setStatus(data);
      setError(null);
      setLastUpdate(new Date());
      setIsStale(false);
      setLoading(false);

    } catch (err: any) {
      console.error('[ARCHON] Status fetch failed:', err);
      
      // Don't clear existing status on error - show stale data
      if (!status) {
        setError(err.name === 'AbortError' ? 'Request timeout' : err.message);
      }
      setIsStale(true);
      setLoading(false);
    }
  }, [enabled, status]);

  // Initial fetch and interval setup
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchStatus();

    // Set up refresh interval
    intervalRef.current = setInterval(fetchStatus, refreshInterval);

    // Set up stale check
    staleCheckRef.current = setInterval(() => {
      if (lastUpdate && Date.now() - lastUpdate.getTime() > STALE_THRESHOLD) {
        setIsStale(true);
      }
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (staleCheckRef.current) clearInterval(staleCheckRef.current);
    };
  }, [enabled, refreshInterval, fetchStatus, lastUpdate]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    setLoading(true);
    await fetchStatus();
  }, [fetchStatus]);

  return {
    status,
    loading,
    error,
    lastUpdate,
    refresh,
    isStale,
  };
}

// Fallback status for SSR or when API is unavailable
export const FALLBACK_STATUS: ArchonStatus = {
  status: 'loading',
  system: 'loading',
  health: 0,
  timestamp: new Date().toISOString(),
  version: '3.6',
  phase: 'D',
  service: 'ARCHON',
  components: {
    n8n: { status: 'offline' },
    lambda: { status: 'offline' },
    claude: { status: 'offline' },
    gpt: { status: 'offline' },
    mcp: { status: 'offline' },
    api_gateway: { status: 'offline' },
    dashboard: { status: 'online' },
  },
  services: {},
  metrics: {
    uptime: '--',
    responseTime: '--',
    activeWorkflows: 0,
    totalWorkflows: 0,
  },
  updated_at: new Date().toISOString(),
};

export default useArchonStatus;
