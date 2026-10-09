"use client"

import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useCart } from '@/hooks/use-cart'

export function CartButton() {
  const router = useRouter()
  const locale = useLocale()
  const { itemCount } = useCart()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => router.push(`/${locale}/cart`)}
      className="relative"
    >
      <ShoppingCart className="h-5 w-5" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
          {itemCount}
        </span>
      )}
    </Button>
  )
}

