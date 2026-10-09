import { prisma } from '../lib/prisma'

// Изображения для разных категорий
const defaultImages = {
  coffee: [
    'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
    'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    'https://images.unsplash.com/photo-1571924156216-787d7f8e4e0a?w=400',
    'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
  ],
  desserts: [
    'https://images.unsplash.com/photo-1524351199678-94160358e893?w=400',
    'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    'https://images.unsplash.com/photo-1607958996333-41aef7caefaa?w=400',
    'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
    'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400',
  ],
  drinks: [
    'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=400',
    'https://images.unsplash.com/photo-1505252585461-04c2a47d0b4c?w=400',
    'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400',
    'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=400',
  ],
}

async function main() {
  console.log('🖼️  Начинаем добавление изображений для товаров без них...')

  // Получаем все товары с категориями
  const menuItems = await prisma.menuItem.findMany({
    include: {
      category: true,
    },
  })

  let updatedCount = 0
  let skippedCount = 0

  for (const item of menuItems) {
    // Проверяем, есть ли изображение (null, undefined или пустая строка)
    const hasImage = item.image && item.image.trim() !== '' && item.image !== 'null'
    if (!hasImage) {
      const categorySlug = item.category.slug
      const images = defaultImages[categorySlug as keyof typeof defaultImages]

      if (images && images.length > 0) {
        // Выбираем случайное изображение из категории
        const randomImage = images[Math.floor(Math.random() * images.length)]

        try {
          await prisma.menuItem.update({
            where: { id: item.id },
            data: { image: randomImage },
          })
          console.log(`✅ Добавлено изображение для "${item.name}" (${categorySlug})`)
          updatedCount++
        } catch (error) {
          console.error(`❌ Ошибка при обновлении "${item.name}":`, error)
        }
      } else {
        console.log(`⚠️  Нет изображений для категории "${categorySlug}" (товар: "${item.name}")`)
        skippedCount++
      }
    } else {
      skippedCount++
    }
  }

  console.log('\n📊 Результаты:')
  console.log(`   Обновлено: ${updatedCount}`)
  console.log(`   Пропущено: ${skippedCount}`)
  console.log('\n✅ Готово!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

