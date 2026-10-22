<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
$pdo->query("UPDATE products SET image = 'uploads/products/baby_frock.jpg' WHERE sku LIKE 'BF-%'");
$pdo->query("UPDATE products SET image = 'uploads/products/maternity_gown.jpg' WHERE sku LIKE 'MD-%'");
$pdo->query("UPDATE products SET image = 'uploads/products/kids_wear.jpg' WHERE sku LIKE 'T2-%'");
$pdo->query("UPDATE products SET image = 'uploads/products/sample_garment.jpg' WHERE sku IN ('S-XXL-MR-01', 'TTT-1Y-PK-01') OR image = '' OR image IS NULL");

echo "Database updated successfully!\n";
$rows = $pdo->query("SELECT id, sku, name, image FROM products")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo "ID: {$r['id']} | SKU: {$r['sku']} | Img: {$r['image']}\n";
}
