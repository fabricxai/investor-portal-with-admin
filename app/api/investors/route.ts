import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data: investors, error } = await supabase
    .from('investors')
    .select(`
      *,
      investor_profiles (
        fit_score,
        research_status,
        auto_tier_granted,
        firm_name,
        location
      )
    `)
    .order('submitted_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(investors)
}
