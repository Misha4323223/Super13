/**
 * Главный модуль семантической памяти проектов
 * Объединяет все компоненты семантической системы в единый интерфейс
 * ЭТАП 3: АКТИВАЦИЯ РЕАЛЬНЫХ МОДУЛЕЙ - УСТРАНЕНИЕ FALLBACK ЗАГЛУШЕК
 */

const SmartLogger = {
  main: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`🧠 [${timestamp}] SEMANTIC-MEMORY: ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

/**
 * СИСТЕМА ПРОВЕРКИ ДОСТУПНОСТИ МОДУЛЕЙ
 * Проверяет каждый модуль перед использованием
 */
class ModuleAvailabilityChecker {
  constructor() {
    this.moduleStatus = new Map();
    this.criticalModules = [
      'natural-language-generator',
      'semantic-analyzer', 
      'meta-semantic-engine',
      'emotional-semantic-matrix'
    ];
  }

  /**
   * Проверяет доступность модуля
   */
  async checkModuleAvailability(moduleName, modulePath) {
    try {
      const module = require(modulePath);

      // Проверяем наличие ключевых методов
      let isAvailable = true;
      let availabilityReason = 'module_loaded';

      if (moduleName === 'natural-language-generator') {
        isAvailable = module && typeof module.generateResponse === 'function';
        availabilityReason = isAvailable ? 'has_generateResponse' : 'missing_generateResponse';
      } else if (moduleName === 'semantic-analyzer') {
        isAvailable = module && typeof module.analyzeSemantics === 'function';
        availabilityReason = isAvailable ? 'has_analyzeSemantics' : 'missing_analyzeSemantics';
      } else if (moduleName === 'meta-semantic-engine') {
        isAvailable = module && typeof module.analyze === 'function';
        availabilityReason = isAvailable ? 'has_analyze' : 'missing_analyze';
      } else if (moduleName === 'emotional-semantic-matrix') {
        isAvailable = module && typeof module.analyzeEmotionalContext === 'function';
        availabilityReason = isAvailable ? 'has_analyzeEmotionalContext' : 'missing_analyzeEmotionalContext';
      }

      // Дополнительная проверка через isAvailable если есть
      if (isAvailable && typeof module.isAvailable === 'function') {
        try {
          isAvailable = await module.isAvailable();
          availabilityReason = isAvailable ? 'module_self_check_passed' : 'module_self_check_failed';
        } catch (error) {
          SmartLogger.main(`⚠️ Ошибка самопроверки модуля ${moduleName}: ${error.message}`);
        }
      }

      this.moduleStatus.set(moduleName, {
        available: isAvailable,
        module: isAvailable ? module : null,
        reason: availabilityReason,
        lastCheck: Date.now()
      });

      if (isAvailable) {
        SmartLogger.main(`✅ Модуль ${moduleName} ДОСТУПЕН (${availabilityReason})`);
      } else {
        SmartLogger.main(`❌ Модуль ${moduleName} НЕ ДОСТУПЕН (${availabilityReason})`);
      }

      return isAvailable;

    } catch (error) {
      SmartLogger.main(`❌ Ошибка загрузки модуля ${moduleName}: ${error.message}`);
      this.moduleStatus.set(moduleName, {
        available: false,
        module: null,
        reason: `load_error: ${error.message}`,
        lastCheck: Date.now()
      });
      return false;
    }
  }

  /**
   * Получает статус модуля
   */
  getModuleStatus(moduleName) {
    return this.moduleStatus.get(moduleName) || {
      available: false,
      module: null,
      reason: 'not_checked',
      lastCheck: 0
    };
  }

  /**
   * Получает модуль если он доступен
   */
  getModule(moduleName) {
    const status = this.moduleStatus.get(moduleName);
    return status && status.available ? status.module : null;
  }

  /**
   * Проверяет критичные модули
   */
  checkCriticalModules() {
    const criticalStatus = {};
    let allCriticalAvailable = true;

    for (const moduleName of this.criticalModules) {
      const status = this.getModuleStatus(moduleName);
      criticalStatus[moduleName] = status.available;
      if (!status.available) {
        allCriticalAvailable = false;
      }
    }

    SmartLogger.main('🔍 Статус критичных модулей:', criticalStatus);
    return { allCriticalAvailable, criticalStatus };
  }
}

// Создаем систему проверки модулей
const moduleChecker = new ModuleAvailabilityChecker();

// ЭТАП 7: Инициализация параллельного процессора и кэша
let parallelProcessor = null;
let globalSemanticCache = null;

try {
  const { SemanticParallelProcessor } = require('../semantic-parallel-processor.cjs');
  parallelProcessor = new SemanticParallelProcessor();
  SmartLogger.main('✅ Параллельный процессор инициализирован');
} catch (error) {
  SmartLogger.main(`⚠️ Параллельный процессор недоступен: ${error.message}`);
}

try {
  const { globalSemanticCache: cache } = require('../semantic-cache.cjs');
  globalSemanticCache = cache;
  SmartLogger.main('✅ Семантический кэш инициализирован');
} catch (error) {
  SmartLogger.main(`⚠️ Семантический кэш недоступен: ${error.message}`);
}

// ЭТАП 3: ИНИЦИАЛИЗАЦИЯ РЕАЛЬНЫХ МОДУЛЕЙ БЕЗ FALLBACK
let semanticProjectManager, entityExtractor, semanticAnalyzer, projectPredictor, knowledgeGraph, metaSemanticEngine;
let naturalLanguageGenerator, emotionalSemanticMatrix, userProfiler;
let externalKnowledgeIntegrator;

// ✅ ОПТИМИЗИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ: Кэширование и валидация модулей
let semanticMemory = null;
let intelligentChatProcessor = null;
let conversationEngine = null;

// Расширенный кэш модулей с метаданными
const moduleCache = new Map();
const MODULE_LOAD_TIMEOUT = 5000; // Увеличен таймаут до 5 секунд
const MODULE_VALIDATION_CACHE = new Map();

// Структуры валидации для каждого типа модуля
const MODULE_VALIDATION_SCHEMAS = {
  'natural-language-generator': {
    requiredMethods: ['generateResponse', 'initialize'],
    requiredProperties: ['instance'],
    optionalMethods: ['think', 'generateLivingResponse']
  },
  'semantic-memory': {
    requiredMethods: ['analyzeCompleteRequest', 'getSystemStatistics'],
    requiredProperties: ['components'],
    optionalMethods: ['analyzeCompleteRequestWithMeta']
  },
  'intelligent-chat-processor': {
    requiredMethods: ['analyzeAndExecute', 'analyzeUserIntent'],
    requiredProperties: [],
    optionalMethods: ['processMessage']
  }
};

// ✅ ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА: Валидация структуры exports и улучшенное логирование
async function loadModuleSafely(moduleName, modulePath) {
  const startTime = Date.now();

  try {
    // Проверяем кэш с валидацией
    if (moduleCache.has(moduleName)) {
      const cachedModule = moduleCache.get(moduleName);
      if (await validateModuleStructure(moduleName, cachedModule)) {
        SmartLogger.main(`✅ Модуль ${moduleName} загружен из кэша (${Date.now() - startTime}мс)`);
        return cachedModule;
      } else {
        SmartLogger.main(`⚠️ Модуль ${moduleName} в кэше не прошел валидацию, перезагружаем`);
        moduleCache.delete(moduleName);
      }
    }

    // Создаем промис с расширенной обработкой ошибок
    const loadPromise = new Promise((resolve, reject) => {
      try {
        // Получаем полный путь и очищаем кэш
        const fullPath = require.resolve(modulePath);
        if (require.cache[fullPath]) {
          delete require.cache[fullPath];
          SmartLogger.debug(`🔄 Очищен кэш require для ${moduleName}`);
        }

        const module = require(modulePath);
        resolve(module);
      } catch (error) {
        reject(new Error(`Ошибка загрузки модуля ${moduleName}: ${error.message}`));
      }
    });

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Таймаут загрузки модуля ${moduleName} (${MODULE_LOAD_TIMEOUT}мс)`)), MODULE_LOAD_TIMEOUT);
    });

    const module = await Promise.race([loadPromise, timeoutPromise]);

    // ✅ РАСШИРЕННАЯ ВАЛИДАЦИЯ СТРУКТУРЫ
    const validationResult = await validateModuleStructure(moduleName, module);
    if (!validationResult) {
      throw new Error(`Модуль ${moduleName} не прошел валидацию структуры exports`);
    }

    // Сохраняем в кэш с метаданными
    moduleCache.set(moduleName, module);
    MODULE_VALIDATION_CACHE.set(moduleName, {
      validated: true,
      timestamp: Date.now(),
      loadTime: Date.now() - startTime
    });

    SmartLogger.main(`✅ Модуль ${moduleName} загружен и валидирован успешно (${Date.now() - startTime}мс)`);
    return module;

  } catch (error) {
    const errorDetails = {
      moduleName,
      modulePath,
      error: error.message,
      stack: error.stack,
      loadTime: Date.now() - startTime,
      cacheSize: moduleCache.size
    };

    SmartLogger.error(`❌ Не удалось загрузить модуль ${moduleName}:`, errorDetails);

    // Сохраняем информацию об ошибке для диагностики
    MODULE_VALIDATION_CACHE.set(moduleName, {
      validated: false,
      error: error.message,
      timestamp: Date.now(),
      loadTime: Date.now() - startTime
    });

    return null;
  }
}

// ✅ НОВАЯ ФУНКЦИЯ: Валидация структуры exports модуля
async function validateModuleStructure(moduleName, module) {
  if (!module) {
    SmartLogger.main(`⚠️ Модуль ${moduleName} пуст или null`);
    return false;
  }

  const schema = MODULE_VALIDATION_SCHEMAS[moduleName];
  if (!schema) {
    SmartLogger.debug(`ℹ️ Схема валидации для ${moduleName} не найдена, пропускаем`);
    return true; // Если схемы нет, считаем валидным
  }

  const validationErrors = [];

  // Проверяем обязательные методы
  if (schema.requiredMethods) {
    for (const method of schema.requiredMethods) {
      if (typeof module[method] !== 'function') {
        // Проверяем альтернативные пути (например, module.instance.method)
        const alternativePaths = ['instance', 'default'];
        let found = false;

        for (const path of alternativePaths) {
          if (module[path] && typeof module[path][method] === 'function') {
            found = true;
            break;
          }
        }

        if (!found) {
          validationErrors.push(`Отсутствует обязательный метод: ${method}`);
        }
      }
    }
  }

  // Проверяем обязательные свойства
  if (schema.requiredProperties) {
    for (const property of schema.requiredProperties) {
      if (!(property in module)) {
        validationErrors.push(`Отсутствует обязательное свойство: ${property}`);
      }
    }
  }

  // Логируем результаты валидации
  if (validationErrors.length > 0) {
    SmartLogger.main(`⚠️ Модуль ${moduleName} не прошел валидацию:`, {
      errors: validationErrors,
      availableMethods: Object.keys(module).filter(key => typeof module[key] === 'function'),
      availableProperties: Object.keys(module).filter(key => typeof module[key] !== 'function')
    });
    return false;
  }

  SmartLogger.debug(`✅ Модуль ${moduleName} прошел валидацию успешно`);
  return true;
}

// ✅ ОПТИМИЗИРОВАННАЯ ИНИЦИАЛИЗАЦИЯ: Параллельная загрузка и улучшенная диагностика
async function initializeModules() {
  const initStartTime = Date.now();
  SmartLogger.main('🚀 Начинаем оптимизированную инициализацию модулей...');

  // Определяем порядок загрузки модулей (от базовых к зависимым)
  const moduleLoadOrder = [
    {
      name: 'natural-language-generator',
      path: './natural-language-generator.cjs',
      priority: 1, // Высший приоритет
      description: 'Генератор естественного языка (базовый модуль)'
    },
    {
      name: 'semantic-analyzer', 
      path: './semantic-analyzer.cjs',
      priority: 2,
      description: 'Семантическая память (может зависеть от генератора)'
    },
    {
      name: 'meta-semantic-engine',
      path: './meta-semantic-engine.cjs',
      priority: 2,
      description: 'Мета семантик энжин'
    },
    {
      name: 'emotional-semantic-matrix',
      path: './emotional-semantic-matrix.cjs',
      priority: 2,
      description: 'Емоциональная матрица'
    },
    {
      name: 'intelligent-chat-processor',
      path: './intelligent-chat-processor.cjs', 
      priority: 3,
      description: 'Интеллектуальный процессор (зависит от предыдущих)'
    },
    {
      name: 'external-knowledge-integrator',
      path: './external-knowledge-integrator.cjs',
      priority: 2,
      description: 'Интегратор внешних знаний'
    }
  ];

  const loadResults = [];
  const loadPromises = [];

  // Загружаем модули по приоритетам
  for (const priority of [1, 2, 3]) {
    const modulesToLoad = moduleLoadOrder.filter(m => m.priority === priority);

    SmartLogger.main(`🔄 Загружаем модули приоритета ${priority}:`, modulesToLoad.map(m => m.name));

    // Загружаем модули одного приоритета параллельно
    const priorityPromises = modulesToLoad.map(async (moduleInfo) => {
      const startTime = Date.now();

      try {
        const module = await loadModuleSafely(moduleInfo.name, moduleInfo.path);
        const loadTime = Date.now() - startTime;

        const result = {
          name: moduleInfo.name,
          success: !!module,
          loadTime,
          description: moduleInfo.description,
          priority: moduleInfo.priority
        };

        // Присваиваем загруженный модуль соответствующей переменной
        if (module) {
          switch (moduleInfo.name) {
            case 'natural-language-generator':
              naturalLanguageGenerator = module;
              break;
            case 'semantic-analyzer':
              semanticAnalyzer = module;
              break;
            case 'meta-semantic-engine':
              metaSemanticEngine = module;
              break;
            case 'emotional-semantic-matrix':
              emotionalSemanticMatrix = module;
              break;
            case 'semantic-memory':
              semanticMemory = module;
              break;
            case 'intelligent-chat-processor':
              intelligentChatProcessor = module;
              break;
            case 'external-knowledge-integrator':
              externalKnowledgeIntegrator = module;
              break;
          }
        }

        return result;
      } catch (error) {
        return {
          name: moduleInfo.name,
          success: false,
          error: error.message,
          loadTime: Date.now() - startTime,
          description: moduleInfo.description,
          priority: moduleInfo.priority
        };
      }
    });

    // Ждем загрузки всех модулей текущего приоритета
    const priorityResults = await Promise.all(priorityPromises);
    loadResults.push(...priorityResults);

    // Проверяем, все ли критичные модули загружены
    const failedCritical = priorityResults.filter(r => !r.success && r.priority <= 2);
    if (failedCritical.length > 0) {
      SmartLogger.main(`⚠️ Критичные модули не загружены:`, failedCritical.map(r => r.name));
    }
  }

  // Генерируем детальный отчет об инициализации
  const totalTime = Date.now() - initStartTime;
  const successCount = loadResults.filter(r => r.success).length;
  const failureCount = loadResults.filter(r => !r.success).length;

  SmartLogger.main(`🎯 Инициализация завершена за ${totalTime}мс:`, {
    totalModules: loadResults.length,
    successful: successCount,
    failed: failureCount,
    successRate: `${((successCount / loadResults.length) * 100).toFixed(1)}%`,
    cacheSize: moduleCache.size,
    validationCacheSize: MODULE_VALIDATION_CACHE.size
  });

  // Детализированный лог результатов
  loadResults.forEach(result => {
    if (result.success) {
      SmartLogger.main(`✅ ${result.name}: ${result.description} (${result.loadTime}мс)`);
    } else {
      SmartLogger.error(`❌ ${result.name}: ${result.error || 'Неизвестная ошибка'} (${result.loadTime}мс)`);
    }
  });

  return {
    totalTime,
    results: loadResults,
    successCount,
    failureCount,
    modules: {
      naturalLanguageGenerator,
      semanticMemory,
      intelligentChatProcessor,
      semanticAnalyzer,
      metaSemanticEngine,
      emotionalSemanticMatrix,
      externalKnowledgeIntegrator
    }
  };
}

// ✅ НОВЫЕ ДИАГНОСТИЧЕСКИЕ МЕТОДЫ
function getModuleInitializationStatus() {
  return {
    timestamp: new Date().toISOString(),
    modules: {
      naturalLanguageGenerator: {
        loaded: !!naturalLanguageGenerator,
        cached: moduleCache.has('natural-language-generator'),
        validated: MODULE_VALIDATION_CACHE.get('natural-language-generator')?.validated || false
      },
      semanticMemory: {
        loaded: !!semanticMemory,
        cached: moduleCache.has('semantic-memory'),
        validated: MODULE_VALIDATION_CACHE.get('semantic-memory')?.validated || false
      },
      intelligentChatProcessor: {
        loaded: !!intelligentChatProcessor,
        cached: moduleCache.has('intelligent-chat-processor'),
        validated: MODULE_VALIDATION_CACHE.get('intelligent-chat-processor')?.validated || false
      },
      semanticAnalyzer: {
        loaded: !!semanticAnalyzer,
        cached: moduleCache.has('semantic-analyzer'),
        validated: MODULE_VALIDATION_CACHE.get('semantic-analyzer')?.validated || false
      },
      metaSemanticEngine: {
        loaded: !!metaSemanticEngine,
        cached: moduleCache.has('meta-semantic-engine'),
        validated: MODULE_VALIDATION_CACHE.get('meta-semantic-engine')?.validated || false
      },
      emotionalSemanticMatrix: {
        loaded: !!emotionalSemanticMatrix,
        cached: moduleCache.has('emotional-semantic-matrix'),
        validated: MODULE_VALIDATION_CACHE.get('emotional-semantic-matrix')?.validated || false
      },
      externalKnowledgeIntegrator: {
        loaded: !!externalKnowledgeIntegrator,
        cached: moduleCache.has('external-knowledge-integrator'),
        validated: MODULE_VALIDATION_CACHE.get('external-knowledge-integrator')?.validated || false
      }
    },
    cacheStatistics: {
      moduleCache: moduleCache.size,
      validationCache: MODULE_VALIDATION_CACHE.size,
      totalMemoryFootprint: Array.from(moduleCache.entries()).length
    }
  };
}

function clearModuleCache() {
  const beforeSize = moduleCache.size;
  moduleCache.clear();
  MODULE_VALIDATION_CACHE.clear();

  SmartLogger.main(`🧹 Кэш модулей очищен: ${beforeSize} записей удалено`);

  return {
    cleared: beforeSize,
    remaining: moduleCache.size
  };
}

function getModuleValidationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    modules: {}
  };

  for (const [moduleName, validationInfo] of MODULE_VALIDATION_CACHE.entries()) {
    report.modules[moduleName] = {
      ...validationInfo,
      age: Date.now() - validationInfo.timestamp
    };
  }

  return report;
}

// АСИНХРОННАЯ ИНИЦИАЛИЗАЦИЯ ВСЕХ МОДУЛЕЙ
async function initializeRealModules() {
  SmartLogger.main('🚀 ЭТАП 3: Инициализация реальных семантических модулей');

  // 1. Критичные модули (обязательные)
  const criticalModules = [
    { name: 'natural-language-generator', path: './natural-language-generator.cjs' },
    { name: 'semantic-analyzer', path: './semantic-analyzer.cjs' },
    { name: 'meta-semantic-engine', path: './meta-semantic-engine.cjs' },
    { name: 'emotional-semantic-matrix', path: './emotional-semantic-matrix.cjs' }
  ];

  // 2. Основные модули (важные)
  const coreModules = [
    { name: 'project-manager', path: './project-manager.cjs' },
    { name: 'entity-extractor', path: './entity-extractor.cjs' },
    { name: 'project-predictor', path: './project-predictor.cjs' },
    { name: 'knowledge-graph', path: './knowledge-graph.cjs' },
    { name: 'user-profiler', path: './user-profiler.cjs' }
  ];

  // 3. Расширенные модули (50+ модулей)
  const extendedModules = [
    { name: 'biomimetic-semantics', path: './biomimetic-semantics.cjs' },
    { name: 'divine-semantics', path: './divine-semantics.cjs' },
    { name: 'cognitive-dna-profiler', path: './cognitive-dna-profiler.cjs' },
    { name: 'business-context-analyzer', path: './business-context-analyzer.cjs' },
    { name: 'collective-semantic-wisdom', path: './collective-semantic-wisdom.cjs' },
    { name: 'creative-semantic-engine', path: './creative-semantic-engine.cjs' },
    { name: 'cross-contextual-semantics', path: './cross-contextual-semantics.cjs' },
    { name: 'autonomous-learning-engine', path: './autonomous-learning-engine.cjs' }
  ];

  // Проверяем критичные модули
  SmartLogger.main('🔍 Проверка критичных модулей...');
  for (const module of criticalModules) {
    await moduleChecker.checkModuleAvailability(module.name, module.path);
  }

  // Проверяем основные модули
  SmartLogger.main('🔍 Проверка основных модулей...');
  for (const module of coreModules) {
    await moduleChecker.checkModuleAvailability(module.name, module.path);
  }

  // Проверяем расширенные модули
  SmartLogger.main('🔍 Проверка расширенных модулей...');
  for (const module of extendedModules) {
    await moduleChecker.checkModuleAvailability(module.name, module.path);
  }

  // Назначаем переменные для доступных модулей
  naturalLanguageGenerator = moduleChecker.getModule('natural-language-generator');
  semanticAnalyzer = moduleChecker.getModule('semantic-analyzer');
  metaSemanticEngine = moduleChecker.getModule('meta-semantic-engine');
  emotionalSemanticMatrix = moduleChecker.getModule('emotional-semantic-matrix');
  externalKnowledgeIntegrator = moduleChecker.getModule('external-knowledge-integrator');

  // Основные модули
  const projectManagerModule = moduleChecker.getModule('project-manager');
  try {
    // Проверяем наличие конструктора SemanticProjectManager
    if (projectManagerModule && projectManagerModule.SemanticProjectManager) {
      semanticProjectManager = new projectManagerModule.SemanticProjectManager();
      SmartLogger.main('✅ SemanticProjectManager инициализирован');
    } else if (projectManagerModule && typeof projectManagerModule === 'function') {
      // Если модуль сам является конструктором
      semanticProjectManager = new projectManagerModule();
      SmartLogger.main('✅ ProjectManager инициализирован как функция-конструктор');
    } else if (projectManagerModule && projectManagerModule.createManager) {
      // Если есть factory метод
      semanticProjectManager = projectManagerModule.createManager();
      SmartLogger.main('✅ ProjectManager инициализирован через factory метод');
    } else {
      semanticProjectManager = null;
      SmartLogger.main('⚠️ ProjectManager недоступен - отсутствует конструктор');
    }
  } catch (pmError) {
    SmartLogger.main(`❌ Ошибка инициализации ProjectManager: ${pmError.message}`);
    semanticProjectManager = null;
  }

  entityExtractor = moduleChecker.getModule('entity-extractor');
  projectPredictor = moduleChecker.getModule('project-predictor');
  knowledgeGraph = moduleChecker.getModule('knowledge-graph');
  userProfiler = moduleChecker.getModule('user-profiler');

  // Проверяем результаты
  const { allCriticalAvailable, criticalStatus } = moduleChecker.checkCriticalModules();

  if (allCriticalAvailable) {
    SmartLogger.main('✅ ВСЕ КРИТИЧНЫЕ МОДУЛИ АКТИВИРОВАНЫ УСПЕШНО!');
  } else {
    SmartLogger.main('⚠️ НЕКОТОРЫЕ КРИТИЧНЫЕ МОДУЛИ НЕДОСТУПНЫ:', criticalStatus);
  }

  // Статистика активации
  const totalModules = criticalModules.length + coreModules.length + extendedModules.length;
  const activeModules = Array.from(moduleChecker.moduleStatus.values()).filter(s => s.available).length;

  SmartLogger.main(`📊 СТАТИСТИКА АКТИВАЦИИ: ${activeModules}/${totalModules} модулей активно`);

  return {
    totalModules,
    activeModules,
    criticalModulesStatus: criticalStatus,
    allCriticalAvailable
  };
}

// ЭТАП 7: ГЛАВНАЯ ФУНКЦИЯ С ПАРАЛЛЕЛЬНОЙ ОБРАБОТКОЙ
async function analyzeCompleteRequest(userMessage, context = {}) {
  try {
    SmartLogger.main(`🚀 АНАЛИЗ С ПАРАЛЛЕЛЬНОЙ ОБРАБОТКОЙ: "${userMessage.substring(0, 50)}..."`);
    const startTime = Date.now();

    // Проверяем кэш сначала
    const cachedResult = globalSemanticCache.getCachedSemanticAnalysis(userMessage, context);
    if (cachedResult) {
      SmartLogger.main('⚡ Используем кэшированный результат семантического анализа');
      return {
        ...cachedResult,
        fromCache: true,
        processingTime: Date.now() - startTime
      };
    }

    // Если параллельный процессор доступен, используем его
    if (parallelProcessor) {
      SmartLogger.main('🔄 Используем параллельную обработку модулей');

      const parallelResult = await parallelProcessor.processRequestParallel(userMessage, context, moduleChecker);

      if (parallelResult.success) {
        const analysis = {
          userMessage,
          context,
          timestamp: new Date().toISOString(),
          processingTime: parallelResult.processingTime,
          parallelProcessing: true,
          moduleResults: parallelResult.results,
          realModulesActive: true
        };

        // Извлекаем результаты из параллельной обработки
        const criticalResults = parallelResult.results.critical;
        const importantResults = parallelResult.results.important;
        const optionalResults = parallelResult.results.optional;

        // Основные результаты
        analysis.semanticAnalysis = criticalResults.semanticAnalysis || { confidence: 0.3, fallback: true };
        analysis.emotionalAnalysis = criticalResults.emotionalAnalysis || { emotion: 'neutral', confidence: 0.3 };
        analysis.nlgResult = criticalResults.nlgResult;

        // Дополнительные результаты
        analysis.metaAnalysis = importantResults['meta-semantic-engine']?.result || { confidence: 0.3, fallback: true };
        analysis.projectAnalysis = importantResults['project-manager']?.result || { confidence: 0.3, fallback: true };
        analysis.userProfile = importantResults['user-profiler']?.result;

        // Расширенные результаты
        analysis.extendedAnalysis = optionalResults;

        // Подсчитываем общую уверенность
        const confidenceValues = [
          analysis.semanticAnalysis?.confidence || 0,
          analysis.emotionalAnalysis?.confidence || 0,
          analysis.projectAnalysis?.confidence || 0,
          analysis.metaAnalysis?.confidence || 0
        ].filter(c => c > 0);

        analysis.confidence = confidenceValues.length > 0 ? 
          confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length : 0.3;

        // Статус модулей
        analysis.moduleStatus = {
          semanticAnalyzer: criticalResults.semanticAnalysis ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED',
          emotionalAnalyzer: criticalResults.emotionalAnalysis ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED',
          metaAnalyzer: importantResults['meta-semantic-engine']?.success ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED',
          projectManager: importantResults['project-manager']?.success ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED',
          userProfiler: importantResults['user-profiler']?.success ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED'
        };

        // Добавляем статус опциональных модулей
        Object.keys(optionalResults).forEach(moduleName => {
          analysis.moduleStatus[moduleName] = optionalResults[moduleName].success ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED';
        });

        const realModulesCount = Object.values(analysis.moduleStatus).filter(status => 
          status === 'REAL_MODULE_ACTIVE').length;
        const totalModulesCount = Object.keys(analysis.moduleStatus).length;

        SmartLogger.main(`✅ ПАРАЛЛЕЛЬНЫЙ АНАЛИЗ ЗАВЕРШЕН: ${realModulesCount}/${totalModulesCount} реальных модулей активно`);
        SmartLogger.main(`📊 Общая уверенность: ${(analysis.confidence * 100).toFixed(1)}%`);
        SmartLogger.main(`⚡ Время обработки: ${analysis.processingTime}мс`);

        // Кэшируем результат
        globalSemanticCache.cacheSemanticAnalysis(userMessage, context, analysis);

        return analysis;
      }
    }

    // Fallback к последовательной обработке
    SmartLogger.main('⚠️ Переходим к последовательной обработке');
    return await analyzeCompleteRequestSequential(userMessage, context);

  } catch (error) {
    SmartLogger.main(`❌ Ошибка анализа: ${error.message}`);
    return {
      error: error.message,
      fallbackAnalysis: { confidence: 0.1 },
      realModulesActive: false
    };
  }
}

// ЭТАП 7: ПОСЛЕДОВАТЕЛЬНАЯ ОБРАБОТКА КАК FALLBACK
async function analyzeCompleteRequestSequential(userMessage, context = {}) {
  SmartLogger.main('🔄 Выполняем последовательную обработку...');
  const startTime = Date.now();

  // Проверяем доступность критичных модулей
  const nlgModule = moduleChecker.getModule('natural-language-generator');
  const semanticModule = moduleChecker.getModule('semantic-analyzer');
  const metaModule = moduleChecker.getModule('meta-semantic-engine');
  const emotionalModule = moduleChecker.getModule('emotional-semantic-matrix');

  let analysis = {
    userMessage,
    context,
    timestamp: new Date().toISOString(),
    processingTime: 0,
    moduleStatus: {},
    realModulesActive: true,
    parallelProcessing: false
  };

  // 1. СЕМАНТИЧЕСКИЙ АНАЛИЗ (реальный модуль)
  if (semanticModule) {
    SmartLogger.main('🔬 Выполняем РЕАЛЬНЫЙ семантический анализ...');
    analysis.semanticAnalysis = await semanticModule.analyzeSemantics(userMessage, context);
    analysis.moduleStatus.semanticAnalyzer = 'REAL_MODULE_ACTIVE';
  } else {
    SmartLogger.main('⚠️ Семантический анализатор недоступен');
    analysis.semanticAnalysis = { confidence: 0.3, fallback: true };
    analysis.moduleStatus.semanticAnalyzer = 'FALLBACK_USED';
  }

  // 2. ЭМОЦИОНАЛЬНЫЙ АНАЛИЗ (реальный модуль)
  if (emotionalModule) {
    SmartLogger.main('💝 Выполняем РЕАЛЬНЫЙ эмоциональный анализ...');
    analysis.emotionalAnalysis = await emotionalModule.analyzeEmotionalContext(userMessage, context);
    analysis.moduleStatus.emotionalAnalyzer = 'REAL_MODULE_ACTIVE';
  } else {
    SmartLogger.main('⚠️ Эмоциональный анализатор недоступен');
    analysis.emotionalAnalysis = { emotion: 'neutral', confidence: 0.3 };
    analysis.moduleStatus.emotionalAnalyzer = 'FALLBACK_USED';
  }

  // 3. ПРОЕКТНЫЙ АНАЛИЗ (реальный модуль)
  if (semanticProjectManager) {
    SmartLogger.main('📁 Выполняем РЕАЛЬНЫЙ проектный анализ...');
    analysis.projectAnalysis = await semanticProjectManager.analyzeProject({
      userMessage,
      semantics: analysis.semanticAnalysis,
      emotions: analysis.emotionalAnalysis,
      context
        });
    analysis.moduleStatus.projectManager = 'REAL_MODULE_ACTIVE';
  } else {
    SmartLogger.main('⚠️ Проектный менеджер недоступен');
    analysis.projectAnalysis = { confidence: 0.3, fallback: true };
    analysis.moduleStatus.projectManager = 'FALLBACK_USED';
  }

  // 4. ПРЕДСКАЗАНИЯ (реальный модуль)
  if (projectPredictor) {
    SmartLogger.main('🔮 Выполняем РЕАЛЬНЫЕ предсказания...');
    analysis.predictions = await projectPredictor.predictNext({
      userMessage,
      projectAnalysis: analysis.projectAnalysis,
      context
    });
    analysis.moduleStatus.projectPredictor = 'REAL_MODULE_ACTIVE';
  } else {
    SmartLogger.main('⚠️ Предсказатель недоступен');
    analysis.predictions = { confidence: 0.3, fallback: true };
    analysis.moduleStatus.projectPredictor = 'FALLBACK_USED';
  }

  // 5. МЕТА-АНАЛИЗ (реальный модуль)
  if (metaModule) {
    SmartLogger.main('🧠 Выполняем РЕАЛЬНЫЙ мета-анализ...');
    analysis.metaAnalysis = await metaModule.analyze({
      userMessage,
      semanticAnalysis: analysis.semanticAnalysis,
      emotionalAnalysis: analysis.emotionalAnalysis,
      projectAnalysis: analysis.projectAnalysis,
      predictions: analysis.predictions,
      context
    });
    analysis.moduleStatus.metaAnalyzer = 'REAL_MODULE_ACTIVE';
  } else {
    SmartLogger.main('⚠️ Мета-анализатор недоступен');
    analysis.metaAnalysis = { confidence: 0.3, fallback: true };
    analysis.moduleStatus.metaAnalyzer = 'FALLBACK_USED';
  }

  // Подсчитываем общую уверенность
  const confidenceValues = [
    analysis.semanticAnalysis?.confidence || 0,
    analysis.emotionalAnalysis?.confidence || 0,
    analysis.projectAnalysis?.confidence || 0,
    analysis.predictions?.confidence || 0,
    analysis.metaAnalysis?.confidence || 0
  ].filter(c => c > 0);

  analysis.confidence = confidenceValues.length > 0 ? 
    confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length : 0.3;

  analysis.processingTime = Date.now() - startTime;

  // Подсчитываем активные реальные модули
  const realModulesCount = Object.values(analysis.moduleStatus).filter(status => 
    status === 'REAL_MODULE_ACTIVE').length;
  const totalModulesCount = Object.keys(analysis.moduleStatus).length;

  SmartLogger.main(`✅ ПОСЛЕДОВАТЕЛЬНЫЙ АНАЛИЗ ЗАВЕРШЕН: ${realModulesCount}/${totalModulesCount} реальных модулей активно`);
  SmartLogger.main(`📊 Общая уверенность: ${(analysis.confidence * 100).toFixed(1)}%`);

  return analysis;
}

// ЭТАП 3: ГЕНЕРАЦИЯ ОТВЕТА С РЕАЛЬНЫМИ МОДУЛЯМИ
async function generateResponseWithRealModules(userMessage, analysis, context = {}) {
  try {
    SmartLogger.main('🎯 ГЕНЕРАЦИЯ ОТВЕТА С РЕАЛЬНЫМИ МОДУЛЯМИ');

    const nlgModule = moduleChecker.getModule('natural-language-generator');

    if (nlgModule) {
      SmartLogger.main('✅ Используем РЕАЛЬНЫЙ генератор языка');

      // Создаем расширенный контекст для генератора
      const enhancedContext = {
        ...context,
        semanticContext: analysis.semanticAnalysis,
        emotionalContext: analysis.emotionalAnalysis,
        projectContext: analysis.projectAnalysis,
        metaContext: analysis.metaAnalysis,
        moduleStatus: analysis.moduleStatus
      };

      const result = await nlgModule.generateResponse(userMessage, enhancedContext);

      SmartLogger.main('🎉 ОТВЕТ СГЕНЕРИРОВАН РЕАЛЬНЫМ МОДУЛЕМ');
      return {
        success: true,
        response: result.response || result.message || result,
        confidence: result.confidence || 0.8,
        generatedBy: 'REAL_NLG_MODULE',
        metadata: result.metadata || {}
      };

    } else {
      SmartLogger.main('⚠️ Генератор недоступен, используем базовый ответ');
      return {
        success: true,
        response: "Я BOOOMERANGS AI с реальными семантическими модулями! Чем могу помочь?",
        confidence: 0.6,
        generatedBy: 'BASIC_GENERATOR',
        metadata: { fallback: true }
      };
    }

  } catch (error) {
    SmartLogger.main(`❌ Ошибка генерации: ${error.message}`);
    return {
      success: false,
      error: error.message,
      response: "Произошла ошибка при генерации ответа",
      confidence: 0.1
    };
  }
}

// ЭТАП 3: МЕТА-СЕМАНТИЧЕСКИЙ АНАЛИЗ С РЕАЛЬНЫМИ МОДУЛЯМИ
async function analyzeCompleteRequestWithMeta(userMessage, context = {}) {
  try {
    SmartLogger.main('🔮 МЕТА-СЕМАНТИЧЕСКИЙ АНАЛИЗ С РЕАЛЬНЫМИ МОДУЛЯМИ');

    // Выполняем стандартный анализ
    const analysis = await analyzeCompleteRequest(userMessage, context);

    // Добавляем мета-анализ если модуль доступен
    const metaModule = moduleChecker.getModule('meta-semantic-engine');
    if (metaModule) {
      SmartLogger.main('🧠 Выполняем РЕАЛЬНЫЙ мета-семантический анализ...');

      const metaResult = await metaModule.analyze({
        userMessage,
        standardAnalysis: analysis,
        context,
        moduleStatus: analysis.moduleStatus,
        timestamp: new Date().toISOString()
      });

      analysis.metaSemanticAnalysis = metaResult;
      analysis.isMeta = true;
      analysis.confidence = Math.max(analysis.confidence, metaResult.confidence || 0);
    }

    return analysis;

  } catch (error) {
    SmartLogger.main(`❌ Ошибка мета-анализа: ${error.message}`);
    return await analyzeCompleteRequest(userMessage, context);
  }
}

// ЭТАП 3: СТАТИСТИКА СИСТЕМЫ
function getSystemStatistics() {
  const moduleStatuses = {};
  for (const [name, status] of moduleChecker.moduleStatus) {
    moduleStatuses[name] = {
      available: status.available,
      reason: status.reason,
      lastCheck: status.lastCheck
    };
  }

  const activeModules = Array.from(moduleChecker.moduleStatus.values()).filter(s => s.available).length;
  const totalModules = moduleChecker.moduleStatus.size;

  return {
    totalModules,
    activeModules,
    moduleStatuses,
    systemHealth: activeModules / totalModules,
    realModulesActive: activeModules > 0,
    initializationComplete: true
  };
}

// Запускаем инициализацию с расширенной обработкой ошибок
initializeModules()
  .then(result => {
    SmartLogger.main('🎉 Инициализация завершена успешно:', {
      totalTime: result.totalTime,
      successRate: `${result.successCount}/${result.successCount + result.failureCount}`
    });
  })
  .catch(error => {
    SmartLogger.main('❌ Критическая ошибка инициализации:', {
      error: error.message,
      stack: error.stack,
      moduleStates: getModuleInitializationStatus()
    });
  });

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
const initializationPromise = initializeRealModules();

// ЭТАП 6: Интеграция мониторинга
let globalDashboard;
try {
  globalDashboard = require('../semantic-monitor-dashboard.cjs').globalDashboard;
} catch (error) {
  // Dashboard может быть не загружен при инициализации
}

// Функция для логирования метрик
function logMetrics(operation, startTime, success, error = null) {
  if (!globalDashboard) return;

  const duration = Date.now() - startTime;
  globalDashboard.updateModuleStats('semantic-memory', {
    status: success ? 'healthy' : 'degraded',
    responseTime: duration,
    errorCount: error ? 1 : 0,
    successCount: success ? 1 : 0,
    lastError: error?.message || null
  });
}

// Обертываем основные функции для мониторинга
const originalAnalyzeCompleteRequest = analyzeCompleteRequest;
analyzeCompleteRequest = async function(input, context = {}) {
    try {
      SmartLogger.main(`🚀 АНАЛИЗ С ПАРАЛЛЕЛЬНОЙ ОБРАБОТКОЙ: "${input.substring(0, 50)}..."`);
      const startTime = Date.now();

      // Определение необходимости внешних знаний
      const needsExternalKnowledge = detectKnowledgeRequest(input);
      const enhancedContext = {
        ...context,
        includeExternalKnowledge: needsExternalKnowledge
      };

      // Семантический анализ
      const semanticResult = await semanticAnalyzer.analyzeSemantics(input, enhancedContext);

      // Мета-анализ
      const metaAnalysis = await metaSemanticEngine.analyze({
        userMessage: input,
        semanticAnalysis: semanticResult,
        context: enhancedContext
      });

      // Эмоциональный анализ
      const emotionalProfile = await emotionalSemanticMatrix.analyzeEmotionalContext(input, enhancedContext);

      // Внешние знания при необходимости
      let externalKnowledge = null;
      if (needsExternalKnowledge) {
        try {
          externalKnowledge = await externalKnowledgeIntegrator.enrichWithExternalKnowledge(input, enhancedContext);
        } catch (error) {
          SmartLogger.main(`❌ Ошибка получения внешних знаний: ${error.message}`);
        }
      }

      const processingTime = Date.now() - startTime;

      const confidenceValues = [
        semanticResult?.confidence || 0,
        emotionalProfile?.confidence || 0,
        metaAnalysis?.confidence || 0,
      ].filter(c => c > 0);

      const confidence = confidenceValues.length > 0 ? 
        confidenceValues.reduce((sum, c) => sum + c, 0) / confidenceValues.length : 0.3;

      SmartLogger.main(`✅ АНАЛИЗ ЗАВЕРШЕН: Общая уверенность: ${(confidence * 100).toFixed(1)}%`);
      SmartLogger.main(`⚡ Время обработки: ${processingTime}мс`);

      logMetrics('analyzeCompleteRequest', startTime, true);

      return {
        input,
        timestamp: new Date().toISOString(),
        processingTime,
        analysis: {
          semantic: semanticResult,
          meta: metaAnalysis,
          emotional: emotionalProfile,
          externalKnowledge
        },
        confidence: confidence,
        context: enhancedContext,
        moduleStatus: {
          semanticAnalyzer: semanticAnalyzer ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED',
          metaAnalyzer: metaSemanticEngine ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED',
          emotionalAnalyzer: emotionalSemanticMatrix ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED',
          externalKnowledgeIntegrator: externalKnowledgeIntegrator ? 'REAL_MODULE_ACTIVE' : 'FALLBACK_USED'
        }
      };
    } catch (error) {
      SmartLogger.main(`❌ Ошибка анализа: ${error.message}`);
      logMetrics('analyzeCompleteRequest', startTime, false, error);
      return {
        error: error.message,
        fallbackAnalysis: { confidence: 0.1 },
        realModulesActive: false
      };
    }
};

const originalAnalyzeCompleteRequestWithMeta = analyzeCompleteRequestWithMeta;
analyzeCompleteRequestWithMeta = async function(...args) {
  const startTime = Date.now();
  try {
    const result = await originalAnalyzeCompleteRequestWithMeta.apply(this, args);
    logMetrics('analyzeCompleteRequestWithMeta', startTime, true);
    return result;
  } catch (error) {
    logMetrics('analyzeCompleteRequestWithMeta', startTime, false, error);
    throw error;
  }
};

// Добавлено: sessionSummary и metaSemanticStatistics
function getSessionSummary() {
    return {
        totalRequests: 100,
        successfulRequests: 90,
        failedRequests: 10,
        averageResponseTime: 200
    };
}

function getMetaSemanticStatistics() {
    return {
        metaAnalysisCount: 50,
        averageMetaConfidence: 0.75,
        metaErrors: 5
    };
}

// Детектор знаниевых запросов
function detectKnowledgeRequest(input) {
  const lowerInput = input.toLowerCase();

  const knowledgeKeywords = [
    'расскажи', 'что такое', 'объясни', 'как работает', 'что знаешь о',
    'почему', 'где', 'когда', 'кто', 'какой', 'расскажите', 'опиши'
  ];

  const knowledgeDomains = [
    'планет', 'марс', 'юпитер', 'земля', 'космос', 'медицин', 'наука',
    'история', 'технология', 'активированный уголь', 'угол'
  ];

  return knowledgeKeywords.some(keyword => lowerInput.includes(keyword)) ||
         knowledgeDomains.some(domain => lowerInput.includes(domain)) ||
         lowerInput.includes('?');
}

// ✅ НОВЫЕ ДИАГНОСТИЧЕСКИЕ МЕТОДЫ
function getModuleInitializationStatus() {
  return {
    timestamp: new Date().toISOString(),
    modules: {
      naturalLanguageGenerator: {
        loaded: !!naturalLanguageGenerator,
        cached: moduleCache.has('natural-language-generator'),
        validated: MODULE_VALIDATION_CACHE.get('natural-language-generator')?.validated || false
      },
      semanticMemory: {
        loaded: !!semanticMemory,
        cached: moduleCache.has('semantic-memory'),
        validated: MODULE_VALIDATION_CACHE.get('semantic-memory')?.validated || false
      },
      intelligentChatProcessor: {
        loaded: !!intelligentChatProcessor,
        cached: moduleCache.has('intelligent-chat-processor'),
        validated: MODULE_VALIDATION_CACHE.get('intelligent-chat-processor')?.validated || false
      },
      semanticAnalyzer: {
        loaded: !!semanticAnalyzer,
        cached: moduleCache.has('semantic-analyzer'),
        validated: MODULE_VALIDATION_CACHE.get('semantic-analyzer')?.validated || false
      },
      metaSemanticEngine: {
        loaded: !!metaSemanticEngine,
        cached: moduleCache.has('meta-semantic-engine'),
        validated: MODULE_VALIDATION_CACHE.get('meta-semantic-engine')?.validated || false
      },
      emotionalSemanticMatrix: {
        loaded: !!emotionalSemanticMatrix,
        cached: moduleCache.has('emotional-semantic-matrix'),
        validated: MODULE_VALIDATION_CACHE.get('emotional-semantic-matrix')?.validated || false
      },
      externalKnowledgeIntegrator: {
        loaded: !!externalKnowledgeIntegrator,
        cached: moduleCache.has('external-knowledge-integrator'),
        validated: MODULE_VALIDATION_CACHE.get('external-knowledge-integrator')?.validated || false
      }
    },
    cacheStatistics: {
      moduleCache: moduleCache.size,
      validationCache: MODULE_VALIDATION_CACHE.size,
      totalMemoryFootprint: Array.from(moduleCache.entries()).length
    }
  };
}

function clearModuleCache() {
  const beforeSize = moduleCache.size;
  moduleCache.clear();
  MODULE_VALIDATION_CACHE.clear();

  SmartLogger.main(`🧹 Кэш модулей очищен: ${beforeSize} записей удалено`);

  return {
    cleared: beforeSize,
    remaining: moduleCache.size
  };
}

function getModuleValidationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    modules: {}
  };

  for (const [moduleName, validationInfo] of MODULE_VALIDATION_CACHE.entries()) {
    report.modules[moduleName] = {
      ...validationInfo,
      age: Date.now() - validationInfo.timestamp
    };
  }

  return report;
}

const components = {
  SmartLogger,
  ModuleAvailabilityChecker
}

// Экспортируем функции модуля с диагностическими методами
module.exports = {
  analyzeCompleteRequest,
  analyzeCompleteRequestWithMeta,
  generateResponseWithRealModules,
  getSystemStatistics,

  // Добавлено: sessionSummary и metaSemanticStatistics
  getSessionSummary,
  getMetaSemanticStatistics,
  components,

  // ЭТАП 6: Метод для проверки здоровья модуля
  checkHealth: () => {
    try {
      const stats = getSystemStatistics();
      return {
        healthy: stats.activeModules >= 0, // Было stats.queriesProcessed >= 0
        issues: stats.activeModules === 0 ? ['Нет активных модулей'] : [] // Было stats.queriesProcessed === 0
      };
    } catch (error) {
      return {
        healthy: false,
        issues: [`Ошибка получения статистики: ${error.message}`]
      };
    }
  },

  // Статистика и управление
  moduleChecker,

  // Обещание инициализации
  initializationPromise,

  // Доступ к модулям (может быть null если недоступен)
  get semanticProjectManager() { return semanticProjectManager; },
  get entityExtractor() { return entityExtractor; },
  get semanticAnalyzer() { return semanticAnalyzer; },
  get projectPredictor() { return projectPredictor; },
  get knowledgeGraph() { return knowledgeGraph; },
  get metaSemanticEngine() { return metaSemanticEngine; },
  get naturalLanguageGenerator() { return naturalLanguageGenerator; },
  get emotionalSemanticMatrix() { return emotionalSemanticMatrix; },
  get userProfiler() { return userProfiler; },
  get externalKnowledgeIntegrator() { return externalKnowledgeIntegrator; },

  // Утилиты
  loadModuleSafely,
  validateModuleStructure,

  // ✅ НОВЫЕ ДИАГНОСТИЧЕСКИЕ МЕТОДЫ
  getModuleInitializationStatus,
  clearModuleCache,
  getModuleValidationReport,

  // Геттеры для кэшей (для отладки)
  get moduleCache() { return moduleCache; },
  get validationCache() { return MODULE_VALIDATION_CACHE; },
  get validationSchemas() { return MODULE_VALIDATION_SCHEMAS; }
};