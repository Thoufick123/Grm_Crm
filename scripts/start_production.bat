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

:: 2. Check Database port 3306
echo [1/3] Verifying MySQL Database Connection (Port 3306)...
netstat -an | find "3306" | find "LISTENING" >nul
if %ERRORLEVEL% equ 0 (
    echo       [OK] MySQL Server is listening on Port 3306.
) else (
    echo       [NOTICE] MySQL not detected on 3306. Please ensure XAMPP MySQL / MariaDB is started.
)

:: 3. Start WhatsApp Bridge via PM2 or Node fallback
echo.
echo [2/3] Initializing WhatsApp Real-time Multi-Line Bridge...
where pm2 >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo       [PM2 Found] Starting bridge with PM2 process supervisor...
    call pm2 start ecosystem.config.js
    call pm2 status
) else (
    echo       [Node Direct] Launching Bridge daemon in background window...
    start "GRM WhatsApp Bridge Daemon" cmd /k "cd bridge && node server.js"
)

:: 4. Verify Endpoints
echo.
echo [3/3] System Ready! Opening CRM Dashboard...
timeout /t 2 >nul

start http://localhost:8080/index.php
start http://localhost:3000/api/health

echo.
echo =========================================================================
echo   CRM Web Workstation: http://localhost:8080/index.php
echo   Node Baileys Bridge: http://localhost:3000/api/health
echo   REST Health Check:   http://localhost:8080/api.php?action=health_check
echo =========================================================================
echo.
pause
