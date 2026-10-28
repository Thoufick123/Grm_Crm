const fs = require('fs');
const path = require('path');

const filePath = path.resolve('crm_app.js');
let code = fs.readFileSync(filePath, 'utf8');

// Replacement 1: initOrderModal staff population
const r1_find = `  if (addrInput) addrInput.value = customer.address || 'No. 45, Gandhi Road, Chennai - 600020';

  updateOrderProductDropdown();`;

const r1_replace = `  if (addrInput) addrInput.value = customer.address || 'No. 45, Gandhi Road, Chennai - 600020';

  // Populate Staff selector for credited sales specialist
  const staffSelect = document.getElementById('order-booking-staff-select');
  if (staffSelect) {
    const staffList = [...(CRM_STATE?.staffList || [])];
    if (!staffList.some(s => s.id === 'admin')) {
      staffList.push({ id: 'admin', name: 'Super Admin', role: 'Admin Manager' });
    }

    // Determine default staff for this customer
    let defaultStaffId = '';
    const linkedQuery = (CRM_STATE.queries || []).find(q => q.customerId === customer.id || q.customer_id === customer.id);
    if (linkedQuery && (linkedQuery.assignedTo || linkedQuery.assigned_to)) {
      defaultStaffId = linkedQuery.assignedTo || linkedQuery.assigned_to;
    } else if (customer && (customer.assignedTo || customer.assigned_to)) {
      defaultStaffId = customer.assignedTo || customer.assigned_to;
    } else if (CURRENT_USER && CURRENT_USER.id && CURRENT_USER.id !== 'admin') {
      defaultStaffId = CURRENT_USER.id;
    } else if (CRM_STATE.staffList && CRM_STATE.staffList.length > 0) {
      defaultStaffId = CRM_STATE.staffList[0].id;
    } else {
      defaultStaffId = 'admin';
    }

    staffSelect.innerHTML = staffList.map(s => \`
      <option value="\${s.id}" \${s.id === defaultStaffId ? 'selected' : ''}>
        \${s.name} (\${s.role || s.specialization || 'Sales Specialist'})
      </option>
    \`).join('');
  }

  updateOrderProductDropdown();`;

// Replacement 2: submitBookOrder reading staff
const r2_find = `    orderStatus: 'STOCK_RESERVED',
    shippingAddress: address,
    createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdBy: ACTIVE_ROLE === 'admin' ? 'Super Admin' : 'Assigned Staff'
  };

  CRM_STATE.orders.unshift(newOrder);`;

const r2_replace = `    orderStatus: 'PLACED',
    shippingAddress: address,
    createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    staffId: (() => {
      const el = document.getElementById('order-booking-staff-select');
      return el ? el.value : (query?.assignedTo || 'staff_01');
    })(),
    staffName: (() => {
      const el = document.getElementById('order-booking-staff-select');
      const val = el ? el.value : (query?.assignedTo || 'staff_01');
      const staffObj = (CRM_STATE?.staffList || []).find(s => s.id === val);
      return staffObj ? staffObj.name : (val === 'admin' ? 'Super Admin' : 'Priya Sharma');
    })(),
    createdBy: (() => {
      const el = document.getElementById('order-booking-staff-select');
      const val = el ? el.value : (query?.assignedTo || 'staff_01');
      const staffObj = (CRM_STATE?.staffList || []).find(s => s.id === val);
      return staffObj ? staffObj.name : (val === 'admin' ? 'Super Admin' : 'Priya Sharma');
    })()
  };

  CRM_STATE.orders.unshift(newOrder);

  // Sync newly booked order to MySQL backend
  fetch('api.php?action=save_order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  }).catch(() => {});`;

// Replacement 3: switchOrdersSubmodule and reassignOrderStaff
const r3_find = `function switchOrdersSubmodule(submodule) {
  ACTIVE_ORDERS_SUBMODULE = submodule || 'dashboard';
  const tabDash = document.getElementById('tab-orders-submodule-dashboard');
  const tabHist = document.getElementById('tab-orders-submodule-history');
  const viewDash = document.getElementById('subview-orders-dashboard');
  const viewHist = document.getElementById('subview-orders-history');

  if (submodule === 'dashboard') {
    if (viewDash) viewDash.classList.remove('hidden');
    if (viewHist) viewHist.classList.add('hidden');
    if (tabDash) tabDash.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm bg-white text-emerald-700 cursor-pointer";
    if (tabHist) tabHist.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all text-slate-600 hover:text-emerald-700 cursor-pointer";
    renderOrdersDashboard();
  } else {
    if (viewDash) viewDash.classList.add('hidden');
    if (viewHist) viewHist.classList.remove('hidden');
    if (tabDash) tabDash.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all text-slate-600 hover:text-emerald-700 cursor-pointer";
    if (tabHist) tabHist.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm bg-white text-emerald-700 cursor-pointer";
    renderOrdersHistoryTable();
  }
}
window.switchOrdersSubmodule = switchOrdersSubmodule;`;

const r3_replace = `function switchOrdersSubmodule(submodule) {
  ACTIVE_ORDERS_SUBMODULE = submodule || 'dashboard';
  const tabDash = document.getElementById('tab-orders-submodule-dashboard');
  const tabHist = document.getElementById('tab-orders-submodule-history');
  const viewDash = document.getElementById('subview-orders-dashboard');
  const viewHist = document.getElementById('subview-orders-history');

  const navDash = document.getElementById('nav-sub-orders-dashboard');
  const navHist = document.getElementById('nav-sub-orders-history');

  if (submodule === 'dashboard') {
    if (viewDash) viewDash.classList.remove('hidden');
    if (viewHist) viewHist.classList.add('hidden');
    if (tabDash) tabDash.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm bg-white text-emerald-700 cursor-pointer";
    if (tabHist) tabHist.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all text-slate-600 hover:text-emerald-700 cursor-pointer";
    if (navDash) navDash.className = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 transition cursor-pointer";
    if (navHist) navHist.className = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-sidebarActive transition cursor-pointer";
    try { window.location.hash = '#orders/dashboard'; } catch(e) {}
    renderOrdersDashboard();
  } else {
    if (viewDash) viewDash.classList.add('hidden');
    if (viewHist) viewHist.classList.remove('hidden');
    if (tabDash) tabDash.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all text-slate-600 hover:text-emerald-700 cursor-pointer";
    if (tabHist) tabHist.className = "px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 transition-all shadow-sm bg-white text-emerald-700 cursor-pointer";
    if (navDash) navDash.className = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-surface-sidebarActive transition cursor-pointer";
    if (navHist) navHist.className = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 transition cursor-pointer";
    try { window.location.hash = '#orders/history'; } catch(e) {}
    renderOrdersHistoryTable();
  }
}
window.switchOrdersSubmodule = switchOrdersSubmodule;

function reassignOrderStaff(orderId, newStaffId) {
  const ord = (CRM_STATE?.orders || []).find(o => o.id === orderId);
  if (!ord) return;
  const staffList = [...(CRM_STATE?.staffList || [])];
  if (!staffList.some(s => s.id === 'admin')) {
    staffList.push({ id: 'admin', name: 'Super Admin', role: 'Admin Manager' });
  }
  const staffObj = staffList.find(s => s.id === newStaffId) || { id: newStaffId, name: newStaffId === 'admin' ? 'Super Admin' : 'Staff' };

  const oldStaff = ord.staffName || ord.staff_name || ord.createdBy || 'Staff';
  ord.staffId = newStaffId;
  ord.staff_id = newStaffId;
  ord.staffName = staffObj.name;
  ord.staff_name = staffObj.name;
  ord.createdBy = staffObj.name;
  ord.created_by = staffObj.name;

  // Persist to MySQL database
  fetch('api.php?action=reassign_order_staff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: orderId,
      order_id: orderId,
      staff_id: newStaffId,
      staff_name: staffObj.name,
      user: CURRENT_USER?.name || 'Super Admin'
    })
  }).catch(() => {});

  logAudit('ORDER_REASSIGNED', 'ORDERS', \`Order \${orderId} reassigned from \${oldStaff} to \${staffObj.name}\`);
  saveCRMState();
  renderOrdersDashboard();
  renderOrdersHistoryTable();
  showToast('Order Reassigned', \`Order \${orderId} credited to \${staffObj.name}\`, 'support_agent', 'indigo');
}
window.reassignOrderStaff = reassignOrderStaff;`;

// Replacement 4: renderOrdersHistoryTable with product images, qty, and staff selector
const r4_find = `        <!-- 3. Which Staff Taken That Order -->
        <td class="py-3.5 px-4 whitespace-nowrap">
          <div class="flex items-center gap-2">
            <div class="w-7 h-7 rounded-lg bg-emerald-700 text-white font-black text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
              \${staffAvatar}
            </div>
            <div>
              <div class="font-bold text-slate-800 text-xs">\${staffDisplayName}</div>
              <div class="text-[10px] text-emerald-700 font-medium">WhatsApp Booking</div>
            </div>
          </div>
        </td>

        <!-- 4. Ordered Items -->
        <td class="py-3.5 px-4 text-slate-700 font-medium text-xs max-w-xs">
          \${(ord.items || []).map(i => \`
            <div class="truncate text-[11px]" title="\${i.name}">
              <strong class="font-bold text-slate-900">\${i.name}</strong> 
              <span class="text-slate-500 font-bold">(x\${i.qty || 1})</span>
              \${i.size ? \`<span class="text-[9px] bg-slate-100 px-1 rounded text-slate-600 font-semibold">\${i.size}</span>\` : ''}
              \${i.sku ? \`<span class="text-[9px] font-mono bg-slate-100 px-1 rounded ml-1 text-slate-600 font-bold">\${i.sku}</span>\` : ''}
            </div>
          \`).join('')}
        </td>`;

const r4_replace = `        <!-- 3. Which Staff Taken That Order (With Live Reassignment) -->
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-700 to-indigo-900 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-2xs">
              \${staffAvatar}
            </div>
            <div>
              <div class="font-extrabold text-slate-900 text-xs">\${staffDisplayName}</div>
              <div class="text-[10px] text-indigo-700 font-medium flex items-center gap-1">
                <span class="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                <span>Booking Specialist</span>
              </div>
            </div>
          </div>
          <!-- Inline Quick Staff Reassignment Dropdown -->
          <div class="mt-1.5 flex items-center gap-1.5">
            <span class="text-[9px] text-slate-400 font-extrabold uppercase">Credit:</span>
            <select onchange="reassignOrderStaff('\${ord.id}', this.value)" class="text-[10px] font-bold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 border border-indigo-200/90 rounded-md px-1.5 py-0.5 outline-none cursor-pointer" title="Reassign order credit to another staff specialist">
              \${(() => {
                const sList = [...(CRM_STATE?.staffList || [])];
                if (!sList.some(s => s.id === 'admin')) sList.push({ id: 'admin', name: 'Super Admin' });
                const curId = ord.staffId || ord.staff_id || (staffDisplayName.includes('Admin') ? 'admin' : '');
                return sList.map(s => \`<option value="\${s.id}" \${s.id === curId || s.name === staffDisplayName ? 'selected' : ''}>\${s.name}</option>\`).join('');
              })()}
            </select>
          </div>
        </td>

        <!-- 4. Ordered Items (Product Thumbnail, Name, Qty Stepper, Size & Price) -->
        <td class="py-3 px-4 text-slate-700 text-xs min-w-[240px] max-w-md">
          <div class="space-y-1.5">
            \${(ord.items || []).map(i => {
              const matchedProd = (CRM_STATE?.products || []).find(p => p.sku === i.sku || p.name === i.name);
              const fallbackImg = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=120&auto=format&fit=crop&q=60';
              const imgUrl = i.image || matchedProd?.image || matchedProd?.imageUrl || (matchedProd?.images && matchedProd.images[0]) || fallbackImg;
              const safeImg = (imgUrl || '').replace(/'/g, "\\\\'");
              const safeName = (i.name || 'Garment Item').replace(/"/g, '&quot;');
              const unitPrice = parseFloat(i.price || matchedProd?.price || 0);
              const qty = parseInt(i.qty || 1);
              const lineTotal = unitPrice * qty;

              return \`
                <div class="flex items-center gap-2.5 p-1.5 bg-slate-50/90 hover:bg-slate-100/90 rounded-xl border border-slate-200/80 transition">
                  <!-- Product Image Thumbnail -->
                  <div class="relative shrink-0">
                    <img src="\${imgUrl}" alt="\${safeName}" class="w-11 h-11 rounded-lg object-cover border border-slate-200 shadow-2xs bg-white cursor-pointer hover:scale-105 transition" onclick="openImageLightbox('\${safeImg}', '\${safeName}')" onerror="this.onerror=null; this.src='\${fallbackImg}';">
                    <span class="absolute -top-1.5 -right-1.5 bg-emerald-700 text-white font-black text-[9px] px-1.5 py-0.2 rounded-full font-mono shadow-xs">x\${qty}</span>
                  </div>
                  <!-- Product Details -->
                  <div class="min-w-0 flex-1">
                    <div class="font-extrabold text-slate-900 text-xs truncate" title="\${safeName}">\${safeName}</div>
                    <div class="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5 flex-wrap">
                      <span class="font-mono bg-white px-1.5 py-0.2 rounded border border-slate-200 font-bold text-slate-700">\${i.sku || 'SKU'}</span>
                      \${i.size ? \`<span class="bg-indigo-50 text-indigo-700 px-1 rounded font-bold">\${i.size}</span>\` : ''}
                      \${unitPrice > 0 ? \`<span class="font-mono font-bold text-emerald-800 ml-auto">₹\${lineTotal.toLocaleString('en-IN')}</span>\` : ''}
                    </div>
                  </div>
                </div>
              \`;
            }).join('')}
          </div>
        </td>`;

function applyReplace(name, findStr, replaceStr) {
  // Normalize CRLF to LF for comparison
  const normCode = code.replace(/\r\n/g, '\n');
  const normFind = findStr.replace(/\r\n/g, '\n');
  const normReplace = replaceStr.replace(/\r\n/g, '\n');

  if (normCode.includes(normFind)) {
    code = normCode.replace(normFind, normReplace);
    console.log(`✓ Successfully applied ${name}`);
    return true;
  } else {
    console.error(`✗ Could not find string for ${name}`);
    return false;
  }
}

applyReplace('r1 (initOrderModal)', r1_find, r1_replace);
applyReplace('r2 (submitBookOrder)', r2_find, r2_replace);
applyReplace('r3 (switchOrdersSubmodule & reassignOrderStaff)', r3_find, r3_replace);
applyReplace('r4 (renderOrdersHistoryTable)', r4_find, r4_replace);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Saved updated crm_app.js');

// Sync to assets/js/crm_app.js
const destPath = path.resolve('assets/js/crm_app.js');
fs.writeFileSync(destPath, code, 'utf8');
console.log('Saved updated assets/js/crm_app.js');
