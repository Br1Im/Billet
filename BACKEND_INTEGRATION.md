# 🔧 Backend Integration Guide

## Обзор

Этот документ описывает, как интегрировать backend для полноценной работы системы EventTickets.

## 🗄️ База данных

### Рекомендуемые технологии
- **MongoDB** (NoSQL) - для гибкости
- **PostgreSQL** (SQL) - для надежности

### Структура данных

#### Events (Мероприятия)
```javascript
{
  _id: ObjectId,
  title: {
    ru: String,
    fr: String
  },
  description: {
    ru: String,
    fr: String
  },
  location: {
    ru: String,
    fr: String
  },
  date: Date,
  time: String,
  image: String, // URL или emoji
  category: String, // 'music', 'theater', 'art'
  tickets: [{
    type: {
      ru: String,
      fr: String
    },
    price: Number,
    available: Number,
    sold: Number
  }],
  status: String, // 'active', 'cancelled', 'completed'
  createdAt: Date,
  updatedAt: Date
}
```

#### Orders (Заказы)
```javascript
{
  _id: ObjectId,
  orderNumber: String, // Уникальный номер заказа
  eventId: ObjectId,
  customer: {
    name: String,
    email: String,
    phone: String
  },
  tickets: [{
    type: String,
    quantity: Number,
    price: Number
  }],
  total: Number,
  paymentMethod: String, // 'transfer', 'cash'
  status: String, // 'pending', 'paid', 'expired', 'cancelled'
  qrCode: String, // Уникальный QR-код
  checkedIn: Boolean,
  checkedInAt: Date,
  paidAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

#### Settings (Настройки)
```javascript
{
  _id: ObjectId,
  bankDetails: {
    bankName: String,
    iban: String,
    bic: String,
    accountHolder: String
  },
  emailSettings: {
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String,
    fromName: String
  },
  updatedAt: Date
}
```

## 🌐 API Endpoints

### Events API

#### GET /api/events
Получить список всех активных мероприятий
```javascript
Response: {
  success: true,
  data: [Event]
}
```

#### GET /api/events/:id
Получить детали мероприятия
```javascript
Response: {
  success: true,
  data: Event
}
```

#### POST /api/events (Admin)
Создать новое мероприятие
```javascript
Request: {
  title: { ru: String, fr: String },
  description: { ru: String, fr: String },
  location: { ru: String, fr: String },
  date: Date,
  time: String,
  image: String,
  category: String,
  tickets: [Ticket]
}

Response: {
  success: true,
  data: Event
}
```

#### PUT /api/events/:id (Admin)
Обновить мероприятие

#### DELETE /api/events/:id (Admin)
Удалить мероприятие

### Orders API

#### POST /api/orders
Создать новый заказ
```javascript
Request: {
  eventId: String,
  customer: {
    name: String,
    email: String,
    phone: String
  },
  tickets: [{
    type: String,
    quantity: Number
  }],
  paymentMethod: String
}

Response: {
  success: true,
  data: {
    order: Order,
    message: "Order created successfully"
  }
}
```

#### GET /api/orders (Admin)
Получить список всех заказов
```javascript
Query params:
  - status: String (optional)
  - eventId: String (optional)
  - page: Number (optional)
  - limit: Number (optional)

Response: {
  success: true,
  data: {
    orders: [Order],
    total: Number,
    page: Number,
    pages: Number
  }
}
```

#### GET /api/orders/:id
Получить детали заказа

#### PUT /api/orders/:id/confirm-payment (Admin)
Подтвердить оплату заказа
```javascript
Response: {
  success: true,
  data: {
    order: Order,
    ticket: TicketPDF
  }
}
```

#### POST /api/orders/:id/resend-ticket (Admin)
Повторно отправить билет

#### PUT /api/orders/:id/check-in (Admin)
Отметить вход гостя
```javascript
Request: {
  qrCode: String
}

Response: {
  success: true,
  data: {
    order: Order,
    message: "Guest checked in successfully"
  }
}
```

### Settings API

#### GET /api/settings (Admin)
Получить настройки системы

#### PUT /api/settings (Admin)
Обновить настройки

## 📧 Email Integration

### Рекомендуемые сервисы
- **SendGrid**
- **Mailgun**
- **Amazon SES**
- **SMTP (собственный сервер)**

### Email Templates

#### 1. Order Confirmation (Подтверждение заказа)
```
Тема: Заказ #{orderNumber} принят - EventTickets

Здравствуйте, {customerName}!

Ваш заказ на мероприятие "{eventTitle}" успешно принят.

Детали заказа:
- Номер заказа: #{orderNumber}
- Мероприятие: {eventTitle}
- Дата: {eventDate}
- Место: {eventLocation}
- Билеты: {ticketsList}
- Сумма: {total} ₽

Способ оплаты: {paymentMethod}

{paymentInstructions}

После подтверждения оплаты вы получите электронный билет с QR-кодом.

С уважением,
Команда EventTickets
```

#### 2. Payment Instructions (Инструкции по оплате)
```
Для банковского перевода:
Банк: {bankName}
IBAN: {iban}
BIC: {bic}
Получатель: {accountHolder}
Назначение платежа: Заказ #{orderNumber}

Для оплаты наличными:
Свяжитесь с нами по телефону: {phone}
```

#### 3. Ticket Delivery (Отправка билета)
```
Тема: Ваш билет на "{eventTitle}" - EventTickets

Здравствуйте, {customerName}!

Оплата подтверждена! Ваш электронный билет во вложении.

Важная информация:
- Предъявите QR-код при входе
- Возьмите с собой документ, удостоверяющий личность
- Приходите за 15-20 минут до начала

До встречи на мероприятии!

С уважением,
Команда EventTickets

Вложение: ticket-{orderNumber}.pdf
```

## 📄 PDF Generation

### Рекомендуемые библиотеки

#### Node.js
- **PDFKit** - гибкая генерация PDF
- **Puppeteer** - рендеринг HTML в PDF
- **jsPDF** - клиентская генерация

### Пример с Puppeteer
```javascript
const puppeteer = require('puppeteer');

async function generateTicketPDF(order, event) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  // Загружаем HTML шаблон
  const html = renderTicketTemplate(order, event);
  await page.setContent(html);
  
  // Генерируем PDF
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true
  });
  
  await browser.close();
  return pdf;
}
```

## 🔍 QR Code Generation

### Рекомендуемые библиотеки
- **qrcode** (Node.js)
- **QRCode.js** (Browser)

### Пример
```javascript
const QRCode = require('qrcode');

async function generateQRCode(orderNumber) {
  const qrData = `TICKET-${orderNumber}`;
  const qrCode = await QRCode.toDataURL(qrData);
  return qrCode; // Base64 image
}
```

## 🔐 Authentication (Admin)

### Рекомендуемые подходы
- **JWT** (JSON Web Tokens)
- **Session-based** authentication
- **OAuth 2.0**

### Пример JWT
```javascript
const jwt = require('jsonwebtoken');

// Генерация токена
const token = jwt.sign(
  { userId: admin._id, role: 'admin' },
  process.env.JWT_SECRET,
  { expiresIn: '24h' }
);

// Middleware для проверки
function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

## 🚀 Deployment

### Рекомендуемые платформы
- **Heroku** - простой деплой
- **DigitalOcean** - VPS
- **AWS** - масштабируемость
- **Vercel/Netlify** - для frontend

### Environment Variables
```
# Database
MONGODB_URI=mongodb://...
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# App
PORT=3000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
```

## 📊 Monitoring & Analytics

### Рекомендуемые инструменты
- **Google Analytics** - веб-аналитика
- **Sentry** - отслеживание ошибок
- **LogRocket** - session replay
- **New Relic** - мониторинг производительности

## 🔄 Cron Jobs

### Необходимые задачи
```javascript
// Проверка просроченных заказов (каждый час)
cron.schedule('0 * * * *', async () => {
  await expireOldOrders();
});

// Напоминания о мероприятиях (каждый день в 10:00)
cron.schedule('0 10 * * *', async () => {
  await sendEventReminders();
});

// Очистка старых данных (каждую неделю)
cron.schedule('0 0 * * 0', async () => {
  await cleanupOldData();
});
```

## 🧪 Testing

### Рекомендуемые фреймворки
- **Jest** - unit тесты
- **Supertest** - API тесты
- **Cypress** - E2E тесты

### Пример теста
```javascript
describe('Orders API', () => {
  test('POST /api/orders - should create new order', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        eventId: '123',
        customer: {
          name: 'Test User',
          email: 'test@example.com',
          phone: '+1234567890'
        },
        tickets: [{ type: 'Adult', quantity: 2 }],
        paymentMethod: 'transfer'
      });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.order).toBeDefined();
  });
});
```

## 📝 Заключение

Эта интеграция превратит ваше frontend-приложение в полноценную систему управления билетами. Следуйте этому руководству для успешной реализации backend-части.

Удачи! 🚀