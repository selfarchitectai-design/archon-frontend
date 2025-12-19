import { NextResponse } from 'next/server';

export const runtime = 'edge';

const N8N_WEBHOOK_BASE = 'https://selfarchitectai.app.n8n.cloud/webhook';

export async function GET() {
  // Dashboard özet verileri
  const dashboard = {
    summary: {
      activeWorkflows: 14,
      tasksCompleted: 1247,
      avgResponseTime: "89ms",
      uptime: "99.97%"
    },
    recentActivity: [
      { type: "deployment", message: "Lambda functions optimized", time: "2 hours ago" },
      { type: "alert", message: "Cost optimization completed", time: "5 hours ago" },
      { type: "task", message: "Trend analysis completed", time: "1 day ago" }
    ],
    quickActions: [
      { id: "analyze", label: "Run Analysis", endpoint: "/api/analyze" },
      { id: "deploy", label: "Deploy Update", endpoint: "/api/deploy" },
      { id: "report", label: "Generate Report", endpoint: "/api/report" }
    ]
  };

  return NextResponse.json(dashboard);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;

    // N8N webhook trigger
    if (action === 'trigger-workflow') {
      const response = await fetch(`${N8N_WEBHOOK_BASE}/archon/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Workflow triggered',
        n8nResponse: await response.json()
      });
    }

    return NextResponse.json({ success: true, action, payload });
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
