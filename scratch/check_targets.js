const fs = require('fs');

const crmAppCode = fs.readFileSync('crm_app.js', 'utf8');

console.log('Original crm_app.js length:', crmAppCode.length);

// 1. Check renderInbox right panel guard
const targetInbox = `  try { renderCustomer360Panel(); } catch (e) { console.error('[renderInbox] renderCustomer360Panel error:', e); }`;
console.log('Target inbox exists:', crmAppCode.includes(targetInbox));

// 2. Check ingestInboundMessage address
const targetIngestAddr = `      address: 'Online WhatsApp Customer',`;
console.log('Target ingest address exists:', crmAppCode.includes(targetIngestAddr));

// 3. Check customer address textarea
const targetTextarea = `<textarea id="cust-edit-address" rows="2" \${isEditing ? '' : 'disabled'} placeholder="Door No, Street, Landmark, City, Pincode" class="w-full \${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">\${customer.address || ''}</textarea>`;
console.log('Target textarea exists:', crmAppCode.includes(targetTextarea));
