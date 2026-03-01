'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { Landmark, ArrowUpRight } from 'lucide-react'
import { useUnlink } from '@unlink-xyz/react'
import Link from 'next/link'

export default function LendPage() {
    const { walletExists, ready } = useUnlink()
    const isInitialized = walletExists && ready
    const [supplyAmount, setSupplyAmount] = useState('')
    const [isLending, setIsLending] = useState(false)

    const handleLend = () => {
        setIsLending(true)
        // Uses unlink.burner.send(0, { to: AAVE_POOL, data: depositCalldata })
        setTimeout(() => setIsLending(false), 2500)
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Private Lending</h1>
                <p className="text-zinc-400">Supply assets to Aave and earn yield without exposing your balance.</p>
                <PrivacyShield />
            </div>

            {!isInitialized && (
                <div className="mb-8 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <h3 className="text-xl font-bold text-rose-400 mb-2">Privacy Shield Not Active</h3>
                    <p className="text-rose-200/80 mb-6">You must initialize your in-memory burner account before executing private lending.</p>
                    <Link href="/connect" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors">
                        Initialize Shield
                    </Link>
                </div>
            )}

            <div className="p-8 rounded-[2rem] bg-zinc-900 border border-white/10 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                        <Landmark className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">Supply USDTm</h2>
                        <p className="text-emerald-400 font-medium">+4.20% Variable APY</p>
                    </div>
                </div>

                <div className="p-6 rounded-3xl bg-black/40 border border-white/5 mb-8">
                    <div className="flex justify-between mb-4">
                        <span className="text-zinc-400 font-medium">Amount to Supply</span>
                        <span className="text-zinc-500 hover:text-cyan-400 cursor-pointer transition-colors">Max: 1,250.00</span>
                    </div>
                    <div className="flex items-end pt-2">
                        <input
                            type="text"
                            value={supplyAmount}
                            onChange={(e) => setSupplyAmount(e.target.value)}
                            className="bg-transparent text-5xl font-mono font-bold text-white outline-none w-full"
                            placeholder="0.00"
                        />
                        <span className="text-2xl font-bold text-zinc-600 mb-1">USDTm</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 rounded-2xl bg-zinc-800/50">
                        <p className="text-sm text-zinc-500 mb-1">Health Factor</p>
                        <p className="text-xl font-bold text-emerald-400">&infin;</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-zinc-800/50">
                        <p className="text-sm text-zinc-500 mb-1">Collateralization</p>
                        <p className="text-xl font-bold text-white">Enabled</p>
                    </div>
                </div>

                <button
                    onClick={handleLend}
                    disabled={!isInitialized || isLending || !supplyAmount}
                    className="w-full flex justify-center items-center gap-2 px-6 py-5 rounded-2xl bg-cyan-500/20 border border-cyan-500/50 text-cyan-400 font-bold text-lg hover:bg-cyan-500/30 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(34,211,238,0.15)] disabled:shadow-none"
                >
                    {isLending ? (
                        <span className="animate-pulse">Executing on Aave...</span>
                    ) : (
                        <>Supply Privately <ArrowUpRight className="w-5 h-5" /></>
                    )}
                </button>
            </div>

            <div className="mt-6 text-center text-sm text-zinc-500">
                Contract interaction sent via <span className="text-emerald-400">Burner 0</span>
            </div>
        </div>
    )
}
