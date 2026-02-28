'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { LogOut, RefreshCw, AlertTriangle } from 'lucide-react'

export default function SweepPage() {
    const [isSweeping, setIsSweeping] = useState(false)

    const handleSweep = () => {
        setIsSweeping(true)
        // Here we'd use await unlink.burner.sweepToPool(0, { token: TOKEN_ADDRESS })
        setTimeout(() => setIsSweeping(false), 2500)
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Sweep to Pool</h1>
                <p className="text-zinc-400">End your privacy session. Return remaining assets from the burner back to the anonymous Unlink Pool.</p>
                <PrivacyShield />
            </div>

            <div className="p-8 rounded-[2rem] bg-zinc-900 border border-rose-500/20 shadow-[0_0_30px_rgba(244,63,94,0.05)] relative overflow-hidden group">
                <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-opacity text-rose-500">
                    <LogOut className="w-64 h-64" />
                </div>

                <div className="bg-rose-500/10 p-4 rounded-xl border border-rose-500/20 flex gap-3 mb-8">
                    <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-200/80">
                        Sweeping deposits all remaining assets back into the unshielded pool. Once swept, you can withdraw them back to your main public identity whenever you choose.
                    </p>
                </div>

                <h3 className="text-xl font-bold mb-4">Assets in Burner (Index 0)</h3>

                <div className="space-y-4 mb-8">
                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">U</div>
                            <div>
                                <p className="font-bold">USDTm</p>
                                <p className="text-xs text-zinc-500">Tether USD (Testnet)</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg font-mono">1,250.00</p>
                            <p className="text-xs text-zinc-500">$1,250.00</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold">W</div>
                            <div>
                                <p className="font-bold">ULNKm</p>
                                <p className="text-xs text-zinc-500">Unlink Native Token</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg font-mono">0.051</p>
                            <p className="text-xs text-zinc-500">$150.32</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleSweep}
                    disabled={isSweeping}
                    className="w-full flex justify-center items-center gap-2 px-6 py-5 rounded-2xl bg-rose-500 text-white font-bold text-lg hover:bg-rose-600 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:shadow-none relative z-10"
                >
                    {isSweeping ? (
                        <><RefreshCw className="w-5 h-5 animate-spin" /> Sweeping to Pool...</>
                    ) : (
                        <>Sweep All Funds <LogOut className="w-5 h-5 ml-1" /></>
                    )}
                </button>
            </div>
        </div>
    )
}
