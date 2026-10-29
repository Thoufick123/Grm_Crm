const fs = require('fs');
let code = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const botDefsIdx = code.indexOf('// Complete 12 CRM Modules Definition');
const initRoleIdx = code.indexOf('function initRolePermissionsState()', botDefsIdx);
console.log(code.substring(initRoleIdx - 100, initRoleIdx + 300));

