import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendOTPEmail(email: string, otp: string) {
  await resend.emails.send({
    from: 'YourDigital2Win <auth@yourdomain.com>',
    to: email,
    subject: 'Your Login OTP',
    html: `
      <div style="font-family: sans-serif; padding: 20px;">
        <h2>Your Login Code</h2>
        <p>Your OTP is:</p>
        <h1 style="letter-spacing: 4px;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
      </div>
    `
  })
}
