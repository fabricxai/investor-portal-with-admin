import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST — track deck views and PDF requests
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event_type, slide_number, investor_email, investor_name, token } = body

    // event_type: 'deck_view' | 'deck_slide_change' | 'deck_pdf_request'
    if (!event_type) {
      return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Try to find the investor by token or email
    let investorId: string | null = null
    let investorInfo = ''

    if (token) {
      const { data } = await supabase
        .from('investors')
        .select('id, first_name, last_name, email')
        .eq('portal_token', token)
        .single()
      if (data) {
        investorId = data.id
        investorInfo = `${data.first_name} ${data.last_name} (${data.email})`
      }
    }

    if (!investorId && investor_email) {
      // Check potential investors
      const { data } = await supabase
        .from('investors')
        .select('id, first_name, last_name, email')
        .eq('email', investor_email.toLowerCase().trim())
        .single()
      if (data) {
        investorId = data.id
        investorInfo = `${data.first_name} ${data.last_name} (${data.email})`
      }
    }

    // Use investor_name/investor_email as fallback when DB lookup fails
    if (!investorInfo && (investor_name || investor_email)) {
      investorInfo = investor_name
        ? `${investor_name}${investor_email ? ` (${investor_email})` : ''}`
        : `${investor_email}`
    }

    // Build description based on event type
    let description = ''
    const who = investorInfo || 'Anonymous visitor'
    switch (event_type) {
      case 'deck_view':
        description = `${who} viewed the pitch deck preview`
        break
      case 'deck_slide_change':
        description = `${who} viewed pitch deck slide ${slide_number || '?'}`
        break
      case 'deck_pdf_request':
        description = `${who} requested the full pitch deck PDF`
        break
      default:
        description = `Deck event: ${event_type}`
    }

    // Log to activity_log
    await supabase.from('activity_log').insert({
      event_type,
      investor_id: investorId,
      description,
      metadata: {
        slide_number: slide_number || null,
        investor_email: investor_email || null,
        investor_name: investor_name || null,
        timestamp: new Date().toISOString(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Deck track error:', error)
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 })
  }
}

// GET — get deck analytics (admin)
export async function GET() {
  try {
    const supabase = createServerClient()

    const [
      { count: totalViews },
      { count: pdfRequests },
      { data: recentActivity },
    ] = await Promise.all([
      supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .in('event_type', ['deck_view', 'deck_slide_change']),
      supabase
        .from('activity_log')
        .select('id', { count: 'exact', head: true })
        .eq('event_type', 'deck_pdf_request'),
      supabase
        .from('activity_log')
        .select('*')
        .in('event_type', ['deck_view', 'deck_slide_change', 'deck_pdf_request'])
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return NextResponse.json({
      totalViews: totalViews || 0,
      pdfRequests: pdfRequests || 0,
      recentActivity: recentActivity || [],
    })
  } catch (error) {
    console.error('Deck analytics error:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
