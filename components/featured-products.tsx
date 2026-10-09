"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslations, useLocale } from 'next-intl'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  category: {
    name: string
  }
}

export function FeaturedProducts({ products }: { products: Product[] }) {
  const t = useTranslations('menu')
  const locale = useLocale()

  return (
    <section className="py-16 px-4 container mx-auto">
      <h2 className="text-3xl font-bold text-center mb-12">
        {t('featuredProducts') || 'Featured Products'}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-card rounded-lg overflow-hidden shadow-lg"
          >
            <div className="relative h-48 w-full bg-muted overflow-hidden">
              {product.imageUrl && product.imageUrl.trim() !== '' ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading={index < 3 ? 'eager' : 'lazy'}
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
            <div className="p-4">
              <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
              <p className="text-muted-foreground mb-4 line-clamp-2">
                {product.description}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">
                  {product.price.toFixed(0)} ₸
                </span>
                <Link href={`/${locale}/menu/${product.id}`}>
                  <Button>{t('addToCart')}</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

