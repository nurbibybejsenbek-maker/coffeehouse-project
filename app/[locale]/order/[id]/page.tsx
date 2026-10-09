"use client"

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ordersApi, type Order } from '@/lib/api-client'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

export default function OrderDetailsPage() {
  const t = useTranslations('order')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await ordersApi.getOrder(orderId)
        setOrder(data)
      } catch (error: any) {
        console.error('Error fetching order:', error)
        toast({
          title: t('error'),
          description: error.message || 'Failed to load order details',
          variant: 'destructive',
        })
        router.push(`/${locale}`)
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId, router, locale, t])

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('orderNotFound')}</h1>
          <Link href={`/${locale}`}>
            <Button>{t('goToHome')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">{t('orderNumber')}: {order.id.slice(0, 8)}</h1>
          <Link href={`/${locale}`}>
            <Button variant="outline">{t('backToHome')}</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('orderInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('status')}</p>
                <p className="font-semibold">{order.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('orderType')}</p>
                <p className="font-semibold">
                  {order.orderType === 'PICKUP' ? t('pickup') :
                   order.orderType === 'DINE_IN' ? t('dineIn') :
                   order.orderType === 'DELIVERY' ? t('delivery') : order.orderType}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('placedAt')}</p>
                <p className="font-semibold">
                  {format(new Date(order.placedAt), 'PPP p')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('totalAmount')}</p>
                <p className="font-semibold text-2xl">{order.totalAmount.toFixed(0)} ₸</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('customerInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><span className="font-semibold">{t('name')}:</span> {order.customer.firstName} {order.customer.lastName || ''}</p>
            <p><span className="font-semibold">{t('phone')}:</span> {order.customer.phone}</p>
            {order.customer.email && (
              <p><span className="font-semibold">{t('email')}:</span> {order.customer.email}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('orderItems')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.orderItems.map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-4">
                  <div>
                    <p className="font-semibold">{item.menuItem.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × {item.unitPrice.toFixed(0)} ₸
                    </p>
                  </div>
                  <p className="font-semibold">{item.totalPrice.toFixed(0)} ₸</p>
                </div>
              ))}
              <div className="flex justify-between items-center pt-4 border-t">
                <p className="text-lg font-semibold">{t('total')}</p>
                <p className="text-2xl font-bold">{order.totalAmount.toFixed(0)} ₸</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.payment && (
          <Card>
            <CardHeader>
              <CardTitle>{t('paymentInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p><span className="font-semibold">{t('method')}:</span> {
                order.payment.method === 'CASH' ? t('cash') :
                order.payment.method === 'CARD' ? t('card') :
                order.payment.method === 'KASPI' ? t('kaspi') :
                order.payment.method === 'PAYBOX' ? t('paybox') :
                order.payment.method === 'ONLINE' ? t('online') : order.payment.method
              }</p>
              <p><span className="font-semibold">{t('status')}:</span> {order.payment.status}</p>
              {order.payment.transactionId && (
                <p><span className="font-semibold">{t('transactionId')}:</span> {order.payment.transactionId}</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}



