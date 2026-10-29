const fs = require('fs');
const html = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');

const navStart = html.indexOf('<nav class="flex-1 overflow-y-auto custom-chat-scroll');
const navEnd = html.indexOf('</nav>', navStart) + 6;
const navContent = html.substring(navStart, navEnd);

console.log('Nav length:', navContent.length);
console.log('First 200 chars:\n', navContent.substring(0, 200));
console.log('Last 200 chars:\n', navContent.substring(navContent.length - 200));

