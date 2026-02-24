'use client'

import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import AccessRequestModal from './AccessRequestModal'
import Badge from '@/components/ui/Badge'

interface TierUpgradeBannerProps {
  tier: 0 | 1 | 2
}

export default function TierUpgradeBanner({ tier }: TierUpgradeBannerProps) {
  const [showModal, setShowModal] = useState(false)

  if (tier === 2) {
    return (
      <Badge variant="tier2">Full Access</Badge>
    )
  }

  if (tier === 1) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1 text-sm font-medium text-aqua hover:text-aqua-dark transition-colors"
        >
          Request Full Access
          <ArrowUpRight className="h-4 w-4" />
        </button>
        <AccessRequestModal isOpen={showModal} onClose={() => setShowModal(false)} />
      </>
    )
  }

  return null
}
