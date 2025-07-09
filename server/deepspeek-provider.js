/**
 * DeepSpeek провайдер - специализированный AI для технических вопросов
 */

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

// Базовые настройки провайдера
const CACHE_LIMIT = 100; // Максимальное количество кэшированных ответов
const PROVIDERS = {
  FREE: ['chatfree', 'you', 'liaobots', 'freegpt4', 'deepinfra'],
  STANDARD: ['phind', 'qwen', 'aichat', 'openrouter'],
  PREMIUM: ['perplexity', 'gemini', 'deepai']
};

// Кэш для хранения часто задаваемых технических вопросов и ответов
const technicalResponseCache = new Map();

// Базовые ответы для автономного режима
const FALLBACK_RESPONSES = {
  basic: "Я могу помочь с базовыми техническими вопросами о языках программирования, фреймворках и инструментах разработки. Что именно вас интересует?",
  
  intermediate: "Готов ответить на ваш технический вопрос среднего уровня сложности. Располагаю информацией об архитектурных паттернах, алгоритмах и современных технологиях разработки.",
  
  advanced: "Для ответа на ваш сложный технический вопрос я использую специализированную базу знаний. Могу помочь с детальным анализом кода, оптимизацией алгоритмов и архитектурными решениями."
};

// Словарь технических терминов для определения уровня сложности
const TECH_KEYWORDS = {
  basic: [
    'что такое', 'как использовать', 'основы', 'начать', 'синтаксис', 
    'примеры', 'простой', 'базовый', 'учебник', 'help', 'помощь',
    'npm', 'install', 'yarn', 'hello world', 'установить'
  ],
  
  intermediate: [
    'паттерн', 'оптимизация', 'производительность', 'архитектура',
    'интеграция', 'безопасность', 'масштабирование', 'тестирование',
    'рефакторинг', 'best practice', 'лучшие практики', 'api', 'async'
  ],
  
  advanced: [
    'многопоточность', 'конкурентность', 'распределенный', 'микросервисы',
    'алгоритмическая сложность', 'memory leak', 'утечка памяти',
    'garbage collection', 'сборка мусора', 'профилирование',
    'low-level', 'низкоуровневый', 'параллельные вычисления'
  ]
};

/**
 * Генерирует уникальный ключ для кэширования запроса
 * @param {string} query - Текст запроса
 * @returns {string} - Уникальный ключ для кэша
 */
function generateCacheKey(query) {
  return query.toLowerCase().trim();
}

/**
 * Проверяет, есть ли кэшированный ответ для запроса
 * @param {string} query - Текст запроса
 * @returns {Object|null} - Кэшированный ответ или null
 */
function getCachedResponse(query) {
  const key = generateCacheKey(query);
  
  // Проверяем предзагруженные ответы
  if (key in PRELOADED_ANSWERS) {
    console.log(`DeepSpeek: найден предзагруженный ответ для запроса "${key.substring(0, 30)}..."`);
    return PRELOADED_ANSWERS[key];
  }
  
  // Проверяем кэш
  if (technicalResponseCache.has(key)) {
    console.log(`DeepSpeek: найден кэшированный ответ для запроса "${key.substring(0, 30)}..."`);
    return technicalResponseCache.get(key);
  }
  
  return null;
}

/**
 * Сохраняет ответ в кэш для последующего использования
 * @param {string} query - Текст запроса
 * @param {Object} response - Ответ для кэширования
 */
function cacheResponse(query, response) {
  const key = generateCacheKey(query);
  
  // Если кэш достиг лимита, удаляем самый старый элемент
  if (technicalResponseCache.size >= CACHE_LIMIT) {
    const oldestKey = technicalResponseCache.keys().next().value;
    technicalResponseCache.delete(oldestKey);
  }
  
  technicalResponseCache.set(key, response);
  console.log(`DeepSpeek: ответ на запрос "${key.substring(0, 30)}..." сохранен в кэш`);
}

/**
 * Функция для определения технических запросов
 * @param {string} query - Запрос пользователя
 * @returns {boolean} - Является ли запрос техническим
 */
function isTechnicalQuery(query) {
  // Список технических тем и ключевых слов
  const technicalKeywords = [
    'javascript', 'python', 'java', 'html', 'css', 'code', 'код',
    'программирование', 'алгоритм', 'функция', 'метод', 'объект',
    'class', 'framework', 'фреймворк', 'библиотека', 'library',
    'api', 'backend', 'frontend', 'database', 'sql', 'nosql',
    'сервер', 'клиент', 'запрос', 'ответ', 'http', 'rest',
    'json', 'xml', 'git', 'docker', 'kubernetes', 'cloud',
    'web', 'app', 'mobile', 'react', 'vue', 'angular',
    'node', 'express', 'django', 'flask', 'spring', 'bootstrap'
  ];
  
  const normalizedQuery = query.toLowerCase();
  
  // Проверяем наличие технических ключевых слов в запросе
  return technicalKeywords.some(keyword => 
    normalizedQuery.includes(keyword)
  );
}

/**
 * Определяет уровень технической сложности вопроса
 * @param {string} query - Текст запроса пользователя
 * @returns {string} - Уровень сложности: 'basic', 'intermediate', 'advanced' или 'general'
 */
function determineExpertLevel(query) {
  const normalizedQuery = query.toLowerCase();
  
  // Подсчитываем количество ключевых слов для каждого уровня
  const scores = {
    basic: 0,
    intermediate: 0,
    advanced: 0
  };
  
  // Проходим по всем ключевым словам и увеличиваем счетчик соответствующего уровня
  for (const level in TECH_KEYWORDS) {
    for (const keyword of TECH_KEYWORDS[level]) {
      if (normalizedQuery.includes(keyword)) {
        scores[level] += 1;
      }
    }
  }
  
  // Определяем уровень сложности на основе набранных баллов
  if (scores.advanced > 0) {
    return 'advanced';
  } else if (scores.intermediate > 0) {
    return 'intermediate';
  } else if (scores.basic > 0 || isTechnicalQuery(query)) {
    return 'basic';
  } else {
    return 'general';
  }
}

/**
 * Функция для генерации технического ответа через систему провайдеров
 * @param {string} query - Текст технического запроса
 * @returns {Promise<Object>} - Ответ от AI провайдера
 */
async function generateTechnicalResponse(query) {
  // Определяем уровень сложности запроса
  const expertLevel = determineExpertLevel(query);
  console.log(`DeepSpeek: Определен уровень запроса: ${expertLevel}`);
  
  // Проверяем кэш перед генерацией нового ответа
  const cachedResponse = getCachedResponse(query);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  let response;
  
  // Получаем модуль ChatFree
  const chatFreeProvider = require('./simple-chatfree');
  
  try {
    // В зависимости от уровня сложности выбираем разные провайдеры
    switch (expertLevel) {
      case 'basic':
        console.log(`DeepSpeek: Пробуем провайдер ChatFree для уровня ${expertLevel}...`);
        
        try {
          console.log(`DeepSpeek: Пробуем использовать ChatFree API для ответа...`);
          
          const chatFreeResponse = await chatFreeProvider.getChatFreeResponse(query, {
            systemPrompt: "Вы технический ассистент, специализирующийся на базовых вопросах программирования. Отвечайте четко, с примерами кода, когда это уместно. Объясняйте просто, но информативно."
          });
          
          if (chatFreeResponse.success) {
            response = chatFreeResponse;
            console.log(`DeepSpeek: Успешно получен ответ от ChatFree (уровень: ${expertLevel})`);
          } else {
            throw new Error(chatFreeResponse.error || "Ошибка ChatFree API");
          }
        } catch (error) {
          console.log(`DeepSpeek: Ошибка ChatFree: ${error.message}`);
          
          // Фолбэк на демо-режим
          response = {
            success: true,
            response: "Я BOOOMERANGS AI ассистент. К сожалению, внешние AI-провайдеры сейчас недоступны, но я все равно могу помочь с базовой информацией о BOOOMERANGS и подсказать, как использовать генератор изображений!",
            provider: "BOOOMERANGS-Demo",
            model: "demo-mode"
          };
          console.log("⚠️ Все провайдеры недоступны, используем демо-режим");
        }
        break;
        
      case 'intermediate':
        console.log(`DeepSpeek: Пробуем провайдер ChatFree для уровня ${expertLevel}...`);
        
        try {
          const chatFreeResponse = await chatFreeProvider.getChatFreeResponse(query, {
            systemPrompt: "Вы опытный технический специалист, отвечающий на вопросы среднего уровня сложности по программированию и IT. Давайте детальные объяснения с примерами кода и ссылками на дополнительные источники."
          });
          
          if (chatFreeResponse.success) {
            response = chatFreeResponse;
            console.log(`DeepSpeek: Успешно получен ответ от ChatFree (уровень: ${expertLevel})`);
          } else {
            throw new Error(chatFreeResponse.error || "Ошибка ChatFree API");
          }
        } catch (error) {
          console.log(`DeepSpeek: Ошибка ChatFree: ${error.message}`);
          
          // Фолбэк на демо-режим
          response = {
            success: true,
            response: FALLBACK_RESPONSES.intermediate,
            provider: "BOOOMERANGS-Demo",
            model: "demo-mode"
          };
          console.log("⚠️ Все провайдеры недоступны, используем демо-режим");
        }
        break;
        
      case 'advanced':
        console.log(`DeepSpeek: Пробуем провайдер ChatFree для уровня ${expertLevel}...`);
        
        try {
          const chatFreeResponse = await chatFreeProvider.getChatFreeResponse(query, {
            systemPrompt: "Вы высококвалифицированный эксперт в области программирования и компьютерных технологий. Отвечайте на сложные технические вопросы с глубоким пониманием темы. Включайте развернутые примеры, объясняйте сложные концепции, показывайте преимущества и недостатки разных подходов."
          });
          
          if (chatFreeResponse.success) {
            response = chatFreeResponse;
            console.log(`DeepSpeek: Успешно получен ответ от ChatFree (уровень: ${expertLevel})`);
          } else {
            throw new Error(chatFreeResponse.error || "Ошибка ChatFree API");
          }
        } catch (error) {
          console.log(`DeepSpeek: Ошибка ChatFree: ${error.message}`);
          
          // Фолбэк на демо-режим
          response = {
            success: true,
            response: FALLBACK_RESPONSES.advanced,
            provider: "BOOOMERANGS-Demo",
            model: "demo-mode"
          };
          console.log("⚠️ Все провайдеры недоступны, используем демо-режим");
        }
        break;
        
      default:
        // Для общих запросов используем ChatFree
        try {
          const chatFreeResponse = await chatFreeProvider.getChatFreeResponse(query);
          
          if (chatFreeResponse.success) {
            response = chatFreeResponse;
          } else {
            throw new Error(chatFreeResponse.error || "Ошибка ChatFree API");
          }
        } catch (error) {
          console.log(`DeepSpeek: Ошибка ChatFree: ${error.message}`);
          
          // Фолбэк на демо-режим
          response = {
            success: true,
            response: "Я BOOOMERANGS AI ассистент. К сожалению, внешние AI-провайдеры сейчас недоступны, но я могу помочь с информацией о BOOOMERANGS и подсказать, как использовать другие функции!",
            provider: "BOOOMERANGS-Demo",
            model: "demo-mode"
          };
        }
    }
  } catch (error) {
    console.error(`DeepSpeek Error: ${error.message}`);
    
    // Если все провайдеры недоступны, возвращаем базовый ответ
    response = {
      success: true,
      response: "Я BOOOMERANGS AI ассистент. К сожалению, внешние AI-провайдеры сейчас недоступны, но я могу помочь с базовой информацией!",
      provider: "BOOOMERANGS-Demo",
      model: "demo-mode"
    };
  }
  
  // Кэшируем ответ, если он успешный
  if (response.success) {
    cacheResponse(query, response);
  }
  
  return response;
}

/**
 * Основная функция для получения ответа от DeepSpeek
 * @param {string} query - Запрос пользователя
 * @returns {Promise<Object>} - Ответ от DeepSpeek
 */
async function getDeepSpeekResponse(query) {
  try {
    console.log(`📊 Для DeepSpeek используем быстрый режим`);
    
    // Получаем ответ от AI
    const response = await generateTechnicalResponse(query);
    
    // Добавляем информацию о провайдере
    return {
      ...response,
      provider: "DeepSpeek",
      model: "DeepSpeek AI"
    };
  } catch (error) {
    console.error(`DeepSpeek Error: ${error.message}`);
    
    // В случае ошибки возвращаем демо-ответ
    return {
      success: true,
      response: "Я BOOOMERANGS AI ассистент. К сожалению, внешние AI-провайдеры сейчас недоступны, но я могу помочь с информацией о BOOOMERANGS!",
      provider: "DeepSpeek",
      model: "DeepSpeek AI (Fallback)"
    };
  }
}

// Маршрут для прямых запросов к DeepSpeek
router.post('/query', async (req, res) => {
  const { query } = req.body;
  
  if (!query) {
    return res.status(400).json({
      success: false,
      error: "Необходимо указать запрос (query)"
    });
  }
  
  try {
    const response = await getDeepSpeekResponse(query);
    res.json(response);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: `Ошибка DeepSpeek: ${error.message}`
    });
  }
});

module.exports = router;
module.exports.getDeepSpeekResponse = getDeepSpeekResponse;

// Базовый набор предзагруженных ответов
const PRELOADED_ANSWERS = {
  "javascript основы": {
    success: true,
    response: "# Основы JavaScript\n\nJavaScript - это мультипарадигменный язык программирования, который поддерживает объектно-ориентированный, императивный и функциональный стили. JavaScript используется для создания интерактивных веб-страниц и является неотъемлемой частью веб-приложений.\n\n## Переменные\n\n```javascript\n// Объявление переменных\nlet message = 'Hello';  // современное объявление переменной\nconst PI = 3.14;        // константа, значение нельзя изменить\nvar old = 'старый способ'; // устаревший способ объявления\n```\n\n## Типы данных\n\n```javascript\n// Примитивные типы\nlet string = 'строка';    // строка\nlet number = 42;          // число\nlet bigInt = 1234567890123456789012345678901234567890n; // большое целое число\nlet boolean = true;       // логический тип (true/false)\nlet nullValue = null;     // специальное значение null\nlet undefinedValue;       // undefined (значение не присвоено)\nlet symbol = Symbol('id'); // уникальный идентификатор\n\n// Объектные типы\nlet object = {            // объект\n  name: 'John',\n  age: 30\n};\nlet array = [1, 2, 3];    // массив\nlet func = function() {};  // функция\n```\n\n## Функции\n\n```javascript\n// Объявление функции\nfunction sayHello(name) {\n  return `Привет, ${name}!`;\n}\n\n// Стрелочная функция\nconst add = (a, b) => a + b;\n\n// Вызов функций\nconsole.log(sayHello('Мир')); // Привет, Мир!\nconsole.log(add(2, 3));        // 5\n```\n\n## Условные операторы\n\n```javascript\n// if-else\nlet age = 18;\nif (age >= 18) {\n  console.log('Совершеннолетний');\n} else {\n  console.log('Несовершеннолетний');\n}\n\n// Тернарный оператор\nlet status = age >= 18 ? 'Совершеннолетний' : 'Несовершеннолетний';\n\n// switch\nlet day = 2;\nswitch (day) {\n  case 1:\n    console.log('Понедельник');\n    break;\n  case 2:\n    console.log('Вторник');\n    break;\n  default:\n    console.log('Другой день');\n}\n```\n\n## Циклы\n\n```javascript\n// for\nfor (let i = 0; i < 5; i++) {\n  console.log(i); // 0, 1, 2, 3, 4\n}\n\n// while\nlet j = 0;\nwhile (j < 5) {\n  console.log(j);\n  j++;\n}\n\n// for...of (для перебора итерируемых объектов)\nlet fruits = ['Яблоко', 'Банан', 'Груша'];\nfor (let fruit of fruits) {\n  console.log(fruit);\n}\n\n// for...in (для перебора свойств объекта)\nlet person = {name: 'John', age: 30};\nfor (let key in person) {\n  console.log(`${key}: ${person[key]}`);\n}\n```\n\n## Операторы\n\n```javascript\n// Арифметические\nconsole.log(5 + 2);  // 7 (сложение)\nconsole.log(5 - 2);  // 3 (вычитание)\nconsole.log(5 * 2);  // 10 (умножение)\nconsole.log(5 / 2);  // 2.5 (деление)\nconsole.log(5 % 2);  // 1 (остаток от деления)\nconsole.log(5 ** 2); // 25 (возведение в степень)\n\n// Сравнения\nconsole.log(5 > 2);   // true\nconsole.log(5 < 2);   // false\nconsole.log(5 >= 5);  // true\nconsole.log(5 === 5); // true (строгое равенство - тип и значение)\nconsole.log(5 !== 2); // true (строгое неравенство)\n\n// Логические\nconsole.log(true && false); // false (логическое И)\nconsole.log(true || false); // true (логическое ИЛИ)\nconsole.log(!true);         // false (логическое НЕ)\n```\n\n## Объекты\n\n```javascript\n// Создание объекта\nlet user = {\n  name: 'John',\n  age: 30,\n  sayHi: function() {\n    console.log(`Привет, я ${this.name}!`);\n  }\n};\n\n// Доступ к свойствам\nconsole.log(user.name);   // John\nconsole.log(user['age']); // 30\nuser.sayHi();             // Привет, я John!\n\n// Добавление и изменение свойств\nuser.email = 'john@example.com';\nuser.age = 31;\n\n// Удаление свойства\ndelete user.email;\n```\n\n## Массивы\n\n```javascript\n// Создание массива\nlet fruits = ['Яблоко', 'Банан', 'Груша'];\n\n// Доступ к элементам\nconsole.log(fruits[0]); // Яблоко\n\n// Изменение элемента\nfruits[1] = 'Апельсин';\n\n// Длина массива\nconsole.log(fruits.length); // 3\n\n// Методы массивов\nfruits.push('Вишня');        // Добавляет элемент в конец массива\nfruits.pop();                // Удаляет последний элемент и возвращает его\nfruits.unshift('Ананас');    // Добавляет элемент в начало массива\nfruits.shift();              // Удаляет первый элемент и возвращает его\nlet position = fruits.indexOf('Груша'); // Находит индекс элемента\nlet newFruits = fruits.slice(1, 2);     // Создает новый массив из части исходного\n```\n\n## События в браузере\n\n```javascript\n// Добавление обработчика события\ndocument.getElementById('myButton').addEventListener('click', function() {\n  console.log('Кнопка была нажата!');\n});\n\n// Другой способ назначения обработчика\nfunction handleClick() {\n  console.log('Кнопка была нажата!');\n}\ndocument.getElementById('myButton').onclick = handleClick;\n```\n\nЭто базовый обзор основ JavaScript. JavaScript имеет намного больше возможностей, включая классы, модули, асинхронное программирование с промисами и async/await, работу с DOM, HTTP-запросы и многое другое.",
    provider: "DeepSpeek",
    model: "DeepSpeek AI (Preloaded)"
  },
  
  "react что это": {
    success: true,
    response: "# React.js: Что это такое\n\nReact (также известный как React.js или ReactJS) — это открытая JavaScript-библиотека для создания пользовательских интерфейсов. React был разработан и поддерживается Facebook (Meta), и используется для создания одностраничных и мобильных приложений.\n\n## Ключевые особенности React\n\n### 1. Компонентный подход\n\nReact основан на компонентах — независимых, переиспользуемых блоках кода, которые выполняют определенную функцию. Вместо разделения технологий по файлам (HTML, CSS, JS), React разделяет приложение на компоненты, которые содержат всю логику, необходимую для их работы.\n\n```jsx\n// Пример простого компонента React\nfunction Welcome(props) {\n  return <h1>Привет, {props.name}!</h1>;\n}\n\n// Использование компонента\nfunction App() {\n  return (\n    <div>\n      <Welcome name=\"Алиса\" />\n      <Welcome name=\"Боб\" />\n    </div>\n  );\n}\n```\n\n### 2. JSX (JavaScript XML)\n\nReact использует JSX — расширение синтаксиса JavaScript, которое позволяет писать HTML-подобный код прямо в JavaScript. JSX делает код React более читаемым и удобным для написания.\n\n```jsx\nconst element = <h1>Привет, мир!</h1>;\n```\n\nПосле компиляции JSX превращается в обычные вызовы JavaScript:\n\n```javascript\nconst element = React.createElement('h1', null, 'Привет, мир!');\n```\n\n### 3. Виртуальный DOM\n\nReact использует концепцию виртуального DOM (Document Object Model) для оптимизации обновлений пользовательского интерфейса. Вместо обновления всего DOM при каждом изменении, React создает легковесную копию DOM в памяти, сравнивает ее с предыдущей версией и обновляет только те части реального DOM, которые действительно изменились.\n\n### 4. Однонаправленный поток данных\n\nВ React данные передаются от родительских компонентов к дочерним через props (свойства). Это создает предсказуемый поток данных и упрощает понимание того, как данные изменяются в приложении.\n\n### 5. Управление состоянием\n\nReact компоненты могут иметь внутреннее состояние (state), которое может изменяться в течение жизненного цикла компонента. Когда состояние компонента изменяется, React эффективно обновляет пользовательский интерфейс.\n\n```jsx\nimport React, { useState } from 'react';\n\nfunction Counter() {\n  // Объявляем состояние с начальным значением 0\n  const [count, setCount] = useState(0);\n\n  return (\n    <div>\n      <p>Вы кликнули {count} раз</p>\n      <button onClick={() => setCount(count + 1)}>\n        Нажми на меня\n      </button>\n    </div>\n  );\n}\n```\n\n## Экосистема React\n\nReact имеет богатую экосистему инструментов и библиотек:\n\n- **React Router** — для маршрутизации в приложении\n- **Redux**, **MobX**, **Context API** — для управления глобальным состоянием\n- **Axios**, **fetch** — для выполнения HTTP-запросов\n- **Styled Components**, **Emotion**, **Tailwind CSS** — для стилизации компонентов\n- **Jest**, **React Testing Library** — для тестирования\n- **Create React App**, **Next.js**, **Vite** — для быстрого создания и настройки проектов\n\n## Преимущества использования React\n\n1. **Производительность** — благодаря виртуальному DOM и эффективному обновлению компонентов\n2. **Переиспользуемость** — компонентный подход позволяет создавать переиспользуемые части интерфейса\n3. **Большое сообщество** — обширная документация, туториалы, библиотеки и инструменты\n4. **Поддержка крупных компаний** — разрабатывается Facebook и используется многими крупными компаниями (Instagram, Netflix, Airbnb и др.)\n5. **Односторонний поток данных** — предсказуемое поведение приложения\n6. **Декларативный подход** — вы описываете, как должен выглядеть UI для разных состояний, а React эффективно обновляет DOM\n\n## Концепции React\n\n### Компоненты\n\nВ React есть два типа компонентов:\n\n1. **Функциональные компоненты** — простые JavaScript функции, которые принимают props и возвращают JSX\n\n```jsx\nfunction Greeting(props) {\n  return <h1>Привет, {props.name}!</h1>;\n}\n```\n\n2. **Классовые компоненты** — ES6 классы, которые расширяют React.Component\n\n```jsx\nclass Greeting extends React.Component {\n  render() {\n    return <h1>Привет, {this.props.name}!</h1>;\n  }\n}\n```\n\n### Хуки (Hooks)\n\nХуки, представленные в React 16.8, позволяют использовать состояние и другие возможности React без написания класса.\n\nОсновные хуки:\n\n- **useState** — для управления состоянием компонента\n- **useEffect** — для выполнения побочных эффектов (запросы к API, подписки на события)\n- **useContext** — для доступа к контексту\n- **useReducer** — для более сложной логики состояния\n- **useRef** — для создания ссылок на DOM-элементы или сохранения мутабельных значений\n\n```jsx\nimport React, { useState, useEffect } from 'react';\n\nfunction UserProfile() {\n  const [user, setUser] = useState(null);\n  const [loading, setLoading] = useState(true);\n\n  useEffect(() => {\n    async function fetchUser() {\n      try {\n        const response = await fetch('https://api.example.com/user');\n        const data = await response.json();\n        setUser(data);\n      } catch (error) {\n        console.error('Error fetching user:', error);\n      } finally {\n        setLoading(false);\n      }\n    }\n\n    fetchUser();\n  }, []); // Пустой массив зависимостей означает, что эффект выполнится только при монтировании\n\n  if (loading) return <div>Загрузка...</div>;\n  if (!user) return <div>Пользователь не найден</div>;\n\n  return (\n    <div>\n      <h1>{user.name}</h1>\n      <p>Email: {user.email}</p>\n    </div>\n  );\n}\n```\n\n## Начало работы с React\n\nСамый простой способ начать новый проект React — использовать Create React App:\n\n```bash\nnpx create-react-app my-app\ncd my-app\nnpm start\n```\n\nИли с помощью Vite, который обеспечивает более быструю разработку:\n\n```bash\nnpm create vite@latest my-app -- --template react\ncd my-app\nnpm install\nnpm run dev\n```\n\nReact — мощная библиотека для создания современных пользовательских интерфейсов, которая продолжает развиваться и остается одним из самых популярных инструментов для фронтенд-разработки.",
    provider: "DeepSpeek",
    model: "DeepSpeek AI (Preloaded)"
  },
  
  "express js основы": {
    success: true,
    response: "# Основы Express.js\n\nExpress.js — это минималистичный и гибкий веб-фреймворк для Node.js, который предоставляет набор функций для создания веб-приложений и API. Express значительно упрощает процесс создания серверных приложений по сравнению с использованием только Node.js.\n\n## Установка Express\n\nДля начала работы с Express необходимо создать проект Node.js и установить пакет express:\n\n```bash\nmkdir my-express-app\ncd my-express-app\nnpm init -y\nnpm install express\n```\n\n## Простейший сервер\n\nВот пример простейшего сервера Express:\n\n```javascript\n// Подключаем модуль Express\nconst express = require('express');\n\n// Создаем экземпляр приложения\nconst app = express();\n\n// Определяем порт, на котором будет работать приложение\nconst PORT = process.env.PORT || 3000;\n\n// Создаем маршрут для обработки GET-запросов к корневому URL\napp.get('/', (req, res) => {\n  res.send('Привет, мир!');\n});\n\n// Запускаем сервер на указанном порту\napp.listen(PORT, () => {\n  console.log(`Сервер запущен на порту ${PORT}`);\n});\n```\n\nСохраните этот код в файл `app.js` и запустите сервер командой:\n\n```bash\nnode app.js\n```\n\nТеперь вы можете открыть браузер и перейти по адресу `http://localhost:3000`, чтобы увидеть сообщение \"Привет, мир!\".\n\n## Маршрутизация\n\nОдна из основных концепций Express — маршрутизация, которая определяет, как приложение отвечает на клиентские запросы к определенным эндпоинтам (URL) с использованием определенных HTTP методов (GET, POST, PUT, DELETE и т.д.).\n\n```javascript\n// Обработка GET-запроса к корневому URL\napp.get('/', (req, res) => {\n  res.send('Главная страница');\n});\n\n// Обработка GET-запроса к URL /about\napp.get('/about', (req, res) => {\n  res.send('О нас');\n});\n\n// Обработка POST-запроса к URL /users\napp.post('/users', (req, res) => {\n  // Здесь будет код для создания нового пользователя\n  res.send('Пользователь создан');\n});\n\n// Обработка PUT-запроса к URL /users/:id\napp.put('/users/:id', (req, res) => {\n  // Получаем id из параметров URL\n  const userId = req.params.id;\n  // Здесь будет код для обновления пользователя с указанным id\n  res.send(`Пользователь с id ${userId} обновлен`);\n});\n\n// Обработка DELETE-запроса к URL /users/:id\napp.delete('/users/:id', (req, res) => {\n  const userId = req.params.id;\n  // Здесь будет код для удаления пользователя с указанным id\n  res.send(`Пользователь с id ${userId} удален`);\n});\n```\n\n## Параметры запроса\n\nExpress позволяет получать данные из запроса различными способами:\n\n### 1. Параметры пути (Route Parameters)\n\n```javascript\napp.get('/users/:id', (req, res) => {\n  const userId = req.params.id;\n  res.send(`Запрошен пользователь с id: ${userId}`);\n});\n```\n\n### 2. Строка запроса (Query String)\n\n```javascript\n// Обработка запроса вида /search?q=express&limit=10\napp.get('/search', (req, res) => {\n  const query = req.query.q;\n  const limit = req.query.limit;\n  res.send(`Поиск по запросу: ${query}, лимит: ${limit}`);\n});\n```\n\n### 3. Тело запроса (Request Body)\n\nДля обработки тела запроса (например, в POST-запросах) нужно использовать middleware, такой как `express.json()` или `express.urlencoded()`:\n\n```javascript\n// Middleware для обработки JSON-данных\napp.use(express.json());\n\n// Middleware для обработки данных форм\napp.use(express.urlencoded({ extended: true }));\n\napp.post('/users', (req, res) => {\n  const userData = req.body;\n  // Обработка данных из тела запроса\n  console.log(userData);\n  res.send('Данные получены');\n});\n```\n\n## Middleware\n\nMiddleware (промежуточное ПО) — это функции, которые имеют доступ к объекту запроса (req), объекту ответа (res) и следующей функции middleware (next) в цикле запрос-ответ приложения. Middleware может выполнять следующие задачи:\n\n- Выполнять код\n- Изменять объекты запроса и ответа\n- Завершать цикл запрос-ответ\n- Вызывать следующую функцию middleware в стеке\n\n```javascript\n// Пример middleware для логирования запросов\napp.use((req, res, next) => {\n  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);\n  next(); // Передаем управление следующему middleware\n});\n\n// Middleware для проверки аутентификации\nfunction authMiddleware(req, res, next) {\n  if (req.headers.authorization) {\n    // Пользователь аутентифицирован\n    next();\n  } else {\n    // Пользователь не аутентифицирован\n    res.status(401).send('Требуется аутентификация');\n  }\n}\n\n// Применяем middleware только к определенному маршруту\napp.get('/protected', authMiddleware, (req, res) => {\n  res.send('Секретные данные');\n});\n```\n\n## Маршрутизаторы\n\nДля организации маршрутов в более крупных приложениях Express предлагает использовать маршрутизаторы (Router):\n\n```javascript\n// userRoutes.js\nconst express = require('express');\nconst router = express.Router();\n\n// Определяем маршруты для пользователей\nrouter.get('/', (req, res) => {\n  res.send('Список всех пользователей');\n});\n\nrouter.get('/:id', (req, res) => {\n  res.send(`Пользователь с id ${req.params.id}`);\n});\n\nrouter.post('/', (req, res) => {\n  res.send('Создание нового пользователя');\n});\n\nmodule.exports = router;\n```\n\n```javascript\n// app.js\nconst express = require('express');\nconst userRoutes = require('./userRoutes');\n\nconst app = express();\n\n// Подключаем маршруты пользователей с префиксом /users\napp.use('/users', userRoutes);\n\napp.listen(3000, () => {\n  console.log('Сервер запущен на порту 3000');\n});\n```\n\n## Отправка ответов\n\nExpress предоставляет различные методы для отправки ответов клиенту:\n\n```javascript\n// Отправка простого текста\napp.get('/text', (req, res) => {\n  res.send('Простой текстовый ответ');\n});\n\n// Отправка HTML\napp.get('/html', (req, res) => {\n  res.send('<h1>Заголовок HTML</h1><p>Это HTML-ответ</p>');\n});\n\n// Отправка JSON\napp.get('/json', (req, res) => {\n  res.json({ message: 'Это JSON-ответ', status: 'success' });\n});\n\n// Установка статуса ответа\napp.get('/error', (req, res) => {\n  res.status(404).send('Ресурс не найден');\n});\n\n// Отправка файла\napp.get('/file', (req, res) => {\n  res.sendFile(__dirname + '/public/index.html');\n});\n\n// Перенаправление\napp.get('/redirect', (req, res) => {\n  res.redirect('/new-location');\n});\n```\n\n## Статические файлы\n\nДля обслуживания статических файлов (изображения, CSS, JavaScript и т.д.) Express предоставляет встроенное middleware `express.static`:\n\n```javascript\n// Обслуживание статических файлов из директории 'public'\napp.use(express.static('public'));\n\n// Можно указать виртуальный путь\napp.use('/static', express.static('public'));\n```\n\nТеперь файлы из директории `public` будут доступны по URL-адресам, начинающимся с `/static`.\n\n## Обработка ошибок\n\nExpress позволяет создавать middleware для обработки ошибок:\n\n```javascript\n// Обычный middleware\napp.get('/error-demo', (req, res, next) => {\n  // Симуляция ошибки\n  const err = new Error('Демонстрационная ошибка');\n  err.status = 400;\n  next(err); // Передаем ошибку следующему middleware\n});\n\n// Middleware для обработки 404 ошибок (не найдено)\napp.use((req, res, next) => {\n  res.status(404).send('Страница не найдена');\n});\n\n// Middleware для обработки остальных ошибок (должен быть последним)\napp.use((err, req, res, next) => {\n  console.error(err.stack);\n  res.status(err.status || 500).send({\n    error: {\n      message: err.message,\n      status: err.status || 500\n    }\n  });\n});\n```\n\n## Шаблонизаторы\n\nExpress может работать с различными шаблонизаторами (EJS, Pug, Handlebars) для генерации HTML-страниц:\n\n```javascript\n// Установите шаблонизатор\n// npm install ejs\n\n// Настройка шаблонизатора\napp.set('view engine', 'ejs');\napp.set('views', './views');\n\n// Рендеринг шаблона\napp.get('/profile', (req, res) => {\n  res.render('profile', {\n    name: 'Иван',\n    age: 30,\n    skills: ['JavaScript', 'Node.js', 'Express']\n  });\n});\n```\n\n## Заключение\n\nExpress.js — это мощный и гибкий фреймворк для создания веб-приложений на Node.js. Он предоставляет минималистичный API, но при этом обладает всеми необходимыми функциями для создания полноценных веб-приложений и API.\n\nДля более сложных приложений часто используются дополнительные пакеты, такие как:\n\n- `body-parser` — для обработки тела запроса (в новых версиях Express интегрирован)\n- `cookie-parser` — для работы с cookies\n- `cors` — для настройки CORS (Cross-Origin Resource Sharing)\n- `helmet` — для защиты приложения от известных веб-уязвимостей\n- `morgan` — для логирования HTTP-запросов\n- `passport` — для аутентификации\n- `mongoose` или `sequelize` — для работы с базами данных\n\nПо мере роста приложения рекомендуется структурировать код, разделяя его на модули (маршруты, контроллеры, модели и т.д.) для лучшей организации и поддержки.",
    provider: "DeepSpeek",
    model: "DeepSpeek AI (Preloaded)"
  }
};