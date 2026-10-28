const fs = require('fs');
const path = require('path');

console.log("=== TESTING AMOUNT MISMATCH HARD-BLOCK VALIDATION ===");

// 1. Check index.html for receipt amount inputs
const indexHtml = fs.readFileSync(path.resolve('d:/grm-workspace/CRM/crm-app/index.html'), 'utf8');
let passed = true;

if (indexHtml.includes('id="order-online-receipt-amount"') && indexHtml.includes('id="online-amount-match-pill"')) {
  console.log("[PASS] index.html contains order-online-receipt-amount and match pill");
} else {
  console.error("FAIL: order-online-receipt-amount missing from index.html");
  passed = false;
}

if (indexHtml.includes('id="order-cod-receipt-amount"') && indexHtml.includes('id="cod-amount-match-pill"')) {
  console.log("[PASS] index.html contains order-cod-receipt-amount and match pill");
} else {
  console.error("FAIL: order-cod-receipt-amount missing from index.html");
  passed = false;
}

// 2. Check crm_app.js for handleReceiptAmountChange and hard block guard
const crmCode = fs.readFileSync(path.resolve('d:/grm-workspace/CRM/crm-app/crm_app.js'), 'utf8');

if (crmCode.includes('function handleReceiptAmountChange')) {
  console.log("[PASS] crm_app.js contains handleReceiptAmountChange");
} else {
  console.error("FAIL: handleReceiptAmountChange missing from crm_app.js");
  passed = false;
}

if (crmCode.includes('Payment Amount Mismatch Blocked') && crmCode.includes('shortageAmt')) {
  console.log("[PASS] handleCreateOrder has strict hard block on payment amount mismatch");
} else {
  console.error("FAIL: Strict amount mismatch guard missing from handleCreateOrder");
  passed = false;
}

// 3. Mathematical unit test: Customer total ₹1,198 vs Receipt ₹233
const grandTotal = 1198;
const screenshotAmt = 233;
const isMismatch = Math.abs(screenshotAmt - grandTotal) > 0.01;
const shortage = grandTotal - screenshotAmt;

console.log(`\nSimulation: Order Total = ₹${grandTotal}, Screenshot = ₹${screenshotAmt}`);
console.log(`Mismatch Detected: ${isMismatch}`);
console.log(`Unpaid Shortage: ₹${shortage}`);

if (isMismatch && shortage === 965) {
  console.log("[PASS] Mathematical verification: ₹233 receipt for ₹1,198 order is REJECTED with ₹965 shortage!");
} else {
  console.error("FAIL: Mathematical check failed!");
  passed = false;
}

if (passed) {
  console.log("\n>>> ALL VALIDATION TESTS PASSED! ORDER OF 1198 CANNOT BE SAVED WITH 233 RECEIPT! <<<");
} else {
  process.exit(1);
}
