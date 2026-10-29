const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('id="view-orders"') || (idx > 2600 && idx < 3200 && (l.includes('Create Order') || l.includes('btn-create') || l.includes('Move to Order')))) {
    console.log((idx + 1) + ': ' + l.trim());
  }
});

