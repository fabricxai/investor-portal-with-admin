'use client'

import BlurredMetricCard from './BlurredMetricCard'
import { formatCurrency } from '@/lib/utils'

interface MetricsDashboardProps {
  tier: 0 | 1 | 2
  metrics: any
}

export default function MetricsDashboard({ tier, metrics }: MetricsDashboardProps) {
  if (!metrics) return null

  const raisePercent = metrics.raise_percent ??
    (metrics.raise_target > 0 && metrics.raise_committed != null
      ? Math.round((metrics.raise_committed / metrics.raise_target) * 100)
      : null)

  return (
    <div className="space-y-6">
      {/* Main metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <BlurredMetricCard
          label="MRR"
          value={tier === 2 && metrics.mrr != null ? formatCurrency(metrics.mrr) : null}
          rangeValue={metrics.mrr_range}
          tier={tier}
        />
        <BlurredMetricCard
          label="ARR"
          value={tier === 2 && metrics.arr != null ? formatCurrency(metrics.arr) : null}
          tier={tier}
        />
        <BlurredMetricCard
          label="Factories Live"
          value={metrics.factories_live}
          tier={tier}
          alwaysShow
        />
        <BlurredMetricCard
          label="Agents Deployed"
          value={`${metrics.agents_deployed} / ${metrics.total_agents_built}`}
          tier={tier}
          alwaysShow
        />
      </div>

      {/* Secondary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <BlurredMetricCard
          label="Growth Rate"
          value={tier === 2 && metrics.mom_growth_rate != null ? `${metrics.mom_growth_rate}%` : null}
          tier={tier}
        />
        <BlurredMetricCard
          label="Runway"
          value={tier === 2 && metrics.runway_months != null ? `${metrics.runway_months} months` : null}
          rangeValue={metrics.runway_range}
          tier={tier}
        />
        <div className="col-span-2 md:col-span-1 rounded-xl border border-border bg-white p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wider mb-2" style={{ fontFamily: 'var(--font-mono)' }}>
            Raise Progress
          </p>
          {tier === 0 ? (
            <div className="space-y-2">
              <div className="h-7 bg-navy/10 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xl font-semibold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
                {tier === 2 && metrics.raise_committed != null
                  ? `${formatCurrency(metrics.raise_committed)} of ${formatCurrency(metrics.raise_target)}`
                  : raisePercent != null
                    ? `${raisePercent}% funded`
                    : 'In progress'
                }
              </p>
              {raisePercent != null && (
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-aqua rounded-full transition-all"
                    style={{ width: `${Math.min(100, raisePercent)}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
