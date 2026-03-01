'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { LogOut, RefreshCw, AlertTriangle } from 'lucide-react'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { useReadContract } from 'wagmi'
import { formatUnits, erc20Abi } from 'viem'
import { TOKENS } from '../../config/tokens'
import Link from 'next/link'

export default function SweepPage() {
    const { walletExists, ready } = useUnlink()
    const { sweepToPool, burners } = useBurner()
    const isInitialized = walletExists && ready
    const burnerAddress = burners[0]?.address
    const [isSweeping, setIsSweeping] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    const { data: usdtBalance, refetch: refetchUsdt } = useReadContract({
        address: TOKENS.USDTm.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: burnerAddress ? [burnerAddress as `0x${string}`] : undefined,
        query: { enabled: !!burnerAddress }
    })

    const { data: ulnkBalance, refetch: refetchUlnk } = useReadContract({
        address: TOKENS.ULNKm.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: burnerAddress ? [burnerAddress as `0x${string}`] : undefined,
        query: { enabled: !!burnerAddress }
    })

    const { data: usdcBalance, refetch: refetchUsdc } = useReadContract({
        address: TOKENS.USDCm.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: burnerAddress ? [burnerAddress as `0x${string}`] : undefined,
        query: { enabled: !!burnerAddress }
    })

    const handleSweep = async () => {
        setIsSweeping(true)
        setStatus("Sweeping USDTm back to Pool...")

        try {
            if (!burnerAddress) throw new Error("Burner account not found.")

            if (usdtBalance && (usdtBalance as bigint) > BigInt(0)) {
                await sweepToPool.execute({ index: 0, params: { token: TOKENS.USDTm.address } })
            }

            setStatus("Sweeping ULNKm back to Pool...")
            if (ulnkBalance && (ulnkBalance as bigint) > BigInt(0)) {
                await sweepToPool.execute({ index: 0, params: { token: TOKENS.ULNKm.address } })
            }

            setStatus("Sweeping USDCm back to Pool...")
            if (usdcBalance && (usdcBalance as bigint) > BigInt(0)) {
                await sweepToPool.execute({ index: 0, params: { token: TOKENS.USDCm.address } })
            }

            refetchUsdt()
            refetchUlnk()
            refetchUsdc()

            setStatus("Sweep complete! Funds returned to privacy pool.")
            setTimeout(() => {
                setIsSweeping(false)
                setStatus(null)
            }, 3000)

        } catch (error: any) {
            console.error("Sweep failed:", error)
            setStatus(`Sweep failed: ${error.message || "Unknown error"}`)
            setTimeout(() => {
                setIsSweeping(false)
                setStatus(null)
            }, 5000)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Sweep to Pool</h1>
                <p className="text-[#e0e0e0]/80">End your privacy session. Return remaining assets from the burner back to the anonymous Unlink Pool.</p>
                <PrivacyShield />
            </div>

            {!isInitialized && (
                <div className="mb-8 p-6 border border-rose-900/40 text-center bg-[#0a0a0a]">
                    <h3 className="text-sm font-mono text-rose-600/80 mb-2 uppercase">Privacy Shield Not Active</h3>
                    <p className="text-[#e0e0e0]/60 mb-6 text-sm">You must initialize your in-memory burner account before sweeping funds.</p>
                    <Link href="/connect" className="inline-flex items-center gap-2 px-6 py-3 border border-rose-900/40 text-rose-600/80 font-mono text-xs uppercase hover:bg-rose-950/20 transition-colors">
                        Initialize Shield
                    </Link>
                </div>
            )}

            <div className="p-8 border border-[#e0e0e0]/20 bg-[#0a0a0a] relative mt-12">
                <div className="p-4 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex gap-3 mb-8">
                    <AlertTriangle className="w-5 h-5 text-rose-600/80 shrink-0" />
                    <p className="text-[10px] font-mono uppercase text-[#e0e0e0]/60">
                        Sweeping deposits all remaining assets back into the unshielded pool. Once swept, you can withdraw them back to your main public identity whenever you choose.
                    </p>
                </div>

                {status && (
                    <div className={`mb-6 p-4 border text-sm font-mono uppercase text-center ${status.includes('fail') || status.includes('Error') ? 'bg-rose-950/20 text-rose-600/80 border-rose-900/40' : 'bg-emerald-900/20 text-emerald-600/80 border-emerald-900/50'} animate-in fade-in slide-in-from-top-2 duration-300`}>
                        {status}
                    </div>
                )}

                <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e0e0e0]/20">
                    <h3 className="text-[#e0e0e0]/60 font-mono text-xs uppercase tracking-widest">Assets in Burner [0]</h3>
                </div>

                <div className="space-y-2 mb-8">
                    <div className="p-4 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex items-center justify-between hover:border-[#e0e0e0]/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center font-mono text-xs text-emerald-600/80 bg-emerald-950/30">U</div>
                            <div>
                                <p className="font-mono text-sm uppercase text-white">USDTm</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-lg text-white">
                                {usdtBalance !== undefined ? Number(formatUnits(usdtBalance as bigint, TOKENS.USDTm.decimals)).toFixed(2) : '0.00'}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex items-center justify-between hover:border-[#e0e0e0]/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center font-mono text-xs text-[#e0e0e0] bg-indigo-950/30">W</div>
                            <div>
                                <p className="font-mono text-sm uppercase text-white">ULNKm</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-lg text-white">
                                {ulnkBalance !== undefined ? Number(formatUnits(ulnkBalance as bigint, TOKENS.ULNKm.decimals)).toFixed(4) : '0.00'}
                            </p>
                        </div>
                    </div>

                    <div className="p-4 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex items-center justify-between hover:border-[#e0e0e0]/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 flex items-center justify-center font-mono text-xs text-blue-600/80 bg-blue-900/20">C</div>
                            <div>
                                <p className="font-mono text-sm uppercase text-white">USDCm</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-mono text-lg text-white">
                                {usdcBalance !== undefined ? Number(formatUnits(usdcBalance as bigint, TOKENS.USDCm.decimals)).toFixed(2) : '0.00'}
                            </p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSweep}
                    disabled={!isInitialized || isSweeping}
                    className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-transparent border border-rose-900/40 text-rose-600/80 font-mono text-sm uppercase hover:bg-rose-950/20 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    {isSweeping ? (
                        <><RefreshCw className="w-4 h-4 animate-spin" /> Sweeping...</>
                    ) : (
                        <>Sweep All Funds <LogOut className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    )
}
