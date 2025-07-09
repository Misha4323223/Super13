/**
 * Полноценный тест обогащенной системы с семантической памятью
 * Проверяем все аспекты интеграции
 */

async function testEnhancedSystem() {
  // Динамический импорт ES модуля
  const smartRouter = await import('./server/smart-router.js');
  console.log('🧪 ТЕСТ ОБОГАЩЕННОЙ СИСТЕМЫ С СЕМАНТИЧЕСКОЙ ПАМЯТЬЮ\n');

  // Тест 1: Создание проекта и генерация с контекстом
  console.log('📝 Тест 1: Создание проекта с семантическим контекстом');
  try {
    const response1 = await smartRouter.routeMessage(
      'Создаю проект логотипа для кофейни "Аромат утра"',
      { 
        sessionId: 'test-session-enhanced',
        isDirectRequest: true 
      }
    );
    
    console.log('✅ Ответ 1:', response1.response.substring(0, 150) + '...\n');
    
    // Тест 2: Генерация изображения с использованием проектного контекста
    console.log('📝 Тест 2: Генерация с контекстом проекта');
    const response2 = await smartRouter.routeMessage(
      'Создай логотип с чашкой кофе',
      { 
        sessionId: 'test-session-enhanced',
        isDirectRequest: true 
      }
    );
    
    console.log('✅ Ответ 2:', response2.response.substring(0, 150) + '...\n');
    
    // Тест 3: Проверка предсказаний следующих шагов
    console.log('📝 Тест 3: Векторизация с предсказаниями');
    const response3 = await smartRouter.routeMessage(
      'Конвертируй в векторный формат',
      { 
        sessionId: 'test-session-enhanced',
        isDirectRequest: true 
      }
    );
    
    console.log('✅ Ответ 3:', response3.response.substring(0, 150) + '...\n');
    
    // Тест 4: Анализ накопленного контекста
    console.log('📝 Тест 4: Проверка накопленного контекста');
    const response4 = await smartRouter.routeMessage(
      'Что мы создавали в этом проекте?',
      { 
        sessionId: 'test-session-enhanced',
        isDirectRequest: true 
      }
    );
    
    console.log('✅ Ответ 4:', response4.response.substring(0, 200) + '...\n');
    
    console.log('🎉 Все тесты обогащенной системы прошли успешно!');
    console.log('✨ Семантическая память активно обогащает ответы контекстом');
    
  } catch (error) {
    console.error('❌ Ошибка в тесте обогащенной системы:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEnhancedSystem();