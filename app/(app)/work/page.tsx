'use client'

import { useEffect, useState } from 'react'
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    CartesianGrid,
    ScatterChart,
    Scatter,
    Line
} from 'recharts'
import { Info } from 'lucide-react'
import { getWeeklySummary } from '@/app/actions/analytics'

type Log = {
    date: Date
    sleepHours?: number | null
    workHours?: number | null
    gym?: boolean | null
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

export default function WorkPage() {

    const [logs, setLogs] = useState<Log[]>([])
    const [activeInfo, setActiveInfo] = useState<string | null>(null)

    useEffect(() => {
        getWeeklySummary().then(res => {
            if (res?.logs) setLogs(res.logs)
        })
    }, [])

    /* ---------------- WEEK NORMALIZATION ---------------- */

    const weekMap = new Map<string, Log>()

    logs.forEach(l => {
        const day = new Date(l.date).toLocaleDateString('en-US', { weekday: 'short' })
        weekMap.set(day, l)
    })

    const chartData = WEEK.map(day => {
        const log = weekMap.get(day)
        return {
            day,
            work: log?.workHours ?? 0,
            sleep: log?.sleepHours ?? 0,
            gym: log?.gym ? 1 : 0,
            mood: log?.mood ?? 0
        }
    })

    /* -------------------- CORRELATION -------------------- */

    const validData = chartData.filter(d => d.sleep > 0 && d.work > 0)

    let correlation = 0

    if (validData.length > 1) {
        const sleepVals = validData.map(d => d.sleep)
        const workVals = validData.map(d => d.work)

        const meanSleep = avg(sleepVals)
        const meanWork = avg(workVals)

        const numerator = sleepVals.reduce((sum, s, i) => {
            return sum + (s - meanSleep) * (workVals[i] - meanWork)
        }, 0)

        const denomSleep = Math.sqrt(
            sleepVals.reduce((sum, s) => sum + Math.pow(s - meanSleep, 2), 0)
        )

        const denomWork = Math.sqrt(
            workVals.reduce((sum, w) => sum + Math.pow(w - meanWork, 2), 0)
        )

        const denominator = denomSleep * denomWork

        correlation = denominator !== 0 ? numerator / denominator : 0
    }

    const workValues = chartData.map(d => d.work)
    const avgWork = avg(workValues)

    /* ---------------- ANALYTICS ENGINE ---------------- */

    const overloadDays = workValues.filter(v => v > 9).length
    const underRecoveryDays = chartData.filter(d => d.sleep < 6 && d.work > 8).length

    const variance =
        workValues.reduce((s, v) => s + Math.abs(v - avgWork), 0) / 7

    const stabilityScore = clamp(100 - variance * 12)

    let burnoutPressure = 100
    burnoutPressure -= overloadDays * 8
    burnoutPressure -= underRecoveryDays * 10
    const burnoutScore = clamp(burnoutPressure)

    const focusConsistency =
        chartData.filter(d => d.work >= 6 && d.work <= 9).length / 7 * 100

    const workSeverity =
        burnoutScore < 40 ? 'high' :
            burnoutScore < 65 ? 'moderate' : 'low'

    /* ---------------- CORRELATION ---------------- */

    const scatterData = chartData.map(d => ({
        x: d.sleep,
        y: d.work
    }))

    /* ---------------- INSIGHT ENGINE ---------------- */

    let insight = ''

    if (overloadDays >= 3)
        insight = 'Multiple overload days detected. Burnout accumulation accelerating.'
    else if (underRecoveryDays >= 2)
        insight = 'High work + low sleep pattern increasing crash probability.'
    else if (stabilityScore > 75)
        insight = 'Work rhythm stable. Sustainable productivity foundation.'
    else
        insight = 'Work intensity fluctuating. Monitor energy balance.'

    /* ---------------- FORECAST ---------------- */

    const crashProbability =
        overloadDays >= 3 ? 75 :
            underRecoveryDays >= 2 ? 60 :
                variance > 2 ? 45 : 20

    /* ---------------- UI ---------------- */

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-10 py-8 text-white">

            <h1 className="text-3xl font-semibold mb-8">
                Work Intelligence
            </h1>

            {/* SCORE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">

                <CircleCard
                    label="Stability Score"
                    value={stabilityScore}
                    severity={workSeverity}
                    onInfoClick={setActiveInfo}
                />

                <CircleCard
                    label="Burnout Pressure"
                    value={burnoutScore}
                    severity={workSeverity}
                    onInfoClick={setActiveInfo}
                />

                <BarCard
                    label="Crash Probability"
                    value={crashProbability}
                    severity={workSeverity}
                    onInfoClick={setActiveInfo}
                />

                <SimpleCard
                    label="Focus Consistency"
                    value={`${focusConsistency.toFixed(0)}%`}
                    onInfoClick={setActiveInfo}
                />
            </div>

            {/* CORRELATION + WEEKLY INSIGHT */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">

                <div className="rounded-3xl bg-white/5 border border-white/10 p-6 flex flex-col justify-between">
                    <div>
                        <div className="text-lg font-medium mb-4">
                            Sleep–Work Correlation Insight
                        </div>

                        <p className="text-white/70 text-sm leading-relaxed mb-4">
                            {correlation > 0.4
                                ? 'Higher sleep duration strongly correlates with higher work output.'
                                : correlation > 0.1
                                    ? 'Moderate relationship between sleep and work performance detected.'
                                    : 'Weak correlation detected. Other variables may influence performance.'}
                        </p>

                        <div className="text-sm text-cyan-300">
                            Correlation Strength: {correlation.toFixed(2)}
                        </div>
                    </div>
                </div>

                {/* WEEKLY INSIGHT */}
                <div className="rounded-3xl bg-white/5 border border-white/10 p-6">
                    <div className="text-lg font-medium mb-4">
                        Weekly Work Insight
                    </div>

                    <p className="text-white/70 text-sm leading-relaxed">
                        {insight}
                    </p>
                </div>

            </div>

            {/* DAILY WORK VS GYM */}
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 mb-12">
                <div className="text-lg font-medium mb-6">
                    Daily Work vs Gym Activity
                </div>

                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                        <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="day" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip
                            cursor={{ fill: 'rgba(34,211,238,0.08)' }}
                            contentStyle={{
                                backgroundColor: '#0b1a2a',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                color: '#fff'
                            }}
                        />

                        <Bar
                            dataKey="work"
                            fill="#22d3ee"
                            radius={[6, 6, 0, 0]}
                        />

                        <Bar
                            dataKey="gym"
                            fill="#a855f7"
                            radius={[6, 6, 0, 0]}
                            stackId="a"
                        />
                    </BarChart>
                </ResponsiveContainer>
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

/* ---------- COMPONENTS ---------- */

function CircleCard({ label, value, severity, onInfoClick }: { label: string, value: number, severity: 'low' | 'moderate' | 'high', onInfoClick: (l: string) => void }) {

    const dash = 2 * Math.PI * 40

    const colorMap = {
        low: '#22c55e',
        moderate: '#f59e0b',
        high: '#ef4444'
    }

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 relative">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-white/60">{label}</span>
                <Info size={16}
                    className="text-white/50 hover:text-white cursor-pointer"
                    onClick={() => onInfoClick(label)}
                />
            </div>

            <div className="flex items-center justify-center relative">
                <svg width="110" height="110">
                    <circle cx="55" cy="55" r="40"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="8" fill="none" />
                    <circle cx="55" cy="55" r="40"
                        stroke={colorMap[severity]}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={dash}
                        strokeDashoffset={dash - (dash * value) / 100}
                        strokeLinecap="round" />
                </svg>
                <div className="absolute text-2xl font-semibold">
                    {value.toFixed(0)}
                </div>
            </div>
        </div>
    )
}

function BarCard({ label, value, severity, onInfoClick }: { label: string, value: number, severity: 'low' | 'moderate' | 'high', onInfoClick: (l: string) => void }) {

    const colorMap = {
        low: 'from-green-400 to-green-500',
        moderate: 'from-yellow-400 to-orange-400',
        high: 'from-red-400 to-rose-500'
    }

    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-white/60">{label}</span>
                <Info size={16}
                    className="text-white/50 hover:text-white cursor-pointer"
                    onClick={() => onInfoClick(label)}
                />
            </div>

            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div
                    className={`h-full bg-gradient-to-r ${colorMap[severity]}`}
                    style={{ width: `${value}%` }}
                />
            </div>

            <div className="text-sm mt-3">{value}%</div>
        </div>
    )
}

function SimpleCard({
    label,
    value,
    onInfoClick
}: {
    label: string
    value: string
    onInfoClick: (l: string) => void
}) {
    return (
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 relative">
            <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-white/60">{label}</span>

                <Info
                    size={16}
                    className="text-white/50 hover:text-white cursor-pointer"
                    onClick={() => onInfoClick(label)}
                />
            </div>

            <div className="text-2xl font-semibold">
                {value}
            </div>
        </div>
    )
}

function InfoModal({ title, onClose }: { title: string, onClose: () => void }) {

    const content: Record<string, { short: string; detailed: string }> = {

        'Stability Score': {
            short: 'Measures daily workload consistency.',
            detailed:
                'Stability Score evaluates how consistent your work hours are across the week. Large fluctuations increase cognitive fatigue and reduce sustainable performance. A stable rhythm supports long-term productivity and lowers stress load.'
        },

        'Burnout Pressure': {
            short: 'Composite overload stress model.',
            detailed:
                'Burnout Pressure combines overload days (>9h), under-recovery days (high work + low sleep), and workload variance. Lower scores indicate higher stress accumulation. Sustained pressure without recovery increases fatigue risk and cognitive decline.'
        },

        'Crash Probability': {
            short: 'Short-term productivity decline risk.',
            detailed:
                'Crash Probability estimates the likelihood of energy collapse within 3–5 days. It rises when overload days stack without sufficient recovery. This is an early warning signal to rebalance effort and rest.'
        },

        'Focus Consistency': {
            short: 'Measures sustainable performance zone adherence.',
            detailed:
                'Focus Consistency tracks how many days your work hours fall within the optimal productivity band (6–9h). Staying within this range promotes deep work while preventing cognitive exhaustion.'
        }
    }

    const item = content[title]

    return (
        <div className="fixed inset-0 backdrop-blur-md bg-black/50 flex items-center justify-center z-50 animate-fade">
            <div className="w-[460px] rounded-2xl bg-[#0b1a2a] border border-white/10 p-6 shadow-2xl">

                <div className="text-lg font-semibold mb-2">
                    {title}
                </div>

                <div className="text-sm text-cyan-300 mb-3">
                    {item?.short}
                </div>

                <p className="text-sm text-white/70 leading-relaxed mb-6">
                    {item?.detailed}
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
