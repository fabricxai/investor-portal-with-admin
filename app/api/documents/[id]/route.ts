import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()
  const supabase = createServerClient()

  const { error } = await supabase
    .from('documents')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  // Get file path for storage cleanup
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', id)
    .single()

  // Delete chunks first
  await supabase.from('document_chunks').delete().eq('document_id', id)

  // Delete document record
  await supabase.from('documents').delete().eq('id', id)

  // Delete from storage
  if (doc?.file_path) {
    await supabase.storage.from('documents').remove([doc.file_path])
  }

  return NextResponse.json({ success: true })
}
