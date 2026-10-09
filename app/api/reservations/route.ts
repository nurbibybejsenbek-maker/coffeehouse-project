import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createReservationSchema } from '@/lib/dto'
import { requireAuth } from '@/lib/api-auth'
import { normalizePhone } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createReservationSchema.parse(body)

    // Normalize phone number for consistent storage
    const normalizedPhone = normalizePhone(data.phone)

    // Find or create customer
    let customer = await prisma.customer.findFirst({
      where: { phone: normalizedPhone },
    })

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: normalizedPhone,
          email: data.email || undefined,
        },
      })
    }

    // Find available table
    const availableTables = await prisma.table.findMany({
      where: {
        isActive: true,
        seats: { gte: data.partySize },
      },
    })

    let tableId: string | undefined
    if (availableTables.length > 0) {
      // Simple assignment - first available table
      tableId = availableTables[0].id
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        customerId: customer.id,
        tableId: tableId,
        date: new Date(data.date),
        time: data.time,
        partySize: data.partySize,
        note: data.note,
        status: 'PENDING',
      },
      include: {
        customer: true,
        table: true,
      },
    })

    return NextResponse.json(reservation, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error creating reservation:', error)
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
      { error: 'Failed to create reservation' },
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
    // Требуем авторизацию (админ видит все, клиент - только свои)
    const { auth, error } = await requireAuth(request, false)
    if (error) return error

    // Если клиент (не админ), показывает только свои бронирования
    let where: any = undefined
    if (!auth.isAdmin && auth.user) {
      const customer = await prisma.customer.findUnique({
        where: { id: auth.user.id },
      })
      if (customer) {
        where = { customerId: customer.id }
      } else {
        return NextResponse.json([], {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        })
      }
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        customer: true,
        table: true,
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json(reservations, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
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

