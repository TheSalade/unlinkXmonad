import { ShieldCheck } from 'lucide-react'

export function PrivacyShield() {
    return (
        <div className="inline-flex items-center gap-2 px-3 py-2 border border-emerald-900/50 bg-[#0a0a0a] mt-4 mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600/80" />
            <span className="text-[10px] text-emerald-600/80 font-mono uppercase tracking-widest">
                Identity Protected: Burner Address Active
            </span>
        </div>
    )
}
