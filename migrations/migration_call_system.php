<?php
// Migration for Call System: call_recordings, call_staff_notes, call_recording_access_logs
require_once __DIR__ . '/../config/db.php';
$pdo = getDbConnection();

if (!isset($pdo) || !$pdo) {
    die("Database connection failed\n");
}

try {
    echo "Running Call System migrations...\n";

    // 1. Add target_staff_id, target_staff_name, notes to call_sessions if missing
    $cols = $pdo->query("SHOW COLUMNS FROM `call_sessions`")->fetchAll(PDO::FETCH_COLUMN);
    if (!in_array('target_staff_id', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `target_staff_id` VARCHAR(50) DEFAULT NULL AFTER `assigned_staff_name`");
        echo "- Added target_staff_id to call_sessions\n";
    }
    if (!in_array('target_staff_name', $cols)) {
        $pdo->exec("ALTER TABLE `call_sessions` ADD COLUMN `target_staff_name` VARCHAR(100) DEFAULT NULL AFTER `target_staff_id`");
        echo "- Added target_staff_name to call_sessions\n";
    }

    // 2. Create call_recordings table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `call_recordings` (
            `recording_id` VARCHAR(60) PRIMARY KEY,
            `call_id` VARCHAR(50) NOT NULL,
            `recording_reference` TEXT NOT NULL,
            `recording_status` ENUM('Processing', 'Completed', 'Failed') DEFAULT 'Completed',
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
    echo "- Table call_recordings created or already exists\n";

    // 3. Create call_staff_notes table
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
    echo "- Table call_staff_notes created or already exists\n";

    // 4. Create call_recording_access_logs table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `call_recording_access_logs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `recording_id` VARCHAR(60) DEFAULT NULL,
            `call_id` VARCHAR(50) NOT NULL,
            `actor_id` VARCHAR(50) NOT NULL,
            `actor_name` VARCHAR(100) DEFAULT NULL,
            `action_type` ENUM('STREAM_PLAY', 'DOWNLOAD', 'DELETE', 'EXPORT') NOT NULL,
            `ip_address` VARCHAR(50) DEFAULT NULL,
            `user_agent` TEXT DEFAULT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX(`recording_id`),
            INDEX(`call_id`),
            INDEX(`actor_id`),
            INDEX(`action_type`),
            INDEX(`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "- Table call_recording_access_logs created or already exists\n";

    // 5. Ensure uploads/recordings directory exists
    $recDir = __DIR__ . '/../uploads/recordings';
    if (!is_dir($recDir)) {
        mkdir($recDir, 0777, true);
        echo "- Created uploads/recordings directory\n";
    }

    echo "Migration completed successfully!\n";
} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
    exit(1);
}

