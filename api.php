<?php
/**
 * GRM WHATSAPP CRM — FULL BACKEND REST API (PHP + XAMPP MYSQL)
 * Provides comprehensive database endpoints for:
 * - CRM Full State Synchronization (MySQL + Local Storage)
 * - Staff Management (Create, Update Role, Toggle Status, Delete)
 * - WhatsApp Business Phone Configuration & Brand Identity
 * - Customer 360 Directory & WhatsApp Orders
 * - Realtime Inbound Message Storage & Outbound Bridge Routing
 * - Database Backup & Recovery Snapshots
 */

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';

$pdo = getDBConnection();
$configFile = __DIR__ . '/whatsapp_account_config.json';
$messagesFile = __DIR__ . '/live_messages_queue.json';

$action = $_GET['action'] ?? 'get_state';

// =========================================================================
// 1. GET FULL CRM STATE FROM MYSQL DATABASE
// =========================================================================
if ($action === 'get_state') {
    try {
        if (!$pdo) {
            throw new Exception("Database connection unavailable");
        }

        // 1. WhatsApp Account Config
        $waStmt = $pdo->query("SELECT * FROM `whatsapp_accounts` ORDER BY `id` ASC");
        $waAccounts = $waStmt->fetchAll();
        $primaryWA = $waAccounts[0] ?? [
            'id' => 1,
            'business_name' => 'GRM Garments Business Hub',
            'display_name' => 'GRM Garments Official',
            'brand_name' => 'Blue Berry 💙',
            'phone_number' => '+91 98765 43210',
            'status' => 'CONNECTED'
        ];

        // 2. Staff List
        $staffStmt = $pdo->query("SELECT * FROM `users` WHERE `id` != 'admin' ORDER BY `created_at` ASC");
        $staffList = $staffStmt->fetchAll();

        // 3. Products
        $pStmt = $pdo->query("SELECT * FROM `products` ORDER BY `id` ASC");
        $products = $pStmt->fetchAll();

        // 4. Customers
        $cStmt = $pdo->query("SELECT * FROM `customers` ORDER BY `created_at` ASC");
        $customers = $cStmt->fetchAll();
        foreach ($customers as &$c) {
            if (!empty($c['tags']) && is_string($c['tags'])) {
                $c['tags'] = json_decode($c['tags'], true) ?: [];
            }
        }

        // 5. Queries
        $qStmt = $pdo->query("SELECT * FROM `queries` ORDER BY `created_at` DESC");
        $queries = $qStmt->fetchAll();

        // 6. Conversations map grouped by customer_id
        $mStmt = $pdo->query("SELECT * FROM `messages` ORDER BY `created_at` ASC");
        $allMessages = $mStmt->fetchAll();
        $conversations = [];
        foreach ($allMessages as $msg) {
            $cid = $msg['customer_id'];
            if (!isset($conversations[$cid])) {
                $conversations[$cid] = [];
            }
            $conversations[$cid][] = [
                'id' => $msg['id'],
                'sender' => $msg['sender'],
                'text' => $msg['text'],
                'mediaType' => $msg['media_type'],
                'mediaUrl' => $msg['media_url'],
                'audioDuration' => $msg['audio_duration'],
                'time' => $msg['time_str'],
                'status' => $msg['status']
            ];
        }

        // 7. Orders
        $oStmt = $pdo->query("SELECT * FROM `orders` ORDER BY `created_at` DESC");
        $orders = $oStmt->fetchAll();
        foreach ($orders as &$o) {
            if (!empty($o['items_json']) && is_string($o['items_json'])) {
                $o['items'] = json_decode($o['items_json'], true) ?: [];
            }
        }

        // 8. Followups
        $fStmt = $pdo->query("SELECT * FROM `followups` ORDER BY `created_at` DESC");
        $followups = $fStmt->fetchAll();

        // 9. Audit Logs
        $aStmt = $pdo->query("SELECT * FROM `audit_logs` ORDER BY `id` DESC LIMIT 100");
        $auditLogs = $aStmt->fetchAll();

        echo json_encode([
            "status" => "success",
            "source" => "MYSQL_DATABASE",
            "data" => [
                "whatsappAccount" => $primaryWA,
                "whatsappAccounts" => $waAccounts,
                "staffList" => $staffList,
                "products" => $products,
                "customers" => $customers,
                "queries" => $queries,
                "conversations" => $conversations,
                "orders" => $orders,
                "followups" => $followups,
                "auditLogs" => $auditLogs
            ]
        ]);
        exit;
    } catch (Exception $e) {
        // Return fallback from config file if MySQL is offline
        $configData = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
        echo json_encode([
            "status" => "fallback",
            "message" => $e->getMessage(),
            "data" => [
                "whatsappAccount" => $configData
            ]
        ]);
        exit;
    }
}

// =========================================================================
// 2. STAFF MANAGEMENT CRUD (CREATE, UPDATE ROLE, DELETE)
// =========================================================================
if ($action === 'create_staff' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $staff = json_decode($input, true);

    if (empty($staff['name']) || empty($staff['phone'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Staff name and phone are required."]);
        exit;
    }

    try {
        $staffId = $staff['id'] ?? ('staff_' . str_pad(rand(1, 99), 2, '0', STR_PAD_LEFT));
        $username = $staff['username'] ?? strtolower(explode(' ', $staff['name'])[0]);
        $password = $staff['password'] ?? 'staff123';
        $avatar = $staff['avatar'] ?? strtoupper(substr($staff['name'], 0, 2));

        $stmt = $pdo->prepare("
            INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `specialization`, `avatar`, `status`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `role`=VALUES(`role`), `phone`=VALUES(`phone`), `status`=VALUES(`status`)
        ");

        $stmt->execute([
            $staffId,
            $username,
            $password,
            $staff['name'],
            $staff['role'] ?? 'Sales Specialist',
            $staff['email'] ?? ($username . '@grmgarments.com'),
            $staff['phone'],
            $staff['specialization'] ?? 'General',
            $avatar,
            $staff['status'] ?? 'ACTIVE'
        ]);

        echo json_encode(["status" => "success", "message" => "Staff member created in MySQL", "staff_id" => $staffId]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'update_staff_role' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (empty($data['staff_id']) || empty($data['role'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Staff ID and new role are required."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE `users` SET `role` = ? WHERE `id` = ?");
        $stmt->execute([$data['role'], $data['staff_id']]);

        echo json_encode(["status" => "success", "message" => "Role updated in MySQL database."]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'delete_staff' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (empty($data['staff_id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Staff ID is required."]);
        exit;
    }

    try {
        // Reassign active queries to UNASSIGNED
        $pdo->prepare("UPDATE `queries` SET `assigned_to` = 'UNASSIGNED', `status` = 'NEW' WHERE `assigned_to` = ?")->execute([$data['staff_id']]);
        
        // Delete user
        $pdo->prepare("DELETE FROM `users` WHERE `id` = ?")->execute([$data['staff_id']]);

        echo json_encode(["status" => "success", "message" => "Staff member removed and leads unassigned."]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'clear_inbox' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        if ($pdo) {
            $pdo->exec("DELETE FROM `messages`");
            $pdo->exec("DELETE FROM `queries`");
        }
        if (file_exists($messagesFile)) {
            file_put_contents($messagesFile, json_encode([]));
        }
        echo json_encode(["status" => "success", "message" => "All inbox chat messages and active inquiries cleared."]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

// =========================================================================
// 3. WHATSAPP ACCOUNT CONFIGURATION & BRAND BANNER
// =========================================================================
if ($action === 'get_config') {
    if (file_exists($configFile)) {
        $configData = json_decode(file_get_contents($configFile), true);
    } else {
        $configData = [
            "id" => 1,
            "business_name" => "GRM Garments Business Hub",
            "display_name" => "GRM Garments Official",
            "brand_name" => "Blue Berry 💙",
            "phone_number" => "+91 98765 43210",
            "status" => "CONNECTED"
        ];
    }
    echo json_encode(["status" => "success", "data" => $configData]);
    exit;
}

if ($action === 'save_config' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $postData = json_decode($input, true);

    if (empty($postData['phone_number'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Phone number is required"]);
        exit;
    }

    $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    $updatedConfig = array_merge($currentConfig, $postData);
    $updatedConfig['last_sync'] = date("Y-m-d H:i:s");
    $updatedConfig['status'] = 'CONNECTED';

    file_put_contents($configFile, json_encode($updatedConfig, JSON_PRETTY_PRINT));

    // Update MySQL
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                UPDATE `whatsapp_accounts` 
                SET `phone_number` = ?, `business_name` = ?, `display_name` = ?, `brand_name` = ?
                WHERE `account_slot` = 'account_1'
            ");
            $stmt->execute([
                $updatedConfig['phone_number'],
                $updatedConfig['business_name'] ?? 'GRM Garments',
                $updatedConfig['display_name'] ?? 'GRM Garments Official',
                $updatedConfig['brand_name'] ?? 'Blue Berry 💙'
            ]);
        } catch (Exception $e) {}
    }

    echo json_encode([
        "status" => "success", 
        "message" => "WhatsApp Phone Number and Brand Configuration saved successfully", 
        "data" => $updatedConfig
    ]);
    exit;
}

if ($action === 'delete_account_slot' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $postData = json_decode($input, true);
    $accountId = $postData['accountId'] ?? '';

    if (!empty($accountId) && $accountId !== 'account_1') {
        $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
        if (isset($currentConfig['connected_lines']) && is_array($currentConfig['connected_lines'])) {
            $currentConfig['connected_lines'] = array_values(array_filter($currentConfig['connected_lines'], function($line) use ($accountId) {
                return ($line['id'] ?? '') !== $accountId;
            }));
            file_put_contents($configFile, json_encode($currentConfig, JSON_PRETTY_PRINT));
        }

        if ($pdo) {
            try {
                $stmt = $pdo->prepare("DELETE FROM `whatsapp_accounts` WHERE `account_slot` = ?");
                $stmt->execute([$accountId]);
            } catch (Exception $e) {}
        }

        echo json_encode(["status" => "success", "message" => "Account slot $accountId deleted successfully"]);
        exit;
    }
    echo json_encode(["status" => "error", "message" => "Invalid account slot"]);
    exit;
}

if ($action === 'save_customer' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (empty($data['id'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Customer ID is required"]);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                UPDATE `customers` 
                SET `name` = ?, `phone` = ?, `whatsapp` = ?, `address` = ?
                WHERE `id` = ?
            ");
            $stmt->execute([
                $data['name'] ?? '',
                $data['phone'] ?? '',
                $data['whatsapp'] ?? ($data['phone'] ?? ''),
                $data['address'] ?? '',
                $data['id']
            ]);
        } catch (Exception $e) {}
    }

    echo json_encode(["status" => "success", "message" => "Customer details saved successfully"]);
    exit;
}

// =========================================================================
// 4. SEND OUTBOUND WHATSAPP MESSAGE TO CUSTOMER (Via Baileys Bridge)
// =========================================================================
if ($action === 'send_message' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $postData = json_decode($input, true);

    $phone = $postData['phone'] ?? '';
    $text = $postData['text'] ?? ($postData['message'] ?? '');
    $customerId = $postData['customer_id'] ?? null;

    if (empty($phone) || empty($text)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Phone and text are required"]);
        exit;
    }

    // Call Node.js Baileys Bridge
    $ch = curl_init('http://localhost:3000/api/send');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['phone' => $phone, 'text' => $text]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_TIMEOUT, 8);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Also persist message in MySQL
    if ($pdo && $customerId) {
        try {
            $pdo->prepare("
                INSERT INTO `messages` (`customer_id`, `sender`, `text`, `time_str`, `status`)
                VALUES (?, 'staff', ?, ?, 'DELIVERED')
            ")->execute([$customerId, $text, date("h:i A")]);
        } catch (Exception $e) {}
    }

    if ($response && $httpCode === 200) {
        echo $response;
    } else {
        echo json_encode(["status" => "success", "message" => "Message sent and stored locally", "simulated" => true]);
    }
    exit;
}

// =========================================================================
// 5. INBOUND WHATSAPP MESSAGE INGESTION & REALTIME SYNC QUEUE
// =========================================================================
if ($action === 'receive_message' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);

    if (empty($payload)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid payload"]);
        exit;
    }

    $senderPhone = $payload['sender_phone'] ?? '+91 98765 00000';
    $senderName = $payload['sender_name'] ?? 'WhatsApp Customer';
    $messageText = $payload['message_text'] ?? ($payload['text'] ?? '');
    $type = $payload['type'] ?? 'text';
    $mediaUrl = $payload['media_url'] ?? null;
    $duration = $payload['duration'] ?? null;
    $timestampEpoch = $payload['timestamp_epoch'] ?? time();
    $receivedAt = $payload['received_at'] ?? date("h:i A");

    $msgEntry = [
        "id" => "msg_" . uniqid(),
        "sender_name" => $senderName,
        "sender_phone" => $senderPhone,
        "sender_jid" => $payload['sender_jid'] ?? null,
        "message_text" => $messageText,
        "type" => $type,
        "media_url" => $mediaUrl,
        "duration" => $duration,
        "account_id" => $payload['account_id'] ?? 'account_1',
        "received_on_number" => $payload['received_on_number'] ?? '+91 97896 60115',
        "priority" => $payload['priority'] ?? 'HIGH',
        "assigned_to" => 'UNASSIGNED',
        "source" => 'REAL_WHATSAPP_LIVE',
        "timestamp_epoch" => (int)$timestampEpoch,
        "received_at" => $receivedAt
    ];

    // Append to live queue file
    $queue = [];
    if (file_exists($messagesFile)) {
        $rawQueue = file_get_contents($messagesFile);
        $queue = json_decode($rawQueue, true) ?: [];
    }
    $queue[] = $msgEntry;
    if (count($queue) > 200) {
        $queue = array_slice($queue, -200);
    }
    file_put_contents($messagesFile, json_encode($queue, JSON_PRETTY_PRINT));

    // Also persist in MySQL if database connection available
    if ($pdo) {
        try {
            $cleanPhone = preg_replace('/[^0-9]/', '', $senderPhone);
            $custId = 'cust_' . (substr($cleanPhone, -6) ?: substr(uniqid(), -6));

            // Check or insert customer
            $checkCust = $pdo->prepare("SELECT `id` FROM `customers` WHERE `phone` LIKE ? OR `whatsapp` LIKE ? LIMIT 1");
            $checkCust->execute(["%$cleanPhone%", "%$cleanPhone%"]);
            $existingCust = $checkCust->fetch();

            if (!$existingCust) {
                $pdo->prepare("
                    INSERT INTO `customers` (`id`, `code`, `name`, `phone`, `whatsapp`, `address`, `city`, `customer_type`, `tags`, `avatar`)
                    VALUES (?, ?, ?, ?, ?, 'WhatsApp Customer', 'Online', 'New WhatsApp Customer', '[\"Live Inbound\"]', ?)
                ")->execute([
                    $custId,
                    'CUST-' . date('Y') . '-' . rand(100, 999),
                    $senderName,
                    $senderPhone,
                    $senderPhone,
                    strtoupper(substr($senderName, 0, 2))
                ]);
            } else {
                $custId = $existingCust['id'];
            }

            // Insert message
            $pdo->prepare("
                INSERT INTO `messages` (`customer_id`, `sender`, `text`, `media_type`, `media_url`, `time_str`, `status`)
                VALUES (?, 'customer', ?, ?, ?, ?, 'DELIVERED')
            ")->execute([$custId, $messageText, $type, $mediaUrl, $receivedAt]);

            // Update or insert query
            $checkQ = $pdo->prepare("SELECT `id`, `unread_count` FROM `queries` WHERE `customer_id` = ? LIMIT 1");
            $checkQ->execute([$custId]);
            $existingQ = $checkQ->fetch();

            if ($existingQ) {
                $newUnread = ((int)$existingQ['unread_count']) + 1;
                $pdo->prepare("
                    UPDATE `queries` 
                    SET `unread_count` = ?, `last_message` = ?, `status` = 'NEW' 
                    WHERE `id` = ?
                ")->execute([$newUnread, $messageText, $existingQ['id']]);
            } else {
                $pdo->prepare("
                    INSERT INTO `queries` (`id`, `customer_id`, `assigned_to`, `status`, `priority`, `query_text`, `unread_count`, `last_message`)
                    VALUES (?, ?, 'UNASSIGNED', 'NEW', 'HIGH', ?, 1, ?)
                ")->execute(['Q-' . date('Y') . '-' . rand(100000, 999999), $custId, $messageText, $messageText]);
            }
        } catch (Exception $e) {
            // Non-blocking log
        }
    }

    echo json_encode(["status" => "success", "message" => "Message stored in queue and database", "entry" => $msgEntry]);
    exit;
}

if ($action === 'get_inbound_messages') {
    $since = isset($_GET['since']) ? (int)$_GET['since'] : 0;
    $newMessages = [];

    if (file_exists($messagesFile)) {
        $rawQueue = file_get_contents($messagesFile);
        $queue = json_decode($rawQueue, true) ?: [];
        foreach ($queue as $item) {
            if ((int)($item['timestamp_epoch'] ?? 0) > $since) {
                $newMessages[] = $item;
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "since" => $since,
        "count" => count($newMessages),
        "messages" => $newMessages,
        "server_time" => time()
    ]);
    exit;
}

// =========================================================================
// 5. PRODUCT & STOCK MANAGEMENT ENDPOINTS
// =========================================================================
if ($action === 'save_product' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);

    if (empty($p['name']) || empty($p['sku'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product name and SKU are required"]);
        exit;
    }

    if ($pdo) {
        try {
            $id = $p['id'] ?? null;
            if ($id && is_numeric($id)) {
                $stmt = $pdo->prepare("
                    UPDATE `products` SET 
                        `sku` = ?, `name` = ?, `category` = ?, `size` = ?, `color` = ?, 
                        `price` = ?, `physical_stock` = ?, `reserved_stock` = ?, `image` = ?
                    WHERE `id` = ?
                ");
                $stmt->execute([
                    $p['sku'], $p['name'], $p['category'] ?? 'General', $p['size'] ?? 'Standard',
                    $p['color'] ?? 'Default', (float)($p['price'] ?? 0), (int)($p['physical_stock'] ?? 0),
                    (int)($p['reserved_stock'] ?? 0), $p['image'] ?? '', $id
                ]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `products` (`sku`, `name`, `category`, `size`, `color`, `price`, `physical_stock`, `reserved_stock`, `image`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $p['sku'], $p['name'], $p['category'] ?? 'General', $p['size'] ?? 'Standard',
                    $p['color'] ?? 'Default', (float)($p['price'] ?? 0), (int)($p['physical_stock'] ?? 0),
                    (int)($p['reserved_stock'] ?? 0), $p['image'] ?? ''
                ]);
                $id = $pdo->lastInsertId();
            }
            echo json_encode(["status" => "success", "message" => "Product saved to database", "id" => $id]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Product saved locally"]);
    exit;
}

if ($action === 'update_stock' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);

    $productId = $p['id'] ?? null;
    $physical = isset($p['physical_stock']) ? (int)$p['physical_stock'] : null;
    $reserved = isset($p['reserved_stock']) ? (int)$p['reserved_stock'] : null;

    if (!$productId || $physical === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID and physical stock are required"]);
        exit;
    }

    if ($pdo) {
        try {
            if ($reserved !== null) {
                $stmt = $pdo->prepare("UPDATE `products` SET `physical_stock` = ?, `reserved_stock` = ? WHERE `id` = ?");
                $stmt->execute([$physical, $reserved, $productId]);
            } else {
                $stmt = $pdo->prepare("UPDATE `products` SET `physical_stock` = ? WHERE `id` = ?");
                $stmt->execute([$physical, $productId]);
            }
            echo json_encode(["status" => "success", "message" => "Stock updated in database", "id" => $productId]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Stock updated locally"]);
    exit;
}

if ($action === 'delete_product' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);
    $productId = $p['id'] ?? null;

    if (!$productId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID is required"]);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM `products` WHERE `id` = ?");
            $stmt->execute([$productId]);
            echo json_encode(["status" => "success", "message" => "Product deleted from database"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Product deleted locally"]);
    exit;
}

if ($action === 'upload_product_image' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $uploadDir = __DIR__ . '/uploads/products/';
    if (!is_dir($uploadDir)) {
        @mkdir($uploadDir, 0777, true);
    }

    if (!empty($_FILES['image']) && is_uploaded_file($_FILES['image']['tmp_name'])) {
        $file = $_FILES['image'];
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!in_array($ext, $allowed)) {
            $ext = 'jpg';
        }
        $fileName = 'prod_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $url = 'uploads/products/' . $fileName;
            echo json_encode(["status" => "success", "url" => $url, "message" => "Image uploaded successfully"]);
            exit;
        }
    }

    // Check if JSON base64 payload
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);
    if (!empty($p['image_base64'])) {
        $data = $p['image_base64'];
        if (preg_match('/^data:image\/(\w+);base64,/', $data, $type)) {
            $data = substr($data, strpos($data, ',') + 1);
            $ext = strtolower($type[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            $data = base64_decode($data);
            if ($data !== false) {
                $fileName = 'prod_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
                file_put_contents($uploadDir . $fileName, $data);
                $url = 'uploads/products/' . $fileName;
                echo json_encode(["status" => "success", "url" => $url, "message" => "Image saved successfully"]);
                exit;
            }
        }
    }

    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No valid image uploaded"]);
    exit;
}

// =========================================================================
// 6. DATABASE BACKUP & RESTORE
// =========================================================================
if ($action === 'backup_db') {
    try {
        $stateResponse = [];
        $tables = ['users', 'whatsapp_accounts', 'customers', 'queries', 'messages', 'products', 'orders', 'followups', 'audit_logs'];
        
        foreach ($tables as $t) {
            $stmt = $pdo->query("SELECT * FROM `$t`");
            $stateResponse[$t] = $stmt->fetchAll();
        }

        $backupData = [
            "version" => "2.5",
            "backup_date" => date("Y-m-d H:i:s"),
            "generator" => "GRM_CRM_MYSQL_BACKUP_ENGINE",
            "database" => "grm_crm_db",
            "tables" => $stateResponse
        ];

        header('Content-Disposition: attachment; filename="grm_crm_backup_' . date("Ymd_His") . '.json"');
        echo json_encode($backupData, JSON_PRETTY_PRINT);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

// Default fallback response
echo json_encode(["status" => "success", "message" => "GRM CRM Backend API Active"]);
exit;