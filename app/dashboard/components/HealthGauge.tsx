'use client';

import React from 'react';

interface HealthGaugeProps {
  score: number;
  label?: string;
}

export default function HealthGauge({ score, label = 'System Health' }: HealthGaugeProps) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;
  
  const getColor = (score: number) => {
    if (score >= 90) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'from-emerald-500/20' };
    if (score >= 70) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'from-amber-500/20' };
    return { stroke: '#ef4444', text: 'text-red-400', bg: 'from-red-500/20' };
  };
  
  const colors = getColor(score);

  return (
    <div className={`bg-gradient-to-br ${colors.bg} to-slate-800/50 rounded-2xl p-6 border border-slate-700/50`}>
      <div className="flex items-center justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#334155"
              strokeWidth="8"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={colors.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${colors.text}`}>{score}%</span>
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
