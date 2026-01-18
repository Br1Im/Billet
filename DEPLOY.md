# Деплой на Render

## Шаги для развертывания

### 1. Подготовка репозитория

Убедитесь, что все изменения закоммичены и запушены в GitHub:

```bash
git add .
git commit -m "Настройка для деплоя на Render"
git push origin main
```

### 2. Создание сервиса на Render

1. Зайдите на [render.com](https://render.com)
2. Нажмите **"New +"** → **"Web Service"**
3. Подключите ваш GitHub репозиторий
4. Выберите репозиторий с проектом

### 3. Настройка сервиса

**Важно!** Если у вас уже есть статический сайт на Render, **удалите его** и создайте новый Node.js сервис.

#### Настройки:

- **Name**: `eventtickets` (или любое другое имя)
- **Region**: `Frankfurt (EU Central)` (или ближайший к вам)
- **Branch**: `main`
- **Root Directory**: оставьте пустым
- **Environment**: `Node`
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Plan**: `Free`

#### Environment Variables:

Добавьте следующие переменные окружения:

- `NODE_ENV` = `production`
- `PORT` = `10000` (Render автоматически установит)

### 4. Деплой

1. Нажмите **"Create Web Service"**
2. Render автоматически начнет деплой
3. Дождитесь завершения (обычно 2-5 минут)
4. После успешного деплоя вы получите URL вида: `https://eventtickets.onrender.com`

### 5. Проверка работы

Откройте ваш сайт:

- **Главная страница**: `https://your-app.onrender.com/`
- **Админ-панель**: `https://your-app.onrender.com/admin.html`
- **API статус**: `https://your-app.onrender.com/api/status`
- **Мероприятия**: `https://your-app.onrender.com/api/events`

### 6. Вход в админ-панель

- **Логин**: `admin`
- **Пароль**: `admin123`

⚠️ **Важно**: После первого входа смените пароль в коде (`server/routes/auth.js`)

## Автоматический деплой

Render автоматически деплоит изменения при каждом push в ветку `main`.

## Troubleshooting

### Проблема: Сервис не запускается

**Решение**: Проверьте логи в Render Dashboard → Logs

### Проблема: База данных пустая

**Решение**: База данных SQLite создается автоматически при первом запуске. Данные сохраняются в `server/database/eventtickets.db`

⚠️ **Важно**: На бесплатном плане Render файлы могут удаляться при перезапуске. Для продакшена рекомендуется использовать PostgreSQL.

### Проблема: CORS ошибки

**Решение**: Убедитесь, что в `server/server.js` добавлен ваш домен Render в `allowedOrigins`

### Проблема: 404 на статических файлах

**Решение**: Проверьте, что в `server/server.js` есть строка:
```javascript
app.use(express.static(path.join(__dirname, '../')));
```

## Миграция со статического сайта

Если у вас уже был статический сайт на Render:

1. **Удалите** старый статический сервис
2. Создайте **новый** Node.js сервис по инструкции выше
3. Обновите DNS/домен на новый URL (если используете кастомный домен)

## Использование PostgreSQL (рекомендуется для продакшена)

1. В Render Dashboard создайте PostgreSQL базу данных
2. Добавьте `DATABASE_URL` в Environment Variables
3. Установите `pg` в `server/package.json`
4. Обновите `server/database/db.js` для работы с PostgreSQL

## Мониторинг

- **Логи**: Render Dashboard → Logs
- **Метрики**: Render Dashboard → Metrics
- **Статус**: `https://your-app.onrender.com/api/status`

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Render Dashboard
2. Убедитесь, что локально все работает (`npm start` в папке `server`)
3. Проверьте, что все зависимости установлены в `server/package.json`
