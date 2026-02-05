'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

function startOfWeek(date: Date) {
    const d = new Date(date)
    const day = d.getDay() || 7
    if (day !== 1) d.setDate(d.getDate() - day + 1)
    d.setHours(0, 0, 0, 0)
    return d
}

function endOfWeek(start: Date) {
    const d = new Date(start)
    d.setDate(d.getDate() + 6)
    d.setHours(23, 59, 59, 999)
    return d
}

export async function generateWeeklyDerivedMetrics() {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    const now = new Date()
    const periodStart = startOfWeek(now)
    const periodEnd = endOfWeek(periodStart)

    const logs = await db.dailyLog.findMany({
        where: {
            userId: session.userId,
            date: {
                gte: periodStart,
                lte: periodEnd,
            },
        },
    })

    if (logs.length === 0) {
        return { error: 'No logs for this week' }
    }

    let moodSum = 0,
        sleepSum = 0,
        workSum = 0
    let moodCount = 0,
        sleepCount = 0,
        workCount = 0

    for (const log of logs) {
        if (log.mood !== null) {
            moodSum += log.mood
            moodCount++
        }
        if (log.sleepHours !== null) {
            sleepSum += log.sleepHours
            sleepCount++
        }
        if (log.workHours !== null) {
            workSum += log.workHours
            workCount++
        }
    }

    const averages = {
        mood: moodCount ? moodSum / moodCount : null,
        sleep: sleepCount ? sleepSum / sleepCount : null,
        work: workCount ? workSum / workCount : null,
    }

    // Idempotent upsert (one row per user per week)
    await db.derivedMetrics.upsert({
        where: {
            userId_periodStart_periodEnd: {
                userId: session.userId,
                periodStart,
                periodEnd,
            },
        },
        update: {
            averages,
        },
        create: {
            userId: session.userId,
            periodStart,
            periodEnd,
            averages,
            deltas: {},
            correlations: {},
        },
    })

    return { success: true, averages }
}
