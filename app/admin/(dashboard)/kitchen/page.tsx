"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { ordersApi } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { CheckCircle2, Clock, ChefHat, Play } from 'lucide-react'

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
      category?: {
        name: string
      } | null
    }
  }>
}

export default function KitchenPage() {
  const t = useTranslations('admin.kitchen')
  const tCommon = useTranslations('admin.common')
  
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrders()
    // Обновляем каждые 10 секунд
    const interval = setInterval(loadOrders, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true)
      const data = await ordersApi.getOrders()
      // Фильтруем заказы со статусом PAID (оплаченные, готовы к приготовлению) и COOKING (готовятся)
      const kitchenOrders = data.filter((order: Order) => 
        order.status === 'COOKING' || order.status === 'PAID'
      )
      // Сортируем: сначала COOKING, потом PAID, затем по времени
      kitchenOrders.sort((a, b) => {
        if (a.status === 'COOKING' && b.status !== 'COOKING') return -1
        if (a.status !== 'COOKING' && b.status === 'COOKING') return 1
        return new Date(a.placedAt).getTime() - new Date(b.placedAt).getTime()
      })
      setOrders(kitchenOrders)
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

  const startCooking = useCallback(async (orderId: string) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'COOKING')
      toast({
        title: tCommon('success'),
        description: 'Тапсырыс дайындалуға басталды',
      })
      // Обновляем статус в списке
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: 'COOKING' } : order
      ))
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Тапсырыс статусын жаңарту сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }, [tCommon])

  const markAsReady = useCallback(async (orderId: string) => {
    try {
      await ordersApi.updateOrderStatus(orderId, 'READY')
      toast({
        title: tCommon('success'),
        description: 'Тапсырыс дайын деп белгіленді',
      })
      // Удаляем заказ из списка
      setOrders(prev => prev.filter(order => order.id !== orderId))
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Тапсырыс статусын жаңарту сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }, [tCommon])

  // Группируем заказы по времени
  const groupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {}
    orders.forEach(order => {
      const time = format(new Date(order.placedAt), 'HH:mm')
      if (!groups[time]) {
        groups[time] = []
      }
      groups[time].push(order)
    })
    return groups
  }, [orders])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center py-8">{tCommon('loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <ChefHat className="h-10 w-10" />
            {t('title')}
          </h1>
          <p className="text-muted-foreground mt-2">{t('description')}</p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          {orders.length} {t('activeOrders')}
        </Badge>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-xl text-muted-foreground">{t('noOrders')}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Object.entries(groupedOrders)
            .sort(([timeA], [timeB]) => timeA.localeCompare(timeB))
            .map(([time, timeOrders]) => (
              <div key={time} className="space-y-4">
                <h2 className="text-2xl font-semibold text-muted-foreground sticky top-0 bg-background py-2">
                  {time}
                </h2>
                {timeOrders.map((order) => (
                  <Card key={order.id} className="border-2 border-primary">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {t('order')} #{order.id.slice(0, 8)}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {format(new Date(order.placedAt), 'HH:mm:ss')}
                          </p>
                        </div>
                        <Badge variant="default" className="text-sm">
                          {order.orderType === 'PICKUP' ? t('pickup') : 
                           order.orderType === 'DINE_IN' ? t('dineIn') : 
                           t('delivery')}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Информация о клиенте */}
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="font-medium">
                          {order.customer.firstName} {order.customer.lastName || ''}
                        </p>
                        <p className="text-sm text-muted-foreground">{order.customer.phone}</p>
                      </div>

                      {/* Список блюд */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-sm">{t('items')}:</h3>
                        <div className="space-y-1">
                          {order.orderItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center p-2 bg-muted rounded"
                            >
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.menuItem.name}</p>
                                {item.menuItem.category && (
                                  <p className="text-xs text-muted-foreground">
                                    {item.menuItem.category.name}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="ml-2">
                                x{item.quantity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Сумма */}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="font-semibold">{t('total')}:</span>
                        <span className="text-lg font-bold">{order.totalAmount.toFixed(0)} ₸</span>
                      </div>

                      {/* Кнопки действий */}
                      <div className="space-y-2">
                        {order.status === 'PAID' && (
                          <Button
                            onClick={() => startCooking(order.id)}
                            className="w-full"
                            size="lg"
                            variant="default"
                          >
                            <ChefHat className="mr-2 h-5 w-5" />
                            {t('startCooking')}
                          </Button>
                        )}
                        {order.status === 'COOKING' && (
                          <Button
                            onClick={() => markAsReady(order.id)}
                            className="w-full"
                            size="lg"
                          >
                            <CheckCircle2 className="mr-2 h-5 w-5" />
                            {t('markAsReady')}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ))}
        </div>
      )}
    </div>
  )
}

