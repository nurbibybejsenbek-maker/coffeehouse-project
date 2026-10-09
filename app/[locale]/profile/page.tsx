"use client"

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { authApi, ordersApi, reservationsApi, type Order, type Reservation } from '@/lib/api-client'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'
import { ShoppingBag, Calendar, User, LogOut, Package, MapPin } from 'lucide-react'

// Казахские названия месяцев
const kkMonths = [
  'Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
  'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'
]

// Функция для форматирования даты в казахском стиле: "Қараша 6, 12:30"
function formatDateKazakh(date: Date | string, time?: string): string {
  // Если дата в формате строки 'YYYY-MM-DD', добавляем время для правильного парсинга
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const dateObj = new Date(dateStr + 'T00:00:00')
  const month = kkMonths[dateObj.getMonth()]
  const day = dateObj.getDate()
  
  if (time) {
    return `${month} ${day}, ${time}`
  }
  return `${month} ${day}`
}

export default function ProfilePage() {
  const t = useTranslations('profile')
  const tAuth = useTranslations('auth')
  const tOrder = useTranslations('order')
  const tReservation = useTranslations('reservation')
  const locale = useLocale()
  const router = useRouter()
  const [customer, setCustomer] = useState<any>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations'>('orders')

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      
      // Загружаем информацию о пользователе через GET /api/auth/me
      const meResponse = await authApi.me()
      setCustomer(meResponse.customer)

      // Загружаем список заказов через GET /api/orders
      const ordersData = await ordersApi.getOrders()
      setOrders(ordersData)

      // Загружаем список резерваций через GET /api/reservations
      const reservationsData = await reservationsApi.getReservations()
      setReservations(reservationsData)
    } catch (error: any) {
      console.error('Error loading profile:', error)
      if (error.status === 401) {
        // Не авторизован, перенаправляем на страницу входа
        router.push(`/${locale}/login`)
      } else {
        toast({
          title: t('error') || 'Error',
          description: error.message || 'Failed to load profile',
          variant: 'destructive',
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Используем POST /api/auth/logout
      await authApi.logout()
      router.push(`/${locale}/login`)
      toast({
        title: tAuth('logout'),
        description: 'Successfully logged out',
      })
    } catch (error: any) {
      console.error('Error logging out:', error)
      toast({
        title: t('error') || 'Error',
        description: error.message || 'Failed to logout',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">{t('loading') || 'Loading...'}</div>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('notAuthorized') || 'Not Authorized'}</h1>
          <Link href={`/${locale}/login`}>
            <Button>{tAuth('login')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">{t('title') || 'My Profile'}</h1>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {tAuth('logout')}
          </Button>
        </div>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {t('customerInfo') || 'Customer Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-semibold">{tAuth('firstName') || 'Name'}:</span>{' '}
              {customer.firstName} {customer.lastName || ''}
            </p>
            <p>
              <span className="font-semibold">{tAuth('email') || 'Email'}:</span>{' '}
              {customer.email || '-'}
            </p>
            <p>
              <span className="font-semibold">{tAuth('phone') || 'Phone'}:</span>{' '}
              {customer.phone}
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="flex gap-4 border-b">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'orders'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <ShoppingBag className="inline mr-2 h-4 w-4" />
            {t('orders') || 'Orders'} ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === 'reservations'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Calendar className="inline mr-2 h-4 w-4" />
            {t('reservations') || 'Reservations'} ({reservations.length})
          </button>
        </div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('noOrders') || 'No orders yet'}</p>
                  <Link href={`/${locale}/menu`}>
                    <Button className="mt-4">{t('startShopping') || 'Start Shopping'}</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{tOrder('orderNumber')}: {order.id.slice(0, 8)}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(order.placedAt), 'PPP p')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-lg">{order.totalAmount.toFixed(0)} ₸</p>
                        <p className="text-sm text-muted-foreground">{order.status}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-semibold">{tOrder('orderType') || 'Order Type'}:</span>{' '}
                          {order.orderType === 'PICKUP' ? tOrder('pickup') :
                           order.orderType === 'DINE_IN' ? tOrder('dineIn') :
                           order.orderType === 'DELIVERY' ? tOrder('delivery') : order.orderType}
                        </p>
                        <p className="text-sm">
                          <span className="font-semibold">{tOrder('orderItems') || 'Items'}:</span>{' '}
                          {order.orderItems.length}
                        </p>
                      </div>
                      <Link href={`/${locale}/order/${order.id}`}>
                        <Button variant="outline">{t('viewDetails') || 'View Details'}</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className="space-y-4">
            {reservations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>{t('noReservations') || 'No reservations yet'}</p>
                  <Link href={`/${locale}/reservation`}>
                    <Button className="mt-4">{t('makeReservation') || 'Make Reservation'}</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              reservations.map((reservation) => (
                <Card key={reservation.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          {tReservation('reservationDetails')}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {locale === 'kk' 
                            ? formatDateKazakh(reservation.date, reservation.time)
                            : `${format(new Date(reservation.date), 'PPP')} ${reservation.time}`
                          }
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{reservation.status}</p>
                        <p className="text-sm text-muted-foreground">
                          {reservation.partySize} {tReservation('guests')}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="space-y-1">
                        {reservation.table && (
                          <p className="text-sm">
                            <span className="font-semibold">{tReservation('tableNumber') || 'Table Number'}:</span>{' '}
                            {reservation.table.number}
                          </p>
                        )}
                        {reservation.note && (
                          <p className="text-sm">
                            <span className="font-semibold">{tReservation('note') || 'Note'}:</span>{' '}
                            {reservation.note}
                          </p>
                        )}
                      </div>
                      <Link href={`/${locale}/reservation/${reservation.id}`}>
                        <Button variant="outline">{t('viewDetails') || 'View Details'}</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

