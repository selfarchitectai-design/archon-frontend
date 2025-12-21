import { NextResponse } from 'next/server';

interface ErrorReport {
  atomId: string;
  error: {
    name: string;
    message: string;
    stack?: string;
  };
  componentStack?: string;
  timestamp: string;
  retryCount: number;
}

interface HealingPattern {
  pattern: RegExp;
  solution: string;
  autoFix: boolean;
  successRate: number;
}

// Known error patterns and solutions
const healingPatterns: HealingPattern[] = [
  {
    pattern: /Cannot read properties of undefined/,
    solution: 'Add null check or optional chaining',
    autoFix: true,
    successRate: 0.95,
  },
  {
    pattern: /fetch failed|NetworkError/,
    solution: 'Retry with exponential backoff',
    autoFix: true,
    successRate: 0.85,
  },
  {
    pattern: /Hydration failed/,
    solution: 'Wrap in dynamic import with ssr: false',
    autoFix: false,
    successRate: 0.90,
  },
  {
    pattern: /Invalid hook call/,
    solution: 'Check component is client-side only',
    autoFix: false,
    successRate: 0.80,
  },
  {
    pattern: /Module not found/,
    solution: 'Check import paths and dependencies',
    autoFix: false,
    successRate: 0.75,
  },
];

// In-memory healing history (replace with DynamoDB in production)
const healingHistory: Array<{
  atomId: string;
  error: string;
  solution: string;
  success: boolean;
  timestamp: string;
}> = [];

export async function POST(request: Request) {
  try {
    const report: ErrorReport = await request.json();
    const { atomId, error, timestamp, retryCount } = report;

    // Find matching pattern
    const matchingPattern = healingPatterns.find((p) =>
      p.pattern.test(error.message)
    );

    let healingAction = {
      atomId,
      action: 'none',
      solution: 'Unknown error - manual intervention required',
      autoFixApplied: false,
      shouldRetry: retryCount < 3,
      confidence: 0,
    };

    if (matchingPattern) {
      healingAction = {
        atomId,
        action: matchingPattern.autoFix ? 'auto_fix' : 'suggest',
        solution: matchingPattern.solution,
        autoFixApplied: matchingPattern.autoFix,
        shouldRetry: true,
        confidence: matchingPattern.successRate,
      };

      // Log to healing history
      healingHistory.push({
        atomId,
        error: error.message,
        solution: matchingPattern.solution,
        success: matchingPattern.autoFix,
        timestamp,
      });

      // If auto-fix, apply recovery action
      if (matchingPattern.autoFix) {
        // Update atom registry
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ''}/api/registry`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            atomId,
            action: 'update_status',
            data: {
              status: 'degraded',
              errorCount: retryCount,
            },
          }),
        });

        // Trigger N8N self-heal workflow
        try {
          const n8nUrl = process.env.N8N_SELF_HEAL_WEBHOOK || 'https://n8n.selfarchitectai.com/webhook/self-heal';
          await fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'self_heal_triggered',
              atomId,
              error: error.message,
              solution: matchingPattern.solution,
              confidence: matchingPattern.successRate,
              timestamp: new Date().toISOString(),
            }),
          });
        } catch {
          console.error('Failed to trigger N8N self-heal workflow');
        }
      }
    } else {
      // Unknown error - try AI analysis if available
      if (process.env.ANTHROPIC_API_KEY) {
        try {
          const aiAnalysis = await analyzeWithAI(error);
          if (aiAnalysis) {
            healingAction = {
              ...healingAction,
              action: 'ai_analysis',
              solution: aiAnalysis.solution,
              confidence: aiAnalysis.confidence,
            };
          }
        } catch {
          console.error('AI analysis failed');
        }
      }
    }

    return NextResponse.json({
      success: true,
      healing: healingAction,
      history: healingHistory.slice(-10), // Last 10 healing actions
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Return healing stats and history
  const stats = {
    totalHeals: healingHistory.length,
    successfulHeals: healingHistory.filter((h) => h.success).length,
    successRate: healingHistory.length
      ? (healingHistory.filter((h) => h.success).length / healingHistory.length) * 100
      : 0,
    patterns: healingPatterns.length,
    recentHistory: healingHistory.slice(-20),
  };

  return NextResponse.json(stats);
}

// AI Analysis function (uses Claude API)
async function analyzeWithAI(error: { name: string; message: string; stack?: string }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Analyze this JavaScript/React error and provide a solution:

Error: ${error.name}
Message: ${error.message}
Stack: ${error.stack?.slice(0, 500) || 'Not available'}

Respond in JSON format:
{
  "rootCause": "brief explanation",
  "solution": "specific fix",
  "confidence": 0.0-1.0,
  "autoFixable": true/false
}`,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data.content?.[0]?.text;
    
    if (content) {
      try {
        return JSON.parse(content);
      } catch {
        return { solution: content, confidence: 0.5 };
      }
    }
  } catch {
    console.error('AI analysis request failed');
  }

  return null;
}
