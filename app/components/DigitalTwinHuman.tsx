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
        <div className="flex justify-center items-center">
            <div className="w-[280px] h-[480px]">
                <img
                    src="/human-silhouette.png"
                    alt="Digital Twin"
                    className="absolute inset-0 w-full h-full object-contain opacity-95"
                />
            </div>
        </div>
    )
}