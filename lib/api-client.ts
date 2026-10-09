/**
 * Centralized API Client
 * Все API вызовы должны проходить через этот модуль
 */

// ==================== Types ====================

export interface MenuItem {
  id: string
  name: string
  description: string | null
  price: number
  imageUrl: string | null
  category: {
    id: string
    name: string
    slug: string
  }
}

export interface OrderItem {
  menuItemId: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface CreateOrderData {
  firstName: string
  lastName?: string
  phone: string
  email?: string
  address?: string
  orderType: 'PICKUP' | 'DINE_IN' | 'DELIVERY'
  paymentMethod: 'CASH' | 'CARD' | 'KASPI' | 'PAYBOX' | 'ONLINE'
  items: OrderItem[]
  totalAmount: number
}

export interface Order {
  id: string
  status: string
  totalAmount: number
  orderType: string
  placedAt: string
  orderItems: Array<{
    id: string
    quantity: number
    unitPrice: number
    totalPrice: number
    menuItem: MenuItem
  }>
  customer: {
    id: string
    firstName: string
    lastName?: string
    phone: string
    email?: string
  }
  payment?: {
    id: string
    method: string
    status: string
    amount: number
    transactionId?: string
    paidAt?: string
  }
}

export interface CreateReservationData {
  firstName: string
  lastName?: string
  phone: string
  email?: string
  date: string
  time: string
  partySize: number
  note?: string
}

export interface Reservation {
  id: string
  date: string
  time: string
  partySize: number
  status: string
  note?: string
  customer: {
    id: string
    firstName: string
    lastName?: string
    phone: string
    email?: string
  }
  table?: {
    id: string
    number: number
    seats: number
  }
}

export interface Review {
  id: string
  rating: number
  comment: string | null
  createdAt: string
  customer: {
    firstName: string
    lastName?: string
  }
  menuItem?: MenuItem
}

export interface CreateReviewData {
  rating: number
  comment?: string
  customerId?: string
  menuItemId?: string
  orderId?: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  firstName: string
  lastName?: string
  phone: string
  email: string
  password: string
}

export interface AuthResponse {
  customer?: {
    id: string
    firstName: string
    lastName?: string
    email: string
    phone: string
  }
  user?: {
    id: string
    email: string
    role: string
  }
  error?: string
}

export interface PaymentData {
  orderId: string
  method: 'CASH' | 'CARD' | 'KASPI' | 'PAYBOX' | 'ONLINE'
}

export interface Payment {
  id: string
  orderId: string
  method: string
  status: string
  amount: number
  transactionId?: string
  paidAt?: string
}

export interface AIRecommendationPreferences {
  taste?: 'bitter' | 'sweet'
  milk?: 'with_milk' | 'black'
  strength?: 'light' | 'medium' | 'strong'
}

export interface AIRecommendationResponse {
  recommendations: MenuItem[]
}

// ==================== API Error Handler ====================

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  // Check content type
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    throw new ApiError(
      `Invalid response format. Expected JSON, got: ${contentType}`,
      response.status,
      { text }
    )
  }

  const data = await response.json()

  if (!response.ok) {
    throw new ApiError(
      data.message || data.error || 'An error occurred',
      response.status,
      data.details
    )
  }

  return data
}

// ==================== API Client Functions ====================

/**
 * Auth API
 */
export const authApi = {
  /**
   * Проверка текущего пользователя
   */
  async me(): Promise<AuthResponse> {
    const response = await fetch('/api/auth/me', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
    return handleResponse<AuthResponse>(response)
  },

  /**
   * Вход в систему
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<AuthResponse>(response)
  },

  /**
   * Регистрация нового пользователя
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<AuthResponse>(response)
  },

  /**
   * Выход из системы
   */
  async logout(): Promise<void> {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
    })
    if (!response.ok) {
      throw new ApiError('Failed to logout', response.status)
    }
  },
}

/**
 * Menu API
 */
export const menuApi = {
  /**
   * Получение меню с фильтрацией
   */
  async getMenu(params?: {
    category?: string
    search?: string
  }): Promise<MenuItem[]> {
    const queryParams = new URLSearchParams()
    if (params?.category) queryParams.set('category', params.category)
    if (params?.search) queryParams.set('search', params.search)

    const url = `/api/menu${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url, {
      cache: 'no-store', // Отключаем кэширование для видимости в Network tab
    })
    return handleResponse<MenuItem[]>(response)
  },

  /**
   * Получение конкретного элемента меню по ID
   */
  async getMenuItem(id: string): Promise<MenuItem> {
    const response = await fetch(`/api/menu/${id}`, {
      cache: 'no-store', // Отключаем кэширование для видимости в Network tab
    })
    return handleResponse<MenuItem>(response)
  },
}

/**
 * Orders API
 */
export const ordersApi = {
  /**
   * Создание нового заказа
   */
  async createOrder(data: CreateOrderData): Promise<Order> {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Order>(response)
  },

  /**
   * Получение списка заказов
   */
  async getOrders(customerId?: string): Promise<Order[]> {
    const queryParams = new URLSearchParams()
    if (customerId) queryParams.set('customerId', customerId)

    const url = `/api/orders${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    const response = await fetch(url)
    return handleResponse<Order[]>(response)
  },

  /**
   * Получение заказа по ID
   */
  async getOrder(id: string): Promise<Order> {
    const response = await fetch(`/api/orders/${id}`)
    return handleResponse<Order>(response)
  },

  /**
   * Обновление статуса заказа
   */
  async updateOrder(id: string, status: string): Promise<Order> {
    const response = await fetch(`/api/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return handleResponse<Order>(response)
  },

  /**
   * Обновление статуса заказа (алиас для совместимости)
   */
  async updateOrderStatus(id: string, status: string): Promise<Order> {
    return this.updateOrder(id, status)
  },
}

/**
 * Payments API
 */
export const paymentsApi = {
  /**
   * Обработка платежа
   */
  async processPayment(data: PaymentData): Promise<Payment> {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Payment>(response)
  },
}

/**
 * Reservations API
 */
export const reservationsApi = {
  /**
   * Создание бронирования
   */
  async createReservation(data: CreateReservationData): Promise<Reservation> {
    const response = await fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Reservation>(response)
  },

  /**
   * Получение списка бронирований
   */
  async getReservations(): Promise<Reservation[]> {
    const response = await fetch('/api/reservations')
    return handleResponse<Reservation[]>(response)
  },

  /**
   * Получение конкретного бронирования по ID
   */
  async getReservation(id: string): Promise<Reservation> {
    const response = await fetch(`/api/reservations/${id}`)
    return handleResponse<Reservation>(response)
  },

  /**
   * Обновление статуса бронирования
   */
  async updateReservation(id: string, status: string): Promise<Reservation> {
    const response = await fetch(`/api/reservations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    return handleResponse<Reservation>(response)
  },

  /**
   * Обновление статуса бронирования (алиас для удобства)
   */
  async updateReservationStatus(id: string, status: string): Promise<Reservation> {
    // Статусы должны быть в верхнем регистре (PENDING, CONFIRMED, CANCELLED, COMPLETED)
    return this.updateReservation(id, status)
  },
}

/**
 * Reviews API
 */
export const reviewsApi = {
  /**
   * Получение списка отзывов
   */
  async getReviews(): Promise<Review[]> {
    const response = await fetch('/api/reviews')
    return handleResponse<Review[]>(response)
  },

  /**
   * Создание отзыва
   */
  async createReview(data: CreateReviewData): Promise<Review> {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return handleResponse<Review>(response)
  },
}

/**
 * AI Recommendations API
 */
export const aiApi = {
  /**
   * Получение рекомендаций на основе предпочтений
   */
  async getRecommendations(
    preferences: AIRecommendationPreferences
  ): Promise<AIRecommendationResponse> {
    const response = await fetch('/api/ai/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(preferences),
    })
    return handleResponse<AIRecommendationResponse>(response)
  },
}

/**
 * Contact API
 */
export interface ContactInfo {
  address: {
    city: string
    country: string
    street: string
  }
  phone: string
  email: string
  workingHours: {
    weekdays: {
      days: string
      hours: string
    }
    weekend: {
      days: string
      hours: string
    }
  }
  socialMedia?: {
    instagram?: string
    facebook?: string
  }
}

export const contactApi = {
  /**
   * Получение контактной информации
   */
  async getContactInfo(locale?: string): Promise<ContactInfo> {
    const url = locale ? `/api/contact?locale=${locale}` : '/api/contact'
    const response = await fetch(url, {
      cache: 'no-store', // Отключаем кэширование для видимости в Network tab
    })
    return handleResponse<ContactInfo>(response)
  },
}

// ==================== Default Export ====================

/**
 * Главный объект API клиента
 */
const apiClient = {
  auth: authApi,
  menu: menuApi,
  orders: ordersApi,
  payments: paymentsApi,
  reservations: reservationsApi,
  reviews: reviewsApi,
  ai: aiApi,
  contact: contactApi,
}

export default apiClient

