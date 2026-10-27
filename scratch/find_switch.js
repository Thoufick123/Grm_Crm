const fs = require('fs');
const content = fs.readFileSync('crm_app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes("switchView") || (l.includes("orders") && l.includes("render"))) {
    console.log(i + 1, l.trim());
  }
});
