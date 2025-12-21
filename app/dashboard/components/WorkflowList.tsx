'use client';

import React, { useState, useMemo } from 'react';
import { workflows, workflowCategories, type Workflow } from '../data/workflows';

interface WorkflowListProps {
  onSelect?: (workflow: Workflow) => void;
}

export default function WorkflowList({ onSelect }: WorkflowListProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(wf => {
      const matchesCategory = selectedCategory === 'all' || wf.category === selectedCategory;
      const matchesSearch = wf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           wf.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm]);

  const activeCount = workflows.filter(w => w.active).length;
  const deprecatedCount = workflows.filter(w => w.category === 'deprecated').length;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <div className="text-2xl font-bold text-white">{workflows.length}</div>
          <div className="text-sm text-slate-400">Total Workflows</div>
        </div>
        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/30">
          <div className="text-2xl font-bold text-emerald-400">{activeCount}</div>
          <div className="text-sm text-slate-400">Active</div>
        </div>
        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/30">
          <div className="text-2xl font-bold text-amber-400">{deprecatedCount}</div>
          <div className="text-sm text-slate-400">Deprecated</div>
        </div>
        <div className="bg-cyan-500/10 rounded-xl p-4 border border-cyan-500/30">
          <div className="text-2xl font-bold text-cyan-400">{workflows.filter(w => w.zeroError).length}</div>
          <div className="text-sm text-slate-400">Zero Error</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search workflows..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
        />
        <div className="flex gap-2 overflow-x-auto pb-2">
          {workflowCategories.slice(0, 6).map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow List */}
      <div className="grid gap-4">
        {filteredWorkflows.map(workflow => (
          <div
            key={workflow.id}
            className={`bg-slate-800/30 rounded-xl border transition-all cursor-pointer ${
              workflow.active 
                ? 'border-slate-700/50 hover:border-cyan-500/30' 
                : 'border-red-500/20 opacity-60'
            }`}
            onClick={() => setExpandedId(expandedId === workflow.id ? null : workflow.id)}
          >
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{workflow.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{workflow.name}</h3>
                      {workflow.zeroError && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                          Zero Error
                        </span>
                      )}
                      {workflow.version && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                          {workflow.version}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{workflow.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm text-slate-300">{workflow.interval}</div>
                    <div className="text-xs text-slate-500">{workflow.triggers.join(', ')}</div>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${workflow.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedId === workflow.id && (
              <div className="px-4 pb-4 pt-2 border-t border-slate-700/50">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Nodes</h4>
                    <div className="flex flex-wrap gap-2">
                      {workflow.nodes.map((node, i) => (
                        <span key={i} className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded">
                          {node}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">Connections</h4>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(workflow.connections).map((conn, i) => (
                        <span key={i} className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded">
                          {conn}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
