import { createServerClient } from '@/lib/supabase/server'

const VOYAGE_API_URL = 'https://api.voyageai.com/v1/embeddings'
const VOYAGE_MODEL = 'voyage-3'

// ─── EMBEDDING (Voyage AI voyage-3 · 1024 dimensions) ───────────────────────

async function callVoyageAPI(
  texts: string[],
  inputType: 'document' | 'query'
): Promise<number[][]> {
  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) throw new Error('VOYAGE_API_KEY is not set')

  const res = await fetch(VOYAGE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: VOYAGE_MODEL,
      input: texts,
      input_type: inputType,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage AI API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.data.map((item: { embedding: number[] }) => item.embedding)
}

export async function embedChunk(text: string): Promise<number[]> {
  const [embedding] = await callVoyageAPI([text], 'document')
  return embedding
}

export async function embedQuery(text: string): Promise<number[]> {
  const [embedding] = await callVoyageAPI([text], 'query')
  return embedding
}

export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = []
  // Voyage AI supports up to 128 texts per request; batch in groups of 64 to be safe
  for (let i = 0; i < texts.length; i += 64) {
    const batch = texts.slice(i, i + 64)
    const embeddings = await callVoyageAPI(batch, 'document')
    results.push(...embeddings)
    if (i + 64 < texts.length) await new Promise(r => setTimeout(r, 200))
  }
  return results
}

// ─── CHUNKING ─────────────────────────────────────────────────────────────────

interface Chunk {
  text: string
  docName: string
  pageEstimate: number
  charStart: number
  charEnd: number
}

export function splitIntoChunks(
  rawText: string,
  docName: string,
  options: { maxChars?: number; overlap?: number } = {}
): Chunk[] {
  const maxChars = options.maxChars || 2000
  const overlap = options.overlap || 200
  const chunks: Chunk[] = []

  // Clean text
  const text = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()

  if (text.length <= maxChars) {
    return [{
      text,
      docName,
      pageEstimate: 1,
      charStart: 0,
      charEnd: text.length,
    }]
  }

  // Split by paragraphs first
  const paragraphs = text.split('\n\n')
  let currentChunk = ''
  let charStart = 0
  let currentStart = 0

  for (const para of paragraphs) {
    if (currentChunk.length + para.length + 2 > maxChars && currentChunk.length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        docName,
        pageEstimate: Math.ceil((charStart + currentChunk.length) / 3000),
        charStart: currentStart,
        charEnd: currentStart + currentChunk.length,
      })

      // Overlap: keep last part of previous chunk
      const overlapText = currentChunk.slice(-overlap)
      currentStart = currentStart + currentChunk.length - overlap
      currentChunk = overlapText + '\n\n'
    }

    currentChunk += (currentChunk.length > 0 ? '\n\n' : '') + para
    charStart += para.length + 2
  }

  // Last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      text: currentChunk.trim(),
      docName,
      pageEstimate: Math.ceil(charStart / 3000),
      charStart: currentStart,
      charEnd: currentStart + currentChunk.length,
    })
  }

  return chunks
}

// ─── INGESTION ────────────────────────────────────────────────────────────────

export async function ingestDocument(
  documentId: string,
  rawText: string,
  docName: string,
  mimeType: string
) {
  const supabase = createServerClient()

  // Delete existing chunks for this document
  await supabase.from('document_chunks').delete().eq('document_id', documentId)

  // Chunk the text
  const chunks = splitIntoChunks(rawText, docName)

  if (chunks.length === 0) return 0

  // Embed all chunks
  const embeddings = await embedBatch(chunks.map(c => c.text))

  // Store chunks with embeddings
  const rows = chunks.map((chunk, i) => ({
    document_id: documentId,
    chunk_index: i,
    content: chunk.text,
    embedding: JSON.stringify(embeddings[i]),
    metadata: {
      doc_name: chunk.docName,
      doc_type: mimeType,
      page_estimate: chunk.pageEstimate,
      char_start: chunk.charStart,
      char_end: chunk.charEnd,
    },
  }))

  // Insert in batches of 20
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20)
    await supabase.from('document_chunks').insert(batch)
  }

  // Update document record
  await supabase
    .from('documents')
    .update({ is_in_rag: true, rag_chunk_count: chunks.length, updated_at: new Date().toISOString() })
    .eq('id', documentId)

  return chunks.length
}

// ─── RETRIEVAL ────────────────────────────────────────────────────────────────

export async function retrieveContext(query: string, topK = 8): Promise<{ content: string; source: string; docType: string; similarity: number }[]> {
  const supabase = createServerClient()
  const queryEmbedding = await embedQuery(query)

  const { data: chunks } = await supabase.rpc('match_document_chunks', {
    query_embedding: JSON.stringify(queryEmbedding),
    match_threshold: 0.65,
    match_count: topK,
  })

  return (chunks ?? []).map((c: any) => ({
    content: c.content as string,
    source: c.metadata?.doc_name as string,
    docType: c.metadata?.doc_type as string,
    similarity: c.similarity as number,
  }))
}

// ─── TEXT EXTRACTION ──────────────────────────────────────────────────────────

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (mimeType === 'application/pdf' || mimeType.includes('pdf')) {
    const pdfParseModule = await import('pdf-parse')
    const pdfParse = (pdfParseModule as any).default || pdfParseModule
    const result = await pdfParse(buffer)
    return result.text
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || mimeType.includes('docx')) {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || mimeType.includes('xlsx') || mimeType.includes('xls')) {
    const XLSX = await import('xlsx')
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    let text = ''
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName]
      text += `## ${sheetName}\n\n`
      text += XLSX.utils.sheet_to_csv(sheet) + '\n\n'
    }
    return text
  }

  if (mimeType === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || mimeType.includes('pptx')) {
    const pptxParser = await import('pptx-text-parser')
    const parse = pptxParser.default || pptxParser
    const slides = await (parse as any)(buffer)
    return (slides as string[]).map((s: string, i: number) => `## Slide ${i + 1}\n\n${s}`).join('\n\n')
  }

  // Plain text / markdown
  return buffer.toString('utf-8')
}
