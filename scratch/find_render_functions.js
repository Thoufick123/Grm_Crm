const fs = require('fs');
const content = fs.readFileSync('d:/crm whatsapp/crm-app/crm_app.js', 'utf8');

const functionsToFind = [
  'renderCatalog',
  'renderOrders',
  'renderCustomerDirectory',
  'renderFollowups',
  'renderDndTable',
  'renderDndList',
  'renderStaffTable',
  'renderBackupView'
];

functionsToFind.forEach(fn => {
  const idx = content.indexOf('function ' + fn);
  if (idx !== -1) {
    const lineNo = content.slice(0, idx).split('\n').length;
    console.log(`Found ${fn} at line ${lineNo}`);
  } else {
    console.log(`NOT found: ${fn}`);
  }
});

