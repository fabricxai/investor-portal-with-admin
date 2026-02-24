'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OutreachAvatar from '@/components/outreach/OutreachAvatar'
import OutreachFitBadge from '@/components/outreach/OutreachFitBadge'
import { OUTREACH_STAGES, STAGE_COLORS } from '@/lib/outreach-email'
import type { OutreachInvestor, OutreachPipelineStatus } from '@/lib/types'
import { Target, Brain, Send, Clock, ArrowRight, AlertCircle } from 'lucide-react'

interface OutreachStats {
  totalInvestors: number
  avgFitScore: number
  emailsSent: number
  pendingFollowups: number
  stageCounts: Record<OutreachPipelineStatus, number>
}

export default function OutreachDashboard() {
  const [stats, setStats] = useState<OutreachStats | null>(null)
  const [topInvestors, setTopInvestors] = useState<OutreachInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, investorsRes] = await Promise.all([
          fetch('/api/outreach/stats'),
          fetch('/api/outreach/investors?status=Identified'),
        ])

        if (!statsRes.ok) throw new Error('Failed to fetch stats')
        if (!investorsRes.ok) throw new Error('Failed to fetch investors')

        const statsData = await statsRes.json()
        const investorsData: OutreachInvestor[] = await investorsRes.json()

        setStats(statsData)
        const sorted = [...investorsData].sort((a, b) => b.fit_score - a.fit_score).slice(0, 5)
        setTopInvestors(sorted)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 mb-3" style={{ color: '#EF4444' }} />
          <p style={{ color: '#4A6578' }}>{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const totalStageCount = OUTREACH_STAGES.reduce(
    (sum, stage) => sum + (stats.stageCounts[stage] || 0), 0
  )

  const statCards = [
    { label: 'Total Investors', value: stats.totalInvestors, icon: Target, color: '#57ACAF' },
    { label: 'Avg Fit Score', value: stats.avgFitScore, icon: Brain, color: '#EAB308' },
    { label: 'Emails Sent', value: stats.emailsSent, icon: Send, color: '#8B5CF6' },
    { label: 'Pending Follow-ups', value: stats.pendingFollowups, icon: Clock, color: stats.pendingFollowups > 0 ? '#F97316' : '#2D4455' },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Page Header */}
      <div>
        <p className="admin-page-label">Investor Outreach</p>
        <h1 className="admin-page-title">Outreach Dashboard</h1>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card glow key={stat.label}>
            <div className="flex items-start justify-between">
              <div>
                <p className="admin-section-label" style={{ fontSize: 9 }}>{stat.label}</p>
                <p className="mt-2 text-3xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: stat.color }}>
                  {stat.value}
                </p>
              </div>
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${stat.color}10`, border: `1px solid ${stat.color}25` }}
              >
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pipeline Funnel Bar */}
      <Card glow>
        <div className="mb-4">
          <h2 className="admin-section-label" style={{ marginBottom: 4 }}>Pipeline Funnel</h2>
          <p className="text-xs" style={{ color: '#4A6578' }}>Investor distribution across pipeline stages</p>
        </div>

        {totalStageCount === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#2D4455' }}>No investors in the pipeline yet.</p>
        ) : (
          <div>
            <div className="flex h-10 rounded-lg overflow-hidden">
              {OUTREACH_STAGES.map((stage) => {
                const count = stats.stageCounts[stage] || 0
                if (count === 0) return null
                const pct = (count / totalStageCount) * 100
                return (
                  <div
                    key={stage}
                    className="flex items-center justify-center transition-all"
                    style={{
                      width: `${Math.max(pct, 8)}%`,
                      backgroundColor: STAGE_COLORS[stage],
                      minWidth: count > 0 ? '48px' : '0',
                    }}
                  >
                    <span className="text-xs font-bold text-white/90 truncate px-1">{count}</span>
                  </div>
                )
              })}
            </div>

            <div className="flex mt-3 gap-4 flex-wrap">
              {OUTREACH_STAGES.map((stage) => {
                const count = stats.stageCounts[stage] || 0
                return (
                  <div key={stage} className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS[stage] }} />
                    <span className="text-xs" style={{ color: '#4A6578' }}>
                      {stage}{' '}
                      <span className="font-medium" style={{ color: '#C8D8E4' }}>{count}</span>
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Follow-up Alerts */}
      {stats.pendingFollowups > 0 && (
        <Card glow>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: '#F9731610', border: '1px solid #F9731625' }}>
                <Clock className="h-5 w-5" style={{ color: '#F97316' }} />
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#C8D8E4' }}>
                  {stats.pendingFollowups} follow-up{stats.pendingFollowups !== 1 ? 's' : ''} pending
                </p>
                <p className="text-xs" style={{ color: '#4A6578' }}>Investors waiting for your next touchpoint</p>
              </div>
            </div>
            <Link
              href="/admin/outreach/followups"
              className="flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: '#F97316' }}
            >
              View follow-ups
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </Card>
      )}

      {/* Top Uncontacted Fits */}
      <Card glow>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="admin-section-label" style={{ marginBottom: 4 }}>Top Uncontacted Fits</h2>
            <p className="text-xs" style={{ color: '#4A6578' }}>Highest-scoring investors still in Identified stage</p>
          </div>
          <Link href="/admin/outreach/discover" className="text-xs font-medium transition-colors" style={{ color: '#57ACAF' }}>
            View all &rarr;
          </Link>
        </div>

        {topInvestors.length === 0 ? (
          <p className="text-sm py-4 text-center" style={{ color: '#2D4455' }}>No uncontacted investors found.</p>
        ) : (
          <div>
            {topInvestors.map((inv, i) => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-3"
                style={{ borderBottom: i < topInvestors.length - 1 ? '1px solid #0F1E2A' : 'none' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <OutreachAvatar initials={inv.avatar_initials} color={inv.avatar_color} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: '#C8D8E4' }}>{inv.name}</p>
                    <p className="text-xs truncate" style={{ color: '#4A6578' }}>{inv.firm_name || 'Independent'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <OutreachFitBadge score={inv.fit_score} />
                  <Link
                    href={`/admin/outreach/compose?investor_id=${inv.id}`}
                    className="flex items-center gap-1 text-xs font-medium transition-colors whitespace-nowrap"
                    style={{ color: '#57ACAF' }}
                  >
                    Generate outreach
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
