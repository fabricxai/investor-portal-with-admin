import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = createServerClient()
  const { searchParams } = new URL(request.url)
  const tier = parseInt(searchParams.get('tier') || '0')

  const { data: metrics, error } = await supabase
    .from('company_metrics')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(1)
    .single()

  if (error || !metrics) {
    return NextResponse.json({ error: 'No metrics found' }, { status: 404 })
  }

  // Tier 0: only return non-sensitive data
  if (tier === 0) {
    return NextResponse.json({
      factories_live: metrics.factories_live,
      factories_pipeline: metrics.factories_pipeline,
      agents_deployed: metrics.agents_deployed,
      total_agents_built: metrics.total_agents_built,
      round_stage: metrics.round_stage,
      // Everything else is null for Tier 0
      mrr: null,
      arr: null,
      mom_growth_rate: null,
      runway_months: null,
      burn_rate: null,
      cash_balance: null,
      raise_target: metrics.raise_target,
      raise_committed: null,
      raise_percent: null,
      updated_at: metrics.updated_at,
    })
  }

  // Tier 1: ranges and partial data
  if (tier === 1) {
    const raisePercent = metrics.raise_target > 0
      ? Math.round((metrics.raise_committed / metrics.raise_target) * 100)
      : 0

    return NextResponse.json({
      mrr: null,
      mrr_range: metrics.mrr > 0 ? `~$${Math.round(metrics.mrr / 1000) * 1000 - 2000}–$${Math.round(metrics.mrr / 1000) * 1000 + 2000}` : '~$0',
      arr: null,
      factories_live: metrics.factories_live,
      factories_pipeline: metrics.factories_pipeline,
      mom_growth_rate: null,
      runway_months: null,
      runway_range: metrics.runway_months ? `~${Math.max(1, metrics.runway_months - 3)}–${metrics.runway_months + 3} months` : null,
      burn_rate: null,
      cash_balance: null,
      agents_deployed: metrics.agents_deployed,
      total_agents_built: metrics.total_agents_built,
      raise_target: metrics.raise_target,
      raise_committed: null,
      raise_percent: raisePercent,
      round_stage: metrics.round_stage,
      updated_at: metrics.updated_at,
    })
  }

  // Tier 2: full access
  const raisePercent = metrics.raise_target > 0
    ? Math.round((metrics.raise_committed / metrics.raise_target) * 100)
    : 0

  return NextResponse.json({
    ...metrics,
    raise_percent: raisePercent,
  })
}

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createServerClient()

  const { error } = await supabase
    .from('company_metrics')
    .insert({
      ...body,
      metric_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity
  await supabase.from('activity_log').insert({
    event_type: 'metrics_updated',
    description: 'Company metrics updated',
    metadata: body,
  })

  return NextResponse.json({ success: true })
}
