"use client";

import { useState, useEffect } from "react";

interface Comp { name: string; status: "green" | "yellow" | "red"; latency: number; message: string; }
interface Health { overall: "green" | "yellow" | "red"; score: number; components: Comp[]; timestamp: string; }

const Brain = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const Server = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>;
const Flow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>;
const Activity = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const Globe = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg>;
const Cpu = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 5h3M1 9h3m-3 5h3"/></svg>;
const Wifi = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M5 12.55a11 11 0 0 1 14.08 0m-17.66-3.55a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>;
const Refresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0-5v5h-5m5 4a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m0 5v-5h5"/></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><polyline points="20 6 9 17 4 12"/></svg>;
const AlertT = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1"/></svg>;
const XIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const Dot = ({ s = "green", sz = 8 }: { s?: string; sz?: number }) => {
  const c: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  return <span className={s === "green" ? "live-pulse" : ""} style={{ width: sz, height: sz, background: c[s] || c.green, borderRadius: "50%", display: "inline-block" }} />;
};

const Badge = ({ s }: { s: "green" | "yellow" | "red" }) => {
  const m: Record<string, { c: string; l: string; I: React.FC }> = {
    green: { c: "bg-green-500/20 text-green-400 border-green-500/40", l: "OK", I: Check },
    yellow: { c: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", l: "Warn", I: AlertT },
    red: { c: "bg-red-500/20 text-red-400 border-red-500/40", l: "Err", I: XIcon },
  };
  const { c, l, I } = m[s];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${c}`}><span className="w-3 h-3"><I /></span>{l}</span>;
};

const Gauge = ({ v, c }: { v: number; c: string }) => {
  const sz = 140, sw = 10, r = (sz - sw) / 2, circ = r * 2 * Math.PI, off = circ - (v / 100) * circ;
  return (
    <div className="relative" style={{ width: sz, height: sz }}>
      <svg className="-rotate-90" width={sz} height={sz}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={sw} />
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={c} strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" className="transition-all duration-1000" style={{ filter: `drop-shadow(0 0 8px ${c})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color: c }}>{v}</span>
        <span className="text-xs text-gray-500">Health</span>
      </div>
    </div>
  );
};

const Spark = ({ d, c }: { d: number[]; c: string }) => {
  const h = 50, w = 120, mx = Math.max(...d), mn = Math.min(...d), rg = mx - mn || 1;
  const p = d.map((v, i) => `${(i / (d.length - 1)) * w},${h - ((v - mn) / rg) * h}`).join(" ");
  return (
    <svg width={w} height={h}>
      <defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={c} stopOpacity="0.3" /><stop offset="100%" stopColor={c} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${p} ${w},${h}`} fill="url(#sg)" />
      <polyline points={p} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx={w} cy={h - ((d[d.length-1] - mn) / rg) * h} r="4" fill={c} />
    </svg>
  );
};

const Node = ({ n, s, I, x, y }: { n: string; s: string; I: React.FC; x: string; y: string }) => {
  const bg: Record<string, string> = { green: "from-green-500/30 to-green-600/10 border-green-500/50", yellow: "from-yellow-500/30 to-yellow-600/10 border-yellow-500/50", red: "from-red-500/30 to-red-600/10 border-red-500/50" };
  return (
    <div className="absolute flex flex-col items-center hover:scale-110 transition cursor-pointer z-10" style={{ left: x, top: y, transform: "translate(-50%,-50%)" }}>
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${bg[s]} border flex items-center justify-center backdrop-blur-sm`}><span className="w-6 h-6 text-white"><I /></span></div>
      <span className="text-xs text-gray-400 mt-1 font-medium">{n}</span>
      <Dot s={s} sz={6} />
    </div>
  );
};

export default function Dashboard() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState("");
  const [spark, setSpark] = useState([85, 87, 86, 88, 90, 89, 92, 91, 93, 92]);

  useEffect(() => {
    let mounted = true;
    
    const load = async () => {
      try {
        const r = await fetch("/api/realtime-status", { cache: "no-store" });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const d = await r.json();
        if (mounted) {
          setHealth(d);
          setTime(new Date().toLocaleTimeString("tr-TR"));
          setSpark(p => [...p.slice(1), d.score]);
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e.message || "Failed to load");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    load();
    const i = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(i); };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !health) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="glass p-8 rounded-2xl text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="w-8 h-8 text-red-400"><XIcon /></span>
          </div>
          <p className="text-red-400 font-medium mb-2">Failed to load dashboard</p>
          <p className="text-gray-500 text-sm mb-4">{error || "Unknown error"}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl text-purple-400 text-sm font-medium transition">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const g = health.components.reduce((a, c) => {
    const k = c.name.includes("Lambda") ? "l" : c.name.includes("N8N") ? "n" : "v";
    (a[k] = a[k] || []).push(c); return a;
  }, {} as Record<string, Comp[]>);

  const col: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="w-6 h-6 text-white"><Brain /></span>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">ARCHON V2.5</h1>
              <p className="text-xs text-gray-500">Real-time Network Monitor</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${health.overall === "green" ? "bg-green-500/20" : health.overall === "yellow" ? "bg-yellow-500/20" : "bg-red-500/20"}`}>
              <Dot s={health.overall} />
              <span className={`text-sm font-bold ${health.overall === "green" ? "text-green-400" : health.overall === "yellow" ? "text-yellow-400" : "text-red-400"}`}>{health.score}%</span>
            </div>
            <span className="text-xs text-gray-500">{time}</span>
            <button onClick={() => window.location.reload()} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition">
              <span className="w-5 h-5 text-gray-400 block"><Refresh /></span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Top Row */}
        <div className="grid grid-cols-4 gap-6">
          {/* Gauge */}
          <div className="glass rounded-2xl p-6 flex flex-col items-center justify-center">
            <Gauge v={health.score} c={col[health.overall]} />
            <div className="mt-4 flex items-center gap-2">
              <Dot s={health.overall} />
              <span className="text-sm text-gray-400">{health.overall === "green" ? "All Systems OK" : "Issues Detected"}</span>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <span className="w-4 h-4 text-cyan-400"><Activity /></span>Quick Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { l: "Total", v: health.components.length, c: "text-blue-400", bg: "bg-blue-500/20" },
                { l: "Healthy", v: health.components.filter(c => c.status === "green").length, c: "text-green-400", bg: "bg-green-500/20" },
                { l: "Warning", v: health.components.filter(c => c.status === "yellow").length, c: "text-yellow-400", bg: "bg-yellow-500/20" },
                { l: "Error", v: health.components.filter(c => c.status === "red").length, c: "text-red-400", bg: "bg-red-500/20" },
              ].map((s, i) => (
                <div key={i} className={`rounded-xl p-3 text-center ${s.bg}`}>
                  <div className={`text-2xl font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-xs text-gray-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trend */}
          <div className="col-span-2 glass rounded-2xl p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <span className="w-4 h-4 text-green-400"><Activity /></span>Performance Trend
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-bold" style={{ color: col[health.overall] }}>{health.score}%</div>
                <div className="text-xs text-gray-500">Current Score</div>
              </div>
              <Spark d={spark} c={col[health.overall]} />
              <div className="text-right">
                <div className="text-2xl font-semibold">{Math.round(health.components.reduce((a, c) => a + c.latency, 0) / health.components.length)}ms</div>
                <div className="text-xs text-gray-500">Avg Latency</div>
              </div>
            </div>
          </div>
        </div>

        {/* Network Topology */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span className="w-4 h-4 text-purple-400"><Wifi /></span>Network Topology
          </h3>
          <div className="relative h-64 rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.05))" }}>
            {/* Connection Lines */}
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.5" />
                </linearGradient>
              </defs>
              {["15%", "38%", "62%", "85%"].map((x, i) => (
                <line key={`t${i}`} x1="50%" y1="50%" x2={x} y2="18%" stroke="url(#lg)" strokeWidth="2" className="conn-line" />
              ))}
              {["25%", "50%", "75%"].map((x, i) => (
                <line key={`b${i}`} x1="50%" y1="50%" x2={x} y2="82%" stroke="url(#lg)" strokeWidth="2" className="conn-line" />
              ))}
            </svg>

            {/* Core */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-500/40 core-pulse">
                <span className="w-8 h-8 text-white"><Brain /></span>
              </div>
              <div className="text-center mt-2">
                <span className="text-sm font-bold">ARCHON</span>
              </div>
            </div>

            {/* Lambda Nodes */}
            {g.l?.map((c, i) => (
              <Node key={c.name} n={c.name.replace("Lambda: ", "")} s={c.status} I={Cpu} x={["15%", "38%", "62%", "85%"][i]} y="18%" />
            ))}

            {/* Service Nodes */}
            <Node n="Vercel" s={g.v?.[0]?.status || "green"} I={Globe} x="25%" y="82%" />
            <Node n="AI Chat" s={g.v?.find(c => c.name.includes("AI"))?.status || "yellow"} I={Brain} x="50%" y="82%" />
            <Node n="N8N" s={g.n?.[0]?.status || "green"} I={Flow} x="75%" y="82%" />
          </div>
        </div>

        {/* Component Cards */}
        <div className="grid grid-cols-3 gap-6">
          {[
            { t: "AWS Lambda", I: Server, c: "text-blue-400", d: g.l },
            { t: "N8N Workflows", I: Flow, c: "text-orange-400", d: g.n },
            { t: "Vercel Platform", I: Globe, c: "text-cyan-400", d: g.v },
          ].map(({ t, I, c, d }) => (
            <div key={t} className="glass rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className={`w-4 h-4 ${c}`}><I /></span>{t}
              </h3>
              <div className="space-y-2">
                {d?.map(x => (
                  <div key={x.name} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
                    <div className="flex items-center gap-3">
                      <Dot s={x.status} />
                      <div>
                        <div className="text-sm font-medium">{x.name.replace("Lambda: ", "").replace("N8N ", "").replace("Webhook: ", "")}</div>
                        <div className="text-xs text-gray-500">{x.latency}ms</div>
                      </div>
                    </div>
                    <Badge s={x.status} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-600 py-4">
          Last updated: {new Date(health.timestamp).toLocaleString("tr-TR")} • 
          <a href="/api/realtime-status" target="_blank" className="text-purple-400 hover:text-purple-300 ml-1">View API</a>
        </div>
      </main>
    </div>
  );
}
