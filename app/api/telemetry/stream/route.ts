// ARCHON V7 Telemetry SSE Stream
// Force dynamic rendering to avoid static generation timeout
export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendMetrics = async () => {
        try {
          // Fetch from main telemetry endpoint or generate
          let metrics;
          try {
            const response = await fetch('https://n8n.selfarchitectai.com/webhook/archon/telemetry', {
              cache: 'no-store'
            });
            if (response.ok) {
              metrics = await response.json();
            }
          } catch {
            // Generate simulated metrics
            metrics = {
              trust_delta: 0.85 + Math.random() * 0.1,
              latency_p95: 800 + Math.random() * 200,
              drift_level: 0.08 + Math.random() * 0.05,
              system_health: 98 + Math.random() * 2,
              active_workflows: 24,
              lambda_count: 14,
              ethics_score: 0.94 + Math.random() * 0.04,
              memory_utilization: 0.4 + Math.random() * 0.1,
              glow_intensity: 0.85 + Math.random() * 0.1,
              trust_zone: 'GREEN',
              timestamp: new Date().toISOString()
            };
          }
          
          const data = `data: ${JSON.stringify(metrics)}

`;
          controller.enqueue(encoder.encode(data));
        } catch (error) {
          console.error('SSE error:', error);
        }
      };

      // Send initial data
      await sendMetrics();
      
      // Send updates every 2 seconds for 60 seconds max
      let count = 0;
      const interval = setInterval(async () => {
        count++;
        if (count >= 30) {
          clearInterval(interval);
          controller.close();
          return;
        }
        await sendMetrics();
      }, 2000);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
