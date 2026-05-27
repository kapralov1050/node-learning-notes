# Теория баз данных

Общий справочник — не привязан к конкретному проекту.

---

## 1. Что такое база данных

**База данных (БД)** — организованное хранилище данных с возможностью эффективного поиска, изменения и управления доступом.

**СУБД (система управления БД)** — программа, которая управляет БД: PostgreSQL, MySQL, SQLite, MongoDB, Redis.

Разница: база данных — это данные. СУБД — это программа которая с ними работает.

---

## 2. Виды баз данных

### Реляционные (SQL)
Данные в таблицах со строгой схемой. Связи через внешние ключи.

**Примеры:** PostgreSQL, MySQL, SQLite, Microsoft SQL Server, Oracle

Когда использовать:
- Данные структурированы и предсказуемы
- Нужны сложные запросы с объединением таблиц
- Важна целостность данных (финансы, медицина)

### Документные (NoSQL)
Данные в JSON-подобных документах. Гибкая схема.

**Примеры:** MongoDB, CouchDB, Firestore

Когда использовать:
- Структура данных меняется часто
- Нужна горизонтальная масштабируемость
- Данные уже похожи на JSON-объекты

### Ключ-значение
Простейшая структура: ключ → значение. Очень быстро.

**Примеры:** Redis, Memcached

Когда использовать:
- Кеширование
- Сессии пользователей
- Очереди задач

### Колоночные
Данные хранятся по колонкам, а не строкам. Оптимально для аналитики.

**Примеры:** ClickHouse, Apache Cassandra, Amazon Redshift

### Графовые
Данные как узлы и рёбра графа. Для сложных связей.

**Примеры:** Neo4j, ArangoDB

---

## 3. Реляционная модель — подробно

### Таблица, строка, колонка

```
Таблица users:
┌────┬──────────┬─────────────────────┬──────────────────────┐
│ id │ name     │ email               │ createdAt            │
├────┼──────────┼─────────────────────┼──────────────────────┤
│  1 │ Иван     │ ivan@example.com    │ 2026-01-01 10:00:00  │
│  2 │ Мария    │ maria@example.com   │ 2026-01-02 12:00:00  │
└────┴──────────┴─────────────────────┴──────────────────────┘
```

- **Таблица** — хранит объекты одного типа
- **Строка (запись)** — один объект
- **Колонка (поле)** — атрибут объекта с фиксированным типом

### Первичный ключ (Primary Key)

Уникальный идентификатор строки. Обычно `id` с автоинкрементом.

```sql
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,  -- автоматически растущее число
  title VARCHAR(255) NOT NULL
);
```

### Внешний ключ (Foreign Key)

Ссылка на строку в другой таблице. Обеспечивает целостность: нельзя создать комментарий к несуществующему посту.

```sql
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  post_id INT REFERENCES posts(id) ON DELETE CASCADE,
  body TEXT NOT NULL
);
```

`ON DELETE CASCADE` — при удалении поста, все его комментарии тоже удаляются.

---

## 4. SQL — язык запросов

### DDL — определение структуры

```sql
-- Создать таблицу
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- Изменить таблицу
ALTER TABLE users ADD COLUMN age INT;
ALTER TABLE users DROP COLUMN age;

-- Удалить таблицу
DROP TABLE users;
```

### DML — работа с данными

```sql
-- INSERT
INSERT INTO users (name, email) VALUES ('Иван', 'ivan@example.com');
INSERT INTO users (name, email) VALUES
  ('Мария', 'maria@example.com'),
  ('Пётр', 'petr@example.com');

-- SELECT
SELECT * FROM users;
SELECT id, name FROM users WHERE email = 'ivan@example.com';
SELECT * FROM users ORDER BY createdAt DESC LIMIT 10 OFFSET 20;
SELECT COUNT(*) FROM users;
SELECT name, COUNT(*) as post_count FROM posts GROUP BY name;

-- UPDATE
UPDATE users SET name = 'Иван Иванов' WHERE id = 1;

-- DELETE
DELETE FROM users WHERE id = 1;
```

### JOIN — объединение таблиц

```sql
-- INNER JOIN — только совпадающие строки
SELECT posts.title, users.name
FROM posts
INNER JOIN users ON posts.user_id = users.id;

-- LEFT JOIN — все посты, даже без автора
SELECT posts.title, users.name
FROM posts
LEFT JOIN users ON posts.user_id = users.id;
```

---

## 5. Нормализация

Нормализация — процесс организации таблиц для устранения дублирования данных.

### Проблема без нормализации:

```
Плохая таблица orders:
┌────┬────────────┬──────────────┬───────────────────────────┐
│ id │ user_name  │ user_email   │ product_name              │
├────┼────────────┼──────────────┼───────────────────────────┤
│  1 │ Иван       │ ivan@mail.ru │ Ноутбук                   │
│  2 │ Иван       │ ivan@mail.ru │ Мышь                      │  ← дублирование
│  3 │ Мария      │ mar@mail.ru  │ Клавиатура                │
└────┴────────────┴──────────────┴───────────────────────────┘
```

Если Иван изменит email — нужно обновить несколько строк. Риск несогласованности.

### После нормализации:

```
users:                          orders:
┌────┬────────┬──────────┐     ┌────┬─────────┬──────────────┐
│ id │ name   │ email    │     │ id │ user_id │ product      │
├────┼────────┼──────────┤     ├────┼─────────┼──────────────┤
│  1 │ Иван   │ ivan@... │     │  1 │    1    │ Ноутбук      │
│  2 │ Мария  │ mar@...  │     │  2 │    1    │ Мышь         │
└────┴────────┴──────────┘     │  3 │    2    │ Клавиатура   │
                                └────┴─────────┴──────────────┘
```

---

## 6. Индексы

Индекс — структура данных для ускорения поиска. Аналог оглавления книги.

```sql
-- Без индекса — полный перебор всех строк (O(n))
SELECT * FROM users WHERE email = 'ivan@example.com';

-- Создать индекс
CREATE INDEX idx_users_email ON users(email);

-- Теперь поиск — O(log n)
```

**Когда создавать:**
- По полям в `WHERE`, `ORDER BY`, `JOIN`
- По полям с высокой уникальностью (email, username)

**Когда не создавать:**
- На маленьких таблицах (< 1000 строк) — не даёт выигрыша
- На полях которые часто меняются — индекс нужно обновлять

`UNIQUE` автоматически создаёт индекс. `PRIMARY KEY` тоже.

---

## 7. Транзакции и ACID

**Транзакция** — группа операций которые выполняются атомарно: либо все, либо ни одна.

```sql
BEGIN;
  UPDATE accounts SET balance = balance - 1000 WHERE id = 1;
  UPDATE accounts SET balance = balance + 1000 WHERE id = 2;
COMMIT;

-- Если что-то пошло не так:
ROLLBACK;
```

### ACID — свойства надёжных транзакций:

| Свойство | Описание |
|----------|---------|
| **A**tomicity | Атомарность — всё или ничего |
| **C**onsistency | Согласованность — БД всегда в корректном состоянии |
| **I**solation | Изолированность — транзакции не мешают друг другу |
| **D**urability | Долговечность — зафиксированные данные не потеряются |

В Prisma транзакции:

```ts
await prisma.$transaction([
  prisma.account.update({ where: { id: 1 }, data: { balance: { decrement: 1000 } } }),
  prisma.account.update({ where: { id: 2 }, data: { balance: { increment: 1000 } } }),
]);
```

---

## 8. Связи между таблицами

### Один ко многим (1:N)

Один пользователь — много постов:

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id     Int  @id @default(autoincrement())
  user   User @relation(fields: [userId], references: [id])
  userId Int
}
```

### Многие ко многим (N:M)

Пост может иметь много тегов, тег — много постов:

```prisma
model Post {
  id   Int   @id @default(autoincrement())
  tags Tag[]
}

model Tag {
  id    Int    @id @default(autoincrement())
  posts Post[]
}
```

Prisma создаёт промежуточную таблицу автоматически.

### Один к одному (1:1)

Пользователь — один профиль:

```prisma
model User {
  id      Int      @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int  @id @default(autoincrement())
  user   User @relation(fields: [userId], references: [id])
  userId Int  @unique
}
```

---

## 9. N+1 проблема

Классическая ловушка при работе с ORM:

```ts
// ❌ N+1 — 1 запрос за постами + N запросов за авторами
const posts = await prisma.post.findMany();
for (const post of posts) {
  const user = await prisma.user.findUnique({ where: { id: post.userId } });
}
// Если 100 постов — 101 запрос к БД

// ✅ Один запрос с JOIN через include
const posts = await prisma.post.findMany({
  include: { user: true },
});
```

---

## 10. Migrations — версионирование схемы

Миграция — файл с SQL-командами которые изменяют схему БД. Хранятся в репозитории.

```
prisma/migrations/
  20260101_init/
    migration.sql       ← CREATE TABLE posts...
  20260115_add_tags/
    migration.sql       ← CREATE TABLE tags...
  20260201_add_index/
    migration.sql       ← CREATE INDEX...
```

Это позволяет:
- Откатить изменения схемы
- Применить одинаковые изменения на dev/staging/prod
- Видеть историю изменений БД в git

---

## Полезные ресурсы

### Документация
- [PostgreSQL официальная документация](https://www.postgresql.org/docs/current/)
- [Prisma документация](https://www.prisma.io/docs)
- [SQL Tutorial — w3schools](https://www.w3schools.com/sql/)

### Для практики SQL
- [SQLZoo](https://sqlzoo.net/) — интерактивные упражнения прямо в браузере
- [LeetCode — Database](https://leetcode.com/problemset/database/) — задачи на SQL

### YouTube (каналы)
- **Fireship** — короткие видео по PostgreSQL, Redis, MongoDB
- **Academind** — подробные курсы по базам данных
- **Hussein Nasser** — глубокое погружение в внутренности БД (на английском)
