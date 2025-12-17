export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="container mx-auto">
        <section className="text-center py-20">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            ARCHON V2.2 Ultimate
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8">
            Self-Evolving AI Operations Platform
          </p>
          <div className="flex justify-center gap-4 mb-12">
            <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">99.1/100</div>
              <div className="text-sm">Performance</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-lg">
              <div className="text-3xl font-bold text-purple-600">99.5/100</div>
              <div className="text-sm">Autonomy</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-600">95%</div>
              <div className="text-sm">Health</div>
            </div>
          </div>
          <div className="flex justify-center gap-4">
            <a
              href="/modes"
              className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              Try Persona Modes
            </a>
            <a
              href="/workflows"
              className="bg-purple-600 text-white px-8 py-3 rounded-lg hover:bg-purple-700 transition"
            >
              Build Workflows
            </a>
          </div>
        </section>

        <section className="grid md:grid-cols-3 gap-8 py-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">🎯 Persona Modes</h3>
            <p className="text-gray-600 dark:text-gray-300">
              AI that adapts to your role: Executive, CTO, Operations, or Health monitoring
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">🎨 Visual Workflows</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Drag & drop AI automation with N8N integration. No code required.
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="text-xl font-bold mb-4">⚡ Real-time Ops</h3>
            <p className="text-gray-600 dark:text-gray-300">
              45 Lambda functions, 12 DynamoDB tables, 14 active workflows
            </p>
          </div>
        </section>

        <section className="py-12 text-center">
          <h2 className="text-3xl font-bold mb-6">Architecture</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg">
            <pre className="text-left text-sm overflow-x-auto">
{`┌─────────────────────────────────────┐
│  ARCHON Platform - 19 Layers        │
├─────────────────────────────────────┤
│  L19: Non-Profit Engine             │
│  L18: Predictive Evolution          │
│  L17: Customer Engagement           │
│  L16: Financial & Business          │
│  L15: Security Fortress             │
│  L14: Self-Deploy                   │
│  L13: Ultra Dashboard               │
│  L12: Knowledge Layer               │
│  L11: Multi-Tenant                  │
│  L10: Deployment Factory            │
│  L9:  Creation Engine               │
│  L8:  Business Layer                │
│  L7:  Client Layer                  │
│  L6:  Self-Evolution                │
│  L5:  Human-in-the-Loop             │
│  L4:  Agents Layer                  │
│  L3:  Hypernetwork Engine           │
│  L2:  Learning & Memory             │
│  L1:  Neural Network                │
│  L0:  Core Runtime                  │
└─────────────────────────────────────┘`}
            </pre>
          </div>
        </section>
      </div>
    </main>
  )
}
