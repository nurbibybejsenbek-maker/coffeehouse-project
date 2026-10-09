# PostgreSQL Дерекқорын Құру

## 1. PostgreSQL-ге Қосылу

PostgreSQL орнатылған жерін табыңыз (әдетте):
- `C:\Program Files\PostgreSQL\18\bin\` (немесе басқа версия)

## 2. Дерекқорды Құру

### Әдіс 1: pgAdmin арқылы (Graphical Interface)
1. pgAdmin-ды ашыңыз
2. PostgreSQL серверіне қосылыңыз
3. Databases-ке оң жақ батырмамен басып, "Create" > "Database" таңдаңыз
4. Database name: `coffeehouse`
5. "Save" батырмасын басыңыз

### Әдіс 2: Command Line арқылы
1. PostgreSQL bin қалтасына өтіңіз:
   ```powershell
   cd "C:\Program Files\PostgreSQL\18\bin"
   ```

2. Дерекқорды құрыңыз:
   ```powershell
   .\psql.exe -U postgres -c "CREATE DATABASE coffeehouse;"
   ```
   
   Парольді енгізіңіз (әдетте орнату кезінде белгілеген пароль)

### Әдіс 3: .env Файлын Жаңарту

Егер сіздің PostgreSQL пароліңіз `postgres` емес болса, `.env` файлын жаңартыңыз:

```env
DATABASE_URL="postgresql://postgres:СІЗДІҢ_ПАРОЛІҢІЗ@localhost:5432/coffeehouse?schema=public"
```

Мысал:
```env
DATABASE_URL="postgresql://postgres:mypassword123@localhost:5432/coffeehouse?schema=public"
```

## 3. Дерекқор Схемасын Орнату

Дерекқор құрылғаннан кейін:

```bash
pnpm db:push
```

## 4. Дерекқорды Толтыру

```bash
pnpm db:seed
```

## Мәселелерді Шешу

### Аутентификация қатесі
- `.env` файлындағы парольді тексеріңіз
- PostgreSQL серверінің іске қосылғанын тексеріңіз

### Дерекқор қатесі
- Дерекқорды құруды ұмытпаңыз
- Дерекқор атауының дұрыс екенін тексеріңіз

