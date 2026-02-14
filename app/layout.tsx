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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                const stored = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored || (systemDark ? 'dark' : 'light');
                document.documentElement.classList.add(theme);
              })();
            `,
          }}
        />
      </head>

      <body className="min-h-screen bg-slate-50 text-slate-800 dark:bg-[#050b14] dark:text-slate-200 transition-colors duration-300 antialiased">
        {children}
      </body>
    </html>
  )
}