import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const supabase = createServerClient()
    const emailLower = email.toLowerCase().trim()

    // Check actual_investors table first
    const { data: actualInvestor } = await supabase
      .from('actual_investors')
      .select('id, name, is_password_set')
      .eq('email', emailLower)
      .single()

    if (actualInvestor) {
      return NextResponse.json({
        type: 'actual_investor',
        name: actualInvestor.name,
        isPasswordSet: actualInvestor.is_password_set,
      })
    }

    // Check potential investors table
    const { data: potentialInvestor } = await supabase
      .from('investors')
      .select('id, first_name, last_name, access_tier, portal_token')
      .eq('email', emailLower)
      .single()

    if (potentialInvestor) {
      return NextResponse.json({
        type: 'potential_investor',
        name: `${potentialInvestor.first_name} ${potentialInvestor.last_name}`,
        tier: potentialInvestor.access_tier,
        token: potentialInvestor.portal_token,
      })
    }

    // New visitor — not in any table
    return NextResponse.json({ type: 'new_visitor' })
  } catch (error) {
    console.error('Gate check error:', error)
    return NextResponse.json({ error: 'Failed to check email' }, { status: 500 })
  }
}
