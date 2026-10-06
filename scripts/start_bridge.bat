@echo off
title GRM WhatsApp Realtime Bridge (Port 3000)
cd /d "%~dp0\..\bridge"
echo ========================================================
echo  Starting GRM WhatsApp Multi-Account Live Bridge...
echo ========================================================
node server.js
pause
