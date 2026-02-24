import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractText, ingestDocument } from '@/lib/rag'

export async function POST(request: Request) {
  try {
    const { documentId } = await request.json()

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { data: doc, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single()

    if (error || !doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (!doc.file_path) {
      return NextResponse.json({ error: 'No file to index' }, { status: 400 })
    }

    // Download file
    const { data: fileData } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (!fileData) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 })
    }

    const buffer = Buffer.from(await fileData.arrayBuffer())
    const rawText = await extractText(buffer, doc.doc_type || 'text/plain')
    const chunkCount = await ingestDocument(doc.id, rawText, doc.name, doc.doc_type || 'text/plain')

    return NextResponse.json({ success: true, chunks: chunkCount })
  } catch (error) {
    console.error('Index error:', error)
    return NextResponse.json({ error: 'Indexing failed' }, { status: 500 })
  }
}
