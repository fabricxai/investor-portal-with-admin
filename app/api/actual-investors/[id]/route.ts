import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET — single actual investor
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { data, error } = await supabase
      .from('actual_investors')
      .select('id, name, email, invested_amount, invested_date, instrument, notes, is_password_set, last_login, created_at, updated_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Investor not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Actual investor GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH — update actual investor details
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createServerClient()

    const allowedFields = ['name', 'email', 'invested_amount', 'invested_date', 'instrument', 'notes']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'email') {
          updates[field] = (body[field] as string).toLowerCase().trim()
        } else if (field === 'invested_amount') {
          updates[field] = body[field] ? Number(body[field]) : null
        } else {
          updates[field] = body[field] || null
        }
      }
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('actual_investors')
      .update(updates)
      .eq('id', id)
      .select('id, name, email, invested_amount, invested_date, instrument, notes, is_password_set, last_login, created_at, updated_at')
      .single()

    if (error) {
      console.error('Update actual investor error:', error)
      return NextResponse.json({ error: 'Failed to update investor' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Actual investor PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE — remove actual investor
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createServerClient()

    const { error } = await supabase
      .from('actual_investors')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Delete actual investor error:', error)
      return NextResponse.json({ error: 'Failed to delete investor' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Actual investor DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
