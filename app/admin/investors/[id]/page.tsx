'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import TierBadge from '@/components/admin/TierBadge'
import FitScoreBadge from '@/components/admin/FitScoreBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { ArrowLeft, ExternalLink, RefreshCw, ArrowRightLeft } from 'lucide-react'

const INSTRUMENTS = ['SAFE', 'Note', 'Equity', 'Convertible Note']

export default function InvestorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [investor, setInvestor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [granting, setGranting] = useState(false)
  const [showConvert, setShowConvert] = useState(false)
  const [converting, setConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState('')
  const [convertError, setConvertError] = useState('')
  const [convertForm, setConvertForm] = useState({
    invested_amount: '',
    invested_date: '',
    instrument: 'SAFE',
    notes: '',
  })

  const id = params.id as string

  useEffect(() => {
    fetch(`/api/investors/${id}`)
      .then(res => res.json())
      .then(data => {
        setInvestor(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function grantAccess(tier: number) {
    setGranting(true)
    try {
      await fetch(`/api/investors/${id}/grant-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const res = await fetch(`/api/investors/${id}`)
      setInvestor(await res.json())
    } catch (err) {
      console.error(err)
    }
    setGranting(false)
  }

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    setConverting(true)
    setConvertError('')
    setConvertSuccess('')

    try {
      const res = await fetch('/api/actual-investors/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_id: id,
          ...convertForm,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setConvertError(data.error || 'Failed to convert investor')
        setConverting(false)
        return
      }

      setConvertSuccess(data.message || 'Investor converted successfully!')
      setShowConvert(false)
    } catch {
      setConvertError('Failed to convert investor')
    } finally {
      setConverting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!investor) {
    return (
      <div className="p-8 text-center" style={{ color: '#4A6578' }}>Investor not found.</div>
    )
  }

  const profile = investor.investor_profiles?.[0] || investor.investor_profiles

  const inputClasses = "w-full px-3 py-2 rounded-lg border text-sm transition-all duration-200"
  const inputStyle = { borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }

  return (
    <div className="p-8 max-w-4xl">
      <button
        onClick={() => router.push('/admin/investors')}
        className="flex items-center gap-1 text-sm mb-6 transition-colors"
        style={{ color: '#4A6578' }}
        onMouseEnter={e => { e.currentTarget.style.color = '#57ACAF' }}
        onMouseLeave={e => { e.currentTarget.style.color = '#4A6578' }}
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Potential Investors
      </button>

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="admin-page-label">Investor Profile</p>
          <h1 className="admin-page-title">
            {investor.first_name} {investor.last_name}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#4A6578' }}>{investor.email}</p>
          {investor.firm_name && (
            <p className="text-sm mt-0.5" style={{ color: '#8FAAB8' }}>{investor.firm_name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <TierBadge tier={investor.access_tier} />
          {profile && <FitScoreBadge score={profile.fit_score} />}
        </div>
      </div>

      {/* Access Controls */}
      <Card glow className="mb-6" accent="#57ACAF">
        <h2 className="admin-section-label" style={{ marginBottom: 12 }}>Access Control</h2>
        <div className="flex items-center gap-3">
          <Button
            variant={investor.access_tier >= 1 ? 'outline' : 'primary'}
            size="sm"
            onClick={() => grantAccess(1)}
            loading={granting}
            disabled={investor.access_tier >= 1}
          >
            {investor.access_tier >= 1 ? 'Tier 1 Granted' : 'Grant Tier 1 (Soft Access)'}
          </Button>
          <Button
            variant={investor.access_tier >= 2 ? 'outline' : 'primary'}
            size="sm"
            onClick={() => grantAccess(2)}
            loading={granting}
            disabled={investor.access_tier >= 2}
          >
            {investor.access_tier >= 2 ? 'Tier 2 Granted' : 'Grant Full Access (Tier 2)'}
          </Button>
        </div>
        {investor.portal_token && (
          <p className="text-xs mt-3 font-mono" style={{ color: '#3A5060' }}>
            Portal link: {process.env.NEXT_PUBLIC_APP_URL || ''}/portal/{investor.portal_token}
          </p>
        )}
      </Card>

      {/* Investment Interest Alert */}
      {investor.status === 'interested' && (
        <div className="mb-6 px-4 py-4 rounded-xl border" style={{ background: '#10B98110', borderColor: '#10B98130' }}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔥</span>
            <span className="text-sm font-bold" style={{ color: '#10B981' }}>Investment Interest Expressed</span>
          </div>
          <p className="text-sm mb-2" style={{ color: '#10B981' }}>
            This investor has expressed interest in investing via the portal.
            {investor.check_size ? ` Intended check size: ${investor.check_size}.` : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setShowConvert(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-1.5" />
              Convert to Actual Investor
            </Button>
            <a
              href={`mailto:${investor.email}?subject=fabricXai%20—%20Next%20Steps%20for%20Your%20Investment`}
              className="text-sm font-medium underline transition-colors"
              style={{ color: '#10B981' }}
            >
              Email Investor &rarr;
            </a>
          </div>
        </div>
      )}

      {/* Convert success/error */}
      {convertSuccess && (
        <div className="mb-6 px-4 py-3 rounded-lg border text-sm" style={{ background: '#10B98112', borderColor: '#10B98130', color: '#10B981' }}>
          {convertSuccess}
          <button onClick={() => router.push('/admin/actual-investors')} className="ml-2 underline font-medium">
            View Actual Investors &rarr;
          </button>
        </div>
      )}
      {convertError && !showConvert && (
        <div className="mb-6 px-4 py-3 rounded-lg border text-sm" style={{ background: '#EF444412', borderColor: '#EF444430', color: '#EF4444' }}>
          {convertError}
        </div>
      )}

      <Card glow className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="admin-section-label">Convert to Actual Investor</h2>
            <p className="text-xs mt-1" style={{ color: '#4A6578' }}>
              Promote this potential investor to an actual investor with a dedicated dashboard.
            </p>
          </div>
          {!showConvert && !convertSuccess && (
            <Button variant="outline" size="sm" onClick={() => setShowConvert(true)}>
              <ArrowRightLeft className="h-4 w-4 mr-1.5" />
              Convert
            </Button>
          )}
        </div>

        {showConvert && (
          <form onSubmit={handleConvert} className="mt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="admin-section-label block mb-1.5">Invested Amount (USD)</label>
                <input
                  type="number"
                  value={convertForm.invested_amount}
                  onChange={e => setConvertForm({ ...convertForm, invested_amount: e.target.value })}
                  className={inputClasses} style={inputStyle} placeholder="50000"
                  onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label className="admin-section-label block mb-1.5">Investment Date</label>
                <input
                  type="date"
                  value={convertForm.invested_date}
                  onChange={e => setConvertForm({ ...convertForm, invested_date: e.target.value })}
                  className={inputClasses} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
              <div>
                <label className="admin-section-label block mb-1.5">Instrument</label>
                <select value={convertForm.instrument} onChange={e => setConvertForm({ ...convertForm, instrument: e.target.value })} className={inputClasses} style={inputStyle}>
                  {INSTRUMENTS.map(ins => (<option key={ins} value={ins}>{ins}</option>))}
                </select>
              </div>
              <div>
                <label className="admin-section-label block mb-1.5">Notes</label>
                <input type="text" value={convertForm.notes} onChange={e => setConvertForm({ ...convertForm, notes: e.target.value })} className={inputClasses} style={inputStyle} placeholder="Optional notes"
                  onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            </div>
            {convertError && showConvert && (
              <div className="px-3 py-2 rounded-lg border text-sm" style={{ background: '#EF444412', borderColor: '#EF444430', color: '#EF4444' }}>{convertError}</div>
            )}
            <div className="flex items-center gap-3">
              <Button variant="primary" size="sm" type="submit" loading={converting}>Convert & Send Welcome Email</Button>
              <button type="button" onClick={() => { setShowConvert(false); setConvertError('') }} className="text-sm transition-colors" style={{ color: '#4A6578' }}>Cancel</button>
            </div>
          </form>
        )}
      </Card>

      {/* Investor Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card glow>
          <h2 className="admin-section-label" style={{ marginBottom: 12 }}>Submission Details</h2>
          <dl className="space-y-3 text-sm">
            {[
              { label: 'Status', value: (
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                  style={investor.status === 'interested' ? { background: '#10B98112', color: '#10B981', border: '1px solid #10B98130' }
                    : investor.status === 'approved' ? { background: '#57ACAF12', color: '#57ACAF', border: '1px solid #57ACAF30' }
                    : { background: 'rgba(255,255,255,0.05)', color: '#8FAAB8', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {investor.status === 'interested' ? '🔥 Interested in Investing' : investor.status || 'new'}
                </span>
              )},
              { label: 'Type', value: <span className="capitalize" style={{ color: '#C8D8E4' }}>{investor.investor_type || '—'}</span> },
              { label: 'Check Size', value: <span style={{ color: '#C8D8E4' }}>{investor.check_size || '—'}</span> },
              { label: 'Message', value: <span style={{ color: '#C8D8E4' }}>{investor.message || '—'}</span> },
              { label: 'Visits', value: <span style={{ color: '#C8D8E4' }}>{investor.visit_count || 0}</span> },
              { label: 'Last Visit', value: <span style={{ color: '#C8D8E4' }}>{investor.last_portal_visit ? new Date(investor.last_portal_visit).toLocaleString() : 'Never'}</span> },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt style={{ color: '#4A6578', fontSize: 11, fontFamily: 'var(--font-mono)' }}>{label}</dt>
                <dd className="mt-0.5">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* AI Profile */}
        {profile && profile.research_status === 'complete' ? (
          <Card glow accent="#8B5CF6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="admin-section-label">AI Research Profile</h2>
              <FitScoreBadge score={profile.fit_score} />
            </div>
            <dl className="space-y-3 text-sm">
              {profile.firm_name && (
                <div>
                  <dt style={{ color: '#4A6578', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Firm</dt>
                  <dd style={{ color: '#C8D8E4' }}>{profile.firm_name}</dd>
                </div>
              )}
              {profile.aum && (
                <div>
                  <dt style={{ color: '#4A6578', fontSize: 11, fontFamily: 'var(--font-mono)' }}>AUM</dt>
                  <dd style={{ color: '#C8D8E4' }}>{profile.aum}</dd>
                </div>
              )}
              {profile.location && (
                <div>
                  <dt style={{ color: '#4A6578', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Location</dt>
                  <dd style={{ color: '#C8D8E4' }}>{profile.location}</dd>
                </div>
              )}
              {profile.focus_areas?.length > 0 && (
                <div>
                  <dt style={{ color: '#4A6578', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Focus Areas</dt>
                  <dd className="flex flex-wrap gap-1 mt-1">
                    {profile.focus_areas.map((area: string) => (
                      <span key={area} className="inline-flex items-center rounded-full px-2 py-0.5 text-xs"
                        style={{ background: '#57ACAF12', color: '#57ACAF', border: '1px solid #57ACAF30' }}>{area}</span>
                    ))}
                  </dd>
                </div>
              )}
              {profile.stage_focus?.length > 0 && (
                <div>
                  <dt style={{ color: '#4A6578', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Stage Focus</dt>
                  <dd style={{ color: '#C8D8E4' }}>{profile.stage_focus.join(', ')}</dd>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#57ACAF' }}>
                    LinkedIn <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {profile.crunchbase_url && (
                  <a href={profile.crunchbase_url} target="_blank" rel="noopener noreferrer" className="text-xs flex items-center gap-1 transition-colors" style={{ color: '#57ACAF' }}>
                    Crunchbase <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </dl>
          </Card>
        ) : profile?.research_status === 'processing' ? (
          <Card glow>
            <div className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4 animate-spin" style={{ color: '#57ACAF' }} />
              <span className="text-sm" style={{ color: '#4A6578' }}>AI research in progress...</span>
            </div>
          </Card>
        ) : null}
      </div>

      {/* AI Summary & Fit Reasoning */}
      {profile?.ai_summary && (
        <Card glow className="mb-6" accent="#8B5CF6">
          <h2 className="admin-section-label" style={{ marginBottom: 8 }}>AI Summary</h2>
          <p className="text-sm whitespace-pre-wrap" style={{ color: '#C8D8E4', lineHeight: 1.6 }}>{profile.ai_summary}</p>
        </Card>
      )}

      {profile?.fit_reasoning && (
        <Card glow accent="#EAB308">
          <h2 className="admin-section-label" style={{ marginBottom: 8 }}>Fit Reasoning</h2>
          <p className="text-sm whitespace-pre-wrap" style={{ color: '#C8D8E4', lineHeight: 1.6 }}>{profile.fit_reasoning}</p>
        </Card>
      )}
    </div>
  )
}
