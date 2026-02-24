'use client'

import { FileText, Lock, Download, Presentation, Table, FileSpreadsheet } from 'lucide-react'

interface DocumentListProps {
  tier: 0 | 1 | 2
  documents: any[]
}

function getDocIcon(docType: string | null) {
  switch (docType) {
    case 'pitch_deck': return Presentation
    case 'financials': return FileSpreadsheet
    case 'cap_table': return Table
    default: return FileText
  }
}

export default function DocumentList({ tier, documents }: DocumentListProps) {
  if (tier === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-center">
        <Lock className="h-8 w-8 text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">
          {documents.length > 0 ? `${documents.length} documents available` : 'Documents available'} — request access to view
        </p>
      </div>
    )
  }

  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-6 text-center">
        <p className="text-sm text-muted">No documents available yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-white divide-y divide-border">
      {documents.map((doc: any) => {
        const Icon = getDocIcon(doc.doc_type)
        const canDownload = tier >= doc.min_tier_to_download

        return (
          <div key={doc.id} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-aqua" />
              <div>
                <p className="text-sm font-medium text-foreground">{doc.name}</p>
                {doc.description && (
                  <p className="text-xs text-muted mt-0.5">{doc.description}</p>
                )}
              </div>
            </div>

            {canDownload ? (
              <a
                href={doc.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-medium text-aqua hover:text-aqua-dark transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
            ) : (
              <span className="flex items-center gap-1 text-xs text-muted">
                <Lock className="h-3.5 w-3.5" />
                Locked
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
