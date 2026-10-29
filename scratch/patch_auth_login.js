const fs = require('fs');

// Patch auth.php
let authContent = fs.readFileSync('d:/crm whatsapp/crm-app/auth.php', 'utf8');

const targetAuthMatched = `'role' => ($dbUser['id'] === 'admin' || $dbUser['role'] === 'admin') ? 'admin' : $dbUser['id'],
                        'title' => $dbUser['role'],`;

const replAuthMatched = `'role' => ($dbUser['id'] === 'admin' || $dbUser['role'] === 'admin') ? 'admin' : $dbUser['id'],
                        'role_id' => $dbUser['id'],
                        'role_name' => $dbUser['role'],
                        'title' => $dbUser['role'],`;

if (authContent.includes(targetAuthMatched)) {
  authContent = authContent.replace(targetAuthMatched, replAuthMatched);
}

// In auth.php response, also include rolePermissions
const targetAuthResponse = `echo json_encode([
            "status" => "success",
            "message" => "Login authenticated successfully.",
            "user" => $matchedUser,
            "redirect_url" => "index.html"
        ]);`;

const replAuthResponse = `// Load role permissions to immediately hydrate frontend
        $rolePermissions = [];
        try {
            if ($pdo) {
                $rpStmt = $pdo->query("SELECT \`name\`, \`value\` FROM \`attributes\` WHERE \`type\` = 'role_permissions'");
                $rpRows = $rpStmt->fetchAll();
                foreach ($rpRows as $r) {
                    $decoded = json_decode($r['value'], true);
                    if ($decoded) $rolePermissions[$r['name']] = $decoded;
                }
            }
        } catch (Exception $e) {}

        echo json_encode([
            "status" => "success",
            "message" => "Login authenticated successfully.",
            "user" => $matchedUser,
            "rolePermissions" => $rolePermissions,
            "redirect_url" => "index.html"
        ]);`;

if (authContent.includes(targetAuthResponse)) {
  authContent = authContent.replace(targetAuthResponse, replAuthResponse);
}

fs.writeFileSync('d:/crm whatsapp/crm-app/auth.php', authContent, 'utf8');
console.log('auth.php updated');

// Patch login.php
let loginContent = fs.readFileSync('d:/crm whatsapp/crm-app/login.php', 'utf8');
const targetLoginMatched = `'role' => ($dbUser['id'] === 'admin' || $dbUser['role'] === 'admin') ? 'admin' : $dbUser['id'],
                            'title' => $dbUser['role'],`;

const replLoginMatched = `'role' => ($dbUser['id'] === 'admin' || $dbUser['role'] === 'admin') ? 'admin' : $dbUser['id'],
                            'role_id' => $dbUser['id'],
                            'role_name' => $dbUser['role'],
                            'title' => $dbUser['role'],`;

if (loginContent.includes(targetLoginMatched)) {
  loginContent = loginContent.replace(targetLoginMatched, replLoginMatched);
}

fs.writeFileSync('d:/crm whatsapp/crm-app/login.php', loginContent, 'utf8');
console.log('login.php updated');

