'use client'

import { useEffect, useState, useRef } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { Shield, ShieldAlert, Wallet, Copy, Check } from 'lucide-react'
import { injected } from 'wagmi/connectors'

export function Topbar() {
    const { address, isConnected } = useAccount()
    const { connect } = useConnect()
    const { disconnect } = useDisconnect()
    const { walletExists, ready, importWallet, createAccount } = useUnlink()
    const { burners, createBurner } = useBurner()
    const [mounted, setMounted] = useState(false)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMounted(true)
    }, [])

    const isInitialized = walletExists && ready
    const burnerAddress = burners[0]?.address
    const isRestoring = useRef(false)

    // Auto-reconnect Unlink session from local storage on refresh
    useEffect(() => {
        const autoConnect = async () => {
            if (isInitialized || isRestoring.current) return

            const savedMnemonic = localStorage.getItem('__unlink_session_mnemonic')
            if (savedMnemonic && isConnected) {
                isRestoring.current = true
                try {
                    await importWallet(savedMnemonic)
                    await createAccount(0)
                    await createBurner(0)
                } catch (e: any) {
                    // If the SDK throws because the wallet is already loaded (e.g. Strict Mode double fire), ignore it
                    if (e?.message?.includes("Wallet exists") || e?.message?.includes("already exists")) {
                        console.log("Wallet already loaded in memory.")
                        return
                    }
                    console.error("Global auto-connect failed:", e)
                    localStorage.removeItem('__unlink_session_mnemonic')
                } finally {
                    isRestoring.current = false
                }
            }
        }
        autoConnect()
    }, [isInitialized, isConnected, importWallet, createAccount, createBurner])

    const truncate = (str: string) => str.slice(0, 6) + '...' + str.slice(-4)

    const handleCopy = () => {
        if (!burnerAddress) return
        navigator.clipboard.writeText(burnerAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <header className="h-20 border-b border-white/10 bg-black/20 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-50">
            <div className="flex items-center gap-6">
            </div>

            <div className="flex items-center gap-4">
                {mounted && (
                    <>
                        {/* Unlink Shield Status */}
                        <div className="flex items-center gap-3 px-4 py-2 rounded-full border border-white/10 bg-white/5">
                            {isInitialized ? (
                                <>
                                    <Shield className="w-4 h-4 text-emerald-400" />
                                    <div className="flex flex-col">
                                        <span className="text-xs text-emerald-400 font-medium tracking-wider">SHIELD ACTIVE</span>
                                        <div className="flex items-center gap-1 group/copy">
                                            <span className="text-[10px] text-zinc-500">Burner: {burnerAddress ? truncate(burnerAddress) : 'Loading...'}</span>
                                            {burnerAddress && (
                                                <button onClick={handleCopy} className="text-zinc-500 hover:text-emerald-400 opacity-0 group-hover/copy:opacity-100 transition-all focus:outline-none ml-1">
                                                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            )}
                                        </div>
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
                    </>
                )}
            </div>
        </header>
    )
}
