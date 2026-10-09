import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { jwtVerify } from 'jose'
import { prisma } from './prisma'

const secret = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production'
)

export interface AuthResult {
  user: {
    id: string
    email: string
    role?: string
  } | null
  isAuthenticated: boolean
  isAdmin: boolean
}

/**
 * Проверяет авторизацию для API роутов
 * Поддерживает два типа авторизации:
 * 1. NextAuth сессия (для админов) - через JWT токен NextAuth
 * 2. JWT токен через cookie (для клиентов) - через auth-token cookie
 */
export async function checkAuth(request: NextRequest): Promise<AuthResult> {
  // Проверяем NextAuth токен (для админов)
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (token) {
      // Проверяем, что это админ токен (имеет роль)
      if (token.role) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub! },
          select: { id: true, email: true, role: true },
        })
        
        if (user) {
          return {
            user: {
              id: user.id,
              email: user.email,
              role: user.role,
            },
            isAuthenticated: true,
            isAdmin: user.role === 'ADMIN' || user.role === 'STAFF',
          }
        }
      }
    }
  } catch (error) {
    // NextAuth токен не найден или невалидный, продолжаем
  }

  // Проверяем JWT токен из cookie (для клиентов)
  const token = request.cookies.get('auth-token')?.value
  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret)
      const customer = await prisma.customer.findUnique({
        where: { id: payload.id as string },
        select: { id: true, email: true },
      })

      if (customer) {
        return {
          user: {
            id: customer.id,
            email: customer.email || '',
          },
          isAuthenticated: true,
          isAdmin: false,
        }
      }
    } catch (error) {
      // Токен невалидный, продолжаем
    }
  }

  return {
    user: null,
    isAuthenticated: false,
    isAdmin: false,
  }
}

/**
 * Проверяет авторизацию и возвращает ошибку, если не авторизован
 */
export async function requireAuth(
  request: NextRequest,
  requireAdmin: boolean = false
): Promise<{ auth: AuthResult; error?: NextResponse }> {
  const auth = await checkAuth(request)

  if (!auth.isAuthenticated) {
    return {
      auth,
      error: NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  if (requireAdmin && !auth.isAdmin) {
    return {
      auth,
      error: NextResponse.json(
        { error: 'Forbidden', message: 'Admin access required' },
        { status: 403 }
      ),
    }
  }

  return { auth }
}

