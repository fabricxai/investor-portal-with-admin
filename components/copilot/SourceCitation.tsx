import { FileText } from 'lucide-react'

interface SourceCitationProps {
  sources: { name: string; section?: string }[]
}

export default function SourceCitation({ sources }: SourceCitationProps) {
  if (!sources || sources.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sources.map((source, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 rounded-md bg-aqua/5 border border-aqua/20 px-2 py-0.5 text-xs text-aqua-dark"
        >
          <FileText className="h-3 w-3" />
          {source.name}
          {source.section && ` · ${source.section}`}
        </span>
      ))}
    </div>
  )
}
