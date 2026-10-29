const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('id="view-backup"') || (idx > 3300 && idx < 3480 && (l.includes('Download Backup') || l.includes('Restore Backup') || l.includes('Reset Demo')))) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

