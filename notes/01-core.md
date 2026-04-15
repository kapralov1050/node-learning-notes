# Этап 1 — Ядро Node.js

> Статус: ✅ Завершён

---

## Что такое Node.js

- **Runtime** для JS на сервере, построен на **V8** (движок Chrome) + **libuv** (асинхронный I/O)
- Не язык, не фреймворк — платформа
- **Однопоточная модель** с неблокирующим I/O

---

## Event Loop — фазы

1. **timers** — `setTimeout`, `setInterval`
2. **I/O callbacks** — завершённые операции ввода-вывода
3. **poll** — ожидание новых I/O событий
4. **check** — `setImmediate`
5. **close callbacks** — закрытие соединений

Микрозадачи (`Promise`, `queueMicrotask`) выполняются **между фазами**.

---

## Встроенные модули

| Модуль | Назначение |
|--------|-----------|
| `fs/promises` | Файловая система (async) |
| `path` | Работа с путями |
| `http` | HTTP-сервер |
| `events` | EventEmitter |
| `os` | Информация об ОС |
| `process` | Управление процессом |
| `cluster` | Многоядерность |
| `stream` | Потоки данных |

---

## Ключевые паттерны

```js
// fs — Promise версия (рекомендуется)
import fs from 'fs/promises';
const data = await fs.readFile('file.txt', 'utf8');

// EventEmitter
import EventEmitter from 'events';
const emitter = new EventEmitter();
emitter.on('event', (msg) => console.log(msg));
emitter.emit('event', 'Hello');

// Streams + pipe
import fs from 'fs';
fs.createReadStream('big.txt').pipe(fs.createWriteStream('copy.txt'));
```

---

## Pet-проект: mini-framework

Папка: `projects/01-mini-framework/`

Задача: HTTP-сервер с роутингом и middleware без Express.
