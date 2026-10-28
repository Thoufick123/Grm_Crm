@echo off
title GRM WhatsApp CRM — Production Startup Orchestrator
color 0A
cd /d "%~dp0\.."

echo =========================================================================
echo       GRM WHATSAPP CRM & BUSINESS HUB — PRODUCTION LAUNCHER
echo =========================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH! Please install Node.js 18+.
    pause
    exit /b 1
)

:: 2. Check Database port 3306 or 3307
echo [1/4] Verifying MySQL Database Connection...
netstat -an | find "3306" | find "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo       [OK] MySQL Server is listening on Port 3306.
) else (
    netstat -an | find "3307" | find "LISTENING" >nul
    if %ERRORLEVEL% equ 0 (
        echo       [OK] MySQL Server is listening on Port 3307.
    ) else (
        echo       [NOTICE] MySQL not detected on 3306 or 3307. Please ensure XAMPP MySQL is started.
    )
)

:: 3. Start PHP Built-in Server on Port 8080 (if not already running)
echo.
echo [2/4] Verifying PHP Web Server (Port 8080)...
netstat -an | find "8080" | find "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo       [OK] PHP Web Server already listening on Port 8080.
) else (
    echo       [STARTING] Launching PHP server on http://localhost:8080...
    start "GRM WhatsApp CRM — PHP Server (Port 8080)" cmd /k "php -S 0.0.0.0:8080"
)

:: 4. Start WhatsApp Bridge via PM2 or Node fallback
echo.
echo [3/4] Initializing WhatsApp Real-time Multi-Line Bridge (Port 3000)...
netstat -an | find "3000" | find "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo       [OK] WhatsApp Bridge already listening on Port 3000.
) else (
    where pm2 >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        echo       [PM2 Found] Starting bridge with PM2 process supervisor...
        call pm2 start ecosystem.config.js
        call pm2 status
    ) else (
        echo       [Node Direct] Launching Bridge daemon in background window...
        start "GRM WhatsApp Bridge Daemon" cmd /k "cd bridge && node server.js"
    )
)

:: 5. Verify Endpoints
echo.
echo [4/4] System Ready! Opening CRM Dashboard...
timeout /t 2 >nul

start http://localhost:8080/index.html
start http://localhost:3000/api/health

echo.
echo =========================================================================
echo   CRM Web Workstation: http://localhost:8080/index.html
echo   Node Baileys Bridge: http://localhost:3000/api/health
echo   REST Health Check:   http://localhost:8080/api.php?action=health_check
echo =========================================================================
echo.
pause
