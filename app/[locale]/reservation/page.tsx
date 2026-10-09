"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { reservationsApi } from '@/lib/api-client'

// Казахские названия месяцев и дней недели
const kkMonths = [
  'Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
  'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'
]

const kkDays = [
  'Жексенбі', 'Дүйсенбі', 'Сейсенбі', 'Сәрсенбі', 'Бейсенбі', 'Жұма', 'Сенбі'
]

// Сокращенные названия дней недели для календаря
const kkDaysShort = [
  'Жк', 'Дс', 'Сс', 'Ср', 'Бс', 'Жм', 'Сб'
]

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
]

export default function ReservationPage() {
  const t = useTranslations('reservation')
  const router = useRouter()
  const locale = useLocale()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  const reservationSchema = z.object({
    firstName: z.string().min(1, t('firstNameRequired')),
    lastName: z.string().optional(),
    phone: z.string().min(1, t('phoneRequired')),
    email: z.string().email(t('invalidEmail')).optional().or(z.literal('')),
    date: z.date(),
    time: z.string().min(1, t('timeRequired')),
    partySize: z.number().min(1).max(20),
    note: z.string().optional(),
  })

  type ReservationFormData = z.infer<typeof reservationSchema>

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      date: new Date(),
      partySize: 2,
    },
  })

  const selectedTime = watch('time')

  const onSubmit = async (data: ReservationFormData) => {
    setIsSubmitting(true)
    try {
      const reservation = await reservationsApi.createReservation({
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      })

      // Для date-fns используем русскую локаль (так как казахской нет)
      const dateLocale = ru
      toast({
        title: t('reservationMade'),
        description: t('reservationConfirmed', {
          date: format(data.date, 'PPP', { locale: dateLocale }),
          time: data.time,
        }),
      })
      router.push(`/${locale}/reservation/${reservation.id}`)
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('reservationFailed'),
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">{t('title')}</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{t('title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
            <div>
              <Label>{t('date')}</Label>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date)
                  if (date) {
                    setValue('date', date)
                  }
                }}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
                locale={locale === 'ru' ? ru : undefined}
                components={
                  locale === 'kk'
                    ? {
                        CaptionLabel: ({ displayMonth }) => {
                          const month = displayMonth.getMonth()
                          const year = displayMonth.getFullYear()
                          return <span>{kkMonths[month]} {year}</span>
                        },
                      }
                    : undefined
                }
                formatters={
                  locale === 'kk'
                    ? {
                        formatWeekdayName: (date) => {
                          return kkDaysShort[date.getDay()]
                        },
                      }
                    : undefined
                }
              />
              {errors.date && (
                <p className="text-sm text-destructive mt-1">
                  {errors.date.message}
                </p>
              )}
            </div>
            <div>
              <Label>{t('time')}</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {timeSlots.map((time) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? 'default' : 'outline'}
                    onClick={() => setValue('time', time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
              {errors.time && (
                <p className="text-sm text-destructive mt-1">
                  {errors.time.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="partySize">{t('partySize')}</Label>
              <Input
                id="partySize"
                type="number"
                min="1"
                max="20"
                {...register('partySize', { valueAsNumber: true })}
                className={errors.partySize ? 'border-destructive' : ''}
              />
              {errors.partySize && (
                <p className="text-sm text-destructive mt-1">
                  {errors.partySize.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="note">{t('note')}</Label>
              <Input id="note" {...register('note')} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? t('submitting') : t('book')}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}

