"use client";

import { useState, useEffect, useCallback } from "react";

// Types
interface ServiceStatus {
  name: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
  lastCheck?: string;
}

interface HealthData {
  overall: string;
  score: number;
  components: ServiceStatus[];
  timestamp: string;
}

// Icons
const Icons = {
  overview: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M12 2a10 10 0 1 0 10 10H12V2Z" /><path d="M12 12 2.1 9.3" /><path d="m12 12 7.8-7.8" />
    </svg>
  ),
  connections: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
      <path d="M8.6 13.5 15.4 18" /><path d="m8.6 10.5 6.8-4.5" />
    </svg>
  ),
  n8n: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 8v8" /><path d="m8 12 4-4 4 4" />
    </svg>
  ),
  lambda: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <path d="M4 20h16" /><path d="m6 16 6-12 6 12" /><path d="M8 12h8" />
    </svg>
  ),
  vercel: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 2L2 19.5h20L12 2z" />
    </svg>
  ),
  all: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
      <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
    </svg>
  ),
  refresh: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" /><path d="M12 17h.01" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
    </svg>
  ),
};

// Menu items
const menuItems = [
  { id: "overview", label: "Overview", icon: Icons.overview },
  { id: "network", label: "Network Status", icon: Icons.network },
  { id: "connections", label: "Connections", icon: Icons.connections },
  { id: "n8n", label: "N8N", icon: Icons.n8n, count: 17 },
  { id: "lambdas", label: "Lambdas", icon: Icons.lambda, count: 4 },
  { id: "vercel", label: "Vercel", icon: Icons.vercel },
  { id: "all", label: "All", icon: Icons.all, count: 63 },
];

// Status helpers
const statusColor = (s: string) => s === "green" ? "#22c55e" : s === "yellow" ? "#eab308" : "#ef4444";
const statusBg = (s: string) => s === "green" ? "bg-emerald-500/20" : s === "yellow" ? "bg-amber-500/20" : "bg-red-500/20";
const statusText = (s: string) => s === "green" ? "text-emerald-400" : s === "yellow" ? "text-amber-400" : "text-red-400";
const statusIcon = (s: string) => s === "green" ? Icons.check : s === "yellow" ? Icons.alert : Icons.error;

// Animated counter
const AnimatedNumber = ({ value, suffix = "" }: { value: number; suffix?: string }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}{suffix}</>;
};

// Mini sparkline chart
const Sparkline = ({ data, color }: { data: number[]; color: string }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80}`).join(" ");
  return (
    <svg viewBox="0 0 100 40" className="w-24 h-8">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="100" cy={100 - ((data[data.length - 1] - min) / range) * 80} r="3" fill={color} />
    </svg>
  );
};

// Circular progress
const CircularProgress = ({ value, size = 120, strokeWidth = 8, color }: { value: number; size?: number; strokeWidth?: number; color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1s ease-out", filter: `drop-shadow(0 0 8px ${color})` }} />
    </svg>
  );
};

// Main Dashboard Component
export default function Dashboard() {
  const [activeMenu, setActiveMenu] = useState("overview");
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/realtime-status", { cache: "no-store" });
      if (!res.ok) throw new Error("API error");
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date().toLocaleTimeString("tr-TR"));
    } catch (e) {
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
  const healthScore = data?.score || 92;
  const healthStatus = healthScore >= 90 ? "green" : healthScore >= 70 ? "yellow" : "red";
  const allComponents = data?.components || [];
  const lambdas = allComponents.filter((c) => c.name?.includes("Lambda"));
  const n8nServices = allComponents.filter((c) => c.name?.includes("N8N"));
  const vercelServices = allComponents.filter((c) => !c.name?.includes("Lambda") && !c.name?.includes("N8N"));
  const healthy = allComponents.filter((c) => c.status === "green").length;
  const warning = allComponents.filter((c) => c.status === "yellow").length;
  const errorCount = allComponents.length - healthy - warning;
  const avgLatency = allComponents.length ? Math.round(allComponents.reduce((a, c) => a + (c.latency || 0), 0) / allComponents.length) : 0;

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30" />
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin" />
          </div>
          <p className="text-gray-400">Loading ARCHON...</p>
        </div>
      </div>
    );
  }

  // Content renderers for each section
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Health Score", value: healthScore, suffix: "%", color: statusColor(healthStatus), icon: "💚" },
          { label: "Active Services", value: allComponents.length, color: "#8b5cf6", icon: "🔌" },
          { label: "Avg Latency", value: avgLatency, suffix: "ms", color: "#3b82f6", icon: "⚡" },
          { label: "Uptime", value: 99.9, suffix: "%", color: "#06b6d4", icon: "🎯" },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5 relative overflow-hidden group hover:border-white/20 transition-all">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold" style={{ color: stat.color }}>
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </p>
              </div>
              <span className="text-2xl opacity-50 group-hover:opacity-100 transition-opacity">{stat.icon}</span>
            </div>
            <div className="mt-3">
              <Sparkline data={[65, 72, 68, 85, 78, 90, 88, 92, stat.value]} color={stat.color} />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Health Gauge */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
          <div className="relative">
            <CircularProgress value={healthScore} size={160} color={statusColor(healthStatus)} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold" style={{ color: statusColor(healthStatus) }}>{healthScore}</span>
              <span className="text-sm text-gray-500">Health</span>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor(healthStatus) }} />
            <span className="text-gray-400 text-sm">{healthStatus === "green" ? "All Systems Operational" : "Issues Detected"}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 w-full">
            {[
              { label: "Healthy", value: healthy, color: "emerald" },
              { label: "Warning", value: warning, color: "amber" },
              { label: "Error", value: errorCount, color: "red" },
            ].map((s) => (
              <div key={s.label} className={`bg-${s.color}-500/20 rounded-xl p-2 text-center`}>
                <p className={`text-lg font-bold text-${s.color}-400`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Activity
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
            {allComponents.slice(0, 8).map((c, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl ${statusBg(c.status)} hover:bg-white/10 transition-colors`}>
                <div className={`w-8 h-8 rounded-lg ${statusBg(c.status)} flex items-center justify-center ${statusText(c.status)}`}>
                  {statusIcon(c.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.latency}ms • {c.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions & Info */}
        <div className="space-y-4">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">System Info</h3>
            <div className="space-y-3">
              {[
                { label: "Version", value: "V2.5 Atomic" },
                { label: "Environment", value: "Production" },
                { label: "Region", value: "us-east-1" },
                { label: "Last Deploy", value: "2 hours ago" },
              ].map((info) => (
                <div key={info.label} className="flex justify-between items-center py-2 border-b border-white/5">
                  <span className="text-gray-500 text-sm">{info.label}</span>
                  <span className="text-white text-sm font-medium">{info.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-gray-400 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Refresh", icon: "🔄", action: fetchData },
                { label: "Export", icon: "📊" },
                { label: "Logs", icon: "📋" },
                { label: "Settings", icon: "⚙️" },
              ].map((btn) => (
                <button
                  key={btn.label}
                  onClick={btn.action}
                  className="flex items-center gap-2 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm"
                >
                  <span>{btn.icon}</span>
                  <span className="text-gray-300">{btn.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderNetwork = () => (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Network Topology</h3>
        <svg viewBox="0 0 800 400" className="w-full">
          <defs>
            <radialGradient id="coreGlow"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></radialGradient>
            <radialGradient id="nodeGradient"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#6366f1"/></radialGradient>
            <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          
          {/* Background grid */}
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
          </pattern>
          <rect width="800" height="400" fill="url(#grid)"/>
          
          {/* Central glow */}
          <circle cx="400" cy="200" r="120" fill="url(#coreGlow)"/>
          
          {/* Connection lines with animation */}
          {lambdas.map((_, i) => {
            const angle = (i * 90 + 45) * (Math.PI / 180);
            const x = 400 + Math.cos(angle) * 140;
            const y = 200 + Math.sin(angle) * 140;
            return (
              <g key={`conn-${i}`}>
                <line x1="400" y1="200" x2={x} y2={y} stroke="#22c55e" strokeWidth="2" opacity="0.5" strokeDasharray="5,5">
                  <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite"/>
                </line>
              </g>
            );
          })}
          
          {/* N8N connection */}
          <line x1="400" y1="200" x2="650" y2="100" stroke="#f472b6" strokeWidth="2" opacity="0.5" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite"/>
          </line>
          
          {/* Vercel connection */}
          <line x1="400" y1="200" x2="650" y2="300" stroke="#3b82f6" strokeWidth="2" opacity="0.5" strokeDasharray="5,5">
            <animate attributeName="stroke-dashoffset" from="10" to="0" dur="1s" repeatCount="indefinite"/>
          </line>
          
          {/* Core node */}
          <g filter="url(#glow)">
            <circle cx="400" cy="200" r="50" fill="url(#nodeGradient)">
              <animate attributeName="r" values="48;52;48" dur="2s" repeatCount="indefinite"/>
            </circle>
          </g>
          <text x="400" y="195" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">ARCHON</text>
          <text x="400" y="212" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">Core Engine</text>
          
          {/* Lambda nodes */}
          {lambdas.map((l, i) => {
            const angle = (i * 90 + 45) * (Math.PI / 180);
            const x = 400 + Math.cos(angle) * 140;
            const y = 200 + Math.sin(angle) * 140;
            return (
              <g key={`lambda-${i}`}>
                <circle cx={x} cy={y} r="30" fill={statusColor(l.status)} opacity="0.9" filter="url(#glow)"/>
                <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">λ{i+1}</text>
                <text x={x} y={y + 45} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">{l.latency}ms</text>
              </g>
            );
          })}
          
          {/* N8N node */}
          <g>
            <rect x="610" y="65" width="80" height="70" rx="12" fill={statusColor(n8nServices[0]?.status || "green")} opacity="0.9" filter="url(#glow)"/>
            <text x="650" y="95" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">N8N</text>
            <text x="650" y="115" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="10">{n8nServices.length} workflows</text>
          </g>
          
          {/* Vercel node */}
          <g>
            <polygon points="650,260 690,330 610,330" fill={statusColor(vercelServices[0]?.status || "green")} opacity="0.9" filter="url(#glow)"/>
            <text x="650" y="310" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">▲</text>
            <text x="650" y="355" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">Vercel Edge</text>
          </g>
          
          {/* Labels */}
          <text x="100" y="50" fill="rgba(255,255,255,0.4)" fontSize="12">AWS Lambda Functions</text>
          <text x="600" y="50" fill="rgba(255,255,255,0.4)" fontSize="12">Integrations</text>
        </svg>
      </div>
      
      {/* Network Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Requests", value: "1.2M", trend: "+12%", icon: "📈" },
          { label: "Bandwidth", value: "45 GB", trend: "+8%", icon: "📊" },
          { label: "Active Connections", value: "342", trend: "+5%", icon: "🔗" },
          { label: "Error Rate", value: "0.02%", trend: "-15%", icon: "⚠️" },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className="text-emerald-400 text-xs">{stat.trend}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-sm text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderConnections = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Active Connections</h3>
          <div className="space-y-4">
            {[
              { from: "Frontend", to: "API Gateway", status: "green", latency: 12 },
              { from: "API Gateway", to: "Lambda Brain", status: "green", latency: 45 },
              { from: "Lambda Brain", to: "DynamoDB", status: "green", latency: 8 },
              { from: "N8N", to: "Webhooks", status: "yellow", latency: 156 },
              { from: "Vercel", to: "Edge Functions", status: "green", latency: 23 },
            ].map((conn, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{conn.from}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-white font-medium">{conn.to}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-400 text-sm">{conn.latency}ms</span>
                  <span className={`w-2 h-2 rounded-full ${conn.status === "green" ? "bg-emerald-500" : "bg-amber-500"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Connection Matrix</h3>
          <div className="grid grid-cols-4 gap-2">
            {Array(16).fill(0).map((_, i) => {
              const intensity = Math.random();
              return (
                <div
                  key={i}
                  className="aspect-square rounded-lg transition-all hover:scale-110"
                  style={{ background: `rgba(139, 92, 246, ${intensity * 0.8})` }}
                  title={`Connection ${i + 1}: ${Math.round(intensity * 100)}%`}
                />
              );
            })}
          </div>
          <div className="mt-4 flex justify-between text-xs text-gray-500">
            <span>Low traffic</span>
            <span>High traffic</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderN8N = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Active Workflows", value: n8nServices.length, icon: "🔄", color: "purple" },
          { label: "Executions Today", value: 1247, icon: "▶️", color: "blue" },
          { label: "Success Rate", value: "99.2%", icon: "✅", color: "emerald" },
        ].map((stat, i) => (
          <div key={i} className={`glass rounded-2xl p-5 border-l-4 border-${stat.color}-500`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Workflows</h3>
        <div className="space-y-3">
          {n8nServices.map((service, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${statusBg(service.status)} hover:bg-white/10 transition-colors`}>
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${statusBg(service.status)} flex items-center justify-center ${statusText(service.status)}`}>
                  {statusIcon(service.status)}
                </div>
                <div>
                  <p className="text-white font-medium">{service.name}</p>
                  <p className="text-sm text-gray-500">{service.message}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{service.latency}ms</p>
                <p className="text-xs text-gray-500">latency</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderLambdas = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4 mb-6">
        {lambdas.map((lambda, i) => (
          <div key={i} className={`glass rounded-2xl p-5 ${statusBg(lambda.status)} border border-white/10`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xl font-bold`}>
                λ{i + 1}
              </div>
              <span className={`w-3 h-3 rounded-full ${lambda.status === "green" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
            </div>
            <p className="text-white font-medium truncate">{lambda.name.replace("Lambda: ", "")}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-gray-500 text-sm">{lambda.latency}ms</span>
              <span className={`text-xs px-2 py-1 rounded-full ${statusBg(lambda.status)} ${statusText(lambda.status)}`}>
                {lambda.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Lambda Performance</h3>
        <div className="h-48 flex items-end gap-2">
          {lambdas.map((lambda, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div 
                className="w-full bg-gradient-to-t from-orange-500 to-amber-400 rounded-t-lg transition-all hover:opacity-80"
                style={{ height: `${Math.min(lambda.latency, 200)}px` }}
              />
              <span className="text-xs text-gray-500">λ{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderVercel = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Deployments", value: 156, icon: "🚀" },
          { label: "Edge Functions", value: 12, icon: "⚡" },
          { label: "Domains", value: 3, icon: "🌐" },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{stat.icon}</span>
              <div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="glass rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Vercel Services</h3>
        <div className="space-y-3">
          {vercelServices.map((service, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${statusBg(service.status)} hover:bg-white/10 transition-colors`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white">
                  ▲
                </div>
                <div>
                  <p className="text-white font-medium">{service.name}</p>
                  <p className="text-sm text-gray-500">{service.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400">{service.latency}ms</span>
                <span className={`w-2 h-2 rounded-full ${service.status === "green" ? "bg-emerald-500" : "bg-amber-500"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAll = () => (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">All Components ({allComponents.length})</h3>
          <div className="flex gap-2">
            {["all", "green", "yellow", "red"].map((filter) => (
              <button key={filter} className={`px-3 py-1 rounded-lg text-xs ${filter === "all" ? "bg-purple-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"}`}>
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {allComponents.map((comp, i) => (
            <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${statusBg(comp.status)} hover:bg-white/10 transition-colors`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${statusBg(comp.status)} flex items-center justify-center ${statusText(comp.status)}`}>
                  {statusIcon(comp.status)}
                </div>
                <div>
                  <p className="text-white text-sm font-medium truncate max-w-[200px]">{comp.name}</p>
                  <p className="text-xs text-gray-500">{comp.message}</p>
                </div>
              </div>
              <span className="text-gray-400 text-sm">{comp.latency}ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Content router
  const renderContent = () => {
    switch (activeMenu) {
      case "overview": return renderOverview();
      case "network": return renderNetwork();
      case "connections": return renderConnections();
      case "n8n": return renderN8N();
      case "lambdas": return renderLambdas();
      case "vercel": return renderVercel();
      case "all": return renderAll();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-20" : "w-64"} bg-[#0d0d14] border-r border-white/10 flex flex-col transition-all duration-300`}>
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              {Icons.brain}
            </div>
            {!sidebarCollapsed && (
              <div>
                <h1 className="font-bold text-lg bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">ARCHON</h1>
                <p className="text-xs text-gray-500">V2.5 Atomic</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeMenu === item.id
                  ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white border border-purple-500/30"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={activeMenu === item.id ? "text-purple-400" : ""}>{item.icon}</span>
              {!sidebarCollapsed && (
                <>
                  <span className="flex-1 text-left text-sm">{item.label}</span>
                  {item.count && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeMenu === item.id ? "bg-purple-500/30 text-purple-300" : "bg-white/10 text-gray-500"}`}>
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </nav>
        
        {/* Collapse button */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-sm transition-colors"
          >
            {sidebarCollapsed ? "→" : "← Collapse"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center justify-between px-6">
          <div>
            <h2 className="text-xl font-semibold text-white capitalize">{activeMenu.replace("-", " ")}</h2>
            <p className="text-sm text-gray-500">Real-time monitoring & analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${statusBg(healthStatus)}`}>
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: statusColor(healthStatus) }} />
              <span className={`font-bold ${statusText(healthStatus)}`}>{healthScore}%</span>
            </div>
            <span className="text-sm text-gray-500">{lastUpdate}</span>
            <button onClick={fetchData} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
              {Icons.refresh}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          {renderContent()}
        </main>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        .glass { background: rgba(255,255,255,0.03); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
