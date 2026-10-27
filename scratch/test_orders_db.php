<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
if (!$pdo) {
    echo "DB Connection Failed\n";
    exit(1);
}
echo "DB Connected successfully\n";
$stmt = $pdo->query("SHOW COLUMNS FROM orders");
$cols = $stmt->fetchAll(PDO::FETCH_COLUMN);
echo "Columns in orders table: " . implode(', ', $cols) . "\n";

$cnt = $pdo->query("SELECT COUNT(*) FROM orders")->fetchColumn();
echo "Total orders count: " . $cnt . "\n";

if ($cnt > 0) {
    $rows = $pdo->query("SELECT id, customer_name, staff_name, order_status, grand_total FROM orders LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    print_r($rows);
}
