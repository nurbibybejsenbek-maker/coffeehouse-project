"use client"

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export function useAdminAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session || !session.user) {
      router.push('/admin/login')
      return
    }

    const userRole = (session.user as any).role
    if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
      router.push('/admin/login')
    }
  }, [session, status, router])

  return {
    session,
    isLoading: status === 'loading',
    isAuthenticated: !!session,
    isAdmin: (session?.user as any)?.role === 'ADMIN' || (session?.user as any)?.role === 'STAFF',
    user: session?.user,
  }
}

