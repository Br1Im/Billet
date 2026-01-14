# EventTickets - Деплой на GitHub
# PowerShell скрипт для автоматизации деплоя

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  EventTickets - Деплой на GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка Git
try {
    $gitVersion = git --version
    Write-Host "✅ Git установлен: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git не установлен!" -ForegroundColor Red
    Write-Host "Скачайте Git с https://git-scm.com/download/win" -ForegroundColor Yellow
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host ""

# Запрос GitHub username
$githubUsername = Read-Host "Введите ваш GitHub username"
if ([string]::IsNullOrWhiteSpace($githubUsername)) {
    Write-Host "❌ Username не может быть пустым!" -ForegroundColor Red
    Read-Host "Нажмите Enter для выхода"
    exit 1
}

Write-Host ""
Write-Host "📦 Инициализация Git репозитория..." -ForegroundColor Yellow
git init

Write-Host ""
Write-Host "📝 Добавление файлов..." -ForegroundColor Yellow
git add .

Write-Host ""
Write-Host "💾 Создание коммита..." -ForegroundColor Yellow
git commit -m "Initial commit: EventTickets v2.0"

Write-Host ""
Write-Host "🌿 Переименование ветки в main..." -ForegroundColor Yellow
git branch -M main

Write-Host ""
Write-Host "🔗 Добавление remote origin..." -ForegroundColor Yellow
git remote add origin "https://github.com/$githubUsername/event-tickets.git"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Следующие шаги:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Создайте репозиторий на GitHub:" -ForegroundColor White
Write-Host "   https://github.com/new" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Настройки репозитория:" -ForegroundColor White
Write-Host "   - Название: event-tickets" -ForegroundColor Gray
Write-Host "   - Описание: Современная система продажи билетов" -ForegroundColor Gray
Write-Host "   - Public или Private (на ваш выбор)" -ForegroundColor Gray
Write-Host "   - НЕ добавляйте README, .gitignore, license" -ForegroundColor Gray
Write-Host ""
Write-Host "3. После создания репозитория, выполните:" -ForegroundColor White
Write-Host "   git push -u origin main" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Спросить, хотят ли они сразу запушить
$pushNow = Read-Host "Хотите запушить сейчас? (y/n)"
if ($pushNow -eq "y" -or $pushNow -eq "Y") {
    Write-Host ""
    Write-Host "🚀 Отправка на GitHub..." -ForegroundColor Yellow
    git push -u origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Успешно загружено на GitHub!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Ваш репозиторий:" -ForegroundColor White
        Write-Host "https://github.com/$githubUsername/event-tickets" -ForegroundColor Blue
        Write-Host ""
        Write-Host "Теперь можете деплоить на Render:" -ForegroundColor White
        Write-Host "1. Перейдите на https://render.com" -ForegroundColor Gray
        Write-Host "2. New + → Static Site" -ForegroundColor Gray
        Write-Host "3. Выберите репозиторий event-tickets" -ForegroundColor Gray
        Write-Host "4. Publish Directory: ." -ForegroundColor Gray
        Write-Host "5. Create Static Site" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host "❌ Ошибка при отправке на GitHub!" -ForegroundColor Red
        Write-Host "Убедитесь, что репозиторий создан на GitHub" -ForegroundColor Yellow
    }
}

Write-Host ""
Read-Host "Нажмите Enter для выхода"
