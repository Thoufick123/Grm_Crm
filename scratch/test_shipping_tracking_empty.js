const assert = require('assert');
const fs = require('fs');

console.log('--- Testing Shipping Tracking Number Empty Behavior ---');

const indexHtml = fs.readFileSync('d:/grm-workspace/CRM/crm-app/index.html', 'utf8');
const crmAppJs = fs.readFileSync('d:/grm-workspace/CRM/crm-app/crm_app.js', 'utf8');

// 1. Verify index.html does not have "⚡ Auto-Generate AWB" button
assert.strictEqual(indexHtml.includes('⚡ Auto-Generate AWB'), false, 'Auto-Generate AWB button must be removed from index.html');
console.log('✓ "⚡ Auto-Generate AWB" button removed from index.html');

// 2. Verify tracking input in index.html starts with value=""
assert(indexHtml.includes('id="ship-tracking-id"'), 'ship-tracking-id must exist in index.html');
console.log('✓ #ship-tracking-id input exists in index.html');

// 3. Test openShippingDispatchModal logic
// Extract relevant functions or simulate in isolated context
let elements = {
  'ship-modal-order-id': { innerText: '', focus: () => {} },
  'ship-modal-customer-name': { innerText: '', focus: () => {} },
  'ship-modal-customer-phone': { innerText: '', focus: () => {} },
  'ship-modal-items-total': { innerText: '', focus: () => {} },
  'ship-modal-address': { innerText: '', focus: () => {} },
  'ship-courier-name': { value: '', focus: () => {} },
  'ship-tracking-id': { value: '', focus: () => {} },
  'ship-tracking-url': { value: '', focus: () => {} },
  'ship-send-whatsapp': { checked: false, focus: () => {} },
  'ship-wa-preview-text': { innerText: '', focus: () => {} }
};

global.document = {
  getElementById: (id) => elements[id] || null
};
global.window = {};
global.openModal = () => {};
global.showToast = (title, msg) => { elements.lastToast = { title, msg }; };
global.CRM_STATE = {
  orders: [
    {
      id: 'WA-2026-001132',
      customerName: 'SugunaMani',
      customerPhone: '+91 73389 65560',
      shippingAddress: '118a sundhara moorthy st, chennai 83',
      grandTotal: 599,
      orderStatus: 'CONFIRMED',
      // No tracking number initially
    }
  ]
};

// Evaluate the functions from crm_app.js in this sandbox
eval(`
  let ACTIVE_SHIPPING_DISPATCH_ORDER = null;
  ${crmAppJs.slice(crmAppJs.indexOf('function openShippingDispatchModal('), crmAppJs.indexOf('window.openShippingDispatchModal = openShippingDispatchModal;'))}
  ${crmAppJs.slice(crmAppJs.indexOf('function setCourierQuickOption('), crmAppJs.indexOf('window.setCourierQuickOption = setCourierQuickOption;'))}
  ${crmAppJs.slice(crmAppJs.indexOf('function onShippingIdChange('), crmAppJs.indexOf('window.onShippingIdChange = onShippingIdChange;'))}
  ${crmAppJs.slice(crmAppJs.indexOf('function generateCourierTrackingURL('), crmAppJs.indexOf('window.generateCourierTrackingURL = generateCourierTrackingURL;'))}
  ${crmAppJs.slice(crmAppJs.indexOf('function updateShippingWhatsAppPreview('), crmAppJs.indexOf('window.updateShippingWhatsAppPreview = updateShippingWhatsAppPreview;'))}
  ${crmAppJs.slice(crmAppJs.indexOf('function confirmShippingDispatch('), crmAppJs.indexOf('window.confirmShippingDispatch = confirmShippingDispatch;'))}
`);

// Test 1: Open modal for order without tracking number
openShippingDispatchModal('WA-2026-001132');
assert.strictEqual(elements['ship-tracking-id'].value, '', 'Tracking input must be empty string upon opening modal');
assert.strictEqual(elements['ship-tracking-url'].value, '', 'Tracking URL must be empty when tracking number is empty');
console.log('✓ openShippingDispatchModal sets tracking input to EMPTY string and URL to empty');

// Test 2: Select a quick partner like "Professional Couriers"
setCourierQuickOption('Professional Couriers');
assert.strictEqual(elements['ship-courier-name'].value, 'Professional Couriers', 'Courier name should update');
assert.strictEqual(elements['ship-tracking-id'].value, '', 'Tracking input MUST remain empty after selecting courier partner');
assert.strictEqual(elements['ship-tracking-url'].value, '', 'Tracking URL must remain empty when tracking number is empty');
console.log('✓ setCourierQuickOption leaves tracking ID empty without auto-generating fake AWB');

// Test 3: Attempting to confirm dispatch without tracking number must be blocked
confirmShippingDispatch();
assert.strictEqual(elements.lastToast?.title, 'Shipping ID Required', 'Confirming without tracking ID must trigger warning toast');
console.log('✓ confirmShippingDispatch blocks confirmation when tracking number is empty');

// Test 4: Enter tracking number given by courier partner
elements['ship-tracking-id'].value = 'TPC80535427';
onShippingIdChange();
assert.strictEqual(elements['ship-tracking-url'].value, 'https://www.tpcindia.com/track.aspx?awb=TPC80535427', 'URL should auto-generate once user inputs tracking number');
assert(elements['ship-wa-preview-text'].innerText.includes('TPC80535427'), 'WhatsApp preview text must include the entered tracking number');
console.log('✓ onShippingIdChange auto-generates tracking URL once real tracking number is entered');

console.log('ALL TESTS PASSED SUCCESSFULLY!');
