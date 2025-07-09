/**
 * Тест исправленной семантической системы
 * Проверяет что система теперь использует conversation-engine для ChatGPT-уровня
 */

const conversationEngine = require('./server/conversation-engine.cjs');

async function testFixedSemanticSystem() {
  console.log('🎯 ТЕСТ ИСПРАВЛЕННОЙ СЕМАНТИЧЕСКОЙ СИСТЕМЫ');
  console.log('=' .repeat(60));

  const testCases = [
    {
      name: 'ТЕСТ 1: Простой вопрос',
      input: 'Расскажи о гравитации',
      expected: 'Должен дать конкретный ответ о гравитации, а не общие фразы'
    },
    {
      name: 'ТЕСТ 2: Вопрос о возможностях',
      input: 'Что ты умеешь',
      expected: 'Должен дать персонализированный ответ о BOOOMERANGS'
    },
    {
      name: 'ТЕСТ 3: Технический вопрос',
      input: 'Как работает машинное обучение',
      expected: 'Должен дать техническое объяснение'
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🧪 ${testCase.name}`);
    console.log(`📝 Вопрос: "${testCase.input}"`);
    console.log(`🎯 Ожидается: ${testCase.expected}`);
    
    try {
      const startTime = Date.now();
      const result = await conversationEngine.processUserInput(testCase.input, {
        userId: 'test_user',
        sessionId: 'test_session'
      });
      
      const processingTime = Date.now() - startTime;
      
      console.log(`\n✅ РЕЗУЛЬТАТ (${processingTime}мс):`);
      console.log(`🤖 Ответ: "${result.reply?.substring(0, 200)}${result.reply?.length > 200 ? '...' : ''}"`);
      console.log(`📊 Уверенность: ${result.confidence}`);
      console.log(`🎯 Качество: ${result.quality}`);
      
      // Проверяем, что это НЕ fallback ответ
      const isFallback = result.reply?.includes('Хороший вопрос!') || 
                        result.reply?.includes('О чем конкретно') ||
                        result.reply?.includes('Готов обсудить что угодно');
      
      if (isFallback) {
        console.log('❌ ПРОБЛЕМА: Система все еще использует fallback ответы!');
      } else {
        console.log('✅ УСПЕХ: Система генерирует персонализированные ответы!');
      }
      
    } catch (error) {
      console.error(`❌ ОШИБКА: ${error.message}`);
    }
    
    console.log('─'.repeat(60));
  }
  
  console.log('\n🎉 ТЕСТ ЗАВЕРШЕН');
}

// Запуск теста
testFixedSemanticSystem()
  .then(() => {
    console.log('\n🏁 ВСЕ ТЕСТЫ ВЫПОЛНЕНЫ');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 КРИТИЧЕСКАЯ ОШИБКА ТЕСТА:', error);
    process.exit(1);
  });