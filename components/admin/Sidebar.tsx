'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BarChart3, Users, UserCheck, TrendingUp, FolderOpen, Bot, LogOut, Megaphone,
  Target, Compass, Columns3, Sparkles, Clock, Mail
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  iconColor?: string
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    title: 'Modules',
    items: [
      { href: '/admin', label: 'Overview', icon: BarChart3, iconColor: '#57ACAF' },
      { href: '/admin/investors', label: 'Potential Investors', icon: Users, iconColor: '#8B5CF6' },
      { href: '/admin/actual-investors', label: 'Actual Investors', icon: UserCheck, iconColor: '#10B981' },
      { href: '/admin/metrics', label: 'Metrics', icon: TrendingUp, iconColor: '#EAB308' },
      { href: '/admin/documents', label: 'Documents', icon: FolderOpen, iconColor: '#F97316' },
      { href: '/admin/investor-updates', label: 'Investor Updates', icon: Megaphone, iconColor: '#EC4899' },
      { href: '/admin/copilot', label: 'Copilot', icon: Bot, iconColor: '#57ACAF' },
    ],
  },
  {
    title: 'Outreach',
    items: [
      { href: '/admin/outreach', label: 'Dashboard', icon: Target, iconColor: '#57ACAF' },
      { href: '/admin/outreach/discover', label: 'Discover', icon: Compass, iconColor: '#EF4444' },
      { href: '/admin/outreach/pipeline', label: 'Pipeline', icon: Columns3, iconColor: '#8B5CF6' },
      { href: '/admin/outreach/compose', label: 'AI Outreach', icon: Sparkles, iconColor: '#10B981' },
      { href: '/admin/outreach/followups', label: 'Follow-up Queue', icon: Clock, iconColor: '#EAB308' },
      { href: '/admin/outreach/email-composer', label: 'Email Composer', icon: Mail, iconColor: '#57ACAF' },
    ],
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="w-64 min-h-screen flex flex-col" style={{ background: '#060E1A', borderRight: '1px solid #0F1E2A' }}>
      {/* Gradient accent bar at top */}
      <div className="admin-gradient-bar" />

      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <img
          src="https://devppcpvuwneduuibygh.supabase.co/storage/v1/object/public/investor-portal/logo/fabricxai-logo-dark.png"
          alt="fabricXai"
          style={{ height: 24 }}
        />
        <p className="font-mono" style={{ fontSize: 9, letterSpacing: 3, textTransform: 'uppercase', color: '#3A5060', marginTop: 6, fontWeight: 600 }}>
          Investor Admin
        </p>
      </div>

      {/* Subtle divider */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #152238, transparent)', margin: '0 16px' }} />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.title && (
              <div className="px-3 pt-5 pb-2">
                <p className="font-mono" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 3, textTransform: 'uppercase', color: '#2A3F52' }}>
                  {group.title}
                </p>
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150',
                      active
                        ? 'admin-nav-active text-[#E8F0F8]'
                        : 'text-[#4A6578] hover:text-[#8FAAB8] hover:bg-[#0A1525]'
                    )}
                    style={active ? { background: `${item.iconColor}10`, marginLeft: 1 } : undefined}
                  >
                    <div
                      className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-all duration-150"
                      style={active ? {
                        background: `${item.iconColor}18`,
                        boxShadow: `0 0 10px ${item.iconColor}15`,
                      } : undefined}
                    >
                      <Icon
                        className="h-[15px] w-[15px]"
                        style={{ color: active ? item.iconColor : '#2D4455' }}
                      />
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)' }}>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Portal link */}
      <div style={{ padding: '0 12px', marginBottom: 4 }}>
        <Link
          href="/portal"
          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-colors"
          style={{ color: '#2D4455' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#57ACAF'; e.currentTarget.style.background = '#57ACAF08' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#2D4455'; e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ fontSize: 12 }}>&larr;</span>
          <span style={{ fontFamily: 'var(--font-body)' }}>Investor Portal</span>
        </Link>
      </div>

      {/* Divider before user card */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, #0F1E2A, transparent)', margin: '0 16px' }} />

      {/* User profile */}
      <div className="px-4 py-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
            style={{
              background: 'linear-gradient(135deg, #57ACAF18, #57ACAF08)',
              border: '1px solid #57ACAF30',
              color: '#57ACAF',
            }}
          >
            AR
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: '#C8D8E4' }}>Arifur Rahman</p>
            <p style={{ fontSize: 11, color: '#2D4455', fontFamily: 'var(--font-mono)' }}>CEO</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all w-full"
          style={{ color: '#2D4455' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = '#EF444410' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#2D4455'; e.currentTarget.style.background = 'transparent' }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
