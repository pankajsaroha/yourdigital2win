'use client'

import { useState } from 'react'
import { upsertDailyLog } from '@/app/actions/dailylog'

export default function DailyLogClient() {
    const [mood, setMood] = useState(3)
    const [sleepHours, setSleepHours] = useState('')
    const [workHours, setWorkHours] = useState('')
    const [meetings, setMeetings] = useState('')
    const [gym, setGym] = useState(false)
    const [notes, setNotes] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState<string | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage(null)

        const res = await upsertDailyLog({
            mood,
            sleepHours: sleepHours ? parseFloat(sleepHours) : undefined,
            workHours: workHours ? parseFloat(workHours) : undefined,
            meetings: meetings ? parseInt(meetings) : undefined,
            gym,
            notes: notes || undefined,
        })

        setLoading(false)
        setMessage(res?.error ?? 'Saved successfully')
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-900">Today’s Log</h2>

            <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                    Mood (1–5)
                </label>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((v) => (
                        <button
                            key={v}
                            type="button"
                            onClick={() => setMood(v)}
                            className={`h-10 w-10 rounded-lg border ${mood === v
                                    ? 'bg-sky-500 text-white border-sky-500'
                                    : 'border-slate-300 text-slate-600'
                                }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>
            </div>

            <Input label="Sleep hours" value={sleepHours} onChange={setSleepHours} />
            <Input label="Work hours" value={workHours} onChange={setWorkHours} />
            <Input label="Meetings" value={meetings} onChange={setMeetings} />

            <label className="flex items-center gap-2 text-slate-700">
                <input type="checkbox" checked={gym} onChange={(e) => setGym(e.target.checked)} />
                Went to gym
            </label>

            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Notes about your day"
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />

            {message && <div className="text-sm text-slate-600">{message}</div>}

            <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-sky-500 py-3 font-semibold text-white hover:bg-sky-600 disabled:opacity-50"
            >
                {loading ? 'Saving…' : 'Save'}
            </button>
        </form>
    )
}

function Input({
    label,
    value,
    onChange,
}: {
    label: string
    value: string
    onChange: (v: string) => void
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">
                {label}
            </label>
            <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
        </div>
    )
}
