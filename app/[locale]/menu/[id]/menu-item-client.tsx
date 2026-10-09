"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ShoppingCart } from 'lucide-react'
import { useCart } from '@/hooks/use-cart'
import { toast } from '@/hooks/use-toast'

interface MenuItemClientProps {
  menuItem: {
    id: string
    name: string
    price: number
    image: string | null
  }
  locale: string
}

export default function MenuItemClient({ menuItem, locale }: MenuItemClientProps) {
  const t = useTranslations('menu')
  const { addItem } = useCart()
  const [quantity, setQuantity] = useState(1)

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        imageUrl: menuItem.image || undefined,
      })
    }
    toast({
      title: t('addToCart'),
      description: `${menuItem.name} (${quantity})`,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">{t('quantity')}:</label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
          >
            -
          </Button>
          <span className="w-12 text-center font-semibold">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setQuantity(quantity + 1)}
          >
            +
          </Button>
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        onClick={handleAddToCart}
      >
        <ShoppingCart className="h-4 w-4 mr-2" />
        {t('addToCart')} ({quantity})
      </Button>

      <div className="pt-4 border-t">
        <p className="text-lg font-semibold">
          {t('total')}: {(menuItem.price * quantity).toFixed(0)} ₸
        </p>
      </div>
    </div>
  )
}

