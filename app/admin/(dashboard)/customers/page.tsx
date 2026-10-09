"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { format } from 'date-fns'
import { toast } from '@/hooks/use-toast'
import { Users, Phone, Mail, Calendar } from 'lucide-react'

interface Customer {
  id: string
  firstName: string
  lastName?: string
  phone: string
  email?: string
  createdAt: string
  _count?: {
    orders: number
    reservations: number
    reviews: number
  }
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    try {
      const response = await fetch('/api/admin/customers')
      if (!response.ok) throw new Error('Failed to load customers')
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const searchLower = search.toLowerCase()
    return (
      customer.firstName.toLowerCase().includes(searchLower) ||
      customer.lastName?.toLowerCase().includes(searchLower) ||
      customer.phone.includes(search) ||
      customer.email?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold">Customers</h1>
      </div>

      <div>
        <Input
          placeholder="Search customers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredCustomers.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No customers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id}>
              <CardHeader>
                <CardTitle>
                  {customer.firstName} {customer.lastName}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
                {customer.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Joined: {format(new Date(customer.createdAt), 'PPP')}
                  </span>
                </div>
                {customer._count && (
                  <div className="mt-4 pt-4 border-t space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Orders:</span> {customer._count.orders}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Reservations:</span> {customer._count.reservations}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Reviews:</span> {customer._count.reviews}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

