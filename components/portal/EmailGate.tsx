'use client'

import { useState, useEffect } from 'react'

interface GateResult {
  passed: boolean
  type: 'new_visitor' | 'potential_investor' | 'actual_investor' | null
  name: string
  email: string
  // For potential investors with existing token
  token?: string
  tier?: number
  // For actual investors
  actualInvestorData?: {
    id: string
    name: string
    email: string
    invested_amount: number | null
    invested_date: string | null
    instrument: string | null
  }
}

interface EmailGateProps {
  onGatePass: (result: GateResult) => void
}

const LS_KEY = 'fabricxai_gate'

export default function EmailGate({ onGatePass }: EmailGateProps) {
  const [step, setStep] = useState<'email' | 'password' | 'temp_sent' | 'set_password'>('email')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [investorType, setInvestorType] = useState<string | null>(null)
  const [investorName, setInvestorName] = useState('')
  const [requirePasswordReset, setRequirePasswordReset] = useState(false)
  const [storedEmail, setStoredEmail] = useState('')

  // Check localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LS_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        if (data.name && data.email) {
          onGatePass({
            passed: true,
            type: data.type || 'new_visitor',
            name: data.name,
            email: data.email,
            token: data.token,
            tier: data.tier,
            actualInvestorData: data.actualInvestorData,
          })
          return
        }
      }
    } catch { /* ignore */ }
    setChecking(false)
  }, [onGatePass])

  if (checking) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingDot} />
      </div>
    )
  }

  // ─── Step 1: Email entry ──────────────────────────────────────────────────

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setError('')
    setLoading(true)

    try {
      // Check the email against the database
      const res = await fetch('/api/gate/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await res.json()

      if (data.type === 'actual_investor') {
        // Actual investor — need password
        setInvestorType('actual_investor')
        setInvestorName(data.name || name)

        if (!data.isPasswordSet) {
          // First time — send temp password automatically
          setStep('temp_sent')
          setStoredEmail(email.trim())
          await sendTempPassword()
        } else {
          setStep('password')
          setStoredEmail(email.trim())
        }
      } else if (data.type === 'potential_investor') {
        // Known potential investor — let them through
        const gateData = {
          name: data.name || name,
          email: email.trim(),
          type: 'potential_investor' as const,
          token: data.token,
          tier: data.tier,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem(LS_KEY, JSON.stringify(gateData))
        notifyAccess(name, email)
        onGatePass({ passed: true, ...gateData })
      } else {
        // New visitor — simple email gate
        const gateData = {
          name: name.trim(),
          email: email.trim(),
          type: 'new_visitor' as const,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem(LS_KEY, JSON.stringify(gateData))
        notifyAccess(name, email)
        onGatePass({ passed: true, ...gateData })
      }
    } catch {
      // On error, still let them through as new visitor (don't block)
      const gateData = {
        name: name.trim(),
        email: email.trim(),
        type: 'new_visitor' as const,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(LS_KEY, JSON.stringify(gateData))
      notifyAccess(name, email)
      onGatePass({ passed: true, ...gateData })
    } finally {
      setLoading(false)
    }
  }

  // ─── Step 2: Password login (actual investors) ────────────────────────────

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!password.trim()) return
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/gate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: storedEmail, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid password')
        setLoading(false)
        return
      }

      if (data.requirePasswordReset) {
        setRequirePasswordReset(true)
        setStep('set_password')
        setLoading(false)
        return
      }

      // Login success
      const gateData = {
        name: data.investor.name,
        email: storedEmail,
        type: 'actual_investor' as const,
        actualInvestorData: data.investor,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(LS_KEY, JSON.stringify(gateData))
      onGatePass({ passed: true, ...gateData })
    } catch {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ─── Send temp password ───────────────────────────────────────────────────

  async function sendTempPassword() {
    try {
      const res = await fetch('/api/gate/send-temp-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() || storedEmail }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to send temporary password')
      } else {
        setInfo('Temporary password sent to your email')
      }
    } catch {
      setError('Failed to send temporary password')
    }
  }

  // ─── Set new password ─────────────────────────────────────────────────────

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/gate/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: storedEmail, newPassword }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Failed to set password')
        setLoading(false)
        return
      }

      // Now log them in with the new password
      const loginRes = await fetch('/api/gate/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: storedEmail, password: newPassword }),
      })

      const loginData = await loginRes.json()

      const gateData = {
        name: loginData.investor?.name || investorName,
        email: storedEmail,
        type: 'actual_investor' as const,
        actualInvestorData: loginData.investor,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(LS_KEY, JSON.stringify(gateData))
      onGatePass({ passed: true, ...gateData })
    } catch {
      setError('Failed to set password')
    } finally {
      setLoading(false)
    }
  }

  // ─── Fire-and-forget notification ─────────────────────────────────────────

  function notifyAccess(name: string, email: string) {
    fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, timestamp: new Date().toISOString() }),
    }).catch(() => { /* silent fail */ })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={styles.container}>
      <div className="gate-card" style={styles.card}>
        {/* Logo */}
        <a href="https://fabricxai.com" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <img src="https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png" alt="fabricXai" style={{ height: 28 }} />
        </a>

        {step === 'email' && (
          <>
            <h1 style={styles.headline}>Investor Access Portal</h1>
            <p style={styles.subline}>
              Enter your details to access the fabricXai pitch deck, data room, and AI Q&A.
            </p>

            <form onSubmit={handleEmailSubmit} style={styles.form}>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <input
                type="email"
                required
                placeholder="Work Email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={styles.input}
              />

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" disabled={loading} style={styles.cta}>
                {loading ? 'Verifying...' : 'Access Portal →'}
              </button>
            </form>

            <p style={styles.disclaimer}>
              This portal is for accredited investors only. Your information is kept confidential.
            </p>
          </>
        )}

        {step === 'password' && (
          <>
            <h1 style={styles.headline}>Welcome Back, {investorName.split(' ')[0]}</h1>
            <p style={styles.subline}>
              Enter your password to access the fabricXai investor dashboard.
            </p>

            <form onSubmit={handlePasswordSubmit} style={styles.form}>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={styles.input}
                autoFocus
              />

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" disabled={loading} style={styles.cta}>
                {loading ? 'Logging in...' : 'Log In →'}
              </button>

              <button
                type="button"
                onClick={() => { setStep('temp_sent'); sendTempPassword() }}
                style={styles.linkBtn}
              >
                Forgot password? Send temporary password
              </button>
            </form>
          </>
        )}

        {step === 'temp_sent' && (
          <>
            <h1 style={styles.headline}>Check Your Email</h1>
            <p style={styles.subline}>
              We&apos;ve sent a temporary password to <strong style={{ color: '#57ACAF' }}>{storedEmail || email}</strong>.
              It expires in 30 minutes.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); setStep('password') }} style={styles.form}>
              {info && <div style={styles.info}>{info}</div>}
              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" style={styles.cta}>
                Enter Password →
              </button>

              <button
                type="button"
                onClick={sendTempPassword}
                style={styles.linkBtn}
              >
                Resend temporary password
              </button>
            </form>
          </>
        )}

        {step === 'set_password' && (
          <>
            <h1 style={styles.headline}>Set Your Password</h1>
            <p style={styles.subline}>
              {requirePasswordReset
                ? 'Please set a permanent password for your account.'
                : 'Create a secure password for your investor dashboard.'}
            </p>

            <form onSubmit={handleSetPassword} style={styles.form}>
              <input
                type="password"
                required
                placeholder="New Password (min 8 chars)"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={styles.input}
                autoFocus
              />
              <input
                type="password"
                required
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={styles.input}
              />

              {error && <div style={styles.error}>{error}</div>}

              <button type="submit" disabled={loading} style={styles.cta}>
                {loading ? 'Setting...' : 'Set Password & Continue →'}
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        input::placeholder { color: #2A3F52; }
        @media (max-width: 480px) {
          .gate-card { padding: 0 4px !important; }
          .gate-card h1 { font-size: 18px !important; }
          .gate-card input, .gate-card button { font-size: 14px !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#07111E',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Georgia', serif",
    color: '#FFFFFF',
    padding: 24,
  },
  loadingDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: '#57ACAF',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    textAlign: 'center' as const,
  },
  logo: {
    fontSize: 32,
    fontWeight: 700,
    letterSpacing: '-0.5px',
    marginBottom: 32,
  },
  headline: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    lineHeight: 1.3,
  },
  subline: {
    fontSize: 13,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#6A8899',
    lineHeight: 1.6,
    marginBottom: 28,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  input: {
    background: '#0D1B2A',
    border: '1px solid #1C3042',
    borderRadius: 10,
    padding: '14px 18px',
    fontSize: 14,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#FFFFFF',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
  },
  cta: {
    background: '#57ACAF',
    color: '#07111E',
    padding: '14px 28px',
    borderRadius: 10,
    fontSize: 14,
    fontFamily: "'Trebuchet MS', sans-serif",
    fontWeight: 700,
    cursor: 'pointer',
    border: 'none',
    marginTop: 4,
    transition: 'opacity 0.15s',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#57ACAF',
    fontSize: 12,
    fontFamily: "'Trebuchet MS', sans-serif",
    cursor: 'pointer',
    textDecoration: 'underline',
    marginTop: 4,
  },
  error: {
    fontSize: 12,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#EF4444',
    textAlign: 'left' as const,
  },
  info: {
    fontSize: 12,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#10B981',
    textAlign: 'left' as const,
  },
  disclaimer: {
    fontSize: 11,
    fontFamily: "'Trebuchet MS', sans-serif",
    color: '#2A3F52',
    marginTop: 20,
    lineHeight: 1.5,
  },
}
