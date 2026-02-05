'use client'

import { useState } from 'react'
import { sendOTP, verifyOTP } from '@/app/actions/auth'

export default function HomePage() {
    const [step, setStep] = useState<'email' | 'otp'>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleSendOTP = async () => {
        setLoading(true)
        setError(null)

        const res = await sendOTP(email)
        setLoading(false)

        if (res?.error) {
            setError(res.error)
        } else {
            setStep('otp')
        }
    }

    const handleVerifyOTP = async () => {
        setLoading(true)
        setError(null)

        const res = await verifyOTP(email, otp)
        setLoading(false)

        if (res?.error) {
            setError(res.error)
        } else {
            window.location.href = '/dashboard'
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#050b14] via-[#0b1a2a] to-[#050b14] flex items-center justify-center px-6">
            <div className="w-full max-w-md rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 p-8 text-white">
                {/* Brand */}
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-300 text-xl font-bold">
                        Y
                    </div>
                    <h1 className="text-2xl font-semibold">yourdigital2win</h1>
                    <p className="text-sm text-white/60 mt-1">
                        Build your personal digital twin
                    </p>
                </div>

                {/* Step: Email */}
                {step === 'email' && (
                    <>
                        <label className="text-sm text-white/70">
                            Email address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 focus:outline-none focus:border-cyan-400"
                        />

                        {error && (
                            <div className="mt-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleSendOTP}
                            disabled={loading || !email}
                            className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-400 text-black font-medium py-3 disabled:opacity-50"
                        >
                            {loading ? 'Sending OTP…' : 'Send OTP'}
                        </button>
                    </>
                )}

                {/* Step: OTP */}
                {step === 'otp' && (
                    <>
                        <label className="text-sm text-white/70">
                            Enter OTP
                        </label>
                        <input
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            placeholder="6-digit code"
                            className="mt-2 w-full rounded-xl bg-black/40 border border-white/10 px-4 py-3 focus:outline-none focus:border-cyan-400 tracking-widest text-center"
                        />

                        {error && (
                            <div className="mt-3 text-sm text-red-400">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleVerifyOTP}
                            disabled={loading || otp.length < 6}
                            className="mt-6 w-full rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-400 text-black font-medium py-3 disabled:opacity-50"
                        >
                            {loading ? 'Verifying…' : 'Verify & Continue'}
                        </button>

                        <button
                            onClick={() => setStep('email')}
                            className="mt-4 w-full text-sm text-white/50 hover:text-white"
                        >
                            Change email
                        </button>
                    </>
                )}
            </div>
        </div>
    )
}
