import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { chatStream } from '@/lib/copilot'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { messages, sessionId, token, actualInvestorEmail } = await request.json()

    if (!messages) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Support two auth paths: token (potential investors) or actualInvestorEmail (actual investors)
    if (actualInvestorEmail) {
      // Actual investor — verify they exist
      const { data: actualInvestor } = await supabase
        .from('actual_investors')
        .select('id, name, email')
        .eq('email', actualInvestorEmail.toLowerCase().trim())
        .single()

      if (!actualInvestor) {
        return NextResponse.json({ error: 'Investor not found' }, { status: 401 })
      }

      // Actual investors get full Tier 2 access — they've already invested
      const stream = await chatStream({
        messages,
        actorType: 'investor',
        investorTier: 2,
        sessionId: sessionId || `actual-investor-${actualInvestor.id}-${Date.now()}`,
        investorId: actualInvestor.id,
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      })
    }

    // Potential investor path — token-based auth
    if (!token) {
      return NextResponse.json({ error: 'Token or actualInvestorEmail is required' }, { status: 400 })
    }

    // Verify investor token and get tier
    const { data: investor } = await supabase
      .from('investors')
      .select('id, access_tier, portal_token_expires_at')
      .eq('portal_token', token)
      .single()

    if (!investor) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (new Date(investor.portal_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 })
    }

    if (investor.access_tier < 1) {
      return NextResponse.json({ error: 'Copilot requires at least Tier 1 access' }, { status: 403 })
    }

    const stream = await chatStream({
      messages,
      actorType: 'investor',
      investorTier: investor.access_tier as 0 | 1 | 2,
      sessionId: sessionId || `investor-${investor.id}-${Date.now()}`,
      investorId: investor.id,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Investor copilot error:', error)
    return NextResponse.json({ error: 'Copilot error' }, { status: 500 })
  }
}
