'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ArrowDownUp, Settings, Activity } from 'lucide-react'
import { useUnlink, useBurner } from '@unlink-xyz/react'
import { useReadContract, usePublicClient } from 'wagmi'
import Link from 'next/link'
import { parseUnits, formatUnits, encodeFunctionData, erc20Abi, maxUint256 } from 'viem'
import { TOKENS } from '../../config/tokens'

const SIMPLE_SWAP_ROUTER = "0xEc3F41D198b5284bEf87e417BFc028B8407d5D83" as const;

const SIMPLE_SWAP_ABI = [
    { "inputs": [{ "name": "amountIn", "type": "uint256" }], "name": "swapAforB", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "amountIn", "type": "uint256" }], "name": "swapBforA", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "name": "amountIn", "type": "uint256" }], "name": "quoteAforB", "outputs": [{ "name": "amountOut", "type": "uint256" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "name": "amountIn", "type": "uint256" }], "name": "quoteBforA", "outputs": [{ "name": "amountOut", "type": "uint256" }], "stateMutability": "view", "type": "function" }
] as const;

export default function SwapPage() {
    const { walletExists, ready } = useUnlink()
    const { send, burners } = useBurner()
    const publicClient = usePublicClient()
    const isInitialized = walletExists && ready
    const burnerAddress = burners[0]?.address as `0x${string}` | undefined

    const [tokenIn, setTokenIn] = useState<'USDTm' | 'USDCm'>('USDTm')
    const tokenOut = tokenIn === 'USDTm' ? 'USDCm' : 'USDTm'

    const [payAmount, setPayAmount] = useState('')
    const [isSwapping, setIsSwapping] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    const { data: burnerBalance, refetch: refetchBalance } = useReadContract({
        address: TOKENS[tokenIn].address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: burnerAddress ? [burnerAddress as `0x${string}`] : undefined,
        query: { enabled: !!burnerAddress }
    })

    const { data: currentAllowance, refetch: refetchAllowance } = useReadContract({
        address: TOKENS[tokenIn].address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'allowance',
        args: burnerAddress ? [burnerAddress as `0x${string}`, SIMPLE_SWAP_ROUTER] : undefined,
        query: { enabled: !!burnerAddress }
    })

    const amountInBigInt = payAmount && !isNaN(Number(payAmount)) ? parseUnits(payAmount, TOKENS[tokenIn].decimals) : BigInt(0);

    // tokenA = USDC, tokenB = USDT
    const isAforB = tokenIn === 'USDCm';

    const { data: quoteData, isLoading: isQuoteLoading, isError: isQuoteError } = useReadContract({
        address: SIMPLE_SWAP_ROUTER,
        abi: SIMPLE_SWAP_ABI,
        functionName: isAforB ? 'quoteAforB' : 'quoteBforA',
        args: [amountInBigInt],
        query: { enabled: amountInBigInt > BigInt(0) }
    })

    const expectedOut = quoteData !== undefined ? formatUnits(quoteData as bigint, TOKENS[tokenOut].decimals) : '';

    const handleSwap = async () => {
        if (!burnerAddress) {
            setStatus("Error: Burner account not found.")
            return
        }
        if (amountInBigInt === BigInt(0)) return;

        setIsSwapping(true)
        setStatus("Approving and swapping securely...")

        try {
            const allowanceBigInt = (currentAllowance as bigint) || BigInt(0)

            if (allowanceBigInt < amountInBigInt) {
                setStatus("Step 1/2: Approving tokens securely...")
                const approveData = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [SIMPLE_SWAP_ROUTER, maxUint256]
                })

                const approveRes = await send.execute({
                    index: 0,
                    tx: {
                        to: TOKENS[tokenIn].address as `0x${string}`,
                        data: approveData,
                        value: BigInt(0)
                    }
                })

                if (publicClient && approveRes?.txHash) {
                    setStatus("WAITING: Confirming approval on-chain...")
                    const receipt = await publicClient.waitForTransactionReceipt({
                        hash: approveRes.txHash as `0x${string}`,
                        timeout: 60000
                    })
                    if (receipt.status !== 'success') {
                        throw new Error("Approval transaction reverted on-chain")
                    }
                    // Add delay to ensure RPC state propagates across nodes
                    await new Promise(r => setTimeout(r, 2000))
                    await refetchAllowance()
                }
            }

            const swapData = encodeFunctionData({
                abi: SIMPLE_SWAP_ABI,
                functionName: isAforB ? 'swapAforB' : 'swapBforA',
                args: [amountInBigInt]
            })

            setStatus(allowanceBigInt < amountInBigInt ? "Step 2/2: Executing SimpleSwap..." : "Executing Swap...")
            const swapRes = await send.execute({
                index: 0,
                tx: {
                    to: SIMPLE_SWAP_ROUTER,
                    data: swapData,
                    value: BigInt(0)
                }
            })

            if (publicClient && swapRes?.txHash) {
                setStatus("WAITING: Confirming swap on-chain...")
                const receipt = await publicClient.waitForTransactionReceipt({
                    hash: swapRes.txHash as `0x${string}`,
                    timeout: 60000
                })
                if (receipt.status !== 'success') {
                    throw new Error("Swap transaction reverted on-chain")
                }
            }

            await refetchBalance()
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
                <p className="text-[#e0e0e0]/80">Swap on Uniswap anonymously using your burner account.</p>
                <PrivacyShield />
            </div>

            {!isInitialized && (
                <div className="mb-8 p-6 rounded-2xl bg-rose-700/80/80/10 border border-rose-900/40 text-center">
                    <h3 className="text-xl font-bold text-white mb-2">Privacy Shield Not Active</h3>
                    <p className="text-rose-600/60 mb-6">You must initialize your in-memory burner account before executing private swaps.</p>
                    <Link href="/connect" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-700/80/80 text-white font-bold hover:bg-rose-700/80 transition-colors">
                        Initialize Shield
                    </Link>
                </div>
            )}

            <div className="p-6 border border-[#e0e0e0]/20 bg-[#0a0a0a] relative mt-16">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#e0e0e0]/20">
                    <span className="text-[#e0e0e0]/60 font-mono text-xs uppercase tracking-widest">Swap Interface</span>
                    <Settings className="w-4 h-4 text-[#e0e0e0]/40 hover:text-white cursor-pointer transition-colors" />
                </div>

                {status && (
                    <div className={`mb-6 p-4 border text-sm font-mono uppercase ${status.includes('fail') || status.includes('Error') ? 'bg-rose-950/20 text-rose-600/80 border-rose-900/40' : 'bg-emerald-900/20 text-emerald-600/80 border-emerald-900/50'} animate-in fade-in slide-in-from-top-2 duration-300`}>
                        {status}
                    </div>
                )}

                {/* Pay Section */}
                <div className="p-5 border border-[#e0e0e0]/20 bg-[#0a0a0a] focus-within:border-[#e0e0e0]/30 transition-colors mb-2 group">
                    <div className="flex justify-between mb-4">
                        <span className="text-[#e0e0e0]/60 font-mono text-[10px] uppercase">You pay</span>
                        <span className="text-[#e0e0e0]/40 font-mono text-[10px] uppercase">
                            Balance: {burnerBalance !== undefined ? Number(formatUnits(burnerBalance as bigint, TOKENS[tokenIn].decimals)).toFixed(4) : '0.0000'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            value={payAmount}
                            onChange={(e) => setPayAmount(e.target.value)}
                            className="bg-transparent text-3xl w-full text-white font-mono outline-none"
                            placeholder="0.0"
                        />
                        <button className="flex items-center gap-2 px-3 py-2 border border-[#e0e0e0]/20 bg-[#0a0a0a] hover:bg-[#e0e0e0]/10 transition-colors shrink-0 font-mono text-xs uppercase text-[#e0e0e0]/80">
                            <div className={`w-2 h-2 ${tokenIn === 'USDTm' ? 'bg-emerald-600/80' : 'bg-blue-600/80'}`} />
                            {tokenIn}
                        </button>
                    </div>
                </div>

                {/* Swap Arrow */}
                <div
                    onClick={() => {
                        setTokenIn(tokenOut)
                        setPayAmount('')
                    }}
                    className="absolute left-1/2 -translate-x-1/2 top-[46%] -translate-y-1/2 p-2 bg-[#0a0a0a] border border-[#e0e0e0]/20 z-10 cursor-pointer hover:bg-[#e0e0e0]/10 transition-colors"
                >
                    <ArrowDownUp className="w-4 h-4 text-[#e0e0e0]/60" />
                </div>

                {/* Receive Section */}
                <div className="p-5 border border-[#e0e0e0]/20 bg-[#0a0a0a] mt-1 mb-6 group">
                    <div className="flex justify-between mb-4">
                        <span className="text-[#e0e0e0]/60 font-mono text-[10px] uppercase">You receive</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <input
                            type="text"
                            readOnly
                            value={isQuoteLoading ? '...' : isQuoteError ? 'Err' : expectedOut}
                            className={`bg-transparent text-3xl w-full font-mono outline-none cursor-not-allowed ${expectedOut ? 'text-white' : 'text-[#e0e0e0]/20'}`}
                            placeholder="0.0"
                        />
                        <button className="flex items-center gap-2 px-3 py-2 border border-[#e0e0e0]/20 bg-[#0a0a0a] transition-colors shrink-0 font-mono text-xs uppercase text-[#e0e0e0]/80">
                            <div className={`w-2 h-2 ${tokenOut === 'USDTm' ? 'bg-emerald-600/80' : 'bg-blue-600/80'}`} />
                            {tokenOut}
                        </button>
                    </div>
                </div>

                <button
                    onClick={handleSwap}
                    disabled={!isInitialized || isSwapping || !payAmount || isQuoteLoading}
                    className="w-full flex justify-center items-center gap-2 px-4 py-4 bg-transparent border border-rose-900/40 text-rose-600/80 font-mono text-sm uppercase hover:bg-rose-950/20 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    {isSwapping ? (
                        <span className="animate-pulse">Executing...</span>
                    ) : (
                        <>Swap via Burner <Activity className="w-4 h-4" /></>
                    )}
                </button>
            </div>
        </div>
    )
}
