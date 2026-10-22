<?php
$_GET['action'] = 'get_all';
ob_start();
include __DIR__ . '/../api.php';
$output = ob_get_clean();
echo "Status code: " . http_response_code() . "\n";
echo "Output length: " . strlen($output) . "\n";
echo "Preview: " . substr($output, 0, 300) . "\n";
