"use client"

import { useEffect, useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import MenuClient from '@/components/menu-client'
import { menuApi } from '@/lib/api-client'

export default function MenuPage() {
  const t = useTranslations('menu')
  const locale = useLocale()
  const searchParams = useSearchParams()
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const category = searchParams.get('category') || undefined
  const search = searchParams.get('search') || undefined

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        
        // Загружаем меню через API (будет видно в Network tab)
        const items = await menuApi.getMenu({ category, search })
        setMenuItems(items)

        // Получаем категории из меню (они включены в ответ)
        // Если товаров нет (из-за фильтров), загружаем все товары один раз для получения категорий
        let uniqueCategories: any[] = []
        
        if (items.length > 0) {
          // Если есть товары, берем категории из них
          uniqueCategories = Array.from(
            new Map(
              items.map((item: any) => [item.category.id, item.category])
            ).values()
          ).sort((a: any, b: any) => a.name.localeCompare(b.name))
        } else {
          // Если товаров нет (из-за фильтров), загружаем все товары для получения категорий
          const allItems = await menuApi.getMenu({})
          uniqueCategories = Array.from(
            new Map(
              allItems.map((item: any) => [item.category.id, item.category])
            ).values()
          ).sort((a: any, b: any) => a.name.localeCompare(b.name))
        }
        
        setCategories(uniqueCategories)
      } catch (err: any) {
        console.error('Error loading menu:', err)
        setError(err.message || 'Failed to load menu')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [category, search])

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8 px-4">
        <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
        <div className="text-center py-12">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <MenuClient
        items={menuItems}
        categories={categories}
        locale={locale}
        initialCategory={category}
        initialSearch={search}
      />
    </div>
  )
}

