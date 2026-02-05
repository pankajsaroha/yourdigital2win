'use client'

import { useEffect, useState } from 'react'
import { upsertDailyLog } from '@/app/actions/dailylog'
import { getWeeklySummary } from '@/app/actions/analytics'

type Log = {
    date: Date
    mood?: number | null
    sleepHours?: number | null
    workHours?: number | null
}

export default function DailyLogCalendarPage() {
    const [logs, setLogs] = useState<Log[]>([])
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [form, setForm] = useState({
        mood: 3,
        sleepHours: '',
        workHours: '',
    })

    useEffect(() => {
        getWeeklySummary().then((res) => {
            if (res?.logs) setLogs(res.logs)
        })
    }, [])

    const today = new Date()
    const year = today.getFullYear()
    const month = today.getMonth()

    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const logMap = new Map(
        logs.map((l) => [
            new Date(l.date).toDateString(),
            l,
        ])
    )

    const openDay = (day: number) => {
        const d = new Date(year, month, day)
        const log = logMap.get(d.toDateString())

        setSelectedDate(d)
        setForm({
            mood: log?.mood ?? 3,
            sleepHours: log?.sleepHours?.toString() ?? '',
            workHours: log?.workHours?.toString() ?? '',
        })
    }

    const save = async () => {
        if (!selectedDate) return

        await upsertDailyLog({
            mood: form.mood,
            sleepHours: Number(form.sleepHours),
            workHours: Number(form.workHours),
        })

        setSelectedDate(null)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] px-10 py-8 text-white">
            <h1 className="text-3xl font-semibold mb-6">Daily Logs</h1>

            {/* Calendar */}
            <div className="grid grid-cols-7 gap-3 mb-10">
                {Array.from({ length: firstDay }).map((_, i) => (
                    <div key={i} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1
                    const d = new Date(year, month, day)
                    const log = logMap.get(d.toDateString())

                    return (
                        <button
                            key={day}
                            onClick={() => openDay(day)}
                            className="h-20 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left p-2"
                        >
                            <div className="text-xs text-white/60">{day}</div>

                            {log && (
                                <div className="mt-2 flex gap-1">
                                    {log.mood && (
                                        <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                    )}
                                    {log.sleepHours && (
                                        <span className="w-2 h-2 rounded-full bg-indigo-400" />
                                    )}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Edit Modal */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
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
                            className="w-full mb-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2"
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
