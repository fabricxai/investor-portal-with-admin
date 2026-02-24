import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { NEXT_STAGE } from '@/lib/outreach-email'
import type { OutreachPipelineStatus } from '@/lib/types'

function getResend() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()

  const {
    outreach_investor_id,
    subject,
    body_text,
    body_html,
    from_name = 'Arifur Rahman',
    email_type = 'cold',
    tone,
    ai_generated = false,
  } = body

  if (!outreach_investor_id || !subject || !body_text) {
    return NextResponse.json({ error: 'outreach_investor_id, subject, and body_text required' }, { status: 400 })
  }

  // Fetch investor
  const { data: investor, error: invError } = await supabase
    .from('outreach_investors')
    .select('*')
    .eq('id', outreach_investor_id)
    .single()

  if (invError || !investor || !investor.email) {
    return NextResponse.json({ error: 'Investor not found or has no email' }, { status: 404 })
  }

  // Send via Resend
  const resend = getResend()
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'investors@fabricxai.com'

  let resendMessageId = null
  let status: 'sent' | 'failed' = 'sent'

  try {
    const result = await resend.emails.send({
      from: `${from_name} <${fromEmail}>`,
      to: investor.email,
      subject,
      text: body_text,
      html: body_html || undefined,
    })
    resendMessageId = result.data?.id || null
  } catch {
    status = 'failed'
  }

  // Save email record
  const { data: emailRecord } = await supabase
    .from('outreach_emails')
    .insert({
      outreach_investor_id,
      email_type,
      from_email: fromEmail,
      from_name,
      to_email: investor.email,
      to_name: investor.name,
      subject,
      body_text,
      body_html,
      tone,
      ai_generated,
      sent_at: status === 'sent' ? new Date().toISOString() : null,
      resend_message_id: resendMessageId,
      status,
    })
    .select()
    .single()

  // If sent successfully and it's a cold email, advance to Contacted + create followup
  if (status === 'sent') {
    const current = investor.pipeline_status as OutreachPipelineStatus
    if (current === 'Identified') {
      const next = NEXT_STAGE[current]
      if (next) {
        await supabase
          .from('outreach_investors')
          .update({ pipeline_status: next, updated_at: new Date().toISOString() })
          .eq('id', outreach_investor_id)
      }
    }

    // Auto-create followup (due in 5 days)
    if (email_type === 'cold' && emailRecord) {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 5)

      await supabase.from('outreach_followups').insert({
        outreach_investor_id,
        original_email_id: emailRecord.id,
        due_date: dueDate.toISOString(),
        urgency: 'medium',
        status: 'pending',
      })
    }
  }

  return NextResponse.json({ success: status === 'sent', email: emailRecord, status })
}
