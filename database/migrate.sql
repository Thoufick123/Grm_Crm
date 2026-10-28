USE grm_crm_db;

-- 1. Update customers table with email, gender, age
ALTER TABLE customers 
  ADD COLUMN IF NOT EXISTS email VARCHAR(100) NULL AFTER whatsapp,
  ADD COLUMN IF NOT EXISTS gender VARCHAR(20) NULL AFTER email,
  ADD COLUMN IF NOT EXISTS age VARCHAR(20) NULL AFTER gender;

-- 2. Update audit_logs with ip_address
ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS ip_address VARCHAR(50) NULL AFTER timestamp_str;

-- 3. Create auto_reply_rules table for Auto-Reply Hub
CREATE TABLE IF NOT EXISTS auto_reply_rules (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    keywords TEXT NOT NULL,
    action_type VARCHAR(50) DEFAULT 'custom_text',
    category_id VARCHAR(50) NULL,
    reply_text TEXT NOT NULL,
    enabled TINYINT(1) DEFAULT 1,
    auto_send TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Create broadcast_templates table for Broadcast Templates
CREATE TABLE IF NOT EXISTS broadcast_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) DEFAULT 'MARKETING',
    body_text TEXT NOT NULL,
    image_url TEXT NULL,
    button_type VARCHAR(50) NULL,
    button_text VARCHAR(100) NULL,
    button_url TEXT NULL,
    status VARCHAR(30) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Create staff_kpis table for Staff KPI & Reports
CREATE TABLE IF NOT EXISTS staff_kpis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    staff_id VARCHAR(50) NOT NULL,
    report_date DATE NOT NULL,
    chats_handled INT DEFAULT 0,
    orders_booked INT DEFAULT 0,
    total_sales_value DECIMAL(10,2) DEFAULT 0.00,
    followups_completed INT DEFAULT 0,
    avg_response_time_minutes DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(staff_id),
    INDEX(report_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SHOW TABLES;
