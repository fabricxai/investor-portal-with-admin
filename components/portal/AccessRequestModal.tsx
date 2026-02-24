'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import Button from '@/components/ui/Button'

interface AccessRequestModalProps {
  isOpen: boolean
  onClose: () => void
  isInline?: boolean
}

export default function AccessRequestModal({ isOpen, onClose, isInline = false }: AccessRequestModalProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    firm_name: '',
    investor_type: '',
    check_size: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/access-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to submit request')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formContent = submitted ? (
    <div className="text-center py-8">
      <div className="w-16 h-16 bg-aqua/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-aqua" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-navy mb-2" style={{ fontFamily: 'var(--font-heading)' }}>
        Request Received
      </h3>
      <p className="text-sm text-muted max-w-sm mx-auto">
        We&apos;re reviewing your profile and will be in touch shortly. Most requests are processed within a few minutes.
      </p>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">First Name *</label>
          <input
            type="text"
            required
            value={formData.first_name}
            onChange={(e) => setFormData(d => ({ ...d, first_name: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Last Name *</label>
          <input
            type="text"
            required
            value={formData.last_name}
            onChange={(e) => setFormData(d => ({ ...d, last_name: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground mb-1">Email *</label>
        <input
          type="email"
          required
          value={formData.email}
          onChange={(e) => setFormData(d => ({ ...d, email: e.target.value }))}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground mb-1">Firm Name <span className="text-muted">(optional)</span></label>
        <input
          type="text"
          value={formData.firm_name}
          onChange={(e) => setFormData(d => ({ ...d, firm_name: e.target.value }))}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Investor Type</label>
          <select
            value={formData.investor_type}
            onChange={(e) => setFormData(d => ({ ...d, investor_type: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua bg-white"
          >
            <option value="">Select...</option>
            <option value="angel">Angel</option>
            <option value="vc">VC Fund</option>
            <option value="family_office">Family Office</option>
            <option value="strategic">Strategic</option>
            <option value="individual">Individual</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-foreground mb-1">Typical Check Size</label>
          <select
            value={formData.check_size}
            onChange={(e) => setFormData(d => ({ ...d, check_size: e.target.value }))}
            className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua bg-white"
          >
            <option value="">Select...</option>
            <option value="<$50K">{'<$50K'}</option>
            <option value="$50K–$100K">$50K–$100K</option>
            <option value="$100K–$250K">$100K–$250K</option>
            <option value="$250K–$500K">$250K–$500K</option>
            <option value="$500K–$1M">$500K–$1M</option>
            <option value=">$1M">{'>$1M'}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground mb-1">
          What draws you to fabricXai? <span className="text-muted">(optional)</span>
        </label>
        <textarea
          rows={3}
          value={formData.message}
          onChange={(e) => setFormData(d => ({ ...d, message: e.target.value }))}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-aqua/50 focus:border-aqua resize-none"
        />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Request Access
      </Button>
    </form>
  )

  if (isInline) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <h3 className="text-lg font-semibold text-navy mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Request Investor Access
        </h3>
        <p className="text-sm text-muted mb-5">
          We share our numbers with serious investors. Fill out the form below — we review most requests within minutes.
        </p>
        {formContent}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="text-lg font-semibold text-navy mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          Request Full Access
        </h3>
        <p className="text-sm text-muted mb-5">
          Get complete access to financials, documents, and our AI copilot.
        </p>

        {formContent}
      </div>
    </div>
  )
}
