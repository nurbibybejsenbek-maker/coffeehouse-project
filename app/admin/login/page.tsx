"use client"

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'

export default function AdminLoginPage() {
  const t = useTranslations('admin')
  const router = useRouter()
  const { data: session, status } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const userRole = (session.user as any).role
      if (userRole === 'ADMIN' || userRole === 'STAFF') {
        router.push('/admin')
      }
    }
  }, [session, status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: t('common.error'),
          description: 'Email немесе құпия сөз дұрыс емес',
          variant: 'destructive',
        })
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (error) {
      toast({
        title: t('common.error'),
        description: 'Кіру сәтсіз аяқталды',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Админ панеліне кіру</CardTitle>
          <CardDescription>Басқару панеліне кіру үшін жүйеге кіріңіз</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@coffeehouse.kz"
              />
            </div>
            <div>
              <Label htmlFor="password">Құпия сөз</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Құпия сөзді енгізіңіз"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Кіруде...' : 'Кіру'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
