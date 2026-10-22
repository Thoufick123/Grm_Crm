<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
$count = $pdo->query('SELECT COUNT(*) FROM products')->fetchColumn();
echo "Total products count: " . $count . "\n";
$rows = $pdo->query('SELECT id, name, sku, category, subcategory, image, physical_stock FROM products ORDER BY id DESC')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "ID: {$r['id']} | SKU: {$r['sku']} | Name: {$r['name']} | Cat: {$r['category']} | ImgLen: " . strlen($r['image']) . " | Img: " . substr($r['image'], 0, 50) . "\n";
}
