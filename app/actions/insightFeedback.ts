'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function submitInsightFeedback(
    insightKey: string,
    action: 'acknowledged' | 'dismissed'
) {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    await db.insightFeedback.upsert({
        where: {
            userId_insightKey: {
                userId: session.userId,
                insightKey,
            },
        },
        update: { action },
        create: {
            userId: session.userId,
            insightKey,
            action,
        },
    })

    return { success: true }
}
