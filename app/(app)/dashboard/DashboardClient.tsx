'use client'

import { useEffect, useState } from 'react'
import { getWeeklySummary } from '@/app/actions/analytics'
import { getLatestInsights } from '@/app/actions/insightsRead'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

export default function DashboardClient() {
    const [logs, setLogs] = useState<any[]>([])
    const [averages, setAverages] = useState<any>(null)
    const [insights, setInsights] = useState<any[]>([])

    useEffect(() => {
        ; (async () => {
            const s = await getWeeklySummary()
            setLogs(s.logs ?? [])
            setAverages(s.averages ?? null)

            const i = await getLatestInsights()
            setInsights(i.insights ?? [])
        })()
    }, [])

    const moodData = logs.map(l => ({
        date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        mood: l.mood || 0,
    }))

    const sleepData = logs.map(l => ({
        date: new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sleep: l.sleepHours || 0,
    }))

    return (
        <div className="space-y-20">
            {/* STATS — TYPOGRAPHY FIRST */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-16">
                <Metric label="Avg mood" value={averages?.mood?.toFixed(1)} />
                <Metric label="Avg sleep" value={averages?.sleep ? `${averages.sleep.toFixed(1)}h` : null} />
                <Metric label="Avg work" value={averages?.work ? `${averages.work.toFixed(1)}h` : null} />
            </section>

            {/* INSIGHTS — EDITORIAL */}
            <section className="max-w-4xl space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">
                    Insights
                </h2>

                {insights.length === 0 ? (
                    <p className="text-slate-600">
                        Insights will appear once enough patterns are detected.
                    </p>
                ) : (
                    insights.map(i => (
                        <p
                            key={i.id}
                            className="text-lg text-slate-700 leading-relaxed"
                        >
                            {i.content}
                            <span className="ml-2 text-sm text-slate-400">
                                ({Math.round(i.confidence * 100)}%)
                            </span>
                        </p>
                    ))
                )}
            </section>

            {/* VISUAL DATA */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                <Chart title="Mood trend">
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={moodData}>
                            <CartesianGrid stroke="#e5e7eb" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 5]} />
                            <Tooltip />
                            <Line
                                type="monotone"
                                dataKey="mood"
                                stroke="#2563eb"
                                strokeWidth={3}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </Chart>

                <Chart title="Sleep hours">
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={sleepData}>
                            <CartesianGrid stroke="#e5e7eb" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="sleep" fill="#14b8a6" />
                        </BarChart>
                    </ResponsiveContainer>
                </Chart>
            </section>
        </div>
    )
}

/* ---------- atoms ---------- */

function Metric({ label, value }: { label: string; value?: string | null }) {
    return (
        <div>
            <div className="text-sm text-slate-500">{label}</div>
            <div className="mt-3 text-5xl font-semibold tracking-tight text-slate-900">
                {value ?? '—'}
            </div>
        </div>
    )
}

function Chart({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-4">
            <h3 className="text-xs uppercase tracking-wide text-slate-500">
                {title}
            </h3>
            {children}
        </div>
    )
}
