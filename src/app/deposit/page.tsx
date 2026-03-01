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
        MON: { name: 'Monad Native Token', symbol: 'MON', color: 'bg-[#e0e0e0]/20', text: 'text-[#e0e0e0]', bgFade: 'bg-[#e0e0e0]/20/20' },
        USDTm: { name: 'Tether USD (Testnet)', symbol: 'U', color: 'bg-emerald-600/80', text: 'text-emerald-600/80', bgFade: 'bg-emerald-600/80/20' },
        USDCm: { name: 'USD Coin (Testnet)', symbol: 'C', color: 'bg-blue-600/80', text: 'text-blue-600/80', bgFade: 'bg-blue-600/80/20' },
        ULNKm: { name: 'Unlink Native Token', symbol: 'L', color: 'bg-[#e0e0e0]/20', text: 'text-[#e0e0e0]', bgFade: 'bg-[#e0e0e0]/20/20' },
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
                <p className="text-[#e0e0e0]/80">Deposit assets from your public wallet into the Unlink Privacy Pool, then fund your burner.</p>
            </div>

            {!isInitialized && (
                <div className="mb-8 p-6 border border-rose-900/40 text-center bg-[#0a0a0a]">
                    <h3 className="text-sm font-mono text-rose-600/80 mb-2 uppercase">Privacy Shield Not Active</h3>
                    <p className="text-[#e0e0e0]/60 mb-6 text-sm">You must initialize your in-memory burner account before interacting with the privacy pool.</p>
                    <Link href="/connect" className="inline-flex items-center gap-2 px-6 py-3 border border-rose-900/40 text-rose-600/80 font-mono text-xs uppercase hover:bg-rose-950/20 transition-colors">
                        Initialize Shield
                    </Link>
                </div>
            )}

            <div className="space-y-6">
                {/* Step 1: Deposit to Pool */}
                <div className="p-8 border border-[#e0e0e0]/20 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-6 h-6 border border-[#e0e0e0]/40 text-[#e0e0e0]/60 flex items-center justify-center font-mono text-xs">1</div>
                        <h2 className="text-sm font-mono uppercase tracking-widest text-white">Shield Assets</h2>
                    </div>

                    <div className="relative mb-6">
                        <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="p-4 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex items-center justify-between hover:border-[#e0e0e0]/30 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 ${tokenDetails[selectedToken].color} flex items-center justify-center font-mono text-white text-xs`}>
                                    {tokenDetails[selectedToken].symbol}
                                </div>
                                <div>
                                    <p className="font-mono text-sm text-white uppercase">{selectedToken}</p>
                                    <p className="text-[10px] uppercase font-mono text-[#e0e0e0]/60">{tokenDetails[selectedToken].name}</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-[#e0e0e0]/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 p-1 border border-[#e0e0e0]/20 bg-[#0a0a0a] z-20 flex flex-col gap-1">
                                {(Object.keys(tokenDetails) as Array<keyof typeof TOKENS>).map((tKey) => (
                                    <div
                                        key={tKey}
                                        onClick={() => {
                                            setSelectedToken(tKey)
                                            setIsDropdownOpen(false)
                                        }}
                                        className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#e0e0e0]/20`}
                                    >
                                        <div className={`w-6 h-6 ${tokenDetails[tKey].color} flex items-center justify-center font-mono text-white text-xs`}>
                                            {tokenDetails[tKey].symbol}
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm text-[#e0e0e0]/80 uppercase">{tKey}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-8 p-6 border border-[#e0e0e0]/20 bg-[#0a0a0a] focus-within:border-[#e0e0e0]/30 transition-colors">
                        <div className="flex justify-between mb-4">
                            <span className="text-[#e0e0e0]/60 font-mono text-[10px] uppercase">Amount to shield</span>
                            <span className="text-[#e0e0e0]/40 font-mono text-[10px] uppercase">Balance: {parseFloat(formattedBalance).toFixed(4)}</span>
                        </div>
                        <div className="flex items-end">
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="bg-transparent text-3xl font-mono text-white outline-none w-full"
                                placeholder="0.00"
                            />
                            <button
                                onClick={() => setAmount(formattedBalance)}
                                className="text-[#e0e0e0]/60 text-xs font-mono uppercase hover:text-white px-3 py-1 border border-[#e0e0e0]/20 mb-1"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    {status && (
                        <div className="mb-6 p-4 border border-blue-900/40 text-blue-600/80 text-xs font-mono uppercase text-center">
                            {status}
                        </div>
                    )}

                    <button
                        onClick={handleDeposit}
                        disabled={!isInitialized || isDepositing || isUnlinkPreparing || amount === '0' || amount === ''}
                        className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-transparent border border-blue-900/40 text-blue-600/80 font-mono text-sm uppercase hover:bg-blue-900/20 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        {(isDepositing || isUnlinkPreparing) ? <><RefreshCw className="w-4 h-4 animate-spin" /> {status || 'Shielding...'}</> : <><ShieldPlus className="w-4 h-4" /> Shield to Privacy Pool</>}
                    </button>
                </div>

                {/* Step 2: Fund Burner */}
                <div className="p-8 border border-[#e0e0e0]/20 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-6 h-6 border border-[#e0e0e0]/40 text-[#e0e0e0]/60 flex items-center justify-center font-mono text-xs">2</div>
                        <h2 className="text-sm font-mono uppercase tracking-widest text-white">Fund Burner from Pool</h2>
                    </div>
                    <p className="text-[#e0e0e0]/60 mb-6 text-xs font-mono">
                        Withdraw from the anonymous shielded pool to your fresh burner account (Index 0). This breaks the on-chain link.
                    </p>

                    <PrivacyShield />

                    <div className="relative mt-6 mb-4">
                        <div
                            onClick={() => setIsFundDropdownOpen(!isFundDropdownOpen)}
                            className="p-4 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex items-center justify-between hover:border-[#e0e0e0]/30 transition-colors cursor-pointer"
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 ${tokenDetails[fundSelectedToken].color} flex items-center justify-center font-mono text-white text-xs`}>
                                    {tokenDetails[fundSelectedToken].symbol}
                                </div>
                                <div>
                                    <p className="font-mono text-sm text-white uppercase">{fundSelectedToken}</p>
                                    <p className="text-[10px] uppercase font-mono text-[#e0e0e0]/60">{tokenDetails[fundSelectedToken].name}</p>
                                </div>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-[#e0e0e0]/40 transition-transform ${isFundDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>

                        {isFundDropdownOpen && (
                            <div className="absolute top-full left-0 right-0 mt-1 p-1 border border-[#e0e0e0]/20 bg-[#0a0a0a] z-20 flex flex-col gap-1">
                                {(Object.keys(tokenDetails) as Array<keyof typeof TOKENS>).map((tKey) => (
                                    <div
                                        key={tKey}
                                        onClick={() => {
                                            setFundSelectedToken(tKey)
                                            setIsFundDropdownOpen(false)
                                        }}
                                        className={`p-3 flex items-center gap-3 cursor-pointer transition-colors hover:bg-[#e0e0e0]/20`}
                                    >
                                        <div className={`w-6 h-6 ${tokenDetails[tKey].color} flex items-center justify-center font-mono text-white text-xs`}>
                                            {tokenDetails[tKey].symbol}
                                        </div>
                                        <div>
                                            <p className="font-mono text-sm text-[#e0e0e0]/80 uppercase">{tKey}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mb-6 p-6 border border-[#e0e0e0]/20 bg-[#0a0a0a] mt-6 focus-within:border-[#e0e0e0]/30 transition-colors">
                        <div className="flex justify-between mb-4">
                            <span className="text-[#e0e0e0]/60 font-mono text-[10px] uppercase">Amount to fund burner</span>
                            <span className="text-[#e0e0e0]/40 font-mono text-[10px] uppercase">Shielded Pool Balance: {fundPoolBalance ? parseFloat(formatUnits(fundPoolBalance, TOKENS[fundSelectedToken].decimals)).toFixed(4) : '0.00'}</span>
                        </div>
                        <div className="flex items-end">
                            <input
                                type="number"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                className="bg-transparent text-3xl font-mono text-white outline-none w-full"
                                placeholder="0.00"
                            />
                            <button
                                onClick={() => setFundAmount(fundPoolBalance ? formatUnits(fundPoolBalance, TOKENS[fundSelectedToken].decimals) : '0')}
                                className="text-[#e0e0e0]/60 text-xs font-mono uppercase hover:text-white px-3 py-1 border border-[#e0e0e0]/20 mb-1"
                            >
                                MAX
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={handleFundBurner}
                        disabled={!isInitialized || isFundingBurner || !fundAmount || fundAmount === '0'}
                        className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-transparent border border-emerald-900/50 text-emerald-600/80 font-mono text-sm uppercase hover:bg-emerald-900/20 transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                        {isFundingBurner ? <><RefreshCw className="w-4 h-4 animate-spin" /> {status || 'Funding...'}</> : <><ArrowDownToLine className="w-4 h-4" /> Fund Burner</>}
                    </button>
                </div>
            </div>
        </div>
    )
}
