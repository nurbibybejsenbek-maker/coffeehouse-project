import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

const updateReservationStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Требуем админ доступ для обновления бронирования
    const { auth, error } = await requireAuth(request, true)
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const { status } = updateReservationStatusSchema.parse(body)

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        customer: true,
        table: true,
      },
    })

    return NextResponse.json(reservation, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error updating reservation:', error)
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
      { error: 'Failed to update reservation' },
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Проверяем авторизацию (админ видит все, клиент - только свои)
    const { auth, error } = await requireAuth(request, false)
    if (error) return error

    const { id } = await params
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        customer: true,
        table: true,
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }

    // Если клиент (не админ), может видеть только свою резервацию
    if (!auth.isAdmin && auth.user) {
      const customer = await prisma.customer.findUnique({
        where: { id: auth.user.id },
      })
      if (customer && reservation.customerId !== customer.id) {
        return NextResponse.json(
          { error: 'Forbidden', message: 'You can only view your own reservations' },
          { 
            status: 403,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store, must-revalidate',
            },
          }
        )
      }
    }

    return NextResponse.json(reservation, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
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

