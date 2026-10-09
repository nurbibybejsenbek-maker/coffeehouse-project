"use client"

import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Calendar, Users, DollarSign, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { SalesChart } from '@/components/admin/sales-chart'

interface DashboardContentProps {
  session: { user?: { name?: string | null } } | null
  todayOrders: number
  weekOrders: number
  monthOrders: number
  todayRev: number
  weekRev: number
  monthRev: number
  totalReservations: number
  totalCustomers: number
  newCustomers: number
  topProductsWithDetails: Array<{
    menuItemId: string
    menuItem: { name: string; image: string | null } | null
    totalSold: number
  }>
  salesData: Array<{
    placedAt: Date | string
    totalAmount: number
  }>
  recentOrders: Array<{
    id: string
    placedAt: Date | string
    totalAmount: number
    status: string
    customer: { firstName: string | null } | null
    orderItems: Array<unknown>
  }>
}

export function DashboardContent({
  session,
  todayOrders,
  weekOrders,
  monthOrders,
  todayRev,
  weekRev,
  monthRev,
  totalReservations,
  totalCustomers,
  newCustomers,
  topProductsWithDetails,
  salesData,
  recentOrders,
}: DashboardContentProps) {
  const t = useTranslations('admin.dashboard')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('welcome')}, {session?.user?.name || 'Админ'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('orders.today')}</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayOrders}</div>
            <p className="text-xs text-muted-foreground">
              {weekOrders} {t('week')} • {monthOrders} {t('month')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('revenue.today')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayRev.toFixed(0)} ₸</div>
            <p className="text-xs text-muted-foreground">
              {weekRev.toFixed(0)} ₸ {t('week')} • {monthRev.toFixed(0)} ₸ {t('month')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('reservations')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReservations}</div>
            <p className="text-xs text-muted-foreground">Жалпы брондаулар</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('users.title')}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              {newCustomers} {t('users.new')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('salesChart.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart data={salesData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('topProducts.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProductsWithDetails.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('topProducts.noData')}</p>
            ) : (
              <div className="space-y-4">
                {topProductsWithDetails.map((item, index) => (
                  <div key={item.menuItemId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{item.menuItem?.name || 'Белгісіз'}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.totalSold} сатылды
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions and Recent Orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Жылдам әрекеттер</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/admin/orders">
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Тапсырыстарды басқару
              </Button>
            </Link>
            <Link href="/admin/reservations">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="mr-2 h-4 w-4" />
                Брондауларды басқару
              </Button>
            </Link>
            <Link href="/admin/menu">
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                Мәзірді басқару
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Соңғы тапсырыстар</CardTitle>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">Тапсырыстар жоқ</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {order.customer?.firstName || 'Қонақ'}
                      </p>
                      <p className="text-muted-foreground">
                        {order.orderItems.length} элемент • {format(new Date(order.placedAt), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{order.totalAmount.toFixed(0)} ₸</p>
                      <p className="text-muted-foreground text-xs">{order.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

