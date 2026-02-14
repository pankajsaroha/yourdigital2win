'use client'

import { useEffect, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import DigitalTwinHuman from '@/app/components/DigitalTwinHuman'
import { getWeeklySummary } from '@/app/actions/analytics'
import { getWeeklyBurnoutAssessment } from '@/app/actions/assessment' // ✅ NEW

export default function DashboardPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [averages, setAverages] = useState<any>(null)

    // ✅ NEW — Burnout assessment state
    const [assessment, setAssessment] = useState<{
        state: 'balanced' | 'strained' | 'drifting' | 'at_risk'
        riskScore: number
        message: string
        drivers: string[]
    } | null>(null)

    useEffect(() => {
        getWeeklySummary().then((res) => {
            if (res?.logs) {
                setLogs(res.logs.reverse())
                setAverages(res.averages)
            }
        })

        // ✅ NEW — load burnout assessment
        getWeeklyBurnoutAssessment().then((res) => {
            if (res) setAssessment(res)
        })
    }, [])

    const trendData = logs.map((l) => ({
        day: new Date(l.date).toLocaleDateString('en-US', { weekday: 'short' }),
        sleep: l.sleepHours ?? 0,
        activity: l.workHours ?? 0,
    }))

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-8 py-8 text-white">
            <h1 className="text-3xl font-semibold mb-8">My Digital Twin</h1>

            {/* ✅ NEW — Burnout Assessment Card */}
            {assessment && (
                <div className="mb-8 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-3">
                        <div className="text-sm text-white/50">
                            Your Twin’s Assessment
                        </div>
                        <StateBadge state={assessment.state} />
                    </div>

                    <div className="text-lg font-medium mb-2">
                        {assessment.message}
                    </div>

                    {assessment.drivers.length > 0 && (
                        <ul className="text-sm text-white/60 space-y-1 mt-3">
                            {assessment.drivers.map((d, i) => (
                                <li key={i}>• {d}</li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-8">
                {/* LEFT */}
                <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 flex justify-center items-center">
                    <DigitalTwinHuman
                        mood={averages?.mood}
                        sleep={averages?.sleep}
                        work={averages?.work}
                    />
                </div>

                {/* RIGHT */}
                <div className="flex flex-col gap-8">
                    {/* TOP CARDS (E2) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SleepCard value={averages?.sleep ?? 0} />
                        <WorkCard logs={logs} />
                        <GymCard logs={logs} />
                    </div>

                    {/* BOTTOM CHART (E3) */}
                    <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
                        <div className="text-lg font-medium mb-4">
                            Weekly Activity & Sleep Trend
                        </div>

                        {/* IMPORTANT FIX — dedicated height wrapper */}
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={trendData}
                                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}   // 👈 added bottom space
                                >
                                    <XAxis
                                        dataKey="day"
                                        stroke="#64748b"
                                        tick={{ fontSize: 12 }}
                                        tickMargin={12}   // 👈 pushes labels down slightly
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip contentStyle={tooltipStyle} />

                                    <Line
                                        type="monotone"
                                        dataKey="sleep"
                                        stroke="#22d3ee"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="activity"
                                        stroke="#818cf8"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ───────────── NEW — State Badge ───────────── */

function StateBadge({
    state,
}: {
    state: 'balanced' | 'strained' | 'drifting' | 'at_risk'
}) {
    const config = {
        balanced: {
            label: 'Balanced',
            className:
                'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
        },
        strained: {
            label: 'Strained',
            className:
                'bg-yellow-400/20 text-yellow-300 border-yellow-400/30',
        },
        drifting: {
            label: 'Drifting',
            className:
                'bg-orange-400/20 text-orange-300 border-orange-400/30',
        },
        at_risk: {
            label: 'At Risk',
            className:
                'bg-rose-400/20 text-rose-300 border-rose-400/30',
        },
    }

    const current = config[state]

    return (
        <span
            className={`text-xs px-3 py-1 rounded-full border ${current.className}`}
        >
            {current.label}
        </span>
    )
}

/* ───────────── Cards (E2 reused) ───────────── */

function SleepCard({ value }: { value: number }) {
    const pct = Math.min((value / 9) * 100, 100)
    return (
        <Card title="Avg Sleep">
            <div className="text-2xl font-semibold mb-3">
                {value} <span className="text-sm text-white/60">hrs/night</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    style={{ width: `${pct}%` }}
                />
            </div>
        </Card>
    )
}

function WorkCard({ logs }: { logs: any[] }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get Monday of current week
    const day = today.getDay() // 0 = Sun, 1 = Mon ...
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + diffToMonday)

    // Build Mon–Sun week
    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        weekDays.push(d)
    }

    // Map logs by date
    const logMap = new Map(
        logs.map((l) => [
            new Date(l.date).toDateString(),
            l.workHours ?? 0,
        ])
    )

    const bars = weekDays.map((d) => {
        return logMap.get(d.toDateString()) ?? 0
    })

    const valid = bars.filter((v) => v > 0)
    const avg =
        valid.length > 0
            ? valid.reduce((a, b) => a + b, 0) / valid.length
            : 0

    return (
        <Card title="Work Hours">
            <div className="flex flex-col justify-between h-[120px]">
                <div className="flex items-end gap-2">
                    {bars.map((v, i) => (
                        <div
                            key={i}
                            className="w-3 rounded-md bg-gradient-to-t from-cyan-500 to-blue-400"
                            style={{ height: `${v * 10}px` }}
                        />
                    ))}
                </div>

                <div className="text-sm text-white/60 mt-2">
                    {valid.length > 0
                        ? `${avg.toFixed(1)} hrs/day`
                        : 'No data'}
                </div>
            </div>
        </Card>
    )
}

function averagedWorkText(logs: any[]) {
    const valid = logs
        .map((l) => l.workHours)
        .filter((v) => v != null)

    if (valid.length === 0) return 'No data'

    const avg =
        valid.reduce((a, b) => a + b, 0) / valid.length

    return `${avg.toFixed(1)} hrs/day`
}

function GymCard({ logs }: { logs: any[] }) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get Monday
    const day = today.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    const monday = new Date(today)
    monday.setDate(today.getDate() + diffToMonday)

    const weekDays: Date[] = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(monday)
        d.setDate(monday.getDate() + i)
        weekDays.push(d)
    }

    const logMap = new Map(
        logs.map((l) => [
            new Date(l.date).toDateString(),
            l.gym ?? false,
        ])
    )

    const gymDays = weekDays.filter(
        (d) => logMap.get(d.toDateString())
    ).length

    const pct = (gymDays / 7) * 100
    const dash = 2 * Math.PI * 28

    return (
        <Card title="Gym Frequency">
            <div className="flex items-center gap-4">
                <svg width="72" height="72">
                    <circle
                        cx="36"
                        cy="36"
                        r="28"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="6"
                        fill="none"
                    />
                    <circle
                        cx="36"
                        cy="36"
                        r="28"
                        stroke="url(#grad)"
                        strokeWidth="6"
                        fill="none"
                        strokeDasharray={dash}
                        strokeDashoffset={dash - (dash * pct) / 100}
                        strokeLinecap="round"
                    />
                    <defs>
                        <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>
                </svg>

                <div className="text-2xl font-semibold">
                    {gymDays}
                    <span className="text-sm text-white/60"> / 7 days</span>
                </div>
            </div>
        </Card>
    )
}

function Card({
    title,
    children,
}: {
    title: string
    children: React.ReactNode
}) {
    return (
        <div className="rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 p-5 min-h-[160px] flex flex-col gap-3">
            <div className="text-sm text-white/60">{title}</div>
            <div className="flex-1 flex flex-col justify-end">
                {children}
            </div>
        </div>
    )
}

const tooltipStyle = {
    backgroundColor: 'rgba(15,23,42,0.95)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    color: '#e5e7eb',
}
