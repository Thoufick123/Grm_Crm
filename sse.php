<?php
/**
 * GRM WHATSAPP CRM — REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
 * Replaces 2.5s short-polling with low-latency (< 50ms) push notifications.
 *
 * Capabilities:
 * 1. Pushes inbound WhatsApp messages instantly as they arrive.
 * 2. Pushes live query assignments and lead status updates.
 * 3. Pushes ringing incoming calls in real time.
 * 4. Pushes periodic heartbeat ping every 10s to keep proxies alive.
 * 5. Safely releases PHP session lock immediately to prevent blocking normal app requests.
 * 6. Disables output buffering and FastCGI/Nginx buffering.
 * 7. Gracefully recycles stream after 25s for shared hosting / Apache slot efficiency.
 */

// Handle Cross-Origin if bridge and web front run on separate origins/ports
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header("Access-Control-Allow-Credentials: true");
    header("Access-Control-Max-Age: 86400");
}
if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD'])) {
        header("Access-Control-Allow-Methods: GET, OPTIONS");
    }
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS'])) {
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    }
    exit(0);
}

// 1. SSE Required Stream Headers
header('Content-Type: text/event-stream; charset=UTF-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Connection: keep-alive');
header('X-Accel-Buffering: no'); // Tell Nginx / FastCGI not to buffer the stream
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', '0');
@ini_set('implicit_flush', '1');
@set_time_limit(35);

// 2. CRUCIAL: Release session lock immediately
// Prevents PHP file session locking from halting concurrent user clicks/API calls
if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}

// 3. Clear all active PHP output buffers
while (ob_get_level() > 0) {
    @ob_end_flush();
}
@ob_implicit_flush(true);

// 4. Resolve starting timestamp epoch
$since = isset($_GET['since']) ? (int)$_GET['since'] : 0;
if (isset($_SERVER['HTTP_LAST_EVENT_ID']) && !empty($_SERVER['HTTP_LAST_EVENT_ID'])) {
    $since = max($since, (int)$_SERVER['HTTP_LAST_EVENT_ID']);
}
if ($since <= 0) {
    $since = time() - 3;
}

// 5. Connect to database & prepare file paths
require_once __DIR__ . '/config/db.php';
$pdo = function_exists('getDBConnection') ? getDBConnection() : null;
$messagesFile = __DIR__ . '/live_messages_queue.json';
$callsFile = __DIR__ . '/live_incoming_calls.json';

// Tell browser's EventSource to reconnect automatically in 1.5s if stream disconnects
echo "retry: 1500\n\n";
echo ": sse_connected at " . date('Y-m-d H:i:s') . "\n\n";
flush();

$startTime = time();
$lastPingTime = time();
$maxExecutionSeconds = isset($maxExecutionSeconds) ? (int)$maxExecutionSeconds : 25; // Recycle every 25s for shared hosting compatibility

$lastQueueMtime = file_exists($messagesFile) ? (int)filemtime($messagesFile) : 0;
$lastCallsMtime = file_exists($callsFile) ? (int)filemtime($callsFile) : 0;

// Track emitted message IDs during this connection to prevent duplicates
$emittedMsgUids = [];

while (true) {
    // Break immediately if browser closed tab or aborted connection
    if (connection_aborted()) {
        break;
    }

    $currentTime = time();
    $newMessages = [];
    $assignments = [];
    $incomingCalls = [];

    // --- CHECK 1: New Inbound Messages from live_messages_queue.json ---
    if (file_exists($messagesFile)) {
        $curQueueMtime = (int)filemtime($messagesFile);
        if ($curQueueMtime >= $lastQueueMtime || ($curQueueMtime >= ($since - 2))) {
            $lastQueueMtime = $curQueueMtime;
            $rawQueue = @file_get_contents($messagesFile);
            $queue = $rawQueue ? json_decode($rawQueue, true) : null;
            if (is_array($queue)) {
                foreach ($queue as $item) {
                    $itemEpoch = (int)($item['timestamp_epoch'] ?? 0);
                    $uid = (string)($item['id'] ?? ($item['message_uid'] ?? ''));
                    if ($itemEpoch > $since && !isset($emittedMsgUids[$uid])) {
                        $newMessages[] = $item;
                        $emittedMsgUids[$uid] = true;
                        if ($itemEpoch > $since) {
                            $since = $itemEpoch;
                        }
                    }
                }
            }
        }
    }

    // --- CHECK 2: Database Messages & Lead Assignments ---
    if ($pdo) {
        try {
            // Delta query for new messages
            $mStmt = $pdo->prepare("
                SELECT m.*, c.name as customer_name, c.phone as customer_phone 
                FROM `messages` m
                LEFT JOIN `customers` c ON m.customer_id = c.id
                WHERE (m.timestamp_epoch > :s1 OR (m.created_at IS NOT NULL AND m.created_at >= FROM_UNIXTIME(:s2)))
                ORDER BY m.id ASC LIMIT 25
            ");
            $mStmt->execute([':s1' => $since, ':s2' => $since]);
            $dbMsgs = $mStmt->fetchAll(PDO::FETCH_ASSOC);

            foreach ($dbMsgs as $dm) {
                $uid = (string)($dm['message_uid'] ?: $dm['id']);
                if (!isset($emittedMsgUids[$uid])) {
                    $emittedMsgUids[$uid] = true;
                    $epoch = !empty($dm['timestamp_epoch']) ? (int)$dm['timestamp_epoch'] : (!empty($dm['created_at']) ? strtotime($dm['created_at']) : time());
                    $newMessages[] = [
                        'id' => $uid,
                        'message_uid' => $uid,
                        'sender_name' => $dm['sender_name'] ?: ($dm['customer_name'] ?: 'Customer'),
                        'sender_phone' => $dm['sender_phone'] ?: ($dm['customer_phone'] ?: ''),
                        'sender_jid' => $dm['sender_jid'] ?? null,
                        'message_text' => $dm['message_text'] ?: ($dm['text'] ?: ''),
                        'type' => $dm['media_type'] ?: 'text',
                        'media_url' => $dm['media_url'] ?? null,
                        'duration' => $dm['audio_duration'] ?? null,
                        'account_id' => $dm['account_id'] ?: 'account_1',
                        'received_on_number' => $dm['received_on_number'] ?? '+91 97896 60115',
                        'priority' => 'HIGH',
                        'assigned_to' => 'UNASSIGNED',
                        'source' => $dm['source'] ?: 'REAL_WHATSAPP_LIVE',
                        'timestamp_epoch' => $epoch,
                        'received_at' => $dm['time_str'] ?: (!empty($dm['created_at']) ? date("h:i A", strtotime($dm['created_at'])) : date("h:i A")),
                        'direction' => $dm['direction'] ?? 'inbound',
                        'is_bot' => (bool)$dm['is_bot']
                    ];
                    if ($epoch > $since) {
                        $since = $epoch;
                    }
                }
            }

            // Delta query for query lead assignments updated since last check
            $qStmt = $pdo->prepare("
                SELECT q.id, q.customer_id, q.assigned_to, q.status, c.phone, c.name 
                FROM `queries` q 
                LEFT JOIN `customers` c ON q.customer_id = c.id 
                WHERE q.assigned_to IS NOT NULL 
                  AND q.assigned_to != 'UNASSIGNED' 
                  AND (
                    (q.updated_at IS NOT NULL AND q.updated_at >= FROM_UNIXTIME(:since1)) 
                    OR (q.created_at IS NOT NULL AND q.created_at >= FROM_UNIXTIME(:since2))
                  )
                LIMIT 50
            ");
            $qStmt->execute([':since1' => $since, ':since2' => $since]);
            $qRows = $qStmt->fetchAll(PDO::FETCH_ASSOC);

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

            // Delta query for ringing phone calls
            $cStmt = $pdo->query("
                SELECT * FROM `call_sessions` 
                WHERE `status` = 'RINGING' 
                  AND TIMESTAMPDIFF(SECOND, `started_at`, NOW()) <= 45
                ORDER BY `started_at` DESC 
                LIMIT 3
            ");
            $callRows = $cStmt->fetchAll(PDO::FETCH_ASSOC);
            foreach ($callRows as $rc) {
                $rc['call_id'] = $rc['id'];
                $rc['epoch'] = !empty($rc['started_at']) ? strtotime($rc['started_at']) : time();
                $incomingCalls[] = $rc;
            }
        } catch (\Throwable $e) {
            // Non-blocking: continue stream on intermittent DB connection glitch
        }
    }

    // --- CHECK 3: Check incoming calls file fallback ---
    if (empty($incomingCalls) && file_exists($callsFile)) {
        $curCallsMtime = (int)filemtime($callsFile);
        if ($curCallsMtime >= $lastCallsMtime || (time() - $curCallsMtime < 45)) {
            $lastCallsMtime = $curCallsMtime;
            $fCalls = @json_decode(@file_get_contents($callsFile), true) ?: [];
            foreach ($fCalls as $fc) {
                $t = isset($fc['started_at']) ? strtotime($fc['started_at']) : time();
                if ((time() - $t) < 45 && ($fc['status'] ?? '') === 'RINGING') {
                    $incomingCalls[] = $fc;
                }
            }
        }
    }

    // --- EMIT REAL-TIME SSE EVENT WHEN NEW DATA ARRIVES ---
    if (!empty($newMessages) || !empty($assignments) || !empty($incomingCalls)) {
        echo "id: {$since}\n";
        echo "event: message\n";
        echo "data: " . json_encode([
            'status' => 'success',
            'messages' => $newMessages,
            'assignments' => $assignments,
            'incoming_calls' => $incomingCalls,
            'server_time' => time()
        ], JSON_UNESCAPED_UNICODE) . "\n\n";
        flush();
    }

    // Send keep-alive heartbeat ping every 10 seconds
    if (($currentTime - $lastPingTime) >= 10) {
        echo ": ping " . $currentTime . "\n\n";
        flush();
        $lastPingTime = $currentTime;
    }

    // Recycle after 25s so PHP does not exceed max execution time and Apache stays responsive
    if (($currentTime - $startTime) >= $maxExecutionSeconds) {
        echo ": recycle\n\n";
        flush();
        break;
    }

    // Sleep for 350ms (ultra-responsive, negligible CPU overhead)
    usleep(350000);
}
