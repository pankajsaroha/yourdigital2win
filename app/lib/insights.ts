import { db } from '@/lib/db'
import { InsightType } from '@prisma/client'

export async function generateWeeklyInsights(userId: string) {
    const periodEnd = new Date()
    const periodStart = new Date()
    periodStart.setDate(periodEnd.getDate() - 7)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const logs = await db.dailyLog.findMany({
        where: {
            userId,
            date: { gte: sevenDaysAgo },
        },
    })

    if (logs.length === 0) return

    const avg = {
        sleep:
            logs.reduce((s, l) => s + (l.sleepHours ?? 0), 0) / logs.length,
        mood:
            logs.reduce((s, l) => s + (l.mood ?? 0), 0) / logs.length,
        work:
            logs.reduce((s, l) => s + (l.workHours ?? 0), 0) / logs.length,
    }

    const insights: {
        type: InsightType
        content: string
        confidence: number
    }[] = []

    if (avg.sleep < 6.5) {
        insights.push({
            type: InsightType.WEEKLY,
            content:
                'Your sleep averaged below 6.5 hours this week, which may affect focus and mood.',
            confidence: 0.82,
        })
    }

    if (avg.work > 9) {
        insights.push({
            type: InsightType.PATTERN,
            content:
                'High work hours detected consistently this week. Consider recovery time.',
            confidence: 0.78,
        })
    }

    if (avg.mood < 3) {
        insights.push({
            type: InsightType.PREDICTION,
            content:
                'Lower mood trend detected. Improving sleep may help next week.',
            confidence: 0.75,
        })
    }

    if (insights.length === 0) {
        insights.push({
            type: InsightType.WEEKLY,
            content:
                'Your week looked balanced across sleep, work, and mood. Keep it up.',
            confidence: 0.9,
        })
    }

    // Clear old weekly insights
    await db.insight.deleteMany({
        where: {
            userId,
            type: InsightType.WEEKLY,
        },
    })

    await db.insight.createMany({
        data: insights.map((i) => ({
            userId,
            type: i.type,
            content: i.content,
            confidence: i.confidence,
            periodStart,
            periodEnd,
        })),
    })
}
