import { NextRequest, NextResponse } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  // Simulated analytics - in production, fetch from actual analytics service
  const analytics = {
    pageViews: {
      today: Math.floor(Math.random() * 500) + 100,
      week: Math.floor(Math.random() * 3000) + 500,
      month: Math.floor(Math.random() * 10000) + 2000
    },
    performance: {
      fcp: (Math.random() * 1.5 + 0.5).toFixed(2) + 's',
      lcp: (Math.random() * 2 + 1).toFixed(2) + 's',
      cls: (Math.random() * 0.1).toFixed(3),
      ttfb: (Math.random() * 200 + 50).toFixed(0) + 'ms'
    },
    deployments: {
      total: 47,
      successful: 45,
      failed: 2,
      lastDeploy: new Date().toISOString()
    },
    bandwidth: {
      used: '2.3 GB',
      limit: '100 GB',
      percentage: 2.3
    }
  };

  return NextResponse.json(analytics, {
    headers: { 'Cache-Control': 'max-age=60' }
  });
}
