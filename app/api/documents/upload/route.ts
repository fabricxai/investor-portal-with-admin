import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { extractText, ingestDocument } from '@/lib/rag'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const docType = formData.get('doc_type') as string || 'other'
    const description = formData.get('description') as string || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const supabase = createServerClient()

    // Upload to Supabase Storage
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    const filePath = `documents/${fileName}`
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 })
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath)

    // Save document metadata
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        name: file.name,
        description: description || null,
        file_url: urlData.publicUrl,
        file_path: filePath,
        file_size: file.size,
        doc_type: docType,
        min_tier_to_view: 1,
        min_tier_to_download: 2,
      })
      .select()
      .single()

    if (docError || !doc) {
      return NextResponse.json({ error: 'Failed to save document' }, { status: 500 })
    }

    // Extract text and index for RAG (async, don't block response)
    extractAndIndex(doc.id, buffer, file.type, file.name).catch(err =>
      console.error('RAG indexing error:', err)
    )

    return NextResponse.json({
      id: doc.id,
      name: doc.name,
      status: 'uploaded',
      message: 'File uploaded. RAG indexing in progress...',
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function extractAndIndex(docId: string, buffer: Buffer, mimeType: string, fileName: string) {
  try {
    const rawText = await extractText(buffer, mimeType)
    if (!rawText.trim()) {
      console.warn(`No text extracted from ${fileName}`)
      return
    }
    await ingestDocument(docId, rawText, fileName, mimeType)
  } catch (error) {
    console.error(`Failed to index document ${fileName}:`, error)
    const supabase = createServerClient()
    await supabase
      .from('documents')
      .update({ is_in_rag: false })
      .eq('id', docId)
  }
}
