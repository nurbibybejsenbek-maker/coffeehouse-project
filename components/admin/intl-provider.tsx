"use client"

import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from '@/lib/intl-admin'

export function AdminIntlProvider({ children }: { children: React.ReactNode }) {
  const messages = getMessages()
  
  return (
    <NextIntlClientProvider messages={messages} locale="kk">
      {children}
    </NextIntlClientProvider>
  )
}

