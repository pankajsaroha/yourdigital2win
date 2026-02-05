import { getSession } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const session = await getSession()

        if (!session) {
            return NextResponse.json({ user: null }, { status: 401 })
        }

        const user = await db.user.findUnique({
            where: { id: session.userId },
            select: { id: true, email: true, name: true, createdAt: true },
        })

        if (!user) {
            return NextResponse.json({ user: null }, { status: 401 })
        }

        return NextResponse.json({ user })
    } catch (error) {
        console.error('Session error:', error)
        return NextResponse.json({ user: null }, { status: 500 })
    }
}
