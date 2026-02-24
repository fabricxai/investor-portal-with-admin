import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import type { DiscoveryConfig, DiscoveryEvent, DiscoveredInvestor } from '@/lib/types'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

// ─── SEARCH QUERY BUILDERS ───────────────────────────────────────────────────

function buildSearchQueries(config: DiscoveryConfig): { strategy: string; queries: string[] }[] {
  const result: { strategy: string; queries: string[] }[] = []
  const keywords = config.focusKeywords.length > 0
    ? config.focusKeywords.join(', ')
    : 'AI, manufacturing, garments, supply chain'

  if (config.strategies.includes('thesis')) {
    result.push({
      strategy: 'Thesis-based',
      queries: [
        `seed investors ${keywords} startups`,
        `angel investors SaaS emerging markets manufacturing technology`,
        `venture capital fund investing in ${keywords}`,
      ],
    })
  }

  if (config.strategies.includes('portfolio')) {
    result.push({
      strategy: 'Portfolio-based',
      queries: [
        `investors who funded factory technology AI startups`,
        `VC portfolio garment manufacturing technology companies`,
        `seed investors industrial AI B2B SaaS companies portfolio`,
      ],
    })
  }

  if (config.strategies.includes('deals')) {
    result.push({
      strategy: 'Recent deals',
      queries: [
        `seed round AI manufacturing startup 2024 2025 funding`,
        `angel investment supply chain technology South Asia 2025`,
        `pre-seed seed funding manufacturing AI startup recent`,
      ],
    })
  }

  if (config.strategies.includes('geography')) {
    const geo = config.geographyFilter || 'Singapore, Dubai, South Asia, Bangladesh'
    result.push({
      strategy: 'Geography-focused',
      queries: [
        `${geo} venture capital seed fund emerging markets`,
        `${geo} angel investor manufacturing technology AI`,
        `startup investor ${geo} seed pre-seed`,
      ],
    })
  }

  if (config.strategies.includes('news')) {
    result.push({
      strategy: 'News & events',
      queries: [
        `investor manufacturing AI technology 2025 funding news`,
        `garment tech startup investment funding round 2025`,
        `emerging market AI startup investor conference 2025`,
      ],
    })
  }

  return result
}

// ─── PASS 1: DISCOVERY ──────────────────────────────────────────────────────

async function discoverInvestors(
  config: DiscoveryConfig,
  searchGroups: { strategy: string; queries: string[] }[]
): Promise<{ name: string; firm: string | null; website: string | null; reason: string }[]> {
  const allQueries = searchGroups.flatMap(g =>
    g.queries.map(q => `- [${g.strategy}] "${q}"`)
  ).join('\n')

  const prompt = `You are HUNTER, fabricXai's investor discovery agent. Your job is to search the web and find real investors (angels, VCs, family offices) who would be a strong fit for fabricXai.

ABOUT FABRICXAI:
- AI-native manufacturing intelligence platform — 22 specialist AI agents for garment factories
- Based in Bangladesh, targeting 4,500+ garment factories (98% unserved by technology)
- POC live in Dhaka factory, ৳240,000 saved in week 1 via VerifyX agent
- Raising angel round: $150K–$250K · SAFE · $3M cap · 20% discount
- Stage: Seed / Pre-seed
- Sectors: AI, SaaS, Manufacturing, Supply Chain, Deep Tech, Emerging Markets
- Founders: Arifur Rahman (CEO, BUET, gaming exit) + Kamrul Hasan (CTO, BUET EEE, AI research)

SEARCH STRATEGY:
Use web_search to run these searches and find REAL investors:
${allQueries}

IMPORTANT RULES:
- Only return REAL people/firms you find from web search results
- Each investor must have a real name and ideally a firm name
- Do NOT invent or hallucinate investor names
- Aim to find ${config.maxResults} unique investors
- Focus on investors who invest in: ${config.focusKeywords.join(', ') || 'AI, manufacturing, emerging markets'}
- Preferred geography: ${config.geographyFilter || 'Any'}
- Preferred stage: ${config.stageFilter || 'Pre-seed, Seed'}

After searching, return a JSON array of discovered investors:
[
  {
    "name": "Full Name",
    "firm": "Firm Name or null",
    "website": "firm website URL or null",
    "reason": "Brief reason why they might be a fit for fabricXai"
  }
]

Return ONLY the JSON array, no markdown formatting.`

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 8192,
    tools: [{
      type: 'web_search' as any,
      name: 'web_search',
    } as any],
    messages: [{ role: 'user', content: prompt }],
  })

  let resultText = ''
  for (const block of response.content) {
    if (block.type === 'text') {
      resultText += block.text
    }
  }

  const jsonMatch = resultText.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return []

  try {
    const parsed = JSON.parse(jsonMatch[0])
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

// ─── PASS 2+3: PROFILE + SCORE ──────────────────────────────────────────────

async function profileInvestor(
  lead: { name: string; firm: string | null; website: string | null; reason: string }
): Promise<DiscoveredInvestor | null> {
  const prompt = `You are HUNTER, fabricXai's investor research agent. Research this investor deeply using web search.

INVESTOR TO RESEARCH:
- Name: ${lead.name}
- Firm: ${lead.firm || 'Unknown'}
- Website: ${lead.website || 'Unknown'}
- Initial reason for fit: ${lead.reason}

SEARCH FOR:
1. "${lead.name}" investor
2. "${lead.firm || lead.name}" venture capital investments portfolio
3. Their LinkedIn profile
4. Their Crunchbase profile or firm's Crunchbase

EXTRACT AND RETURN AS JSON:
{
  "name": "${lead.name}",
  "email": "their email if publicly available, or null",
  "firm_name": "confirmed firm name or null",
  "firm_website": "firm website URL or null",
  "thesis": "their investment thesis in 1-2 sentences",
  "focus_areas": "comma-separated focus areas, e.g. AI, SaaS, Manufacturing",
  "check_size": "typical check size range, e.g. $100K-$500K",
  "stage_preference": "e.g. Pre-seed, Seed, Series A",
  "geography": "where they invest or are based",
  "portfolio_companies": ["company1", "company2"],
  "linkedin_url": "LinkedIn URL or null",
  "crunchbase_url": "Crunchbase URL or null",
  "fit_score": <number 0-100>,
  "fit_reasoning": "2-3 sentences explaining the score breakdown"
}

SCORING (calculate fit_score 0-100):
+20 if they invest in pre-seed or seed stage
+20 if they focus on AI, SaaS, manufacturing, supply chain, or deep tech
+20 if they invest in or focus on emerging markets, Bangladesh, South Asia, or frontier markets
+20 if their typical check size range overlaps with $150K–$750K
+10 if they made an investment in the last 12 months
+10 bonus if any portfolio company is in garments, textiles, factory tech, or industrial AI

FABRICXAI CONTEXT: AI platform for garment manufacturing, based in Bangladesh, seed stage, raising $150K–$250K on SAFE at $3M cap, POC live in 2 Dhaka factories.

Return ONLY valid JSON, no markdown.`

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{
        type: 'web_search' as any,
        name: 'web_search',
      } as any],
      messages: [{ role: 'user', content: prompt }],
    })

    let resultText = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        resultText += block.text
      }
    }

    const jsonMatch = resultText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    return {
      name: parsed.name || lead.name,
      email: parsed.email || null,
      firm_name: parsed.firm_name || lead.firm || null,
      firm_website: parsed.firm_website || lead.website || null,
      thesis: parsed.thesis || null,
      focus_areas: parsed.focus_areas || null,
      check_size: parsed.check_size || null,
      stage_preference: parsed.stage_preference || null,
      geography: parsed.geography || null,
      fit_score: typeof parsed.fit_score === 'number' ? parsed.fit_score : 50,
      fit_reasoning: parsed.fit_reasoning || '',
      portfolio_companies: Array.isArray(parsed.portfolio_companies) ? parsed.portfolio_companies : [],
      linkedin_url: parsed.linkedin_url || null,
      crunchbase_url: parsed.crunchbase_url || null,
    }
  } catch (error) {
    console.error(`Failed to profile ${lead.name}:`, error)
    return null
  }
}

// ─── PASS 4: DEDUPLICATION ──────────────────────────────────────────────────

async function checkDuplicates(
  investors: DiscoveredInvestor[]
): Promise<DiscoveredInvestor[]> {
  const supabase = createServerClient()

  const { data: existing } = await supabase
    .from('outreach_investors')
    .select('email, firm_name, name')

  if (!existing || existing.length === 0) return investors

  const existingEmails = new Set(existing.map(e => e.email?.toLowerCase()).filter(Boolean))
  const existingFirms = new Set(existing.map(e => e.firm_name?.toLowerCase()).filter(Boolean))
  const existingNames = new Set(existing.map(e => e.name?.toLowerCase()).filter(Boolean))

  return investors.map(inv => ({
    ...inv,
    already_in_pipeline:
      (inv.email != null && existingEmails.has(inv.email.toLowerCase())) ||
      (inv.firm_name != null && inv.name != null &&
        existingFirms.has(inv.firm_name.toLowerCase()) &&
        existingNames.has(inv.name.toLowerCase())),
  }))
}

// ─── MAIN DISCOVERY GENERATOR ───────────────────────────────────────────────

export async function* runDiscovery(
  config: DiscoveryConfig
): AsyncGenerator<DiscoveryEvent> {
  const searchGroups = buildSearchQueries(config)

  if (searchGroups.length === 0) {
    yield { type: 'error', message: 'No search strategies selected' }
    return
  }

  // Pass 1: Discovery
  yield {
    type: 'status',
    message: `Searching across ${searchGroups.length} strategies: ${searchGroups.map(g => g.strategy).join(', ')}...`,
  }

  let leads: { name: string; firm: string | null; website: string | null; reason: string }[]
  try {
    leads = await discoverInvestors(config, searchGroups)
  } catch (error) {
    yield {
      type: 'error',
      message: `Discovery search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
    return
  }

  if (leads.length === 0) {
    yield { type: 'status', message: 'No investors found. Try broadening your search criteria.' }
    yield { type: 'complete', message: 'Discovery complete', stats: { total: 0, added: 0, skipped: 0, duplicates: 0 } }
    return
  }

  // Deduplicate leads by name+firm
  const seen = new Set<string>()
  const uniqueLeads = leads.filter(l => {
    const key = `${l.name.toLowerCase()}|${(l.firm || '').toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, config.maxResults)

  yield {
    type: 'status',
    message: `Found ${uniqueLeads.length} unique investor leads. Starting deep profiling...`,
  }

  // Pass 2+3: Profile + Score each investor
  const profiled: DiscoveredInvestor[] = []
  let skippedLowScore = 0

  for (let i = 0; i < uniqueLeads.length; i++) {
    const lead = uniqueLeads[i]

    yield {
      type: 'status',
      message: `Profiling: ${lead.name}${lead.firm ? ` at ${lead.firm}` : ''}...`,
      progress: { current: i + 1, total: uniqueLeads.length },
    }

    const profile = await profileInvestor(lead)

    if (!profile) {
      yield {
        type: 'investor_skipped',
        message: `Could not profile ${lead.name} — skipping`,
        progress: { current: i + 1, total: uniqueLeads.length },
      }
      continue
    }

    if (profile.fit_score < config.minFitScore) {
      skippedLowScore++
      yield {
        type: 'investor_skipped',
        message: `${profile.name} scored ${profile.fit_score}/100 (below threshold ${config.minFitScore}) — skipping`,
        progress: { current: i + 1, total: uniqueLeads.length },
      }
      continue
    }

    profiled.push(profile)

    yield {
      type: 'investor_profiled',
      message: `${profile.name} — Score: ${profile.fit_score}/100`,
      data: profile,
      progress: { current: i + 1, total: uniqueLeads.length },
    }
  }

  // Pass 4: Check duplicates
  yield { type: 'status', message: 'Checking for duplicates in existing pipeline...' }
  const checked = await checkDuplicates(profiled)
  const duplicates = checked.filter(i => i.already_in_pipeline).length

  yield {
    type: 'complete',
    message: `Discovery complete: ${checked.length} investors profiled, ${duplicates} already in pipeline, ${skippedLowScore} below score threshold`,
    stats: {
      total: checked.length,
      added: checked.filter(i => !i.already_in_pipeline).length,
      skipped: skippedLowScore,
      duplicates,
    },
  }

  // Yield each discovered investor as a final event
  for (const inv of checked) {
    yield {
      type: 'investor_found',
      message: inv.already_in_pipeline
        ? `${inv.name} — already in pipeline`
        : `${inv.name} — Score: ${inv.fit_score}/100`,
      data: inv,
    }
  }
}
