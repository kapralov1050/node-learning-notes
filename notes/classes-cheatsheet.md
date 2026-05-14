# Шпаргалка: Классы в TypeScript

---

## Базовый класс

```ts
class User {
  // поля класса — данные объекта
  name: string;
  age: number;

  // constructor — вызывается при создании объекта через new
  constructor(name: string, age: number) {
    this.name = name; // this — ссылка на текущий объект
    this.age = age;
  }

  // метод — функция привязанная к объекту
  greet() {
    return `Привет, я ${this.name}`;
  }
}

const user = new User('Вася', 25);
user.greet(); // 'Привет, я Вася'
user.name;    // 'Вася'
```

---

## Краткая запись полей через constructor

TypeScript позволяет объявить поля и присвоить их одной строкой через модификаторы:

```ts
// ❌ Длинно — объявляем поля отдельно
class User {
  name: string;
  age: number;
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }
}

// ✅ Коротко — public/private прямо в constructor
class User {
  constructor(public name: string, public age: number) {}
  // TypeScript сам создаёт поля и присваивает значения
}
```

`public` — поле доступно снаружи объекта.
`private` — только внутри класса.
`readonly` — нельзя изменить после создания.

---

## Наследование и extends

`extends` — создать класс на основе другого, унаследовав его поля и методы:

```ts
class Animal {
  constructor(public name: string) {}

  speak() {
    return `${this.name} издаёт звук`;
  }
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name); // ← обязательно! вызывает constructor родителя
  }

  speak() {
    return `${this.name} лает`; // переопределяем метод родителя
  }
}

const dog = new Dog('Рекс', 'Лабрадор');
dog.speak(); // 'Рекс лает'
dog.name;    // 'Рекс'   ← унаследовано от Animal
dog.breed;   // 'Лабрадор'
```

---

## Зачем super()

`super()` — вызов constructor **родительского** класса.

Если класс наследует другой (`extends`) и у него есть `constructor` — `super()` обязателен и должен быть первым.

```ts
class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message); // вызываем Error(message) — так Error.message устанавливается
    // без super() — ошибка компиляции
  }
}

const err = new AppError(404, 'Not found');
err.statusCode; // 404  ← наше поле
err.message;    // 'Not found'  ← установлено через super() в Error
err.stack;      // стек вызовов  ← тоже от Error
```

---

## instanceof — проверка типа объекта

```ts
const err = new AppError(404, 'Not found');

err instanceof AppError; // true
err instanceof Error;    // true — AppError наследует Error
err instanceof Date;     // false
```

Используется в error middleware чтобы понять какой тип ошибки пришёл:

```ts
if (err instanceof AppError) {
  res.status(err.statusCode).json({ error: err.message });
} else {
  res.status(500).json({ error: 'Internal Server Error' });
}
```

---

## static — методы и поля класса (не объекта)

```ts
class MathHelper {
  static PI = 3.14159;

  static square(x: number) {
    return x * x;
  }
}

MathHelper.PI;        // 3.14159  — через класс, не через new
MathHelper.square(4); // 16
```

Обычные методы вызываются на **объекте** (`user.greet()`).
Статические — на **классе** (`MathHelper.square()`).

---

## Итого: когда что писать

| Что | Зачем |
|-----|-------|
| `class Foo {}` | создать шаблон объектов |
| `constructor()` | инициализация при `new Foo()` |
| `public field` | поле доступное снаружи |
| `private field` | поле только внутри класса |
| `extends Bar` | унаследовать Bar |
| `super()` | вызвать constructor родителя (обязателен при extends) |
| `instanceof` | проверить к какому классу принадлежит объект |
| `static` | метод/поле класса, не объекта |
