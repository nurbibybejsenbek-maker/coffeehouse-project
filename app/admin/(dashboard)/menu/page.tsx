"use client"

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { menuApi } from '@/lib/api-client'
import { toast } from '@/hooks/use-toast'
import { Plus, Edit, Trash2, Package } from 'lucide-react'

interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  category: {
    id: string
    name: string
    slug: string
  }
  isActive: boolean
}

interface Category {
  id: string
  name: string
  slug: string
}

export default function AdminMenuPage() {
  const t = useTranslations('admin.menu')
  const tCommon = useTranslations('admin.common')
  const tActions = useTranslations('admin.actions')
  
  const [items, setItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    categoryId: '',
    isActive: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/menu')
      if (!response.ok) throw new Error('Failed to load menu')
      const menuItems = await response.json()
      
      setItems(menuItems)
      
      const uniqueCategories = Array.from(
        new Map(menuItems.map((item: any) => [item.category.id, item.category])).values()
      ) as Category[]
      setCategories(uniqueCategories)
    } catch (error) {
      console.error('Error loading menu:', error)
      toast({
        title: tCommon('error'),
        description: 'Мәзірді жүктеу сәтсіз аяқталды',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [tCommon])

  function openAddDialog() {
    if (categories.length === 0) {
      toast({
        title: tCommon('error'),
        description: 'Категориялар жоқ. Алдымен категорияларды құрыңыз.',
        variant: 'destructive',
      })
      return
    }
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      price: '',
      image: '',
      categoryId: categories[0]?.id || '',
      isActive: true,
    })
    setIsDialogOpen(true)
  }

  function openEditDialog(item: MenuItem) {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      image: item.image || '',
      categoryId: item.category.id,
      isActive: item.isActive,
    })
    setIsDialogOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        image: formData.image || undefined,
        categoryId: formData.categoryId,
        isActive: formData.isActive,
      }

      if (editingItem) {
        await fetch(`/api/menu/${editingItem.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast({
          title: tCommon('success'),
          description: 'Мәзір элементі жаңартылды',
        })
      } else {
        await fetch('/api/menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        toast({
          title: tCommon('success'),
          description: 'Мәзір элементі құрылды',
        })
      }
      setIsDialogOpen(false)
      loadData()
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Мәзір элементін сақтау сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(t('delete') + '?')) return

    try {
      await fetch(`/api/menu/${id}`, {
        method: 'DELETE',
      })
      toast({
        title: tCommon('success'),
        description: 'Мәзір элементі жойылды',
      })
      loadData()
    } catch (error: any) {
      toast({
        title: tCommon('error'),
        description: error.message || 'Мәзір элементін жою сәтсіз аяқталды',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return <div className="text-center py-8">{tCommon('loading')}</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">{t('title')}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              {t('add')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? t('edit') : t('add')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">{t('price')} (₸) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="categoryId">{t('category')} *</Label>
                  <Select
                    value={formData.categoryId}
                    onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="image">{t('image')}</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive">{t('active')}</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  {tActions('cancel')}
                </Button>
                <Button type="submit">{editingItem ? tActions('update') : tActions('create')}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id}>
            {item.image && (
              <div className="relative h-48 w-full">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{item.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{item.category.name}</p>
                </div>
                {!item.isActive && (
                  <span className="text-xs bg-muted px-2 py-1 rounded">{t('inactive')}</span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {item.description}
              </p>
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold">{item.price.toFixed(0)} ₸</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>{t('noItems')}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
