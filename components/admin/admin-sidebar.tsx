"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ShoppingCart,
  Calendar,
  UtensilsCrossed,
  Star,
  Users,
  FileText,
  LogOut,
  ChefHat,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

export function AdminSidebar() {
  const t = useTranslations('admin')
  const pathname = usePathname()

  const menuItems = [
    { href: '/admin', label: t('dashboard.title'), icon: LayoutDashboard, key: 'dashboard' },
    { href: '/admin/kitchen', label: t('kitchen.title'), icon: ChefHat, key: 'kitchen' },
    { href: '/admin/orders', label: t('orders.title'), icon: ShoppingCart, key: 'orders' },
    { href: '/admin/reservations', label: t('reservations.title'), icon: Calendar, key: 'reservations' },
    { href: '/admin/menu', label: t('menu.title'), icon: UtensilsCrossed, key: 'menu' },
    { href: '/admin/reviews', label: t('reviews.title'), icon: Star, key: 'reviews' },
    { href: '/admin/users', label: t('users.title'), icon: Users, key: 'users' },
    { href: '/admin/api', label: 'API Документация', icon: FileText, key: 'api' },
  ]

  return (
    <aside className="w-64 bg-background border-r h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold">CoffeeHouse Админ</h2>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className="h-5 w-5 mr-3" />
          Шығу
        </Button>
      </div>
    </aside>
  )
}

