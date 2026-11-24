<?php
/**
 * GRM WHATSAPP CRM — MAIN APPLICATION DASHBOARD (PHP + HTML INTEGRATION)
 * Enforces server-side authentication, loads initial database state, and renders the application view.
 */
date_default_timezone_set('Asia/Kolkata');
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
// Prevent caching of the main CRM HTML wrapper so dynamic asset versioning is always applied
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Pragma: no-cache");
header("Expires: Sat, 26 Jul 1997 05:00:00 GMT");
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

// Cache bust crm_app.js dynamically so browser always gets latest version without caching
$jsVer = file_exists(__DIR__ . '/crm_app.js') ? filemtime(__DIR__ . '/crm_app.js') : time();
$html = preg_replace('/crm_app\.js(\?v=[^\"]*)?/', 'crm_app.js?v=' . $jsVer, $html);

// Inject the server-side authentication session script and bridge URL into <head>
$isLocalHost = empty($_SERVER['HTTP_HOST']) || in_array(strtolower(explode(':', $_SERVER['HTTP_HOST'])[0]), ['localhost', '127.0.0.1', '::1']);
$bridgeUrl = defined('BRIDGE_URL') ? BRIDGE_URL : ($isLocalHost ? 'http://localhost:3000' : 'https://mediumturquoise-dugong-987946.hostingersite.com');
if (!$isLocalHost && (strpos($bridgeUrl, 'localhost') !== false || strpos($bridgeUrl, '127.0.0.1') !== false)) {
    $bridgeUrl = 'https://mediumturquoise-dugong-987946.hostingersite.com';
}
$sessionScript = '<script>
  (function() {
    var isRemote = window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1";
    var bUrl = ' . json_encode($bridgeUrl) . ';
    if (isRemote && (!bUrl || bUrl.indexOf("localhost") !== -1 || bUrl.indexOf("127.0.0.1") !== -1)) {
      bUrl = "https://mediumturquoise-dugong-987946.hostingersite.com";
    }
    window.BRIDGE_URL = bUrl;
    try {
      if (isRemote) {
        var st = localStorage.getItem("GRM_BRIDGE_URL");
        if (st && (st.indexOf("localhost") !== -1 || st.indexOf("127.0.0.1") !== -1 || st.indexOf(window.location.hostname) !== -1)) {
          localStorage.removeItem("GRM_BRIDGE_URL");
        }
      }
      localStorage.setItem("GRM_BRIDGE_URL", bUrl);
    } catch(e) {}
  })();
  window.PHP_USER_SESSION = ' . json_encode($currentUser) . ';
  try {
    localStorage.setItem("GRM_CRM_SESSION", JSON.stringify(window.PHP_USER_SESSION));
  } catch(e) {}
</script>';

// Replace </head> with session script + </head>
$html = str_replace('</head>', $sessionScript . "\n</head>", $html);

echo $html;
