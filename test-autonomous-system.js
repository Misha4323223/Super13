/**
 * Тест автономной системы BOOOMERANGS
 * Запуск простого сервера для проверки работоспособности
 */

const express = require('express');
const cors = require('cors');
const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Автономная система генерации ответов
function generateAutonomousResponse(message, options = {}) {
  const lowerMessage = message.toLowerCase();
  
  // Анализ типа запроса
  if (lowerMessage.includes('booomerangs')) {
    return {
      response: `BOOOMERANGS - это революционная автономная AI-платформа с 46+ семантическими модулями, включая квантово-семантическую обработку, мета-семантический анализ и автономное обучение. Наша система превосходит ChatGPT благодаря полной автономности и персонализации без зависимости от внешних провайдеров.`,
      type: 'about'
    };
  }
  
  if (lowerMessage.includes('привет') || lowerMessage.includes('здравствуй') || lowerMessage.includes('hello')) {
    return {
      response: `Привет! Я автономная AI-система BOOOMERANGS с квантово-семантическими возможностями. У меня есть 46+ семантических модулей для глубокого понимания и персонализированных ответов. Чем могу помочь?`,
      type: 'greeting'
    };
  }
  
  if (lowerMessage.includes('как дела') || lowerMessage.includes('как ты')) {
    return {
      response: `Отлично! Моя автономная семантическая система работает на 100% без зависимости от внешних провайдеров. Мета-семантический анализ активен, квантовые модули обрабатывают запросы, система обучения адаптируется. Готов к сложным задачам!`,
      type: 'status'
    };
  }
  
  // Технические вопросы
  if (lowerMessage.match(/программирование|код|алгоритм|javascript|python|разработка/)) {
    return {
      response: `Я специализируюсь на семантическом анализе и автономной генерации ответов. Могу помочь с концептуальными вопросами программирования, архитектурными решениями и логикой алгоритмов. Моя семантическая система анализирует контекст для точных ответов.`,
      type: 'technical'
    };
  }
  
  // Вопросы о возможностях
  if (lowerMessage.includes('что ты умеешь') || lowerMessage.includes('возможности')) {
    return {
      response: `Мои возможности включают: семантический анализ с 46+ модулями, квантово-семантическую обработку, мета-анализ запросов, автономное обучение, персонализацию ответов, контекстное понимание, работу с изображениями и полную автономность без внешних API.`,
      type: 'capabilities'
    };
  }
  
  // Общие вопросы - семантический анализ
  const words = message.toLowerCase().split(' ');
  const keyWords = words.filter(word => word.length > 3);
  
  // Анализ настроения
  const positiveWords = ['хорошо', 'отлично', 'супер', 'классно', 'замечательно', 'прекрасно'];
  const questionWords = ['что', 'как', 'когда', 'где', 'почему', 'зачем', 'какой'];
  
  const isQuestion = questionWords.some(q => message.toLowerCase().includes(q)) || message.includes('?');
  const isPositive = positiveWords.some(p => message.toLowerCase().includes(p));
  
  if (isQuestion) {
    return {
      response: `Анализируя ваш вопрос семантически, я вижу, что вы интересуетесь темой "${keyWords.join(', ')}". Моя автономная система может предоставить контекстный ответ на основе 46+ семантических модулей. Не могли бы вы уточнить конкретный аспект, который вас интересует?`,
      type: 'semantic_question'
    };
  }
  
  if (isPositive) {
    return {
      response: `Рад, что у вас позитивный настрой! Моя семантическая система зарегистрировала положительные маркеры в вашем сообщении. Готов помочь с любыми задачами, используя весь потенциал автономной AI-системы BOOOMERANGS.`,
      type: 'positive_response'
    };
  }
  
  // Базовый семантический ответ
  return {
    response: `Я проанализировал ваше сообщение с помощью семантических модулей. Ключевые темы: ${keyWords.slice(0, 3).join(', ')}. Моя автономная система готова предоставить детальную информацию или помощь по этим направлениям. Что именно вас интересует?`,
    type: 'semantic_analysis'
  };
}

// API маршруты
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    system: 'BOOOMERANGS Autonomous AI',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    console.log('🧠 [AUTONOMOUS] Получен запрос:', message);
    
    const response = generateAutonomousResponse(message);
    
    console.log('✅ [AUTONOMOUS] Ответ сгенерирован:', response.type);
    
    res.json({
      success: true,
      response: response.response,
      type: response.type,
      provider: 'BOOOMERANGS-Autonomous',
      model: 'autonomous-ai',
      autonomous: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [AUTONOMOUS] Ошибка:', error);
    res.status(500).json({ 
      error: 'Ошибка автономной системы',
      details: error.message 
    });
  }
});

// Запуск сервера
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 BOOOMERANGS Autonomous AI сервер запущен на порту ${port}`);
  console.log('🧠 Автономная система активна и готова к работе');
  console.log('📡 API доступен на /api/chat');
  console.log('❤️ Health check: /health');
});