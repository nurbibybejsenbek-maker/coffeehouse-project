import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/contact
 * Возвращает контактную информацию кофейни
 * Публичный endpoint
 */
export async function GET(request: NextRequest) {
  // Получаем локаль из заголовков или query параметров
  const locale = request.headers.get('x-locale') || 
                 new URL(request.url).searchParams.get('locale') || 
                 'kk'

  // Переводы дней недели
  const dayTranslations: Record<string, Record<string, string>> = {
    kk: {
      monday: 'Дүйсенбі',
      tuesday: 'Сейсенбі',
      wednesday: 'Сәрсенбі',
      thursday: 'Бейсенбі',
      friday: 'Жұма',
      saturday: 'Сенбі',
      sunday: 'Жексенбі',
    },
    ru: {
      monday: 'Понедельник',
      tuesday: 'Вторник',
      wednesday: 'Среда',
      thursday: 'Четверг',
      friday: 'Пятница',
      saturday: 'Суббота',
      sunday: 'Воскресенье',
    },
    en: {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    },
  }

  const days = dayTranslations[locale] || dayTranslations.kk

  // Переводы адреса
  const addressTranslations: Record<string, { city: string; country: string; street: string }> = {
    kk: {
      city: 'Алматы',
      country: 'Қазақстан',
      street: 'Абай даңғылы 150',
    },
    ru: {
      city: 'Алматы',
      country: 'Казахстан',
      street: 'Проспект Абая 150',
    },
    en: {
      city: 'Almaty',
      country: 'Kazakhstan',
      street: 'Abay Avenue 150',
    },
  }

  const address = addressTranslations[locale] || addressTranslations.kk

  const contactInfo = {
    address: {
      city: address.city,
      country: address.country,
      street: address.street,
    },
    phone: '+7 (777) 123-4567',
    email: 'info@coffeehouse.kz',
    workingHours: {
      weekdays: {
        days: locale === 'kk' 
          ? `${days.monday} - ${days.friday}`
          : locale === 'ru'
          ? `${days.monday} - ${days.friday}`
          : 'Monday - Friday',
        hours: '9:00 - 21:00',
      },
      weekend: {
        days: locale === 'kk'
          ? `${days.saturday} - ${days.sunday}`
          : locale === 'ru'
          ? `${days.saturday} - ${days.sunday}`
          : 'Saturday - Sunday',
        hours: '10:00 - 22:00',
      },
    },
    socialMedia: {
      instagram: '@coffeehouse_kz',
      facebook: 'CoffeeHouse Almaty',
    },
  }

  return NextResponse.json(contactInfo, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, must-revalidate',
    },
  })
}





