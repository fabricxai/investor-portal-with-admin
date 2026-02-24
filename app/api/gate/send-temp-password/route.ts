import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import bcrypt from 'bcryptjs'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY || 'placeholder')
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const emailLower = email.toLowerCase().trim()

    const { data: investor } = await supabase
      .from('actual_investors')
      .select('id, name, email')
      .eq('email', emailLower)
      .single()

    if (!investor) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
    }

    // Generate temp password
    const tempPassword = generateTempPassword()
    const tempHash = await bcrypt.hash(tempPassword, 10)
    const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes

    // Store temp password hash
    await supabase
      .from('actual_investors')
      .update({
        temp_password_hash: tempHash,
        temp_password_expires: expires,
        updated_at: new Date().toISOString(),
      })
      .eq('id', investor.id)

    // Send email with temp password
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com'

    await getResend().emails.send({
      from: fromEmail,
      to: investor.email,
      subject: 'Your fabricXai Investor Portal Temporary Password',
      text: `Hi ${investor.name},

Your temporary password for the fabricXai investor portal is:

${tempPassword}

This password expires in 30 minutes. You'll be prompted to set a permanent password after logging in.

If you didn't request this, please ignore this email.

— fabricXai Team`,
    })

    return NextResponse.json({ success: true, message: 'Temporary password sent to your email' })
  } catch (error) {
    console.error('Send temp password error:', error)
    return NextResponse.json({ error: 'Failed to send temporary password' }, { status: 500 })
  }
}
