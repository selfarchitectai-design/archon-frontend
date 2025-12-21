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
      <body className="bg-slate-900">{children}</body>
    </html>
  )
}
