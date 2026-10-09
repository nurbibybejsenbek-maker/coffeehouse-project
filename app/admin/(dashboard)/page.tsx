import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { subDays, startOfDay, endOfDay } from 'date-fns'
import { DashboardContent } from '@/components/admin/dashboard-content'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfDay(subDays(now, 7))
  const monthStart = startOfDay(subDays(now, 30))

  // Get statistics
  const [
    totalOrders,
    todayOrders,
    weekOrders,
    monthOrders,
    totalRevenue,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    totalReservations,
    totalCustomers,
    newCustomers,
    recentOrders,
    topProducts,
    salesData,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({
      where: {
        placedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),
    prisma.order.count({
      where: {
        placedAt: {
          gte: weekStart,
        },
      },
    }),
    prisma.order.count({
      where: {
        placedAt: {
          gte: monthStart,
        },
      },
    }),
    prisma.order.aggregate({
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        placedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        placedAt: {
          gte: weekStart,
        },
      },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: {
        placedAt: {
          gte: monthStart,
        },
      },
      _sum: { totalAmount: true },
    }),
    prisma.reservation.count(),
    prisma.customer.count(),
    prisma.customer.count({
      where: {
        createdAt: {
          gte: monthStart,
        },
      },
    }),
    prisma.order.findMany({
      take: 5,
      orderBy: { placedAt: 'desc' },
      include: {
        customer: true,
        orderItems: {
          include: {
            menuItem: true,
          },
        },
      },
    }),
    prisma.orderItem.groupBy({
      by: ['menuItemId'],
      _sum: {
        quantity: true,
      },
      orderBy: {
        _sum: {
          quantity: 'desc',
        },
      },
      take: 5,
    }),
    prisma.order.findMany({
      where: {
        placedAt: {
          gte: monthStart,
        },
      },
      select: {
        placedAt: true,
        totalAmount: true,
      },
      orderBy: {
        placedAt: 'asc',
      },
    }),
  ])

  // Get top products with menu item details
  const topProductsWithDetails = await Promise.all(
    topProducts.map(async (item) => {
      const menuItem = await prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
        select: { name: true, image: true },
      })
      return {
        ...item,
        menuItem,
        totalSold: item._sum.quantity || 0,
      }
    })
  )

  const revenue = totalRevenue._sum.totalAmount || 0
  const todayRev = todayRevenue._sum.totalAmount || 0
  const weekRev = weekRevenue._sum.totalAmount || 0
  const monthRev = monthRevenue._sum.totalAmount || 0

  return (
    <DashboardContent
      session={session}
      todayOrders={todayOrders}
      weekOrders={weekOrders}
      monthOrders={monthOrders}
      todayRev={todayRev}
      weekRev={weekRev}
      monthRev={monthRev}
      totalReservations={totalReservations}
      totalCustomers={totalCustomers}
      newCustomers={newCustomers}
      topProductsWithDetails={topProductsWithDetails}
      salesData={salesData}
      recentOrders={recentOrders}
    />
  )
}
