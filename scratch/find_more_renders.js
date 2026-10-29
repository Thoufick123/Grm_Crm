const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('function render') && (l.includes('Dnd') || l.includes('dnd') || l.includes('Customer') || l.includes('customer') || l.includes('Order') || l.includes('Followup'))) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

