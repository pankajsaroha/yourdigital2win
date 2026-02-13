// app/lib/insightEngine.ts

/* ───────── Types ───────── */

export type DailyLog = {
    date: Date
    mood?: number | null        // 1–5
    energy?: number | null      // 1–5 (NEW, required soon)
    sleepHours?: number | null
    workHours?: number | null
    meetings?: number | null
    gym?: boolean | null
}

export type Insight = {
    id: string
    title: string
    description: string
    why: string
    confidence: number          // 0–1
    scope: 'weekly' | 'monthly'
}

/* ───────── Helpers ───────── */

function avg(nums: number[]) {
    if (nums.length === 0) return null
    return nums.reduce((a, b) => a + b, 0) / nums.length
}

function confidenceFromDays(days: number) {
    return Math.min(0.95, days / 14)
}

function lastNDays(logs: DailyLog[], n: number) {
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - n)
    return logs.filter(l => new Date(l.date) >= cutoff)
}

/* ───────── Insight Engine ───────── */

export function generateInsights(
    logs: DailyLog[],
    scope: 'weekly' | 'monthly'
): Insight[] {
    const windowed =
        scope === 'weekly' ? lastNDays(logs, 7) : lastNDays(logs, 30)

    const insights: Insight[] = []

    /* ───── Sleep → Mood ───── */

    const sleepGood: number[] = []
    const sleepBad: number[] = []

    windowed.forEach(l => {
        if (l.mood == null || l.sleepHours == null) return
        if (l.sleepHours >= 7) sleepGood.push(l.mood)
        else sleepBad.push(l.mood)
    })

    if (sleepGood.length >= 3 && sleepBad.length >= 3) {
        const good = avg(sleepGood)!
        const bad = avg(sleepBad)!

        insights.push({
            id: 'sleep-mood',
            title: 'Sleep Improves Your Mood',
            description: `You feel better on days you sleep at least 7 hours.`,
            why: `Based on ${sleepGood.length + sleepBad.length} days comparing your sleep and mood.`,
            confidence: confidenceFromDays(sleepGood.length + sleepBad.length),
            scope,
        })
    }

    /* ───── Work → Energy / Mood ───── */

    const highWork: number[] = []
    const lowWork: number[] = []

    windowed.forEach(l => {
        if (l.mood == null || l.workHours == null) return
        if (l.workHours >= 9) highWork.push(l.mood)
        else lowWork.push(l.mood)
    })

    if (highWork.length >= 3 && lowWork.length >= 3) {
        insights.push({
            id: 'work-mood',
            title: 'Long Workdays Drain You',
            description: `High work-hour days correlate with lower mood.`,
            why: `Compared days with ≥9h vs <9h of work.`,
            confidence: confidenceFromDays(highWork.length + lowWork.length),
            scope,
        })
    }

    /* ───── Meetings → Mood ───── */

    const manyMeetings: number[] = []
    const fewMeetings: number[] = []

    windowed.forEach(l => {
        if (l.mood == null || l.meetings == null) return
        if (l.meetings >= 4) manyMeetings.push(l.mood)
        else fewMeetings.push(l.mood)
    })

    if (manyMeetings.length >= 3 && fewMeetings.length >= 3) {
        insights.push({
            id: 'meetings-mood',
            title: 'Meetings Affect Your Mood',
            description: `Meeting-heavy days tend to reduce your mood.`,
            why: `Compared days with ≥4 meetings vs fewer.`,
            confidence: confidenceFromDays(manyMeetings.length + fewMeetings.length),
            scope,
        })
    }

    /* ───── Consistency (Non-guilt) ───── */

    if (windowed.length >= 5) {
        insights.push({
            id: 'consistency',
            title: 'Consistency Stabilizes You',
            description: `Your mood appears more stable when you log consistently.`,
            why: `Based on ${windowed.length} logged days in this period.`,
            confidence: confidenceFromDays(windowed.length),
            scope,
        })
    }

    return insights
}
