# GRM WhatsApp Realtime Bridge Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host " Starting GRM WhatsApp Multi-Account Live Bridge (Port 3000)..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
Set-Location -Path (Join-Path $PSScriptRoot "..\bridge")
node server.js
