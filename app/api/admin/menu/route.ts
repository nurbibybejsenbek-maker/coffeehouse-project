import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/api-auth'

export async function GET(request: NextRequest) {
  try {
    // Требуем админ доступ
    const { auth, error } = await requireAuth(request, true)
    if (error) return error

    // Для админа возвращаем все товары (включая неактивные)
    const menuItems = await prisma.menuItem.findMany({
      include: { category: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(menuItems, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    })
  } catch (error) {
    console.error('Error fetching menu:', error)
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

