import { NextResponse } from 'next/server'
import { Resend } from 'resend'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

export async function POST(request: Request) {
  try {
    const { name, email, timestamp } = await request.json()

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com'
    const notifyTo = 'arifur@fabricxai.com'

    await getResend().emails.send({
      from: fromEmail,
      to: notifyTo,
      subject: `New Investor Access — ${name} (${email})`,
      text: `New investor portal access:

Name: ${name}
Email: ${email}
Accessed at: ${timestamp || new Date().toISOString()}

They have entered the fabricXai investor portal and are browsing the pitch deck, data room, and AI Q&A.`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notify email error:', error)
    // Still return success — don't block investor access
    return NextResponse.json({ success: true, warning: 'Notification email failed' })
  }
}
