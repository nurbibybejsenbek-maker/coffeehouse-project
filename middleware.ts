import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { locales } from './i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale: 'kk',
  localePrefix: 'always',
});

const authMiddleware = withAuth(
  function onSuccess(req) {
    // Don't apply internationalization to admin routes
    return;
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        // Skip auth check for login page
        if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
          return true;
        }
        if (pathname.startsWith('/admin')) {
          return !!token && (token.role === 'ADMIN' || token.role === 'STAFF');
        }
        return true;
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Skip middleware for API routes
  if (pathname.startsWith('/api')) {
    return;
  }
  
  // Skip internationalization for admin routes (they don't need locale prefix)
  if (pathname.startsWith('/admin')) {
    // For login page, just pass through without auth check
    if (pathname === '/admin/login' || pathname.startsWith('/admin/login')) {
      return
    }
    // For other admin routes, apply auth middleware without internationalization
    return (authMiddleware as any)(req)
  }
  
  // Apply internationalization for all other routes
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/admin/:path*'],
};

