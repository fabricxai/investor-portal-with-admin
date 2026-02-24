import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { NEXT_STAGE } from '@/lib/outreach-email'
import type { OutreachPipelineStatus } from '@/lib/types'

// POST — advance pipeline stage
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  // Get current status
  const { data: investor, error: fetchError } = await supabase
    .from('outreach_investors')
    .select('pipeline_status')
    .eq('id', id)
    .single()

  if (fetchError || !investor) {
    return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
  }

  const current = investor.pipeline_status as OutreachPipelineStatus
  const next = NEXT_STAGE[current]

  if (!next) {
    return NextResponse.json({ error: 'Already at final stage' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('outreach_investors')
    .update({ pipeline_status: next, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
