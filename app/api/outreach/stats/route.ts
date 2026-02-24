import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { OUTREACH_STAGES } from '@/lib/outreach-email'

export async function GET() {
  const supabase = createServerClient()

  // Init default stage counts
  const stageCounts: Record<string, number> = {}
  for (const s of OUTREACH_STAGES) stageCounts[s] = 0

  const emptyResponse = {
    totalInvestors: 0,
    avgFitScore: 0,
    emailsSent: 0,
    pendingFollowups: 0,
    stageCounts,
  }

  // Get all outreach investors
  const { data: investors, error } = await supabase
    .from('outreach_investors')
    .select('id, fit_score, pipeline_status, created_at')

  // Table may not exist yet — return empty defaults
  if (error) return NextResponse.json(emptyResponse)

  const all = investors || []
  for (const inv of all) stageCounts[inv.pipeline_status] = (stageCounts[inv.pipeline_status] || 0) + 1

  // Pending followups count
  const { count: pendingFollowups } = await supabase
    .from('outreach_followups')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Emails sent count
  const { count: emailsSent } = await supabase
    .from('outreach_emails')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'sent')

  // Avg fit score
  const avgFit = all.length > 0
    ? Math.round(all.reduce((sum, i) => sum + (i.fit_score || 0), 0) / all.length)
    : 0

  return NextResponse.json({
    totalInvestors: all.length,
    avgFitScore: avgFit,
    emailsSent: emailsSent || 0,
    pendingFollowups: pendingFollowups || 0,
    stageCounts,
  })
}
