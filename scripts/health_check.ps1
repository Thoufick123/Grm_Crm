# =========================================================================
# GRM WhatsApp CRM — Production Health Diagnostics Script (PowerShell)
# =========================================================================

Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   GRM WhatsApp CRM - Production System Health Diagnostic " -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host ""

$results = @()

# 1. Check Node.js Bridge on Port 3000
try {
    $bridgeRes = $null
    try {
        $bridgeRes = Invoke-RestMethod -Uri "http://localhost:3000/api/health" -Method Get -TimeoutSec 2 -ErrorAction Stop
    } catch {
        $bridgeRes = Invoke-RestMethod -Uri "http://localhost:3000/api/status" -Method Get -TimeoutSec 2 -ErrorAction Stop
    }

    if ($bridgeRes) {
        $connStatus = if ($bridgeRes.status -eq 'UP') { "UP (Healthy)" } else { "UP ($($bridgeRes.connection))" }
        $connNum = if ($bridgeRes.connected_number) { $bridgeRes.connected_number } else { "Awaiting QR scan" }
        $results += [PSCustomObject]@{
            Service = "Node.js Baileys Bridge (:3000)"
            Status  = $connStatus
            Details = "Line 1 Number: $connNum"
        }
    }
} catch {
    $results += [PSCustomObject]@{
        Service = "Node.js Baileys Bridge (:3000)"
        Status  = "DOWN (Offline)"
        Details = "Could not reach http://localhost:3000"
    }
}

# 2. Check PHP Backend API on Port 8080
try {
    $apiRes = Invoke-RestMethod -Uri "http://localhost:8080/api.php?action=health_check" -Method Get -TimeoutSec 3 -ErrorAction Stop
    $dbStat = $apiRes.checks.database.status
    $dbLat = $apiRes.checks.database.latency_ms
    $cCount = $apiRes.checks.database.counts.customers
    $oCount = $apiRes.checks.database.counts.orders
    $pCount = $apiRes.checks.database.counts.products

    $results += [PSCustomObject]@{
        Service = "PHP REST Backend API (:8080)"
        Status  = "$($apiRes.status) (Latency: $($apiRes.total_latency_ms)ms)"
        Details = "Service: $($apiRes.service), Uploads: $($apiRes.checks.filesystem.status)"
    }

    $results += [PSCustomObject]@{
        Service = "MySQL Database (grm_crm_db)"
        Status  = "$dbStat (Latency: ${dbLat}ms)"
        Details = "Customers: $cCount, Orders: $oCount, Products: $pCount"
    }
} catch {
    $results += [PSCustomObject]@{
        Service = "PHP REST Backend API (:8080)"
        Status  = "DOWN / Not Running"
        Details = "Start Apache via XAMPP or docker-compose up"
    }
}

# Format & Print Table
$results | Format-Table -AutoSize

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host " Diagnostics Complete!" -ForegroundColor Green
Write-Host "=========================================================" -ForegroundColor Cyan
