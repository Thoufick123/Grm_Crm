const fs = require('fs');
let code = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const botDefsIdx = code.indexOf('// Complete 12 CRM Modules Definition');
console.log(code.substring(botDefsIdx, botDefsIdx + 2000));

