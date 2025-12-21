'use client';

interface QuickStatsProps {
  total: number;
  healthy: number;
  warning: number;
  error: number;
}

export function QuickStats({ total, healthy, warning, error }: QuickStatsProps) {
  const stats = [
    { label: 'Total', value: total, color: 'blue' },
    { label: 'Healthy', value: healthy, color: 'green' },
    { label: 'Warning', value: warning, color: 'yellow' },
    { label: 'Error', value: error, color: 'red' },
  ];

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4">📊 Quick Stats</h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            className={`bg-${color}-500/20 rounded-xl p-4 text-center transition-transform hover:scale-105`}
          >
            <div className={`text-3xl font-bold text-${color}-400`}>
              {value}
            </div>
            <div className="text-xs text-gray-500">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function QuickStatsSkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-32 bg-white/10 rounded mb-4" />
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-4">
            <div className="h-8 w-12 bg-white/10 rounded mx-auto mb-2" />
            <div className="h-3 w-16 bg-white/10 rounded mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default QuickStats;
