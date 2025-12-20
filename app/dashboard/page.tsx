"use client";

import { useState, useEffect, Suspense } from "react";

// Types
interface Comp { name: string; status: "green" | "yellow" | "red"; latency: number; message: string; }
interface Health { overall: "green" | "yellow" | "red"; score: number; components: Comp[]; timestamp: string; }

// Icons
const Brain = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>;
const Server = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/><circle cx="6" cy="6" r="1"/><circle cx="6" cy="18" r="1"/></svg>;
const Flow = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="8" height="8" x="3" y="3" rx="2"/><path d="M7 11v4a2 2 0 0 0 2 2h4"/><rect width="8" height="8" x="13" y="13" rx="2"/></svg>;
const Activity = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
const Globe = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/></svg>;
const Cpu = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><path d="M9 1v3m6-3v3M9 20v3m6-3v3M20 9h3m-3 5h3M1 9h3m-3 5h3"/></svg>;
const Wifi = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12.55a11 11 0 0 1 14.08 0m-17.66-3.55a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1"/></svg>;
const Refresh = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8m0-5v5h-5m5 4a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16m0 5v-5h5"/></svg>;
const Check = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>;
const AlertT = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><circle cx="12" cy="17" r="1"/></svg>;
const X = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;

const Dot = ({ s = "green", sz = 8 }: { s?: string; sz?: number }) => {
  const c: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };
  return <span className={s === "green" ? "live-pulse" : ""} style={{ width: sz, height: sz, background: c[s] || c.green, borderRadius: "50%", display: "inline-block" }} />;
};

const Badge = ({ s }: { s: "green" | "yellow" | "red" }) => {
  const m: Record<string, { c: string; l: string; I: React.FC }> = {
    green: { c: "bg-green-500/20 text-green-400 border-green-500/40", l: "OK", I: Check },
    yellow: { c: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40", l: "Warn", I: AlertT },
    red: { c: "bg-red-500/20 text-red-400 border-red-500/40", l: "Err", I: X },
  };
  const { c, l, I } = m[s];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full border ${c}`}><span className="w-3 h-3"><I /></span>{l}</span>;
};

const Gauge = ({ v, c }: { v: number; c: string }) => {
  const sz = 120, sw = 8, r = (sz - sw) / 2, circ = r * 2 * Math.PI, off = circ - (v / 100) * circ;
  return (
    <div className="relative" style={{ width: sz, height: sz }}>
      <svg className="-rotate-90" width={sz} height={sz}>
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={sw} />
        <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={c} strokeWidth={sw} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset 1s", filter: `drop-shadow(0 0 6px ${c})` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color: c }}>{v}</span>
        <span className="text-xs text-gray-500">Score</span>
      </div>
    </div>
  );
};

const Spark = ({ d, c }: { d: number[]; c: string }) => {
  const h = 40, w = 100, mx = Math.max(...d), mn = Math.min(...d), rg = mx - mn || 1;
  const p = d.map((v, i) => `${(i / (d.length - 1)) * w},${h - ((v - mn) / rg) * h}`).join(" ");
  return (
    <svg width={w} height={h}>
      <defs><linearGradient id="sg" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor={c} stopOpacity="0.3" /><stop offset="100%" stopColor={c} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${h} ${p} ${w},${h}`} fill="url(#sg)" />
      <polyline points={p} fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx={w} cy={h - ((d[d.length-1] - mn) / rg) * h} r="3" fill={c} />
    </svg>
  );
};

const Node = ({ n, s, I, x, y }: { n: string; s: string; I: React.FC; x: string; y: string }) => {
  const bg: Record<string, string> = { green: "from-green-500/30 to-green-600/10 border-green-500/50", yellow: "from-yellow-500/30 to-yellow-600/10 border-yellow-500/50", red: "from-red-500/30 to-red-600/10 border-red-500/50" };
  return (
    <div className="absolute flex flex-col items-center hover:scale-110 transition z-10" style={{ left: x, top: y, transform: "translate(-50%,-50%)" }}>
      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${bg[s]} border flex items-center justify-center`}><span className="w-5 h-5 text-white"><I /></span></div>
      <span className="text-[10px] text-gray-400 mt-1">{n}</span>
      <Dot s={s} sz={4} />
    </div>
  );
};

// Main component - no SSR
function DashboardInner() {
  const [health, setHealth] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState("");
  const [spark, setSpark] = useState([85, 87, 86, 88, 90, 89, 92, 91, 93, 92]);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch("/api/realtime-status");
        if (r.ok) {
          const d = await r.json();
          setHealth(d);
          setTime(new Date().toLocaleTimeString("tr-TR"));
          setSpark(p => [...p.slice(1), d.score]);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
    const i = setInterval(load, 30000);
    return () => clearInterval(i);
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center"><div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p className="text-gray-400 text-sm">Loading dashboard...</p></div>
    </div>
  );

  if (!health) return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="glass p-6 rounded-xl text-center">
        <p className="text-red-400">Failed to load</p>
        <button onClick={() => window.location.reload()} className="mt-3 px-4 py-2 bg-purple-500/20 rounded-lg text-purple-400 text-sm">Retry</button>
      </div>
    </div>
  );

  const g = health.components.reduce((a, c) => {
    const k = c.name.includes("Lambda") ? "l" : c.name.includes("N8N") ? "n" : "v";
    (a[k] = a[k] || []).push(c); return a;
  }, {} as Record<string, Comp[]>);

  const col: Record<string, string> = { green: "#22c55e", yellow: "#eab308", red: "#ef4444" };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <header className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-purple-500/30"><span className="w-5 h-5 text-white"><Brain /></span></div>
            <div><h1 className="text-base font-bold gradient-text">ARCHON V2.5</h1><p className="text-[10px] text-gray-500">Network Monitor</p></div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${health.overall === "green" ? "bg-green-500/20" : health.overall === "yellow" ? "bg-yellow-500/20" : "bg-red-500/20"}`}>
              <Dot s={health.overall} /><span className={`text-sm font-bold ${health.overall === "green" ? "text-green-400" : health.overall === "yellow" ? "text-yellow-400" : "text-red-400"}`}>{health.score}%</span>
            </div>
            <span className="text-[10px] text-gray-500">{time}</span>
            <button onClick={() => window.location.reload()} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10"><span className="w-4 h-4 text-gray-400 block"><Refresh /></span></button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="glass rounded-xl p-4 flex flex-col items-center"><Gauge v={health.score} c={col[health.overall]} /><div className="mt-2 flex items-center gap-1"><Dot s={health.overall} /><span className="text-xs text-gray-400">{health.overall === "green" ? "All OK" : "Issues"}</span></div></div>
          <div className="glass rounded-xl p-4">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><span className="w-3 h-3 text-cyan-400"><Activity /></span>Stats</h3>
            <div className="grid grid-cols-2 gap-2">
              {[{ l: "Total", v: health.components.length, c: "text-blue-400 bg-blue-500/20" },{ l: "OK", v: health.components.filter(c => c.status === "green").length, c: "text-green-400 bg-green-500/20" },{ l: "Warn", v: health.components.filter(c => c.status === "yellow").length, c: "text-yellow-400 bg-yellow-500/20" },{ l: "Err", v: health.components.filter(c => c.status === "red").length, c: "text-red-400 bg-red-500/20" }].map((s, i) => (
                <div key={i} className={`rounded-lg p-2 text-center ${s.c.split(' ')[1]}`}><div className={`text-lg font-bold ${s.c.split(' ')[0]}`}>{s.v}</div><div className="text-[10px] text-gray-500">{s.l}</div></div>
              ))}
            </div>
          </div>
          <div className="col-span-2 glass rounded-xl p-4">
            <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><span className="w-3 h-3 text-green-400"><Activity /></span>Trend</h3>
            <div className="flex items-center justify-between">
              <div><div className="text-2xl font-bold" style={{ color: col[health.overall] }}>{health.score}%</div><div className="text-[10px] text-gray-500">Current</div></div>
              <Spark d={spark} c={col[health.overall]} />
              <div className="text-right"><div className="text-base font-semibold">{Math.round(health.components.reduce((a, c) => a + c.latency, 0) / health.components.length)}ms</div><div className="text-[10px] text-gray-500">Latency</div></div>
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-4">
          <h3 className="text-xs font-semibold mb-3 flex items-center gap-1"><span className="w-3 h-3 text-purple-400"><Wifi /></span>Network Topology</h3>
          <div className="relative h-48 rounded-lg" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.05), rgba(6,182,212,0.05))" }}>
            <svg className="absolute inset-0 w-full h-full">
              <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" /><stop offset="100%" stopColor="#06b6d4" stopOpacity="0.4" /></linearGradient></defs>
              {["15%","38%","62%","85%"].map((x, i) => <line key={`t${i}`} x1="50%" y1="50%" x2={x} y2="15%" stroke="url(#lg)" strokeWidth="1.5" className="conn-line" />)}
              {["25%","50%","75%"].map((x, i) => <line key={`b${i}`} x1="50%" y1="50%" x2={x} y2="85%" stroke="url(#lg)" strokeWidth="1.5" className="conn-line" />)}
            </svg>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-purple-500/40 core-pulse"><span className="w-6 h-6 text-white"><Brain /></span></div>
              <div className="text-center mt-1"><span className="text-[10px] font-bold">ARCHON</span></div>
            </div>
            {g.l?.map((c, i) => <Node key={c.name} n={c.name.replace("Lambda: ", "")} s={c.status} I={Cpu} x={["15%","38%","62%","85%"][i]} y="15%" />)}
            <Node n="Vercel" s={g.v?.[0]?.status || "green"} I={Globe} x="25%" y="85%" />
            <Node n="AI" s={g.v?.find(c => c.name.includes("AI"))?.status || "yellow"} I={Brain} x="50%" y="85%" />
            <Node n="N8N" s={g.n?.[0]?.status || "green"} I={Flow} x="75%" y="85%" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[{ t: "Lambda", I: Server, c: "text-blue-400", d: g.l },{ t: "N8N", I: Flow, c: "text-orange-400", d: g.n },{ t: "Vercel", I: Globe, c: "text-cyan-400", d: g.v }].map(({ t, I, c, d }) => (
            <div key={t} className="glass rounded-xl p-3">
              <h3 className="text-xs font-semibold mb-2 flex items-center gap-1"><span className={`w-3 h-3 ${c}`}><I /></span>{t}</h3>
              <div className="space-y-1">
                {d?.map(x => (
                  <div key={x.name} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10">
                    <div className="flex items-center gap-2"><Dot s={x.status} sz={5} /><div><div className="text-xs">{x.name.replace("Lambda: ", "").replace("N8N ", "").replace("Webhook: ", "")}</div><div className="text-[10px] text-gray-500">{x.latency}ms</div></div></div>
                    <Badge s={x.status} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center text-[10px] text-gray-600 py-2">
          {new Date(health.timestamp).toLocaleString("tr-TR")} • <a href="/api/realtime-status" target="_blank" className="text-purple-400">API</a>
        </div>
      </main>
    </div>
  );
}

// Export with no SSR wrapper
export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-400 text-sm">Loading ARCHON...</p>
        </div>
      </div>
    );
  }

  return <DashboardInner />;
}
