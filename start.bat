@echo off
echo ========================================
echo    EventTickets Server Starting...
echo ========================================
echo.

cd server

echo Installing dependencies...
call npm install --silent

echo.
echo Initializing database...
call node scripts/init-db.js

echo.
echo Starting server...
echo.
echo Server will be available at:
echo   Client: http://localhost:3000
echo   Admin:  http://localhost:3000/admin
echo   API:    http://localhost:3000/api/status
echo.
echo Press Ctrl+C to stop the server
echo ========================================

call node server.js

pause