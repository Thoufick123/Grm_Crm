<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
if (!$pdo) {
    echo "DB Offline\n";
    exit(1);
}

// Check orders
$orders = $pdo->query("SELECT id, customer_name, staff_id, staff_name, grand_total FROM orders")->fetchAll(PDO::FETCH_ASSOC);
echo "Current orders in DB:\n";
print_r($orders);

// Update any order for Suguna or SugunaMani that is assigned to 'admin' or has no staff
$stmt = $pdo->prepare("UPDATE orders SET staff_id = 'staff_02', staff_name = 'Rahul Verma', created_by = 'Rahul Verma' WHERE (customer_name LIKE '%Suguna%' OR customer_name = 'SugunaMani') AND (staff_id = 'admin' OR staff_id IS NULL OR staff_id = '')");
$stmt->execute();
echo "Updated Suguna orders affected: " . $stmt->rowCount() . "\n";
