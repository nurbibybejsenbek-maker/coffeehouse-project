"use client"

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { contactApi, type ContactInfo } from '@/lib/api-client'

export default function ContactPage() {
  const t = useTranslations('contact')
  const locale = useLocale()
  const [contactInfo, setContactInfo] = useState<ContactInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadContactInfo() {
      try {
        // Загружаем контактную информацию через API (будет видно в Network tab)
        const data = await contactApi.getContactInfo(locale)
        setContactInfo(data)
      } catch (error) {
        console.error('Error loading contact info:', error)
      } finally {
        setLoading(false)
      }
    }

    loadContactInfo()
  }, [locale])

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">{t('loading') || 'Loading...'}</div>
      </div>
    )
  }

  if (!contactInfo) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('error') || 'Error loading contact information'}</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('contactInformation') || 'Contact Information'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="font-semibold">{t('address')}</p>
                <p className="text-muted-foreground">
                  {contactInfo.address.city}, {contactInfo.address.country}<br />
                  {contactInfo.address.street}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Phone className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="font-semibold">{t('phone')}</p>
                <p className="text-muted-foreground">{contactInfo.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Mail className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="font-semibold">{t('email')}</p>
                <p className="text-muted-foreground">{contactInfo.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="h-5 w-5 mt-1 text-primary" />
              <div>
                <p className="font-semibold">{t('openingHours')}</p>
                <div className="text-muted-foreground space-y-1">
                  <p>{contactInfo.workingHours.weekdays.days}: {contactInfo.workingHours.weekdays.hours}</p>
                  <p>{contactInfo.workingHours.weekend.days}: {contactInfo.workingHours.weekend.hours}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('map') || 'Карта'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="aspect-video rounded-lg overflow-hidden border">
              <iframe
                src={`https://maps.google.com/maps?q=${encodeURIComponent(contactInfo.address.street + ', ' + contactInfo.address.city + ', ' + contactInfo.address.country)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-full"
                title={t('map') || 'Карта'}
              />
            </div>
            <div className="mt-4">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(contactInfo.address.street + ', ' + contactInfo.address.city + ', ' + contactInfo.address.country)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-2"
              >
                <MapPin className="h-4 w-4" />
                {t('openInMaps') || 'Картада ашу'}
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

