'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/metrics?tier=2')
      .then(res => res.json())
      .then(data => {
        setMetrics(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)

    try {
      const res = await fetch('/api/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mrr: Number(metrics.mrr) || 0,
          arr: Number(metrics.arr) || 0,
          factories_live: Number(metrics.factories_live) || 0,
          factories_pipeline: Number(metrics.factories_pipeline) || 0,
          mom_growth_rate: metrics.mom_growth_rate ? Number(metrics.mom_growth_rate) : null,
          runway_months: metrics.runway_months ? Number(metrics.runway_months) : null,
          burn_rate: metrics.burn_rate ? Number(metrics.burn_rate) : null,
          cash_balance: metrics.cash_balance ? Number(metrics.cash_balance) : null,
          agents_deployed: Number(metrics.agents_deployed) || 0,
          total_agents_built: Number(metrics.total_agents_built) || 0,
          raise_target: Number(metrics.raise_target) || 750000,
          raise_committed: Number(metrics.raise_committed) || 0,
          round_stage: metrics.round_stage || 'Seed',
          notes: metrics.notes || null,
          updated_by: 'admin',
        }),
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (err) {
      console.error(err)
    }
    setSaving(false)
  }

  function updateField(field: string, value: string) {
    setMetrics((prev: any) => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const fields = [
    { key: 'mrr', label: 'MRR ($)', type: 'number' },
    { key: 'arr', label: 'ARR ($)', type: 'number' },
    { key: 'factories_live', label: 'Factories Live', type: 'number' },
    { key: 'factories_pipeline', label: 'Factories Pipeline', type: 'number' },
    { key: 'agents_deployed', label: 'Agents Deployed', type: 'number' },
    { key: 'total_agents_built', label: 'Total Agents Built', type: 'number' },
    { key: 'mom_growth_rate', label: 'MoM Growth Rate (%)', type: 'number' },
    { key: 'runway_months', label: 'Runway (months)', type: 'number' },
    { key: 'burn_rate', label: 'Burn Rate ($)', type: 'number' },
    { key: 'cash_balance', label: 'Cash Balance ($)', type: 'number' },
    { key: 'raise_target', label: 'Raise Target ($)', type: 'number' },
    { key: 'raise_committed', label: 'Raise Committed ($)', type: 'number' },
    { key: 'round_stage', label: 'Round Stage', type: 'text' },
  ]

  return (
    <div className="p-8 max-w-3xl">
      {/* Page header */}
      <div className="mb-6">
        <p className="admin-page-label">Company Data</p>
        <h1 className="admin-page-title">Company Metrics</h1>
      </div>

      <Card glow accent="#57ACAF">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map((field) => (
              <div key={field.key}>
                <label className="admin-section-label block mb-1.5">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  value={metrics?.[field.key] ?? ''}
                  onChange={(e) => updateField(field.key, e.target.value)}
                  step={field.key === 'mom_growth_rate' ? '0.01' : '1'}
                  className="w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200"
                  style={{ borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }}
                  onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1), 0 0 12px rgba(87,172,175,0.08)' }}
                  onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
                />
              </div>
            ))}
          </div>

          <div>
            <label className="admin-section-label block mb-1.5">Notes</label>
            <textarea
              rows={3}
              value={metrics?.notes || ''}
              onChange={(e) => updateField('notes', e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 resize-none"
              style={{ borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }}
              onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1), 0 0 12px rgba(87,172,175,0.08)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button type="submit" loading={saving}>
              Save Metrics
            </Button>
            {saved && (
              <span className="text-sm font-medium" style={{ color: '#10B981' }}>Saved successfully!</span>
            )}
          </div>
        </form>
      </Card>
    </div>
  )
}
