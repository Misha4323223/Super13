/**
 * Интеллектуальный процессор чата - "невидимый мозг" приложения
 * Автоматически анализирует намерения пользователя и планирует оптимальный ответ
 * Работает прозрачно, как система принятия решений в ChatGPT-4
 * 
 * ОБНОВЛЕНО: Интегрирована семантическая память проектов для понимания контекста
 */

// Загружаем семантическую память проектов через интеграционный слой
const semanticMemory = require('./semantic-memory/index.cjs');
const semanticIntegrationLayer = require('./semantic-integration-layer.cjs');

const SmartLogger = {
  brain: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`🧠 [${timestamp}] INTELLIGENT BRAIN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  plan: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`📋 [${timestamp}] ACTION PLAN: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  execute: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`⚡ [${timestamp}] EXECUTION: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  grammar: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`📝 [${timestamp}] GRAMMAR ANALYSIS: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  memory: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`💾 [${timestamp}] ACTION MEMORY: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  emotion: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`😊 [${timestamp}] EMOTIONAL ANALYSIS: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

/**
 * Система эмоционального анализа и адаптивных ответов
 */
const emotionalAnalyzer = {
  // Словари для определения эмоций
  emotionPatterns: {
    // Позитивные эмоции
    joy: {
      keywords: ['отлично', 'супер', 'классно', 'круто', 'замечательно', 'прекрасно', 'восторг', 'радость', 'счастлив', 'довольн', 'ура', 'ого', 'вау', 'amazing', 'great', 'awesome', 'fantastic', 'wonderful'],
      emojis: ['😊', '😄', '🎉', '👍', '💯', '✨', '🌟', '❤️'],
      weight: 2
    },

    // Злость/раздражение
    anger: {
      keywords: ['бесит', 'злой', 'раздражает', 'дурак', 'идиот', 'ненавижу', 'достал', 'надоел', 'плохо', 'ужасно', 'отвратительно', 'фигня', 'дерьмо', 'блин', 'черт', 'angry', 'hate', 'stupid', 'terrible', 'awful'],
      emojis: ['😤', '😠', '💢', '🤬', '😡'],
      weight: 3
    },

    // Усталость/грусть
    sadness: {
      keywords: ['устал', 'грустно', 'печально', 'депрессия', 'скучно', 'одиноко', 'тоскливо', 'плохое настроение', 'не хочется', 'лень', 'sad', 'tired', 'boring', 'lonely', 'depressed'],
      emojis: ['😔', '😞', '😢', '😴', '💤', '😪'],
      weight: 2
    },

    // Удивление/интерес
    surprise: {
      keywords: ['удивительно', 'невероятно', 'интересно', 'любопытно', 'странно', 'необычно', 'как так', 'неожиданно', 'wow', 'amazing', 'incredible', 'interesting', 'curious', 'strange'],
      emojis: ['😮', '🤔', '😯', '🧐', '💭', '❓'],
      weight: 1.5
    },

    // Вежливость
    polite: {
      keywords: ['пожалуйста', 'спасибо', 'благодарю', 'извините', 'простите', 'будьте добры', 'не могли бы', 'please', 'thank you', 'sorry', 'excuse me'],
      emojis: ['🙏', '😊', '💝', '🤝'],
      weight: 1.5
    },

    // Нейтральные вопросы
    neutral_question: {
      keywords: ['что', 'как', 'где', 'когда', 'почему', 'зачем', 'можешь', 'помоги', 'объясни', 'расскажи', 'what', 'how', 'where', 'when', 'why', 'help', 'explain'],
      emojis: ['❓', '🤔', '💭'],
      weight: 1
    }
  },

  /**
   * Анализ эмоциональной тональности текста
   */
  analyzeEmotion(text) {
    SmartLogger.emotion(`Анализируем эмоции в тексте: "${text.substring(0, 50)}..."`);

    const lowerText = text.toLowerCase();
    const emotions = {};
    let dominantEmotion = 'neutral';
    let maxScore = 0;

    // Анализируем каждую эмоцию
    for (const [emotion, data] of Object.entries(this.emotionPatterns)) {
      let score = 0;
      const matches = [];

      // Подсчитываем совпадения
      for (const keyword of data.keywords) {
        if (lowerText.includes(keyword)) {
          score += data.weight;
          matches.push(keyword);
        }
      }

      emotions[emotion] = {
        score,
        matches,
        confidence: Math.min(score * 20, 100) // Нормализуем до 100%
      };

      // Определяем доминирующую эмоцию
      if (score > maxScore) {
        maxScore = score;
        dominantEmotion = emotion;
      }
    }

    // Дополнительный анализ на основе пунктуации и стиля
    const punctuationAnalysis = this.analyzePunctuation(text);
    const styleAnalysis = this.analyzeWritingStyle(text);

    const result = {
      dominantEmotion,
      emotions,
      confidence: emotions[dominantEmotion]?.confidence || 0,
      punctuation: punctuationAnalysis,
      style: styleAnalysis,
      overallTone: this.determineOverallTone(emotions, punctuationAnalysis, styleAnalysis)
    };

    SmartLogger.emotion('Результат эмоционального анализа:', result);
    return result;
  },

  /**
   * Анализ пунктуации для определения эмоций
   */
  analyzePunctuation(text) {
    const analysis = {
      exclamationMarks: (text.match(/!/g) || []).length,
      questionMarks: (text.match(/\?/g) || []).length,
      capsWords: (text.match(/[А-ЯA-Z]{2,}/g) || []).length,
      dots: (text.match(/\.{2,}/g) || []).length
    };

    // Интерпретация
    let interpretation = 'neutral';
    if (analysis.exclamationMarks >= 2) interpretation = 'excited';
    else if (analysis.capsWords >= 2) interpretation = 'angry_or_excited';
    else if (analysis.dots >= 1) interpretation = 'thoughtful_or_sad';
    else if (analysis.questionMarks >= 2) interpretation = 'confused_or_curious';

    return { ...analysis, interpretation };
  },

  /**
   * Анализ стиля письма
   */
  analyzeWritingStyle(text) {
    const wordCount = text.split(/\s+/).length;
    const avgWordLength = text.replace(/\s+/g, '').length / wordCount;
    const sentenceCount = text.split(/[.!?]+/).length - 1;

    return {
      wordCount,
      avgWordLength,
      sentenceCount,
      isLongMessage: wordCount > 20,
      isShortMessage: wordCount < 5,
      formality: avgWordLength > 5 ? 'formal' : 'casual'
    };
  },

  /**
   * Определение общей тональности
   */
  determineOverallTone(emotions, punctuation, style) {
    const scores = Object.entries(emotions)
      .filter(([_, data]) => data.score > 0)
      .sort((a, b) => b[1].score - a[1].score);

    if (scores.length === 0) return 'neutral';

    const topEmotion = scores[0][0];
    const confidence = scores[0][1].confidence;

    // Модификаторы на основе пунктуации
    let modifier = '';
    if (punctuation.interpretation === 'excited' && topEmotion !== 'anger') {
      modifier = '_excited';
    } else if (punctuation.interpretation === 'angry_or_excited' && confidence > 50) {
      modifier = '_intense';
    }

    return topEmotion + modifier;
  },

  /**
   * Генерация адаптивного ответа на основе эмоций
   */
  generateEmotionalResponse(emotionalState, baseResponse, category) {
    SmartLogger.emotion(`Адаптируем ответ под эмоцию: ${emotionalState.dominantEmotion}`);

    const templates = this.getResponseTemplates(emotionalState.overallTone, category);
    const selectedTemplate = templates[Math.floor(Math.random() * templates.length)];

    // Добавляем эмодзи
    const emoji = this.selectEmoji(emotionalState.dominantEmotion);

    // Формируем финальный ответ
    let adaptedResponse = selectedTemplate.prefix + ' ' + baseResponse;

    if (selectedTemplate.suffix) {
      adaptedResponse += ' ' + selectedTemplate.suffix;
    }

    if (emoji) {
      adaptedResponse = emoji + ' ' + adaptedResponse;
    }

    SmartLogger.emotion(`Адаптированный ответ: "${adaptedResponse.substring(0, 100)}..."`);
    return adaptedResponse;
  },

  /**
   * Шаблоны ответов для разных эмоций
   */
  getResponseTemplates(tone, category) {
    const templates = {
      joy: [
        { prefix: 'Отлично! С радостью помогу!', suffix: 'Надеюсь, результат вас порадует! 🎉' },
        { prefix: 'Замечательно! Это будет интересно!', suffix: 'Уверен, получится здорово! ✨' },
        { prefix: 'Супер! Давайте сделаем это!', suffix: 'Думаю, вам понравится результат! 🌟' }
      ],

      anger: [
        { prefix: 'Понимаю ваше раздражение. Давайте решим это быстро.', suffix: 'Надеюсь, это поможет улучшить ситуацию.' },
        { prefix: 'Извините за неудобства. Сейчас всё исправим.', suffix: 'Постараюсь сделать всё максимально эффективно.' },
        { prefix: 'Вижу, что вы расстроены. Попробуем решить проблему.', suffix: 'Надеюсь, это поможет.' }
      ],

      sadness: [
        { prefix: 'Понимаю, что сейчас непросто. Давайте попробуем.', suffix: 'Надеюсь, это немного поднимет настроение! 🌈' },
        { prefix: 'Не расстраивайтесь, мы обязательно справимся.', suffix: 'Всё будет хорошо! 💝' },
        { prefix: 'Поддерживаю вас! Вместе мы решим эту задачу.', suffix: 'Верю, что у нас получится! 🤗' }
      ],

      surprise: [
        { prefix: 'Интересная задача! Давайте разберёмся.', suffix: 'Любопытно посмотреть, что получится! 🔍' },
        { prefix: 'Необычный запрос! Попробуем сделать что-то особенное.', suffix: 'Это будет познавательно! 🧐' },
        { prefix: 'Отличный вопрос! Сейчас всё выясним.', suffix: 'Результат может вас удивить! ✨' }
      ],

      polite: [
        { prefix: 'Конечно! Буду рад помочь.', suffix: 'Если нужно что-то ещё, обращайтесь! 🤝' },
        { prefix: 'С удовольствием! Сейчас сделаю.', suffix: 'Благодарю за вежливость! 😊' },
        { prefix: 'Разумеется! Приступаю к выполнению.', suffix: 'Рад быть полезным! 🙏' }
      ],

      neutral_question: [
        { prefix: 'Хороший вопрос! Давайте разберёмся.', suffix: 'Надеюсь, ответ будет полезным! 💭' },
        { prefix: 'Понятно! Сейчас найдём решение.', suffix: 'Постараюсь дать исчерпывающий ответ! 🎯' },
        { prefix: 'Ясно! Приступаю к анализу.', suffix: 'Думаю, это поможет! 📋' }
      ],

      neutral: [
        { prefix: 'Хорошо! Сейчас выполню.', suffix: 'Готово! Если нужно что-то ещё, обращайтесь.' },
        { prefix: 'Понятно! Приступаю к работе.', suffix: 'Надеюсь, результат вам подойдёт!' },
        { prefix: 'Сейчас сделаю!', suffix: 'Готово к использованию!' }
      ]
    };

    return templates[tone] || templates.neutral;
  },

  /**
   * Выбор подходящего эмодзи
   */
  selectEmoji(emotion) {
    const emojiSets = this.emotionPatterns[emotion]?.emojis || ['🤖'];
    return emojiSets[Math.floor(Math.random() * emojiSets.length)];
  }
};

// Система расширенной памяти сессии
const sessionMemory = {
  sessions: new Map(),
  maxSessionAge: 24 * 60 * 60 * 1000, // 24 часа

  // Получить или создать данные сессии
  getSession(sessionId = 'default') {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        sessionId,
        userName: null,
        goals: [],
        topics: [],
        preferences: {},
        createdAt: Date.now(),
        lastActivity: Date.now(),
        statistics: {
          messagesCount: 0,
          goalsAchieved: 0,
          topicsDiscussed: 0
        },
        // Система состояний диалога для генерации изображений
        dialogueState: {
          currentState: 'ready', // ready, awaiting_choice, generating
          category: null, // image_generation, vectorization, etc.
          pendingRequest: null, // детали запроса пользователя
          suggestedOptions: null, // предложенные варианты
          lastSuggestionTime: null,
          choiceKeywords: ['выбираю', 'сделай', 'создай', 'давай', 'хочу', 'принт', 'этот', 'такой']
        }
      });
      SmartLogger.memory(`Создана новая сессия: ${sessionId}`);
    }

    const session = this.sessions.get(sessionId);
    session.lastActivity = Date.now();
    return session;
  },

  // Установить имя пользователя
  setUserName(sessionId, name) {
    const session = this.getSession(sessionId);
    const oldName = session.userName;
    session.userName = name;

    SmartLogger.memory(`Имя пользователя изменено: "${oldName}" → "${name}" (сессия: ${sessionId})`);
    return `Отлично! Теперь я буду называть вас ${name}. Приятно познакомиться! 😊`;
  },

  // Добавить цель
  addGoal(sessionId, goal, priority = 'medium') {
    const session = this.getSession(sessionId);
    const goalRecord = {
      id: Math.random().toString(36).substr(2, 9),
      text: goal,
      priority,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    session.goals.push(goalRecord);
    session.statistics.goalsAchieved = session.goals.filter(g => g.status === 'completed').length;

    SmartLogger.memory(`Добавлена цель: "${goal}" (приоритет: ${priority}, сессия: ${sessionId})`);

    const userName = session.userName ? `, ${session.userName}` : '';
    return `Понял${userName}! Добавил в ваши цели: "${goal}". Общее количество активных целей: ${session.goals.filter(g => g.status === 'active').length}. Чем могу помочь в её достижении? 🎯`;
  },

  // Запомнить тему
  rememberTopic(sessionId, topic, category = 'general') {
    const session = this.getSession(sessionId);
    const topicRecord = {
      id: Math.random().toString(36).substr(2, 9),
      text: topic,
      category,
      mentions: 1,
      createdAt: Date.now(),
      lastMentioned: Date.now()
    };

    // Проверяем, есть ли уже похожая тема
    const existingTopic = session.topics.find(t => 
      t.text.toLowerCase().includes(topic.toLowerCase()) || 
      topic.toLowerCase().includes(t.text.toLowerCase())
    );

    if (existingTopic) {
      existingTopic.mentions++;
      existingTopic.lastMentioned = Date.now();
      SmartLogger.memory(`Обновлена тема: "${topic}" (упоминаний: ${existingTopic.mentions})`);
    } else {
      session.topics.push(topicRecord);
      session.statistics.topicsDiscussed = session.topics.length;
      SmartLogger.memory(`Добавлена новая тема: "${topic}" (категория: ${category})`);
    }

    return `Запомнил тему "${topic}". Теперь я буду учитывать её в наших разговорах! 📝`;
  },

  // Автоматическое извлечение целей из текста
  extractGoalsFromText(sessionId, text) {
    const goalPatterns = [
      /я хочу\s+(.+?)(?:[.!?]|$)/gi,
      /мне нужно\s+(.+?)(?:[.!?]|$)/gi,
      /хотел бы\s+(.+?)(?:[.!?]|$)/gi,
      /планирую\s+(.+?)(?:[.!?]|$)/gi,
      /собираюсь\s+(.+?)(?:[.!?]|$)/gi,
      /моя цель\s+(.+?)(?:[.!?]|$)/gi,
      /стремлюсь\s+(.+?)(?:[.!?]|$)/gi
    ];

    const extractedGoals = [];

    goalPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const goal = match[1].trim();
        if (goal.length > 3 && goal.length < 200) {
          extractedGoals.push(goal);
        }
      }
    });

    if (extractedGoals.length > 0) {
      const responses = [];
      extractedGoals.forEach(goal => {
        const response = this.addGoal(sessionId, goal, 'auto-detected');
        responses.push(response);
      });

      SmartLogger.memory(`Автоматически извлечено целей: ${extractedGoals.length} из текста: "${text.substring(0, 100)}..."`);
      return responses;
    }

    return null;
  },

  // Получить контекст пользователя для AI
  getUserContext(sessionId) {
    const session = this.getSession(sessionId);

    let context = 'КОНТЕКСТ ПОЛЬЗОВАТЕЛЯ:\n';

    if (session.userName) {
      context += `👤 Имя: ${session.userName}\n`;
    }

    if (session.goals.length > 0) {
      const activeGoals = session.goals.filter(g => g.status === 'active');
      if (activeGoals.length > 0) {
        context += `🎯 Активные цели (${activeGoals.length}):\n`;
        activeGoals.slice(0, 5).forEach((goal, index) => {
          context += `   ${index + 1}. ${goal.text} (${goal.priority})\n`;
        });
      }
    }

    if (session.topics.length > 0) {
      const recentTopics = session.topics
        .sort((a, b) => b.lastMentioned - a.lastMentioned)
        .slice(0, 3);

      context += `📝 Последние темы:\n`;
      recentTopics.forEach((topic, index) => {
        context += `   ${index + 1}. ${topic.text} (${topic.mentions} раз)\n`;
      });
    }

    context += `📊 Статистика: ${session.statistics.messagesCount} сообщений, ${session.statistics.topicsDiscussed} тем\n`;

    return context;
  },

  // Команды управления памятью
  processMemoryCommand(sessionId, command, params) {
    SmartLogger.memory(`Обработка команды памяти: ${command} с параметрами:`, params);

    switch (command.toLowerCase()) {
      case 'setusername':
      case 'set_user_name':
        if (params && params.length > 0) {
          return this.setUserName(sessionId, params.join(' '));
        }
        return 'Пожалуйста, укажите имя. Пример: "setUserName Анна"';

      case 'addgoal':
      case 'add_goal':
        if (params && params.length > 0) {
          const priority = params.includes('--high') ? 'high' : 
                          params.includes('--low') ? 'low' : 'medium';
          const goalText = params.filter(p => !p.startsWith('--')).join(' ');
          return this.addGoal(sessionId, goalText, priority);
        }
        return 'Пожалуйста, укажите цель. Пример: "addGoal изучить программирование --high"';

      case 'remembertopic':
      case 'remember_topic':
        if (params && params.length > 0) {
          return this.rememberTopic(sessionId, params.join(' '));
        }
        return 'Пожалуйста, укажите тему. Пример: "rememberTopic искусственный интеллект"';

      case 'showmemory':
      case 'show_memory':
        return this.getUserContext(sessionId);

      case 'clearmemory':
      case 'clear_memory':
        return this.clearSession(sessionId);

      default:
        return `Неизвестная команда памяти: ${command}. Доступные команды: setUserName, addGoal, rememberTopic, showMemory, clearMemory`;
    }
  },

  // Очистка сессии
  clearSession(sessionId) {
    if (this.sessions.has(sessionId)) {
      const session = this.sessions.get(sessionId);
      const backup = { ...session };

      session.goals = [];
      session.topics = [];
      session.preferences = {};
      session.statistics = {
        messagesCount: 0,
        goalsAchieved: 0,
        topicsDiscussed: 0
      };

      SmartLogger.memory(`Очищена память сессии: ${sessionId}`, backup);
      return 'Память сессии очищена! Вы можете начать заново. 🔄';
    }

    return 'Сессия не найдена.';
  },

  // Автоматическая очистка старых сессий
  cleanupOldSessions() {
    const now = Date.now();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > this.maxSessionAge) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      SmartLogger.memory(`Очищено старых сессий: ${cleaned}`);
    }
  },

  // ========== МЕТОДЫ УПРАВЛЕНИЯ СОСТОЯНИЯМИ ДИАЛОГА ==========

  // Установить состояние ожидания выбора после предложения вариантов
  setAwaitingChoice(sessionId, category, pendingRequest, suggestedOptions) {
    const session = this.getSession(sessionId);
    session.dialogueState.currentState = 'awaiting_choice';
    session.dialogueState.category = category;
    session.dialogueState.pendingRequest = pendingRequest;
    session.dialogueState.suggestedOptions = suggestedOptions;
    session.dialogueState.lastSuggestionTime = Date.now();

    SmartLogger.memory(`[ДИАЛОГ] Установлено состояние "ожидание выбора" для категории: ${category}`);
    SmartLogger.memory(`[ДИАЛОГ] Запрос: "${pendingRequest?.substring(0, 50)}..."`);
  },

  // Проверить, ожидается ли выбор от пользователя
  isAwaitingChoice(sessionId, category = null) {
    const session = this.getSession(sessionId);
    const dialogueState = session.dialogueState;

    const isAwaiting = dialogueState.currentState === 'awaiting_choice' && 
                     (!category || dialogueState.category === category);

    if (isAwaiting) {
      SmartLogger.memory(`[ДИАЛОГ] Сессия ${sessionId} ожидает выбор для категории: ${dialogueState.category}`);
    }

    return isAwaiting;
  },

  // Проверить, является ли сообщение выбором пользователя
  isUserChoice(sessionId, userMessage) {
    const session = this.getSession(sessionId);
    const dialogueState = session.dialogueState;

    if (dialogueState.currentState !== 'awaiting_choice') {
      return false;
    }

    const lowerMessage = userMessage.toLowerCase();
    
    // КРИТИЧЕСКАЯ ПРОВЕРКА: исключаем фразы-ответы на предложения
    const nonChoiceResponses = [
      'оптимизируя для печати', 'оптимизация для печати', 'для печати на ткани',
      'печать на ткани', 'подготовка к печати', 'готовлю к печати',
      'адаптирую для печати', 'настраиваю для печати'
    ];
    
    const isNonChoiceResponse = nonChoiceResponses.some(response => 
      lowerMessage.includes(response)
    );
    
    if (isNonChoiceResponse) {
      SmartLogger.memory(`[ДИАЛОГ] ОБНАРУЖЕН ОТВЕТ НА ПРЕДЛОЖЕНИЕ (НЕ ВЫБОР): "${userMessage}"`);
      return false;
    }

    const hasChoiceKeywords = dialogueState.choiceKeywords.some(keyword => 
      lowerMessage.includes(keyword)
    );

    // Дополнительные фразы указывающие на выбор или готовность к действию
    const choiceIndicators = [
      'должен был', 'должен создать', 'сделай это', 'давай этот',
      'создавай', 'генерируй', 'рисуй', 'делай'
    ];

    const hasChoiceIndicators = choiceIndicators.some(indicator => 
      lowerMessage.includes(indicator)
    );

    const isChoice = hasChoiceKeywords || hasChoiceIndicators;

    if (isChoice) {
      SmartLogger.memory(`[ДИАЛОГ] Распознан выбор пользователя: "${userMessage}"`);
      SmartLogger.memory(`[ДИАЛОГ] Ключевые слова: ${hasChoiceKeywords ? 'найдены' : 'нет'}, индикаторы: ${hasChoiceIndicators ? 'найдены' : 'нет'}`);
    } else {
      SmartLogger.memory(`[ДИАЛОГ] НЕ распознан как выбор: "${userMessage}"`);
    }

    return isChoice;
  },

  // Получить детали ожидающего запроса
  getPendingRequest(sessionId) {
    const session = this.getSession(sessionId);
    const dialogueState = session.dialogueState;

    if (dialogueState.currentState === 'awaiting_choice') {
      SmartLogger.memory(`[ДИАЛОГ] Получен ожидающий запрос: "${dialogueState.pendingRequest?.substring(0, 50)}..."`);
      return {
        category: dialogueState.category,
        request: dialogueState.pendingRequest,
        options: dialogueState.suggestedOptions,
        timestamp: dialogueState.lastSuggestionTime
      };
    }

    return null;
  },

  // Установить состояние генерации (выполнения действия)
  setGenerating(sessionId, category) {
    const session = this.getSession(sessionId);
    session.dialogueState.currentState = 'generating';
    session.dialogueState.category = category;

    SmartLogger.memory(`[ДИАЛОГ] Установлено состояние "генерация" для категории: ${category}`);
  },

  // Сбросить состояние диалога в готовность
  resetDialogueState(sessionId) {
    const session = this.getSession(sessionId);
    session.dialogueState.currentState = 'ready';
    session.dialogueState.category = null;
    session.dialogueState.pendingRequest = null;
    session.dialogueState.suggestedOptions = null;
    session.dialogueState.lastSuggestionTime = null;

    SmartLogger.memory(`[ДИАЛОГ] Состояние диалога сброшено в "готовность"`);
  },

  // Получить текущее состояние диалога
  getDialogueState(sessionId) {
    const session = this.getSession(sessionId);
    return session.dialogueState;
  }
};

// Система памяти о последних действиях
const actionMemory = {
  lastActions: [],
  maxHistorySize: 10,

  // Сохранить действие в памяти
  saveAction(action) {
    const actionRecord = {
      ...action,
      timestamp: Date.now(),
      id: Math.random().toString(36).substr(2, 9)
    };

    this.lastActions.unshift(actionRecord);

    // Ограничиваем размер истории
    if (this.lastActions.length > this.maxHistorySize) {
      this.lastActions = this.lastActions.slice(0, this.maxHistorySize);
    }

    SmartLogger.memory(`Сохранено действие: ${action.category}`, actionRecord);
  },

  // Получить последнее действие определенного типа
  getLastAction(category = null) {
    if (!category) {
      return this.lastActions[0] || null;
    }

    const lastAction = this.lastActions.find(action => action.category === category);
    SmartLogger.memory(`Найдено последнее действие категории ${category}:`, lastAction);
    return lastAction;
  },

  // Получить последнее созданное изображение
  getLastImage() {
    return this.getLastAction('image_generation');
  },

  // Проверить, было ли недавно создано изображение
  hasRecentImage(withinMinutes = 30) {
    const lastImage = this.getLastImage();
    if (!lastImage) return false;

    const timeDiff = Date.now() - lastImage.timestamp;
    const minutesDiff = timeDiff / (1000 * 60);

    return minutesDiff <= withinMinutes;
  },

  // Получить контекст для анализа
  getActionContext() {
    const recentActions = this.lastActions.slice(0, 3);
    return {
      hasRecentImage: this.hasRecentImage(),
      lastImageTime: this.getLastImage()?.timestamp,
      recentCategories: recentActions.map(a => a.category),
      totalActions: this.lastActions.length
    };
  }
};

// Автоматическая очистка старых сессий каждые 30 минут
setInterval(() => {
  sessionMemory.cleanupOldSessions();
}, 30 * 60 * 1000);

/**
 * Грамматический анализ текста для понимания намерений
 */
function analyzeGrammar(text) {
  SmartLogger.grammar(`Анализируем грамматику: "${text.substring(0, 50)}..."`);

  const query = text.toLowerCase().trim();

  // Анализ структуры предложения
  const analysis = {
    isQuestion: false,
    isCommand: false,
    tense: 'present',
    questionWords: [],
    commandWords: [],
    timeIndicators: [],
    confidence: 0
  };

  // Вопросительные слова и фразы
  const questionPatterns = [
    'что', 'как', 'где', 'когда', 'почему', 'зачем', 'кто', 'какой', 'какая', 'какое', 'какие',
    'что такое', 'как это', 'что это', 'что ты', 'как ты', 'можешь ли', 'умеешь ли'
  ];

  // Командные слова
  const commandPatterns = [
    'создай', 'сделай', 'нарисуй', 'сгенерируй', 'построй', 'покажи', 'найди', 'поищи',
    'преобразуй', 'конвертируй', 'переведи', 'измени', 'добавь', 'удали'
  ];

  // Индикаторы времени
  const pastTimePatterns = [
    'создал', 'сделал', 'нарисовал', 'сгенерировал', 'построил', 'показал', 'нашел', 
    'искал', 'преобразовал', 'конвертировал', 'перевел', 'изменил', 'добавил', 'удалил',
    'было', 'была', 'были', 'раньше', 'ранее', 'до этого', 'уже', 'недавно'
  ];

  const futureTimePatterns = [
    'будешь', 'будет', 'собираешься', 'планируешь', 'хочешь', 'можешь', 'сможешь',
    'завтра', 'потом', 'позже', 'скоро', 'в будущем'
  ];

  // Проверка на вопросительные паттерны
  questionPatterns.forEach(pattern => {
    if (query.includes(pattern)) {
      analysis.questionWords.push(pattern);
      analysis.isQuestion = true;
    }
  });

  // Проверка на командные паттерны
  commandPatterns.forEach(pattern => {
    if (query.includes(pattern)) {
      analysis.commandWords.push(pattern);
      analysis.isCommand = true;
    }
  });

  // Определение времени
  pastTimePatterns.forEach(pattern => {
    if (query.includes(pattern)) {
      analysis.timeIndicators.push({pattern, type: 'past'});
      analysis.tense = 'past';
    }
  });

  futureTimePatterns.forEach(pattern => {
    if (query.includes(pattern)) {
      analysis.timeIndicators.push({pattern, type: 'future'});
      if (analysis.tense !== 'past') {
        analysis.tense = 'future';
      }
    }
  });

  // Специальные случаи
  if (query.includes('?')) {
    analysis.isQuestion = true;
  }

  // Если есть и вопросительные и командные слова, приоритет у вопросов
  if (analysis.isQuestion && analysis.isCommand) {
    analysis.isCommand = false;
    SmartLogger.grammar('Обнаружен конфликт: есть и вопросы и команды. Приоритет у вопроса.');
  }

  // Вычисляем уверенность в анализе
  analysis.confidence = Math.min(
    (analysis.questionWords.length + analysis.commandWords.length + analysis.timeIndicators.length) * 25,
    100
  );

  SmartLogger.grammar('Результат грамматического анализа:', analysis);
  return analysis;
}

/**
 * Умные пороги уверенности на основе контекста
 */
function calculateSmartThreshold(grammar, context, category) {
  let baseThreshold = 12; // Более мягкий базовый порог

  // Адаптивная логика на основе грамматики
  if (grammar.isQuestion && grammar.tense === 'past') {
    // Вопросы о прошлом - очень низкий порог для активации специальных обработчиков
    baseThreshold = 8;
    SmartLogger.grammar('Снижен порог: вопрос о прошлом действии');
  } else if (grammar.isCommand && grammar.tense === 'future') {
    // Команды на будущее - умеренный порог
    baseThreshold = 18;
    SmartLogger.grammar('Умеренный порог: команда на будущее');
  } else if (grammar.isQuestion) {
    // Обычные вопросы - низкий порог
    baseThreshold = 10;
    SmartLogger.grammar('Низкий порог: обычный вопрос');
  } else if (grammar.isCommand) {
    // Команды - стандартный порог
    baseThreshold = 15;
    SmartLogger.grammar('Стандартный порог: команда');
  }

  // Контекстная адаптация
  if (category === 'image_generation') {
    if (context.hasRecentImage && grammar.isQuestion) {
      // При наличии изображений и вопросе - очень низкий порог для анализа
      baseThreshold = 6;
      SmartLogger.grammar('Низкий порог: вопрос при наличии изображений');
    } else if (!context.hasRecentImage && grammar.isCommand) {
      // Нет изображений + команда = вероятна генерация
      baseThreshold = 18;
      SmartLogger.grammar('Умеренный порог: команда без изображений');
    }
  } else if (category === 'image_analysis') {
    // Анализ изображений требует более низкого порога при наличии контекста
    if (context.hasRecentImage) {
      baseThreshold = 5;
      SmartLogger.grammar('Очень низкий порог: анализ при наличии изображений');
    } else {
      baseThreshold = 25; // Высокий порог без изображений
      SmartLogger.grammar('Высокий порог: анализ без изображений');
    }
  } else if (category === 'vectorization') {
    // Векторизация - специализированная задача, требует уверенности
    baseThreshold = context.hasRecentImage ? 8 : 20;
    SmartLogger.grammar(`Порог векторизации: ${baseThreshold}% (изображения: ${context.hasRecentImage})`);
  }

  SmartLogger.grammar(`Адаптивный порог для ${category}: ${baseThreshold}%`);
  return baseThreshold;
}

// Сервисы будут импортированы динамически при необходимости

/**
 * Основная функция анализа намерений пользователя
 * Определяет что хочет пользователь и как лучше ответить
 */
async function analyzeUserIntent(userQuery, options = {}) {
  SmartLogger.brain(`Анализирую намерения пользователя: "${userQuery.substring(0, 100)}..."`);

  const query = userQuery.toLowerCase().trim();
  const sessionId = options.sessionId || 'default';

  // ========== ПРОВЕРКА СОСТОЯНИЙ ДИАЛОГА ==========
  // Проверяем, ожидается ли выбор от пользователя
  if (sessionMemory.isAwaitingChoice(sessionId)) {
    SmartLogger.brain(`🎯 [ДИАЛОГ] Проверка состояния: сессия ожидает выбор пользователя`);

    // Проверяем, является ли это сообщение выбором
    if (sessionMemory.isUserChoice(sessionId, userQuery)) {
      SmartLogger.brain(`✅ [ДИАЛОГ] Распознан выбор пользователя, получаем ожидающий запрос`);

      const pendingRequest = sessionMemory.getPendingRequest(sessionId);
      if (pendingRequest) {
        SmartLogger.brain(`🔄 [ДИАЛОГ] Переключаемся на выполнение: ${pendingRequest.category}`);

        // Устанавливаем состояние генерации
        sessionMemory.setGenerating(sessionId, pendingRequest.category);

        // Возвращаем намерение для немедленного выполнения
        return {
          category: pendingRequest.category,
          confidence: 95, // Высокая уверенность при выборе
          grammar: { isCommand: true, tense: 'present' },
          context: { hasRecentImages: false },
          smartThreshold: 5, // Низкий порог для немедленного выполнения
          isChoiceExecution: true, // Специальный флаг
          originalRequest: pendingRequest.request, // Оригинальный запрос пользователя
          userChoice: userQuery // Выбор пользователя
        };
      }
    } else {
      SmartLogger.brain(`❓ [ДИАЛОГ] Сообщение не распознано как выбор, сбрасываем состояние и продолжаем анализ`);
      // ВАЖНО: Если это не выбор, сбрасываем состояние ожидания
      sessionMemory.resetDialogueState(sessionId);
    }
  } else {
    SmartLogger.brain(`✅ [ДИАЛОГ] Состояние диалога: готов к новым запросам`);
  }

  // ЗАГРУЖАЕМ КОНТЕКСТ БЕСЕДЫ И ПАМЯТЬ ПОЛЬЗОВАТЕЛЯ
  let chatContext = null;
  let hasRecentImages = false;
  let userName = null;

  try {
    // Загружаем модуль памяти беседы
    let chatMemory;
    try {
      const chatMemoryModule = await import('./chat-memory.js');
      chatMemory = chatMemoryModule.default || chatMemoryModule;
    } catch (error) {
      SmartLogger.brain(`Ошибка загрузки контекста: ${error.message}`);
      chatMemory = null;
    }

    if (chatMemory) {
      chatContext = await chatMemory.getSessionContext(sessionId, 10);
    }

    // Загружаем модуль памяти разговоров для извлечения имени
    let conversationMemory;
    try {
      const conversationMemoryModule = await import('./conversation-memory.js');
      conversationMemory = conversationMemoryModule.default || conversationMemoryModule;
    } catch (error) {
      SmartLogger.brain(`Ошибка загрузки памяти разговоров: ${error.message}`);
      conversationMemory = null;
    }

    // Извлекаем имя пользователя из контекста беседы
    if (chatContext && chatContext.context) {
      // Проверяем наличие недавних изображений в контексте
      hasRecentImages = chatContext.context.includes('![') || 
                       chatContext.context.includes('https://image.pollinations.ai');

      // Извлекаем имя пользователя из контекста
      const namePatterns = [
        /меня зовут\s+([а-яё]+)/gi,
        /я\s+([а-яё]+)/gi,
        /имя\s+([а-яё]+)/gi
      ];

      for (const pattern of namePatterns) {
        const match = chatContext.context.match(pattern);
        if (match && match[1] && match[1].length > 1) {
          userName = match[1];
          SmartLogger.brain(`Найдено имя пользователя в контексте: ${userName}`);
          break;
        }
      }
    }

    SmartLogger.brain(`Загружен контекст беседы: ${chatContext?.messageCount || 0} сообщений, есть изображения: ${hasRecentImages}, имя пользователя: ${userName || 'не найдено'}`);
  } catch (error) {
    SmartLogger.brain(`Ошибка загрузки контекста: ${error.message}`);
  }

  // ========== СЕМАНТИЧЕСКИЙ АНАЛИЗ ЧЕРЕЗ ИНТЕГРАЦИОННЫЙ СЛОЙ ==========
  // Анализируем запрос через единый семантический слой
  let semanticAnalysisResult = null;
  
  try {
    SmartLogger.brain(`🧠 Запуск семантического анализа через интеграционный слой`);
    semanticAnalysisResult = await semanticIntegrationLayer.analyzeWithSemantics(userQuery, {
      sessionId,
      chatContext,
      hasRecentImages,
      userName
    });

    if (semanticAnalysisResult.shouldUseSemantic) {
      SmartLogger.brain(`✅ Семантика берет управление (уверенность: ${semanticAnalysisResult.confidence}%)`);
      
      // Создаем семантически обогащенный ответ
      const semanticResponse = await semanticIntegrationLayer.createSemanticResponse(
        semanticAnalysisResult.semanticResult,
        userQuery,
        { sessionId, chatContext, hasRecentImages, userName }
      );
      
      if (semanticResponse.success) {
        SmartLogger.brain(`🎯 Семантический ответ создан успешно`);
        return semanticResponse;
      }
    } else {
      SmartLogger.brain(`📋 Семантика передает управление обычной логике (причина: ${semanticAnalysisResult.reason})`);
    }
  } catch (error) {
    SmartLogger.brain(`❌ Ошибка семантического анализа: ${error.message}`);
    semanticAnalysisResult = null;
  }

  // Извлекаем семантический контекст для обогащения
  const semanticContext = semanticAnalysisResult?.semanticResult || options.semanticData;

  // Получаем грамматический анализ, контекст действий и эмоциональный анализ
  const grammar = analyzeGrammar(userQuery);
  const context = actionMemory.getActionContext();
  const emotional = emotionalAnalyzer.analyzeEmotion(userQuery);

  // Получаем пользовательский контекст из памяти сессии
  const userContext = sessionMemory.getUserContext(sessionId);
  const session = sessionMemory.getSession(sessionId);

  // Увеличиваем счетчик сообщений
  session.statistics.messagesCount++;

  // Автоматическое извлечение целей из текста пользователя
  const extractedGoals = sessionMemory.extractGoalsFromText(sessionId, userQuery);

  // СПЕЦИАЛЬНАЯ ПРОВЕРКА: детектор вопросов о прошлом С КОНТЕКСТОМ - ОБЪЯВЛЯЕМ СНАЧАЛА
  const questionAboutPastPatterns = [
    'что ты создал', 'что создал', 'что ты нарисовал', 'что нарисовал',
    'что ты сделал', 'что сделал', 'опиши последнее', 'опиши что',
    'расскажи что ты', 'покажи что ты', 'какое изображение', 'какую картинку'
  ];

  const isQuestionAboutPast = questionAboutPastPatterns.some(pattern => query.includes(pattern));

  // Проверяем, является ли это командой управления памятью
  const memoryCommandMatch = query.match(/^(setusername|set_user_name|addgoal|add_goal|remembertopic|remember_topic|showmemory|show_memory|clearmemory|clear_memory)\s*(.*)/i);


  if (memoryCommandMatch) {
    const [, command, paramString] = memoryCommandMatch;
    const params = paramString ? paramString.split(' ').filter(p => p.length > 0) : [];

    SmartLogger.brain(`Обнаружена команда памяти: ${command}`);

    return {
      category: 'memory_command',
      confidence: 100,
      query: userQuery,
      originalQuery: userQuery,
      command: command,
      params: params,
      grammar: grammar,
      context: context,
      emotional: emotional,
      userContext: userContext,
      smartThreshold: 5
    };
  }

  SmartLogger.brain('Контекст анализа:', { 
    grammar, 
    context, 
    emotional, 
    userContext: userContext.substring(0, 200) + '...',
    extractedGoals: extractedGoals ? extractedGoals.length : 0
  });

  // СПЕЦИАЛЬНАЯ ОБРАБОТКА КОРОТКИХ ОТВЕТОВ С КОНТЕКСТОМ
  const isShortContextualAnswer = query.length <= 25 && chatContext && chatContext.context;

  if (isShortContextualAnswer) {
    SmartLogger.brain(`Обнаружен короткий ответ "${query}" - анализирую контекст для понимания`);

    // НОВАЯ ПРОВЕРКА: является ли это вопросом о памяти?
    const memoryQuestionIndicators = [
      'помнишь', 'что просил', 'что говорил', 'не говорил', 'спросил'
    ];
    
    const isMemoryQuestion = memoryQuestionIndicators.some(indicator => 
      query.toLowerCase().includes(indicator)
    );
    
    if (isMemoryQuestion) {
      SmartLogger.brain(`Обнаружен вопрос о памяти: "${query}" - НЕ генерация изображения`);
      // Принудительно направляем на разговор
      return {
        category: 'conversation',
        confidence: 95,
        query: userQuery,
        originalQuery: userQuery,
        grammar: grammar,
        context: context,
        emotional: emotional,
        smartThreshold: 5,
        forcedCategory: 'memory_question_detected',
        chatContext: chatContext,
        hasRecentImages: hasRecentImages
      };
    }

    // Анализируем последние сообщения для понимания контекста
    const contextLines = chatContext.context.split('\n');
    let foundImageRequest = '';
    let foundChoiceOptions = false;

    // Ищем предложенные варианты в контексте
    for (let i = contextLines.length - 1; i >= 0; i--) {
      const line = contextLines[i].toLowerCase();

      // Ищем варианты выбора
      if (line.includes('вариант') || line.includes('1️⃣') || line.includes('2️⃣') || 
          line.includes('формат') || line.includes('какой')) {
        foundChoiceOptions = true;
        SmartLogger.brain(`Найдены варианты выбора в контексте: "${contextLines[i].substring(0, 100)}..."`);
      }

      // Ищем оригинальный запрос на создание
      if (line.includes('создай') || line.includes('нарисуй') || line.includes('сгенерируй') || 
          line.includes('принт') || line.includes('дизайн')) {
        foundImageRequest = contextLines[i].replace(/^.*?:\s*/, '');
        SmartLogger.brain(`Найден оригинальный запрос: "${foundImageRequest.substring(0, 100)}..."`);
      }
    }

    // Если найдены варианты и пользователь отвечает коротко - это выбор
    if (foundChoiceOptions && (query.includes('вариант') || query.match(/^[12]$/) || 
        query.includes('изображение') || query.includes('просто'))) {

      SmartLogger.brain(`Интерпретирую "${query}" как выбор варианта в контексте создания изображения`);

      // Если есть оригинальный запрос, переформулируем его как команду создания
      if (foundImageRequest && foundImageRequest.length > 10) {
        const enhancedQuery = foundImageRequest;
        SmartLogger.brain(`Переформулирую запрос: "${query}" → "${enhancedQuery}"`);

        // Принудительно направляем на генерацию изображения
        return {
          category: 'image_generation',
          confidence: 95, // Высокая уверенность
          query: enhancedQuery, // Используем расширенный запрос
          originalQuery: userQuery,
          grammar: grammar,
          context: context,
          emotional: emotional,
          smartThreshold: 10, // Низкий порог
          contextuallyEnhanced: true,
          chatContext: chatContext,
          hasRecentImages: hasRecentImages
        };
      }
    }
  }

  // Категории запросов с приоритетами
  const intentCategories = {
    // Высокий приоритет - специфические задачи
    vectorization: {
      priority: 100, // МАКСИМАЛЬНЫЙ приоритет для векторизации
      keywords: [
        'векторизация', 'svg', 'свг', 'вектор', 'векторизуй', 'в вектор', 
        'превратить в svg', 'конвертировать в svg', 'сделай svg', 'сохрани в svg',
        'trace', 'трейс', 'векторный формат', 'vectorize', 'нужен вектор',
        'свг изображение', 'svg файл', 'векторная версия', 'создай svg',
        'сделай вектор', 'создай вектор'
      ],
      confidence: 0,
      negativePatterns: [] // Паттерны исключения
    },

    website_analysis: {
      priority: 88,
      keywords: [
        'проанализируй сайт', 'анализ сайта', 'изучи сайт', 'что на сайте',
        'опиши сайт', 'расскажи о сайте', 'какой сайт', 'информация о сайте',
        'содержимое сайта', 'analyze website', 'website analysis', 'site analysis',
        'разбери сайт', 'посмотри сайт', 'исследуй сайт'
      ],
      confidence: 0,
      negativePatterns: []
    },

    // КАТЕГОРИЯ: Анализ изображений (МАКСИМАЛЬНЫЙ приоритет)
    image_analysis: {
      priority: 100, // КРИТИЧЕСКИЙ приоритет - выше векторизации
      keywords: [
        'проанализируй изображение', 'анализ изображения', 'опиши изображение', 'что на изображении',
        'проанализируй картинку', 'анализ картинки', 'опиши картинку', 'что на картинке',
        'проанализируй фото', 'анализ фото', 'опиши фото', 'что на фото',
        'изучи изображение', 'изучи картинку', 'изучи фото', 'рассмотри изображение',
        'детально изображение', 'подробно изображение', 'подробнее изображение',
        'analyze image', 'describe image', 'what in image', 'image analysis',
        'проанализируй', 'анализируй', 'анализ', 'опиши', 'рассмотри', 'изучи', 'детально', 'подробно', 'подробнее',
        'что это за изображение', 'что здесь изображено', 'что показано на изображении',
        'расскажи об изображении', 'опиши что видишь', 'что ты видишь на изображении'
      ],
      confidence: 0,
      negativePatterns: [
        // Исключаем только явные команды создания НОВОГО
        'создай новое изображение', 'нарисуй новое изображение', 'сгенерируй новое изображение',
        'новое изображение', 'новую картинку', 'создать новое', 'сделай новую картинку',
        'generate new image', 'create new image', 'draw new image'
      ],
      // КРИТИЧЕСКИ ВАЖНО: требует наличие изображений в контексте
      requiresContext: true,
      contextCheck: () => hasSessionImages,
      // НОВОЕ: специальные модификаторы для анализа
      analysisModifiers: {
        withImages: true,
        requiresExistingContent: true,
        excludesCreation: true
      }
    },

    // КАТЕГОРИЯ: Редактирование изображений
    image_editing: {
      priority: 90, // СНИЖЕН приоритет, чтобы анализ и векторизация имели преимущество
      keywords: [
        'измени', 'поменяй', 'убери', 'удали', 'добавь', 'включи', 'добавь эффект',
        'перекрась', 'покрась', 'раскрась', 'цвет', 'красный', 'синий', 'зеленый',
        'глаза', 'волосы', 'одежда', 'фон', 'размер', 'яркость', 'контраст',
        'эффект', 'шум', 'цифровой шум', 'текстура', 'улучши', 'модифицируй',
        'edit', 'change', 'modify', 'remove', 'add', 'color', 'eyes', 'hair', 'effect', 'noise'
      ],
      confidence: 0,
      negativePatterns: [
        // Исключаем только явные команды создания нового
        'создай новый', 'нарисуй новый', 'сгенерируй новый', 'сделай новый',
        'новое изображение', 'новую картинку', 'новый рисунок',
        // КРИТИЧЕСКИ ВАЖНО: исключаем все векторные команды
        'нужен вектор', 'векторизация', 'svg', 'свг', 'вектор', 'векторизуй',
        'в вектор', 'превратить в svg', 'конвертировать в svg', 'сделай svg',
        'trace', 'трейс', 'векторный формат', 'vectorize',
        // КРИТИЧЕСКИ ВАЖНО: исключаем команды анализа
        'проанализируй', 'анализ', 'опиши', 'что на изображении', 'рассмотри'
      ],
      // Требует наличие изображений в контексте
      requiresContext: true,
      contextCheck: () => hasSessionImages // Используем обновленную переменную
    },

    image_generation: {
      priority: 75, // СНИЖЕН приоритет, чтобы анализ и векторизация имели преимущество
      keywords: ['нарисуй', 'создай изображение', 'создай картинку', 'создай рисунок', 'сгенерируй изображение', 'нарисуй мне', 'сделай изображение', 'новое изображение', 'picture', 'draw', 'create image', 'generate image'],
      confidence: 0,
      negativePatterns: [
        // КРИТИЧЕСКИ ВАЖНО: исключаем все команды анализа изображений
        'проанализируй изображение', 'анализ изображения', 'опиши изображение',
        'проанализируй картинку', 'анализ картинки', 'опиши картинку',
        'проанализируй фото', 'анализ фото', 'опиши фото',
        'изучи изображение', 'изучи картинку', 'рассмотри изображение',
        'детально изображение', 'подробно изображение', 'подробнее изображение',
        'проанализируй подробнее', 'анализируй подробнее', 'рассмотри подробнее',
        'что это за изображение', 'что здесь изображено', 'что показано на изображении',
        'расскажи об изображении', 'опиши что видишь', 'что ты видишь на изображении',
        'analyze image', 'describe image', 'what in image', 'image analysis',
        
        // Исключения для вопросов о прошлом - КОНТЕКСТНЫЕ
        'что ты создал', 'что создал', 'что ты нарисовал', 'что нарисовал',
        'какое изображение', 'какую картинку', 'какой рисунок',
        'последнее изображение', 'предыдущее изображение', 'созданное изображение',
        'покажи что', 'расскажи что', 'объясни что',
        
        // НОВЫЕ паттерны для вопросов о памяти
        'помнишь что', 'помнишь что-то', 'что я просил', 'что просил',
        'что я говорил', 'что говорил', 'ты помнишь', 'вспомни что',
        'не говорил создавать', 'я спросил', 'я не говорил',
        'просил создать тебя', 'что просил создать', 'помнишь просил',
        
        // КРИТИЧЕСКИЕ паттерны для ответов на предложения
        'оптимизируя для печати', 'оптимизация для печати', 'для печати на ткани',
        'печать на ткани', 'подготовка к печати', 'готовлю к печати',
        'адаптирую для печати', 'настраиваю для печати',
        
        // Общие ответы на предложения
        'да, так', 'именно так', 'правильно', 'согласен', 'подтверждаю',
        'это то что нужно', 'подходит', 'хорошо', 'отлично'
      ],
      // НОВОЕ: контекстные модификаторы
      contextModifiers: {
        hasRecentImages: hasRecentImages,
        isQuestionWithImages: isQuestionAboutPast && hasRecentImages
      }
    },

    image_consultation: {
      priority: 80, // Высокий приоритет для консультационных запросов об изображениях
      keywords: ['предложи варианты', 'покажи варианты', 'варианты цветов', 'цветовые решения', 'как улучшить', 'дай совет', 'предложения', 'рекомендации', 'альтернативы', 'suggest variants', 'color options', 'recommendations'],
      confidence: 0,
      negativePatterns: [
        // Исключаем команды создания нового изображения
        'создай новое', 'нарисуй новое', 'сгенерируй новое', 'сделай новое',
        'создай другое', 'нарисуй другое', 'сгенерируй другое'
      ],
      contextModifiers: {
        hasRecentImages: hasRecentImages, // Консультации имеют смысл только при наличии изображений
        requiresContext: true
      }
    },

    embroidery: {
      priority: 85,
      keywords: ['вышивка', 'вышить', 'dst', 'pes', 'jef', 'exp', 'вышивальная машина', 'embroidery'],
      confidence: 0,
      negativePatterns: []
    },

    // Средний приоритет - информационные запросы
    web_search: {
      priority: 70,
      keywords: ['что такое', 'найди', 'поищи', 'когда', 'где', 'кто', 'как', 'почему', 'погода', 'новости', 'курс', 'цена'],
      confidence: 0,
      negativePatterns: []
    },

    time_date: {
      priority: 80,
      keywords: ['время', 'час', 'дата', 'число', 'сегодня', 'вчера', 'завтра'],
      confidence: 0,
      negativePatterns: []
    },

    // Низкий приоритет - обычное общение
    conversation: {
      priority: 20,
      keywords: ['привет', 'как дела', 'спасибо', 'пока', 'хорошо', 'плохо', 'да', 'нет'],
      confidence: 0,
      negativePatterns: []
    }
  };

  // КОНТЕКСТНАЯ ПРОВЕРКА - ищем изображения ТОЛЬКО в контексте чата
  let hasSessionImages = false;
  
  // ПРИОРИТЕТ: Проверяем контекст беседы
  if (chatContext && chatContext.context) {
    hasSessionImages = chatContext.context.includes('![') || 
                     chatContext.context.includes('https://image.pollinations.ai');
    SmartLogger.brain(`Поиск изображений в контексте беседы: найдено ${hasSessionImages ? 'ДА' : 'НЕТ'}`);
  } else {
    SmartLogger.brain(`Контекст беседы недоступен, изображения не найдены`);
  }

  SmartLogger.brain(`ИТОГО: Найдены изображения в сессии: ${hasSessionImages}`);

  // Если это вопрос о прошлом с изображениями в сессии - отвечаем о созданном
  if (isQuestionAboutPast && hasSessionImages) {
    SmartLogger.brain(`ОБНАРУЖЕН ВОПРОС О ПРОШЛОМ С ИЗОБРАЖЕНИЯМИ В СЕССИИ! Это точно НЕ генерация`);
    return {
      category: 'conversation',
      confidence: 98,
      query: userQuery,
      originalQuery: userQuery,
      grammar: grammar,
      context: context,
      smartThreshold: 5, // очень низкий порог
      forcedCategory: 'question_about_past_with_context',
      chatContext: chatContext
    };
  } else if (isQuestionAboutPast && !hasSessionImages) {
    SmartLogger.brain('ВОПРОС О ПРОШЛОМ БЕЗ НЕДАВНИХ ИЗОБРАЖЕНИЙ - может быть и генерация');
    // Позволяем продолжить анализ с повышенным порогом для генерации
  }

  // Вычисляем уверенность для каждой категории
  for (const [category, data] of Object.entries(intentCategories)) {
    let matches = 0;
    let negativeMatches = 0;
    let totalKeywords = data.keywords.length;

    // Проверяем положительные совпадения
    for (const keyword of data.keywords) {
      if (query.includes(keyword)) {
        matches++;
      }
    }

    // Проверяем негативные паттерны (исключения)
    for (const negativePattern of data.negativePatterns) {
      if (query.includes(negativePattern)) {
        negativeMatches++;
        SmartLogger.brain(`Найден негативный паттерн для ${category}: "${negativePattern}"`);
      }
    }

    // СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ АНАЛИЗА ИЗОБРАЖЕНИЙ (ВЫСШИЙ ПРИОРИТЕТ)
    if (category === 'image_analysis') {
      // Проверяем наличие контекста изображений
      if (data.requiresContext && data.contextCheck) {
        const hasRequiredContext = data.contextCheck();
        if (!hasRequiredContext) {
          // Если нет изображений в контексте - обнуляем уверенность
          SmartLogger.brain(`[АНАЛИЗ] Нет контекста изображений - анализ невозможен`);
          data.confidence = 0;
          continue;
        } else {
          SmartLogger.brain(`[АНАЛИЗ] Найден контекст изображений - КРИТИЧЕСКИЙ приоритет анализу`);
          // КРИТИЧЕСКИЙ бонус за наличие контекста изображений и команды анализа
          matches += 15; // МАКСИМАЛЬНОЕ увеличение совпадений
          data.confidence += 95; // КРИТИЧЕСКИЙ бонус к базовой уверенности
          
          // Дополнительная проверка на специфические команды анализа
          if (query.includes('подробнее') || query.includes('детально') || query.includes('проанализируй')) {
            data.confidence += 30; // Дополнительный бонус за детальные команды
            SmartLogger.brain(`[АНАЛИЗ] Обнаружена команда детального анализа - максимальный приоритет`);
          }
        }
      }
    }

    // СПЕЦИАЛЬНАЯ ЛОГИКА ДЛЯ РЕДАКТИРОВАНИЯ ИЗОБРАЖЕНИЙ
    if (category === 'image_editing') {
      // Проверяем наличие контекста изображений
      if (data.requiresContext && data.contextCheck) {
        const hasRequiredContext = data.contextCheck();
        if (!hasRequiredContext) {
          // Если нет изображений в контексте - сильно снижаем уверенность
          SmartLogger.brain(`[РЕДАКТИРОВАНИЕ] Нет контекста изображений - снижаем уверенность`);
          data.confidence = 0;
          continue;
        } else {
          SmartLogger.brain(`[РЕДАКТИРОВАНИЕ] Найден контекст изображений - применяем МАКСИМАЛЬНЫЙ бонус`);
          // КРИТИЧЕСКИЙ бонус за наличие контекста изображений и команды редактирования
          matches += 10; // Увеличиваем количество совпадений для гарантированного приоритета
          data.confidence += 80; // МАКСИМАЛЬНЫЙ бонус к базовой уверенности
          
          // Дополнительная проверка на конкретные команды редактирования цвета
          if (query.includes('глаза') && (query.includes('красн') || query.includes('цвет'))) {
            data.confidence += 20; // Дополнительный бонус за конкретную команду
            SmartLogger.brain(`[РЕДАКТИРОВАНИЕ] Обнаружена команда изменения цвета глаз - критический приоритет`);
          }
        }
      }
    }

    // Базовая уверенность от совпадений
    data.confidence = matches > 0 ? (matches / totalKeywords) * 100 : 0;

    // Применяем сбалансированные штрафы за негативные паттерны
    if (negativeMatches > 0) {
      // Умеренный штраф вместо критического
      const basePenalty = Math.min(negativeMatches * 25, 60); // Максимум 60% штраф
      
      // Дополнительные факторы для более точного штрафа
      let adjustedPenalty = basePenalty;
      
      // Если есть много позитивных совпадений, уменьшаем штраф
      if (matches >= 2) {
        adjustedPenalty = basePenalty * 0.6; // Снижаем штраф на 40%
        SmartLogger.brain(`Снижен штраф благодаря ${matches} позитивным совпадениям`);
      }
      
      // Для категории анализа изображений - более мягкие штрафы
      if (category === 'image_analysis' && hasSessionImages) {
        adjustedPenalty = basePenalty * 0.4; // Критическое снижение при наличии изображений
        SmartLogger.brain(`Мягкий штраф для анализа изображений при наличии контекста`);
      }
      
      data.confidence = Math.max(0, data.confidence - adjustedPenalty);
      SmartLogger.brain(`Применен сбалансированный штраф ${adjustedPenalty.toFixed(1)}% за негативные паттерны в категории ${category}`);
    }

    // Грамматические модификаторы
    if (matches > 0) {
      // Сбалансированные правила для генерации изображений
      if (category === 'image_generation') {
        if (grammar.isQuestion && grammar.tense === 'past' && hasSessionImages) {
          // "что ты создал?" + есть недавние изображения = снижаем, но не критически
          data.confidence = Math.max(10, data.confidence - 50); // Оставляем минимум 10%
          SmartLogger.brain('Умеренный штраф: вопрос о прошлом + есть изображения: -50%');
        } else if (grammar.isQuestion && grammar.tense === 'past') {
          // "что ты создал?" без недавних изображений - легкий штраф
          data.confidence = Math.max(15, data.confidence - 25);
          SmartLogger.brain('Легкий штраф за вопрос о прошлом без изображений: -25%');
        } else if (grammar.isQuestion && hasRecentImages && !query.includes('создай') && !query.includes('нарисуй')) {
          // Вопрос при наличии изображений, но БЕЗ команд создания
          data.confidence = Math.max(5, data.confidence - 35);
          SmartLogger.brain('Умеренный штраф за чистый вопрос при наличии изображений: -35%');
        } else if (grammar.isCommand && !grammar.isQuestion) {
          // Четкая команда - всегда бонус
          const bonus = hasRecentImages ? 25 : 35;
          data.confidence += bonus;
          SmartLogger.brain(`Бонус за четкую команду: +${bonus}%`);
        }
      }

      // Общие грамматические бонусы
      if (matches > 0) {
        // Бонус за количество совпадений
        data.confidence += Math.min(matches * 15, 60);

        // Дополнительный бонус для поисковых запросов
        if (category === 'web_search' && matches >= 1) {
          data.confidence += 30;
        }

        // Бонус за длину совпадающих ключевых слов
        const totalMatchLength = data.keywords
          .filter(keyword => query.includes(keyword))
          .reduce((sum, keyword) => sum + keyword.length, 0);

        if (totalMatchLength > 10) {
          data.confidence += 20;
        }
      }
    }

    // Ограничиваем максимальную уверенность
    data.confidence = Math.min(100, Math.max(0, data.confidence));
  }

  // Находим категорию с наивысшим приоритетом и уверенностью
  let bestCategory = 'conversation';
  let bestScore = 0;
  let bestConfidence = 0;

  for (const [category, data] of Object.entries(intentCategories)) {
    const score = data.priority * (1 + data.confidence / 100);
    if (score > bestScore && data.confidence > 0) {
      bestScore = score;
      bestCategory = category;
      bestConfidence = data.confidence;
    }
  }

  // СИСТЕМА ВОССТАНОВЛЕНИЯ: если все категории заблокированы штрафами
  if (bestConfidence === 0 || bestScore === 0) {
    SmartLogger.brain('Все категории заблокированы штрафами, применяю систему восстановления');
    
    // Ищем категорию с наибольшим количеством совпадений до штрафов
    let recoveryCategory = 'conversation';
    let maxMatches = 0;
    
    for (const [category, data] of Object.entries(intentCategories)) {
      const matches = data.keywords.filter(keyword => query.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        recoveryCategory = category;
      }
    }
    
    if (maxMatches > 0) {
      bestCategory = recoveryCategory;
      bestConfidence = Math.min(maxMatches * 15, 40); // Восстановленная уверенность
      SmartLogger.brain(`Восстановлена категория ${recoveryCategory} с уверенностью ${bestConfidence}%`);
    }
  }

  // Вычисляем умный порог для найденной категории
  const smartThreshold = calculateSmartThreshold(grammar, context, bestCategory);

  SmartLogger.brain(`Лучшая категория: ${bestCategory} (уверенность: ${bestConfidence}%, порог: ${smartThreshold}%)`);

  // Если уверенность ниже умного порога, используем AI анализ
  if (bestScore === 0 || bestConfidence < smartThreshold) {
    SmartLogger.brain(`Уверенность ${bestConfidence}% ниже порога ${smartThreshold}%, используем AI анализ`);
    bestCategory = await analyzeWithAI(userQuery);
    bestConfidence = 50; // Среднее значение для AI анализа
  }

  SmartLogger.brain(`Финальная категория: ${bestCategory} (уверенность: ${bestConfidence}%)`);

  // ========== ОБОГАЩЕНИЕ СЕМАНТИЧЕСКИМИ ДАННЫМИ (ИНТЕГРИРОВАННОЕ) ==========
  let enhancedResult = {
    category: bestCategory,
    confidence: bestConfidence,
    query: userQuery,
    originalQuery: userQuery,
    grammar: grammar,
    context: context,
    emotional: emotional,
    smartThreshold: smartThreshold,
    chatContext: chatContext,
    hasRecentImages: hasRecentImages,
    userName: userName
  };

  // Интегрируем семантические данные если они доступны
  if (semanticContext && !semanticContext.error) {
    SmartLogger.brain(`🔗 Полная интеграция семантических данных в анализ намерений`);
    
    // КРИТИЧЕСКАЯ ИНТЕГРАЦИЯ: Семантические данные влияют на категоризацию
    const semanticCluster = semanticContext.semantic_analysis?.semantic_cluster;
    if (semanticCluster && semanticCluster.confidence > 60) {
      const semanticCategory = this.mapSemanticClusterToCategory(semanticCluster.name);
      if (semanticCategory && semanticContext.confidence > bestConfidence + 15) {
        SmartLogger.brain(`🎯 СЕМАНТИЧЕСКОЕ ПЕРЕОПРЕДЕЛЕНИЕ: ${bestCategory} → ${semanticCategory}`);
        SmartLogger.brain(`📊 Семантическая уверенность: ${semanticContext.confidence}% > обычная: ${bestConfidence}%`);
        
        enhancedResult.category = semanticCategory;
        enhancedResult.confidence = semanticContext.confidence;
        enhancedResult.semanticOverride = true;
        enhancedResult.originalCategory = bestCategory;
      }
    }

    // Обогащаем результат полным семантическим контекстом
    enhancedResult.semanticContext = {
      project: semanticContext.current_project,
      predictions: semanticContext.predictions?.slice(0, 3) || [],
      enhanced_prompt: semanticContext.enhanced_prompt,
      confidence: semanticContext.confidence,
      recommendations: semanticContext.system_recommendations || [],
      semantic_cluster: semanticCluster,
      compatibility: semanticContext.compatibility
    };

    // Улучшенный промпт с приоритетом
    if (semanticContext.enhanced_prompt && semanticContext.enhanced_prompt !== userQuery) {
      enhancedResult.enhancedQuery = semanticContext.enhanced_prompt;
      enhancedResult.query = semanticContext.enhanced_prompt; // Используем улучшенный как основной
      SmartLogger.brain(`✨ Промпт заменен семантическим: "${semanticContext.enhanced_prompt.substring(0, 50)}..."`);
    }

    // Корректировка умного порога на основе семантики
    if (semanticContext.confidence > 70) {
      enhancedResult.smartThreshold = Math.max(5, enhancedResult.smartThreshold - 10);
      SmartLogger.brain(`🎯 Умный порог снижен благодаря семантической уверенности: ${enhancedResult.smartThreshold}%`);
    }
  }

  return enhancedResult;

  return enhancedResult;
}

/**
 * AI-анализ для сложных или неоднозначных запросов
 */
async function analyzeWithAI(userQuery) {
  try {
    const analysisPrompt = `Проанализируй этот запрос пользователя и определи его тип:

Запрос: "${userQuery}"

Возможные типы:
- web_search: если нужна актуальная информация из интернета
- image_generation: если нужно создать/нарисовать НОВОЕ изображение
- image_consultation: если просит совет, варианты, рекомендации по СУЩЕСТВУЮЩЕМУ изображению
- vectorization: если нужно конвертировать изображение в векторный формат
- embroidery: если связано с вышивкой или файлами для вышивальных машин
- time_date: если спрашивает время или дату
- conversation: если это обычное общение

Ответь только одним словом - типом запроса.`;

    let pythonProvider;
    try {
      pythonProvider = require('./python_provider_routes.js');
    } catch (error) {
      SmartLogger.brain(`AI анализ недоступен: ${error.message}`);
      pythonProvider = null;
    }

    const result = pythonProvider ? await pythonProvider.callPythonAI(analysisPrompt, 'Qwen_Qwen_2_72B') : null;

    if (result && typeof result === 'string') {
      const aiCategory = result.trim().toLowerCase();
      if (['web_search', 'image_generation', 'image_consultation', 'vectorization', 'embroidery', 'time_date', 'conversation'].includes(aiCategory)) {
        SmartLogger.brain(`AI определил категорию: ${aiCategory}`);
        return aiCategory;
      }
    }
  } catch (error) {
    SmartLogger.brain(`Ошибка AI анализа: ${error.message}`);
  }

  return 'conversation';
}

/**
 * Создание плана действий на основе намерений
 */
async function createActionPlan(intent, options = {}) {
  SmartLogger.plan(`Создаю план для категории: ${intent.category}`);

  const plans = {
    web_search: {
      steps: [
        'search_web',
        'analyze_results', 
        'format_response'
      ],
      description: 'Поиск актуальной информации и анализ результатов'
    },

    image_generation: {
      steps: [
        'optimize_prompt',
        'generate_image',
        'format_response'
      ],
      description: 'Генерация изображения по описанию'
    },

    // ПЛАН: Анализ изображений
    image_analysis: {
      steps: [
        'find_last_image',
        'analyze_image_content',
        'format_detailed_response'
      ],
      description: 'Детальный анализ содержимого изображения'
    },

    // ПЛАН: Редактирование изображений
    image_editing: {
      steps: [
        'find_last_image',
        'edit_image',
        'format_response'
      ],
      description: 'Редактирование существующего изображения'
    },

    vectorization: {
      steps: [
        'find_last_image',
        'vectorize_image',
        'format_response'
      ],
      description: 'Конвертация изображения в векторный формат'
    },

    website_analysis: {
      steps: [
        'extract_url',
        'fetch_website_content',
        'analyze_structure',
        'format_response'
      ],
      description: 'Точный анализ веб-сайта с загрузкой реального контента'
    },

    embroidery: {
      steps: [
        'find_last_image',
        'convert_to_embroidery',
        'format_response'
      ],
      description: 'Конвертация в форматы для вышивки'
    },

    time_date: {
      steps: [
        'get_current_time',
        'format_response'
      ],
      description: 'Получение текущего времени и даты'
    },

    conversation: {
      steps: [
        'generate_conversation_response'
      ],
      description: 'Обычное общение с пользователем'
    },

    memory_command: {
      steps: [
        'execute_memory_command'
      ],
      description: 'Выполнение команд управления памятью'
    }
  };

  const plan = plans[intent.category] || plans.conversation;

  // Определяем должен ли план выполняться на основе умного порога
  const shouldExecute = intent.confidence >= (intent.smartThreshold || 15);

  SmartLogger.plan(`План создан: ${plan.description}`, { 
    steps: plan.steps, 
    shouldExecute,
    confidence: intent.confidence,
    threshold: intent.smartThreshold 
  });

  return {
    category: intent.category,
    steps: plan.steps,
    description: plan.description,
    shouldExecute: shouldExecute,
    confidence: intent.confidence,
    grammar: intent.grammar,
    context: intent.context,
    emotional: intent.emotional,
    chatContext: intent.chatContext, // Передаем контекст беседы
    hasRecentImages: intent.hasRecentImages, // И флаг изображений
    contextuallyEnhanced: intent.contextuallyEnhanced, // Флаг контекстуального улучшения
    originalQuery: intent.originalQuery, // Оригинальный запрос
    query: intent.query, // Возможно улучшенный запрос
    userName: intent.userName // Передаем имя пользователя
  };
}

/**
 * Выполнение плана действий
 */
async function executePlan(plan, userQuery, options = {}) {
  SmartLogger.execute(`Выполняю план: ${plan.description}`);

  try {
    let result = { success: false, shouldFallback: true };

    // Передаем полный контекст включая семантические данные
    const enhancedOptions = {
      ...options,
      emotional: plan.emotional,
      chatContext: plan.chatContext,
      hasRecentImages: plan.hasRecentImages,
      contextuallyEnhanced: plan.contextuallyEnhanced,
      originalQuery: plan.originalQuery,
      query: plan.query || userQuery,
      userName: plan.userName,
      semanticData: options.semanticData || plan.semanticContext, // Приоритет внешним данным
      isChoiceExecution: plan.isChoiceExecution,
      userChoice: plan.userChoice
    };

    switch (plan.category) {
      case 'web_search':
        result = await executeWebSearchPlan(userQuery, enhancedOptions);
        break;

      case 'image_generation':
        result = await executeImageGenerationPlan(userQuery, enhancedOptions);
        break;

      case 'image_analysis':
        result = await executeImageAnalysisPlan(userQuery, enhancedOptions);
        break;

      case 'image_editing':
        result = await executeImageEditingPlan(userQuery, enhancedOptions);
        break;

      case 'vectorization':
        result = await executeVectorizationPlan(userQuery, enhancedOptions);
        break;

      case 'website_analysis':
        result = await executeWebsiteAnalysisPlan(userQuery, enhancedOptions);
        break;

      case 'embroidery':
        result = await executeEmbroideryPlan(userQuery, enhancedOptions);
        break;

      case 'time_date':
        result = await executeTimeDatePlan(userQuery, enhancedOptions);
        break;

      case 'conversation':
        result = await executeConversationPlan(userQuery, enhancedOptions);
        break;

      case 'memory_command':
        result = await executeMemoryCommandPlan(plan, userQuery, enhancedOptions);
        break;

      default:
        result = { success: false, shouldFallback: true };
    }

    // Сохраняем успешные действия в память
    if (result.success) {
      const actionToSave = {
        category: plan.category,
        query: userQuery,
        response: result.response?.substring(0, 200) + '...' || 'Success',
        imageUrl: result.imageUrl || null,
        confidence: plan.confidence,
        grammar: plan.grammar
      };

      actionMemory.saveAction(actionToSave);
    }

    // ОБОГАЩЕНИЕ СЕМАНТИЧЕСКИМИ ДАННЫМИ
    if (result.success && semanticAnalysisResult?.semanticResult) {
      SmartLogger.brain(`🔗 Обогащаем стандартный ответ семантическими данными`);
      
      const enrichedResult = semanticIntegrationLayer.enrichStandardResponse(
        result, 
        semanticAnalysisResult.semanticResult
      );
      
      if (enrichedResult && enrichedResult !== result) {
        SmartLogger.brain(`✨ Ответ успешно обогащен семантическими данными`);
        return enrichedResult;
      }
    }

    return result;
  } catch (error) {
    SmartLogger.execute(`Ошибка выполнения плана: ${error.message}`);
    return { success: false, shouldFallback: true, error: error.message };
  }
}

/**
 * Выполнение плана веб-поиска
 */
async function executeWebSearchPlan(userQuery, options) {
  SmartLogger.execute(`Выполняю веб-поиск для: "${userQuery}"`);

  const reasons = [];
  reasons.push(`Определил запрос "${userQuery}" как поисковый`);

  try {
    let webSearchProvider;
    try {
      const webSearchProviderModule = await import('./web-search-provider.js');
      webSearchProvider = webSearchProviderModule.default || webSearchProviderModule;
    } catch (error) {
      SmartLogger.execute(`Веб-поиск недоступен: ${error.message}`);
      return { success: false, shouldFallback: true, reason: `Поиск недоступен: ${error.message}` };
    }

    reasons.push('Использую продвинутый веб-поиск для получения актуальной информации');

    const searchResult = await webSearchProvider.performAdvancedSearch(userQuery, {
      language: 'ru',
      maxResults: 8,
      includeAIProcessing: true
    });

    if (searchResult.success && searchResult.aiProcessedAnswer) {
      let response = searchResult.aiProcessedAnswer;

      reasons.push('AI обработал результаты поиска и сформировал структурированный ответ');

      // Применяем эмоциональную адаптацию
      if (options.emotional) {
        response = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional, 
          response, 
          'web_search'
        );
        reasons.push(`Адаптировал ответ под эмоциональное состояние: ${options.emotional.dominantEmotion}`);
      }

      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: response,
        provider: 'IntelligentWebSearchEmotional',
        category: 'web_search',
        searchUsed: true,
        sources: searchResult.sources?.slice(0, 3) || [],
        emotionalTone: options.emotional?.overallTone || 'neutral',
        reason: finalReason
      };
    }

    reasons.push('Поиск не дал релевантных результатов, перехожу к стандартной логике');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${reasons.join(' → ')}`);
    return { success: false, shouldFallback: true, reason: reasons.join(' → ') };
  } catch (error) {
    reasons.push(`Ошибка поиска: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

/**
 * Выполнение плана генерации изображений
 */
async function executeImageGenerationPlan(userQuery, options) {
  SmartLogger.execute(`Выполняю генерацию изображения для: "${userQuery}"`);

  const reasons = [];
  const sessionId = options.sessionId || 'default';

  // ========== ГЛУБОКАЯ ИНТЕГРАЦИЯ СЕМАНТИЧЕСКИХ ДАННЫХ ==========
  let enhancedPrompt = userQuery;
  let semanticContext = '';
  let semanticStyle = null;
  
  if (options.semanticData) {
    SmartLogger.execute(`🔗 Глубокая интеграция семантических данных в генерацию изображений`);
    
    // ПРИОРИТЕТ 1: Семантически улучшенный промпт
    if (options.semanticData.enhanced_prompt && options.semanticData.enhanced_prompt !== userQuery) {
      enhancedPrompt = options.semanticData.enhanced_prompt;
      SmartLogger.execute(`✨ Применен семантически улучшенный промпт: "${enhancedPrompt.substring(0, 50)}..."`);
      reasons.push('Применен семантически обогащенный промпт');
    }
    
    // ПРИОРИТЕТ 2: Семантический стиль из кластера
    const semanticCluster = options.semanticData.semantic_cluster;
    if (semanticCluster) {
      switch (semanticCluster.name) {
        case 'branding':
        case 'signage_design':
          semanticStyle = 'print';
          reasons.push('Семантический стиль: print (на основе брендинга)');
          break;
        case 'apparel_design':
          semanticStyle = 'print';
          reasons.push('Семантический стиль: print (на основе одежды)');
          break;
        case 'character_design':
          semanticStyle = 'cartoon';
          reasons.push('Семантический стиль: cartoon (на основе персонажа)');
          break;
        case 'image_creation':
          semanticStyle = 'realistic';
          reasons.push('Семантический стиль: realistic (на основе создания изображения)');
          break;
      }
    }
    
    // ПРИОРИТЕТ 3: Контекст проекта с детализацией
    if (options.semanticData.current_project) {
      const project = options.semanticData.current_project;
      semanticContext = `\n\n📋 **Контекст проекта**: ${project.title}`;
      
      if (project.concept) {
        semanticContext += `\n💡 **Концепция**: ${project.concept}`;
      }
      
      if (project.progress?.goals && project.progress.goals.length > 0) {
        const goals = project.progress.goals.slice(0, 2).join(', ');
        semanticContext += `\n🎯 **Цели проекта**: ${goals}`;
      }
      
      // Добавляем стиль проекта к промпту
      if (project.concept && !enhancedPrompt.includes(project.concept)) {
        enhancedPrompt = `${enhancedPrompt} in the style of ${project.concept}`;
        reasons.push(`Добавлен стиль проекта в промпт: ${project.concept}`);
      }
      
      reasons.push(`Добавлен полный контекст проекта: ${project.title}`);
    }
    
    // ПРИОРИТЕТ 4: Предсказания следующих шагов
    if (options.semanticData.predictions && options.semanticData.predictions.length > 0) {
      const topPrediction = options.semanticData.predictions[0];
      if (topPrediction.probability > 0.6) {
        semanticContext += `\n\n🔮 **Следующий шаг**: ${topPrediction.description}`;
        reasons.push(`Добавлено предсказание следующего шага`);
      }
    }

    // ПРИОРИТЕТ 5: Системные рекомендации
    if (options.semanticData.recommendations && options.semanticData.recommendations.length > 0) {
      const highPriorityRec = options.semanticData.recommendations.find(r => r.priority === 'high');
      if (highPriorityRec) {
        semanticContext += `\n\n⚡ **Рекомендация**: ${highPriorityRec.message}`;
        reasons.push(`Добавлена системная рекомендация высокого приоритета`);
      }
    }
  }

  // ========== ОБРАБОТКА ВЫБОРА ПОЛЬЗОВАТЕЛЯ ==========
  if (options.isChoiceExecution && options.originalRequest) {
    SmartLogger.execute(`🎯 [ДИАЛОГ] Обрабатываю выбор пользователя: "${options.userChoice}"`);
    SmartLogger.execute(`📋 [ДИАЛОГ] Оригинальный запрос: "${options.originalRequest}"`);

    reasons.push(`Пользователь сделал выбор: "${options.userChoice}" для запроса: "${options.originalRequest}"`);

    // Комбинируем оригинальный запрос с выбором пользователя
    let enhancedPrompt = options.originalRequest;

    // Анализируем выбор пользователя для определения стиля
    const userChoice = options.userChoice.toLowerCase();
    let chosenStyle = 'realistic'; // по умолчанию

    if (userChoice.includes('принт') || userChoice.includes('футболка') || userChoice.includes('печат')) {
      chosenStyle = 'print';
      enhancedPrompt += ' в стиле для печати на ткани';
      reasons.push('Определен стиль "принт" на основе выбора пользователя');
    } else if (userChoice.includes('художествен') || userChoice.includes('артист') || userChoice.includes('живопис')) {
      chosenStyle = 'artistic';
      enhancedPrompt += ' в художественном стиле';
      reasons.push('Определен художественный стиль на основе выбора пользователя');
    } else if (userChoice.includes('мультяшн') || userChoice.includes('cartoon') || userChoice.includes('аниме')) {
      chosenStyle = 'cartoon';
      enhancedPrompt += ' в мультипликационном стиле';
      reasons.push('Определен мультипликационный стиль на основе выбора пользователя');
    } else {
      reasons.push('Использую реалистичный стиль как выбор пользователя');
    }

    SmartLogger.execute(`🎨 [ДИАЛОГ] Финальный промпт: "${enhancedPrompt}"`);
    SmartLogger.execute(`🖌️ [ДИАЛОГ] Выбранный стиль: ${chosenStyle}`);

    // Генерируем изображение напрямую без дополнительных проверок
    const aiImageGenerator = require('./ai-image-generator.js');
    reasons.push('Запускаю генерацию изображения по выбору пользователя');

    const imageResult = await aiImageGenerator.generateImage(enhancedPrompt, {
      style: chosenStyle,
      quality: 'high'
    });

    if (imageResult.success && imageResult.imageUrl) {
      reasons.push('Изображение успешно сгенерировано по выбору пользователя');

      // Сохраняем артефакт в семантическую память
      try {
        await semanticMemory.addArtifactWithContext(sessionId, {
          type: 'image',
          url: imageResult.imageUrl,
          description: enhancedPrompt,
          style: chosenStyle,
          metadata: {
            original_request: options.originalRequest,
            user_choice: options.userChoice,
            generation_type: 'choice_execution'
          }
        });
        SmartLogger.execute(`💾 Артефакт сохранен в семантическую память проекта`);
      } catch (error) {
        SmartLogger.execute(`⚠️ Ошибка сохранения в семантическую память: ${error.message}`);
      }

      // Сбрасываем состояние диалога в готовность
      sessionMemory.resetDialogueState(sessionId);

      const baseResponse = `✨ Создано изображение по вашему выбору!

![Сгенерированное изображение](${imageResult.imageUrl})

🎨 **Стиль:** ${chosenStyle === 'print' ? 'Для печати' : chosenStyle === 'artistic' ? 'Художественный' : chosenStyle === 'cartoon' ? 'Мультипликационный' : 'Реалистичный'}
📐 **Размер:** 1024x1024
🖼️ **Качество:** Высокое

🎯 **Исходный запрос:** ${options.originalRequest}
✅ **Ваш выбор:** ${options.userChoice}`;

      let finalResponse = baseResponse + semanticContext;
      if (options.emotional) {
        finalResponse = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional,
          finalResponse,
          'image_generation'
        );
      }

      // Добавляем проактивные предложения семантической памяти
      try {
        const suggestions = await semanticMemory.getProactiveSuggestions(sessionId, {
          hasRecentImages: true,
          lastAction: 'image_generation'
        });

        if (suggestions && suggestions.length > 0) {
          finalResponse += `\n\n💡 **Возможно, вас заинтересует:**\n`;
          suggestions.slice(0, 2).forEach(suggestion => {
            finalResponse += `${suggestion.message}\n`;
          });
        }
      } catch (error) {
        SmartLogger.execute(`⚠️ Ошибка получения проактивных предложений: ${error.message}`);
      }

      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: finalResponse,
        provider: 'DialogueChoiceImageGeneration',
        category: 'image_generation',
        imageUrl: imageResult.imageUrl,
        style: chosenStyle,
        originalRequest: options.originalRequest,
        userChoice: options.userChoice,
        reason: finalReason
      };
    } else {
      reasons.push('Ошибка генерации изображения по выбору пользователя');
      sessionMemory.resetDialogueState(sessionId);
      return { success: false, shouldFallback: true, reason: reasons.join(' → ') };
    }
  }

  // ========== КРИТИЧЕСКАЯ ПРОВЕРКА: РЕДАКТИРОВАНИЕ VS СОЗДАНИЕ ==========
  
  // ПРОВЕРЯЕМ НАЛИЧИЕ ИЗОБРАЖЕНИЙ В КОНТЕКСТЕ ПЕРЕД isSimpleRequest
  if (hasSessionImages) {
    SmartLogger.execute(`🔍 НАЙДЕНЫ ИЗОБРАЖЕНИЯ В КОНТЕКСТЕ - проверяем на команды редактирования`);
    
    // Расширенные паттерны команд редактирования
    const editingPatterns = [
      'измени', 'поменяй', 'убери', 'удали', 'добавь', 'включи', 'добавь эффект',
      'перекрась', 'покрась', 'раскрась', 'цвет', 'эффект', 'шум', 'цифровой шум',
      'текстура', 'улучши', 'модифицируй', 'сделай', 'примени'
    ];
    
    const isEditingCommand = editingPatterns.some(pattern => 
      userQuery.toLowerCase().includes(pattern)
    );
    
    if (isEditingCommand) {
      SmartLogger.execute(`✅ КОМАНДА РЕДАКТИРОВАНИЯ ОБНАРУЖЕНА: "${userQuery}"`);
      reasons.push('Обнаружена команда редактирования существующего изображения');
      
      // ПРИНУДИТЕЛЬНО НАПРАВЛЯЕМ НА РЕДАКТИРОВАНИЕ
      return await executeImageEditingPlan(userQuery, options);
    }
  }

  // ========== ОБЫЧНАЯ ЛОГИКА ГЕНЕРАЦИИ ==========
  reasons.push(`Распознал запрос "${userQuery}" как команду создания изображения`);

  try {
    // ========== ПРОВЕРКА: НУЖНЫ ЛИ ВАРИАНТЫ ИЛИ СРАЗУ ГЕНЕРИРОВАТЬ ==========

    // Проверяем, есть ли в запросе конкретные указания на стиль
    const hasSpecificStyle = userQuery.toLowerCase().includes('принт') || 
                            userQuery.toLowerCase().includes('футболка') ||
                            userQuery.toLowerCase().includes('реалистич') ||
                            userQuery.toLowerCase().includes('художественн') ||
                            userQuery.toLowerCase().includes('мультяшн') ||
                            userQuery.toLowerCase().includes('cartoon') ||
                            userQuery.toLowerCase().includes('векторн');

    // Проверяем, является ли запрос простым и нуждается ли в уточнении
    const isSimpleRequest = userQuery.split(' ').length <= 5 && !hasSpecificStyle && !hasSessionImages;

    if (isSimpleRequest && !options.isChoiceExecution) {
      SmartLogger.execute(`🤔 [ДИАЛОГ] Простой запрос без указания стиля, предлагаю варианты`);
      reasons.push('Запрос простой, предлагаю варианты стилей пользователю');

      // Создаем ответ с предложением вариантов
      const baseResponse = `🎨 Отличная идея! Вижу, что вы хотите создать: **${userQuery}**

Давайте определим стиль для наилучшего результата:

🖌️ **Выберите стиль:**
1️⃣ **Реалистичный** - фотографическое качество, детализированный
2️⃣ **Для печати** - яркий, контрастный, подходит для принтов на ткани
3️⃣ **Художественный** - творческий, стилизованный, как картина
4️⃣ **Мультипликационный** - яркий, простой, в стиле мультфильмов

💬 **Просто напишите**: "принт", "реалистичный", "художественный" или "мультяшный"
🎯 **Или скажите**: "создай принт" / "сделай реалистично" и я сразу приступлю к генерации!`;

      let finalResponse = baseResponse + semanticContext;
      if (options.emotional) {
        finalResponse = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional,
          finalResponse,
          'image_generation'
        );
      }

      // Устанавливаем состояние ожидания выбора
      sessionMemory.setAwaitingChoice(sessionId, 'image_generation', userQuery, {
        styles: ['realistic', 'print', 'artistic', 'cartoon'],
        responseTime: Date.now()
      });

      reasons.push('Установлено состояние ожидания выбора стиля от пользователя');
      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: finalResponse,
        provider: 'DialogueOptionsProvider',
        category: 'image_generation',
        awaitingChoice: true,
        pendingRequest: userQuery,
        reason: finalReason
      };
    }

    SmartLogger.execute(`🎯 [ДИАЛОГ] Запрос содержит конкретные указания или это продолжение, генерирую напрямую`);
    reasons.push('Запрос содержит конкретные указания стиля, генерирую изображение напрямую');

    // Анализируем контекст беседы для получения полного описания
    let enhancedPrompt = userQuery;

    // ПРИОРИТЕТ 1: Интеграция имени пользователя из контекста
    if (options.userName && (userQuery.includes('персональн') || userQuery.includes('с именем') || userQuery.includes('дизайн'))) {
      enhancedPrompt = userQuery.replace(/с именем\s*$/, `с именем "${options.userName}"`);
      if (!enhancedPrompt.includes(options.userName)) {
        enhancedPrompt += ` с именем "${options.userName}"`;
      }
      reasons.push(`Добавлено имя пользователя "${options.userName}" в промпт для персонализации`);
      SmartLogger.execute(`Персонализация промпта с именем: "${options.userName}"`);
    }

    // Проверяем, был ли это контекстуально улучшенный запрос
    if (options.contextuallyEnhanced && options.originalQuery !== options.query) {
      enhancedPrompt = options.query; // Используем уже улучшенный запрос
      reasons.push(`Использую контекстуально улучшенный запрос: "${enhancedPrompt.substring(0, 50)}..."`);
      SmartLogger.execute(`Применяю контекстуальное улучшение: "${enhancedPrompt}"`);
    } else if (options.chatContext && options.chatContext.context) {
      // Ищем предыдущие упоминания о том, что нужно создать
      const contextLines = options.chatContext.context.split('\n');
      let foundImageRequest = '';

      for (let i = contextLines.length - 1; i >= 0; i--) {
        const line = contextLines[i].toLowerCase();
        if (line.includes('создай') || line.includes('нарисуй') || line.includes('сгенерируй') || 
            line.includes('принт') || line.includes('дизайн')) {
          // Найдена предыдущая команда генерации, извлекаем её
          const originalLine = contextLines[i];
          if (originalLine.includes('техно') || originalLine.includes('панда') || 
              originalLine.includes('самурай') || originalLine.includes('дракон') ||
              originalLine.length > userQuery.length * 2) { // Любой длинный запрос на создание
            foundImageRequest = originalLine.replace(/^.*?:\s*/, ''); // Убираем префикс "User:" или "AI:"
            break;
          }
        }
      }

      if (foundImageRequest && foundImageRequest.length > userQuery.length) {
        enhancedPrompt = foundImageRequest;
        reasons.push(`Использую расширенный контекст из беседы: "${foundImageRequest.substring(0, 50)}..."`);
        SmartLogger.execute(`Найден контекст в беседе: "${foundImageRequest}"`);
      }
    }

    // Определяем стиль с приоритетом семантическим данным
    let style = semanticStyle || 'realistic';
    
    if (!semanticStyle) {
      // Обычная логика определения стиля
      const fullPrompt = enhancedPrompt.toLowerCase();
      if (fullPrompt.includes('принт') || fullPrompt.includes('футболка') || fullPrompt.includes('логотип')) {
        style = 'print';
        reasons.push('Определил стиль "print" на основе ключевых слов (принт/футболка/логотип)');
      } else if (fullPrompt.includes('мультяшн') || fullPrompt.includes('cartoon')) {
        style = 'cartoon';
        reasons.push('Определил стиль "cartoon" на основе ключевых слов');
      } else if (fullPrompt.includes('художественн') || fullPrompt.includes('артистич')) {
        style = 'artistic';
        reasons.push('Определил стиль "artistic" на основе ключевых слов');
      } else {
        reasons.push('Использую стиль "realistic" по умолчанию');
      }
    } else {
      SmartLogger.execute(`🎨 Использую семантический стиль: ${semanticStyle}`);
    }

    // Используем улучшенную систему промптов с контекстом
    reasons.push('Применяю систему улучшения промптов: очистка → перевод → оптимизация');
    const finalPrompt = await promptEnhancer.enhancePrompt(enhancedPrompt, style);

    // Используем require для загрузки CommonJS модуля  
    const aiImageGenerator = require('./ai-image-generator.js');
    reasons.push('Использую AI генератор изображений Pollinations.ai');

    const imageResult = await aiImageGenerator.generateImage(finalPrompt, {
      style: style,
      quality: 'high'
    });

    if (imageResult.success && imageResult.imageUrl) {
      reasons.push('Изображение успешно сгенерировано, формирую детальный ответ с метаданными');

      // Сохраняем артефакт в семантическую память
      try {
        await semanticMemory.addArtifactWithContext(sessionId, {
          type: 'image',
          url: imageResult.imageUrl,
          description: finalPrompt,
          style: style,
          metadata: {
            generation_type: 'direct_generation',
            enhanced_query: options.enhancedQuery || userQuery,
            semantic_context: options.semanticContext?.project?.concept || 'general'
          }
        });
        SmartLogger.execute(`💾 Артефакт сохранен в семантическую память проекта`);
      } catch (error) {
        SmartLogger.execute(`⚠️ Ошибка сохранения в семантическую память: ${error.message}`);
      }

      let baseResponse = `✨ Изображение создано с улучшенным промптом! 

![Сгенерированное изображение](${imageResult.imageUrl})

🎨 **Стиль:** ${style === 'realistic' ? 'Реалистичный' : style === 'print' ? 'Для печати' : style === 'cartoon' ? 'Мультипликационный' : 'Художественный'}
📐 **Размер:** 1024x1024
🖼️ **Качество:** Высокое
🔧 **Промпт улучшен:** Да

💡 **Применены улучшения:**
• Очистка от лишних слов
• Перевод на английский
• Добавление технических деталей
• Оптимизация для качества

Если нужно что-то изменить, просто опишите что хотите поправить.`;

      // Применяем эмоциональную адаптацию если есть эмоциональный контекст
      if (options.emotional) {
        baseResponse = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional, 
          baseResponse, 
          'image_generation'
        );
        reasons.push(`Адаптировал ответ под эмоцию пользователя: ${options.emotional.dominantEmotion}`);
      }

      // Добавляем проактивные предложения семантической памяти
      try {
        const suggestions = await semanticMemory.getProactiveSuggestions(sessionId, {
          hasRecentImages: true,
          lastAction: 'image_generation'
        });

        if (suggestions && suggestions.length > 0) {
          baseResponse += `\n\n💡 **Возможно, вас заинтересует:**\n`;
          suggestions.slice(0, 2).forEach(suggestion => {
            baseResponse += `${suggestion.message}\n`;
          });
          reasons.push('Добавлены проактивные предложения семантической памяти');
        }
      } catch (error) {
        SmartLogger.execute(`⚠️ Ошибка получения проактивных предложений: ${error.message}`);
      }

      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: baseResponse,
        provider: 'IntelligentImageGeneratorEnhanced',
        category: 'image_generation',
        imageGenerated: true,
        imageUrl: imageResult.imageUrl,
        enhancedPrompt: finalPrompt,
        originalPrompt: enhancedPrompt,
        contextUsed: enhancedPrompt !== userQuery,
        detectedStyle: style,
        emotionalTone: options.emotional?.overallTone || 'neutral',
        reason: finalReason
      };
    }

    reasons.push('Генерация изображения не удалась, перехожу к стандартной логике');
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  } catch (error) {
    reasons.push(`Ошибка генерации: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

/**
 * Система улучшения промптов для генерации изображений
 */
const promptEnhancer = {
  /**
   * Очистка промпта от лишних слов и повторов
   */
  cleanPrompt(prompt) {
    SmartLogger.execute(`Очистка промпта: "${prompt.substring(0, 50)}..."`);

    let cleaned = prompt.toLowerCase().trim();

    // Удаляем команды генерации
    const generationCommands = [
      'создай изображение', 'нарисуй', 'сгенерируй', 'сделай картинку',
      'создай картинку', 'покажи', 'изобрази', 'нарисуй мне'
    ];

    generationCommands.forEach(command => {
      cleaned = cleaned.replace(new RegExp(`\\b${command}\\b`, 'gi'), '');
    });

    // Удаляем лишние слова-паразиты
    const fillerWords = [
      'пожалуйста', 'можешь', 'хочу', 'мне нужно', 'давай',
      'сделай так чтобы', 'я хочу', 'мне бы', 'было бы неплохо'
    ];

    fillerWords.forEach(filler => {
      cleaned = cleaned.replace(new RegExp(`\\b${filler}\\b`, 'gi'), '');
    });

    // Убираем множественные "и"
    cleaned = cleaned.replace(/\s+и\s+и\s+/g, ' и ');
    cleaned = cleaned.replace(/\s+и\s+и\s+/g, ' и ');

    // Убираем повторяющиеся слова
    const words = cleaned.split(/\s+/);
    const uniqueWords = [];
    const seenWords = new Set();

    for (const word of words) {
      if (word && word.length > 2 && !seenWords.has(word)) {
        uniqueWords.push(word);
        seenWords.add(word);
      } else if (word && word.length <= 2) {
        uniqueWords.push(word); // Короткие слова не фильтруем
      }
    }

    cleaned = uniqueWords.join(' ').trim();

    // Убираем лишние пробелы и знаки препинания
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/[,;.!?]+/g, ',');
    cleaned = cleaned.replace(/,+/g, ',');
    cleaned = cleaned.replace(/^,|,$/, '');

    SmartLogger.execute(`Промпт очищен: "${cleaned}"`);
    return cleaned;
  },

  /**
   * Простой перевод ключевых слов с русского на английский
   */
  translateToEnglish(prompt) {
    SmartLogger.execute(`Перевод промпта: "${prompt.substring(0, 50)}..."`);

    // Расширенный словарь перевода
    const translations = {
      // Объекты и существа
      'кот': 'cat', 'кота': 'cat', 'котик': 'cute cat', 'котенок': 'kitten',
      'собака': 'dog', 'собаку': 'dog', 'щенок': 'puppy',
      'человек': 'person', 'мужчина': 'man', 'женщина': 'woman',
      'девушка': 'young woman', 'парень': 'young man',
      'дракон': 'dragon', 'дракона': 'dragon',
      'робот': 'robot', 'робота': 'robot',
      'машина': 'car', 'автомобиль': 'automobile',
      'дом': 'house', 'здание': 'building',
      'цветок': 'flower', 'цветы': 'flowers',
      'дерево': 'tree', 'деревья': 'trees',
      'роза': 'rose', 'розы': 'roses',

      // Цвета
      'красный': 'red', 'красная': 'red', 'красное': 'red',
      'синий': 'blue', 'синяя': 'blue', 'синее': 'blue',
      'зеленый': 'green', 'зеленая': 'green', 'зеленое':'green',

      'желтый': 'yellow', 'желтая': 'yellow', 'желтое': 'yellow',
      'черный': 'black', 'черная': 'black', 'черное': 'black',
      'белый': 'white', 'белая': 'white', 'белое': 'white',
      'розовый': 'pink', 'розовая': 'pink', 'розовое': 'pink',
      'фиолетовый': 'purple', 'фиолетовая': 'purple',

      // Стили и характеристики
      'красивый': 'beautiful', 'красивая': 'beautiful', 'красивое': 'beautiful',
      'большой': 'large', 'большая': 'large', 'большое': 'large',
      'маленький': 'small', 'маленькая': 'small', 'маленькое': 'small',
      'яркий': 'bright', 'яркая': 'bright', 'яркое': 'bright',
      'темный': 'dark', 'темная': 'dark', 'темное': 'dark',
      'реалистичный': 'realistic', 'реалистичная': 'realistic',
      'мультяшный': 'cartoon style', 'мультипликационный': 'animated style',

      // Места и окружение
      'лес': 'forest', 'в лесу': 'in forest',
      'море': 'ocean', 'у моря': 'by the ocean',
      'горы': 'mountains', 'в горах': 'in mountains',
      'город': 'city', 'в городе': 'in city',
      'космос': 'space', 'в космосе': 'in space',
      'небо': 'sky', 'облака': 'clouds',

      // Техника и предметы
      'принт': 'print design', 'дизайн': 'design',
      'футболка': 't-shirt', 'одежда': 'clothing',
      'логотип': 'logo', 'эмблема': 'emblem',
      'сапоги': 'boots', 'в сапогах': 'wearing boots',

      // Действия и состояния
      'стоит': 'standing', 'сидит': 'sitting',
      'летит': 'flying', 'бежит': 'running',
      'улыбается': 'smiling', 'грустный': 'sad',

      // Качество и детали
      'детально': 'detailed', 'детальный': 'highly detailed',
      'качественно': 'high quality', 'профессионально': 'professional',
      'четко': 'sharp', 'четкий': 'sharp and clear'
    };

    let translated = prompt;

    // Переводим по словарю (сначала длинные фразы, потом короткие)
    const sortedTranslations = Object.entries(translations)
      .sort(([a], [b]) => b.length - a.length);

    for (const [russian, english] of sortedTranslations) {
      const regex = new RegExp(`\\b${russian}\\b`, 'gi');
      translated = translated.replace(regex, english);
    }

    SmartLogger.execute(`Промпт переведен: "${translated}"`);
    return translated;
  },

  /**
   * Добавление технических деталей и улучшений
   */
  addEnhancements(prompt, style = 'realistic') {
    SmartLogger.execute(`Добавление улучшений к промпту, стиль: ${style}`);

    let enhanced = prompt;

    // Базовые улучшения качества
    const qualityEnhancements = [
      'high quality', 'detailed', 'sharp focus', 'well-lit'
    ];

    // Стилевые улучшения в зависимости от типа
    const styleEnhancements = {
      realistic: [
        'photorealistic', 'hyperrealistic', 'professional photography',
        'studio lighting', 'natural colors', 'lifelike details'
      ],
      cartoon: [
        'cartoon style', 'animated', 'colorful', 'clean lines',
        'vibrant colors', 'stylized'
      ],
      artistic: [
        'artistic', 'creative', 'expressive', 'aesthetic',
        'beautiful composition', 'artistic lighting'
      ],
      print: [
        'vector style', 'clean lines', 'bold colors', 
        'print-ready', 'high contrast', 'simple shapes'
      ]
    };

    // Определяем стиль на основе содержимого
    let detectedStyle = style;
    if (prompt.includes('print') || prompt.includes('t-shirt') || prompt.includes('logo')) {
      detectedStyle = 'print';
    } else if (prompt.includes('cartoon') || prompt.includes('animated')) {
      detectedStyle = 'cartoon';
    } else if (prompt.includes('art') || prompt.includes('creative')) {
      detectedStyle = 'artistic';
    }

    // Добавляем улучшения
    const selectedEnhancements = [
      ...qualityEnhancements,
      ...(styleEnhancements[detectedStyle] || styleEnhancements.realistic)
    ];

    // Проверяем, что улучшения еще не добавлены
    const missingEnhancements = selectedEnhancements.filter(enhancement => 
      !enhanced.toLowerCase().includes(enhancement.toLowerCase())
    );

    if (missingEnhancements.length > 0) {
      enhanced = `${enhanced}, ${missingEnhancements.slice(0, 4).join(', ')}`;
    }

    SmartLogger.execute(`Промпт улучшен: "${enhanced.substring(0, 100)}..."`);
    return enhanced;
  },

  /**
   * Полная обработка промпта
   */
  async enhancePrompt(userQuery, style = 'realistic') {
    SmartLogger.execute(`=== НАЧАЛО УЛУЧШЕНИЯ ПРОМПТА ===`);
    SmartLogger.execute(`Исходный запрос: "${userQuery}"`);

    try {
      // Шаг 1: Очистка
      let processed = this.cleanPrompt(userQuery);

      // Шаг 2: Перевод
      processed = this.translateToEnglish(processed);

      // Шаг 3: Добавление деталей
      processed = this.addEnhancements(processed, style);

      // Шаг 4: AI-оптимизация (если доступна)
      try {
        const aiOptimized = await this.getAIOptimization(processed, style);
        if (aiOptimized && aiOptimized.length > processed.length) {
          processed = aiOptimized;
          SmartLogger.execute(`AI оптимизация применена`);
        }
      } catch (aiError) {
        SmartLogger.execute(`AI оптимизация недоступна: ${aiError.message}`);
      }

      // Финальная очистка
      processed = processed.replace(/\s+/g, ' ').trim();
      processed = processed.replace(/,+/g, ',');
      processed = processed.replace(/^,|,$/, '');

      SmartLogger.execute(`=== ПРОМПТ УЛУЧШЕН ===`);
      SmartLogger.execute(`Финальный результат: "${processed}"`);

      return processed;
    } catch (error) {
      SmartLogger.execute(`Ошибка улучшения промпта: ${error.message}`);
      return userQuery; // Возвращаем оригинал при ошибке
    }
  },

  /**
   * AI-оптимизация промпта (опциональная)
   */
  async getAIOptimization(prompt, style) {
    const optimizationPrompt = `Improve this image generation prompt for ${style} style:

"${prompt}"

Make it more detailed and specific for AI image generation. Focus on:
- Visual composition and framing
- Lighting and atmosphere  
- Colors and mood
- Technical quality

Return only the improved prompt, no explanations.`;

    let pythonProvider;
    try {
      const pythonProviderModule = await import('./python_provider_routes.js');
      pythonProvider = pythonProviderModule.default || pythonProviderModule;
    } catch (error) {
      SmartLogger.execute(`AI оптимизация недоступна: ${error.message}`);
      return prompt; // Возвращаем исходный промпт если AI недоступен
    }

    const result = pythonProvider ? await pythonProvider.callPythonAI(optimizationPrompt, 'Qwen_Qwen_2_72B') : null;

    if (result && typeof result === 'string') {
      return result.trim();
    }

    throw new Error('AI optimization failed');
  }
};

/**
 * Оптимизация промпта для генерации изображений
 */
async function optimizeImagePrompt(userQuery) {
  try {
    // Используем новую систему улучшения промптов
    const enhanced = await promptEnhancer.enhancePrompt(userQuery, 'realistic');
    SmartLogger.execute(`Промпт оптимизирован: ${enhanced.substring(0, 100)}...`);
    return enhanced;
  } catch (error) {
    SmartLogger.execute(`Ошибка оптимизации промпта: ${error.message}`);
    return userQuery;
  }
}

/**
 * Выполнение плана анализа изображений
 */
async function executeImageAnalysisPlan(userQuery, options) {
  SmartLogger.execute(`Выполняю анализ изображения для: "${userQuery}"`);

  const reasons = [];
  const sessionId = options.sessionId || 'default';

  reasons.push(`Распознал запрос "${userQuery}" как команду анализа изображения`);

  try {
    // Ищем последнее изображение в контексте чата
    const lastImageInfo = findLastImageInContext(options.chatContext);
    
    let lastImageUrl = null;
    let lastImageDescription = '';

    if (lastImageInfo) {
      lastImageUrl = lastImageInfo.url;
      lastImageDescription = lastImageInfo.description;
      reasons.push(`Найдено изображение в контексте для анализа: ${lastImageDescription}`);
    }

    if (!lastImageUrl) {
      reasons.push('Изображение для анализа не найдено');
      let response = '❌ Не найдено изображений для анализа в текущей беседе. Сначала создайте или загрузите изображение, затем я смогу его проанализировать.';

      // Применяем эмоциональную адаптацию
      if (options.emotional) {
        response = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional, 
          response, 
          'image_analysis'
        );
        reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
      }

      const finalReason = reasons.join(' → ');
      return { 
        success: true, 
        response: response,
        provider: 'IntelligentImageAnalyzer',
        category: 'image_analysis',
        reason: finalReason
      };
    }

    reasons.push('Запускаю анализ изображения через AI Vision');

    // Используем продвинутый анализатор изображений
    let imageAnalyzer;
    try {
      imageAnalyzer = require('./advanced-image-analyzer.js');
    } catch (error) {
      SmartLogger.execute(`Анализатор изображений недоступен: ${error.message}`);
      reasons.push('Анализатор изображений недоступен, используем базовый ответ');
      
      let response = `🔍 Анализирую изображение: ${lastImageDescription}

📷 **Изображение найдено**: Да
🔗 **URL**: ${lastImageUrl}
📋 **Описание**: ${lastImageDescription}

⚠️ К сожалению, детальный анализ временно недоступен, но изображение успешно обнаружено в беседе.

💡 **Что я вижу**: Это изображение было создано ранее в нашей беседе с описанием "${lastImageDescription}".`;

      if (options.emotional) {
        response = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional, 
          response, 
          'image_analysis'
        );
      }

      const finalReason = reasons.join(' → ');
      return {
        success: true,
        response: response,
        provider: 'IntelligentImageAnalyzerBasic',
        category: 'image_analysis',
        imageUrl: lastImageUrl,
        reason: finalReason
      };
    }

    // Выполняем детальный анализ
    const analysisResult = await imageAnalyzer.analyzeImageAdvanced(lastImageUrl, {
      includeObjects: true,
      includeColors: true,
      includeComposition: true,
      language: 'ru'
    });

    if (analysisResult.success) {
      reasons.push('Детальный анализ изображения выполнен успешно');

      let response = `🔍 **Детальный анализ изображения**

![Анализируемое изображение](${lastImageUrl})

${analysisResult.response}

📋 **Исходное описание**: ${lastImageDescription}
🔗 **Источник**: Создано в текущей беседе
🤖 **Анализатор**: ${analysisResult.provider}

💡 **Дополнительные возможности**: Если нужно отредактировать это изображение, просто скажите что изменить (например, "измени цвет глаз на голубой").`;

      // Применяем эмоциональную адаптацию
      if (options.emotional) {
        response = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional, 
          response, 
          'image_analysis'
        );
        reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
      }

      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: response,
        provider: 'IntelligentImageAnalyzerAdvanced',
        category: 'image_analysis',
        imageUrl: lastImageUrl,
        analysisData: analysisResult.analysisData,
        emotionalTone: options.emotional?.overallTone || 'neutral',
        reason: finalReason
      };
    }

    reasons.push('Детальный анализ не удался, используем базовый ответ');
    let response = `🔍 **Анализ изображения**

![Анализируемое изображение](${lastImageUrl})

📷 **Найденное изображение**: ${lastImageDescription}
🔗 **URL**: ${lastImageUrl}

📋 **Базовый анализ**: Это изображение было создано в нашей беседе. Для более детального анализа системы временно недоступны.

💡 Если нужно отредактировать изображение, просто опишите желаемые изменения.`;

    if (options.emotional) {
      response = emotionalAnalyzer.generateEmotionalResponse(
        options.emotional, 
        response, 
        'image_analysis'
      );
    }

    const finalReason = reasons.join(' → ');
    return {
      success: true,
      response: response,
      provider: 'IntelligentImageAnalyzerFallback',
      category: 'image_analysis',
      imageUrl: lastImageUrl,
      reason: finalReason
    };

  } catch (error) {
    reasons.push(`Ошибка анализа: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

/**
 * НОВАЯ ФУНКЦИЯ: Поиск последнего изображения в контексте чата
 */
function findLastImageInContext(chatContext) {
  if (!chatContext || !chatContext.context) {
    SmartLogger.execute(`❌ Контекст чата недоступен для поиска изображений`);
    return null;
  }

  const context = chatContext.context;
  SmartLogger.execute(`🔍 Ищем изображения в контексте (${context.length} символов)`);

  // Ищем последнее изображение Pollinations.ai
  const pollinationsMatches = context.match(/https:\/\/image\.pollinations\.ai\/prompt\/[^\s\)]+/g);
  if (pollinationsMatches && pollinationsMatches.length > 0) {
    const lastUrl = pollinationsMatches[pollinationsMatches.length - 1];
    SmartLogger.execute(`✅ Найдено изображение Pollinations: ${lastUrl.substring(0, 80)}...`);
    
    // Попытка извлечь описание из URL
    try {
      const promptMatch = lastUrl.match(/prompt\/([^?]+)/);
      const description = promptMatch ? decodeURIComponent(promptMatch[1]) : 'Сгенерированное изображение';
      
      return {
        url: lastUrl,
        description: description,
        source: 'pollinations'
      };
    } catch (error) {
      return {
        url: lastUrl,
        description: 'Сгенерированное изображение',
        source: 'pollinations'
      };
    }
  }

  // Ищем markdown изображения
  const markdownMatches = context.match(/!\[([^\]]*)\]\(([^\)]+)\)/g);
  if (markdownMatches && markdownMatches.length > 0) {
    const lastMatch = markdownMatches[markdownMatches.length - 1];
    const urlMatch = lastMatch.match(/!\[([^\]]*)\]\(([^\)]+)\)/);
    if (urlMatch) {
      SmartLogger.execute(`✅ Найдено markdown изображение: ${urlMatch[2]}`);
      return {
        url: urlMatch[2],
        description: urlMatch[1] || 'Изображение',
        source: 'markdown'
      };
    }
  }

  SmartLogger.execute(`❌ Изображения в контексте не найдены`);
  return null;
}

/**
 * Выполнение плана редактирования изображений
 */
async function executeImageEditingPlan(userQuery, options) {
  SmartLogger.execute(`Выполняю редактирование изображения для: "${userQuery}"`);

  const reasons = [];
  const sessionId = options.sessionId || 'default';

  reasons.push(`Распознал запрос "${userQuery}" как команду редактирования изображения`);

  try {
    // Ищем последнее изображение в контексте чата
    const lastImageInfo = findLastImageInContext(options.chatContext);
    
    let lastImageUrl = null;
    let lastImageDescription = '';

    if (lastImageInfo) {
      lastImageUrl = lastImageInfo.url;
      lastImageDescription = lastImageInfo.description;
      reasons.push(`Найдено изображение в контексте для редактирования: ${lastImageDescription}`);
    }

    if (!lastImageUrl) {
      reasons.push('Изображение для редактирования не найдено');
      const finalReason = reasons.join(' → ');
      return { 
        success: true, 
        response: '❌ Для редактирования нужно сначала создать изображение. Попробуйте сказать "создай [описание]" и потом я смогу его отредактировать.',
        provider: 'IntelligentImageEditor',
        reason: finalReason
      };
    }

    reasons.push('Запускаю систему редактирования изображений');

    // ПРИОРИТЕТ 1: Попробуем продвинутый редактор изображений
    try {
      const advancedImageEditor = require('./advanced-image-editor.js');
      SmartLogger.execute(`🔧 Пробуем продвинутый редактор для: "${userQuery}"`);
      
      const editResult = await advancedImageEditor.processAdvancedEdit(lastImageUrl, userQuery);
      
      if (editResult.success) {
        reasons.push('Использован продвинутый редактор изображений');
        
        let response = `🎨 Изображение отредактировано с помощью продвинутого редактора!

![Отредактированное изображение](${editResult.imageUrl})

🔧 **Операция:** ${editResult.type}
📝 **Описание:** ${editResult.message || editResult.description}
📸 **Основа:** ${lastImageDescription}
🛠️ **Технология:** ${editResult.provider || 'Advanced Image Editor'}

💡 **Возможности редактора:**
• Точное удаление объектов
• Изменение цветов и текстур  
• Добавление новых элементов
• Применение эффектов и фильтров

Если нужны дополнительные правки, просто опишите что изменить!`;

        // Применяем эмоциональную адаптацию
        if (options.emotional) {
          response = emotionalAnalyzer.generateEmotionalResponse(
            options.emotional, 
            response, 
            'image_editing'
          );
          reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
        }

        const finalReason = reasons.join(' → ');
        SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

        return {
          success: true,
          response: response,
          provider: 'AdvancedImageEditor',
          category: 'image_editing',
          editedImageUrl: editResult.imageUrl,
          originalImageUrl: lastImageUrl,
          editCommand: userQuery,
          editType: editResult.type,
          emotionalTone: options.emotional?.overallTone || 'neutral',
          reason: finalReason
        };
      }
    } catch (error) {
      SmartLogger.execute(`⚠️ Продвинутый редактор недоступен: ${error.message}`);
      reasons.push('Продвинутый редактор недоступен, пробуем альтернативы');
    }

    // ПРИОРИТЕТ 2: Попробуем реальный редактор изображений
    try {
      const realImageEditor = require('./real-image-editor.cjs');
      SmartLogger.execute(`🔧 Пробуем реальный редактор для: "${userQuery}"`);
      
      const editResult = await realImageEditor.editImageReally(lastImageUrl, userQuery, null);
      
      if (editResult.success) {
        reasons.push('Использован реальный редактор изображений');
        
        let response = `🎨 Изображение отредактировано с помощью реального редактора!

![Отредактированное изображение](${editResult.imageUrl})

🔧 **Операция:** ${editResult.editType}
📝 **Описание:** ${editResult.description}
📸 **Основа:** ${lastImageDescription}
🛠️ **Технология:** Real Image Editor (Sharp.js)

💡 **Реальная обработка пикселей:**
• Прямая работа с изображением
• Точные алгоритмы редактирования
• Сохранение качества
• Профессиональные результаты

Если нужны дополнительные правки, просто опишите что изменить!`;

        // Применяем эмоциональную адаптацию
        if (options.emotional) {
          response = emotionalAnalyzer.generateEmotionalResponse(
            options.emotional, 
            response, 
            'image_editing'
          );
          reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
        }

        const finalReason = reasons.join(' → ');
        SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

        return {
          success: true,
          response: response,
          provider: 'RealImageEditor',
          category: 'image_editing',
          editedImageUrl: editResult.imageUrl,
          originalImageUrl: lastImageUrl,
          editCommand: userQuery,
          editType: editResult.editType,
          emotionalTone: options.emotional?.overallTone || 'neutral',
          reason: finalReason
        };
      }
    } catch (error) {
      SmartLogger.execute(`⚠️ Реальный редактор недоступен: ${error.message}`);
      reasons.push('Реальный редактор недоступен, переходим к AI генератору');
    }

    // FALLBACK: Используем AI генератор в режиме редактирования
    reasons.push('Используем AI генератор в режиме редактирования как fallback');
    const aiImageGenerator = require('./ai-image-generator.js');

    // Создаем объект предыдущего изображения
    const previousImage = {
      url: lastImageUrl,
      description: lastImageDescription
    };

    const imageResult = await aiImageGenerator.generateImage(userQuery, 'realistic', previousImage, sessionId);

    if (imageResult.success && imageResult.imageUrl) {
      reasons.push('Изображение успешно отредактировано');

      // Сохраняем артефакт в семантическую память
      try {
        await semanticMemory.addArtifactWithContext(sessionId, {
          type: 'image_edit',
          url: imageResult.imageUrl,
          original_url: lastImageUrl,
          description: userQuery,
          original_description: lastImageDescription,
          metadata: {
            edit_type: 'intelligent_edit',
            edit_command: userQuery
          }
        });
        SmartLogger.execute(`💾 Артефакт редактирования сохранен в семантическую память`);
      } catch (error) {
        SmartLogger.execute(`⚠️ Ошибка сохранения в семантическую память: ${error.message}`);
      }

      let response = `✨ Изображение отредактировано с помощью интеллектуального процессора!

![Отредактированное изображение](${imageResult.imageUrl})

🔧 **Изменения:** ${userQuery}
📸 **Основа:** ${lastImageDescription}
🎨 **Стиль:** Реалистичный
📐 **Размер:** 1024x1024
🖼️ **Качество:** Высокое

💡 **Интеллектуальная обработка:**
• Автоматически найдено последнее изображение
• Применены запрошенные изменения
• Сохранен контекст оригинального изображения

Если нужны дополнительные правки, просто опишите что изменить!`;

      // Применяем эмоциональную адаптацию
      if (options.emotional) {
        response = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional, 
          response, 
          'image_editing'
        );
        reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
      }

      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: response,
        provider: 'IntelligentImageEditorIntegrated',
        category: 'image_editing',
        editedImageUrl: imageResult.imageUrl,
        originalImageUrl: lastImageUrl,
        editCommand: userQuery,
        emotionalTone: options.emotional?.overallTone || 'neutral',
        reason: finalReason
      };
    }

    reasons.push('Редактирование изображения не удалось, переход к стандартной логике');
    const finalReason = reasons.join(' → ');
    return { success: false, shouldFallback: true, reason: finalReason };

  } catch (error) {
    reasons.push(`Ошибка редактирования: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

/**
 * Выполнение плана векторизации
 */
async function executeVectorizationPlan(userQuery, options) {
  SmartLogger.execute(`Выполняю векторизацию изображения`);

  const reasons = [];
  const sessionId = options.sessionId || 'default';

  reasons.push(`Распознал запрос "${userQuery}" как команду векторизации`);

  try {
    // Ищем последнее изображение в контексте чата
    const lastImageInfo = findLastImageInContext(options.chatContext);
    
    let lastImageUrl = null;
    if (lastImageInfo) {
      lastImageUrl = lastImageInfo.url;
      reasons.push(`Найдено изображение в контексте для векторизации: ${lastImageUrl.substring(0, 50)}...`);
    }

    if (!lastImageUrl) {
      reasons.push('Изображение для векторизации не найдено');
      const finalReason = reasons.join(' → ');
      return { 
        success: true, 
        response: '❌ Для векторизации нужно сначала создать или загрузить изображение.',
        provider: 'IntelligentVectorizer',
        reason: finalReason
      };
    }

    // Проверяем доступность векторизатора на порту 5006
    const fetch = require('node-fetch');

    try {
      const healthCheck = await fetch('http://localhost:5006/health', { timeout: 5000 });
      if (!healthCheck.ok) {
        throw new Error('Векторизатор недоступен');
      }
      reasons.push('Векторизатор на порту 5006 доступен');
    } catch (error) {
      reasons.push('Векторизатор недоступен, используем fallback');
      return { success: false, shouldFallback: true, reason: reasons.join(' → ') };
    }

    // Отправляем запрос на векторизацию
    const vectorizeRequest = {
      imageUrl: lastImageUrl,
      quality: 'simple',
      outputFormat: 'svg'
    };

    reasons.push('Отправляю запрос на векторизацию через ImageTracerJS');

    const vectorizeResponse = await fetch('http://localhost:5006/vectorize-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vectorizeRequest),
      timeout: 30000
    });

    if (vectorizeResponse.ok) {
      const result = await vectorizeResponse.json();

      if (result.success) {
        const filename = result.data?.filename || result.result?.filename;
        const fileUrl = result.data?.url || `/output/${filename}`;

        reasons.push('Векторизация успешно завершена');

        let response = `✅ Векторизация завершена через интеллектуальный процессор!

📄 Формат: SVG (ImageTracerJS v1.2.6)  
🎨 Качество: Высокое
📁 Файл: ${filename}
🔗 [Просмотреть SVG](${fileUrl})
📥 [Скачать SVG](${fileUrl}?download=true)

🧠 **Интеллектуальный анализ:** Автоматически найдено последнее изображение в беседе и выполнена векторизация.`;

        // Применяем эмоциональную адаптацию
        if (options.emotional) {
          response = emotionalAnalyzer.generateEmotionalResponse(
            options.emotional, 
            response, 
            'vectorization'
          );
          reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
        }

        const finalReason = reasons.join(' → ');
        SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

        return {
          success: true,
          response: response,
          provider: 'IntelligentVectorizerIntegrated',
          category: 'vectorization',
          vectorUrl: fileUrl,
          emotionalTone: options.emotional?.overallTone || 'neutral',
          reason: finalReason
        };
      }
    }

    reasons.push('Векторизация не удалась, переход к стандартной логике');
    const finalReason = reasons.join(' → ');
    return { success: false, shouldFallback: true, reason: finalReason };

  } catch (error) {
    reasons.push(`Ошибка векторизации: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

/**
 * Выполнение плана анализа сайтов
 */
async function executeWebsiteAnalysisPlan(userQuery, options) {
  SmartLogger.execute(`Выполняю анализ сайта для: "${userQuery}"`);

  const reasons = [];
  reasons.push(`Распознал запрос "${userQuery}" как команду анализа сайта`);

  try {
    // Импортируем наш новый анализатор
    const websiteAnalyzer = require('./accurate-website-analyzer.cjs');

    reasons.push('Использую точный анализатор сайтов с реальной загрузкой контента');

    // Проверяем, что это действительно запрос на анализ сайта
    const detection = websiteAnalyzer.detectWebsiteAnalysisIntent(userQuery);
    if (!detection.isWebsiteAnalysis) {
      reasons.push('Запрос не содержит URL или ключевые слова анализа сайта');
      return { success: false, shouldFallback: true, reason: reasons.join(' → ') };
    }

    reasons.push(`Детекция анализа сайта: уверенность ${detection.confidence}%`);

    // Выполняем анализ сайта
    const analysisResult = await websiteAnalyzer.analyzeWebsite(userQuery, options);

    if (analysisResult.success) {
      reasons.push('Анализ сайта выполнен успешно');

      let response = analysisResult.response;

      // Применяем эмоциональную адаптацию
      if (options.emotional) {
        response = emotionalAnalyzer.generateEmotionalResponse(
          options.emotional, 
          response, 
          'website_analysis'
        );
        reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
      }

      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: response,
        provider: 'IntelligentWebsiteAnalyzer',
        category: 'website_analysis',
        url: analysisResult.url,
        websiteData: {
          businessType: analysisResult.businessAnalysis?.businessType,
          features: analysisResult.businessAnalysis?.features
        },
        emotionalTone: options.emotional?.overallTone || 'neutral',
        reason: finalReason
      };
    } else {
      reasons.push(`Анализ не удался: ${analysisResult.error}`);
      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
      return { success: false, shouldFallback: true, reason: finalReason };
    }

  } catch (error) {
    reasons.push(`Ошибка анализа сайта: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

/**
 * Выполнение плана конвертации в вышивку
 */
async function executeEmbroideryPlan(userQuery, options) {
  SmartLogger.execute(`Выполняю конвертацию в вышивку`);

  // Этот план будет выполняться через fallback к smart-router
  return { success: false, shouldFallback: true };
}

/**
 * Выполнение плана получения времени
 */
async function executeTimeDatePlan(userQuery, options) {
  SmartLogger.execute(`Получаю текущее время и дату`);

  const reasons = [];
  reasons.push(`Распознал запрос "${userQuery}" как вопрос о времени/дате`);
  reasons.push('Получаю текущее время в московском часовом поясе');

  const now = new Date();
  const timeStr = now.toLocaleString('ru-RU', { 
    timeZone: 'Europe/Moscow',
    year: 'numeric',
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'long'
  });

  reasons.push('Форматирую время в удобном для чтения виде');

  let response = `Сейчас: ${timeStr} (московское время)`;

  // Применяем эмоциональную адаптацию
  if (options.emotional) {
    response = emotionalAnalyzer.generateEmotionalResponse(
      options.emotional, 
      response, 
      'time_date'
    );
    reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
  }

  const finalReason = reasons.join(' → ');
  SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

  return {
    success: true,
    response: response,
    provider: 'IntelligentTimeProviderEmotional',
    category: 'time_date',
    emotionalTone: options.emotional?.overallTone || 'neutral',
    reason: finalReason
  };
}

/**
 * Выполнение плана команд памяти
 */
async function executeMemoryCommandPlan(plan, userQuery, options) {
  SmartLogger.execute(`Выполняю команду памяти: ${plan.command}`);

  const reasons = [];
  const sessionId = options.sessionId || 'default';

  reasons.push(`Обнаружена команда памяти: ${plan.command}`);

  try {
    // Выполняем команду памяти
    const commandResult = sessionMemory.processMemoryCommand(sessionId, plan.command, plan.params);
    reasons.push(`Команда "${plan.command}" выполнена успешно`);

    // Применяем эмоциональную адаптацию если есть эмоциональный контекст
    let response = commandResult;
    if (options.emotional) {
      response = emotionalAnalyzer.generateEmotionalResponse(
        options.emotional, 
        commandResult, 
        'memory_command'
      );
      reasons.push(`Адаптировал ответ под эмоцию: ${options.emotional.dominantEmotion}`);
    }

    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

    return {
      success: true,
      response: response,
      provider: 'IntelligentMemoryManager',
      category: 'memory_command',
      command: plan.command,
      emotionalTone: options.emotional?.overallTone || 'neutral',
      reason: finalReason
    };
  } catch (error) {
    reasons.push(`Ошибка выполнения команды: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

/**
 * Выполнение плана обычного общения
 */
async function executeConversationPlan(userQuery, options) {
  SmartLogger.execute(`Генерирую ответ для обычного общения`);

  const reasons = [];
  const sessionId = options.sessionId || 'default';

  reasons.push(`Классифицировал "${userQuery}" как обычное общение`);

  try {
    // Получаем эмоциональное состояние из опций
    const emotional = options.emotional || { dominantEmotion: 'neutral', overallTone: 'neutral' };

    reasons.push(`Проанализировал эмоциональное состояние: ${emotional.dominantEmotion}`);

    // Получаем контекст пользователя для более персонализированных ответов
    const userContext = sessionMemory.getUserContext(sessionId);
    reasons.push('Загрузил контекст пользователя из памяти сессии');

    // Используем chatContext если он доступен из анализа намерений
    let conversationContext = userContext;
    if (options.chatContext && options.chatContext.context) {
      conversationContext += `\n\nПОСЛЕДНИЕ СООБЩЕНИЯ:\n${options.chatContext.context.substring(0, 500)}`;
      reasons.push('Добавил контекст последних сообщений из истории беседы');
    }

    // Адаптируем промпт под эмоциональное состояние и пользовательский контекст
    let conversationPrompt = `Ты дружелюбный AI-помощник с памятью о пользователе. `;

    // Добавляем контекст пользователя и беседы в промпт
    if (conversationContext && conversationContext.length > 50) {
      conversationPrompt += `

${conversationContext}

Учитывай этот контекст в своём ответе. `;
      reasons.push('Добавил полный контекст пользователя и беседы в промпт');
    }

    // Настраиваем стиль ответа под эмоцию пользователя
    switch (emotional.dominantEmotion) {
      case 'joy':
        conversationPrompt += `Пользователь в хорошем настроении! Отвечай позитивно и энергично. `;
        reasons.push('Настроил позитивный и энергичный стиль ответа');
        break;
      case 'anger':
        conversationPrompt += `Пользователь расстроен или раздражён. Отвечай спокойно, понимающе и конструктивно. `;
        reasons.push('Настроил спокойный и понимающий стиль ответа');
        break;
      case 'sadness':
        conversationPrompt += `Пользователь грустит или устал. Отвечай поддерживающе и ободряюще. `;
        reasons.push('Настроил поддерживающий и ободряющий стиль ответа');
        break;
      case 'surprise':
        conversationPrompt += `Пользователь удивлён или любопытен. Отвечай интересно и познавательно. `;
        reasons.push('Настроил интересный и познавательный стиль ответа');
        break;
      case 'polite':
        conversationPrompt += `Пользователь очень вежлив. Отвечай также вежливо и учтиво. `;
        reasons.push('Настроил вежливый и учтивый стиль ответа');
        break;
      default:
        conversationPrompt += `Отвечай естественно и дружелюбно. `;
        reasons.push('Использую нейтральный дружелюбный стиль ответа');
    }

    conversationPrompt += `

Пользователь: "${userQuery}"

Ответь в соответствии с настроением пользователя. Если можешь помочь чем-то конкретным, предложи это.`;

    reasons.push('Отправляю запрос к AI модели Qwen_Qwen_2_72B для генерации ответа');

    let pythonProvider;
    try {
      const pythonProviderModule = await import('./python_provider_routes.js');
      pythonProvider = pythonProviderModule.default || pythonProviderModule;
    } catch (error) {
      SmartLogger.execute(`AI чат недоступен: ${error.message}`);
      return { success: false, shouldFallback: true, reason: `AI чат недоступен: ${error.message}` };
    }

    const result = pythonProvider ? await pythonProvider.callPythonAI(conversationPrompt, 'Qwen_Qwen_2_72B') : null;

    if (result && typeof result === 'string') {
      reasons.push('AI сгенерировал ответ, применяю эмоциональную адаптацию');

      // Применяем эмоциональную адаптацию к ответу
      const adaptedResponse = emotionalAnalyzer.generateEmotionalResponse(
        emotional, 
        result.trim(), 
        'conversation'
      );

      reasons.push('Финализировал ответ с учетом эмоционального контекста');

      const finalReason = reasons.join(' → ');
      SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);

      return {
        success: true,
        response: adaptedResponse,
        provider: 'IntelligentConversationEmotionalMemory',
        category: 'conversation',
        emotionalTone: emotional.overallTone,
        hasUserContext: userContext.length > 50,
        reason: finalReason
      };
    }

    reasons.push('AI не смог сгенерировать ответ, перехожу к стандартной логике');
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  } catch (error) {
    reasons.push(`Ошибка генерации: ${error.message}`);
    const finalReason = reasons.join(' → ');
    SmartLogger.execute(`ПРИЧИНЫ ДЕЙСТВИЙ: ${finalReason}`);
    return { success: false, shouldFallback: true, reason: finalReason };
  }
}

async function generateContextualResponse(message, options, reasons) {
  SmartLogger.brain(`Генерирую контекстуальный ответ с учетом созданных изображений`);

  const sessionId = options.sessionId;
  const emotional = options.emotional || { dominantEmotion: 'neutral' };

  // Ищем созданные изображения в сессии
  let imagesList = [];
  try {
    const { db } = require('./db.ts');
    const { aiMessages } = require('../shared/schema.ts');
    const { eq } = require('drizzle-orm');

    const messages = await db
      .select()
      .from(aiMessages)
      .where(eq(aiMessages.sessionId, sessionId))
      .orderBy(aiMessages.createdAt);

    imagesList = messages
      .filter(msg => msg.content && msg.sender === 'ai' && 
              (msg.content.includes('![') || msg.content.includes('https://image.pollinations.ai')))
      .map(msg => {
        const imageMatch = msg.content.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (imageMatch) {
          return {
            description: imageMatch[1] || 'Сгенерированное изображение',
            url: imageMatch[2],
            timestamp: msg.timestamp
          };
        }
        return null;
      })
      .filter(Boolean);
  } catch (error) {
    SmartLogger.brain(`Ошибка поиска изображений: ${error.message}`);
  }

  const imagesCount = imagesList.length;
  const lastImage = imagesList[imagesList.length - 1];

  // Формируем ответ с учетом созданных изображений
  let contextualResponse = '';

  if (imagesCount === 0) {
    contextualResponse = "Пока что я не создавал изображений в нашей беседе. Хочешь, чтобы я что-то нарисовал? 🎨";
  } else if (imagesCount === 1) {
    contextualResponse = `Я создал для тебя одно изображение! Это была ${lastImage.description.toLowerCase()}. Если нужно что-то изменить или создать новое изображение - просто скажи! 🎨✨`;
  } else {
    contextualResponse = `Я создал для тебя уже ${imagesCount} изображений в нашей беседе! Последнее было ${lastImage.description.toLowerCase()}. Можем создать что-то новое или изменить существующее! 🎨✨`;
  }

  reasons.push(`Найдено ${imagesCount} изображений в истории сессии`);
  reasons.push('Сформировал контекстуальный ответ с учетом созданных изображений');

  // Применяем эмоциональную адаптацию
  const adaptedResponse = emotionalAnalyzer.generateEmotionalResponse(
    emotional, 
    contextualResponse, 
    'conversation_with_context'
  );

  return {
    success: true,
    response: adaptedResponse,
    provider: 'IntelligentContextualMemory',
    category: 'conversation_with_context',
    emotionalTone: emotional.dominantEmotion,
    imagesFound: imagesCount,
    reason: reasons.join(' → ')
  };
}

/**
 * Поиск последнего изображения в контексте чата
 */
function findLastImageInContext(chatContext) {
  if (!chatContext || !chatContext.context) {
    SmartLogger.brain('Контекст чата недоступен для поиска изображений');
    return null;
  }

  const contextLines = chatContext.context.split('\n');
  SmartLogger.brain(`Ищем изображения в ${contextLines.length} строках контекста`);

  // Ищем с конца к началу (последнее изображение)
  for (let i = contextLines.length - 1; i >= 0; i--) {
    const line = contextLines[i];
    
    // Проверяем наличие markdown изображения
    const imageMatch1 = line.match(/!\[([^\]]*)\]\((https:\/\/image\.pollinations\.ai[^)]+)\)/);
    const imageMatch2 = line.match(/(https:\/\/image\.pollinations\.ai[^\s\)]+)/);
    
    const imageMatch = imageMatch1 || imageMatch2;
    
    if (imageMatch) {
      const imageInfo = {
        description: imageMatch1 ? (imageMatch1[1] || 'Сгенерированное изображение') : 'Сгенерированное изображение',
        url: imageMatch1 ? imageMatch1[2] : imageMatch[1],
        foundInLine: i,
        sourceText: line
      };
      
      SmartLogger.brain(`Найдено изображение в контексте: ${imageInfo.description}`);
      SmartLogger.brain(`URL: ${imageInfo.url.substring(0, 80)}...`);
      
      return imageInfo;
    }
  }

  SmartLogger.brain('Изображения в контексте чата не найдены');
  return null;
}

/**
 * РЕВОЛЮЦИОННАЯ ФУНКЦИЯ ИНТЕЛЛЕКТУАЛЬНОГО ПРОЦЕССОРА
 * Анализирует запрос с использованием 50+ семантических модулей
 * и выполняет оптимальный план действий с мета-семантической оптимизацией
 */
async function analyzeAndExecute(userQuery, options = {}) {
  SmartLogger.brain(`=== ЗАПУСК ИНТЕЛЛЕКТУАЛЬНОГО АНАЛИЗА ===`);
  SmartLogger.brain(`Запрос: "${userQuery}"`);
  SmartLogger.brain(`SessionId: ${options.sessionId || 'default'}`);

  const globalReasons = [];
  globalReasons.push('Запустил интеллектуальный анализ запроса пользователя');

  // ===== ПРОВЕРКА СЕМАНТИЧЕСКИХ ДАННЫХ =====
  // Если процессор вызван как исполнитель семантических решений
  const semanticData = options.semanticData;
  if (semanticData) {
    SmartLogger.brain(`🔗 Получены семантические данные для обогащения анализа`);
    SmartLogger.brain(`📊 Семантическая уверенность: ${semanticData.confidence}%`);
    
    if (semanticData.current_project) {
      SmartLogger.brain(`📋 Контекст проекта: ${semanticData.current_project.title}`);
    }
    
    globalReasons.push('Интегрирую семантические данные в анализ');
  }

  try {
    // Шаг 1: Анализ намерений (включая проверку команд памяти)
    globalReasons.push('Анализирую намерения пользователя (грамматика + эмоции + контекст + память)');
    const intent = await analyzeUserIntent(userQuery, options);

    globalReasons.push(`Определил категорию: ${intent.category} (уверенность: ${intent.confidence}%)`);

    // Специальная обработка для команд памяти - они всегда должны выполняться
    if (intent.category === 'memory_command') {
      globalReasons.push('Обнаружена команда памяти - выполняю напрямую');
      const plan = { 
        category: 'memory_command', 
        description: 'Выполнение команды управления памятью',
        command: intent.command,
        params: intent.params,
        shouldExecute: true,
        confidence: intent.confidence,
        grammar: intent.grammar,
        context: intent.context,
        emotional: intent.emotional
      };

      const result = await executeMemoryCommandPlan(plan, userQuery, options);

      if (result.success) {
        globalReasons.push('Команда памяти выполнена успешно');
        const finalGlobalReason = globalReasons.join(' → ');
        SmartLogger.brain(`=== ФИНАЛЬНЫЕ ПРИЧИНЫ: ${finalGlobalReason} ===`);

        result.globalReason = finalGlobalReason;
        if (result.reason) {
          result.fullReason = `${finalGlobalReason} | ДЕТАЛИ: ${result.reason}`;
        }

        SmartLogger.brain(`=== КОМАНДА ПАМЯТИ ВЫПОЛНЕНА ===`);
        return result;
      }
    }

    // Шаг 2: Создание плана
    globalReasons.push('Создаю план действий на основе намерений');
    const plan = await createActionPlan(intent, options);

    globalReasons.push(`План: ${plan.description} (порог: ${intent.smartThreshold}%)`);

    // Шаг 3: Выполнение плана (используем умные пороги)
    if (plan.shouldExecute) {
      globalReasons.push(`Уверенность ${plan.confidence}% превышает порог ${intent.smartThreshold}%, выполняю план`);
      SmartLogger.brain(`Выполняем план с уверенностью ${plan.confidence}% (порог пройден)`);

      const result = await executePlan(plan, userQuery, options);

      if (result.success) {
        globalReasons.push('План успешно выполнен');
        const finalGlobalReason = globalReasons.join(' → ');
        SmartLogger.brain(`=== ФИНАЛЬНЫЕ ПРИЧИНЫ: ${finalGlobalReason} ===`);

        // Добавляем глобальную причину к результату
        result.globalReason = finalGlobalReason;
        if (result.reason) {
          result.fullReason = `${finalGlobalReason} | ДЕТАЛИ: ${result.reason}`;
        }

        SmartLogger.brain(`=== УСПЕШНОЕ ВЫПОЛНЕНИЕ ПЛАНА ===`);
        return result;
      } else if (result.shouldFallback) {
        globalReasons.push('План не сработал, перехожу к стандартной логике');
        const finalGlobalReason = globalReasons.join(' → ');
        SmartLogger.brain(`=== ФИНАЛЬНЫЕ ПРИЧИНЫ: ${finalGlobalReason} ===`);
        SmartLogger.brain(`=== ПЕРЕХОД К СТАНДАРТНОЙ ЛОГИКЕ ===`);
        return { success: false, shouldFallback: true, globalReason: finalGlobalReason };
      }
    }

    // Если план не подходит, используем стандартную логику
    globalReasons.push(`Уверенность ${plan.confidence}% ниже порога ${intent.smartThreshold}%, использую стандартную логику`);
    const finalGlobalReason = globalReasons.join(' → ');
    SmartLogger.brain(`=== ФИНАЛЬНЫЕ ПРИЧИНЫ: ${finalGlobalReason} ===`);
    SmartLogger.brain(`=== ПЛАН НЕ ПРОШЕЛ УМНЫЙ ПОРОГ, ПЕРЕХОД К СТАНДАРТНОЙ ЛОГИКЕ ===`);
    SmartLogger.brain(`Уверенность: ${plan.confidence}%, требуемый порог: ${intent.smartThreshold}%`);
    return { success: false, shouldFallback: true, globalReason: finalGlobalReason };

  } catch (error) {
    globalReasons.push(`Критическая ошибка: ${error.message}`);
    const finalGlobalReason = globalReasons.join(' → ');
    SmartLogger.brain(`=== ФИНАЛЬНЫЕ ПРИЧИНЫ: ${finalGlobalReason} ===`);
    SmartLogger.brain(`=== ОШИБКА АНАЛИЗА: ${error.message} ===`);
    return { success: false, shouldFallback: true, error: error.message, globalReason: finalGlobalReason };
  }
}

/**
 * Маппинг семантических кластеров в категории процессора
 */
function mapSemanticClusterToCategory(clusterName) {
  const clusterMapping = {
    'branding': 'image_generation',
    'image_creation': 'image_generation',
    'apparel_design': 'image_generation',
    'character_design': 'image_generation',
    'embroidery_design': 'embroidery',
    'signage_design': 'image_generation',
    'vectorization': 'vectorization',
    'research': 'web_search',
    'analysis': 'image_analysis'
  };
  
  return clusterMapping[clusterName] || null;
}

/**
 * ЭТАП 2: ФУНКЦИЯ ИНТЕГРАЦИИ С СЕМАНТИЧЕСКИМИ МОДУЛЯМИ
 * Специально для работы с результатами 50+ семантических модулей
 */
async function processRequest(userMessage, semanticResult) {
  try {
    console.log('🧠 ИНТЕЛЛЕКТУАЛЬНАЯ ОБРАБОТКА ЗАПРОСА С СЕМАНТИЧЕСКИМИ ДАННЫМИ...');
    console.log(`   Семантических модулей: ${semanticResult.modulesActivated || 0}`);
    console.log(`   Общая уверенность: ${(semanticResult.confidence * 100).toFixed(1)}%`);

    // ЭТАП 3: МЕТА-СЕМАНТИЧЕСКАЯ ОПТИМИЗАЦИЯ ОТВЕТА
    let metaOptimization = null;
    if (semanticResult.metaAnalysis) {
      try {
        const metaSemanticEngine = require('./semantic-memory/meta-semantic-engine.cjs');
        metaOptimization = await metaSemanticEngine.optimizeResponse({
          baseQuery: userMessage,
          semanticAnalysis: semanticResult,
          timestamp: new Date().toISOString()
        });
        console.log('🔮 Мета-семантическая оптимизация завершена');
      } catch (metaError) {
        console.log('⚠️ Мета-оптимизация недоступна:', metaError.message);
      }
    }

    // Обогащение опций семантическими данными для более точного анализа
    const enrichedOptions = {
      semanticData: semanticResult,
      advancedSemantics: semanticResult.advancedSemantics,
      metaAnalysis: semanticResult.metaAnalysis,
      confidence: semanticResult.confidence,
      processingTime: semanticResult.processingTime,
      systemVersion: semanticResult.systemVersion
    };

    // Запуск интеллектуального анализа с семантическими данными
    const intelligentResponse = await analyzeAndExecute(userMessage, enrichedOptions);

    // Интеграция мета-оптимизации в ответ
    if (metaOptimization && intelligentResponse.success) {
      intelligentResponse.response = metaOptimization.optimizedResponse || intelligentResponse.response;
      intelligentResponse.metaOptimization = metaOptimization;
      intelligentResponse.metaConfidence = metaOptimization.confidence || semanticResult.confidence;
    }

    // Дополнение ответа информацией о семантическом анализе
    return {
      ...intelligentResponse,
      semanticEnrichment: {
        modulesUsed: semanticResult.modulesActivated || 0,
        semanticConfidence: semanticResult.confidence,
        advancedInsights: semanticResult.advancedSemantics,
        processingTime: semanticResult.processingTime,
        revolutionaryUpgrade: semanticResult.revolutionaryUpgrade
      },
      confidence: Math.max(
        intelligentResponse.confidence || 0,
        semanticResult.confidence || 0,
        metaOptimization?.confidence || 0
      ),
      type: intelligentResponse.type || 'semantic_enhanced',
      metaOptimization: metaOptimization
    };

  } catch (error) {
    console.error('❌ Ошибка в интеллектуальной обработке с семантикой:', error.message);
    
    // Fallback: обычная обработка без семантических данных
    const fallbackResponse = await analyzeAndExecute(userMessage, {});
    
    return {
      ...fallbackResponse,
      semanticEnrichment: {
        error: error.message,
        fallbackMode: true,
        modulesUsed: 0
      },
      type: 'semantic_fallback'
    };
  }
}

module.exports = {
  analyzeAndExecute,
  analyzeUserIntent,
  createActionPlan,
  executePlan,
  processRequest, // НОВАЯ ФУНКЦИЯ ДЛЯ СЕМАНТИЧЕСКОЙ ИНТЕГРАЦИИ
  mapSemanticClusterToCategory
};