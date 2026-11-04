Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "   GRM WhatsApp Bridge - Live Cloudflare Link" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host ""

$logFile = "$env:USERPROFILE\.pm2\logs\cf-tunnel-error.log"

if (Test-Path $logFile) {
    $match = (Get-Content $logFile | Select-String "https://.*\.trycloudflare\.com" | Select-Object -Last 1)
    if ($match -and $match.Matches) {
        $link = $match.Matches.Value
        Write-Host "Your Current Live Link:" -ForegroundColor White
        Write-Host $link -ForegroundColor Green
        $link | Set-Clipboard
        Write-Host ""
        Write-Host "(Link has been copied to your clipboard automatically!)" -ForegroundColor Yellow
    } else {
        Write-Host "No active tunnel link found in logs." -ForegroundColor Red
        Write-Host "Make sure PM2 is running by typing: pm2 resurrect" -ForegroundColor Yellow
    }
} else {
    Write-Host "PM2 log file not found. Please start PM2 first." -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================================" -ForegroundColor Cyan
