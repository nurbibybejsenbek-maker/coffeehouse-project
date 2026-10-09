import { z } from 'zod'

/**
 * DTO для аутентификации
 */

// ==================== Login ====================

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginDto = z.infer<typeof loginSchema>

// ==================== Register ====================

export const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export type RegisterDto = z.infer<typeof registerSchema>

// ==================== Response Types ====================

export interface AuthResponseDto {
  message?: string
  customer?: {
    id: string
    firstName: string
    lastName?: string | null
    email: string | null
    phone: string
  }
  user?: {
    id: string
    email: string
    role: string
  }
  error?: string
  details?: z.ZodError['errors']
}







