const fs = require('fs');
let code = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const lines = code.split('\n');
console.log('Line 495-505:\n', lines.slice(495, 505).join('\n'));
console.log('Line 3650-3660:\n', lines.slice(3650, 3660).join('\n'));

