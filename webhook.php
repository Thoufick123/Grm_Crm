<?php
/**
 * GRM CRM — Meta WhatsApp Cloud API Webhook Ingestion Engine
 * Handles Meta Webhook Verification and Ingests Live Inbound WhatsApp Messages & Voice Notes
 */
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");

$configFile = __DIR__ . '/whatsapp_account_config.json';
$messagesFile = __DIR__ . '/live_messages_queue.json';
$logsFile = __DIR__ . '/webhook_logs.json';

// Fetch current configured account
$accountConfig = [
    "phone_number" => "+91 98765 43210",
    "webhook_verify_token" => "GRM_WHATSAPP_SECRET_VERIFY_TOKEN_2026"
];
if (file_exists($configFile)) {
    $accountConfig = json_decode(file_get_contents($configFile), true) ?: $accountConfig;
}

// 1. Meta Webhook Verification Handshake (GET)
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $mode = $_GET['hub_mode'] ?? '';
    $token = $_GET['hub_verify_token'] ?? '';
    $challenge = $_GET['hub_challenge'] ?? '';

    $expectedToken = $accountConfig['webhook_verify_token'] ?? 'GRM_WHATSAPP_SECRET_VERIFY_TOKEN_2026';

    if ($mode === 'subscribe' && $token === $expectedToken) {
        http_response_code(200);
        echo $challenge;
        exit;
    } else {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Invalid verification token"]);
        exit;
    }
}

// 2. Incoming WhatsApp Message Ingestion (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $payload = json_decode($input, true);

    // Save raw webhook log
    $logEntry = [
        "timestamp" => date("Y-m-d H:i:s"),
        "raw_payload" => $payload
    ];
    @file_put_contents($logsFile, json_encode($logEntry, JSON_PRETTY_PRINT) . PHP_EOL, FILE_APPEND);

    // Parse Standard Meta WhatsApp Cloud API Payload
    $parsedMessages = [];
    if (!empty($payload['entry'])) {
        foreach ($payload['entry'] as $entry) {
            if (!empty($entry['changes'])) {
                foreach ($entry['changes'] as $change) {
                    $value = $change['value'] ?? [];
                    $businessPhone = $value['metadata']['display_phone_number'] ?? $accountConfig['phone_number'];

                    if (!empty($value['messages'])) {
                        foreach ($value['messages'] as $msg) {
                            $from = $msg['from'] ?? '';
                            $senderName = $value['contacts'][0]['profile']['name'] ?? ('WhatsApp Customer ' . substr($from, -4));
                            $msgId = $msg['id'] ?? ('wamid_' . uniqid());
                            $msgType = $msg['type'] ?? 'text';
                            $msgText = '';
                            $mediaUrl = null;

                            if ($msgType === 'text') {
                                $msgText = $msg['text']['body'] ?? '';
                            } elseif ($msgType === 'image') {
                                $msgText = '[Photo Attached] ' . ($msg['image']['caption'] ?? '');
                                $mediaUrl = $msg['image']['id'] ?? null;
                            } elseif ($msgType === 'audio' || $msgType === 'voice') {
                                $msgText = '[Voice Note]';
                                $mediaUrl = $msg['audio']['id'] ?? ($msg['voice']['id'] ?? null);
                                $msgType = 'audio';
                            } else {
                                $msgText = "[{$msgType} message]";
                            }

                            $parsedMessages[] = [
                                "id" => $msgId,
                                "sender_phone" => '+' . ltrim($from, '+'),
                                "sender_name" => $senderName,
                                "destination_business_phone" => $businessPhone,
                                "message_text" => $msgText,
                                "type" => $msgType,
                                "media_url" => $mediaUrl,
                                "timestamp_epoch" => time(),
                                "received_at" => date("Y-m-d H:i:s"),
                                "source" => "META_WEBHOOK"
                            ];
                        }
                    }
                }
            }
        }
    }

    // If parsed messages exist, append to live messages queue
    if (!empty($parsedMessages)) {
        $messages = [];
        if (file_exists($messagesFile)) {
            $messages = json_decode(file_get_contents($messagesFile), true) ?: [];
        }

        foreach ($parsedMessages as $pm) {
            $messages[] = $pm;
        }

        if (count($messages) > 100) {
            $messages = array_slice($messages, -100);
        }

        file_put_contents($messagesFile, json_encode($messages, JSON_PRETTY_PRINT));
    }

    http_response_code(200);
    echo json_encode(["status" => "success", "processed" => count($parsedMessages)]);
    exit;
}
