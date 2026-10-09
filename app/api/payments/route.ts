import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { processPaymentSchema } from '@/lib/dto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = processPaymentSchema.parse(body)

    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payment: true },
    })

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { 
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }

    // Simulate payment processing
    const paymentMode = process.env.PAYMENT_MODE || 'sandbox'
    let paymentStatus = 'COMPLETED'
    let transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // In sandbox mode, simulate success
    // In production, integrate with actual payment gateway
    if (paymentMode === 'sandbox') {
      // Simulate payment delay
      await new Promise((resolve) => setTimeout(resolve, 1000))
      paymentStatus = 'COMPLETED'
    } else {
      // Production payment integration would go here
      // For Kaspi/PayBox integration
      // const paymentResult = await processPayment(data.method, order.totalAmount)
      // paymentStatus = paymentResult.success ? 'COMPLETED' : 'FAILED'
      // transactionId = paymentResult.transactionId
    }

    // Update payment
    const payment = await prisma.payment.update({
      where: { orderId: data.orderId },
      data: {
        status: paymentStatus,
        transactionId,
        paidAt: paymentStatus === 'COMPLETED' ? new Date() : null,
      },
    })

    // Update order status
    if (paymentStatus === 'COMPLETED') {
      await prisma.order.update({
        where: { id: data.orderId },
        data: { status: 'CONFIRMED' },
      })
    }

    return NextResponse.json(payment, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error processing payment:', error)
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
      { error: 'Failed to process payment' },
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

