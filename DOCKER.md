# Docker Setup Guide

Это руководство поможет вам запустить CoffeeHouse приложение с помощью Docker.

## Требования

- Docker Desktop (или Docker Engine + Docker Compose)
- Минимум 2GB свободной RAM

## Быстрый старт

1. **Клонируйте репозиторий** (если еще не сделали):
```bash
git clone <repository-url>
cd Coffee.WEB
```

2. **Создайте файл `.env`** (опционально, для кастомизации):
```bash
cp .env.example .env
```

Отредактируйте `.env` если нужно изменить настройки по умолчанию.

3. **Запустите приложение**:
```bash
docker-compose up -d
```

4. **Дождитесь запуска** (обычно 1-2 минуты) и откройте:
   - Приложение: http://localhost:3000
   - Админка: http://localhost:3000/admin/login
   - База данных: localhost:5432

## Команды Docker

### Запуск
```bash
# Запустить в фоновом режиме
docker-compose up -d

# Запустить с выводом логов
docker-compose up
```

### Остановка
```bash
# Остановить контейнеры
docker-compose down

# Остановить и удалить volumes (удалит данные БД!)
docker-compose down -v
```

### Просмотр логов
```bash
# Все сервисы
docker-compose logs -f

# Только приложение
docker-compose logs -f app

# Только база данных
docker-compose logs -f postgres
```

### Пересборка
```bash
# Пересобрать образы после изменений в коде
docker-compose build

# Пересобрать и запустить
docker-compose up -d --build
```

### Выполнение команд в контейнере
```bash
# Зайти в контейнер приложения
docker-compose exec app sh

# Выполнить Prisma команды
docker-compose exec app npx prisma studio
docker-compose exec app npx prisma migrate dev
docker-compose exec app npm run db:seed
```

## Структура

- **app** - Next.js приложение (порт 3000)
- **postgres** - PostgreSQL база данных (порт 5432)

## Переменные окружения

Все переменные окружения настраиваются в `docker-compose.yml` или через файл `.env`.

### По умолчанию:
- `DATABASE_URL`: `postgresql://postgres:postgres@postgres:5432/coffeehouse?schema=public`
- `NEXTAUTH_SECRET`: `coffeehouse-secret-key-change-in-production`
- `NEXTAUTH_URL`: `http://localhost:3000`

**⚠️ ВАЖНО**: Для продакшена обязательно измените `NEXTAUTH_SECRET` и пароль базы данных!

## Первый запуск

При первом запуске Docker автоматически:
1. Создаст PostgreSQL базу данных
2. Запустит Prisma миграции
3. Сгенерирует Prisma Client
4. Запустит Next.js приложение

Если нужно заполнить базу тестовыми данными:
```bash
docker-compose exec app npm run db:seed
```

## Учетные данные по умолчанию

После seed базы данных:
- **Email**: `admin@coffeehouse.kz`
- **Password**: `admin123`

## Troubleshooting

### Проблема: Контейнер не запускается
```bash
# Проверьте логи
docker-compose logs app

# Проверьте статус контейнеров
docker-compose ps
```

### Проблема: База данных не подключается
```bash
# Проверьте, что PostgreSQL контейнер запущен
docker-compose ps postgres

# Проверьте логи базы данных
docker-compose logs postgres
```

### Проблема: Нужно сбросить базу данных
```bash
# Остановить и удалить volumes
docker-compose down -v

# Запустить заново
docker-compose up -d
```

### Проблема: Изменения в коде не применяются
```bash
# Пересобрать образ
docker-compose up -d --build
```

## Production Deployment

Для продакшена рекомендуется:

1. **Изменить пароли** в `docker-compose.yml`
2. **Использовать секреты** вместо переменных в файле
3. **Настроить SSL/TLS** для базы данных
4. **Использовать внешнюю базу данных** (например, AWS RDS, Supabase)
5. **Настроить reverse proxy** (nginx, traefik)
6. **Использовать Docker secrets** для чувствительных данных

## Дополнительные ресурсы

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Deployment](https://nextjs.org/docs/deployment#docker-image)

