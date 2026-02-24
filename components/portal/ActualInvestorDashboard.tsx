'use client'

import { useState, useRef, useEffect } from 'react'

interface InvestorData {
  id: string
  name: string
  email: string
  invested_amount: number | null
  invested_date: string | null
  instrument: string | null
}

interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
}

interface ActualInvestorDashboardProps {
  investor: InvestorData
  onLogout: () => void
}

interface CompanyMetrics {
  mrr: number
  arr: number
  factories_live: number
  factories_pipeline: number
  agents_deployed: number
  total_agents_built: number
  runway_months: number | null
  burn_rate: number | null
  cash_balance: number | null
  raise_target: number
  raise_committed: number
  round_stage: string
  updated_at: string
}

interface InvestorUpdate {
  id: string
  title: string
  content: string
  category: string
  created_at: string
}

interface PortalDocument {
  id: string
  name: string
  description: string | null
  file_url: string
  doc_type: string
  file_size: number | null
  min_tier_to_view: number
  min_tier_to_download: number
  created_at: string
}

export default function ActualInvestorDashboard({ investor, onLogout }: ActualInvestorDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview')

  // Copilot state
  const [chatMessages, setChatMessages] = useState<CopilotMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const chatSessionId = useRef(`actual-${investor.id}-${Date.now()}`)

  // Live data state
  const [metrics, setMetrics] = useState<CompanyMetrics | null>(null)
  const [updates, setUpdates] = useState<InvestorUpdate[]>([])
  const [documents, setDocuments] = useState<PortalDocument[]>([])
  const [metricsLoading, setMetricsLoading] = useState(true)

  // Fetch live data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const [metricsRes, updatesRes, docsRes] = await Promise.all([
          fetch('/api/metrics').then(r => r.json()).catch(() => null),
          fetch('/api/investor-updates').then(r => r.json()).catch(() => []),
          fetch('/api/documents').then(r => r.json()).catch(() => []),
        ])
        if (metricsRes && !metricsRes.error) setMetrics(metricsRes)
        if (Array.isArray(updatesRes)) setUpdates(updatesRes)
        if (Array.isArray(docsRes)) setDocuments(docsRes)
      } catch { /* silent */ }
      setMetricsLoading(false)
    }
    fetchData()
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function handleChatSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return

    const userMessage = chatInput.trim()
    setChatInput('')
    const newMessages: CopilotMessage[] = [...chatMessages, { role: 'user', content: userMessage }]
    setChatMessages(newMessages)
    setChatLoading(true)

    try {
      const res = await fetch('/api/copilot/investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          sessionId: chatSessionId.current,
          actualInvestorEmail: investor.email,
        }),
      })

      const data = await res.json()

      if (data.content) {
        setChatMessages([...newMessages, { role: 'assistant', content: data.content }])
      } else if (data.error) {
        setChatMessages([...newMessages, { role: 'assistant', content: `Sorry, I encountered an error: ${data.error}` }])
      }
    } catch {
      setChatMessages([...newMessages, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const navItems = [
    { id: 'overview', label: 'Overview', dot: '#10B981' },
    { id: 'ask', label: 'Ask fabricXai', dot: '#57ACAF' },
    { id: 'updates', label: 'Investor Updates', dot: '#57ACAF' },
    { id: 'docs', label: 'Documents', dot: '#EAB308' },
    { id: 'cap', label: 'Cap Table', dot: '#8B5CF6' },
    { id: 'contact', label: 'Contact', dot: '#EC4899' },
  ]

  return (
    <div style={s.app}>
      {/* Header */}
      <header style={s.header}>
        <a href="https://fabricxai.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png" alt="fabricXai" style={{ height: 24 }} />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={s.badge}>INVESTOR DASHBOARD</div>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
          <span style={{ fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif", color: '#6A8899' }}>
            {investor.name}
          </span>
          <div style={{ ...s.badge, borderColor: '#10B981', color: '#10B981' }}>INVESTED</div>
          <button onClick={onLogout} style={s.logoutBtn}>Log out</button>
        </div>
      </header>

      {/* Stats strip */}
      <div style={s.statsStrip}>
        <div style={s.statItem}>
          <div style={{ ...s.statVal, color: '#10B981' }}>
            {investor.invested_amount ? `$${(investor.invested_amount / 1000).toFixed(0)}K` : '—'}
          </div>
          <div style={s.statLbl}>Invested</div>
        </div>
        <div style={s.statItem}>
          <div style={{ ...s.statVal, color: '#57ACAF' }}>{investor.instrument || 'SAFE'}</div>
          <div style={s.statLbl}>Instrument</div>
        </div>
        <div style={s.statItem}>
          <div style={{ ...s.statVal, color: '#EAB308' }}>$3M</div>
          <div style={s.statLbl}>Valuation Cap</div>
        </div>
        <div style={s.statItem}>
          <div style={{ ...s.statVal, color: '#FFFFFF' }}>20%</div>
          <div style={s.statLbl}>Discount</div>
        </div>
        <div style={s.statItem}>
          <div style={{ ...s.statVal, color: '#10B981' }}>
            {investor.invested_date
              ? new Date(investor.invested_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : '—'}
          </div>
          <div style={s.statLbl}>Invested Date</div>
        </div>
        <div style={{ ...s.statItem, marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif", color: '#10B981', fontWeight: 700 }}>
            Active Investor ✓
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={s.main}>
        {/* Sidebar */}
        <div style={s.sidebar}>
          <div style={s.sideLabel}>Navigation</div>
          {navItems.map(nav => (
            <div
              key={nav.id}
              style={navStyle(activeTab === nav.id)}
              onClick={() => setActiveTab(nav.id)}
            >
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: nav.dot, flexShrink: 0 }} />
              {nav.label}
            </div>
          ))}

          <div style={{ ...s.sideLabel, marginTop: 28 }}>Your Investment</div>
          {[
            ['Amount', investor.invested_amount ? `$${investor.invested_amount.toLocaleString()}` : '—'],
            ['Instrument', investor.instrument || 'SAFE'],
            ['Cap', '$3M'],
            ['Discount', '20%'],
            ['Date', investor.invested_date ? new Date(investor.invested_date).toLocaleDateString() : '—'],
          ].map(([k, v]) => (
            <div key={k} style={s.sideRow}>
              <span style={{ color: '#3A5060' }}>{k}</span>
              <span style={{ color: '#A8BFC8', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={s.sectionLabel}>Dashboard</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Welcome, {investor.name.split(' ')[0]}</div>
              {metrics?.updated_at && (
                <div style={{ fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: '#3A5060', marginTop: 4 }}>
                  Last updated: {new Date(metrics.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* Live KPI cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'MRR', value: metrics ? `$${(metrics.mrr || 0).toLocaleString()}` : '—', color: '#10B981' },
                { label: 'Factories Live', value: metrics ? String(metrics.factories_live || 0) : '—', color: '#57ACAF' },
                { label: 'Agents Deployed', value: metrics ? `${metrics.agents_deployed || 0} / ${metrics.total_agents_built || 22}` : '—', color: '#EAB308' },
                { label: 'Runway', value: metrics?.runway_months ? `${metrics.runway_months}mo` : '—', color: '#8B5CF6' },
              ].map((kpi, i) => (
                <div key={i} style={{
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 10,
                  padding: '16px 20px',
                  textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, marginBottom: 4 }}>
                    {metricsLoading ? '...' : kpi.value}
                  </div>
                  <div style={{
                    fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif",
                    color: '#4A6070', letterSpacing: 1, textTransform: 'uppercase' as const,
                  }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              {/* Company progress */}
              <div style={s.card}>
                <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
                  Company Progress
                </div>
                {[
                  { label: 'Stage', value: metrics?.round_stage || 'Seed', color: '#EAB308' },
                  { label: 'Factories Live', value: metrics ? String(metrics.factories_live) : '2', color: '#10B981' },
                  { label: 'Pipeline', value: metrics ? String(metrics.factories_pipeline || 0) : '—', color: '#57ACAF' },
                  { label: 'AI Agents', value: metrics ? `${metrics.agents_deployed} / ${metrics.total_agents_built} deployed` : '2 / 22', color: '#57ACAF' },
                  { label: 'Burn Rate', value: metrics?.burn_rate ? `$${(metrics.burn_rate / 1000).toFixed(0)}K/mo` : '—', color: '#EC4899' },
                  { label: 'Cash Balance', value: metrics?.cash_balance ? `$${(metrics.cash_balance / 1000).toFixed(0)}K` : '—', color: '#FFFFFF' },
                ].map((item, i) => (
                  <div key={i} style={s.progressRow}>
                    <span style={{ color: '#4A6070' }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Round status */}
              <div style={s.card}>
                <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
                  Round Status
                </div>
                {[
                  { label: 'Round', value: metrics?.round_stage || 'Angel / Pre-Seed', color: '#FFFFFF' },
                  { label: 'Target', value: metrics ? `$${(metrics.raise_target / 1000).toFixed(0)}K` : '$150K–$250K', color: '#EAB308' },
                  { label: 'Committed', value: metrics ? `$${(metrics.raise_committed / 1000).toFixed(0)}K` : '—', color: '#10B981' },
                  { label: 'Your Allocation', value: investor.invested_amount ? `$${investor.invested_amount.toLocaleString()}` : '—', color: '#10B981' },
                  { label: 'SAFE Cap', value: '$3M', color: '#57ACAF' },
                ].map((item, i) => (
                  <div key={i} style={s.progressRow}>
                    <span style={{ color: '#4A6070' }}>{item.label}</span>
                    <span style={{ color: item.color, fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
                {metrics && metrics.raise_target > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070' }}>Progress</span>
                      <span style={{ fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: '#10B981', fontWeight: 700 }}>
                        {Math.round((metrics.raise_committed / metrics.raise_target) * 100)}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: '#0A1929', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(100, Math.round((metrics.raise_committed / metrics.raise_target) * 100))}%`,
                        background: 'linear-gradient(90deg, #10B981, #57ACAF)',
                        borderRadius: 3,
                        transition: 'width 0.8s ease',
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recent investor updates */}
            <div style={s.card}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
                Recent Updates
              </div>
              {updates.length > 0 ? updates.slice(0, 3).map((update) => {
                const categoryColors: Record<string, string> = {
                  milestone: '#10B981', financial: '#EAB308', product: '#57ACAF',
                  team: '#8B5CF6', general: '#6A8899',
                }
                const color = categoryColors[update.category] || '#6A8899'
                return (
                  <div key={update.id} style={{
                    padding: '12px 16px',
                    background: '#0A1929',
                    borderRadius: 8,
                    border: '1px solid #1C3042',
                    marginBottom: 8,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color, fontWeight: 700, letterSpacing: 1 }}>
                        {new Date(update.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                      </span>
                      <span style={{
                        fontSize: 8, fontFamily: "'Trebuchet MS', sans-serif",
                        background: `${color}15`, color, padding: '1px 6px',
                        borderRadius: 8, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: 0.5,
                      }}>
                        {update.category}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#A8BFC8', marginBottom: 4 }}>{update.title}</div>
                    <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#6A8899', lineHeight: 1.6 }}>
                      {update.content.length > 200 ? update.content.slice(0, 200) + '...' : update.content}
                    </div>
                  </div>
                )
              }) : (
                <>
                  {[
                    { date: 'Feb 2026', text: 'POC validated in 2 Dhaka factories. LeadX and QualityX agents showing measurable efficiency gains.', color: '#10B981' },
                    { date: 'Jan 2026', text: 'Angel round opened. SAFE terms finalized — $3M cap, 20% discount.', color: '#EAB308' },
                    { date: 'Dec 2025', text: '22 AI agents designed. Technical architecture complete. Ready for factory deployment.', color: '#57ACAF' },
                  ].map((update, i) => (
                    <div key={i} style={{
                      padding: '12px 16px',
                      background: '#0A1929',
                      borderRadius: 8,
                      border: '1px solid #1C3042',
                      marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: update.color }} />
                        <span style={{ fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: update.color, fontWeight: 700, letterSpacing: 1 }}>
                          {update.date}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#6A8899', lineHeight: 1.6 }}>
                        {update.text}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ask' && (
          <div style={{ flex: 1, paddingTop: 28, display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 200px)' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={s.sectionLabel}>Intelligence</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Ask fabricXai</div>
              <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070', marginTop: 4 }}>
                Ask anything about fabricXai — product, strategy, financials, team, roadmap. Powered by our knowledge base.
              </div>
            </div>

            {/* Chat messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              paddingBottom: 16,
              minHeight: 0,
            }}>
              {chatMessages.length === 0 && (
                <div style={{ ...s.card, textAlign: 'center' as const, padding: '40px 20px' }}>
                  <div style={{ marginBottom: 16 }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#57ACAF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2a8 8 0 0 1 8 8c0 3.3-2 6.2-5 7.5V20H9v-2.5C6 16.2 4 13.3 4 10a8 8 0 0 1 8-8z"/>
                      <path d="M9 22h6"/>
                      <path d="M10 2v1"/>
                      <path d="M14 2v1"/>
                    </svg>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#A8BFC8', marginBottom: 8 }}>
                    Your AI Research Assistant
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070', lineHeight: 1.6, maxWidth: 400, margin: '0 auto', marginBottom: 20 }}>
                    As an investor, you have full access to fabricXai&apos;s knowledge base.
                    Ask about our product, technology, financials, market, or anything else.
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
                    {[
                      'What is fabricXai?',
                      'How does the AI agent platform work?',
                      'What are the financials?',
                      'Who are the founders?',
                      'What is the competitive moat?',
                      'What is the roadmap?',
                    ].map((q) => (
                      <button
                        key={q}
                        onClick={() => { setChatInput(q); }}
                        style={{
                          background: '#0A1929',
                          border: '1px solid #1C3042',
                          borderRadius: 20,
                          padding: '6px 14px',
                          fontSize: 11,
                          fontFamily: "'Trebuchet MS', sans-serif",
                          color: '#57ACAF',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '12px 16px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    lineHeight: 1.7,
                    ...(msg.role === 'user' ? {
                      background: '#57ACAF',
                      color: '#FFFFFF',
                      borderBottomRightRadius: 4,
                    } : {
                      background: '#0D1B2A',
                      border: '1px solid #1C3042',
                      color: '#A8BFC8',
                      borderBottomLeftRadius: 4,
                    }),
                  }}>
                    {msg.role === 'assistant' ? (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {chatLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: 12,
                    background: '#0D1B2A',
                    border: '1px solid #1C3042',
                    borderBottomLeftRadius: 4,
                  }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {[0, 1, 2].map(j => (
                        <div key={j} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: '#57ACAF',
                          animation: `pulse 1.2s ease-in-out ${j * 0.15}s infinite`,
                          opacity: 0.5,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Chat input */}
            <form onSubmit={handleChatSubmit} style={{
              display: 'flex',
              gap: 8,
              padding: '12px 0',
              borderTop: '1px solid #1C3042',
            }}>
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Ask about fabricXai..."
                style={{
                  flex: 1,
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 10,
                  padding: '12px 16px',
                  fontSize: 13,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  color: '#FFFFFF',
                  outline: 'none',
                }}
                disabled={chatLoading}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || chatLoading}
                style={{
                  background: chatInput.trim() && !chatLoading ? '#57ACAF' : '#1C3042',
                  border: 'none',
                  borderRadius: 10,
                  padding: '12px 20px',
                  fontSize: 13,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontWeight: 700,
                  color: chatInput.trim() && !chatLoading ? '#07111E' : '#3A5060',
                  cursor: chatInput.trim() && !chatLoading ? 'pointer' : 'default',
                  transition: 'all 0.15s',
                }}
              >
                Send
              </button>
            </form>

            <style>{`
              @keyframes pulse {
                0%, 80%, 100% { transform: scale(0.8); opacity: 0.3; }
                40% { transform: scale(1); opacity: 1; }
              }
            `}</style>
          </div>
        )}

        {activeTab === 'updates' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={s.sectionLabel}>Communications</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Investor Updates</div>
            </div>
            {updates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {updates.map((update) => {
                  const categoryColors: Record<string, string> = {
                    milestone: '#10B981', financial: '#EAB308', product: '#57ACAF',
                    team: '#8B5CF6', general: '#6A8899',
                  }
                  const color = categoryColors[update.category] || '#6A8899'
                  return (
                    <div key={update.id} style={s.card}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color, fontWeight: 700, letterSpacing: 1 }}>
                          {new Date(update.created_at).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span style={{
                          fontSize: 9, fontFamily: "'Trebuchet MS', sans-serif",
                          background: `${color}15`, color, padding: '2px 8px',
                          borderRadius: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: 0.5,
                        }}>
                          {update.category}
                        </span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF', marginBottom: 8 }}>
                        {update.title}
                      </div>
                      <div style={{
                        fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#6A8899', lineHeight: 1.8, whiteSpace: 'pre-wrap' as const,
                      }}>
                        {update.content}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ ...s.card, textAlign: 'center' as const, padding: 40 }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#57ACAF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#A8BFC8', marginBottom: 8 }}>No Updates Yet</div>
                <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070', lineHeight: 1.6 }}>
                  Investor updates will appear here as they are published.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'docs' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={s.sectionLabel}>Data Room</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Investor Documents</div>
              <div style={{ fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070', marginTop: 4 }}>
                Full access — all documents available for download
              </div>
            </div>
            {documents.length > 0 ? documents.map((doc) => {
              const tagColorMap: Record<string, { tag: string; color: string }> = {
                pitch_deck: { tag: 'DECK', color: '#57ACAF' },
                financials: { tag: 'FIN', color: '#EAB308' },
                cap_table: { tag: 'CAP', color: '#8B5CF6' },
                legal: { tag: 'LEGAL', color: '#10B981' },
                update: { tag: 'UPDATE', color: '#F97316' },
                other: { tag: 'DOC', color: '#6A8899' },
              }
              const { tag, color } = tagColorMap[doc.doc_type || 'other'] || tagColorMap.other
              const fileSize = doc.file_size
                ? doc.file_size > 1024 * 1024
                  ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`
                  : `${(doc.file_size / 1024).toFixed(0)} KB`
                : ''
              return (
                <div key={doc.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 20px',
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 10,
                  marginBottom: 8,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 8,
                    background: `${color}10`, border: `1px solid ${color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", fontWeight: 700,
                    color, letterSpacing: 0.5, flexShrink: 0,
                  }}>
                    {tag}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{doc.name}</div>
                    <div style={{ fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif", color: '#3A5060' }}>
                      {doc.doc_type?.replace(/_/g, ' ').toUpperCase()}{fileSize ? ` · ${fileSize}` : ''}
                    </div>
                  </div>
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif",
                      color: '#10B981', cursor: 'pointer', fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Download →
                  </a>
                </div>
              )
            }) : (
              <div style={{
                textAlign: 'center' as const,
                padding: 40,
                background: '#0D1B2A',
                border: '1px solid #1C3042',
                borderRadius: 10,
              }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#57ACAF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#A8BFC8', marginBottom: 8 }}>No Documents Yet</div>
                <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070', lineHeight: 1.6 }}>
                  Documents will be available for download once they are uploaded to the data room.
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'cap' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={s.sectionLabel}>Ownership</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Cap Table Summary</div>
            </div>
            <div style={s.card}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
                Post-SAFE Ownership (Estimated)
              </div>
              {[
                { holder: 'Founders', pct: '80–85%', color: '#57ACAF' },
                { holder: 'Angel Investors (SAFE)', pct: '10–15%', color: '#EAB308' },
                { holder: 'Advisor Pool', pct: '3–5%', color: '#10B981' },
                { holder: 'Option Pool', pct: '5%', color: '#8B5CF6' },
              ].map((row, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif", color: '#A8BFC8' }}>{row.holder}</span>
                    <span style={{ fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif", color: row.color, fontWeight: 700 }}>{row.pct}</span>
                  </div>
                  <div style={{ height: 4, background: '#0A1929', borderRadius: 2 }}>
                    <div style={{
                      height: '100%',
                      width: `${parseInt(row.pct)}%`,
                      background: row.color,
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 16, fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif", color: '#3A5060', lineHeight: 1.6 }}>
                * Estimates based on $3M cap SAFE conversion at seed round. Final ownership depends on seed round valuation.
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={s.sectionLabel}>Support</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Get in Touch</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { name: 'Arifur Rahman', role: 'CEO', email: 'arifur@fabricxai.com', color: '#EAB308', initials: 'AR', linkedin: 'https://www.linkedin.com/in/arifur-rahman-fabricxai/', whatsapp: '+8801689989007' },
                { name: 'Kamrul Hasan', role: 'CTO', email: 'kamrul@fabricxai.com', color: '#57ACAF', initials: 'KH', linkedin: 'https://www.linkedin.com/in/kamrul-hasan-fabricxai/', whatsapp: '+8801743036425' },
              ].map((person, i) => (
                <div key={i} style={s.card}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: `${person.color}15`, border: `1px solid ${person.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, color: person.color, fontFamily: "'Trebuchet MS', sans-serif", marginBottom: 12 }}>
                    {person.initials}
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{person.name}</div>
                  <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: person.color, fontWeight: 600, marginBottom: 8 }}>{person.role}</div>
                  <a href={`mailto:${person.email}`} style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#6A8899', textDecoration: 'none', display: 'block', marginBottom: 12 }}>
                    {person.email}
                  </a>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
                    <a
                      href={`https://www.linkedin.com/messaging/compose/?to=${person.linkedin.split('/in/')[1]?.replace('/', '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#0A1929',
                        border: '1px solid #1C3042',
                        textDecoration: 'none',
                        fontSize: 11,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#0077B5',
                        fontWeight: 600,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0077B5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                        <rect x="2" y="9" width="4" height="12"/>
                        <circle cx="4" cy="4" r="2"/>
                      </svg>
                      Message on LinkedIn
                    </a>
                    <a
                      href={`https://wa.me/${person.whatsapp.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi ${person.name.split(' ')[0]}, I'm an investor in fabricXai. I'd like to connect.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 6,
                        background: '#0A1929',
                        border: '1px solid #1C3042',
                        textDecoration: 'none',
                        fontSize: 11,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#25D366',
                        fontWeight: 600,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="#25D366">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Message on WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={s.disclaimer}>
        Confidential — for fabricXai investors only. Not for distribution. fabricXai · SocioFi · Dhaka, Bangladesh
      </div>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

function navStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
    background: active ? '#0D1B2A' : 'transparent',
    border: active ? '1px solid #1C3042' : '1px solid transparent',
    marginBottom: 4, fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif",
    color: active ? '#FFFFFF' : '#4A6070', transition: 'all 0.15s',
  }
}

const s: Record<string, React.CSSProperties> = {
  app: { minHeight: '100vh', background: '#07111E', fontFamily: "'Georgia', serif", color: '#FFFFFF', display: 'flex', flexDirection: 'column' },
  header: { borderBottom: '1px solid #1C3042', padding: '0 32px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#07111E', position: 'sticky', top: 0, zIndex: 100 },
  logo: { fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' },
  badge: { background: '#0D1B2A', border: '1px solid #1C3042', borderRadius: 20, padding: '4px 14px', fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", letterSpacing: 2, color: '#57ACAF', fontWeight: 700 },
  logoutBtn: { background: 'none', border: '1px solid #1C3042', borderRadius: 6, padding: '4px 12px', fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070', cursor: 'pointer' },
  statsStrip: { borderBottom: '1px solid #1C3042', display: 'flex', overflowX: 'auto', background: '#0D1B2A' },
  statItem: { padding: '16px 28px', borderRight: '1px solid #1C3042', flexShrink: 0, minWidth: 120 },
  statVal: { fontSize: 22, fontWeight: 700, lineHeight: 1, marginBottom: 4 },
  statLbl: { fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: '#6A8899', letterSpacing: 1, textTransform: 'uppercase' },
  main: { flex: 1, display: 'flex', maxWidth: 1100, width: '100%', margin: '0 auto', padding: '0 24px', gap: 24 },
  sidebar: { width: 240, flexShrink: 0, paddingTop: 28 },
  sideLabel: { fontSize: 9, fontFamily: "'Trebuchet MS', sans-serif", color: '#3A5060', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 12, paddingLeft: 2 },
  sideRow: { display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0F1E2A', fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif" },
  sectionLabel: { fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: '#3A5060', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 6 },
  card: { background: '#0D1B2A', border: '1px solid #1C3042', borderRadius: 12, padding: 20, marginBottom: 12 },
  progressRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0F1E2A', fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif" },
  disclaimer: { borderTop: '1px solid #1C3042', padding: '12px 32px', fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: '#2A3F52', textAlign: 'center' },
}
