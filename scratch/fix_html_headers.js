const fs = require('fs');
let html = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

html = html.replace(
  /<div class="pt-2 px-3 py-1 text-\[10px\] font-bold uppercase tracking-wider text-emerald-500\/80">Sales & Operations[\r\n\s]*<\/div>/,
  '<div id="nav-section-sales-operations" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Sales & Operations</div>'
);

html = html.replace(
  /<div class="pt-2 px-3 py-1 text-\[10px\] font-bold uppercase tracking-wider text-emerald-500\/80">Settings & Admin[\r\n\s]*<\/div>/,
  '<div id="nav-section-settings-admin" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Settings & Admin</div>'
);

fs.writeFileSync('d:/crm whatsapp/crm-app/index.html', html, 'utf8');
console.log('Fixed headers in index.html');

