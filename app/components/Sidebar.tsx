'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutGrid,
    Moon,
    Briefcase,
    Activity,
    Sparkles,
} from 'lucide-react'

const items = [
    { label: 'Overview', href: '/dashboard', icon: LayoutGrid },
    { label: 'Sleep', href: '/sleep', icon: Moon },
    { label: 'Work', href: '/work', icon: Briefcase },
    { label: 'Daily Logs', href: '/daily-log', icon: Activity },
    { label: 'Insights', href: '/insights', icon: Sparkles },
]

export default function Sidebar() {
    const pathname = usePathname()

    return (
        <aside className="w-[88px] h-screen bg-gradient-to-b from-[#070f1a] to-[#050b14] border-r border-white/10 flex flex-col items-center py-6 gap-8">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
                <span className="text-lg font-bold">Y</span>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-4 mt-8">
                {items.map((item) => {
                    const active =
                        pathname === item.href ||
                        pathname.startsWith(item.href + '/')

                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={item.label}
                            className={`relative w-12 h-12 rounded-xl flex items-center justify-center transition
                ${active
                                    ? 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <Icon size={20} />

                            {/* Active glow ring */}
                            {active && (
                                <span className="absolute inset-0 rounded-xl ring-1 ring-cyan-400/40" />
                            )}
                        </Link>
                    )
                })}
            </nav>
        </aside>
    )
}
