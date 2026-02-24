'use client'

import { useState, useCallback, useEffect } from 'react'
import EmailGate from '@/components/portal/EmailGate'
import PortalClient from '@/components/portal/PortalClient'
import ActualInvestorDashboard from '@/components/portal/ActualInvestorDashboard'

interface GateResult {
  passed: boolean
  type: 'new_visitor' | 'potential_investor' | 'actual_investor' | null
  name: string
  email: string
  token?: string
  tier?: number
  actualInvestorData?: {
    id: string
    name: string
    email: string
    invested_amount: number | null
    invested_date: string | null
    instrument: string | null
  }
}

export default function PortalShell() {
  const [gateResult, setGateResult] = useState<GateResult | null>(null)
  const [stats, setStats] = useState<{ value: string; label: string; color: string }[] | undefined>(undefined)

  // Fetch stats on mount for potential investors
  useEffect(() => {
    fetch('/api/metrics')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStats([
            { value: String(data.total_agents_built || 22), label: 'AI Agents', color: '#57ACAF' },
            { value: '$42B+', label: 'Market Size', color: '#EAB308' },
            { value: '98%', label: 'Factories Unserved', color: '#FFFFFF' },
            { value: '$3M', label: 'SAFE Cap', color: '#57ACAF' },
            { value: '$150–250K', label: 'Angel Ask', color: '#EAB308' },
            { value: 'POC Live', label: 'Dhaka · Q1 2026', color: '#10B981' },
          ])
        }
      })
      .catch(() => { /* use defaults */ })
  }, [])

  const handleGatePass = useCallback((result: GateResult) => {
    setGateResult(result)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('fabricxai_gate')
    setGateResult(null)
  }, [])

  // Not yet through the gate
  if (!gateResult) {
    return <EmailGate onGatePass={handleGatePass} />
  }

  // Actual investor → dedicated dashboard
  if (gateResult.type === 'actual_investor' && gateResult.actualInvestorData) {
    return (
      <ActualInvestorDashboard
        investor={gateResult.actualInvestorData}
        onLogout={handleLogout}
      />
    )
  }

  // Potential investor or new visitor → existing portal
  return (
    <PortalClient
      tier={0}
      stats={stats}
      investorName={gateResult.name}
      investorEmail={gateResult.email}
    />
  )
}
