import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET — list followups (optional ?status=pending filter)
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const status = request.nextUrl.searchParams.get('status') || 'pending'

  const { data, error } = await supabase
    .from('outreach_followups')
    .select('*, outreach_investor:outreach_investors(*), original_email:outreach_emails(*)')
    .eq('status', status)
    .order('due_date', { ascending: true })

  // Table may not exist yet — return empty array
  if (error) return NextResponse.json([])
  return NextResponse.json(data)
}
