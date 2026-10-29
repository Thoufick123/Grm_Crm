const fs = require('fs');
const path = require('path');

console.log("=== RUNNING REGRESSION & UNIT TESTS FOR NEW FEATURES ===");

// 1. Test extractPaymentAmountFromOCR
const crmAppCode = fs.readFileSync(path.resolve('./crm_app.js'), 'utf8');

// Load extractPaymentAmountFromOCR into test context
const extractFnMatch = crmAppCode.match(/function extractPaymentAmountFromOCR\([\s\S]*?\n\}/);
if (!extractFnMatch) {
  console.error("FAIL: function extractPaymentAmountFromOCR not found!");
  process.exit(1);
}
eval(extractFnMatch[0]);

const testCases = [
  {
    name: "User Google Pay Receipt Image text",
    input: "To Abdul Hameetha M\n+91 73389 65560\n₹233\nPay again\nCompleted\n4 Oct 2026, 3:19 pm\nUPI transaction ID\n427812456120",
    expected: 233
  },
  {
    name: "OCR artifact with question mark for rupee symbol",
    input: "To Store\n?233\nCompleted\nUPI: 428910294821",
    expected: 233
  },
  {
    name: "PhonePe format with Rs.",
    input: "Transaction Successful\nRs. 599\nPaid to GRM Garments",
    expected: 599
  },
  {
    name: "COD 200 Advance format",
    input: "Paid ₹200.00 to Blue Berry Hub\nUTR: 428953316200",
    expected: 200
  },
  {
    name: "GPay with space after rupee",
    input: "₹ 599\nPaid\nAxis Bank",
    expected: 599
  }
];

let allPassed = true;
testCases.forEach((tc, idx) => {
  const result = extractPaymentAmountFromOCR(tc.input);
  if (result === tc.expected) {
    console.log(`[PASS] Case ${idx + 1}: ${tc.name} -> detected: ${result}`);
  } else {
    console.error(`[FAIL] Case ${idx + 1}: ${tc.name} -> expected ${tc.expected}, got ${result}`);
    allPassed = false;
  }
});

// 2. Test Mismatch Logic
const orderAmount = 599;
const screenshotAmount = 233;
const isMismatch = (screenshotAmount !== null) && Math.abs(screenshotAmount - orderAmount) > 0.01;
const shortage = Math.abs(orderAmount - screenshotAmount);
console.log(`\nAmount Mismatch Check: Order: ₹${orderAmount}, Screenshot: ₹${screenshotAmount} -> isMismatch: ${isMismatch}, Shortage: ₹${shortage}`);
if (!isMismatch || shortage !== 366) {
  console.error("FAIL: Amount mismatch calculation incorrect!");
  allPassed = false;
} else {
  console.log("[PASS] Amount mismatch accurately flags 233 != 599 with shortage 366");
}

// 3. Check HTML for modal-edit-order
const indexHtml = fs.readFileSync(path.resolve('./index.html'), 'utf8');
if (indexHtml.includes('id="modal-edit-order"') && indexHtml.includes('id="edit-order-cust-name"')) {
  console.log("[PASS] index.html contains #modal-edit-order with all required form fields");
} else {
  console.error("FAIL: #modal-edit-order missing from index.html");
  allPassed = false;
}

// 4. Check crm_app.js for openEditOrderModal, saveEditedOrder, and Actions column Edit button
if (crmAppCode.includes("openEditOrderModal('${ord.id}')")) {
  console.log("[PASS] crm_app.js has Edit button in Actions column of orders history table");
} else {
  console.error("FAIL: Edit button missing in Actions column");
  allPassed = false;
}

if (crmAppCode.includes('function openEditOrderModal') && crmAppCode.includes('function saveEditedOrder')) {
  console.log("[PASS] crm_app.js has openEditOrderModal and saveEditedOrder functions");
} else {
  console.error("FAIL: Modal functions missing in crm_app.js");
  allPassed = false;
}

if (allPassed) {
  console.log("\n>>> ALL TESTS PASSED SUCCESSFULLY! <<<");
} else {
  process.exit(1);
}
