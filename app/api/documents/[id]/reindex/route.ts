import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractText, ingestDocument } from '@/lib/rag'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = createServerClient()

  const { data: doc, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !doc) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  if (!doc.file_path) {
    return NextResponse.json({ error: 'No file path' }, { status: 400 })
  }

  // Download file from storage
  const { data: fileData, error: downloadError } = await supabase.storage
    .from('documents')
    .download(doc.file_path)

  if (downloadError || !fileData) {
    return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
  }

  const buffer = Buffer.from(await fileData.arrayBuffer())

  // Update status
  await supabase
    .from('documents')
    .update({ is_in_rag: false, rag_chunk_count: 0 })
    .eq('id', id)

  // Re-extract and re-index
  try {
    const rawText = await extractText(buffer, doc.doc_type || 'text/plain')
    const chunkCount = await ingestDocument(id, rawText, doc.name, doc.doc_type || 'text/plain')
    return NextResponse.json({ success: true, chunks: chunkCount })
  } catch (err) {
    console.error('Reindex error:', err)
    return NextResponse.json({ error: 'Reindex failed' }, { status: 500 })
  }
}
