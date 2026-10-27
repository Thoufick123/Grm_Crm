-- =========================================================================
-- GRM WHATSAPP CRM — FULL DATABASE SCHEMA (XAMPP MYSQL / PHPMYADMIN)
-- Database Name: grm_crm_db
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `grm_crm_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `grm_crm_db`;

-- 1. Users & Staff Table (Role-Based Authentication)
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

-- 2. WhatsApp Accounts Configuration
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

-- 3. Customers Directory (Customer 360)
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
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customer Enquiries & Lead Assignments
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
    `is_payment_pending` TINYINT(1) NOT NULL DEFAULT 0,
    `payment_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `shipping_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `payment_mode` VARCHAR(50) NULL DEFAULT 'UPI',
    `advance_payment` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    `payment_due_date` VARCHAR(50) NULL,
    `payment_notes` TEXT NULL,
    `quoted_items` TEXT NULL,
    `callback_date` VARCHAR(50) NULL,
    `callback_time` VARCHAR(50) NULL DEFAULT '11:00 AM',
    `status_history` JSON NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. WhatsApp Chat Messages & Voice Notes
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

-- 6. Products Catalog & Live Stock
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

-- 6.1 Categories Table
CREATE TABLE IF NOT EXISTS `categories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) UNIQUE NOT NULL,
    `icon` VARCHAR(50) DEFAULT 'checkroom',
    `description` TEXT NULL,
    `display_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.2 Subcategories Table
CREATE TABLE IF NOT EXISTS `subcategories` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `category_id` INT NULL,
    `category_name` VARCHAR(100) NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `slug` VARCHAR(100) NOT NULL,
    `sku_prefix` VARCHAR(20) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.3 Attributes Table (Sizes, Colors, Fabrics, Specifications)
CREATE TABLE IF NOT EXISTS `attributes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `type` VARCHAR(50) NOT NULL,
    `value` VARCHAR(150) NOT NULL,
    `extra` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. WhatsApp Sales Orders
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

-- 8. Customer Follow-up Reminders (Full Lifecycle Tracking & Outcomes)
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

-- 9. Tamper-Proof Audit Trail
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user` VARCHAR(100) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `details` TEXT NOT NULL,
    `timestamp_str` VARCHAR(50) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================================================================
-- DEFAULT SAMPLE SEED DATA
-- =========================================================================

-- Seed Users
INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `specialization`, `avatar`, `status`, `active_queries`, `converted`)
VALUES 
('admin', 'admin', 'admin123', 'Super Admin', 'Admin Manager (Full Control)', 'admin@grmgarments.com', '+91 97896 60115', 'Full Control', 'SA', 'ACTIVE', 0, 0),
('staff_01', 'priya', 'staff123', 'Priya Sharma', 'Sales Specialist (Baby Collection)', 'priya@grmgarments.com', '+91 98765 43211', 'Baby Collection', 'PS', 'ACTIVE', 3, 14),
('staff_02', 'rahul', 'staff123', 'Rahul Verma', 'Enquiry Specialist (Maternity & Kids)', 'rahul@grmgarments.com', '+91 98765 43212', 'Maternity & Kids', 'RV', 'ACTIVE', 2, 9),
('staff_03', 'sneha', 'staff123', 'Sneha Patel', 'Order Fulfillment & Support', 'sneha@grmgarments.com', '+91 98765 43213', 'Order Support', 'SP', 'ACTIVE', 1, 11)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- Seed WhatsApp Accounts
INSERT INTO `whatsapp_accounts` (`account_slot`, `business_name`, `display_name`, `brand_name`, `phone_number`, `phone_number_id`, `waba_id`, `provider`, `status`, `webhook_url`)
VALUES 
('account_1', 'GRM Garments Business Hub', 'GRM Garments Official', 'Blue Berry 💙', '+91 98765 43210', '109823471928374', '982374619283745', 'META_CLOUD_API', 'CONNECTED', 'http://localhost:8080/webhook.php'),
('account_2', 'Blue Berry Maternity & Kids', 'Blue Berry Customer Care', 'Blue Berry 💙', '+91 97896 60115', '109823471928375', '982374619283746', 'META_CLOUD_API', 'CONNECTED', 'http://localhost:8080/webhook.php')
ON DUPLICATE KEY UPDATE `brand_name`=VALUES(`brand_name`);

-- Products Table is initialized empty for dynamic catalog management

-- Seed Initial Customer Follow-ups (Today, Upcoming & Overdue)
INSERT INTO `followups` (`id`, `query_id`, `customer_id`, `customer_name`, `assigned_to`, `date_str`, `time_str`, `reason`, `status`, `outcome`, `priority`, `contact_channel`)
VALUES 
('FU-2026-0001', 'Q-2026-001245', 'cust_101', 'Priya Sundaram', 'staff_01', CURRENT_DATE(), '11:30 AM', 'Customer asked to confirm pure cotton frock BF-001 pink size availability for 2-year-old before ordering.', 'PENDING', 'PENDING', 'HIGH', 'WHATSAPP'),
('FU-2026-0002', 'Q-2026-001246', 'cust_102', 'Ananya Sharma', 'staff_02', CURRENT_DATE(), '04:00 PM', 'Call to discuss feeding gown MD-102 fabric details & COD shipping options to Bengaluru.', 'PENDING', 'PENDING', 'URGENT', 'CALL'),
('FU-2026-0003', 'Q-2026-001247', 'cust_103', 'Kavitha Ramachandran', 'staff_03', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY), '10:00 AM', 'Follow up regarding wholesale 25-piece bulk frock lot inquiry and payment quotation.', 'PENDING', 'PENDING', 'NORMAL', 'CALL'),
('FU-2026-0004', 'Q-2026-001245', 'cust_101', 'Priya Sundaram', 'staff_01', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '02:30 PM', 'Check if customer received catalog photos of newborn gift sets.', 'PENDING', 'PENDING', 'NORMAL', 'WHATSAPP')
ON DUPLICATE KEY UPDATE `reason`=VALUES(`reason`);

