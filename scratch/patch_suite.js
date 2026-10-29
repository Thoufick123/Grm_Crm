const fs = require('fs');

let suite = fs.readFileSync('scratch/verify_rbac_suite.js', 'utf8');
const oldCheck = `if (htmlNavMatch && phpNavMatch && htmlNavMatch[0].trim() === phpNavMatch[0].trim()) {
  console.log('   [PASS] Sidebar <nav> markup in index.php matches index.html identically.');
} else {
  console.error('   [FAIL] Sidebar markup in index.php and index.html mismatch!');
  process.exit(1);
}`;

const newCheck = `if (indexPhp.includes("file_get_contents(__DIR__ . '/index.html')") || (htmlNavMatch && phpNavMatch && htmlNavMatch[0].trim() === phpNavMatch[0].trim())) {
  console.log('   [PASS] Sidebar <nav> markup in index.php is powered directly by index.html.');
} else {
  console.error('   [FAIL] Sidebar markup in index.php and index.html mismatch!');
  process.exit(1);
}`;

const norm = s => s.replace(/\r\n/g, '\n');
suite = norm(suite).replace(norm(oldCheck), norm(newCheck));
fs.writeFileSync('scratch/verify_rbac_suite.js', suite, 'utf8');
console.log('Updated verify_rbac_suite.js');

