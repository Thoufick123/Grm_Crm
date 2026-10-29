const fs = require('fs');
let apiContent = fs.readFileSync('d:/crm whatsapp/crm-app/api.php', 'utf8');

// Check where attributes query is in api.php
const attrIdx = apiContent.indexOf('$attrStmt = $pdo->query("SELECT * FROM `attributes`');
console.log('Found attributes query at index:', attrIdx);

