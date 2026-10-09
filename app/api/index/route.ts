import { NextResponse } from 'next/server'

/**
 * GET /api/index
 * Возвращает список всех доступных API эндпоинтов
 * Публичный эндпоинт для документации
 */
export async function GET() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/menu',
      description: 'Получение меню с фильтрацией',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/menu/[id]',
      description: 'Получение конкретного товара меню по ID',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'POST',
      path: '/api/orders',
      description: 'Создание нового заказа',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/orders',
      description: 'Получение списка заказов',
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/orders/[id]',
      description: 'Получение конкретного заказа',
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      method: 'PATCH',
      path: '/api/orders/[id]',
      description: 'Обновление статуса заказа',
      requiresAuth: true,
      requiresAdmin: true,
    },
    {
      method: 'POST',
      path: '/api/payments',
      description: 'Обработка платежа',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'POST',
      path: '/api/reservations',
      description: 'Создание бронирования',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/reservations',
      description: 'Получение списка бронирований',
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/reservations/[id]',
      description: 'Получение конкретного бронирования по ID',
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      method: 'POST',
      path: '/api/reviews',
      description: 'Создание отзыва',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/reviews',
      description: 'Получение списка отзывов',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'POST',
      path: '/api/ai/recommend',
      description: 'AI рекомендации кофе',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'POST',
      path: '/api/auth/login',
      description: 'Вход пользователя',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'POST',
      path: '/api/auth/register',
      description: 'Регистрация пользователя',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/auth/me',
      description: 'Получение информации о текущем пользователе',
      requiresAuth: true,
      requiresAdmin: false,
    },
    {
      method: 'POST',
      path: '/api/auth/logout',
      description: 'Выход пользователя',
      requiresAuth: false,
      requiresAdmin: false,
    },
    {
      method: 'GET',
      path: '/api/contact',
      description: 'Получение контактной информации',
      requiresAuth: false,
      requiresAdmin: false,
    },
  ]

  return NextResponse.json(
    {
      message: 'CoffeeHouse API Endpoints',
      endpoints,
      documentation: '/admin/api',
      total: endpoints.length,
    },
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      },
    }
  )
}

