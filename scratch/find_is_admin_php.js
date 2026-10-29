const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.php', 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('$isAdmin')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

