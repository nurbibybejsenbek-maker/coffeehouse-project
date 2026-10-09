import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { aiRecommendationSchema } from '@/lib/dto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const preferences = aiRecommendationSchema.parse(body)

    // Get all active coffee items
    const coffeeCategory = await prisma.category.findFirst({
      where: { slug: 'coffee' },
    })

    if (!coffeeCategory) {
      return NextResponse.json(
        { recommendations: [] },
        {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }

    const menuItems = await prisma.menuItem.findMany({
      where: {
        categoryId: coffeeCategory.id,
        isActive: true,
      },
    })

    // Simple rule-based scoring
    const scoredItems = menuItems.map((item) => {
      let score = 0
      const name = item.name.toLowerCase()
      const description = (item.description || '').toLowerCase()

      // Taste preference
      if (preferences.taste === 'bitter') {
        if (name.includes('espresso') || name.includes('americano')) score += 3
        if (name.includes('latte') || name.includes('cappuccino')) score += 1
      } else if (preferences.taste === 'sweet') {
        if (name.includes('latte') || name.includes('mocha') || name.includes('caramel')) score += 3
        if (name.includes('espresso')) score += 1
      }

      // Milk preference
      if (preferences.milk === 'with_milk') {
        if (name.includes('latte') || name.includes('cappuccino') || name.includes('mocha')) score += 3
        if (name.includes('americano')) score += 1
      } else if (preferences.milk === 'black') {
        if (name.includes('espresso') || name.includes('americano')) score += 3
        if (name.includes('latte')) score -= 1
      }

      // Strength preference
      if (preferences.strength === 'strong') {
        if (name.includes('espresso') || name.includes('double')) score += 3
        if (name.includes('americano')) score += 2
      } else if (preferences.strength === 'light') {
        if (name.includes('latte') || name.includes('cappuccino')) score += 3
        if (name.includes('espresso')) score += 1
      }

      return { item, score }
    })

    // Sort by score and return top 3
    const recommendations = scoredItems
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ item }) => item)

    return NextResponse.json(
      { recommendations },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error generating recommendations:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  }
}

