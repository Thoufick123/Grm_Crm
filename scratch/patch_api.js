const fs = require('fs');
let content = fs.readFileSync('d:/crm whatsapp/crm-app/api.php', 'utf8');

// 1. Add role_permissions extraction in attributes loop
const targetAttrLoop = `$subStmt = $pdo->query("SELECT * FROM \`subcategories\` ORDER BY \`name\` ASC");
            $subcategories = $subStmt->fetchAll();

            $attrStmt = $pdo->query("SELECT * FROM \`attributes\` ORDER BY \`id\` ASC");
            $rawAttrs = $attrStmt->fetchAll();`;

const replacementAttrLoop = `$subStmt = $pdo->query("SELECT * FROM \`subcategories\` ORDER BY \`name\` ASC");
            $subcategories = $subStmt->fetchAll();

            $rolePermissions = [];
            $attrStmt = $pdo->query("SELECT * FROM \`attributes\` ORDER BY \`id\` ASC");
            $rawAttrs = $attrStmt->fetchAll();`;

if (!content.includes(replacementAttrLoop)) {
  content = content.replace(targetAttrLoop, replacementAttrLoop);
}

const targetTypeCheck = `else if ($type === 'specification') {`;
const replacementTypeCheck = `else if ($type === 'role_permissions') {
                    $decoded = json_decode($ra['value'], true);
                    if ($decoded) {
                        $rolePermissions[$ra['name']] = $decoded;
                    }
                } else if ($type === 'specification') {`;

if (!content.includes("else if ($type === 'role_permissions') {")) {
  content = content.replace(targetTypeCheck, replacementTypeCheck);
}

// 2. Add rolePermissions to returned JSON
const targetJson1 = `"attributes" => $attributes,
            "dnd_records" => $dndRecords,`;
const replacementJson1 = `"attributes" => $attributes,
            "rolePermissions" => $rolePermissions,
            "dnd_records" => $dndRecords,`;

if (!content.includes('"rolePermissions" => $rolePermissions,')) {
  content = content.replace(targetJson1, replacementJson1);
}

const targetJson2 = `"attributes" => $attributes,
                "dndRecords" => $dndRecords,`;
const replacementJson2 = `"attributes" => $attributes,
                "rolePermissions" => $rolePermissions,
                "dndRecords" => $dndRecords,`;

if (!content.includes('"rolePermissions" => $rolePermissions,\n                "dndRecords" => $dndRecords,')) {
  content = content.replace(targetJson2, replacementJson2);
}

fs.writeFileSync('d:/crm whatsapp/crm-app/api.php', content, 'utf8');
console.log('api.php updated successfully');

