<?php
/**
 * Migration for In-CRM WebRTC Voice Calling & Call Recording Architecture
 * Adds voice_room_token, voice_connection_status, recording_chunks_count, client_user_agent
 * and ensures all tables for recording and audit logs exist.
 */
require_once __DIR__ . '/../config/db.php';
$pdo = getDbConnection();

if (!isset($pdo) || !$pdo) {
    die("Database connection failed\n");
}

try {
    echo "Starting WebRTC Voice System migration...\n";

    // 1. Update call_sessions table columns
    $cols = $pdo->query("SHOW COLUMNS FROM `call_sessions`")->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('voice_room_token', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `voice_room_token` VARCHAR(64) DEFAULT NULL AFTER `provider_call_id`");
        $pdo->exec("ALTER TABLE `call_sessions` ADD INDEX `idx_voice_room_token` (`voice_room_token`)");
        echo "- Added voice_room_token column and index to call_sessions\n";
    }

    if (!in_array('voice_connection_status', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `voice_connection_status` ENUM('PENDING', 'RINGING', 'CONNECTING', 'CONNECTED', 'DISCONNECTED', 'FAILED') DEFAULT 'PENDING' AFTER `status`");
        echo "- Added voice_connection_status column to call_sessions\n";
    }

    if (!in_array('recording_status', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `recording_status` ENUM('NOT_STARTED', 'RECORDING', 'PROCESSING', 'COMPLETED', 'FAILED') DEFAULT 'NOT_STARTED' AFTER `duration_seconds`");
        echo "- Added recording_status column to call_sessions\n";
    }

    if (!in_array('recording_chunks_count', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `recording_chunks_count` INT DEFAULT 0 AFTER `recording_status`");
        echo "- Added recording_chunks_count column to call_sessions\n";
    }

    if (!in_array('recording_consent_at', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `recording_consent_at` DATETIME DEFAULT NULL AFTER `recording_chunks_count`");
        echo "- Added recording_consent_at column to call_sessions\n";
    }

    if (!in_array('client_user_agent', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `client_user_agent` VARCHAR(255) DEFAULT NULL AFTER `recording_consent_at`");
        echo "- Added client_user_agent column to call_sessions\n";
    }

    // 2. Ensure call_recordings has room_token and recording_source
    $recCols = $pdo->query("SHOW COLUMNS FROM `call_recordings`")->fetchAll(PDO::FETCH_COLUMN);

    if (!in_array('room_token', $recCols)) {
        $pdo->exec("ALTER TABLE `call_recordings` ADD COLUMN `room_token` VARCHAR(64) DEFAULT NULL AFTER `call_id`");
        $pdo->exec("ALTER TABLE `call_recordings` ADD INDEX `idx_rec_room_token` (`room_token`)");
        echo "- Added room_token column to call_recordings\n";
    }

    if (!in_array('recording_source', $recCols)) {
        $pdo->exec("ALTER TABLE `call_recordings` ADD COLUMN `recording_source` VARCHAR(50) DEFAULT 'STAFF_BROWSER_MIX' AFTER `audio_format`");
        echo "- Added recording_source column to call_recordings\n";
    }

    // 3. Ensure storage directories exist
    $directories = [
        __DIR__ . '/../storage',
        __DIR__ . '/../storage/call-recordings',
        __DIR__ . '/../storage/call-recordings/temp',
        __DIR__ . '/../uploads',
        __DIR__ . '/../uploads/recordings'
    ];

    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0777, true);
            echo "- Created directory: " . basename($dir) . "\n";
        }
    }

    echo "WebRTC Voice System migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

