'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ArrowDownUp, Settings, Activity } from 'lucide-react'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { useReadContract } from 'wagmi'
import Link from 'next/link'
import { parseUnits, formatUnits, encodeFunctionData, erc20Abi } from 'viem'
import { TOKENS } from '../../config/tokens'

const UNISWAP_V3_ROUTER = "0x4c4eabd5fb1d1a7234a48692551eaecff8194ca7" as const;

const SWAP_ROUTER_ABI = [
    {
        "inputs": [{
            "components": [
                { "internalType": "address", "name": "tokenIn", "type": "address" },
                { "internalType": "address", "name": "tokenOut", "type": "address" },
                { "internalType": "uint24", "name": "fee", "type": "uint24" },
                { "internalType": "address", "name": "recipient", "type": "address" },
                { "internalType": "uint256", "name": "deadline", "type": "uint256" },
                { "internalType": "uint256", "name": "amountIn", "type": "uint256" },
                { "internalType": "uint256", "name": "amountOutMinimum", "type": "uint256" },
                { "internalType": "uint160", "name": "sqrtPriceLimitX96", "type": "uint160" }
            ],
            "internalType": "struct ISwapRouter.ExactInputSingleParams",
            "name": "params",
            "type": "tuple"
        }],
        "name": "exactInputSingle",
        "outputs": [{ "internalType": "uint256", "name": "amountOut", "type": "uint256" }],
        "stateMutability": "payable",
        "type": "function"
    }
] as const;

export default function SwapPage() {
    const { walletExists, ready } = useUnlink()
    const { send, burners } = useBurner()
    const isInitialized = walletExists && ready
    const burnerAddress = burners[0]?.address as `0x${string}` | undefined

    const [payAmount, setPayAmount] = useState('')
    const [isSwapping, setIsSwapping] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    const { data: burnerBalance } = useReadContract({
        address: TOKENS.USDTm.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: burnerAddress ? [burnerAddress as `0x${string}`] : undefined,
        query: { enabled: !!burnerAddress }
    })

    const handleSwap = async () => {
        if (!burnerAddress) {
            setStatus("Error: Burner account not found.")
            return
        }

        setIsSwapping(true)
        setStatus("Approving and swapping securely...")

        try {
            const amountBigInt = parseUnits(payAmount, TOKENS.USDTm.decimals)

            const approveData = encodeFunctionData({
                abi: erc20Abi,
                functionName: 'approve',
                args: [UNISWAP_V3_ROUTER, amountBigInt]
            })

            const swapData = encodeFunctionData({
                abi: SWAP_ROUTER_ABI,
                functionName: 'exactInputSingle',
                args: [{
                    tokenIn: TOKENS.USDTm.address as `0x${string}`,
                    tokenOut: TOKENS.ULNKm.address as `0x${string}`,
                    fee: 3000,
                    recipient: burnerAddress,
                    deadline: BigInt(Math.floor(Date.now() / 1000) + 1200), // 20 mins
                    amountIn: amountBigInt,
                    amountOutMinimum: BigInt(0),
                    sqrtPriceLimitX96: BigInt(0)
                }]
            })

            setStatus("Step 1/2: Approving USDTm securely...")
            await send.execute({
                index: 0,
                tx: {
                    to: TOKENS.USDTm.address as `0x${string}`,
                    data: approveData,
                    value: BigInt(0)
                }
            })

            setStatus("Step 2/2: Executing Uniswap V3 swap...")
            await send.execute({
                index: 0,
                tx: {
                    to: UNISWAP_V3_ROUTER,
                    data: swapData,
                    value: BigInt(0)
                }
            })

            setStatus("Swap successful! Check dashboard.")
            setPayAmount('')
            setTimeout(() => {
                setIsSwapping(false)
                setStatus(null)
            }, 3000)

        } catch (error: any) {
            console.error(error)
            setStatus(`Swap failed: ${error.message || "Unknown error"}`)
            setTimeout(() => {
                setIsSwapping(false)
                setStatus(null)
            }, 5000)
        }
    }

    return (
        <div className="max-w-xl mx-auto">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Private Swap</h1>
                <p className="text-zinc-400">Swap on Uniswap anonymously using your burner account.</p>
                <PrivacyShield />
            </div>

            {!isInitialized && (
                <div className="mb-8 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <h3 className="text-xl font-bold text-rose-400 mb-2">Privacy Shield Not Active</h3>
                    <p className="text-rose-200/80 mb-6">You must initialize your in-memory burner account before executing private swaps.</p>
                    <Link href="/connect" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors">
                        Initialize Shield
                    </Link>
                </div>
            )}

            <div className="p-6 rounded-[2rem] bg-zinc-900 border border-white/10 shadow-2xl relative">
                <div className="flex justify-between items-center mb-6 px-2">
                    <span className="text-white font-medium">Swap</span>
                    <Settings className="w-5 h-5 text-zinc-500 hover:text-white cursor-pointer transition-colors" />
                </div>

                {status && (
                    <div className={`mb-6 p-4 rounded-xl text-center text-sm font-medium ${status.includes('fail') || status.includes('Error') ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'} animate-in fade-in slide-in-from-top-2 duration-300`}>
                        {status}
                    </div>
                )}

                {/* Pay Section */}
                <div className="p-5 rounded-3xl bg-black/40 border border-transparent hover:border-white/5 transition-colors mb-2 group">
                    <div className="flex justify-between mb-2">
                        <span className="text-zinc-400 text-sm font-medium">You pay</span>
                        <span className="text-zinc-500 text-sm">
                            Balance: {burnerBalance !== undefined ? Number(formatUnits(burnerBalance as bigint, TOKENS.USDTm.decimals)).toFixed(2) : '0.00'}
                        </span>
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
                    disabled={!isInitialized || isSwapping || !payAmount}
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
