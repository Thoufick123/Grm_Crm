const fs = require('fs');
const path = require('path');

// =========================================================================
// 1. UPDATE index.html: ADD #modal-edit-order
// =========================================================================
const indexPath = path.resolve('d:/grm-workspace/CRM/crm-app/index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');

const targetAfterDispatch = `        <button type="button" onclick="confirmShippingDispatch()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-2 transition hover:shadow-lg cursor-pointer">
          <span class="material-symbols-outlined text-[19px]">local_shipping</span>
          <span>Confirm Dispatch &amp; Mark as Shipped</span>
        </button>
      </div>
    </div>
  </div>`;

const editOrderModalHtml = `        <button type="button" onclick="confirmShippingDispatch()" class="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-2 transition hover:shadow-lg cursor-pointer">
          <span class="material-symbols-outlined text-[19px]">local_shipping</span>
          <span>Confirm Dispatch &amp; Mark as Shipped</span>
        </button>
      </div>
    </div>
  </div>

  <!-- MODAL: EDIT WHATSAPP ORDER (NEW) -->
  <div id="modal-edit-order" class="fixed inset-0 z-50 modal-backdrop hidden flex items-center justify-center p-3 sm:p-4">
    <div class="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
      <!-- Header -->
      <div class="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-5 text-white flex items-center justify-between shrink-0 border-b border-blue-500/20">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-sm">
            <span class="material-symbols-outlined text-[26px]">edit_note</span>
          </div>
          <div>
            <div class="flex items-center gap-2">
              <h3 class="font-extrabold text-base tracking-tight">Edit WhatsApp Order &amp; Details</h3>
              <span id="edit-order-modal-status-badge" class="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/30 text-blue-300 border border-blue-400/40 uppercase">PLACED</span>
            </div>
            <p class="text-xs text-blue-200 mt-0.5">Modify items, shipping address, status, or tracking for Order <span id="edit-order-modal-id-title" class="font-mono font-bold text-white">#WA-2026-0000</span></p>
          </div>
        </div>
        <button type="button" onclick="closeModal('modal-edit-order')" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition cursor-pointer">
          <span class="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <!-- Scrollable Form Body -->
      <div class="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
        <!-- 1. Customer & Staff Section -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <div>
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Customer Name *</label>
            <input type="text" id="edit-order-cust-name" class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          </div>
          <div>
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Customer Phone *</label>
            <input type="text" id="edit-order-cust-phone" class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
          </div>
          <div class="sm:col-span-2">
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Order Credited Staff (Booking Specialist)</label>
            <select id="edit-order-staff-select" class="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
              <!-- Populated dynamically -->
            </select>
          </div>
        </div>

        <!-- 2. Delivery Address -->
        <div>
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px] text-slate-500">local_shipping</span>
            <span>Delivery &amp; Shipping Address:</span>
          </label>
          <textarea id="edit-order-shipping-address" rows="2" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 leading-relaxed"></textarea>
        </div>

        <!-- 3. Ordered Garments & Items List with Add/Edit/Quantity -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
              <span class="material-symbols-outlined text-[16px] text-blue-600">inventory_2</span>
              <span>Ordered Products &amp; Quantities:</span>
            </label>
            <button type="button" onclick="toggleEditOrderCatalogPicker()" class="text-[11px] font-bold text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1 cursor-pointer">
              <span class="material-symbols-outlined text-[14px]">add_circle</span>
              <span>Add Product</span>
            </button>
          </div>

          <!-- Optional Catalog Adder -->
          <div id="edit-order-catalog-row" class="hidden mb-2.5 p-2.5 bg-slate-100 border border-slate-200 rounded-xl space-y-2">
            <div class="flex items-center gap-2">
              <select id="edit-order-product-select" class="flex-1 bg-white border border-slate-300 text-slate-800 font-bold rounded-lg px-2.5 py-1.5 text-xs">
                <!-- Dynamically populated from products -->
              </select>
              <button type="button" onclick="addSelectedProductToEditOrder()" class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-xs">
                Add
              </button>
            </div>
          </div>

          <div id="edit-order-items-list" class="space-y-2 max-h-48 overflow-y-auto p-1 bg-slate-50/50 rounded-xl border border-slate-200">
            <!-- Dynamic Items Rows -->
          </div>

          <!-- Total Summary Bar -->
          <div class="mt-2.5 p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 border border-blue-200 rounded-xl flex items-center justify-between">
            <span class="font-bold text-slate-800 text-xs">Updated Order Total:</span>
            <div class="text-right">
              <span id="edit-order-grand-total" class="font-mono font-black text-lg text-blue-900">₹0</span>
              <span id="edit-order-items-count" class="text-[10px] text-blue-700 font-semibold block">0 items</span>
            </div>
          </div>
        </div>

        <!-- 4. Payment Details & Status -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Payment Method</label>
            <select id="edit-order-payment-method" onchange="onEditOrderPaymentMethodChange()" class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800">
              <option value="ONLINE_UPI">ONLINE_UPI (Full Paid)</option>
              <option value="COD">COD (₹200 Advance)</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Payment Status</label>
            <select id="edit-order-payment-status" class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800">
              <option value="PAID">PAID ✅</option>
              <option value="PARTIAL_PAID (₹200 ADVANCE)">PARTIAL_PAID (₹200 ADVANCE)</option>
              <option value="PENDING">PENDING</option>
              <option value="REFUNDED">REFUNDED</option>
            </select>
          </div>
          <div>
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">UPI Ref / UTR</label>
            <input type="text" id="edit-order-upi-id" placeholder="UTR Number" class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-800 uppercase">
          </div>
          <div id="edit-order-cod-fields" class="sm:col-span-3 grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
            <div>
              <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">COD Advance (₹)</label>
              <input type="number" id="edit-order-cod-advance" class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-800">
            </div>
            <div>
              <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">COD Balance Due (₹)</label>
              <input type="number" id="edit-order-cod-balance" class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-800">
            </div>
          </div>
        </div>

        <!-- 5. Order Fulfillment Status & Courier Tracking -->
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
          <div class="flex items-center justify-between">
            <label class="font-bold text-slate-800 text-xs flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px] text-indigo-600">local_shipping</span>
              <span>Fulfillment &amp; Courier Tracking:</span>
            </label>
            <div class="w-40">
              <select id="edit-order-status" class="w-full bg-white border border-indigo-300 rounded-xl p-2 text-xs font-extrabold text-indigo-950 focus:ring-2 focus:ring-indigo-500/20">
                <option value="PLACED">1. PLACED</option>
                <option value="PACKED">2. PACKED</option>
                <option value="SHIPPED">3. SHIPPED</option>
                <option value="DELIVERED">4. DELIVERED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Courier Partner</label>
              <input type="text" id="edit-order-courier-name" placeholder="ST Courier, Professional, DTDC, Delhivery..." class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-bold text-slate-800">
            </div>
            <div>
              <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Tracking ID / Consignment No.</label>
              <input type="text" id="edit-order-tracking-number" placeholder="e.g. STC9823412" class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono font-bold text-slate-800 uppercase">
            </div>
            <div class="sm:col-span-2">
              <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Shipping / Live Tracking URL</label>
              <input type="url" id="edit-order-shipping-url" placeholder="https://..." class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-mono text-slate-800">
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
        <button type="button" onclick="closeModal('modal-edit-order')" class="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition cursor-pointer">
          Cancel
        </button>
        <button type="button" onclick="saveEditedOrder()" class="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-md flex items-center gap-2 transition hover:shadow-lg cursor-pointer">
          <span class="material-symbols-outlined text-[19px]">save</span>
          <span>Save Order Changes</span>
        </button>
      </div>
    </div>
  </div>`;

if (!indexHtml.includes('id="modal-edit-order"')) {
  const normIndex = indexHtml.replace(/\r\n/g, '\n');
  const normTarget = targetAfterDispatch.replace(/\r\n/g, '\n');
  if (normIndex.includes(normTarget)) {
    const replaced = normIndex.replace(normTarget, editOrderModalHtml.replace(/\r\n/g, '\n'));
    fs.writeFileSync(indexPath, replaced.replace(/\n/g, '\r\n'), 'utf8');
    console.log("Updated index.html with #modal-edit-order");
  } else {
    console.error("Could not find targetAfterDispatch in index.html");
  }
} else {
  console.log("index.html already contains #modal-edit-order");
}

// =========================================================================
// 2. UPDATE crm_app.js:
//    A) Amount extraction & verification in verifyPaymentScreenshotContent & setScreenshotPreview
//    B) Edit Order button in renderOrdersHistoryTable Actions column
//    C) Functions: openEditOrderModal, renderEditOrderItemsList, saveEditedOrder, etc.
// =========================================================================
const appPath = path.resolve('d:/grm-workspace/CRM/crm-app/crm_app.js');
let appJs = fs.readFileSync(appPath, 'utf8');
let normApp = appJs.replace(/\r\n/g, '\n');

// 2.1 Amount Extraction Helper Function
const amountExtractorCode = `
/**
 * Smart extractor for payment amount from receipt OCR text.
 * Finds amounts like ₹233, Rs 233, 233.00, or contextual amounts.
 */
function extractPaymentAmountFromOCR(rawText) {
  if (!rawText) return null;
  const text = rawText.replace(/\\r/g, '');

  // 1. Direct Indian Rupee symbol or Rs or INR with number:
  // e.g. ₹233, ₹ 233, ₹233.00, Rs. 233, Rs 233, INR 233
  const directMatches = [];
  const currRegex = /(?:₹|rs\\.?|inr)\\s*([0-9,]+(?:\\.[0-9]{1,2})?)/gi;
  let m;
  while ((m = currRegex.exec(text)) !== null) {
    const val = parseFloat(m[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 500000) {
      directMatches.push(val);
    }
  }
  if (directMatches.length > 0) return directMatches[0];

  // 2. OCR artifact characters for ₹ (often parsed as ?, *, =, z, Z, R, r followed by digits):
  // e.g. "?233", "*233", "z233", "=233" on a line of its own
  const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineMatch = line.match(/^[₹*?zZ=rRsS~]\\s*([0-9]{2,5}(?:\\.[0-9]{1,2})?)$/);
    if (lineMatch) {
      const val = parseFloat(lineMatch[1]);
      if (val !== 2024 && val !== 2025 && val !== 2026 && val !== 2027 && val > 0) {
        return val;
      }
    }
  }

  // 3. Line with just digits if surrounding lines indicate payment context
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const prev = (lines[i - 1] || '').toLowerCase();
    const next = (lines[i + 1] || '').toLowerCase();
    const numMatch = line.match(/^([0-9]{2,5}(?:\\.[0-9]{1,2})?)$/);
    if (numMatch) {
      const val = parseFloat(numMatch[1]);
      const hasPaymentContext = prev.includes('to') || prev.includes('paid') || prev.includes('+91') ||
                                next.includes('completed') || next.includes('successful') || next.includes('pay again') ||
                                next.includes('bank') || next.includes('uco') || next.includes('sbi');
      if (hasPaymentContext && val !== 2024 && val !== 2025 && val !== 2026 && val !== 2027) {
        return val;
      }
    }
  }

  // 4. Fallback: match after words "amount", "paid", "total", "debited":
  const kwRegex = /(?:amount|paid|total|debited|sent|transferred|transfer)\\s*:?\\s*(?:₹|rs\\.?|inr)?\\s*([0-9,]+(?:\\.[0-9]{1,2})?)/i;
  const kwMatch = text.match(kwRegex);
  if (kwMatch) {
    const val = parseFloat(kwMatch[1].replace(/,/g, ''));
    if (!isNaN(val) && val > 0 && val < 500000) return val;
  }

  return null;
}
window.extractPaymentAmountFromOCR = extractPaymentAmountFromOCR;
`;

if (!normApp.includes('function extractPaymentAmountFromOCR')) {
  normApp = amountExtractorCode + '\n' + normApp;
}

// 2.2 Update verifyPaymentScreenshotContent
const targetVerifyFunc = `      // If at least 1 keyword is found, it is a payment screenshot!
      if (found.length > 0) {
        const utrMatch = text.match(/\\b\\d{12}\\b/);
        return {
          isValid: true,
          detectedUTR: utrMatch ? utrMatch[0] : null,
          matchedKeywords: found
        };
      }`;

const replacementVerifyFunc = `      // If at least 1 keyword is found, it is a payment screenshot!
      if (found.length > 0) {
        const utrMatch = text.match(/\\b\\d{12}\\b/);
        const detectedAmt = extractPaymentAmountFromOCR(text);
        
        // Calculate expected amount based on mode and cart items
        let expectedAmt = 0;
        if (typeof ORDER_MODAL_STATE !== 'undefined' && ORDER_MODAL_STATE) {
          if (ORDER_MODAL_STATE.paymentMode === 'COD') {
            expectedAmt = 200; // Mandatory COD advance
          } else {
            (ORDER_MODAL_STATE.items || []).forEach(it => {
              expectedAmt += (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1);
            });
            if (expectedAmt === 0 && ORDER_MODAL_STATE.grandTotal) expectedAmt = ORDER_MODAL_STATE.grandTotal;
          }
        }
        if (!expectedAmt) expectedAmt = 599;

        const isMismatch = (detectedAmt !== null) && Math.abs(detectedAmt - expectedAmt) > 0.01;

        return {
          isValid: true,
          detectedUTR: utrMatch ? utrMatch[0] : null,
          detectedAmount: detectedAmt,
          expectedAmount: expectedAmt,
          isMismatch: isMismatch,
          shortage: isMismatch ? Math.abs(expectedAmt - detectedAmt) : 0,
          matchedKeywords: found
        };
      }`;

if (normApp.includes(targetVerifyFunc)) {
  normApp = normApp.replace(targetVerifyFunc, replacementVerifyFunc);
  console.log("Updated verifyPaymentScreenshotContent with amount detection");
}

// 2.3 Update setScreenshotPreview to handle amount mismatch warning
const targetSetPreview = `  if (validationStatus) {
    validationStatus.className = 'mt-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5';
    validationStatus.innerHTML = \`<span class="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span> Screenshot Verified &amp; Attached\`;
    validationStatus.classList.remove('hidden');
  }

  showToast('Receipt Attached', 'Payment screenshot verified successfully.', 'verified', 'emerald');`;

const replacementSetPreview = `  // Evaluate Amount Mismatch
  const expectedAmount = ocrMeta?.expectedAmount || (mode === 'ONLINE' ? (ORDER_MODAL_STATE.items || []).reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1), 0) || 599 : 200);
  const detectedAmount = ocrMeta?.detectedAmount !== undefined ? ocrMeta.detectedAmount : null;
  const isMismatch = Boolean(ocrMeta?.isMismatch) || (detectedAmount !== null && Math.abs(detectedAmount - expectedAmount) > 0.01);
  const shortage = Math.abs(expectedAmount - (detectedAmount || 0));

  ORDER_MODAL_STATE.detectedAmount = detectedAmount;
  ORDER_MODAL_STATE.expectedAmount = expectedAmount;
  ORDER_MODAL_STATE.amountMismatch = isMismatch;

  const submitBtn = document.getElementById('order-submit-button');
  const submitLabel = document.getElementById('order-submit-btn-label');

  if (isMismatch) {
    // ⚠️ AMOUNT MISMATCH DETECTED
    if (validationStatus) {
      validationStatus.className = 'mt-2 p-3 bg-rose-50 border-2 border-rose-300 text-rose-950 rounded-xl text-xs font-bold space-y-2 shadow-xs';
      validationStatus.innerHTML = \`
        <div class="flex items-start justify-between gap-2">
          <div class="flex items-center gap-1.5 text-rose-800">
            <span class="material-symbols-outlined text-[20px] text-rose-600 shrink-0">error</span>
            <span class="text-xs font-black">PAYMENT AMOUNT MISMATCH DETECTED!</span>
          </div>
          <span class="px-2 py-0.5 rounded bg-rose-200 text-rose-900 font-mono font-black text-[10px]">
            Shortage: ₹\${shortage.toLocaleString('en-IN')}
          </span>
        </div>
        <p class="text-[11px] font-normal text-rose-900 leading-relaxed">
          Customer ordered amount is <strong>₹\${expectedAmount.toLocaleString('en-IN')}</strong>, but the screenshot amount is only <strong>₹\${detectedAmount.toLocaleString('en-IN')}</strong>!
        </p>
        <div class="p-2.5 bg-white rounded-xl border border-rose-200 flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500 font-bold uppercase">Screenshot:</span>
            <span class="font-mono font-black text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-xs">₹\${detectedAmount.toLocaleString('en-IN')}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-500 font-bold uppercase">Required:</span>
            <span class="font-mono font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-xs">₹\${expectedAmount.toLocaleString('en-IN')}</span>
          </div>
          <div class="flex items-center gap-1 ml-auto">
            <label class="text-[10px] text-slate-500 font-bold">Edit:</label>
            <input type="number" id="\${prefix}-manual-amt-input" value="\${detectedAmount}" class="w-16 px-1.5 py-0.5 text-xs font-mono font-bold border border-slate-300 rounded bg-white text-slate-900">
            <button type="button" onclick="overrideReceiptAmount('\${mode}')" class="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded cursor-pointer">Verify</button>
          </div>
        </div>
        <p class="text-[10px] text-rose-700 font-medium">⚠️ Screenshot amount does not match order amount. Please upload matching receipt or correct payment.</p>
      \`;
      validationStatus.classList.remove('hidden');
    }

    if (metaBadge) {
      metaBadge.className = 'px-2.5 py-1 rounded-full bg-rose-500/25 text-rose-300 font-bold border border-rose-400/50 flex items-center gap-1';
      metaBadge.innerHTML = \`<span class="material-symbols-outlined text-[13px]">cancel</span> Amount Mismatch: Receipt ₹\${detectedAmount} ≠ Order ₹\${expectedAmount}\`;
    }

    if (submitBtn) {
      submitBtn.classList.remove('bg-brand-wa', 'hover:bg-brand-waDark');
      submitBtn.classList.add('bg-rose-600', 'hover:bg-rose-700');
    }
    if (submitLabel) {
      submitLabel.innerText = \`⚠️ Amount Mismatch (Paid ₹\${detectedAmount} ≠ ₹\${expectedAmount})\`;
    }

    showToast('Amount Mismatch Alert', \`Customer ordered amount is ₹\${expectedAmount}, but receipt is ₹\${detectedAmount}!\`, 'error', 'rose');
    if (typeof playChime === 'function') playChime('error');
  } else {
    // ✅ AMOUNTS MATCH PERFECTLY
    if (validationStatus) {
      validationStatus.className = 'mt-2 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between';
      validationStatus.innerHTML = \`
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[18px] text-emerald-600">verified</span>
          <span>Payment Amount Verified: <strong>₹\${expectedAmount.toLocaleString('en-IN')}</strong> Matches Order Total!</span>
        </div>
        <span class="text-[9px] bg-emerald-200/90 text-emerald-950 font-mono font-black px-1.5 py-0.5 rounded">100% MATCH</span>
      \`;
      validationStatus.classList.remove('hidden');
    }

    if (metaBadge) {
      metaBadge.className = 'px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-400/30 flex items-center gap-1';
      metaBadge.innerHTML = \`<span class="material-symbols-outlined text-[13px]">verified_user</span> Payment Proof Verified (₹\${expectedAmount}) ✅\`;
    }

    if (submitBtn) {
      submitBtn.classList.add('bg-brand-wa', 'hover:bg-brand-waDark');
      submitBtn.classList.remove('bg-rose-600', 'hover:bg-rose-700');
    }
    if (submitLabel) {
      submitLabel.innerText = isOnline ? \`Confirm Order & Save (Paid ₹\${expectedAmount.toLocaleString('en-IN')})\` : \`Confirm Order & Save (Paid ₹200 Adv)\`;
    }

    showToast('Receipt Attached', 'Payment screenshot & amount verified successfully.', 'verified', 'emerald');
  }`;

if (normApp.includes(targetSetPreview)) {
  normApp = normApp.replace(targetSetPreview, replacementSetPreview);
  console.log("Updated setScreenshotPreview with mismatch banner and badge");
}

// 2.4 Add overrideReceiptAmount and update removeScreenshot
const overrideFunc = `
function overrideReceiptAmount(mode) {
  const isOnline = mode === 'ONLINE';
  const prefix = isOnline ? 'online' : 'cod';
  const input = document.getElementById(\`\${prefix}-manual-amt-input\`);
  if (!input) return;

  const newAmt = parseFloat(input.value || '0');
  const expectedAmt = ORDER_MODAL_STATE.expectedAmount || (isOnline ? (ORDER_MODAL_STATE.items || []).reduce((sum, it) => sum + (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1), 0) || 599 : 200);

  const isMismatch = Math.abs(newAmt - expectedAmt) > 0.01;
  const currentScreenshot = isOnline ? ORDER_MODAL_STATE.onlineScreenshot : ORDER_MODAL_STATE.codScreenshot;
  const currentName = isOnline ? ORDER_MODAL_STATE.onlineScreenshotName : ORDER_MODAL_STATE.codScreenshotName;

  setScreenshotPreview(mode, currentScreenshot, currentName, {
    isValid: true,
    detectedAmount: newAmt,
    expectedAmount: expectedAmt,
    isMismatch: isMismatch,
    shortage: isMismatch ? Math.abs(expectedAmt - newAmt) : 0
  });
}
window.overrideReceiptAmount = overrideReceiptAmount;
`;

if (!normApp.includes('function overrideReceiptAmount')) {
  normApp = overrideFunc + '\n' + normApp;
}

// Update removeScreenshot to restore submit button
const targetRemoveScreenshot = `  if (emptyBox) emptyBox.classList.remove('hidden');
  if (previewBox) previewBox.classList.add('hidden');
  if (fileInput) fileInput.value = '';
  if (detailPreview) detailPreview.classList.add('hidden');
  if (validationStatus) validationStatus.classList.add('hidden');`;

const replacementRemoveScreenshot = `  if (emptyBox) emptyBox.classList.remove('hidden');
  if (previewBox) previewBox.classList.add('hidden');
  if (fileInput) fileInput.value = '';
  if (detailPreview) detailPreview.classList.add('hidden');
  if (validationStatus) validationStatus.classList.add('hidden');

  ORDER_MODAL_STATE.amountMismatch = false;
  ORDER_MODAL_STATE.detectedAmount = null;

  const submitBtn = document.getElementById('order-submit-button');
  const submitLabel = document.getElementById('order-submit-btn-label');
  if (submitBtn) {
    submitBtn.classList.add('bg-brand-wa', 'hover:bg-brand-waDark');
    submitBtn.classList.remove('bg-rose-600', 'hover:bg-rose-700');
  }
  if (submitLabel) {
    let amt = 0;
    (ORDER_MODAL_STATE.items || []).forEach(it => amt += (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1));
    submitLabel.innerText = isOnline ? \`Confirm Order & Save (Paid ₹\${amt.toLocaleString('en-IN')})\` : 'Confirm Order & Save (Paid ₹200 Adv)';
  }`;

if (normApp.includes(targetRemoveScreenshot)) {
  normApp = normApp.replace(targetRemoveScreenshot, replacementRemoveScreenshot);
  console.log("Updated removeScreenshot with submit button reset");
}

// Guard in handleCreateOrder for amountMismatch
const targetHandleCreateOrderGuard = `    // Strict Screenshot Validation
    if (!screenshot) {
      showToast('Payment Screenshot Required', 'Please upload or attach a verified payment screenshot before confirming the order.', 'warning', 'rose');
      return;
    }`;

const replacementHandleCreateOrderGuard = `    // Strict Screenshot Validation
    if (!screenshot) {
      showToast('Payment Screenshot Required', 'Please upload or attach a verified payment screenshot before confirming the order.', 'warning', 'rose');
      return;
    }

    // Check Amount Matching Guard
    if (ORDER_MODAL_STATE.amountMismatch) {
      showToast('Payment Amount Mismatch', \`Cannot confirm order: Receipt amount (₹\${ORDER_MODAL_STATE.detectedAmount}) does not match order total (₹\${ORDER_MODAL_STATE.expectedAmount})!\`, 'error', 'rose');
      if (typeof playChime === 'function') playChime('error');
      const valStatus = document.getElementById('online-screenshot-validation-status');
      if (valStatus) valStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }`;

if (normApp.includes(targetHandleCreateOrderGuard)) {
  normApp = normApp.replace(targetHandleCreateOrderGuard, replacementHandleCreateOrderGuard);
  console.log("Added amount mismatch guard to handleCreateOrder");
}

// 2.5 Add Edit Button in renderOrdersHistoryTable Actions Column
const targetActionsColumn = `        <!-- 7. Actions -->
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <!-- View Invoice -->
            <button type="button" onclick="openOrderInvoiceModal('\${ord.id}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-300" title="View Tax Invoice &amp; Packing Slip">
              <span class="material-symbols-outlined text-[14px]">receipt_long</span>
              <span class="text-[11px]">Invoice</span>
            </button>`;

const replacementActionsColumn = `        <!-- 7. Actions -->
        <td class="py-3.5 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <!-- Edit Order (Image 2 Request) -->
            <button type="button" onclick="openEditOrderModal('\${ord.id}')" class="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-800 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-blue-300" title="Edit Order Details">
              <span class="material-symbols-outlined text-[14px]">edit</span>
              <span class="text-[11px]">Edit</span>
            </button>

            <!-- View Invoice -->
            <button type="button" onclick="openOrderInvoiceModal('\${ord.id}')" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer border border-slate-300" title="View Tax Invoice &amp; Packing Slip">
              <span class="material-symbols-outlined text-[14px]">receipt_long</span>
              <span class="text-[11px]">Invoice</span>
            </button>`;

if (normApp.includes(targetActionsColumn)) {
  normApp = normApp.replace(targetActionsColumn, replacementActionsColumn);
  console.log("Added Edit button in renderOrdersHistoryTable actions column");
}

// 2.6 Add Edit Order Modal Controller Functions
const editOrderModalJs = `
// =========================================================================
// EDIT ORDER MODAL CONTROLLERS & LOGIC (Image 2)
// =========================================================================
let CURRENT_EDIT_ORDER = null;
let EDIT_ORDER_ITEMS = [];

function openEditOrderModal(orderId) {
  const ord = (CRM_STATE?.orders || []).find(o => o.id === orderId);
  if (!ord) {
    showToast('Order Not Found', \`Cannot find order #\${orderId}\`, 'error', 'rose');
    return;
  }

  CURRENT_EDIT_ORDER = ord;
  EDIT_ORDER_ITEMS = JSON.parse(JSON.stringify(ord.items || []));

  // Set header details
  const titleId = document.getElementById('edit-order-modal-id-title');
  const statusBadge = document.getElementById('edit-order-modal-status-badge');
  if (titleId) titleId.innerText = '#' + ord.id;
  if (statusBadge) {
    statusBadge.innerText = ord.orderStatus || ord.order_status || 'PLACED';
  }

  // Populate Customer & Staff
  const nameInput = document.getElementById('edit-order-cust-name');
  const phoneInput = document.getElementById('edit-order-cust-phone');
  const addrInput = document.getElementById('edit-order-shipping-address');
  const staffSelect = document.getElementById('edit-order-staff-select');

  if (nameInput) nameInput.value = ord.customerName || '';
  if (phoneInput) phoneInput.value = ord.customerPhone || '';
  if (addrInput) addrInput.value = ord.shippingAddress || '';

  if (staffSelect) {
    const staffList = [...(CRM_STATE?.staffList || [])];
    if (!staffList.some(s => s.id === 'admin')) {
      staffList.push({ id: 'admin', name: 'Super Admin', role: 'Admin Manager' });
    }
    const currentStaffId = ord.staffId || ord.staff_id || 'admin';
    staffSelect.innerHTML = staffList.map(s => \`
      <option value="\${s.id}" \${s.id === currentStaffId ? 'selected' : ''}>
        \${s.name} (\${s.role || s.specialization || 'Sales Specialist'})
      </option>
    \`).join('');
  }

  // Populate Payment Fields
  const methodSelect = document.getElementById('edit-order-payment-method');
  const pStatusSelect = document.getElementById('edit-order-payment-status');
  const upiInput = document.getElementById('edit-order-upi-id');
  const codAdvInput = document.getElementById('edit-order-cod-advance');
  const codBalInput = document.getElementById('edit-order-cod-balance');

  const pMethod = ord.paymentMethod || ord.payment_method || 'ONLINE_UPI';
  if (methodSelect) methodSelect.value = pMethod.includes('COD') ? 'COD' : 'ONLINE_UPI';
  if (pStatusSelect) pStatusSelect.value = ord.paymentStatus || ord.payment_status || 'PAID';
  if (upiInput) upiInput.value = ord.upiTransactionId || ord.upi_transaction_id || '';
  if (codAdvInput) codAdvInput.value = ord.codAdvance || ord.cod_advance || 0;
  if (codBalInput) codBalInput.value = ord.codBalanceDue || ord.cod_balance_due || 0;

  onEditOrderPaymentMethodChange();

  // Populate Fulfillment & Tracking
  const statusSelect = document.getElementById('edit-order-status');
  const courierInput = document.getElementById('edit-order-courier-name');
  const trackingInput = document.getElementById('edit-order-tracking-number');
  const urlInput = document.getElementById('edit-order-shipping-url');

  if (statusSelect) statusSelect.value = ord.orderStatus || ord.order_status || 'PLACED';
  if (courierInput) courierInput.value = ord.courierName || ord.courier_name || '';
  if (trackingInput) trackingInput.value = ord.trackingNumber || ord.tracking_number || '';
  if (urlInput) urlInput.value = ord.shippingUrl || ord.shipping_url || '';

  // Populate product catalog dropdown in case staff adds products
  const prodSelect = document.getElementById('edit-order-product-select');
  if (prodSelect && CRM_STATE?.products) {
    prodSelect.innerHTML = CRM_STATE.products.map(p => \`
      <option value="\${p.sku}">\${p.name} - ₹\${parseFloat(p.price).toLocaleString('en-IN')} (\${p.size || 'Free Size'})\`
    ).join('');
  }

  // Render items
  renderEditOrderItemsList();

  openModal('modal-edit-order');
}
window.openEditOrderModal = openEditOrderModal;

function renderEditOrderItemsList() {
  const container = document.getElementById('edit-order-items-list');
  const grandTotalEl = document.getElementById('edit-order-grand-total');
  const countEl = document.getElementById('edit-order-items-count');
  if (!container) return;

  if (EDIT_ORDER_ITEMS.length === 0) {
    container.innerHTML = \`<div class="p-4 text-center text-slate-400">No items in order. Click "Add Product" above to add items.</div>\`;
    if (grandTotalEl) grandTotalEl.innerText = '₹0';
    if (countEl) countEl.innerText = '0 items';
    return;
  }

  let total = 0;
  let count = 0;

  container.innerHTML = EDIT_ORDER_ITEMS.map((item, idx) => {
    const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.qty) || 1);
    total += itemTotal;
    count += (parseInt(item.qty) || 1);

    return \`
      <div class="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200 flex items-center justify-center">
            \${item.image ? \`<img src="\${item.image}" alt="\${item.name}" class="w-full h-full object-cover">\` : \`<span class="material-symbols-outlined text-[18px] text-slate-400">apparel</span>\`}
          </div>
          <div class="min-w-0">
            <h5 class="font-bold text-slate-900 text-xs truncate">\${item.name || item.sku}</h5>
            <p class="text-[10px] text-slate-500 font-mono">\${item.sku} • ₹\${(parseFloat(item.price) || 0).toLocaleString('en-IN')} / pc • <span class="font-semibold text-indigo-700">\${item.size || 'Free Size'}</span></p>
          </div>
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <div class="flex items-center border border-slate-200 rounded-lg bg-slate-50 overflow-hidden">
            <button type="button" onclick="changeEditOrderItemQty(\${idx}, -1)" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold cursor-pointer">-</button>
            <span class="w-8 text-center text-xs font-bold text-slate-800 font-mono">\${item.qty}</span>
            <button type="button" onclick="changeEditOrderItemQty(\${idx}, 1)" class="w-7 h-7 flex items-center justify-center text-slate-600 hover:bg-slate-200 font-bold cursor-pointer">+</button>
          </div>
          <span class="font-mono font-bold text-xs text-slate-900 w-16 text-right">₹\${itemTotal.toLocaleString('en-IN')}</span>
          <button type="button" onclick="deleteEditOrderItem(\${idx})" class="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 cursor-pointer" title="Remove item">
            <span class="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    \`;
  }).join('');

  if (grandTotalEl) grandTotalEl.innerText = \`₹\${total.toLocaleString('en-IN')}\`;
  if (countEl) countEl.innerText = \`\${count} items\`;

  // Auto-update COD balance if in COD mode
  const methodSelect = document.getElementById('edit-order-payment-method');
  if (methodSelect && methodSelect.value === 'COD') {
    const advInput = document.getElementById('edit-order-cod-advance');
    const balInput = document.getElementById('edit-order-cod-balance');
    const adv = parseFloat(advInput?.value || 200) || 200;
    if (balInput) balInput.value = Math.max(0, total - adv);
  }
}
window.renderEditOrderItemsList = renderEditOrderItemsList;

function changeEditOrderItemQty(idx, delta) {
  if (!EDIT_ORDER_ITEMS[idx]) return;
  const newQty = (parseInt(EDIT_ORDER_ITEMS[idx].qty) || 1) + delta;
  if (newQty <= 0) {
    deleteEditOrderItem(idx);
    return;
  }
  EDIT_ORDER_ITEMS[idx].qty = newQty;
  renderEditOrderItemsList();
}
window.changeEditOrderItemQty = changeEditOrderItemQty;

function deleteEditOrderItem(idx) {
  if (EDIT_ORDER_ITEMS.length <= 1) {
    showToast('Cannot Remove', 'An order must contain at least one item.', 'warning', 'amber');
    return;
  }
  EDIT_ORDER_ITEMS.splice(idx, 1);
  renderEditOrderItemsList();
}
window.deleteEditOrderItem = deleteEditOrderItem;

function toggleEditOrderCatalogPicker() {
  const row = document.getElementById('edit-order-catalog-row');
  if (row) row.classList.toggle('hidden');
}
window.toggleEditOrderCatalogPicker = toggleEditOrderCatalogPicker;

function addSelectedProductToEditOrder() {
  const select = document.getElementById('edit-order-product-select');
  if (!select) return;
  const sku = select.value;
  const product = (CRM_STATE?.products || []).find(p => p.sku === sku);
  if (!product) return;

  const existing = EDIT_ORDER_ITEMS.find(i => i.sku === sku);
  if (existing) {
    existing.qty = (parseInt(existing.qty) || 1) + 1;
  } else {
    EDIT_ORDER_ITEMS.push({
      sku: product.sku,
      name: product.name,
      price: parseFloat(product.price) || 599,
      qty: 1,
      size: product.size || 'Free Size',
      image: product.image || null
    });
  }

  renderEditOrderItemsList();
  showToast('Item Added', \`\${product.name} added to order!\`, 'check_circle', 'blue');
}
window.addSelectedProductToEditOrder = addSelectedProductToEditOrder;

function onEditOrderPaymentMethodChange() {
  const methodSelect = document.getElementById('edit-order-payment-method');
  const codFields = document.getElementById('edit-order-cod-fields');
  const pStatusSelect = document.getElementById('edit-order-payment-status');
  if (!methodSelect) return;

  const isCOD = methodSelect.value === 'COD';
  if (codFields) {
    if (isCOD) {
      codFields.classList.remove('hidden');
    } else {
      codFields.classList.add('hidden');
    }
  }

  if (pStatusSelect) {
    pStatusSelect.value = isCOD ? 'PARTIAL_PAID (₹200 ADVANCE)' : 'PAID';
  }
}
window.onEditOrderPaymentMethodChange = onEditOrderPaymentMethodChange;

function saveEditedOrder() {
  if (!CURRENT_EDIT_ORDER) return;

  if (EDIT_ORDER_ITEMS.length === 0) {
    showToast('No Items', 'Order must have at least one product item.', 'warning', 'amber');
    return;
  }

  const custName = (document.getElementById('edit-order-cust-name')?.value || '').trim();
  const custPhone = (document.getElementById('edit-order-cust-phone')?.value || '').trim();
  const address = (document.getElementById('edit-order-shipping-address')?.value || '').trim();
  const staffSelect = document.getElementById('edit-order-staff-select');
  const statusSelect = document.getElementById('edit-order-status');
  const methodSelect = document.getElementById('edit-order-payment-method');
  const pStatusSelect = document.getElementById('edit-order-payment-status');
  const upiInput = document.getElementById('edit-order-upi-id');
  const courierInput = document.getElementById('edit-order-courier-name');
  const trackingInput = document.getElementById('edit-order-tracking-number');
  const urlInput = document.getElementById('edit-order-shipping-url');
  const codAdvInput = document.getElementById('edit-order-cod-advance');
  const codBalInput = document.getElementById('edit-order-cod-balance');

  if (!custName) {
    showToast('Name Required', 'Please enter customer name.', 'warning', 'amber');
    document.getElementById('edit-order-cust-name')?.focus();
    return;
  }

  let grandTotal = 0;
  EDIT_ORDER_ITEMS.forEach(it => {
    grandTotal += (parseFloat(it.price) || 0) * (parseInt(it.qty) || 1);
  });

  const staffId = staffSelect ? staffSelect.value : (CURRENT_EDIT_ORDER.staffId || 'admin');
  const staffObj = (CRM_STATE?.staffList || []).find(s => s.id === staffId);
  const staffName = staffObj ? staffObj.name : (CURRENT_USER?.name || 'Super Admin');

  const oldStatus = CURRENT_EDIT_ORDER.orderStatus || CURRENT_EDIT_ORDER.order_status;
  const newStatus = statusSelect ? statusSelect.value : oldStatus;

  // Update object
  CURRENT_EDIT_ORDER.customerName = custName;
  CURRENT_EDIT_ORDER.customer_name = custName;
  CURRENT_EDIT_ORDER.customerPhone = custPhone;
  CURRENT_EDIT_ORDER.customer_phone = custPhone;
  CURRENT_EDIT_ORDER.shippingAddress = address;
  CURRENT_EDIT_ORDER.shipping_address = address;
  CURRENT_EDIT_ORDER.staffId = staffId;
  CURRENT_EDIT_ORDER.staff_id = staffId;
  CURRENT_EDIT_ORDER.staffName = staffName;
  CURRENT_EDIT_ORDER.staff_name = staffName;
  CURRENT_EDIT_ORDER.items = JSON.parse(JSON.stringify(EDIT_ORDER_ITEMS));
  CURRENT_EDIT_ORDER.grandTotal = grandTotal;
  CURRENT_EDIT_ORDER.grand_total = grandTotal;
  CURRENT_EDIT_ORDER.orderStatus = newStatus;
  CURRENT_EDIT_ORDER.order_status = newStatus;
  CURRENT_EDIT_ORDER.paymentMethod = methodSelect ? methodSelect.value : CURRENT_EDIT_ORDER.paymentMethod;
  CURRENT_EDIT_ORDER.payment_method = CURRENT_EDIT_ORDER.paymentMethod;
  CURRENT_EDIT_ORDER.paymentStatus = pStatusSelect ? pStatusSelect.value : CURRENT_EDIT_ORDER.paymentStatus;
  CURRENT_EDIT_ORDER.payment_status = CURRENT_EDIT_ORDER.paymentStatus;
  CURRENT_EDIT_ORDER.upiTransactionId = (upiInput?.value || '').trim();
  CURRENT_EDIT_ORDER.upi_transaction_id = CURRENT_EDIT_ORDER.upiTransactionId;
  CURRENT_EDIT_ORDER.courierName = (courierInput?.value || '').trim();
  CURRENT_EDIT_ORDER.courier_name = CURRENT_EDIT_ORDER.courierName;
  CURRENT_EDIT_ORDER.trackingNumber = (trackingInput?.value || '').trim();
  CURRENT_EDIT_ORDER.tracking_number = CURRENT_EDIT_ORDER.trackingNumber;
  CURRENT_EDIT_ORDER.shippingUrl = (urlInput?.value || '').trim();
  CURRENT_EDIT_ORDER.shipping_url = CURRENT_EDIT_ORDER.shippingUrl;

  if (CURRENT_EDIT_ORDER.paymentMethod === 'COD') {
    CURRENT_EDIT_ORDER.codAdvance = parseFloat(codAdvInput?.value || 200) || 200;
    CURRENT_EDIT_ORDER.cod_advance = CURRENT_EDIT_ORDER.codAdvance;
    CURRENT_EDIT_ORDER.codBalanceDue = parseFloat(codBalInput?.value || Math.max(0, grandTotal - CURRENT_EDIT_ORDER.codAdvance)) || 0;
    CURRENT_EDIT_ORDER.cod_balance_due = CURRENT_EDIT_ORDER.codBalanceDue;
  } else {
    CURRENT_EDIT_ORDER.codAdvance = 0;
    CURRENT_EDIT_ORDER.cod_advance = 0;
    CURRENT_EDIT_ORDER.codBalanceDue = 0;
    CURRENT_EDIT_ORDER.cod_balance_due = 0;
  }

  // Persist to MySQL
  fetch('api.php?action=save_order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: CURRENT_EDIT_ORDER.id,
      order_id: CURRENT_EDIT_ORDER.id,
      customerId: CURRENT_EDIT_ORDER.customerId,
      customer_id: CURRENT_EDIT_ORDER.customerId,
      customerName: CURRENT_EDIT_ORDER.customerName,
      customerPhone: CURRENT_EDIT_ORDER.customerPhone,
      shippingAddress: CURRENT_EDIT_ORDER.shippingAddress,
      items: CURRENT_EDIT_ORDER.items,
      grandTotal: CURRENT_EDIT_ORDER.grandTotal,
      paymentMethod: CURRENT_EDIT_ORDER.paymentMethod,
      paymentStatus: CURRENT_EDIT_ORDER.paymentStatus,
      upiTransactionId: CURRENT_EDIT_ORDER.upiTransactionId,
      orderStatus: CURRENT_EDIT_ORDER.orderStatus,
      courierName: CURRENT_EDIT_ORDER.courierName,
      trackingNumber: CURRENT_EDIT_ORDER.trackingNumber,
      shippingUrl: CURRENT_EDIT_ORDER.shippingUrl,
      staffId: CURRENT_EDIT_ORDER.staffId,
      staffName: CURRENT_EDIT_ORDER.staffName,
      codAdvance: CURRENT_EDIT_ORDER.codAdvance,
      codBalanceDue: CURRENT_EDIT_ORDER.codBalanceDue,
      isEditUpdate: true
    })
  }).catch(() => {});

  logAudit('ORDER_EDITED', 'ORDERS', \`Updated details for Order #\${CURRENT_EDIT_ORDER.id} (Status: \${newStatus}, Total: ₹\${grandTotal})\`);
  saveCRMState();

  closeModal('modal-edit-order');
  renderOrdersDashboard();
  renderOrdersHistoryTable();

  showToast('Order Updated', \`Order #\${CURRENT_EDIT_ORDER.id} successfully updated!\`, 'check_circle', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}
window.saveEditedOrder = saveEditedOrder;
`;

if (!normApp.includes('function openEditOrderModal')) {
  normApp += editOrderModalJs;
}

// Convert back to CRLF and write files
const isCrlf = appJs.includes('\r\n');
const finalAppJs = isCrlf ? normApp.replace(/\n/g, '\r\n') : normApp;
fs.writeFileSync(appPath, finalAppJs, 'utf8');

const assetPath = path.resolve('d:/grm-workspace/CRM/crm-app/assets/js/crm_app.js');
fs.writeFileSync(assetPath, finalAppJs, 'utf8');
console.log("Successfully updated crm_app.js and assets/js/crm_app.js!");

// =========================================================================
// 3. UPDATE api.php: Ensure isEditUpdate skips customer metric increments
// =========================================================================
const apiPath = path.resolve('d:/grm-workspace/CRM/crm-app/api.php');
let apiPhp = fs.readFileSync(apiPath, 'utf8');

const targetMetricUpdate = `        // Update Customer metrics
        if ($customerId) {
            $pdo->prepare("
                UPDATE \`customers\` 
                SET \`total_orders\` = \`total_orders\` + 1, \`total_spend\` = \`total_spend\` + ? 
                WHERE \`id\` = ?
            ")->execute([$grandTotal, $customerId]);
        }`;

const replacementMetricUpdate = `        // Update Customer metrics only for NEW orders (not edits)
        $isEdit = !empty($order['isEditUpdate']);
        if ($customerId && !$isEdit) {
            $pdo->prepare("
                UPDATE \`customers\` 
                SET \`total_orders\` = \`total_orders\` + 1, \`total_spend\` = \`total_spend\` + ? 
                WHERE \`id\` = ?
            ")->execute([$grandTotal, $customerId]);
        }`;

if (apiPhp.includes(targetMetricUpdate)) {
  apiPhp = apiPhp.replace(targetMetricUpdate, replacementMetricUpdate);
  fs.writeFileSync(apiPath, apiPhp, 'utf8');
  console.log("Updated api.php to prevent metric inflation on order edits");
}
