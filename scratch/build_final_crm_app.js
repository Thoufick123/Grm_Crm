const fs = require('fs');

// Read pristine clean code from assets/js/crm_app.js
let code = fs.readFileSync('d:/crm whatsapp/crm-app/assets/js/crm_app.js', 'utf8');
console.log('Read clean assets code, length:', code.length);

// Step 1: Remove old canUserPerformAction block at the bottom
const oldCanUserStart = code.indexOf('// 10. Granular Permission Checker for any Module & Action');
const oldCanUserEnd = code.indexOf('// 11. Quick Role Reassign Action', oldCanUserStart);
if (oldCanUserStart !== -1 && oldCanUserEnd !== -1) {
  code = code.substring(0, oldCanUserStart) + code.substring(oldCanUserEnd);
  console.log('1. Removed old canUserPerformAction block');
} else {
  console.error('Failed to find old canUserPerformAction block!');
}

// Step 2: Remove old CRM_MODULE_DEFINITIONS block at the bottom
const oldDefStart = code.indexOf('// Complete 12 CRM Modules Definition');
const oldInitEnd = code.indexOf('// 1. Toggle Sidebar Staff Submenu (Accordion)', oldDefStart);
if (oldDefStart !== -1 && oldInitEnd !== -1) {
  code = code.substring(0, oldDefStart) + code.substring(oldInitEnd);
  console.log('2. Removed old CRM_MODULE_DEFINITIONS block');
} else {
  console.error('Failed to find old CRM_MODULE_DEFINITIONS block!');
}

// Step 3: Replace applyRoleBasedAccessControl
const oldApplyStart = code.indexOf('function applyRoleBasedAccessControl(user) {');
const endSwitchViewCall = code.indexOf('switchView(ACTIVE_VIEW);', oldApplyStart);
const oldApplyEnd = code.indexOf('}', endSwitchViewCall) + 1;

const newApplyFunc = `function applyRoleBasedAccessControl(user) {
  if (!user) return;
  CURRENT_USER = user;
  window.CRM_AUTH_SESSION = user;
  window.CURRENT_USER = user;
  CRM_AUTH_SESSION = user;
  ACTIVE_ROLE = user.role || 'admin';

  const isAdmin = (user.role === 'admin' || user.id === 'admin' || user.role === 'Super Admin' || (user.title && user.title.includes('Admin Manager')));

  const roleBadge = document.getElementById('current-role-badge');
  const avatarInitials = document.getElementById('user-avatar-initials');
  const userDisplayName = document.getElementById('user-display-name');
  const userDisplaySub = document.getElementById('user-display-sub');

  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarRole = document.getElementById('sidebar-user-role');

  const staffBanner = document.getElementById('staff-workstation-banner');
  const staffBannerName = document.getElementById('staff-banner-name');
  const staffBannerRole = document.getElementById('staff-banner-role');
  const staffBannerId = document.getElementById('staff-banner-id');

  // 1. Update Profile Badges and Avatar
  if (roleBadge) {
    roleBadge.innerText = isAdmin ? 'Super Admin' : 'Staff Workstation';
    roleBadge.className = isAdmin
      ? 'text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-400/30'
      : 'text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-bold border border-blue-400/30';
  }

  if (avatarInitials) {
    avatarInitials.innerText = user.avatar || (isAdmin ? 'SA' : 'ST');
    avatarInitials.className = isAdmin
      ? 'w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm'
      : 'w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm';
  }

  if (userDisplayName) userDisplayName.innerText = user.name || (isAdmin ? 'Admin Manager' : 'Staff Member');
  if (userDisplaySub) userDisplaySub.innerText = isAdmin ? 'Full System Access' : (user.title || user.role);

  if (sidebarAvatar) sidebarAvatar.innerText = user.avatar || (isAdmin ? 'SA' : 'ST');
  if (sidebarName) sidebarName.innerText = user.name || (isAdmin ? 'Super Admin' : 'Staff Member');
  if (sidebarRole) sidebarRole.innerText = isAdmin ? 'Full Control Panel' : (user.title || user.role);

  // 2. Control Staff Workstation Info Banner
  if (staffBanner) {
    if (isAdmin) {
      staffBanner.classList.add('hidden');
    } else {
      staffBanner.classList.remove('hidden');
      if (staffBannerName) staffBannerName.innerText = user.name;
      if (staffBannerRole) staffBannerRole.innerText = user.title || user.role;
      if (staffBannerId) staffBannerId.innerText = user.staffId || user.staff_id || user.id || user.role;

      const staffBannerQuota = document.getElementById('staff-banner-quota');
      const staffMember = (CRM_STATE?.staffList || []).find(s => s.id === (user.staffId || user.staff_id || user.id || user.role));
      const handled = staffMember ? (staffMember.todayHandled || 0) : 0;
      if (staffBannerQuota) {
        staffBannerQuota.innerText = \`\${handled} msgs\`;
      }
    }
  }

  // 3. Role-Based Navigation & Granular Module Visibility Filtering
  CRM_MODULE_DEFINITIONS.forEach(mod => {
    const canView = canUserPerformAction(mod.key, 'view');
    const navGroupEl = document.getElementById('nav-' + mod.key + '-group');
    const navEl = document.getElementById('nav-' + mod.key);

    if (navGroupEl) {
      if (canView) navGroupEl.classList.remove('hidden');
      else navGroupEl.classList.add('hidden');
    } else if (navEl) {
      if (canView) navEl.classList.remove('hidden');
      else navEl.classList.add('hidden');
    }
  });

  // Dynamic Section Headers
  const adminSection = document.getElementById('nav-section-settings-admin');
  if (adminSection) {
    const hasAnyAdmin = ['settings', 'backup', 'staff', 'analytics', 'audit'].some(k => canUserPerformAction(k, 'view'));
    if (hasAnyAdmin) adminSection.classList.remove('hidden');
    else adminSection.classList.add('hidden');
  }

  const salesSection = document.getElementById('nav-section-sales-operations');
  if (salesSection) {
    const hasAnySales = ['followups', 'catalog', 'orders', 'customers', 'dnd'].some(k => canUserPerformAction(k, 'view'));
    if (hasAnySales) salesSection.classList.remove('hidden');
    else salesSection.classList.add('hidden');
  }

  // Hide Admin-only header controls: Masking toggle, phone settings button, inbound simulator
  document.querySelectorAll('.admin-only-ui').forEach(el => {
    if (isAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Enforce granular actions in views
  enforceGranularActionPermissions();

  // 4. In Staff Mode, default filter Inbox to 'my' assigned queue
  if (!isAdmin) {
    setInboxFilter('my');
  } else {
    setInboxFilter('all');
  }

  // 5. If currently on a view without view permission, redirect to first allowed view
  if (!canUserPerformAction(ACTIVE_VIEW, 'view')) {
    const firstAllowed = CRM_MODULE_DEFINITIONS.find(m => canUserPerformAction(m.key, 'view'));
    ACTIVE_VIEW = firstAllowed ? firstAllowed.key : 'inbox';
  }

  switchView(ACTIVE_VIEW);
}`;

if (oldApplyStart !== -1 && oldApplyEnd !== -1) {
  code = code.substring(0, oldApplyStart) + newApplyFunc + code.substring(oldApplyEnd);
  console.log('3. Replaced applyRoleBasedAccessControl successfully');
} else {
  console.error('Failed to find applyRoleBasedAccessControl! oldApplyStart:', oldApplyStart, 'oldApplyEnd:', oldApplyEnd);
}

// Step 4: Update switchView
const targetSwitchAdminOnly = `  // Enforce Role-Based Access Control: Admin-only modules
  const adminOnlyViews = ['settings', 'backup', 'staff', 'audit', 'analytics'];
  if (ACTIVE_ROLE !== 'admin' && adminOnlyViews.includes(viewName)) {
    showToast('Access Restricted', 'Super Admin privileges are required to access this module.', 'lock', 'rose');
    viewName = 'inbox';
  }`;

const replSwitchAdminOnly = `  // Enforce Role-Based Access Control
  if (typeof canUserPerformAction === 'function' && !canUserPerformAction(viewName, 'view')) {
    showToast('Access Restricted', 'Your assigned role does not have permission to view this module.', 'lock', 'rose');
    const firstAllowed = (typeof CRM_MODULE_DEFINITIONS !== 'undefined' ? CRM_MODULE_DEFINITIONS : []).find(m => canUserPerformAction(m.key, 'view'));
    viewName = firstAllowed ? firstAllowed.key : 'inbox';
  }`;

// Use regex with CRLF flexibility
code = code.replace(/\/\/ Enforce Role-Based Access Control: Admin-only modules[\r\n\s]+const adminOnlyViews = \['settings', 'backup', 'staff', 'audit', 'analytics'\];[\r\n\s]+if \(ACTIVE_ROLE !== 'admin' && adminOnlyViews\.includes\(viewName\)\) \{[\r\n\s]+showToast\('Access Restricted', 'Super Admin privileges are required to access this module\.', 'lock', 'rose'\);[\r\n\s]+viewName = 'inbox';[\r\n\s]+\}/, replSwitchAdminOnly);

code = code.replace(/views\.forEach\(v => \{[\r\n\s]+const el = document\.getElementById\(`view-\$\{v\}`\);/, `if (typeof enforceGranularActionPermissions === 'function') {
    enforceGranularActionPermissions();
  }
  views.forEach(v => {
    const el = document.getElementById(\`view-\${v}\`);`);
console.log('4. Updated switchView RBAC check');

// Step 5: Update renderStaffTable action buttons
const targetStaffActionsRegex = /<!-- Actions -->[\r\n\s]+<td class="py-3 px-4 text-right">[\r\n\s]+<div class="flex items-center justify-end gap-1">[\r\n\s]+<button type="button" onclick="quickAssignRoleForStaff\('\$\{staff\.id\}'\)"[\r\n\s\S]+?<span class="material-symbols-outlined text-\[16px\]">delete<\/span>[\r\n\s]+<\/button>[\r\n\s]+<\/div>[\r\n\s]+<\/td>/;

const replStaffActions = `<!-- Actions -->
        <td class="py-3 px-4 text-right">
          <div class="flex items-center justify-end gap-1">
            \${canUserPerformAction('staff', 'edit') ? \`
            <button type="button" onclick="quickAssignRoleForStaff('\${staff.id}')"
              class="p-1 hover:bg-purple-100 text-purple-700 rounded transition cursor-pointer" title="Reassign Role & Permissions">
              <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            </button>
            <button type="button" onclick="handleEditStaffPrompt('\${staff.id}')"
              class="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-900 rounded transition cursor-pointer" title="Edit Staff Details">
              <span class="material-symbols-outlined text-[16px]">edit</span>
            </button>\` : ''}
            \${canUserPerformAction('staff', 'delete') ? \`
            <button type="button" onclick="handleDeleteStaff('\${staff.id}')"
              class="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer" title="Remove Staff Member">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>\` : ''}
          </div>
        </td>`;

code = code.replace(targetStaffActionsRegex, replStaffActions);
console.log('5. Updated renderStaffTable action buttons');

// Step 6: Update Move to Order button in renderBotAutomationAndChosenProductsCard
const targetSingleMoveBtnRegex = /<button type="button" onclick="openOrderFromSingleChosenProduct\('\$\{customer\.id\}', '\$\{item\.id\}'\)" class="px-2\.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-\[10px\] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95" title="Move this product to Order">[\r\n\s]+<span class="material-symbols-outlined text-\[12px\]">shopping_cart_checkout<\/span>[\r\n\s]+<span>Move to Order<\/span>[\r\n\s]+<\/button>/;

const replSingleMoveBtn = `\${canUserPerformAction('orders', 'create') ? \`
                      <button type="button" onclick="openOrderFromSingleChosenProduct('\${customer.id}', '\${item.id}')" class="btn-move-to-order px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95" title="Move this product to Order">
                        <span class="material-symbols-outlined text-[12px]">shopping_cart_checkout</span>
                        <span>Move to Order</span>
                      </button>\` : ''}`;

code = code.replace(targetSingleMoveBtnRegex, replSingleMoveBtn);

// Step 7: Update bulk move bar visibility
const targetBulkBarRegex = /<!-- Bulk Move to Orders Bar -->[\r\n\s]+<div id="chosen-products-bulk-bar" class="hidden p-2\.5 bg-gradient-to-r from-emerald-800 to-teal-900/;
const replBulkBar = `<!-- Bulk Move to Orders Bar -->
      <div id="chosen-products-bulk-bar" class="\${canUserPerformAction('orders', 'create') ? 'hidden' : '!hidden'} p-2.5 bg-gradient-to-r from-emerald-800 to-teal-900`;

code = code.replace(targetBulkBarRegex, replBulkBar);
console.log('6. Updated Move to Order buttons in chosen products');

// Step 7.1: Update renderOrdersHistoryTable edit controls
const targetOrdStaffReassignRegex = /<!-- Inline Quick Staff Reassignment Dropdown -->[\r\n\s]+<div class="mt-1\.5 flex items-center gap-1\.5">[\r\n\s]+<span class="text-\[9px\] text-slate-400 font-extrabold uppercase">Credit:<\/span>[\r\n\s]+<select onchange="reassignOrderStaff\('\$\{ord\.id\}', this\.value\)"[\r\n\s\S]+?<\/select>[\r\n\s]+<\/div>/;

const replOrdStaffReassign = `\${canUserPerformAction('orders', 'edit') ? \`
          <!-- Inline Quick Staff Reassignment Dropdown -->
          <div class="mt-1.5 flex items-center gap-1.5">
            <span class="text-[9px] text-slate-400 font-extrabold uppercase">Credit:</span>
            <select onchange="reassignOrderStaff('\${ord.id}', this.value)" class="text-[10px] font-bold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 border border-indigo-200/90 rounded-md px-1.5 py-0.5 outline-none cursor-pointer" title="Reassign order credit to another staff specialist">
              \${(() => {
                const sList = [...(CRM_STATE?.staffList || [])];
                if (!sList.some(s => s.id === 'admin')) sList.push({ id: 'admin', name: 'Super Admin' });
                const curId = ord.staffId || ord.staff_id || (staffDisplayName.includes('Admin') ? 'admin' : '');
                return sList.map(s => \`<option value="\${s.id}" \${s.id === curId || s.name === staffDisplayName ? 'selected' : ''}>\${s.name}</option>\`).join('');
              })()}
            </select>
          </div>\` : ''}`;

code = code.replace(targetOrdStaffReassignRegex, replOrdStaffReassign);

const targetOrdStatusSelectRegex = /<!-- Quick Status Transition Selector -->[\r\n\s]+<div>[\r\n\s]+<select onchange="updateOrderStatus\('\$\{ord\.id\}', this\.value\)"[\r\n\s\S]+?<\/select>[\r\n\s]+<\/div>/;

const replOrdStatusSelect = `\${canUserPerformAction('orders', 'edit') ? \`
            <!-- Quick Status Transition Selector -->
            <div>
              <select onchange="updateOrderStatus('\${ord.id}', this.value)" class="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded px-1.5 py-0.5 outline-none cursor-pointer">
                <option value="PLACED" \${normStatus === 'PLACED' ? 'selected' : ''}>1. Placed</option>
                <option value="PACKED" \${normStatus === 'PACKED' ? 'selected' : ''}>2. Packed</option>
                <option value="SHIPPED" \${normStatus === 'SHIPPED' ? 'selected' : ''}>3. Shipped</option>
                <option value="DELIVERED" \${normStatus === 'DELIVERED' ? 'selected' : ''}>4. Delivered</option>
              </select>
            </div>\` : ''}`;

code = code.replace(targetOrdStatusSelectRegex, replOrdStatusSelect);
console.log('6.1 Updated Orders table status and staff credit dropdowns');

// Step 8: In initCRMState, ensure rolePermissions is saved from API and loaded from localStorage
const targetInitStateFetchRegex = /if \(res && res\.status === 'success' && res\.data\) \{/;
const replInitStateFetch = `if (res && res.status === 'success' && res.data) {
        if (res.rolePermissions || res.data.rolePermissions) {
          const incoming = res.rolePermissions || res.data.rolePermissions;
          CRM_STATE.rolePermissions = Object.assign({}, DEFAULT_ROLE_PERMISSIONS, incoming);
          try { localStorage.setItem('CRM_ROLE_PERMISSIONS', JSON.stringify(CRM_STATE.rolePermissions)); } catch(e) {}
        }`;

code = code.replace(targetInitStateFetchRegex, replInitStateFetch);
console.log('7. Updated initCRMState rolePermissions sync');

// Step 9: Add action guards to staff handlers
code = code.replace(/function handleCreateNewStaff\(event\) \{[\r\n\s]+event\.preventDefault\(\);/, `function handleCreateNewStaff(event) {
  event.preventDefault();
  if (!canUserPerformAction('staff', 'create')) {
    showToast('Permission Denied', 'Your assigned role does not have permission to create staff.', 'lock', 'rose');
    return;
  }`);

code = code.replace(/function handleDeleteStaff\(staffId\) \{/, `function handleDeleteStaff(staffId) {
  if (!canUserPerformAction('staff', 'delete')) {
    showToast('Permission Denied', 'Your assigned role does not have permission to delete staff.', 'lock', 'rose');
    return;
  }`);

code = code.replace(/window\.handleSaveRolePermissions = function\(\) \{/, `window.handleSaveRolePermissions = function() {
  if (!canUserPerformAction('staff', 'edit')) {
    showToast('Permission Denied', 'Your assigned role does not have permission to edit roles & permissions.', 'lock', 'rose');
    return;
  }`);
console.log('8. Added action guards to staff handlers');

// Step 10: Insert RBAC Top Block right before "// Global App State (Safely Initialized Immediately)"
const topRbacCode = `
// =========================================================================
// ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION DEFINITIONS
// =========================================================================
const CRM_MODULE_DEFINITIONS = [
  { key: 'inbox', name: 'WhatsApp Inbox & Live Chat', desc: 'Realtime chats, inbound stream, templates & photo sending', icon: 'chat' },
  { key: 'enquiries', name: 'Customer Enquiries & Leads Hub', desc: 'Lead triage, allocation & customer conversation status', icon: 'support_agent' },
  { key: 'followups', name: 'Customer Follow-up Scheduler', desc: 'Callback calendar, payment promises & reminders', icon: 'schedule' },
  { key: 'catalog', name: 'Live Stock & Garment Catalog', desc: 'Inventory stock, pricing, image library & 1-click sharing', icon: 'inventory_2' },
  { key: 'orders', name: 'WhatsApp Sales Orders', desc: 'Order booking, stock reservations & COD / UPI billing', icon: 'shopping_bag' },
  { key: 'customers', name: 'Customer 360 & Profiles Directory', desc: 'Customer history, WhatsApp accounts, and tag directory', icon: 'groups' },
  { key: 'dnd', name: 'DND & Opt-Out Customer Hub', desc: 'Blacklist, opt-out compliance & marketing revocation', icon: 'block' },
  { key: 'staff', name: 'Staff & Team Management', desc: 'Team member directory, staff onboarding & role assignment', icon: 'badge' },
  { key: 'analytics', name: 'Staff Performance Analytics & KPIs', desc: 'Team conversions, response latency & volume reports', icon: 'monitoring' },
  { key: 'audit', name: 'System Audit Trail & Security Logs', desc: 'Tamper-proof event logs, security & staff actions', icon: 'history' },
  { key: 'settings', name: 'WhatsApp Business Settings', desc: 'Business phone slots, Webhook routing & Softphone config', icon: 'settings' },
  { key: 'backup', name: 'Data Backup & Recovery Hub', desc: 'Full MySQL database snapshot export and zero-loss restore', icon: 'backup' }
];
window.CRM_MODULE_DEFINITIONS = CRM_MODULE_DEFINITIONS;

const DEFAULT_ROLE_PERMISSIONS = {
  'Super Admin': {
    inbox: { view: true, create: true, edit: true, delete: true },
    enquiries: { view: true, create: true, edit: true, delete: true },
    followups: { view: true, create: true, edit: true, delete: true },
    catalog: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    dnd: { view: true, create: true, edit: true, delete: true },
    staff: { view: true, create: true, edit: true, delete: true },
    analytics: { view: true, create: true, edit: true, delete: true },
    audit: { view: true, create: true, edit: true, delete: true },
    settings: { view: true, create: true, edit: true, delete: true },
    backup: { view: true, create: true, edit: true, delete: true }
  },
  'Admin Manager': {
    inbox: { view: true, create: true, edit: true, delete: true },
    enquiries: { view: true, create: true, edit: true, delete: true },
    followups: { view: true, create: true, edit: true, delete: true },
    catalog: { view: true, create: true, edit: true, delete: true },
    orders: { view: true, create: true, edit: true, delete: true },
    customers: { view: true, create: true, edit: true, delete: true },
    dnd: { view: true, create: true, edit: true, delete: true },
    staff: { view: true, create: true, edit: true, delete: false },
    analytics: { view: true, create: true, edit: true, delete: false },
    audit: { view: true, create: false, edit: false, delete: false },
    settings: { view: true, create: true, edit: true, delete: false },
    backup: { view: true, create: true, edit: false, delete: false }
  },
  'Sales Specialist (Baby Collection)': {
    inbox: { view: true, create: true, edit: true, delete: false },
    enquiries: { view: true, create: true, edit: true, delete: false },
    followups: { view: true, create: true, edit: true, delete: false },
    catalog: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    dnd: { view: true, create: true, edit: false, delete: false },
    staff: { view: false, create: false, edit: false, delete: false },
    analytics: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    backup: { view: false, create: false, edit: false, delete: false }
  },
  'Enquiry Specialist (Maternity & Kids)': {
    inbox: { view: true, create: true, edit: true, delete: false },
    enquiries: { view: true, create: true, edit: true, delete: false },
    followups: { view: true, create: true, edit: true, delete: false },
    catalog: { view: true, create: false, edit: false, delete: false },
    orders: { view: false, create: false, edit: false, delete: false },
    customers: { view: true, create: true, edit: true, delete: false },
    dnd: { view: true, create: true, edit: false, delete: false },
    staff: { view: false, create: false, edit: false, delete: false },
    analytics: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    backup: { view: false, create: false, edit: false, delete: false }
  },
  'Order Fulfillment & Support': {
    inbox: { view: true, create: true, edit: false, delete: false },
    enquiries: { view: false, create: false, edit: false, delete: false },
    followups: { view: true, create: false, edit: false, delete: false },
    catalog: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: true, edit: true, delete: false },
    customers: { view: true, create: false, edit: false, delete: false },
    dnd: { view: false, create: false, edit: false, delete: false },
    staff: { view: false, create: false, edit: false, delete: false },
    analytics: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    backup: { view: false, create: false, edit: false, delete: false }
  },
  'Customer Care Representative': {
    inbox: { view: true, create: true, edit: false, delete: false },
    enquiries: { view: true, create: false, edit: true, delete: false },
    followups: { view: true, create: true, edit: false, delete: false },
    catalog: { view: true, create: false, edit: false, delete: false },
    orders: { view: true, create: false, edit: false, delete: false },
    customers: { view: true, create: true, edit: false, delete: false },
    dnd: { view: true, create: true, edit: false, delete: false },
    staff: { view: false, create: false, edit: false, delete: false },
    analytics: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
    settings: { view: false, create: false, edit: false, delete: false },
    backup: { view: false, create: false, edit: false, delete: false }
  }
};
window.DEFAULT_ROLE_PERMISSIONS = DEFAULT_ROLE_PERMISSIONS;

function initRolePermissionsState() {
  if (typeof CRM_STATE === 'undefined' || !CRM_STATE) return;
  if (!CRM_STATE.rolePermissions) {
    try {
      const stored = localStorage.getItem('CRM_ROLE_PERMISSIONS');
      if (stored) {
        CRM_STATE.rolePermissions = Object.assign({}, DEFAULT_ROLE_PERMISSIONS, JSON.parse(stored));
      } else {
        CRM_STATE.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
      }
    } catch(e) {
      CRM_STATE.rolePermissions = JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS));
    }
  }
}
window.initRolePermissionsState = initRolePermissionsState;

function getUserAssignedRoleName(user) {
  if (!user) user = (typeof CURRENT_USER !== 'undefined' ? CURRENT_USER : null);
  if (!user) return 'Super Admin';

  if (user.role === 'admin' || user.id === 'admin' || user.role === 'Super Admin' || (user.title && user.title.includes('Admin Manager'))) {
    return 'Super Admin';
  }

  initRolePermissionsState();

  if (user.role && CRM_STATE?.rolePermissions && CRM_STATE.rolePermissions[user.role]) {
    return user.role;
  }
  if (user.title && CRM_STATE?.rolePermissions && CRM_STATE.rolePermissions[user.title]) {
    return user.title;
  }
  if (user.role_name && CRM_STATE?.rolePermissions && CRM_STATE.rolePermissions[user.role_name]) {
    return user.role_name;
  }
  const staffId = user.staff_id || user.staffId || user.id || user.role;
  const staffObj = (CRM_STATE?.staffList || []).find(s => s.id === staffId || s.username === user.username);
  if (staffObj && staffObj.role && CRM_STATE?.rolePermissions && CRM_STATE.rolePermissions[staffObj.role]) {
    return staffObj.role;
  }
  if (staffObj && staffObj.role) {
    return staffObj.role;
  }

  return user.title || user.role || 'Sales Specialist (Baby Collection)';
}
window.getUserAssignedRoleName = getUserAssignedRoleName;

function canUserPerformAction(moduleName, action) {
  const user = (typeof CURRENT_USER !== 'undefined' && CURRENT_USER) ? CURRENT_USER : (typeof CRM_AUTH_SESSION !== 'undefined' ? CRM_AUTH_SESSION : null);
  if (!user) return true;

  if (user.role === 'admin' || user.id === 'admin' || user.role === 'Super Admin' || (user.title && user.title.includes('Admin Manager (Full Control)'))) {
    return true;
  }

  initRolePermissionsState();
  const roleName = getUserAssignedRoleName(user);

  if (roleName === 'Admin Manager' || roleName === 'admin') {
    const adminPerms = (CRM_STATE?.rolePermissions && CRM_STATE.rolePermissions['Admin Manager']) || DEFAULT_ROLE_PERMISSIONS['Admin Manager'];
    if (adminPerms && adminPerms[moduleName] && adminPerms[moduleName][action] !== undefined) {
      return Boolean(adminPerms[moduleName][action]);
    }
    return true;
  }

  const rolePerms = (CRM_STATE?.rolePermissions && CRM_STATE.rolePermissions[roleName]) || DEFAULT_ROLE_PERMISSIONS[roleName];
  if (!rolePerms || !rolePerms[moduleName]) {
    const sensitive = ['settings', 'backup', 'staff', 'audit', 'analytics'];
    if (action === 'view') {
      return !sensitive.includes(moduleName);
    }
    return false;
  }

  return Boolean(rolePerms[moduleName][action]);
}
window.canUserPerformAction = canUserPerformAction;

function enforceGranularActionPermissions() {
  const user = (typeof CURRENT_USER !== 'undefined' && CURRENT_USER) ? CURRENT_USER : null;
  const isSuperAdmin = !user || user.role === 'admin' || user.id === 'admin' || user.role === 'Super Admin';

  // 1. Staff Module Actions
  const canStaffView = isSuperAdmin || canUserPerformAction('staff', 'view');
  const canStaffCreate = isSuperAdmin || canUserPerformAction('staff', 'create');
  const canStaffEdit = isSuperAdmin || canUserPerformAction('staff', 'edit');
  const canStaffDelete = isSuperAdmin || canUserPerformAction('staff', 'delete');

  const navSubStaffCreate = document.getElementById('nav-sub-staff-create');
  if (navSubStaffCreate) navSubStaffCreate.style.display = canStaffCreate ? '' : 'none';
  const navSubStaffRoles = document.getElementById('nav-sub-staff-roles');
  if (navSubStaffRoles) navSubStaffRoles.style.display = canStaffEdit ? '' : 'none';

  const tabBtnStaffCreate = document.getElementById('tab-btn-staff-create');
  if (tabBtnStaffCreate) tabBtnStaffCreate.style.display = canStaffCreate ? '' : 'none';
  const tabBtnStaffRoles = document.getElementById('tab-btn-staff-roles');
  if (tabBtnStaffRoles) tabBtnStaffRoles.style.display = canStaffEdit ? '' : 'none';

  const btnAddStaffTable = document.getElementById('btn-add-staff-table');
  if (btnAddStaffTable) btnAddStaffTable.style.display = canStaffCreate ? '' : 'none';

  if (typeof ACTIVE_STAFF_TAB !== 'undefined') {
    if (ACTIVE_STAFF_TAB === 'create' && !canStaffCreate) {
      if (typeof switchStaffTab === 'function') switchStaffTab('list');
    }
    if (ACTIVE_STAFF_TAB === 'roles' && !canStaffEdit) {
      if (typeof switchStaffTab === 'function') switchStaffTab('list');
    }
  }

  // 2. Orders Module Actions
  const canOrderCreate = isSuperAdmin || canUserPerformAction('orders', 'create');
  document.querySelectorAll('.btn-move-to-order, [data-action="move-to-order"]').forEach(el => {
    el.style.display = canOrderCreate ? '' : 'none';
  });
  const chosenProductsBulkBar = document.getElementById('chosen-products-bulk-bar');
  if (chosenProductsBulkBar && !canOrderCreate) chosenProductsBulkBar.style.display = 'none';

  // 3. Backup Hub Actions
  const canBackupCreate = isSuperAdmin || canUserPerformAction('backup', 'create');
  const canBackupEdit = isSuperAdmin || canUserPerformAction('backup', 'edit');
  const canBackupDelete = isSuperAdmin || canUserPerformAction('backup', 'delete');

  const cardExport = document.getElementById('card-backup-export');
  if (cardExport) cardExport.style.display = canBackupCreate ? '' : 'none';
  const cardRestore = document.getElementById('card-backup-restore');
  if (cardRestore) cardRestore.style.display = canBackupEdit ? '' : 'none';
  const cardReset = document.getElementById('card-backup-reset');
  if (cardReset) cardReset.style.display = canBackupDelete ? '' : 'none';

  // 4. Catalog Actions
  const canCatCreate = isSuperAdmin || canUserPerformAction('catalog', 'create');
  const canCatDelete = isSuperAdmin || canUserPerformAction('catalog', 'delete');
  document.querySelectorAll('#btn-add-product, #btn-open-add-product-modal, [onclick*="openAddProductModal"], [onclick*="openCategoryModal"]').forEach(el => {
    el.style.display = canCatCreate ? '' : 'none';
  });
  document.querySelectorAll('[onclick*="deleteProduct"]').forEach(el => {
    el.style.display = canCatDelete ? '' : 'none';
  });

  // 5. Customers Actions
  const canCustCreate = isSuperAdmin || canUserPerformAction('customers', 'create');
  const canCustDelete = isSuperAdmin || canUserPerformAction('customers', 'delete');
  document.querySelectorAll('#btn-add-customer, [onclick*="openNewCustomerModal"]').forEach(el => {
    el.style.display = canCustCreate ? '' : 'none';
  });
  document.querySelectorAll('[onclick*="deleteCustomer"]').forEach(el => {
    el.style.display = canCustDelete ? '' : 'none';
  });

  // 6. Follow-ups Actions
  const canFuCreate = isSuperAdmin || canUserPerformAction('followups', 'create');
  const canFuDelete = isSuperAdmin || canUserPerformAction('followups', 'delete');
  document.querySelectorAll('#btn-schedule-followup, [onclick*="openScheduleFollowup"]').forEach(el => {
    el.style.display = canFuCreate ? '' : 'none';
  });
  document.querySelectorAll('[onclick*="deleteFollowup"]').forEach(el => {
    el.style.display = canFuDelete ? '' : 'none';
  });

  // 7. DND Actions
  const canDndCreate = isSuperAdmin || canUserPerformAction('dnd', 'create');
  const canDndDelete = isSuperAdmin || canUserPerformAction('dnd', 'delete');
  document.querySelectorAll('#btn-add-dnd, [onclick*="openAddToDnd"]').forEach(el => {
    el.style.display = canDndCreate ? '' : 'none';
  });
  document.querySelectorAll('[onclick*="revokeDnd"]').forEach(el => {
    el.style.display = canDndDelete ? '' : 'none';
  });

  // 8. Inbox / Enquiries Edit (Handling Staff Change)
  const canInboxEdit = isSuperAdmin || canUserPerformAction('inbox', 'edit') || canUserPerformAction('enquiries', 'edit');
  document.querySelectorAll('[onclick*="openStaffAssignModal"], [onclick*="quickReassignQueryStaff"]').forEach(el => {
    el.style.display = canInboxEdit ? '' : 'none';
  });
}
window.enforceGranularActionPermissions = enforceGranularActionPermissions;
`;

const insertPos = code.indexOf('// Global App State (Safely Initialized Immediately)');
code = code.substring(0, insertPos) + topRbacCode + '\n' + code.substring(insertPos);
console.log('9. Inserted RBAC Top Block at line ~494');

// Write out to crm_app.js
fs.writeFileSync('d:/crm whatsapp/crm-app/crm_app.js', code, 'utf8');
console.log('Final clean patch successfully written to crm_app.js!');
