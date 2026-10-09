import { z } from 'zod'

/**
 * DTO для бронирований
 */

// ==================== Reservation Status ====================

export const reservationStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
  'COMPLETED',
])

// ==================== Create Reservation ====================

export const createReservationSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  partySize: z.number().int().min(1, 'Party size must be at least 1'),
  note: z.string().optional(),
})

export type CreateReservationDto = z.infer<typeof createReservationSchema>

// ==================== Update Reservation ====================

export const updateReservationSchema = z.object({
  status: reservationStatusEnum.optional(),
  tableId: z.string().optional(),
  date: z.string().optional(),
  time: z.string().optional(),
  partySize: z.number().int().min(1).optional(),
  note: z.string().optional(),
})

export type UpdateReservationDto = z.infer<typeof updateReservationSchema>

// ==================== Response Types ====================

export interface ReservationResponseDto {
  id: string
  date: string
  time: string
  partySize: number
  status: string
  note: string | null
  createdAt: string
  updatedAt: string
  customer: {
    id: string
    firstName: string
    lastName: string | null
    phone: string
    email: string | null
  }
  table?: {
    id: string
    number: number
    seats: number
  } | null
}







