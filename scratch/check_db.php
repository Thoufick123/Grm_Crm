<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
if ($pdo) {
    $cols = $pdo->query("SHOW COLUMNS FROM `customers`")->fetchAll(PDO::FETCH_COLUMN);
    echo "Columns in customers table: " . implode(', ', $cols) . "\n";
} else {
    echo "PDO not connected\n";
}
