'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OutreachAvatar from '@/components/outreach/OutreachAvatar'
import HunterLoadingDots from '@/components/outreach/HunterLoadingDots'
import { Calendar, Mail, Sparkles, Send, Archive, Inbox, Clock } from 'lucide-react'
import type { OutreachFollowup } from '@/lib/types'

function formatDueDate(dateStr: string | null): string {
  if (!dateStr) return 'No due date'
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  const formatted = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  })

  if (diffDays < 0) return `${formatted} (${Math.abs(diffDays)}d overdue)`
  if (diffDays === 0) return `${formatted} (Today)`
  if (diffDays === 1) return `${formatted} (Tomorrow)`
  if (diffDays <= 7) return `${formatted} (${diffDays}d)`
  return formatted
}

function urgencyBorderColor(urgency: string): string {
  switch (urgency) {
    case 'high':
      return '#EF4444'
    case 'medium':
      return '#EAB308'
    case 'low':
      return '#4A6578'
    default:
      return '#152238'
  }
}

function urgencyBadgeVariant(urgency: string): 'danger' | 'warning' | 'info' {
  switch (urgency) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
}

export default function FollowupsPage() {
  const [followups, setFollowups] = useState<OutreachFollowup[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(new Set())
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  const [archivingIds, setArchivingIds] = useState<Set<string>>(new Set())
  const [messages, setMessages] = useState<Record<string, { type: 'success' | 'error'; text: string }>>({})

  useEffect(() => {
    fetchFollowups()
  }, [])

  async function fetchFollowups() {
    try {
      const res = await fetch('/api/outreach/followups?status=pending')
      if (res.ok) {
        const data = await res.json()
        setFollowups(data.followups || data || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  function setMessage(id: string, type: 'success' | 'error', text: string) {
    setMessages((prev) => ({ ...prev, [id]: { type, text } }))
    setTimeout(() => {
      setMessages((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
    }, 5000)
  }

  async function handleGenerateDraft(followup: OutreachFollowup) {
    setGeneratingIds((prev) => new Set(prev).add(followup.id))
    try {
      const res = await fetch('/api/outreach/generate-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followup_id: followup.id }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to generate draft')
      }
      const data = await res.json()
      setFollowups((prev) =>
        prev.map((f) =>
          f.id === followup.id
            ? { ...f, ai_draft: data.ai_draft || data.body || '', ai_draft_subject: data.ai_draft_subject || data.subject || '' }
            : f
        )
      )
      setMessage(followup.id, 'success', 'Draft generated successfully')
    } catch (err: any) {
      setMessage(followup.id, 'error', err.message || 'Generation failed')
    } finally {
      setGeneratingIds((prev) => {
        const next = new Set(prev)
        next.delete(followup.id)
        return next
      })
    }
  }

  async function handleSendFollowup(followup: OutreachFollowup) {
    setSendingIds((prev) => new Set(prev).add(followup.id))
    try {
      const res = await fetch('/api/outreach/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investor_id: followup.outreach_investor_id,
          subject: followup.ai_draft_subject || 'Follow-up',
          body: followup.ai_draft || '',
          followup_id: followup.id,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to send')
      }
      setFollowups((prev) => prev.filter((f) => f.id !== followup.id))
      setMessage(followup.id, 'success', 'Follow-up sent successfully')
    } catch (err: any) {
      setMessage(followup.id, 'error', err.message || 'Send failed')
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev)
        next.delete(followup.id)
        return next
      })
    }
  }

  async function handleArchive(followup: OutreachFollowup) {
    setArchivingIds((prev) => new Set(prev).add(followup.id))
    try {
      const res = await fetch(`/api/outreach/followups/${followup.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      })
      if (!res.ok) throw new Error('Failed to archive')
      setFollowups((prev) => prev.filter((f) => f.id !== followup.id))
    } catch (err: any) {
      setMessage(followup.id, 'error', err.message || 'Archive failed')
    } finally {
      setArchivingIds((prev) => {
        const next = new Set(prev)
        next.delete(followup.id)
        return next
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="admin-page-label">Outreach</p>
          <h1 className="admin-page-title">Follow-up Queue</h1>
          <p className="mt-1 text-sm" style={{ color: '#4A6578' }}>
            {followups.length} pending follow-up{followups.length !== 1 ? 's' : ''} requiring attention
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: '#4A6578' }}>
          <Clock className="h-4 w-4" />
          <span>Sorted by urgency &amp; due date</span>
        </div>
      </div>

      {/* Empty State */}
      {followups.length === 0 && (
        <Card padding glow>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: '#57ACAF12' }}>
              <Inbox className="h-8 w-8 text-aqua" />
            </div>
            <h2 className="admin-page-title">
              All caught up!
            </h2>
            <p className="mt-1 max-w-sm text-sm" style={{ color: '#4A6578' }}>
              No pending follow-ups. New follow-ups will appear here as investor outreach emails become due for replies.
            </p>
          </div>
        </Card>
      )}

      {/* Follow-up Cards */}
      <div className="space-y-4">
        {followups.map((followup) => {
          const investor = followup.outreach_investor
          const isGenerating = generatingIds.has(followup.id)
          const isSending = sendingIds.has(followup.id)
          const isArchiving = archivingIds.has(followup.id)
          const msg = messages[followup.id]
          const hasDraft = !!followup.ai_draft

          return (
            <div
              key={followup.id}
              className="overflow-hidden rounded-xl"
              style={{ border: '1px solid #152238', borderLeftWidth: '4px', borderLeftColor: urgencyBorderColor(followup.urgency), background: '#0C1929' }}
            >
              <div className="p-5">
                {/* Top Row: Investor info + urgency */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    {investor && (
                      <OutreachAvatar
                        initials={investor.avatar_initials}
                        color={investor.avatar_color}
                        size="md"
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold" style={{ color: '#E8F0F8' }}>
                          {investor?.name || 'Unknown Investor'}
                        </span>
                        {investor?.firm_name && (
                          <span className="text-sm" style={{ color: '#4A6578' }}>at {investor.firm_name}</span>
                        )}
                      </div>

                      {/* Original email subject */}
                      {followup.original_email?.subject && (
                        <div className="mt-1 flex items-center gap-1.5 text-sm" style={{ color: '#4A6578' }}>
                          <Mail className="h-3.5 w-3.5 shrink-0" style={{ color: '#2D4455' }} />
                          <span className="truncate">Re: {followup.original_email.subject}</span>
                        </div>
                      )}

                      {/* Due date */}
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs" style={{ color: '#2D4455' }}>
                        <Calendar className="h-3 w-3 shrink-0" />
                        <span>{formatDueDate(followup.due_date)}</span>
                      </div>
                    </div>
                  </div>

                  <Badge variant={urgencyBadgeVariant(followup.urgency)}>
                    {followup.urgency.charAt(0).toUpperCase() + followup.urgency.slice(1)} Priority
                  </Badge>
                </div>

                {/* Status message */}
                {msg && (
                  <div
                    className={`mt-3 rounded-lg px-3 py-2 text-xs ${
                      msg.type === 'success'
                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border border-red-500/30 bg-red-500/10 text-red-400'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}

                {/* AI Draft display */}
                {hasDraft && (
                  <div className="mt-4 rounded-lg p-4" style={{ border: '1px solid #0F1E2A', background: '#07111E' }}>
                    {followup.ai_draft_subject && (
                      <p className="mb-2 text-xs font-medium" style={{ color: '#4A6578' }}>
                        Subject: <span style={{ color: '#E8F0F8' }}>{followup.ai_draft_subject}</span>
                      </p>
                    )}
                    <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#4A6578' }}>
                      {followup.ai_draft}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {!hasDraft ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleGenerateDraft(followup)}
                      loading={isGenerating}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <span className="flex items-center gap-2">
                          <HunterLoadingDots /> Generating...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5" />
                          Generate AI Draft
                        </span>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSendFollowup(followup)}
                        loading={isSending}
                        disabled={isSending}
                      >
                        <span className="flex items-center gap-2">
                          <Send className="h-3.5 w-3.5" />
                          Send Follow-up
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleGenerateDraft(followup)}
                        loading={isGenerating}
                        disabled={isGenerating}
                      >
                        {isGenerating ? (
                          <span className="flex items-center gap-2">
                            <HunterLoadingDots /> Regenerating...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" />
                            Regenerate
                          </span>
                        )}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchive(followup)}
                    loading={isArchiving}
                    disabled={isArchiving}
                  >
                    <span className="flex items-center gap-2">
                      <Archive className="h-3.5 w-3.5" />
                      Archive
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
