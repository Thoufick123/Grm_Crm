const fs = require('fs');
const path = require('path');

console.log("=== APPLYING STRICT UPI VALIDATION FIX ===");

// 1. UPDATE index.html: Add maxlength="22", update placeholders
const indexPath = path.resolve('d:/grm-workspace/CRM/crm-app/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const targetOnlineInput = `<input type="text" id="order-online-upi-id" placeholder="e.g. 428910294821 or UPI-2026-..."
                  oninput="handleUPIIdInput('ONLINE', this)"
                  class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 uppercase transition">`;

const replacementOnlineInput = `<input type="text" id="order-online-upi-id" placeholder="Enter 12-digit numeric UTR (e.g. 428910294821)" maxlength="22" autocomplete="off" spellcheck="false"
                  oninput="handleUPIIdInput('ONLINE', this)"
                  class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 uppercase transition">`;

const targetCodInput = `<input type="text" id="order-cod-upi-id" placeholder="Enter ₹200 UPI UTR / Ref (e.g. 4289...)"
                  oninput="handleUPIIdInput('COD', this)"
                  class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 uppercase transition">`;

const replacementCodInput = `<input type="text" id="order-cod-upi-id" placeholder="Enter 12-digit numeric UTR (e.g. 428910294821)" maxlength="22" autocomplete="off" spellcheck="false"
                  oninput="handleUPIIdInput('COD', this)"
                  class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 uppercase transition">`;

let normIndex = indexHtml.replace(/\r\n/g, '\n');
if (normIndex.includes(targetOnlineInput.replace(/\r\n/g, '\n'))) {
  normIndex = normIndex.replace(targetOnlineInput.replace(/\r\n/g, '\n'), replacementOnlineInput);
  console.log("Updated order-online-upi-id input in index.html");
}
if (normIndex.includes(targetCodInput.replace(/\r\n/g, '\n'))) {
  normIndex = normIndex.replace(targetCodInput.replace(/\r\n/g, '\n'), replacementCodInput);
  console.log("Updated order-cod-upi-id input in index.html");
}

fs.writeFileSync(indexPath, normIndex.replace(/\n/g, '\r\n'), 'utf8');

// 2. UPDATE crm_app.js: validateUPIId, handleUPIIdInput, updateOrderSubmitButtonState
const appPath = path.resolve('d:/grm-workspace/CRM/crm-app/crm_app.js');
let appJs = fs.readFileSync(appPath, 'utf8');
let normApp = appJs.replace(/\r\n/g, '\n');

const targetValidateAndHandle = `/**
 * Strict UPI Transaction ID & UTR Validation
 * Validates formats:
 * - 12-digit numeric UTR (e.g., 428910294821)
 * - App-prefixed UTR (e.g., GPAY-428910294821, PHONEPE-T240101)
 * - Standard Banking reference (12 to 24 chars alphanumeric)
 * - UPI VPA address (e.g. user@okhdfcbank)
 * Strictly disallows: commas, spaces, random punctuation strings.
 */
function validateUPIId(value) {
  if (!value) return { valid: false, reason: 'UPI Transaction ID is required' };
  const cleaned = value.trim();

  // Strictly disallow commas, spaces and special delimiters
  if (/[,s;]/.test(cleaned)) {
    return { valid: false, reason: 'Commas and spaces are not allowed in UPI ID / UTR' };
  }

  // 1. Standard 12-digit numeric UTR (standard across all Indian banks)
  if (/^\\d{12}$/.test(cleaned)) {
    return { valid: true, type: '12-Digit Numeric UTR' };
  }

  // 2. App-prefixed UTR or reference (e.g., GPAY-428910294821 or PHONEPE-T240101)
  if (/^(GPAY|PHONEPE|PAYTM|BHIM|UPI)-[A-Z0-9]{8,24}$/i.test(cleaned)) {
    return { valid: true, type: 'App-Prefixed UTR Reference' };
  }

  // 3. Bank standard transaction reference (12 to 24 alphanumeric characters)
  if (/^[A-Za-z0-9]{12,24}$/.test(cleaned)) {
    return { valid: true, type: 'Banking Transaction Reference' };
  }

  // 4. Standard UPI VPA address (e.g., username@okhdfcbank)
  if (/^[a-zA-Z0-9.\\-_]{2,64}@[a-zA-Z]{2,32}$/.test(cleaned)) {
    return { valid: true, type: 'UPI VPA Address' };
  }

  return {
    valid: false,
    reason: 'Must be a 12-digit numeric UTR (e.g. 428910294821) or valid UPI Transaction ID without commas/spaces.'
  };
}
window.validateUPIId = validateUPIId;

function handleUPIIdInput(mode, inputEl) {
  if (!inputEl) return;
  // Automatically strip illegal characters like commas, spaces, semicolons
  let val = inputEl.value;
  if (/[\\s,;]/.test(val)) {
    val = val.replace(/[\\s,;]+/g, '');
    inputEl.value = val;
  }

  const res = validateUPIId(val);
  const feedbackEl = document.getElementById(mode === 'ONLINE' ? 'online-upi-id-feedback' : 'cod-upi-id-feedback');
  
  if (!feedbackEl) return;

  if (!val) {
    feedbackEl.classList.add('hidden');
    inputEl.classList.remove('border-rose-500', 'ring-2', 'ring-rose-500/20', 'border-emerald-500', 'ring-emerald-500/20');
    inputEl.classList.add('border-slate-300');
    return;
  }

  feedbackEl.classList.remove('hidden');
  if (res.valid) {
    inputEl.classList.remove('border-rose-500', 'ring-rose-500/20', 'border-slate-300');
    inputEl.classList.add('border-emerald-500', 'ring-2', 'ring-emerald-500/20');
    feedbackEl.className = 'mt-1 text-[11px] font-bold text-emerald-700 flex items-center gap-1';
    feedbackEl.innerHTML = \`<span class="material-symbols-outlined text-[14px]">check_circle</span> Valid \${res.type}\`;
  } else {
    inputEl.classList.remove('border-emerald-500', 'ring-emerald-500/20', 'border-slate-300');
    inputEl.classList.add('border-rose-500', 'ring-2', 'ring-rose-500/20');
    feedbackEl.className = 'mt-1 text-[11px] font-bold text-rose-600 flex items-center gap-1';
    feedbackEl.innerHTML = \`<span class="material-symbols-outlined text-[14px]">error</span> \${res.reason}\`;
  }
}
window.handleUPIIdInput = handleUPIIdInput;`;

const replacementValidateAndHandle = [
  '/**',
  ' * Strict UPI Transaction ID & UTR Validation',
  ' * Standard in Indian Banking (NPCI/RBI):',
  ' * 1. Exact 12-digit numeric UTR (e.g., 427812456120)',
  ' * 2. App-Prefixed 12-digit UTR (e.g., GPAY-427812456120, PHONEPE-428993213611)',
  ' * 3. Gateway Transaction ID (e.g., CICAgL2Evo3TYQ, T24102812345678)',
  ' * Rejects: random strings, keyboard smash, strings with letters without app prefix,',
  ' * strings shorter or longer than 12 digits, and all strings > 22 characters.',
  ' */',
  'function validateUPIId(value) {',
  '  if (!value || !value.trim()) {',
  "    return { valid: false, reason: '12-digit numeric UTR is required (e.g. 428910294821)', code: 'REQUIRED' };",
  '  }',
  '  const cleaned = value.trim();',
  '',
  '  // Illegal characters check (no commas, spaces, quotes, special symbols)',
  "  if (/[\\s,;!@#$%^&*()_+={}\\[\\]:\"'<>?\\/\\\\|]/.test(cleaned) && !cleaned.includes('-')) {",
  "    return { valid: false, reason: 'Commas, spaces, and special symbols are not allowed in UTR.', code: 'INVALID_CHARS' };",
  '  }',
  '',
  '  // Length limits: Max 22 characters',
  '  if (cleaned.length > 22) {',
  "    return { valid: false, reason: 'UTR is too long (' + cleaned.length + ' chars). Standard bank UTR is exactly 12 digits.', code: 'TOO_LONG' };",
  '  }',
  '',
  '  // 1. Standard 12-digit numeric UTR (Universal Indian Bank Standard)',
  '  if (/^\\d{12}$/.test(cleaned)) {',
  "    return { valid: true, type: '12-Digit Numeric UTR' };",
  '  }',
  '',
  '  // 2. App-prefixed 12-digit UTR: e.g. GPAY-427812456120, PHONEPE-428993213611, PAYTM-428993213611',
  '  if (/^(GPAY|PHONEPE|PAYTM|BHIM|UPI)-\\d{12}$/i.test(cleaned)) {',
  "    return { valid: true, type: 'App-Prefixed 12-Digit UTR' };",
  '  }',
  '',
  '  // 3. Official App transaction reference with valid app code',
  '  if (/^(GPAY|PHONEPE|PAYTM|BHIM|UPI)-[A-Za-z0-9]{8,16}$/i.test(cleaned)) {',
  "    return { valid: true, type: 'Verified App Transaction Ref' };",
  '  }',
  '',
  '  // 4. Google Pay / Official Payment Gateway ID (e.g. CICAgL2Evo3TYQ or T24102812345678)',
  '  if (/^CICAg[A-Za-z0-9_-]{8,14}$/i.test(cleaned) || /^T\\d{14,18}$/i.test(cleaned)) {',
  "    return { valid: true, type: 'Gateway Transaction ID' };",
  '  }',
  '',
  '  // If purely digits but not 12 digits:',
  '  if (/^\\d+$/.test(cleaned)) {',
  '    if (cleaned.length < 12) {',
  "      return { valid: false, reason: 'Incomplete UTR (' + cleaned.length + '/12 digits entered). Please enter all 12 digits.', code: 'SHORT_DIGITS' };",
  '    } else {',
  "      return { valid: false, reason: 'UTR has ' + cleaned.length + ' digits. Standard Indian bank UTR must be exactly 12 digits.', code: 'LONG_DIGITS' };",
  '    }',
  '  }',
  '',
  '  return {',
  "    valid: false,",
  "    reason: 'Must be a 12-digit numeric UTR (e.g. 428910294821) or valid App UTR (e.g. GPAY-428910294821).',",
  "    code: 'INVALID_FORMAT'",
  '  };',
  '}',
  'window.validateUPIId = validateUPIId;',
  '',
  '/**',
  ' * Real-time submit button state coordinator for the order booking modal.',
  ' * Disables button and displays exact guidance if UPI ID or screenshot or amount is invalid!',
  ' */',
  'function updateOrderSubmitButtonState() {',
  "  const submitBtn = document.getElementById('order-submit-button');",
  "  const submitLabel = document.getElementById('order-submit-btn-label');",
  '  if (!submitBtn || !submitLabel) return;',
  '',
  "  const mode = ORDER_MODAL_STATE?.paymentMode || 'ONLINE';",
  "  const isOnline = mode === 'ONLINE';",
  "  const inputEl = document.getElementById(isOnline ? 'order-online-upi-id' : 'order-cod-upi-id');",
  "  const upiVal = inputEl ? inputEl.value.trim() : '';",
  '  const upiRes = validateUPIId(upiVal);',
  '  const screenshot = isOnline ? ORDER_MODAL_STATE?.onlineScreenshot : ORDER_MODAL_STATE?.codScreenshot;',
  '  const isMismatch = Boolean(ORDER_MODAL_STATE?.amountMismatch);',
  '',
  '  let amt = 0;',
  '  (ORDER_MODAL_STATE?.items || []).forEach(it => amt += (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1));',
  '  if (amt === 0 && ORDER_MODAL_STATE?.grandTotal) amt = ORDER_MODAL_STATE.grandTotal;',
  '',
  '  // 1. Invalid UPI ID -> Disable button & show red/amber alert label',
  '  if (!upiRes.valid) {',
  '    submitBtn.disabled = true;',
  "    submitBtn.className = 'px-5 py-2.5 bg-slate-300 text-slate-600 rounded-xl font-extrabold shadow-none flex items-center gap-2 cursor-not-allowed transition';",
  "    submitLabel.innerText = upiVal ? '⚠️ Invalid UPI ID (12-Digit UTR Required)' : '⚠️ Enter 12-Digit UPI UTR';",
  '    return;',
  '  }',
  '',
  '  // 2. Missing Screenshot -> Guide to upload screenshot',
  '  if (!screenshot) {',
  '    submitBtn.disabled = true;',
  "    submitBtn.className = 'px-5 py-2.5 bg-slate-300 text-slate-600 rounded-xl font-extrabold shadow-none flex items-center gap-2 cursor-not-allowed transition';",
  "    submitLabel.innerText = '📸 Upload Payment Screenshot';",
  '    return;',
  '  }',
  '',
  '  // 3. Amount Mismatch -> Show Mismatch Alert',
  '  if (isMismatch) {',
  '    submitBtn.disabled = true;',
  "    submitBtn.className = 'px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-2 cursor-not-allowed transition';",
  "    submitLabel.innerText = '⚠️ Amount Mismatch (Paid ₹' + ORDER_MODAL_STATE.detectedAmount + ' ≠ ₹' + ORDER_MODAL_STATE.expectedAmount + ')';",
  '    return;',
  '  }',
  '',
  '  // 4. All Valid! Enable green confirm button',
  '  submitBtn.disabled = false;',
  "  submitBtn.className = 'px-5 py-2.5 bg-brand-wa hover:bg-brand-waDark text-white rounded-xl font-extrabold shadow-md flex items-center gap-2 transition hover:shadow-lg cursor-pointer';",
  "  submitLabel.innerText = isOnline ? 'Confirm Order & Save (Paid ₹' + amt.toLocaleString('en-IN') + ')' : 'Confirm Order & Save (Paid ₹200 Adv)';",
  '}',
  'window.updateOrderSubmitButtonState = updateOrderSubmitButtonState;',
  '',
  'function handleUPIIdInput(mode, inputEl) {',
  '  if (!inputEl) return;',
  "  const isOnline = mode === 'ONLINE';",
  "  const prefix = isOnline ? 'online' : 'cod';",
  '',
  '  // Automatically strip illegal characters like commas, spaces, quotes',
  '  let val = inputEl.value;',
  "  val = val.replace(/[^A-Za-z0-9-]/g, '');",
  '  if (val.length > 22) {',
  '    val = val.slice(0, 22);',
  '  }',
  '  inputEl.value = val;',
  '',
  '  const res = validateUPIId(val);',
  "  const feedbackEl = document.getElementById(prefix + '-upi-id-feedback');",
  '',
  '  if (!val) {',
  "    if (feedbackEl) feedbackEl.classList.add('hidden');",
  "    inputEl.style.borderColor = '';",
  "    inputEl.style.backgroundColor = '';",
  "    inputEl.style.color = '';",
  "    inputEl.style.boxShadow = '';",
  '    updateOrderSubmitButtonState();',
  '    return;',
  '  }',
  '',
  '  if (feedbackEl) {',
  "    feedbackEl.classList.remove('hidden');",
  '  }',
  '',
  '  if (res.valid) {',
  '    // Valid styling (Crisp Green with matching glow)',
  "    inputEl.style.borderColor = '#059669';",
  "    inputEl.style.backgroundColor = '#ecfdf5';",
  "    inputEl.style.color = '#064e3b';",
  "    inputEl.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.25)';",
  '',
  '    if (feedbackEl) {',
  "      feedbackEl.className = 'mt-1.5 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5';",
  "      feedbackEl.innerHTML = '<span class=\"material-symbols-outlined text-[15px] text-emerald-600\">check_circle</span> <span>Valid ' + res.type + ' Verified</span>';",
  '    }',
  '  } else {',
  '    // Invalid styling (Strong Red Border & Light Red Tint - overrides focus style)',
  "    inputEl.style.borderColor = '#e11d48';",
  "    inputEl.style.backgroundColor = '#fff1f2';",
  "    inputEl.style.color = '#9f1239';",
  "    inputEl.style.boxShadow = '0 0 0 3px rgba(244, 63, 94, 0.25)';",
  '',
  '    if (feedbackEl) {',
  "      feedbackEl.className = 'mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 flex items-start gap-1.5 shadow-2xs';",
  "      feedbackEl.innerHTML = '<span class=\"material-symbols-outlined text-[16px] text-rose-600 shrink-0 mt-0.5\">error</span> <span>' + res.reason + '</span>';",
  '    }',
  '  }',
  '',
  '  updateOrderSubmitButtonState();',
  '}',
  'window.handleUPIIdInput = handleUPIIdInput;'
].join('\n');

if (normApp.includes(targetValidateAndHandle)) {
  normApp = normApp.replace(targetValidateAndHandle, replacementValidateAndHandle);
  console.log("Updated validateUPIId, handleUPIIdInput, and updateOrderSubmitButtonState in crm_app.js");
} else {
  console.error("Could not find targetValidateAndHandle in crm_app.js");
}

// Also hook updateOrderSubmitButtonState into setOrderPaymentMode and initOrderModal
const targetInitModalClean = `  const onlineUpiInput = document.getElementById('order-online-upi-id');
  const codUpiInput = document.getElementById('order-cod-upi-id');
  if (onlineUpiInput) onlineUpiInput.value = '';
  if (codUpiInput) codUpiInput.value = '';
  removeScreenshot('ONLINE');
  removeScreenshot('COD');`;

const replacementInitModalClean = `  const onlineUpiInput = document.getElementById('order-online-upi-id');
  const codUpiInput = document.getElementById('order-cod-upi-id');
  if (onlineUpiInput) {
    onlineUpiInput.value = '';
    onlineUpiInput.style.borderColor = '';
    onlineUpiInput.style.backgroundColor = '';
    onlineUpiInput.style.color = '';
    onlineUpiInput.style.boxShadow = '';
  }
  if (codUpiInput) {
    codUpiInput.value = '';
    codUpiInput.style.borderColor = '';
    codUpiInput.style.backgroundColor = '';
    codUpiInput.style.color = '';
    codUpiInput.style.boxShadow = '';
  }
  const onlineFeedback = document.getElementById('online-upi-id-feedback');
  const codFeedback = document.getElementById('cod-upi-id-feedback');
  if (onlineFeedback) onlineFeedback.classList.add('hidden');
  if (codFeedback) codFeedback.classList.add('hidden');
  removeScreenshot('ONLINE');
  removeScreenshot('COD');
  updateOrderSubmitButtonState();`;

if (normApp.includes(targetInitModalClean)) {
  normApp = normApp.replace(targetInitModalClean, replacementInitModalClean);
  console.log("Hooked reset styles and updateOrderSubmitButtonState into initOrderModal");
}

// Convert back to CRLF and write
const isCrlf = appJs.includes('\r\n');
const finalAppJs = isCrlf ? normApp.replace(/\n/g, '\r\n') : normApp;
fs.writeFileSync(appPath, finalAppJs, 'utf8');

const assetPath = path.resolve('d:/grm-workspace/CRM/crm-app/assets/js/crm_app.js');
fs.writeFileSync(assetPath, finalAppJs, 'utf8');
console.log("Synced to crm_app.js and assets/js/crm_app.js!");
