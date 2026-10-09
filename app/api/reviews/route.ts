import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createReviewSchema } from '@/lib/dto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createReviewSchema.parse(body)

    // For now, create a dummy customer if not provided
    // In production, this would come from authenticated session
    let customerId = data.customerId
    if (!customerId) {
      const customer = await prisma.customer.create({
        data: {
          firstName: 'Guest',
          phone: `guest-${Date.now()}`,
        },
      })
      customerId = customer.id
    }

    const review = await prisma.review.create({
      data: {
        customerId,
        menuItemId: data.menuItemId,
        orderId: data.orderId,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        customer: true,
        menuItem: true,
      },
    })

    return NextResponse.json(review, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error creating review:', error)
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join(', ')
      return NextResponse.json(
        { 
          error: 'Invalid request data', 
          message: errorMessages,
          details: error.errors 
        },
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
      { error: 'Failed to create review', message: error instanceof Error ? error.message : 'Unknown error' },
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

export async function GET(request: NextRequest) {
  try {
    const reviews = await prisma.review.findMany({
      include: {
        customer: true,
        menuItem: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(reviews, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
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

