'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ArrowDownUp, Settings, Activity } from 'lucide-react'

export default function SwapPage() {
    const [payAmount, setPayAmount] = useState('')
    const [isSwapping, setIsSwapping] = useState(false)

    const handleSwap = () => {
        setIsSwapping(true)
        // Here we'd use unlink.burner.send(0, { to: DEX_ROUTER, data: swapCalldata })
        setTimeout(() => setIsSwapping(false), 2500)
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Private Swap</h1>
                <p className="text-zinc-400">Swap on Uniswap anonymously using your burner account.</p>
                <PrivacyShield />
            </div>

            <div className="p-6 rounded-[2rem] bg-zinc-900 border border-white/10 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6 px-2">
                    <span className="text-white font-medium">Swap</span>
                    <Settings className="w-5 h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                </div>

                {/* Pay Section */}
                <div className="p-5 rounded-3xl bg-black/40 border border-transparent hover:border-white/5 transition-colors mb-2 group">
                    <div className="flex justify-between mb-2">
                        <span className="text-zinc-400 text-sm font-medium">You pay</span>
                        <span className="text-zinc-500 text-sm">Balance: 1,250.00</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="bg-transparent text-4xl w-full text-white font-mono outline-none"
                            placeholder="0"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-800 hover:bg-zinc-700 transition-colors shrink-0 font-bold">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-xs text-white">U</div>
                            USDTm
                        </button>
                    </div>
                </div>

                {/* Swap Arrow */}
                <div className="absolute left-1/2 -translate-x-1/2 top-[46%] -translate-y-1/2 p-2 rounded-2xl bg-zinc-900 border-4 border-black z-10 cursor-pointer hover:bg-zinc-800 transition-colors">
                    <ArrowDownUp className="w-5 h-5 text-zinc-400" />
                </div>

                {/* Receive Section */}
                <div className="p-5 rounded-3xl bg-black/40 border border-transparent hover:border-white/5 transition-colors mb-6 group mt-1">
                    <div className="flex justify-between mb-2">
                        <span className="text-zinc-400 text-sm font-medium">You receive</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            readOnly
                            value={Number(payAmount) > 0 ? (Number(payAmount) * 0.00031).toFixed(5) : ''}
                            className="bg-transparent text-4xl w-full text-zinc-500 font-mono outline-none cursor-not-allowed"
                            placeholder="0"
                        />
                        <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors shrink-0 font-bold">
                            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs text-white">E</div>
                            ULNKm
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSwap}
                    disabled={isSwapping || !payAmount}
                    className="w-full flex justify-center items-center gap-2 px-6 py-5 rounded-2xl bg-pink-500/20 border border-pink-500/50 text-pink-400 font-bold text-lg hover:bg-pink-500/30 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(236,72,153,0.15)] disabled:shadow-none"
                >
                    {isSwapping ? (
                        <span className="animate-pulse">Executing via Burner...</span>
                    ) : (
                        <>Swap Anonymously <Activity className="w-5 h-5" /></>
                    )}
                </button>
            </div>

            <div className="mt-6 flex justify-between px-6 text-sm text-zinc-500">
                <span>Routing: Unlink Burner (0) &rarr; Uniswap V3</span>
                <span>Network fee hidden</span>
            </div>
        </div>
    )
}
