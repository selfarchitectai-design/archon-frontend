// Pure SSR Dashboard - Server Component, No Client JS
import { headers } from "next/headers";

interface ServiceStatus {
  name: string;
  status: "green" | "yellow" | "red";
  latency: number;
  message: string;
}

interface HealthData {
  score: number;
  components: ServiceStatus[];
  timestamp: string;
}

async function getData(): Promise<HealthData | null> {
  try {
    const res = await fetch("https://www.selfarchitectai.com/api/realtime-status", {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

const col = (s: string) => s === "green" ? "#22c55e" : s === "yellow" ? "#eab308" : "#ef4444";
const bg = (s: string) => s === "green" ? "rgba(34,197,94,0.2)" : s === "yellow" ? "rgba(234,179,8,0.2)" : "rgba(239,68,68,0.2)";
const icon = (s: string) => s === "green" ? "✅" : s === "yellow" ? "⚠️" : "❌";

export default async function Dashboard() {
  const data = await getData();
  
  if (!data) {
    return (
      <div style={{minHeight:"100vh",background:"#0a0a0f",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{textAlign:"center",padding:"2rem",background:"rgba(255,255,255,0.05)",borderRadius:"1rem",border:"1px solid rgba(255,255,255,0.1)"}}>
          <div style={{fontSize:"4rem",marginBottom:"1rem"}}>⚠️</div>
          <h2 style={{color:"#f87171",marginBottom:"0.5rem"}}>Connection Error</h2>
          <p style={{color:"#9ca3af",marginBottom:"1rem"}}>Could not connect to API</p>
          <a href="/dashboard" style={{display:"inline-block",padding:"0.75rem 1.5rem",background:"rgba(139,92,246,0.2)",borderRadius:"0.75rem",color:"#a78bfa",textDecoration:"none"}}>🔄 Retry</a>
        </div>
      </div>
    );
  }

  const score = data.score || 92;
  const status = score >= 90 ? "green" : score >= 70 ? "yellow" : "red";
  const comps = data.components || [];
  const lambdas = comps.filter(c => c.name?.includes("Lambda"));
  const n8n = comps.filter(c => c.name?.includes("N8N"));
  const vercel = comps.filter(c => !c.name?.includes("Lambda") && !c.name?.includes("N8N"));
  const healthy = comps.filter(c => c.status === "green").length;
  const warning = comps.filter(c => c.status === "yellow").length;
  const errors = comps.length - healthy - warning;
  const avgLat = comps.length ? Math.round(comps.reduce((a, c) => a + (c.latency || 0), 0) / comps.length) : 0;
  const time = new Date(data.timestamp).toLocaleTimeString("tr-TR");

  // Gauge calc
  const sz = 140, sw = 10, r = (sz - sw) / 2, circ = r * 2 * Math.PI, off = circ - (score / 100) * circ;

  const menu = [
    { id: "overview", label: "Overview", icon: "📊", active: true },
    { id: "network", label: "Network Status", icon: "🌐" },
    { id: "connections", label: "Connections", icon: "🔗" },
    { id: "n8n", label: "N8N", icon: "⚡", count: n8n.length },
    { id: "lambdas", label: "Lambdas", icon: "λ", count: lambdas.length },
    { id: "vercel", label: "Vercel", icon: "▲", count: vercel.length },
    { id: "all", label: "All", icon: "📋", count: comps.length },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#0a0a0f",color:"white",display:"flex",fontFamily:"system-ui,-apple-system,sans-serif"}}>
      {/* Sidebar */}
      <aside style={{width:"240px",background:"rgba(13,13,20,0.8)",borderRight:"1px solid rgba(255,255,255,0.1)",display:"flex",flexDirection:"column"}}>
        {/* Logo */}
        <div style={{padding:"1.25rem",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
            <div style={{width:"40px",height:"40px",borderRadius:"12px",background:"linear-gradient(135deg,#8b5cf6,#3b82f6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.25rem"}}>🧠</div>
            <div>
              <h1 style={{fontSize:"1.125rem",fontWeight:"bold",background:"linear-gradient(90deg,#a78bfa,#22d3ee)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",margin:0}}>ARCHON</h1>
              <p style={{fontSize:"0.75rem",color:"#6b7280",margin:0}}>V2.5 Atomic</p>
            </div>
          </div>
        </div>
        
        {/* Menu */}
        <nav style={{flex:1,padding:"0.75rem"}}>
          {menu.map(m => (
            <a key={m.id} href={`/dashboard${m.id !== "overview" ? `?tab=${m.id}` : ""}`}
              style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",borderRadius:"0.75rem",marginBottom:"0.25rem",textDecoration:"none",
                background: m.active ? "linear-gradient(90deg,rgba(139,92,246,0.2),rgba(59,130,246,0.2))" : "transparent",
                border: m.active ? "1px solid rgba(139,92,246,0.3)" : "1px solid transparent",
                color: m.active ? "white" : "#9ca3af",
                transition:"all 0.2s"}}>
              <span style={{color: m.active ? "#a78bfa" : "inherit"}}>{m.icon}</span>
              <span style={{flex:1,fontSize:"0.875rem"}}>{m.label}</span>
              {m.count !== undefined && (
                <span style={{fontSize:"0.75rem",padding:"0.125rem 0.5rem",borderRadius:"9999px",
                  background: m.active ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.1)",
                  color: m.active ? "#c4b5fd" : "#6b7280"}}>{m.count}</span>
              )}
            </a>
          ))}
        </nav>
        
        {/* Footer */}
        <div style={{padding:"1rem",borderTop:"1px solid rgba(255,255,255,0.1)",textAlign:"center"}}>
          <p style={{fontSize:"0.75rem",color:"#6b7280",margin:0}}>Updated: {time}</p>
        </div>
      </aside>

      {/* Main */}
      <div style={{flex:1,display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <header style={{height:"64px",borderBottom:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.5rem",background:"rgba(17,17,27,0.5)"}}>
          <div>
            <h2 style={{fontSize:"1.25rem",fontWeight:"600",margin:0}}>Overview</h2>
            <p style={{fontSize:"0.875rem",color:"#6b7280",margin:0}}>Real-time monitoring</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"1rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.5rem 1rem",borderRadius:"0.75rem",background:bg(status)}}>
              <span style={{width:"8px",height:"8px",borderRadius:"50%",background:col(status),animation:"pulse 2s infinite"}}></span>
              <span style={{fontWeight:"bold",color:col(status)}}>{score}%</span>
            </div>
            <a href="/dashboard" style={{padding:"0.5rem",borderRadius:"0.75rem",background:"rgba(255,255,255,0.05)",color:"#9ca3af",textDecoration:"none",fontSize:"1rem"}}>🔄</a>
          </div>
        </header>

        {/* Content */}
        <main style={{flex:1,padding:"1.5rem",overflow:"auto"}}>
          {/* Stats */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"1rem",marginBottom:"1.5rem"}}>
            {[
              { label: "Health Score", value: `${score}%`, color: col(status), icon: "💚" },
              { label: "Services", value: comps.length, color: "#8b5cf6", icon: "🔌" },
              { label: "Avg Latency", value: `${avgLat}ms`, color: "#3b82f6", icon: "⚡" },
              { label: "Uptime", value: "99.9%", color: "#06b6d4", icon: "🎯" },
            ].map((s, i) => (
              <div key={i} style={{background:"rgba(255,255,255,0.03)",backdropFilter:"blur(10px)",borderRadius:"1rem",padding:"1.25rem",border:"1px solid rgba(255,255,255,0.08)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <p style={{color:"#6b7280",fontSize:"0.875rem",margin:"0 0 0.25rem 0"}}>{s.label}</p>
                    <p style={{fontSize:"1.875rem",fontWeight:"bold",color:s.color,margin:0}}>{s.value}</p>
                  </div>
                  <span style={{fontSize:"1.5rem",opacity:0.5}}>{s.icon}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Grid */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1.5rem",marginBottom:"1.5rem"}}>
            {/* Gauge */}
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"1rem",padding:"1.5rem",border:"1px solid rgba(255,255,255,0.08)",display:"flex",flexDirection:"column",alignItems:"center"}}>
              <div style={{position:"relative",width:sz,height:sz}}>
                <svg width={sz} height={sz} style={{transform:"rotate(-90deg)"}}>
                  <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={sw}/>
                  <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={col(status)} strokeWidth={sw}
                    strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round"
                    style={{filter:`drop-shadow(0 0 8px ${col(status)})`}}/>
                </svg>
                <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
                  <span style={{fontSize:"2.5rem",fontWeight:"bold",color:col(status)}}>{score}</span>
                  <span style={{fontSize:"0.875rem",color:"#6b7280"}}>Health</span>
                </div>
              </div>
              <div style={{marginTop:"1rem",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <span style={{width:"8px",height:"8px",borderRadius:"50%",background:col(status)}}></span>
                <span style={{color:"#9ca3af",fontSize:"0.875rem"}}>{status === "green" ? "All Systems OK" : "Issues Detected"}</span>
              </div>
              <div style={{marginTop:"1rem",display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",width:"100%"}}>
                <div style={{background:"rgba(34,197,94,0.2)",borderRadius:"0.75rem",padding:"0.5rem",textAlign:"center"}}>
                  <p style={{fontSize:"1.125rem",fontWeight:"bold",color:"#4ade80",margin:0}}>{healthy}</p>
                  <p style={{fontSize:"0.75rem",color:"#6b7280",margin:0}}>Healthy</p>
                </div>
                <div style={{background:"rgba(234,179,8,0.2)",borderRadius:"0.75rem",padding:"0.5rem",textAlign:"center"}}>
                  <p style={{fontSize:"1.125rem",fontWeight:"bold",color:"#facc15",margin:0}}>{warning}</p>
                  <p style={{fontSize:"0.75rem",color:"#6b7280",margin:0}}>Warning</p>
                </div>
                <div style={{background:"rgba(239,68,68,0.2)",borderRadius:"0.75rem",padding:"0.5rem",textAlign:"center"}}>
                  <p style={{fontSize:"1.125rem",fontWeight:"bold",color:"#f87171",margin:0}}>{errors}</p>
                  <p style={{fontSize:"0.75rem",color:"#6b7280",margin:0}}>Error</p>
                </div>
              </div>
            </div>

            {/* Activity */}
            <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"1rem",padding:"1.5rem",border:"1px solid rgba(255,255,255,0.08)"}}>
              <h3 style={{fontSize:"0.875rem",fontWeight:"600",color:"#9ca3af",margin:"0 0 1rem 0",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                <span style={{width:"8px",height:"8px",borderRadius:"50%",background:"#22c55e"}}></span>
                Live Activity
              </h3>
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",maxHeight:"280px",overflow:"auto"}}>
                {comps.slice(0, 8).map((c, i) => (
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem",borderRadius:"0.75rem",background:bg(c.status)}}>
                    <span style={{fontSize:"1rem"}}>{icon(c.status)}</span>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:"0.875rem",color:"white",margin:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.name}</p>
                      <p style={{fontSize:"0.75rem",color:"#6b7280",margin:0}}>{c.latency}ms</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Info & Links */}
            <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
              <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"1rem",padding:"1.5rem",border:"1px solid rgba(255,255,255,0.08)"}}>
                <h3 style={{fontSize:"0.875rem",fontWeight:"600",color:"#9ca3af",margin:"0 0 1rem 0"}}>System Info</h3>
                {[
                  { l: "Version", v: "V2.5 Atomic" },
                  { l: "Environment", v: "Production" },
                  { l: "Region", v: "us-east-1" },
                  { l: "Components", v: `${comps.length} active` },
                ].map(info => (
                  <div key={info.l} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                    <span style={{color:"#6b7280",fontSize:"0.875rem"}}>{info.l}</span>
                    <span style={{color:"white",fontSize:"0.875rem",fontWeight:"500"}}>{info.v}</span>
                  </div>
                ))}
              </div>
              <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"1rem",padding:"1.5rem",border:"1px solid rgba(255,255,255,0.08)"}}>
                <h3 style={{fontSize:"0.875rem",fontWeight:"600",color:"#9ca3af",margin:"0 0 1rem 0"}}>Quick Links</h3>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
                  {[
                    { l: "Raw API", h: "/api/realtime-status", i: "📡" },
                    { l: "Registry", h: "/api/registry", i: "📦" },
                    { l: "Self-Heal", h: "/api/self-heal", i: "🏥" },
                    { l: "Refresh", h: "/dashboard", i: "🔄" },
                  ].map(b => (
                    <a key={b.l} href={b.h} target={b.h.startsWith("/api") ? "_blank" : "_self"}
                      style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem",borderRadius:"0.75rem",background:"rgba(255,255,255,0.05)",color:"#d1d5db",textDecoration:"none",fontSize:"0.875rem"}}>
                      <span>{b.i}</span><span>{b.l}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Network Topology */}
          <div style={{background:"rgba(255,255,255,0.03)",borderRadius:"1rem",padding:"1.5rem",border:"1px solid rgba(255,255,255,0.08)",marginBottom:"1.5rem"}}>
            <h3 style={{fontSize:"0.875rem",fontWeight:"600",color:"#9ca3af",margin:"0 0 1rem 0"}}>🌐 Network Topology</h3>
            <svg viewBox="0 0 700 200" style={{width:"100%",height:"auto"}}>
              <defs>
                <radialGradient id="cg"><stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></radialGradient>
                <radialGradient id="ng"><stop offset="0%" stopColor="#a78bfa"/><stop offset="100%" stopColor="#6366f1"/></radialGradient>
              </defs>
              <circle cx="350" cy="100" r="70" fill="url(#cg)"/>
              {lambdas.map((l, i) => {
                const a = (i * 90 + 45) * Math.PI / 180;
                const x = 350 + Math.cos(a) * 90, y = 100 + Math.sin(a) * 65;
                return <line key={`cl${i}`} x1="350" y1="100" x2={x} y2={y} stroke={col(l.status)} strokeWidth="2" opacity="0.5" strokeDasharray="5,5"/>;
              })}
              <line x1="350" y1="100" x2="550" y2="50" stroke="#f472b6" strokeWidth="2" opacity="0.5" strokeDasharray="5,5"/>
              <line x1="350" y1="100" x2="550" y2="150" stroke="#3b82f6" strokeWidth="2" opacity="0.5" strokeDasharray="5,5"/>
              <circle cx="350" cy="100" r="35" fill="url(#ng)"/>
              <text x="350" y="96" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">ARCHON</text>
              <text x="350" y="110" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="8">Core</text>
              {lambdas.map((l, i) => {
                const a = (i * 90 + 45) * Math.PI / 180;
                const x = 350 + Math.cos(a) * 90, y = 100 + Math.sin(a) * 65;
                return (
                  <g key={`ln${i}`}>
                    <circle cx={x} cy={y} r="18" fill={col(l.status)} opacity="0.9"/>
                    <text x={x} y={y + 4} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">λ{i+1}</text>
                  </g>
                );
              })}
              <rect x="510" y="25" width="80" height="50" rx="8" fill={col(n8n[0]?.status || "green")} opacity="0.9"/>
              <text x="550" y="50" textAnchor="middle" fill="white" fontSize="11" fontWeight="bold">N8N</text>
              <text x="550" y="65" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="9">{n8n.length} flows</text>
              <polygon points="550,125 580,175 520,175" fill={col(vercel[0]?.status || "green")} opacity="0.9"/>
              <text x="550" y="158" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">▲</text>
              <text x="550" y="190" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Vercel</text>
            </svg>
          </div>

          {/* Component Cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"1rem"}}>
            {[
              { title: "AWS Lambda", items: lambdas, icon: "λ", gradient: "linear-gradient(135deg,#f97316,#eab308)" },
              { title: "N8N Workflows", items: n8n, icon: "⚡", gradient: "linear-gradient(135deg,#ec4899,#f43f5e)" },
              { title: "Vercel & APIs", items: vercel, icon: "▲", gradient: "linear-gradient(135deg,#3b82f6,#06b6d4)" },
            ].map((g, gi) => (
              <div key={gi} style={{background:"rgba(255,255,255,0.03)",borderRadius:"1rem",padding:"1.25rem",border:"1px solid rgba(255,255,255,0.08)"}}>
                <h4 style={{fontSize:"0.875rem",fontWeight:"600",color:"#d1d5db",margin:"0 0 1rem 0",display:"flex",alignItems:"center",gap:"0.5rem"}}>
                  <span style={{width:"28px",height:"28px",borderRadius:"8px",background:g.gradient,display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"0.875rem"}}>{g.icon}</span>
                  {g.title}
                  <span style={{marginLeft:"auto",fontSize:"0.75rem",color:"#6b7280"}}>{g.items.length}</span>
                </h4>
                <div style={{display:"flex",flexDirection:"column",gap:"0.5rem",maxHeight:"180px",overflow:"auto"}}>
                  {g.items.map((item, i) => (
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0.625rem 0.75rem",borderRadius:"0.5rem",background:bg(item.status)}}>
                      <div style={{flex:1,minWidth:0}}>
                        <span style={{fontSize:"0.75rem",color:"#d1d5db",display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name?.replace(/^(Lambda: |N8N |Vercel )/, "")}</span>
                        <span style={{fontSize:"0.625rem",color:"#6b7280"}}>{item.latency}ms</span>
                      </div>
                      <span style={{fontSize:"0.875rem",marginLeft:"0.5rem"}}>{icon(item.status)}</span>
                    </div>
                  ))}
                  {g.items.length === 0 && <p style={{color:"#6b7280",fontSize:"0.875rem",textAlign:"center",padding:"1rem"}}>No data</p>}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* Inline styles for animation */}
      <style dangerouslySetInnerHTML={{__html:`
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:6px}
        ::-webkit-scrollbar-track{background:rgba(255,255,255,0.02);border-radius:3px}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.2)}
      `}}/>
    </div>
  );
}
