'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowRightLeft, Landmark, Download, LogOut, Shield } from 'lucide-react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/deposit', label: 'Deposit to Pool', icon: Download },
    { href: '/swap', label: 'Private Swap', icon: ArrowRightLeft },
    { href: '/lend', label: 'Private Lend', icon: Landmark },
    { href: '/sweep', label: 'Sweep Funds', icon: LogOut },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r border-white/10 bg-black/40 backdrop-blur-xl h-screen fixed left-0 top-0 flex flex-col items-center py-8">
            <div className="flex items-center gap-3 mb-12">
                <div className="bg-emerald-500/20 p-2 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400 tracking-wide">
                    Unlink DeFi
                </span>
            </div>

            <nav className="w-full px-4 flex flex-col gap-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300",
                                isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                                    : "text-zinc-400 hover:text-zinc-100 hover:bg-white/5"
                            )}
                        >
                            <Icon className={cn("w-5 h-5 transition-transform duration-300", isActive && "scale-110")} />
                            <span className="font-medium">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
