import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

function getResend() {
  const { Resend } = require('resend') as typeof import('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

// POST — potential investor expresses investment interest
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, check_size, message, timeline } = body

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const supabase = createServerClient()

    // Look up investor by token
    const { data: investor, error } = await supabase
      .from('investors')
      .select('*')
      .eq('portal_token', token)
      .single()

    if (error || !investor) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Update investor record with investment interest
    await supabase
      .from('investors')
      .update({
        status: 'interested',
        check_size: check_size || investor.check_size,
      })
      .eq('id', investor.id)

    // Log the interest event
    await supabase.from('activity_log').insert({
      event_type: 'investment_interest',
      investor_id: investor.id,
      description: `${investor.first_name} ${investor.last_name} expressed investment interest — ${check_size || 'amount not specified'}`,
      metadata: {
        check_size,
        message,
        timeline,
        investor_email: investor.email,
        firm_name: investor.firm_name,
      },
    })

    // Notify admin via email
    try {
      const resend = getResend()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com',
        to: process.env.ADMIN_EMAIL || 'admin@fabricxai.com',
        subject: `🔥 Investment Interest — ${investor.first_name} ${investor.last_name}${investor.firm_name ? `, ${investor.firm_name}` : ''}`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px;">
            <h2 style="color: #080E18;">Investment Interest Received</h2>
            <p><strong>${investor.first_name} ${investor.last_name}</strong>${investor.firm_name ? ` from <strong>${investor.firm_name}</strong>` : ''} has expressed interest in investing.</p>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${investor.email}</strong></td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Check Size</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${check_size || 'Not specified'}</strong></td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Timeline</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>${timeline || 'Not specified'}</strong></td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Current Tier</td><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Tier ${investor.access_tier}</strong></td></tr>
              ${message ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Message</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${message}</td></tr>` : ''}
            </table>

            <a href="${appUrl}/admin/investors/${investor.id}" style="display: inline-block; background: #57ACAF; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">View Investor Profile →</a>
          </div>
        `,
      })
    } catch (emailErr) {
      console.error('Admin notification email error:', emailErr)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Invest interest error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
