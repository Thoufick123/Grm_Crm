const fs = require('fs');

console.log('================================================================');
console.log('GRM CRM — GRANULAR RBAC SYSTEM VERIFICATION TEST SUITE');
console.log('================================================================');

// 1. Read files
const crmAppCode = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');
const assetsAppCode = fs.readFileSync('d:/crm whatsapp/crm-app/assets/js/crm_app.js', 'utf8');
const indexHtml = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');
const indexPhp = fs.readFileSync('d:/crm whatsapp/crm-app/index.php', 'utf8');
const apiPhp = fs.readFileSync('d:/crm whatsapp/crm-app/api.php', 'utf8');

// Check synchronization
console.log('1. Checking file sync between crm_app.js and assets/js/crm_app.js:');
if (crmAppCode === assetsAppCode) {
  console.log('   [PASS] 100% Identical byte-for-byte synchronization.');
} else {
  console.error('   [FAIL] Files differ!');
  process.exit(1);
}

// Check index.html and index.php sidebar navigation structure
console.log('2. Checking navigation sync between index.html and index.php:');
const htmlNavMatch = indexHtml.match(/<nav class="flex-1 overflow-y-auto custom-chat-scroll[\s\S]+?<\/nav>/);
const phpNavMatch = indexPhp.match(/<nav class="flex-1 overflow-y-auto custom-chat-scroll[\s\S]+?<\/nav>/);

if (indexPhp.includes("file_get_contents(__DIR__ . '/index.html')") || (htmlNavMatch && phpNavMatch && htmlNavMatch[0].trim() === phpNavMatch[0].trim())) {
  console.log('   [PASS] Sidebar <nav> markup in index.php is powered directly by index.html.');
} else {
  console.error('   [FAIL] Sidebar markup in index.php and index.html mismatch!');
  process.exit(1);
}

// Check for absence of legacy admin-only-nav blocking wrapper in index.php
console.log('3. Checking removal of hardcoded PHP admin-only wrapper in index.php:');
if (!indexPhp.includes('<div class="admin-only-nav <?php echo $isAdmin ? \'\' : \'hidden\'; ?>">')) {
  console.log('   [PASS] Hardcoded PHP admin-only wrapper removed.');
} else {
  console.error('   [FAIL] Legacy PHP hidden wrapper still present!');
  process.exit(1);
}

// Check navigation IDs in HTML
console.log('4. Checking critical navigation section IDs:');
const requiredIds = [
  'nav-section-command-center',
  'nav-section-sales-operations',
  'nav-section-settings-admin',
  'nav-sub-staff-list',
  'nav-sub-staff-create',
  'nav-sub-staff-roles',
  'btn-add-staff-table',
  'card-backup-export',
  'card-backup-restore',
  'card-backup-reset',
  'btn-backup-reset'
];

requiredIds.forEach(id => {
  if (indexHtml.includes(`id="${id}"`)) {
    console.log(`   [PASS] ID "${id}" present in index.html.`);
  } else {
    console.error(`   [FAIL] Missing ID "${id}" in index.html!`);
    process.exit(1);
  }
});

// Check api.php rolePermissions support
console.log('5. Checking api.php rolePermissions extraction in get_state:');
if (apiPhp.includes("else if ($type === 'role_permissions')") && apiPhp.includes('"rolePermissions" => $rolePermissions')) {
  console.log('   [PASS] api.php loads and returns rolePermissions from MySQL attributes table.');
} else {
  console.error('   [FAIL] api.php does not return rolePermissions!');
  process.exit(1);
}

// 6. Test RBAC logic directly in Node environment
console.log('6. Testing Granular Action RBAC Logic execution:');

// Create mock DOM & environment
const mockElements = new Map();
function createMockEl(id) {
  const el = {
    id,
    classList: {
      _classes: new Set(),
      add: function(c) { this._classes.add(c); },
      remove: function(c) { this._classes.delete(c); },
      contains: function(c) { return this._classes.has(c); }
    },
    style: { display: '' }
  };
  mockElements.set(id, el);
  return el;
}

global.document = {
  getElementById: (id) => mockElements.get(id) || createMockEl(id),
  querySelectorAll: (selector) => []
};
global.window = global;
global.localStorage = {
  _store: {},
  getItem: function(k) { return this._store[k] || null; },
  setItem: function(k, v) { this._store[k] = v; }
};
global.sessionStorage = global.localStorage;

// Load module definitions & functions from crm_app.js using eval in this scope
const rbacBlockStart = crmAppCode.indexOf('// ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION DEFINITIONS');
const rbacBlockEnd = crmAppCode.indexOf('// Global App State (Safely Initialized Immediately)');
eval(crmAppCode.substring(rbacBlockStart, rbacBlockEnd));

// Setup CRM_STATE with staff and custom permissions
global.CRM_STATE = {
  rolePermissions: JSON.parse(JSON.stringify(DEFAULT_ROLE_PERMISSIONS)),
  staffList: [
    { id: 'staff_01', name: 'Priya Sharma', role: 'Sales Specialist (Baby Collection)' },
    { id: 'staff_04', name: 'mekha', role: 'Sales Specialist (Baby Collection)' }
  ]
};

// Test Case A: Super Admin Session
console.log('\n   --- Test Scenario A: Super Admin ---');
global.CURRENT_USER = { id: 'admin', username: 'admin', role: 'admin', name: 'Super Admin' };
CRM_MODULE_DEFINITIONS.forEach(m => {
  ['view', 'create', 'edit', 'delete'].forEach(act => {
    if (!canUserPerformAction(m.key, act)) {
      console.error(`   [FAIL] Super Admin denied ${act} on ${m.key}!`);
      process.exit(1);
    }
  });
});
console.log('   [PASS] Super Admin has full unconditional privileges across all 12 modules.');

// Test Case B: mekha with View-Only Access for All Modules
console.log('\n   --- Test Scenario B: mekha with View-Only Assigned for All Modules ---');
global.CURRENT_USER = {
  id: 'staff_04',
  username: 'mekha',
  name: 'mekha',
  role: 'staff_04',
  title: 'Sales Specialist (Baby Collection)',
  staff_id: 'staff_04'
};

// Admin assigned View-Only across ALL 12 modules for 'Sales Specialist (Baby Collection)'
const rolePerms = {};
CRM_MODULE_DEFINITIONS.forEach(m => {
  rolePerms[m.key] = { view: true, create: false, edit: false, delete: false };
});
CRM_STATE.rolePermissions['Sales Specialist (Baby Collection)'] = rolePerms;

CRM_MODULE_DEFINITIONS.forEach(m => {
  if (!canUserPerformAction(m.key, 'view')) {
    console.error(`   [FAIL] mekha should have view access to ${m.key}!`);
    process.exit(1);
  }
  if (canUserPerformAction(m.key, 'create')) {
    console.error(`   [FAIL] mekha should NOT have create access to ${m.key}!`);
    process.exit(1);
  }
  if (canUserPerformAction(m.key, 'edit')) {
    console.error(`   [FAIL] mekha should NOT have edit access to ${m.key}!`);
    process.exit(1);
  }
  if (canUserPerformAction(m.key, 'delete')) {
    console.error(`   [FAIL] mekha should NOT have delete access to ${m.key}!`);
    process.exit(1);
  }
});
console.log('   [PASS] View is TRUE for all 12 modules.');
console.log('   [PASS] Create, Edit, Delete are all FALSE for all 12 modules.');

// Test UI elements toggle in enforceGranularActionPermissions
enforceGranularActionPermissions();
if (mockElements.get('nav-sub-staff-create').style.display !== 'none') {
  console.error('   [FAIL] nav-sub-staff-create should be hidden!');
  process.exit(1);
}
if (mockElements.get('nav-sub-staff-roles').style.display !== 'none') {
  console.error('   [FAIL] nav-sub-staff-roles should be hidden!');
  process.exit(1);
}
if (mockElements.get('btn-add-staff-table').style.display !== 'none') {
  console.error('   [FAIL] btn-add-staff-table should be hidden!');
  process.exit(1);
}
if (mockElements.get('card-backup-export').style.display !== 'none') {
  console.error('   [FAIL] card-backup-export should be hidden!');
  process.exit(1);
}
if (mockElements.get('card-backup-restore').style.display !== 'none') {
  console.error('   [FAIL] card-backup-restore should be hidden!');
  process.exit(1);
}
if (mockElements.get('card-backup-reset').style.display !== 'none') {
  console.error('   [FAIL] card-backup-reset should be hidden!');
  process.exit(1);
}
console.log('   [PASS] UI elements for Create, Edit, Delete correctly hidden in View-Only mode.');

// Test Case C: mekha granted Create for Staff and Orders
console.log('\n   --- Test Scenario C: Admin grants Create for Staff and Orders ---');
rolePerms['staff'].create = true;
rolePerms['orders'].create = true;
enforceGranularActionPermissions();

if (mockElements.get('nav-sub-staff-create').style.display !== '') {
  console.error('   [FAIL] nav-sub-staff-create should be visible!');
  process.exit(1);
}
if (mockElements.get('btn-add-staff-table').style.display !== '') {
  console.error('   [FAIL] btn-add-staff-table should be visible!');
  process.exit(1);
}
if (mockElements.get('nav-sub-staff-roles').style.display !== 'none') {
  console.error('   [FAIL] nav-sub-staff-roles should remain hidden without Edit permission!');
  process.exit(1);
}
console.log('   [PASS] Create buttons shown, Edit/Delete remains hidden.');

// Test Case D: mekha granted Edit for Staff (Role Base) and Backup
console.log('\n   --- Test Scenario D: Admin grants Edit for Staff and Restore Backup ---');
rolePerms['staff'].edit = true;
rolePerms['backup'].edit = true;
enforceGranularActionPermissions();

if (mockElements.get('nav-sub-staff-roles').style.display !== '') {
  console.error('   [FAIL] nav-sub-staff-roles should be visible!');
  process.exit(1);
}
if (mockElements.get('tab-btn-staff-roles').style.display !== '') {
  console.error('   [FAIL] tab-btn-staff-roles should be visible!');
  process.exit(1);
}
if (mockElements.get('card-backup-restore').style.display !== '') {
  console.error('   [FAIL] card-backup-restore should be visible!');
  process.exit(1);
}
console.log('   [PASS] Edit controls (Role Base tab, Restore Backup) shown when Edit permission granted.');

console.log('\n================================================================');
console.log('ALL VERIFICATION CHECKS PASSED WITH ZERO ERRORS!');
console.log('================================================================');

