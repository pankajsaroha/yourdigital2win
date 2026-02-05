import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateWeeklyInsights } from '@/app/lib/insights'

export async function GET() {
    const users = await db.user.findMany({
        select: { id: true },
    })

    for (const user of users) {
        await generateWeeklyInsights(user.id)
    }

    return NextResponse.json({ success: true })
}
