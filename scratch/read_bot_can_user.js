const fs = require('fs');
let code = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const botCanUserIdx = code.indexOf('// 10. Granular Permission Checker for any Module & Action');
console.log(code.substring(botCanUserIdx, botCanUserIdx + 600));

