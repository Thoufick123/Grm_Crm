const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

const lines = content.split('\n');
console.log(lines.slice(780, 950).join('\n'));

