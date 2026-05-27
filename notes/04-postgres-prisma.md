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
