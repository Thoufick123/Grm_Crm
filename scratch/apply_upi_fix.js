const fs = require('fs');
const path = require('path');

const appPath = path.resolve('d:/grm-workspace/CRM/crm-app/crm_app.js');
let code = fs.readFileSync(appPath, 'utf8');
const isCrlf = code.includes('\r\n');
let norm = code.replace(/\r\n/g, '\n');

const startMarker = 'function validateUPIId(value) {';
const endMarker = 'window.handleUPIIdInput = handleUPIIdInput;';

const startIdx = norm.indexOf(startMarker);
const endIdx = norm.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error("Markers not found! start:", startIdx, "end:", endIdx);
  process.exit(1);
}

const replacement = `function validateUPIId(value) {
  if (!value || !value.trim()) {
    return { valid: false, reason: '12-digit numeric UTR is required (e.g. 428910294821)', code: 'REQUIRED' };
  }
  const cleaned = value.trim();

  // Illegal characters check (no commas, spaces, quotes, special symbols)
  if (/[\\s,;!@#$%^&*()_+={}\\[\\]:"'<>?\\/\\\\|]/.test(cleaned) && !cleaned.includes('-')) {
    return { valid: false, reason: 'Commas, spaces, and special symbols are not allowed in UTR.', code: 'INVALID_CHARS' };
  }

  // Length limits: Max 22 characters
  if (cleaned.length > 22) {
    return { valid: false, reason: 'UTR is too long (' + cleaned.length + ' chars). Standard bank UTR is exactly 12 digits.', code: 'TOO_LONG' };
  }

  // 1. Standard 12-digit numeric UTR (Universal Indian Bank Standard)
  if (/^\\d{12}$/.test(cleaned)) {
    return { valid: true, type: '12-Digit Numeric UTR' };
  }

  // 2. App-prefixed 12-digit UTR: e.g. GPAY-427812456120, PHONEPE-428993213611, PAYTM-428993213611
  if (/^(GPAY|PHONEPE|PAYTM|BHIM|UPI)-\\d{12}$/i.test(cleaned)) {
    return { valid: true, type: 'App-Prefixed 12-Digit UTR' };
  }

  // 3. Official App transaction reference with valid app code
  if (/^(GPAY|PHONEPE|PAYTM|BHIM|UPI)-[A-Za-z0-9]{8,16}$/i.test(cleaned)) {
    return { valid: true, type: 'Verified App Transaction Ref' };
  }

  // 4. Google Pay / Official Payment Gateway ID (e.g. CICAgL2Evo3TYQ or T24102812345678)
  if (/^CICAg[A-Za-z0-9_-]{8,14}$/i.test(cleaned) || /^T\\d{14,18}$/i.test(cleaned)) {
    return { valid: true, type: 'Gateway Transaction ID' };
  }

  // If purely digits but not 12 digits:
  if (/^\\d+$/.test(cleaned)) {
    if (cleaned.length < 12) {
      return { valid: false, reason: 'Incomplete UTR (' + cleaned.length + '/12 digits entered). Please enter all 12 digits.', code: 'SHORT_DIGITS' };
    } else {
      return { valid: false, reason: 'UTR has ' + cleaned.length + ' digits. Standard Indian bank UTR must be exactly 12 digits.', code: 'LONG_DIGITS' };
    }
  }

  return {
    valid: false,
    reason: 'Must be a 12-digit numeric UTR (e.g. 428910294821) or valid App UTR (e.g. GPAY-428910294821).',
    code: 'INVALID_FORMAT'
  };
}
window.validateUPIId = validateUPIId;

/**
 * Real-time submit button state coordinator for the order booking modal.
 * Disables button and displays exact guidance if UPI ID or screenshot or amount is invalid!
 */
function updateOrderSubmitButtonState() {
  const submitBtn = document.getElementById('order-submit-button');
  const submitLabel = document.getElementById('order-submit-btn-label');
  if (!submitBtn || !submitLabel) return;

  const mode = ORDER_MODAL_STATE?.paymentMode || 'ONLINE';
  const isOnline = mode === 'ONLINE';
  const inputEl = document.getElementById(isOnline ? 'order-online-upi-id' : 'order-cod-upi-id');
  const upiVal = inputEl ? inputEl.value.trim() : '';
  const upiRes = validateUPIId(upiVal);
  const screenshot = isOnline ? ORDER_MODAL_STATE?.onlineScreenshot : ORDER_MODAL_STATE?.codScreenshot;
  const isMismatch = Boolean(ORDER_MODAL_STATE?.amountMismatch);

  let amt = 0;
  (ORDER_MODAL_STATE?.items || []).forEach(it => amt += (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1));
  if (amt === 0 && ORDER_MODAL_STATE?.grandTotal) amt = ORDER_MODAL_STATE.grandTotal;

  // 1. Invalid UPI ID -> Disable button & show red/amber alert label
  if (!upiRes.valid) {
    submitBtn.disabled = true;
    submitBtn.className = 'px-5 py-2.5 bg-slate-300 text-slate-600 rounded-xl font-extrabold shadow-none flex items-center gap-2 cursor-not-allowed transition';
    submitLabel.innerText = upiVal ? '⚠️ Invalid UPI ID (12-Digit UTR Required)' : '⚠️ Enter 12-Digit UPI UTR';
    return;
  }

  // 2. Missing Screenshot -> Guide to upload screenshot
  if (!screenshot) {
    submitBtn.disabled = true;
    submitBtn.className = 'px-5 py-2.5 bg-slate-300 text-slate-600 rounded-xl font-extrabold shadow-none flex items-center gap-2 cursor-not-allowed transition';
    submitLabel.innerText = '📸 Upload Payment Screenshot';
    return;
  }

  // 3. Amount Mismatch -> Show Mismatch Alert
  if (isMismatch) {
    submitBtn.disabled = true;
    submitBtn.className = 'px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-2 cursor-not-allowed transition';
    submitLabel.innerText = '⚠️ Amount Mismatch (Paid ₹' + ORDER_MODAL_STATE.detectedAmount + ' ≠ ₹' + ORDER_MODAL_STATE.expectedAmount + ')';
    return;
  }

  // 4. All Valid! Enable green confirm button
  submitBtn.disabled = false;
  submitBtn.className = 'px-5 py-2.5 bg-brand-wa hover:bg-brand-waDark text-white rounded-xl font-extrabold shadow-md flex items-center gap-2 transition hover:shadow-lg cursor-pointer';
  submitLabel.innerText = isOnline ? 'Confirm Order & Save (Paid ₹' + amt.toLocaleString('en-IN') + ')' : 'Confirm Order & Save (Paid ₹200 Adv)';
}
window.updateOrderSubmitButtonState = updateOrderSubmitButtonState;

function handleUPIIdInput(mode, inputEl) {
  if (!inputEl) return;
  const isOnline = mode === 'ONLINE';
  const prefix = isOnline ? 'online' : 'cod';

  // Automatically strip illegal characters like commas, spaces, quotes
  let val = inputEl.value;
  val = val.replace(/[^A-Za-z0-9-]/g, '');
  if (val.length > 22) {
    val = val.slice(0, 22);
  }
  inputEl.value = val;

  const res = validateUPIId(val);
  const feedbackEl = document.getElementById(prefix + '-upi-id-feedback');

  if (!val) {
    if (feedbackEl) feedbackEl.classList.add('hidden');
    inputEl.style.borderColor = '';
    inputEl.style.backgroundColor = '';
    inputEl.style.color = '';
    inputEl.style.boxShadow = '';
    updateOrderSubmitButtonState();
    return;
  }

  if (feedbackEl) {
    feedbackEl.classList.remove('hidden');
  }

  if (res.valid) {
    // Valid styling (Crisp Green with matching glow)
    inputEl.style.borderColor = '#059669';
    inputEl.style.backgroundColor = '#ecfdf5';
    inputEl.style.color = '#064e3b';
    inputEl.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.25)';

    if (feedbackEl) {
      feedbackEl.className = 'mt-1.5 p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-800 flex items-center gap-1.5';
      feedbackEl.innerHTML = '<span class="material-symbols-outlined text-[15px] text-emerald-600">check_circle</span> <span>Valid ' + res.type + ' Verified</span>';
    }
  } else {
    // Invalid styling (Strong Red Border & Light Red Tint - overrides focus style)
    inputEl.style.borderColor = '#e11d48';
    inputEl.style.backgroundColor = '#fff1f2';
    inputEl.style.color = '#9f1239';
    inputEl.style.boxShadow = '0 0 0 3px rgba(244, 63, 94, 0.25)';

    if (feedbackEl) {
      feedbackEl.className = 'mt-1.5 p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] font-bold text-rose-700 flex items-start gap-1.5 shadow-2xs';
      feedbackEl.innerHTML = '<span class="material-symbols-outlined text-[16px] text-rose-600 shrink-0 mt-0.5">error</span> <span>' + res.reason + '</span>';
    }
  }

  updateOrderSubmitButtonState();
}
window.handleUPIIdInput = handleUPIIdInput;`;

const newCode = norm.substring(0, startIdx) + replacement + norm.substring(endIdx + endMarker.length);
const finalCode = isCrlf ? newCode.replace(/\n/g, '\r\n') : newCode;

fs.writeFileSync(appPath, finalCode, 'utf8');

const assetPath = path.resolve('d:/grm-workspace/CRM/crm-app/assets/js/crm_app.js');
fs.writeFileSync(assetPath, finalCode, 'utf8');

console.log("Successfully replaced validateUPIId, handleUPIIdInput, and updateOrderSubmitButtonState!");
