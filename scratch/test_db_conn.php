<?php
require_once __DIR__ . '/../config/db.php';
$pdo = getDBConnection();
if (!$pdo) {
    die("NO_PDO\n");
}
$tables = ['users','customers','queries','messages','orders','followups','products'];
foreach ($tables as $t) {
    try {
        $c = $pdo->query("SELECT COUNT(*) FROM `$t`")->fetchColumn();
        echo "$t: $c rows\n";
    } catch (Exception $e) {
        echo "$t: ERROR " . $e->getMessage() . "\n";
    }
}
