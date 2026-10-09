import { z } from 'zod'

/**
 * DTO для заказов
 */

// ==================== Order Status ====================

export const orderStatusEnum = z.enum([
  'NEW',
  'PAID',
  'COOKING',
  'READY',
  'COMPLETED',
  'CANCELED',
])

export const orderTypeEnum = z.enum(['PICKUP', 'DINE_IN', 'DELIVERY'])

// ==================== Order Item ====================

export const orderItemSchema = z.object({
  menuItemId: z.string().min(1, 'Menu item ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price must be non-negative'),
  totalPrice: z.number().nonnegative('Total price must be non-negative'),
})

export type OrderItemDto = z.infer<typeof orderItemSchema>

// ==================== Create Order ====================

export const createOrderSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().optional(),
  orderType: orderTypeEnum,
  paymentMethod: z.enum(['CASH', 'CARD', 'KASPI', 'PAYBOX', 'ONLINE']),
  items: z
    .array(orderItemSchema)
    .min(1, 'At least one item is required'),
  totalAmount: z.number().positive('Total amount must be positive'),
})

export type CreateOrderDto = z.infer<typeof createOrderSchema>

// ==================== Update Order Status ====================

export const updateOrderStatusSchema = z.object({
  status: orderStatusEnum,
})

export type UpdateOrderStatusDto = z.infer<typeof updateOrderStatusSchema>

// ==================== Query Parameters ====================

export const getOrdersQuerySchema = z.object({
  customerId: z.string().optional(),
})

export type GetOrdersQueryDto = z.infer<typeof getOrdersQuerySchema>

// ==================== Response Types ====================

export interface OrderResponseDto {
  id: string
  status: string
  totalAmount: number
  orderType: string
  placedAt: string
  updatedAt: string
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    menuItem: {
      id: string
      name: string
      description: string | null
      price: number
      image: string | null
    }
  }>
  customer: {
    id: string
    firstName: string
    lastName: string | null
    phone: string
    email: string | null
  }
  payment?: {
    id: string
    method: string
    status: string
    amount: number
    transactionId: string | null
    paidAt: string | null
  }
}







