<?php
/**
 * GRM WHATSAPP CRM — LOGOUT CONTROLLER
 * Clears PHP session, auth cookies, and redirects cleanly to login.php.
 */
session_start();
$_SESSION = [];

if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

setcookie('GRM_REMEMBER_USER', '', time() - 3600, "/");
session_destroy();

header("Location: login.php");
exit;
