const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const lines = content.split('\n');
lines.forEach((l, idx) => {
  if (l.includes('Move to Order') || l.includes('openOrderBookingModal') || l.includes('openCreateOrderModal')) {
    console.log((idx + 1) + ': ' + l.trim().slice(0, 100));
  }
});

