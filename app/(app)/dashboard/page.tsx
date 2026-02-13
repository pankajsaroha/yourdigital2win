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

export default function DashboardPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [averages, setAverages] = useState<any>(null)

    useEffect(() => {
        getWeeklySummary().then((res) => {
            if (res?.logs) {
                setLogs(res.logs.reverse())
                setAverages(res.averages)
            }
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
                        <SleepCard value={7.5} />
                        <WorkCard />
                        <GymCard value={1.2} />
                    </div>

                    {/* BOTTOM CHART (E3) */}
                    <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 h-[320px]">
                        <div className="text-lg font-medium mb-4">
                            Weekly Activity & Sleep Trend
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={trendData}>
                                <XAxis dataKey="day" stroke="#64748b" />
                                <YAxis stroke="#64748b" />
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

function WorkCard() {
    const bars = [4, 6, 5, 8, 7, 6, 8]

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
                    8 hrs/day
                </div>
            </div>
        </Card>
    )
}

function GymCard({ value }: { value: number }) {
    const pct = Math.min((value / 2) * 100, 100)
    const dash = 2 * Math.PI * 28

    return (
        <Card title="Gym Time">
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
                    {value}
                    <span className="text-sm text-white/60"> hrs/day</span>
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
