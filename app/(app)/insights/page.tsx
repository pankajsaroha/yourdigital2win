'use client'

import { useEffect, useState } from 'react'
import { getWeeklySummary } from '@/app/actions/analytics'

type Insight = {
    title: string
    description: string
    confidence: number
}

export default function InsightsPage() {
    const [insights, setInsights] = useState<Insight[]>([])

    useEffect(() => {
        // For now derive insights from weekly summary
        getWeeklySummary().then((res) => {
            if (!res?.logs || res.logs.length === 0) return

            const avgSleep = res.averages?.sleep ?? 0
            const avgMood = res.averages?.mood ?? 0
            const avgWork = res.averages?.work ?? 0

            const derived: Insight[] = []

            if (avgSleep < 6.5) {
                derived.push({
                    title: 'Low Sleep Pattern',
                    description:
                        'Your average sleep this week is below 6.5 hours. This may impact mood and focus.',
                    confidence: 0.82,
                })
            }

            if (avgWork > 9) {
                derived.push({
                    title: 'High Workload',
                    description:
                        'You are working long hours consistently. Consider adding breaks or recovery time.',
                    confidence: 0.76,
                })
            }

            if (avgMood < 3) {
                derived.push({
                    title: 'Mood Dip Detected',
                    description:
                        'Mood levels were lower than usual this week. Sleep and workload may be contributing factors.',
                    confidence: 0.79,
                })
            }

            if (derived.length === 0) {
                derived.push({
                    title: 'Healthy Balance',
                    description:
                        'Your sleep, work, and mood appear well balanced this week. Keep it up.',
                    confidence: 0.9,
                })
            }

            setInsights(derived)
        })
    }, [])

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-10 py-8 text-white">
            <h1 className="text-3xl font-semibold mb-8">Insights</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {insights.length === 0 ? (
                    <div className="col-span-full rounded-3xl bg-white/5 border border-white/10 p-8 text-white/60">
                        Start logging your days to unlock personalized insights.
                    </div>
                ) : (
                    insights.map((insight, i) => (
                        <InsightCard key={i} insight={insight} />
                    ))
                )}
            </div>

        </div>
    )
}

/* ───────── Components ───────── */

function InsightCard({ insight }: { insight: Insight }) {
    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            <div className="text-lg font-medium mb-2">
                {insight.title}
            </div>

            <p className="text-sm text-white/70 mb-4">
                {insight.description}
            </p>

            <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">
                    Confidence
                </span>
                <span className="text-sm font-semibold text-cyan-300">
                    {(insight.confidence * 100).toFixed(0)}%
                </span>
            </div>

            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-400"
                    style={{ width: `${insight.confidence * 100}%` }}
                />
            </div>
        </div>
    )
}
