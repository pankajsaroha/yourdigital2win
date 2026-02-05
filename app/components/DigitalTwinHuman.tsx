'use client'

type Props = {
    mood?: number | null
    sleep?: number | null
    work?: number | null
}

export default function DigitalTwinHuman({
    mood = 3,
    sleep = 7,
    work = 8,
}: Props) {
    return (
        <div className="relative h-full flex items-center justify-center">
            {/* Ambient aura */}
            <div className="absolute inset-0 bg-gradient-radial from-cyan-400/10 via-transparent to-transparent blur-3xl" />

            {/* Breathing body */}
            <div className="relative z-10 h-[560px] w-[260px] flex items-center justify-center animate-breathe">
                <img
                    src="/human-silhouette.png"
                    alt="Digital Twin"
                    className="h-full object-contain opacity-95"
                />

                {/* Data-bound glows with tooltips */}
                <Glow
                    x="50%"
                    y="14%"
                    label="Mood"
                    value={`${mood ?? 3}/5`}
                    message={moodMessage(mood ?? 3)}
                    strength={normalize(mood ?? 3, 1, 5)}
                />
                <Glow
                    x="50%"
                    y="30%"
                    label="Sleep"
                    value={`${sleep ?? 7}h`}
                    message={sleepMessage(sleep ?? 7)}
                    strength={normalize(sleep ?? 7, 4, 9)}
                />
                <Glow
                    x="44%"
                    y="42%"
                    label="Focus"
                    value={`${work ?? 8}h work`}
                    message={focusMessage(work ?? 8)}
                    strength={normalize(work ?? 8, 4, 10)}
                />
                <Glow
                    x="56%"
                    y="42%"
                    label="Work"
                    value={`${work ?? 8}h`}
                    message={workMessage(work ?? 8)}
                    strength={normalize(work ?? 8, 4, 10)}
                />
                <Glow
                    x="50%"
                    y="62%"
                    label="Activity"
                    value={`${work ?? 8}h`}
                    message="Overall physical & mental load"
                    strength={normalize(work ?? 8, 3, 10)}
                />
            </div>
        </div>
    )
}

/* ───────── Glow with tooltip ───────── */

function Glow({
    x,
    y,
    label,
    value,
    message,
    strength,
}: {
    x: string
    y: string
    label: string
    value: string
    message: string
    strength: number
}) {
    const opacity = 0.3 + strength * 0.7
    const scale = 1 + strength * 0.6
    const blur = 12 + strength * 18

    return (
        <div
            className="group absolute flex flex-col items-center"
            style={{ left: x, top: y, transform: 'translate(-50%, -50%)' }}
        >
            {/* Glow */}
            <div className="relative">
                <span
                    className="absolute inset-0 rounded-full bg-cyan-400 animate-glow"
                    style={{
                        opacity,
                        filter: `blur(${blur}px)`,
                        transform: `scale(${scale})`,
                    }}
                />
                <span className="block w-4 h-4 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.9)]" />
            </div>

            <span className="mt-2 text-[11px] tracking-wide text-cyan-200/80">
                {label}
            </span>

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full mb-3 w-44 opacity-0 scale-95 transition-all duration-200 group-hover:opacity-100 group-hover:scale-100">
                <div className="rounded-xl bg-[#0b1a2a] border border-white/10 px-3 py-2 text-xs text-white shadow-xl">
                    <div className="font-medium mb-1">
                        {label}: <span className="text-cyan-300">{value}</span>
                    </div>
                    <div className="text-white/70">
                        {message}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ───────── helpers ───────── */

function normalize(value: number, min: number, max: number) {
    const clamped = Math.min(Math.max(value, min), max)
    return (clamped - min) / (max - min)
}

function moodMessage(v: number) {
    if (v <= 2) return 'Low mood detected. Consider rest or light activity.'
    if (v <= 3) return 'Mood is moderate. Small improvements may help.'
    return 'Mood looks positive.'
}

function sleepMessage(v: number) {
    if (v < 6) return 'Sleep debt detected. Try to recover tonight.'
    if (v < 7) return 'Sleep is okay but could improve.'
    return 'Sleep duration is healthy.'
}

function workMessage(v: number) {
    if (v > 9) return 'High workload. Risk of burnout.'
    if (v > 7) return 'Busy schedule detected.'
    return 'Workload is balanced.'
}

function focusMessage(v: number) {
    if (v > 9) return 'Focus strain detected.'
    if (v > 7) return 'Sustained focus levels.'
    return 'Focus looks healthy.'
}
