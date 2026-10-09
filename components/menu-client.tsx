"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useCart } from '@/hooks/use-cart'
import { toast } from '@/hooks/use-toast'
import { Search, ShoppingCart } from 'lucide-react'

interface MenuClientProps {
  items: any[]
  categories: any[]
  locale: string
  initialCategory?: string
  initialSearch?: string
}

export default function MenuClient({
  items,
  categories,
  locale,
  initialCategory,
  initialSearch,
}: MenuClientProps) {
  const t = useTranslations('menu')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addItem } = useCart()
  const [search, setSearch] = useState(initialSearch || '')
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || 'all')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set('search', search)
    else params.delete('search')
    if (selectedCategory !== 'all') params.set('category', selectedCategory)
    else params.delete('category')
    router.push(`/${locale}/menu?${params.toString()}`)
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    const params = new URLSearchParams(searchParams.toString())
    if (search) params.set('search', search)
    else params.delete('search')
    if (category !== 'all') params.set('category', category)
    else params.delete('category')
    router.push(`/${locale}/menu?${params.toString()}`)
  }

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
    })
    toast({
      title: t('addToCart'),
      description: `${item.name} себетке қосылды`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder={t('search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">{t('search')}</Button>
        </form>
        <div className="flex gap-2 overflow-x-auto">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            onClick={() => handleCategoryChange('all')}
          >
            {t('allCategories')}
          </Button>
          {categories.map((cat) => {
            // Переводим категории на казахский
            const categoryName = cat.slug === 'coffee' ? t('coffee') :
                                 cat.slug === 'desserts' ? t('desserts') :
                                 cat.slug === 'drinks' ? t('drinks') : cat.name
            return (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.slug ? 'default' : 'outline'}
                onClick={() => handleCategoryChange(cat.slug)}
              >
                {categoryName}
              </Button>
            )
          })}
        </div>
      </div>

      {/* Menu Items */}
      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('noItems')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const imageSrc = item.imageUrl || item.image || ''
            return (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative h-48 w-full bg-muted overflow-hidden">
                  {imageSrc && imageSrc.trim() !== '' ? (
                    <img
                      src={imageSrc}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        const parent = target.parentElement
                        if (parent && !parent.querySelector('.placeholder')) {
                          target.style.display = 'none'
                          const placeholder = document.createElement('div')
                          placeholder.className = 'placeholder w-full h-full flex items-center justify-center absolute inset-0'
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
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>
                  {item.category.slug === 'coffee' ? t('coffee') :
                   item.category.slug === 'desserts' ? t('desserts') :
                   item.category.slug === 'drinks' ? t('drinks') : item.category.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
                <p className="text-2xl font-bold mt-4">
                  {item.price.toFixed(0)} ₸
                </p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleAddToCart(item)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {t('addToCart')}
                </Button>
                <Link href={`/${locale}/menu/${item.id}`}>
                  <Button variant="ghost">{t('view') || 'Көру'}</Button>
                </Link>
              </CardFooter>
            </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

