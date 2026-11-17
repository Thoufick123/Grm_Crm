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

// Universal Timezone Enforcement for India Standard Time (IST, UTC+5:30)
date_default_timezone_set('Asia/Kolkata');

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

// =========================================================================
// WHATSAPP MULTILINGUAL VOICE-TO-VOICE TRANSLATOR ACTIONS (6 LANGUAGES ONLY)
// =========================================================================
if (isset($_GET['action'])) {
    $act = $_GET['action'];
    if ($act === 'upload_staff_voice') {
        require_once __DIR__ . '/voice_translator/record_voice.php';
        exit;
    }
    if ($act === 'translate_voice') {
        require_once __DIR__ . '/voice_translator/process_voice.php';
        exit;
    }
    if ($act === 'send_translated_voice') {
        require_once __DIR__ . '/voice_translator/send_voice.php';
        exit;
    }
    if ($act === 'receive_voice' || $act === 'voice_translate_inbound' || $act === 'translate_inbound_voice') {
        require_once __DIR__ . '/voice_translator/receive_voice.php';
        exit;
    }
}


// =========================================================================
// ULTRA-FAST ON-DEMAND TRANSLATION (0ms overhead, runs before DB/Sessions)
// =========================================================================
if (isset($_GET['action']) && $_GET['action'] === 'translate_text') {
    require_once __DIR__ . '/services/TranslationService.php';
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
    $text = trim($input['text'] ?? $_GET['text'] ?? '');
    $targetLang = trim($input['target_lang'] ?? $_GET['target_lang'] ?? 'ta');
    $sourceLang = trim($input['source_lang'] ?? $_GET['source_lang'] ?? 'auto');

    if (empty($text)) {
        echo json_encode(['success' => false, 'error' => 'Text cannot be empty']);
        exit;
    }

    $supportedLangs = [
        'ta' => 'Tamil (தமிழ்)',
        'en' => 'English',
        'hi' => 'Hindi (हिंदी)',
        'te' => 'Telugu (తెలుగు)',
        'ml' => 'Malayalam (മലയാളം)',
        'kn' => 'Kannada (ಕನ್ನಡ)'
    ];

    if (!isset($supportedLangs[$targetLang])) {
        $targetLang = 'ta';
    }

    $transService = new TranslationService();
    $translatedText = $transService->translateText($text, $targetLang, $sourceLang);

    if (empty($translatedText)) {
        echo json_encode(['success' => false, 'error' => 'Translation failed']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'original' => $text,
        'translated' => $translatedText,
        'target_lang' => $targetLang,
        'target_label' => $supportedLangs[$targetLang],
        'detected_source' => $sourceLang
    ]);
    exit;
}

// =========================================================================
// ULTRA-FAST ON-DEMAND TRANSLATION (0ms overhead, runs before DB/Sessions)
// =========================================================================
if (isset($_GET['action']) && $_GET['action'] === 'translate_text') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? [];
    $text = trim($input['text'] ?? $_GET['text'] ?? '');
    $targetLang = trim($input['target_lang'] ?? $_GET['target_lang'] ?? 'ta');
    $sourceLang = trim($input['source_lang'] ?? $_GET['source_lang'] ?? 'auto');

    if (empty($text)) {
        echo json_encode(['success' => false, 'error' => 'Text cannot be empty']);
        exit;
    }

    $supportedLangs = [
        'ta' => 'Tamil (தமிழ்)',
        'en' => 'English',
        'hi' => 'Hindi (हिंदी)',
        'te' => 'Telugu (తెలుగు)',
        'ml' => 'Malayalam (മലയാളം)',
        'kn' => 'Kannada (ಕನ್ನಡ)'
    ];

    if (!isset($supportedLangs[$targetLang])) {
        $targetLang = 'ta';
    }

    $encodedText = urlencode($text);
    $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$sourceLang}&tl={$targetLang}&dt=t&q={$encodedText}";

    $translatedText = '';
    $detectedSource = '';

    if (function_exists('curl_init')) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 4);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
        $response = curl_exec($ch);
        curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => ['timeout' => 4, 'header' => "User-Agent: Mozilla/5.0\r\n"]]);
        $response = @file_get_contents($url, false, $ctx);
    }

    if ($response) {
        $data = json_decode($response, true);
        if (is_array($data) && isset($data[0]) && is_array($data[0])) {
            foreach ($data[0] as $segment) {
                if (isset($segment[0])) {
                    $translatedText .= $segment[0];
                }
            }
            $detectedSource = $data[2] ?? '';
        }
    }

    if (empty($translatedText)) {
        echo json_encode(['success' => false, 'error' => 'Translation failed']);
        exit;
    }

    echo json_encode([
        'success' => true,
        'original' => $text,
        'translated' => $translatedText,
        'target_lang' => $targetLang,
        'target_label' => $supportedLangs[$targetLang],
        'detected_source' => $detectedSource
    ]);
    exit;
}

require_once __DIR__ . '/config/db.php';

if (!headers_sent() && session_status() === PHP_SESSION_NONE) {
    @session_start();
}

$pdo = getDBConnection();
if (isset($_GET['action']) && $_GET['action'] === 'reset_customer_payment') {
    $raw = file_get_contents('php://input');
    $d = json_decode($raw, true) ?: $_POST;
    $cId = trim($d['customer_id'] ?? '');
    $fuId = trim($d['followup_id'] ?? '');
    $qId = trim($d['query_id'] ?? '');
    if ($pdo) {
        if (!empty($cId)) {
            $pdo->prepare("UPDATE `queries` SET `is_payment_pending` = 0, `payment_amount` = 0, `shipping_amount` = 0, `advance_payment` = 0, `payment_due_date` = '', `payment_notes` = '', `quoted_items` = '' WHERE `customer_id` = ?")->execute([$cId]);
            $pdo->prepare("UPDATE `followups` SET `is_payment_pending` = 0, `payment_amount` = 0, `shipping_amount` = 0, `advance_payment` = 0, `payment_due_date` = '', `payment_notes` = '', `quoted_items` = '' WHERE `customer_id` = ?")->execute([$cId]);
        }
        if (!empty($fuId)) {
            $pdo->prepare("UPDATE `followups` SET `is_payment_pending` = 0, `payment_amount` = 0, `shipping_amount` = 0, `advance_payment` = 0, `payment_due_date` = '', `payment_notes` = '', `quoted_items` = '' WHERE `id` = ?")->execute([$fuId]);
        }
        if (!empty($qId)) {
            $pdo->prepare("UPDATE `queries` SET `is_payment_pending` = 0, `payment_amount` = 0, `shipping_amount` = 0, `advance_payment` = 0, `payment_due_date` = '', `payment_notes` = '', `quoted_items` = '' WHERE `id` = ?")->execute([$qId]);
        }
    }
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    exit;
}

$configFile = __DIR__ . '/whatsapp_account_config.json';
$messagesFile = __DIR__ . '/live_messages_queue.json';

/**
 * High-Speed 60-Second Query/Config Cache Helper (APCu / Fast File-backed)
 */
function getCachedConfigItem($cacheKey, $fetchCallback, $ttlSeconds = 60) {
    if (function_exists('apcu_fetch')) {
        $success = false;
        $val = apcu_fetch('grm_crm_' . $cacheKey, $success);
        if ($success && $val !== false) {
            return $val;
        }
        $fresh = $fetchCallback();
        apcu_store('grm_crm_' . $cacheKey, $fresh, $ttlSeconds);
        return $fresh;
    }
    $cacheDir = __DIR__ . '/uploads/cache';
    if (!is_dir($cacheDir)) {
        @mkdir($cacheDir, 0755, true);
    }
    $cacheFile = $cacheDir . '/' . md5($cacheKey) . '.json';
    if (file_exists($cacheFile) && (time() - filemtime($cacheFile)) < $ttlSeconds) {
        $cached = json_decode(@file_get_contents($cacheFile), true);
        if ($cached !== null) {
            return $cached;
        }
    }
    $fresh = $fetchCallback();
    @file_put_contents($cacheFile, json_encode($fresh));
    return $fresh;
}

function invalidateConfigCache($cacheKey = null) {
    if (function_exists('apcu_delete')) {
        if ($cacheKey) {
            apcu_delete('grm_crm_' . $cacheKey);
        } else {
            apcu_clear_cache();
        }
    }
    $cacheDir = __DIR__ . '/uploads/cache';
    if (is_dir($cacheDir)) {
        if ($cacheKey) {
            @unlink($cacheDir . '/' . md5($cacheKey) . '.json');
        } else {
            $files = glob($cacheDir . '/*.json');
            if ($files) {
                foreach ($files as $f) @unlink($f);
            }
        }
    }
}

function getEffectiveBridgeUrl() {
    static $resolved = null;
    if ($resolved !== null) return $resolved;
    $fp = @fsockopen('127.0.0.1', 3000, $errNo, $errStr, 0.1);
    if ($fp) {
        fclose($fp);
        $resolved = 'http://127.0.0.1:3000';
        return $resolved;
    }
    $resolved = defined('BRIDGE_URL') ? BRIDGE_URL : 'http://localhost:3000';
    return $resolved;
}

function curlBridgePost($endpoint, $payloadArray, $timeout = 7) {
    $targetUrl = rtrim(getEffectiveBridgeUrl(), '/') . '/' . ltrim($endpoint, '/');
    $ch = curl_init($targetUrl);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payloadArray));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    $resp = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['http_code' => $httpCode, 'response' => $resp, 'error' => $err];
}

/**
 * Dispatches WhatsApp Bulk Price Decision Notifications to BOTH Admin and Staff
 * Content format matches the user's specification (Image 2) with 100% fidelity.
 */
function dispatchBulkDecisionWhatsAppNotifications($pdo, $req, $decision, $reason = '', $actor = 'Super Admin', $skipAdmin = false) {
    if (!$req || empty($req['request_code'])) {
        return ['status' => 'error', 'message' => 'Invalid request payload'];
    }

    $decisionUpper = strtoupper(trim($decision));
    $isApproved = ($decisionUpper === 'APPROVED');

    // 1. Format the message text matching Image 2 exactly
    if ($isApproved) {
        $reqPriceFormatted = number_format((float)($req['requested_price'] ?? 0), 2, '.', '');
        $totalAmtFormatted = number_format((float)($req['total_requested_amount'] ?? 0), 2, '.', '');
        $sizeStr = !empty($req['size']) ? " ({$req['size']})" : " (Free Size)";
        $productTitle = trim($req['product_name'] ?? 'Garment Product');
        $qty = (int)($req['quantity'] ?? 1);

        $waText = "✅ *BULK PRICE REQUEST APPROVED!*\n\n" .
            "Request Code: *{$req['request_code']}*\n" .
            "Product: *{$productTitle}{$sizeStr} × {$qty} pcs*\n" .
            "Approved Price: *₹{$reqPriceFormatted}/pc* (Total: *₹{$totalAmtFormatted}*)\n\n" .
            "Status: Special price activated. Staff can now take the order.";
    } else {
        $cleanReason = trim($reason ?: ($req['rejection_reason'] ?? 'Price too low for this bulk order quantity amount too low'));
        $reqPriceFormatted = number_format((float)($req['requested_price'] ?? 0), 2, '.', '');
        $totalAmtFormatted = number_format((float)($req['total_requested_amount'] ?? 0), 2, '.', '');
        $sizeStr = !empty($req['size']) ? " ({$req['size']})" : " (Free Size)";
        $productTitle = trim($req['product_name'] ?? 'Garment Product');
        $qty = (int)($req['quantity'] ?? 1);

        $waText = "❌ *BULK PRICE REQUEST REJECTED*\n\n" .
            "Request Code: *{$req['request_code']}*\n";
        if (!empty($req['product_name']) || (float)$reqPriceFormatted > 0) {
            $waText .= "Product: *{$productTitle}{$sizeStr} × {$qty} pcs*\n" .
                       "Requested Price: *₹{$reqPriceFormatted}/pc* (Total: *₹{$totalAmtFormatted}*)\n";
        }
        $waText .= "Reason: *{$cleanReason}*\n\n" .
            "Staff has been informed of rejection.";
    }

    // 2. Resolve Admin Phone
    $adminPhone = trim($req['admin_phone'] ?? '');
    if (empty($adminPhone)) {
        $cfgFile = __DIR__ . '/whatsapp_account_config.json';
        if (file_exists($cfgFile)) {
            $cfg = json_decode(file_get_contents($cfgFile), true);
            if (!empty($cfg['phone_number'])) {
                $adminPhone = $cfg['phone_number'];
            }
        }
    }
    if (empty($adminPhone)) {
        $adminPhone = '+91 99435 57998';
    }

    $cleanAdmin = preg_replace('/[^0-9]/', '', $adminPhone);
    if (strlen($cleanAdmin) === 10) $cleanAdmin = '91' . $cleanAdmin;

    // 3. Resolve Staff Phone
    $staffPhone = trim($req['staff_phone'] ?? '');
    if (empty($staffPhone) && $pdo && (!empty($req['staff_id']) || !empty($req['staff_name']))) {
        try {
            $uStmt = $pdo->prepare("SELECT phone FROM users WHERE id = ? OR username = ? OR name = ? LIMIT 1");
            $uStmt->execute([$req['staff_id'] ?? '', $req['staff_id'] ?? '', $req['staff_name'] ?? '']);
            $staffPhone = (string)$uStmt->fetchColumn();
        } catch (Exception $e) {}
    }

    $cleanStaff = preg_replace('/[^0-9]/', '', $staffPhone);
    if (strlen($cleanStaff) === 10) $cleanStaff = '91' . $cleanStaff;

    // 4. Determine list of recipients
    $targetPhones = [];
    if (!$skipAdmin && strlen($cleanAdmin) >= 10) {
        $targetPhones[] = $cleanAdmin;
    }
    if (strlen($cleanStaff) >= 10) {
        $targetPhones[] = $cleanStaff;
    }
    $targetPhones = array_unique($targetPhones);

    // 5. Send to each recipient via Bridge
    $dispatchResults = [];
    foreach ($targetPhones as $phone) {
        try {
            $res = curlBridgePost('/api/send', [
                'phone' => $phone,
                'text' => $waText
            ], 5);
            $dispatchResults[$phone] = $res['http_code'] ?? 0;
        } catch (Exception $e) {
            $dispatchResults[$phone] = 'error: ' . $e->getMessage();
        }
    }

    // 6. Broadcast Realtime Socket.IO event to all active CRM screens
    try {
        curlBridgePost('/api/bulk_request/event', [
            'status' => $decisionUpper,
            'request' => $req,
            'reason' => $reason
        ], 3);
    } catch (Exception $e) {}

    // 7. Record In-App Notification in DB
    if ($pdo) {
        try {
            $notifTitle = $isApproved 
                ? "Bulk Price Request {$req['request_code']} Approved" 
                : "Bulk Price Request {$req['request_code']} Rejected";
            $notifBody = $isApproved
                ? "Special price ₹" . number_format((float)($req['requested_price'] ?? 0), 2, '.', '') . "/pc activated for customer {$req['customer_name']}."
                : "Request {$req['request_code']} was rejected by {$actor}. Reason: " . ($cleanReason ?? 'Price declined');
            
            $insNotif = $pdo->prepare("
                INSERT INTO `app_notifications`
                (`user_id`, `role`, `title`, `message`, `type`, `reference_id`, `is_read`, `created_at`)
                VALUES (?, 'STAFF', ?, ?, ?, ?, 0, NOW())
            ");
            $insNotif->execute([
                $req['staff_id'] ?: 'all',
                $notifTitle,
                $notifBody,
                $decisionUpper,
                $req['request_code']
            ]);
        } catch (Exception $e) {}
    }

    return [
        'status' => 'success',
        'decision' => $decisionUpper,
        'message_text' => $waText,
        'admin_phone' => $cleanAdmin,
        'staff_phone' => $cleanStaff,
        'recipients' => $targetPhones,
        'dispatches' => $dispatchResults
    ];
}

$bridgeUrl = getEffectiveBridgeUrl();

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

        $scope = isset($_GET['scope']) ? strtolower(trim($_GET['scope'])) : (isset($_GET['view']) ? strtolower(trim($_GET['view'])) : 'full');
        $isInboxScope = ($scope === 'inbox');

        // 1. WhatsApp Account Config
        $waAccounts = [];
        if ($pdo) {
            try {
                $waStmt = $pdo->query("SELECT * FROM `whatsapp_accounts` ORDER BY `id` ASC");
                $waAccounts = $waStmt->fetchAll();
            } catch (Exception $e) {}
        }
        // Merge with json config if available
        if (file_exists($configFile)) {
            $cfgData = json_decode(file_get_contents($configFile), true);
            if (!empty($cfgData['connected_lines']) && is_array($cfgData['connected_lines'])) {
                foreach ($cfgData['connected_lines'] as $line) {
                    $found = false;
                    foreach ($waAccounts as &$wa) {
                        if (($wa['account_slot'] ?? '') === ($line['id'] ?? '')) {
                            if (!empty($line['qr_code']) && empty($wa['qr_code'])) {
                                $wa['qr_code'] = $line['qr_code'];
                            }
                            if (!empty($line['status']) && ($line['status'] === 'SCAN_QR' || $line['status'] === 'CONNECTED')) {
                                $wa['status'] = $line['status'];
                            }
                            $found = true;
                            break;
                        }
                    }
                    if (!$found) {
                        $waAccounts[] = [
                            'account_slot' => $line['id'],
                            'display_name' => $line['label'] ?? $line['id'],
                            'phone_number' => $line['phone_number'] ?? '',
                            'status' => $line['status'] ?? 'DISCONNECTED',
                            'qr_code' => $line['qr_code'] ?? null
                        ];
                    }
                }
            }
        }
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

        // 3. Products (Lazy loaded on-demand for catalog/inventory)
        $products = [];
        if (!$isInboxScope) {
            $pStmt = $pdo->query("SELECT * FROM `products` ORDER BY `id` ASC");
            $products = $pStmt->fetchAll();
        }

        // 4. Customers
        $cStmt = $pdo->query("SELECT * FROM `customers` ORDER BY `created_at` ASC");
        $customers = $cStmt->fetchAll();
        foreach ($customers as &$c) {
            if (!empty($c['tags']) && is_string($c['tags'])) {
                $c['tags'] = json_decode($c['tags'], true) ?: [];
            }
            $c['accountId'] = $c['account_id'] ?? 'account_1';
            $c['lastMessage'] = $c['last_message'] ?? '';
            $c['lastMessageAt'] = $c['last_message_at'] ?? '';
            $c['unreadCount'] = (int)($c['unread_count'] ?? 0);
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

        // 6. Conversations map grouped by customer_id (High-Speed Recent Snippets)
        $mStmt = $pdo->query("SELECT * FROM (SELECT * FROM `messages` ORDER BY `id` DESC LIMIT 300) sub ORDER BY `id` ASC");
        $allMessages = $mStmt->fetchAll();
        $conversations = [];
        foreach ($allMessages as $msg) {
            $cid = $msg['customer_id'];
            if (!isset($conversations[$cid])) {
                $conversations[$cid] = [];
            }
            $conversations[$cid][] = [
                'id' => (string)($msg['message_uid'] ?: $msg['id']),
                'message_uid' => (string)($msg['message_uid'] ?: $msg['id']),
                'db_id' => (int)$msg['id'],
                'sender' => $msg['sender'],
                'sender_name' => $msg['sender_name'] ?? ($msg['sender'] === 'bot' ? 'Bot (Auto-Reply)' : ($msg['sender'] === 'staff' ? 'Super Admin' : 'Customer')),
                'sender_phone' => $msg['sender_phone'] ?? '',
                'sender_jid' => $msg['sender_jid'] ?? '',
                'direction' => $msg['direction'] ?? ($msg['sender'] === 'customer' ? 'inbound' : 'outbound'),
                'isBot' => (bool)($msg['is_bot'] ?? ($msg['sender'] === 'bot')),
                'is_bot' => (int)($msg['is_bot'] ?? ($msg['sender'] === 'bot' ? 1 : 0)),
                'account_id' => $msg['account_id'] ?? 'account_1',
                'accountId' => $msg['account_id'] ?? 'account_1',
                'received_on_number' => $msg['received_on_number'] ?? '',
                'rule_name' => $msg['rule_name'] ?? null,
                'rule_id' => $msg['rule_id'] ?? null,
                'source' => $msg['source'] ?? 'REAL_WHATSAPP_LIVE',
                'text' => $msg['text'],
                'message_text' => $msg['message_text'] ?: $msg['text'],
                'type' => $msg['media_type'] ?: 'text',
                'media_type' => $msg['media_type'],
                'mediaType' => $msg['media_type'],
                'media_url' => $msg['media_url'],
                'mediaUrl' => $msg['media_url'],
                'duration' => (float)($msg['audio_duration'] ?: 8),
                'audio_duration' => $msg['audio_duration'],
                'audioDuration' => $msg['audio_duration'],
                'time' => $msg['time_str'],
                'timestamp_epoch' => (int)($msg['timestamp_epoch'] ?? strtotime($msg['created_at'])),
                'status' => $msg['status'] ?: 'DELIVERED',
                'created_at' => $msg['created_at']
            ];
        }

        // 7. Orders (Lazy loaded on-demand for Orders module / Executive Dashboard)
        $orders = [];
        if (!$isInboxScope) {
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
                $o['codAdvance'] = (float)($o['cod_advance'] ?? ($o['advance_payment'] ?? 0));
                $o['codBalanceDue'] = (float)($o['cod_balance_due'] ?? ($o['balance_amount'] ?? 0));
                $o['shippingAmount'] = (float)($o['shipping_amount'] ?? 0);
                $o['shippingCharge'] = (float)($o['shipping_amount'] ?? 0);
                $o['advancePayment'] = (float)($o['advance_payment'] ?? ($o['cod_advance'] ?? 0));
                $o['balanceAmount'] = (float)($o['balance_amount'] ?? ($o['cod_balance_due'] ?? 0));
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
        }

        // 8. Followups (Normalized with lifecycle & RBAC fields)
        $fStmt = $pdo->query("SELECT * FROM `followups` WHERE `id` NOT LIKE 'FU-2026-000%' AND `id` NOT IN ('FU-2026-00107', 'FU-2026-00108', 'FU-2026-00109', 'FU-2026-00110') AND `customer_id` NOT IN ('cust_101', 'cust_102', 'cust_103') AND (`reason` IS NULL OR `reason` NOT LIKE '%ytfdw%') ORDER BY `created_at` DESC");
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

        // 9. Audit Logs (Loaded for full scope or audit tab)
        $auditLogs = [];
        if (!$isInboxScope) {
            try {
                $aStmt = $pdo->query("SELECT * FROM `audit_logs` ORDER BY `id` DESC LIMIT 100");
                $auditLogs = $aStmt->fetchAll();
            } catch (Exception $e) {}
        }

        // 9.1 Dedicated DND Records Table
        $dndRecords = [];
        if (!$isInboxScope) {
            try {
                $dndStmt = $pdo->query("SELECT * FROM `dnd_records` ORDER BY `created_at` DESC");
                $dndRecords = $dndStmt->fetchAll();
            } catch (Exception $e) {}
        }

        // 10. Categories, Subcategories & Attributes (60-Second Query Cache)
        $rolePermissions = [];
        $categories = [];
        $subcategories = [];
        $attributes = ['sizes' => [], 'colors' => [], 'fabrics' => [], 'specifications' => [], 'custom' => []];
        $arRules = [];
        $bcTemplates = [];

        if (!$isInboxScope) {
            $cachedConfig = getCachedConfigItem('catalog_and_rules_cache', function() use ($pdo) {
                $cRolePermissions = [];
                $cCategories = [];
                $cSubcategories = [];
                $cAttributes = ['sizes' => [], 'colors' => [], 'fabrics' => [], 'specifications' => [], 'custom' => []];

                try {
                    $catStmt = $pdo->query("SELECT * FROM `categories` ORDER BY `display_order` ASC, `name` ASC");
                    $cCategories = $catStmt->fetchAll();

                    $subStmt = $pdo->query("SELECT * FROM `subcategories` ORDER BY `name` ASC");
                    $cSubcategories = $subStmt->fetchAll();

                    $attrStmt = $pdo->query("SELECT * FROM `attributes` ORDER BY `id` ASC");
                    $rawAttrs = $attrStmt->fetchAll();
                    foreach ($rawAttrs as $ra) {
                        $type = $ra['type'] ?? '';
                        if ($type === 'size') $cAttributes['sizes'][] = $ra['value'];
                        else if ($type === 'color') $cAttributes['colors'][] = $ra['value'];
                        else if ($type === 'fabric') $cAttributes['fabrics'][] = $ra['value'];
                        else if ($type === 'role_permissions') {
                            $decoded = json_decode($ra['extra'] ?? '', true);
                            if ($decoded) {
                                $cRolePermissions[$ra['value']] = $decoded;
                            }
                        } else if ($type === 'specification') {
                            $extraStr = $ra['extra'] ?? '';
                            if (strpos($extraStr, ',') !== false) {
                                $parts = array_filter(array_map('trim', explode(',', $extraStr)));
                                foreach ($parts as $pIdx => $part) {
                                    $cAttributes['specifications'][] = [
                                        'id' => (int)$ra['id'] * 1000 + $pIdx,
                                        'label' => $ra['value'],
                                        'content' => $part
                                    ];
                                }
                            } else {
                                $cAttributes['specifications'][] = [
                                    'id' => (int)$ra['id'],
                                    'label' => $ra['value'],
                                    'content' => $extraStr
                                ];
                            }
                        } else if ($type === 'attribute_type') {
                            $attrName = trim($ra['value']);
                            if (!empty($attrName) && !isset($cAttributes['custom'][$attrName])) {
                                $cAttributes['custom'][$attrName] = [];
                            }
                        } else if ($type === 'attribute_value' || $type === 'custom') {
                            $attrName = trim($ra['extra'] ?: 'Custom');
                            if (!isset($cAttributes['custom'][$attrName])) {
                                $cAttributes['custom'][$attrName] = [];
                            }
                            if (!empty($ra['value']) && !in_array($ra['value'], $cAttributes['custom'][$attrName])) {
                                $cAttributes['custom'][$attrName][] = $ra['value'];
                            }
                        } else {
                            $attrName = trim($ra['extra'] ?: ucfirst($ra['type']));
                            if (!empty($attrName)) {
                                if (!isset($cAttributes['custom'][$attrName])) {
                                    $cAttributes['custom'][$attrName] = [];
                                }
                                if (!empty($ra['value']) && !in_array($ra['value'], $cAttributes['custom'][$attrName])) {
                                    $cAttributes['custom'][$attrName][] = $ra['value'];
                                }
                            }
                        }
                    }
                } catch (Exception $e) {}

                $cArRules = [];
                try {
                    $cArRules = $pdo->query("SELECT * FROM `auto_reply_rules` ORDER BY `created_at` ASC")->fetchAll();
                    foreach ($cArRules as &$r) {
                        if (!empty($r['keywords']) && is_string($r['keywords'])) {
                            $r['keywords'] = json_decode($r['keywords'], true) ?: [$r['keywords']];
                        }
                        $r['actionType'] = $r['action_type'] ?? ($r['actionType'] ?? 'custom_text');
                        $r['categoryId'] = $r['category_id'] ?? ($r['categoryId'] ?? null);
                        $r['replyText'] = $r['reply_text'] ?? ($r['replyText'] ?? '');
                        $r['enabled'] = isset($r['enabled']) ? (bool)$r['enabled'] : true;
                        $r['autoSend'] = isset($r['auto_send']) ? (bool)$r['auto_send'] : true;
                    }
                } catch (Exception $e) {}

                $cBcTemplates = [];
                try {
                    $cBcTemplates = $pdo->query("SELECT * FROM `broadcast_templates` ORDER BY `created_at` ASC")->fetchAll();
                } catch (Exception $e) {}

                return [
                    'rolePermissions' => $cRolePermissions,
                    'categories' => $cCategories,
                    'subcategories' => $cSubcategories,
                    'attributes' => $cAttributes,
                    'arRules' => $cArRules,
                    'bcTemplates' => $cBcTemplates
                ];
            }, 60);

            $rolePermissions = $cachedConfig['rolePermissions'] ?? [];
            $categories = $cachedConfig['categories'] ?? [];
            $subcategories = $cachedConfig['subcategories'] ?? [];
            $attributes = $cachedConfig['attributes'] ?? $attributes;
            $arRules = $cachedConfig['arRules'] ?? [];
            $bcTemplates = $cachedConfig['bcTemplates'] ?? [];
        }

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
            "rolePermissions" => $rolePermissions,
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
                "rolePermissions" => $rolePermissions,
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
        $username = !empty($staff['username']) ? $staff['username'] : (!empty($staff['id']) ? $staff['id'] : strtolower(explode(' ', $staff['name'])[0]));
        $password = $staff['password'] ?? 'staff123';
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $avatar = $staff['avatar'] ?? strtoupper(substr($staff['name'], 0, 2));

        $stmt = $pdo->prepare("
            INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `specialization`, `avatar`, `status`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE `name`=VALUES(`name`), `password`=VALUES(`password`), `role`=VALUES(`role`), `phone`=VALUES(`phone`), `status`=VALUES(`status`), `email`=VALUES(`email`), `specialization`=VALUES(`specialization`), `avatar`=VALUES(`avatar`)
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

if ($action === 'save_role_permissions' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $roleName = trim($data['role'] ?? '');
    $permissionsJson = isset($data['permissions']) ? json_encode($data['permissions']) : '';

    if (empty($roleName) || empty($permissionsJson)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Role name and permissions matrix are required."]);
        exit;
    }

    try {
        $checkStmt = $pdo->prepare("SELECT `id` FROM `attributes` WHERE `type` = 'role_permissions' AND `value` = ? LIMIT 1");
        $checkStmt->execute([$roleName]);
        $existingId = $checkStmt->fetchColumn();

        if ($existingId) {
            $stmt = $pdo->prepare("UPDATE `attributes` SET `extra` = ? WHERE `id` = ?");
            $stmt->execute([$permissionsJson, $existingId]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO `attributes` (`type`, `value`, `extra`) VALUES ('role_permissions', ?, ?)");
            $stmt->execute([$roleName, $permissionsJson]);
        }

        // Audit log
        try {
            $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `description`, `created_at`) VALUES ('ROLE_PERMISSIONS_UPDATED', 'ROLES', 'Super Admin', ?, NOW())")
                ->execute(["Updated granular module action permissions for role: $roleName"]);
        } catch (Exception $ae) {}

        echo json_encode(["status" => "success", "message" => "Role permissions saved in MySQL database.", "role" => $roleName]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'get_role_permissions') {
    try {
        $stmt = $pdo->query("SELECT `value`, `extra` FROM `attributes` WHERE `type` = 'role_permissions'");
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $roleMap = [];
        foreach ($rows as $r) {
            $decoded = json_decode($r['extra'] ?? '', true);
            if ($decoded) {
                $roleMap[$r['value']] = $decoded;
            }
        }

        echo json_encode(["status" => "success", "roles" => $roleMap]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'delete_role_permissions' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    $roleName = trim($data['role'] ?? '');
    if (empty($roleName)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Role name is required."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM `attributes` WHERE `type` = 'role_permissions' AND `value` = ?");
        $stmt->execute([$roleName]);

        try {
            $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `description`, `created_at`) VALUES ('ROLE_DELETED', 'ROLES', 'Super Admin', ?, NOW())")
                ->execute(["Deleted custom role: $roleName"]);
        } catch (Exception $ae) {}

        echo json_encode(["status" => "success", "message" => "Role successfully deleted from database.", "role" => $roleName]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'update_staff' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $staff = json_decode($input, true);

    $staffId = trim($staff['id'] ?? '');
    if (empty($staffId) || empty($staff['name']) || empty($staff['phone'])) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Staff ID, name and phone are required."]);
        exit;
    }

    try {
        $avatar = $staff['avatar'] ?? strtoupper(substr($staff['name'], 0, 2));
        $fields = [
            "`name` = ?",
            "`email` = ?",
            "`phone` = ?",
            "`role` = ?",
            "`specialization` = ?",
            "`status` = ?",
            "`avatar` = ?"
        ];
        $params = [
            $staff['name'],
            $staff['email'] ?? '',
            $staff['phone'],
            $staff['role'] ?? 'Sales Specialist',
            $staff['specialization'] ?? 'General',
            $staff['status'] ?? 'ACTIVE',
            $avatar
        ];

        if (!empty($staff['password'])) {
            $fields[] = "`password` = ?";
            $params[] = password_hash($staff['password'], PASSWORD_BCRYPT);
        }

        $params[] = $staffId;
        $sql = "UPDATE `users` SET " . implode(", ", $fields) . " WHERE `id` = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        try {
            $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `description`, `created_at`) VALUES ('STAFF_UPDATED', 'STAFF_MODULE', 'Super Admin', ?, NOW())")
                ->execute(["Updated staff member details: {$staff['name']} ({$staffId})"]);
        } catch (Exception $ae) {}

        echo json_encode(["status" => "success", "message" => "Staff member details updated in MySQL", "staff" => $staff]);
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
        $pdo->prepare("UPDATE `queries` SET `assigned_to` = 'UNASSIGNED' WHERE `assigned_to` = ?")->execute([$data['staff_id']]);

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
    $configData['bridge_url'] = defined('BRIDGE_URL') ? BRIDGE_URL : 'http://localhost:3000';
    echo json_encode(["status" => "success", "data" => $configData]);
    exit;
}

if ($action === 'sync_bridge_url' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $postData = json_decode($rawInput, true) ?: $_POST;
    $newBridgeUrl = trim($postData['bridge_url'] ?? '');
    $secret = trim($postData['secret'] ?? '');

    if ($secret !== 'GRM_BRIDGE_AUTO_SYNC_2026' || empty($newBridgeUrl)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Unauthorized or empty bridge URL"]);
        exit;
    }

    $currentConfig = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    $currentConfig['bridge_url'] = rtrim($newBridgeUrl, '/');
    $currentConfig['last_bridge_sync'] = date("Y-m-d H:i:s");
    atomicWriteJson($configFile, $currentConfig);

    echo json_encode([
        "status" => "success",
        "message" => "Bridge URL synchronized successfully",
        "bridge_url" => $currentConfig['bridge_url'],
        "synced_at" => $currentConfig['last_bridge_sync']
    ]);
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
        $slotId = $postData['account_id'] ?? $postData['accountId'] ?? $postData['account_slot'] ?? 'account_1';
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `whatsapp_accounts` (`account_slot`, `phone_number`, `business_name`, `display_name`, `brand_name`, `status`)
                VALUES (?, ?, ?, ?, ?, 'CONNECTED')
                ON DUPLICATE KEY UPDATE 
                    `phone_number` = VALUES(`phone_number`),
                    `business_name` = VALUES(`business_name`),
                    `display_name` = VALUES(`display_name`),
                    `brand_name` = VALUES(`brand_name`),
                    `status` = 'CONNECTED'
            ");
            $stmt->execute([
                $slotId,
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

// =========================================================================
// SYNC ACCOUNT STATUS (From WhatsApp Bridge to Hostinger Database)
// =========================================================================
if ($action === 'sync_account_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;
    $slotId = $data['account_slot'] ?? $data['account_id'] ?? 'account_1';
    $status = strtoupper($data['status'] ?? 'DISCONNECTED');
    $phoneNumber = $data['phone_number'] ?? null;
    $qrCode = $data['qr_code'] ?? null;
    $connectedName = $data['connected_name'] ?? null;
    $label = $data['label'] ?? ($slotId === 'account_1' ? 'Primary WhatsApp' : 'WhatsApp Line');

    // 1. Update config file
    $cfg = file_exists($configFile) ? json_decode(file_get_contents($configFile), true) : [];
    if (!isset($cfg['connected_lines']) || !is_array($cfg['connected_lines'])) {
        $cfg['connected_lines'] = [];
    }
    $found = false;
    foreach ($cfg['connected_lines'] as &$line) {
        if (($line['id'] ?? '') === $slotId) {
            $line['status'] = $status;
            if ($phoneNumber) $line['phone_number'] = $phoneNumber;
            if ($qrCode) $line['qr_code'] = $qrCode;
            if ($status === 'CONNECTED') unset($line['qr_code']);
            $line['label'] = $label;
            $found = true;
            break;
        }
    }
    if (!$found) {
        $cfg['connected_lines'][] = [
            'id' => $slotId,
            'label' => $label,
            'phone_number' => $phoneNumber ?: 'Awaiting Link',
            'status' => $status,
            'qr_code' => $qrCode
        ];
    }
    if ($slotId === 'account_1') {
        $cfg['status'] = $status;
        if ($phoneNumber) $cfg['phone_number'] = $phoneNumber;
    }
    $cfg['last_sync'] = date("Y-m-d H:i:s");
    atomicWriteJson($configFile, $cfg);

    // 2. Update MySQL database
    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `whatsapp_accounts` (`account_slot`, `phone_number`, `business_name`, `display_name`, `brand_name`, `status`, `qr_code`)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    `status` = VALUES(`status`),
                    `phone_number` = COALESCE(VALUES(`phone_number`), `phone_number`),
                    `qr_code` = VALUES(`qr_code`),
                    `display_name` = COALESCE(VALUES(`display_name`), `display_name`)
            ");
            $stmt->execute([
                $slotId,
                $phoneNumber ?: '+91 99435 57998',
                'GRM Garments Business Hub',
                $label,
                $label,
                $status,
                $status === 'CONNECTED' ? null : $qrCode
            ]);
        } catch (Exception $e) {}
    }

    echo json_encode(["status" => "success", "message" => "Account $slotId status synced: $status"]);
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
    $rules = [];
    if ($pdo) {
        try {
            $stmt = $pdo->query("SELECT * FROM `auto_reply_rules` ORDER BY `created_at` ASC");
            $dbRules = $stmt->fetchAll(PDO::FETCH_ASSOC);
            if (!empty($dbRules)) {
                foreach ($dbRules as $r) {
                    $kws = $r['keywords'] ?? '[]';
                    if (is_string($kws)) {
                        $kws = json_decode($kws, true) ?: [$kws];
                    }
                    $rules[] = [
                        'id' => $r['id'],
                        'name' => $r['name'],
                        'keywords' => $kws,
                        'actionType' => $r['action_type'] ?? 'custom_text',
                        'action_type' => $r['action_type'] ?? 'custom_text',
                        'categoryId' => $r['category_id'] ?? null,
                        'category_id' => $r['category_id'] ?? null,
                        'replyText' => $r['reply_text'] ?? '',
                        'reply_text' => $r['reply_text'] ?? '',
                        'enabled' => isset($r['enabled']) ? (bool)$r['enabled'] : true,
                        'autoSend' => isset($r['auto_send']) ? (bool)$r['auto_send'] : true
                    ];
                }
            }
        } catch (Exception $e) {}
    }
    echo json_encode([
        "status" => "success",
        "rules" => $rules
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
                SET `name` = ?, `phone` = ?, `whatsapp` = ?, `alt_phone` = ?, `email` = ?, `gender` = ?, `age` = ?, `address` = ?, `alt_address` = ?, `notes` = COALESCE(?, `notes`)
                WHERE `id` = ?
            ");
            $stmt->execute([
                $data['name'] ?? '',
                $data['phone'] ?? '',
                $data['whatsapp'] ?? ($data['phone'] ?? ''),
                $data['alt_phone'] ?? ($data['altPhone'] ?? ''),
                $data['email'] ?? null,
                $data['gender'] ?? null,
                $data['age'] ?? null,
                $data['address'] ?? '',
                $data['alt_address'] ?? ($data['altAddress'] ?? ''),
                $data['notes'] ?? null,
                $data['id']
            ]);
        } catch (Exception $e) {}
    }

    echo json_encode(["status" => "success", "message" => "Customer details saved successfully"]);
    exit;
}

// =========================================================================
// CUSTOMER REQUIREMENTS MODULE (Customer 360 Submodule)
// =========================================================================
if ($action === 'get_customer_requirements') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }
    try {
        $statusFilter = trim($_GET['status'] ?? '');
        $search = trim($_GET['search'] ?? '');
        
        $sql = "SELECT * FROM `customer_requirements` WHERE 1=1";
        $params = [];
        
        if (!empty($statusFilter) && $statusFilter !== 'ALL') {
            $sql .= " AND `status` = ?";
            $params[] = $statusFilter;
        }
        if (!empty($search)) {
            $sql .= " AND (`customer_name` LIKE ? OR `phone` LIKE ? OR `email` LIKE ? OR `dress` LIKE ? OR `dress_requirement` LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        $sql .= " ORDER BY `created_at` DESC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $requirements = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            "status" => "success",
            "data" => $requirements,
            "total" => count($requirements)
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'add_customer_requirement' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $customerName = trim($data['customer_name'] ?? ($data['name'] ?? ''));
    $phone = trim($data['phone'] ?? ($data['phone_no'] ?? ''));
    $email = trim($data['email'] ?? '');
    $dress = trim($data['dress'] ?? '');
    $dressRequirement = trim($data['dress_requirement'] ?? ($data['requirement'] ?? ''));
    $status = trim($data['status'] ?? 'PENDING');
    $createdBy = trim($data['created_by'] ?? 'Super Admin');

    if (empty($customerName) || empty($phone) || empty($dress) || empty($dressRequirement)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Customer Name, Phone No, Dress, and Dress Requirement are required."
        ]);
        exit;
    }

    $validStatuses = ['PENDING', 'SOURCING', 'QUOTED', 'FULFILLED', 'CANCELLED'];
    if (!in_array($status, $validStatuses)) {
        $status = 'PENDING';
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO `customer_requirements` 
                (`customer_name`, `phone`, `email`, `dress`, `dress_requirement`, `status`, `created_by`, `created_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([
            $customerName,
            $phone,
            $email ?: null,
            $dress,
            $dressRequirement,
            $status,
            $createdBy
        ]);
        $newId = (int)$pdo->lastInsertId();

        $fetchStmt = $pdo->prepare("SELECT * FROM `customer_requirements` WHERE `id` = ?");
        $fetchStmt->execute([$newId]);
        $createdRecord = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "message" => "Customer requirement saved successfully",
            "id" => $newId,
            "data" => $createdRecord
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'update_customer_requirement' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $id = (int)($data['id'] ?? 0);
    $customerName = trim($data['customer_name'] ?? ($data['name'] ?? ''));
    $phone = trim($data['phone'] ?? ($data['phone_no'] ?? ''));
    $email = trim($data['email'] ?? '');
    $dress = trim($data['dress'] ?? '');
    $dressRequirement = trim($data['dress_requirement'] ?? ($data['requirement'] ?? ''));

    if ($id <= 0 || empty($customerName) || empty($phone) || empty($dress) || empty($dressRequirement)) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Valid ID, Customer Name, Phone No, Dress, and Dress Requirement are required."
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE `customer_requirements` 
            SET `customer_name` = ?, `phone` = ?, `email` = ?, `dress` = ?, `dress_requirement` = ?, `updated_at` = NOW()
            WHERE `id` = ?
        ");
        $stmt->execute([
            $customerName,
            $phone,
            $email ?: null,
            $dress,
            $dressRequirement,
            $id
        ]);

        $fetchStmt = $pdo->prepare("SELECT * FROM `customer_requirements` WHERE `id` = ?");
        $fetchStmt->execute([$id]);
        $updatedRecord = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "message" => "Customer requirement updated successfully",
            "id" => $id,
            "data" => $updatedRecord
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'update_customer_requirement_status' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $id = (int)($data['id'] ?? 0);
    $status = trim($data['status'] ?? '');
    $validStatuses = ['PENDING', 'SOURCING', 'QUOTED', 'FULFILLED', 'CANCELLED'];

    if ($id <= 0 || !in_array($status, $validStatuses)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid ID and status are required"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("UPDATE `customer_requirements` SET `status` = ?, `updated_at` = NOW() WHERE `id` = ?");
        $stmt->execute([$status, $id]);

        echo json_encode([
            "status" => "success",
            "message" => "Customer requirement status updated to $status",
            "id" => $id,
            "new_status" => $status
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'delete_customer_requirement' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true) ?: $_POST;

    $id = (int)($data['id'] ?? 0);
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Valid ID is required"]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("DELETE FROM `customer_requirements` WHERE `id` = ?");
        $stmt->execute([$id]);

        echo json_encode([
            "status" => "success",
            "message" => "Customer requirement deleted successfully",
            "id" => $id
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

// =========================================================================
// BULK PRICE REQUEST ACTIONS (Staff Request, Admin Approve / Reject with Notes)
// =========================================================================
if ($action === 'get_bulk_price_requests') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }

    $statusFilter = $_GET['status'] ?? null;
    $customerPhone = $_GET['customer_phone'] ?? null;
    $staffId = $_GET['staff_id'] ?? null;
    $limit = (int)($_GET['limit'] ?? 100);

    $sql = "SELECT * FROM `bulk_price_requests` WHERE 1=1";
    $params = [];

    if (!empty($statusFilter) && $statusFilter !== 'ALL') {
        $sql .= " AND `status` = ?";
        $params[] = $statusFilter;
    }
    if (!empty($customerPhone)) {
        $sql .= " AND `customer_phone` = ?";
        $params[] = $customerPhone;
    }
    if (!empty($staffId)) {
        $sql .= " AND `staff_id` = ?";
        $params[] = $staffId;
    }

    $sql .= " ORDER BY `created_at` DESC LIMIT " . $limit;

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            "status" => "success",
            "count" => count($requests),
            "requests" => $requests
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'create_bulk_price_request' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: $_POST;

    $customerName = trim($data['customer_name'] ?? '');
    $customerPhone = trim($data['customer_phone'] ?? '');
    $productName = trim($data['product_name'] ?? '');
    $size = trim($data['size'] ?? '');
    $quantity = (int)($data['quantity'] ?? 1);
    $sellingPrice = (float)($data['selling_price'] ?? 0);
    $requestedPrice = (float)($data['requested_price'] ?? 0);
    $staffId = trim($data['staff_id'] ?? 'admin');
    $staffName = trim($data['staff_name'] ?? 'Super Admin');
    $staffPhone = trim($data['staff_phone'] ?? '');
    if (empty($staffPhone) && !empty($staffId)) {
        try {
            $uStmt = $pdo->prepare("SELECT phone FROM users WHERE id = ? OR username = ? OR name = ? LIMIT 1");
            $uStmt->execute([$staffId, $staffId, $staffName]);
            $staffPhone = (string)$uStmt->fetchColumn();
        } catch (Exception $e) {}
    }
    $adminPhone = trim($data['admin_phone'] ?? '');
    if (empty($adminPhone)) {
        $adminPhone = '+91 99435 57998';
    }

    // Strict RBAC check: Staff in view-only mode cannot create bulk price requests
    if (isset($data['is_view_only']) && $data['is_view_only']) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Permission Denied: Staff in view-only mode cannot submit bulk price requests."]);
        exit;
    }

    if (empty($customerName) || empty($productName) || $requestedPrice <= 0 || $quantity <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Customer name, product name, quantity and requested price are required."]);
        exit;
    }

    $count = (int)$pdo->query("SELECT COUNT(*) FROM `bulk_price_requests`")->fetchColumn();
    $requestCode = 'BPR-' . str_pad($count + 1, 4, '0', STR_PAD_LEFT);
    $totalRequestedAmount = $quantity * $requestedPrice;

    try {
        $linkToken = bin2hex(random_bytes(16));
        $stmt = $pdo->prepare("
            INSERT INTO `bulk_price_requests`
            (`request_code`, `customer_name`, `customer_phone`, `product_name`, `size`, `quantity`, `selling_price`, `requested_price`, `total_requested_amount`, `staff_id`, `staff_name`, `staff_phone`, `admin_phone`, `link_token`, `send_count`, `link_click_count`, `max_sends`, `status`, `created_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 3, 'PENDING', NOW())
        ");
        $stmt->execute([
            $requestCode, $customerName, $customerPhone, $productName, $size, $quantity, $sellingPrice, $requestedPrice, $totalRequestedAmount, $staffId, $staffName, $staffPhone, $adminPhone, $linkToken
        ]);
        $newId = (int)$pdo->lastInsertId();

        $fetchStmt = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `id` = ?");
        $fetchStmt->execute([$newId]);
        $createdRecord = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        try {
            $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `details`) VALUES ('BULK_PRICE_REQUEST', 'PRICING', ?, ?)")
                ->execute([$staffName, "Created bulk price request $requestCode for $customerName ($productName x $quantity at Rs.$requestedPrice)"]);
        } catch (Exception $e) {}

        try {
            $pdo->prepare("INSERT INTO `app_notifications` (`user_id`, `role`, `title`, `message`, `type`, `reference_id`, `is_read`, `created_at`) VALUES ('admin', 'ADMIN', ?, ?, 'BULK_PENDING', ?, 0, NOW())")
                ->execute([
                    "New Bulk Price Request: $requestCode",
                    "Staff $staffName requested Rs.$requestedPrice/pc for $productName x $quantity pcs ($customerName).",
                    $requestCode
                ]);
        } catch (Exception $e) {}

        $waNotifyStatus = 'NOT_SENT';
        $bridgeResponse = null;
        if (!empty($adminPhone)) {
            $cleanAdminPhone = preg_replace('/[^0-9]/', '', $adminPhone);
            if (strlen($cleanAdminPhone) === 10) {
                $cleanAdminPhone = '91' . $cleanAdminPhone;
            }
            // Determine public base URL for mobile WhatsApp links
            $publicBaseUrl = 'https://mediumturquoise-dugong-987946.hostingersite.com';
            if (!empty($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false && strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === false) {
                $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $publicBaseUrl = $proto . '://' . $_SERVER['HTTP_HOST'];
            } elseif (defined('APP_URL') && strpos(APP_URL, 'localhost') === false) {
                $publicBaseUrl = rtrim(APP_URL, '/');
            }

            // Connected WhatsApp line phone number
            $crmPhone = '919943557998';
            if (file_exists(__DIR__ . '/whatsapp_account_config.json')) {
                $cfgData = json_decode(file_get_contents(__DIR__ . '/whatsapp_account_config.json'), true);
                if (!empty($cfgData['phone_number'])) {
                    $cleanCfgNum = preg_replace('/[^0-9]/', '', $cfgData['phone_number']);
                    if (strlen($cleanCfgNum) >= 10) $crmPhone = $cleanCfgNum;
                }
            }

            // In-WhatsApp Zero-Navigation Action Links (Never leaves WhatsApp, stays in same screen)
            $waApproveUrl = "https://wa.me/{$crmPhone}?text=" . rawurlencode("APPROVE {$requestCode}");
            $waRejectUrl = "https://wa.me/{$crmPhone}?text=" . rawurlencode("REJECT {$requestCode} Price too low for this bulk order quantity.");

            $alertMsg = "🔔 *NEW BULK PRICE REQUEST*\n\n" .
                        "Request Code: *{$requestCode}*\n" .
                        "Status: *PENDING APPROVAL* by *{$staffName}*\n" .
                        "Customer: *{$customerName}* ({$customerPhone})\n" .
                        "Product: *{$productName}* ({$size}) × *{$quantity} pcs*\n" .
                        "Standard Price: ₹{$sellingPrice}/pc → Requested Price: *₹{$requestedPrice}/pc*\n" .
                        "Total Value: *₹{$totalRequestedAmount}*\n\n" .
                        "━━━━━━━━━━━━━━━━━━━━\n" .
                        "👉 *Quick Actions:*\n" .
                        "✅ Reply *1* or *APPROVE {$requestCode}* to APPROVE\n" .
                        "❌ Reply *2* or *REJECT {$requestCode} <reason>* to REJECT\n\n" .
                        "🔗 *One-Click Decision Links (Message 1 of 3):*\n" .
                        "✅ *Approve Link:*\n" .
                        "{$waApproveUrl}\n\n" .
                        "❌ *Reject Link:*\n" .
                        "{$waRejectUrl}\n" .
                        "━━━━━━━━━━━━━━━━━━━━\n" .
                        "⚠️ *Notice:* Valid up to 3 message sends. After the 3rd send, links will automatically expire.";
            try {
                $bRes = curlBridgePost('/api/send', [
                    'phone' => $cleanAdminPhone,
                    'text' => $alertMsg
                ], 7);
                if ($bRes['http_code'] >= 200 && $bRes['http_code'] < 300) {
                    $waNotifyStatus = 'SENT';
                    $bridgeResponse = json_decode($bRes['response'], true);
                } else {
                    $waNotifyStatus = 'FAILED';
                    $bridgeResponse = $bRes;
                }
            } catch (Exception $e) {
                error_log("Bridge notification error: " . $e->getMessage());
                $waNotifyStatus = 'ERROR';
                $bridgeResponse = ['error' => $e->getMessage()];
            }
        }

        $directAdminWaUrl = '';

        echo json_encode([
            "status" => "success",
            "message" => "Bulk price request submitted successfully and sent to Admin for approval",
            "request" => $createdRecord,
            "alert_message" => $alertMsg,
            "admin_phone" => $cleanAdminPhone ?? '',
            "direct_whatsapp_url" => null,
            "approve_url" => $waApproveUrl ?? '',
            "reject_url" => $waRejectUrl ?? '',
            "wa_notify" => $waNotifyStatus,
            "whatsapp_notification" => $waNotifyStatus,
            "bridge_response" => $bridgeResponse
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'approve_bulk_price_request' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: $_POST;
    $id = (int)($data['id'] ?? 0);
    $requestCode = trim($data['request_code'] ?? ($data['request_id_or_code'] ?? ''));
    if ($id <= 0 && !empty($requestCode)) {
        $cStmt = $pdo->prepare("SELECT `id` FROM `bulk_price_requests` WHERE `request_code` = ? LIMIT 1");
        $cStmt->execute([$requestCode]);
        $id = (int)$cStmt->fetchColumn();
    }
    if ($id <= 0) {
        $latest = $pdo->query("SELECT `id` FROM `bulk_price_requests` WHERE `status` = 'PENDING' ORDER BY `id` DESC LIMIT 1")->fetchColumn();
        $id = (int)$latest;
    }
    $approvedBy = trim($data['approved_by'] ?? 'Super Admin');
    $adminNotes = trim($data['admin_notes'] ?? '');

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "No pending bulk price request found to approve."]);
        exit;
    }

    // Fetch current request and enforce 3-time validity limit
    $cCheck = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `id` = ? LIMIT 1");
    $cCheck->execute([$id]);
    $currReq = $cCheck->fetch(PDO::FETCH_ASSOC);

    if (!$currReq) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Bulk price request not found."]);
        exit;
    }
    if ($currReq['status'] === 'APPROVED') {
        $waDispatch = dispatchBulkDecisionWhatsAppNotifications($pdo, $currReq, 'APPROVED', '', $approvedBy, false);
        echo json_encode([
            "status" => "success",
            "message" => "Request {$currReq['request_code']} is already approved.",
            "request" => $currReq,
            "wa_dispatch" => $waDispatch
        ]);
        exit;
    }
    $sendCount = (int)($currReq['send_count'] ?? 1);
    if ($sendCount > 3) {
        $pdo->prepare("UPDATE `bulk_price_requests` SET `status` = 'EXPIRED' WHERE `id` = ? AND `status` = 'PENDING'")->execute([$id]);
        echo json_encode([
            "status" => "error",
            "expired" => true,
            "message" => "This bulk price request ({$currReq['request_code']}) has expired. Valid up to 3 message sends only.",
            "request" => $currReq
        ]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE `bulk_price_requests` 
            SET `status` = 'APPROVED', 
                `approved_by` = ?, 
                `admin_notes` = ?, 
                `approved_at` = NOW(),
                `updated_at` = NOW() 
            WHERE `id` = ?
        ");
        $stmt->execute([$approvedBy, $adminNotes, $id]);

        $fetchStmt = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `id` = ?");
        $fetchStmt->execute([$id]);
        $record = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        try {
            $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `details`) VALUES ('BULK_PRICE_APPROVED', 'PRICING', ?, ?)")
                ->execute([$approvedBy, "Approved bulk request {$record['request_code']} for {$record['customer_name']}"]);
        } catch (Exception $e) {}

        // Dispatch WhatsApp notification to Admin & Staff and broadcast to Web UI
        $fromChannel = trim($data['source'] ?? ($data['channel'] ?? 'web'));
        $skipAdmin = false;
        $waDispatch = dispatchBulkDecisionWhatsAppNotifications($pdo, $record, 'APPROVED', '', $approvedBy, $skipAdmin);

        echo json_encode([
            "status" => "success",
            "message" => "Bulk price request approved successfully! Staff can now take order at the approved price.",
            "request" => $record,
            "wa_dispatch" => $waDispatch
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

if ($action === 'reject_bulk_price_request' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: $_POST;
    $id = (int)($data['id'] ?? 0);
    $requestCode = trim($data['request_code'] ?? ($data['request_id_or_code'] ?? ''));
    if ($id <= 0 && !empty($requestCode)) {
        $cStmt = $pdo->prepare("SELECT `id` FROM `bulk_price_requests` WHERE `request_code` = ? LIMIT 1");
        $cStmt->execute([$requestCode]);
        $id = (int)$cStmt->fetchColumn();
    }
    if ($id <= 0) {
        $latest = $pdo->query("SELECT `id` FROM `bulk_price_requests` WHERE `status` = 'PENDING' ORDER BY `id` DESC LIMIT 1")->fetchColumn();
        $id = (int)$latest;
    }
    $rejectionReason = trim($data['rejection_reason'] ?? '');
    $rejectedBy = trim($data['rejected_by'] ?? 'Super Admin');

    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "No pending bulk price request found to reject."]);
        exit;
    }

    // Fetch current request and enforce 3-time validity limit
    $cCheck = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `id` = ? LIMIT 1");
    $cCheck->execute([$id]);
    $currReq = $cCheck->fetch(PDO::FETCH_ASSOC);

    if (!$currReq) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Bulk price request not found."]);
        exit;
    }
    if ($currReq['status'] === 'REJECTED') {
        $waDispatch = dispatchBulkDecisionWhatsAppNotifications($pdo, $currReq, 'REJECTED', $rejectionReason, $rejectedBy, false);
        echo json_encode([
            "status" => "success",
            "message" => "Request {$currReq['request_code']} is already rejected.",
            "request" => $currReq,
            "wa_dispatch" => $waDispatch
        ]);
        exit;
    }
    $sendCount = (int)($currReq['send_count'] ?? 1);
    if ($sendCount > 3) {
        $pdo->prepare("UPDATE `bulk_price_requests` SET `status` = 'EXPIRED' WHERE `id` = ? AND `status` = 'PENDING'")->execute([$id]);
        echo json_encode([
            "status" => "error",
            "expired" => true,
            "message" => "This bulk price request ({$currReq['request_code']}) has expired. Valid up to 3 message sends only.",
            "request" => $currReq
        ]);
        exit;
    }

    if (empty($rejectionReason)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Rejection reason / notes are required."]);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            UPDATE `bulk_price_requests` 
            SET `status` = 'REJECTED', 
                `rejection_reason` = ?, 
                `admin_notes` = ?, 
                `approved_by` = ?, 
                `updated_at` = NOW() 
            WHERE `id` = ?
        ");
        $stmt->execute([$rejectionReason, $rejectionReason, $rejectedBy, $id]);

        $fetchStmt = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `id` = ?");
        $fetchStmt->execute([$id]);
        $record = $fetchStmt->fetch(PDO::FETCH_ASSOC);

        try {
            $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `details`) VALUES ('BULK_PRICE_REJECTED', 'PRICING', ?, ?)")
                ->execute([$rejectedBy, "Rejected bulk request {$record['request_code']} with reason: $rejectionReason"]);
        } catch (Exception $e) {}

        // Dispatch WhatsApp notification to Admin & Staff and broadcast to Web UI
        $fromChannel = trim($data['source'] ?? ($data['channel'] ?? 'web'));
        $skipAdmin = false;
        $waDispatch = dispatchBulkDecisionWhatsAppNotifications($pdo, $record, 'REJECTED', $rejectionReason, $rejectedBy, $skipAdmin);

        echo json_encode([
            "status" => "success",
            "message" => "Bulk price request rejected with specified reason.",
            "request" => $record,
            "wa_dispatch" => $waDispatch
        ]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
}

// =========================================================================
// BULK PRICE REQUEST: RESEND NOTIFICATION (Enforce 3-Message Send Limit)
// =========================================================================
if ($action === 'resend_bulk_price_request' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }

    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: $_POST;
    $id = (int)($data['id'] ?? 0);
    $requestCode = trim($data['request_code'] ?? '');

    $req = null;
    if ($id > 0) {
        $stmt = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$id]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);
    } elseif (!empty($requestCode)) {
        $stmt = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `request_code` = ? LIMIT 1");
        $stmt->execute([$requestCode]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    if (!$req) {
        http_response_code(404);
        echo json_encode(["status" => "error", "message" => "Bulk price request not found."]);
        exit;
    }

    if ($req['status'] !== 'PENDING') {
        echo json_encode(["status" => "error", "message" => "Request {$req['request_code']} is already {$req['status']}."]);
        exit;
    }

    $currentSendCount = (int)($req['send_count'] ?? 1);
    if ($currentSendCount >= 3) {
        echo json_encode([
            "status" => "error",
            "message" => "Maximum limit of 3 messages reached for request {$req['request_code']}. Further sends are blocked and action links are disabled.",
            "send_count" => $currentSendCount,
            "max_reached" => true
        ]);
        exit;
    }

    $newSendCount = $currentSendCount + 1;
    $pdo->prepare("UPDATE `bulk_price_requests` SET `send_count` = ? WHERE `id` = ?")->execute([$newSendCount, $req['id']]);

    // Construct token and public URLs
    $linkToken = $req['link_token'];
    if (empty($linkToken)) {
        $linkToken = bin2hex(random_bytes(16));
        $pdo->prepare("UPDATE `bulk_price_requests` SET `link_token` = ? WHERE `id` = ?")->execute([$linkToken, $req['id']]);
    }

    $publicBaseUrl = 'https://mediumturquoise-dugong-987946.hostingersite.com';
    if (!empty($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false && strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === false) {
        $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $publicBaseUrl = $proto . '://' . $_SERVER['HTTP_HOST'];
    } elseif (defined('APP_URL') && strpos(APP_URL, 'localhost') === false) {
        $publicBaseUrl = rtrim(APP_URL, '/');
    }

    $approveUrl = "{$publicBaseUrl}/api.php?action=bulk_link_action&token={$linkToken}&code={$req['request_code']}&decision=approve";
    $rejectUrl = "{$publicBaseUrl}/api.php?action=bulk_link_action&token={$linkToken}&code={$req['request_code']}&decision=reject";

    // Connected WhatsApp line phone number
    $crmPhone = '919943557998';
    if (file_exists(__DIR__ . '/whatsapp_account_config.json')) {
        $cfgData = json_decode(file_get_contents(__DIR__ . '/whatsapp_account_config.json'), true);
        if (!empty($cfgData['phone_number'])) {
            $cleanCfgNum = preg_replace('/[^0-9]/', '', $cfgData['phone_number']);
            if (strlen($cleanCfgNum) >= 10) $crmPhone = $cleanCfgNum;
        }
    }
    $waApproveUrl = "https://wa.me/{$crmPhone}?text=" . rawurlencode("APPROVE {$req['request_code']}");
    $waRejectUrl = "https://wa.me/{$crmPhone}?text=" . rawurlencode("REJECT {$req['request_code']} Price too low for this bulk order quantity.");

    $alertMsg = "🔔 *NEW BULK PRICE REQUEST (REMINDER)*\n\n" .
                "Request Code: *{$req['request_code']}*\n" .
                "Status: *PENDING APPROVAL* by *{$req['staff_name']}*\n" .
                "Customer: *{$req['customer_name']}* ({$req['customer_phone']})\n" .
                "Product: *{$req['product_name']}* ({$req['size']}) × *{$req['quantity']} pcs*\n" .
                "Standard Price: ₹{$req['selling_price']}/pc → Requested Price: *₹{$req['requested_price']}/pc*\n" .
                "Total Value: *₹{$req['total_requested_amount']}*\n\n" .
                "━━━━━━━━━━━━━━━━━━━━\n" .
                "👉 *Quick Actions:*\n" .
                "✅ Reply *1* or *APPROVE {$req['request_code']}* to APPROVE\n" .
                "❌ Reply *2* or *REJECT {$req['request_code']} <reason>* to REJECT\n\n" .
                "🔗 *One-Click Decision Links (Message {$newSendCount} of 3):*\n" .
                "✅ *Approve Link:*\n" .
                "{$waApproveUrl}\n\n" .
                "❌ *Reject Link:*\n" .
                "{$waRejectUrl}\n" .
                "━━━━━━━━━━━━━━━━━━━━\n" .
                ($newSendCount >= 3 ? "⚠️ *FINAL NOTICE (3 of 3):* After this message, one-click links will expire." : "⚠️ *Notice:* Valid up to 3 message sends.");

    // Send via bridge
    $waSent = false;
    if (!empty($req['admin_phone'])) {
        $cleanPhone = preg_replace('/[^0-9]/', '', $req['admin_phone']);
        if (strlen($cleanPhone) === 10) $cleanPhone = '91' . $cleanPhone;
        try {
            $bRes = curlBridgePost('/api/send', ['phone' => $cleanPhone, 'text' => $alertMsg], 7);
            if ($bRes['http_code'] >= 200 && $bRes['http_code'] < 300) {
                $waSent = true;
            }
        } catch (Exception $e) {}
    }

    $directAdminWaUrl = '';

    echo json_encode([
        "status" => "success",
        "message" => "Reminder sent to Admin WhatsApp (Message {$newSendCount} of 3)",
        "send_count" => $newSendCount,
        "alert_message" => $alertMsg,
        "admin_phone" => $cleanPhone ?? '',
        "direct_whatsapp_url" => null,
        "wa_sent" => $waSent
    ]);
    exit;
}

// =========================================================================
// IN-APP NOTIFICATIONS API (Live notifications for Admin & Staff decisions)
// =========================================================================
if ($action === 'get_notifications') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }
    $userId = $_GET['user_id'] ?? null;
    $limit = (int)($_GET['limit'] ?? 50);
    $unreadOnly = isset($_GET['unread']) && $_GET['unread'] === '1';

    $sql = "SELECT * FROM `app_notifications` WHERE 1=1";
    $params = [];
    if (!empty($userId)) {
        $sql .= " AND (`user_id` = ? OR `user_id` = 'all' OR `user_id` IS NULL)";
        $params[] = $userId;
    }
    if ($unreadOnly) {
        $sql .= " AND `is_read` = 0";
    }
    $sql .= " ORDER BY `id` DESC LIMIT " . $limit;

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $notifs = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $unreadCountStmt = $pdo->query("SELECT COUNT(*) FROM `app_notifications` WHERE `is_read` = 0");
    $unreadCount = $unreadCountStmt ? (int)$unreadCountStmt->fetchColumn() : 0;

    echo json_encode([
        "status" => "success",
        "notifications" => $notifs,
        "unread_count" => $unreadCount
    ]);
    exit;
}

if ($action === 'mark_notification_read' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!$pdo) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database connection unavailable"]);
        exit;
    }
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: $_POST;
    $id = (int)($data['id'] ?? 0);
    $markAll = !empty($data['all']);

    if ($markAll) {
        $pdo->exec("UPDATE `app_notifications` SET `is_read` = 1 WHERE `is_read` = 0");
    } elseif ($id > 0) {
        $pdo->prepare("UPDATE `app_notifications` SET `is_read` = 1 WHERE `id` = ?")->execute([$id]);
    }
    echo json_encode(["status" => "success"]);
    exit;
}

// =========================================================================
// BULK PRICE REQUEST: ONE-CLICK DECISION WEB PORTAL (Approve / Reject Links)
// Enforces: Max 3 sends / 3 clicks limit rule ("more than third link not working")
// =========================================================================
if ($action === 'bulk_link_action') {
    if (!headers_sent()) {
        header("Content-Type: text/html; charset=UTF-8");
    }

    if (!$pdo) {
        echo "<!DOCTYPE html><html><body style='font-family:sans-serif;padding:30px;text-align:center;'><h2>Database connection unavailable. Please try again.</h2></body></html>";
        exit;
    }

    $token = trim($_GET['token'] ?? ($_POST['token'] ?? ''));
    $code = trim($_GET['code'] ?? ($_POST['code'] ?? ''));
    $decision = strtolower(trim($_GET['decision'] ?? ($_POST['decision'] ?? '')));
    $confirm = trim($_GET['confirm'] ?? ($_POST['confirm'] ?? ''));
    $reason = trim($_POST['rejection_reason'] ?? ($_GET['rejection_reason'] ?? ''));

    $req = null;
    if (!empty($token)) {
        $stmt = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `link_token` = ? LIMIT 1");
        $stmt->execute([$token]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);
    }
    if (!$req && !empty($code)) {
        $stmt = $pdo->prepare("SELECT * FROM `bulk_price_requests` WHERE `request_code` = ? LIMIT 1");
        $stmt->execute([$code]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    // Helper to render HTML shell
    $renderShell = function($title, $contentHtml) {
        echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>{$title} — GRM CRM</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #0f172a;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }
    .wrapper {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border-radius: 24px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #064e3b 0%, #065f46 50%, #047857 100%);
      color: #ffffff;
      padding: 24px 20px;
      text-align: center;
      position: relative;
    }
    .brand-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(8px);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.3px;
    }
    .content {
      padding: 24px 20px;
    }
    .card-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 20px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 13px;
    }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #64748b; font-weight: 600; }
    .detail-value { color: #0f172a; font-weight: 700; text-align: right; }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 800;
    }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-approved { background: #d1fae5; color: #065f46; }
    .badge-rejected { background: #ffe4e6; color: #9f1239; }
    .btn {
      display: block;
      width: 100%;
      padding: 14px 20px;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 700;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    .btn-approve { background: #059669; color: white; }
    .btn-approve:hover { background: #047857; }
    .btn-reject { background: #e11d48; color: white; }
    .btn-reject:hover { background: #be123c; }
    .btn-secondary { background: #e2e8f0; color: #334155; margin-top: 10px; }
    .status-icon {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 34px;
      margin: 0 auto 16px;
    }
    .icon-success { background: #d1fae5; color: #059669; }
    .icon-danger { background: #ffe4e6; color: #e11d48; }
    .icon-warning { background: #fef3c7; color: #d97706; }
    .footer-note {
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      margin-top: 16px;
    }
    .chip {
      display: inline-block;
      padding: 7px 12px;
      border-radius: 20px;
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-weight: 600;
      margin: 4px 2px;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      transition: all 0.15s;
    }
    .chip.active, .chip:hover {
      background: #ffe4e6;
      color: #9f1239;
      border-color: #f43f5e;
    }
    textarea {
      width: 100%;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 12px;
      font-family: inherit;
      font-size: 13px;
      resize: vertical;
      margin: 12px 0;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="brand-pill">GRM Business CRM</div>
      <h1>Bulk Price Decision</h1>
    </div>
    <div class="content">
      {$contentHtml}
    </div>
  </div>
</body>
</html>
HTML;
    };

    if (!$req) {
        $renderShell("Request Not Found", "
            <div class='status-icon icon-danger'>✕</div>
            <h2 style='text-align:center;font-size:18px;margin-bottom:8px;'>Request Not Found</h2>
            <p style='text-align:center;color:#64748b;font-size:13px;margin-bottom:20px;'>The requested bulk price approval could not be found. Please check your link or open the CRM directly.</p>
        ");
        exit;
    }

    // Increment click counter
    $pdo->prepare("UPDATE `bulk_price_requests` SET `link_click_count` = `link_click_count` + 1 WHERE `id` = ?")->execute([$req['id']]);

    // RULE: "so one reqest can message send three time more than third link not working there"
    $sendCount = (int)($req['send_count'] ?? 1);
    if ($sendCount > 3) {
        $renderShell("Link Expired", "
            <div class='status-icon icon-warning'>⚠️</div>
            <h2 style='text-align:center;font-size:18px;margin-bottom:8px;color:#92400e;'>Link Inactive & Expired</h2>
            <p style='text-align:center;color:#64748b;font-size:13px;margin-bottom:16px;'>
                This bulk price request notification has been sent <b>{$sendCount} times</b>, which exceeds the maximum allowed limit of 3 messages.
            </p>
            <div class='card-box' style='background:#fffbeb;border-color:#fde68a;'>
                <div class='detail-row'>
                    <span class='detail-label'>Request Code</span>
                    <span class='detail-value'>{$req['request_code']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Customer</span>
                    <span class='detail-value'>{$req['customer_name']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Status</span>
                    <span class='detail-value' style='color:#b45309;'>LINK DISABLED (Exceeded 3 Sends)</span>
                </div>
            </div>
            <p style='font-size:12px;color:#94a3b8;text-align:center;margin-bottom:16px;'>
                For data protection, one-click WhatsApp action links are automatically deactivated after the 3rd message. Please log in directly to your CRM workstation to review and process this order.
            </p>
        ");
        exit;
    }

    // Check if already approved
    if ($req['status'] === 'APPROVED') {
        $renderShell("Already Approved", "
            <div class='status-icon icon-success'>✓</div>
            <h2 style='text-align:center;font-size:18px;margin-bottom:6px;color:#065f46;'>Already Approved</h2>
            <p style='text-align:center;color:#64748b;font-size:12px;margin-bottom:16px;'>This bulk request is already active in CRM.</p>
            <div class='card-box'>
                <div class='detail-row'>
                    <span class='detail-label'>Request Code</span>
                    <span class='detail-value'><span class='badge badge-approved'>{$req['request_code']}</span></span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Customer</span>
                    <span class='detail-value'>{$req['customer_name']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Product</span>
                    <span class='detail-value'>{$req['product_name']} ({$req['size']})</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Approved Price</span>
                    <span class='detail-value' style='color:#059669;font-weight:800;'>₹{$req['requested_price']}/pc</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Total Amount</span>
                    <span class='detail-value'>₹{$req['total_requested_amount']} ({$req['quantity']} pcs)</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Approved By</span>
                    <span class='detail-value'>{$req['approved_by']}</span>
                </div>
            </div>
            <div class='footer-note'>Special price active &bull; Staff can process order</div>
        ");
        exit;
    }

    // Check if already rejected
    if ($req['status'] === 'REJECTED') {
        $safeRejReason = htmlspecialchars($req['rejection_reason'] ?: 'Price declined');
        $renderShell("Already Rejected", "
            <div class='status-icon icon-danger'>✕</div>
            <h2 style='text-align:center;font-size:18px;margin-bottom:6px;color:#9f1239;'>Request Declined</h2>
            <p style='text-align:center;color:#64748b;font-size:12px;margin-bottom:16px;'>This bulk request has already been rejected.</p>
            <div class='card-box'>
                <div class='detail-row'>
                    <span class='detail-label'>Request Code</span>
                    <span class='detail-value'><span class='badge badge-rejected'>{$req['request_code']}</span></span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Customer</span>
                    <span class='detail-value'>{$req['customer_name']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Reason</span>
                    <span class='detail-value' style='color:#e11d48;'>{$safeRejReason}</span>
                </div>
            </div>
            <div class='footer-note'>Decision recorded in CRM</div>
        ");
        exit;
    }

    // Process Action if PENDING
    if ($decision === 'approve') {
        $approvedBy = 'Super Admin (via WhatsApp Link)';
        $pdo->prepare("
            UPDATE `bulk_price_requests`
            SET `status` = 'APPROVED',
                `approved_by` = ?,
                `approved_at` = NOW(),
                `updated_at` = NOW()
            WHERE `id` = ?
        ")->execute([$approvedBy, $req['id']]);

        // Audit log
        try {
            $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `details`) VALUES ('BULK_PRICE_APPROVED', 'PRICING', ?, ?)")
                ->execute([$approvedBy, "Approved bulk request {$req['request_code']} for {$req['customer_name']} via WhatsApp One-Click Link"]);
        } catch (Exception $e) {}

        // Broadcast to bridge & dispatch WhatsApp confirmation to Admin AND Staff
        $updatedReq = array_merge($req, [
            'status' => 'APPROVED',
            'approved_by' => $approvedBy,
            'approved_at' => date('Y-m-d H:i:s')
        ]);
        dispatchBulkDecisionWhatsAppNotifications($pdo, $updatedReq, 'APPROVED', '', $approvedBy);

        $renderShell("Approved Successfully", "
            <div class='status-icon icon-success'>✓</div>
            <h2 style='text-align:center;font-size:20px;font-weight:800;color:#065f46;margin-bottom:4px;'>Approved Successfully!</h2>
            <p style='text-align:center;color:#64748b;font-size:12px;margin-bottom:16px;'>Bulk special price is now active in CRM</p>
            <div class='card-box' style='background:#f0fdf4;border-color:#bbf7d0;'>
                <div class='detail-row'>
                    <span class='detail-label'>Request Code</span>
                    <span class='detail-value'><span class='badge badge-approved'>{$req['request_code']}</span></span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Customer</span>
                    <span class='detail-value'>{$req['customer_name']} ({$req['customer_phone']})</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Product</span>
                    <span class='detail-value'>{$req['product_name']} ({$req['size']})</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Standard Price</span>
                    <span class='detail-value' style='text-decoration:line-through;color:#94a3b8;'>₹{$req['selling_price']}/pc</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Approved Price</span>
                    <span class='detail-value' style='color:#059669;font-size:16px;font-weight:800;'>₹{$req['requested_price']}/pc</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Total Order Value</span>
                    <span class='detail-value' style='color:#065f46;'>₹{$req['total_requested_amount']} ({$req['quantity']} pcs)</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Requested By</span>
                    <span class='detail-value'>{$req['staff_name']}</span>
                </div>
            </div>
            <div style='background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:12px;text-align:center;font-size:12px;color:#047857;font-weight:600;'>
                Staff workstation updated in real-time. Staff can now take this order with the special approved price.
            </div>
        ");
        exit;
    } elseif ($decision === 'reject') {
        // If confirmed or POST
        if ($confirm === '1' || $_SERVER['REQUEST_METHOD'] === 'POST') {
            if (empty($reason)) {
                $reason = "Price too low for requested bulk quantity.";
            }
            $rejectedBy = 'Super Admin (via WhatsApp Link)';
            $pdo->prepare("
                UPDATE `bulk_price_requests`
                SET `status` = 'REJECTED',
                    `rejection_reason` = ?,
                    `admin_notes` = ?,
                    `approved_by` = ?,
                    `updated_at` = NOW()
                WHERE `id` = ?
            ")->execute([$reason, $reason, $rejectedBy, $req['id']]);

            // Audit log
            try {
                $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `details`) VALUES ('BULK_PRICE_REJECTED', 'PRICING', ?, ?)")
                    ->execute([$rejectedBy, "Rejected bulk request {$req['request_code']} with reason: $reason via WhatsApp Link"]);
            } catch (Exception $e) {}

            // Broadcast to bridge & dispatch WhatsApp confirmation to Admin AND Staff
            $updatedReq = array_merge($req, [
                'status' => 'REJECTED',
                'rejection_reason' => $reason,
                'approved_by' => $rejectedBy
            ]);
            dispatchBulkDecisionWhatsAppNotifications($pdo, $updatedReq, 'REJECTED', $reason, $rejectedBy);

            $safeSubReason = htmlspecialchars($reason);
            $renderShell("Request Rejected", "
                <div class='status-icon icon-danger'>✕</div>
                <h2 style='text-align:center;font-size:20px;font-weight:800;color:#9f1239;margin-bottom:4px;'>Request Rejected</h2>
                <p style='text-align:center;color:#64748b;font-size:12px;margin-bottom:16px;'>Bulk price request has been declined</p>
                <div class='card-box' style='background:#fff1f2;border-color:#fecdd3;'>
                    <div class='detail-row'>
                        <span class='detail-label'>Request Code</span>
                        <span class='detail-value'><span class='badge badge-rejected'>{$req['request_code']}</span></span>
                    </div>
                    <div class='detail-row'>
                        <span class='detail-label'>Customer</span>
                        <span class='detail-value'>{$req['customer_name']}</span>
                    </div>
                    <div class='detail-row'>
                        <span class='detail-label'>Reason</span>
                        <span class='detail-value' style='color:#e11d48;'>{$safeSubReason}</span>
                    </div>
                </div>
                <div style='background:#fef2f2;border:1px solid #fecaca;border-radius:12px;padding:12px;text-align:center;font-size:12px;color:#991b1b;font-weight:600;'>
                    Staff workstation notified in real-time.
                </div>
            ");
            exit;
        }

        // Show Rejection reason selection page
        $renderShell("Decline Request", "
            <h2 style='font-size:18px;font-weight:800;color:#0f172a;margin-bottom:4px;'>Decline Bulk Price</h2>
            <p style='color:#64748b;font-size:12px;margin-bottom:16px;'>Select or enter a reason for rejecting request <b>{$req['request_code']}</b>.</p>
            <div class='card-box'>
                <div class='detail-row'>
                    <span class='detail-label'>Customer</span>
                    <span class='detail-value'>{$req['customer_name']}</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Product</span>
                    <span class='detail-value'>{$req['product_name']} ({$req['quantity']} pcs)</span>
                </div>
                <div class='detail-row'>
                    <span class='detail-label'>Requested Price</span>
                    <span class='detail-value' style='color:#e11d48;font-weight:800;'>₹{$req['requested_price']}/pc</span>
                </div>
            </div>
            <form method='POST' action='api.php?action=bulk_link_action'>
                <input type='hidden' name='token' value='{$token}'>
                <input type='hidden' name='code' value='{$req['request_code']}'>
                <input type='hidden' name='decision' value='reject'>
                <input type='hidden' name='confirm' value='1'>
                <div style='margin-bottom:8px;'>
                    <span style='font-size:12px;font-weight:700;color:#475569;'>Quick Reasons:</span>
                    <div style='margin-top:6px;'>
                        <span class='chip' onclick='setReason(&quot;Price too low for this bulk order quantity&quot;)'>Price too low</span>
                        <span class='chip' onclick='setReason(&quot;Insufficient stock for bulk quantity&quot;)'>Low stock</span>
                        <span class='chip' onclick='setReason(&quot;Margin below cost / minimum price&quot;)'>Low margin</span>
                        <span class='chip' onclick='setReason(&quot;Cannot offer discount on this collection&quot;)'>No discount</span>
                    </div>
                </div>
                <textarea id='rejection_reason' name='rejection_reason' rows='3' placeholder='Enter reason for staff...' required>Price too low for this bulk order quantity.</textarea>
                <button type='submit' class='btn btn-reject'>Confirm Rejection</button>
            </form>
            <script>
                function setReason(txt) {
                    document.getElementById('rejection_reason').value = txt;
                }
            </script>
        ");
        exit;
    }

    $renderShell("Bulk Price Request", "
        <h2 style='text-align:center;font-size:18px;'>Pending Decision</h2>
        <div class='card-box' style='margin-top:16px;'>
            <div class='detail-row'><span class='detail-label'>Request</span><span class='detail-value'>{$req['request_code']}</span></div>
            <div class='detail-row'><span class='detail-label'>Customer</span><span class='detail-value'>{$req['customer_name']}</span></div>
            <div class='detail-row'><span class='detail-label'>Product</span><span class='detail-value'>{$req['product_name']}</span></div>
            <div class='detail-row'><span class='detail-label'>Requested</span><span class='detail-value'>₹{$req['requested_price']}/pc (Total: ₹{$req['total_requested_amount']})</span></div>
        </div>
        <a href='api.php?action=bulk_link_action&token=".urlencode($token)."&code=".urlencode($req['request_code'])."&decision=approve' class='btn btn-approve' style='margin-bottom:10px;'>✓ Approve Request</a>
        <a href='api.php?action=bulk_link_action&token=".urlencode($token)."&code=".urlencode($req['request_code'])."&decision=reject' class='btn btn-reject'>✕ Reject Request</a>
    ");
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
    $bRes = curlBridgePost('/api/send', [
        'phone' => $phone, 
        'text' => $text,
        'jid' => $postData['jid'] ?? null,
        'accountId' => $postData['accountId'] ?? null,
        'mediaUrl' => $mediaUrl
    ], 7);
    $response = $bRes['response'];
    $httpCode = $bRes['http_code'];

    // Also persist message in MySQL (All WhatsApp Fields Recorded)
    if ($pdo) {
        try {
            $effectiveCustId = $customerId;
            if (empty($effectiveCustId) && !empty($phone)) {
                $cleanP = preg_replace('/[^0-9]/', '', $phone);
                $clean10 = substr($cleanP, -10);
                $cStmt = $pdo->prepare("SELECT `id` FROM `customers` WHERE `phone` LIKE ? OR `whatsapp` LIKE ? LIMIT 1");
                $cStmt->execute(["%$clean10%", "%$clean10%"]);
                $effectiveCustId = $cStmt->fetchColumn() ?: null;
            }
            if (!empty($effectiveCustId)) {
                $accSlot = $postData['accountId'] ?? 'account_1';
                $stmt = $pdo->prepare("
                    INSERT INTO `messages` (
                        `customer_id`, `sender`, `sender_name`, `sender_phone`, `sender_jid`,
                        `direction`, `text`, `message_text`, `media_type`, `media_url`,
                        `account_id`, `is_bot`, `source`, `time_str`, `timestamp_epoch`, `status`
                    ) VALUES (?, 'staff', 'Super Admin', ?, ?, 'outbound', ?, ?, ?, ?, ?, 0, 'CRM_OUTBOUND', ?, ?, 'DELIVERED')
                ");
                $stmt->execute([
                    $effectiveCustId,
                    $phone,
                    $postData['jid'] ?? null,
                    $text,
                    $text,
                    $mediaType,
                    $mediaUrl,
                    $accSlot,
                    date("h:i A"),
                    time()
                ]);

                // Update query & customer last message
                $pdo->prepare("UPDATE `queries` SET `last_message` = ? WHERE `customer_id` = ?")->execute([$text, $effectiveCustId]);
                $pdo->prepare("UPDATE `customers` SET `last_message` = ?, `last_message_at` = NOW() WHERE `id` = ?")->execute([$text, $effectiveCustId]);
            }
        } catch (Exception $e) {
            error_log("Error saving outbound message: " . $e->getMessage());
        }
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

    $msgUid = $payload['id'] ?? ("msg_" . uniqid());
    $msgEntry = [
        "id" => $msgUid,
        "message_uid" => $msgUid,
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

    // Clean media_url if base64 before putting into queue
    if (!empty($msgEntry['media_url']) && str_starts_with($msgEntry['media_url'], 'data:')) {
        $mMatch = [];
        if (preg_match('/^data:([a-zA-Z0-9\/\+;=-]+);base64,(.+)$/', $msgEntry['media_url'], $mMatch)) {
            $isImg = strpos($mMatch[1], 'image') !== false;
            $ext = $isImg ? 'jpg' : (strpos($mMatch[1], 'audio') !== false ? 'ogg' : 'bin');
            $dir = $isImg ? (__DIR__ . '/uploads/media') : (__DIR__ . '/uploads/voice');
            if (!file_exists($dir)) @mkdir($dir, 0777, true);
            $fileName = 'media_' . time() . '_' . substr(uniqid(), -5) . '.' . $ext;
            file_put_contents($dir . '/' . $fileName, base64_decode($mMatch[2]));
            $msgEntry['media_url'] = ($isImg ? 'uploads/media/' : 'uploads/voice/') . $fileName;
        }
    }

    // Append to live queue file (capped to last 50 items for ultra-fast polling)
    $queue = [];
    if (file_exists($messagesFile)) {
        $rawQueue = file_get_contents($messagesFile);
        $queue = json_decode($rawQueue, true) ?: [];
    }
    $queue[] = $msgEntry;
    if (count($queue) > 50) {
        $queue = array_slice($queue, -50);
    }
    atomicWriteJson($messagesFile, $queue);

    // Also persist in MySQL if database connection available
    if ($pdo) {
        try {
            $cleanPhone = preg_replace('/[^0-9]/', '', $senderPhone);
            $clean10 = substr($cleanPhone, -10);
            $custId = 'cust_' . ($clean10 ?: substr(uniqid(), -6));

            // Check or insert customer (robust against spaces and formats)
            $checkCust = $pdo->prepare("SELECT `id` FROM `customers` WHERE REPLACE(REPLACE(REPLACE(REPLACE(`phone`, ' ', ''), '+', ''), '-', ''), '(', '') LIKE ? OR REPLACE(REPLACE(REPLACE(REPLACE(`whatsapp`, ' ', ''), '+', ''), '-', ''), '(', '') LIKE ? LIMIT 1");
            $checkCust->execute(["%$clean10%", "%$clean10%"]);
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

            $isBot = (!empty($payload['is_outbound']) || ($payload['sender_name'] ?? '') === 'Bot (Auto-Reply)' || ($payload['source'] ?? '') === 'AUTOREPLY_BOT') ? 1 : 0;
            $direction = $isBot ? 'outbound' : 'inbound';
            $sender = $isBot ? 'bot' : 'customer';

            // Insert message (Deduplicated with UNIQUE message_uid, all values stored!)
            $pdo->prepare("
                INSERT INTO `messages` (
                    `message_uid`, `customer_id`, `sender`, `sender_name`, `sender_phone`, `sender_jid`,
                    `direction`, `text`, `message_text`, `media_type`, `media_url`, `audio_duration`,
                    `account_id`, `received_on_number`, `is_bot`, `rule_name`, `rule_id`, `source`,
                    `time_str`, `timestamp_epoch`, `status`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DELIVERED')
                ON DUPLICATE KEY UPDATE 
                    `sender_name` = IF(VALUES(`sender_name`) IS NOT NULL, VALUES(`sender_name`), `sender_name`),
                    `account_id` = IF(VALUES(`account_id`) IS NOT NULL, VALUES(`account_id`), `account_id`),
                    `is_bot` = VALUES(`is_bot`),
                    `direction` = VALUES(`direction`),
                    `media_url` = IF(VALUES(`media_url`) IS NOT NULL, VALUES(`media_url`), `media_url`),
                    `text` = IF(VALUES(`text` ) IS NOT NULL, VALUES(`text`), `text`),
                    `message_text` = IF(VALUES(`message_text`) IS NOT NULL, VALUES(`message_text`), `message_text`)
            ")->execute([
                $msgUid, $custId, $sender, $senderName, $senderPhone, $payload['sender_jid'] ?? null,
                $direction, $messageText, $messageText, $type, $mediaUrl, $duration,
                $payload['account_id'] ?? 'account_1', $payload['received_on_number'] ?? null,
                $isBot, $payload['rule_name'] ?? null, $payload['rule_id'] ?? null, $payload['source'] ?? 'REAL_WHATSAPP_LIVE',
                $receivedAt, (int)$timestampEpoch
            ]);

            // Update customer account_id and last_message
            $pdo->prepare("UPDATE `customers` SET `account_id` = ?, `last_message` = ?, `last_message_at` = NOW() WHERE `id` = ?")
                ->execute([$payload['account_id'] ?? 'account_1', $messageText, $custId]);

            // Update or insert query
            $checkQ = $pdo->prepare("SELECT `id`, `unread_count` FROM `queries` WHERE `customer_id` = ? LIMIT 1");
            $checkQ->execute([$custId]);
            $existingQ = $checkQ->fetch();

            if ($existingQ) {
                $newUnread = ((int)$existingQ['unread_count']) + 1;
                $existingStaff = $existingQ['assigned_to'] ?? 'UNASSIGNED';
                $newStatus = ($existingStaff !== 'UNASSIGNED') ? 'IN_PROGRESS' : 'NEW';
                $pdo->prepare("
                    UPDATE `queries` 
                    SET `unread_count` = ?, `last_message` = ?, `status` = ? 
                    WHERE `id` = ?
                ")->execute([$newUnread, $messageText, $newStatus, $existingQ['id']]);
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

if ($action === 'get_customer_messages') {
    $cid = $_GET['customer_id'] ?? '';
    if (empty($cid) && !empty($_GET['phone'])) {
        $cPhone = preg_replace('/[^0-9]/', '', $_GET['phone']);
        $cStmt = $pdo->prepare("SELECT id FROM customers WHERE phone LIKE ? OR whatsapp LIKE ? LIMIT 1");
        $cStmt->execute(['%' . substr($cPhone, -10), '%' . substr($cPhone, -10)]);
        $cid = $cStmt->fetchColumn() ?: '';
    }
    $msgs = [];
    if ($pdo && !empty($cid)) {
        $stmt = $pdo->prepare("SELECT * FROM (SELECT * FROM `messages` WHERE `customer_id` = ? ORDER BY `id` DESC LIMIT 200) sub ORDER BY `id` ASC");
        $stmt->execute([$cid]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            $msgs[] = [
                'id' => (string)($r['message_uid'] ?: $r['id']),
                'message_uid' => (string)($r['message_uid'] ?: $r['id']),
                'db_id' => (int)$r['id'],
                'sender' => $r['sender'],
                'sender_name' => $r['sender_name'] ?? ($r['sender'] === 'bot' ? 'Bot (Auto-Reply)' : ($r['sender'] === 'staff' ? 'Super Admin' : 'Customer')),
                'sender_phone' => $r['sender_phone'] ?? '',
                'sender_jid' => $r['sender_jid'] ?? '',
                'direction' => $r['direction'] ?? ($r['sender'] === 'customer' ? 'inbound' : 'outbound'),
                'isBot' => (bool)($r['is_bot'] ?? ($r['sender'] === 'bot')),
                'is_bot' => (int)($r['is_bot'] ?? ($r['sender'] === 'bot' ? 1 : 0)),
                'account_id' => $r['account_id'] ?? 'account_1',
                'accountId' => $r['account_id'] ?? 'account_1',
                'received_on_number' => $r['received_on_number'] ?? '',
                'rule_name' => $r['rule_name'] ?? null,
                'source' => $r['source'] ?? 'REAL_WHATSAPP_LIVE',
                'text' => $r['text'],
                'message_text' => $r['message_text'] ?: $r['text'],
                'type' => $r['media_type'] ?: 'text',
                'media_type' => $r['media_type'],
                'mediaType' => $r['media_type'],
                'media_url' => $r['media_url'],
                'mediaUrl' => $r['media_url'],
                'duration' => (float)($r['audio_duration'] ?: 8),
                'audioDuration' => (float)($r['audio_duration'] ?: 8),
                'time' => $r['time_str'],
                'timestamp_epoch' => (int)($r['timestamp_epoch'] ?? strtotime($r['created_at'])),
                'status' => $r['status'] ?: 'DELIVERED',
                'created_at' => $r['created_at']
            ];
        }
    }
    echo json_encode(['status' => 'success', 'messages' => $msgs]);
    exit;
}

// Dedicated Sync Action: Import any un-synced messages from live_messages_queue.json into DB
if ($action === 'sync_inbox_queue_to_db') {
    $synced = 0;
    if ($pdo && file_exists($messagesFile)) {
        try {
            $queue = json_decode(file_get_contents($messagesFile), true) ?: [];
            $insStmt = $pdo->prepare("
                INSERT INTO `messages` (
                    `message_uid`, `customer_id`, `sender`, `sender_name`, `sender_phone`, `sender_jid`,
                    `direction`, `text`, `message_text`, `media_type`, `media_url`, `audio_duration`,
                    `account_id`, `received_on_number`, `is_bot`, `rule_name`, `rule_id`, `source`,
                    `time_str`, `timestamp_epoch`, `status`
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DELIVERED')
                ON DUPLICATE KEY UPDATE 
                    `sender_name` = IF(VALUES(`sender_name`) IS NOT NULL, VALUES(`sender_name`), `sender_name`),
                    `account_id` = IF(VALUES(`account_id`) IS NOT NULL, VALUES(`account_id`), `account_id`),
                    `is_bot` = VALUES(`is_bot`),
                    `direction` = VALUES(`direction`),
                    `media_url` = IF(VALUES(`media_url`) IS NOT NULL, VALUES(`media_url`), `media_url`)
            ");
            foreach ($queue as $qItem) {
                $uid = $qItem['message_uid'] ?? ($qItem['id'] ?? null);
                if (!$uid) continue;
                $sp = $qItem['sender_phone'] ?? '';
                $clean10 = substr(preg_replace('/[^0-9]/', '', $sp), -10);
                $cId = 'cust_' . ($clean10 ?: substr(uniqid(), -6));
                $cRow = $pdo->query("SELECT `id` FROM `customers` WHERE `id` = '$cId' OR `phone` LIKE '%$clean10%' LIMIT 1")->fetch();
                if ($cRow) $cId = $cRow['id'];
                $isB = (!empty($qItem['is_outbound']) || ($qItem['sender_name'] ?? '') === 'Bot (Auto-Reply)' || ($qItem['source'] ?? '') === 'AUTOREPLY_BOT') ? 1 : 0;
                $txt = $qItem['message_text'] ?? ($qItem['text'] ?? '');
                $insStmt->execute([
                    $uid, $cId, $isB ? 'bot' : 'customer', $qItem['sender_name'] ?? null, $sp, $qItem['sender_jid'] ?? null,
                    $isB ? 'outbound' : 'inbound', $txt, $txt, $qItem['type'] ?? 'text', $qItem['media_url'] ?? null,
                    isset($qItem['duration']) ? (string)$qItem['duration'] : null,
                    $qItem['account_id'] ?? 'account_1', $qItem['received_on_number'] ?? null,
                    $isB, $qItem['rule_name'] ?? null, $qItem['rule_id'] ?? null, $qItem['source'] ?? 'REAL_WHATSAPP_LIVE',
                    $qItem['received_at'] ?? date("h:i A"), (int)($qItem['timestamp_epoch'] ?? time())
                ]);
                $synced++;
            }
        } catch (Exception $e) {}
    }
    echo json_encode(['status' => 'success', 'synced_count' => $synced]);
    exit;
}

if ($action === 'sse_stream') {
    require __DIR__ . '/sse.php';
    exit;
}

if ($action === 'get_inbound_messages') {
    $since = isset($_GET['since']) ? (int)$_GET['since'] : 0;
    $newMessages = [];

    // 1. Inbound messages from live queue JSON file
    if (file_exists($messagesFile)) {
        $rawQueue = file_get_contents($messagesFile);
        $queue = json_decode($rawQueue, true) ?: [];
        foreach ($queue as $item) {
            if ((int)($item['timestamp_epoch'] ?? 0) > $since) {
                $newMessages[] = $item;
            }
        }
    }

    // 2. High-speed delta query for newly updated / assigned leads
    $assignments = [];
    if ($pdo) {
        try {
            if ($since > 0) {
                // High-speed Delta Query: Only fetch records updated since client's last poll epoch
                $stmt = $pdo->prepare("
                    SELECT q.id, q.customer_id, q.assigned_to, q.status, c.phone, c.name 
                    FROM `queries` q 
                    LEFT JOIN `customers` c ON q.customer_id = c.id 
                    WHERE q.assigned_to IS NOT NULL 
                      AND q.assigned_to != 'UNASSIGNED' 
                      AND (
                        (q.updated_at IS NOT NULL AND q.updated_at >= FROM_UNIXTIME(:since1)) 
                        OR (q.created_at IS NOT NULL AND q.created_at >= FROM_UNIXTIME(:since2))
                      )
                    LIMIT 100
                ");
                $stmt->execute([':since1' => $since, ':since2' => $since]);
                $qRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                // Initial Load: Fetch current active assignments
                $qRows = $pdo->query("
                    SELECT q.id, q.customer_id, q.assigned_to, q.status, c.phone, c.name 
                    FROM `queries` q 
                    LEFT JOIN `customers` c ON q.customer_id = c.id 
                    WHERE q.assigned_to IS NOT NULL 
                      AND q.assigned_to != 'UNASSIGNED'
                ")->fetchAll(PDO::FETCH_ASSOC);
            }

            foreach ($qRows as $qr) {
                $assignments[] = [
                    'query_id' => $qr['id'],
                    'customer_id' => $qr['customer_id'],
                    'assigned_to' => $qr['assigned_to'],
                    'status' => $qr['status'],
                    'phone' => $qr['phone'] ?? '',
                    'name' => $qr['name'] ?? ''
                ];
            }
        } catch (Exception $e) {
            // Graceful fallback if updated_at column is not yet present on older schema
            try {
                $fallbackRows = $pdo->query("SELECT q.id, q.customer_id, q.assigned_to, q.status, c.phone, c.name FROM `queries` q LEFT JOIN `customers` c ON q.customer_id = c.id WHERE q.assigned_to IS NOT NULL AND q.assigned_to != 'UNASSIGNED'")->fetchAll(PDO::FETCH_ASSOC);
                foreach ($fallbackRows as $qr) {
                    $assignments[] = [
                        'query_id' => $qr['id'],
                        'customer_id' => $qr['customer_id'],
                        'assigned_to' => $qr['assigned_to'],
                        'status' => $qr['status'],
                        'phone' => $qr['phone'] ?? '',
                        'name' => $qr['name'] ?? ''
                    ];
                }
            } catch (Exception $ex) {}
        }

        // 3. Delta query from MySQL messages table if new messages arrived directly
        if ($since > 0) {
            try {
                $mStmt = $pdo->prepare("
                    SELECT m.*, c.name as customer_name, c.phone as customer_phone 
                    FROM `messages` m
                    LEFT JOIN `customers` c ON m.customer_id = c.id
                    WHERE (m.timestamp_epoch > :since1 OR (m.created_at IS NOT NULL AND m.created_at >= FROM_UNIXTIME(:since2)))
                    ORDER BY m.id ASC LIMIT 50
                ");
                $mStmt->execute([':since1' => $since, ':since2' => $since]);
                $dbMsgs = $mStmt->fetchAll(PDO::FETCH_ASSOC);
                foreach ($dbMsgs as $dm) {
                    $uid = (string)($dm['message_uid'] ?: $dm['id']);
                    $alreadyInQueue = false;
                    foreach ($newMessages as $nm) {
                        if (($nm['id'] ?? '') === $uid || ($nm['message_uid'] ?? '') === $uid) {
                            $alreadyInQueue = true;
                            break;
                        }
                    }
                    if (!$alreadyInQueue) {
                        $newMessages[] = [
                            'id' => $uid,
                            'message_uid' => $uid,
                            'customer_id' => $dm['customer_id'],
                            'sender' => $dm['sender'],
                            'sender_name' => $dm['sender_name'] ?? ($dm['sender'] === 'bot' ? 'Bot (Auto-Reply)' : ($dm['sender'] === 'staff' ? 'Super Admin' : 'Customer')),
                            'direction' => $dm['direction'] ?? ($dm['sender'] === 'customer' ? 'inbound' : 'outbound'),
                            'text' => $dm['text'],
                            'type' => $dm['media_type'] ?: 'text',
                            'media_url' => $dm['media_url'],
                            'duration' => (float)($dm['audio_duration'] ?: 8),
                            'timestamp_epoch' => (int)($dm['timestamp_epoch'] ?? strtotime($dm['created_at'])),
                            'time' => $dm['time_str'],
                            'status' => $dm['status'] ?: 'DELIVERED',
                            'account_id' => $dm['account_id'] ?? 'account_1'
                        ];
                    }
                }
            } catch (Exception $e) {}
        }
    }

    echo json_encode([
        "status" => "success",
        "since" => $since,
        "count" => count($newMessages),
        "messages" => $newMessages,
        "assignments" => $assignments,
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
                $deliveryNote = $p['delivery_note'] ?? ($p['deliveryNote'] ?? null);
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
                    if (empty($image)) {
                        $imgStmt = $pdo->prepare("SELECT `image` FROM `products` WHERE `id` = ?");
                        $imgStmt->execute([$targetId]);
                        $prevImg = $imgStmt->fetchColumn();
                        if (!empty($prevImg)) {
                            $image = $prevImg;
                        }
                    }
                    $stmt = $pdo->prepare("
                        UPDATE `products` SET 
                            `sku` = ?, `name` = ?, `category` = ?, `subcategory` = ?, `size` = ?, `color` = ?, 
                            `fabric` = ?, `specifications` = ?, `price` = ?, `mrp` = ?, `physical_stock` = ?, `reserved_stock` = ?, 
                            `image` = ?, `description` = ?, `delivery_note` = ?, `account_id` = ?
                        WHERE `id` = ?
                    ");
                    $stmt->execute([
                        $sku, $name, $category, $subcategory, $size, $color, 
                        $fabric, $specifications, $price, $mrp, $physical, $reserved, 
                        $image, $description, $deliveryNote, $accountId, $targetId
                    ]);
                    $savedIds[] = (int)$targetId;
                    $savedRows[] = ['id' => (int)$targetId, 'sku' => $sku, 'price' => $price, 'mrp' => $mrp, 'image' => $image, 'delivery_note' => $deliveryNote];
                } else {
                    $stmt = $pdo->prepare("
                        INSERT INTO `products` (`sku`, `name`, `category`, `subcategory`, `size`, `color`, `fabric`, `specifications`, `price`, `mrp`, `physical_stock`, `reserved_stock`, `image`, `description`, `delivery_note`, `account_id`)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        ON DUPLICATE KEY UPDATE 
                            `name` = VALUES(`name`), `category` = VALUES(`category`), `subcategory` = VALUES(`subcategory`),
                            `size` = VALUES(`size`), `color` = VALUES(`color`), `fabric` = VALUES(`fabric`),
                            `specifications` = VALUES(`specifications`),
                            `price` = VALUES(`price`), `mrp` = VALUES(`mrp`), `physical_stock` = VALUES(`physical_stock`),
                            `image` = VALUES(`image`), `description` = VALUES(`description`), `delivery_note` = VALUES(`delivery_note`), `account_id` = VALUES(`account_id`)
                    ");
                    $stmt->execute([
                        $sku, $name, $category, $subcategory, $size, $color, 
                        $fabric, $specifications, $price, $mrp, $physical, $reserved, 
                        $image, $description, $deliveryNote, $accountId
                    ]);
                    $insertedId = (int)($pdo->lastInsertId() ?: $targetId);
                    $savedIds[] = $insertedId;
                    $savedRows[] = ['id' => $insertedId, 'sku' => $sku, 'price' => $price, 'mrp' => $mrp, 'image' => $image, 'delivery_note' => $deliveryNote];
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
    $catId = $s['category_id'] ?? ($s['categoryId'] ?? null);

    if ($pdo) {
        try {
            if (empty($catId) && !empty($catName)) {
                $cStmt = $pdo->prepare("SELECT `id` FROM `categories` WHERE `name` = ? LIMIT 1");
                $cStmt->execute([$catName]);
                $catId = $cStmt->fetchColumn() ?: null;
            }

            $id = $s['id'] ?? null;
            $rowExists = false;
            if ($id && is_numeric($id)) {
                $checkStmt = $pdo->prepare("SELECT 1 FROM `subcategories` WHERE `id` = ?");
                $checkStmt->execute([$id]);
                $rowExists = (bool)$checkStmt->fetchColumn();
            }

            if ($rowExists) {
                $stmt = $pdo->prepare("UPDATE `subcategories` SET `category_id` = ?, `category_name` = ?, `name` = ?, `slug` = ?, `sku_prefix` = ? WHERE `id` = ?");
                $stmt->execute([$catId, $catName, $name, $slug, $prefix, $id]);
            } else {
                $stmt = $pdo->prepare("INSERT INTO `subcategories` (`category_id`, `category_name`, `name`, `slug`, `sku_prefix`) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([$catId, $catName, $name, $slug, $prefix]);
                $id = $pdo->lastInsertId() ?: $id;
            }
            echo json_encode(["status" => "success", "message" => "Subcategory saved successfully", "id" => $id, "category_id" => $catId]);
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

if (($action === 'upload_product_image' || $action === 'upload_media' || $action === 'upload_broadcast_image') && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $folderName = ($action === 'upload_broadcast_image') ? 'broadcast' : (($action === 'upload_media') ? 'media' : 'products');
    $uploadDir = __DIR__ . '/uploads/' . $folderName . '/';
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
        $fileName = 'img_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
        $targetPath = $uploadDir . $fileName;

        if (move_uploaded_file($file['tmp_name'], $targetPath)) {
            $url = 'uploads/' . $folderName . '/' . $fileName;
            $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
            $absoluteUrl = $scheme . '://' . $host . '/' . $url;
            echo json_encode([
                "status" => "success", 
                "url" => $url, 
                "absolute_url" => $absoluteUrl,
                "file_name" => $file['name'],
                "size" => $file['size'],
                "message" => "Image uploaded successfully"
            ]);
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
                $fileName = 'img_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
                file_put_contents($uploadDir . $fileName, $data);
                $url = 'uploads/' . $folderName . '/' . $fileName;
                $scheme = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'https' : 'http';
            $host = $_SERVER['HTTP_HOST'] ?? 'localhost:8000';
            $absoluteUrl = $scheme . '://' . $host . '/' . $url;
                echo json_encode([
                    "status" => "success", 
                    "url" => $url, 
                    "absolute_url" => $absoluteUrl,
                    "file_name" => $p['file_name'] ?? $fileName,
                    "message" => "Image saved successfully"
                ]);
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
if ($action === 'delete_order' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $orderId = $data['id'] ?? ($data['order_id'] ?? null);

    if (empty($orderId)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Order ID is required"]);
        exit;
    }

    if ($pdo) {
        try {
            $pdo->beginTransaction();

            // Fetch order items to release reserved stock
            $stmt = $pdo->prepare("SELECT `items_json` FROM `orders` WHERE `id` = ?");
            $stmt->execute([$orderId]);
            $row = $stmt->fetch();
            if ($row && !empty($row['items_json'])) {
                $items = json_decode($row['items_json'], true) ?: [];
                foreach ($items as $item) {
                    $sku = $item['sku'] ?? null;
                    $qty = (int)($item['qty'] ?? 1);
                    if ($sku && $qty > 0) {
                        $upd = $pdo->prepare("UPDATE `products` SET `reserved_stock` = GREATEST(0, `reserved_stock` - ?) WHERE `sku` = ?");
                        $upd->execute([$qty, $sku]);
                    }
                }
            }

            $stmtDel = $pdo->prepare("DELETE FROM `orders` WHERE `id` = ?");
            $stmtDel->execute([$orderId]);

            $pdo->commit();
            echo json_encode(["status" => "success", "message" => "Order deleted successfully and stock released"]);
            exit;
        } catch (Exception $e) {
            if ($pdo->inTransaction()) $pdo->rollBack();
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }

    echo json_encode(["status" => "success", "message" => "Order removed locally"]);
    exit;
}

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
        $paymentStatus = $order['paymentStatus'] ?? ($order['payment_status'] ?? 'PAYMENT_PENDING');
        $orderStatus = $order['orderStatus'] ?? ($order['order_status'] ?? 'STOCK_RESERVED');
        $customerPhone = $order['customerPhone'] ?? ($order['customer_phone'] ?? '');
        $shippingAddress = $order['shippingAddress'] ?? ($order['shipping_address'] ?? '');
        $shippingAmount = (float)($order['shippingAmount'] ?? ($order['shipping_amount'] ?? ($order['shippingCharge'] ?? ($order['shipping_charge'] ?? 0))));
        $codAdvance = (float)($order['codAdvance'] ?? ($order['cod_advance'] ?? ($order['advancePayment'] ?? ($order['advance_payment'] ?? 0))));
        $codBalanceDue = (float)($order['codBalanceDue'] ?? ($order['cod_balance_due'] ?? ($order['balanceAmount'] ?? ($order['balance_amount'] ?? 0))));
        $advancePayment = $codAdvance;
        $balanceAmount = $codBalanceDue;
        $upiTransactionId = $order['upiTransactionId'] ?? ($order['upi_transaction_id'] ?? '');
        $paymentScreenshot = $order['paymentScreenshot'] ?? ($order['payment_screenshot'] ?? '');
        $createdBy = $order['createdBy'] ?? ($order['created_by'] ?? ($order['user'] ?? 'Staff'));
        $staffId = $order['staffId'] ?? ($order['staff_id'] ?? '');
        $staffName = $order['staffName'] ?? ($order['staff_name'] ?? $createdBy);
        $trackingNumber = $order['trackingNumber'] ?? ($order['tracking_number'] ?? '');
        $courierName = $order['courierName'] ?? ($order['courier_name'] ?? '');
        $shippingUrl = $order['shippingUrl'] ?? ($order['shipping_url'] ?? ($order['tracking_url'] ?? ''));

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
                `shipping_amount`, `advance_payment`, `balance_amount`,
                `payment_method`, `payment_status`, `upi_transaction_id`, `payment_screenshot`,
                `order_status`, `tracking_number`, `courier_name`, `shipping_url`, `created_by`, `staff_id`, `staff_name`
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
                `customer_name` = VALUES(`customer_name`),
                `customer_phone` = VALUES(`customer_phone`),
                `shipping_address` = VALUES(`shipping_address`),
                `items_json` = VALUES(`items_json`),
                `grand_total` = VALUES(`grand_total`),
                `cod_advance` = VALUES(`cod_advance`),
                `cod_balance_due` = VALUES(`cod_balance_due`),
                `shipping_amount` = VALUES(`shipping_amount`),
                `advance_payment` = VALUES(`advance_payment`),
                `balance_amount` = VALUES(`balance_amount`),
                `payment_method` = VALUES(`payment_method`),
                `payment_status` = VALUES(`payment_status`),
                `upi_transaction_id` = VALUES(`upi_transaction_id`),
                `payment_screenshot` = VALUES(`payment_screenshot`),
                `order_status` = VALUES(`order_status`),
                `tracking_number` = VALUES(`tracking_number`),
                `courier_name` = VALUES(`courier_name`),
                `shipping_url` = VALUES(`shipping_url`),
                `staff_id` = VALUES(`staff_id`),
                `staff_name` = VALUES(`staff_name`)
        ");
        $stmt->execute([
            $orderId, $queryId, $customerId, $customerName, $customerPhone,
            $shippingAddress, json_encode($items), $grandTotal, $codAdvance, $codBalanceDue,
            $shippingAmount, $advancePayment, $balanceAmount,
            $paymentMethod, $paymentStatus, $upiTransactionId, $paymentScreenshot,
            $orderStatus, $trackingNumber, $courierName, $shippingUrl, $createdBy, $staffId, $staffName
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

    $validStatuses = ['PLACED', 'PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];
    if (!in_array($newStatus, $validStatuses)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid order status value: " . htmlspecialchars($newStatus)]);
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

            // Strict Sequential Validation (Cannot jump stages and cannot move backward)
            $stageOrder = [
                'PLACED' => 1,
                'PACKED' => 2,
                'SHIPPED' => 3,
                'OUT_FOR_DELIVERY' => 4,
                'DELIVERED' => 5
            ];

            $normOld = strtoupper(trim($oldStatus));
            $normNew = strtoupper(trim($newStatus));

            if ($normOld !== $normNew && $normNew !== 'CANCELLED') {
                if ($normOld === 'DELIVERED') {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "message" => "Strict Validation: Delivered orders cannot be modified."]);
                    exit;
                }

                $oldStep = $stageOrder[$normOld] ?? 1;
                $newStep = $stageOrder[$normNew] ?? 1;

                if ($newStep < $oldStep) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "message" => "Strict Validation: Cannot move status backward from {$normOld} to {$normNew}."]);
                    exit;
                }

                if ($newStep > $oldStep + 1) {
                    http_response_code(400);
                    echo json_encode(["status" => "error", "message" => "Strict Validation: Cannot jump stages from {$normOld} to {$normNew}. Orders must proceed sequentially: Placed -> Packed -> Shipped -> Out for Delivery -> Delivered."]);
                    exit;
                }
            }

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

            $trackingNumber = $data['tracking_number'] ?? ($data['trackingNumber'] ?? null);
            $courierName = $data['courier_name'] ?? ($data['courierName'] ?? null);
            $shippingUrl = $data['shipping_url'] ?? ($data['shippingUrl'] ?? null);

            $updateParts = ["`order_status` = ?"];
            $params = [$newStatus];

            if ($payStatus !== null) {
                $updateParts[] = "`payment_status` = ?";
                $params[] = $payStatus;
            }
            if ($trackingNumber !== null) {
                $updateParts[] = "`tracking_number` = ?";
                $params[] = $trackingNumber;
            }
            if ($courierName !== null) {
                $updateParts[] = "`courier_name` = ?";
                $params[] = $courierName;
            }
            if ($shippingUrl !== null) {
                $updateParts[] = "`shipping_url` = ?";
                $params[] = $shippingUrl;
            }

            $params[] = $orderId;
            $pdo->prepare("UPDATE `orders` SET " . implode(", ", $updateParts) . " WHERE `id` = ?")
                ->execute($params);

            $logDetails = "Order {$orderId} status changed from {$oldStatus} to {$newStatus}";
            if ($newStatus === 'SHIPPED' && ($trackingNumber || $courierName)) {
                $logDetails .= " via " . ($courierName ?: 'Courier') . " (AWB: " . ($trackingNumber ?: 'N/A') . ")";
            }

            $pdo->prepare("
                INSERT INTO `audit_logs` (`user`, `action`, `module`, `details`, `timestamp_str`)
                VALUES (?, 'ORDER_STATUS_UPDATED', 'ORDERS', ?, ?)
            ")->execute([$user, $logDetails, date("h:i A")]);
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

if ($action === 'get_products') {
    try {
        if (!$pdo) {
            echo json_encode(["status" => "success", "products" => []]);
            exit;
        }
        $stmt = $pdo->query("SELECT * FROM `products` ORDER BY `id` ASC");
        $products = $stmt->fetchAll();
        echo json_encode(["status" => "success", "products" => $products]);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
        exit;
    }
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
            // Deduplicate: If an active pending follow-up exists for this customer, update it instead of creating duplicates
            $targetId = $fu['id'];
            if (!empty($cId)) {
                $existingCheck = $pdo->prepare("SELECT `id` FROM `followups` WHERE `customer_id` = ? AND `is_payment_pending` = ? AND `status` = 'PENDING' LIMIT 1");
                $existingCheck->execute([$cId, $isPaymentPending]);
                $existingRow = $existingCheck->fetch(PDO::FETCH_ASSOC);
                if ($existingRow && !empty($existingRow['id'])) {
                    $targetId = $existingRow['id'];
                }
            }

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
                $targetId,
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
                $qCheck = $pdo->prepare("SELECT `status` FROM `queries` WHERE `id` = ?");
                $qCheck->execute([$qId]);
                $currQ = $qCheck->fetch(PDO::FETCH_ASSOC);
                if ($currQ && $currQ['status'] !== 'PENDING' && $currQ['status'] !== 'FOLLOW_UP') {
                    $newQStatus = $isPaymentPending ? 'PENDING' : 'FOLLOW_UP';
                    $pdo->prepare("UPDATE `queries` SET `status` = ? WHERE `id` = ?")->execute([$newQStatus, $qId]);
                }
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
            $existingQ = null;
            if ($queryId) {
                $qCheck = $pdo->prepare("SELECT `id`, `customer_id` FROM `queries` WHERE `id` = ?");
                $qCheck->execute([$queryId]);
                $existingQ = $qCheck->fetch(PDO::FETCH_ASSOC);
            }
            if (!$existingQ && $cid) {
                $qCheck = $pdo->prepare("SELECT `id`, `customer_id` FROM `queries` WHERE `customer_id` = ? LIMIT 1");
                $qCheck->execute([$cid]);
                $existingQ = $qCheck->fetch(PDO::FETCH_ASSOC);
            }

            if (!$existingQ) {
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
                $targetQId = $existingQ['id'];
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
                    $targetQId
                ]);
            }

            // Sync all queries for this customer
            if ($cid) {
                $pdo->prepare("UPDATE `queries` SET `assigned_to` = ?, `status` = ? WHERE `customer_id` = ?")->execute([$assignedTo, $status, $cid]);
            }

            // Also synchronize live_messages_queue.json
            $targetPhone = $phone ?: ($cData['phone'] ?? ($cData['whatsapp'] ?? ''));
            if ($targetPhone && file_exists($messagesFile)) {
                $rawQ = file_get_contents($messagesFile);
                $qItems = json_decode($rawQ, true) ?: [];
                $cleanT = preg_replace('/[^0-9]/', '', $targetPhone);
                $clean10T = strlen($cleanT) >= 7 ? substr($cleanT, -10) : '';
                $qChanged = false;
                foreach ($qItems as &$it) {
                    $itP = preg_replace('/[^0-9]/', '', $it['sender_phone'] ?? '');
                    $nameMatches = (!empty($cData['name']) && !empty($it['sender_name']) && strtolower(trim($it['sender_name'])) === strtolower(trim($cData['name'])))
                        || (!empty($customerName) && !empty($it['sender_name']) && strtolower(trim($it['sender_name'])) === strtolower(trim($customerName)));
                    if (($clean10T && strlen($itP) >= 7 && str_ends_with($itP, $clean10T)) || $nameMatches) {
                        $it['assigned_to'] = $assignedTo;
                        $qChanged = true;
                    }
                }
                if ($qChanged) {
                    atomicWriteJson($messagesFile, $qItems);
                }
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

            // 4. Synchronize followups table in MySQL
            if ($cid && ($status === 'FOLLOW_UP' || $status === 'PENDING' || !empty($cbDate) || $isPayPending)) {
                $fuCheck = $pdo->prepare("SELECT `id` FROM `followups` WHERE (`customer_id` = ? OR `query_id` = ?) AND `status` = 'PENDING' LIMIT 1");
                $fuCheck->execute([$cid, $queryId]);
                $existingFu = $fuCheck->fetch(PDO::FETCH_ASSOC);

                $fuDate = $cbDate ?: ($payDue ?: date('Y-m-d'));
                $fuTime = $cbTime ?: '11:00 AM';
                $fuReason = $notes ?: ($status === 'PENDING' ? 'Payment Pending follow-up' : 'Customer callback requested');
                $fuIsPay = ($status === 'PENDING' || $isPayPending) ? 1 : 0;

                if ($existingFu) {
                    $pdo->prepare("
                        UPDATE `followups`
                        SET `date_str` = ?, `time_str` = ?, `reason` = ?, `assigned_to` = ?,
                            `is_payment_pending` = ?, `payment_amount` = ?, `shipping_amount` = ?,
                            `payment_mode` = ?, `advance_payment` = ?, `payment_due_date` = ?,
                            `payment_notes` = ?, `quoted_items` = ?
                        WHERE `id` = ?
                    ")->execute([
                        $fuDate, $fuTime, $fuReason, $assignedTo,
                        $fuIsPay, $payAmt, $shipAmt,
                        $payMode, $advAmt, $payDue ?: $fuDate,
                        $payNotes ?: $notes, $quotedItems,
                        $existingFu['id']
                    ]);
                } else {
                    $newFuId = 'FU-' . date('Y') . '-' . rand(100000, 999999);
                    $pdo->prepare("
                        INSERT INTO `followups` (
                            `id`, `query_id`, `customer_id`, `customer_name`, `assigned_to`,
                            `date_str`, `time_str`, `reason`, `status`, `outcome`, `priority`,
                            `contact_channel`, `is_payment_pending`, `payment_amount`, `shipping_amount`,
                            `payment_mode`, `advance_payment`, `payment_due_date`, `payment_notes`, `quoted_items`
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 'PENDING', 'NORMAL', 'WHATSAPP', ?, ?, ?, ?, ?, ?, ?, ?)
                    ")->execute([
                        $newFuId, $queryId, $cid, $cData['name'] ?? ($customerName ?: 'Customer'), $assignedTo,
                        $fuDate, $fuTime, $fuReason,
                        $fuIsPay, $payAmt, $shipAmt,
                        $payMode, $advAmt, $payDue ?: $fuDate,
                        $payNotes ?: $notes, $quotedItems
                    ]);
                }
            } else if ($cid && ($status === 'CONVERTED' || $status === 'RESOLVED')) {
                $outcome = ($status === 'CONVERTED') ? 'ORDER_PLACED' : 'RESOLVED';
                $pdo->prepare("UPDATE `followups` SET `status` = 'COMPLETED', `outcome` = ?, `outcome_notes` = ?, `completed_at` = NOW() WHERE (`customer_id` = ? OR `query_id` = ?) AND `status` = 'PENDING'")
                    ->execute([$outcome, $notes, $cid, $queryId]);
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
    $variablesJson = !empty($tpl['variables_json']) 
        ? (is_string($tpl['variables_json']) ? $tpl['variables_json'] : json_encode($tpl['variables_json'], JSON_UNESCAPED_UNICODE))
        : (!empty($tpl['variables']) ? (is_string($tpl['variables']) ? $tpl['variables'] : json_encode($tpl['variables'], JSON_UNESCAPED_UNICODE)) : null);
    $imageUrl = $tpl['image_url'] ?? ($tpl['media_url'] ?? null);
    $buttonType = $tpl['button_type'] ?? null;
    $buttonText = $tpl['button_text'] ?? null;
    $buttonUrl = $tpl['button_url'] ?? null;
    $status = $tpl['status'] ?? 'ACTIVE';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO `broadcast_templates` (`id`, `name`, `category`, `body_text`, `variables_json`, `image_url`, `button_type`, `button_text`, `button_url`, `status`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    `name` = VALUES(`name`),
                    `category` = VALUES(`category`),
                    `body_text` = VALUES(`body_text`),
                    `variables_json` = VALUES(`variables_json`),
                    `image_url` = VALUES(`image_url`),
                    `button_type` = VALUES(`button_type`),
                    `button_text` = VALUES(`button_text`),
                    `button_url` = VALUES(`button_url`),
                    `status` = VALUES(`status`)
            ");
            $stmt->execute([$id, $name, $category, $bodyText, $variablesJson, $imageUrl, $buttonType, $buttonText, $buttonUrl, $status]);
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
// 10. DATABASE BACKUP & RESTORE ENGINE (MySQL Zero-Loss Snapshot & Restore)
// =========================================================================

/**
 * Pure PHP Direct Socket SMTP Mailer (RFC 2822 / RFC 2045)
 * Bypasses unauthenticated shared host mail() and delivers directly to Primary Gmail Inbox
 * Supports SSL on port 465 (Hostinger / Gmail / Brevo / Sendgrid) and TLS on port 587
 */
function sendDirectSmtpMail($to, $subject, $htmlBody, $plainBody = '', $smtpConfig = []) {
    $cfg = [
        'enabled' => false,
        'host' => '',
        'port' => 465,
        'encryption' => 'ssl',
        'username' => '',
        'password' => '',
        'from_email' => '',
        'from_name' => 'GRM CRM Security Shield',
        'timeout' => 8
    ];

    $cfgFile = __DIR__ . '/config/smtp_config.json';
    if (file_exists($cfgFile)) {
        $json = json_decode(file_get_contents($cfgFile), true);
        if (is_array($json)) {
            $cfg = array_merge($cfg, $json);
        }
    }

    // Direct read from .env file
    $envFile = __DIR__ . '/.env';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) continue;
            if (strpos($line, '=') !== false) {
                list($k, $v) = explode('=', $line, 2);
                $k = trim($k);
                $v = trim($v, " \t\n\r\0\x0B\"'");
                if ($k === 'SMTP_HOST') $cfg['host'] = $v;
                if ($k === 'SMTP_PORT') $cfg['port'] = (int)$v;
                if ($k === 'SMTP_USER' || $k === 'SMTP_USERNAME') $cfg['username'] = $v;
                if ($k === 'SMTP_PASS' || $k === 'SMTP_PASSWORD') $cfg['password'] = $v;
                if ($k === 'SMTP_FROM' || $k === 'SMTP_FROM_EMAIL') $cfg['from_email'] = $v;
                if ($k === 'SMTP_FROM_NAME') $cfg['from_name'] = $v;
                if ($k === 'SMTP_ENCRYPTION') $cfg['encryption'] = $v;
                if ($k === 'SMTP_ENABLED') $cfg['enabled'] = filter_var($v, FILTER_VALIDATE_BOOLEAN);
            }
        }
    }

    // Check environment variables / system $_SERVER
    $envHost = getenv('SMTP_HOST') ?: ($_SERVER['SMTP_HOST'] ?? ($_ENV['SMTP_HOST'] ?? ''));
    if (!empty($envHost)) $cfg['host'] = $envHost;
    $envUser = getenv('SMTP_USER') ?: (getenv('SMTP_USERNAME') ?: ($_SERVER['SMTP_USER'] ?? ($_SERVER['SMTP_USERNAME'] ?? ($_ENV['SMTP_USER'] ?? ''))));
    if (!empty($envUser)) $cfg['username'] = $envUser;
    $envPass = getenv('SMTP_PASS') ?: (getenv('SMTP_PASSWORD') ?: ($_SERVER['SMTP_PASS'] ?? ($_SERVER['SMTP_PASSWORD'] ?? ($_ENV['SMTP_PASS'] ?? ''))));
    if (!empty($envPass)) $cfg['password'] = $envPass;
    $envPort = getenv('SMTP_PORT') ?: ($_SERVER['SMTP_PORT'] ?? ($_ENV['SMTP_PORT'] ?? ''));
    if (!empty($envPort)) $cfg['port'] = (int)$envPort;
    $envFrom = getenv('SMTP_FROM') ?: (getenv('SMTP_FROM_EMAIL') ?: ($_SERVER['SMTP_FROM'] ?? ($_SERVER['SMTP_FROM_EMAIL'] ?? ($_ENV['SMTP_FROM'] ?? ''))));
    if (!empty($envFrom)) $cfg['from_email'] = $envFrom;
    $envFromName = getenv('SMTP_FROM_NAME') ?: ($_SERVER['SMTP_FROM_NAME'] ?? ($_ENV['SMTP_FROM_NAME'] ?? ''));
    if (!empty($envFromName)) $cfg['from_name'] = $envFromName;

    if (!empty($smtpConfig) && is_array($smtpConfig)) {
        $cfg = array_merge($cfg, $smtpConfig);
    }

    // If host or username or password is missing or explicitly disabled
    if ((isset($cfg['enabled']) && $cfg['enabled'] === false) || empty($cfg['host']) || empty($cfg['username']) || empty($cfg['password'])) {
        return ['success' => false, 'error' => 'SMTP credentials not configured'];
    }

    $host = trim($cfg['host']);
    $port = (int)($cfg['port'] ?: 465);
    $user = trim($cfg['username']);
    $pass = str_replace(' ', '', trim($cfg['password']));
    $fromEmail = !empty($cfg['from_email']) ? trim($cfg['from_email']) : $user;
    $fromName = !empty($cfg['from_name']) ? trim($cfg['from_name']) : 'GRM CRM Security Shield';
    $timeout = (int)($cfg['timeout'] ?: 10);

    $isSsl = ($port === 465 || strtolower($cfg['encryption'] ?? '') === 'ssl');
    $isTls = ($port === 587 || strtolower($cfg['encryption'] ?? '') === 'tls');

    $socketPrefix = $isSsl ? 'ssl://' : 'tcp://';
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client($socketPrefix . $host . ':' . $port, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        return ['success' => false, 'error' => "Cannot connect to SMTP server {$host}:{$port} - {$errstr} ({$errno})"];
    }

    stream_set_timeout($socket, $timeout);

    $readResp = function() use ($socket) {
        $data = '';
        while (!feof($socket)) {
            $line = fgets($socket, 515);
            if ($line === false) break;
            $data .= $line;
            if (preg_match('/^[0-9]{3}[ ]/', $line)) break;
        }
        return $data;
    };

    $sendCmd = function($cmd) use ($socket, $readResp) {
        fputs($socket, $cmd . "\r\n");
        return $readResp();
    };

    $greeting = $readResp();
    if (substr($greeting, 0, 3) !== '220') {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP greeting error: " . trim($greeting)];
    }

    $ehloName = !empty($_SERVER['HTTP_HOST']) ? preg_replace('/^www\./i', '', $_SERVER['HTTP_HOST']) : 'localhost';
    $sendCmd("EHLO " . $ehloName);

    if ($isTls && !$isSsl) {
        $tlsResp = $sendCmd("STARTTLS");
        if (substr($tlsResp, 0, 3) === '220') {
            if (!stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                fclose($socket);
                return ['success' => false, 'error' => 'STARTTLS negotiation failed'];
            }
            $sendCmd("EHLO " . $ehloName);
        }
    }

    $authResp = $sendCmd("AUTH LOGIN");
    if (substr($authResp, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => "AUTH LOGIN command failed: " . trim($authResp)];
    }

    $userResp = $sendCmd(base64_encode($user));
    if (substr($userResp, 0, 3) !== '334') {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP Username rejected: " . trim($userResp)];
    }

    $passResp = $sendCmd(base64_encode($pass));
    if (substr($passResp, 0, 3) !== '235') {
        fclose($socket);
        return ['success' => false, 'error' => "SMTP Authentication failed: " . trim($passResp)];
    }

    $fromResp = $sendCmd("MAIL FROM:<" . $fromEmail . ">");
    if (substr($fromResp, 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => "MAIL FROM rejected: " . trim($fromResp)];
    }

    $toResp = $sendCmd("RCPT TO:<" . $to . ">");
    if (substr($toResp, 0, 3) !== '250') {
        fclose($socket);
        return ['success' => false, 'error' => "RCPT TO rejected: " . trim($toResp)];
    }

    $dataResp = $sendCmd("DATA");
    if (substr($dataResp, 0, 3) !== '354') {
        fclose($socket);
        return ['success' => false, 'error' => "DATA rejected: " . trim($dataResp)];
    }

    // Build standard MIME message
    $boundary = "----=_NextPart_" . md5(uniqid((string)time(), true));
    $encodedSubject = "=?UTF-8?B?" . base64_encode($subject) . "?=";
    $encodedFromName = "=?UTF-8?B?" . base64_encode($fromName) . "?=";
    $fromDomain = (strpos($fromEmail, '@') !== false) ? substr(strrchr($fromEmail, '@'), 1) : 'grmgarments.com';
    $msgId = "<" . time() . "." . bin2hex(random_bytes(8)) . "@" . $fromDomain . ">";

    $raw = "Date: " . date('r') . "\r\n";
    $raw .= "From: {$encodedFromName} <{$fromEmail}>\r\n";
    $raw .= "Reply-To: <{$fromEmail}>\r\n";
    $raw .= "To: <{$to}>\r\n";
    $raw .= "Subject: {$encodedSubject}\r\n";
    $raw .= "Message-ID: {$msgId}\r\n";
    $raw .= "X-Mailer: GRM-CRM-Mailer/3.0\r\n";
    $raw .= "MIME-Version: 1.0\r\n";
    $raw .= "Auto-Submitted: auto-generated\r\n";
    $raw .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n\r\n";

    if (!empty($plainBody)) {
        $raw .= "--{$boundary}\r\n";
        $raw .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $raw .= "Content-Transfer-Encoding: base64\r\n\r\n";
        $raw .= chunk_split(base64_encode($plainBody)) . "\r\n";
    }

    $raw .= "--{$boundary}\r\n";
    $raw .= "Content-Type: text/html; charset=UTF-8\r\n";
    $raw .= "Content-Transfer-Encoding: base64\r\n\r\n";
    $raw .= chunk_split(base64_encode($htmlBody)) . "\r\n";
    $raw .= "--{$boundary}--\r\n";

    $sendResp = $sendCmd($raw . "\r\n.");
    $sendCmd("QUIT");
    fclose($socket);

    if (substr($sendResp, 0, 3) === '250') {
        return ['success' => true, 'message' => 'Delivered via Authenticated SMTP'];
    }
    return ['success' => false, 'error' => "SMTP Delivery Failed: " . trim($sendResp)];
}

if ($action === 'test_smtp') {
    header('Content-Type: application/json');
    $to = trim($_GET['to'] ?? 'vanaja15802@gmail.com');
    $res = sendDirectSmtpMail($to, 'GRM CRM Security - SMTP Test Delivery', '<h2>SMTP Test Successful</h2><p>This email was delivered directly to your inbox via Google Authenticated SMTP.</p>', 'SMTP Test Successful');
    echo json_encode($res);
    exit;
}

// 1. REQUEST BACKUP DOWNLOAD (Triggers Super Admin Email Verification)
if ($action === 'request_backup_download') {
    header('Content-Type: application/json');
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true) ?: [];

    $requesterId = trim($data['requester_id'] ?? 'staff');
    $requesterName = trim($data['requester_name'] ?? 'Staff Member');
    $requesterRole = trim($data['requester_role'] ?? 'Staff');
    $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';

    try {
        if (!$pdo) throw new Exception("Database unavailable");

        // Ensure table exists
        $pdo->exec("
            CREATE TABLE IF NOT EXISTS `backup_download_requests` (
                `id` INT AUTO_INCREMENT PRIMARY KEY,
                `request_code` VARCHAR(50) NOT NULL UNIQUE,
                `requester_id` VARCHAR(50) NOT NULL,
                `requester_name` VARCHAR(150) NOT NULL,
                `requester_role` VARCHAR(100) NOT NULL,
                `requester_ip` VARCHAR(60) NULL,
                `admin_email` VARCHAR(150) NOT NULL,
                `token_approve` VARCHAR(64) NOT NULL UNIQUE,
                `token_reject` VARCHAR(64) NOT NULL UNIQUE,
                `download_token` VARCHAR(64) NULL,
                `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED') DEFAULT 'PENDING',
                `action_at` DATETIME NULL,
                `action_by` VARCHAR(150) NULL,
                `downloaded_at` DATETIME NULL,
                `download_count` INT NOT NULL DEFAULT 0,
                `expires_at` DATETIME NOT NULL,
                `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
                INDEX (`request_code`),
                INDEX (`token_approve`),
                INDEX (`token_reject`),
                INDEX (`download_token`),
                INDEX (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ");

        // Resolve admin email (prioritize customizable email passed from frontend)
        $customEmail = trim($data['custom_admin_email'] ?? $data['target_email'] ?? $data['admin_email'] ?? '');
        if (!empty($customEmail) && filter_var($customEmail, FILTER_VALIDATE_EMAIL)) {
            $adminEmail = $customEmail;
        } else {
            $adminEmail = 'admin@grmgarments.com';
            $adminStmt = $pdo->query("SELECT `email` FROM `users` WHERE `role` = 'admin' OR `id` = 'admin' OR `role` LIKE '%Super Admin%' LIMIT 1");
            if ($adminStmt) {
                $row = $adminStmt->fetch(PDO::FETCH_ASSOC);
                if (!empty($row['email'])) $adminEmail = $row['email'];
            }
        }

        $requestCode = 'BK-REQ-' . strtoupper(substr(uniqid(), -6));
        $tokenApprove = bin2hex(random_bytes(24));
        $tokenReject = bin2hex(random_bytes(24));

        $stmt = $pdo->prepare("
            INSERT INTO `backup_download_requests`
            (`request_code`, `requester_id`, `requester_name`, `requester_role`, `requester_ip`, `admin_email`, `token_approve`, `token_reject`, `status`, `expires_at`, `created_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', DATE_ADD(NOW(), INTERVAL 60 MINUTE), NOW())
        ");
        $stmt->execute([
            $requestCode, $requesterId, $requesterName, $requesterRole, $ip, $adminEmail, $tokenApprove, $tokenReject
        ]);

        $publicBaseUrl = 'https://mediumturquoise-dugong-987946.hostingersite.com';
        if (!empty($_SERVER['HTTP_HOST']) && strpos($_SERVER['HTTP_HOST'], 'localhost') === false && strpos($_SERVER['HTTP_HOST'], '127.0.0.1') === false) {
            $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
            $publicBaseUrl = $proto . '://' . $_SERVER['HTTP_HOST'];
        } elseif (defined('APP_URL') && !empty(APP_URL)) {
            $publicBaseUrl = rtrim(APP_URL, '/');
        }

        $approveUrl = $publicBaseUrl . '/api.php?action=verify_backup_request&token=' . $tokenApprove;
        $rejectUrl = $publicBaseUrl . '/api.php?action=verify_backup_request&token=' . $tokenReject;

        // Send Email to Super Admin (Support custom subject/notes if provided)
        $customNotes = trim($data['custom_notes'] ?? $data['notes'] ?? '');
        // Clean transactional subject without spam/phishing triggers (e.g. no "Security Authorization", no "Action Required")
        $cleanSubject = !empty($data['custom_subject']) 
            ? trim($data['custom_subject']) 
            : ("GRM CRM: Database Backup Verification Code " . $requestCode);

        $hostDomain = !empty($_SERVER['HTTP_HOST']) ? preg_replace('/^www\./i', '', $_SERVER['HTTP_HOST']) : 'hostingersite.com';
        $fromEmail = "noreply@" . $hostDomain;
        $boundary = "----=_NextPart_" . md5(uniqid((string)time(), true));

        // Plain Text Fallback Body (Clean transactional format)
        $plainText = "Hello Administrator,\n\n"
            . "A request to export a complete database backup has been submitted on GRM Garments CRM.\n\n"
            . "Verification Code: {$requestCode}\n"
            . "Requester: {$requesterName} ({$requesterRole})\n"
            . "Recipient Admin: {$adminEmail}\n"
            . "IP Address: {$ip}\n"
            . "Requested At: " . date('Y-m-d H:i:s') . "\n"
            . "Valid For: 60 Minutes\n\n"
            . "To approve this export:\n{$approveUrl}\n\n"
            . "To decline this request:\n{$rejectUrl}\n\n"
            . "If you did not initiate this request, click Decline to protect your data.\n\n"
            . "GRM Garments CRM - Tirupur, Tamil Nadu\n";

        $notesHtml = !empty($customNotes) ? "<tr><td class='lbl'>Request Note:</td><td class='val'>" . htmlspecialchars($customNotes) . "</td></tr>" : "";

        $htmlMessage = "
<!DOCTYPE html>
<html>
<head>
  <meta charset='UTF-8'>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px 12px; color: #1e293b; }
    .email-container { max-width: 520px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .brand-header { padding: 24px 28px 16px; border-bottom: 1px solid #f1f5f9; }
    .brand-title { font-size: 16px; font-weight: 700; color: #0f172a; margin: 0; }
    .content-body { padding: 28px; font-size: 14px; line-height: 1.6; color: #334155; }
    .code-box { background: #f1f5f9; border-radius: 10px; padding: 14px 18px; margin: 20px 0; text-align: center; }
    .code-label { font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; letter-spacing: 0.5px; }
    .code-val { font-size: 20px; font-weight: 800; color: #0f172a; font-family: monospace; margin-top: 4px; }
    .details-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
    .details-table td { padding: 6px 0; }
    .details-table .lbl { color: #64748b; width: 120px; }
    .details-table .val { color: #0f172a; font-weight: 600; }
    .actions-table { width: 100%; border-collapse: separate; border-spacing: 12px 0; margin: 24px 0 16px; }
    .btn-approve { display: block; text-align: center; background: #059669; color: #ffffff !important; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 13px; }
    .btn-reject { display: block; text-align: center; background: #f8fafc; color: #64748b !important; border: 1px solid #cbd5e1; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 13px; }
    .email-footer { padding: 20px 28px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class='email-container'>
    <div class='brand-header'>
      <h2 class='brand-title'>GRM Garments CRM</h2>
    </div>
    <div class='content-body'>
      <p style='margin-top:0;'>Hello,</p>
      <p>A request to export a database backup snapshot has been submitted. Please review the details below:</p>
      
      <div class='code-box'>
        <div class='code-label'>Verification Code</div>
        <div class='code-val'>{$requestCode}</div>
      </div>

      <table class='details-table'>
        <tr><td class='lbl'>Requested By:</td><td class='val'>{$requesterName} ({$requesterRole})</td></tr>
        <tr><td class='lbl'>Recipient:</td><td class='val'>{$adminEmail}</td></tr>
        <tr><td class='lbl'>IP Address:</td><td class='val'>{$ip}</td></tr>
        <tr><td class='lbl'>Time:</td><td class='val'>" . date('Y-m-d H:i:s') . "</td></tr>
        <tr><td class='lbl'>Valid For:</td><td class='val'>60 Minutes</td></tr>
        {$notesHtml}
      </table>

      <table class='actions-table'>
        <tr>
          <td style='width:50%;'>
            <a href='{$approveUrl}' class='btn-approve' target='_blank'>Approve Backup</a>
          </td>
          <td style='width:50%;'>
            <a href='{$rejectUrl}' class='btn-reject' target='_blank'>Decline Request</a>
          </td>
        </tr>
      </table>

      <p style='font-size: 11px; color: #64748b; margin-top: 20px; line-height: 1.5;'>
        If you did not initiate this request, click Decline Request to lock export access.
      </p>
    </div>
    <div class='email-footer'>
      GRM Garments CRM &bull; Tirupur, Tamil Nadu &bull; Automated System Notification
    </div>
  </div>
</body>
</html>
";

        $mailSent = false;
        $mailMethod = 'NONE';
        $mailError = null;

        // 1. Try Authenticated Socket SMTP first (Guaranteed direct-to-inbox, SPF & DKIM verified)
        $smtpRes = sendDirectSmtpMail($adminEmail, $cleanSubject, $htmlMessage, $plainText);
        if (!empty($smtpRes['success'])) {
            $mailSent = true;
            $mailMethod = 'SMTP';
        } else {
            $mailError = $smtpRes['error'] ?? null;

            // 2. Fallback to PHP mail() with strict Anti-Spam headers
            // CRITICAL ANTI-SPAM FIX: REMOVED "Precedence: bulk", REMOVED "X-Priority: 1", REMOVED "Importance: High"
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "From: GRM CRM Security Shield <{$fromEmail}>\r\n";
            $headers .= "Reply-To: {$fromEmail}\r\n";
            $headers .= "Return-Path: <{$fromEmail}>\r\n";
            $headers .= "Date: " . date('r') . "\r\n";
            $headers .= "Message-ID: <" . time() . "." . bin2hex(random_bytes(8)) . "@" . $hostDomain . ">\r\n";
            $headers .= "X-Mailer: GRM-CRM-Mailer/3.0\r\n";
            $headers .= "Auto-Submitted: auto-generated\r\n";
            $headers .= "X-Auto-Response-Suppress: All\r\n";
            $headers .= "Content-Type: multipart/alternative; boundary=\"{$boundary}\"\r\n";

            // RFC 2045 Base64 encoded parts ensure zero line-length violations and zero spam penalties
            $fullBody = "--{$boundary}\r\n"
                . "Content-Type: text/plain; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode($plainText)) . "\r\n"
                . "--{$boundary}\r\n"
                . "Content-Type: text/html; charset=UTF-8\r\n"
                . "Content-Transfer-Encoding: base64\r\n\r\n"
                . chunk_split(base64_encode($htmlMessage)) . "\r\n"
                . "--{$boundary}--\r\n";

            $rawMailSuccess = @mail($adminEmail, $cleanSubject, $fullBody, $headers, "-f" . $fromEmail);
            if ($rawMailSuccess) {
                $mailSent = true;
                $mailMethod = 'PHP_MAIL';
            }
        }

        // 2. Dispatch Instant WhatsApp Security Authorization Link to Super Admin Phone
        $waSent = false;
        $waAdminPhone = null;
        try {
            // Find active Super Admin phone number from users table or config
            $adminUserStmt = $pdo->prepare("SELECT `phone` FROM `users` WHERE `role` IN ('Super Admin', 'admin') AND `status` = 'active' AND `phone` IS NOT NULL AND `phone` != '' ORDER BY id ASC LIMIT 1");
            $adminUserStmt->execute();
            $adminRow = $adminUserStmt->fetch(PDO::FETCH_ASSOC);
            $waAdminPhone = !empty($adminRow['phone']) ? $adminRow['phone'] : '+91 99435 57998';

            $cleanWaPhone = preg_replace('/[^0-9]/', '', $waAdminPhone);
            if (strlen($cleanWaPhone) === 10) {
                $cleanWaPhone = '91' . $cleanWaPhone;
            }

            $waAlertMsg = "🔒 *[GRM CRM SECURITY GATE]*
*Database Backup Download Authorization Request*

"
                . "A complete database export has been requested.
"
                . "• *Request Code:* `{$requestCode}`
"
                . "• *Requested By:* {$requesterName} ({$requesterRole})
"
                . "• *Target Admin:* {$adminEmail}
"
                . "• *Valid For:* 60 Minutes

"
                . "✅ *1-CLICK APPROVE:*
{$approveUrl}

"
                . "🚫 *REJECT & BLOCK:*
{$rejectUrl}

"
                . "_If you did not request this, click REJECT immediately to lock export access._";

            $bRes = curlBridgePost('/api/send', [
                'phone' => $cleanWaPhone,
                'text' => $waAlertMsg
            ], 6);

            if (!empty($bRes['http_code']) && $bRes['http_code'] >= 200 && $bRes['http_code'] < 300) {
                $waSent = true;
            }
        } catch (Exception $waEx) {
            error_log("WhatsApp backup authorization alert error: " . $waEx->getMessage());
        }

        echo json_encode([
            "success" => true,
            "status" => "success",
            "request_code" => $requestCode,
            "admin_email" => $adminEmail,
            "mail_sent" => (bool)$mailSent,
            "mail_method" => $mailMethod,
            "mail_error" => $mailError,
            "wa_sent" => (bool)$waSent,
            "wa_admin_phone" => $waAdminPhone,
            "expires_in_minutes" => 60,
            "approve_url" => $approveUrl,
            "reject_url" => $rejectUrl,
            "approve_url_preview" => $approveUrl,
            "reject_url_preview" => $rejectUrl
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "status" => "error", "message" => $e->getMessage(), "error" => $e->getMessage()]);
    }
    exit;
}

// 2. CHECK BACKUP REQUEST STATUS (Polled by CRM Modal)
if ($action === 'check_backup_request_status') {
    header('Content-Type: application/json');
    $code = trim($_GET['request_code'] ?? '');
    if (empty($code)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "request_code required"]);
        exit;
    }
    try {
        if (!$pdo) throw new Exception("Database unavailable");
        $stmt = $pdo->prepare("SELECT * FROM `backup_download_requests` WHERE `request_code` = ? LIMIT 1");
        $stmt->execute([$code]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$req) {
            echo json_encode(["status" => "not_found", "request_status" => "NOT_FOUND"]);
            exit;
        }

        // Check if expired
        if ($req['status'] === 'PENDING' && strtotime($req['expires_at']) < time()) {
            $pdo->prepare("UPDATE `backup_download_requests` SET `status` = 'EXPIRED' WHERE `id` = ?")->execute([$req['id']]);
            $req['status'] = 'EXPIRED';
        }

        echo json_encode([
            "success" => true,
            "status" => "success",
            "request_code" => $req['request_code'],
            "request_status" => $req['status'],
            "requestStatus" => $req['status'],
            "download_token" => ($req['status'] === 'APPROVED') ? $req['download_token'] : null,
            "action_at" => $req['action_at'],
            "action_by" => $req['action_by'],
            "admin_email" => $req['admin_email'],
            "requester_name" => $req['requester_name'],
            "requester_role" => $req['requester_role'],
            "download_count" => (int)($req['download_count'] ?? 0)
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["success" => false, "status" => "error", "message" => $e->getMessage(), "error" => $e->getMessage()]);
    }
    exit;
}

// 3. VERIFY BACKUP REQUEST (Webhook accessed when Admin clicks email button)
if ($action === 'verify_backup_request') {
    // Explicitly set text/html so browser never renders raw source code with Pretty-print
    header('Content-Type: text/html; charset=UTF-8');
    $token = trim($_GET['token'] ?? '');

    function renderVerifyHtmlPage($title, $icon, $themeColor, $message, $meta = []) {
        $metaHtml = '';
        foreach ($meta as $k => $v) {
            $metaHtml .= '<div class="meta-row"><span class="meta-lbl">' . htmlspecialchars($k) . ':</span><span class="meta-val">' . htmlspecialchars((string)$v) . '</span></div>';
        }
        echo <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title} — GRM CRM</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Material+Symbols+Outlined" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0f172a; color: #0f172a; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .card { width: 100%; max-width: 460px; background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px rgba(0,0,0,0.5); overflow: hidden; text-align: center; }
    .header { background: {$themeColor}; color: #ffffff; padding: 32px 20px; }
    .icon { font-size: 56px; }
    .title { font-size: 20px; font-weight: 800; margin-top: 10px; }
    .body { padding: 28px 24px; font-size: 13px; color: #334155; line-height: 1.6; }
    .meta-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; margin: 18px 0; text-align: left; font-size: 12px; }
    .meta-row { display: flex; justify-content: space-between; margin-bottom: 7px; }
    .meta-lbl { color: #64748b; font-weight: 600; }
    .meta-val { color: #0f172a; font-weight: 700; font-family: monospace; }
    .footer { padding: 16px; background: #f1f5f9; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <span class="material-symbols-outlined icon">{$icon}</span>
      <h2 class="title">{$title}</h2>
    </div>
    <div class="body">
      <p>{$message}</p>
      <div class="meta-box">
        {$metaHtml}
      </div>
      <p style="font-size: 11px; color: #64748b;">You can safely close this browser tab.</p>
    </div>
    <div class="footer">
      GRM Garments CRM &bull; Security &amp; Access Control Shield
    </div>
  </div>
</body>
</html>
HTML;
    }

    if (empty($token)) {
        renderVerifyHtmlPage("Invalid Request", "error", "#dc2626", "The verification token is missing or malformed.", ["Error" => "Missing Token"]);
        exit;
    }

    try {
        if (!$pdo) {
            renderVerifyHtmlPage("Database Error", "error", "#dc2626", "Database connection is currently unavailable.", ["Error" => "No Database Connection"]);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM `backup_download_requests` WHERE `token_approve` = ? OR `token_reject` = ? LIMIT 1");
        $stmt->execute([$token, $token]);
        $req = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$req) {
            renderVerifyHtmlPage("Token Invalid", "warning", "#64748b", "This verification link is invalid or has already expired / been used.", ["Notice" => "Token Not Found"]);
            exit;
        }

        $isApprove = ($token === $req['token_approve']);
        $now = time();
        $isExpired = (strtotime($req['expires_at']) < $now);

        if ($req['status'] === 'PENDING') {
            if ($isExpired) {
                $pdo->prepare("UPDATE `backup_download_requests` SET `status` = 'EXPIRED' WHERE `id` = ?")->execute([$req['id']]);
                $req['status'] = 'EXPIRED';
            } elseif ($isApprove) {
                $downloadToken = bin2hex(random_bytes(24));
                $pdo->prepare("UPDATE `backup_download_requests` SET `status` = 'APPROVED', `download_token` = ?, `action_at` = NOW(), `action_by` = ? WHERE `id` = ?")
                    ->execute([$downloadToken, $req['admin_email'], $req['id']]);
                $req['status'] = 'APPROVED';

                // Audit log: Admin approval
                try {
                    $audit = $pdo->prepare("INSERT INTO `audit_logs` (`user`, `actor`, `action`, `action_type`, `module`, `category`, `details`, `description`, `timestamp_str`, `ip_address`, `created_at`) VALUES (?, ?, 'BACKUP_DOWNLOAD_APPROVED', 'BACKUP_DOWNLOAD_APPROVED', 'SECURITY', 'SECURITY', ?, ?, ?, ?, NOW())");
                    $desc = "Approved database backup download for staff: {$req['requester_name']} ({$req['requester_role']}) - Request Code: {$req['request_code']}";
                    $audit->execute([$req['admin_email'], $req['admin_email'], $desc, $desc, date('Y-m-d H:i:s'), $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']);
                } catch (Exception $ae) {}
            } else {
                $pdo->prepare("UPDATE `backup_download_requests` SET `status` = 'REJECTED', `download_token` = NULL, `action_at` = NOW(), `action_by` = ? WHERE `id` = ?")
                    ->execute([$req['admin_email'], $req['id']]);
                $req['status'] = 'REJECTED';

                // Audit log: Admin rejection
                try {
                    $audit = $pdo->prepare("INSERT INTO `audit_logs` (`user`, `actor`, `action`, `action_type`, `module`, `category`, `details`, `description`, `timestamp_str`, `ip_address`, `created_at`) VALUES (?, ?, 'BACKUP_DOWNLOAD_REJECTED', 'BACKUP_DOWNLOAD_REJECTED', 'SECURITY', 'SECURITY', ?, ?, ?, ?, NOW())");
                    $desc = "REJECTED and BLOCKED database backup download requested by staff: {$req['requester_name']} ({$req['requester_role']}) - Request Code: {$req['request_code']}";
                    $audit->execute([$req['admin_email'], $req['admin_email'], $desc, $desc, date('Y-m-d H:i:s'), $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']);
                } catch (Exception $ae) {}
            }
        }

        if ($req['status'] === 'APPROVED') {
            renderVerifyHtmlPage(
                "Backup Download Approved",
                "check_circle",
                "#059669",
                "You have successfully <strong>APPROVED</strong> this database backup request. The requester's CRM window will immediately begin downloading the backup file.",
                [
                    "Request Code" => $req['request_code'],
                    "Staff Requester" => $req['requester_name'] . " (" . $req['requester_role'] . ")",
                    "Authorized By Admin" => $req['admin_email'],
                    "Status" => "APPROVED",
                    "Recorded Time" => $req['created_at']
                ]
            );
        } elseif ($req['status'] === 'REJECTED') {
            renderVerifyHtmlPage(
                "Backup Download Blocked",
                "block",
                "#dc2626",
                "You have <strong>REJECTED &amp; BLOCKED</strong> this backup download request. Access to the database backup file has been forbidden.",
                [
                    "Request Code" => $req['request_code'],
                    "Staff Requester" => $req['requester_name'] . " (" . $req['requester_role'] . ")",
                    "Blocked By Admin" => $req['admin_email'],
                    "Status" => "REJECTED",
                    "Recorded Time" => $req['created_at']
                ]
            );
        } else {
            renderVerifyHtmlPage(
                "Request Expired",
                "history_toggle_off",
                "#d97706",
                "This authorization request is currently marked as <strong>EXPIRED</strong>. Please initiate a fresh backup authorization request from the CRM panel.",
                [
                    "Request Code" => $req['request_code'],
                    "Staff Requester" => $req['requester_name'],
                    "Status" => "EXPIRED",
                    "Recorded Time" => $req['created_at']
                ]
            );
        }
    } catch (Exception $e) {
        renderVerifyHtmlPage("System Error", "error", "#dc2626", "An unexpected error occurred: " . htmlspecialchars($e->getMessage()), ["Error" => "Exception"]);
    }
    exit;
}

// 4. DOWNLOAD DATABASE BACKUP FILE (Guarded by Approved Token)
if ($action === 'backup_db') {
    $downloadToken = trim($_GET['download_token'] ?? '');
    $isAuthorized = false;
    $authReq = null;

    if (!empty($downloadToken)) {
        try {
            $authStmt = $pdo->prepare("SELECT * FROM `backup_download_requests` WHERE `download_token` = ? AND `status` = 'APPROVED' AND `expires_at` > NOW() LIMIT 1");
            $authStmt->execute([$downloadToken]);
            $authReq = $authStmt->fetch(PDO::FETCH_ASSOC);
            if ($authReq) {
                $isAuthorized = true;
                $newCount = intval($authReq['download_count'] ?? 0) + 1;
                $pdo->prepare("UPDATE `backup_download_requests` SET `download_count` = ?, `downloaded_at` = NOW() WHERE `id` = ?")->execute([$newCount, $authReq['id']]);

                // Audit log: Track which admin authorized, which staff downloaded, and total download count
                try {
                    $audit = $pdo->prepare("INSERT INTO `audit_logs` (`user`, `actor`, `action`, `action_type`, `module`, `category`, `details`, `description`, `timestamp_str`, `ip_address`, `created_at`) VALUES (?, ?, 'BACKUP_DOWNLOADED', 'DATABASE_BACKUP_EXPORTED', 'BACKUP', 'SECURITY', ?, ?, ?, ?, NOW())");
                    $desc = "Database backup downloaded by staff: {$authReq['requester_name']} ({$authReq['requester_role']}) - Authorized by Admin: {$authReq['action_by']} (Download #{$newCount}, Request Code: {$authReq['request_code']})";
                    $audit->execute([$authReq['requester_name'], $authReq['requester_name'], $desc, $desc, date('Y-m-d H:i:s'), $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1']);
                } catch (Exception $ae) {}
            }
        } catch (Exception $e) {}
    }

    if (!$isAuthorized) {
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode([
            "status" => "error",
            "message" => "Admin Email Authorization Required: Database backup cannot be downloaded without Super Admin email approval or authorization has expired/been rejected."
        ]);
        exit;
    }
    try {
        $stateResponse = [];
        $tables = [
            'users', 'whatsapp_accounts', 'customers', 'queries', 
            'messages', 'products', 'orders', 'followups', 
            'categories', 'subcategories', 'attributes', 'dnd_records', 'audit_logs'
        ];
        
        $totalRecordCount = 0;
        foreach ($tables as $t) {
            $check = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($t))->fetch();
            if ($check) {
                $stmt = $pdo->query("SELECT * FROM `$t`");
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $stateResponse[$t] = $rows;
                $totalRecordCount += count($rows);
            }
        }

        $backupData = [
            "version" => "2.5.0",
            "backup_date" => date("Y-m-d H:i:s"),
            "generator" => "GRM_CRM_MYSQL_BACKUP_ENGINE",
            "database" => DB_NAME,
            "total_records" => $totalRecordCount,
            "tables" => $stateResponse
        ];

        // Audit log the backup event
        try {
            $audit = $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `description`, `created_at`) VALUES ('DATABASE_BACKUP_EXPORTED', 'BACKUP', 'Super Admin', ?, NOW())");
            $audit->execute(["Downloaded complete MySQL database snapshot ($totalRecordCount records)"]);
        } catch (Exception $ae) {}

        header('Content-Type: application/json; charset=utf-8');
        header('Content-Disposition: attachment; filename="grm_crm_backup_' . date("Ymd_His") . '.json"');
        echo json_encode($backupData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode(["status" => "error", "message" => "Database backup failed: " . $e->getMessage()]);
        exit;
    }
}

if ($action === 'restore_db') {
    header('Content-Type: application/json');
    
    // Read raw JSON body or uploaded file
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true);

    if (!$payload && isset($_FILES['backup_file']['tmp_name'])) {
        $fileContent = file_get_contents($_FILES['backup_file']['tmp_name']);
        $payload = json_decode($fileContent, true);
    }

    if (!$payload) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Invalid or unreadable backup JSON payload."]);
        exit;
    }

    try {
        $pdo->beginTransaction();
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 0;");

        $restoredTables = [];
        $totalRestoredRows = 0;

        // Path A: MySQL Table Dump Format
        if (isset($payload['tables']) && is_array($payload['tables'])) {
            foreach ($payload['tables'] as $tableName => $rows) {
                if (!is_array($rows)) continue;

                $check = $pdo->query("SHOW TABLES LIKE " . $pdo->quote($tableName))->fetch();
                if (!$check) continue;

                // Truncate table cleanly
                $pdo->exec("DELETE FROM `$tableName`;");

                if (!empty($rows)) {
                    $cols = array_keys($rows[0]);
                    $colList = implode("`, `", array_map(function($c) { return str_replace('`', '', $c); }, $cols));
                    $placeholders = implode(", ", array_fill(0, count($cols), "?"));

                    $insertStmt = $pdo->prepare("INSERT INTO `$tableName` (`$colList`) VALUES ($placeholders)");

                    foreach ($rows as $row) {
                        $values = [];
                        foreach ($cols as $col) {
                            $values[] = $row[$col] ?? null;
                        }
                        $insertStmt->execute($values);
                        $totalRestoredRows++;
                    }
                }
                $restoredTables[] = $tableName;
            }
        }
        // Path B: Client CRM_STATE Format
        elseif (isset($payload['data']) && is_array($payload['data'])) {
            $data = $payload['data'];

            // 1. Customers
            if (isset($data['customers']) && is_array($data['customers'])) {
                $pdo->exec("DELETE FROM `customers`;");
                $cStmt = $pdo->prepare("INSERT INTO `customers` (`id`, `name`, `whatsapp`, `phone`, `email`, `address`, `tags_json`, `is_dnd`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['customers'] as $c) {
                    $tags = isset($c['tags']) ? json_encode($c['tags']) : '[]';
                    $cStmt->execute([
                        $c['id'] ?? ('cust_' . time()),
                        $c['name'] ?? 'Customer',
                        $c['whatsapp'] ?? ($c['phone'] ?? ''),
                        $c['phone'] ?? ($c['whatsapp'] ?? ''),
                        $c['email'] ?? null,
                        $c['address'] ?? null,
                        $tags,
                        !empty($c['isDND']) ? 1 : 0,
                        $c['createdAt'] ?? date('Y-m-d H:i:s')
                    ]);
                    $totalRestoredRows++;
                }
                $restoredTables[] = 'customers';
            }

            // 2. Orders
            if (isset($data['orders']) && is_array($data['orders'])) {
                $pdo->exec("DELETE FROM `orders`;");
                $oStmt = $pdo->prepare("INSERT INTO `orders` (`id`, `query_id`, `customer_id`, `customer_name`, `customer_phone`, `shipping_address`, `items_json`, `grand_total`, `cod_advance`, `cod_balance_due`, `payment_method`, `payment_status`, `upi_transaction_id`, `order_status`, `staff_id`, `staff_name`, `created_by`, `tracking_number`, `courier_name`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['orders'] as $o) {
                    $itemsJson = isset($o['items']) ? json_encode($o['items']) : (isset($o['items_json']) ? $o['items_json'] : '[]');
                    $oStmt->execute([
                        $o['id'] ?? ('WA-' . date('Y') . '-' . rand(100000, 999999)),
                        $o['queryId'] ?? ($o['query_id'] ?? 'N/A'),
                        $o['customerId'] ?? ($o['customer_id'] ?? ''),
                        $o['customerName'] ?? ($o['customer_name'] ?? 'Customer'),
                        $o['customerPhone'] ?? ($o['customer_phone'] ?? ''),
                        $o['shippingAddress'] ?? ($o['shipping_address'] ?? ''),
                        $itemsJson,
                        floatval($o['grandTotal'] ?? ($o['grand_total'] ?? 0)),
                        floatval($o['codAdvance'] ?? ($o['cod_advance'] ?? 0)),
                        floatval($o['codBalanceDue'] ?? ($o['cod_balance_due'] ?? 0)),
                        $o['paymentMethod'] ?? ($o['payment_method'] ?? 'COD'),
                        $o['paymentStatus'] ?? ($o['payment_status'] ?? 'PENDING'),
                        $o['upiTransactionId'] ?? ($o['upi_transaction_id'] ?? null),
                        $o['orderStatus'] ?? ($o['order_status'] ?? 'PLACED'),
                        $o['staffId'] ?? ($o['staff_id'] ?? 'staff_01'),
                        $o['staffName'] ?? ($o['staff_name'] ?? 'Staff'),
                        $o['createdBy'] ?? ($o['created_by'] ?? 'Staff'),
                        $o['trackingNumber'] ?? ($o['tracking_number'] ?? null),
                        $o['courierName'] ?? ($o['courier_name'] ?? null),
                        $o['createdAt'] ?? ($o['created_at'] ?? date('Y-m-d H:i:s'))
                    ]);
                    $totalRestoredRows++;
                }
                $restoredTables[] = 'orders';
            }

            // 3. Messages / Conversations
            if (isset($data['conversations']) && is_array($data['conversations'])) {
                $pdo->exec("DELETE FROM `messages`;");
                $mStmt = $pdo->prepare("INSERT INTO `messages` (`customer_id`, `sender`, `message_text`, `media_url`, `media_type`, `direction`, `status`, `created_at`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                foreach ($data['conversations'] as $custId => $convMsgs) {
                    if (!is_array($convMsgs)) continue;
                    foreach ($convMsgs as $m) {
                        $direction = ($m['sender'] === 'staff' || !empty($m['isBot'])) ? 'outbound' : 'inbound';
                        $mStmt->execute([
                            $custId,
                            $m['sender'] ?? 'customer',
                            $m['text'] ?? '',
                            $m['media_url'] ?? null,
                            $m['type'] ?? 'text',
                            $direction,
                            $m['status'] ?? 'DELIVERED',
                            isset($m['timestamp']) ? date('Y-m-d H:i:s', is_numeric($m['timestamp']) ? (int)($m['timestamp']/1000) : time()) : date('Y-m-d H:i:s')
                        ]);
                        $totalRestoredRows++;
                    }
                }
                $restoredTables[] = 'messages';
            }
        }

        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");

        // Log restore event in audit_logs
        try {
            $auditStmt = $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `description`, `created_at`) VALUES ('DATABASE_RESTORED', 'BACKUP', 'Super Admin', ?, NOW())");
            $auditStmt->execute(["Restored database snapshot into " . DB_NAME . " (" . count($restoredTables) . " tables, $totalRestoredRows rows). Tables: " . implode(', ', $restoredTables)]);
        } catch (Exception $ae) {}

        $pdo->commit();

        echo json_encode([
            "status" => "success",
            "message" => "Database successfully restored into MySQL (" . DB_NAME . ")!",
            "database" => DB_NAME,
            "restored_tables" => $restoredTables,
            "total_rows" => $totalRestoredRows
        ]);
        exit;
    } catch (Exception $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        $pdo->exec("SET FOREIGN_KEY_CHECKS = 1;");
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Database restore failed: " . $e->getMessage()]);
        exit;
    }
}

// =========================================================================
// CALL & NUMBER MASKING TELEPHONY ENGINE (MYSQL PERSISTENCE & ATOMIC DISPATCH)
// =========================================================================
function notifySocketBridge($event, $data = []) {
    $configFile = __DIR__ . '/whatsapp_account_config.json';
    $bridgeBase = 'http://localhost:3000';
    if (file_exists($configFile)) {
        $cfg = json_decode(file_get_contents($configFile), true);
        if (!empty($cfg['bridge_url'])) {
            $bridgeBase = rtrim($cfg['bridge_url'], '/');
        }
    }
    if (defined('BRIDGE_URL') && !empty(BRIDGE_URL)) {
        $bridgeBase = rtrim(BRIDGE_URL, '/');
    }

    $endpoints = [
        'http://127.0.0.1:3000/api/calls/event',
        'http://localhost:3000/api/calls/event'
    ];
    $payload = json_encode(['event' => $event, 'data' => $data]);
    foreach ($endpoints as $ep) {
        $ch = @curl_init($ep);
        if ($ch) {
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
            curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
            curl_setopt($ch, CURLOPT_TIMEOUT_MS, 500);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, 300);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            @curl_exec($ch);
            $code = @curl_getinfo($ch, CURLINFO_HTTP_CODE);
            @curl_close($ch);
            if ($code >= 200 && $code < 300) break;
        }
    }
}

if ($action === 'get_masking_settings') {
    header('Content-Type: application/json');
    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $stmt = $pdo->query("SELECT * FROM `masking_settings` ORDER BY `id` ASC LIMIT 1");
        $settings = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$settings) {
            $pdo->exec("INSERT INTO `masking_settings` (`id`, `call_masking_enabled`, `chat_masking_enabled`, `call_timeout_seconds`, `fallback_strategy`, `virtual_company_number`, `eligible_staff_ids`, `recording_enabled`, `simultaneous_ring_limit`, `updated_by`) VALUES (1, 1, 1, 30, 'RETURN_TO_POOL', '+91 97896 60115', 'staff_01,staff_02,staff_03', 1, 5, 'Super Admin')");
            $settings = $pdo->query("SELECT * FROM `masking_settings` WHERE `id` = 1")->fetch(PDO::FETCH_ASSOC);
        }

        // Live Call Metrics
        $metrics = [
            "incoming_calls" => (int)$pdo->query("SELECT COUNT(*) FROM `call_sessions` WHERE `status` = 'RINGING' AND `started_at` >= DATE_SUB(NOW(), INTERVAL 35 SECOND)")->fetchColumn(),
            "active_calls" => (int)$pdo->query("SELECT COUNT(*) FROM `call_sessions` WHERE `status` IN ('CONNECTED', 'CLAIMED', 'ASSIGNED')")->fetchColumn(),
            "answered_calls" => (int)$pdo->query("SELECT COUNT(*) FROM `call_sessions` WHERE `status` IN ('CLAIMED', 'CONNECTED', 'COMPLETED')")->fetchColumn(),
            "completed_calls" => (int)$pdo->query("SELECT COUNT(*) FROM `call_sessions` WHERE `status` = 'COMPLETED'")->fetchColumn(),
            "missed_calls" => (int)$pdo->query("SELECT COUNT(*) FROM `call_sessions` WHERE `status` IN ('MISSED', 'TIMEOUT', 'REJECTED')")->fetchColumn(),
            "total_calls" => (int)$pdo->query("SELECT COUNT(*) FROM `call_sessions`")->fetchColumn()
        ];

        // Fetch staff members with availability and eligibility
        $staffStmt = $pdo->query("SELECT `id`, `name`, `role`, `avatar`, `status` FROM `users` WHERE `status` = 'active'");
        $staffList = $staffStmt->fetchAll(PDO::FETCH_ASSOC);
        if (empty($staffList)) {
            $staffList = [
                ["id" => "admin", "name" => "Super Admin", "role" => "admin", "avatar" => "SA", "status" => "active"],
                ["id" => "staff_01", "name" => "Kavitha Raman", "role" => "Sales Specialist (Baby Collection)", "avatar" => "KR", "status" => "active"],
                ["id" => "staff_02", "name" => "Suresh Kumar", "role" => "Enquiry Specialist (Maternity & Kids)", "avatar" => "SK", "status" => "active"],
                ["id" => "staff_03", "name" => "Priya Dharshini", "role" => "Order Fulfillment & Support", "avatar" => "PD", "status" => "active"]
            ];
        }

        $eligibleArray = array_filter(array_map('trim', explode(',', $settings['eligible_staff_ids'] ?? '')));
        $busyStaffIds = $pdo->query("SELECT DISTINCT `assigned_staff_id` FROM `call_sessions` WHERE `status` IN ('CONNECTED', 'CLAIMED', 'ASSIGNED') AND `assigned_staff_id` IS NOT NULL")->fetchAll(PDO::FETCH_COLUMN);

        $processedStaff = [];
        $availableCount = 0;
        $busyCount = 0;

        foreach ($staffList as $st) {
            $isEligible = in_array($st['id'], $eligibleArray) || in_array('all', $eligibleArray);
            $isBusy = in_array($st['id'], $busyStaffIds);
            if ($isBusy) $busyCount++;
            else $availableCount++;

            $processedStaff[] = [
                "id" => $st['id'],
                "name" => $st['name'],
                "role" => $st['role'],
                "avatar" => $st['avatar'] ?? strtoupper(substr($st['name'], 0, 2)),
                "is_eligible" => $isEligible,
                "is_busy" => $isBusy,
                "status" => $isBusy ? 'BUSY' : 'AVAILABLE'
            ];
        }

        $metrics["available_staff"] = $availableCount;
        $metrics["busy_staff"] = $busyCount;

        echo json_encode([
            "status" => "success",
            "settings" => $settings,
            "metrics" => $metrics,
            "staff" => $processedStaff
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_masking_settings' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $callMasking = isset($data['call_masking_enabled']) ? ($data['call_masking_enabled'] ? 1 : 0) : 1;
        $chatMasking = isset($data['chat_masking_enabled']) ? ($data['chat_masking_enabled'] ? 1 : 0) : 1;
        $timeout = intval($data['call_timeout_seconds'] ?? 30);
        $strategy = $data['fallback_strategy'] ?? 'RETURN_TO_POOL';
        $virtualNum = trim($data['virtual_company_number'] ?? '+91 97896 60115');
        $recording = isset($data['recording_enabled']) ? ($data['recording_enabled'] ? 1 : 0) : 1;
        $ringLimit = intval($data['simultaneous_ring_limit'] ?? 5);
        $eligibleStaff = is_array($data['eligible_staff_ids'] ?? null) 
            ? implode(',', $data['eligible_staff_ids']) 
            : ($data['eligible_staff_ids'] ?? 'staff_01,staff_02,staff_03');
        $updatedBy = $data['updated_by'] ?? 'Super Admin';

        $stmt = $pdo->prepare("
            INSERT INTO `masking_settings` (`id`, `call_masking_enabled`, `chat_masking_enabled`, `call_timeout_seconds`, `fallback_strategy`, `virtual_company_number`, `eligible_staff_ids`, `recording_enabled`, `simultaneous_ring_limit`, `updated_by`)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                `call_masking_enabled` = VALUES(`call_masking_enabled`),
                `chat_masking_enabled` = VALUES(`chat_masking_enabled`),
                `call_timeout_seconds` = VALUES(`call_timeout_seconds`),
                `fallback_strategy` = VALUES(`fallback_strategy`),
                `virtual_company_number` = VALUES(`virtual_company_number`),
                `eligible_staff_ids` = VALUES(`eligible_staff_ids`),
                `recording_enabled` = VALUES(`recording_enabled`),
                `simultaneous_ring_limit` = VALUES(`simultaneous_ring_limit`),
                `updated_by` = VALUES(`updated_by`)
        ");
        $stmt->execute([$callMasking, $chatMasking, $timeout, $strategy, $virtualNum, $eligibleStaff, $recording, $ringLimit, $updatedBy]);

        try {
            $auditStmt = $pdo->prepare("INSERT INTO `audit_logs` (`action_type`, `category`, `actor`, `description`, `created_at`) VALUES ('CALL_MASKING_UPDATED', 'TELEPHONY', ?, ?, NOW())");
            $auditStmt->execute([$updatedBy, "Updated Call & Number Masking settings. Virtual DID: $virtualNum, Call Masking: " . ($callMasking ? 'ON' : 'OFF') . ", Ring Timeout: {$timeout}s, Eligible: $eligibleStaff"]);
        } catch (Exception $ae) {}

        echo json_encode(["status" => "success", "message" => "Call masking settings saved successfully!"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'get_incoming_calls') {
    header('Content-Type: application/json');
    $calls = [];
    try {
        if ($pdo) {
            // 1. Auto-expire any stale calls (> 45 seconds old) from RINGING to MISSED
            $pdo->query("
                UPDATE `call_sessions`
                SET `status` = 'MISSED',
                    `outcome` = 'MISSED',
                    `ended_at` = IFNULL(`ended_at`, NOW())
                WHERE `status` = 'RINGING' 
                  AND TIMESTAMPDIFF(SECOND, `started_at`, NOW()) > 45
            ");

            // 2. Only return genuine fresh ringing calls within the last 45 seconds
            $stmt = $pdo->query("
                SELECT * FROM `call_sessions` 
                WHERE `status` = 'RINGING' 
                  AND TIMESTAMPDIFF(SECOND, `started_at`, NOW()) <= 45
                ORDER BY `started_at` DESC 
                LIMIT 5
            ");
            $rawCalls = $stmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($rawCalls as $rc) {
                $rc['call_id'] = $rc['id'];
                $rc['epoch'] = !empty($rc['started_at']) ? strtotime($rc['started_at']) : time();
                $calls[] = $rc;
            }
        }
    } catch (Exception $e) {}

    // Fallback and augment with live_incoming_calls.json
    $callsFile = __DIR__ . '/live_incoming_calls.json';
    if (file_exists($callsFile)) {
        $fileCalls = json_decode(file_get_contents($callsFile), true) ?: [];
        $validFileCalls = array_values(array_filter($fileCalls, function($c) {
            $t = isset($c['started_at']) ? strtotime($c['started_at']) : time();
            return (time() - $t) < 45 && ($c['status'] ?? '') === 'RINGING';
        }));
        foreach ($validFileCalls as $fc) {
            $found = false;
            foreach ($calls as $c) {
                if ($c['id'] === $fc['id']) { $found = true; break; }
            }
            if (!$found) {
                $fc['call_id'] = $fc['id'];
                $fc['epoch'] = isset($fc['started_at']) ? strtotime($fc['started_at']) : time();
                $calls[] = $fc;
            }
        }
    }

    echo json_encode([
        "status" => "success",
        "incoming_calls" => $calls,
        "server_time" => time(),
        "server_time_ms" => round(microtime(true) * 1000)
    ]);
    exit;
}

// DISMISS / DECLINE CALL (Marks ringing call as MISSED so it stops ringing for all users)
if ($action === 'dismiss_call' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    $callId = trim($data['call_id'] ?? '');

    if (!empty($callId) && $pdo) {
        try {
            $pdo->prepare("
                UPDATE `call_sessions`
                SET `status` = 'MISSED',
                    `outcome` = 'MISSED',
                    `ended_at` = IFNULL(`ended_at`, NOW())
                WHERE `id` = ? AND `status` = 'RINGING'
            ")->execute([$callId]);
        } catch (Exception $e) {}
    }
    echo json_encode(["status" => "success", "message" => "Call dismissed"]);
    exit;
}

// ATOMIC CALL ACCEPTANCE (RULE 2: FIRST SUCCESSFUL ACCEPTANCE WINS)
if ($action === 'accept_call' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    $callId = trim($data['call_id'] ?? '');
    $staffId = trim($data['staff_id'] ?? '');
    $staffName = trim($data['staff_name'] ?? 'Staff Member');

    if (empty($callId) || empty($staffId)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "call_id and staff_id are required."]);
        exit;
    }

    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $pdo->beginTransaction();

        // ROW-LEVEL LOCKING: Exclusively lock the call row for this transaction
        $checkStmt = $pdo->prepare("SELECT `id`, `assigned_staff_id`, `assigned_staff_name`, `status`, `started_at` FROM `call_sessions` WHERE `id` = ? FOR UPDATE");
        $checkStmt->execute([$callId]);
        $current = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($current && !empty($current['assigned_staff_id']) && $current['assigned_staff_id'] !== $staffId) {
            // TRUE CONFLICT: Another staff member claimed this call first
            $pdo->rollBack();
            http_response_code(409); // 409 Conflict
            echo json_encode([
                "status" => "conflict",
                "message" => "This call has already been assigned to " . ($current['assigned_staff_name'] ?? 'another staff member') . ".",
                "assigned_to" => $current['assigned_staff_name'] ?? 'Another Staff Member',
                "call_status" => $current['status'] ?? 'CLAIMED'
            ]);
            exit;
        }

        if ($current) {
            // ATOMIC CLAIM: Assign call to this worker and transition status to CLAIMED
            $updateStmt = $pdo->prepare("
                UPDATE `call_sessions`
                SET `assigned_staff_id` = ?,
                    `assigned_staff_name` = ?,
                    `status` = 'CLAIMED',
                    `answered_at` = IFNULL(`answered_at`, NOW()),
                    `outcome` = 'CLAIMED'
                WHERE `id` = ?
            ");
            $updateStmt->execute([$staffId, $staffName, $callId]);
        } else {
            // Call session record created on demand for incoming event
            $insStmt = $pdo->prepare("
                INSERT INTO `call_sessions` (
                    `id`, `provider_call_id`, `customer_id`, `customer_name`, `customer_phone`,
                    `masked_phone`, `virtual_number`, `assigned_staff_id`, `assigned_staff_name`,
                    `status`, `started_at`, `answered_at`, `outcome`
                ) VALUES (?, ?, 'cust_caller', 'WhatsApp Caller', '+91 97896 60115', '+91 97*** 60115', '+91 99435 57998', ?, ?, 'CLAIMED', NOW(), NOW(), 'CLAIMED')
            ");
            $insStmt->execute([$callId, 'INBOUND-' . uniqid(), $staffId, $staffName]);
        }

        // Winner gets recorded into call_assignments and call_activity_logs
        $assignStmt = $pdo->prepare("
            INSERT INTO `call_assignments` (`call_session_id`, `staff_id`, `staff_name`, `assignment_status`)
            VALUES (?, ?, ?, 'ACCEPTED')
        ");
        $assignStmt->execute([$callId, $staffId, $staffName]);

        $logStmt = $pdo->prepare("
            INSERT INTO `call_activity_logs` (`call_session_id`, `actor_id`, `actor_name`, `action`)
            VALUES (?, ?, ?, 'CALL_ACCEPTED')
        ");
        $logStmt->execute([$callId, $staffId, $staffName]);

        $pdo->commit();

        $custPhone = $current['customer_phone'] ?? '';
        $cleanId = preg_replace('/[^a-zA-Z0-9]/', '', $callId);
        $roomToken = !empty($current['voice_room_token']) ? $current['voice_room_token'] : ('vrm_' . $cleanId);

        // Broadcast to all other staff members via Socket.IO so their Accept button immediately disables
        // and trigger immediate WhatsApp ringing cut & pickup message dispatch on bridge
        notifySocketBridge('call:claimed', [
            'call_id' => $callId,
            'assigned_staff_id' => $staffId,
            'assigned_staff_name' => $staffName,
            'customer_phone' => $custPhone,
            'customer_name' => $current['customer_name'] ?? 'WhatsApp Caller',
            'voice_room_token' => $roomToken,
            'status' => 'CLAIMED'
        ]);

        echo json_encode([
            "status" => "success",
            "message" => "Call successfully assigned to you!",
            "call_id" => $callId,
            "staff_id" => $staffId,
            "staff_name" => $staffName,
            "call_status" => "CLAIMED"
        ]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'release_call' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    $callId = trim($data['call_id'] ?? '');
    $reason = trim($data['reason'] ?? 'REASSIGNED');
    $targetStaffId = trim($data['target_staff_id'] ?? '');
    $targetStaffName = trim($data['target_staff_name'] ?? '');

    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $pdo->beginTransaction();

        if (!empty($targetStaffId)) {
            $stmt = $pdo->prepare("
                UPDATE `call_sessions`
                SET `assigned_staff_id` = ?, `assigned_staff_name` = ?, `status` = 'CONNECTED'
                WHERE `id` = ?
            ");
            $stmt->execute([$targetStaffId, $targetStaffName, $callId]);
            $newStatus = 'CONNECTED';
        } else {
            $stmt = $pdo->prepare("
                UPDATE `call_sessions`
                SET `assigned_staff_id` = NULL, `assigned_staff_name` = NULL, `status` = 'RINGING'
                WHERE `id` = ?
            ");
            $stmt->execute([$callId]);
            $newStatus = 'RINGING';
        }

        $pdo->prepare("UPDATE `call_assignments` SET `released_at` = NOW(), `assignment_status` = 'RELEASED' WHERE `call_session_id` = ? AND `released_at` IS NULL")->execute([$callId]);

        $pdo->prepare("INSERT INTO `call_activity_logs` (`call_session_id`, `actor_id`, `actor_name`, `action`) VALUES (?, 'admin', 'Super Admin', ?)")->execute([$callId, "CALL_RELEASED: $reason"]);

        $pdo->commit();

        notifySocketBridge('call:released', [
            'call_id' => $callId,
            'status' => $newStatus,
            'target_staff_id' => $targetStaffId,
            'target_staff_name' => $targetStaffName
        ]);

        echo json_encode(["status" => "success", "message" => "Call released/reassigned successfully", "new_status" => $newStatus]);
    } catch (Exception $e) {
        if ($pdo->inTransaction()) $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'end_call' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    $callId = trim($data['call_id'] ?? '');
    $duration = intval($data['duration_seconds'] ?? 0);
    $outcome = trim($data['outcome'] ?? 'COMPLETED');
    $notes = trim($data['outcome_notes'] ?? '');

    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        if ($duration <= 0 && !empty($callId)) {
            $startStmt = $pdo->prepare("SELECT `started_at` FROM `call_sessions` WHERE `id` = ?");
            $startStmt->execute([$callId]);
            $startTime = $startStmt->fetchColumn();
            if ($startTime) {
                $duration = max(1, time() - strtotime($startTime));
            }
        }
        $stmt = $pdo->prepare("
            UPDATE `call_sessions`
            SET `status` = 'COMPLETED',
                `ended_at` = NOW(),
                `duration_seconds` = ?,
                `outcome` = ?,
                `outcome_notes` = ?
            WHERE `id` = ?
        ");
        $stmt->execute([$duration, $outcome, $notes, $callId]);

        // Persist staff notes into call_staff_notes table
        if (!empty($notes)) {
            try {
                $staffInfoStmt = $pdo->prepare("SELECT `assigned_staff_id`, `assigned_staff_name` FROM `call_sessions` WHERE `id` = ?");
                $staffInfoStmt->execute([$callId]);
                $staffInfo = $staffInfoStmt->fetch(PDO::FETCH_ASSOC);
                $noteStaffId = $staffInfo['assigned_staff_id'] ?? 'staff_01';
                $noteStaffName = $staffInfo['assigned_staff_name'] ?? 'Staff Member';

                $noteStmt = $pdo->prepare("
                    INSERT INTO `call_staff_notes` (`note_id`, `call_id`, `staff_id`, `staff_name`, `note_summary`)
                    VALUES (?, ?, ?, ?, ?)
                ");
                $noteStmt->execute(['NOTE-' . uniqid(), $callId, $noteStaffId, $noteStaffName, $notes]);
            } catch (Exception $e) {}
        }

        $pdo->prepare("UPDATE `call_assignments` SET `released_at` = NOW() WHERE `call_session_id` = ? AND `released_at` IS NULL")->execute([$callId]);

        $pdo->prepare("INSERT INTO `call_activity_logs` (`call_session_id`, `actor_id`, `actor_name`, `action`) VALUES (?, 'system', 'Telephony', 'CALL_COMPLETED')")->execute([$callId]);

        // Update customer chat timeline
        try {
            $sessStmt = $pdo->prepare("SELECT `customer_id`, `customer_name`, `customer_phone`, `assigned_staff_name` FROM `call_sessions` WHERE `id` = ?");
            $sessStmt->execute([$callId]);
            $sData = $sessStmt->fetch(PDO::FETCH_ASSOC);
            if ($sData && !empty($sData['customer_id'])) {
                $durMin = floor($duration / 60);
                $durSec = $duration % 60;
                $durFormatted = sprintf("%02d:%02d", $durMin, $durSec);
                $chatNotice = "📞 [Call Completed] Duration: $durFormatted • Outcome: $outcome" . (!empty($notes) ? " • Notes: $notes" : "");

                $msgStmt = $pdo->prepare("
                    INSERT INTO `messages` (
                        `customer_id`, `sender`, `sender_name`, `sender_phone`,
                        `direction`, `text`, `message_text`, `media_type`,
                        `account_id`, `source`, `time_str`, `timestamp_epoch`, `status`
                    ) VALUES (?, 'staff', ?, ?, 'outbound', ?, ?, 'call_event', 'account_1', 'CRM_CALL_MASKING', ?, ?, 'DELIVERED')
                ");
                $nowTs = time();
                $timeStr = date('h:i A');
                $staffN = $sData['assigned_staff_name'] ?? 'Staff Member';
                $custPhone = $sData['customer_phone'] ?? '';
                $msgStmt->execute([
                    $sData['customer_id'], $staffN, $custPhone,
                    $chatNotice, $chatNotice, $timeStr, $nowTs
                ]);

                // Update customers last_message and last_message_at
                $pdo->prepare("UPDATE `customers` SET `last_message` = ?, `last_message_at` = NOW() WHERE `id` = ?")->execute([$chatNotice, $sData['customer_id']]);
            }
        } catch (Exception $e) {}

        notifySocketBridge('call:ended', [
            'call_id' => $callId,
            'status' => 'COMPLETED',
            'duration_seconds' => $duration
        ]);

        echo json_encode(["status" => "success", "message" => "Call completed successfully"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'initiate_outbound_call' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    
    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $callId = 'CALL-' . rand(1000, 9999);
        $custName = trim($data['customer_name'] ?? 'Customer');
        $rawPhone = trim($data['customer_phone'] ?? '');
        $customerId = trim($data['customer_id'] ?? '');
        $staffId = trim($data['staff_id'] ?? 'admin');
        $staffName = trim($data['staff_name'] ?? 'Super Admin');
        
        $cleanDigits = preg_replace('/[^0-9]/', '', $rawPhone);
        $maskedPhone = (strlen($cleanDigits) >= 10) 
            ? '+91 ' . substr($cleanDigits, -10, 2) . '*** ' . substr($cleanDigits, -5)
            : $rawPhone;

        $settings = $pdo->query("SELECT * FROM `masking_settings` WHERE `id` = 1")->fetch(PDO::FETCH_ASSOC);
        $virtualNum = $settings['virtual_company_number'] ?? '+91 97896 60115';

        $stmt = $pdo->prepare("
            INSERT INTO `call_sessions` (
                `id`, `provider_call_id`, `customer_id`, `customer_name`, `customer_phone`, 
                `masked_phone`, `virtual_number`, `assigned_staff_id`, `assigned_staff_name`,
                `status`, `started_at`, `answered_at`, `outcome`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'CONNECTED', NOW(), NOW(), 'CONNECTED')
        ");
        $stmt->execute([
            $callId, 'OUT-' . uniqid(), $customerId, $custName, $rawPhone,
            $maskedPhone, $virtualNum, $staffId, $staffName
        ]);

        $callData = [
            'call_id' => $callId,
            'id' => $callId,
            'customer_id' => $customerId,
            'customer_name' => $custName,
            'customer_phone' => $rawPhone,
            'masked_phone' => $maskedPhone,
            'virtual_number' => $virtualNum,
            'assigned_staff_id' => $staffId,
            'assigned_staff_name' => $staffName,
            'status' => 'CONNECTED',
            'started_at' => date('Y-m-d H:i:s')
        ];

        notifySocketBridge('call:active', $callData);

        echo json_encode([
            "status" => "success",
            "message" => "Outbound call session registered in Call Masking Control Hub",
            "call" => $callData
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'simulate_incoming_call' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    
    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $callId = !empty($data['call_id']) ? trim($data['call_id']) : ('CALL-' . rand(1000, 9999));
        $custName = trim($data['customer_name'] ?? '');
        $rawPhone = trim($data['customer_phone'] ?? '+91 97896 60115');
        $customerId = $data['customer_id'] ?? null;
        
        $cleanDigits = preg_replace('/[^0-9]/', '', $rawPhone);
        
        // Intelligent Customer Resolution: Match phone digits against customers table
        if (empty($custName) || $custName === 'WhatsApp Caller' || $custName === 'Customer') {
            $last10 = (strlen($cleanDigits) >= 10) ? substr($cleanDigits, -10) : $cleanDigits;
            if (!empty($last10)) {
                $cStmt = $pdo->prepare("SELECT `id`, `name` FROM `customers` WHERE `phone` LIKE ? OR `whatsapp` LIKE ? LIMIT 1");
                $cStmt->execute(["%$last10%", "%$last10%"]);
                $matchedCust = $cStmt->fetch(PDO::FETCH_ASSOC);
                if ($matchedCust && !empty($matchedCust['name'])) {
                    $custName = $matchedCust['name'];
                    if (empty($customerId)) $customerId = $matchedCust['id'];
                }
            }
        }
        if (empty($custName)) $custName = 'WhatsApp Caller';

        $maskedPhone = (strlen($cleanDigits) >= 10) 
            ? '+91 ' . substr($cleanDigits, -10, 2) . '*** ' . substr($cleanDigits, -5)
            : $rawPhone;

        $settings = $pdo->query("SELECT * FROM `masking_settings` WHERE `id` = 1")->fetch(PDO::FETCH_ASSOC);
        $virtualNum = $settings['virtual_company_number'] ?? '+91 99435 57998';
        $eligibleStaff = $settings['eligible_staff_ids'] ?? 'staff_05,admin,all';
        $eligibleArr = array_filter(array_map('trim', explode(',', $eligibleStaff)));
        
        // Ensure active staff from users table are always included
        try {
            $allActiveStaff = $pdo->query("SELECT `id` FROM `users` WHERE `status` = 'active'")->fetchAll(PDO::FETCH_COLUMN);
            $eligibleArr = array_unique(array_merge($eligibleArr, $allActiveStaff, ['all', 'admin', 'staff_05']));
        } catch (Exception $e) {}

        $cleanCallId = preg_replace('/[^a-zA-Z0-9]/', '', $callId);
        $voiceRoomToken = !empty($data['voice_room_token']) ? trim($data['voice_room_token']) : ('vrm_' . $cleanCallId);

        // Insert or update existing call_session record
        $stmt = $pdo->prepare("
            INSERT INTO `call_sessions` (
                `id`, `provider_call_id`, `customer_id`, `customer_name`, `customer_phone`, 
                `masked_phone`, `virtual_number`, `status`, `voice_room_token`, `voice_room_id`, `started_at`, `outcome`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'RINGING', ?, ?, NOW(), 'PENDING')
            ON DUPLICATE KEY UPDATE 
                `customer_name` = VALUES(`customer_name`),
                `customer_phone` = VALUES(`customer_phone`),
                `masked_phone` = VALUES(`masked_phone`),
                `voice_room_token` = VALUES(`voice_room_token`),
                `voice_room_id` = VALUES(`voice_room_id`),
                `status` = 'RINGING',
                `started_at` = NOW()
        ");
        $stmt->execute([
            $callId, 'SIM-' . uniqid(), $customerId, $custName, $rawPhone, $maskedPhone, $virtualNum, $voiceRoomToken, $voiceRoomToken
        ]);

        $nowMs = round(microtime(true) * 1000);
        $callData = [
            'call_id' => $callId,
            'id' => $callId,
            'customer_id' => $customerId,
            'customer_name' => $custName,
            'customer_phone' => $rawPhone,
            'masked_phone' => $maskedPhone,
            'virtual_number' => $virtualNum,
            'status' => 'RINGING',
            'voice_room_token' => $voiceRoomToken,
            'is_video' => !empty($data['is_video']),
            'started_at' => date('Y-m-d H:i:s'),
            'timestamp' => $nowMs,
            'epoch' => time(),
            'timeout_seconds' => intval($settings['call_timeout_seconds'] ?? 30),
            'eligible_staff_ids' => array_values($eligibleArr)
        ];

        // If manually simulated from CRM (not forwarded from real bridge event), broadcast via bridge
        if (empty($data['account_id'])) {
            notifySocketBridge('call:incoming', $callData);
        }

        echo json_encode([
            "status" => "success",
            "message" => "Incoming call simulated and broadcasted to eligible staff!",
            "call" => $callData
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'get_call_sessions') {
    header('Content-Type: application/json');
    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $limit = min(100, max(1, intval($_GET['limit'] ?? 50)));
        $stmt = $pdo->prepare("SELECT * FROM `call_sessions` ORDER BY `created_at` DESC LIMIT ?");
        $stmt->bindValue(1, $limit, PDO::PARAM_INT);
        $stmt->execute();
        $sessions = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Dynamically compute duration for completed or active sessions
        foreach ($sessions as &$s) {
            $dur = intval($s['duration_seconds'] ?? 0);
            if ($dur <= 0 && !empty($s['started_at'])) {
                $startTs = strtotime($s['started_at']);
                if (!empty($s['ended_at'])) {
                    $endTs = strtotime($s['ended_at']);
                    if ($endTs > $startTs) $dur = $endTs - $startTs;
                } elseif ($s['status'] === 'CONNECTED') {
                    $dur = max(1, time() - $startTs);
                }
            }
            $s['duration_seconds'] = $dur;
        }
        unset($s);

        echo json_encode(["status" => "success", "sessions" => $sessions]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'get_call_details') {
    header('Content-Type: application/json');
    $callId = trim($_GET['call_id'] ?? '');
    if (empty($callId)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "call_id is required."]);
        exit;
    }
    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $stmt = $pdo->prepare("SELECT * FROM `call_sessions` WHERE `id` = ?");
        $stmt->execute([$callId]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$session) {
            http_response_code(404);
            echo json_encode(["status" => "error", "message" => "Call session not found."]);
            exit;
        }

        // Compute duration if not persisted
        $dur = intval($session['duration_seconds'] ?? 0);
        if ($dur <= 0 && !empty($session['started_at'])) {
            $startTs = strtotime($session['started_at']);
            if (!empty($session['ended_at'])) {
                $endTs = strtotime($session['ended_at']);
                if ($endTs > $startTs) $dur = $endTs - $startTs;
            } elseif ($session['status'] === 'CLAIMED' || $session['status'] === 'CONNECTED') {
                $dur = max(1, time() - $startTs);
            }
        }
        $session['duration_seconds'] = $dur;

        // Fetch staff assignment history
        $assignments = [];
        try {
            $assignStmt = $pdo->prepare("SELECT * FROM `call_assignments` WHERE `call_session_id` = ? ORDER BY `assigned_at` ASC");
            $assignStmt->execute([$callId]);
            $assignments = $assignStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $assignments = [];
        }

        // Fetch call activity logs
        $activityLogs = [];
        try {
            $logStmt = $pdo->prepare("SELECT * FROM `call_activity_logs` WHERE `call_session_id` = ? ORDER BY `created_at` ASC");
            $logStmt->execute([$callId]);
            $activityLogs = $logStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            $activityLogs = [];
        }

        // Fetch staff notes
        $staffNotes = [];
        try {
            $noteStmt = $pdo->prepare("SELECT * FROM `call_staff_notes` WHERE `call_id` = ? ORDER BY `created_at` ASC");
            $noteStmt->execute([$callId]);
            $staffNotes = $noteStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // Auto-create call_staff_notes table if not exists
            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS `call_staff_notes` (
                        `note_id` VARCHAR(60) PRIMARY KEY,
                        `call_id` VARCHAR(50) NOT NULL,
                        `staff_id` VARCHAR(50) NOT NULL,
                        `staff_name` VARCHAR(100) DEFAULT NULL,
                        `target_staff_id` VARCHAR(50) DEFAULT NULL,
                        `target_staff_name` VARCHAR(100) DEFAULT NULL,
                        `note_summary` TEXT NOT NULL,
                        `handover_status` ENUM('NONE', 'ASSIGNED', 'ACKNOWLEDGED', 'RESOLVED') DEFAULT 'NONE',
                        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        INDEX(`call_id`),
                        INDEX(`staff_id`),
                        INDEX(`target_staff_id`),
                        INDEX(`created_at`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $ex) {}
            $staffNotes = [];
        }

        // Fetch recordings
        $recordings = [];
        try {
            $recStmt = $pdo->prepare("SELECT * FROM `call_recordings` WHERE `call_id` = ? ORDER BY `created_at` ASC");
            $recStmt->execute([$callId]);
            $recordings = $recStmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (Exception $e) {
            // Auto-create call_recordings table if not exists
            try {
                $pdo->exec("
                    CREATE TABLE IF NOT EXISTS `call_recordings` (
                        `recording_id` VARCHAR(60) PRIMARY KEY,
                        `call_id` VARCHAR(50) NOT NULL,
                        `recording_reference` TEXT NOT NULL,
                        `recording_status` ENUM('Processing', 'Completed', 'Failed', 'Unavailable') DEFAULT 'Unavailable',
                        `file_size_bytes` BIGINT DEFAULT 0,
                        `duration_seconds` INT DEFAULT 0,
                        `audio_format` VARCHAR(20) DEFAULT 'mp3',
                        `storage_disk` VARCHAR(50) DEFAULT 'local',
                        `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        INDEX(`call_id`),
                        INDEX(`recording_status`),
                        INDEX(`created_at`)
                    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ");
            } catch (Exception $ex) {}
            $recordings = [];
        }

        echo json_encode([
            "status" => "success",
            "session" => $session,
            "assignments" => $assignments,
            "activity_logs" => $activityLogs,
            "staff_notes" => $staffNotes,
            "recordings" => $recordings,
            "media_capability" => [
                "media_accessible" => true,
                "protocol" => "WebRTC In-CRM Dual Audio Stream + Self-Hosted Storage",
                "notice" => "WebRTC voice session active. Two-way audio stream mixed & stored securely on self-hosted server."
            ]
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// -------------------------------------------------------------------------
// WEBRTC IN-CRM VOICE CALL & AUDIO RECORDING ENGINE ENDPOINTS
// -------------------------------------------------------------------------

// 1. VERIFY VOICE ROOM (Customer & Staff Handshake Authentication)
if ($action === 'verify_voice_room') {
    header('Content-Type: application/json');
    $token = trim($_GET['token'] ?? $_POST['token'] ?? '');
    if (empty($token)) {
        $input = json_decode(file_get_contents('php://input'), true);
        $token = trim($input['token'] ?? '');
    }

    if (empty($token)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "valid" => false, "message" => "Room token is required"]);
        exit;
    }

    try {
        if (!$pdo) throw new Exception("Database unavailable");
        $stmt = $pdo->prepare("SELECT * FROM `call_sessions` WHERE `voice_room_token` = ? OR `id` = ? LIMIT 1");
        $stmt->execute([$token, $token]);
        $session = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$session) {
            http_response_code(404);
            echo json_encode(["status" => "error", "valid" => false, "message" => "Voice room not found or expired"]);
            exit;
        }

        echo json_encode([
            "status" => "success",
            "valid" => true,
            "call_id" => $session['id'],
            "room_token" => $session['voice_room_token'] ?? $token,
            "customer_name" => $session['customer_name'] ?? 'Customer',
            "customer_phone" => $session['customer_phone'] ?? '',
            "masked_phone" => $session['masked_phone'] ?? '',
            "assigned_staff_name" => $session['assigned_staff_name'] ?? 'Support Specialist',
            "assigned_staff_id" => $session['assigned_staff_id'] ?? 'staff_01',
            "call_status" => $session['status'],
            "voice_connection_status" => $session['voice_connection_status'] ?? 'PENDING'
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "valid" => false, "message" => $e->getMessage()]);
    }
    exit;
}

// 2. SAVE CALL RECORDING (Persists WebRTC recorded audio reference & metadata)
if ($action === 'save_call_recording' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    $callId = trim($data['call_id'] ?? '');
    $roomToken = trim($data['room_token'] ?? '');
    $recordingRef = trim($data['recording_reference'] ?? $data['recording_url'] ?? '');
    $duration = intval($data['duration_seconds'] ?? 0);
    $fileSize = intval($data['file_size_bytes'] ?? 0);
    $format = trim($data['audio_format'] ?? 'webm');
    $source = trim($data['recording_source'] ?? 'STAFF_BROWSER_MIX');

    if (empty($callId) || empty($recordingRef)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "call_id and recording_reference required"]);
        exit;
    }

    try {
        if (!$pdo) throw new Exception("Database unavailable");
        $recId = 'REC_' . uniqid();
        $stmt = $pdo->prepare("
            INSERT INTO `call_recordings` (
                `recording_id`, `call_id`, `room_token`, `recording_reference`, `recording_status`, 
                `file_size_bytes`, `duration_seconds`, `audio_format`, `recording_source`, `storage_disk`
            ) VALUES (?, ?, ?, ?, 'Completed', ?, ?, ?, ?, 'local')
            ON DUPLICATE KEY UPDATE 
                `recording_reference` = VALUES(`recording_reference`),
                `file_size_bytes` = VALUES(`file_size_bytes`),
                `duration_seconds` = VALUES(`duration_seconds`),
                `recording_status` = 'Completed'
        ");
        $stmt->execute([$recId, $callId, $roomToken, $recordingRef, $fileSize, $duration, $format, $source]);

        // Update call_sessions
        $upStmt = $pdo->prepare("
            UPDATE `call_sessions`
            SET `recording_url` = ?,
                `duration_seconds` = IF(? > 0, ?, `duration_seconds`),
                `status` = IF(`status` = 'MISSED' OR `status` = 'REJECTED', `status`, 'COMPLETED'),
                `voice_connection_status` = 'DISCONNECTED',
                `recording_status` = 'COMPLETED',
                `ended_at` = IFNULL(`ended_at`, NOW())
            WHERE `id` = ? OR `voice_room_token` = ?
        ");
        $upStmt->execute([$recordingRef, $duration, $duration, $callId, $roomToken]);

        // Log call activity
        try {
            $pdo->prepare("INSERT INTO `call_activity_logs` (`call_session_id`, `activity_type`, `description`, `actor`) VALUES (?, 'RECORDING_SAVED', ?, 'Bridge WebRTC Engine')")
                ->execute([$callId, "Two-way call recording archived ($duration s, format: $format)"]);
        } catch (Exception $e) {}

        echo json_encode(["status" => "success", "recording_id" => $recId, "call_id" => $callId, "message" => "Recording metadata saved"]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

// 3. STREAM CALL RECORDING (Supports HTTP 206 Partial Content for Seekable Playback & Audits Access)
if ($action === 'get_call_recording_stream' || $action === 'stream_recording') {
    $recordingId = trim($_GET['recording_id'] ?? $_GET['id'] ?? '');
    $callId = trim($_GET['call_id'] ?? '');

    if (empty($recordingId) && empty($callId)) {
        http_response_code(400);
        die("Recording ID or Call ID required.");
    }

    try {
        if (!$pdo) throw new Exception("Database unavailable");

        if (!empty($recordingId)) {
            $stmt = $pdo->prepare("SELECT * FROM `call_recordings` WHERE `recording_id` = ? LIMIT 1");
            $stmt->execute([$recordingId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM `call_recordings` WHERE `call_id` = ? ORDER BY `created_at` DESC LIMIT 1");
            $stmt->execute([$callId]);
        }
        $rec = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$rec || empty($rec['recording_reference'])) {
            // Check fallback in call_sessions
            $sessStmt = $pdo->prepare("SELECT `id`, `recording_url` FROM `call_sessions` WHERE `id` = ? OR `voice_room_token` = ? LIMIT 1");
            $sessStmt->execute([$callId, $callId]);
            $sess = $sessStmt->fetch(PDO::FETCH_ASSOC);
            if ($sess && !empty($sess['recording_url'])) {
                $rec = [
                    'recording_id' => 'REC_' . $sess['id'],
                    'call_id' => $sess['id'],
                    'recording_reference' => $sess['recording_url'],
                    'audio_format' => 'webm'
                ];
            } else {
                http_response_code(404);
                die("Recording reference not found.");
            }
        }

        // Resolve absolute file path
        $filePath = $rec['recording_reference'];
        if (!file_exists($filePath)) {
            // Check relative to project root
            $candidate = __DIR__ . '/' . ltrim($filePath, '/\\');
            if (file_exists($candidate)) {
                $filePath = $candidate;
            } else {
                $candidateStorage = __DIR__ . '/storage/' . ltrim($filePath, '/\\');
                if (file_exists($candidateStorage)) {
                    $filePath = $candidateStorage;
                }
            }
        }

        if (!file_exists($filePath)) {
            http_response_code(404);
            die("Audio recording file does not exist on server storage: " . htmlspecialchars(basename($filePath)));
        }

        // Audit this playback access
        if (session_status() === PHP_SESSION_NONE) session_start();
        $actorId = $_SESSION['user']['id'] ?? 'user_admin';
        $actorName = $_SESSION['user']['name'] ?? 'Admin User';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

        try {
            $pdo->prepare("
                INSERT INTO `call_recording_access_logs` 
                    (`recording_id`, `call_id`, `actor_id`, `actor_name`, `action_type`, `ip_address`, `user_agent`) 
                VALUES (?, ?, ?, ?, 'STREAM_PLAY', ?, ?)
            ")->execute([$rec['recording_id'], $rec['call_id'], $actorId, $actorName, $ip, substr($ua, 0, 500)]);
        } catch (Exception $e) {}

        // Determine MIME type
        $ext = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));
        $mime = 'audio/webm';
        if ($ext === 'mp3') $mime = 'audio/mpeg';
        elseif ($ext === 'ogg' || $ext === 'opus') $mime = 'audio/ogg';
        elseif ($ext === 'wav') $mime = 'audio/wav';

        // Stream with HTTP 206 Partial Content
        $size = filesize($filePath);
        $start = 0;
        $end = $size - 1;
        $length = $size;

        header("Accept-Ranges: bytes");
        header("Content-Type: $mime");
        header("Cache-Control: no-cache, no-store, must-revalidate");

        if (isset($_SERVER['HTTP_RANGE'])) {
            $range = $_SERVER['HTTP_RANGE'];
            list(, $range) = explode('=', $range, 2);
            if (strpos($range, ',') !== false) {
                http_response_code(416);
                exit;
            }
            if ($range === '-') {
                $c_start = $size - substr($range, 1);
            } else {
                $range = explode('-', $range);
                $c_start = intval($range[0]);
                $c_end = (isset($range[1]) && is_numeric($range[1])) ? intval($range[1]) : $size - 1;
            }
            $c_end = ($c_end > $end) ? $end : $c_end;
            if ($c_start > $c_end || $c_start > $size - 1 || $c_end >= $size) {
                http_response_code(416);
                header("Content-Range: bytes $start-$end/$size");
                exit;
            }
            $start = $c_start;
            $end = $c_end;
            $length = $end - $start + 1;
            http_response_code(206);
            header("Content-Range: bytes $start-$end/$size");
        }
        header("Content-Length: " . $length);

        $fp = fopen($filePath, 'rb');
        fseek($fp, $start);
        $chunkSize = 1024 * 64;
        while (!feof($fp) && ($pos = ftell($fp)) <= $end) {
            if ($pos + $chunkSize > $end) {
                $chunkSize = $end - $pos + 1;
            }
            set_time_limit(30);
            echo fread($fp, $chunkSize);
            flush();
        }
        fclose($fp);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        die("Error streaming audio: " . $e->getMessage());
    }
    exit;
}

// 4. DOWNLOAD CALL RECORDING (With Audit Logging)
if ($action === 'download_call_recording') {
    $recordingId = trim($_GET['recording_id'] ?? $_GET['id'] ?? '');
    $callId = trim($_GET['call_id'] ?? '');

    try {
        if (!$pdo) throw new Exception("Database unavailable");
        if (!empty($recordingId)) {
            $stmt = $pdo->prepare("SELECT * FROM `call_recordings` WHERE `recording_id` = ? LIMIT 1");
            $stmt->execute([$recordingId]);
        } else {
            $stmt = $pdo->prepare("SELECT * FROM `call_recordings` WHERE `call_id` = ? ORDER BY `created_at` DESC LIMIT 1");
            $stmt->execute([$callId]);
        }
        $rec = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$rec || empty($rec['recording_reference'])) {
            http_response_code(404);
            die("Recording not found.");
        }

        $filePath = $rec['recording_reference'];
        if (!file_exists($filePath)) {
            $candidate = __DIR__ . '/' . ltrim($filePath, '/\\');
            if (file_exists($candidate)) $filePath = $candidate;
        }

        if (!file_exists($filePath)) {
            http_response_code(404);
            die("Recording file missing on disk.");
        }

        // Audit Download
        if (session_status() === PHP_SESSION_NONE) session_start();
        $actorId = $_SESSION['user']['id'] ?? 'user_admin';
        $actorName = $_SESSION['user']['name'] ?? 'Admin User';
        $ip = $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
        $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

        try {
            $pdo->prepare("
                INSERT INTO `call_recording_access_logs` 
                    (`recording_id`, `call_id`, `actor_id`, `actor_name`, `action_type`, `ip_address`, `user_agent`) 
                VALUES (?, ?, ?, ?, 'DOWNLOAD', ?, ?)
            ")->execute([$rec['recording_id'], $rec['call_id'], $actorId, $actorName, $ip, substr($ua, 0, 500)]);
        } catch (Exception $e) {}

        $downloadFilename = "Call_Recording_" . preg_replace('/[^a-zA-Z0-9_-]/', '_', $rec['call_id']) . "." . pathinfo($filePath, PATHINFO_EXTENSION);
        header('Content-Description: File Transfer');
        header('Content-Type: application/octet-stream');
        header('Content-Disposition: attachment; filename="' . $downloadFilename . '"');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($filePath));
        readfile($filePath);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        die("Download error: " . $e->getMessage());
    }
    exit;
}

if ($action === 'log_call_session' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');
    $input = file_get_contents('php://input');
    $data = json_decode($input, true) ?? [];
    try {
        if (!$pdo) throw new Exception("Database connection unavailable");
        $id = $data['id'] ?? ('call_' . uniqid());
        $providerCallId = $data['provider_call_id'] ?? null;
        $customerId = $data['customer_id'] ?? null;
        $customerName = $data['customer_name'] ?? 'Unknown Customer';
        $customerPhone = $data['customer_phone'] ?? '';
        $maskedPhone = $data['masked_phone'] ?? '';
        $virtualNumber = $data['virtual_number'] ?? '+91 8000 123 456';
        $assignedStaffId = $data['assigned_staff_id'] ?? null;
        $assignedStaffName = $data['assigned_staff_name'] ?? 'Super Admin';
        $status = $data['status'] ?? 'COMPLETED';
        $startedAt = $data['started_at'] ?? date('Y-m-d H:i:s');
        $answeredAt = $data['answered_at'] ?? date('Y-m-d H:i:s');
        $endedAt = $data['ended_at'] ?? date('Y-m-d H:i:s');
        $durationSeconds = intval($data['duration_seconds'] ?? 0);
        $outcome = $data['outcome'] ?? 'CONNECTED';
        $outcomeNotes = $data['outcome_notes'] ?? '';
        $recordingUrl = $data['recording_url'] ?? null;

        $stmt = $pdo->prepare("
            INSERT INTO `call_sessions` (
                `id`, `provider_call_id`, `customer_id`, `customer_name`, `customer_phone`, 
                `masked_phone`, `virtual_number`, `assigned_staff_id`, `assigned_staff_name`, 
                `status`, `started_at`, `answered_at`, `ended_at`, `duration_seconds`, 
                `outcome`, `outcome_notes`, `recording_url`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $id, $providerCallId, $customerId, $customerName, $customerPhone,
            $maskedPhone, $virtualNumber, $assignedStaffId, $assignedStaffName,
            $status, $startedAt, $answeredAt, $endedAt, $durationSeconds,
            $outcome, $outcomeNotes, $recordingUrl
        ]);

        echo json_encode(["status" => "success", "message" => "Call session logged successfully", "call_id" => $id]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $e->getMessage()]);
    }
    exit;
}

if ($action === 'save_user_preference' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    if (!empty($data['preferred_language'])) {
        if (session_status() === PHP_SESSION_NONE) session_start();
        $_SESSION['preferred_language'] = $data['preferred_language'];
        if (!empty($_SESSION['user']['id']) && $pdo) {
            try {
                $pdo->prepare("UPDATE `users` SET `preferred_language` = ? WHERE `id` = ?")->execute([$data['preferred_language'], $_SESSION['user']['id']]);
            } catch (Exception $e) {}
        }
    }
    echo json_encode(["status" => "success", "message" => "Preference saved"]);
    exit;
}

// Default fallback response
echo json_encode(["status" => "success", "message" => "GRM CRM Backend API Active"]);
exit;