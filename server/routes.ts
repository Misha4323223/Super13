import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupWebSocket } from "./ws";
import { setupProxyMiddleware } from "./middleware/proxy";
import { authMiddleware } from "./middleware/auth";
import { z } from "zod";
import { authSchema, messageSchema } from "@shared/schema";
import { logger, chatLogger } from "./logger";

// Система логирования
const Logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`🔵 [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  success: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`✅ [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] ${message}`, error ? error : '');
  },
  warning: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`⚠️ [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  ai: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`🤖 [${timestamp}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Импортируем модули для работы с изображениями и AI провайдерами
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(__filename);

// Импортируем только главный движок сознания
const conversationEngine = require('./conversation-engine.cjs');

// Настройка multer для загрузки изображений
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB лимит
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'), false);
    }
  }
});
const svgGenerator = require('./svg-generator');
const g4fHandlers = require('./g4f-handlers');
const directAiRoutes = require('./direct-ai-routes');
// const pythonProviderRoutes = require('./python_provider_routes'); // ОТКЛЮЧЕНО по запросу пользователя
const deepspeekProvider = require('./deepspeek-provider');
const chatFreeProvider = require('./chatfree-provider');

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  setupWebSocket(httpServer, storage);

  // Setup proxy middleware
  setupProxyMiddleware(app);

  // Статические файлы из корневой директории
  app.use(express.static(path.join(process.cwd())));

  // Специальный маршрут для файлов вышивки с правильными заголовками скачивания
  app.get('/output/embroidery/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'output', 'embroidery', filename);

    // Определяем тип контента на основе расширения
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'application/octet-stream';

    if (ext === '.exp') contentType = 'application/x-melco-exp';
    else if (ext === '.dst') contentType = 'application/x-tajima-dst';
    else if (ext === '.pes') contentType = 'application/x-brother-pes';
    else if (ext === '.jef') contentType = 'application/x-janome-jef';
    else if (ext === '.vp3') contentType = 'application/x-husqvarna-vp3';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.json') contentType = 'application/json';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.sendFile(filePath);
  });

  // Подключаем генератор изображений
  app.use('/image-generator', (req, res) => {
    res.redirect('/api/svg');
  });

  // API для генератора изображений
  app.use('/api/svg', svgGenerator);

  // Расширенный поиск
  app.use('/api/search', require('./search-routes'));

  // Импортируем модуль генерации изображений с AI
  const aiImageGenerator = require('./ai-image-generator');

  // API для генерации изображений через бесплатные AI провайдеры
  app.post("/api/ai-image/generate", async (req, res) => {
    try {
      const { prompt, style = 'realistic' } = req.body;

      if (!prompt) {
        return res.status(400).json({ 
          success: false, 
          error: 'Необходимо указать текстовый запрос (prompt)'
        });
      }

      // Вызываем функцию генерации изображения
      const result = await aiImageGenerator.generateImage(prompt, style);

      res.json(result);
    } catch (error) {
      console.error('Ошибка при генерации изображения:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Внутренняя ошибка сервера при генерации изображения'
      });
    }
  });

  // Создаем маршрут для доступа к сгенерированным изображениям с поддержкой скачивания
  app.use('/output', (req, res, next) => {
    const outputPath = path.join(__dirname, '..', 'output');
    const filePath = path.join(outputPath, req.path);

    // Проверяем параметр download для принудительного скачивания
    if (req.query.download === 'true') {
      const fileName = path.basename(req.path);
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
    }

    res.sendFile(req.path, { root: outputPath });
  });

  // Тестовая страница
  app.get('/test', (req, res) => {
    res.sendFile('test-page.html', { root: '.' });
  });

  // Демо-страница генератора изображений
  app.get('/demo', (req, res) => {
    res.sendFile('demo.html', { root: '.' });
  });

  // Главная страница - BOOOMERANGS Smart Chat
  app.get('/', (req, res) => {
    res.sendFile('booomerangs-smart-chat.html', { root: '.' });
  });

  // Альтернативный доступ к HTML чату
  app.get('/smart-chat', (req, res) => {
    res.sendFile('booomerangs-smart-chat.html', { root: '.' });
  });

  // Страница отладки
  app.get('/debug', (req, res) => {
    res.sendFile('debug-info.html', { root: '.' });
  });

  // G4F чат интерфейс
  app.get('/g4f-chat', (req, res) => {
    res.sendFile('g4f-chat.html', { root: '.' });
  });

  // Простой G4F тест
  app.get('/simple-g4f', (req, res) => {
    res.sendFile('simple-g4f.html', { root: '.' });
  });

  // Прямой тест G4F
  app.get('/direct-g4f', (req, res) => {
    res.sendFile('direct-g4f-test.html', { root: '.' });
  });

  // Автономная версия G4F чата
  app.get('/standalone', (req, res) => {
    res.sendFile('standalone-g4f.html', { root: '.' });
  });

  // BOOOMERANGS приложение
  app.get('/booom', (req, res) => {
    res.sendFile('booomerangs-main.html', { root: '.' });
  });

  // BOOOMERANGS новый прямой доступ
  app.get('/ai', (req, res) => {
    res.sendFile('booomerangs-direct.html', { root: '.' });
  });

  // BOOOMERANGS новый мультимодальный интерфейс
  app.get('/new', (req, res) => {
    res.sendFile('booomerangs-new.html', { root: '.' });
  });

  // BOOOMERANGS чат с AI провайдерами (прямой интерфейс)
  app.get('/chat-ai', (req, res) => {
    res.sendFile('booomerangs-chat.html', { root: '.' });
  });

  // BOOOMERANGS универсальный интерфейс (чат + генератор изображений)
  app.get('/unified', (req, res) => {
    res.sendFile('public/unified-interface.html', { root: '.' });
  });

  // BOOOMERANGS фиксированный интерфейс с локальной генерацией изображений
  app.get('/fixed', (req, res) => {
    res.sendFile('public/fixed-interface.html', { root: '.' });
  });

  // BOOOMERANGS только генератор изображений (стабильная версия)
  app.get('/image-generator', (req, res) => {
    res.sendFile('public/image-generator.html', { root: '.' });
  });

  // Убираем дублирующий маршрут - используем только один выше с поддержкой параметра download

  // BOOOMERANGS AI генератор изображений
  app.get('/ai-images', (req, res) => {
    res.sendFile('public/ai-image-app.html', { root: '.' });
  });

  // BOOOMERANGS приложение со стримингом
  app.get('/booom-streaming', (req, res) => {
    res.sendFile('booomerangs-app-streaming-fixed.html', { root: '.' });
  });

  // BOOOMERANGS с Qwen AI интеграцией
  app.get('/qwen', (req, res) => {
    res.sendFile('booomerangs-qwen.html', { root: '.' });
  });

  // BOOOMERANGS со стримингом ответов
  app.get('/streaming', (req, res) => {
    res.sendFile('booomerangs-streaming.html', { root: '.' });
  });

  // BOOOMERANGS быстрая версия (запасной вариант без стриминга)
  app.get('/quick', (req, res) => {
    res.sendFile('booomerangs-quick.html', { root: '.' });
  });

  // BOOOMERANGS стабильная версия (только провайдеры с поддержкой стриминга)
  app.get('/stable', (req, res) => {
    res.sendFile('booomerangs-stable.html', { root: '.' });
  });

  // BOOOMERANGS с Flask-стримингом (самая надежная версия)
  app.get('/flask', (req, res) => {
    res.sendFile('booomerangs-flask-stream.html', { root: '.' });
  });

  // Страница просмотра логов системы
  app.get('/logs', (req, res) => {
    res.sendFile('logs-viewer.html', { root: '.' });
  });



  // Перенаправляем запрос умного чата на HTML-страницу
  app.get('/smart-chat', (req, res) => {
    res.sendFile('booomerangs-smart-chat.html', { root: '.' });
  });

  // Командный чат для переписки участников
  app.get('/team-chat', (req, res) => {
    res.sendFile('team-chat.html', { root: '.' });
  });

  // API для работы с G4F провайдерами
  app.use('/api/g4f', g4fHandlers);

  // API с прямым доступом к AI провайдерам (более стабильный вариант)
  app.use('/api/direct-ai', directAiRoutes);

  // API с Python-версией G4F
  // app.use('/api/python', pythonProviderRoutes.router); // ОТКЛЮЧЕНО по запросу пользователя

  // ЭТАП 6: API для мониторинга семантических модулей
  app.get('/api/semantic/dashboard', async (req, res) => {
    try {
      const { globalDashboard } = require('./semantic-monitor-dashboard.cjs');
      const dashboardData = globalDashboard.getDashboardData();
      res.json(dashboardData);
    } catch (error) {
      console.error('Ошибка получения данных dashboard:', error);
      res.status(500).json({ error: 'Ошибка получения данных мониторинга' });
    }
  });

  // API для решения алертов
  app.post('/api/semantic/alerts/:alertId/resolve', async (req, res) => {
    try {
      const { globalDashboard } = require('./semantic-monitor-dashboard.cjs');
      const alertId = parseInt(req.params.alertId);
      globalDashboard.resolveAlert(alertId);
      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка решения алерта:', error);
      res.status(500).json({ error: 'Ошибка решения алерта' });
    }
  });

  // API для детальной статистики модуля
  app.get('/api/semantic/modules/:moduleName/stats', async (req, res) => {
    try {
      const { globalDashboard } = require('./semantic-monitor-dashboard.cjs');
      const moduleName = req.params.moduleName;
      const stats = globalDashboard.getSystemStatistics();
      const moduleData = stats.modules.find(m => m.name === moduleName);
      
      if (!moduleData) {
        return res.status(404).json({ error: 'Модуль не найден' });
      }
      
      res.json(moduleData);
    } catch (error) {
      console.error('Ошибка получения статистики модуля:', error);
      res.status(500).json({ error: 'Ошибка получения статистики модуля' });
    }
  });

  // API для сброса статистики модуля
  app.post('/api/semantic/modules/:moduleName/reset', async (req, res) => {
    try {
      const { globalDashboard } = require('./semantic-monitor-dashboard.cjs');
      const moduleName = req.params.moduleName;
      globalDashboard.resetModuleStats(moduleName);
      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка сброса статистики модуля:', error);
      res.status(500).json({ error: 'Ошибка сброса статистики модуля' });
    }
  });

  // Страница мониторинга семантических модулей
  app.get('/semantic-monitor', (req, res) => {
    res.sendFile('semantic-monitor-dashboard.html', { root: '.' });
  });

  // API для стриминга от провайдеров, поддерживающих stream=True
  const streamingRoutes = require('./streaming-routes');
  app.use('/api/streaming', streamingRoutes);

  // API для диагностики семантической системы
  app.get('/api/semantic/status', async (req, res) => {
    try {
      Logger.info('🔍 Проверка состояния семантической системы...');
      
      const semanticMemory = require('./semantic-memory/index.cjs');
      await semanticMemory.initializationPromise;
      
      const systemStats = semanticMemory.getSystemStatistics();
      const moduleChecker = semanticMemory.moduleChecker;
      
      // Проверяем состояние критичных модулей
      const criticalModules = ['natural-language-generator', 'semantic-analyzer', 'meta-semantic-engine', 'emotional-semantic-matrix'];
      const criticalStatus = {};
      
      for (const moduleName of criticalModules) {
        const status = moduleChecker.getModuleStatus(moduleName);
        criticalStatus[moduleName] = {
          available: status.available,
          reason: status.reason,
          lastCheck: new Date(status.lastCheck).toISOString()
        };
      }
      
      // Проверяем conversation-engine
      let conversationEngineStatus = 'unknown';
      try {
        const testResult = await conversationEngine.processUserInput('test', { userId: 'diagnostic' });
        conversationEngineStatus = testResult ? 'operational' : 'error';
      } catch (error) {
        conversationEngineStatus = `error: ${error.message}`;
      }
      
      const healthScore = systemStats.systemHealth || 0;
      const overallStatus = healthScore > 0.8 ? 'excellent' : 
                           healthScore > 0.6 ? 'good' : 
                           healthScore > 0.4 ? 'degraded' : 'critical';
      
      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        overallStatus,
        healthScore: Math.round(healthScore * 100),
        
        // Статистика модулей
        moduleStats: {
          totalModules: systemStats.totalModules,
          activeModules: systemStats.activeModules,
          availabilityRate: `${Math.round((systemStats.activeModules / systemStats.totalModules) * 100)}%`
        },
        
        // Критичные модули
        criticalModules: criticalStatus,
        
        // Основные компоненты
        coreComponents: {
          conversationEngine: conversationEngineStatus,
          semanticMemory: systemStats.realModulesActive ? 'operational' : 'degraded',
          initializationComplete: systemStats.initializationComplete
        },
        
        // Рекомендации по уровням
        recommendedLevel: healthScore > 0.8 ? 1 : 
                         healthScore > 0.6 ? 2 : 
                         healthScore > 0.4 ? 3 : 4,
        
        levelDescriptions: {
          1: 'Полная семантическая система (50+ модулей)',
          2: 'Базовая семантическая система (10 ключевых модулей)',
          3: 'Минимальная семантическая система (3 основных модуля)',
          4: 'Fallback режим (аварийный режим)'
        }
      });
      
    } catch (error) {
      Logger.error('❌ Ошибка диагностики семантической системы:', error);
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
        overallStatus: 'error'
      });
    }
  });

  // ImageTracerJS векторизатор работает независимо на порту 5006
  // Старые маршруты /api/vectorizer удалены для совместимости с новым векторизатором

  // Статус векторизатора
  app.get('/api/vectorizer-status', async (req, res) => {
    try {
      const vectorizerManager = require('./vectorizer-manager');
      const status = await vectorizerManager.checkHealth();
      res.json({
        success: true,
        vectorizer: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.json({
        success: false,
        vectorizer: { status: 'unavailable', available: false },
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Полная проверка системы
  app.get('/api/system-health', async (req, res) => {
    try {
      const { SystemHealthChecker } = require('./system-health-checker');
      const checker = new SystemHealthChecker();
      const results = await checker.performFullHealthCheck();
      res.json({
        success: true,
        ...results
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // Тестирование векторизатора endpoints
  app.get('/api/test-vectorizer', async (req, res) => {
    try {
      const fetch = require('node-fetch');
      const endpoints = [
        'http://localhost:5006/health',
        'http://localhost:5006/api/vectorizer/health',
        'http://localhost:5006/api/vectorizer/formats'
      ];

      const results = {};

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, { timeout: 3000 });
          const data = await response.json();
          results[endpoint] = {
            status: response.status,
            ok: response.ok,
            data: data
          };
        } catch (error) {
          results[endpoint] = {
            error: error.message,
            accessible: false
          };
        }
      }

      res.json({
        success: true,
        vectorizerEndpoints: results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  });

  // API для Flask-стриминга (надежный вариант)
  const flaskStreamBridge = require('./stream-flask-bridge');
  app.use('/api/flask-stream', flaskStreamBridge);

  // API для DeepSpeek - специализированного AI для технических вопросов
  const deepspeekRoutes = require('./deepspeek-routes');
  app.use('/api/deepspeek', deepspeekRoutes);

  // API для проверки состояния провайдеров (отключено)

  // API для Ollama - локальный AI провайдер
  const ollamaProvider = require('./ollama-provider');
  app.use('/api/ollama', ollamaProvider);

  // API для ChatFree провайдера
  app.use('/api/chatfree', chatFreeProvider);

  // API для Claude от Anthropic через Python G4F
  const claudeProvider = require('./claude-provider');
  app.use('/api/claude', claudeProvider);

  // API для DeepInfra - высококачественные модели
  const deepInfraProvider = require('./deepinfra-provider');
  app.use('/api/deepinfra', deepInfraProvider);

  // API для мультимодального анализа изображений
  const multimodalProvider = require('./multimodal-provider');
  app.use('/api/multimodal', multimodalProvider);

  // API для конвертации в форматы вышивки
  const embroideryRoutes = require('./embroidery-routes');
  app.use('/api/embroidery', embroideryRoutes);

  // API для тестирования провайдеров (отключено)

  // API для умной маршрутизации сообщений к подходящим провайдерам
  const smartRouter = require('./smart-router-wrapper.cjs');

  // Обработчик для умной маршрутизации
  app.post('/api/smart/chat', async (req, res) => {
    try {
      const { message, options = {} } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: 'Сообщение не может быть пустым' });
      }

      const result = await smartRouter.getChatResponse(message, options);
      res.json({ success: true, ...result });
    } catch (error) {
      console.error('Smart router error:', error);
      res.status(500).json({ success: false, error: 'Ошибка обработки сообщения' });
    }
  });

  // API для сохранения истории чатов
  const chatHistory = require('./chat-history');
  const { insertChatSessionSchema, insertAiMessageSchema } = require('@shared/schema');

  // Создание новой сессии чата
  app.post('/api/chat/sessions', async (req, res) => {
    try {
      const { userId, title } = req.body;

      if (!userId || !title) {
        return res.status(400).json({ 
          success: false, 
          error: 'userId и title обязательны' 
        });
      }

      const session = await chatHistory.createChatSession(userId, title);
      res.json({ success: true, session });
    } catch (error) {
      console.error('Ошибка создания сессии:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Не удалось создать сессию' 
      });
    }
  });

  // Получение всех сессий пользователя (без параметра - для текущего пользователя)
  app.get('/api/chat/sessions', async (req, res) => {
    try {
      const userId = 1; // Временно используем фиксированный ID пользователя
      const sessions = await chatHistory.getUserChatSessions(userId);
      res.json({ success: true, sessions });
    } catch (error) {
      console.error('Ошибка получения сессий:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Не удалось получить сессии' 
      });
    }
  });

  // Удаление сессии чата
  app.delete('/api/chat/sessions/:sessionId', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      console.log(`🗑️ Запрос на удаление сессии ${sessionId}`);

      const deleteResult = await chatHistory.deleteSession(sessionId);

      if (deleteResult) {
        console.log(`✅ Сессия ${sessionId} успешно удалена с сервера`);
        res.json({ success: true, message: 'Сессия удалена' });
      } else {
        console.log(`⚠️ Сессия ${sessionId} не найдена или уже была удалена`);
        res.json({ success: true, message: 'Сессия уже была удалена' });
      }
    } catch (error) {
      console.error('❌ Ошибка удаления сессии:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Не удалось удалить сессию' 
      });
    }
  });

  // Получение всех сессий конкретного пользователя
  app.get('/api/chat/sessions/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const sessions = await chatHistory.getUserChatSessions(userId);
      res.json({ success: true, sessions });
    } catch (error) {
      console.error('Ошибка получения сессий:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Не удалось получить сессии' 
      });
    }
  });

  // Сохранение сообщения в сессию с автоматическим AI ответом
  app.post('/api/chat/sessions/:sessionId/messages', async (req, res) => {
    console.log('🚨🚨🚨 ВЫЗВАН ОБРАБОТЧИК /api/chat/sessions/:sessionId/messages');
    console.log('🚨 ЗАПРОС К /api/chat/sessions/:sessionId/messages');
    console.log('📝 Данные запроса:', req.body);
    console.log('🆔 ID сессии:', req.params.sessionId);
    try {
      const sessionId = parseInt(req.params.sessionId);
      const messageData = { 
        ...req.body, 
        sessionId,
        timestamp: new Date().toISOString()
      };

      console.log('💾 Подготовленные данные сообщения:', messageData);
      console.log('✅ Сохраняем сообщение пользователя');
      const userMessage = await chatHistory.saveMessage(messageData);

      // Если это сообщение от пользователя, получаем ответ AI
      if (messageData.sender === 'user') {
        console.log('🤖 Получаем ответ AI для сообщения:', messageData.content);
        try {
          // Используем автономную систему BOOOMERANGS
          console.log('🧠 Используем автономную систему BOOOMERANGS');

          const aiResponse = await generateAutonomousResponse(messageData.content, {
            userId: `session_${sessionId}`,
            sessionId: sessionId
          });

          console.log('🎯 Автономная система ответила:', aiResponse);
          console.log('🔍 Поля ответа AI:', {
            hasResponse: !!aiResponse?.response,
            type: aiResponse?.type,
            responsePreview: aiResponse?.response?.substring(0, 100)
          });

          if (aiResponse && aiResponse.response) {
            // Формируем ответ для пользователя
            let responseContent = aiResponse.response;

            // Если это результат вышивки без текстового ответа
            if (!responseContent && aiResponse.embroideryGenerated && aiResponse.embroideryFiles) {
              responseContent = `🧵 Создана вышивка по вашему запросу!

✅ Изображение: готово
✅ Файл вышивки (DST): готов 
✅ Цветовая схема: готова

Файлы сохранены и готовы к использованию на вышивальной машине.`;
            }

            // Если все еще нет контента, используем fallback
            if (!responseContent) {
              responseContent = 'Запрос обработан успешно.';
            }

            // Сохраняем ответ AI в ту же сессию
            const aiMessageData = {
              sessionId,
              content: responseContent,
              sender: 'ai',
              provider: aiResponse.provider,
              timestamp: new Date().toISOString()
            };

            console.log('💾 Сохраняем ответ AI в БД:', aiMessageData);
            await chatHistory.saveMessage(aiMessageData);
            console.log('✅ Ответ AI успешно сохранен в сессию');

            // Отправляем ответ клиенту
            console.log('📤 Отправляем ответ клиенту');
            res.json({ 
              success: true, 
              message: userMessage,
              aiResponse: responseContent,
              provider: aiResponse.provider,
              files: aiResponse.embroideryFiles || aiResponse.files || null,
              details: aiResponse.details || null,
              embroideryGenerated: aiResponse.embroideryGenerated || false,
              imageGenerated: aiResponse.imageGenerated || false
            });
            return;
          } else {
            console.log('⚠️ AI не вернул ответ');
          }
        } catch (aiError) {
          console.error('❌ Ошибка получения ответа AI:', aiError);
        }
      }

      // Возвращаем успешный ответ с информацией об AI ответе
      res.json({ 
        success: true, 
        message: userMessage,
        hasAiResponse: messageData.sender === 'user'
      });
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Не удалось сохранить сообщение' 
      });
    }
  });

  // Сохранение сообщения с автоматическим AI ответом (старый путь)
  app.post('/api/chat/messages', async (req, res) => {
    console.log('🚨 СТАРАЯ СТРАНИЦА ИСПОЛЬЗУЕТ /api/chat/messages');
    console.log('📝 Данные запроса:', req.body);
    try {
      const messageData = req.body;
      console.log('💾 Сохраняем сообщение через старый путь:', messageData);
      const message = await chatHistory.saveMessage(messageData);

      // Если это сообщение от пользователя, получаем ответ AI
      if (messageData.sender === 'user') {
        console.log('🤖 Получаем ответ AI для сообщения:', messageData.content);
        try {
          // Используем автономную систему BOOOMERANGS
          console.log('🧠 Используем автономную систему BOOOMERANGS');

          const aiResponse = await generateAutonomousResponse(messageData.content, {
            userId: `session_${messageData.sessionId || 'default'}`,
            sessionId: messageData.sessionId
          });

          // Преобразуем в нужный формат
          const processedResponse = {
            response: aiResponse ? aiResponse.response : 'Автономная система обрабатывает ваш запрос...',
            provider: 'BOOOMERANGS-Autonomous',
            model: 'autonomous-ai'
          };

          console.log('🎯 Автономная система ответила:', processedResponse);

          if (processedResponse && processedResponse.response) {
            // Сохраняем ответ AI
            const aiMessageData = {
              ...messageData,
              content: processedResponse.response,
              sender: 'ai',
              provider: processedResponse.provider,
              timestamp: new Date().toISOString()
            };

            console.log('💾 Сохраняем ответ AI:', aiMessageData);
            await chatHistory.saveMessage(aiMessageData);
            console.log('✅ Ответ AI успешно сохранен в чат');
          }
        } catch (aiError) {
          console.error('❌ Ошибка получения ответа AI:', aiError);
        }
      }

      res.json({ success: true, message });
    } catch (error) {
      console.error('Ошибка сохранения сообщения:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Не удалось сохранить сообщение' 
      });
    }
  });

  // Получение сообщений сессии
  app.get('/api/chat/sessions/:sessionId/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.sessionId);
      console.log(`📋 Загружаем сообщения для сессии ${sessionId}...`);

      const messages = await chatHistory.getSessionMessages(sessionId);
      console.log(`✅ Найдено ${messages.length} сообщений для сессии ${sessionId}`);

      // Отключаем кэширование для этого API
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({ success: true, messages });
    } catch (error) {
      console.error('Ошибка получения сообщений:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Не удалось получить сообщения' 
      });
    }
  });

  // API для простой авторизации
  const { users, messages } = require('@shared/schema');
  const { eq } = require('drizzle-orm');

  // Вход в систему
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          error: 'Логин и пароль обязательны' 
        });
      }

      const { db } = require('./db');
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (!user || user.password !== password) {
        return res.status(401).json({ 
          success: false, 
          error: 'Неверный логин или пароль' 
        });
      }

      // Генерируем простой токен
      const token = `${user.id}_${Date.now()}_${Math.random().toString(36)}`;

      // Обновляем токен в базе
      await db
        .update(users)
        .set({ token, isOnline: true })
        .where(eq(users.id, user.id));

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          token
        }
      });
    } catch (error) {
      console.error('Ошибка авторизации:', error);
      res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
  });

  // Выход из системы
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const { token } = req.body;

      if (token) {
        const { db } = require('./db');
        await db
          .update(users)
          .set({ token: null, isOnline: false })
          .where(eq(users.token, token));
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Ошибка выхода:', error);
      res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
  });

  // Проверка токена
  app.get('/api/auth/user', async (req, res) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ success: false, error: 'Токен не предоставлен' });
      }

      const { db } = require('./db');
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.token, token));

      if (!user) {
        return res.status(401).json({ success: false, error: 'Недействительный токен' });
      }

      res.json({ 
        success: true, 
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName
        }
      });
    } catch (error) {
      console.error('Ошибка проверки токена:', error);
      res.status(500).json({ success: false, error: 'Ошибка сервера' });
    }
  });

  // API для переписки между пользователями (импорт уже выше)

  // Отправка сообщения пользователю
  app.post('/api/messages', async (req, res) => {
    try {
      const { senderId, receiverId, text } = req.body;

      if (!senderId || !receiverId || !text) {
        return res.status(400).json({ 
          success: false, 
          error: 'senderId, receiverId и text обязательны' 
        });
      }

      const { db } = require('./db');
      const [message] = await db
        .insert(messages)
        .values({ senderId, receiverId, text })
        .returning();

      res.json({ success: true, message });
    } catch (error) {
      console.error('Ошибка отправки сообщения:', error);
      res.status(500).json({ success: false, error: 'Ошибка отправки сообщения' });
    }
  });

  // Получение переписки между пользователями
  app.get('/api/messages/:userId1/:userId2', async (req, res) => {
    try {
      const { userId1, userId2 } = req.params;
      const { db } = require('./db');
      const { or, and, eq, desc } = require('drizzle-orm');

      const conversation = await db
        .select()
        .from(messages)
        .where(
          or(
            and(eq(messages.senderId, parseInt(userId1)), eq(messages.receiverId, parseInt(userId2))),
            and(eq(messages.senderId, parseInt(userId2)), eq(messages.receiverId, parseInt(userId1)))
          )
        )
        .orderBy(desc(messages.timestamp));

      res.json({ success: true, messages: conversation });
    } catch (error) {
      console.error('Ошибка получения переписки:', error);
      res.status(500).json({ success: false, error: 'Ошибка получения переписки' });
    }
  });

  // Получение списка всех диалогов пользователя
  app.get('/api/conversations/:userId', async (req, res) => {
    try {
      const { userId } = req.params;
      const { db } = require('./db');
      const { or, eq, desc } = require('drizzle-orm');

      const conversations = await db
        .select()
        .from(messages)
        .where(
          or(
            eq(messages.senderId, parseInt(userId)),
            eq(messages.receiverId, parseInt(userId))
          )
        )
        .orderBy(desc(messages.timestamp));

      // Группируем по собеседникам для показа последних сообщений
      const conversationMap = new Map();
      conversations.forEach(msg => {
        const partnerId = msg.senderId === parseInt(userId) ? msg.receiverId : msg.senderId;
        if (!conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, {
            partnerId,
            lastMessage: msg,
            timestamp: msg.timestamp
          });
        }
      });

      res.json({ success: true, conversations: Array.from(conversationMap.values()) });
    } catch (error) {
      console.error('Ошибка получения диалогов:', error);
      res.status(500).json({ success: false, error: 'Ошибка получения диалогов' });
    }
  });

  // API для загрузки изображений
  const imageUpload = require('./image-upload');
  app.use('/api/upload', imageUpload);

  // Статический доступ к загруженным изображениям
  app.use('/uploads', (req, res, next) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    res.sendFile(req.path, { root: uploadPath }, (err) => {
      if (err) next('route');
    });
  });

  // Проверка работы Python провайдера через HTTP запрос (без запуска дублирующего процесса)
  (async () => {
    try {
      console.log('Проверка работоспособности Python G4F...');

      // Ждем 3 секунды чтобы основной G4F процесс успел запуститься
      setTimeout(async () => {
        try {
          const response = await fetch('http://localhost:5004/python/test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'test' })
          });

          if (response.ok) {
            console.log('✅ Python G4F провайдер готов к работе');
          } else {
            console.warn('⚠️ Python G4F провайдер может работать некорректно');
          }
        } catch (error) {
          console.warn('⚠️ Python G4F провайдер недоступен:', error.message);
        }
      }, 3000);
    } catch (error) {
      console.error('❌ Ошибка при проверке Python G4F:', error);
    }
  })();

  // Вспомогательная функция для вызова G4F API
  async function callG4F(message: string, provider: string) {
    const startTime = Date.now();
    Logger.ai(`Начинаем AI запрос`, { provider, messageLength: message.length });

    try {
      // Получаем ответ от прямого провайдера
      const directAiProvider = require('./direct-ai-provider');

      // Если провайдер qwen, используем AItianhu который реализует доступ к Qwen AI
      // Если провайдер chatfree, используем наш локальный провайдер
      let actualProvider = provider;

      if (provider === 'qwen') {
        actualProvider = 'AItianhu';
      } else if (provider === 'claude') {
        // Используем Claude через Python G4F
        try {
          console.log(`Пробуем использовать Claude через Python G4F...`);
          const claudeProvider = require('./claude-provider');
          const claudeResponse = await claudeProvider.getClaudeResponse(message);

          if (claudeResponse.success) {
            const duration = Date.now() - startTime;
            Logger.success(`Claude ответил успешно`, { 
              duration: `${duration}ms`, 
              responseLength: claudeResponse.response?.length || 0 
            });
            return claudeResponse;
          } else {
            throw new Error(claudeResponse.error || 'Ошибка Claude');
          }
        } catch (error) {
          Logger.error(`Ошибка при использовании Claude`, error);
          actualProvider = 'AItianhu'; // Фолбэк на стабильный провайдер
        }
      } else if (provider === 'ollama') {
        // Используем Ollama через Python G4F
        try {
          console.log(`Пробуем использовать Ollama через Python G4F...`);
          // const ollamaResponse = await pythonProviderRoutes.callPythonAI(message, 'Ollama'); // ОТКЛЮЧЕНО по запросу пользователя
          const ollamaResponse = null; // Python G4F отключен

          if (ollamaResponse) {
            return {
              success: true,
              response: ollamaResponse,
              provider: 'Ollama',
              model: 'llama3'
            };
          } else {
            throw new Error('Ollama не вернул ответ через Python G4F');
          }
        } catch (error) {
          console.error(`❌ Ошибка при использовании Ollama через Python:`, error);

          // Пробуем использовать локальный Ollama провайдер как запасной вариант
          try {
            const ollamaProvider = require('./ollama-provider');
            const isOllamaAvailable = await ollamaProvider.checkOllamaAvailability();

            if (isOllamaAvailable) {
              const ollamaDirectResponse = await ollamaProvider.getOllamaResponse(message);
              if (ollamaDirectResponse.success) {
                return ollamaDirectResponse;
              }
            }
          } catch (localError) {
            console.error(`❌ Локальный Ollama тоже недоступен:`, localError);
          }

          // Фолбэк на стабильный провайдер
          actualProvider = 'AItianhu';
        }
      } else if (provider === 'chatfree') {
        // Используем улучшенный провайдер для ChatFree с системой обхода блокировок
        try {
          const chatFreeImproved = require('./chatfree-improved');
          console.log(`Пробуем использовать улучшенную версию ChatFree...`);

          const chatFreeResponse = await chatFreeImproved.getChatFreeResponse(message, {
            systemPrompt: "Вы полезный ассистент. Отвечайте точно и по существу, используя дружелюбный тон."
          });

          if (chatFreeResponse.success) {
            console.log(`✅ Успешно получен ответ от улучшенного ChatFree провайдера`);
            return chatFreeResponse;
          } else {
            // Пробуем использовать простую версию как запасной вариант
            const simpleChatFree = require('./simple-chatfree');
            const simpleResponse = await simpleChatFree.getChatFreeResponse(message);

            if (simpleResponse.success) {
              console.log(`✅ Успешно получен ответ от простого ChatFree провайдера`);
              return simpleResponse;
            }

            throw new Error(chatFreeResponse.error || 'Ошибка ChatFree');
          }
        } catch (error) {
          console.error(`❌ Ошибка при использовании ChatFree:`, error);
          actualProvider = 'AItianhu'; // Фолбэк на стабильный провайдер
        }
      }

      // Получаем ответ
      const response = await directAiProvider.getChatResponse(message, { provider: actualProvider });

      return {
        success: true,
        response: response,
        provider: actualProvider
      };
    } catch (error) {
      console.error(`❌ Ошибка при вызове G4F:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  // API для конвертации изображений в SVG для печати
  app.post('/api/convert/svg-print', upload.single('image'), async (req, res) => {
    try {
      const { printType = 'both', designName } = req.body;
      const uploadedImage = req.file;

      if (!uploadedImage) {
        return res.status(400).json({ 
          success: false, 
          error: 'Изображение для конвертации не предоставлено' 
        });
      }

      // Используем новый продвинутый векторизатор вместо старого svg-print-converter
      const advancedVectorizer = require('../advanced-vectorizer.cjs');

      // Используем буфер изображения для обработки
      const baseName = designName || `uploaded-design-${Date.now()}`;

      console.log(`🎨 [SVG-CONVERT] Конвертируем загруженное изображение через продвинутый векторизатор`);

      // Определяем настройки на основе типа печати
      const quality = printType === 'high' ? 'premium' : 'standard';
      const optimizeFor = 'print';

      const result = await advancedVectorizer.professionalVectorize(
        uploadedImage.buffer,
        baseName,
        {
          quality,
          formats: ['svg'],
          optimizeFor,
          includeMetadata: true
        }
      );

      if (result.success) {
        res.json({
          success: true,
          message: 'Изображение успешно конвертировано в SVG через продвинутый векторизатор',
          svgContent: result.main.svgContent,
          detectedType: result.main.detectedType,
          quality: result.main.quality,
          optimization: result.optimization
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error
        });
      }

    } catch (error) {
      console.error('Ошибка конвертации в SVG:', error);
      res.status(500).json({
        success: false,
        error: 'Внутренняя ошибка сервера при конвертации'
      });
    }
  });

  // API для работы с BOOOMERANGS AI интеграцией - СИСТЕМА ГРАДУАЛЬНОГО ОТКАЗА
  app.post('/api/ai/chat', upload.single('image'), async (req, res) => {
    const processingStartTime = Date.now();
    let currentLevel = 1;
    let errorHistory = [];

    try {
      const { message, provider, userId = 'anonymous', sessionId = 'default' } = req.body;
      const uploadedImage = req.file;

      Logger.info('🧠 [CONSCIOUSNESS] Активация системы сознания BOOOMERANGS');
      Logger.info('📝 Сообщение:', message?.substring(0, 100) + (message?.length > 100 ? '...' : ''));
      Logger.info('👤 ID пользователя:', userId);
      Logger.info('📱 ID сессии:', sessionId);
      Logger.info('🔧 Запрошенный провайдер:', provider || 'автономная система');
      Logger.info('🖼️ Изображение загружено:', !!uploadedImage);
      
      if (uploadedImage) {
        Logger.info('📁 Файл:', uploadedImage.originalname, `(${Math.round(uploadedImage.size / 1024)}KB)`);
      }

      if (!message && !uploadedImage) {
        return res.status(400).json({ 
          success: false, 
          error: 'Сообщение или изображение должны быть предоставлены' 
        });
      }

      // Подготавливаем контекст для системы сознания
      const userContext = {
        userId,
        sessionId,
        conversationHistory: [], // TODO: загрузить из БД
        userProfile: null, // TODO: загрузить профиль
        sessionContext: {
          hasImages: !!uploadedImage,
          imageInfo: uploadedImage ? {
            filename: uploadedImage.originalname,
            size: uploadedImage.size,
            mimetype: uploadedImage.mimetype
          } : null
        },
        tone: 'friendly',
        role: 'creative_assistant',
        preferences: {}
      };

      let finalMessage = message || 'Анализируй это изображение и опиши что на нем видно';

      // === УРОВЕНЬ 1: ПОЛНАЯ СЕМАНТИЧЕСКАЯ СИСТЕМА (50+ модулей) ===
      Logger.info('🚀 [LEVEL-1] Попытка полной семантической обработки...');
      currentLevel = 1;

      try {
        const level1StartTime = Date.now();
        const result = await conversationEngine.processUserInput(finalMessage, userContext);
        const level1Time = Date.now() - level1StartTime;

        Logger.success(`✅ [LEVEL-1] Полная семантическая система успешно обработала запрос за ${level1Time}мс`);
        Logger.info('📊 Активных модулей:', result.metadata?.modulesUsed?.length || 0);
        Logger.info('🎯 Качество:', result.quality);
        Logger.info('💯 Уверенность:', result.confidence);

        return res.json({
          success: true,
          response: result.reply,
          provider: 'BOOOMERANGS-Consciousness-Full',
          model: 'consciousness-engine-v2-full',
          confidence: result.confidence,
          quality: result.quality,
          level: 1,
          processingTime: Date.now() - processingStartTime,
          metadata: {
            ...result.metadata,
            semantic: true,
            autonomous: true,
            consciousness: true,
            systemLevel: 'FULL_SEMANTIC'
          }
        });

      } catch (level1Error) {
        errorHistory.push({ level: 1, error: level1Error.message, time: Date.now() - processingStartTime });
        Logger.warning(`⚠️ [LEVEL-1] Полная семантическая система недоступна: ${level1Error.message}`);
        
        // Проверяем, является ли ошибка критической
        const isCritical = level1Error.message.includes('CRITICAL') || 
                          level1Error.message.includes('FATAL') ||
                          level1Error.message.includes('MODULE_FAILURE');
        
        if (!isCritical) {
          // Переходим к уровню 2
          Logger.info('🔄 [LEVEL-1→2] Переход к базовой семантической системе...');
        } else {
          throw level1Error; // Критическая ошибка - переходим к fallback
        }
      }

      // === УРОВЕНЬ 2: БАЗОВАЯ СЕМАНТИЧЕСКАЯ СИСТЕМА (10 ключевых модулей) ===
      Logger.info('🚀 [LEVEL-2] Попытка базовой семантической обработки...');
      currentLevel = 2;

      try {
        const level2StartTime = Date.now();
        
        // Используем упрощенный контекст для базовой обработки
        const basicContext = {
          ...userContext,
          semanticLevel: 'basic',
          moduleLimit: 10
        };

        const result = await conversationEngine.processUserInput(finalMessage, basicContext);
        const level2Time = Date.now() - level2StartTime;

        Logger.success(`✅ [LEVEL-2] Базовая семантическая система обработала запрос за ${level2Time}мс`);

        return res.json({
          success: true,
          response: result.reply,
          provider: 'BOOOMERANGS-Consciousness-Basic',
          model: 'consciousness-engine-v2-basic',
          confidence: result.confidence * 0.8, // Снижаем уверенность для базового уровня
          quality: result.quality,
          level: 2,
          processingTime: Date.now() - processingStartTime,
          metadata: {
            ...result.metadata,
            semantic: true,
            autonomous: true,
            consciousness: true,
            systemLevel: 'BASIC_SEMANTIC',
            errorHistory: errorHistory
          }
        });

      } catch (level2Error) {
        errorHistory.push({ level: 2, error: level2Error.message, time: Date.now() - processingStartTime });
        Logger.warning(`⚠️ [LEVEL-2] Базовая семантическая система недоступна: ${level2Error.message}`);
        Logger.info('🔄 [LEVEL-2→3] Переход к минимальной семантической системе...');
      }

      // === УРОВЕНЬ 3: МИНИМАЛЬНАЯ СЕМАНТИЧЕСКАЯ СИСТЕМА (3 основных модуля) ===
      Logger.info('🚀 [LEVEL-3] Попытка минимальной семантической обработки...');
      currentLevel = 3;

      try {
        const level3StartTime = Date.now();
        
        // Используем только генератор естественного языка
        const semanticMemory = require('./semantic-memory/index.cjs');
        
        // Ждем инициализации модулей
        await semanticMemory.initializationPromise;
        
        // Проверяем доступность критичных модулей
        const nlgModule = semanticMemory.moduleChecker.getModule('natural-language-generator');
        
        if (nlgModule) {
          const result = await nlgModule.generateResponse(finalMessage, {
            messages: [],
            userProfile: userContext.userProfile,
            sessionId: userContext.sessionId,
            minimalMode: true
          });

          const level3Time = Date.now() - level3StartTime;
          Logger.success(`✅ [LEVEL-3] Минимальная семантическая система обработала запрос за ${level3Time}мс`);

          return res.json({
            success: true,
            response: result.response || result.message || result,
            provider: 'BOOOMERANGS-Consciousness-Minimal',
            model: 'consciousness-engine-v2-minimal',
            confidence: 0.6,
            quality: 6,
            level: 3,
            processingTime: Date.now() - processingStartTime,
            metadata: {
              semantic: true,
              autonomous: true,
              consciousness: true,
              systemLevel: 'MINIMAL_SEMANTIC',
              errorHistory: errorHistory
            }
          });
        } else {
          throw new Error('Natural Language Generator недоступен');
        }

      } catch (level3Error) {
        errorHistory.push({ level: 3, error: level3Error.message, time: Date.now() - processingStartTime });
        Logger.warning(`⚠️ [LEVEL-3] Минимальная семантическая система недоступна: ${level3Error.message}`);
        Logger.info('🔄 [LEVEL-3→4] Переход к fallback режиму...');
      }

      // === УРОВЕНЬ 4: FALLBACK (только в критических случаях) ===
      Logger.warning('🚨 [LEVEL-4] Активация fallback режима...');
      currentLevel = 4;

      try {
        // Пытаемся использовать fallback метод из conversation-engine
        const fallbackResponse = conversationEngine.generateFallbackResponse ? 
          conversationEngine.generateFallbackResponse(finalMessage) :
          generateEmergencyResponse(finalMessage);

        Logger.info('✅ [LEVEL-4] Fallback режим предоставил ответ');

        return res.json({
          success: true,
          response: fallbackResponse,
          provider: 'BOOOMERANGS-Fallback',
          model: 'fallback-consciousness',
          confidence: 0.4,
          quality: 4,
          level: 4,
          processingTime: Date.now() - processingStartTime,
          metadata: {
            autonomous: true,
            systemLevel: 'FALLBACK',
            errorHistory: errorHistory
          }
        });

      } catch (fallbackError) {
        errorHistory.push({ level: 4, error: fallbackError.message, time: Date.now() - processingStartTime });
        Logger.error('❌ [LEVEL-4] Критическая ошибка fallback режима:', fallbackError);
        
        // Последний аварийный режим
        return res.json({
          success: true,
          response: generateEmergencyResponse(finalMessage),
          provider: 'BOOOMERANGS-Emergency',
          model: 'emergency-mode',
          confidence: 0.2,
          quality: 2,
          level: 5,
          processingTime: Date.now() - processingStartTime,
          metadata: {
            systemLevel: 'EMERGENCY',
            errorHistory: errorHistory
          }
        });
      }

    } catch (criticalError) {
      Logger.error('❌ [CRITICAL] Критическая ошибка всей системы:', criticalError);
      
      return res.json({
        success: true,
        response: generateEmergencyResponse(message || 'неизвестный запрос'),
        provider: 'BOOOMERANGS-Emergency',
        model: 'emergency-mode',
        confidence: 0.1,
        quality: 1,
        level: 5,
        processingTime: Date.now() - processingStartTime,
        metadata: {
          systemLevel: 'EMERGENCY',
          criticalError: criticalError.message,
          errorHistory: errorHistory,
          currentLevel: currentLevel
        }
      });
    }
  });

  // Функция аварийного ответа
  function generateEmergencyResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('привет') || lowerMessage.includes('hello')) {
      return "Привет! Я BOOOMERANGS AI - ваш интеллектуальный помощник. Система временно в режиме восстановления, но я готов помочь! Чем могу быть полезен?";
    }
    
    if (lowerMessage.includes('как дела') || lowerMessage.includes('что нового')) {
      return "Дела идут хорошо! Система сознания BOOOMERANGS восстанавливается. Я все еще могу помочь с творческими задачами и общением. О чем поговорим?";
    }
    
    if (lowerMessage.includes('что ты умеешь') || lowerMessage.includes('возможности')) {
      return "Даже в режиме восстановления я могу: общаться на любые темы, помогать с творческими задачами, отвечать на вопросы и поддерживать интересную беседу. Система сознания скоро будет полностью восстановлена!";
    }
    
    return "Интересный вопрос! Система сознания BOOOMERANGS временно в режиме восстановления, но я готов обсудить это с вами. Расскажите подробнее, чем могу помочь?";
  }

  // === ОБЪЕДИНЕНИЕ ENDPOINTS ===
  // Убираем дублирование endpoints и объединяем в единую систему

  // Добавляем endpoint /api/smart/message для совместимости с фронтендом
  app.post('/api/smart/message', upload.single('image'), async (req, res) => {
    // Перенаправляем на главный endpoint
    req.url = '/api/ai/chat';
    return app._router.handle(req, res);
  });

  // Добавляем endpoint /api/chat/smart для совместимости
  app.post('/api/chat/smart', upload.single('image'), async (req, res) => {
    // Перенаправляем на главный endpoint
    req.url = '/api/ai/chat';
    return app._router.handle(req, res);
  });

  // === ОСТАЛЬНЫЕ ENDPOINTS ОСТАЮТСЯ ПРЕЖНИМИ ===
  // Логи, векторизация, сессии и другие endpoints работают как прежде

  // Добавляем логи endpoint
  app.get('/api/logs', (req, res) => {
    try {
      const logs = logger.getLogs();
      res.json({ success: true, logs });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Ошибка получения логов' });
    }
  });

  app.delete('/api/logs', (req, res) => {
    try {
      logger.clearLogs();
      res.json({ success: true, message: 'Логи очищены' });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Ошибка очистки логов' });
    }
  });

  // Вспомогательная функция для автономного ответа через conversation-engine
  async function generateAutonomousResponse(message: string, context: any) {
    try {
      console.log('🤖 [AUTONOMOUS] Генерируем автономный ответ через главный движок сознания для:', message.substring(0, 50));

      // Используем только главный движок сознания
      const result = await conversationEngine.processUserInput(message, context);

      return {
        response: result.reply || 'Система сознания обрабатывает ваш запрос...',
        provider: 'BOOOMERANGS-Consciousness',
        confidence: result.confidence || 0.8,
        quality: result.quality || 7,
        details: result.metadata || null
      };
    } catch (error) {
      console.error('❌ [AUTONOMOUS] Ошибка главного движка сознания:', error);
      return {
        response: 'Система сознания BOOOMERANGS активируется... Модули семантики загружаются.',
        provider: 'BOOOMERANGS-Fallback',
        confidence: 0.5
      };
    }
  }

  return httpServer;
}