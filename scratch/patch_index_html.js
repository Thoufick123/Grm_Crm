const fs = require('fs');
let html = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

// 1. Navigation Section Headers
html = html.replace(
  '<div class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Command Center</div>',
  '<div id="nav-section-command-center" class="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Command Center</div>'
);

html = html.replace(
  '<div class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Sales & Operations\n      </div>',
  '<div id="nav-section-sales-operations" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Sales & Operations</div>'
);
html = html.replace(
  '<div class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Sales & Operations</div>',
  '<div id="nav-section-sales-operations" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Sales & Operations</div>'
);

html = html.replace(
  '<div class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Settings & Admin\n      </div>',
  '<div id="nav-section-settings-admin" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Settings & Admin</div>'
);
html = html.replace(
  '<div class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Settings & Admin</div>',
  '<div id="nav-section-settings-admin" class="pt-2 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500/80">Settings & Admin</div>'
);

// 2. Remove legacy admin-only-nav from nav items so visibility is driven by RBAC permissions
html = html.replace(
  '<div id="nav-staff-group" class="space-y-1 admin-only-nav">',
  '<div id="nav-staff-group" class="space-y-1">'
);

html = html.replace(
  '<button onclick="switchView(\'analytics\')" id="nav-analytics"\n        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group admin-only-nav">',
  '<button onclick="switchView(\'analytics\')" id="nav-analytics"\n        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">'
);

html = html.replace(
  '<button onclick="switchView(\'audit\')" id="nav-audit"\n        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group admin-only-nav">',
  '<button onclick="switchView(\'audit\')" id="nav-audit"\n        class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group">'
);

// 3. Staff Table + Add Staff Button ID
html = html.replace(
  '<button type="button" onclick="switchStaffTab(\'create\')"\n                    class="px-3.5 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition">',
  '<button type="button" onclick="switchStaffTab(\'create\')" id="btn-add-staff-table"\n                    class="px-3.5 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1 transition">'
);

// 4. Backup Cards IDs
html = html.replace(
  '<!-- 1. Export Backup Card -->\n            <div\n              class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">',
  '<!-- 1. Export Backup Card -->\n            <div id="card-backup-export"\n              class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">'
);

html = html.replace(
  '<!-- 2. Restore Backup Card -->\n            <div\n              class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">',
  '<!-- 2. Restore Backup Card -->\n            <div id="card-backup-restore"\n              class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between space-y-4">'
);

html = html.replace(
  '<!-- Reset / Factory Defaults Note -->\n          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between text-xs">',
  '<!-- Reset / Factory Defaults Note -->\n          <div id="card-backup-reset" class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between text-xs">'
);

html = html.replace(
  'class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition">\n              Reset Demo Data\n            </button>',
  'id="btn-backup-reset" class="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition">\n              Reset Demo Data\n            </button>'
);

// 5. Bump cache-buster to v=12.0
html = html.replace(/crm_app\.js\?v=[\d\.]+/g, 'crm_app.js?v=12.0');

fs.writeFileSync('d:/crm whatsapp/crm-app/index.html', html, 'utf8');
console.log('index.html updated successfully');

