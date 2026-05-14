# Этап 3 — REST API + Валидация (zod) + Загрузка файлов (Multer)

> Статус: ✅ Завершён | Pet-проект: `03-rest-api`

---

## 1. SSR vs REST API — в чём разница

В Этапе 2 сервер возвращал **готовый HTML** — браузер получал страницу целиком.

В REST API сервер возвращает **данные в формате JSON** — фронтенд сам решает как их отобразить.

```
SSR:
Браузер → GET /posts → сервер рендерит EJS → HTML → браузер показывает

REST API:
Браузер → GET /api/posts → сервер отдаёт JSON → фронтенд рендерит данные
```

Это даёт гибкость: один API может обслуживать веб-клиент, мобильное приложение, сторонние сервисы — все получают одни и те же данные.

---

## 2. HTTP методы

REST использует HTTP-методы как глаголы — они выражают намерение запроса:

| Метод | Назначение | Тело запроса |
|-------|-----------|-------------|
| `GET` | Получить данные | ❌ |
| `POST` | Создать новый ресурс | ✅ |
| `PUT` | Заменить ресурс целиком | ✅ |
| `PATCH` | Обновить часть ресурса | ✅ |
| `DELETE` | Удалить ресурс | ❌ |

В отличие от HTML-форм (только GET/POST), fetch/axios поддерживают все методы — поэтому в REST API используем настоящие PUT/PATCH/DELETE.

---

## 3. Структура маршрутов REST

Соглашение: маршруты называются существительными, действие выражается методом.

| Метод | URL | Действие |
|-------|-----|----------|
| GET | `/api/posts` | список всех |
| POST | `/api/posts` | создать |
| GET | `/api/posts/:id` | получить один |
| PUT | `/api/posts/:id` | заменить |
| PATCH | `/api/posts/:id` | обновить частично |
| DELETE | `/api/posts/:id` | удалить |

Префикс `/api/` — соглашение, которое отделяет API-маршруты от обычных страниц.

---

## 4. JSON — формат обмена данными

REST API принимает и отдаёт JSON. В Express:

```ts
// Отдать JSON
res.json({ id: 1, title: 'Hello' });
// Устанавливает Content-Type: application/json автоматически

// Принять JSON из тела запроса
app.use(express.json()); // middleware — аналог urlencoded, но для JSON
// теперь req.body содержит распарсенный объект
```

Отличие от Этапа 2: там использовали `express.urlencoded` для HTML-форм, здесь — `express.json()` для JSON-запросов от fetch/Postman.

---

## 5. HTTP статус коды

Статус код сообщает клиенту что произошло. Возвращать правильные коды — часть REST-контракта.

| Код | Значение | Когда использовать |
|-----|---------|-------------------|
| `200` | OK | успешный GET, PATCH, PUT |
| `201` | Created | успешный POST (создание) |
| `204` | No Content | успешный DELETE (нет тела) |
| `400` | Bad Request | невалидные данные от клиента |
| `404` | Not Found | ресурс не найден |
| `409` | Conflict | конфликт (например, email уже занят) |
| `422` | Unprocessable Entity | данные получены, но не прошли валидацию |
| `500` | Internal Server Error | ошибка на сервере |

```ts
res.status(201).json({ id: newPost.id });
res.status(404).json({ error: 'Post not found' });
res.status(204).send(); // без тела
```

---

## 6. Валидация данных — зачем и почему zod

### Зачем валидировать?

Клиент может прислать что угодно: пустую строку, число вместо строки, лишние поля. Без валидации эти данные попадут в базу данных или сломают логику.

Валидация на сервере обязательна даже если есть валидация на фронтенде — клиент можно обойти через Postman или curl.

### Zod

Zod — библиотека для валидации данных через схемы. Возвращает типизированный результат — TypeScript знает форму данных после валидации.

```ts
import { z } from 'zod';

// Описываем схему
const PostSchema = z.object({
  title: z.string().min(1, 'Заголовок обязателен').max(100),
  body: z.string().min(10, 'Текст слишком короткий'),
});

// Выводим тип автоматически — не нужно писать интерфейс отдельно
type PostInput = z.infer<typeof PostSchema>;

// Валидируем
const result = PostSchema.safeParse(req.body);

if (!result.success) {
  // result.error.errors — массив с описанием ошибок
  return res.status(422).json({ errors: result.error.errors });
}

// result.data — типизированные, валидные данные
const { title, body } = result.data;
```

### safeParse vs parse

```ts
// parse — бросает исключение при ошибке
const data = PostSchema.parse(req.body); // ❌ если невалидно — throws ZodError

// safeParse — возвращает объект результата, не бросает
const result = PostSchema.safeParse(req.body); // ✅ безопасно
if (!result.success) { /* обработать ошибку */ }
```

В HTTP-обработчиках всегда используй `safeParse` — исключения должны обрабатываться явно.

### Полезные методы схем:

```ts
z.string()              // строка
  .min(1)               // минимум 1 символ
  .max(100)             // максимум 100
  .email()              // валидный email
  .url()                // валидный URL
  .regex(/^\d+$/)       // по RegExp

z.number()
  .int()                // целое число
  .positive()           // > 0
  .min(0).max(100)

z.boolean()
z.date()
z.array(z.string())     // массив строк
z.optional()            // поле необязательно
z.nullable()            // может быть null
```

---

## 7. Несколько middleware в одном маршруте

Express принимает любое количество middleware в маршруте — они выполняются слева направо:

```ts
router.post('/:id/cover', upload.single('image'), postController.uploadCover);
//                         ^^^^^^^^^^^^^^^^^^^      ^^^^^^^^^^^^^^^^^^^^^^^^^
//                         middleware 1              middleware 2 (контроллер)
```

`upload.single('image')` запускается первым — обрабатывает файл и кладёт его в `req.file`. Только потом вызывается `uploadCover` — к этому моменту `req.file` уже заполнен.

Можно цепочить сколько угодно:

```ts
router.post('/admin', checkAuth, checkRole('admin'), logAction, controller.create);
```

Каждый middleware делает свою работу и вызывает `next()`. Если один из них вызовет `next(err)` — цепочка прерывается и управление переходит к error middleware.

---

## 8. Обработка ошибок в Express

### Как next(err) находит error middleware

`next()` без аргументов — иди дальше по обычной цепочке.
`next(err)` с аргументом — перепрыгни все обычные middleware и маршруты, найди error middleware.

Express различает error middleware по **количеству аргументов** — ровно четыре:

```ts
// Обычный middleware — 3 аргумента
app.use((req, res, next) => { ... });

// Error middleware — 4 аргумента (даже если next не используется)
app.use((err, req, res, next) => { ... });
```

### Порядок регистрации — всегда последним

```ts
// app.ts
app.use(express.json());
app.use('/api/posts', postsRouter);
app.get('/', handler);

app.use(errorHandler); // ← ПОСЛЕДНИМ, после всех маршрутов
```

Если зарегистрировать раньше — ошибки из маршрутов зарегистрированных после него до него не дойдут.

### next(err) vs throw

В синхронном коде оба варианта работают:

```ts
// throw — Express 4 перехватывает синхронные throw в обработчиках
throw new AppError(404, 'Not found');

// next(err) — явный и предпочтительный стиль
return next(new AppError(404, 'Not found'));
```

В **асинхронном** коде `throw` не перехватывается — только `next(err)` или `try/catch`:

```ts
// ❌ — необработанное отклонение промиса
app.get('/:id', async (req, res) => {
  const post = await PostModel.findById(id); // бросит — никто не поймает
});

// ✅
app.get('/:id', async (req, res, next) => {
  try {
    const post = await PostModel.findById(id);
    res.json(post);
  } catch (err) {
    next(err);
  }
});
```

### Кастомный класс ошибки

```ts
class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message); // устанавливает this.message через родительский Error
  }
}

// В контроллере
return next(new AppError(404, 'Post not found'));

// В error middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }
  return res.status(500).json({ error: 'Internal Server Error' });
};
```

---

## 9. Загрузка файлов — Multer

HTML-формы отправляют файлы в формате `multipart/form-data` — это не JSON и не urlencoded. Для обработки нужен Multer.

### Настройка:

```ts
import multer from 'multer';

// Хранение на диске
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // папка для файлов
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`); // уникальное имя
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // максимум 5MB
  fileFilter: (req, file, cb) => {
    // разрешить только изображения
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения'));
    }
  },
});
```

### Использование как middleware:

```ts
// Один файл в поле 'image'
router.post('/posts', upload.single('image'), postController.create);

// Несколько файлов
router.post('/posts', upload.array('images', 5), postController.create);
```

### В контроллере:

```ts
export const create = (req: Request, res: Response) => {
  // req.file — загруженный файл (при upload.single)
  // req.files — массив файлов (при upload.array)

  console.log(req.file?.filename);    // имя файла на диске
  console.log(req.file?.mimetype);    // тип файла
  console.log(req.file?.size);        // размер в байтах
  console.log(req.file?.path);        // полный путь
};
```

---

## 10. Полная цепочка загрузки файла

Важно понять что происходит по шагам — Multer и контроллер делают разные вещи:

```
Клиент отправляет multipart/form-data с полем 'image'
  ↓
upload.single('image')  ← Multer middleware
  - читает файл из запроса
  - проверяет MIME-тип через fileFilter
  - сохраняет файл на диск: uploads/1234567890.jpg
  - кладёт метаданные в req.file
  - вызывает next()
  ↓
postController.uploadCover  ← контроллер
  - читает req.file.filename
  - формирует строку: '/uploads/1234567890.jpg'
  - сохраняет эту строку в PostModel через updateImage()
  - возвращает обновлённый пост клиенту
  ↓
Клиент получает пост с imageUrl: '/uploads/1234567890.jpg'
```

Чтобы файл был доступен по этому URL — нужно отдавать папку `uploads/` как статику:

```ts
// app.ts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// теперь GET /uploads/1234567890.jpg → отдаёт файл с диска
```

Multer не создаёт папку `uploads/` автоматически — она должна существовать до первой загрузки.

---

## 11. Тестирование API

В Этапе 2 тестировали через браузер. REST API возвращает JSON — нужны специальные инструменты.

**Thunder Client** — расширение VS Code, аналог Postman прямо в редакторе.
**Postman** — отдельное приложение, более мощное.
**curl** — из терминала:

```bash
# GET
curl http://localhost:3000/api/posts

# POST с JSON
curl -X POST http://localhost:3000/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Hello","body":"World"}'

# DELETE
curl -X DELETE http://localhost:3000/api/posts/1
```

---

## Контрольные вопросы

1. Чем REST API отличается от SSR? Что возвращает каждый?
2. Какой HTTP-метод использовать для частичного обновления ресурса?
3. Какой статус код вернуть после успешного создания? После удаления?
4. Чем `safeParse` отличается от `parse` в zod? Какой использовать в обработчиках?
5. Почему валидация на сервере обязательна даже если есть валидация на фронтенде?
6. Для чего нужен Multer? Почему нельзя использовать `express.json()` для файлов?
7. Как передать ошибку в error middleware Express?
