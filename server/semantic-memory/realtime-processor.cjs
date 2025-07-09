
/**
 * Процессор реального времени для семантической памяти (Фаза 3)
 * Обеспечивает мгновенное обновление и синхронизацию семантических данных
 */

const SmartLogger = {
  realtime: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`⚡ [${timestamp}] REALTIME: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

class RealtimeProcessor {
  constructor() {
    this.initializeRealtimeSystem();
  }

  /**
   * Инициализация системы реального времени
   */
  initializeRealtimeSystem() {
    // Очереди обработки в реальном времени
    this.processingQueues = {
      high_priority: [], // Критические обновления
      normal: [],        // Обычные обновления
      background: []     // Фоновые задачи
    };

    // Активные подписки на события
    this.eventSubscriptions = new Map();

    // Кэш для быстрого доступа
    this.realtimeCache = {
      user_contexts: new Map(),
      project_states: new Map(),
      predictions: new Map(),
      analytics: new Map()
    };

    // Метрики производительности
    this.performanceMetrics = {
      processing_times: [],
      queue_sizes: {},
      cache_hit_rates: {},
      event_frequencies: {}
    };

    // Конфигурация производительности
    this.config = {
      max_queue_size: 1000,
      processing_interval: 100, // мс
      cache_ttl: 300000, // 5 минут
      batch_size: 10,
      max_processing_time: 5000 // 5 секунд
    };

    // Запускаем обработчики
    this.startProcessingLoop();
    this.startCacheCleanup();
    this.startMetricsCollection();
  }

  /**
   * Добавление события в очередь реального времени
   */
  enqueueEvent(event, priority = 'normal') {
    SmartLogger.realtime('Добавляю событие в очередь', {
      type: event.type,
      priority: priority,
      timestamp: event.timestamp
    });

    const queueItem = {
      id: this.generateEventId(),
      event: event,
      priority: priority,
      enqueued_at: Date.now(),
      attempts: 0,
      max_attempts: 3
    };

    // Проверяем размер очереди
    if (this.processingQueues[priority].length >= this.config.max_queue_size) {
      SmartLogger.realtime(`Очередь ${priority} переполнена, удаляю старые события`);
      this.processingQueues[priority].shift(); // Удаляем самое старое
    }

    this.processingQueues[priority].push(queueItem);
    
    // Обновляем метрики
    this.updateQueueMetrics();

    return queueItem.id;
  }

  /**
   * Подписка на события в реальном времени
   */
  subscribe(eventType, callback, sessionId = null) {
    SmartLogger.realtime('Создаю подписку на события', {
      eventType: eventType,
      sessionId: sessionId
    });

    const subscriptionId = this.generateSubscriptionId();
    const subscription = {
      id: subscriptionId,
      eventType: eventType,
      callback: callback,
      sessionId: sessionId,
      created_at: Date.now(),
      last_triggered: null,
      trigger_count: 0
    };

    this.eventSubscriptions.set(subscriptionId, subscription);
    return subscriptionId;
  }

  /**
   * Отписка от событий
   */
  unsubscribe(subscriptionId) {
    const removed = this.eventSubscriptions.delete(subscriptionId);
    SmartLogger.realtime('Удалена подписка', { subscriptionId, success: removed });
    return removed;
  }

  /**
   * Мгновенное обновление пользовательского контекста
   */
  updateUserContextRealtime(sessionId, contextUpdate) {
    SmartLogger.realtime('Обновляю контекст пользователя в реальном времени', {
      sessionId: sessionId,
      updateKeys: Object.keys(contextUpdate)
    });

    const startTime = Date.now();

    // Получаем текущий контекст из кэша
    let currentContext = this.realtimeCache.user_contexts.get(sessionId) || {};

    // Применяем обновления
    const updatedContext = {
      ...currentContext,
      ...contextUpdate,
      last_updated: Date.now(),
      update_sequence: (currentContext.update_sequence || 0) + 1
    };

    // Обновляем кэш
    this.realtimeCache.user_contexts.set(sessionId, updatedContext);

    // Создаем событие для распространения
    const event = {
      type: 'user_context_updated',
      sessionId: sessionId,
      data: {
        previous: currentContext,
        current: updatedContext,
        changes: this.calculateContextChanges(currentContext, updatedContext)
      },
      timestamp: Date.now()
    };

    // Добавляем в очередь высокого приоритета
    this.enqueueEvent(event, 'high_priority');

    // Уведомляем подписчиков
    this.notifySubscribers('user_context_updated', event);

    // Записываем метрики производительности
    const processingTime = Date.now() - startTime;
    this.recordPerformanceMetric('context_update', processingTime);

    SmartLogger.realtime('Контекст пользователя обновлен', {
      sessionId: sessionId,
      processingTime: processingTime,
      sequenceNumber: updatedContext.update_sequence
    });

    return updatedContext;
  }

  /**
   * Реальное время обновления состояния проекта
   */
  updateProjectStateRealtime(projectId, stateUpdate) {
    SmartLogger.realtime('Обновляю состояние проекта в реальном времени', {
      projectId: projectId,
      updateType: stateUpdate.type
    });

    const startTime = Date.now();

    // Получаем текущее состояние
    let currentState = this.realtimeCache.project_states.get(projectId) || {};

    // Применяем обновление
    const updatedState = {
      ...currentState,
      ...stateUpdate,
      last_modified: Date.now(),
      version: (currentState.version || 0) + 1
    };

    // Обновляем кэш
    this.realtimeCache.project_states.set(projectId, updatedState);

    // Создаем событие
    const event = {
      type: 'project_state_updated',
      projectId: projectId,
      data: {
        previous: currentState,
        current: updatedState,
        delta: this.calculateStateDelta(currentState, updatedState)
      },
      timestamp: Date.now()
    };

    this.enqueueEvent(event, 'high_priority');
    this.notifySubscribers('project_state_updated', event);

    // Триггерим перерасчет предсказаний
    this.triggerPredictionUpdate(projectId, updatedState);

    const processingTime = Date.now() - startTime;
    this.recordPerformanceMetric('project_update', processingTime);

    return updatedState;
  }

  /**
   * Мгновенная аналитика взаимодействий
   */
  processInteractionRealtime(interactionData) {
    SmartLogger.realtime('Обрабатываю взаимодействие в реальном времени', {
      type: interactionData.type,
      sessionId: interactionData.sessionId
    });

    const startTime = Date.now();

    // Извлекаем быстрые инсайты
    const quickInsights = {
      interaction_type: interactionData.type,
      user_intent: this.extractQuickIntent(interactionData),
      satisfaction_signal: this.detectSatisfactionSignal(interactionData),
      engagement_level: this.calculateEngagementLevel(interactionData),
      context_relevance: this.assessContextRelevance(interactionData),
      timestamp: Date.now()
    };

    // Обновляем аналитический кэш
    const sessionAnalytics = this.realtimeCache.analytics.get(interactionData.sessionId) || {
      interactions: [],
      patterns: {},
      trends: {}
    };

    sessionAnalytics.interactions.push(quickInsights);
    
    // Ограничиваем размер истории
    if (sessionAnalytics.interactions.length > 50) {
      sessionAnalytics.interactions = sessionAnalytics.interactions.slice(-50);
    }

    // Обновляем паттерны в реальном времени
    sessionAnalytics.patterns = this.updatePatterns(sessionAnalytics.interactions);
    sessionAnalytics.trends = this.updateTrends(sessionAnalytics.interactions);

    this.realtimeCache.analytics.set(interactionData.sessionId, sessionAnalytics);

    // Создаем событие аналитики
    const event = {
      type: 'interaction_analyzed',
      sessionId: interactionData.sessionId,
      data: {
        insights: quickInsights,
        patterns: sessionAnalytics.patterns,
        trends: sessionAnalytics.trends
      },
      timestamp: Date.now()
    };

    this.enqueueEvent(event, 'normal');
    this.notifySubscribers('interaction_analyzed', event);

    const processingTime = Date.now() - startTime;
    this.recordPerformanceMetric('interaction_analysis', processingTime);

    return quickInsights;
  }

  /**
   * Обновление предсказаний в реальном времени
   */
  updatePredictionsRealtime(projectId, contextData) {
    SmartLogger.realtime('Обновляю предсказания в реальном времени', {
      projectId: projectId
    });

    const startTime = Date.now();

    // Быстрые предсказания на основе паттернов
    const quickPredictions = {
      next_likely_action: this.predictNextAction(contextData),
      completion_probability: this.predictCompletionProbability(contextData),
      resource_requirements: this.predictResourceNeeds(contextData),
      timeline_estimate: this.predictTimeline(contextData),
      potential_issues: this.predictPotentialIssues(contextData),
      confidence: this.calculatePredictionConfidence(contextData),
      generated_at: Date.now()
    };

    // Обновляем кэш предсказаний
    this.realtimeCache.predictions.set(projectId, quickPredictions);

    // Создаем событие
    const event = {
      type: 'predictions_updated',
      projectId: projectId,
      data: quickPredictions,
      timestamp: Date.now()
    };

    this.enqueueEvent(event, 'normal');
    this.notifySubscribers('predictions_updated', event);

    const processingTime = Date.now() - startTime;
    this.recordPerformanceMetric('prediction_update', processingTime);

    return quickPredictions;
  }

  /**
   * Получение данных из кэша реального времени
   */
  getRealtimeData(dataType, key) {
    const cacheData = this.realtimeCache[dataType]?.get(key);
    
    if (cacheData) {
      // Обновляем метрики попаданий в кэш
      this.updateCacheHitRate(dataType, true);
      return {
        data: cacheData,
        cached: true,
        age: Date.now() - (cacheData.last_updated || cacheData.generated_at || 0)
      };
    }

    this.updateCacheHitRate(dataType, false);
    return {
      data: null,
      cached: false,
      age: 0
    };
  }

  /**
   * Основной цикл обработки событий
   */
  startProcessingLoop() {
    setInterval(() => {
      this.processEventQueues();
    }, this.config.processing_interval);
  }

  /**
   * Обработка очередей событий
   */
  processEventQueues() {
    const startTime = Date.now();
    let processedCount = 0;

    // Обрабатываем очереди по приоритету
    const queues = ['high_priority', 'normal', 'background'];
    
    for (const queueName of queues) {
      const queue = this.processingQueues[queueName];
      const batchSize = queueName === 'high_priority' ? this.config.batch_size * 2 : this.config.batch_size;
      
      const batch = queue.splice(0, batchSize);
      
      for (const item of batch) {
        try {
          this.processQueueItem(item);
          processedCount++;
        } catch (error) {
          SmartLogger.realtime('Ошибка обработки события', {
            error: error.message,
            eventId: item.id
          });
          
          // Повторная попытка
          if (item.attempts < item.max_attempts) {
            item.attempts++;
            queue.push(item);
          }
        }

        // Проверяем время обработки
        if (Date.now() - startTime > this.config.max_processing_time) {
          SmartLogger.realtime('Превышено время обработки, прерываю цикл');
          return;
        }
      }
    }

    if (processedCount > 0) {
      SmartLogger.realtime('Обработан batch событий', {
        count: processedCount,
        processingTime: Date.now() - startTime
      });
    }
  }

  /**
   * Обработка отдельного элемента очереди
   */
  processQueueItem(item) {
    const event = item.event;
    
    switch (event.type) {
      case 'user_context_updated':
        this.processUserContextUpdate(event);
        break;
      case 'project_state_updated':
        this.processProjectStateUpdate(event);
        break;
      case 'interaction_analyzed':
        this.processInteractionAnalysis(event);
        break;
      case 'predictions_updated':
        this.processPredictionsUpdate(event);
        break;
      default:
        SmartLogger.realtime('Неизвестный тип события', { type: event.type });
    }
  }

  /**
   * Уведомление подписчиков
   */
  notifySubscribers(eventType, eventData) {
    let notifiedCount = 0;

    for (const [subscriptionId, subscription] of this.eventSubscriptions) {
      if (subscription.eventType === eventType || subscription.eventType === '*') {
        // Проверяем фильтр по сессии
        if (subscription.sessionId && subscription.sessionId !== eventData.sessionId) {
          continue;
        }

        try {
          subscription.callback(eventData);
          subscription.last_triggered = Date.now();
          subscription.trigger_count++;
          notifiedCount++;
        } catch (error) {
          SmartLogger.realtime('Ошибка в callback подписчика', {
            subscriptionId: subscriptionId,
            error: error.message
          });
        }
      }
    }

    if (notifiedCount > 0) {
      SmartLogger.realtime('Уведомлены подписчики', {
        eventType: eventType,
        notifiedCount: notifiedCount
      });
    }
  }

  /**
   * Очистка кэша
   */
  startCacheCleanup() {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Каждую минуту
  }

  cleanupExpiredCache() {
    const now = Date.now();
    const ttl = this.config.cache_ttl;
    let cleanedCount = 0;

    // Очищаем каждый тип кэша
    Object.entries(this.realtimeCache).forEach(([cacheType, cache]) => {
      for (const [key, data] of cache) {
        const age = now - (data.last_updated || data.generated_at || data.timestamp || 0);
        if (age > ttl) {
          cache.delete(key);
          cleanedCount++;
        }
      }
    });

    if (cleanedCount > 0) {
      SmartLogger.realtime('Очищен устаревший кэш', {
        cleanedItems: cleanedCount
      });
    }
  }

  /**
   * Сбор метрик
   */
  startMetricsCollection() {
    setInterval(() => {
      this.collectMetrics();
    }, 30000); // Каждые 30 секунд
  }

  collectMetrics() {
    const metrics = {
      timestamp: Date.now(),
      queue_sizes: {},
      cache_sizes: {},
      active_subscriptions: this.eventSubscriptions.size,
      avg_processing_time: this.calculateAverageProcessingTime(),
      cache_hit_rates: { ...this.performanceMetrics.cache_hit_rates }
    };

    // Размеры очередей
    Object.entries(this.processingQueues).forEach(([queueName, queue]) => {
      metrics.queue_sizes[queueName] = queue.length;
    });

    // Размеры кэшей
    Object.entries(this.realtimeCache).forEach(([cacheType, cache]) => {
      metrics.cache_sizes[cacheType] = cache.size;
    });

    SmartLogger.realtime('Метрики собраны', metrics);
  }

  // Вспомогательные методы (упрощенная реализация)
  generateEventId() { return Math.random().toString(36).substr(2, 9); }
  generateSubscriptionId() { return Math.random().toString(36).substr(2, 9); }
  
  calculateContextChanges(previous, current) {
    const changes = {};
    Object.keys(current).forEach(key => {
      if (previous[key] !== current[key]) {
        changes[key] = { from: previous[key], to: current[key] };
      }
    });
    return changes;
  }

  calculateStateDelta(previous, current) {
    return { changed_fields: Object.keys(current).filter(key => previous[key] !== current[key]) };
  }

  extractQuickIntent(data) { return data.type || 'unknown'; }
  detectSatisfactionSignal(data) { return 'neutral'; }
  calculateEngagementLevel(data) { return 'medium'; }
  assessContextRelevance(data) { return 0.7; }
  
  updatePatterns(interactions) { return { count: interactions.length }; }
  updateTrends(interactions) { return { trend: 'stable' }; }
  
  predictNextAction(context) { return 'continue_project'; }
  predictCompletionProbability(context) { return 0.8; }
  predictResourceNeeds(context) { return 'medium'; }
  predictTimeline(context) { return '15 minutes'; }
  predictPotentialIssues(context) { return []; }
  calculatePredictionConfidence(context) { return 0.7; }
  
  triggerPredictionUpdate(projectId, state) {
    setTimeout(() => {
      this.updatePredictionsRealtime(projectId, state);
    }, 100);
  }

  updateQueueMetrics() {
    Object.entries(this.processingQueues).forEach(([queueName, queue]) => {
      this.performanceMetrics.queue_sizes[queueName] = queue.length;
    });
  }

  recordPerformanceMetric(operation, time) {
    this.performanceMetrics.processing_times.push({ operation, time, timestamp: Date.now() });
    if (this.performanceMetrics.processing_times.length > 1000) {
      this.performanceMetrics.processing_times = this.performanceMetrics.processing_times.slice(-500);
    }
  }

  updateCacheHitRate(cacheType, hit) {
    if (!this.performanceMetrics.cache_hit_rates[cacheType]) {
      this.performanceMetrics.cache_hit_rates[cacheType] = { hits: 0, misses: 0 };
    }
    
    if (hit) {
      this.performanceMetrics.cache_hit_rates[cacheType].hits++;
    } else {
      this.performanceMetrics.cache_hit_rates[cacheType].misses++;
    }
  }

  calculateAverageProcessingTime() {
    const times = this.performanceMetrics.processing_times.slice(-100);
    if (times.length === 0) return 0;
    return times.reduce((sum, t) => sum + t.time, 0) / times.length;
  }

  // Обработчики событий
  processUserContextUpdate(event) {
    // Логика обработки обновления контекста
  }

  processProjectStateUpdate(event) {
    // Логика обработки обновления состояния проекта
  }

  processInteractionAnalysis(event) {
    // Логика обработки анализа взаимодействия
  }

  processPredictionsUpdate(event) {
    // Логика обработки обновления предсказаний
  }
}

module.exports = new RealtimeProcessor();
