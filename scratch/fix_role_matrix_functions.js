const fs = require('fs');
let code = fs.readFileSync('crm_app.js', 'utf8');

// Hoist updateRoleMatrixHeaderCheckboxes
code = code.replace(
  'window.updateRoleMatrixHeaderCheckboxes = function() {',
  'function updateRoleMatrixHeaderCheckboxes() {\n  window.updateRoleMatrixHeaderCheckboxes = updateRoleMatrixHeaderCheckboxes;'
);

// Guard call in renderRolePermissionsMatrix
code = code.replace(
  '  // Update column master header checkboxes\n  updateRoleMatrixHeaderCheckboxes();',
  '  // Update column master header checkboxes\n  if (typeof updateRoleMatrixHeaderCheckboxes === "function") {\n    updateRoleMatrixHeaderCheckboxes();\n  } else if (typeof window.updateRoleMatrixHeaderCheckboxes === "function") {\n    window.updateRoleMatrixHeaderCheckboxes();\n  }'
);

// Guard call in handleToggleModuleAction
code = code.replace(
  '  // Keep column master header checkboxes in sync\n  updateRoleMatrixHeaderCheckboxes();',
  '  // Keep column master header checkboxes in sync\n  if (typeof updateRoleMatrixHeaderCheckboxes === "function") {\n    updateRoleMatrixHeaderCheckboxes();\n  } else if (typeof window.updateRoleMatrixHeaderCheckboxes === "function") {\n    window.updateRoleMatrixHeaderCheckboxes();\n  }'
);

fs.writeFileSync('crm_app.js', code, 'utf8');
fs.copyFileSync('crm_app.js', 'assets/js/crm_app.js');
console.log('Successfully hoisted updateRoleMatrixHeaderCheckboxes and synchronized JS');
