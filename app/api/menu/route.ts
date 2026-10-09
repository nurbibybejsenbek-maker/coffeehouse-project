import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getMenuQuerySchema, createMenuItemSchema } from '@/lib/dto'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Проверяем, админ ли это (для админа показываем все товары, включая неактивные)
    let isAdmin = false
    try {
      const { auth } = await requireAuth(request, false)
      isAdmin = auth.isAdmin
    } catch {
      // Не авторизован - это нормально для публичного API
    }

    const { searchParams } = new URL(request.url)
    const query = getMenuQuerySchema.parse({
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
    })
    const { category, search } = query

    const where: any = {}
    // Для обычных пользователей показываем только активные товары
    if (!isAdmin) {
      where.isActive = true
    }

    if (category) {
      const categoryRecord = await prisma.category.findUnique({
        where: { slug: category },
      })
      if (categoryRecord) {
        where.categoryId = categoryRecord.id
      }
    }

    // Для SQLite получаем все элементы и фильтруем на JavaScript
    const allMenuItems = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    // Фильтруем по поисковому запросу на стороне JavaScript (без учета регистра)
    const menuItems = search
      ? allMenuItems.filter((item) => {
          const searchLower = search.toLowerCase()
          return (
            item.name.toLowerCase().includes(searchLower) ||
            (item.description?.toLowerCase().includes(searchLower) ?? false)
          )
        })
      : allMenuItems

    // Маппим данные для API
    // Для админа возвращаем как есть, для обычных пользователей - imageUrl для совместимости
    const mappedItems = menuItems.map((item) => {
      if (isAdmin) {
        return item
      }
      return {
        ...item,
        imageUrl: item.image,
      }
    })

    return NextResponse.json(mappedItems, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate', // Отключаем кэширование
      },
    })
  } catch (error) {
    console.error('Error fetching menu:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        }
      )
    }
    return NextResponse.json(
      { error: 'Failed to fetch menu' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Требуем админ доступ
    const { auth, error } = await requireAuth(request, true)
    if (error) return error

    const body = await request.json()
    const data = createMenuItemSchema.parse(body)

    const menuItem = await prisma.menuItem.create({
      data: {
        name: data.name,
        description: data.description || undefined,
        price: data.price,
        image: data.image || undefined,
        categoryId: data.categoryId,
        isActive: data.isActive,
      },
      include: { category: true },
    })

    return NextResponse.json(
      { ...menuItem, imageUrl: menuItem.image },
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store, must-revalidate',
        },
      }
    )
  } catch (error) {
    console.error('Error creating menu item:', error)
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
      { error: 'Failed to create menu item' },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
        },
      }
    )
  }
}

