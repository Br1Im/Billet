const express = require('express');
const { dbHelpers } = require('../database/db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Получить все мероприятия (публичный доступ)
router.get('/', async (req, res) => {
    try {
        const events = await dbHelpers.all(`
            SELECT 
                e.*,
                COALESCE(
                    JSON_GROUP_ARRAY(
                        CASE WHEN tt.id IS NOT NULL THEN
                            JSON_OBJECT(
                                'id', tt.id,
                                'name_ru', tt.name_ru,
                                'name_fr', tt.name_fr,
                                'price', tt.price,
                                'quantity_available', tt.quantity_available
                            )
                        END
                    ), 
                    '[]'
                ) as tickets_json
            FROM events e
            LEFT JOIN ticket_types tt ON e.id = tt.event_id
            WHERE e.status = 'active'
            GROUP BY e.id
            ORDER BY e.date ASC, e.time ASC
        `);

        // Преобразуем данные в нужный формат
        const formattedEvents = events.map(event => {
            let tickets = [];
            
            if (event.tickets_json) {
                try {
                    const ticketsArray = JSON.parse(event.tickets_json);
                    tickets = ticketsArray
                        .filter(ticket => ticket !== null) // Убираем null значения
                        .map(ticket => ({
                            id: ticket.id,
                            type: {
                                ru: ticket.name_ru,
                                fr: ticket.name_fr
                            },
                            price: parseFloat(ticket.price)
                        }));
                } catch (e) {
                    console.error('Ошибка парсинга билетов:', e, event.tickets_json);
                    tickets = [];
                }
            }
            
            return {
                id: event.id,
                title: {
                    ru: event.title_ru,
                    fr: event.title_fr
                },
                description: {
                    ru: event.description_ru,
                    fr: event.description_fr
                },
                date: event.date,
                time: event.time,
                location: {
                    ru: event.location_ru,
                    fr: event.location_fr
                },
                category: event.category,
                image: event.image,
                tickets: tickets
            };
        });

        res.json(formattedEvents);

    } catch (error) {
        console.error('Ошибка получения мероприятий:', error);
        res.status(500).json({ error: 'Ошибка получения мероприятий' });
    }
});

// Получить одно мероприятие
router.get('/:id', async (req, res) => {
    try {
        const eventId = req.params.id;

        const event = await dbHelpers.get(`
            SELECT * FROM events WHERE id = ? AND status = 'active'
        `, [eventId]);

        if (!event) {
            return res.status(404).json({ error: 'Мероприятие не найдено' });
        }

        const tickets = await dbHelpers.all(`
            SELECT * FROM ticket_types WHERE event_id = ?
        `, [eventId]);

        const formattedEvent = {
            id: event.id,
            title: {
                ru: event.title_ru,
                fr: event.title_fr
            },
            description: {
                ru: event.description_ru,
                fr: event.description_fr
            },
            date: event.date,
            time: event.time,
            location: {
                ru: event.location_ru,
                fr: event.location_fr
            },
            category: event.category,
            image: event.image,
            tickets: tickets.map(ticket => ({
                id: ticket.id,
                type: {
                    ru: ticket.name_ru,
                    fr: ticket.name_fr
                },
                price: parseFloat(ticket.price)
            }))
        };

        res.json(formattedEvent);

    } catch (error) {
        console.error('Ошибка получения мероприятия:', error);
        res.status(500).json({ error: 'Ошибка получения мероприятия' });
    }
});

// Создать мероприятие (только для админов)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title_ru, title_fr, description_ru, description_fr,
            date, time, location_ru, location_fr, category, image, tickets
        } = req.body;

        // Валидация
        if (!title_ru || !date || !time || !location_ru) {
            return res.status(400).json({ error: 'Обязательные поля не заполнены' });
        }

        // Создаем мероприятие
        const result = await dbHelpers.run(`
            INSERT INTO events (
                title_ru, title_fr, description_ru, description_fr,
                date, time, location_ru, location_fr, category, image
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title_ru, title_fr || title_ru, 
            description_ru, description_fr || description_ru,
            date, time, location_ru, location_fr || location_ru, 
            category || 'other', image || '🎪'
        ]);

        const eventId = result.id;

        // Добавляем типы билетов
        if (tickets && tickets.length > 0) {
            for (const ticket of tickets) {
                await dbHelpers.run(`
                    INSERT INTO ticket_types (event_id, name_ru, name_fr, price)
                    VALUES (?, ?, ?, ?)
                `, [
                    eventId, 
                    ticket.name_ru || ticket.name, 
                    ticket.name_fr || ticket.name, 
                    ticket.price
                ]);
            }
        }

        res.status(201).json({
            success: true,
            message: 'Мероприятие создано',
            eventId: eventId
        });

    } catch (error) {
        console.error('Ошибка создания мероприятия:', error);
        res.status(500).json({ error: 'Ошибка создания мероприятия' });
    }
});

// Обновить мероприятие (только для админов)
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;
        const {
            title_ru, title_fr, description_ru, description_fr,
            date, time, location_ru, location_fr, category, image, tickets
        } = req.body;

        // Проверяем существование мероприятия
        const existingEvent = await dbHelpers.get(
            'SELECT id FROM events WHERE id = ?', [eventId]
        );

        if (!existingEvent) {
            return res.status(404).json({ error: 'Мероприятие не найдено' });
        }

        // Обновляем мероприятие
        await dbHelpers.run(`
            UPDATE events SET
                title_ru = ?, title_fr = ?, description_ru = ?, description_fr = ?,
                date = ?, time = ?, location_ru = ?, location_fr = ?, 
                category = ?, image = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            title_ru, title_fr || title_ru,
            description_ru, description_fr || description_ru,
            date, time, location_ru, location_fr || location_ru,
            category || 'other', image || '🎪', eventId
        ]);

        // Обновляем типы билетов (удаляем старые и добавляем новые)
        await dbHelpers.run('DELETE FROM ticket_types WHERE event_id = ?', [eventId]);

        if (tickets && tickets.length > 0) {
            for (const ticket of tickets) {
                await dbHelpers.run(`
                    INSERT INTO ticket_types (event_id, name_ru, name_fr, price)
                    VALUES (?, ?, ?, ?)
                `, [
                    eventId,
                    ticket.name_ru || ticket.name,
                    ticket.name_fr || ticket.name,
                    ticket.price
                ]);
            }
        }

        res.json({
            success: true,
            message: 'Мероприятие обновлено'
        });

    } catch (error) {
        console.error('Ошибка обновления мероприятия:', error);
        res.status(500).json({ error: 'Ошибка обновления мероприятия' });
    }
});

// Удалить мероприятие (только для админов)
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const eventId = req.params.id;

        // Проверяем существование мероприятия
        const existingEvent = await dbHelpers.get(
            'SELECT id FROM events WHERE id = ?', [eventId]
        );

        if (!existingEvent) {
            return res.status(404).json({ error: 'Мероприятие не найдено' });
        }

        // Мягкое удаление (меняем статус)
        await dbHelpers.run(
            'UPDATE events SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            ['deleted', eventId]
        );

        res.json({
            success: true,
            message: 'Мероприятие удалено'
        });

    } catch (error) {
        console.error('Ошибка удаления мероприятия:', error);
        res.status(500).json({ error: 'Ошибка удаления мероприятия' });
    }
});

module.exports = router;