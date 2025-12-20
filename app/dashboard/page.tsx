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

// Icons
const Icons = {
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  ),
  server: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  ),
  workflow: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/>
      <rect width="8" height="8" x="13" y="13" rx="2"/>
    </svg>
  ),
  activity: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  ),
  wifi: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/>
      <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/>
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8M21 3v5h-5M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16M8 16H3v5"/>
    </svg>
  ),
  globe: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  cpu: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"/>
    </svg>
  ),
  database: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/>
      <path d="M3 12A9 3 0 0 0 21 12"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  x: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  plug: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 22v-5M9 8V2M15 8V2M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>
    </svg>
  ),
};

// Animated Live Dot
const LiveDot = ({ status = "green", size = "md" }: { status?: string; size?: string }) => {
  const colors: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  const sizes: Record<string, number> = { sm: 6, md: 8, lg: 12 };
  const s = sizes[size] || 8;
  const color = colors[status] || colors.green;

  return (
    <span
      className="live-dot"
      style={{
        width: s, height: s, background: color, borderRadius: "50%", display: "inline-block",
        animation: status === "green" ? "livePulse 1.5s infinite" : "none",
      }}
    />
  );
};

// Status Badge
const StatusBadge = ({ status }: { status: "green" | "yellow" | "red" }) => {
  const styles: Record<string, string> = {
    green: "bg-green-500/20 text-green-400 border-green-500/40",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
    red: "bg-red-500/20 text-red-400 border-red-500/40",
  };
  const labels: Record<string, string> = { green: "Healthy", yellow: "Warning", red: "Error" };
  const icons: Record<string, JSX.Element> = { green: Icons.check, yellow: Icons.alert, red: Icons.x };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
      <span className="w-3 h-3">{icons[status]}</span>
      {labels[status]}
    </span>
  );
};

// Circular Gauge
const CircularGauge = ({ value, size = 160, strokeWidth = 10, color }: { value: number; size?: number; strokeWidth?: number; color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" style={{ filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{value}</span>
        <span className="text-xs text-gray-500 mt-1">Health Score</span>
      </div>
    </div>
  );
};

// Sparkline Chart
const Sparkline = ({ data, color = "#22c55e", height = 40 }: { data: number[]; color?: string; height?: number }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#sparkGrad-${color.replace("#", "")})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / range) * height} r="3" fill={color} />
    </svg>
  );
};

// Network Node - Fixed types
const NetworkNode = ({ name, status, type, x, y }: { name: string; status: string; type: string; x: string; y: string }) => {
  const colors: Record<string, string> = {
    green: "from-green-500/30 to-green-600/10 border-green-500/50",
    yellow: "from-yellow-500/30 to-yellow-600/10 border-yellow-500/50",
    red: "from-red-500/30 to-red-600/10 border-red-500/50",
  };
  const icons: Record<string, JSX.Element> = {
    lambda: Icons.cpu, vercel: Icons.globe, n8n: Icons.workflow, mcp: Icons.plug, kv: Icons.database, ai: Icons.brain,
  };

  return (
    <div className="absolute flex flex-col items-center transition-transform hover:scale-110 cursor-pointer" style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}>
      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors[status]} border flex items-center justify-center backdrop-blur-sm`}>
        <span className="w-7 h-7 text-white">{icons[type] || Icons.zap}</span>
      </div>
      <span className="text-xs text-gray-400 mt-2 whitespace-nowrap">{name}</span>
      <LiveDot status={status} size="sm" />
    </div>
  );
};

// Activity Item
const ActivityItem = ({ type, message, time, status }: { type: string; message: string; time: string; status: string }) => {
  const icons: Record<string, JSX.Element> = { lambda: Icons.cpu, n8n: Icons.workflow, vercel: Icons.globe, network: Icons.wifi, ai: Icons.brain };
  const colors: Record<string, string> = {
    success: "border-green-500/50 bg-green-500/10", warning: "border-yellow-500/50 bg-yellow-500/10",
    error: "border-red-500/50 bg-red-500/10", info: "border-blue-500/50 bg-blue-500/10",
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${colors[status]} backdrop-blur-sm`}>
      <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
        <span className="w-4 h-4 text-gray-400">{icons[type] || Icons.zap}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{message}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
};

// Main Dashboard
export default function PremiumDashboard() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [activities, setActivities] = useState<Array<{ type: string; message: string; time: string; status: string }>>([]);
  const [sparkData, setSparkData] = useState<number[]>([85, 87, 86, 88, 90, 89, 92, 91, 93, 92]);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/realtime-status", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
      setLastUpdate(new Date());
      setSparkData(prev => [...prev.slice(1), data.score]);
      const newActivity = {
        type: "network",
        message: `Health check: ${data.score}% - ${data.components.filter((c: ComponentStatus) => c.status === "green").length}/${data.components.length} OK`,
        time: new Date().toLocaleTimeString("tr-TR"),
        status: data.overall === "green" ? "success" : data.overall === "yellow" ? "warning" : "error",
      };
      setActivities(prev => [newActivity, ...prev.slice(0, 19)]);
    } catch (err) {
      console.error("Failed to fetch health:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    if (autoRefresh) {
      const interval = setInterval(fetchHealth, 30000);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, autoRefresh]);

  const groups = health?.components.reduce((acc, comp) => {
    let category = "other";
    if (comp.name.includes("Lambda")) category = "lambda";
    else if (comp.name.includes("N8N")) category = "n8n";
    else category = "vercel";
    if (!acc[category]) acc[category] = [];
    acc[category].push(comp);
    return acc;
  }, {} as Record<string, ComponentStatus[]>) || {};

  const statusColors: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  const tabs = [
    { id: "overview", icon: Icons.activity, label: "Overview" },
    { id: "network", icon: Icons.wifi, label: "Network" },
    { id: "lambda", icon: Icons.server, label: "Lambda (4)" },
    { id: "n8n", icon: Icons.workflow, label: "N8N (18)" },
    { id: "vercel", icon: Icons.globe, label: "Vercel" },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes livePulse { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
        @keyframes connFlow { to { stroke-dashoffset: -20; } }
        .glass { background: rgba(26, 26, 36, 0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); }
        .glass:hover { border-color: rgba(139, 92, 246, 0.4); }
        .gradient-text { background: linear-gradient(135deg, #3b82f6, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .conn-line { stroke-dasharray: 8 4; animation: connFlow 1s linear infinite; }
      `}</style>

      <div className="min-h-screen bg-[#0a0a0f] text-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/10">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="w-6 h-6 text-white">{Icons.brain}</span>
              </div>
              <div>
                <h1 className="text-xl font-bold gradient-text">ARCHON V2.5</h1>
                <p className="text-xs text-gray-500">Real-time Network Monitor</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {health && (
                <>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${health.overall === "green" ? "bg-green-500/20" : health.overall === "yellow" ? "bg-yellow-500/20" : "bg-red-500/20"}`}>
                    <LiveDot status={health.overall} />
                    <span className={`text-sm font-semibold ${health.overall === "green" ? "text-green-400" : health.overall === "yellow" ? "text-yellow-400" : "text-red-400"}`}>{health.score}%</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/20">
                    <span className="w-4 h-4 text-blue-400">{Icons.cpu}</span>
                    <span className="text-sm text-blue-400 font-medium">{groups.lambda?.length || 0}/4</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-orange-500/30 to-red-500/30">
                    <span className="w-4 h-4 text-orange-400">{Icons.workflow}</span>
                    <span className="text-sm text-orange-400 font-medium">18</span>
                  </div>
                </>
              )}
              <span className="text-xs text-gray-500">{lastUpdate ? lastUpdate.toLocaleTimeString("tr-TR") : "--:--"}</span>
              <button onClick={fetchHealth} disabled={loading} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition group">
                <span className={`w-5 h-5 text-gray-400 group-hover:text-purple-400 block ${loading ? "animate-spin" : ""}`}>{Icons.refresh}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside className="fixed left-0 top-[73px] bottom-0 w-64 glass border-r border-white/10 overflow-y-auto">
          <nav className="p-4 space-y-2">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${activeTab === tab.id ? "bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 border border-purple-500/40" : "hover:bg-white/5"}`}>
                <span className={`w-5 h-5 ${activeTab === tab.id ? "text-purple-400" : "text-gray-500"}`}>{tab.icon}</span>
                <span className={activeTab === tab.id ? "text-white font-medium" : "text-gray-400"}>{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4"><LiveDot status="green" /><span className="text-sm font-medium">Activity Log</span></div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {activities.slice(0, 5).map((act, i) => (<ActivityItem key={i} {...act} />))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="ml-64 pt-[73px] p-6">
          {loading && !health ? (
            <div className="flex items-center justify-center h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-500">Loading network status...</p>
              </div>
            </div>
          ) : health ? (
            <div className="space-y-6">
              {/* Top Stats */}
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-1 glass rounded-2xl p-6 flex flex-col items-center justify-center">
                  <CircularGauge value={health.score} color={statusColors[health.overall]} />
                  <div className="mt-4 flex items-center gap-2">
                    <LiveDot status={health.overall} />
                    <span className="text-sm text-gray-400">{health.overall === "green" ? "All Systems Operational" : health.overall === "yellow" ? "Partial Issues" : "Critical Issues"}</span>
                  </div>
                </div>

                <div className="col-span-2 glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-5 h-5 text-cyan-400">{Icons.activity}</span>Quick Stats</h3>
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: "Total", value: health.components.length, color: "text-blue-400", bg: "bg-blue-500/20" },
                      { label: "Healthy", value: health.components.filter(c => c.status === "green").length, color: "text-green-400", bg: "bg-green-500/20" },
                      { label: "Warning", value: health.components.filter(c => c.status === "yellow").length, color: "text-yellow-400", bg: "bg-yellow-500/20" },
                      { label: "Error", value: health.components.filter(c => c.status === "red").length, color: "text-red-400", bg: "bg-red-500/20" },
                    ].map((stat, i) => (
                      <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
                        <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                        <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="col-span-2 glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-5 h-5 text-green-400">{Icons.activity}</span>Performance Trend</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-4xl font-bold text-green-400">{health.score}%</div>
                      <div className="text-sm text-gray-500">Current Score</div>
                    </div>
                    <Sparkline data={sparkData} color={statusColors[health.overall]} height={60} />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                    <div><div className="text-lg font-semibold text-white">{Math.round(health.components.reduce((a, c) => a + c.latency, 0) / health.components.length)}ms</div><div className="text-xs text-gray-500">Avg Latency</div></div>
                    <div><div className="text-lg font-semibold text-white">99.9%</div><div className="text-xs text-gray-500">Uptime</div></div>
                    <div><div className="text-lg font-semibold text-white">30s</div><div className="text-xs text-gray-500">Refresh</div></div>
                  </div>
                </div>
              </div>

              {/* Network Topology */}
              <div className="glass rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2"><span className="w-5 h-5 text-purple-400">{Icons.wifi}</span>Network Topology</h3>
                <div className="relative h-80 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 rounded-xl overflow-hidden">
                  <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
                    <defs><linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" /></linearGradient></defs>
                    <line x1="50%" y1="50%" x2="15%" y2="25%" stroke="url(#lineGrad)" strokeWidth="2" className="conn-line" />
                    <line x1="50%" y1="50%" x2="35%" y2="25%" stroke="url(#lineGrad)" strokeWidth="2" className="conn-line" />
                    <line x1="50%" y1="50%" x2="65%" y2="25%" stroke="url(#lineGrad)" strokeWidth="2" className="conn-line" />
                    <line x1="50%" y1="50%" x2="85%" y2="25%" stroke="url(#lineGrad)" strokeWidth="2" className="conn-line" />
                    <line x1="50%" y1="50%" x2="25%" y2="80%" stroke="url(#lineGrad)" strokeWidth="2" className="conn-line" />
                    <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="url(#lineGrad)" strokeWidth="2" className="conn-line" />
                    <line x1="50%" y1="50%" x2="75%" y2="80%" stroke="url(#lineGrad)" strokeWidth="2" className="conn-line" />
                  </svg>
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-500/30 animate-pulse">
                      <span className="w-10 h-10 text-white">{Icons.brain}</span>
                    </div>
                    <div className="text-center mt-2"><span className="text-sm font-semibold text-white">ARCHON</span><div className="flex justify-center mt-1"><LiveDot status="green" /></div></div>
                  </div>
                  {groups.lambda?.map((comp, i) => {
                    const positions = [{ x: "15%", y: "25%" }, { x: "35%", y: "25%" }, { x: "65%", y: "25%" }, { x: "85%", y: "25%" }];
                    const pos = positions[i] || positions[0];
                    return <NetworkNode key={comp.name} name={comp.name.replace("Lambda: ", "")} status={comp.status} type="lambda" x={pos.x} y={pos.y} />;
                  })}
                  {groups.vercel?.slice(0, 3).map((comp, i) => {
                    const positions = [{ x: "25%", y: "80%" }, { x: "50%", y: "85%" }, { x: "75%", y: "80%" }];
                    const types = ["vercel", "ai", "mcp"];
                    const pos = positions[i] || positions[0];
                    return <NetworkNode key={comp.name} name={comp.name.replace("Vercel ", "").replace(" API", "")} status={comp.status} type={types[i]} x={pos.x} y={pos.y} />;
                  })}
                </div>
              </div>

              {/* Component Cards */}
              <div className="grid grid-cols-3 gap-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-5 h-5 text-blue-400">{Icons.server}</span>AWS Lambda</h3>
                  <div className="space-y-3">
                    {groups.lambda?.map((comp) => (
                      <div key={comp.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                          <LiveDot status={comp.status} />
                          <div><div className="text-sm font-medium">{comp.name.replace("Lambda: ", "")}</div><div className="text-xs text-gray-500">{comp.latency}ms</div></div>
                        </div>
                        <StatusBadge status={comp.status} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-5 h-5 text-orange-400">{Icons.workflow}</span>N8N Workflows</h3>
                  <div className="space-y-3">
                    {groups.n8n?.map((comp) => (
                      <div key={comp.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                          <LiveDot status={comp.status} />
                          <div><div className="text-sm font-medium">{comp.name.replace("N8N ", "").replace("Webhook: ", "")}</div><div className="text-xs text-gray-500">{comp.latency}ms</div></div>
                        </div>
                        <StatusBadge status={comp.status} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><span className="w-5 h-5 text-cyan-400">{Icons.globe}</span>Vercel Platform</h3>
                  <div className="space-y-3">
                    {groups.vercel?.map((comp) => (
                      <div key={comp.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                        <div className="flex items-center gap-3">
                          <LiveDot status={comp.status} />
                          <div><div className="text-sm font-medium">{comp.name}</div><div className="text-xs text-gray-500">{comp.latency}ms</div></div>
                        </div>
                        <StatusBadge status={comp.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-center text-xs text-gray-600 py-4">
                Last updated: {new Date(health.timestamp).toLocaleString("tr-TR")} • Auto-refresh: {autoRefresh ? "ON" : "OFF"} (30s)
                <button onClick={() => setAutoRefresh(!autoRefresh)} className="ml-2 text-purple-400 hover:text-purple-300">[{autoRefresh ? "Pause" : "Resume"}]</button>
              </div>
            </div>
          ) : (<div className="text-center text-red-400 py-20">Failed to load network data</div>)}
        </main>
      </div>
    </>
  );
}
