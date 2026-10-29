const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

const lines = content.split('\n');
console.log(lines.slice(700, 740).join('\n'));
console.log('--- Sales & Operations & Settings ---');
console.log(lines.slice(775, 875).join('\n'));

