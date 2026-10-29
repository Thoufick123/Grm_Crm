const fs = require('fs');
let s = fs.readFileSync('index.html', 'utf8');

// Conflict 1: Staff submenu
const staffHeadRegex = /<<<<<<< HEAD\r?\n\s*<!-- STAFF MANAGEMENT MODULE WITH 3 SUB-ITEMS[\s\S]+?>>>>>>> origin\/integration\/dev2\r?\n\s*<\/div>\r?\n\s*<\/div>/;

const staffReplacement = `      <!-- STAFF MANAGEMENT MODULE WITH 3 SUB-ITEMS (Admin Only) -->
      <div id="nav-staff-group" class="space-y-1">
        <button onclick="toggleStaffSubmenu()" id="nav-staff"
          class="w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group"
          title="Staff & Team Management Hub">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-[20px] text-blue-400 group-hover:scale-110 transition">badge</span>
            <span class="font-bold" data-i18n="nav.staff">Staff Management</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span id="badge-total-staff-count"
              class="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
            <span id="staff-subnav-arrow" class="material-symbols-outlined text-[16px] text-slate-400 transition-transform duration-200">expand_more</span>
          </div>
        </button>

        <!-- Sub-items in Sidebar -->
        <div id="staff-submodules-menu" class="pl-7 pr-1 space-y-1">
          <!-- Sub-item 1: All Staff -->
          <button type="button" onclick="switchStaffSubmodule('list')" id="nav-sub-staff-list"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-blue-300 bg-blue-950/40 border border-blue-500/20 transition cursor-pointer"
            title="All Staff Directory & Table">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-blue-400">groups</span>
              <span>1. All Staff</span>
            </div>
            <span id="nav-sub-staff-count" class="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-1.5 py-0.2 rounded-full font-bold">3</span>
          </button>

          <!-- Sub-item 2: Add Staff -->
          <button type="button" onclick="switchStaffSubmodule('create')" id="nav-sub-staff-create"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-surface-sidebarActive transition cursor-pointer"
            title="Onboard & Add New Staff Member">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-emerald-400">person_add</span>
              <span>2. Add Staff</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full">+New</span>
          </button>

          <!-- Sub-item 3: Role Base -->
          <button type="button" onclick="switchStaffSubmodule('roles')" id="nav-sub-staff-roles"
            class="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-surface-sidebarActive transition cursor-pointer"
            title="Role Base Access Control Matrix (View, Create, Edit, Delete for All Modules)">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-[15px] text-purple-400">admin_panel_settings</span>
              <span>3. Role Base</span>
            </div>
            <span class="text-[9px] font-bold px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded-full">RBAC</span>
          </button>
        </div>
      </div>`;

// Conflict 2: Scripts
const scriptRegex = /<<<<<<< HEAD\r?\n\s*<!-- CLIENT-SIDE OCR ENGINE FOR PAYMENT SCREENSHOT VERIFICATION -->[\s\S]+?>>>>>>> origin\/integration\/dev2/;

const scriptReplacement = `  <!-- CLIENT-SIDE OCR ENGINE FOR PAYMENT SCREENSHOT VERIFICATION -->
  <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js"></script>

  <!-- LOAD MULTI-LANGUAGE & I18N TRANSLATION ENGINE -->
  <script src="crm_i18n.js?v=1.0"></script>

  <!-- LOAD MAIN APPLICATION LOGIC -->
  <script src="crm_app.js?v=12.0"></script>`;

if (staffHeadRegex.test(s)) {
  s = s.replace(staffHeadRegex, staffReplacement);
  console.log('Conflict 1 in index.html replaced');
} else {
  // Try looser regex
  const altStaff = /<<<<<<< HEAD[\s\S]+?>>>>>>> origin\/integration\/dev2\r?\n\s*<\/div>\r?\n\s*<\/div>/;
  if (altStaff.test(s)) {
    s = s.replace(altStaff, staffReplacement);
    console.log('Conflict 1 replaced with alt regex');
  } else {
    console.log('Failed to match Conflict 1');
  }
}

if (scriptRegex.test(s)) {
  s = s.replace(scriptRegex, scriptReplacement);
  console.log('Conflict 2 in index.html replaced');
} else {
  console.log('Could not match Conflict 2 regex');
}

fs.writeFileSync('index.html', s, 'utf8');

