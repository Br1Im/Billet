const nodemailer = require('nodemailer');
const { dbHelpers } = require('../database/db');

// Конфигурация транспорта (используйте свои настройки SMTP)
const createTransporter = () => {
    // Для продакшена используйте реальные SMTP настройки
    // Например, Gmail, SendGrid, Mailgun и т.д.
    return nodemailer.createTransporter({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false,
        auth: {
            user: process.env.SMTP_USER || 'your-email@gmail.com',
            pass: process.env.SMTP_PASS || 'your-app-password'
        }
    });
};

// Получить настройки сайта
async function getSiteSettings() {
    try {
        const settings = await dbHelpers.all('SELECT * FROM settings');
        const settingsObj = {};
        settings.forEach(setting => {
            settingsObj[setting.key] = setting.value;
        });
        return settingsObj;
    } catch (error) {
        console.error('Ошибка получения настроек:', error);
        return {};
    }
}

// Шаблон письма при бронировании (банковский перевод)
async function sendBookingConfirmation(order) {
    try {
        const settings = await getSiteSettings();
        const siteName = settings.siteName || 'EventTickets';
        
        const transporter = createTransporter();
        
        const ticketsList = order.tickets.map(t => 
            `<li>${t.type} x${t.quantity} - ${t.price}€</li>`
        ).join('');
        
        const mailOptions = {
            from: `"${siteName}" <${process.env.SMTP_USER || 'noreply@eventtickets.com'}>`,
            to: order.customer.email,
            subject: `Подтверждение бронирования #${order.id} - ${siteName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                        .bank-details { background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                        h1 { margin: 0; font-size: 28px; }
                        h2 { color: #667eea; margin-top: 0; }
                        ul { padding-left: 20px; }
                        .highlight { color: #667eea; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>🎫 Бронирование подтверждено!</h1>
                        </div>
                        <div class="content">
                            <p>Здравствуйте, <strong>${order.customer.name}</strong>!</p>
                            
                            <p>Спасибо за ваше бронирование! Ваш заказ <span class="highlight">#${order.id}</span> успешно создан.</p>
                            
                            <div class="order-details">
                                <h2>Детали заказа</h2>
                                <p><strong>Мероприятие:</strong> ${order.eventTitle.ru}</p>
                                <p><strong>Дата:</strong> ${new Date(order.eventDate).toLocaleDateString('ru-RU')} в ${order.eventTime}</p>
                                <p><strong>Место:</strong> ${order.eventLocation.ru}</p>
                                
                                <h3>Билеты:</h3>
                                <ul>
                                    ${ticketsList}
                                </ul>
                                
                                <p><strong>Итого к оплате:</strong> <span class="highlight">${order.totalAmount}€</span></p>
                            </div>
                            
                            <div class="bank-details">
                                <h2>💳 Реквизиты для оплаты</h2>
                                <p>Пожалуйста, переведите <strong>${order.totalAmount}€</strong> на следующие реквизиты:</p>
                                
                                <p><strong>Банк:</strong> ${settings.bankName || 'Указать в настройках'}<br>
                                <strong>IBAN:</strong> ${settings.bankIban || 'Указать в настройках'}<br>
                                <strong>BIC:</strong> ${settings.bankBic || 'Указать в настройках'}<br>
                                <strong>Получатель:</strong> ${settings.bankRecipient || 'Указать в настройках'}</p>
                                
                                <p><strong>Назначение платежа:</strong> Оплата билетов, заказ #${order.id}</p>
                                
                                <p style="color: #856404; margin-top: 15px;">
                                    ⚠️ <strong>Важно:</strong> После оплаты, пожалуйста, отправьте подтверждение перевода на ${settings.contactEmail || 'info@eventtickets.com'}
                                </p>
                            </div>
                            
                            <p>После подтверждения оплаты мы отправим вам билеты на этот email.</p>
                            
                            <p>Если у вас есть вопросы, свяжитесь с нами:</p>
                            <p>📧 Email: ${settings.contactEmail || 'info@eventtickets.com'}<br>
                            📞 Телефон: ${settings.contactPhone || '+33 1 23 45 67 89'}</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${siteName}. Все права защищены.</p>
                            <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Письмо о бронировании отправлено:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Ошибка отправки письма о бронировании:', error);
        return { success: false, error: error.message };
    }
}

// Шаблон письма при подтверждении оплаты
async function sendPaymentConfirmation(order) {
    try {
        const settings = await getSiteSettings();
        const siteName = settings.siteName || 'EventTickets';
        
        const transporter = createTransporter();
        
        const ticketsList = order.tickets.map(t => 
            `<li>${t.type} x${t.quantity} - ${t.price}€</li>`
        ).join('');
        
        const mailOptions = {
            from: `"${siteName}" <${process.env.SMTP_USER || 'noreply@eventtickets.com'}>`,
            to: order.customer.email,
            subject: `✅ Оплата подтверждена #${order.id} - ${siteName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #48bb78 0%, #38a169 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .ticket { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px dashed #48bb78; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                        h1 { margin: 0; font-size: 28px; }
                        h2 { color: #48bb78; margin-top: 0; }
                        .success { color: #48bb78; font-weight: bold; font-size: 18px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>✅ Оплата подтверждена!</h1>
                        </div>
                        <div class="content">
                            <p>Здравствуйте, <strong>${order.customer.name}</strong>!</p>
                            
                            <p class="success">Ваша оплата успешно получена и подтверждена!</p>
                            
                            <div class="ticket">
                                <h2>🎫 Ваши билеты</h2>
                                <p><strong>Заказ:</strong> #${order.id}</p>
                                <p><strong>Мероприятие:</strong> ${order.eventTitle.ru}</p>
                                <p><strong>Дата:</strong> ${new Date(order.eventDate).toLocaleDateString('ru-RU')} в ${order.eventTime}</p>
                                <p><strong>Место:</strong> ${order.eventLocation.ru}</p>
                                
                                <h3>Билеты:</h3>
                                <ul>
                                    ${ticketsList}
                                </ul>
                                
                                <p><strong>Оплачено:</strong> ${order.totalAmount}€</p>
                            </div>
                            
                            <p><strong>Важная информация:</strong></p>
                            <ul>
                                <li>Сохраните это письмо - оно является подтверждением вашей покупки</li>
                                <li>Пожалуйста, приходите за 15 минут до начала мероприятия</li>
                                <li>При входе предъявите это письмо (можно с телефона)</li>
                            </ul>
                            
                            <p>Ждем вас на мероприятии! 🎉</p>
                            
                            <p>Если у вас есть вопросы, свяжитесь с нами:</p>
                            <p>📧 Email: ${settings.contactEmail || 'info@eventtickets.com'}<br>
                            📞 Телефон: ${settings.contactPhone || '+33 1 23 45 67 89'}</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${siteName}. Все права защищены.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Письмо о подтверждении оплаты отправлено:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Ошибка отправки письма о подтверждении оплаты:', error);
        return { success: false, error: error.message };
    }
}

// Шаблон письма при отмене брони
async function sendCancellationEmail(order, reason = '') {
    try {
        const settings = await getSiteSettings();
        const siteName = settings.siteName || 'EventTickets';
        
        const transporter = createTransporter();
        
        const mailOptions = {
            from: `"${siteName}" <${process.env.SMTP_USER || 'noreply@eventtickets.com'}>`,
            to: order.customer.email,
            subject: `❌ Бронирование отменено #${order.id} - ${siteName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #f56565 0%, #c53030 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                        .reason { background: #fff5f5; padding: 15px; border-radius: 8px; border-left: 4px solid #f56565; margin: 20px 0; }
                        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                        h1 { margin: 0; font-size: 28px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>❌ Бронирование отменено</h1>
                        </div>
                        <div class="content">
                            <p>Здравствуйте, <strong>${order.customer.name}</strong>!</p>
                            
                            <p>К сожалению, ваше бронирование <strong>#${order.id}</strong> было отменено.</p>
                            
                            <p><strong>Мероприятие:</strong> ${order.eventTitle.ru}<br>
                            <strong>Дата:</strong> ${new Date(order.eventDate).toLocaleDateString('ru-RU')} в ${order.eventTime}</p>
                            
                            ${reason ? `
                            <div class="reason">
                                <strong>Причина отмены:</strong><br>
                                ${reason}
                            </div>
                            ` : ''}
                            
                            <p>Если вы оплатили заказ, возврат средств будет произведен в течение 5-7 рабочих дней.</p>
                            
                            <p>Если у вас есть вопросы, пожалуйста, свяжитесь с нами:</p>
                            <p>📧 Email: ${settings.contactEmail || 'info@eventtickets.com'}<br>
                            📞 Телефон: ${settings.contactPhone || '+33 1 23 45 67 89'}</p>
                            
                            <p>Надеемся увидеть вас на других наших мероприятиях!</p>
                        </div>
                        <div class="footer">
                            <p>© ${new Date().getFullYear()} ${siteName}. Все права защищены.</p>
                        </div>
                    </div>
                </body>
                </html>
            `
        };
        
        const info = await transporter.sendMail(mailOptions);
        console.log('Письмо об отмене отправлено:', info.messageId);
        return { success: true, messageId: info.messageId };
        
    } catch (error) {
        console.error('Ошибка отправки письма об отмене:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    sendBookingConfirmation,
    sendPaymentConfirmation,
    sendCancellationEmail
};
