'use client'

import { useState } from 'react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ArrowDownToLine, RefreshCw, ShieldPlus, ChevronDown } from 'lucide-react'
import { useAccount, useReadContract, useWriteContract, useSendTransaction, useBalance } from 'wagmi'
import { TOKENS } from '../../config/tokens'
import { formatUnits, parseUnits } from 'viem'
import { erc20Abi } from 'viem'
import { useDeposit, useUnlink, useBurner, useUnlinkBalance } from '@unlink-xyz/react'
import Link from 'next/link'

export default function DepositPage() {
    const { address } = useAccount()
    const { walletExists, ready, burnerFund } = useUnlink()
    const { createBurner, burners } = useBurner()
    const isInitialized = walletExists && ready
    const burnerAddress = burners[0]?.address

    const [amount, setAmount] = useState('0')
    const [fundAmount, setFundAmount] = useState('0')
    const [isDepositing, setIsDepositing] = useState(false)
    const [isFundingBurner, setIsFundingBurner] = useState(false)
    const [selectedToken, setSelectedToken] = useState<keyof typeof TOKENS>('USDTm')
    const [fundSelectedToken, setFundSelectedToken] = useState<keyof typeof TOKENS>('USDTm')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [isFundDropdownOpen, setIsFundDropdownOpen] = useState(false)
    const [status, setStatus] = useState<string | null>(null)

    const tokenDetails = {
        MON: { name: 'Monad Native Token', symbol: 'MON', color: 'bg-purple-500', text: 'text-purple-500', bgFade: 'bg-purple-500/20' },
        USDTm: { name: 'Tether USD (Testnet)', symbol: 'U', color: 'bg-emerald-500', text: 'text-emerald-500', bgFade: 'bg-emerald-500/20' },
        USDCm: { name: 'USD Coin (Testnet)', symbol: 'C', color: 'bg-blue-500', text: 'text-blue-500', bgFade: 'bg-blue-500/20' },
        ULNKm: { name: 'Unlink Native Token', symbol: 'L', color: 'bg-indigo-500', text: 'text-indigo-500', bgFade: 'bg-indigo-500/20' },
    }

    const POOL_ADDRESS = "0x0813da0a10328e5ed617d37e514ac2f6fa49a254";
    const decimals = TOKENS[selectedToken].decimals
    const tokenAddress = TOKENS[selectedToken].address as `0x${string}`

    const { balance: fundPoolBalance } = useUnlinkBalance(TOKENS[fundSelectedToken].address as `0x${string}`)

    const isNative = selectedToken === 'MON'

    // Fetch ERC20 balance
    const { data: balanceDataErc20, refetch: refetchBalanceErc20 } = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: { enabled: !!address && !isNative }
    });

    // Fetch Native balance
    const { data: balanceDataNative, refetch: refetchBalanceNative } = useBalance({
        address: address,
        query: { enabled: !!address && isNative }
    });

    const balanceData = isNative ? balanceDataNative?.value : balanceDataErc20;
    const refetchBalance = isNative ? refetchBalanceNative : refetchBalanceErc20;

    // Fetch allowance
    const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: address ? [address, POOL_ADDRESS] : undefined,
        query: { enabled: !!address && !isNative }
    });

    const formattedBalance = balanceData !== undefined ? formatUnits(balanceData, decimals) : '0.00'

    const { deposit, isPending: isUnlinkPreparing } = useDeposit()
    const { writeContractAsync: approveAsync } = useWriteContract()
    const { sendTransactionAsync } = useSendTransaction()

    const handleDeposit = async () => {
        setIsDepositing(true)
        setStatus("Initializing shield...")
        try {
            if (!address) throw new Error("Wallet not connected")
            if (!isInitialized) throw new Error("Privacy Shield not initialized. Go to Connect page.")
            if (!amount || Number(amount) <= 0) throw new Error("Invalid amount")

            const amountBigInt = parseUnits(amount, decimals)

            // 1. Check & Handle Allowance
            if (!isNative && (!allowanceData || allowanceData < amountBigInt)) {
                setStatus("Approving assets...")
                await approveAsync({
                    address: tokenAddress,
                    abi: erc20Abi,
                    functionName: 'approve',
                    args: [POOL_ADDRESS, amountBigInt],
                })
                setStatus("Confirming approval...")
                // In a production app we'd wait for receipt here
            }

            // 2. Get Unlink Calldata
            setStatus("Preparing privacy proof...")
            const result = await deposit([{
                token: tokenAddress,
                amount: amountBigInt,
                depositor: address
            }])

            // 3. Send On-Chain Transaction
            setStatus("Broadcasting to Monad...")
            await sendTransactionAsync({
                to: result.to as `0x${string}`,
                data: result.calldata as `0x${string}`,
                value: BigInt(result.value || 0)
            })

            setStatus("Success! Assets Shielded.")
            setAmount('0')
            setTimeout(() => {
                setStatus(null)
                setIsDepositing(false)
                refetchBalance()
                refetchAllowance()
            }, 3000)

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed";
            console.error("Deposit failed:", error)
            setStatus(`Error: ${errorMessage}`)
            setTimeout(() => {
                setIsDepositing(false)
                setStatus(null)
            }, 4000)
        }
    }

    const handleFundBurner = async () => {
        setIsFundingBurner(true)
        setStatus("Funding burner wallet...")
        try {
            if (!isInitialized) throw new Error("Privacy Shield not initialized")
            if (!burnerAddress) throw new Error("Burner address not found")
            if (!fundAmount || Number(fundAmount) <= 0) throw new Error("Invalid amount")

            const decimalsFund = TOKENS[fundSelectedToken].decimals
            const tokenAddressFund = TOKENS[fundSelectedToken].address as `0x${string}`

            const amountBigInt = parseUnits(fundAmount, decimalsFund)

            // Call the SDK to move funds from Pool -> Burner
            await burnerFund(0, {
                token: tokenAddressFund,
                amount: amountBigInt
            })

            setStatus("Burner funded successfully!")
            setFundAmount('0')
            setTimeout(() => {
                setIsFundingBurner(false)
                setStatus(null)
            }, 3000)

        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Failed"
            console.error("Fund burner failed:", error)
            setStatus(`Error: ${errorMessage}`)
            setTimeout(() => {
                setIsFundingBurner(false)
                setStatus(null)
            }, 4000)
        }
    }

    return (
        <div className="max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-4xl font-bold tracking-tight mb-2">Fund Shielded Pool</h1>
                <p className="text-zinc-400">Deposit assets from your public wallet into the Unlink Privacy Pool, then fund your burner.</p>
            </div>

            {!isInitialized && (
                <div className="mb-8 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <h3 className="text-xl font-bold text-rose-400 mb-2">Privacy Shield Not Active</h3>
                    <p className="text-rose-200/80 mb-6">You must initialize your in-memory burner account before interacting with the privacy pool.</p>
                    <Link href="/connect" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-rose-500 text-white font-bold hover:bg-rose-600 transition-colors">
                        Initialize Shield
                    </Link>
                </div>
            )}

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

                    {status && (
                        <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm text-center font-medium animate-pulse">
                            {status}
                        </div>
                    )}

                    <button
                        onClick={handleDeposit}
                        disabled={!isInitialized || isDepositing || isUnlinkPreparing || amount === '0' || amount === ''}
                        className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all disabled:opacity-50"
                    >
                        {(isDepositing || isUnlinkPreparing) ? <><RefreshCw className="w-5 h-5 animate-spin" /> {status || 'Shielding...'}</> : <><ShieldPlus className="w-5 h-5" /> Shield to Privacy Pool</>}
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

                    <div className="relative mt-6 mb-4">
                        <div
                            onClick={() => setIsFundDropdownOpen(!isFundDropdownOpen)}
                            className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full ${tokenDetails[fundSelectedToken].color} flex items-center justify-center font-bold text-white`}>
                                    {tokenDetails[fundSelectedToken].symbol}
                                </div>
                                <div>
                                    <p className="font-bold">{fundSelectedToken}</p>
                                    <p className="text-xs text-zinc-500">{tokenDetails[fundSelectedToken].name}</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isFundDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isFundDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-zinc-900 border border-white/10 shadow-2xl z-20 flex flex-col gap-1">
                                {(Object.keys(tokenDetails) as Array<keyof typeof TOKENS>).map((tKey) => (
                                    <div
                                        key={tKey}
                                        onClick={() => {
                                            setFundSelectedToken(tKey)
                                            setIsFundDropdownOpen(false)
                                        }}
                                        className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-colors ${fundSelectedToken === tKey ? 'bg-white/10' : 'hover:bg-white/5'}`}
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

                    <div className="mb-6 p-6 rounded-2xl bg-black/40 border border-white/5 mt-6">
                        <div className="flex justify-between mb-2">
                            <span className="text-zinc-400 text-sm">Amount to fund burner</span>
                            <span className="text-emerald-500 text-sm">Shielded Pool Balance: {fundPoolBalance ? parseFloat(formatUnits(fundPoolBalance, TOKENS[fundSelectedToken].decimals)).toFixed(4) : '0.00'}</span>
                        </div>
                        <div className="flex items-end pt-2">
                            <input
                                type="number"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                className="bg-transparent text-4xl font-mono font-bold text-white outline-none w-full"
                                placeholder="0.00"
                            />
                            <button
                                onClick={() => setFundAmount(fundPoolBalance ? formatUnits(fundPoolBalance, TOKENS[fundSelectedToken].decimals) : '0')}
                                className="text-emerald-500 text-sm font-bold hover:text-emerald-400"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleFundBurner}
                        disabled={!isInitialized || isFundingBurner || !fundAmount || fundAmount === '0'}
                        className="w-full flex justify-center items-center gap-2 px-6 py-4 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-600 transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                    >
                        {isFundingBurner ? <><RefreshCw className="w-5 h-5 animate-spin" /> {status || 'Funding Burner...'}</> : <><ArrowDownToLine className="w-5 h-5" /> Fund Burner</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
