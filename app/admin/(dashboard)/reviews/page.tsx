"use client"

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/admin/data-table'
import { useFilters } from '@/hooks/use-filters'
import { usePagination } from '@/hooks/use-pagination'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { Star, Search, Eye, EyeOff, Trash2 } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Review {
  id: string
  rating: number
  comment?: string
  isPublished: boolean
  createdAt: string
  customer: {
    firstName: string
    lastName?: string
  }
  menuItem?: {
    name: string
  }
}

export default function AdminReviewsPage() {
  const t = useTranslations('admin.reviews')
  const tCommon = useTranslations('admin.common')
  const tActions = useTranslations('admin.actions')
  
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null)

  useEffect(() => {
    loadReviews()
  }, [])

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviews')
      if (!response.ok) throw new Error('Failed to load reviews')
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast({
        title: tCommon('error'),
        description: 'Пікірлерді жүктеу сәтсіз аяқталды',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [tCommon])

  const togglePublish = useCallback(async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !currentStatus }),
      })

      if (!response.ok) throw new Error('Failed to update review')

      toast({
        title: tCommon('success'),
        description: `Пікір ${!currentStatus ? 'жарияланды' : 'жасырылды'}`,
      })
      setReviews(prev => prev.map(review => 
        review.id === id ? { ...review, isPublished: !currentStatus } : review
      ))
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Пікірді жаңарту сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }, [tCommon])

  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete review')

      toast({
        title: tCommon('success'),
        description: 'Пікір жойылды',
      })
      setReviews(prev => prev.filter(review => review.id !== id))
      setDeleteDialogOpen(false)
      setReviewToDelete(null)
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Пікірді жою сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }, [tCommon])

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews
    const query = searchQuery.toLowerCase()
    return reviews.filter((review) => {
      return (
        review.customer.firstName.toLowerCase().includes(query) ||
        review.comment?.toLowerCase().includes(query) ||
        review.menuItem?.name.toLowerCase().includes(query)
      )
    })
  }, [reviews, searchQuery])

  const { filters, setFilter, filteredData } = useFilters<Review>(filteredReviews, {
    published: {
      filterFn: (item, value) => {
        if (value === '' || value === 'all') return true
        return value === 'published' ? item.isPublished : !item.isPublished
      },
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
      key: 'customer',
      header: t('customer'),
      render: (review: Review) => (
        <div>
          <p className="font-medium">
            {review.customer.firstName} {review.customer.lastName || ''}
          </p>
        </div>
      ),
    },
    {
      key: 'product',
      header: t('product'),
      render: (review: Review) => review.menuItem?.name || 'Жоқ',
    },
    {
      key: 'rating',
      header: t('rating'),
      render: (review: Review) => (
        <div className="flex items-center gap-1">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < review.rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'comment',
      header: t('comment'),
      render: (review: Review) => (
        <p className="max-w-md truncate">{review.comment || 'Пікір жоқ'}</p>
      ),
    },
    {
      key: 'status',
      header: t('status'),
      render: (review: Review) => (
        <Badge variant={review.isPublished ? 'default' : 'secondary'}>
          {review.isPublished ? t('published') : t('hidden')}
        </Badge>
      ),
    },
    {
      key: 'date',
      header: t('date'),
      render: (review: Review) => format(new Date(review.createdAt), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      header: tActions('edit'),
      render: (review: Review) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => togglePublish(review.id, review.isPublished)}
            title={t('toggle')}
          >
            {review.isPublished ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setReviewToDelete(review.id)
              setDeleteDialogOpen(true)
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ], [t, tActions, togglePublish])

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
                placeholder="Клиент, пікір немесе өнім бойынша іздеу..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
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
            emptyMessage={t('noReviews')}
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
            <AlertDialogDescription>
              Бұл әрекетті болдыру мүмкін емес. Бұл пікірді толығымен жояды.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tActions('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => reviewToDelete && handleDelete(reviewToDelete)}
              className="bg-destructive text-destructive-foreground"
            >
              {tActions('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
