'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function getLatestInsights() {
    const session = await getSession()
    if (!session) return { error: 'Unauthorized' }

    const insights = await db.insight.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
    })

    return { insights }
}
