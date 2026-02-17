'use client'

import React, { useEffect, useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    PolarAngleAxis,
    AreaChart,
    Area,
} from 'recharts'


import DigitalTwinHuman from '@/app/components/DigitalTwinHuman'
import { getWeeklySummary } from '@/app/actions/analytics'
import { getWeeklyBurnoutAssessment } from '@/app/actions/assessment'
import { detectFocusZone } from '@/app/lib/focus-zone'

export default function DashboardPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [averages, setAverages] = useState<any>(null)

    const [assessment, setAssessment] = useState<{
        state: 'balanced' | 'strained' | 'drifting' | 'at_risk'
        riskScore: number
        message: string
        drivers: string[]
    } | null>(null)

    useEffect(() => {
        getWeeklySummary().then((res) => {
            if (res?.logs) {
                const ordered = res.logs.reverse()
                setLogs(ordered)
                setAverages(res.averages)
            }
        })

        getWeeklyBurnoutAssessment().then((res) => {
            if (res) setAssessment(res)
        })
    }, [])

    const latestEnergyRaw =
        logs.length > 0
            ? logs[logs.length - 1].energy ?? 2.5
            : 2.5

    // Convert 0–5 → 0–100
    const latestEnergy = (latestEnergyRaw / 5) * 100

    const burnoutRaw = assessment?.riskScore ?? 0

    // Convert 0–5 → 0–100
    const burnoutRisk = (burnoutRaw / 5) * 100

    const burnoutPercent = (burnoutRaw / 5) * 100

    const last3 = logs.slice(-3)

    const avgEnergy =
        last3.reduce((a, l) => a + (l.energy ?? 3), 0) /
        (last3.length || 1)

    const avgSleep =
        last3.reduce((a, l) => a + (l.sleepHours ?? 7), 0) /
        (last3.length || 1)

    // Readiness formula (0–100)
    const readiness =
        Math.round(
            ((avgSleep / 8) * 0.4 +
                (avgEnergy / 5) * 0.3 +
                (1 - burnoutPercent / 100) * 0.3) * 100
        )

    const focusInsight = detectFocusZone(logs)

    const trendData = buildWeeklyTrend(logs)

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-8 py-8 text-white">

            {/* HEADER */}
            <h1 className="text-3xl font-semibold mb-1">
                Your Digital Twin
            </h1>
            <div className="text-sm text-white/50 mb-8">
                Personal Performance Intelligence System
            </div>

            {/* 🔥 ENERGY + BURNOUT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <EnergyGauge rawValue={latestEnergyRaw} />
                <BurnoutGauge
                    rawValue={burnoutRaw}
                    message={assessment?.message}
                    drivers={assessment?.drivers ?? []}
                />
            </div>

            {/* 🔥 WEEKLY PERFORMANCE FULL WIDTH */}
            <div className="mb-8">
                <WeeklyPerformanceCard logs={logs} />
            </div>


            {/* Sleep / Work / Gym */}
            <div className="mb-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SleepCard value={averages?.sleep ?? 0} />
                    <WorkCard logs={logs} />
                    <GymCard logs={logs} />
                </div>
            </div>

            {/* 🔥 MAIN DASHBOARD */}
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-8 mb-10">

                {/* COLUMN 1 — Digital Twin */}
                <div className="xl:col-span-1 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6 flex justify-center items-center">
                    <DigitalTwinHuman
                        mood={averages?.mood}
                        sleep={averages?.sleep}
                        work={averages?.work}
                    />
                </div>

                {/* COLUMN 2 + 3 — Analytics */}
                <div className="xl:col-span-2 flex flex-col gap-8">

                    {/* Focus Zone */}
                    <FocusZoneCard insight={focusInsight} />

                    {/* Trend Chart */}
                    <TrendChart data={trendData} />

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
                {value.toFixed(2)} <span className="text-sm text-white/60">hrs/night</span>
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

function EnergyGauge({
    rawValue, // 0–5
}: {
    rawValue: number
}) {
    const percentage = Math.round((rawValue / 5) * 100)

    const data = [{ name: 'energy', value: percentage }]

    const color =
        rawValue > 4
            ? 'text-emerald-400'
            : rawValue > 3
                ? 'text-yellow-400'
                : 'text-rose-400'

    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-white/60">
                    Energy Index
                </div>
                <InfoButton text="Energy Index is scored 0–5 based on sleep, workload, mood and recovery. The ring shows percentage equivalent." />
            </div>

            <div className="relative w-[220px] h-[220px] mx-auto flex items-center justify-center">
                <RadialBarChart
                    width={220}
                    height={220}
                    innerRadius="75%"
                    outerRadius="100%"
                    data={data}
                    startAngle={90}
                    endAngle={-270}
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        tick={false}
                    />
                    <RadialBar
                        dataKey="value"
                        cornerRadius={12}
                        fill="#22d3ee"
                    />
                </RadialBarChart>

                {/* CENTER CONTENT */}
                <div className="absolute flex flex-col items-center justify-center leading-tight">
                    <div className={`text-4xl font-bold ${color}`}>
                        {rawValue.toFixed(1)}
                    </div>
                    {/* <div className="text-xs text-white/50">
                        / 5.0
                    </div> */}
                    <div className="text-xs text-white/40 mt-1">
                        {percentage}%
                    </div>
                </div>
            </div>
        </div>
    )
}

function ReadinessGauge({
    value, // 0–100
}: {
    value: number
}) {
    const data = [{ name: 'readiness', value }]
    const percentage = Math.max(0, Math.min(100, value))

    // const color =
    //     value > 80
    //         ? 'text-emerald-400'
    //         : value > 60
    //             ? 'text-yellow-400'
    //             : 'text-rose-400'

    const color =
        value >= 80
            ? '#14b8a6'   // Soft Teal (high capacity)
            : value >= 60
                ? '#22d3ee'   // Muted Cyan (stable)
                : value >= 40
                    ? '#6366f1'   // Soft Indigo (moderate)
                    : '#64748b'   // Calm Slate (low)

    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-white/60">
                    Today’s Readiness
                </div>
                <InfoButton text="Today’s Readiness estimates your cognitive capacity based on recent sleep, energy trend and burnout risk." />
            </div>

            <div className="relative w-[220px] h-[220px] mx-auto flex items-center justify-center">
                <RadialBarChart
                    width={220}
                    height={220}
                    innerRadius="75%"
                    outerRadius="100%"
                    data={[{ value: percentage }]}
                    startAngle={90}
                    endAngle={-270}
                >
                    <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        tick={false}
                    />

                    <RadialBar
                        dataKey="value"
                        cornerRadius={12}
                        fill="#22d3ee" // blue
                        background={{
                            fill: "rgba(255,255,255,0.08)", // grey remainder
                        }}
                    />
                </RadialBarChart>

                <div className="absolute flex flex-col items-center justify-center leading-tight">
                    <div className={`text-4xl font-bold ${color}`}>
                        {value}%
                    </div>
                    {/* <div className="text-xs text-white/40 mt-1">
                        %
                    </div> */}
                </div>
            </div>
        </div>
    )
}

function BurnoutGauge({
    rawValue, // 0–5 from assessment
    message,
    drivers,
}: {
    rawValue: number
    message?: string
    drivers?: string[]
}) {
    // Convert 0–5 → 0–100 for radial fill
    const percentage = Math.round((rawValue / 5) * 100)

    // const color =
    //     percentage < 30
    //         ? '#10b981'
    //         : percentage < 60
    //             ? '#facc15'
    //             : percentage < 80
    //                 ? '#fb923c'
    //                 : '#f43f5e'

    const color =
        rawValue === 0
            ? 'transparent'      // no strain
            : rawValue <= 2
                ? '#eab308'          // Soft Amber (mild strain)
                : rawValue === 3
                    ? '#f97316'          // Muted Orange (moderate)
                    : '#e11d48'          // Soft Rose (elevated)

    const data =
        percentage > 0
            ? [{ name: 'risk', value: percentage }]
            : [{ name: 'risk', value: 0 }]

    const chartData = [
        {
            background: 100,
            risk: percentage,
        },
    ]

    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-white/60">
                    Burnout Risk
                </div>
                <InfoButton text="Burnout score is based on weekly strain signals (sleep deficit, high workload, low energy patterns, meeting impact). It is scored 0–5 and converted to percentage for visualization." />
            </div>

            <div className="flex gap-6 items-center">
                {/* GAUGE */}
                <div className="relative w-[180px] h-[180px] flex items-center justify-center">
                    <RadialBarChart
                        width={220}
                        height={220}
                        innerRadius="75%"
                        outerRadius="100%"
                        data={[{ value: percentage }]}
                        startAngle={90}
                        endAngle={-270}
                    >
                        <PolarAngleAxis
                            type="number"
                            domain={[0, 100]}
                            tick={false}
                        />

                        <RadialBar
                            dataKey="value"
                            cornerRadius={12}
                            fill={percentage > 0 ? color : 'transparent'}
                            background={{
                                fill: "rgba(255,255,255,0.08)",
                            }}
                        />
                    </RadialBarChart>

                    {/* CENTER CONTENT */}
                    <div className="absolute flex flex-col items-center justify-center leading-tight">
                        <div className="text-3xl font-bold">
                            {rawValue.toFixed(1)}
                        </div>
                        <div className="text-xs text-white/50">
                            / 5.0
                        </div>
                        <div className="text-xs text-white/40 mt-1">
                            {percentage}%
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE TEXT */}
                <div className="flex-1">
                    {message && (
                        <div className="text-sm text-white/80 mb-3">
                            {message}
                        </div>
                    )}

                    {drivers && drivers.length > 0 && (
                        <ul className="text-xs text-white/60 space-y-1">
                            {drivers.map((d, i) => (
                                <li key={i}>• {d}</li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    )
}

function WeeklyPerformanceCard({ logs }: any) {
    if (!logs.length) return null

    const avgEnergy =
        logs.reduce((a: number, l: any) => a + (l.energy ?? 0), 0) /
        logs.length

    const highDays =
        logs.filter((l: any) => (l.energy ?? 0) > 75).length

    const overloadDays =
        logs.filter((l: any) => (l.workHours ?? 0) > 9).length

    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            <div className="text-lg font-medium mb-4">
                Weekly Cognitive Report
            </div>

            <div className="grid grid-cols-3 gap-6 text-center">
                <Metric label="Avg Energy" value={avgEnergy.toFixed(0)} />
                <Metric label="Focus Days" value={highDays} />
                <Metric label="Overload Days" value={overloadDays} />
            </div>
        </div>
    )
}

function Metric({ label, value }: any) {
    return (
        <div>
            <div className="text-2xl font-semibold">{value}</div>
            <div className="text-xs text-white/60">{label}</div>
        </div>
    )
}

function FocusZoneCard({ insight }: { insight: string }) {
    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            <div className="text-sm text-white/60 mb-2">
                Focus Intelligence
            </div>
            <div className="text-white/90 text-sm">
                {insight}
            </div>
        </div>
    )
}

function TrendChart({ data }: any) {
    return (
        <div className="rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-6">
            <div className="text-lg font-medium mb-4">
                Weekly Energy Drivers
            </div>

            <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                        <XAxis dataKey="day" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip />

                        <Area
                            type="monotone"
                            dataKey="sleep"
                            stroke="#22d3ee"
                            fill="#22d3ee33"
                            strokeWidth={3}
                        />

                        <Area
                            type="monotone"
                            dataKey="activity"
                            stroke="#818cf8"
                            fill="#818cf833"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}

function buildWeeklyTrend(logs: any[]) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

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
            l,
        ])
    )

    return weekDays.map((d) => {
        const log = logMap.get(d.toDateString())

        return {
            day: d.toLocaleDateString('en-US', { weekday: 'short' }),
            sleep: log?.sleepHours ?? 0,
            activity: log?.workHours ?? 0,
        }
    })
}

function InfoButton({ text }: { text: string }) {
    const [show, setShow] = useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setShow(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () =>
            document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={ref} className="relative z-50">
            <button
                onClick={() => setShow(!show)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-sm"
            >
                i
            </button>

            {show && (
                <div className="absolute right-0 top-8 w-72 bg-[#0f172a] border border-white/10 p-4 rounded-xl text-sm text-white shadow-2xl">
                    {text}
                </div>
            )}
        </div>
    )
}