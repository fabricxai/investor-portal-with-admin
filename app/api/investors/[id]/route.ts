import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: investor, error } = await supabase
    .from('investors')
    .select(`
      *,
      investor_profiles (*)
    `)
    .eq('id', id)
    .single()

  if (error || !investor) {
    return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
  }

  return NextResponse.json(investor)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = createServerClient()

  const { error } = await supabase
    .from('investors')
    .update(body)
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
