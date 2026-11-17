@echo off
title Cloudflare Public HTTPS Tunnel
color 0B
echo ========================================================
echo   CLOUDFLARE PUBLIC HTTPS TUNNEL FOR WHATSAPP BRIDGE
echo ========================================================
echo.

cd /d "%~dp0"

REM Automatically download cloudflared.exe from official release if missing
if not exist "cloudflared.exe" (
    echo [INFO] cloudflared.exe not found. Downloading Cloudflare Tunnel binary (~50MB)...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Write-Host 'Downloading latest cloudflared-windows-amd64.exe...'; Invoke-WebRequest -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' -OutFile 'cloudflared.exe' -UseBasicParsing; Write-Host 'Download complete.'"
    if not exist "cloudflared.exe" (
        echo [ERROR] Failed to download cloudflared.exe. Please check your internet connection.
        pause
        exit /b 1
    )
)

echo Connecting your local WhatsApp bridge to the world...
echo Your public HTTPS URL will appear below shortly:
echo.
cloudflared.exe tunnel --url http://localhost:3000
pause
