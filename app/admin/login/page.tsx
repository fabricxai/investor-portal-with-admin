'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Button from '@/components/ui/Button'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/admin'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Invalid credentials')
        return
      }

      router.push(redirect)
      router.refresh()
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="admin-section-label block mb-2">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="admin-input w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-200"
          style={{ borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }}
          placeholder="admin@fabricxai.com"
          onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1), 0 0 12px rgba(87,172,175,0.08)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>

      <div>
        <label htmlFor="password" className="admin-section-label block mb-2">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="admin-input w-full rounded-lg border px-4 py-2.5 text-sm transition-all duration-200"
          style={{ borderColor: '#152238', background: '#0A1525', color: '#E8F0F8' }}
          placeholder="Enter password"
          onFocus={e => { e.currentTarget.style.borderColor = '#57ACAF'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(87,172,175,0.1), 0 0 12px rgba(87,172,175,0.08)' }}
          onBlur={e => { e.currentTarget.style.borderColor = '#152238'; e.currentTarget.style.boxShadow = 'none' }}
        />
      </div>

      {error && (
        <div className="px-3 py-2.5 rounded-lg text-sm"
          style={{ background: '#EF444412', border: '1px solid #EF444430', color: '#EF4444' }}>
          {error}
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        Sign In
      </Button>
    </form>
  )
}

export default function AdminLogin() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07111E' }}>
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(87,172,175,0.04) 0%, transparent 70%)',
        }}
      />

      <div className="w-full max-w-md px-4 relative">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0C1929', border: '1px solid #152238' }}>
          {/* Gradient accent bar */}
          <div className="admin-gradient-bar" />

          <div className="p-8">
            {/* fabricXai logo */}
            <div className="text-center mb-8">
              <a href="https://fabricxai.com" target="_blank" rel="noopener noreferrer" className="inline-block">
                <img
                  src="https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png"
                  alt="fabricXai"
                  style={{ height: 32 }}
                />
              </a>
              <p className="mt-3 text-sm" style={{ color: '#4A6578' }}>Admin Portal</p>
            </div>

            <Suspense fallback={<div className="h-64" />}>
              <LoginForm />
            </Suspense>
          </div>
        </div>

        {/* Subtle footer */}
        <p className="text-center mt-6 font-mono" style={{ fontSize: 10, color: '#2D4455', letterSpacing: 1 }}>
          Secure access for fabricXai team only
        </p>
      </div>
    </div>
  )
}
