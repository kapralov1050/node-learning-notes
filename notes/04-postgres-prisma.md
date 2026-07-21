# Этап 4 — PostgreSQL + Prisma

> Статус: ⏳ В процессе | Pet-проект: `04-api-with-db`

---

## 1. Зачем база данных

В предыдущих этапах данные хранились в массиве в памяти. Проблемы:
- При перезапуске сервера — все данные теряются
- Нельзя масштабировать на несколько процессов/серверов
- Нет поиска, сортировки, фильтрации на уровне хранилища

База данных решает всё это. Данные живут отдельно от сервера.

---

## 2. Реляционные БД и SQL — основы

**Реляционная БД** хранит данные в таблицах. Каждая таблица — как TypeScript-интерфейс: у неё есть колонки с типами. Каждая строка — один объект.

```
Таблица posts:
┌────┬──────────────┬───────────────────┬─────────────────────┐
│ id │ title        │ body              │ createdAt           │
├────┼──────────────┼───────────────────┼─────────────────────┤
│  1 │ Первый пост  │ Текст поста...    │ 2026-05-14 12:00:00 │
│  2 │ Второй пост  │ Другой текст...   │ 2026-05-15 09:30:00 │
└────┴──────────────┴───────────────────┴─────────────────────┘
```

**SQL** — язык запросов к БД. Базовые операции (CRUD):

```sql
-- Получить все посты
SELECT * FROM posts;

-- Получить один по id
SELECT * FROM posts WHERE id = 1;

-- Создать
INSERT INTO posts (title, body) VALUES ('Заголовок', 'Текст');

-- Обновить
UPDATE posts SET title = 'Новый заголовок' WHERE id = 1;

-- Удалить
DELETE FROM posts WHERE id = 1;

-- Фильтрация, сортировка, пагинация
SELECT * FROM posts
  WHERE title LIKE '%Node%'
  ORDER BY createdAt DESC
  LIMIT 10 OFFSET 20;
```

В реальных проектах SQL пишется редко — за нас это делает ORM.

---

## 3. PostgreSQL

PostgreSQL — мощная реляционная БД с открытым исходным кодом. Стандарт в Node.js-проектах.

**Типы данных PostgreSQL:**

| Тип | Описание | Пример |
|-----|---------|--------|
| `SERIAL` / `INT` | Целое число, автоинкремент | id |
| `VARCHAR(n)` | Строка до n символов | title |
| `TEXT` | Строка без ограничений | body |
| `BOOLEAN` | true/false | isPublished |
| `TIMESTAMP` | Дата и время | createdAt |
| `DECIMAL` | Дробное число | price |

---

## 4. ORM и зачем он нужен

**ORM (Object-Relational Mapping)** — прослойка между кодом и БД. Вместо SQL пишем TypeScript.

```ts
// ❌ Без ORM — пишем SQL вручную
const result = await db.query(
  'SELECT * FROM posts WHERE id = $1',
  [id]
);
const post = result.rows[0];

// ✅ С Prisma ORM
const post = await prisma.post.findUnique({ where: { id } });
```

Преимущества ORM:
- Типобезопасность — TypeScript знает структуру данных
- Защита от SQL-инъекций автоматически
- Миграции — версионирование схемы БД
- Читаемый код вместо SQL-строк

---

## 5. Prisma — основные концепции

Prisma состоит из трёх частей:

**Prisma Schema** (`prisma/schema.prisma`) — описание БД в декларативном синтаксисе:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Post {
  id        Int      @id @default(autoincrement())
  title     String
  body      String
  imageUrl  String?  // ? означает nullable
  createdAt DateTime @default(now())
}
```

**Prisma Migrate** — генерирует SQL-миграции из схемы и применяет их к БД:

```bash
npx prisma migrate dev --name init    # создать и применить миграцию
npx prisma migrate deploy             # применить в продакшене
npx prisma db push                    # быстро синхронизировать без миграции (для разработки)
```

**Prisma Client** — типобезопасный клиент для запросов:

```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
```

---

## 6. Переменные окружения — .env

Строка подключения к БД содержит пароль — её нельзя хранить в коде. Используем `.env`:

```bash
# .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
```

```ts
// Prisma читает .env автоматически
datasource db {
  url = env("DATABASE_URL")
}
```

**Формат строки подключения:**
```
postgresql://USER:PASSWORD@HOST:PORT/DATABASE
postgresql://postgres:mypassword@localhost:5432/blog_db
```

`.env` всегда добавляется в `.gitignore` — пароли не должны попадать в репозиторий.

---

## 7. CRUD через Prisma Client

```ts
const prisma = new PrismaClient();

// Найти все
const posts = await prisma.post.findMany();

// С фильтрацией, сортировкой, пагинацией
const posts = await prisma.post.findMany({
  where: { title: { contains: 'Node' } },
  orderBy: { createdAt: 'desc' },
  take: 10,   // LIMIT
  skip: 20,   // OFFSET
});

// Найти один по уникальному полю
const post = await prisma.post.findUnique({
  where: { id: 1 },
});

// Найти первый подходящий
const post = await prisma.post.findFirst({
  where: { title: 'Привет' },
});

// Создать
const post = await prisma.post.create({
  data: { title: 'Заголовок', body: 'Текст' },
});

// Обновить
const post = await prisma.post.update({
  where: { id: 1 },
  data: { title: 'Новый заголовок' },
});

// Удалить
await prisma.post.delete({
  where: { id: 1 },
});

// Количество записей
const count = await prisma.post.count();
```

---

## 8. Обработка ошибок Prisma

Если запись не найдена при `update` или `delete` — Prisma бросает `PrismaClientKnownRequestError` с кодом `P2025`:

```ts
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

try {
  const post = await prisma.post.update({
    where: { id: 999 },
    data: { title: 'Test' },
  });
} catch (err) {
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2025') {
    // запись не найдена
    return next(new AppError(404, 'Post not found'));
  }
  next(err);
}
```

Альтернатива — использовать `findUnique` перед `update` и проверять вручную.

---

## 9. Единственный экземпляр PrismaClient

`PrismaClient` открывает пул соединений с БД. Создавать его в каждом файле — ошибка:

```ts
// ❌ — каждый импорт создаёт новый пул соединений
const prisma = new PrismaClient(); // в контроллере 1
const prisma = new PrismaClient(); // в контроллере 2
```

Правильно — создать один экземпляр и экспортировать:

```ts
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();
```

```ts
// в любом файле
import { prisma } from '../lib/prisma';
```

---

## 10. Как изменится архитектура проекта

В Этапе 3 Model хранила данные в массиве. Теперь Model обращается к Prisma:

```ts
// Было — in-memory
export const PostModel = {
  findAll: () => posts,
  create: (data) => { posts.push(...); },
};

// Стало — через Prisma
export const PostModel = {
  findAll: () => prisma.post.findMany(),
  create: (data) => prisma.post.create({ data }),
};
```

Controller и Router не меняются — они не знают как хранятся данные. Это и есть смысл разделения на слои.

---

## Контрольные вопросы

1. Чем in-memory хранилище отличается от БД? Какие у него ограничения?
2. Что такое ORM и какие преимущества он даёт перед чистым SQL?
3. Из каких трёх частей состоит Prisma?
4. Почему строку подключения к БД нельзя хранить в коде?
5. Чем `findUnique` отличается от `findFirst`?
6. Почему нужно создавать один экземпляр `PrismaClient` на всё приложение?
7. Что произойдёт если вызвать `prisma.post.update` для несуществующей записи?

---

## 11. Миграции на практике: что внутри папки `migrations/`

Каждая миграция — папка с именем-таймстампом и SQL-файлом внутри:

```
prisma/migrations/
├── migration_lock.toml          # какая БД использовалась
├── 20260527174230_init/         # первая миграция
│   └── migration.sql
└── 20260721182024_add_author/   # вторая (после изменения схемы)
    └── migration.sql
```

**Имя папки = `YYYYMMDDhhmmss_<name>`**. По нему Prisma понимает порядок.

Когда добавляешь новое поле в `schema.prisma`, **не редактируй старые миграции** — это сломает историю. Создавай новую:

```bash
npx prisma migrate dev --name add_author
```

Prisma сравнит схему с **текущей БД**, сгенерит только разницу (один `ALTER TABLE ADD COLUMN`) и положит в новую папку.

### `migrate dev` vs `migrate deploy` vs `db push`

| Команда | Когда | Что делает |
|---|---|---|
| `migrate dev` | Локальная разработка | Создаёт миграцию **и применяет** её |
| `migrate deploy` | CI/CD, Docker | Только **применяет** уже существующие |
| `db push` | Прототипы, хакатоны | Толкает схему напрямую, **без миграций** |

В Docker используется `deploy` — там никто не пишет миграции, только применяет готовые.

---

## 12. Prisma + Docker: полная цепочка

### `docker-compose.yml` поднимает два сервиса

```yaml
services:
  db:
    image: postgres:16-alpine
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]   # ⬅ ждём готовности БД
  app:
    build: .
    depends_on:
      db:
        condition: service_healthy                     # ⬅ не стартовать, пока БД не ready
    env_file: .env
```

### `Dockerfile` (multi-stage)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate       # ⬅ генерирует клиент ДО сборки
COPY . .
RUN npm run build             # tsc → dist/

FROM node:20-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --omit=dev
COPY --from=builder /usr/src/app/dist ./dist
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
```

`CMD` делает две вещи по порядку: **применяет миграции**, потом **запускает приложение**. Если миграция упадёт — приложение не стартанёт, что хорошо (fail-fast).

### `.env` внутри Docker-сети

```
DATABASE_URL="postgresql://postgres:postgres@db:5432/api?schema=public"
```

`db` — это **имя сервиса** в `docker-compose.yml`. Docker автоматически создаёт DNS-алиас внутри сети, и контейнеры обращаются друг к другу по этим именам.

### Хост vs контейнер

С **хоста** (с твоего Mac) `db:5432` не резолвится — нужно `localhost:5432`. Поэтому при запуске миграций руками переопределяй:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/api?schema=public" \
  npx prisma migrate dev --name имя_миграции
```

### Иерархия файлов

```
docker-compose.yml          "что запускать"
   └── Dockerfile           "как собирать"
         └── package.json    "что внутри проекта"
               └── prisma/schema.prisma   "какая структура БД"
```

---

## 13. Gotcha: hardcoded-порт vs `process.env.PORT`

Типичная ошибка в `app.ts`:

```ts
// ❌ Порт захардкожен — .env и Docker игнорируются
const port = 3002;

// ✅ Читаем из окружения, с дефолтом
const port = Number(process.env.PORT) || 3000;
```

Без этого правки `.env` и маппингов портов в `docker-compose.yml` не работают.

---

## 14. Gotcha: `prisma.config.ts` перебивает `.env`

Если в проекте есть `prisma.config.ts` с `import "dotenv/config"` — он загружает `.env` **до** того, как Prisma читает переменные окружения. Это значит:

- `DATABASE_URL=... npx prisma ...` из терминала **перебьёт** значение из `.env`
- Удобно для override с хоста (когда `db` не резолвится)

---

## Контрольные вопросы (дополнение)

8. Чем `migrate dev` отличается от `migrate deploy`?
9. Почему `Dockerfile` использует `prisma generate` ДО `npm run build`?
10. Почему в Docker-сети имя БД `db`, а с хоста — `localhost`?
11. Зачем в `CMD` стоит `prisma migrate deploy && node dist/app.js` (а не просто `node`)?
12. Что будет, если в `app.ts` оставить hardcoded-порт и поменять `docker-compose.yml`?
