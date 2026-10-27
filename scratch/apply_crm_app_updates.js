const fs = require('fs');
const path = require('path');

const filePath = path.resolve('crm_app.js');
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update INITIAL_CRM_DATA.orders
const initialOrdersSnippet = `  orders: [
    {
      id: 'WA-2026-001126',
      queryId: 'Q-2026-001245',
      customerId: 'cust_101',
      customerName: 'Priya Sundaram',
      customerPhone: '+91 98401 23456',
      shippingAddress: '42, 3rd Cross Street, Gandhinagar, Adyar, Chennai - 600020',
      items: [{ name: 'Baby Cotton Frock (Pink / 2-3Y)', sku: 'BF-001-PNK-2Y', qty: 2, price: 599 }],
      grandTotal: 1198.00,
      codAdvance: 0,
      codBalanceDue: 0,
      paymentMethod: 'ONLINE_UPI',
      paymentStatus: 'PAID',
      upiTransactionId: 'UPI-2026-9882103984',
      paymentScreenshot: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=60',
      orderStatus: 'PLACED',
      staffId: 'staff_01',
      staffName: 'Priya Sharma',
      createdBy: 'Priya Sharma',
      createdAt: '2026-10-27 10:15:00'
    },
    {
      id: 'WA-2026-001127',
      queryId: 'Q-2026-001246',
      customerId: 'cust_102',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 98765 43210',
      shippingAddress: 'Flat 4B, Lotus Apartments, 100 Feet Rd, Indiranagar, Bengaluru - 560038',
      items: [{ name: 'Maternity Feeding Kurtis (Teal / L)', sku: 'MD-102-TEA-L', qty: 2, price: 949 }],
      grandTotal: 1898.00,
      codAdvance: 200,
      codBalanceDue: 1698.00,
      paymentMethod: 'COD',
      paymentStatus: 'ADVANCE_PAID',
      upiTransactionId: 'UPI-2026-4433221100',
      paymentScreenshot: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=60',
      orderStatus: 'PACKED',
      staffId: 'staff_02',
      staffName: 'Rahul Verma',
      createdBy: 'Rahul Verma',
      createdAt: '2026-10-26 14:30:00'
    },
    {
      id: 'WA-2026-001128',
      queryId: 'Q-2026-001247',
      customerId: 'cust_103',
      customerName: 'Kavitha Ramachandran',
      customerPhone: '+91 94441 55667',
      shippingAddress: '12, Saravana Street, T. Nagar, Chennai - 600017',
      items: [{ name: 'Pure Cotton Rompers Set (3-Pack / 6M)', sku: 'RP-003-AST-6M', qty: 3, price: 599 }],
      grandTotal: 1797.00,
      codAdvance: 0,
      codBalanceDue: 0,
      paymentMethod: 'ONLINE_UPI',
      paymentStatus: 'PAID',
      upiTransactionId: 'UPI-2026-7788990011',
      paymentScreenshot: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=60',
      orderStatus: 'SHIPPED',
      staffId: 'staff_01',
      staffName: 'Priya Sharma',
      createdBy: 'Priya Sharma',
      trackingNumber: 'DELHIVERY-778899221',
      courierName: 'Delhivery Express',
      createdAt: '2026-10-25 11:20:00'
    },
    {
      id: 'WA-2026-001129',
      queryId: 'Q-2026-001248',
      customerId: 'cust_104',
      customerName: 'SugunaMani',
      customerPhone: '+91 98410 88990',
      shippingAddress: '55, Anna Nagar West, Madurai - 625020',
      items: [{ name: 'Anarkali Feeding Maternity Kurti (Navy / XL)', sku: 'MK-204-NVY-XL', qty: 2, price: 749 }],
      grandTotal: 1498.00,
      codAdvance: 200,
      codBalanceDue: 1298.00,
      paymentMethod: 'COD',
      paymentStatus: 'ADVANCE_PAID',
      upiTransactionId: 'UPI-2026-5566443322',
      paymentScreenshot: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=60',
      orderStatus: 'SHIPPED',
      staffId: 'staff_02',
      staffName: 'Rahul Verma',
      createdBy: 'Rahul Verma',
      trackingNumber: 'DTDC-992233441',
      courierName: 'DTDC Courier',
      createdAt: '2026-10-24 16:45:00'
    },
    {
      id: 'WA-2026-001130',
      queryId: 'Q-2026-001249',
      customerId: 'cust_101',
      customerName: 'Priya Sundaram',
      customerPhone: '+91 98401 23456',
      shippingAddress: '42, 3rd Cross Street, Gandhinagar, Adyar, Chennai - 600020',
      items: [{ name: 'Kids Organic Cotton Sleepsuits (Yellow / 1Y)', sku: 'SS-101-YLW-1Y', qty: 2, price: 799 }],
      grandTotal: 1598.00,
      codAdvance: 0,
      codBalanceDue: 0,
      paymentMethod: 'ONLINE_UPI',
      paymentStatus: 'PAID',
      upiTransactionId: 'UPI-2026-1122334455',
      paymentScreenshot: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=60',
      orderStatus: 'DELIVERED',
      staffId: 'staff_03',
      staffName: 'Sneha Patel',
      createdBy: 'Sneha Patel',
      trackingNumber: 'BLUE-DART-8822991',
      courierName: 'Blue Dart Surface',
      createdAt: '2026-10-22 09:30:00'
    },
    {
      id: 'WA-2026-001131',
      queryId: 'Q-2026-001250',
      customerId: 'cust_102',
      customerName: 'Ananya Sharma',
      customerPhone: '+91 98765 43210',
      shippingAddress: 'Flat 4B, Lotus Apartments, 100 Feet Rd, Indiranagar, Bengaluru - 560038',
      items: [{ name: 'Baby Cotton Romper & Cap Set (Sky Blue)', sku: 'RP-005-BLU-3M', qty: 3, price: 449 }],
      grandTotal: 1347.00,
      codAdvance: 0,
      codBalanceDue: 0,
      paymentMethod: 'ONLINE_UPI',
      paymentStatus: 'PAID',
      upiTransactionId: 'UPI-2026-9900112233',
      paymentScreenshot: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=400&auto=format&fit=crop&q=60',
      orderStatus: 'DELIVERED',
      staffId: 'staff_03',
      staffName: 'Sneha Patel',
      createdBy: 'Sneha Patel',
      trackingNumber: 'DELHIVERY-334455667',
      courierName: 'Delhivery Express',
      createdAt: '2026-10-20 15:10:00'
    }
  ],`;

code = code.replace('  orders: [],', initialOrdersSnippet);

// 2. In fetch('api.php?action=get_all') merge orders into CRM_STATE.orders
const targetSyncHook = `      if (typeof populateCatalogCategoryFilters === 'function') {
        populateCatalogCategoryFilters();
      }
      if (typeof populateProductFormCategories === 'function') {
        populateProductFormCategories();
      }`;

const ordersSyncHook = `      if (data && data.orders && Array.isArray(data.orders) && data.orders.length > 0) {
        CRM_STATE.orders = data.orders.map(o => ({
          id: o.id,
          queryId: o.queryId || o.query_id || 'N/A',
          customerId: o.customerId || o.customer_id || '',
          customerName: o.customerName || o.customer_name || 'Customer',
          customerPhone: o.customerPhone || o.customer_phone || '',
          shippingAddress: o.shippingAddress || o.shipping_address || '',
          items: Array.isArray(o.items) ? o.items : (typeof o.items_json === 'string' ? JSON.parse(o.items_json) : []),
          grandTotal: parseFloat(o.grandTotal || o.grand_total || 0),
          codAdvance: parseFloat(o.codAdvance || o.cod_advance || 0),
          codBalanceDue: parseFloat(o.codBalanceDue || o.cod_balance_due || 0),
          paymentMethod: o.paymentMethod || o.payment_method || 'COD',
          paymentStatus: o.paymentStatus || o.payment_status || 'PENDING',
          upiTransactionId: o.upiTransactionId || o.upi_transaction_id || '',
          paymentScreenshot: o.paymentScreenshot || o.payment_screenshot || '',
          orderStatus: (o.orderStatus || o.order_status || 'PLACED').toUpperCase(),
          staffId: o.staffId || o.staff_id || '',
          staffName: o.staffName || o.staff_name || o.createdBy || o.created_by || 'Super Admin',
          createdBy: o.createdBy || o.created_by || o.staffName || 'Staff',
          trackingNumber: o.trackingNumber || o.tracking_number || '',
          courierName: o.courierName || o.courier_name || '',
          createdAt: o.createdAt || o.created_at || ''
        }));
        if (typeof renderOrdersModule === 'function') {
          renderOrdersModule();
        }
      }

      if (typeof populateCatalogCategoryFilters === 'function') {
        populateCatalogCategoryFilters();
      }
      if (typeof populateProductFormCategories === 'function') {
        populateProductFormCategories();
      }`;

code = code.replace(targetSyncHook, ordersSyncHook);

// 3. In submitBookOrder: attach staff and save order to DB
const oldBookOrderSnippet = `    codAdvance: codAdvance,
    codBalanceDue: codBalanceDue,
    orderStatus: 'STOCK_RESERVED',
    shippingAddress: address,
    createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdBy: ACTIVE_ROLE === 'admin' ? 'Super Admin' : 'Assigned Staff'
  };

  CRM_STATE.orders.unshift(newOrder);`;

const newBookOrderSnippet = `    codAdvance: codAdvance,
    codBalanceDue: codBalanceDue,
    orderStatus: 'PLACED',
    shippingAddress: address,
    staffId: CURRENT_USER?.id || (ACTIVE_ROLE === 'admin' ? 'admin' : 'staff_01'),
    staffName: CURRENT_USER?.name || (ACTIVE_ROLE === 'admin' ? 'Super Admin' : 'Assigned Staff'),
    createdAt: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdBy: CURRENT_USER?.name || (ACTIVE_ROLE === 'admin' ? 'Super Admin' : 'Assigned Staff')
  };

  CRM_STATE.orders.unshift(newOrder);

  // Synchronize new order to MySQL backend
  fetch('api.php?action=save_order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  }).catch(() => {});`;

code = code.replace(oldBookOrderSnippet, newBookOrderSnippet);

// 4. In switchView: update renderOrdersTable() to renderOrdersModule()
code = code.replace("if (viewName === 'orders') renderOrdersTable();", "if (viewName === 'orders') renderOrdersModule();");
code = code.replace("renderOrdersTable();\n}", "renderOrdersModule();\n}");

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated crm_app.js');

// Sync to assets/js/crm_app.js
const destPath = path.resolve('assets/js/crm_app.js');
fs.writeFileSync(destPath, code, 'utf8');
console.log('Successfully synced to assets/js/crm_app.js');
