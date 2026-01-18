const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Импорт маршрутов
const { router: authRoutes, authenticateToken } = require('./routes/auth');
const eventsRoutes = require('./routes/events');
const ordersRoutes = require('./routes/orders');
const settingsRoutes = require('./routes/settings');

// Инициализация приложения
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware безопасности
app.use(helmet({
    contentSecurityPolicy: false, // Отключаем для разработки
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов с одного IP
    message: 'Слишком много запросов с этого IP, попробуйте позже.'
});
app.use('/api/', limiter);

// CORS
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8080',
    'https://eventtickets.onrender.com',
    'https://eventtickets-*.onrender.com'
];

app.use(cors({
    origin: function(origin, callback) {
        // Разрешаем запросы без origin (например, мобильные приложения или curl)
        if (!origin) return callback(null, true);
        
        // Проверяем, разрешен ли origin
        if (allowedOrigins.some(allowed => {
            if (allowed.includes('*')) {
                const pattern = allowed.replace('*', '.*');
                return new RegExp(pattern).test(origin);
            }
            return allowed === origin;
        })) {
            callback(null, true);
        } else {
            callback(null, true); // В продакшене можно ограничить
        }
    },
    credentials: true
}));

// Парсинг JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Статические файлы (фронтенд)
app.use(express.static(path.join(__dirname, '../')));

// API маршруты
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/settings', settingsRoutes);

// Главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Админ-панель
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin.html'));
});

// API статус
app.get('/api/status', (req, res) => {
    res.json({
        status: 'OK',
        message: 'EventTickets API работает',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Обработка 404
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API endpoint не найден' });
    } else {
        res.status(404).sendFile(path.join(__dirname, '../index.html'));
    }
});

// Обработка ошибок
app.use((err, req, res, next) => {
    console.error('Ошибка сервера:', err);
    res.status(500).json({
        error: 'Внутренняя ошибка сервера',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Что-то пошло не так'
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер EventTickets запущен на порту ${PORT}`);
    console.log(`📱 Клиентская часть: http://localhost:${PORT}`);
    console.log(`🔧 Админ-панель: http://localhost:${PORT}/admin`);
    console.log(`🔌 API: http://localhost:${PORT}/api/status`);
});

module.exports = app;