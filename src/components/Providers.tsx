'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '../config/wagmi'
import { UnlinkProvider as UnlinkReactProvider } from '@unlink-xyz/react'

const queryClient = new QueryClient()

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <WagmiProvider config={config}>
            <QueryClientProvider client={queryClient}>
                <UnlinkReactProvider
                    chainId={10143}
                    gatewayUrl="https://api.unlink.xyz"
                    poolAddress="0x0813DA0a10328e5ed617D37e514ac2f6fA49A254"
                    prover={{ artifactSource: { version: 'v6bad364c' } }}
                    autoSync={true}
                    syncInterval={5000}
                >
                    {children}
                </UnlinkReactProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
