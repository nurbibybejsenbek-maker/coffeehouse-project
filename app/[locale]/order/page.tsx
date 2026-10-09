"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useCart } from '@/hooks/use-cart'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { ordersApi } from '@/lib/api-client'

export default function OrderPage() {
  const t = useTranslations('order')
  const router = useRouter()
  const locale = useLocale()
  const { items, total, clearCart } = useCart()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const orderSchema = z.object({
    firstName: z.string().min(1, t('firstNameRequired')),
    lastName: z.string().optional(),
    phone: z.string().min(1, t('phoneRequired')),
    email: z.string().email(t('invalidEmail')).optional().or(z.literal('')),
    address: z.string().optional(),
    orderType: z.enum(['PICKUP', 'DINE_IN', 'DELIVERY']),
    paymentMethod: z.enum(['CASH', 'CARD', 'KASPI', 'PAYBOX', 'ONLINE']),
  })

  type OrderFormData = z.infer<typeof orderSchema>

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      orderType: 'PICKUP',
      paymentMethod: 'CASH',
    },
  })

  const orderType = watch('orderType')
  const paymentMethod = watch('paymentMethod')

  const onSubmit = async (data: OrderFormData) => {
    if (items.length === 0) {
      toast({
        title: t('error'),
        description: t('cartEmpty'),
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const order = await ordersApi.createOrder({
        ...data,
        items: items.map((item) => ({
          menuItemId: item.id,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })),
        totalAmount: total,
      })

      clearCart()
      toast({
        title: t('orderPlaced'),
        description: `${t('orderNumber')}: ${order.id}`,
      })
      router.push(`/${locale}/order/${order.id}`)
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('orderFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('customerInformation')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">{t('firstName')} *</Label>
                  <Input
                    id="firstName"
                    {...register('firstName')}
                    className={errors.firstName ? 'border-destructive' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">{t('lastName')}</Label>
                  <Input id="lastName" {...register('lastName')} />
                </div>
              </div>
              <div>
                <Label htmlFor="phone">{t('phone')} *</Label>
                <Input
                  id="phone"
                  type="tel"
                  {...register('phone')}
                  className={errors.phone ? 'border-destructive' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email ? 'border-destructive' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
              {orderType === 'DELIVERY' && (
                <div>
                  <Label htmlFor="address">{t('deliveryAddress')}</Label>
                  <Input id="address" {...register('address')} />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('orderType')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={orderType} onValueChange={(value) => setValue('orderType', value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PICKUP" id="pickup" />
                  <Label htmlFor="pickup">{t('pickup')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DINE_IN" id="dineIn" />
                  <Label htmlFor="dineIn">{t('dineIn')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DELIVERY" id="delivery" />
                  <Label htmlFor="delivery">{t('delivery')}</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('paymentMethod')}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={(value) => setValue('paymentMethod', value as any)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CASH" id="cash" />
                  <Label htmlFor="cash">{t('cash')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="CARD" id="card" />
                  <Label htmlFor="card">{t('card')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="KASPI" id="kaspi" />
                  <Label htmlFor="kaspi">{t('kaspi')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PAYBOX" id="paybox" />
                  <Label htmlFor="paybox">{t('paybox')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ONLINE" id="online" />
                  <Label htmlFor="online">{t('online')}</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>{t('orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span>
                    {item.name} × {item.quantity}
                  </span>
                  <span>{(item.price * item.quantity).toFixed(0)} ₸</span>
                </div>
              ))}
              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span>{t('total')}</span>
                  <span>{total.toFixed(0)} ₸</span>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? t('placingOrder') : t('placeOrder')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </form>
    </div>
  )
}

