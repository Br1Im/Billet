@echo off
chcp 65001 >nul
echo ========================================
echo   EventTickets - Деплой на GitHub
echo ========================================
echo.

REM Проверка Git
where git >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Git не установлен!
    echo Скачайте Git с https://git-scm.com/download/win
    pause
    exit /b 1
)

echo ✅ Git установлен
echo.

REM Запрос GitHub username
set /p GITHUB_USERNAME="Введите ваш GitHub username: "
if "%GITHUB_USERNAME%"=="" (
    echo ❌ Username не может быть пустым!
    pause
    exit /b 1
)

echo.
echo 📦 Инициализация Git репозитория...
git init

echo.
echo 📝 Добавление файлов...
git add .

echo.
echo 💾 Создание коммита...
git commit -m "Initial commit: EventTickets v2.0"

echo.
echo 🌿 Переименование ветки в main...
git branch -M main

echo.
echo 🔗 Добавление remote origin...
git remote add origin https://github.com/%GITHUB_USERNAME%/event-tickets.git

echo.
echo ========================================
echo   Следующие шаги:
echo ========================================
echo.
echo 1. Создайте репозиторий на GitHub:
echo    https://github.com/new
echo.
echo 2. Название: event-tickets
echo 3. Описание: Современная система продажи билетов
echo 4. Public или Private (на ваш выбор)
echo 5. НЕ добавляйте README, .gitignore, license
echo.
echo 6. После создания репозитория, выполните:
echo    git push -u origin main
echo.
echo ========================================
echo.

pause
