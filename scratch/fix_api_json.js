const fs = require('fs');
let code = fs.readFileSync('d:/crm whatsapp/crm-app/api.php', 'utf8');

// Replace in json_encode response:
code = code.replace(
  /"attributes" => \$attributes,([\r\n\s]+)"dnd_records" => \$dndRecords,/,
  '"attributes" => $attributes,$1"rolePermissions" => $rolePermissions,$1"dnd_records" => $dndRecords,'
);

code = code.replace(
  /"attributes" => \$attributes,([\r\n\s]+)"dndRecords" => \$dndRecords,/,
  '"attributes" => $attributes,$1"rolePermissions" => $rolePermissions,$1"dndRecords" => $dndRecords,'
);

fs.writeFileSync('d:/crm whatsapp/crm-app/api.php', code, 'utf8');
console.log('Fixed json_encode in api.php');

