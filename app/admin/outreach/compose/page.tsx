'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OutreachAvatar from '@/components/outreach/OutreachAvatar'
import OutreachFitBadge from '@/components/outreach/OutreachFitBadge'
import StagePill from '@/components/outreach/StagePill'
import HunterLoadingDots from '@/components/outreach/HunterLoadingDots'
import { TONE_OPTIONS } from '@/lib/outreach-email'
import { Sparkles, Send, Eye, Mail, ChevronDown, CheckCircle, AlertCircle } from 'lucide-react'
import type { OutreachInvestor } from '@/lib/types'

const inputBaseClass = 'w-full rounded-lg border px-3 py-2 text-sm placeholder:text-[#2D4455] focus:outline-none transition-colors'
const inputStyle = { borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }
const inputFocusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#57ACAF'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)'
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#152238'
    e.currentTarget.style.boxShadow = 'none'
  },
}

function ComposeContent() {
  const searchParams = useSearchParams()
  const preselectedId = searchParams.get('investor_id')

  const [investors, setInvestors] = useState<OutreachInvestor[]>([])
  const [loadingInvestors, setLoadingInvestors] = useState(true)
  const [selectedInvestorId, setSelectedInvestorId] = useState<string>(preselectedId || '')
  const [tone, setTone] = useState<string>(TONE_OPTIONS[0]?.value || 'professional')

  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const [generating, setGenerating] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [sending, setSending] = useState(false)
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const selectedInvestor = investors.find((i) => i.id === selectedInvestorId) || null

  useEffect(() => {
    async function fetchInvestors() {
      try {
        const res = await fetch('/api/outreach/investors')
        if (res.ok) {
          const data = await res.json()
          setInvestors(data.investors || data || [])
        }
      } catch {
        // silent
      } finally {
        setLoadingInvestors(false)
      }
    }
    fetchInvestors()
  }, [])

  useEffect(() => {
    if (preselectedId && investors.length > 0 && !selectedInvestorId) {
      setSelectedInvestorId(preselectedId)
    }
  }, [preselectedId, investors, selectedInvestorId])

  function clearMessages() {
    setSuccessMsg(null)
    setErrorMsg(null)
  }

  async function handleGenerate() {
    if (!selectedInvestorId) {
      setErrorMsg('Please select an investor first.')
      return
    }
    clearMessages()
    setGenerating(true)
    try {
      const res = await fetch('/api/outreach/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investor_id: selectedInvestorId, tone }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate email')
      }
      const data = await res.json()
      setSubject(data.subject || '')
      setBody(data.body || '')
      setPreviewHtml(null)
    } catch (err: any) {
      setErrorMsg(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  async function handlePreview() {
    clearMessages()
    setPreviewing(true)
    try {
      const res = await fetch('/api/outreach/preview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          to_name: selectedInvestor?.name || '',
          to_email: selectedInvestor?.email || '',
        }),
      })
      if (!res.ok) throw new Error('Failed to generate preview')
      const data = await res.json()
      setPreviewHtml(data.html || '')
    } catch (err: any) {
      setErrorMsg(err.message || 'Preview failed')
    } finally {
      setPreviewing(false)
    }
  }

  async function handleSend() {
    if (!selectedInvestorId || !subject || !body) {
      setErrorMsg('Please select an investor and fill in subject and body.')
      return
    }
    clearMessages()
    setSending(true)
    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_id: selectedInvestorId,
          subject,
          body,
          tone,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to send email')
      }
      setSuccessMsg('Email sent successfully!')
    } catch (err: any) {
      setErrorMsg(err.message || 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="admin-page-label">Outreach</p>
        <h1 className="admin-page-title">Compose Outreach</h1>
      </div>

      {/* Success / Error */}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* LEFT COLUMN */}
        <div className="space-y-4 lg:col-span-2">
          {/* Investor Picker */}
          <Card padding glow>
            <h2 className="admin-section-label mb-3">
              Select Investor
            </h2>

            {loadingInvestors ? (
              <div className="flex items-center justify-center py-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : (
              <div className="relative">
                <select
                  className={`${inputBaseClass} appearance-none`}
                  style={inputStyle}
                  value={selectedInvestorId}
                  onChange={(e) => {
                    setSelectedInvestorId(e.target.value)
                    clearMessages()
                  }}
                  {...inputFocusHandlers}
                >
                  <option value="" style={{ background: '#0C1929' }}>
                    Choose an investor...
                  </option>
                  {investors.map((inv) => (
                    <option key={inv.id} value={inv.id} style={{ background: '#0C1929' }}>
                      {inv.name} {inv.firm_name ? `— ${inv.firm_name}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: '#4A6578' }} />
              </div>
            )}

            {/* Selected Investor Card */}
            {selectedInvestor && (
              <div className="mt-4 rounded-lg p-4" style={{ border: '1px solid #0F1E2A', background: '#07111E' }}>
                <div className="flex items-start gap-3">
                  <OutreachAvatar
                    initials={selectedInvestor.avatar_initials}
                    color={selectedInvestor.avatar_color}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-semibold" style={{ color: '#E8F0F8' }}>
                        {selectedInvestor.name}
                      </span>
                      <OutreachFitBadge score={selectedInvestor.fit_score} />
                    </div>
                    {selectedInvestor.firm_name && (
                      <p className="mt-0.5 text-sm" style={{ color: '#4A6578' }}>{selectedInvestor.firm_name}</p>
                    )}
                    {selectedInvestor.email && (
                      <p className="mt-1 flex items-center gap-1 text-xs" style={{ color: '#2D4455' }}>
                        <Mail className="h-3 w-3" />
                        {selectedInvestor.email}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <StagePill stage={selectedInvestor.pipeline_status} />
                      {selectedInvestor.check_size && (
                        <Badge variant="info">{selectedInvestor.check_size}</Badge>
                      )}
                    </div>
                    {selectedInvestor.thesis && (
                      <p className="mt-2 text-xs leading-relaxed line-clamp-3" style={{ color: '#4A6578' }}>
                        {selectedInvestor.thesis}
                      </p>
                    )}
                    {selectedInvestor.focus_areas && (
                      <p className="mt-1 text-xs" style={{ color: '#2D4455' }}>
                        Focus: {selectedInvestor.focus_areas}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Tone Selector */}
          <Card padding glow>
            <h2 className="admin-section-label mb-3">
              Email Tone
            </h2>
            <div className="space-y-2">
              {TONE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors"
                  style={{
                    borderColor: tone === opt.value ? 'rgba(87,172,175,0.5)' : '#152238',
                    background: tone === opt.value ? 'rgba(87,172,175,0.05)' : 'transparent',
                  }}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={opt.value}
                    checked={tone === opt.value}
                    onChange={() => setTone(opt.value)}
                    className="mt-0.5 accent-[#57ACAF]"
                  />
                  <div>
                    <span className="text-sm font-medium" style={{ color: '#E8F0F8' }}>{opt.label}</span>
                    <p className="mt-0.5 text-xs" style={{ color: '#4A6578' }}>{opt.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN -- Email Composer */}
        <div className="space-y-4 lg:col-span-3">
          <Card padding glow>
            <h2 className="admin-section-label mb-4">
              Email Composer
            </h2>

            {/* Subject */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>Subject</label>
              <input
                type="text"
                className={inputBaseClass}
                style={inputStyle}
                placeholder="Email subject line..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                {...inputFocusHandlers}
              />
            </div>

            {/* Body */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>Body</label>
              <textarea
                className={`${inputBaseClass} min-h-[288px] resize-y`}
                style={inputStyle}
                rows={12}
                placeholder="Write your email body here, or generate with HUNTER AI..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                {...inputFocusHandlers}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="md"
                onClick={handleGenerate}
                loading={generating}
                disabled={generating || !selectedInvestorId}
              >
                {generating ? (
                  <span className="flex items-center gap-2">
                    <HunterLoadingDots /> Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate with HUNTER
                  </span>
                )}
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={handlePreview}
                loading={previewing}
                disabled={previewing || (!subject && !body)}
              >
                <span className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Preview HTML
                </span>
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={handleSend}
                loading={sending}
                disabled={sending || !selectedInvestorId || !subject || !body}
              >
                <span className="flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Send Email
                </span>
              </Button>
            </div>
          </Card>

          {/* Preview iframe */}
          {previewHtml && (
            <Card padding glow>
              <h2 className="admin-section-label mb-3">
                HTML Preview
              </h2>
              <div className="overflow-hidden rounded-lg" style={{ border: '1px solid #152238' }}>
                <iframe
                  srcDoc={previewHtml}
                  className="h-[500px] w-full bg-white"
                  title="Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ComposeOutreachPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <ComposeContent />
    </Suspense>
  )
}
