const fs = require('fs');
const path = require('path');

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Guard renderInbox from re-rendering customer panel if user is typing
  const targetRenderInbox = `  try { renderCustomer360Panel(); } catch (e) { console.error('[renderInbox] renderCustomer360Panel error:', e); }`;
  const replacementRenderInbox = `  const rightPanel = document.getElementById('chat-right-panel');
  const isTypingInRightPanel = rightPanel && document.activeElement && rightPanel.contains(document.activeElement);
  if (!isTypingInRightPanel) {
    try { renderCustomer360Panel(); } catch (e) { console.error('[renderInbox] renderCustomer360Panel error:', e); }
  }`;
  if (content.includes(targetRenderInbox)) {
    content = content.replace(targetRenderInbox, replacementRenderInbox);
    console.log(`[PASS] Patched renderInbox in ${filePath}`);
  } else {
    console.warn(`[WARN] targetRenderInbox not found in ${filePath}`);
  }

  // 2. Clear default address from 'Online WhatsApp Customer' to ''
  const targetIngestAddr = `      address: 'Online WhatsApp Customer',`;
  const replacementIngestAddr = `      address: '',`;
  if (content.includes(targetIngestAddr)) {
    content = content.replace(targetIngestAddr, replacementIngestAddr);
    console.log(`[PASS] Patched ingestInboundMessage address in ${filePath}`);
  } else {
    console.warn(`[WARN] targetIngestAddr not found in ${filePath}`);
  }

  // 3. In openOrderBookingModal, avoid 'Online WhatsApp Customer' or fake mock address
  const targetOrderAddr1 = `    shippingAddress: customer.address || 'No. 45, Gandhi Road, Chennai - 600020'`;
  const replacementOrderAddr1 = `    shippingAddress: (customer.address && customer.address !== 'Online WhatsApp Customer') ? customer.address : ''`;
  if (content.includes(targetOrderAddr1)) {
    content = content.replace(targetOrderAddr1, replacementOrderAddr1);
    console.log(`[PASS] Patched order modal shippingAddress default in ${filePath}`);
  }

  const targetOrderAddr2 = `  const primaryAddr = customer.address || 'No. 45, Gandhi Road, Chennai - 600020';`;
  const replacementOrderAddr2 = `  const primaryAddr = (customer.address && customer.address !== 'Online WhatsApp Customer') ? customer.address : '';`;
  if (content.includes(targetOrderAddr2)) {
    content = content.replace(targetOrderAddr2, replacementOrderAddr2);
    console.log(`[PASS] Patched order modal primaryAddr in ${filePath}`);
  }

  // 4. In renderCustomer360Panel: capture draft values and use clean address
  const targetDraftAnchor = `  const isEditing = CUSTOMER_EDIT_MODES.has(customer.id);
  const isQueryEditing = query ? QUERY_EDIT_MODES.has(query.id) : false;`;

  const replacementDraftAnchor = `  const isEditing = CUSTOMER_EDIT_MODES.has(customer.id);
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

  if (content.includes(targetDraftAnchor)) {
    content = content.replace(targetDraftAnchor, replacementDraftAnchor);
    console.log(`[PASS] Patched draft preservation in ${filePath}`);
  } else {
    console.warn(`[WARN] targetDraftAnchor not found in ${filePath}`);
  }

  // 5. In form inputs, use the draft-preserved values:
  // cust-edit-name
  const targetInputName = `<input type="text" id="cust-edit-name" value="\${customer.name || ''}"`;
  const replaceInputName = `<input type="text" id="cust-edit-name" value="\${valName}"`;
  if (content.includes(targetInputName)) {
    content = content.replace(targetInputName, replaceInputName);
  }

  // cust-edit-phone
  const targetInputPhone = `<input type="text" id="cust-edit-phone" value="\${customer.whatsapp || customer.phone || ''}"`;
  const replaceInputPhone = `<input type="text" id="cust-edit-phone" value="\${valPhone}"`;
  if (content.includes(targetInputPhone)) {
    content = content.replace(targetInputPhone, replaceInputPhone);
  }

  // cust-edit-alt-phone
  const targetInputAltPhone = `<input type="text" id="cust-edit-alt-phone" value="\${customer.altPhone || customer.alt_phone || ''}"`;
  const replaceInputAltPhone = `<input type="text" id="cust-edit-alt-phone" value="\${valAltPhone}"`;
  if (content.includes(targetInputAltPhone)) {
    content = content.replace(targetInputAltPhone, replaceInputAltPhone);
  }

  // cust-edit-gender
  const targetSelectGender = `<select id="cust-edit-gender" \${isEditing ? '' : 'disabled'} class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
            <option value="" \${!customer.gender ? 'selected' : ''}>-- Select --</option>
            <option value="Female" \${customer.gender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Male" \${customer.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Other" \${customer.gender === 'Other' ? 'selected' : ''}>Other</option>
          </select>`;

  const replaceSelectGender = `<select id="cust-edit-gender" \${isEditing ? '' : 'disabled'} class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
            <option value="" \${!valGender ? 'selected' : ''}>-- Select --</option>
            <option value="Female" \${valGender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Male" \${valGender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Other" \${valGender === 'Other' ? 'selected' : ''}>Other</option>
          </select>`;
  if (content.includes(targetSelectGender)) {
    content = content.replace(targetSelectGender, replaceSelectGender);
  }

  // cust-edit-address
  const targetTextareaAddr = `<textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Door No, Street, Landmark, City, Pincode" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${customer.address || ''}</textarea>`;
  const replaceTextareaAddr = `<textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Door No, Street, Landmark, City, Pincode" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${valAddress}</textarea>`;
  if (content.includes(targetTextareaAddr)) {
    content = content.replace(targetTextareaAddr, replaceTextareaAddr);
    console.log(`[PASS] Patched cust-edit-address textarea in ${filePath}`);
  }

  // cust-edit-alt-address
  const targetTextareaAltAddr = `<textarea id="cust-edit-alt-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Alternative delivery address, office address, or hometown..." class="w-full \${isEditing ? 'bg-blue-50/40 border-blue-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${customer.altAddress || customer.alt_address || ''}</textarea>`;
  const replaceTextareaAltAddr = `<textarea id="cust-edit-alt-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Alternative delivery address, office address, or hometown..." class="w-full \${isEditing ? 'bg-blue-50/40 border-blue-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${valAltAddress}</textarea>`;
  if (content.includes(targetTextareaAltAddr)) {
    content = content.replace(targetTextareaAltAddr, replaceTextareaAltAddr);
  }

  // cust-edit-notes
  const targetTextareaNotes = `<textarea id="cust-edit-notes" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Record customer mindset, fabric/size preferences, wholesale budget, buying behavior, or special instructions..." class="w-full \${isEditing ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-medium'} border rounded-xl p-2 text-xs">\${customer.notes || ''}</textarea>`;
  const replaceTextareaNotes = `<textarea id="cust-edit-notes" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Record customer mindset, fabric/size preferences, wholesale budget, buying behavior, or special instructions..." class="w-full \${isEditing ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-medium'} border rounded-xl p-2 text-xs">\${valNotes}</textarea>`;
  if (content.includes(targetTextareaNotes)) {
    content = content.replace(targetTextareaNotes, replaceTextareaNotes);
  }

  // 6. Restore focus and selection range after panel.innerHTML is set
  const targetPanelEnd = `      <!-- Past WhatsApp Orders List -->
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

  const replacePanelEnd = `      <!-- Past WhatsApp Orders List -->
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

  if (content.includes(targetPanelEnd)) {
    content = content.replace(targetPanelEnd, replacePanelEnd);
    console.log(`[PASS] Patched focus restoration in ${filePath}`);
  } else {
    console.warn(`[WARN] targetPanelEnd not found in ${filePath}`);
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Successfully updated ${filePath}`);
}

patchFile(path.resolve('crm_app.js'));
patchFile(path.resolve('assets/js/crm_app.js'));
