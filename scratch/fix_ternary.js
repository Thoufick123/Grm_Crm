const fs = require('fs');
let code = fs.readFileSync('crm_app.js', 'utf8');

const broken = `            \${canUserPerformAction('orders', 'edit') ? \`
            <!-- Quick Status Transition Selector -->
            <div>
              <select onchange="handleOrderStatusChange('\${ord.id}', this.value, this)" class="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded px-1.5 py-0.5 outline-none cursor-pointer">
                <option value="PLACED" \${normStatus === 'PLACED' ? 'selected' : ''}>1. Placed</option>
                <option value="PACKED" \${normStatus === 'PACKED' ? 'selected' : ''}>2. Packed</option>
                <option value="SHIPPED" \${normStatus === 'SHIPPED' ? 'selected' : ''}>3. Shipped</option>
                <option value="DELIVERED" \${normStatus === 'DELIVERED' ? 'selected' : ''}>4. Delivered</option>
              </select>
            </div>
            \${normStatus === 'SHIPPED' ? \``;

const fixed = `            \${canUserPerformAction('orders', 'edit') ? \`
            <!-- Quick Status Transition Selector -->
            <div>
              <select onchange="handleOrderStatusChange('\${ord.id}', this.value, this)" class="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded px-1.5 py-0.5 outline-none cursor-pointer">
                <option value="PLACED" \${normStatus === 'PLACED' ? 'selected' : ''}>1. Placed</option>
                <option value="PACKED" \${normStatus === 'PACKED' ? 'selected' : ''}>2. Packed</option>
                <option value="SHIPPED" \${normStatus === 'SHIPPED' ? 'selected' : ''}>3. Shipped</option>
                <option value="DELIVERED" \${normStatus === 'DELIVERED' ? 'selected' : ''}>4. Delivered</option>
              </select>
            </div>
            \` : ''}
            \${normStatus === 'SHIPPED' ? \``;

// Normalize line endings for replacement
const normalize = s => s.replace(/\r\n/g, '\n');
const nCode = normalize(code);
const nBroken = normalize(broken);
const nFixed = normalize(fixed);

if (nCode.includes(nBroken)) {
  const result = nCode.replace(nBroken, nFixed);
  fs.writeFileSync('crm_app.js', result, 'utf8');
  console.log('Fixed ternary in crm_app.js successfully');
} else {
  console.log('Could not find broken pattern in crm_app.js');
}

