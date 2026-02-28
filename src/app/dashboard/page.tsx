'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ShieldCheck, ArrowRight, Activity, Wallet, EyeOff } from 'lucide-react'
import { formatUnits } from 'viem'
import { useBalance } from 'wagmi'

import { TOKENS } from '../../config/tokens'

export default function DashboardPage() {
    const router = useRouter()
    const { address: mainWallet, isConnected } = useAccount()
    const { walletExists, ready } = useUnlink()
    const { burners, getTokenBalance } = useBurner()
    const [balance, setBalance] = useState('0.00')

    const burnerAddress = burners[0]?.address
    const isInitialized = walletExists && ready

    useEffect(() => {
        if (ready && !walletExists) {
            router.push('/connect')
        }
    }, [walletExists, ready, router])

    // Fetch public wallet native balance for the UI (using wagmi)
    const { data: mainBalanceData } = useBalance({
        address: mainWallet,
    })

    useEffect(() => {
        async function fetchBalance() {
            if (burnerAddress && walletExists) {
                try {
                    // Fetch real balance from burner via the Unlink SDK
                    const bal = await getTokenBalance(burnerAddress, TOKENS.USDTm.address as `0x${string}`)
                    setBalance(formatUnits(bal, TOKENS.USDTm.decimals))
                } catch (e) {
                    console.error("Failed to fetch burner balance:", e)
                    setBalance('0.00')
                }
            }
        }

        if (isInitialized) {
            fetchBalance()
            const interval = setInterval(fetchBalance, 10000)
            return () => clearInterval(interval)
        }
    }, [burnerAddress, walletExists, isInitialized, getTokenBalance])

    if (!ready || !walletExists) return null

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
                <p className="text-zinc-400">Manage your private DeFi positions and burner accounts.</p>
                <PrivacyShield />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Wallet Card */}
                <div className="p-6 rounded-2xl bg-zinc-900/50 border border-white/5 backdrop-blur-md relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-zinc-500" />
                        <h3 className="text-zinc-400 font-medium">Public Identity</h3>
                    </div>
                    <p className="text-2xl font-mono text-white mb-2 tracking-tight">
                        {mainWallet ? `${mainWallet.slice(0, 6)}...${mainWallet.slice(-4)}` : 'Not Connected'}
                    </p>
                    <p className="text-sm text-zinc-500 mb-6">Visible on block explorers</p>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5">
                        <span className="text-zinc-400">Balance</span>
                        <span className="text-zinc-300 font-medium">
                            {mainBalanceData ? parseFloat(formatUnits(mainBalanceData.value, mainBalanceData.decimals)).toFixed(4) : '0.00'} MON
                        </span>
                    </div>
                </div>

                {/* Burner Account Card */}
                <div className="p-6 rounded-2xl bg-emerald-900/20 border border-emerald-500/20 backdrop-blur-md relative overflow-hidden group shadow-[0_0_30px_rgba(16,185,129,0.05)]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-500">
                        <EyeOff className="w-24 h-24" />
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <h3 className="text-emerald-400 font-medium">Private Burner (Index 0)</h3>
                    </div>
                    <p className="text-2xl font-mono text-white mb-2 tracking-tight">
                        {burnerAddress ? `${burnerAddress.slice(0, 6)}...${burnerAddress.slice(-4)}` : '0x...'}
                    </p>
                    <p className="text-sm text-emerald-500/70 mb-6">Hidden from your main identity</p>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
                        <span className="text-emerald-400/80">Available USDTm</span>
                        <span className="text-emerald-400 font-bold text-xl">${balance}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Activity className="w-6 h-6 text-cyan-400" />
                    Active Privacy Positions
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-2xl bg-zinc-900 border border-white/10 hover:border-cyan-500/30 transition-colors group cursor-pointer" onClick={() => router.push('/lend')}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Aave v3</h3>
                                <p className="text-zinc-400 text-sm">Supplied USDTm</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">$5,000.00</p>
                                <p className="text-emerald-400 text-sm">+4.2% APY</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-zinc-600 group-hover:text-cyan-400 transition-colors translate-x-[-10px] group-hover:translate-x-0" />
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-zinc-900 border border-white/10 hover:border-pink-500/30 transition-colors group cursor-pointer" onClick={() => router.push('/swap')}>
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-1">Uniswap V3</h3>
                                <p className="text-zinc-400 text-sm">USDCm/ULNKm LP</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                                <ShieldCheck className="w-5 h-5 text-pink-400" />
                            </div>
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-3xl font-bold text-white mb-1">$2,450.00</p>
                                <p className="text-emerald-400 text-sm">+12.5% APY</p>
                            </div>
                            <ArrowRight className="w-6 h-6 text-zinc-600 group-hover:text-pink-400 transition-colors translate-x-[-10px] group-hover:translate-x-0" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
