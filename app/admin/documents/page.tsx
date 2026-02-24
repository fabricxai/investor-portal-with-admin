'use client'

import { useEffect, useState, useCallback } from 'react'
import Card from '@/components/ui/Card'
import RagStatusBadge from '@/components/admin/RagStatusBadge'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { Upload, Trash2, RefreshCw, FileText } from 'lucide-react'

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const fetchDocs = useCallback(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { fetchDocs() }, [fetchDocs])

  async function handleUpload(files: FileList) {
    setUploading(true)
    for (const file of Array.from(files)) {
      const formData = new FormData()
      formData.append('file', file)

      const ext = file.name.split('.').pop()?.toLowerCase()
      let docType = 'other'
      if (ext === 'pdf') docType = 'pitch_deck'
      else if (ext === 'xlsx' || ext === 'xls') docType = 'financials'
      else if (ext === 'pptx') docType = 'pitch_deck'
      formData.append('doc_type', docType)

      try {
        await fetch('/api/documents/upload', { method: 'POST', body: formData })
      } catch (err) {
        console.error('Upload error:', err)
      }
    }
    setUploading(false)
    fetchDocs()
  }

  async function handleDelete(docId: string) {
    if (!confirm('Delete this document? This cannot be undone.')) return
    await fetch(`/api/documents/${docId}`, { method: 'DELETE' })
    fetchDocs()
  }

  async function handleReindex(docId: string) {
    await fetch(`/api/documents/${docId}/reindex`, { method: 'POST' })
    fetchDocs()
  }

  async function handleTierChange(docId: string, field: string, value: number) {
    await fetch(`/api/documents/${docId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
    fetchDocs()
  }

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
      <div style={{ marginBottom: 28 }}>
        <div className="admin-page-label">Knowledge Base</div>
        <div className="admin-page-title">Documents</div>
      </div>

      {/* Upload zone */}
      <div
        className="mb-6 rounded-xl border-2 border-dashed p-8 text-center transition-all duration-200"
        style={{
          borderColor: dragOver ? '#57ACAF' : '#152238',
          background: dragOver ? 'rgba(87,172,175,0.04)' : 'transparent',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files)
        }}
      >
        <Upload className="h-8 w-8 mx-auto mb-3" style={{ color: '#4A6578' }} />
        <p className="text-sm mb-3" style={{ color: '#4A6578' }}>
          Drag & drop files here, or{' '}
          <label className="cursor-pointer font-medium transition-colors" style={{ color: '#57ACAF' }}>
            browse
            <input
              type="file"
              multiple
              className="hidden"
              accept=".pdf,.docx,.xlsx,.pptx,.txt,.md"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
          </label>
        </p>
        <p className="text-xs font-mono" style={{ color: '#2D4455' }}>PDF, DOCX, XLSX, PPTX, TXT, MD</p>
        {uploading && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm" style={{ color: '#4A6578' }}>Uploading & indexing...</span>
          </div>
        )}
      </div>

      {/* Documents table */}
      {documents.length > 0 ? (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: '#152238', background: '#0C1929' }}>
          <table className="w-full admin-table">
            <thead>
              <tr style={{ background: '#0A1525', borderBottom: '1px solid #152238' }}>
                <th className="text-left px-4 py-3 admin-section-label">Document</th>
                <th className="text-left px-4 py-3 admin-section-label">RAG Status</th>
                <th className="text-left px-4 py-3 admin-section-label">View Tier</th>
                <th className="text-left px-4 py-3 admin-section-label">Download Tier</th>
                <th className="text-left px-4 py-3 admin-section-label">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr
                  key={doc.id}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid #0F1E2A' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(87,172,175,0.04)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0" style={{ color: '#57ACAF' }} />
                      <div>
                        <p className="text-sm font-medium" style={{ color: '#C8D8E4' }}>{doc.name}</p>
                        {doc.file_size && (
                          <p className="text-xs font-mono" style={{ color: '#3A5060' }}>
                            {(doc.file_size / 1024).toFixed(0)} KB
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RagStatusBadge isInRag={doc.is_in_rag} chunkCount={doc.rag_chunk_count} />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={doc.min_tier_to_view}
                      onChange={(e) => handleTierChange(doc.id, 'min_tier_to_view', Number(e.target.value))}
                      className="text-xs rounded border px-2 py-1 transition-colors"
                      style={{ borderColor: '#152238', background: '#0A1525', color: '#C8D8E4' }}
                    >
                      <option value={1}>Tier 1</option>
                      <option value={2}>Tier 2</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={doc.min_tier_to_download}
                      onChange={(e) => handleTierChange(doc.id, 'min_tier_to_download', Number(e.target.value))}
                      className="text-xs rounded border px-2 py-1 transition-colors"
                      style={{ borderColor: '#152238', background: '#0A1525', color: '#C8D8E4' }}
                    >
                      <option value={1}>Tier 1</option>
                      <option value={2}>Tier 2</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReindex(doc.id)}
                        className="transition-colors"
                        style={{ color: '#4A6578' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#57ACAF')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#4A6578')}
                        title="Re-index"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="transition-colors"
                        style={{ color: '#4A6578' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#4A6578')}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Card glow>
          <div className="text-center py-8">
            <FileText className="h-10 w-10 mx-auto mb-3" style={{ color: '#2D4455' }} />
            <p className="text-sm" style={{ color: '#4A6578' }}>
              No documents yet. Upload files above to build the RAG knowledge base.
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
