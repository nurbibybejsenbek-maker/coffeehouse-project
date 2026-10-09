/**
 * Скрипт для нормализации телефонов в существующих записях БД
 * Запуск: npx tsx scripts/normalize-phones.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function normalizePhone(phone: string): string {
  if (!phone) return phone
  return phone.replace(/[\s\-\(\)\.]/g, '').trim()
}

async function main() {
  console.log('🌱 Начинаем нормализацию телефонов...')
  
  try {
    // Получаем всех клиентов
    const customers = await prisma.customer.findMany({
      select: { id: true, phone: true },
    })

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const customer of customers) {
      const normalized = normalizePhone(customer.phone)
      
      // Если телефон уже нормализован, пропускаем
      if (normalized === customer.phone) {
        skipped++
        continue
      }

      try {
        // Проверяем, нет ли дубликатов с нормализованным номером
        const existing = await prisma.customer.findFirst({
          where: {
            phone: normalized,
            NOT: { id: customer.id },
          },
        })

        if (existing) {
          console.log(`⚠️  Пропуск: ${customer.phone} → ${normalized} (дубликат с ID ${existing.id})`)
          skipped++
          continue
        }

        // Обновляем телефон
        await prisma.customer.update({
          where: { id: customer.id },
          data: { phone: normalized },
        })

        console.log(`✅ Обновлено: ${customer.phone} → ${normalized}`)
        updated++
      } catch (error: any) {
        console.error(`❌ Ошибка при обновлении ${customer.phone}:`, error.message)
        errors++
      }
    }

    console.log('\n📊 Результаты:')
    console.log(`   Обновлено: ${updated}`)
    console.log(`   Пропущено: ${skipped}`)
    console.log(`   Ошибок: ${errors}`)
    console.log('\n✅ Нормализация завершена!')
  } catch (error) {
    console.error('❌ Критическая ошибка:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()





