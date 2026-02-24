'use client'

import { useEffect, useState } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Plus, Edit2, Trash2, Eye, EyeOff, Send } from 'lucide-react'

interface InvestorUpdate {
  id: string
  title: string
  content: string
  category: string
  published: boolean
  created_at: string
}

const CATEGORIES = [
  { value: 'milestone', label: 'Milestone', color: '#10B981' },
  { value: 'financial', label: 'Financial', color: '#EAB308' },
  { value: 'product', label: 'Product', color: '#57ACAF' },
  { value: 'team', label: 'Team', color: '#8B5CF6' },
  { value: 'general', label: 'General', color: '#4A6578' },
]

export default function InvestorUpdatesPage() {
  const [updates, setUpdates] = useState<InvestorUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<InvestorUpdate | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'general',
  })

  useEffect(() => {
    fetchUpdates()
  }, [])

  async function fetchUpdates() {
    try {
      const res = await fetch('/api/investor-updates')
      const data = await res.json()
      setUpdates(Array.isArray(data) ? data : [])
    } catch { /* silent */ }
    setLoading(false)
  }

  function startEdit(update: InvestorUpdate) {
    setEditing(update)
    setForm({ title: update.title, content: update.content, category: update.category })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  function startNew() {
    setEditing(null)
    setForm({ title: '', content: '', category: 'general' })
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const url = editing ? `/api/investor-updates/${editing.id}` : '/api/investor-updates'
      const method = editing ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to save')
        setSaving(false)
        return
      }

      setSuccess(editing ? 'Update saved!' : 'Update published!')
      setShowForm(false)
      setEditing(null)
      setForm({ title: '', content: '', category: 'general' })
      fetchUpdates()
    } catch {
      setError('Something went wrong')
    }
    setSaving(false)
  }

  async function togglePublished(update: InvestorUpdate) {
    try {
      await fetch(`/api/investor-updates/${update.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !update.published }),
      })
      fetchUpdates()
    } catch { /* silent */ }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this update?')) return
    try {
      await fetch(`/api/investor-updates/${id}`, { method: 'DELETE' })
      fetchUpdates()
    } catch { /* silent */ }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const categoryColor = (cat: string) => CATEGORIES.find(c => c.value === cat)?.color || '#4A6578'

  const inputClasses = "w-full px-3 py-2 rounded-lg border text-sm transition-all duration-200"
  const inputStyle = { borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }

  return (
    <div className="p-8 max-w-4xl">
      {/* Page header */}
      <div className="flex items-end justify-between" style={{ marginBottom: 28 }}>
        <div>
          <div className="admin-page-label">Communications</div>
          <div className="admin-page-title">Investor Updates</div>
        </div>
        <Button variant="primary" size="sm" onClick={startNew}>
          <Plus className="h-4 w-4 mr-1.5" />
          New Update
        </Button>
      </div>

      {success && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#10B98112', border: '1px solid #10B98130', color: '#10B981' }}>
          {success}
        </div>
      )}
      {error && !showForm && (
        <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: '#EF444412', border: '1px solid #EF444430', color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <Card glow className="mb-6">
          <div className="admin-section-label" style={{ marginBottom: 16 }}>
            {editing ? 'Edit Update' : 'New Investor Update'}
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="admin-section-label block mb-1.5">Title</label>
              <input
                type="text" required value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className={inputClasses} style={inputStyle}
                placeholder="e.g., February 2026 — POC Milestone Update"
                onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            <div>
              <label className="admin-section-label block mb-1.5">Category</label>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className={inputClasses} style={inputStyle}>
                {CATEGORIES.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
              </select>
            </div>
            <div>
              <label className="admin-section-label block mb-1.5">Content</label>
              <textarea
                required rows={8} value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                className={inputClasses + ' resize-y'} style={inputStyle}
                placeholder="Write the update content here..."
                onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1)' }}
                onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
              />
            </div>
            {error && showForm && (
              <div className="px-3 py-2 rounded-lg text-sm" style={{ background: '#EF444412', border: '1px solid #EF444430', color: '#EF4444' }}>{error}</div>
            )}
            <div className="flex items-center gap-3">
              <Button variant="primary" size="sm" type="submit" loading={saving}>
                <Send className="h-3.5 w-3.5 mr-1.5" />
                {editing ? 'Save Changes' : 'Publish Update'}
              </Button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); setError('') }} className="text-sm transition-colors" style={{ color: '#4A6578' }}>
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* Updates list */}
      {updates.length === 0 ? (
        <Card glow>
          <div className="text-center py-12">
            <div className="text-4xl mb-3 opacity-40">📨</div>
            <h3 className="text-lg font-semibold mb-2" style={{ color: '#C8D8E4' }}>No updates yet</h3>
            <p className="text-sm" style={{ color: '#4A6578' }}>
              Publish your first investor update — it will appear on all actual investor dashboards.
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {updates.map(update => (
            <Card glow key={update.id}>
              <div className="flex items-start justify-between">
                <div className="flex-1 mr-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase font-mono" style={{ letterSpacing: 2, color: categoryColor(update.category) }}>
                      {update.category}
                    </span>
                    <span className="text-xs font-mono" style={{ color: '#3A5060' }}>
                      {new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    {!update.published && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: '#EAB30812', color: '#EAB308', border: '1px solid #EAB30830' }}>Draft</span>
                    )}
                  </div>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: '#C8D8E4' }}>{update.title}</h3>
                  <p className="text-xs line-clamp-2" style={{ color: '#4A6578' }}>{update.content}</p>
                </div>
                <div className="flex items-center gap-1">
                  {[
                    { onClick: () => togglePublished(update), icon: update.published ? Eye : EyeOff, title: update.published ? 'Unpublish' : 'Publish' },
                    { onClick: () => startEdit(update), icon: Edit2, title: 'Edit' },
                    { onClick: () => handleDelete(update.id), icon: Trash2, title: 'Delete' },
                  ].map(({ onClick, icon: Icon, title }) => (
                    <button key={title} onClick={onClick} className="p-2 rounded-lg transition-colors" style={{ color: '#4A6578' }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#C8D8E4'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#4A6578'; e.currentTarget.style.background = 'transparent' }} title={title}>
                      <Icon className="h-4 w-4" />
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
