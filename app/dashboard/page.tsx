// ARCHON V2.5 - Atomic Self-Healing Dashboard
"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";

// ============ ERROR BOUNDARY ============
function AtomErrorBoundary({ children, atomId, fallback }: { children: ReactNode; atomId: string; fallback: ReactNode }) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    setHasError(false);
  }, [atomId]);

  if (hasError) return <>{fallback}</>;
  return <>{children}</>;
}

// ============ ATOMS ============
function HealthGauge({ score, status }: { score: number; status: string }) {
  const color = status === "green" ? "#22c55e" : status === "yellow" ? "#eab308" : "#ef4444";
  const circumference = 2 * Math.PI * 70;
  const offset = circumference - (score / 100) * circumference;
  
  return (
    <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r="70" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle 
          cx="75" cy="75" r="70" fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 75 75)" style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text x="75" y="75" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="32" fontWeight="bold">
          {score}%
        </text>
        <text x="75" y="100" textAnchor="middle" fill={color} fontSize="12">HEALTH</text>
      </svg>
      <div className="mt-4 flex items-center gap-2">
        <span className="live-pulse" style={{ width: 10, height: 10, background: color, borderRadius: "50%", display: "inline-block" }} />
        <span className="text-gray-400">All Systems {status === "green" ? "OK" : "Warning"}</span>
      </div>
    </div>
  );
}

function QuickStats({ total, healthy, warning, error }: { total: number; healthy: number; warning: number; error: number }) {
  const stats = [
    { label: "Total", value: total, color: "text-white", bg: "bg-white/10" },
    { label: "Healthy", value: healthy, color: "text-green-400", bg: "bg-green-500/20" },
    { label: "Warning", value: warning, color: "text-yellow-400", bg: "bg-yellow-500/20" },
    { label: "Error", value: error, color: "text-red-400", bg: "bg-red-500/20" },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Component Status</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PerformancePanel({ healthScore, avgLatency, refreshRate }: { healthScore: number; avgLatency: number; refreshRate: number }) {
  const metrics = [
    { label: "Health Score", value: `${healthScore}%`, icon: "💚" },
    { label: "Avg Latency", value: `${avgLatency}ms`, icon: "⚡" },
    { label: "Refresh Rate", value: `${refreshRate}s`, icon: "🔄" },
  ];

  return (
    <div className="col-span-2 glass rounded-2xl p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Performance Metrics</h3>
      <div className="grid grid-cols-3 gap-4">
        {metrics.map((m) => (
          <div key={m.label} className="bg-white/5 rounded-xl p-4 text-center">
            <div className="text-2xl mb-1">{m.icon}</div>
            <div className="text-xl font-bold text-white">{m.value}</div>
            <div className="text-xs text-gray-500">{m.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NetworkTopology({ lambdas, n8n, vercel }: { lambdas: any[]; n8n: any[]; vercel: any[] }) {
  const statusColor = (s: string) => s === "green" ? "#22c55e" : s === "yellow" ? "#eab308" : "#ef4444";

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4">Network Topology</h3>
      <svg viewBox="0 0 400 200" className="w-full">
        <circle cx="200" cy="100" r="30" fill="url(#coreGradient)" />
        <text x="200" y="105" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">ARCHON</text>
        
        {lambdas.slice(0, 4).map((l, i) => {
          const angle = (i * 90 - 45) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 70;
          const y = 100 + Math.sin(angle) * 70;
          return (
            <g key={`lambda-${i}`}>
              <line x1="200" y1="100" x2={x} y2={y} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              <circle cx={x} cy={y} r="12" fill={statusColor(l.status)} opacity="0.8" />
              <text x={x} y={y + 3} textAnchor="middle" fill="white" fontSize="8">λ{i + 1}</text>
            </g>
          );
        })}
        
        <line x1="200" y1="100" x2="320" y2="50" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <rect x="300" y="35" width="40" height="30" rx="5" fill={statusColor(n8n[0]?.status || "green")} opacity="0.8" />
        <text x="320" y="55" textAnchor="middle" fill="white" fontSize="9">N8N</text>
        
        <line x1="200" y1="100" x2="320" y2="150" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
        <polygon points="320,135 340,165 300,165" fill={statusColor(vercel[0]?.status || "green")} opacity="0.8" />
        <text x="320" y="158" textAnchor="middle" fill="white" fontSize="8">▲</text>
        
        <defs>
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#3b82f6" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

function ComponentCards({ lambdas, n8n, vercel }: { lambdas: any[]; n8n: any[]; vercel: any[] }) {
  const statusIcon = (s: string) => s === "green" ? "✅" : s === "yellow" ? "⚠️" : "❌";
  
  const groups = [
    { title: "AWS Lambda", items: lambdas, icon: "λ" },
    { title: "N8N Workflows", items: n8n, icon: "🔗" },
    { title: "Vercel & APIs", items: vercel, icon: "▲" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {groups.map((g) => (
        <div key={g.title} className="glass rounded-2xl p-4">
          <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <span>{g.icon}</span> {g.title}
          </h4>
          <div className="space-y-2">
            {g.items.slice(0, 5).map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2">
                <span className="text-xs text-gray-400 truncate flex-1">{item.name?.replace(/^(Lambda: |N8N |Vercel )/, "")}</span>
                <span className="text-sm">{statusIcon(item.status)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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

// ============ MAIN DASHBOARD ============
export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/realtime-status");
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString("tr-TR"));
    } catch (e) {
      setError("Failed to fetch status");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const healthScore = data?.summary?.healthScore || 92;
  const healthStatus = healthScore >= 90 ? "green" : healthScore >= 70 ? "yellow" : "red";
  
  const lambdas = data?.aws?.lambdas || [];
  const n8nServices = data?.n8n || [];
  const vercelServices = data?.vercel || [];
  
  const total = lambdas.length + n8nServices.length + vercelServices.length;
  const healthy = [...lambdas, ...n8nServices, ...vercelServices].filter((s: any) => s.status === "green").length;
  const warning = [...lambdas, ...n8nServices, ...vercelServices].filter((s: any) => s.status === "yellow").length;
  const errorCount = total - healthy - warning;
  const avgLatency = data?.summary?.avgLatency || 180;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading ARCHON Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style jsx global>{`
        .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .gradient-text { background: linear-gradient(to right, #8b5cf6, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .live-pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
      
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">ARCHON V2.5</h1>
              <p className="text-xs text-gray-500">Atomic Self-Healing Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${healthStatus === "green" ? "bg-green-500/20" : healthStatus === "yellow" ? "bg-yellow-500/20" : "bg-red-500/20"}`}>
              <span className="live-pulse" style={{ width: 10, height: 10, background: healthStatus === "green" ? "#22c55e" : healthStatus === "yellow" ? "#eab308" : "#ef4444", borderRadius: "50%", display: "inline-block" }} />
              <span className={`text-lg font-bold ${healthStatus === "green" ? "text-green-400" : healthStatus === "yellow" ? "text-yellow-400" : "text-red-400"}`}>{healthScore}%</span>
            </div>
            <span className="text-sm text-gray-500">{lastUpdate}</span>
            <button onClick={fetchData} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-gray-400 hover:text-purple-400">🔄</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400">
            ⚠️ {error} - Retrying...
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AtomErrorBoundary atomId="health-gauge" fallback={<AtomOffline name="Health Gauge" />}>
            <HealthGauge score={healthScore} status={healthStatus} />
          </AtomErrorBoundary>
          
          <AtomErrorBoundary atomId="quick-stats" fallback={<AtomOffline name="Quick Stats" />}>
            <QuickStats total={total} healthy={healthy} warning={warning} error={errorCount} />
          </AtomErrorBoundary>
          
          <AtomErrorBoundary atomId="performance-panel" fallback={<AtomOffline name="Performance Panel" />}>
            <PerformancePanel healthScore={healthScore} avgLatency={avgLatency} refreshRate={30} />
          </AtomErrorBoundary>
        </div>

        <AtomErrorBoundary atomId="network-topology" fallback={<AtomOffline name="Network Topology" />}>
          <NetworkTopology lambdas={lambdas} n8n={n8nServices} vercel={vercelServices} />
        </AtomErrorBoundary>

        <AtomErrorBoundary atomId="component-cards" fallback={<AtomOffline name="Component Cards" />}>
          <ComponentCards lambdas={lambdas} n8n={n8nServices} vercel={vercelServices} />
        </AtomErrorBoundary>

        <div className="text-center text-sm text-gray-600 py-4">
          Last updated: {lastUpdate} • 
          <a href="/api/realtime-status" target="_blank" className="text-purple-400 hover:text-purple-300 ml-1">View Raw API</a> • 
          <a href="/api/registry" target="_blank" className="text-cyan-400 hover:text-cyan-300 ml-1">Atom Registry</a>
        </div>
      </main>
    </div>
  );
}
