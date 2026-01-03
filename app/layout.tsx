import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ARCHON V3.6 | Enterprise AI Command Center',
  description: 'Autonomous AI orchestration platform with self-healing capabilities and trust-based decision engine',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-archon-bg text-archon-text min-h-screen antialiased">
        <Providers>
          {/* Background grid effect */}
          <div className="fixed inset-0 grid-bg pointer-events-none opacity-50" />
          
          {/* Gradient orbs */}
          <div className="fixed top-0 left-1/4 w-96 h-96 bg-archon-accent/5 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-archon-purple/5 rounded-full blur-3xl pointer-events-none" />
          
          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  )
}
