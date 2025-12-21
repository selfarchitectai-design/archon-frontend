// Static Lambda data for SSG
export interface LambdaFunction {
  id: string;
  name: string;
  icon: string;
  memory: string;
  runtime: string;
  url?: string;
  description: string;
  actions: string[];
}

export const lambdaFunctions: LambdaFunction[] = [
  { 
    id: 'archon-brain', 
    name: 'ARCHON Brain', 
    icon: '🧠', 
    memory: '512MB', 
    runtime: 'Python 3.11', 
    url: 'jl67xd5pckkhjwdmnvhco2bg440grmtu.lambda-url.us-east-1.on.aws', 
    description: 'Ana AI işleme merkezi. Claude Haiku ile entegre.',
    actions: ['health', 'process', 'analyze'] 
  },
  { 
    id: 'archon-actions', 
    name: 'ARCHON Actions', 
    icon: '⚡', 
    memory: '256MB', 
    runtime: 'Python 3.11', 
    url: 'qtomhtef66vivt7wzyit5nuzve0nzvbk.lambda-url.us-east-1.on.aws', 
    description: 'Action execution engine. Slack bildirimleri.',
    actions: ['health', 'notify', 'execute'] 
  },
  { 
    id: 'trend-collector', 
    name: 'Trend Collector', 
    icon: '📈', 
    memory: '256MB', 
    runtime: 'Python 3.11', 
    url: 'mjfhxhcsi2u3o2pqhkj55rrlge0ucncm.lambda-url.us-east-1.on.aws', 
    description: 'Trend veri toplama ve analiz servisi.',
    actions: ['health', 'full_pipeline', 'collect'] 
  },
  { 
    id: 'event-intake', 
    name: 'Event Intake', 
    icon: '📥', 
    memory: '128MB', 
    runtime: 'Python 3.11', 
    url: 'wbhdgr46itplcvosjioitclvga0mxlec.lambda-url.us-east-1.on.aws', 
    description: 'Event alım servisi.',
    actions: ['health', 'create_update', 'intake'] 
  },
  { 
    id: 'archon-api', 
    name: 'ARCHON API', 
    icon: '🌐', 
    memory: '256MB', 
    runtime: 'Node.js 18', 
    description: 'Ana API gateway.',
    actions: ['health', 'route', 'auth'] 
  },
  { 
    id: 'health-check', 
    name: 'Health Check', 
    icon: '💚', 
    memory: '128MB', 
    runtime: 'Python 3.11', 
    description: 'Sistem sağlık kontrolü.',
    actions: ['check', 'report'] 
  }
];

export const atomComponents = [
  { id: 'health-gauge', name: 'HealthGauge', icon: '📊', description: 'Sistem sağlık göstergesi.', status: 'active' },
  { id: 'quick-stats', name: 'QuickStats', icon: '⚡', description: 'Hızlı metrik kartları.', status: 'active' },
  { id: 'performance-panel', name: 'PerformancePanel', icon: '📈', description: 'Performans paneli.', status: 'active' },
  { id: 'network-topology', name: 'NetworkTopology', icon: '🔗', description: 'Ağ topolojisi.', status: 'active' },
  { id: 'component-cards', name: 'ComponentCards', icon: '🎴', description: 'Servis durum kartları.', status: 'active' },
  { id: 'atom-error-boundary', name: 'AtomErrorBoundary', icon: '🛡️', description: 'Hata yakalama wrapper.', status: 'active' }
];

export const awsServices = [
  { id: 'dynamodb', name: 'DynamoDB', icon: '🗄️', details: '3 tables', description: 'NoSQL veritabanı.' },
  { id: 'route53', name: 'Route 53', icon: '🌐', details: 'selfarchitectai.com', description: 'DNS yönetimi.' },
  { id: 'secrets-manager', name: 'Secrets Manager', icon: '🔐', details: '8 secrets', description: 'Credential yönetimi.' },
  { id: 'cloudwatch', name: 'CloudWatch', icon: '📊', details: '5 alarms', description: 'Monitoring ve logging.' },
  { id: 'iam', name: 'IAM', icon: '👤', details: '4 roles', description: 'Access Management.' },
  { id: 's3', name: 'S3', icon: '📦', details: '2 buckets', description: 'Object storage.' }
];
