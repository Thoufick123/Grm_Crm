const fs = require('fs');
const path = require('path');

const targetFile = path.resolve('d:/grm-workspace/CRM/crm-app/crm_app.js');
let code = fs.readFileSync(targetFile, 'utf8');

// Normalize line endings to \n for easier regex and then we can output \r\n
const isCrlf = code.includes('\r\n');
let normalized = code.replace(/\r\n/g, '\n');

// 1. In handleQuickCustomerSave
const targetHandleSave = `  const nameInput = document.getElementById('cust-edit-name');
  const phoneInput = document.getElementById('cust-edit-phone');
  const ageInput = document.getElementById('cust-edit-age');
  const genderInput = document.getElementById('cust-edit-gender');
  const emailInput = document.getElementById('cust-edit-email');
  const addressInput = document.getElementById('cust-edit-address');
  const notesInput = document.getElementById('cust-edit-notes');

  const newName = nameInput ? nameInput.value.trim() : customer.name;
  const newPhone = phoneInput ? phoneInput.value.trim() : (customer.whatsapp || customer.phone);
  const newAge = ageInput ? ageInput.value.trim() : (customer.age || '');
  const newGender = genderInput ? genderInput.value : (customer.gender || '');
  const newEmail = emailInput ? emailInput.value.trim() : (customer.email || '');
  const newAddress = addressInput ? addressInput.value.trim() : (customer.address || '');
  const newNotes = notesInput ? notesInput.value.trim() : (customer.notes || '');

  customer.name = newName;
  customer.phone = newPhone;
  customer.whatsapp = newPhone;
  customer.age = newAge;
  customer.gender = newGender;
  customer.email = newEmail;
  customer.address = newAddress;
  customer.notes = newNotes;`;

const replacementHandleSave = `  const nameInput = document.getElementById('cust-edit-name');
  const phoneInput = document.getElementById('cust-edit-phone');
  const altPhoneInput = document.getElementById('cust-edit-alt-phone');
  const ageInput = document.getElementById('cust-edit-age');
  const genderInput = document.getElementById('cust-edit-gender');
  const emailInput = document.getElementById('cust-edit-email');
  const addressInput = document.getElementById('cust-edit-address');
  const altAddressInput = document.getElementById('cust-edit-alt-address');
  const notesInput = document.getElementById('cust-edit-notes');

  const newName = nameInput ? nameInput.value.trim() : customer.name;
  const newPhone = phoneInput ? phoneInput.value.trim() : (customer.whatsapp || customer.phone);
  const newAltPhone = altPhoneInput ? altPhoneInput.value.trim() : (customer.altPhone || customer.alt_phone || '');
  const newAge = ageInput ? ageInput.value.trim() : (customer.age || '');
  const newGender = genderInput ? genderInput.value : (customer.gender || '');
  const newEmail = emailInput ? emailInput.value.trim() : (customer.email || '');
  const newAddress = addressInput ? addressInput.value.trim() : (customer.address || '');
  const newAltAddress = altAddressInput ? altAddressInput.value.trim() : (customer.altAddress || customer.alt_address || '');
  const newNotes = notesInput ? notesInput.value.trim() : (customer.notes || '');

  customer.name = newName;
  customer.phone = newPhone;
  customer.whatsapp = newPhone;
  customer.altPhone = newAltPhone;
  customer.alt_phone = newAltPhone;
  customer.age = newAge;
  customer.gender = newGender;
  customer.email = newEmail;
  customer.address = newAddress;
  customer.altAddress = newAltAddress;
  customer.alt_address = newAltAddress;
  customer.notes = newNotes;`;

if (!normalized.includes(targetHandleSave)) {
  console.error("Could not find targetHandleSave in crm_app.js");
  process.exit(1);
}
normalized = normalized.replace(targetHandleSave, replacementHandleSave);

// Also in handleQuickCustomerSave fetch body:
const targetFetchBody = `      phone: customer.phone,
      whatsapp: customer.whatsapp,
      age: customer.age,
      gender: customer.gender,
      email: customer.email,
      address: customer.address,
      notes: customer.notes`;

const replacementFetchBody = `      phone: customer.phone,
      whatsapp: customer.whatsapp,
      alt_phone: customer.alt_phone,
      altPhone: customer.alt_phone,
      age: customer.age,
      gender: customer.gender,
      email: customer.email,
      address: customer.address,
      alt_address: customer.alt_address,
      altAddress: customer.alt_address,
      notes: customer.notes`;

if (!normalized.includes(targetFetchBody)) {
  console.error("Could not find targetFetchBody in crm_app.js");
  process.exit(1);
}
normalized = normalized.replace(targetFetchBody, replacementFetchBody);

// 2. In renderCustomer360Panel:
// Add Alternative Phone right after WhatsApp Phone
const targetPhoneBlock = `        <!-- Phone Number (Auto-Fetched from WhatsApp Message) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-bold text-slate-700 text-[10px] uppercase tracking-wide">WhatsApp Phone *:</label>
            <span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Fetched
            </span>
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-emerald-600">call</span>
            <input type="text" id="cust-edit-phone" value="\${customer.whatsapp || customer.phone || ''}" \${isEditing ? '' : 'disabled'} required placeholder="+91 98765 43210" class="w-full pl-8 pr-3 py-2 \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-emerald-950 cursor-not-allowed select-none'} border rounded-xl text-xs font-mono font-bold">
          </div>
        </div>`;

const replacementPhoneBlock = `        <!-- Phone Number (Auto-Fetched from WhatsApp Message) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-bold text-slate-700 text-[10px] uppercase tracking-wide">WhatsApp Phone *:</label>
            <span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Fetched
            </span>
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-emerald-600">call</span>
            <input type="text" id="cust-edit-phone" value="\${customer.whatsapp || customer.phone || ''}" \${isEditing ? '' : 'disabled'} required placeholder="+91 98765 43210" class="w-full pl-8 pr-3 py-2 \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-emerald-950 cursor-not-allowed select-none'} border rounded-xl text-xs font-mono font-bold">
          </div>
        </div>

        <!-- Alternative Mobile / Phone Number -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-bold text-slate-700 text-[10px] uppercase tracking-wide flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px] text-slate-500">phone_iphone</span>
              <span>Alternative Number:</span>
            </label>
            <span class="text-[9px] text-slate-400 font-medium">Secondary</span>
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-slate-400">ring_volume</span>
            <input type="text" id="cust-edit-alt-phone" value="\${customer.altPhone || customer.alt_phone || ''}" \${isEditing ? '' : 'disabled'} placeholder="Secondary Mobile / Landline" class="w-full pl-8 pr-3 py-2 \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none'} border rounded-xl text-xs font-mono font-medium">
          </div>
        </div>`;

if (!normalized.includes(targetPhoneBlock)) {
  console.error("Could not find targetPhoneBlock in crm_app.js");
  process.exit(1);
}
normalized = normalized.replace(targetPhoneBlock, replacementPhoneBlock);

// Add Alternative Address right after Delivery Address
const targetAddressBlock = `        <!-- Delivery Address -->
        <div>
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Delivery Address:</label>
          <textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Door No, Street, Landmark, City, Pincode" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${customer.address || ''}</textarea>
        </div>`;

const replacementAddressBlock = `        <!-- Delivery Address (Primary) -->
        <div>
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Delivery Address:</label>
          <textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Door No, Street, Landmark, City, Pincode" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${customer.address || ''}</textarea>
        </div>

        <!-- Alternative Delivery Address -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-bold text-slate-700 text-[10px] uppercase tracking-wide flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-blue-600">home_pin</span>
              <span>Alternative Address:</span>
            </label>
            <span class="text-[9px] text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">Secondary</span>
          </div>
          <textarea id="cust-edit-alt-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Alternative delivery address, office address, or hometown..." class="w-full \${isEditing ? 'bg-blue-50/40 border-blue-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${customer.altAddress || customer.alt_address || ''}</textarea>
        </div>`;

if (!normalized.includes(targetAddressBlock)) {
  console.error("Could not find targetAddressBlock in crm_app.js");
  process.exit(1);
}
normalized = normalized.replace(targetAddressBlock, replacementAddressBlock);

// 3. In initOrderModal: setup address switcher and selectOrderModalAddress
const targetModalAddr = `  if (cAvatar) cAvatar.innerText = customer.avatar || customer.name.charAt(0);
  if (addrInput) addrInput.value = customer.address || 'No. 45, Gandhi Road, Chennai - 600020';`;

const replacementModalAddr = `  if (cAvatar) cAvatar.innerText = customer.avatar || customer.name.charAt(0);
  const primaryAddr = customer.address || 'No. 45, Gandhi Road, Chennai - 600020';
  const altAddr = customer.altAddress || customer.alt_address || '';
  if (addrInput) addrInput.value = primaryAddr;

  window._CURRENT_ORDER_MODAL_ADDRS = {
    primary: primaryAddr,
    alt: altAddr
  };

  const addrSwitcher = document.getElementById('order-address-switcher');
  const btnPrimary = document.getElementById('btn-addr-primary');
  const btnAlt = document.getElementById('btn-addr-alt');

  if (addrSwitcher) {
    if (altAddr) {
      addrSwitcher.classList.remove('hidden');
      addrSwitcher.classList.add('flex');
      if (btnPrimary) btnPrimary.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer';
      if (btnAlt) btnAlt.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 hover:bg-blue-50 cursor-pointer';
    } else {
      addrSwitcher.classList.add('hidden');
      addrSwitcher.classList.remove('flex');
    }
  }`;

if (!normalized.includes(targetModalAddr)) {
  console.error("Could not find targetModalAddr in crm_app.js");
  process.exit(1);
}
normalized = normalized.replace(targetModalAddr, replacementModalAddr);

// Check if selectOrderModalAddress is already defined
if (!normalized.includes('function selectOrderModalAddress')) {
  const selectOrderAddrFunc = `
function selectOrderModalAddress(type) {
  const addrInput = document.getElementById('order-shipping-addr');
  const btnPrimary = document.getElementById('btn-addr-primary');
  const btnAlt = document.getElementById('btn-addr-alt');
  const addrs = window._CURRENT_ORDER_MODAL_ADDRS || {};

  if (type === 'ALT') {
    if (addrInput && addrs.alt) addrInput.value = addrs.alt;
    if (btnAlt) {
      btnAlt.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900 border border-blue-400 cursor-pointer';
    }
    if (btnPrimary) {
      btnPrimary.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 hover:bg-slate-200 cursor-pointer';
    }
  } else {
    if (addrInput) addrInput.value = addrs.primary || '';
    if (btnPrimary) {
      btnPrimary.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 cursor-pointer';
    }
    if (btnAlt) {
      btnAlt.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 hover:bg-blue-50 cursor-pointer';
    }
  }
}
window.selectOrderModalAddress = selectOrderModalAddress;
`;
  normalized += selectOrderAddrFunc;
}

// Convert back to original CRLF
const finalCode = isCrlf ? normalized.replace(/\n/g, '\r\n') : normalized;
fs.writeFileSync(targetFile, finalCode, 'utf8');

// Also sync to assets/js/crm_app.js
const assetFile = path.resolve('d:/grm-workspace/CRM/crm-app/assets/js/crm_app.js');
fs.writeFileSync(assetFile, finalCode, 'utf8');

console.log("Successfully updated crm_app.js and assets/js/crm_app.js!");
