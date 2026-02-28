'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ArrowDownToLine, RefreshCw, ShieldPlus, ChevronDown } from 'lucide-react'
import { useAccount, useReadContract } from 'wagmi'
import { TOKENS } from '../../config/tokens'
import { formatUnits, parseUnits } from 'viem'
import { erc20Abi } from 'viem'
import { useDeposit } from '@unlink-xyz/react'

export default function DepositPage() {
    const { address } = useAccount()
    const [amount, setAmount] = useState('0')
    const [isDepositing, setIsDepositing] = useState(false)
    const [isFundingBurner, setIsFundingBurner] = useState(false)
    const [selectedToken, setSelectedToken] = useState<keyof typeof TOKENS>('USDTm')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const tokenDetails = {
        USDTm: { name: 'Tether USD (Testnet)', symbol: 'U', color: 'bg-emerald-500', text: 'text-emerald-500', bgFade: 'bg-emerald-500/20' },
        USDCm: { name: 'USD Coin (Testnet)', symbol: 'C', color: 'bg-blue-500', text: 'text-blue-500', bgFade: 'bg-blue-500/20' },
        ULNKm: { name: 'Unlink Native Token', symbol: 'L', color: 'bg-indigo-500', text: 'text-indigo-500', bgFade: 'bg-indigo-500/20' },
    }

    const decimals = TOKENS[selectedToken].decimals

    // Fetch balance of the selected token for the public wallet
    const { data: balanceData } = useReadContract({
        address: TOKENS[selectedToken].address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
    });

    const formattedBalance = balanceData ? formatUnits(balanceData, decimals) : '0.00'

    // Unlink Deposit Hook
    const { deposit, isPending: isUnlinkDepositing } = useDeposit()

    const handleDeposit = async () => {
        setIsDepositing(true)
        try {
            if (!address) throw new Error("Wallet not connected")
            if (!amount || Number(amount) <= 0) throw new Error("Invalid amount")

            const amountBigInt = parseUnits(amount, decimals)

            // Execute the deposit to the shielded pool
            await deposit([{
                token: TOKENS[selectedToken].address as `0x${string}`,
                amount: amountBigInt,
                depositor: address
            }])

            // Clear input on success
            setAmount('0')
            // Add a slight delay for UI feedback
            setTimeout(() => setIsDepositing(false), 1000)

        } catch (error) {
            console.error("Deposit failed:", error)
            setIsDepositing(false)
        }
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

                    <div className="relative mb-6">
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${tokenDetails[selectedToken].color} flex items-center justify-center font-bold text-white`}>
                                    {tokenDetails[selectedToken].symbol}
                                </div>
                                <div>
                                    <p className="font-bold">{selectedToken}</p>
                                    <p className="text-xs text-zinc-500">{tokenDetails[selectedToken].name}</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl z-20 flex flex-col gap-1">
                                {(Object.keys(tokenDetails) as Array<keyof typeof TOKENS>).map((tKey) => (
                                    <div
                                        key={tKey}
                                        onClick={() => {
                                            setSelectedToken(tKey)
                                            setIsDropdownOpen(false)
                                        }}
                                        className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${selectedToken === tKey ? 'bg-white/10' : 'hover:bg-white/5'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-full ${tokenDetails[tKey].color} flex items-center justify-center font-bold text-white text-sm`}>
                                            {tokenDetails[tKey].symbol}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">{tKey}</p>
                                            <p className="text-xs text-zinc-500">{tokenDetails[tKey].name}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-8 p-6 rounded-2xl bg-black/40 border border-white/5">
                        <div className="flex justify-between mb-2">
                            <span className="text-zinc-400 text-sm">Amount to shield</span>
                            <span className="text-zinc-500 text-sm">Balance: {parseFloat(formattedBalance).toFixed(4)}</span>
                        </div>
                        <div className="flex items-end pt-2">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-transparent text-4xl font-mono font-bold text-white outline-none w-full"
                                placeholder="0.00"
                            />
                            <button
                                onClick={() => setAmount(formattedBalance)}
                                className="text-blue-400 text-sm font-bold hover:text-blue-300"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleDeposit}
                        disabled={isDepositing || isUnlinkDepositing || amount === '0' || amount === ''}
                        className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
                    >
                        {(isDepositing || isUnlinkDepositing) ? <><RefreshCw className="w-5 h-5 animate-spin" /> Shielding...</> : <><ShieldPlus className="w-5 h-5" /> Shield to Privacy Pool</>}
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
