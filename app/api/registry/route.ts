import { NextResponse } from 'next/server';

interface AtomStatus {
  id: string;
  version: string;
  status: 'healthy' | 'degraded' | 'failed';
  lastCheck: string;
  errorCount: number;
  fallbackVersion: string | null;
}

interface AtomRegistry {
  atoms: Record<string, AtomStatus>;
  lastUpdated: string;
}

// In-memory registry (replace with KV in production)
let registry: AtomRegistry = {
  atoms: {
    'health-gauge': {
      id: 'health-gauge',
      version: '1.0.0',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      fallbackVersion: null,
    },
    'quick-stats': {
      id: 'quick-stats',
      version: '1.0.0',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      fallbackVersion: null,
    },
    'performance-panel': {
      id: 'performance-panel',
      version: '1.0.0',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      fallbackVersion: null,
    },
    'network-topology': {
      id: 'network-topology',
      version: '1.0.0',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      fallbackVersion: null,
    },
    'component-cards': {
      id: 'component-cards',
      version: '1.0.0',
      status: 'healthy',
      lastCheck: new Date().toISOString(),
      errorCount: 0,
      fallbackVersion: null,
    },
  },
  lastUpdated: new Date().toISOString(),
};

export async function GET() {
  const healthyCount = Object.values(registry.atoms).filter(
    (a) => a.status === 'healthy'
  ).length;
  const totalCount = Object.keys(registry.atoms).length;

  return NextResponse.json({
    ...registry,
    summary: {
      total: totalCount,
      healthy: healthyCount,
      degraded: Object.values(registry.atoms).filter((a) => a.status === 'degraded').length,
      failed: Object.values(registry.atoms).filter((a) => a.status === 'failed').length,
      healthPercentage: Math.round((healthyCount / totalCount) * 100),
    },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { atomId, action, data } = body;

    if (!atomId || !action) {
      return NextResponse.json(
        { error: 'Missing atomId or action' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'update_status': {
        if (registry.atoms[atomId]) {
          registry.atoms[atomId] = {
            ...registry.atoms[atomId],
            status: data.status || registry.atoms[atomId].status,
            lastCheck: new Date().toISOString(),
            errorCount: data.errorCount ?? registry.atoms[atomId].errorCount,
          };
          registry.lastUpdated = new Date().toISOString();
        }
        break;
      }

      case 'report_error': {
        if (registry.atoms[atomId]) {
          const atom = registry.atoms[atomId];
          atom.errorCount += 1;
          atom.lastCheck = new Date().toISOString();

          // Auto-degrade after 3 errors
          if (atom.errorCount >= 3 && atom.status !== 'failed') {
            atom.status = 'degraded';
          }

          // Auto-fail after 5 errors
          if (atom.errorCount >= 5) {
            atom.status = 'failed';
          }

          registry.lastUpdated = new Date().toISOString();

          // Trigger N8N webhook for self-healing
          try {
            await fetch(process.env.N8N_WEBHOOK_URL || 'https://n8n.selfarchitectai.com/webhook/archon-health', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: 'atom_error',
                atomId,
                errorCount: atom.errorCount,
                status: atom.status,
                timestamp: new Date().toISOString(),
              }),
            });
          } catch {
            console.error('Failed to notify N8N');
          }
        }
        break;
      }

      case 'reset': {
        if (registry.atoms[atomId]) {
          registry.atoms[atomId] = {
            ...registry.atoms[atomId],
            status: 'healthy',
            errorCount: 0,
            lastCheck: new Date().toISOString(),
          };
          registry.lastUpdated = new Date().toISOString();
        }
        break;
      }

      case 'hot_swap': {
        if (registry.atoms[atomId] && data.version) {
          registry.atoms[atomId] = {
            ...registry.atoms[atomId],
            fallbackVersion: registry.atoms[atomId].version,
            version: data.version,
            status: 'healthy',
            errorCount: 0,
            lastCheck: new Date().toISOString(),
          };
          registry.lastUpdated = new Date().toISOString();
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      atom: registry.atoms[atomId],
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
