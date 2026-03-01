const fs = require('fs');
const path = require('path');

const files = [
    'src/app/dashboard/page.tsx',
    'src/app/deposit/page.tsx',
    'src/app/swap/page.tsx',
    'src/app/sweep/page.tsx',
    'src/app/connect/page.tsx',
    'src/components/PrivacyShield.tsx'
];

const replacements = {
    // Backgrounds
    'bg-[#0d0d0d]': 'bg-[#0a0a0a]',
    'hover:bg-zinc-900': 'hover:bg-[#e0e0e0]/10',
    'bg-zinc-900': 'bg-[#e0e0e0]/10',
    'hover:bg-zinc-800': 'hover:bg-[#e0e0e0]/20',
    'bg-zinc-800': 'bg-[#e0e0e0]/20',
    'bg-black/40': 'bg-[#0a0a0a]',
    'bg-zinc-600': 'bg-[#e0e0e0]/40',

    // Borders
    'border-zinc-800': 'border-[#e0e0e0]/20',
    'border-zinc-700': 'border-[#e0e0e0]/30',
    'border-zinc-600': 'border-[#e0e0e0]/40',
    'border-white/5': 'border-[#e0e0e0]/10',

    // Texts
    'text-zinc-300': 'text-white',
    'text-zinc-400': 'text-[#e0e0e0]/80',
    'text-zinc-500': 'text-[#e0e0e0]/60',
    'text-zinc-600': 'text-[#e0e0e0]/40',
    'text-zinc-700': 'text-[#e0e0e0]/20',

    // Accent Updates (Sober/Dark)
    'text-cyan-500': 'text-blue-600/80',
    'bg-cyan-500': 'bg-blue-600/80',
    'text-cyan-400': 'text-white',
    'bg-cyan-950/40': 'bg-blue-900/20',
    'border-cyan-500/20': 'border-blue-900/50',
    'text-cyan-500/50': 'text-blue-600/50',

    'text-emerald-500': 'text-emerald-600/80',
    'bg-emerald-500': 'bg-emerald-600/80',
    'text-emerald-400': 'text-white',
    'bg-emerald-950/40': 'bg-emerald-900/20',
    'border-emerald-500/20': 'border-emerald-900/50',
    'text-emerald-500/50': 'text-emerald-600/50',
    'bg-emerald-500/5': 'bg-emerald-900/20',
    'border-emerald-500': 'border-emerald-900/50',
    'bg-emerald-950/20': 'bg-emerald-900/20',

    'text-rose-500': 'text-rose-600/80',
    'bg-rose-500': 'bg-rose-600/80',
    'text-rose-400': 'text-white',
    'bg-rose-950/30': 'bg-rose-900/20',
    'border-rose-900/50': 'border-rose-900/40',
    'bg-rose-500/10': 'bg-rose-900/20',
    'border-rose-500/20': 'border-rose-900/40',
    'text-rose-200/80': 'text-rose-600/60',
    'bg-rose-600': 'bg-rose-700/80',

    'text-blue-500': 'text-blue-600/80',
    'bg-blue-500': 'bg-blue-600/80',
    'border-blue-900/50': 'border-blue-900/40',
    'bg-blue-950/20': 'bg-blue-900/20',

    'text-purple-500': 'text-[#e0e0e0]',
    'bg-purple-500': 'bg-[#e0e0e0]/20',
    'bg-purple-500/20': 'bg-[#e0e0e0]/10',

    'text-indigo-500': 'text-[#e0e0e0]',
    'bg-indigo-500': 'bg-[#e0e0e0]/20',
    'bg-indigo-500/20': 'bg-[#e0e0e0]/10',
};

const basePath = '/Users/lad/Documents/unlink';

for (const relFile of files) {
    const file = path.join(basePath, relFile);
    if (!fs.existsSync(file)) {
        console.log(`Skipping ${file}`);
        continue;
    }
    let content = fs.readFileSync(file, 'utf8');
    for (const [key, value] of Object.entries(replacements)) {
        content = content.split(key).join(value);
    }
    fs.writeFileSync(file, content);
    console.log(`Processed ${file}`);
}
