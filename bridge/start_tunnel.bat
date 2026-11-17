@echo off
title Cloudflare Public HTTPS Tunnel
color 0B
echo ========================================================
echo   CLOUDFLARE PUBLIC HTTPS TUNNEL FOR WHATSAPP BRIDGE
echo ========================================================
echo.
echo Connecting your local WhatsApp bridge to the world...
echo Your public HTTPS URL will appear below shortly:
echo.
cd /d "%~dp0"
cloudflared.exe tunnel --url http://localhost:3000
pause
