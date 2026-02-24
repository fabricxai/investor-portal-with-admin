import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildFollowUpPrompt } from '@/lib/outreach-email'

function getAnthropic() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: Anthropic } = require('@anthropic-ai/sdk')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { followup_id } = await request.json()

  if (!followup_id) {
    return NextResponse.json({ error: 'followup_id is required' }, { status: 400 })
  }

  // Fetch followup with investor + original email
  const { data: followup, error: fError } = await supabase
    .from('outreach_followups')
    .select('*, outreach_investor:outreach_investors(*), original_email:outreach_emails(*)')
    .eq('id', followup_id)
    .single()

  if (fError || !followup) {
    return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 })
  }

  const investor = followup.outreach_investor
  const originalEmail = followup.original_email

  // Calculate how long ago
  const sentAt = originalEmail?.sent_at || originalEmail?.created_at || followup.created_at
  const daysAgo = Math.floor((Date.now() - new Date(sentAt).getTime()) / (1000 * 60 * 60 * 24))
  const sentAgo = daysAgo <= 1 ? 'yesterday' : `${daysAgo} days ago`

  const prompt = buildFollowUpPrompt(
    investor?.name || 'the investor',
    investor?.firm_name || 'their firm',
    originalEmail?.subject || 'our previous email',
    sentAgo
  )

  const anthropic = getAnthropic()
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text : ''

  let subject = ''
  let body = text
  const subjectMatch = text.match(/^Subject:\s*(.+)/m)
  if (subjectMatch) {
    subject = subjectMatch[1].trim()
    body = text.replace(/^Subject:\s*.+\n*/m, '').trim()
  }

  // Save AI draft to followup
  await supabase
    .from('outreach_followups')
    .update({ ai_draft: body, ai_draft_subject: subject, updated_at: new Date().toISOString() })
    .eq('id', followup_id)

  return NextResponse.json({ subject, body })
}
