const fs = require('fs');

console.log('=== TESTING CREATE STAFF & AUDIT LOG ROBUSTNESS ===');

// Load crm_app.js in a simulated DOM environment
const jsCode = fs.readFileSync('crm_app.js', 'utf8');

// Mock window and document
const mockStorage = {};
const mockElements = {};

function createMockElement(id, val = '') {
  return {
    id,
    value: val,
    innerText: '',
    innerHTML: '',
    className: '',
    classList: { add: () => {}, remove: () => {}, contains: () => false },
    style: {},
    focus: () => {},
    click: () => {}, remove: () => {},
    addEventListener: () => {}
  };
}

global.window = {
  location: { hash: '#staff' },
  addEventListener: () => {},
  localStorage: {
    getItem: k => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = v; },
    removeItem: k => { delete mockStorage[k]; }
  }
};
global.document = {
  getElementById: id => {
    if (!mockElements[id]) mockElements[id] = createMockElement(id);
    return mockElements[id];
  },
  querySelector: () => null,
  querySelectorAll: () => [],
  activeElement: null,
  addEventListener: () => {}
};
global.localStorage = global.window.localStorage;
global.showToast = () => {};
global.fetch = () => Promise.resolve({ json: () => Promise.resolve({ status: 'success' }) });

// Evaluate script in sandbox
try {
  eval(jsCode);
  console.log('[PASS] crm_app.js loaded into sandbox successfully.');
} catch (e) {
  console.error('[FAIL] Evaluation failed:', e);
  process.exit(1);
}

// 1. Test logAudit when CRM_STATE.auditLogs is undefined
delete window.CRM_STATE.auditLogs;
console.log('1. Testing logAudit when auditLogs is undefined:');
try {
  window.logAudit('TEST_ACTION', 'TEST_MODULE', 'Testing without auditLogs');
  if (Array.isArray(window.CRM_STATE.auditLogs) && window.CRM_STATE.auditLogs.length === 1) {
    console.log('   [PASS] logAudit safely created array and logged without throwing!');
  } else {
    console.error('   [FAIL] auditLogs not properly initialized by logAudit');
    process.exit(1);
  }
} catch (e) {
  console.error('   [FAIL] logAudit threw error:', e);
  process.exit(1);
}

// 2. Test handleCreateNewStaff execution
console.log('2. Testing handleCreateNewStaff form submission:');
document.getElementById('staff-new-name').value = 'Karthik Raja';
document.getElementById('staff-new-email').value = 'karthik@grmgarments.com';
document.getElementById('staff-new-phone').value = '+91 95009 05638';
document.getElementById('staff-new-role').value = 'Super Admin';
document.getElementById('staff-new-specialization').value = 'Baby Collection';
document.getElementById('staff-new-status').value = 'ACTIVE';
document.getElementById('staff-new-password').value = 'karthik123';

const prevStaffCount = (window.CRM_STATE.staffList || []).length;
const mockEvent = {
  preventDefault: () => {},
  target: { reset: () => {} }
};

try {
  window.handleCreateNewStaff(mockEvent);
  const newStaffCount = (window.CRM_STATE.staffList || []).length;
  if (newStaffCount === prevStaffCount + 1) {
    const created = window.CRM_STATE.staffList[window.CRM_STATE.staffList.length - 1];
    console.log(`   [PASS] Staff successfully created! ID: ${created.id}, Name: ${created.name}, Role: ${created.role}`);
  } else {
    console.error('   [FAIL] Staff list count did not increase!');
    process.exit(1);
  }
} catch (e) {
  console.error('   [FAIL] handleCreateNewStaff threw error:', e);
  process.exit(1);
}

console.log('==================================================');
console.log('ALL CREATE STAFF TESTS PASSED SUCCESSFULLY WITH ZERO ERRORS!');
console.log('==================================================');
