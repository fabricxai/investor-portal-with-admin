import Anthropic from '@anthropic-ai/sdk'
import { createServerClient } from '@/lib/supabase/server'
import { sendAdminNewInquiry, sendInvestorTier1Access, sendInvestorTier2Access } from '@/lib/email'

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
}

interface ResearchResult {
  firmName: string | null
  firmWebsite: string | null
  firmDescription: string | null
  aum: string | null
  focusAreas: string[]
  checkSizeMin: number | null
  checkSizeMax: number | null
  stageFocus: string[]
  portfolioCompanies: { name: string; url?: string; description?: string; relevance?: string }[]
  recentInvestments: { company: string; date?: string; round?: string; amount?: string }[]
  linkedinUrl: string | null
  crunchbaseUrl: string | null
  twitterUrl: string | null
  location: string | null
  aiSummary: string
  fitScore: number
  fitReasoning: string
}

export async function researchAndQualifyInvestor(investorId: string) {
  const supabase = createServerClient()

  // Get investor details
  const { data: investor } = await supabase
    .from('investors')
    .select('*')
    .eq('id', investorId)
    .single()

  if (!investor) throw new Error('Investor not found')

  // Create/update profile as processing
  const { data: existingProfile } = await supabase
    .from('investor_profiles')
    .select('id')
    .eq('investor_id', investorId)
    .single()

  if (existingProfile) {
    await supabase
      .from('investor_profiles')
      .update({ research_status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', existingProfile.id)
  } else {
    await supabase
      .from('investor_profiles')
      .insert({ investor_id: investorId, research_status: 'processing' })
  }

  try {
    // Research phase using Claude with web_search tool
    const researchPrompt = `Research this investor and provide structured data:

Name: ${investor.first_name} ${investor.last_name}
Email: ${investor.email}
Firm: ${investor.firm_name || 'Unknown'}
Self-reported type: ${investor.investor_type || 'Unknown'}
Self-reported check size: ${investor.check_size || 'Unknown'}
Message: ${investor.message || 'None'}

Search for:
1. "${investor.first_name} ${investor.last_name}" investor
2. "${investor.firm_name}" venture capital portfolio (if firm provided)
3. Their LinkedIn profile
4. Their Crunchbase profile or firm's Crunchbase

Extract and return as JSON:
{
  "firmName": "string or null",
  "firmWebsite": "string or null",
  "firmDescription": "2-3 sentences about the firm",
  "aum": "e.g. $50M-$100M or null",
  "focusAreas": ["AI", "SaaS", etc],
  "checkSizeMin": number_in_usd_or_null,
  "checkSizeMax": number_in_usd_or_null,
  "stageFocus": ["Pre-seed", "Seed", etc],
  "portfolioCompanies": [{"name": "...", "url": "...", "description": "...", "relevance": "relevance to fabricXai"}],
  "recentInvestments": [{"company": "...", "date": "...", "round": "...", "amount": "..."}],
  "linkedinUrl": "string or null",
  "crunchbaseUrl": "string or null",
  "twitterUrl": "string or null",
  "location": "City, Country",
  "aiSummary": "2-3 paragraph narrative about this investor and their fit with fabricXai",
  "fitScore": number_1_to_10,
  "fitReasoning": "detailed breakdown"
}

SCORING (calculate fit_score 1-10):
+2 if they invest in pre-seed or seed stage
+2 if they focus on AI, SaaS, manufacturing, supply chain, or deep tech
+2 if they invest in emerging markets, Bangladesh, South Asia, or frontier markets
+2 if their typical check size range includes $500K-$750K
+1 if they made an investment in the last 12 months
+1 bonus if any portfolio company is in garments, textiles, or factory tech

fabricXai context: AI platform for garment manufacturing, based in Bangladesh, seed stage, raising $500K-$750K, POC in 2 Dhaka factories.

Return ONLY valid JSON, no markdown.`

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      tools: [{
        type: 'web_search' as any,
        name: 'web_search',
      } as any],
      messages: [{
        role: 'user',
        content: researchPrompt,
      }],
    })

    // Extract the text content from the response
    let resultText = ''
    for (const block of response.content) {
      if (block.type === 'text') {
        resultText += block.text
      }
    }

    // Parse the JSON result
    const jsonMatch = resultText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('Could not parse research result')

    const result: ResearchResult = JSON.parse(jsonMatch[0])

    // Determine tier
    let autoTier = 0
    if (result.fitScore >= 7) autoTier = 2
    else if (result.fitScore >= 5) autoTier = 1

    // Update investor profile
    await supabase
      .from('investor_profiles')
      .update({
        firm_name: result.firmName,
        firm_website: result.firmWebsite,
        firm_description: result.firmDescription,
        aum: result.aum,
        focus_areas: result.focusAreas,
        check_size_min: result.checkSizeMin,
        check_size_max: result.checkSizeMax,
        stage_focus: result.stageFocus,
        portfolio_companies: result.portfolioCompanies,
        recent_investments: result.recentInvestments,
        linkedin_url: result.linkedinUrl,
        crunchbase_url: result.crunchbaseUrl,
        twitter_url: result.twitterUrl,
        location: result.location,
        ai_summary: result.aiSummary,
        fit_score: result.fitScore,
        fit_reasoning: result.fitReasoning,
        auto_tier_granted: autoTier,
        research_status: 'complete',
        last_researched_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('investor_id', investorId)

    // Update investor access tier and status
    const updateData: any = {
      access_tier: Math.max(investor.access_tier, autoTier),
    }
    if (autoTier >= 1) {
      updateData.status = 'approved'
    } else {
      updateData.status = 'reviewed'
    }
    await supabase.from('investors').update(updateData).eq('id', investorId)

    // Send emails
    try {
      await sendAdminNewInquiry({
        name: `${investor.first_name} ${investor.last_name}`,
        firm: investor.firm_name,
        investorId: investor.id,
        score: result.fitScore,
        tier: autoTier,
        fitReasoning: result.fitReasoning,
      })

      if (autoTier === 1) {
        await sendInvestorTier1Access({
          firstName: investor.first_name,
          email: investor.email,
          portalToken: investor.portal_token,
        })
      } else if (autoTier === 2) {
        await sendInvestorTier2Access({
          firstName: investor.first_name,
          email: investor.email,
          portalToken: investor.portal_token,
        })
      }
    } catch (emailError) {
      console.error('Email send error:', emailError)
    }

    // Log activity
    await supabase.from('activity_log').insert({
      event_type: 'investor_researched',
      investor_id: investorId,
      description: `AI researched ${investor.first_name} ${investor.last_name} — Score: ${result.fitScore}/10, Auto-tier: ${autoTier}`,
      metadata: { fit_score: result.fitScore, auto_tier: autoTier },
    })

    return { fitScore: result.fitScore, autoTier, profile: result }
  } catch (error) {
    console.error('Research error:', error)

    // Mark as failed
    await supabase
      .from('investor_profiles')
      .update({ research_status: 'failed', updated_at: new Date().toISOString() })
      .eq('investor_id', investorId)

    // Still send admin notification
    try {
      await sendAdminNewInquiry({
        name: `${investor.first_name} ${investor.last_name}`,
        firm: investor.firm_name,
        investorId: investor.id,
        score: null,
        tier: 0,
        fitReasoning: 'AI research failed — manual review needed',
      })
    } catch { /* ignore email errors */ }

    throw error
  }
}
