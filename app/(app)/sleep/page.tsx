'use client'

import { useEffect, useState } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { Info } from 'lucide-react'
import { getWeeklySummary } from '@/app/actions/analytics'

type Log = {
    date: Date
    sleepHours?: number | null
    workHours?: number | null
    mood?: number | null
}

const WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function avg(nums: number[]) {
    if (!nums.length) return 0
    return nums.reduce((a, b) => a + b, 0) / nums.length
}

function clamp(n: number, min = 0, max = 100) {
    return Math.min(max, Math.max(min, n))
}

export default function SleepPage() {
    const [logs, setLogs] = useState<Log[]>([])
    const [activeInfo, setActiveInfo] = useState<string | null>(null)
    const [monthOffset, setMonthOffset] = useState(0)

    useEffect(() => {
        getWeeklySummary().then((res) => {
            if (res?.logs) setLogs(res.logs)
        })
    }, [])

    /* -------------------- WEEK NORMALIZATION -------------------- */

    const weekMap = new Map<string, number>()

    logs.forEach((l) => {
        const day = new Date(l.date).toLocaleDateString('en-US', {
            weekday: 'short',
        })
        weekMap.set(day, l.sleepHours ?? 0)
    })

    const chartData = WEEK.map((d) => ({
        day: d,
        sleep: weekMap.get(d) ?? 0,
    }))

    /* -------------------- ANALYTICS -------------------- */

    const sleepValues = chartData.map((d) => d.sleep)
    const avgSleep = avg(sleepValues)

    const sleepDeficit = sleepValues
        .filter((v) => v < 7)
        .reduce((sum, v) => sum + (7 - v), 0)

    const variance =
        sleepValues.reduce((sum, v) => sum + Math.abs(v - avgSleep), 0) / 7

    const consistencyScore = clamp(100 - variance * 12)

    let burnout = 100
    burnout -= sleepDeficit * 4
    burnout -= variance * 8
    const burnoutScore = clamp(burnout)

    const crashRisk = clamp(
        (sleepDeficit * 8) +
        (variance * 15)
    )

    /* -------------------- WEEK DELTA (Burnout-based) -------------------- */

    const currentWeek = logs.slice(0, 7)
    const previousWeek = logs.slice(7, 14)

    function calculateBurnout(logSet: Log[]) {
        if (!logSet.length) return burnoutScore

        const values = logSet.map(l => l.sleepHours ?? 0)
        const avgVal = avg(values)

        const deficit = values
            .filter(v => v < 7)
            .reduce((sum, v) => sum + (7 - v), 0)

        const varVal =
            values.reduce((sum, v) => sum + Math.abs(v - avgVal), 0) / 7

        let b = 100
        b -= deficit * 4
        b -= varVal * 8

        return clamp(b)
    }

    const prevBurnoutScore = calculateBurnout(previousWeek)
    const burnoutDelta = burnoutScore - prevBurnoutScore

    /* -------------------- SEVERITY -------------------- */

    const burnoutSeverity =
        burnoutScore < 40 ? 'high'
            : burnoutScore < 65 ? 'moderate'
                : 'low'

    const consistencySeverity =
        consistencyScore < 50 ? 'high'
            : consistencyScore < 75 ? 'moderate'
                : 'low'

    const crashSeverity =
        crashRisk > 70 ? 'high'
            : crashRisk > 40 ? 'moderate'
                : 'low'

    /* -------------------- DAILY INSIGHT -------------------- */

    const dailyInsight =
        avgSleep < 6.5
            ? 'Your average sleep is below optimal range. Recovery window shrinking.'
            : variance > 1
                ? 'Sleep timing inconsistency detected. Circadian rhythm instability risk.'
                : 'Sleep rhythm stable. Good recovery foundation.'

    /* -------------------- RECOVERY -------------------- */

    const recommendations: string[] = []

    if (sleepDeficit > 3)
        recommendations.push('Add 2 recovery nights (7.5–8h).')

    if (variance > 1)
        recommendations.push('Stabilize bedtime within ±30 min.')

    if (!recommendations.length)
        recommendations.push('Maintain current rhythm.')

    /* -------------------- UI -------------------- */

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-10 py-8 text-white">

            <h1 className="text-3xl font-semibold mb-8">
                Sleep Intelligence
            </h1>

            {/* RECOVERY */}
            <Panel title="Recovery Recommendations">
                <ul className="space-y-2 text-sm text-white/70">
                    {recommendations.map((r, i) => (
                        <li key={i}>• {r}</li>
                    ))}
                </ul>
            </Panel>

            {/* SCORE GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 my-10">

                <CircleCard
                    label="Consistency"
                    value={consistencyScore}
                    severity={consistencySeverity}
                    delta={0}
                    description="Measures rhythm stability across the week."
                    onInfoClick={setActiveInfo}
                />

                <CircleCard
                    label="Burnout Risk"
                    value={burnoutScore}
                    severity={burnoutSeverity}
                    delta={burnoutDelta}
                    description="Composite fatigue score derived from sleep deficit and instability."
                    onInfoClick={setActiveInfo}
                />

                <BarCard
                    label="Crash Probability"
                    value={crashRisk}
                    severity={crashSeverity}
                    delta={burnoutDelta}
                    onInfoClick={setActiveInfo}
                />

                <InsightCard
                    label="Daily Insight"
                    text={dailyInsight}
                />
            </div>

            {/* AREA CHART */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 h-[420px] mb-10">
                <div className="text-lg font-medium mb-4">
                    Weekly Sleep Pattern
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.7} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <XAxis
                            dataKey="day"
                            stroke="#64748b"
                            tick={{ dy: 14 }}
                            axisLine={false}
                            tickLine={false}
                            padding={{ left: 20, right: 20 }}
                        />
                        <YAxis
                            stroke="#64748b"
                            domain={[0, 10]}
                            ticks={[0, 2, 4, 6, 8, 10]}
                            tickLine={false}
                            axisLine={false}
                        />
                        <Tooltip />
                        <Area
                            type="monotone"
                            dataKey="sleep"
                            stroke="#22d3ee"
                            strokeWidth={3}
                            fill="url(#sleepGrad)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* HEATMAP */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-white/60">
                        4-Week Sleep Recovery Heatmap
                    </div>

                    <div className="flex items-center gap-3 text-xs text-white/60">
                        <button
                            onClick={() => setMonthOffset(m => m + 1)}
                            className="px-2 py-1 bg-white/5 rounded hover:bg-white/10"
                        >
                            ←
                        </button>

                        <span>
                            {monthOffset === 0
                                ? 'Current Month'
                                : `${monthOffset} month${monthOffset > 1 ? 's' : ''} ago`}
                        </span>

                        {monthOffset > 0 && (
                            <button
                                onClick={() => setMonthOffset(m => m - 1)}
                                className="px-2 py-1 bg-white/5 rounded hover:bg-white/10"
                            >
                                →
                            </button>
                        )}
                    </div>
                </div>

                {/* LEGEND */}
                <div className="flex gap-6 text-xs text-white/60 mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500/70 rounded"></div>
                        Good (7h+)
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500/70 rounded"></div>
                        Caution (5–7h)
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500/70 rounded"></div>
                        Deficit (&lt;5h)
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white/10 rounded"></div>
                        No data
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 28 }).map((_, i) => {
                        const date = new Date()

                        // Apply month offset
                        date.setMonth(date.getMonth() - monthOffset)

                        // Generate last 28 days inside that month
                        date.setDate(date.getDate() - (27 - i))

                        const log = logs.find(
                            l =>
                                new Date(l.date).toDateString() ===
                                date.toDateString()
                        )

                        const sleep = log?.sleepHours ?? null

                        let intensity = 'bg-white/10'

                        if (sleep !== null) {
                            intensity =
                                sleep >= 7
                                    ? 'bg-green-500/70'
                                    : sleep >= 5
                                        ? 'bg-yellow-500/70'
                                        : 'bg-red-500/70'
                        }

                        return (
                            <div
                                key={i}
                                className={`w-6 h-6 rounded ${intensity} transition-colors duration-500`}
                                title={
                                    sleep !== null
                                        ? `${date.toDateString()} • ${sleep}h`
                                        : `${date.toDateString()} • No data`
                                }
                            />
                        )
                    })}
                </div>
            </div>

            {/* MODAL */}
            {activeInfo && (
                <InfoModal
                    title={activeInfo}
                    onClose={() => setActiveInfo(null)}
                />
            )}
        </div>
    )
}

/* ---------------- COMPONENTS ---------------- */

function Panel({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-6">
            <div className="text-sm text-white/60 mb-4">{title}</div>
            {children}
        </div>
    )
}

function CircleCard({
    label,
    value,
    severity,
    delta,
    description,
    onInfoClick,
}: {
    label: string
    value: number
    severity: 'low' | 'moderate' | 'high'
    delta: number
    description: string
    onInfoClick: (label: string) => void
}) {
    const dash = 2 * Math.PI * 40

    const colorMap = {
        low: '#22c55e',
        moderate: '#f59e0b',
        high: '#ef4444',
    }

    return (
        <div className={`group rounded-2xl bg-white/5 border border-white/10 p-6 relative transition-all duration-300 ${severity === 'high' ? 'risk-animate' : ''}`}>
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-white/60">{label}</span>
                <Info
                    size={16}
                    className="text-white/50 hover:text-white cursor-pointer transition"
                    onClick={() => onInfoClick(label)}
                />
            </div>

            <div className="flex items-center justify-center relative">
                <svg width="110" height="110">
                    <circle cx="55" cy="55" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="none" />
                    <circle
                        cx="55"
                        cy="55"
                        r="40"
                        stroke={colorMap[severity]}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={dash}
                        strokeDashoffset={dash - (dash * value) / 100}
                        strokeLinecap="round"
                    />
                </svg>

                <div className="absolute text-2xl font-semibold">
                    {value.toFixed(0)}
                </div>

                <div className="mt-4 text-sm text-center">
                    {delta > 0 ? (
                        <span className="text-emerald-400">↑ {delta.toFixed(1)}</span>
                    ) : delta < 0 ? (
                        <span className="text-rose-400">↓ {Math.abs(delta).toFixed(1)}</span>
                    ) : (
                        <span className="text-white/40">→ 0</span>
                    )}
                </div>
            </div>
            <div className="absolute bottom-3 left-0 right-0 px-4 text-xs text-white/60 opacity-0 group-hover:opacity-100 transition">
                {description}
            </div>
        </div>
    )
}

function BarCard({
    label,
    value,
    severity,
    delta,
    onInfoClick,
}: {
    label: string
    value: number
    severity: 'low' | 'moderate' | 'high'
    delta: number
    onInfoClick: (label: string) => void
}) {
    const colorMap = {
        low: 'from-green-400 to-green-500',
        moderate: 'from-yellow-400 to-orange-400',
        high: 'from-red-400 to-rose-500',
    }

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 relative">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-white/60">{label}</span>
                <Info
                    size={16}
                    className="text-white/50 hover:text-white cursor-pointer transition"
                    onClick={() => onInfoClick(label)}
                />
            </div>

            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${colorMap[severity]} transition-all duration-500`}
                    style={{ width: `${value}%` }}
                />
            </div>

            <div className="text-sm mt-3">{value}%</div>
        </div>
    )
}

function InsightCard({ label, text }: { label: string, text: string }) {
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="text-sm text-white/60 mb-3">{label}</div>
            <p className="text-sm text-white/70 leading-relaxed">{text}</p>
        </div>
    )
}

function InfoModal({ title, onClose }: { title: string, onClose: () => void }) {
    const contentMap: Record<string, { short: string, detailed: string }> = {
        Consistency: {
            short: 'Measures sleep rhythm stability.',
            detailed:
                'Consistency score is calculated from daily deviation in sleep duration across the week. Higher variability increases fatigue and reduces recovery efficiency.',
        },
        'Burnout Risk': {
            short: 'Composite fatigue model.',
            detailed:
                'Burnout Risk combines sleep deficit and instability signals. Lower values indicate higher fatigue accumulation.',
        },
        'Crash Probability': {
            short: 'Short-term fatigue forecast.',
            detailed:
                'Crash Probability estimates likelihood of energy decline within 72 hours based on accumulated sleep debt.',
        },
    }

    const content = contentMap[title]

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 animate-fade">
            <div className="w-[460px] rounded-2xl bg-[#0b1a2a] border border-white/10 p-6 shadow-2xl animate-scaleIn">
                <div className="text-lg font-semibold mb-2">{title}</div>
                <div className="text-sm text-cyan-300 mb-3">{content.short}</div>
                <p className="text-sm text-white/70 leading-relaxed mb-6">
                    {content.detailed}
                </p>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-cyan-500 rounded-lg text-black text-sm font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
