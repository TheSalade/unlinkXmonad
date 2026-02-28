import { ShieldCheck } from 'lucide-react'

export function PrivacyShield() {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] mt-4 mb-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="text-sm text-emerald-300 font-medium tracking-wide">
                Your identity is protected — on-chain, only the burner address is visible
            </span>
        </div>
    )
}
