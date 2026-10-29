const fs = require('fs');
let html = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

// 1. Staff Table "+ Add Staff" button
html = html.replace(
  /<button type="button" onclick="switchStaffTab\('create'\)"[\r\n\s]+class="px-3\.5 py-1\.5 bg-brand-wa hover:bg-brand-waDark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition">/,
  '<button type="button" onclick="switchStaffTab(\'create\')" id="btn-add-staff-table"\n                    class="px-3.5 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition">'
);

// 2. Backup Cards
html = html.replace(
  /<!-- 1\. Export Backup Card -->[\r\n\s]+<div[\r\n\s]+class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">/,
  '<!-- 1. Export Backup Card -->\n            <div id="card-backup-export"\n              class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">'
);

html = html.replace(
  /<!-- 2\. Restore Backup Card -->[\r\n\s]+<div[\r\n\s]+class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">/,
  '<!-- 2. Restore Backup Card -->\n            <div id="card-backup-restore"\n              class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">'
);

html = html.replace(
  /<!-- Reset \/ Factory Defaults Note -->[\r\n\s]+<div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between text-xs">/,
  '<!-- Reset / Factory Defaults Note -->\n          <div id="card-backup-reset" class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between text-xs">'
);

html = html.replace(
  /class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition">[\r\n\s]+Reset Demo Data[\r\n\s]+<\/button>/,
  'id="btn-backup-reset" class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition">\n              Reset Demo Data\n            </button>'
);

fs.writeFileSync('d:/crm whatsapp/crm-app/index.html', html, 'utf8');
console.log('Fixed all IDs in index.html');

