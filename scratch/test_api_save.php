<?php
$data = json_encode([
    "id" => "TEST-ORD-01",
    "customerId" => "cust_101",
    "customerName" => "Test Cust",
    "items" => [
        ["name" => "Embroidered Cotton Baby Frock", "sku" => "BF-001-PK", "qty" => 1, "price" => 599]
    ],
    "grandTotal" => 599.00,
    "paymentMethod" => "COD",
    "paymentStatus" => "PARTIAL_PAID",
    "orderStatus" => "STOCK_RESERVED",
    "createdBy" => "Admin"
]);

$ch = curl_init("http://localhost:8000/api.php?action=save_order");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
$res = curl_exec($ch);
echo "RESPONSE: " . $res . "\n";
