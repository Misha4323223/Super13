/**
 * Семантический анализатор запросов
 * Понимает скрытые намерения и смысловые связи в тексте пользователя
 */

const SmartLogger = {
  semantic: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`🔬 [${timestamp}] SEMANTIC ANALYZER: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

/**
 * Анализатор семантических связей
 */
class SemanticAnalyzer {
  constructor() {
    this.initializeKnowledgeBase();
  }

  initializeKnowledgeBase() {
    // Семантические кластеры связанных понятий
    this.semanticClusters = {
      branding: {
        core: ['логотип', 'бренд', 'фирменный стиль', 'айдентика'],
        related: ['визитка', 'фирменные цвета', 'шрифт', 'слоган', 'эмблема'],
        implications: ['масштабируемость', 'узнаваемость', 'профессионализм'],
        typical_next_steps: ['векторизация', 'цветовые варианты', 'монохромная версия', 'применение на носителях']
      },

      image_creation: {
        core: ['создай изображение', 'нарисуй', 'создай принт', 'создай логотип', 'создай дизайн', 'сгенерируй'],
        related: ['картинка', 'рисунок', 'фото', 'иллюстрация', 'арт', 'панда', 'кибер', 'персонаж', 'животное', 'робот', 'техно', 'футуристический'],
        implications: ['визуализация', 'творчество', 'стилизация'],
        typical_next_steps: ['выбор стиля', 'детализация', 'цветокоррекция', 'оптимизация'],
        exclusions: ['создать бизнес', 'создать компанию', 'можешь создавать', 'умеешь создавать', 'что ты можешь создавать']
      },

      apparel_design: {
        core: ['принт', 'футболка', 'одежда', 'тишарт'],
        related: ['печать', 'ткань', 'краски', 'размер', 'позиционирование'],
        implications: ['читаемость на расстоянии', 'долговечность печати', 'простота форм'],
        typical_next_steps: ['оптимизация для печати', 'адаптация размеров', 'цветокоррекция']
      },

      embroidery_design: {
        core: ['вышивка', 'машинная вышивка', 'dst', 'pes', 'jef'],
        related: ['нитки', 'плотность', 'стежки', 'детализация'],
        implications: ['ограничение мелких деталей', 'максимум 15 цветов', 'толщина линий'],
        typical_next_steps: ['упрощение деталей', 'конвертация в формат вышивки', 'подбор ниток']
      },

      character_design: {
        core: ['персонаж', 'герой', 'character', 'mascot'],
        related: ['эмоции', 'позы', 'выражения', 'стиль', 'пропорции'],
        implications: ['узнаваемость', 'эмоциональная связь', 'масштабируемость использования'],
        typical_next_steps: ['вариации эмоций', 'разные позы', 'стилизация']
      },

      signage_design: {
        core: ['вывеска', 'баннер', 'указатель', 'реклама'],
        related: ['читаемость', 'контрастность', 'размер шрифта', 'расстояние просмотра'],
        implications: ['видимость издалека', 'погодная стойкость', 'простота восприятия'],
        typical_next_steps: ['увеличение контрастности', 'упрощение деталей', 'векторизация']
      },

      knowledge_request: {
        core: [
          // История и события
          'история', 'историю', 'исторический', 'исторические', 'событие', 'события', 'эпоха', 'период', 'век', 'война', 'революция', 'битва',
          // Страны и география
          'страна', 'страну', 'государство', 'город', 'столица', 'география', 'континент', 'океан', 'море', 'горы', 'река', 'климат',
          // Наука и технологии
          'наука', 'научный', 'исследование', 'открытие', 'изобретение', 'технология', 'физика', 'химия', 'биология', 'математика', 'астрономия',
          // Космос и планеты
          'космос', 'вселенная', 'планета', 'земля', 'солнце', 'луна', 'звезды', 'галактика', 'гравитация', 'орбита', 'атмосфера', 'телескоп',
          // Культура и искусство
          'культура', 'искусство', 'литература', 'музыка', 'живопись', 'архитектура', 'театр', 'кино', 'традиции', 'обычаи',
          // Образование и обучение
          'образование', 'обучение', 'учеба', 'школа', 'университет', 'знания', 'изучение', 'предмет', 'дисциплина',
          // Медицина и здоровье
          'медицина', 'здоровье', 'лечение', 'болезнь', 'симптомы', 'диагноз', 'врач', 'больница', 'препарат',
          // Экономика и бизнес (информационные)
          'экономика', 'экономический', 'рынок', 'финансы', 'инвестиции', 'валюта', 'банк', 'торговля', 'промышленность',
          // Политика и общество
          'политика', 'политический', 'правительство', 'президент', 'парламент', 'выборы', 'партия', 'закон', 'право',
          // Природа и экология
          'природа', 'экология', 'животные', 'растения', 'лес', 'окружающая среда', 'заповедник', 'вымирание', 'эволюция',
          // Спорт и развлечения
          'спорт', 'спортивный', 'игра', 'соревнование', 'олимпиада', 'чемпионат', 'команда', 'тренер', 'рекорд'
        ],
        related: [
          // Вопросительные слова и фразы
          'что такое', 'что это', 'кто такой', 'кто это', 'когда было', 'когда произошло', 'где находится', 'где происходило',
          'как происходит', 'как работает', 'почему', 'зачем', 'для чего', 'каким образом', 'по какой причине',
          // Запросы на информацию
          'расскажи про', 'расскажи о', 'расскажи об', 'объясни', 'опиши', 'поясни', 'информация о', 'сведения о',
          'данные о', 'факты о', 'подробности о', 'детали о', 'характеристики', 'особенности', 'свойства',
          // Познавательные запросы
          'интересно узнать', 'хочу знать', 'любопытно', 'познавательно', 'изучаю', 'исследую', 'интересуюсь',
          'увлекаюсь', 'занимаюсь', 'изучением', 'анализом', 'пониманием', 'освоением',
          // Образовательные термины
          'определение', 'понятие', 'термин', 'значение', 'смысл', 'суть', 'принцип', 'механизм', 'процесс',
          'система', 'структура', 'классификация', 'типы', 'виды', 'категории', 'группы',
          // Временные и пространственные маркеры
          'древний', 'современный', 'прошлое', 'настоящее', 'будущее', 'эра', 'время', 'дата', 'год',
          'место', 'регион', 'территория', 'область', 'зона', 'местность', 'локация',
          // Сравнительные запросы
          'сравни', 'сравнение', 'различие', 'отличие', 'разница', 'сходство', 'общее', 'похожее',
          'аналогия', 'противоположность', 'контраст', 'параллель', 'связь', 'взаимосвязь',
          // Причинно-следственные связи
          'причина', 'следствие', 'результат', 'последствие', 'влияние', 'воздействие', 'эффект',
          'фактор', 'условие', 'предпосылка', 'основание', 'мотив', 'стимул', 'импульс'
        ],
        implications: [
          'потребность в достоверной информации', 'образовательный интерес', 'расширение кругозора',
          'углубление знаний', 'академическое изучение', 'профессиональный интерес',
          'исследовательская деятельность', 'подготовка к экзаменам', 'написание работы',
          'удовлетворение любознательности', 'развитие эрудиции', 'формирование мировоззрения'
        ],
        typical_next_steps: [
          'предоставить структурированную информацию', 'дать развернутое объяснение',
          'привести конкретные примеры', 'указать источники для дополнительного изучения',
          'предложить смежные темы для изучения', 'дать практические рекомендации',
          'структурировать информацию по категориям', 'предоставить хронологию событий',
          'объяснить причинно-следственные связи', 'дать сравнительный анализ'
        ]
      },

      conversation: {
        core: ['привет', 'здравствуй', 'можешь', 'умеешь', 'что ты', 'помнишь', 'анализ'],
        related: ['создать бизнес', 'создать компанию', 'можешь создавать', 'умеешь создавать', 'функции', 'возможности', 'как работаешь'],
        implications: ['информационный запрос', 'обычное общение', 'вопрос о возможностях'],
        typical_next_steps: ['предоставить информацию', 'объяснить возможности', 'продолжить диалог']
      },

      greeting: {
        core: ['привет', 'здравствуй', 'здравствуйте', 'хай', 'hi', 'hello', 'добро пожаловать'],
        related: ['как дела', 'как поживаешь', 'как ты', 'доброе утро', 'добрый день', 'добрый вечер'],
        implications: ['начало диалога', 'установление контакта', 'дружелюбное общение'],
        typical_next_steps: ['ответить на приветствие', 'представиться', 'предложить помощь']
      },

      identity_question: {
        core: ['кто ты', 'что ты', 'как тебя зовут', 'твое имя', 'who are you'],
        related: ['расскажи о себе', 'что умеешь', 'твои возможности', 'функции', 'предназначение'],
        implications: ['знакомство', 'изучение возможностей', 'первичный контакт'],
        typical_next_steps: ['представиться', 'рассказать о возможностях', 'показать примеры']
      },

      casual_chat: {
        core: ['как дела', 'что делаешь', 'что нового', 'как жизнь', 'что происходит'],
        related: ['все хорошо', 'нормально', 'отлично', 'плохо', 'устал', 'работаю'],
        implications: ['неформальное общение', 'поддержание беседы', 'интерес к состоянию'],
        typical_next_steps: ['ответить дружелюбно', 'поинтересоваться делами пользователя', 'предложить помощь']
      },

      simple_questions: {
        core: ['что', 'где', 'когда', 'как', 'почему', 'зачем'],
        related: ['объясни', 'расскажи', 'покажи', 'помоги', 'не понимаю', 'уточни'],
        implications: ['потребность в информации', 'желание понять', 'просьба о помощи'],
        typical_next_steps: ['дать четкий ответ', 'привести примеры', 'предложить дополнительную помощь']
      },

      // 📚 ОБРАЗОВАТЕЛЬНОЕ НАПРАВЛЕНИЕ
      educational_teaching: {
        core: [
          'объясни', 'разъясни', 'поясни', 'покажи как', 'научи', 'обучи', 'расскажи как',
          'объяснение', 'концепция', 'теория', 'принцип', 'механизм', 'суть', 'основы',
          'урок', 'лекция', 'семинар', 'материал', 'курс', 'программа обучения',
          'учебный материал', 'методика', 'педагогика', 'дидактика'
        ],
        related: [
          'понятно', 'доступно', 'простыми словами', 'для начинающих', 'пошагово',
          'примеры', 'практика', 'упражнения', 'задания', 'тесты', 'проверка знаний',
          'интерактивный', 'наглядно', 'визуально', 'схема', 'диаграмма'
        ],
        implications: [
          'потребность в структурированном обучении', 'желание понять сложные концепции',
          'необходимость практических примеров', 'интерактивное взаимодействие'
        ],
        typical_next_steps: [
          'создать структурированный урок', 'привести практические примеры',
          'предложить упражнения', 'создать интерактивные материалы',
          'разработать систему проверки знаний'
        ]
      },

      educational_content_creation: {
        core: [
          'создай урок', 'разработай курс', 'составь план', 'создай материал',
          'учебный план', 'программа', 'методичка', 'пособие', 'руководство',
          'конспект', 'презентация', 'слайды', 'лекционный материал'
        ],
        related: [
          'интерактивный урок', 'практические задания', 'тестирование',
          'визуальные материалы', 'мультимедиа', 'инфографика',
          'структурированно', 'логически', 'последовательно'
        ],
        implications: [
          'создание образовательного контента', 'структурирование знаний',
          'адаптация под целевую аудиторию', 'интеграция интерактивных элементов'
        ],
        typical_next_steps: [
          'определить цели обучения', 'структурировать материал',
          'создать практические задания', 'разработать систему оценки'
        ]
      },

      knowledge_testing: {
        core: [
          'проверь знания', 'тест', 'экзамен', 'контроль', 'оценка',
          'викторина', 'опрос', 'задачи', 'упражнения', 'практика',
          'самопроверка', 'диагностика', 'мониторинг прогресса'
        ],
        related: [
          'правильный ответ', 'неправильно', 'ошибка', 'исправление',
          'балл', 'оценка', 'результат', 'статистика', 'прогресс',
          'сложность', 'уровень', 'адаптивный'
        ],
        implications: [
          'оценка уровня знаний', 'выявление пробелов',
          'персонализированное обучение', 'мотивация к обучению'
        ],
        typical_next_steps: [
          'создать адаптивные тесты', 'анализировать результаты',
          'предложить дополнительные материалы', 'отслеживать прогресс'
        ]
      },

      // 📊 АНАЛИТИЧЕСКОЕ НАПРАВЛЕНИЕ
      data_analysis: {
        core: [
          'анализ данных', 'аналитика', 'статистика', 'метрики', 'показатели',
          'данные', 'информация', 'цифры', 'таблица', 'график', 'диаграмма',
          'тренды', 'закономерности', 'паттерны', 'корреляция', 'зависимость',
          'исследование', 'изучение', 'обработка данных'
        ],
        related: [
          'excel', 'csv', 'база данных', 'sql', 'python', 'r',
          'визуализация', 'дашборд', 'отчет', 'презентация',
          'insights', 'выводы', 'рекомендации', 'прогноз'
        ],
        implications: [
          'потребность в обработке больших объемов данных',
          'необходимость выявления закономерностей',
          'создание наглядных отчетов', 'принятие обоснованных решений'
        ],
        typical_next_steps: [
          'структурировать данные', 'провести статистический анализ',
          'создать визуализации', 'сформулировать выводы'
        ]
      },

      business_analytics: {
        core: [
          'бизнес-анализ', 'консультация', 'стратегия', 'планирование',
          'kpi', 'roi', 'эффективность', 'прибыльность', 'рентабельность',
          'конкуренты', 'рынок', 'сегментация', 'целевая аудитория',
          'swot', 'pestel', 'анализ рисков'
        ],
        related: [
          'финансовый анализ', 'маркетинговый анализ', 'операционный анализ',
          'прогнозирование', 'планирование', 'оптимизация',
          'решения', 'рекомендации', 'стратегические инициативы'
        ],
        implications: [
          'принятие бизнес-решений', 'оптимизация процессов',
          'повышение эффективности', 'снижение рисков'
        ],
        typical_next_steps: [
          'провести комплексный анализ', 'выявить возможности роста',
          'разработать план действий', 'создать систему мониторинга'
        ]
      },

      report_creation: {
        core: [
          'отчет', 'доклад', 'презентация', 'сводка', 'резюме',
          'документ', 'аналитическая записка', 'меморандум',
          'исследование', 'обзор', 'анализ', 'заключение'
        ],
        related: [
          'структура', 'оформление', 'таблицы', 'графики',
          'executive summary', 'ключевые выводы', 'рекомендации',
          'приложения', 'источники', 'методология'
        ],
        implications: [
          'профессиональное представление данных',
          'структурированная подача информации',
          'обоснование решений', 'коммуникация с руководством'
        ],
        typical_next_steps: [
          'определить структуру отчета', 'собрать данные',
          'создать визуализации', 'сформулировать выводы'
        ]
      },

      // 💻 ПРОГРАММИСТСКОЕ НАПРАВЛЕНИЕ
      code_writing: {
        core: [
          'написать код', 'код', 'программа', 'скрипт', 'функция',
          'алгоритм', 'логика', 'реализация', 'разработка',
          'python', 'javascript', 'java', 'c++', 'php', 'sql',
          'html', 'css', 'react', 'node.js', 'api'
        ],
        related: [
          'синтаксис', 'библиотека', 'фреймворк', 'модуль',
          'переменная', 'цикл', 'условие', 'массив', 'объект',
          'класс', 'метод', 'свойство', 'наследование'
        ],
        implications: [
          'создание функционального кода', 'соблюдение best practices',
          'оптимизация производительности', 'читаемость кода'
        ],
        typical_next_steps: [
          'проанализировать требования', 'выбрать подходящий подход',
          'написать чистый код', 'добавить комментарии'
        ]
      },

      debugging: {
        core: [
          'отладка', 'баг', 'ошибка', 'исправить', 'починить',
          'debug', 'error', 'exception', 'traceback', 'stack trace',
          'не работает', 'проблема', 'сломалось', 'глючит'
        ],
        related: [
          'логирование', 'тестирование', 'breakpoint', 'console.log',
          'проверка', 'валидация', 'unit test', 'integration test',
          'профилирование', 'оптимизация', 'рефакторинг'
        ],
        implications: [
          'поиск и устранение ошибок', 'улучшение стабильности',
          'оптимизация производительности', 'повышение качества кода'
        ],
        typical_next_steps: [
          'проанализировать ошибку', 'воспроизвести проблему',
          'найти root cause', 'исправить и протестировать'
        ]
      },

      architecture_design: {
        core: [
          'архитектура', 'дизайн системы', 'проектирование',
          'паттерны', 'структура', 'компоненты', 'модули',
          'микросервисы', 'монолит', 'api design', 'database design',
          'scalability', 'performance', 'security'
        ],
        related: [
          'mvc', 'mvp', 'solid', 'dry', 'kiss', 'yagni',
          'dependency injection', 'observer pattern', 'factory pattern',
          'load balancing', 'caching', 'database optimization'
        ],
        implications: [
          'создание масштабируемых решений', 'обеспечение производительности',
          'поддерживаемость кода', 'безопасность системы'
        ],
        typical_next_steps: [
          'проанализировать требования', 'выбрать подходящие паттерны',
          'спроектировать компоненты', 'создать техническую документацию'
        ]
      },

      code_review: {
        core: [
          'code review', 'ревью кода', 'проверка кода', 'анализ кода',
          'качество кода', 'стандарты', 'conventions', 'best practices',
          'рефакторинг', 'оптимизация', 'читаемость', 'maintainability'
        ],
        related: [
          'комментарии', 'документация', 'тестирование', 'безопасность',
          'производительность', 'memory leaks', 'code smells',
          'pull request', 'merge request', 'git'
        ],
        implications: [
          'повышение качества кода', 'обучение команды',
          'предотвращение ошибок', 'соблюдение стандартов'
        ],
        typical_next_steps: [
          'проверить логику', 'оценить читаемость',
          'найти потенциальные проблемы', 'дать конструктивную обратную связь'
        ]
      },

      // ✍️ КОНТЕНТНОЕ НАПРАВЛЕНИЕ
      copywriting: {
        core: [
          'копирайтинг', 'текст', 'контент', 'статья', 'пост',
          'реклама', 'продающий текст', 'коммерческий текст',
          'заголовок', 'слоган', 'призыв к действию', 'cta',
          'маркетинговый текст', 'промо текст'
        ],
        related: [
          'целевая аудитория', 'боли клиента', 'выгоды',
          'уникальное торговое предложение', 'usp', 'триггеры',
          'эмоции', 'убеждение', 'конверсия', 'продажи'
        ],
        implications: [
          'привлечение внимания', 'убеждение клиентов',
          'повышение конверсии', 'укрепление бренда'
        ],
        typical_next_steps: [
          'изучить целевую аудиторию', 'определить ключевые сообщения',
          'создать цепляющие заголовки', 'добавить сильные CTA'
        ]
      },

      content_creation: {
        core: [
          'создание контента', 'контент план', 'редакторский календарь',
          'блог', 'статьи', 'посты', 'публикации', 'материалы',
          'seo текст', 'оптимизация', 'ключевые слова'
        ],
        related: [
          'тема', 'идея', 'концепция', 'формат', 'стиль',
          'tone of voice', 'brand voice', 'аудитория',
          'engagement', 'вирусность', 'shareability'
        ],
        implications: [
          'регулярная публикация качественного контента',
          'повышение узнаваемости бренда', 'привлечение аудитории'
        ],
        typical_next_steps: [
          'разработать контент-стратегию', 'создать редакторский календарь',
          'определить форматы контента', 'настроить процессы производства'
        ]
      },

      social_media: {
        core: [
          'социальные сети', 'смм', 'social media', 'инстаграм', 'фейсбук',
          'вконтакте', 'телеграм', 'тiktok', 'youtube', 'linkedin',
          'посты', 'сторис', 'reels', 'видео', 'фото'
        ],
        related: [
          'хештеги', 'таргетинг', 'реклама', 'продвижение',
          'вовлечение', 'охват', 'impressions', 'клики',
          'подписчики', 'лайки', 'комментарии', 'репосты'
        ],
        implications: [
          'продвижение бренда в социальных сетях',
          'взаимодействие с аудиторией', 'повышение лояльности'
        ],
        typical_next_steps: [
          'выбрать подходящие платформы', 'создать контент-план',
          'адаптировать контент под формат', 'настроить аналитику'
        ]
      },

      marketing_content: {
        core: [
          'маркетинговый контент', 'промо материалы', 'рекламные тексты',
          'landing page', 'email рассылка', 'презентация продукта',
          'case study', 'white paper', 'lead magnet'
        ],
        related: [
          'воронка продаж', 'лидогенерация', 'конверсия',
          'retention', 'customer journey', 'touchpoints',
          'персонализация', 'сегментация', 'ab testing'
        ],
        implications: [
          'привлечение и удержание клиентов',
          'повышение продаж', 'укрепление позиции бренда'
        ],
        typical_next_steps: [
          'определить этапы воронки', 'создать материалы для каждого этапа',
          'настроить аналитику', 'оптимизировать конверсию'
        ]
      }
    };

    // Паттерны намерений
    this.intentionPatterns = {
      continuation: {
        patterns: ['теперь', 'а теперь', 'сделай его', 'измени его', 'добавь к нему', 'и еще'],
        confidence: 0.9,
        type: 'modify_existing'
      },

      new_project: {
        patterns: ['создай новый', 'другой', 'еще один', 'давай сделаем', 'хочу создать'],
        confidence: 0.85,
        type: 'create_new'
      },

      improvement: {
        patterns: ['улучши', 'сделай лучше', 'доработай', 'оптимизируй', 'исправь'],
        confidence: 0.8,
        type: 'enhance_existing'
      },

      variation: {
        patterns: ['вариант', 'версия', 'альтернатива', 'по-другому', 'в другом стиле'],
        confidence: 0.75,
        type: 'create_variation'
      },

      format_conversion: {
        patterns: ['векторизуй', 'в svg', 'для печати', 'для вышивки', 'конвертируй'],
        confidence: 0.95,
        type: 'format_conversion'
      }
    };

    // Контекстные подсказки
    this.contextClues = {
      business_types: {
        'кофейня': {
          typical_colors: ['коричневый', 'бежевый', 'темно-зеленый', 'кремовый'],
          typical_elements: ['зерна кофе', 'чашка', 'пар', 'листья'],
          style_preferences: ['уютный', 'теплый', 'натуральный']
        },
        'пиццерия': {
          typical_colors: ['красный', 'зеленый', 'белый', 'желтый'],
          typical_elements: ['пицца', 'итальянский флаг', 'повар', 'печь'],
          style_preferences: ['итальянский', 'традиционный', 'аппетитный']
        },
        'магазин': {
          typical_colors: ['синий', 'красный', 'зеленый', 'оранжевый'],
          typical_elements: ['корзина', 'сумка', 'тележка', 'здание'],
          style_preferences: ['доступный', 'дружелюбный', 'современный']
        }
      }
    };

    // Цепочки логических связей
    this.logicalChains = {
      'логотип -> печать': ['векторизация', 'цветовая оптимизация', 'масштабирование'],
      'персонаж -> вышивка': ['упрощение деталей', 'сокращение цветов', 'увеличение толщины линий'],
      'принт -> футболка': ['адаптация размера', 'центрирование', 'учет ткани'],
      'эмблема -> вывеска': ['увеличение контрастности', 'упрощение мелких деталей', 'читаемость']
    };
  }

  /**
   * Основной метод семантического анализа
   */
  analyzeSemantics(query, context = {}) {
    SmartLogger.semantic(`Семантический анализ запроса: "${query}"`);

    const semanticCluster = this.identifySemanticCluster(query);
    const intentions = this.analyzeIntentions(query);
    const contextClues = this.extractContextClues(query);
    const logicalChain = this.buildLogicalChain(query, context);
    const implicitRequirements = this.identifyImplicitRequirements(query);

    const analysis = {
      query: query,
      semantic_cluster: semanticCluster,
      intentions: intentions,
      context_clues: contextClues,
      logical_chain: logicalChain,
      implicit_requirements: implicitRequirements,
      
      // КРИТИЧЕСКИ ВАЖНО: Создаем правильную структуру для natural-language-generator
      semantic_analysis: {
        semantic_cluster: semanticCluster,
        intentions: intentions,
        context_clues: contextClues,
        query_type: this.determineQueryType(query, semanticCluster),
        dialog_category: this.determineDialogCategory(query, semanticCluster)
      },
      
      confidence: 0
    };

    // Вычисляем общую уверенность анализа
    analysis.confidence = this.calculateAnalysisConfidence(analysis);

    SmartLogger.semantic('✅ ИСПРАВЛЕННЫЙ семантический анализ с правильной структурой:', {
      cluster_name: semanticCluster?.name,
      query_type: analysis.semantic_analysis.query_type,
      dialog_category: analysis.semantic_analysis.dialog_category,
      confidence: analysis.confidence
    });
    
    return analysis;
  }

  /**
   * Определение семантического кластера
   */
  identifySemanticCluster(query) {
    const lowerQuery = query.toLowerCase();
    const clusterScores = {};

    SmartLogger.semantic(`Анализирую кластеры для запроса: "${lowerQuery}"`);

    // Подсчитываем совпадения с каждым кластером
    Object.entries(this.semanticClusters).forEach(([clusterName, cluster]) => {
      let score = 0;
      const matchedCore = [];
      const matchedRelated = [];
      
      // Проверяем ключевые слова
      cluster.core.forEach(keyword => {
        if (lowerQuery.includes(keyword)) {
          // Повышенный вес для диалоговых и знаниевых кластеров
          const isDialogCluster = ['greeting', 'identity_question', 'casual_chat', 'simple_questions', 'conversation'].includes(clusterName);
          const isKnowledgeCluster = clusterName === 'knowledge_request';
          
          if (isDialogCluster) {
            score += 15;
          } else if (isKnowledgeCluster) {
            score += 20; // Еще больший вес для знаниевых запросов
          } else {
            score += 10;
          }
          matchedCore.push(keyword);
        }
      });

      cluster.related.forEach(keyword => {
        if (lowerQuery.includes(keyword)) {
          // Повышенный вес для диалоговых и знаниевых кластеров
          const isDialogCluster = ['greeting', 'identity_question', 'casual_chat', 'simple_questions', 'conversation'].includes(clusterName);
          const isKnowledgeCluster = clusterName === 'knowledge_request';
          
          if (isDialogCluster) {
            score += 8;
          } else if (isKnowledgeCluster) {
            score += 15; // Высокий вес для знаниевых фраз
          } else {
            score += 5;
          }
          matchedRelated.push(keyword);
        }
      });

      if (score > 0) {
        // Особая обработка для диалоговых кластеров - более высокая уверенность
        const isDialogCluster = ['greeting', 'identity_question', 'casual_chat', 'simple_questions', 'conversation'].includes(clusterName);
        const multiplier = isDialogCluster ? 12 : 8;
        const confidence = Math.min(score * multiplier, 100);
        clusterScores[clusterName] = {
          score,
          confidence,
          cluster: cluster,
          matchedCore,
          matchedRelated
        };
        
        SmartLogger.semantic(`Кластер ${clusterName}: счет=${score}, уверенность=${confidence}%, совпало ключевых=${matchedCore.length}, связанных=${matchedRelated.length}`);
      }
    });

    // Fallback для знаниевых запросов
    const knowledgeKeywords = [
      'расскажи про', 'расскажи о', 'рассказать про', 'рассказать о',
      'что такое', 'что это', 'объясни', 'объяснить', 'объяснения',
      'планета', 'космос', 'гравитация', 'история', 'наука',
      'экономика', 'бизнес', 'медицина', 'здоровье', 'психология',
      'физика', 'химия', 'биология', 'математика', 'география',
      'технологии', 'культура', 'искусство', 'литература', 'музыка',
      'спорт', 'климат', 'природа', 'программирование', 'интернет',
      'как работает', 'как устроен', 'как функционирует',
      'почему', 'зачем', 'для чего', 'где находится',
      'когда произошло', 'когда случилось', 'кто такой',
      'что знаешь', 'поведай', 'опиши', 'дай информацию'
    ];
    const hasKnowledgeKeywords = knowledgeKeywords.some(keyword => lowerQuery.includes(keyword));
    
    if (hasKnowledgeKeywords && (!clusterScores.knowledge_request || clusterScores.knowledge_request.score < 10)) {
      SmartLogger.semantic(`🎯 FALLBACK: Принудительно устанавливаем knowledge_request для запроса с знаниевыми ключевыми словами`);
      return {
        name: 'knowledge_request',
        score: 25,
        confidence: 85,
        cluster: this.semanticClusters.knowledge_request,
        matchedCore: knowledgeKeywords.filter(keyword => lowerQuery.includes(keyword)),
        matchedRelated: []
      };
    }

    // Находим кластер с наивысшим счетом
    const bestCluster = Object.entries(clusterScores)
      .sort(([,a], [,b]) => b.score - a.score)[0];

    if (bestCluster) {
      SmartLogger.semantic(`Определен лучший семантический кластер: ${bestCluster[0]} (уверенность: ${bestCluster[1].confidence}%)`);
      return {
        name: bestCluster[0],
        ...bestCluster[1]
      };
    }

    SmartLogger.semantic(`Семантический кластер не найден для запроса: "${lowerQuery}"`);
    return null;
  }

  /**
   * Анализ намерений пользователя
   */
  analyzeIntentions(query) {
    const lowerQuery = query.toLowerCase();
    const detectedIntentions = [];

    Object.entries(this.intentionPatterns).forEach(([intentionName, intentionData]) => {
      let matches = 0;
      const matchedPatterns = [];

      intentionData.patterns.forEach(pattern => {
        if (lowerQuery.includes(pattern)) {
          matches++;
          matchedPatterns.push(pattern);
        }
      });

      if (matches > 0) {
        detectedIntentions.push({
          name: intentionName,
          type: intentionData.type,
          confidence: intentionData.confidence * (matches / intentionData.patterns.length),
          matched_patterns: matchedPatterns,
          strength: matches
        });
      }
    });

    // Сортируем по уверенности
    detectedIntentions.sort((a, b) => b.confidence - a.confidence);

    SmartLogger.semantic(`Обнаружено намерений: ${detectedIntentions.length}`, detectedIntentions);
    return detectedIntentions;
  }

  /**
   * Извлечение контекстных подсказок
   */
  extractContextClues(query) {
    const lowerQuery = query.toLowerCase();
    const clues = {
      business_context: null,
      style_hints: [],
      color_hints: [],
      usage_hints: []
    };

    // Определяем тип бизнеса
    Object.entries(this.contextClues.business_types).forEach(([businessType, businessData]) => {
      if (lowerQuery.includes(businessType)) {
        clues.business_context = {
          type: businessType,
          data: businessData
        };
        
        // Добавляем подсказки по цветам
        clues.color_hints.push(...businessData.typical_colors);
        clues.style_hints.push(...businessData.style_preferences);
      }
    });

    // Определяем контекст использования
    const usageContexts = {
      'печать': { medium: 'print', requirements: ['высокое разрешение', 'CMYK цвета'] },
      'веб': { medium: 'digital', requirements: ['RGB цвета', 'оптимизация размера'] },
      'вывеска': { medium: 'large_format', requirements: ['высокий контраст', 'простые формы'] },
      'вышивка': { medium: 'embroidery', requirements: ['упрощение деталей', 'ограничение цветов'] }
    };

    Object.entries(usageContexts).forEach(([keyword, contextData]) => {
      if (lowerQuery.includes(keyword)) {
        clues.usage_hints.push(contextData);
      }
    });

    SmartLogger.semantic('Извлеченные контекстные подсказки:', clues);
    return clues;
  }

  /**
   * Построение логической цепочки действий
   */
  buildLogicalChain(query, context) {
    const lowerQuery = query.toLowerCase();
    const chains = [];

    // Проверяем готовые цепочки
    Object.entries(this.logicalChains).forEach(([chainKey, steps]) => {
      const [from, to] = chainKey.split(' -> ');
      
      if (lowerQuery.includes(from) && lowerQuery.includes(to)) {
        chains.push({
          from,
          to,
          steps,
          type: 'direct_chain',
          confidence: 0.9
        });
      }
    });

    // Строим цепочку на основе контекста
    if (context.hasRecentImages && lowerQuery.includes('вектор')) {
      chains.push({
        from: 'existing_image',
        to: 'vector_format',
        steps: ['анализ изображения', 'извлечение контуров', 'векторизация'],
        type: 'contextual_chain',
        confidence: 0.85
      });
    }

    SmartLogger.semantic('Построенные логические цепочки:', chains);
    return chains;
  }

  /**
   * Выявление неявных требований
   */
  identifyImplicitRequirements(query) {
    const requirements = [];
    const lowerQuery = query.toLowerCase();

    // Неявные требования для логотипов
    if (lowerQuery.includes('логотип')) {
      requirements.push({
        type: 'scalability',
        description: 'Логотип должен масштабироваться без потери качества',
        importance: 'high',
        suggested_action: 'векторизация'
      });

      requirements.push({
        type: 'simplicity',
        description: 'Логотип должен быть простым и запоминающимся',
        importance: 'medium',
        suggested_action: 'упрощение деталей'
      });
    }

    // Неявные требования для печати
    if (lowerQuery.includes('печать') || lowerQuery.includes('принт')) {
      requirements.push({
        type: 'print_quality',
        description: 'Изображение должно хорошо печататься',
        importance: 'high',
        suggested_action: 'высокое разрешение и контрастность'
      });

      requirements.push({
        type: 'color_mode',
        description: 'Цвета должны быть адаптированы для печати',
        importance: 'medium',
        suggested_action: 'конвертация в CMYK'
      });
    }

    // Неявные требования для вышивки
    if (lowerQuery.includes('вышивка')) {
      requirements.push({
        type: 'thread_limitation',
        description: 'Ограничение количества цветов нитей',
        importance: 'critical',
        suggested_action: 'сокращение палитры до 8-12 цветов'
      });

      requirements.push({
        type: 'detail_simplification',
        description: 'Мелкие детали не подходят для вышивки',
        importance: 'high',
        suggested_action: 'упрощение и укрупнение элементов'
      });
    }

    SmartLogger.semantic('Выявленные неявные требования:', requirements);
    return requirements;
  }

  /**
   * Вычисление уверенности анализа
   */
  calculateAnalysisConfidence(analysis) {
    let confidence = 0;
    let factors = 0;

    // Фактор: семантический кластер (основной вес)
    if (analysis.semantic_cluster && analysis.semantic_cluster.confidence > 0) {
      confidence += analysis.semantic_cluster.confidence;
      factors++;
      SmartLogger.semantic(`Кластер добавил: ${analysis.semantic_cluster.confidence}% уверенности`);
    }

    // Фактор: намерения
    if (analysis.intentions.length > 0) {
      const avgIntentionConfidence = analysis.intentions.reduce((sum, intent) => 
        sum + intent.confidence * 100, 0) / analysis.intentions.length;
      confidence += avgIntentionConfidence * 0.3;
      factors++;
      SmartLogger.semantic(`Намерения добавили: ${avgIntentionConfidence * 0.3}% уверенности`);
    }

    // Фактор: контекстные подсказки
    if (analysis.context_clues.business_context || analysis.context_clues.usage_hints.length > 0) {
      confidence += 40;
      factors++;
      SmartLogger.semantic(`Контекст добавил: 40% уверенности`);
    }

    // Фактор: логические цепочки
    if (analysis.logical_chain.length > 0) {
      const avgChainConfidence = analysis.logical_chain.reduce((sum, chain) => 
        sum + chain.confidence * 100, 0) / analysis.logical_chain.length;
      confidence += avgChainConfidence * 0.2;
      factors++;
      SmartLogger.semantic(`Цепочки добавили: ${avgChainConfidence * 0.2}% уверенности`);
    }

    // Фактор: неявные требования
    if (analysis.implicit_requirements.length > 0) {
      confidence += 30;
      factors++;
      SmartLogger.semantic(`Требования добавили: 30% уверенности`);
    }

    // Минимальная базовая уверенность если есть хотя бы один фактор
    if (factors > 0 && confidence < 25) {
      confidence = 25;
      SmartLogger.semantic(`Применена минимальная базовая уверенность: 25%`);
    }

    // Нормализуем если больше 100%
    const finalConfidence = Math.min(confidence, 100);

    SmartLogger.semantic(`Финальная уверенность семантического анализа: ${finalConfidence.toFixed(1)}% (факторов: ${factors})`);
    return Math.round(finalConfidence);
  }

  /**
   * Генерация семантических предложений
   */
  generateSemanticSuggestions(analysis) {
    const suggestions = [];

    // Предложения на основе семантического кластера
    if (analysis.semantic_cluster) {
      const cluster = analysis.semantic_cluster.cluster;
      cluster.typical_next_steps.forEach(step => {
        suggestions.push({
          type: 'cluster_suggestion',
          action: step,
          reason: `Типичный следующий шаг для ${analysis.semantic_cluster.name}`,
          confidence: analysis.semantic_cluster.confidence * 0.01
        });
      });
    }

    // Предложения на основе неявных требований
    analysis.implicit_requirements.forEach(req => {
      if (req.importance === 'critical' || req.importance === 'high') {
        suggestions.push({
          type: 'requirement_suggestion',
          action: req.suggested_action,
          reason: req.description,
          confidence: req.importance === 'critical' ? 0.9 : 0.7
        });
      }
    });

    // Предложения на основе контекста
    if (analysis.context_clues.business_context) {
      const businessData = analysis.context_clues.business_context.data;
      suggestions.push({
        type: 'context_suggestion',
        action: `использовать цвета: ${businessData.typical_colors.slice(0, 3).join(', ')}`,
        reason: `Подходящие цвета для ${analysis.context_clues.business_context.type}`,
        confidence: 0.6
      });
    }

    // Сортируем по уверенности
    suggestions.sort((a, b) => b.confidence - a.confidence);

    SmartLogger.semantic('Сгенерированные семантические предложения:', suggestions.slice(0, 5));
    return suggestions.slice(0, 5); // Возвращаем топ-5
  }

  /**
   * Определение семантической совместимости с существующим проектом
   */
  analyzeProjectCompatibility(query, existingProject) {
    if (!existingProject) return { compatible: false, score: 0 };

    const queryAnalysis = this.analyzeSemantics(query);
    const compatibility = {
      compatible: false,
      score: 0,
      reasons: [],
      conflicts: []
    };

    // Проверяем совместимость концепций
    if (queryAnalysis.semantic_cluster) {
      const clusterName = queryAnalysis.semantic_cluster.name;
      const projectConcept = existingProject.concept;

      // Прямое совпадение концепций
      if (clusterName === projectConcept || 
          this.areRelatedConcepts(clusterName, projectConcept)) {
        compatibility.score += 40;
        compatibility.reasons.push(`Совместимые концепции: ${clusterName} и ${projectConcept}`);
      }
    }

    // Проверяем намерения на модификацию
    const modificationIntents = queryAnalysis.intentions.filter(intent => 
      intent.type === 'modify_existing' || intent.type === 'enhance_existing'
    );

    if (modificationIntents.length > 0) {
      compatibility.score += 30;
      compatibility.reasons.push('Обнаружено намерение на модификацию существующего проекта');
    }

    // Проверяем логические цепочки
    queryAnalysis.logical_chain.forEach(chain => {
      if (this.chainAppliesToProject(chain, existingProject)) {
        compatibility.score += 20;
        compatibility.reasons.push(`Логическая цепочка ${chain.from} -> ${chain.to} применима к проекту`);
      }
    });

    compatibility.compatible = compatibility.score >= 50;
    compatibility.score = Math.min(compatibility.score, 100);

    SmartLogger.semantic('Анализ совместимости с проектом:', compatibility);
    return compatibility;
  }

  areRelatedConcepts(concept1, concept2) {
    const relatedGroups = [
      ['logo', 'логотип', 'branding'],
      ['print', 'принт', 'apparel_design'],
      ['character', 'персонаж', 'character_design'],
      ['embroidery', 'вышивка', 'embroidery_design']
    ];

    return relatedGroups.some(group => 
      group.includes(concept1) && group.includes(concept2)
    );
  }

  chainAppliesToProject(chain, project) {
    // Проверяем, применима ли логическая цепочка к артефактам проекта
    const hasRelevantArtifacts = project.artifacts.some(artifact => {
      return chain.from.includes(artifact.type) || 
             artifact.description?.toLowerCase().includes(chain.from);
    });

    return hasRelevantArtifacts;
  }

  /**
   * Определяет тип запроса для диалоговой системы
   */
  determineQueryType(query, semanticCluster) {
    const lowerQuery = query.toLowerCase();
    
    // Знаниевые запросы (ВЫСШИЙ ПРИОРИТЕТ)
    if (semanticCluster?.name === 'knowledge_request') {
      return 'information_request';
    }
    
    // Диалоговые типы
    if (semanticCluster?.name) {
      const dialogTypes = ['greeting', 'identity_question', 'casual_chat', 'simple_questions', 'conversation'];
      if (dialogTypes.includes(semanticCluster.name)) {
        return 'dialog';
      }
    }
    
    // Функциональные типы
    if (lowerQuery.includes('создай') || lowerQuery.includes('нарисуй') || lowerQuery.includes('сгенерируй')) {
      return 'generation';
    }
    if (lowerQuery.includes('векторизуй') || lowerQuery.includes('конвертируй')) {
      return 'conversion';
    }
    if (lowerQuery.includes('анализ') || lowerQuery.includes('изучи')) {
      return 'analysis';
    }
    if (lowerQuery.includes('помоги') || lowerQuery.includes('как')) {
      return 'assistance';
    }
    
    return 'general';
  }

  /**
   * Определяет категорию диалога для персонализации ответов
   */
  determineDialogCategory(query, semanticCluster) {
    const lowerQuery = query.toLowerCase();
    
    // КРИТИЧЕСКИЙ ПРИОРИТЕТ: Семантический кластер knowledge_request
    if (semanticCluster?.name === 'knowledge_request') {
      SmartLogger.semantic(`🎯 ОПРЕДЕЛЕНА категория знаниевого запроса: knowledge_sharing`);
      return 'knowledge_sharing';
    }
    
    // Фразовый анализ для знаниевых запросов (ВЫСОКИЙ ПРИОРИТЕТ)
    if (lowerQuery.includes('расскажи про') || lowerQuery.includes('что такое') || 
        lowerQuery.includes('объясни') || lowerQuery.includes('история') ||
        lowerQuery.includes('страна') || lowerQuery.includes('наука') ||
        lowerQuery.includes('культура') || lowerQuery.includes('когда') ||
        lowerQuery.includes('где') || lowerQuery.includes('почему') ||
        lowerQuery.includes('знаешь') || lowerQuery.includes('расскажи мне')) {
      SmartLogger.semantic(`🎯 ОПРЕДЕЛЕНА категория по ключевым словам: knowledge_sharing`);
      return 'knowledge_sharing';
    }
    
    // Используем семантический кластер для остальных категорий
    if (semanticCluster?.name) {
      switch (semanticCluster.name) {
        case 'greeting':
          return 'welcome';
        case 'identity_question':
          return 'introduction';
        case 'casual_chat':
          return 'friendly_chat';
        case 'simple_questions':
          return 'quick_help';
        case 'conversation':
          return 'general_chat';
        default:
          break;
      }
    }
    
    // Остальные диалоговые категории
    if (lowerQuery.includes('привет') || lowerQuery.includes('здравствуй')) {
      return 'welcome';
    }
    if (lowerQuery.includes('расскажи о себе') || lowerQuery.includes('кто ты')) {
      return 'introduction';
    }
    if (lowerQuery.includes('как дела') || lowerQuery.includes('что делаешь')) {
      return 'friendly_chat';
    }
    if (lowerQuery.includes('помоги') || lowerQuery.includes('не понимаю')) {
      return 'quick_help';
    }
    
    SmartLogger.semantic(`🎯 ОПРЕДЕЛЕНА категория по умолчанию: general_chat`);
    return 'general_chat';
  }
}

// Создаем глобальный экземпляр
const semanticAnalyzer = new SemanticAnalyzer();

// Добавляем функцию проверки доступности
function isAvailable() {
  return semanticAnalyzer && 
         semanticAnalyzer.semanticClusters &&
         Object.keys(semanticAnalyzer.semanticClusters).length > 0 &&
         typeof semanticAnalyzer.analyzeSemantics === 'function';
}

module.exports = {
  analyzeSemantics: semanticAnalyzer.analyzeSemantics.bind(semanticAnalyzer),
  generateSemanticSuggestions: semanticAnalyzer.generateSemanticSuggestions.bind(semanticAnalyzer),
  analyzeProjectCompatibility: semanticAnalyzer.analyzeProjectCompatibility.bind(semanticAnalyzer),
  isAvailable,
  
  // Экспортируем класс для расширения
  SemanticAnalyzer
};