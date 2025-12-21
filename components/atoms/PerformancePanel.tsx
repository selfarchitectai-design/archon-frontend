'use client';

interface PerformancePanelProps {
  healthScore: number;
  avgLatency: number;
  refreshRate: number;
  status: 'green' | 'yellow' | 'red';
}

const colors: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export function PerformancePanel({ 
  healthScore, 
  avgLatency, 
  refreshRate, 
  status 
}: PerformancePanelProps) {
  const metrics = [
    { 
      label: 'Health Score', 
      value: `${healthScore}%`, 
      color: colors[status] 
    },
    { 
      label: 'Avg Latency', 
      value: `${avgLatency}ms`, 
      color: '#ffffff' 
    },
    { 
      label: 'Refresh Rate', 
      value: `${refreshRate}s`, 
      color: '#a855f7' 
    },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">⚡ Performance</h3>
      <div className="grid grid-cols-3 gap-6">
        {metrics.map(({ label, value, color }) => (
          <div key={label} className="text-center">
            <div 
              className="text-4xl font-bold transition-all duration-500"
              style={{ color }}
            >
              {value}
            </div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformancePanelSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-32 bg-white/10 rounded mb-4" />
      <div className="grid grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="text-center">
            <div className="h-10 w-20 bg-white/10 rounded mx-auto mb-2" />
            <div className="h-4 w-24 bg-white/10 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default PerformancePanel;
