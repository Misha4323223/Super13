/**
 * Простой скрипт для запуска сервера разработки
 * Обходит проблемы с workflow и запускает сервер напрямую
 */

const { spawn } = require('child_process');

console.log('🚀 Запуск сервера разработки...');

// Запускаем основной сервер
const mainServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

mainServer.on('error', (error) => {
  console.error('❌ Ошибка запуска основного сервера:', error);
});

mainServer.on('close', (code) => {
  console.log(`⚠️ Основной сервер завершен с кодом ${code}`);
});

// Обработка завершения процесса
process.on('SIGINT', () => {
  console.log('\n🛑 Остановка серверов...');
  mainServer.kill();
  process.exit(0);
});

console.log('✅ Серверы запущены. Нажмите Ctrl+C для остановки.');