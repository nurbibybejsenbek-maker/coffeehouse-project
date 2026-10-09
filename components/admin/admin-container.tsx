"use client"

import { ReactNode } from 'react'
import { AdminSidebar } from './admin-sidebar'

interface AdminContainerProps {
  children: ReactNode
}

export function AdminContainer({ children }: AdminContainerProps) {
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}

