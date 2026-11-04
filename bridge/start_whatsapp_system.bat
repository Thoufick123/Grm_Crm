@echo off
title GRM WhatsApp Complete System Launcher
color 0E
echo ========================================================
echo   GRM WHATSAPP LIVE CLOUD SYSTEM (1-CLICK LAUNCHER)
echo ========================================================
echo.
echo 1. Starting Baileys WebSocket Bridge (Port 3000)...
start "GRM WhatsApp Bridge" cmd /k "cd /d %~dp0 && node server.js"

timeout /t 3 /nobreak >nul

echo 2. Starting Cloudflare Public Tunnel...
start "Cloudflare HTTPS Tunnel" cmd /k "cd /d %~dp0 && cloudflared.exe tunnel --url http://localhost:3000"

echo.
echo ========================================================
echo   BOTH SERVICES ARE NOW RUNNING IN SEPARATE WINDOWS!
echo   Look at the Cloudflare window for your https:// URL.
echo ========================================================
echo.
pause
