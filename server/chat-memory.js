/**
 * Система памяти для AI чата
 * Запоминает контекст разговора и возможности AI
 */

const chatHistory = require('./chat-history');

// Системная информация о возможностях AI
const AI_CAPABILITIES = `
ТВОИ ВОЗМОЖНОСТИ И ФУНКЦИИ:

🎨 ГЕНЕРАЦИЯ ИЗОБРАЖЕНИЙ:
- Создавай изображения по любому описанию
- Используй команды: "нарисуй", "создай изображение", "сгенерируй"
- Поддерживаю разные стили: реалистичный, художественный, векторный

🧵 СОЗДАНИЕ ВЫШИВКИ:
- Создаю дизайны для вышивальных машин
- Конвертирую в форматы: DST, PES, JEF, EXP, VP3
- Оптимизирую для качественной вышивки

📄 СОЗДАНИЕ SVG ДЛЯ ПЕЧАТИ:
- Конвертирую изображения в SVG для шелкографии и DTF печати
- Оптимизирую файлы для текстильного производства
- Создаю цветовые схемы и рекомендации для печати

🔍 ВЕБ-ПОИСК:
- Ищу актуальную информацию в интернете
- Проверяю новости, погоду, курсы валют
- Нахожу адреса магазинов и контакты

📷 АНАЛИЗ ИЗОБРАЖЕНИЙ:
- Описываю содержимое загруженных картинок
- Распознаю объекты и текст
- Анализирую цвета и композицию

💻 ПРОГРАММИРОВАНИЕ:
- Пишу код на разных языках
- Помогаю с отладкой и оптимизацией
- Объясняю сложные концепции

ВАЖНО: Я всегда помню свои возможности и предлагаю их использование когда это уместно!
`;

/**
 * Получение контекста сессии для AI
 */
async function getSessionContext(sessionId, maxMessages = 10) {
  try {
    const messages = await chatHistory.getSessionMessages(sessionId);
    
    if (!messages || messages.length === 0) {
      return {
        context: AI_CAPABILITIES,
        messageCount: 0
      };
    }

    // Берем последние сообщения для контекста
    const recentMessages = messages.slice(-maxMessages);
    
    // Формируем контекст из истории
    let conversationHistory = '\nИСТОРИЯ РАЗГОВОРА:\n';
    recentMessages.forEach(msg => {
      const sender = msg.sender === 'user' ? 'Пользователь' : 'Ты (AI)';
      conversationHistory += `${sender}: ${msg.content}\n`;
    });

    // Анализируем, были ли сгенерированы изображения
    const hasGeneratedImages = recentMessages.some(msg => 
      msg.content && msg.content.includes('![Сгенерированное изображение]')
    );

    let contextNotes = '';
    if (hasGeneratedImages) {
      contextNotes += '\n📝 КОНТЕКСТ: В этом разговоре ты уже создавал изображения. Пользователь знает о твоих возможностях генерации.\n';
    }

    return {
      context: AI_CAPABILITIES + conversationHistory + contextNotes,
      messageCount: recentMessages.length,
      hasImages: hasGeneratedImages
    };

  } catch (error) {
    console.error('Ошибка получения контекста сессии:', error);
    return {
      context: AI_CAPABILITIES,
      messageCount: 0
    };
  }
}

/**
 * Создание расширенного промпта с памятью
 */
function createEnhancedPrompt(userQuery, sessionContext) {
  return `${sessionContext.context}

НОВЫЙ ЗАПРОС ПОЛЬЗОВАТЕЛЯ: "${userQuery}"

ИНСТРУКЦИИ:
1. Помни о своих возможностях: генерация изображений, веб-поиск, создание вышивки, анализ изображений
2. Используй контекст предыдущих сообщений
3. Предлагай свои функции когда это уместно
4. Отвечай полезно и по существу
5. Если пользователь просит создать изображение - обязательно используй функцию генерации

Ответ:`;
}

/**
 * Определение типа запроса с учетом контекста
 */
function analyzeRequestWithContext(userQuery, sessionContext) {
  const lowerQuery = userQuery.toLowerCase();
  
  // Ключевые слова для разных типов запросов
  const imageKeywords = ['нарисуй', 'создай', 'сгенерируй', 'принт', 'дизайн', 'картинка', 'изображение', 'логотип', 'баннер'];
  const searchKeywords = ['найди', 'поищи', 'где находится', 'адрес', 'телефон', 'время работы', 'погода', 'новости', 'курс'];
  const embroideryKeywords = ['вышивк', 'dst', 'pes', 'jef', 'вышивальн'];
  
  return {
    isImageRequest: imageKeywords.some(keyword => lowerQuery.includes(keyword)),
    isSearchRequest: searchKeywords.some(keyword => lowerQuery.includes(keyword)),
    isEmbroideryRequest: embroideryKeywords.some(keyword => lowerQuery.includes(keyword)),
    needsContext: sessionContext.messageCount > 0
  };
}

/**
 * Сохранение информации о выполненной операции
 */
async function saveOperationInfo(sessionId, operation, details) {
  try {
    const operationRecord = {
      sessionId,
      operation,
      details,
      timestamp: new Date().toISOString()
    };
    
    // Можно расширить для сохранения в базу данных
    console.log('💾 Сохранена информация об операции:', operationRecord);
    
  } catch (error) {
    console.error('Ошибка сохранения информации об операции:', error);
  }
}

module.exports = {
  getSessionContext,
  createEnhancedPrompt,
  analyzeRequestWithContext,
  saveOperationInfo,
  AI_CAPABILITIES
};