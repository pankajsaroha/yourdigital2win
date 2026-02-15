// lib/energy-index.ts

import { DailyLog } from "@prisma/client"

const clamp = (val: number, min = 0, max = 1) =>
    Math.max(min, Math.min(max, val))

const IDEAL_SLEEP = 7.5

export function calculateEnergyIndex(
    logs: DailyLog[],
    crashProbability: number
) {
    if (!logs.length) return 50

    const latest = logs[logs.length - 1]

    const latestSleep = latest.sleepHours ?? 0
    const latestWork = latest.workHours ?? 0
    const latestMood = latest.mood ?? 5
    const latestMeetings = latest.meetings ?? 0

    const avgSleep =
        logs.reduce((acc, l) => acc + (l.sleepHours ?? 0), 0) / logs.length

    const sleepConsistency =
        1 - clamp(Math.abs(avgSleep - IDEAL_SLEEP) / IDEAL_SLEEP)

    const sleepScore =
        clamp(latestSleep / IDEAL_SLEEP) * 0.7 +
        sleepConsistency * 0.3

    const loadScore =
        1 - clamp(latestWork / 10)

    const meetingPenalty =
        latestMeetings > 5 ? 0.15 : 0

    const gymScore = latest.gym ? 1 : 0.5

    const moodScore = clamp(latestMood / 10)

    const resilienceScore = 1 - clamp(crashProbability ?? 0)

    const energy =
        sleepScore * 0.30 +
        (loadScore - meetingPenalty) * 0.25 +
        gymScore * 0.10 +
        moodScore * 0.15 +
        resilienceScore * 0.20

    return Math.round(clamp(energy) * 100)
}
