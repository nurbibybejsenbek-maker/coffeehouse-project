"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/components/admin/data-table'
import { StatusBadge } from '@/components/admin/status-badge'
import { useFilters } from '@/hooks/use-filters'
import { usePagination } from '@/hooks/use-pagination'
import { format } from 'date-fns'
import { reservationsApi } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { Search } from 'lucide-react'

// Казахские названия месяцев
const kkMonths = [
  'Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым',
  'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'
]

// Функция для форматирования даты в казахском стиле: "Қараша 6, 12:30"
function formatDateKazakh(date: Date | string, time?: string): string {
  const dateObj = typeof date === 'string' ? new Date(date + 'T00:00:00') : date
  const month = kkMonths[dateObj.getMonth()]
  const day = dateObj.getDate()
  
  if (time) {
    return `${month} ${day}, ${time}`
  }
  return `${month} ${day}`
}

interface Reservation {
  id: string
  date: string
  time: string
  partySize: number
  status: string
  note?: string
  customer: {
    firstName: string
    lastName?: string
    phone: string
    email?: string
  }
  table?: {
    number: number
    seats: number
  }
}

const reservationStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']

export default function AdminReservationsPage() {
  const t = useTranslations('admin.reservations')
  const tCommon = useTranslations('admin.common')
  
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadReservations()
  }, [])

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true)
      const data = await reservationsApi.getReservations()
      setReservations(data)
    } catch (error) {
      console.error('Error loading reservations:', error)
      toast({
        title: tCommon('error'),
        description: 'Брондауларды жүктеу сәтсіз аяқталды',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [tCommon])

  const updateReservationStatus = useCallback(async (reservationId: string, newStatus: string) => {
    try {
      await reservationsApi.updateReservationStatus(reservationId, newStatus)
      toast({
        title: tCommon('success'),
        description: 'Брондау статусы жаңартылды',
      })
      setReservations(prev => prev.map(res => 
        res.id === reservationId ? { ...res, status: newStatus } : res
      ))
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Брондау статусын жаңарту сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }, [tCommon])

  const filteredReservations = useMemo(() => {
    if (!searchQuery) return reservations
    const query = searchQuery.toLowerCase()
    return reservations.filter((reservation) => {
      return (
        reservation.id.toLowerCase().includes(query) ||
        reservation.customer.firstName.toLowerCase().includes(query) ||
        reservation.customer.phone.includes(query)
      )
    })
  }, [reservations, searchQuery])

  const { filters, setFilter, filteredData } = useFilters<Reservation>(filteredReservations, {
    status: {
      filterFn: (item, value) => !value || value === 'all' || item.status === value,
      defaultValue: 'all',
    },
  })

  const { currentPage, totalPages, paginatedData, goToPage, hasNextPage, hasPrevPage } =
    usePagination({
      totalItems: filteredData.length,
      itemsPerPage: 10,
    })

  const columns = useMemo(() => [
    {
      key: 'id',
      header: t('number'),
      render: (reservation: Reservation) => (
        <span className="font-medium">{reservation.id.slice(0, 8)}...</span>
      ),
    },
    {
      key: 'customer',
      header: t('customer'),
      render: (reservation: Reservation) => (
        <div>
          <p className="font-medium">
            {reservation.customer.firstName} {reservation.customer.lastName || ''}
          </p>
          <p className="text-xs text-muted-foreground">{reservation.customer.phone}</p>
        </div>
      ),
    },
    {
      key: 'date',
      header: t('date'),
      render: (reservation: Reservation) => (
        <div>
          <p>{formatDateKazakh(reservation.date, reservation.time)}</p>
        </div>
      ),
    },
    {
      key: 'partySize',
      header: t('partySize'),
      render: (reservation: Reservation) => `${reservation.partySize} адам`,
    },
    {
      key: 'table',
      header: t('table'),
      render: (reservation: Reservation) =>
        reservation.table ? `Үстел ${reservation.table.number} (${reservation.table.seats} орын)` : 'Жоқ',
    },
    {
      key: 'status',
      header: t('status'),
      render: (reservation: Reservation) => <StatusBadge status={reservation.status} />,
    },
    {
      key: 'actions',
      header: t('changeStatus'),
      render: (reservation: Reservation) => (
        <Select
          value={reservation.status}
          onValueChange={(value) => updateReservationStatus(reservation.id, value)}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {reservationStatuses.map((status) => (
              <SelectItem key={status} value={status}>
                {t(status.toLowerCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ),
    },
  ], [t, updateReservationStatus])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('filter')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Брондау ID, клиент аты немесе телефон бойынша іздеу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilter('status', value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Барлық статустар</SelectItem>
                {reservationStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {t(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('list')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={paginatedData(filteredData)}
            columns={columns}
            loading={loading}
            emptyMessage={t('noReservations')}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                {tCommon('page')} {currentPage} {tCommon('of')} {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPrevPage}
                >
                  Алдыңғы
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage}
                >
                  Келесі
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
