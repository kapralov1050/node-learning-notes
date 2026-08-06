# Прогресс обучения Node.js

## Текущий этап
**Этап 4 — PostgreSQL + Prisma**

Статус: 🚧 В процессе

---

## Этапы

| # | Тема | Статус | Pet-проект |
|---|------|--------|------------|
| 1 | Ядро Node.js (Event Loop, модули, Streams, HTTP) | ✅ Готов | `01-mini-framework` |
| 2 | Express.js + Шаблонизаторы (EJS) + MVC + Static files | ✅ Готов | `02-simple-blog` |
| 3 | REST API + Валидация (zod) + Загрузка файлов (Multer) | ✅ Готов | `03-rest-api` |
| 4 | PostgreSQL + Prisma | 🚧 В процессе | `04-api-with-db` |
| 5 | MongoDB + Mongoose | ⏳ Не начат | `05-mongo-notes` |
| 6 | Аутентификация: Сессии/куки → JWT + bcrypt | ⏳ Не начат | `06-auth-service` |
| 7 | NestJS + архитектура (DI, модули, декораторы) | ⏳ Не начат | `07-nest-api` |
| 8 | WebSockets + Socket.io | ⏳ Не начат | `08-realtime-chat` |
| 9 | Тестирование (Jest + Supertest) | ⏳ Не начат | покрываем `03-rest-api` |
| 10 | Docker + Деплой | ⏳ Не начат | деплоим `06-auth-service` |

---

## Описание pet-проектов

| Проект | Что делаем | Ключевые технологии |
|--------|-----------|---------------------|
| `01-mini-framework` | HTTP-фреймворк без зависимостей | Node.js HTTP, middleware, routing |
| `02-simple-blog` | SSR-блог с CRUD статей | Express, EJS, MVC, static files |
| `03-rest-api` | JSON API с валидацией и загрузкой файлов | Express, zod, Multer |
| `04-api-with-db` | API с реляционной БД | PostgreSQL, Prisma ORM |
| `05-mongo-notes` | API заметок на документной БД | MongoDB, Mongoose |
| `06-auth-service` | Полная аутентификация | Sessions, JWT, bcrypt |
| `07-nest-api` | Переписываем API в NestJS | NestJS, DI, модули, декораторы |
| `08-realtime-chat` | Чат в реальном времени | WebSockets, Socket.io |

---

## Подзадачи Этапа 4 (расширение плана)

| # | Тема | Статус |
|---|------|--------|
| 4.1 | Связь 1:N — `User → Post` (foreign key, `onDelete`) | ⏳ |
| 4.2 | Связь M:N — `Post ↔ Tag` (явная join-таблица) | ⏳ |
| 4.3 | JOIN через `include` и вложенные запросы | ⏳ |
| 4.4 | `select` — выборка только нужных полей | ⏳ |
| 4.5 | Индексы `@index` (одиночные и составные) | ⏳ |
| 4.6 | Агрегации: `count`, `groupBy` | ⏳ (опционально) |

## Следующие шаги (backlog)
- (пусто — ждём новых задач)

## Лог

### 2026-04-15
- Создана структура проекта
- Начало обучения
- Этап 1 завершён: написан mini HTTP framework без зависимостей
  - Event Loop, встроенные модули, HTTP-сервер
  - Middleware-цепочка через next()
  - Роутинг с параметрами (:id)
  - Расширение req/res своими методами (json, status)

### 2026-05-14
- Этап 3 завершён: REST API с JSON, zod-валидация, error middleware, Multer загрузка файлов
- Разобрана цепочка middleware в роутере (upload.single → controller)
- Протестировано через Postman и curl

### 2026-04-18
- Обновлён план: добавлены Шаблонизаторы (EJS), MongoDB + Mongoose, WebSockets
- Переработаны pet-проекты
- Углублён конспект по Этапу 1 (notes/01-core.md)
- Этап 2 завершён: SSR-блог с CRUD, MVC-архитектура, EJS-шаблоны, partials, статика
- Разобрана XSS-атака на практике: <%= %> vs <%- %>

### 2026-08-06
- Этап 4 продолжается: докинули `author` в zod-схему (`postSchema.ts`) и в типы модели (`models/Post.ts`)
- Пересобрали Docker-образ, создали посты через API — поле `author` корректно сохраняется ("Alice", "Anonymous")
- Разобрали важный gotcha: **zod по умолчанию отбрасывает «неизвестные» поля** из запроса — если поле не объявлено в схеме, до модели/БД оно не доходит
- Разобрали gotcha при работе с несколькими проектами: **внимательно проверять путь при правке похожих файлов** (у нас `03-rest-api` и `04-api-with-db` оба содержат `schemas/postSchema.ts`)

### 2026-07-21
- **Этап 4 начат: PostgreSQL + Prisma в Docker**
- Развёрнули `04-api-with-db` в Docker-контейнерах (Postgres 16 + Node 20 alpine)
- Создан multi-stage `Dockerfile` (builder → runner, без dev-зависимостей в финальном образе)
- `docker-compose.yml` с healthcheck БД (`pg_isready`) и `depends_on: condition: service_healthy`
- Применена начальная миграция `init` (CREATE TABLE Post) через `prisma migrate deploy` в CMD контейнера
- Сгенерирована вторая миграция `add_author` (ALTER TABLE ADD COLUMN) — попрактиковались в изменении схемы
- Подняли всё вместе (`docker-compose up --build`) → API отвечает на `http://localhost:3000/api/posts`
- Разобраны:
  - связка `package.json` ↔ `Dockerfile` ↔ `docker-compose.yml` (роль каждого)
  - механизм миграций как версионированных SQL-слепков
  - проблема hardcoded-порта в `app.ts` → переход на `process.env.PORT`
  - DNS внутри Docker-сети (`db` как hostname) vs `localhost` с хоста
  - override `DATABASE_URL` через переменную окружения для запуска миграций с хоста
- **Недоделано:** zod-схема не знает про поле `author` (поэтому в БД ложится `@default("Anonymous")`), нужно обновить `postSchema.ts` и модель `Post.ts`
