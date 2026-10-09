"use client"

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  // Order statuses
  NEW: { label: 'New', variant: 'default' },
  PAID: { label: 'Paid', variant: 'secondary' },
  COOKING: { label: 'Cooking', variant: 'secondary' },
  READY: { label: 'Ready', variant: 'default' },
  COMPLETED: { label: 'Completed', variant: 'secondary' },
  CANCELED: { label: 'Canceled', variant: 'destructive' },
  PENDING: { label: 'Pending', variant: 'default' },
  CONFIRMED: { label: 'Confirmed', variant: 'secondary' },
  PREPARING: { label: 'Preparing', variant: 'secondary' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
  
  // Payment statuses
  FAILED: { label: 'Failed', variant: 'destructive' },
  REFUNDED: { label: 'Refunded', variant: 'outline' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status.toUpperCase()] || { label: status, variant: 'default' as const }
  
  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  )
}

