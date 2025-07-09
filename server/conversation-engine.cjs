/**
 * ЕДИНЫЙ МОДУЛЬ "СОЗНАНИЕ" - Центральная система диалогов BOOOMERANGS AI
 * Объединяет все 50+ семантических модулей в единый интерфейс обработки
 * 
 * Архитектура: вход → анализ → генерация → рефлексия → ответ
 */

// Импортируем существующие модули через require (CommonJS совместимость)
const semanticMemory = require('./semantic-memory/index.cjs');
const intelligentChatProcessor = require('./intelligent-chat-processor.cjs');
const semanticIntegrationLayer = require('./semantic-integration-layer.cjs');
const naturalLanguageGenerator = require('./semantic-memory/natural-language-generator.cjs');
const autonomousLearningEngine = require('./semantic-memory/autonomous-learning-engine.cjs');
const metaSemanticEngine = require('./semantic-memory/meta-semantic-engine.cjs');
const emotionalSemanticMatrix = require('./semantic-memory/emotional-semantic-matrix.cjs');
const userProfiler = require('./semantic-memory/user-profiler.cjs');
const predictiveSystem = require('./semantic-memory/predictive-system.cjs');

// Импортируем новые модули
const { generatePersonaStylePrompt } = require('./persona.cjs');
const { semanticQualityScore, refineResponse } = require('./self-evaluator.cjs');

// Определения типов (заменяем TypeScript интерфейсы на JSDoc)

/**
 * @typedef {Object} UserContext
 * @property {string} [userId]
 * @property {string} [sessionId]
 * @property {Array} [conversationHistory]
 * @property {Object} [userProfile]
 * @property {Object} [sessionContext]
 * @property {string} [tone]
 * @property {string} [role]
 * @property {Object} [preferences]
 */

/**
 * @typedef {Object} ThoughtProcess
 * @property {string} input
 * @property {Object} meta
 * @property {Object} emotion
 * @property {Object} memory
 * @property {Object} persona
 * @property {UserContext} context
 */

/**
 * @typedef {Object} ProcessedResponse
 * @property {string} reply
 * @property {number} confidence
 * @property {number} quality
 * @property {Object} metadata
 * @property {string[]} metadata.modulesUsed
 * @property {number} metadata.processingTime
 * @property {number} metadata.iterationCount
 * @property {number} metadata.semanticDepth
 * @property {boolean} metadata.learningUpdated
 * @property {boolean} metadata.predictionsGenerated
 */

/**
 * ГЛАВНАЯ ФУНКЦИЯ СОЗНАНИЯ
 * Центральная точка обработки всех диалогов
 * @param {string} input - Пользовательский ввод
 * @param {UserContext} userContext - Контекст пользователя
 * @returns {Promise<ProcessedResponse>} Обработанный ответ
 */
const processUserInput = async (input, userContext = {}) => {
  const startTime = Date.now();
  let iterationCount = 0;

  console.log('🧠 АКТИВАЦИЯ ЕДИНОГО МОДУЛЯ СОЗНАНИЯ');
  console.log(`📝 Входной запрос: "${input.substring(0, 100)}..."`);

  // ===== СИСТЕМА ВОССТАНОВЛЕНИЯ: Инициализация =====
  const processingStages = {
    metaAnalysis: { status: 'pending', error: null, data: null, duration: 0 },
    emotionalAnalysis: { status: 'pending', error: null, data: null, duration: 0 },
    memoryRetrieval: { status: 'pending', error: null, data: null, duration: 0 },
    personaGeneration: { status: 'pending', error: null, data: null, duration: 0 },
    responseGeneration: { status: 'pending', error: null, data: null, duration: 0 },
    qualityEvaluation: { status: 'pending', error: null, data: null, duration: 0 }
  };

  try {
    // ===== ЭТАП 1: МЕТА-СЕМАНТИЧЕСКИЙ АНАЛИЗ С ТАЙМАУТОМ =====
    console.log('🔍 ЭТАП 1: Мета-семантический анализ...');
    const metaStartTime = Date.now();
    let meta = null;

    try {
      // ✅ ИСПРАВЛЕНО: Добавлен таймаут для предотвращения зависания
      const metaAnalysisPromise = semanticIntegrationLayer.analyzeWithSemantics(input, {
        ...userContext,
        fullAnalysis: true,
        activateAllModules: true
      });

      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут мета-анализа (5 сек)')), 5000);
      });

      meta = await Promise.race([metaAnalysisPromise, timeoutPromise]);

      // ✅ ИСПРАВЛЕНО: Проверяем корректность структуры
      if (!meta || !meta.semanticResult) {
        throw new Error('Некорректная структура результата мета-анализа');
      }

      processingStages.metaAnalysis.status = 'success';
      processingStages.metaAnalysis.data = meta;
      processingStages.metaAnalysis.duration = Date.now() - metaStartTime;
      console.log(`✅ ЭТАП 1: Мета-анализ успешен (${processingStages.metaAnalysis.duration}мс)`);
    } catch (metaError) {
      processingStages.metaAnalysis.status = 'failed';
      processingStages.metaAnalysis.error = metaError.message;
      processingStages.metaAnalysis.duration = Date.now() - metaStartTime;
      console.log(`❌ ЭТАП 1: Мета-анализ не удался (${metaError.message}), используем fallback`);

      // ✅ ИСПРАВЛЕНО: Правильная структура fallback
      meta = {
        shouldUseSemantic: true,
        semanticResult: {
          intent: 'general_conversation',
          confidence: 0.4,
          semantic_depth_level: 1,
          category: 'conversation',
          query_type: 'dialog',
          dialog_category: 'general_chat',
          semantic_analysis: {
            query_type: 'dialog',
            dialog_category: 'general_chat',
            semantic_cluster: { name: 'conversation', confidence: 40 },
            intentions: [],
            context_clues: {}
          },
          fallback: true
        }
      };
    }

    // ===== ЭТАП 2: ЭМОЦИОНАЛЬНЫЙ АНАЛИЗ =====
    console.log('😊 ЭТАП 2: Эмоциональная матрица...');
    const emotionStartTime = Date.now();
    let emotion = {};

    try {
      if (emotionalSemanticMatrix && typeof emotionalSemanticMatrix.analyzeEmotionalContext === 'function') {
        emotion = await emotionalSemanticMatrix.analyzeEmotionalContext(input, {
          userHistory: userContext.conversationHistory || [],
          userProfile: userContext.userProfile
        });
        processingStages.emotionalAnalysis.status = 'success';
        processingStages.emotionalAnalysis.data = emotion;
        console.log(`✅ ЭТАП 2: Эмоциональный анализ успешен`);
      } else {
        throw new Error('emotionalSemanticMatrix.analyzeEmotionalContext недоступна');
      }
    } catch (emotionError) {
      processingStages.emotionalAnalysis.status = 'failed';
      processingStages.emotionalAnalysis.error = emotionError.message;
      console.log(`❌ ЭТАП 2: Эмоциональный анализ не удался (${emotionError.message}), используем fallback`);

      // Fallback эмоциональный анализ
      emotion = {
        primary_emotion: 'neutral',
        confidence: 0.7,
        emotional_context: 'general conversation',
        fallback: true
      };
    }
    processingStages.emotionalAnalysis.duration = Date.now() - emotionStartTime;
    console.log(`⏱️ ЭТАП 2: завершен за ${processingStages.emotionalAnalysis.duration}мс`);

    // ===== ЭТАП 3: ИЗВЛЕЧЕНИЕ ПАМЯТИ =====
    console.log('💾 ЭТАП 3: Семантическая память...');
    const memoryStartTime = Date.now();
    let memory = null;

    try {
      memory = await semanticMemory.analyzeCompleteRequest(input, {
        conversationHistory: userContext.conversationHistory || [],
        userProfile: userContext.userProfile || null,
        sessionContext: userContext.sessionContext || {}
      });
      processingStages.memoryRetrieval.status = 'success';
      processingStages.memoryRetrieval.data = memory;
      console.log(`✅ ЭТАП 3: Семантическая память успешно извлечена`);
    } catch (memoryError) {
      processingStages.memoryRetrieval.status = 'failed';
      processingStages.memoryRetrieval.error = memoryError.message;
      console.log(`❌ ЭТАП 3: Семантическая память не удалась (${memoryError.message}), используем fallback`);

      // Fallback память
      memory = {
        semantic_analysis: { intent: 'general', confidence: 0.5 },
        entities: [],
        context: userContext.sessionContext || {},
        fallback: true
      };
    }
    processingStages.memoryRetrieval.duration = Date.now() - memoryStartTime;
    console.log(`⏱️ ЭТАП 3: завершен за ${processingStages.memoryRetrieval.duration}мс`);

    // ===== ЭТАП 4: ПРОФИЛИРОВАНИЕ ПОЛЬЗОВАТЕЛЯ =====
    console.log('🎭 ЭТАП 4: Профилирование пользователя...');
    const personaStartTime = Date.now();
    let persona = null;
    let userProfile = null;

    try {
      // ✅ ИСПРАВЛЕНО: Добавлен таймаут для профилирования
      const profilingPromise = (async () => {
        // Анализируем стиль общения пользователя
        const communicationStyle = userProfiler.analyzeCommunicationStyle(input);
        const designPreferences = userProfiler.analyzeDesignPreferences(input);
        const emotionalState = userProfiler.analyzeEmotionalState(input, userContext.conversationHistory || []);

        // Создаем или обновляем профиль пользователя
        const userProfile = await userProfiler.createPersonalizedProfile(
          userContext.userId || 'anonymous',
          {
            communicationStyle,
            designPreferences,
            emotionalState
          }
        );

        // Генерируем персону на основе анализа
        const persona = generatePersonaStylePrompt({
          ...userContext,
          userProfile,
          communicationStyle,
          emotionalState
        });

        return { persona, userProfile };
      })();

      const profilingTimeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Таймаут профилирования (3 сек)')), 3000);
      });

      const profilingResult = await Promise.race([profilingPromise, profilingTimeoutPromise]);
      persona = profilingResult.persona;
      userProfile = profilingResult.userProfile;

      processingStages.personaGeneration.status = 'success';
      processingStages.personaGeneration.data = { persona, userProfile };
      console.log(`✅ ЭТАП 4: Профилирование успешно завершено`);
    } catch (personaError) {
      processingStages.personaGeneration.status = 'failed';
      processingStages.personaGeneration.error = personaError.message;
      console.log(`❌ ЭТАП 4: Профилирование не удалось (${personaError.message}), используем fallback`);

      // Fallback персона
      persona = {
        style: 'friendly',
        tone: 'helpful',
        approach: 'conversational',
        fallback: true
      };
    }
    processingStages.personaGeneration.duration = Date.now() - personaStartTime;
    console.log(`⏱️ ЭТАП 4: завершен за ${processingStages.personaGeneration.duration}мс`);

    // ===== ЭТАП 5: ПРОВЕРКА НА ЗНАНИЕВЫЕ ЗАПРОСЫ И ОБОГАЩЕНИЕ =====
    console.log('🧠 ЭТАП 5: Анализ на знаниевые запросы...');
    let externalKnowledge = null;

    // Проверяем, является ли запрос знаниевым
    const isKnowledgeRequest = 
      (meta.semanticResult?.semantic_analysis?.semantic_cluster?.name === 'knowledge_request') ||
      (meta.semanticResult?.semantic_analysis?.dialog_category === 'knowledge_sharing') ||
      (meta.semanticResult?.query_type === 'information_request');

    if (isKnowledgeRequest) {
      console.log('📚 ОБНАРУЖЕН ЗНАНИЕВЫЙ ЗАПРОС - активируем внешние знания...');

      try {
        // Динамический импорт для избежания циклических зависимостей
        const externalKnowledgeIntegrator = require('./semantic-memory/external-knowledge-integrator.cjs');

        // Обогащаем запрос внешними знаниями
        externalKnowledge = await externalKnowledgeIntegrator.enrichWithExternalKnowledge(input, {
          userContext,
          semanticContext: meta.semanticResult,
          emotionalContext: emotion
        });

        console.log(`✅ Внешние знания получены: ${externalKnowledge.wikipediaResults?.count || 0} Wikipedia + ${externalKnowledge.scientificResults?.count || 0} научных источников`);

      } catch (knowledgeError) {
        console.log(`⚠️ Ошибка получения внешних знаний: ${knowledgeError.message}`);
        externalKnowledge = null;
      }
    }

    // ===== ЭТАП 6: ПОСТРОЕНИЕ МЫСЛИ =====
    console.log('💭 ЭТАП 6: Построение мыслительного процесса...');
    const thought = {
      input,                    // ✅ Сохраняем исходный запрос
      originalInput: input,     // ✅ Дублируем для гарантии
      meta: meta.semanticResult || meta,
      emotion,
      memory,
      persona,
      userProfile,              // ✅ Добавляем профиль пользователя
      context: userContext,
      externalKnowledge,        // ✅ Добавляем внешние знания
      isKnowledgeRequest        // ✅ Флаг знаниевого запроса
    };

    // ===== ЭТАП 7: ГЕНЕРАЦИЯ ОТВЕТА С СИСТЕМОЙ ВОССТАНОВЛЕНИЯ =====
    console.log('🔄 ЭТАП 7: Итеративная генерация ответа...');
    const responseStartTime = Date.now();
    let rawResponse = null;

    try {
      // Формируем расширенный контекст для генератора
      const generationContext = {
        messages: userContext.conversationHistory || [],
        userProfile: userContext.userProfile,
        sessionId: userContext.sessionId,
        emotionalContext: thought.emotion,
        personaStyle: thought.persona,
        semanticContext: thought.meta,
        memoryContext: thought.memory,
        externalKnowledge: thought.externalKnowledge,  // ✅ Передаем внешние знания
        isKnowledgeRequest: thought.isKnowledgeRequest  // ✅ Флаг типа запроса
      };

      rawResponse = await naturalLanguageGenerator.generateResponse(input, generationContext);
      iterationCount++;
      processingStages.responseGeneration.status = 'success';
      processingStages.responseGeneration.data = rawResponse;
      console.log(`✅ ЭТАП 7: Ответ успешно сгенерирован`);
    } catch (responseError) {
      processingStages.responseGeneration.status = 'failed';
      processingStages.responseGeneration.error = responseError.message;
      console.log(`❌ ЭТАП 7: Генерация ответа не удалась`);
      console.log(`❌ Ошибка: ${responseError.message}`);
      console.log(`❌ Стек: ${responseError.stack}`);
      console.log(`❌ Входные данные: ${JSON.stringify({ input: input.substring(0, 100), contextKeys: Object.keys(userContext) })}`);
      console.log(`🔄 Переходим к intelligent fallback генерации...`);

      // Intelligent fallback генерация
      rawResponse = generateIntelligentFallback(input, thought, userContext);
      iterationCount++;
    }
    processingStages.responseGeneration.duration = Date.now() - responseStartTime;
    console.log(`⏱️ ЭТАП 7: завершен за ${processingStages.responseGeneration.duration}мс`);

    // ===== ЭТАП 8: ОЦЕНКА КАЧЕСТВА И РЕФИНИРОВАНИЕ =====
    console.log('✨ ЭТАП 8: Оценка качества и рефинирование...');
    let responseQuality = semanticQualityScore(rawResponse.response, thought.meta);

    // Итеративное улучшение (как в GPT-4)
    while (responseQuality < 7 && iterationCount < 3) {
      console.log(`🔄 Качество ${responseQuality}/10 недостаточно, улучшаем... (итерация ${iterationCount})`);

      // Добавить проверку на улучшение
      const previousQuality = responseQuality;

      const refinedThought = await refineResponse(thought, rawResponse, responseQuality);
      rawResponse = await naturalLanguageGenerator.generateResponse(
        input,  // ✅ ИСПРАВЛЕНО: передаем исходный запрос
        {
          ...refinedThought.context,
          refinedThought: true,
          previousQuality: responseQuality,
          iterationCount,
          semanticContext: refinedThought.meta || thought.meta,
          memoryContext: refinedThought.memory || thought.memory
        }
      );

      const newQuality = semanticQualityScore(rawResponse.response, thought.meta);

      // Если качество не улучшается, прерываем цикл
      if (newQuality <= previousQuality + 0.1) {
        console.log(`🛑 Качество не улучшается (${newQuality} <= ${previousQuality + 0.1}), прерываем цикл`);
        break;
      }

      responseQuality = newQuality;
      iterationCount++;
    }

    // ===== ЭТАП 9: ФИНАЛЬНАЯ ВАЛИДАЦИЯ И АДАПТАЦИЯ =====
    console.log('🎯 ЭТАП 9: Финальная валидация и персонализация...');
    let finalResponse;
    try {
      // Сначала адаптируем ответ под профиль пользователя
      let adaptedResponse = rawResponse.response;
      if (userProfile && typeof userProfiler.adaptResponseToProfile === 'function') {
        try {
          adaptedResponse = userProfiler.adaptResponseToProfile(
            rawResponse.response,
            userProfile,
            thought.emotion
          );
          console.log('✅ Ответ адаптирован под профиль пользователя');
        } catch (adaptError) {
          console.log('⚠️ Не удалось адаптировать ответ:', adaptError.message);
        }
      }

      // Затем выполняем мета-валидацию
      if (metaSemanticEngine && typeof metaSemanticEngine.performMetaSemanticAnalysis === 'function') {
        const metaValidation = await metaSemanticEngine.performMetaSemanticAnalysis(
          input,
          thought.meta,
          {
            originalInput: input,
            processingSteps: ['meta', 'emotion', 'memory', 'persona', 'generation', 'refinement', 'adaptation'],
            qualityScore: responseQuality
          }
        );
        finalResponse = {
          validatedResponse: adaptedResponse,
          confidence: metaValidation.confidence || rawResponse.confidence || 0.8,
          metaAnalysis: metaValidation
        };
      } else {
        // Fallback валидация без мета-анализа
        finalResponse = {
          validatedResponse: adaptedResponse,
          confidence: rawResponse.confidence || 0.8,
          metaAnalysis: null
        };
      }
    } catch (validationError) {
      console.log('⚠️ Мета-валидация недоступна:', validationError.message);
      finalResponse = {
        validatedResponse: rawResponse.response,
        confidence: rawResponse.confidence || 0.8,
        metaAnalysis: null
      };
    }

    // ===== ЭТАП 10: АВТОНОМНОЕ ОБУЧЕНИЕ =====
    console.log('🎓 ЭТАП 10: Автономное обучение...');
    let learningUpdated = false;
    try {
      // Используем правильный метод learnFromInteraction
      await autonomousLearningEngine.learnFromInteraction({
        userQuery: input,
        response: finalResponse.validatedResponse || rawResponse.response,
        timestamp: Date.now(),
        userEngagement: finalResponse.confidence || rawResponse.confidence || 0.8,
        query: input
      }, {
        semanticAnalysis: thought.meta,
        qualityScore: responseQuality,
        userContext: userContext
      });
      learningUpdated = true;
    } catch (learningError) {
      console.log('⚠️ Автономное обучение временно недоступно:', learningError.message);
    }

    // ===== ЭТАП 11: ПРЕДИКТИВНЫЕ ПРЕДЛОЖЕНИЯ =====
    console.log('🔮 ЭТАП 11: Предиктивная система...');
    let predictionsGenerated = false;
    try {
      // Используем правильный метод predict
      await predictiveSystem.predict(userContext.userId || 'anonymous', {
        type: 'conversation',
        timestamp: Date.now()
      }, {
        type: 'conversation',
        query: input,
        response: finalResponse.validatedResponse || rawResponse.response,
        projectId: userContext.projectId,
        phase: thought.meta?.phase || 'general'
      });
      predictionsGenerated = true;
    } catch (predictionError) {
      console.log('⚠️ Предиктивная система временно недоступна:', predictionError.message);
    }

    const processingTime = Date.now() - startTime;

    // ===== СИСТЕМА ВОССТАНОВЛЕНИЯ: Анализ успешности =====
    const successfulStages = Object.values(processingStages).filter(stage => stage.status === 'success').length;
    const totalStages = Object.keys(processingStages).length;
    const systemHealthScore = (successfulStages / totalStages) * 100;

    console.log(`📊 СИСТЕМА ВОССТАНОВЛЕНИЯ: ${successfulStages}/${totalStages} этапов успешно (${systemHealthScore.toFixed(1)}%)`);

    // Детальный отчет по этапам
    Object.entries(processingStages).forEach(([stageName, stage]) => {
      const statusIcon = stage.status === 'success' ? '✅' : stage.status === 'failed' ? '❌' : '⏳';
      console.log(`${statusIcon} ${stageName}: ${stage.status} (${stage.duration}мс)${stage.error ? ` - ${stage.error}` : ''}`);
    });

    console.log(`🧠 СОЗНАНИЕ ЗАВЕРШИЛО ОБРАБОТКУ за ${processingTime}мс (${iterationCount} итераций, здоровье: ${systemHealthScore.toFixed(1)}%)`);

    return {
      reply: finalResponse.validatedResponse || rawResponse.response,
      confidence: finalResponse.confidence || rawResponse.confidence || 0.8,
      quality: responseQuality,
      metadata: {
        modulesUsed: Object.keys(thought.memory || {}).concat(['meta', 'emotion', 'persona']),
        processingTime,
        iterationCount,
        semanticDepth: thought.meta?.semantic_depth_level || 1,
        learningUpdated,
        predictionsGenerated,
        // ===== НОВЫЕ МЕТРИКИ СИСТЕМЫ ВОССТАНОВЛЕНИЯ =====
        systemHealth: {
          score: systemHealthScore,
          successfulStages: successfulStages,
          totalStages: totalStages,
          stageDetails: processingStages
        }
      }
    };

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА МОДУЛЯ СОЗНАНИЯ:', error);
    console.error('❌ Стек ошибки:', error.stack);
    console.error('❌ Входные данные:', { 
      input: input.substring(0, 100), 
      userContextKeys: Object.keys(userContext),
      userId: userContext.userId,
      sessionId: userContext.sessionId,
      timestamp: new Date().toISOString()
    });

    // Более детальная информация об ошибке
    let stage = 'unknown';
    if (error.message.includes('analyzeEmotionalContext')) stage = 'emotional-analysis';
    if (error.message.includes('analyzeCompleteRequest')) stage = 'semantic-memory';
    if (error.message.includes('generateResponse')) stage = 'response-generation';
    if (error.message.includes('generatePersonaStylePrompt')) stage = 'persona-generation';

    console.error(`❌ Этап ошибки: ${stage}`);

    // Fallback для критических ошибок
    return {
      reply: `Извините, произошла внутренняя ошибка в системе сознания. Модули семантики временно недоступны. Попробуйте переформулировать запрос.`,
      confidence: 0.1,
      quality: 1,
      metadata: {
        modulesUsed: ['fallback'],
        processingTime: Date.now() - startTime,
        iterationCount: 0,
        semanticDepth: 0,
        learningUpdated: false,
        predictionsGenerated: false
      }
    };
  }
};

/**
 * EXPRESS ENDPOINT для REST API
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 */
const chatEndpoint = async (req, res) => {
  try {
    const { message, context = {} } = req.body;

    if (!message) {
      return res.status(400).json({
        error: 'Поле message обязательно для заполнения'
      });
    }

    const result = await processUserInput(message, context);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('❌ Ошибка в chat endpoint:', error);
    res.status(500).json({
      error: 'Внутренняя ошибка сервера',
      message: error.message
    });
  }
};

/**
 * WEBSOCKET ОБРАБОТЧИК для real-time чата
 * @param {Object} ws - WebSocket соединение
 * @param {string} message - Сообщение
 */
const handleWebSocketMessage = async (ws, message) => {
  try {
    const { input, context = {} } = JSON.parse(message);

    if (!input) {
      ws.send(JSON.stringify({
        error: 'Поле input обязательно для заполнения'
      }));
      return;
    }

    // Отправляем статус начала обработки
    ws.send(JSON.stringify({
      type: 'processing_start',
      message: 'Активация модуля сознания...'
    }));

    const result = await processUserInput(input, context);

    // Отправляем финальный результат
    ws.send(JSON.stringify({
      type: 'response',
      ...result
    }));

  } catch (error) {
    console.error('❌ Ошибка в WebSocket обработчике:', error);
    ws.send(JSON.stringify({
      type: 'error',
      error: 'Внутренняя ошибка сервера',
      message: error.message
    }));
  }
};

/**
 * INTELLIGENT FALLBACK ГЕНЕРАТОР с учетом контекста
 * @param {string} input - Пользовательский ввод
 * @param {Object} thought - Объект мысли с контекстом
 * @param {Object} userContext - Контекст пользователя
 * @returns {Object} Fallback ответ в формате response object
 */
const generateIntelligentFallback = (input, thought, userContext) => {
  console.log('🚨 АКТИВАЦИЯ INTELLIGENT FALLBACK ГЕНЕРАТОРА');

  const lowerInput = input.toLowerCase();
  let fallbackResponse = '';

  // Используем доступные данные из thought для более умного fallback
  const hasEmotion = thought.emotion && !thought.emotion.fallback;
  const hasMeta = thought.meta && !thought.meta.fallback;
  const hasMemory = thought.memory && !thought.memory.fallback;
  const hasPersona = thought.persona && !thought.persona.fallback;

  // Адаптируем ответ под доступный контекст
  if (hasEmotion && thought.emotion.primary_emotion) {
    const emotion = thought.emotion.primary_emotion;
    if (emotion === 'enthusiastic' || emotion === 'excited') {
      fallbackResponse = "Вижу ваш энтузиазм! 🌟 ";
    } else if (emotion === 'neutral') {
      fallbackResponse = "Понимаю ваш запрос. ";
    } else if (emotion === 'frustrated') {
      fallbackResponse = "Понимаю, что это может расстраивать. ";
    }
  }

  // Приветствие
  if (lowerInput.includes('привет') || lowerInput.includes('hello') || lowerInput.includes('hi')) {
    fallbackResponse += "Привет! Я BOOOMERANGS AI - ваш интеллектуальный помощник. ";
    if (hasPersona && thought.persona.style === 'friendly') {
      fallbackResponse += "Рад познакомиться! ";
    }
    fallbackResponse += "Система сознания работает в режиме восстановления, но я готов помочь! Чем могу быть полезен?";
  }
  // Вопросы о системе
  else if (lowerInput.includes('кто ты') || lowerInput.includes('что ты')) {
    fallbackResponse += "Я BOOOMERANGS AI - продвинутая система искусственного интеллекта с семантической обработкой. ";
    if (hasMeta && thought.meta.semanticResult?.confidence > 0.5) {
      fallbackResponse += "Семантический анализ частично работает. ";
    }
    fallbackResponse += "В данный момент работаю в режиме восстановления, но готов общаться и помогать с различными задачами!";
  }
  // Возможности
  else if (lowerInput.includes('что ты умеешь') || lowerInput.includes('возможности')) {
    fallbackResponse += "Даже в режиме восстановления я могу: общаться на любые темы, помогать с творческими задачами, отвечать на вопросы, поддерживать интересную беседу. ";
    if (hasMemory) {
      fallbackResponse += "Семантическая память частично доступна. ";
    }
    fallbackResponse += "Полная система сознания восстанавливается!";
  }
  // Общие вопросы
  else if (lowerInput.includes('как дела') || lowerInput.includes('что нового')) {
    fallbackResponse += "Дела идут хорошо! Система сознания BOOOMERANGS проходит восстановление. ";
    const workingModules = [hasEmotion, hasMeta, hasMemory, hasPersona].filter(Boolean).length;
    fallbackResponse += `${workingModules} из 4 основных модулей работают. `;
    fallbackResponse += "Я все еще готов помочь и пообщаться!";
  }
  // Помощь
  else if (lowerInput.includes('помоги') || lowerInput.includes('help')) {
    fallbackResponse += "Конечно, помогу! ";
    if (hasEmotion && thought.emotion.confidence > 0.6) {
      fallbackResponse += "Вижу ваше эмоциональное состояние и учту это. ";
    }
    fallbackResponse += "Хотя система работает в режиме восстановления, я готов обсудить ваш вопрос и предложить решения. Расскажите подробнее, что вас интересует?";
  }
  // Универсальный ответ
  else {
    if (hasMeta && thought.meta.semanticResult?.intent) {
      fallbackResponse += `Понял, что это связано с: ${thought.meta.semanticResult.intent}. `;
    }
    fallbackResponse += "Система сознания BOOOMERANGS в режиме восстановления, но я готов обсудить это с вами. Расскажите подробнее - постараюсь помочь чем смогу!";
  }

  return {
      response: fallbackResponse,
      confidence: 0.7,
      metadata: { 
        approach: 'intelligent_fallback', 
        fallback: true,
        contextUsed: { hasEmotion, hasMeta, hasMemory, hasPersona }
      }
    };
};

/**
 * ПРОСТОЙ FALLBACK ГЕНЕРАТОР для критических ситуаций
 * @param {string} input - Пользовательский ввод
 * @returns {string} Fallback ответ
 */
const generateFallbackResponse = (input) => {
  const lowerInput = input.toLowerCase();

  // Приветствие
  if (lowerInput.includes('привет') || lowerInput.includes('hello') || lowerInput.includes('hi')) {
    return "Привет! Я BOOOMERANGS AI - ваш интеллектуальный помощник. Система сознания работает в упрощенном режиме, но я готов помочь! Чем могу быть полезен?";
  }

  // Вопросы о системе
  if (lowerInput.includes('кто ты') || lowerInput.includes('что ты')) {
    return "Я BOOOMERANGS AI - продвинутая система искусственного интеллекта с семантической обработкой. В данный момент работаю в режиме восстановления, но готов общаться и помогать с различными задачами!";
  }

  // Возможности
  if (lowerInput.includes('что ты умеешь') || lowerInput.includes('возможности')) {
    return "Даже в режиме восстановления я могу: общаться на любые темы, помогать с творческими задачами, отвечать на вопросы, поддерживать интересную беседу. Полная семантическая система скоро будет восстановлена!";
  }

  // Общие вопросы
  if (lowerInput.includes('как дела') || lowerInput.includes('что нового')) {
    return "Дела идут хорошо! Система сознания BOOOMERANGS восстанавливается. Семантические модули проходят диагностику. Я все еще готов помочь и пообщаться!";
  }

  // Помощь
  if (lowerInput.includes('помоги') || lowerInput.includes('help')) {
    return "Конечно, помогу! Хотя система работает в упрощенном режиме, я готов обсудить ваш вопрос и предложить решения. Расскажите подробнее, что вас интересует?";
  }

  // Универсальный ответ
  return "Интересный вопрос! Система сознания BOOOMERANGS временно в режиме восстановления, но я готов обсудить это с вами. Расскажите подробнее - постараюсь помочь чем смогу!";
};

// ✅ ИСПРАВЛЕНО: Улучшенная проверка инициализации модулей с таймаутами
const initializeSemanticModules = async () => {
  const initializationPromises = [];

  // Проверяем доступность системы
  if (!semanticMemory || typeof semanticMemory.analyzeCompleteRequest !== 'function') {
    console.error('❌ CRITICAL: Семантическая память не инициализирована');
    throw new Error('CRITICAL: Семантическая память не инициализирована');
  }

  // Проверяем и инициализируем критичные модули с таймаутами
  try {
    if (naturalLanguageGenerator && !naturalLanguageGenerator.isAvailable()) {
      console.log('⚠️ Генератор естественного языка не готов, инициализируем...');
      const nlgPromise = Promise.race([
        naturalLanguageGenerator.initialize(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут инициализации NLG')), 2000))
      ]).catch(error => {
        console.error('❌ Не удалось инициализировать NLG:', error.message);
      });
      initializationPromises.push(nlgPromise);
    }

    if (metaSemanticEngine && !metaSemanticEngine.isAvailable()) {
      console.log('⚠️ Мета-семантический движок не готов, инициализируем...');
      const metaPromise = Promise.race([
        metaSemanticEngine.initialize(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Таймаут инициализации Meta')), 2000))
      ]).catch(error => {
        console.error('❌ Не удалось инициализировать Meta-движок:', error.message);
      });
      initializationPromises.push(metaPromise);
    }

    // Ждем завершения инициализации (но не более 5 секунд)
    if (initializationPromises.length > 0) {
      try {
        await Promise.all(initializationPromises);
        console.log('✅ Все модули семантической памяти инициализированы');
      } catch (error) {
        console.error(`❌ Ошибка инициализации модулей: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`❌ Ошибка инициализации модулей: ${error.message}`);
  }
};

module.exports = {
  processUserInput,
  chatEndpoint,
  handleWebSocketMessage,
  generateFallbackResponse,
  generateIntelligentFallback
};