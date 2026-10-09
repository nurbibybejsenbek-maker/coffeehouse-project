import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { SessionProvider } from '@/components/session-provider'
import { AdminContainer } from '@/components/admin/admin-container'

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user) {
    redirect('/admin/login')
  }

  const userRole = (session.user as any).role
  if (userRole !== 'ADMIN' && userRole !== 'STAFF') {
    redirect('/admin/login')
  }

  return (
    <SessionProvider>
      <AdminContainer>{children}</AdminContainer>
    </SessionProvider>
  )
}

