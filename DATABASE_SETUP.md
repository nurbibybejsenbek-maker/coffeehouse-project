# PostgreSQL Дерекқорын Орнату Нұсқаулары

## 1. PostgreSQL Орнату

### Windows үшін:
1. PostgreSQL-ді жүктеу: https://www.postgresql.org/download/windows/
2. Орнату кезінде парольді есте сақтаңыз (әдетте `postgres`)
3. PostgreSQL сервисін іске қосыңыз

### Альтернатива - Docker:
```bash
docker run --name coffeehouse-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=coffeehouse -p 5432:5432 -d postgres
```

## 2. Дерекқорды Құру

PostgreSQL-ге қосылып, дерекқорды құрыңыз:

```sql
CREATE DATABASE coffeehouse;
```

Немесе psql арқылы:
```bash
psql -U postgres
CREATE DATABASE coffeehouse;
\q
```

## 3. .env Файлын Құру

Жоба түбінде `.env` файлын құрыңыз:

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/coffeehouse?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="coffeehouse-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="coffeehouse-jwt-secret-change-in-production"

# Payment Configuration
PAYMENT_MODE="sandbox"
KASPI_API_KEY=""
PAYBOX_API_KEY=""

# Email (Optional)
SENDGRID_API_KEY=""
SENDGRID_FROM_EMAIL="noreply@coffeehouse.kz"
```

**Ескерту:** `DATABASE_URL`-дегі `postgres:postgres` - бұл `username:password`. Өз PostgreSQL пайдаланушы аты мен пароліңізбен ауыстырыңыз.

## 4. Prisma Client Құру

```bash
pnpm db:generate
# немесе
npm run db:generate
```

## 5. Дерекқор Схемасын Орнату

### Әдіс 1: db:push (Development)
```bash
pnpm db:push
# немесе
npm run db:push
```

### Әдіс 2: Миграциялар (Production)
```bash
pnpm db:migrate
# немесе
npm run db:migrate
```

## 6. Дерекқорды Толтыру (Seed)

```bash
pnpm db:seed
# немесе
npm run db:seed
```

Бұл команда:
- Admin пайдаланушысын құрады (email: `admin@coffeehouse.kz`, password: `admin123`)
- Категорияларды құрады (Coffee, Desserts, Drinks)
- Меню элементтерін құрады
- Столдарды құрады (10 стол)
- Мысал тұтынушыны құрады

## 7. Дерекқорды Тексеру

Prisma Studio арқылы дерекқорды көру:
```bash
pnpm db:studio
# немесе
npm run db:studio
```

Бұл браузерде `http://localhost:5555` ашылады.

## Қосымша Ақпарат

### DATABASE_URL Форматы:
```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
```

Мысалдар:
- Локальді: `postgresql://postgres:postgres@localhost:5432/coffeehouse?schema=public`
- Supabase: `postgresql://user:password@db.xxxxx.supabase.co:5432/postgres?schema=public`
- Railway: `postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway?schema=public`

### Мәселелерді Шешу

1. **Байланыс қатесі:** PostgreSQL сервисі іске қосылғанын тексеріңіз
2. **Пароль қатесі:** `.env` файлындағы парольді тексеріңіз
3. **Дерекқор жоқ:** Дерекқорды құруды ұмытпаңыз

