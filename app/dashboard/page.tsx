"use client";

import { useState, useEffect, useCallback } from "react";

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

const StatusDot = ({ status }: { status: "green" | "yellow" | "red" }) => {
  const colors = {
    green: "bg-green-500",
    yellow: "bg-yellow-500", 
    red: "bg-red-500"
  };
  
  return (
    <span className={`inline-block w-3 h-3 rounded-full ${colors[status]} ${status === "green" ? "animate-pulse" : ""}`} />
  );
};

const StatusBadge = ({ status }: { status: "green" | "yellow" | "red" }) => {
  const styles = {
    green: "bg-green-500/20 text-green-400 border-green-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/30"
  };
  const labels = { green: "Healthy", yellow: "Warning", red: "Error" };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

const ScoreGauge = ({ score, overall }: { score: number; overall: string }) => {
  const colors = {
    green: "#22c55e",
    yellow: "#eab308",
    red: "#ef4444"
  };
  const color = colors[overall as keyof typeof colors] || colors.green;
  
  return (
    <div className="relative w-40 h-40">
      <svg viewBox="0 0 100 100" className="transform -rotate-90">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
        <circle 
          cx="50" cy="50" r="40" fill="none" 
          stroke={color} strokeWidth="8"
          strokeDasharray={`${score * 2.51} 251`}
          strokeLinecap="round"
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold" style={{ color }}>{score}%</span>
        <span className="text-xs text-gray-500">Health Score</span>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch("/api/realtime-status", { cache: "no-store" });
      const data = await res.json();
      setHealth(data);
      setLastUpdate(new Date());
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

  const groupedComponents = health?.components.reduce((acc, comp) => {
    let category = "Other";
    if (comp.name.includes("Lambda")) category = "AWS Lambda";
    else if (comp.name.includes("N8N")) category = "N8N Workflows";
    else if (comp.name.includes("Vercel") || comp.name.includes("AI") || comp.name.includes("KV") || comp.name.includes("MCP")) 
      category = "Vercel Platform";
    
    if (!acc[category]) acc[category] = [];
    acc[category].push(comp);
    return acc;
  }, {} as Record<string, ComponentStatus[]>) || {};

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              ARCHON Dashboard
            </h1>
            <p className="text-sm text-gray-500">Real-time Infrastructure Monitor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 accent-purple-500"
            />
            <span className="text-sm text-gray-400">Auto-refresh (30s)</span>
          </label>
          
          <button 
            onClick={fetchHealth}
            disabled={loading}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-purple-400 text-sm font-medium transition flex items-center gap-2"
          >
            <svg className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              Last: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </header>

      {loading && !health ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
        </div>
      ) : health ? (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-4 gap-6 mb-8">
            <div className="col-span-1 bg-[#1a1a24] rounded-2xl p-6 border border-white/10 flex flex-col items-center">
              <ScoreGauge score={health.score} overall={health.overall} />
              <div className="mt-4 flex items-center gap-2">
                <StatusDot status={health.overall} />
                <span className="text-sm text-gray-400">
                  {health.overall === "green" ? "All Systems Operational" : 
                   health.overall === "yellow" ? "Some Issues Detected" : "Critical Issues"}
                </span>
              </div>
            </div>
            
            <div className="col-span-3 bg-[#1a1a24] rounded-2xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
              <div className="grid grid-cols-4 gap-4">
                {[
                  { label: "Total Components", value: health.components.length, color: "text-blue-400" },
                  { label: "Healthy", value: health.components.filter(c => c.status === "green").length, color: "text-green-400" },
                  { label: "Warning", value: health.components.filter(c => c.status === "yellow").length, color: "text-yellow-400" },
                  { label: "Error", value: health.components.filter(c => c.status === "red").length, color: "text-red-400" },
                ].map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-xl p-4 text-center">
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Component Groups */}
          <div className="grid grid-cols-3 gap-6">
            {Object.entries(groupedComponents).map(([category, components]) => (
              <div key={category} className="bg-[#1a1a24] rounded-2xl p-6 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">{category}</h3>
                  <span className="text-xs text-gray-500">{components.length} items</span>
                </div>
                
                <div className="space-y-3">
                  {components.map((comp, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <StatusDot status={comp.status} />
                        <div>
                          <div className="text-sm font-medium">{comp.name.replace("Lambda: ", "").replace("N8N ", "")}</div>
                          <div className="text-xs text-gray-500">{comp.message}</div>
                        </div>
                      </div>
                      <StatusBadge status={comp.status} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Timestamp */}
          <div className="mt-8 text-center text-xs text-gray-600">
            Data from: {new Date(health.timestamp).toLocaleString()} • Next refresh in {health.refreshInterval}s
          </div>
        </>
      ) : (
        <div className="text-center text-red-400">Failed to load health data</div>
      )}
    </div>
  );
}
