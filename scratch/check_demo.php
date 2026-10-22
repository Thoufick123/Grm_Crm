<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
$rows = $pdo->query("SELECT id, sku, name, category, subcategory, image FROM products")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as &$r) {
    $r['image_len'] = strlen($r['image'] ?? '');
    $r['image_snippet'] = substr($r['image'] ?? '', 0, 70);
}
echo json_encode($rows, JSON_PRETTY_PRINT);
