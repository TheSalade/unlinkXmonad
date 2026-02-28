import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/Providers'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Unlink DeFi - Privacy First',
  description: 'A privacy-first DeFi application powered by Unlink',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} bg-black text-white antialiased selection:bg-emerald-500/30 min-h-screen overflow-x-hidden`} suppressHydrationWarning>
        {/* Abstract background blobs for premium aesthetic */}
        <div className="fixed inset-0 z-[-1] pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/40 rounded-full blur-[120px]" />
          <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-cyan-900/20 rounded-full blur-[150px]" />
          <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-blue-900/30 rounded-full blur-[120px]" />
        </div>

        <Providers>
          <div className="flex w-full min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 flex flex-col min-h-screen relative z-0">
              <Topbar />
              <div className="p-8 max-w-7xl mx-auto w-full">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
