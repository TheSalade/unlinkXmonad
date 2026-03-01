'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount } from 'wagmi'
import { useUnlink, useBurner, useWithdraw, useUnlinkBalance } from '@unlink-xyz/react'
import { PrivacyShield } from '../../components/PrivacyShield'
import { ShieldCheck, ArrowRight, Activity, Wallet, EyeOff, LogOut, RefreshCw, ChevronDown, Copy, Check } from 'lucide-react'
import { formatUnits, parseUnits, erc20Abi } from 'viem'
import { useBalance, useReadContract } from 'wagmi'

import { TOKENS } from '../../config/tokens'

function TokenBalance({ address, token, isNative = false }: { address?: string, token: any, isNative?: boolean }) {
    // For ERC20 tokens
    const { data: erc20Balance } = useReadContract({
        address: token.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address as `0x${string}`] : undefined,
        query: { enabled: !!address && !isNative }
    })

    // For Native MON
    const { data: nativeBalance } = useBalance({
        address: address as `0x${string}`,
        query: { enabled: !!address && isNative }
    })

    let displayAmount = '0.00'
    if (isNative && nativeBalance) {
        displayAmount = parseFloat(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4)
    } else if (!isNative && erc20Balance !== undefined) {
        displayAmount = parseFloat(formatUnits(erc20Balance as bigint, token.decimals)).toFixed(2)
    }

    return (
        <div className="flex items-center justify-between p-3 border-b border-[#e0e0e0]/20 bg-[#0a0a0a] hover:bg-[#e0e0e0]/10 transition-colors last:border-b-0">
            <span className="text-[#e0e0e0]/60 font-mono text-xs uppercase">{token.symbol || 'MON'}</span>
            <span className="text-white font-mono text-sm">
                {displayAmount}
            </span>
        </div>
    )
}

function PoolTokenBalance({ token, symbol }: { token: any, symbol: string }) {
    const { balance: poolBalance } = useUnlinkBalance(token.address as `0x${string}`)

    let displayAmount = '0.00'
    if (poolBalance !== undefined && poolBalance !== null) {
        displayAmount = parseFloat(formatUnits(poolBalance, token.decimals || 18)).toFixed(symbol === 'MON' ? 4 : 2)
    }

    return (
        <div className="flex items-center justify-between p-3 border-b border-[#e0e0e0]/20 bg-[#0a0a0a] hover:bg-[#e0e0e0]/10 transition-colors last:border-b-0">
            <span className="text-[#e0e0e0]/60 font-mono text-xs uppercase">{symbol}</span>
            <span className="text-white font-mono text-sm">
                {displayAmount}
            </span>
        </div>
    )
}

export default function DashboardPage() {
    const router = useRouter()
    const { address: mainWallet } = useAccount()
    const { walletExists, ready, forceResync, syncError } = useUnlink()
    const { burners, getTokenBalance } = useBurner()
    const { withdraw, isPending: isWithdrawing } = useWithdraw()

    const [selectedToken, setSelectedToken] = useState<keyof typeof TOKENS>('USDTm')
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const { balance: poolBalance } = useUnlinkBalance(TOKENS[selectedToken].address as `0x${string}`)

    const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null)
    const [isSyncing, setIsSyncing] = useState(false)
    const [copied, setCopied] = useState(false)

    const burnerAddress = burners[0]?.address
    const [recipientAddress, setRecipientAddress] = useState('')
    const isInitialized = walletExists && ready

    useEffect(() => {
        if (ready && !walletExists) {
            router.push('/connect')
        }
    }, [walletExists, ready, router])

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            await forceResync()
        } catch (e) {
            console.error("Manual sync failed:", e)
        } finally {
            setIsSyncing(false)
        }
    }

    const handleWithdraw = async () => {
        if (!mainWallet || !poolBalance || poolBalance <= BigInt(0)) return;
        const targetAddress = recipientAddress && recipientAddress.length === 42 ? recipientAddress : mainWallet;
        setWithdrawStatus(`Withdrawing to ${targetAddress.slice(0, 6)}...`)
        try {
            await withdraw([{
                token: TOKENS[selectedToken].address as `0x${string}`,
                amount: poolBalance,
                recipient: targetAddress as `0x${string}`
            }])
            setWithdrawStatus("Funds unshielded!")
            setTimeout(() => setWithdrawStatus(null), 3000)
        } catch (e: any) {
            console.error(e)
            setWithdrawStatus(`Error: ${e.message}`)
            setTimeout(() => setWithdrawStatus(null), 4000)
        }
    }

    const handleCopy = () => {
        if (!burnerAddress) return
        navigator.clipboard.writeText(burnerAddress)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (!ready || !walletExists) return null

    return (
        <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard</h1>
                    <p className="text-[#e0e0e0]/80">Manage your private DeFi positions and burner accounts.</p>
                    <PrivacyShield />
                </div>
                <div className="flex flex-col items-end gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="flex items-center gap-2 px-4 py-2 border border-[#e0e0e0]/30 hover:bg-[#e0e0e0]/10 text-[#e0e0e0]/80 transition-colors disabled:opacity-50 text-xs font-mono uppercase tracking-wider"
                    >
                        <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>Force Resync</span>
                    </button>
                    {syncError && <span className="text-xs text-white max-w-[200px] text-right">Sync Error: {syncError}</span>}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Main Wallet Card */}
                <div className="p-6 border border-[#e0e0e0]/20 bg-[#0a0a0a] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#e0e0e0]/20">
                        <h3 className="text-[#e0e0e0]/60 font-mono text-xs uppercase tracking-widest">Public Identity</h3>
                        <div className="w-2 h-2 bg-[#e0e0e0]/40" />
                    </div>
                    <p className="text-xl font-mono text-white mb-6 tracking-tight">
                        {mainWallet ? `${mainWallet.slice(0, 6)}...${mainWallet.slice(-4)}` : 'Not Connected'}
                    </p>

                    <div className="flex flex-col gap-2 z-10 relative">
                        {mainWallet ? (
                            <>
                                <TokenBalance address={mainWallet} token={{ symbol: 'MON', decimals: 18 }} isNative={true} />
                                {Object.entries(TOKENS)
                                    .filter(([symbol]) => symbol !== 'MON')
                                    .map(([symbol, config]) => (
                                        <TokenBalance key={config.address} address={mainWallet} token={{ ...config, symbol }} />
                                    ))}
                            </>
                        ) : (
                            <div className="p-4 rounded-xl bg-[#0a0a0a] border border-[#e0e0e0]/10 text-center text-[#e0e0e0]/60 text-sm">
                                Connect wallet to view balances
                            </div>
                        )}
                    </div>
                </div>

                {/* Privacy Pool Card */}
                <div className="p-6 border border-[#e0e0e0]/20 bg-[#0a0a0a] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#e0e0e0]/20">
                        <h3 className="text-blue-600/80 font-mono text-xs uppercase tracking-widest">Privacy Pool</h3>
                        <div className="w-2 h-2 bg-blue-600/80" />
                    </div>
                    <p className="text-xl font-mono text-white mb-6 tracking-tight">
                        Vault Aggregator
                    </p>

                    <div className="flex flex-col gap-2 relative z-10">
                        {isInitialized ? (
                            <>
                                <PoolTokenBalance symbol="MON" token={{ address: TOKENS.MON.address, decimals: 18 }} />
                                {Object.entries(TOKENS)
                                    .filter(([sym]) => sym !== 'MON')
                                    .map(([sym, config]) => (
                                        <PoolTokenBalance key={config.address} symbol={sym} token={config} />
                                    ))}
                            </>
                        ) : (
                            <div className="p-4 rounded-xl bg-blue-900/20 border border-blue-900/40 text-center text-blue-600/80/50 text-sm">
                                Initialize Shield to view balances
                            </div>
                        )}
                    </div>
                </div>

                {/* Burner Account Card */}
                <div className="p-6 border border-[#e0e0e0]/20 bg-[#0a0a0a] relative overflow-hidden group">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#e0e0e0]/20">
                        <h3 className="text-emerald-600/80 font-mono text-xs uppercase tracking-widest">Private Burner [0]</h3>
                        <div className="w-2 h-2 bg-emerald-600/80" />
                    </div>
                    <div className="flex items-center justify-between mb-6 group/copy">
                        <p className="text-xl font-mono text-white tracking-tight">
                            {burnerAddress ? `${burnerAddress.slice(0, 6)}...${burnerAddress.slice(-4)}` : '0x...'}
                        </p>
                        {burnerAddress && (
                            <button onClick={handleCopy} className="text-emerald-600/80 hover:text-emerald-300 transition-colors focus:outline-none">
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-2 relative z-10">
                        {burnerAddress ? (
                            <>
                                <TokenBalance address={burnerAddress} token={{ symbol: 'MON', decimals: 18 }} isNative={true} />
                                {Object.entries(TOKENS)
                                    .filter(([symbol]) => symbol !== 'MON')
                                    .map(([symbol, config]) => (
                                        <TokenBalance key={config.address} address={burnerAddress} token={{ ...config, symbol }} />
                                    ))}
                            </>
                        ) : (
                            <div className="p-4 rounded-xl bg-emerald-900/20 border border-emerald-900/50 text-center text-emerald-600/80/50 text-sm">
                                Initialize Shield to view balances
                            </div>
                        )}
                    </div>
                </div>

                {/* Unshield Action Card */}
                <div className="p-6 border border-[#e0e0e0]/20 bg-[#0a0a0a] relative overflow-hidden group flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#e0e0e0]/20">
                            <h3 className="text-rose-600/80 font-mono text-xs uppercase tracking-widest">Unshield Funds</h3>
                            <div className="w-2 h-2 bg-rose-700/80/80" />
                        </div>

                        <div className="relative mb-6">
                            <label className="text-[#e0e0e0]/40 font-mono text-[10px] uppercase block mb-2">Select Asset</label>
                            <div
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="p-3 border border-[#e0e0e0]/20 bg-[#0a0a0a] flex items-center justify-between hover:border-[#e0e0e0]/30 transition-colors cursor-pointer"
                            >
                                <span className="font-mono text-white text-sm">{selectedToken}</span>
                                <ChevronDown className={`w-4 h-4 text-[#e0e0e0]/40 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>

                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-1 p-1 border border-[#e0e0e0]/20 bg-[#0a0a0a] z-20 flex flex-col">
                                    {(Object.keys(TOKENS) as Array<keyof typeof TOKENS>).map((tKey) => (
                                        <div
                                            key={tKey}
                                            onClick={() => {
                                                setSelectedToken(tKey)
                                                setIsDropdownOpen(false)
                                            }}
                                            className="p-2 flex items-center gap-2 cursor-pointer transition-colors hover:bg-[#e0e0e0]/20"
                                        >
                                            <p className="font-mono text-xs text-[#e0e0e0]/80">{tKey}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mb-6">
                            <label className="text-[#e0e0e0]/40 font-mono text-[10px] uppercase block mb-2">Recipient Address</label>
                            <input
                                type="text"
                                placeholder={mainWallet ? `${mainWallet.slice(0, 6)}...${mainWallet.slice(-4)}` : "0x..."}
                                value={recipientAddress}
                                onChange={(e) => setRecipientAddress(e.target.value)}
                                className="w-full bg-[#0a0a0a] border border-[#e0e0e0]/20 px-3 py-3 text-sm text-white font-mono placeholder:text-[#e0e0e0]/20 focus:outline-none focus:border-rose-900 transition-colors"
                            />
                        </div>
                    </div>

                    <div>
                        {withdrawStatus && (
                            <div className="mb-4 p-3 border border-rose-900/40 text-rose-600/80 text-xs font-mono uppercase flex justify-between">
                                <span>STATUS</span>
                                <span>{withdrawStatus}</span>
                            </div>
                        )}
                        <button
                            onClick={handleWithdraw}
                            disabled={isWithdrawing || !poolBalance || poolBalance <= BigInt(0)}
                            className="w-full flex justify-between items-center px-4 py-3 bg-transparent text-rose-600/80 hover:bg-rose-900/20 transition-all border border-rose-900/40 disabled:opacity-30 disabled:hover:bg-transparent font-mono text-sm uppercase"
                        >
                            <span>Unshield Max</span>
                            <span>{poolBalance ? parseFloat(formatUnits(poolBalance, TOKENS[selectedToken].decimals)).toFixed(4) : '0.00'}</span>
                        </button>
                    </div>
                </div>
            </div>


        </div>
    )
}
