import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const [
    { count: totalInvestors },
    { count: newThisWeek },
    { count: aiProfiled },
    { count: approved },
    { count: totalActualInvestors },
    { data: metrics },
    { data: activities },
    { count: outreachTotal },
    { count: outreachContacted },
    { count: outreachCommitted },
  ] = await Promise.all([
    supabase.from('investors').select('id', { count: 'exact', head: true }),
    supabase.from('investors').select('id', { count: 'exact', head: true })
      .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase.from('investor_profiles').select('id', { count: 'exact', head: true })
      .eq('research_status', 'complete'),
    supabase.from('investors').select('id', { count: 'exact', head: true })
      .gte('access_tier', 1),
    supabase.from('actual_investors').select('id', { count: 'exact', head: true }),
    supabase.from('company_metrics').select('*')
      .order('metric_date', { ascending: false }).limit(1).single(),
    supabase.from('activity_log').select('*')
      .order('created_at', { ascending: false }).limit(10),
    supabase.from('outreach_investors').select('id', { count: 'exact', head: true }),
    supabase.from('outreach_investors').select('id', { count: 'exact', head: true })
      .neq('pipeline_status', 'Identified'),
    supabase.from('outreach_investors').select('id', { count: 'exact', head: true })
      .eq('pipeline_status', 'Committed'),
  ])

  return NextResponse.json({
    totalInvestors: totalInvestors || 0,
    newThisWeek: newThisWeek || 0,
    aiProfiled: aiProfiled || 0,
    approved: approved || 0,
    totalActualInvestors: totalActualInvestors || 0,
    metrics,
    activities: activities || [],
    outreach: {
      total: outreachTotal || 0,
      contacted: outreachContacted || 0,
      committed: outreachCommitted || 0,
    },
  })
}
