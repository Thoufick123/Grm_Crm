$body = @{
    sender_name = "Deepa Chandran"
    sender_phone = "+91 99401 88776"
    message_text = "Hello! Is the Baby Cotton Romper set available in Mint green for 0-6 months?"
    priority = "HIGH"
    assigned_to = "UNASSIGNED"
} | ConvertTo-Json

$res = Invoke-RestMethod -Uri "http://localhost:8080/api.php?action=receive_message" -Method Post -Body $body -ContentType "application/json"
Write-Output "Status: $($res.status)"
Write-Output "Message: $($res.message)"
Write-Output "Msg ID: $($res.data.id)"
