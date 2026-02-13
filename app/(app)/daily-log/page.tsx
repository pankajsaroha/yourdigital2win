'use client'

import { useEffect, useState } from 'react'
import { upsertDailyLog } from '@/app/actions/dailylog'
import { getWeeklySummary } from '@/app/actions/analytics'

/* ───────── Types & helpers ───────── */

type Log = {
    date: Date
    mood?: number | null
    energy?: number | null          // NEW
    sleepHours?: number | null
    workHours?: number | null
    meetings?: number | null        // NEW
    gym?: boolean | null            // NEW
    notes?: string | null           // NEW
}

const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
]

function avg(nums: number[]) {
    if (nums.length === 0) return null
    return nums.reduce((a, b) => a + b, 0) / nums.length
}

function addDays(d: Date, n: number) {
    const x = new Date(d)
    x.setDate(x.getDate() + n)
    return x
}

/* ───────── UI: Insights Panel (UNCHANGED) ───────── */

function InsightsPanel({
    avgMoodSleepGood,
    avgMoodSleepBad,
    avgMoodHighWork,
    avgMoodLowWork,
    currentStreak,
}: {
    avgMoodSleepGood: number | null
    avgMoodSleepBad: number | null
    avgMoodHighWork: number | null
    avgMoodLowWork: number | null
    currentStreak: number
}) {
    return (
        <div className="mb-8 rounded-2xl bg-white/5 border border-white/10 p-5">
            <div className="text-sm font-medium mb-3">Insights</div>

            <div className="space-y-2 text-sm text-white/70">
                {avgMoodSleepGood && avgMoodSleepBad ? (
                    <div>
                        💤 On days you slept <span className="text-white">7h+</span>, your mood averaged{' '}
                        <span className="text-cyan-300">{avgMoodSleepGood.toFixed(1)}</span>{' '}
                        vs <span className="text-white/60">{avgMoodSleepBad.toFixed(1)}</span>.
                    </div>
                ) : (
                    <div className="text-white/40">Not enough sleep data yet.</div>
                )}

                {avgMoodHighWork && avgMoodLowWork ? (
                    <div>
                        💼 High work-hour days tend to have lower mood (
                        <span className="text-white/60">{avgMoodHighWork.toFixed(1)}</span>{' '}
                        vs <span className="text-cyan-300">{avgMoodLowWork.toFixed(1)}</span>).
                    </div>
                ) : (
                    <div className="text-white/40">Not enough work-hour data yet.</div>
                )}

                {currentStreak >= 3 && (
                    <div>
                        🔥 Your current streak of <span className="text-cyan-300">{currentStreak}</span> days
                        aligns with higher consistency.
                    </div>
                )}
            </div>
        </div>
    )
}

/* ───────── Page ───────── */

export default function DailyLogCalendarPage() {
    const [logs, setLogs] = useState<Log[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [form, setForm] = useState({
        mood: 3,
        energy: null as number | null,   // NEW
        sleepHours: '',
        workHours: '',
        meetings: '',                    // NEW
        gym: false,                      // NEW
        notes: '',                       // NEW
    })

    const [cursor, setCursor] = useState(() => {
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1)
    })

    const refreshLogs = async () => {
        const res = await getWeeklySummary()
        if (res?.logs) setLogs(res.logs)
    }

    useEffect(() => {
        refreshLogs()
    }, [])

    /* ───────── Streak logic (UNCHANGED) ───────── */

    const loggedDays = new Set(
        logs.map((l) => new Date(l.date).toDateString())
    )

    const today = new Date()
    const todayKey = today.toDateString()

    let currentStreak = 0
    let cursorDay = loggedDays.has(todayKey)
        ? today
        : addDays(today, -1)

    while (loggedDays.has(cursorDay.toDateString())) {
        currentStreak++
        cursorDay = addDays(cursorDay, -1)
    }

    const sortedDays = Array.from(loggedDays)
        .map((d) => new Date(d))
        .sort((a, b) => a.getTime() - b.getTime())

    let longestStreak = 0
    let run = 0

    for (let i = 0; i < sortedDays.length; i++) {
        if (
            i === 0 ||
            addDays(sortedDays[i - 1], 1).toDateString() ===
            sortedDays[i].toDateString()
        ) {
            run++
        } else {
            longestStreak = Math.max(longestStreak, run)
            run = 1
        }
    }
    longestStreak = Math.max(longestStreak, run)

    /* ───────── Insights logic (UNCHANGED) ───────── */

    const moodBySleepGood: number[] = []
    const moodBySleepBad: number[] = []
    const moodHighWork: number[] = []
    const moodLowWork: number[] = []

    logs.forEach((l) => {
        if (l.mood == null) return

        if (l.sleepHours != null) {
            if (l.sleepHours >= 7) moodBySleepGood.push(l.mood)
            else moodBySleepBad.push(l.mood)
        }

        if (l.workHours != null) {
            if (l.workHours >= 8) moodHighWork.push(l.mood)
            else moodLowWork.push(l.mood)
        }
    })

    const avgMoodSleepGood = avg(moodBySleepGood)
    const avgMoodSleepBad = avg(moodBySleepBad)
    const avgMoodHighWork = avg(moodHighWork)
    const avgMoodLowWork = avg(moodLowWork)

    /* ───────── Calendar data (UNCHANGED) ───────── */

    const year = cursor.getFullYear()
    const month = cursor.getMonth()

    const isToday = (d: Date) => d.toDateString() === todayKey

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const logMap = new Map(
        logs.map((l) => [new Date(l.date).toDateString(), l])
    )

    const openDay = (day: number) => {
        const d = new Date(year, month, day)
        const log = logMap.get(d.toDateString())

        setSelectedDate(d)
        setForm({
            mood: log?.mood ?? 3,
            energy: log?.energy ?? null,
            sleepHours: log?.sleepHours?.toString() ?? '',
            workHours: log?.workHours?.toString() ?? '',
            meetings: log?.meetings?.toString() ?? '',
            gym: log?.gym ?? false,
            notes: log?.notes ?? '',
        })
    }

    const save = async () => {
        if (!selectedDate) return

        await upsertDailyLog({
            date: selectedDate,
            mood: form.mood,
            energy: form.energy ?? undefined,
            sleepHours: Number(form.sleepHours),
            workHours: Number(form.workHours),
            meetings: form.meetings ? Number(form.meetings) : undefined,
            gym: form.gym,
            notes: form.notes || undefined,
        })

        // ✅ REFRESH calendar data immediately
        await refreshLogs()

        setSelectedDate(null)
    }

    /* ───────── Render (UNCHANGED until modal) ───────── */

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-10 py-8 text-white">
            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-semibold">Daily Logs</h1>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setCursor(new Date(year, month - 1, 1))}
                            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                        >
                            ←
                        </button>

                        <select
                            value={month}
                            onChange={(e) =>
                                setCursor(new Date(year, Number(e.target.value), 1))
                            }
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm"
                        >
                            {MONTHS.map((m, i) => (
                                <option key={m} value={i} className="bg-[#0b1a2a]">
                                    {m}
                                </option>
                            ))}
                        </select>

                        <select
                            value={year}
                            onChange={(e) =>
                                setCursor(new Date(Number(e.target.value), month, 1))
                            }
                            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm"
                        >
                            {Array.from({ length: 7 }).map((_, i) => {
                                const y = today.getFullYear() - 5 + i
                                return (
                                    <option key={y} value={y} className="bg-[#0b1a2a]">
                                        {y}
                                    </option>
                                )
                            })}
                        </select>

                        <button
                            onClick={() => setCursor(new Date(year, month + 1, 1))}
                            className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10"
                        >
                            →
                        </button>
                    </div>
                </div>

                <p className="text-sm text-white/50 mt-1">
                    Days with activity reveal more details
                </p>
            </div>

            {/* Streaks */}
            <div className="mb-6 flex gap-6 text-sm">
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    🔥 Current streak: <span className="font-medium">{currentStreak}</span> day{currentStreak !== 1 && 's'}
                </div>
                <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    🏆 Longest streak: <span className="font-medium">{longestStreak}</span> day{longestStreak !== 1 && 's'}
                </div>
            </div>

            {/* Insights */}
            <InsightsPanel
                avgMoodSleepGood={avgMoodSleepGood}
                avgMoodSleepBad={avgMoodSleepBad}
                avgMoodHighWork={avgMoodHighWork}
                avgMoodLowWork={avgMoodLowWork}
                currentStreak={currentStreak}
            />

            {/* Weekdays */}
            <div className="grid grid-cols-7 text-xs text-white/50 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                    <div key={d} className="text-center">{d}</div>
                ))}
            </div>

            {/* Calendar */}
            <div className="grid grid-cols-7 gap-3 mb-10">
                {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const d = new Date(year, month, day)
                    const log = logMap.get(d.toDateString())

                    return (
                        <div key={day} className="relative group">
                            <button
                                onClick={() => openDay(day)}
                                className={`h-24 w-full rounded-xl border p-2 text-left transition
                                    ${isToday(d)
                                        ? 'border-cyan-400/60 bg-cyan-400/10'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10'}`}
                            >
                                <div className="text-xs text-white/60">{day}</div>

                                {log && (
                                    <div className="mt-3 flex gap-1">
                                        {log.mood && <span className="w-2 h-2 rounded-full bg-cyan-400" />}
                                        {log.energy && <span className="w-2 h-2 rounded-full bg-emerald-400" />}
                                        {log.sleepHours && <span className="w-2 h-2 rounded-full bg-indigo-400" />}
                                        {log.workHours && <span className="w-2 h-2 rounded-full bg-amber-400" />}
                                    </div>
                                )}
                            </button>
                        </div>
                    )
                })}
            </div>

            {/* Modal */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="w-[360px] rounded-2xl bg-[#0b1a2a] border border-white/10 p-6">
                        <div className="text-lg font-medium mb-4">
                            {selectedDate.toDateString()}
                        </div>

                        <label className="block text-sm mb-1">Mood (1–5)</label>
                        <input
                            type="number"
                            min={1}
                            max={5}
                            value={form.mood}
                            onChange={(e) =>
                                setForm({ ...form, mood: Number(e.target.value) })
                            }
                            className="w-full mb-3 bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                        />

                        <label className="block text-sm mb-1">Energy (1–5)</label>
                        <input
                            type="number"
                            min={1}
                            max={5}
                            value={form.energy ?? ''}
                            onChange={(e) =>
                                setForm({
                                    ...form,
                                    energy: e.target.value ? Number(e.target.value) : null,
                                })
                            }
                            className="w-full mb-3 bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                        />

                        <label className="block text-sm mb-1">Sleep hours</label>
                        <input
                            value={form.sleepHours}
                            onChange={(e) =>
                                setForm({ ...form, sleepHours: e.target.value })
                            }
                            className="w-full mb-3 bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                        />

                        <label className="block text-sm mb-1">Work hours</label>
                        <input
                            value={form.workHours}
                            onChange={(e) =>
                                setForm({ ...form, workHours: e.target.value })
                            }
                            className="w-full mb-3 bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                        />

                        <label className="block text-sm mb-1">Meetings</label>
                        <input
                            value={form.meetings}
                            onChange={(e) =>
                                setForm({ ...form, meetings: e.target.value })
                            }
                            className="w-full mb-3 bg-black/40 border border-white/10 rounded-lg px-3 py-2"
                        />

                        <label className="flex items-center gap-2 text-sm mb-3">
                            <input
                                type="checkbox"
                                checked={form.gym}
                                onChange={(e) =>
                                    setForm({ ...form, gym: e.target.checked })
                                }
                            />
                            Went to gym
                        </label>

                        <label className="block text-sm mb-1">Notes</label>
                        <textarea
                            value={form.notes}
                            onChange={(e) =>
                                setForm({ ...form, notes: e.target.value })
                            }
                            rows={3}
                            className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm"
                        />

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setSelectedDate(null)}
                                className="px-4 py-2 text-sm text-white/60"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={save}
                                className="px-4 py-2 rounded-lg bg-cyan-500 text-black text-sm font-medium"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
