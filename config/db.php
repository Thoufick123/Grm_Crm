<?php
/**
 * GRM WHATSAPP CRM — DATABASE CONNECTION & AUTO-MIGRATION ENGINE
 * Connects to XAMPP MySQL (localhost, root, empty password)
 * Automatically creates database `grm_crm_db` and all necessary tables & seed records on first run.
 */

// Load .env configuration file if present, with container/system environment variables taking highest priority
function loadEnvConfig() {
    $envFile = dirname(__DIR__) . '/.env';
    $env = [
        'DB_HOST' => '127.0.0.1',
        'DB_USER' => 'root',
        'DB_PASS' => '',
        'DB_NAME' => 'grm_crm_db',
        'DB_PORT' => '3306',
        'BRIDGE_URL' => 'http://localhost:3000',
        'APP_URL' => 'http://localhost:8080'
    ];

    // 1. Read .env file if it exists
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            $line = trim($line);
            if (empty($line) || str_starts_with($line, '#')) continue;
            if (strpos($line, '=') !== false) {
                list($key, $val) = explode('=', $line, 2);
                $key = trim($key);
                $val = trim($val);
                // Remove surrounding quotes if any
                $val = trim($val, "\"'");
                $env[$key] = $val;
            }
        }
    }

    // 2. Container / System Environment Variables take highest priority (e.g. from Docker Compose)
    foreach ($env as $key => $defaultVal) {
        $serverVal = getenv($key);
        if ($serverVal !== false && $serverVal !== '') {
            $env[$key] = $serverVal;
        } elseif (!empty($_SERVER[$key])) {
            $env[$key] = $_SERVER[$key];
        } elseif (!empty($_ENV[$key])) {
            $env[$key] = $_ENV[$key];
        }
    }

    return $env;
}

$envConfig = loadEnvConfig();
define('DB_HOST', $envConfig['DB_HOST']);
define('DB_USER', $envConfig['DB_USER']);
define('DB_PASS', $envConfig['DB_PASS']);
define('DB_NAME', $envConfig['DB_NAME']);
define('DB_PORT', (int)$envConfig['DB_PORT']);
define('BRIDGE_URL', $envConfig['BRIDGE_URL'] ?? 'http://localhost:3000');
define('APP_URL', $envConfig['APP_URL'] ?? 'http://localhost:8080');

function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $hosts = [DB_HOST];
    if (DB_HOST === 'crm-db') {
        $hosts[] = 'grm_crm_mariadb';
    } elseif (DB_HOST === '127.0.0.1' || DB_HOST === 'localhost') {
        $hosts[] = '127.0.0.1';
        $hosts[] = 'localhost';
    } else {
        $hosts[] = '127.0.0.1';
    }

    foreach (array_unique($hosts) as $host) {
        try {
            // 1. Try connecting directly to the target database first
            try {
                $pdo = new PDO(
                    "mysql:host=" . $host . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::ATTR_TIMEOUT => 2,
                    ]
                );
            } catch (PDOException $dbNotFound) {
                // 2. If database doesn't exist yet, connect to server and create it
                $initPdo = new PDO(
                    "mysql:host=" . $host . ";port=" . DB_PORT . ";charset=utf8mb4",
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::ATTR_TIMEOUT => 2,
                    ]
                );

                $initPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

                $pdo = new PDO(
                    "mysql:host=" . $host . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                    DB_USER,
                    DB_PASS,
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                        PDO::ATTR_TIMEOUT => 2,
                    ]
                );
            }

            // 3. Ensure tables and default seeds exist
            initializeDatabaseSchema($pdo);

            return $pdo;
        } catch (PDOException $e) {
            error_log("Database Connection Error on $host: " . $e->getMessage());
        }
    }

    return null;
}

function initializeDatabaseSchema($pdo) {
    if (!$pdo) return;

    // 1. Users & Staff Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `users` (
            `id` VARCHAR(50) PRIMARY KEY,
            `username` VARCHAR(50) UNIQUE NOT NULL,
            `password` VARCHAR(255) NOT NULL,
            `name` VARCHAR(100) NOT NULL,
            `role` VARCHAR(100) NOT NULL,
            `email` VARCHAR(100) NULL,
            `phone` VARCHAR(30) NULL,
            `specialization` VARCHAR(100) NULL,
            `avatar` VARCHAR(10) NULL,
            `status` ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE') DEFAULT 'ACTIVE',
            `active_queries` INT DEFAULT 0,
            `converted` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 2. WhatsApp Accounts Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `whatsapp_accounts` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `account_slot` VARCHAR(50) UNIQUE NOT NULL,
            `business_name` VARCHAR(100) NOT NULL,
            `display_name` VARCHAR(100) NOT NULL,
            `brand_name` VARCHAR(100) DEFAULT 'Blue Berry 💙',
            `phone_number` VARCHAR(30) NOT NULL,
            `phone_number_id` VARCHAR(100) NULL,
            `waba_id` VARCHAR(100) NULL,
            `provider` VARCHAR(50) DEFAULT 'META_CLOUD_API',
            `status` VARCHAR(50) DEFAULT 'CONNECTED',
            `webhook_url` VARCHAR(255) NULL,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 3. Customers Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `customers` (
            `id` VARCHAR(50) PRIMARY KEY,
            `code` VARCHAR(50) UNIQUE NOT NULL,
            `name` VARCHAR(100) NOT NULL,
            `phone` VARCHAR(30) NOT NULL,
            `whatsapp` VARCHAR(30) NOT NULL,
            `address` TEXT NULL,
            `city` VARCHAR(50) NULL,
            `customer_type` VARCHAR(50) DEFAULT 'New WhatsApp Customer',
            `tags` TEXT NULL,
            `total_orders` INT DEFAULT 0,
            `total_spend` DECIMAL(10,2) DEFAULT 0.00,
            `avatar` VARCHAR(10) NULL,
            `is_dnd` TINYINT(1) DEFAULT 0,
            `dnd_reason` TEXT NULL,
            `dnd_notes` TEXT NULL,
            `dnd_marked_by` VARCHAR(100) NULL,
            `dnd_timestamp` VARCHAR(50) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 4. Inquiries / Leads Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `queries` (
            `id` VARCHAR(50) PRIMARY KEY,
            `customer_id` VARCHAR(50) NOT NULL,
            `assigned_to` VARCHAR(50) DEFAULT 'UNASSIGNED',
            `status` VARCHAR(50) DEFAULT 'NEW',
            `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
            `query_text` TEXT NULL,
            `product_sku` VARCHAR(50) NULL,
            `unread_count` INT DEFAULT 0,
            `last_message` TEXT NULL,
            `status_notes` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 5. Chat Conversations & Messages Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `messages` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `message_uid` VARCHAR(100) UNIQUE NULL,
            `customer_id` VARCHAR(50) NOT NULL,
            `sender` ENUM('customer', 'staff', 'system') NOT NULL,
            `text` TEXT NOT NULL,
            `media_type` VARCHAR(30) NULL,
            `media_url` TEXT NULL,
            `audio_duration` VARCHAR(20) NULL,
            `time_str` VARCHAR(30) NULL,
            `status` ENUM('SENT', 'DELIVERED', 'READ') DEFAULT 'DELIVERED',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`customer_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 6. Products Catalog Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `products` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `sku` VARCHAR(50) UNIQUE NOT NULL,
            `name` VARCHAR(150) NOT NULL,
            `category` VARCHAR(50) NOT NULL,
            `subcategory` VARCHAR(100) NULL,
            `size` VARCHAR(50) NOT NULL,
            `color` VARCHAR(50) NOT NULL,
            `fabric` VARCHAR(100) NULL,
            `specifications` TEXT NULL,
            `price` DECIMAL(10,2) NOT NULL,
            `mrp` DECIMAL(10,2) NULL,
            `physical_stock` INT DEFAULT 0,
            `reserved_stock` INT DEFAULT 0,
            `image` TEXT NULL,
            `description` TEXT NULL,
            `custom_caption` TEXT NULL,
            `account_id` VARCHAR(50) DEFAULT 'account_1',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Dynamic Alter table to ensure new columns exist if table was already created
    try {
        $existingCols = $pdo->query("SHOW COLUMNS FROM `products`")->fetchAll(PDO::FETCH_COLUMN);
        $colDefs = [
            'subcategory'    => "ALTER TABLE `products` ADD COLUMN `subcategory` VARCHAR(100) NULL AFTER `category`",
            'fabric'         => "ALTER TABLE `products` ADD COLUMN `fabric` VARCHAR(100) NULL AFTER `color`",
            'mrp'            => "ALTER TABLE `products` ADD COLUMN `mrp` DECIMAL(10,2) NULL AFTER `price`",
            'description'    => "ALTER TABLE `products` ADD COLUMN `description` TEXT NULL AFTER `image`",
            'specifications' => "ALTER TABLE `products` ADD COLUMN `specifications` TEXT NULL AFTER `fabric`",
            'custom_caption' => "ALTER TABLE `products` ADD COLUMN `custom_caption` TEXT NULL AFTER `description`",
            'account_id'     => "ALTER TABLE `products` ADD COLUMN `account_id` VARCHAR(50) DEFAULT 'account_1' AFTER `custom_caption`"
        ];
        foreach ($colDefs as $cName => $sql) {
            if (!in_array($cName, $existingCols)) {
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        error_log("Product migration note: " . $e->getMessage());
    }

    // 6.1 Categories Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `categories` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `name` VARCHAR(100) NOT NULL,
            `slug` VARCHAR(100) UNIQUE NOT NULL,
            `icon` VARCHAR(50) DEFAULT 'checkroom',
            `description` TEXT NULL,
            `display_order` INT DEFAULT 0,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 6.2 Subcategories Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `subcategories` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `category_id` INT NULL,
            `category_name` VARCHAR(100) NOT NULL,
            `name` VARCHAR(100) NOT NULL,
            `slug` VARCHAR(100) NOT NULL,
            `sku_prefix` VARCHAR(20) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 6.3 Attributes Table (Sizes, Colors, Fabrics, Specifications)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `attributes` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `type` VARCHAR(50) NOT NULL,
            `value` VARCHAR(150) NOT NULL,
            `extra` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`type`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 7. Orders Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `orders` (
            `id` VARCHAR(50) PRIMARY KEY,
            `query_id` VARCHAR(50) NULL,
            `customer_id` VARCHAR(50) NOT NULL,
            `customer_name` VARCHAR(100) NOT NULL,
            `items_json` JSON NOT NULL,
            `grand_total` DECIMAL(10,2) NOT NULL,
            `shipping_amount` DECIMAL(10,2) DEFAULT 0.00,
            `advance_payment` DECIMAL(10,2) DEFAULT 0.00,
            `balance_amount` DECIMAL(10,2) DEFAULT 0.00,
            `payment_method` VARCHAR(50) DEFAULT 'COD',
            `payment_status` VARCHAR(30) DEFAULT 'PENDING',
            `order_status` VARCHAR(30) DEFAULT 'PROCESSING',
            `created_by` VARCHAR(100) NULL,
            `notes` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Dynamic Alter for Orders Table
    try {
        $existingOrderCols = $pdo->query("SHOW COLUMNS FROM `orders`")->fetchAll(PDO::FETCH_COLUMN);
        $orderColDefs = [
            'shipping_amount' => "ALTER TABLE `orders` ADD COLUMN `shipping_amount` DECIMAL(10,2) DEFAULT 0.00 AFTER `grand_total`",
            'advance_payment' => "ALTER TABLE `orders` ADD COLUMN `advance_payment` DECIMAL(10,2) DEFAULT 0.00 AFTER `shipping_amount`",
            'balance_amount' => "ALTER TABLE `orders` ADD COLUMN `balance_amount` DECIMAL(10,2) DEFAULT 0.00 AFTER `advance_payment`",
            'notes'          => "ALTER TABLE `orders` ADD COLUMN `notes` TEXT NULL AFTER `created_by`"
        ];
        foreach ($orderColDefs as $cName => $sql) {
            if (!in_array($cName, $existingOrderCols)) {
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        error_log("Orders migration note: " . $e->getMessage());
    }

    // Dynamic Alter for Customers Table
    try {
        $existingCustCols = $pdo->query("SHOW COLUMNS FROM `customers`")->fetchAll(PDO::FETCH_COLUMN);
        $custColDefs = [
            'is_dnd'      => "ALTER TABLE `customers` ADD COLUMN `is_dnd` TINYINT(1) DEFAULT 0 AFTER `avatar`",
            'notes'       => "ALTER TABLE `customers` ADD COLUMN `notes` TEXT NULL AFTER `is_dnd`",
            'alt_phone'   => "ALTER TABLE `customers` ADD COLUMN `alt_phone` VARCHAR(30) NULL AFTER `whatsapp`",
            'alt_address' => "ALTER TABLE `customers` ADD COLUMN `alt_address` TEXT NULL AFTER `address`"
        ];
        foreach ($custColDefs as $cName => $sql) {
            if (!in_array($cName, $existingCustCols)) {
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        error_log("Customers migration note: " . $e->getMessage());
    }

    // 8. Follow-ups Table (Full Lifecycle Tracking & Outcomes)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `followups` (
            `id` VARCHAR(50) PRIMARY KEY,
            `query_id` VARCHAR(50) NULL,
            `rescheduled_from_id` VARCHAR(50) NULL,
            `customer_id` VARCHAR(50) NOT NULL,
            `customer_name` VARCHAR(100) NOT NULL,
            `assigned_to` VARCHAR(50) NOT NULL,
            `date_str` VARCHAR(50) NOT NULL,
            `time_str` VARCHAR(50) NOT NULL,
            `reason` TEXT NOT NULL,
            `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
            `outcome` ENUM('PENDING', 'INTERESTED', 'NO_RESPONSE', 'FOLLOWUP_AGAIN', 'ORDER_PLACED', 'LOST') DEFAULT 'PENDING',
            `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
            `contact_channel` ENUM('WHATSAPP', 'CALL', 'STORE_VISIT') DEFAULT 'WHATSAPP',
            `outcome_notes` TEXT NULL,
            `completed_at` DATETIME NULL,
            `is_payment_pending` TINYINT(1) NOT NULL DEFAULT 0,
            `payment_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `shipping_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `payment_mode` VARCHAR(50) NULL DEFAULT 'UPI',
            `advance_payment` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            `payment_due_date` VARCHAR(50) NULL,
            `payment_notes` TEXT NULL,
            `quoted_items` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Dynamic Alter for Follow-ups & Queries Schema Migration
    try {
        $existingFuCols = $pdo->query("SHOW COLUMNS FROM `followups`")->fetchAll(PDO::FETCH_COLUMN);
        $fuColDefs = [
            'rescheduled_from_id' => "ALTER TABLE `followups` ADD COLUMN `rescheduled_from_id` VARCHAR(50) NULL AFTER `query_id`",
            'outcome'             => "ALTER TABLE `followups` ADD COLUMN `outcome` ENUM('PENDING', 'INTERESTED', 'NO_RESPONSE', 'FOLLOWUP_AGAIN', 'ORDER_PLACED', 'LOST') DEFAULT 'PENDING' AFTER `status`",
            'priority'            => "ALTER TABLE `followups` ADD COLUMN `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL' AFTER `outcome`",
            'contact_channel'     => "ALTER TABLE `followups` ADD COLUMN `contact_channel` ENUM('WHATSAPP', 'CALL', 'STORE_VISIT') DEFAULT 'WHATSAPP' AFTER `priority`",
            'outcome_notes'       => "ALTER TABLE `followups` ADD COLUMN `outcome_notes` TEXT NULL AFTER `reason`",
            'completed_at'        => "ALTER TABLE `followups` ADD COLUMN `completed_at` DATETIME NULL AFTER `outcome_notes`",
            'is_payment_pending'  => "ALTER TABLE `followups` ADD COLUMN `is_payment_pending` TINYINT(1) NOT NULL DEFAULT 0",
            'payment_amount'      => "ALTER TABLE `followups` ADD COLUMN `payment_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
            'shipping_amount'     => "ALTER TABLE `followups` ADD COLUMN `shipping_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `payment_amount`",
            'payment_mode'        => "ALTER TABLE `followups` ADD COLUMN `payment_mode` VARCHAR(50) NULL DEFAULT 'UPI'",
            'advance_payment'     => "ALTER TABLE `followups` ADD COLUMN `advance_payment` DECIMAL(10,2) NOT NULL DEFAULT 0.00 AFTER `payment_mode`",
            'payment_due_date'    => "ALTER TABLE `followups` ADD COLUMN `payment_due_date` VARCHAR(50) NULL",
            'payment_notes'       => "ALTER TABLE `followups` ADD COLUMN `payment_notes` TEXT NULL",
            'quoted_items'        => "ALTER TABLE `followups` ADD COLUMN `quoted_items` TEXT NULL"
        ];
        foreach ($fuColDefs as $cName => $sql) {
            if (!in_array($cName, $existingFuCols)) {
                $pdo->exec($sql);
            }
        }

        // Ensure queries table status supports FOLLOW_UP, CONVERTED, LOST, DND and has all payment/callback fields
        $pdo->exec("ALTER TABLE `queries` MODIFY COLUMN `status` VARCHAR(50) DEFAULT 'NEW'");
        $existingQueryCols = $pdo->query("SHOW COLUMNS FROM `queries`")->fetchAll(PDO::FETCH_COLUMN);
        $queryColDefs = [
            'status_notes'        => "ALTER TABLE `queries` ADD COLUMN `status_notes` TEXT NULL AFTER `last_message`",
            'is_payment_pending'  => "ALTER TABLE `queries` ADD COLUMN `is_payment_pending` TINYINT(1) NOT NULL DEFAULT 0",
            'payment_amount'      => "ALTER TABLE `queries` ADD COLUMN `payment_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
            'shipping_amount'     => "ALTER TABLE `queries` ADD COLUMN `shipping_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
            'payment_mode'        => "ALTER TABLE `queries` ADD COLUMN `payment_mode` VARCHAR(50) NULL DEFAULT 'UPI'",
            'advance_payment'     => "ALTER TABLE `queries` ADD COLUMN `advance_payment` DECIMAL(10,2) NOT NULL DEFAULT 0.00",
            'payment_due_date'    => "ALTER TABLE `queries` ADD COLUMN `payment_due_date` VARCHAR(50) NULL",
            'payment_notes'       => "ALTER TABLE `queries` ADD COLUMN `payment_notes` TEXT NULL",
            'quoted_items'        => "ALTER TABLE `queries` ADD COLUMN `quoted_items` TEXT NULL",
            'callback_date'       => "ALTER TABLE `queries` ADD COLUMN `callback_date` VARCHAR(50) NULL",
            'callback_time'       => "ALTER TABLE `queries` ADD COLUMN `callback_time` VARCHAR(50) NULL DEFAULT '11:00 AM'",
            'status_history'      => "ALTER TABLE `queries` ADD COLUMN `status_history` JSON NULL"
        ];
        foreach ($queryColDefs as $cName => $sql) {
            if (!in_array($cName, $existingQueryCols)) {
                $pdo->exec($sql);
            }
        }

        // Ensure customers table has DND tracking columns
        $existingCustCols = $pdo->query("SHOW COLUMNS FROM `customers`")->fetchAll(PDO::FETCH_COLUMN);
        $custColDefs = [
            'is_dnd'        => "ALTER TABLE `customers` ADD COLUMN `is_dnd` TINYINT(1) DEFAULT 0",
            'dnd_reason'    => "ALTER TABLE `customers` ADD COLUMN `dnd_reason` TEXT NULL",
            'dnd_notes'     => "ALTER TABLE `customers` ADD COLUMN `dnd_notes` TEXT NULL",
            'dnd_marked_by' => "ALTER TABLE `customers` ADD COLUMN `dnd_marked_by` VARCHAR(100) NULL",
            'dnd_timestamp' => "ALTER TABLE `customers` ADD COLUMN `dnd_timestamp` VARCHAR(50) NULL"
        ];
        foreach ($custColDefs as $cName => $sql) {
            if (!in_array($cName, $existingCustCols)) {
                $pdo->exec($sql);
            }
        }

        // Ensure orders table has rich ecommerce and staff assignment columns
        $existingOrderCols = $pdo->query("SHOW COLUMNS FROM `orders`")->fetchAll(PDO::FETCH_COLUMN);
        $orderColDefs = [
            'customer_phone'     => "ALTER TABLE `orders` ADD COLUMN `customer_phone` VARCHAR(30) NULL AFTER `customer_name`",
            'shipping_address'   => "ALTER TABLE `orders` ADD COLUMN `shipping_address` TEXT NULL AFTER `customer_phone`",
            'staff_id'           => "ALTER TABLE `orders` ADD COLUMN `staff_id` VARCHAR(50) NULL AFTER `created_by`",
            'staff_name'         => "ALTER TABLE `orders` ADD COLUMN `staff_name` VARCHAR(100) NULL AFTER `staff_id`",
            'upi_transaction_id' => "ALTER TABLE `orders` ADD COLUMN `upi_transaction_id` VARCHAR(100) NULL AFTER `payment_status`",
            'payment_screenshot' => "ALTER TABLE `orders` ADD COLUMN `payment_screenshot` LONGTEXT NULL AFTER `upi_transaction_id`",
            'cod_advance'        => "ALTER TABLE `orders` ADD COLUMN `cod_advance` DECIMAL(10,2) DEFAULT 0.00 AFTER `grand_total`",
            'cod_balance_due'    => "ALTER TABLE `orders` ADD COLUMN `cod_balance_due` DECIMAL(10,2) DEFAULT 0.00 AFTER `cod_advance`",
            'tracking_number'    => "ALTER TABLE `orders` ADD COLUMN `tracking_number` VARCHAR(100) NULL AFTER `order_status`",
            'courier_name'       => "ALTER TABLE `orders` ADD COLUMN `courier_name` VARCHAR(100) NULL AFTER `tracking_number`",
            'shipping_url'       => "ALTER TABLE `orders` ADD COLUMN `shipping_url` TEXT NULL AFTER `courier_name`"
        ];
        foreach ($orderColDefs as $cName => $sql) {
            if (!in_array($cName, $existingOrderCols)) {
                $pdo->exec($sql);
            }
        }
        $pdo->exec("ALTER TABLE `orders` MODIFY COLUMN `order_status` VARCHAR(50) DEFAULT 'PLACED'");
    } catch (Exception $e) {
        error_log("Schema migration note: " . $e->getMessage());
    }

    // 9. Audit Logs Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `audit_logs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `user` VARCHAR(100) NOT NULL,
            `action` VARCHAR(100) NOT NULL,
            `module` VARCHAR(100) NOT NULL,
            `details` TEXT NOT NULL,
            `timestamp_str` VARCHAR(50) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 10. Dedicated DND Management & Suppression List Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `dnd_records` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `customer_id` VARCHAR(50) NOT NULL,
            `customer_name` VARCHAR(100) NULL,
            `phone` VARCHAR(30) NULL,
            `whatsapp` VARCHAR(30) NULL,
            `query_id` VARCHAR(50) NULL,
            `reason` TEXT NULL,
            `notes` TEXT NULL,
            `marked_by` VARCHAR(100) DEFAULT 'Super Admin',
            `assigned_to` VARCHAR(50) DEFAULT 'UNASSIGNED',
            `status` ENUM('ACTIVE', 'REVOKED') DEFAULT 'ACTIVE',
            `dnd_timestamp` VARCHAR(50) NULL,
            `revoked_at` DATETIME NULL,
            `revoked_by` VARCHAR(100) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(`customer_id`),
            INDEX(`status`),
            INDEX(`assigned_to`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 11. Auto-Reply Rules Table (For Auto-Reply Hub in WhatsApp Inbox)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `auto_reply_rules` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(150) NOT NULL,
            `keywords` TEXT NOT NULL,
            `action_type` VARCHAR(50) DEFAULT 'custom_text',
            `category_id` VARCHAR(50) NULL,
            `reply_text` TEXT NOT NULL,
            `enabled` TINYINT(1) DEFAULT 1,
            `auto_send` TINYINT(1) DEFAULT 1,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 12. Broadcast Templates Table (For Broadcast Templates in WhatsApp Inbox)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `broadcast_templates` (
            `id` VARCHAR(50) PRIMARY KEY,
            `name` VARCHAR(150) NOT NULL,
            `category` VARCHAR(50) DEFAULT 'MARKETING',
            `body_text` TEXT NOT NULL,
            `image_url` TEXT NULL,
            `button_type` VARCHAR(50) NULL,
            `button_text` VARCHAR(100) NULL,
            `button_url` TEXT NULL,
            `status` VARCHAR(30) DEFAULT 'ACTIVE',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 13. Staff KPI Reports Table (For Staff KPI & Reports)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `staff_kpis` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `staff_id` VARCHAR(50) NOT NULL,
            `report_date` DATE NOT NULL,
            `chats_handled` INT DEFAULT 0,
            `orders_booked` INT DEFAULT 0,
            `total_sales_value` DECIMAL(10,2) DEFAULT 0.00,
            `followups_completed` INT DEFAULT 0,
            `avg_response_time_minutes` DECIMAL(5,2) DEFAULT 0.00,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`staff_id`),
            INDEX(`report_date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 14. Call Masking Settings Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `masking_settings` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `call_masking_enabled` TINYINT(1) DEFAULT 1,
            `chat_masking_enabled` TINYINT(1) DEFAULT 1,
            `call_timeout_seconds` INT DEFAULT 30,
            `fallback_strategy` VARCHAR(50) DEFAULT 'RETURN_TO_POOL',
            `virtual_company_number` VARCHAR(30) DEFAULT '+91 8000 123 456',
            `eligible_staff_ids` TEXT DEFAULT NULL,
            `recording_enabled` TINYINT(1) DEFAULT 1,
            `simultaneous_ring_limit` INT DEFAULT 5,
            `updated_by` VARCHAR(100) DEFAULT 'Super Admin',
            `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 15. Call Sessions Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `call_sessions` (
            `id` VARCHAR(50) PRIMARY KEY,
            `provider_call_id` VARCHAR(100) DEFAULT NULL,
            `customer_id` VARCHAR(50) DEFAULT NULL,
            `customer_name` VARCHAR(100) NOT NULL,
            `customer_phone` VARCHAR(30) NOT NULL,
            `masked_phone` VARCHAR(30) NOT NULL,
            `virtual_number` VARCHAR(30) DEFAULT NULL,
            `assigned_staff_id` VARCHAR(50) DEFAULT NULL,
            `assigned_staff_name` VARCHAR(100) DEFAULT NULL,
            `status` ENUM('RINGING','CLAIMED','ASSIGNED','CONNECTED','COMPLETED','MISSED','REJECTED','TIMEOUT') DEFAULT 'RINGING',
            `started_at` DATETIME DEFAULT NULL,
            `answered_at` DATETIME DEFAULT NULL,
            `ended_at` DATETIME DEFAULT NULL,
            `duration_seconds` INT DEFAULT 0,
            `outcome` VARCHAR(50) DEFAULT 'PENDING',
            `outcome_notes` TEXT DEFAULT NULL,
            `recording_url` TEXT DEFAULT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX(`status`),
            INDEX(`assigned_staff_id`),
            INDEX(`customer_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 16. Call Assignments Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `call_assignments` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `call_session_id` VARCHAR(50) NOT NULL,
            `staff_id` VARCHAR(50) NOT NULL,
            `staff_name` VARCHAR(100) DEFAULT NULL,
            `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
            `released_at` DATETIME DEFAULT NULL,
            `assignment_status` ENUM('OFFERED','ACCEPTED','TIMEOUT','REJECTED','RELEASED') DEFAULT 'OFFERED',
            INDEX(`call_session_id`),
            INDEX(`staff_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 17. Call Activity Logs Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `call_activity_logs` (
            `id` INT AUTO_INCREMENT PRIMARY KEY,
            `call_session_id` VARCHAR(50) NOT NULL,
            `actor_id` VARCHAR(50) NOT NULL,
            `actor_name` VARCHAR(100) DEFAULT NULL,
            `action` VARCHAR(100) NOT NULL,
            `notes` TEXT DEFAULT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            INDEX(`call_session_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Dynamic Alter for Customers (Email, Gender, Age)
    try {
        $existingCustCols = $pdo->query("SHOW COLUMNS FROM `customers`")->fetchAll(PDO::FETCH_COLUMN);
        $custExtraCols = [
            'email'  => "ALTER TABLE `customers` ADD COLUMN `email` VARCHAR(100) NULL AFTER `whatsapp`",
            'gender' => "ALTER TABLE `customers` ADD COLUMN `gender` VARCHAR(20) NULL AFTER `email`",
            'age'    => "ALTER TABLE `customers` ADD COLUMN `age` VARCHAR(20) NULL AFTER `gender`"
        ];
        foreach ($custExtraCols as $cName => $sql) {
            if (!in_array($cName, $existingCustCols)) {
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        error_log("Customer extra columns migration note: " . $e->getMessage());
    }

    // Dynamic Alter for Audit Logs (IP Address)
    try {
        $existingAuditCols = $pdo->query("SHOW COLUMNS FROM `audit_logs`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('ip_address', $existingAuditCols)) {
            $pdo->exec("ALTER TABLE `audit_logs` ADD COLUMN `ip_address` VARCHAR(50) NULL AFTER `timestamp_str`");
        }
    } catch (Exception $e) {}

    // Auto-sync existing DND entries into dnd_records if empty
    try {
        $pdo->exec("
            INSERT INTO `dnd_records` (`customer_id`, `customer_name`, `phone`, `whatsapp`, `query_id`, `reason`, `notes`, `marked_by`, `assigned_to`, `status`, `dnd_timestamp`)
            SELECT 
                c.`id` AS `customer_id`,
                c.`name` AS `customer_name`,
                c.`phone` AS `phone`,
                c.`whatsapp` AS `whatsapp`,
                q.`id` AS `query_id`,
                COALESCE(c.`dnd_reason`, q.`status_notes`, 'Customer not interested in products (Requested DND)') AS `reason`,
                COALESCE(c.`dnd_notes`, q.`status_notes`, '') AS `notes`,
                COALESCE(c.`dnd_marked_by`, 'Super Admin') AS `marked_by`,
                COALESCE(q.`assigned_to`, 'UNASSIGNED') AS `assigned_to`,
                'ACTIVE' AS `status`,
                COALESCE(c.`dnd_timestamp`, DATE_FORMAT(NOW(), '%d %b %Y at %h:%i %p')) AS `dnd_timestamp`
            FROM `customers` c
            LEFT JOIN `queries` q ON q.`customer_id` = c.`id`
            WHERE (c.`is_dnd` = 1 OR q.`status` = 'DND')
              AND NOT EXISTS (SELECT 1 FROM `dnd_records` d WHERE d.`customer_id` = c.`id` AND d.`status` = 'ACTIVE')
        ");
    } catch (Exception $e) {
        error_log("DND records initial sync note: " . $e->getMessage());
    }

    // 14. Populate Default Seeds If Empty
    seedDefaultDataIfEmpty($pdo);
}

function seedDefaultDataIfEmpty($pdo) {
    // Check if users exist
    $count = $pdo->query("SELECT COUNT(*) FROM `users`")->fetchColumn();
    if ($count == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `specialization`, `avatar`, `status`, `active_queries`, `converted`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $defaultUsers = [
            ['admin', 'admin', password_hash('admin123', PASSWORD_BCRYPT), 'Super Admin', 'Admin Manager (Full Control)', 'admin@grmgarments.com', '+91 97896 60115', 'Full Control', 'SA', 'ACTIVE', 0, 0],
            ['staff_01', 'priya', password_hash('staff123', PASSWORD_BCRYPT), 'Priya Sharma', 'Sales Specialist (Baby Collection)', 'priya@grmgarments.com', '+91 98765 43211', 'Baby Collection', 'PS', 'ACTIVE', 3, 14],
            ['staff_02', 'rahul', password_hash('staff123', PASSWORD_BCRYPT), 'Rahul Verma', 'Enquiry Specialist (Maternity & Kids)', 'rahul@grmgarments.com', '+91 98765 43212', 'Maternity & Kids', 'RV', 'ACTIVE', 2, 9],
            ['staff_03', 'sneha', password_hash('staff123', PASSWORD_BCRYPT), 'Sneha Patel', 'Order Fulfillment & Support', 'sneha@grmgarments.com', '+91 98765 43213', 'Order Support', 'SP', 'ACTIVE', 1, 11]
        ];

        foreach ($defaultUsers as $u) {
            $stmt->execute($u);
        }
    }

    // Check WhatsApp accounts
    $waCount = $pdo->query("SELECT COUNT(*) FROM `whatsapp_accounts`")->fetchColumn();
    if ($waCount == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO `whatsapp_accounts` (`account_slot`, `business_name`, `display_name`, `brand_name`, `phone_number`, `phone_number_id`, `waba_id`, `provider`, `status`, `webhook_url`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'account_1', 'GRM Garments Business Hub', 'GRM Garments Official', 'Blue Berry 💙', '+91 98765 43210', '109823471928374', '982374619283745', 'META_CLOUD_API', 'CONNECTED', 'http://localhost:8080/webhook.php'
        ]);
        $stmt->execute([
            'account_2', 'Blue Berry Maternity & Kids', 'Blue Berry Customer Care', 'Blue Berry 💙', '+91 97896 60115', '109823471928375', '982374619283746', 'META_CLOUD_API', 'CONNECTED', 'http://localhost:8080/webhook.php'
        ]);
    }



    // Check Customers
    $cCount = $pdo->query("SELECT COUNT(*) FROM `customers`")->fetchColumn();
    if ($cCount == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO `customers` (`id`, `code`, `name`, `phone`, `whatsapp`, `address`, `city`, `customer_type`, `tags`, `total_orders`, `total_spend`, `avatar`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $defaultCustomers = [
            ['cust_101', 'CUST-2026-0089', 'Priya Sundaram', '+91 98765 43210', '+91 98765 43210', 'No. 45, 2nd Main Road, Gandhinagar, Adyar, Chennai - 600020', 'Chennai', 'Repeat Customer', '["Baby Collection","Repeat Buyer","COD"]', 8, 12450.00, 'PS'],
            ['cust_102', 'CUST-2026-0092', 'Ananya Sharma', '+91 98450 11223', '+91 98450 11223', 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103', 'Bengaluru', 'VIP Customer', '["Maternity","VIP","Prepaid"]', 3, 7800.00, 'AS'],
            ['cust_103', 'CUST-2026-0104', 'Kavitha Ramachandran', '+91 97890 55441', '+91 97890 55441', '12/B, Anna Nagar West, Madurai - 625020', 'Madurai', 'New WhatsApp Customer', '["New Lead","Kids Wear"]', 0, 0.00, 'KR']
        ];

        foreach ($defaultCustomers as $c) {
            $stmt->execute($c);
        }
    }

    // Check Queries
    $qCount = $pdo->query("SELECT COUNT(*) FROM `queries`")->fetchColumn();
    if ($qCount == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO `queries` (`id`, `customer_id`, `assigned_to`, `status`, `priority`, `query_text`, `product_sku`, `unread_count`, `last_message`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $defaultQueries = [
            ['Q-2026-001245', 'cust_101', 'staff_01', 'ASSIGNED', 'HIGH', 'Baby Frock BF-001 Pink 2-3 Years available?', 'BF-001-PK', 1, 'Customer: "2–3 years. Pink colour. How much is it?"'],
            ['Q-2026-001246', 'cust_102', 'UNASSIGNED', 'NEW', 'URGENT', 'Can you share photos and colors of Maternity feeding gown?', 'MD-102-BL', 2, 'Customer: "Please share latest photos of maternity gown MD-102"'],
            ['Q-2026-001247', 'cust_103', 'UNASSIGNED', 'NEW', 'NORMAL', 'Do you deliver to Madurai? What are the COD charges?', null, 1, 'Customer: "Hi, do you provide cash on delivery to Madurai?"']
        ];

        foreach ($defaultQueries as $q) {
            $stmt->execute($q);
        }
    }

    // Check Categories
    $catCount = $pdo->query("SELECT COUNT(*) FROM `categories`")->fetchColumn();
    if ($catCount == 0) {
        $cStmt = $pdo->prepare("
            INSERT INTO `categories` (`name`, `slug`, `icon`, `description`, `display_order`)
            VALUES (?, ?, ?, ?, ?)
        ");

        $defaultCats = [
            ['Baby Collection', 'baby_collection', 'child_care', 'Pure cotton frocks, rompers & soft babywear (0–3 Years)', 1],
            ['Maternity & Feeding', 'maternity_wear', 'pregnant_woman', 'Feeding kurtis, maxi gowns & maternity comfort dresses', 2],
            ['Newborn Essentials', 'newborn_care', 'crib', '5-piece organic gift sets, swaddle wraps & rompers', 3],
            ['Kids Everyday Wear', 'kids_wear', 'styler', 'Cotton T-shirt packs, dungarees & nightwear (4–8 Years)', 4],
            ['Girls Festive & Ethnic', 'girls_festive', 'celebration', 'Silk lehenga choli, handcrafted pattu pavadai sets', 5],
            ['Wholesale & Bulk Bundles', 'wholesale_bulk', 'inventory', 'Factory wholesale bundles (Erode/Tirupur manufacturing)', 6]
        ];

        foreach ($defaultCats as $c) {
            $cStmt->execute($c);
        }
    }

    // Check Subcategories
    $subCount = $pdo->query("SELECT COUNT(*) FROM `subcategories`")->fetchColumn();
    if ($subCount == 0) {
        $sStmt = $pdo->prepare("
            INSERT INTO `subcategories` (`category_name`, `name`, `slug`, `sku_prefix`)
            VALUES (?, ?, ?, ?)
        ");

        $defaultSubs = [
            ['Baby Collection', 'Baby Frocks (Embroidered Cotton)', 'baby_frocks', 'BF'],
            ['Baby Collection', 'Cotton Newborn Rompers', 'cotton_rompers', 'BR'],
            ['Baby Collection', '2-Piece Tops & Bloomers Set', 'baby_sets', 'BS'],
            ['Maternity & Feeding', 'Feeding Kurtis & Anarkalis', 'feeding_kurtis', 'FK'],
            ['Maternity & Feeding', 'Maternity Maxi Feeding Gowns', 'maxi_gowns', 'MD'],
            ['Maternity & Feeding', 'Maternity Comfort Pants', 'maternity_bottoms', 'MP'],
            ['Newborn Essentials', '5-Piece Organic Romper Gift Sets', 'gift_sets', 'BB'],
            ['Newborn Essentials', 'Muslin Swaddle Wraps', 'swaddles', 'SW'],
            ['Newborn Essentials', 'Booties, Mittens & Cap Sets', 'mittens_caps', 'MC'],
            ['Kids Everyday Wear', 'Cotton T-Shirt Packs (Pack of 3)', 'tshirts_pack', 'KD'],
            ['Kids Everyday Wear', 'Denim & Cotton Dungarees', 'dungarees', 'DG'],
            ['Kids Everyday Wear', 'Nightwear Pajama Sets', 'nightwear', 'NW'],
            ['Girls Festive & Ethnic', 'Festive Silk Lehenga Choli', 'lehenga_choli', 'GL'],
            ['Girls Festive & Ethnic', 'Handcrafted Silk Pattu Pavadai', 'pattu_pavadai', 'VIP'],
            ['Girls Festive & Ethnic', 'Party Wear Anarkalis', 'anarkali_ethnic', 'AK'],
            ['Wholesale & Bulk Bundles', '25-Pc Assorted Frock Bundles', 'frock_bundles', 'WS-F'],
            ['Wholesale & Bulk Bundles', '50-Pc Rompers Bulk Box', 'romper_boxes', 'WS-R'],
            ['Wholesale & Bulk Bundles', 'Mixed Garment Lots', 'mixed_lots', 'WS-M']
        ];

        foreach ($defaultSubs as $s) {
            $sStmt->execute($s);
        }
    }

    // Check Attributes
    $attrCount = $pdo->query("SELECT COUNT(*) FROM `attributes`")->fetchColumn();
    if ($attrCount == 0) {
        $aStmt = $pdo->prepare("
            INSERT INTO `attributes` (`type`, `value`, `extra`)
            VALUES (?, ?, ?)
        ");

        $defaultAttrs = [
            // Sizes
            ['size', '0-6 Months', 'Newborn'],
            ['size', '6-12 Months', 'Infant'],
            ['size', '1-2 Years', 'Toddler'],
            ['size', '2-3 Years', 'Toddler'],
            ['size', '3-4 Years', 'Kids'],
            ['size', '4-5 Years', 'Kids'],
            ['size', '6-7 Years', 'Pre-Teen'],
            ['size', 'S', 'Standard'],
            ['size', 'M', 'Standard'],
            ['size', 'L', 'Standard'],
            ['size', 'XL', 'Plus'],
            ['size', 'XXL', 'Plus'],
            ['size', 'Free Size', 'Universal'],
            ['size', 'Assorted Bulk Lot', 'Wholesale'],
            // Colors
            ['color', 'Pink', '#f472b6'],
            ['color', 'Sunshine Yellow', '#facc15'],
            ['color', 'Sky Blue', '#38bdf8'],
            ['color', 'Mint Green', '#4ade80'],
            ['color', 'Blush Pink', '#fb7185'],
            ['color', 'Ruby Red & Gold', '#dc2626'],
            ['color', 'Emerald Green & Gold', '#059669'],
            ['color', 'Pure White', '#ffffff'],
            ['color', 'Multi Pastel', '#c084fc'],
            ['color', 'Navy Blue', '#1e3a8a'],
            ['color', 'Royal Maroon', '#881337'],
            // Fabrics
            ['fabric', '100% Pure Organic Cotton', 'Natural'],
            ['fabric', 'Soft Breathable Hosiery', 'Stretch'],
            ['fabric', 'Handcrafted Kanjivaram Silk', 'Festive Silk'],
            ['fabric', 'Rayon Slub Feeding Cotton', 'Soft Drapery'],
            ['fabric', 'Pure Cotton Muslin', 'Lightweight'],
            ['fabric', 'Rich Art Silk & Zari', 'Ethnic'],
            ['fabric', 'Combed Cotton Knit', 'Casual']
        ];

        foreach ($defaultAttrs as $a) {
            $aStmt->execute($a);
        }
    }

    // Check Products
    $pCount = $pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn();
    if ($pCount == 0) {
        $pStmt = $pdo->prepare("
            INSERT INTO `products` (`sku`, `name`, `category`, `subcategory`, `size`, `color`, `fabric`, `specifications`, `price`, `mrp`, `physical_stock`, `reserved_stock`, `image`, `description`, `account_id`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $defaultProducts = [
            [
                'BF-001-PK', 'Embroidered Cotton Baby Frock', 'Baby Collection', 'Baby Frocks (Embroidered Cotton)', '2–3 Years', 'Pink', '100% Breathable Combed Cotton',
                json_encode([['label' => 'Sleeve Length', 'content' => 'Full Sleeve'], ['label' => 'Occasion', 'content' => 'Festive Wear']]),
                599.00, 799.00, 12, 0, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80',
                '100% Breathable Combed Cotton with fine needle embroidery. Soft inner lining, skin-friendly for babies.', 'account_1'
            ],
            [
                'BF-001-YL', 'Sunshine Flared Baby Frock', 'Baby Collection', 'Baby Frocks (Embroidered Cotton)', '1–2 Years', 'Sunshine Yellow', '100% Combed Cotton',
                json_encode([['label' => 'Occasion', 'content' => 'Daily & Casual Wear'], ['label' => 'Fit', 'content' => 'Regular Flared']]),
                599.00, 799.00, 8, 0, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
                'Bright festive yellow frock with contrast floral yoke and flared hem.', 'account_1'
            ],
            [
                'MD-102-BL', 'Pure Cotton Tiered Feeding Gown', 'Maternity & Feeding', 'Maternity Maxi Feeding Gowns', 'L / XL', 'Sky Blue', 'Pure Mulmul Cotton',
                json_encode([['label' => 'Feeding Access', 'content' => 'Concealed Double Zips'], ['label' => 'Pattern', 'content' => 'Tiered Flared']]),
                1299.00, 1699.00, 10, 0, 'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=800&auto=format&fit=crop&q=80',
                'Concealed double invisible feeding zips. 100% pure premium mulmul cotton, ultra-comfortable.', 'account_2'
            ]
        ];

        foreach ($defaultProducts as $dp) {
            $pStmt->execute($dp);
        }
    }

    // Check Follow-ups
    $fCount = $pdo->query("SELECT COUNT(*) FROM `followups`")->fetchColumn();
    if ($fCount == 0) {
        $today = date('Y-m-d');
        $tomorrow = date('Y-m-d', strtotime('+1 day'));
        $yesterday = date('Y-m-d', strtotime('-1 day'));

        $stmt = $pdo->prepare("
            INSERT INTO `followups` (`id`, `query_id`, `customer_id`, `customer_name`, `assigned_to`, `date_str`, `time_str`, `reason`, `status`, `outcome`, `priority`, `contact_channel`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $defaultFollowups = [
            ['FU-2026-0001', 'Q-2026-001245', 'cust_101', 'Priya Sundaram', 'staff_01', $today, '11:30 AM', 'Customer asked to confirm pure cotton frock BF-001 pink size availability for 2-year-old before ordering.', 'PENDING', 'PENDING', 'HIGH', 'WHATSAPP'],
            ['FU-2026-0002', 'Q-2026-001246', 'cust_102', 'Ananya Sharma', 'staff_02', $today, '04:00 PM', 'Call to discuss feeding gown MD-102 fabric details & COD shipping options to Bengaluru.', 'PENDING', 'PENDING', 'URGENT', 'CALL'],
            ['FU-2026-0003', 'Q-2026-001247', 'cust_103', 'Kavitha Ramachandran', 'staff_03', $yesterday, '10:00 AM', 'Follow up regarding wholesale 25-piece bulk frock lot inquiry and payment quotation.', 'PENDING', 'PENDING', 'NORMAL', 'CALL'],
            ['FU-2026-0004', 'Q-2026-001245', 'cust_101', 'Priya Sundaram', 'staff_01', $tomorrow, '02:30 PM', 'Check if customer received catalog photos of newborn gift sets.', 'PENDING', 'PENDING', 'NORMAL', 'WHATSAPP'],
        ];

        foreach ($defaultFollowups as $fu) {
            $stmt->execute($fu);
        }
    }

    // Check Orders
    $oCount = $pdo->query("SELECT COUNT(*) FROM `orders`")->fetchColumn();
    if ($oCount == 0) {
        $now = time();
        $stmt = $pdo->prepare("
            INSERT INTO `orders` (
                `id`, `query_id`, `customer_id`, `customer_name`, `customer_phone`, `shipping_address`,
                `items_json`, `grand_total`, `cod_advance`, `cod_balance_due`, `payment_method`,
                `payment_status`, `upi_transaction_id`, `order_status`, `staff_id`, `staff_name`,
                `created_by`, `tracking_number`, `courier_name`, `created_at`
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $defaultOrders = [
            [
                'WA-2026-001126', 'Q-2026-001245', 'cust_101', 'Priya Sundaram', '+91 98765 43210',
                'No. 45, 2nd Main Road, Gandhinagar, Adyar, Chennai - 600020',
                json_encode([
                    ['name' => 'Embroidered Cotton Baby Frock', 'sku' => 'BF-001-PK', 'size' => '2–3 Years', 'qty' => 2, 'price' => 599.00]
                ]),
                1198.00, 0.00, 0.00, 'ONLINE_UPI', 'PAID', 'UPI-982347192837', 'PLACED',
                'staff_01', 'Priya Sharma', 'Priya Sharma', null, null, date('Y-m-d H:i:s', $now - 3600)
            ],
            [
                'WA-2026-001127', 'Q-2026-001246', 'cust_102', 'Ananya Sharma', '+91 98450 11223',
                'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
                json_encode([
                    ['name' => 'Pure Cotton Tiered Feeding Gown', 'sku' => 'MD-102-BL', 'size' => 'L / XL', 'qty' => 1, 'price' => 1299.00],
                    ['name' => 'Sunshine Flared Baby Frock', 'sku' => 'BF-001-YL', 'size' => '1–2 Years', 'qty' => 1, 'price' => 599.00]
                ]),
                1898.00, 200.00, 1698.00, 'COD', 'PARTIAL_PAID (₹200 ADVANCE)', 'UPI-819283719283', 'PACKED',
                'staff_02', 'Rahul Verma', 'Rahul Verma', null, 'Delhivery Express', date('Y-m-d H:i:s', $now - 86400)
            ],
            [
                'WA-2026-001128', 'Q-2026-001247', 'cust_103', 'Kavitha Ramachandran', '+91 97890 55441',
                '12/B, Anna Nagar West, Madurai - 625020',
                json_encode([
                    ['name' => 'Embroidered Cotton Baby Frock', 'sku' => 'BF-001-PK', 'size' => '1–2 Years', 'qty' => 3, 'price' => 599.00]
                ]),
                1797.00, 0.00, 0.00, 'ONLINE_UPI', 'PAID', 'UPI-762910481920', 'SHIPPED',
                'staff_01', 'Priya Sharma', 'Priya Sharma', 'BLUEDART-882937102', 'BlueDart Courier', date('Y-m-d H:i:s', $now - (86400 * 3))
            ],
            [
                'WA-2026-001129', 'Q-2026-1008', 'cust_7338965560', 'SugunaMani', '+91 73389 65560',
                '14/2 Cross Cut Road, Gandhipuram, Coimbatore - 641012',
                json_encode([
                    ['name' => 'Sunshine Flared Baby Frock', 'sku' => 'BF-001-YL', 'size' => '2–3 Years', 'qty' => 1, 'price' => 599.00],
                    ['name' => 'Festive Silk Baby Set', 'sku' => 'FS-301-GD', 'size' => '1–2 Years', 'qty' => 1, 'price' => 899.00]
                ]),
                1498.00, 200.00, 1298.00, 'COD', 'PARTIAL_PAID (₹200 ADVANCE)', 'UPI-652918273918', 'SHIPPED',
                'staff_02', 'Rahul Verma', 'Rahul Verma', 'DTDC-9928172635', 'DTDC Express', date('Y-m-d H:i:s', $now - (86400 * 5))
            ],
            [
                'WA-2026-001130', 'Q-2026-001245', 'cust_101', 'Priya Sundaram', '+91 98765 43210',
                'No. 45, 2nd Main Road, Gandhinagar, Adyar, Chennai - 600020',
                json_encode([
                    ['name' => '5-Piece Organic Newborn Gift Set', 'sku' => 'NB-201-WT', 'size' => '0–6 Months', 'qty' => 2, 'price' => 799.00]
                ]),
                1598.00, 0.00, 0.00, 'ONLINE_UPI', 'PAID', 'UPI-541928374829', 'DELIVERED',
                'staff_03', 'Sneha Patel', 'Sneha Patel', 'ST-TRACK-88291029', 'Speed Post India', date('Y-m-d H:i:s', $now - (86400 * 12))
            ],
            [
                'WA-2026-001131', 'Q-2026-001246', 'cust_102', 'Ananya Sharma', '+91 98450 11223',
                'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
                json_encode([
                    ['name' => 'Pure Cotton Tiered Feeding Gown', 'sku' => 'MD-102-BL', 'size' => 'L / XL', 'qty' => 1, 'price' => 1299.00]
                ]),
                1299.00, 0.00, 0.00, 'ONLINE_UPI', 'PAID', 'UPI-432819283746', 'DELIVERED',
                'staff_01', 'Priya Sharma', 'Priya Sharma', 'BLUEDART-772910283', 'BlueDart Courier', date('Y-m-d H:i:s', $now - (86400 * 18))
            ]
        ];

        foreach ($defaultOrders as $ord) {
            $stmt->execute($ord);
        }
    }

    // Check Auto-Reply Rules
    $arCount = $pdo->query("SELECT COUNT(*) FROM `auto_reply_rules`")->fetchColumn();
    if ($arCount == 0) {
        $arStmt = $pdo->prepare("
            INSERT INTO `auto_reply_rules` (`id`, `name`, `keywords`, `action_type`, `category_id`, `reply_text`, `enabled`, `auto_send`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $defaultRules = [
            [
                'rule_greet', 'Welcome Greeting', json_encode(['hi', 'hello', 'vanakkam', 'namaste']),
                'custom_text', null, 'Hello! Welcome to GRM Garments & Blue Berry Kids. How can our sales team assist you today?', 1, 1
            ],
            [
                'rule_catalog', 'Catalog Request', json_encode(['catalog', 'price list', 'frock collection', 'photos']),
                'custom_text', 'baby_collection', 'Here is our latest pure cotton Baby & Maternity wear catalog with live stock availability!', 1, 1
            ],
            [
                'rule_cod', 'COD & Delivery Terms', json_encode(['cod', 'cash on delivery', 'shipping charges', 'courier']),
                'custom_text', null, 'Yes! We offer fast Doorstep Delivery with Cash on Delivery (COD) across India. Standard delivery takes 2–4 business days.', 1, 1
            ]
        ];
        foreach ($defaultRules as $r) {
            $arStmt->execute($r);
        }
    }

    // Check Broadcast Templates
    $btCount = $pdo->query("SELECT COUNT(*) FROM `broadcast_templates`")->fetchColumn();
    if ($btCount == 0) {
        $btStmt = $pdo->prepare("
            INSERT INTO `broadcast_templates` (`id`, `name`, `category`, `body_text`, `image_url`, `button_type`, `button_text`, `button_url`, `status`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $defaultTemplates = [
            [
                'tmpl_festive_offer', 'Diwali & Festive Pure Silk Offer', 'FESTIVE_MARKETING',
                "🎉 Exclusive Festive Offer!\nPure silk handcrafted pattu pavadai and baby frocks are now available at factory-direct prices.\nOrder today to get fast priority dispatch!",
                'https://images.unsplash.com/photo-1596870230751-ebdfce98ec42?w=800', 'URL', 'View Festive Catalog', 'http://localhost:8000/#catalog', 'ACTIVE'
            ],
            [
                'tmpl_maternity_arrival', 'New Maternity Feeding Gowns Restocked', 'PRODUCT_LAUNCH',
                "✨ Feeding Gowns Restocked!\n100% breathable mulmul cotton with concealed dual invisible zips.\nAvailable in sizes M, L, XL, and XXL with COD support.",
                'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=800', 'URL', 'Shop Maternity Wear', 'http://localhost:8000/#catalog', 'ACTIVE'
            ],
            [
                'tmpl_order_confirm', 'Order Dispatch & Tracking Alert', 'UTILITY_TRACKING',
                "📦 Your GRM Garments order has been dispatched via express courier!\nYour tracking number and parcel details will be updated here shortly.",
                null, 'URL', 'Track Order', 'http://localhost:8000/#orders', 'ACTIVE'
            ]
        ];
        foreach ($defaultTemplates as $t) {
            $btStmt->execute($t);
        }
    }

    // Check Call Masking Settings Seed
    $maskCount = $pdo->query("SELECT COUNT(*) FROM `masking_settings`")->fetchColumn();
    if ($maskCount == 0) {
        $pdo->exec("
            INSERT INTO `masking_settings` (`id`, `call_masking_enabled`, `chat_masking_enabled`, `call_timeout_seconds`, `fallback_strategy`, `virtual_company_number`, `eligible_staff_ids`, `recording_enabled`, `updated_by`)
            VALUES (1, 1, 1, 30, 'RETURN_TO_POOL', '+91 8000 123 456', 'staff_01,staff_02,staff_03', 1, 'Super Admin');
        ");
    }
}



