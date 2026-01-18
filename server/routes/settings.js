const express = require('express');
const { dbHelpers } = require('../database/db');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Получить все настройки (публичный доступ для некоторых настроек)
router.get('/', async (req, res) => {
    try {
        const settings = await dbHelpers.all('SELECT * FROM settings');
        
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });

        // Публичные настройки (без чувствительных данных)
        const publicSettings = {
            siteName: settingsObj.siteName || 'EventTickets',
            contactEmail: settingsObj.contactEmail || 'info@eventtickets.com',
            contactPhone: settingsObj.contactPhone || '+7 (999) 123-45-67'
        };

        res.json(publicSettings);

    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        res.status(500).json({ error: 'Ошибка получения настроек' });
    }
});

// Получить все настройки для админа
router.get('/admin', authenticateToken, async (req, res) => {
    try {
        const settings = await dbHelpers.all('SELECT * FROM settings');
        
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });

        // Все настройки для админа
        const adminSettings = {
            siteName: settingsObj.siteName || 'EventTickets',
            bankName: settingsObj.bankName || 'Сбербанк России',
            bankIban: settingsObj.bankIban || 'RU1234567890123456789012',
            bankBic: settingsObj.bankBic || 'SBERRU2P',
            bankRecipient: settingsObj.bankRecipient || 'ООО «EventTickets»',
            contactEmail: settingsObj.contactEmail || 'info@eventtickets.com',
            contactPhone: settingsObj.contactPhone || '+7 (999) 123-45-67'
        };

        res.json(adminSettings);

    } catch (error) {
        console.error('Ошибка получения настроек админа:', error);
        res.status(500).json({ error: 'Ошибка получения настроек админа' });
    }
});

// Обновить настройки (только для админов)
router.put('/', authenticateToken, async (req, res) => {
    try {
        const settings = req.body;

        // Список разрешенных настроек
        const allowedSettings = [
            'siteName', 'bankName', 'bankIban', 'bankBic', 'bankRecipient',
            'contactEmail', 'contactPhone'
        ];

        // Обновляем каждую настройку
        for (const [key, value] of Object.entries(settings)) {
            if (allowedSettings.includes(key)) {
                await dbHelpers.run(`
                    INSERT OR REPLACE INTO settings (key, value, updated_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                `, [key, value]);
            }
        }

        res.json({
            success: true,
            message: 'Настройки обновлены'
        });

    } catch (error) {
        console.error('Ошибка обновления настроек:', error);
        res.status(500).json({ error: 'Ошибка обновления настроек' });
    }
});

// Получить банковские реквизиты (публичный доступ)
router.get('/bank', async (req, res) => {
    try {
        const bankSettings = await dbHelpers.all(`
            SELECT * FROM settings 
            WHERE key IN ('bankName', 'bankIban', 'bankBic', 'bankRecipient')
        `);
        
        const bankData = {};
        bankSettings.forEach(setting => {
            bankData[setting.key] = setting.value;
        });

        res.json({
            bankName: bankData.bankName || 'Сбербанк России',
            iban: bankData.bankIban || 'RU1234567890123456789012',
            bic: bankData.bankBic || 'SBERRU2P',
            recipient: bankData.bankRecipient || 'ООО «EventTickets»'
        });

    } catch (error) {
        console.error('Ошибка получения банковских реквизитов:', error);
        res.status(500).json({ error: 'Ошибка получения банковских реквизитов' });
    }
});

module.exports = router;