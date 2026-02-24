import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET — list outreach investors (optional ?status=X filter)
export async function GET(request: NextRequest) {
  const supabase = createServerClient()
  const status = request.nextUrl.searchParams.get('status')

  let query = supabase
    .from('outreach_investors')
    .select('*')
    .order('fit_score', { ascending: false })

  if (status) {
    query = query.eq('pipeline_status', status)
  }

  const { data, error } = await query

  // Table may not exist yet — return empty array
  if (error) return NextResponse.json([])
  return NextResponse.json(data)
}

// POST — create outreach investor
export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const body = await request.json()

  // Generate avatar initials
  const nameParts = (body.name || '').split(' ')
  const initials = nameParts.length >= 2
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : (body.name || '??').slice(0, 2).toUpperCase()

  const colors = ['#57ACAF', '#EAB308', '#8B5CF6', '#10B981', '#F97316', '#EF4444']
  const color = colors[Math.floor(Math.random() * colors.length)]

  const { data, error } = await supabase
    .from('outreach_investors')
    .insert({
      ...body,
      avatar_initials: initials,
      avatar_color: color,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
