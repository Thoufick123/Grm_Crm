const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');
const lines = content.split('\n');

console.log('--- Staff View Elements ---');
lines.forEach((l, idx) => {
  if (l.includes('id="view-staff"') || l.includes('subview-staff') || l.includes('tab-staff') || l.includes('nav-sub-staff')) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

