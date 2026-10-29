const fs = require('fs');
let code = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const firstIdx = code.indexOf('// =========================================================================\n// ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION DEFINITIONS');
console.log('firstIdx:', firstIdx);

const secondIdx = code.indexOf('// =========================================================================\n// ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION DEFINITIONS', firstIdx + 50);
console.log('secondIdx:', secondIdx);

if (secondIdx !== -1) {
  const endIdx = code.indexOf('// Global App State (Safely Initialized Immediately)', secondIdx);
  console.log('endIdx:', endIdx);
  code = code.substring(0, secondIdx) + code.substring(endIdx);
  fs.writeFileSync('d:/crm whatsapp/crm-app/crm_app.js', code, 'utf8');
  console.log('Removed duplicate second block');
}

