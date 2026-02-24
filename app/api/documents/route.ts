import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createServerClient()

  const { data: documents, error } = await supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(documents)
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('documents')
    .insert({
      name: body.name,
      description: body.description || null,
      file_url: body.file_url,
      file_path: body.file_path || null,
      file_size: body.file_size || null,
      doc_type: body.doc_type || 'other',
      min_tier_to_view: body.min_tier_to_view ?? 1,
      min_tier_to_download: body.min_tier_to_download ?? 2,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
