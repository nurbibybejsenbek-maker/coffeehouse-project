"use client"

import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Image from 'next/image'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default function CartPage() {
  const t = useTranslations('cart')
  const tCommon = useTranslations('common')
  const router = useRouter()
  const locale = useLocale()
  const { items, total, updateQuantity, removeItem, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div className="container py-16 px-4">
        <div className="max-w-md mx-auto text-center">
          <ShoppingCart className="h-24 w-24 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-bold mb-4">{t('title')}</h1>
          <p className="text-muted-foreground mb-8">{t('empty')}</p>
          <Link href={`/${locale}/menu`}>
            <Button>{t('continueShopping')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const subtotal = total

  return (
    <div className="container py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  {item.imageUrl && (
                    <div className="relative h-24 w-24 flex-shrink-0">
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                    <p className="text-muted-foreground mb-4">
                      {item.price.toFixed(0)} ₸ × {item.quantity} = {(item.price * item.quantity).toFixed(0)} ₸
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.id)}
                        className="ml-auto text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('orderSummary') || 'Order Summary'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>{t('subtotal')}</span>
                <span>{subtotal.toFixed(0)} ₸</span>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}</span>
                  <span>{subtotal.toFixed(0)} ₸</span>
                </div>
              </div>
              <Link href={`/${locale}/order`} className="block">
                <Button className="w-full" size="lg">
                  {t('checkout')}
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full"
                onClick={clearCart}
              >
                {tCommon('clear')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

