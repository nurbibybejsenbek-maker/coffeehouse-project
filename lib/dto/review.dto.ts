import { z } from 'zod'

/**
 * DTO для отзывов
 */

// ==================== Create Review ====================

export const createReviewSchema = z.object({
  customerId: z.string().optional(),
  menuItemId: z.string().optional(),
  orderId: z.string().optional(),
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  comment: z.string().optional(),
})

export type CreateReviewDto = z.infer<typeof createReviewSchema>

// ==================== Update Review ====================

export const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().optional(),
})

export type UpdateReviewDto = z.infer<typeof updateReviewSchema>

// ==================== Query Parameters ====================

export const getReviewsQuerySchema = z.object({
  menuItemId: z.string().optional(),
  orderId: z.string().optional(),
  customerId: z.string().optional(),
})

export type GetReviewsQueryDto = z.infer<typeof getReviewsQuerySchema>

// ==================== Response Types ====================

export interface ReviewResponseDto {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    firstName: string
    lastName: string | null
  }
  menuItem?: {
    id: string
    name: string
    description: string | null
    price: number
    image: string | null
  } | null
  orderId?: string | null
}



