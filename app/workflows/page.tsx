'use client'

export default function WorkflowsPage() {
  const templates = [
    {
      name: 'AI Email Assistant',
      description: 'Gmail → Claude → Auto-reply to customer emails',
      icon: '📧',
      difficulty: 'Beginner',
      n8nUrl: 'https://n8n.selfarchitectai.com/workflow/new?template=email-assistant',
      features: ['Auto-categorization', 'Sentiment analysis', 'Smart responses'],
    },
    {
      name: 'Smart Slack Bot',
      description: 'Slack → GitHub → Linear issue creation from messages',
      icon: '💬',
      difficulty: 'Intermediate',
      n8nUrl: 'https://n8n.selfarchitectai.com/workflow/new?template=slack-bot',
      features: ['Message parsing', 'Issue tracking', 'Auto-assignment'],
    },
    {
      name: 'GitHub Auto-Deployer',
      description: 'GitHub push → Build → Deploy to AWS Lambda',
      icon: '🚀',
      difficulty: 'Advanced',
      n8nUrl: 'https://n8n.selfarchitectai.com/workflow/new?template=github-deploy',
      features: ['CI/CD', 'Automated testing', 'Rollback support'],
    },
  ]

  const handleOpenN8N = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-4xl font-bold mb-8">Visual Workflow Builder</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Pre-built AI automation templates powered by N8N. Clone and customize any workflow.
        </p>

        {/* Template Gallery */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {templates.map((template) => (
            <div
              key={template.name}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-xl transition"
            >
              <div className="text-5xl mb-4">{template.icon}</div>
              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {template.description}
              </p>
              <div className="mb-4">
                <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                  {template.difficulty}
                </span>
              </div>
              <ul className="text-sm mb-4 space-y-1">
                {template.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-600 dark:text-gray-300">
                    <span className="mr-2">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => handleOpenN8N(template.n8nUrl)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Clone Template
              </button>
            </div>
          ))}
        </div>

        {/* N8N Integration Info */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900 dark:to-blue-900 p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">🎨 Build Your Own Workflow</h2>
          <p className="mb-6 text-gray-700 dark:text-gray-200">
            Connect to our N8N instance and create custom workflows with:
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">📦 100+ Integrations</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                GitHub, Slack, Gmail, Notion, AWS, OpenAI, and more
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h3 className="font-bold mb-2">🤖 AI-Powered</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Claude, GPT-4, and custom MCP tools built-in
              </p>
            </div>
          </div>
          <button
            onClick={() => handleOpenN8N('https://n8n.selfarchitectai.com')}
            className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            Open N8N Builder →
          </button>
        </div>

        {/* Active Workflows Status */}
        <div className="mt-12 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">📊 Your Active Workflows</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
              <div className="text-3xl font-bold text-green-600">14</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Active Workflows</div>
            </div>
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">2,341</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Executions Today</div>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">99.2%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Success Rate</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-900 rounded-lg">
              <div className="text-3xl font-bold text-yellow-600">$12</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Cost This Month</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
