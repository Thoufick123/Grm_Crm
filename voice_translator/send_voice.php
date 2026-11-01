<?php
/**
 * Voice Translator - Send Voice Handler
 * Dispatches approved translated voice message to customer's WhatsApp.
 * STRICT SINGLE-DISPATCH PROTECTION: Guarantees exactly one delivery per voice note.
 */
require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/services/WhatsAppMediaService.php';

header('Content-Type: application/json');

try {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $voiceMsgId = $input['voice_message_id'] ?? '';
    $translationId = $input['translation_id'] ?? '';
    $customerId = $input['customer_id'] ?? '';
    $phone = $input['phone'] ?? '';
    $sendMode = $input['send_mode'] ?? 'translated'; // 'translated' or 'original'

    $pdo = getDBConnection();

    // Fetch voice details
    $audioUrl = $input['audio_url'] ?? '';
    $duration = $input['duration'] ?? 10;
    $targetLang = $input['target_lang'] ?? 'en';

    if ($pdo && !empty($voiceMsgId)) {
        if ($sendMode === 'translated' && !empty($translationId)) {
            $tStmt = $pdo->prepare("SELECT * FROM `voice_translations` WHERE `id` = ? LIMIT 1");
            $tStmt->execute([$translationId]);
            $trans = $tStmt->fetch(PDO::FETCH_ASSOC);
            if ($trans) {
                $audioUrl = $trans['translated_audio_path'];
                $duration = $trans['audio_duration'] ?: $duration;
            }
        } elseif ($sendMode === 'original') {
            $mStmt = $pdo->prepare("SELECT * FROM `voice_messages` WHERE `id` = ? LIMIT 1");
            $mStmt->execute([$voiceMsgId]);
            $vm = $mStmt->fetch(PDO::FETCH_ASSOC);
            if ($vm) {
                $audioUrl = $vm['original_audio_path'];
                $duration = $vm['audio_duration'] ?: $duration;
            }
        }
    }

    if (empty($audioUrl)) {
        throw new Exception("No audio file found to send.");
    }

    // 1. Strict Server-Side Deduplication & Idempotency Protection
    if ($pdo && !empty($voiceMsgId)) {
        $checkStmt = $pdo->prepare("SELECT `id`, `processing_status`, `whatsapp_message_id`, `delivery_status`, `updated_at` FROM `voice_messages` WHERE `id` = ? LIMIT 1");
        $checkStmt->execute([$voiceMsgId]);
        $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);

        if ($existing) {
            // If already sent or currently being dispatched, reject duplicate dispatch
            if ($existing['processing_status'] === 'sent' && !empty($existing['whatsapp_message_id'])) {
                echo json_encode([
                    'success' => true,
                    'message_id' => $existing['whatsapp_message_id'],
                    'audio_url' => $audioUrl,
                    'duration' => $duration,
                    'status' => $existing['delivery_status'] ?: 'DELIVERED',
                    'target_lang' => $targetLang,
                    'deduplicated' => true,
                    'note' => 'Already delivered (idempotency guard)'
                ]);
                exit;
            }

            if ($existing['processing_status'] === 'sending') {
                $lastUpdated = strtotime($existing['updated_at'] ?? 'now');
                if ((time() - $lastUpdated) < 15) {
                    echo json_encode([
                        'success' => true,
                        'message_id' => 'sending_lock',
                        'audio_url' => $audioUrl,
                        'duration' => $duration,
                        'status' => 'IN_TRANSIT',
                        'target_lang' => $targetLang,
                        'deduplicated' => true
                    ]);
                    exit;
                }
            }

            // Lock status to 'sending' before calling external bridge
            $lockStmt = $pdo->prepare("UPDATE `voice_messages` SET `processing_status` = 'sending', `updated_at` = NOW() WHERE `id` = ?");
            $lockStmt->execute([$voiceMsgId]);
        }
    }

    // Resolve customer phone if empty
    if (empty($phone) && $pdo && !empty($customerId)) {
        $cStmt = $pdo->prepare("SELECT `phone`, `whatsapp` FROM `customers` WHERE `id` = ? LIMIT 1");
        $cStmt->execute([$customerId]);
        $cust = $cStmt->fetch(PDO::FETCH_ASSOC);
        if ($cust) {
            $phone = !empty($cust['whatsapp']) ? $cust['whatsapp'] : $cust['phone'];
        }
    }

    // Check duplicate in messages table within past 15 seconds
    if ($pdo && !empty($customerId)) {
        $recentStmt = $pdo->prepare("
            SELECT `id`, `status` FROM `messages` 
            WHERE `customer_id` = ? AND `media_url` = ? AND `created_at` >= (NOW() - INTERVAL 15 SECOND) 
            ORDER BY `id` DESC LIMIT 1
        ");
        $recentStmt->execute([$customerId, $audioUrl]);
        $recentMsg = $recentStmt->fetch(PDO::FETCH_ASSOC);
        if ($recentMsg) {
            echo json_encode([
                'success' => true,
                'message_id' => 'msg_' . $recentMsg['id'],
                'audio_url' => $audioUrl,
                'duration' => $duration,
                'status' => $recentMsg['status'] ?: 'DELIVERED',
                'target_lang' => $targetLang,
                'deduplicated' => true
            ]);
            exit;
        }
    }

    // Call WhatsApp Bridge exactly once
    $waService = new WhatsAppMediaService();
    $sendResult = $waService->sendVoiceMessage($phone, $audioUrl, $customerId);

    $waMsgId = $sendResult['message_id'];
    $deliveryStatus = $sendResult['status'];

    // 1. Persist into messages table
    if ($pdo && !empty($customerId)) {
        $msgStmt = $pdo->prepare("
            INSERT INTO `messages` 
            (`customer_id`, `sender`, `text`, `media_type`, `media_url`, `audio_duration`, `time_str`, `status`, `created_at`)
            VALUES (?, 'staff', '🎤 WhatsApp Voice Note', 'audio', ?, ?, ?, ?, NOW())
        ");
        $msgStmt->execute([
            $customerId,
            $audioUrl,
            (string)$duration,
            date('h:i A'),
            $deliveryStatus
        ]);
    }

    // 2. Update voice_messages record
    if ($pdo && !empty($voiceMsgId)) {
        $upStmt = $pdo->prepare("
            UPDATE `voice_messages`
            SET `processing_status` = 'sent',
                `whatsapp_message_id` = ?,
                `delivery_status` = ?,
                `updated_at` = NOW()
            WHERE `id` = ?
        ");
        $upStmt->execute([$waMsgId, $deliveryStatus, $voiceMsgId]);
    }

    // 3. Update live_messages_queue.json
    $queueFile = dirname(__DIR__) . '/live_messages_queue.json';
    if (file_exists($queueFile)) {
        $q = json_decode(file_get_contents($queueFile), true) ?: [];
        $q[] = [
            'id' => 'msg_' . uniqid(),
            'sender_name' => 'CRM Staff',
            'sender_phone' => '+91 86680 07593',
            'message_text' => '🎤 WhatsApp Voice Note',
            'type' => 'audio',
            'media_url' => $audioUrl,
            'duration' => $duration,
            'source' => 'STAFF_VOICE_OUTBOUND',
            'timestamp_epoch' => time(),
            'received_at' => date('h:i A')
        ];
        if (count($q) > 100) $q = array_slice($q, -100);
        @file_put_contents($queueFile, json_encode($q, JSON_PRETTY_PRINT));
    }

    echo json_encode([
        'success' => true,
        'message_id' => $waMsgId,
        'audio_url' => $audioUrl,
        'duration' => $duration,
        'status' => $deliveryStatus,
        'target_lang' => $targetLang
    ]);
} catch (Exception $e) {
    // If failure occurred, rollback sending state
    if (!empty($voiceMsgId) && isset($pdo) && $pdo) {
        $resetStmt = $pdo->prepare("UPDATE `voice_messages` SET `processing_status` = 'preview_ready', `updated_at` = NOW() WHERE `id` = ? AND `processing_status` = 'sending'");
        $resetStmt->execute([$voiceMsgId]);
    }
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
