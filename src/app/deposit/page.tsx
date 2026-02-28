'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ArrowDownToLine, RefreshCw, ShieldPlus, ChevronDown } from 'lucide-react'

export default function DepositPage() {
    const [amount, setAmount] = useState('0')
    const [isDepositing, setIsDepositing] = useState(false)
    const [isFundingBurner, setIsFundingBurner] = useState(false)

    const handleDeposit = () => {
        setIsDepositing(true)
        setTimeout(() => setIsDepositing(false), 2000)
    }

    const handleFundBurner = () => {
        setIsFundingBurner(true)
        // Normally uses unlink.burner.fund(0, { token, amount })
        setTimeout(() => setIsFundingBurner(false), 2000)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Fund Shielded Pool</h1>
                <p className="text-zinc-400">Deposit assets from your public wallet into the Unlink Privacy Pool, then fund your burner.</p>
            </div>

            <div className="space-y-6">
                {/* Step 1: Deposit to Pool */}
                <div className="p-8 rounded-3xl bg-zinc-900 border border-white/10 shadow-xl">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">1</div>
                        <h2 className="text-xl font-bold">Shield Assets</h2>
                    </div>

                    <div className="mb-6 p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white">U</div>
                            <div>
                                <p className="font-bold">USDT</p>
                                <p className="text-xs text-zinc-500">Tether USD</p>
                            </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-zinc-500" />
                    </div>

                    <div className="mb-8 p-6 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex justify-between mb-2">
                            <span className="text-zinc-400 text-sm">Amount to shield</span>
                            <span className="text-zinc-500 text-sm">Balance: 10,000.00</span>
                        </div>
                        <div className="flex items-end pt-2">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-transparent text-4xl font-mono font-bold text-white outline-none w-full"
                                placeholder="0.00"
                            />
                            <button className="text-blue-400 text-sm font-bold hover:text-blue-300">MAX</button>
                        </div>
                    </div>

                    <button
                        onClick={handleDeposit}
                        disabled={isDepositing || amount === '0' || amount === ''}
                        className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
                    >
                        {isDepositing ? <><RefreshCw className="w-5 h-5 animate-spin" /> Shielding...</> : <><ShieldPlus className="w-5 h-5" /> Shield to Privacy Pool</>}
                    </button>
                </div>

                {/* Step 2: Fund Burner */}
                <div className="p-8 rounded-3xl bg-emerald-900/10 border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">2</div>
                        <h2 className="text-xl font-bold text-emerald-50">Fund Burner from Pool</h2>
                    </div>
                    <p className="text-zinc-400 mb-6 text-sm">
                        Withdraw from the anonymous shielded pool to your fresh burner account (Index 0). This breaks the on-chain link.
                    </p>

                    <PrivacyShield />

                    <button
                        onClick={handleFundBurner}
                        disabled={isFundingBurner}
                        className="w-full mt-6 flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        {isFundingBurner ? <><RefreshCw className="w-5 h-5 animate-spin" /> Funding Burner...</> : <><ArrowDownToLine className="w-5 h-5" /> Fund Burner (unlink.burner.fund)</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
