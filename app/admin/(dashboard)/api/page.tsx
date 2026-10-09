"use client"

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Copy, Play, Check, Lock, Unlock } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ApiEndpoint {
  method: string
  path: string
  description: string
  requiresAuth: boolean
  requiresAdmin: boolean
  queryParams?: Array<{ name: string; type: string; required: boolean; description: string }>
  bodyParams?: Array<{ name: string; type: string; required: boolean; description: string }>
  exampleRequest?: any
  exampleResponse?: any
}

const apiEndpoints: ApiEndpoint[] = [
  {
    method: 'GET',
    path: '/api/menu',
    description: 'Получение меню с фильтрацией по категории и поиску',
    requiresAuth: false,
    requiresAdmin: false,
    queryParams: [
      { name: 'category', type: 'string', required: false, description: 'Фильтр по категории (coffee, desserts, drinks)' },
      { name: 'search', type: 'string', required: false, description: 'Поиск по названию или описанию' },
    ],
    exampleResponse: [
      {
        id: 'xxx',
        name: 'Американо',
        description: 'Эспрессо с горячей водой',
        price: 900,
        category: { id: 'yyy', name: 'Кофе', slug: 'coffee' },
      },
    ],
  },
  {
    method: 'GET',
    path: '/api/menu/[id]',
    description: 'Получение конкретного товара меню по ID',
    requiresAuth: false,
    requiresAdmin: false,
    exampleResponse: {
      id: 'xxx',
      name: 'Американо',
      description: 'Эспрессо с горячей водой',
      price: 900,
      image: 'https://images.unsplash.com/...',
      imageUrl: 'https://images.unsplash.com/...',
      category: { id: 'yyy', name: 'Кофе', slug: 'coffee' },
      isActive: true,
    },
  },
  {
    method: 'POST',
    path: '/api/orders',
    description: 'Создание нового заказа',
    requiresAuth: false,
    requiresAdmin: false,
    bodyParams: [
      { name: 'firstName', type: 'string', required: true, description: 'Имя клиента' },
      { name: 'lastName', type: 'string', required: false, description: 'Фамилия клиента' },
      { name: 'phone', type: 'string', required: true, description: 'Телефон клиента' },
      { name: 'email', type: 'string', required: false, description: 'Email клиента' },
      { name: 'orderType', type: 'string', required: true, description: 'Тип заказа (PICKUP, DINE_IN, DELIVERY)' },
      { name: 'paymentMethod', type: 'string', required: true, description: 'Способ оплаты (CASH, CARD, KASPI, PAYBOX, ONLINE)' },
      { name: 'items', type: 'array', required: true, description: 'Массив товаров' },
      { name: 'totalAmount', type: 'number', required: true, description: 'Общая сумма заказа' },
    ],
    exampleRequest: {
      firstName: 'Айгүл',
      lastName: 'Нұрланова',
      phone: '+77001234567',
      email: 'example@mail.com',
      orderType: 'DELIVERY',
      paymentMethod: 'KASPI',
      items: [
        {
          menuItemId: 'xxx',
          quantity: 2,
          unitPrice: 900,
          totalPrice: 1800,
        },
      ],
      totalAmount: 1800,
    },
  },
  {
    method: 'GET',
    path: '/api/orders',
    description: 'Получение списка заказов (требует авторизации, админ видит все, клиент - только свои)',
    requiresAuth: true,
    requiresAdmin: false,
    queryParams: [
      { name: 'customerId', type: 'string', required: false, description: 'ID клиента для фильтрации' },
    ],
  },
  {
    method: 'GET',
    path: '/api/orders/[id]',
    description: 'Получение конкретного заказа по ID',
    requiresAuth: true,
    requiresAdmin: false,
    exampleResponse: {
      id: 'xxx',
      status: 'PENDING',
      totalAmount: 1800,
      orderType: 'DELIVERY',
      customer: { firstName: 'Айгүл', phone: '+77001234567' },
      orderItems: [
        {
          menuItem: { name: 'Американо', price: 900 },
          quantity: 2,
        },
      ],
      payment: { status: 'PENDING', method: 'KASPI' },
    },
  },
  {
    method: 'PATCH',
    path: '/api/orders/[id]',
    description: 'Обновление статуса заказа (требует админ доступ)',
    requiresAuth: true,
    requiresAdmin: true,
    bodyParams: [
      { name: 'status', type: 'string', required: true, description: 'Новый статус (PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED)' },
    ],
    exampleRequest: {
      status: 'CONFIRMED',
    },
  },
  {
    method: 'POST',
    path: '/api/payments',
    description: 'Обработка платежа по заказу',
    requiresAuth: false,
    requiresAdmin: false,
    bodyParams: [
      { name: 'orderId', type: 'string', required: true, description: 'ID заказа' },
      { name: 'method', type: 'string', required: true, description: 'Способ оплаты' },
    ],
    exampleRequest: {
      orderId: 'xxx',
      method: 'KASPI',
    },
  },
  {
    method: 'POST',
    path: '/api/reservations',
    description: 'Создание бронирования столика',
    requiresAuth: false,
    requiresAdmin: false,
    bodyParams: [
      { name: 'firstName', type: 'string', required: true, description: 'Имя клиента' },
      { name: 'lastName', type: 'string', required: false, description: 'Фамилия клиента' },
      { name: 'phone', type: 'string', required: true, description: 'Телефон клиента' },
      { name: 'email', type: 'string', required: false, description: 'Email клиента' },
      { name: 'date', type: 'string', required: true, description: 'Дата бронирования (YYYY-MM-DD)' },
      { name: 'time', type: 'string', required: true, description: 'Время бронирования (HH:MM)' },
      { name: 'partySize', type: 'number', required: true, description: 'Количество гостей' },
      { name: 'note', type: 'string', required: false, description: 'Дополнительные заметки' },
    ],
    exampleRequest: {
      firstName: 'Айгүл',
      lastName: 'Нұрланова',
      phone: '+77001234567',
      email: 'example@mail.com',
      date: '2024-11-20',
      time: '18:00',
      partySize: 4,
      note: 'Окно',
    },
  },
  {
    method: 'GET',
    path: '/api/reservations',
    description: 'Получение списка бронирований (требует авторизации, админ видит все, клиент - только свои)',
    requiresAuth: true,
    requiresAdmin: false,
  },
  {
    method: 'GET',
    path: '/api/reservations/[id]',
    description: 'Получение конкретного бронирования по ID (требует авторизации, админ видит все, клиент - только свое)',
    requiresAuth: true,
    requiresAdmin: false,
    exampleResponse: {
      id: 'xxx',
      date: '2024-11-20',
      time: '18:00',
      partySize: 4,
      status: 'PENDING',
      customer: { firstName: 'Айгүл', phone: '+77001234567' },
      table: { number: 5, seats: 4 },
    },
  },
  {
    method: 'POST',
    path: '/api/reviews',
    description: 'Создание отзыва',
    requiresAuth: false,
    requiresAdmin: false,
    bodyParams: [
      { name: 'customerId', type: 'string', required: false, description: 'ID клиента (если не указан, создается гостевой)' },
      { name: 'menuItemId', type: 'string', required: false, description: 'ID товара меню' },
      { name: 'orderId', type: 'string', required: false, description: 'ID заказа' },
      { name: 'rating', type: 'number', required: true, description: 'Оценка (1-5)' },
      { name: 'comment', type: 'string', required: false, description: 'Текст отзыва' },
    ],
    exampleRequest: {
      customerId: 'xxx',
      menuItemId: 'yyy',
      rating: 5,
      comment: 'Очень вкусно!',
    },
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
    description: 'AI рекомендации кофе на основе предпочтений',
    requiresAuth: false,
    requiresAdmin: false,
    bodyParams: [
      { name: 'taste', type: 'string', required: true, description: 'Вкус (bitter, sweet)' },
      { name: 'milk', type: 'string', required: true, description: 'Молоко (with_milk, black)' },
      { name: 'strength', type: 'string', required: true, description: 'Крепость (light, medium, strong)' },
    ],
    exampleRequest: {
      taste: 'bitter',
      milk: 'black',
      strength: 'strong',
    },
    exampleResponse: {
      recommendations: [
        { name: 'Эспрессо', description: '...' },
        { name: 'Американо', description: '...' },
      ],
    },
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    description: 'Вход пользователя (клиента)',
    requiresAuth: false,
    requiresAdmin: false,
    bodyParams: [
      { name: 'email', type: 'string', required: true, description: 'Email пользователя' },
      { name: 'password', type: 'string', required: true, description: 'Пароль' },
    ],
    exampleRequest: {
      email: 'customer@example.com',
      password: 'password123',
    },
  },
  {
    method: 'POST',
    path: '/api/auth/register',
    description: 'Регистрация нового пользователя (клиента)',
    requiresAuth: false,
    requiresAdmin: false,
    bodyParams: [
      { name: 'email', type: 'string', required: true, description: 'Email пользователя' },
      { name: 'password', type: 'string', required: true, description: 'Пароль' },
      { name: 'firstName', type: 'string', required: true, description: 'Имя' },
      { name: 'lastName', type: 'string', required: false, description: 'Фамилия' },
      { name: 'phone', type: 'string', required: true, description: 'Телефон' },
    ],
    exampleRequest: {
      email: 'customer@example.com',
      password: 'password123',
      firstName: 'Айгүл',
      lastName: 'Нұрланова',
      phone: '+77001234567',
    },
  },
  {
    method: 'GET',
    path: '/api/auth/me',
    description: 'Получение информации о текущем авторизованном пользователе',
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
]

function getMethodColor(method: string) {
  switch (method) {
    case 'GET':
      return 'bg-blue-500'
    case 'POST':
      return 'bg-green-500'
    case 'PATCH':
      return 'bg-yellow-500'
    case 'DELETE':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export default function ApiDocumentationPage() {
  const t = useTranslations('admin')
  const { toast } = useToast()
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null)
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})
  const [bodyParams, setBodyParams] = useState<string>('')
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleSelectEndpoint = async (endpoint: ApiEndpoint) => {
    setSelectedEndpoint(endpoint)
    setResponse(null)
    
    // Инициализируем query параметры (для динамических параметров типа [id] используем ключ 'id')
    const initialQuery: Record<string, string> = {}
    let exampleBody = endpoint.exampleRequest
    
    if (endpoint.path.includes('[id]')) {
      initialQuery.id = ''
      
      // Пытаемся автоматически получить первый доступный ID
      try {
        if (endpoint.path.includes('/api/menu/[id]')) {
          const menuRes = await fetch('/api/menu')
          const menuData = await menuRes.json()
          if (Array.isArray(menuData) && menuData.length > 0) {
            initialQuery.id = menuData[0].id
          }
        } else if (endpoint.path.includes('/api/orders/[id]')) {
          const ordersRes = await fetch('/api/orders')
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json()
            if (Array.isArray(ordersData) && ordersData.length > 0) {
              initialQuery.id = ordersData[0].id
            }
          }
        } else if (endpoint.path.includes('/api/reservations/[id]')) {
          const resRes = await fetch('/api/reservations')
          if (resRes.ok) {
            const resData = await resRes.json()
            if (Array.isArray(resData) && resData.length > 0) {
              initialQuery.id = resData[0].id
            }
          }
        }
      } catch (e) {
        // Игнорируем ошибки при автоматическом получении ID
        console.log('Could not auto-fetch ID:', e)
      }
    }
    
    // Для POST запросов пытаемся получить реальные данные для примеров
    if (endpoint.method === 'POST') {
      try {
        if (endpoint.path === '/api/orders') {
          const menuRes = await fetch('/api/menu')
          const menuData = await menuRes.json()
          if (Array.isArray(menuData) && menuData.length > 0) {
            const firstItem = menuData[0]
            exampleBody = {
              ...endpoint.exampleRequest,
              items: [
                {
                  menuItemId: firstItem.id,
                  quantity: 2,
                  unitPrice: firstItem.price,
                  totalPrice: firstItem.price * 2,
                },
              ],
              totalAmount: firstItem.price * 2,
            }
          }
        } else if (endpoint.path === '/api/reviews') {
          const menuRes = await fetch('/api/menu')
          const menuData = await menuRes.json()
          if (Array.isArray(menuData) && menuData.length > 0) {
            const firstItem = menuData[0]
            exampleBody = {
              ...endpoint.exampleRequest,
              menuItemId: firstItem.id,
            }
          }
        } else if (endpoint.path === '/api/payments') {
          // Для payments нужно получить order ID
          const ordersRes = await fetch('/api/orders')
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json()
            if (Array.isArray(ordersData) && ordersData.length > 0) {
              exampleBody = {
                ...endpoint.exampleRequest,
                orderId: ordersData[0].id,
              }
            }
          }
        }
      } catch (e) {
        console.log('Could not fetch data for example:', e)
      }
    }
    
    endpoint.queryParams?.forEach((param) => {
      if (!param.name.includes('[') && param.name !== 'id') {
        initialQuery[param.name] = ''
      }
    })
    setQueryParams(initialQuery)
    
    // Инициализируем body с примером
    if (exampleBody) {
      setBodyParams(JSON.stringify(exampleBody, null, 2))
    } else {
      setBodyParams('{}')
    }
  }

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedId(id)
    toast({
      title: 'Көшірілді!',
      description: 'Код буферге көшірілді',
    })
    setTimeout(() => setCopiedId(null), 2000)
  }

  const buildUrl = (endpoint: ApiEndpoint) => {
    let url = endpoint.path
    
    // Заменяем динамические параметры [id]
    if (endpoint.path.includes('[id]')) {
      const id = queryParams.id || ''
      if (!id) {
        // Если ID не указан, возвращаем базовый URL (будет обработан в handleTest)
        return endpoint.path
      }
      url = url.replace('[id]', id)
    }
    
    // Добавляем query параметры (исключая id, который уже в path)
    const queryString = endpoint.queryParams
      ?.filter((param) => !param.name.includes('[') && param.name !== 'id' && queryParams[param.name])
      .map((param) => `${param.name}=${encodeURIComponent(queryParams[param.name])}`)
      .join('&')
    
    if (queryString) {
      url += `?${queryString}`
    }
    
    return url
  }

  const handleTest = async () => {
    if (!selectedEndpoint) return

    setLoading(true)
    setResponse(null)

    try {
      let url = buildUrl(selectedEndpoint)
      
      // Если это GET запрос с [id] и ID не указан, пытаемся получить первый доступный ID
      if (selectedEndpoint.method === 'GET' && selectedEndpoint.path.includes('[id]') && !queryParams.id) {
        try {
          // Для /api/menu/[id] получаем первый элемент меню
          if (selectedEndpoint.path.includes('/api/menu/[id]')) {
            const menuRes = await fetch('/api/menu')
            const menuData = await menuRes.json()
            if (Array.isArray(menuData) && menuData.length > 0) {
              url = url.replace('[id]', menuData[0].id)
            } else {
              setResponse({
                status: 404,
                statusText: 'Not Found',
                data: { error: 'No menu items found. Please seed the database first.' },
              })
              setLoading(false)
              return
            }
          }
          // Для /api/orders/[id] получаем первый заказ
          else if (selectedEndpoint.path.includes('/api/orders/[id]')) {
            const ordersRes = await fetch('/api/orders')
            if (ordersRes.ok) {
              const ordersData = await ordersRes.json()
              if (Array.isArray(ordersData) && ordersData.length > 0) {
                url = url.replace('[id]', ordersData[0].id)
              } else {
                setResponse({
                  status: 404,
                  statusText: 'Not Found',
                  data: { error: 'No orders found. Please create an order first.' },
                })
                setLoading(false)
                return
              }
            } else {
              setResponse({
                status: ordersRes.status,
                statusText: ordersRes.statusText,
                data: { error: 'Unauthorized. Please login first.' },
              })
              setLoading(false)
              return
            }
          }
          // Для /api/reservations/[id] получаем первую резервацию
          else if (selectedEndpoint.path.includes('/api/reservations/[id]')) {
            const resRes = await fetch('/api/reservations')
            if (resRes.ok) {
              const resData = await resRes.json()
              if (Array.isArray(resData) && resData.length > 0) {
                url = url.replace('[id]', resData[0].id)
              } else {
                setResponse({
                  status: 404,
                  statusText: 'Not Found',
                  data: { error: 'No reservations found. Please create a reservation first.' },
                })
                setLoading(false)
                return
              }
            } else {
              setResponse({
                status: resRes.status,
                statusText: resRes.statusText,
                data: { error: 'Unauthorized. Please login first.' },
              })
              setLoading(false)
              return
            }
          }
        } catch (e) {
          // Если не удалось получить ID, показываем ошибку
          setResponse({
            error: 'Please enter a valid ID or ensure the database has data.',
          })
          setLoading(false)
          return
        }
      }

      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {} as Record<string, string>,
      }

      if (['POST', 'PATCH'].includes(selectedEndpoint.method)) {
        try {
          const parsedBody = JSON.parse(bodyParams)
          options.body = JSON.stringify(parsedBody)
          options.headers = {
            'Content-Type': 'application/json',
          }
        } catch (e) {
          setResponse({ 
            status: 400,
            statusText: 'Bad Request',
            data: { error: 'Invalid JSON in body' } 
          })
          setLoading(false)
          return
        }
      }

      const res = await fetch(url, options)
      let data
      try {
        data = await res.json()
      } catch (e) {
        data = { error: 'Response is not valid JSON', text: await res.text() }
      }
      
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data,
      })
    } catch (error: any) {
      setResponse({
        status: 500,
        statusText: 'Internal Server Error',
        data: { error: error.message || 'Failed to execute request' },
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">API Документация</h1>
        <p className="text-muted-foreground">
          Барлық API эндпоинттерінің интерактивті документациясы. Барлық сұрауларды көру үшін DevTools (Ctrl+Shift+I) және Network қойындысын ашыңыз.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Список API */}
        <div className="lg:col-span-1 space-y-2">
          <h2 className="text-xl font-semibold mb-4">Эндпоинттер</h2>
          <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
            {apiEndpoints.map((endpoint, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-colors ${
                  selectedEndpoint === endpoint ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleSelectEndpoint(endpoint)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge className={getMethodColor(endpoint.method)}>
                      {endpoint.method}
                    </Badge>
                    <div className="flex gap-1">
                      {endpoint.requiresAuth && (
                        <Lock className="h-4 w-4 text-muted-foreground" aria-label="Requires Auth" />
                      )}
                      {endpoint.requiresAdmin && (
                        <Badge variant="destructive" className="text-xs">
                          Admin
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-sm mt-2">{endpoint.path}</CardTitle>
                  <CardDescription className="text-xs">
                    {endpoint.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Детали и тестирование */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEndpoint ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getMethodColor(selectedEndpoint.method)}>
                        {selectedEndpoint.method}
                      </Badge>
                      <CardTitle>{selectedEndpoint.path}</CardTitle>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(selectedEndpoint.path, 'path')}
                    >
                      {copiedId === 'path' ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <CardDescription>{selectedEndpoint.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Query параметры */}
                  {/* Параметр ID для динамических роутов */}
                  {selectedEndpoint.path.includes('[id]') && (
                    <div>
                      <h3 className="font-semibold mb-2">Жол параметрі</h3>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                            id
                          </code>
                          <Badge variant="default">string</Badge>
                          <Badge variant="destructive" className="text-xs">
                            Міндетті
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">Алу/жаңарту үшін ресурс ID</p>
                        <Input
                          placeholder="ID енгізіңіз"
                          value={queryParams.id || ''}
                          onChange={(e) =>
                            setQueryParams({ ...queryParams, id: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  )}

                  {/* Query параметры */}
                  {selectedEndpoint.queryParams && selectedEndpoint.queryParams.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Сұрау параметрлері</h3>
                      <div className="space-y-2">
                        {selectedEndpoint.queryParams
                          .filter((param) => !param.name.includes('['))
                          .map((param, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                                  {param.name}
                                </code>
                                <Badge variant={param.required ? 'default' : 'secondary'}>
                                  {param.type}
                                </Badge>
                                {param.required && (
                                  <Badge variant="destructive" className="text-xs">
                                    Міндетті
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">{param.description}</p>
                              <Input
                                placeholder={param.name}
                                value={queryParams[param.name] || ''}
                                onChange={(e) =>
                                  setQueryParams({ ...queryParams, [param.name]: e.target.value })
                                }
                              />
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Body параметры */}
                  {selectedEndpoint.bodyParams && selectedEndpoint.bodyParams.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Сұрау денесі</h3>
                      <Textarea
                        value={bodyParams}
                        onChange={(e) => setBodyParams(e.target.value)}
                        className="font-mono text-sm min-h-[200px]"
                        placeholder="Сұрау денесі (JSON)"
                      />
                    </div>
                  )}

                  {/* Кнопка тестирования */}
                  <Button onClick={handleTest} disabled={loading} className="w-full">
                    <Play className="mr-2 h-4 w-4" />
                    {loading ? 'Жіберілуде...' : 'API тестілеу'}
                  </Button>

                  {/* Результат */}
                  {response && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Жауап</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(JSON.stringify(response, null, 2), 'response')}
                        >
                          {copiedId === 'response' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-4 overflow-auto max-h-[400px]">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* Примеры */}
                  {selectedEndpoint.exampleRequest && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Сұрау мысалы</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setBodyParams(JSON.stringify(selectedEndpoint.exampleRequest, null, 2))
                            handleCopy(JSON.stringify(selectedEndpoint.exampleRequest, null, 2), 'example')
                          }}
                        >
                          {copiedId === 'example' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedEndpoint.exampleRequest, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {selectedEndpoint.exampleResponse && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">Жауап мысалы</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopy(JSON.stringify(selectedEndpoint.exampleResponse, null, 2), 'example-resp')}
                        >
                          {copiedId === 'example-resp' ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-4">
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                          {JSON.stringify(selectedEndpoint.exampleResponse, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Мәліметтерді көру және тестілеу үшін эндпоинтті таңдаңыз
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

