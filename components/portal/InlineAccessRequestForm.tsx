'use client'

import AccessRequestModal from '@/components/portal/AccessRequestModal'

export default function InlineAccessRequestForm() {
  return <AccessRequestModal isOpen={false} onClose={() => {}} isInline />
}
