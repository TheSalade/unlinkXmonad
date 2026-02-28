'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { Shield, Key, ArrowRight } from 'lucide-react'
import { generateMnemonic, english } from 'viem/accounts'

export default function ConnectPage() {
    const router = useRouter()
    const { isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const { walletExists, ready, importWallet } = useUnlink()
    const { createBurner } = useBurner()

    const isInitialized = walletExists && ready

    const [isGenerating, setIsGenerating] = useState(false)
    const [localMnemonic, setLocalMnemonic] = useState('')

    const handleCreateShield = async () => {
        setIsGenerating(true)
        try {
            if (!isConnected) {
                alert("Please connect your wallet first via the Topbar.")
                setIsGenerating(false)
                return
            }

            // or sign a message to make it deterministic.
            await signMessageAsync({ message: "Welcome to Unlink Private DeFi. Sign this message to generate your in-memory privacy key." })

            // In a real app we might derive from signature, for this demo we just generate a random one for safety
            const newMnemonic = generateMnemonic(english)

            // Import the mnemonic into the Unlink React SDK instance
            await importWallet(newMnemonic)

            // Generate the first burner account (Index 0)
            await createBurner(0)

            setLocalMnemonic(newMnemonic)

            // Navigate to dashboard after short delay
            setTimeout(() => {
                router.push('/dashboard')
            }, 1500)

        } catch (e) {
            console.error(e)
        } finally {
            setIsGenerating(false)
        }
    }

    // If already initialized, just go to dashboard
    if (isInitialized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[70vh]">
                <div className="p-8 rounded-2xl bg-zinc-900 border border-white/10 flex flex-col items-center max-w-md text-center">
                    <Shield className="w-16 h-16 text-emerald-400 mb-6" />
                    <h2 className="text-2xl font-bold mb-4">Shield is Active</h2>
                    <p className="text-zinc-400 mb-8">Your private burner account is initialized.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-zinc-200"
                    >
                        Go to Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="p-10 rounded-3xl bg-zinc-900/50 border border-white/5 backdrop-blur-xl flex flex-col items-center max-w-lg text-center shadow-2xl">
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                    <Key className="w-10 h-10 text-emerald-400" />
                </div>

                <h1 className="text-3xl font-bold tracking-tight mb-4 text-white">Initialize Privacy Shield</h1>
                <p className="text-zinc-400 mb-10 text-lg leading-relaxed">
                    Create an in-memory session key. Your main wallet will only be used to fund the Unlink pool, while a dedicated burner account will handle all DeFi interactions privately.
                </p>

                <button
                    onClick={handleCreateShield}
                    disabled={!isConnected || isGenerating}
                    className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:shadow-none"
                >
                    {isGenerating ? (
                        <span className="animate-pulse">Initializing...</span>
                    ) : !isConnected ? (
                        "Connect Wallet First"
                    ) : (
                        <>Activate Shield <Shield className="w-5 h-5" /></>
                    )}
                </button>

                {localMnemonic && (
                    <div className="mt-8 p-4 rounded-xl bg-black/40 border border-emerald-500/30 w-full animate-in fade-in zoom-in duration-300">
                        <p className="text-sm text-emerald-400 font-medium mb-1">Session Key Generated!</p>
                        <p className="text-xs text-zinc-500">Redirecting to dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    )
}
