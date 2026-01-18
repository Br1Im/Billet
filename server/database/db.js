const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Путь к базе данных
const DB_PATH = path.join(__dirname, 'eventtickets.db');

// Создание подключения к базе данных
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Ошибка подключения к базе данных:', err.message);
    } else {
        console.log('✅ Подключение к SQLite базе данных установлено');
    }
});

// Включаем поддержку внешних ключей
db.run('PRAGMA foreign_keys = ON');

// Создание таблиц
const createTables = async () => {
    return new Promise((resolve, reject) => {
        db.serialize(() => {
            // Таблица пользователей (админов)
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'admin',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME
                )
            `);

            // Таблица мероприятий
            db.run(`
                CREATE TABLE IF NOT EXISTS events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title_ru TEXT NOT NULL,
                    title_fr TEXT NOT NULL,
                    description_ru TEXT,
                    description_fr TEXT,
                    date DATE NOT NULL,
                    time TIME NOT NULL,
                    location_ru TEXT NOT NULL,
                    location_fr TEXT NOT NULL,
                    category TEXT DEFAULT 'other',
                    image TEXT DEFAULT '🎪',
                    status TEXT DEFAULT 'active',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Таблица типов билетов
            db.run(`
                CREATE TABLE IF NOT EXISTS ticket_types (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_id INTEGER NOT NULL,
                    name_ru TEXT NOT NULL,
                    name_fr TEXT NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    quantity_available INTEGER DEFAULT -1,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES events (id) ON DELETE CASCADE
                )
            `);

            // Таблица заказов
            db.run(`
                CREATE TABLE IF NOT EXISTS orders (
                    id TEXT PRIMARY KEY,
                    event_id INTEGER NOT NULL,
                    customer_name TEXT NOT NULL,
                    customer_email TEXT NOT NULL,
                    customer_phone TEXT NOT NULL,
                    total_amount DECIMAL(10,2) NOT NULL,
                    payment_method TEXT NOT NULL,
                    status TEXT DEFAULT 'PENDING',
                    language TEXT DEFAULT 'ru',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (event_id) REFERENCES events (id)
                )
            `);

            // Таблица элементов заказа
            db.run(`
                CREATE TABLE IF NOT EXISTS order_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT NOT NULL,
                    ticket_type_id INTEGER NOT NULL,
                    quantity INTEGER NOT NULL,
                    price DECIMAL(10,2) NOT NULL,
                    subtotal DECIMAL(10,2) NOT NULL,
                    FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
                    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id)
                )
            `);

            // Таблица настроек
            db.run(`
                CREATE TABLE IF NOT EXISTS settings (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Таблица входа гостей
            db.run(`
                CREATE TABLE IF NOT EXISTS guest_checkins (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    order_id TEXT NOT NULL,
                    checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    checked_in_by TEXT,
                    FOREIGN KEY (order_id) REFERENCES orders (id)
                )
            `, (err) => {
                if (err) {
                    console.error('Ошибка создания таблиц:', err);
                    reject(err);
                } else {
                    console.log('✅ Таблицы базы данных созданы/проверены');
                    resolve();
                }
            });
        });
    });
};

// Инициализация базы данных
const initializeDatabase = async () => {
    try {
        // Сначала создаем таблицы
        await createTables();
        
        // Затем создаем админа по умолчанию
        const bcrypt = require('bcryptjs');
        const defaultPassword = bcrypt.hashSync('admin123', 10);
        
        db.run(`
            INSERT OR IGNORE INTO users (username, password_hash, role) 
            VALUES (?, ?, ?)
        `, ['admin', defaultPassword, 'admin'], (err) => {
            if (err) {
                console.error('Ошибка создания админа по умолчанию:', err);
            } else {
                console.log('✅ Админ по умолчанию создан (admin/admin123)');
            }
        });

        // Добавляем базовые настройки
        const defaultSettings = [
            ['siteName', 'EventTickets'],
            ['bankName', 'Сбербанк России'],
            ['bankIban', 'RU1234567890123456789012'],
            ['bankBic', 'SBERRU2P'],
            ['bankRecipient', 'ООО «EventTickets»'],
            ['contactEmail', 'info@eventtickets.com'],
            ['contactPhone', '+7 (999) 123-45-67']
        ];

        defaultSettings.forEach(([key, value]) => {
            db.run(`
                INSERT OR IGNORE INTO settings (key, value) 
                VALUES (?, ?)
            `, [key, value]);
        });

        console.log('✅ Базовые настройки добавлены');
    } catch (error) {
        console.error('Ошибка инициализации базы данных:', error);
    }
};

// Функции для работы с базой данных
const dbHelpers = {
    // Выполнить запрос
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    },

    // Получить одну запись
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    },

    // Получить все записи
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    },

    // Закрыть соединение
    close: () => {
        return new Promise((resolve, reject) => {
            db.close((err) => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }
};

// Инициализируем базу данных при загрузке модуля
initializeDatabase();

module.exports = { db, dbHelpers };