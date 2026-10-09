"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, Coffee } from 'lucide-react'

export default function AdminNavbar() {
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/orders', label: 'Orders' },
    { href: '/admin/reservations', label: 'Reservations' },
    { href: '/admin/menu', label: 'Menu' },
    { href: '/admin/customers', label: 'Customers' },
    { href: '/admin/reviews', label: 'Reviews' },
    { href: '/admin/api', label: 'API Docs' },
  ]

  return (
    <nav className="border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/admin" className="flex items-center space-x-2">
          <Coffee className="h-6 w-6" />
          <span className="text-xl font-bold">Admin Panel</span>
        </Link>
        <div className="flex items-center space-x-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                pathname === item.href
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              {item.label}
            </Link>
          ))}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </nav>
  )
}

