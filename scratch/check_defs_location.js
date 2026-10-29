const fs = require('fs');

let code = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

// Let's inspect where CRM_MODULE_DEFINITIONS is at the bottom
const botDefsIdx = code.indexOf('// Complete 12 CRM Modules Definition');
console.log('botDefsIdx:', botDefsIdx);

const botCanUserIdx = code.indexOf('// 10. Granular Permission Checker for any Module & Action');
console.log('botCanUserIdx:', botCanUserIdx);

