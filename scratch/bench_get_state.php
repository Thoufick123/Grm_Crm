<?php
$start = microtime(true);
$_GET['action'] = 'get_state';
ob_start();
include __DIR__ . '/../api.php';
$output = ob_get_clean();
$time = microtime(true) - $start;
echo "Time to run get_state: " . round($time * 1000, 2) . " ms\n";
echo "Output length: " . strlen($output) . " bytes\n";

