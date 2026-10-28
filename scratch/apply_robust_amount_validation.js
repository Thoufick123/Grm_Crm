const fs = require('fs');
const path = require('path');

console.log("=== APPLYING ROBUST AMOUNT VALIDATION FIX ===");

// 1. UPDATE index.html: Insert Receipt Amount verification field in Online and COD panels
const indexPath = path.resolve('d:/grm-workspace/CRM/crm-app/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const targetOnlineUploadBoxEnd = `                  <!-- Uploaded Preview -->
                  <div id="online-screenshot-preview-box"
                    class="hidden flex items-center justify-between gap-3 text-left">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img id="online-screenshot-thumb" src="" alt="Receipt"
                        class="w-12 h-12 rounded-lg object-cover border border-emerald-200 shrink-0">
                      <div class="min-w-0">
                        <p id="online-screenshot-filename" class="text-xs font-bold text-slate-800 truncate">
                          screenshot.jpg</p>
                        <p class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">verified</span> Proof Attached
                        </p>
                      </div>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); removeScreenshot('ONLINE')"
                      class="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold border border-rose-200 shrink-0 cursor-pointer">
                      Remove
                    </button>
                  </div>
                </div>`;

const replacementOnlineUploadBoxEnd = `                  <!-- Uploaded Preview -->
                  <div id="online-screenshot-preview-box"
                    class="hidden flex items-center justify-between gap-3 text-left">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img id="online-screenshot-thumb" src="" alt="Receipt"
                        class="w-12 h-12 rounded-lg object-cover border border-emerald-200 shrink-0">
                      <div class="min-w-0">
                        <p id="online-screenshot-filename" class="text-xs font-bold text-slate-800 truncate">
                          screenshot.jpg</p>
                        <p class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">verified</span> Proof Attached
                        </p>
                      </div>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); removeScreenshot('ONLINE')"
                      class="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold border border-rose-200 shrink-0 cursor-pointer">
                      Remove
                    </button>
                  </div>
                </div>

                <!-- Verified Receipt Amount Validation Strip (Online Full Payment) -->
                <div id="online-receipt-amount-container" class="mt-2.5 p-3 bg-white rounded-xl border border-slate-300 shadow-2xs space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block font-extrabold text-slate-800 text-xs flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px] text-emerald-600">receipt_long</span>
                      <span>Payment Screenshot Paid Amount <span class="text-rose-600">*</span></span>
                    </label>
                    <span class="text-[10px] font-bold text-slate-400">OCR Auto-Detected / Verified</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="relative flex-1">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-500 text-xs">₹</span>
                      <input type="number" id="order-online-receipt-amount" placeholder="Amount shown on receipt (e.g. 1198)"
                        oninput="handleReceiptAmountChange('ONLINE', this.value)"
                        class="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500">
                    </div>
                    <div id="online-amount-match-pill" class="px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-slate-100 text-slate-500 border-slate-200">
                      <span>Pending Amount Check</span>
                    </div>
                  </div>
                  <div id="online-amount-mismatch-alert" class="hidden p-2.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs font-bold space-y-1 shadow-2xs"></div>
                </div>`;

const targetCodUploadBoxEnd = `                  <!-- Uploaded Preview -->
                  <div id="cod-screenshot-preview-box" class="hidden flex items-center justify-between gap-3 text-left">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img id="cod-screenshot-thumb" src="" alt="Advance Receipt"
                        class="w-12 h-12 rounded-lg object-cover border border-amber-200 shrink-0">
                      <div class="min-w-0">
                        <p id="cod-screenshot-filename" class="text-xs font-bold text-slate-800 truncate">
                          advance_200.jpg</p>
                        <p class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">verified</span> ₹200 Advance Proof
                          Attached
                        </p>
                      </div>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); removeScreenshot('COD')"
                      class="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold border border-rose-200 shrink-0 cursor-pointer">
                      Remove
                    </button>
                  </div>
                </div>`;

const replacementCodUploadBoxEnd = `                  <!-- Uploaded Preview -->
                  <div id="cod-screenshot-preview-box" class="hidden flex items-center justify-between gap-3 text-left">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <img id="cod-screenshot-thumb" src="" alt="Advance Receipt"
                        class="w-12 h-12 rounded-lg object-cover border border-amber-200 shrink-0">
                      <div class="min-w-0">
                        <p id="cod-screenshot-filename" class="text-xs font-bold text-slate-800 truncate">
                          advance_200.jpg</p>
                        <p class="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <span class="material-symbols-outlined text-[13px]">verified</span> ₹200 Advance Proof
                          Attached
                        </p>
                      </div>
                    </div>
                    <button type="button" onclick="event.stopPropagation(); removeScreenshot('COD')"
                      class="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold border border-rose-200 shrink-0 cursor-pointer">
                      Remove
                    </button>
                  </div>
                </div>

                <!-- Verified Receipt Amount Validation Strip (COD Advance Payment) -->
                <div id="cod-receipt-amount-container" class="mt-2.5 p-3 bg-white rounded-xl border border-slate-300 shadow-2xs space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="block font-extrabold text-slate-800 text-xs flex items-center gap-1">
                      <span class="material-symbols-outlined text-[16px] text-amber-600">receipt_long</span>
                      <span>COD Advance Amount Shown in Screenshot <span class="text-rose-600">*</span></span>
                    </label>
                    <span class="text-[10px] font-bold text-slate-400">Must be exactly ₹200</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <div class="relative flex-1">
                      <span class="absolute left-3 top-1/2 -translate-y-1/2 font-black text-slate-500 text-xs">₹</span>
                      <input type="number" id="order-cod-receipt-amount" placeholder="200"
                        oninput="handleReceiptAmountChange('COD', this.value)"
                        class="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-black text-slate-900 focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500">
                    </div>
                    <div id="cod-amount-match-pill" class="px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-slate-100 text-slate-500 border-slate-200">
                      <span>Must be ₹200</span>
                    </div>
                  </div>
                  <div id="cod-amount-mismatch-alert" class="hidden p-2.5 rounded-xl bg-rose-50 border-2 border-rose-300 text-rose-950 text-xs font-bold space-y-1 shadow-2xs"></div>
                </div>`;

let normIndex = indexHtml.replace(/\r\n/g, '\n');
if (normIndex.includes(targetOnlineUploadBoxEnd.replace(/\r\n/g, '\n'))) {
  normIndex = normIndex.replace(targetOnlineUploadBoxEnd.replace(/\r\n/g, '\n'), replacementOnlineUploadBoxEnd.replace(/\r\n/g, '\n'));
  console.log("Added online receipt amount container in index.html");
}
if (normIndex.includes(targetCodUploadBoxEnd.replace(/\r\n/g, '\n'))) {
  normIndex = normIndex.replace(targetCodUploadBoxEnd.replace(/\r\n/g, '\n'), replacementCodUploadBoxEnd.replace(/\r\n/g, '\n'));
  console.log("Added cod receipt amount container in index.html");
}

fs.writeFileSync(indexPath, normIndex.replace(/\n/g, '\r\n'), 'utf8');

// 2. UPDATE crm_app.js:
const appPath = path.resolve('d:/grm-workspace/CRM/crm-app/crm_app.js');
let appJs = fs.readFileSync(appPath, 'utf8');
let normApp = appJs.replace(/\r\n/g, '\n');

// 2.1 Add handleReceiptAmountChange & helper functions
const amountHandlers = `
/**
 * Real-time payment amount validation coordinator.
 * Compares screenshot amount directly with customer order total (e.g. ₹1,198 vs ₹233).
 * Strictly flags any shortage and locks the confirm button!
 */
function handleReceiptAmountChange(mode, rawValue) {
  const isOnline = mode === 'ONLINE';
  const prefix = isOnline ? 'online' : 'cod';
  const val = parseFloat(rawValue || '0');

  // Compute expected order amount
  let expectedAmount = 0;
  if (isOnline) {
    (ORDER_MODAL_STATE?.items || []).forEach(it => {
      expectedAmount += (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1);
    });
    if (expectedAmount === 0 && ORDER_MODAL_STATE?.grandTotal) expectedAmount = ORDER_MODAL_STATE.grandTotal;
  } else {
    expectedAmount = 200; // Mandatory COD advance
  }
  if (!expectedAmount) expectedAmount = 599;

  ORDER_MODAL_STATE.expectedAmount = expectedAmount;
  ORDER_MODAL_STATE.detectedAmount = val > 0 ? val : null;

  const inputEl = document.getElementById(prefix + '-receipt-amount');
  const pillEl = document.getElementById(prefix + '-amount-match-pill');
  const alertEl = document.getElementById(prefix + '-amount-mismatch-alert');
  const metaBadge = document.getElementById(prefix + '-screenshot-meta-badge');

  if (!val || val <= 0) {
    ORDER_MODAL_STATE.amountMismatch = true;
    if (pillEl) {
      pillEl.className = 'px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-slate-100 text-slate-500 border-slate-200';
      pillEl.innerHTML = '<span>Enter Amount</span>';
    }
    if (alertEl) alertEl.classList.add('hidden');
    if (inputEl) {
      inputEl.style.borderColor = '#e11d48';
      inputEl.style.backgroundColor = '#fff1f2';
      inputEl.style.color = '#9f1239';
    }
    updateOrderSubmitButtonState();
    return;
  }

  const isMismatch = Math.abs(val - expectedAmount) > 0.01;
  ORDER_MODAL_STATE.amountMismatch = isMismatch;

  if (isMismatch) {
    const shortage = expectedAmount - val;
    // Input Styling (Red Alert)
    if (inputEl) {
      inputEl.style.borderColor = '#e11d48';
      inputEl.style.backgroundColor = '#fff1f2';
      inputEl.style.color = '#9f1239';
      inputEl.style.boxShadow = '0 0 0 3px rgba(244, 63, 94, 0.25)';
    }

    // Pill status
    if (pillEl) {
      pillEl.className = 'px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-rose-100 text-rose-800 border-rose-300';
      pillEl.innerHTML = shortage > 0 ? ('<span class="material-symbols-outlined text-[14px]">cancel</span> Shortage: ₹' + shortage.toLocaleString('en-IN')) : ('<span class="material-symbols-outlined text-[14px]">error</span> Excess: ₹' + Math.abs(shortage).toLocaleString('en-IN'));
    }

    // Detailed Alert Box
    if (alertEl) {
      alertEl.classList.remove('hidden');
      alertEl.innerHTML = '<div class="flex items-center justify-between text-rose-900">' +
        '<span class="flex items-center gap-1"><span class="material-symbols-outlined text-[17px] text-rose-600">error</span> <span>AMOUNT MISMATCH: Receipt shows ₹' + val.toLocaleString('en-IN') + '</span></span>' +
        '<span class="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">Order: ₹' + expectedAmount.toLocaleString('en-IN') + '</span>' +
        '</div>' +
        '<p class="text-[11px] font-normal text-rose-800 mt-1 leading-relaxed">' +
        'Customer ordered amount is <strong>₹' + expectedAmount.toLocaleString('en-IN') + '</strong>, but the screenshot shows only <strong>₹' + val.toLocaleString('en-IN') + '</strong>. ' +
        (shortage > 0 ? ('Unpaid shortage of <strong class="underline font-black">₹' + shortage.toLocaleString('en-IN') + '</strong>. Order cannot be confirmed until full payment is verified.') : 'Amount does not match.') +
        '</p>';
    }

    // Preview Meta Badge
    if (metaBadge) {
      metaBadge.className = 'px-2.5 py-1 rounded-full bg-rose-500/25 text-rose-300 font-bold border border-rose-400/50 flex items-center gap-1';
      metaBadge.innerHTML = '<span class="material-symbols-outlined text-[13px]">cancel</span> Amount Mismatch: Receipt ₹' + val + ' ≠ Order ₹' + expectedAmount;
    }
  } else {
    // Input Styling (Emerald Verified)
    if (inputEl) {
      inputEl.style.borderColor = '#059669';
      inputEl.style.backgroundColor = '#ecfdf5';
      inputEl.style.color = '#064e3b';
      inputEl.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.25)';
    }

    // Pill status
    if (pillEl) {
      pillEl.className = 'px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-emerald-100 text-emerald-800 border-emerald-300';
      pillEl.innerHTML = '<span class="material-symbols-outlined text-[14px]">check_circle</span> 100% MATCH (₹' + val.toLocaleString('en-IN') + ')';
    }

    // Hide Mismatch Alert Box
    if (alertEl) alertEl.classList.add('hidden');

    // Preview Meta Badge
    if (metaBadge) {
      metaBadge.className = 'px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30 flex items-center gap-1';
      metaBadge.innerHTML = '<span class="material-symbols-outlined text-[12px]">verified_user</span> Payment Proof Verified (₹' + val + ') ✅';
    }
  }

  updateOrderSubmitButtonState();
}
window.handleReceiptAmountChange = handleReceiptAmountChange;
`;

if (!normApp.includes('function handleReceiptAmountChange')) {
  normApp = amountHandlers + '\n' + normApp;
  console.log("Added handleReceiptAmountChange function");
}

// 2.2 Update verifyPaymentScreenshotContent to run canvas scaling & auto-populate receipt amount
const targetVerifyTimeout = `      // Set a 4.5-second timeout so it never hangs
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR_TIMEOUT')), 4500)
      );`;

const replacementVerifyTimeout = `      // Set a 20-second timeout so larger receipts on mobile connections don't drop
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('OCR_TIMEOUT')), 20000)
      );`;

if (normApp.includes(targetVerifyTimeout)) {
  normApp = normApp.replace(targetVerifyTimeout, replacementVerifyTimeout);
  console.log("Updated OCR timeout to 20 seconds");
}

// 2.3 In setScreenshotPreview: Auto-populate order-online-receipt-amount / order-cod-receipt-amount
const targetInSetScreenshotPreview = `  // Evaluate Amount Mismatch
  const expectedAmount = ocrMeta?.expectedAmount || (mode === 'ONLINE' ? (ORDER_MODAL_STATE.items || []).reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1), 0) || 599 : 200);
  const detectedAmount = ocrMeta?.detectedAmount !== undefined ? ocrMeta.detectedAmount : null;
  const isMismatch = Boolean(ocrMeta?.isMismatch) || (detectedAmount !== null && Math.abs(detectedAmount - expectedAmount) > 0.01);
  const shortage = Math.abs(expectedAmount - (detectedAmount || 0));

  ORDER_MODAL_STATE.detectedAmount = detectedAmount;
  ORDER_MODAL_STATE.expectedAmount = expectedAmount;
  ORDER_MODAL_STATE.amountMismatch = isMismatch;`;

const replacementInSetScreenshotPreview = `  // Evaluate Amount Mismatch
  const expectedAmount = ocrMeta?.expectedAmount || (mode === 'ONLINE' ? (ORDER_MODAL_STATE.items || []).reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1), 0) || 599 : 200);
  const detectedAmount = ocrMeta?.detectedAmount !== undefined ? ocrMeta.detectedAmount : null;

  // Auto-populate the visible receipt amount input field
  const receiptAmtInput = document.getElementById(prefix + '-receipt-amount');
  if (receiptAmtInput) {
    if (detectedAmount !== null && detectedAmount > 0) {
      receiptAmtInput.value = detectedAmount;
    } else if (!receiptAmtInput.value) {
      // Default to empty if not detected so staff is forced to verify
      receiptAmtInput.value = '';
    }
  }

  // Run handleReceiptAmountChange with detected or entered amount
  const effectiveAmt = (detectedAmount !== null && detectedAmount > 0) ? detectedAmount : parseFloat(receiptAmtInput?.value || '0');
  handleReceiptAmountChange(mode, effectiveAmt);

  const isMismatch = Boolean(ORDER_MODAL_STATE.amountMismatch);
  const shortage = Math.abs(expectedAmount - (effectiveAmt || 0));`;

if (normApp.includes(targetInSetScreenshotPreview)) {
  normApp = normApp.replace(targetInSetScreenshotPreview, replacementInSetScreenshotPreview);
  console.log("Updated setScreenshotPreview to auto-populate receipt amount and run handleReceiptAmountChange");
}

// 2.4 In handleCreateOrder: Strict hard-block guard against amount mismatch
const targetHandleCreateOrderAmountGuard = `    // Check Amount Matching Guard
    if (ORDER_MODAL_STATE.amountMismatch) {
      showToast('Payment Amount Mismatch', \`Cannot confirm order: Receipt amount (₹\${ORDER_MODAL_STATE.detectedAmount}) does not match order total (₹\${ORDER_MODAL_STATE.expectedAmount})!\`, 'error', 'rose');
      if (typeof playChime === 'function') playChime('error');
      const valStatus = document.getElementById('online-screenshot-validation-status');
      if (valStatus) valStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }`;

const replacementHandleCreateOrderAmountGuard = `    // Strict Hard-Block Amount Matching Guard
    const expectedOnlineAmt = grandTotal;
    const onlineAmtInput = document.getElementById('order-online-receipt-amount');
    const onlineEnteredAmt = parseFloat(onlineAmtInput?.value || ORDER_MODAL_STATE.detectedAmount || '0');

    if (!onlineEnteredAmt || onlineEnteredAmt <= 0) {
      showToast('Payment Amount Required', 'Please enter and verify the payment amount shown on the screenshot receipt.', 'warning', 'rose');
      onlineAmtInput?.focus();
      return;
    }

    if (Math.abs(onlineEnteredAmt - expectedOnlineAmt) > 0.01 || ORDER_MODAL_STATE.amountMismatch) {
      const shortageAmt = expectedOnlineAmt - onlineEnteredAmt;
      showToast(
        'Payment Amount Mismatch Blocked',
        \`Cannot confirm order: Screenshot shows ₹\${onlineEnteredAmt.toLocaleString('en-IN')}, but customer order total is ₹\${expectedOnlineAmt.toLocaleString('en-IN')} (Shortage: ₹\${shortageAmt.toLocaleString('en-IN')}).\`,
        'error',
        'rose'
      );
      if (typeof playChime === 'function') playChime('error');
      onlineAmtInput?.focus();
      return;
    }`;

if (normApp.includes(targetHandleCreateOrderAmountGuard)) {
  normApp = normApp.replace(targetHandleCreateOrderAmountGuard, replacementHandleCreateOrderAmountGuard);
  console.log("Updated handleCreateOrder with strict amount mismatch guard");
}

// Also add guard for COD mode in handleCreateOrder
const targetCodCreateOrderGuard = `    // Strict Screenshot Validation
    if (!screenshot) {
      showToast('₹200 Advance Screenshot Required', 'Please upload or attach the ₹200 advance payment screenshot before booking parcel.', 'warning', 'rose');
      return;
    }`;

const replacementCodCreateOrderGuard = `    // Strict Screenshot Validation
    if (!screenshot) {
      showToast('₹200 Advance Screenshot Required', 'Please upload or attach the ₹200 advance payment screenshot before booking parcel.', 'warning', 'rose');
      return;
    }

    // Strict COD Advance Amount Guard (Must be ₹200)
    const codAmtInput = document.getElementById('order-cod-receipt-amount');
    const codEnteredAmt = parseFloat(codAmtInput?.value || ORDER_MODAL_STATE.detectedAmount || '0');

    if (!codEnteredAmt || codEnteredAmt <= 0) {
      showToast('Advance Amount Required', 'Please verify the ₹200 advance amount shown on the screenshot receipt.', 'warning', 'rose');
      codAmtInput?.focus();
      return;
    }

    if (Math.abs(codEnteredAmt - 200) > 0.01) {
      showToast('Advance Mismatch Blocked', \`Cannot confirm COD booking: Receipt shows ₹\${codEnteredAmt}, but mandatory COD advance is ₹200.\`, 'error', 'rose');
      if (typeof playChime === 'function') playChime('error');
      codAmtInput?.focus();
      return;
    }`;

if (normApp.includes(targetCodCreateOrderGuard)) {
  normApp = normApp.replace(targetCodCreateOrderGuard, replacementCodCreateOrderGuard);
  console.log("Added COD advance amount guard to handleCreateOrder");
}

// 2.5 In initOrderModal: Reset amount inputs
const targetInitModalInputs = `  const onlineFeedback = document.getElementById('online-upi-id-feedback');
  const codFeedback = document.getElementById('cod-upi-id-feedback');
  if (onlineFeedback) onlineFeedback.classList.add('hidden');
  if (codFeedback) codFeedback.classList.add('hidden');
  removeScreenshot('ONLINE');
  removeScreenshot('COD');
  updateOrderSubmitButtonState();`;

const replacementInitModalInputs = `  const onlineFeedback = document.getElementById('online-upi-id-feedback');
  const codFeedback = document.getElementById('cod-upi-id-feedback');
  if (onlineFeedback) onlineFeedback.classList.add('hidden');
  if (codFeedback) codFeedback.classList.add('hidden');

  const onlineAmtInp = document.getElementById('order-online-receipt-amount');
  const codAmtInp = document.getElementById('order-cod-receipt-amount');
  if (onlineAmtInp) {
    onlineAmtInp.value = '';
    onlineAmtInp.style.borderColor = '';
    onlineAmtInp.style.backgroundColor = '';
    onlineAmtInp.style.color = '';
    onlineAmtInp.style.boxShadow = '';
  }
  if (codAmtInp) {
    codAmtInp.value = '';
    codAmtInp.style.borderColor = '';
    codAmtInp.style.backgroundColor = '';
    codAmtInp.style.color = '';
    codAmtInp.style.boxShadow = '';
  }
  const onlinePill = document.getElementById('online-amount-match-pill');
  const codPill = document.getElementById('cod-amount-match-pill');
  if (onlinePill) {
    onlinePill.className = 'px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-slate-100 text-slate-500 border-slate-200';
    onlinePill.innerHTML = '<span>Pending Amount Check</span>';
  }
  if (codPill) {
    codPill.className = 'px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-slate-100 text-slate-500 border-slate-200';
    codPill.innerHTML = '<span>Must be ₹200</span>';
  }
  const onlineAlert = document.getElementById('online-amount-mismatch-alert');
  const codAlert = document.getElementById('cod-amount-mismatch-alert');
  if (onlineAlert) onlineAlert.classList.add('hidden');
  if (codAlert) codAlert.classList.add('hidden');

  removeScreenshot('ONLINE');
  removeScreenshot('COD');
  updateOrderSubmitButtonState();`;

if (normApp.includes(targetInitModalInputs)) {
  normApp = normApp.replace(targetInitModalInputs, replacementInitModalInputs);
  console.log("Updated initOrderModal with amount input resets");
}

// In removeScreenshot: Clear amount inputs
const targetRemoveInApp = `  ORDER_MODAL_STATE.amountMismatch = false;
  ORDER_MODAL_STATE.detectedAmount = null;`;

const replacementRemoveInApp = `  ORDER_MODAL_STATE.amountMismatch = false;
  ORDER_MODAL_STATE.detectedAmount = null;
  const amtInput = document.getElementById(prefix + '-receipt-amount');
  if (amtInput) {
    amtInput.value = '';
    amtInput.style.borderColor = '';
    amtInput.style.backgroundColor = '';
    amtInput.style.color = '';
    amtInput.style.boxShadow = '';
  }
  const pillEl = document.getElementById(prefix + '-amount-match-pill');
  if (pillEl) {
    pillEl.className = 'px-3 py-2 rounded-xl text-[11px] font-black font-mono border flex items-center gap-1 shrink-0 bg-slate-100 text-slate-500 border-slate-200';
    pillEl.innerHTML = isOnline ? '<span>Pending Amount Check</span>' : '<span>Must be ₹200</span>';
  }
  const alertEl = document.getElementById(prefix + '-amount-mismatch-alert');
  if (alertEl) alertEl.classList.add('hidden');`;

if (normApp.includes(targetRemoveInApp)) {
  normApp = normApp.replace(targetRemoveInApp, replacementRemoveInApp);
  console.log("Updated removeScreenshot with amount field resets");
}

// Convert back to CRLF and write
const isCrlf = appJs.includes('\r\n');
const finalAppJs = isCrlf ? normApp.replace(/\n/g, '\r\n') : normApp;
fs.writeFileSync(appPath, finalAppJs, 'utf8');

const assetPath = path.resolve('d:/grm-workspace/CRM/crm-app/assets/js/crm_app.js');
fs.writeFileSync(assetPath, finalAppJs, 'utf8');
console.log("Synced to crm_app.js and assets/js/crm_app.js!");
