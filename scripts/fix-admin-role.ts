import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Восстанавливаем роль администратора...')

  const adminEmail = 'admin@coffeehouse.kz'

  try {
    const user = await prisma.user.findUnique({
      where: { email: adminEmail },
    })

    if (!user) {
      console.error('❌ Пользователь с email', adminEmail, 'не найден!')
      process.exit(1)
    }

    console.log('📋 Текущий пользователь:', {
      email: user.email,
      username: user.username,
      role: user.role,
    })

    if (user.role === 'ADMIN') {
      console.log('✅ Пользователь уже имеет роль ADMIN')
    } else {
      const updated = await prisma.user.update({
        where: { email: adminEmail },
        data: { role: 'ADMIN' },
      })

      console.log('✅ Роль успешно обновлена!')
      console.log('📋 Обновленный пользователь:', {
        email: updated.email,
        username: updated.username,
        role: updated.role,
      })
    }
  } catch (error) {
    console.error('❌ Ошибка при обновлении роли:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()

