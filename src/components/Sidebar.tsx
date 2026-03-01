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
    { href: '/sweep', label: 'Sweep Funds', icon: LogOut },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-64 border-r border-[#e0e0e0]/20 bg-[#0a0a0a] h-screen fixed left-0 top-0 flex flex-col items-center py-8">
            <div className="flex items-center gap-3 mb-12">
                <div className="p-2 border border-emerald-900/50 bg-[#0a0a0a]">
                    <Shield className="w-5 h-5 text-emerald-600/80" />
                </div>
                <span className="text-xl font-bold text-white tracking-wider">
                    Nullifier
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
                                "flex items-center gap-3 px-4 py-3 border-l-2 transition-colors duration-150",
                                isActive
                                    ? "border-[#e0e0e0] bg-[#e0e0e0]/10 text-white"
                                    : "border-transparent text-[#e0e0e0]/60 hover:text-white hover:bg-[#e0e0e0]/5"
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm uppercase tracking-widest">{item.label}</span>
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
