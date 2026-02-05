import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'yourdigital2win',
  description: 'Your personal digital intelligence',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  )
}
