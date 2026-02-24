import { NextRequest, NextResponse } from 'next/server'
import { buildBrandedHTMLEmail } from '@/lib/outreach-email'

// POST — generate HTML email preview
export async function POST(request: NextRequest) {
  const { subject, body, senderName, ctaText, ctaUrl, callout, showStats } = await request.json()

  if (!subject || !body) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }

  const html = buildBrandedHTMLEmail(subject, body, senderName || 'Arifur Rahman', {
    ctaText,
    ctaUrl,
    callout: callout === '' ? null : callout,
    showStats,
  })

  return NextResponse.json({ html })
}
