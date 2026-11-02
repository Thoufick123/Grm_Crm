-- =========================================================================
-- GRM WHATSAPP CRM — COMPREHENSIVE PRODUCTION DATABASE SCHEMA
-- Target Database: `grm_crm_db` (MySQL / MariaDB / phpMyAdmin / Docker)
-- Multi-developer unified: Voice Translation, Telephony Softphone, Staff RBAC,
-- Catalog Meta, Orders/Payment Pipeline, DND Suppression, and WhatsApp Hub
-- =========================================================================

CREATE DATABASE IF NOT EXISTS `grm_crm_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `grm_crm_db`;

-- 1. Users & Staff Table (Role-Based Authentication & Language Preferences)
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
    `status` VARCHAR(50) DEFAULT 'ACTIVE',
    `preferred_language` VARCHAR(20) DEFAULT 'ta',
    `active_queries` INT DEFAULT 0,
    `converted` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`status`),
    INDEX(`role`)
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

-- 3. Customers Directory (Customer 360 & DND Status)
CREATE TABLE IF NOT EXISTS `customers` (
    `id` VARCHAR(50) PRIMARY KEY,
    `code` VARCHAR(50) UNIQUE NOT NULL,
    `name` VARCHAR(100) NOT NULL,
    `phone` VARCHAR(30) NOT NULL,
    `whatsapp` VARCHAR(30) NOT NULL,
    `alt_phone` VARCHAR(30) NULL,
    `email` VARCHAR(100) NULL,
    `gender` VARCHAR(20) NULL,
    `age` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `alt_address` TEXT NULL,
    `city` VARCHAR(50) NULL,
    `customer_type` VARCHAR(50) DEFAULT 'New WhatsApp Customer',
    `tags` TEXT NULL,
    `tags_json` TEXT NULL,
    `total_orders` INT DEFAULT 0,
    `total_spend` DECIMAL(10,2) DEFAULT 0.00,
    `avatar` VARCHAR(10) NULL,
    `is_dnd` TINYINT(1) DEFAULT 0,
    `dnd_reason` TEXT NULL,
    `dnd_notes` TEXT NULL,
    `dnd_marked_by` VARCHAR(100) NULL,
    `dnd_timestamp` VARCHAR(50) NULL,
    `notes` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`phone`),
    INDEX(`whatsapp`),
    INDEX(`is_dnd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Customer Enquiries & Lead Pipeline
CREATE TABLE IF NOT EXISTS `queries` (
    `id` VARCHAR(50) PRIMARY KEY,
    `customer_id` VARCHAR(50) NOT NULL,
    `assigned_to` VARCHAR(50) DEFAULT 'UNASSIGNED',
    `status` VARCHAR(50) DEFAULT 'NEW',
    `priority` VARCHAR(20) DEFAULT 'NORMAL',
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
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`customer_id`),
    INDEX(`assigned_to`),
    INDEX(`status`),
    INDEX(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. WhatsApp Chat Messages & Audio Notes
CREATE TABLE IF NOT EXISTS `messages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `message_uid` VARCHAR(100) UNIQUE NULL,
    `customer_id` VARCHAR(50) NOT NULL,
    `sender` VARCHAR(20) NOT NULL DEFAULT 'customer',
    `direction` ENUM('inbound', 'outbound') DEFAULT 'inbound',
    `text` TEXT NULL,
    `message_text` TEXT NULL,
    `media_type` VARCHAR(30) NULL,
    `media_url` TEXT NULL,
    `audio_duration` VARCHAR(20) NULL,
    `time_str` VARCHAR(30) NULL,
    `status` VARCHAR(30) DEFAULT 'DELIVERED',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`customer_id`),
    INDEX(`created_at`)
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
    `delivery_note` TEXT NULL,
    `account_id` VARCHAR(50) DEFAULT 'account_1',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`category`),
    INDEX(`sku`)
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
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`category_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6.3 Attributes Table (Sizes, Colors, Fabrics, Role Permissions, Custom)
CREATE TABLE IF NOT EXISTS `attributes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `type` VARCHAR(50) NOT NULL,
    `value` VARCHAR(150) NOT NULL,
    `extra` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. WhatsApp Sales Orders & Reservations
CREATE TABLE IF NOT EXISTS `orders` (
    `id` VARCHAR(50) PRIMARY KEY,
    `query_id` VARCHAR(50) NULL,
    `customer_id` VARCHAR(50) NOT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_phone` VARCHAR(30) NULL,
    `shipping_address` TEXT NULL,
    `items_json` JSON NOT NULL,
    `grand_total` DECIMAL(10,2) NOT NULL,
    `shipping_amount` DECIMAL(10,2) DEFAULT 0.00,
    `advance_payment` DECIMAL(10,2) DEFAULT 0.00,
    `balance_amount` DECIMAL(10,2) DEFAULT 0.00,
    `cod_advance` DECIMAL(10,2) DEFAULT 0.00,
    `cod_balance_due` DECIMAL(10,2) DEFAULT 0.00,
    `payment_method` VARCHAR(50) DEFAULT 'COD',
    `payment_status` VARCHAR(50) DEFAULT 'PENDING',
    `upi_transaction_id` VARCHAR(100) NULL,
    `payment_screenshot` LONGTEXT NULL,
    `order_status` VARCHAR(50) DEFAULT 'PLACED',
    `staff_id` VARCHAR(50) NULL,
    `staff_name` VARCHAR(100) NULL,
    `created_by` VARCHAR(100) NULL,
    `notes` TEXT NULL,
    `tracking_number` VARCHAR(100) NULL,
    `courier_name` VARCHAR(100) NULL,
    `shipping_url` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`customer_id`),
    INDEX(`order_status`),
    INDEX(`staff_id`),
    INDEX(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Customer Follow-up Reminders & Payment Tracking
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
    `status` VARCHAR(30) DEFAULT 'PENDING',
    `outcome` VARCHAR(30) DEFAULT 'PENDING',
    `priority` VARCHAR(20) DEFAULT 'NORMAL',
    `contact_channel` VARCHAR(30) DEFAULT 'WHATSAPP',
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
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`customer_id`),
    INDEX(`assigned_to`),
    INDEX(`status`),
    INDEX(`date_str`),
    INDEX(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Tamper-Proof Audit Trail (Dual Schema Compatible)
CREATE TABLE IF NOT EXISTS `audit_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user` VARCHAR(100) NULL,
    `actor` VARCHAR(100) NULL,
    `action` VARCHAR(100) NULL,
    `action_type` VARCHAR(100) NULL,
    `module` VARCHAR(100) NULL,
    `category` VARCHAR(100) NULL,
    `details` TEXT NULL,
    `description` TEXT NULL,
    `timestamp_str` VARCHAR(50) NULL,
    `ip_address` VARCHAR(50) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(`user`),
    INDEX(`actor`),
    INDEX(`action`),
    INDEX(`module`),
    INDEX(`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. DND Management & Suppression List
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

-- 11. Auto-Reply Rules Table (Auto-Reply Hub in WhatsApp Inbox)
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

-- 12. Broadcast Templates Table (Marketing & Announcements)
CREATE TABLE IF NOT EXISTS `broadcast_templates` (
    `id` VARCHAR(50) PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(50) DEFAULT 'MARKETING',
    `body_text` TEXT NOT NULL,
    `variables_json` JSON NULL,
    `image_url` TEXT NULL,
    `button_type` VARCHAR(50) NULL,
    `button_text` VARCHAR(100) NULL,
    `button_url` TEXT NULL,
    `status` VARCHAR(30) DEFAULT 'ACTIVE',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Staff KPI Reports Table
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

-- 14. Call & Telephony Masking Settings Table
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

-- 15. Call Sessions Table (Atomic Multi-agent Telephony & Softphone)
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

-- 16. Call Assignments Table (First Successful Claim Wins Audit)
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

-- 17. Call Activity Logs Table
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

-- 18. WhatsApp Multilingual Voice Messages Table
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

-- 19. WhatsApp Voice Translations Table (STT -> Translate -> TTS Audio Pipeline)
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

-- =========================================================================
-- INITIAL SUPER ADMIN ACCOUNT (FULL CONTROL ACCESS)
-- =========================================================================
INSERT INTO `users` (`id`, `username`, `password`, `name`, `role`, `email`, `phone`, `specialization`, `avatar`, `status`, `preferred_language`, `active_queries`, `converted`)
VALUES ('admin', 'admin', '$2y$10$wT/0DqQ4pL8C3eU9ZzQ7fe7vQhK.T9K6hL4nQ8v.L7R0hU1N9p7Uq', 'Super Admin', 'Admin Manager (Full Control)', 'admin@grmgarments.com', '+91 97896 60115', 'Full Control', 'SA', 'ACTIVE', 'ta', 0, 0)
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- =========================================================================
-- SQL COMMANDS: QUICK DATA WIPE & RESET FOR ALL CRM TABLES
-- (Uncomment and run these queries in phpMyAdmin / MySQL CLI to clear tables)
-- =========================================================================

-- MASTER WIPE ALL DATA (Resets all 21 tables cleanly with auto-increment reset):
/*
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE `voice_translations`;
TRUNCATE TABLE `voice_messages`;
TRUNCATE TABLE `call_activity_logs`;
TRUNCATE TABLE `call_assignments`;
TRUNCATE TABLE `call_sessions`;
TRUNCATE TABLE `masking_settings`;
TRUNCATE TABLE `staff_kpis`;
TRUNCATE TABLE `broadcast_templates`;
TRUNCATE TABLE `auto_reply_rules`;
TRUNCATE TABLE `dnd_records`;
TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `followups`;
TRUNCATE TABLE `orders`;
TRUNCATE TABLE `attributes`;
TRUNCATE TABLE `subcategories`;
TRUNCATE TABLE `categories`;
TRUNCATE TABLE `products`;
TRUNCATE TABLE `messages`;
TRUNCATE TABLE `queries`;
TRUNCATE TABLE `customers`;
TRUNCATE TABLE `whatsapp_accounts`;
DELETE FROM `users` WHERE `id` != 'admin';
SET FOREIGN_KEY_CHECKS = 1;
*/

-- INDIVIDUAL TABLE DATA DELETE / TRUNCATE COMMANDS:
-- 1. Users & Staff (Deletes staff accounts while preserving Super Admin):
-- DELETE FROM `users` WHERE `id` != 'admin';
-- TRUNCATE TABLE `users`; -- Caution: removes Super Admin as well

-- 2. WhatsApp Business Accounts:
-- TRUNCATE TABLE `whatsapp_accounts`;
-- DELETE FROM `whatsapp_accounts`;

-- 3. Customers Directory (Customer 360):
-- TRUNCATE TABLE `customers`;
-- DELETE FROM `customers`;

-- 4. Customer Enquiries & Lead Pipeline:
-- TRUNCATE TABLE `queries`;
-- DELETE FROM `queries`;

-- 5. WhatsApp Chat Messages & Voice Notes:
-- TRUNCATE TABLE `messages`;
-- DELETE FROM `messages`;

-- 6. Products Catalog:
-- TRUNCATE TABLE `products`;
-- DELETE FROM `products`;

-- 6.1 Categories:
-- TRUNCATE TABLE `categories`;
-- DELETE FROM `categories`;

-- 6.2 Subcategories:
-- TRUNCATE TABLE `subcategories`;
-- DELETE FROM `subcategories`;

-- 6.3 Attributes (Sizes, Colors, Fabrics, Role Permissions):
-- TRUNCATE TABLE `attributes`;
-- DELETE FROM `attributes`;

-- 7. WhatsApp Sales Orders:
-- TRUNCATE TABLE `orders`;
-- DELETE FROM `orders`;

-- 8. Customer Follow-up Reminders:
-- TRUNCATE TABLE `followups`;
-- DELETE FROM `followups`;

-- 9. Tamper-Proof Audit Trail:
-- TRUNCATE TABLE `audit_logs`;
-- DELETE FROM `audit_logs`;

-- 10. DND Suppression List:
-- TRUNCATE TABLE `dnd_records`;
-- DELETE FROM `dnd_records`;

-- 11. Auto-Reply Rules:
-- TRUNCATE TABLE `auto_reply_rules`;
-- DELETE FROM `auto_reply_rules`;

-- 12. Broadcast Templates:
-- TRUNCATE TABLE `broadcast_templates`;
-- DELETE FROM `broadcast_templates`;

-- 13. Staff KPI Reports:
-- TRUNCATE TABLE `staff_kpis`;
-- DELETE FROM `staff_kpis`;

-- 14. Telephony & Masking Settings:
-- TRUNCATE TABLE `masking_settings`;
-- DELETE FROM `masking_settings`;

-- 15. Call Sessions:
-- TRUNCATE TABLE `call_sessions`;
-- DELETE FROM `call_sessions`;

-- 16. Call Assignments:
-- TRUNCATE TABLE `call_assignments`;
-- DELETE FROM `call_assignments`;

-- 17. Call Activity Logs:
-- TRUNCATE TABLE `call_activity_logs`;
-- DELETE FROM `call_activity_logs`;

-- 18. WhatsApp Multilingual Voice Messages:
-- TRUNCATE TABLE `voice_messages`;
-- DELETE FROM `voice_messages`;

-- 19. WhatsApp Voice Translations:
-- TRUNCATE TABLE `voice_translations`;
-- DELETE FROM `voice_translations`;
