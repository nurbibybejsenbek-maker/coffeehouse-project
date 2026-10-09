import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createOrderSchema, getOrdersQuerySchema } from '@/lib/dto'
import { requireAuth } from '@/lib/api-auth'
import { normalizePhone } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createOrderSchema.parse(body)

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

    // Create order
    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        status: 'PENDING',
        totalAmount: data.totalAmount,
        orderType: data.orderType,
        orderItems: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: {
        orderItems: {
          include: {
            menuItem: true,
          },
        },
        customer: true,
      },
    })

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        method: data.paymentMethod,
        status: 'PENDING',
        amount: data.totalAmount,
      },
    })

    // Return order with payment
    const orderWithPayment = {
      ...order,
      payment,
    }

    return NextResponse.json(orderWithPayment, { 
      status: 201,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error creating order:', error)
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
      { error: 'Failed to create order' },
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
    // Проверяем авторизацию
    const { auth, error } = await requireAuth(request, false)
    if (error) return error

    const { searchParams } = new URL(request.url)
    const query = getOrdersQuerySchema.parse({
      customerId: searchParams.get('customerId') || undefined,
    })
    
    // Если клиент (не админ), может видеть только свои заказы
    let customerId = query.customerId
    if (!auth.isAdmin && auth.user) {
      // Получаем customerId из Customer таблицы
      const customer = await prisma.customer.findUnique({
        where: { id: auth.user.id },
      })
      if (customer) {
        customerId = customer.id
      } else {
        // Если не найден в Customer, возвращаем пустой список
        return NextResponse.json([], {
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        })
      }
    }

    const orders = await prisma.order.findMany({
      where: customerId ? { customerId } : undefined,
      include: {
        orderItems: {
          include: {
            menuItem: {
              include: {
                category: true,
              },
            },
          },
        },
        customer: true,
        payment: true,
      },
      orderBy: { placedAt: 'desc' },
    })

    return NextResponse.json(orders, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
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

