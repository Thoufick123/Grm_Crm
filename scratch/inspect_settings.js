const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('id="view-settings"') || (idx > 4000 && idx < 4250 && (l.includes('Save') || l.includes('Disconnect')))) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

