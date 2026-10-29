<?php
/**
 * GRM WHATSAPP CRM — MAIN APPLICATION DASHBOARD (PHP + HTML INTEGRATION)
 * Enforces server-side authentication, loads initial database state, and renders the application view.
 */
ini_set('session.gc_maxlifetime', 2592000); // 30-day session duration
session_set_cookie_params([
    'lifetime' => 2592000,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax'
]);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config/db.php';

// Server-Side Authentication Verification
if (empty($_SESSION['user'])) {
    if (!empty($_COOKIE['GRM_REMEMBER_USER'])) {
        $cookieData = json_decode(base64_decode($_COOKIE['GRM_REMEMBER_USER']), true);
        if ($cookieData) {
            $_SESSION['user'] = $cookieData;
        } else {
            header("Location: login.php");
            exit;
        }
    } else {
        header("Location: login.php");
        exit;
    }
}

$currentUser = $_SESSION['user'];
$isAdmin = ($currentUser['role'] === 'admin');

// Load configured WhatsApp account for initial render
$waPhone = '+91 86680 07593';
$brandName = 'GRM Garments Business Hub';

$configFile = __DIR__ . '/whatsapp_account_config.json';
if (file_exists($configFile)) {
    $cfg = json_decode(file_get_contents($configFile), true);
    if (!empty($cfg['phone_number'])) {
        $waPhone = $cfg['phone_number'];
        $brandName = $cfg['brand_name'] ?? $brandName;
    }
}

$pdo = getDBConnection();
if ($pdo) {
    try {
        $stmt = $pdo->query("SELECT * FROM `whatsapp_accounts` WHERE `account_slot` = 'account_1' LIMIT 1");
        $wa = $stmt->fetch();
        if ($wa && !empty($wa['phone_number'])) {
            $waPhone = $wa['phone_number'];
            $brandName = $wa['brand_name'] ?: $brandName;
        }
    } catch (Exception $e) {}
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>GRM WhatsApp CRM — Modern Customer Communication & Assignment Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0fdf4',
              100: '#dcfce7',
              200: '#bbf7d0',
              500: '#22c55e',
              600: '#16a34a',
              700: '#15803d',
              800: '#166534',
              900: '#14532d',
              dark: '#082417',
              wa: '#00a884',
              waDark: '#128c7e',
              waLight: '#25d366'
            },
            surface: {
              bg: '#f8fafc',
              card: '#ffffff',
              cardDark: '#0f172a',
              border: '#e2e8f0',
              borderDark: '#1e293b',
              sidebar: '#061a11',
              sidebarActive: '#103824'
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          },
          boxShadow: {
            'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.08)',
            'glow': '0 0 20px -5px rgba(34, 197, 94, 0.4)',
            'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)'
          }
        }
      }
    }
  </script>
  <style>
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: rgba(0, 0, 0, 0.02); }
    ::-webkit-scrollbar-thumb { background: rgba(0, 0, 0, 0.15); border-radius: 999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(0, 0, 0, 0.25); }
    .custom-chat-scroll { scroll-behavior: smooth; }
    .chat-bubble-in { border-radius: 0px 18px 18px 18px; }
    .chat-bubble-out { border-radius: 18px 0px 18px 18px; }
    .modal-backdrop { background: rgba(8, 36, 23, 0.65); backdrop-filter: blur(4px); }
    /* ========================================================================= */
    /* SIDEBAR TOGGLE & RESPONSIVE DRAWER STYLES                                */
    /* ========================================================================= */
    #app-sidebar {
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
           
      margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                  opacity 0.25s ease-in-out,
                  visibility 0.3s;
      will-change: transform, margin-left;
    }

    /* Small / Mobile / Tablet (< 1024px): Sliding Off-Canvas Drawer Overlay */
    @media (max-width: 1023px) {
      #app-sidebar {
        position: fixed !important;
        top: 0;
        bottom: 0;
        left: 0;
        height: 100vh !important;
        max-width: 85vw;
        z-index: 50 !important;
      }
      #app-sidebar.sidebar-hidden {
        transform: translateX(-100%) !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
      #app-sidebar.sidebar-visible {
        transform: translateX(0) !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        visibility: visible !important;
      }
    }

    /* Large / Desktop Screens (>= 1024px): Smooth Collapsible Flex Panel */
    @media (min-width: 1024px) {
      #app-sidebar {
        position: relative !important;
        height: 100% !important;
      }
      #app-sidebar.sidebar-hidden {
        margin-left: -16rem !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
      }
      #app-sidebar.sidebar-visible {
        margin-left: 0 !important;
        opacity: 1 !important;
        pointer-events: auto !important;
        visibility: visible !important;
      }
    }

    /* ========================================================================= */
    /* DYNAMIC DRAGGABLE PANEL SPLITTERS & RESIZERS                             */
    /* ========================================================================= */
    .resizer-splitter {
      width: 7px;
      position: relative;
      background: #e2e8f0;
      cursor: col-resize;
      flex-shrink: 0;
      z-index: 25;
      transition: background-color 0.15s ease, box-shadow 0.15s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      user-select: none;
      touch-action: none;
    }
    .resizer-splitter:hover,
    .resizer-splitter.is-resizing {
      background: #00a884 !important;
      box-shadow: 0 0 10px rgba(0, 168, 132, 0.45);
    }
    .resizer-splitter::after {
      content: '';
      width: 3px;
      height: 28px;
      background: #94a3b8;
      border-radius: 999px;
      transition: background-color 0.15s ease, height 0.15s ease;
    }
    .resizer-splitter:hover::after,
    .resizer-splitter.is-resizing::after {
      background: #ffffff;
      height: 42px;
    }
    .resizer-snap-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 22px;
      height: 22px;
      border-radius: 9999px;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 6px rgba(0,0,0,0.14);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      color: #334155;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.2s ease, transform 0.15s ease, background 0.15s ease, color 0.15s ease;
      z-index: 30;
    }
    .resizer-splitter:hover .resizer-snap-btn,
    .resizer-splitter.is-resizing .resizer-snap-btn {
      opacity: 1;
    }
    .resizer-snap-btn:hover {
      background: #00a884;
      color: #ffffff;
      border-color: #00a884;
      transform: translateY(-50%) scale(1.15);
    }

    /* Disable transition during mouse drag for ultra-responsive 60fps tracking */
    body.is-resizing-panels #inbox-left-panel,
    body.is-resizing-panels #chat-right-panel,
    body.is-resizing-panels #chat-center-panel,
    body.is-resizing-panels #app-sidebar {
      transition: none !important;
    }
  </style>
  <!-- Server-Side Authentication Session Injection -->
  <script>
    window.PHP_USER_SESSION = <?php echo json_encode($currentUser); ?>;
    localStorage.setItem('GRM_CRM_SESSION', JSON.stringify(window.PHP_USER_SESSION));
  </script>
</head>
<body class="bg-surface-bg font-sans text-slate-800 antialiased overflow-hidden flex h-screen relative">

  <!-- Sidebar Backdrop Overlay (Mobile & Tablet) -->
  <div id="sidebar-backdrop" onclick="toggleSidebar(false)" class="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 hidden transition-opacity duration-300 opacity-0 cursor-pointer lg:hidden"></div>

  <!-- ========================================================================= -->
  <!-- 1. LEFT NAVIGATION SIDEBAR -->
  <!-- ========================================================================= -->
  <aside id="app-sidebar" class="w-64 bg-surface-sidebar text-slate-200 flex flex-col h-full shrink-0 shadow-2xl border-r border-brand-900/50 z-40 select-none transition-all duration-300 ease-in-out sidebar-hidden relative">
    <!-- Main Sidebar Right Edge Resizer Handle (Drag with Mouse to Resize) -->
    <div id="resizer-app-sidebar" class="absolute top-0 -right-1 w-2.5 h-full hover:bg-emerald-500/50 active:bg-emerald-500 cursor-col-resize z-50 transition-colors select-none group hidden lg:block" title="Drag with mouse to resize navigation sidebar">
      <div class="h-10 w-1 bg-slate-500/50 group-hover:bg-emerald-300 rounded-full mx-auto my-auto mt-[45vh]"></div>
    </div>
    <!-- Brand Top -->
    <div class="h-16 flex items-center justify-between px-4 border-b border-brand-900/60 bg-brand-dark shrink-0">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-wa to-brand-500 flex items-center justify-center text-white shadow-glow shrink-0">
          <span class="material-symbols-outlined text-[22px]">chat</span>
        </div>
        <div class="min-w-0">
          <h1 class="font-bold text-base tracking-tight text-white flex items-center gap-1.5 truncate">
            GRM CRM <span class="text-[10px] bg-brand-500/20 text-brand-400 font-mono px-1.5 py-0.5 rounded">PHP v2.5</span>
          </h1>
          <p class="text-[11px] text-emerald-400/80 font-medium truncate"><?php echo htmlspecialchars($brandName); ?></p>
        </div>
      </div>
      <!-- Close Sidebar Button (Direct Inside Sidebar) -->
      <button type="button" onclick="toggleSidebar(false)" class="p-1.5 text-slate-400 hover:text-white hover:bg-emerald-800/60 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0" title="Close Sidebar Menu">
        <span class="material-symbols-outlined text-[20px]">close</span>
      </button>
    </div>

    <!-- Scrollable Navigation Links -->
    <nav class="flex-1 overflow-y-auto custom-chat-scroll p-3 space-y-1 text-xs font-medium min-h-0">
      <div id="nav-section-command-center" class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Command Center</div>

      <button onclick="switchView('dashboard')" id="nav-dashboard"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-emerald-400 group-hover:scale-110 transition">dashboard</span>
          <span>Dashboard</span>
        </div>
      </button>

      <!-- WhatsApp Inbox Module with Sub-Modules -->
      <div class="space-y-1">
        <button onclick="switchView('inbox', 'chats');" id="nav-inbox"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition bg-brand-wa text-white font-semibold shadow-sm cursor-pointer">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px]">inbox</span>
            <span>WhatsApp Inbox</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span id="badge-total-unread"
              class="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">3</span>
            <span class="material-symbols-outlined text-[16px] text-white/70 transition-transform duration-200"
              id="inbox-subnav-arrow">expand_more</span>
          </div>
        </button>

        <!-- WhatsApp Inbox Sub-Modules -->
        <div id="inbox-submodules-menu" class="pl-3 pr-1 py-1 space-y-1 ml-3 border-l-2 border-emerald-600/40">
          <!-- Sub-module 1: All Chats & Queue -->
          <button onclick="switchView('inbox', 'chats')" id="nav-inbox-sub-chats"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-emerald-200 bg-surface-sidebarActive font-semibold text-[11px] hover:text-white transition group"
            title="Active WhatsApp Chats & Customer Queue">
            <div class="flex items-center gap-2">
              <span
                class="material-symbols-outlined text-[15px] text-emerald-400 group-hover:scale-110 transition">forum</span>
              <span>All Chats &amp; Queue</span>
            </div>
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          </button>

          <!-- Sub-module 2: Auto-Reply Hub -->
          <button onclick="switchView('inbox', 'autoreply')" id="nav-inbox-sub-autoreply"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-sidebarActive text-[11px] font-medium transition group"
            title="Auto-Reply Bot Rules & Q&A Templates">
            <div class="flex items-center gap-2">
              <span
                class="material-symbols-outlined text-[15px] text-teal-400 group-hover:scale-110 transition">smart_toy</span>
              <span>Auto-Reply Hub</span>
            </div>
            <span id="nav-autoreply-pill"
              class="text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">ON</span>
          </button>

          <!-- Sub-module 3: Broadcast Templates -->
          <button onclick="switchView('inbox', 'broadcast')" id="nav-inbox-sub-broadcast"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-sidebarActive text-[11px] font-medium transition group"
            title="Custom Broadcast Templates & Blast Engine">
            <div class="flex items-center gap-2">
              <span
                class="material-symbols-outlined text-[15px] text-purple-400 group-hover:scale-110 transition">campaign</span>
              <span>Broadcast Templates</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded-full">Blast</span>
          </button>
        </div>
      </div>

      <div id="nav-section-sales-operations" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Sales & Operations</div>

      <button onclick="switchView('followups')" id="nav-followups"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-blue-400 group-hover:scale-110 transition">schedule</span>
          <span>Follow-up Due</span>
        </div>
        <span id="badge-followup-count"
          class="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">3 Today</span>
      </button>

      <button onclick="switchView('catalog')" id="nav-catalog"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-teal-400 group-hover:scale-110 transition">inventory_2</span>
          <span>Live Stock & Sharing</span>
        </div>
      </button>

      <!-- WHATSAPP ORDERS MODULE WITH SUBMODULES -->
      <div id="nav-orders-group" class="space-y-1">
        <button onclick="switchView('orders')" id="nav-orders" class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px] text-emerald-400 group-hover:scale-110 transition">shopping_bag</span>
            <span class="font-bold">WhatsApp Orders</span>
          </div>
          <span id="badge-orders-count" class="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full">6</span>
        </button>
        <!-- Sub-modules in Sidebar -->
        <div id="nav-orders-submodules" class="pl-7 pr-1 space-y-1">
          <button type="button" onclick="switchOrdersSubmodule('dashboard')" id="nav-sub-orders-dashboard" class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 transition cursor-pointer">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] text-emerald-400">analytics</span>
              <span>1. Order Dashboard</span>
            </div>
          </button>
          <button type="button" onclick="switchOrdersSubmodule('history')" id="nav-sub-orders-history" class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-sidebarActive transition cursor-pointer">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[16px] text-teal-400">history</span>
              <span>2. Order History</span>
            </div>
            <span id="nav-sub-orders-history-badge" class="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded-full font-bold">6</span>
          </button>
        </div>
      </div>

      <button onclick="switchView('customers')" id="nav-customers"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-purple-400 group-hover:scale-110 transition">groups</span>
          <span>Customer 360</span>
        </div>
      </button>

      <!-- DND / OPT-OUT CUSTOMERS MODULE -->
      <button onclick="switchView('dnd')" id="nav-dnd"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-rose-400 group-hover:scale-110 transition">do_not_disturb_on</span>
          <span>DND / Opt-Out List</span>
        </div>
        <span id="badge-dnd-count"
          class="bg-rose-500/20 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
      </button>

      <div id="nav-section-settings-admin" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Settings & Admin</div>

      <!-- PROMINENT WHATSAPP SETTINGS BUTTON -->
      <button onclick="switchView('settings')" id="nav-settings"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-emerald-300 group-hover:scale-110 transition">settings_phone</span>
          <span>WhatsApp Settings</span>
        </div>
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      </button>

      <!-- DATA BACKUP & RESTORE MODULE -->
      <button onclick="switchView('backup')" id="nav-backup"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 hover:text-white group">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-emerald-400 group-hover:scale-110 transition">cloud_sync</span>
          <span class="font-bold">Data Backup & Restore</span>
        </div>
        <span class="material-symbols-outlined text-[14px] text-emerald-400">download</span>
      </button>

            <!-- STAFF MANAGEMENT MODULE WITH 3 SUB-ITEMS (Admin Only) -->
      <div id="nav-staff-group" class="space-y-1">
        <button onclick="toggleStaffSubmenu()" id="nav-staff"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group"
          title="Staff & Team Management Hub">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px] text-blue-400 group-hover:scale-110 transition">badge</span>
            <span class="font-bold">Staff Management</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span id="badge-total-staff-count"
              class="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
            <span id="staff-subnav-arrow" class="material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200">expand_more</span>
          </div>
        </button>

        <!-- Sub-items in Sidebar -->
        <div id="staff-submodules-menu" class="pl-7 pr-1 space-y-1">
          <!-- Sub-item 1: All Staff -->
          <button type="button" onclick="switchStaffSubmodule('list')" id="nav-sub-staff-list"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-300 bg-blue-950/40 border border-blue-500/20 transition cursor-pointer"
            title="All Staff Directory & Table">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-blue-400">groups</span>
              <span>1. All Staff</span>
            </div>
            <span id="nav-sub-staff-count" class="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full font-bold">3</span>
          </button>

          <!-- Sub-item 2: Add Staff -->
          <button type="button" onclick="switchStaffSubmodule('create')" id="nav-sub-staff-create"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-surface-sidebarActive transition cursor-pointer"
            title="Onboard & Add New Staff Member">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-emerald-400">person_add</span>
              <span>2. Add Staff</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full">+New</span>
          </button>

          <!-- Sub-item 3: Role Base -->
          <button type="button" onclick="switchStaffSubmodule('roles')" id="nav-sub-staff-roles"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-surface-sidebarActive transition cursor-pointer"
            title="Role Base Access Control Matrix (View, Create, Edit, Delete for All Modules)">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-purple-400">admin_panel_settings</span>
              <span>3. Role Base</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded-full">RBAC</span>
          </button>
        </div>
      </div>

      <button onclick="switchView('analytics')" id="nav-analytics"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group admin-only-nav">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-indigo-400 group-hover:scale-110 transition">monitoring</span>
          <span>Staff KPI & Reports</span>
        </div>
      </button>

      <button onclick="switchView('audit')" id="nav-audit"
        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group admin-only-nav">
        <div class="flex items-center gap-3">
          <span
            class="material-symbols-outlined text-[20px] text-rose-400 group-hover:scale-110 transition">history</span>
          <span>Audit Trail & Security</span>
        </div>
      </button>
    </nav>

    <!-- Bottom User Info & Logout Button -->
    <div class="p-3 bg-brand-dark/90 border-t border-brand-900/60 shrink-0">
      <div class="bg-surface-sidebarActive p-2.5 rounded-xl border border-emerald-800/30 flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <span class="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Logged In As</span>
          <span id="current-role-badge" class="text-[10px] <?php echo $isAdmin ? 'bg-purple-500/30 text-purple-200 border-purple-400/30' : 'bg-blue-500/30 text-blue-200 border-blue-400/30'; ?> px-2 py-0.5 rounded-full font-bold border">
            <?php echo $isAdmin ? 'Super Admin' : 'Staff Workstation'; ?>
          </span>
        </div>
        
        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center gap-2">
            <div id="sidebar-user-avatar" class="w-7 h-7 rounded-lg bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
              <?php echo htmlspecialchars($currentUser['avatar'] ?? 'US'); ?>
            </div>
            <div class="overflow-hidden">
              <p id="sidebar-user-name" class="text-xs font-bold text-white truncate"><?php echo htmlspecialchars($currentUser['name'] ?? 'User'); ?></p>
              <p id="sidebar-user-role" class="text-[10px] text-emerald-400 truncate"><?php echo htmlspecialchars($currentUser['title'] ?? ($isAdmin ? 'Full Control Panel' : 'Staff Workstation')); ?></p>
            </div>
          </div>
          <a href="logout.php" class="p-1.5 text-rose-300 hover:text-white hover:bg-rose-500/20 rounded-lg transition" title="Logout from panel">
            <span class="material-symbols-outlined text-[18px]">logout</span>
          </a>
        </div>
        
        <p class="text-[9px] text-slate-400 text-center border-t border-emerald-900/50 pt-1.5">Role-Based Access Protected</p>
      </div>
    </div>
  </aside>

  <!-- ========================================================================= -->
  <!-- 2. MAIN CONTENT WRAPPER -->
  <!-- ========================================================================= -->
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">

    <!-- Top Header (Clean Height & Responsive Layout to Prevent Text Cutoff) -->
    <header class="min-h-[64px] bg-white border-b border-slate-200 px-3 sm:px-6 py-2.5 flex items-center justify-between shrink-0 shadow-sm z-20 gap-3">
      <!-- Left: Sidebar Toggle Menu Button & Dynamic Header Title -->
      <div class="flex items-center gap-2 sm:gap-3 min-w-0">
        <!-- Sidebar Toggle Menu Bar Button -->
        <button type="button" onclick="toggleSidebar()" id="sidebar-toggle-btn" class="p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 active:bg-emerald-100 rounded-xl transition flex items-center justify-center cursor-pointer shadow-xs border border-slate-200 shrink-0" title="Toggle Navigation Menu">
          <span class="material-symbols-outlined text-[24px]" id="sidebar-toggle-icon">menu</span>
        </button>

        <!-- Dynamic Header Title (Hidden in WhatsApp Inbox) -->
        <div id="header-title-container" class="flex items-center gap-3 min-w-0 max-w-sm md:max-w-md lg:max-w-lg hidden">
          <div class="min-w-0">
            <h2 id="page-title" class="font-bold text-base sm:text-lg text-slate-900 leading-tight truncate">WhatsApp Inbox &amp; Customer Queue</h2>
            <p id="page-subtitle" class="text-xs text-slate-500 truncate hidden sm:block">Live conversation management with instant staff assignment &amp; order booking</p>
          </div>
        </div>
      </div>

      <!-- Header Actions -->
      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <!-- Interactive Multi-WhatsApp Number Switcher Dropdown -->
        <div class="relative" id="header-phone-switcher-wrapper">
          <button type="button" onclick="togglePhoneSwitcherDropdown(event)" id="header-phone-badge" class="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold rounded-xl border border-emerald-200 transition shadow-sm cursor-pointer" title="Switch active WhatsApp Line / Business Number">
            <span class="relative flex h-2.5 w-2.5 shrink-0">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span class="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">phone_android</span>
            <span id="header-current-phone-label" class="configured-business-phone font-mono font-bold"><?php echo htmlspecialchars($waPhone); ?></span>
            <span class="material-symbols-outlined text-[16px] text-emerald-600 transition-transform duration-200 shrink-0" id="phone-dropdown-arrow">expand_more</span>
          </button>

          <!-- Dropdown Menu Box (Positioned left-0 to open towards the open space instead of under sidebar) -->
          <div id="phone-switcher-dropdown" class="hidden absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 text-xs">
            <div class="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p class="font-bold text-slate-900 text-xs">Switch WhatsApp Line</p>
                <p class="text-[10px] text-slate-500">Select active number to view &amp; send chats</p>
              </div>
              <span class="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full" id="dropdown-connected-count">2 Active Lines</span>
            </div>
            
            <div id="phone-dropdown-accounts-list" class="max-h-60 overflow-y-auto divide-y divide-slate-100 p-1">
              <!-- Rendered dynamically by JS -->
            </div>

            <div class="p-2 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <button type="button" onclick="switchView('settings'); closePhoneSwitcherDropdown();" class="w-full text-center py-1.5 px-3 bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 hover:border-emerald-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm">
                <span class="material-symbols-outlined text-[16px] text-emerald-600">qr_code_scanner</span>
                <span>+ Scan New WhatsApp Line / QR</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Masking Toggle Button -->
        <button onclick="toggleGlobalPhoneMasking()" id="btn-mask-toggle" class="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition shadow-sm admin-only-ui <?php echo $isAdmin ? '' : 'hidden'; ?>" title="Toggle Customer Phone Number Masking">
          <span class="material-symbols-outlined text-[16px] text-amber-700" id="mask-icon">lock</span>
          <span class="hidden lg:inline">Masking:</span>
          <span id="mask-status-label" class="font-bold">ON</span>
        </button>


        <!-- Reset Test Inbox Messages Button -->
        <button onclick="confirmResetInboxMessages()" id="header-reset-inbox-btn" class="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 text-xs font-bold rounded-lg transition shadow-sm" title="Reset all WhatsApp chat messages to default mock data (Dev Testing)">
          <span class="material-symbols-outlined text-[16px] text-rose-600">restart_alt</span>
          <span>Reset Inbox</span>
        </button>

        <!-- Notification Bell -->
        <div class="relative">
          <button onclick="toggleNotificationDrawer()" class="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition relative">
            <span class="material-symbols-outlined text-[20px]">notifications</span>
            <span id="header-notif-ping" class="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
          </button>
        </div>

        <div class="h-6 w-px bg-slate-200"></div>

        <!-- Current User Avatar Profile -->
        <div class="flex items-center gap-2 pl-1">
          <div id="user-avatar-initials" class="w-8 h-8 rounded-full bg-gradient-to-tr <?php echo $isAdmin ? 'from-purple-600 to-indigo-600' : 'from-brand-wa to-emerald-600'; ?> text-white font-bold text-xs flex items-center justify-center shadow-sm">
            <?php echo htmlspecialchars($currentUser['avatar'] ?? 'US'); ?>
          </div>
          <div class="hidden md:block text-left">
            <p id="user-display-name" class="text-xs font-bold text-slate-800 leading-none"><?php echo htmlspecialchars($currentUser['name'] ?? 'User'); ?></p>
            <p id="user-display-sub" class="text-[10px] text-emerald-600 font-medium leading-none mt-1"><?php echo htmlspecialchars($currentUser['title'] ?? ($isAdmin ? 'Full System Access' : 'Staff Workstation')); ?></p>
          </div>
        </div>

        <!-- Header Logout Link -->
        <a href="logout.php" class="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition shadow-sm ml-1" title="Sign out from CRM Panel">
          <span class="material-symbols-outlined text-[16px]">logout</span>
          <span class="hidden sm:inline">Logout</span>
        </a>
      </div>
    </header>

    <!-- Staff Workstation Info Banner -->
    <div id="staff-workstation-banner" class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 sm:px-6 py-2 flex flex-col sm:flex-row sm:items-center justify-between border-b border-indigo-500/30 gap-2 <?php echo $isAdmin ? 'hidden' : ''; ?>">
      <div class="flex items-center gap-3">
        <span class="px-2.5 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 border border-indigo-400/40 text-[10px] font-extrabold flex items-center gap-1.5 shrink-0">
          <span class="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          STAFF WORKSTATION PANEL
        </span>
        <p class="text-xs text-indigo-100 truncate">
          Showing assigned conversations for: <strong id="staff-banner-name" class="text-white"><?php echo htmlspecialchars($currentUser['name']); ?></strong> (<span id="staff-banner-role" class="text-indigo-200 font-medium"><?php echo htmlspecialchars($currentUser['title'] ?? $currentUser['role']); ?></span>).
        </p>
      </div>
      <div class="flex items-center gap-2.5 shrink-0">
        <!-- Live Staff Daily Message Allocation Quota Indicator -->
        <div class="flex items-center gap-2 bg-indigo-900/80 border border-indigo-400/40 px-3 py-1 rounded-xl shadow-sm">
          <span class="material-symbols-outlined text-[16px] text-emerald-400">stacked_bar_chart</span>
          <div class="text-[11px] leading-tight flex items-center gap-1.5">
            <span class="text-indigo-200 hidden md:inline">Today's Allocation:</span>
            <strong id="staff-banner-quota" class="text-emerald-300 font-extrabold font-mono">0 / 70 msgs (0%)</strong>
          </div>
          <!-- Mini Progress Bar -->
          <div class="w-16 h-1.5 bg-indigo-950 rounded-full overflow-hidden border border-indigo-700/50 hidden lg:block">
            <div id="staff-banner-progress-bar" class="h-full bg-emerald-400 rounded-full transition-all duration-500" style="width: 0%"></div>
          </div>
        </div>

        <span class="text-[11px] text-slate-400 font-mono">Staff ID: <span id="staff-banner-id" class="text-indigo-300 font-bold"><?php echo htmlspecialchars($currentUser['id']); ?></span></span>
      </div>
    </div>

    <!-- ========================================================================= -->
    <!-- 3. VIEWS CONTAINER (INCLUDE APPLICATION MODULES) -->
    <!-- ========================================================================= -->
    <main class="flex-1 overflow-hidden relative">
      <?php
      // Include the view sections from index.html template
      $html = file_get_contents(__DIR__ . '/index.html');
      // Extract content within <main class="flex-1 overflow-hidden relative"> ... </main>
      if (preg_match('/<main class="flex-1 overflow-hidden relative">(.*?)<\/main>/s', $html, $matches)) {
          echo $matches[1];
      }
      ?>
    </main>
  </div>

  <!-- INCLUDE MODALS & SCRIPTS -->
  <?php
  // Extract modals and scripts from index.html (Everything between </main> and </body>)
  if (preg_match('/<\/main>(.*?)<\/body>/s', $html, $matches)) {
      echo $matches[1];
  }
  ?>
</body>
</html>
