# DTO (Data Transfer Objects)

Централизованные Data Transfer Objects для валидации и типизации API запросов и ответов.

## Структура

Все DTO организованы по модулям:

- `auth.dto.ts` - Аутентификация (login, register)
- `order.dto.ts` - Заказы (create, update, query)
- `reservation.dto.ts` - Бронирования
- `review.dto.ts` - Отзывы
- `payment.dto.ts` - Платежи
- `menu.dto.ts` - Меню
- `ai.dto.ts` - AI рекомендации

## Использование

### Импорт DTO

```typescript
import { 
  loginSchema, 
  registerSchema,
  createOrderSchema,
  // ... другие схемы
} from '@/lib/dto'
```

### Валидация запросов в API Routes

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createOrderSchema } from '@/lib/dto'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createOrderSchema.parse(body) // Валидация и типизация
    
    // data теперь типизирован как CreateOrderDto
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }
    // ...
  }
}
```

### TypeScript типы

Все схемы автоматически генерируют TypeScript типы:

```typescript
import type { 
  LoginDto, 
  RegisterDto,
  CreateOrderDto,
  // ... другие типы
} from '@/lib/dto'

// Использование в функциях
async function handleLogin(data: LoginDto) {
  // data типизирован
}
```

## Доступные DTO

### Auth

- `loginSchema` / `LoginDto` - Вход в систему
- `registerSchema` / `RegisterDto` - Регистрация

### Orders

- `createOrderSchema` / `CreateOrderDto` - Создание заказа
- `updateOrderStatusSchema` / `UpdateOrderStatusDto` - Обновление статуса
- `getOrdersQuerySchema` / `GetOrdersQueryDto` - Query параметры для получения заказов
- `orderItemSchema` / `OrderItemDto` - Элемент заказа
- `orderStatusEnum` - Статусы заказа
- `orderTypeEnum` - Типы заказа

### Reservations

- `createReservationSchema` / `CreateReservationDto` - Создание бронирования
- `updateReservationSchema` / `UpdateReservationDto` - Обновление бронирования
- `reservationStatusEnum` - Статусы бронирования

### Reviews

- `createReviewSchema` / `CreateReviewDto` - Создание отзыва
- `updateReviewSchema` / `UpdateReviewDto` - Обновление отзыва
- `getReviewsQuerySchema` / `GetReviewsQueryDto` - Query параметры

### Payments

- `processPaymentSchema` / `ProcessPaymentDto` - Обработка платежа
- `updatePaymentSchema` / `UpdatePaymentDto` - Обновление платежа
- `paymentMethodEnum` - Методы оплаты
- `paymentStatusEnum` - Статусы платежа

### Menu

- `getMenuQuerySchema` / `GetMenuQueryDto` - Query параметры для меню
- `createMenuItemSchema` / `CreateMenuItemDto` - Создание элемента меню (Admin)
- `updateMenuItemSchema` / `UpdateMenuItemDto` - Обновление элемента меню (Admin)

### AI

- `aiRecommendationSchema` / `AIRecommendationDto` - Предпочтения для рекомендаций

## Преимущества

1. **Централизация** - Все схемы валидации в одном месте
2. **Типобезопасность** - Автоматическая генерация TypeScript типов
3. **Переиспользование** - Одна схема используется везде
4. **Консистентность** - Единые правила валидации
5. **Легкость поддержки** - Изменения в одном месте применяются везде

## Примеры

### Валидация с обработкой ошибок

```typescript
import { createOrderSchema } from '@/lib/dto'
import { z } from 'zod'

try {
  const data = createOrderSchema.parse(requestBody)
  // Валидация прошла успешно
} catch (error) {
  if (error instanceof z.ZodError) {
    // Обработка ошибок валидации
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
    return { error: 'Validation failed', details: errors }
  }
}
```

### Использование в клиентском коде

```typescript
import { createOrderSchema, type CreateOrderDto } from '@/lib/dto'

// Типизация данных перед отправкой
const orderData: CreateOrderDto = {
  firstName: 'John',
  phone: '+77001234567',
  orderType: 'DELIVERY',
  // ...
}

// Валидация на клиенте (опционально)
const validated = createOrderSchema.safeParse(orderData)
if (!validated.success) {
  console.error('Validation errors:', validated.error.errors)
}
```







