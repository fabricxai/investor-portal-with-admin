import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendInvestorTier1Access, sendInvestorTier2Access } from '@/lib/email'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { tier } = await request.json()

  if (tier !== 1 && tier !== 2) {
    return NextResponse.json({ error: 'Tier must be 1 or 2' }, { status: 400 })
  }

  const supabase = createServerClient()

  // Get investor
  const { data: investor, error } = await supabase
    .from('investors')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !investor) {
    return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
  }

  // Update tier
  await supabase
    .from('investors')
    .update({
      access_tier: tier,
      status: 'approved',
    })
    .eq('id', id)

  // Send email
  try {
    if (tier === 1) {
      await sendInvestorTier1Access({
        firstName: investor.first_name,
        email: investor.email,
        portalToken: investor.portal_token,
      })
    } else {
      await sendInvestorTier2Access({
        firstName: investor.first_name,
        email: investor.email,
        portalToken: investor.portal_token,
      })
    }
  } catch (emailError) {
    console.error('Email error:', emailError)
  }

  // Log activity
  await supabase.from('activity_log').insert({
    event_type: 'access_granted',
    investor_id: id,
    description: `Admin granted Tier ${tier} access to ${investor.first_name} ${investor.last_name}`,
    metadata: { tier, previous_tier: investor.access_tier },
  })

  return NextResponse.json({ success: true })
}
