"use client"

import { usePathname } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'
import { AdminIntlProvider } from '@/components/admin/intl-provider'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // For login page, don't wrap - it has its own layout with SessionProvider
  if (pathname === '/admin/login' || pathname?.startsWith('/admin/login')) {
    return (
      <AdminIntlProvider>
        {children}
      </AdminIntlProvider>
    )
  }

  // For other pages, provide SessionProvider and IntlProvider
  // Auth checks are done in (dashboard)/layout.tsx
  return (
    <SessionProvider>
      <AdminIntlProvider>
        {children}
      </AdminIntlProvider>
    </SessionProvider>
  )
}

