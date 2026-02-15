// lib/burnout-risk.ts

import { DailyLog } from "@prisma/client"

const clamp = (v: number, min = 0, max = 1) =>
    Math.max(min, Math.min(max, v))

export function calculateBurnoutRisk(
    logs: DailyLog[],
    crashProbability: number
) {
    if (logs.length < 5) return 20

    const recent = logs.slice(-7)

    const avgSleep =
        recent.reduce((a, l) => a + (l.sleepHours ?? 0), 0) /
        recent.length

    const avgWork =
        recent.reduce((a, l) => a + (l.workHours ?? 0), 0) /
        recent.length

    const sleepDebt =
        Math.max(0, (7.5 - avgSleep) * 7)

    let risk = 0

    if (sleepDebt > 5) risk += 0.2
    if (avgWork > 8.5) risk += 0.2

    // Energy trend
    const firstEnergy = recent[0].energy ?? 50
    const lastEnergy =
        recent[recent.length - 1].energy ?? 50

    const energyTrend = lastEnergy - firstEnergy

    if (energyTrend < -10) risk += 0.3

    risk += clamp(crashProbability ?? 0) * 0.3

    return Math.round(clamp(risk) * 100)
}
