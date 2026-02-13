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
import { getRuleBasedInsights, getWeeklySummary } from '@/app/actions/analytics'
import { submitInsightFeedback } from '@/app/actions/insightFeedback'

/* ───────── Types ───────── */

type Insight = {
    title: string
    description: string
    confidence: number
    reason: string
}

type Log = {
    date: Date
    mood?: number | null
    sleepHours?: number | null
    workHours?: number | null
}

type InsightFeedbackAction = 'acknowledged' | 'dismissed'

/* ───────── Helpers ───────── */

function avg(nums: number[]) {
    if (nums.length === 0) return null
    return nums.reduce((a, b) => a + b, 0) / nums.length
}

/* ───────── UI helpers ───────── */

function TrendRow({
    label,
    current,
    previous,
}: {
    label: string
    current: number | null
    previous: number | null
}) {
    if (current == null || previous == null) {
        return <div className="text-white/40">{label}: not enough data</div>
    }

    const diff = current - previous
    const symbol = diff > 0 ? '↑' : diff < 0 ? '↓' : '→'
    const color =
        diff > 0
            ? 'text-emerald-400'
            : diff < 0
                ? 'text-rose-400'
                : 'text-white/60'

    return (
        <div className="flex justify-between">
            <span>{label}</span>
            <span>
                <span className="text-white mr-2">{current.toFixed(1)}</span>
                <span className={color}>
                    {symbol} {previous.toFixed(1)}
                </span>
            </span>
        </div>
    )
}

/* ───────── Page ───────── */

export default function InsightsPage() {
    const [insights, setInsights] = useState<Insight[]>([])
    const [logs, setLogs] = useState<Log[]>([])
    const [scope, setScope] = useState<'weekly' | 'monthly'>('weekly')

    // ✅ NEW — feedback state (per session)
    const [feedback, setFeedback] = useState<Record<string, InsightFeedbackAction>>({})

    useEffect(() => {
        getWeeklySummary().then((res) => {
            if (!res?.logs || res.logs.length === 0) return
            setLogs(res.logs)
        })
    }, [])

    /* ───────── Insight generation (RULE ENGINE) ───────── */

    useEffect(() => {
        async function generateInsights() {
            const ruleInsights = await getRuleBasedInsights(scope)

            if (!ruleInsights || ruleInsights.length === 0) {
                setInsights([
                    {
                        title: 'Not enough data yet',
                        description:
                            'Log a few more days to start seeing personalized insights.',
                        confidence: 0.6,
                        reason: 'At least 5 days of data are needed for correlations',
                    },
                ])
                return
            }

            const adapted: Insight[] = ruleInsights.map((i) => ({
                title: i.title,
                description: i.summary,
                confidence: i.confidence,
                reason: i.why.join(' · '),
            }))

            setInsights(adapted)
        }

        generateInsights()
    }, [scope])

    /* ───────── Feedback handlers (NEW) ───────── */

    function acknowledgeInsight(title: string) {
        setFeedback((prev) => ({
            ...prev,
            [title]: 'acknowledged',
        }))
        submitInsightFeedback(title, 'acknowledged')
    }

    function dismissInsight(title: string) {
        setFeedback((prev) => ({
            ...prev,
            [title]: 'dismissed',
        }))
        submitInsightFeedback(title, 'dismissed')
    }

    // ✅ Filtered view (dismissed insights hidden)
    const visibleInsights = insights.filter(
        (i) => feedback[i.title] !== 'dismissed'
    )

    /* ───────── Narrative ───────── */

    const narrative =
        visibleInsights.length > 0
            ? `Looking at your ${scope} data, ${visibleInsights
                .map((i) => i.title.toLowerCase())
                .join(' and ')} stand out as key patterns.`
            : null

    /* ───────── Trends (unchanged) ───────── */

    const now = new Date()
    const currMonth = now.getMonth()
    const currYear = now.getFullYear()
    const prevMonth = new Date(currYear, currMonth - 1, 1)

    const currMonthLogs = logs.filter((l) => {
        const d = new Date(l.date)
        return d.getMonth() === currMonth && d.getFullYear() === currYear
    })

    const prevMonthLogs = logs.filter((l) => {
        const d = new Date(l.date)
        return (
            d.getMonth() === prevMonth.getMonth() &&
            d.getFullYear() === prevMonth.getFullYear()
        )
    })

    const avgMoodCurr = avg(currMonthLogs.map((l) => l.mood ?? 0).filter(Boolean))
    const avgMoodPrev = avg(prevMonthLogs.map((l) => l.mood ?? 0).filter(Boolean))
    const avgSleepCurr = avg(currMonthLogs.map((l) => l.sleepHours ?? 0).filter(Boolean))
    const avgSleepPrev = avg(prevMonthLogs.map((l) => l.sleepHours ?? 0).filter(Boolean))

    /* ───────── Chart data ───────── */

    const chartData = logs.map((l) => ({
        day: new Date(l.date).toLocaleDateString('en-US', { weekday: 'short' }),
        mood: l.mood ?? null,
        sleep: l.sleepHours ?? null,
    }))

    /* ───────── Render ───────── */

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-10 py-8 text-white">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-semibold">Insights</h1>

                <div className="flex gap-2 text-sm">
                    {(['weekly', 'monthly'] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => setScope(s)}
                            className={`px-4 py-1 rounded-lg border transition
                                ${scope === s
                                    ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}
                            `}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div key={scope} className="animate-fade">
                {/* Highlights */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
                    {visibleInsights.map((insight, i) => (
                        <InsightCard
                            key={i}
                            insight={insight}
                            onAcknowledge={acknowledgeInsight}
                            onDismiss={dismissInsight}
                        />
                    ))}
                </div>

                {/* Narrative */}
                {narrative && (
                    <div className="mb-10 max-w-2xl text-sm text-white/70">
                        {narrative}
                    </div>
                )}
            </div>

            {/* Trends */}
            {scope === 'monthly' && (
                <div className="max-w-xl mb-10 rounded-2xl bg-white/5 border border-white/10 p-6">
                    <div className="text-sm font-medium mb-4">
                        Trends · Month over Month
                    </div>

                    <div className="space-y-3 text-sm text-white/70">
                        <TrendRow label="Mood" current={avgMoodCurr} previous={avgMoodPrev} />
                        <TrendRow label="Sleep (hrs)" current={avgSleepCurr} previous={avgSleepPrev} />
                    </div>
                </div>
            )}

            {/* Charts */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-6 h-[320px]">
                <div className="text-sm font-medium mb-4">
                    Charts (experimental)
                </div>

                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                        <XAxis dataKey="day" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />
                        <Line type="monotone" dataKey="sleep" stroke="#22d3ee" dot={false} />
                        <Line type="monotone" dataKey="mood" stroke="#818cf8" dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

/* ───────── Insight Card (UPDATED) ───────── */

function InsightCard({
    insight,
    onAcknowledge,
    onDismiss,
}: {
    insight: Insight
    onAcknowledge: (title: string) => void
    onDismiss: (title: string) => void
}) {
    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            <div className="text-lg font-medium mb-2">
                {insight.title}
            </div>

            <p className="text-sm text-white/70 mb-3">
                {insight.description}
            </p>

            <p className="text-xs text-white/40 mb-4">
                Why: {insight.reason}
            </p>

            <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/50">Confidence</span>
                <span className="text-sm font-semibold text-cyan-300">
                    {(insight.confidence * 100).toFixed(0)}%
                </span>
            </div>

            <div className="h-1 rounded-full bg-white/10 overflow-hidden mb-4">
                <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    style={{ width: `${insight.confidence * 100}%` }}
                />
            </div>

            {/* NEW — feedback actions */}
            <div className="flex gap-4 text-xs text-white/50">
                <button
                    onClick={() => onAcknowledge(insight.title)}
                    className="hover:text-emerald-400 transition"
                >
                    ✓ This feels right
                </button>

                <button
                    onClick={() => onDismiss(insight.title)}
                    className="hover:text-rose-400 transition"
                >
                    × Not relevant
                </button>
            </div>
        </div>
    )
}
