<?php
/**
 * GRM WHATSAPP CRM — DATABASE CONNECTION & AUTO-MIGRATION ENGINE
 * Connects to XAMPP MySQL (localhost, root, empty password)
 * Automatically creates database `grm_crm_db` and all necessary tables & seed records on first run.
 */

// Load .env configuration file if present
function loadEnvConfig() {
    $envFile = dirname(__DIR__) . '/.env';
    $env = [
        'DB_HOST' => '127.0.0.1',
        'DB_USER' => 'root',
        'DB_PASS' => '',
        'DB_NAME' => 'grm_crm_db',
        'DB_PORT' => '3306'
    ];

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

    return $env;
}

$envConfig = loadEnvConfig();
define('DB_HOST', $envConfig['DB_HOST']);
define('DB_USER', $envConfig['DB_USER']);
define('DB_PASS', $envConfig['DB_PASS']);
define('DB_NAME', $envConfig['DB_NAME']);
define('DB_PORT', (int)$envConfig['DB_PORT']);

function getDBConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $hosts = [DB_HOST, '127.0.0.1', 'localhost'];

    foreach (array_unique($hosts) as $host) {
        try {
            // 1. Connect to MySQL server to ensure DB exists
            $initPdo = new PDO(
                "mysql:host=" . $host . ";port=" . DB_PORT . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );

            $initPdo->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;");

            // 2. Connect to the database
            $pdo = new PDO(
                "mysql:host=" . $host . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4",
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );

            // 3. Ensure tables and seeds exist
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
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 4. Inquiries / Leads Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `queries` (
            `id` VARCHAR(50) PRIMARY KEY,
            `customer_id` VARCHAR(50) NOT NULL,
            `assigned_to` VARCHAR(50) DEFAULT 'UNASSIGNED',
            `status` ENUM('NEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') DEFAULT 'NEW',
            `priority` ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT') DEFAULT 'NORMAL',
            `query_text` TEXT NULL,
            `product_sku` VARCHAR(50) NULL,
            `unread_count` INT DEFAULT 0,
            `last_message` TEXT NULL,
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
            `size` VARCHAR(50) NOT NULL,
            `color` VARCHAR(50) NOT NULL,
            `price` DECIMAL(10,2) NOT NULL,
            `physical_stock` INT DEFAULT 0,
            `reserved_stock` INT DEFAULT 0,
            `image` TEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
            `payment_method` VARCHAR(30) DEFAULT 'COD',
            `payment_status` VARCHAR(30) DEFAULT 'PENDING',
            `order_status` VARCHAR(30) DEFAULT 'PROCESSING',
            `created_by` VARCHAR(100) NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

    // 8. Follow-ups Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS `followups` (
            `id` VARCHAR(50) PRIMARY KEY,
            `query_id` VARCHAR(50) NULL,
            `customer_id` VARCHAR(50) NOT NULL,
            `customer_name` VARCHAR(100) NOT NULL,
            `assigned_to` VARCHAR(50) NOT NULL,
            `date_str` VARCHAR(50) NOT NULL,
            `time_str` VARCHAR(50) NOT NULL,
            `reason` TEXT NOT NULL,
            `status` ENUM('PENDING', 'COMPLETED', 'CANCELLED') DEFAULT 'PENDING',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");

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

    // 10. Populate Default Seeds If Empty
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
            ['admin', 'admin', 'admin123', 'Super Admin', 'Admin Manager (Full Control)', 'admin@grmgarments.com', '+91 97896 60115', 'Full Control', 'SA', 'ACTIVE', 0, 0],
            ['staff_01', 'priya', 'staff123', 'Priya Sharma', 'Sales Specialist (Baby Collection)', 'priya@grmgarments.com', '+91 98765 43211', 'Baby Collection', 'PS', 'ACTIVE', 3, 14],
            ['staff_02', 'rahul', 'staff123', 'Rahul Verma', 'Enquiry Specialist (Maternity & Kids)', 'rahul@grmgarments.com', '+91 98765 43212', 'Maternity & Kids', 'RV', 'ACTIVE', 2, 9],
            ['staff_03', 'sneha', 'staff123', 'Sneha Patel', 'Order Fulfillment & Support', 'sneha@grmgarments.com', '+91 98765 43213', 'Order Support', 'SP', 'ACTIVE', 1, 11]
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

    // Check Products
    $pCount = $pdo->query("SELECT COUNT(*) FROM `products`")->fetchColumn();
    if ($pCount == 0) {
        $stmt = $pdo->prepare("
            INSERT INTO `products` (`sku`, `name`, `category`, `size`, `color`, `price`, `physical_stock`, `reserved_stock`, `image`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $defaultProducts = [
            ['BF-001-PK', 'Baby Frock (Embroidered Cotton)', 'Baby Collection', '2-3 Years', 'Pink', 599.00, 12, 4, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60'],
            ['BF-001-YL', 'Baby Frock (Embroidered Cotton)', 'Baby Collection', '1-2 Years', 'Sunshine Yellow', 599.00, 8, 1, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&auto=format&fit=crop&q=60'],
            ['MD-102-BL', 'Maternity Maxi Feeding Gown', 'Maternity', 'L / XL', 'Sky Blue', 1299.00, 10, 5, 'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=400&auto=format&fit=crop&q=60'],
            ['KD-204-YL', 'Kids Organic Cotton T-Shirt Set (Pack of 3)', 'Kids', '4-5 Years', 'Multi Yellow/Green', 450.00, 25, 8, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=60'],
            ['GL-505-RD', 'Girls Festive Silk Lehenga Choli', 'Girls Festive', '6-7 Years', 'Ruby Red & Gold', 899.00, 6, 0, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=60'],
            ['BB-301-WH', 'Newborn 5-Piece Organic Romper Gift Set', 'Newborn', '0-6 Months', 'Pure White / Mint', 799.00, 15, 2, 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&auto=format&fit=crop&q=60']
        ];

        foreach ($defaultProducts as $p) {
            $stmt->execute($p);
        }
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
}
