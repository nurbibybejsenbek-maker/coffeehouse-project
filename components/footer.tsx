"use client"

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'

export default function Footer() {
  const t = useTranslations('common')
  const tFooter = useTranslations('footer')
  const locale = useLocale()

  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">CoffeeHouse</h3>
            <p className="text-sm text-muted-foreground">
              {tFooter('tagline')}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">{tFooter('quickLinks')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}`} className="text-muted-foreground hover:text-primary">
                  {t('home')}
                </Link>
                <p className="text-xs text-muted-foreground mt-1">
                  {tFooter('homeDescription')}
                </p>
              </li>
              <li>
                <Link href={`/${locale}/menu`} className="text-muted-foreground hover:text-primary">
                  {t('menu')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="text-muted-foreground hover:text-primary">
                  {t('about')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">{tFooter('customer')}</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href={`/${locale}/order`} className="text-muted-foreground hover:text-primary">
                  {t('order')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/reservation`} className="text-muted-foreground hover:text-primary">
                  {t('reservation')}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/reviews`} className="text-muted-foreground hover:text-primary">
                  {t('reviews')}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-4">{tFooter('contact')}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Almaty, Kazakhstan</li>
              <li>+7 (777) 123-4567</li>
              <li>info@coffeehouse.kz</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          {tFooter('copyright')}
        </div>
      </div>
    </footer>
  )
}

