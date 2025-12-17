'use client'

import { useState } from 'react'

type Mode = 'executive' | 'cto' | 'operations' | 'health'

export default function ModesPage() {
  const [selectedMode, setSelectedMode] = useState<Mode>('executive')
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)

  const modes = {
    executive: {
      title: 'Executive Mode',
      icon: '👔',
      description: 'Strategic insights, high-level summaries, business metrics',
      color: 'blue',
    },
    cto: {
      title: 'CTO Mode',
      icon: '🔧',
      description: 'Technical architecture, system design, performance metrics',
      color: 'purple',
    },
    operations: {
      title: 'Operations Mode',
      icon: '⚡',
      description: 'Real-time monitoring, incident response, task automation',
      color: 'green',
    },
    health: {
      title: 'Health Mode',
      icon: '💚',
      description: 'System status, cost tracking, resource utilization',
      color: 'emerald',
    },
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResponse('')

    try {
      // Map modes to N8N webhook endpoints
      const webhookMap: Record<Mode, string> = {
        executive: 'daily',
        cto: 'decisions',
        operations: 'decision-action',
        health: 'archon/health',
      }

      const webhook = webhookMap[selectedMode]
      
      // Call N8N directly
      const res = await fetch(`https://n8n.selfarchitectai.com/webhook/${webhook}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode: selectedMode, timestamp: new Date().toISOString() }),
      })

      const data = await res.json()
      setResponse(data.message || data.response || JSON.stringify(data, null, 2))
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Persona Modes</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          ARCHON adapts its intelligence to your role. Select a mode and ask questions.
        </p>

        {/* Mode Selection */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {(Object.keys(modes) as Mode[]).map((mode) => {
            const m = modes[mode]
            const isSelected = selectedMode === mode
            return (
              <button
                key={mode}
                onClick={() => setSelectedMode(mode)}
                className={`p-6 rounded-lg border-2 transition ${
                  isSelected
                    ? `border-${m.color}-600 bg-${m.color}-50 dark:bg-${m.color}-900`
                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400'
                }`}
              >
                <div className="text-4xl mb-2">{m.icon}</div>
                <h3 className="font-bold mb-2">{m.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {m.description}
                </p>
              </button>
            )
          })}
        </div>

        {/* Query Form */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block font-bold mb-2">
                Ask ARCHON ({modes[selectedMode].title})
              </label>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full p-4 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                rows={4}
                placeholder="Enter your query..."
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Submit Query'}
            </button>
          </form>

          {response && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <h3 className="font-bold mb-2">Response:</h3>
              <pre className="whitespace-pre-wrap text-sm">{response}</pre>
            </div>
          )}
        </div>

        {/* Live Examples */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold mb-2">📊 Example Queries (Executive)</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
              <li>• What's our system health score?</li>
              <li>• Show me cost trends for last 30 days</li>
              <li>• Executive summary of today's events</li>
            </ul>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h3 className="font-bold mb-2">🔧 Example Queries (CTO)</h3>
            <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-300">
              <li>• Analyze Lambda performance bottlenecks</li>
              <li>• Show DynamoDB table statistics</li>
              <li>• Review CloudFormation stack status</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
