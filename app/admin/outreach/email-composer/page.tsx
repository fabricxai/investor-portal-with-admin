'use client'

import { useState, useEffect, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  FileText,
  Palette,
  Eye,
  Send,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react'

const inputBaseClass =
  'w-full rounded-lg border px-3 py-2 text-sm placeholder:text-[#2D4455] focus:outline-none transition-colors'
const inputStyle = { borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }
const inputFocusHandlers = {
  onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#57ACAF'
    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)'
  },
  onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = '#152238'
    e.currentTarget.style.boxShadow = 'none'
  },
}

type Tab = 'content' | 'design' | 'preview'

export default function EmailComposerPage() {
  // Content tab
  const [toName, setToName] = useState('')
  const [toEmail, setToEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [senderName, setSenderName] = useState('Arifur Rahman')

  // Design tab
  const [ctaText, setCtaText] = useState('Visit Investor Portal \u2192')
  const [ctaUrl, setCtaUrl] = useState('https://fabricxai.com/investors')
  const [calloutText, setCalloutText] = useState(
    'fabricXai is raising $150K\u2013$250K on a SAFE at a $3M cap. POC live in Dhaka \u2014 \u09F3240,000 saved in week 1.'
  )
  const [showStatsBar, setShowStatsBar] = useState(true)

  // State
  const [activeTab, setActiveTab] = useState<Tab>('content')
  const [previewHtml, setPreviewHtml] = useState<string>('')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function clearMessages() {
    setSuccessMsg(null)
    setErrorMsg(null)
  }

  const refreshPreview = useCallback(async () => {
    setLoadingPreview(true)
    clearMessages()
    try {
      const res = await fetch('/api/outreach/preview-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_name: toName,
          to_email: toEmail,
          subject,
          body,
          sender_name: senderName,
          cta_text: ctaText,
          cta_url: ctaUrl,
          callout_text: calloutText,
          show_stats_bar: showStatsBar,
        }),
      })
      if (!res.ok) throw new Error('Failed to generate preview')
      const data = await res.json()
      setPreviewHtml(data.html || '')
    } catch (err: any) {
      setErrorMsg(err.message || 'Preview generation failed')
    } finally {
      setLoadingPreview(false)
    }
  }, [toName, toEmail, subject, body, senderName, ctaText, ctaUrl, calloutText, showStatsBar])

  // Auto-refresh preview when switching to preview tab
  useEffect(() => {
    if (activeTab === 'preview') {
      refreshPreview()
    }
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleCopyHtml() {
    if (!previewHtml) {
      await refreshPreview()
    }
    try {
      await navigator.clipboard.writeText(previewHtml)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setErrorMsg('Failed to copy to clipboard')
    }
  }

  async function handleSend() {
    if (!toEmail || !subject || !body) {
      setErrorMsg('Please fill in recipient email, subject, and body.')
      return
    }
    clearMessages()
    setSending(true)
    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to_name: toName,
          to_email: toEmail,
          subject,
          body,
          sender_name: senderName,
          cta_text: ctaText,
          cta_url: ctaUrl,
          callout_text: calloutText,
          show_stats_bar: showStatsBar,
          email_type: 'manual',
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

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'content', label: 'Content', icon: <FileText className="h-4 w-4" /> },
    { key: 'design', label: 'Design', icon: <Palette className="h-4 w-4" /> },
    { key: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> },
  ]

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="admin-page-label">Outreach</p>
        <h1 className="admin-page-title">Email Composer</h1>
      </div>

      {/* Messages */}
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* LEFT COLUMN -- Tabbed Form */}
        <div className="space-y-4">
          <Card padding glow>
            {/* Tab Buttons */}
            <div className="mb-5 flex gap-1 rounded-lg p-1" style={{ border: '1px solid #152238', background: 'transparent' }}>
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: activeTab === tab.key ? '#152238' : 'transparent',
                    color: activeTab === tab.key ? '#E8F0F8' : '#4A6578',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.key) {
                      e.currentTarget.style.color = '#E8F0F8'
                      e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.key) {
                      e.currentTarget.style.color = '#4A6578'
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* CONTENT TAB */}
            {activeTab === 'content' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>
                      To Name
                    </label>
                    <input
                      type="text"
                      className={inputBaseClass}
                      style={inputStyle}
                      placeholder="Investor name"
                      value={toName}
                      onChange={(e) => setToName(e.target.value)}
                      {...inputFocusHandlers}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>
                      To Email
                    </label>
                    <input
                      type="email"
                      className={inputBaseClass}
                      style={inputStyle}
                      placeholder="investor@example.com"
                      value={toEmail}
                      onChange={(e) => setToEmail(e.target.value)}
                      {...inputFocusHandlers}
                    />
                  </div>
                </div>

                <div>
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

                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>Body</label>
                  <textarea
                    className={`${inputBaseClass} min-h-[288px] resize-y`}
                    style={inputStyle}
                    rows={12}
                    placeholder="Write your email body..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    {...inputFocusHandlers}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>
                    Sender Name
                  </label>
                  <input
                    type="text"
                    className={inputBaseClass}
                    style={inputStyle}
                    placeholder="Sender name"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    {...inputFocusHandlers}
                  />
                </div>
              </div>
            )}

            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>CTA Text</label>
                  <input
                    type="text"
                    className={inputBaseClass}
                    style={inputStyle}
                    placeholder="Button text..."
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    {...inputFocusHandlers}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>CTA URL</label>
                  <input
                    type="url"
                    className={inputBaseClass}
                    style={inputStyle}
                    placeholder="https://..."
                    value={ctaUrl}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    {...inputFocusHandlers}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>
                    Callout Text
                  </label>
                  <textarea
                    className={`${inputBaseClass} resize-y`}
                    style={inputStyle}
                    rows={4}
                    placeholder="Highlight text that appears in a callout box..."
                    value={calloutText}
                    onChange={(e) => setCalloutText(e.target.value)}
                    {...inputFocusHandlers}
                  />
                  <p className="mt-1 text-xs" style={{ color: '#2D4455' }}>
                    Appears as a highlighted callout box in the email
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium" style={{ color: '#4A6578' }}>
                    Show Stats Bar
                  </label>
                  <button
                    onClick={() => setShowStatsBar(!showStatsBar)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 transition-colors"
                    style={{ border: '1px solid #152238' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {showStatsBar ? (
                      <ToggleRight className="h-6 w-6 text-aqua" />
                    ) : (
                      <ToggleLeft className="h-6 w-6" style={{ color: '#2D4455' }} />
                    )}
                    <span className="text-sm" style={{ color: '#E8F0F8' }}>
                      {showStatsBar ? 'Stats bar visible' : 'Stats bar hidden'}
                    </span>
                  </button>
                  <p className="mt-1 text-xs" style={{ color: '#2D4455' }}>
                    Shows key metrics (factories, agents, etc.) in the email footer
                  </p>
                </div>
              </div>
            )}

            {/* PREVIEW TAB */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ color: '#4A6578' }}>
                    Rendered HTML email preview
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshPreview}
                    loading={loadingPreview}
                    disabled={loadingPreview}
                  >
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh Preview
                    </span>
                  </Button>
                </div>

                {loadingPreview ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="md" />
                  </div>
                ) : previewHtml ? (
                  <div className="overflow-hidden rounded-lg" style={{ border: '1px solid #152238' }}>
                    <iframe
                      srcDoc={previewHtml}
                      className="h-[500px] w-full bg-white"
                      title="Email Preview"
                      sandbox="allow-same-origin"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center rounded-lg border border-dashed py-16 text-sm" style={{ borderColor: '#152238', color: '#4A6578' }}>
                    Click &quot;Refresh Preview&quot; to render the email
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* RIGHT COLUMN -- Live Preview */}
        <div className="space-y-4">
          <Card padding glow>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="admin-section-label">
                Live Preview
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshPreview}
                loading={loadingPreview}
                disabled={loadingPreview}
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5" />
                  Refresh
                </span>
              </Button>
            </div>

            {loadingPreview && !previewHtml ? (
              <div className="flex items-center justify-center py-20">
                <LoadingSpinner size="md" />
              </div>
            ) : previewHtml ? (
              <div className="overflow-hidden rounded-lg" style={{ border: '1px solid #152238' }}>
                <iframe
                  srcDoc={previewHtml}
                  className="h-[600px] w-full bg-white"
                  title="Live Email Preview"
                  sandbox="allow-same-origin"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-20 text-center" style={{ borderColor: '#152238' }}>
                <Eye className="mb-3 h-10 w-10" style={{ color: '#2D4455' }} />
                <p className="text-sm" style={{ color: '#4A6578' }}>
                  Fill in the email content and click Refresh to see a live preview
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Bottom Actions */}
      <Card padding glow>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={handleCopyHtml}
            disabled={!previewHtml && !body}
          >
            <span className="flex items-center gap-2">
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy HTML
                </>
              )}
            </span>
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            loading={sending}
            disabled={sending || !toEmail || !subject || !body}
          >
            <span className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              Send Email
            </span>
          </Button>
        </div>
      </Card>
    </div>
  )
}
