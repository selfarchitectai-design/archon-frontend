// Static workflow data for SSG
export interface Workflow {
  id: string;
  name: string;
  icon: string;
  active: boolean;
  triggers: string[];
  interval: string;
  category: string;
  description: string;
  nodes: string[];
  connections: Record<string, any>;
  version?: string;
  zeroError?: boolean;
}

export const workflows: Workflow[] = [
  { id: 'fIuv9S3gJGY3D8GZ', name: 'WF1_Daily_Insight', icon: '📊', active: true, triggers: ['Schedule', 'Webhook'], interval: '24 saat', category: 'reporting', description: 'Günlük sistem metrikleri ve rapor oluşturma.', nodes: ['Daily Cron', 'Webhook', 'Set Window', 'Is Cron?', 'Query Events', 'Generate Report', 'Save Report'], connections: { postgres: true, webhook: '/webhook/daily' } },
  { id: 'XJG2I1FB52vN0gPc', name: '🚀 GitHub Auto Deploy', icon: '🚀', active: true, triggers: ['Webhook'], interval: 'Push Event', category: 'deployment', description: 'GitHub push event tetikli Lambda deploy.', nodes: ['GitHub Webhook', 'Check Git Status', 'Deploy Lambda', 'Respond'], connections: { aws: true, github: true } },
  { id: 'oWdgoWs2sDf8zJZy', name: '🔥 ARCHON Trend Pipeline', icon: '🔥', active: true, triggers: ['Schedule'], interval: '6 saat', category: 'monitoring', description: 'Trend analizi ve Slack bildirimi.', nodes: ['Every 6 Hours', 'Run Trend Pipeline', 'High Activity?', 'Slack Notify'], connections: { lambda: true, slack: true } },
  { id: 'SWDbn0KdaOMdiC5S', name: 'WF3_Decision_Action', icon: '⚡', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'automation', description: 'Karar işleme ve GitHub PR oluşturma.', nodes: ['Webhook', 'Process Decision', 'Is Approved?', 'Create GitHub PR'], connections: { postgres: true, github: true } },
  { id: '5v5HmKAxNND52hrp', name: 'EVENT_INTAKE_PRODUCTION', icon: '📥', active: true, triggers: ['Webhook'], interval: 'Real-time', category: 'core', description: 'Ana event alım noktası.', nodes: ['Webhook', 'Process Event', 'Execute SQL', 'Respond'], connections: { postgres: true } },
  { id: 'pABo8he8J4X5ihFR', name: '⚡ Auto Optimizer', icon: '⚡', active: true, triggers: ['Schedule'], interval: '6 saat', category: 'optimization', description: 'AWS kaynak optimizasyonu.', nodes: ['Every 6 Hours', 'Trigger Optimization', 'Check S3'], connections: { aws: true } },
  { id: 'VtMbs0Rjv3URPQ1T', name: 'ARCHON_CONTROL_TOWER_DAILY', icon: '🗼', active: true, triggers: ['Schedule'], interval: '24 saat', category: 'reporting', description: 'Günlük kontrol kulesi raporu.', nodes: ['Daily Trigger', 'HTTP Request', 'Code'], connections: { n8n_api: true } },
  { id: 'DZedS8NLoLHGbzCz', name: 'Daily Cost Optimizer V2', icon: '💰', active: true, triggers: ['Schedule'], interval: '24 saat', category: 'cost', description: 'AWS maliyet raporu V2.', nodes: ['Daily at Midnight', 'Collect AWS', 'Analyze Costs', 'Send Report'], connections: { aws: true, slack: true }, version: 'V2', zeroError: true },
  { id: 'ZEXkGRNcRwJKDGwZ', name: '🔥 Lambda Health Monitor', icon: '🔥', active: true, triggers: ['Schedule'], interval: '30 dakika', category: 'monitoring', description: 'Lambda sağlık kontrolü.', nodes: ['Every 30 min', 'Check Health', 'Get Metrics'], connections: { aws: true } },
  { id: '5Xd33x0k05CwhS2w', name: 'API Health Dashboard', icon: '🩺', active: true, triggers: ['Schedule'], interval: '30 dakika', category: 'monitoring', description: 'API sağlık kontrolü.', nodes: ['Every 30 min', 'Check APIs', 'Combine Results'], connections: { github_api: true, openai_api: true } },
  { id: 'W7MU2KihgmS3gkc1', name: '🔧 ARCHON MCP Bridge', icon: '🔧', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'core', description: 'MCP Gateway - Lambda bağlantısı.', nodes: ['MCP Request', 'Lambda Call', 'Response'], connections: { lambda: true } },
  { id: 'WGnAak2W6Vws6svY', name: '🔴 EC2 Disk Space Monitor', icon: '🔴', active: true, triggers: ['Schedule'], interval: '6 saat', category: 'monitoring', description: 'EC2 disk alanı izleme.', nodes: ['Every 6 Hours', 'Check Disk', 'Alert Slack'], connections: { slack: true } },
  { id: 'nxGOMTIK3V0zk1kV', name: 'ARCHON_WEBHOOK_MASTER', icon: '🎛️', active: true, triggers: ['Webhook'], interval: 'Real-time', category: 'core', description: 'Master webhook router.', nodes: ['Health Webhook', 'Route Request', 'Respond'], connections: { postgres: true } },
  { id: 'PNTVM4WVOjcErMLd', name: '🏥 ARCHON Health Monitor V2', icon: '🏥', active: true, triggers: ['Schedule'], interval: '1 saat', category: 'monitoring', description: 'Lambda sağlık monitörü V2.', nodes: ['Every Hour', 'Check Lambdas', 'Alert Slack'], connections: { lambda: true, slack: true } },
  { id: 'GA4UNzvW2dj2UVyf', name: '🏥 ARCHON Self-Heal Engine', icon: '🏥', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'self-heal', description: 'Self-healing sistemi.', nodes: ['Self-Heal Webhook', 'Analyze Error', 'Auto Fix'], connections: { slack: true } },
  { id: 'JwXyGJtrzHHTI28R', name: 'WF2_Decision_Queue V2', icon: '📋', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'automation', description: 'Karar kuyruğu V2.', nodes: ['Webhook', 'Query Anomalies', 'Process', 'Respond'], connections: { postgres: true }, version: 'V2', zeroError: true },
  { id: 'N0LtPF3MAwKU92wr', name: 'ARCHON_POLICY_GATE', icon: '🔐', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'security', description: 'Policy gateway.', nodes: ['Policy Webhook', 'Evaluate', 'Respond'], connections: { slack: true } },
  { id: 'EbVU2XwkLM9CYs0r', name: '🔗 GitHub Sync V2', icon: '🔗', active: true, triggers: ['Webhook'], interval: 'Push/Issue', category: 'integration', description: 'GitHub event sync V2.', nodes: ['GitHub Webhook', 'Parse Event', 'Lambda Call'], connections: { lambda: true }, version: 'V2', zeroError: true },
  { id: 'e9luGj0NmEUgc1l8', name: 'Slack Alert System', icon: '🔔', active: true, triggers: ['Schedule'], interval: '1 saat', category: 'alerting', description: 'Slack alert sistemi.', nodes: ['Every Hour', 'Check Health', 'Send Alert'], connections: { slack: true } },
  { id: 'kE2OPYdSFTGpI9S3', name: 'MCP Tool Executor', icon: '🔧', active: false, triggers: ['Webhook'], interval: 'On-demand', category: 'deprecated', description: '[DEPRECATED] Eski MCP proxy.', nodes: ['Webhook', 'Call MCP', 'Respond'], connections: { aws: true } }
];

export const workflowCategories = [
  { id: 'all', name: 'Tümü', icon: '📋' },
  { id: 'core', name: 'Core', icon: '🏛️' },
  { id: 'monitoring', name: 'Monitoring', icon: '📊' },
  { id: 'automation', name: 'Automation', icon: '⚡' },
  { id: 'reporting', name: 'Reporting', icon: '📈' },
  { id: 'integration', name: 'Integration', icon: '🔗' },
  { id: 'self-heal', name: 'Self-Heal', icon: '🏥' },
  { id: 'security', name: 'Security', icon: '🔐' },
  { id: 'cost', name: 'Cost', icon: '💰' },
  { id: 'deployment', name: 'Deployment', icon: '🚀' },
  { id: 'alerting', name: 'Alerting', icon: '🔔' }
];
