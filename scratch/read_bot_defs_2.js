const fs = require('fs');
let code = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const botDefsIdx = code.indexOf('// Complete 12 CRM Modules Definition');
console.log(code.substring(botDefsIdx + 2000, botDefsIdx + 5000));

