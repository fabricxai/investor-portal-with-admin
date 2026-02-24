'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import TierBadge from '@/components/admin/TierBadge'
import FitScoreBadge from '@/components/admin/FitScoreBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { formatDistanceToNow } from 'date-fns'

export default function InvestorsPage() {
  const [investors, setInvestors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/investors')
      .then(res => res.json())
      .then(data => {
        setInvestors(Array.isArray(data) ? data : [])
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

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="admin-page-label">Pipeline Management</p>
          <h1 className="admin-page-title">Potential Investors</h1>
        </div>
        <span className="text-sm font-mono" style={{ color: '#4A6578' }}>{investors.length} total</span>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#152238', background: '#0C1929' }}>
        <table className="w-full admin-table">
          <thead>
            <tr style={{ borderBottom: '1px solid #152238', background: '#0A1525' }}>
              <th className="text-left px-4 py-3 admin-section-label">Name</th>
              <th className="text-left px-4 py-3 admin-section-label">Firm</th>
              <th className="text-left px-4 py-3 admin-section-label">Tier</th>
              <th className="text-left px-4 py-3 admin-section-label">Fit Score</th>
              <th className="text-left px-4 py-3 admin-section-label">Status</th>
              <th className="text-left px-4 py-3 admin-section-label">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {investors.map((inv: any) => {
              const profile = inv.investor_profiles?.[0] || inv.investor_profiles
              return (
                <tr
                  key={inv.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #0F1E2A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(87,172,175,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/investors/${inv.id}`}
                      className="text-sm font-medium transition-colors"
                      style={{ color: '#C8D8E4' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#57ACAF' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#C8D8E4' }}
                    >
                      {inv.first_name} {inv.last_name}
                    </Link>
                    <p className="text-xs" style={{ color: '#4A6578' }}>{inv.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm" style={{ color: '#8FAAB8' }}>
                    {inv.firm_name || profile?.firm_name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <TierBadge tier={inv.access_tier} />
                  </td>
                  <td className="px-4 py-3">
                    <FitScoreBadge score={profile?.fit_score ?? null} />
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs capitalize" style={{ color: '#4A6578' }}>
                      {profile?.research_status === 'processing' ? 'AI Researching...' : inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs font-mono" style={{ color: '#3A5060' }}>
                    {formatDistanceToNow(new Date(inv.submitted_at), { addSuffix: true })}
                  </td>
                </tr>
              )
            })}
            {investors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm" style={{ color: '#4A6578' }}>
                  No investors yet. They&apos;ll appear here when they request access.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
