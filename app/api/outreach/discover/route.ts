import { NextRequest } from 'next/server'
import { runDiscovery } from '@/lib/investor-discovery'
import type { DiscoveryConfig, DiscoveryStrategy } from '@/lib/types'

export const maxDuration = 300 // 5 minutes — discovery can take a while

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const config: DiscoveryConfig = {
      strategies: validateStrategies(body.strategies),
      focusKeywords: Array.isArray(body.focusKeywords) ? body.focusKeywords : [],
      geographyFilter: body.geographyFilter || '',
      stageFilter: body.stageFilter || 'Pre-seed, Seed',
      minFitScore: typeof body.minFitScore === 'number' ? body.minFitScore : 50,
      maxResults: typeof body.maxResults === 'number' ? Math.min(body.maxResults, 30) : 20,
    }

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of runDiscovery(config)) {
            const line = `data: ${JSON.stringify(event)}\n\n`
            controller.enqueue(encoder.encode(line))
          }
        } catch (error) {
          const errEvent = {
            type: 'error',
            message: error instanceof Error ? error.message : 'Discovery failed unexpectedly',
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(errEvent)}\n\n`))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Invalid request' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

function validateStrategies(input: unknown): DiscoveryStrategy[] {
  const valid: DiscoveryStrategy[] = ['thesis', 'portfolio', 'deals', 'geography', 'news']
  if (!Array.isArray(input) || input.length === 0) return valid
  return input.filter((s): s is DiscoveryStrategy => valid.includes(s as DiscoveryStrategy))
}
