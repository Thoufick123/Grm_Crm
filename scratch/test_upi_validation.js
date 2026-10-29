const fs = require('fs');
const path = require('path');

console.log("=== RUNNING STRICT UPI VALIDATION TESTS ===");

const crmCode = fs.readFileSync(path.resolve('d:/grm-workspace/CRM/crm-app/crm_app.js'), 'utf8');

// Extract validateUPIId
const match = crmCode.match(/function validateUPIId\(value\) \{[\s\S]*?\n\}/);
if (!match) {
  console.error("FAIL: validateUPIId not found in crm_app.js");
  process.exit(1);
}
eval(match[0]);

const cases = [
  {
    val: "123444TTRGTGHYTRYR4T324R2131231323143244443342545T566Y45",
    shouldBeValid: false,
    label: "User screenshot gibberish string"
  },
  {
    val: "427812456120",
    shouldBeValid: true,
    label: "Valid 12-digit Google Pay UTR"
  },
  {
    val: "428993213611",
    shouldBeValid: true,
    label: "Valid 12-digit PhonePe UTR"
  },
  {
    val: "GPAY-427812456120",
    shouldBeValid: true,
    label: "Valid App-prefixed UTR"
  },
  {
    val: "PHONEPE-428993213611",
    shouldBeValid: true,
    label: "Valid PhonePe prefixed UTR"
  },
  {
    val: "CICAgL2Evo3TYQ",
    shouldBeValid: true,
    label: "Valid GPay transaction ID"
  },
  {
    val: "12345678",
    shouldBeValid: false,
    label: "Incomplete 8 digits"
  },
  {
    val: "123456789012345",
    shouldBeValid: false,
    label: "Too many digits (15 digits)"
  },
  {
    val: "428910294821,123",
    shouldBeValid: false,
    label: "String with comma"
  },
  {
    val: "4289 1029 4821",
    shouldBeValid: false,
    label: "String with spaces"
  }
];

let allPassed = true;
cases.forEach((tc, idx) => {
  const res = validateUPIId(tc.val);
  if (res.valid === tc.shouldBeValid) {
    console.log(`[PASS] Case ${idx + 1}: "${tc.label}" -> valid: ${res.valid} (${res.type || res.reason})`);
  } else {
    console.error(`[FAIL] Case ${idx + 1}: "${tc.label}" -> expected valid=${tc.shouldBeValid}, got ${res.valid} (${res.reason})`);
    allPassed = false;
  }
});

// Check index.html for maxlength
const indexHtml = fs.readFileSync(path.resolve('d:/grm-workspace/CRM/crm-app/index.html'), 'utf8');
if (indexHtml.includes('id="order-online-upi-id"') && indexHtml.includes('maxlength="22"')) {
  console.log("[PASS] order-online-upi-id has maxlength='22' in index.html");
} else {
  console.error("FAIL: maxlength='22' missing on order-online-upi-id");
  allPassed = false;
}

if (allPassed) {
  console.log("\n>>> ALL UPI VALIDATION TESTS PASSED! <<<");
} else {
  process.exit(1);
}
