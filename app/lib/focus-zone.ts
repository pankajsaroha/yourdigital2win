// lib/focus-zone.ts

import { DailyLog } from "@prisma/client"

export function detectFocusZone(logs: DailyLog[]) {
    if (!logs.length) return "Not enough data yet."

    const highEnergyDays = logs.filter(
        (l) => (l.energy ?? 0) > 75
    )

    if (!highEnergyDays.length)
        return "No consistent peak performance pattern yet."

    const lowMeetingDays =
        highEnergyDays.filter(
            (l) => (l.meetings ?? 0) < 3
        )

    const correlation =
        (lowMeetingDays.length / highEnergyDays.length) * 100

    if (correlation > 60)
        return "High energy strongly correlates with low-meeting days."

    return "Peak energy appears irregular. Try reducing meeting load."
}
