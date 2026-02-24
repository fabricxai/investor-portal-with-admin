'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OutreachAvatar from '@/components/outreach/OutreachAvatar'
import OutreachFitBadge from '@/components/outreach/OutreachFitBadge'
import StagePill from '@/components/outreach/StagePill'
import type { OutreachInvestor, DiscoveryEvent, DiscoveredInvestor, DiscoveryStrategy } from '@/lib/types'
import {
  Search,
  Plus,
  ExternalLink,
  ArrowRight,
  X,
  AlertCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  UserPlus,
  SkipForward,
} from 'lucide-react'

const GEO_FILTERS = ['All', 'Singapore', 'Dhaka', 'Bangalore', 'Dubai', 'San Francisco']

const STRATEGY_OPTIONS: { value: DiscoveryStrategy; label: string; description: string }[] = [
  { value: 'thesis', label: 'Thesis', description: 'Find investors by investment thesis' },
  { value: 'portfolio', label: 'Portfolio', description: 'Find investors with relevant portfolios' },
  { value: 'deals', label: 'Recent Deals', description: 'Find recent seed/pre-seed deals' },
  { value: 'geography', label: 'Geography', description: 'Find investors by geography' },
  { value: 'news', label: 'News', description: 'Find investors from news & events' },
]

interface AddFormData {
  name: string
  email: string
  firm_name: string
  thesis: string
  focus_areas: string
  check_size: string
  stage_preference: string
  geography: string
  fit_score: string
  portfolio_companies: string
}

const EMPTY_FORM: AddFormData = {
  name: '',
  email: '',
  firm_name: '',
  thesis: '',
  focus_areas: '',
  check_size: '',
  stage_preference: '',
  geography: '',
  fit_score: '',
  portfolio_companies: '',
}

// ─── INPUT STYLE HELPERS ──────────────────────────────────────────────────────

const inputStyle = { borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }
const inputClassName = 'w-full rounded-lg border px-3 py-2 text-sm placeholder:text-[#2D4455] focus:outline-none transition-colors'

function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#57ACAF'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)'
}
function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = '#152238'
  e.currentTarget.style.boxShadow = 'none'
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function OutreachDiscover() {
  // Existing investor list state
  const [investors, setInvestors] = useState<OutreachInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [geoFilter, setGeoFilter] = useState('All')
  const [showAddForm, setShowAddForm] = useState(false)
  const [addForm, setAddForm] = useState<AddFormData>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Discovery agent state
  const [discoveryOpen, setDiscoveryOpen] = useState(false)
  const [discoveryRunning, setDiscoveryRunning] = useState(false)
  const [discoveryEvents, setDiscoveryEvents] = useState<DiscoveryEvent[]>([])
  const [discoveredInvestors, setDiscoveredInvestors] = useState<DiscoveredInvestor[]>([])
  const [addingIds, setAddingIds] = useState<Set<string>>(new Set())
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set())
  const abortRef = useRef<AbortController | null>(null)
  const feedRef = useRef<HTMLDivElement>(null)

  // Discovery config state
  const [strategies, setStrategies] = useState<Set<DiscoveryStrategy>>(
    new Set(['thesis', 'portfolio', 'deals', 'geography', 'news'])
  )
  const [focusKeywords, setFocusKeywords] = useState('AI, manufacturing, garments, supply chain')
  const [geoDiscovery, setGeoDiscovery] = useState('Singapore, Dubai, South Asia, Bangladesh')
  const [stageFilter, setStageFilter] = useState('Pre-seed, Seed')
  const [minFitScore, setMinFitScore] = useState('50')
  const [maxResults, setMaxResults] = useState('20')

  // ─── FETCH INVESTORS ────────────────────────────────────────────────────────

  const fetchInvestors = useCallback(async () => {
    try {
      const res = await fetch('/api/outreach/investors')
      if (!res.ok) throw new Error('Failed to fetch investors')
      const data: OutreachInvestor[] = await res.json()
      setInvestors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvestors()
  }, [fetchInvestors])

  const filtered = useMemo(() => {
    let result = investors
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (inv) =>
          inv.name.toLowerCase().includes(q) ||
          (inv.firm_name && inv.firm_name.toLowerCase().includes(q))
      )
    }
    if (geoFilter !== 'All') {
      result = result.filter(
        (inv) =>
          inv.geography &&
          inv.geography.toLowerCase().includes(geoFilter.toLowerCase())
      )
    }
    return result
  }, [investors, search, geoFilter])

  // ─── ADD INVESTOR (manual) ──────────────────────────────────────────────────

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    try {
      const payload: Record<string, unknown> = {
        name: addForm.name,
        email: addForm.email || null,
        firm_name: addForm.firm_name || null,
        thesis: addForm.thesis || null,
        focus_areas: addForm.focus_areas || null,
        check_size: addForm.check_size || null,
        stage_preference: addForm.stage_preference || null,
        geography: addForm.geography || null,
        fit_score: addForm.fit_score ? parseInt(addForm.fit_score, 10) : 50,
        portfolio_companies: addForm.portfolio_companies
          ? addForm.portfolio_companies.split(',').map((s) => s.trim()).filter(Boolean)
          : null,
      }

      const res = await fetch('/api/outreach/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to create investor')
      }

      setAddForm(EMPTY_FORM)
      setShowAddForm(false)
      setLoading(true)
      fetchInvestors()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field: keyof AddFormData, value: string) => {
    setAddForm((prev) => ({ ...prev, [field]: value }))
  }

  // ─── DISCOVERY AGENT ────────────────────────────────────────────────────────

  const toggleStrategy = (s: DiscoveryStrategy) => {
    setStrategies(prev => {
      const next = new Set(prev)
      if (next.has(s)) next.delete(s)
      else next.add(s)
      return next
    })
  }

  const startDiscovery = async () => {
    if (strategies.size === 0) return

    setDiscoveryRunning(true)
    setDiscoveryEvents([])
    setDiscoveredInvestors([])
    setAddedNames(new Set())

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/outreach/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategies: Array.from(strategies),
          focusKeywords: focusKeywords.split(',').map(s => s.trim()).filter(Boolean),
          geographyFilter: geoDiscovery,
          stageFilter,
          minFitScore: parseInt(minFitScore, 10) || 50,
          maxResults: parseInt(maxResults, 10) || 20,
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        throw new Error('Discovery request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event: DiscoveryEvent = JSON.parse(line.slice(6))
            setDiscoveryEvents(prev => [...prev, event])

            if (event.type === 'investor_found' && event.data) {
              setDiscoveredInvestors(prev => [...prev, event.data!])
            }

            // Auto-scroll feed
            setTimeout(() => {
              feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
            }, 50)
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setDiscoveryEvents(prev => [
          ...prev,
          { type: 'error', message: err instanceof Error ? err.message : 'Discovery failed' },
        ])
      }
    } finally {
      setDiscoveryRunning(false)
      abortRef.current = null
    }
  }

  const stopDiscovery = () => {
    abortRef.current?.abort()
    setDiscoveryRunning(false)
  }

  const addToPipeline = async (investor: DiscoveredInvestor) => {
    const key = `${investor.name}|${investor.firm_name || ''}`
    setAddingIds(prev => new Set(prev).add(key))

    try {
      const res = await fetch('/api/outreach/investors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: investor.name,
          email: investor.email,
          firm_name: investor.firm_name,
          firm_website: investor.firm_website,
          thesis: investor.thesis,
          focus_areas: investor.focus_areas,
          check_size: investor.check_size,
          stage_preference: investor.stage_preference,
          geography: investor.geography,
          fit_score: investor.fit_score,
          portfolio_companies: investor.portfolio_companies,
          linkedin_url: investor.linkedin_url,
          crunchbase_url: investor.crunchbase_url,
          notes: `[HUNTER Discovery] ${investor.fit_reasoning || ''}`,
        }),
      })

      if (res.ok) {
        setAddedNames(prev => new Set(prev).add(key))
        fetchInvestors()
      }
    } catch {
      // Silent fail — user can retry
    } finally {
      setAddingIds(prev => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  const addAllToPipeline = async () => {
    const toAdd = discoveredInvestors.filter(inv => {
      const key = `${inv.name}|${inv.firm_name || ''}`
      return !inv.already_in_pipeline && !addedNames.has(key)
    })
    for (const inv of toAdd) {
      await addToPipeline(inv)
    }
  }

  // ─── EVENT ICON HELPER ──────────────────────────────────────────────────────

  function eventIcon(type: DiscoveryEvent['type']) {
    switch (type) {
      case 'status': return <div className="w-2 h-2 rounded-full bg-aqua animate-pulse mt-1.5 shrink-0" />
      case 'investor_profiled': return <Check className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
      case 'investor_skipped': return <SkipForward className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: '#4A6578' }} />
      case 'investor_found': return <UserPlus className="h-3.5 w-3.5 text-aqua mt-0.5 shrink-0" />
      case 'error': return <AlertCircle className="h-3.5 w-3.5 text-red-400 mt-0.5 shrink-0" />
      case 'complete': return <Sparkles className="h-3.5 w-3.5 text-yellow mt-0.5 shrink-0" />
      default: return null
    }
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────

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
          <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-3" />
          <p style={{ color: '#4A6578' }}>{error}</p>
        </div>
      </div>
    )
  }

  const newInvestors = discoveredInvestors.filter(inv => {
    const key = `${inv.name}|${inv.firm_name || ''}`
    return !inv.already_in_pipeline && !addedNames.has(key)
  })

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="admin-page-label">Outreach</p>
          <h1 className="admin-page-title">Discover Investors</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDiscoveryOpen(!discoveryOpen)
            }}
          >
            <Sparkles className="h-4 w-4 mr-1.5" style={{ color: '#EAB308' }} />
            HUNTER Agent
            {discoveryOpen ? <ChevronUp className="h-3.5 w-3.5 ml-1.5" /> : <ChevronDown className="h-3.5 w-3.5 ml-1.5" />}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setShowAddForm(!showAddForm)
              setSaveError(null)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add Investor
          </Button>
        </div>
      </div>

      {/* ─── HUNTER DISCOVERY AGENT PANEL ────────────────────────────────────── */}
      {discoveryOpen && (
        <Card glow>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EAB30815', border: '1px solid #EAB30830' }}>
              <Sparkles className="h-4 w-4" style={{ color: '#EAB308' }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: '#E8F0F8' }}>HUNTER Discovery Agent</h2>
              <p className="text-[10px]" style={{ color: '#4A6578' }}>AI-powered investor discovery using web search</p>
            </div>
          </div>

          {/* Strategy checkboxes */}
          <div className="mb-4">
            <label className="block text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: '#2D4455' }}>
              Search Strategies
            </label>
            <div className="flex flex-wrap gap-2">
              {STRATEGY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleStrategy(opt.value)}
                  disabled={discoveryRunning}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50"
                  style={
                    strategies.has(opt.value)
                      ? { background: '#57ACAF15', color: '#57ACAF', border: '1px solid #57ACAF40' }
                      : { background: '#0A1525', border: '1px solid #152238', color: '#4A6578' }
                  }
                >
                  {strategies.has(opt.value) && <Check className="h-3 w-3 inline mr-1" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Config fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: '#2D4455' }}>
                Focus Keywords
              </label>
              <input
                type="text"
                value={focusKeywords}
                onChange={e => setFocusKeywords(e.target.value)}
                disabled={discoveryRunning}
                className={inputClassName}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="AI, manufacturing, garments"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: '#2D4455' }}>
                Geography
              </label>
              <input
                type="text"
                value={geoDiscovery}
                onChange={e => setGeoDiscovery(e.target.value)}
                disabled={discoveryRunning}
                className={inputClassName}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Singapore, Dubai, South Asia"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: '#2D4455' }}>
                Stage
              </label>
              <input
                type="text"
                value={stageFilter}
                onChange={e => setStageFilter(e.target.value)}
                disabled={discoveryRunning}
                className={inputClassName}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="Pre-seed, Seed"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: '#2D4455' }}>
                Min Fit Score
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={minFitScore}
                onChange={e => setMinFitScore(e.target.value)}
                disabled={discoveryRunning}
                className={inputClassName}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="50"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: '#2D4455' }}>
                Max Results
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={maxResults}
                onChange={e => setMaxResults(e.target.value)}
                disabled={discoveryRunning}
                className={inputClassName}
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder="20"
              />
            </div>
          </div>

          {/* Start / Stop button */}
          <div className="flex items-center gap-3 mb-4">
            {!discoveryRunning ? (
              <Button
                variant="primary"
                size="sm"
                onClick={startDiscovery}
                disabled={strategies.size === 0}
              >
                <Search className="h-4 w-4 mr-1.5" />
                Start Discovery
              </Button>
            ) : (
              <Button variant="danger" size="sm" onClick={stopDiscovery}>
                <X className="h-4 w-4 mr-1.5" />
                Stop
              </Button>
            )}
            {discoveryRunning && (
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 text-aqua animate-spin" />
                <span className="text-xs font-medium text-aqua">HUNTER searching...</span>
              </div>
            )}
          </div>

          {/* Live Feed */}
          {discoveryEvents.length > 0 && (
            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-bold mb-2" style={{ color: '#2D4455' }}>
                Live Feed
              </label>
              <div
                ref={feedRef}
                className="rounded-lg border p-3 max-h-48 overflow-y-auto space-y-1.5"
                style={{ borderColor: '#152238', background: '#070F1B' }}
              >
                {discoveryEvents
                  .filter(e => e.type !== 'investor_found')
                  .map((event, i) => (
                    <div key={i} className="flex items-start gap-2">
                      {eventIcon(event.type)}
                      <span
                        className="text-xs leading-relaxed"
                        style={{ color: event.type === 'error' ? '#EF4444' : event.type === 'complete' ? '#EAB308' : '#6A8899' }}
                      >
                        {event.message}
                        {event.progress && (
                          <span style={{ color: '#2D4455' }}> ({event.progress.current}/{event.progress.total})</span>
                        )}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Discovered Investors */}
          {discoveredInvestors.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-[10px] uppercase tracking-wider font-bold" style={{ color: '#2D4455' }}>
                  Discovered ({discoveredInvestors.length} investors, {newInvestors.length} new)
                </label>
                {newInvestors.length > 0 && !discoveryRunning && (
                  <Button variant="primary" size="sm" onClick={addAllToPipeline}>
                    <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                    Add All New ({newInvestors.length})
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {discoveredInvestors.map((inv, i) => {
                  const key = `${inv.name}|${inv.firm_name || ''}`
                  const isAdding = addingIds.has(key)
                  const isAdded = addedNames.has(key)
                  const isDuplicate = inv.already_in_pipeline

                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-lg border p-3 transition-colors"
                      style={{
                        borderColor: isDuplicate || isAdded ? '#152238' : '#1C3042',
                        background: isDuplicate || isAdded ? '#0A1525' : '#0C1929',
                        opacity: isDuplicate || isAdded ? 0.6 : 1,
                      }}
                    >
                      {/* Score badge */}
                      <OutreachFitBadge score={inv.fit_score} />

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold truncate" style={{ color: '#E8F0F8' }}>
                            {inv.name}
                          </p>
                          {inv.firm_name && (
                            <span className="text-xs truncate" style={{ color: '#4A6578' }}>
                              {inv.firm_name}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] mt-0.5 line-clamp-1" style={{ color: '#3A5060' }}>
                          {[inv.focus_areas, inv.check_size, inv.geography].filter(Boolean).join(' · ')}
                        </p>
                        {inv.portfolio_companies.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {inv.portfolio_companies.slice(0, 3).map(c => (
                              <span
                                key={c}
                                className="rounded px-1.5 py-0.5 text-[9px]"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #0F1E2A', color: '#4A6578' }}
                              >
                                {c}
                              </span>
                            ))}
                            {inv.portfolio_companies.length > 3 && (
                              <span className="text-[9px]" style={{ color: '#2D4455' }}>
                                +{inv.portfolio_companies.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="shrink-0">
                        {isDuplicate ? (
                          <span className="text-[10px] font-medium px-2 py-1 rounded" style={{ color: '#4A6578', background: '#0A1525' }}>
                            In pipeline
                          </span>
                        ) : isAdded ? (
                          <span className="text-[10px] font-medium px-2 py-1 rounded flex items-center gap-1" style={{ color: '#10B981' }}>
                            <Check className="h-3 w-3" /> Added
                          </span>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToPipeline(inv)}
                            loading={isAdding}
                            disabled={isAdding}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* ─── ADD INVESTOR FORM (manual) ──────────────────────────────────────── */}
      {showAddForm && (
        <Card glow>
          <div className="flex items-center justify-between mb-4">
            <h2 className="admin-section-label">
              New Outreach Investor
            </h2>
            <button
              onClick={() => setShowAddForm(false)}
              className="transition-colors"
              style={{ color: '#4A6578' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#E8F0F8' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#4A6578' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="investor@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Firm
                </label>
                <input
                  type="text"
                  value={addForm.firm_name}
                  onChange={(e) => updateField('firm_name', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Firm name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Thesis
                </label>
                <input
                  type="text"
                  value={addForm.thesis}
                  onChange={(e) => updateField('thesis', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Investment thesis"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Focus Areas
                </label>
                <input
                  type="text"
                  value={addForm.focus_areas}
                  onChange={(e) => updateField('focus_areas', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="AI, SaaS, Manufacturing"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Check Size
                </label>
                <input
                  type="text"
                  value={addForm.check_size}
                  onChange={(e) => updateField('check_size', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="$25K-$100K"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Stage Preference
                </label>
                <input
                  type="text"
                  value={addForm.stage_preference}
                  onChange={(e) => updateField('stage_preference', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Pre-seed, Seed"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Geography
                </label>
                <input
                  type="text"
                  value={addForm.geography}
                  onChange={(e) => updateField('geography', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Singapore, Dhaka"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Fit Score (0-100)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={addForm.fit_score}
                  onChange={(e) => updateField('fit_score', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="75"
                />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium mb-1.5" style={{ color: '#4A6578' }}>
                  Portfolio Companies (comma-separated)
                </label>
                <input
                  type="text"
                  value={addForm.portfolio_companies}
                  onChange={(e) => updateField('portfolio_companies', e.target.value)}
                  className={inputClassName}
                  style={inputStyle}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder="Company A, Company B, Company C"
                />
              </div>
            </div>

            {saveError && (
              <p className="text-xs text-red-400">{saveError}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" loading={saving}>
                Create Investor
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ─── SEARCH + GEO FILTERS ────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#2D4455' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or firm..."
            className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm placeholder:text-[#2D4455] focus:outline-none transition-colors"
            style={inputStyle}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {GEO_FILTERS.map((geo) => (
            <button
              key={geo}
              onClick={() => setGeoFilter(geo)}
              className="rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors"
              style={
                geoFilter === geo
                  ? { background: '#57ACAF12', color: '#57ACAF', border: '1px solid #57ACAF30' }
                  : { background: '#0C1929', border: '1px solid #152238', color: '#4A6578' }
              }
              onMouseEnter={(e) => {
                if (geoFilter !== geo) {
                  e.currentTarget.style.color = '#E8F0F8'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (geoFilter !== geo) {
                  e.currentTarget.style.color = '#4A6578'
                  e.currentTarget.style.background = '#0C1929'
                }
              }}
            >
              {geo}
            </button>
          ))}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-xs" style={{ color: '#4A6578' }}>
        Showing {filtered.length} investor{filtered.length !== 1 ? 's' : ''}
        {geoFilter !== 'All' && ` in ${geoFilter}`}
        {search.trim() && ` matching "${search}"`}
      </p>

      {/* ─── INVESTOR GRID ────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: '#2D4455' }}>
            No investors match your filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((inv) => (
            <Card key={inv.id} glow>
              {/* Top row: Avatar, Name, Firm, Stage */}
              <div className="flex items-start gap-3 mb-3">
                <OutreachAvatar
                  initials={inv.avatar_initials}
                  color={inv.avatar_color}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold truncate" style={{ color: '#E8F0F8' }}>
                      {inv.name}
                    </p>
                    <StagePill stage={inv.pipeline_status} />
                  </div>
                  <p className="text-xs truncate mt-0.5" style={{ color: '#4A6578' }}>
                    {inv.firm_name || 'Independent'}
                  </p>
                </div>
                <OutreachFitBadge score={inv.fit_score} />
              </div>

              {/* Meta Row */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                {inv.focus_areas && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#2D4455' }}>
                      Focus
                    </span>
                    <p className="text-xs truncate" style={{ color: '#4A6578' }}>{inv.focus_areas}</p>
                  </div>
                )}
                {inv.check_size && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#2D4455' }}>
                      Check Size
                    </span>
                    <p className="text-xs truncate" style={{ color: '#4A6578' }}>{inv.check_size}</p>
                  </div>
                )}
                {inv.geography && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#2D4455' }}>
                      Geography
                    </span>
                    <p className="text-xs truncate" style={{ color: '#4A6578' }}>{inv.geography}</p>
                  </div>
                )}
                {inv.stage_preference && (
                  <div>
                    <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: '#2D4455' }}>
                      Stage Pref
                    </span>
                    <p className="text-xs truncate" style={{ color: '#4A6578' }}>{inv.stage_preference}</p>
                  </div>
                )}
              </div>

              {/* Portfolio Tags */}
              {inv.portfolio_companies && inv.portfolio_companies.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {inv.portfolio_companies.slice(0, 5).map((company) => (
                    <span
                      key={company}
                      className="rounded-md px-2 py-0.5 text-[10px]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #0F1E2A', color: '#4A6578' }}
                    >
                      {company}
                    </span>
                  ))}
                  {inv.portfolio_companies.length > 5 && (
                    <span
                      className="rounded-md px-2 py-0.5 text-[10px]"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #0F1E2A', color: '#2D4455' }}
                    >
                      +{inv.portfolio_companies.length - 5} more
                    </span>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3" style={{ borderTop: '1px solid #152238' }}>
                <Link
                  href={`/admin/outreach/compose?investor_id=${inv.id}`}
                  className="flex items-center gap-1.5 text-xs font-medium text-aqua hover:text-aqua/80 transition-colors"
                >
                  Generate outreach
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                {inv.linkedin_url && (
                  <a
                    href={inv.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-xs transition-colors"
                    style={{ color: '#4A6578' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#E8F0F8' }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#4A6578' }}
                  >
                    <ExternalLink className="h-3 w-3" />
                    LinkedIn
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
