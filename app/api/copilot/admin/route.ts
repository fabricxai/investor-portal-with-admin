import { chatStream } from '@/lib/copilot'

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { messages, sessionId } = await request.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const stream = await chatStream({
      messages,
      actorType: 'admin',
      sessionId: sessionId || `admin-${Date.now()}`,
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Admin copilot error:', error)
    return new Response(JSON.stringify({ error: 'Copilot error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
