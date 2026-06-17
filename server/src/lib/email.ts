import { Resend } from 'resend'

const APP_URL = process.env.APP_URL ?? 'http://localhost:5173'

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const link = `${APP_URL}/verify-email?token=${token}`

  if (!process.env.RESEND_API_KEY) {
    console.log(`\n📧 [RESEND NOT CONFIGURED] Verification link for ${to}:\n${link}\n`)
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'InfraTrack <onboarding@resend.dev>',
    to,
    subject: 'Verify your InfraTrack account',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#FAF6EF;border-radius:16px">
        <h1 style="font-size:24px;margin-bottom:8px;color:#1C1812">Welcome, ${name}!</h1>
        <p style="color:#6B6356;margin-bottom:24px">Click the button below to verify your email address and activate your InfraTrack account.</p>
        <a href="${link}" style="display:inline-block;background:#0F5C5B;color:#FAF6EF;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:600;font-size:15px">
          Verify my email
        </a>
        <p style="margin-top:24px;font-size:12px;color:#9A8E82">This link expires in 24 hours. If you didn't create an account, ignore this email.</p>
      </div>
    `,
  })
}
