'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '../config/wagmi'
import { UnlinkProvider } from '../context/UnlinkContext'
import { UnlinkProvider as UnlinkReactProvider } from '@unlink-xyz/react'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <UnlinkReactProvider chain="monad-testnet" autoSync={true}>
                    <UnlinkProvider>
                        {children}
                    </UnlinkProvider>
                </UnlinkReactProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
