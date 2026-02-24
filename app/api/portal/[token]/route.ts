import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { sendAdminPortalVisitNotification } from '@/lib/email'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const supabase = createServerClient()

  // Verify token
  const { data: investor, error } = await supabase
    .from('investors')
    .select('*')
    .eq('portal_token', token)
    .single()

  if (error || !investor) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 })
  }

  if (new Date(investor.portal_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'This link has expired' }, { status: 410 })
  }

  // Update visit tracking
  const newVisitCount = (investor.visit_count || 0) + 1
  await supabase
    .from('investors')
    .update({
      last_portal_visit: new Date().toISOString(),
      visit_count: newVisitCount,
    })
    .eq('id', investor.id)

  // Log activity
  await supabase.from('activity_log').insert({
    event_type: 'portal_visit',
    investor_id: investor.id,
    description: `${investor.first_name} ${investor.last_name} visited the portal (visit #${newVisitCount})`,
    metadata: { visit_count: newVisitCount, tier: investor.access_tier },
  })

  // Notify admin
  try {
    await sendAdminPortalVisitNotification({
      investorName: `${investor.first_name} ${investor.last_name}`,
      investorId: investor.id,
      visitCount: newVisitCount,
    })
  } catch { /* ignore email errors */ }

  // Get metrics based on tier
  const { data: metrics } = await supabase
    .from('company_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(1)
    .single()

  // Get documents based on tier
  const { data: documents } = await supabase
    .from('documents')
    .select('id, name, description, doc_type, file_url, file_size, min_tier_to_view, min_tier_to_download, created_at')
    .lte('min_tier_to_view', investor.access_tier)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    investor: {
      first_name: investor.first_name,
      last_name: investor.last_name,
      access_tier: investor.access_tier,
      firm_name: investor.firm_name,
    },
    metrics: metrics || null,
    documents: documents || [],
  })
}
