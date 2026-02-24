'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import OutreachAvatar from '@/components/outreach/OutreachAvatar'
import OutreachFitBadge from '@/components/outreach/OutreachFitBadge'
import { OUTREACH_STAGES, STAGE_COLORS } from '@/lib/outreach-email'
import type { OutreachInvestor, OutreachPipelineStatus } from '@/lib/types'
import { AlertCircle, ArrowRight, ChevronRight } from 'lucide-react'

export default function OutreachPipeline() {
  const [investors, setInvestors] = useState<OutreachInvestor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [advancingId, setAdvancingId] = useState<string | null>(null)

  const fetchInvestors = useCallback(async () => {
    try {
      const res = await fetch('/api/outreach/investors')
      if (!res.ok) throw new Error('Failed to fetch investors')
      const data: OutreachInvestor[] = await res.json()
      setInvestors(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchInvestors()
  }, [fetchInvestors])

  const grouped = useMemo(() => {
    const map: Record<OutreachPipelineStatus, OutreachInvestor[]> = {
      Identified: [],
      Contacted: [],
      Replied: [],
      Meeting: [],
      DD: [],
      Committed: [],
    }
    for (const inv of investors) {
      if (map[inv.pipeline_status]) {
        map[inv.pipeline_status].push(inv)
      }
    }
    return map
  }, [investors])

  const handleAdvance = async (investorId: string) => {
    setAdvancingId(investorId)
    try {
      const res = await fetch(`/api/outreach/investors/${investorId}/advance`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to advance')
      }
      // Refresh the list
      await fetchInvestors()
    } catch (err) {
      console.error('Advance failed:', err)
    } finally {
      setAdvancingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400 mb-3" />
          <p style={{ color: '#4A6578' }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <p className="admin-page-label">Outreach</p>
        <h1 className="admin-page-title">Pipeline</h1>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-2 px-2">
        {OUTREACH_STAGES.map((stage) => {
          const stageInvestors = grouped[stage]
          const stageColor = STAGE_COLORS[stage]
          const isLastStage = stage === 'Committed'

          return (
            <div
              key={stage}
              className="flex flex-col min-w-[280px] w-[280px] shrink-0"
            >
              {/* Column Header */}
              <div
                className="flex items-center gap-2 mb-3 rounded-lg px-3 py-2.5"
                style={{
                  background: `${stageColor}15`,
                  border: `1px solid ${stageColor}40`,
                }}
              >
                <div
                  className="h-2.5 w-2.5 rounded-sm shrink-0"
                  style={{ backgroundColor: stageColor }}
                />
                <h3
                  className="text-sm font-semibold truncate"
                  style={{ color: stageColor, fontFamily: 'var(--font-heading)' }}
                >
                  {stage}
                </h3>
                <span
                  className="ml-auto text-xs font-bold rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: `${stageColor}12`,
                    color: stageColor,
                  }}
                >
                  {stageInvestors.length}
                </span>
              </div>

              {/* Column Body */}
              <div
                className="flex-1 space-y-3 rounded-xl p-3 overflow-y-auto"
                style={{ maxHeight: 'calc(100vh - 240px)', border: '1px solid #0F1E2A', background: '#07111E' }}
              >
                {stageInvestors.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-xs" style={{ color: '#2D4455' }}>No investors</p>
                  </div>
                ) : (
                  stageInvestors.map((inv) => (
                    <Card key={inv.id} className="!p-4" glow>
                      <div className="flex items-start gap-2.5 mb-2">
                        <OutreachAvatar
                          initials={inv.avatar_initials}
                          color={inv.avatar_color}
                          size="sm"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate" style={{ color: '#E8F0F8' }}>
                            {inv.name}
                          </p>
                          <p className="text-[11px] truncate" style={{ color: '#4A6578' }}>
                            {inv.firm_name || 'Independent'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3">
                        <OutreachFitBadge score={inv.fit_score} />
                      </div>

                      {!isLastStage && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-between text-xs"
                          loading={advancingId === inv.id}
                          onClick={() => handleAdvance(inv.id)}
                        >
                          <span className="flex items-center gap-1">
                            <ArrowRight className="h-3 w-3" />
                            Advance
                          </span>
                          <ChevronRight className="h-3.5 w-3.5" style={{ color: '#2D4455' }} />
                        </Button>
                      )}

                      {isLastStage && (
                        <div className="flex items-center justify-center py-1">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#10B981]">
                            Committed
                          </span>
                        </div>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
