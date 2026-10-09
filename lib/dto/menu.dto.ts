import { z } from 'zod'

/**
 * DTO для меню
 */

// ==================== Query Parameters ====================

export const getMenuQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
})

export type GetMenuQueryDto = z.infer<typeof getMenuQuerySchema>

// ==================== Response Types ====================

export interface MenuItemResponseDto {
  id: string
  name: string
  description: string | null
  price: number
  image: string | null
  isActive: boolean
  category: {
    id: string
    name: string
    slug: string
    description: string | null
  }
}

// ==================== Create Menu Item (Admin) ====================

export const createMenuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  image: z.string().url('Invalid image URL').optional().or(z.literal('')),
  categoryId: z.string().min(1, 'Category ID is required'),
  isActive: z.boolean().default(true),
})

export type CreateMenuItemDto = z.infer<typeof createMenuItemSchema>

// ==================== Update Menu Item (Admin) ====================

export const updateMenuItemSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().positive().optional(),
  image: z.string().url().optional().or(z.literal('')),
  categoryId: z.string().min(1).optional(),
  isActive: z.boolean().optional(),
})

export type UpdateMenuItemDto = z.infer<typeof updateMenuItemSchema>







