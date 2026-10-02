# GRM WhatsApp CRM & Business Hub (v2.5)
*Modern Real-Time Customer Communication, Staff Assignment, and Order Management System*

---

## 📁 Organized Project Structure

```text
crm/
├── 🌐 Web & Application Pages
│   ├── index.html                  # Main WhatsApp CRM Single-Page Dashboard & Workstation
│   ├── index.php                   # PHP Session Gateway (Validates Auth before rendering app)
│   ├── login.html                  # Dedicated Standalone HTML/JS Login Page
│   └── login.php                   # PHP Login Session Wrapper
│
├── ⚙️ Backend API & Controllers
│   ├── api.php                     # Full REST API (MySQL CRUD, State Sync, Orders, Staff)
│   ├── auth.php                    # Authentication Controller (Login, Logout, Session Check)
│   └── webhook.php                 # Inbound WhatsApp Webhook Receiver
│
├── 📂 config/
│   └── db.php                      # XAMPP MySQL PDO Connection & Schema Auto-Migration
│
├── 📂 database/
│   └── database.sql                # Full SQL Schema & Seed Data (For phpMyAdmin import)
│
├── 📂 assets/
│   └── js/
│       └── crm_app.js              # Core Application Logic, Socket.IO, State & RBAC Engine
│
├── 📂 bridge/
│   ├── server.js                   # Node.js Baileys Real-Time Multi-Account Bridge
│   ├── package.json                # Dependencies for Socket.IO & Baileys
│   └── auth_sessions/              # Persistent WhatsApp Multi-Number Credentials
│
├── 📂 docs/
│   ├── requirements.txt            # System Specification & Architecture Notes
│   ├── GRM WhatsApp Business.docx  # Original Business Requirements
│   └── docx_extracted.txt          # Extracted Text Documentation
│
├── 📂 scripts/
│   ├── extract_docx.ps1            # Document parser utility
│   ├── test_inbound.ps1            # Inbound test simulator
│   ├── build_crm_app.js            # Build script
│   └── update_html_and_js.js       # Layout synchronizer
│
└── 📂 logs/                        # Server & execution log files
```

---

## 🚀 Key URLs
- **Main CRM Panel**: `http://localhost:8080/index.html` (or `http://localhost:8080/index.php`)
- **Dedicated Login Page**: `http://localhost:8080/login.html` (or `http://localhost:8080/login.php`)
- **Backend API**: `http://localhost:8080/api.php?action=get_state`
- **Auth Endpoint**: `http://localhost:8080/auth.php?action=check_session`
- **Node.js WhatsApp Bridge**: `http://localhost:3000`

---

## 👥 Demo Login Credentials

| Role | Username | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **👑 Super Admin** | `admin` | `admin123` | **Full Control Panel**: Settings, Staff Hub, Backups, Unmasking, All Chats |
| **👩‍💼 Staff 01 (Priya)** | `priya` / `staff_01` | `staff123` | **Sales Specialist**: Assigned Baby Collection Chats, Stock Check & Orders |
| **👨‍💼 Staff 02 (Rahul)** | `rahul` / `staff_02` | `staff123` | **Enquiry Specialist**: Assigned Maternity & Kids Wear Queries |
| **👩‍💼 Staff 03 (Sneha)** | `sneha` / `staff_03` | `staff123` | **Order Fulfillment**: Assigned Customer Orders & Follow-ups |
