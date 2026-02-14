'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    LayoutGrid,
    Moon,
    Briefcase,
    Activity,
    Sparkles,
    LogOut
} from 'lucide-react'
import { logout } from '../actions/auth'

const items = [
    { label: 'Overview', href: '/dashboard', icon: LayoutGrid },
    { label: 'Sleep', href: '/sleep', icon: Moon },
    { label: 'Work', href: '/work', icon: Briefcase },
    { label: 'Daily Logs', href: '/daily-log', icon: Activity },
    { label: 'Insights', href: '/insights', icon: Sparkles },
]

export default function Sidebar() {
    const pathname = usePathname()

    const handleLogout = async () => {
        await logout()
        window.location.href = '/login'
    }
    return (
        <aside className="w-[96px] min-h-screen bg-gradient-to-b from-[#070f1a] to-[#050b14] border-r border-white/10 flex flex-col items-center py-6">
            {/* Logo */}
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.35)]">
                <span className="text-lg font-bold">Y</span>
            </div>

            {/* Nav */}
            <nav className="flex flex-col gap-6 mt-8 w-full items-center">
                {items.map((item) => {
                    const active =
                        pathname === item.href ||
                        pathname.startsWith(item.href + '/')

                    const Icon = item.icon

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center gap-1 group"
                        >
                            <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition
                    ${active
                                        ? 'bg-cyan-500/15 text-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
                                        : 'text-white/50 group-hover:text-white group-hover:bg-white/5'
                                    }`}
                            >
                                <Icon size={20} />
                            </div>

                            <span
                                className={`text-[11px] transition
                    ${active
                                        ? 'text-cyan-300'
                                        : 'text-white/40 group-hover:text-white/70'
                                    }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    )
                })}
            </nav>

            {/* Theme Toggle */}
            {/* <div className="mt-auto mb-4 flex flex-col items-center gap-1">
                <button
                    onClick={() => {
                        const html = document.documentElement
                        const isDark = html.classList.contains('dark')

                        if (isDark) {
                            html.classList.remove('dark')
                            localStorage.setItem('theme', 'light')
                        } else {
                            html.classList.add('dark')
                            localStorage.setItem('theme', 'dark')
                        }
                    }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 hover:bg-white/10 transition"
                >
                    🌗
                </button>

                <span className="text-[10px] text-white/40">
                    Theme
                </span>
            </div> */}

            <div className="mt-auto mb-6">
                <button
                    onClick={handleLogout}
                    className="flex flex-col items-center text-white/50 hover:text-white transition"
                >
                    <LogOut size={20} />
                    <span className="text-[10px] mt-1">
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    )
}
