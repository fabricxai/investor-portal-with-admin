'use client'

import { useEffect, useState } from 'react'
import CopilotPanel from '@/components/copilot/CopilotPanel'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { FileText, Check, X } from 'lucide-react'

export default function AdminCopilotPage() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        setDocuments(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const indexedDocs = documents.filter(d => d.is_in_rag)
  const welcomeMessage = indexedDocs.length > 0
    ? `How can I help? I have access to ${indexedDocs.length} document${indexedDocs.length > 1 ? 's' : ''}: ${indexedDocs.map(d => d.name).join(', ')}.`
    : 'How can I help? No documents have been indexed yet — upload files in the Documents section to build the knowledge base.'

  return (
    <div className="flex h-[calc(100vh-0px)]">
      {/* Knowledge Base sidebar */}
      <div className="w-64 border-r p-4 overflow-y-auto" style={{ borderColor: '#0F1E2A', background: '#060E1A' }}>
        <div className="admin-section-label" style={{ marginBottom: 12 }}>
          Knowledge Base
        </div>
        {loading ? (
          <LoadingSpinner size="sm" />
        ) : documents.length === 0 ? (
          <p className="text-xs" style={{ color: '#4A6578' }}>No documents uploaded yet.</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc: any) => (
              <div key={doc.id} className="flex items-center gap-2 text-sm">
                <FileText className="h-3.5 w-3.5 shrink-0" style={{ color: '#57ACAF' }} />
                <span className="truncate text-xs" style={{ color: '#C8D8E4' }}>{doc.name}</span>
                {doc.is_in_rag ? (
                  <Check className="h-3 w-3 shrink-0 ml-auto" style={{ color: '#10B981' }} />
                ) : (
                  <X className="h-3 w-3 shrink-0 ml-auto" style={{ color: '#4A6578' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        <div className="border-b px-6 py-4" style={{ borderColor: '#0F1E2A', background: '#0C1929' }}>
          <div className="admin-page-label" style={{ marginBottom: 4 }}>AI Assistant</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#E8F0F8', fontFamily: 'var(--font-heading)' }}>
            Admin Copilot
          </div>
          <p className="text-xs mt-0.5" style={{ color: '#4A6578' }}>
            Ask questions about your documents, draft investor communications, and more.
          </p>
        </div>

        <div className="flex-1">
          <CopilotPanel
            endpoint="/api/copilot/admin"
            placeholder="Ask about your documents, draft updates, generate one-pagers..."
            welcomeMessage={welcomeMessage}
          />
        </div>
      </div>
    </div>
  )
}
