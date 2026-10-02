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
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customer Enquiries & Lead Assignments
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
    `size` VARCHAR(50) NOT NULL,
    `color` VARCHAR(50) NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `physical_stock` INT DEFAULT 0,
    `reserved_stock` INT DEFAULT 0,
    `image` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. WhatsApp Sales Orders
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

-- 8. Customer Follow-up Reminders
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

-- Seed Products
INSERT INTO `products` (`sku`, `name`, `category`, `size`, `color`, `price`, `physical_stock`, `reserved_stock`, `image`)
VALUES 
('BF-001-PK', 'Baby Frock (Embroidered Cotton)', 'Baby Collection', '2-3 Years', 'Pink', 599.00, 12, 4, 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60'),
('BF-001-YL', 'Baby Frock (Embroidered Cotton)', 'Baby Collection', '1-2 Years', 'Sunshine Yellow', 599.00, 8, 1, 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&auto=format&fit=crop&q=60'),
('MD-102-BL', 'Maternity Maxi Feeding Gown', 'Maternity', 'L / XL', 'Sky Blue', 1299.00, 10, 5, 'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=400&auto=format&fit=crop&q=60'),
('KD-204-YL', 'Kids Organic Cotton T-Shirt Set (Pack of 3)', 'Kids', '4-5 Years', 'Multi Yellow/Green', 450.00, 25, 8, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=60'),
('GL-505-RD', 'Girls Festive Silk Lehenga Choli', 'Girls Festive', '6-7 Years', 'Ruby Red & Gold', 899.00, 6, 0, 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=60'),
('BB-301-WH', 'Newborn 5-Piece Organic Romper Gift Set', 'Newborn', '0-6 Months', 'Pure White / Mint', 799.00, 15, 2, 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&auto=format&fit=crop&q=60')
ON DUPLICATE KEY UPDATE `price`=VALUES(`price`);
