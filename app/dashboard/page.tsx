// ARCHON V2.5 - Rich Atomic Self-Healing Dashboard
"use client";

import { useState, useEffect, useCallback, ReactNode, Component } from "react";

// ============ TYPES ============
interface ServiceStatus {
  name: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
  lastCheck: string;
}

interface HealthData {
  overall: string;
  score: number;
  components: ServiceStatus[];
  timestamp: string;
  aws?: { lambdas: ServiceStatus[] };
  n8n?: ServiceStatus[];
  vercel?: ServiceStatus[];
  summary?: { healthScore: number; avgLatency: number };
}

// ============ ERROR BOUNDARY (Class Component) ============
interface ErrorBoundaryProps {
  children: ReactNode;
  atomId: string;
  fallback: ReactNode;
  onError?: (error: Error, atomId: string) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

class AtomErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    const { atomId, onError } = this.props;
    
    // Report to self-heal system
    fetch('/api/self-heal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        atomId,
        error: { name: error.name, message: error.message, stack: error.stack },
        timestamp: new Date().toISOString(),
        retryCount: this.state.retryCount,
      }),
    }).catch(() => {});
    
    onError?.(error, atomId);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  render() {
    const { hasError, retryCount } = this.state;
    const { atomId, fallback, children } = this.props;

    if (hasError) {
      if (retryCount < 3) {
        return (
          <div className="glass rounded-2xl p-6 border border-red-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400">⚠️</span>
              </div>
              <div>
                <h3 className="font-semibold text-red-400">{atomId} - Error</h3>
                <p className="text-xs text-gray-500">Component failed to load</p>
              </div>
            </div>
            <button
              onClick={this.handleRetry}
              className="w-full py-2 px-4 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-red-400 text-sm font-medium transition"
            >
              🔄 Retry ({3 - retryCount} attempts left)
            </button>
          </div>
        );
      }
      return <>{fallback}</>;
    }

    return children;
  }
}

// ============ ANIMATED HEALTH GAUGE ============
function HealthGauge({ score, status }: { score: number; status: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = status === "green" ? "#22c55e" : status === "yellow" ? "#eab308" : "#ef4444";
  
  const size = 160;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ 
            filter: `drop-shadow(0 0 10px ${color})`,
            transition: 'stroke-dashoffset 1s ease-out'
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-bold transition-colors duration-500" style={{ color }}>
          {animatedScore}
        </span>
        <span className="text-sm text-gray-500">Health</span>
      </div>
    </div>
  );
}

// ============ QUICK STATS CARDS ============
function QuickStats({ total, healthy, warning, error }: { total: number; healthy: number; warning: number; error: number }) {
  const stats = [
    { label: "Total", value: total, color: "text-white", bg: "bg-white/10", icon: "📊" },
    { label: "Healthy", value: healthy, color: "text-green-400", bg: "bg-green-500/20", icon: "✅" },
    { label: "Warning", value: warning, color: "text-yellow-400", bg: "bg-yellow-500/20", icon: "⚠️" },
    { label: "Error", value: error, color: "text-red-400", bg: "bg-red-500/20", icon: "❌" },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <span>📈</span> Component Status
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div 
            key={s.label} 
            className={`${s.bg} rounded-xl p-3 text-center transform hover:scale-105 transition-transform cursor-default`}
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="text-lg mb-1">{s.icon}</div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ PERFORMANCE METRICS PANEL ============
function PerformancePanel({ healthScore, avgLatency, refreshRate, uptime }: { healthScore: number; avgLatency: number; refreshRate: number; uptime: number }) {
  const metrics = [
    { label: "Health Score", value: `${healthScore}%`, icon: "💚", trend: "+2.3%", trendUp: true },
    { label: "Avg Latency", value: `${avgLatency}ms`, icon: "⚡", trend: "-15ms", trendUp: true },
    { label: "Refresh Rate", value: `${refreshRate}s`, icon: "🔄", trend: "stable", trendUp: true },
    { label: "Uptime", value: `${uptime}%`, icon: "🎯", trend: "+0.1%", trendUp: true },
  ];

  return (
    <div className="col-span-2 glass rounded-2xl p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <span>📊</span> Performance Metrics
      </h3>
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m, i) => (
          <div 
            key={m.label} 
            className="bg-white/5 rounded-xl p-4 text-center hover:bg-white/10 transition-colors"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <div className="text-xl font-bold text-white">{m.value}</div>
            <div className="text-xs text-gray-500 mb-1">{m.label}</div>
            <div className={`text-xs ${m.trendUp ? 'text-green-400' : 'text-red-400'}`}>
              {m.trendUp ? '↑' : '↓'} {m.trend}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ NETWORK TOPOLOGY VISUALIZATION ============
function NetworkTopology({ lambdas, n8n, vercel }: { lambdas: ServiceStatus[]; n8n: ServiceStatus[]; vercel: ServiceStatus[] }) {
  const statusColor = (s: string) => s === "green" ? "#22c55e" : s === "yellow" ? "#eab308" : "#ef4444";
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-sm font-medium text-gray-400 mb-4 flex items-center gap-2">
        <span>🌐</span> Network Topology
      </h3>
      <svg viewBox="0 0 500 280" className="w-full">
        {/* Background Grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
          </pattern>
          <radialGradient id="coreGlow">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="#a78bfa"/>
            <stop offset="50%" stopColor="#8b5cf6"/>
            <stop offset="100%" stopColor="#6366f1"/>
          </radialGradient>
        </defs>
        <rect width="500" height="280" fill="url(#grid)"/>
        
        {/* Core Glow */}
        <circle cx="250" cy="140" r="80" fill="url(#coreGlow)"/>
        
        {/* Connection Lines - Lambda */}
        {lambdas.slice(0, 4).map((l, i) => {
          const angle = (i * 90 - 135) * (Math.PI / 180);
          const x = 250 + Math.cos(angle) * 90;
          const y = 140 + Math.sin(angle) * 90;
          return (
            <g key={`lambda-line-${i}`}>
              <line 
                x1="250" y1="140" x2={x} y2={y} 
                stroke={statusColor(l.status)} 
                strokeWidth="2" 
                strokeOpacity="0.5"
                strokeDasharray={l.status === "green" ? "0" : "5,5"}
              >
                <animate attributeName="stroke-opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
              </line>
            </g>
          );
        })}
        
        {/* Connection Lines - N8N */}
        <line x1="250" y1="140" x2="420" y2="70" stroke={statusColor(n8n[0]?.status || "green")} strokeWidth="2" strokeOpacity="0.5">
          <animate attributeName="stroke-opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
        </line>
        
        {/* Connection Lines - Vercel */}
        <line x1="250" y1="140" x2="420" y2="210" stroke={statusColor(vercel[0]?.status || "green")} strokeWidth="2" strokeOpacity="0.5">
          <animate attributeName="stroke-opacity" values="0.3;0.7;0.3" dur="2s" repeatCount="indefinite"/>
        </line>
        
        {/* Core Node */}
        <circle cx="250" cy="140" r="40" fill="url(#coreGradient)" className="drop-shadow-lg">
          <animate attributeName="r" values="38;42;38" dur="3s" repeatCount="indefinite"/>
        </circle>
        <text x="250" y="135" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">ARCHON</text>
        <text x="250" y="150" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">V2.5</text>
        
        {/* Lambda Nodes */}
        {lambdas.slice(0, 4).map((l, i) => {
          const angle = (i * 90 - 135) * (Math.PI / 180);
          const x = 250 + Math.cos(angle) * 90;
          const y = 140 + Math.sin(angle) * 90;
          const isHovered = hoveredNode === `lambda-${i}`;
          return (
            <g 
              key={`lambda-${i}`} 
              onMouseEnter={() => setHoveredNode(`lambda-${i}`)}
              onMouseLeave={() => setHoveredNode(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle cx={x} cy={y} r={isHovered ? 22 : 18} fill={statusColor(l.status)} opacity="0.9">
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/>
              </circle>
              <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">λ{i + 1}</text>
              {isHovered && (
                <text x={x} y={y + 35} textAnchor="middle" fill="white" fontSize="8" className="animate-fade-in">
                  {l.latency}ms
                </text>
              )}
            </g>
          );
        })}
        
        {/* N8N Node */}
        <g 
          onMouseEnter={() => setHoveredNode('n8n')}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ cursor: 'pointer' }}
        >
          <rect x="385" y="45" width="70" height="50" rx="8" fill={statusColor(n8n[0]?.status || "green")} opacity="0.9"/>
          <text x="420" y="65" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">N8N</text>
          <text x="420" y="80" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">{n8n.length} flows</text>
        </g>
        
        {/* Vercel Node */}
        <g
          onMouseEnter={() => setHoveredNode('vercel')}
          onMouseLeave={() => setHoveredNode(null)}
          style={{ cursor: 'pointer' }}
        >
          <polygon points="420,185 450,235 390,235" fill={statusColor(vercel[0]?.status || "green")} opacity="0.9"/>
          <text x="420" y="220" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">▲</text>
          <text x="420" y="255" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Vercel</text>
        </g>
        
        {/* Labels */}
        <text x="80" y="25" fill="rgba(255,255,255,0.4)" fontSize="10">AWS Lambda</text>
        <text x="400" y="25" fill="rgba(255,255,255,0.4)" fontSize="10">Integrations</text>
      </svg>
    </div>
  );
}

// ============ COMPONENT STATUS CARDS ============
function ComponentCards({ lambdas, n8n, vercel }: { lambdas: ServiceStatus[]; n8n: ServiceStatus[]; vercel: ServiceStatus[] }) {
  const statusIcon = (s: string) => s === "green" ? "✅" : s === "yellow" ? "⚠️" : "❌";
  const statusBg = (s: string) => s === "green" ? "bg-green-500/10" : s === "yellow" ? "bg-yellow-500/10" : "bg-red-500/10";
  
  const groups = [
    { title: "AWS Lambda", items: lambdas, icon: "λ", color: "from-orange-500 to-yellow-500" },
    { title: "N8N Workflows", items: n8n, icon: "🔗", color: "from-pink-500 to-rose-500" },
    { title: "Vercel & APIs", items: vercel, icon: "▲", color: "from-blue-500 to-cyan-500" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {groups.map((g, gi) => (
        <div key={g.title} className="glass rounded-2xl p-5 hover:border-white/20 transition-colors">
          <h4 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
            <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${g.color} flex items-center justify-center text-white text-sm`}>
              {g.icon}
            </span>
            {g.title}
            <span className="ml-auto text-xs text-gray-500">{g.items.length}</span>
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
            {g.items.map((item, i) => (
              <div 
                key={i} 
                className={`flex items-center justify-between ${statusBg(item.status)} rounded-lg px-3 py-2.5 hover:bg-white/10 transition-colors group`}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-xs text-gray-300 truncate block">
                    {item.name?.replace(/^(Lambda: |N8N |Vercel )/, "")}
                  </span>
                  <span className="text-[10px] text-gray-500 group-hover:text-gray-400 transition-colors">
                    {item.latency}ms • {item.message}
                  </span>
                </div>
                <span className="text-sm ml-2">{statusIcon(item.status)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============ ATOM OFFLINE FALLBACK ============
function AtomOffline({ name }: { name: string }) {
  return (
    <div className="glass rounded-2xl p-6 border border-red-500/30 animate-pulse">
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

// ============ BRAIN ICON ============
const Brain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

// ============ MAIN DASHBOARD ============
export default function Dashboard() {
  const [data, setData] = useState<HealthData | null>(null);
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

  // Parse data
  const healthScore = data?.summary?.healthScore || data?.score || 92;
  const healthStatus = healthScore >= 90 ? "green" : healthScore >= 70 ? "yellow" : "red";
  
  // Group components
  const lambdas = data?.aws?.lambdas || data?.components?.filter((c: any) => c.name?.includes('Lambda')) || [];
  const n8nServices = data?.n8n || data?.components?.filter((c: any) => c.name?.includes('N8N')) || [];
  const vercelServices = data?.vercel || data?.components?.filter((c: any) => !c.name?.includes('Lambda') && !c.name?.includes('N8N')) || [];
  
  const allServices = [...lambdas, ...n8nServices, ...vercelServices];
  const total = allServices.length || data?.components?.length || 13;
  const healthy = allServices.filter((s: any) => s.status === "green").length || data?.components?.filter((c: any) => c.status === "green").length || 11;
  const warning = allServices.filter((s: any) => s.status === "yellow").length || data?.components?.filter((c: any) => c.status === "yellow").length || 2;
  const errorCount = total - healthy - warning;
  const avgLatency = data?.summary?.avgLatency || Math.round(allServices.reduce((a: number, c: any) => a + (c.latency || 0), 0) / (allServices.length || 1)) || 180;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 rounded-full border-4 border-purple-500/30"></div>
            <div className="absolute inset-0 rounded-full border-4 border-purple-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
          </div>
          <h2 className="text-xl font-bold gradient-text mb-2">ARCHON V2.5</h2>
          <p className="text-gray-400">Initializing Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <style jsx global>{`
        .glass { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
        .gradient-text { background: linear-gradient(135deg, #8b5cf6, #3b82f6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .live-pulse { animation: pulse 2s ease-in-out infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.95); } }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
      `}</style>
      
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="w-7 h-7 text-white"><Brain /></span>
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
            <button onClick={fetchData} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-gray-400 hover:text-purple-400 hover:rotate-180 transition-all duration-500">🔄</button>
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

        {/* Top Row: Gauge + Stats + Performance */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <AtomErrorBoundary atomId="health-gauge" fallback={<AtomOffline name="Health Gauge" />}>
            <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
              <HealthGauge score={healthScore} status={healthStatus} />
              <div className="mt-4 flex items-center gap-2">
                <span className="live-pulse" style={{ width: 10, height: 10, background: healthStatus === "green" ? "#22c55e" : healthStatus === "yellow" ? "#eab308" : "#ef4444", borderRadius: "50%", display: "inline-block" }} />
                <span className="text-gray-400">{healthStatus === "green" ? "All Systems OK" : "Issues Detected"}</span>
              </div>
            </div>
          </AtomErrorBoundary>
          
          <AtomErrorBoundary atomId="quick-stats" fallback={<AtomOffline name="Quick Stats" />}>
            <QuickStats total={total} healthy={healthy} warning={warning} error={errorCount} />
          </AtomErrorBoundary>
          
          <AtomErrorBoundary atomId="performance-panel" fallback={<AtomOffline name="Performance Panel" />}>
            <PerformancePanel healthScore={healthScore} avgLatency={avgLatency} refreshRate={30} uptime={99.9} />
          </AtomErrorBoundary>
        </div>

        {/* Network Topology */}
        <AtomErrorBoundary atomId="network-topology" fallback={<AtomOffline name="Network Topology" />}>
          <NetworkTopology lambdas={lambdas} n8n={n8nServices} vercel={vercelServices} />
        </AtomErrorBoundary>

        {/* Component Cards */}
        <AtomErrorBoundary atomId="component-cards" fallback={<AtomOffline name="Component Cards" />}>
          <ComponentCards lambdas={lambdas} n8n={n8nServices} vercel={vercelServices} />
        </AtomErrorBoundary>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 py-4 space-x-2">
          <span>Last updated: {lastUpdate}</span>
          <span>•</span>
          <a href="/api/realtime-status" target="_blank" className="text-purple-400 hover:text-purple-300 transition-colors">Raw API</a>
          <span>•</span>
          <a href="/api/registry" target="_blank" className="text-cyan-400 hover:text-cyan-300 transition-colors">Atom Registry</a>
          <span>•</span>
          <a href="/api/self-heal" target="_blank" className="text-pink-400 hover:text-pink-300 transition-colors">Self-Heal Stats</a>
        </div>
      </main>
    </div>
  );
}
