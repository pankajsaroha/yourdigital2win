'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export type BurnoutState =
    | 'balanced'
    | 'strained'
    | 'drifting'
    | 'at_risk'

export type BurnoutAssessment = {
    state: BurnoutState
    riskScore: number
    message: string
    drivers: string[]
}

/* ============================================================
   Weekly Burnout Assessment (7-day window)
   ============================================================ */

export async function getWeeklyBurnoutAssessment(): Promise<BurnoutAssessment | null> {
    const session = await getSession()
    if (!session) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(today.getDate() - 6)

    const logs = await db.dailyLog.findMany({
        where: {
            userId: session.userId,
            date: {
                gte: sevenDaysAgo,
            },
        },
        orderBy: { date: 'asc' },
    })

    if (logs.length < 3) {
        return {
            state: 'balanced',
            riskScore: 0,
            message: 'Not enough data this week to assess strain.',
            drivers: [],
        }
    }

    let riskScore = 0
    const drivers: string[] = []

    /* ------------------------------------------------------------
       1. Low sleep relative to week
    ------------------------------------------------------------ */

    const sleepValues = logs
        .map((l) => l.sleepHours)
        .filter((v): v is number => v != null)

    if (sleepValues.length >= 3) {
        const avgSleep =
            sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length

        const lowSleepDays = sleepValues.filter((s) => s < avgSleep - 0.75)

        if (lowSleepDays.length >= 2) {
            riskScore++
            drivers.push('Sleep below weekly baseline')
        }
    }

    /* ------------------------------------------------------------
       2. Work hours rising + mood dropping
    ------------------------------------------------------------ */

    const moodValues = logs
        .map((l) => l.mood)
        .filter((v): v is number => v != null)

    const workValues = logs
        .map((l) => l.workHours)
        .filter((v): v is number => v != null)

    if (moodValues.length >= 3 && workValues.length >= 3) {
        const avgMood =
            moodValues.reduce((a, b) => a + b, 0) / moodValues.length

        const avgWork =
            workValues.reduce((a, b) => a + b, 0) / workValues.length

        if (avgWork > 9 && avgMood < 3) {
            riskScore++
            drivers.push('High work hours with lower mood')
        }
    }

    /* ------------------------------------------------------------
       3. Energy crash pattern this week
    ------------------------------------------------------------ */

    const energyValues = logs
        .map((l) => l.energy)
        .filter((v): v is number => v != null)

    const lowEnergyDays = energyValues.filter((e) => e <= 2)

    if (lowEnergyDays.length >= 2) {
        riskScore += 2
        drivers.push('Multiple low-energy days')
    }

    /* ------------------------------------------------------------
       4. Meeting load correlated with low energy
    ------------------------------------------------------------ */

    const heavyMeetingDays = logs.filter(
        (l) => l.meetings != null && l.meetings >= 5
    )

    const lowEnergyAfterMeetings = heavyMeetingDays.filter(
        (l) => l.energy != null && l.energy <= 2
    )

    if (
        heavyMeetingDays.length >= 2 &&
        lowEnergyAfterMeetings.length >= 2
    ) {
        riskScore++
        drivers.push('Meeting load affecting energy')
    }

    /* ============================================================
       State Mapping
    ============================================================ */

    let state: BurnoutState = 'balanced'
    // let message = 'You are operating within your stable range.'
    let message = 'No strain signals detected this week.'

    if (riskScore >= 4) {
        state = 'at_risk'
        message =
            'Recent patterns suggest elevated burnout risk.'
    } else if (riskScore === 3) {
        state = 'drifting'
        message =
            'Strain signals are aligning across multiple areas.'
    } else if (riskScore === 2) {
        state = 'strained'
        message =
            'Pressure appears to be building this week.'
    }

    return {
        state,
        riskScore,
        message,
        drivers,
    }
}
