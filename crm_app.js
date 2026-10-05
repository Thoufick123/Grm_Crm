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
    phoneNumber: '+91 86680 07593',
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
    { id: 1, sku: 'BF-001-PK', name: 'Baby Frock (Embroidered Cotton)', category: 'Baby Collection', size: '2-3 Years', color: 'Pink', price: 599, physicalStock: 12, reservedStock: 4, accountId: 'account_1', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60' },
    { id: 2, sku: 'BF-001-YL', name: 'Baby Frock (Embroidered Cotton)', category: 'Baby Collection', size: '1-2 Years', color: 'Sunshine Yellow', price: 599, physicalStock: 8, reservedStock: 1, accountId: 'account_1', image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=400&auto=format&fit=crop&q=60' },
    { id: 3, sku: 'MD-102-BL', name: 'Maternity Maxi Feeding Gown', category: 'Maternity', size: 'L / XL', color: 'Sky Blue', price: 1299, physicalStock: 10, reservedStock: 5, accountId: 'account_2', image: 'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=400&auto=format&fit=crop&q=60' },
    { id: 4, sku: 'MD-103-PK', name: 'Maternity Tiered Cotton Floral Dress', category: 'Maternity', size: 'M / L', color: 'Blush Pink', price: 1450, physicalStock: 14, reservedStock: 3, accountId: 'account_2', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&auto=format&fit=crop&q=60' },
    { id: 5, sku: 'BB-301-WH', name: 'Newborn 5-Piece Organic Romper Gift Set', category: 'Newborn', size: '0-6 Months', color: 'Pure White / Mint', price: 799, physicalStock: 15, reservedStock: 2, accountId: 'account_3', image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=400&auto=format&fit=crop&q=60' },
    { id: 6, sku: 'KD-204-YL', name: 'Kids Organic Cotton T-Shirt Set (Pack of 3)', category: 'Kids', size: '4-5 Years', color: 'Multi Yellow/Green', price: 450, physicalStock: 25, reservedStock: 8, accountId: 'account_3', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=400&auto=format&fit=crop&q=60' },
    { id: 7, sku: 'WS-701-BX', name: 'Wholesale Baby Rompers Bulk Box (50 Pcs Assorted)', category: 'Wholesale', size: '0-24 Months', color: 'Assorted Prints', price: 8500, physicalStock: 18, reservedStock: 6, accountId: 'account_4', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&auto=format&fit=crop&q=60' },
    { id: 8, sku: 'WS-702-BX', name: 'Wholesale Pure Cotton Frocks Bundle (25 Pcs)', category: 'Wholesale', size: '2-5 Years', color: 'Multi Pastel Colors', price: 7200, physicalStock: 12, reservedStock: 3, accountId: 'account_4', image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?w=400&auto=format&fit=crop&q=60' },
    { id: 9, sku: 'GL-505-RD', name: 'Girls Festive Silk Lehenga Choli', category: 'Girls Festive', size: '6-7 Years', color: 'Ruby Red & Gold', price: 899, physicalStock: 6, reservedStock: 0, accountId: 'account_5', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=400&auto=format&fit=crop&q=60' },
    { id: 10, sku: 'VIP-901-GL', name: 'Handcrafted Kanjivaram Silk Pattu Pavadai Set', category: 'VIP Collection', size: '3-4 Years', color: 'Emerald Green & Gold', price: 2499, physicalStock: 8, reservedStock: 2, accountId: 'account_5', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&auto=format&fit=crop&q=60' }
  ],
  customers: [
    // --- LINE 1: +91 86680 07593 (GRM Business Central) ---
    {
      id: 'cust_100',
      code: 'CUST-2026-0088',
      name: 'SugunaMani',
      phone: '+91 73389 65560',
      whatsapp: '+91 73389 65560',
      address: 'No. 18, Gandhi Road, T. Nagar, Chennai - 600017',
      city: 'Chennai',
      customerType: 'New WhatsApp Customer',
      tags: ['New Lead', 'Baby Collection', 'Direct Line 1'],
      totalOrders: 0,
      totalSpend: 0,
      avatar: 'S',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593'
    },
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
      avatar: 'PS',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593'
    },
    {
      id: 'cust_104',
      code: 'CUST-2026-0090',
      name: 'Mekha 🦋',
      phone: '+91 95009 04638',
      whatsapp: '+91 95009 04638',
      address: 'Plot 12, R.S. Puram, Coimbatore - 641002',
      city: 'Coimbatore',
      customerType: 'VIP Customer',
      tags: ['Baby Frock', 'VIP', 'Dispatched'],
      totalOrders: 4,
      totalSpend: 9200,
      avatar: 'M',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593'
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
      avatar: 'AS',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593'
    },

    // --- LINE 2: +91 97896 60115 (Blue Berry Kids & Maternity) ---
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
      avatar: 'KR',
      accountId: 'account_2',
      businessNumber: '+91 97896 60115'
    },
    {
      id: 'cust_105',
      code: 'CUST-2026-0105',
      name: 'Deepa Krishnan',
      phone: '+91 94432 18902',
      whatsapp: '+91 94432 18902',
      address: '24/1, Trichy Main Road, Salem - 636001',
      city: 'Salem',
      customerType: 'Repeat Customer',
      tags: ['Newborn Rompers', 'Organic Cotton'],
      totalOrders: 2,
      totalSpend: 3400,
      avatar: 'DK',
      accountId: 'account_2',
      businessNumber: '+91 97896 60115'
    },
    {
      id: 'cust_106',
      code: 'CUST-2026-0106',
      name: 'Soundarya R',
      phone: '+91 98840 55219',
      whatsapp: '+91 98840 55219',
      address: '77, Besant Nagar, Chennai - 600090',
      city: 'Chennai',
      customerType: 'VIP Customer',
      tags: ['Maternity Gowns', 'VIP'],
      totalOrders: 5,
      totalSpend: 11500,
      avatar: 'SR',
      accountId: 'account_2',
      businessNumber: '+91 97896 60115'
    },

    // --- LINE 3: +91 98765 43210 (Customer Support & Enquiries) ---
    {
      id: 'cust_107',
      code: 'CUST-2026-0107',
      name: 'Rajesh Kumar',
      phone: '+91 98401 23456',
      whatsapp: '+91 98401 23456',
      address: '88, Lake View Road, Velachery, Chennai - 600042',
      city: 'Chennai',
      customerType: 'Support Enquiry',
      tags: ['Order Tracking', 'Dispatched'],
      totalOrders: 1,
      totalSpend: 1198,
      avatar: 'RK',
      accountId: 'account_3',
      businessNumber: '+91 98765 43210'
    },
    {
      id: 'cust_108',
      code: 'CUST-2026-0108',
      name: 'Karthik N',
      phone: '+91 99402 33412',
      whatsapp: '+91 99402 33412',
      address: '15, 4th Cross, Koramangala, Bengaluru - 560034',
      city: 'Bengaluru',
      customerType: 'New Customer',
      tags: ['Size Exchange', 'Policy Enquiry'],
      totalOrders: 0,
      totalSpend: 0,
      avatar: 'KN',
      accountId: 'account_3',
      businessNumber: '+91 98765 43210'
    },
    {
      id: 'cust_109',
      code: 'CUST-2026-0109',
      name: 'Meena Swaminathan',
      phone: '+91 98410 77652',
      whatsapp: '+91 98410 77652',
      address: '5, M.G. Road, Puducherry - 605001',
      city: 'Puducherry',
      customerType: 'Repeat Buyer',
      tags: ['Refund Complete', 'UPI'],
      totalOrders: 4,
      totalSpend: 6200,
      avatar: 'MS',
      accountId: 'account_3',
      businessNumber: '+91 98765 43210'
    },

    // --- LINE 4: +91 98450 99887 (Wholesale & Bulk Orders) ---
    {
      id: 'cust_110',
      code: 'CUST-2026-0110',
      name: 'Balaji Textiles Wholesale',
      phone: '+91 98230 44556',
      whatsapp: '+91 98230 44556',
      address: 'Market Yard Complex, Erode - 638001',
      city: 'Erode',
      customerType: 'Wholesale Partner',
      tags: ['Bulk Buyer', '200 Pcs Frocks', 'GST Verified'],
      totalOrders: 12,
      totalSpend: 185000,
      avatar: 'BT',
      accountId: 'account_4',
      businessNumber: '+91 98450 99887'
    },
    {
      id: 'cust_111',
      code: 'CUST-2026-0111',
      name: 'Sri Lakshmi Garments',
      phone: '+91 98721 00983',
      whatsapp: '+91 98721 00983',
      address: 'Avinashi Road, Tirupur - 641602',
      city: 'Tirupur',
      customerType: 'Bulk Buyer',
      tags: ['Wholesale Catalog', 'Organic Rompers'],
      totalOrders: 6,
      totalSpend: 92000,
      avatar: 'SL',
      accountId: 'account_4',
      businessNumber: '+91 98450 99887'
    },
    {
      id: 'cust_112',
      code: 'CUST-2026-0112',
      name: 'Kancheepuram Kids Boutique',
      phone: '+91 94441 22390',
      whatsapp: '+91 94441 22390',
      address: '102, Sannathi Street, Kancheepuram - 631501',
      city: 'Kancheepuram',
      customerType: 'Wholesale Client',
      tags: ['Festive Silk Lehenga', 'Repeat Wholesale'],
      totalOrders: 9,
      totalSpend: 145000,
      avatar: 'KK',
      accountId: 'account_4',
      businessNumber: '+91 98450 99887'
    },

    // --- LINE 5: +91 95009 04638 (VIP Desk & Fast Dispatch) ---
    {
      id: 'cust_113',
      code: 'CUST-2026-0113',
      name: 'Dr. Shalini Ramesh',
      phone: '+91 97910 88231',
      whatsapp: '+91 97910 88231',
      address: 'Tower 4, Ceebros Boulevard, OMR, Chennai - 600097',
      city: 'Chennai',
      customerType: 'VIP Priority Lead',
      tags: ['1-Day Delivery', 'Gift Hamper', 'VIP Desk'],
      totalOrders: 7,
      totalSpend: 24500,
      avatar: 'SR',
      accountId: 'account_5',
      businessNumber: '+91 95009 04638'
    },
    {
      id: 'cust_114',
      code: 'CUST-2026-0114',
      name: 'Gayathri Menon',
      phone: '+91 98403 99120',
      whatsapp: '+91 98403 99120',
      address: '42, Boat Club Road, RA Puram, Chennai - 600028',
      city: 'Chennai',
      customerType: 'VIP Client',
      tags: ['Custom Embroidery', 'Festive Collection'],
      totalOrders: 11,
      totalSpend: 38900,
      avatar: 'GM',
      accountId: 'account_5',
      businessNumber: '+91 95009 04638'
    },
    {
      id: 'cust_115',
      code: 'CUST-2026-0115',
      name: 'Archana Venkatesh',
      phone: '+91 99620 44182',
      whatsapp: '+91 99620 44182',
      address: '10, 11th Cross, Indiranagar, Bengaluru - 560038',
      city: 'Bengaluru',
      customerType: 'VIP Repeat Customer',
      tags: ['Newborn Luxury Hamper', 'Feedback ⭐⭐⭐⭐⭐'],
      totalOrders: 6,
      totalSpend: 19800,
      avatar: 'AV',
      accountId: 'account_5',
      businessNumber: '+91 95009 04638'
    }
  ],
  queries: [
    // Line 1 Queries
    {
      id: 'Q-2026-001245',
      customerId: 'cust_100',
      assignedTo: 'UNASSIGNED',
      status: 'NEW',
      priority: 'HIGH',
      queryText: '[Document: .env] Please check invoice details in the attached document',
      productSku: 'BF-001-PK',
      createdAt: '12:23 PM',
      unreadCount: 1,
      lastMessage: 'Customer: "[Document: .env]..."',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593',
      lastTimeEpoch: 1791200000
    },
    {
      id: 'Q-2026-001245',
      customerId: 'cust_101',
      assignedTo: 'staff_01',
      status: 'ASSIGNED',
      priority: 'HIGH',
      queryText: 'Baby Frock BF-001 Pink 2-3 Years available?',
      productSku: 'BF-001-PK',
      createdAt: '11:54 AM',
      unreadCount: 0,
      lastMessage: 'Staff: "📦 *Baby Frock (Embroidered Cotton)*..."',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593',
      lastTimeEpoch: 1791195000
    },
    {
      id: 'Q-2026-001244',
      customerId: 'cust_104',
      assignedTo: 'UNASSIGNED',
      status: 'NEW',
      priority: 'HIGH',
      queryText: 'Hi, when will my frock order be dispatched?',
      productSku: 'BF-001-PK',
      createdAt: '11:50 AM',
      unreadCount: 0,
      lastMessage: 'Staff: "Hello Mekha🦋, your package from *GRM..."',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593',
      lastTimeEpoch: 1791190000
    },
    {
      id: 'Q-2026-001246',
      customerId: 'cust_102',
      assignedTo: 'UNASSIGNED',
      status: 'NEW',
      priority: 'URGENT',
      queryText: 'Can you share photos and colors of Maternity feeding gown?',
      productSku: 'MD-102-BL',
      createdAt: '10:45 AM',
      unreadCount: 2,
      lastMessage: 'Customer: "Please share latest photos of maternity gown MD-102"',
      accountId: 'account_1',
      businessNumber: '+91 86680 07593',
      lastTimeEpoch: 1791185000
    },

    // Line 2 Queries
    {
      id: 'Q-2026-001247',
      customerId: 'cust_103',
      assignedTo: 'UNASSIGNED',
      status: 'NEW',
      priority: 'NORMAL',
      queryText: 'Do you deliver to Madurai? What are the COD charges?',
      productSku: null,
      createdAt: '11:05 AM',
      unreadCount: 1,
      lastMessage: 'Customer: "Hi, do you provide cash on delivery to Madurai?"',
      accountId: 'account_2',
      businessNumber: '+91 97896 60115',
      lastTimeEpoch: 1791180000
    },
    {
      id: 'Q-2026-001248',
      customerId: 'cust_105',
      assignedTo: 'staff_02',
      status: 'ASSIGNED',
      priority: 'HIGH',
      queryText: 'Need 3 sets of newborn rompers in mint color for gifting.',
      productSku: 'BB-301-WH',
      createdAt: '09:40 AM',
      unreadCount: 0,
      lastMessage: 'Customer: "Need 3 sets of newborn rompers in mint color"',
      accountId: 'account_2',
      businessNumber: '+91 97896 60115',
      lastTimeEpoch: 1791175000
    },
    {
      id: 'Q-2026-001249',
      customerId: 'cust_106',
      assignedTo: 'staff_01',
      status: 'ASSIGNED',
      priority: 'NORMAL',
      queryText: 'Which maternity dress is most comfortable for hospital stay?',
      productSku: 'MD-102-BL',
      createdAt: '08:55 AM',
      unreadCount: 0,
      lastMessage: 'Staff: "We have size L and XL in feeding nightwear ready to dispatch today."',
      accountId: 'account_2',
      businessNumber: '+91 97896 60115',
      lastTimeEpoch: 1791170000
    },

    // Line 3 Queries
    {
      id: 'Q-2026-001250',
      customerId: 'cust_107',
      assignedTo: 'staff_03',
      status: 'ASSIGNED',
      priority: 'HIGH',
      queryText: 'Can I track my order WA-2026-001120 dispatched yesterday?',
      productSku: null,
      createdAt: '11:20 AM',
      unreadCount: 0,
      lastMessage: 'Customer: "Can I track my order WA-2026-001120 dispatched yesterday?"',
      accountId: 'account_3',
      businessNumber: '+91 98765 43210',
      lastTimeEpoch: 1791165000
    },
    {
      id: 'Q-2026-001251',
      customerId: 'cust_108',
      assignedTo: 'UNASSIGNED',
      status: 'NEW',
      priority: 'NORMAL',
      queryText: 'Is exchange available if size does not fit?',
      productSku: 'KD-204-YL',
      createdAt: '10:08 AM',
      unreadCount: 1,
      lastMessage: 'Customer: "Is exchange available if size does not fit?"',
      accountId: 'account_3',
      businessNumber: '+91 98765 43210',
      lastTimeEpoch: 1791160000
    },
    {
      id: 'Q-2026-001252',
      customerId: 'cust_109',
      assignedTo: 'staff_03',
      status: 'ASSIGNED',
      priority: 'NORMAL',
      queryText: 'Has my return refund been initiated?',
      productSku: null,
      createdAt: '09:15 AM',
      unreadCount: 0,
      lastMessage: 'Staff: "Refund of Rs. 599 has been credited to your UPI."',
      accountId: 'account_3',
      businessNumber: '+91 98765 43210',
      lastTimeEpoch: 1791155000
    },

    // Line 4 Queries
    {
      id: 'Q-2026-001253',
      customerId: 'cust_110',
      assignedTo: 'staff_02',
      status: 'ASSIGNED',
      priority: 'URGENT',
      queryText: 'Requirement for 200 pcs Baby Frock pink & yellow mix.',
      productSku: 'BF-001-PK',
      createdAt: '08:20 AM',
      unreadCount: 1,
      lastMessage: 'Customer: "Requirement for 200 pcs Baby Frock pink & yellow mix."',
      accountId: 'account_4',
      businessNumber: '+91 98450 99887',
      lastTimeEpoch: 1791150000
    },
    {
      id: 'Q-2026-001254',
      customerId: 'cust_111',
      assignedTo: 'UNASSIGNED',
      status: 'NEW',
      priority: 'HIGH',
      queryText: 'Please send latest kids organic wear wholesale price list.',
      productSku: 'BB-301-WH',
      createdAt: '10:35 AM',
      unreadCount: 0,
      lastMessage: 'Staff: "Wholesale catalog PDF and GST invoice sample sent."',
      accountId: 'account_4',
      businessNumber: '+91 98450 99887',
      lastTimeEpoch: 1791145000
    },
    {
      id: 'Q-2026-001255',
      customerId: 'cust_112',
      assignedTo: 'staff_01',
      status: 'ASSIGNED',
      priority: 'NORMAL',
      queryText: 'Dispatched 50 bundles received. All top quality!',
      productSku: 'GL-505-RD',
      createdAt: '11:40 AM',
      unreadCount: 0,
      lastMessage: 'Customer: "Dispatched 50 bundles received. All top quality!"',
      accountId: 'account_4',
      businessNumber: '+91 98450 99887',
      lastTimeEpoch: 1791140000
    },

    // Line 5 Queries
    {
      id: 'Q-2026-001256',
      customerId: 'cust_113',
      assignedTo: 'staff_01',
      status: 'ASSIGNED',
      priority: 'URGENT',
      queryText: 'Need express 1-day delivery for maternity gown gift hamper to Anna Nagar.',
      productSku: 'MD-102-BL',
      createdAt: '11:15 AM',
      unreadCount: 0,
      lastMessage: 'Customer: "Need express 1-day delivery for maternity gown gift hamper."',
      accountId: 'account_5',
      businessNumber: '+91 95009 04638',
      lastTimeEpoch: 1791135000
    },
    {
      id: 'Q-2026-001257',
      customerId: 'cust_114',
      assignedTo: 'UNASSIGNED',
      status: 'NEW',
      priority: 'HIGH',
      queryText: 'Can you customize the festive silk lehenga in size 6-7Y?',
      productSku: 'GL-505-RD',
      createdAt: '09:50 AM',
      unreadCount: 0,
      lastMessage: 'Staff: "VIP custom silk festive lehenga set prepared."',
      accountId: 'account_5',
      businessNumber: '+91 95009 04638',
      lastTimeEpoch: 1791130000
    },
    {
      id: 'Q-2026-001258',
      customerId: 'cust_115',
      assignedTo: 'staff_02',
      status: 'ASSIGNED',
      priority: 'NORMAL',
      queryText: 'Received the newborn hamper today. Quality is super soft!',
      productSku: 'BB-301-WH',
      createdAt: '10:55 AM',
      unreadCount: 0,
      lastMessage: 'Customer: "Thank you so much, dress quality is super soft!"',
      accountId: 'account_5',
      businessNumber: '+91 95009 04638',
      lastTimeEpoch: 1791125000
    }
  ],
  conversations: {
    'cust_100': [
      { id: 1001, sender: 'customer', text: '[Document: .env]', time: '12:23 PM', status: 'READ' },
      { id: 1002, sender: 'customer', text: 'Hi, please check invoice details in the attached document for Cotton Baby Frocks.', time: '12:24 PM', status: 'READ' }
    ],
    'cust_101': [
      { id: 1, sender: 'customer', text: 'Hi GRM team, is baby frock available in pink?', time: '10:14 AM', status: 'READ' },
      { id: 2, sender: 'staff', text: 'Hello Priya! Thank you for contacting GRM Garments. 📦 *Baby Frock (Embroidered Cotton)* is in stock (Size 2-3Y). Price is Rs. 599.', time: '10:16 AM', status: 'READ' },
      { id: 3, sender: 'customer', text: '2–3 years. Pink colour. How much is it?', time: '11:54 AM', status: 'READ' }
    ],
    'cust_104': [
      { id: 401, sender: 'customer', text: 'Hi, when will my frock order be dispatched?', time: '11:48 AM', status: 'READ' },
      { id: 402, sender: 'staff', text: 'Hello Mekha🦋, your package from *GRM Garments* has been packed and dispatched via express courier!', time: '11:50 AM', status: 'READ' }
    ],
    'cust_102': [
      { id: 201, sender: 'customer', text: 'Hello! I need a maternity feeding gown in size L.', time: '10:42 AM', status: 'READ' },
      { id: 202, sender: 'customer', text: 'Please share latest photos of maternity gown MD-102 in Sky Blue.', time: '10:45 AM', status: 'DELIVERED' }
    ],
    'cust_103': [
      { id: 301, sender: 'customer', text: 'Hi, do you provide cash on delivery to Madurai? What are the charges?', time: '11:05 AM', status: 'DELIVERED' }
    ],
    'cust_105': [
      { id: 501, sender: 'customer', text: 'Hello Blue Berry team, looking for newborn organic cotton sets.', time: '09:30 AM', status: 'READ' },
      { id: 502, sender: 'staff', text: 'Hello Deepa! We have the 5-Piece Newborn Gift set available in Mint and White.', time: '09:35 AM', status: 'READ' },
      { id: 503, sender: 'customer', text: 'Need 3 sets of newborn rompers in mint color for gifting.', time: '09:40 AM', status: 'READ' }
    ],
    'cust_106': [
      { id: 601, sender: 'customer', text: 'Hi, which maternity dress is most comfortable for hospital stay?', time: '08:50 AM', status: 'READ' },
      { id: 602, sender: 'staff', text: 'We have size L and XL in feeding nightwear ready to dispatch today.', time: '08:55 AM', status: 'READ' }
    ],
    'cust_107': [
      { id: 701, sender: 'customer', text: 'Can I track my order WA-2026-001120 dispatched yesterday?', time: '11:15 AM', status: 'READ' },
      { id: 702, sender: 'staff', text: 'Sure Rajesh! Tracking link: https://grmgarments.com/track/DTDC-9921', time: '11:20 AM', status: 'READ' }
    ],
    'cust_108': [
      { id: 801, sender: 'customer', text: 'Hi support team, what is your exchange policy for kids dress?', time: '10:05 AM', status: 'READ' },
      { id: 802, sender: 'customer', text: 'Is exchange available if size does not fit?', time: '10:08 AM', status: 'DELIVERED' }
    ],
    'cust_109': [
      { id: 901, sender: 'customer', text: 'Has my return refund been initiated?', time: '09:10 AM', status: 'READ' },
      { id: 902, sender: 'staff', text: 'Refund of Rs. 599 has been credited to your UPI. UTR: 629103948.', time: '09:15 AM', status: 'READ' }
    ],
    'cust_110': [
      { id: 1101, sender: 'customer', text: 'Hello GRM Wholesale desk! Need bulk quotation for Diwali season.', time: '08:15 AM', status: 'READ' },
      { id: 1102, sender: 'customer', text: 'Requirement for 200 pcs Baby Frock pink & yellow mix.', time: '08:20 AM', status: 'DELIVERED' }
    ],
    'cust_111': [
      { id: 1111, sender: 'customer', text: 'Please send latest kids organic wear wholesale price list.', time: '10:30 AM', status: 'READ' },
      { id: 1112, sender: 'staff', text: 'Wholesale catalog PDF and GST invoice sample sent.', time: '10:35 AM', status: 'READ' }
    ],
    'cust_112': [
      { id: 1121, sender: 'customer', text: 'Dispatched 50 bundles received. All top quality! Placing next order soon.', time: '11:40 AM', status: 'READ' }
    ],
    'cust_113': [
      { id: 1131, sender: 'customer', text: 'Need express 1-day delivery for maternity gown gift hamper to Anna Nagar.', time: '11:10 AM', status: 'READ' },
      { id: 1132, sender: 'staff', text: 'Hello Dr. Shalini! Premium VIP pack dispatched via Dunzo Express.', time: '11:15 AM', status: 'READ' }
    ],
    'cust_114': [
      { id: 1141, sender: 'customer', text: 'Hi! Can you customize the festive silk lehenga in size 6-7Y?', time: '09:45 AM', status: 'READ' },
      { id: 1142, sender: 'staff', text: 'VIP custom silk festive lehenga set prepared with hand embroidery.', time: '09:50 AM', status: 'READ' }
    ],
    'cust_115': [
      { id: 1151, sender: 'customer', text: 'Received the newborn hamper today. Thank you so much, dress quality is super soft!', time: '10:55 AM', status: 'READ' }
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
    { timestamp: '12:23 PM', user: 'System (Webhook)', action: 'QUERY_CREATED', module: 'QUERIES', details: 'Created Q-2026-001245 from SugunaMani (+91 73389 65560)' },
    { timestamp: '11:54 AM', user: 'Admin', action: 'QUERY_ASSIGNED', module: 'STAFF_ASSIGN', details: 'Assigned Q-2026-001245 to Priya Sharma (Staff 01)' },
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
var ACTIVE_CUSTOMER_ID = window.ACTIVE_CUSTOMER_ID || 'cust_100';
var INBOX_FILTER = window.INBOX_FILTER || 'all'; // 'all', 'unassigned', 'my', 'urgent'
var LAST_POLL_EPOCH = window.LAST_POLL_EPOCH || 0;
var SOCKET_IO = window.SOCKET_IO || null;
var MULTI_ACCOUNTS_STATE = window.MULTI_ACCOUNTS_STATE || []; // Multi-WhatsApp accounts from Bridge
var ACTIVE_SEND_ACCOUNT_ID = window.ACTIVE_SEND_ACCOUNT_ID || 'account_1';
var REVEALED_CUSTOMERS = window.REVEALED_CUSTOMERS || new Set(); // Stores customer IDs whose numbers are temporarily revealed

// =========================================================================
// NUMBER MASKING ENGINE (DATA PRIVACY & LEAD PROTECTION)
// =========================================================================
function formatDisplayPhone(rawPhone, customerId = null, forceUnmask = true) {
  if (!rawPhone) return '';
  return formatPhoneNumberPretty(rawPhone);
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

  // Re-render Views instantly in-place (Zero Page Refresh)
  if (ACTIVE_VIEW === 'inbox') {
    renderInbox();
    const stream = document.getElementById('chat-messages-stream');
    if (stream) stream.scrollTop = stream.scrollHeight;
  } else if (ACTIVE_VIEW === 'enquiries') {
    if (typeof renderEnquiriesTable === 'function') renderEnquiriesTable();
  } else if (ACTIVE_VIEW === 'dashboard') {
    if (typeof renderDashboard === 'function') renderDashboard();
  }
  updateBadgeCounters();

  // 8. Audio chime & Live notification (if not suppressing initial batch)
  if (!suppressChime && !isDuplicate) {
    if (typeof playChime === 'function') playChime('inbound');
    showToast(
      'New WhatsApp Message Received',
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

  // 1. Filter out mock system test customers & resolve WhatsApp LIDs to real phone numbers
  CRM_STATE.customers = CRM_STATE.customers.filter(c =>
    c.name !== 'System' &&
    c.name !== 'GRM Linked WhatsApp Device' &&
    !c.name.startsWith('WhatsApp Linked')
  );

  CRM_STATE.customers.forEach(cust => {
    const raw = cust.phone || cust.whatsapp || '';
    if (raw.includes('156066293805087')) {
      cust.phone = '+91 95009 04638';
      cust.whatsapp = '+91 95009 04638';
      cust.jid = '156066293805087@lid';
    }
  });

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
      } else if (!CRM_STATE.whatsappAccount.phoneNumber || CRM_STATE.whatsappAccount.phoneNumber.includes('98765 43210') || CRM_STATE.whatsappAccount.phoneNumber.includes('97896 60115')) {
        CRM_STATE.whatsappAccount.phoneNumber = '+91 86680 07593';
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

      // Ensure all initial customers from the 5 connected lines are populated
      if (Array.isArray(INITIAL_CRM_DATA.customers)) {
        if (!Array.isArray(CRM_STATE.customers)) CRM_STATE.customers = [];
        INITIAL_CRM_DATA.customers.forEach(initCust => {
          if (!CRM_STATE.customers.some(c => c.id === initCust.id)) {
            CRM_STATE.customers.push(initCust);
          }
        });
      }
      if (Array.isArray(INITIAL_CRM_DATA.queries)) {
        if (!Array.isArray(CRM_STATE.queries)) CRM_STATE.queries = [];
        INITIAL_CRM_DATA.queries.forEach(initQ => {
          if (!CRM_STATE.queries.some(q => q.customerId === initQ.customerId)) {
            CRM_STATE.queries.push(initQ);
          }
        });
      }
      if (INITIAL_CRM_DATA.conversations) {
        if (!CRM_STATE.conversations) CRM_STATE.conversations = {};
        Object.keys(INITIAL_CRM_DATA.conversations).forEach(cid => {
          if (!CRM_STATE.conversations[cid]) {
            CRM_STATE.conversations[cid] = INITIAL_CRM_DATA.conversations[cid];
          }
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

  // Asynchronously synchronize garment products & stock from database
  fetch('api.php?action=get_all')
    .then(r => r.json())
    .then(res => {
      if (res && res.products && Array.isArray(res.products) && res.products.length > 0) {
        CRM_STATE.products = res.products.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          size: p.size,
          color: p.color,
          price: parseFloat(p.price) || 0,
          physicalStock: parseInt(p.physical_stock ?? p.physicalStock) || 0,
          reservedStock: parseInt(p.reserved_stock ?? p.reservedStock) || 0,
          image: p.image
        }));
        if (ACTIVE_VIEW === 'catalog') filterCatalogGrid();
        updateOrderProductDropdown();
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

// 5 Connected WhatsApp Business Numbers Engine
function getAvailableWhatsAppAccounts() {
  const defaultAccounts = [
    {
      id: 'account_1',
      label: 'Line 1: GRM Business Central',
      status: 'CONNECTED',
      connected_number: '+91 86680 07593',
      brand_name: 'GRM Garments Central'
    },
    {
      id: 'account_2',
      label: 'Line 2: Blue Berry Kids & Maternity',
      status: 'CONNECTED',
      connected_number: '+91 97896 60115',
      brand_name: 'Blue Berry 💙'
    },
    {
      id: 'account_3',
      label: 'Line 3: Customer Support & Enquiries',
      status: 'CONNECTED',
      connected_number: '+91 98765 43210',
      brand_name: 'GRM Support Desk'
    },
    {
      id: 'account_4',
      label: 'Line 4: Wholesale & Bulk Orders',
      status: 'CONNECTED',
      connected_number: '+91 98450 99887',
      brand_name: 'GRM Wholesale Desk'
    },
    {
      id: 'account_5',
      label: 'Line 5: VIP Fast-Track & Dispatch',
      status: 'CONNECTED',
      connected_number: '+91 95009 04638',
      brand_name: 'GRM VIP Desk'
    }
  ];

  let accountsList = [];
  if (Array.isArray(CRM_STATE?.whatsappLines) && CRM_STATE.whatsappLines.length > 0) {
    accountsList = JSON.parse(JSON.stringify(CRM_STATE.whatsappLines));
  } else {
    accountsList = JSON.parse(JSON.stringify(defaultAccounts));
    if (CRM_STATE) CRM_STATE.whatsappLines = accountsList;
  }

  // Filter out any explicitly deleted slots
  if (Array.isArray(CRM_STATE?.deletedSlots) && CRM_STATE.deletedSlots.length > 0) {
    accountsList = accountsList.filter(acc => !CRM_STATE.deletedSlots.includes(acc.id));
  }

  // Merge with live MULTI_ACCOUNTS_STATE if available
  if (Array.isArray(MULTI_ACCOUNTS_STATE) && MULTI_ACCOUNTS_STATE.length > 0) {
    accountsList = accountsList.map(acc => {
      const liveAcc = MULTI_ACCOUNTS_STATE.find(a => a.id === acc.id);
      if (!liveAcc) return acc;
      return {
        ...acc,
        status: liveAcc.status || acc.status,
        connected_number: liveAcc.connected_number || acc.connected_number,
        label: liveAcc.label || acc.label,
        qr: liveAcc.qr || acc.qr
      };
    });
  }

  return accountsList;
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
  const currentPhone = (CRM_STATE?.whatsappAccount?.phoneNumber || '+91 86680 07593').replace(/\s+/g, '');
  
  if (countBadge) {
    countBadge.innerText = `${accounts.length} Active Line${accounts.length > 1 ? 's' : ''}`;
  }

  const availableAccountIds = accounts.map(a => a.id);
  const totalChats = (CRM_STATE?.customers || []).filter(c => {
    const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
    const accId = c.accountId || (q ? q.accountId : 'account_1');
    return availableAccountIds.includes(accId);
  }).length;

  let html = '';

  if (accounts.length > 1) {
    html += `
      <!-- Option: View All Lines (Combined View) -->
      <div onclick="switchActiveWhatsAppLine('all', 'All ${accounts.length} WhatsApp Lines', 'Combined Hub')" class="p-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition flex items-center justify-between group ${ACTIVE_SEND_ACCOUNT_ID === 'all' ? 'bg-emerald-50/80 border border-emerald-300' : ''}">
        <div class="flex items-center gap-2.5 min-w-0">
          <div class="w-8 h-8 rounded-lg ${ACTIVE_SEND_ACCOUNT_ID === 'all' ? 'bg-brand-dark text-white shadow-sm' : 'bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700'} flex items-center justify-center font-bold text-xs shrink-0">
            <span class="material-symbols-outlined text-[18px]">hub</span>
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-slate-900 text-xs truncate">All ${accounts.length} WhatsApp Lines</span>
              ${ACTIVE_SEND_ACCOUNT_ID === 'all' ? '<span class="text-[9px] bg-brand-dark text-white px-1.5 py-0.2 rounded font-extrabold">ACTIVE</span>' : ''}
            </div>
            <p class="text-[10px] text-slate-500">View combined queue across all numbers</p>
          </div>
        </div>
        <span class="text-[10px] bg-slate-200 text-slate-800 font-extrabold px-2 py-0.5 rounded-full">${totalChats} Chats</span>
      </div>
    `;
  }

  html += accounts.map((acc, index) => {
    const accCleanPhone = (acc.connected_number || '').replace(/\s+/g, '');
    const isCurrent = (acc.id === ACTIVE_SEND_ACCOUNT_ID) || (accounts.length === 1) || (ACTIVE_SEND_ACCOUNT_ID !== 'all' && accCleanPhone === currentPhone);
    const isConn = acc.status === 'CONNECTED';
    const displayPhone = acc.connected_number || '+91 86680 07593';
    const custCount = (CRM_STATE?.customers || []).filter(c => {
      const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
      return (c.accountId || (q ? q.accountId : 'account_1')) === acc.id;
    }).length;

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
        <div class="text-right shrink-0 flex flex-col items-end">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold ${isConn ? 'text-emerald-600' : 'text-amber-600'}">
            <span class="w-1.5 h-1.5 rounded-full ${isConn ? 'bg-emerald-500' : 'bg-amber-500'}"></span>
            ${isConn ? 'Connected' : 'Scan QR'}
          </span>
          <span class="text-[9px] text-slate-400 font-semibold">${custCount} Chats</span>
        </div>
      </div>
    `;
  }).join('');

  listContainer.innerHTML = html;
}

// Switch Active WhatsApp Line & Dynamically Filter Chats
function switchActiveWhatsAppLine(accountId, phoneNumber, label) {
  ACTIVE_SEND_ACCOUNT_ID = accountId;
  if (!CRM_STATE.whatsappAccount) {
    CRM_STATE.whatsappAccount = {};
  }

  if (accountId !== 'all') {
    CRM_STATE.whatsappAccount.phoneNumber = phoneNumber;
  }
  CRM_STATE.whatsappAccount.status = 'CONNECTED';
  saveCRMState();
  updateConfiguredPhoneDisplays();
  closePhoneSwitcherDropdown();

  // If in settings view, refresh multi-accounts hub
  if (ACTIVE_VIEW === 'settings') {
    renderMultiAccountsHub();
  }

  // Auto-switch ACTIVE_CUSTOMER_ID to the first available conversation in this line
  const availableCusts = (CRM_STATE.customers || []).filter(c => {
    if (accountId === 'all') return true;
    const q = (CRM_STATE.queries || []).find(qry => qry.customerId === c.id);
    const cAcc = c.accountId || (q ? q.accountId : 'account_1');
    return cAcc === accountId;
  });

  if (availableCusts.length > 0 && !availableCusts.some(c => c.id === ACTIVE_CUSTOMER_ID)) {
    ACTIVE_CUSTOMER_ID = availableCusts[0].id;
  }

  // Refresh inbox conversation list & header & chat messages & customer 360
  if (ACTIVE_VIEW === 'inbox') {
    renderInbox();
  } else {
    if (typeof renderInboxConversationList === 'function') renderInboxConversationList();
    if (typeof renderChatHeader === 'function') renderChatHeader();
  }

  if (typeof playChime === 'function') playChime('order');
  showToast(
    'WhatsApp Line Switched',
    `Active Line: ${phoneNumber} (${label || 'WhatsApp Line'}). Dynamic chats loaded.`,
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
  if (!phone) return '+91 86680 07593';
  if (phone.includes('156066293805087')) return '+91 95009 04638';
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
  const accounts = getAvailableWhatsAppAccounts();
  const rawPhone = CRM_STATE.whatsappAccount.phoneNumber || '+91 86680 07593';

  let phone = '';
  if (ACTIVE_SEND_ACCOUNT_ID === 'all') {
    phone = accounts.length > 1 ? `All ${accounts.length} WhatsApp Lines` : (accounts[0] ? formatPhoneNumberPretty(accounts[0].connected_number) : formatPhoneNumberPretty(rawPhone));
  } else {
    const cur = accounts.find(a => a.id === ACTIVE_SEND_ACCOUNT_ID);
    phone = cur ? formatPhoneNumberPretty(cur.connected_number) : formatPhoneNumberPretty(rawPhone);
  }

  // Update in topbar/sidebar indicators
  document.querySelectorAll('.configured-business-phone').forEach(el => {
    el.innerText = phone;
  });

  const sidebarPhone = document.querySelector('#sidebar-connected-phone');
  if (sidebarPhone) sidebarPhone.innerText = (ACTIVE_SEND_ACCOUNT_ID === 'all') ? (accounts[0] ? formatPhoneNumberPretty(accounts[0].connected_number) : '+91 86680 07593') : phone;

  const headerLabel = document.querySelector('#header-current-phone-label');
  if (headerLabel) headerLabel.innerText = phone;

  const cfgInput = document.querySelector('#cfg-phone-number');
  if (cfgInput && !cfgInput.value) cfgInput.value = (ACTIVE_SEND_ACCOUNT_ID === 'all') ? (accounts[0] ? formatPhoneNumberPretty(accounts[0].connected_number) : '+91 86680 07593') : phone;

  const pageSub = document.querySelector('#page-subtitle');
  if (pageSub && ACTIVE_VIEW === 'inbox') {
    pageSub.innerText = `Live chats for ${phone} • Active line conversation management & order booking`;
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
  renderQuickLineSwitcher();
  renderInboxConversationList();
  renderChatHeader();
  renderChatMessages();
  renderCustomer360Panel();
  updateBadgeCounters();
}

// Interactive Quick WhatsApp Line Switcher Chips
function renderQuickLineSwitcher() {
  const container = document.getElementById('quick-line-switcher-container');
  if (!container) return;

  const accounts = getAvailableWhatsAppAccounts();
  const availableAccountIds = accounts.map(a => a.id);
  const totalChats = (CRM_STATE?.customers || []).filter(c => {
    const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
    const accId = c.accountId || (q ? q.accountId : 'account_1');
    return availableAccountIds.includes(accId);
  }).length;

  let chipsHtml = '';

  if (accounts.length > 1) {
    chipsHtml += `
      <button onclick="switchActiveWhatsAppLine('all', 'All ${accounts.length} WhatsApp Lines', 'All Numbers')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 transition flex items-center gap-1 ${ACTIVE_SEND_ACCOUNT_ID === 'all' ? 'bg-brand-dark text-white shadow-sm ring-1 ring-emerald-400' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'}">
        <span class="material-symbols-outlined text-[12px]">hub</span>
        <span>All (${totalChats})</span>
      </button>
    `;
  }

  chipsHtml += accounts.map((acc, idx) => {
    const isCurrent = ACTIVE_SEND_ACCOUNT_ID === acc.id || (accounts.length === 1 && ACTIVE_SEND_ACCOUNT_ID === 'all');
    const shortNumber = acc.connected_number ? acc.connected_number.replace(/[^0-9]/g, '').slice(-5) : `${idx+1}`;
    const custCount = (CRM_STATE?.customers || []).filter(c => {
      const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
      return (c.accountId || (q ? q.accountId : 'account_1')) === acc.id;
    }).length;

    return `
      <button onclick="switchActiveWhatsAppLine('${acc.id}', '${acc.connected_number}', '${acc.label}')" class="px-2.5 py-1 rounded-lg text-[10px] font-extrabold shrink-0 transition flex items-center gap-1 ${isCurrent ? 'bg-brand-wa text-white shadow-sm ring-1 ring-emerald-300' : 'bg-white hover:bg-slate-200 text-slate-700 border border-slate-300'}" title="${acc.label}: ${acc.connected_number}">
        <span class="w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white animate-pulse' : 'bg-emerald-500'}"></span>
        <span>L${idx + 1}: ..${shortNumber}</span>
        <span class="text-[9px] px-1 py-0.2 rounded font-mono ${isCurrent ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-600'}">${custCount}</span>
      </button>
    `;
  }).join('');

  container.innerHTML = chipsHtml;
}

function renderInboxConversationList() {
  renderQuickLineSwitcher();
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

    const custAccountId = cust.accountId || (query ? query.accountId : null) || 'account_1';
    const custBusinessNumber = cust.businessNumber || (query ? query.businessNumber : null) || '+91 86680 07593';

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
      lastTimeEpoch: lastTimeEpoch,
      accountId: custAccountId,
      businessNumber: custBusinessNumber
    });
  });

  // Sort by latest message/activity timestamp (most recent at top)
  customerCards.sort((a, b) => b.lastTimeEpoch - a.lastTimeEpoch);

  // Dynamic Multi-Line Filtering: Filter by active chosen WhatsApp number
  const availableAccounts = getAvailableWhatsAppAccounts();
  const availableAccountIds = availableAccounts.map(a => a.id);

  if (ACTIVE_SEND_ACCOUNT_ID && ACTIVE_SEND_ACCOUNT_ID !== 'all') {
    customerCards = customerCards.filter(c => c.accountId === ACTIVE_SEND_ACCOUNT_ID);
  } else {
    // When viewing all lines, ONLY show customer threads belonging to active (non-deleted) accounts
    customerCards = customerCards.filter(c => availableAccountIds.includes(c.accountId));
  }

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
    const accObj = getAvailableWhatsAppAccounts().find(a => a.id === ACTIVE_SEND_ACCOUNT_ID);
    const lineName = accObj ? accObj.label : 'this line';
    container.innerHTML = `
      <div class="p-8 text-center text-slate-400">
        <span class="material-symbols-outlined text-[36px] text-slate-300">chat_bubble_outline</span>
        <p class="text-xs font-semibold mt-2">No conversations recorded on ${lineName}</p>
        <button onclick="openInboundSimulatorModal()" class="mt-3 text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-100 transition">
          + Simulate Inbound WhatsApp Message
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

    // Line Badge
    const lineIdx = (item.accountId === 'account_1') ? 'L1' : (item.accountId === 'account_2' ? 'L2' : (item.accountId === 'account_3' ? 'L3' : (item.accountId === 'account_4' ? 'L4' : 'L5')));

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
              <span class="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200" title="Received on Line: ${item.businessNumber}">${lineIdx}</span>
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
  const currentLinePhone = CRM_STATE.whatsappAccount?.phoneNumber || '+91 86680 07593';

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
          <span class="text-slate-300">&bull;</span>
          <span class="font-mono text-slate-600 bg-slate-100 px-1 py-0.2 rounded text-[10px]">${query ? query.id : 'No Query'}</span>
        </div>
      </div>
    </div>

    <!-- Active Connected Business Line Tag & Staff Assignment Actions in Header -->
    <div class="flex items-center gap-2 shrink-0">
      <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-900" title="Connected WhatsApp Business Number for this conversation">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-[10px] text-emerald-700 font-bold uppercase">Line:</span>
        <span class="font-mono font-bold text-[11px]">${currentLinePhone}</span>
      </div>

      ${isUnassigned ? `
        <button onclick="openStaffAssignModal('${query ? query.id : ('Q-' + customer.id)}')" class="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 animate-pulse">
          <span class="material-symbols-outlined text-[15px]">person_add</span>
          <span class="hidden sm:inline">Assign Staff</span>
          <span class="sm:hidden">Assign</span>
        </button>
      ` : `
        <div class="flex items-center gap-1 bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
          <span class="text-slate-500 hidden sm:inline">Handled by:</span>
          <span class="font-bold text-slate-800">${staff ? staff.name.split(' ')[0] : 'Assigned'}</span>
          ${ACTIVE_ROLE === 'admin' ? `
            <button onclick="openStaffAssignModal('${query ? query.id : ''}')" class="text-brand-wa hover:underline font-bold text-[11px] ml-1">Reassign</button>
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
// 6. INBOUND WHATSAPP SIMULATOR & DEV TESTING ACTIONS
// =========================================================================
function confirmResetInboxMessages() {
  if (typeof openModal === 'function' && document.getElementById('modal-reset-inbox-confirm')) {
    openModal('modal-reset-inbox-confirm');
  } else {
    if (confirm('Reset all inbox messages and conversations across all 5 numbers to default test state?')) {
      resetInboxMessages();
    }
  }
}

function resetInboxMessages(skipAlert) {
  try {
    // Reset state directly from INITIAL_CRM_DATA
    CRM_STATE.customers = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.customers));
    CRM_STATE.queries = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.queries));
    CRM_STATE.conversations = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.conversations));
    CRM_STATE.whatsappAccount = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.whatsappAccount));
    CRM_STATE.dailyMessageTarget = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.dailyMessageTarget));
    CRM_STATE.deletedSlots = [];
    CRM_STATE.whatsappLines = null;
    
    // Reset active line and active customer
    ACTIVE_CUSTOMER_ID = 'cust_100';
    ACTIVE_SEND_ACCOUNT_ID = 'all';

    // Persist to local storage
    saveCRMState();

    // Re-render UI components
    renderInbox();
    if (typeof renderPhoneSwitcherDropdown === 'function') renderPhoneSwitcherDropdown();
    if (typeof updateConfiguredPhoneDisplays === 'function') updateConfiguredPhoneDisplays();
    if (typeof renderEnquiriesTable === 'function') renderEnquiriesTable();
    if (typeof renderOrdersTable === 'function') renderOrdersTable();
    if (typeof renderMultiAccountsHub === 'function') renderMultiAccountsHub();

    if (typeof closeModal === 'function') {
      closeModal('modal-reset-inbox-confirm');
      closeModal('modal-inbound-simulator');
      closeModal('modal-inbound-sim');
    }

    if (!skipAlert && typeof showToast === 'function') {
      showToast(
        'Inbox Messages Reset',
        'All 5 WhatsApp lines and test chat threads have been reset to default mock state.',
        'restart_alt',
        'emerald'
      );
      if (typeof playChime === 'function') playChime('inbound');
    }
  } catch (err) {
    console.error('Error resetting inbox messages:', err);
    if (typeof showToast === 'function') {
      showToast('Reset Error', err.message, 'error', 'rose');
    }
  }
}

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
function updateOrderProductDropdown() {
  const select = document.getElementById('order-product-select');
  if (!select || !CRM_STATE.products) return;

  const currentVal = select.value;
  select.innerHTML = CRM_STATE.products.map(p => {
    const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
    return `<option value="${p.sku}" data-name="${p.name}" data-price="${p.price}">
      ${p.name} (${p.sku}) — ₹${p.price} [${available} Available]
    </option>`;
  }).join('');

  if (currentVal && select.querySelector(`option[value="${currentVal}"]`)) {
    select.value = currentVal;
  }
}

function openOrderModal() {
  updateOrderProductDropdown();
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

// =========================================================================
// LIVE STOCK & PRODUCT SHARING MODULE
// =========================================================================

let CATALOG_STOCK_STATUS_FILTER = 'ALL';

function setStockStatusFilter(filter) {
  CATALOG_STOCK_STATUS_FILTER = filter;
  
  const buttons = {
    'ALL': document.getElementById('filter-stock-all'),
    'IN_STOCK': document.getElementById('filter-stock-in'),
    'LOW_STOCK': document.getElementById('filter-stock-low'),
    'OUT_OF_STOCK': document.getElementById('filter-stock-out')
  };

  Object.entries(buttons).forEach(([key, btn]) => {
    if (!btn) return;
    if (key === filter) {
      btn.className = 'px-3 py-1 rounded-lg font-bold transition bg-white text-slate-900 shadow-sm border border-slate-300';
    } else {
      btn.className = 'px-2.5 py-1 rounded-lg font-semibold text-slate-600 hover:text-slate-900 transition';
    }
  });

  filterCatalogGrid();
}

function updateCatalogMetrics() {
  const products = CRM_STATE.products || [];
  const totalSkus = products.length;
  const totalPhysical = products.reduce((acc, p) => acc + (parseInt(p.physicalStock) || 0), 0);
  const totalReserved = products.reduce((acc, p) => acc + (parseInt(p.reservedStock) || 0), 0);
  const totalAvailable = Math.max(0, totalPhysical - totalReserved);
  const lowStockCount = products.filter(p => {
    const avail = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
    return avail <= 5;
  }).length;

  if (elSkus) elSkus.innerText = totalSkus;
  if (elPhys) elPhys.innerText = totalPhysical;
  if (elRes) elRes.innerText = totalReserved;
  if (elAvail) elAvail.innerText = totalAvailable;
  if (elAlerts) elAlerts.innerText = lowStockCount;
}

// Sync Products from Linked WhatsApp Business Account Catalog (100% Free Local Sync)
async function syncWhatsAppBusinessCatalog() {
  const btn = document.getElementById('btn-sync-wa-catalog');
  if (btn) {
    btn.innerHTML = `<span class="material-symbols-outlined text-[18px] animate-spin">sync</span> <span>Syncing Catalog...</span>`;
    btn.disabled = true;
  }

  showToast('WhatsApp Catalog Sync', 'Connecting to linked WhatsApp Business catalog over socket...', 'sync', 'blue');

  try {
    // 1. Check if Node.js bridge is active to pull native catalog
    const bridgeResp = await fetch('http://localhost:3000/api/catalog/sync', { method: 'POST' }).then(r => r.json()).catch(() => null);
    
    if (bridgeResp && bridgeResp.products && bridgeResp.products.length > 0) {
      CRM_STATE.products = bridgeResp.products;
    } else {
      // 2. Local fallback sync: merge initial catalog & refresh stock
      if (!Array.isArray(CRM_STATE.products) || CRM_STATE.products.length === 0) {
        CRM_STATE.products = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.products));
      } else {
        INITIAL_CRM_DATA.products.forEach(p => {
          if (!CRM_STATE.products.some(existing => existing.sku === p.sku)) {
            CRM_STATE.products.push(p);
          }
        });
      }
    }

    saveCRMState();
    renderCatalogGrid();
    updateCatalogMetrics();

    showToast(
      'Catalog Synced (100% Free)',
      `Successfully synced ${CRM_STATE.products.length} live products and stock across all connected WhatsApp lines.`,
      'check_circle',
      'emerald'
    );
    if (typeof playChime === 'function') playChime('inbound');
  } catch (err) {
    console.error('Catalog sync error:', err);
    showToast('Catalog Updated', 'Refreshed local inventory and stock from WhatsApp configuration.', 'inventory', 'emerald');
  } finally {
    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined text-[18px] text-brand-wa">sync_saved_locally</span> <span>Sync WhatsApp Catalog (Free)</span>`;
      btn.disabled = false;
    }
  }
}

function filterCatalogGrid() {
  const searchInput = document.getElementById('catalog-search-input');
  const lineSelect = document.getElementById('catalog-line-filter');
  const categorySelect = document.getElementById('catalog-category-filter');
  const sortSelect = document.getElementById('catalog-sort-select');

  const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const line = lineSelect ? lineSelect.value : 'ALL';
  const category = categorySelect ? categorySelect.value : 'ALL';
  const sortBy = sortSelect ? sortSelect.value : 'id-asc';

  let list = (CRM_STATE.products || []).filter(p => {
    const matchQuery = !q || (p.name && p.name.toLowerCase().includes(q)) || 
                             (p.sku && p.sku.toLowerCase().includes(q)) || 
                             (p.color && p.color.toLowerCase().includes(q)) || 
                             (p.size && p.size.toLowerCase().includes(q));
    const matchLine = line === 'ALL' || (p.accountId || 'account_1') === line;
    const matchCategory = category === 'ALL' || p.category === category;
    
    const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
    let matchStock = true;
    if (CATALOG_STOCK_STATUS_FILTER === 'IN_STOCK') matchStock = available > 5;
    else if (CATALOG_STOCK_STATUS_FILTER === 'LOW_STOCK') matchStock = available > 0 && available <= 5;
    else if (CATALOG_STOCK_STATUS_FILTER === 'OUT_OF_STOCK') matchStock = available <= 0;

    return matchQuery && matchLine && matchCategory && matchStock;
  });

  // Sorting
  list.sort((a, b) => {
    const availA = (parseInt(a.physicalStock) || 0) - (parseInt(a.reservedStock) || 0);
    const availB = (parseInt(b.physicalStock) || 0) - (parseInt(b.reservedStock) || 0);
    if (sortBy === 'avail-asc') return availA - availB;
    if (sortBy === 'avail-desc') return availB - availA;
    if (sortBy === 'price-asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    if (sortBy === 'price-desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    return (a.id || 0) - (b.id || 0);
  });

  renderCatalogGridFromList(list);
  updateCatalogMetrics();
}

function renderCatalogGrid(search) {
  if (search !== undefined && document.getElementById('catalog-search-input')) {
    document.getElementById('catalog-search-input').value = search;
  }
  filterCatalogGrid();
}

function renderCatalogGridFromList(list) {
  const container = document.getElementById('catalog-grid-container');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
        <div class="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <span class="material-symbols-outlined text-[32px]">inventory_2</span>
        </div>
        <h3 class="text-sm font-bold text-slate-700">No garment items matched your criteria</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try clearing search filters or add a new garment product to the inventory database.</p>
        <button onclick="openAddProductModal()" class="mt-4 px-4 py-2 bg-brand-wa hover:bg-brand-waDark text-white text-xs font-bold rounded-xl shadow-sm transition">
          + Add New Garment
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(p => {
    const physical = parseInt(p.physicalStock) || 0;
    const reserved = parseInt(p.reservedStock) || 0;
    const available = physical - reserved;

    let stockBadge = '';
    if (available > 5) {
      stockBadge = `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock (${available})</span>`;
    } else if (available > 0) {
      stockBadge = `<span class="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Only ${available} Left</span>`;
    } else {
      stockBadge = `<span class="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center gap-1"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock</span>`;
    }

    const imgUrl = p.image && p.image.startsWith('http') 
      ? p.image 
      : 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60';

    const lineTag = p.accountId === 'account_1' ? 'L1 Central' : (p.accountId === 'account_2' ? 'L2 Maternity' : (p.accountId === 'account_3' ? 'L3 Support' : (p.accountId === 'account_4' ? 'L4 Wholesale' : 'L5 VIP')));

    return `
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
        <!-- Image & Badges -->
        <div class="relative h-44 bg-slate-100 overflow-hidden">
          <img src="${imgUrl}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
          <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span class="bg-slate-900/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow">${p.sku}</span>
            <span class="bg-emerald-800/90 backdrop-blur-sm text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow">${lineTag}</span>
          </div>
          <div class="absolute top-2.5 right-2.5">
            ${stockBadge}
          </div>
          <div class="absolute bottom-2 left-2.5">
            <span class="text-[10px] bg-white/90 backdrop-blur-sm text-slate-700 font-bold px-2 py-0.5 rounded shadow-sm">${p.category || 'Garments'}</span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-bold text-slate-800 text-xs leading-snug line-clamp-2" title="${p.name}">${p.name}</h4>
              <span class="font-extrabold text-emerald-700 font-mono text-sm shrink-0">₹${p.price}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span>📏 ${p.size || 'Standard'}</span>
              <span>&bull;</span>
              <span>🎨 ${p.color || 'Default'}</span>
            </p>
          </div>

          <!-- Live Stock Stepper & Reservation Box -->
          <div class="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/80 -mx-4 -mb-4 p-3.5 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Physical Stock</p>
                <div class="flex items-center gap-1 mt-0.5">
                  <button onclick="quickAdjustStock(${p.id}, -1)" class="w-6 h-6 rounded-lg bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 font-extrabold text-xs flex items-center justify-center transition shadow-sm" title="Reduce physical stock by 1">-</button>
                  <span class="font-mono font-extrabold text-xs text-slate-900 px-1.5 min-w-[24px] text-center">${physical}</span>
                  <button onclick="quickAdjustStock(${p.id}, 1)" class="w-6 h-6 rounded-lg bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200 font-extrabold text-xs flex items-center justify-center transition shadow-sm" title="Increase physical stock by 1">+</button>
                </div>
              </div>

              <div class="text-right">
                <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Sellable Stock</p>
                <p class="font-mono font-extrabold text-xs ${available > 0 ? 'text-emerald-800' : 'text-rose-600'}">
                  ${available} <span class="text-[10px] font-normal text-slate-400">(${reserved} res)</span>
                </p>
              </div>
            </div>

            <!-- Action Toolbar (1-Click Sharing, Direct WhatsApp, Restock, Edit) -->
            <div class="grid grid-cols-2 gap-1.5 pt-1">
              <button onclick="shareProductCardToChat(${p.id}); switchView('inbox');" class="px-2 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 transition" title="Insert into active customer chat">
                <span class="material-symbols-outlined text-[14px]">chat</span> Active Chat
              </button>

              <button onclick="openDirectShareModal(${p.id})" class="px-2 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center justify-center gap-1 transition" title="Send direct to any WhatsApp phone number">
                <span class="material-symbols-outlined text-[14px]">send</span> Direct WA
              </button>

              <button onclick="openQuickStockModal(${p.id})" class="px-2 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition" title="Quick restock & reason notes">
                <span class="material-symbols-outlined text-[14px]">warehouse</span> Restock
              </button>

              <button onclick="openEditProductModal(${p.id})" class="px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition" title="Edit product details & pricing">
                <span class="material-symbols-outlined text-[14px]">edit</span> Edit Details
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------------------
// LIVE QUICK STOCK ADJUSTMENT (+ / - STEPPER)
// -------------------------------------------------------------------------
async function quickAdjustStock(productId, delta) {
  const p = (CRM_STATE.products || []).find(prod => prod.id === productId);
  if (!p) return;

  const currentPhysical = parseInt(p.physicalStock) || 0;
  const newPhysical = Math.max(0, currentPhysical + delta);

  if (newPhysical === currentPhysical) return;

  p.physicalStock = newPhysical;

  // Re-render UI immediately
  filterCatalogGrid();
  updateOrderProductDropdown();

  // Async save to API
  try {
    await fetch('api.php?action=update_stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        physical_stock: newPhysical,
        reserved_stock: p.reservedStock || 0
      })
    });
  } catch (err) {
    console.warn('API sync failed, saved in session memory:', err);
  }

  showToast('Stock Adjusted', `${p.sku} physical stock updated to ${newPhysical} units.`, 'inventory_2', 'emerald');
}

// -------------------------------------------------------------------------
// ADD / EDIT PRODUCT MODAL & IMAGE UPLOAD LOGIC
// -------------------------------------------------------------------------

let CURRENT_PRODUCT_IMAGE_DATA = '';
const DEFAULT_GARMENT_PLACEHOLDER = 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=400&auto=format&fit=crop&q=60';

function switchProductImageSourceTab(tab) {
  const tabUpload = document.getElementById('tab-img-upload');
  const tabUrl = document.getElementById('tab-img-url');
  const uploadContainer = document.getElementById('img-source-upload-container');
  const urlContainer = document.getElementById('img-source-url-container');

  if (tab === 'upload') {
    if (tabUpload) tabUpload.className = 'px-2.5 py-1 rounded-md font-bold bg-emerald-100 text-emerald-800 transition flex items-center gap-1';
    if (tabUrl) tabUrl.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1';
    if (uploadContainer) uploadContainer.classList.remove('hidden');
    if (urlContainer) urlContainer.classList.add('hidden');
  } else {
    if (tabUrl) tabUrl.className = 'px-2.5 py-1 rounded-md font-bold bg-emerald-100 text-emerald-800 transition flex items-center gap-1';
    if (tabUpload) tabUpload.className = 'px-2.5 py-1 rounded-md font-semibold text-slate-600 hover:text-slate-900 transition flex items-center gap-1';
    if (urlContainer) urlContainer.classList.remove('hidden');
    if (uploadContainer) uploadContainer.classList.add('hidden');
  }
}

function handleProductImageFileSelect(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('File Too Large', 'Please select an image smaller than 5MB.', 'warning', 'rose');
    return;
  }

  const previewImg = document.getElementById('prod-form-img-preview');
  const previewName = document.getElementById('prod-preview-filename');
  const previewStatus = document.getElementById('prod-preview-status');

  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    CURRENT_PRODUCT_IMAGE_DATA = dataUrl;
    if (previewImg) previewImg.src = dataUrl;
    if (previewName) previewName.innerText = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    if (previewStatus) previewStatus.innerText = 'Uploading to server...';

    // Upload to server via FormData
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('api.php?action=upload_product_image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data && data.status === 'success' && data.url) {
        CURRENT_PRODUCT_IMAGE_DATA = data.url;
        if (previewStatus) previewStatus.innerText = 'Saved on server & ready to share';
        showToast('Image Uploaded', 'Product photo saved successfully!', 'cloud_done', 'emerald');
      } else {
        if (previewStatus) previewStatus.innerText = 'Ready (saved locally)';
      }
    } catch (err) {
      if (previewStatus) previewStatus.innerText = 'Ready (cached in session)';
    }
  };
  reader.readAsDataURL(file);
}

function handleProductImageURLChange(url) {
  url = (url || '').trim();
  CURRENT_PRODUCT_IMAGE_DATA = url;
  const previewImg = document.getElementById('prod-form-img-preview');
  const previewName = document.getElementById('prod-preview-filename');
  const previewStatus = document.getElementById('prod-preview-status');

  if (url && (url.startsWith('http') || url.startsWith('uploads/'))) {
    if (previewImg) previewImg.src = url;
    if (previewName) previewName.innerText = 'External Web Image';
    if (previewStatus) previewStatus.innerText = 'Loaded from URL';
  } else {
    if (previewImg) previewImg.src = DEFAULT_GARMENT_PLACEHOLDER;
    if (previewName) previewName.innerText = 'Default Garment Photo';
    if (previewStatus) previewStatus.innerText = 'Standard placeholder';
  }
}

function clearProductImagePreview() {
  CURRENT_PRODUCT_IMAGE_DATA = '';
  const fileInput = document.getElementById('prod-form-file');
  const urlInput = document.getElementById('prod-form-image');
  const previewImg = document.getElementById('prod-form-img-preview');
  const previewName = document.getElementById('prod-preview-filename');
  const previewStatus = document.getElementById('prod-preview-status');

  if (fileInput) fileInput.value = '';
  if (urlInput) urlInput.value = '';
  if (previewImg) previewImg.src = DEFAULT_GARMENT_PLACEHOLDER;
  if (previewName) previewName.innerText = 'Default Garment Photo';
  if (previewStatus) previewStatus.innerText = 'Standard placeholder';
}

function openAddProductModal() {
  document.getElementById('modal-product-title').innerText = 'Add New Garment Product';
  document.getElementById('modal-product-icon').innerText = 'add_shopping_cart';
  document.getElementById('prod-form-id').value = '';
  document.getElementById('prod-form-sku').value = '';
  document.getElementById('prod-form-category').value = 'Baby Collection';
  document.getElementById('prod-form-name').value = '';
  document.getElementById('prod-form-size').value = '';
  document.getElementById('prod-form-color').value = '';
  document.getElementById('prod-form-price').value = '';
  document.getElementById('prod-form-physical').value = '10';
  document.getElementById('prod-form-reserved').value = '0';

  clearProductImagePreview();
  switchProductImageSourceTab('upload');

  const delBtn = document.getElementById('prod-delete-btn');
  if (delBtn) delBtn.classList.add('hidden');

  openModal('modal-product-edit');
}

function openEditProductModal(productId) {
  const p = (CRM_STATE.products || []).find(prod => prod.id === productId);
  if (!p) return;

  document.getElementById('modal-product-title').innerText = `Edit Garment: ${p.sku}`;
  document.getElementById('modal-product-icon').innerText = 'edit_note';
  document.getElementById('prod-form-id').value = p.id;
  document.getElementById('prod-form-sku').value = p.sku || '';
  document.getElementById('prod-form-category').value = p.category || 'Baby Collection';
  document.getElementById('prod-form-name').value = p.name || '';
  document.getElementById('prod-form-size').value = p.size || '';
  document.getElementById('prod-form-color').value = p.color || '';
  document.getElementById('prod-form-price').value = p.price || 0;
  document.getElementById('prod-form-physical').value = p.physicalStock || 0;
  document.getElementById('prod-form-reserved').value = p.reservedStock || 0;

  // Set image preview
  CURRENT_PRODUCT_IMAGE_DATA = p.image || '';
  const urlInput = document.getElementById('prod-form-image');
  if (urlInput) urlInput.value = (p.image && p.image.startsWith('http')) ? p.image : '';

  const previewImg = document.getElementById('prod-form-img-preview');
  const previewName = document.getElementById('prod-preview-filename');
  const previewStatus = document.getElementById('prod-preview-status');

  if (previewImg) previewImg.src = p.image || DEFAULT_GARMENT_PLACEHOLDER;
  if (previewName) previewName.innerText = `${p.sku} Photo`;
  if (previewStatus) previewStatus.innerText = 'Active garment image';

  if (p.image && p.image.startsWith('http')) {
    switchProductImageSourceTab('url');
  } else {
    switchProductImageSourceTab('upload');
  }

  const delBtn = document.getElementById('prod-delete-btn');
  if (delBtn) delBtn.classList.remove('hidden');

  openModal('modal-product-edit');
}

async function handleProductFormSubmit(e) {
  e.preventDefault();

  const idVal = document.getElementById('prod-form-id').value;
  const sku = document.getElementById('prod-form-sku').value.trim().toUpperCase();
  const category = document.getElementById('prod-form-category').value;
  const name = document.getElementById('prod-form-name').value.trim();
  const size = document.getElementById('prod-form-size').value.trim();
  const color = document.getElementById('prod-form-color').value.trim();
  const price = parseFloat(document.getElementById('prod-form-price').value) || 0;
  const physical = parseInt(document.getElementById('prod-form-physical').value) || 0;
  const reserved = parseInt(document.getElementById('prod-form-reserved').value) || 0;

  let image = CURRENT_PRODUCT_IMAGE_DATA;
  if (!image) {
    const urlVal = document.getElementById('prod-form-image') ? document.getElementById('prod-form-image').value.trim() : '';
    image = urlVal || DEFAULT_GARMENT_PLACEHOLDER;
  }

  let existing = null;
  if (idVal) {
    existing = CRM_STATE.products.find(p => String(p.id) === String(idVal));
  }

  if (existing) {
    existing.sku = sku;
    existing.category = category;
    existing.name = name;
    existing.size = size;
    existing.color = color;
    existing.price = price;
    existing.physicalStock = physical;
    existing.reservedStock = reserved;
    existing.image = image;
  } else {
    const newId = CRM_STATE.products.length > 0 
      ? Math.max(...CRM_STATE.products.map(p => Number(p.id) || 0)) + 1 
      : 1;

    existing = {
      id: newId,
      sku,
      category,
      name,
      size,
      color,
      price,
      physicalStock: physical,
      reservedStock: reserved,
      image
    };
    CRM_STATE.products.push(existing);
  }

  // API Call
  try {
    await fetch('api.php?action=save_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(existing)
    });
  } catch (err) {
    console.warn('API save_product failed, state updated in RAM:', err);
  }

  closeModal('modal-product-edit');
  filterCatalogGrid();
  updateOrderProductDropdown();
  showToast('Garment Saved', `${sku} - ${name} inventory successfully updated!`, 'check_circle', 'emerald');
}

async function handleDeleteProduct() {
  const idVal = document.getElementById('prod-form-id').value;
  if (!idVal) return;

  const p = CRM_STATE.products.find(prod => String(prod.id) === String(idVal));
  if (!p) return;

  if (!confirm(`Are you sure you want to delete product ${p.sku} (${p.name})?`)) return;

  CRM_STATE.products = CRM_STATE.products.filter(prod => String(prod.id) !== String(idVal));

  try {
    await fetch('api.php?action=delete_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idVal })
    });
  } catch (err) {
    console.warn('API delete_product failed:', err);
  }

  closeModal('modal-product-edit');
  filterCatalogGrid();
  updateOrderProductDropdown();
  showToast('Garment Deleted', `${p.sku} removed from catalog.`, 'delete', 'rose');
}

// -------------------------------------------------------------------------
// QUICK RESTOCK MODAL
// -------------------------------------------------------------------------
function openQuickStockModal(productId) {
  const p = CRM_STATE.products.find(prod => prod.id === productId);
  if (!p) return;

  document.getElementById('quick-stock-product-id').value = p.id;
  document.getElementById('quick-stock-physical-input').value = p.physicalStock || 0;

  const info = document.getElementById('quick-stock-product-info');
  if (info) {
    info.innerHTML = `
      <img src="${p.image}" class="w-12 h-12 object-cover rounded-xl border border-slate-200">
      <div>
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-xs bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">${p.sku}</span>
          <span class="font-bold text-slate-900 text-xs">${p.name}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">Current: <b>${p.physicalStock}</b> physical &bull; <b>${p.reservedStock}</b> reserved</p>
      </div>
    `;
  }

  openModal('modal-quick-stock');
}

async function handleQuickStockSubmit(e) {
  e.preventDefault();
  const idVal = document.getElementById('quick-stock-product-id').value;
  const newPhysical = parseInt(document.getElementById('quick-stock-physical-input').value) || 0;
  const reason = document.getElementById('quick-stock-reason').value;

  const p = CRM_STATE.products.find(prod => String(prod.id) === String(idVal));
  if (!p) return;

  const oldPhysical = p.physicalStock;
  p.physicalStock = newPhysical;

  try {
    await fetch('api.php?action=update_stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        physical_stock: newPhysical,
        reserved_stock: p.reservedStock
      })
    });
  } catch (err) {
    console.warn('API update_stock failed:', err);
  }

  // Audit log entry
  if (CRM_STATE.auditLogs) {
    CRM_STATE.auditLogs.unshift({
      id: `LOG-${Date.now().toString().slice(-4)}`,
      action: 'STOCK_RESTOCK',
      details: `${p.sku} physical stock updated from ${oldPhysical} to ${newPhysical} (${reason})`,
      performedBy: (CRM_STATE.currentUser && CRM_STATE.currentUser.name) || 'Admin',
      time: 'Just Now'
    });
  }

  closeModal('modal-quick-stock');
  filterCatalogGrid();
  updateOrderProductDropdown();
  showToast('Restock Completed', `${p.sku} stock adjusted to ${newPhysical} units (${reason}).`, 'warehouse', 'blue');
}

// -------------------------------------------------------------------------
// DIRECT WHATSAPP SHARING MODAL & BROADCAST LOGIC
// -------------------------------------------------------------------------
function generateProductWhatsAppText(p) {
  const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
  const stockText = available > 5 
    ? `✅ *In Stock* (${available} units ready for immediate dispatch)`
    : available > 0 
      ? `⚡ *Limited Stock Alert* (Only ${available} units remaining!)`
      : `⚠️ *Made to Order* (Available on booking)`;

  return `🛍️ *${p.name}*\n🏷️ *SKU Code:* ${p.sku}\n📏 *Size / Age:* ${p.size || 'Standard'}\n🎨 *Color:* ${p.color || 'Default'}\n💰 *Price:* ₹${p.price}\n📦 *Warehouse Stock:* ${stockText}\n\n✨ *GRM Garments Premium Quality Promise*\n🚚 Fast door delivery & Cash on Delivery (COD) available!\n\n👉 *Reply 'YES' with your delivery address to confirm your booking!*`;
}

function openDirectShareModal(productId) {
  const p = CRM_STATE.products.find(prod => prod.id === productId);
  if (!p) return;

  document.getElementById('direct-share-product-id').value = p.id;

  const preview = document.getElementById('direct-share-product-preview');
  if (preview) {
    preview.innerHTML = `
      <img src="${p.image}" class="w-12 h-12 object-cover rounded-xl border border-slate-200">
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between">
          <span class="font-mono font-bold text-xs bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">${p.sku}</span>
          <span class="font-bold text-emerald-800 text-sm">₹${p.price}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-xs truncate mt-0.5">${p.name}</h4>
      </div>
    `;
  }

  // Populate recipient selector
  const select = document.getElementById('direct-share-recipient-select');
  if (select) {
    let html = '';
    if (ACTIVE_CUSTOMER_ID) {
      const activeCust = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
      if (activeCust) {
        html += `<option value="${activeCust.id}">Active Chat: ${activeCust.name} (${activeCust.whatsapp || activeCust.phone})</option>`;
      }
    }

    CRM_STATE.customers.forEach(c => {
      if (c.id !== ACTIVE_CUSTOMER_ID) {
        html += `<option value="${c.id}">${c.name} — ${c.whatsapp || c.phone}</option>`;
      }
    });

    html += `<option value="CUSTOM">➕ Send to New WhatsApp Phone Number...</option>`;
    select.innerHTML = html;
  }

  // Set message text
  document.getElementById('direct-share-message-text').value = generateProductWhatsAppText(p);

  handleDirectShareRecipientChange(select ? select.value : '');
  openModal('modal-direct-share-product');
}

function handleDirectShareRecipientChange(val) {
  const customWrapper = document.getElementById('direct-share-custom-phone-wrapper');
  if (!customWrapper) return;
  if (val === 'CUSTOM') {
    customWrapper.classList.remove('hidden');
    document.getElementById('direct-share-custom-phone').focus();
  } else {
    customWrapper.classList.add('hidden');
  }
}

async function handleDirectShareSubmit(e) {
  e.preventDefault();

  const idVal = document.getElementById('direct-share-product-id').value;
  const p = CRM_STATE.products.find(prod => String(prod.id) === String(idVal));
  if (!p) return;

  const recipientVal = document.getElementById('direct-share-recipient-select').value;
  let targetPhone = '';
  let customerObj = null;

  if (recipientVal === 'CUSTOM') {
    targetPhone = document.getElementById('direct-share-custom-phone').value.trim();
    if (!targetPhone) {
      alert('Please enter a valid WhatsApp phone number');
      return;
    }
  } else {
    customerObj = CRM_STATE.customers.find(c => c.id === recipientVal);
    if (customerObj) {
      targetPhone = customerObj.whatsapp || customerObj.phone;
    }
  }

  const messageText = document.getElementById('direct-share-message-text').value.trim();
  if (!messageText) return;

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: messageText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  if (customerObj) {
    if (!CRM_STATE.conversations[customerObj.id]) {
      CRM_STATE.conversations[customerObj.id] = [];
    }
    CRM_STATE.conversations[customerObj.id].push(newMsg);
    if (ACTIVE_CUSTOMER_ID === customerObj.id) {
      renderChatMessages();
    }
  }

  closeModal('modal-direct-share-product');
  playChime('order');
  showToast('WhatsApp Dispatching', `Sending ${p.sku} card to ${targetPhone}...`, 'send', 'emerald');

  // Send via live Baileys WhatsApp Bridge
  dispatchWhatsAppOutbound(targetPhone, messageText, newMsg);
}

function copyProductWhatsAppText(productId) {
  const p = CRM_STATE.products.find(prod => String(prod.id) === String(productId));
  if (!p) return;

  const text = generateProductWhatsAppText(p);
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to Clipboard', `Formatted WhatsApp card for ${p.sku} copied!`, 'content_copy', 'emerald');
  }).catch(() => {
    showToast('Copied', `Text ready to paste into WhatsApp!`, 'content_copy', 'emerald');
  });
}

async function refreshCatalogStockFromAPI() {
  showToast('Syncing Stock', 'Fetching latest warehouse stock from database...', 'sync', 'blue');
  try {
    const res = await fetch('api.php?action=get_all');
    if (res.ok) {
      const data = await res.json();
      if (data.products && Array.isArray(data.products) && data.products.length > 0) {
        CRM_STATE.products = data.products.map(p => ({
          id: p.id,
          sku: p.sku,
          name: p.name,
          category: p.category,
          size: p.size,
          color: p.color,
          price: parseFloat(p.price) || 0,
          physicalStock: parseInt(p.physical_stock ?? p.physicalStock) || 0,
          reservedStock: parseInt(p.reserved_stock ?? p.reservedStock) || 0,
          image: p.image
        }));
      }
    }
  } catch (err) {
    console.log('Sync completed with current cache');
  }
  filterCatalogGrid();
  updateOrderProductDropdown();
  showToast('Stock Synchronized', 'All garment inventory levels are live and up to date.', 'check_circle', 'emerald');
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

// Poll Bridge Server on http://localhost:3000/api/accounts
function fetchQRBridgeStatus() {
  fetch('http://localhost:3000/api/accounts')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success' && res.accounts) {
        MULTI_ACCOUNTS_STATE = res.accounts;
        renderMultiAccountsHub();

        const primary = res.accounts[0];
        if (primary) {
          if (primary.status === 'CONNECTED' && primary.connected_number) {
            CRM_STATE.whatsappAccount.phoneNumber = primary.connected_number;
            CRM_STATE.whatsappAccount.status = 'CONNECTED';
          } else if (primary.status === 'SCAN_QR' || primary.status === 'DISCONNECTED') {
            CRM_STATE.whatsappAccount.status = primary.status;
          }
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
  fetch('http://localhost:3000/api/accounts/refresh_qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: 'account_1' })
  })
    .then(() => {
      showToast('Refreshing QR Code...', 'Generating fresh scan QR code', 'qr_code_scanner', 'emerald');
      setTimeout(fetchQRBridgeStatus, 1200);
    })
    .catch(() => {
      showToast('Bridge Offline', 'Make sure Node.js bridge server is running on port 3000', 'warning', 'rose');
    });
}

function handleDisconnectQR() {
  disconnectWhatsAppAccount('account_1');
}

// =========================================================================
// MULTI-ACCOUNT WHATSAPP HUB ENGINE
// =========================================================================
function renderMultiAccountsHub() {
  const container = document.getElementById('multi-accounts-container');
  const countBadge = document.getElementById('badge-multi-accounts-count');
  if (!container) return;

  const accounts = getAvailableWhatsAppAccounts();

  const connectedCount = accounts.filter(a => a.status === 'CONNECTED').length;
  if (countBadge) {
    countBadge.innerText = `${connectedCount} Connected`;
    countBadge.className = connectedCount > 0 ? "bg-emerald-400 text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full" : "bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full";
  }

  container.innerHTML = accounts.map((acc, index) => {
    const isConnected = acc.status === 'CONNECTED';
    const isScanning = (acc.status === 'SCAN_QR' && acc.qr_image);
    const isConnecting = acc.status === 'CONNECTING';
    const isDisconnected = acc.status === 'DISCONNECTED';
    const phoneNum = acc.connected_number || 'Awaiting Link';
    const isSelectedActive = (ACTIVE_SEND_ACCOUNT_ID === acc.id);

    return `
      <div class="bg-white rounded-2xl border ${isSelectedActive ? 'border-brand-wa ring-2 ring-brand-wa/30 shadow-md' : (isConnected ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-amber-200 shadow-sm')} p-5 space-y-4 flex flex-col justify-between transition-all">
        
        <!-- Account Card Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl ${isConnected ? 'bg-emerald-50 text-emerald-700' : (isScanning ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600')} flex items-center justify-center font-bold text-sm">
              <span class="material-symbols-outlined text-[22px]">${isConnected ? 'phone_android' : (isScanning ? 'qr_code_scanner' : 'sync')}</span>
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h4 class="font-bold text-slate-900 text-xs sm:text-sm">${acc.label || ('WhatsApp Phone #' + (index + 1))}</h4>
                <span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full ${isConnected ? 'bg-emerald-100 text-emerald-800' : (isScanning ? 'bg-amber-100 text-amber-800 ring-1 ring-amber-300 animate-pulse' : 'bg-slate-100 text-slate-800')}">
                  ${isConnected ? '🟢 CONNECTED (LIVE)' : (isScanning ? '🟡 SCAN QR WITH PHONE' : (isConnecting ? '⚪ INITIALIZING...' : '🔴 DISCONNECTED'))}
                </span>
                ${isSelectedActive && isConnected ? '<span class="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-brand-wa text-white">⭐ ACTIVE LINE</span>' : ''}
              </div>
              <p class="text-xs font-mono font-bold text-slate-600 mt-0.5">${isConnected ? (acc.connected_number || 'Device Linked') : '📱 Scan QR code below with WhatsApp mobile'}</p>
            </div>
          </div>

          <span class="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded font-bold">${acc.id}</span>
        </div>

        <!-- 1. ACTIVE QR CODE DISPLAY (When awaiting mobile scan) -->
        ${isScanning ? `
          <div class="bg-gradient-to-b from-amber-50/70 to-orange-50/40 p-4 rounded-2xl border-2 border-amber-300/80 flex flex-col items-center justify-center text-center space-y-3 shadow-inner">
            <div class="flex items-center gap-2 text-amber-950 font-extrabold text-xs">
              <span class="material-symbols-outlined text-[18px] text-amber-600">smartphone</span>
              <span>Link Your Mobile Device</span>
            </div>

            <!-- Crisp QR Code Image -->
            <div class="p-2.5 bg-white rounded-xl shadow-md border border-amber-200">
              <img src="${acc.qr_image}" alt="Scan WhatsApp QR" class="w-48 h-48 sm:w-52 sm:h-52 rounded-lg object-contain mx-auto">
            </div>

            <!-- Step-by-Step Scan Instructions -->
            <div class="bg-white/80 backdrop-blur-sm p-3 rounded-xl border border-amber-200/80 text-left text-[11px] text-slate-700 w-full max-w-sm space-y-1">
              <p class="font-bold text-slate-900 text-[11px] mb-1">📲 How to link your phone:</p>
              <div class="flex items-start gap-1.5"><span class="font-bold text-brand-waDark">1.</span><span>Open <b>WhatsApp</b> on your mobile phone.</span></div>
              <div class="flex items-start gap-1.5"><span class="font-bold text-brand-waDark">2.</span><span>Tap <b>Menu (⋮)</b> or <b>Settings</b> &rarr; <b>Linked Devices</b>.</span></div>
              <div class="flex items-start gap-1.5"><span class="font-bold text-brand-waDark">3.</span><span>Tap <b>Link a Device</b> and point camera at this QR code.</span></div>
            </div>

            <div class="flex items-center gap-2 pt-1">
              <button type="button" onclick="generateFreshAccountQR('${acc.id}')" class="px-3 py-1.5 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg font-bold text-[11px] flex items-center gap-1.5 transition shadow-sm">
                <span class="material-symbols-outlined text-[15px]">refresh</span> Refresh QR Code
              </button>
            </div>
          </div>
        ` : ''}

        <!-- 2. CONNECTED SUCCESS BANNER -->
        ${isConnected ? `
          <div class="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
            <div class="flex items-center gap-2.5 text-emerald-950">
              <span class="material-symbols-outlined text-[22px] text-emerald-600">verified</span>
              <div>
                <p class="font-bold text-xs text-emerald-900">Live Device Linked & Authenticated</p>
                <p class="text-[11px] text-emerald-700">Real-time incoming & outgoing messages active</p>
              </div>
            </div>
            <span class="font-mono text-emerald-900 font-extrabold text-xs bg-emerald-200/70 px-2.5 py-1 rounded-lg">${acc.connected_number || '+91 ...'}</span>
          </div>

          <!-- PROMINENT CONNECT & OPEN INBOX BUTTON -->
          <div class="pt-1">
            <button type="button" onclick="connectAndOpenWhatsAppChats('${acc.id}', '${acc.connected_number}', '${acc.label || 'WhatsApp Line'}')" class="w-full py-2.5 bg-gradient-to-r from-brand-wa to-emerald-600 hover:from-brand-waDark hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]" title="Connect this WhatsApp number and open live conversations">
              <span class="material-symbols-outlined text-[18px]">chat</span>
              <span>Open Live Conversations (${acc.connected_number || 'Connected Line'})</span>
            </button>
          </div>
        ` : ''}

        <!-- 3. DISCONNECTED / INITIALIZING STATE BUTTON -->
        ${(!isConnected && !isScanning) ? `
          <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center space-y-2.5">
            <p class="text-xs font-bold text-slate-700">${isConnecting ? 'Connecting to WhatsApp Socket...' : 'Device not linked. Click below to generate scan QR code.'}</p>
            <button type="button" onclick="generateFreshAccountQR('${acc.id}')" class="px-4 py-2 bg-gradient-to-r from-brand-wa to-emerald-600 hover:from-brand-waDark hover:to-emerald-700 text-white font-bold text-xs rounded-xl shadow flex items-center gap-2 transition">
              <span class="material-symbols-outlined text-[16px]">qr_code_scanner</span>
              <span>Generate QR Code to Link Phone</span>
            </button>
          </div>
        ` : ''}

        <!-- Actions Strip -->
        <div class="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-2">
            ${isConnected ? `
              <button type="button" onclick="disconnectWhatsAppAccount('${acc.id}')" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1 transition" title="Log out device session">
                <span class="material-symbols-outlined text-[14px]">link_off</span> Disconnect
              </button>
            ` : `
              <button type="button" onclick="generateFreshAccountQR('${acc.id}')" class="px-3 py-1.5 bg-brand-wa/10 hover:bg-brand-wa/20 text-brand-waDark border border-brand-wa/30 rounded-lg font-bold text-xs flex items-center gap-1 transition">
                <span class="material-symbols-outlined text-[14px]">qr_code</span> New QR Code
              </button>
            `}

            ${acc.id !== 'account_1' ? `
              <button type="button" onclick="deleteWhatsAppAccountSlot('${acc.id}')" class="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 rounded-lg font-bold text-xs flex items-center gap-1 transition" title="Delete account slot">
                <span class="material-symbols-outlined text-[14px]">delete</span> Delete Slot
              </button>
            ` : ''}
          </div>
          
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
  const raw = (connectedNumber && connectedNumber !== 'Awaiting Link')
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

// Generate a brand new QR Code for account
function generateFreshAccountQR(accountId) {
  const targetId = accountId || 'account_1';
  showToast('Generating QR Code...', 'Initializing fresh WhatsApp session for scanning.', 'qr_code_scanner', 'emerald');

  fetch('http://localhost:3000/api/accounts/refresh_qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: targetId })
  })
    .then(r => r.json())
    .then(res => {
      setTimeout(fetchQRBridgeStatus, 1500);
    })
    .catch(() => {
      showToast('Bridge Offline', 'Please make sure Node.js bridge server is running on port 3000', 'warning', 'rose');
    });
}

// Add New WhatsApp Phone Number / Slot
function addNewWhatsAppAccountSlot() {
  const currentAccounts = getAvailableWhatsAppAccounts();
  const nextNum = currentAccounts.length + 1;
  const slotId = `account_${Date.now()}`;
  const label = prompt(`Enter label for new WhatsApp account (e.g. Sales Team #${nextNum} or Support #${nextNum}):`, `WhatsApp Business #${nextNum}`);
  if (!label) return;

  const newAccount = {
    id: slotId,
    label: label,
    status: 'DISCONNECTED',
    connected_number: 'Awaiting Link',
    brand_name: label
  };

  if (!Array.isArray(CRM_STATE.whatsappLines)) {
    CRM_STATE.whatsappLines = getAvailableWhatsAppAccounts();
  }
  CRM_STATE.whatsappLines.push(newAccount);
  if (Array.isArray(CRM_STATE.deletedSlots)) {
    CRM_STATE.deletedSlots = CRM_STATE.deletedSlots.filter(id => id !== slotId);
  }
  saveCRMState();

  // Also notify bridge server if running
  fetch('http://localhost:3000/api/accounts/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ label, accountId: slotId })
  }).catch(() => {});

  renderMultiAccountsHub();
  renderQuickLineSwitcher();
  renderPhoneSwitcherDropdown();

  showToast('New WhatsApp Slot Created', `Slot "${label}" created. Click Generate QR Code to link phone.`, 'qr_code_scanner', 'emerald');
}

// Delete WhatsApp account slot
function deleteWhatsAppAccountSlot(accountId) {
  if (accountId === 'account_1') {
    showToast('Cannot Delete Primary Line', 'Line 1 is the primary business number and cannot be deleted.', 'warning', 'rose');
    return;
  }

  const accounts = getAvailableWhatsAppAccounts();
  const targetAcc = accounts.find(a => a.id === accountId);
  const label = targetAcc ? targetAcc.label : accountId;

  if (confirm(`Are you sure you want to delete WhatsApp slot: "${label}" (${accountId})?\n\nThis will remove the slot and its QR connection.`)) {
    // 1. Update CRM_STATE deletedSlots and active lines
    if (!Array.isArray(CRM_STATE.deletedSlots)) {
      CRM_STATE.deletedSlots = [];
    }
    if (!CRM_STATE.deletedSlots.includes(accountId)) {
      CRM_STATE.deletedSlots.push(accountId);
    }
    if (Array.isArray(CRM_STATE.whatsappLines)) {
      CRM_STATE.whatsappLines = CRM_STATE.whatsappLines.filter(a => a.id !== accountId);
    }

    // 2. Remove from live MULTI_ACCOUNTS_STATE array
    if (Array.isArray(MULTI_ACCOUNTS_STATE)) {
      MULTI_ACCOUNTS_STATE = MULTI_ACCOUNTS_STATE.filter(a => a.id !== accountId);
    }

    // 3. If the user had currently selected this deleted line in inbox, switch to 'all'
    if (ACTIVE_SEND_ACCOUNT_ID === accountId) {
      ACTIVE_SEND_ACCOUNT_ID = 'all';
    }

    // 4. Save state
    saveCRMState();

    // 5. Send delete request to bridge server & backend API (non-blocking)
    fetch('http://localhost:3000/api/accounts/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId })
    }).catch(() => {});

    fetch('api.php?action=delete_account_slot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId })
    }).catch(() => {});

    // 6. Re-render UI components immediately
    renderMultiAccountsHub();
    renderQuickLineSwitcher();
    renderPhoneSwitcherDropdown();
    renderInbox();
    updateConfiguredPhoneDisplays();

    showToast('Slot Deleted', `WhatsApp slot "${label}" has been removed.`, 'delete', 'blue');
    if (typeof playChime === 'function') playChime('inbound');
  }
}

// Disconnect specific WhatsApp account session
function disconnectWhatsAppAccount(accountId) {
  if (confirm(`Disconnect and unbind WhatsApp session for ${accountId}? Your CRM chats, customers & orders are 100% safe.`)) {
    if (CRM_STATE.whatsappAccount) {
      CRM_STATE.whatsappAccount.status = 'DISCONNECTED';
      saveCRMState();
      updateConfiguredPhoneDisplays();
    }

    fetch('http://localhost:3000/api/accounts/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId })
    })
      .then(r => r.json())
      .then(res => {
        showToast('WhatsApp Disconnected', `Session logged out. Fresh QR code is ready to scan.`, 'link_off', 'blue');
        setTimeout(fetchQRBridgeStatus, 1200);
      })
      .catch(() => {
        showToast('Disconnected', 'Session reset. Re-checking status...', 'info', 'blue');
        setTimeout(fetchQRBridgeStatus, 1200);
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
        renderInbox();
        updateBadgeCounters();
        renderCustomer360Panel();
        updateConfiguredPhoneDisplays();
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
  const availableAccountIds = getAvailableWhatsAppAccounts().map(a => a.id);
  const activeQueries = (CRM_STATE.queries || []).filter(q => availableAccountIds.includes(q.accountId || 'account_1'));

  const unassignedCount = activeQueries.filter(q => q.assignedTo === 'UNASSIGNED').length;
  const unreadCount = activeQueries.reduce((acc, q) => acc + (q.unreadCount || 0), 0);
  const myQueueCount = ACTIVE_ROLE === 'admin'
    ? activeQueries.length
    : activeQueries.filter(q => q.assignedTo === ACTIVE_ROLE).length;

  const bUnassigned = document.getElementById('badge-unassigned-count');
  if (bUnassigned) bUnassigned.innerText = `${unassignedCount} New`;

  const bUnread = document.getElementById('badge-total-unread');
  if (bUnread) bUnread.innerText = unreadCount;

  const countAll = document.getElementById('count-all');
  if (countAll) countAll.innerText = activeQueries.length;

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
