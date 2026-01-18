const express = require('express');
const { dbHelpers } = require('../database/db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Генерация ID заказа
const generateOrderId = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
};

// Создать заказ (публичный доступ)
router.post('/', async (req, res) => {
    try {
        const {
            eventId, customer, tickets, totalAmount, paymentMethod, language
        } = req.body;

        // Валидация
        if (!eventId || !customer || !tickets || !totalAmount || !paymentMethod) {
            return res.status(400).json({ error: 'Не все обязательные поля заполнены' });
        }

        if (!customer.name || !customer.email || !customer.phone) {
            return res.status(400).json({ error: 'Данные клиента неполные' });
        }

        // Проверяем существование мероприятия
        const event = await dbHelpers.get(
            'SELECT * FROM events WHERE id = ? AND status = "active"',
            [eventId]
        );

        if (!event) {
            return res.status(404).json({ error: 'Мероприятие не найдено' });
        }

        // Генерируем ID заказа
        const orderId = generateOrderId();

        // Создаем заказ
        await dbHelpers.run(`
            INSERT INTO orders (
                id, event_id, customer_name, customer_email, customer_phone,
                total_amount, payment_method, language
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            orderId, eventId, customer.name, customer.email, customer.phone,
            totalAmount, paymentMethod, language || 'ru'
        ]);

        // Добавляем элементы заказа
        for (const ticket of tickets) {
            const subtotal = ticket.price * ticket.quantity;
            await dbHelpers.run(`
                INSERT INTO order_items (
                    order_id, ticket_type_id, quantity, price, subtotal
                ) VALUES (?, ?, ?, ?, ?)
            `, [orderId, ticket.typeId, ticket.quantity, ticket.price, subtotal]);
        }

        res.status(201).json({
            success: true,
            message: 'Заказ создан',
            orderId: orderId,
            order: {
                id: orderId,
                eventTitle: {
                    ru: event.title_ru,
                    fr: event.title_fr
                },
                eventDate: event.date,
                eventTime: event.time,
                totalAmount: totalAmount,
                status: 'PENDING'
            }
        });

    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        res.status(500).json({ error: 'Ошибка создания заказа' });
    }
});

// Получить все заказы (только для админов)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { status, eventId } = req.query;

        let sql = `
            SELECT 
                o.*,
                e.title_ru, e.title_fr, e.date as event_date, e.time as event_time,
                e.location_ru, e.location_fr,
                GROUP_CONCAT(
                    json_object(
                        'typeId', oi.ticket_type_id,
                        'quantity', oi.quantity,
                        'price', oi.price,
                        'subtotal', oi.subtotal
                    )
                ) as items_json
            FROM orders o
            JOIN events e ON o.event_id = e.id
            LEFT JOIN order_items oi ON o.id = oi.order_id
        `;

        const params = [];
        const conditions = [];

        if (status) {
            conditions.push('o.status = ?');
            params.push(status);
        }

        if (eventId) {
            conditions.push('o.event_id = ?');
            params.push(eventId);
        }

        if (conditions.length > 0) {
            sql += ' WHERE ' + conditions.join(' AND ');
        }

        sql += ' GROUP BY o.id ORDER BY o.created_at DESC';

        const orders = await dbHelpers.all(sql, params);

        // Получаем информацию о типах билетов
        const ticketTypes = await dbHelpers.all('SELECT * FROM ticket_types');
        const ticketTypesMap = {};
        ticketTypes.forEach(tt => {
            ticketTypesMap[tt.id] = tt;
        });

        // Форматируем заказы
        const formattedOrders = orders.map(order => ({
            id: order.id,
            eventId: order.event_id,
            eventTitle: {
                ru: order.title_ru,
                fr: order.title_fr
            },
            eventDate: order.event_date,
            eventTime: order.event_time,
            eventLocation: {
                ru: order.location_ru,
                fr: order.location_fr
            },
            customer: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone
            },
            tickets: order.items_json ? 
                order.items_json.split(',').map(itemStr => {
                    try {
                        const item = JSON.parse(itemStr);
                        const ticketType = ticketTypesMap[item.typeId];
                        return {
                            typeId: item.typeId,
                            type: ticketType ? ticketType.name_ru : 'Неизвестный тип',
                            quantity: item.quantity,
                            price: parseFloat(item.price),
                            subtotal: parseFloat(item.subtotal)
                        };
                    } catch (e) {
                        return null;
                    }
                }).filter(Boolean) : [],
            totalAmount: parseFloat(order.total_amount),
            paymentMethod: order.payment_method,
            status: order.status,
            language: order.language,
            orderDate: order.created_at,
            updatedAt: order.updated_at
        }));

        res.json(formattedOrders);

    } catch (error) {
        console.error('Ошибка получения заказов:', error);
        res.status(500).json({ error: 'Ошибка получения заказов' });
    }
});

// Получить заказ по ID
router.get('/:id', async (req, res) => {
    try {
        const orderId = req.params.id;

        const order = await dbHelpers.get(`
            SELECT 
                o.*,
                e.title_ru, e.title_fr, e.date as event_date, e.time as event_time,
                e.location_ru, e.location_fr
            FROM orders o
            JOIN events e ON o.event_id = e.id
            WHERE o.id = ?
        `, [orderId]);

        if (!order) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        const items = await dbHelpers.all(`
            SELECT 
                oi.*,
                tt.name_ru, tt.name_fr
            FROM order_items oi
            JOIN ticket_types tt ON oi.ticket_type_id = tt.id
            WHERE oi.order_id = ?
        `, [orderId]);

        const formattedOrder = {
            id: order.id,
            eventId: order.event_id,
            eventTitle: {
                ru: order.title_ru,
                fr: order.title_fr
            },
            eventDate: order.event_date,
            eventTime: order.event_time,
            eventLocation: {
                ru: order.location_ru,
                fr: order.location_fr
            },
            customer: {
                name: order.customer_name,
                email: order.customer_email,
                phone: order.customer_phone
            },
            tickets: items.map(item => ({
                typeId: item.ticket_type_id,
                type: item.name_ru,
                quantity: item.quantity,
                price: parseFloat(item.price),
                subtotal: parseFloat(item.subtotal)
            })),
            totalAmount: parseFloat(order.total_amount),
            paymentMethod: order.payment_method,
            status: order.status,
            language: order.language,
            orderDate: order.created_at,
            updatedAt: order.updated_at
        };

        res.json(formattedOrder);

    } catch (error) {
        console.error('Ошибка получения заказа:', error);
        res.status(500).json({ error: 'Ошибка получения заказа' });
    }
});

// Обновить статус заказа (только для админов)
router.patch('/:id/status', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;
        const { status } = req.body;

        if (!['PENDING', 'PAID', 'EXPIRED', 'CANCELLED'].includes(status)) {
            return res.status(400).json({ error: 'Недопустимый статус' });
        }

        const result = await dbHelpers.run(
            'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, orderId]
        );

        if (result.changes === 0) {
            return res.status(404).json({ error: 'Заказ не найден' });
        }

        res.json({
            success: true,
            message: 'Статус заказа обновлен'
        });

    } catch (error) {
        console.error('Ошибка обновления статуса заказа:', error);
        res.status(500).json({ error: 'Ошибка обновления статуса заказа' });
    }
});

// Отметить вход гостя (только для админов)
router.post('/:id/checkin', authenticateToken, async (req, res) => {
    try {
        const orderId = req.params.id;

        // Проверяем существование заказа
        const order = await dbHelpers.get(
            'SELECT * FROM orders WHERE id = ? AND status = "PAID"',
            [orderId]
        );

        if (!order) {
            return res.status(404).json({ error: 'Оплаченный заказ не найден' });
        }

        // Проверяем, не отмечен ли уже вход
        const existingCheckin = await dbHelpers.get(
            'SELECT * FROM guest_checkins WHERE order_id = ?',
            [orderId]
        );

        if (existingCheckin) {
            return res.status(400).json({ error: 'Вход уже отмечен' });
        }

        // Отмечаем вход
        await dbHelpers.run(
            'INSERT INTO guest_checkins (order_id, checked_in_by) VALUES (?, ?)',
            [orderId, req.user.username]
        );

        res.json({
            success: true,
            message: 'Вход гостя отмечен'
        });

    } catch (error) {
        console.error('Ошибка отметки входа:', error);
        res.status(500).json({ error: 'Ошибка отметки входа' });
    }
});

module.exports = router;