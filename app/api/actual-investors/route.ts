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

// GET — list all actual investors
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('actual_investors')
      .select('id, name, email, invested_amount, invested_date, instrument, notes, is_password_set, last_login, created_at, updated_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch actual investors error:', error)
      return NextResponse.json({ error: 'Failed to fetch investors' }, { status: 500 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Actual investors GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST — add a new actual investor + send welcome email with temp password
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, invested_amount, invested_date, instrument, notes } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const emailLower = email.toLowerCase().trim()

    // Check if investor already exists
    const { data: existing } = await supabase
      .from('actual_investors')
      .select('id')
      .eq('email', emailLower)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'An investor with this email already exists' }, { status: 409 })
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()
    const tempHash = await bcrypt.hash(tempPassword, 10)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours for first-time

    // Insert new actual investor
    const { data: investor, error: insertError } = await supabase
      .from('actual_investors')
      .insert({
        name: name.trim(),
        email: emailLower,
        invested_amount: invested_amount ? Number(invested_amount) : null,
        invested_date: invested_date || null,
        instrument: instrument || null,
        notes: notes || null,
        temp_password_hash: tempHash,
        temp_password_expires: expires,
        is_password_set: false,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert actual investor error:', insertError)
      return NextResponse.json({ error: 'Failed to create investor' }, { status: 500 })
    }

    // Send welcome email with temporary password
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    try {
      await getResend().emails.send({
        from: fromEmail,
        to: emailLower,
        subject: 'Welcome to the fabricXai Investor Portal',
        text: `Hi ${name.trim()},

Welcome to the fabricXai investor portal! Your account has been created.

To access your investor dashboard, visit:
${appUrl}/portal

Use the following temporary password to log in:

${tempPassword}

This temporary password expires in 24 hours. You'll be prompted to set a permanent password after your first login.

If you have any questions, feel free to reach out.

— fabricXai Team`,
      })
    } catch (emailErr) {
      console.error('Welcome email failed (investor still created):', emailErr)
    }

    // Log activity
    try {
      await supabase.from('activity_log').insert({
        event_type: 'actual_investor_added',
        description: `New actual investor added: ${name.trim()} (${emailLower})`,
        metadata: { investor_id: investor.id, instrument, invested_amount },
      })
    } catch { /* silent */ }

    return NextResponse.json(investor, { status: 201 })
  } catch (error) {
    console.error('Actual investors POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
