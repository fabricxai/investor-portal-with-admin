import Anthropic from '@anthropic-ai/sdk'
import { retrieveContext } from '@/lib/rag'
import { createServerClient } from '@/lib/supabase/server'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ─── ADMIN SLASH COMMAND INSTRUCTIONS ─────────────────────────────────────────

const SLASH_COMMANDS: Record<string, string> = {
  '/draft-update': `The user wants you to draft a monthly investor update email. Structure it with:
- Opening (1 sentence on overall progress)
- Key Metrics (bullet list: MRR, factories, agents, runway)
- Highlights (2-3 wins this month)
- Challenges (1-2 honest challenges)
- Next Month (what to watch for)
- Closing (thank you + CTA for questions)
Use data from the knowledge base. Write in Kamrul Hasan's voice. Keep it under 400 words.`,

  '/one-pager': `The user wants you to generate a one-pager investor summary. Structure it with:
- Company name & tagline
- Problem (2 sentences)
- Solution (2 sentences + mention 22 AI agents)
- Traction (POC metrics, factories)
- Market ($42B+ garment industry, 4,500+ Bangladesh factories)
- Team (founders + advisor)
- Ask ($150K-$250K SAFE at $3M cap)
Use data from the knowledge base. Be concise — this should fit on one page.`,

  '/risk-summary': `The user wants you to extract and summarize ALL risks mentioned across the uploaded documents. Organize by category:
- Market Risks
- Technology Risks
- Execution Risks
- Financial Risks
- Regulatory Risks
For each risk, cite which document mentions it. Include mitigation strategies if documented.`,

  '/faq': `The user wants you to generate an Investor FAQ from the knowledge base. Create 10-15 Q&A pairs covering:
- What does fabricXai do?
- Market size and opportunity
- Business model and pricing
- Current traction and metrics
- Team background
- Competitive landscape
- Use of funds
- SAFE terms
- Timeline and milestones
Answer each based on document content. Cite sources.`,

  '/metrics-summary': `The user wants you to format the latest company metrics into a clean, shareable summary. Include:
- Revenue metrics (MRR, ARR)
- Product metrics (factories live, agents deployed)
- Growth metrics (MoM growth rate)
- Financial metrics (runway, burn rate, cash)
- Fundraise status (committed vs target, % progress)
Format as a clean table or structured summary. Use the most recent data from the knowledge base.`,
}

function getSlashCommandInstruction(query: string): string | undefined {
  const trimmed = query.trim().toLowerCase()
  for (const [cmd, instruction] of Object.entries(SLASH_COMMANDS)) {
    if (trimmed === cmd || trimmed.startsWith(cmd + ' ')) {
      return instruction
    }
  }
  return undefined
}

function buildSystemPrompt(actorType: 'admin' | 'investor', tier?: number): string {
  if (actorType === 'admin') {
    return `You are fabricXai's internal AI assistant with full access to the company's knowledge base. Help the fabricXai team prepare investor communications, analyze documents, and surface strategic insights.

Always cite which document and section your information comes from.
Be direct, analytical, and professional.

Company context:
- fabricXai: AI platform for garment manufacturing
- Stage: Seed, post-POC, raising $500K–$750K
- Founders: Kamrul Hasan (CEO, BUET EEE), Arifur Rahman (Co-founder, BUET)
- Advisor: M M Nazrul Islam (Sr. GM Operations, BEXIMCO/APEX/LANTABUR)
- POC live in 2 Dhaka factories
- 22 agents designed, 2 deployed
- Always write the brand as "fabricXai"

Special commands available:
/draft-update — Draft a monthly investor update email
/one-pager [investor name] — Create a custom one-pager
/risk-summary — Extract all risks from documents
/faq — Generate investor FAQ from documents
/metrics-summary — Format latest metrics into clean summary`
  }

  const tierInstructions = tier === 2
    ? 'Full access — share all available information accurately.'
    : `Use ranges for financial figures. Don't quote exact numbers.
For detailed financial data, suggest the investor request full access.`

  return `You are fabricXai's investor relations AI, powered by the company's knowledge base. Answer investor questions honestly and accurately.

RULES:
- Only answer based on the provided context from our documents
- If information isn't in the knowledge base, say so clearly
- Never speculate about future performance beyond what's documented
- Always write the brand as "fabricXai"
- Cite sources for every substantive claim

TIER: ${tier}
${tierInstructions}

Company: fabricXai — AI platform for garment manufacturing.
POC validated. Seed stage. Raising $500K–$750K.`
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── NON-STREAMING CHAT (kept for backwards compat) ──────────────────────────

export async function chat(params: {
  messages: ChatMessage[]
  actorType: 'admin' | 'investor'
  investorTier?: 0 | 1 | 2
  sessionId: string
  investorId?: string
}) {
  const query = params.messages.at(-1)!.content

  // Check for slash commands (admin only)
  const slashInstruction = params.actorType === 'admin'
    ? getSlashCommandInstruction(query)
    : undefined

  // Retrieve relevant chunks from RAG
  const context = await retrieveContext(query, slashInstruction ? 12 : 8)

  // Build system prompt
  const systemPrompt = buildSystemPrompt(params.actorType, params.investorTier)

  // Inject context
  const contextBlock = context.length > 0
    ? context.map(c => `[Source: ${c.source}]\n${c.content}`).join('\n\n---\n\n')
    : 'No relevant documents found in the knowledge base.'

  const sources = context.map(c => ({
    name: c.source,
    section: c.docType,
  }))

  const fullSystem = slashInstruction
    ? systemPrompt + '\n\nSPECIAL INSTRUCTION:\n' + slashInstruction + '\n\nRelevant context from knowledge base:\n\n' + contextBlock
    : systemPrompt + '\n\nRelevant context from knowledge base:\n\n' + contextBlock

  // Call Claude API
  const response = await getAnthropic().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: slashInstruction ? 2048 : 1024,
    system: fullSystem,
    messages: params.messages.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const assistantMessage = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('')

  // Save conversation (fire and forget)
  saveConversation(params.sessionId, params.actorType, params.investorId, [
    ...params.messages,
    { role: 'assistant' as const, content: assistantMessage },
  ]).catch(console.error)

  return {
    message: assistantMessage,
    sources: sources.filter((s, i, arr) =>
      arr.findIndex(x => x.name === s.name) === i
    ),
  }
}

// ─── STREAMING CHAT ──────────────────────────────────────────────────────────

export async function chatStream(params: {
  messages: ChatMessage[]
  actorType: 'admin' | 'investor'
  investorTier?: 0 | 1 | 2
  sessionId: string
  investorId?: string
}): Promise<ReadableStream> {
  const query = params.messages.at(-1)!.content

  // Check for slash commands (admin only)
  const slashInstruction = params.actorType === 'admin'
    ? getSlashCommandInstruction(query)
    : undefined

  // Retrieve relevant chunks from RAG
  const context = await retrieveContext(query, slashInstruction ? 12 : 8)

  const systemPrompt = buildSystemPrompt(params.actorType, params.investorTier)

  const contextBlock = context.length > 0
    ? context.map(c => `[Source: ${c.source}]\n${c.content}`).join('\n\n---\n\n')
    : 'No relevant documents found in the knowledge base.'

  const sources = context
    .map(c => ({ name: c.source, section: c.docType }))
    .filter((s, i, arr) => arr.findIndex(x => x.name === s.name) === i)

  const fullSystem = slashInstruction
    ? systemPrompt + '\n\nSPECIAL INSTRUCTION:\n' + slashInstruction + '\n\nRelevant context from knowledge base:\n\n' + contextBlock
    : systemPrompt + '\n\nRelevant context from knowledge base:\n\n' + contextBlock

  const encoder = new TextEncoder()

  return new ReadableStream({
    async start(controller) {
      try {
        // Send sources first
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`))

        // Stream Claude response
        const stream = getAnthropic().messages.stream({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: slashInstruction ? 2048 : 1024,
          system: fullSystem,
          messages: params.messages.map(m => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
        })

        let fullText = ''

        stream.on('text', (text) => {
          fullText += text
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`))
        })

        await stream.finalMessage()

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`))

        // Save conversation (fire and forget)
        saveConversation(params.sessionId, params.actorType, params.investorId, [
          ...params.messages,
          { role: 'assistant' as const, content: fullText },
        ]).catch(console.error)
      } catch (error) {
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'error', message: error instanceof Error ? error.message : 'Stream error' })}\n\n`
        ))
      } finally {
        controller.close()
      }
    },
  })
}

// ─── SAVE CONVERSATION ───────────────────────────────────────────────────────

async function saveConversation(
  sessionId: string,
  actorType: string,
  investorId: string | undefined,
  messages: ChatMessage[]
) {
  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('copilot_conversations')
    .select('id')
    .eq('session_id', sessionId)
    .single()

  const messagesWithTimestamp = messages.map(m => ({
    ...m,
    timestamp: new Date().toISOString(),
  }))

  if (existing) {
    await supabase
      .from('copilot_conversations')
      .update({
        messages: messagesWithTimestamp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('copilot_conversations')
      .insert({
        session_id: sessionId,
        actor_type: actorType,
        investor_id: investorId || null,
        messages: messagesWithTimestamp,
      })
  }
}
