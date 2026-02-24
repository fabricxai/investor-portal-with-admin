'use client'

import { useState, useRef, useEffect } from 'react'

// ─── Constants ─────────────────────────────────────────────────────────────────

const SUGGESTED = [
  'What problem does fabricXai solve?',
  "What's the current traction?",
  'Tell me about the team',
  'What are the SAFE terms?',
  'How does the business model work?',
  'Who are the competitors?',
  "What's the use of funds?",
  'What are the key risks?',
]

const DEFAULT_STATS = [
  { value: '22', label: 'AI Agents', color: '#57ACAF' },
  { value: '$42B+', label: 'Market Size', color: '#EAB308' },
  { value: '98%', label: 'Factories Unserved', color: '#FFFFFF' },
  { value: '$3M', label: 'SAFE Cap', color: '#57ACAF' },
  { value: '$150–250K', label: 'Angel Ask', color: '#EAB308' },
  { value: 'POC Live', label: 'Dhaka · Q1 2026', color: '#10B981' },
]

const DEFAULT_DOCS = [
  { name: 'Pitch Deck 2026', type: 'PDF', size: '2.4 MB', tag: 'DECK' },
  { name: 'Investor Brief — Angel', type: 'PDF', size: '1.1 MB', tag: 'BRIEF' },
  { name: 'Investor Brief — Seed', type: 'PDF', size: '1.1 MB', tag: 'BRIEF' },
  { name: 'LeadX Technical Spec v1.0', type: 'DOCX', size: '890 KB', tag: 'TECH' },
  { name: 'Brand Guidelines', type: 'PDF', size: '620 KB', tag: 'BRAND' },
]

// ─── Types ─────────────────────────────────────────────────────────────────────

interface PortalDoc {
  name: string
  type: string
  size: string
  tag: string
  file_url?: string
  canDownload?: boolean
}

interface PortalStat {
  value: string
  label: string
  color: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface PortalClientProps {
  tier: 0 | 1 | 2
  token?: string
  investorName?: string
  investorEmail?: string
  stats?: PortalStat[]
  documents?: PortalDoc[]
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function PortalClient({
  tier,
  token,
  investorName,
  investorEmail,
  stats = DEFAULT_STATS,
  documents = DEFAULT_DOCS,
}: PortalClientProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('ask')
  const [showAccessForm, setShowAccessForm] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // ─── Chat ─────────────────────────────────────────────────────────────────

  async function ask(question: string) {
    if (!question.trim() || loading) return
    const q = question.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }))
      const res = await fetch('/api/copilot/investor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...history, { role: 'user', content: q }],
          token: token || '',
          tier,
        }),
      })

      const data = await res.json()
      const reply = data.message || 'Unable to answer right now.'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Connection error. Please try again.' },
      ])
    }
    setLoading(false)
  }

  // ─── Access Request Form ──────────────────────────────────────────────────

  function AccessRequestInline() {
    const [formData, setFormData] = useState({
      first_name: '',
      last_name: '',
      email: '',
      firm_name: '',
      investor_type: '',
      check_size: '',
      message: '',
    })
    const [formLoading, setFormLoading] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [error, setError] = useState('')

    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault()
      setError('')
      setFormLoading(true)
      try {
        const res = await fetch('/api/access-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || 'Failed to submit request')
          return
        }
        setSubmitted(true)
      } catch {
        setError('Something went wrong. Please try again.')
      } finally {
        setFormLoading(false)
      }
    }

    if (submitted) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#10B981', marginBottom: 8 }}>
            Request Received
          </div>
          <div style={{ fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif", color: '#6A8899', lineHeight: 1.6 }}>
            We&apos;re reviewing your profile and will be in touch shortly.
            Most requests are processed within a few minutes.
          </div>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <input
            type="text"
            required
            placeholder="First Name *"
            value={formData.first_name}
            onChange={e => setFormData(d => ({ ...d, first_name: e.target.value }))}
            style={inputStyle}
          />
          <input
            type="text"
            required
            placeholder="Last Name *"
            value={formData.last_name}
            onChange={e => setFormData(d => ({ ...d, last_name: e.target.value }))}
            style={inputStyle}
          />
        </div>
        <input
          type="email"
          required
          placeholder="Email *"
          value={formData.email}
          onChange={e => setFormData(d => ({ ...d, email: e.target.value }))}
          style={inputStyle}
        />
        <input
          type="text"
          placeholder="Firm Name (optional)"
          value={formData.firm_name}
          onChange={e => setFormData(d => ({ ...d, firm_name: e.target.value }))}
          style={inputStyle}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <select
            value={formData.investor_type}
            onChange={e => setFormData(d => ({ ...d, investor_type: e.target.value }))}
            style={{ ...inputStyle, color: formData.investor_type ? '#FFFFFF' : '#2A3F52' }}
          >
            <option value="">Investor Type</option>
            <option value="angel">Angel</option>
            <option value="vc">VC Fund</option>
            <option value="family_office">Family Office</option>
            <option value="strategic">Strategic</option>
            <option value="individual">Individual</option>
          </select>
          <select
            value={formData.check_size}
            onChange={e => setFormData(d => ({ ...d, check_size: e.target.value }))}
            style={{ ...inputStyle, color: formData.check_size ? '#FFFFFF' : '#2A3F52' }}
          >
            <option value="">Check Size</option>
            <option value="<$50K">{'<$50K'}</option>
            <option value="$50K–$100K">$50K–$100K</option>
            <option value="$100K–$250K">$100K–$250K</option>
            <option value="$250K–$500K">$250K–$500K</option>
            <option value="$500K–$1M">$500K–$1M</option>
            <option value=">$1M">{'>$1M'}</option>
          </select>
        </div>
        <textarea
          placeholder="What draws you to fabricXai? (optional)"
          rows={3}
          value={formData.message}
          onChange={e => setFormData(d => ({ ...d, message: e.target.value }))}
          style={{ ...inputStyle, resize: 'none' as const, minHeight: 72 }}
        />
        {error && (
          <div style={{ fontSize: 12, color: '#EF4444', fontFamily: "'Trebuchet MS', sans-serif" }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={formLoading}
          style={{
            background: '#57ACAF',
            color: '#07111E',
            padding: '12px 24px',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: "'Trebuchet MS', sans-serif",
            fontWeight: 700,
            cursor: formLoading ? 'wait' : 'pointer',
            border: 'none',
            opacity: formLoading ? 0.7 : 1,
          }}
        >
          {formLoading ? 'Submitting...' : 'Request Access →'}
        </button>
      </form>
    )
  }

  // ─── Markdown renderer ────────────────────────────────────────────────────

  function renderText(text: string) {
    const lines = text.split('\n')
    return lines.map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g)
      const rendered = parts.map((p, j) =>
        j % 2 === 1 ? (
          <strong key={j} style={{ color: '#FFFFFF' }}>{p}</strong>
        ) : (
          p
        )
      )
      return (
        <span key={i}>
          {rendered}
          {i < lines.length - 1 && <br />}
        </span>
      )
    })
  }

  // ─── Navigation items ─────────────────────────────────────────────────────

  // Pitch deck preview state
  const [deckSlide, setDeckSlide] = useState(0)
  const [deckTracked, setDeckTracked] = useState(false)
  const [pdfRequested, setPdfRequested] = useState(false)

  // Invest interest state
  const [investSubmitted, setInvestSubmitted] = useState(false)
  const [investSubmitting, setInvestSubmitting] = useState(false)
  const [investForm, setInvestForm] = useState({
    check_size: '',
    timeline: '',
    message: '',
  })

  // Track deck view
  useEffect(() => {
    if (activeTab === 'deck' && !deckTracked) {
      setDeckTracked(true)
      fetch('/api/deck/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: 'deck_view', token, investor_name: investorName, investor_email: investorEmail }),
      }).catch(() => {})
    }
  }, [activeTab, deckTracked, token])

  function trackSlideChange(slideNum: number) {
    fetch('/api/deck/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_type: 'deck_slide_change', slide_number: slideNum + 1, token, investor_name: investorName, investor_email: investorEmail }),
    }).catch(() => {})
  }

  const DECK_SLIDES = [
    {
      title: 'The Problem',
      subtitle: 'Slide 1 of 2',
      content: [
        { heading: '$42B+ Bangladesh RMG Industry', text: 'World\'s 2nd largest garment exporter — 4,500+ factories employing 4M+ workers' },
        { heading: '98% Run on Manual Processes', text: 'Production scheduling, quality control, and demand planning are done on paper or basic spreadsheets' },
        { heading: 'Result: Billions Lost Annually', text: '$3.5B in production inefficiencies, $2.1B in quality defects, 15–25% capacity waste across the industry' },
      ],
      accent: '#EAB308',
    },
    {
      title: 'The Solution',
      subtitle: 'Slide 2 of 2',
      content: [
        { heading: 'fabricXai: AI Agent Platform for Garment Manufacturing', text: '22 purpose-built AI agents that automate production scheduling, quality inspection, demand forecasting, and more' },
        { heading: 'Skills-Based Customization', text: 'Each agent adapts to factory-specific workflows — not one-size-fits-all SaaS, but configurable intelligence' },
        { heading: 'POC Validated in 2 Dhaka Factories', text: 'LeadX (scheduling) and QualityX (defect detection) deployed and showing measurable efficiency gains' },
      ],
      accent: '#57ACAF',
    },
  ]

  const navItems = [
    { id: 'ask', label: 'Ask fabricXai', dot: '#57ACAF' },
    { id: 'deck', label: 'Pitch Deck', dot: '#8B5CF6' },
    { id: 'demo', label: 'Product Demo', dot: '#EC4899' },
    { id: 'team', label: 'Team', dot: '#10B981' },
    { id: 'traction', label: 'Traction', dot: '#F59E0B' },
    { id: 'funds', label: 'Use of Funds', dot: '#EC4899' },
    { id: 'faq', label: 'FAQ', dot: '#F97316' },
    { id: 'docs', label: 'Documents', dot: '#EAB308' },
    ...(tier >= 1 ? [{ id: 'invest', label: 'Invest in fabricXai', dot: '#10B981' }] : []),
  ]

  const canChat = tier >= 1

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <a href="https://fabricxai.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png" alt="fabricXai" style={{ height: 24 }} />
        </a>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={styles.badge}>INVESTOR PORTAL</div>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#10B981',
              boxShadow: '0 0 8px #10B981',
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontFamily: "'Trebuchet MS', sans-serif",
              color: '#4A6070',
            }}
          >
            {investorName ? `Welcome, ${investorName}` : 'CONFIDENTIAL'}
          </span>
          {tier > 0 && (
            <div style={{
              ...styles.badge,
              borderColor: tier === 2 ? '#10B981' : '#57ACAF',
              color: tier === 2 ? '#10B981' : '#57ACAF',
            }}>
              {tier === 2 ? 'FULL ACCESS' : 'PREVIEW ACCESS'}
            </div>
          )}
        </div>
      </header>

      {/* Stats strip */}
      <div style={styles.statsStrip}>
        {stats.map((st, i) => (
          <div key={i} style={styles.statItem}>
            <div style={{ ...styles.statValue, color: st.color }}>{st.value}</div>
            <div style={styles.statLabel}>{st.label}</div>
          </div>
        ))}
        <div
          style={{
            ...styles.statItem,
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "'Trebuchet MS', sans-serif",
              color: '#EAB308',
              fontWeight: 700,
            }}
          >
            Angel Round Open · $150K–$250K
          </div>
        </div>
      </div>

      {/* Main */}
      <div style={{ ...styles.main, flex: 1 }}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.sideLabel}>Navigation</div>
          {navItems.map(nav => (
            <div
              key={nav.id}
              style={navItemStyle(activeTab === nav.id)}
              onClick={() => setActiveTab(nav.id)}
            >
              <div style={navDotStyle(nav.dot)} />
              {nav.label}
            </div>
          ))}

          <div style={{ ...styles.sideLabel, marginTop: 28 }}>Round Details</div>
          {[
            ['Instrument', 'SAFE'],
            ['Ask', '$150K–$250K'],
            ['Cap', '$3M'],
            ['Discount', '20%'],
            ['Stage', 'Angel / Pre-Seed'],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid #0F1E2A',
                fontSize: 11,
                fontFamily: "'Trebuchet MS', sans-serif",
              }}
            >
              <span style={{ color: '#3A5060' }}>{k}</span>
              <span style={{ color: '#A8BFC8', fontWeight: 600 }}>{v}</span>
            </div>
          ))}

          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {tier === 0 ? (
              <button
                onClick={() => setShowAccessForm(true)}
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#57ACAF',
                  color: '#07111E',
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontWeight: 700,
                  textAlign: 'center' as const,
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Request Access →
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('invest')}
                style={{
                  display: 'block',
                  width: '100%',
                  background: '#10B981',
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontWeight: 700,
                  textAlign: 'center' as const,
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Invest in fabricXai →
              </button>
            )}
            <button
              onClick={() => setActiveTab('schedule')}
              style={{
                display: 'block',
                width: '100%',
                background: 'transparent',
                color: '#6A8899',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 11,
                fontFamily: "'Trebuchet MS', sans-serif",
                fontWeight: 600,
                textAlign: 'center' as const,
                textDecoration: 'none',
                border: '1px solid #1C3042',
                cursor: 'pointer',
              }}
            >
              Schedule a Call
            </button>
          </div>

          {/* Connect on LinkedIn */}
          <div style={{ ...styles.sideLabel, marginTop: 24 }}>Connect on LinkedIn</div>
          {[
            { name: 'Arifur Rahman', role: 'CEO', initials: 'AR', color: '#EAB308', url: 'https://www.linkedin.com/in/arifur-rahman-fabricxai/' },
            { name: 'Kamrul Hasan', role: 'CTO', initials: 'KH', color: '#57ACAF', url: 'https://www.linkedin.com/in/kamrul-hasan-fabricxai/' },
          ].map((person) => (
            <a
              key={person.name}
              href={person.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                background: 'transparent',
                border: '1px solid transparent',
                marginBottom: 4,
                textDecoration: 'none',
                transition: 'all 0.15s',
                cursor: 'pointer',
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.background = '#0D1B2A';
                (e.currentTarget as HTMLElement).style.borderColor = '#1C3042';
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
              }}
            >
              <div style={{
                width: 30,
                height: 30,
                borderRadius: 8,
                background: `${person.color}15`,
                border: `1px solid ${person.color}30`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
                color: person.color,
                fontFamily: "'Trebuchet MS', sans-serif",
                flexShrink: 0,
              }}>
                {person.initials}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#A8BFC8', lineHeight: 1.3 }}>{person.name}</div>
                <div style={{ fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif", color: '#3A5060' }}>{person.role}</div>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0077B5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                <rect x="2" y="9" width="4" height="12"/>
                <circle cx="4" cy="4" r="2"/>
              </svg>
            </a>
          ))}
        </div>

        {/* Content area */}
        {activeTab === 'ask' && (
          <div style={styles.askArea}>
            <div style={{ marginBottom: 20 }}>
              <div style={styles.sectionLabel}>AI-Powered Investor Q&A</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Ask anything about fabricXai</div>
            </div>

            {!canChat ? (
              /* Tier 0: Show access request instead of chat */
              <div style={styles.welcome}>
                <div style={styles.welcomeIcon}>✦</div>
                <div style={styles.welcomeTitle}>Investor Intelligence</div>
                <div style={styles.welcomeSub}>
                  Get instant, detailed answers about fabricXai&apos;s technology,
                  market opportunity, team, financials, and SAFE terms.
                </div>
                {showAccessForm ? (
                  <div style={{ width: '100%', maxWidth: 440 }}>
                    <AccessRequestInline />
                  </div>
                ) : (
                  <div>
                    <div style={styles.suggestions}>
                      {SUGGESTED.map((q, i) => (
                        <div key={i} style={styles.sugBtn}>
                          {q}
                        </div>
                      ))}
                    </div>
                    <div style={{ marginTop: 24 }}>
                      <button
                        onClick={() => setShowAccessForm(true)}
                        style={{
                          background: '#57ACAF',
                          color: '#07111E',
                          padding: '12px 28px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontFamily: "'Trebuchet MS', sans-serif",
                          fontWeight: 700,
                          cursor: 'pointer',
                          border: 'none',
                        }}
                      >
                        Request Access to Chat →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : messages.length === 0 ? (
              /* Tier 1/2: Show welcome with clickable suggestions */
              <div style={styles.welcome}>
                <div style={styles.welcomeIcon}>✦</div>
                <div style={styles.welcomeTitle}>Investor Intelligence</div>
                <div style={styles.welcomeSub}>
                  Get instant, detailed answers about fabricXai&apos;s technology,
                  market opportunity, team, financials, and SAFE terms.
                </div>
                <div style={styles.suggestions}>
                  {SUGGESTED.map((q, i) => (
                    <button
                      key={i}
                      style={styles.sugBtn}
                      onClick={() => ask(q)}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat messages */
              <div style={styles.chatArea}>
                {messages.map((msg, i) =>
                  msg.role === 'user' ? (
                    <div key={i} style={styles.userMsg}>
                      <div style={styles.userBubble}>{msg.content}</div>
                    </div>
                  ) : (
                    <div key={i} style={styles.asstMsg}>
                      <div style={styles.asstAvatar}>✦</div>
                      <div style={styles.asstBubble}>{renderText(msg.content)}</div>
                    </div>
                  )
                )}
                {loading && (
                  <div style={styles.asstMsg}>
                    <div style={styles.asstAvatar}>✦</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingTop: 6 }}>
                      {[0, 1, 2].map(j => (
                        <div
                          key={j}
                          style={{
                            ...styles.typingDot,
                            animation: `pulse 1.2s ease-in-out ${j * 0.2}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}

            {/* Input bar (only for Tier 1+) */}
            {canChat && (
              <div style={styles.inputBar}>
                <input
                  ref={inputRef}
                  style={styles.inputBox}
                  placeholder="Ask about the team, market, SAFE terms, traction..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && ask(input)}
                />
                <button
                  style={sendBtnStyle(input.trim().length > 0 && !loading)}
                  onClick={() => ask(input)}
                >
                  <span style={{ color: input.trim() ? '#07111E' : '#1C3042' }}>→</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ─── TEAM TAB ──────────────────────────────────────────────── */}
        {activeTab === 'team' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={styles.sectionLabel}>Leadership</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>The Team Behind fabricXai</div>
            </div>

            {/* Founders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {/* Kamrul */}
              <div style={teamCardStyle}>
                <div style={teamAvatarStyle('#57ACAF')}>KH</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Kamrul Hasan</div>
                  <div style={teamRoleStyle}>Co-founder & CEO</div>
                </div>
                <div style={teamBioStyle}>
                  BUET EEE graduate. 7+ years building AI/ML systems.
                  Deep understanding of Bangladesh&apos;s manufacturing ecosystem.
                  Previously led ML engineering at a Dhaka-based SaaS startup.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <div style={teamTagStyle('#57ACAF')}>AI/ML</div>
                  <div style={teamTagStyle('#57ACAF')}>Product</div>
                  <div style={teamTagStyle('#57ACAF')}>Strategy</div>
                </div>
              </div>

              {/* Arifur */}
              <div style={teamCardStyle}>
                <div style={teamAvatarStyle('#EAB308')}>AR</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>Arifur Rahman</div>
                  <div style={teamRoleStyle}>Co-founder</div>
                </div>
                <div style={teamBioStyle}>
                  BUET graduate. Full-stack engineer with deep expertise in
                  distributed systems and real-time data pipelines.
                  Leads fabricXai&apos;s technical architecture and agent platform.
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                  <div style={teamTagStyle('#EAB308')}>Engineering</div>
                  <div style={teamTagStyle('#EAB308')}>Architecture</div>
                </div>
              </div>
            </div>

            {/* Advisor */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ ...styles.sectionLabel, marginBottom: 12 }}>Advisors</div>
            </div>
            <div style={{ ...teamCardStyle, flexDirection: 'row' as const, alignItems: 'center', gap: 20 }}>
              <div style={teamAvatarStyle('#10B981')}>NI</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>M M Nazrul Islam</div>
                <div style={teamRoleStyle}>Senior Advisor — Operations</div>
                <div style={{ ...teamBioStyle, marginTop: 8 }}>
                  Sr. GM Operations at BEXIMCO / APEX / LANTABUR. 25+ years in garment
                  manufacturing operations. Provides fabricXai with deep factory-floor
                  domain expertise and distribution access to Bangladesh&apos;s largest factories.
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                <div style={teamTagStyle('#10B981')}>Manufacturing</div>
                <div style={teamTagStyle('#10B981')}>Distribution</div>
              </div>
            </div>

            {/* Why this team */}
            <div style={{
              marginTop: 24,
              padding: 20,
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 10,
              fontSize: 13,
              fontFamily: "'Trebuchet MS', sans-serif",
              color: '#6A8899',
              lineHeight: 1.7,
            }}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
                Why This Team Wins
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <span style={{ color: '#57ACAF', fontWeight: 600 }}>Technical depth</span> — Both
                  founders are BUET engineers with hands-on AI/ML and systems experience
                </div>
                <div>
                  <span style={{ color: '#EAB308', fontWeight: 600 }}>Domain access</span> — Advisor
                  network opens doors to 4,500+ RMG factories in Bangladesh
                </div>
                <div>
                  <span style={{ color: '#10B981', fontWeight: 600 }}>Local-first</span> — Based in
                  Dhaka, on the factory floor weekly, iterating with real operators
                </div>
                <div>
                  <span style={{ color: '#8B5CF6', fontWeight: 600 }}>Capital efficient</span> — Small
                  team, low burn, Dhaka cost base = 3–4x runway vs. US equivalent
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TRACTION TIMELINE TAB ─────────────────────────────────── */}
        {activeTab === 'traction' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={styles.sectionLabel}>Progress</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Traction & Milestones</div>
            </div>

            {/* Timeline */}
            <div style={{ position: 'relative', paddingLeft: 32 }}>
              {/* Vertical line */}
              <div style={{
                position: 'absolute',
                left: 11,
                top: 8,
                bottom: 8,
                width: 2,
                background: 'linear-gradient(to bottom, #57ACAF, #1C3042)',
              }} />

              {[
                {
                  date: 'Q3 2025',
                  title: 'Research & Development',
                  desc: 'Market research across 50+ Dhaka factories. Identified 22 high-impact AI agent opportunities across production, QC, and planning.',
                  status: 'done' as const,
                  color: '#57ACAF',
                },
                {
                  date: 'Q4 2025',
                  title: '22 AI Agents Designed',
                  desc: 'Complete agent architecture: LeadX (production scheduling), QualityX (defect detection), PlanX (demand forecasting), and 19 more. Technical specs finalized.',
                  status: 'done' as const,
                  color: '#57ACAF',
                },
                {
                  date: 'Q1 2026',
                  title: 'POC Live — 2 Dhaka Factories',
                  desc: '2 agents deployed in 2 garment factories. Real production data flowing. Validating efficiency gains and operator adoption.',
                  status: 'current' as const,
                  color: '#10B981',
                },
                {
                  date: 'Q2 2026',
                  title: 'Expand to 5 Factories',
                  desc: 'Onboard 3 additional factories through advisor network. Deploy 4–6 agents per factory. First revenue from pilot contracts.',
                  status: 'upcoming' as const,
                  color: '#EAB308',
                },
                {
                  date: 'Q3 2026',
                  title: '10 Factories · Full Agent Suite',
                  desc: 'Scale to 10 factories. Launch self-serve onboarding. Target $5K–$15K MRR per factory. Begin expanding agent catalog.',
                  status: 'upcoming' as const,
                  color: '#EAB308',
                },
                {
                  date: 'Q4 2026',
                  title: 'Seed Round · Regional Expansion',
                  desc: 'Raise seed round on proven metrics. Expand beyond Dhaka to Chittagong, Gazipur. Explore Vietnam and Cambodia markets.',
                  status: 'upcoming' as const,
                  color: '#8B5CF6',
                },
              ].map((milestone, i) => (
                <div key={i} style={{ marginBottom: 28, position: 'relative' }}>
                  {/* Dot */}
                  <div style={{
                    position: 'absolute',
                    left: -27,
                    top: 6,
                    width: milestone.status === 'current' ? 14 : 10,
                    height: milestone.status === 'current' ? 14 : 10,
                    borderRadius: '50%',
                    background: milestone.status === 'upcoming' ? '#1C3042' : milestone.color,
                    border: milestone.status === 'current' ? `3px solid ${milestone.color}40` : 'none',
                    boxShadow: milestone.status === 'current' ? `0 0 12px ${milestone.color}60` : 'none',
                  }} />

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    marginBottom: 6,
                  }}>
                    <span style={{
                      fontSize: 10,
                      fontFamily: "'Trebuchet MS', sans-serif",
                      color: milestone.color,
                      fontWeight: 700,
                      letterSpacing: 1,
                    }}>
                      {milestone.date}
                    </span>
                    {milestone.status === 'current' && (
                      <span style={{
                        fontSize: 9,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        background: '#10B98120',
                        color: '#10B981',
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontWeight: 700,
                        letterSpacing: 1,
                      }}>
                        NOW
                      </span>
                    )}
                    {milestone.status === 'done' && (
                      <span style={{
                        fontSize: 9,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#3A5060',
                        fontWeight: 600,
                      }}>
                        ✓ COMPLETE
                      </span>
                    )}
                  </div>

                  <div style={{
                    fontSize: 15,
                    fontWeight: 700,
                    marginBottom: 4,
                    color: milestone.status === 'upcoming' ? '#6A8899' : '#FFFFFF',
                  }}>
                    {milestone.title}
                  </div>

                  <div style={{
                    fontSize: 12,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    color: milestone.status === 'upcoming' ? '#3A5060' : '#6A8899',
                    lineHeight: 1.6,
                    maxWidth: 520,
                  }}>
                    {milestone.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Key metrics row */}
            <div style={{
              marginTop: 8,
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 12,
            }}>
              {[
                { value: '2', label: 'Factories Live', color: '#10B981' },
                { value: '2 / 22', label: 'Agents Deployed', color: '#57ACAF' },
                { value: '50+', label: 'Factories Researched', color: '#EAB308' },
                { value: '$0', label: 'Current Burn', color: '#FFFFFF' },
              ].map((kpi, i) => (
                <div key={i} style={{
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 10,
                  padding: '16px 20px',
                  textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: 24, fontWeight: 700, color: kpi.color, marginBottom: 4 }}>
                    {kpi.value}
                  </div>
                  <div style={{
                    fontSize: 10,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    color: '#4A6070',
                    letterSpacing: 1,
                    textTransform: 'uppercase' as const,
                  }}>
                    {kpi.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── USE OF FUNDS TAB ──────────────────────────────────────── */}
        {activeTab === 'funds' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={styles.sectionLabel}>Capital Allocation</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Use of Funds — $150K–$250K Angel Round</div>
            </div>

            {/* Visual bar chart */}
            <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Engineering & Product', pct: 40, amount: '$60K–$100K', color: '#57ACAF', desc: 'Core AI agent development, platform infrastructure, factory integrations' },
                { label: 'Sales & Business Dev', pct: 25, amount: '$37K–$62K', color: '#EAB308', desc: 'Factory onboarding, pilot programs, partnership development' },
                { label: 'Operations & Support', pct: 15, amount: '$22K–$37K', color: '#10B981', desc: 'Factory support team, on-site deployment, customer success' },
                { label: 'Runway & Buffer', pct: 20, amount: '$30K–$50K', color: '#8B5CF6', desc: '6+ months operational buffer at current Dhaka-based burn rate' },
              ].map((item, i) => (
                <div key={i} style={{
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 10,
                  padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: item.color,
                      }} />
                      <span style={{ fontSize: 14, fontWeight: 700 }}>{item.label}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{
                        fontSize: 12,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#6A8899',
                      }}>
                        {item.amount}
                      </span>
                      <span style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: item.color,
                        minWidth: 40,
                        textAlign: 'right' as const,
                      }}>
                        {item.pct}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{
                    height: 6,
                    background: '#0A1929',
                    borderRadius: 3,
                    overflow: 'hidden',
                    marginBottom: 8,
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${item.pct}%`,
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}80)`,
                      borderRadius: 3,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>

                  <div style={{
                    fontSize: 11,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    color: '#4A6070',
                    lineHeight: 1.5,
                  }}>
                    {item.desc}
                  </div>
                </div>
              ))}
            </div>

            {/* Key assumptions */}
            <div style={{
              padding: 20,
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 10,
              marginBottom: 16,
            }}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
                Key Assumptions
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                fontSize: 12,
                fontFamily: "'Trebuchet MS', sans-serif",
                color: '#6A8899',
                lineHeight: 1.6,
              }}>
                {[
                  { k: 'Burn Rate', v: '~$8K–$12K/mo', note: 'Dhaka-based team, 3–4x efficient vs US' },
                  { k: 'Runway', v: '12–18 months', note: 'At target raise of $150K–$250K' },
                  { k: 'Team Size', v: '3–5 people', note: 'Founders + 1–3 engineers through angel round' },
                  { k: 'Revenue Target', v: '$5K–$15K MRR', note: 'Per factory, within 6 months of deployment' },
                ].map((row, j) => (
                  <div key={j} style={{
                    padding: '10px 14px',
                    background: '#0A1929',
                    borderRadius: 8,
                    border: '1px solid #1C3042',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#4A6070' }}>{row.k}</span>
                      <span style={{ color: '#FFFFFF', fontWeight: 700 }}>{row.v}</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#3A5060' }}>{row.note}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones this funding unlocks */}
            <div style={{
              padding: 20,
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 10,
            }}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
                What This Funding Unlocks
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                {[
                  {
                    color: '#10B981',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>,
                    text: '5–10 factories onboarded with paid pilot contracts',
                  },
                  {
                    color: '#57ACAF',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#57ACAF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><path d="M8 15h.01"/><path d="M16 15h.01"/><path d="M10 19h4"/></svg>,
                    text: '6–8 AI agents deployed per factory (from current 2)',
                  },
                  {
                    color: '#EAB308',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
                    text: 'First recurring revenue — proof of business model',
                  },
                  {
                    color: '#8B5CF6',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3"/></svg>,
                    text: 'Metrics for seed round ($500K–$750K at higher valuation)',
                  },
                  {
                    color: '#EC4899',
                    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EC4899" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
                    text: 'Validated playbook ready for regional expansion',
                  },
                ].map((item, j) => (
                  <div key={j} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    background: '#0A1929',
                    borderRadius: 8,
                    border: '1px solid #1C3042',
                    fontSize: 13,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    color: '#A8BFC8',
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      background: `${item.color}10`,
                      border: `1px solid ${item.color}25`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {item.icon}
                    </div>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'docs' && (
          <div style={styles.docsArea}>
            <div style={{ marginBottom: 20 }}>
              <div style={styles.sectionLabel}>Data Room</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Investor Documents</div>
            </div>
            {documents.map((doc, i) => (
              <div key={i} style={styles.docCard}>
                <div style={docIconStyle(doc.tag)}>{doc.tag}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 3 }}>{doc.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "'Trebuchet MS', sans-serif",
                      color: '#3A5060',
                    }}
                  >
                    {doc.type} · {doc.size}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    color: tier >= 2 && doc.canDownload ? '#10B981' : '#57ACAF',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  {tier >= 2 && doc.file_url ? 'Download →' : 'Request Access →'}
                </div>
              </div>
            ))}
            <div
              style={{
                marginTop: 24,
                padding: 20,
                background: '#0D1B2A',
                border: '1px solid #1C3042',
                borderRadius: 10,
                fontSize: 12,
                fontFamily: "'Trebuchet MS', sans-serif",
                color: '#4A6070',
                lineHeight: 1.6,
              }}
            >
              <div style={{ color: '#A8BFC8', fontWeight: 600, marginBottom: 6 }}>
                🔒 NDA-Gated Access
              </div>
              Full technical specifications, financial models, and cap table are available
              after signing an NDA. Contact arifur@fabricxai.com to proceed.
            </div>
          </div>
        )}

        {/* ─── PRODUCT DEMO TAB ──────────────────────────────────── */}
        {activeTab === 'demo' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={styles.sectionLabel}>Platform Preview</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>The fabricXai Agent Platform</div>
            </div>

            {/* Agent overview */}
            <div style={{
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
            }}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 6, fontSize: 14 }}>
                22 Purpose-Built AI Agents
              </div>
              <div style={{
                fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                color: '#6A8899', lineHeight: 1.7, marginBottom: 20,
              }}>
                Each agent is a specialized AI module that plugs into a factory&apos;s existing workflow.
                Agents communicate with each other to optimize the entire production chain — from
                order intake to final shipment.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  {
                    name: 'LeadX', desc: 'Production scheduling & line balancing', status: 'LIVE', color: '#10B981', slug: 'leadx',
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
                  },
                  {
                    name: 'QualityX', desc: 'Real-time defect detection & QC automation', status: 'LIVE', color: '#10B981', slug: 'qualityx',
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="m11 8v6"/><path d="M8 11h6"/></svg>,
                  },
                  {
                    name: 'PlanX', desc: 'Demand forecasting & capacity planning', status: 'Q2 2026', color: '#EAB308', slug: 'planx',
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>,
                  },
                  {
                    name: 'SupplyX', desc: 'Supplier management & procurement optimization', status: 'Q2 2026', color: '#EAB308', slug: 'supplyx',
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EAB308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
                  },
                  {
                    name: 'SkillX', desc: 'Worker skill mapping & optimal line assignment', status: 'Q3 2026', color: '#8B5CF6', slug: 'skillx',
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                  },
                  {
                    name: 'EnergyX', desc: 'Energy consumption monitoring & optimization', status: 'Q3 2026', color: '#8B5CF6', slug: 'energyx',
                    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
                  },
                ].map((agent) => (
                  <a
                    key={agent.name}
                    href={`https://${agent.slug}.fabricxai.com`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      background: '#0A1929',
                      border: '1px solid #1C3042',
                      borderRadius: 10,
                      padding: 16,
                      textDecoration: 'none',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                      display: 'block',
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${agent.color}50`
                      ;(e.currentTarget as HTMLElement).style.background = '#0D1F30'
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = '#1C3042'
                      ;(e.currentTarget as HTMLElement).style.background = '#0A1929'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 8,
                          background: `${agent.color}10`, border: `1px solid ${agent.color}25`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          {agent.icon}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>{agent.name}</span>
                      </div>
                      <span style={{
                        fontSize: 8, fontFamily: "'Trebuchet MS', sans-serif",
                        background: `${agent.color}15`, color: agent.color,
                        padding: '2px 8px', borderRadius: 10, fontWeight: 700, letterSpacing: 1,
                      }}>
                        {agent.status}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif",
                      color: '#4A6070', lineHeight: 1.5, marginBottom: 6,
                    }}>
                      {agent.desc}
                    </div>
                    <div style={{
                      fontSize: 9, fontFamily: "'Trebuchet MS', sans-serif",
                      color: '#3A5060', display: 'flex', alignItems: 'center', gap: 4,
                    }}>
                      <span>{agent.slug}.fabricxai.com</span>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#3A5060" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </div>
                  </a>
                ))}
              </div>

              <div style={{
                marginTop: 12, fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif",
                color: '#3A5060', textAlign: 'center' as const,
              }}>
                + 16 more agents across logistics, compliance, costing, maintenance, and analytics
              </div>
            </div>

            {/* How it works */}
            <div style={{
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
            }}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
                How It Works
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}>
                {[
                  { step: '01', title: 'Connect', desc: 'Factory plugs into fabricXai via lightweight API or manual data entry. No ERP migration needed.', color: '#57ACAF' },
                  { step: '02', title: 'Configure', desc: 'Select and customize agents for the factory\'s specific workflows, product lines, and KPIs.', color: '#EAB308' },
                  { step: '03', title: 'Deploy', desc: 'Agents go live and start processing real production data. Operators see recommendations on dashboards.', color: '#10B981' },
                  { step: '04', title: 'Optimize', desc: 'Agents learn from feedback, improve over time, and coordinate with each other for end-to-end optimization.', color: '#8B5CF6' },
                ].map((item) => (
                  <div key={item.step} style={{
                    display: 'flex', gap: 16, alignItems: 'flex-start',
                    padding: '16px 20px',
                    background: '#0A1929',
                    border: '1px solid #1C3042',
                    borderRadius: 10,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 10,
                      background: `${item.color}10`, border: `1px solid ${item.color}25`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 14, fontWeight: 700, color: item.color,
                      fontFamily: "'Trebuchet MS', sans-serif", flexShrink: 0,
                    }}>
                      {item.step}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>
                        {item.title}
                      </div>
                      <div style={{
                        fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#6A8899', lineHeight: 1.6,
                      }}>
                        {item.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key differentiators */}
            <div style={{
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 12,
              padding: 24,
            }}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
                Why fabricXai is Different
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { title: 'Skills-Based Architecture', desc: 'Agents adapt to each factory\'s unique workflows — not generic SaaS templates.', color: '#57ACAF' },
                  { title: 'Multi-Agent Coordination', desc: '22 agents work together, sharing context for end-to-end production optimization.', color: '#EAB308' },
                  { title: 'Factory-Floor First', desc: 'Built for operators, not IT departments. Works with paper, spreadsheets, or ERPs.', color: '#10B981' },
                  { title: 'Bangladesh Distribution', desc: 'Advisor network provides direct access to 4,500+ RMG factories.', color: '#8B5CF6' },
                ].map((item) => (
                  <div key={item.title} style={{
                    padding: '16px 20px',
                    background: '#0A1929',
                    border: '1px solid #1C3042',
                    borderRadius: 10,
                    borderLeft: `3px solid ${item.color}`,
                  }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: item.color, marginBottom: 6 }}>
                      {item.title}
                    </div>
                    <div style={{
                      fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif",
                      color: '#6A8899', lineHeight: 1.6,
                    }}>
                      {item.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deck' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={styles.sectionLabel}>Presentation Preview</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>Pitch Deck — 14 Slides</div>
              </div>
              <div style={{ fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070' }}>
                Showing {deckSlide + 1} of {DECK_SLIDES.length} preview slides
              </div>
            </div>

            {/* Slide viewer */}
            <div style={{
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 16,
              overflow: 'hidden',
              marginBottom: 16,
            }}>
              {/* Slide header bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 20px',
                borderBottom: '1px solid #1C3042',
                background: '#0A1929',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: DECK_SLIDES[deckSlide].accent,
                  }} />
                  <span style={{
                    fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif",
                    color: DECK_SLIDES[deckSlide].accent, fontWeight: 700,
                    letterSpacing: 1.5, textTransform: 'uppercase' as const,
                  }}>
                    {DECK_SLIDES[deckSlide].subtitle}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {DECK_SLIDES.map((_, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setDeckSlide(idx)
                        trackSlideChange(idx)
                      }}
                      style={{
                        width: idx === deckSlide ? 24 : 8,
                        height: 8,
                        borderRadius: 4,
                        background: idx === deckSlide ? DECK_SLIDES[idx].accent : '#1C3042',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Slide content */}
              <div style={{ padding: '40px 40px 32px' }}>
                <div style={{
                  fontSize: 28, fontWeight: 700, marginBottom: 8,
                  color: '#FFFFFF', lineHeight: 1.2,
                }}>
                  {DECK_SLIDES[deckSlide].title}
                </div>
                <div style={{
                  width: 60, height: 3, borderRadius: 2,
                  background: DECK_SLIDES[deckSlide].accent,
                  marginBottom: 32,
                }} />

                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
                  {DECK_SLIDES[deckSlide].content.map((item, j) => (
                    <div key={j} style={{
                      padding: '20px 24px',
                      background: '#0A1929',
                      border: '1px solid #1C3042',
                      borderRadius: 12,
                      borderLeft: `3px solid ${DECK_SLIDES[deckSlide].accent}`,
                    }}>
                      <div style={{
                        fontSize: 15, fontWeight: 700, color: '#FFFFFF',
                        marginBottom: 6,
                      }}>
                        {item.heading}
                      </div>
                      <div style={{
                        fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#6A8899', lineHeight: 1.7,
                      }}>
                        {item.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation arrows */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                borderTop: '1px solid #1C3042',
                background: '#0A1929',
              }}>
                <button
                  onClick={() => {
                    const prev = Math.max(0, deckSlide - 1)
                    setDeckSlide(prev)
                    trackSlideChange(prev)
                  }}
                  disabled={deckSlide === 0}
                  style={{
                    background: deckSlide > 0 ? '#1C3042' : 'transparent',
                    border: '1px solid #1C3042',
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    fontWeight: 600,
                    color: deckSlide > 0 ? '#A8BFC8' : '#1C3042',
                    cursor: deckSlide > 0 ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  ← Previous
                </button>

                <span style={{
                  fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif",
                  color: '#3A5060',
                }}>
                  Preview · {deckSlide + 1} / {DECK_SLIDES.length}
                </span>

                <button
                  onClick={() => {
                    const next = Math.min(DECK_SLIDES.length - 1, deckSlide + 1)
                    setDeckSlide(next)
                    trackSlideChange(next)
                  }}
                  disabled={deckSlide === DECK_SLIDES.length - 1}
                  style={{
                    background: deckSlide < DECK_SLIDES.length - 1 ? DECK_SLIDES[deckSlide].accent : 'transparent',
                    border: `1px solid ${deckSlide < DECK_SLIDES.length - 1 ? DECK_SLIDES[deckSlide].accent : '#1C3042'}`,
                    borderRadius: 8,
                    padding: '8px 16px',
                    fontSize: 12,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    fontWeight: 700,
                    color: deckSlide < DECK_SLIDES.length - 1 ? '#07111E' : '#1C3042',
                    cursor: deckSlide < DECK_SLIDES.length - 1 ? 'pointer' : 'default',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>

            {/* Request Full Deck CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #0D1B2A 0%, #0F2A3A 100%)',
              border: '1px solid #57ACAF30',
              borderRadius: 12,
              padding: 28,
              textAlign: 'center' as const,
            }}>
              {pdfRequested ? (
                <div>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>✓</div>
                  <div style={{
                    fontSize: 16, fontWeight: 700, color: '#10B981', marginBottom: 8,
                  }}>
                    Request Received!
                  </div>
                  <div style={{
                    fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                    color: '#6A8899', lineHeight: 1.6,
                  }}>
                    We&apos;ll send the full 14-slide deck to your email shortly.
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#FFFFFF',
                  }}>
                    Want the full 14-slide deck?
                  </div>
                  <div style={{
                    fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                    color: '#4A6070', lineHeight: 1.6, marginBottom: 20,
                  }}>
                    Swiss-design investor presentation covering problem, market, solution,
                    traction, team, financials, and the ask.
                  </div>
                  <button
                    onClick={() => {
                      setPdfRequested(true)
                      fetch('/api/deck/track', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          event_type: 'deck_pdf_request',
                          token,
                          investor_name: investorName,
                        }),
                      }).catch(() => {})
                    }}
                    style={{
                      background: '#57ACAF',
                      color: '#07111E',
                      padding: '12px 28px',
                      borderRadius: 8,
                      fontSize: 13,
                      fontFamily: "'Trebuchet MS', sans-serif",
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    Request Full Deck PDF →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── FAQ TAB ───────────────────────────────────────────── */}
        {activeTab === 'faq' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={styles.sectionLabel}>Frequently Asked Questions</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Investor FAQ</div>
            </div>

            {[
              {
                category: 'Product & Technology',
                color: '#57ACAF',
                items: [
                  {
                    q: 'What does fabricXai actually do?',
                    a: 'fabricXai builds AI agents purpose-built for garment manufacturing. Each agent automates a specific factory process — from production scheduling to quality inspection to demand forecasting. Think of it as giving every factory a team of AI specialists that work 24/7.',
                  },
                  {
                    q: 'Why 22 agents instead of one product?',
                    a: 'Garment manufacturing has dozens of distinct processes, each requiring specialized intelligence. A single AI tool can\'t handle scheduling, defect detection, AND demand planning well. Our multi-agent architecture lets each agent excel at one thing while coordinating with others for end-to-end optimization.',
                  },
                  {
                    q: 'What makes your AI approach different from existing solutions?',
                    a: 'Most factory software is generic ERP/MES built for Western markets. fabricXai agents are skills-based — they adapt to each factory\'s unique workflows, product lines, and operator skill levels. Plus, they work with existing processes (paper, spreadsheets) rather than requiring a full system migration.',
                  },
                ],
              },
              {
                category: 'Market & Opportunity',
                color: '#EAB308',
                items: [
                  {
                    q: 'How big is the market?',
                    a: 'Bangladesh\'s RMG industry alone is $42B+ annually, making it the world\'s 2nd largest garment exporter. There are 4,500+ factories employing 4M+ workers — and 98% run on manual processes. The global garment manufacturing AI market extends to Vietnam, Cambodia, India, and beyond.',
                  },
                  {
                    q: 'Why start in Bangladesh?',
                    a: 'Bangladesh is the perfect beachhead: massive scale (4,500+ factories), extreme pain point (98% manual), low competition (no AI-first solutions), and our team has direct access through our advisor network at BEXIMCO/APEX/LANTABUR. Success here creates a playbook for $200B+ in regional markets.',
                  },
                  {
                    q: 'Who are the competitors?',
                    a: 'The primary competitors are pen-and-paper, basic Excel spreadsheets, and legacy ERP systems (SAP, Oracle) designed for large Western manufacturers. No one is building AI-native, agent-based solutions specifically for garment factories in emerging markets.',
                  },
                ],
              },
              {
                category: 'Business Model',
                color: '#10B981',
                items: [
                  {
                    q: 'How does fabricXai make money?',
                    a: 'SaaS pricing per factory: $5K–$15K/month depending on factory size and number of agents deployed. Factories start with 2–3 agents (pilot) and expand to 6–10+ as they see ROI. Revenue grows both from new factories AND from expanding agent usage within existing ones.',
                  },
                  {
                    q: 'What\'s the path to revenue?',
                    a: 'POC is live in 2 factories now (Q1 2026). Paid pilot contracts expected Q2 2026 with 3–5 additional factories through our advisor network. Target: $5K–$15K MRR per factory within 6 months of deployment.',
                  },
                  {
                    q: 'What about unit economics?',
                    a: 'Dhaka-based engineering team means 3–4x capital efficiency vs. US equivalents. Target gross margins of 75%+ once platform is stable. Customer acquisition cost is low due to advisor network providing warm introductions to factory owners.',
                  },
                ],
              },
              {
                category: 'Team & Execution',
                color: '#8B5CF6',
                items: [
                  {
                    q: 'Who are the founders?',
                    a: 'Arifur Rahman (CEO) and Kamrul Hasan (CTO) — both BUET graduates with deep AI/ML and systems engineering experience. Advised by M M Nazrul Islam, Sr. GM Operations at BEXIMCO/APEX/LANTABUR with 25+ years in garment manufacturing operations.',
                  },
                  {
                    q: 'Why is this team the right one?',
                    a: 'Three critical advantages: (1) Both founders are BUET-trained engineers with hands-on AI/ML experience, (2) our advisor provides direct distribution access to Bangladesh\'s largest factories, and (3) we\'re based in Dhaka, on factory floors weekly, iterating with real operators.',
                  },
                ],
              },
              {
                category: 'Investment Terms',
                color: '#EC4899',
                items: [
                  {
                    q: 'What are the SAFE terms?',
                    a: 'SAFE note with $3M valuation cap, 20% discount. Angel round target: $150K–$250K. This sets up for a seed round of $500K–$750K at a higher valuation once key metrics are proven.',
                  },
                  {
                    q: 'How will the funds be used?',
                    a: '40% Engineering & Product (core AI agents), 25% Sales & Business Development (factory onboarding), 15% Operations & Support (deployment team), 20% Runway & Buffer (12–18 months at Dhaka burn rate of ~$8K–$12K/month).',
                  },
                  {
                    q: 'What milestones will the angel round unlock?',
                    a: '5–10 factories onboarded with paid pilot contracts, 6–8 AI agents deployed per factory, first recurring revenue, and metrics sufficient to raise a seed round at a higher valuation.',
                  },
                ],
              },
            ].map((section) => (
              <div key={section.category} style={{ marginBottom: 20 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: section.color }} />
                  <span style={{
                    fontSize: 13, fontWeight: 700, color: section.color,
                  }}>
                    {section.category}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                  {section.items.map((faq) => (
                    <details
                      key={faq.q}
                      style={{
                        background: '#0D1B2A',
                        border: '1px solid #1C3042',
                        borderRadius: 10,
                        overflow: 'hidden',
                      }}
                    >
                      <summary style={{
                        padding: '14px 20px',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#A8BFC8',
                        cursor: 'pointer',
                        listStyle: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <span>{faq.q}</span>
                        <span style={{ color: '#3A5060', fontSize: 16, flexShrink: 0, marginLeft: 12 }}>+</span>
                      </summary>
                      <div style={{
                        padding: '0 20px 16px',
                        fontSize: 12,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#6A8899',
                        lineHeight: 1.7,
                        borderTop: '1px solid #1C3042',
                        paddingTop: 12,
                      }}>
                        {faq.a}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}

            {/* Still have questions */}
            <div style={{
              background: 'linear-gradient(135deg, #0D1B2A 0%, #0F2A3A 100%)',
              border: '1px solid #57ACAF30',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center' as const,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#FFFFFF' }}>
                Still have questions?
              </div>
              <div style={{
                fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                color: '#4A6070', marginBottom: 16,
              }}>
                Use our AI copilot for instant answers, or schedule a call with the founders.
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button
                  onClick={() => setActiveTab('ask')}
                  style={{
                    background: '#57ACAF',
                    color: '#07111E',
                    padding: '10px 24px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  Ask fabricXai AI →
                </button>
                <button
                  onClick={() => setActiveTab('schedule')}
                  style={{
                    background: '#0A1929',
                    color: '#A8BFC8',
                    padding: '10px 24px',
                    borderRadius: 8,
                    fontSize: 12,
                    fontFamily: "'Trebuchet MS', sans-serif",
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: '1px solid #1C3042',
                  }}
                >
                  Schedule a Call
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── INVEST TAB ─────────────────────────────────────────── */}
        {activeTab === 'invest' && tier >= 1 && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={styles.sectionLabel}>Investment Opportunity</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Invest in fabricXai</div>
            </div>

            {investSubmitted ? (
              <div style={{
                background: '#0D1B2A',
                border: '1px solid #10B98140',
                borderRadius: 16,
                padding: 40,
                textAlign: 'center' as const,
              }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#10B981', marginBottom: 8 }}>
                  Interest Received!
                </div>
                <div style={{
                  fontSize: 13, fontFamily: "'Trebuchet MS', sans-serif",
                  color: '#6A8899', lineHeight: 1.7, maxWidth: 400, margin: '0 auto',
                }}>
                  Thank you for your interest in investing in fabricXai. Our team will review
                  your submission and reach out within 24 hours to discuss next steps and
                  share the SAFE agreement.
                </div>
                <div style={{ marginTop: 24, display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <button
                    onClick={() => setActiveTab('schedule')}
                    style={{
                      background: '#57ACAF',
                      color: '#07111E',
                      padding: '10px 24px',
                      borderRadius: 8,
                      fontSize: 12,
                      fontFamily: "'Trebuchet MS', sans-serif",
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: 'none',
                    }}
                  >
                    Schedule a Call Now →
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* SAFE Terms summary */}
                <div style={{
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 16,
                }}>
                  <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
                    Angel Round — SAFE Terms
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                    {[
                      { label: 'Instrument', value: 'SAFE', color: '#FFFFFF' },
                      { label: 'Valuation Cap', value: '$3M', color: '#57ACAF' },
                      { label: 'Discount', value: '20%', color: '#EAB308' },
                      { label: 'Round Target', value: '$150K–$250K', color: '#10B981' },
                      { label: 'Min Check', value: '$5K', color: '#FFFFFF' },
                      { label: 'Stage', value: 'Angel / Pre-Seed', color: '#8B5CF6' },
                    ].map((term) => (
                      <div key={term.label} style={{
                        padding: '14px 16px',
                        background: '#0A1929',
                        border: '1px solid #1C3042',
                        borderRadius: 10,
                        textAlign: 'center' as const,
                      }}>
                        <div style={{
                          fontSize: 18, fontWeight: 700, color: term.color, marginBottom: 4,
                        }}>
                          {term.value}
                        </div>
                        <div style={{
                          fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif",
                          color: '#4A6070', letterSpacing: 1, textTransform: 'uppercase' as const,
                        }}>
                          {term.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why invest */}
                <div style={{
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 12,
                  padding: 24,
                  marginBottom: 16,
                }}>
                  <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 12, fontSize: 14 }}>
                    Why Invest Now
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
                    {[
                      { text: 'POC validated — 2 agents live in 2 Dhaka factories with measurable results', color: '#10B981' },
                      { text: '$3M cap SAFE — early entry at pre-traction valuation before seed round repricing', color: '#57ACAF' },
                      { text: '$42B+ addressable market — 4,500 factories, 98% unserved by AI solutions', color: '#EAB308' },
                      { text: 'Capital efficient — Dhaka cost base means 3–4x more runway per dollar vs. US', color: '#8B5CF6' },
                      { text: 'Distribution locked — advisor network at BEXIMCO/APEX provides factory access', color: '#EC4899' },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 14px',
                        background: '#0A1929',
                        border: '1px solid #1C3042',
                        borderRadius: 8,
                      }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: item.color, flexShrink: 0, marginTop: 5,
                        }} />
                        <div style={{
                          fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                          color: '#A8BFC8', lineHeight: 1.6,
                        }}>
                          {item.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment interest form */}
                <div style={{
                  background: 'linear-gradient(135deg, #0D1B2A 0%, #0A2015 100%)',
                  border: '1px solid #10B98130',
                  borderRadius: 12,
                  padding: 28,
                }}>
                  <div style={{
                    fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#FFFFFF',
                  }}>
                    Express Your Interest
                  </div>
                  <div style={{
                    fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                    color: '#4A6070', lineHeight: 1.6, marginBottom: 20,
                  }}>
                    Let us know you&apos;re interested and we&apos;ll send you the SAFE agreement and next steps.
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault()
                      setInvestSubmitting(true)
                      try {
                        const res = await fetch('/api/invest-interest', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            token,
                            ...investForm,
                          }),
                        })
                        if (res.ok) setInvestSubmitted(true)
                      } catch { /* silent */ }
                      setInvestSubmitting(false)
                    }}
                    style={{ display: 'flex', flexDirection: 'column' as const, gap: 12 }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label style={{
                          display: 'block', fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif",
                          color: '#4A6070', letterSpacing: 1, textTransform: 'uppercase' as const,
                          marginBottom: 6,
                        }}>
                          Intended Check Size
                        </label>
                        <select
                          required
                          value={investForm.check_size}
                          onChange={e => setInvestForm(f => ({ ...f, check_size: e.target.value }))}
                          style={{ ...inputStyle, color: investForm.check_size ? '#FFFFFF' : '#2A3F52' }}
                        >
                          <option value="">Select amount</option>
                          <option value="$5K–$10K">$5K–$10K</option>
                          <option value="$10K–$25K">$10K–$25K</option>
                          <option value="$25K–$50K">$25K–$50K</option>
                          <option value="$50K–$100K">$50K–$100K</option>
                          <option value="$100K–$250K">$100K–$250K</option>
                          <option value="$250K+">$250K+</option>
                        </select>
                      </div>
                      <div>
                        <label style={{
                          display: 'block', fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif",
                          color: '#4A6070', letterSpacing: 1, textTransform: 'uppercase' as const,
                          marginBottom: 6,
                        }}>
                          Timeline
                        </label>
                        <select
                          value={investForm.timeline}
                          onChange={e => setInvestForm(f => ({ ...f, timeline: e.target.value }))}
                          style={{ ...inputStyle, color: investForm.timeline ? '#FFFFFF' : '#2A3F52' }}
                        >
                          <option value="">Select timeline</option>
                          <option value="Ready now">Ready now</option>
                          <option value="Within 2 weeks">Within 2 weeks</option>
                          <option value="Within 1 month">Within 1 month</option>
                          <option value="Exploring / need more info">Exploring / need more info</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label style={{
                        display: 'block', fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif",
                        color: '#4A6070', letterSpacing: 1, textTransform: 'uppercase' as const,
                        marginBottom: 6,
                      }}>
                        Message (optional)
                      </label>
                      <textarea
                        placeholder="Any questions or notes for the team..."
                        rows={3}
                        value={investForm.message}
                        onChange={e => setInvestForm(f => ({ ...f, message: e.target.value }))}
                        style={{ ...inputStyle, resize: 'none' as const, minHeight: 72 }}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={investSubmitting}
                      style={{
                        background: '#10B981',
                        color: '#FFFFFF',
                        padding: '14px 28px',
                        borderRadius: 8,
                        fontSize: 14,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        fontWeight: 700,
                        cursor: investSubmitting ? 'wait' : 'pointer',
                        border: 'none',
                        opacity: investSubmitting ? 0.7 : 1,
                      }}
                    >
                      {investSubmitting ? 'Submitting...' : 'I Want to Invest →'}
                    </button>
                    <div style={{
                      fontSize: 10, fontFamily: "'Trebuchet MS', sans-serif",
                      color: '#3A5060', lineHeight: 1.5, textAlign: 'center' as const,
                    }}>
                      This is a non-binding expression of interest. You&apos;ll receive the SAFE
                      agreement to review before any commitment.
                    </div>
                  </form>
                </div>
              </>
            )}
          </div>
        )}

        {/* ─── SCHEDULE A CALL TAB ────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <div style={{ flex: 1, paddingTop: 28 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={styles.sectionLabel}>Get in Touch</div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>Schedule a Call</div>
            </div>

            {/* Founders with contact */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              {[
                {
                  name: 'Arifur Rahman',
                  role: 'CEO',
                  initials: 'AR',
                  color: '#EAB308',
                  email: 'arifur@fabricxai.com',
                  linkedin: 'https://www.linkedin.com/in/arifur-rahman-fabricxai/',
                  desc: 'Business strategy, partnerships, market opportunity, and round details.',
                },
                {
                  name: 'Kamrul Hasan',
                  role: 'CTO',
                  initials: 'KH',
                  color: '#57ACAF',
                  email: 'kamrul@fabricxai.com',
                  linkedin: 'https://www.linkedin.com/in/kamrul-hasan-fabricxai/',
                  desc: 'Technical architecture, AI agent platform, product roadmap, and engineering.',
                },
              ].map((person) => (
                <div key={person.name} style={{
                  background: '#0D1B2A',
                  border: '1px solid #1C3042',
                  borderRadius: 12,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column' as const,
                  gap: 12,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      background: `${person.color}15`, border: `1px solid ${person.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, fontWeight: 700, color: person.color,
                      fontFamily: "'Trebuchet MS', sans-serif",
                    }}>
                      {person.initials}
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{person.name}</div>
                      <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: person.color, fontWeight: 600 }}>
                        {person.role}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#6A8899', lineHeight: 1.6 }}>
                    {person.desc}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <a
                      href={`mailto:${person.email}?subject=fabricXai%20Investor%20Call%20Request`}
                      style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: person.color,
                        color: '#07111E',
                        padding: '10px 16px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      Email
                    </a>
                    <a
                      href={person.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: '#0A1929',
                        border: '1px solid #1C3042',
                        color: '#0077B5',
                        padding: '10px 16px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontFamily: "'Trebuchet MS', sans-serif",
                        fontWeight: 700,
                        textDecoration: 'none',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
                        <rect x="2" y="9" width="4" height="12"/>
                        <circle cx="4" cy="4" r="2"/>
                      </svg>
                      LinkedIn
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* What to expect */}
            <div style={{
              background: '#0D1B2A',
              border: '1px solid #1C3042',
              borderRadius: 12,
              padding: 24,
              marginBottom: 16,
            }}>
              <div style={{ color: '#A8BFC8', fontWeight: 700, marginBottom: 16, fontSize: 14 }}>
                What to Expect on the Call
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { time: '5 min', topic: 'Introductions & Your Interests', color: '#57ACAF' },
                  { time: '10 min', topic: 'Product Demo & Agent Platform', color: '#EAB308' },
                  { time: '10 min', topic: 'Market, Traction & Financials', color: '#10B981' },
                  { time: '5 min', topic: 'Q&A & Next Steps', color: '#8B5CF6' },
                ].map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    background: '#0A1929',
                    border: '1px solid #1C3042',
                    borderRadius: 8,
                  }}>
                    <div style={{
                      fontSize: 11, fontFamily: "'Trebuchet MS', sans-serif",
                      color: item.color, fontWeight: 700,
                      minWidth: 40,
                    }}>
                      {item.time}
                    </div>
                    <div style={{
                      fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                      color: '#A8BFC8',
                    }}>
                      {item.topic}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick email CTA */}
            <div style={{
              background: 'linear-gradient(135deg, #0D1B2A 0%, #0F2A3A 100%)',
              border: '1px solid #57ACAF30',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center' as const,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#FFFFFF' }}>
                Prefer a quick email instead?
              </div>
              <div style={{
                fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif",
                color: '#4A6070', marginBottom: 16,
              }}>
                Drop us a line and we&apos;ll get back to you within 24 hours.
              </div>
              <a
                href="mailto:arifur@fabricxai.com?subject=fabricXai%20Investor%20Inquiry"
                style={{
                  display: 'inline-block',
                  background: '#57ACAF',
                  color: '#07111E',
                  padding: '12px 28px',
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "'Trebuchet MS', sans-serif",
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                arifur@fabricxai.com →
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Access Request Modal (overlay for Tier 0) */}
      {tier === 0 && showAccessForm && activeTab !== 'ask' && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowAccessForm(false)}
          />
          <div style={{
            position: 'relative',
            background: '#0D1B2A',
            border: '1px solid #1C3042',
            borderRadius: 16,
            padding: 32,
            maxWidth: 480,
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto' as const,
          }}>
            <button
              onClick={() => setShowAccessForm(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'none',
                border: 'none',
                color: '#4A6070',
                fontSize: 20,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Request Investor Access</div>
            <div style={{ fontSize: 12, fontFamily: "'Trebuchet MS', sans-serif", color: '#4A6070', marginBottom: 20 }}>
              We share our numbers with serious investors.
            </div>
            <AccessRequestInline />
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={styles.disclaimer}>
        This portal contains confidential information for prospective investors only. Not for distribution.
        fabricXai · SocioFi · Dhaka, Bangladesh · arifur@fabricxai.com
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #07111E; }
        ::-webkit-scrollbar-thumb { background: #1C3042; border-radius: 4px; }
        input::placeholder, textarea::placeholder { color: #2A3F52; }
        select { appearance: auto; }
      `}</style>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  background: '#0A1929',
  border: '1px solid #1C3042',
  borderRadius: 8,
  padding: '10px 14px',
  fontSize: 13,
  fontFamily: "'Trebuchet MS', sans-serif",
  color: '#FFFFFF',
  outline: 'none',
  width: '100%',
}

function navItemStyle(active: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '10px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    background: active ? '#0D1B2A' : 'transparent',
    border: active ? '1px solid #1C3042' : '1px solid transparent',
    marginBottom: 4,
    fontSize: 13,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: active ? '#FFFFFF' : '#4A6070',
    transition: 'all 0.15s',
  }
}

function navDotStyle(color: string): React.CSSProperties {
  return {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: color,
    flexShrink: 0,
  }
}

function sendBtnStyle(active: boolean): React.CSSProperties {
  return {
    background: active ? '#57ACAF' : '#0D1B2A',
    border: '1px solid ' + (active ? '#57ACAF' : '#1C3042'),
    borderRadius: 12,
    width: 46,
    height: 46,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: active ? 'pointer' : 'default',
    transition: 'all 0.15s',
    fontSize: 18,
  }
}

function docIconStyle(tag: string): React.CSSProperties {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    DECK: { bg: '#0F2A3A', border: '#57ACAF40', text: '#57ACAF' },
    TECH: { bg: '#1A1530', border: '#8B5CF640', text: '#8B5CF6' },
    BRIEF: { bg: '#0A2015', border: '#10B98140', text: '#10B981' },
    BRAND: { bg: '#1A1A0A', border: '#EAB30840', text: '#EAB308' },
  }
  const c = colorMap[tag] || colorMap.BRIEF
  return {
    width: 40,
    height: 40,
    background: c.bg,
    border: '1px solid ' + c.border,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
    fontWeight: 700,
    color: c.text,
    letterSpacing: 0.5,
    flexShrink: 0,
  }
}

// ─── Team styles ─────────────────────────────────────────────────────────────

const teamCardStyle: React.CSSProperties = {
  background: '#0D1B2A',
  border: '1px solid #1C3042',
  borderRadius: 12,
  padding: 20,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

function teamAvatarStyle(color: string): React.CSSProperties {
  return {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: `${color}15`,
    border: `1px solid ${color}30`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 16,
    fontWeight: 700,
    color,
    fontFamily: "'Trebuchet MS', sans-serif",
    letterSpacing: 1,
    flexShrink: 0,
  }
}

const teamRoleStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: "'Trebuchet MS', sans-serif",
  color: '#57ACAF',
  fontWeight: 600,
}

const teamBioStyle: React.CSSProperties = {
  fontSize: 12,
  fontFamily: "'Trebuchet MS', sans-serif",
  color: '#6A8899',
  lineHeight: 1.6,
}

function teamTagStyle(color: string): React.CSSProperties {
  return {
    fontSize: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
    padding: '3px 10px',
    borderRadius: 12,
    background: `${color}10`,
    border: `1px solid ${color}25`,
    color,
    fontWeight: 600,
    letterSpacing: 0.5,
  }
}

// ─── Main styles ─────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    background: '#07111E',
    fontFamily: "'Georgia', serif",
    color: '#FFFFFF',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    borderBottom: '1px solid #1C3042',
    padding: '0 32px',
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: '#07111E',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    letterSpacing: '-0.5px',
  },
  badge: {
    background: '#0D1B2A',
    border: '1px solid #1C3042',
    borderRadius: 20,
    padding: '4px 14px',
    fontSize: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
    letterSpacing: 2,
    color: '#57ACAF',
    fontWeight: 700,
  },
  statsStrip: {
    borderBottom: '1px solid #1C3042',
    display: 'flex',
    overflowX: 'auto',
    background: '#0D1B2A',
  },
  statItem: {
    padding: '16px 28px',
    borderRight: '1px solid #1C3042',
    flexShrink: 0,
    minWidth: 120,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 700,
    lineHeight: 1,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#6A8899',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  main: {
    flex: 1,
    display: 'flex',
    maxWidth: 1100,
    width: '100%',
    margin: '0 auto',
    padding: '0 24px',
    gap: 24,
  },
  sidebar: {
    width: 240,
    flexShrink: 0,
    paddingTop: 28,
  },
  sideLabel: {
    fontSize: 9,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#3A5060',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 12,
    paddingLeft: 2,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#3A5060',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  askArea: {
    flex: 1,
    paddingTop: 28,
    display: 'flex',
    flexDirection: 'column',
  },
  welcome: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '40px 0',
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    background: '#0D1B2A',
    border: '1px solid #1C3042',
    borderRadius: 16,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
  },
  welcomeSub: {
    fontSize: 13,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#4A6070',
    lineHeight: 1.6,
    maxWidth: 420,
    marginBottom: 32,
  },
  suggestions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    maxWidth: 560,
  },
  sugBtn: {
    background: '#0D1B2A',
    border: '1px solid #1C3042',
    borderRadius: 20,
    padding: '8px 16px',
    fontSize: 12,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#A8BFC8',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 16,
  },
  userMsg: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  userBubble: {
    background: '#0D1B2A',
    border: '1px solid #1C3042',
    borderRadius: '16px 16px 4px 16px',
    padding: '12px 18px',
    maxWidth: '75%',
    fontSize: 14,
    fontFamily: "'Trebuchet MS', sans-serif",
    lineHeight: 1.6,
  },
  asstMsg: {
    display: 'flex',
    gap: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  asstAvatar: {
    width: 32,
    height: 32,
    background: '#57ACAF',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    flexShrink: 0,
    marginTop: 2,
  },
  asstBubble: {
    flex: 1,
    fontSize: 14,
    fontFamily: "'Trebuchet MS', sans-serif",
    lineHeight: 1.7,
    color: '#C8D8E4',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: '#57ACAF',
    display: 'inline-block',
    margin: '0 2px',
  },
  inputBar: {
    borderTop: '1px solid #1C3042',
    paddingTop: 16,
    paddingBottom: 24,
    display: 'flex',
    gap: 10,
  },
  inputBox: {
    flex: 1,
    background: '#0D1B2A',
    border: '1px solid #1C3042',
    borderRadius: 12,
    padding: '12px 18px',
    fontSize: 14,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#FFFFFF',
    outline: 'none',
  },
  docsArea: {
    flex: 1,
    paddingTop: 28,
  },
  docCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    background: '#0D1B2A',
    border: '1px solid #1C3042',
    borderRadius: 10,
    marginBottom: 8,
  },
  disclaimer: {
    borderTop: '1px solid #1C3042',
    padding: '12px 32px',
    fontSize: 10,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#2A3F52',
    textAlign: 'center',
  },
}
