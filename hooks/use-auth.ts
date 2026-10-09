import { useState, useEffect, useRef } from 'react'
import { authApi } from '@/lib/api-client'

interface Customer {
  id: string
  firstName: string
  lastName?: string
  email: string
  phone: string
}

export function useAuth() {
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [loading, setLoading] = useState(true)
  const hasChecked = useRef(false)

  useEffect(() => {
    // Предотвращаем двойной запрос в React Strict Mode
    if (!hasChecked.current) {
      hasChecked.current = true
      checkAuth()
    }
  }, [])

  const checkAuth = async () => {
    try {
      const data = await authApi.me()
      setCustomer(data.customer || null)
    } catch (error) {
      setCustomer(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
      setCustomer(null)
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return {
    customer,
    loading,
    isAuthenticated: !!customer,
    logout,
    refresh: checkAuth,
  }
}
