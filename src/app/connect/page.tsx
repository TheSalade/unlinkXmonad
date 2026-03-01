'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useSignMessage } from 'wagmi'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { Shield, Key, ArrowRight } from 'lucide-react'
import { generateMnemonic, english } from 'viem/accounts'
import { entropyToMnemonic } from '@scure/bip39'
import { keccak256, toBytes, slice } from 'viem'

export default function ConnectPage() {
    const router = useRouter()
    const { isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const { walletExists, ready, importWallet, createAccount } = useUnlink()
    const { createBurner } = useBurner()

    const isInitialized = walletExists && ready

    const [isGenerating, setIsGenerating] = useState(false)
    const [localMnemonic, setLocalMnemonic] = useState('')

    // Try to auto-connect from local storage on refresh
    useEffect(() => {
        const autoConnect = async () => {
            if (isInitialized) return
            const savedMnemonic = localStorage.getItem('__unlink_session_mnemonic')
            if (savedMnemonic && isConnected) {
                setIsGenerating(true)
                try {
                    await importWallet(savedMnemonic)
                    await createAccount(0)
                    await createBurner(0)
                    router.push('/dashboard')
                } catch (e) {
                    console.error("Auto-connect failed:", e)
                    localStorage.removeItem('__unlink_session_mnemonic')
                } finally {
                    setIsGenerating(false)
                }
            }
        }
        autoConnect()
    }, [isInitialized, isConnected, importWallet, createAccount, createBurner, router])

    const handleCreateShield = async () => {
        setIsGenerating(true)
        try {
            if (!isConnected) {
                alert("Please connect your wallet first via the Topbar.")
                setIsGenerating(false)
                return
            }

            // Sign a message to make it deterministic.
            const signature = await signMessageAsync({ message: "Welcome to Nullifier. Sign this message to generate your in-memory privacy key." })

            // Hash the signature to create deterministic entropy (we need 16-32 bytes for a mnemonic)
            const hash = keccak256(toBytes(signature))
            // viem's entropyToMnemonic expects a Uint8Array. 16 bytes = 12 words, 32 bytes = 24 words.
            const entropy = toBytes(slice(hash, 0, 16))
            const newMnemonic = entropyToMnemonic(entropy, english)

            // Import the mnemonic into the Unlink React SDK instance
            await importWallet(newMnemonic)

            // Initialize the primary privacy account (for shielded deposits)
            await createAccount(0)

            // Generate the first burner account (Index 0)
            await createBurner(0)

            setLocalMnemonic(newMnemonic)
            localStorage.setItem('__unlink_session_mnemonic', newMnemonic)

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
                <div className="p-12 border border-emerald-900/50 bg-[#0a0a0a] flex flex-col items-center max-w-md text-center">
                    <Shield className="w-12 h-12 text-emerald-600/80 mb-6" />
                    <h2 className="text-sm font-mono text-emerald-600/80 uppercase tracking-widest mb-4">Shield Active</h2>
                    <p className="text-[#e0e0e0]/60 font-mono text-xs mb-8">Your private burner account is initialized.</p>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="flex items-center gap-2 px-6 py-3 border border-[#e0e0e0]/30 bg-transparent text-white font-mono text-xs uppercase hover:bg-[#e0e0e0]/10 transition-colors"
                    >
                        Dashboard <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[70vh]">
            <div className="p-12 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex flex-col items-center max-w-lg text-center">
                <div className="w-16 h-16 border border-[#e0e0e0]/30 flex items-center justify-center mb-8 bg-[#0a0a0a]">
                    <Key className="w-6 h-6 text-[#e0e0e0]/60" />
                </div>

                <h1 className="text-xl font-mono uppercase tracking-widest mb-4 text-white">Initialize Nullifier</h1>
                <p className="text-[#e0e0e0]/60 mb-10 text-xs font-mono leading-relaxed">
                    Create an in-memory session key. Your main wallet will only be used to fund the Nullifier pool, while a dedicated burner account will handle all DeFi interactions privately.
                </p>

                <button
                    onClick={handleCreateShield}
                    disabled={!isConnected || isGenerating}
                    className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-transparent border border-emerald-900/50 text-emerald-600/80 font-mono text-sm uppercase hover:bg-emerald-900/20 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    {isGenerating ? (
                        <span className="animate-pulse">Initializing...</span>
                    ) : !isConnected ? (
                        "Connect Wallet First"
                    ) : (
                        <>Activate Shield <Shield className="w-4 h-4" /></>
                    )}
                </button>

                {localMnemonic && (
                    <div className="mt-8 p-4 border border-[#e0e0e0]/20 bg-[#0a0a0a] w-full animate-in fade-in duration-300">
                        <p className="text-xs text-emerald-600/80 font-mono uppercase mb-1">Session Key Generated</p>
                        <p className="text-[10px] text-[#e0e0e0]/60 font-mono uppercase">Redirecting to dashboard...</p>
                    </div>
                )}
            </div>
        </div>
    )
}
