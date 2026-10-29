<?php
/**
 * GRM WHATSAPP CRM — AUTHENTICATION BACKEND API
 * Handles Login, Session Validation, Role-Based Access Checks, and Logout with MySQL Integration
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
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';

$action = $_GET['action'] ?? 'check_session';

// Fallback user map if DB connection fails
$defaultUsers = [
    'admin' => [
        'id' => 'admin',
        'username' => 'admin',
        'password' => 'admin123',
        'name' => 'Super Admin',
        'role' => 'admin',
        'title' => 'Admin Manager (Full Control)',
        'avatar' => 'SA',
        'staff_id' => 'admin'
    ]
];

// =========================================================================
// 1. LOGIN ENDPOINT (POST)
// =========================================================================
if ($action === 'login' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    // Support Form POST as well
    $username = trim($data['username'] ?? ($_POST['username'] ?? ''));
    $password = trim($data['password'] ?? ($_POST['password'] ?? ''));
    $remember = !empty($data['remember']) || !empty($_POST['remember']);

    if (empty($username) || empty($password)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Please enter both username and password."
        ]);
        exit;
    }

    $matchedUser = null;

    // A. Check MySQL database
    $pdo = getDBConnection();
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(`username`) = LOWER(?) OR LOWER(`id`) = LOWER(?) OR LOWER(`email`) = LOWER(?) LIMIT 1");
            $stmt->execute([$username, $username, $username]);
            $dbUser = $stmt->fetch();

            if ($dbUser) {
                // Check plain or hashed password
                $isPassValid = password_verify($password, $dbUser['password']);
                if (!$isPassValid && $dbUser['password'] === $password) {
                    $isPassValid = true;
                    // Auto-upgrade legacy plaintext password to secure Bcrypt hash
                    try {
                        $newHash = password_hash($password, PASSWORD_BCRYPT);
                        $upStmt = $pdo->prepare("UPDATE `users` SET `password` = ? WHERE `id` = ?");
                        $upStmt->execute([$newHash, $dbUser['id']]);
                    } catch (Exception $e) {}
                }

                if ($isPassValid) {
                    $matchedUser = [
                        'id' => $dbUser['id'],
                        'username' => $dbUser['username'],
                        'name' => $dbUser['name'],
                        'role' => ($dbUser['id'] === 'admin' || $dbUser['role'] === 'admin') ? 'admin' : $dbUser['id'],
                        'title' => $dbUser['role'],
                        'avatar' => $dbUser['avatar'] ?: strtoupper(substr($dbUser['name'], 0, 2)),
                        'staff_id' => $dbUser['id'],
                        'email' => $dbUser['email'],
                        'phone' => $dbUser['phone'],
                        'status' => $dbUser['status']
                    ];
                }
            }
        } catch (Exception $e) {
            error_log("DB Auth query error: " . $e->getMessage());
        }
    }

    // B. Fallback to default user credentials if DB is not populated
    if (!$matchedUser) {
        $uLower = strtolower($username);
        foreach ($defaultUsers as $key => $u) {
            if ($key === $uLower || $u['username'] === $uLower || $u['id'] === $uLower) {
                if ($u['password'] === $password) {
                    $matchedUser = $u;
                    break;
                }
            }
        }
    }

    if ($matchedUser) {
        // Create active PHP session
        $_SESSION['user'] = $matchedUser;
        $_SESSION['logged_in_at'] = time();

        if ($remember) {
            // Set cookie for 30 days
            setcookie('GRM_REMEMBER_USER', base64_encode(json_encode($matchedUser)), time() + (86400 * 30), "/");
        }

        echo json_encode([
            "status" => "success",
            "message" => "Login authenticated successfully.",
            "user" => $matchedUser,
            "redirect_url" => "index.html"
        ]);
        exit;
    } else {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid username or password. Check credentials or use quick 1-click login."
        ]);
        exit;
    }
}

// =========================================================================
// 2. CHECK SESSION ENDPOINT (GET)
// =========================================================================
if ($action === 'check_session') {
    if (!empty($_SESSION['user'])) {
        echo json_encode([
            "status" => "success",
            "authenticated" => true,
            "user" => $_SESSION['user']
        ]);
        exit;
    }

    // Check remember me cookie
    if (!empty($_COOKIE['GRM_REMEMBER_USER'])) {
        $cookieData = json_decode(base64_decode($_COOKIE['GRM_REMEMBER_USER']), true);
        if ($cookieData) {
            $_SESSION['user'] = $cookieData;
            echo json_encode([
                "status" => "success",
                "authenticated" => true,
                "user" => $cookieData
            ]);
            exit;
        }
    }

    echo json_encode([
        "status" => "error",
        "authenticated" => false,
        "message" => "No active session found."
    ]);
    exit;
}

// =========================================================================
// 3. LOGOUT ENDPOINT (POST/GET)
// =========================================================================
if ($action === 'logout') {
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

    echo json_encode([
        "status" => "success",
        "message" => "Logged out successfully.",
        "redirect_url" => "login.html"
    ]);
    exit;
}

// Default response
echo json_encode(["status" => "error", "message" => "Invalid auth action requested"]);
exit;
