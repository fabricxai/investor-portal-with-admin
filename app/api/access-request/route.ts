import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { researchAndQualifyInvestor } from '@/lib/claude-agent'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { first_name, last_name, email, firm_name, investor_type, check_size, message } = body

    if (!first_name || !last_name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Check if email already exists
    const { data: existing } = await supabase
      .from('investors')
      .select('id, access_tier, portal_token')
      .eq('email', email)
      .single()

    if (existing) {
      // If they already have access, return their token
      if (existing.access_tier > 0) {
        return NextResponse.json({
          success: true,
          message: 'You already have access. Check your email for the portal link.',
          hasAccess: true,
        })
      }
      // If pending, let them know
      return NextResponse.json({
        success: true,
        message: 'Your request is being reviewed. We\'ll be in touch shortly.',
        pending: true,
      })
    }

    // Create new investor record
    const { data: investor, error: insertError } = await supabase
      .from('investors')
      .insert({
        first_name,
        last_name,
        email,
        firm_name: firm_name || null,
        investor_type: investor_type || null,
        check_size: check_size || null,
        message: message || null,
        status: 'new',
        access_tier: 0,
      })
      .select()
      .single()

    if (insertError || !investor) {
      console.error('Insert error:', insertError)
      return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
    }

    // Log activity
    await supabase.from('activity_log').insert({
      event_type: 'access_requested',
      investor_id: investor.id,
      description: `${first_name} ${last_name}${firm_name ? ` from ${firm_name}` : ''} requested access`,
      metadata: { email, firm_name, investor_type },
    })

    // Link to outreach investor if email matches
    const { data: outreachMatch } = await supabase
      .from('outreach_investors')
      .select('id, pipeline_status')
      .eq('email', email)
      .is('linked_investor_id', null)
      .single()

    if (outreachMatch) {
      await supabase
        .from('outreach_investors')
        .update({
          linked_investor_id: investor.id,
          pipeline_status: outreachMatch.pipeline_status === 'Identified' || outreachMatch.pipeline_status === 'Contacted'
            ? 'Replied'
            : outreachMatch.pipeline_status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', outreachMatch.id)

      await supabase.from('activity_log').insert({
        event_type: 'outreach_linked',
        investor_id: investor.id,
        description: `Inbound request from ${first_name} ${last_name} linked to outreach pipeline`,
        metadata: { outreach_investor_id: outreachMatch.id },
      })
    }

    // Trigger AI research in background (don't await)
    researchAndQualifyInvestor(investor.id).catch(err =>
      console.error('Background research error:', err)
    )

    return NextResponse.json({
      success: true,
      message: 'Thank you! We\'re reviewing your profile and will be in touch shortly.',
    })
  } catch (error) {
    console.error('Access request error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
