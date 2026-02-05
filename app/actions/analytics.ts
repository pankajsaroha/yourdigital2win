'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function getWeeklySummary() {
    try {
        const session = await getSession()
        if (!session) {
            return { error: 'Unauthorized' }
        }

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        sevenDaysAgo.setHours(0, 0, 0, 0)

        const logs = await db.dailyLog.findMany({
            where: {
                userId: session.userId,
                date: {
                    gte: sevenDaysAgo,
                },
            },
            orderBy: {
                date: 'desc',
            },
        })

        let totalMood = 0
        let totalSleep = 0
        let totalWork = 0
        let moodCount = 0
        let sleepCount = 0
        let workCount = 0

        logs.forEach((log) => {
            if (log.mood !== null) {
                totalMood += log.mood
                moodCount++
            }
            if (log.sleepHours !== null) {
                totalSleep += log.sleepHours
                sleepCount++
            }
            if (log.workHours !== null) {
                totalWork += log.workHours
                workCount++
            }
        })

        const averages = {
            mood: moodCount > 0 ? totalMood / moodCount : null,
            sleep: sleepCount > 0 ? totalSleep / sleepCount : null,
            work: workCount > 0 ? totalWork / workCount : null,
        }

        return { logs, averages }
    } catch (error) {
        console.error('Get weekly summary error:', error)
        return { error: 'Failed to fetch weekly summary' }
    }
}
