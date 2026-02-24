import { notFound } from 'next/navigation'
import { createServerClient } from '@/lib/supabase/server'
import PortalClient from '@/components/portal/PortalClient'
import InvestorCopilotWrapper from '@/components/copilot/InvestorCopilotWrapper'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function TokenPortalPage({ params }: PageProps) {
  const { token } = await params
  const supabase = createServerClient()

  // Verify token and get investor
  const { data: investor } = await supabase
    .from('investors')
    .select('*')
    .eq('portal_token', token)
    .single()

  if (!investor) notFound()

  if (new Date(investor.portal_token_expires_at) < new Date()) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07111E',
        color: '#FFFFFF',
        fontFamily: "'Georgia', serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Link Expired</h1>
          <p style={{ color: '#4A6070', fontSize: 14, fontFamily: "'Trebuchet MS', sans-serif" }}>
            This portal link has expired. Please contact us for a new link.
          </p>
        </div>
      </div>
    )
  }

  const tier = investor.access_tier as 0 | 1 | 2

  if (tier === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#07111E',
        color: '#FFFFFF',
        fontFamily: "'Georgia', serif",
      }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Access Pending</h1>
          <p style={{ color: '#4A6070', fontSize: 14, fontFamily: "'Trebuchet MS', sans-serif" }}>
            Your access request is being reviewed. We&apos;ll be in touch shortly.
          </p>
        </div>
      </div>
    )
  }

  // Update visit tracking
  await supabase
    .from('investors')
    .update({
      last_portal_visit: new Date().toISOString(),
      visit_count: (investor.visit_count || 0) + 1,
    })
    .eq('id', investor.id)

  // Get metrics
  const { data: rawMetrics } = await supabase
    .from('company_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(1)
    .single()

  // Build stats based on tier
  const stats = rawMetrics
    ? [
        { value: String(rawMetrics.total_agents_built || 22), label: 'AI Agents', color: '#57ACAF' },
        { value: '$42B+', label: 'Market Size', color: '#EAB308' },
        { value: '98%', label: 'Factories Unserved', color: '#FFFFFF' },
        { value: '$3M', label: 'SAFE Cap', color: '#57ACAF' },
        { value: '$150–250K', label: 'Angel Ask', color: '#EAB308' },
        { value: 'POC Live', label: 'Dhaka · Q1 2026', color: '#10B981' },
      ]
    : undefined

  // Get documents based on tier
  const { data: dbDocs } = await supabase
    .from('documents')
    .select('id, name, description, doc_type, file_url, file_size, min_tier_to_view, min_tier_to_download, created_at')
    .lte('min_tier_to_view', tier)
    .order('created_at', { ascending: false })

  const documents = dbDocs && dbDocs.length > 0
    ? dbDocs.map(d => ({
        name: d.name,
        type: (d.doc_type || 'PDF').toUpperCase(),
        size: d.file_size ? `${(d.file_size / 1024).toFixed(0)} KB` : 'N/A',
        tag: mapDocTypeToTag(d.doc_type),
        file_url: tier >= (d.min_tier_to_download || 2) ? d.file_url : undefined,
        canDownload: tier >= (d.min_tier_to_download || 2),
      }))
    : undefined

  return (
    <>
      <PortalClient
        tier={tier}
        token={token}
        investorName={investor.first_name}
        stats={stats}
        documents={documents}
      />
      <InvestorCopilotWrapper token={token} tier={tier} />
    </>
  )
}

function mapDocTypeToTag(docType: string | null): string {
  switch (docType) {
    case 'pitch_deck': return 'DECK'
    case 'financials': return 'BRIEF'
    case 'cap_table': return 'BRIEF'
    case 'legal': return 'BRIEF'
    case 'update': return 'BRIEF'
    default: return 'TECH'
  }
}
