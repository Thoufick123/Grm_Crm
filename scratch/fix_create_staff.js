const fs = require('fs');

// 1. Fix crm_app.js
let code = fs.readFileSync('crm_app.js', 'utf8');

// A. INITIAL_CRM_DATA: add auditLogs: []
const initTarget = `  conversations: {},
  orders: [],
  followups: [],`;

const initReplacement = `  conversations: {},
  orders: [],
  followups: [],
  auditLogs: [],`;

if (code.includes(initTarget)) {
  code = code.replace(initTarget, initReplacement);
  console.log('Added auditLogs to INITIAL_CRM_DATA');
}

// B. loadLiveDatabaseState: audit logs assignment
const loadTarget = `      // 12. Audit Logs
      if (data.auditLogs && Array.isArray(data.auditLogs) && data.auditLogs.length > 0) {
        CRM_STATE.auditLogs = data.auditLogs;
      }`;

const loadReplacement = `      // 12. Audit Logs
      CRM_STATE.auditLogs = (data.auditLogs && Array.isArray(data.auditLogs)) ? data.auditLogs : (CRM_STATE.auditLogs || []);`;

if (code.includes(loadTarget)) {
  code = code.replace(loadTarget, loadReplacement);
  console.log('Fixed loadLiveDatabaseState auditLogs loading');
}

// C. logAudit function
const logTarget = `function logAudit(action, module, details) {
  const user = ACTIVE_ROLE === 'admin' ? 'Super Admin' : (CRM_STATE.staffList.find(s => s.id === ACTIVE_ROLE)?.name || 'Staff');
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  CRM_STATE.auditLogs.unshift({ timestamp, user, action, module, details });

  // Asynchronously persist audit log to MySQL Database
  fetch('api.php?action=save_audit_log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, action, module, details, timestamp })
  }).catch(() => {});
}`;

const logReplacement = `function logAudit(action, module, details) {
  try {
    const user = (typeof ACTIVE_ROLE !== 'undefined' && ACTIVE_ROLE === 'admin') 
      ? 'Super Admin' 
      : (((typeof CRM_STATE !== 'undefined' && CRM_STATE && Array.isArray(CRM_STATE.staffList)) ? CRM_STATE.staffList : []).find(s => s && s.id === (typeof ACTIVE_ROLE !== 'undefined' ? ACTIVE_ROLE : ''))?.name || 'Staff');
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (typeof CRM_STATE !== 'undefined' && CRM_STATE) {
      if (!Array.isArray(CRM_STATE.auditLogs)) {
        CRM_STATE.auditLogs = [];
      }
      CRM_STATE.auditLogs.unshift({ timestamp, user, action, module, details });
    }

    // Asynchronously persist audit log to MySQL Database
    fetch('api.php?action=save_audit_log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user, action, module, details, timestamp })
    }).catch(() => {});
  } catch (err) {
    console.warn('[logAudit] Non-fatal logging error:', err);
  }
}`;

if (code.includes(logTarget)) {
  code = code.replace(logTarget, logReplacement);
  console.log('Fixed logAudit with safety guards and array initialization');
}

// D. renderAuditTable: guard array
const tableTarget = `function renderAuditTable() {
  const tbody = document.getElementById('audit-logs-table-body');
  if (!tbody) return;

  tbody.innerHTML = CRM_STATE.auditLogs.map(log => \``;

const tableReplacement = `function renderAuditTable() {
  const tbody = document.getElementById('audit-logs-table-body');
  if (!tbody) return;

  tbody.innerHTML = (CRM_STATE.auditLogs || []).map(log => \``;

if (code.includes(tableTarget)) {
  code = code.replace(tableTarget, tableReplacement);
  console.log('Fixed renderAuditTable guard');
}

// E. handleCreateNewStaff: robust onboarding logic
const staffOldRegex = /function handleCreateNewStaff\(event\) \{[\s\S]+?showToast\('Staff Member Onboarded!'[\s\S]+?\}\r?\n/;

const staffNewCode = `function handleCreateNewStaff(event) {
  event.preventDefault();
  if (!canUserPerformAction('staff', 'create')) {
    showToast('Permission Denied', 'Your assigned role does not have permission to create staff.', 'lock', 'rose');
    return;
  }
  const nameEl = document.getElementById('staff-new-name');
  const emailEl = document.getElementById('staff-new-email');
  const phoneEl = document.getElementById('staff-new-phone');
  const roleEl = document.getElementById('staff-new-role');
  const specEl = document.getElementById('staff-new-specialization');
  const statusEl = document.getElementById('staff-new-status');
  const passwordInput = document.getElementById('staff-new-password');

  const name = nameEl ? nameEl.value.trim() : '';
  const email = emailEl ? emailEl.value.trim() : '';
  const phone = phoneEl ? phoneEl.value.trim() : '';
  const role = roleEl ? roleEl.value : 'Sales Specialist';
  const specialization = specEl ? specEl.value : 'General';
  const status = statusEl ? statusEl.value : 'ACTIVE';
  const password = passwordInput && passwordInput.value.trim() ? passwordInput.value.trim() : 'staff123';

  if (!name || !phone) {
    showToast('Missing Fields', 'Please enter staff name and phone number.', 'warning', 'amber');
    return;
  }

  if (!password) {
    showToast('Password Required', 'Please enter a login password for the staff member.', 'warning', 'amber');
    return;
  }

  if (!Array.isArray(CRM_STATE.staffList)) {
    CRM_STATE.staffList = [];
  }

  // Collect all staff IDs ever used across staffList, orders, queries, and reserved IDs
  const usedIds = new Set(['staff_01', 'staff_02', 'staff_03']);
  (CRM_STATE.staffList || []).forEach(s => { if (s && s.id) usedIds.add(s.id); });
  (CRM_STATE.orders || []).forEach(o => { if (o && o.staffId) usedIds.add(o.staffId); });
  (CRM_STATE.queries || []).forEach(q => {
    if (q && q.assignedTo && q.assignedTo !== 'UNASSIGNED') usedIds.add(q.assignedTo);
    if (q && q.staffId && q.staffId !== 'UNASSIGNED') usedIds.add(q.staffId);
  });

  let nextNum = 1;
  let newStaffId = \`staff_\${String(nextNum).padStart(2, '0')}\`;
  while (usedIds.has(newStaffId)) {
    nextNum++;
    newStaffId = \`staff_\${String(nextNum).padStart(2, '0')}\`;
  }
  const avatarInitials = name.split(' ').map(n => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'ST';

  const newStaff = {
    id: newStaffId,
    name: name,
    email: email || \`\${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@grmgarments.com\`,
    phone: phone,
    role: role,
    specialization: specialization,
    password: password,
    avatar: avatarInitials,
    dailyQuota: 70,
    todayHandled: 0,
    status: status || 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  CRM_STATE.staffList.push(newStaff);
  saveCRMState();

  // Persist to MySQL database via api.php
  fetch('api.php?action=create_staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: newStaffId,
      username: newStaffId,
      name: name,
      email: newStaff.email,
      phone: phone,
      password: password,
      role: role,
      specialization: specialization,
      avatar: avatarInitials,
      status: status
    })
  }).then(r => r.json()).then(res => {
    console.log('[create_staff] Server response:', res);
  }).catch(err => {
    console.warn('[create_staff] Background server sync error:', err);
  });

  logAudit('STAFF_ONBOARDED', 'STAFF_MODULE', \`Super Admin onboarded new staff member: \${name} (\${newStaffId}, Role: \${role})\`);

  if (event.target && typeof event.target.reset === 'function') {
    event.target.reset();
  }

  // Update counters and dropdowns
  const staffCountBadge = document.getElementById('badge-total-staff-count');
  if (staffCountBadge) staffCountBadge.innerText = CRM_STATE.staffList.length;
  const navSubCount = document.getElementById('nav-sub-staff-count');
  if (navSubCount) navSubCount.innerText = CRM_STATE.staffList.length;

  populateAllStaffDropdowns();
  updateStaffRoleSelectDropdowns();
  renderStaffTable();

  switchStaffSubmodule('list');
  if (typeof playChime === 'function') playChime('order');
  showToast('Staff Member Onboarded!', \`\${name} successfully added to team roster (\${newStaffId}).\`, 'person_add', 'emerald');
}
`;

if (staffOldRegex.test(code)) {
  code = code.replace(staffOldRegex, staffNewCode);
  console.log('Replaced handleCreateNewStaff successfully');
} else {
  console.log('Failed to match handleCreateNewStaff');
}

fs.writeFileSync('crm_app.js', code, 'utf8');
fs.copyFileSync('crm_app.js', 'assets/js/crm_app.js');
console.log('Synchronized to assets/js/crm_app.js');

// 2. Fix api.php create_staff
let api = fs.readFileSync('api.php', 'utf8');
const apiTarget = `        $staffId = $staff['id'] ?? ('staff_' . str_pad(rand(1, 99), 2, '0', STR_PAD_LEFT));
        $username = $staff['username'] ?? strtolower(explode(' ', $staff['name'])[0]);
        $password = $staff['password'] ?? 'staff123';
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $avatar = $staff['avatar'] ?? strtoupper(substr($staff['name'], 0, 2));

        $stmt = $pdo->prepare("
            INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`name\`, \`role\`, \`email\`, \`phone\`, \`specialization\`, \`avatar\`, \`status\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`password\`=VALUES(\`password\`), \`role\`=VALUES(\`role\`), \`phone\`=VALUES(\`phone\`), \`status\`=VALUES(\`status\`)
        ");`;

const apiReplacement = `        $staffId = $staff['id'] ?? ('staff_' . str_pad(rand(1, 99), 2, '0', STR_PAD_LEFT));
        $username = !empty($staff['username']) ? $staff['username'] : (!empty($staff['id']) ? $staff['id'] : strtolower(explode(' ', $staff['name'])[0]));
        $password = $staff['password'] ?? 'staff123';
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $avatar = $staff['avatar'] ?? strtoupper(substr($staff['name'], 0, 2));

        $stmt = $pdo->prepare("
            INSERT INTO \`users\` (\`id\`, \`username\`, \`password\`, \`name\`, \`role\`, \`email\`, \`phone\`, \`specialization\`, \`avatar\`, \`status\`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE \`name\`=VALUES(\`name\`), \`password\`=VALUES(\`password\`), \`role\`=VALUES(\`role\`), \`phone\`=VALUES(\`phone\`), \`status\`=VALUES(\`status\`), \`email\`=VALUES(\`email\`), \`specialization\`=VALUES(\`specialization\`), \`avatar\`=VALUES(\`avatar\`)
        ");`;

const norm = s => s.replace(/\r\n/g, '\n');
let nApi = norm(api);
if (nApi.includes(norm(apiTarget))) {
  nApi = nApi.replace(norm(apiTarget), norm(apiReplacement));
  fs.writeFileSync('api.php', nApi, 'utf8');
  console.log('Fixed api.php create_staff endpoint');
} else {
  console.log('Failed to match apiTarget in api.php');
}
