import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'
import { updateMenuItemSchema } from '@/lib/dto'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const menuItem = await prisma.menuItem.findUnique({
      where: { id },
      include: { category: true },
    })

    if (!menuItem) {
      return NextResponse.json(
        { error: 'Menu item not found' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }

    if (!menuItem.isActive) {
      return NextResponse.json(
        { error: 'Menu item is not available' },
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store, must-revalidate',
          },
        }
      )
    }

    // Маппим данные для API (image -> imageUrl для совместимости)
    const mappedItem = {
      ...menuItem,
      imageUrl: menuItem.image,
    }

    return NextResponse.json(mappedItem, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching menu item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch menu item' },
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Требуем админ доступ
    const { auth, error } = await requireAuth(request, true)
    if (error) return error

    const { id } = await params
    const body = await request.json()
    const data = updateMenuItemSchema.parse(body)

    const updateData: any = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.price !== undefined) updateData.price = data.price
    if (data.image !== undefined) updateData.image = data.image || null
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const menuItem = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: { category: true },
    })

    return NextResponse.json(
      { ...menuItem, imageUrl: menuItem.image },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error updating menu item:', error)
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
    return NextResponse.json(
      { error: 'Failed to update menu item' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Требуем админ доступ
    const { auth, error } = await requireAuth(request, true)
    if (error) return error

    const { id } = await params

    await prisma.menuItem.delete({
      where: { id },
    })

    return NextResponse.json(
      { message: 'Menu item deleted' },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error deleting menu item:', error)
    return NextResponse.json(
      { error: 'Failed to delete menu item' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  }
}





