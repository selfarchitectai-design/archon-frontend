import { Suspense } from 'react';
import dynamic from 'next/dynamic';

// Types
interface Comp {
  name: string;
  status: 'green' | 'yellow' | 'red';
  latency: number;
  message: string;
}

interface Health {
  overall: 'green' | 'yellow' | 'red';
  score: number;
  components: Comp[];
  timestamp: string;
}

// Data fetching
async function getHealth(): Promise<Health | null> {
  try {
    const res = await fetch('https://selfarchitectai.com/api/realtime-status', {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// Dynamic imports with SSR disabled - Atomic Loading
const HealthGauge = dynamic(
  () => import('@/components/atoms/HealthGauge').then((mod) => mod.HealthGauge),
  {
    ssr: false,
    loading: () => <HealthGaugeSkeleton />,
  }
);

const QuickStats = dynamic(
  () => import('@/components/atoms/QuickStats').then((mod) => mod.QuickStats),
  {
    ssr: false,
    loading: () => <QuickStatsSkeleton />,
  }
);

const PerformancePanel = dynamic(
  () => import('@/components/atoms/PerformancePanel').then((mod) => mod.PerformancePanel),
  {
    ssr: false,
    loading: () => <PerformancePanelSkeleton />,
  }
);

const NetworkTopology = dynamic(
  () => import('@/components/atoms/NetworkTopology').then((mod) => mod.NetworkTopology),
  {
    ssr: false,
    loading: () => <NetworkTopologySkeleton />,
  }
);

const ComponentCards = dynamic(
  () => import('@/components/atoms/ComponentCards').then((mod) => mod.ComponentCards),
  {
    ssr: false,
    loading: () => <ComponentCardsSkeleton />,
  }
);

// Import skeletons for loading states
import { HealthGaugeSkeleton } from '@/components/atoms/HealthGauge';
import { QuickStatsSkeleton } from '@/components/atoms/QuickStats';
import { PerformancePanelSkeleton } from '@/components/atoms/PerformancePanel';
import { NetworkTopologySkeleton } from '@/components/atoms/NetworkTopology';
import { ComponentCardsSkeleton } from '@/components/atoms/ComponentCards';

// Error Boundary wrapper
import AtomErrorBoundary from '@/components/ui/AtomErrorBoundary';

// SVG Icons
const Brain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

const Dot = ({ s = 'green' }: { s?: string }) => {
  const c: Record<string, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };
  return (
    <span
      className={s === 'green' ? 'live-pulse' : ''}
      style={{
        width: 10,
        height: 10,
        background: c[s] || c.green,
        borderRadius: '50%',
        display: 'inline-block',
      }}
    />
  );
};

// Error fallback component
function AtomOffline({ name }: { name: string }) {
  return (
    <div className="glass rounded-2xl p-6 border border-red-500/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
          <span className="text-red-400">⚠️</span>
        </div>
        <div>
          <h3 className="font-semibold text-red-400">{name} - Offline</h3>
          <p className="text-xs text-gray-500">Auto-recovery in progress...</p>
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const health = await getHealth();
  const col: Record<string, string> = { green: '#22c55e', yellow: '#eab308', red: '#ef4444' };

  // Error state
  if (!health) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-white">
        <div className="glass p-8 rounded-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">Could not connect to ARCHON API</p>
          <a
            href="/dashboard"
            className="inline-block px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-purple-400 font-medium"
          >
            🔄 Retry
          </a>
        </div>
      </div>
    );
  }

  // Group components by type
  const g = health.components.reduce(
    (a, c) => {
      const k = c.name.includes('Lambda') ? 'l' : c.name.includes('N8N') ? 'n' : 'v';
      (a[k] = a[k] || []).push(c);
      return a;
    },
    {} as Record<string, Comp[]>
  );

  // Calculate metrics
  const avgLatency = Math.round(
    health.components.reduce((a, c) => a + c.latency, 0) / health.components.length
  );

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header - Static, Server Rendered */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="w-7 h-7 text-white">
                <Brain />
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">ARCHON V2.5</h1>
              <p className="text-xs text-gray-500">Atomic Self-Healing Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
                health.overall === 'green'
                  ? 'bg-green-500/20'
                  : health.overall === 'yellow'
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
              }`}
            >
              <Dot s={health.overall} />
              <span
                className={`text-lg font-bold ${
                  health.overall === 'green'
                    ? 'text-green-400'
                    : health.overall === 'yellow'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {health.score}%
              </span>
            </div>
            <span className="text-sm text-gray-500">{new Date().toLocaleTimeString('tr-TR')}</span>
            <a
              href="/dashboard"
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-gray-400 hover:text-purple-400"
            >
              🔄
            </a>
          </div>
        </div>
      </header>

      {/* Main Content - Atomic Components */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Gauge Atom */}
          <AtomErrorBoundary atomId="health-gauge" fallback={<AtomOffline name="Health Gauge" />}>
            <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
              <Suspense fallback={<HealthGaugeSkeleton />}>
                <HealthGauge score={health.score} status={health.overall} />
              </Suspense>
              <div className="mt-4 flex items-center gap-2">
                <Dot s={health.overall} />
                <span className="text-gray-400">
                  {health.overall === 'green' ? 'All Systems OK' : 'Issues Detected'}
                </span>
              </div>
            </div>
          </AtomErrorBoundary>

          {/* Quick Stats Atom */}
          <AtomErrorBoundary atomId="quick-stats" fallback={<AtomOffline name="Quick Stats" />}>
            <Suspense fallback={<QuickStatsSkeleton />}>
              <QuickStats
                total={health.components.length}
                healthy={health.components.filter((c) => c.status === 'green').length}
                warning={health.components.filter((c) => c.status === 'yellow').length}
                error={health.components.filter((c) => c.status === 'red').length}
              />
            </Suspense>
          </AtomErrorBoundary>

          {/* Performance Panel Atom */}
          <AtomErrorBoundary
            atomId="performance-panel"
            fallback={<AtomOffline name="Performance Panel" />}
          >
            <div className="col-span-2">
              <Suspense fallback={<PerformancePanelSkeleton />}>
                <PerformancePanel
                  healthScore={health.score}
                  avgLatency={avgLatency}
                  refreshRate={30}
                  status={health.overall}
                />
              </Suspense>
            </div>
          </AtomErrorBoundary>
        </div>

        {/* Network Topology Atom */}
        <AtomErrorBoundary
          atomId="network-topology"
          fallback={<AtomOffline name="Network Topology" />}
        >
          <Suspense fallback={<NetworkTopologySkeleton />}>
            <NetworkTopology lambdas={g.l || []} n8n={g.n || []} vercel={g.v || []} />
          </Suspense>
        </AtomErrorBoundary>

        {/* Component Cards Atom */}
        <AtomErrorBoundary
          atomId="component-cards"
          fallback={<AtomOffline name="Component Cards" />}
        >
          <Suspense fallback={<ComponentCardsSkeleton />}>
            <ComponentCards lambdas={g.l || []} n8n={g.n || []} vercel={g.v || []} />
          </Suspense>
        </AtomErrorBoundary>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 py-4">
          Last updated: {new Date(health.timestamp).toLocaleString('tr-TR')} •
          <a
            href="/api/realtime-status"
            target="_blank"
            className="text-purple-400 hover:text-purple-300 ml-1"
          >
            View Raw API
          </a>{' '}
          •
          <a
            href="/api/registry"
            target="_blank"
            className="text-cyan-400 hover:text-cyan-300 ml-1"
          >
            Atom Registry
          </a>{' '}
          •
          <a href="/dashboard" className="text-purple-400 hover:text-purple-300 ml-1">
            Refresh
          </a>
        </div>
      </main>
    </div>
  );
}
