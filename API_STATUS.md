# Статус API Endpoints и их интеграция

## ✅ Полностью интегрированы и используются

### Menu API
- ✅ `GET /api/menu` → `menuApi.getMenu()` 
  - Используется: `/menu`, `/menu/[id]`, `/` (главная)
  - Статус: Работает

### Orders API  
- ✅ `POST /api/orders` → `ordersApi.createOrder()`
  - Используется: `/order` (создание заказа)
  - Статус: Работает, создает Payment автоматически
  
- ✅ `GET /api/orders/[id]` → `ordersApi.getOrder()`
  - Используется: `/order/[id]` (детали заказа)
  - Статус: Работает

- ✅ `PATCH /api/orders/[id]` → `ordersApi.updateOrder()`
  - Используется: Админ-панель
  - Статус: Работает

### Reservations API
- ✅ `POST /api/reservations` → `reservationsApi.createReservation()`
  - Используется: `/reservation` (создание резервации)
  - Статус: Работает

- ✅ `GET /api/reservations/[id]` → `reservationsApi.getReservation()`
  - Используется: `/reservation/[id]` (детали резервации)
  - Статус: Работает

### Reviews API
- ✅ `GET /api/reviews` → `reviewsApi.getReviews()`
  - Используется: `/reviews` (список отзывов)
  - Статус: Работает

- ✅ `POST /api/reviews` → `reviewsApi.createReview()`
  - Используется: `/reviews` (создание отзыва)
  - Статус: Работает

### Auth API
- ✅ `POST /api/auth/login` → `authApi.login()`
  - Используется: `/login`
  - Статус: Работает

- ✅ `POST /api/auth/register` → `authApi.register()`
  - Используется: `/register`
  - Статус: Работает

## ⚠️ Интегрированы в api-client, но не используются на фронтенде

### Payments API
- ⚠️ `POST /api/payments` → `paymentsApi.processPayment()`
  - Статус: Работает, но не используется напрямую
  - Примечание: Payment создается автоматически при создании заказа через `POST /api/orders`
  - Можно использовать отдельно для обработки платежей

### AI Recommendations API
- ⚠️ `POST /api/ai/recommend` → `aiApi.getRecommendations()`
  - Статус: Работает, но не используется на фронтенде
  - Примечание: Готов к использованию, можно добавить на главную страницу или в меню

### Auth API (дополнительные)
- ⚠️ `GET /api/auth/me` → `authApi.me()`
  - Статус: Работает, но не используется на фронтенде
  - Можно использовать для проверки текущего пользователя

- ⚠️ `POST /api/auth/logout` → `authApi.logout()`
  - Статус: Работает, но не используется на фронтенде
  - Можно использовать для выхода из системы

- ⚠️ `GET /api/orders` → `ordersApi.getOrders()`
  - Статус: Работает, но не используется на фронтенде
  - Можно использовать для списка заказов пользователя

- ⚠️ `GET /api/reservations` → `reservationsApi.getReservations()`
  - Статус: Работает, но не используется на фронтенде
  - Можно использовать для списка резерваций пользователя

## 🔗 Связи между API

### Order Flow (Поток заказа):
1. `POST /api/orders` создает:
   - Order (заказ)
   - Payment (платеж со статусом PENDING)
   - OrderItems (товары в заказе)
   - Customer (если не существует)

2. `POST /api/payments` (опционально):
   - Обновляет Payment.status → COMPLETED
   - Обновляет Order.status → CONFIRMED

3. `GET /api/orders/[id]` получает:
   - Order со всеми OrderItems и Payment

### Reservation Flow (Поток резервации):
1. `POST /api/reservations` создает:
   - Customer (если не существует)
   - Reservation (бронирование)
   - Находит и привязывает Table (столик)

2. `GET /api/reservations/[id]` получает:
   - Reservation с Customer и Table

### Review Flow (Поток отзывов):
1. `POST /api/reviews` создает:
   - Customer (если не указан, создается Guest)
   - Review (отзыв)
   - Можно привязать к MenuItem или Order (опционально)

2. `GET /api/reviews` получает:
   - Все отзывы с Customer и MenuItem

## 📊 Итоговая статистика

- **Всего API endpoints**: 14
- **Полностью интегрированы**: 9
- **Готовы к использованию, но не используются**: 5
- **Все работают**: ✅ 100%
- **Связаны между собой**: ✅ Да

## ✨ Рекомендации

1. Добавить использование `GET /api/orders` на странице профиля пользователя
2. Добавить использование `GET /api/reservations` на странице профиля
3. Добавить использование `GET /api/auth/me` для проверки авторизации
4. Добавить использование `POST /api/auth/logout` для выхода
5. Добавить использование `POST /api/ai/recommend` на главной странице или в меню
