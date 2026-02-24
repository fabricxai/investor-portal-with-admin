'use client'

import { useEffect, useState } from 'react'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Card from '@/components/ui/Card'
import { formatDistanceToNow } from 'date-fns'
import { Plus, X, Pencil, Trash2, Send, DollarSign } from 'lucide-react'

interface ActualInvestor {
  id: string
  name: string
  email: string
  invested_amount: number | null
  invested_date: string | null
  instrument: string | null
  notes: string | null
  is_password_set: boolean
  last_login: string | null
  created_at: string
  updated_at: string
}

const INSTRUMENTS = ['SAFE', 'Note', 'Equity', 'Convertible Note']

function formatCurrency(amount: number | null): string {
  if (amount === null || amount === undefined) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

export default function ActualInvestorsPage() {
  const [investors, setInvestors] = useState<ActualInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resendingId, setResendingId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    invested_amount: '',
    invested_date: '',
    instrument: '',
    notes: '',
  })

  useEffect(() => {
    fetchInvestors()
  }, [])

  async function fetchInvestors() {
    try {
      const res = await fetch('/api/actual-investors')
      const data = await res.json()
      setInvestors(Array.isArray(data) ? data : [])
    } catch {
      setError('Failed to load investors')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({ name: '', email: '', invested_amount: '', invested_date: '', instrument: '', notes: '' })
    setShowAddForm(false)
    setEditingId(null)
    setError('')
  }

  function startEdit(inv: ActualInvestor) {
    setEditingId(inv.id)
    setFormData({
      name: inv.name,
      email: inv.email,
      invested_amount: inv.invested_amount?.toString() || '',
      invested_date: inv.invested_date || '',
      instrument: inv.instrument || '',
      notes: inv.notes || '',
    })
    setShowAddForm(true)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      setError('Name and email are required')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const url = editingId ? `/api/actual-investors/${editingId}` : '/api/actual-investors'
      const method = editingId ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save investor')
        setSaving(false)
        return
      }

      setSuccess(editingId ? 'Investor updated successfully' : `Investor added! Welcome email with temporary password sent to ${formData.email}`)
      resetForm()
      await fetchInvestors()
      setTimeout(() => setSuccess(''), 5000)
    } catch {
      setError('Failed to save investor')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to remove ${name}? This cannot be undone.`)) return

    try {
      const res = await fetch(`/api/actual-investors/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        setError('Failed to delete investor')
        return
      }
      setSuccess(`${name} has been removed`)
      setInvestors(investors.filter(i => i.id !== id))
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('Failed to delete investor')
    }
  }

  async function handleResendPassword(id: string, email: string) {
    setResendingId(id)
    try {
      const res = await fetch('/api/gate/send-temp-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSuccess(`Temporary password sent to ${email}`)
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to send temporary password')
      }
    } catch {
      setError('Failed to send temporary password')
    } finally {
      setResendingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const totalInvested = investors.reduce((sum, inv) => sum + (inv.invested_amount || 0), 0)
  const inputClasses = "w-full px-3 py-2 rounded-lg border text-sm transition-all duration-200"
  const inputStyle = { borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }

  return (
    <div className="p-8">
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <p className="admin-page-label">Investor Management</p>
          <h1 className="admin-page-title">Actual Investors</h1>
          <p className="text-sm mt-1" style={{ color: '#4A6578' }}>
            {investors.length} investor{investors.length !== 1 ? 's' : ''} &middot; {formatCurrency(totalInvested)} total invested
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddForm(true) }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{ background: '#57ACAF', color: '#07111E' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3D8A8D' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#57ACAF' }}
        >
          <Plus className="h-4 w-4" />
          Add Investor
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg border text-sm" style={{ background: '#10B98112', borderColor: '#10B98130', color: '#10B981' }}>
          {success}
        </div>
      )}
      {error && !showAddForm && (
        <div className="mb-4 px-4 py-3 rounded-lg border text-sm" style={{ background: '#EF444412', borderColor: '#EF444430', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card glow className="mb-6" accent="#57ACAF">
          <div className="flex items-center justify-between mb-4">
            <h2 className="admin-page-title" style={{ fontSize: 18 }}>
              {editingId ? 'Edit Investor' : 'Add New Investor'}
            </h2>
            <button onClick={resetForm} className="transition-colors" style={{ color: '#4A6578' }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {!editingId && (
            <p className="text-sm mb-4" style={{ color: '#4A6578' }}>
              A welcome email with a temporary password will be sent to the investor automatically.
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'name', label: 'Full Name *', type: 'text', required: true, placeholder: 'John Doe' },
                { key: 'email', label: 'Email *', type: 'email', required: true, placeholder: 'john@example.com', disabled: !!editingId },
                { key: 'invested_amount', label: 'Invested Amount (USD)', type: 'number', placeholder: '50000' },
                { key: 'invested_date', label: 'Investment Date', type: 'date' },
                { key: 'notes', label: 'Notes', type: 'text', placeholder: 'Optional notes about this investor' },
              ].map(field => (
                <div key={field.key}>
                  <label className="admin-section-label block mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    required={field.required}
                    value={(formData as any)[field.key]}
                    onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                    className={inputClasses} style={inputStyle}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                </div>
              ))}
              <div>
                <label className="admin-section-label block mb-1.5">Instrument</label>
                <select
                  value={formData.instrument}
                  onChange={e => setFormData({ ...formData, instrument: e.target.value })}
                  className={inputClasses} style={inputStyle}
                >
                  <option value="">Select instrument</option>
                  {INSTRUMENTS.map(ins => (<option key={ins} value={ins}>{ins}</option>))}
                </select>
              </div>
            </div>

            {error && showAddForm && (
              <div className="px-3 py-2 rounded-lg border text-sm" style={{ background: '#EF444412', borderColor: '#EF444430', color: '#EF4444' }}>{error}</div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                style={{ background: '#57ACAF', color: '#07111E' }}
              >
                {saving ? <LoadingSpinner size="sm" /> : editingId ? 'Save Changes' : <><Plus className="h-4 w-4" />Add & Send Welcome Email</>}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-lg border text-sm transition-colors" style={{ borderColor: '#152238', color: '#4A6578' }}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Invested', value: formatCurrency(totalInvested), icon: <DollarSign className="h-5 w-5" style={{ color: '#57ACAF' }} />, color: '#57ACAF' },
          { label: 'Active Accounts', value: `${investors.filter(i => i.is_password_set).length} / ${investors.length}`, icon: <span className="text-sm font-bold" style={{ color: '#10B981' }}>{investors.filter(i => i.is_password_set).length}</span>, color: '#10B981' },
          { label: 'Pending Setup', value: `${investors.filter(i => !i.is_password_set).length}`, icon: <span className="text-sm font-bold" style={{ color: '#EAB308' }}>{investors.filter(i => !i.is_password_set).length}</span>, color: '#EAB308' },
        ].map(stat => (
          <Card glow key={stat.label} accent={stat.color}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${stat.color}12`, border: `1px solid ${stat.color}25` }}>
                {stat.icon}
              </div>
              <div>
                <p className="admin-section-label" style={{ fontSize: 9 }}>{stat.label}</p>
                <p className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)', color: '#E8F0F8' }}>{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Investor Table */}
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#152238', background: '#0C1929' }}>
        <table className="w-full admin-table">
          <thead>
            <tr style={{ borderBottom: '1px solid #152238', background: '#0A1525' }}>
              <th className="text-left px-4 py-3 admin-section-label">Investor</th>
              <th className="text-left px-4 py-3 admin-section-label">Amount</th>
              <th className="text-left px-4 py-3 admin-section-label">Instrument</th>
              <th className="text-left px-4 py-3 admin-section-label">Date</th>
              <th className="text-left px-4 py-3 admin-section-label">Status</th>
              <th className="text-left px-4 py-3 admin-section-label">Last Login</th>
              <th className="text-right px-4 py-3 admin-section-label">Actions</th>
            </tr>
          </thead>
          <tbody>
            {investors.map((inv) => (
              <tr
                key={inv.id}
                className="transition-colors"
                style={{ borderBottom: '1px solid #0F1E2A' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(87,172,175,0.04)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <td className="px-4 py-3">
                  <p className="text-sm font-medium" style={{ color: '#C8D8E4' }}>{inv.name}</p>
                  <p className="text-xs" style={{ color: '#4A6578' }}>{inv.email}</p>
                </td>
                <td className="px-4 py-3 text-sm font-medium" style={{ color: '#C8D8E4' }}>
                  {formatCurrency(inv.invested_amount)}
                </td>
                <td className="px-4 py-3">
                  {inv.instrument ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: '#57ACAF12', color: '#57ACAF', border: '1px solid #57ACAF30' }}>
                      {inv.instrument}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: '#3A5060' }}>—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: '#3A5060' }}>{inv.invested_date || '—'}</td>
                <td className="px-4 py-3">
                  {inv.is_password_set ? (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: '#10B98112', color: '#10B981', border: '1px solid #10B98130' }}>Active</span>
                  ) : (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: '#EAB30812', color: '#EAB308', border: '1px solid #EAB30830' }}>Pending Setup</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs font-mono" style={{ color: '#3A5060' }}>
                  {inv.last_login ? formatDistanceToNow(new Date(inv.last_login), { addSuffix: true }) : 'Never'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => startEdit(inv)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#4A6578' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C8D8E4'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#4A6578'; e.currentTarget.style.background = 'transparent' }} title="Edit">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {!inv.is_password_set && (
                      <button onClick={() => handleResendPassword(inv.id, inv.email)} disabled={resendingId === inv.id}
                        className="p-1.5 rounded-lg transition-colors disabled:opacity-50" style={{ color: '#4A6578' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#57ACAF'; e.currentTarget.style.background = 'rgba(87,172,175,0.08)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#4A6578'; e.currentTarget.style.background = 'transparent' }} title="Resend temporary password">
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(inv.id, inv.name)} className="p-1.5 rounded-lg transition-colors" style={{ color: '#4A6578' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.08)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#4A6578'; e.currentTarget.style.background = 'transparent' }} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {investors.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#4A6578' }}>
                  No actual investors yet. Click &quot;Add Investor&quot; to add your first investor.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
