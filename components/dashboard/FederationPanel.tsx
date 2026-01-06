'use client';

import React, { useEffect, useState } from 'react';

interface AIModel {
  id: string;
  role: string;
  trust_weight: number;
  active: boolean | 'manual';
}

interface FederationStatus {
  name: string;
  version: string;
  status: string;
  timestamp: string;
  components: {
    ai_pool: { status: string; models: AIModel[]; active_count: number };
    supervisor: { status: string; trust_threshold: number; cohesion_threshold: number };
    trigger: { status: string; method: string; cooldown_active: boolean };
    executor: { platform: string; status: string };
    telemetry: { status: string; storage: string };
    production_line: { status: string; auto_deploy: boolean };
  };
}

const roleColors: Record<string, string> = {
  planner_coder: '#00ff88',
  deploy_architect: '#8b5cf6',
  research_analyst: '#3b82f6',
  performance_analyst: '#f59e0b',
  meta_strategist: '#ef4444'
};

const roleIcons: Record<string, string> = {
  planner_coder: '🧠',
  deploy_architect: '🚀',
  research_analyst: '🔍',
  performance_analyst: '📊',
  meta_strategist: '⚡'
};

export default function FederationPanel() {
  const [federation, setFederation] = useState<FederationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/archon/federation')
      .then(r => r.json())
      .then(setFederation)
      .finally(() => setLoading(false));
    const i = setInterval(() => {
      fetch('/api/archon/federation').then(r => r.json()).then(setFederation);
    }, 30000);
    return () => clearInterval(i);
  }, []);

  if (loading) return <div style={{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'24px',color:'white'}}>Loading...</div>;
  if (!federation) return <div style={{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'24px',color:'#ff6b6b'}}>⚠️ No data</div>;

  return (
    <div style={{backgroundColor:'#1a1a2e',borderRadius:'12px',padding:'24px',color:'white'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'24px'}}>
        <div>
          <h2 style={{fontSize:'20px',fontWeight:'bold'}}>🧠 {federation.name}</h2>
          <p style={{color:'#888',fontSize:'14px'}}>v{federation.version}</p>
        </div>
        <span style={{padding:'8px 16px',borderRadius:'20px',backgroundColor:federation.status==='operational'?'#00ff8820':'#ff6b6b20',color:federation.status==='operational'?'#00ff88':'#ff6b6b',fontSize:'14px',fontWeight:'bold'}}>{federation.status.toUpperCase()}</span>
      </div>
      <h3 style={{fontSize:'16px',marginBottom:'12px',color:'#888'}}>AI Decision Pool ({federation.components.ai_pool.active_count} active)</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(180px, 1fr))',gap:'12px',marginBottom:'24px'}}>
        {federation.components.ai_pool.models.map((m) => (
          <div key={m.id} style={{backgroundColor:'#16213e',borderRadius:'8px',padding:'16px',borderLeft:`3px solid ${roleColors[m.role]||'#666'}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
              <span style={{fontSize:'16px'}}>{roleIcons[m.role]||'🤖'} {m.id.toUpperCase()}</span>
              <span style={{fontSize:'10px',padding:'2px 6px',borderRadius:'4px',backgroundColor:m.active===true?'#00ff8820':m.active==='manual'?'#f59e0b20':'#ff6b6b20',color:m.active===true?'#00ff88':m.active==='manual'?'#f59e0b':'#ff6b6b'}}>{m.active==='manual'?'MANUAL':m.active?'ACTIVE':'OFF'}</span>
            </div>
            <div style={{fontSize:'12px',color:'#888'}}>{m.role.replace('_',' ')}</div>
            <div style={{marginTop:'8px',display:'flex',alignItems:'center',gap:'8px'}}>
              <div style={{flex:1,height:'4px',backgroundColor:'#333',borderRadius:'2px',overflow:'hidden'}}>
                <div style={{width:`${m.trust_weight*100}%`,height:'100%',backgroundColor:roleColors[m.role]||'#666'}}/>
              </div>
              <span style={{fontSize:'12px',color:'#888'}}>{(m.trust_weight*100).toFixed(0)}%</span>
            </div>
          </div>
        ))}
      </div>
      <h3 style={{fontSize:'16px',marginBottom:'12px',color:'#888'}}>System Components</h3>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))',gap:'8px'}}>
        {[{name:'Supervisor',status:federation.components.supervisor.status,icon:'👁️'},{name:'Trigger',status:federation.components.trigger.status,icon:'⚡'},{name:'Executor',status:federation.components.executor.status,icon:'🏗️'},{name:'Telemetry',status:federation.components.telemetry.status,icon:'📊'},{name:'Production',status:federation.components.production_line.status,icon:'🏭'}].map((c) => (
          <div key={c.name} style={{backgroundColor:'#16213e',borderRadius:'8px',padding:'12px',display:'flex',alignItems:'center',gap:'8px'}}>
            <span>{c.icon}</span>
            <div><div style={{fontSize:'14px'}}>{c.name}</div><div style={{fontSize:'11px',color:['active','ready','collecting'].includes(c.status)?'#00ff88':'#888'}}>{c.status}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}
