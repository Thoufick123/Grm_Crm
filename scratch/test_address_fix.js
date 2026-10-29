const assert = require('assert');
const fs = require('fs');

const code = fs.readFileSync('crm_app.js', 'utf8');

console.log('--- Testing Address & Draft Fixes ---');

// 1. Verify default address in ingestInboundMessage is empty string
assert(code.includes("address: '',"), "ingestInboundMessage must set address to ''");
console.log('✓ Ingest default address is empty string');

// 2. Verify right panel typing guard in renderInbox
assert(code.includes('isTypingInRightPanel'), 'renderInbox must check isTypingInRightPanel');
console.log('✓ renderInbox contains typing guard for right panel');

// 3. Verify clean address logic in renderCustomer360Panel
assert(code.includes("const cleanSavedAddr = (customer.address && customer.address !== 'Online WhatsApp Customer') ? customer.address : '';"), 'cleanSavedAddr must filter out Online WhatsApp Customer');
console.log('✓ cleanSavedAddr correctly filters out Online WhatsApp Customer');

// 4. Verify focus restoration in renderCustomer360Panel
assert(code.includes('draft && draft.focusedId'), 'Focus restore must be present');
console.log('✓ Focus and selection restoration is present');

// 5. Verify order modal addresses
assert(code.includes("const primaryAddr = (customer.address && customer.address !== 'Online WhatsApp Customer') ? customer.address : '';"), 'primaryAddr must filter out Online WhatsApp Customer in order modal');
console.log('✓ Order modal primaryAddr handles legacy Online WhatsApp Customer');

console.log('All tests passed successfully!');
