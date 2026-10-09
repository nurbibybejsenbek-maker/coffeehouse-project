import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { registerSchema } from '@/lib/dto'
import { normalizePhone } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = registerSchema.parse(body)

    // Normalize phone number for consistent storage
    const normalizedPhone = normalizePhone(data.phone)

    // Check if email already exists (only if email is provided and not null)
    const existingCustomerByEmail = data.email 
      ? await prisma.customer.findUnique({
          where: { email: data.email },
        })
      : null

    if (existingCustomerByEmail && existingCustomerByEmail.passwordHash) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if phone already exists
    const existingCustomerByPhone = await prisma.customer.findFirst({
      where: { phone: normalizedPhone },
    })

    // If customer exists by phone but has no password (was created during order),
    // update the customer with registration data
    if (existingCustomerByPhone) {
      if (existingCustomerByPhone.passwordHash) {
        // Phone is already registered with password
        // Check if email matches - if yes, suggest login, if no, suggest using different phone
        if (existingCustomerByPhone.email && existingCustomerByPhone.email.toLowerCase() === data.email.toLowerCase()) {
          return NextResponse.json(
            { error: 'This phone number and email are already registered. Please login instead.' },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: 'This phone number is already registered with a different account. Please use a different phone number or login with your existing account.' },
            { status: 400 }
          )
        }
      }

      // Update existing customer (created during order/reservation) with registration data
      const passwordHash = await bcrypt.hash(data.password, 10)
      
      const customer = await prisma.customer.update({
        where: { id: existingCustomerByPhone.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          passwordHash,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      })

      return NextResponse.json(
        {
          message: 'Registration successful. Your account has been created.',
          customer,
        },
        { status: 201 }
      )
    }

    // If email exists but no password (edge case)
    if (existingCustomerByEmail && !existingCustomerByEmail.passwordHash) {
      const passwordHash = await bcrypt.hash(data.password, 10)
      
      const customer = await prisma.customer.update({
        where: { id: existingCustomerByEmail.id },
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phone: normalizedPhone,
          passwordHash,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          createdAt: true,
        },
      })

      return NextResponse.json(
        {
          message: 'Registration successful. Your account has been created.',
          customer,
        },
        { status: 201 }
      )
    }

    // Create new customer
    const passwordHash = await bcrypt.hash(data.password, 10)

    const customer = await prisma.customer.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: normalizedPhone,
        email: data.email,
        passwordHash,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    })

    return NextResponse.json(
      {
        message: 'Registration successful',
        customer,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error registering customer:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    }
    
    // Handle Prisma unique constraint errors
    if (error && typeof error === 'object' && 'code' in error) {
      if ((error as any).code === 'P2002') {
        const target = (error as any).meta?.target
        if (target && Array.isArray(target) && target.includes('email')) {
          return NextResponse.json(
            { error: 'Email already registered' },
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
            }
          )
        }
        if (target && Array.isArray(target) && target.includes('phone')) {
          return NextResponse.json(
            { error: 'Phone number already registered. Please login instead.' },
            { 
              status: 400,
              headers: {
                'Content-Type': 'application/json; charset=utf-8',
              },
            }
          )
        }
      }
    }
    
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Registration error details:', {
      message: errorMessage,
      error: error,
    })
    
    return NextResponse.json(
      { 
        error: 'Failed to register',
        message: errorMessage,
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  }
}

