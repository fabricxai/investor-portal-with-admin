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

// POST — convert a potential investor to an actual investor
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { investor_id, invested_amount, invested_date, instrument, notes } = body

    if (!investor_id) {
      return NextResponse.json({ error: 'investor_id is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Fetch the potential investor
    const { data: potentialInvestor, error: fetchError } = await supabase
      .from('investors')
      .select('*')
      .eq('id', investor_id)
      .single()

    if (fetchError || !potentialInvestor) {
      return NextResponse.json({ error: 'Potential investor not found' }, { status: 404 })
    }

    const name = `${potentialInvestor.first_name} ${potentialInvestor.last_name}`.trim()
    const emailLower = potentialInvestor.email.toLowerCase().trim()

    // Check if already exists as actual investor
    const { data: existing } = await supabase
      .from('actual_investors')
      .select('id')
      .eq('email', emailLower)
      .single()

    if (existing) {
      return NextResponse.json({ error: 'This investor already exists as an actual investor' }, { status: 409 })
    }

    // Generate temporary password
    const tempPassword = generateTempPassword()
    const tempHash = await bcrypt.hash(tempPassword, 10)
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

    // Create actual investor
    const { data: actualInvestor, error: insertError } = await supabase
      .from('actual_investors')
      .insert({
        name,
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
      console.error('Convert investor insert error:', insertError)
      return NextResponse.json({ error: 'Failed to create actual investor' }, { status: 500 })
    }

    // Send welcome email with temporary password
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com'
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    try {
      await getResend().emails.send({
        from: fromEmail,
        to: emailLower,
        subject: 'Welcome to the fabricXai Investor Dashboard',
        text: `Hi ${name},

Congratulations! You are now a fabricXai investor. Your dedicated investor dashboard has been set up.

To access your investor dashboard, visit:
${appUrl}/portal

Use the following temporary password to log in:

${tempPassword}

This temporary password expires in 24 hours. You'll be prompted to set a permanent password after your first login.

Your investor dashboard gives you access to:
- Real-time company progress and metrics
- Investor documents and SAFE agreement
- Cap table information
- Direct communication with the fabricXai team
- AI-powered company intelligence copilot

If you have any questions, feel free to reach out.

— fabricXai Team`,
      })
    } catch (emailErr) {
      console.error('Welcome email failed (investor still created):', emailErr)
    }

    // Log activity
    try {
      await supabase.from('activity_log').insert({
        event_type: 'potential_converted_to_actual',
        investor_id: potentialInvestor.id,
        description: `${name} converted from potential to actual investor`,
        metadata: {
          actual_investor_id: actualInvestor.id,
          invested_amount,
          instrument,
        },
      })
    } catch { /* silent */ }

    return NextResponse.json({
      success: true,
      actualInvestor,
      message: `${name} has been converted to an actual investor. Welcome email sent.`,
    }, { status: 201 })
  } catch (error) {
    console.error('Convert investor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
