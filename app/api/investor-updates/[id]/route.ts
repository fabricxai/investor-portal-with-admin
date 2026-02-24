import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET — single update
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('investor_updates')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Update not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Fetch investor update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update an investor update
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createServerClient()

    const allowed = ['title', 'content', 'category', 'published']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('investor_updates')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Update investor update error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Update investor update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — delete an investor update
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { error } = await supabase
      .from('investor_updates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete investor update error:', error)
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete investor update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
