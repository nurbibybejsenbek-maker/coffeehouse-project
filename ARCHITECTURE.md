# Архитектура проекта CoffeeHouse

## 📋 Обзор

**CoffeeHouse** — это полнофункциональное веб-приложение для кофейни, построенное на **Next.js 14** с использованием **App Router**, **TypeScript**, **Prisma ORM** и **SQLite/PostgreSQL**.

---

## 🏗️ Общая архитектура

### Технологический стек

- **Frontend Framework**: Next.js 14 (App Router)

- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Database**: SQLite (dev) / PostgreSQL (production)
- **ORM**: Prisma
- **Authentication**: NextAuth.js (JWT)
- **Internationalization**: next-intl (kk, ru, en)
- **State Management**: React Hooks + localStorage
- **Form Validation**: Zod + React Hook Form
- **Animations**: Framer Motion
- **PWA**: Service Worker + Manifest

---

## 📁 Структура проекта

```
Coffee.WEB/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Локализованные страницы
│   │   ├── page.tsx              # Главная страница
│   │   ├── menu/                 # Меню
│   │   ├── cart/                 # Корзина
│   │   ├── order/                # Заказы
│   │   ├── reservation/          # Бронирования
│   │   ├── reviews/              # Отзывы
│   │   ├── profile/              # Профиль
│   │   ├── login/                # Вход
│   │   ├── register/             # Регистрация
│   │   └── layout.tsx            # Layout с Navbar/Footer
│   ├── admin/                    # Админ-панель
│   │   ├── page.tsx              # Дашборд
│   │   ├── orders/               # Управление заказами
│   │   ├── login/                # Вход в админку
│   │   └── layout.tsx             # Layout с проверкой прав
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Аутентификация
│   │   ├── menu/                 # Меню
│   │   ├── orders/               # Заказы
│   │   ├── payments/             # Платежи
│   │   ├── reservations/         # Бронирования
│   │   ├── reviews/              # Отзывы
│   │   ├── ai/                   # AI рекомендации
│   │   └── contact/              # Контакты
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Глобальные стили
├── components/                    # React компоненты
│   ├── ui/                       # Базовые UI компоненты (shadcn)
│   ├── navbar.tsx                # Навигация
│   ├── footer.tsx                # Футер
│   ├── cart-button.tsx           # Кнопка корзины
│   └── ...
├── lib/                          # Утилиты и библиотеки
│   ├── prisma.ts                 # Prisma Client
│   ├── auth.ts                   # NextAuth конфигурация
│   ├── api-client.ts             # Централизованный API клиент
│   ├── api-auth.ts               # API аутентификация
│   ├── utils.ts                  # Вспомогательные функции
│   └── dto/                      # Data Transfer Objects (Zod схемы)
├── hooks/                        # React хуки
│   ├── use-cart.ts               # Управление корзиной
│   ├── use-auth.ts               # Аутентификация
│   └── use-toast.ts              # Уведомления
├── prisma/                       # Prisma
│   ├── schema.prisma             # Схема базы данных
│   ├── seed.ts                   # Начальные данные
│   └── dev.db                    # SQLite база (dev)
├── messages/                     # Переводы
│   ├── kk.json                   # Казахский
│   ├── ru.json                   # Русский
│   └── en.json                   # Английский
├── public/                       # Статические файлы
│   ├── manifest.json             # PWA манифест
│   └── icons/                    # Иконки
├── middleware.ts                 # Next.js middleware
├── i18n.ts                       # Конфигурация i18n
└── next.config.js                # Конфигурация Next.js
```

---

## 🔄 Потоки данных

### 1. **Рендеринг**

```
┌─────────────────┐
│   Browser       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Middleware     │ ◄─── Интернационализация + Аутентификация
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  App Router     │ ◄─── Маршрутизация по [locale]
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Server/Client  │ ◄─── Server Components (по умолчанию)
│  Components     │     Client Components ("use client")
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Routes     │ ◄─── REST API endpoints
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prisma Client  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Database       │ ◄─── SQLite / PostgreSQL
└─────────────────┘
```

### 2. **Аутентификация**

```
Пользователь → Login Form
    ↓
POST /api/auth/login
    ↓
lib/auth.ts (NextAuth)
    ↓
Prisma → User table
    ↓
JWT Token (session)
    ↓
Middleware проверяет права
    ↓
Доступ к защищенным страницам
```

### 3. **API запросы**

```
Client Component
    ↓
lib/api-client.ts (централизованный клиент)
    ↓
fetch('/api/...')
    ↓
app/api/.../route.ts
    ↓
lib/api-auth.ts (проверка прав)
    ↓
lib/dto/... (валидация Zod)
    ↓
Prisma → Database
    ↓
Response (JSON)
```

---

## 🗄️ База данных (Prisma Schema)

### Модели данных

#### **User** (Администраторы/Персонал)
- `id`, `email`, `username`, `passwordHash`
- `role`: ADMIN | STAFF
- Используется для входа в админ-панель

#### **Customer** (Клиенты)
- `id`, `firstName`, `lastName`, `phone`, `email`
- `passwordHash` (опционально, для регистрации)
- Связи: `orders`, `reservations`, `reviews`

#### **Category** (Категории меню)
- `id`, `name`, `slug`, `description`
- Связь: `menuItems` (один-ко-многим)

#### **MenuItem** (Позиции меню)
- `id`, `name`, `description`, `price`, `image`
- `categoryId`, `isActive`
- Связи: `category`, `orderItems`, `reviews`

#### **Order** (Заказы)
- `id`, `customerId`, `status`, `totalAmount`
- `orderType`: PICKUP | DINE_IN | DELIVERY
- `status`: PENDING → CONFIRMED → PREPARING → READY → COMPLETED
- Связи: `customer`, `orderItems`, `payment`

#### **OrderItem** (Элементы заказа)
- `id`, `orderId`, `menuItemId`, `quantity`
- `unitPrice`, `totalPrice`

#### **Payment** (Платежи)
- `id`, `orderId`, `method`, `status`, `amount`
- `method`: CASH | CARD | KASPI | PAYBOX | ONLINE
- `status`: PENDING | COMPLETED | FAILED | REFUNDED

#### **Table** (Столы)
- `id`, `number`, `seats`, `isActive`
- Связь: `reservations`

#### **Reservation** (Бронирования)
- `id`, `customerId`, `tableId`, `date`, `time`
- `partySize`, `note`, `status`
- `status`: PENDING | CONFIRMED | CANCELLED | COMPLETED

#### **Review** (Отзывы)
- `id`, `customerId`, `menuItemId`, `orderId`
- `rating` (1-5), `comment`

---

## 🔐 Аутентификация и авторизация

### Два типа пользователей

1. **Admin/Staff** (User модель)
   - Вход через `/admin/login`
   - NextAuth.js с JWT
   - Роли: `ADMIN`, `STAFF`
   - Защита через `middleware.ts`

2. **Customer** (Customer модель)
   - Регистрация/вход через `/login`, `/register`
   - Простая сессия (JWT через API)
   - Доступ к заказам, бронированиям

### Middleware логика

```typescript
// middleware.ts
1. Проверка пути (/admin → требует авторизации)
2. NextAuth middleware для админки
3. next-intl middleware для локализации
4. Пропуск API routes
```

---

## 🌐 Интернационализация (i18n)

### Структура

- **Локали**: `kk` (казахский), `ru` (русский), `en` (английский)
- **По умолчанию**: `kk`
- **URL структура**: `/[locale]/...`
- **Файлы переводов**: `messages/{locale}.json`

### Использование

```typescript
// Server Component
import { useTranslations } from 'next-intl'

// Client Component
import { useTranslations } from 'next-intl'
```

---

## 📡 API Architecture

### Централизованный клиент (`lib/api-client.ts`)

Все API вызовы проходят через единый клиент:

```typescript
apiClient.menu.getMenu()
apiClient.orders.createOrder()
apiClient.auth.login()
// и т.д.
```

### API Endpoints

#### **Auth**
- `POST /api/auth/login` - Вход
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/logout` - Выход
- `GET /api/auth/me` - Текущий пользователь

#### **Menu**
- `GET /api/menu` - Список меню (с фильтрами)
- `GET /api/menu/[id]` - Элемент меню

#### **Orders**
- `POST /api/orders` - Создать заказ
- `GET /api/orders` - Список заказов
- `GET /api/orders/[id]` - Заказ по ID
- `PATCH /api/orders/[id]` - Обновить статус

#### **Payments**
- `POST /api/payments` - Обработать платеж

#### **Reservations**
- `POST /api/reservations` - Создать бронирование
- `GET /api/reservations` - Список бронирований
- `GET /api/reservations/[id]` - Бронирование по ID

#### **Reviews**
- `GET /api/reviews` - Список отзывов
- `POST /api/reviews` - Создать отзыв

#### **AI**
- `POST /api/ai/recommend` - Рекомендации на основе предпочтений

#### **Contact**
- `GET /api/contact` - Контактная информация

### Валидация данных

Все API endpoints используют **Zod схемы** из `lib/dto/`:

```typescript
// lib/dto/order.dto.ts
export const createOrderSchema = z.object({...})

// app/api/orders/route.ts
const data = createOrderSchema.parse(body)
```

---

## 🎨 UI Components

### Структура компонентов

1. **UI Components** (`components/ui/`)
   - Базовые компоненты из shadcn/ui
   - Button, Input, Card, Dialog, Toast и т.д.
   - Переиспользуемые, типобезопасные

2. **Feature Components** (`components/`)
   - Navbar, Footer, CartButton
   - Специфичные для приложения

3. **Page Components** (`app/[locale]/...`)
   - Страницы как Server/Client Components
   - Используют UI компоненты

### Стилизация

- **Tailwind CSS** для утилитарных классов
- **CSS Variables** для темизации (dark/light mode)
- **Framer Motion** для анимаций
- **Responsive design** (mobile-first)

---

## 🛒 Управление состоянием

### Клиентское состояние

1. **Корзина** (`hooks/use-cart.ts`)
   - `localStorage` для персистентности
   - React hooks для управления

2. **Аутентификация** (`hooks/use-auth.ts`)
   - Проверка сессии через API

3. **Toast уведомления** (`hooks/use-toast.ts`)
   - Глобальные уведомления

### Серверное состояние

- **Server Components** получают данные напрямую
- **API Routes** возвращают актуальные данные
- Минимум кэширования (для видимости в Network tab)

---

## 🔧 Утилиты и хелперы

### `lib/utils.ts`
- `cn()` - объединение классов (clsx + tailwind-merge)
- `normalizePhone()` - нормализация телефонов

### `lib/api-auth.ts`
- `requireAuth()` - проверка авторизации в API
- Разделение прав Admin/Customer

### `lib/dto/`
- Zod схемы для валидации
- Типы TypeScript из схем

---

## 🚀 PWA (Progressive Web App)

### Функции

- **Service Worker** для офлайн работы
- **Manifest** для установки на устройство
- **Offline страница** (`app/offline/page.tsx`)
- **Кэширование** статических ресурсов

---

## 📦 Сборка и деплой

### Скрипты

```json
{
  "dev": "next dev",              // Разработка
  "build": "next build",           // Продакшн сборка
  "start": "next start",           // Продакшн сервер
  "db:generate": "prisma generate", // Генерация Prisma Client
  "db:push": "prisma db push",     // Применить схему
  "db:migrate": "prisma migrate",   // Миграции
  "db:seed": "tsx prisma/seed.ts", // Начальные данные
  "db:studio": "prisma studio"      // Prisma Studio
}
```

### Environment Variables

```env
DATABASE_URL="..."           # Строка подключения к БД
NEXTAUTH_SECRET="..."        # Секрет для NextAuth
NEXTAUTH_URL="..."           # URL приложения
JWT_SECRET="..."             # Секрет для JWT
PAYMENT_MODE="sandbox"       # Режим платежей
KASPI_API_KEY="..."          # API ключи
PAYBOX_API_KEY="..."
```

---

## 🔄 Потоки работы

### Создание заказа

```
1. Пользователь добавляет товары в корзину (localStorage)
2. Переход на /cart
3. Заполнение формы (имя, телефон, тип заказа)
4. POST /api/orders
   - Валидация (Zod)
   - Поиск/создание Customer
   - Создание Order + OrderItems
   - Создание Payment (PENDING)
5. Редирект на /order/[id]
6. Обработка платежа (POST /api/payments)
```

### Бронирование стола

```
1. Пользователь выбирает дату/время
2. POST /api/reservations
   - Поиск/создание Customer
   - Поиск свободного стола
   - Создание Reservation (PENDING)
3. Редирект на /reservation/[id]
4. Админ подтверждает (PATCH /api/reservations/[id])
```

### Админ-панель

```
1. Вход через /admin/login
2. NextAuth проверяет User в БД
3. Middleware проверяет роль (ADMIN/STAFF)
4. Доступ к:
   - Дашборд (статистика)
   - Заказы (управление статусами)
   - Бронирования
   - Меню (CRUD)
   - Отзывы
```

---

## 🎯 Ключевые принципы архитектуры

1. **Separation of Concerns**
   - API routes отдельно от UI
   - Бизнес-логика в `lib/`
   - Компоненты только для представления

2. **Type Safety**
   - TypeScript везде
   - Zod для валидации
   - Prisma для типов БД

3. **Centralized API**
   - Все запросы через `api-client.ts`
   - Единая обработка ошибок
   - Консистентные типы

4. **Server-First**
   - Server Components по умолчанию
   - Client Components только при необходимости
   - Меньше JavaScript на клиенте

5. **Security**
   - Валидация на сервере (Zod)
   - Проверка прав в middleware
   - Хеширование паролей (bcrypt)

---

## 📝 Дополнительные файлы

- `ALL_API_ENDPOINTS.md` - Список всех API endpoints
- `API_DOCUMENTATION.md` - Документация API
- `DATABASE_SETUP.md` - Настройка БД
- `NETWORK_REQUESTS_EXPLAINED.md` - Объяснение сетевых запросов

---

## 🔍 Отладка

### Prisma Studio
```bash
npm run db:studio
# Открывает http://localhost:5555
```

### Логирование
- API routes логируют ошибки в консоль
- Prisma Client логирует запросы в dev режиме
- Network tab показывает все запросы

---

Эта архитектура обеспечивает:
- ✅ Масштабируемость
- ✅ Поддерживаемость
- ✅ Безопасность
- ✅ Производительность
- ✅ Типобезопасность
- ✅ Многоязычность
- ✅ PWA функциональность


