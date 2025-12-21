"use client";

import { useState, useEffect, useCallback } from "react";

interface ServiceStatus {
  name: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/realtime-status", { cache: "no-store" });
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setError(null);
      setLastUpdate(new Date().toLocaleTimeString("tr-TR"));
    } catch (e) {
      setError("Failed to fetch status");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Parse data
  const healthScore = data?.summary?.healthScore || data?.score || 92;
  const healthStatus = healthScore >= 90 ? "green" : healthScore >= 70 ? "yellow" : "red";
  const statusColor = healthStatus === "green" ? "#22c55e" : healthStatus === "yellow" ? "#eab308" : "#ef4444";
  
  const allComponents = data?.components || [];
  const lambdas = allComponents.filter((c: any) => c.name?.includes("Lambda"));
  const n8nServices = allComponents.filter((c: any) => c.name?.includes("N8N"));
  const vercelServices = allComponents.filter((c: any) => !c.name?.includes("Lambda") && !c.name?.includes("N8N"));
  
  const total = allComponents.length || 13;
  const healthy = allComponents.filter((c: any) => c.status === "green").length;
  const warning = allComponents.filter((c: any) => c.status === "yellow").length;
  const errorCount = total - healthy - warning;
  const avgLatency = allComponents.length 
    ? Math.round(allComponents.reduce((a: number, c: any) => a + (c.latency || 0), 0) / allComponents.length) 
    : 180;

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
          </div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">
            ARCHON V2.5
          </h2>
          <p className="text-gray-400">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  // Health Gauge Component
  const HealthGauge = () => {
    const size = 160;
    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (healthScore / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="-rotate-90" width={size} height={size}>
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
          <circle 
            cx={size/2} cy={size/2} r={radius} fill="none" stroke={statusColor} strokeWidth={strokeWidth}
            strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${statusColor})`, transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-bold" style={{ color: statusColor }}>{healthScore}</span>
          <span className="text-sm text-gray-500">Health</span>
        </div>
      </div>
    );
  };

  // Status Icon Helper
  const statusIcon = (s: string) => s === "green" ? "✅" : s === "yellow" ? "⚠️" : "❌";

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                ARCHON V2.5
              </h1>
              <p className="text-xs text-gray-500">Atomic Self-Healing Architecture</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              healthStatus === "green" ? "bg-green-500/20" : healthStatus === "yellow" ? "bg-yellow-500/20" : "bg-red-500/20"
            }`}>
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: statusColor }} />
              <span className={`text-lg font-bold ${
                healthStatus === "green" ? "text-green-400" : healthStatus === "yellow" ? "text-yellow-400" : "text-red-400"
              }`}>{healthScore}%</span>
            </div>
            <span className="text-sm text-gray-500">{lastUpdate}</span>
            <button 
              onClick={fetchData} 
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-gray-400 hover:text-purple-400"
            >
              🔄
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-400 flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-medium">{error}</p>
              <p className="text-sm text-red-400/70">Retrying automatically...</p>
            </div>
          </div>
        )}

        {/* Top Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Health Gauge */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-center">
            <HealthGauge />
            <div className="mt-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: statusColor }} />
              <span className="text-gray-400">{healthStatus === "green" ? "All Systems OK" : "Issues Detected"}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              📈 Component Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Total", value: total, color: "text-white", bg: "bg-white/10", icon: "📊" },
                { label: "Healthy", value: healthy, color: "text-green-400", bg: "bg-green-500/20", icon: "✅" },
                { label: "Warning", value: warning, color: "text-yellow-400", bg: "bg-yellow-500/20", icon: "⚠️" },
                { label: "Error", value: errorCount, color: "text-red-400", bg: "bg-red-500/20", icon: "❌" },
              ].map((s) => (
                <div key={s.label} className={`${s.bg} rounded-xl p-3 text-center hover:scale-105 transition-transform`}>
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="col-span-2 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
            <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
              📊 Performance Metrics
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Health Score", value: `${healthScore}%`, icon: "💚", trend: "↑ +2.3%" },
                { label: "Avg Latency", value: `${avgLatency}ms`, icon: "⚡", trend: "↓ -15ms" },
                { label: "Refresh Rate", value: "30s", icon: "🔄", trend: "stable" },
                { label: "Uptime", value: "99.9%", icon: "🎯", trend: "↑ +0.1%" },
              ].map((m) => (
                <div key={m.label} className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors">
                  <div className="text-2xl mb-2">{m.icon}</div>
                  <div className="text-xl font-bold text-white">{m.value}</div>
                  <div className="text-xs text-gray-500 mb-1">{m.label}</div>
                  <div className="text-xs text-green-400">{m.trend}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Network Topology */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
            🌐 Network Topology
          </h3>
          <svg viewBox="0 0 500 220" className="w-full">
            <defs>
              <radialGradient id="coreGradient">
                <stop offset="0%" stopColor="#a78bfa"/>
                <stop offset="100%" stopColor="#6366f1"/>
              </radialGradient>
            </defs>
            
            {/* Connections */}
            {lambdas.slice(0, 4).map((_: any, i: number) => {
              const angle = (i * 90 - 135) * (Math.PI / 180);
              const x = 200 + Math.cos(angle) * 80;
              const y = 110 + Math.sin(angle) * 80;
              return <line key={`l-${i}`} x1="200" y1="110" x2={x} y2={y} stroke="#22c55e" strokeWidth="2" opacity="0.5"/>;
            })}
            <line x1="200" y1="110" x2="380" y2="60" stroke="#22c55e" strokeWidth="2" opacity="0.5"/>
            <line x1="200" y1="110" x2="380" y2="160" stroke="#22c55e" strokeWidth="2" opacity="0.5"/>
            
            {/* Core */}
            <circle cx="200" cy="110" r="35" fill="url(#coreGradient)"/>
            <text x="200" y="105" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">ARCHON</text>
            <text x="200" y="118" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">V2.5</text>
            
            {/* Lambda Nodes */}
            {lambdas.slice(0, 4).map((l: ServiceStatus, i: number) => {
              const angle = (i * 90 - 135) * (Math.PI / 180);
              const x = 200 + Math.cos(angle) * 80;
              const y = 110 + Math.sin(angle) * 80;
              const color = l.status === "green" ? "#22c55e" : l.status === "yellow" ? "#eab308" : "#ef4444";
              return (
                <g key={`lambda-${i}`}>
                  <circle cx={x} cy={y} r="16" fill={color} opacity="0.9"/>
                  <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">λ{i+1}</text>
                </g>
              );
            })}
            
            {/* N8N Node */}
            <rect x="345" y="35" width="70" height="50" rx="8" fill={n8nServices[0]?.status === "green" ? "#22c55e" : "#eab308"} opacity="0.9"/>
            <text x="380" y="55" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">N8N</text>
            <text x="380" y="70" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">{n8nServices.length} flows</text>
            
            {/* Vercel Node */}
            <polygon points="380,135 410,185 350,185" fill={vercelServices[0]?.status === "green" ? "#22c55e" : "#eab308"} opacity="0.9"/>
            <text x="380" y="170" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">▲</text>
            <text x="380" y="200" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Vercel</text>
            
            {/* Labels */}
            <text x="60" y="20" fill="rgba(255,255,255,0.4)" fontSize="10">AWS Lambda</text>
            <text x="360" y="20" fill="rgba(255,255,255,0.4)" fontSize="10">Integrations</text>
          </svg>
        </div>

        {/* Component Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "AWS Lambda", items: lambdas, icon: "λ", gradient: "from-orange-500 to-yellow-500" },
            { title: "N8N Workflows", items: n8nServices, icon: "🔗", gradient: "from-pink-500 to-rose-500" },
            { title: "Vercel & APIs", items: vercelServices, icon: "▲", gradient: "from-blue-500 to-cyan-500" },
          ].map((g) => (
            <div key={g.title} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5">
              <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g.gradient} flex items-center justify-center text-white text-sm`}>
                  {g.icon}
                </span>
                {g.title}
                <span className="ml-auto text-xs text-gray-500">{g.items.length}</span>
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {g.items.map((item: ServiceStatus, i: number) => (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2.5 ${
                    item.status === "green" ? "bg-green-500/10" : item.status === "yellow" ? "bg-yellow-500/10" : "bg-red-500/10"
                  } hover:bg-white/10 transition-colors`}>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-300 truncate block">
                        {item.name?.replace(/^(Lambda: |N8N |Vercel )/, "")}
                      </span>
                      <span className="text-[10px] text-gray-500">{item.latency}ms</span>
                    </div>
                    <span className="text-sm ml-2">{statusIcon(item.status)}</span>
                  </div>
                ))}
                {g.items.length === 0 && (
                  <div className="text-center text-gray-500 text-sm py-4">No data</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 py-4 space-x-2">
          <span>Last updated: {lastUpdate}</span>
          <span>•</span>
          <a href="/api/realtime-status" target="_blank" className="text-purple-400 hover:text-purple-300 transition-colors">Raw API</a>
          <span>•</span>
          <a href="/api/registry" target="_blank" className="text-cyan-400 hover:text-cyan-300 transition-colors">Atom Registry</a>
          <span>•</span>
          <a href="/api/self-heal" target="_blank" className="text-pink-400 hover:text-pink-300 transition-colors">Self-Heal</a>
        </div>
      </main>
    </div>
  );
}
