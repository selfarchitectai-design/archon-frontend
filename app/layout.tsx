import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARCHON - AI Platform',
  description: 'Self-Evolving AI Operations Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <nav className="bg-gray-900 text-white p-4">
          <div className="container mx-auto flex justify-between items-center">
            <a href="/" className="text-2xl font-bold hover:text-purple-400 transition-colors">
              ARCHON<span className="text-purple-400">.ai</span>
            </a>
            <div className="flex items-center space-x-6">
              <a href="/demos" className="hover:text-purple-400 transition-colors font-medium">Demos</a>
              <a href="/case-studies" className="hover:text-purple-400 transition-colors font-medium">Case Studies</a>
              <a href="/modes" className="hover:text-purple-400 transition-colors font-medium">Persona Modes</a>
              <a href="/workflows" className="hover:text-purple-400 transition-colors font-medium">Workflows</a>
              <a href="/pricing" className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg hover:scale-105 transition-transform font-semibold">
                Get Started
              </a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
