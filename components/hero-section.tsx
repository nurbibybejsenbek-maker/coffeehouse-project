"use client"

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useTranslations, useLocale } from 'next-intl'

export function HeroSection() {
  const t = useTranslations('home')
  const locale = useLocale()

  return (
    <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Фоновое изображение кофейни */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1920&h=1080&q=80)',
        }}
      >
        {/* Затемнение для лучшей читаемости текста */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 to-amber-700/80" />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center text-white px-4"
      >
        <h1 className="text-5xl md:text-7xl font-bold mb-4">
          {t('title')}
        </h1>
        <p className="text-xl md:text-2xl mb-8">{t('subtitle')}</p>
        <Link href={`/${locale}/reservation`}>
          <Button size="lg" className="text-lg px-8 py-6">
            {t('cta')}
          </Button>
        </Link>
      </motion.div>
    </section>
  )
}

