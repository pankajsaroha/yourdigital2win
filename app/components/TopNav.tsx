'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { logout } from '@/app/actions/auth'

export default function TopNav() {
    const pathname = usePathname()
    const router = useRouter()

    const handleLogout = async () => {
        await logout()
        router.push('/')
    }

    const Item = ({ href, label }: { href: string; label: string }) => {
        const active = pathname === href
        return (
            <Link
                href={href}
                className={`text-sm transition ${active
                        ? 'text-slate-900 font-medium'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
            >
                {label}
            </Link>
        )
    }

    return (
        <header className="sticky top-0 z-50">
            {/* COLOR LAYER */}
            <div className="bg-gradient-to-r from-sky-100/40 via-teal-100/40 to-emerald-100/40">
                {/* GLASS SURFACE */}
                <div className="backdrop-blur border-b border-slate-200/60">
                    <div className="mx-auto max-w-7xl px-8 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-12">
                            {/* BRAND */}
                            <div>
                                <div className="text-lg font-semibold tracking-tight text-slate-900">
                                    yourdigital2win
                                </div>
                                <div className="text-xs text-slate-600">
                                    Personal digital intelligence
                                </div>
                            </div>

                            {/* NAV */}
                            <nav className="flex items-center gap-8">
                                <Item href="/dashboard" label="Dashboard" />
                                <Item href="/daily-log" label="Daily log" />
                            </nav>
                        </div>

                        {/* ACTION */}
                        <button
                            onClick={handleLogout}
                            className="text-sm text-slate-600 hover:text-slate-900"
                        >
                            Log out
                        </button>
                    </div>
                </div>
            </div>
        </header>
    )
}
