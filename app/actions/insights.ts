'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { InsightType } from '@prisma/client'

export async function generateWeeklyInsights() {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    const latestMetrics = await db.derivedMetrics.findFirst({
        where: { userId: session.userId },
        orderBy: { periodStart: 'desc' },
    })

    if (!latestMetrics) {
        return { error: 'No derived metrics found' }
    }

    const { averages, periodStart, periodEnd } = latestMetrics as any

    const insights: {
        type: InsightType
        content: string
        confidence: number
    }[] = []

    if (averages?.sleep !== null) {
        if (averages.sleep < 6) {
            insights.push({
                type: InsightType.PATTERN,
                content: 'Your average sleep this week was low. Consider improving your sleep routine.',
                confidence: 0.75,
            })
        } else if (averages.sleep >= 8) {
            insights.push({
                type: InsightType.PATTERN,
                content: 'Great job maintaining healthy sleep hours this week.',
                confidence: 0.8,
            })
        }
    }

    if (averages?.mood !== null && averages?.sleep !== null) {
        if (averages.sleep >= 7 && averages.mood >= 4) {
            insights.push({
                type: InsightType.CORRELATION,
                content: 'Higher sleep hours seem to correlate with better mood for you.',
                confidence: 0.7,
            })
        }
    }

    for (const insight of insights) {
        await db.insight.upsert({
            where: {
                userId_type_periodStart_periodEnd: {
                    userId: session.userId,
                    type: insight.type,
                    periodStart,
                    periodEnd,
                },
            },
            update: {
                content: insight.content,
                confidence: insight.confidence,
            },
            create: {
                userId: session.userId,
                type: insight.type,
                periodStart,
                periodEnd,
                content: insight.content,
                confidence: insight.confidence,
            },
        })
    }

    return { success: true, count: insights.length }
}
