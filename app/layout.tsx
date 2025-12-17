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
            <h1 className="text-2xl font-bold">ARCHON</h1>
            <div className="space-x-4">
              <a href="/" className="hover:text-blue-400">Home</a>
              <a href="/modes" className="hover:text-blue-400">Persona Modes</a>
              <a href="/workflows" className="hover:text-blue-400">Workflows</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
