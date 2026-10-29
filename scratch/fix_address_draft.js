const fs = require('fs');
const path = require('path');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const isCrlf = content.includes('\r\n');
  const eol = isCrlf ? '\r\n' : '\n';

  // Normalize to LF for easy matching
  let normalized = content.replace(/\r\n/g, '\n');

  // Find the anchor:
  const anchor = `  const isEditing = CUSTOMER_EDIT_MODES.has(customer.id);
  const isQueryEditing = query ? QUERY_EDIT_MODES.has(query.id) : false;`;

  const draftBlock = `  const isEditing = CUSTOMER_EDIT_MODES.has(customer.id);
  const isQueryEditing = query ? QUERY_EDIT_MODES.has(query.id) : false;

  // Preserve active uncommitted user typing if right panel re-renders during editing
  let draft = null;
  const existingEditForm = document.getElementById('form-quick-customer-edit');
  if (isEditing && existingEditForm) {
    draft = {
      name: document.getElementById('cust-edit-name')?.value,
      phone: document.getElementById('cust-edit-phone')?.value,
      altPhone: document.getElementById('cust-edit-alt-phone')?.value,
      gender: document.getElementById('cust-edit-gender')?.value,
      address: document.getElementById('cust-edit-address')?.value,
      altAddress: document.getElementById('cust-edit-alt-address')?.value,
      notes: document.getElementById('cust-edit-notes')?.value,
      focusedId: document.activeElement ? document.activeElement.id : null,
      selStart: document.activeElement ? document.activeElement.selectionStart : null,
      selEnd: document.activeElement ? document.activeElement.selectionEnd : null
    };
  }

  const valName = (draft && draft.name !== undefined) ? draft.name : (customer.name || '');
  const valPhone = (draft && draft.phone !== undefined) ? draft.phone : (customer.whatsapp || customer.phone || '');
  const valAltPhone = (draft && draft.altPhone !== undefined) ? draft.altPhone : (customer.altPhone || customer.alt_phone || '');
  const valGender = (draft && draft.gender !== undefined) ? draft.gender : (customer.gender || '');
  const cleanSavedAddr = (customer.address && customer.address !== 'Online WhatsApp Customer') ? customer.address : '';
  const valAddress = (draft && draft.address !== undefined) ? draft.address : cleanSavedAddr;
  const valAltAddress = (draft && draft.altAddress !== undefined) ? draft.altAddress : (customer.altAddress || customer.alt_address || '');
  const valNotes = (draft && draft.notes !== undefined) ? draft.notes : (customer.notes || '');`;

  if (normalized.includes(anchor) && !normalized.includes('const valAddress =')) {
    normalized = normalized.replace(anchor, draftBlock);
    console.log(`[PASS] Injected draft preservation block in ${filePath}`);
  } else if (normalized.includes('const valAddress =')) {
    console.log(`[INFO] valAddress already present in ${filePath}`);
  } else {
    console.error(`[FAIL] anchor not found in ${filePath}`);
  }

  // Restore focus and selection range
  const endAnchor = `      <!-- Past WhatsApp Orders List -->
      <div class="space-y-2 pt-1">
        \${orders.length === 0 ? '<p class="text-slate-400 italic text-center py-1">No previous orders</p>' : orders.map(ord => \`
          <div class="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-slate-800">\${ord.id}</span>
              <span class="font-mono font-bold text-emerald-700">₹\${ord.grandTotal}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1 truncate">\${ord.items.map(i => i.name).join(', ')}</p>
            <div class="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 text-[10px]">
              <span class="text-slate-400">\${ord.createdAt}</span>
              <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">\${ord.orderStatus}</span>
            </div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;
}`;

  const endReplacement = `      <!-- Past WhatsApp Orders List -->
      <div class="space-y-2 pt-1">
        \${orders.length === 0 ? '<p class="text-slate-400 italic text-center py-1">No previous orders</p>' : orders.map(ord => \`
          <div class="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-slate-800">\${ord.id}</span>
              <span class="font-mono font-bold text-emerald-700">₹\${ord.grandTotal}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1 truncate">\${ord.items.map(i => i.name).join(', ')}</p>
            <div class="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 text-[10px]">
              <span class="text-slate-400">\${ord.createdAt}</span>
              <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">\${ord.orderStatus}</span>
            </div>
          </div>
        \`).join('')}
      </div>
    </div>
  \`;

  // Restore focus and cursor position to active field if re-rendered during editing
  if (draft && draft.focusedId) {
    const el = document.getElementById(draft.focusedId);
    if (el) {
      el.focus();
      if (typeof draft.selStart === 'number' && typeof draft.selEnd === 'number' && el.setSelectionRange) {
        try { el.setSelectionRange(draft.selStart, draft.selEnd); } catch (e) {}
      }
    }
  }
}`;

  if (normalized.includes(endAnchor) && !normalized.includes('Restore focus and cursor position')) {
    normalized = normalized.replace(endAnchor, endReplacement);
    console.log(`[PASS] Injected focus restore in ${filePath}`);
  } else if (normalized.includes('Restore focus and cursor position')) {
    console.log(`[INFO] Focus restore already present in ${filePath}`);
  } else {
    console.error(`[FAIL] endAnchor not found in ${filePath}`);
  }

  // Restore CRLF if file was CRLF
  if (isCrlf) {
    normalized = normalized.replace(/\n/g, '\r\n');
  }

  fs.writeFileSync(filePath, normalized, 'utf8');
  console.log(`Finished ${filePath}`);
}

fixFile(path.resolve('crm_app.js'));
fixFile(path.resolve('assets/js/crm_app.js'));
