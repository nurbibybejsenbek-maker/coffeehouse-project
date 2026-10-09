"use client"

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import MenuItemClient from './menu-item-client'
import { menuApi } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'

export default function MenuItemPage() {
  const t = useTranslations('menu')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [menuItem, setMenuItem] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadMenuItem() {
      try {
        // Загружаем конкретный товар через API (будет видно в Network tab)
        const item = await menuApi.getMenuItem(id)
        setMenuItem(item)
      } catch (error: any) {
        console.error('Error loading menu item:', error)
        toast({
          title: t('error') || 'Error',
          description: error.message || 'Failed to load menu item',
          variant: 'destructive',
        })
        router.push(`/${locale}/menu`)
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      loadMenuItem()
    }
  }, [id, locale, router, t])

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  if (!menuItem) {
    return null
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Изображение */}
          <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
            {menuItem.image || menuItem.imageUrl ? (
              <img
                src={menuItem.image || menuItem.imageUrl || ''}
                alt={menuItem.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent) {
                    const placeholder = document.createElement('div')
                    placeholder.className = 'w-full h-full flex items-center justify-center'
                    placeholder.innerHTML = '<span class="text-6xl opacity-50">☕</span>'
                    parent.appendChild(placeholder)
                  }
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl opacity-50">☕</span>
              </div>
            )}
          </div>

          {/* Информация */}
          <div className="space-y-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                {menuItem.category.slug === 'coffee' ? t('coffee') :
                 menuItem.category.slug === 'desserts' ? t('desserts') :
                 menuItem.category.slug === 'drinks' ? t('drinks') : menuItem.category.name}
              </p>
              <h1 className="text-4xl font-bold mb-4">{menuItem.name}</h1>
              <p className="text-3xl font-bold text-primary mb-6">
                {menuItem.price.toFixed(0)} ₸
              </p>
            </div>

            {menuItem.description && (
              <div>
                <h2 className="text-xl font-semibold mb-2">{t('description')}</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {menuItem.description}
                </p>
              </div>
            )}

            <MenuItemClient menuItem={menuItem} locale={locale} />
          </div>
        </div>
      </div>
    </div>
  )
}

