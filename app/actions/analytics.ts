'use server'

import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

/* ============================================================
   Types
   ============================================================ */

export type NormalizedDailyLog = {
    date: string
    mood: number | null
    energy: number | null
    sleepHours: number | null
    workHours: number | null
    meetings: number
    gym: boolean
}

export type Insight = {
    title: string
    summary: string
    why: string[]
    confidence: number
    scope: 'weekly' | 'monthly'
    consistencyWeeks?: number
}

/* ============================================================
   Legacy weekly summary (UNCHANGED)
   ============================================================ */

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
                date: { gte: sevenDaysAgo },
            },
            orderBy: { date: 'desc' },
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

        return {
            logs,
            averages: {
                mood: moodCount ? totalMood / moodCount : null,
                sleep: sleepCount ? totalSleep / sleepCount : null,
                work: workCount ? totalWork / workCount : null,
            },
        }
    } catch {
        return { error: 'Failed to fetch weekly summary' }
    }
}

/* ============================================================
   Normalized analytics input
   ============================================================ */

async function getNormalizedDailyLogs(days: number) {
    const session = await getSession()
    if (!session) return null

    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)
    fromDate.setHours(0, 0, 0, 0)

    const logs = await db.dailyLog.findMany({
        where: {
            userId: session.userId,
            date: { gte: fromDate },
        },
        orderBy: { date: 'asc' },
    })

    return logs.map((log) => ({
        date: log.date.toISOString().split('T')[0],
        mood: log.mood,
        energy: log.energy,
        sleepHours: log.sleepHours,
        workHours: log.workHours,
        meetings: log.meetings ?? 0,
        gym: log.gym ?? false,
    }))
}

/* ============================================================
   Insight rules (UNCHANGED)
   ============================================================ */

function analyzeSleepVsMood(logs: NormalizedDailyLog[], scope: Insight['scope']): Insight | null {
    const valid = logs.filter(d => d.sleepHours !== null && d.mood !== null)
    if (valid.length < 5) return null

    const avgSleep = valid.reduce((s, d) => s + d.sleepHours!, 0) / valid.length
    const high = valid.filter(d => d.sleepHours! > avgSleep)
    const low = valid.filter(d => d.sleepHours! <= avgSleep)
    if (high.length < 2 || low.length < 2) return null

    const avgMood = (days: typeof valid) =>
        days.reduce((s, d) => s + d.mood!, 0) / days.length

    const diff = avgMood(high) - avgMood(low)
    if (Math.abs(diff) < 0.5) return null

    return {
        title: 'Sleep impacts your mood',
        summary: 'On days you sleep more than usual, your mood tends to be better.',
        why: [
            `Based on ${valid.length} days`,
            `Average sleep: ${avgSleep.toFixed(1)}h`,
            `Mood higher on higher-sleep days`,
        ],
        confidence: Math.min(1, valid.length / 14),
        scope,
    }
}

function analyzeMeetingsVsEnergy(logs: NormalizedDailyLog[], scope: Insight['scope']): Insight | null {
    const valid = logs.filter(d => d.energy !== null)
    if (valid.length < 5) return null

    const avgMeetings = valid.reduce((s, d) => s + d.meetings, 0) / valid.length
    const high = valid.filter(d => d.meetings > avgMeetings)
    const low = valid.filter(d => d.meetings <= avgMeetings)
    if (high.length < 2 || low.length < 2) return null

    const avgEnergy = (days: typeof valid) =>
        days.reduce((s, d) => s + d.energy!, 0) / days.length

    const diff = avgEnergy(low) - avgEnergy(high)
    if (Math.abs(diff) < 0.5) return null

    return {
        title: 'Meetings drain your energy',
        summary: 'Days with fewer meetings tend to leave you with more energy.',
        why: [
            `Average meetings: ${avgMeetings.toFixed(1)}`,
            `Energy lower on high-meeting days`,
        ],
        confidence: Math.min(1, valid.length / 14),
        scope,
    }
}

function analyzeGymVsMoodStability(logs: NormalizedDailyLog[], scope: Insight['scope']): Insight | null {
    const gymDays = logs.filter(d => d.gym && d.mood !== null)
    const nonGymDays = logs.filter(d => !d.gym && d.mood !== null)
    if (gymDays.length < 3 || nonGymDays.length < 3) return null

    const variance = (days: typeof gymDays) => {
        const avg = days.reduce((s, d) => s + d.mood!, 0) / days.length
        return days.reduce((s, d) => s + (d.mood! - avg) ** 2, 0) / days.length
    }

    if (variance(gymDays) >= variance(nonGymDays)) return null

    return {
        title: 'Gym days stabilize your mood',
        summary: 'On days you go to the gym, your mood fluctuates less.',
        why: [
            `Compared ${gymDays.length} gym days vs ${nonGymDays.length} non-gym days`,
        ],
        confidence: Math.min(1, gymDays.length / 10),
        scope,
    }
}

/* ============================================================
   STEP 5C.3.1 — Visibility & language softening
   ============================================================ */

function applyInsightVisibilityRules(insights: Insight[]): Insight[] {
    return insights
        .filter((i) => i.confidence >= 0.4)
        .map((i) => {
            if (i.confidence < 0.6) {
                return {
                    ...i,
                    title: soften(i.title),
                    summary: soften(i.summary),
                }
            }
            return i
        })
}

function soften(text: string) {
    return text
        .replace('impacts', 'may affect')
        .replace('drain', 'might be draining')
        .replace('stabilize', 'seem to stabilize')
}

/* ============================================================
   STEP 5C.3.2 — Confidence normalization
   ============================================================ */

const INSIGHT_WEIGHTS: Record<string, number> = {
    'Sleep impacts your mood': 1.0,
    'Meetings drain your energy': 0.9,
    'Gym days stabilize your mood': 0.8,
    'Long workdays affect your mood': 0.9,
    'Sleep affects your next-day energy': 1.0,
    'Energy crash risk tomorrow': 0.85,
}

function normalizeConfidence(insight: Insight): Insight {
    const weight = INSIGHT_WEIGHTS[insight.title] ?? 0.85
    const weighted = insight.confidence * weight

    let snapped: number

    if (weighted < 0.55) snapped = 0.5
    else if (weighted < 0.7) snapped = 0.65
    else if (weighted < 0.85) snapped = 0.8
    else snapped = 0.9

    return {
        ...insight,
        confidence: snapped,
    }
}



/* ============================================================
   Insight Rule — Work Hours vs Mood
   ============================================================ */

function analyzeWorkHoursVsMood(
    logs: NormalizedDailyLog[],
    scope: Insight['scope']
): Insight | null {
    const valid = logs.filter(
        (d) => d.workHours !== null && d.mood !== null
    )

    if (valid.length < 5) return null

    const avgWork =
        valid.reduce((s, d) => s + d.workHours!, 0) / valid.length

    const highWorkDays = valid.filter((d) => d.workHours! > avgWork)
    const lowWorkDays = valid.filter((d) => d.workHours! <= avgWork)

    if (highWorkDays.length < 2 || lowWorkDays.length < 2) return null

    const avgMood = (days: typeof valid) =>
        days.reduce((s, d) => s + d.mood!, 0) / days.length

    const moodHighWork = avgMood(highWorkDays)
    const moodLowWork = avgMood(lowWorkDays)

    const diff = moodLowWork - moodHighWork

    if (diff < 0.5) return null

    return {
        title: 'Long workdays affect your mood',
        summary:
            'On days you work longer than usual, your mood tends to be lower.',
        why: [
            `Based on ${valid.length} days with work and mood data`,
            `Your average workday is ${avgWork.toFixed(1)} hours`,
            'Mood is lower on longer workdays',
        ],
        confidence: Math.min(1, valid.length / 14),
        scope,
    }
}

/* ============================================================
   Insight Rule — Sleep → Next-Day Energy (Lag)
   ============================================================ */

function analyzeSleepLagVsEnergy(
    logs: NormalizedDailyLog[],
    scope: Insight['scope']
): Insight | null {
    const pairs: { sleep: number; energy: number }[] = []

    for (let i = 0; i < logs.length - 1; i++) {
        const today = logs[i]
        const tomorrow = logs[i + 1]

        if (
            today.sleepHours !== null &&
            tomorrow.energy !== null
        ) {
            pairs.push({
                sleep: today.sleepHours,
                energy: tomorrow.energy,
            })
        }
    }

    if (pairs.length < 5) return null

    const avgSleep =
        pairs.reduce((s, p) => s + p.sleep, 0) / pairs.length

    const highSleep = pairs.filter((p) => p.sleep > avgSleep)
    const lowSleep = pairs.filter((p) => p.sleep <= avgSleep)

    if (highSleep.length < 2 || lowSleep.length < 2) return null

    const avgEnergy = (arr: typeof pairs) =>
        arr.reduce((s, p) => s + p.energy, 0) / arr.length

    const energyHighSleep = avgEnergy(highSleep)
    const energyLowSleep = avgEnergy(lowSleep)

    const diff = energyHighSleep - energyLowSleep

    if (diff < 0.5) return null

    return {
        title: 'Sleep affects your next-day energy',
        summary:
            'When you sleep more than usual, your energy tends to be higher the next day.',
        why: [
            `Based on ${pairs.length} day-to-day transitions`,
            `Higher sleep days lead to higher next-day energy`,
        ],
        confidence: Math.min(1, pairs.length / 14),
        scope,
    }
}

/* ============================================================
   Prediction — Energy Crash (Lagged, Multi-day)
   ============================================================ */

function predictEnergyCrash(
    logs: NormalizedDailyLog[],
    scope: Insight['scope']
): Insight | null {
    if (logs.length < 5) return null

    const recent = logs.slice(-3)

    const validSleepDays = logs.filter((d) => d.sleepHours !== null)
    if (validSleepDays.length < 5) return null

    const avgSleep =
        validSleepDays.reduce((s, d) => s + d.sleepHours!, 0) /
        validSleepDays.length

    let lowSleepCount = 0
    let lowEnergyCount = 0

    for (const d of recent) {
        if (d.sleepHours !== null && d.sleepHours < avgSleep - 0.75) {
            lowSleepCount++
        }
        if (d.energy !== null && d.energy <= 2) {
            lowEnergyCount++
        }
    }

    // Conservative trigger
    if (lowSleepCount < 2 || lowEnergyCount < 2) return null

    return {
        title: 'Energy crash risk tomorrow',
        summary:
            'Based on the last few days, you may feel noticeably low energy tomorrow.',
        why: [
            'Sleep has been below your usual baseline',
            'Energy levels have been low for multiple days',
            'Similar patterns in the past often lead to fatigue',
        ],
        confidence: 0.75, // raw confidence, will be normalized
        scope,
    }
}

/* ============================================================
   STEP 5C.3.3 — Temporal stability
   ============================================================ */

function filterStableInsights(
    allLogs: NormalizedDailyLog[],
    scope: Insight['scope'],
    insights: Insight[]
): Insight[] {
    if (allLogs.length < 10) return insights // not enough data to judge stability

    const mid = Math.floor(allLogs.length / 2)
    const firstHalf = allLogs.slice(0, mid)
    const secondHalf = allLogs.slice(mid)

    const runRules = (logs: NormalizedDailyLog[]) => {
        return [
            analyzeSleepVsMood(logs, scope),
            analyzeMeetingsVsEnergy(logs, scope),
            analyzeGymVsMoodStability(logs, scope),
            analyzeWorkHoursVsMood(logs, scope),
            analyzeSleepLagVsEnergy(logs, scope),
            predictEnergyCrash(logs, scope),
        ]
            .filter(Boolean)
            .map((i) => i!.title)
    }

    const firstTitles = new Set(runRules(firstHalf))
    const secondTitles = new Set(runRules(secondHalf))

    return insights.filter((i) => firstTitles.has(i.title) && secondTitles.has(i.title))
}

/* ============================================================
   STEP 5D.2 — Consistency tagging (no persistence yet)
   ============================================================ */

function tagConsistency(
    weekly: Insight[],
    monthly: Insight[]
): Insight[] {
    const monthlyTitles = new Set(monthly.map((i) => i.title))

    return weekly.map((insight) => {
        if (monthlyTitles.has(insight.title)) {
            return {
                ...insight,
                consistencyWeeks: 2, // weekly + monthly agreement
            }
        }
        return insight
    })
}


/* ============================================================
   Public aggregator
   ============================================================ */

export async function getRuleBasedInsights(
    scope: Insight['scope']
): Promise<Insight[]> {
    const session = await getSession()
    if (!session) return []

    const days = scope === 'weekly' ? 14 : 45
    const logs = await getNormalizedDailyLogs(days)
    if (!logs) return []

    const raw = [
        analyzeSleepVsMood(logs, scope),
        analyzeMeetingsVsEnergy(logs, scope),
        analyzeGymVsMoodStability(logs, scope),
        analyzeWorkHoursVsMood(logs, scope),
        analyzeSleepLagVsEnergy(logs, scope),
        predictEnergyCrash(logs, scope),
    ].filter(Boolean) as Insight[]

    const visible = applyInsightVisibilityRules(raw).map(normalizeConfidence)
    const stable = filterStableInsights(logs, scope, visible)

    // ✅ session is now defined
    await persistInsightEvents(session.userId, stable)

    return stable
}

/* ============================================================
   Public aggregator — with consistency metadata
   ============================================================ */

export async function getConsistentInsights(
    scope: Insight['scope']
): Promise<Insight[]> {
    if (scope === 'monthly') {
        return getRuleBasedInsights('monthly')
    }

    const weekly = await getRuleBasedInsights('weekly')
    const monthly = await getRuleBasedInsights('monthly')

    return tagConsistency(weekly, monthly)
}

async function persistInsightEvents(
    userId: string,
    insights: Insight[]
) {
    if (insights.length === 0) return

    await db.insightEvent.createMany({
        data: insights.map((i) => ({
            userId,
            insightKey: i.title, // later becomes a stable key
            scope: i.scope,
            confidence: i.confidence,
            type: i.title.includes('risk') ? 'prediction' : 'insight',
        })),
        skipDuplicates: true,
    })
}
