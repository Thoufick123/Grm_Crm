const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (idx > 3535 && idx < 3630 && l.includes('+ Add Staff')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

