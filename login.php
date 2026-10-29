<?php
/**
 * GRM WHATSAPP CRM — DEDICATED PHP LOGIN CONTROLLER & VIEW
 * Full server-side PHP logic integrated with HTML, CSS, JavaScript, and XAMPP MySQL.
 */
ini_set('session.gc_maxlifetime', 2592000); // 30-day session duration
session_set_cookie_params([
    'lifetime' => 2592000,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax'
]);
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
require_once __DIR__ . '/config/db.php';

// If already logged in, redirect straight to index.php
if (!empty($_SESSION['user'])) {
    header("Location: index.php");
    exit;
}

$errorMessage = '';
$successMessage = '';

// Pre-defined built-in accounts fallback
$defaultAccounts = [
    'admin' => ['id' => 'admin', 'username' => 'admin', 'password' => 'admin123', 'name' => 'Super Admin', 'role' => 'admin', 'title' => 'Admin Manager (Full Control)', 'avatar' => 'SA', 'staff_id' => 'admin']
];

$pdo = getDBConnection();
$dbStaffList = [];
if ($pdo) {
    try {
        $st = $pdo->query("SELECT id, username, name, role, avatar FROM users WHERE id != 'admin' ORDER BY created_at ASC");
        $dbStaffList = $st->fetchAll();
    } catch (Exception $e) {}
}

// Handle Server-Side Form Submission (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = trim($_POST['password'] ?? '');
    $remember = !empty($_POST['remember']);

    if (empty($username) || empty($password)) {
        $errorMessage = 'Please enter both username and password.';
    } else {
        $matchedUser = null;

        // 1. Check MySQL Database
        $pdo = getDBConnection();
        if ($pdo) {
            try {
                $stmt = $pdo->prepare("SELECT * FROM `users` WHERE LOWER(`username`) = LOWER(?) OR LOWER(`id`) = LOWER(?) OR LOWER(`email`) = LOWER(?) LIMIT 1");
                $stmt->execute([$username, $username, $username]);
                $dbUser = $stmt->fetch();

                if ($dbUser) {
                    $isPassValid = password_verify($password, $dbUser['password']);
                    if (!$isPassValid && $dbUser['password'] === $password) {
                        $isPassValid = true;
                        // Auto-upgrade legacy plaintext password to secure Bcrypt hash
                        try {
                            $newHash = password_hash($password, PASSWORD_BCRYPT);
                            $upStmt = $pdo->prepare("UPDATE `users` SET `password` = ? WHERE `id` = ?");
                            $upStmt->execute([$newHash, $dbUser['id']]);
                        } catch (Exception $e) {}
                    }

                    if ($isPassValid) {
                        $matchedUser = [
                            'id' => $dbUser['id'],
                            'username' => $dbUser['username'],
                            'name' => $dbUser['name'],
                            'role' => ($dbUser['id'] === 'admin' || $dbUser['role'] === 'admin') ? 'admin' : $dbUser['id'],
                            'title' => $dbUser['role'],
                            'avatar' => $dbUser['avatar'] ?: strtoupper(substr($dbUser['name'], 0, 2)),
                            'staff_id' => $dbUser['id'],
                            'email' => $dbUser['email'],
                            'phone' => $dbUser['phone']
                        ];
                    }
                }
            } catch (Exception $e) {
                error_log("DB Login Error: " . $e->getMessage());
            }
        }

        // 2. Fallback to default dictionary
        if (!$matchedUser) {
            $uLower = strtolower($username);
            if (isset($defaultAccounts[$uLower]) && $defaultAccounts[$uLower]['password'] === $password) {
                $matchedUser = $defaultAccounts[$uLower];
            }
        }

        if ($matchedUser) {
            $_SESSION['user'] = $matchedUser;
            $_SESSION['logged_in_at'] = time();

            if ($remember) {
                setcookie('GRM_REMEMBER_USER', base64_encode(json_encode($matchedUser)), time() + (86400 * 30), "/");
            }

            // Redirect immediately to main PHP dashboard
            header("Location: index.php");
            exit;
        } else {
            $errorMessage = 'Invalid username or password. Please try again.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login — GRM WhatsApp CRM & Blue Berry Business Hub</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            brand: {
              50: '#f0fdf4',
              500: '#22c55e',
              600: '#16a34a',
              700: '#15803d',
              dark: '#061a11',
              wa: '#00a884',
              waDark: '#128c7e'
            }
          },
          fontFamily: {
            sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            mono: ['"JetBrains Mono"', 'monospace']
          },
          boxShadow: {
            'glow': '0 0 30px -5px rgba(0, 168, 132, 0.35)',
            'card': '0 20px 40px -15px rgba(0, 0, 0, 0.2)'
          }
        }
      }
    }
  </script>
  <style>
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
    }
    .animate-shake {
      animation: shake 0.4s ease-in-out;
    }
    .mesh-gradient {
      background: radial-gradient(at 0% 0%, #061a11 0px, transparent 50%),
                  radial-gradient(at 100% 0%, #064e3b 0px, transparent 50%),
                  radial-gradient(at 50% 100%, #022c22 0px, transparent 50%),
                  #030712;
    }
  </style>
</head>
<body class="mesh-gradient min-h-screen font-sans text-slate-800 antialiased flex flex-col justify-between p-4 sm:p-6 select-none">

  <!-- Top Navigation Header -->
  <header class="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-wa to-emerald-500 flex items-center justify-center text-white shadow-glow">
        <span class="material-symbols-outlined text-[24px]">chat</span>
      </div>
      <div>
        <h1 class="font-bold text-base text-white flex items-center gap-2">
          GRM CRM <span class="text-[10px] bg-brand-wa/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">PHP Backend</span>
        </h1>
        <p class="text-xs text-emerald-400/90 font-medium">WhatsApp Business & Staff Workstation</p>
      </div>
    </div>

    <div class="hidden sm:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur-md text-white text-xs">
      <span class="relative flex h-2 w-2">
        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span class="text-slate-300">XAMPP PHP & MySQL Active</span>
    </div>
  </header>

  <!-- Central Login Card Container -->
  <main class="w-full max-w-md mx-auto my-6">
    <div class="bg-white rounded-3xl shadow-card overflow-hidden border border-slate-200/80">
      
      <!-- Top Brand Header Banner -->
      <div class="bg-gradient-to-tr from-brand-dark via-emerald-950 to-brand-wa p-6 text-white text-center relative overflow-hidden">
        <div class="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl"></div>
        <div class="absolute -bottom-10 -left-10 w-28 h-28 bg-teal-400/20 rounded-full blur-xl"></div>
        
        <div class="relative z-10">
          <div class="w-14 h-14 mx-auto rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-glow mb-3">
            <span class="material-symbols-outlined text-[32px] text-emerald-300">lock_person</span>
          </div>
          <h2 class="text-xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
            GRM WhatsApp CRM <span class="text-xs bg-brand-wa/30 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-400/30">Secure Login</span>
          </h2>
          <p class="text-xs text-emerald-200/80 mt-1">Role-Based Authentication & Workstation Access</p>
        </div>
      </div>

      <!-- Login Form Body -->
      <div class="p-6 space-y-5">
        
        <!-- PHP Server-Side Error Alert Message -->
        <?php if (!empty($errorMessage)): ?>
        <div id="login-error-box" class="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2.5 animate-shake">
          <span class="material-symbols-outlined text-[20px] text-rose-600 shrink-0">error</span>
          <span><?php echo htmlspecialchars($errorMessage); ?></span>
        </div>
        <?php else: ?>
        <div id="login-error-box" class="hidden bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-xl flex items-center gap-2.5">
          <span class="material-symbols-outlined text-[20px] text-rose-600 shrink-0">error</span>
          <span id="login-error-msg">Invalid username or password.</span>
        </div>
        <?php endif; ?>

        <!-- Standard HTML Form submitting to login.php via POST -->
        <form method="POST" action="login.php" id="login-form" class="space-y-4">
          <!-- Username / Staff ID -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Username or Staff ID</span>
              <span class="text-[10px] text-slate-400">e.g. admin or staff ID</span>
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">account_circle</span>
              <input type="text" name="username" id="username" required value="<?php echo htmlspecialchars($_POST['username'] ?? ''); ?>" placeholder="Enter username or staff ID (e.g. admin)" autocomplete="username" class="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-wa transition">
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Password</span>
              <span class="text-[10px] text-slate-400">admin123 / staff123</span>
            </label>
            <div class="relative">
              <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">key</span>
              <input type="password" name="password" id="password" required placeholder="Enter password" autocomplete="current-password" class="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-wa transition">
              <button type="button" onclick="togglePasswordVisibility()" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" title="Toggle password visibility">
                <span id="pass-visibility-icon" class="material-symbols-outlined text-[18px]">visibility</span>
              </button>
            </div>
          </div>

          <!-- Remember Me Checkbox -->
          <div class="flex items-center justify-between text-xs pt-1">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <input type="checkbox" name="remember" id="remember" checked class="rounded border-slate-300 text-brand-wa focus:ring-brand-wa w-4 h-4">
              <span class="text-slate-600 font-medium">Keep me signed in</span>
            </label>
            <span class="text-[11px] text-emerald-600 font-bold">100% Cost-Free Local Auth</span>
          </div>

          <!-- Submit Button -->
          <button type="submit" id="btn-login-submit" class="w-full py-3 bg-gradient-to-r from-brand-wa to-emerald-600 hover:from-brand-waDark hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]">
            <span class="material-symbols-outlined text-[18px]">login</span> Sign In to Panel
          </button>
        </form>

        <!-- Quick 1-Click Fast Demo Logins -->
        <div class="pt-3 border-t border-slate-100">
          <p class="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center mb-2.5">
            ⚡ Quick 1-Click Fast Login
          </p>
          <div class="grid grid-cols-2 gap-2">
            <!-- Super Admin -->
            <button type="button" onclick="quickFillAndSubmit('admin', 'admin123')" class="p-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl text-left transition flex items-center gap-2 group <?php echo empty($dbStaffList) ? 'col-span-2' : ''; ?>">
              <span class="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">👑</span>
              <div class="overflow-hidden">
                <div class="text-[11px] font-bold text-purple-900 leading-tight">Super Admin</div>
                <div class="text-[9px] text-purple-600 truncate">Full System Access</div>
              </div>
            </button>

            <?php if (!empty($dbStaffList)): ?>
              <?php foreach ($dbStaffList as $st): ?>
                <button type="button" onclick="quickFillAndSubmit('<?php echo htmlspecialchars($st['username'] ?? $st['id']); ?>', '')" class="p-2.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition flex items-center gap-2 group cursor-pointer shadow-2xs">
                  <span class="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0"><?php echo htmlspecialchars($st['avatar'] ?? strtoupper(substr($st['name'], 0, 2))); ?></span>
                  <div class="overflow-hidden">
                    <div class="text-[11px] font-bold text-blue-900 leading-tight truncate"><?php echo htmlspecialchars($st['name'] . ' (' . $st['id'] . ')'); ?></div>
                    <div class="text-[9px] text-blue-600 truncate"><?php echo htmlspecialchars($st['role'] ?? 'Staff Member'); ?></div>
                  </div>
                </button>
              <?php endforeach; ?>
            <?php endif; ?>
          </div>
        </div>

        <!-- Role Separation Details -->
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
          <div class="flex items-center gap-1.5 font-bold text-slate-800">
            <span class="material-symbols-outlined text-[14px] text-brand-wa">verified_user</span>
            <span>Strict Role Access Control:</span>
          </div>
          <p class="text-[10px] text-slate-500 leading-relaxed">
            &bull; <strong>Admin:</strong> Complete system control, WhatsApp QR management, backup, and staff creation.<br>
            &bull; <strong>Staff:</strong> Restricted workstation for assigned customer chats, stock check & order creation.
          </p>
        </div>

      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="w-full max-w-md mx-auto text-center text-xs text-slate-400 py-2">
    &copy; 2026 GRM WhatsApp CRM &bull; Powered by XAMPP PHP & MySQL
  </footer>

  <script>
    function togglePasswordVisibility() {
      const passInput = document.getElementById('password');
      const icon = document.getElementById('pass-visibility-icon');
      if (passInput.type === 'password') {
        passInput.type = 'text';
        icon.innerText = 'visibility_off';
      } else {
        passInput.type = 'password';
        icon.innerText = 'visibility';
      }
    }

    function quickFillStaff(username) {
      document.getElementById('username').value = username;
      const pass = document.getElementById('password');
      pass.value = '';
      pass.focus();
    }

    function quickFillAndSubmit(user, pass) {
      document.getElementById('username').value = user;
      document.getElementById('password').value = pass;
      document.getElementById('login-form').submit();
    }
  </script>
</body>
</html>
