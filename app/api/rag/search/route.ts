import { NextResponse } from 'next/server'
import { retrieveContext } from '@/lib/rag'

export async function POST(request: Request) {
  try {
    const { query, topK } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const results = await retrieveContext(query, topK || 8)
    return NextResponse.json(results)
  } catch (error) {
    console.error('RAG search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
