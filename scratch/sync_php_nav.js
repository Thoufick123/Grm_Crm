const fs = require('fs');

const html = fs.readFileSync('d:/crm whatsapp/crm-app/index.html', 'utf8');
let php = fs.readFileSync('d:/crm whatsapp/crm-app/index.php', 'utf8');

const htmlNavStart = html.indexOf('<nav class="flex-1 overflow-y-auto custom-chat-scroll');
const htmlNavEnd = html.indexOf('</nav>', htmlNavStart) + 6;
const htmlNav = html.substring(htmlNavStart, htmlNavEnd);

const phpNavStart = php.indexOf('<nav class="flex-1 overflow-y-auto custom-chat-scroll');
const phpNavEnd = php.indexOf('</nav>', phpNavStart) + 6;

php = php.substring(0, phpNavStart) + htmlNav + php.substring(phpNavEnd);

fs.writeFileSync('d:/crm whatsapp/crm-app/index.php', php, 'utf8');
console.log('index.php nav replaced with index.html nav successfully');

