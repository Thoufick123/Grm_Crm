const fs = require('fs');
let code = fs.readFileSync('crm_app.js', 'utf8');

// Conflict 1: lines around 4141
const target1 = `<<<<<<< HEAD
    // Check if this message bubble is a matching product in the live stream
    const msgTextLower = (msg.text || '').toLowerCase();
    const isMatchingProductInMsg = hasActiveFilter && (
      matchingMsgIds.has(String(msgId)) ||
      (msg.media_url && Array.from(matchingKeywords).some(k => k.length > 5 && msg.media_url.includes(k))) ||
      Array.from(matchingSkus).some(sku => sku && msgTextLower.includes(sku)) ||
      Array.from(matchingKeywords).some(kw => kw && kw.length > 4 && msgTextLower.includes(kw))
    );
=======
    window.ACTIVE_CHAT_MESSAGES_MAP = window.ACTIVE_CHAT_MESSAGES_MAP || {};
    if (msg.text) {
      window.ACTIVE_CHAT_MESSAGES_MAP[msgId] = msg.text;
    }
    const hasText = !!(msg.text && msg.text.trim().length > 0 && msg.text !== '[Photo Attachment]' && !msg.text.includes('Voice Message'));
>>>>>>> origin/integration/dev2`;

const rep1 = `    window.ACTIVE_CHAT_MESSAGES_MAP = window.ACTIVE_CHAT_MESSAGES_MAP || {};
    if (msg.text) {
      window.ACTIVE_CHAT_MESSAGES_MAP[msgId] = msg.text;
    }
    const hasText = !!(msg.text && msg.text.trim().length > 0 && msg.text !== '[Photo Attachment]' && !msg.text.includes('Voice Message'));

    // Check if this message bubble is a matching product in the live stream
    const msgTextLower = (msg.text || '').toLowerCase();
    const isMatchingProductInMsg = hasActiveFilter && (
      matchingMsgIds.has(String(msgId)) ||
      (msg.media_url && Array.from(matchingKeywords).some(k => k.length > 5 && msg.media_url.includes(k))) ||
      Array.from(matchingSkus).some(sku => sku && msgTextLower.includes(sku)) ||
      Array.from(matchingKeywords).some(kw => kw && kw.length > 4 && msgTextLower.includes(kw))
    );`;

// Conflict 2: lines around 4326
const target2 = `<<<<<<< HEAD
  // Auto-scroll to bottom only if no active product filter is focused
  if (!hasActiveFilter) {
    stream.scrollTop = stream.scrollHeight;
  }
=======
  // Auto-restore any currently open translations across re-renders
  if (window.ACTIVE_MESSAGE_TRANSLATIONS) {
    Object.keys(window.ACTIVE_MESSAGE_TRANSLATIONS).forEach(mId => {
      const tLang = window.ACTIVE_MESSAGE_TRANSLATIONS[mId];
      const raw = window.ACTIVE_CHAT_MESSAGES_MAP ? window.ACTIVE_CHAT_MESSAGES_MAP[mId] : null;
      const cached = window.MESSAGE_TRANSLATIONS_CACHE ? window.MESSAGE_TRANSLATIONS_CACHE[\`\${mId}_\${tLang}\`] : null;
      if (cached && raw) {
        setTimeout(() => {
          renderTranslationBox(mId, raw, cached, tLang);
        }, 10);
      }
    });
  }

  // Auto-scroll to bottom
  stream.scrollTop = stream.scrollHeight;
>>>>>>> origin/integration/dev2`;

const rep2 = `  // Auto-restore any currently open translations across re-renders
  if (window.ACTIVE_MESSAGE_TRANSLATIONS) {
    Object.keys(window.ACTIVE_MESSAGE_TRANSLATIONS).forEach(mId => {
      const tLang = window.ACTIVE_MESSAGE_TRANSLATIONS[mId];
      const raw = window.ACTIVE_CHAT_MESSAGES_MAP ? window.ACTIVE_CHAT_MESSAGES_MAP[mId] : null;
      const cached = window.MESSAGE_TRANSLATIONS_CACHE ? window.MESSAGE_TRANSLATIONS_CACHE[\`\${mId}_\${tLang}\`] : null;
      if (cached && raw) {
        setTimeout(() => {
          renderTranslationBox(mId, raw, cached, tLang);
        }, 10);
      }
    });
  }

  // Auto-scroll to bottom only if no active product filter is focused
  if (!hasActiveFilter) {
    stream.scrollTop = stream.scrollHeight;
  }`;

// Conflict 3: Customer Name input
const target3 = `<<<<<<< HEAD
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Customer Name *:</label>
          <input type="text" id="cust-edit-name" value="\${valName}" \${isEditing ? '' : 'disabled'} required placeholder="Full Name" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
=======
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">\${t('customer.name', 'Customer Name *:')}</label>
          <input type="text" id="cust-edit-name" value="\${customer.name || ''}" \${isEditing ? '' : 'disabled'} required placeholder="\${t('customer.full_name', 'Full Name')}" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
>>>>>>> origin/integration/dev2`;

const rep3 = `          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">\${t('customer.name', 'Customer Name *:')}</label>
          <input type="text" id="cust-edit-name" value="\${valName}" \${isEditing ? '' : 'disabled'} required placeholder="\${t('customer.full_name', 'Full Name')}" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">`;

// Conflict 4: Delivery Address
const target4 = `<<<<<<< HEAD
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Delivery Address:</label>
          <textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Door No, Street, Landmark, City, Pincode" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${valAddress}</textarea>
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
          <textarea id="cust-edit-alt-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Alternative delivery address, office address, or hometown..." class="w-full \${isEditing ? 'bg-blue-50/40 border-blue-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${valAltAddress}</textarea>
=======
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">\${t('customer.address', 'Delivery Address:')}</label>
          <textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="\${t('customer.address_placeholder', 'Door No, Street, Landmark, City, Pincode')}" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${customer.address || ''}</textarea>
>>>>>>> origin/integration/dev2`;

const rep4 = `          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">\${t('customer.address', 'Delivery Address:')}</label>
          <textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="\${t('customer.address_placeholder', 'Door No, Street, Landmark, City, Pincode')}" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${valAddress}</textarea>
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
          <textarea id="cust-edit-alt-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Alternative delivery address, office address, or hometown..." class="w-full \${isEditing ? 'bg-blue-50/40 border-blue-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${valAltAddress}</textarea>`;

// Conflict 5: Notes
const target5 = `<<<<<<< HEAD
          <textarea id="cust-edit-notes" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Record customer mindset, fabric/size preferences, wholesale budget, buying behavior, or special instructions..." class="w-full \${isEditing ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-medium'} border rounded-xl p-2 text-xs">\${valNotes}</textarea>
=======
          <textarea id="cust-edit-notes" rows="2" \${isEditing ? '' : 'disabled'} placeholder="\${t('customer.notes_placeholder', 'Record customer mindset, fabric/size preferences, wholesale budget, buying behavior, or special instructions...')}" class="w-full \${isEditing ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-medium'} border rounded-xl p-2 text-xs">\${customer.notes || ''}</textarea>
>>>>>>> origin/integration/dev2`;

const rep5 = `          <textarea id="cust-edit-notes" rows="2" \${isEditing ? '' : 'disabled'} placeholder="\${t('customer.notes_placeholder', 'Record customer mindset, fabric/size preferences, wholesale budget, buying behavior, or special instructions...')}" class="w-full \${isEditing ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-medium'} border rounded-xl p-2 text-xs">\${valNotes}</textarea>`;

const norm = s => s.replace(/\r\n/g, '\n');
let nCode = norm(code);

[
  { name: '1', t: target1, r: rep1 },
  { name: '2', t: target2, r: rep2 },
  { name: '3', t: target3, r: rep3 },
  { name: '4', t: target4, r: rep4 },
  { name: '5', t: target5, r: rep5 }
].forEach(c => {
  const nt = norm(c.t);
  const nr = norm(c.r);
  if (nCode.includes(nt)) {
    nCode = nCode.replace(nt, nr);
    console.log('Conflict', c.name, 'in crm_app.js resolved successfully');
  } else {
    console.log('Failed to match conflict', c.name);
  }
});

fs.writeFileSync('crm_app.js', nCode, 'utf8');
fs.copyFileSync('crm_app.js', 'assets/js/crm_app.js');
console.log('Synchronized to assets/js/crm_app.js');
