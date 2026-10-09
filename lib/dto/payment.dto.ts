import { z } from 'zod'

/**
 * DTO для платежей
 */

// ==================== Payment Method ====================

export const paymentMethodEnum = z.enum([
  'CASH',
  'CARD',
  'KASPI',
  'PAYBOX',
  'ONLINE',
])

// ==================== Payment Status ====================

export const paymentStatusEnum = z.enum([
  'PENDING',
  'COMPLETED',
  'FAILED',
  'REFUNDED',
])

// ==================== Process Payment ====================

export const processPaymentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  method: paymentMethodEnum,
})

export type ProcessPaymentDto = z.infer<typeof processPaymentSchema>

// ==================== Update Payment ====================

export const updatePaymentSchema = z.object({
  status: paymentStatusEnum.optional(),
  transactionId: z.string().optional(),
  paidAt: z.string().datetime().optional().or(z.literal(null)),
})

export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>

// ==================== Response Types ====================

export interface PaymentResponseDto {
  id: string
  orderId: string
  method: string
  status: string
  amount: number
  transactionId: string | null
  paidAt: string | null
  createdAt: string
  updatedAt: string
}







