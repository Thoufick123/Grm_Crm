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

if (!headers_sent()) {
    header("Content-Type: application/json");
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type");
}

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/config/db.php';

if (!headers_sent() && session_status() === PHP_SESSION_NONE) {
    @session_start();
}

$pdo = getDBConnection();
$configFile = __DIR__ . '/whatsapp_account_config.json';
$messagesFile = __DIR__ . '/live_messages_queue.json';
$bridgeUrl = defined('BRIDGE_URL') ? BRIDGE_URL : 'http://localhost:3000';

function atomicWriteJson($filePath, $data) {
    $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $tmpFile = $filePath . '.' . uniqid('tmp_', true);
    $fp = @fopen($tmpFile, 'w');
    if ($fp) {
        if (@flock($fp, LOCK_EX)) {
            @fwrite($fp, $json);
            @fflush($fp);
            @flock($fp, LOCK_UN);
        }
        @fclose($fp);
        return @rename($tmpFile, $filePath);
    }
    return (bool)@file_put_contents($filePath, $json);
}

$action = $_GET['action'] ?? 'get_state';

// =========================================================================
// 1. GET FULL CRM STATE FROM MYSQL DATABASE
// =========================================================================
if ($action === 'get_state' || $action === 'get_all') {
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
        foreach ($queries as &$q) {
            if (!empty($q['status_history']) && is_string($q['status_history'])) {
                $q['statusHistory'] = json_decode($q['status_history'], true) ?: [];
            } else {
                $q['statusHistory'] = [];
            }
            $q['isPaymentPending'] = (bool)($q['is_payment_pending'] ?? false);
            $q['paymentAmount'] = (float)($q['payment_amount'] ?? 0);
            $q['shippingAmount'] = (float)($q['shipping_amount'] ?? 0);
            $q['paymentMode'] = $q['payment_mode'] ?? 'UPI';
            $q['advancePayment'] = (float)($q['advance_payment'] ?? 0);
            $q['paymentDueDate'] = $q['payment_due_date'] ?? '';
            $q['paymentNotes'] = $q['payment_notes'] ?? '';
            $q['quotedItems'] = $q['quoted_items'] ?? '';
            $q['callbackDate'] = $q['callback_date'] ?? '';
            $q['callbackTime'] = $q['callback_time'] ?? '11:00 AM';
            $q['statusNotes'] = $q['status_notes'] ?? '';
        }

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
            $o['queryId'] = $o['query_id'] ?? '';
            $o['customerId'] = $o['customer_id'] ?? '';
            $o['customerName'] = $o['customer_name'] ?? 'Customer';
            $o['customerPhone'] = $o['customer_phone'] ?? '';
            $o['shippingAddress'] = $o['shipping_address'] ?? '';
            $o['grandTotal'] = (float)($o['grand_total'] ?? 0);
            $o['codAdvance'] = (float)($o['cod_advance'] ?? 0);
            $o['codBalanceDue'] = (float)($o['cod_balance_due'] ?? 0);
            $o['paymentMethod'] = $o['payment_method'] ?? 'COD';
            $o['paymentStatus'] = $o['payment_status'] ?? 'PENDING';
            $o['upiTransactionId'] = $o['upi_transaction_id'] ?? '';
            $o['paymentScreenshot'] = $o['payment_screenshot'] ?? '';
            $o['orderStatus'] = $o['order_status'] ?? 'PLACED';
            $o['staffId'] = $o['staff_id'] ?? ($o['created_by'] ?? 'staff_01');
            $o['staffName'] = $o['staff_name'] ?? ($o['created_by'] ?? 'Super Admin');
            $o['createdBy'] = $o['created_by'] ?? ($o['staff_name'] ?? 'Staff');
            $o['trackingNumber'] = $o['tracking_number'] ?? '';
            $o['courierName'] = $o['courier_name'] ?? '';
            $o['createdAt'] = $o['created_at'] ?? '';
        }

        // 8. Followups (Normalized with lifecycle & RBAC fields)
        $fStmt = $pdo->query("SELECT * FROM `followups` ORDER BY `created_at` DESC");
        $rawFollowups = $fStmt->fetchAll();
        $followups = array_map(function($fu) {
            return [
                'id'                => $fu['id'],
                'queryId'           => $fu['query_id'] ?? '',
                'customerId'        => $fu['customer_id'] ?? '',
                'customerName'      => $fu['customer_name'] ?? 'Customer',
                'assignedTo'        => $fu['assigned_to'] ?? 'staff_01',
                'date'              => $fu['date_str'] ?? '',
                'date_str'          => $fu['date_str'] ?? '',
                'time'              => $fu['time_str'] ?? '',
                'time_str'          => $fu['time_str'] ?? '',
                'reason'            => $fu['reason'] ?? '',
                'status'            => $fu['status'] ?? 'PENDING',
                'outcome'           => $fu['outcome'] ?? 'PENDING',
                'priority'          => $fu['priority'] ?? 'NORMAL',
                'channel'           => $fu['contact_channel'] ?? 'WHATSAPP',
                'contact_channel'   => $fu['contact_channel'] ?? 'WHATSAPP',
                'outcomeNotes'      => $fu['outcome_notes'] ?? '',
                'outcome_notes'     => $fu['outcome_notes'] ?? '',
                'completedAt'       => $fu['completed_at'] ?? null,
                'rescheduledFromId' => $fu['rescheduled_from_id'] ?? null,
                'createdAt'         => $fu['created_at'] ?? '',
                'isPaymentPending'  => (bool)($fu['is_payment_pending'] ?? false),
                'paymentAmount'     => (float)($fu['payment_amount'] ?? 0),
                'shippingAmount'    => (float)($fu['shipping_amount'] ?? 0),
                'paymentMode'       => $fu['payment_mode'] ?? 'UPI',
                'advancePayment'    => (float)($fu['advance_payment'] ?? 0),
                'paymentDueDate'    => $fu['payment_due_date'] ?? '',
                'paymentNotes'      => $fu['payment_notes'] ?? '',
                'quotedItems'       => $fu['quoted_items'] ?? ''
            ];
        }, $rawFollowups);

        // 9. Audit Logs
        $aStmt = $pdo->query("SELECT * FROM `audit_logs` ORDER BY `id` DESC LIMIT 100");
        $auditLogs = $aStmt->fetchAll();

        // 9.1 Dedicated DND Records Table
        $dndRecords = [];
        try {
            $dndStmt = $pdo->query("SELECT * FROM `dnd_records` ORDER BY `created_at` DESC");
            $dndRecords = $dndStmt->fetchAll();
        } catch (Exception $e) {}

        // 10. Categories, Subcategories & Attributes (Website Catalog Workflow)
        $categories = [];
        $subcategories = [];
        $attributes = ['sizes' => [], 'colors' => [], 'fabrics' => [], 'specifications' => [], 'custom' => []];
        try {
            $catStmt = $pdo->query("SELECT * FROM `categories` ORDER BY `display_order` ASC, `name` ASC");
            $categories = $catStmt->fetchAll();

            $subStmt = $pdo->query("SELECT * FROM `subcategories` ORDER BY `name` ASC");
            $subcategories = $subStmt->fetchAll();

            $attrStmt = $pdo->query("SELECT * FROM `attributes` ORDER BY `id` ASC");
            $rawAttrs = $attrStmt->fetchAll();
            foreach ($rawAttrs as $ra) {
                $type = $ra['type'] ?? '';
                if ($type === 'size') $attributes['sizes'][] = $ra['value'];
                else if ($type === 'color') $attributes['colors'][] = $ra['value'];
                else if ($type === 'fabric') $attributes['fabrics'][] = $ra['value'];
                else if ($type === 'specification') {
                    $extraStr = $ra['extra'] ?? '';
                    if (strpos($extraStr, ',') !== false) {
                        $parts = array_filter(array_map('trim', explode(',', $extraStr)));
                        foreach ($parts as $pIdx => $part) {
                            $attributes['specifications'][] = [
                                'id' => (int)$ra['id'] * 1000 + $pIdx,
                                'label' => $ra['value'],
                                'content' => $part
                            ];
                        }
                    } else {
                        $attributes['specifications'][] = [
                            'id' => (int)$ra['id'],
                            'label' => $ra['value'],
                            'content' => $extraStr
                        ];
                    }
                } else if ($type === 'attribute_type') {
                    $attrName = trim($ra['value']);
                    if (!empty($attrName) && !isset($attributes['custom'][$attrName])) {
                        $attributes['custom'][$attrName] = [];
                    }
                } else if ($type === 'attribute_value' || $type === 'custom') {
                    $attrName = trim($ra['extra'] ?: 'Custom');
                    if (!isset($attributes['custom'][$attrName])) {
                        $attributes['custom'][$attrName] = [];
                    }
                    if (!empty($ra['value']) && !in_array($ra['value'], $attributes['custom'][$attrName])) {
                        $attributes['custom'][$attrName][] = $ra['value'];
                    }
                } else {
                    $attrName = trim($ra['extra'] ?: ucfirst($ra['type']));
                    if (!empty($attrName)) {
                        if (!isset($attributes['custom'][$attrName])) {
                            $attributes['custom'][$attrName] = [];
                        }
                        if (!empty($ra['value']) && !in_array($ra['value'], $attributes['custom'][$attrName])) {
                            $attributes['custom'][$attrName][] = $ra['value'];
                        }
                    }
                }
            }
        } catch (Exception $e) {}

        // Auto-reply rules
        $arRules = [];
        try {
            $arRules = $pdo->query("SELECT * FROM `auto_reply_rules` ORDER BY `created_at` ASC")->fetchAll();
            foreach ($arRules as &$r) {
                if (!empty($r['keywords']) && is_string($r['keywords'])) {
                    $r['keywords'] = json_decode($r['keywords'], true) ?: [$r['keywords']];
                }
            }
        } catch (Exception $e) {}

        // Broadcast templates
        $bcTemplates = [];
        try {
            $bcTemplates = $pdo->query("SELECT * FROM `broadcast_templates` ORDER BY `created_at` ASC")->fetchAll();
        } catch (Exception $e) {}

        echo json_encode([
            "status" => "success",
            "source" => "MYSQL_DATABASE",
            "products" => $products,
            "customers" => $customers,
            "queries" => $queries,
            "orders" => $orders,
            "followups" => $followups,
            "staff" => $staffList,
            "staffList" => $staffList,
            "categories" => $categories,
            "subcategories" => $subcategories,
            "attributes" => $attributes,
            "dnd_records" => $dndRecords,
            "dndRecords" => $dndRecords,
            "auto_reply_rules" => $arRules,
            "autoReplyRules" => $arRules,
            "broadcast_templates" => $bcTemplates,
            "broadcastTemplates" => $bcTemplates,
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
                "auditLogs" => $auditLogs,
                "categories" => $categories,
                "subcategories" => $subcategories,
                "attributes" => $attributes,
                "dndRecords" => $dndRecords,
                "dnd_records" => $dndRecords,
                "autoReplyRules" => $arRules,
                "broadcastTemplates" => $bcTemplates
            ]
        ]);
        exit;
    } catch (Exception $e) {
        // Return fallback from config file if MySQL is offline
        $configData = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
        $fallbackFuFile = __DIR__ . '/config/followups_fallback.json';
        $fallbackFollowups = file_exists($fallbackFuFile) ? json_decode(file_get_contents($fallbackFuFile), true) : [];
        echo json_encode([
            "status" => "fallback",
            "message" => $e->getMessage(),
            "data" => [
                "whatsappAccount" => $configData,
                "followups" => $fallbackFollowups
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
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $avatar = $staff['avatar'] ?? strtoupper(substr($staff['name'], 0, 2));

        $stmt = $pdo->prepare("
            INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `specialization`, `avatar`, `status`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `role`=VALUES(`role`), `phone`=VALUES(`phone`), `status`=VALUES(`status`)
        ");

        $stmt->execute([
            $staffId,
            $username,
            $hashedPassword,
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

    atomicWriteJson($configFile, $updatedConfig);

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

    // Auto-sync brand name with live Bridge Server
    try {
        $brandToSync = $updatedConfig['display_name'] ?? $updatedConfig['brand_name'] ?? 'GRM Garments Official';
        $ch = curl_init($bridgeUrl . '/api/accounts/update_profile');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['brandName' => $brandToSync]));
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        curl_exec($ch);
        curl_close($ch);
    } catch (Exception $e) {}

    echo json_encode([
        "status" => "success", 
        "message" => "WhatsApp Phone Number and Brand Configuration saved and synced with Live Bridge", 
        "data" => $updatedConfig
    ]);
    exit;
}

if ($action === 'toggle_autoreply' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $postData = json_decode($input, true) ?: [];

    $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    if (isset($postData['enabled'])) {
        $currentConfig['autoReplyEnabled'] = (bool)$postData['enabled'];
    } else {
        $currentConfig['autoReplyEnabled'] = empty($currentConfig['autoReplyEnabled']);
    }

    if (isset($postData['cooldownMinutes'])) {
        $currentConfig['autoReplyCooldownMinutes'] = (int)$postData['cooldownMinutes'];
    }
    if (isset($postData['keywordMatching'])) {
        $currentConfig['autoReplyKeywordMatching'] = (bool)$postData['keywordMatching'];
    }

    atomicWriteJson($configFile, $currentConfig);

    // Propagate to live Node Bridge
    $bridgeRes = null;
    try {
        $ch = curl_init($bridgeUrl . '/api/autoreply/toggle');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'enabled' => $currentConfig['autoReplyEnabled'],
            'cooldownMinutes' => $currentConfig['autoReplyCooldownMinutes'] ?? 0,
            'keywordMatching' => $currentConfig['autoReplyKeywordMatching'] ?? true
        ]));
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        $bridgeRes = curl_exec($ch);
        curl_close($ch);
    } catch (Exception $e) {}

    echo json_encode([
        "status" => "success",
        "enabled" => $currentConfig['autoReplyEnabled'],
        "message" => "Auto-reply is now " . ($currentConfig['autoReplyEnabled'] ? "ON" : "OFF"),
        "config" => $currentConfig
    ]);
    exit;
}

if ($action === 'get_autoreply') {
    $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    echo json_encode([
        "status" => "success",
        "enabled" => isset($currentConfig['autoReplyEnabled']) ? (bool)$currentConfig['autoReplyEnabled'] : true,
        "cooldownMinutes" => $currentConfig['autoReplyCooldownMinutes'] ?? 0,
        "keywordMatching" => $currentConfig['autoReplyKeywordMatching'] ?? true,
        "rules" => $currentConfig['autoReplyRules'] ?? []
    ]);
    exit;
}

if ($action === 'get_autoreply_rules') {
    $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    echo json_encode([
        "status" => "success",
        "rules" => $currentConfig['autoReplyRules'] ?? []
    ]);
    exit;
}

if ($action === 'save_autoreply_rules' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $postData = json_decode($input, true) ?: [];
    $rules = $postData['rules'] ?? [];

    // 1. Persist to MySQL auto_reply_rules table
    if ($pdo && is_array($rules)) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `auto_reply_rules` (`id`, `name`, `keywords`, `action_type`, `category_id`, `reply_text`, `enabled`, `auto_send`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    `name` = VALUES(`name`),
                    `keywords` = VALUES(`keywords`),
                    `action_type` = VALUES(`action_type`),
                    `category_id` = VALUES(`category_id`),
                    `reply_text` = VALUES(`reply_text`),
                    `enabled` = VALUES(`enabled`),
                    `auto_send` = VALUES(`auto_send`)
            ");

            $activeIds = [];
            foreach ($rules as $r) {
                if (empty($r['id'])) continue;
                $activeIds[] = $r['id'];
                $keywordsJson = is_array($r['keywords'] ?? null) 
                    ? json_encode($r['keywords'], JSON_UNESCAPED_UNICODE) 
                    : json_encode([$r['keywords'] ?? '']);
                $stmt->execute([
                    $r['id'],
                    $r['name'] ?? 'Pre-set Rule',
                    $keywordsJson,
                    $r['actionType'] ?? ($r['action_type'] ?? 'custom_text'),
                    $r['categoryId'] ?? ($r['category_id'] ?? null),
                    $r['replyText'] ?? ($r['reply_text'] ?? ''),
                    isset($r['enabled']) ? ($r['enabled'] ? 1 : 0) : 1,
                    isset($r['autoSend']) ? ($r['autoSend'] ? 1 : 0) : 1
                ]);
            }

            // Remove any rules from MySQL that were deleted in the UI
            if (!empty($activeIds)) {
                $inClause = implode(',', array_fill(0, count($activeIds), '?'));
                $delStmt = $pdo->prepare("DELETE FROM `auto_reply_rules` WHERE `id` NOT IN ($inClause)");
                $delStmt->execute($activeIds);
            }
        } catch (Exception $e) {
            error_log("Error saving auto_reply_rules to MySQL: " . $e->getMessage());
        }
    }

    // 2. Persist to config JSON file
    $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    $currentConfig['autoReplyRules'] = $rules;
    atomicWriteJson($configFile, $currentConfig);

    // 3. Propagate to live Node Bridge
    try {
        $ch = curl_init($bridgeUrl . '/api/autoreply/rules');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['rules' => $rules]));
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        curl_exec($ch);
        curl_close($ch);
    } catch (Exception $e) {}

    echo json_encode([
        "status" => "success",
        "source" => "MYSQL_AND_CONFIG",
        "message" => "Auto-reply rules updated successfully in MySQL and Bridge",
        "rules" => $rules
    ]);
    exit;
}

if ($action === 'disconnect_account' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $postData = json_decode($input, true);
    $accountId = $postData['accountId'] ?? 'account_1';

    $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    $currentConfig['status'] = 'DISCONNECTED';
    $currentConfig['last_sync'] = date("Y-m-d H:i:s");
    atomicWriteJson($configFile, $currentConfig);

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE `whatsapp_accounts` SET `status` = 'DISCONNECTED' WHERE `account_slot` = ?");
            $stmt->execute([$accountId]);
        } catch (Exception $e) {}
    }

    echo json_encode(["status" => "success", "message" => "Account disconnected in backend"]);
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
            atomicWriteJson($configFile, $currentConfig);
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
                SET `name` = ?, `phone` = ?, `whatsapp` = ?, `address` = ?, `email` = ?, `gender` = ?, `age` = ?, `notes` = ?
                WHERE `id` = ?
            ");
            $stmt->execute([
                $data['name'] ?? '',
                $data['phone'] ?? '',
                $data['whatsapp'] ?? ($data['phone'] ?? ''),
                $data['address'] ?? '',
                $data['email'] ?? null,
                $data['gender'] ?? null,
                $data['age'] ?? null,
                $data['notes'] ?? null,
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
    $mediaUrl = $postData['media_url'] ?? ($postData['mediaUrl'] ?? null);
    $mediaType = $postData['type'] ?? ($mediaUrl ? 'image' : null);

    if (empty($phone) && empty($postData['jid'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Phone or JID is required"]);
        exit;
    }
    if (empty($text)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Text is required"]);
        exit;
    }

    // Call Node.js Baileys Bridge
    $ch = curl_init($bridgeUrl . '/api/send');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'phone' => $phone, 
        'text' => $text,
        'jid' => $postData['jid'] ?? null,
        'accountId' => $postData['accountId'] ?? null,
        'mediaUrl' => $mediaUrl
    ]));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 1);
    curl_setopt($ch, CURLOPT_TIMEOUT, 2);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Also persist message in MySQL
    if ($pdo && $customerId) {
        try {
            $pdo->prepare("
                INSERT INTO `messages` (`customer_id`, `sender`, `text`, `media_type`, `media_url`, `time_str`, `status`)
                VALUES (?, 'staff', ?, ?, ?, ?, 'DELIVERED')
            ")->execute([$customerId, $text, $mediaType, $mediaUrl, date("h:i A")]);
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
    atomicWriteJson($messagesFile, $queue);

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
    $payload = json_decode($input, true);

    $productsList = (isset($payload['variants']) && is_array($payload['variants'])) 
        ? $payload['variants'] 
        : ((isset($payload['products']) && is_array($payload['products'])) ? $payload['products'] : [$payload]);

    $savedIds = [];
    $savedRows = [];

    foreach ($productsList as $p) {
        if (empty($p['name']) || empty($p['sku'])) continue;

        if ($pdo) {
            try {
                $id = $p['id'] ?? null;
                $sku = strtoupper(trim($p['sku']));
                $name = trim($p['name']);
                $category = $p['category'] ?? '';
                $subcategory = $p['subcategory'] ?? ($p['subCategory'] ?? '');
                $size = $p['size'] ?? '';
                $color = $p['color'] ?? '';
                $fabric = $p['fabric'] ?? '';
                $specs = $p['specifications'] ?? ($p['specs'] ?? null);
                $specifications = !empty($specs) ? (is_string($specs) ? $specs : json_encode($specs, JSON_UNESCAPED_UNICODE)) : null;
                $price = (float)($p['price'] ?? 0);
                $mrp = !empty($p['mrp']) ? (float)$p['mrp'] : null;
                $physical = (int)($p['physical_stock'] ?? ($p['physicalStock'] ?? 0));
                $reserved = (int)($p['reserved_stock'] ?? ($p['reservedStock'] ?? 0));
                $image = $p['image'] ?? '';

                // If base64 data URL, automatically save as a file on disk to optimize storage
                if (!empty($image) && str_starts_with($image, 'data:image/')) {
                    $uploadDir = __DIR__ . '/uploads/products/';
                    if (!is_dir($uploadDir)) {
                        @mkdir($uploadDir, 0777, true);
                    }
                    if (preg_match('/^data:image\/(\w+);base64,/', $image, $typeMatch)) {
                        $rawBase64 = substr($image, strpos($image, ',') + 1);
                        $ext = strtolower($typeMatch[1]);
                        if ($ext === 'jpeg') $ext = 'jpg';
                        $decoded = base64_decode($rawBase64);
                        if ($decoded !== false) {
                            $imgName = 'prod_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
                            if (@file_put_contents($uploadDir . $imgName, $decoded)) {
                                $image = 'uploads/products/' . $imgName;
                            }
                        }
                    }
                }

                $description = $p['description'] ?? '';
                $accountId = $p['account_id'] ?? ($p['accountId'] ?? 'account_1');

                $rowExists = false;
                $targetId = null;
                if ($id && is_numeric($id)) {
                    $checkStmt = $pdo->prepare("SELECT `id` FROM `products` WHERE `id` = ?");
                    $checkStmt->execute([$id]);
                    $targetId = $checkStmt->fetchColumn();
                    $rowExists = (bool)$targetId;
                }
                if (!$rowExists && !empty($sku)) {
                    $checkStmt = $pdo->prepare("SELECT `id` FROM `products` WHERE `sku` = ?");
                    $checkStmt->execute([$sku]);
                    $targetId = $checkStmt->fetchColumn();
                    $rowExists = (bool)$targetId;
                }

                if ($rowExists && $targetId) {
                    $stmt = $pdo->prepare("
                        UPDATE `products` SET 
                            `sku` = ?, `name` = ?, `category` = ?, `subcategory` = ?, `size` = ?, `color` = ?, 
                            `fabric` = ?, `specifications` = ?, `price` = ?, `mrp` = ?, `physical_stock` = ?, `reserved_stock` = ?, 
                            `image` = ?, `description` = ?, `account_id` = ?
                        WHERE `id` = ?
                    ");
                    $stmt->execute([
                        $sku, $name, $category, $subcategory, $size, $color, 
                        $fabric, $specifications, $price, $mrp, $physical, $reserved, 
                        $image, $description, $accountId, $targetId
                    ]);
                    $savedIds[] = (int)$targetId;
                    $savedRows[] = ['id' => (int)$targetId, 'sku' => $sku, 'price' => $price, 'mrp' => $mrp, 'image' => $image];
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO `products` (`sku`, `name`, `category`, `subcategory`, `size`, `color`, `fabric`, `specifications`, `price`, `mrp`, `physical_stock`, `reserved_stock`, `image`, `description`, `account_id`)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            `name` = VALUES(`name`), `category` = VALUES(`category`), `subcategory` = VALUES(`subcategory`),
                            `size` = VALUES(`size`), `color` = VALUES(`color`), `fabric` = VALUES(`fabric`),
                            `specifications` = VALUES(`specifications`),
                            `price` = VALUES(`price`), `mrp` = VALUES(`mrp`), `physical_stock` = VALUES(`physical_stock`),
                            `image` = VALUES(`image`), `description` = VALUES(`description`), `account_id` = VALUES(`account_id`)
                    ");
                    $stmt->execute([
                        $sku, $name, $category, $subcategory, $size, $color, 
                        $fabric, $specifications, $price, $mrp, $physical, $reserved, 
                        $image, $description, $accountId
                    ]);
                    $insertedId = (int)($pdo->lastInsertId() ?: $targetId);
                    $savedIds[] = $insertedId;
                    $savedRows[] = ['id' => $insertedId, 'sku' => $sku, 'price' => $price, 'mrp' => $mrp, 'image' => $image];
                }
            } catch (Exception $e) {
                error_log("save_product exception for {$p['sku']}: " . $e->getMessage());
            }
        }
    }

    echo json_encode([
        "status" => "success", 
        "message" => count($savedIds) . " product variant(s) saved to catalog database", 
        "ids" => $savedIds,
        "id" => $savedIds[0] ?? null,
        "image" => $savedRows[0]['image'] ?? '',
        "products" => $savedRows
    ]);
    exit;
}

if ($action === 'update_stock' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);

    $productId = $p['id'] ?? null;
    $sku = !empty($p['sku']) ? trim($p['sku']) : null;
    $physical = isset($p['physical_stock']) ? (int)$p['physical_stock'] : (isset($p['physicalStock']) ? (int)$p['physicalStock'] : null);
    $reserved = isset($p['reserved_stock']) ? (int)$p['reserved_stock'] : (isset($p['reservedStock']) ? (int)$p['reservedStock'] : null);

    if ((!$productId && !$sku) || $physical === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID or SKU and physical stock are required"]);
        exit;
    }

    if ($pdo) {
        try {
            $isNumericId = $productId && is_numeric($productId);
            if ($isNumericId && !empty($sku)) {
                $where = "`id` = ? OR `sku` = ?";
                $params = [(int)$productId, $sku];
            } else if ($isNumericId) {
                $where = "`id` = ?";
                $params = [(int)$productId];
            } else {
                $where = "`sku` = ?";
                $params = [!empty($sku) ? $sku : (string)$productId];
            }

            if ($reserved !== null) {
                $stmt = $pdo->prepare("UPDATE `products` SET `physical_stock` = ?, `reserved_stock` = ? WHERE " . $where);
                $stmt->execute(array_merge([$physical, $reserved], $params));
            } else {
                $stmt = $pdo->prepare("UPDATE `products` SET `physical_stock` = ? WHERE " . $where);
                $stmt->execute(array_merge([$physical], $params));
            }
            echo json_encode(["status" => "success", "message" => "Stock updated in database", "id" => $productId, "sku" => $sku, "physical_stock" => $physical]);
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

if ($action === 'update_price' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);

    $productId = $p['id'] ?? null;
    $sku = !empty($p['sku']) ? trim($p['sku']) : null;
    $price = isset($p['price']) && $p['price'] !== '' ? (float)$p['price'] : null;
    $hasMrp = isset($p['mrp']) && $p['mrp'] !== '' && $p['mrp'] !== null;
    $mrp = $hasMrp ? (float)$p['mrp'] : null;

    if ((!$productId && !$sku) || $price === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID or SKU and valid price are required"]);
        exit;
    }

    if ($pdo) {
        try {
            $isNumericId = $productId && is_numeric($productId);
            if ($isNumericId && !empty($sku)) {
                $where = "`id` = ? OR `sku` = ?";
                $params = [(int)$productId, $sku];
            } else if ($isNumericId) {
                $where = "`id` = ?";
                $params = [(int)$productId];
            } else {
                $where = "`sku` = ?";
                $params = [!empty($sku) ? $sku : (string)$productId];
            }

            if ($hasMrp) {
                $stmt = $pdo->prepare("UPDATE `products` SET `price` = ?, `mrp` = ? WHERE " . $where);
                $stmt->execute(array_merge([$price, $mrp], $params));
            } else {
                $stmt = $pdo->prepare("UPDATE `products` SET `price` = ? WHERE " . $where);
                $stmt->execute(array_merge([$price], $params));
            }
            echo json_encode(["status" => "success", "message" => "Price updated successfully in database", "id" => $productId, "sku" => $sku, "price" => $price, "mrp" => $mrp]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Price updated locally", "id" => $productId, "price" => $price]);
    exit;
}

if ($action === 'bulk_update_prices' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);

    $ids = $p['ids'] ?? ($p['product_ids'] ?? []);
    $skus = $p['skus'] ?? [];
    $mode = $p['mode'] ?? 'fixed'; // 'fixed', 'increase_amt', 'decrease_amt', 'increase_pct', 'decrease_pct', 'discount_pct'
    $value = isset($p['value']) && $p['value'] !== '' ? (float)$p['value'] : null;
    $hasMrp = isset($p['mrp']) && $p['mrp'] !== '' && $p['mrp'] !== null;
    $mrp = $hasMrp ? (float)$p['mrp'] : null;

    $targetIdentifiers = array_unique(array_filter(array_merge((array)$ids, (array)$skus)));

    if (empty($targetIdentifiers) || $value === null) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product IDs/SKUs and adjustment value are required"]);
        exit;
    }

    $updatedCount = 0;
    if ($pdo) {
        try {
            foreach ($targetIdentifiers as $identifier) {
                if (is_numeric($identifier)) {
                    $sel = $pdo->prepare("SELECT `id`, `price`, `mrp` FROM `products` WHERE `id` = ? OR `sku` = ? LIMIT 1");
                    $sel->execute([(int)$identifier, (string)$identifier]);
                } else {
                    $sel = $pdo->prepare("SELECT `id`, `price`, `mrp` FROM `products` WHERE `sku` = ? LIMIT 1");
                    $sel->execute([(string)$identifier]);
                }
                $curr = $sel->fetch();
                if (!$curr) continue;

                $rowId = $curr['id'];
                $oldPrice = (float)$curr['price'];
                $newPrice = $oldPrice;
                if ($mode === 'fixed') {
                    $newPrice = $value;
                } else if ($mode === 'increase_amt') {
                    $newPrice = $oldPrice + $value;
                } else if ($mode === 'decrease_amt') {
                    $newPrice = max(0, $oldPrice - $value);
                } else if ($mode === 'increase_pct') {
                    $newPrice = round($oldPrice * (1 + ($value / 100)), 2);
                } else if ($mode === 'decrease_pct' || $mode === 'discount_pct') {
                    $newPrice = max(0, round($oldPrice * (1 - ($value / 100)), 2));
                }

                if ($hasMrp) {
                    $upd = $pdo->prepare("UPDATE `products` SET `price` = ?, `mrp` = ? WHERE `id` = ?");
                    $upd->execute([$newPrice, $mrp, $rowId]);
                } else {
                    $upd = $pdo->prepare("UPDATE `products` SET `price` = ? WHERE `id` = ?");
                    $upd->execute([$newPrice, $rowId]);
                }
                $updatedCount++;
            }
            echo json_encode(["status" => "success", "message" => "Updated prices for {$updatedCount} products", "count" => $updatedCount]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Bulk prices updated locally", "count" => count($targetIdentifiers)]);
    exit;
}

if ($action === 'save_product_caption' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);

    $productId = $p['id'] ?? ($p['product_id'] ?? null);
    $caption = $p['custom_caption'] ?? ($p['caption'] ?? null);

    if (!$productId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID is required"]);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE `products` SET `custom_caption` = ? WHERE `id` = ?");
            $stmt->execute([$caption, $productId]);
            echo json_encode(["status" => "success", "message" => "Custom caption saved successfully", "id" => $productId]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Custom caption saved locally"]);
    exit;
}

if ($action === 'delete_product' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);
    $productId = $p['id'] ?? ($p['product_id'] ?? null);
    $sku = !empty($p['sku']) ? trim($p['sku']) : null;

    if (!$productId && !$sku) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Product ID or SKU is required"]);
        exit;
    }

    if ($pdo) {
        try {
            $isNumericId = $productId && is_numeric($productId);
            if ($isNumericId && !empty($sku)) {
                $stmt = $pdo->prepare("DELETE FROM `products` WHERE `id` = ? OR `sku` = ?");
                $stmt->execute([(int)$productId, $sku]);
            } else if ($isNumericId) {
                $stmt = $pdo->prepare("DELETE FROM `products` WHERE `id` = ?");
                $stmt->execute([(int)$productId]);
            } else {
                $target = !empty($sku) ? $sku : (string)$productId;
                $stmt = $pdo->prepare("DELETE FROM `products` WHERE `sku` = ? OR `id` = ?");
                $stmt->execute([$target, $target]);
            }
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

// =========================================================================
// 5.1 CATEGORIES, SUBCATEGORIES & ATTRIBUTES ENDPOINTS
// =========================================================================
if ($action === 'get_catalog_meta') {
    $categories = [];
    $subcategories = [];
    $attributes = ['sizes' => [], 'colors' => [], 'fabrics' => [], 'specifications' => [], 'custom' => []];

    if ($pdo) {
        try {
            $catStmt = $pdo->query("SELECT * FROM `categories` ORDER BY `display_order` ASC, `name` ASC");
            $categories = $catStmt->fetchAll();

            $subStmt = $pdo->query("SELECT * FROM `subcategories` ORDER BY `name` ASC");
            $subcategories = $subStmt->fetchAll();

            $attrStmt = $pdo->query("SELECT * FROM `attributes` ORDER BY `id` ASC");
            $rawAttrs = $attrStmt->fetchAll();
            foreach ($rawAttrs as $ra) {
                $type = $ra['type'] ?? '';
                if ($type === 'size') $attributes['sizes'][] = $ra['value'];
                else if ($type === 'color') $attributes['colors'][] = $ra['value'];
                else if ($type === 'fabric') $attributes['fabrics'][] = $ra['value'];
                else if ($type === 'specification') {
                    $extraStr = $ra['extra'] ?? '';
                    if (strpos($extraStr, ',') !== false) {
                        $parts = array_filter(array_map('trim', explode(',', $extraStr)));
                        foreach ($parts as $pIdx => $part) {
                            $attributes['specifications'][] = [
                                'id' => (int)$ra['id'] * 1000 + $pIdx,
                                'label' => $ra['value'],
                                'content' => $part
                            ];
                        }
                    } else {
                        $attributes['specifications'][] = [
                            'id' => (int)$ra['id'],
                            'label' => $ra['value'],
                            'content' => $extraStr
                        ];
                    }
                } else if ($type === 'attribute_type') {
                    $attrName = trim($ra['value']);
                    if (!empty($attrName) && !isset($attributes['custom'][$attrName])) {
                        $attributes['custom'][$attrName] = [];
                    }
                } else if ($type === 'attribute_value' || $type === 'custom') {
                    $attrName = trim($ra['extra'] ?: 'Custom');
                    if (!isset($attributes['custom'][$attrName])) {
                        $attributes['custom'][$attrName] = [];
                    }
                    if (!empty($ra['value']) && !in_array($ra['value'], $attributes['custom'][$attrName])) {
                        $attributes['custom'][$attrName][] = $ra['value'];
                    }
                } else {
                    $attrName = trim($ra['extra'] ?: ucfirst($ra['type']));
                    if (!empty($attrName)) {
                        if (!isset($attributes['custom'][$attrName])) {
                            $attributes['custom'][$attrName] = [];
                        }
                        if (!empty($ra['value']) && !in_array($ra['value'], $attributes['custom'][$attrName])) {
                            $attributes['custom'][$attrName][] = $ra['value'];
                        }
                    }
                }
            }
        } catch (Exception $e) {}
    }

    echo json_encode([
        "status" => "success",
        "categories" => $categories,
        "subcategories" => $subcategories,
        "attributes" => $attributes
    ]);
    exit;
}

if ($action === 'save_category' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $c = json_decode($input, true);

    $name = trim($c['name'] ?? '');
    if (empty($name)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category name is required"]);
        exit;
    }

    $slug = trim($c['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $name)));
    $icon = trim($c['icon'] ?? 'checkroom');
    $desc = trim($c['description'] ?? '');
    $order = (int)($c['display_order'] ?? 0);

    if ($pdo) {
        try {
            $id = $c['id'] ?? null;
            $rowExists = false;
            if ($id && is_numeric($id)) {
                $checkStmt = $pdo->prepare("SELECT 1 FROM `categories` WHERE `id` = ?");
                $checkStmt->execute([$id]);
                $rowExists = (bool)$checkStmt->fetchColumn();
            }

            if ($rowExists) {
                $stmt = $pdo->prepare("UPDATE `categories` SET `name` = ?, `slug` = ?, `icon` = ?, `description` = ?, `display_order` = ? WHERE `id` = ?");
                $stmt->execute([$name, $slug, $icon, $desc, $order, $id]);
            } else {
                $stmt = $pdo->prepare("
                    INSERT INTO `categories` (`name`, `slug`, `icon`, `description`, `display_order`)
                    VALUES (?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `icon` = VALUES(`icon`), `description` = VALUES(`description`)
                ");
                $stmt->execute([$name, $slug, $icon, $desc, $order]);
                $id = $pdo->lastInsertId() ?: $id;
            }
            echo json_encode(["status" => "success", "message" => "Category saved successfully", "id" => $id]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Category saved locally"]);
    exit;
}

if ($action === 'delete_category' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $c = json_decode($input, true);
    $catId = $c['id'] ?? null;
    $catName = $c['name'] ?? null;

    if ($pdo) {
        try {
            if ($catId) {
                $pdo->prepare("DELETE FROM `categories` WHERE `id` = ?")->execute([$catId]);
            } else if ($catName) {
                $pdo->prepare("DELETE FROM `categories` WHERE `name` = ?")->execute([$catName]);
            }
            echo json_encode(["status" => "success", "message" => "Category deleted"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Category deleted locally"]);
    exit;
}

if ($action === 'save_subcategory' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $s = json_decode($input, true);

    $catName = trim($s['category_name'] ?? ($s['categoryName'] ?? ''));
    $name = trim($s['name'] ?? '');
    if (empty($name) || empty($catName)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Category name and Subcategory name are required"]);
        exit;
    }

    $slug = trim($s['slug'] ?? strtolower(preg_replace('/[^a-zA-Z0-9]+/', '_', $name)));
    $prefix = strtoupper(trim($s['sku_prefix'] ?? ($s['skuPrefix'] ?? 'GRM')));

    if ($pdo) {
        try {
            $id = $s['id'] ?? null;
            $rowExists = false;
            if ($id && is_numeric($id)) {
                $checkStmt = $pdo->prepare("SELECT 1 FROM `subcategories` WHERE `id` = ?");
                $checkStmt->execute([$id]);
                $rowExists = (bool)$checkStmt->fetchColumn();
            }

            if ($rowExists) {
                $stmt = $pdo->prepare("UPDATE `subcategories` SET `category_name` = ?, `name` = ?, `slug` = ?, `sku_prefix` = ? WHERE `id` = ?");
                $stmt->execute([$catName, $name, $slug, $prefix, $id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO `subcategories` (`category_name`, `name`, `slug`, `sku_prefix`) VALUES (?, ?, ?, ?)");
                $stmt->execute([$catName, $name, $slug, $prefix]);
                $id = $pdo->lastInsertId() ?: $id;
            }
            echo json_encode(["status" => "success", "message" => "Subcategory saved successfully", "id" => $id]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Subcategory saved locally"]);
    exit;
}

if ($action === 'delete_subcategory' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $s = json_decode($input, true);
    $subId = $s['id'] ?? null;
    $subName = $s['name'] ?? null;

    if ($pdo) {
        try {
            if ($subId) {
                $pdo->prepare("DELETE FROM `subcategories` WHERE `id` = ?")->execute([$subId]);
            } else if ($subName) {
                $pdo->prepare("DELETE FROM `subcategories` WHERE `name` = ?")->execute([$subName]);
            }
            echo json_encode(["status" => "success", "message" => "Subcategory deleted"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Subcategory deleted locally"]);
    exit;
}

if ($action === 'save_attribute' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $a = json_decode($input, true);

    $type = strtolower(trim($a['type'] ?? ''));
    $val = trim($a['value'] ?? '');
    $extra = trim($a['extra'] ?? '');

    if (empty($type) || (empty($val) && empty($extra) && $type !== 'attribute_type')) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid attribute type and value are required"]);
        exit;
    }

    // Auto-detect label and content if type is specification
    if ($type === 'specification') {
        if (empty($extra) && strpos($val, ':') !== false) {
            $parts = explode(':', $val, 2);
            $val = trim($parts[0]);
            $extra = trim($parts[1]);
        } else if (empty($val) && !empty($extra)) {
            if (strpos($extra, ':') !== false) {
                $parts = explode(':', $extra, 2);
                $val = trim($parts[0]);
                $extra = trim($parts[1]);
            } else {
                $val = 'Specification';
            }
        } else if (!empty($val) && empty($extra)) {
            $extra = $val;
            $val = 'Specification';
        }
    }

    if ($pdo) {
        try {
            if ($type === 'attribute_type') {
                $chk = $pdo->prepare("SELECT id FROM `attributes` WHERE `type` = 'attribute_type' AND LOWER(`value`) = LOWER(?) LIMIT 1");
                $chk->execute([$val]);
                $existingId = $chk->fetchColumn();
                if (!$existingId) {
                    $stmt = $pdo->prepare("INSERT INTO `attributes` (`type`, `value`, `extra`) VALUES ('attribute_type', ?, ?)");
                    $stmt->execute([$val, $extra ?: $val]);
                    $existingId = (int)$pdo->lastInsertId();
                }
                echo json_encode(["status" => "success", "message" => "Attribute type created", "id" => $existingId]);
                exit;
            } elseif ($type === 'attribute_value' || $type === 'custom') {
                $attrName = !empty($extra) ? $extra : 'Custom';
                // Check if attribute_type exists, if not auto-register it
                $chk = $pdo->prepare("SELECT id FROM `attributes` WHERE `type` = 'attribute_type' AND LOWER(`value`) = LOWER(?) LIMIT 1");
                $chk->execute([$attrName]);
                if (!$chk->fetchColumn()) {
                    $pdo->prepare("INSERT INTO `attributes` (`type`, `value`, `extra`) VALUES ('attribute_type', ?, ?)")->execute([$attrName, $attrName]);
                }

                // Support comma-separated values (e.g. "4GB, 8GB, 16GB")
                if (strpos($val, ',') !== false) {
                    $parts = array_filter(array_map('trim', explode(',', $val)));
                    $firstId = 0;
                    $stmt = $pdo->prepare("INSERT INTO `attributes` (`type`, `value`, `extra`) VALUES ('attribute_value', ?, ?)");
                    foreach ($parts as $p) {
                        if (!empty($p)) {
                            $stmt->execute([$p, $attrName]);
                            if (!$firstId) $firstId = (int)$pdo->lastInsertId();
                        }
                    }
                    echo json_encode(["status" => "success", "message" => "Attribute values saved", "id" => $firstId]);
                    exit;
                } else {
                    $stmt = $pdo->prepare("INSERT INTO `attributes` (`type`, `value`, `extra`) VALUES ('attribute_value', ?, ?)");
                    $stmt->execute([$val, $attrName]);
                    $insertedId = (int)$pdo->lastInsertId();
                    echo json_encode(["status" => "success", "message" => "Attribute value saved", "id" => $insertedId]);
                    exit;
                }
            } elseif ($type === 'specification' && strpos($extra, ',') !== false) {
                $parts = array_filter(array_map('trim', explode(',', $extra)));
                $firstId = 0;
                $stmt = $pdo->prepare("INSERT INTO `attributes` (`type`, `value`, `extra`) VALUES (?, ?, ?)");
                foreach ($parts as $part) {
                    if (!empty($part)) {
                        $stmt->execute(['specification', $val, $part]);
                        if (!$firstId) $firstId = (int)$pdo->lastInsertId();
                    }
                }
                echo json_encode(["status" => "success", "message" => "Specifications saved as single items", "id" => $firstId]);
                exit;
            } else {
                $stmt = $pdo->prepare("INSERT INTO `attributes` (`type`, `value`, `extra`) VALUES (?, ?, ?)");
                $stmt->execute([$type, $val, $extra]);
                $insertedId = (int)$pdo->lastInsertId();
                echo json_encode(["status" => "success", "message" => "Attribute saved to database", "id" => $insertedId]);
                exit;
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Attribute saved locally", "id" => time()]);
    exit;
}

if ($action === 'delete_attribute' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $a = json_decode($input, true);
    $type = strtolower(trim($a['type'] ?? ''));
    $val = trim($a['value'] ?? '');
    $id = !empty($a['id']) ? (int)$a['id'] : null;
    $extra = trim($a['extra'] ?? '');

    if ($pdo && ($id || ($type && ($val || $extra)))) {
        try {
            $deleted = false;
            if ($id && $id < 1000000000) {
                $delStmt = $pdo->prepare("DELETE FROM `attributes` WHERE `id` = ?");
                $delStmt->execute([$id]);
                if ($delStmt->rowCount() > 0) {
                    $deleted = true;
                }
            }

            if (!$deleted) {
                if ($type === 'attribute_type') {
                    // Delete the attribute type definition AND all its child values!
                    $pdo->prepare("DELETE FROM `attributes` WHERE (`type` = 'attribute_type' AND LOWER(`value`) = LOWER(?)) OR (`type` = 'attribute_value' AND LOWER(`extra`) = LOWER(?)) OR (LOWER(`type`) = LOWER(?))")->execute([$val, $val, $val]);
                } elseif ($type === 'attribute_value' || $type === 'custom') {
                    $attrName = !empty($extra) ? $extra : '';
                    if (!empty($attrName)) {
                        $delStmt = $pdo->prepare("DELETE FROM `attributes` WHERE `type` = 'attribute_value' AND `value` = ? AND LOWER(`extra`) = LOWER(?)");
                        $delStmt->execute([$val, $attrName]);
                        if ($delStmt->rowCount() === 0) {
                            $pdo->prepare("DELETE FROM `attributes` WHERE LOWER(`type`) = LOWER(?) AND `value` = ?")->execute([$attrName, $val]);
                        }
                    } else {
                        $pdo->prepare("DELETE FROM `attributes` WHERE `type` = 'attribute_value' AND `value` = ?")->execute([$val]);
                    }
                } elseif ($type === 'specification' && !empty($extra)) {
                    $delStmt = $pdo->prepare("DELETE FROM `attributes` WHERE `type` = 'specification' AND `value` = ? AND `extra` = ?");
                    $delStmt->execute([$val, $extra]);
                    if ($delStmt->rowCount() === 0) {
                        // Fallback matching by extra only
                        $pdo->prepare("DELETE FROM `attributes` WHERE `type` = 'specification' AND `extra` = ?")->execute([$extra]);
                    }
                } elseif ($type === 'specification') {
                    $pdo->prepare("DELETE FROM `attributes` WHERE `type` = 'specification' AND (`value` = ? OR `extra` = ?)")->execute([$val, $val]);
                } else {
                    $pdo->prepare("DELETE FROM `attributes` WHERE `type` = ? AND `value` = ?")->execute([$type, $val]);
                }
            }
            echo json_encode(["status" => "success", "message" => "Attribute removed"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Attribute removed locally"]);
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
// 6. WHATSAPP SALES ORDERS, TRANSACTIONS & STOCK RESERVATION
// =========================================================================
if ($action === 'save_order' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $order = json_decode($input, true);

    if (empty($order['id']) || (empty($order['customerId']) && empty($order['customer_id']))) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID and Customer ID are required"]);
        exit;
    }

    if (!$pdo) {
        echo json_encode(["status" => "success", "message" => "Order saved locally (Database offline)"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $orderId = $order['id'];
        $queryId = $order['queryId'] ?? ($order['query_id'] ?? null);
        $customerId = $order['customerId'] ?? ($order['customer_id'] ?? '');
        $customerName = $order['customerName'] ?? ($order['customer_name'] ?? 'Customer');
        $items = $order['items'] ?? [];
        $grandTotal = (float)($order['grandTotal'] ?? ($order['grand_total'] ?? 0));
        $paymentMethod = $order['paymentMethod'] ?? ($order['payment_method'] ?? 'COD');
        $paymentStatus = $order['paymentStatus'] ?? ($order['payment_status'] ?? 'PENDING');
        $orderStatus = $order['orderStatus'] ?? ($order['order_status'] ?? 'STOCK_RESERVED');
        $customerPhone = $order['customerPhone'] ?? ($order['customer_phone'] ?? '');
        $shippingAddress = $order['shippingAddress'] ?? ($order['shipping_address'] ?? '');
        $codAdvance = (float)($order['codAdvance'] ?? ($order['cod_advance'] ?? 0));
        $codBalanceDue = (float)($order['codBalanceDue'] ?? ($order['cod_balance_due'] ?? 0));
        $upiTransactionId = $order['upiTransactionId'] ?? ($order['upi_transaction_id'] ?? '');
        $paymentScreenshot = $order['paymentScreenshot'] ?? ($order['payment_screenshot'] ?? '');
        $createdBy = $order['createdBy'] ?? ($order['created_by'] ?? ($order['user'] ?? 'Staff'));
        $staffId = $order['staffId'] ?? ($order['staff_id'] ?? '');
        $staffName = $order['staffName'] ?? ($order['staff_name'] ?? $createdBy);
        $trackingNumber = $order['trackingNumber'] ?? ($order['tracking_number'] ?? '');
        $courierName = $order['courierName'] ?? ($order['courier_name'] ?? '');

        // Check and reserve stock atomically
        if (!empty($items) && is_array($items)) {
            foreach ($items as $item) {
                $sku = $item['sku'] ?? null;
                $qty = (int)($item['qty'] ?? ($item['quantity'] ?? 1));
                if ($sku && $qty > 0) {
                    $chk = $pdo->prepare("SELECT `physical_stock`, `reserved_stock` FROM `products` WHERE `sku` = ? FOR UPDATE");
                    $chk->execute([$sku]);
                    $prod = $chk->fetch();
                    if ($prod) {
                        $available = (int)$prod['physical_stock'] - (int)$prod['reserved_stock'];
                        if ($available < $qty) {
                            $pdo->rollBack();
                            http_response_code(400);
                            echo json_encode([
                                "status" => "error",
                                "message" => "Insufficient stock for SKU: {$sku}. Available: {$available}, Requested: {$qty}"
                            ]);
                            exit;
                        }
                        $upd = $pdo->prepare("UPDATE `products` SET `reserved_stock` = `reserved_stock` + ? WHERE `sku` = ?");
                        $upd->execute([$qty, $sku]);
                    }
                }
            }
        }

        // Insert or update order
        $stmt = $pdo->prepare("
            INSERT INTO `orders` (
                `id`, `query_id`, `customer_id`, `customer_name`, `customer_phone`,
                `shipping_address`, `items_json`, `grand_total`, `cod_advance`, `cod_balance_due`,
                `payment_method`, `payment_status`, `upi_transaction_id`, `payment_screenshot`,
                `order_status`, `tracking_number`, `courier_name`, `created_by`, `staff_id`, `staff_name`
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                `customer_name` = VALUES(`customer_name`),
                `customer_phone` = VALUES(`customer_phone`),
                `shipping_address` = VALUES(`shipping_address`),
                `items_json` = VALUES(`items_json`),
                `grand_total` = VALUES(`grand_total`),
                `cod_advance` = VALUES(`cod_advance`),
                `cod_balance_due` = VALUES(`cod_balance_due`),
                `payment_method` = VALUES(`payment_method`),
                `payment_status` = VALUES(`payment_status`),
                `upi_transaction_id` = VALUES(`upi_transaction_id`),
                `payment_screenshot` = VALUES(`payment_screenshot`),
                `order_status` = VALUES(`order_status`),
                `tracking_number` = VALUES(`tracking_number`),
                `courier_name` = VALUES(`courier_name`),
                `staff_id` = VALUES(`staff_id`),
                `staff_name` = VALUES(`staff_name`)
        ");
        $stmt->execute([
            $orderId, $queryId, $customerId, $customerName, $customerPhone,
            $shippingAddress, json_encode($items), $grandTotal, $codAdvance, $codBalanceDue,
            $paymentMethod, $paymentStatus, $upiTransactionId, $paymentScreenshot,
            $orderStatus, $trackingNumber, $courierName, $createdBy, $staffId, $staffName
        ]);

        // Update Customer metrics
        if ($customerId) {
            $pdo->prepare("
                UPDATE `customers` 
                SET `total_orders` = `total_orders` + 1, `total_spend` = `total_spend` + ? 
                WHERE `id` = ?
            ")->execute([$grandTotal, $customerId]);
        }

        // Update Query Status
        if ($queryId && $queryId !== 'N/A') {
            $pdo->prepare("UPDATE `queries` SET `status` = 'RESOLVED' WHERE `id` = ?")->execute([$queryId]);
        }

        // Audit Log
        $pdo->prepare("
            INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
            VALUES (?, 'ORDER_CREATED', 'ORDERS', ?, ?)
        ")->execute([$createdBy, "Order {$orderId} booked for {$customerName}. Amount: ₹{$grandTotal}", date("h:i A")]);

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Order booked and stock reserved in MySQL", "order_id" => $orderId]);
        exit;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'update_order_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $orderId = $data['id'] ?? null;
    $newStatus = $data['order_status'] ?? ($data['status'] ?? null);
    $payStatus = $data['payment_status'] ?? null;
    $user = $data['user'] ?? 'Staff';

    if (!$orderId || !$newStatus) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID and status are required"]);
        exit;
    }

    if (!$pdo) {
        echo json_encode(["status" => "success", "message" => "Order updated locally"]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        $stmt = $pdo->prepare("SELECT * FROM `orders` WHERE `id` = ? FOR UPDATE");
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();

        if ($order) {
            $oldStatus = $order['order_status'];
            $items = json_decode($order['items_json'], true) ?: [];

            // If cancelling: release reserved stock
            if ($newStatus === 'CANCELLED' && $oldStatus !== 'CANCELLED' && $oldStatus !== 'DELIVERED') {
                foreach ($items as $item) {
                    $sku = $item['sku'] ?? null;
                    $qty = (int)($item['qty'] ?? 1);
                    if ($sku && $qty > 0) {
                        $pdo->prepare("UPDATE `products` SET `reserved_stock` = GREATEST(0, `reserved_stock` - ?) WHERE `sku` = ?")
                            ->execute([$qty, $sku]);
                    }
                }
            }

            // If fulfilled/delivered: deduct physical stock and release reserved stock
            if (($newStatus === 'DELIVERED' || $newStatus === 'FULFILLED') && $oldStatus !== 'DELIVERED' && $oldStatus !== 'FULFILLED') {
                foreach ($items as $item) {
                    $sku = $item['sku'] ?? null;
                    $qty = (int)($item['qty'] ?? 1);
                    if ($sku && $qty > 0) {
                        $pdo->prepare("
                            UPDATE `products` 
                            SET `physical_stock` = GREATEST(0, `physical_stock` - ?),
                                `reserved_stock` = GREATEST(0, `reserved_stock` - ?) 
                            WHERE `sku` = ?
                        ")->execute([$qty, $qty, $sku]);
                    }
                }
            }

            if ($payStatus) {
                $pdo->prepare("UPDATE `orders` SET `order_status` = ?, `payment_status` = ? WHERE `id` = ?")
                    ->execute([$newStatus, $payStatus, $orderId]);
            } else {
                $pdo->prepare("UPDATE `orders` SET `order_status` = ? WHERE `id` = ?")
                    ->execute([$newStatus, $orderId]);
            }

            $pdo->prepare("
                INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
                VALUES (?, 'ORDER_STATUS_UPDATED', 'ORDERS', ?, ?)
            ")->execute([$user, "Order {$orderId} status changed from {$oldStatus} to {$newStatus}", date("h:i A")]);
        }

        $pdo->commit();
        echo json_encode(["status" => "success", "message" => "Order status updated in database"]);
        exit;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'reassign_order_staff' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $orderId = $data['id'] ?? ($data['order_id'] ?? null);
    $staffId = $data['staff_id'] ?? null;
    $staffName = $data['staff_name'] ?? null;
    $user = $data['user'] ?? 'Super Admin';

    if (!$orderId || !$staffId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID and Staff ID are required"]);
        exit;
    }

    if ($pdo) {
        $stmt = $pdo->prepare("UPDATE `orders` SET `staff_id` = ?, `staff_name` = ?, `created_by` = ? WHERE `id` = ?");
        $stmt->execute([$staffId, $staffName, $staffName, $orderId]);
        
        $pdo->prepare("
            INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
            VALUES (?, 'ORDER_REASSIGNED', 'ORDERS', ?, ?)
        ")->execute([$user, "Order {$orderId} reassigned to staff: {$staffName} ({$staffId})", date("h:i A")]);
    }

    echo json_encode(["status" => "success", "message" => "Order staff reassigned successfully", "staff_id" => $staffId, "staff_name" => $staffName]);
    exit;
}

if ($action === 'get_orders') {
    try {
        if (!$pdo) {
            echo json_encode(["status" => "success", "orders" => []]);
            exit;
        }
        $stmt = $pdo->query("SELECT * FROM `orders` ORDER BY `created_at` DESC");
        $orders = $stmt->fetchAll();
        foreach ($orders as &$o) {
            if (!empty($o['items_json']) && is_string($o['items_json'])) {
                $o['items'] = json_decode($o['items_json'], true) ?: [];
            }
            $o['queryId'] = $o['query_id'] ?? '';
            $o['customerId'] = $o['customer_id'] ?? '';
            $o['customerName'] = $o['customer_name'] ?? 'Customer';
            $o['customerPhone'] = $o['customer_phone'] ?? '';
            $o['shippingAddress'] = $o['shipping_address'] ?? '';
            $o['grandTotal'] = (float)($o['grand_total'] ?? 0);
            $o['codAdvance'] = (float)($o['cod_advance'] ?? 0);
            $o['codBalanceDue'] = (float)($o['cod_balance_due'] ?? 0);
            $o['paymentMethod'] = $o['payment_method'] ?? 'COD';
            $o['paymentStatus'] = $o['payment_status'] ?? 'PENDING';
            $o['upiTransactionId'] = $o['upi_transaction_id'] ?? '';
            $o['paymentScreenshot'] = $o['payment_screenshot'] ?? '';
            $o['orderStatus'] = $o['order_status'] ?? 'PLACED';
            $o['staffId'] = $o['staff_id'] ?? ($o['created_by'] ?? 'staff_01');
            $o['staffName'] = $o['staff_name'] ?? ($o['created_by'] ?? 'Super Admin');
            $o['createdBy'] = $o['created_by'] ?? ($o['staff_name'] ?? 'Staff');
            $o['trackingNumber'] = $o['tracking_number'] ?? '';
            $o['courierName'] = $o['courier_name'] ?? '';
            $o['createdAt'] = $o['created_at'] ?? '';
        }
        echo json_encode(["status" => "success", "orders" => $orders]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

// =========================================================================
// 7. FOLLOW-UPS SCHEDULING & MANAGEMENT
// =========================================================================
if ($action === 'check_duplicate_followup') {
    $cId = $_GET['customer_id'] ?? '';
    if (!$cId) {
        echo json_encode(["status" => "success", "has_active" => false]);
        exit;
    }
    if ($pdo) {
        try {
            $chk = $pdo->prepare("SELECT id, date_str, time_str, assigned_to, reason FROM `followups` WHERE `customer_id` = ? AND `status` = 'PENDING' LIMIT 1");
            $chk->execute([$cId]);
            $existing = $chk->fetch();
            if ($existing) {
                echo json_encode([
                    "status" => "warning",
                    "has_active" => true,
                    "existing" => [
                        "id" => $existing['id'],
                        "date" => $existing['date_str'],
                        "time" => $existing['time_str'],
                        "assignedTo" => $existing['assigned_to'],
                        "reason" => $existing['reason']
                    ],
                    "message" => "Customer already has an active pending follow-up."
                ]);
                exit;
            }
        } catch (Exception $e) {}
    }
    echo json_encode(["status" => "success", "has_active" => false]);
    exit;
}

if ($action === 'save_followup' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $fu = json_decode($input, true);

    if (empty($fu['id']) || (empty($fu['customerId']) && empty($fu['customer_id']))) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Follow-up ID and Customer ID are required"]);
        exit;
    }

    $cId = $fu['customerId'] ?? ($fu['customer_id'] ?? '');
    $cName = $fu['customerName'] ?? ($fu['customer_name'] ?? 'Customer');
    $qId = $fu['queryId'] ?? ($fu['query_id'] ?? null);
    $assignedTo = $fu['assignedTo'] ?? ($fu['assigned_to'] ?? 'staff_01');
    $dateStr = $fu['date'] ?? ($fu['date_str'] ?? date('Y-m-d'));
    $timeStr = $fu['time'] ?? ($fu['time_str'] ?? '11:00 AM');
    $reason = $fu['reason'] ?? ($fu['notes'] ?? 'Follow-up callback');
    $priority = $fu['priority'] ?? 'NORMAL';
    $channel = $fu['channel'] ?? ($fu['contact_channel'] ?? 'WHATSAPP');
    $rescheduledFrom = $fu['rescheduledFromId'] ?? ($fu['rescheduled_from_id'] ?? null);
    $isPaymentPending = !empty($fu['isPaymentPending']) ? 1 : (!empty($fu['is_payment_pending']) ? 1 : 0);
    $paymentAmount = (float)($fu['paymentAmount'] ?? ($fu['payment_amount'] ?? 0));
    $shippingAmount = (float)($fu['shippingAmount'] ?? ($fu['shipping_amount'] ?? 0));
    $paymentMode = $fu['paymentMode'] ?? ($fu['payment_mode'] ?? 'UPI');
    $advancePayment = (float)($fu['advancePayment'] ?? ($fu['advance_payment'] ?? 0));
    $paymentDueDate = $fu['paymentDueDate'] ?? ($fu['payment_due_date'] ?? null);
    $paymentNotes = $fu['paymentNotes'] ?? ($fu['payment_notes'] ?? null);
    $quotedItems = $fu['quotedItems'] ?? ($fu['quoted_items'] ?? null);

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `followups` (`id`, `query_id`, `rescheduled_from_id`, `customer_id`, `customer_name`, `assigned_to`, `date_str`, `time_str`, `reason`, `status`, `outcome`, `priority`, `contact_channel`, `is_payment_pending`, `payment_amount`, `shipping_amount`, `payment_mode`, `advance_payment`, `payment_due_date`, `payment_notes`, `quoted_items`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `date_str` = VALUES(`date_str`),
                    `time_str` = VALUES(`time_str`),
                    `reason` = VALUES(`reason`),
                    `assigned_to` = VALUES(`assigned_to`),
                    `priority` = VALUES(`priority`),
                    `contact_channel` = VALUES(`contact_channel`),
                    `is_payment_pending` = VALUES(`is_payment_pending`),
                    `payment_amount` = VALUES(`payment_amount`),
                    `shipping_amount` = VALUES(`shipping_amount`),
                    `payment_mode` = VALUES(`payment_mode`),
                    `advance_payment` = VALUES(`advance_payment`),
                    `payment_due_date` = VALUES(`payment_due_date`),
                    `payment_notes` = VALUES(`payment_notes`),
                    `quoted_items` = VALUES(`quoted_items`)
            ");
            $stmt->execute([
                $fu['id'],
                $qId,
                $rescheduledFrom,
                $cId,
                $cName,
                $assignedTo,
                $dateStr,
                $timeStr,
                $reason,
                $priority,
                $channel,
                $isPaymentPending,
                $paymentAmount,
                $shippingAmount,
                $paymentMode,
                $advancePayment,
                $paymentDueDate,
                $paymentNotes,
                $quotedItems
            ]);

            if ($qId && $qId !== 'N/A') {
                $pdo->prepare("UPDATE `queries` SET `status` = 'FOLLOW_UP' WHERE `id` = ?")->execute([$qId]);
            }

            // Record in audit log
            $actor = $_SESSION['user']['name'] ?? ($fu['actor'] ?? 'Staff');
            $payAuditInfo = $isPaymentPending ? " [💳 Payment Pending: ₹{$paymentAmount} via {$paymentMode}]" : "";
            $pdo->prepare("
                INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
                VALUES (?, 'FOLLOWUP_SCHEDULED', 'FOLLOWUP', ?, ?)
            ")->execute([
                $actor,
                "Follow-up {$fu['id']} scheduled for {$cName} on {$dateStr} at {$timeStr} via {$channel} (Priority: {$priority}){$payAuditInfo}",
                date('Y-m-d H:i:s')
            ]);

            echo json_encode(["status" => "success", "message" => "Follow-up saved in database", "id" => $fu['id'], "isPaymentPending" => (bool)$isPaymentPending]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    // Save locally in fallback JSON file if MySQL is offline
    $fallbackFuFile = __DIR__ . '/config/followups_fallback.json';
    $fallbackFollowups = file_exists($fallbackFuFile) ? json_decode(file_get_contents($fallbackFuFile), true) : [];
    if (!is_array($fallbackFollowups)) $fallbackFollowups = [];
    $existingIndex = -1;
    foreach ($fallbackFollowups as $idx => $item) {
        if (($item['id'] ?? '') === ($fu['id'] ?? '')) {
            $existingIndex = $idx;
            break;
        }
    }
    if ($existingIndex >= 0) {
        $fallbackFollowups[$existingIndex] = $fu;
    } else {
        array_unshift($fallbackFollowups, $fu);
    }
    file_put_contents($fallbackFuFile, json_encode($fallbackFollowups, JSON_PRETTY_PRINT));
    echo json_encode(["status" => "success", "message" => "Follow-up saved in local fallback store", "id" => $fu['id']]);
    exit;
}

if ($action === 'log_followup_outcome' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $fuId = $data['id'] ?? null;
    $outcome = $data['outcome'] ?? 'INTERESTED';
    $notes = trim($data['notes'] ?? '');
    $user = $_SESSION['user']['name'] ?? ($data['user'] ?? 'Staff Member');

    if (!$fuId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Follow-up ID is required"]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            $fStmt = $pdo->prepare("SELECT * FROM `followups` WHERE `id` = ?");
            $fStmt->execute([$fuId]);
            $currentFu = $fStmt->fetch();

            if (!$currentFu) {
                throw new Exception("Follow-up record {$fuId} not found");
            }

            // 1. Mark current follow-up as COMPLETED with the chosen outcome
            $upStmt = $pdo->prepare("
                UPDATE `followups` 
                SET `status` = 'COMPLETED', `outcome` = ?, `outcome_notes` = ?, `completed_at` = NOW() 
                WHERE `id` = ?
            ");
            $upStmt->execute([$outcome, $notes, $fuId]);

            $qId = $currentFu['query_id'];
            $nextFuId = null;

            // 2. Handle outcome side effects
            if ($outcome === 'ORDER_PLACED') {
                if ($qId) {
                    $pdo->prepare("UPDATE `queries` SET `status` = 'CONVERTED' WHERE `id` = ?")->execute([$qId]);
                }
            } elseif ($outcome === 'LOST') {
                if ($qId) {
                    $pdo->prepare("UPDATE `queries` SET `status` = 'LOST' WHERE `id` = ?")->execute([$qId]);
                }
            } elseif ($outcome === 'FOLLOWUP_AGAIN' && !empty($data['next_followup'])) {
                $next = $data['next_followup'];
                $nextFuId = 'FU-2026-00' . rand(1000, 9999);
                $insNext = $pdo->prepare("
                    INSERT INTO `followups` (`id`, `query_id`, `rescheduled_from_id`, `customer_id`, `customer_name`, `assigned_to`, `date_str`, `time_str`, `reason`, `status`, `outcome`, `priority`, `contact_channel`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', ?, ?)
                ");
                $insNext->execute([
                    $nextFuId,
                    $qId,
                    $fuId,
                    $currentFu['customer_id'],
                    $currentFu['customer_name'],
                    $next['assigned_to'] ?? $currentFu['assigned_to'],
                    $next['date'] ?? date('Y-m-d', strtotime('+1 day')),
                    $next['time'] ?? '11:00 AM',
                    $next['reason'] ?? 'Follow-up callback',
                    $next['priority'] ?? $currentFu['priority'],
                    $next['channel'] ?? $currentFu['contact_channel']
                ]);
                if ($qId) {
                    $pdo->prepare("UPDATE `queries` SET `status` = 'FOLLOW_UP' WHERE `id` = ?")->execute([$qId]);
                }
            }

            // 3. Tamper-evident Audit Log
            $auditStmt = $pdo->prepare("
                INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
                VALUES (?, 'FOLLOWUP_OUTCOME_LOGGED', 'FOLLOWUP', ?, ?)
            ");
            $auditStmt->execute([
                $user,
                "Follow-up {$fuId} ({$currentFu['customer_name']}) completed with outcome: {$outcome}. Notes: {$notes}" . ($nextFuId ? " (Next scheduled: {$nextFuId})" : ""),
                date('Y-m-d H:i:s')
            ]);

            $pdo->commit();
            echo json_encode([
                "status" => "success", 
                "message" => "Outcome saved successfully", 
                "outcome" => $outcome, 
                "next_followup_id" => $nextFuId
            ]);
            exit;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Outcome saved locally"]);
    exit;
}

if ($action === 'reassign_followup' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $fuId = $data['id'] ?? null;
    $newStaff = $data['assigned_to'] ?? null;
    $user = $_SESSION['user']['name'] ?? ($data['user'] ?? 'Admin');

    if (!$fuId || !$newStaff) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Follow-up ID and new staff ID are required"]);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE `followups` SET `assigned_to` = ? WHERE `id` = ?");
            $stmt->execute([$newStaff, $fuId]);

            $pdo->prepare("
                INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
                VALUES (?, 'FOLLOWUP_REASSIGNED', 'FOLLOWUP', ?, ?)
            ")->execute([
                $user,
                "Follow-up {$fuId} reassigned to staff: {$newStaff}",
                date('Y-m-d H:i:s')
            ]);

            echo json_encode(["status" => "success", "message" => "Follow-up reassigned successfully"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Reassigned locally"]);
    exit;
}

if ($action === 'update_followup_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $fu = json_decode($input, true);
    $fuId = $fu['id'] ?? null;
    $status = $fu['status'] ?? 'COMPLETED';

    if (!$fuId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Follow-up ID is required"]);
        exit;
    }

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("UPDATE `followups` SET `status` = ? WHERE `id` = ?");
            $stmt->execute([$status, $fuId]);
            echo json_encode(["status" => "success", "message" => "Follow-up status updated"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Follow-up status updated locally"]);
    exit;
}

// =========================================================================
// 8. CUSTOMER ENQUIRIES ASSIGNMENT & AUDIT LOGS
// =========================================================================
if ($action === 'assign_query' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $q = json_decode($input, true);
    $queryId = $q['id'] ?? ($q['query_id'] ?? null);
    $assignedTo = $q['assigned_to'] ?? ($q['staff_id'] ?? 'UNASSIGNED');
    $status = $q['status'] ?? ($assignedTo === 'UNASSIGNED' ? 'NEW' : 'ASSIGNED');
    $notes = trim($q['notes'] ?? '');
    $user = $q['user'] ?? 'Admin';
    $isPayPending = !empty($q['isPaymentPending']) ? 1 : (!empty($q['is_payment_pending']) ? 1 : 0);
    $payAmt = (float)($q['paymentAmount'] ?? ($q['payment_amount'] ?? 0));
    $shipAmt = (float)($q['shippingAmount'] ?? ($q['shipping_amount'] ?? 0));
    $payMode = $q['paymentMode'] ?? ($q['payment_mode'] ?? 'UPI');
    $advAmt = (float)($q['advancePayment'] ?? ($q['advance_payment'] ?? 0));
    $payDue = $q['paymentDueDate'] ?? ($q['payment_due_date'] ?? null);
    $payNotes = $q['paymentNotes'] ?? ($q['payment_notes'] ?? null);
    $quotedItems = $q['quotedItems'] ?? ($q['quoted_items'] ?? null);
    $cbDate = $q['callbackDate'] ?? ($q['callback_date'] ?? null);
    $cbTime = $q['callbackTime'] ?? ($q['callback_time'] ?? '11:00 AM');
    $statusHist = isset($q['statusHistory']) ? (is_array($q['statusHistory']) ? json_encode($q['statusHistory']) : $q['statusHistory']) : null;

    $customerId = $q['customer_id'] ?? ($q['customerId'] ?? null);
    $customerName = $q['customer_name'] ?? ($q['customerName'] ?? null);
    $phone = $q['phone'] ?? null;
    $whatsapp = $q['whatsapp'] ?? ($phone ?? null);
    $reason = $q['reason'] ?? ($notes ?: 'Customer not interested in products (Requested DND)');
    $dndTimestamp = $q['dnd_timestamp'] ?? date("d M Y at h:i A");

    if (!$queryId && !$customerId) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Query ID or Customer ID is required"]);
        exit;
    }

    if (!$queryId) {
        $queryId = 'Q-' . date('Y') . '-' . rand(100000, 999999);
    }

    if ($pdo) {
        try {
            // 1. Resolve or Create Customer in MySQL
            $cData = null;
            if ($queryId) {
                $cStmt = $pdo->prepare("SELECT `id`, `name`, `phone`, `whatsapp` FROM `customers` WHERE `id` = (SELECT `customer_id` FROM `queries` WHERE `id` = ?)");
                $cStmt->execute([$queryId]);
                $cData = $cStmt->fetch(PDO::FETCH_ASSOC);
            }

            if (!$cData && $customerId) {
                $cStmt = $pdo->prepare("SELECT `id`, `name`, `phone`, `whatsapp` FROM `customers` WHERE `id` = ?");
                $cStmt->execute([$customerId]);
                $cData = $cStmt->fetch(PDO::FETCH_ASSOC);
            }

            if (!$cData && $phone) {
                $cleanP = preg_replace('/[^0-9]/', '', $phone);
                if (strlen($cleanP) >= 7) {
                    $cStmt = $pdo->prepare("SELECT `id`, `name`, `phone`, `whatsapp` FROM `customers` WHERE REPLACE(REPLACE(REPLACE(`phone`, ' ', ''), '+', ''), '-', '') LIKE ? OR REPLACE(REPLACE(REPLACE(`whatsapp`, ' ', ''), '+', ''), '-', '') LIKE ? LIMIT 1");
                    $cStmt->execute(['%' . substr($cleanP, -10), '%' . substr($cleanP, -10)]);
                    $cData = $cStmt->fetch(PDO::FETCH_ASSOC);
                }
            }

            if (!$cData && ($customerId || $phone || $customerName)) {
                $cid = $customerId ?: ('cust_' . (preg_replace('/[^0-9]/', '', $phone ?: '') ?: uniqid()));
                $cName = $customerName ?: 'Customer';
                $cPhone = $phone ?: '';
                $cWa = $whatsapp ?: $cPhone;
                $cCode = 'CUST-' . date('Y') . '-' . rand(1000, 9999);
                
                $pdo->prepare("
                    INSERT INTO `customers` (`id`, `code`, `name`, `phone`, `whatsapp`, `customer_type`, `created_at`)
                    VALUES (?, ?, ?, ?, ?, 'Live WhatsApp Lead', NOW())
                    ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `phone` = VALUES(`phone`), `whatsapp` = VALUES(`whatsapp`)
                ")->execute([$cid, $cCode, $cName, $cPhone, $cWa]);
                $cData = ['id' => $cid, 'name' => $cName, 'phone' => $cPhone, 'whatsapp' => $cWa];
            }

            $cid = $cData ? $cData['id'] : ($customerId ?: null);

            // 2. Resolve or Create Query in MySQL
            $qCheck = $pdo->prepare("SELECT `id` FROM `queries` WHERE `id` = ?");
            $qCheck->execute([$queryId]);
            if (!$qCheck->fetch()) {
                $pdo->prepare("
                    INSERT INTO `queries` (
                        `id`, `customer_id`, `assigned_to`, `status`, `status_notes`, `query_text`,
                        `is_payment_pending`, `payment_amount`, `shipping_amount`, `payment_mode`,
                        `advance_payment`, `payment_due_date`, `payment_notes`, `quoted_items`,
                        `callback_date`, `callback_time`, `status_history`, `priority`, `created_at`
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'NORMAL', NOW())
                ")->execute([
                    $queryId, $cid, $assignedTo, $status, $notes, $notes ?: 'WhatsApp Lead Enquiry',
                    $isPayPending, $payAmt, $shipAmt, $payMode,
                    $advAmt, $payDue, $payNotes, $quotedItems,
                    $cbDate, $cbTime, $statusHist
                ]);
            } else {
                $stmt = $pdo->prepare("
                    UPDATE `queries` 
                    SET `assigned_to` = ?, `status` = ?, `status_notes` = ?,
                        `is_payment_pending` = ?, `payment_amount` = ?, `shipping_amount` = ?,
                        `payment_mode` = ?, `advance_payment` = ?, `payment_due_date` = ?,
                        `payment_notes` = ?, `quoted_items` = ?, `callback_date` = ?,
                        `callback_time` = ?,
                        `status_history` = COALESCE(?, `status_history`)
                    WHERE `id` = ?
                ");
                $stmt->execute([
                    $assignedTo, $status, $notes,
                    $isPayPending, $payAmt, $shipAmt,
                    $payMode, $advAmt, $payDue,
                    $payNotes, $quotedItems, $cbDate,
                    $cbTime, $statusHist,
                    $queryId
                ]);
            }

            // 3. Synchronize customer DND fields and dedicated dnd_records table in MySQL
            if ($cid) {
                if ($status === 'DND') {
                    $dndTime = $dndTimestamp ?: date("d M Y at h:i A");
                    $dndReason = $reason ?: ($notes ?: 'Customer not interested in products (Requested DND)');

                    // A. Update customers table
                    $pdo->prepare("UPDATE `customers` SET `is_dnd` = 1, `dnd_reason` = ?, `dnd_notes` = ?, `dnd_marked_by` = ?, `dnd_timestamp` = ? WHERE `id` = ?")
                        ->execute([$dndReason, $notes, $user, $dndTime, $cid]);

                    // B. Upsert into dedicated dnd_records table
                    $dndCheck = $pdo->prepare("SELECT `id` FROM `dnd_records` WHERE `customer_id` = ? AND `status` = 'ACTIVE' LIMIT 1");
                    $dndCheck->execute([$cid]);
                    $activeDnd = $dndCheck->fetch(PDO::FETCH_ASSOC);

                    if ($activeDnd) {
                        $pdo->prepare("
                            UPDATE `dnd_records` 
                            SET `reason` = ?, `notes` = ?, `marked_by` = ?, `assigned_to` = ?, `dnd_timestamp` = ?, `query_id` = ?
                            WHERE `id` = ?
                        ")->execute([$dndReason, $notes, $user, $assignedTo, $dndTime, $queryId, $activeDnd['id']]);
                    } else {
                        $pdo->prepare("
                            INSERT INTO `dnd_records` (`customer_id`, `customer_name`, `phone`, `whatsapp`, `query_id`, `reason`, `notes`, `marked_by`, `assigned_to`, `status`, `dnd_timestamp`)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
                        ")->execute([
                            $cid,
                            $cData['name'] ?? ($customerName ?: 'Customer'),
                            $cData['phone'] ?? ($phone ?: ''),
                            $cData['whatsapp'] ?? ($whatsapp ?: ($phone ?: '')),
                            $queryId,
                            $dndReason,
                            $notes,
                            $user,
                            $assignedTo,
                            $dndTime
                        ]);
                    }
                } else {
                    // Restore from DND
                    $pdo->prepare("UPDATE `customers` SET `is_dnd` = 0 WHERE `id` = ?")->execute([$cid]);
                    $pdo->prepare("
                        UPDATE `dnd_records` 
                        SET `status` = 'REVOKED', `revoked_at` = NOW(), `revoked_by` = ? 
                        WHERE `customer_id` = ? AND `status` = 'ACTIVE'
                    ")->execute([$user, $cid]);
                }
            }

            // Update user active queries counter
            if ($assignedTo !== 'UNASSIGNED') {
                $pdo->prepare("
                    UPDATE `users` 
                    SET `active_queries` = (SELECT COUNT(*) FROM `queries` WHERE `assigned_to` = ? AND `status` NOT IN ('RESOLVED', 'CLOSED', 'DND'))
                    WHERE `id` = ?
                ")->execute([$assignedTo, $assignedTo]);
            }

            // Audit Log
            $details = "Query {$queryId} status set to {$status} (Assigned: {$assignedTo})" . ($notes ? " | Note: {$notes}" : "");
            $pdo->prepare("
                INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
                VALUES (?, 'QUERY_STATUS_UPDATED', 'QUERIES', ?, ?)
            ")->execute([$user, $details, date("h:i A")]);

            echo json_encode(["status" => "success", "message" => "Query status and DND records successfully updated in MySQL", "notes" => $notes]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Query assignment updated locally"]);
    exit;
}

// Dedicated direct save endpoint for DND suppression records
if ($action === 'save_dnd_record' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);
    $cid = $p['customer_id'] ?? null;
    $cName = $p['customer_name'] ?? 'Customer';
    $phone = $p['phone'] ?? '';
    $whatsapp = $p['whatsapp'] ?? $phone;
    $queryId = $p['query_id'] ?? null;
    $reason = $p['reason'] ?? 'Customer not interested in products (Requested DND)';
    $notes = $p['notes'] ?? '';
    $markedBy = $p['marked_by'] ?? 'Super Admin';
    $assignedTo = $p['assigned_to'] ?? 'UNASSIGNED';
    $status = $p['status'] ?? 'ACTIVE';
    $dndTimestamp = $p['dnd_timestamp'] ?? date("d M Y at h:i A");

    if ($pdo) {
        try {
            // Ensure customer exists in customers table
            if ($cid) {
                $checkCust = $pdo->prepare("SELECT id FROM `customers` WHERE `id` = ? LIMIT 1");
                $checkCust->execute([$cid]);
                if (!$checkCust->fetch()) {
                    $cCode = 'CUST-' . date('Y') . '-' . rand(1000, 9999);
                    $pdo->prepare("
                        INSERT INTO `customers` (`id`, `code`, `name`, `phone`, `whatsapp`, `customer_type`, `is_dnd`, `dnd_reason`, `dnd_notes`, `dnd_marked_by`, `dnd_timestamp`, `created_at`)
                        VALUES (?, ?, ?, ?, ?, 'Live WhatsApp Lead', 1, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE `is_dnd` = 1, `dnd_reason` = VALUES(`dnd_reason`), `dnd_notes` = VALUES(`dnd_notes`)
                    ")->execute([$cid, $cCode, $cName, $phone, $whatsapp, $reason, $notes, $markedBy, $dndTimestamp]);
                } else {
                    $pdo->prepare("UPDATE `customers` SET `is_dnd` = 1, `dnd_reason` = ?, `dnd_notes` = ?, `dnd_marked_by` = ?, `dnd_timestamp` = ? WHERE `id` = ?")
                        ->execute([$reason, $notes, $markedBy, $dndTimestamp, $cid]);
                }
            }

            // Ensure query exists if queryId provided
            if ($queryId && $cid) {
                $checkQ = $pdo->prepare("SELECT id FROM `queries` WHERE `id` = ? LIMIT 1");
                $checkQ->execute([$queryId]);
                if (!$checkQ->fetch()) {
                    $pdo->prepare("
                        INSERT INTO `queries` (`id`, `customer_id`, `assigned_to`, `status`, `status_notes`, `query_text`, `priority`, `created_at`)
                        VALUES (?, ?, ?, 'DND', ?, ?, 'NORMAL', NOW())
                    ")->execute([$queryId, $cid, $assignedTo, $notes, $reason]);
                } else {
                    $pdo->prepare("UPDATE `queries` SET `status` = 'DND', `status_notes` = ?, `assigned_to` = ? WHERE `id` = ?")
                        ->execute([$notes, $assignedTo, $queryId]);
                }
            }

            // Upsert into dnd_records table
            $checkDnd = $pdo->prepare("SELECT id FROM `dnd_records` WHERE `customer_id` = ? AND `status` = 'ACTIVE' LIMIT 1");
            $checkDnd->execute([$cid]);
            $existing = $checkDnd->fetch(PDO::FETCH_ASSOC);

            if ($existing) {
                $pdo->prepare("
                    UPDATE `dnd_records`
                    SET `customer_name` = ?, `phone` = ?, `whatsapp` = ?, `query_id` = ?, `reason` = ?, `notes` = ?, `marked_by` = ?, `assigned_to` = ?, `dnd_timestamp` = ?
                    WHERE `id` = ?
                ")->execute([$cName, $phone, $whatsapp, $queryId, $reason, $notes, $markedBy, $assignedTo, $dndTimestamp, $existing['id']]);
            } else {
                $pdo->prepare("
                    INSERT INTO `dnd_records` (`customer_id`, `customer_name`, `phone`, `whatsapp`, `query_id`, `reason`, `notes`, `marked_by`, `assigned_to`, `status`, `dnd_timestamp`)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?)
                ")->execute([$cid, $cName, $phone, $whatsapp, $queryId, $reason, $notes, $markedBy, $assignedTo, $dndTimestamp]);
            }

            echo json_encode(["status" => "success", "message" => "Customer successfully registered in MySQL dnd_records table"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
}

// Revoke DND (Reactivate customer)
if ($action === 'revoke_dnd' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);
    $cid = $p['customer_id'] ?? null;
    $queryId = $p['query_id'] ?? null;
    $user = $p['user'] ?? 'Admin';

    if ($cid && $pdo) {
        try {
            $pdo->prepare("UPDATE `customers` SET `is_dnd` = 0 WHERE `id` = ?")->execute([$cid]);
            $pdo->prepare("
                UPDATE `dnd_records` 
                SET `status` = 'REVOKED', `revoked_at` = NOW(), `revoked_by` = ? 
                WHERE `customer_id` = ? AND `status` = 'ACTIVE'
            ")->execute([$user, $cid]);

            if ($queryId) {
                $pdo->prepare("UPDATE `queries` SET `status` = 'IN_PROGRESS' WHERE `id` = ?")->execute([$queryId]);
            } else {
                $pdo->prepare("UPDATE `queries` SET `status` = 'IN_PROGRESS' WHERE `customer_id` = ? AND `status` = 'DND'")->execute([$cid]);
            }

            $details = "Customer {$cid} reactivated from DND list";
            $pdo->prepare("INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`) VALUES (?, 'DND_REVOKED', 'DND', ?, ?)")
                ->execute([$user, $details, date("h:i A")]);

            echo json_encode(["status" => "success", "message" => "Customer reactivated and DND status revoked in MySQL"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
}

if ($action === 'assign_dnd_staff' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $p = json_decode($input, true);
    $cid = $p['customer_id'] ?? null;
    $staffId = $p['staff_id'] ?? 'UNASSIGNED';
    $user = $p['user'] ?? 'Admin';
    $notes = $p['notes'] ?? '';

    if ($cid && $pdo) {
        try {
            $pdo->prepare("UPDATE `dnd_records` SET `assigned_to` = ? WHERE `customer_id` = ? AND `status` = 'ACTIVE'")
                ->execute([$staffId, $cid]);
            $pdo->prepare("UPDATE `queries` SET `assigned_to` = ? WHERE `customer_id` = ?")
                ->execute([$staffId, $cid]);
            
            $details = "DND customer {$cid} assigned to staff {$staffId}" . ($notes ? " | Note: {$notes}" : "");
            $pdo->prepare("INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`) VALUES (?, 'DND_STAFF_ASSIGNED', 'DND', ?, ?)")
                ->execute([$user, $details, date("h:i A")]);

            echo json_encode(["status" => "success", "message" => "DND staff assigned successfully in dnd_records table"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
}

if ($action === 'get_dnd_records') {
    if ($pdo) {
        $stmt = $pdo->query("SELECT * FROM `dnd_records` ORDER BY `created_at` DESC");
        echo json_encode(["status" => "success", "data" => $stmt->fetchAll()]);
        exit;
    }
}

if ($action === 'save_audit_log' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $entry = json_decode($input, true);

    if ($pdo && !empty($entry['action'])) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
                VALUES (?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $entry['user'] ?? 'System',
                $entry['action'],
                $entry['module'] ?? 'SYSTEM',
                $entry['details'] ?? '',
                $entry['timestamp'] ?? ($entry['timestamp_str'] ?? date("h:i A"))
            ]);
            echo json_encode(["status" => "success", "message" => "Audit entry logged"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Audit logged locally"]);
    exit;
}

// =========================================================================
// 9. PRODUCTION SYSTEM HEALTH CHECK ENDPOINT
// =========================================================================
if ($action === 'health_check') {
    $startTime = microtime(true);
    $health = [
        "status" => "HEALTHY",
        "service" => "GRM_CRM_BACKEND_API",
        "timestamp" => date("Y-m-d H:i:s"),
        "checks" => [
            "database" => ["status" => "UNKNOWN"],
            "bridge" => ["status" => "UNKNOWN"],
            "filesystem" => ["status" => "UP"]
        ]
    ];

    // 1. Check Database
    if ($pdo) {
        try {
            $dbStart = microtime(true);
            $stmt = $pdo->query("SELECT COUNT(*) FROM `users`");
            $userCount = $stmt->fetchColumn();
            $latency = round((microtime(true) - $dbStart) * 1000, 2);

            $tableCounts = [];
            foreach (['customers', 'products', 'orders', 'queries', 'messages'] as $tbl) {
                try {
                    $tableCounts[$tbl] = (int)$pdo->query("SELECT COUNT(*) FROM `$tbl`")->fetchColumn();
                } catch (Exception $ex) {
                    $tableCounts[$tbl] = 0;
                }
            }

            $health["checks"]["database"] = [
                "status" => "UP",
                "latency_ms" => $latency,
                "counts" => $tableCounts
            ];
        } catch (Exception $e) {
            $health["status"] = "DEGRADED";
            $health["checks"]["database"] = [
                "status" => "DOWN",
                "error" => $e->getMessage()
            ];
        }
    } else {
        $health["status"] = "DEGRADED";
        $health["checks"]["database"] = [
            "status" => "DOWN",
            "error" => "No active PDO connection"
        ];
    }

    // 2. Check Node.js Baileys Bridge
    $bridgeCheckUrl = $bridgeUrl . '/api/status';
    $ch = @curl_init($bridgeCheckUrl);
    if ($ch) {
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 2);
        $bRes = curl_exec($ch);
        $bCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($bCode === 200 && $bRes) {
            $bJson = json_decode($bRes, true);
            $health["checks"]["bridge"] = [
                "status" => "UP",
                "connection" => $bJson['connection'] ?? 'ONLINE',
                "connected_number" => $bJson['connected_number'] ?? null
            ];
        } else {
            $health["checks"]["bridge"] = [
                "status" => "DOWN",
                "notice" => "Bridge offline or not responding on " . $bridgeUrl
            ];
        }
    }

    // 3. Writable Directories
    $uploadDir = __DIR__ . '/uploads';
    $health["checks"]["filesystem"]["uploads_writable"] = is_writable($uploadDir) || @mkdir($uploadDir, 0777, true);

    $health["total_latency_ms"] = round((microtime(true) - $startTime) * 1000, 2);

    if ($health["checks"]["database"]["status"] === "DOWN") {
        http_response_code(503);
    } else {
        http_response_code(200);
    }

    echo json_encode($health, JSON_PRETTY_PRINT);
    exit;
}

// =========================================================================
// 9.5. BROADCAST TEMPLATES MANAGEMENT (MYSQL DATABASE)
// =========================================================================
if ($action === 'save_broadcast_template' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $tpl = json_decode($input, true);
    $id = $tpl['id'] ?? ($tpl['key'] ?? ('tpl_' . uniqid()));
    $name = $tpl['name'] ?? ($tpl['label'] ?? 'Custom Template');
    $category = $tpl['category'] ?? 'MARKETING';
    $bodyText = $tpl['body_text'] ?? ($tpl['text'] ?? '');
    $imageUrl = $tpl['image_url'] ?? ($tpl['media_url'] ?? null);
    $buttonType = $tpl['button_type'] ?? null;
    $buttonText = $tpl['button_text'] ?? null;
    $buttonUrl = $tpl['button_url'] ?? null;
    $status = $tpl['status'] ?? 'ACTIVE';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `broadcast_templates` (`id`, `name`, `category`, `body_text`, `image_url`, `button_type`, `button_text`, `button_url`, `status`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `name` = VALUES(`name`),
                    `category` = VALUES(`category`),
                    `body_text` = VALUES(`body_text`),
                    `image_url` = VALUES(`image_url`),
                    `button_type` = VALUES(`button_type`),
                    `button_text` = VALUES(`button_text`),
                    `button_url` = VALUES(`button_url`),
                    `status` = VALUES(`status`)
            ");
            $stmt->execute([$id, $name, $category, $bodyText, $imageUrl, $buttonType, $buttonText, $buttonUrl, $status]);
            echo json_encode(["status" => "success", "message" => "Broadcast template saved in database", "id" => $id]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Template saved locally"]);
    exit;
}

if ($action === 'delete_broadcast_template' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $id = $data['id'] ?? ($data['key'] ?? null);
    if ($id && $pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM `broadcast_templates` WHERE `id` = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Template deleted from database"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Template deleted"]);
    exit;
}


// =========================================================================
// 10. DATABASE BACKUP & RESTORE
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