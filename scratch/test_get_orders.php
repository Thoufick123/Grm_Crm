<?php
$res = file_get_contents('http://localhost:8000/api.php?action=get_orders');
echo "Response length: " . strlen($res) . "\n";
$data = json_decode($res, true);
echo "Status: " . ($data['status'] ?? 'unknown') . "\n";
echo "Orders count: " . count($data['orders'] ?? []) . "\n";
if (!empty($data['orders'])) {
    foreach ($data['orders'] as $ord) {
        echo "Order: {$ord['id']} | Customer: {$ord['customerName']} | Staff: {$ord['staffName']} | Status: {$ord['orderStatus']} | Total: {$ord['grandTotal']}\n";
    }
}
