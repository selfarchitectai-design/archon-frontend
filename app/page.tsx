'use client'

import { motion } from 'framer-motion'
import { 
  Brain, 
  Activity, 
  Settings,
  ExternalLink,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'

import { SystemOverview } from './components/SystemOverview'
import { ArchonHealthMonitor } from './components/ArchonHealthMonitor'
import { SelfHealConsole } from './components/SelfHealConsole'
import { CostPanel } from './components/CostPanel'
import { ReportPanel } from './components/ReportPanel'
import { MCPToolsPanel } from './components/MCPToolsPanel'
import { VerifyPanel } from './components/VerifyPanel'
import { TrustAnalyzer } from './components/TrustAnalyzer'

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-[1800px] mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-4">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                className="relative"
              >
                <div className="absolute inset-0 bg-archon-accent/20 rounded-xl blur-xl" />
                <div className="relative p-3 rounded-xl bg-gradient-to-br from-archon-accent/20 to-archon-purple/20 border border-archon-accent/30">
                  <Brain className="w-8 h-8 text-archon-accent" />
                </div>
              </motion.div>
              
              <div>
                <h1 className="text-2xl font-bold font-display">
                  <span className="gradient-text">ARCHON</span>
                  <span className="text-archon-text-dim text-lg ml-2">V3.6</span>
                </h1>
                <p className="text-sm text-archon-text-dim">Enterprise AI Command Center</p>
              </div>
            </div>

            {/* Status & Actions */}
            <div className="flex items-center gap-4">
              {/* Live Status */}
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/5">
                <span className="status-dot status-healthy" />
                <span className="text-sm text-archon-text-dim">System</span>
                <span className="text-sm font-medium text-archon-success">OPERATIONAL</span>
              </div>

              {/* External Links */}
              <a
                href="https://n8n.selfarchitectai.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-archon-panel hover:bg-archon-panel-light transition-colors"
              >
                <Activity className="w-4 h-4 text-archon-accent" />
                <span className="text-sm">N8N</span>
                <ExternalLink className="w-3 h-3 text-archon-text-dim" />
              </a>

              {/* Mobile menu */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded-lg bg-archon-panel"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-4 py-6">
        {/* Top Row - Overview & Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <SystemOverview />
          <ArchonHealthMonitor />
        </div>

        {/* Trust Analyzer - Featured Section */}
        <div className="mb-6">
          <TrustAnalyzer />
        </div>

        {/* Middle Row - Operations */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <SelfHealConsole />
          <CostPanel />
          <ReportPanel />
        </div>

        {/* Bottom Row - Tools & Verification */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MCPToolsPanel />
          <VerifyPanel />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-sm text-archon-text-dim">
                ARCHON V3.6 © 2026 SelfArchitectAI
              </span>
              <span className="w-1 h-1 rounded-full bg-archon-text-dim" />
              <span className="text-sm text-archon-text-dim">
                GPT-5 Integration Ready
              </span>
            </div>
            
            <div className="flex items-center gap-6 text-sm text-archon-text-dim">
              <span className="font-mono">/archon/health</span>
              <span className="font-mono">/dashboard-api</span>
              <span className="font-mono">/api/archon/trust</span>
              <span className="font-mono">/webhook/mcp</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
