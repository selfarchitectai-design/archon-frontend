'use client';

import React, { useState } from 'react';
import { lambdaFunctions, type LambdaFunction } from '../data/services';

export default function LambdaCards() {
  const [selectedLambda, setSelectedLambda] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<string | null>(null);

  const testLambda = async (lambda: LambdaFunction) => {
    if (!lambda.url) return;
    
    setLoading(lambda.id);
    try {
      const response = await fetch(`https://${lambda.url}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health' })
      });
      const data = await response.json();
      setTestResults(prev => ({ ...prev, [lambda.id]: { success: true, data } }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [lambda.id]: { success: false, error: 'Connection failed' } }));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Lambda Functions</h2>
          <p className="text-sm text-slate-400">{lambdaFunctions.length} functions deployed</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-sm text-emerald-400">All Healthy</span>
        </div>
      </div>

      {/* Lambda Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {lambdaFunctions.map(lambda => (
          <div
            key={lambda.id}
            className={`bg-slate-800/30 rounded-xl border border-slate-700/50 overflow-hidden transition-all hover:border-cyan-500/30 ${
              selectedLambda === lambda.id ? 'ring-2 ring-cyan-500/50' : ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{lambda.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{lambda.name}</h3>
                    <p className="text-xs text-slate-500">{lambda.id}</p>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>

              <p className="text-sm text-slate-400 mb-4">{lambda.description}</p>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-500">Memory</div>
                  <div className="text-sm text-white">{lambda.memory}</div>
                </div>
                <div className="bg-slate-700/30 rounded-lg px-3 py-2">
                  <div className="text-xs text-slate-500">Runtime</div>
                  <div className="text-sm text-white">{lambda.runtime}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                {lambda.actions.map(action => (
                  <span key={action} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                    {action}
                  </span>
                ))}
              </div>

              {/* Test Button */}
              {lambda.url && (
                <button
                  onClick={() => testLambda(lambda)}
                  disabled={loading === lambda.id}
                  className="w-full py-2 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all disabled:opacity-50"
                >
                  {loading === lambda.id ? '⏳ Testing...' : '🔍 Test Health'}
                </button>
              )}

              {/* Test Result */}
              {testResults[lambda.id] && (
                <div className={`mt-3 p-3 rounded-lg text-xs ${
                  testResults[lambda.id].success 
                    ? 'bg-emerald-500/10 text-emerald-400' 
                    : 'bg-red-500/10 text-red-400'
                }`}>
                  {testResults[lambda.id].success 
                    ? `✅ Status: ${testResults[lambda.id].data?.status || 'OK'}`
                    : `❌ ${testResults[lambda.id].error}`
                  }
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
