'use client';

import React, { useState, useEffect } from 'react';

// Inline style tanımları
const styles = {
  // Layout
  container: { minHeight: '100vh', display: 'flex', background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)', color: 'white', fontFamily: 'system-ui, sans-serif' },
  sidebar: { width: '256px', padding: '16px', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,5,10,0.8)' },
  mainContent: { flex: 1, padding: '24px', overflowY: 'auto' as const },
  
  // Cards
  card: { background: 'rgba(15,15,26,0.9)', borderRadius: '12px', padding: '16px', marginBottom: '12px' },
  cardHover: { cursor: 'pointer', transition: 'all 0.2s' },
  
  // Grid
  grid6: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' },
  grid4: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  grid3: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' },
  
  // Flex
  flexCenter: { display: 'flex', alignItems: 'center', justifyContent: 'center' },
  flexBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  flexCol: { display: 'flex', flexDirection: 'column' as const },
  flexGap: { display: 'flex', gap: '12px', alignItems: 'center' },
  
  // Text
  title: { fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' },
  subtitle: { fontSize: '18px', fontWeight: '600', marginBottom: '12px' },
  label: { fontSize: '12px', color: '#888' },
  value: { fontSize: '28px', fontWeight: 'bold' },
  
  // Status
  statusDot: { width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' },
  statusDotRed: { width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' },
  
  // Loading
  loadingScreen: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)' },
  loadingLogo: { width: '80px', height: '80px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', background: 'linear-gradient(135deg, #ff6d5a, #f59e0b)', margin: '0 auto 24px' },
  loadingBar: { width: '192px', height: '4px', background: '#1f2937', borderRadius: '9999px', overflow: 'hidden', margin: '0 auto' },
  loadingProgress: { height: '100%', width: '60%', background: 'linear-gradient(90deg, #f97316, #f59e0b)' },
};

const ArchonDashboard = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Data
  const workflows = [
    { id: '1', name: 'WF1_Daily_Insight', icon: '📊', active: true, category: 'reporting', interval: '24 saat' },
    { id: '2', name: '🚀 GitHub Auto Deploy', icon: '🚀', active: true, category: 'deployment', interval: 'Push Event' },
    { id: '3', name: '🔥 ARCHON Trend Pipeline', icon: '🔥', active: true, category: 'monitoring', interval: '1 saat' },
    { id: '4', name: 'WF3_Decision_Action', icon: '⚡', active: true, category: 'automation', interval: 'On-demand' },
    { id: '5', name: 'EVENT_INTAKE_PRODUCTION', icon: '📥', active: true, category: 'core', interval: 'Real-time' },
    { id: '6', name: '⚡ Auto Optimizer', icon: '⚡', active: true, category: 'optimization', interval: '1 saat' },
    { id: '7', name: 'ARCHON_CONTROL_TOWER_DAILY', icon: '🗼', active: true, category: 'reporting', interval: '24 saat' },
    { id: '8', name: 'Daily Cost Optimizer V2', icon: '💰', active: true, category: 'cost', interval: '24 saat' },
    { id: '9', name: '🔥 Lambda Health Monitor', icon: '🔥', active: true, category: 'monitoring', interval: '5 dakika' },
    { id: '10', name: 'API Health Dashboard', icon: '🩺', active: true, category: 'monitoring', interval: '5 dakika' },
    { id: '11', name: 'MCP Tool Executor', icon: '🔧', active: false, category: 'deprecated', interval: 'On-demand' },
    { id: '12', name: '🔧 ARCHON MCP Bridge', icon: '🔧', active: true, category: 'core', interval: 'On-demand' },
    { id: '13', name: '🔴 EC2 Disk Space Monitor', icon: '🔴', active: true, category: 'monitoring', interval: '6 saat' },
    { id: '14', name: 'ARCHON_WEBHOOK_MASTER', icon: '🎛️', active: true, category: 'core', interval: 'Real-time' },
    { id: '15', name: '🏥 ARCHON Health Monitor V2', icon: '🏥', active: true, category: 'monitoring', interval: '15 dakika' },
    { id: '16', name: '🏥 ARCHON Self-Heal Engine', icon: '🏥', active: true, category: 'self-heal', interval: 'On-demand' },
    { id: '17', name: 'WF2_Decision_Queue V2', icon: '📋', active: true, category: 'automation', interval: 'On-demand' },
    { id: '18', name: 'ARCHON_POLICY_GATE', icon: '🔐', active: true, category: 'security', interval: 'On-demand' },
    { id: '19', name: '🔗 ARCHON GitHub Sync V2', icon: '🔗', active: true, category: 'integration', interval: 'Push Event' },
    { id: '20', name: 'Slack Alert System', icon: '🔔', active: true, category: 'alerting', interval: '15 dakika' },
  ];

  const lambdas = [
    { id: 'brain', name: 'ARCHON Brain', icon: '🧠', memory: '512MB', runtime: 'Python 3.11' },
    { id: 'actions', name: 'ARCHON Actions', icon: '⚡', memory: '256MB', runtime: 'Python 3.11' },
    { id: 'trend', name: 'Trend Collector', icon: '📈', memory: '256MB', runtime: 'Python 3.11' },
    { id: 'event', name: 'Event Intake', icon: '📥', memory: '128MB', runtime: 'Python 3.11' },
    { id: 'api', name: 'ARCHON API', icon: '🌐', memory: '256MB', runtime: 'Node.js 18' },
    { id: 'health', name: 'Health Check', icon: '💚', memory: '128MB', runtime: 'Python 3.11' },
  ];

  const mcpServers = [
    { id: 'n8n', name: 'N8N MCP Server', icon: '⚙️', tools: 3 },
    { id: 'aws', name: 'AWS MCP Server', icon: '☁️', tools: 9 },
    { id: 'archon', name: 'ARCHON Core MCP', icon: '🏛️', tools: 8 },
    { id: 'github', name: 'GitHub MCP', icon: '🐙', tools: 6 },
    { id: 'slack', name: 'Slack MCP', icon: '💬', tools: 4 },
  ];

  const menuItems = [
    { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'health', label: 'System Health', icon: '💚' },
    { id: 'metrics', label: 'Real-Time Metrics', icon: '📊' },
    { id: 'cicd', label: 'CI/CD Pipeline', icon: '🚀' },
    { id: 'workflows', label: 'N8N Workflows', icon: '⚙️', count: 20 },
    { id: 'lambdas', label: 'Lambda Functions', icon: '⚡', count: 6 },
    { id: 'mcp', label: 'MCP Servers', icon: '🔌', count: 5 },
    { id: 'atoms', label: 'Atom Components', icon: '⚛️', count: 6 },
    { id: 'aws', label: 'AWS Services', icon: '☁️', count: 6 },
    { id: 'integrations', label: 'Integrations', icon: '🔗', count: 8 },
    { id: 'dataflow', label: 'Data Flow', icon: '🔄' },
    { id: 'guardian', label: 'Storage Guardian', icon: '🛡️' },
  ];

  // SSR Loading
  if (!mounted) {
    return (
      <div style={styles.loadingScreen}>
        <div style={{ textAlign: 'center' }}>
          <div style={styles.loadingLogo}>🏛️</div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>ARCHON V2.5</h1>
          <p style={{ color: '#9ca3af', marginBottom: '16px' }}>Loading Dashboard...</p>
          <div style={styles.loadingBar}>
            <div style={styles.loadingProgress} />
          </div>
        </div>
      </div>
    );
  }

  // Home Page
  const HomePage = () => (
    <div>
      <div style={{ ...styles.grid6, marginBottom: '24px' }}>
        {[
          { label: 'Workflows', value: 20, icon: '⚙️', color: '#ff6d5a' },
          { label: 'Lambdas', value: 6, icon: '⚡', color: '#8b5cf6' },
          { label: 'MCP Servers', value: 5, icon: '🔌', color: '#f59e0b' },
          { label: 'Atoms', value: 6, icon: '⚛️', color: '#10b981' },
          { label: 'AWS Services', value: 6, icon: '☁️', color: '#3b82f6' },
          { label: 'Health', value: '95%', icon: '💚', color: '#10b981' },
        ].map((stat, i) => (
          <div key={i} style={{ ...styles.card, background: `${stat.color}15`, border: `1px solid ${stat.color}40`, textAlign: 'center', cursor: 'pointer' }} onClick={() => setCurrentPage(stat.label.toLowerCase())}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ ...styles.grid3, marginBottom: '24px' }}>
        {menuItems.filter(m => m.id !== 'home').map(item => (
          <div key={item.id} onClick={() => setCurrentPage(item.id)} style={{ ...styles.card, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ ...styles.flexBetween, marginBottom: '16px' }}>
              <span style={{ fontSize: '40px' }}>{item.icon}</span>
              {item.count && <span style={{ padding: '4px 12px', borderRadius: '9999px', background: 'rgba(139,92,246,0.2)', color: '#a78bfa', fontSize: '14px' }}>{item.count}</span>}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>{item.label}</h3>
            <p style={{ fontSize: '14px', color: '#888' }}>Detayları görüntüle →</p>
          </div>
        ))}
      </div>

      <div style={{ ...styles.card, border: '1px solid rgba(16,185,129,0.3)' }}>
        <h3 style={{ ...styles.flexGap, fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          <span style={{ ...styles.statusDot, animation: 'pulse 2s infinite' }} />
          Sistem Durumu
        </h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          {['N8N', 'Lambda', 'PostgreSQL', 'Vercel', 'GitHub'].map((service, i) => (
            <div key={i} style={{ ...styles.flexGap, padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)' }}>
              <span style={styles.statusDot} />
              <span style={{ fontSize: '14px', color: '#34d399' }}>{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Workflows Page
  const WorkflowsPage = () => (
    <div>
      <div style={{ ...styles.grid4, marginBottom: '24px' }}>
        <div style={{ ...styles.card, background: 'rgba(255,109,90,0.1)', border: '1px solid rgba(255,109,90,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6d5a' }}>{workflows.length}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Toplam Workflow</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{workflows.filter(w => w.active).length}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Aktif</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>12</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Schedule Trigger</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>11</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Webhook Trigger</div>
        </div>
      </div>
      
      {workflows.map(wf => (
        <div key={wf.id} style={{ ...styles.card, marginBottom: '8px', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={styles.flexBetween}>
            <div style={styles.flexGap}>
              <span style={{ fontSize: '28px' }}>{wf.icon}</span>
              <div>
                <div style={{ fontWeight: '600' }}>{wf.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{wf.category} • {wf.interval}</div>
              </div>
            </div>
            <span style={{ ...styles.statusDot, background: wf.active ? '#10b981' : '#ef4444' }} />
          </div>
        </div>
      ))}
    </div>
  );

  // Lambdas Page
  const LambdasPage = () => (
    <div>
      <div style={{ ...styles.grid3, marginBottom: '24px' }}>
        <div style={{ ...styles.card, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>{lambdas.length}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Lambda Functions</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>4</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Public URL</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>us-east-1</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Region</div>
        </div>
      </div>

      {lambdas.map(fn => (
        <div key={fn.id} style={{ ...styles.card, marginBottom: '8px', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={styles.flexBetween}>
            <div style={styles.flexGap}>
              <span style={{ fontSize: '28px' }}>{fn.icon}</span>
              <div>
                <div style={{ fontWeight: '600' }}>{fn.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{fn.memory} • {fn.runtime}</div>
              </div>
            </div>
            <span style={styles.statusDot} />
          </div>
        </div>
      ))}
    </div>
  );

  // MCP Page
  const MCPPage = () => (
    <div>
      <div style={{ ...styles.grid4, marginBottom: '24px' }}>
        <div style={{ ...styles.card, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6' }}>{mcpServers.length}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>MCP Servers</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981' }}>{mcpServers.length}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Active</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b' }}>{mcpServers.reduce((a,b) => a + b.tools, 0)}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Total Tools</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6' }}>16/20</div>
          <div style={{ fontSize: '14px', color: '#888' }}>MCP-Enabled Workflows</div>
        </div>
      </div>

      {mcpServers.map(mcp => (
        <div key={mcp.id} style={{ ...styles.card, marginBottom: '8px', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={styles.flexBetween}>
            <div style={styles.flexGap}>
              <span style={{ fontSize: '32px' }}>{mcp.icon}</span>
              <div>
                <div style={{ fontWeight: '600' }}>{mcp.name}</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{mcp.tools} tools</div>
              </div>
            </div>
            <span style={{ padding: '4px 8px', borderRadius: '6px', background: 'rgba(16,185,129,0.2)', color: '#34d399', fontSize: '12px' }}>active</span>
          </div>
        </div>
      ))}
    </div>
  );

  // Health Page
  const HealthPage = () => (
    <div>
      <div style={{ ...styles.card, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)', marginBottom: '24px' }}>
        <div style={styles.flexBetween}>
          <div>
            <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#10b981' }}>95%</div>
            <div style={{ fontSize: '18px', color: '#888', marginTop: '8px' }}>Overall System Health</div>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>V2.5-Final • us-east-1</div>
          </div>
          <div style={{ width: '128px', height: '128px', borderRadius: '50%', border: '12px solid rgba(16,185,129,0.3)', borderTopColor: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '48px' }}>💚</span>
          </div>
        </div>
      </div>

      <div style={{ ...styles.grid2, marginBottom: '24px' }}>
        <div style={{ ...styles.card, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#10b981' }}>19</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Healthy Components</div>
        </div>
        <div style={{ ...styles.card, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: '40px', fontWeight: 'bold', color: '#ef4444' }}>2</div>
          <div style={{ fontSize: '14px', color: '#888' }}>Issues / Disabled</div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'workflows': return <WorkflowsPage />;
      case 'lambdas': return <LambdasPage />;
      case 'mcp': return <MCPPage />;
      case 'health': return <HealthPage />;
      case 'guardian':
        // Open Guardian in new page
        if (typeof window !== 'undefined') window.location.href = '/guardian';
        return <HomePage />;
      default: return <HomePage />;
    }
  };

  const pageTitle = menuItems.find(m => m.id === currentPage)?.label || 'Dashboard';

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={{ ...styles.flexGap, marginBottom: '32px', padding: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, #ff6d5a, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🏛️</div>
          <div>
            <h1 style={{ fontWeight: 'bold', fontSize: '16px' }}>ARCHON</h1>
            <p style={{ fontSize: '12px', color: '#888' }}>V2.5-Final</p>
          </div>
        </div>

        <nav>
          {menuItems.map(item => (
            <button key={item.id} onClick={() => { setCurrentPage(item.id); setSelectedItem(null); }} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: '8px', marginBottom: '4px', border: 'none',
              background: currentPage === item.id ? 'rgba(139,92,246,0.15)' : 'transparent',
              color: currentPage === item.id ? '#a78bfa' : '#888', cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontSize: '14px' }}>{item.label}</span>
              </div>
              {item.count && <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)' }}>{item.count}</span>}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ ...styles.flexGap, marginBottom: '8px' }}>
              <span style={{ ...styles.statusDot, animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '500' }}>All Systems Online</span>
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Health: 95% • Cost: ~$20/mo</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ ...styles.flexGap, fontSize: '14px', color: '#888', marginBottom: '8px' }}>
            <span onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>Home</span>
            {currentPage !== 'home' && <><span>/</span><span style={{ color: '#d1d5db' }}>{pageTitle}</span></>}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{pageTitle}</h2>
        </div>

        {renderPage()}
      </div>
    </div>
  );
};

export default ArchonDashboard;
