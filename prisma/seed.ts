import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // 1. Создаем админ пользователя
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@coffeehouse.kz' },
    update: {},
    create: {
      email: 'admin@coffeehouse.kz',
      username: 'admin',
      passwordHash: hashedPassword,
      role: 'ADMIN',
    },
  })
  console.log('✅ Админ пользователь создан:', admin.email)

  // 2. Создаем категории
  const coffeeCategory = await prisma.category.upsert({
    where: { slug: 'coffee' },
    update: {},
    create: {
      name: 'Кофе',
      slug: 'coffee',
      description: 'Жаңа дайындалған кофе және эспрессо сусындар',
    },
  })

  const dessertsCategory = await prisma.category.upsert({
    where: { slug: 'desserts' },
    update: {},
    create: {
      name: 'Десерттер',
      slug: 'desserts',
      description: 'Тәтті десерттер және кондитерлік өнімдер',
    },
  })

  const drinksCategory = await prisma.category.upsert({
    where: { slug: 'drinks' },
    update: {},
    create: {
      name: 'Сусындар',
      slug: 'drinks',
      description: 'Салқын сусындар',
    },
  })
  console.log('✅ Категории созданы')

  // Не удаляем старые записи, чтобы сохранить заказы и отзывы
  // Вместо этого обновим существующие товары
  console.log('✅ Обновляем существующие товары меню')

  // 3. Создаем меню элементы - Coffee
  const coffeeItems = [
    {
      name: 'Эспрессо',
      description: 'Күшті және дәмді итальяндық кофе',
      price: 800,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=400',
    },
    {
      name: 'Американо',
      description: 'Эспрессо қайнаған сумен',
      price: 900,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
    },
    {
      name: 'Капучино',
      description: 'Эспрессо буланған сүтпен және көбікпен',
      price: 1200,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400',
    },
    {
      name: 'Латте',
      description: 'Жұмсақ эспрессо буланған сүтпен',
      price: 1300,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400',
    },
    {
      name: 'Мокко',
      description: 'Эспрессо шоколадпен және буланған сүтпен',
      price: 1400,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?auto=format&fit=crop&w=800&h=600&q=80',
    },
    {
      name: 'Флэт Уайт',
      description: 'Қос эспрессо микро көбікпен',
      price: 1250,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    },
    {
      name: 'Макиато',
      description: 'Эспрессо көбікпен',
      price: 1100,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
    },
    {
      name: 'Холодный Брю',
      description: 'Жұмсақ салқын дайындалған кофе',
      price: 1000,
      categoryId: coffeeCategory.id,
      image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=400',
    },
  ]

  for (const item of coffeeItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId: coffeeCategory.id },
    })
    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          image: item.image,
          price: item.price,
          description: item.description,
        },
      })
    } else {
      await prisma.menuItem.create({ data: item })
    }
  }
  console.log('✅ Кофе добавлено')

  // 4. Создаем меню элементы - Desserts
  const dessertItems = [
    {
      name: 'Чизкейк',
      description: 'Кремді Нью-Йорк стиліндегі чизкейк',
      price: 2000,
      categoryId: dessertsCategory.id,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&h=600&q=80',
    },
    {
      name: 'Шоколадты торт',
      description: 'Бай шоколадты қабатты торт',
      price: 1800,
      categoryId: dessertsCategory.id,
      image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400',
    },
    {
      name: 'Тирамису',
      description: 'Классикалық итальяндық десерт',
      price: 2200,
      categoryId: dessertsCategory.id,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    },
    {
      name: 'Круассан',
      description: 'Салмақты француздық кондитерлік өнім',
      price: 800,
      categoryId: dessertsCategory.id,
      image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400',
    },
    {
      name: 'Маффин',
      description: 'Жаңа пісірілген маффин',
      price: 600,
      categoryId: dessertsCategory.id,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&h=600&q=80',
    },
  ]

  for (const item of dessertItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId: dessertsCategory.id },
    })
    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          image: item.image,
          price: item.price,
          description: item.description,
        },
      })
    } else {
      await prisma.menuItem.create({ data: item })
    }
  }
  console.log('✅ Десерты добавлены')

  // 5. Создаем меню элементы - Drinks
  const drinkItems = [
    {
      name: 'Жасыл шай',
      description: 'Премиум жапондық жасыл шай',
      price: 700,
      categoryId: drinksCategory.id,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    },
    {
      name: 'Қара шай',
      description: 'Классикалық қара шай',
      price: 600,
      categoryId: drinksCategory.id,
      image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400',
    },
    {
      name: 'Жаңа апельсин шырыны',
      description: 'Жаңа сығылған апельсин шырыны',
      price: 1000,
      categoryId: drinksCategory.id,
      image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400',
    },
    {
      name: 'Лимон сусыны',
      description: 'Салқындататын лимон сусыны',
      price: 800,
      categoryId: drinksCategory.id,
      image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=400',
    },
    {
      name: 'Смузи',
      description: 'Аралас жеміс смузи',
      price: 1500,
      categoryId: drinksCategory.id,
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?auto=format&fit=crop&w=800&h=600&q=80',
    },
  ]

  for (const item of drinkItems) {
    const existing = await prisma.menuItem.findFirst({
      where: { name: item.name, categoryId: drinksCategory.id },
    })
    if (existing) {
      await prisma.menuItem.update({
        where: { id: existing.id },
        data: {
          image: item.image,
          price: item.price,
          description: item.description,
        },
      })
    } else {
      await prisma.menuItem.create({ data: item })
    }
  }
  console.log('✅ Напитки добавлены')

  // 6. Создаем столы
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.table.findUnique({
      where: { number: i },
    })
    if (!existing) {
      await prisma.table.create({
        data: {
          number: i,
          seats: i <= 3 ? 2 : i <= 6 ? 4 : 6,
          isActive: true,
        },
      })
    }
  }
  console.log('✅ Столы созданы (10 столов)')

  // 7. Создаем тестового клиента
  const existingCustomer = await prisma.customer.findFirst({
    where: { phone: '+77001234567' },
  })
  if (!existingCustomer) {
    await prisma.customer.create({
      data: {
        firstName: 'Test',
        lastName: 'Customer',
        phone: '+77001234567',
        email: 'test@example.com',
      },
    })
    console.log('✅ Тестовый клиент создан')
  } else {
    console.log('✅ Тестовый клиент уже существует')
  }

  console.log('\n🎉 База данных успешно заполнена!')
  console.log('\n📋 Данные для входа:')
  console.log('   Email: admin@coffeehouse.kz')
  console.log('   Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

