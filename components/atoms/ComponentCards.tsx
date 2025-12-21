'use client';

import { memo } from 'react';

interface Component {
  name: string;
  status: 'green' | 'yellow' | 'red';
  latency: number;
  message: string;
}

interface ComponentCardsProps {
  lambdas: Component[];
  n8n: Component[];
  vercel: Component[];
}

// SVG Icons
const Server = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-full h-full">
    <rect width="20" height="8" x="2" y="2" rx="2"/>
    <rect width="20" height="8" x="2" y="14" rx="2"/>
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

const ComponentRow = memo(({ comp }: { comp: Component }) => {
  const statusColors: Record<string, string> = {
    green: 'bg-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/20 text-red-400',
  };
  const statusLabels: Record<string, string> = {
    green: 'OK',
    yellow: 'Warn',
    red: 'Err',
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition">
      <div className="flex items-center gap-3">
        <StatusDot status={comp.status} />
        <div>
          <div className="font-medium">
            {comp.name.replace('Lambda: ', '').replace('N8N ', '').replace('Webhook: ', '')}
          </div>
          <div className="text-xs text-gray-500">{comp.latency}ms</div>
        </div>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs ${statusColors[comp.status]}`}>
        {statusLabels[comp.status]}
      </span>
    </div>
  );
});
ComponentRow.displayName = 'ComponentRow';

interface CardSectionProps {
  title: string;
  icon: React.FC;
  iconColor: string;
  components: Component[];
}

const CardSection = memo(({ title, icon: Icon, iconColor, components }: CardSectionProps) => (
  <div className="glass rounded-2xl p-5">
    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
      <span className={`w-5 h-5 ${iconColor}`}><Icon /></span>
      {title}
    </h3>
    <div className="space-y-2">
      {components?.map((comp) => (
        <ComponentRow key={comp.name} comp={comp} />
      ))}
      {(!components || components.length === 0) && (
        <div className="text-center text-gray-500 py-4">No components</div>
      )}
    </div>
  </div>
));
CardSection.displayName = 'CardSection';

export function ComponentCards({ lambdas, n8n, vercel }: ComponentCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <CardSection
        title="AWS Lambda"
        icon={Server}
        iconColor="text-blue-400"
        components={lambdas}
      />
      <CardSection
        title="N8N Workflows"
        icon={Flow}
        iconColor="text-orange-400"
        components={n8n}
      />
      <CardSection
        title="Vercel Platform"
        icon={Globe}
        iconColor="text-cyan-400"
        components={vercel}
      />
    </div>
  );
}

export function ComponentCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 animate-pulse">
          <div className="h-6 w-32 bg-white/10 rounded mb-4" />
          <div className="space-y-2">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-16 bg-white/5 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default ComponentCards;
