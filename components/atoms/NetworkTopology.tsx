'use client';

import { memo } from 'react';

interface Component {
  name: string;
  status: 'green' | 'yellow' | 'red';
  latency: number;
}

interface NetworkTopologyProps {
  lambdas: Component[];
  n8n: Component[];
  vercel: Component[];
}

// SVG Icons
const Brain = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
  </svg>
);

const Cpu = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="9" y="9" width="6" height="6"/>
  </svg>
);

const Flow = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
    <rect width="8" height="8" x="3" y="3" rx="2"/>
    <path d="M7 11v4a2 2 0 0 0 2 2h4"/>
    <rect width="8" height="8" x="13" y="13" rx="2"/>
  </svg>
);

const Globe = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20"/>
  </svg>
);

const StatusDot = memo(({ status }: { status: string }) => {
  const colors: Record<string, string> = {
    green: '#22c55e',
    yellow: '#eab308',
    red: '#ef4444',
  };
  return (
    <span
      className={status === 'green' ? 'live-pulse' : ''}
      style={{
        width: 10,
        height: 10,
        background: colors[status] || colors.green,
        borderRadius: '50%',
        display: 'inline-block',
      }}
    />
  );
});
StatusDot.displayName = 'StatusDot';

const NodeBox = memo(({ 
  status, 
  icon: Icon, 
  label 
}: { 
  status: string; 
  icon: React.FC; 
  label: string;
}) => {
  const statusClasses: Record<string, string> = {
    green: 'from-green-500/40 to-green-600/20 border-green-500/60',
    yellow: 'from-yellow-500/40 to-yellow-600/20 border-yellow-500/60',
    red: 'from-red-500/40 to-red-600/20 border-red-500/60',
  };

  return (
    <div className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${statusClasses[status] || statusClasses.green} border flex items-center justify-center transition-transform hover:scale-110`}>
        <span className="w-6 h-6 text-white"><Icon /></span>
      </div>
      <span className="text-xs text-gray-400 mt-1">{label}</span>
      <StatusDot status={status} />
    </div>
  );
});
NodeBox.displayName = 'NodeBox';

export function NetworkTopology({ lambdas, n8n, vercel }: NetworkTopologyProps) {
  const lambdaPositions = ['15%', '38%', '62%', '85%'];

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <span className="w-5 h-5 text-purple-400">📡</span>
        Network Topology
      </h3>
      <div
        className="relative h-72 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))',
        }}
      >
        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <linearGradient id="connection-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          {/* Lambda connections */}
          {lambdaPositions.map((pos, i) => (
            <line
              key={`lambda-${i}`}
              x1="50%"
              y1="50%"
              x2={pos}
              y2="15%"
              stroke="url(#connection-gradient)"
              strokeWidth="2"
              className="conn-line"
            />
          ))}
          {/* Bottom connections */}
          <line x1="50%" y1="50%" x2="25%" y2="85%" stroke="url(#connection-gradient)" strokeWidth="2" className="conn-line" />
          <line x1="50%" y1="50%" x2="50%" y2="85%" stroke="url(#connection-gradient)" strokeWidth="2" className="conn-line" />
          <line x1="50%" y1="50%" x2="75%" y2="85%" stroke="url(#connection-gradient)" strokeWidth="2" className="conn-line" />
        </svg>

        {/* Core Node */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 flex items-center justify-center shadow-2xl shadow-purple-500/50 core-pulse">
            <span className="w-10 h-10 text-white"><Brain /></span>
          </div>
          <div className="text-center mt-2 font-bold">ARCHON</div>
        </div>

        {/* Lambda Nodes */}
        {lambdas?.map((comp, i) => (
          <div
            key={comp.name}
            className="absolute flex flex-col items-center z-10"
            style={{
              left: lambdaPositions[i],
              top: '15%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <NodeBox
              status={comp.status}
              icon={Cpu}
              label={comp.name.replace('Lambda: ', '')}
            />
          </div>
        ))}

        {/* Vercel Node */}
        <div
          className="absolute flex flex-col items-center z-10"
          style={{ left: '25%', top: '85%', transform: 'translate(-50%, -50%)' }}
        >
          <NodeBox
            status={vercel?.[0]?.status || 'green'}
            icon={Globe}
            label="Vercel"
          />
        </div>

        {/* AI Chat Node */}
        <div
          className="absolute flex flex-col items-center z-10"
          style={{ left: '50%', top: '85%', transform: 'translate(-50%, -50%)' }}
        >
          <NodeBox
            status="yellow"
            icon={Brain}
            label="AI Chat"
          />
        </div>

        {/* N8N Node */}
        <div
          className="absolute flex flex-col items-center z-10"
          style={{ left: '75%', top: '85%', transform: 'translate(-50%, -50%)' }}
        >
          <NodeBox
            status={n8n?.[0]?.status || 'green'}
            icon={Flow}
            label="N8N"
          />
        </div>
      </div>
    </div>
  );
}

export function NetworkTopologySkeleton() {
  return (
    <div className="glass rounded-2xl p-6 animate-pulse">
      <div className="h-6 w-40 bg-white/10 rounded mb-4" />
      <div
        className="relative h-72 rounded-xl"
        style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08))' }}
      >
        {/* Center skeleton */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-2xl bg-white/10" />
        </div>
        {/* Top skeletons */}
        {['15%', '38%', '62%', '85%'].map((left) => (
          <div
            key={left}
            className="absolute"
            style={{ left, top: '15%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10" />
          </div>
        ))}
        {/* Bottom skeletons */}
        {['25%', '50%', '75%'].map((left) => (
          <div
            key={left}
            className="absolute"
            style={{ left, top: '85%', transform: 'translate(-50%, -50%)' }}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default NetworkTopology;
