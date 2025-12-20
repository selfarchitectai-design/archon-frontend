"use client";

import { useState, useEffect, useCallback } from "react";

// Types
interface ComponentStatus {
  name: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
  lastCheck: string;
}

interface SystemHealth {
  overall: "green" | "yellow" | "red";
  score: number;
  components: ComponentStatus[];
  timestamp: string;
  refreshInterval: number;
}

// Simple Icons
const BrainIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const ServerIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>;
const WorkflowIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>;
const ActivityIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const WifiIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>;
const RefreshIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/></svg>;
const GlobeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const CpuIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/></svg>;
const CheckIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="20 6 9 17 4 12"/></svg>;
const AlertIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
const XIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

// Live Dot
const LiveDot = ({ status = "green", size = 8 }: { status?: string; size?: number }) => {
  const colors: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  return <span className={status === "green" ? "live-pulse" : ""} style={{ width: size, height: size, background: colors[status] || colors.green, borderRadius: "50%", display: "inline-block" }} />;
};

// Status Badge
const StatusBadge = ({ status }: { status: "green" | "yellow" | "red" }) => {
  const cfg = {
    green: { cls: "bg-green-500/20 text-green-400 border-green-500/40", label: "Healthy", Icon: CheckIcon },
    yellow: { cls: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", label: "Warning", Icon: AlertIcon },
    red: { cls: "bg-red-500/20 text-red-400 border-red-500/40", label: "Error", Icon: XIcon },
  };
  const { cls, label, Icon } = cfg[status];
  return <span className={`inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full border ${cls}`}><span className="w-3 h-3"><Icon /></span>{label}</span>;
};

// Circular Gauge
const CircularGauge = ({ value, color }: { value: number; color: string }) => {
  const size = 140, strokeWidth = 8, radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        <span className="text-xs text-gray-500">Score</span>
      </div>
    </div>
  );
};

// Sparkline
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const h = 50, w = 120, max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(" ");
  return (
    <svg width={w} height={h}>
      <defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={color} stopOpacity="0.3" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill="url(#sg)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx={w} cy={h - ((data[data.length-1] - min) / range) * h} r="4" fill={color} />
    </svg>
  );
};

// Network Node
const NetworkNode = ({ name, status, Icon, style }: { name: string; status: string; Icon: React.FC; style: React.CSSProperties }) => {
  const bg: Record<string, string> = { green: "from-green-500/30 to-green-600/10 border-green-500/50", yellow: "from-yellow-500/30 to-yellow-600/10 border-yellow-500/50", red: "from-red-500/30 to-red-600/10 border-red-500/50" };
  return (
    <div className="absolute flex flex-col items-center transition-transform hover:scale-110 cursor-pointer z-10" style={style}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg[status]} border flex items-center justify-center`} style={{ backdropFilter: "blur(8px)" }}>
        <span className="w-6 h-6 text-white"><Icon /></span>
      </div>
      <span className="text-xs text-gray-400 mt-1 whitespace-nowrap">{name}</span>
      <LiveDot status={status} size={5} />
    </div>
  );
};

// Main Dashboard
export default function Dashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");
  const [sparkData, setSparkData] = useState([85, 87, 86, 88, 90, 89, 92, 91, 93, 92]);

  const fetchHealth = useCallback(async () => {
    try {
      setError(null);
      // Use absolute URL to avoid SSR issues
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://selfarchitectai.com';
      const res = await fetch(`${baseUrl}/api/realtime-status`, { 
        cache: "no-store",
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setHealth(data);
      setLastUpdate(new Date().toLocaleTimeString("tr-TR"));
      setSparkData(prev => [...prev.slice(1), data.score]);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const groups = health?.components.reduce((acc, c) => {
    const cat = c.name.includes("Lambda") ? "lambda" : c.name.includes("N8N") ? "n8n" : "vercel";
    (acc[cat] = acc[cat] || []).push(c);
    return acc;
  }, {} as Record<string, ComponentStatus[]>) || {};

  const colors: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };

  // Loading state
  if (loading && !health) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !health) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center glass p-8 rounded-2xl max-w-md">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="w-8 h-8 text-red-400"><XIcon /></span>
          </div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button onClick={fetchHealth} className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 font-medium transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!health) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="w-5 h-5 text-white"><BrainIcon /></span>
            </div>
            <div>
              <h1 className="text-lg font-bold gradient-text">ARCHON V2.5</h1>
              <p className="text-xs text-gray-500">Real-time Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${health.overall === "green" ? "bg-green-500/20" : health.overall === "yellow" ? "bg-yellow-500/20" : "bg-red-500/20"}`}>
              <LiveDot status={health.overall} />
              <span className={`text-sm font-bold ${health.overall === "green" ? "text-green-400" : health.overall === "yellow" ? "text-yellow-400" : "text-red-400"}`}>{health.score}%</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/20">
              <span className="w-4 h-4 text-blue-400"><CpuIcon /></span>
              <span className="text-sm text-blue-400">{groups.lambda?.length || 0}/4</span>
            </div>
            <span className="text-xs text-gray-500">{lastUpdate}</span>
            <button onClick={fetchHealth} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition">
              <span className={`w-4 h-4 text-gray-400 block ${loading ? "animate-spin" : ""}`}><RefreshIcon /></span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Top Row */}
        <div className="grid grid-cols-4 gap-6">
          {/* Gauge */}
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
            <CircularGauge value={health.score} color={colors[health.overall]} />
            <div className="mt-3 flex items-center gap-2">
              <LiveDot status={health.overall} />
              <span className="text-sm text-gray-400">{health.overall === "green" ? "All OK" : "Issues"}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-4 h-4 text-cyan-400"><ActivityIcon /></span>Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "Total", v: health.components.length, c: "text-blue-400 bg-blue-500/20" },
                { l: "OK", v: health.components.filter(c => c.status === "green").length, c: "text-green-400 bg-green-500/20" },
                { l: "Warn", v: health.components.filter(c => c.status === "yellow").length, c: "text-yellow-400 bg-yellow-500/20" },
                { l: "Error", v: health.components.filter(c => c.status === "red").length, c: "text-red-400 bg-red-500/20" },
              ].map((s, i) => (
                <div key={i} className={`${s.c.split(' ')[1]} rounded-lg p-3 text-center`}>
                  <div className={`text-2xl font-bold ${s.c.split(' ')[0]}`}>{s.v}</div>
                  <div className="text-xs text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div className="col-span-2 glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-4 h-4 text-green-400"><ActivityIcon /></span>Trend</h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold" style={{ color: colors[health.overall] }}>{health.score}%</div>
                <div className="text-xs text-gray-500">Current</div>
              </div>
              <Sparkline data={sparkData} color={colors[health.overall]} />
              <div className="text-right">
                <div className="text-lg font-semibold">{Math.round(health.components.reduce((a, c) => a + c.latency, 0) / health.components.length)}ms</div>
                <div className="text-xs text-gray-500">Avg Latency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Topology */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><span className="w-4 h-4 text-purple-400"><WifiIcon /></span>Network Topology</h3>
          <div className="relative h-64 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.05))" }}>
            {/* SVG Lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
              <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" /></linearGradient></defs>
              {["15%","38%","62%","85%"].map((x, i) => <line key={`t${i}`} x1="50%" y1="50%" x2={x} y2="15%" stroke="url(#lg)" strokeWidth="2" className="conn-line" />)}
              {["25%","50%","75%"].map((x, i) => <line key={`b${i}`} x1="50%" y1="50%" x2={x} y2="85%" stroke="url(#lg)" strokeWidth="2" className="conn-line" />)}
            </svg>

            {/* Core */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-500/40 core-pulse">
                <span className="w-8 h-8 text-white"><BrainIcon /></span>
              </div>
              <div className="text-center mt-1"><span className="text-xs font-bold">ARCHON</span></div>
            </div>

            {/* Lambda Nodes */}
            {groups.lambda?.map((c, i) => (
              <NetworkNode key={c.name} name={c.name.replace("Lambda: ", "")} status={c.status} Icon={CpuIcon} 
                style={{ left: ["15%","38%","62%","85%"][i], top: "15%", transform: "translate(-50%, -50%)" }} />
            ))}

            {/* Service Nodes */}
            <NetworkNode name="Vercel" status={groups.vercel?.[0]?.status || "green"} Icon={GlobeIcon} style={{ left: "25%", top: "85%", transform: "translate(-50%, -50%)" }} />
            <NetworkNode name="AI" status={groups.vercel?.find(c => c.name.includes("AI"))?.status || "yellow"} Icon={BrainIcon} style={{ left: "50%", top: "85%", transform: "translate(-50%, -50%)" }} />
            <NetworkNode name="N8N" status={groups.n8n?.[0]?.status || "green"} Icon={WorkflowIcon} style={{ left: "75%", top: "85%", transform: "translate(-50%, -50%)" }} />
          </div>
        </div>

        {/* Component Cards */}
        <div className="grid grid-cols-3 gap-6">
          {/* Lambda */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="w-4 h-4 text-blue-400"><ServerIcon /></span>Lambda</h3>
            <div className="space-y-2">
              {groups.lambda?.map(c => (
                <div key={c.name} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex items-center gap-2">
                    <LiveDot status={c.status} size={6} />
                    <div><div className="text-sm font-medium">{c.name.replace("Lambda: ", "")}</div><div className="text-xs text-gray-500">{c.latency}ms</div></div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>

          {/* N8N */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="w-4 h-4 text-orange-400"><WorkflowIcon /></span>N8N</h3>
            <div className="space-y-2">
              {groups.n8n?.map(c => (
                <div key={c.name} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex items-center gap-2">
                    <LiveDot status={c.status} size={6} />
                    <div><div className="text-sm font-medium">{c.name.replace("N8N ", "").replace("Webhook: ", "")}</div><div className="text-xs text-gray-500">{c.latency}ms</div></div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Vercel */}
          <div className="glass rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span className="w-4 h-4 text-cyan-400"><GlobeIcon /></span>Vercel</h3>
            <div className="space-y-2">
              {groups.vercel?.map(c => (
                <div key={c.name} className="flex items-center justify-between p-2.5 bg-white/5 rounded-lg hover:bg-white/10 transition">
                  <div className="flex items-center gap-2">
                    <LiveDot status={c.status} size={6} />
                    <div><div className="text-sm font-medium">{c.name}</div><div className="text-xs text-gray-500">{c.latency}ms</div></div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 py-2">
          Updated: {health.timestamp ? new Date(health.timestamp).toLocaleString("tr-TR") : "-"} • 
          <a href="/api/realtime-status" target="_blank" className="text-purple-400 hover:text-purple-300 ml-1">API</a>
        </div>
      </main>
    </div>
  );
}
