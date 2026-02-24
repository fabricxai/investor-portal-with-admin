'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/admin/Sidebar'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  if (isLoginPage) {
    return <div className="admin-dark">{children}</div>
  }

  return (
    <div className="admin-dark flex min-h-screen" style={{ background: '#07111E', color: '#E8F0F8' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ background: '#07111E' }}>
        {children}
      </main>
    </div>
  )
}
