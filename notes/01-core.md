# Этап 1 — Ядро Node.js

> Статус: ✅ Завершён | Pet-проект: `01-mini-framework`

---

## 1. Что такое Node.js

Node.js — это **runtime-среда** для выполнения JavaScript вне браузера. Состоит из двух ключевых частей:

- **V8** — движок Google, компилирует JS в машинный код
- **libuv** — C-библиотека, реализует асинхронный I/O, Event Loop, Thread Pool

```
Твой JS код
     ↓
    V8 (выполнение)
     ↓
  libuv (I/O, таймеры, Event Loop)
     ↓
  Операционная система
```

Node.js — **однопоточный** со стороны JS, но I/O операции выполняются в фоновом **Thread Pool** (4 потока по умолчанию). Поэтому `fs.readFile` не блокирует поток — он отправляется в пул и возвращается через callback.

---

## 2. Event Loop — подробно

Event Loop — это бесконечный цикл, который проверяет очереди задач и выполняет их по порядку.

### Фазы (в порядке выполнения):

```
   ┌──────────────────────────┐
   │         timers           │  ← setTimeout, setInterval
   └────────────┬─────────────┘
                ↓
   ┌──────────────────────────┐
   │     pending callbacks    │  ← I/O ошибки предыдущего тика
   └────────────┬─────────────┘
                ↓
   ┌──────────────────────────┐
   │       idle, prepare      │  ← внутреннее использование
   └────────────┬─────────────┘
                ↓
   ┌──────────────────────────┐
   │          poll            │  ← ожидание новых I/O событий ⬅ здесь Node.js "висит"
   └────────────┬─────────────┘
                ↓
   ┌──────────────────────────┐
   │          check           │  ← setImmediate
   └────────────┬─────────────┘
                ↓
   ┌──────────────────────────┐
   │     close callbacks      │  ← socket.on('close', ...)
   └──────────────────────────┘
```

### Микрозадачи — выполняются МЕЖДУ каждой фазой:

1. `process.nextTick()` — самый высокий приоритет
2. `Promise.resolve()` — после nextTick

```js
console.log('1 - sync');

setTimeout(() => console.log('4 - setTimeout'), 0);
setImmediate(() => console.log('5 - setImmediate'));

Promise.resolve().then(() => console.log('3 - Promise'));
process.nextTick(() => console.log('2 - nextTick'));

console.log('1 - sync end');

// Вывод: 1-sync → 1-sync end → 2-nextTick → 3-Promise → 4-setTimeout → 5-setImmediate
```

### Почему это важно для бекенда:
- Долгий синхронный код **блокирует весь сервер** — другие запросы не обрабатываются
- Тяжёлые вычисления нужно выносить в **Worker Threads** или отдельные процессы
- I/O (файлы, БД, сеть) — неблокирующий по умолчанию

---

## 3. Модульная система

### CommonJS (старый стандарт, `.js` / `.cjs`)

```js
// экспорт
module.exports = { greet };
exports.greet = greet; // shorthand

// импорт
const { greet } = require('./greet');
```

- `require()` — **синхронный**, файл читается сразу
- Модуль кешируется после первого `require` — повторный вызов вернёт тот же объект
- `__dirname`, `__filename` — доступны глобально

### ESM (современный стандарт, `.mjs` или `"type": "module"` в package.json)

```js
// экспорт
export const greet = () => {};
export default class App {}

// импорт
import { greet } from './greet.js'; // расширение обязательно!
import App from './App.js';
```

- `import` — **асинхронный**, статически анализируется до выполнения
- `__dirname` и `__filename` недоступны — используй `import.meta.url`

```js
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Когда что использовать:
| | CommonJS | ESM |
|--|--|--|
| Новые проекты | ❌ | ✅ |
| Node.js < 12 | ✅ | ❌ |
| Tree-shaking | ❌ | ✅ |
| `require` динамически | ✅ | `import()` |

---

## 4. Встроенные модули

### `fs/promises` — файловая система

```js
import fs from 'fs/promises';

// Чтение
const data = await fs.readFile('file.txt', 'utf8');

// Запись
await fs.writeFile('out.txt', 'hello');

// Создание директории
await fs.mkdir('./uploads', { recursive: true });

// Список файлов
const files = await fs.readdir('./src');

// Проверка существования
try {
  await fs.access('file.txt');
  // файл существует
} catch {
  // файла нет
}
```

**Никогда не используй синхронные версии** (`readFileSync`) в обработчиках HTTP-запросов — они блокируют весь сервер.

---

### `path` — пути

```js
import path from 'path';

path.join('/users', 'bob', 'file.txt')   // '/users/bob/file.txt'
path.resolve('src', 'app.js')            // абсолютный путь от cwd
path.basename('/users/bob/file.txt')     // 'file.txt'
path.dirname('/users/bob/file.txt')      // '/users/bob'
path.extname('file.txt')                 // '.txt'
path.parse('/users/bob/file.txt')        // { root, dir, base, ext, name }
```

Всегда используй `path.join` вместо ручной конкатенации строк — корректно работает на Windows и Unix.

---

### `http` — HTTP-сервер

```js
import http from 'http';

const server = http.createServer((req, res) => {
  // req — IncomingMessage (Readable Stream)
  // res — ServerResponse (Writable Stream)

  console.log(req.method, req.url, req.headers);

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: true }));
});

server.listen(3000, () => console.log('Server on :3000'));
```

**Чтение body вручную (req — это Stream):**

```js
const chunks: Buffer[] = [];
req.on('data', chunk => chunks.push(chunk));
req.on('end', () => {
  const body = JSON.parse(Buffer.concat(chunks).toString());
});
```

---

### `events` — EventEmitter

```js
import EventEmitter from 'events';

class OrderService extends EventEmitter {}

const orders = new OrderService();

orders.on('created', (order) => {
  console.log('Новый заказ:', order.id);
});

orders.once('shutdown', () => {
  // сработает только один раз
});

orders.emit('created', { id: 1, item: 'book' });
```

**Ключевые методы:**
- `.on(event, listener)` — подписка
- `.once(event, listener)` — подписка на одно срабатывание
- `.emit(event, ...args)` — генерация события
- `.off(event, listener)` — отписка
- `.removeAllListeners(event)` — удалить все подписки

EventEmitter — основа Streams, HTTP-сервера, и многих Node.js модулей.

---

### `stream` — потоки данных

Потоки нужны когда данные **большие** — читаешь по кускам вместо загрузки всего в память.

**4 типа стримов:**

| Тип | Пример | Описание |
|-----|--------|----------|
| `Readable` | `fs.createReadStream` | Читаем из источника |
| `Writable` | `fs.createWriteStream` | Пишем в назначение |
| `Duplex` | `net.Socket` | Читаем и пишем |
| `Transform` | `zlib.createGzip()` | Duplex + трансформация данных |

```js
import fs from 'fs';
import zlib from 'zlib';

// Pipe: читаем файл → сжимаем gzip → пишем в файл
fs.createReadStream('big.txt')
  .pipe(zlib.createGzip())
  .pipe(fs.createWriteStream('big.txt.gz'));
```

**Backpressure** — механизм, при котором Writable сигнализирует Readable замедлиться, если не успевает писать. `.pipe()` обрабатывает это автоматически.

```js
// Ручная обработка backpressure
readable.on('data', (chunk) => {
  const ok = writable.write(chunk);
  if (!ok) {
    readable.pause();
    writable.once('drain', () => readable.resume());
  }
});
```

---

### `process` — управление процессом

```js
process.env.PORT           // переменные окружения
process.argv               // аргументы командной строки ['node', 'app.js', ...]
process.cwd()              // текущая рабочая директория
process.exit(0)            // выход (0 = успех, 1 = ошибка)
process.pid                // ID процесса

// Перехват необработанных ошибок
process.on('uncaughtException', (err) => {
  console.error('Критическая ошибка:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Необработанный промис:', reason);
});
```

---

## 5. Асинхронность — эволюция паттернов

### Callbacks (старый способ)

```js
fs.readFile('file.txt', 'utf8', (err, data) => {
  if (err) throw err;
  // callback hell если вложить несколько операций
});
```

### Promises

```js
fs.promises.readFile('file.txt', 'utf8')
  .then(data => console.log(data))
  .catch(err => console.error(err));
```

### Async/Await (современный способ)

```js
async function readConfig() {
  try {
    const data = await fs.readFile('config.json', 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Ошибка чтения конфига:', err);
    throw err;
  }
}
```

### Параллельное выполнение

```js
// Последовательно (медленно — ждём каждый)
const a = await fetchA();
const b = await fetchB();

// Параллельно (быстро — запускаем одновременно)
const [a, b] = await Promise.all([fetchA(), fetchB()]);

// Первый успешный
const result = await Promise.race([fetchA(), fetchB()]);

// Все, даже с ошибками
const results = await Promise.allSettled([fetchA(), fetchB()]);
```

---

## 6. Worker Threads vs Cluster

### Worker Threads — для CPU-тяжёлых задач

```js
import { Worker, isMainThread, parentPort } from 'worker_threads';

if (isMainThread) {
  const worker = new Worker('./worker.js');
  worker.on('message', result => console.log('Результат:', result));
  worker.postMessage({ data: [1, 2, 3, 4, 5] });
} else {
  parentPort!.on('message', ({ data }) => {
    const result = data.reduce((a: number, b: number) => a + b, 0);
    parentPort!.postMessage(result);
  });
}
```

### Cluster — для масштабирования HTTP-сервера

```js
import cluster from 'cluster';
import os from 'os';
import http from 'http';

if (cluster.isPrimary) {
  const cpus = os.cpus().length;
  for (let i = 0; i < cpus; i++) cluster.fork(); // по воркеру на каждое ядро
} else {
  http.createServer((req, res) => res.end('ok')).listen(3000);
}
```

| | Worker Threads | Cluster |
|--|--|--|
| Использование | CPU вычисления | HTTP масштабирование |
| Память | Общая (SharedArrayBuffer) | Отдельная на процесс |
| Коммуникация | `postMessage` | IPC |

---

## 7. Что мы построили: mini-framework

**Папка:** `projects/01-mini-framework/`

**Реализовано без Express, только чистый Node.js:**

### Middleware-цепочка

Каждый middleware получает `(req, res, next)` и вызывает `next()` для передачи управления.

```
Запрос → mw1 → mw2 → mw3 → роутер → обработчик → Ответ
```

### Роутинг с параметрами

URL-паттерн `/users/:id` превращается в RegExp. При совпадении — параметры пишутся в `req.params`.

### Расширение req/res

`res.json(data)` — устанавливает `Content-Type: application/json` и вызывает `res.end(JSON.stringify(data))`.

### Почему это важно

Понимание того, как Express работает изнутри — ты не магия, а конкретный код поверх `http.createServer`. Это делает отладку и настройку Express гораздо проще.

---

## Контрольные вопросы для повторения

1. Чем V8 отличается от libuv? Кто за что отвечает?
2. В каком порядке выполнятся: `setTimeout(fn, 0)`, `Promise.resolve().then(fn)`, `process.nextTick(fn)`?
3. Что такое backpressure в стримах и как `.pipe()` его решает?
4. В чём разница между CommonJS и ESM? Когда `require` синхронный — это проблема?
5. Почему `readFileSync` опасен в HTTP-обработчике?
6. Когда использовать Worker Threads, а когда Cluster?
7. Как EventEmitter связан с Streams и HTTP-сервером?
