const fs = require('fs');
let code = fs.readFileSync('api.php', 'utf8');

// Conflict 1 & 2: in save_customer
const custTarget = `            $stmt = $pdo->prepare("
                UPDATE \`customers\` 
<<<<<<< HEAD
                SET \`name\` = ?, \`phone\` = ?, \`whatsapp\` = ?, \`alt_phone\` = ?, \`address\` = ?, \`alt_address\` = ?, \`notes\` = COALESCE(?, \`notes\`)
=======
                SET \`name\` = ?, \`phone\` = ?, \`whatsapp\` = ?, \`address\` = ?, \`email\` = ?, \`gender\` = ?, \`age\` = ?, \`notes\` = ?
>>>>>>> origin/integration/dev2
                WHERE \`id\` = ?
            ");
            $stmt->execute([
                $data['name'] ?? '',
                $data['phone'] ?? '',
                $data['whatsapp'] ?? ($data['phone'] ?? ''),
                $data['alt_phone'] ?? ($data['altPhone'] ?? ''),
                $data['address'] ?? '',
<<<<<<< HEAD
                $data['alt_address'] ?? ($data['altAddress'] ?? ''),
=======
                $data['email'] ?? null,
                $data['gender'] ?? null,
                $data['age'] ?? null,
>>>>>>> origin/integration/dev2
                $data['notes'] ?? null,
                $data['id']
            ]);`;

const custReplacement = `            $stmt = $pdo->prepare("
                UPDATE \`customers\` 
                SET \`name\` = ?, \`phone\` = ?, \`whatsapp\` = ?, \`alt_phone\` = ?, \`email\` = ?, \`gender\` = ?, \`age\` = ?, \`address\` = ?, \`alt_address\` = ?, \`notes\` = COALESCE(?, \`notes\`)
                WHERE \`id\` = ?
            ");
            $stmt->execute([
                $data['name'] ?? '',
                $data['phone'] ?? '',
                $data['whatsapp'] ?? ($data['phone'] ?? ''),
                $data['alt_phone'] ?? ($data['altPhone'] ?? ''),
                $data['email'] ?? null,
                $data['gender'] ?? null,
                $data['age'] ?? null,
                $data['address'] ?? '',
                $data['alt_address'] ?? ($data['altAddress'] ?? ''),
                $data['notes'] ?? null,
                $data['id']
            ]);`;

// Conflict 3: Broadcast templates before backup
const bcastTarget = `// =========================================================================
<<<<<<< HEAD
// =========================================================================
// 10. DATABASE BACKUP & RESTORE ENGINE (MySQL Zero-Loss Snapshot & Restore)
=======
// 9.5. BROADCAST TEMPLATES MANAGEMENT (MYSQL DATABASE)
// =========================================================================
if ($action === 'save_broadcast_template' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $tpl = json_decode($input, true);
    $id = $tpl['id'] ?? ($tpl['key'] ?? ('tpl_' . uniqid()));
    $name = $tpl['name'] ?? ($tpl['label'] ?? 'Custom Template');
    $category = $tpl['category'] ?? 'MARKETING';
    $bodyText = $tpl['body_text'] ?? ($tpl['text'] ?? '');
    $imageUrl = $tpl['image_url'] ?? ($tpl['media_url'] ?? null);
    $buttonType = $tpl['button_type'] ?? null;
    $buttonText = $tpl['button_text'] ?? null;
    $buttonUrl = $tpl['button_url'] ?? null;
    $status = $tpl['status'] ?? 'ACTIVE';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO \`broadcast_templates\` (\`id\`, \`name\`, \`category\`, \`body_text\`, \`image_url\`, \`button_type\`, \`button_text\`, \`button_url\`, \`status\`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    \`name\` = VALUES(\`name\`),
                    \`category\` = VALUES(\`category\`),
                    \`body_text\` = VALUES(\`body_text\`),
                    \`image_url\` = VALUES(\`image_url\`),
                    \`button_type\` = VALUES(\`button_type\`),
                    \`button_text\` = VALUES(\`button_text\`),
                    \`button_url\` = VALUES(\`button_url\`),
                    \`status\` = VALUES(\`status\`)
            ");
            $stmt->execute([$id, $name, $category, $bodyText, $imageUrl, $buttonType, $buttonText, $buttonUrl, $status]);
            echo json_encode(["status" => "success", "message" => "Broadcast template saved in database", "id" => $id]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Template saved locally"]);
    exit;
}

if ($action === 'delete_broadcast_template' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $id = $data['id'] ?? ($data['key'] ?? null);
    if ($id && $pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM \`broadcast_templates\` WHERE \`id\` = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Template deleted from database"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Template deleted"]);
    exit;
}


// =========================================================================
// 10. DATABASE BACKUP & RESTORE
>>>>>>> origin/integration/dev2
// =========================================================================`;

const bcastReplacement = `// =========================================================================
// 9.5. BROADCAST TEMPLATES MANAGEMENT (MYSQL DATABASE)
// =========================================================================
if ($action === 'save_broadcast_template' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $tpl = json_decode($input, true);
    $id = $tpl['id'] ?? ($tpl['key'] ?? ('tpl_' . uniqid()));
    $name = $tpl['name'] ?? ($tpl['label'] ?? 'Custom Template');
    $category = $tpl['category'] ?? 'MARKETING';
    $bodyText = $tpl['body_text'] ?? ($tpl['text'] ?? '');
    $imageUrl = $tpl['image_url'] ?? ($tpl['media_url'] ?? null);
    $buttonType = $tpl['button_type'] ?? null;
    $buttonText = $tpl['button_text'] ?? null;
    $buttonUrl = $tpl['button_url'] ?? null;
    $status = $tpl['status'] ?? 'ACTIVE';

    if ($pdo) {
        try {
            $stmt = $pdo->prepare("
                INSERT INTO \`broadcast_templates\` (\`id\`, \`name\`, \`category\`, \`body_text\`, \`image_url\`, \`button_type\`, \`button_text\`, \`button_url\`, \`status\`)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    \`name\` = VALUES(\`name\`),
                    \`category\` = VALUES(\`category\`),
                    \`body_text\` = VALUES(\`body_text\`),
                    \`image_url\` = VALUES(\`image_url\`),
                    \`button_type\` = VALUES(\`button_type\`),
                    \`button_text\` = VALUES(\`button_text\`),
                    \`button_url\` = VALUES(\`button_url\`),
                    \`status\` = VALUES(\`status\`)
            ");
            $stmt->execute([$id, $name, $category, $bodyText, $imageUrl, $buttonType, $buttonText, $buttonUrl, $status]);
            echo json_encode(["status" => "success", "message" => "Broadcast template saved in database", "id" => $id]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Template saved locally"]);
    exit;
}

if ($action === 'delete_broadcast_template' && $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    $id = $data['id'] ?? ($data['key'] ?? null);
    if ($id && $pdo) {
        try {
            $stmt = $pdo->prepare("DELETE FROM \`broadcast_templates\` WHERE \`id\` = ?");
            $stmt->execute([$id]);
            echo json_encode(["status" => "success", "message" => "Template deleted from database"]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => $e->getMessage()]);
            exit;
        }
    }
    echo json_encode(["status" => "success", "message" => "Template deleted"]);
    exit;
}

// =========================================================================
// 10. DATABASE BACKUP & RESTORE ENGINE (MySQL Zero-Loss Snapshot & Restore)
// =========================================================================`;

const norm = s => s.replace(/\r\n/g, '\n');
let nCode = norm(code);
const nCustTarget = norm(custTarget);
const nCustReplacement = norm(custReplacement);
const nBcastTarget = norm(bcastTarget);
const nBcastReplacement = norm(bcastReplacement);

if (nCode.includes(nCustTarget)) {
  nCode = nCode.replace(nCustTarget, nCustReplacement);
  console.log('Customer update conflict in api.php resolved');
} else {
  console.log('Failed to match customer conflict');
}

if (nCode.includes(nBcastTarget)) {
  nCode = nCode.replace(nBcastTarget, nBcastReplacement);
  console.log('Broadcast conflict in api.php resolved');
} else {
  console.log('Failed to match broadcast conflict');
}

fs.writeFileSync('api.php', nCode, 'utf8');

