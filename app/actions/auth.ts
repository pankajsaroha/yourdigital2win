'use server'

import { db } from '@/lib/db'
import { createSession, deleteSession, generateOTP } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOTP(email: string) {
    try {
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return { error: 'Invalid email address' }
        }

        let user = await db.user.findUnique({ where: { email } })
        if (!user) {
            user = await db.user.create({ data: { email } })
        }

        // Expire old OTPs
        await db.oTP.updateMany({
            where: {
                userId: user.id,
                verified: false,
            },
            data: {
                expiresAt: new Date(),
            },
        })

        const code = generateOTP()
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

        await db.oTP.create({
            data: {
                userId: user.id,
                code,
                expiresAt,
            },
        })

        // ✅ FORCE DEV LOG
        console.log('================ OTP =================')
        console.log(`EMAIL: ${email}`)
        console.log(`OTP  : ${code}`)
        console.log('=====================================')

        await resend.emails.send({
            from: 'YourDigital2Win <onboarding@resend.dev>',
            to: email,
            replyTo: 'pankajsaroya6@gmail.com',
            subject: 'Your OTP Code',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>YourDigital2Win Login</h2>
            <p>Your verification code is:</p>
            <h1 style="letter-spacing: 6px;">${code}</h1>
            <p>This code expires in 10 minutes.</p>
        </div>
    `
        })

        return { success: true }
    } catch (error) {
        console.error('Send OTP error:', error)
        return { error: 'Failed to send OTP' }
    }
}

export async function verifyOTP(email: string, code: string) {
    try {
        const user = await db.user.findUnique({ where: { email } })
        if (!user) return { error: 'User not found' }

        const otp = await db.oTP.findFirst({
            where: {
                userId: user.id,
                code,
                verified: false,
                expiresAt: { gte: new Date() },
            },
        })

        if (!otp) {
            return { error: 'Invalid or expired OTP' }
        }

        await db.oTP.update({
            where: { id: otp.id },
            data: { verified: true },
        })

        await createSession(user.id)
        revalidatePath('/')

        return { success: true }
    } catch (error) {
        console.error('Verify OTP error:', error)
        return { error: 'Failed to verify OTP' }
    }
}

export async function logout() {
    await deleteSession()
    revalidatePath('/')
    return { success: true }
}
