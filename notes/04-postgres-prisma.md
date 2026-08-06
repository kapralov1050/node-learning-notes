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

---

## 15. Связи в реляционных БД — фундамент SQL

Реляционная БД отличается от документной тем, что **связи между сущностями — это не вложенность, а отдельные таблицы с внешними ключами**. Благодаря этому данные нормализованы и не дублируются.

### Три типа связей

| Тип | Суть | Пример | SQL-механизм |
|---|---|---|---|
| **1:1** | У одной записи ровно одна связанная | `User ↔ UserProfile` | `UNIQUE` на внешнем ключе |
| **1:N** (one-to-many) | У одной записи много связанных | `User → Post`, `Author → Book` | `FOREIGN KEY` на стороне «многих» |
| **M:N** (many-to-many) | У многих записей много связанных с каждой | `Post ↔ Tag`, `Student ↔ Course` | Отдельная **join-таблица** |

### Зачем нужна нормализация

**Плохо** (как часто делают новички — «всё в одной таблице»):

```
Post: { id, title, body, authorName, authorEmail, authorBio }
```

Проблемы: если автор поменяет имя — нужно обновить все его посты. Если удалить один пост — потеряем email автора.

**Хорошо** (две таблицы + связь):

```
User:  { id, name, email, bio }
Post:  { id, title, body, authorId → User.id }
```

Автор хранится в одном месте. Удалили пост — автор на месте.

### Что такое «внешний ключ» (FOREIGN KEY)

Это колонка в одной таблице, которая **ссылается на `id` (или другое уникальное поле) другой таблицы**. СУБД следит, чтобы ссылка не указывала «в пустоту»:

```sql
ALTER TABLE "Post"
  ADD CONSTRAINT fk_post_user
  FOREIGN KEY ("authorId") REFERENCES "User"("id");
```

Попытка создать пост с несуществующим `authorId` — ошибка. Попытка удалить пользователя, на которого ссылаются посты — тоже ошибка (если не задан `ON DELETE`).

---

## 16. Связь 1:N в Prisma — `User → Post`

### Что в схеме

```prisma
model User {
  id        Int     @id @default(autoincrement())
  name      String
  email     String  @unique
  posts     Post[]              // ⬅ обратная сторона связи (на стороне "1")
}

model Post {
  id        Int     @id @default(autoincrement())
  title     String
  body      String
  authorId  Int                // ⬅ внешний ключ (на стороне "N")
  author    User  @relation(fields: [authorId], references: [id], onDelete: Cascade)
  //                                ^^^^^^^^   ^^^^^^^^^^^^^^^^^^   ^^^^^^^^^^^^^^^^^^^
  //                                какое поле связывает | на какое поле ссылается | что делать при удалении
}

@@index([authorId])             // ⬅ Prisma сама добавляет индекс на FK
```

### Разбор `@relation`

- `fields: [authorId]` — поле в **этой** модели (Post), которое является FK
- `references: [id]` — поле в **той** модели (User), на которое ссылаемся
- Две модели **должны** знать друг о друге — поэтому в `User` тоже есть `posts Post[]`

### Поведение при удалении (`onDelete`)

| Значение | Что произойдёт при удалении User, у которого есть посты |
|---|---|
| `Cascade` | Все его посты удалятся автоматически |
| `SetNull` | У постов `authorId` станет `NULL` (нужно `authorId Int?`) |
| `Restrict` | Удаление упадёт с ошибкой, пока есть посты |
| `NoAction` | То же, что `Restrict` в Postgres |

Для **учебного проекта** обычно хватает `Cascade` — чтобы упростить очистку тестовых данных.

### Миграция

```bash
npx prisma migrate dev --name add_user_relation
```

Prisma создаст:
```sql
CREATE TABLE "User" (...);
ALTER TABLE "Post" ADD COLUMN "authorId" INTEGER;
ALTER TABLE "Post" ADD CONSTRAINT "Post_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE;
```

⚠️ Уже существующие посты получат `authorId = NULL` (если поле nullable) или миграция **упадёт**, если поле обязательное и нет значения по умолчанию.

### CRUD со связью

```ts
// Создать пользователя
const user = await prisma.user.create({
  data: { name: 'Alice', email: 'alice@test.com' }
});

// Создать пост с привязкой к автору — вложенный create
const post = await prisma.post.create({
  data: {
    title: 'Hello',
    body: 'Text',
    author: { connect: { id: user.id } }     // ⬅ связь по id
  }
});

// Или через connectOrCreate (если пользователя может не быть)
const post2 = await prisma.post.create({
  data: {
    title: 'Hi',
    body: 'Text',
    author: { connectOrCreate: {
      where: { email: 'bob@test.com' },
      create: { name: 'Bob', email: 'bob@test.com' }
    }}
  }
});
```

### `posts Post[]` на стороне «1» — зачем?

Это «обратная сторона связи» в Prisma. Без неё TypeScript бы не знал, что у `User` есть поле `posts`. Через неё можно делать:

```ts
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: { posts: true }      // ⬅ подтянет все посты пользователя
});
```

---

## 17. Связь M:N в Prisma — `Post ↔ Tag`

### Неявная (implicit) join-таблица

Prisma 6 создаёт join-таблицу автоматически:

```prisma
model Post {
  id    Int    @id @default(autoincrement())
  title String
  tags  Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String  @unique
  posts Post[]
}
```

Prisma сама сгенерит таблицу `_PostTags` с колонками `A` и `B` (имена `Post.id` и `Tag.id`). Удобно, но менее гибко.

### Явная (explicit) join-таблица — для учебного проекта лучше

```prisma
model Post {
  id    Int       @id @default(autoincrement())
  title String
  tags  PostTag[]
}

model Tag {
  id    Int       @id @default(autoincrement())
  name  String    @unique
  posts PostTag[]
}

model PostTag {
  post      Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  tag       Tag    @relation(fields: [tagId], references: [id], onDelete: Cascade)
  postId    Int
  tagId     Int

  @@id([postId, tagId])                  // составной первичный ключ
  @@index([tagId])                        // для быстрого поиска постов по тегу
}
```

Зачем явная таблица:
- Можно добавить поля к самой связи (`addedAt`, `addedBy`)
- Имена колонок предсказуемые
- Видна структура в БД

### CRUD с M:N

```ts
// Создать теги при создании поста
const post = await prisma.post.create({
  data: {
    title: 'Hello',
    body: '...',
    tags: {
      create: [
        { tag: { connect: { name: 'nodejs' } } },    // подключить существующий
        { tag: { connect: { name: 'docker' } } },
        { tag: { create: { name: 'prisma' } } }      // или создать новый
      ]
    }
  }
});

// Добавить тег к существующему посту
await prisma.postTag.create({
  data: { postId: 1, tagId: 5 }
});

// Удалить связь (тег у поста)
await prisma.postTag.delete({
  where: { postId_tagId: { postId: 1, tagId: 5 } }
});
```

---

## 18. JOIN через `include` и вложенные запросы

`include` — это сахар над SQL-`JOIN`. Prisma вытягивает связанные сущности одним запросом (не делает N+1).

### Простой include

```ts
const post = await prisma.post.findUnique({
  where: { id: 1 },
  include: { author: true }      // ⬅ подтянет User
});
// { id: 1, title: '...', author: { id: 5, name: 'Alice', email: '...' } }
```

### Вложенный include

```ts
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      include: {
        tags: { include: { tag: true } }   // ⬅ посты → их теги → сам тег
      }
    }
  }
});
```

### Фильтрация и сортировка внутри include

```ts
const user = await prisma.user.findUnique({
  where: { id: 1 },
  include: {
    posts: {
      where: { published: true },
      orderBy: { createdAt: 'desc' },
      take: 5                              // ⬅ топ-5 постов
    }
  }
});
```

### Под капотом

`include: { author: true }` ≈ SQL:
```sql
SELECT p.*, u.*
FROM "Post" p
LEFT JOIN "User" u ON p."authorId" = u."id"
WHERE p."id" = 1;
```

Prisma **не делает отдельный запрос на автора** — это и есть защита от N+1.

---

## 19. `select` — выборка только нужных полей

### Проблема: `select *` тянет всё

`findUnique` без select вернёт **все колонки**. Если в посте есть поле `body` размером 5000 символов, а тебе нужен только `title` — тратится трафик.

### select — вернуть только нужные поля

```ts
const post = await prisma.post.findUnique({
  where: { id: 1 },
  select: { id: true, title: true, authorId: true }
});
// { id: 1, title: 'Hello', authorId: 5 }
```

### select с include

```ts
const post = await prisma.post.findUnique({
  where: { id: 1 },
  select: {
    title: true,
    author: { select: { name: true, email: true } }   // ⬅ вложенный select
  }
});
// { title: 'Hello', author: { name: 'Alice', email: 'a@...' } }
```

### select + include — взаимоисключающие

Нельзя одновременно `select` и `include` на **одном уровне**. Выбирай одно:

```ts
// ❌ Ошибка
await prisma.post.findUnique({
  select: { id: true },
  include: { author: true }
});

// ✅ Вариант 1: только select с вложенным select
await prisma.post.findUnique({
  select: { id: true, author: { select: { name: true } } }
});

// ✅ Вариант 2: только include
await prisma.post.findUnique({
  include: { author: true }
});
```

---

## 20. Индексы — `@index`

### Зачем индексы

Без индекса Postgres делает **последовательный скан** таблицы — линейный перебор всех строк. При 1 млн записей это медленно. Индекс — структура данных (обычно B-tree), которая позволяет находить строку за `O(log n)`.

```sql
-- Без индекса:
SELECT * FROM "Post" WHERE "authorId" = 5;     -- Seq Scan, ~100ms
-- С индексом:
-- Index Scan, ~1ms
```

### В Prisma — `@index`

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])

  @@index([authorId])           // ⬅ индекс на одной колонке
  @@index([authorId, createdAt]) // ⬅ составной индекс
}
```

### Когда добавлять индекс

- **Всегда** на внешних ключах (FK) — Prisma добавляет сама, но если удалишь — будет медленно
- На полях, по которым часто ищешь (`WHERE email = ?`)
- На полях сортировки (`ORDER BY createdAt`)
- **Не** создавай индексы «на всякий случай» — они замедляют INSERT/UPDATE и занимают место

### Уникальный индекс

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique       // ⬅ = UNIQUE INDEX
}
```

`@unique` — это и валидация (на уровне БД), и индекс одновременно.

### Миграция индекса

```sql
-- Сгенерируется автоматически
CREATE INDEX "Post_authorId_idx" ON "Post"("authorId");

-- Для составного
CREATE INDEX "Post_authorId_createdAt_idx" ON "Post"("authorId", "createdAt");
```

---

## 21. Агрегации — `count`, `groupBy`, `aggregate`

### `count` — сколько записей

```ts
const count = await prisma.post.count();
const userPostCount = await prisma.post.count({ where: { authorId: 5 } });
```

С `include`:
```ts
const user = await prisma.user.findUnique({
  where: { id: 5 },
  include: { _count: { select: { posts: true } } }      // ⬅ "_count: { select: ..." — особый синтаксис
});
// { id: 5, name: 'Alice', _count: { posts: 3 } }
```

### `groupBy` — GROUP BY в SQL

```ts
const stats = await prisma.post.groupBy({
  by: ['authorId'],
  _count: { _all: true },
  _avg: { id: true },
  orderBy: { _count: { id: 'desc' } }
});
// [
//   { authorId: 1, _count: { _all: 42 }, _avg: { id: 15 } },
//   { authorId: 2, _count: { _all: 18 }, _avg: { id: 10 } }
// ]
```

Это SQL:
```sql
SELECT "authorId", COUNT(*), AVG("id")
FROM "Post"
GROUP BY "authorId"
ORDER BY COUNT(*) DESC;
```

### `aggregate` — любая агрегатная функция

```ts
const result = await prisma.post.aggregate({
  _min: { id: true },
  _max: { id: true },
  _avg: { id: true },
  _sum: { id: true }
});
// { _min: { id: 1 }, _max: { id: 100 }, _avg: { id: 50.5 }, _sum: { id: 5050 } }
```

---

## Контрольные вопросы (часть 3 — связи и оптимизация)

13. Почему в реляционной БД плохо хранить вложенные данные в одной таблице?
14. Что делает `FOREIGN KEY`? Что произойдёт при попытке сослаться на несуществующую запись?
15. Чем `onDelete: Cascade` отличается от `onDelete: Restrict`?
16. Зачем нужна явная join-таблица для M:N, если Prisma умеет делать неявную?
17. Что такое N+1 проблема и как `include` её решает?
18. Можно ли использовать `select` и `include` одновременно на одном уровне?
19. Зачем нужен индекс на FK? Когда индекс **не** нужен?
20. Чем `groupBy` отличается от `findMany`?
21. Как одним запросом получить пользователя с количеством его постов?
