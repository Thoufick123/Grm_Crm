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
$dynamicBridgeUrl = null;
$cfgFileForBridge = dirname(__DIR__) . '/whatsapp_account_config.json';
if (file_exists($cfgFileForBridge)) {
    $cfgDataForBridge = json_decode(file_get_contents($cfgFileForBridge), true);
    if (!empty($cfgDataForBridge['bridge_url'])) {
        $dynamicBridgeUrl = rtrim($cfgDataForBridge['bridge_url'], '/');
    }
}
define('BRIDGE_URL', $dynamicBridgeUrl ?? ($envConfig['BRIDGE_URL'] ?? 'http://localhost:3000'));
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

            // 3. Ensure tables and default seeds exist ONLY IF NOT ALREADY INITIALIZED
            // Running 47 DDL CREATE TABLE queries on every HTTP request creates massive table lock contention and socket exhaustion.
            static $schemaChecked = false;
            if (!$schemaChecked) {
                $needSchemaInit = false;
                if (isset($_GET['init_schema']) || isset($_GET['migrate'])) {
                    $needSchemaInit = true;
                } else {
                    try {
                        $checkUsers = $pdo->query("SHOW TABLES LIKE 'users'")->fetch();
                        if (!$checkUsers) {
                            $needSchemaInit = true;
                        }
                    } catch (Exception $e) {
                        $needSchemaInit = true;
                    }
                }

                if ($needSchemaInit) {
                    initializeDatabaseSchema($pdo);
                }
                $schemaChecked = true;
            }

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
            'delivery_note'  => "ALTER TABLE `products` ADD COLUMN `delivery_note` TEXT NULL AFTER `custom_caption`",
            'account_id'     => "ALTER TABLE `products` ADD COLUMN `account_id` VARCHAR(50) DEFAULT 'account_1' AFTER `delivery_note`"
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

    // Auto-heal subcategories with missing category_id by linking with categories table
    try {
        $pdo->exec("UPDATE `subcategories` s JOIN `categories` c ON s.category_name = c.name SET s.category_id = c.id WHERE s.category_id IS NULL");
    } catch (Exception $e) {}

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

    // 18. WhatsApp Multilingual Voice Messages Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `voice_messages` (
            `id` VARCHAR(50) PRIMARY KEY,
            `conversation_id` VARCHAR(50) NULL,
            `customer_id` VARCHAR(50) NULL,
            `staff_id` VARCHAR(50) NULL,
            `direction` ENUM('INBOUND', 'OUTBOUND') DEFAULT 'OUTBOUND',
            `original_audio_path` TEXT NULL,
            `source_language` VARCHAR(20) DEFAULT 'ta',
            `target_language` VARCHAR(20) DEFAULT 'en',
            `audio_duration` VARCHAR(20) DEFAULT '0',
            `processing_status` VARCHAR(50) DEFAULT 'downloaded',
            `whatsapp_message_id` VARCHAR(100) NULL,
            `delivery_status` VARCHAR(50) DEFAULT 'PENDING',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX(`customer_id`),
            INDEX(`conversation_id`),
            INDEX(`processing_status`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 19. WhatsApp Voice Translations Table (STT -> Translate -> TTS Audio Pipeline)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `voice_translations` (
            `id` VARCHAR(50) PRIMARY KEY,
            `voice_message_id` VARCHAR(50) NOT NULL,
            `translated_audio_path` TEXT NOT NULL,
            `audio_format` VARCHAR(20) DEFAULT 'ogg',
            `audio_duration` VARCHAR(20) DEFAULT '0',
            `translation_status` VARCHAR(50) DEFAULT 'COMPLETED',
            `intermediate_source_text` TEXT NULL,
            `intermediate_translated_text` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX(`voice_message_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // Dynamic Alter for Users (preferred_language and status)
    try {
        $existingUserCols = $pdo->query("SHOW COLUMNS FROM `users`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('preferred_language', $existingUserCols)) {
            $pdo->exec("ALTER TABLE `users` ADD COLUMN `preferred_language` VARCHAR(20) DEFAULT 'ta' AFTER `status`");
        }
        $pdo->exec("ALTER TABLE `users` MODIFY COLUMN `status` VARCHAR(50) DEFAULT 'ACTIVE'");
    } catch (Exception $e) {
        error_log("Users migration note: " . $e->getMessage());
    }

    // Dynamic Alter for Customers (Email, Gender, Age, tags_json)
    try {
        $existingCustCols = $pdo->query("SHOW COLUMNS FROM `customers`")->fetchAll(PDO::FETCH_COLUMN);
        $custExtraCols = [
            'email'     => "ALTER TABLE `customers` ADD COLUMN `email` VARCHAR(100) NULL AFTER `whatsapp`",
            'gender'    => "ALTER TABLE `customers` ADD COLUMN `gender` VARCHAR(20) NULL AFTER `email`",
            'age'       => "ALTER TABLE `customers` ADD COLUMN `age` VARCHAR(20) NULL AFTER `gender`",
            'tags_json' => "ALTER TABLE `customers` ADD COLUMN `tags_json` TEXT NULL AFTER `tags`"
        ];
        foreach ($custExtraCols as $cName => $sql) {
            if (!in_array($cName, $existingCustCols)) {
                $pdo->exec($sql);
            }
        }
    } catch (Exception $e) {
        error_log("Customer extra columns migration note: " . $e->getMessage());
    }

    // Dynamic Alter for Broadcast Templates (variables_json)
    try {
        $existingBtCols = $pdo->query("SHOW COLUMNS FROM `broadcast_templates`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('variables_json', $existingBtCols)) {
            $pdo->exec("ALTER TABLE `broadcast_templates` ADD COLUMN `variables_json` JSON NULL AFTER `body_text`");
        }
    } catch (Exception $e) {
        error_log("Broadcast templates migration note: " . $e->getMessage());
    }

    // Dynamic Alter for Audit Logs (Dual Schema: actor, action_type, category, description, ip_address)
    try {
        $existingAuditCols = $pdo->query("SHOW COLUMNS FROM `audit_logs`")->fetchAll(PDO::FETCH_COLUMN);
        $auditColDefs = [
            'actor'        => "ALTER TABLE `audit_logs` ADD COLUMN `actor` VARCHAR(100) NULL AFTER `user`",
            'action_type'  => "ALTER TABLE `audit_logs` ADD COLUMN `action_type` VARCHAR(100) NULL AFTER `action`",
            'category'     => "ALTER TABLE `audit_logs` ADD COLUMN `category` VARCHAR(100) NULL AFTER `module`",
            'description'  => "ALTER TABLE `audit_logs` ADD COLUMN `description` TEXT NULL AFTER `details`",
            'ip_address'   => "ALTER TABLE `audit_logs` ADD COLUMN `ip_address` VARCHAR(50) NULL AFTER `timestamp_str`"
        ];
        foreach ($auditColDefs as $cName => $sql) {
            if (!in_array($cName, $existingAuditCols)) {
                $pdo->exec($sql);
            }
        }
        $pdo->exec("ALTER TABLE `audit_logs` MODIFY COLUMN `user` VARCHAR(100) NULL");
        $pdo->exec("ALTER TABLE `audit_logs` MODIFY COLUMN `action` VARCHAR(100) NULL");
        $pdo->exec("ALTER TABLE `audit_logs` MODIFY COLUMN `module` VARCHAR(100) NULL");
        $pdo->exec("ALTER TABLE `audit_logs` MODIFY COLUMN `details` TEXT NULL");
    } catch (Exception $e) {
        error_log("Audit logs migration note: " . $e->getMessage());
    }

    // Dynamic Alter for Messages (direction, message_text)
    try {
        $existingMsgCols = $pdo->query("SHOW COLUMNS FROM `messages`")->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('direction', $existingMsgCols)) {
            $pdo->exec("ALTER TABLE `messages` ADD COLUMN `direction` ENUM('inbound', 'outbound') DEFAULT 'inbound' AFTER `sender`");
        }
        if (!in_array('message_text', $existingMsgCols)) {
            $pdo->exec("ALTER TABLE `messages` ADD COLUMN `message_text` TEXT NULL AFTER `text`");
        }
        $pdo->exec("ALTER TABLE `messages` MODIFY COLUMN `text` TEXT NULL");
    } catch (Exception $e) {
        error_log("Messages migration note: " . $e->getMessage());
    }

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
    if (!$pdo) return;

    // 1. Ensure Super Admin user exists so login is never locked out
    $adminCount = $pdo->query("SELECT COUNT(*) FROM `users` WHERE `id` = 'admin' OR `username` = 'admin'")->fetchColumn();
    if ($adminCount == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `specialization`, `avatar`, `status`, `preferred_language`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'admin',
            'admin',
            password_hash('admin123', PASSWORD_BCRYPT),
            'Super Admin',
            'Admin Manager (Full Control)',
            'admin@grmgarments.com',
            '+91 97896 60115',
            'Full Control',
            'SA',
            'ACTIVE',
            'ta'
        ]);
    }

    // 2. Primary WhatsApp Account Slot (clean configuration)
    $waCount = $pdo->query("SELECT COUNT(*) FROM `whatsapp_accounts`")->fetchColumn();
    if ($waCount == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO `whatsapp_accounts` (`account_slot`, `business_name`, `display_name`, `brand_name`, `phone_number`, `phone_number_id`, `waba_id`, `provider`, `status`, `webhook_url`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            'account_1', 'GRM Garments Business Hub', 'GRM Garments Official', 'Blue Berry 💙', '+91 97896 60115', '109823471928374', '982374619283745', 'META_CLOUD_API', 'CONNECTED', 'http://localhost:8080/webhook.php'
        ]);
    }

    // 3. Primary Call Masking Setting Default
    $maskCount = $pdo->query("SELECT COUNT(*) FROM `masking_settings`")->fetchColumn();
    if ($maskCount == 0) {
        $pdo->exec("
            INSERT INTO `masking_settings` (`id`, `call_masking_enabled`, `chat_masking_enabled`, `call_timeout_seconds`, `fallback_strategy`, `virtual_company_number`, `eligible_staff_ids`, `recording_enabled`, `updated_by`)
            VALUES (1, 1, 1, 30, 'RETURN_TO_POOL', '+91 97896 60115', 'admin', 1, 'Super Admin');
        ");
    }
}



