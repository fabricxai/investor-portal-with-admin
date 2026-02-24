'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OutreachAvatar from '@/components/outreach/OutreachAvatar'
import OutreachFitBadge from '@/components/outreach/OutreachFitBadge'
import { formatCurrency } from '@/lib/utils'
import { OUTREACH_STAGES, STAGE_COLORS } from '@/lib/outreach-email'
import Link from 'next/link'

export default function AdminOverview() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [outreachInvestors, setOutreachInvestors] = useState<any[]>([])
  const [followups, setFollowups] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/stats').then(r => r.json()),
      fetch('/api/outreach/investors').then(r => r.json()).catch(() => []),
      fetch('/api/outreach/followups').then(r => r.json()).catch(() => []),
    ])
      .then(([stats, investors, fups]) => {
        setData(stats)
        setOutreachInvestors(Array.isArray(investors) ? investors : [])
        setFollowups(Array.isArray(fups) ? fups : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!data) return null

  const { metrics } = data
  const raisePercent = metrics && metrics.raise_target > 0
    ? Math.round((metrics.raise_committed / metrics.raise_target) * 100)
    : 0

  const stats = [
    { label: 'Potential Investors', value: data.totalInvestors ?? 0, color: '#57ACAF', icon: '👥' },
    { label: 'Actual Investors', value: data.totalActualInvestors ?? 0, color: '#EAB308', icon: '✓' },
    { label: 'AI Profiled', value: data.aiProfiled ?? 0, color: '#10B981', icon: '🤖' },
    { label: 'Outreach Pipeline', value: data.outreach?.total ?? 0, color: '#8B5CF6', icon: '📊' },
  ]

  // Pipeline stage counts
  const stageCounts: Record<string, number> = {}
  OUTREACH_STAGES.forEach(s => { stageCounts[s] = 0 })
  outreachInvestors.forEach(inv => {
    if (stageCounts[inv.pipeline_status] !== undefined) {
      stageCounts[inv.pipeline_status]++
    }
  })

  // Top fits not yet contacted
  const topFits = outreachInvestors
    .filter(i => i.pipeline_status === 'Identified' && (i.fit_score ?? 0) >= 80)
    .sort((a, b) => (b.fit_score ?? 0) - (a.fit_score ?? 0))
    .slice(0, 5)

  // Follow-up alerts
  const urgencyColor = (u: string) =>
    u === 'high' ? '#EF4444' : u === 'medium' ? '#EAB308' : '#4A6578'

  return (
    <div className="p-8">
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <div className="admin-page-label">Overview</div>
        <div className="admin-page-title">Investor Pipeline Dashboard</div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" style={{ marginBottom: 24 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="admin-stat-card rounded-xl border overflow-hidden"
            style={{ borderColor: '#152238', background: '#0C1929' }}
          >
            <div className="h-[2px]" style={{ background: stat.color }} />
            <div className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div style={{ fontSize: 30, fontWeight: 700, color: stat.color, lineHeight: 1, marginBottom: 6, fontFamily: 'var(--font-heading)' }}>
                    {stat.value}
                  </div>
                  <div className="admin-section-label" style={{ fontSize: 9 }}>
                    {stat.label}
                  </div>
                </div>
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}25` }}
                >
                  <span style={{ fontSize: 16 }}>{stat.icon}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Raise progress */}
      {metrics && (
        <Card glow className="mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="admin-section-label" style={{ marginBottom: 6 }}>
                Raise Progress
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-heading)' }}>
                {formatCurrency(metrics.raise_committed)} <span style={{ color: '#4A6578', fontWeight: 400, fontSize: 13 }}>of {formatCurrency(metrics.raise_target)}</span>
              </div>
            </div>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#57ACAF', fontFamily: 'var(--font-heading)' }}>
              {raisePercent}%
            </span>
          </div>
          <div style={{ height: 6, background: '#0A1525', borderRadius: 3, overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, #57ACAF, #3D8A8D)',
                borderRadius: 3,
                width: `${Math.min(100, raisePercent)}%`,
                transition: 'width 0.5s ease',
                boxShadow: '0 0 8px rgba(87,172,175,0.3)',
              }}
            />
          </div>
        </Card>
      )}

      {/* Pipeline stages */}
      <Card glow className="mb-5">
        <div className="admin-section-label" style={{ marginBottom: 16 }}>
          Pipeline Stages
        </div>
        <div className="flex gap-2">
          {OUTREACH_STAGES.map(stage => {
            const count = stageCounts[stage] || 0
            const color = STAGE_COLORS[stage] || '#3A5060'
            return (
              <div key={stage} className="flex-1 text-center">
                <div
                  className="flex items-center justify-center mb-2 transition-all duration-200"
                  style={{
                    height: 60,
                    background: color + '10',
                    border: `1px solid ${color}30`,
                    borderRadius: 10,
                  }}
                >
                  <span style={{ fontSize: 24, fontWeight: 700, color, fontFamily: 'var(--font-heading)' }}>{count}</span>
                </div>
                <div className="font-mono" style={{ fontSize: 8, color: '#4A6578', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>
                  {stage}
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Follow-up alerts */}
      <Card glow className="mb-5">
        <div className="flex justify-between items-center" style={{ marginBottom: 14 }}>
          <div className="admin-section-label">
            Follow-up Alerts
          </div>
          <Link href="/admin/outreach/followups" className="font-mono" style={{ fontSize: 11, color: '#57ACAF' }}>
            View all &rarr;
          </Link>
        </div>
        {followups.length > 0 ? (
          followups.slice(0, 4).map((f: any, i: number) => (
            <div
              key={f.id || i}
              className="flex items-center gap-3 transition-colors"
              style={{
                padding: '10px 0',
                borderBottom: i < Math.min(followups.length, 4) - 1 ? '1px solid #0F1E2A' : 'none',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: urgencyColor(f.urgency),
                  flexShrink: 0,
                  boxShadow: f.urgency === 'high' ? '0 0 6px rgba(239,68,68,0.3)' : 'none',
                }}
              />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#C8D8E4' }}>
                  {f.investor_name || 'Unknown'}{' '}
                  <span style={{ fontWeight: 400, color: '#4A6578', fontSize: 12 }}>
                    &middot; {f.firm_name || ''}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#2D4455' }}>
                  {f.ai_draft_subject || f.original_subject || 'No subject'}
                </div>
              </div>
              <div className="font-mono" style={{ fontSize: 11, color: f.urgency === 'high' ? '#EF4444' : '#4A6578', flexShrink: 0 }}>
                {f.due_label || (f.due_date ? new Date(f.due_date).toLocaleDateString() : '')}
              </div>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: '#2D4455', padding: '12px 0' }}>
            No pending follow-ups
          </div>
        )}
      </Card>

      {/* Top fits not yet contacted */}
      <Card glow>
        <div className="admin-section-label" style={{ marginBottom: 14 }}>
          Top Fits Not Yet Contacted
        </div>
        {topFits.length > 0 ? (
          topFits.map((inv: any, i: number) => (
            <div
              key={inv.id}
              className="flex items-center gap-3"
              style={{
                padding: '10px 0',
                borderBottom: i < topFits.length - 1 ? '1px solid #0F1E2A' : 'none',
              }}
            >
              <OutreachAvatar
                initials={inv.avatar_initials || '??'}
                color={inv.avatar_color || '#57ACAF'}
                size="sm"
              />
              <div className="flex-1 min-w-0">
                <div style={{ fontSize: 13, fontWeight: 600, color: '#C8D8E4' }}>
                  {inv.name}{' '}
                  <span style={{ color: '#4A6578', fontWeight: 400 }}>&middot; {inv.firm_name}</span>
                </div>
                <div style={{ fontSize: 11, color: '#2D4455' }}>{inv.focus_areas}</div>
              </div>
              <OutreachFitBadge score={inv.fit_score} />
            </div>
          ))
        ) : (
          <div style={{ fontSize: 12, color: '#2D4455', padding: '12px 0' }}>
            No uncontacted high-fit investors yet
          </div>
        )}
      </Card>

      {/* Recent activity */}
      {data.activities && data.activities.length > 0 && (
        <Card glow className="mt-5">
          <div className="admin-section-label" style={{ marginBottom: 14 }}>
            Recent Activity
          </div>
          <div className="space-y-3">
            {data.activities.map((activity: any) => (
              <div key={activity.id} className="flex items-start gap-3 text-sm">
                <div
                  className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: '#57ACAF', boxShadow: '0 0 4px rgba(87,172,175,0.3)' }}
                />
                <div className="flex-1 min-w-0">
                  <p style={{ color: '#C8D8E4' }}>{activity.description}</p>
                  <p className="text-xs mt-0.5 font-mono" style={{ color: '#2D4455' }}>
                    {new Date(activity.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
