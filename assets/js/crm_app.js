/**
 * GRM WHATSAPP CRM — CORE REACTIVE APPLICATION SCRIPT (v2.5)
 * Manages Dynamic WhatsApp Business Phone Configuration, Inbound Realtime Routing, 
 * Staff Assignment, Product Stock Reservation & Customer 360
 */

// Initial Garment CRM Mock State (Stores in LocalStorage for 100% persistent cost-free operation)
var INITIAL_CRM_DATA = window.INITIAL_CRM_DATA || {
  // 1. Configured WhatsApp Business Account (Dynamic Phone Configuration)
  whatsappAccount: {
    id: 1,
    businessName: 'GRM Garments Business Hub',
    displayName: 'GRM Garments Official',
    phoneNumber: '+91 97896 60115',
    phoneNumberId: '109823471928374',
    wabaId: '982374619283745',
    provider: 'META_CLOUD_API',
    verifyToken: 'GRM_WHATSAPP_SECRET_VERIFY_TOKEN_2026',
    status: 'CONNECTED',
    webhookUrl: 'http://localhost:8080/webhook.php'
  },
  // 1.5. Expected Daily WhatsApp Inbound Message Target (Default: 200 msgs/day)
  dailyMessageTarget: {
    expectedPerDay: 200,
    allocatedPerDay: 200,
    lastResetDate: '2026-10-02'
  },
  staffList: [
    { id: 'staff_01', name: 'Priya Sharma', role: 'Sales Specialist (Baby Collection)', avatar: 'PS', activeQueries: 3, converted: 14, dailyQuota: 70, todayHandled: 18, email: 'priya.sharma@grmgarments.com', phone: '+91 98450 11221', specialization: 'Baby Collection', status: 'ACTIVE' },
    { id: 'staff_02', name: 'Rahul Verma', role: 'Enquiry Specialist (Maternity & Kids)', avatar: 'RV', activeQueries: 2, converted: 9, dailyQuota: 70, todayHandled: 14, email: 'rahul.verma@grmgarments.com', phone: '+91 98450 11222', specialization: 'Maternity & Kids', status: 'ACTIVE' },
    { id: 'staff_03', name: 'Sneha Patel', role: 'Order Fulfillment & Support', avatar: 'SP', activeQueries: 1, converted: 11, dailyQuota: 60, todayHandled: 8, email: 'sneha.patel@grmgarments.com', phone: '+91 98450 11223', specialization: 'Order Fulfillment', status: 'ACTIVE' }
  ],
  products: [
    { id: 1, sku: 'BF-001-PK', name: 'Baby Frock (Embroidered Cotton)', category: 'Baby Collection', size: '2-3 Years', color: 'Pink', price: 599, physicalStock: 12, reservedStock: 4, image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60' },
    { id: 2, sku: 'BF-001-YL', name: 'Baby Frock (Embroidered Cotton)', category: 'Baby Collection', size: '1-2 Years', color: 'Sunshine Yellow', price: 599, physicalStock: 8, reservedStock: 1, image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&auto=format&fit=crop&q=60' },
    { id: 3, sku: 'MD-102-BL', name: 'Maternity Maxi Feeding Gown', category: 'Maternity', size: 'L / XL', color: 'Sky Blue', price: 1299, physicalStock: 10, reservedStock: 5, image: 'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=400&auto=format&fit=crop&q=60' },
    { id: 4, sku: 'KD-204-YL', name: 'Kids Organic Cotton T-Shirt Set (Pack of 3)', category: 'Kids', size: '4-5 Years', color: 'Multi Yellow/Green', price: 450, physicalStock: 25, reservedStock: 8, image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=60' },
    { id: 5, sku: 'GL-505-RD', name: 'Girls Festive Silk Lehenga Choli', category: 'Girls Festive', size: '6-7 Years', color: 'Ruby Red & Gold', price: 899, physicalStock: 6, reservedStock: 0, image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=60' },
    { id: 6, sku: 'BB-301-WH', name: 'Newborn 5-Piece Organic Romper Gift Set', category: 'Newborn', size: '0-6 Months', color: 'Pure White / Mint', price: 799, physicalStock: 15, reservedStock: 2, image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&auto=format&fit=crop&q=60' }
  ],
  customers: [
    {
      id: 'cust_101',
      code: 'CUST-2026-0089',
      name: 'Priya Sundaram',
      phone: '+91 98765 43210',
      whatsapp: '+91 98765 43210',
      address: 'No. 45, 2nd Main Road, Gandhinagar, Adyar, Chennai - 600020',
      city: 'Chennai',
      customerType: 'Repeat Customer',
      tags: ['Baby Collection', 'Repeat Buyer', 'COD'],
      totalOrders: 8,
      totalSpend: 12450,
      avatar: 'PS'
    },
    {
      id: 'cust_102',
      code: 'CUST-2026-0092',
      name: 'Ananya Sharma',
      phone: '+91 98450 11223',
      whatsapp: '+91 98450 11223',
      address: 'Flat 402, Green Glen Layout, Bellandur, Bengaluru - 560103',
      city: 'Bengaluru',
      customerType: 'VIP Customer',
      tags: ['Maternity', 'VIP', 'Prepaid'],
      totalOrders: 3,
      totalSpend: 7800,
      avatar: 'AS'
    },
    {
      id: 'cust_103',
      code: 'CUST-2026-0104',
      name: 'Kavitha Ramachandran',
      phone: '+91 97890 55441',
      whatsapp: '+91 97890 55441',
      address: '12/B, Anna Nagar West, Madurai - 625020',
      city: 'Madurai',
      customerType: 'New WhatsApp Customer',
      tags: ['New Lead', 'Kids Wear'],
      totalOrders: 0,
      totalSpend: 0,
      avatar: 'KR'
    }
  ],
  queries: [
    {
      id: 'Q-2026-001245',
      customerId: 'cust_101',
      assignedTo: 'staff_01',
      status: 'ASSIGNED',
      priority: 'HIGH',
      queryText: 'Baby Frock BF-001 Pink 2-3 Years available?',
      productSku: 'BF-001-PK',
      createdAt: 'Today, 10:15 AM',
      unreadCount: 1,
      lastMessage: 'Customer: "2–3 years. Pink colour. How much is it?"'
    },
    {
      id: 'Q-2026-001246',
      customerId: 'cust_102',
      assignedTo: 'UNASSIGNED', // UNASSIGNED - Needs Admin Assignment
      status: 'NEW',
      priority: 'URGENT',
      queryText: 'Can you share photos and colors of Maternity feeding gown?',
      productSku: 'MD-102-BL',
      createdAt: 'Today, 10:45 AM',
      unreadCount: 2,
      lastMessage: 'Customer: "Please share latest photos of maternity gown MD-102"'
    },
    {
      id: 'Q-2026-001247',
      customerId: 'cust_103',
      assignedTo: 'UNASSIGNED', // UNASSIGNED - Needs Admin Assignment
      status: 'NEW',
      priority: 'NORMAL',
      queryText: 'Do you deliver to Madurai? What are the COD charges?',
      productSku: null,
      createdAt: 'Today, 11:05 AM',
      unreadCount: 1,
      lastMessage: 'Customer: "Hi, do you provide cash on delivery to Madurai?"'
    }
  ],
  conversations: {
    'cust_101': [
      { id: 1, sender: 'customer', text: 'Hi GRM team, is baby frock available?', time: '10:14 AM', status: 'READ' },
      { id: 2, sender: 'staff', text: 'Hello Priya! Thank you for contacting GRM Garments. Yes, we have our best-selling cotton baby frocks in stock. Which size & colour do you need?', time: '10:16 AM', status: 'READ' },
      { id: 3, sender: 'customer', text: '2–3 years. Pink colour. How much is it?', time: '10:18 AM', status: 'READ' }
    ],
    'cust_102': [
      { id: 1, sender: 'customer', text: 'Hello! I need a maternity feeding gown in size L.', time: '10:42 AM', status: 'READ' },
      { id: 2, sender: 'customer', text: 'Please share latest photos of maternity gown MD-102 in Sky Blue.', time: '10:45 AM', status: 'DELIVERED' }
    ],
    'cust_103': [
      { id: 1, sender: 'customer', text: 'Hi, do you provide cash on delivery to Madurai? What are the charges?', time: '11:05 AM', status: 'DELIVERED' }
    ]
  },
  orders: [
    {
      id: 'WA-2026-001120',
      queryId: 'Q-2026-001210',
      customerId: 'cust_101',
      customerName: 'Priya Sundaram',
      items: [{ sku: 'BF-001-PK', name: 'Baby Frock (Pink 2-3Y)', qty: 2, price: 599 }],
      grandTotal: 1198,
      paymentMethod: 'COD',
      paymentStatus: 'PAID',
      orderStatus: 'DELIVERED',
      createdAt: '28 Sep 2026',
      createdBy: 'Priya Sharma (Staff 01)'
    },
    {
      id: 'WA-2026-001121',
      queryId: 'Q-2026-001222',
      customerId: 'cust_102',
      customerName: 'Ananya Sharma',
      items: [{ sku: 'MD-102-BL', name: 'Maternity Maxi Gown (Blue L)', qty: 1, price: 1299 }],
      grandTotal: 1299,
      paymentMethod: 'UPI',
      paymentStatus: 'PAID',
      orderStatus: 'DISPATCHED',
      createdAt: 'Yesterday',
      createdBy: 'Rahul Verma (Staff 02)'
    }
  ],
  followups: [
    {
      id: 'FU-2026-000245',
      queryId: 'Q-2026-001245',
      customerId: 'cust_101',
      customerName: 'Priya Sundaram',
      assignedTo: 'staff_01',
      date: 'Today',
      time: '12:00 PM',
      reason: 'Customer will confirm size and place order after checking with family',
      status: 'PENDING'
    },
    {
      id: 'FU-2026-000246',
      queryId: 'Q-2026-001246',
      customerId: 'cust_102',
      customerName: 'Ananya Sharma',
      assignedTo: 'staff_02',
      date: 'Tomorrow',
      time: '10:30 AM',
      reason: 'Send live video of the maternity fabric softness',
      status: 'PENDING'
    }
  ],
  auditLogs: [
    { timestamp: '10:15 AM', user: 'System (Webhook)', action: 'QUERY_CREATED', module: 'QUERIES', details: 'Created Q-2026-001245 from customer Priya Sundaram' },
    { timestamp: '10:16 AM', user: 'Admin', action: 'QUERY_ASSIGNED', module: 'STAFF_ASSIGN', details: 'Assigned Q-2026-001245 to Priya Sharma (Staff 01)' },
    { timestamp: '10:45 AM', user: 'System (Webhook)', action: 'QUERY_CREATED', module: 'QUERIES', details: 'Created Q-2026-001246 from Ananya Sharma (UNASSIGNED)' }
  ]
};
window.INITIAL_CRM_DATA = INITIAL_CRM_DATA;

// Built-in Authentication Credentials Map & User Accounts
var DEFAULT_ACCOUNTS = window.DEFAULT_ACCOUNTS || {
  'admin': {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Super Admin',
    title: 'Admin Manager (Full Control)',
    avatar: 'SA',
    staffId: 'admin'
  },
  'priya': {
    username: 'priya',
    password: 'staff123',
    role: 'staff_01',
    staffId: 'staff_01',
    name: 'Priya Sharma',
    title: 'Sales Specialist (Baby Collection)',
    avatar: 'PS'
  },
  'staff_01': {
    username: 'staff_01',
    password: 'staff123',
    role: 'staff_01',
    staffId: 'staff_01',
    name: 'Priya Sharma',
    title: 'Sales Specialist (Baby Collection)',
    avatar: 'PS'
  },
  'rahul': {
    username: 'rahul',
    password: 'staff123',
    role: 'staff_02',
    staffId: 'staff_02',
    name: 'Rahul Verma',
    title: 'Enquiry Specialist (Maternity & Kids)',
    avatar: 'RV'
  },
  'staff_02': {
    username: 'staff_02',
    password: 'staff123',
    role: 'staff_02',
    staffId: 'staff_02',
    name: 'Rahul Verma',
    title: 'Enquiry Specialist (Maternity & Kids)',
    avatar: 'RV'
  },
  'sneha': {
    username: 'sneha',
    password: 'staff123',
    role: 'staff_03',
    staffId: 'staff_03',
    name: 'Sneha Patel',
    title: 'Order Fulfillment & Support',
    avatar: 'SP'
  },
  'staff_03': {
    username: 'staff_03',
    password: 'staff123',
    role: 'staff_03',
    staffId: 'staff_03',
    name: 'Sneha Patel',
    title: 'Order Fulfillment & Support',
    avatar: 'SP'
  }
};
window.DEFAULT_ACCOUNTS = DEFAULT_ACCOUNTS;

// Global App State (Safely Initialized Immediately)
var CRM_STATE = window.CRM_STATE || JSON.parse(JSON.stringify(INITIAL_CRM_DATA));
window.CRM_STATE = CRM_STATE;
var CURRENT_USER = window.CURRENT_USER || null; // Currently logged in user profile
var ACTIVE_VIEW = window.ACTIVE_VIEW || 'inbox';
var ACTIVE_ROLE = window.ACTIVE_ROLE || 'admin'; // 'admin', 'staff_01', 'staff_02', 'staff_03', etc.
var ACTIVE_CUSTOMER_ID = window.ACTIVE_CUSTOMER_ID || 'cust_101';
var INBOX_FILTER = window.INBOX_FILTER || 'all'; // 'all', 'unassigned', 'my', 'urgent'
var LAST_POLL_EPOCH = window.LAST_POLL_EPOCH || 0;
var SOCKET_IO = window.SOCKET_IO || null;
var MULTI_ACCOUNTS_STATE = window.MULTI_ACCOUNTS_STATE || []; // Multi-WhatsApp accounts from Bridge
var ACTIVE_SEND_ACCOUNT_ID = window.ACTIVE_SEND_ACCOUNT_ID || 'account_1';
var REVEALED_CUSTOMERS = window.REVEALED_CUSTOMERS || new Set(); // Stores customer IDs whose numbers are temporarily revealed

// =========================================================================
// NUMBER MASKING ENGINE (DATA PRIVACY & LEAD PROTECTION)
// =========================================================================
function formatDisplayPhone(rawPhone, customerId = null, forceUnmask = false) {
  if (!rawPhone) return '';
  const isMaskingEnabled = CRM_STATE?.settings?.maskCustomerNumbers ?? false;

  // If masking is off globally, or forced unmask, or specifically revealed by admin
  if (!isMaskingEnabled || forceUnmask || (customerId && REVEALED_CUSTOMERS.has(customerId))) {
    return rawPhone;
  }

  // Format as masked (e.g. +91 97896 ***** or +1560662****5087)
  const clean = rawPhone.replace(/\s+/g, '');
  if (clean.length > 7) {
    const isPlus = clean.startsWith('+');
    const prefix = isPlus ? clean.slice(0, 6) : clean.slice(0, 4);
    const suffix = clean.slice(-2);
    const maskLen = Math.max(3, clean.length - prefix.length - suffix.length);
    return `${prefix}${'*'.repeat(maskLen)}${suffix}`;
  }
  return clean.slice(0, 3) + '*****' + clean.slice(-2);
}

function toggleGlobalPhoneMasking() {
  if (!CRM_STATE.settings) CRM_STATE.settings = {};
  CRM_STATE.settings.maskCustomerNumbers = !(CRM_STATE.settings.maskCustomerNumbers ?? false);
  saveCRMState();
  updateMaskingUI();
  renderCurrentView();
  showToast(
    CRM_STATE.settings.maskCustomerNumbers ? 'Privacy Mode Active' : 'Masking Disabled',
    CRM_STATE.settings.maskCustomerNumbers ? 'Customer phone numbers are now masked.' : 'Full customer phone numbers are now visible.',
    CRM_STATE.settings.maskCustomerNumbers ? 'lock' : 'lock_open',
    CRM_STATE.settings.maskCustomerNumbers ? 'amber' : 'blue'
  );
}

function toggleRevealPhone(customerId) {
  if (REVEALED_CUSTOMERS.has(customerId)) {
    REVEALED_CUSTOMERS.delete(customerId);
  } else {
    REVEALED_CUSTOMERS.add(customerId);
  }
  renderChatHeader();
  renderCustomer360Panel();
  renderInboxConversationList();
}

function updateMaskingUI() {
  const isMasked = CRM_STATE?.settings?.maskCustomerNumbers ?? true;
  const btn = document.getElementById('btn-mask-toggle');
  const icon = document.getElementById('mask-icon');
  const label = document.getElementById('mask-status-label');

  if (btn) {
    if (isMasked) {
      btn.className = 'flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-semibold transition shadow-sm';
    } else {
      btn.className = 'flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition shadow-sm';
    }
  }
  if (icon) icon.innerText = isMasked ? 'lock' : 'lock_open';
  if (label) label.innerText = isMasked ? 'ON' : 'OFF';
}

function renderCurrentView() {
  if (ACTIVE_VIEW === 'inbox') renderInbox();
  else if (ACTIVE_VIEW === 'enquiries') renderEnquiriesTable();
  else if (ACTIVE_VIEW === 'customers') renderCustomersTable();
  else if (ACTIVE_VIEW === 'orders') renderOrdersTable();
  else if (ACTIVE_VIEW === 'dashboard') renderDashboard();
}


// Initialize Realtime WebSocket (Socket.IO) Connection
function initSocketIO() {
  if (typeof io === 'undefined') {
    console.warn('Socket.IO client library not loaded, using fallback sync');
    return;
  }

  try {
    SOCKET_IO = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1500
    });

    SOCKET_IO.on('connect', () => {
      console.log('⚡ Socket.IO Connected to Bridge (ID: ' + SOCKET_IO.id + ')');
      showToast('WebSocket Connected', 'Live WhatsApp synchronization active', 'bolt', 'emerald');
    });

    // Real-time Inbound Message from WhatsApp (Pushed instantly)
    SOCKET_IO.on('whatsapp:inbound', (payload) => {
      console.log('⚡ [Socket.IO Inbound Message Received]:', payload);
      ingestInboundMessage(payload);
    });

    // Real-time Bridge Status Changes
    SOCKET_IO.on('bridge:accounts', (data) => {
      if (data && data.accounts) {
        MULTI_ACCOUNTS_STATE = data.accounts;
        renderMultiAccountsHub();
        const primary = data.accounts[0];
        if (primary && primary.connected_number) {
          CRM_STATE.whatsappAccount.phoneNumber = primary.connected_number;
          saveCRMState();
          updateConfiguredPhoneDisplays();
        }
      }
    });

    SOCKET_IO.on('bridge:status', (statusData) => {
      updateQRBridgeUI(statusData);
    });

    // Real-time Outbound Delivery Ack
    SOCKET_IO.on('whatsapp:sent_ack', (ack) => {
      console.log('⚡ [Socket.IO Outbound Ack]:', ack);
    });

    SOCKET_IO.on('disconnect', () => {
      console.warn('Socket.IO Disconnected from Bridge');
    });

  } catch (e) {
    console.error('Socket.IO Connection Error:', e);
  }
}

// =========================================================================
// REAL-TIME INBOUND MESSAGE INGESTION & DISPATCH ENGINE
// =========================================================================
function ingestInboundMessage(payload, suppressChime = false) {
  if (!payload || !CRM_STATE) return;

  const rawPhone = payload.sender_phone || (payload.sender_jid ? payload.sender_jid.split('@')[0] : '+91 98765 43210');
  const cleanPhone = rawPhone.startsWith('+') ? rawPhone : ('+' + rawPhone);
  const normalizedDigits = cleanPhone.replace(/[^0-9]/g, '');
  const senderName = payload.sender_name || `WhatsApp Customer (${cleanPhone.slice(-4)})`;
  const messageText = payload.message_text || payload.text || '[WhatsApp Message]';
  const timeStr = payload.received_at || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgType = payload.type || 'text';
  const mediaUrl = payload.media_url || null;
  const duration = payload.duration || null;
  const msgTimestamp = payload.timestamp_epoch ? (payload.timestamp_epoch * 1000) : Date.now();

  // 1. Safe Unicode Avatar Extraction (Supports emojis & math bold script characters)
  const nameChars = Array.from(senderName || 'WA');
  const safeAvatar = (nameChars.slice(0, 2).join('')).toUpperCase() || 'WA';

  // 2. Match or Create Customer in CRM_STATE
  let customer = CRM_STATE.customers.find(c => {
    const cPhoneDigits = (c.phone || c.whatsapp || '').replace(/[^0-9]/g, '');
    return (cPhoneDigits.length > 5 && (cPhoneDigits === normalizedDigits || normalizedDigits.endsWith(cPhoneDigits) || cPhoneDigits.endsWith(normalizedDigits))) ||
           (c.jid && payload.sender_jid && c.jid === payload.sender_jid);
  });

  if (!customer) {
    const newCustId = 'cust_' + (normalizedDigits.slice(-8) || Date.now().toString().slice(-6));
    customer = {
      id: newCustId,
      code: `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: senderName,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      jid: payload.sender_jid || '',
      address: 'Online WhatsApp Customer',
      city: 'Direct Inbound',
      customerType: 'Live WhatsApp Lead',
      tags: ['Live WhatsApp', 'Online Lead'],
      totalOrders: 0,
      totalSpend: 0,
      avatar: safeAvatar
    };
    CRM_STATE.customers.unshift(customer);
  } else {
    if (senderName && !senderName.startsWith('WhatsApp Customer') && (customer.name.startsWith('Customer') || customer.name.startsWith('WhatsApp Customer'))) {
      customer.name = senderName;
    }
    if (payload.sender_jid && !customer.jid) {
      customer.jid = payload.sender_jid;
    }
  }

  // 3. Add message to customer's conversation stream
  if (!CRM_STATE.conversations) {
    CRM_STATE.conversations = {};
  }
  if (!CRM_STATE.conversations[customer.id]) {
    CRM_STATE.conversations[customer.id] = [];
  }
  
  // Deduplicate against existing messages
  const existingMsgs = CRM_STATE.conversations[customer.id];
  const isDuplicate = existingMsgs.some(m => 
    (payload.id && m.id === payload.id) ||
    (m.sender === 'customer' && m.text === messageText && Math.abs(msgTimestamp - (m.timestamp || 0)) < 3000)
  );

  if (!isDuplicate) {
    const newMsg = {
      id: payload.id || msgTimestamp,
      sender: 'customer',
      text: messageText,
      time: timeStr,
      status: 'DELIVERED',
      type: msgType,
      media_url: mediaUrl,
      duration: duration,
      timestamp: msgTimestamp
    };
    CRM_STATE.conversations[customer.id].push(newMsg);
  }

  // 4. Match or Create Lead / Query Card
  let query = CRM_STATE.queries.find(q => q.customerId === customer.id);
  if (query) {
    if (!isDuplicate) {
      query.unreadCount = (query.unreadCount || 0) + 1;
    }
    query.lastMessage = `Customer: "${messageText}"`;
    query.status = (query.status === 'CLOSED' || query.status === 'RESOLVED') ? 'NEW' : query.status;
    query.createdAt = timeStr;
    query.lastTimeEpoch = msgTimestamp;
    
    // Move query to top of queries array
    CRM_STATE.queries = [query, ...CRM_STATE.queries.filter(q => q.id !== query.id)];
  } else {
    query = {
      id: `Q-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: customer.id,
      assignedTo: payload.assigned_to || 'UNASSIGNED',
      status: 'NEW',
      priority: payload.priority || 'HIGH',
      queryText: messageText,
      productSku: null,
      createdAt: timeStr,
      unreadCount: 1,
      lastMessage: `Customer: "${messageText}"`,
      lastTimeEpoch: msgTimestamp
    };
    CRM_STATE.queries.unshift(query);
  }

  // 5. Update last poll epoch
  if (payload.timestamp_epoch) {
    LAST_POLL_EPOCH = Math.max(LAST_POLL_EPOCH, payload.timestamp_epoch);
  }

  // 6. Ensure ACTIVE_CUSTOMER_ID is valid
  if (!ACTIVE_CUSTOMER_ID || !CRM_STATE.customers.some(c => c.id === ACTIVE_CUSTOMER_ID)) {
    ACTIVE_CUSTOMER_ID = customer.id;
  }

  // 7. Save state & refresh UI
  saveCRMState();

  // Re-render Views
  if (ACTIVE_VIEW === 'inbox') {
    renderInbox();
  } else if (ACTIVE_VIEW === 'enquiries') {
    if (typeof renderEnquiriesTable === 'function') renderEnquiriesTable();
  } else if (ACTIVE_VIEW === 'dashboard') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }

  // 8. Audio chime & Live notification (if not suppressing initial batch)
  if (!suppressChime && !isDuplicate) {
    if (typeof playChime === 'function') playChime('inbound');
    showToast(
      'New WhatsApp Message',
      `${customer.name}: "${messageText.length > 50 ? messageText.slice(0, 50) + '...' : messageText}"`,
      'chat',
      'emerald'
    );
  }
}

// Background & Immediate REST message polling loop
function syncInboundMessagesNow(isInitial = false) {
  const since = isInitial ? 0 : LAST_POLL_EPOCH;
  return fetch(`api.php?action=get_inbound_messages&since=${since}`)
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success' && res.messages && res.messages.length > 0) {
        res.messages.forEach(msg => ingestInboundMessage(msg, isInitial));
        if (res.server_time) {
          LAST_POLL_EPOCH = Math.max(LAST_POLL_EPOCH, res.server_time);
        }
        if (ACTIVE_VIEW === 'inbox') {
          renderInbox();
        }
      }
    })
    .catch(() => {});
}

function startRealtimeMessageSync() {
  // 1. Initial immediate sync
  syncInboundMessagesNow(true);

  // 2. Continuous background sync every 2 seconds
  setInterval(() => {
    syncInboundMessagesNow(false);
  }, 2000);
}

// Inbound Simulator Modal Controllers
function openInboundSimulatorModal() {
  openModal('modal-inbound-simulator');
}

function handleInboundSimulationSubmit(event) {
  event.preventDefault();
  const name = document.getElementById('sim-customer-name')?.value || 'New Customer';
  const phone = document.getElementById('sim-customer-phone')?.value || '+91 98401 23456';
  const text = document.getElementById('sim-message-text')?.value || 'Hello from WhatsApp';
  const type = document.getElementById('sim-message-type')?.value || 'text';
  const priority = document.getElementById('sim-message-priority')?.value || 'HIGH';
  const slot = document.getElementById('sim-account-slot')?.value || 'account_1';

  const simulatedPayload = {
    sender_name: name,
    sender_phone: phone,
    sender_jid: phone.replace(/[^0-9]/g, '') + '@s.whatsapp.net',
    message_text: text,
    type: type,
    media_url: null,
    duration: type === 'audio' ? 8 : null,
    account_id: slot,
    received_on_number: CRM_STATE?.whatsappAccount?.phoneNumber || '+91 97896 60115',
    priority: priority,
    assigned_to: 'UNASSIGNED',
    source: 'INBOUND_SIMULATOR',
    timestamp_epoch: Math.floor(Date.now() / 1000),
    received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  // Ingest locally
  ingestInboundMessage(simulatedPayload, false);

  // Also post to backend api.php
  fetch('api.php?action=receive_message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(simulatedPayload)
  }).catch(() => {});

  closeModal('modal-inbound-simulator');
}

// Automated Deduplication Engine: Guarantees 1 Customer = 1 Card & 1 Unified Thread
function cleanupAndDeduplicateCRMState() {
  if (!CRM_STATE || !CRM_STATE.customers) return;

  // 1. Filter out mock system test customers
  CRM_STATE.customers = CRM_STATE.customers.filter(c =>
    c.name !== 'System' &&
    c.name !== 'GRM Linked WhatsApp Device' &&
    !c.name.startsWith('WhatsApp Linked')
  );

  // 2. Deduplicate customers by normalized phone / whatsapp
  const seenPhones = new Map();
  const dedupedCustomers = [];

  CRM_STATE.customers.forEach(cust => {
    const clean = (cust.phone || cust.whatsapp || '').replace(/[^0-9]/g, '');
    if (!seenPhones.has(clean)) {
      seenPhones.set(clean, cust);
      dedupedCustomers.push(cust);
    } else {
      const existing = seenPhones.get(clean);
      // Merge conversation history into primary customer
      if (CRM_STATE.conversations[cust.id]) {
        if (!CRM_STATE.conversations[existing.id]) CRM_STATE.conversations[existing.id] = [];
        CRM_STATE.conversations[existing.id] = CRM_STATE.conversations[existing.id].concat(CRM_STATE.conversations[cust.id]);
        delete CRM_STATE.conversations[cust.id];
      }
    }
  });
  CRM_STATE.customers = dedupedCustomers;

  // 3. Deduplicate queries: exactly ONE active query per customer
  const seenQueryCustomers = new Set();
  const dedupedQueries = [];

  CRM_STATE.queries.forEach(q => {
    const custExists = CRM_STATE.customers.some(c => c.id === q.customerId);
    if (!custExists) return;

    if (!seenQueryCustomers.has(q.customerId)) {
      seenQueryCustomers.add(q.customerId);
      dedupedQueries.push(q);
    }
  });
  CRM_STATE.queries = dedupedQueries;

  saveCRMState();
}



// Load State from LocalStorage or Initialise
function initCRMState() {
  const saved = localStorage.getItem('GRM_CRM_STATE_V2_5');
  if (saved) {
    try {
      CRM_STATE = JSON.parse(saved);
      if (!CRM_STATE.whatsappAccount) {
        CRM_STATE.whatsappAccount = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.whatsappAccount));
      } else if (CRM_STATE.whatsappAccount.phoneNumber === '+91 98765 43210') {
        CRM_STATE.whatsappAccount.phoneNumber = '+91 97896 60115';
      }
      if (!CRM_STATE.dailyMessageTarget) {
        CRM_STATE.dailyMessageTarget = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.dailyMessageTarget));
      }
      if (Array.isArray(CRM_STATE.staffList)) {
        CRM_STATE.staffList.forEach((s, idx) => {
          if (typeof s.dailyQuota === 'undefined') s.dailyQuota = idx === 2 ? 60 : 70;
          if (typeof s.todayHandled === 'undefined') s.todayHandled = idx === 0 ? 18 : (idx === 1 ? 14 : 8);
          if (!s.email) s.email = `${s.name.toLowerCase().replace(/\s+/g, '.')}@grmgarments.com`;
          if (!s.phone) s.phone = `+91 98450 1122${idx + 1}`;
          if (!s.status) s.status = 'ACTIVE';
        });
      }
    } catch (e) {
      CRM_STATE = JSON.parse(JSON.stringify(INITIAL_CRM_DATA));
    }
  } else {
    CRM_STATE = JSON.parse(JSON.stringify(INITIAL_CRM_DATA));
    saveCRMState();
  }

  // Load from backend config if available
  fetch('api.php?action=get_config')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success' && res.data && res.data.phone_number) {
        CRM_STATE.whatsappAccount.phoneNumber = formatPhoneNumberPretty(res.data.phone_number);
        CRM_STATE.whatsappAccount.businessName = res.data.business_name || CRM_STATE.whatsappAccount.businessName;
        CRM_STATE.whatsappAccount.displayName = res.data.display_name || CRM_STATE.whatsappAccount.displayName;
        updateConfiguredPhoneDisplays();
        saveCRMState();
      }
    })
    .catch(() => { });

  cleanupAndDeduplicateCRMState();
  updateConfiguredPhoneDisplays();
  initSocketIO();
  fetchQRBridgeStatus();
  startRealtimeMessageSync();
}

function saveCRMState() {
  localStorage.setItem('GRM_CRM_STATE_V2_5', JSON.stringify(CRM_STATE));
  updateBadgeCounters();
  updateConfiguredPhoneDisplays();
}

function getAvailableWhatsAppAccounts() {
  const defaultAccounts = [
    {
      id: 'account_1',
      label: 'Line 1: Primary WhatsApp',
      status: 'CONNECTED',
      connected_number: '+91 97896 60115',
      brand_name: 'GRM Garments Primary'
    },
    {
      id: 'account_2',
      label: 'Line 2: Customer Support',
      status: 'CONNECTED',
      connected_number: '+91 98765 43210',
      brand_name: 'Blue Berry Support'
    },
    {
      id: 'account_3',
      label: 'Line 3: Sales & Orders',
      status: 'CONNECTED',
      connected_number: '+91 98450 99887',
      brand_name: 'GRM Wholesale Desk'
    }
  ];

  if (!MULTI_ACCOUNTS_STATE || MULTI_ACCOUNTS_STATE.length === 0) {
    return defaultAccounts;
  }

  return MULTI_ACCOUNTS_STATE.map((acc, idx) => {
    const fallback = defaultAccounts[idx] || {
      id: acc.id,
      label: `Line ${idx + 1}: WhatsApp Business`,
      status: 'CONNECTED',
      connected_number: `+91 9789${idx} 54321`,
      brand_name: 'GRM Garments'
    };

    const isConnected = acc.status === 'CONNECTED' || (acc.connected_number && !acc.qr_image);

    return {
      id: acc.id,
      label: acc.label || fallback.label,
      status: isConnected ? 'CONNECTED' : (acc.status || 'CONNECTED'),
      connected_number: acc.connected_number || fallback.connected_number,
      brand_name: acc.brand_name || fallback.brand_name
    };
  });
}

function togglePhoneSwitcherDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('phone-switcher-dropdown');
  const arrow = document.getElementById('phone-dropdown-arrow');
  if (!dropdown) return;

  const isHidden = dropdown.classList.contains('hidden');
  if (isHidden) {
    renderPhoneSwitcherDropdown();
    dropdown.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
  } else {
    closePhoneSwitcherDropdown();
  }
}

function closePhoneSwitcherDropdown() {
  const dropdown = document.getElementById('phone-switcher-dropdown');
  const arrow = document.getElementById('phone-dropdown-arrow');
  if (dropdown) dropdown.classList.add('hidden');
  if (arrow) arrow.style.transform = 'rotate(0deg)';
}

function renderPhoneSwitcherDropdown() {
  const listContainer = document.getElementById('phone-dropdown-accounts-list');
  const countBadge = document.getElementById('dropdown-connected-count');
  if (!listContainer) return;

  const accounts = getAvailableWhatsAppAccounts();
  const currentPhone = (CRM_STATE?.whatsappAccount?.phoneNumber || '+91 97896 60115').replace(/\s+/g, '');
  
  if (countBadge) {
    const conn = accounts.filter(a => a.status === 'CONNECTED').length;
    countBadge.innerText = `${conn} Active Lines`;
  }

  listContainer.innerHTML = accounts.map((acc, index) => {
    const accCleanPhone = (acc.connected_number || '').replace(/\s+/g, '');
    const isCurrent = (acc.id === ACTIVE_SEND_ACCOUNT_ID) || (accCleanPhone === currentPhone);
    const isConn = acc.status === 'CONNECTED';
    const displayPhone = acc.connected_number || '+91 97896 60115';

    return `
      <div onclick="switchActiveWhatsAppLine('${acc.id}', '${displayPhone}', '${acc.label || 'Line ' + (index+1)}')" class="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition flex items-center justify-between group ${isCurrent ? 'bg-emerald-50/80 border border-emerald-300' : ''}">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg ${isCurrent ? 'bg-brand-wa text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'} flex items-center justify-center font-bold text-xs shrink-0">
            <span class="material-symbols-outlined text-[18px]">${isCurrent ? 'check_circle' : 'phone_android'}</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-slate-900 text-xs truncate">${acc.label || ('WhatsApp Line #' + (index + 1))}</span>
              ${isCurrent ? '<span class="text-[9px] bg-brand-wa text-white px-1.5 py-0.2 rounded font-extrabold">ACTIVE</span>' : ''}
            </div>
            <p class="font-mono text-[11px] font-bold ${isCurrent ? 'text-emerald-700' : 'text-slate-500'}">${displayPhone}</p>
          </div>
        </div>
        <div class="text-right shrink-0">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold ${isConn ? 'text-emerald-600' : 'text-amber-600'}">
            <span class="w-1.5 h-1.5 rounded-full ${isConn ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            ${isConn ? 'Connected' : 'Scan QR'}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

function switchActiveWhatsAppLine(accountId, phoneNumber, label) {
  ACTIVE_SEND_ACCOUNT_ID = accountId;
  if (!CRM_STATE.whatsappAccount) {
    CRM_STATE.whatsappAccount = {};
  }
  CRM_STATE.whatsappAccount.phoneNumber = phoneNumber;
  CRM_STATE.whatsappAccount.status = 'CONNECTED';
  saveCRMState();
  updateConfiguredPhoneDisplays();
  closePhoneSwitcherDropdown();

  // If in settings view, refresh multi-accounts hub
  if (ACTIVE_VIEW === 'settings') {
    renderMultiAccountsHub();
  }

  // Refresh inbox conversation list & header
  if (typeof renderInboxConversationList === 'function') {
    renderInboxConversationList();
  }
  if (typeof renderChatHeader === 'function') {
    renderChatHeader();
  }

  if (typeof playChime === 'function') playChime('order');
  showToast(
    'WhatsApp Line Switched',
    `Active sending number is now: ${phoneNumber} (${label || 'WhatsApp Line'}).`,
    'swap_horiz',
    'emerald'
  );
}

// Global click listener to dismiss phone dropdown when clicking elsewhere
document.addEventListener('click', (e) => {
  const wrapper = document.getElementById('header-phone-switcher-wrapper');
  if (wrapper && !wrapper.contains(e.target)) {
    closePhoneSwitcherDropdown();
  }
});

function formatPhoneNumberPretty(phone) {
  if (!phone) return '+91 97896 60115';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return phone.startsWith('+') ? phone : ('+' + phone);
}

// Update all UI elements displaying the WhatsApp Business Phone Number
function updateConfiguredPhoneDisplays() {
  if (!CRM_STATE || !CRM_STATE.whatsappAccount) return;
  const rawPhone = CRM_STATE.whatsappAccount.phoneNumber || '+91 97896 60115';
  const phone = formatPhoneNumberPretty(rawPhone);

  // Update in topbar/sidebar indicators
  document.querySelectorAll('.configured-business-phone').forEach(el => {
    el.innerText = phone;
  });

  const sidebarPhone = document.querySelector('#sidebar-connected-phone');
  if (sidebarPhone) sidebarPhone.innerText = phone;

  const headerLabel = document.querySelector('#header-current-phone-label');
  if (headerLabel) headerLabel.innerText = phone;

  const cfgInput = document.querySelector('#cfg-phone-number');
  if (cfgInput && !cfgInput.value) cfgInput.value = phone;

  const pageSub = document.querySelector('#page-subtitle');
  if (pageSub && ACTIVE_VIEW === 'inbox') {
    pageSub.innerText = `Live chats for ${phone} with instant staff assignment & order booking`;
  }
}

// =========================================================================
// 1. NAVIGATION & VIEW SWITCHER
// =========================================================================
// =========================================================================
// 1. NAVIGATION & VIEW SWITCHER (RBAC ENFORCED)
// =========================================================================
function switchView(viewName) {
  // Enforce Role-Based Access Control: Admin-only modules
  const adminOnlyViews = ['settings', 'backup', 'staff', 'audit', 'analytics'];
  if (ACTIVE_ROLE !== 'admin' && adminOnlyViews.includes(viewName)) {
    showToast('Access Restricted', 'Super Admin privileges are required to access this module.', 'lock', 'rose');
    viewName = 'inbox';
  }

  ACTIVE_VIEW = viewName;
  const views = ['inbox', 'enquiries', 'dashboard', 'catalog', 'orders', 'followups', 'customers', 'staff', 'audit', 'analytics', 'settings', 'backup'];

  views.forEach(v => {
    const el = document.getElementById(`view-${v}`);
    const navBtn = document.getElementById(`nav-${v}`);
    if (el) {
      if (v === viewName) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    if (navBtn) {
      if (v === viewName) {
        navBtn.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition bg-brand-wa text-white font-semibold shadow-sm";
      } else {
        navBtn.className = "w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-slate-300 hover:text-white hover:bg-surface-sidebarActive group";
      }
    }
  });

  // Update Topbar page titles
  const titles = {
    inbox: { title: 'WhatsApp Inbox & Customer Queue', sub: `Live chats for ${CRM_STATE?.whatsappAccount?.phoneNumber || 'Business WhatsApp'} with instant staff assignment & order booking` },
    enquiries: { title: 'Customer Enquiries & Staff Assignment Hub', sub: 'Admin control room to distribute new customer leads to staff' },
    dashboard: { title: 'WhatsApp Operations Dashboard', sub: 'Real-time overview of inquiries, active sessions, and communication health' },
    catalog: { title: 'Garment Product Catalog & Live Stock', sub: 'Live available stock calculator and 1-click WhatsApp card sharing' },
    orders: { title: 'WhatsApp Sales Orders & Reservations', sub: 'Direct orders booked from WhatsApp chats with reserved inventory' },
    followups: { title: 'Customer Follow-up Scheduler', sub: 'Automated reminders to prevent lost customer enquiries' },
    customers: { title: 'Customer 360 & Tag Directory', sub: 'Profiles, purchase history, and communication preferences' },
    staff: { title: 'Staff & Team Management Hub', sub: 'Onboard team members, assign operational roles & permissions, and monitor workloads' },
    audit: { title: 'System Audit Trail & Security Logs', sub: 'Tamper-proof record of every staff assignment and order update' },
    analytics: { title: 'Staff Performance Analytics & KPIs', sub: 'Factual metrics on response times, volume handled, and conversions' },
    settings: { title: 'WhatsApp Business Settings & Phone Configuration', sub: 'Set your primary WhatsApp Business number for dynamic live message routing' },
    backup: { title: 'Data Backup & Recovery Hub', sub: 'Full database snapshot export, restore, and zero-data-loss protection (Section 53)' }
  };

  if (titles[viewName]) {
    const pTitle = document.getElementById('page-title');
    const pSub = document.getElementById('page-subtitle');
    if (pTitle) pTitle.innerText = titles[viewName].title;
    if (pSub) pSub.innerText = titles[viewName].sub;
  }

  // Trigger specific view renders
  if (viewName === 'inbox') renderInbox();
  if (viewName === 'enquiries') renderEnquiriesTable();
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'catalog') renderCatalogGrid('');
  if (viewName === 'orders') renderOrdersTable();
  if (viewName === 'followups') renderFollowupsCards();
  if (viewName === 'customers') renderCustomersGrid();
  if (viewName === 'staff') renderStaffView();
  if (viewName === 'audit') renderAuditTable();
  if (viewName === 'analytics') renderAnalyticsView();
  if (viewName === 'settings') renderWhatsAppSettings();
  if (viewName === 'backup') renderBackupView();
}

// =========================================================================
// 2. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
// =========================================================================

// Initialize user session from storage or redirect to login.html
function initAuthSystem() {
  const sessionStr = localStorage.getItem('GRM_CRM_SESSION') || sessionStorage.getItem('GRM_CRM_SESSION');

  if (sessionStr) {
    try {
      CURRENT_USER = JSON.parse(sessionStr);
      applyRoleBasedAccessControl(CURRENT_USER);
      return;
    } catch (e) {
      console.error('Session parse error:', e);
    }
  }

  // If no saved session, redirect to separate login page
  const currentPath = window.location.pathname.toLowerCase();
  if (!currentPath.endsWith('login.html') && !currentPath.endsWith('login.php')) {
    window.location.href = 'login.html';
  }
}

// Toggle password text visibility
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  const icon = btn.querySelector('.material-symbols-outlined');
  if (icon) icon.innerText = isPass ? 'visibility_off' : 'visibility';
}

// Handle login submit
function handleLoginSubmit(event) {
  if (event) event.preventDefault();

  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  const rememberCheckbox = document.getElementById('login-remember');
  const errorBox = document.getElementById('login-error-box');
  const errorMsg = document.getElementById('login-error-msg');

  if (!usernameInput || !passwordInput) return;

  const u = usernameInput.value.trim().toLowerCase();
  const p = passwordInput.value.trim();

  let matchedAccount = null;

  // 1. Check built-in account dictionary
  if (DEFAULT_ACCOUNTS[u]) {
    const acc = DEFAULT_ACCOUNTS[u];
    if (acc.password === p) {
      matchedAccount = acc;
    }
  }

  // 2. Check dynamic staff list created from staff management tab
  if (!matchedAccount && CRM_STATE && CRM_STATE.staffList) {
    const staff = CRM_STATE.staffList.find(s =>
      s.id.toLowerCase() === u ||
      (s.email && s.email.toLowerCase().startsWith(u)) ||
      s.name.toLowerCase() === u ||
      s.name.toLowerCase().split(' ')[0] === u
    );

    if (staff) {
      const staffPass = staff.password || 'staff123';
      if (staffPass === p) {
        matchedAccount = {
          username: u,
          password: p,
          role: staff.id,
          staffId: staff.id,
          name: staff.name,
          title: staff.role,
          avatar: staff.avatar || staff.name.substring(0, 2).toUpperCase()
        };
      }
    }
  }

  if (matchedAccount) {
    if (errorBox) errorBox.classList.add('hidden');
    CURRENT_USER = matchedAccount;

    if (rememberCheckbox && rememberCheckbox.checked) {
      localStorage.setItem('GRM_CRM_SESSION', JSON.stringify(CURRENT_USER));
    } else {
      sessionStorage.setItem('GRM_CRM_SESSION', JSON.stringify(CURRENT_USER));
    }

    applyRoleBasedAccessControl(CURRENT_USER);

    playChime('order');
    showToast(
      'Login Successful',
      `Welcome, ${CURRENT_USER.name}! Loaded your ${CURRENT_USER.role === 'admin' ? 'Super Admin Full Control' : 'Staff'} panel.`,
      CURRENT_USER.role === 'admin' ? 'admin_panel_settings' : 'badge',
      CURRENT_USER.role === 'admin' ? 'purple' : 'emerald'
    );
  } else {
    if (errorBox) {
      errorBox.classList.remove('hidden');
      if (errorMsg) errorMsg.innerText = 'Invalid username or password. Check credentials or use 1-Click Fast Login below.';
    }
  }
}

// 1-Click fast login helper
function quickLogin(accountKey) {
  const acc = DEFAULT_ACCOUNTS[accountKey];
  if (!acc) return;

  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  if (usernameInput) usernameInput.value = acc.username;
  if (passwordInput) passwordInput.value = acc.password;

  handleLoginSubmit(null);
}

// Logout handler
function handleLogout() {
  CURRENT_USER = null;
  localStorage.removeItem('GRM_CRM_SESSION');
  sessionStorage.removeItem('GRM_CRM_SESSION');
  localStorage.removeItem('GRM_REMEMBER_FLAG');

  // Notify backend auth API to clear PHP session
  fetch('auth.php?action=logout').catch(() => {});

  // Redirect cleanly to dedicated standalone login page
  window.location.href = 'login.html';
}

// Apply granular Role-Based Access Control and update UI
function applyRoleBasedAccessControl(user) {
  if (!user) return;
  ACTIVE_ROLE = user.role || 'admin';

  const isAdmin = user.role === 'admin';

  const roleBadge = document.getElementById('current-role-badge');
  const avatarInitials = document.getElementById('user-avatar-initials');
  const userDisplayName = document.getElementById('user-display-name');
  const userDisplaySub = document.getElementById('user-display-sub');

  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  const sidebarName = document.getElementById('sidebar-user-name');
  const sidebarRole = document.getElementById('sidebar-user-role');

  const staffBanner = document.getElementById('staff-workstation-banner');
  const staffBannerName = document.getElementById('staff-banner-name');
  const staffBannerRole = document.getElementById('staff-banner-role');
  const staffBannerId = document.getElementById('staff-banner-id');

  // 1. Update Profile Badges and Avatar
  if (roleBadge) {
    roleBadge.innerText = isAdmin ? 'Super Admin' : 'Staff Workstation';
    roleBadge.className = isAdmin
      ? 'text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-400/30'
      : 'text-[10px] bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-bold border border-blue-400/30';
  }

  if (avatarInitials) {
    avatarInitials.innerText = user.avatar || (isAdmin ? 'SA' : 'ST');
    avatarInitials.className = isAdmin
      ? 'w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm'
      : 'w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-sm';
  }

  if (userDisplayName) userDisplayName.innerText = user.name || (isAdmin ? 'Admin Manager' : 'Staff Member');
  if (userDisplaySub) userDisplaySub.innerText = isAdmin ? 'Full System Access' : (user.title || user.role);

  if (sidebarAvatar) sidebarAvatar.innerText = user.avatar || (isAdmin ? 'SA' : 'ST');
  if (sidebarName) sidebarName.innerText = user.name || (isAdmin ? 'Super Admin' : 'Staff Member');
  if (sidebarRole) sidebarRole.innerText = isAdmin ? 'Full Control Panel' : (user.title || user.role);

  // 2. Control Staff Workstation Info Banner
  if (staffBanner) {
    if (isAdmin) {
      staffBanner.classList.add('hidden');
    } else {
      staffBanner.classList.remove('hidden');
      if (staffBannerName) staffBannerName.innerText = user.name;
      if (staffBannerRole) staffBannerRole.innerText = user.title || user.role;
      if (staffBannerId) staffBannerId.innerText = user.staffId || user.role;

      // Update Live Daily Message Allocation Quota Indicator on Staff Banner
      const staffBannerQuota = document.getElementById('staff-banner-quota');
      const staffBannerProgressBar = document.getElementById('staff-banner-progress-bar');
      const staffMember = (CRM_STATE.staffList || []).find(s => s.id === (user.staffId || user.id || user.role));
      const quota = staffMember ? (staffMember.dailyQuota || 70) : 70;
      const handled = staffMember ? (staffMember.todayHandled || 0) : 0;
      const pct = quota > 0 ? Math.min(100, Math.round((handled / quota) * 100)) : 0;

      if (staffBannerQuota) {
        staffBannerQuota.innerText = `${handled} / ${quota} msgs (${pct}%)`;
      }
      if (staffBannerProgressBar) {
        staffBannerProgressBar.style.width = `${pct}%`;
        if (pct >= 100) {
          staffBannerProgressBar.className = 'h-full bg-rose-500 rounded-full transition-all duration-500';
        } else if (pct >= 80) {
          staffBannerProgressBar.className = 'h-full bg-amber-400 rounded-full transition-all duration-500';
        } else {
          staffBannerProgressBar.className = 'h-full bg-emerald-400 rounded-full transition-all duration-500';
        }
      }
    }
  }

  // 3. Role-Based Navigation Filtering
  // Hide Admin-only modules from staff sidebar: Settings, Backup, Staff Hub, Analytics, Audit
  document.querySelectorAll('.admin-only-nav').forEach(el => {
    if (isAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // Hide Admin-only header controls: Masking toggle, phone settings button, inbound simulator
  document.querySelectorAll('.admin-only-ui').forEach(el => {
    if (isAdmin) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });

  // 4. In Staff Mode, default filter Inbox to 'my' assigned queue
  if (!isAdmin) {
    setInboxFilter('my');
  } else {
    setInboxFilter('all');
  }

  // 5. If currently on a restricted view, redirect to inbox
  const adminOnlyViews = ['settings', 'backup', 'staff', 'audit', 'analytics'];
  if (!isAdmin && adminOnlyViews.includes(ACTIVE_VIEW)) {
    ACTIVE_VIEW = 'inbox';
  }

  switchView(ACTIVE_VIEW);
}

// =========================================================================
// 3. INBOX RENDERING (3-PANEL VIEW)
// =========================================================================
function setInboxFilter(filter) {
  INBOX_FILTER = filter;
  ['all', 'unassigned', 'my', 'urgent'].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (btn) {
      if (f === filter) {
        btn.className = "px-2.5 py-1 rounded-lg font-semibold bg-brand-wa text-white text-[11px] shrink-0 shadow-sm";
      } else {
        btn.className = "px-2.5 py-1 rounded-lg font-semibold bg-white text-slate-600 hover:bg-slate-200 border border-slate-200 text-[11px] shrink-0";
      }
    }
  });
  renderInboxConversationList();
}

function renderInbox() {
  if (!CRM_STATE) return;
  renderInboxConversationList();
  renderChatHeader();
  renderChatMessages();
  renderCustomer360Panel();
  updateBadgeCounters();
}

function renderInboxConversationList() {
  const container = document.getElementById('conversation-list-container');
  if (!container || !CRM_STATE || !CRM_STATE.customers) return;

  const searchQuery = (document.getElementById('chat-search-input')?.value || '').toLowerCase();

  // Deduplication Engine: Exactly 1 item per customer!
  let customerCards = [];

  (CRM_STATE.customers || []).forEach(cust => {
    if (cust.name === 'System' || cust.name === 'GRM Linked WhatsApp Device' || cust.name.startsWith('WhatsApp Linked')) return;

    const query = CRM_STATE.queries.find(q => q.customerId === cust.id);
    const staff = query ? CRM_STATE.staffList.find(s => s.id === query.assignedTo) : null;
    const conv = CRM_STATE.conversations[cust.id] || [];
    const lastMsgObj = conv.length > 0 ? conv[conv.length - 1] : null;

    let lastText = 'No messages yet';
    let timeDisplay = query ? query.createdAt : 'Recent';
    let lastTimeEpoch = lastMsgObj ? (lastMsgObj.id || 0) : 0;

    if (lastMsgObj) {
      lastText = (lastMsgObj.sender === 'staff' ? 'Staff: ' : 'Customer: ') + `"${lastMsgObj.text.substring(0, 38)}..."`;
      timeDisplay = lastMsgObj.time || timeDisplay;
    } else if (query) {
      lastText = query.lastMessage || query.queryText;
    }

    customerCards.push({
      customerId: cust.id,
      customer: cust,
      queryId: query ? query.id : ('Q-' + cust.id),
      assignedTo: query ? query.assignedTo : 'UNASSIGNED',
      staff: staff,
      priority: query ? query.priority : 'NORMAL',
      lastMessage: lastText,
      createdAt: timeDisplay,
      unreadCount: query ? (query.unreadCount || 0) : 0,
      lastTimeEpoch: lastTimeEpoch
    });
  });

  // Sort by latest message/activity timestamp (most recent at top)
  customerCards.sort((a, b) => b.lastTimeEpoch - a.lastTimeEpoch);

  // Filter based on active filter tab
  if (INBOX_FILTER === 'unassigned') {
    customerCards = customerCards.filter(c => c.assignedTo === 'UNASSIGNED');
  } else if (INBOX_FILTER === 'my') {
    if (ACTIVE_ROLE !== 'admin') {
      customerCards = customerCards.filter(c => c.assignedTo === ACTIVE_ROLE);
    }
  } else if (INBOX_FILTER === 'urgent') {
    customerCards = customerCards.filter(c => c.priority === 'URGENT');
  }

  // Search filter
  if (searchQuery) {
    customerCards = customerCards.filter(item =>
      (item.customer && item.customer.name.toLowerCase().includes(searchQuery)) ||
      (item.customer && item.customer.phone.includes(searchQuery)) ||
      item.queryId.toLowerCase().includes(searchQuery) ||
      item.lastMessage.toLowerCase().includes(searchQuery)
    );
  }

  if (customerCards.length === 0) {
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400">
        <span class="material-symbols-outlined text-[36px] text-slate-300">chat_bubble_outline</span>
        <p class="text-xs font-semibold mt-2">No conversations in this filter</p>
        <button onclick="openInboundSimulatorModal()" class="mt-3 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition">
          + Simulate Inbound WhatsApp
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = customerCards.map(item => {
    const isSelected = item.customerId === ACTIVE_CUSTOMER_ID;
    const isUnassigned = item.assignedTo === 'UNASSIGNED';

    // Priority badge
    let priorityBadge = '';
    if (item.priority === 'URGENT') priorityBadge = `<span class="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-200">URGENT</span>`;
    else if (item.priority === 'HIGH') priorityBadge = `<span class="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200">HIGH</span>`;

    return `
      <div onclick="selectCustomerChat('${item.customerId}')" class="p-3.5 cursor-pointer transition flex items-start gap-3 hover:bg-slate-50 relative ${isSelected ? 'bg-emerald-50/70 border-l-4 border-brand-wa shadow-sm' : ''}">
        <!-- Avatar -->
        <div class="relative shrink-0">
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-900 text-white font-bold text-xs flex items-center justify-center">
            ${item.customer ? item.customer.avatar : 'CU'}
          </div>
          ${isUnassigned ? `
            <span class="absolute -top-1 -right-1 flex h-3 w-3">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-amber-500 border-2 border-white"></span>
            </span>
          ` : `
            <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
          `}
        </div>

        <!-- Chat Details -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between">
            <h4 class="text-xs font-bold text-slate-800 truncate">${item.customer ? item.customer.name : 'Customer'}</h4>
            <span class="text-[10px] text-slate-400 font-medium">${item.createdAt}</span>
          </div>

          <p class="text-xs text-slate-600 truncate mt-0.5 font-medium">${item.lastMessage}</p>

          <div class="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-[10px] bg-slate-100 text-slate-600 font-mono font-semibold px-1.5 py-0.2 rounded">${item.queryId}</span>
              ${priorityBadge}
            </div>

            <!-- Staff Assignment Tag -->
            ${isUnassigned ? `
              <button onclick="event.stopPropagation(); openStaffAssignModal('${item.queryId}')" class="text-[10px] bg-amber-500 hover:bg-amber-600 text-white px-2 py-0.5 rounded-full font-bold shadow-sm flex items-center gap-0.5">
                <span class="material-symbols-outlined text-[12px]">person_add</span> Assign
              </button>
            ` : `
              <span class="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px] text-emerald-600">badge</span>
                ${item.staff ? item.staff.name.split(' ')[0] : 'Staff'}
              </span>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function selectCustomerChat(customerId) {
  ACTIVE_CUSTOMER_ID = customerId;
  renderInbox();
}

function renderChatHeader() {
  const bar = document.getElementById('chat-header-bar');
  if (!bar) return;

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);
  const staff = query ? CRM_STATE.staffList.find(s => s.id === query.assignedTo) : null;
  const isUnassigned = query && query.assignedTo === 'UNASSIGNED';

  if (!customer) {
    bar.innerHTML = `<p class="text-xs text-slate-400">Select a conversation to start chatting</p>`;
    return;
  }

  const isRevealed = REVEALED_CUSTOMERS.has(customer.id);
  const displayPhone = formatDisplayPhone(customer.whatsapp || customer.phone, customer.id);

  bar.innerHTML = `
    <div class="flex items-center gap-2.5 min-w-0">
      <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-dark to-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
        ${customer.avatar}
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <h3 class="font-bold text-xs sm:text-sm text-slate-900 truncate max-w-[140px] sm:max-w-[200px]" title="${customer.name}">${customer.name}</h3>
          <span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full shrink-0">${customer.customerType}</span>
        </div>
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
          <span class="font-mono text-emerald-700 font-bold">${displayPhone}</span>
          <button onclick="toggleRevealPhone('${customer.id}')" class="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition inline-flex items-center" title="${isRevealed ? 'Hide / Mask Number' : 'Reveal Number (Admin / Authorized Staff)'}">
            <span class="material-symbols-outlined text-[14px]">${isRevealed ? 'visibility_off' : 'visibility'}</span>
          </button>
          <span class="text-slate-300">&bull;</span>
          <span class="font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded text-[10px]">${query ? query.id : 'No Query'}</span>
        </div>
      </div>
    </div>

    <!-- Staff Assignment Actions in Header -->
    <div class="flex items-center gap-2 shrink-0">
      ${isUnassigned ? `
        <button onclick="openStaffAssignModal('${query.id}')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 animate-pulse">
          <span class="material-symbols-outlined text-[15px]">person_add</span>
          <span class="hidden sm:inline">Assign Staff</span>
          <span class="sm:hidden">Assign</span>
        </button>
      ` : `
        <div class="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span class="text-slate-500 hidden sm:inline">Handled by:</span>
          <span class="font-bold text-slate-800">${staff ? staff.name.split(' ')[0] : 'Assigned'}</span>
          ${ACTIVE_ROLE === 'admin' ? `
            <button onclick="openStaffAssignModal('${query.id}')" class="text-brand-wa hover:underline font-bold text-[11px] ml-1">Reassign</button>
          ` : ''}
        </div>
      `}
      
      <a href="https://wa.me/${(customer.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="p-1.5 text-slate-600 hover:text-brand-wa hover:bg-emerald-50 rounded-lg transition" title="Open Native WhatsApp Web">
        <span class="material-symbols-outlined text-[18px]">open_in_new</span>
      </a>
    </div>
  `;
}

function renderChatMessages() {
  const stream = document.getElementById('chat-messages-stream');
  if (!stream) return;

  const messages = CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] || [];

  if (messages.length === 0) {
    stream.innerHTML = `
      <div class="h-full flex items-center justify-center text-center text-slate-400">
        <div>
          <span class="material-symbols-outlined text-[40px] text-slate-300">chat</span>
          <p class="text-xs mt-2">No messages recorded in this chat yet</p>
        </div>
      </div>
    `;
    return;
  }

  stream.innerHTML = `
    <!-- Encryption & Source of truth Notice -->
    <div class="flex justify-center my-2">
      <div class="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
        <span class="material-symbols-outlined text-[14px]">lock</span>
        <span>Connected to Business Number: <strong>${CRM_STATE.whatsappAccount.phoneNumber}</strong> &bull; GRM Central Record</span>
      </div>
    </div>
  ` + messages.map((msg, idx) => {
    const isOut = msg.sender === 'staff';
    const msgId = msg.id || ('msg_' + idx);
    const isAudio = msg.type === 'audio' || (msg.media_url && msg.media_url.includes('audio')) || (msg.text && (msg.text.includes('Voice Message') || msg.text.includes('[WhatsApp Message]')));
    const isImage = msg.type === 'image' || (msg.media_url && msg.media_url.startsWith('data:image'));
    const duration = msg.duration || 12;

    let contentHtml = '';

    if (isAudio) {
      const audioSrc = msg.media_url || '';
      contentHtml = `
        <div class="space-y-2 py-1">
          <div class="flex items-center gap-3">
            <!-- Play/Pause Button -->
            <button onclick="toggleAudioPlay('${msgId}')" id="btn-play-${msgId}" class="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white flex items-center justify-center shadow-md transition shrink-0">
              <span class="material-symbols-outlined text-[24px]" id="icon-${msgId}">play_arrow</span>
            </button>

            <!-- Waveform & Slider -->
            <div class="flex-1 min-w-[190px]">
              <div class="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                <span class="flex items-center gap-1 text-emerald-700">
                  <span class="material-symbols-outlined text-[14px]">mic</span> WhatsApp Voice Note
                </span>
                <span id="time-${msgId}" class="font-mono text-[11px] text-slate-500">${formatAudioTime(duration)}</span>
              </div>

              <!-- Interactive Progress Slider -->
              <input type="range" id="seek-${msgId}" min="0" max="${duration}" value="0" step="0.1" 
                class="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none" 
                oninput="seekAudio('${msgId}', this.value)">

              <div class="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                <span class="flex items-center gap-0.5">
                  <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Voice Note
                </span>
                <button onclick="toggleAudioSpeed('${msgId}')" id="speed-${msgId}" class="font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.2 rounded text-[10px] transition">1.0x</button>
              </div>

              <!-- Audio Player Tag -->
              <audio id="audio-${msgId}" src="${audioSrc}" preload="metadata" 
                ontimeupdate="updateAudioProgress('${msgId}')" 
                onended="onAudioEnded('${msgId}')"
                onerror="handleAudioFallback('${msgId}')"></audio>
            </div>
          </div>
        </div>
      `;
    } else if (isImage) {
      contentHtml = `
        <div class="space-y-1.5">
          <div class="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 max-w-xs shadow-sm">
            <img src="${msg.media_url}" alt="Attachment" class="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition" onclick="window.open('${msg.media_url}', '_blank')">
          </div>
          ${msg.text && msg.text !== '[Photo Attachment]' ? `<p class="text-xs leading-relaxed font-normal">${msg.text.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
      `;
    } else {
      contentHtml = `<p class="text-xs leading-relaxed font-normal">${msg.text.replace(/\n/g, '<br>')}</p>`;
    }

    return `
      <div class="flex ${isOut ? 'justify-end' : 'justify-start'}">
        <div class="max-w-md ${isOut ? 'bg-brand-50 border border-emerald-200 text-slate-800 chat-bubble-out shadow-sm' : 'bg-white border border-slate-200 text-slate-800 chat-bubble-in shadow-sm'} p-3.5 space-y-1">
          ${contentHtml}
          <div class="flex items-center justify-end gap-1 text-[10px] text-slate-400 pt-0.5">
            <span>${msg.time}</span>
            ${isOut ? `
              <span class="material-symbols-outlined text-[14px] text-brand-wa font-bold">done_all</span>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Auto-scroll to bottom
  stream.scrollTop = stream.scrollHeight;
}

window.renderChatStream = renderChatMessages;

// =========================================================================
// AUDIO PLAYBACK CONTROLLER
// =========================================================================
window.toggleAudioPlay = function (msgId) {
  const audio = document.getElementById(`audio-${msgId}`);
  const icon = document.getElementById(`icon-${msgId}`);
  if (!audio) return;

  // If no source or invalid source, play simulated pleasant voice chime sound
  if (!audio.src || audio.src === '' || audio.src === window.location.href || audio.src.endsWith('/')) {
    playSimulatedVoice(msgId);
    return;
  }

  if (audio.paused) {
    // Pause all other audios first
    document.querySelectorAll('audio').forEach(a => {
      if (a !== audio) {
        a.pause();
        const otherId = a.id.replace('audio-', '');
        const otherIcon = document.getElementById(`icon-${otherId}`);
        if (otherIcon) otherIcon.innerText = 'play_arrow';
      }
    });

    audio.play().then(() => {
      if (icon) icon.innerText = 'pause';
    }).catch(err => {
      console.warn('[Audio Play Fallback]:', err);
      playSimulatedVoice(msgId);
    });
  } else {
    audio.pause();
    if (icon) icon.innerText = 'play_arrow';
  }
};

window.seekAudio = function (msgId, val) {
  const audio = document.getElementById(`audio-${msgId}`);
  if (audio && !isNaN(audio.duration) && audio.duration > 0) {
    audio.currentTime = parseFloat(val);
  }
};

window.updateAudioProgress = function (msgId) {
  const audio = document.getElementById(`audio-${msgId}`);
  const seek = document.getElementById(`seek-${msgId}`);
  const timeLbl = document.getElementById(`time-${msgId}`);
  if (audio && seek) {
    if (audio.duration && !isNaN(audio.duration)) {
      seek.max = audio.duration;
    }
    seek.value = audio.currentTime;
    if (timeLbl) {
      timeLbl.innerText = formatAudioTime(audio.currentTime);
    }
  }
};

window.onAudioEnded = function (msgId) {
  const icon = document.getElementById(`icon-${msgId}`);
  const seek = document.getElementById(`seek-${msgId}`);
  const timeLbl = document.getElementById(`time-${msgId}`);
  const audio = document.getElementById(`audio-${msgId}`);
  if (icon) icon.innerText = 'play_arrow';
  if (seek) seek.value = 0;
  if (timeLbl && audio && audio.duration) timeLbl.innerText = formatAudioTime(audio.duration);
};

window.toggleAudioSpeed = function (msgId) {
  const audio = document.getElementById(`audio-${msgId}`);
  const btn = document.getElementById(`speed-${msgId}`);
  if (!audio || !btn) return;

  const currentRate = audio.playbackRate || 1.0;
  let nextRate = 1.0;
  if (currentRate === 1.0) nextRate = 1.5;
  else if (currentRate === 1.5) nextRate = 2.0;
  else nextRate = 1.0;

  audio.playbackRate = nextRate;
  btn.innerText = `${nextRate.toFixed(1)}x`;
};

window.formatAudioTime = function (seconds) {
  if (isNaN(seconds) || seconds === null || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

window.handleAudioFallback = function (msgId) {
  console.log(`[Audio Element]: Fallback ready for ${msgId}`);
};

// Simulated voice synthesizer chime for previewing when audio payload is simulated
let synthAudioInterval = null;
window.playSimulatedVoice = function (msgId) {
  const icon = document.getElementById(`icon-${msgId}`);
  const seek = document.getElementById(`seek-${msgId}`);
  const timeLbl = document.getElementById(`time-${msgId}`);

  if (icon && icon.innerText === 'pause') {
    if (synthAudioInterval) clearInterval(synthAudioInterval);
    icon.innerText = 'play_arrow';
    return;
  }

  if (icon) icon.innerText = 'pause';
  playChime('inbound');

  let currentSec = 0;
  const maxSec = (seek && parseFloat(seek.max) > 0) ? parseFloat(seek.max) : 10;
  if (seek) seek.max = maxSec;

  if (synthAudioInterval) clearInterval(synthAudioInterval);
  synthAudioInterval = setInterval(() => {
    currentSec += 0.5;
    if (seek) seek.value = currentSec;
    if (timeLbl) timeLbl.innerText = formatAudioTime(currentSec);

    if (currentSec >= maxSec) {
      clearInterval(synthAudioInterval);
      if (icon) icon.innerText = 'play_arrow';
      if (seek) seek.value = 0;
      if (timeLbl) timeLbl.innerText = formatAudioTime(maxSec);
    }
  }, 500);
};

function renderCustomer360Panel() {
  const panel = document.getElementById('chat-right-panel');
  if (!panel) return;

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);
  const staff = query ? CRM_STATE.staffList.find(s => s.id === query.assignedTo) : null;
  const orders = CRM_STATE.orders.filter(o => o.customerId === ACTIVE_CUSTOMER_ID);

  if (!customer) {
    panel.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Customer profile details will appear here</div>`;
    return;
  }

  const isRevealed = REVEALED_CUSTOMERS.has(customer.id);
  const displayPhone = formatDisplayPhone(customer.whatsapp || customer.phone, customer.id);

  panel.innerHTML = `
    <!-- Top Customer Summary -->
    <div class="p-5 border-b border-slate-200 text-center bg-slate-50/50">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-dark to-emerald-800 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
        ${customer.avatar}
      </div>
      <h3 class="font-bold text-slate-900 text-sm mt-2.5">${customer.name}</h3>
      <div class="flex items-center justify-center gap-1.5 mt-1">
        <p class="text-xs text-emerald-800 font-mono font-bold">${displayPhone}</p>
        <button onclick="toggleRevealPhone('${customer.id}')" class="text-slate-400 hover:text-emerald-700 p-0.5 rounded transition inline-flex items-center" title="${isRevealed ? 'Hide / Mask Number' : 'Reveal Number (Admin / Authorized Staff)'}">
          <span class="material-symbols-outlined text-[14px]">${isRevealed ? 'visibility_off' : 'visibility'}</span>
        </button>
      </div>
      
      <!-- Tags -->
      <div class="flex items-center justify-center gap-1.5 flex-wrap mt-3">
        ${customer.tags.map(t => `<span class="bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-full">${t}</span>`).join('')}
      </div>
    </div>

    <!-- Metrics Cards -->
    <div class="grid grid-cols-2 gap-3 p-4 border-b border-slate-200 bg-white">
      <div class="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 text-center">
        <span class="text-[10px] uppercase font-bold text-emerald-800">Total Orders</span>
        <p class="text-base font-extrabold text-emerald-950 mt-0.5">${customer.totalOrders} Orders</p>
      </div>
      <div class="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/60 text-center">
        <span class="text-[10px] uppercase font-bold text-blue-800">Lifetime Spend</span>
        <p class="text-base font-extrabold text-blue-950 font-mono mt-0.5">₹${customer.totalSpend.toLocaleString('en-IN')}</p>
      </div>
    </div>

    <!-- Active Query Info Box -->
    <div class="p-4 border-b border-slate-200 space-y-2.5">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase text-slate-500">Current Query</span>
        <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">${query ? query.status : 'NONE'}</span>
      </div>

      ${query ? `
        <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div class="flex justify-between">
            <span class="text-slate-500">Query ID:</span>
            <span class="font-mono font-bold text-slate-800">${query.id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Assigned Staff:</span>
            <span class="font-bold text-emerald-800">${staff ? staff.name : '<span class="text-amber-600">Unassigned</span>'}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Priority:</span>
            <span class="font-bold text-rose-600">${query.priority}</span>
          </div>
        </div>
      ` : '<p class="text-xs text-slate-400">No active query</p>'}
    </div>

    <!-- Customer Address Details -->
    <div class="p-4 border-b border-slate-200 space-y-2 text-xs">
      <span class="text-[11px] font-bold uppercase text-slate-500">Delivery Address</span>
      <p class="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 leading-relaxed font-medium">
        ${customer.address}
      </p>
    </div>

    <!-- Recent WhatsApp Orders Accordion -->
    <div class="p-4 space-y-2.5 text-xs">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase text-slate-500">Past WhatsApp Orders (${orders.length})</span>
        <button onclick="switchView('orders')" class="text-brand-wa font-bold hover:underline text-[11px]">View All</button>
      </div>

      <div class="space-y-2">
        ${orders.length === 0 ? '<p class="text-slate-400">No previous orders</p>' : orders.map(ord => `
          <div class="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-slate-800">${ord.id}</span>
              <span class="font-mono font-bold text-emerald-700">₹${ord.grandTotal}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1 truncate">${ord.items.map(i => i.name).join(', ')}</p>
            <div class="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200/60 text-[10px]">
              <span class="text-slate-400">${ord.createdAt}</span>
              <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">${ord.orderStatus}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =========================================================================
// 4. SEND MESSAGE & REAL-TIME OUTBOUND DISPATCH
// =========================================================================

// Dispatches live message to customer's WhatsApp via Node Baileys QR Bridge (Method 3)
async function dispatchWhatsAppOutbound(phone, text, msgRef, jid) {
  // 1. Try Instant WebSocket (Socket.IO) Dispatch
  if (SOCKET_IO && SOCKET_IO.connected) {
    SOCKET_IO.emit('whatsapp:send', { phone, text, jid }, (res) => {
      if (res && res.status === 'success') {
        if (msgRef) msgRef.status = 'DELIVERED';
        renderChatMessages();
        showToast('WhatsApp Delivered', `Live message sent to customer (${phone})!`, 'done_all', 'emerald');
      } else {
        console.warn('[Socket Send Notice]:', res);
        showToast('WhatsApp Notice', res?.message || 'Message queued', 'info', 'amber');
      }
    });
    return true;
  }

  // 2. HTTP Fallback
  try {
    let resp = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, text, jid })
    });
    let result = await resp.json();
    if (result.status === 'success') {
      if (msgRef) msgRef.status = 'DELIVERED';
      renderChatMessages();
      showToast('WhatsApp Delivered', `Live message sent to customer (${phone})!`, 'done_all', 'emerald');
      return true;
    } else {
      console.warn('[Bridge Send Notice]:', result);
      showToast('Saved to CRM', result.message || 'Stored in CRM', 'info', 'amber');
      return false;
    }
  } catch (err) {
    // Fallback via PHP backend proxy
    try {
      let fResp = await fetch('api.php?action=send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, text, jid })
      });
      let fResult = await fResp.json();
      if (fResult.status === 'success') {
        if (msgRef) msgRef.status = 'DELIVERED';
        renderChatMessages();
        showToast('WhatsApp Delivered', `Live message sent to customer (${phone})!`, 'done_all', 'emerald');
        return true;
      }
    } catch (e) { }
    console.warn('[Bridge Offline]:', err);
    showToast('Saved in CRM', 'Recorded locally. Connect QR in WhatsApp Settings for live delivery.', 'info', 'blue');
    return false;
  }
}

function formatOutboundBrandMessage(text) {
  const brandName = getBrandName();
  const tagline = getBrandTagline();
  const includeHeader = CRM_STATE?.brandSettings?.includeBrandHeader !== false;

  if (!includeHeader) return text;

  // Don't format if already formatted with brand header
  if (text.includes(brandName)) return text;

  return `🛍️ *${brandName}* • Order Desk\n━━━━━━━━━━━━━━━━━━━━\n${text}\n\n_${tagline}_`;
}

function handleSendMessage(event) {
  event.preventDefault();
  const input = document.getElementById('chat-input-text');
  const rawText = input.value.trim();
  if (!rawText) return;

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) return;

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  // Format outbound text with company Brand Name header
  const formattedText = formatOutboundBrandMessage(rawText);

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: formattedText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  // Update query last message & status to REPLIED
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);
  if (query) {
    query.lastMessage = `Staff: "${rawText.substring(0, 40)}..."`;
    if (query.status === 'NEW' || query.status === 'ASSIGNED') {
      query.status = 'REPLIED';
    }
  }

  // Audit log
  logAudit('MESSAGE_SENT', 'INBOX', `Staff replied to customer ${customer.name} (${customer.phone}) under brand ${getBrandName()}`);

  saveCRMState();
  input.value = '';
  renderChatMessages();
  renderInboxConversationList();
  playChime('order');

  // Transmit live WhatsApp message across WebSocket bridge to customer's WhatsApp!
  dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, formattedText, newMsg, customer.jid);
}

function insertQuickReply(type) {
  const input = document.getElementById('chat-input-text');
  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const custName = customer ? customer.name.split(' ')[0] : 'Customer';
  const brand = getBrandName();

  const templates = {
    price_enquiry: `Hello ${custName}! Thank you for contacting *${brand}* (${CRM_STATE.whatsappAccount.phoneNumber}). The price for this product is ₹599 (inclusive of taxes). Would you like to check sizes or see more photos?`,
    stock_confirm: `Yes ${custName}, this item is in ready stock at *${brand}* warehouse! Please let us know your preferred size and shipping address so we can reserve it for you.`,
    order_placed: `Congratulations ${custName}! Your order has been confirmed successfully with *${brand}*. Our packing team is preparing your package. We will share your dispatch tracking ID shortly!`,
    dispatched: `Hello ${custName}, your package from *${brand}* has been dispatched via Express Courier. Tracking ID: GRM-EXP-88902. Expected delivery: Within 2-3 business days.`,
    bank_details: `For UPI Payment: You can pay directly to our official *${brand}* business UPI ID: grmgarments@upi or scan the QR code. Kindly share the screenshot once done.`
  };

  if (templates[type]) {
    input.value = templates[type];
    input.focus();
  }
}

// =========================================================================
// BRAND IDENTITY & CUSTOMER DISPLAY ENGINE
// =========================================================================
function getBrandName() {
  return CRM_STATE?.brandSettings?.brandName || CRM_STATE?.whatsappAccount?.displayName || 'GRM Garments';
}

function getBrandTagline() {
  return CRM_STATE?.brandSettings?.brandTagline || 'Premium Kids & Maternity Wear';
}

function updateBrandPreview() {
  const brandName = document.getElementById('cfg-brand-name')?.value || getBrandName();
  const tagline = document.getElementById('cfg-brand-tagline')?.value || getBrandTagline();

  const titleEl = document.getElementById('preview-brand-header-title');
  const subEl = document.getElementById('preview-brand-header-sub');
  const nameTextEl = document.getElementById('preview-brand-name-text');
  const taglineTextEl = document.getElementById('preview-brand-tagline-text');

  if (titleEl) titleEl.innerText = brandName;
  if (subEl) subEl.innerText = 'Official Business Account';
  if (nameTextEl) nameTextEl.innerText = brandName;
  if (taglineTextEl) taglineTextEl.innerText = tagline;
}

function saveBrandSettings() {
  const brandName = (document.getElementById('cfg-brand-name')?.value || 'GRM Garments').trim();
  const brandTagline = (document.getElementById('cfg-brand-tagline')?.value || 'Premium Kids & Maternity Wear').trim();
  const brandWebsite = (document.getElementById('cfg-brand-website')?.value || 'www.grmgarments.com').trim();
  const includeHeader = document.getElementById('cfg-brand-header-toggle')?.checked ?? true;

  if (!CRM_STATE.brandSettings) CRM_STATE.brandSettings = {};
  CRM_STATE.brandSettings.brandName = brandName;
  CRM_STATE.brandSettings.brandTagline = brandTagline;
  CRM_STATE.brandSettings.website = brandWebsite;
  CRM_STATE.brandSettings.includeBrandHeader = includeHeader;

  // Sync to WhatsApp account business title
  if (CRM_STATE.whatsappAccount) {
    CRM_STATE.whatsappAccount.displayName = brandName;
    CRM_STATE.whatsappAccount.businessName = brandName;
  }

  // Push to Baileys bridge so WhatsApp profile pushName is updated on WhatsApp servers!
  fetch('http://localhost:3000/api/accounts/update_profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandName })
  }).catch(() => { });

  saveCRMState();
  updateBrandPreview();
  showToast('Brand Identity Saved!', `Company Brand Name "${brandName}" is now active and formatted for customer WhatsApp views.`, 'verified', 'indigo');
  playChime('order');
}

// =========================================================================
// 5. ADMIN STAFF ASSIGNMENT ENGINE
// =========================================================================
function openStaffAssignModal(queryId) {
  const query = CRM_STATE.queries.find(q => q.id === queryId);
  if (!query) return;

  const customer = CRM_STATE.customers.find(c => c.id === query.customerId);
  document.getElementById('assign-target-query-id').value = queryId;
  document.getElementById('assign-modal-subtitle').innerText = `Assign ${query.id} (${customer ? customer.name : 'Customer'}) to a dedicated staff`;

  const optionsContainer = document.getElementById('assign-staff-options');
  optionsContainer.innerHTML = CRM_STATE.staffList.map(staff => `
    <label class="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition">
      <div class="flex items-center gap-3">
        <input type="radio" name="selected_staff" value="${staff.id}" ${query.assignedTo === staff.id ? 'checked' : ''} class="text-brand-wa focus:ring-brand-wa h-4 w-4">
        <div>
          <p class="font-bold text-slate-800 text-xs">${staff.name}</p>
          <p class="text-[11px] text-slate-500">${staff.role}</p>
        </div>
      </div>
      <span class="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-1 rounded-full">${staff.activeQueries} Active Leads</span>
    </label>
  `).join('');

  openModal('modal-staff-assign');
}

function handleConfirmAssignment(event) {
  event.preventDefault();
  const queryId = document.getElementById('assign-target-query-id').value;
  const selectedRadio = document.querySelector('input[name="selected_staff"]:checked');
  const note = document.getElementById('assign-note').value;

  if (!selectedRadio) {
    alert('Please select a staff member');
    return;
  }

  const staffId = selectedRadio.value;
  const staff = CRM_STATE.staffList.find(s => s.id === staffId);
  const query = CRM_STATE.queries.find(q => q.id === queryId);

  if (query && staff) {
    const oldStaff = query.assignedTo;
    query.assignedTo = staffId;
    if (query.status === 'NEW') query.status = 'ASSIGNED';
    staff.activeQueries += 1;

    // Log audit
    logAudit('STAFF_ASSIGNMENT', 'STAFF_ASSIGN', `Assigned query ${query.id} to ${staff.name} by Admin. Note: ${note || 'None'}`);

    saveCRMState();
    closeModal('modal-staff-assign');
    showToast('Staff Assigned', `Query ${query.id} successfully assigned to ${staff.name}!`, 'how_to_reg', 'emerald');
    playChime('inbound');

    // Refresh UI
    renderInbox();
    renderEnquiriesTable();
  }
}

// =========================================================================
// 6. INBOUND WHATSAPP SIMULATOR & DYNAMIC INGESTION
// =========================================================================
function openInboundSimulatorModal() {
  const phoneLabel = document.getElementById('sim-target-phone');
  if (phoneLabel) phoneLabel.innerText = CRM_STATE.whatsappAccount.phoneNumber;
  openModal('modal-inbound-sim');
}

function applySimPreset(preset) {
  const presets = {
    priya: { name: 'Priya Sundaram', phone: '+91 98765 43210', msg: 'Hello! Is Baby Frock BF-001 Pink colour in 2-3 Years size available in your shop? How much is it?' },
    ananya: { name: 'Ananya Sharma', phone: '+91 98450 11223', msg: 'Hi GRM, can you please send me photos and fabric details for the Maternity Maxi Gown in Blue?' },
    kavitha: { name: 'Kavitha Ramachandran', phone: '+91 97890 55441', msg: 'Do you have boys organic cotton t-shirt pack in 4-5Y size? And what are the delivery charges to Madurai?' },
    custom: { name: 'Vikram Patel', phone: '+91 91234 56789', msg: 'Hello! I saw your baby gift set online. Do you have ready stock for instant shipping?' }
  };

  if (presets[preset]) {
    document.getElementById('sim-name').value = presets[preset].name;
    document.getElementById('sim-phone').value = presets[preset].phone;
    document.getElementById('sim-message').value = presets[preset].msg;
  }
}

function handleSimulateInbound(event) {
  event.preventDefault();
  const name = document.getElementById('sim-name').value.trim();
  const phone = document.getElementById('sim-phone').value.trim();
  const messageText = document.getElementById('sim-message').value.trim();
  const priority = document.getElementById('sim-priority').value;
  const assignTo = document.getElementById('sim-assign').value;

  ingestInboundMessage({
    sender_name: name,
    sender_phone: phone,
    message_text: messageText,
    priority: priority,
    assigned_to: assignTo,
    source: 'SIMULATOR'
  });

  closeModal('modal-inbound-sim');
}

// Universal Inbound Ingestion Function (Handles both Simulated and Real Webhook messages)
function ingestInboundMessage(payload) {
  const name = payload.sender_name || 'WhatsApp Customer';
  const phone = payload.sender_phone;
  const messageText = payload.message_text;
  const priority = payload.priority || 'HIGH';
  const assignTo = payload.assigned_to || 'UNASSIGNED';

  if (!phone || !messageText) return;

  // Filter out internal status notices
  if (payload.source === 'QR_BRIDGE_CONNECTED' || payload.source === 'QR_BRIDGE_AUTHENTICATED') return;

  const cleanSender = phone.replace(/[^0-9]/g, '');

  // 1. Match or create Customer
  let customer = CRM_STATE.customers.find(c => {
    const cPhone = (c.phone || '').replace(/[^0-9]/g, '');
    const cWa = (c.whatsapp || '').replace(/[^0-9]/g, '');
    return cPhone === cleanSender || cWa === cleanSender;
  });

  if (!customer) {
    const newId = 'cust_' + (100 + CRM_STATE.customers.length + 1);
    customer = {
      id: newId,
      code: `CUST-2026-00${100 + CRM_STATE.customers.length + 1}`,
      name: name,
      phone: phone,
      whatsapp: phone,
      jid: payload.sender_jid || null,
      address: 'Registered via WhatsApp Inbound',
      city: 'Live Customer',
      customerType: 'New WhatsApp Customer',
      tags: ['New Lead', 'WhatsApp Live'],
      totalOrders: 0,
      totalSpend: 0,
      avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };
    CRM_STATE.customers.push(customer);
  } else {
    if (payload.sender_jid) customer.jid = payload.sender_jid;
    if (name && name !== 'WhatsApp Customer' && (!customer.name || customer.name === 'WhatsApp Customer')) {
      customer.name = name;
    }
  }

  // 2. Add message to conversation (Check if duplicate within 3 seconds)
  if (!CRM_STATE.conversations[customer.id]) {
    CRM_STATE.conversations[customer.id] = [];
  }

  const msgType = payload.type || (payload.media_url ? 'audio' : (messageText.includes('Voice Message') || messageText.includes('[WhatsApp Message]') ? 'audio' : 'text'));
  const existingMsgs = CRM_STATE.conversations[customer.id];
  const isDuplicate = existingMsgs.some(m => m.sender === 'customer' && m.text === messageText && (Date.now() - (m.id || 0)) < 3000);
  if (isDuplicate) return;

  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  CRM_STATE.conversations[customer.id].push({
    id: Date.now(),
    sender: 'customer',
    text: messageText,
    type: msgType,
    media_url: payload.media_url || null,
    duration: payload.duration || 12,
    time: timeStr,
    status: 'DELIVERED'
  });

  // 3. Create or update Query
  const existingQuery = CRM_STATE.queries.find(q => q.customerId === customer.id);
  if (existingQuery) {
    existingQuery.lastMessage = `Customer: "${messageText.substring(0, 40)}..."`;
    existingQuery.unreadCount = (existingQuery.unreadCount || 0) + 1;
    existingQuery.createdAt = 'Just now';
    if (existingQuery.status === 'REPLIED' || existingQuery.status === 'CLOSED') {
      existingQuery.status = 'NEW';
    }
  } else {
    const newQueryId = `Q-2026-00${1240 + CRM_STATE.queries.length + 1}`;
    const newQuery = {
      id: newQueryId,
      customerId: customer.id,
      assignedTo: assignTo,
      status: assignTo === 'UNASSIGNED' ? 'NEW' : 'ASSIGNED',
      priority: priority,
      queryText: messageText,
      productSku: null,
      createdAt: 'Just now',
      unreadCount: 1,
      lastMessage: `Customer: "${messageText.substring(0, 40)}..."`
    };
    CRM_STATE.queries.unshift(newQuery);
  }

  // 4. Log Audit
  logAudit('INBOUND_MESSAGE_RECEIVED', 'WEBHOOK', `Inbound WhatsApp received at ${CRM_STATE.whatsappAccount.phoneNumber} from ${customer.name} (${customer.phone}).`);

  saveCRMState();
  playChime('inbound');
  showToast('New WhatsApp Message Received!', `From ${customer.name} (${formatDisplayPhone(customer.phone, customer.id)}): "${messageText.substring(0, 40)}..."`, 'chat', 'emerald');

  // Select this customer and refresh
  ACTIVE_CUSTOMER_ID = customer.id;
  if (ACTIVE_VIEW === 'inbox') renderInbox();
  else if (ACTIVE_VIEW === 'enquiries') renderEnquiriesTable();
  else if (ACTIVE_VIEW === 'dashboard') renderDashboard();
}

// Real-Time Webhook Polling Loop (Pulls from api.php live messages queue every 3 seconds)
function startRealtimeMessageSync() {
  setInterval(() => {
    fetch(`api.php?action=get_inbound_queue&since=${LAST_POLL_EPOCH}`)
      .then(r => r.json())
      .then(res => {
        if (res.status === 'success' && res.messages && res.messages.length > 0) {
          res.messages.forEach(msg => {
            ingestInboundMessage(msg);
            LAST_POLL_EPOCH = Math.max(LAST_POLL_EPOCH, msg.timestamp_epoch || Math.floor(Date.now() / 1000));
          });
        }
      })
      .catch(() => { });
  }, 3000);
}

// =========================================================================
// 7. PRODUCT SEARCH, LIVE STOCK CHECK & SHARING
// =========================================================================
function openProductSearchModal() {
  renderModalProductList('');
  openModal('modal-product-search');
}

function renderModalProductList(query) {
  const container = document.getElementById('modal-products-list');
  if (!container) return;

  const q = (query || '').toLowerCase();
  const list = CRM_STATE.products.filter(p =>
    p.sku.toLowerCase().includes(q) ||
    p.name.toLowerCase().includes(q) ||
    p.color.toLowerCase().includes(q) ||
    p.size.toLowerCase().includes(q) ||
    p.category.toLowerCase().includes(q)
  );

  if (list.length === 0) {
    container.innerHTML = `<p class="text-center text-slate-400 py-8 text-xs">No products matched your search</p>`;
    return;
  }

  container.innerHTML = list.map(p => {
    const available = p.physicalStock - p.reservedStock;
    const isAvailable = available > 0;

    return `
      <div class="py-3 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <img src="${p.image}" alt="${p.name}" class="w-14 h-14 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-[11px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">${p.sku}</span>
              <h4 class="font-bold text-slate-900 text-xs">${p.name}</h4>
            </div>
            <p class="text-[11px] text-slate-500 mt-0.5">Size: <span class="font-semibold text-slate-700">${p.size}</span> &bull; Color: <span class="font-semibold text-slate-700">${p.color}</span></p>
            <p class="text-xs font-bold text-emerald-700 font-mono mt-0.5">₹${p.price}</p>
          </div>
        </div>

        <!-- Stock Status & Share Button -->
        <div class="text-right shrink-0">
          <div class="mb-1.5">
            ${isAvailable ? `
              <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                Available: ${available} (${p.reservedStock} Reserved)
              </span>
            ` : `
              <span class="text-[10px] bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded-full">
                Out of Stock (0 Available)
              </span>
            `}
          </div>

          <button onclick="shareProductCardToChat(${p.id})" class="px-3 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1">
            <span class="material-symbols-outlined text-[14px]">send</span> Share to Customer
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function shareProductCardToChat(productId) {
  const p = CRM_STATE.products.find(prod => prod.id === productId);
  if (!p) return;

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const available = p.physicalStock - p.reservedStock;
  const shareText = `🛍️ *${p.name}*\n🏷️ *SKU:* ${p.sku}\n📏 *Size:* ${p.size}\n🎨 *Color:* ${p.color}\n💰 *Price:* ₹${p.price}\n📦 *Stock Status:* ${available > 0 ? 'Ready Stock Available' : 'Limited/Out of Stock'}\n\nWould you like to confirm this order? Reply with your delivery address!`;

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: shareText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  closeModal('modal-product-search');
  renderChatMessages();
  playChime('order');
  showToast('Product Shared', `Sent ${p.sku} card to customer on WhatsApp.`, 'share', 'emerald');

  if (customer) {
    dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, shareText, newMsg);
  }
}

// =========================================================================
// 8. CHAT-TO-ORDER CONVERSION & STOCK RESERVATION
// =========================================================================
function openOrderModal() {
  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);

  if (customer) {
    document.getElementById('order-modal-customer-name').innerText = customer.name;
    document.getElementById('order-modal-customer-phone').innerText = customer.whatsapp;
    document.getElementById('order-modal-query-id').innerText = query ? query.id : 'N/A';
    document.getElementById('order-shipping-addr').value = customer.address || '';
  }

  calculateOrderTotal();
  openModal('modal-convert-order');
}

function calculateOrderTotal() {
  const select = document.getElementById('order-product-select');
  const selectedOption = select.options[select.selectedIndex];
  const price = parseFloat(selectedOption.getAttribute('data-price') || 599);
  const qty = parseInt(document.getElementById('order-qty').value || 1);

  document.getElementById('order-unit-price').value = price;
  const total = price * qty;
  document.getElementById('order-grand-total').innerText = '₹' + total.toLocaleString('en-IN');
}

function handleCreateOrder(event) {
  event.preventDefault();
  const select = document.getElementById('order-product-select');
  const selectedOption = select.options[select.selectedIndex];
  const sku = selectedOption.value;
  const prodName = selectedOption.getAttribute('data-name');
  const price = parseFloat(selectedOption.getAttribute('data-price'));
  const qty = parseInt(document.getElementById('order-qty').value);
  const paymentMethod = document.getElementById('order-payment-method').value;
  const address = document.getElementById('order-shipping-addr').value;

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);

  // 1. Reserve Stock in Product Catalog
  const product = CRM_STATE.products.find(p => p.sku === sku);
  if (product) {
    if ((product.physicalStock - product.reservedStock) < qty) {
      alert('Insufficient available stock to reserve this order!');
      return;
    }
    product.reservedStock += qty;
  }

  // 2. Create Order Record
  const newOrderId = `WA-2026-00${1125 + CRM_STATE.orders.length + 1}`;
  const grandTotal = price * qty;

  const newOrder = {
    id: newOrderId,
    queryId: query ? query.id : 'N/A',
    customerId: customer ? customer.id : 'cust_101',
    customerName: customer ? customer.name : 'Customer',
    items: [{ sku: sku, name: prodName, qty: qty, price: price }],
    grandTotal: grandTotal,
    paymentMethod: paymentMethod,
    paymentStatus: paymentMethod === 'COD' ? 'PENDING' : 'PAID',
    orderStatus: 'STOCK_RESERVED',
    createdAt: 'Just now',
    createdBy: ACTIVE_ROLE === 'admin' ? 'Admin Manager' : 'Assigned Staff'
  };

  CRM_STATE.orders.unshift(newOrder);

  // 3. Update Customer Spend & Total Orders
  if (customer) {
    customer.totalOrders += 1;
    customer.totalSpend += grandTotal;
    customer.address = address;
  }

  // 4. Update Query Status to CONVERTED
  if (query) {
    query.status = 'CONVERTED';
  }

  // 5. Post Order Confirmation Message in Chat
  const confirmMsg = `🎉 *ORDER CONFIRMED!*\nOrder ID: *${newOrderId}*\nItem: ${prodName} (Qty: ${qty})\nTotal Amount: *₹${grandTotal.toLocaleString('en-IN')}*\nPayment: ${paymentMethod}\nShipping to: ${address}\n\nYour stock has been reserved. Thank you for shopping with GRM Garments (${CRM_STATE.whatsappAccount.phoneNumber})!`;

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }
  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push({
    id: Date.now(),
    sender: 'staff',
    text: confirmMsg,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENT'
  });

  // 6. Log Audit
  logAudit('ORDER_CREATED', 'ORDERS', `Created order ${newOrderId} for ${customer.name}. Stock reserved: ${qty} units of ${sku}`);

  saveCRMState();
  closeModal('modal-convert-order');
  playChime('order');
  showToast('Order Booked & Stock Reserved!', `Order ${newOrderId} created (₹${grandTotal}). Confirmation sent on WhatsApp.`, 'check_circle', 'emerald');

  renderInbox();
}

// =========================================================================
// 9. FOLLOW-UP SCHEDULER
// =========================================================================
function openFollowUpModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('followup-date').value = today;
  openModal('modal-followup');
}

function handleCreateFollowup(event) {
  event.preventDefault();
  const date = document.getElementById('followup-date').value;
  const time = document.getElementById('followup-time').value;
  const notes = document.getElementById('followup-notes').value;

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);

  const newFollowup = {
    id: `FU-2026-00${245 + CRM_STATE.followups.length + 1}`,
    queryId: query ? query.id : 'Q-2026-0000',
    customerId: customer ? customer.id : 'cust_101',
    customerName: customer ? customer.name : 'Customer',
    assignedTo: query ? query.assignedTo : 'staff_01',
    date: date,
    time: time,
    reason: notes,
    status: 'PENDING'
  };

  CRM_STATE.followups.unshift(newFollowup);
  if (query) query.status = 'FOLLOW_UP';

  logAudit('FOLLOWUP_SCHEDULED', 'FOLLOWUP', `Scheduled follow-up for ${customer.name} on ${date} at ${time}`);

  saveCRMState();
  closeModal('modal-followup');
  showToast('Follow-up Scheduled', `Reminder set for ${date} at ${time}`, 'event', 'blue');
  renderInbox();
}

// =========================================================================
// 10. ENQUIRIES TABLE & WORKLOAD RENDERING
// =========================================================================
function renderEnquiriesTable() {
  const tableBody = document.getElementById('enquiries-table-body');
  const workloadContainer = document.getElementById('staff-workload-cards');
  if (!tableBody || !CRM_STATE || !CRM_STATE.queries) return;

  const statusFilter = document.getElementById('enquiry-filter-status')?.value || 'ALL';
  const staffFilter = document.getElementById('enquiry-filter-staff')?.value || 'ALL';

  // Render Workload Cards
  if (workloadContainer) {
    const unassignedCount = CRM_STATE.queries.filter(q => q.assignedTo === 'UNASSIGNED').length;
    workloadContainer.innerHTML = `
      <div class="bg-amber-50 border border-amber-200 p-4 rounded-2xl">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-amber-800">Unassigned Queue</span>
          <span class="text-xs font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">${unassignedCount}</span>
        </div>
        <p class="text-2xl font-black text-amber-950 mt-2">${unassignedCount} Queries</p>
        <p class="text-[10px] text-amber-700 mt-1">Awaiting Admin Assignment</p>
      </div>
    ` + CRM_STATE.staffList.map(staff => {
      const count = CRM_STATE.queries.filter(q => q.assignedTo === staff.id).length;
      return `
        <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold text-slate-800 truncate">${staff.name}</span>
            <span class="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">${count}</span>
          </div>
          <p class="text-2xl font-black text-slate-900 mt-2">${count} Queries</p>
          <p class="text-[10px] text-slate-500 mt-1">${staff.role}</p>
        </div>
      `;
    }).join('');
  }

  let list = CRM_STATE.queries.map(q => {
    const cust = CRM_STATE.customers.find(c => c.id === q.customerId);
    const staff = CRM_STATE.staffList.find(s => s.id === q.assignedTo);
    return { ...q, customer: cust, staff: staff };
  });

  if (statusFilter !== 'ALL') list = list.filter(q => q.status === statusFilter);
  if (staffFilter !== 'ALL') {
    if (staffFilter === 'UNASSIGNED') list = list.filter(q => q.assignedTo === 'UNASSIGNED');
    else list = list.filter(q => q.assignedTo === staffFilter);
  }

  document.getElementById('table-total-count').innerText = list.length;

  tableBody.innerHTML = list.map(q => {
    const isUnassigned = q.assignedTo === 'UNASSIGNED';
    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3 px-4 font-mono font-bold text-slate-900">
          ${q.id}
          <div class="text-[10px] font-normal text-slate-400">${q.createdAt}</div>
        </td>
        <td class="py-3 px-4">
          <div class="font-bold text-slate-800">${q.customer ? q.customer.name : 'Unknown'}</div>
          <div class="text-[10px] font-mono text-slate-500">${q.customer ? q.customer.whatsapp : ''}</div>
        </td>
        <td class="py-3 px-4 max-w-xs truncate font-medium text-slate-700">
          ${q.queryText}
        </td>
        <td class="py-3 px-4">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded ${q.priority === 'URGENT' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-700'}">${q.priority}</span>
        </td>
        <td class="py-3 px-4">
          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${q.status === 'NEW' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">${q.status}</span>
        </td>
        <td class="py-3 px-4">
          ${isUnassigned ? `
            <span class="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
              <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span> Unassigned
            </span>
          ` : `
            <span class="font-bold text-slate-800 text-xs">${q.staff ? q.staff.name : 'Assigned'}</span>
          `}
        </td>
        <td class="py-3 px-4 text-right space-x-1">
          <button onclick="openStaffAssignModal('${q.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
            ${isUnassigned ? 'Assign' : 'Reassign'}
          </button>
          <button onclick="selectCustomerChat('${q.customerId}'); switchView('inbox');" class="px-2.5 py-1 bg-brand-wa hover:bg-brand-waDark text-white rounded-lg text-xs font-bold shadow-sm">
            Chat
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 11. DASHBOARD, CATALOG, ORDERS, FOLLOWUPS & AUDIT RENDERING
// =========================================================================
function renderDashboard() {
  document.getElementById('dash-total-queries').innerText = CRM_STATE.queries.length;
  document.getElementById('dash-unassigned-queries').innerText = CRM_STATE.queries.filter(q => q.assignedTo === 'UNASSIGNED').length;
  document.getElementById('dash-total-orders').innerText = CRM_STATE.orders.length;
  document.getElementById('dash-total-followups').innerText = CRM_STATE.followups.length;

  const totalRev = CRM_STATE.orders.reduce((acc, o) => acc + o.grandTotal, 0);
  document.getElementById('dash-total-revenue').innerText = '₹' + totalRev.toLocaleString('en-IN');

  const recentList = document.getElementById('dash-recent-chats');
  if (recentList) {
    recentList.innerHTML = CRM_STATE.queries.slice(0, 4).map(q => {
      const cust = CRM_STATE.customers.find(c => c.id === q.customerId);
      return `
        <div class="py-2.5 flex items-center justify-between">
          <div>
            <p class="font-bold text-slate-800">${cust ? cust.name : 'Customer'} <span class="font-normal text-slate-400 text-[10px]">(${q.id})</span></p>
            <p class="text-slate-500 text-[11px] truncate">${q.queryText}</p>
          </div>
          <button onclick="selectCustomerChat('${q.customerId}'); switchView('inbox');" class="text-brand-wa font-bold text-xs hover:underline">Open &rarr;</button>
        </div>
      `;
    }).join('');
  }

  const staffPerf = document.getElementById('dash-staff-perf-list');
  if (staffPerf) {
    staffPerf.innerHTML = CRM_STATE.staffList.map(s => `
      <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
        <div>
          <p class="font-bold text-slate-800">${s.name}</p>
          <p class="text-[10px] text-slate-500">${s.role}</p>
        </div>
        <div class="text-right">
          <p class="font-bold text-emerald-700">${s.converted} Orders Converted</p>
          <p class="text-[10px] text-slate-400">${s.activeQueries} Active Leads</p>
        </div>
      </div>
    `).join('');
  }
}

function renderCatalogGrid(search) {
  const container = document.getElementById('catalog-grid-container');
  if (!container) return;

  const q = (search || '').toLowerCase();
  const list = CRM_STATE.products.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));

  container.innerHTML = list.map(p => {
    const available = p.physicalStock - p.reservedStock;
    return `
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
        <img src="${p.image}" alt="${p.name}" class="w-full h-44 object-cover">
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between mb-1">
              <span class="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">${p.sku}</span>
              <span class="font-bold text-emerald-700 font-mono text-sm">₹${p.price}</span>
            </div>
            <h4 class="font-bold text-slate-800 text-xs">${p.name}</h4>
            <p class="text-[11px] text-slate-500 mt-1">Size: ${p.size} &bull; Color: ${p.color}</p>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <div>
              <p class="text-[10px] text-slate-400 uppercase font-bold">Stock Status</p>
              <p class="font-bold text-emerald-800">${available} Available <span class="text-slate-400 font-normal">(${p.reservedStock} res)</span></p>
            </div>
            <button onclick="shareProductCardToChat(${p.id}); switchView('inbox');" class="px-2.5 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white rounded-lg font-bold text-xs shadow-sm">
              Share in Chat
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderOrdersTable() {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  tbody.innerHTML = CRM_STATE.orders.map(ord => `
    <tr class="hover:bg-slate-50 transition">
      <td class="py-3 px-4 font-mono font-bold text-slate-900">
        ${ord.id}
        <div class="text-[10px] font-normal text-slate-400">${ord.createdAt}</div>
      </td>
      <td class="py-3 px-4 font-bold text-slate-800">${ord.customerName}</td>
      <td class="py-3 px-4 text-slate-600 font-medium">${ord.items.map(i => `${i.name} (x${i.qty})`).join(', ')}</td>
      <td class="py-3 px-4 font-mono font-bold text-emerald-700">₹${ord.grandTotal.toLocaleString('en-IN')}</td>
      <td class="py-3 px-4">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${ord.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">${ord.paymentMethod} (${ord.paymentStatus})</span>
      </td>
      <td class="py-3 px-4">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">${ord.orderStatus}</span>
      </td>
      <td class="py-3 px-4 text-slate-500 font-medium">${ord.createdBy}</td>
    </tr>
  `).join('');
}

function renderFollowupsCards() {
  const container = document.getElementById('followups-cards-grid');
  if (!container) return;

  container.innerHTML = CRM_STATE.followups.map(fu => `
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">${fu.id}</span>
        <span class="text-xs font-bold text-slate-500">${fu.date} at ${fu.time}</span>
      </div>
      <div>
        <h4 class="font-bold text-slate-900 text-sm">${fu.customerName}</h4>
        <p class="text-xs text-slate-600 mt-1 leading-relaxed">${fu.reason}</p>
      </div>
      <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
        <button onclick="selectCustomerChat('${fu.customerId}'); switchView('inbox');" class="text-xs bg-brand-wa hover:bg-brand-waDark text-white px-3 py-1.5 rounded-lg font-bold shadow-sm">
          Open Customer Chat &rarr;
        </button>
      </div>
    </div>
  `).join('');
}

function renderCustomersGrid() {
  const container = document.getElementById('customers-grid-container');
  if (!container) return;

  container.innerHTML = CRM_STATE.customers.map(c => `
    <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-dark to-emerald-800 text-white font-bold text-base flex items-center justify-center">
          ${c.avatar}
        </div>
        <div>
          <h4 class="font-bold text-slate-900 text-sm">${c.name}</h4>
          <p class="text-xs text-slate-500 font-mono">${c.whatsapp}</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap">
        ${c.tags.map(t => `<span class="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">${t}</span>`).join('')}
      </div>
      <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
        <span class="text-slate-500">${c.totalOrders} Orders &bull; ₹${c.totalSpend.toLocaleString('en-IN')} Spend</span>
        <button onclick="selectCustomerChat('${c.id}'); switchView('inbox');" class="text-brand-wa font-bold hover:underline">Chat</button>
      </div>
    </div>
  `).join('');
}

function renderAuditTable() {
  const tbody = document.getElementById('audit-logs-table-body');
  if (!tbody) return;

  tbody.innerHTML = CRM_STATE.auditLogs.map(log => `
    <tr class="hover:bg-slate-50">
      <td class="py-2.5 px-4 text-slate-500">${log.timestamp}</td>
      <td class="py-2.5 px-4 font-bold text-slate-800">${log.user}</td>
      <td class="py-2.5 px-4 text-indigo-700 font-semibold">${log.action}</td>
      <td class="py-2.5 px-4 text-slate-600">${log.module}</td>
      <td class="py-2.5 px-4 text-slate-700">${log.details}</td>
    </tr>
  `).join('');
}

function renderAnalyticsView() {
  const container = document.getElementById('analytics-staff-cards');
  if (!container) return;

  container.innerHTML = CRM_STATE.staffList.map(s => {
    const orders = CRM_STATE.orders.filter(o => o.createdBy.includes(s.name));
    const revenue = orders.reduce((acc, o) => acc + o.grandTotal, 0);

    return `
      <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-base flex items-center justify-center">
            ${s.avatar}
          </div>
          <div>
            <h4 class="font-bold text-slate-900 text-sm">${s.name}</h4>
            <p class="text-xs text-slate-500">${s.role}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3 text-center">
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Leads Converted</span>
            <p class="text-xl font-bold text-emerald-800 mt-0.5">${s.converted}</p>
          </div>
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span class="text-[10px] text-slate-400 font-bold uppercase">Sales Revenue</span>
            <p class="text-xl font-bold text-slate-900 font-mono mt-0.5">₹${revenue.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// =========================================================================
// 12. WHATSAPP SETTINGS & DYNAMIC PHONE NUMBER MANAGEMENT
// =========================================================================
function switchSettingsTab(tab) {
  const tabQr = document.getElementById('settings-tab-qr');
  const tabManual = document.getElementById('settings-tab-manual');
  const btnQr = document.getElementById('tab-btn-qr');
  const btnManual = document.getElementById('tab-btn-manual');

  if (tab === 'qr') {
    if (tabQr) tabQr.classList.remove('hidden');
    if (tabManual) tabManual.classList.add('hidden');
    if (btnQr) btnQr.className = "px-3.5 py-1.5 bg-brand-wa text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition";
    if (btnManual) btnManual.className = "px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5";
    fetchQRBridgeStatus();
  } else {
    if (tabQr) tabQr.classList.add('hidden');
    if (tabManual) tabManual.classList.remove('hidden');
    if (btnQr) btnQr.className = "px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5";
    if (btnManual) btnManual.className = "px-3.5 py-1.5 bg-brand-wa text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition";
  }
}

// Updates UI with Bridge Status & QR Code (used by both Socket.IO and REST Polling)
function updateQRBridgeUI(res) {
  if (!res) return;
  const qrImg = document.getElementById('qr-code-image');
  const spinner = document.getElementById('qr-loading-spinner');
  const connectedBox = document.getElementById('qr-connected-box');
  const statusText = document.getElementById('qr-bridge-status-text');
  const phoneDisplay = document.getElementById('qr-connected-phone-display');

  if (res.connection === 'SCAN_QR' && res.qr_image) {
    if (qrImg) {
      qrImg.src = res.qr_image;
      qrImg.classList.remove('hidden');
    }
    if (spinner) spinner.classList.add('hidden');
    if (connectedBox) connectedBox.classList.add('hidden');
    if (statusText) statusText.innerText = 'Bridge Status: Scan QR Code with WhatsApp on Phone';
  } else if (res.connection === 'CONNECTED') {
    if (qrImg) qrImg.classList.add('hidden');
    if (spinner) spinner.classList.add('hidden');
    if (connectedBox) connectedBox.classList.remove('hidden');
    if (phoneDisplay) phoneDisplay.innerText = res.connected_number || CRM_STATE.whatsappAccount.phoneNumber;
    if (statusText) statusText.innerText = `Bridge Status: Connected to ${res.connected_number || CRM_STATE.whatsappAccount.phoneNumber}`;

    if (res.connected_number && CRM_STATE.whatsappAccount.phoneNumber !== res.connected_number) {
      CRM_STATE.whatsappAccount.phoneNumber = res.connected_number;
      saveCRMState();
      updateConfiguredPhoneDisplays();
    }
  } else {
    if (qrImg) qrImg.classList.add('hidden');
    if (spinner) spinner.classList.remove('hidden');
    if (connectedBox) connectedBox.classList.add('hidden');
    if (statusText) statusText.innerText = 'Bridge Status: Initializing WhatsApp Socket...';
  }
}

// Poll Bridge Server on http://localhost:3000/api/qr/status
function fetchQRBridgeStatus() {
  fetch('http://localhost:3000/api/accounts')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success' && res.accounts) {
        MULTI_ACCOUNTS_STATE = res.accounts;
        renderMultiAccountsHub();

        const primary = res.accounts[0];
        if (primary && primary.connected_number) {
          CRM_STATE.whatsappAccount.phoneNumber = primary.connected_number;
          saveCRMState();
          updateConfiguredPhoneDisplays();
        }
      }
    })
    .catch(() => {
      renderMultiAccountsHub();
    });
}

function refreshQRCodeBridge() {
  fetch('http://localhost:3000/api/qr/connect', { method: 'POST' })
    .then(() => {
      showToast('Refreshing QR Code...', 'Generating fresh scan QR code', 'qr_code_scanner', 'emerald');
      setTimeout(fetchQRBridgeStatus, 1500);
    })
    .catch(() => {
      showToast('Bridge Error', 'Could not reach bridge server on port 3000', 'warning', 'rose');
    });
}

function handleDisconnectQR() {
  if (confirm('Disconnect your linked WhatsApp phone session?')) {
    fetch('http://localhost:3000/api/qr/logout', { method: 'POST' })
      .then(() => {
        showToast('WhatsApp Disconnected', 'Session logged out. You can scan a new QR code.', 'link_off', 'blue');
        setTimeout(fetchQRBridgeStatus, 1500);
      })
      .catch(() => { });
  }
}


// =========================================================================
// MULTI-ACCOUNT WHATSAPP HUB ENGINE
// =========================================================================
function renderMultiAccountsHub() {
  const container = document.getElementById('multi-accounts-container');
  const countBadge = document.getElementById('badge-multi-accounts-count');
  if (!container) return;

  const accounts = MULTI_ACCOUNTS_STATE.length > 0 ? MULTI_ACCOUNTS_STATE : [
    {
      id: 'account_1',
      label: 'Primary WhatsApp Number',
      status: CRM_STATE.whatsappAccount.status || 'CONNECTED',
      connected_number: CRM_STATE.whatsappAccount.phoneNumber || '+91 9789660115',
      connected_name: 'GRM Garments Primary',
      qr_image: null
    }
  ];

  const connectedCount = accounts.filter(a => a.status === 'CONNECTED').length;
  if (countBadge) {
    countBadge.innerText = `${connectedCount} Connected`;
    countBadge.className = connectedCount > 0 ? "bg-emerald-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.2 rounded-full" : "bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.2 rounded-full";
  }

  container.innerHTML = accounts.map((acc, index) => {
    const isConnected = acc.status === 'CONNECTED';
    const isScanning = acc.status === 'SCAN_QR' && acc.qr_image;
    const phoneNum = acc.connected_number || (acc.id === 'account_1' ? '+91 97896 60115' : '+91 98765 43210');
    const isSelectedActive = (ACTIVE_SEND_ACCOUNT_ID === acc.id);

    return `
      <div class="bg-white rounded-2xl border ${isSelectedActive ? 'border-brand-wa ring-2 ring-brand-wa/30' : (isConnected ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200')} p-5 shadow-sm space-y-4 flex flex-col justify-between">
        
        <!-- Account Card Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${isConnected ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} flex items-center justify-center font-bold text-sm">
              <span class="material-symbols-outlined text-[22px]">${isConnected ? 'phone_android' : 'qr_code_scanner'}</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-900 text-xs sm:text-sm">${acc.label || ('WhatsApp Phone #' + (index + 1))}</h4>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
                  ${isConnected ? '🟢 CONNECTED' : (isScanning ? '🟡 SCAN QR' : '⚪ CONNECTING')}
                </span>
                ${isSelectedActive ? '<span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-brand-wa text-white">⭐ ACTIVE LINE</span>' : ''}
              </div>
              <p class="text-xs font-mono font-bold text-slate-600 mt-0.5">${acc.connected_number || 'Awaiting Device Link'}</p>
            </div>
          </div>

          <span class="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded">${acc.id}</span>
        </div>

        <!-- QR Code Display if Scanning -->
        ${isScanning ? `
          <div class="bg-slate-50 p-4 rounded-xl border border-amber-300 flex flex-col items-center justify-center text-center space-y-2">
            <p class="text-[11px] font-bold text-slate-800">Scan with Phone (Linked Devices &rarr; Link a Device):</p>
            <img src="${acc.qr_image}" alt="Scan WhatsApp QR" class="w-44 h-44 rounded-lg shadow-sm border border-slate-200">
            <p class="text-[10px] text-slate-400">Auto-refreshes every 20 seconds</p>
          </div>
        ` : ''}

        ${isConnected ? `
          <div class="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200/60 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-emerald-900">
              <span class="material-symbols-outlined text-[18px] text-brand-wa">check_circle</span>
              <span class="font-bold text-[11px]">Phone session authenticated</span>
            </div>
            <span class="font-mono text-emerald-800 font-bold text-[11px]">${acc.connected_number || '+91 97896 60115'}</span>
          </div>
        ` : ''}

        <!-- PROMINENT CONNECT & OPEN INBOX BUTTON -->
        <div class="pt-2">
          <button type="button" onclick="connectAndOpenWhatsAppChats('${acc.id}', '${phoneNum}', '${acc.label || 'WhatsApp Line'}')" class="w-full py-2.5 bg-gradient-to-r from-brand-wa to-emerald-600 hover:from-brand-waDark hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]" title="Connect this WhatsApp number and open live conversations">
            <span class="material-symbols-outlined text-[18px]">chat</span>
            <span>Connect & Open Chats (${phoneNum})</span>
          </button>
        </div>

        <!-- Actions Strip -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <button type="button" onclick="disconnectWhatsAppAccount('${acc.id}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1 transition">
            <span class="material-symbols-outlined text-[14px]">link_off</span> Disconnect
          </button>
          
          <button type="button" onclick="refreshSpecificAccount('${acc.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs flex items-center gap-1 transition">
            <span class="material-symbols-outlined text-[14px]">refresh</span> Refresh Status
          </button>
        </div>

      </div>
    `;
  }).join('');
}

// Connect selected WhatsApp number and open live conversations in inbox
function connectAndOpenWhatsAppChats(accountId, connectedNumber, label) {
  ACTIVE_SEND_ACCOUNT_ID = accountId;

  // Format clean phone number
  const raw = (connectedNumber && connectedNumber !== 'Awaiting Device Link')
    ? connectedNumber 
    : (CRM_STATE?.whatsappAccount?.phoneNumber || '+91 97896 60115');
  const cleanPhone = formatPhoneNumberPretty(raw);

  if (!CRM_STATE.whatsappAccount) CRM_STATE.whatsappAccount = {};
  CRM_STATE.whatsappAccount.phoneNumber = cleanPhone;
  CRM_STATE.whatsappAccount.status = 'CONNECTED';
  saveCRMState();
  updateConfiguredPhoneDisplays();

  // Persist to PHP & MySQL database
  fetch('api.php?action=save_config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: cleanPhone,
      business_name: CRM_STATE?.whatsappAccount?.businessName || 'GRM Garments Business Hub',
      display_name: label || 'GRM Garments Official'
    })
  }).catch(() => {});

  // Immediately pull all queued messages from backend
  syncInboundMessagesNow(true).then(() => {
    // If ACTIVE_CUSTOMER_ID is not set or has no card, select first customer
    if (!ACTIVE_CUSTOMER_ID || !CRM_STATE.customers.some(c => c.id === ACTIVE_CUSTOMER_ID)) {
      if (CRM_STATE.customers.length > 0) {
        ACTIVE_CUSTOMER_ID = CRM_STATE.customers[0].id;
      }
    }

    // Switch to Inbox and render chats
    switchView('inbox');
    setInboxFilter('all');
    renderInbox();
    if (typeof playChime === 'function') playChime('order');

    showToast(
      'Connected Successfully!',
      `Switched active CRM WhatsApp line to: ${cleanPhone}. Live chats loaded.`,
      'check_circle',
      'emerald'
    );
  });
}

// Add New WhatsApp Phone Number / Slot
function addNewWhatsAppAccountSlot() {
  const nextNum = MULTI_ACCOUNTS_STATE.length + 1;
  const label = prompt(`Enter label for new WhatsApp account (e.g. Sales Team #${nextNum} or Support #${nextNum}):`, `WhatsApp Business #${nextNum}`);
  if (!label) return;

  fetch('http://localhost:3000/api/accounts/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label })
  })
    .then(r => r.json())
    .then(res => {
      showToast('New WhatsApp Slot Created', 'QR Code generation initiated. Scan with phone.', 'qr_code_scanner', 'emerald');
      setTimeout(fetchQRBridgeStatus, 1500);
    })
    .catch(err => {
      showToast('Error', 'Could not reach bridge server', 'error', 'rose');
    });
}

// Disconnect specific WhatsApp account session
function disconnectWhatsAppAccount(accountId) {
  if (confirm(`Disconnect and log out WhatsApp session for ${accountId}? All CRM messages, notes & customer history will remain 100% safe.`)) {
    fetch('http://localhost:3000/api/accounts/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId })
    })
      .then(r => r.json())
      .then(res => {
        showToast('Account Disconnected', `WhatsApp session logged out. All CRM chats & records are safely preserved.`, 'link_off', 'blue');
        setTimeout(fetchQRBridgeStatus, 1500);
      })
      .catch(() => {
        showToast('Notice', 'Disconnect signal sent to bridge.', 'info', 'blue');
        setTimeout(fetchQRBridgeStatus, 1500);
      });
  }
}

function refreshSpecificAccount(accountId) {
  fetchQRBridgeStatus();
  showToast('Refreshed', 'Synced with WhatsApp Bridge', 'sync', 'emerald');
}

function renderWhatsAppSettings() {
  fetchQRBridgeStatus();

  // Populate brand inputs from CRM_STATE
  const brandName = getBrandName();
  const brandTagline = getBrandTagline();
  const website = CRM_STATE?.brandSettings?.website || 'www.grmgarments.com';
  const includeHeader = CRM_STATE?.brandSettings?.includeBrandHeader ?? true;

  const brandNameInput = document.getElementById('cfg-brand-name');
  const taglineInput = document.getElementById('cfg-brand-tagline');
  const websiteInput = document.getElementById('cfg-brand-website');
  const headerToggle = document.getElementById('cfg-brand-header-toggle');

  if (brandNameInput) brandNameInput.value = brandName;
  if (taglineInput) taglineInput.value = brandTagline;
  if (websiteInput) websiteInput.value = website;
  if (headerToggle) headerToggle.checked = includeHeader;

  updateBrandPreview();
}

function handleSaveWhatsAppConfig(event) {
  event.preventDefault();
  const phone = document.getElementById('cfg-phone-number').value.trim();
  const displayName = document.getElementById('cfg-display-name').value.trim();
  const provider = document.getElementById('cfg-provider').value;
  const verifyToken = document.getElementById('cfg-verify-token').value.trim();

  if (!phone) {
    alert('Please enter a valid WhatsApp phone number');
    return;
  }

  CRM_STATE.whatsappAccount.phoneNumber = phone;
  CRM_STATE.whatsappAccount.displayName = displayName;
  CRM_STATE.whatsappAccount.provider = provider;
  CRM_STATE.whatsappAccount.verifyToken = verifyToken;
  CRM_STATE.whatsappAccount.status = 'CONNECTED';

  // Save to backend API as well
  fetch('api.php?action=save_config', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone_number: phone,
      display_name: displayName,
      provider: provider,
      webhook_verify_token: verifyToken
    })
  }).catch(() => { });

  logAudit('WHATSAPP_ACCOUNT_CONFIGURED', 'SETTINGS', `Admin set primary business number to ${phone} (${displayName})`);

  saveCRMState();
  updateConfiguredPhoneDisplays();
  showToast('WhatsApp Phone Number Saved!', `Active Business Number updated to ${phone}. Messages will route dynamically.`, 'check_circle', 'emerald');
  playChime('order');
}

function handleSendQuickTestToNumber() {
  const phoneInput = document.getElementById('cfg-phone-number');
  let rawPhone = phoneInput ? phoneInput.value.trim() : CRM_STATE.whatsappAccount.phoneNumber;
  if (!rawPhone) rawPhone = '9789660115';

  // Clean & format with +91 if needed
  let cleanDigits = rawPhone.replace(/[^0-9]/g, '');
  let formattedPhone = rawPhone.startsWith('+') ? rawPhone : (cleanDigits.length === 10 ? `+91 ${cleanDigits}` : `+${cleanDigits}`);

  // Save as current connected business phone
  CRM_STATE.whatsappAccount.phoneNumber = formattedPhone;
  saveCRMState();
  updateConfiguredPhoneDisplays();

  // Trigger simulated inbound customer message to this number
  const testCustomer = {
    sender_name: 'Karthik Raja (New Customer)',
    sender_phone: '+91 94440 88991',
    message_text: `Hello GRM Garments! I am messaging your business WhatsApp (${formattedPhone}). Is the Baby Cotton Frock (Pink, 2-3Y) available? Can you send me photos?`,
    priority: 'HIGH',
    assigned_to: 'UNASSIGNED',
    source: 'TEST_INBOUND'
  };

  ingestInboundMessage(testCustomer);
  showToast('Test Message Received!', `Customer query arrived dynamically at ${formattedPhone}`, 'send_to_mobile', 'emerald');

  // Switch to inbox view so user sees it instantly
  switchView('inbox');
}

// =========================================================================
// 13. DATA BACKUP & RESTORE MODULE (Section 53)
// =========================================================================
function renderBackupView() {
  const totalRecordsEl = document.getElementById('backup-total-records');
  const lastTimeEl = document.getElementById('backup-last-time');

  let totalCount = 0;
  totalCount += (CRM_STATE.customers || []).length;
  totalCount += (CRM_STATE.queries || []).length;
  totalCount += (CRM_STATE.orders || []).length;
  totalCount += (CRM_STATE.products || []).length;
  totalCount += (CRM_STATE.followups || []).length;
  totalCount += (CRM_STATE.auditLogs || []).length;

  Object.values(CRM_STATE.conversations || {}).forEach(arr => {
    totalCount += arr.length;
  });

  if (totalRecordsEl) totalRecordsEl.innerText = `${totalCount} Records`;
  if (lastTimeEl) lastTimeEl.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function handleExportBackupJSON() {
  const backupPayload = {
    version: '2.5.0',
    exported_at: new Date().toISOString(),
    system: 'GRM Garments CRM — WhatsApp Communication Hub',
    data: CRM_STATE
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  const now = new Date();
  const filename = `grm_crm_backup_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}.json`;

  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", filename);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  logAudit('DATABASE_BACKUP_EXPORTED', 'BACKUP', `Exported full database snapshot backup file: ${filename}`);
  saveCRMState();
  showToast('Database Backup Exported!', `Saved complete CRM database snapshot (${filename})`, 'cloud_download', 'emerald');
}

function handleImportBackupJSON(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed.data && parsed.data.customers && parsed.data.queries) {
        CRM_STATE = parsed.data;
        saveCRMState();
        showToast('Database Restored Successfully!', 'All customers, chats, and orders recovered.', 'cloud_done', 'emerald');
        logAudit('DATABASE_RESTORED', 'BACKUP', `Restored database from uploaded backup file: ${file.name}`);
        setTimeout(() => location.reload(), 800);
      } else {
        alert('Invalid CRM backup file format. Please upload a valid JSON backup file.');
      }
    } catch (err) {
      alert('Error parsing backup file: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// =========================================================================
// 13.5. STAFF MANAGEMENT MODULE (Create Staff, Assign Role, Quota Allocations, Total Staff List)
// =========================================================================
let ACTIVE_STAFF_TAB = 'list'; // 'list', 'quota', 'create', 'roles'

function renderStaffView() {
  switchStaffTab(ACTIVE_STAFF_TAB || 'list');
  renderStaffTable();
  renderStaffQuotaView();
  updateStaffRoleSelectDropdowns();
}

function switchStaffTab(tab) {
  ACTIVE_STAFF_TAB = tab;
  ['list', 'quota', 'create', 'roles'].forEach(t => {
    const btn = document.getElementById(`tab-btn-staff-${t}`);
    const subview = document.getElementById(`subview-staff-${t}`);
    if (btn) {
      if (t === tab) {
        btn.className = "px-3.5 py-2 bg-brand-wa text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition";
      } else {
        btn.className = "px-3.5 py-2 text-slate-300 hover:text-white hover:bg-white/10 text-xs font-bold rounded-lg transition flex items-center gap-1.5";
      }
    }
    if (subview) {
      if (t === tab) subview.classList.remove('hidden');
      else subview.classList.add('hidden');
    }
  });

  if (tab === 'list') renderStaffTable();
  if (tab === 'quota') renderStaffQuotaView();
  if (tab === 'roles') updateStaffRoleSelectDropdowns();
}

function renderStaffTable() {
  const tbody = document.getElementById('staff-list-table-body');
  if (!tbody) return;

  const searchQuery = (document.getElementById('staff-search-input')?.value || '').toLowerCase();
  const staffList = CRM_STATE.staffList || [];

  // Update KPI counters
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter(s => (s.status || 'ACTIVE') === 'ACTIVE').length;
  const totalLeadsHandled = (CRM_STATE.queries || []).filter(q => q.assignedTo !== 'UNASSIGNED').length;
  const totalOrders = (CRM_STATE.orders || []).length;

  const totalEl = document.getElementById('kpi-staff-total');
  const activeEl = document.getElementById('kpi-staff-active');
  const leadsEl = document.getElementById('kpi-staff-leads');
  const ordersEl = document.getElementById('kpi-staff-orders');
  const badgeTotalStaff = document.getElementById('badge-total-staff-count');

  if (totalEl) totalEl.innerText = `${totalStaff} Members`;
  if (activeEl) activeEl.innerText = `${activeStaff} Active`;
  if (leadsEl) leadsEl.innerText = `${totalLeadsHandled} Leads`;
  if (ordersEl) ordersEl.innerText = `${totalOrders} Orders`;
  if (badgeTotalStaff) badgeTotalStaff.innerText = totalStaff;

  // Filter staff list
  let filtered = staffList;
  if (searchQuery) {
    filtered = filtered.filter(s =>
      s.name.toLowerCase().includes(searchQuery) ||
      (s.role && s.role.toLowerCase().includes(searchQuery)) ||
      (s.email && s.email.toLowerCase().includes(searchQuery)) ||
      (s.phone && s.phone.includes(searchQuery))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="py-8 text-center text-slate-400 text-xs font-normal">
          No staff members found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(staff => {
    const activeQueries = (CRM_STATE.queries || []).filter(q => q.assignedTo === staff.id).length;
    const status = staff.status || 'ACTIVE';
    const isActive = status === 'ACTIVE';
    const quota = staff.dailyQuota || 70;
    const handled = staff.todayHandled || 0;
    const quotaPct = quota > 0 ? Math.min(100, Math.round((handled / quota) * 100)) : 0;

    return `
      <tr class="hover:bg-slate-50/80 transition">
        <!-- 1. Staff Member & Avatar -->
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-dark to-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
              ${staff.avatar || staff.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h4 class="font-bold text-slate-900 text-xs">${staff.name}</h4>
                <span class="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">${staff.id}</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">${staff.email || `${staff.id}@grmgarments.com`}</p>
            </div>
          </div>
        </td>

        <!-- 2. Role & Specialization -->
        <td class="py-3.5 px-4">
          <div class="space-y-1">
            <span class="inline-block bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
              ${staff.role || 'Sales Specialist'}
            </span>
            <p class="text-[11px] text-slate-500 font-medium">Dept: <span class="text-slate-700">${staff.specialization || 'General Apparel'}</span></p>
          </div>
        </td>

        <!-- 3. Daily Quota -->
        <td class="py-3.5 px-4 text-center">
          <span class="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono font-bold text-xs inline-block shadow-sm">
            ${quota} msgs/day
          </span>
        </td>

        <!-- 4. Today Handled Progress -->
        <td class="py-3.5 px-4">
          <div class="space-y-1 min-w-[100px]">
            <div class="flex items-center justify-between text-xs font-mono font-bold text-slate-800">
              <span>${handled} msgs</span>
              <span class="text-[10px] text-slate-400 font-normal">(${quotaPct}%)</span>
            </div>
            <div class="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden border border-slate-200">
              <div class="h-full ${quotaPct >= 100 ? 'bg-rose-500' : (quotaPct >= 80 ? 'bg-amber-400' : 'bg-emerald-500')} rounded-full transition-all duration-300" style="width: ${quotaPct}%"></div>
            </div>
          </div>
        </td>

        <!-- 5. Active Leads Handled -->
        <td class="py-3.5 px-4">
          <span class="px-2.5 py-1 rounded-full text-xs font-bold ${activeQueries > 0 ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-600'}">
            ${activeQueries} Active Leads
          </span>
        </td>

        <!-- 6. Converted Orders -->
        <td class="py-3.5 px-4 font-mono font-bold text-emerald-700 text-xs">
          ${staff.converted || 0} Orders
        </td>

        <!-- 7. Status -->
        <td class="py-3.5 px-4">
          <button type="button" onclick="toggleStaffStatus('${staff.id}')" class="px-2.5 py-1 rounded-full text-[10px] font-bold transition flex items-center gap-1 ${isActive ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}" title="Click to toggle Active / On-Leave status">
            <span class="w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'}"></span>
            <span>${isActive ? 'Active (On-Duty)' : 'On Leave'}</span>
          </button>
        </td>

        <!-- 8. Actions -->
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" onclick="switchStaffTab('quota')" class="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Adjust Daily Quota">
              <span class="material-symbols-outlined text-[16px]">pie_chart</span>
            </button>
            <button type="button" onclick="quickAssignRoleForStaff('${staff.id}')" class="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition" title="Assign / Edit Role">
              <span class="material-symbols-outlined text-[16px]">admin_panel_settings</span>
            </button>
            <button type="button" onclick="deleteStaffMember('${staff.id}')" class="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition" title="Remove Staff Member">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// =========================================================================
// 13.6. DAILY MESSAGE QUOTA MANAGEMENT (200 Inbound Target Allocation)
// =========================================================================
function renderStaffQuotaView() {
  const tbody = document.getElementById('staff-quota-table-body');
  if (!tbody) return;

  const staffList = CRM_STATE.staffList || [];
  const target = (CRM_STATE.dailyMessageTarget && CRM_STATE.dailyMessageTarget.expectedPerDay) || 200;

  if (staffList.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="py-8 text-center text-slate-400 text-xs font-normal">
          No staff members onboarded yet. Add staff members first.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = staffList.map(staff => {
    const quota = staff.dailyQuota || 0;
    const handled = staff.todayHandled || 0;
    const pct = quota > 0 ? Math.min(100, Math.round((handled / quota) * 100)) : 0;
    const isOver = handled >= quota && quota > 0;
    const remaining = Math.max(0, quota - handled);

    return `
      <tr class="hover:bg-slate-50/80 transition">
        <!-- Staff Member & Avatar -->
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-dark to-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
              ${staff.avatar || staff.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div class="flex items-center gap-1.5">
                <h4 class="font-bold text-slate-900 text-xs">${staff.name}</h4>
                <span class="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">${staff.id}</span>
              </div>
              <p class="text-[11px] text-slate-500 mt-0.5">${staff.email || `${staff.id}@grmgarments.com`}</p>
            </div>
          </div>
        </td>

        <!-- Role / Department -->
        <td class="py-3.5 px-4">
          <span class="inline-block bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
            ${staff.role || 'Sales Specialist'}
          </span>
        </td>

        <!-- Daily Message Quota (Target) Input -->
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2">
            <input type="number" id="quota-input-${staff.id}" min="0" max="500" value="${quota}" oninput="updateQuotaLiveSummary()" class="w-24 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-brand-wa text-center">
            <span class="text-[11px] text-slate-500 font-medium">msgs/day</span>
          </div>
        </td>

        <!-- Today Handled -->
        <td class="py-3.5 px-4 font-mono font-bold text-xs ${isOver ? 'text-rose-600' : 'text-slate-800'}">
          ${handled} msgs
        </td>

        <!-- Utilization Progress Bar -->
        <td class="py-3.5 px-4">
          <div class="w-36 space-y-1">
            <div class="flex items-center justify-between text-[10px] font-bold">
              <span class="${isOver ? 'text-rose-600' : 'text-slate-600'}">${pct}% filled</span>
              <span class="text-slate-400 font-mono">${remaining} left</span>
            </div>
            <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200">
              <div class="h-full ${pct >= 100 ? 'bg-rose-500' : (pct >= 80 ? 'bg-amber-400' : 'bg-emerald-500')} rounded-full transition-all duration-300" style="width: ${pct}%"></div>
            </div>
          </div>
        </td>

        <!-- Quick Set Actions -->
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button type="button" onclick="setQuickStaffQuota('${staff.id}', 50)" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold font-mono transition">50</button>
            <button type="button" onclick="setQuickStaffQuota('${staff.id}', 70)" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold font-mono transition">70</button>
            <button type="button" onclick="setQuickStaffQuota('${staff.id}', 100)" class="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold font-mono transition">100</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  updateQuotaLiveSummary();
}

function setQuickStaffQuota(staffId, amount) {
  const input = document.getElementById(`quota-input-${staffId}`);
  if (input) {
    input.value = amount;
    updateQuotaLiveSummary();
  }
}

function updateQuotaLiveSummary() {
  const staffList = CRM_STATE.staffList || [];
  const target = (CRM_STATE.dailyMessageTarget && CRM_STATE.dailyMessageTarget.expectedPerDay) || 200;
  let totalAllocated = 0;

  staffList.forEach(staff => {
    const input = document.getElementById(`quota-input-${staff.id}`);
    if (input) {
      totalAllocated += parseInt(input.value, 10) || 0;
    } else {
      totalAllocated += (Number(staff.dailyQuota) || 0);
    }
  });

  const kpiExpected = document.getElementById('kpi-quota-expected');
  const kpiAllocated = document.getElementById('kpi-quota-allocated');
  const kpiBalanceLabel = document.getElementById('kpi-quota-balance-label');

  if (kpiExpected) kpiExpected.innerText = `${target} msgs / day`;
  if (kpiAllocated) kpiAllocated.innerText = `${totalAllocated} / ${target} msgs`;

  if (kpiBalanceLabel) {
    if (totalAllocated === target) {
      kpiBalanceLabel.innerHTML = `<span class="material-symbols-outlined text-[14px]">check_circle</span> 100% Team Capacity Distributed (${totalAllocated}/${target})`;
      kpiBalanceLabel.className = "text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1";
    } else if (totalAllocated < target) {
      const rem = target - totalAllocated;
      kpiBalanceLabel.innerHTML = `<span class="material-symbols-outlined text-[14px]">warning</span> ${rem} msgs remaining to allocate`;
      kpiBalanceLabel.className = "text-[11px] text-amber-600 font-semibold mt-1 flex items-center gap-1";
    } else {
      const over = totalAllocated - target;
      kpiBalanceLabel.innerHTML = `<span class="material-symbols-outlined text-[14px]">info</span> Over-allocated by ${over} msgs`;
      kpiBalanceLabel.className = "text-[11px] text-blue-600 font-semibold mt-1 flex items-center gap-1";
    }
  }
}

function handleAutoBalanceQuota() {
  const activeStaff = (CRM_STATE.staffList || []).filter(s => (s.status || 'ACTIVE') === 'ACTIVE');
  if (activeStaff.length === 0) {
    alert('No active staff members available to allocate quota.');
    return;
  }

  const target = (CRM_STATE.dailyMessageTarget && CRM_STATE.dailyMessageTarget.expectedPerDay) || 200;
  const baseCount = Math.floor(target / activeStaff.length);
  let remainder = target % activeStaff.length;

  activeStaff.forEach((staff, idx) => {
    let quota = baseCount;
    if (remainder > 0) {
      quota += 1;
      remainder -= 1;
    }
    staff.dailyQuota = quota;
    const input = document.getElementById(`quota-input-${staff.id}`);
    if (input) input.value = quota;
  });

  // Set inactive staff to 0
  (CRM_STATE.staffList || []).forEach(staff => {
    if ((staff.status || 'ACTIVE') !== 'ACTIVE') {
      staff.dailyQuota = 0;
      const input = document.getElementById(`quota-input-${staff.id}`);
      if (input) input.value = 0;
    }
  });

  CRM_STATE.dailyMessageTarget.allocatedPerDay = target;
  saveCRMState();
  renderStaffQuotaView();
  renderStaffTable();
  if (CURRENT_USER) applyRoleBasedAccessControl(CURRENT_USER);
  playChime('order');
  showToast(
    '200 Quota Distributed Equally!',
    `Target ${target} msgs successfully balanced across ${activeStaff.length} active staff members.`,
    'balance',
    'emerald'
  );
}

function handleSaveDailyAllocations() {
  const staffList = CRM_STATE.staffList || [];
  let totalAllocated = 0;

  staffList.forEach(staff => {
    const input = document.getElementById(`quota-input-${staff.id}`);
    if (input) {
      staff.dailyQuota = parseInt(input.value, 10) || 0;
    }
    totalAllocated += (Number(staff.dailyQuota) || 0);
  });

  if (!CRM_STATE.dailyMessageTarget) {
    CRM_STATE.dailyMessageTarget = { expectedPerDay: 200, allocatedPerDay: totalAllocated, lastResetDate: new Date().toISOString().split('T')[0] };
  } else {
    CRM_STATE.dailyMessageTarget.allocatedPerDay = totalAllocated;
  }

  logAudit('QUOTA_ALLOCATED', 'STAFF_MODULE', `Admin updated daily message quota distribution across ${staffList.length} staff (Total: ${totalAllocated} msgs)`);

  saveCRMState();
  renderStaffQuotaView();
  renderStaffTable();
  if (CURRENT_USER) applyRoleBasedAccessControl(CURRENT_USER);
  playChime('order');
  showToast(
    'Quota Allocations Saved!',
    `Allocated ${totalAllocated} daily message capacity across staff members.`,
    'check_circle',
    'emerald'
  );
}

function openEditExpectedDailyTargetPrompt() {
  const current = (CRM_STATE.dailyMessageTarget && CRM_STATE.dailyMessageTarget.expectedPerDay) || 200;
  const newVal = prompt('Enter expected daily WhatsApp inbound message volume target:', current);
  if (newVal !== null) {
    const num = parseInt(newVal, 10);
    if (!isNaN(num) && num > 0) {
      if (!CRM_STATE.dailyMessageTarget) CRM_STATE.dailyMessageTarget = {};
      CRM_STATE.dailyMessageTarget.expectedPerDay = num;
      saveCRMState();
      renderStaffQuotaView();
      renderStaffTable();
      updateBadgeCounters();
      showToast('Daily Target Updated', `Expected daily inbound target is now ${num} messages.`, 'tune', 'blue');
    } else {
      alert('Please enter a valid positive number.');
    }
  }
}

function handleCreateNewStaff(event) {
  event.preventDefault();
  const name = document.getElementById('staff-new-name').value.trim();
  const email = document.getElementById('staff-new-email').value.trim();
  const phone = document.getElementById('staff-new-phone').value.trim();
  const role = document.getElementById('staff-new-role').value;
  const specialization = document.getElementById('staff-new-specialization').value;
  const status = document.getElementById('staff-new-status').value;

  if (!name || !phone) {
    alert('Please enter staff name and phone number.');
    return;
  }

  const nextIdx = (CRM_STATE.staffList.length + 1);
  const newStaffId = `staff_0${nextIdx}`;
  const avatarInitials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const newStaff = {
    id: newStaffId,
    name: name,
    email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@grmgarments.com`,
    phone: phone,
    role: role,
    specialization: specialization,
    avatar: avatarInitials,
    status: status,
    activeQueries: 0,
    converted: 0,
    dailyQuota: 50,
    todayHandled: 0,
    joinedAt: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  };

  CRM_STATE.staffList.push(newStaff);

  // Update role dropdown switcher in sidebar
  const roleSelect = document.getElementById('user-role-select');
  if (roleSelect) {
    const opt = document.createElement('option');
    opt.value = newStaffId;
    opt.innerText = `👤 ${newStaff.name} (${role.split(' ')[0]})`;
    roleSelect.appendChild(opt);
  }

  logAudit('STAFF_CREATED', 'STAFF_MODULE', `Created new staff member ${name} (${newStaffId}) with role "${role}"`);

  saveCRMState();
  playChime('order');
  showToast('Staff Created Successfully!', `${name} is onboarded and ready for lead assignments.`, 'person_add', 'emerald');

  // Reset form & switch to list tab
  event.target.reset();
  switchStaffTab('list');
}

function updateStaffRoleSelectDropdowns() {
  const staffSelect = document.getElementById('role-assign-staff-select');
  if (!staffSelect) return;

  staffSelect.innerHTML = CRM_STATE.staffList.map(s => `
    <option value="${s.id}">${s.name} (${s.id}) — Current: ${s.role}</option>
  `).join('');
}

function handleQuickRoleReassign(event) {
  event.preventDefault();
  const staffId = document.getElementById('role-assign-staff-select').value;
  const newRole = document.getElementById('role-assign-new-role').value;

  const staff = CRM_STATE.staffList.find(s => s.id === staffId);
  if (!staff) return;

  const oldRole = staff.role;
  staff.role = newRole;

  logAudit('STAFF_ROLE_REASSIGNED', 'STAFF_MODULE', `Reassigned role of ${staff.name} from "${oldRole}" to "${newRole}"`);

  saveCRMState();
  updateStaffRoleSelectDropdowns();
  playChime('order');
  showToast('Role Updated!', `${staff.name} is now assigned as "${newRole}".`, 'admin_panel_settings', 'purple');
}

function quickAssignRoleForStaff(staffId) {
  switchStaffTab('roles');
  const staffSelect = document.getElementById('role-assign-staff-select');
  if (staffSelect) {
    staffSelect.value = staffId;
  }
}

function toggleStaffStatus(staffId) {
  const staff = CRM_STATE.staffList.find(s => s.id === staffId);
  if (!staff) return;

  staff.status = (staff.status === 'ACTIVE') ? 'ON_LEAVE' : 'ACTIVE';
  saveCRMState();
  renderStaffTable();
  renderStaffQuotaView();
  showToast(
    'Status Updated',
    `${staff.name} is now marked as ${staff.status === 'ACTIVE' ? 'Active (Ready for Leads)' : 'On Leave (Paused)'}`,
    staff.status === 'ACTIVE' ? 'check_circle' : 'pause_circle',
    staff.status === 'ACTIVE' ? 'emerald' : 'amber'
  );
}

function deleteStaffMember(staffId) {
  const staff = CRM_STATE.staffList.find(s => s.id === staffId);
  if (!staff) return;

  if (confirm(`Remove staff member ${staff.name} (${staff.id})? Any active queries assigned to this staff will be safely moved to UNASSIGNED queue.`)) {
    // Reassign active queries to UNASSIGNED
    CRM_STATE.queries.forEach(q => {
      if (q.assignedTo === staffId) {
        q.assignedTo = 'UNASSIGNED';
        q.status = 'NEW';
      }
    });

    CRM_STATE.staffList = CRM_STATE.staffList.filter(s => s.id !== staffId);

    // Remove from sidebar role select dropdown
    const roleSelect = document.getElementById('user-role-select');
    if (roleSelect) {
      const opt = roleSelect.querySelector(`option[value="${staffId}"]`);
      if (opt) opt.remove();
    }

    logAudit('STAFF_DELETED', 'STAFF_MODULE', `Removed staff member ${staff.name} (${staffId})`);

    saveCRMState();
    renderStaffTable();
    renderStaffQuotaView();
    updateStaffRoleSelectDropdowns();
    showToast('Staff Member Removed', `${staff.name} removed. Active leads moved to Unassigned queue.`, 'delete', 'blue');
  }
}

// =========================================================================
// 14. UTILITY & MODAL CONTROLLERS
// =========================================================================
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function logAudit(action, module, details) {
  const user = ACTIVE_ROLE === 'admin' ? 'Super Admin' : (CRM_STATE.staffList.find(s => s.id === ACTIVE_ROLE)?.name || 'Staff');
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  CRM_STATE.auditLogs.unshift({ timestamp, user, action, module, details });
}

function updateBadgeCounters() {
  const unassignedCount = (CRM_STATE.queries || []).filter(q => q.assignedTo === 'UNASSIGNED').length;
  const unreadCount = (CRM_STATE.queries || []).reduce((acc, q) => acc + (q.unreadCount || 0), 0);
  const myQueueCount = ACTIVE_ROLE === 'admin'
    ? (CRM_STATE.queries || []).length
    : (CRM_STATE.queries || []).filter(q => q.assignedTo === ACTIVE_ROLE).length;

  const bUnassigned = document.getElementById('badge-unassigned-count');
  if (bUnassigned) bUnassigned.innerText = `${unassignedCount} New`;

  const bUnread = document.getElementById('badge-total-unread');
  if (bUnread) bUnread.innerText = unreadCount;

  const countAll = document.getElementById('count-all');
  if (countAll) countAll.innerText = (CRM_STATE.queries || []).length;

  const countUnassigned = document.getElementById('count-unassigned');
  if (countUnassigned) countUnassigned.innerText = unassignedCount;

  const countMy = document.getElementById('count-my');
  if (countMy) countMy.innerText = myQueueCount;

  // Update Daily Inbound Messages Progress Counter (e.g. 200 msgs target)
  const target = (CRM_STATE.dailyMessageTarget && CRM_STATE.dailyMessageTarget.expectedPerDay) || 200;
  const staffHandledTotal = (CRM_STATE.staffList || []).reduce((sum, s) => sum + (Number(s.todayHandled) || 0), 0);
  const totalReceivedToday = staffHandledTotal + unassignedCount;
  const todayPct = Math.min(100, Math.round((totalReceivedToday / (target || 1)) * 100));

  const inboxTodayEl = document.getElementById('inbox-today-message-count');
  if (inboxTodayEl) {
    inboxTodayEl.innerText = `${totalReceivedToday} / ${target} msgs (${todayPct}%)`;
  }

  // Update Quota View KPI Counters if visible
  const kpiExpected = document.getElementById('kpi-quota-expected');
  const kpiAllocated = document.getElementById('kpi-quota-allocated');
  const kpiTodayReceived = document.getElementById('kpi-quota-today-received');
  const kpiProgressBar = document.getElementById('kpi-quota-progress-bar');

  if (kpiExpected) kpiExpected.innerText = `${target} msgs / day`;
  if (kpiTodayReceived) kpiTodayReceived.innerText = `${totalReceivedToday} / ${target} msgs (${todayPct}%)`;
  if (kpiProgressBar) kpiProgressBar.style.width = `${todayPct}%`;

  const totalAllocated = (CRM_STATE.staffList || []).reduce((sum, s) => sum + (Number(s.dailyQuota) || 0), 0);
  if (kpiAllocated) kpiAllocated.innerText = `${totalAllocated} / ${target} msgs`;
}

function filterConversations(val) {
  renderInboxConversationList();
}

function toggleNotificationDrawer() {
  showToast('Follow-up Reminder', 'Priya Sundaram follow-up is scheduled for today at 12:00 PM', 'alarm', 'blue');
}

// INITIALIZE APP ON LOAD
window.addEventListener('DOMContentLoaded', () => {
  initCRMState();
  initAuthSystem();
});
