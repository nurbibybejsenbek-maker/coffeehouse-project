"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/data-table'
import { Badge } from '@/components/ui/badge'
import { useFilters } from '@/hooks/use-filters'
import { usePagination } from '@/hooks/use-pagination'
import { toast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Search } from 'lucide-react'

interface User {
  id: string
  email: string
  username: string
  role: string
  createdAt: string
  updatedAt: string
}

export default function AdminUsersPage() {
  const t = useTranslations('admin.users')
  const tCommon = useTranslations('admin.common')
  
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error loading users:', error)
      toast({
        title: tCommon('error'),
        description: 'Пайдаланушыларды жүктеу сәтсіз аяқталды',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [tCommon])

  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      })

      if (!response.ok) throw new Error('Failed to update user role')

      toast({
        title: tCommon('success'),
        description: 'Пайдаланушы рөлі жаңартылды',
      })
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ))
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Пайдаланушы рөлін жаңарту сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }, [tCommon])

  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users
    const query = searchQuery.toLowerCase()
    return users.filter((user) => {
      return (
        user.email.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query)
      )
    })
  }, [users, searchQuery])

  const { filters, setFilter, filteredData } = useFilters<User>(filteredUsers, {
    role: {
      filterFn: (item, value) => !value || value === 'all' || item.role === value,
      defaultValue: 'all',
    },
  })

  const { currentPage, totalPages, paginatedData, goToPage, hasNextPage, hasPrevPage } =
    usePagination({
      totalItems: filteredData.length,
      itemsPerPage: 10,
    })

  const columns = useMemo(() => [
    {
      key: 'email',
      header: t('email'),
      render: (user: User) => <span className="font-medium">{user.email}</span>,
    },
    {
      key: 'username',
      header: t('name'),
      render: (user: User) => user.username,
    },
    {
      key: 'role',
      header: t('role'),
      render: (user: User) => (
        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
          {t(user.role.toLowerCase())}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: t('createdAt'),
      render: (user: User) => format(new Date(user.createdAt), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: t('changeRole'),
      render: (user: User) => (
        <Select
          value={user.role}
          onValueChange={(value) => updateUserRole(user.id, value)}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ADMIN">{t('admin')}</SelectItem>
            <SelectItem value="STAFF">{t('staff')}</SelectItem>
            <SelectItem value="USER">{t('user')}</SelectItem>
          </SelectContent>
        </Select>
      ),
    },
  ], [t, updateUserRole])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('search')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Email немесе пайдаланушы аты бойынша іздеу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.role}
              onValueChange={(value) => setFilter('role', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Рөл бойынша сүзгілеу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Барлық рөлдер</SelectItem>
                <SelectItem value="ADMIN">{t('admin')}</SelectItem>
                <SelectItem value="STAFF">{t('staff')}</SelectItem>
                <SelectItem value="USER">{t('user')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('list')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={paginatedData(filteredData)}
            columns={columns}
            loading={loading}
            emptyMessage={t('noUsers')}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {tCommon('page')} {currentPage} {tCommon('of')} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrevPage}
                >
                  Алдыңғы
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage}
                >
                  Келесі
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
