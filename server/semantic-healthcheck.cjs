
/**
 * Система мониторинга здоровья семантических модулей
 * Отслеживает состояние всех 40+ компонентов
 */

const { createLogger } = require('./semantic-logger.cjs');
const logger = createLogger('SEMANTIC-HEALTHCHECK');

class SemanticHealthChecker {
  constructor() {
    this.modules = new Map();
    this.lastCheck = null;
    this.checkInterval = 30000; // 30 секунд
    this.criticalModules = [
      'semantic-memory',
      'intelligent-processor',
      'semantic-integration-layer',
      'quantum-processor',
      'creative-engine',
      'emotional-matrix'
    ];
    
    this.startPeriodicChecks();
    logger.info('Система мониторинга здоровья семантических модулей инициализирована');
  }

  /**
   * Регистрирует модуль для мониторинга
   */
  registerModule(name, moduleInstance, options = {}) {
    this.modules.set(name, {
      instance: moduleInstance,
      name: name,
      critical: options.critical || this.criticalModules.includes(name),
      lastHealth: null,
      healthHistory: [],
      errors: [],
      performanceMetrics: {
        averageResponseTime: 0,
        errorRate: 0,
        totalCalls: 0,
        successfulCalls: 0
      },
      ...options
    });
    
    logger.info(`Модуль ${name} зарегистрирован для мониторинга (критичный: ${this.modules.get(name).critical})`);
  }

  /**
   * Проверяет здоровье всех модулей
   */
  checkSystemHealth() {
    const startTime = Date.now();
    const results = {
      status: 'healthy',
      timestamp: startTime,
      summary: {
        total: this.modules.size,
        healthy: 0,
        degraded: 0,
        critical: 0,
        unavailable: 0
      },
      modules: {},
      issues: [],
      recommendations: []
    };

    logger.debug('Начинаем проверку здоровья всех семантических модулей');

    // Проверяем каждый модуль
    for (const [name, moduleData] of this.modules.entries()) {
      try {
        const moduleHealth = this.checkModuleHealth(name, moduleData);
        results.modules[name] = moduleHealth;

        // Обновляем общую статистику
        switch (moduleHealth.status) {
          case 'healthy':
            results.summary.healthy++;
            break;
          case 'degraded':
            results.summary.degraded++;
            break;
          case 'critical':
            results.summary.critical++;
            break;
          case 'unavailable':
            results.summary.unavailable++;
            break;
        }

        // Добавляем проблемы
        if (moduleHealth.issues.length > 0) {
          results.issues.push(...moduleHealth.issues.map(issue => ({
            module: name,
            issue: issue,
            critical: moduleData.critical
          })));
        }

      } catch (error) {
        logger.error(`Ошибка проверки модуля ${name}:`, error);
        results.modules[name] = {
          status: 'unavailable',
          error: error.message,
          issues: [`Ошибка проверки: ${error.message}`]
        };
        results.summary.unavailable++;
      }
    }

    // Определяем общий статус системы
    if (results.summary.critical > 0 || results.summary.unavailable > 2) {
      results.status = 'critical';
    } else if (results.summary.degraded > 3 || results.summary.unavailable > 0) {
      results.status = 'degraded';
    } else if (results.summary.healthy === results.summary.total) {
      results.status = 'optimal';
    }

    // Генерируем рекомендации
    results.recommendations = this.generateRecommendations(results);

    const checkDuration = Date.now() - startTime;
    results.checkDuration = checkDuration;

    this.lastCheck = results;

    logger.info(`Проверка здоровья завершена за ${checkDuration}мс: ${results.status} (${results.summary.healthy}/${results.summary.total} модулей здоровы)`);

    return results;
  }

  /**
   * Проверяет здоровье конкретного модуля
   */
  checkModuleHealth(name, moduleData) {
    const health = {
      name: name,
      status: 'healthy',
      critical: moduleData.critical,
      issues: [],
      metrics: {},
      lastChecked: Date.now()
    };

    try {
      // Проверка доступности модуля
      if (!moduleData.instance) {
        health.status = 'unavailable';
        health.issues.push('Модуль не инициализирован');
        return health;
      }

      // Проверка производительности
      const perfMetrics = moduleData.performanceMetrics;
      if (perfMetrics.averageResponseTime > 5000) {
        health.status = 'degraded';
        health.issues.push(`Высокое время ответа: ${perfMetrics.averageResponseTime}мс`);
      }

      if (perfMetrics.errorRate > 0.1) {
        health.status = perfMetrics.errorRate > 0.3 ? 'critical' : 'degraded';
        health.issues.push(`Высокий процент ошибок: ${(perfMetrics.errorRate * 100).toFixed(1)}%`);
      }

      // Проверка специфичных методов модуля
      if (typeof moduleData.instance.checkHealth === 'function') {
        const moduleSpecificHealth = moduleData.instance.checkHealth();
        if (moduleSpecificHealth && !moduleSpecificHealth.healthy) {
          health.status = 'degraded';
          health.issues.push(...(moduleSpecificHealth.issues || ['Внутренние проблемы модуля']));
        }
      }

      // Проверка памяти для критичных модулей
      if (moduleData.critical) {
        const memoryUsage = process.memoryUsage();
        if (memoryUsage.heapUsed > 400 * 1024 * 1024) { // 400MB
          health.status = 'degraded';
          health.issues.push(`Высокое использование памяти: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(1)}MB`);
        }
      }

      health.metrics = {
        ...perfMetrics,
        memoryUsage: process.memoryUsage().heapUsed
      };

      // Сохраняем историю
      moduleData.healthHistory.push({
        timestamp: Date.now(),
        status: health.status,
        issueCount: health.issues.length
      });

      // Ограничиваем историю
      if (moduleData.healthHistory.length > 100) {
        moduleData.healthHistory = moduleData.healthHistory.slice(-50);
      }

    } catch (error) {
      health.status = 'critical';
      health.issues.push(`Ошибка проверки здоровья: ${error.message}`);
      logger.error(`Ошибка проверки здоровья модуля ${name}:`, error);
    }

    moduleData.lastHealth = health;
    return health;
  }

  /**
   * Генерирует рекомендации на основе состояния системы
   */
  generateRecommendations(healthResults) {
    const recommendations = [];

    // Рекомендации по общему состоянию
    if (healthResults.summary.critical > 0) {
      recommendations.push({
        priority: 'high',
        action: 'Немедленно исправить критические проблемы',
        details: `${healthResults.summary.critical} модулей в критическом состоянии`
      });
    }

    if (healthResults.summary.unavailable > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Проверить доступность модулей',
        details: `${healthResults.summary.unavailable} модулей недоступны`
      });
    }

    if (healthResults.summary.degraded > 2) {
      recommendations.push({
        priority: 'medium',
        action: 'Оптимизировать производительность',
        details: `${healthResults.summary.degraded} модулей работают с деградацией`
      });
    }

    // Специфичные рекомендации по проблемам
    const memoryIssues = healthResults.issues.filter(i => i.issue.includes('памяти'));
    if (memoryIssues.length > 0) {
      recommendations.push({
        priority: 'medium',
        action: 'Оптимизировать использование памяти',
        details: 'Несколько модулей сообщают о проблемах с памятью'
      });
    }

    const responseTimeIssues = healthResults.issues.filter(i => i.issue.includes('время ответа'));
    if (responseTimeIssues.length > 0) {
      recommendations.push({
        priority: 'low',
        action: 'Оптимизировать время ответа',
        details: 'Некоторые модули работают медленно'
      });
    }

    return recommendations;
  }

  /**
   * Обновляет метрики производительности модуля
   */
  updateModuleMetrics(moduleName, responseTime, isError = false) {
    const moduleData = this.modules.get(moduleName);
    if (!moduleData) return;

    const metrics = moduleData.performanceMetrics;
    metrics.totalCalls++;

    if (!isError) {
      metrics.successfulCalls++;
    }

    metrics.errorRate = 1 - (metrics.successfulCalls / metrics.totalCalls);

    // Обновляем среднее время ответа
    if (metrics.averageResponseTime === 0) {
      metrics.averageResponseTime = responseTime;
    } else {
      metrics.averageResponseTime = (metrics.averageResponseTime + responseTime) / 2;
    }

    // Сохраняем ошибки
    if (isError) {
      moduleData.errors.push({
        timestamp: Date.now(),
        responseTime: responseTime
      });

      // Ограничиваем количество сохраненных ошибок
      if (moduleData.errors.length > 50) {
        moduleData.errors = moduleData.errors.slice(-25);
      }
    }
  }

  /**
   * Получает статистику здоровья системы
   */
  getHealthStats() {
    return {
      lastCheck: this.lastCheck,
      totalModules: this.modules.size,
      criticalModules: Array.from(this.modules.values()).filter(m => m.critical).length,
      registeredModules: Array.from(this.modules.keys()),
      systemUptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }

  /**
   * Запускает периодические проверки
   */
  startPeriodicChecks() {
    setInterval(() => {
      try {
        this.checkSystemHealth();
      } catch (error) {
        logger.error('Ошибка периодической проверки здоровья:', error);
      }
    }, this.checkInterval);

    logger.info(`Запущены периодические проверки здоровья (интервал: ${this.checkInterval}мс)`);
  }

  /**
   * Выполняет самодиагностику системы мониторинга
   */
  selfDiagnostic() {
    const diagnostic = {
      timestamp: Date.now(),
      monitoringSystem: {
        status: 'operational',
        registeredModules: this.modules.size,
        lastCheckAge: this.lastCheck ? Date.now() - this.lastCheck.timestamp : null,
        issues: []
      }
    };

    if (this.modules.size === 0) {
      diagnostic.monitoringSystem.status = 'warning';
      diagnostic.monitoringSystem.issues.push('Нет зарегистрированных модулей для мониторинга');
    }

    if (diagnostic.monitoringSystem.lastCheckAge > 60000) { // 1 минута
      diagnostic.monitoringSystem.status = 'warning';
      diagnostic.monitoringSystem.issues.push('Давно не было проверки здоровья');
    }

    return diagnostic;
  }
}

// Создаем глобальный экземпляр
const globalHealthChecker = new SemanticHealthChecker();

// Автоматически регистрируем базовые модули
try {
  const semanticMemory = require('./semantic-memory/index.cjs');
  globalHealthChecker.registerModule('semantic-memory', semanticMemory, { critical: true });
  
  const intelligentProcessor = require('./intelligent-chat-processor.cjs');
  globalHealthChecker.registerModule('intelligent-processor', intelligentProcessor, { critical: true });
  
  const semanticIntegration = require('./semantic-integration-layer.cjs');
  globalHealthChecker.registerModule('semantic-integration', semanticIntegration, { critical: true });
  
  logger.info('Базовые модули автоматически зарегистрированы для мониторинга');
} catch (error) {
  logger.warn('Некоторые базовые модули недоступны для автоматической регистрации:', error.message);
}

module.exports = {
  globalHealthChecker,
  SemanticHealthChecker
};
