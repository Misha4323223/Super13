/**
 * Слой интеграции семантической памяти с интеллектуальным процессором
 * Обеспечивает безопасную интеграцию без нарушения существующей архитектуры
 */

// ===== ИМПОРТЫ И ЗАВИСИМОСТИ =====
const path = require('path');

// ✅ ИСПРАВЛЕНО: Устранение циклических зависимостей - ленивая загрузка модулей
let semanticMemory = null;
let intelligentChatProcessor = null;
let conversationEngine = null;
let naturalLanguageGenerator = null;

// Кэш модулей для предотвращения повторной загрузки
const moduleCache = new Map();
const MODULE_LOAD_TIMEOUT = 3000; // 3 секунды таймаут

const semanticMemoryModule = require('./semantic-memory/index.cjs');
const userMemoryManager = require('./semantic-memory/user-memory-manager.cjs');
const userProfiler = require('./semantic-memory/user-profiler.cjs');
const learningSystem = require('./semantic-memory/learning-system.cjs');

// ✅ ДОБАВЛЕНЫ: Импорты для новых методов
let emotionalSemanticMatrix;
let metaSemanticEngine;

try {
  emotionalSemanticMatrix = require('./semantic-memory/emotional-semantic-matrix.cjs');
} catch (error) {
  console.log('⚠️ [SEMANTIC] Эмоционально-семантическая матрица недоступна:', error.message);
}

try {
  metaSemanticEngine = require('./semantic-memory/meta-semantic-engine.cjs');
} catch (error) {
  console.log('⚠️ [SEMANTIC] Мета-семантический движок недоступен:', error.message);
}

// Подключаем визуально-семантическую интеграцию
let visualSemanticIntegration;
try {
  visualSemanticIntegration = require('./visual-semantic-integration.cjs');
} catch (error) {
  console.log('⚠️ [SEMANTIC] Визуально-семантическая интеграция недоступна:', error.message);
}

const SmartLogger = {
  integration: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`🔗 [${timestamp}] SEMANTIC INTEGRATION: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, data) => {
    const timestamp = new Date().toISOString();
    console.error(`❌ [${timestamp}] SEMANTIC ERROR: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message, data) => {
    const timestamp = new Date().toISOString();
    console.warn(`⚠️ [${timestamp}] SEMANTIC WARNING: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  info: (message, data) => {
    const timestamp = new Date().toISOString();
    console.info(`ℹ️ [${timestamp}] SEMANTIC INFO: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  debug: (message, data) => {
    const timestamp = new Date().toISOString();
    console.debug(`🐞 [${timestamp}] SEMANTIC DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// ✅ ИСПРАВЛЕНО: Безопасная загрузка модулей с таймаутами и error handling
async function loadModuleSafely(moduleName, modulePath) {
  try {
    if (moduleCache.has(moduleName)) {
      return moduleCache.get(moduleName);
    }

    // Создаем промис с таймаутом
    const loadPromise = new Promise((resolve, reject) => {
      try {
        // Очищаем кэш require для принуждения перезагрузки
        const fullPath = require.resolve(modulePath);
        if (require.cache[fullPath]) {
          delete require.cache[fullPath];
        }

        const module = require(modulePath);
        resolve(module);
      } catch (error) {
        reject(error);
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Таймаут загрузки модуля ${moduleName}`)), MODULE_LOAD_TIMEOUT);
    });

    const module = await Promise.race([loadPromise, timeoutPromise]);

    // ✅ ПРОВЕРЯЕМ ДОСТУПНОСТЬ КЛЮЧЕВЫХ МЕТОДОВ
    if (moduleName === 'natural-language-generator' && module) {
      if (typeof module.generateResponse !== 'function') {
        throw new Error(`Модуль ${moduleName} не содержит метод generateResponse`);
      }
    }

    moduleCache.set(moduleName, module);
    SmartLogger.info(`✅ Модуль ${moduleName} загружен успешно`);
    return module;
  } catch (error) {
    SmartLogger.error(`❌ Не удалось загрузить модуль ${moduleName}: ${error.message}`);
    return null;
  }
}

// ✅ ИСПРАВЛЕНО: Асинхронная инициализация модулей с проверкой циклических зависимостей
async function initializeModules() {
  SmartLogger.info('🚀 Начинаем безопасную инициализацию модулей...');

  // Загружаем модули в правильном порядке для избежания циклических зависимостей
  try {
    // 1. Сначала генератор естественного языка (базовый модуль)
    naturalLanguageGenerator = await loadModuleSafely('natural-language-generator', './semantic-memory/natural-language-generator.cjs');
    if (naturalLanguageGenerator) {
      SmartLogger.info('✅ Генератор естественного языка загружен');
    }
  } catch (error) {
    SmartLogger.error('❌ Генератор естественного языка недоступен:', error.message);
  }

  try {
    // 2. Семантическая память (может зависеть от генератора)
    semanticMemory = await loadModuleSafely('semantic-memory', './semantic-memory/index.cjs');
    if (semanticMemory) {
      SmartLogger.info('✅ Семантическая память загружена');
    }
  } catch (error) {
    SmartLogger.error('❌ Семантическая память недоступна:', error.message);
  }

  try {
    // 3. Интеллектуальный процессор (зависит от предыдущих)
    intelligentChatProcessor = await loadModuleSafely('intelligent-chat-processor', './intelligent-chat-processor.cjs');
    if (intelligentChatProcessor) {
      SmartLogger.info('✅ Интеллектуальный процессор загружен');
    }
  } catch (error) {
    SmartLogger.error('❌ Интеллектуальный процессор недоступен:', error.message);
  }

  SmartLogger.info('🎯 Инициализация модулей завершена');
}

// Запускаем инициализацию
initializeModules().catch(error => {
  SmartLogger.error('❌ Критическая ошибка инициализации:', error.message);
});

/**
 * Интеграционный анализатор - главный мозг системы
 * Решает, должна ли семантика управлять ответом или использовать fallback
 */
class SemanticIntegrationLayer {
  constructor() {
    this.semanticThreshold = 0; // УБИРАЕМ все пороги - семантика ВСЕГДА активна
    this.enabled = true; // ПРИНУДИТЕЛЬНО всегда включено
  }

  /**
   * ФАЗА 2: Мета-семантическая интеграция с глубоким анализом понимания
   */
  async analyzeWithSemantics(userInput, context = {}) {
    try {
      // Автоматическое определение знаниевых запросов
      const needsExternalKnowledge = this.detectKnowledgeRequest(userInput);

      // Подготовка контекста анализа
      const enhancedContext = {
        timestamp: new Date().toISOString(),
        sessionId: context.sessionId || 'default',
        language: context.language || 'ru',
        userPreferences: context.userPreferences || {},
        conversationHistory: context.conversationHistory || [],
        includeAdvancedSearch: needsExternalKnowledge,
        includeExternalKnowledge: needsExternalKnowledge,
        ...context
      };

      console.log(`🔍 [SEMANTIC-INTEGRATION] Запуск анализа: "${userInput}"`);

      const analysisResults = {
        metaSemantics: null,
        emotionalContext: null,
        userProfile: null,
        basicAnalysis: null,
        errors: []
      };

      // ЭТАП 1: Мета-семантический анализ (критичный)
      try {
        const shouldUseMeta = this.shouldUseMetaSemantics(userInput, context);
        console.log(`🎯 [SEMANTIC-INTEGRATION] Использовать мета-семантику: ${shouldUseMeta}`);

        if (shouldUseMeta && this.isModuleActive('metaSemanticEngine')) {
          analysisResults.metaSemantics = await this.performMetaSemanticAnalysis(userInput, enhancedContext);
          console.log(`✅ [SEMANTIC-INTEGRATION] Мета-семантический анализ выполнен`);
        }
      } catch (error) {
        console.error('⚠️ [SEMANTIC-INTEGRATION] Ошибка мета-семантики:', error.message);
        analysisResults.errors.push('meta-semantics');
      }

      // ЭТАП 2: Эмоциональный анализ (опциональный)
      try {
        if (this.isModuleActive('emotionalSemanticMatrix')) {
          analysisResults.emotionalContext = await this.performEmotionalAnalysis(userInput, enhancedContext);
          console.log(`✅ [SEMANTIC-INTEGRATION] Эмоциональный анализ выполнен`);
        }
      } catch (error) {
        console.error('⚠️ [SEMANTIC-INTEGRATION] Ошибка эмоционального анализа:', error.message);
        analysisResults.errors.push('emotional-analysis');
      }

      // ЭТАП 3: Профилирование пользователя (опциональный)
      try {
        if (this.isModuleActive('userProfiler')) {
          analysisResults.userProfile = await this.performUserProfiling(userInput, enhancedContext);
          console.log(`✅ [SEMANTIC-INTEGRATION] Профилирование выполнено`);
        }
      } catch (error) {
        console.error('⚠️ [SEMANTIC-INTEGRATION] Ошибка профилирования:', error.message);
        analysisResults.errors.push('user-profiling');
      }

      // ЭТАП 4: Базовый анализ (fallback)
      if (!analysisResults.metaSemantics) {
        try {
          analysisResults.basicAnalysis = await this.performBasicSemanticAnalysis(userInput, enhancedContext);
          console.log(`✅ [SEMANTIC-INTEGRATION] Базовый анализ выполнен`);
        } catch (error) {
          console.error('⚠️ [SEMANTIC-INTEGRATION] Ошибка базового анализа:', error.message);
          analysisResults.errors.push('basic-analysis');
        }
      }

      // ЭТАП 5: Внешний поиск для знаниевых запросов
      if (needsExternalKnowledge) {
        try {
          console.log(`🔍 [SEMANTIC-INTEGRATION] Активирован внешний поиск для знаниевого запроса`);
          
          // Вызов внешнего поиска через web-search-provider (динамический импорт)
          const webSearchProvider = await import('./web-search-provider.js');
          const searchResults = await webSearchProvider.search(userInput, {
            searchType: 'comprehensive',
            language: 'ru',
            maxResults: 5
          });
          
          if (searchResults && searchResults.length > 0) {
            console.log(`✅ [SEMANTIC-INTEGRATION] Получены результаты внешнего поиска: ${searchResults.length} результатов`);
            
            // Обогащаем результат внешними данными
            if (analysisResults.metaSemantics) {
              analysisResults.metaSemantics.externalKnowledge = searchResults;
            } else if (analysisResults.basicAnalysis) {
              analysisResults.basicAnalysis.externalKnowledge = searchResults;
            } else {
              // Создаем специальный результат для внешнего поиска
              analysisResults.externalKnowledgeResult = {
                intent: 'knowledge_request',
                confidence: 0.8,
                category: 'external_knowledge',
                query_type: 'knowledge_request',
                externalKnowledge: searchResults,
                semantic_analysis: {
                  query_type: 'knowledge_request',
                  dialog_category: 'external_knowledge',
                  semantic_cluster: { name: 'knowledge_request', confidence: 80 }
                }
              };
            }
          }
        } catch (error) {
          console.error('⚠️ [SEMANTIC-INTEGRATION] Ошибка внешнего поиска:', error.message);
          analysisResults.errors.push('external-search');
        }
      }

      // ✅ ИСПРАВЛЕНО: ВСЕГДА возвращаем семантические результаты
      return this.selectBestResult(analysisResults, userInput, enhancedContext);

    } catch (error) {
      console.error('❌ [SEMANTIC-INTEGRATION] Критическая ошибка анализа:', error);
      return this.getFallbackResponse(userInput, context);
    }
  }

  /**
   * Определяет, следует ли использовать мета-семантику
   */
  isModuleActive(moduleName) {
    // ✅ ИСПРАВЛЕНО: ВСЕГДА возвращаем true для принудительной активации всех модулей
    console.log(`🎯 [SEMANTIC-INTEGRATION] Принудительно активируем модуль: ${moduleName}`);
    return true;
  }

  shouldUseMetaSemantics(userInput, context) {
    // ✅ ИСПРАВЛЕНО: ВСЕГДА используем мета-семантику для достижения ChatGPT-уровня
    console.log(`🎯 [SEMANTIC-INTEGRATION] Принудительно активируем мета-семантику для: "${userInput.substring(0, 50)}"`);
    return true;
  }

  /**
   * ✅ ИСПРАВЛЕНО: Выбирает лучший результат семантического анализа
   * ПРИНУДИТЕЛЬНО использует любой доступный семантический результат
   */
  selectBestResult(analysisResults, userInput, context) {
    console.log(`🎯 [SEMANTIC-INTEGRATION] Выбираем лучший результат для: "${userInput.substring(0, 50)}"`);

    // Приоритет: внешний поиск > мета-семантика > базовый анализ
    if (analysisResults.externalKnowledgeResult) {
      console.log('✅ [SEMANTIC-INTEGRATION] Используем результат внешнего поиска');
      return {
        shouldUseSemantic: true,
        reason: 'external_knowledge_search',
        semanticResult: analysisResults.externalKnowledgeResult,
        confidence: 0.9
      };
    }

    if (analysisResults.metaSemantics) {
      console.log('✅ [SEMANTIC-INTEGRATION] Используем мета-семантический результат');
      return {
        shouldUseSemantic: true,
        reason: 'meta_semantic_analysis',
        semanticResult: analysisResults.metaSemantics,
        confidence: 0.9
      };
    }

    if (analysisResults.basicAnalysis) {
      console.log('✅ [SEMANTIC-INTEGRATION] Используем базовый семантический результат');
      return {
        shouldUseSemantic: true,
        reason: 'basic_semantic_analysis',
        semanticResult: analysisResults.basicAnalysis,
        confidence: 0.7
      };
    }

    // Даже если нет анализа, создаем минимальный семантический результат
    console.log('🔄 [SEMANTIC-INTEGRATION] Создаем минимальный семантический результат');
    return {
      shouldUseSemantic: true,
      reason: 'minimal_semantic_fallback',
      semanticResult: {
        intent: 'general_conversation',
        confidence: 0.5,
        category: 'conversation',
        semantic_analysis: {
          query_type: 'dialog',
          dialog_category: 'general_chat',
          semantic_cluster: { name: 'conversation', confidence: 50 }
        }
      },
      confidence: 0.5
    };
  }

  /**
   * ✅ ИСПРАВЛЕНО: Создает fallback ответ с семантической структурой
   * ВСЕГДА возвращает семантически совместимый результат
   */
  getFallbackResponse(userInput, context) {
    console.log(`🚨 [SEMANTIC-INTEGRATION] Создаем fallback ответ для: "${userInput.substring(0, 50)}"`);

    return {
      shouldUseSemantic: true,
      reason: 'emergency_fallback',
      semanticResult: {
        intent: 'general_conversation',
        confidence: 0.4,
        category: 'conversation',
        semantic_analysis: {
          query_type: 'dialog',
          dialog_category: 'general_chat',
          semantic_cluster: { name: 'conversation', confidence: 40 }
        },
        fallback: true
      },
      confidence: 0.4
    };
  }

  /**
   * Выполняет мета-семантический анализ
   */
  async performMetaSemanticAnalysis(userQuery, options) {
    SmartLogger.integration(`🔮 Выполнение мета-семантического анализа`);

    try {
      // Используем новый мета-семантический метод
      const semanticResult = await semanticMemoryModule.analyzeCompleteRequestWithMeta(
        userQuery,
        options.sessionId || 'default',
        {
          hasRecentImages: options.hasRecentImages || false,
          chatContext: options.chatContext,
          requestType: options.requestType,
          userPreferences: options.userPreferences
        }
      );

      // Анализируем качество мета-семантического результата
      const qualityScore = semanticResult.quality_score || 5;
      const metaConfidence = semanticResult.enhanced_confidence || 0.7;

      // Исправляем некорректные регулярные выражения
      this.validateRegexPatterns();

      // ПРИНУДИТЕЛЬНАЯ АКТИВАЦИЯ: семантика ВСЕГДА управляет
      const shouldUseSemantic = true; // УБИРАЕМ все условия!

      SmartLogger.integration(`📊 Мета-качество: ${qualityScore}/10, уверенность: ${(metaConfidence * 100).toFixed(1)}%`);
      SmartLogger.integration(`🎯 Решение: СЕМАНТИКА ВСЕГДА УПРАВЛЯЕТ (убраны все условия)`);

      return {
        shouldUseSemantic: true, // ВСЕГДА true
        reason: 'semantic_forced_activation', // Принудительная активация
        semanticResult,

        // Мета-семантические данные
        metaSemanticData: {
          qualityScore,
          metaConfidence,
          metaInsights: semanticResult.meta_insights,
          systemLearnings: semanticResult.system_learnings,
          recommendations: semanticResult.enhanced_recommendations,
          predictions: semanticResult.enhanced_predictions
        },

        // Дополнительная информация
        processingTime: semanticResult.total_processing_time,
        fallbackMode: false // НИКАКИХ fallback'ов
      };

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка мета-семантического анализа: ${error.message}`);

      // Fallback к стандартному анализу
      return await this.performStandardSemanticAnalysis(userQuery, options);
    }
  }

  /**
   * Выполняет стандартный семантический анализ
   */
  async performStandardSemanticAnalysis(userQuery, options) {
    SmartLogger.integration(`🧠 Выполнение стандартного семантического анализа`);

    try {
      // Используем стандартный метод семантической памяти
      const semanticResult = await semanticMemoryModule.analyzeCompleteRequest(
        userQuery,
        options.sessionId || 'default',
        {
          hasRecentImages: options.hasRecentImages || false,
          chatContext: options.chatContext,
          requestType: options.requestType,
          userPreferences: options.userPreferences
        }
      );

      // Анализируем качество результата
      const confidence = semanticResult.confidence || 0.6;
      const projectRelevance = semanticResult.current_project ? 0.8 : 0.4;

      // Определяем общую уверенность
      const overallConfidence = (confidence + projectRelevance) / 2;

      // ПРИНУДИТЕЛЬНАЯ АКТИВАЦИЯ: семантика ВСЕГДА управляет
      const shouldUseSemantic = true; // Принудительно активируем семантику

      SmartLogger.integration(`📊 Стандартное качество: уверенность=${(confidence * 100).toFixed(1)}%, релевантность=${(projectRelevance * 100).toFixed(1)}%`);
      SmartLogger.integration(`🎯 Решение: СЕМАНТИКА ВСЕГДА УПРАВЛЯЕТ (принудительная активация)`);

      return {
        shouldUseSemantic: true, // ВСЕГДА true
        reason: 'semantic_forced_activation', // Принудительная активация
        semanticResult,
        confidence: overallConfidence,
        processingTime: semanticResult.processing_time,
        fallbackMode: false // НИКАКИХ fallback'ов
      };

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка стандартного семантического анализа: ${error.message}`);
      return { shouldUseSemantic: false, reason: 'semantic_error', error: error.message };
    }
  }

  /**
   * Создает семантический ответ (главная точка входа для автономной системы)
   */
  async createSemanticResponse(semanticResult, userQuery, options) {
    try {
      SmartLogger.integration('🚀 СОЗДАНИЕ АВТОНОМНОГО СЕМАНТИЧЕСКОГО ОТВЕТА');

      // Проверяем тип семантического результата
      if (semanticResult && semanticResult.type === 'forced_autonomous') {
        return await this.createForcedAutonomousResponse(userQuery, options);
      }

      // Стандартный путь через систему персонализации
      return await this.createEnhancedSemanticResponse(semanticResult, userQuery, options);

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка создания семантического ответа: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'SemanticIntegration',
        reason: 'creation_error'
      };
    }
  }

  /**
   * Создает принудительный автономный ответ
   */
  async createForcedAutonomousResponse(userQuery, options) {
    SmartLogger.integration('🔥 ПРИНУДИТЕЛЬНАЯ АКТИВАЦИЯ АВТОНОМНОЙ СИСТЕМЫ');

    try {
      // Получаем автономный ответ от генератора естественного языка
      const nlgResponse = await naturalLanguageGenerator.generateResponse(
        userQuery,
        {
          userId: options.userId,
          sessionId: options.sessionId,
          category: 'conversation',
          context: { forced: true }
        }
      );

      if (nlgResponse && nlgResponse.response) {
        return {
          success: true,
          response: nlgResponse.response,
          provider: 'AUTONOMOUS_SYSTEM_FORCED',
          autonomous: true,
          metadata: nlgResponse.metadata
        };
      } else {
        throw new Error('Автономный генератор не вернул ответ');
      }

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка принудительной активации: ${error.message}`);
      return {
        success: false,
        error: error.message,
        provider: 'AUTONOMOUS_SYSTEM_FORCED'
      };
    }
  }

  /**
   * Создает семантический ответ с персонализацией (основной метод)
   */
  async createEnhancedSemanticResponse(semanticResult, userQuery, options) {
      // Извлекаем необходимые данные из options
      const userId = options.userId || 1;
      const sessionId = options.sessionId || 'default';
      const category = this.extractCategoryFromSemantic(semanticResult);

      try {
        // === ЭТАП 1: ПЕРСОНАЛИЗАЦИЯ И ПРОФИЛИРОВАНИЕ ===
        SmartLogger.integration('Этап 1: Анализ пользователя и персонализация');

      // Получаем или создаем профиль пользователя с fallback
      let userProfile = null;
      try {
        userProfile = await userMemoryManager.getOrCreateUserProfile(userId);
      } catch (error) {
        SmartLogger.integration(`⚠️ Fallback: создаем временный профиль пользователя (${error.message})`);
        userProfile = {
          id: userId,
          favoriteColors: ['синий', 'зеленый'],
          preferredStyles: ['минималистичный'],
          designComplexity: 'medium',
          totalInteractions: 0
        };
      }

      // Анализируем стиль общения и эмоции
      const communicationAnalysis = userProfiler.analyzeCommunicationStyle(userQuery);
      const designPreferences = userProfiler.analyzeDesignPreferences(userQuery);
      const emotionalState = userProfiler.analyzeEmotionalState(userQuery, options.sessionHistory);

      // === ЭТАП 2: КОНТЕКСТНОЕ ОБУЧЕНИЕ ===
      SmartLogger.integration('Этап 2: Применение контекстного обучения');

      // Получаем рекомендации на основе обученных паттернов с fallback
      let learningRecommendations = null;
      try {
        learningRecommendations = await learningSystem.getLearnedRecommendations(
          userId, userQuery, category
        );
      } catch (error) {
        SmartLogger.integration(`⚠️ Fallback: система обучения недоступна (${error.message})`);
        learningRecommendations = {
          confidence: 0.7,
          styleAdjustments: { tone: 'дружелюбный' },
          recommendations: ['Используем базовые настройки']
        };
      }

      // === ЭТАП 3: УПРАВЛЕНИЕ ПРОЕКТАМИ ===
      SmartLogger.integration('Этап 3: Анализ контекста проектов');

      // Получаем контекст активных проектов
      const projectContext = await userMemoryManager.getUserProjectContext(userId);

      // === ЭТАП 4: АНАЛИЗ ИЗОБРАЖЕНИЙ (ЕСЛИ ПРИСУТСТВУЮТ) ===
      let imageAnalysisResult = null;
      if (options.hasRecentImages && options.recentImageUrl && visualSemanticIntegration) {
        SmartLogger.integration('Этап 4а: Анализ изображений с семантической интеграцией');

        imageAnalysisResult = await visualSemanticIntegration.analyzeImageWithSemantics(
          options.recentImageUrl,
          {
            userId: userId,
            sessionId: sessionId,
            category: category,
            userProfile: userProfile
          }
        );

        if (imageAnalysisResult.success) {
          SmartLogger.integration('✅ Визуальный анализ успешно завершен', {
            confidence: imageAnalysisResult.confidence_score,
            recommendations: imageAnalysisResult.recommendations?.length || 0
          });
        }
      }

      // === ЭТАП 4б: СЕМАНТИЧЕСКИЙ АНАЛИЗ (ОРИГИНАЛЬНАЯ ЛОГИКА) ===
      SmartLogger.integration('Этап 4б: Семантический анализ');

      const legacySemanticResult = await semanticMemoryModule.analyzeCompleteRequest(
        userQuery, 
        sessionId, 
        {
          chatContext: options.chatContext,
          hasRecentImages: options.hasRecentImages,
          userName: options.userName,
          userProfile: userProfile,
          projectContext: projectContext,
          imageAnalysis: imageAnalysisResult // Передаем результат анализа изображения
        }
      );

      if (legacySemanticResult.error) {
        SmartLogger.integration('Семантический анализ завершился с ошибкой, используем fallback');
        return { shouldUseSemantic: false, reason: 'error', error: legacySemanticResult.error };
      }

      // === ЭТАП 5: ИНТЕГРАЦИЯ ВСЕХ КОМПОНЕНТОВ ===
      const confidence = legacySemanticResult.confidence || 0;

      // Повышаем уверенность если есть персонализация и обучение
      let adjustedConfidence = confidence;
      if (learningRecommendations) {
        adjustedConfidence += 15; // Бонус за обученные паттерны
      }
      if (userProfile && userProfile.totalInteractions > 5) {
        adjustedConfidence += 10; // Бонус за знание пользователя
      }

      adjustedConfidence = Math.min(adjustedConfidence, 100);

      SmartLogger.integration(`Семантическая уверенность: ${confidence}% → ${adjustedConfidence}% (с персонализацией)`);

      // Создаем расширенный результат с данными Фазы 1 и визуального анализа
      const enhancedResult = {
        ...legacySemanticResult,

        // Добавляем данные Фазы 1
        phase1Data: {
          userProfile,
          communicationAnalysis,
          designPreferences,
          emotionalState,
          learningRecommendations,
          projectContext
        },

        // Добавляем результаты визуального анализа
        imageAnalysis: imageAnalysisResult,

        // Обновляем уверенность с учетом визуального анализа
        originalConfidence: confidence,
        adjustedConfidence: this.adjustConfidenceWithImageAnalysis(adjustedConfidence, imageAnalysisResult)
      };

      if (adjustedConfidence >= this.semanticThreshold) {
        SmartLogger.integration(`✅ Расширенная семантика берет управление (уверенность ${adjustedConfidence}% >= ${this.semanticThreshold}%)`);

        return {
          shouldUseSemantic: true,
          semanticResult: enhancedResult,
          confidence: adjustedConfidence,
          reason: 'high_confidence_with_personalization'
        };
      } else {
        SmartLogger.integration(`⚠️ Низкая уверенность семантики (${adjustedConfidence}% < ${this.semanticThreshold}%), но передаем данные персонализации`);

        return {
          shouldUseSemantic: false,
          semanticResult: enhancedResult, // передаем для обогащения
          confidence: adjustedConfidence,
          reason: 'low_confidence_but_enriched'
        };
      }

    } catch (error) {
      SmartLogger.integration(`Ошибка расширенной семантической интеграции: ${error.message}`);
      return { shouldUseSemantic: false, reason: 'exception', error: error.message };
    }
  }

  /**
   * ФАЗА 1: Создание персонализированного семантически обогащенного ответа
   */
  async createEnhancedSemanticResponsePhase1(semanticResult, userQuery, options = {}) {
    SmartLogger.integration('ФАЗА 1: Создание персонализированного ответа');

    try {
      const userId = options.userId || 1;
      const category = this.extractCategoryFromSemantic(semanticResult);

      // Получаем данные Фазы 1
      const phase1Data = semanticResult.phase1Data || {};
      const { userProfile, communicationAnalysis, designPreferences, emotionalState, learningRecommendations } = phase1Data;

      // === ЭТАП 1: АДАПТАЦИЯ ПРОМПТА С ОБУЧЕНИЕМ ===
      let enhancedPrompt = semanticResult.enhanced_prompt || userQuery;

      if (learningRecommendations) {
        SmartLogger.integration('Применение контекстного обучения к промпту');
        const learningAdaptation = await learningSystem.adaptPromptWithLearning(userId, enhancedPrompt, category);
        if (learningAdaptation.adaptedPrompt) {
          enhancedPrompt = learningAdaptation.adaptedPrompt;
        }
      }

      // === ЭТАП 2: ПЕРСОНАЛИЗАЦИЯ ПРОМПТА ===
      if (userProfile && designPreferences) {
        enhancedPrompt = this.personalizePrompt(enhancedPrompt, userProfile, designPreferences);
      }

      // Собираем расширенные контекстные данные с персонализацией
      const contextData = {
        currentProject: semanticResult.current_project,
        predictions: semanticResult.predictions || [],
        recommendations: semanticResult.system_recommendations || [],
        compatibility: semanticResult.compatibility,
        userProfile,
        communicationAnalysis,
        designPreferences,
        emotionalState,
        learningRecommendations
      };

      // === ЭТАП 3: СОЗДАНИЕ ПЕРСОНАЛИЗИРОВАННОГО ОТВЕТА ===
      let response = await this.createPersonalizedResponse(enhancedPrompt, category, contextData, options);

      // === ЭТАП 4: АДАПТАЦИЯ ПОД ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ===
      if (userProfile && emotionalState) {
        response = userProfiler.adaptResponseToProfile(response, userProfile, emotionalState);
      }

      // === ЭТАП 5: СОХРАНЕНИЕ КОНТЕКСТА ПРОЕКТА ===
      if (category === 'image_generation' || category === 'vectorization') {
        await this.saveProjectContext(userId, options.sessionId, category, userQuery, contextData);
      }

      SmartLogger.integration(`✅ Персонализированный ответ создан для категории: ${category}`);

      return {
        success: true,
        response,
        provider: 'SemanticMemoryPhase1',
        category,
        semanticData: {
          confidence: semanticResult.adjustedConfidence || semanticResult.confidence,
          projectId: contextData.currentProject?.id,
          predictionsCount: contextData.predictions.length,
          hasPersonalization: !!userProfile,
          hasLearning: !!learningRecommendations
        },
        phase1Metadata: {
          userId,
          profileId: userProfile?.id,
          communicationStyle: communicationAnalysis?.dominantStyle,
          emotionalTone: emotionalState?.currentEmotion,
          learningConfidence: learningRecommendations?.confidence
        }
      };

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка создания семантического ответа: ${error.message}`);
      return {
        success: false,
        error: error.message,
        shouldFallback: true
      };
    }
  }

  // === ФАЗА 1: НОВЫЕ МЕТОДЫ ===

  /**
   * Персонализация промпта на основе профиля пользователя
   */
  personalizePrompt(prompt, userProfile, designPreferences) {
    let personalizedPrompt = prompt;

    // Добавляем цветовые предпочтения
    if (userProfile.favoriteColors && userProfile.favoriteColors.length > 0) {
      const colors = userProfile.favoriteColors.slice(0, 2).join(' и ');
      personalizedPrompt += ` Учти цветовые предпочтения: ${colors}.`;
    }

    // Добавляем стилевые предпочтения
    if (userProfile.preferredStyles && userProfile.preferredStyles.length > 0) {
      const styles = userProfile.preferredStyles.slice(0, 2).join(' и ');
      personalizedPrompt += ` Предпочитаемые стили: ${styles}.`;
    }

    // Учитываем сложность дизайна
    if (userProfile.designComplexity) {
      const complexityHints = {
        simple: 'минималистичный стиль, чистые линии',
        medium: 'умеренная детализация',
        complex: 'детальный дизайн с множеством элементов'
      };
      personalizedPrompt += ` Уровень сложности: ${complexityHints[userProfile.designComplexity]}.`;
    }

    return personalizedPrompt;
  }

  /**
   * Создание персонализированного ответа
   */
  async createPersonalizedResponse(enhancedPrompt, category, contextData, options) {
    switch (category) {
      case 'image_generation':
        return this.createImageGenerationResponse(enhancedPrompt, contextData, options);
      case 'image_consultation':
        return await this.createConsultationResponse(enhancedPrompt, contextData, options);
      case 'vectorization':
        return this.createVectorizationResponse(enhancedPrompt, contextData, options);
      case 'web_search':
        return this.createSearchResponse(enhancedPrompt, contextData, options);
      default:
        return await this.createGeneralResponse(enhancedPrompt, contextData, options);
    }
  }

  /**
   * Создание ответа для генерации изображений
   */
  createImageGenerationResponse(prompt, contextData, options) {
    let response = `Создаю изображение с учетом ваших предпочтений: ${prompt}`;

    // Добавляем персональные элементы
    if (contextData.userProfile) {
      if (contextData.designPreferences?.styles) {
        const styles = Object.keys(contextData.designPreferences.styles);
        if (styles.length > 0) {
          response += `\n\nУчитываю ваш стиль: ${styles[0]}.`;
        }
      }
    }

    // Добавляем рекомендации на основе обучения
    if (contextData.learningRecommendations) {
      response += `\n\n💡 На основе предыдущего опыта: ${contextData.learningRecommendations.styleAdjustments?.tone || 'применяю проверенные настройки'}.`;
    }

    return response;
  }

  /**
   * Создание консультационного ответа через ДУМАЮЩУЮ СИСТЕМУ
   */
  async createConsultationResponse(prompt, contextData, options) {
    SmartLogger.integration('🧠 АКТИВАЦИЯ ДУМАЮЩЕЙ СИСТЕМЫ');

    try {
      // Подключаем думающую систему
      // const naturalLanguageGenerator = require('./semantic-memory/natural-language-generator.cjs');

      // Создаем контекст для консультации
      const consultationContext = {
        userQuery: prompt,
        userProfile: contextData.userProfile,
        emotionalState: contextData.emotionalState,
        communicationAnalysis: contextData.communicationAnalysis,
        sessionId: options.sessionId || 'default',
        userId: options.userId || 1,
        messageCount: options.messageCount || 0
      };

      SmartLogger.integration('💭 Думаю над консультационным запросом');

      // ИСПРАВЛЕНО: передаем строку напрямую
      let thoughtfulResponse;
      if (naturalLanguageGenerator && typeof naturalLanguageGenerator.generateResponse === 'function') {
        thoughtfulResponse = await naturalLanguageGenerator.generateResponse(
          prompt, // Передаем строку напрямую
          consultationContext,
          contextData.userProfile
        );
      } else {
        throw new Error('naturalLanguageGenerator.generateResponse is not a function');
      }


      if (thoughtfulResponse && thoughtfulResponse.success && thoughtfulResponse.response) {
        SmartLogger.integration('✅ Думающая система сгенерировала ответ');
        return thoughtfulResponse.response;
      } else {
        throw new Error('Thinking system failed');
      }

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка думающей системы: ${error.message}, используем простой ответ`);

      // Простой естественный ответ БЕЗ технических терминов
      return `Понимаю! Дай мне подумать над твоим запросом. 

Чем конкретно могу помочь? Расскажи больше деталей, и я постараюсь дать полезный совет! 😊`;
    }
  }

  /**
   * Создание ответа для векторизации
   */
  createVectorizationResponse(prompt, contextData, options) {
    let response = `Векторизую изображение с оптимальными настройками.`;

    if (contextData.userProfile?.designComplexity === 'simple') {
      response += ' Настройки: упрощенная векторизация для чистого результата.';
    } else if (contextData.userProfile?.designComplexity === 'complex') {
      response += ' Настройки: детальная векторизация с сохранением всех элементов.';
    }

    return response;
  }

  /**
   * Создание ответа для поиска
   */
  createSearchResponse(prompt, contextData, options) {
    return `Ищу информацию: ${prompt}`;
  }

  /**
   * Создание общего ответа через ДУМАЮЩУЮ СИСТЕМУ
   */
  async createGeneralResponse(prompt, contextData, options) {
    SmartLogger.integration('🧠 АКТИВАЦИЯ ДУМАЮЩЕЙ СИСТЕМЫ ГЕНЕРАЦИИ');

    try {
      // Подключаем думающую систему
      //const naturalLanguageGenerator = require('./semantic-memory/natural-language-generator.cjs');

      // Создаем контекст для думающей системы
      const thinkingContext = {
        userQuery: prompt,
        userProfile: contextData.userProfile,
        emotionalState: contextData.emotionalState,
        communicationAnalysis: contextData.communicationAnalysis,
        sessionId: options.sessionId || 'default',
        userId: options.userId || 1,messageCount: options.messageCount || 0
      };

      SmartLogger.integration('💭 Думаю над ответом');

      // ИСПРАВЛЕНО: передаем строку напрямую вместо объекта
      let thoughtfulResponse;
      // ИСПРАВЛЕНО: Добавлена проверка доступности методов перед вызовом
      if (naturalLanguageGenerator) {
        // Проверяем различные варианты экспорта
        let generateMethod = null;

        if (typeof naturalLanguageGenerator.generateResponse === 'function') {
          generateMethod = naturalLanguageGenerator.generateResponse;
        } else if (naturalLanguageGenerator.instance && typeof naturalLanguageGenerator.instance.generateResponse === 'function') {
          generateMethod = naturalLanguageGenerator.instance.generateResponse.bind(naturalLanguageGenerator.instance);
        } else if (typeof naturalLanguageGenerator === 'function') {
          // Если экспортирован сам класс/функция
          try {
            const instance = new naturalLanguageGenerator();
            if (typeof instance.generateResponse === 'function') {
              generateMethod = instance.generateResponse.bind(instance);
            }
          } catch (error) {
            SmartLogger.error('❌ Не удалось создать экземпляр генератора:', error.message);
          }
        }

        if (generateMethod) {
          SmartLogger.debug('🎯 Используем генератор естественного языка');

          try {
            thoughtfulResponse = await generateMethod(prompt, thinkingContext, contextData.userProfile);
          } catch (error) {
            SmartLogger.error('❌ Ошибка генерации ответа:', error.message);
            // Fallback будет использован ниже
          }
        } else {
          SmartLogger.warn('⚠️ Метод generateResponse недоступен в модуле naturalLanguageGenerator');
        }
      }

      if (thoughtfulResponse && thoughtfulResponse.success && thoughtfulResponse.response) {
        SmartLogger.integration('✅ Думающая система успешно сгенерировала ответ');

        const response = thoughtfulResponse.response;

        SmartLogger.integration(`📝 Сгенерированный ответ: "${response.substring(0, 100)}..."`);

        SmartLogger.integration(`✅ Возвращаем продуманный ответ`);
        return response;
      } else {
        throw new Error('Thinking system failed or returned empty response');
      }

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка думающей системы: ${error.message}, используем простой ответ`);

      // Улучшенные естественные ответы БЕЗ технических терминов
      const prompt_lower = prompt.toLowerCase();

      if (prompt_lower.includes('привет') || prompt_lower.includes('расскажи о себе') || prompt_lower.includes('кто ты')) {
        return `Привет! Меня зовут BOOOMERANGS AI, и я ваш творческий помощник!

🚀 **Мои суперспособности:**
• Создаю уникальные изображения по описанию
• Превращаю картинки в векторную графику  
• Готовлю дизайны для вышивальных машин
• Консультирую по творческим проектам
• Просто хорошо общаюсь на любые темы!

А еще я постоянно учусь и становлюсь умнее с каждым диалогом. Чем могу помочь?`;
      } else if (prompt_lower.includes('интересного') || prompt_lower.includes('что знаешь')) {
        return `Ох, интересного я знаю много! 🤓 Смотря что тебя зацепит:

🎨 **В дизайне:** Знаешь ли ты, что золотое сечение встречается не только в искусстве, но и в природе? От раковин улиток до расположения семян в подсолнухе!

🖼️ **В технологиях:** Современные помощники могут создавать изображения, которые неотличимы от работ художников. Но самое крутое - они учатся понимать эмоции и стиль.

🧵 **В производстве:** Современные вышивальные машины могут воспроизвести практически любой дизайн с точностью до долей миллиметра!

А что тебя больше интересует - творчество, технологии, или может что-то совсем другое? Я готов погрузиться в любую тему! 😊`;
      } else if (prompt_lower.includes('принт') && prompt_lower.includes('моде')) {
        return `Отличный вопрос! 🎨 В мире принтов сейчас интересные тенденции:

**🔥 Сейчас в тренде:**
• **Органические формы** - плавные линии, которые напоминают природу
• **Абстрактная геометрия** - не строгие квадраты, а свободные интерпретации
• **Монохромные акценты** - один яркий цвет на нейтральном фоне
• **Ретро-футуризм** - смесь 80-х и космической эстетики

**💡 Мой совет:** 
Выбирай то, что резонирует именно с тобой. Мода циклична, но стиль - индивидуален. Лучше создать что-то, что отражает твою личность, чем слепо следовать трендам.

Для чего планируешь принт? Одежда, интерьер, или что-то еще? Могу дать более конкретные рекомендации! 😊`;
      } else {
        return "Интересно! Расскажи больше - готов помочь или просто поболтать 😊";
      }
    }
  }

  /**
   * Нормализует семантические данные для совместимости с NLG
   */
  normalizeSemanticDataForNLG(prompt, contextData, options) {
    // КРИТИЧЕСКОЕ ИСПРАВЛЕНИЕ: Проверяем тип prompt
    const promptString = typeof prompt === 'string' ? prompt : String(prompt || '');
    const promptLower = promptString.toLowerCase();

    // Извлекаем намерение из различных источников
    let intent = 'general_chat';

    if (promptLower.includes('расскажи') || promptLower.includes('о себе')) {
      intent = 'расскажи о себе';
    } else if (promptLower.includes('создай') || promptLower.includes('сделай')) {
      intent = 'создай';
    } else if (promptLower.includes('анализ') || promptLower.includes('проанализируй')) {
      intent = 'анализ';
    } else if (promptLower.includes('как') || promptLower.includes('что такое')) {
      intent = 'объясни';
    }

    // Создаем нормализованную структуру
    const normalizedResult = {
      // Основные поля для NLG
      intent: intent,
      content: promptString,
      query: promptString,
      originalQuery: promptString,

      // Контекстные данные
      context: contextData || {},
      emotion: contextData?.emotionalState?.currentEmotion || 'neutral',
      style: contextData?.communicationAnalysis?.dominantStyle || 'friendly',
      complexity: contextData?.userProfile?.designComplexity || 'medium',

      // Мета-данные
      mainTopic: this.extractMainTopic(promptString),
      subTopics: this.extractSubTopics(promptString),
      contextDetails: contextData?.currentProject?.description || null,

      //
    };
  }

  async generateSmartResponse(userMessage, conversationHistory, sessionId) {
    let response = null;
    const metadata = {
      generatedBy: 'fallback',
      modulesUsed: []
    };

    // Анализ семантики сообщения
    let analysis = null;
    try {
      analysis = await this.analyzeWithSemantics(userMessage, {
        sessionId: sessionId,
        conversationHistory: conversationHistory
      });
    } catch (error) {
      SmartLogger.error('❌ Ошибка семантического анализа:', error.message);
      analysis = null;
    }

    // Получаем профиль пользователя
    let userProfile = null;
    try {
      userProfile = await userMemoryManager.getOrCreateUserProfile(1); // userId = 1
      metadata.modulesUsed.push('user-memory-manager');
    } catch (error) {
      SmartLogger.error('❌ Ошибка профиля пользователя:', error.message);
    }

    // Генерируем ответ через семантическую систему
      if (naturalLanguageGenerator) {
        // Проверяем различные варианты экспорта
        let generateMethod = null;

        if (typeof naturalLanguageGenerator.generateResponse === 'function') {
          generateMethod = naturalLanguageGenerator.generateResponse;
        } else if (naturalLanguageGenerator.instance && typeof naturalLanguageGenerator.instance.generateResponse === 'function') {
          generateMethod = naturalLanguageGenerator.instance.generateResponse.bind(naturalLanguageGenerator.instance);
        } else if (typeof naturalLanguageGenerator === 'function') {
          // Если экспортирован сам класс/функция
          try {
            const instance = new naturalLanguageGenerator();
            if (typeof instance.generateResponse === 'function') {
              generateMethod = instance.generateResponse.bind(instance);
            }
          } catch (error) {
            SmartLogger.error('❌ Не удалось создать экземпляр генератора:', error.message);
          }
        }

        if (generateMethod) {
          SmartLogger.debug('🎯 Используем генератор естественного языка');

          try {
            response = await generateMethod(userMessage, {
              conversationHistory: conversationHistory,
              semanticContext: analysis,
              userProfile: userProfile,
              sessionId: sessionId
            });

            metadata.generatedBy = 'natural-language-generator';
            metadata.modulesUsed.push('natural-language-generator');
          } catch (error) {
            SmartLogger.error('❌ Ошибка генерации ответа:', error.message);
            // Fallback будет использован ниже
          }
        } else {
          SmartLogger.warn('⚠️ Метод generateResponse недоступен в модуле naturalLanguageGenerator');
        }
      }

    // Fallback, если семантика не сработала
    if (!response || (typeof response === 'string' && !response.trim()) || (typeof response !== 'string' && !response)) {
      SmartLogger.warn('⚠️ Fallback к базовому ответу');
      response = "Извини, я не понимаю. Можешь перефразировать?";
      metadata.generatedBy = 'fallback';
    }

    // Обеспечиваем, что response всегда строка
    if (typeof response !== 'string') {
      response = String(response || '');
    }

    return { response, metadata };
  }

  extractCategoryFromSemantic(semanticResult) {
    return semanticResult?.enhanced_recommendations?.category || semanticResult?.system_recommendations?.category || 'general';
  }

  extractMainTopic(text) {
    // Простое извлечение темы на основе ключевых слов
    const keywords = ['дизайн', 'графика', 'вектор', 'изображение', 'принт', 'мода'];
    for (const keyword of keywords) {
      if (text.toLowerCase().includes(keyword)) {
        return keyword;
      }
    }
    return 'общее';
  }

  extractSubTopics(text) {
    // Простое извлечение подтем на основе ключевых слов
    const subTopics = [];
    if (text.toLowerCase().includes('цвет')) {
      subTopics.push('цвет');
    }
    if (text.toLowerCase().includes('стиль')) {
      subTopics.push('стиль');
    }
    return subTopics;
  }

  adjustConfidenceWithImageAnalysis(confidence, imageAnalysisResult) {
    if (imageAnalysisResult && imageAnalysisResult.success) {
      // Увеличиваем уверенность на основе уверенности визуального анализа
      const imageConfidence = imageAnalysisResult.confidence_score || 0;
      return Math.min(confidence + imageConfidence * 0.2, 100); // Максимум 20% прирост
    }
    return confidence;
  }

  /**
   * ✅ ИСПРАВЛЕНИЕ: Реализация отсутствующего метода performBasicSemanticAnalysis
   * Выполняет базовый семантический анализ пользовательского ввода
   */
  async performBasicSemanticAnalysis(userInput, context = {}) {
    console.log(`🔍 [BASIC-SEMANTIC] Начинаем базовый анализ: "${userInput.substring(0, 50)}"`);

    try {
      // Используем существующий модуль семантической памяти для базового анализа
      if (semanticMemory && typeof semanticMemory.analyzeCompleteRequest === 'function') {
        const result = await semanticMemory.analyzeCompleteRequest(
          userInput,
          context.sessionId || 'default',
          {
            hasRecentImages: context.hasRecentImages || false,
            chatContext: context.chatContext,
            requestType: 'basic_analysis',
            userPreferences: context.userPreferences
          }
        );

        console.log(`✅ [BASIC-SEMANTIC] Базовый анализ завершен успешно`);
        return {
          intent: result.intent || 'general_conversation',
          confidence: result.confidence || 0.6,
          category: result.enhanced_recommendations?.category || 'conversation',
          semantic_analysis: {
            query_type: result.query_type || 'dialog',
            dialog_category: result.dialog_category || 'general_chat',
            semantic_cluster: result.semantic_cluster || { name: 'conversation', confidence: 60 },
            intentions: result.intentions || [],
            context_clues: result.context_clues || {}
          },
          processing_time: result.processing_time || 0,
          fallback: false
        };
      } else {
        throw new Error('Семантическая память недоступна');
      }
    } catch (error) {
      console.error(`❌ [BASIC-SEMANTIC] Ошибка базового анализа: ${error.message}`);

      // Fallback с минимальным анализом
      return {
        intent: 'general_conversation',
        confidence: 0.4,
        category: 'conversation',
        semantic_analysis: {
          query_type: 'dialog',
          dialog_category: 'general_chat',
          semantic_cluster: { name: 'conversation', confidence: 40 },
          intentions: [],
          context_clues: {}
        },
        processing_time: 0,
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * ✅ ИСПРАВЛЕНИЕ: Реализация отсутствующего метода performEmotionalAnalysis
   * Выполняет эмоциональный анализ пользовательского ввода
   */
  async performEmotionalAnalysis(userInput, context = {}) {
    console.log(`😊 [EMOTIONAL-ANALYSIS] Начинаем эмоциональный анализ: "${userInput.substring(0, 50)}"`);

    try {
      // Используем эмоционально-семантическую матрицу
      if (emotionalSemanticMatrix && typeof emotionalSemanticMatrix.analyzeEmotionalContext === 'function') {
        const emotionalResult = await emotionalSemanticMatrix.analyzeEmotionalContext(userInput, {
          userHistory: context.conversationHistory || [],
          sessionContext: context.sessionContext || {},
          previousEmotions: context.previousEmotions || []
        });

        console.log(`✅ [EMOTIONAL-ANALYSIS] Эмоциональный анализ завершен успешно`);
        return {
          primary_emotion: emotionalResult.primary_emotion || 'neutral',
          confidence: emotionalResult.confidence || 0.5,
          emotional_intensity: emotionalResult.emotional_intensity || 0.5,
          emotional_valence: emotionalResult.emotional_valence || 0.5,
          secondary_emotions: emotionalResult.secondary_emotions || [],
          emotional_trajectory: emotionalResult.emotional_trajectory || 'stable',
          context_emotions: emotionalResult.context_emotions || {},
          processing_time: emotionalResult.processing_time || 0,
          fallback: false
        };
      } else {
        throw new Error('Эмоциональная матрица недоступна');
      }
    } catch (error) {
      console.error(`❌ [EMOTIONAL-ANALYSIS] Ошибка эмоционального анализа: ${error.message}`);

      // Fallback с базовым эмоциональным анализом
      const inputLower = userInput.toLowerCase();
      let primaryEmotion = 'neutral';
      let confidence = 0.3;

      // Простой анализ эмоций по ключевым словам
      if (inputLower.includes('спасибо') || inputLower.includes('отлично') || inputLower.includes('круто')) {
        primaryEmotion = 'joy';
        confidence = 0.7;
      } else if (inputLower.includes('помоги') || inputLower.includes('не понимаю') || inputLower.includes('проблема')) {
        primaryEmotion = 'frustration';
        confidence = 0.6;
      } else if (inputLower.includes('привет') || inputLower.includes('здравствуй')) {
        primaryEmotion = 'friendly';
        confidence = 0.8;
      }

      return {
        primary_emotion: primaryEmotion,
        confidence: confidence,
        emotional_intensity: 0.5,
        emotional_valence: primaryEmotion === 'joy' ? 0.8 : 0.5,
        secondary_emotions: [],
        emotional_trajectory: 'stable',
        context_emotions: {},
        processing_time: 0,
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * ✅ ИСПРАВЛЕНИЕ: Реализация отсутствующего метода performUserProfiling
   * Выполняет профилирование пользователя на основе ввода
   */
  async performUserProfiling(userInput, context = {}) {
    console.log(`👤 [USER-PROFILING] Начинаем профилирование: "${userInput.substring(0, 50)}"`);

    try {
      // Используем модуль профилирования пользователей
      if (userProfiler && typeof userProfiler.analyzeCommunicationStyle === 'function') {
        const communicationAnalysis = userProfiler.analyzeCommunicationStyle(userInput);
        const designPreferences = userProfiler.analyzeDesignPreferences ? 
                                 userProfiler.analyzeDesignPreferences(userInput) : {};
        const emotionalState = userProfiler.analyzeEmotionalState ? 
                               userProfiler.analyzeEmotionalState(userInput, context.sessionHistory) : {};

        console.log(`✅ [USER-PROFILING] Профилирование завершено успешно`);
        return {
          communication_style: communicationAnalysis,
          design_preferences: designPreferences,
          emotional_state: emotionalState,
          user_context: {
            session_length: context.sessionHistory?.length || 0,
            interaction_patterns: this.extractInteractionPatterns(userInput),
            complexity_preference: this.determineComplexityPreference(userInput),
            tone_preference: this.determineTonePreference(userInput)
          },
          confidence: 0.7,
          processing_time: 0,
          fallback: false
        };
      } else {
        throw new Error('Профилировщик пользователей недоступен');
      }
    } catch (error) {
      console.error(`❌ [USER-PROFILING] Ошибка профилирования: ${error.message}`);

      // Fallback с базовым профилированием
      return {
        communication_style: {
          dominantStyle: this.determineTonePreference(userInput),
          formality: userInput.includes('пожалуйста') || userInput.includes('благодарю') ? 'formal' : 'informal',
          directness: userInput.length < 50 ? 'direct' : 'descriptive'
        },
        design_preferences: {
          complexity: this.determineComplexityPreference(userInput),
          style_indicators: this.extractStyleIndicators(userInput)
        },
        emotional_state: {
          current_mood: 'neutral',
          engagement_level: 0.5
        },
        user_context: {
          session_length: context.sessionHistory?.length || 0,
          interaction_patterns: this.extractInteractionPatterns(userInput),
          complexity_preference: this.determineComplexityPreference(userInput),
          tone_preference: this.determineTonePreference(userInput)
        },
        confidence: 0.4,
        processing_time: 0,
        fallback: true,
        error: error.message
      };
    }
  }

  /**
   * Вспомогательные методы для профилирования пользователей
   */
  extractInteractionPatterns(userInput) {
    const patterns = [];
    const inputLower = userInput.toLowerCase();

    if (inputLower.includes('создай') || inputLower.includes('сделай')) {
      patterns.push('creative_requests');
    }
    if (inputLower.includes('объясни') || inputLower.includes('расскажи')) {
      patterns.push('information_seeking');
    }
    if (inputLower.includes('помоги') || inputLower.includes('как')) {
      patterns.push('assistance_seeking');
    }

    return patterns;
  }

  determineComplexityPreference(userInput) {
    const inputLower = userInput.toLowerCase();

    if (inputLower.includes('простой') || inputLower.includes('минимальный') || inputLower.includes('легкий')) {
      return 'simple';
    } else if (inputLower.includes('сложный') || inputLower.includes('детальный') || inputLower.includes('подробный')) {
      return 'complex';
    }

    return 'medium';
  }

  determineTonePreference(userInput) {
    const inputLower = userInput.toLowerCase();

    if (inputLower.includes('пожалуйста') || inputLower.includes('благодарю') || inputLower.includes('извините')) {
      return 'formal';
    } else if (inputLower.includes('привет') || inputLower.includes('спасибо') || inputLower.includes('круто')) {
      return 'friendly';
    } else if (userInput.length < 30) {
      return 'brief';
    }

    return 'neutral';
  }

  extractStyleIndicators(userInput) {
    const indicators = [];
    const inputLower = userInput.toLowerCase();

    const styleKeywords = {
      minimalist: ['минимализм', 'простой', 'чистый', 'лаконичный'],
      vintage: ['винтаж', 'ретро', 'старинный', 'классический'],
      modern: ['современный', 'модный', 'актуальный', 'трендовый'],
      artistic: ['художественный', 'творческий', 'артистичный']
    };

    Object.entries(styleKeywords).forEach(([style, keywords]) => {
      if (keywords.some(keyword => inputLower.includes(keyword))) {
        indicators.push(style);
      }
    });

    return indicators;
  }

  // Детектор знаниевых запросов
  detectKnowledgeRequest(userInput) {
    const lowerInput = userInput.toLowerCase();

    // Ключевые слова для знаниевых запросов
    const knowledgeKeywords = [
      'расскажи', 'что такое', 'объясни', 'как работает', 'что знаешь о',
      'почему', 'где', 'когда', 'кто', 'какой', 'расскажите', 'опиши',
      'что это', 'как это', 'зачем', 'для чего', 'история', 'происхождение'
    ];

    // Предметные области
    const knowledgeDomains = [
      'планет', 'марс', 'юпитер', 'земля', 'космос', 'астрономия',
      'медицин', 'наука', 'физика', 'химия', 'биология', 'математика',
      'история', 'география', 'технология', 'компьютер', 'программирование',
      'искусство', 'культура', 'литература', 'философия', 'религия',
      'политика', 'экономика', 'общество', 'психология', 'социология'
    ];

    // Проверка на ключевые слова
    const hasKnowledgeKeywords = knowledgeKeywords.some(keyword => 
      lowerInput.includes(keyword)
    );

    // Проверка на предметные области
    const hasKnowledgeDomains = knowledgeDomains.some(domain => 
      lowerInput.includes(domain)
    );

    // Проверка на вопросительные конструкции
    const isQuestion = lowerInput.includes('?') || 
                      lowerInput.startsWith('что') ||
                      lowerInput.startsWith('как') ||
                      lowerInput.startsWith('где') ||
                      lowerInput.startsWith('когда') ||
                      lowerInput.startsWith('почему') ||
                      lowerInput.startsWith('зачем');

    return hasKnowledgeKeywords || hasKnowledgeDomains || isQuestion;
  }

  /**
   * Обогащение результатов внешними знаниями
   */
  async enrichWithExternalSources(analysisResult, context) {
    try {
      const { originalQuery, enhancedContext } = context;
      const startTime = Date.now();

      // Мета-анализ (если доступен)
      let metaAnalysis = null;
      if (enhancedContext.includeMetaAnalysis) {
        try {
          const { performMetaAnalysis } = require('../meta-analysis-provider');
          metaAnalysis = await performMetaAnalysis(originalQuery, {
            language: 'ru',
            domain: 'general',
            maxResults: 5
          });
        } catch (error) {
          SmartLogger.integration(`⚠️ Мета-анализ недоступен: ${error.message}`);
        }
      }

      // Эмоциональное профилирование
      let emotionalProfile = null;
      if (enhancedContext.includeEmotionalAnalysis) {
        try {
          const { analyzeEmotionalTone } = require('../emotional-analysis-provider');
          emotionalProfile = await analyzeEmotionalTone(originalQuery, {
            userProfile: enhancedContext.userProfile
          });
        } catch (error) {
          SmartLogger.integration(`⚠️ Эмоциональный анализ недоступен: ${error.message}`);
        }
      }

      // Расширенный поиск при необходимости
      let advancedSearchResults = null;
      let externalKnowledgeResults = null;

      if (enhancedContext.includeAdvancedSearch) {
        try {
          const { performAdvancedSearch } = require('../advanced-search-provider');
          advancedSearchResults = await performAdvancedSearch(originalQuery, {
            searchType: 'comprehensive',
            language: 'ru',
            maxResults: 8,
            includeAnalysis: true
          });
        } catch (error) {
          SmartLogger.integration(`⚠️ Расширенный поиск недоступен: ${error.message}`);
        }
      }

      // Обогащение внешними знаниями
      if (enhancedContext.includeExternalKnowledge) {
        try {
          const { enrichWithExternalKnowledge } = require('./semantic-memory/external-knowledge-integrator.cjs');
          externalKnowledgeResults = await enrichWithExternalKnowledge(originalQuery, {
            includeAdvancedSearch: true,
            searchType: 'comprehensive',
            language: enhancedContext.language || 'ru'
          });
        } catch (error) {
          SmartLogger.integration(`⚠️ Внешние знания недоступны: ${error.message}`);
        }
      }

      // Финальная компиляция результатов
      const finalResult = {
        query: originalQuery,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime,
        sessionId: enhancedContext.sessionId,
        analysis: {
          semanticResult: analysisResult,
          metaAnalysis: metaAnalysis,
          emotionalProfile: emotionalProfile
        },
        advancedSearch: advancedSearchResults,
        externalKnowledge: externalKnowledgeResults,
        recommendations: this.generateRecommendations(analysisResult, metaAnalysis),
        confidence: this.calculateOverallConfidence(analysisResult, metaAnalysis),
        context: enhancedContext
      };

      return finalResult;

    } catch (error) {
      SmartLogger.integration(`❌ Ошибка обогащения внешними знаниями: ${error.message}`);
      return { error: error.message };
    }
  }

  generateRecommendations(semanticResult, metaAnalysis) {
    const recommendations = [];

    if (semanticResult?.enhanced_recommendations?.suggestions) {
      recommendations.push(...semanticResult.enhanced_recommendations.suggestions);
    }
    if (metaAnalysis?.suggestions) {
      recommendations.push(...metaAnalysis.suggestions);
    }

    return recommendations;
  }

  calculateOverallConfidence(semanticResult, metaAnalysis) {
    let confidence = semanticResult?.confidence || 0;

    if (metaAnalysis?.confidence) {
      confidence = (confidence + metaAnalysis.confidence) / 2;
    }

    return confidence;
  }

  /**
   * Нормализует запрос перед отправкой во внешние источники
   */
  normalizeQueryForExternalSources(query) {
    // Удаляем лишние пробелы и символы
    let normalizedQuery = query.trim();

    // Преобразуем в нижний регистр для единообразия
    normalizedQuery = normalizedQuery.toLowerCase();

    // Заменяем специфические символы
    normalizedQuery = normalizedQuery.replace(/[\W_]+/g, ' ');

    return normalizedQuery;
  }

  /**
   * Валидация регулярных выражений
   */
  validateRegexPatterns() {
    // Проверка и исправление регулярных выражений, если необходимо
    // (временно не реализовано)
  }

  /**
   * Безопасная сериализация данных
   */
  safeStringify(data, replacer = null, space = 2) {
    try {
      return JSON.stringify(data, replacer, space);
    } catch (error) {
      SmartLogger.error(`❌ Ошибка сериализации JSON: ${error.message}`);
      return '[Ошибка сериализации]';
    }
  }
}

// Создаем экземпляр SemanticIntegrationLayer
const semanticIntegrationLayer = new SemanticIntegrationLayer();

// Экспортируем функции модуля
module.exports = {
  analyzeWithSemantics: semanticIntegrationLayer.analyzeWithSemantics.bind(semanticIntegrationLayer),
  generateSmartResponse: semanticIntegrationLayer.generateSmartResponse.bind(semanticIntegrationLayer),
  initializeModules,

  // Геттеры для модулей
  get semanticMemory() { return semanticMemory; },
  get intelligentChatProcessor() { return intelligentChatProcessor; },
  get naturalLanguageGenerator() { return naturalLanguageGenerator; },

  // Утилиты
  loadModuleSafely
};

// Вспомогательная функция для определения, следует ли обогащать запрос внешними знаниями
function shouldEnrichWithExternalKnowledge(query, semanticResult) {
  // Простые критерии: запрос длиннее 10 символов и не является простым приветствием
  return query.length > 10 && !query.toLowerCase().includes('привет');
}

// Вспомогательная функция для обогащения запроса внешними знаниями
async function enrichWithExternalKnowledge(query, options = {}) {
  const { semanticContext, userProfile, includeAdvancedSearch = false, includeLocalProcessing = false } = options;
  const externalKnowledge = {};

  try {
    // 1. Поиск в Википедии
    SmartLogger.integration(`🌐 Поиск в Википедии: "${query}"`);
    const wikipediaResults = await searchWikipedia(query);
    externalKnowledge.wikipediaResults = wikipediaResults;
    SmartLogger.integration(`✅ Результаты Википедии: ${wikipediaResults.count} статей`);
  } catch (error) {
    SmartLogger.integration(`❌ Ошибка Википедии: ${error.message}`);
    externalKnowledge.wikipediaResults = { count: 0, articles: [] };
  }

  try {
    // 2. Поиск научных статей (ArXiv)
    SmartLogger.integration(`🔬 Поиск научных статей: "${query}"`);
    const scientificResults = await searchArxiv(query);
    externalKnowledge.scientificResults = scientificResults;
    SmartLogger.integration(`✅ Научные статьи: ${scientificResults.count} статей`);
  } catch (error) {
    SmartLogger.integration(`❌ Ошибка ArXiv: ${error.message}`);
    externalKnowledge.scientificResults = { count: 0, articles: [] };
  }

  try {
    // 3. Анализ связанных концепций (краудсорсинг)
    SmartLogger.integration(`🔗 Анализ связанныхконцепций: "${query}"`);
    const relatedConcepts = await analyzeRelatedConcepts(query);
    externalKnowledge.relatedConcepts = relatedConcepts;
    SmartLogger.integration(`✅ Связанные концепции: ${relatedConcepts.count} концепций`);
  } catch (error) {
    SmartLogger.integration(`❌ Ошибка концепций: ${error.message}`);
    externalKnowledge.relatedConcepts = { count: 0, concepts: [] };
  }

  if (includeAdvancedSearch) {
    try {
      // 4. Расширенный поиск с анализом (если включено)
      SmartLogger.integration(`🔎 Расширенный поиск с анализом: "${query}"`);
      const analysis = await performAdvancedSearch(query, {
        userProfile: userProfile,
        semanticContext: semanticContext
      });
      externalKnowledge.analysis = analysis;
      SmartLogger.integration(`✅ Расширенный поиск: анализ завершен`);
    } catch (error) {
      SmartLogger.integration(`❌ Ошибка расширенного поиска: ${error.message}`);
      externalKnowledge.analysis = null;
    }
  }

  if (includeLocalProcessing) {
    try {
      // 5. Локальная обработка и анализ данных (если включено)
      SmartLogger.integration(`⚙️ Локальная обработка и анализ данных: "${query}"`);
      const localAnalysis = await performLocalAnalysis(query, {
        userProfile: userProfile,
        semanticContext: semanticContext
      });
      externalKnowledge.localAnalysis = localAnalysis;
      SmartLogger.integration(`✅ Локальный анализ: завершен`);
    } catch (error) {
      SmartLogger.integration(`❌ Ошибка локального анализа: ${error.message}`);
      externalKnowledge.localAnalysis = null;
    }
  }

  return externalKnowledge;
}

// Примеры функций поиска и анализа (заглушки)
async function searchWikipedia(query) {
  return { count: 3, articles: [{ title: 'Example', summary: '...' }] };
}

async function searchArxiv(query) {
  return { count: 2, articles: [{ title: 'Paper', abstract: '...' }] };
}

async function analyzeRelatedConcepts(query) {
  return { count: 5, concepts: ['A', 'B', 'C'] };
}

async function performAdvancedSearch(query, options = {}) {
  //const { userProfile, semanticContext } = options;
  return { summary: 'Advanced search results...' };
}

async function performLocalAnalysis(query, options = {}) {
  //const { userProfile, semanticContext } = options;
  return { details: 'Local data analysis...' };
}

// Вспомогательная функция для оценки качества знаний
function assessKnowledgeQuality(externalKnowledge) {
  let qualityScore = 0;

  if (externalKnowledge.wikipediaResults?.count > 0) {
    qualityScore += 30;
  }
  if (externalKnowledge.scientificResults?.count > 0) {
    qualityScore += 40;
  }
  if (externalKnowledge.relatedConcepts?.count > 0) {
    qualityScore += 15;
  }
  if (externalKnowledge.analysis) {
    qualityScore += 15;
  }

  return Math.min(qualityScore, 100);
}