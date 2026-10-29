const fs = require('fs');
const path = require('path');

// Test UPI Validation function
const crmCode = fs.readFileSync('crm_app.js', 'utf8');

// Extract validateUPIId function
const validateMatch = crmCode.match(/function validateUPIId\(value\) \{[\s\S]*?\n\}/);
if (!validateMatch) {
  console.error('FAIL: validateUPIId function not found in crm_app.js');
  process.exit(1);
}

eval(validateMatch[0]);

console.log('--- TEST 1: UPI ID Validation ---');
const invalidUserSample = '11111324355HHJYUITYK, LUK, LK, IGRFRETGRYTR';
const invalidResult = validateUPIId(invalidUserSample);
console.log('User invalid input:', invalidUserSample);
console.log('Result:', invalidResult);
if (invalidResult.valid === false) {
  console.log('PASS: Correctly rejected user gibberish with commas and spaces!');
} else {
  console.error('FAIL: Did not reject invalid string!');
  process.exit(1);
}

const validSampleUTR = '428910294821';
const validResult = validateUPIId(validSampleUTR);
console.log('\nValid 12-digit UTR:', validSampleUTR);
console.log('Result:', validResult);
if (validResult.valid === true && validResult.type === '12-Digit Numeric UTR') {
  console.log('PASS: Correctly accepted 12-digit UTR!');
} else {
  console.error('FAIL: Did not accept 12-digit UTR!');
  process.exit(1);
}

const validAppUTR = 'GPAY-428910294821';
const validAppResult = validateUPIId(validAppUTR);
console.log('\nValid App-Prefixed UTR:', validAppUTR);
console.log('Result:', validAppResult);
if (validAppResult.valid === true) {
  console.log('PASS: Correctly accepted app-prefixed UTR!');
} else {
  console.error('FAIL: Did not accept app-prefixed UTR!');
  process.exit(1);
}

console.log('\n--- TEST 2: Shipping Dispatch URL Generator ---');
const courierUrlMatch = crmCode.match(/function generateCourierTrackingURL\(courier, trackingId\) \{[\s\S]*?\n\}/);
eval(courierUrlMatch[0]);

const dtdcUrl = generateCourierTrackingURL('DTDC', 'D48291029');
console.log('DTDC URL:', dtdcUrl);
if (dtdcUrl.includes('dtdc.in') && dtdcUrl.includes('D48291029')) {
  console.log('PASS: DTDC URL generated correctly!');
} else {
  console.error('FAIL: DTDC URL mismatch!');
  process.exit(1);
}

const stcUrl = generateCourierTrackingURL('ST Courier', 'STC8291039');
console.log('ST Courier URL:', stcUrl);
if (stcUrl.includes('stcourier.com') && stcUrl.includes('STC8291039')) {
  console.log('PASS: ST Courier URL generated correctly!');
} else {
  console.error('FAIL: ST Courier URL mismatch!');
  process.exit(1);
}

console.log('\n--- TEST 3: Verification of HTML DOM Elements ---');
const htmlCode = fs.readFileSync('index.html', 'utf8');

const requiredElements = [
  'online-upi-id-feedback',
  'cod-upi-id-feedback',
  'online-screenshot-detail-preview',
  'online-screenshot-large-preview',
  'online-screenshot-validation-status',
  'cod-screenshot-detail-preview',
  'cod-screenshot-large-preview',
  'cod-screenshot-validation-status',
  'modal-order-shipping-dispatch',
  'ship-courier-name',
  'ship-tracking-id',
  'ship-tracking-url',
  'ship-send-whatsapp',
  'ship-wa-preview-text'
];

let allElementsPresent = true;
requiredElements.forEach(id => {
  if (htmlCode.includes(`id="${id}"`)) {
    console.log(`PASS: Found #${id}`);
  } else {
    console.error(`FAIL: Missing #${id} in index.html`);
    allElementsPresent = false;
  }
});

if (!allElementsPresent) {
  process.exit(1);
}

console.log('\nALL UNIT AND INTEGRATION CHECKS PASSED SUCCESSFULLY!');
