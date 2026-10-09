import { z } from 'zod'

/**
 * DTO для AI рекомендаций
 */

// ==================== AI Recommendation Preferences ====================

export const aiRecommendationSchema = z.object({
  taste: z.enum(['bitter', 'sweet']).optional(),
  milk: z.enum(['with_milk', 'black']).optional(),
  strength: z.enum(['light', 'medium', 'strong']).optional(),
})

export type AIRecommendationDto = z.infer<typeof aiRecommendationSchema>

// ==================== Response Types ====================

export interface AIRecommendationResponseDto {
  recommendations: Array<{
    id: string
    name: string
    description: string | null
    price: number
    image: string | null
    categoryId: string
    isActive: boolean
  }>
}







