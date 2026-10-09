"use client"

import { SessionProvider } from 'next-auth/react'
import { AdminIntlProvider } from '@/components/admin/intl-provider'

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <AdminIntlProvider>
        {children}
      </AdminIntlProvider>
    </SessionProvider>
  )
}
