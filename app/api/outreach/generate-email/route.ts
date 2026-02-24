import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { buildOutreachPrompt } from '@/lib/outreach-email'

function getAnthropic() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { default: Anthropic } = require('@anthropic-ai/sdk')
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { investor_id, tone } = await request.json()

  if (!investor_id || !tone) {
    return NextResponse.json({ error: 'investor_id and tone are required' }, { status: 400 })
  }

  // Fetch investor
  const { data: investor, error } = await supabase
    .from('outreach_investors')
    .select('*')
    .eq('id', investor_id)
    .single()

  if (error || !investor) {
    return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
  }

  // Generate email with Claude
  const anthropic = getAnthropic()
  const prompt = buildOutreachPrompt(investor, tone)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = response.content[0]?.type === 'text' ? response.content[0].text : ''

  // Parse subject and body
  let subject = ''
  let body = text
  const subjectMatch = text.match(/^Subject:\s*(.+)/m)
  if (subjectMatch) {
    subject = subjectMatch[1].trim()
    body = text.replace(/^Subject:\s*.+\n*/m, '').trim()
  }

  return NextResponse.json({ subject, body, tone })
}
