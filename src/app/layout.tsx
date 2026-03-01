import type { Metadata } from 'next'
import { Roboto_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from '../components/Providers'
import { Sidebar } from '../components/Sidebar'
import { Topbar } from '../components/Topbar'

const mono = Roboto_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nullifier - Privacy First',
  description: 'A privacy-first DeFi application powered by Nullifier',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${mono.className} bg-[#0a0a0a] text-white antialiased selection:bg-[#e0e0e0]/20 min-h-screen overflow-x-hidden`} suppressHydrationWarning>
        <Providers>
          <div className="flex w-full min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 flex flex-col min-h-screen relative z-0 border-l border-[#e0e0e0]/20">
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
