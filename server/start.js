#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Запуск EventTickets сервера...\n');

// Проверяем наличие node_modules
const nodeModulesPath = path.join(__dirname, 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
    console.log('📦 Установка зависимостей...');
    const npmInstall = spawn('npm', ['install'], {
        cwd: __dirname,
        stdio: 'inherit',
        shell: true
    });
    
    npmInstall.on('close', (code) => {
        if (code === 0) {
            console.log('✅ Зависимости установлены\n');
            startServer();
        } else {
            console.error('❌ Ошибка установки зависимостей');
            process.exit(1);
        }
    });
} else {
    startServer();
}

function startServer() {
    console.log('🔧 Инициализация базы данных...');
    
    // Запускаем инициализацию БД
    const initDb = spawn('node', ['scripts/init-db.js'], {
        cwd: __dirname,
        stdio: 'inherit'
    });
    
    initDb.on('close', (code) => {
        if (code === 0) {
            console.log('✅ База данных инициализирована\n');
            
            console.log('🌐 Запуск веб-сервера...');
            
            // Запускаем основной сервер
            const server = spawn('node', ['server.js'], {
                cwd: __dirname,
                stdio: 'inherit'
            });
            
            server.on('close', (code) => {
                console.log(`Сервер завершил работу с кодом ${code}`);
            });
            
            // Обработка сигналов для корректного завершения
            process.on('SIGINT', () => {
                console.log('\n🛑 Получен сигнал завершения...');
                server.kill('SIGINT');
                process.exit(0);
            });
            
        } else {
            console.error('❌ Ошибка инициализации базы данных');
            process.exit(1);
        }
    });
}