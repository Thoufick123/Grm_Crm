const fs = require('fs');
const php = fs.readFileSync('d:/crm whatsapp/crm-app/index.php', 'utf8');

const navStart = php.indexOf('<nav class="flex-1 overflow-y-auto custom-chat-scroll');
const navEnd = php.indexOf('</nav>', navStart) + 6;
const navContent = php.substring(navStart, navEnd);

console.log('PHP Nav length:', navContent.length);
console.log('First 200 chars:\n', navContent.substring(0, 200));
console.log('Last 200 chars:\n', navContent.substring(navContent.length - 200));

