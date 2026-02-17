'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function upsertDailyLog(data: {
    date: Date
    mood?: number
    energy?: number
    sleepHours?: number
    workHours?: number
    meetings?: number
    gym?: boolean
    notes?: string
}) {
    try {
        const session = await getSession()
        if (!session) {
            return { error: 'Unauthorized' }
        }

        const logDate = new Date(data.date)

        const dailyLog = await db.dailyLog.upsert({
            where: {
                userId_date: {
                    userId: session.userId,
                    date: logDate,
                },
            },
            update: {
                mood: data.mood,
                energy: data.energy ?? null,
                sleepHours: data.sleepHours,
                workHours: data.workHours,
                meetings: data.meetings,
                gym: data.gym,
                notes: data.notes,
            },
            create: {
                userId: session.userId,
                date: logDate,
                mood: data.mood,
                energy: data.energy ?? null,
                sleepHours: data.sleepHours,
                workHours: data.workHours,
                meetings: data.meetings,
                gym: data.gym ?? false,
                notes: data.notes,
            },
        })

        revalidatePath('/dashboard')
        revalidatePath('/daily-log')

        return { success: true, dailyLog }
    } catch (error) {
        console.error('Upsert daily log error:', error)
        return { error: 'Failed to save daily log' }
    }
}
