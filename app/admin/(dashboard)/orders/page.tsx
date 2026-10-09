"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { DataTable } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { useFilters } from '@/hooks/use-filters'
import { usePagination } from '@/hooks/use-pagination'
import { ordersApi } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { Search } from 'lucide-react'

interface Order {
  id: string
  status: string
  totalAmount: number
  orderType: string
  placedAt: string
  customer: {
    firstName: string
    lastName?: string
    phone: string
  }
  orderItems: Array<{
    id: string
    quantity: number
    totalPrice: number
    menuItem: {
      name: string
    }
  }>
  payment?: {
    method: string
    status: string
  }
}

const orderStatuses = ['NEW', 'PAID', 'COOKING', 'READY', 'COMPLETED', 'CANCELED']

export default function AdminOrdersPage() {
  const t = useTranslations('admin.orders')
  const tCommon = useTranslations('admin.common')
  const tActions = useTranslations('admin.actions')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getOrders()
      setOrders(data)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast({
        title: tCommon('error'),
        description: 'Тапсырыстарды жүктеу сәтсіз аяқталды',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [tCommon])

  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateOrderStatus(orderId, newStatus)
      toast({
        title: tCommon('success'),
        description: 'Тапсырыс статусы жаңартылды',
      })
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ))
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Тапсырыс статусын жаңарту сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }, [tCommon])

  // Filter orders with memoization
  const filteredOrders = useMemo(() => {
    if (!searchQuery) return orders
    const query = searchQuery.toLowerCase()
    return orders.filter((order) => {
      return (
        order.id.toLowerCase().includes(query) ||
        order.customer.firstName.toLowerCase().includes(query) ||
        order.customer.phone.includes(query)
      )
    })
  }, [orders, searchQuery])

  const { filters, setFilter, filteredData } = useFilters<Order>(filteredOrders, {
    status: {
      filterFn: (item, value) => !value || value === 'all' || item.status === value,
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
      key: 'id',
      header: t('number'),
      render: (order: Order) => (
        <span className="font-medium">{order.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'customer',
      header: t('customer'),
      render: (order: Order) => (
        <div>
          <p className="font-medium">{order.customer.firstName} {order.customer.lastName || ''}</p>
          <p className="text-xs text-muted-foreground">{order.customer.phone}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: t('items'),
      render: (order: Order) => `${order.orderItems.length} ${t('items')}`,
    },
    {
      key: 'totalAmount',
      header: t('amount'),
      render: (order: Order) => `${order.totalAmount.toFixed(0)} ₸`,
    },
    {
      key: 'status',
      header: t('status'),
      render: (order: Order) => <StatusBadge status={order.status} />,
    },
    {
      key: 'placedAt',
      header: t('date'),
      render: (order: Order) => format(new Date(order.placedAt), 'MMM d, yyyy HH:mm'),
    },
    {
      key: 'actions',
      header: t('changeStatus'),
      render: (order: Order) => (
        <Select
          value={order.status}
          onValueChange={(value) => updateOrderStatus(order.id, value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {orderStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(status.toLowerCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ], [t, updateOrderStatus])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('filter')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Тапсырыс ID, клиент аты немесе телефон бойынша іздеу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilter('status', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Барлық статустар</SelectItem>
                {orderStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(status.toLowerCase())}
                  </SelectItem>
                ))}
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
            emptyMessage={t('noOrders')}
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
