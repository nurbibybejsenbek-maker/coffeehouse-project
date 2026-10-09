"use client"

import { useEffect, useState } from 'react'
import { HeroSection } from '@/components/hero-section'
import { FeaturedProducts } from '@/components/featured-products'
import { menuApi, aiApi } from '@/lib/api-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useTranslations, useLocale } from 'next-intl'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export default function HomePage() {
  const t = useTranslations('home')
  const locale = useLocale()
  const [products, setProducts] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        // Загружаем меню через API (будет видно в Network tab)
        const items = await menuApi.getMenu({})
        
        // Берем первые 6 товаров
        const featuredProducts = items.slice(0, 6).map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: item.price,
          imageUrl: item.image || item.imageUrl || null,
          category: {
            name: item.category?.name || '',
          },
        }))
        
        setProducts(featuredProducts)

        // Загружаем AI рекомендации через POST /api/ai/recommend
        setLoadingRecommendations(true)
        try {
          const aiData = await aiApi.getRecommendations({
            taste: 'bitter',
            milk: 'with_milk',
            strength: 'medium',
          })
          setRecommendations(aiData.recommendations || [])
        } catch (error) {
          console.error('Error loading AI recommendations:', error)
          // Не критично, продолжаем без рекомендаций
        } finally {
          setLoadingRecommendations(false)
        }
      } catch (error) {
        console.error('Error loading featured products:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  return (
    <div className="flex flex-col">
      <HeroSection />
      <FeaturedProducts products={products} />
      
      {/* AI Recommendations Section */}
      {recommendations.length > 0 && (
        <div className="container py-8 px-4">
          <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                {t('aiRecommendations')}
              </CardTitle>
              <CardDescription>
                {t('aiRecommendationsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.map((item: any) => (
                  <Card key={item.id} className="border-amber-200 dark:border-amber-800">
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-1">{item.name}</h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                      )}
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                        {item.price?.toFixed(0) || 0} ₸
                      </p>
                      <Link href={`/${locale}/menu/${item.id}`}>
                        <Button variant="outline" size="sm" className="mt-2 w-full">
                          {t('viewDetails')}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

