const { dbHelpers } = require('../database/db');
const bcrypt = require('bcryptjs');

async function initializeDatabase() {
    try {
        console.log('🔄 Инициализация базы данных...');

        // Ждем немного, чтобы таблицы успели создаться
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Добавляем тестовые мероприятия
        const testEvents = [
            {
                title_ru: 'Концерт классической музыки',
                title_fr: 'Concert de musique classique',
                description_ru: 'Вечер классической музыки с произведениями Чайковского и Рахманинова в исполнении симфонического оркестра.',
                description_fr: 'Soirée de musique classique avec des œuvres de Tchaïkovski et Rachmaninov interprétées par l\'orchestre symphonique.',
                date: '2025-02-15',
                time: '19:00',
                location_ru: 'Концертный зал «Филармония»',
                location_fr: 'Salle de concert «Philharmonie»',
                category: 'music',
                image: '🎼',
                tickets: [
                    { name_ru: 'Взрослый', name_fr: 'Adulte', price: 2500 },
                    { name_ru: 'Студенческий', name_fr: 'Étudiant', price: 1500 },
                    { name_ru: 'Детский', name_fr: 'Enfant', price: 1000 }
                ]
            },
            {
                title_ru: 'Театральная постановка «Гамлет»',
                title_fr: 'Représentation théâtrale «Hamlet»',
                description_ru: 'Классическая трагедия Шекспира в современной интерпретации. Режиссер - лауреат премии «Золотая маска».',
                description_fr: 'La tragédie classique de Shakespeare dans une interprétation moderne. Mise en scène par un lauréat du prix «Masque d\'Or».',
                date: '2025-02-20',
                time: '18:30',
                location_ru: 'Драматический театр',
                location_fr: 'Théâtre dramatique',
                category: 'theater',
                image: '🎭',
                tickets: [
                    { name_ru: 'Партер', name_fr: 'Parterre', price: 3000 },
                    { name_ru: 'Амфитеатр', name_fr: 'Amphithéâtre', price: 2000 },
                    { name_ru: 'Балкон', name_fr: 'Balcon', price: 1500 }
                ]
            },
            {
                title_ru: 'Выставка современного искусства',
                title_fr: 'Exposition d\'art contemporain',
                description_ru: 'Уникальная выставка работ современных художников. Более 100 произведений живописи, скульптуры и инсталляций.',
                description_fr: 'Exposition unique d\'œuvres d\'artistes contemporains. Plus de 100 œuvres de peinture, sculpture et installations.',
                date: '2025-02-25',
                time: '10:00',
                location_ru: 'Галерея современного искусства',
                location_fr: 'Galerie d\'art contemporain',
                category: 'art',
                image: '🎨',
                tickets: [
                    { name_ru: 'Полный билет', name_fr: 'Billet complet', price: 800 },
                    { name_ru: 'Студенческий', name_fr: 'Étudiant', price: 400 },
                    { name_ru: 'Групповой (от 5 чел.)', name_fr: 'Groupe (à partir de 5 pers.)', price: 600 }
                ]
            }
        ];

        // Добавляем мероприятия
        for (const event of testEvents) {
            try {
                // Проверяем, не существует ли уже мероприятие
                const existing = await dbHelpers.get(
                    'SELECT id FROM events WHERE title_ru = ?',
                    [event.title_ru]
                );

                if (!existing) {
                    const result = await dbHelpers.run(`
                        INSERT INTO events (
                            title_ru, title_fr, description_ru, description_fr,
                            date, time, location_ru, location_fr, category, image
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `, [
                        event.title_ru, event.title_fr, event.description_ru, event.description_fr,
                        event.date, event.time, event.location_ru, event.location_fr,
                        event.category, event.image
                    ]);

                    const eventId = result.id;

                    // Добавляем типы билетов
                    for (const ticket of event.tickets) {
                        await dbHelpers.run(`
                            INSERT INTO ticket_types (event_id, name_ru, name_fr, price)
                            VALUES (?, ?, ?, ?)
                        `, [eventId, ticket.name_ru, ticket.name_fr, ticket.price]);
                    }

                    console.log(`✅ Добавлено мероприятие: ${event.title_ru}`);
                }
            } catch (error) {
                console.log(`⚠️  Мероприятие "${event.title_ru}" уже существует или ошибка:`, error.message);
            }
        }

        // Создаем дополнительного админа
        const adminPassword = bcrypt.hashSync('admin123', 10);
        
        try {
            await dbHelpers.run(`
                INSERT INTO users (username, password_hash, role) 
                VALUES (?, ?, ?)
            `, ['admin', adminPassword, 'admin']);
            console.log('✅ Админ создан: admin/admin123');
        } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
                console.log('ℹ️  Админ уже существует');
            } else {
                console.log('⚠️  Ошибка создания админа:', error.message);
            }
        }

        console.log('✅ База данных инициализирована успешно!');
        console.log('');
        console.log('📋 Данные для входа:');
        console.log('   Логин: admin');
        console.log('   Пароль: admin123');
        console.log('');
        console.log('🚀 Запустите сервер командой: npm start');

    } catch (error) {
        console.error('❌ Ошибка инициализации базы данных:', error);
        process.exit(1);
    }
}

// Запускаем инициализацию
initializeDatabase();