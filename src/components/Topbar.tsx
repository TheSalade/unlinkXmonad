'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { Shield, ShieldAlert, Wallet } from 'lucide-react'
import { injected } from 'wagmi/connectors'

export function Topbar() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const { walletExists, ready } = useUnlink()
    const { burners } = useBurner()

    const isInitialized = walletExists && ready
    const burnerAddress = burners[0]?.address

    const truncate = (str: string) => str.slice(0, 6) + '...' + str.slice(-4)

    return (
        <header className="h-20 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
            <div className="flex items-center gap-6">
            </div>

            <div className="flex items-center gap-4">
                {/* Unlink Shield Status */}
                <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                    {isInitialized ? (
                        <>
                            <Shield className="w-4 h-4 text-emerald-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-emerald-400 font-medium tracking-wider">SHIELD ACTIVE</span>
                                <span className="text-[10px] text-zinc-500">Burner: {burnerAddress ? truncate(burnerAddress) : 'Loading...'}</span>
                            </div>
                        </>
                    ) : (
                        <>
                            <ShieldAlert className="w-4 h-4 text-rose-400" />
                            <div className="flex flex-col">
                                <span className="text-xs text-rose-400 font-medium tracking-wider">UNPROTECTED</span>
                                <span className="text-[10px] text-zinc-500">No Privacy Pool</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Wallet Connect */}
                <button
                    onClick={() => isConnected ? disconnect() : connect({ connector: injected() })}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                >
                    <Wallet className="w-4 h-4" />
                    {isConnected && address ? truncate(address) : 'Connect Wallet'}
                </button>
            </div>
        </header>
    )
}
