# Прогресс обучения Node.js

## Текущий этап
**Этап 3 — REST API + Валидация (zod) + Загрузка файлов (Multer)**

Статус: ⏳ Не начат

---

## Этапы

| # | Тема | Статус | Pet-проект |
|---|------|--------|------------|
| 1 | Ядро Node.js (Event Loop, модули, Streams, HTTP) | ✅ Готов | `01-mini-framework` |
| 2 | Express.js + Шаблонизаторы (EJS) + MVC + Static files | ✅ Готов | `02-simple-blog` |
| 3 | REST API + Валидация (zod) + Загрузка файлов (Multer) | ⏳ Не начат | `03-rest-api` |
| 4 | PostgreSQL + Prisma | ⏳ Не начат | `04-api-with-db` |
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

## Лог

### 2026-04-15
- Создана структура проекта
- Начало обучения
- Этап 1 завершён: написан mini HTTP framework без зависимостей
  - Event Loop, встроенные модули, HTTP-сервер
  - Middleware-цепочка через next()
  - Роутинг с параметрами (:id)
  - Расширение req/res своими методами (json, status)

### 2026-04-18
- Обновлён план: добавлены Шаблонизаторы (EJS), MongoDB + Mongoose, WebSockets
- Переработаны pet-проекты
- Углублён конспект по Этапу 1 (notes/01-core.md)
- Этап 2 завершён: SSR-блог с CRUD, MVC-архитектура, EJS-шаблоны, partials, статика
- Разобрана XSS-атака на практике: <%= %> vs <%- %>
