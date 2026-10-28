<?php
/**
 * GRM WHATSAPP CRM — MAIN APPLICATION DASHBOARD (PHP + HTML INTEGRATION)
 * Enforces server-side authentication, loads initial database state, and renders the application view.
 */
ini_set('session.gc_maxlifetime', 2592000); // 30-day session duration
session_set_cookie_params([
    'lifetime' => 2592000,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax'
]);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config/db.php';

// Server-Side Authentication Verification
if (empty($_SESSION['user'])) {
    if (!empty($_COOKIE['GRM_REMEMBER_USER'])) {
        $cookieData = json_decode(base64_decode($_COOKIE['GRM_REMEMBER_USER']), true);
        if ($cookieData) {
            $_SESSION['user'] = $cookieData;
        } else {
            header("Location: login.php");
            exit;
        }
    } else {
        header("Location: login.php");
        exit;
    }
}

$currentUser = $_SESSION['user'];
$isAdmin = ($currentUser['role'] === 'admin');

// Load configured WhatsApp account for initial render
$waPhone = '+91 86680 07593';
$brandName = 'GRM Garments Business Hub';

$configFile = __DIR__ . '/whatsapp_account_config.json';
if (file_exists($configFile)) {
    $cfg = json_decode(file_get_contents($configFile), true);
    if (!empty($cfg['phone_number'])) {
        $waPhone = $cfg['phone_number'];
        $brandName = $cfg['brand_name'] ?? $brandName;
    }
}

$pdo = getDBConnection();
if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM `whatsapp_accounts` WHERE `account_slot` = 'account_1' LIMIT 1");
        $wa = $stmt->fetch();
        if ($wa && !empty($wa['phone_number'])) {
            $waPhone = $wa['phone_number'];
            $brandName = $wa['brand_name'] ?: $brandName;
        }
    } catch (Exception $e) {}
}

// Load the complete HTML application from index.html (single source of truth for full UI, sidebar, headers & modals)
$html = file_get_contents(__DIR__ . '/index.html');

// Inject the server-side authentication session script into <head>
$sessionScript = '<script>
  window.PHP_USER_SESSION = ' . json_encode($currentUser) . ';
  try {
    localStorage.setItem("GRM_CRM_SESSION", JSON.stringify(window.PHP_USER_SESSION));
  } catch(e) {}
</script>';

// Replace </head> with session script + </head>
$html = str_replace('</head>', $sessionScript . "\n</head>", $html);

echo $html;
