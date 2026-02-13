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
        <div className="flex justify-center items-center h-full">
            {/* Stable container */}
            <div className="relative w-[320px] h-[640px]">
                <img
                    src="/human-silhouette.png"
                    alt="Digital Twin"
                    className="absolute inset-0 w-full h-full object-contain opacity-95"
                />

                {/*
                  🔒 Metric glow points are intentionally disabled.
                  Reason:
                  - Absolute positioning drift
                  - Non-critical to core product
                  - Will revisit post MVP

                  <Glow ... />
                */}
            </div>
        </div>
    )
}
