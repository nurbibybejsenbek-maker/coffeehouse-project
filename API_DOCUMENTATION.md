# API Документация - CoffeeHouse

## 📡 API Endpoints и их связи

### 🔗 Схема взаимодействия API

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React/Next.js)                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      API ROUTES                              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   /api/menu  │    │ /api/orders  │    │/api/payments│
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE (SQLite/Prisma)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Список всех API Endpoints

### 1. **GET /api/menu** - Получение меню
**Описание:** Получает список всех активных товаров из меню

**Query параметры:**
- `category` (опционально) - фильтр по категории (coffee, desserts, drinks)
- `search` (опционально) - поиск по названию или описанию

**Пример запроса:**
```javascript
fetch('/api/menu?category=coffee&search=американо')
```

**Ответ:**
```json
[
  {
    "id": "xxx",
    "name": "Американо",
    "description": "Эспрессо қайнаған сумен",
    "price": 900,
    "category": { "id": "yyy", "name": "Кофе", "slug": "coffee" }
  }
]
```

**Связи:**
- Использует: `prisma.menuItem`, `prisma.category`
- Используется в: `app/[locale]/menu/page.tsx`

---

### 2. **POST /api/orders** - Создание заказа
**Описание:** Создает новый заказ и связанные записи

**Body:**
```json
{
  "firstName": "Айгүл",
  "lastName": "Нұрланова",
  "phone": "+77001234567",
  "email": "example@mail.com",
  "address": "Алматы, ул. Абая 1",
  "orderType": "DELIVERY",
  "paymentMethod": "KASPI",
  "items": [
    {
      "menuItemId": "xxx",
      "quantity": 2,
      "unitPrice": 900,
      "totalPrice": 1800
    }
  ],
  "totalAmount": 1800
}
```

**Процесс:**
1. Находит или создает клиента (`Customer`)
2. Создает заказ (`Order`)
3. Создает элементы заказа (`OrderItem`)
4. Создает запись о платеже (`Payment`)

**Связи:**
- Создает: `Customer`, `Order`, `OrderItem`, `Payment`
- Используется в: `app/[locale]/order/page.tsx`

---

### 3. **GET /api/orders** - Получение заказов
**Описание:** Получает список всех заказов

**Query параметры:**
- `customerId` (опционально) - фильтр по клиенту

**Ответ:**
```json
[
  {
    "id": "xxx",
    "status": "PENDING",
    "totalAmount": 1800,
    "orderType": "DELIVERY",
    "customer": { "firstName": "Айгүл", "phone": "+77001234567" },
    "orderItems": [
      {
        "menuItem": { "name": "Американо", "price": 900 },
        "quantity": 2
      }
    ]
  }
]
```

**Связи:**
- Использует: `prisma.order`, `prisma.orderItem`, `prisma.customer`
- Используется в: `app/admin/orders/page.tsx`

---

### 4. **GET /api/orders/[id]** - Получение конкретного заказа
**Описание:** Получает детали одного заказа

**Ответ:**
```json
{
  "id": "xxx",
  "status": "PENDING",
  "totalAmount": 1800,
  "customer": { ... },
  "orderItems": [ ... ],
  "payment": { "status": "PENDING", "method": "KASPI" }
}
```

**Связи:**
- Использует: `prisma.order` с включением связанных данных
- Используется в: страницах деталей заказа

---

### 5. **PATCH /api/orders/[id]** - Обновление статуса заказа
**Описание:** Обновляет статус заказа (PENDING → CONFIRMED → COMPLETED)

**Body:**
```json
{
  "status": "CONFIRMED"
}
```

**Связи:**
- Обновляет: `prisma.order`
- Используется в: админ-панели

---

### 6. **POST /api/payments** - Обработка платежа
**Описание:** Обрабатывает платеж по заказу

**Body:**
```json
{
  "orderId": "xxx",
  "method": "KASPI"
}
```

**Процесс:**
1. Находит заказ
2. Симулирует обработку платежа (sandbox режим)
3. Обновляет статус платежа (`Payment`)
4. Обновляет статус заказа (`Order` → CONFIRMED)

**Связи:**
- Использует: `prisma.order`, `prisma.payment`
- Обновляет: `Payment.status`, `Order.status`
- Используется в: процессе оформления заказа

---

### 7. **POST /api/reservations** - Создание бронирования
**Описание:** Создает бронирование столика

**Body:**
```json
{
  "firstName": "Айгүл",
  "lastName": "Нұрланова",
  "phone": "+77001234567",
  "email": "example@mail.com",
  "date": "2024-11-20",
  "time": "18:00",
  "partySize": 4,
  "note": "Окно"
}
```

**Процесс:**
1. Находит или создает клиента (`Customer`)
2. Ищет свободный столик (`Table`)
3. Создает бронирование (`Reservation`)

**Связи:**
- Создает: `Customer`, `Reservation`
- Использует: `prisma.table` (поиск свободных столов)
- Используется в: `app/[locale]/reservation/page.tsx`

---

### 8. **GET /api/reservations** - Получение бронирований
**Описание:** Получает список всех бронирований

**Ответ:**
```json
[
  {
    "id": "xxx",
    "date": "2024-11-20",
    "time": "18:00",
    "partySize": 4,
    "status": "PENDING",
    "customer": { "firstName": "Айгүл", "phone": "+77001234567" },
    "table": { "number": 5, "seats": 4 }
  }
]
```

**Связи:**
- Использует: `prisma.reservation` с включением `customer` и `table`
- Используется в: админ-панели

---

### 9. **POST /api/reviews** - Создание отзыва
**Описание:** Создает новый отзыв

**Body:**
```json
{
  "customerId": "xxx",
  "menuItemId": "yyy",
  "rating": 5,
  "comment": "Өте дәмді!"
}
```

**Связи:**
- Создает: `Review`
- Использует: `prisma.customer`, `prisma.menuItem`
- Используется в: `app/[locale]/reviews/page.tsx`

---

### 10. **GET /api/reviews** - Получение отзывов
**Описание:** Получает список всех отзывов

**Ответ:**
```json
[
  {
    "id": "xxx",
    "rating": 5,
    "comment": "Өте дәмді!",
    "customer": { "firstName": "Айгүл" },
    "menuItem": { "name": "Американо" }
  }
]
```

**Связи:**
- Использует: `prisma.review` с включением `customer` и `menuItem`
- Используется в: `app/[locale]/reviews/page.tsx`

---

### 11. **POST /api/ai/recommend** - AI рекомендации
**Описание:** Генерирует рекомендации кофе на основе предпочтений

**Body:**
```json
{
  "taste": "bitter",
  "milk": "black",
  "strength": "strong"
}
```

**Процесс:**
1. Получает все кофе из категории "coffee"
2. Применяет правила для оценки каждого напитка
3. Возвращает топ-3 рекомендации

**Ответ:**
```json
{
  "recommendations": [
    { "name": "Эспрессо", "description": "..." },
    { "name": "Американо", "description": "..." }
  ]
}
```

**Связи:**
- Использует: `prisma.category`, `prisma.menuItem`
- Используется в: компонентах рекомендаций

---

### 12. **GET/POST /api/auth/[...nextauth]** - Аутентификация
**Описание:** NextAuth.js endpoints для входа

**Процесс:**
1. POST - проверяет email/password
2. Создает JWT токен
3. Возвращает сессию с ролью (ADMIN/STAFF)

**Связи:**
- Использует: `prisma.user`
- Используется в: `app/admin/login/page.tsx`

---

## 🔄 Поток данных между API

### Пример: Создание заказа

```
1. Frontend (order/page.tsx)
   │
   ├─► POST /api/orders
   │   │
   │   ├─► Проверка данных (Zod validation)
   │   │
   │   ├─► Поиск/создание Customer
   │   │   └─► prisma.customer.findFirst() или create()
   │   │
   │   ├─► Создание Order
   │   │   └─► prisma.order.create()
   │   │       └─► Создание OrderItem (вложенные)
   │   │
   │   └─► Создание Payment
   │       └─► prisma.payment.create()
   │
   └─► Ответ: { order: {...}, id: "xxx" }
       │
       └─► Frontend перенаправляет на /order/[id]
           │
           └─► GET /api/orders/[id] (получение деталей)
```

### Пример: Обработка платежа

```
1. Frontend
   │
   ├─► POST /api/payments
   │   │
   │   ├─► Находит Order
   │   │   └─► prisma.order.findUnique()
   │   │
   │   ├─► Симуляция платежа (sandbox)
   │   │   └─► Задержка 1 секунда
   │   │
   │   ├─► Обновление Payment
   │   │   └─► prisma.payment.update()
   │   │       └─► status: "COMPLETED"
   │   │
   │   └─► Обновление Order
   │       └─► prisma.order.update()
   │           └─► status: "CONFIRMED"
   │
   └─► Ответ: { payment: {...}, status: "COMPLETED" }
```

---

## 🗄️ Связи с базой данных

### Модели и их связи:

```
User (Админы)
  └─► Используется в: /api/auth

Customer (Клиенты)
  ├─► Order (1 ко многим)
  ├─► Reservation (1 ко многим)
  └─► Review (1 ко многим)

Category (Категории)
  └─► MenuItem (1 ко многим)

MenuItem (Товары меню)
  ├─► OrderItem (1 ко многим)
  └─► Review (1 ко многим)

Order (Заказы)
  ├─► OrderItem (1 ко многим)
  ├─► Payment (1 к 1)
  └─► Customer (многие к 1)

Reservation (Бронирования)
  ├─► Customer (многие к 1)
  └─► Table (многие к 1)

Table (Столы)
  └─► Reservation (1 ко многим)
```

---

## 📊 Как проверить API связи

### 1. Через браузер (DevTools)
- Откройте DevTools → Network
- Выполните действие на сайте (например, создайте заказ)
- Посмотрите запросы к API

### 2. Через терминал (curl)
```bash
# Получить меню
curl http://localhost:3000/api/menu

# Получить заказы
curl http://localhost:3000/api/orders

# Создать заказ
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Тест","phone":"+7700","orderType":"PICKUP","paymentMethod":"CASH","items":[],"totalAmount":0}'
```

### 3. Через код
Все API вызовы находятся в:
- `app/[locale]/order/page.tsx` - создание заказов
- `app/[locale]/reservation/page.tsx` - бронирования
- `app/[locale]/reviews/page.tsx` - отзывы
- `app/admin/orders/page.tsx` - просмотр заказов

---

## 🔍 Где найти API связи в коде

1. **Frontend → API:**
   - Ищите `fetch('/api/...')` в компонентах
   - Файлы: `app/[locale]/*/page.tsx`

2. **API → Database:**
   - Ищите `prisma.*` в файлах `app/api/*/route.ts`

3. **API → API:**
   - В этом проекте API не вызывают друг друга напрямую
   - Все связи через базу данных (Prisma)

---

## ✅ Проверка работоспособности

Все API endpoints работают и связаны между собой через:
- ✅ Базу данных (SQLite через Prisma)
- ✅ Валидацию данных (Zod)
- ✅ Обработку ошибок
- ✅ Логирование







