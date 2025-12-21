'use client';

import { useEffect, useState } from 'react';

interface HealthGaugeProps {
  score: number;
  status: 'green' | 'yellow' | 'red';
}

const colors: Record<string, string> = {
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

export function HealthGauge({ score, status }: HealthGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const color = colors[status] || colors.green;
  
  const size = 150;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedScore / 100) * circumference;

  useEffect(() => {
    // Animate score on mount
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
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
        <span 
          className="text-5xl font-bold transition-colors duration-500" 
          style={{ color }}
        >
          {animatedScore}
        </span>
        <span className="text-sm text-gray-500">Health</span>
      </div>
    </div>
  );
}

export function HealthGaugeSkeleton() {
  return (
    <div className="relative animate-pulse" style={{ width: 150, height: 150 }}>
      <div className="absolute inset-0 rounded-full border-[12px] border-white/10" />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="w-16 h-12 bg-white/10 rounded" />
        <div className="w-12 h-4 bg-white/10 rounded mt-2" />
      </div>
    </div>
  );
}

export default HealthGauge;
