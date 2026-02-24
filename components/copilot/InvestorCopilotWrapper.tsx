'use client'

import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'
import CopilotPanel from './CopilotPanel'

interface InvestorCopilotWrapperProps {
  token: string
  tier: number
}

export default function InvestorCopilotWrapper({ token, tier }: InvestorCopilotWrapperProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-aqua text-white px-5 py-3 shadow-lg hover:bg-aqua-dark transition-all hover:shadow-xl"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="text-sm font-medium">Ask fabricXai</span>
        </button>
      )}

      {/* Slide-in panel */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[380px] h-[600px] sm:bottom-6 sm:right-6 sm:rounded-2xl bg-white border border-border shadow-2xl flex flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-navy text-white">
            <div>
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                <img src="https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png" alt="fabricXai" style={{ height: 16, marginRight: 6, display: 'inline-block', verticalAlign: 'middle' }} />
                Copilot
              </h3>
              <p className="text-xs text-white/60">Ask anything about our company</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Chat panel */}
          <CopilotPanel
            endpoint="/api/copilot/investor"
            extraBody={{ token }}
            placeholder="Ask about fabricXai..."
            welcomeMessage={
              tier === 2
                ? "Hi! I have full access to fabricXai's knowledge base. Ask me anything about the company, metrics, strategy, or team."
                : "Hi! I can answer questions about fabricXai's product, market, team, and strategy. For detailed financial data, you can request full access."
            }
          />
        </div>
      )}
    </>
  )
}
