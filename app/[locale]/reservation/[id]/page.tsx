"use client"

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { reservationsApi, type Reservation } from '@/lib/api-client'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import Link from 'next/link'

// Казахские названия месяцев
const kkMonths = [
  'Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
  'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'
]

// Функция для форматирования даты в казахском стиле: "Қараша 6, 12:30"
function formatDateKazakh(date: Date | string, time?: string): string {
  // Если дата в формате строки 'YYYY-MM-DD', добавляем время для правильного парсинга
  const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0]
  const dateObj = new Date(dateStr + 'T00:00:00')
  const month = kkMonths[dateObj.getMonth()]
  const day = dateObj.getDate()
  
  if (time) {
    return `${month} ${day}, ${time}`
  }
  return `${month} ${day}`
}

export default function ReservationDetailsPage() {
  const t = useTranslations('reservation')
  const locale = useLocale()
  const params = useParams()
  const router = useRouter()
  const reservationId = params.id as string
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const data = await reservationsApi.getReservation(reservationId)
        setReservation(data)
      } catch (error: any) {
        console.error('Error fetching reservation:', error)
        toast({
          title: t('error'),
          description: error.message || 'Failed to load reservation details',
          variant: 'destructive',
        })
        router.push(`/${locale}/reservation`)
      } finally {
        setLoading(false)
      }
    }

    if (reservationId) {
      fetchReservation()
    }
  }, [reservationId, router, locale, t])

  if (loading) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">{t('loading')}</div>
      </div>
    )
  }

  if (!reservation) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('reservationNotFound')}</h1>
          <Link href={`/${locale}/reservation`}>
            <Button>{t('goBackToReservations')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold">{t('reservationDetails')}</h1>
          <Link href={`/${locale}/reservation`}>
            <Button variant="outline">{t('backToReservations')}</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('reservationInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">{t('status')}</p>
                <p className="font-semibold">{reservation.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{locale === 'kk' ? 'Күн' : t('date')}</p>
                <p className="font-semibold">
                  {locale === 'kk' 
                    ? formatDateKazakh(reservation.date, reservation.time)
                    : `${format(new Date(reservation.date), 'PPP')} ${reservation.time}`
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t('partySize')}</p>
                <p className="font-semibold">{reservation.partySize} {t('guests')}</p>
              </div>
            </div>
            {reservation.note && (
              <div>
                <p className="text-sm text-muted-foreground">{t('note')}</p>
                <p className="font-semibold">{reservation.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('customerInformation')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-semibold">{t('name')}:</span>{' '}
              {reservation.customer.firstName} {reservation.customer.lastName || ''}
            </p>
            <p>
              <span className="font-semibold">{t('phone')}:</span>{' '}
              {reservation.customer.phone}
            </p>
          </CardContent>
        </Card>

        {reservation.table && (
          <Card>
            <CardHeader>
              <CardTitle>{t('tableInformation')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <span className="font-semibold">{t('tableNumber')}:</span> {reservation.table.number}
              </p>
              <p>
                <span className="font-semibold">{t('seats')}:</span> {reservation.table.seats}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

