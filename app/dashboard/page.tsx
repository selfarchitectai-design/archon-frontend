'use client';

import React, { useState, useEffect } from 'react';

const ArchonDashboard = () => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedItem, setSelectedItem] = useState(null);

  // ============================================
  // DATA DEFINITIONS
  // ============================================

  const workflows = [
    { id: 'fIuv9S3gJGY3D8GZ', name: 'WF1_Daily_Insight', icon: '📊', active: true, triggers: ['Schedule', 'Webhook'], interval: '24 saat', category: 'reporting', description: 'Günlük sistem metrikleri ve rapor oluşturma. PostgreSQL\'den event verilerini çeker, analiz eder ve raporları kaydeder.', nodes: ['Daily Cron', 'Webhook', 'Set Window', 'Is Cron?', 'Query Events', 'Generate Report', 'Save Report', 'Load Last Report', 'Format Response', 'Respond'], connections: { postgres: true, webhook: '/webhook/daily' } },
    { id: 'XJG2I1FB52vN0gPc', name: '🚀 GitHub Auto Deploy', icon: '🚀', active: true, triggers: ['Webhook'], interval: 'Push Event', category: 'deployment', description: 'GitHub push event\'lerini dinler, Lambda deploy tetikler. CI/CD pipeline\'ın ana bileşeni.', nodes: ['GitHub Webhook', 'Check Git Status', 'Deploy Lambda', 'Respond'], connections: { aws: true, github: true, webhook: '/webhook/github-webhook' } },
    { id: 'oWdgoWs2sDf8zJZy', name: '🔥 ARCHON Trend Pipeline', icon: '🔥', active: true, triggers: ['Schedule'], interval: '1 saat', category: 'monitoring', description: 'Saatlik trend analizi. Lambda URL\'leri üzerinden trend verisi toplar, yüksek aktivite tespit edilirse Slack\'e bildirim gönderir.', nodes: ['Every Hour', 'Run Trend Pipeline', 'High Activity?', 'Slack Notify', 'Process in Brain'], connections: { lambda: ['trend-collector', 'archon-brain', 'archon-actions'], slack: true } },
    { id: 'SWDbn0KdaOMdiC5S', name: 'WF3_Decision_Action', icon: '⚡', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'automation', description: 'Karar işleme ve GitHub PR oluşturma. APPROVE/REJECT kararlarını işler, onaylanan kararlar için otomatik PR açar.', nodes: ['Webhook', 'Process Decision', 'Is Approved?', 'Create GitHub PR', 'Update Decision DB'], connections: { postgres: true, github: true, webhook: '/webhook/decision-action' } },
    { id: '5v5HmKAxNND52hrp', name: 'EVENT_INTAKE_PRODUCTION', icon: '📥', active: true, triggers: ['Webhook'], interval: 'Real-time', category: 'core', description: 'Ana event alım noktası. Tüm sistem event\'lerini alır, correlation ID atar, PostgreSQL\'e kaydeder.', nodes: ['Webhook', 'Process Event', 'Execute SQL query', 'Respond'], connections: { postgres: true, webhook: '/webhook/archon-event' } },
    { id: 'pABo8he8J4X5ihFR', name: '⚡ Auto Optimizer', icon: '⚡', active: true, triggers: ['Schedule'], interval: '1 saat', category: 'optimization', description: 'Otomatik optimizasyon tetikleyici. AWS kaynaklarını kontrol eder, optimizasyon işlemlerini başlatır.', nodes: ['Every Hour', 'Trigger Optimization', 'Check S3 Buckets'], connections: { aws: true } },
    { id: 'VtMbs0Rjv3URPQ1T', name: 'ARCHON_CONTROL_TOWER_DAILY', icon: '🗼', active: true, triggers: ['Schedule'], interval: '24 saat', category: 'reporting', description: 'Günlük kontrol kulesi raporu. N8N API\'den execution verilerini çeker, success rate ve ortalama runtime hesaplar.', nodes: ['Daily Trigger', 'HTTP Request', 'Code in JavaScript'], connections: { n8n_api: true } },
    { id: 'DZedS8NLoLHGbzCz', name: 'Daily Cost Optimizer V2 - Zero Error', icon: '💰', active: true, triggers: ['Schedule'], interval: '24 saat', category: 'cost', description: 'AWS maliyet raporu V2 (Zero Error). Safe mode ile AWS kaynaklarını toplar, maliyet analizi yapar.', nodes: ['Daily at Midnight', 'Collect AWS Resources (Safe)', 'Analyze Costs (Safe)', 'Is Success?', 'Send Report (Safe)', 'Send Error (Safe)'], connections: { aws: true, slack: true }, version: 'V2', zeroError: true },
    { id: 'ZEXkGRNcRwJKDGwZ', name: '🔥 Lambda Health Monitor', icon: '🔥', active: true, triggers: ['Schedule'], interval: '5 dakika', category: 'monitoring', description: 'Lambda fonksiyon sağlık kontrolü. Sistem sağlığı, EC2 instance\'ları ve Lambda metriklerini kontrol eder.', nodes: ['Every 5 min', 'Check System Health', 'List EC2 Instances', 'Get Lambda Metrics'], connections: { aws: true } },
    { id: '5Xd33x0k05CwhS2w', name: 'API Health Dashboard', icon: '🩺', active: true, triggers: ['Schedule'], interval: '5 dakika', category: 'monitoring', description: 'Harici API sağlık kontrolü. GitHub API, OpenAI API ve N8N durumunu paralel olarak kontrol eder.', nodes: ['Every 5 Minutes', 'Check GitHub API', 'Check OpenAI API', 'Check n8n Status', 'Combine Results', 'Format Report'], connections: { github_api: true, openai_api: true, n8n: true } },
    { id: 'W7MU2KihgmS3gkc1', name: '🔧 ARCHON MCP Bridge', icon: '🔧', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'core', description: 'MCP Gateway - archon-brain Lambda\'ya doğrudan bağlantı. Tüm MCP tool çağrılarını yönlendirir.', nodes: ['MCP Request', 'Lambda Call', 'Response'], connections: { lambda: ['archon-brain'], webhook: '/webhook/archon-mcp' } },
    { id: 'WGnAak2W6Vws6svY', name: '🔴 EC2 Disk Space Monitor', icon: '🔴', active: true, triggers: ['Schedule'], interval: '6 saat', category: 'monitoring', description: 'EC2 disk alanı izleme. Disk kullanımını simüle eder, %80 üstü kritik durumda Slack alert gönderir.', nodes: ['Every 6 Hours', 'Check Disk Status', 'Is Critical?', 'Alert Slack'], connections: { slack: true } },
    { id: 'nxGOMTIK3V0zk1kV', name: 'ARCHON_WEBHOOK_MASTER', icon: '🎛️', active: true, triggers: ['Webhook'], interval: 'Real-time', category: 'core', description: 'Master webhook router. /archon/health ve /archon/status endpoint\'lerini yönetir.', nodes: ['Health Webhook', 'Status Webhook', 'Route Request', 'Check Database', 'Check N8N', 'Check GitHub', 'Combine Health Results', 'Send Response'], connections: { postgres: true, github_api: true, n8n: true, webhook: ['/webhook/archon/health', '/webhook/archon/status'] } },
    { id: 'PNTVM4WVOjcErMLd', name: '🏥 ARCHON Health Monitor V2', icon: '🏥', active: true, triggers: ['Schedule'], interval: '15 dakika', category: 'monitoring', description: 'Gelişmiş Lambda sağlık monitörü. 4 kritik Lambda\'yı kontrol eder, hata varsa Slack alert gönderir.', nodes: ['Every 15 Min', 'Check Brain', 'Check Actions', 'Check Trend', 'Check Intake', 'Merge Results', 'Analyze Health', 'Has Errors?', 'Alert Slack'], connections: { lambda: ['archon-brain', 'archon-actions', 'trend-collector', 'event-intake'], slack: true } },
    { id: 'GA4UNzvW2dj2UVyf', name: '🏥 ARCHON Self-Heal Engine', icon: '🏥', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'self-heal', description: 'Self-healing sistemi. Hata pattern\'lerini analiz eder, otomatik fix uygular veya Slack\'e bildirir.', nodes: ['Self-Heal Webhook', 'Analyze Error', 'Can Auto Fix?', 'Reset Atom', 'Notify Slack', 'Respond'], connections: { frontend_api: true, slack: true, webhook: '/webhook/self-heal' } },
    { id: 'JwXyGJtrzHHTI28R', name: 'WF2_Decision_Queue V2 - Zero Error', icon: '📋', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'automation', description: 'Karar kuyruğu yönetimi V2 (Zero Error). Safe mode ile anomalileri sorgular, işler ve yanıt döner.', nodes: ['Webhook V2', 'Query Anomalies (Safe)', 'Process Anomalies (Safe)', 'Respond'], connections: { postgres: true, webhook: '/webhook/decisions' }, version: 'V2', zeroError: true },
    { id: 'N0LtPF3MAwKU92wr', name: 'ARCHON_POLICY_GATE', icon: '🔐', active: true, triggers: ['Webhook'], interval: 'On-demand', category: 'security', description: 'Policy gateway. İşlem izinlerini değerlendirir, ALLOW/BLOCK/REQUIRE_APPROVAL kararı verir.', nodes: ['Policy Webhook', 'Evaluate Policy', 'Needs Approval?', 'Send Approval Request', 'Policy Response'], connections: { slack: true, webhook: '/webhook/policy-gate' } },
    { id: 'EbVU2XwkLM9CYs0r', name: '🔗 ARCHON GitHub Sync V2 - Zero Error', icon: '🔗', active: true, triggers: ['Webhook'], interval: 'Push/Issue Event', category: 'integration', description: 'GitHub event senkronizasyonu V2 (Zero Error). Event\'leri güvenli şekilde parse eder, Lambda\'ya gönderir.', nodes: ['GitHub Webhook', 'Parse Event (Safe)', 'Is Valid?', 'Lambda Call (Safe)', 'Is Issue?', 'Create Update (Safe)', 'Final Response', 'Respond'], connections: { lambda: ['archon-brain', 'event-intake'], webhook: '/webhook/archon-github-webhook' }, version: 'V2', zeroError: true },
    { id: 'e9luGj0NmEUgc1l8', name: 'Slack Alert System', icon: '🔔', active: true, triggers: ['Schedule'], interval: '15 dakika', category: 'alerting', description: 'Genel Slack alert sistemi. Sistem sağlığını kontrol eder, hata varsa Slack\'e alert gönderir.', nodes: ['Every 15 Minutes', 'Check System Health', 'Has Error?', 'Send Slack Alert'], connections: { slack: true } },
    { id: 'STORAGE_GUARDIAN_01', name: '🛡️ Storage Guardian Metrics', icon: '🛡️', active: true, triggers: ['Schedule'], interval: '15 dakika', category: 'monitoring', description: 'Storage Guardian metrics collector. Disk, log ve database kullanımını izler, PostgreSQL\'e kaydeder.', nodes: ['Every 15 Min', 'Collect Disk Metrics', 'Collect Log Sizes', 'Check Thresholds', 'Save to DB', 'Alert if Critical'], connections: { postgres: true, slack: true }, version: 'V1', new: true }
  ];

  const lambdaFunctions = [
    { id: 'archon-brain', name: 'ARCHON Brain', icon: '🧠', memory: '512MB', runtime: 'Python 3.11', url: 'jl67xd5pckkhjwdmnvhco2bg440grmtu.lambda-url.us-east-1.on.aws', description: 'Ana AI işleme merkezi. Claude API ile entegre, task processing, karar verme ve analiz işlemleri yapar.', actions: ['health', 'process', 'analyze'] },
    { id: 'archon-actions', name: 'ARCHON Actions', icon: '⚡', memory: '256MB', runtime: 'Python 3.11', url: 'qtomhtef66vivt7wzyit5nuzve0nzvbk.lambda-url.us-east-1.on.aws', description: 'Action execution engine. Slack bildirimleri, sistem aksiyonları ve otomatik işlemleri yürütür.', actions: ['health', 'notify', 'execute'] },
    { id: 'trend-collector', name: 'Trend Collector', icon: '📈', memory: '256MB', runtime: 'Python 3.11', url: 'mjfhxhcsi2u3o2pqhkj55rrlge0ucncm.lambda-url.us-east-1.on.aws', description: 'Trend veri toplama servisi. Sistem metriklerini toplar, analiz eder ve trend raporları oluşturur.', actions: ['health', 'full_pipeline', 'collect'] },
    { id: 'event-intake', name: 'Event Intake', icon: '📥', memory: '128MB', runtime: 'Python 3.11', url: 'wbhdgr46itplcvosjioitclvga0mxlec.lambda-url.us-east-1.on.aws', description: 'Event alım servisi. Harici kaynaklardan gelen event\'leri alır, formatlar ve sisteme iletir.', actions: ['health', 'create_update', 'intake'] },
    { id: 'archon-api', name: 'ARCHON API', icon: '🌐', memory: '256MB', runtime: 'Node.js 18', description: 'Ana API gateway. Frontend isteklerini karşılar, routing ve authentication işlemlerini yönetir.', actions: ['health', 'route', 'auth'] },
    { id: 'health-check', name: 'Health Check', icon: '💚', memory: '128MB', runtime: 'Python 3.11', description: 'Sistem sağlık kontrolü. Tüm servislerin durumunu kontrol eder, metrik toplar.', actions: ['check', 'report'] }
  ];

  const atomComponents = [
    { id: 'health-gauge', name: 'HealthGauge', icon: '📊', description: 'Sistem sağlık göstergesi. Circular progress bar ile health score gösterir.', props: ['score', 'label', 'color'], status: 'active' },
    { id: 'quick-stats', name: 'QuickStats', icon: '⚡', description: 'Hızlı metrik kartları. Uptime, latency, throughput gibi anlık verileri gösterir.', props: ['metrics', 'layout'], status: 'active' },
    { id: 'performance-panel', name: 'PerformancePanel', icon: '📈', description: 'Performans paneli. Sparkline grafikler ve trend göstergeleri içerir.', props: ['data', 'timeRange'], status: 'active' },
    { id: 'network-topology', name: 'NetworkTopology', icon: '🔗', description: 'Ağ topolojisi görselleştirmesi. Servisler arası bağlantıları gösterir.', props: ['nodes', 'edges'], status: 'active' },
    { id: 'component-cards', name: 'ComponentCards', icon: '🎴', description: 'Servis durum kartları. Her servisin durumunu kompakt şekilde gösterir.', props: ['services', 'onClick'], status: 'active' },
    { id: 'atom-error-boundary', name: 'AtomErrorBoundary', icon: '🛡️', description: 'Hata yakalama wrapper. Component hatalarında graceful degradation sağlar.', props: ['fallback', 'onError'], status: 'active' },
    { id: 'storage-guardian', name: 'StorageGuardian', icon: '🛡️', description: 'Storage monitoring dashboard. Tier-based storage, cleanup history ve alerts gösterir.', props: ['metrics', 'alerts', 'flags'], status: 'active', new: true }
  ];

  const awsServices = [
    { id: 'dynamodb', name: 'DynamoDB', icon: '🗄️', tables: ['archon-state', 'archon-kv', 'archon-logs'], description: 'NoSQL veritabanı. Sistem durumu, key-value store ve log verileri için kullanılır.' },
    { id: 'route53', name: 'Route 53', icon: '🌐', domains: ['selfarchitectai.com'], description: 'DNS yönetimi. Domain routing ve SSL sertifika yönetimi.' },
    { id: 'secrets-manager', name: 'Secrets Manager', icon: '🔐', secrets: 8, description: 'Credential yönetimi. API key\'ler, token\'lar ve hassas bilgiler güvenli şekilde saklanır.' },
    { id: 'cloudwatch', name: 'CloudWatch', icon: '📊', alarms: 5, description: 'Monitoring ve logging. Metrik toplama, alarm yönetimi ve log aggregation.' },
    { id: 'iam', name: 'IAM', icon: '👤', roles: 4, description: 'Identity ve Access Management. Servis rolleri ve izin politikaları.' },
    { id: 's3', name: 'S3', icon: '📦', buckets: 3, description: 'Object storage. Statik dosyalar, backup\'lar ve artifact\'lar için kullanılır.' },
    { id: 'ec2', name: 'EC2', icon: '🖥️', instances: 1, description: 'Virtual server. N8N, PostgreSQL ve monitoring servisleri çalıştırır.', ip: '44.202.196.64' }
  ];

  const integrations = [
    { id: 'claude-api', name: 'Claude API', icon: '🤖', version: 'claude-sonnet-4', status: 'active', description: 'Anthropic Claude AI. Brain Lambda\'da kullanılan ana AI modeli.', performance: { latency: '1.2s', uptime: '99.9%', requests: '~500/day', cost: '$0.003/1K tokens' }, activeTools: ['archon-brain', 'AI Gateway Lambda'], connections: ['ARCHON Brain Lambda', 'AI Gateway'] },
    { id: 'vercel', name: 'Vercel', icon: '▲', version: 'v0 (Next.js 14.2.5)', status: 'active', description: 'Frontend hosting. Next.js 14 uygulaması için edge deployment.', performance: { latency: '45ms', uptime: '99.99%', bandwidth: '~2GB/mo', regions: 'Global Edge' }, activeTools: ['Edge Functions', 'SSR', 'ISR', 'Image Optimization'], connections: ['GitHub (Auto Deploy)', 'Route 53 DNS'] },
    { id: 'github', name: 'GitHub', icon: '🐙', version: 'API v3 + GraphQL v4', status: 'active', description: 'Kaynak kod yönetimi. CI/CD webhook\'ları ve PR automation.', performance: { latency: '120ms', uptime: '99.95%', commits: '~50/week', webhooks: '4 active' }, activeTools: ['Webhooks', 'Actions', 'API', 'PR Automation'], connections: ['Vercel', 'N8N Workflows'] },
    { id: 'slack', name: 'Slack', icon: '💬', version: 'Web API v2', status: 'active', description: 'Bildirim sistemi. Alert\'ler, approval request\'ler ve status update\'ler.', performance: { latency: '85ms', uptime: '99.9%', messages: '~100/day', channels: 2 }, activeTools: ['Incoming Webhooks', 'Block Kit', 'Interactive Messages'], connections: ['N8N Workflows', 'Lambda Functions'] },
    { id: 'postgres', name: 'PostgreSQL', icon: '🐘', version: 'PostgreSQL 15.4', status: 'active', description: 'İlişkisel veritabanı. Event\'ler, raporlar, karar kayıtları ve Storage Guardian tabloları.', performance: { latency: '8ms', uptime: '99.99%', storage: '~500MB', connections: '10 pool' }, activeTools: ['Connection Pool', 'JSONB Storage', 'Full-Text Search', 'Storage Guardian Tables'], connections: ['N8N Workflows', 'Event Intake', 'Storage Guardian'] },
    { id: 'n8n', name: 'N8N', icon: '⚙️', version: 'N8N 2.0.2', status: 'active', description: 'Workflow automation. 20 aktif workflow ile sistem orkestrasyonu.', performance: { latency: '150ms', uptime: '99.5%', executions: '~1000/day', workflows: 20 }, activeTools: ['Webhooks', 'Schedule Triggers', 'HTTP Nodes', 'Code Nodes', 'PostgreSQL Nodes'], connections: ['AWS Lambda', 'PostgreSQL', 'GitHub', 'Slack'] },
    { id: 'aws', name: 'AWS', icon: '☁️', version: 'SDK v3', status: 'active', description: 'Cloud altyapısı. Lambda, DynamoDB, Route53, EC2, Secrets Manager.', performance: { latency: '25ms', uptime: '99.99%', cost: '~$20/mo', region: 'us-east-1' }, activeTools: ['Lambda (6)', 'DynamoDB (3)', 'Route 53', 'EC2 (1)', 'Secrets Manager (8)'], connections: ['N8N Workflows', 'Vercel'] },
    { id: 'mcp', name: 'MCP Server', icon: '🔌', version: 'MCP 1.0', status: 'active', description: 'Model Context Protocol. AI agent tool execution ve AWS entegrasyonu.', performance: { latency: '200ms', uptime: '99%', tools: 12, calls: '~200/day' }, activeTools: ['list_ec2_instances', 'list_s3_buckets', 'invoke_lambda', 'system_health', 'trigger_n8n_workflow'], connections: ['Claude API', 'AWS Lambda', 'N8N Workflows'] }
  ];

  const mcpServers = [
    { id: 'n8n-mcp', name: 'N8N MCP Server', icon: '⚙️', status: 'active', endpoint: 'n8n.selfarchitectai.com/mcp', version: 'MCP 1.0 / N8N 2.0.2', description: 'N8N workflow\'larını MCP üzerinden çalıştırır. 16 workflow MCP\'de aktif.', stats: { activeWorkflows: 16, totalWorkflows: 20, dailyCalls: '~150' }, tools: [{ name: 'trigger_workflow', description: 'N8N workflow tetikler' }, { name: 'get_execution', description: 'Execution durumunu sorgular' }, { name: 'list_workflows', description: 'Aktif workflow\'ları listeler' }] },
    { id: 'aws-mcp', name: 'AWS MCP Server', icon: '☁️', status: 'active', endpoint: 'Lambda Function URLs', version: 'AWS SDK v3 / MCP 1.0', description: 'AWS kaynaklarını yönetmek için MCP araçları. EC2, S3, Lambda, DynamoDB işlemleri.', stats: { lambdas: 6, tools: 12, dailyCalls: '~300' }, tools: [{ name: 'list_ec2_instances', description: 'EC2 instance\'larını listeler' }, { name: 'list_s3_buckets', description: 'S3 bucket\'larını listeler' }, { name: 'invoke_lambda', description: 'Lambda fonksiyonu çalıştırır' }] },
    { id: 'archon-mcp', name: 'ARCHON Core MCP', icon: '🏛️', status: 'active', endpoint: 'selfarchitectai.com/api', version: 'ARCHON V2.5', description: 'ARCHON sisteminin ana MCP sunucusu. Orchestration, health check ve system management.', stats: { endpoints: 8, tools: 10, dailyCalls: '~500' }, tools: [{ name: 'get_system_health', description: 'Tüm sistem sağlığını kontrol eder' }, { name: 'trigger_self_heal', description: 'Self-healing başlatır' }, { name: 'get_storage_status', description: 'Storage Guardian durumunu alır' }] },
    { id: 'github-mcp', name: 'GitHub MCP', icon: '🐙', status: 'active', endpoint: 'api.github.com', version: 'GitHub API v3', description: 'GitHub repository yönetimi için MCP araçları. PR, Issue, Commit işlemleri.', stats: { repos: 1, tools: 6, dailyCalls: '~50' }, tools: [{ name: 'get_commits', description: 'Son commit\'leri listeler' }, { name: 'create_issue', description: 'Yeni issue oluşturur' }, { name: 'create_pr', description: 'Pull request açar' }] },
    { id: 'slack-mcp', name: 'Slack MCP', icon: '💬', status: 'active', endpoint: 'hooks.slack.com', version: 'Slack Web API v2', description: 'Slack bildirim ve mesajlaşma için MCP araçları.', stats: { channels: 2, tools: 4, dailyCalls: '~100' }, tools: [{ name: 'send_message', description: 'Slack mesajı gönderir' }, { name: 'send_alert', description: 'Alert formatında mesaj gönderir' }] }
  ];

  const categories = {
    monitoring: { label: 'Monitoring', color: '#10b981', icon: '📡' },
    core: { label: 'Core', color: '#f59e0b', icon: '⚙️' },
    automation: { label: 'Automation', color: '#3b82f6', icon: '🤖' },
    deployment: { label: 'Deployment', color: '#ec4899', icon: '🚀' },
    reporting: { label: 'Reporting', color: '#06b6d4', icon: '📊' },
    'self-heal': { label: 'Self-Heal', color: '#ef4444', icon: '🏥' },
    security: { label: 'Security', color: '#6366f1', icon: '🔐' },
    integration: { label: 'Integration', color: '#84cc16', icon: '🔗' },
    cost: { label: 'Cost', color: '#f97316', icon: '💰' },
    alerting: { label: 'Alerting', color: '#eab308', icon: '🔔' },
    optimization: { label: 'Optimization', color: '#14b8a6', icon: '⚡' },
    storage: { label: 'Storage', color: '#8b5cf6', icon: '🛡️' }
  };

  // ============================================
  // NAVIGATION - Storage Guardian eklendi
  // ============================================

  const menuItems = [
    { id: 'home', label: 'Ana Sayfa', icon: '🏠' },
    { id: 'health', label: 'System Health', icon: '💚' },
    { id: 'guardian', label: 'Storage Guardian', icon: '🛡️', new: true },
    { id: 'metrics', label: 'Real-Time Metrics', icon: '📊' },
    { id: 'cicd', label: 'CI/CD Pipeline', icon: '🚀' },
    { id: 'workflows', label: 'N8N Workflows', icon: '⚙️', count: workflows.length },
    { id: 'lambdas', label: 'Lambda Functions', icon: '⚡', count: lambdaFunctions.length },
    { id: 'mcp', label: 'MCP Servers', icon: '🔌', count: mcpServers.length },
    { id: 'atoms', label: 'Atom Components', icon: '⚛️', count: atomComponents.length },
    { id: 'aws', label: 'AWS Services', icon: '☁️', count: awsServices.length },
    { id: 'integrations', label: 'Integrations', icon: '🔗', count: integrations.length },
    { id: 'dataflow', label: 'Data Flow', icon: '🔄' },
  ];

  // ============================================
  // STORAGE GUARDIAN DATA
  // ============================================
  
  const [guardianData, setGuardianData] = useState({
    health: {
      status: 'healthy',
      score: 92,
      lastCheck: new Date().toISOString()
    },
    disk: {
      used: 11,
      total: 15,
      percent: 74
    },
    metrics: [
      { component: 'root_disk', storage_type: 'disk', tier: 'critical', used_gb: 11, usage_percent: 74, health_status: 'healthy' },
      { component: 'postgresql', storage_type: 'database', tier: 'critical', used_gb: 0.5, usage_percent: 10, health_status: 'healthy' },
      { component: 'system_logs', storage_type: 'logs', tier: 'important', used_gb: 1.2, usage_percent: 12, health_status: 'healthy' },
      { component: 'archon_logs', storage_type: 'logs', tier: 'important', used_gb: 0.3, usage_percent: 3, health_status: 'healthy' },
      { component: 'docker_volumes', storage_type: 'container', tier: 'important', used_gb: 2.1, usage_percent: 21, health_status: 'healthy' },
      { component: 'n8n_data', storage_type: 'application', tier: 'critical', used_gb: 0.8, usage_percent: 8, health_status: 'healthy' }
    ],
    featureFlags: {
      vector_enabled: false,
      vector_write_enabled: false,
      vector_search_enabled: false,
      auto_cleanup_tier2: true,
      storage_alerts_enabled: true
    },
    alerts: [
      { id: 1, component: 'root_disk', severity: 'info', message: 'Disk usage at 74%, monitoring active', time: new Date().toISOString(), acknowledged: true }
    ],
    cleanupHistory: [
      { id: 1, date: new Date().toISOString(), component: 'system', tier: 'all', action: 'daily_cleanup', records: 42, bytes_freed_mb: 156.8, status: 'completed' }
    ],
    tiers: {
      critical: { components: ['root_disk', 'postgresql', 'n8n_data'], total_gb: 12.3, threshold: 95, color: '#ef4444' },
      important: { components: ['system_logs', 'archon_logs', 'docker_volumes'], total_gb: 3.6, threshold: 80, color: '#f59e0b' },
      archivable: { components: ['old_logs', 'temp_files'], total_gb: 0.5, threshold: 70, color: '#8b5cf6' }
    }
  });

  // ============================================
  // METRICS DATA
  // ============================================
  
  const [metricsData, setMetricsData] = useState({
    lastUpdated: new Date().toISOString(),
    overview: {
      totalEvents: 3487,
      eventsToday: 234,
      activeWorkflows: 20,
      healthScore: 95,
      uptime: 99.9,
      costPerMonth: 20.45,
    },
    lambdas: [
      { id: 'brain', name: 'ARCHON Brain', latency: 367, invocations: 1250, success: 99.8, memory: 62 },
      { id: 'actions', name: 'ARCHON Actions', latency: 215, invocations: 890, success: 99.9, memory: 61 },
      { id: 'trend', name: 'Trend Collector', latency: 271, invocations: 720, success: 100, memory: 70 },
      { id: 'event', name: 'Event Intake', latency: 220, invocations: 3200, success: 99.8, memory: 70 },
    ],
    n8n: {
      executions: 2847,
      successRate: 99.5,
      avgDuration: 1.6,
      topWorkflows: [
        { name: 'EVENT_INTAKE', exec: 890, rate: 99.9 },
        { name: 'Decision Queue V2', exec: 312, rate: 100 },
        { name: 'Storage Guardian', exec: 96, rate: 100 },
        { name: 'GitHub Sync V2', exec: 198, rate: 100 },
      ]
    },
    database: { events: 3487, queryTime: 12, connections: 5, storage: { used: 45.6, total: 500 } },
    cost: {
      total: 20.45,
      breakdown: [
        { name: 'Lambda', cost: 8.20, pct: 40 },
        { name: 'EC2', cost: 4.50, pct: 22 },
        { name: 'RDS', cost: 3.80, pct: 19 },
        { name: 'Other', cost: 3.95, pct: 19 },
      ],
      trend: -12.5,
    },
    agi: {
      autonomy: { score: 78.5, trend: 'up' },
      learning: { score: 82.1, trend: 'up' },
      selfHealing: { score: 91.2, trend: 'up' },
      economic: { score: 86.2, trend: 'up' },
      metaIntel: { score: 74.8, trend: 'up' },
    },
    market: {
      composite: 78.4,
      percentile: 68,
      peerMedian: 65.2,
      outcomes: { taskCompletion: 94.2, errorRecovery: 91.8, costSaved: 2340, tasksAutomated: 3487 },
      usage: { activation: 92.5, stickiness: 68.5, timeToValue: 12, nps: 72, retention: { d1: 85.2, d7: 72.4, d30: 58.6 } },
      strengths: [{ metric: 'Task Success', vs: '+33.8%' }, { metric: 'Error Recovery', vs: '+28.2%' }, { metric: 'Automation', vs: '+24.5%' }],
      weaknesses: [{ metric: 'Social Presence', vs: '-72.3%' }, { metric: 'Community', vs: '-58.6%' }, { metric: 'Documentation', vs: '-32.1%' }],
    },
    realWorldAPIs: {
      internal: [
        { name: 'N8N', status: 'live', latency: 45 },
        { name: 'Lambda Brain', status: 'live', latency: 367 },
        { name: 'Lambda Actions', status: 'live', latency: 215 },
        { name: 'Event Webhook', status: 'live', latency: 120 },
        { name: 'Frontend', status: 'live', latency: 374 },
      ],
      external: [
        { name: 'GitHub', icon: '🐙', status: 'ready', rateLimit: '5000/hour', normalized: 45 },
        { name: 'Product Hunt', icon: '🚀', status: 'live', rateLimit: '450/day', normalized: 0 },
        { name: 'X (Twitter)', icon: '🐦', status: 'pending', rateLimit: '300/15min', normalized: 0 },
        { name: 'Reddit', icon: '🤖', status: 'pending', rateLimit: '60/min', normalized: 0 },
        { name: 'Hacker News', icon: '📰', status: 'live', rateLimit: 'unlimited', normalized: 5 },
      ],
    },
    trends: { composite: [72.1, 74.3, 75.8, 76.9, 77.5, 78.1, 78.4] },
    trending: [
      { rank: 1, name: 'Learning Velocity', growth: '+45%' },
      { rank: 2, name: 'Autonomy Gradient', growth: '+38%' },
      { rank: 3, name: 'Generalization', growth: '+32%' },
      { rank: 4, name: 'Self-Healing', growth: '+28%' },
      { rank: 5, name: 'Economic ROI', growth: '+25%' },
    ]
  });

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetricsData(prev => ({
        ...prev,
        lastUpdated: new Date().toISOString(),
        overview: {
          ...prev.overview,
          totalEvents: prev.overview.totalEvents + Math.floor(Math.random() * 3),
        },
        lambdas: prev.lambdas.map(l => ({
          ...l,
          latency: Math.max(100, l.latency + Math.floor(Math.random() * 40) - 20),
          invocations: l.invocations + Math.floor(Math.random() * 5),
        })),
        n8n: { ...prev.n8n, executions: prev.n8n.executions + Math.floor(Math.random() * 3) },
      }));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Health Data
  const healthData = {
    overallScore: 95.0,
    version: 'v2.5-ultimate',
    timestamp: new Date().toISOString(),
    uptime: '99.9%',
    region: 'us-east-1',
    healthy: [
      { name: 'AI Gateway', category: 'integration', status: 'ready', score: 100, details: 'Claude API bağlantısı aktif' },
      { name: 'KV Storage', category: 'integration', status: 'ready', score: 100, details: 'DynamoDB bağlantısı aktif' },
      { name: 'AWS Connection', category: 'integration', status: 'ready', score: 100, details: 'us-east-1 region aktif' },
      { name: 'N8N Workflows', category: 'service', status: 'active', score: 100, details: '20/20 workflow aktif' },
      { name: 'Lambda Functions', category: 'service', status: 'active', score: 100, details: '6/6 Lambda çalışıyor' },
      { name: 'PostgreSQL', category: 'database', status: 'connected', score: 100, details: 'Veritabanı bağlantısı sağlıklı' },
      { name: 'Storage Guardian', category: 'monitoring', status: 'active', score: 100, details: '🛡️ Phase 0 aktif - EC2 deployment tamamlandı' },
      { name: 'Vercel Deployment', category: 'hosting', status: 'deployed', score: 100, details: 'Frontend aktif' },
      { name: 'GitHub Integration', category: 'integration', status: 'connected', score: 100, details: 'Webhook\'lar aktif' },
      { name: 'Slack Integration', category: 'integration', status: 'connected', score: 100, details: 'Alert sistemi çalışıyor' },
      { name: 'MCP Servers', category: 'service', status: 'active', score: 100, details: '5/5 MCP server aktif' },
      { name: 'Self-Heal Engine', category: 'feature', status: 'active', score: 100, details: 'Auto-fix aktif' },
    ],
    unhealthy: [
      { name: 'Autonomous Mode', category: 'feature', status: 'disabled', score: 0, severity: 'low', details: 'Otonom karar verme modu kapalı', reason: 'Güvenlik politikası', fix: 'Policy Gate\'den threshold ayarla', fixable: true },
      { name: 'Vector Memory', category: 'feature', status: 'planned', score: 0, severity: 'info', details: 'pgvector entegrasyonu - Phase 1 roadmap\'te', reason: 'Storage Guardian Phase 0 tamamlandı', fix: 'Phase 1\'de aktifleştirilecek', fixable: false },
    ],
    recentEvents: [
      { time: 'Az önce', type: 'success', message: '🛡️ Storage Guardian EC2 deployment tamamlandı!' },
      { time: '5 dakika önce', type: 'success', message: '✅ İlk metrics collection başarılı' },
      { time: '10 dakika önce', type: 'success', message: 'Slack webhook test başarılı' },
      { time: '1 saat önce', type: 'success', message: 'Daily Cost Optimizer completed successfully' },
    ]
  };

  // ============================================
  // SPARKLINE COMPONENT
  // ============================================
  
  const SparkLine = ({ data, color }) => {
    if (!data || data.length === 0) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${100 - ((v - min) / range) * 80}`).join(' ');
    return (
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '32px' }} preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
    );
  };

  // ============================================
  // PAGE COMPONENTS
  // ============================================

  const HomePage = () => (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
        {[
          { label: 'Workflows', value: 20, icon: '⚙️', color: '#ff6d5a', page: 'workflows' },
          { label: 'Lambdas', value: 6, icon: '⚡', color: '#8b5cf6', page: 'lambdas' },
          { label: 'MCP', value: 5, icon: '🔌', color: '#f59e0b', page: 'mcp' },
          { label: 'Atoms', value: 7, icon: '⚛️', color: '#10b981', page: 'atoms' },
          { label: 'AWS', value: 7, icon: '☁️', color: '#3b82f6', page: 'aws' },
          { label: 'Health', value: '95%', icon: '💚', color: '#10b981', page: 'health' },
          { label: 'Storage', value: '74%', icon: '🛡️', color: '#8b5cf6', page: 'guardian' },
          { label: 'Metrics', value: 'LIVE', icon: '📊', color: '#ec4899', page: 'metrics' },
        ].map((stat, i) => (
          <div key={i} onClick={() => setCurrentPage(stat.page)} className="rounded-xl p-3 cursor-pointer transition-all hover:scale-105" style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}40` }}>
            <div className="text-2xl mb-1">{stat.icon}</div>
            <div className="text-xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Storage Guardian Quick Status */}
      <div className="rounded-xl p-5" style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-4xl">🛡️</div>
            <div>
              <h3 className="text-lg font-semibold text-purple-400">Storage Guardian - Phase 0 Active</h3>
              <p className="text-sm text-gray-400">EC2 Deployment tamamlandı • 7 gün gözlem başladı</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">{guardianData.disk.percent}%</div>
              <div className="text-xs text-gray-500">Disk</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-400">{guardianData.metrics.length}</div>
              <div className="text-xs text-gray-500">Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-400">{guardianData.alerts.filter(a => !a.acknowledged).length}</div>
              <div className="text-xs text-gray-500">Alerts</div>
            </div>
            <button onClick={() => setCurrentPage('guardian')} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>
              View Details →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-3 gap-4">
        {menuItems.filter(m => m.id !== 'home').slice(0, 6).map((item) => (
          <div key={item.id} onClick={() => setCurrentPage(item.id)} className="rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02] group" style={{ background: 'rgba(15,15,26,0.9)', border: item.new ? '1px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.1)' }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-3xl">{item.icon}</span>
              <div className="flex items-center gap-2">
                {item.new && <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">NEW</span>}
                {item.count && <span className="px-2 py-0.5 rounded-full text-sm font-bold" style={{ background: 'rgba(139,92,246,0.2)', color: '#a78bfa' }}>{item.count}</span>}
              </div>
            </div>
            <h3 className="text-base font-semibold mb-1 group-hover:text-purple-400 transition-colors">{item.label}</h3>
            <p className="text-xs text-gray-500">Detayları görüntüle →</p>
          </div>
        ))}
      </div>

      {/* System Status */}
      <div className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(16,185,129,0.3)' }}>
        <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
          Sistem Durumu
        </h3>
        <div className="grid grid-cols-6 gap-3">
          {['N8N', 'Lambda', 'PostgreSQL', 'Vercel', 'GitHub', 'Guardian'].map((service, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#10b981' }} />
              <span className="text-sm text-emerald-400">{service}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================
  // STORAGE GUARDIAN PAGE
  // ============================================
  
  const GuardianPage = () => {
    const tierColors = { critical: '#ef4444', important: '#f59e0b', archivable: '#8b5cf6' };
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🛡️</div>
            <div>
              <h2 className="text-2xl font-bold">Storage Guardian</h2>
              <p className="text-gray-400">Phase 0 - EC2 Deployment Active</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm text-emerald-400">Monitoring Active</span>
          </div>
        </div>

        {/* Health Overview */}
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2 rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-emerald-400">{guardianData.health.score}%</div>
                <div className="text-lg text-gray-400 mt-2">Storage Health Score</div>
                <div className="text-sm text-gray-500 mt-1">Last check: {new Date(guardianData.health.lastCheck).toLocaleTimeString()}</div>
              </div>
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                  <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="10" fill="none" strokeDasharray={`${guardianData.health.score * 3.02} 302`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">🛡️</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-5" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="text-3xl font-bold text-purple-400">{guardianData.disk.used}GB</div>
            <div className="text-sm text-gray-500">/ {guardianData.disk.total}GB Used</div>
            <div className="mt-3 h-3 rounded-full bg-black/30">
              <div className="h-full rounded-full bg-purple-500" style={{ width: `${guardianData.disk.percent}%` }} />
            </div>
            <div className="text-xs text-purple-400 mt-2">{guardianData.disk.percent}% Disk Usage</div>
          </div>

          <div className="rounded-xl p-5" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <div className="text-3xl font-bold text-amber-400">{guardianData.metrics.length}</div>
            <div className="text-sm text-gray-500">Components Monitored</div>
            <div className="mt-3 grid grid-cols-3 gap-1 text-xs">
              <div className="text-center p-1 rounded" style={{ background: 'rgba(239,68,68,0.2)' }}>
                <div className="text-red-400">{guardianData.tiers.critical.components.length}</div>
                <div className="text-gray-500">Critical</div>
              </div>
              <div className="text-center p-1 rounded" style={{ background: 'rgba(245,158,11,0.2)' }}>
                <div className="text-amber-400">{guardianData.tiers.important.components.length}</div>
                <div className="text-gray-500">Important</div>
              </div>
              <div className="text-center p-1 rounded" style={{ background: 'rgba(139,92,246,0.2)' }}>
                <div className="text-purple-400">{guardianData.tiers.archivable.components.length}</div>
                <div className="text-gray-500">Archive</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tier-Based Storage */}
        <div className="rounded-xl" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="p-5 border-b border-white/10">
            <h3 className="text-lg font-semibold flex items-center gap-2">📊 Tier-Based Storage Monitoring</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-6">
              {Object.entries(guardianData.tiers).map(([tier, data]) => (
                <div key={tier} className="rounded-xl p-4" style={{ background: `${tierColors[tier]}10`, border: `1px solid ${tierColors[tier]}30` }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ background: tierColors[tier] }} />
                      <span className="font-semibold capitalize" style={{ color: tierColors[tier] }}>{tier}</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${tierColors[tier]}20`, color: tierColors[tier] }}>
                      Threshold: {data.threshold}%
                    </span>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: tierColors[tier] }}>{data.total_gb.toFixed(1)} GB</div>
                  <div className="text-xs text-gray-500">{data.components.length} components</div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {data.components.map((comp, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(0,0,0,0.3)', color: '#888' }}>{comp}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Component Details */}
            <div className="space-y-2">
              {guardianData.metrics.map((m, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ background: m.health_status === 'healthy' ? '#10b981' : m.health_status === 'warning' ? '#f59e0b' : '#ef4444' }} />
                    <span className="font-medium">{m.component}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${tierColors[m.tier]}20`, color: tierColors[m.tier] }}>{m.tier}</span>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="text-gray-500">{m.storage_type}</span>
                    <span className="text-purple-400 font-medium">{m.used_gb} GB</span>
                    <div className="w-24 h-2 rounded-full bg-black/30">
                      <div className="h-full rounded-full" style={{ width: `${m.usage_percent}%`, background: m.usage_percent > 80 ? '#ef4444' : m.usage_percent > 60 ? '#f59e0b' : '#10b981' }} />
                    </div>
                    <span className={m.usage_percent > 80 ? 'text-red-400' : m.usage_percent > 60 ? 'text-amber-400' : 'text-emerald-400'}>{m.usage_percent}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Flags & Alerts */}
        <div className="grid grid-cols-2 gap-4">
          {/* Feature Flags */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(59,130,246,0.3)' }}>
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">🎛️ Feature Flags</h3>
            <div className="space-y-3">
              {Object.entries(guardianData.featureFlags).map(([flag, value]) => (
                <div key={flag} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <span className="text-sm text-gray-300">{flag.replace(/_/g, ' ')}</span>
                  <span className={`px-3 py-1 rounded text-xs font-medium ${value ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {value ? 'ON' : 'OFF'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cleanup History */}
          <div className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">🧹 Recent Cleanup</h3>
            <div className="space-y-3">
              {guardianData.cleanupHistory.map((cleanup) => (
                <div key={cleanup.id} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-emerald-400">{cleanup.action}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${cleanup.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                      {cleanup.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{cleanup.records} records • {cleanup.bytes_freed_mb} MB freed</span>
                    <span>{new Date(cleanup.date).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cron Schedule */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">⏰ Cron Schedule</h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { job: 'Metrics Collection', schedule: '*/15 * * * *', description: 'Her 15 dakika', icon: '📊' },
              { job: 'Cleanup Engine', schedule: '0 3 * * *', description: 'Her gün 03:00', icon: '🧹' },
              { job: 'Health Check', schedule: '*/5 * * * *', description: 'Her 5 dakika', icon: '💚' }
            ].map((cron, i) => (
              <div key={i} className="p-4 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{cron.icon}</span>
                  <span className="font-medium text-amber-400">{cron.job}</span>
                </div>
                <div className="text-xs text-gray-500">{cron.description}</div>
                <code className="text-xs text-amber-300 mt-2 block">{cron.schedule}</code>
              </div>
            ))}
          </div>
        </div>

        {/* Phase Roadmap */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">🗺️ Storage Guardian Roadmap</h3>
          <div className="flex items-center justify-between">
            {[
              { phase: 'Phase 0', status: 'active', label: 'Foundation', items: ['SQL Schema', 'Metrics Collection', 'Cleanup Engine', 'Slack Alerts'] },
              { phase: 'Phase 1', status: 'planned', label: 'Vector Memory', items: ['pgvector Extension', 'Embedding Storage', 'Semantic Search'] },
              { phase: 'Phase 2', status: 'planned', label: 'Intelligence', items: ['Predictive Cleanup', 'Auto-Scaling', 'Cost Optimization'] }
            ].map((p, i) => (
              <div key={i} className="flex-1 text-center">
                <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center text-xl mb-2 ${p.status === 'active' ? 'bg-purple-500/30 border-2 border-purple-500' : 'bg-gray-700/30 border border-gray-600'}`}>
                  {p.status === 'active' ? '✅' : '📅'}
                </div>
                <div className={`font-semibold ${p.status === 'active' ? 'text-purple-400' : 'text-gray-500'}`}>{p.phase}</div>
                <div className="text-xs text-gray-500">{p.label}</div>
                {i < 2 && <div className="absolute text-gray-600 text-2xl" style={{ marginLeft: '100px', marginTop: '-50px' }}>→</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // OTHER PAGES (abbreviated for space)
  // ============================================

  const HealthPage = () => {
    const healthyScore = healthData.healthy.length;
    const unhealthyScore = healthData.unhealthy.length;
    const totalComponents = healthyScore + unhealthyScore;
    const healthyPercentage = ((healthyScore / totalComponents) * 100).toFixed(1);

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <div className="col-span-2 rounded-xl p-6" style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-emerald-400">{healthData.overallScore}%</div>
                <div className="text-lg text-gray-400 mt-2">Overall System Health</div>
                <div className="text-sm text-gray-500 mt-1">{healthData.version} • {healthData.region}</div>
              </div>
              <div className="relative w-28 h-28">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                  <circle cx="56" cy="56" r="48" stroke="#10b981" strokeWidth="10" fill="none" strokeDasharray={`${healthData.overallScore * 3.02} 302`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">💚</div>
              </div>
            </div>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div className="text-3xl font-bold text-emerald-400">{healthyScore}</div>
            <div className="text-sm text-gray-500 mt-1">Healthy Components</div>
            <div className="text-xs text-emerald-400 mt-2">{healthyPercentage}% of system</div>
          </div>
          <div className="rounded-xl p-5" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div className="text-3xl font-bold text-purple-400">{unhealthyScore}</div>
            <div className="text-sm text-gray-500 mt-1">Planned / Disabled</div>
            <div className="text-xs text-purple-400 mt-2">Phase 1 roadmap</div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-5 gap-4">
          {[
            { label: 'Uptime', value: healthData.uptime, icon: '⏱️', color: '#10b981' },
            { label: 'Workflows', value: '20/20', icon: '⚙️', color: '#ff6d5a' },
            { label: 'Lambda', value: '6/6', icon: '⚡', color: '#8b5cf6' },
            { label: 'Storage', value: '74%', icon: '🛡️', color: '#f59e0b' },
            { label: 'Cost/Month', value: '~$20', icon: '💰', color: '#3b82f6' },
          ].map((stat, i) => (
            <div key={i} className="rounded-xl p-4 text-center" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${stat.color}40` }}>
              <span className="text-2xl">{stat.icon}</span>
              <div className="text-xl font-bold mt-2" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Healthy Components */}
        <div className="rounded-xl" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="p-4 border-b border-white/10">
            <h3 className="text-base font-semibold flex items-center gap-2">✅ Healthy Components ({healthyScore})</h3>
          </div>
          <div className="p-4 grid grid-cols-3 gap-2">
            {healthData.healthy.map((item, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm text-emerald-400">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events */}
        <div className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <h3 className="text-base font-semibold mb-4">📋 Recent Events</h3>
          <div className="space-y-2">
            {healthData.recentEvents.map((event, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }}>
                <span className={`w-2 h-2 rounded-full ${event.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <span className="text-sm text-gray-300">{event.message}</span>
                <span className="text-xs text-gray-500 ml-auto">{event.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const MetricsPage = () => {
    const formatTime = (iso) => new Date(iso).toLocaleTimeString('tr-TR');
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '12px', margin: 0 }}>
            <span>📊</span> Real-Time Metrics
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ position: 'relative', display: 'flex', width: '12px', height: '12px' }}>
              <span style={{ animation: 'ping 1s infinite', position: 'absolute', width: '100%', height: '100%', borderRadius: '9999px', backgroundColor: 'rgba(52,211,153,0.75)' }}></span>
              <span style={{ position: 'relative', width: '12px', height: '12px', borderRadius: '9999px', backgroundColor: '#10b981' }}></span>
            </span>
            <span style={{ fontSize: '14px', color: '#34d399' }}>LIVE — {formatTime(metricsData.lastUpdated)}</span>
          </div>
        </div>

        {/* Overview Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
          {[
            { icon: '📥', label: 'Events', value: metricsData.overview.totalEvents.toLocaleString(), color: '#8b5cf6' },
            { icon: '⚡', label: 'Workflows', value: metricsData.overview.activeWorkflows, color: '#f59e0b' },
            { icon: '💚', label: 'Health', value: metricsData.overview.healthScore + '%', color: '#10b981' },
            { icon: '⏱️', label: 'Uptime', value: metricsData.overview.uptime + '%', color: '#06b6d4' },
            { icon: '💰', label: 'Cost/mo', value: '$' + metricsData.cost.total, color: '#22c55e' },
            { icon: '🎯', label: 'Market', value: metricsData.market.composite.toFixed(1), color: '#ec4899' },
          ].map((s, i) => (
            <div key={i} style={{ borderRadius: '8px', padding: '12px', textAlign: 'center', background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
              <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Lambda & N8N Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>⚡ Lambda Functions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {metricsData.lambdas.map(l => (
                <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
                  <span style={{ fontSize: '14px' }}>{l.name}</span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}>
                    <span style={{ color: l.latency < 300 ? '#34d399' : '#fbbf24' }}>{l.latency}ms</span>
                    <span style={{ color: '#a78bfa' }}>{l.invocations}</span>
                    <span style={{ color: '#22d3ee' }}>{l.success}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(245,158,11,0.3)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>⚙️ N8N Workflows</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#fbbf24' }}>{metricsData.n8n.executions}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Executions</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>{metricsData.n8n.successRate}%</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Success</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#a78bfa' }}>{metricsData.n8n.avgDuration}s</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Avg</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {metricsData.n8n.topWorkflows.map((w, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px', borderRadius: '4px', background: 'rgba(0,0,0,0.2)' }}>
                  <span>{w.name}</span>
                  <span style={{ color: '#fbbf24' }}>{w.exec}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AGI Metrics */}
        <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(168,85,247,0.3)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🧠 AGI Metrics
            <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(168,85,247,0.2)', color: '#a78bfa' }}>2025</span>
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            {[
              { key: 'autonomy', name: 'Autonomy', icon: '🤖', color: '#8b5cf6' },
              { key: 'learning', name: 'Learning', icon: '📚', color: '#f59e0b' },
              { key: 'selfHealing', name: 'Self-Heal', icon: '🏥', color: '#10b981' },
              { key: 'economic', name: 'Economic', icon: '💰', color: '#eab308' },
              { key: 'metaIntel', name: 'Meta-Intel', icon: '🧠', color: '#a855f7' },
            ].map(m => {
              const d = metricsData.agi?.[m.key] || { score: 0, trend: 'stable' };
              return (
                <div key={m.key} style={{ borderRadius: '8px', padding: '12px', textAlign: 'center', background: `${m.color}10`, border: `1px solid ${m.color}30` }}>
                  <div style={{ fontSize: '18px', marginBottom: '4px' }}>{m.icon}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: m.color }}>{d.score.toFixed(1)}%</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{m.name}</div>
                  <div style={{ fontSize: '11px', color: d.trend === 'up' ? '#34d399' : '#888' }}>{d.trend === 'up' ? '↑' : '→'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Market Reality */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div style={{ borderRadius: '12px', padding: '16px', background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))', border: '1px solid rgba(139,92,246,0.3)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>🎯 Market Reality Score</h3>
            <div style={{ fontSize: '48px', fontWeight: 'bold', background: 'linear-gradient(to right, #a78bfa, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {metricsData.market?.composite?.toFixed(1) || '0.0'}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Percentile: {metricsData.market?.percentile || 0}%</div>
            <div style={{ marginTop: '12px' }}>
              <SparkLine data={metricsData.trends?.composite || []} color="#a855f7" />
            </div>
          </div>

          <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>🎯 Outcomes</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#22c55e' }}>{metricsData.market?.outcomes?.taskCompletion || 0}%</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Task Success</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(34,197,94,0.1)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#34d399' }}>{metricsData.market?.outcomes?.errorRecovery || 0}%</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Recovery</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(234,179,8,0.1)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#eab308' }}>${metricsData.market?.outcomes?.costSaved || 0}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Saved</div>
              </div>
              <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(139,92,246,0.1)' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#a78bfa' }}>{metricsData.market?.outcomes?.tasksAutomated || 0}</div>
                <div style={{ fontSize: '11px', color: '#888' }}>Automated</div>
              </div>
            </div>
          </div>

          <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(236,72,153,0.3)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>📈 Usage & Retention</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#888' }}>Activation</span><span style={{ color: '#ec4899' }}>{metricsData.market?.usage?.activation || 0}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#888' }}>Stickiness</span><span style={{ color: '#22d3ee' }}>{metricsData.market?.usage?.stickiness || 0}%</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}><span style={{ color: '#888' }}>NPS</span><span style={{ color: '#34d399' }}>{metricsData.market?.usage?.nps || 0}</span></div>
            </div>
            <div style={{ marginTop: '12px', display: 'flex', gap: '8px', fontSize: '11px' }}>
              <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(16,185,129,0.2)', color: '#34d399' }}>D1: {metricsData.market?.usage?.retention?.d1 || 0}%</span>
              <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(245,158,11,0.2)', color: '#fbbf24' }}>D7: {metricsData.market?.usage?.retention?.d7 || 0}%</span>
              <span style={{ padding: '4px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>D30: {metricsData.market?.usage?.retention?.d30 || 0}%</span>
            </div>
          </div>
        </div>

        {/* Real World APIs */}
        <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(6,182,212,0.3)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔗 Gerçek Dünya API Kaynakları
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
              <span style={{ fontSize: '12px', color: '#34d399' }}>Senkronize</span>
            </span>
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>🏠 Internal APIs</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {(metricsData.realWorldAPIs?.internal || []).map((api, i) => (
                <div key={i} style={{ padding: '8px', borderRadius: '8px', textAlign: 'center', background: 'rgba(16,185,129,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                    <span style={{ fontSize: '11px', color: '#34d399' }}>{api.status}</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#22d3ee' }}>{api.name}</div>
                  <div style={{ fontSize: '11px', color: '#666' }}>{api.latency}ms</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>🌍 External Market Signals</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {(metricsData.realWorldAPIs?.external || []).map((api, i) => (
                <div key={i} style={{ padding: '12px', borderRadius: '8px', background: api.status === 'live' ? 'rgba(16,185,129,0.1)' : api.status === 'ready' ? 'rgba(6,182,212,0.1)' : 'rgba(245,158,11,0.1)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '20px' }}>{api.icon}</span>
                    <span style={{ fontSize: '11px', padding: '2px 6px', borderRadius: '4px', background: api.status === 'live' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)', color: api.status === 'live' ? '#34d399' : '#fbbf24' }}>
                      {api.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{api.name}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>{api.rateLimit}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: api.status === 'live' ? '#10b981' : '#f59e0b' }}>{api.normalized}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Hunt */}
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,111,66,0.1)', border: '1px solid rgba(255,111,66,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '20px' }}>🚀</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#fb923c' }}>Product Hunt Live Benchmark</span>
              <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#34d399' }}>LIVE</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {[{ label: 'Avg Votes', value: 636, color: '#fb923c' }, { label: 'Avg Comments', value: 94, color: '#22d3ee' }, { label: 'Min Top 10', value: 561, color: '#34d399' }, { label: '#1 Score', value: 708, color: '#a78bfa' }].map((stat, i) => (
                <div key={i} style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>🏆 Today's Top Products:</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {[{ name: 'CyberCut AI', votes: 708 }, { name: 'Fluently Accent Guru', votes: 673 }, { name: 'PlanEat AI', votes: 657 }, { name: 'Incredible', votes: 655 }, { name: 'ClickUp 4.0', votes: 649 }].map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', borderRadius: '4px', fontSize: '12px', background: 'rgba(0,0,0,0.2)' }}>
                  <span style={{ color: '#888' }}>#{i+1} {p.name}</span>
                  <span style={{ color: '#fb923c' }}>▲ {p.votes}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '12px', padding: '8px', borderRadius: '8px', textAlign: 'center', background: 'rgba(255,111,66,0.15)' }}>
              <div style={{ fontSize: '11px', color: '#888' }}>🎯 ARCHON hedef</div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fb923c' }}>Top 10: 561+ | #1: 708+</div>
            </div>
          </div>
        </div>

        {/* Trending & Strengths */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(168,85,247,0.3)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🏆 Trending 2025
              <span style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>HOT</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(metricsData.trending || []).map(t => (
                <div key={t.rank} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', borderRadius: '8px', background: 'rgba(168,85,247,0.1)' }}>
                  <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#a78bfa' }}>#{t.rank}</span>
                  <span style={{ flex: 1, fontSize: '14px' }}>{t.name}</span>
                  <span style={{ color: '#34d399', fontSize: '14px' }}>{t.growth}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderRadius: '12px', padding: '16px', background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(107,114,128,0.3)' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>💪 vs Peers</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#34d399', marginBottom: '8px' }}>Strengths</div>
                {(metricsData.market?.strengths || []).map((s, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px', borderRadius: '4px', marginBottom: '4px', background: 'rgba(16,185,129,0.1)' }}>
                    <span style={{ color: '#888' }}>{s.metric}</span>
                    <span style={{ color: '#34d399' }}>{s.vs}</span>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#ef4444', marginBottom: '8px' }}>Improve</div>
                {(metricsData.market?.weaknesses || []).map((w, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '6px', borderRadius: '4px', marginBottom: '4px', background: 'rgba(239,68,68,0.1)' }}>
                    <span style={{ color: '#888' }}>{w.metric}</span>
                    <span style={{ color: '#ef4444' }}>{w.vs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const WorkflowsPage = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg p-3" style={{ background: 'rgba(255,109,90,0.1)', border: '1px solid rgba(255,109,90,0.3)' }}>
          <div className="text-2xl font-bold text-orange-400">{workflows.length}</div>
          <div className="text-xs text-gray-500">Total Workflows</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)' }}>
          <div className="text-2xl font-bold text-emerald-400">{workflows.filter(w => w.active).length}</div>
          <div className="text-xs text-gray-500">Active</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div className="text-2xl font-bold text-purple-400">{workflows.filter(w => w.zeroError).length}</div>
          <div className="text-xs text-gray-500">Zero Error</div>
        </div>
        <div className="rounded-lg p-3" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}>
          <div className="text-2xl font-bold text-blue-400">{workflows.filter(w => w.new).length}</div>
          <div className="text-xs text-gray-500">New</div>
        </div>
      </div>
      <div className="space-y-2">
        {workflows.map((wf) => (
          <div key={wf.id} onClick={() => setSelectedItem(selectedItem?.id === wf.id ? null : wf)} className="rounded-xl cursor-pointer transition-all" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${selectedItem?.id === wf.id ? categories[wf.category]?.color || '#888' : 'rgba(255,255,255,0.1)'}` }}>
            <div className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wf.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{wf.name}</span>
                      {wf.new && <span className="px-1.5 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">NEW</span>}
                      {wf.zeroError && <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400">Zero Error</span>}
                    </div>
                    <div className="text-xs text-gray-500">{wf.interval}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${wf.active ? 'bg-emerald-500' : 'bg-gray-500'}`} />
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: `${categories[wf.category]?.color}20`, color: categories[wf.category]?.color }}>{wf.category}</span>
                </div>
              </div>
            </div>
            {selectedItem?.id === wf.id && (
              <div className="border-t border-white/10 p-3" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <p className="text-sm text-gray-400 mb-3">{wf.description}</p>
                <div className="flex flex-wrap gap-1">
                  {wf.nodes?.map((node, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded" style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}>{node}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const LambdasPage = () => (
    <div className="grid grid-cols-2 gap-4">
      {lambdaFunctions.map((lambda) => (
        <div key={lambda.id} onClick={() => setSelectedItem(selectedItem?.id === lambda.id ? null : lambda)} className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${selectedItem?.id === lambda.id ? '#8b5cf6' : 'rgba(139,92,246,0.3)'}` }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{lambda.icon}</span>
            <div>
              <h3 className="font-semibold">{lambda.name}</h3>
              <div className="text-xs text-gray-500">{lambda.runtime} • {lambda.memory}</div>
            </div>
          </div>
          <p className="text-sm text-gray-400">{lambda.description}</p>
          {selectedItem?.id === lambda.id && lambda.url && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <code className="text-xs text-purple-400 break-all">{lambda.url}</code>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const MCPPage = () => (
    <div className="space-y-4">
      {mcpServers.map((server) => (
        <div key={server.id} onClick={() => setSelectedItem(selectedItem?.id === server.id ? null : server)} className="rounded-xl cursor-pointer transition-all" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${selectedItem?.id === server.id ? '#f59e0b' : 'rgba(245,158,11,0.3)'}` }}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{server.icon}</span>
                <div>
                  <h3 className="font-semibold">{server.name}</h3>
                  <div className="text-xs text-gray-500">{server.version}</div>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-xs ${server.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-400'}`}>{server.status}</span>
            </div>
          </div>
          {selectedItem?.id === server.id && (
            <div className="border-t border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-sm text-gray-400 mb-3">{server.description}</p>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {Object.entries(server.stats).map(([key, value]) => (
                  <div key={key} className="text-center p-2 rounded" style={{ background: 'rgba(245,158,11,0.1)' }}>
                    <div className="text-lg font-bold text-amber-400">{value}</div>
                    <div className="text-xs text-gray-500">{key}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1">
                {server.tools.map((tool, i) => (
                  <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>{tool.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const AtomsPage = () => (
    <div className="grid grid-cols-2 gap-4">
      {atomComponents.map((atom) => (
        <div key={atom.id} onClick={() => setSelectedItem(selectedItem?.id === atom.id ? null : atom)} className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${atom.new ? 'rgba(139,92,246,0.5)' : 'rgba(16,185,129,0.3)'}` }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{atom.icon}</span>
              <h3 className="font-semibold">{atom.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {atom.new && <span className="px-2 py-0.5 rounded text-xs bg-purple-500/20 text-purple-400">NEW</span>}
              <span className={`w-2 h-2 rounded-full ${atom.status === 'active' ? 'bg-emerald-500' : 'bg-gray-500'}`} />
            </div>
          </div>
          <p className="text-sm text-gray-400">{atom.description}</p>
          {selectedItem?.id === atom.id && (
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap gap-1">
              {atom.props.map((prop, i) => (
                <code key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>{prop}</code>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const AWSPage = () => (
    <div className="grid grid-cols-3 gap-4">
      {awsServices.map((service) => (
        <div key={service.id} onClick={() => setSelectedItem(selectedItem?.id === service.id ? null : service)} className="rounded-xl p-4 cursor-pointer transition-all hover:scale-[1.02]" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${selectedItem?.id === service.id ? '#f59e0b' : 'rgba(245,158,11,0.3)'}` }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{service.icon}</span>
            <h3 className="font-semibold">{service.name}</h3>
          </div>
          <p className="text-sm text-gray-400 mb-3">{service.description}</p>
          {selectedItem?.id === service.id && (
            <div className="pt-3 border-t border-white/10">
              {service.tables && <div className="flex flex-wrap gap-1">{service.tables.map((t, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>{t}</span>)}</div>}
              {service.ip && <span className="text-sm text-amber-400">{service.ip}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const IntegrationsPage = () => (
    <div className="space-y-3">
      {integrations.map((int) => (
        <div key={int.id} onClick={() => setSelectedItem(selectedItem?.id === int.id ? null : int)} className="rounded-xl cursor-pointer transition-all" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${selectedItem?.id === int.id ? '#3b82f6' : 'rgba(59,130,246,0.3)'}` }}>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl">{int.icon}</span>
                <div>
                  <h3 className="font-semibold">{int.name}</h3>
                  <div className="text-xs text-gray-500">{int.version}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="text-emerald-400">{int.performance.uptime}</div>
                <div className="text-blue-400">{int.performance.latency}</div>
              </div>
            </div>
          </div>
          {selectedItem?.id === int.id && (
            <div className="border-t border-white/10 p-4" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <p className="text-sm text-gray-400 mb-3">{int.description}</p>
              <div className="flex flex-wrap gap-1">
                {int.activeTools?.map((tool, i) => <span key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399' }}>{tool}</span>)}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const CICDPage = () => (
    <div className="space-y-6">
      <div className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(236,72,153,0.3)' }}>
        <h3 className="text-lg font-semibold mb-4">🚀 CI/CD Pipeline</h3>
        <div className="flex items-center justify-between">
          {['Commit', 'Trigger', 'Build', 'Test', 'Deploy', 'Notify'].map((stage, i) => (
            <React.Fragment key={i}>
              <div className="text-center">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl mb-2" style={{ background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.5)' }}>✅</div>
                <div className="text-xs text-gray-400">{stage}</div>
              </div>
              {i < 5 && <div className="text-xl text-emerald-500">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[
          { name: 'Vercel', icon: '▲', role: 'Frontend CI/CD', status: 'active' },
          { name: 'GitHub Actions', icon: '🎬', role: 'CI Pipeline', status: 'active' },
          { name: 'Lambda Deploy', icon: '⚡', role: 'Backend CI/CD', status: 'active' },
        ].map((tool, i) => (
          <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(236,72,153,0.3)' }}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{tool.icon}</span>
              <div>
                <h4 className="font-semibold">{tool.name}</h4>
                <div className="text-xs text-gray-500">{tool.role}</div>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400">{tool.status}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const DataFlowPage = () => (
    <div className="space-y-6">
      <div className="rounded-xl p-6" style={{ background: 'rgba(15,15,26,0.9)', border: '1px solid rgba(99,102,241,0.3)' }}>
        <h3 className="text-lg font-semibold mb-6">🔄 System Data Flow</h3>
        <div className="flex items-center justify-between gap-4">
          {[
            { icon: '👤', label: 'User' },
            { icon: '▲', label: 'Vercel' },
            { icon: '⚛️', label: 'Next.js' },
            { icon: '⚡', label: 'API' },
            { icon: '🧠', label: 'Brain' },
            { icon: '🗄️', label: 'DB' },
            { icon: '⚙️', label: 'N8N' },
            { icon: '🛡️', label: 'Guardian' },
          ].map((step, i) => (
            <React.Fragment key={i}>
              <div className="text-center flex-shrink-0">
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl mb-2" style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.5)' }}>{step.icon}</div>
                <div className="text-xs text-gray-500">{step.label}</div>
              </div>
              {i < 7 && <div className="text-xl text-gray-600">→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[
          { title: '📥 Event Intake Flow', color: '#10b981', steps: ['External event → INTAKE webhook', 'Process & assign correlation ID', 'Store in PostgreSQL', 'Trigger downstream workflows'] },
          { title: '🛡️ Storage Guardian Flow', color: '#8b5cf6', steps: ['Cron trigger (*/15 min)', 'Collect disk/log/db metrics', 'Check thresholds', 'Alert if critical, cleanup daily'] },
          { title: '🏥 Self-Heal Flow', color: '#f59e0b', steps: ['AtomErrorBoundary catches error', 'POST to /webhook/self-heal', 'Analyze error pattern', 'Auto-fix or notify Slack'] },
          { title: '🚀 Deploy Flow', color: '#3b82f6', steps: ['GitHub push → webhook', 'Check git status', 'Deploy Lambda function', 'Return deployment status'] },
        ].map((flow, i) => (
          <div key={i} className="rounded-xl p-5" style={{ background: 'rgba(15,15,26,0.9)', border: `1px solid ${flow.color}40` }}>
            <h4 className="font-semibold mb-4" style={{ color: flow.color }}>{flow.title}</h4>
            <div className="space-y-2 text-sm text-gray-400">
              {flow.steps.map((step, j) => <div key={j}>{j + 1}. {step}</div>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  const renderPage = () => {
    switch(currentPage) {
      case 'home': return <HomePage />;
      case 'health': return <HealthPage />;
      case 'guardian': return <GuardianPage />;
      case 'metrics': return <MetricsPage />;
      case 'cicd': return <CICDPage />;
      case 'workflows': return <WorkflowsPage />;
      case 'lambdas': return <LambdasPage />;
      case 'mcp': return <MCPPage />;
      case 'atoms': return <AtomsPage />;
      case 'aws': return <AWSPage />;
      case 'integrations': return <IntegrationsPage />;
      case 'dataflow': return <DataFlowPage />;
      default: return <HomePage />;
    }
  };

  const pageTitle = menuItems.find(m => m.id === currentPage)?.label || 'Dashboard';

  return (
    <div style={{ minHeight: '100vh', color: 'white', display: 'flex', background: 'linear-gradient(135deg, #0a0a0f 0%, #12121a 50%, #0a0a0f 100%)', fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '256px', padding: '16px', borderRight: '1px solid rgba(255,255,255,0.1)', background: 'rgba(5,5,10,0.8)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', padding: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', background: 'linear-gradient(135deg, #ff6d5a, #f59e0b)' }}>🏛️</div>
          <div>
            <h1 style={{ fontWeight: 'bold' }}>ARCHON</h1>
            <p style={{ fontSize: '12px', color: '#888' }}>V2.5-Ultimate</p>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => { setCurrentPage(item.id); setSelectedItem(null); }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '8px', border: currentPage === item.id ? '1px solid rgba(139,92,246,0.3)' : '1px solid transparent', background: currentPage === item.id ? 'rgba(139,92,246,0.15)' : 'transparent', color: currentPage === item.id ? '#a78bfa' : '#888', cursor: 'pointer', transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span style={{ fontSize: '14px' }}>{item.label}</span>
                {item.new && <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', background: 'rgba(139,92,246,0.3)', color: '#a78bfa' }}>NEW</span>}
              </div>
              {item.count && <span style={{ fontSize: '12px', padding: '2px 8px', borderRadius: '9999px', background: 'rgba(255,255,255,0.1)' }}>{item.count}</span>}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: '32px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '12px', color: '#34d399', fontWeight: '500' }}>All Systems Online</span>
            </div>
            <div style={{ fontSize: '12px', color: '#888' }}>Health: 95% • Storage: 74%</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#888', marginBottom: '8px' }}>
            <span onClick={() => setCurrentPage('home')} style={{ cursor: 'pointer' }}>Home</span>
            {currentPage !== 'home' && (
              <>
                <span>/</span>
                <span style={{ color: '#ddd' }}>{pageTitle}</span>
              </>
            )}
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold' }}>{pageTitle}</h2>
        </div>
        {renderPage()}
      </div>
    </div>
  );
};

export default ArchonDashboard;
