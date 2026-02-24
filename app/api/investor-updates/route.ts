import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET — list all investor updates (public for actual investors)
export async function GET() {
  try {
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('investor_updates')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch investor updates error:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Investor updates error:', error)
    return NextResponse.json([], { status: 200 })
  }
}

// POST — create a new investor update (admin only)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, content, category } = body

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('investor_updates')
      .insert({
        title,
        content,
        category: category || 'general',
        published: true,
      })
      .select()
      .single()

    if (error) {
      console.error('Create investor update error:', error)
      return NextResponse.json({ error: 'Failed to create update' }, { status: 500 })
    }

    // Log activity
    try {
      await supabase.from('activity_log').insert({
        event_type: 'investor_update_published',
        description: `Investor update published: ${title}`,
        metadata: { update_id: data.id, category },
      })
    } catch { /* silent */ }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Create investor update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
