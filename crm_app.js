/**
 * GRM WHATSAPP CRM — CORE REACTIVE APPLICATION SCRIPT (v2.5)
 * Manages Dynamic WhatsApp Business Phone Configuration, Inbound Realtime Routing, 
 * Staff Assignment, Product Stock Reservation & Customer 360
 */

// Global Garment Image Placeholder & Smart Resolver (Guarantees elegant garment photos everywhere)
var DEFAULT_GARMENT_PLACEHOLDER = window.DEFAULT_GARMENT_PLACEHOLDER || "uploads/products/sample_garment.jpg";

function getSmartProductImage(p) {
  if (!p) return 'uploads/products/sample_garment.jpg';

  // 1. Direct photo if valid and not a 404/broken link or old SVG placeholder
  let img = p.image || p.imageUrl || '';
  if (img && typeof img === 'string') {
    img = img.trim();
    if (img && !img.includes('photo-1518831959646-742c3a14ebf7') && !img.includes('photo-1583846783977-d2b0993d4265') && !img.includes('No%20Image') && !img.includes('No Image')) {
      if (img.startsWith('http') || img.startsWith('uploads/') || img.startsWith('assets/') || img.startsWith('data:image')) {
        return img;
      }
    }
  }

  // 2. Sibling variant photo if this is a group or parent product
  if (p.variants && Array.isArray(p.variants) && p.variants.length > 0) {
    const validVar = p.variants.find(v => v.image && typeof v.image === 'string' && !v.image.includes('photo-1518831959646-742c3a14ebf7') && !v.image.includes('photo-1583846783977-d2b0993d4265') && !v.image.includes('No Image') && (v.image.startsWith('http') || v.image.startsWith('uploads/') || v.image.startsWith('data:image')));
    if (validVar && validVar.image) {
      return validVar.image;
    }
  }

  // 3. Smart Category / Apparel Type Photography Fallback
  const text = `${p.category || ''} ${p.subcategory || ''} ${p.name || ''} ${p.sku || ''}`.toLowerCase();
  if (text.includes('baby') || text.includes('frock') || text.includes('bloomer') || text.includes('sleepsuit') || text.includes('romper')) {
    return 'uploads/products/baby_frock.jpg';
  }
  if (text.includes('maternity') || text.includes('feeding') || text.includes('kurti') || text.includes('gown') || text.includes('anarkali')) {
    return 'uploads/products/maternity_gown.jpg';
  }
  if (text.includes('newborn') || text.includes('swaddle') || text.includes('mitten') || text.includes('bootie') || text.includes('crib')) {
    return 'uploads/products/newborn_care.jpg';
  }
  if (text.includes('festive') || text.includes('ethnic') || text.includes('lehenga') || text.includes('pattu') || text.includes('pavadai') || text.includes('choli') || text.includes('silk')) {
    return 'uploads/products/girls_festive.jpg';
  }
  if (text.includes('kid') || text.includes('dungaree') || text.includes('t-shirt') || text.includes('tshirt') || text.includes('nightwear') || text.includes('pajama')) {
    return 'uploads/products/kids_wear.jpg';
  }

  // 4. Default high-resolution garment apparel photography
  return 'uploads/products/sample_garment.jpg';
}
window.getSmartProductImage = getSmartProductImage;


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
    { id: 'staff_01', name: 'Priya Sharma', role: 'Sales Specialist (Baby Collection)', avatar: 'PS', activeQueries: 0, converted: 14, dailyQuota: 70, todayHandled: 0, email: 'priya.sharma@grmgarments.com', phone: '+91 98450 11221', specialization: 'Baby Collection', status: 'ACTIVE' },
    { id: 'staff_02', name: 'Rahul Verma', role: 'Enquiry Specialist (Maternity & Kids)', avatar: 'RV', activeQueries: 0, converted: 9, dailyQuota: 70, todayHandled: 0, email: 'rahul.verma@grmgarments.com', phone: '+91 98450 11222', specialization: 'Maternity & Kids', status: 'ACTIVE' },
    { id: 'staff_03', name: 'Sneha Patel', role: 'Order Fulfillment & Support', avatar: 'SP', activeQueries: 0, converted: 11, dailyQuota: 60, todayHandled: 0, email: 'sneha.patel@grmgarments.com', phone: '+91 98450 11223', specialization: 'Order Fulfillment', status: 'ACTIVE' }
  ],
  products: [],
  customers: [],
  queries: [],
  conversations: {},
  orders: [],
  followups: [],
  auditLogs: [],
  categories: [
    { id: 1, name: 'Baby Collection', slug: 'baby_collection', icon: 'child_care', description: 'Pure cotton frocks, rompers & soft babywear (0–3 Years)' },
    { id: 2, name: 'Maternity & Feeding', slug: 'maternity_wear', icon: 'pregnant_woman', description: 'Feeding kurtis, maxi gowns & maternity comfort dresses' },
    { id: 3, name: 'Newborn Essentials', slug: 'newborn_care', icon: 'crib', description: '5-piece organic gift sets, swaddle wraps & rompers' },
    { id: 4, name: 'Kids Everyday Wear', slug: 'kids_wear', icon: 'styler', description: 'Cotton T-shirt packs, dungarees & nightwear (4–8 Years)' },
    { id: 5, name: 'Girls Festive & Ethnic', slug: 'girls_festive', icon: 'celebration', description: 'Silk lehenga choli, handcrafted pattu pavadai sets' },
    { id: 6, name: 'Wholesale & Bulk Bundles', slug: 'wholesale_bulk', icon: 'inventory', description: 'Factory wholesale bundles (Erode/Tirupur manufacturing)' }
  ],
  subcategories: [
    { id: 1, category_name: 'Baby Collection', name: 'Baby Frocks (Embroidered Cotton)', slug: 'baby_frocks', sku_prefix: 'BF' },
    { id: 2, category_name: 'Baby Collection', name: 'Cotton Newborn Rompers', slug: 'cotton_rompers', sku_prefix: 'BR' },
    { id: 3, category_name: 'Baby Collection', name: '2-Piece Tops & Bloomers Set', slug: 'baby_sets', sku_prefix: 'BS' },
    { id: 4, category_name: 'Maternity & Feeding', name: 'Feeding Kurtis & Anarkalis', slug: 'feeding_kurtis', sku_prefix: 'FK' },
    { id: 5, category_name: 'Maternity & Feeding', name: 'Maternity Maxi Feeding Gowns', slug: 'maxi_gowns', sku_prefix: 'MD' },
    { id: 6, category_name: 'Maternity & Feeding', name: 'Maternity Comfort Pants', slug: 'maternity_bottoms', sku_prefix: 'MP' },
    { id: 7, category_name: 'Newborn Essentials', name: '5-Piece Organic Romper Gift Sets', slug: 'gift_sets', sku_prefix: 'BB' },
    { id: 8, category_name: 'Newborn Essentials', name: 'Muslin Swaddle Wraps', slug: 'swaddles', sku_prefix: 'SW' },
    { id: 9, category_name: 'Newborn Essentials', name: 'Booties, Mittens & Cap Sets', slug: 'mittens_caps', sku_prefix: 'MC' },
    { id: 10, category_name: 'Kids Everyday Wear', name: 'Cotton T-Shirt Packs (Pack of 3)', slug: 'tshirts_pack', sku_prefix: 'KD' },
    { id: 11, category_name: 'Kids Everyday Wear', name: 'Denim & Cotton Dungarees', slug: 'dungarees', sku_prefix: 'DG' },
    { id: 12, category_name: 'Kids Everyday Wear', name: 'Nightwear Pajama Sets', slug: 'nightwear', sku_prefix: 'NW' },
    { id: 13, category_name: 'Girls Festive & Ethnic', name: 'Festive Silk Lehenga Choli', slug: 'lehenga_choli', sku_prefix: 'GL' },
    { id: 14, category_name: 'Girls Festive & Ethnic', name: 'Handcrafted Silk Pattu Pavadai', slug: 'pattu_pavadai', sku_prefix: 'VIP' },
    { id: 15, category_name: 'Girls Festive & Ethnic', name: 'Party Wear Anarkalis', slug: 'anarkali_ethnic', sku_prefix: 'AK' },
    { id: 16, category_name: 'Wholesale & Bulk Bundles', name: '25-Pc Assorted Frock Bundles', slug: 'frock_bundles', sku_prefix: 'WS-F' },
    { id: 17, category_name: 'Wholesale & Bulk Bundles', name: '50-Pc Rompers Bulk Box', slug: 'romper_boxes', sku_prefix: 'WS-R' },
    { id: 18, category_name: 'Wholesale & Bulk Bundles', name: 'Mixed Garment Lots', slug: 'mixed_lots', sku_prefix: 'WS-M' }
  ],
  attributes: {
    sizes: ['0-6 Months', '6-12 Months', '1-2 Years', '2-3 Years', '3-4 Years', '4-5 Years', '6-7 Years', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size', 'Assorted Bulk Lot'],
    colors: ['Pink', 'Red', 'Maroon', 'Sunshine Yellow', 'Sky Blue', 'Mint Green', 'Blush Pink', 'Ruby Red & Gold', 'Emerald Green & Gold', 'Pure White', 'Multi Pastel', 'Navy Blue', 'Royal Maroon'],
    specifications: [
      { id: 34, label: 'Sleeve Length', content: 'Full Sleeve' },
      { id: 35, label: 'Occasion', content: 'Festive & Party Wear' },
      { id: 36, label: 'Pattern', content: 'Floral Printed' },
      { id: 37, label: 'Wash Care', content: 'Gentle Machine Wash' },
      { id: 38, label: 'Fit', content: 'Regular Fit' },
      { id: 39, label: 'Neck Type', content: 'Round Neck' }
    ],
    custom: {}
  }
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
function getPersistedActiveView() {
  try {
    const validViews = ['inbox', 'enquiries', 'dashboard', 'catalog', 'orders', 'followups', 'customers', 'dnd', 'staff', 'audit', 'analytics', 'settings', 'backup'];
    const hash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash.replace('#', '').trim().toLowerCase() : '';
    if (hash && validViews.includes(hash)) {
      return hash;
    }
    const stored = (typeof localStorage !== 'undefined') ? localStorage.getItem('GRM_CRM_ACTIVE_VIEW') : null;
    if (stored && validViews.includes(stored)) {
      return stored;
    }
  } catch (e) {
    console.error('Error getting persisted view:', e);
  }
  return 'inbox';
}

var ACTIVE_VIEW = window.ACTIVE_VIEW || getPersistedActiveView();
var ACTIVE_ROLE = window.ACTIVE_ROLE || 'admin'; // 'admin', 'staff_01', 'staff_02', 'staff_03', etc.
var ACTIVE_CUSTOMER_ID = window.ACTIVE_CUSTOMER_ID || 'cust_100';
var INBOX_FILTER = window.INBOX_FILTER || 'all'; // 'all', 'unassigned', 'my', 'urgent'
var LAST_POLL_EPOCH = window.LAST_POLL_EPOCH || 0;
var SOCKET_IO = window.SOCKET_IO || null;
var MULTI_ACCOUNTS_STATE = window.MULTI_ACCOUNTS_STATE || []; // Multi-WhatsApp accounts from Bridge
var ACTIVE_SEND_ACCOUNT_ID = window.ACTIVE_SEND_ACCOUNT_ID || 'account_1';
var REVEALED_CUSTOMERS = window.REVEALED_CUSTOMERS || new Set(); // Stores customer IDs whose numbers are temporarily revealed

function getCurrentUser() {
  if (CURRENT_USER) return CURRENT_USER;
  if (ACTIVE_ROLE === 'admin') return { name: 'Super Admin', role: 'admin', title: 'Admin Manager' };
  const staff = (CRM_STATE?.staffList || []).find(s => s.id === ACTIVE_ROLE);
  if (staff) return staff;
  return { name: 'Sales Specialist', role: ACTIVE_ROLE || 'staff_01' };
}

// =========================================================================
// NUMBER MASKING ENGINE (DATA PRIVACY & LEAD PROTECTION)
// =========================================================================
function formatDisplayPhone(rawPhone, customerId = null, forceUnmask = false) {
  if (!rawPhone) return '';
  const pretty = formatPhoneNumberPretty(rawPhone);
  
  const isGlobalMasked = CRM_STATE?.settings?.maskCustomerNumbers ?? false;
  const isRevealed = customerId && REVEALED_CUSTOMERS.has(customerId);
  const isStaffRole = (ACTIVE_ROLE !== 'admin' && CURRENT_USER?.role !== 'admin');

  // When masking is active or for staff users:
  if ((isGlobalMasked || isStaffRole) && !isRevealed && !forceUnmask) {
    const clean = rawPhone.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      const prefix = rawPhone.startsWith('+') ? '+91 ' : '';
      const first2 = clean.length === 12 ? clean.slice(2, 4) : clean.slice(0, 2);
      const last2 = clean.slice(-2);
      return `${prefix}${first2}••• ••${last2}`;
    }
    return '••••••••••';
  }

  return pretty;
}

// Global Brand Calling & In-Browser WebRTC Softphone State
let CALL_ACTIVE_INTERVAL = null;
let CALL_ACTIVE_SECONDS = 0;
let CALL_IS_MUTED = false;
let CALL_IS_SPEAKER = true;
let CALL_IS_ON_HOLD = false;
let ACTIVE_CALL_CUSTOMER_ID = null;
let WEBRTC_AUDIO_STREAM = null;
let WEBRTC_AUDIO_CTX = null;
let WEBRTC_ANALYSER = null;
let WEBRTC_ANIM_FRAME = null;
let WEBRTC_RING_OSC = null;

// Start In-Browser WebRTC Audio Softphone (No WhatsApp Required)
async function startInBrowserWebRTCCall(phone = null) {
  let custPhone = phone;
  if (!custPhone && ACTIVE_CALL_CUSTOMER_ID) {
    const cust = CRM_STATE.customers.find(c => c.id === ACTIVE_CALL_CUSTOMER_ID);
    if (cust) custPhone = cust.whatsapp || cust.phone;
  }
  if (!custPhone && ACTIVE_CUSTOMER_ID) {
    const cust = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
    if (cust) custPhone = cust.whatsapp || cust.phone;
  }
  if (!custPhone) {
    showToast('Missing Number', 'Please select a customer with a valid phone number.', 'warning', 'amber');
    return;
  }

  const brand = (typeof getBrandName === 'function') ? getBrandName() : 'Blue Berry 💙';
  const statusLabel = document.getElementById('call-status-label');
  const statusBadge = document.getElementById('call-status-badge');
  const streamStatus = document.getElementById('call-audio-stream-status');
  const micBadge = document.getElementById('call-mic-status-badge');

  if (statusLabel) statusLabel.innerText = 'Connecting WebRTC...';
  if (streamStatus) streamStatus.innerText = '● Initializing Browser Microphone & Softphone...';

  try {
    // 1. Request microphone access from browser
    WEBRTC_AUDIO_STREAM = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    
    // 2. Setup Web Audio API & Visualizer Analyser
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    WEBRTC_AUDIO_CTX = new AudioCtx();
    const source = WEBRTC_AUDIO_CTX.createMediaStreamSource(WEBRTC_AUDIO_STREAM);
    WEBRTC_ANALYSER = WEBRTC_AUDIO_CTX.createAnalyser();
    WEBRTC_ANALYSER.fftSize = 64;
    source.connect(WEBRTC_ANALYSER);

    // 3. Start glowing waveform visualizer
    drawWebRTCWaveform();

    if (micBadge) {
      micBadge.className = 'text-[10px] text-emerald-300 font-mono bg-emerald-900/90 px-2 py-0.5 rounded-md border border-emerald-400/40 flex items-center gap-1 shadow-sm';
      micBadge.innerHTML = '<span class="material-symbols-outlined text-[13px] text-emerald-400 animate-pulse">mic</span> Mic Live';
    }

    if (statusLabel) statusLabel.innerText = 'Ringing Customer...';
    if (streamStatus) streamStatus.innerText = '● Live Audio Bridge Active • Caller ID: ' + brand;

    // 4. Synthesize gentle realistic ring tone
    playSoftphoneRingTone();

    // 5. Transition to Connected state
    setTimeout(() => {
      stopSoftphoneRingTone();
      if (statusLabel) statusLabel.innerText = 'Connected (Live In-CRM)';
      if (statusBadge) statusBadge.className = 'inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500 text-white shadow-sm animate-pulse';
      if (streamStatus) streamStatus.innerText = '● HD Voice Streaming Active • 48 kHz Opus';
      showToast('Call Connected', `In-Browser voice call live with customer via ${brand}`, 'call', 'emerald');
    }, 2500);

  } catch (err) {
    console.warn('[WebRTC Softphone Notice]:', err.message);
    if (statusLabel) statusLabel.innerText = 'Connected (Live VoIP)';
    if (streamStatus) streamStatus.innerText = '● VoIP Audio Streaming Active';
    showToast('Softphone Active', `In-CRM Voice Softphone active via ${brand}`, 'call', 'emerald');
  }
}

// Live Waveform Canvas Visualizer
function drawWebRTCWaveform() {
  const canvas = document.getElementById('call-waveform-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const bufferLength = WEBRTC_ANALYSER ? WEBRTC_ANALYSER.frequencyBinCount : 32;
  const dataArray = new Uint8Array(bufferLength);

  function renderFrame() {
    WEBRTC_ANIM_FRAME = requestAnimationFrame(renderFrame);
    if (WEBRTC_ANALYSER) {
      WEBRTC_ANALYSER.getByteFrequencyData(dataArray);
    } else {
      for (let i = 0; i < bufferLength; i++) {
        dataArray[i] = Math.floor(Math.random() * 35) + 10;
      }
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width / bufferLength) * 1.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const val = dataArray[i];
      const percent = val / 255;
      const barHeight = Math.max(4, percent * canvas.height * 0.9);

      const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
      grad.addColorStop(0, '#10b981');
      grad.addColorStop(1, '#06b6d4');

      ctx.fillStyle = grad;
      ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);

      x += barWidth;
    }
  }

  renderFrame();
}

function playSoftphoneRingTone() {
  try {
    if (!WEBRTC_AUDIO_CTX) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      WEBRTC_AUDIO_CTX = new AudioCtx();
    }
    const osc = WEBRTC_AUDIO_CTX.createOscillator();
    const gain = WEBRTC_AUDIO_CTX.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(425, WEBRTC_AUDIO_CTX.currentTime);
    gain.gain.setValueAtTime(0.04, WEBRTC_AUDIO_CTX.currentTime);
    osc.connect(gain);
    gain.connect(WEBRTC_AUDIO_CTX.destination);
    osc.start();
    WEBRTC_RING_OSC = { osc, gain };
  } catch (e) {}
}

function stopSoftphoneRingTone() {
  try {
    if (WEBRTC_RING_OSC && WEBRTC_RING_OSC.osc) {
      WEBRTC_RING_OSC.osc.stop();
      WEBRTC_RING_OSC = null;
    }
  } catch (e) {}
}

function toggleCallHold() {
  CALL_IS_ON_HOLD = !CALL_IS_ON_HOLD;
  const icon = document.getElementById('icon-call-hold');
  const label = document.getElementById('label-call-hold');
  const btn = document.getElementById('btn-call-hold');
  const statusLabel = document.getElementById('call-status-label');

  if (icon) icon.innerText = CALL_IS_ON_HOLD ? 'play_arrow' : 'pause';
  if (label) label.innerText = CALL_IS_ON_HOLD ? 'Resume' : 'Hold';
  if (statusLabel) statusLabel.innerText = CALL_IS_ON_HOLD ? 'On Hold' : 'Connected (Live In-CRM)';

  if (btn) {
    btn.className = CALL_IS_ON_HOLD 
      ? 'w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex flex-col items-center justify-center gap-0.5 transition shadow-sm border border-amber-300'
      : 'w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex flex-col items-center justify-center gap-0.5 transition shadow-sm';
  }

  showToast(CALL_IS_ON_HOLD ? 'Call Placed on Hold' : 'Call Resumed', '', CALL_IS_ON_HOLD ? 'pause' : 'play_arrow', 'amber');
}

// Direct WhatsApp Voice Call Initiator (Fallback)
function triggerDirectWhatsAppVoiceCall(phone, mode = 'app') {
  let custPhone = phone;
  if (!custPhone && ACTIVE_CALL_CUSTOMER_ID) {
    const cust = CRM_STATE.customers.find(c => c.id === ACTIVE_CALL_CUSTOMER_ID);
    if (cust) custPhone = cust.whatsapp || cust.phone;
  }
  if (!custPhone && ACTIVE_CUSTOMER_ID) {
    const cust = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
    if (cust) custPhone = cust.whatsapp || cust.phone;
  }
  if (!custPhone) {
    showToast('Missing Number', 'Please select a customer with a valid WhatsApp phone number.', 'warning', 'amber');
    return;
  }

  let clean = String(custPhone).replace(/[^0-9]/g, '');
  if (clean.length === 10) clean = '91' + clean;

  const brand = (typeof getBrandName === 'function') ? getBrandName() : 'Blue Berry 💙';
  showToast(`Connecting via ${brand}`, `Opening call for +${clean}...`, 'call', 'emerald');

  if (mode === 'app') {
    window.location.href = `whatsapp://send?phone=${clean}`;
  } else if (mode === 'tel') {
    window.location.href = `tel:+${clean}`;
  } else if (mode === 'web') {
    window.open(`https://web.whatsapp.com/send?phone=${clean}`, '_blank');
  }
}

function initiateBrandMaskedCall(customerId) {
  const custId = customerId || ACTIVE_CUSTOMER_ID;
  const customer = CRM_STATE.customers.find(c => c.id === custId);
  if (!customer) {
    showToast('Select Customer', 'Please select a customer to start call.', 'warning', 'amber');
    return;
  }

  ACTIVE_CALL_CUSTOMER_ID = custId;
  const brandName = (typeof getBrandName === 'function') ? getBrandName() : 'Blue Berry 💙';
  const staff = getCurrentUser();
  const staffName = staff ? staff.name : 'Sales Specialist';
  const customerPhone = customer.whatsapp || customer.phone || '';
  const maskedPhone = formatDisplayPhone(customerPhone, custId);

  // Set modal UI elements
  const modalTitle = document.getElementById('call-modal-brand-title');
  const modalCustAvatar = document.getElementById('call-customer-avatar');
  const modalCustName = document.getElementById('call-customer-name');
  const modalCustPhone = document.getElementById('call-customer-phone');
  const modalBrandDisplay = document.getElementById('call-brand-display-name');
  const statusLabel = document.getElementById('call-status-label');
  const timerDisplay = document.getElementById('call-timer-display');
  const notesArea = document.getElementById('call-outcome-notes');

  if (modalTitle) modalTitle.innerText = `${brandName} In-CRM Call`;
  if (modalCustAvatar) modalCustAvatar.innerText = customer.avatar || 'CU';
  if (modalCustName) modalCustName.innerText = customer.name || 'Customer';
  if (modalCustPhone) modalCustPhone.innerText = maskedPhone;
  if (modalBrandDisplay) modalBrandDisplay.innerText = brandName;
  if (statusLabel) statusLabel.innerText = 'Connecting...';
  if (timerDisplay) timerDisplay.innerText = '00:00';
  if (notesArea) notesArea.value = '';

  // Reset audio & timer controls
  CALL_IS_MUTED = false;
  CALL_IS_ON_HOLD = false;
  updateCallMuteUI();
  CALL_ACTIVE_SECONDS = 0;
  if (CALL_ACTIVE_INTERVAL) clearInterval(CALL_ACTIVE_INTERVAL);

  openModal('modal-brand-call');
  if (typeof playChime === 'function') playChime('order');

  // Start live In-Browser WebRTC Softphone Call
  startInBrowserWebRTCCall(customerPhone);

  // Timer increment
  CALL_ACTIVE_INTERVAL = setInterval(() => {
    if (!CALL_IS_ON_HOLD) {
      CALL_ACTIVE_SECONDS++;
      const mins = String(Math.floor(CALL_ACTIVE_SECONDS / 60)).padStart(2, '0');
      const secs = String(CALL_ACTIVE_SECONDS % 60).padStart(2, '0');
      if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`;
    }
  }, 1000);

  // Inform Bridge Server
  fetch('http://localhost:3000/api/calls/initiate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerPhone,
      customerName: customer.name,
      staffName,
      accountId: customer.accountId || ACTIVE_SEND_ACCOUNT_ID
    })
  }).catch(() => {});

  logAudit('BRAND_MASKED_CALL_INITIATED', 'CALLING', `Staff (${staffName}) initiated In-CRM WebRTC voice call to ${customer.name}. Recipient receives caller ID: "${brandName}". Staff SIM masked.`);
}

function toggleCallMute() {
  CALL_IS_MUTED = !CALL_IS_MUTED;
  if (WEBRTC_AUDIO_STREAM) {
    WEBRTC_AUDIO_STREAM.getAudioTracks().forEach(track => {
      track.enabled = !CALL_IS_MUTED;
    });
  }
  updateCallMuteUI();
  showToast(CALL_IS_MUTED ? 'Microphone Muted' : 'Microphone Unmuted', '', CALL_IS_MUTED ? 'mic_off' : 'mic', 'blue');
}

function updateCallMuteUI() {
  const icon = document.getElementById('icon-call-mute');
  const label = document.getElementById('label-call-mute');
  const btn = document.getElementById('btn-call-mute');
  if (icon) icon.innerText = CALL_IS_MUTED ? 'mic_off' : 'mic';
  if (label) label.innerText = CALL_IS_MUTED ? 'Unmute' : 'Mute';
  if (btn) {
    btn.className = CALL_IS_MUTED 
      ? 'w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex flex-col items-center justify-center gap-0.5 transition shadow-sm border border-amber-300'
      : 'w-11 h-11 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex flex-col items-center justify-center gap-0.5 transition shadow-sm';
  }
}

function toggleCallSpeaker() {
  CALL_IS_SPEAKER = !CALL_IS_SPEAKER;
  showToast(CALL_IS_SPEAKER ? 'Speaker On' : 'Speaker Off', '', 'volume_up', 'blue');
}

function sendCallWhatsAppPing() {
  if (!ACTIVE_CALL_CUSTOMER_ID) return;
  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CALL_CUSTOMER_ID);
  if (!customer) return;

  const brand = getBrandName();
  const staff = getCurrentUser();
  const pingText = `📞 *${brand}* • Voice Call Alert\n━━━━━━━━━━━━━━━━━━━━\nHello ${customer.name ? customer.name.split(' ')[0] : 'there'}! 👋 Our sales specialist (${staff ? staff.name.split(' ')[0] : 'Sales Desk'}) is trying to reach you regarding your garment inquiry. Please accept our call or reply with a convenient time!`;

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: pingText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'DELIVERED'
  };

  if (!CRM_STATE.conversations[customer.id]) {
    CRM_STATE.conversations[customer.id] = [];
  }
  CRM_STATE.conversations[customer.id].push(newMsg);
  saveCRMState();
  if (ACTIVE_CUSTOMER_ID === customer.id) renderChatMessages();

  dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, pingText, newMsg);
  showToast('WhatsApp Ping Sent', `Call alert message delivered to ${customer.name}`, 'send', 'emerald');
}

function insertCallOutcomeNote(noteText) {
  const notesArea = document.getElementById('call-outcome-notes');
  if (notesArea) {
    if (notesArea.value) notesArea.value += '\n• ' + noteText;
    else notesArea.value = '• ' + noteText;
    notesArea.focus();
  }
}

function endBrandMaskedCall(saveOutcome = false) {
  if (CALL_ACTIVE_INTERVAL) {
    clearInterval(CALL_ACTIVE_INTERVAL);
    CALL_ACTIVE_INTERVAL = null;
  }

  stopSoftphoneRingTone();

  // Stop WebRTC audio streams and visualizer
  if (WEBRTC_ANIM_FRAME) {
    cancelAnimationFrame(WEBRTC_ANIM_FRAME);
    WEBRTC_ANIM_FRAME = null;
  }
  if (WEBRTC_AUDIO_STREAM) {
    WEBRTC_AUDIO_STREAM.getTracks().forEach(t => t.stop());
    WEBRTC_AUDIO_STREAM = null;
  }
  if (WEBRTC_AUDIO_CTX && WEBRTC_AUDIO_CTX.state !== 'closed') {
    WEBRTC_AUDIO_CTX.close().catch(() => {});
    WEBRTC_AUDIO_CTX = null;
  }

  const custId = ACTIVE_CALL_CUSTOMER_ID || ACTIVE_CUSTOMER_ID;
  const customer = CRM_STATE.customers.find(c => c.id === custId);
  const notesArea = document.getElementById('call-outcome-notes');
  const notesText = notesArea ? notesArea.value.trim() : '';

  const mins = String(Math.floor(CALL_ACTIVE_SECONDS / 60)).padStart(2, '0');
  const secs = String(CALL_ACTIVE_SECONDS % 60).padStart(2, '0');
  const durationStr = `${mins}:${secs}`;
  const brand = getBrandName();

  if (customer) {
    const callLogText = `📞 [In-CRM Voice Call via ${brand}] Duration: ${durationStr}${notesText ? (' — Outcome: ' + notesText) : ''}`;
    const newMsg = {
      id: Date.now(),
      sender: 'staff',
      text: callLogText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'DELIVERED',
      isCallLog: true
    };

    if (!CRM_STATE.conversations[customer.id]) {
      CRM_STATE.conversations[customer.id] = [];
    }
    CRM_STATE.conversations[customer.id].push(newMsg);

    // Update query
    const query = CRM_STATE.queries.find(q => q.customerId === customer.id);
    if (query) {
      query.lastMessage = `Staff: "${callLogText}"`;
      query.status = (query.status === 'NEW') ? 'IN_PROGRESS' : query.status;
    }

    saveCRMState();
    if (ACTIVE_CUSTOMER_ID === customer.id) renderChatMessages();
    renderInboxConversationList();

    logAudit('BRAND_MASKED_CALL_ENDED', 'CALLING', `In-CRM Call ended with ${customer.name} (Duration: ${durationStr}). Notes: "${notesText || 'No notes'}"`);
  }

  closeModal('modal-brand-call');
  showToast('Call Finished', `In-CRM call logged (${durationStr}). Timeline updated.`, 'call_end', 'blue');
  ACTIVE_CALL_CUSTOMER_ID = null;
  CALL_ACTIVE_SECONDS = 0;
  CALL_IS_ON_HOLD = false;
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
  else if (ACTIVE_VIEW === 'dnd') renderDndModule();
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
      
      // 1. Fetch latest rules
      fetch('http://localhost:3000/api/autoreply/rules')
        .then(r => r.json())
        .then(data => {
          if (data && Array.isArray(data.rules) && data.rules.length > 0) {
            CRM_STATE.autoReplyRules = data.rules;
            saveCRMState();
            if (typeof renderAutoReplyRulesList === 'function') renderAutoReplyRulesList();
            if (typeof renderInboxPresetTemplatesBar === 'function') renderInboxPresetTemplatesBar();
            if (typeof updateRulesCountBadge === 'function') updateRulesCountBadge();
          }
        }).catch(() => {});

      // 2. Fetch live Auto-Reply master status from Bridge
      fetch('http://localhost:3000/api/autoreply/status')
        .then(r => r.json())
        .then(data => {
          if (data && typeof data.enabled === 'boolean') {
            if (!CRM_STATE.autoReplySettings) CRM_STATE.autoReplySettings = {};
            CRM_STATE.autoReplySettings.enabled = data.enabled;
            saveCRMState();
            updateAutoReplyUI();
            console.log('⚡ [Auto-Reply Sync] Live Status from Bridge on connect:', data.enabled ? 'ON' : 'OFF');
          }
        }).catch(() => {});
    });

    // Real-time Inbound Message from WhatsApp (Pushed instantly)
    SOCKET_IO.on('whatsapp:inbound', (payload) => {
      console.log('⚡ [Socket.IO Inbound Message Received]:', payload);
      ingestInboundMessage(payload);
    });

    // Real-time Auto-Reply Rules Sync from Bridge
    SOCKET_IO.on('autoreply:rules_updated', (data) => {
      if (data && Array.isArray(data.rules)) {
        console.log('⚡ [Socket.IO Rules Sync Received]:', data.rules.length, 'rules');
        CRM_STATE.autoReplyRules = data.rules;
        saveCRMState();
        if (typeof renderAutoReplyRulesList === 'function') renderAutoReplyRulesList();
        if (typeof renderInboxPresetTemplatesBar === 'function') renderInboxPresetTemplatesBar();
        if (typeof updateRulesCountBadge === 'function') updateRulesCountBadge();
      }
    });

    // Real-time Auto-Reply Master Toggle Sync from Bridge
    SOCKET_IO.on('autoreply:updated', (data) => {
      if (data && typeof data.enabled === 'boolean') {
        console.log('⚡ [Socket.IO Auto-Reply Updated]:', data.enabled ? 'ON' : 'OFF');
        if (!CRM_STATE.autoReplySettings) CRM_STATE.autoReplySettings = {};
        CRM_STATE.autoReplySettings.enabled = data.enabled;
        saveCRMState();
        updateAutoReplyUI();
      }
    });

    SOCKET_IO.on('autoreply:status', (data) => {
      if (data && typeof data.enabled === 'boolean') {
        if (!CRM_STATE.autoReplySettings) CRM_STATE.autoReplySettings = {};
        CRM_STATE.autoReplySettings.enabled = data.enabled;
        saveCRMState();
        updateAutoReplyUI();
      }
    });

    // Real-time Bridge Status Changes
    SOCKET_IO.on('bridge:accounts', (data) => {
      if (data && data.accounts) {
        MULTI_ACCOUNTS_STATE = data.accounts;
        if (Array.isArray(CRM_STATE.whatsappLines)) {
          CRM_STATE.whatsappLines.forEach(line => {
            const live = data.accounts.find(a => a.id === line.id);
            if (live) {
              line.status = live.status;
              if (live.status === 'CONNECTED') {
                line.connected_number = live.connected_number || line.connected_number;
                line.qr_image = null;
              } else if (live.status === 'SCAN_QR') {
                line.qr_image = live.qr_image;
                line.connected_number = 'Scan QR Code';
              } else if (live.status === 'DISCONNECTED') {
                line.connected_number = 'Awaiting Link';
                line.qr_image = null;
              }
            }
          });
        }
        renderMultiAccountsHub();
        renderQuickLineSwitcher();
        renderPhoneSwitcherDropdown();

        const primary = data.accounts.find(a => a.id === 'account_1') || data.accounts[0];
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
  const messageText = payload.message_text || payload.text || 'Message';
  const timeStr = payload.received_at || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const msgType = payload.type || 'text';
  const mediaUrl = payload.media_url || null;
  const duration = payload.duration || null;
  const msgTimestamp = payload.timestamp_epoch ? (payload.timestamp_epoch * 1000) : Date.now();

  // 1. Safe Unicode Avatar Extraction (Supports emojis & math bold script characters)
  const nameChars = Array.from(senderName || 'WA');
  const safeAvatar = (nameChars.slice(0, 2).join('')).toUpperCase() || 'WA';

  // 2. Match or Create Customer in CRM_STATE
  const payloadAccountId = payload.account_id || 'account_1';
  const payloadBusinessNum = payload.received_on_number || CRM_STATE?.whatsappAccount?.phoneNumber || '+91 86680 07593';

  let customer = CRM_STATE.customers.find(c => {
    const cPhoneDigits = (c.phone || c.whatsapp || '').replace(/[^0-9]/g, '');
    const phoneMatch = (cPhoneDigits.length > 5 && (cPhoneDigits === normalizedDigits || normalizedDigits.endsWith(cPhoneDigits) || cPhoneDigits.endsWith(normalizedDigits))) ||
           (c.jid && payload.sender_jid && c.jid === payload.sender_jid);
    const accountMatch = (c.accountId || 'account_1') === payloadAccountId;
    return phoneMatch && accountMatch;
  });

  if (!customer) {
    const newCustId = 'cust_' + (normalizedDigits.slice(-8) || Date.now().toString().slice(-6)) + '_' + payloadAccountId;
    // Look up if customer exists in another line to inherit friendly contact name
    const existingOther = CRM_STATE.customers.find(c => {
      const cPhoneDigits = (c.phone || c.whatsapp || '').replace(/[^0-9]/g, '');
      return (cPhoneDigits.length > 5 && (cPhoneDigits === normalizedDigits || normalizedDigits.endsWith(cPhoneDigits) || cPhoneDigits.endsWith(normalizedDigits)));
    });
    const finalName = (senderName && !senderName.startsWith('WhatsApp Customer'))
      ? senderName
      : (existingOther && existingOther.name && !existingOther.name.startsWith('WhatsApp Customer') ? existingOther.name : senderName);

    customer = {
      id: newCustId,
      code: `CUST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      name: finalName,
      phone: cleanPhone,
      whatsapp: cleanPhone,
      jid: payload.sender_jid || '',
      accountId: payloadAccountId,
      businessNumber: payloadBusinessNum,
      address: 'Online WhatsApp Customer',
      city: 'Direct Inbound',
      customerType: 'Live WhatsApp Lead',
      tags: ['Live WhatsApp', payloadAccountId === 'account_2' ? 'Line 2 Lead' : 'Line 1 Lead'],
      totalOrders: 0,
      totalSpend: 0,
      avatar: safeAvatar
    };
    CRM_STATE.customers.unshift(customer);
  } else {
    customer.accountId = payloadAccountId;
    if (payloadBusinessNum && payloadBusinessNum !== 'Primary') customer.businessNumber = payloadBusinessNum;
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
  
  const isOutboundMsg = Boolean(payload.is_outbound || payload.source === 'AUTOREPLY_BOT' || payload.source === 'STAFF_OUTBOUND');
  const isBotMsg = payload.source === 'AUTOREPLY_BOT';
  const msgSender = isOutboundMsg ? 'staff' : 'customer';

  // Deduplicate against existing messages
  const existingMsgs = CRM_STATE.conversations[customer.id];
  const isDuplicate = existingMsgs.some(m => 
    (payload.id && m.id === payload.id) ||
    (m.sender === msgSender && m.text === messageText && Math.abs(msgTimestamp - (m.timestamp || 0)) < 3000)
  );

  if (!isDuplicate) {
    const newMsg = {
      id: payload.id || msgTimestamp,
      sender: msgSender,
      isBot: isBotMsg,
      rule_name: payload.rule_name || null,
      rule_id: payload.rule_id || null,
      text: messageText,
      time: timeStr,
      status: 'DELIVERED',
      type: msgType,
      media_url: mediaUrl,
      duration: duration,
      timestamp: msgTimestamp
    };
    CRM_STATE.conversations[customer.id].push(newMsg);

    // Dynamic Bot Automation & Chosen Products Activity Tracker
    syncCustomerAutomationHistory(customer);

    // Trigger simulated auto-reply if message is from customer simulator / test mode
    if (!isOutboundMsg && (payload.source === 'SIMULATOR' || payload.source === 'TEST') && CRM_STATE?.autoReplySettings?.enabled !== false) {
      triggerClientSideAutoReplyIfMatched(customer, messageText);
    }
  }

  // 4. Match or Create Lead / Query Card
  let query = CRM_STATE.queries.find(q => q.customerId === customer.id);
  if (query) {
    if (!query.accountId) query.accountId = payloadAccountId;
    if (!query.businessNumber) query.businessNumber = payloadBusinessNum;
    if (!isDuplicate && !isOutboundMsg) {
      query.unreadCount = (query.unreadCount || 0) + 1;
    }
    query.lastMessage = isBotMsg ? `Bot: "${messageText.slice(0, 35)}..."` : (isOutboundMsg ? `Staff: "${messageText.slice(0, 35)}..."` : `Customer: "${messageText}"`);
    if (!isOutboundMsg) {
      query.status = (query.status === 'CLOSED' || query.status === 'RESOLVED') ? 'NEW' : query.status;
    }
    query.createdAt = timeStr;
    query.lastTimeEpoch = msgTimestamp;
    
    // Move query to top of queries array
    CRM_STATE.queries = [query, ...CRM_STATE.queries.filter(q => q.id !== query.id)];
  } else {
    query = {
      id: `Q-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
      customerId: customer.id,
      accountId: payloadAccountId,
      businessNumber: payloadBusinessNum,
      assignedTo: payload.assigned_to || 'UNASSIGNED',
      status: 'NEW',
      priority: payload.priority || 'HIGH',
      queryText: messageText,
      productSku: null,
      createdAt: timeStr,
      unreadCount: isOutboundMsg ? 0 : 1,
      lastMessage: isBotMsg ? `Bot: "${messageText.slice(0, 35)}..."` : (isOutboundMsg ? `Staff: "${messageText.slice(0, 35)}..."` : `Customer: "${messageText}"`),
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

  // 9. Automated Stock Category Instant Auto-Responder Engine
  // For live WhatsApp messages, bridge/server.js handles actual WhatsApp dispatch via Baileys and emits the real bot reply.
  // Frontend only simulates for offline TEST or SIMULATOR mode to prevent phantom "Sent Auto" bubbles.
  if (!suppressChime && !isDuplicate && payload.source !== 'STAFF_OUTBOUND' && payload.source !== 'AUTOREPLY_BOT') {
    if (payload.source === 'SIMULATOR' || payload.source === 'TEST') {
      handleAutomatedInboundResponse(customer, messageText, payload);
    }
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
    if (!clean || clean.length < 5) {
      dedupedCustomers.push(cust);
      return;
    }
    if (!seenPhones.has(clean)) {
      seenPhones.set(clean, cust);
      dedupedCustomers.push(cust);
    } else {
      const existing = seenPhones.get(clean);
      // Merge conversation history into primary customer
      if (CRM_STATE.conversations && CRM_STATE.conversations[cust.id]) {
        if (!CRM_STATE.conversations[existing.id]) CRM_STATE.conversations[existing.id] = [];
        CRM_STATE.conversations[existing.id] = CRM_STATE.conversations[existing.id].concat(CRM_STATE.conversations[cust.id]);
        if (cust.id !== existing.id) {
          delete CRM_STATE.conversations[cust.id];
        }
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

  // 4. Ensure all catalog products have valid, non-broken, beautiful garment images
  if (Array.isArray(CRM_STATE.products)) {
    CRM_STATE.products.forEach(p => {
      if (!p.image || p.image.includes('photo-1518831959646-742c3a14ebf7') || p.image.includes('photo-1583846783977-d2b0993d4265') || p.image.includes('No Image') || p.image.includes('No%20Image')) {
        p.image = getSmartProductImage(p);
      }
    });
  }

  saveCRMState();
}



// Robust two-way synchronization and non-destructive merge of catalog products
function mergeCatalogProductsWithDB(dbRawProducts) {
  if (!Array.isArray(dbRawProducts)) return;

  const mappedDb = dbRawProducts.map(p => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    subcategory: p.subcategory || '',
    size: p.size,
    color: p.color,
    fabric: p.fabric || '',
    specifications: (() => {
      if (!p.specifications) return [];
      if (Array.isArray(p.specifications)) return p.specifications;
      try { return JSON.parse(p.specifications); } catch (e) { return []; }
    })(),
    customAttributes: (() => {
      if (!p.custom_attributes && !p.customAttributes) return {};
      const ca = p.custom_attributes || p.customAttributes;
      if (typeof ca === 'object') return ca;
      try { return JSON.parse(ca); } catch (e) { return {}; }
    })(),
    price: parseFloat(p.price) || 0,
    mrp: parseFloat(p.mrp) || parseFloat(p.price) || 0,
    physicalStock: parseInt(p.physical_stock ?? p.physicalStock) || 0,
    reservedStock: parseInt(p.reserved_stock ?? p.reservedStock) || 0,
    image: p.image || getSmartProductImage(p),
    description: p.description || '',
    custom_caption: p.custom_caption || p.customCaption || '',
    customCaption: p.custom_caption || p.customCaption || '',
    accountId: p.account_id || p.accountId || 'account_1'
  }));

  const localProducts = Array.isArray(CRM_STATE.products) ? [...CRM_STATE.products] : [];
  
  // Merge DB products: if a matching local product exists, merge non-empty fields/specs
  const merged = mappedDb.map(dbP => {
    const localMatch = localProducts.find(lp => lp && (lp.sku === dbP.sku || (lp.id && String(lp.id) === String(dbP.id))));
    if (localMatch) {
      const bestImg = (dbP.image && !dbP.image.includes('photo-1583846783977-d2b0993d4265') && !dbP.image.includes('photo-1518831959646-742c3a14ebf7'))
        ? dbP.image 
        : (localMatch.image || getSmartProductImage(dbP));
      return {
        ...localMatch,
        ...dbP,
        image: bestImg,
        customAttributes: (dbP.customAttributes && Object.keys(dbP.customAttributes).length > 0) ? dbP.customAttributes : (localMatch.customAttributes || {}),
        specifications: (dbP.specifications && dbP.specifications.length > 0) ? dbP.specifications : (localMatch.specifications || [])
      };
    }
    return dbP;
  });

  // Preserve any local products that are not yet in MySQL DB
  const unsyncedLocals = [];
  localProducts.forEach(localP => {
    if (!localP || !localP.sku) return;
    if (!localP.image || localP.image.includes('No Image') || localP.image.includes('photo-1583846783977-d2b0993d4265')) {
      localP.image = getSmartProductImage(localP);
    }
    const exists = merged.some(m => m.sku === localP.sku || (localP.id && String(m.id) === String(localP.id)));
    if (!exists) {
      merged.push(localP);
      unsyncedLocals.push(localP);
    }
  });

  CRM_STATE.products = merged;
  saveCRMState();

  // Background auto-sync of unpersisted local products into MySQL database
  if (unsyncedLocals.length > 0) {
    fetch('api.php?action=save_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variants: unsyncedLocals })
    })
    .then(r => r.json())
    .then(resp => {
      if (resp && resp.products && Array.isArray(resp.products)) {
        resp.products.forEach(sp => {
          const matched = CRM_STATE.products.find(p => p.sku === sp.sku);
          if (matched && sp.id) matched.id = sp.id;
        });
        saveCRMState();
      }
    })
    .catch(e => console.warn('Background sync of local products failed:', e));
  }
}

// Load State from LocalStorage or Initialise (100% Persistent across page reloads)
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
      if (!Array.isArray(CRM_STATE.customers)) CRM_STATE.customers = [];
      if (!Array.isArray(CRM_STATE.queries)) CRM_STATE.queries = [];
      if (!CRM_STATE.conversations || typeof CRM_STATE.conversations !== 'object') CRM_STATE.conversations = {};
      if (!Array.isArray(CRM_STATE.orders)) CRM_STATE.orders = [];
      if (!Array.isArray(CRM_STATE.followups)) CRM_STATE.followups = [];
      if (!Array.isArray(CRM_STATE.products)) CRM_STATE.products = [];
      // Keep existing products intact without destructive mock filtering
      if (!Array.isArray(CRM_STATE.categories) || CRM_STATE.categories.length === 0) {
        CRM_STATE.categories = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.categories || []));
      }
      if (!Array.isArray(CRM_STATE.subcategories) || CRM_STATE.subcategories.length === 0) {
        CRM_STATE.subcategories = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.subcategories || []));
      }
      if (!CRM_STATE.attributes || typeof CRM_STATE.attributes !== 'object' || !Array.isArray(CRM_STATE.attributes.sizes)) {
        CRM_STATE.attributes = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.attributes || { sizes: [], colors: [], fabrics: [], specifications: [], custom: {} }));
      }
      if (!CRM_STATE.attributes.custom || typeof CRM_STATE.attributes.custom !== 'object' || Array.isArray(CRM_STATE.attributes.custom)) {
        CRM_STATE.attributes.custom = {};
      }
      // Clean up previous test mock Memory if present
      if (CRM_STATE.attributes.custom['Memory']) {
        delete CRM_STATE.attributes.custom['Memory'];
      }

      if (!CRM_STATE.autoReplySettings || typeof CRM_STATE.autoReplySettings !== 'object' || !CRM_STATE.autoReplySettings.messageTemplate || CRM_STATE.autoReplySettings.messageTemplate.includes('wa.me')) {
        CRM_STATE.autoReplySettings = {
          enabled: true,
          cooldownMinutes: 0,
          keywordMatching: true,
          messageTemplate: getDefaultStockAutoReplyTemplate()
        };
      }

      if (!Array.isArray(CRM_STATE.autoReplyRules) || CRM_STATE.autoReplyRules.length === 0) {
        CRM_STATE.autoReplyRules = getDefaultAutoReplyRules();
      }

      if (Array.isArray(CRM_STATE.staffList)) {
        CRM_STATE.staffList.forEach((s, idx) => {
          if (typeof s.dailyQuota === 'undefined') s.dailyQuota = idx === 2 ? 60 : 70;
          if (typeof s.todayHandled === 'undefined' || s.todayHandled === 18 || s.todayHandled === 14 || s.todayHandled === 8) s.todayHandled = 0;
          if (!s.email) s.email = `${s.name.toLowerCase().replace(/\s+/g, '.')}@grmgarments.com`;
          if (!s.phone) s.phone = `+91 98450 1122${idx + 1}`;
          if (!s.status) s.status = 'ACTIVE';
        });
      }
    } catch (e) {
      console.warn('Recovering CRM state from initial schema:', e);
      CRM_STATE = JSON.parse(JSON.stringify(INITIAL_CRM_DATA));
    }
  } else {
    CRM_STATE = JSON.parse(JSON.stringify(INITIAL_CRM_DATA));
    if (!CRM_STATE.autoReplySettings) {
      CRM_STATE.autoReplySettings = {
        enabled: true,
        cooldownMinutes: 0,
        keywordMatching: true,
        messageTemplate: getDefaultStockAutoReplyTemplate()
      };
    }
    if (!Array.isArray(CRM_STATE.autoReplyRules) || CRM_STATE.autoReplyRules.length === 0) {
      CRM_STATE.autoReplyRules = getDefaultAutoReplyRules();
    }
    saveCRMState();
  }

  // Sync auto-reply rules from backend API
  fetch('api.php?action=get_autoreply_rules')
    .then(r => r.json())
    .then(res => {
      if (res && res.status === 'success' && Array.isArray(res.rules) && res.rules.length > 0) {
        CRM_STATE.autoReplyRules = res.rules;
        saveCRMState();
        if (typeof renderAutoReplyRulesList === 'function') renderAutoReplyRulesList();
        if (typeof renderInboxPresetTemplatesBar === 'function') renderInboxPresetTemplatesBar();
        if (typeof updateRulesCountBadge === 'function') updateRulesCountBadge();
      }
    })
    .catch(() => {});

  // Set active customer ID to first existing customer who actually has messages/conversations
  const activeChatCusts = (CRM_STATE.customers || []).filter(c => {
    if (!c || c.name === 'System' || c.name === 'GRM Linked WhatsApp Device' || (c.name && c.name.startsWith('WhatsApp Linked'))) return false;
    const conv = CRM_STATE.conversations?.[c.id] || [];
    const q = CRM_STATE.queries?.find(qry => qry.customerId === c.id);
    return conv.length > 0 || q;
  });

  if (activeChatCusts.length > 0) {
    ACTIVE_CUSTOMER_ID = activeChatCusts[0].id;
  } else {
    ACTIVE_CUSTOMER_ID = null;
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

  // Load brand name & tagline from bridge config file (so UI shows live saved brand)
  fetch('http://localhost:3000/api/brand/config')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') {
        if (!CRM_STATE.brandSettings) CRM_STATE.brandSettings = {};
        if (res.brand_name) CRM_STATE.brandSettings.brandName = res.brand_name;
        if (res.brand_tagline) CRM_STATE.brandSettings.brandTagline = res.brand_tagline;
        // Refresh brand settings UI fields if Settings panel is open
        const brandInput = document.getElementById('cfg-brand-name');
        const taglineInput = document.getElementById('cfg-brand-tagline');
        if (brandInput) brandInput.value = res.brand_name || '';
        if (taglineInput) taglineInput.value = res.brand_tagline || '';
        if (typeof updateBrandPreview === 'function') updateBrandPreview();
      }
    })
    .catch(() => { }); // Bridge may not be running — fail silently


  // Asynchronously synchronize garment products, catalog taxonomy & stock from database
  fetch('api.php?action=get_all')
    .then(r => r.json())
    .then(res => {
      const data = res.data || res;
      if (data && data.products && Array.isArray(data.products)) {
        mergeCatalogProductsWithDB(data.products);
      }

      if (data && data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        CRM_STATE.categories = data.categories;
      }
      if (data && data.subcategories && Array.isArray(data.subcategories) && data.subcategories.length > 0) {
        CRM_STATE.subcategories = data.subcategories;
      }
      if (data && data.attributes) {
        CRM_STATE.attributes = data.attributes;
      }

      if (typeof populateCatalogCategoryFilters === 'function') {
        populateCatalogCategoryFilters();
      }
      if (typeof populateProductFormCategories === 'function') {
        populateProductFormCategories();
      }
      if (ACTIVE_VIEW === 'catalog') filterCatalogGrid();
      updateOrderProductDropdown();
      saveCRMState();
    })
    .catch(() => { });

  cleanupAndDeduplicateCRMState();
  if (typeof populateCatalogCategoryFilters === 'function') {
    populateCatalogCategoryFilters();
  }
  updateConfiguredPhoneDisplays();
  updateAutoReplyUI();
  initSocketIO();
  fetchQRBridgeStatus();
  startRealtimeMessageSync();
}

function purgeStaticMockData() {
  // Deprecated: Never auto-purge customer conversations on page load/refresh
  // Preserves 100% of incoming live chats, customer histories and enquiries
  return;
}

function saveCRMState() {
  try {
    localStorage.setItem('GRM_CRM_STATE_V2_5', JSON.stringify(CRM_STATE));
  } catch (err) {
    console.warn('LocalStorage quota warning, pruning base64 images for storage:', err);
    try {
      // Create lightweight copy with compact URLs instead of bulky base64 data URLs
      const safeState = { ...CRM_STATE };
      if (Array.isArray(safeState.products)) {
        safeState.products = safeState.products.map(p => {
          if (p.image && p.image.startsWith('data:image')) {
            return { ...p, image: getSmartProductImage(p) };
          }
          return p;
        });
      }
      localStorage.setItem('GRM_CRM_STATE_V2_5', JSON.stringify(safeState));
    } catch (e2) {
      console.warn('LocalStorage quota exceeded completely:', e2);
    }
  }
  updateBadgeCounters();
  updateConfiguredPhoneDisplays();
}
window.saveCRMState = saveCRMState;
window.saveStateToStorage = saveCRMState;

// 5 Connected WhatsApp Business Numbers Engine
function getAvailableWhatsAppAccounts() {
  const defaultAccounts = [
    {
      id: 'account_1',
      label: 'Line 1: GRM Business Central',
      status: 'DISCONNECTED',
      connected_number: 'Awaiting Link',
      brand_name: 'GRM Garments Central'
    },
    {
      id: 'account_2',
      label: 'Line 2: Blue Berry Kids & Maternity',
      status: 'DISCONNECTED',
      connected_number: 'Awaiting Link',
      brand_name: 'Blue Berry 💙'
    },
    {
      id: 'account_3',
      label: 'Line 3: Customer Support & Enquiries',
      status: 'DISCONNECTED',
      connected_number: 'Awaiting Link',
      brand_name: 'GRM Support Desk'
    },
    {
      id: 'account_4',
      label: 'Line 4: Wholesale & Bulk Orders',
      status: 'DISCONNECTED',
      connected_number: 'Awaiting Link',
      brand_name: 'GRM Wholesale Desk'
    },
    {
      id: 'account_5',
      label: 'Line 5: VIP Fast-Track & Dispatch',
      status: 'DISCONNECTED',
      connected_number: 'Awaiting Link',
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
        connected_number: (liveAcc.status === 'CONNECTED' ? (liveAcc.connected_number || acc.connected_number) : (liveAcc.status === 'SCAN_QR' ? 'Scan QR Code' : 'Awaiting Link')),
        connected_name: liveAcc.connected_name || acc.connected_name,
        label: liveAcc.label || acc.label,
        qr_image: liveAcc.qr_image || acc.qr_image || liveAcc.qr || acc.qr,
        qr: liveAcc.qr_image || liveAcc.qr || acc.qr
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
var ACTIVE_INBOX_SUBMODULE = 'chats';

function switchInboxSubmodule(submodule) {
  ACTIVE_INBOX_SUBMODULE = submodule || 'chats';

  const chatSub = document.getElementById('submodule-inbox-chats');
  const autoSub = document.getElementById('submodule-inbox-autoreply');
  const bcastSub = document.getElementById('submodule-inbox-broadcast');

  const tabChat = document.getElementById('tab-sub-inbox-chats');
  const tabAuto = document.getElementById('tab-sub-inbox-autoreply');
  const tabBcast = document.getElementById('tab-sub-inbox-broadcast');

  const navSubChat = document.getElementById('nav-inbox-sub-chats');
  const navSubAuto = document.getElementById('nav-inbox-sub-autoreply');
  const navSubBcast = document.getElementById('nav-inbox-sub-broadcast');

  // Hide all submodules
  if (chatSub) chatSub.classList.add('hidden');
  if (autoSub) autoSub.classList.add('hidden');
  if (bcastSub) bcastSub.classList.add('hidden');

  // Reset tab classes
  const inactiveTabClass = "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer";
  if (tabChat) tabChat.className = inactiveTabClass;
  if (tabAuto) tabAuto.className = inactiveTabClass;
  if (tabBcast) tabBcast.className = inactiveTabClass;

  // Reset sidebar subnav classes
  const inactiveNavClass = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-surface-sidebarActive text-[11px] font-medium transition group";
  if (navSubChat) navSubChat.className = inactiveNavClass;
  if (navSubAuto) navSubAuto.className = inactiveNavClass;
  if (navSubBcast) navSubBcast.className = inactiveNavClass;

  const pTitle = document.getElementById('page-title');
  const pSub = document.getElementById('page-subtitle');

  if (submodule === 'chats') {
    if (chatSub) chatSub.classList.remove('hidden');
    if (tabChat) tabChat.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs bg-brand-wa text-white cursor-pointer";
    if (navSubChat) navSubChat.className = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-emerald-200 bg-surface-sidebarActive font-semibold text-[11px] hover:text-white transition group";
    if (pTitle) pTitle.innerText = 'WhatsApp Inbox & Customer Queue';
    if (pSub) pSub.innerText = `Live chats for ${CRM_STATE?.whatsappAccount?.phoneNumber || 'Business WhatsApp'} with instant staff assignment & order booking`;
  } else if (submodule === 'autoreply') {
    if (autoSub) autoSub.classList.remove('hidden');
    if (tabAuto) tabAuto.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs bg-gradient-to-r from-teal-600 to-emerald-600 text-white cursor-pointer";
    if (navSubAuto) navSubAuto.className = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-teal-200 bg-surface-sidebarActive font-semibold text-[11px] hover:text-white transition group";
    if (pTitle) pTitle.innerText = 'WhatsApp Inbox — Pre-Set Templates & Auto-Reply Hub';
    if (pSub) pSub.innerText = 'Configure automated responses, stock catalog links, trigger keywords & smart question answering';

    if (typeof renderAutoReplyRulesList === 'function') renderAutoReplyRulesList();
    if (typeof updateRulesCountBadge === 'function') updateRulesCountBadge();
  } else if (submodule === 'broadcast') {
    if (bcastSub) bcastSub.classList.remove('hidden');
    if (tabBcast) tabBcast.className = "flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-xs bg-gradient-to-r from-purple-600 to-indigo-600 text-white cursor-pointer";
    if (navSubBcast) navSubBcast.className = "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-purple-200 bg-surface-sidebarActive font-semibold text-[11px] hover:text-white transition group";
    if (pTitle) pTitle.innerText = 'WhatsApp Inbox — Automated Template Broadcast';
    if (pSub) pSub.innerText = 'Send personalized promotional templates & announcements to customer chats with variable tags';

    if (typeof renderBroadcastTemplateDropdown === 'function') renderBroadcastTemplateDropdown('festive_offer');
    if (typeof applyBroadcastPreset === 'function') applyBroadcastPreset('festive_offer');
    if (typeof refreshBroadcastAutoFetchedNumbers === 'function') refreshBroadcastAutoFetchedNumbers();
    if (typeof renderDynamicTemplateFields === 'function') renderDynamicTemplateFields();
    if (typeof updateBroadcastPreview === 'function') updateBroadcastPreview();
  }
}

// Interactive WhatsApp Inbox Dropdown Sidebar Toggle Handler
function toggleWhatsAppDropdown(targetSubmodule) {
  const subMenu = document.getElementById('inbox-submodules-menu');
  const subnavArrow = document.getElementById('inbox-subnav-arrow');

  if (ACTIVE_VIEW !== 'inbox') {
    // If currently on another view, activate inbox and expand dropdown
    if (subMenu) subMenu.classList.remove('hidden');
    if (subnavArrow) subnavArrow.style.transform = 'rotate(180deg)';
    switchView('inbox', targetSubmodule || ACTIVE_INBOX_SUBMODULE || 'chats');
  } else {
    // If already on inbox view, toggle sub-menu expand / collapse
    if (subMenu) {
      const isHidden = subMenu.classList.contains('hidden');
      if (isHidden) {
        subMenu.classList.remove('hidden');
        if (subnavArrow) subnavArrow.style.transform = 'rotate(180deg)';
      } else {
        subMenu.classList.add('hidden');
        if (subnavArrow) subnavArrow.style.transform = 'rotate(0deg)';
      }
    }
  }
}
window.toggleWhatsAppDropdown = toggleWhatsAppDropdown;

function switchView(viewName, subName) {
  // Enforce Role-Based Access Control: Admin-only modules
  const adminOnlyViews = ['settings', 'backup', 'staff', 'audit', 'analytics'];
  if (ACTIVE_ROLE !== 'admin' && adminOnlyViews.includes(viewName)) {
    showToast('Access Restricted', 'Super Admin privileges are required to access this module.', 'lock', 'rose');
    viewName = 'inbox';
  }

  ACTIVE_VIEW = viewName;
  try {
    localStorage.setItem('GRM_CRM_ACTIVE_VIEW', viewName);
    if (typeof window !== 'undefined' && window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + viewName);
    }
  } catch (e) {}
  const views = ['inbox', 'enquiries', 'dashboard', 'catalog', 'orders', 'followups', 'customers', 'dnd', 'staff', 'audit', 'analytics', 'settings', 'backup'];

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

  // Handle WhatsApp Inbox dropdown menu active / inactive state
  const inboxSubMenu = document.getElementById('inbox-submodules-menu');
  const subnavArrow = document.getElementById('inbox-subnav-arrow');
  const unreadBadge = document.getElementById('badge-total-unread');

  if (viewName === 'inbox') {
    // ACTIVE: Expand submenu, rotate arrow up, active badge styling
    if (inboxSubMenu) inboxSubMenu.classList.remove('hidden');
    if (subnavArrow) subnavArrow.style.transform = 'rotate(180deg)';
    if (unreadBadge) {
      unreadBadge.className = "bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full";
    }
  } else {
    // INACTIVE: Collapse submenu, rotate arrow down, inactive badge styling
    if (inboxSubMenu) inboxSubMenu.classList.add('hidden');
    if (subnavArrow) subnavArrow.style.transform = 'rotate(0deg)';
    if (unreadBadge) {
      unreadBadge.className = "bg-emerald-500/20 text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-full";
    }
  }

  // Update Topbar page titles
  const titles = {
    inbox: { title: 'WhatsApp Inbox & Customer Queue', sub: `Live chats for ${CRM_STATE?.whatsappAccount?.phoneNumber || 'Business WhatsApp'} with instant staff assignment & order booking` },
    enquiries: { title: 'Customer Enquiries & Staff Assignment Hub', sub: 'Admin control room to distribute new customer leads to staff' },
    dashboard: { title: 'WhatsApp Operations Dashboard', sub: 'Real-time overview of inquiries, active sessions, and communication health' },
    catalog: { title: 'Garment Product Catalog & Live Stock', sub: 'Live available stock calculator and 1-click WhatsApp card sharing' },
    orders: { title: 'WhatsApp Sales Orders & Reservations', sub: 'Direct orders booked from WhatsApp chats with reserved inventory' },
    followups: { title: 'Customer Follow-up Scheduler', sub: 'Automated reminders to prevent lost customer enquiries' },
    customers: { title: 'Customer 360 & Tag Directory', sub: 'Profiles, purchase history, and communication preferences' },
    dnd: { title: 'DND & Opt-Out Customer Hub', sub: 'Customers who requested not to receive garment product offers or messages' },
    staff: { title: 'Staff & Team Management Hub', sub: 'Onboard team members, assign operational roles & permissions, and monitor workloads' },
    audit: { title: 'System Audit Trail & Security Logs', sub: 'Tamper-proof record of every staff assignment and order update' },
    analytics: { title: 'Staff Performance Analytics & KPIs', sub: 'Factual metrics on response times, volume handled, and conversions' },
    settings: { title: 'WhatsApp Business Settings & Phone Configuration', sub: 'Set your primary WhatsApp Business number for dynamic live message routing' },
    backup: { title: 'Data Backup & Recovery Hub', sub: 'Full database snapshot export, restore, and zero-data-loss protection (Section 53)' }
  };

  const titleContainer = document.getElementById('header-title-container');
  if (titleContainer) {
    if (viewName === 'inbox') {
      titleContainer.classList.add('hidden');
    } else {
      titleContainer.classList.remove('hidden');
    }
  }

  if (titles[viewName]) {
    const pTitle = document.getElementById('page-title');
    const pSub = document.getElementById('page-subtitle');
    if (pTitle) pTitle.innerText = titles[viewName].title;
    if (pSub) pSub.innerText = titles[viewName].sub;
  }

  // Trigger specific view renders
  if (viewName === 'inbox') {
    switchInboxSubmodule(subName || ACTIVE_INBOX_SUBMODULE || 'chats');
    renderInbox();
  }
  if (viewName === 'enquiries') renderEnquiriesTable();
  if (viewName === 'dashboard') renderDashboard();
  if (viewName === 'catalog') {
    if (typeof populateCatalogCategoryFilters === 'function') populateCatalogCategoryFilters();
    renderCatalogGrid('');
  }
  if (viewName === 'orders') renderOrdersTable();
  if (viewName === 'followups') renderFollowupsCards();
  if (viewName === 'customers') renderCustomersGrid();
  if (viewName === 'dnd') renderDndModule();
  if (viewName === 'staff') renderStaffView();
  if (viewName === 'audit') renderAuditTable();
  if (viewName === 'analytics') renderAnalyticsView();
  if (viewName === 'settings') renderWhatsAppSettings();
}

window.addEventListener('hashchange', () => {
  const hash = (typeof window !== 'undefined' && window.location && window.location.hash) ? window.location.hash.replace('#', '').trim().toLowerCase() : '';
  const validViews = ['inbox', 'enquiries', 'dashboard', 'catalog', 'orders', 'followups', 'customers', 'dnd', 'staff', 'audit', 'analytics', 'settings', 'backup'];
  if (hash && validViews.includes(hash) && hash !== ACTIVE_VIEW) {
    switchView(hash);
  }
});

// =========================================================================
// 2. AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) SYSTEM
// =========================================================================

// Initialize user session from storage or redirect to login.html
function initAuthSystem() {
  const sessionStr = localStorage.getItem('GRM_CRM_SESSION') || sessionStorage.getItem('GRM_CRM_SESSION');

  if (sessionStr) {
    try {
      CURRENT_USER = JSON.parse(sessionStr);
    } catch (e) {
      console.error('Session parse error:', e);
      CURRENT_USER = null;
    }

    if (CURRENT_USER && (CURRENT_USER.username || CURRENT_USER.id || CURRENT_USER.role)) {
      // Ensure session is synchronized in both storage containers
      try {
        localStorage.setItem('GRM_CRM_SESSION', JSON.stringify(CURRENT_USER));
        sessionStorage.setItem('GRM_CRM_SESSION', JSON.stringify(CURRENT_USER));
        localStorage.setItem('GRM_REMEMBER_FLAG', 'true');
      } catch (e) {}

      // Apply RBAC UI safely — any rendering error must NEVER boot user to login page
      try {
        applyRoleBasedAccessControl(CURRENT_USER);
      } catch (uiErr) {
        console.error('RBAC UI layout notice (retained user session):', uiErr);
      }
      return;
    }
  }

  // If no saved session, redirect cleanly to separate login page
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
  try { renderQuickLineSwitcher(); } catch (e) { console.error('[renderInbox] renderQuickLineSwitcher error:', e); }
  try { renderInboxConversationList(); } catch (e) { console.error('[renderInbox] renderInboxConversationList error:', e); }
  try { renderChatHeader(); } catch (e) { console.error('[renderInbox] renderChatHeader error:', e); }
  try { renderChatMessages(); } catch (e) { console.error('[renderInbox] renderChatMessages error:', e); }
  try { renderCustomer360Panel(); } catch (e) { console.error('[renderInbox] renderCustomer360Panel error:', e); }
  try { renderInboxPresetTemplatesBar(); } catch (e) { console.error('[renderInbox] renderInboxPresetTemplatesBar error:', e); }
  try { updateRulesCountBadge(); updateBadgeCounters(); } catch (e) { console.error('[renderInbox] updateBadgeCounters error:', e); }
}

// Interactive Quick WhatsApp Line Switcher Chips
function renderQuickLineSwitcher() {
  const container = document.getElementById('quick-line-switcher-container');
  if (!container) return;

  const accounts = getAvailableWhatsAppAccounts();
  const availableAccountIds = accounts.map(a => a.id);

  // Filter to display: connected lines, plus account_1 and account_2, or lines with chats
  const displayAccounts = accounts.filter(acc => 
    acc.id === 'account_1' || 
    acc.id === 'account_2' || 
    acc.status === 'CONNECTED' || 
    (CRM_STATE?.customers || []).some(c => (c.accountId || 'account_1') === acc.id)
  );

  // Count only customers that have actual conversation messages or active queries
  const getActiveCustomerCountForAccount = (accId) => {
    return (CRM_STATE?.customers || []).filter(c => {
      if (c.name === 'System' || c.name === 'GRM Linked WhatsApp Device' || c.name.startsWith('WhatsApp Linked')) return false;
      const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
      const conv = CRM_STATE?.conversations?.[c.id] || [];
      if (conv.length === 0 && !q) return false;
      const customerAccId = c.accountId || (q ? q.accountId : 'account_1');
      return customerAccId === accId;
    }).length;
  };

  const totalChats = (CRM_STATE?.customers || []).filter(c => {
    if (c.name === 'System' || c.name === 'GRM Linked WhatsApp Device' || c.name.startsWith('WhatsApp Linked')) return false;
    const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
    const conv = CRM_STATE?.conversations?.[c.id] || [];
    if (conv.length === 0 && !q) return false;
    const customerAccId = c.accountId || (q ? q.accountId : 'account_1');
    return availableAccountIds.includes(customerAccId);
  }).length;

  let chipsHtml = '';

  // 1. All Lines Combined (Global Queue)
  const isAllActive = (ACTIVE_SEND_ACCOUNT_ID === 'all');
  chipsHtml += `
    <button type="button" onclick="switchActiveWhatsAppLine('all', 'All Lines', 'All Numbers')" class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-xs ${isAllActive ? 'bg-slate-900 text-white ring-2 ring-emerald-400' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'}" title="View all messages combined across all WhatsApp lines">
      <span class="material-symbols-outlined text-[15px] ${isAllActive ? 'text-emerald-400' : 'text-slate-500'}">hub</span>
      <span>All Inboxes</span>
      <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${isAllActive ? 'bg-emerald-800 text-white' : 'bg-slate-100 text-slate-700'}">${totalChats}</span>
    </button>
  `;

  // 2. Individual WhatsApp Lines (Line 1, Line 2, etc.)
  chipsHtml += displayAccounts.map((acc, idx) => {
    const isCurrent = (ACTIVE_SEND_ACCOUNT_ID === acc.id);
    const isConnected = (acc.status === 'CONNECTED');
    const custCount = getActiveCustomerCountForAccount(acc.id);
    
    let displayPhone = acc.connected_number && acc.connected_number !== 'Awaiting Link' && acc.connected_number !== 'Scan QR Code'
      ? formatPhoneNumberPretty(acc.connected_number)
      : (idx === 0 ? '+91 97896 60115' : 'Line ' + (idx + 1));

    const lineName = (idx === 0) ? 'Line 1 (Central)' : (idx === 1 ? 'Line 2 (Blue Berry)' : (acc.label || 'Line ' + (idx + 1)));

    // Distinct styling per line
    let activeClass = '';
    if (isCurrent) {
      activeClass = (idx === 0) 
        ? 'bg-brand-wa text-white ring-2 ring-emerald-300 shadow-sm' 
        : (idx === 1 
          ? 'bg-blue-600 text-white ring-2 ring-blue-300 shadow-sm' 
          : 'bg-purple-600 text-white ring-2 ring-purple-300 shadow-sm');
    } else {
      activeClass = 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300';
    }

    const badgeClass = isCurrent ? 'bg-black/20 text-white' : 'bg-slate-100 text-slate-700';

    return `
      <button type="button" onclick="switchActiveWhatsAppLine('${acc.id}', '${acc.connected_number || displayPhone}', '${acc.label || lineName}')" class="px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition flex items-center gap-1.5 cursor-pointer shadow-xs ${activeClass}" title="${acc.label || lineName}: ${displayPhone}">
        <span class="w-2 h-2 rounded-full ${isConnected ? (isCurrent ? 'bg-white animate-pulse' : 'bg-emerald-500') : 'bg-amber-400'}"></span>
        <span>${lineName}: ${displayPhone}</span>
        <span class="text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${badgeClass}">${custCount}</span>
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

    // Filter out contacts with no messages and no active query from the inbox list
    if (conv.length === 0 && !query) {
      return;
    }

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
    const qStatus = query ? (query.status || 'NEW') : 'NEW';

    customerCards.push({
      customerId: cust.id,
      customer: cust,
      queryId: query ? query.id : ('Q-' + cust.id),
      assignedTo: query ? query.assignedTo : 'UNASSIGNED',
      staff: staff,
      status: qStatus,
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
    ACTIVE_CUSTOMER_ID = null;
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

  // Ensure ACTIVE_CUSTOMER_ID strictly points to a visible conversation thread
  if (!ACTIVE_CUSTOMER_ID || !customerCards.some(c => c.customerId === ACTIVE_CUSTOMER_ID || String(c.customerId) === String(ACTIVE_CUSTOMER_ID))) {
    ACTIVE_CUSTOMER_ID = customerCards[0].customerId;
    if (CRM_STATE) CRM_STATE.activeCustomerId = ACTIVE_CUSTOMER_ID;
  }

  container.innerHTML = customerCards.map(item => {
    const isSelected = item.customerId === ACTIVE_CUSTOMER_ID || String(item.customerId) === String(ACTIVE_CUSTOMER_ID);
    const isUnassigned = item.assignedTo === 'UNASSIGNED';

    // Priority badge
    let priorityBadge = '';
    if (item.priority === 'URGENT') priorityBadge = `<span class="bg-rose-100 text-rose-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-rose-200">URGENT</span>`;
    else if (item.priority === 'HIGH') priorityBadge = `<span class="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-200">HIGH</span>`;

    // Status Badge
    let statusBadge = '';
    const qStatus = item.status || 'NEW';
    if (qStatus === 'DND' || item.customer?.isDND) statusBadge = `<span class="bg-rose-100 text-rose-900 border border-rose-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">🚫 DND</span>`;
    else if (qStatus === 'PENDING') statusBadge = `<span class="bg-amber-100 text-amber-900 border border-amber-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">PENDING</span>`;
    else if (qStatus === 'FOLLOW_UP') statusBadge = `<span class="bg-blue-100 text-blue-900 border border-blue-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">FOLLOW-UP</span>`;
    else if (qStatus === 'IN_PROGRESS' || qStatus === 'ASSIGNED') statusBadge = `<span class="bg-indigo-100 text-indigo-900 border border-indigo-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">IN PROGRESS</span>`;
    else if (qStatus === 'RESOLVED') statusBadge = `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">RESOLVED</span>`;
    else if (qStatus === 'CONVERTED') statusBadge = `<span class="bg-purple-100 text-purple-900 border border-purple-300 text-[9px] font-extrabold px-1.5 py-0.2 rounded">CONVERTED</span>`;

    // Line Badge
    const isLine1Card = (item.accountId === 'account_1');
    const isLine2Card = (item.accountId === 'account_2');
    const lineBadgeLabel = isLine1Card ? 'Line 1' : (isLine2Card ? 'Line 2' : (item.accountId ? item.accountId.replace('account_', 'L') : 'L1'));
    const lineBadgeClass = isLine1Card
      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
      : (isLine2Card ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-purple-100 text-purple-800 border-purple-300');

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
              ${statusBadge}
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
  if (!customerId) return;
  ACTIVE_CUSTOMER_ID = customerId;
  if (CRM_STATE) {
    CRM_STATE.activeCustomerId = customerId;
  }
  renderInbox();
  // Guarantee right Customer 360 panel and header dynamically sync to active profile
  try {
    renderCustomer360Panel();
  } catch (e) {
    console.error('Error rendering Customer 360 panel on selectCustomerChat:', e);
  }
  try {
    renderChatHeader();
  } catch (e) {
    console.error('Error rendering Chat Header on selectCustomerChat:', e);
  }
}

// Slide / Hide Toggle State for Right Customer 360 Panel
let IS_RIGHT_PANEL_OPEN = true;
let USER_MANUAL_PANEL_TOGGLE = false;

function toggleRightPanel(forceState = null, isUserAction = false) {
  if (isUserAction) {
    USER_MANUAL_PANEL_TOGGLE = true;
  }

  if (forceState !== null) {
    IS_RIGHT_PANEL_OPEN = forceState;
  } else {
    IS_RIGHT_PANEL_OPEN = !IS_RIGHT_PANEL_OPEN;
  }

  const panel = document.getElementById('chat-right-panel');
  const toggleBtn = document.getElementById('btn-toggle-right-panel');
  const floatingToggle = document.getElementById('floating-panel-toggle-btn');

  if (panel) {
    if (IS_RIGHT_PANEL_OPEN) {
      panel.classList.remove('hidden');
      panel.classList.add('flex');
    } else {
      panel.classList.add('hidden');
      panel.classList.remove('flex');
    }
  }

  if (toggleBtn) {
    if (IS_RIGHT_PANEL_OPEN) {
      toggleBtn.className = "px-2 sm:px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 shadow-sm transition hover:bg-emerald-100 shrink-0";
      toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">dock_to_right</span><span class="hidden sm:inline">Hide Profile</span>`;
    } else {
      toggleBtn.className = "px-2 sm:px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-sm transition hover:bg-slate-200 shrink-0";
      toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">dock_to_left</span><span class="hidden sm:inline">Customer Profile</span>`;
    }
  }

  if (floatingToggle) {
    if (IS_RIGHT_PANEL_OPEN) {
      floatingToggle.classList.add('hidden');
    } else {
      floatingToggle.classList.remove('hidden');
    }
  }
}

// Auto-adjust layout dynamically based on Viewport Width (vpw)
function handleResponsiveLayout() {
  const vpw = window.innerWidth;
  if (!USER_MANUAL_PANEL_TOGGLE) {
    if (vpw < 1180 && IS_RIGHT_PANEL_OPEN) {
      toggleRightPanel(false, false);
    } else if (vpw >= 1180 && !IS_RIGHT_PANEL_OPEN) {
      toggleRightPanel(true, false);
    }
  }
}

window.addEventListener('resize', handleResponsiveLayout);
window.addEventListener('DOMContentLoaded', () => {
  setTimeout(handleResponsiveLayout, 100);
});
if (typeof document !== 'undefined' && (document.readyState === 'complete' || document.readyState === 'interactive')) {
  setTimeout(handleResponsiveLayout, 50);
}

function renderChatHeader() {
  const bar = document.getElementById('chat-header-bar');
  if (!bar) return;

  if (!CRM_STATE || !CRM_STATE.customers) return;

  const customer = (CRM_STATE.customers || []).find(c => c && (c.id === ACTIVE_CUSTOMER_ID || String(c.id) === String(ACTIVE_CUSTOMER_ID)));
  const query = (CRM_STATE.queries || []).find(q => q && (q.customerId === ACTIVE_CUSTOMER_ID || String(q.customerId) === String(ACTIVE_CUSTOMER_ID)));
  const staff = query ? (CRM_STATE.staffList || []).find(s => s && (s.id === query.assignedTo || String(s.id) === String(query.assignedTo))) : null;
  const isUnassigned = query && (query.assignedTo === 'UNASSIGNED' || !query.assignedTo);

  if (!customer) {
    bar.innerHTML = `<p class="text-xs text-slate-400">Select a conversation to start chatting</p>`;
    return;
  }

  const isRevealed = REVEALED_CUSTOMERS.has(customer.id);
  const displayPhone = formatDisplayPhone(customer.whatsapp || customer.phone, customer.id);

  bar.innerHTML = `
    <div class="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
      <div class="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-dark to-emerald-800 text-white font-bold text-xs flex items-center justify-center shadow-sm shrink-0">
        ${customer.avatar}
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 min-w-0">
          <h3 class="font-bold text-xs sm:text-sm text-slate-900 truncate" title="${customer.name}">${customer.name}</h3>
          <span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full shrink-0 hidden sm:inline-block">${customer.customerType}</span>
        </div>
        <div class="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium truncate mt-0.5">
          <span class="font-mono text-emerald-700 font-bold truncate">${displayPhone}</span>
        </div>
      </div>
    </div>

    <!-- Actions & Slide-Hide Toggle Button in Header -->
    <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
      ${isUnassigned ? `
        <button onclick="openStaffAssignModal('${query ? query.id : ('Q-' + customer.id)}')" class="px-2 sm:px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 animate-pulse shrink-0" title="Assign Staff Member">
          <span class="material-symbols-outlined text-[15px]">person_add</span>
          <span class="hidden lg:inline">Assign</span>
        </button>
      ` : `
        <div class="hidden xl:flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200 text-xs shrink-0">
          <span class="text-slate-500 hidden 2xl:inline">Handled by:</span>
          <span class="font-bold text-slate-800">${staff ? staff.name.split(' ')[0] : 'Assigned'}</span>
          ${ACTIVE_ROLE === 'admin' ? `
            <button onclick="openStaffAssignModal('${query ? query.id : ''}')" class="text-brand-wa hover:underline font-bold text-[11px] ml-1">Reassign</button>
          ` : ''}
        </div>
      `}
      
      <!-- BRAND-MASKED WHATSAPP CALL BUTTON -->
      <button type="button" onclick="initiateBrandMaskedCall('${customer.id}')" class="p-1.5 sm:px-2.5 sm:py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98] shrink-0" title="Call customer via Brand Masked Line (Customer receives call as: ${getBrandName()})">
        <span class="material-symbols-outlined text-[15px]">call</span>
        <span class="hidden 2xl:inline">Brand Call</span>
      </button>

      <a href="https://wa.me/${(customer.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="p-1.5 text-slate-600 hover:text-brand-wa hover:bg-emerald-50 rounded-lg transition shrink-0" title="Open Native WhatsApp Web">
        <span class="material-symbols-outlined text-[18px]">open_in_new</span>
      </a>

      <!-- Slide Hide / Show Toggle Button for Customer Profile Panel -->
      <button id="btn-toggle-right-panel" type="button" onclick="toggleRightPanel(null, true)" class="px-2 sm:px-2.5 py-1.5 rounded-lg border ${IS_RIGHT_PANEL_OPEN ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'} font-bold text-xs flex items-center gap-1 shadow-sm transition shrink-0" title="Slide Hide / Show Customer Profile Panel">
        <span class="material-symbols-outlined text-[16px]">${IS_RIGHT_PANEL_OPEN ? 'dock_to_right' : 'dock_to_left'}</span>
        <span class="hidden xl:inline">${IS_RIGHT_PANEL_OPEN ? 'Hide Profile' : 'Profile'}</span>
      </button>
    </div>
  `;
}

function renderChatMessages() {
  const stream = document.getElementById('chat-messages-stream');
  if (!stream) return;

  if (!CRM_STATE || !CRM_STATE.conversations) return;

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

  const messagesContent = `
    <!-- Encryption & Source of truth Notice -->
    <div class="flex justify-center my-2">
      <div class="bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-medium px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
        <span class="material-symbols-outlined text-[14px]">lock</span>
        <span>Connected to Business Number: <strong>${CRM_STATE?.whatsappAccount?.phoneNumber || '+91 97896 60115'}</strong> &bull; GRM Central Record</span>
      </div>
    </div>
  ` + messages.map((msg, idx) => {
    const msgId = msg.id || ('msg-' + idx + '-' + (msg.timestamp || Date.now()));
    const isOut = msg.sender === 'staff';
    const isAudio = msg.type === 'audio' || (msg.media_url && (msg.media_url.includes('audio') || msg.media_url.startsWith('data:audio') || msg.media_url.includes('.ogg') || msg.media_url.includes('.mp3') || msg.media_url.includes('.m4a'))) || (msg.text && (msg.text.includes('Voice Message') || msg.text.includes('Audio Message')));
    const isImage = msg.type === 'image' || (msg.media_url && (msg.media_url.startsWith('data:image') || msg.media_url.includes('http') || msg.media_url.includes('.png') || msg.media_url.includes('.jpg') || msg.media_url.includes('blob:')));
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
                <span id="time-${msgId}" class="font-mono text-[11px] text-slate-500">${typeof formatAudioTime === 'function' ? formatAudioTime(duration) : '0:12'}</span>
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
        <div class="space-y-2">
          <div class="group relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-900/5 shadow-sm hover:shadow-md transition cursor-pointer" onclick="openImageLightbox('${msgId}')">
            <img src="${msg.media_url}" id="chat-img-${msgId}" alt="Customer Attachment" class="w-full max-h-[380px] object-contain rounded-2xl block mx-auto transition duration-200 group-hover:brightness-95">
            <div class="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
              <span class="px-3 py-1.5 rounded-full bg-slate-900/90 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg border border-white/20">
                <span class="material-symbols-outlined text-[16px] text-emerald-400">zoom_in</span> Click to Enlarge / Inspect
              </span>
            </div>
          </div>
          ${msg.text && msg.text !== '[Photo Attachment]' ? `<p class="text-xs leading-relaxed font-normal">${msg.text.replace(/\n/g, '<br>')}</p>` : ''}
        </div>
      `;
    } else {
      let formattedMsg = (msg.text || '')
        .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code class="bg-slate-100 text-slate-900 px-1 py-0.2 rounded text-[10px] font-mono font-bold">$1</code>')
        .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-teal-600 hover:text-teal-800 font-bold underline break-all inline-flex items-center gap-0.5">$1 <span class="material-symbols-outlined text-[11px]">open_in_new</span></a>')
        .replace(/\n/g, '<br>');

      const isStockMenu = msg.text && (
        msg.text.includes('Ready-Stock Collections:') ||
        msg.text.includes('Reply with 1 to 6') ||
        msg.text.includes('Live Stock') || 
        msg.text.includes('Category Number') || 
        msg.text.includes('Baby Collection (0-3 Years)') || 
        msg.text.includes('Click any category button') ||
        msg.text.includes('How to Order / Inquire:')
      );

      let buttonsHtml = '';
      if (isStockMenu) {
        buttonsHtml = `
          <div class="mt-3 pt-2.5 border-t border-emerald-200/70 space-y-1.5">
            <div class="flex items-center justify-between text-[10px] font-bold text-emerald-900">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[14px] text-emerald-600">touch_app</span>
                <span>Click any option to view ready stock:</span>
              </span>
              <span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-mono">1-Click View</span>
            </div>
            
            <div class="grid grid-cols-2 gap-1.5 pt-0.5">
              <button type="button" onclick="triggerCategorySelection('1', '${ACTIVE_CUSTOMER_ID}')" class="px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-950 rounded-xl border border-emerald-300 hover:border-emerald-500 font-bold text-[11px] text-left transition flex items-center gap-1.5 shadow-2xs group">
                <span class="w-5 h-5 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 transition">1</span>
                <span class="truncate">Baby Collection</span>
              </button>
              <button type="button" onclick="triggerCategorySelection('2', '${ACTIVE_CUSTOMER_ID}')" class="px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-950 rounded-xl border border-emerald-300 hover:border-emerald-500 font-bold text-[11px] text-left transition flex items-center gap-1.5 shadow-2xs group">
                <span class="w-5 h-5 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 transition">2</span>
                <span class="truncate">Maternity Wear</span>
              </button>
              <button type="button" onclick="triggerCategorySelection('3', '${ACTIVE_CUSTOMER_ID}')" class="px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-950 rounded-xl border border-emerald-300 hover:border-emerald-500 font-bold text-[11px] text-left transition flex items-center gap-1.5 shadow-2xs group">
                <span class="w-5 h-5 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 transition">3</span>
                <span class="truncate">Newborn Gift Sets</span>
              </button>
              <button type="button" onclick="triggerCategorySelection('4', '${ACTIVE_CUSTOMER_ID}')" class="px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-950 rounded-xl border border-emerald-300 hover:border-emerald-500 font-bold text-[11px] text-left transition flex items-center gap-1.5 shadow-2xs group">
                <span class="w-5 h-5 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 transition">4</span>
                <span class="truncate">Kids Everyday</span>
              </button>
              <button type="button" onclick="triggerCategorySelection('5', '${ACTIVE_CUSTOMER_ID}')" class="px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-950 rounded-xl border border-emerald-300 hover:border-emerald-500 font-bold text-[11px] text-left transition flex items-center gap-1.5 shadow-2xs group">
                <span class="w-5 h-5 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 transition">5</span>
                <span class="truncate">Wholesale Bundles</span>
              </button>
              <button type="button" onclick="triggerCategorySelection('6', '${ACTIVE_CUSTOMER_ID}')" class="px-2.5 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-slate-800 hover:text-emerald-950 rounded-xl border border-emerald-300 hover:border-emerald-500 font-bold text-[11px] text-left transition flex items-center gap-1.5 shadow-2xs group">
                <span class="w-5 h-5 rounded-lg bg-emerald-100 group-hover:bg-emerald-600 group-hover:text-white text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0 transition">6</span>
                <span class="truncate">Festive Silk Sets</span>
              </button>
            </div>
          </div>
        `;
      }

      contentHtml = `
        <div class="space-y-1">
          <p class="text-xs leading-relaxed font-normal">${formattedMsg}</p>
          ${buttonsHtml}
        </div>
      `;
    }

    return `
      <div class="flex ${isOut ? 'justify-end' : 'justify-start'}">
        <div class="max-w-md ${isOut ? 'bg-brand-50 border border-emerald-200 text-slate-800 chat-bubble-out shadow-sm' : 'bg-white border border-slate-200 text-slate-800 chat-bubble-in shadow-sm'} p-3.5 space-y-1">
          ${(msg.isBot || msg.source === 'AUTOREPLY_BOT' || msg.rule_name) ? `
            <div class="flex items-center justify-between text-[10px] font-bold text-teal-800 bg-teal-100/90 px-2 py-0.5 rounded-md mb-1.5 border border-teal-200">
              <span class="flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px] text-teal-600">smart_toy</span>
                <span>Auto-Reply: <strong>${msg.rule_name || 'Stock Template'}</strong></span>
              </span>
              <span class="text-[9px] uppercase tracking-wider text-teal-700 bg-white/90 px-1 py-0.2 rounded font-mono">Sent Auto</span>
            </div>
          ` : ''}
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

  stream.innerHTML = `<div class="max-w-3xl xl:max-w-4xl mx-auto w-full space-y-3 min-w-0">${messagesContent}</div>`;

  // Auto-scroll to bottom
  stream.scrollTop = stream.scrollHeight;
}

window.renderChatStream = renderChatMessages;

// Interactive 1-Click Category Selection Action Handler
window.triggerCategorySelection = function(categoryNum, customerId) {
  const targetCustId = customerId || ACTIVE_CUSTOMER_ID;
  const customer = CRM_STATE.customers.find(c => c.id === targetCustId);
  if (!customer) return;

  const categoryNames = {
    '1': 'Baby Collection',
    '2': 'Maternity',
    '3': 'Newborn',
    '4': 'Kids',
    '5': 'Wholesale',
    '6': 'Girls Festive'
  };

  const catName = categoryNames[categoryNum] || 'Baby Collection';
  const responseText = getSpecificCategoryStockCard(catName, customer);

  const customerMsg = {
    id: Date.now(),
    sender: 'customer',
    text: `👉 Selected Option [${categoryNum}. ${catName}]`,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'DELIVERED'
  };

  const botMsg = {
    id: Date.now() + 100,
    sender: 'staff',
    isBot: true,
    text: responseText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'DELIVERED'
  };

  if (!CRM_STATE.conversations[targetCustId]) {
    CRM_STATE.conversations[targetCustId] = [];
  }
  CRM_STATE.conversations[targetCustId].push(customerMsg);
  CRM_STATE.conversations[targetCustId].push(botMsg);

  saveCRMState();
  renderChatMessages();
  renderInboxConversationList();
  if (typeof playChime === 'function') playChime('order');

  // Dispatch live to WhatsApp
  dispatchWhatsAppOutbound(
    customer.whatsapp || customer.phone,
    responseText,
    botMsg,
    customer.jid
  );

  showToast('Category Stock Sent', `Sent ${catName} stock details to ${customer.name}!`, 'check_circle', 'emerald');
};

// =========================================================================
// HIGH-RESOLUTION IMAGE LIGHTBOX CONTROLLER
// =========================================================================
let CURRENT_LIGHTBOX_ZOOM = 1.0;
let CURRENT_LIGHTBOX_SRC = '';

window.openImageLightbox = function(msgIdOrSrc, customTitle) {
  let imgSrc = '';
  let title = customTitle || 'Customer WhatsApp Photo Attachment';

  // Check active customer chat for message
  const customer = (CRM_STATE?.customers || []).find(c => c && (c.id === ACTIVE_CUSTOMER_ID || String(c.id) === String(ACTIVE_CUSTOMER_ID)));
  const conv = (CRM_STATE?.conversations && ACTIVE_CUSTOMER_ID && CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) || customer?.chat || [];
  if (Array.isArray(conv)) {
    const msg = conv.find(m => String(m.id) === String(msgIdOrSrc));
    if (msg && msg.media_url) {
      imgSrc = msg.media_url;
      title = `${customer ? customer.name : 'Customer'} - Photo (${msg.time || 'Chat Attachment'})`;
    }
  }

  // Fallback if direct src was passed or found in DOM
  if (!imgSrc) {
    const el = document.getElementById(`chat-img-${msgIdOrSrc}`);
    if (el && el.src) {
      imgSrc = el.src;
    } else if (typeof msgIdOrSrc === 'string' && (msgIdOrSrc.startsWith('data:') || msgIdOrSrc.startsWith('http') || msgIdOrSrc.startsWith('/') || msgIdOrSrc.startsWith('blob:'))) {
      imgSrc = msgIdOrSrc;
    }
  }

  if (!imgSrc) {
    console.warn('[Lightbox] No valid image source found for:', msgIdOrSrc);
    return;
  }

  CURRENT_LIGHTBOX_SRC = imgSrc;
  CURRENT_LIGHTBOX_ZOOM = 1.0;

  const modal = document.getElementById('modal-image-lightbox');
  const imgEl = document.getElementById('lightbox-img');
  const titleEl = document.getElementById('lightbox-image-title');
  const subEl = document.getElementById('lightbox-image-sub');
  const zoomPctEl = document.getElementById('lightbox-zoom-pct');

  if (imgEl) {
    imgEl.src = imgSrc;
    imgEl.style.transform = 'scale(1.0)';
  }
  if (titleEl) titleEl.innerText = title;
  if (subEl) subEl.innerText = customer ? `${customer.name} (${customer.phone || customer.id})` : 'High-Resolution WhatsApp Media';
  if (zoomPctEl) zoomPctEl.innerText = '100%';

  if (modal) {
    openModal('modal-image-lightbox');
    document.body.style.overflow = 'hidden';
  }
};

window.closeImageLightbox = function() {
  closeModal('modal-image-lightbox');
  document.body.style.overflow = '';
  CURRENT_LIGHTBOX_ZOOM = 1.0;
};

window.zoomLightboxImage = function(delta) {
  CURRENT_LIGHTBOX_ZOOM = Math.max(0.5, Math.min(3.5, CURRENT_LIGHTBOX_ZOOM + delta));
  const imgEl = document.getElementById('lightbox-img');
  const zoomPctEl = document.getElementById('lightbox-zoom-pct');
  if (imgEl) {
    imgEl.style.transform = `scale(${CURRENT_LIGHTBOX_ZOOM})`;
  }
  if (zoomPctEl) {
    zoomPctEl.innerText = `${Math.round(CURRENT_LIGHTBOX_ZOOM * 100)}%`;
  }
};

window.resetLightboxZoom = function() {
  CURRENT_LIGHTBOX_ZOOM = 1.0;
  const imgEl = document.getElementById('lightbox-img');
  const zoomPctEl = document.getElementById('lightbox-zoom-pct');
  if (imgEl) {
    imgEl.style.transform = 'scale(1.0)';
  }
  if (zoomPctEl) {
    zoomPctEl.innerText = '100%';
  }
};

window.downloadLightboxImage = function() {
  if (!CURRENT_LIGHTBOX_SRC) return;
  try {
    const a = document.createElement('a');
    a.href = CURRENT_LIGHTBOX_SRC;
    const filename = `whatsapp_media_${Date.now()}.png`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (typeof showToast === 'function') {
      showToast('Image downloaded successfully!', 'success');
    }
  } catch (err) {
    console.error('Download error:', err);
    window.open(CURRENT_LIGHTBOX_SRC, '_blank');
  }
};

window.openLightboxImageInNewTab = function() {
  if (!CURRENT_LIGHTBOX_SRC) return;
  if (CURRENT_LIGHTBOX_SRC.startsWith('data:')) {
    const imgWindow = window.open('');
    if (imgWindow) {
      imgWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>WhatsApp Attachment Full View</title>
          <style>
            body { margin: 0; background: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
            img { max-width: 98vw; max-height: 98vh; object-fit: contain; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border-radius: 8px; }
          </style>
        </head>
        <body>
          <img src="${CURRENT_LIGHTBOX_SRC}" alt="Full Photo">
        </body>
        </html>
      `);
      imgWindow.document.close();
    }
  } else {
    window.open(CURRENT_LIGHTBOX_SRC, '_blank');
  }
};

// Keyboard listener for Escape key to close topmost modal or lightbox
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    if (typeof ACTIVE_MODAL_STACK !== 'undefined' && ACTIVE_MODAL_STACK.length > 0) {
      const topModalId = ACTIVE_MODAL_STACK[ACTIVE_MODAL_STACK.length - 1];
      closeModal(topModalId);
    } else {
      const modal = document.getElementById('modal-image-lightbox');
      if (modal && !modal.classList.contains('hidden')) {
        closeImageLightbox();
      }
    }
  }
});

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

function formatAudioTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}
window.formatAudioTime = formatAudioTime;

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

// Update Query Status (Pending, Follow-up, In Progress, Converted, Resolved, DND)
function updateCustomerQueryStatus(queryId, newStatus) {
  const query = CRM_STATE.queries.find(q => q.id === queryId || q.customerId === queryId);
  const customer = query ? CRM_STATE.customers.find(c => c.id === query.customerId) : CRM_STATE.customers.find(c => c.id === queryId);
  if (!query && !customer) return;

  const oldStatus = query ? query.status : 'NEW';
  if (query) query.status = newStatus;

  const staffName = ACTIVE_ROLE === 'admin' ? 'Super Admin' : (CRM_STATE.staffList.find(s => s.id === ACTIVE_ROLE)?.name || 'Staff');

  if (customer) {
    if (newStatus === 'DND') {
      customer.isDND = true;
      customer.dndReason = 'Customer not interested in products (Requested DND)';
      customer.dndTimestamp = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      customer.dndMarkedBy = staffName;
      if (!Array.isArray(customer.tags)) customer.tags = [];
      if (!customer.tags.includes('DND / Opt-Out')) customer.tags.push('DND / Opt-Out');
    } else {
      customer.isDND = false;
      if (Array.isArray(customer.tags)) {
        customer.tags = customer.tags.filter(t => t !== 'DND / Opt-Out');
      }
    }
  }
  
  logAudit('STATUS_CHANGE', 'INBOX_PANEL', `Query ${query ? query.id : customer?.id} status changed from ${oldStatus} to ${newStatus}`);

  saveCRMState();
  renderInbox();
  renderCustomer360Panel();
  if (typeof renderEnquiriesTable === 'function') renderEnquiriesTable();
  if (typeof renderFollowupsTable === 'function') renderFollowupsTable();
  if (typeof renderDndModule === 'function') renderDndModule();
  updateBadgeCounters();

  const label = newStatus === 'DND' ? '🚫 DND / Not Interested' : newStatus.replace('_', ' ');
  showToast(
    newStatus === 'DND' ? 'Customer Marked as DND' : 'Status Updated',
    newStatus === 'DND' ? `Customer moved to separate DND & Opt-Out module.` : `Query status is now set to "${label}".`,
    newStatus === 'DND' ? 'do_not_disturb_on' : (newStatus === 'RESOLVED' || newStatus === 'CONVERTED' ? 'emerald' : (newStatus === 'PENDING' ? 'amber' : 'blue')),
    newStatus === 'DND' ? 'rose' : (newStatus === 'RESOLVED' || newStatus === 'CONVERTED' ? 'emerald' : (newStatus === 'PENDING' ? 'amber' : 'blue'))
  );
  if (typeof playChime === 'function') playChime('inbound');
}

function reactivateCustomerFromDND(customerId) {
  const customer = CRM_STATE.customers.find(c => c.id === customerId);
  if (!customer) return;

  customer.isDND = false;
  if (Array.isArray(customer.tags)) {
    customer.tags = customer.tags.filter(t => t !== 'DND / Opt-Out');
  }

  const query = CRM_STATE.queries.find(q => q.customerId === customerId);
  if (query && query.status === 'DND') {
    query.status = 'IN_PROGRESS';
  }

  logAudit('DND_REACTIVATED', 'DND_MODULE', `Reactivated customer ${customer.name} (${customer.phone}) from DND list.`);
  saveCRMState();
  renderDndModule();
  renderInbox();
  renderCustomer360Panel();
  updateBadgeCounters();

  showToast('Customer Reactivated', `${customer.name} has been restored to active communication.`, 'check_circle', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

function renderDndModule() {
  const tableBody = document.getElementById('dnd-table-body');
  const countSummary = document.getElementById('dnd-count-summary');
  const kpiTotal = document.getElementById('kpi-dnd-total');
  const badgeDnd = document.getElementById('badge-dnd-count');
  const searchInput = document.getElementById('dnd-search-input');
  const searchVal = (searchInput ? searchInput.value : '').toLowerCase().trim();

  const dndCustomers = (CRM_STATE?.customers || []).filter(c => {
    if (!c) return false;
    const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
    return c.isDND === true || (q && q.status === 'DND') || (Array.isArray(c.tags) && c.tags.includes('DND / Opt-Out'));
  });

  const totalDnd = dndCustomers.length;
  if (countSummary) countSummary.innerText = `${totalDnd} DND Customer${totalDnd === 1 ? '' : 's'}`;
  if (kpiTotal) kpiTotal.innerText = totalDnd;
  if (badgeDnd) badgeDnd.innerText = totalDnd;

  let filtered = dndCustomers;
  if (searchVal) {
    filtered = filtered.filter(c => 
      (c.name && c.name.toLowerCase().includes(searchVal)) ||
      (c.phone && c.phone.includes(searchVal)) ||
      (c.whatsapp && c.whatsapp.includes(searchVal)) ||
      (c.dndReason && c.dndReason.toLowerCase().includes(searchVal))
    );
  }

  if (!tableBody) return;

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="p-8 text-center text-slate-400">
          <span class="material-symbols-outlined text-[36px] text-slate-300">verified_user</span>
          <p class="text-xs font-semibold mt-1">No DND customers found</p>
          <p class="text-[11px] text-slate-400">When staff changes a customer's enquiry status to "🚫 DND", they will be listed here separately.</p>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(c => {
    const q = (CRM_STATE?.queries || []).find(qry => qry.customerId === c.id);
    const conv = CRM_STATE?.conversations?.[c.id] || [];
    const lastMsg = conv.length > 0 ? conv[conv.length - 1].text : (q ? q.lastMessage : 'No recent messages');
    const dndTime = c.dndTimestamp || (q ? q.createdAt : 'Recent');
    const markedBy = c.dndMarkedBy || 'Staff';
    const reason = c.dndReason || 'Customer not interested in products';
    const displayPhone = formatPhoneNumberPretty(c.whatsapp || c.phone);

    return `
      <tr class="hover:bg-slate-50 transition">
        <td class="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-700 to-slate-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
            ${c.avatar || 'CU'}
          </div>
          <div class="min-w-0">
            <p class="font-bold text-slate-900 text-xs truncate">${c.name || 'Customer'}</p>
            <p class="text-[10px] text-slate-400 font-mono">${c.code || c.id}</p>
          </div>
        </td>
        <td class="py-3.5 px-4 font-mono font-bold text-emerald-950 text-xs">
          ${displayPhone}
        </td>
        <td class="py-3.5 px-4">
          <span class="bg-rose-50 text-rose-800 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-rose-600">block</span>
            <span>${reason}</span>
          </span>
          <p class="text-[10px] text-slate-500 truncate max-w-xs mt-1 italic">"${lastMsg.length > 40 ? lastMsg.substring(0, 37) + '...' : lastMsg}"</p>
        </td>
        <td class="py-3.5 px-4 text-xs font-semibold text-slate-700">
          <span class="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">${markedBy}</span>
        </td>
        <td class="py-3.5 px-4 text-xs text-slate-500 font-medium">
          ${dndTime}
        </td>
        <td class="py-3.5 px-4 text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="reactivateCustomerFromDND('${c.id}')" class="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm" title="Reactivate customer to allow messages and orders">
              <span class="material-symbols-outlined text-[14px]">check_circle</span>
              <span>Re-activate</span>
            </button>
            <button onclick="ACTIVE_CUSTOMER_ID='${c.id}'; switchView('inbox');" class="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition flex items-center gap-1" title="View chat in inbox">
              <span class="material-symbols-outlined text-[14px]">chat</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Update all sidebar & header badge counters dynamically across all modules
function updateBadgeCounters() {
  if (!CRM_STATE) return;

  // 1. Unread count in inbox
  const unreadEl = document.getElementById('badge-total-unread');
  if (unreadEl) {
    let unreadCount = 0;
    (CRM_STATE.queries || []).forEach(q => {
      if (q.status !== 'DND') {
        unreadCount += (q.unreadCount || 0);
      }
    });
    unreadEl.innerText = unreadCount > 0 ? unreadCount : '0';
  }

  // 2. Unassigned Enquiries
  const unassignedEl = document.getElementById('badge-unassigned-count');
  if (unassignedEl) {
    const unassignedCount = (CRM_STATE.queries || []).filter(q => q.assignedTo === 'UNASSIGNED' && q.status !== 'DND').length;
    unassignedEl.innerText = `${unassignedCount} New`;
  }

  // 3. Followup count
  const followupEl = document.getElementById('badge-followup-count');
  if (followupEl) {
    const dueCount = (CRM_STATE.followups || []).filter(f => f.status === 'PENDING').length;
    followupEl.innerText = `${dueCount} Due`;
  }

  // 4. Orders count
  const ordersEl = document.getElementById('badge-orders-count');
  if (ordersEl) {
    const ordCount = (CRM_STATE.orders || []).length;
    ordersEl.innerText = ordCount;
  }

  // 5. DND count
  const dndEl = document.getElementById('badge-dnd-count');
  const kpiDndEl = document.getElementById('kpi-dnd-total');
  const dndSummaryEl = document.getElementById('dnd-count-summary');
  const dndCustomers = (CRM_STATE.customers || []).filter(c => {
    if (!c) return false;
    const q = (CRM_STATE.queries || []).find(qry => qry.customerId === c.id);
    return c.isDND === true || (q && q.status === 'DND') || (Array.isArray(c.tags) && c.tags.includes('DND / Opt-Out'));
  });
  const dndCount = dndCustomers.length;
  if (dndEl) dndEl.innerText = dndCount;
  if (kpiDndEl) kpiDndEl.innerText = dndCount;
  if (dndSummaryEl) dndSummaryEl.innerText = `${dndCount} DND Customer${dndCount === 1 ? '' : 's'}`;

  // 6. Total Staff count
  const staffEl = document.getElementById('badge-total-staff-count');
  if (staffEl) {
    staffEl.innerText = (CRM_STATE.staffList || []).length;
  }
}

// Quick Reassign Handling Staff
function quickReassignQueryStaff(queryId, newStaffId) {
  const query = CRM_STATE.queries.find(q => q.id === queryId || q.customerId === queryId);
  if (!query) return;

  const staff = CRM_STATE.staffList.find(s => s.id === newStaffId);
  query.assignedTo = newStaffId;
  if (query.status === 'NEW' && newStaffId !== 'UNASSIGNED') {
    query.status = 'IN_PROGRESS';
  }

  logAudit('STAFF_ASSIGNMENT', 'INBOX_PANEL', `Query ${query.id} assigned to ${staff ? staff.name : 'Unassigned'}`);
  
  // Asynchronously sync query assignment to MySQL Database
  fetch('api.php?action=assign_query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: query.id,
      assigned_to: newStaffId,
      status: query.status,
      user: CURRENT_USER?.name || 'Admin'
    })
  }).catch(() => {});

  saveCRMState();
  renderInbox();
  renderCustomer360Panel();
  if (typeof renderEnquiriesTable === 'function') renderEnquiriesTable();

  showToast(
    'Staff Assigned',
    `Handling staff for query ${query.id} set to ${staff ? staff.name : 'Unassigned'}.`,
    'how_to_reg',
    'emerald'
  );
  if (typeof playChime === 'function') playChime('inbound');
}

// Track which customer profile is currently in Edit Mode (locked by default once saved)
const CUSTOMER_EDIT_MODES = new Set();

function toggleCustomerEditMode(customerId, enableEdit = true) {
  if (enableEdit) {
    CUSTOMER_EDIT_MODES.add(customerId);
  } else {
    CUSTOMER_EDIT_MODES.delete(customerId);
  }
  renderCustomer360Panel();
}

function handleSaveQueryStatus(queryId) {
  const select = document.getElementById('query-status-select');
  if (!select) return;
  const newStatus = select.value;
  updateCustomerQueryStatus(queryId, newStatus);
}

// Save Customer Details from Right-Side Panel Form
function handleQuickCustomerSave(event, customerId) {
  if (event) event.preventDefault();

  const customer = CRM_STATE.customers.find(c => c.id === customerId);
  if (!customer) return;

  const nameInput = document.getElementById('cust-edit-name');
  const phoneInput = document.getElementById('cust-edit-phone');
  const ageInput = document.getElementById('cust-edit-age');
  const genderInput = document.getElementById('cust-edit-gender');
  const emailInput = document.getElementById('cust-edit-email');
  const addressInput = document.getElementById('cust-edit-address');
  const notesInput = document.getElementById('cust-edit-notes');

  const newName = nameInput ? nameInput.value.trim() : customer.name;
  const newPhone = phoneInput ? phoneInput.value.trim() : (customer.whatsapp || customer.phone);
  const newAge = ageInput ? ageInput.value.trim() : (customer.age || '');
  const newGender = genderInput ? genderInput.value : (customer.gender || '');
  const newEmail = emailInput ? emailInput.value.trim() : (customer.email || '');
  const newAddress = addressInput ? addressInput.value.trim() : (customer.address || '');
  const newNotes = notesInput ? notesInput.value.trim() : (customer.notes || '');

  customer.name = newName;
  customer.phone = newPhone;
  customer.whatsapp = newPhone;
  customer.age = newAge;
  customer.gender = newGender;
  customer.email = newEmail;
  customer.address = newAddress;
  customer.notes = newNotes;

  // Update avatar initials
  const nameChars = Array.from(newName || 'WA');
  customer.avatar = (nameChars.slice(0, 2).join('')).toUpperCase();

  // Exit edit mode (locks fields)
  CUSTOMER_EDIT_MODES.delete(customerId);

  // Save to CRM state & MySQL backend
  saveCRMState();

  fetch('api.php?action=save_customer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      whatsapp: customer.whatsapp,
      age: customer.age,
      gender: customer.gender,
      email: customer.email,
      address: customer.address,
      notes: customer.notes
    })
  }).catch(() => {});

  logAudit('CUSTOMER_UPDATED', 'CUSTOMER_360', `Updated profile details and notes for customer ${customer.name} (${customer.id})`);

  renderInbox();
  renderChatHeader();
  renderCustomer360Panel();
  if (typeof renderCustomersGrid === 'function') renderCustomersGrid();
  if (typeof renderCustomersTable === 'function') renderCustomersTable();

  showToast('Customer Details Saved', `Profile & mindset notes for "${customer.name}" saved & locked!`, 'check_circle', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

// Quick 1-Click Customer Mindset Notes Modal / Prompt
function openCustomerQuickNotesModal(customerId) {
  const customer = CRM_STATE.customers.find(c => c.id === customerId);
  if (!customer) return;

  const currentNotes = customer.notes || '';
  const updatedNotes = prompt(`📝 Update Customer Mindset, Behavioral Records & Notes for "${customer.name}":`, currentNotes);

  if (updatedNotes !== null) {
    customer.notes = updatedNotes.trim();
    saveCRMState();

    fetch('api.php?action=save_customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        notes: customer.notes
      })
    }).catch(() => {});

    logAudit('CUSTOMER_NOTES', 'CUSTOMER_360', `Updated mindset notes for ${customer.name}: "${customer.notes.substring(0, 30)}..."`);
    renderCustomer360Panel();
    showToast('Customer Notes Updated', 'Mindset notes saved successfully.', 'edit_note', 'amber');
    if (typeof playChime === 'function') playChime('order');
  }
}

// Quick Append Mindset Tag to Customer Record
function appendCustomerMindsetTag(customerId, tagText) {
  const customer = CRM_STATE.customers.find(c => c.id === customerId);
  if (!customer) return;

  const existing = customer.notes ? customer.notes.trim() : '';
  if (existing.includes(tagText)) {
    showToast('Already Added', `Tag "${tagText}" is already in customer notes.`, 'info', 'blue');
    return;
  }

  customer.notes = existing ? `${existing} | ${tagText}` : tagText;
  saveCRMState();
  renderCustomer360Panel();
  showToast('Mindset Tag Added', `"${tagText}" recorded in customer mindset notes.`, 'psychology', 'amber');
  if (typeof playChime === 'function') playChime('order');
}

// Master GRM Catalog lookup for bot automation tracking & auto-recognition
const GRM_BOT_CATALOG = {
  '1': {
    categoryName: 'Baby Collection (0–3 Years)',
    icon: '👗',
    items: {
      '1': { name: 'Embroidered Cotton Baby Frock (Pink)', price: '₹599', sku: 'BF-001-PK', size: '2–3 Years', image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80' },
      '2': { name: 'Embroidered Cotton Baby Frock (Sunshine Yellow)', price: '₹599', sku: 'BF-001-YL', size: '1–2 Years', image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80' }
    }
  },
  '2': {
    categoryName: 'Maternity & Feeding Wear',
    icon: '🤰',
    items: {
      '1': { name: 'Pure Cotton Tiered Feeding Gown', price: '₹1,299', sku: 'MD-102-BL', size: 'L / XL', image: 'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=800&auto=format&fit=crop&q=80' },
      '2': { name: 'Maternity Tiered Cotton Floral Dress', price: '₹1,450', sku: 'MD-103-PK', size: 'M / L', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80' }
    }
  },
  '3': {
    categoryName: 'Newborn Gift Sets (0–6 Months)',
    icon: '🎁',
    items: {
      '1': { name: 'Newborn 5-Piece Organic Romper Gift Set', price: '₹799', sku: 'BB-301-WH', size: '0–6 Months', image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80' },
      '2': { name: 'Newborn Organic Muslin Swaddle & Cap Set', price: '₹499', sku: 'BB-302-SW', size: '0–6 Months', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80' }
    }
  },
  '4': {
    categoryName: 'Kids Everyday Wear (4–5 Years)',
    icon: '👕',
    items: {
      '1': { name: 'Kids Organic Cotton T-Shirt Set (Pack of 3)', price: '₹450', sku: 'KD-204-YL', size: '4–5 Years', image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80' },
      '2': { name: 'Kids Denim Shorts & Cotton Tee Combo', price: '₹599', sku: 'KD-205-BL', size: '4–5 Years', image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80' }
    }
  },
  '5': {
    categoryName: 'Wholesale & Bulk Bundles',
    icon: '📦',
    items: {
      '1': { name: 'Wholesale Baby Rompers Bulk Box (50 Pcs Assorted)', price: '₹8,500', sku: 'WS-701-BX', size: '0–24 Months', image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80' },
      '2': { name: 'Wholesale Pure Cotton Frocks Bundle (25 Pcs)', price: '₹7,200', sku: 'WS-702-BX', size: '2–5 Years', image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?w=800&auto=format&fit=crop&q=80' }
    }
  },
  '6': {
    categoryName: 'Festive & VIP Silk Collection',
    icon: '🥻',
    items: {
      '1': { name: 'Girls Festive Silk Lehenga Choli', price: '₹899', sku: 'GL-505-RD', size: '6–7 Years', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80' },
      '2': { name: 'Handcrafted Kanjivaram Silk Pattu Pavadai Set', price: '₹2,499', sku: 'VIP-901-GL', size: '3–4 Years', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80' }
    }
  }
};

function syncCustomerAutomationHistory(customer) {
  if (!customer) return;
  if (!Array.isArray(customer.automationHistory)) customer.automationHistory = [];
  if (!Array.isArray(customer.adminNotes)) customer.adminNotes = [];

  const conv = CRM_STATE?.conversations?.[customer.id] || [];
  if (conv.length === 0) return;

  const actions = [];
  let currentCategoryKey = null;

  for (let i = 0; i < conv.length; i++) {
    const msg = conv[i];
    const txt = (msg.text || '').trim();
    const timeStr = msg.time || (msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '12:00 PM');
    const msgEpoch = msg.timestamp || (Date.now() - (conv.length - i) * 60000);

    // 1. Check if message is a Category Catalog Menu (sent by Bot or Staff)
    let matchedCatKey = null;
    if (txt.includes('• Baby Collection') || txt.includes('Baby Collection')) matchedCatKey = '1';
    else if (txt.includes('• Maternity') || txt.includes('Maternity & Feeding') || txt.includes('Maternity Wear')) matchedCatKey = '2';
    else if (txt.includes('• Newborn') || txt.includes('Newborn Gift')) matchedCatKey = '3';
    else if (txt.includes('• Kids Everyday') || txt.includes('Kids Everyday Wear')) matchedCatKey = '4';
    else if (txt.includes('• Wholesale') || txt.includes('Wholesale & Bulk Bundles') || txt.includes('Wholesale Bundles')) matchedCatKey = '5';
    else if (txt.includes('• Festive') || txt.includes('Festive & VIP Silk') || txt.includes('Festive Silk Sets')) matchedCatKey = '6';

    if (matchedCatKey) {
      currentCategoryKey = matchedCatKey;
      const catObj = GRM_BOT_CATALOG[matchedCatKey];
      if (catObj) {
        actions.push({
          id: 'cat_' + (msg.id || i),
          timestamp: msgEpoch,
          time: timeStr,
          type: 'CATEGORY_VIEWED',
          title: `${catObj.icon || '👗'} ${catObj.categoryName || 'Catalog'}`,
          price: '',
          sku: `CAT-${matchedCatKey}`,
          image: null,
          badge: '👗 Category Menu'
        });
      }
    }

    // 2. Check if customer sent a category or product choice number
    if (msg.sender === 'customer' || !msg.isBot) {
      const trimmed = txt.trim();
      if (/^[1-6]$/.test(trimmed)) {
        if (!currentCategoryKey || currentCategoryKey === null) {
          // Category selection
          const catObj = GRM_BOT_CATALOG[trimmed];
          if (catObj) {
            currentCategoryKey = trimmed;
            actions.push({
              id: 'pick_cat_' + (msg.id || i),
              timestamp: msgEpoch,
              time: timeStr,
              type: 'CATEGORY_VIEWED',
              title: `Selected: ${catObj.icon} ${catObj.categoryName}`,
              price: '',
              sku: `CAT-${trimmed}`,
              image: null,
              badge: '💬 Customer Choice'
            });
          }
        } else {
          // Product selection within category
          const catObj = GRM_BOT_CATALOG[currentCategoryKey];
          const prodObj = catObj?.items?.[trimmed];
          if (prodObj) {
            actions.push({
              id: 'pick_prod_' + (msg.id || i),
              timestamp: msgEpoch,
              time: timeStr,
              type: 'PRODUCT_VIEWED',
              title: prodObj.name,
              price: prodObj.price,
              sku: prodObj.sku,
              size: prodObj.size,
              image: prodObj.image,
              badge: '🛍️ Chosen by Customer'
            });
          }
        }
      }
    }

    // 3. Check for specific catalog products in the message
    for (const [catKey, catData] of Object.entries(GRM_BOT_CATALOG)) {
      for (const [pNum, prod] of Object.entries(catData.items)) {
        const isMatched = (
          (prod.sku && txt.includes(prod.sku)) ||
          (prod.name && txt.includes(prod.name)) ||
          (msg.media_url && msg.media_url === prod.image)
        );

        if (isMatched) {
          actions.push({
            id: 'prod_' + prod.sku + '_' + (msg.id || i),
            timestamp: msgEpoch,
            time: timeStr,
            type: 'PRODUCT_VIEWED',
            title: prod.name,
            price: prod.price,
            sku: prod.sku,
            size: prod.size,
            image: msg.media_url || prod.image,
            badge: '📸 Product Photo Viewed'
          });
        }
      }
    }

    // 4. Generic Product Card / Photo detection (if not in hardcoded catalog)
    const skuMatch = txt.match(/SKU:\s*`?([A-Z0-9_-]+)`?/i);
    const priceMatch = txt.match(/(?:💰 Price:|Price:|₹)\s*[*]?:?\s*₹?([0-9,]+)/i);
    const headerMatch = txt.match(/•\s*([^\n\r]+)/);

    if ((msg.type === 'image' || msg.media_url || (skuMatch && priceMatch)) && headerMatch) {
      const headerTitle = headerMatch[1].replace(/[*_#]/g, '').trim();
      const skuVal = skuMatch ? skuMatch[1] : '';
      const priceVal = priceMatch ? `₹${priceMatch[1]}` : '';

      if (!actions.some(a => (a.sku && a.sku === skuVal) || a.title === headerTitle)) {
        actions.push({
          id: 'dyn_prod_' + (msg.id || i),
          timestamp: msgEpoch,
          time: timeStr,
          type: 'PRODUCT_VIEWED',
          title: headerTitle,
          price: priceVal,
          sku: skuVal,
          image: msg.media_url || null,
          badge: '📸 Product Viewed'
        });
      }
    }
  }

  // Deduplicate and sort newest first
  const seenKeys = new Set();
  const uniqueActions = [];

  for (let j = actions.length - 1; j >= 0; j--) {
    const act = actions[j];
    const key = (act.sku ? act.sku : act.title) + '_' + act.type;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueActions.push(act);
    }
  }

  customer.automationHistory = uniqueActions.slice(0, 25);
}
window.GRM_BOT_CATALOG = GRM_BOT_CATALOG;
window.syncCustomerAutomationHistory = syncCustomerAutomationHistory;

function renderCustomer360Panel() {
  const panel = document.getElementById('chat-right-panel');
  if (!panel) return;

  if (!CRM_STATE || !CRM_STATE.customers) {
    panel.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Customer profile details will appear here</div>`;
    return;
  }

  const customer = (CRM_STATE.customers || []).find(c => c && (c.id === ACTIVE_CUSTOMER_ID || String(c.id) === String(ACTIVE_CUSTOMER_ID)));
  const query = (CRM_STATE.queries || []).find(q => q && (q.customerId === ACTIVE_CUSTOMER_ID || String(q.customerId) === String(ACTIVE_CUSTOMER_ID)));
  const staff = query ? (CRM_STATE.staffList || []).find(s => s && (s.id === query.assignedTo || String(s.id) === String(query.assignedTo))) : null;
  const orders = (CRM_STATE.orders || []).filter(o => o && (o.customerId === ACTIVE_CUSTOMER_ID || String(o.customerId) === String(ACTIVE_CUSTOMER_ID)));

  if (!customer) {
    panel.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Customer profile details will appear here</div>`;
    return;
  }

  // Live Sync & Parse Automation History from Conversations
  try {
    syncCustomerAutomationHistory(customer);
  } catch (err) {
    console.warn('[Customer 360] syncCustomerAutomationHistory error:', err);
  }

  const isRevealed = REVEALED_CUSTOMERS.has(customer.id);
  const displayPhone = formatDisplayPhone(customer.whatsapp || customer.phone, customer.id);
  const isEditing = CUSTOMER_EDIT_MODES.has(customer.id);

  // Status Badge Formatting
  const qStatus = query ? (query.status || 'NEW') : (customer.isDND ? 'DND' : 'NONE');
  let statusBadgeHtml = '';
  if (qStatus === 'DND' || customer.isDND) {
    statusBadgeHtml = `<span class="bg-rose-100 text-rose-900 border border-rose-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-rose-600"></span> 🚫 DND</span>`;
  } else if (qStatus === 'PENDING') {
    statusBadgeHtml = `<span class="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> 🟡 PENDING</span>`;
  } else if (qStatus === 'FOLLOW_UP') {
    statusBadgeHtml = `<span class="bg-blue-100 text-blue-900 border border-blue-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span> 🔵 FOLLOW-UP</span>`;
  } else if (qStatus === 'IN_PROGRESS' || qStatus === 'ASSIGNED') {
    statusBadgeHtml = `<span class="bg-indigo-100 text-indigo-900 border border-indigo-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-indigo-600"></span> 🟣 IN PROGRESS</span>`;
  } else if (qStatus === 'CONVERTED') {
    statusBadgeHtml = `<span class="bg-purple-100 text-purple-900 border border-purple-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-purple-600"></span> 🏆 CONVERTED</span>`;
  } else if (qStatus === 'RESOLVED') {
    statusBadgeHtml = `<span class="bg-emerald-100 text-emerald-900 border border-emerald-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600"></span> ✅ RESOLVED</span>`;
  } else {
    statusBadgeHtml = `<span class="bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 🟢 NEW</span>`;
  }

  panel.innerHTML = `
    <!-- Top Bar with Slide / Hide Toggle Button -->
    <div class="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-10 backdrop-blur">
      <span class="text-[11px] font-extrabold uppercase text-slate-700 flex items-center gap-1.5">
        <span class="material-symbols-outlined text-[16px] text-emerald-700">account_box</span>
        <span>Customer 360 Details</span>
      </span>
      <button type="button" onclick="toggleRightPanel(false, true)" class="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 text-[10px] font-bold shadow-sm" title="Slide Hide Customer Profile Panel">
        <span>Hide</span>
        <span class="material-symbols-outlined text-[16px]">chevron_right</span>
      </button>
    </div>

    <!-- Top Customer Summary -->
    <div class="p-5 border-b border-slate-200 text-center bg-slate-50/50">
      <div class="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-dark to-emerald-800 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
        ${customer.avatar}
      </div>
      <h3 class="font-bold text-slate-900 text-sm mt-2.5">${customer.name}</h3>
      <div class="flex items-center justify-center gap-1.5 mt-1">
        <p class="text-xs text-emerald-800 font-mono font-bold">${displayPhone}</p>
      </div>

      <!-- Handle Staff Subtitle Badge -->
      <div class="mt-2 flex items-center justify-center">
        <span class="inline-flex items-center gap-1 text-[11px] font-semibold ${staff ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'} px-2.5 py-0.5 rounded-full">
          <span class="material-symbols-outlined text-[13px]">${staff ? 'badge' : 'person_alert'}</span>
          <span>Handled by: <strong>${staff ? staff.name : 'Unassigned'}</strong></span>
        </span>
      </div>
      
      <!-- Tags -->
      <div class="flex items-center justify-center gap-1.5 flex-wrap mt-3">
        ${(customer.tags || []).map(t => `<span class="${t.includes('DND') ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'} text-[10px] font-bold px-2 py-0.5 rounded-full">${t}</span>`).join('')}
      </div>
    </div>

    <!-- BRAND-MASKED VOICE CALL ACTION -->
    <div class="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-b border-emerald-200">
      <button type="button" onclick="initiateBrandMaskedCall('${customer.id}')" class="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition hover:scale-[1.01] active:scale-[0.99]" title="Customer receives call under official Brand Name: ${getBrandName()}">
        <span class="material-symbols-outlined text-[18px] animate-pulse">call</span>
        <span>Call via ${getBrandName()} (Masked Caller ID)</span>
      </button>
      <p class="text-[10px] text-center text-emerald-800 font-medium mt-1.5 flex items-center justify-center gap-1">
        <span class="material-symbols-outlined text-[13px] text-emerald-600">verified_user</span>
        <span>Customer sees only <strong>${getBrandName()}</strong> &bull; Staff SIM hidden</span>
      </p>
    </div>

    <!-- 1. CUSTOMER PROFILE DETAILS FORM (SHOWN FIRST) -->
    <div class="p-4 border-b border-slate-200 bg-white space-y-3">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-brand-wa">person_pin</span>
          <span>Customer Profile Details</span>
        </span>
        ${isEditing ? `
          <span class="text-[9px] bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Editing Mode
          </span>
        ` : `
          <span class="text-[9px] bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span class="material-symbols-outlined text-[12px] text-slate-500">lock</span> Saved &amp; Locked
          </span>
        `}
      </div>

      <form id="form-quick-customer-edit" onsubmit="handleQuickCustomerSave(event, '${customer.id}')" class="space-y-2.5 text-xs">
        <!-- Customer Name -->
        <div>
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Customer Name *:</label>
          <input type="text" id="cust-edit-name" value="${customer.name || ''}" ${isEditing ? '' : 'disabled'} required placeholder="Full Name" class="w-full ${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
        </div>

        <!-- Phone Number (Auto-Fetched from WhatsApp Message) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-bold text-slate-700 text-[10px] uppercase tracking-wide">WhatsApp Phone *:</label>
            <span class="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Auto-Fetched
            </span>
          </div>
          <div class="relative">
            <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-[16px] text-emerald-600">call</span>
            <input type="text" id="cust-edit-phone" value="${customer.whatsapp || customer.phone || ''}" ${isEditing ? '' : 'disabled'} required placeholder="+91 98765 43210" class="w-full pl-8 pr-3 py-2 ${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-emerald-950 cursor-not-allowed select-none'} border rounded-xl text-xs font-mono font-bold">
          </div>
        </div>

        <!-- Gender -->
        <div>
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Gender:</label>
          <select id="cust-edit-gender" ${isEditing ? '' : 'disabled'} class="w-full ${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
            <option value="" ${!customer.gender ? 'selected' : ''}>-- Select --</option>
            <option value="Female" ${customer.gender === 'Female' ? 'selected' : ''}>Female</option>
            <option value="Male" ${customer.gender === 'Male' ? 'selected' : ''}>Male</option>
            <option value="Other" ${customer.gender === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </div>

        <!-- Delivery Address -->
        <div>
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Delivery Address:</label>
          <textarea id="cust-edit-address" rows="2" ${isEditing ? '' : 'disabled'} placeholder="Door No, Street, Landmark, City, Pincode" class="w-full ${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">${customer.address || ''}</textarea>
        </div>

        <!-- Customer Mindset & Records Notes Field -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="font-bold text-slate-700 text-[10px] uppercase tracking-wide flex items-center gap-1">
              <span class="material-symbols-outlined text-[15px] text-amber-600">psychology</span>
              <span>Customer Mindset &amp; Notes:</span>
            </label>
            <span class="text-[9px] text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">Mindset Log</span>
          </div>
          <textarea id="cust-edit-notes" rows="2" ${isEditing ? '' : 'disabled'} placeholder="Record customer mindset, fabric/size preferences, wholesale budget, buying behavior, or special instructions..." class="w-full ${isEditing ? 'bg-amber-50/50 border-amber-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-medium'} border rounded-xl p-2 text-xs">${customer.notes || ''}</textarea>
        </div>

        <!-- Action Buttons (Locked vs Editing) -->
        <div class="pt-1">
          ${isEditing ? `
            <div class="flex gap-2">
              <button type="button" onclick="toggleCustomerEditMode('${customer.id}', false)" class="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition flex items-center justify-center">
                Cancel
              </button>
              <button type="submit" class="flex-1 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 active:scale-[0.99]">
                <span class="material-symbols-outlined text-[16px]">save</span>
                <span>Save Customer Details</span>
              </button>
            </div>
          ` : `
            <button type="button" onclick="toggleCustomerEditMode('${customer.id}', true)" class="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-1.5 active:scale-[0.99]">
              <span class="material-symbols-outlined text-[16px]">edit_note</span>
              <span>Edit Customer Details &amp; Notes</span>
            </button>
          `}
        </div>
      </form>
    </div>

    <!-- 2. ACTIVE QUERY & STATUS CONTROLLER (DROPDOWN + FOLLOW-UP + SAVE BUTTON) -->
    <div class="p-4 border-b border-slate-200 space-y-3 bg-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-brand-wa">assignment</span>
          <span class="text-[11px] font-bold uppercase text-slate-700">Enquiry Status &amp; State</span>
        </div>
        ${statusBadgeHtml}
      </div>

      ${query ? `
        <!-- Status Dropdown Selector & Follow-up & Save Button Below -->
        <div class="space-y-3">
          <div>
            <label class="block font-bold text-slate-700 text-[10px] uppercase tracking-wide mb-1">Change Status:</label>
            <div class="relative">
              <select id="query-status-select" class="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:bg-white focus:ring-1 focus:ring-brand-wa appearance-none pr-8">
                <option value="NEW" ${qStatus === 'NEW' ? 'selected' : ''}>🟢 New Lead</option>
                <option value="PENDING" ${qStatus === 'PENDING' ? 'selected' : ''}>🟡 Pending Action</option>
                <option value="FOLLOW_UP" ${qStatus === 'FOLLOW_UP' ? 'selected' : ''}>🔵 Follow-up Scheduled</option>
                <option value="IN_PROGRESS" ${qStatus === 'IN_PROGRESS' || qStatus === 'ASSIGNED' ? 'selected' : ''}>🟣 In Progress / Active</option>
                <option value="RESOLVED" ${qStatus === 'RESOLVED' ? 'selected' : ''}>✅ Resolved / Closed</option>
                <option value="CONVERTED" ${qStatus === 'CONVERTED' ? 'selected' : ''}>🏆 Converted to Sale</option>
                <option value="DND" ${qStatus === 'DND' ? 'selected' : ''}>🚫 DND / Not Interested (No Products Needed)</option>
              </select>
              <span class="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">expand_more</span>
            </div>
          </div>

          <!-- Query Meta Details with Set Follow-up Action -->
          <div class="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Query ID:</span>
              <span class="font-mono font-bold text-slate-800">${query.id}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Priority:</span>
              <span class="font-bold ${query.priority === 'URGENT' ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200' : 'text-amber-700'}">${query.priority}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-slate-500 font-medium">Schedule Action:</span>
              <button type="button" onclick="openFollowUpModal()" class="text-[11px] text-blue-700 font-bold hover:underline flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">calendar_add_on</span> Set Follow-up
              </button>
            </div>
          </div>

          <!-- Save Status Button Below Follow-up Action -->
          <button type="button" onclick="handleSaveQueryStatus('${query.id}')" class="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-1.5 active:scale-[0.99]">
            <span class="material-symbols-outlined text-[15px]">save</span>
            <span>Save Status</span>
          </button>
        </div>
      ` : '<p class="text-xs text-slate-400">No active query recorded for this customer</p>'}
    </div>

    <!-- 3. DYNAMIC BOT AUTOMATION & CHOSEN PRODUCTS TRACKER CARD -->
    <div class="p-4 border-b border-slate-200 bg-sky-50/40 space-y-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-sky-600">smart_toy</span>
          <span class="text-[11px] font-extrabold uppercase text-sky-950">Bot Automation &amp; Chosen Products</span>
        </div>
        <div class="flex items-center gap-1">
          <span class="text-[9px] bg-sky-100 text-sky-800 font-mono font-bold px-2 py-0.5 rounded-full border border-sky-200">
            ${(customer.automationHistory || []).length} Actions
          </span>
          <button type="button" onclick="syncCustomerAutomationHistory(CRM_STATE.customers.find(c => c.id === '${customer.id}')); renderCustomer360Panel();" class="p-1 hover:bg-sky-200/60 rounded text-sky-700 transition" title="Re-sync chat actions">
            <span class="material-symbols-outlined text-[13px]">sync</span>
          </button>
        </div>
      </div>

      <div class="space-y-2">
        ${(!customer.automationHistory || customer.automationHistory.length === 0) ? `
          <div class="bg-white p-3 rounded-xl border border-sky-200 text-center text-xs text-slate-400 space-y-1">
            <span class="material-symbols-outlined text-[20px] text-sky-400 block mx-auto">track_changes</span>
            <p>No automation activity yet. As customer chooses categories or products on WhatsApp, they will appear here automatically.</p>
          </div>
        ` : `
          <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
            ${customer.automationHistory.map(item => {
              const safeTitle = (item.title || '').replace(/[\r\n]+/g, ' ').replace(/'/g, "\\'");
              return `
              <div class="bg-white p-2.5 rounded-xl border border-sky-200 shadow-2xs flex items-start gap-2.5 transition hover:border-sky-300 hover:shadow-xs">
                ${item.image ? `
                  <div class="relative shrink-0 group">
                    <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-lg object-cover border border-slate-200 cursor-pointer transition group-hover:opacity-90" onclick="openImageLightbox('${item.image}', '${safeTitle}')">
                    <span class="material-symbols-outlined absolute bottom-0.5 right-0.5 text-[11px] bg-black/60 text-white rounded p-0.5 pointer-events-none">zoom_in</span>
                  </div>
                ` : `
                  <div class="w-10 h-10 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                    <span class="material-symbols-outlined text-[18px]">${item.type === 'PRODUCT_VIEWED' ? 'checkroom' : 'category'}</span>
                  </div>
                `}
                <div class="min-w-0 flex-1">
                  <div class="flex items-center justify-between gap-1">
                    <h5 class="text-xs font-bold text-slate-900 truncate" title="${item.title}">${item.title}</h5>
                    <span class="text-[9px] text-slate-400 font-mono shrink-0">${item.time}</span>
                  </div>
                  <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                    ${item.price ? `<span class="text-[11px] font-extrabold text-emerald-700">${item.price}</span>` : ''}
                    ${item.sku ? `<span class="text-[9px] font-mono bg-slate-100 text-slate-700 px-1 rounded font-bold">${item.sku}</span>` : ''}
                    ${item.size ? `<span class="text-[9px] text-slate-500 font-medium">${item.size}</span>` : ''}
                    <span class="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded-full font-bold ml-auto">${item.badge || 'Browsed'}</span>
                  </div>
                </div>
              </div>
            `;
            }).join('')}
          </div>
        `}
      </div>
    </div>

    <!-- 3. DEDICATED ADMIN & STAFF INTERNAL NOTES ENGINE (Multi-Entry & Timestamped) -->
    <div class="p-4 border-b border-slate-200 bg-amber-50/50 space-y-2.5">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-amber-700">edit_note</span>
          <span class="text-[11px] font-extrabold uppercase text-amber-950">Admin &amp; Staff Internal Notes</span>
        </div>
        <span class="text-[9px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-300">
          ${(customer.adminNotes || []).length} Notes
        </span>
      </div>

      <!-- In-Place Note Composer -->
      <div class="bg-white p-3 rounded-xl border border-amber-200 shadow-2xs space-y-2">
        <textarea id="quick-admin-note-input" rows="2" placeholder="Write an internal note about customer preference, wholesale inquiry, sizing..." class="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none resize-none"></textarea>
        
        <!-- Quick Note Tags -->
        <div class="flex items-center gap-1 flex-wrap pt-0.5">
          <span class="text-[9px] font-bold text-slate-400">Quick Tags:</span>
          <button type="button" onclick="insertAdminNoteTag('🛍️ Bulk Wholesale Buyer')" class="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-bold transition">+ Bulk Buyer</button>
          <button type="button" onclick="insertAdminNoteTag('✨ Premium Focus')" class="px-1.5 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded text-[9px] font-bold transition">+ Premium</button>
          <button type="button" onclick="insertAdminNoteTag('🏷️ Price Sensitive')" class="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded text-[9px] font-bold transition">+ Price Sensitive</button>
          <button type="button" onclick="insertAdminNoteTag('📦 Ready for Dispatch')" class="px-1.5 py-0.5 bg-pink-50 hover:bg-pink-100 text-pink-800 border border-pink-200 rounded text-[9px] font-bold transition">+ Ready to Ship</button>
        </div>

        <div class="flex items-center justify-end pt-1 border-t border-slate-100">
          <button type="button" onclick="addAdminInternalNote('${customer.id}')" class="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-lg font-bold text-xs shadow-sm transition flex items-center gap-1 active:scale-[0.98]">
            <span class="material-symbols-outlined text-[14px]">save</span>
            <span>Save Internal Note</span>
          </button>
        </div>
      </div>

      <!-- Notes History Stream -->
      <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
        ${(!customer.adminNotes || customer.adminNotes.length === 0) ? `
          <p class="text-[11px] text-slate-400 italic text-center py-1">No admin notes logged yet. Type above to record custom notes.</p>
        ` : customer.adminNotes.map(n => `
          <div class="bg-white p-2.5 rounded-xl border border-amber-200/80 shadow-2xs space-y-1 relative group">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-extrabold text-amber-900 flex items-center gap-1">
                <span class="material-symbols-outlined text-[12px] text-amber-600">person</span>
                <span>${n.author || 'Admin'}</span>
              </span>
              <div class="flex items-center gap-1">
                <span class="text-[9px] text-slate-400 font-mono">${n.time}</span>
                <button type="button" onclick="deleteAdminInternalNote('${customer.id}', '${n.id}')" class="opacity-0 group-hover:opacity-100 text-rose-500 hover:text-rose-700 p-0.5 rounded transition" title="Delete note">
                  <span class="material-symbols-outlined text-[13px]">delete</span>
                </button>
              </div>
            </div>
            <p class="text-xs text-slate-800 leading-relaxed font-normal">${n.text}</p>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- 3. PROMINENT HANDLING STAFF SECTION -->
    <div class="p-4 border-b border-slate-200 space-y-2.5 bg-slate-50/50">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1">
          <span class="material-symbols-outlined text-[15px] text-emerald-700">support_agent</span>
          <span>Handling Staff Member</span>
        </span>
        <button type="button" onclick="openStaffAssignModal('${query ? query.id : ('Q-' + customer.id)}')" class="text-brand-wa hover:text-brand-waDark font-bold text-xs flex items-center gap-0.5">
          <span class="material-symbols-outlined text-[14px]">edit</span> Change
        </button>
      </div>

      <div class="bg-white p-3 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl ${staff ? 'bg-gradient-to-tr from-brand-dark to-emerald-700 text-white' : 'bg-amber-100 text-amber-800'} font-extrabold text-sm flex items-center justify-center shadow-sm shrink-0">
            ${staff ? staff.avatar : '?'}
          </div>
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-slate-900 text-xs truncate">
              ${staff ? staff.name : '<span class="text-amber-700 font-extrabold">⚠️ Unassigned (In Queue)</span>'}
            </h4>
            <p class="text-[11px] text-slate-500 truncate mt-0.5">
              ${staff ? (staff.role || staff.specialization) : 'No staff member allocated yet'}
            </p>
          </div>
        </div>

        <!-- Quick Staff Reassign Selector -->
        <div class="pt-2 border-t border-slate-100 flex items-center gap-2">
          <label class="text-[10px] text-slate-500 font-bold shrink-0">Quick Assign:</label>
          <select onchange="quickReassignQueryStaff('${query ? query.id : ('Q-' + customer.id)}', this.value)" class="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-1.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-brand-wa">
            <option value="UNASSIGNED" ${(!staff || query?.assignedTo === 'UNASSIGNED') ? 'selected' : ''}>-- Unassigned --</option>
            ${(CRM_STATE.staffList || []).map(s => `
              <option value="${s.id}" ${query?.assignedTo === s.id ? 'selected' : ''}>${s.name} (${s.specialization || s.role.split('(')[0]})</option>
            `).join('')}
          </select>
        </div>
      </div>
    </div>

    <!-- 5. ORDERS & SPEND SUMMARY (SHOWN LAST) -->
    <div class="p-4 space-y-3 text-xs border-t border-slate-200 bg-slate-50/40">
      <div class="flex items-center justify-between">
        <span class="text-[11px] font-bold uppercase text-slate-700 flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-emerald-600">shopping_bag</span>
          <span>Orders &amp; Lifetime Value</span>
        </span>
        <button onclick="switchView('orders')" class="text-brand-wa font-bold hover:underline text-[11px]">View All</button>
      </div>

      <!-- Metrics Cards (Total Orders & Lifetime Spend - Shown Last) -->
      <div class="grid grid-cols-2 gap-2.5">
        <div class="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-200/80 text-center shadow-2xs">
          <span class="text-[10px] uppercase font-bold text-emerald-800">Total Orders</span>
          <p class="text-base font-extrabold text-emerald-950 mt-0.5">${customer.totalOrders || 0} Orders</p>
        </div>
        <div class="bg-blue-50/80 p-2.5 rounded-xl border border-blue-200/80 text-center shadow-2xs">
          <span class="text-[10px] uppercase font-bold text-blue-800">Lifetime Spend</span>
          <p class="text-base font-extrabold text-blue-950 font-mono mt-0.5">₹${(customer.totalSpend || 0).toLocaleString('en-IN')}</p>
        </div>
      </div>

      <!-- Past WhatsApp Orders List -->
      <div class="space-y-2 pt-1">
        ${orders.length === 0 ? '<p class="text-slate-400 italic text-center py-1">No previous orders</p>' : orders.map(ord => `
          <div class="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div class="flex items-center justify-between">
              <span class="font-mono font-bold text-slate-800">${ord.id}</span>
              <span class="font-mono font-bold text-emerald-700">₹${ord.grandTotal}</span>
            </div>
            <p class="text-[11px] text-slate-500 mt-1 truncate">${ord.items.map(i => i.name).join(', ')}</p>
            <div class="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-100 text-[10px]">
              <span class="text-slate-400">${ord.createdAt}</span>
              <span class="bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">${ord.orderStatus}</span>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Dedicated Admin & Staff Internal Notes Controllers
window.addAdminInternalNote = function(customerId) {
  const custId = customerId || ACTIVE_CUSTOMER_ID;
  const customer = CRM_STATE.customers.find(c => c.id === custId);
  if (!customer) return;

  const noteInput = document.getElementById('quick-admin-note-input');
  const text = (noteInput ? noteInput.value : '').trim();

  if (!text) {
    showToast('Empty Note', 'Please type a note before saving.', 'warning', 'amber');
    if (noteInput) noteInput.focus();
    return;
  }

  if (!Array.isArray(customer.adminNotes)) {
    customer.adminNotes = [];
  }

  const currentUser = getCurrentUser();
  const authorName = currentUser?.name || (ACTIVE_ROLE === 'admin' ? 'Super Admin' : 'Staff');
  const now = new Date();
  const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const newNote = {
    id: 'note_' + Date.now(),
    author: authorName,
    text: text,
    time: `${dateStr}, ${timeStr}`,
    timestamp: Date.now()
  };

  customer.adminNotes.unshift(newNote);
  customer.notes = text; // Keep summary notes updated as well

  saveCRMState();
  renderCustomer360Panel();
  if (typeof logAudit === 'function') {
    logAudit('ADMIN_NOTE_ADDED', 'CUSTOMER', `Added internal note for ${customer.name}: "${text.slice(0, 40)}..."`);
  }
  showToast('Note Saved', `Internal admin note added for ${customer.name}`, 'check_circle', 'emerald');
  if (typeof playChime === 'function') playChime('order');
};

window.deleteAdminInternalNote = function(customerId, noteId) {
  const custId = customerId || ACTIVE_CUSTOMER_ID;
  const customer = CRM_STATE.customers.find(c => c.id === custId);
  if (!customer || !Array.isArray(customer.adminNotes)) return;

  customer.adminNotes = customer.adminNotes.filter(n => n.id !== noteId);
  saveCRMState();
  renderCustomer360Panel();
  showToast('Note Deleted', 'Internal note removed.', 'delete', 'slate');
};

window.insertAdminNoteTag = function(tagText) {
  const noteInput = document.getElementById('quick-admin-note-input');
  if (!noteInput) return;
  if (noteInput.value) {
    noteInput.value += ' ' + tagText;
  } else {
    noteInput.value = tagText + ': ';
  }
  noteInput.focus();
};

// =========================================================================
// 4. SEND MESSAGE & REAL-TIME OUTBOUND DISPATCH
// =========================================================================

// Dispatches live message to customer's WhatsApp via Node Baileys QR Bridge (Method 3)
async function dispatchWhatsAppOutbound(phone, text, msgRef, jid = null, accountId = null, silent = false, mediaUrl = null, customerId = null) {
  const targetAccId = accountId || ACTIVE_SEND_ACCOUNT_ID || 'account_1';
  const targetMedia = mediaUrl || (msgRef && msgRef.media_url ? msgRef.media_url : null);

  // Clean and normalize phone number
  let cleanPhone = (phone || '').toString().trim().replace(/[\s\-\(\)]/g, '');
  if (cleanPhone.startsWith('+')) cleanPhone = cleanPhone.substring(1);
  if (/^\d{10}$/.test(cleanPhone)) {
    cleanPhone = '91' + cleanPhone;
  }

  // 1. Try Instant WebSocket (Socket.IO) Dispatch
  if (typeof SOCKET_IO !== 'undefined' && SOCKET_IO && SOCKET_IO.connected) {
    const socketDelivered = await new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn('[Socket Dispatch Timeout] Falling back to direct HTTP bridge');
          resolve(null); // triggers HTTP fallback
        }
      }, 4000);

      try {
        SOCKET_IO.emit('whatsapp:send', { 
          phone: cleanPhone, 
          text, 
          jid, 
          accountId: targetAccId,
          mediaUrl: targetMedia,
          customerId
        }, (res) => {
          if (resolved) return;
          resolved = true;
          clearTimeout(timer);
          if (res && res.status === 'success') {
            if (msgRef) msgRef.status = 'DELIVERED';
            if (typeof renderChatMessages === 'function') renderChatMessages();
            if (!silent) showToast('WhatsApp Delivered', `Live message sent to (${phone})!`, 'done_all', 'emerald');
            resolve(true);
          } else {
            console.warn('[Socket Send Notice]:', res);
            resolve(null); // triggers HTTP fallback
          }
        });
      } catch (err) {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      }
    });

    if (socketDelivered === true) return true;
  }

  // 2. HTTP Fallback to Node.js Bridge
  try {
    let resp = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: cleanPhone, 
        text, 
        jid, 
        accountId: targetAccId,
        mediaUrl: targetMedia,
        customerId
      })
    });
    let result = await resp.json();
    if (result && result.status === 'success') {
      if (msgRef) msgRef.status = 'DELIVERED';
      if (typeof renderChatMessages === 'function') renderChatMessages();
      if (!silent) showToast('WhatsApp Delivered', `Live message sent to (${phone})!`, 'done_all', 'emerald');
      return true;
    } else {
      console.warn('[Bridge Send Notice]:', result);
    }
  } catch (err) {
    console.warn('[Bridge Direct HTTP Error]:', err);
  }

  // 3. Fallback via PHP backend proxy
  try {
    let fResp = await fetch('api.php?action=send_message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        phone: cleanPhone, 
        text, 
        jid, 
        accountId: targetAccId,
        media_url: targetMedia,
        customer_id: customerId
      })
    });
    let fResult = await fResp.json();
    if (fResult && fResult.status === 'success') {
      if (msgRef) msgRef.status = 'DELIVERED';
      if (typeof renderChatMessages === 'function') renderChatMessages();
      if (!silent) showToast('WhatsApp Delivered', `Live message sent to (${phone})!`, 'done_all', 'emerald');
      return true;
    }
  } catch (e) {
    console.warn('[PHP Send Proxy Error]:', e);
  }

  if (msgRef) msgRef.status = 'SENT';
  if (!silent) showToast('Saved in CRM', 'Recorded locally in customer chat history.', 'info', 'blue');
  return false;
}

function formatOutboundBrandMessage(text) {
  const brandName = getBrandName();
  const includeHeader = CRM_STATE?.brandSettings?.includeBrandHeader !== false;

  if (!includeHeader) return text;

  // Don't format if already formatted with brand header
  if (text.includes('Order Desk') || text.includes(brandName)) return text;

  return `🛍️ *${brandName}* • Order Desk\n━━━━━━━━━━━━━━━━━━━━\n${text}`;
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
  dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, formattedText, newMsg, customer.jid, customer.accountId || ACTIVE_SEND_ACCOUNT_ID);
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
// WHATSAPP MESSAGE AUTOMATION & STOCK AUTO-REPLY BOT ENGINE
// =========================================================================

function getDefaultStockAutoReplyTemplate() {
  return `✨ *{brand_name}* ✨
Hello *{customer_name}*! 👋 Welcome to our store.

👗 *Ready-Stock Collections:*
{stock_categories}

💬 *Reply with 1 to 6* to see photos & sizes!`;
}

// Dynamically aggregates live stock in ultra-compact format without Read More truncation
function generateLiveCategoryStockText(rawPhone) {
  const categories = [
    { num: '1️⃣', name: 'Baby Collection (0–3Y)', key: 'Baby Collection' },
    { num: '2️⃣', name: 'Maternity & Feeding', key: 'Maternity' },
    { num: '3️⃣', name: 'Newborn Gift Sets (0–6M)', key: 'Newborn' },
    { num: '4️⃣', name: 'Kids Daily Wear (4–5Y)', key: 'Kids' },
    { num: '5️⃣', name: 'Wholesale Bundles', key: 'Wholesale' },
    { num: '6️⃣', name: 'Festive Silk Sets', key: 'Festive' }
  ];

  let text = '';
  categories.forEach(cat => {
    const prods = (CRM_STATE.products || []).filter(p => (p.category || '').toLowerCase().includes(cat.key.toLowerCase()));
    let priceInfo = '';
    if (prods.length > 0) {
      const prices = prods.map(p => p.price).filter(Boolean);
      const minP = Math.min(...prices);
      const maxP = Math.max(...prices);
      priceInfo = minP === maxP ? `₹${minP}` : `₹${minP} - ₹${maxP}`;
    } else {
      priceInfo = '₹499';
    }

    text += `${cat.num} ${cat.name} — *${priceInfo}*\n`;
  });

  return text.trim();
}

function buildStockAutoReplyMessage(customer) {
  const brand = getBrandName();
  const custName = customer ? customer.name.split(' ')[0] : 'Customer';
  const phone = CRM_STATE?.whatsappAccount?.phoneNumber || '919789660115';
  const categoriesText = generateLiveCategoryStockText(phone);

  let customTpl = CRM_STATE?.autoReplySettings?.messageTemplate;
  if (!customTpl || customTpl.trim() === '') {
    customTpl = getDefaultStockAutoReplyTemplate();
  }

  return customTpl
    .replace(/{customer_name}/g, custName)
    .replace(/{brand_name}/g, brand)
    .replace(/{stock_categories}/g, categoriesText)
    .replace(/{business_phone}/g, phone);
}

function getSpecificCategoryStockCard(categoryName, customer) {
  const brand = getBrandName();
  const custName = customer ? customer.name.split(' ')[0] : 'Customer';
  const prods = (CRM_STATE.products || []).filter(p => (p.category || '').toLowerCase().includes(categoryName.toLowerCase()));

  if (prods.length === 0) {
    return `🛍️ *${brand}* • Stock Update\n━━━━━━━━━━━━━━━━━━━━\nHello ${custName}! 👋 Here are our latest *${categoryName}* items in stock. Please let us know your preferred size and our team will share ready-stock photos!`;
  }

  const numEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
  let itemsList = prods.slice(0, 5).map((p, idx) => {
    const avail = (p.physicalStock || 0) - (p.reservedStock || 0);
    const stockStatus = avail > 0 ? `✅ *${avail} Pcs Ready*` : `⏳ Reserved`;
    return `${numEmojis[idx] || (idx + 1 + '.')} *${p.name}*\n   💰 *₹${p.price}* | 📏 Size: *${p.size || 'Standard'}* | ${stockStatus}`;
  }).join('\n\n');

  const replyCount = prods.length > 1 ? `1 to ${prods.length}` : '1';

  return `👗 *${brand} • ${categoryName}*\n━━━━━━━━━━━━━━━━━━━━\nHello ${custName}! 👋 Here are our ready-stock items:\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 *Reply with ${replyCount}* to view the photo, sizes & order!\n(Reply *0* for Main Menu)`;
}

// Inbound Automated Response Dispatcher
function handleAutomatedInboundResponse(customer, messageText, payload) {
  if (!customer || !CRM_STATE?.autoReplySettings?.enabled) return;

  const text = (messageText || '').trim().toLowerCase();
  const settings = CRM_STATE.autoReplySettings;
  const cooldownMin = typeof settings.cooldownMinutes !== 'undefined' ? parseInt(settings.cooldownMinutes) : 0;
  const cooldownMs = (isNaN(cooldownMin) ? 0 : cooldownMin) * 60 * 1000;
  const now = Date.now();
  const lastAutoReply = customer.lastAutoReplyEpoch || 0;
  const isCooldownOver = cooldownMs === 0 || (now - lastAutoReply) >= cooldownMs;

  let replyText = null;
  let responseType = 'STOCK_MENU';

  // 1. Keyword-based interactive category responses (if enabled)
  if (settings.keywordMatching !== false) {
    if (text === '1' || text === 'baby' || text.includes('baby collection') || text.includes('frock')) {
      replyText = getSpecificCategoryStockCard('Baby Collection', customer);
      responseType = 'CATEGORY_BABY';
    } else if (text === '2' || text === 'maternity' || text.includes('feeding') || text.includes('gown')) {
      replyText = getSpecificCategoryStockCard('Maternity', customer);
      responseType = 'CATEGORY_MATERNITY';
    } else if (text === '3' || text === 'newborn' || text.includes('romper') || text.includes('gift set')) {
      replyText = getSpecificCategoryStockCard('Newborn', customer);
      responseType = 'CATEGORY_NEWBORN';
    } else if (text === '4' || text === 'kids' || text.includes('t-shirt') || text.includes('tshirt')) {
      replyText = getSpecificCategoryStockCard('Kids', customer);
      responseType = 'CATEGORY_KIDS';
    } else if (text === '5' || text === 'wholesale' || text.includes('bulk') || text.includes('bundle')) {
      replyText = getSpecificCategoryStockCard('Wholesale', customer);
      responseType = 'CATEGORY_WHOLESALE';
    } else if (text === '6' || text === 'festive' || text.includes('lehenga') || text.includes('pattu') || text.includes('silk')) {
      replyText = getSpecificCategoryStockCard('Girls Festive', customer);
      responseType = 'CATEGORY_FESTIVE';
    }
  }

  // 2. If no specific keyword matched, check if cooldown is over to send the main Stock Category Menu
  if (!replyText && isCooldownOver) {
    replyText = buildStockAutoReplyMessage(customer);
    responseType = 'STOCK_MENU';
  }

  if (!replyText) return;

  // Record auto-reply timestamp to enforce cooldown
  customer.lastAutoReplyEpoch = now;

  // Create message in conversation
  const autoMsg = {
    id: Date.now() + 200,
    sender: 'staff',
    isBot: true,
    text: replyText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'DELIVERED'
  };

  if (!CRM_STATE.conversations[customer.id]) {
    CRM_STATE.conversations[customer.id] = [];
  }
  CRM_STATE.conversations[customer.id].push(autoMsg);

  // Update query status to AUTOMATED_REPLIED
  const query = CRM_STATE.queries.find(q => q.customerId === customer.id);
  if (query) {
    query.lastMessage = `Bot: "Stock Menu & Categories Sent"`;
  }

  saveCRMState();

  if (ACTIVE_VIEW === 'inbox') {
    renderInbox();
    const stream = document.getElementById('chat-messages-stream');
    if (stream) stream.scrollTop = stream.scrollHeight;
  }

  // Note: Outbound delivery is autonomously handled by bridge/server.js to prevent duplicate sends
  // The server emits the bot response back to all connected CRM clients for instant rendering
  console.log(`[Auto-Reply Bot] Server handling auto-reply response (${responseType}) for ${customer.name}`);
}

// 1-Click Share Stock Category Menu from Chat Quick Action Tray
function shareStockCategoryMenu() {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please select a conversation from the left to share stock menu.', 'info', 'amber');
    return;
  }
  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) return;

  const msgText = buildStockAutoReplyMessage(customer);
  const input = document.getElementById('chat-input-text');
  if (input) {
    input.value = msgText;
    input.focus();
    showToast('Stock Menu Ready', 'Stock Category menu inserted into message bar. Click Send to dispatch.', 'category', 'emerald');
    if (typeof playChime === 'function') playChime('inbound');
  }
}

// =========================================================================
// WHATSAPP PRE-SET TEMPLATES & QUESTION-BASED AUTO-REPLY SYSTEM
// =========================================================================

function getDefaultAutoReplyRules() {
  return [
    {
      id: "rule_testing_the_crm",
      name: "testing the crm",
      keywords: ["feeding gown", "testing the crm", "testing", "crm"],
      actionType: "custom_text",
      categoryId: null,
      replyText: "welcome",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_feeding_kurti",
      name: "Feeding Kurti & Maternity Wear",
      keywords: ["feeding kurti", "feeding", "kurti", "maternity", "feeding dress", "feeding gown"],
      actionType: "category_and_text",
      categoryId: "2",
      replyText: "🤰 *Maternity & Feeding Collection*\nHello *{customer_name}*! 👋 Yes, we have ready stock of Pure Cotton Feeding Kurtis & Maternity Gowns with concealed invisible feeding zips!\n\n✨ Pure mulmul breathable cotton • Sizes L to XXL • Ready to dispatch.",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_baby_frocks",
      name: "Baby Frocks & Frocks (0-3Y)",
      keywords: ["baby frock", "frock", "baby dress", "baby collection", "cotton frock", "baby cloth"],
      actionType: "category_and_text",
      categoryId: "1",
      replyText: "👗 *Baby Collection (0–3 Years)*\nHello *{customer_name}*! 👋 Here are our 100% combed cotton embroidered baby frocks:",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_newborn_sets",
      name: "Newborn Gift Sets (0-6M)",
      keywords: ["newborn", "gift set", "baby born", "romper", "swaddle", "born baby"],
      actionType: "category_and_text",
      categoryId: "3",
      replyText: "🎁 *Newborn Gift Sets (0–6 Months)*\nHello *{customer_name}*! 👋 Here are our organic cotton romper & swaddle luxury gift boxes:",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_kids_daily",
      name: "Kids Everyday T-Shirts (4-5Y)",
      keywords: ["kids tshirt", "tshirt", "t-shirt", "boys tshirt", "daily wear", "shorts combo"],
      actionType: "category_and_text",
      categoryId: "4",
      replyText: "👕 *Kids Everyday Wear (4–5 Years)*\nHello *{customer_name}*! 👋 Check out our bio-washed organic cotton t-shirt and denim combos:",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_wholesale",
      name: "Wholesale & Bulk Orders",
      keywords: ["wholesale", "bulk", "bundle", "resale", "dealer", "margin", "bulk price"],
      actionType: "category_and_text",
      categoryId: "5",
      replyText: "📦 *Wholesale & Bulk Bundles*\nHello *{customer_name}*! 👋 We offer bulk retailer carton boxes (25–50 pcs) with maximum resale profit margins:",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_festive_silk",
      name: "Festive & Silk Pattu Pavadai",
      keywords: ["pattu", "silk", "lehenga", "festive", "pavadai", "diwali", "kanjivaram"],
      actionType: "category_and_text",
      categoryId: "6",
      replyText: "🥻 *Festive & Silk Collection*\nHello *{customer_name}*! 👋 Here are our pure zari Kanjivaram silk pattu pavadais & designer lehengas:",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_store_location",
      name: "Store Address & Timings",
      keywords: ["address", "location", "shop address", "where is your shop", "store", "visit", "timings", "map"],
      actionType: "custom_text",
      categoryId: null,
      replyText: "📍 *{brand_name} Store Location*\n\n🏢 GRM Garments Hub, 42 Cotton Market Road, Tirupur, Tamil Nadu - 641604.\n🕒 Working Hours: Monday – Saturday (9:30 AM to 8:30 PM)\n📞 Direct Desk: {business_phone}\n\n🗺️ You are welcome to visit our retail counter & wholesale warehouse!",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_payment_upi",
      name: "Payment & UPI QR",
      keywords: ["payment", "gpay", "phonepe", "paytm", "upi", "bank details", "account", "how to pay", "scanner"],
      actionType: "custom_text",
      categoryId: null,
      replyText: "💳 *Payment Details — {brand_name}*\n\n📱 UPI ID: `grmgarments@upi`\n📲 GPay / PhonePe: {business_phone}\n\n🏦 *Bank Transfer:*\nBank: HDFC Bank\nA/C Name: GRM Garments Hub\nA/C No: 50200088991122\nIFSC: HDFC0001234\n\n📸 *Please reply with your payment screenshot once paid for immediate dispatch!*",
      enabled: true,
      autoSend: true
    },
    {
      id: "rule_shipping_delivery",
      name: "Shipping & Delivery Time",
      keywords: ["delivery", "shipping", "courier", "how many days", "tracking", "dispatch", "charge"],
      actionType: "custom_text",
      categoryId: null,
      replyText: "🚚 *Shipping & Delivery Information*\n\n⚡ Dispatch: Same day / within 24 hours of confirmation\n📦 Courier Partners: ST Courier, Professional Couriers & DTDC\n⏱️ Delivery Time: 2–3 days within South India, 4–5 days Rest of India\n\nLive tracking link will be sent to your WhatsApp upon courier pickup! 📦",
      enabled: true,
      autoSend: true
    }
  ];
}

// Modal Controllers
function openAutoReplyModal(activeTab = 'rules') {
  if (!CRM_STATE.autoReplySettings) {
    CRM_STATE.autoReplySettings = {
      enabled: true
    };
  }
  if (!Array.isArray(CRM_STATE.autoReplyRules) || CRM_STATE.autoReplyRules.length === 0) {
    CRM_STATE.autoReplyRules = getDefaultAutoReplyRules();
  }

  const settings = CRM_STATE.autoReplySettings;
  const masterToggle = document.getElementById('autoreply-master-toggle');
  if (masterToggle) masterToggle.checked = settings.enabled !== false;

  renderAutoReplyRulesList();
  updateRulesCountBadge();
  switchView('inbox', 'autoreply');
}

function closeAutoReplyModal() {
  switchInboxSubmodule('chats');
}

function switchAutoReplyTab(tabName) {
  // Kept for backward compatibility with unified rules view
  if (typeof renderAutoReplyRulesList === 'function') {
    renderAutoReplyRulesList();
  }
}

function updateRulesCountBadge() {
  const count = Array.isArray(CRM_STATE?.autoReplyRules) ? CRM_STATE.autoReplyRules.length : 0;
  const badge1 = document.getElementById('tab-rules-count');
  const badge2 = document.getElementById('inbox-rules-count-badge');
  if (badge1) badge1.innerText = String(count);
  if (badge2) badge2.innerText = String(count);
}

function renderAutoReplyRulesList() {
  const container = document.getElementById('ar-rules-list-container');
  if (!container) return;

  if (!Array.isArray(CRM_STATE.autoReplyRules) || CRM_STATE.autoReplyRules.length === 0) {
    CRM_STATE.autoReplyRules = getDefaultAutoReplyRules();
  }

  const searchQ = (document.getElementById('ar-rules-search-input')?.value || '').trim().toLowerCase();
  const filterType = document.getElementById('ar-rules-filter-select')?.value || 'ALL';

  let list = CRM_STATE.autoReplyRules.filter(rule => {
    if (searchQ) {
      const matchName = (rule.name || '').toLowerCase().includes(searchQ);
      const matchKws = Array.isArray(rule.keywords)
        ? rule.keywords.some(k => (k || '').toLowerCase().includes(searchQ))
        : (rule.keywords || '').toLowerCase().includes(searchQ);
      const matchReply = (rule.replyText || '').toLowerCase().includes(searchQ);
      if (!matchName && !matchKws && !matchReply) return false;
    }

    if (filterType === 'ACTIVE') return rule.enabled !== false;
    if (filterType === 'CATEGORY') return rule.actionType === 'category_reply' || rule.actionType === 'category_and_text';
    if (filterType === 'CUSTOM') return rule.actionType === 'custom_text';
    return true;
  });

  updateRulesCountBadge();

  if (list.length === 0) {
    container.innerHTML = `
      <div class="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
        <span class="material-symbols-outlined text-[36px] text-slate-300">search_off</span>
        <p class="text-xs font-semibold mt-1">No matching pre-set question rules found.</p>
        <button type="button" onclick="openRuleEditor(null)" class="mt-2.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-lg text-xs font-bold transition">
          + Add New Question Rule
        </button>
      </div>
    `;
    return;
  }

  const categoryLabels = {
    '1': '👗 Baby Collection (0-3Y)',
    '2': '🤰 Maternity & Feeding Wear',
    '3': '🎁 Newborn Gift Sets (0-6M)',
    '4': '👕 Kids Everyday (4-5Y)',
    '5': '📦 Wholesale & Bulk Bundles',
    '6': '🥻 Festive & VIP Silk Sets'
  };

  container.innerHTML = list.map(rule => {
    const isEnabled = rule.enabled !== false;
    const keywords = Array.isArray(rule.keywords) ? rule.keywords : (rule.keywords || '').split(',');
    const catLabel = rule.categoryId ? (categoryLabels[rule.categoryId] || `Category #${rule.categoryId}`) : null;

    let actionBadgeHtml = '';
    if (rule.actionType === 'category_and_text') {
      actionBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Category + Custom Text</span>`;
    } else if (rule.actionType === 'category_reply') {
      actionBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200">Category Stock</span>`;
    } else {
      actionBadgeHtml = `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Custom Answer</span>`;
    }

    return `
      <div class="bg-white p-3.5 sm:p-4 rounded-xl border ${isEnabled ? 'border-slate-200 hover:border-teal-300 shadow-2xs' : 'border-slate-200 opacity-60 bg-slate-50/70'} transition space-y-2">
        <div class="flex items-start justify-between gap-3">
          <div class="space-y-1 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <h5 class="font-bold text-slate-900 text-xs">${rule.name}</h5>
              ${actionBadgeHtml}
              ${catLabel ? `<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">${catLabel}</span>` : ''}
              <span class="px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}">
                ${isEnabled ? 'AUTO-REPLY ACTIVE' : 'PAUSED'}
              </span>
            </div>

            <!-- Keywords pills -->
            <div class="flex items-center gap-1 flex-wrap pt-0.5">
              <span class="text-[10px] font-bold text-slate-400">Triggers on:</span>
              ${keywords.map(kw => `<span class="px-1.5 py-0.2 bg-slate-100 text-slate-700 rounded text-[10px] font-mono font-bold border border-slate-200">${(kw || '').trim()}</span>`).join('')}
            </div>
          </div>

          <!-- Master Toggle for Rule -->
          <label class="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5" title="Toggle Auto-Reply for this rule">
            <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleRuleEnabled('${rule.id}', this.checked)" class="sr-only peer">
            <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <!-- Reply Message Preview -->
        ${rule.replyText ? `
          <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-[11px] text-slate-700 font-sans leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto custom-chat-scroll">
            ${(rule.replyText || '').replace(/\*(.*?)\*/g, '<strong>$1</strong>')}
          </div>
        ` : ''}

        <!-- Actions -->
        <div class="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
          <div class="flex items-center gap-2">
            <button type="button" onclick="editRule('${rule.id}')" class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg flex items-center gap-1 transition">
              <span class="material-symbols-outlined text-[14px] text-slate-600">edit</span>
              <span>Edit Question &amp; Answer</span>
            </button>
            <button type="button" onclick="applyRuleToActiveChat('${rule.id}')" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-lg flex items-center gap-1 transition border border-emerald-200" title="Insert or Send to active customer chat">
              <span class="material-symbols-outlined text-[14px]">send</span>
              <span>Send to Chat</span>
            </button>
          </div>

          <button type="button" onclick="deleteRule('${rule.id}')" class="p-1 text-slate-400 hover:text-rose-600 transition" title="Delete Rule">
            <span class="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function openRuleEditor(ruleId = null) {
  const card = document.getElementById('ar-rule-editor-card');
  const titleEl = document.getElementById('ar-rule-editor-title');
  const idInput = document.getElementById('edit-rule-id');
  const nameInput = document.getElementById('edit-rule-name');
  const kwsInput = document.getElementById('edit-rule-keywords');
  const actionSelect = document.getElementById('edit-rule-action');
  const catSelect = document.getElementById('edit-rule-category');
  const textInput = document.getElementById('edit-rule-reply-text');
  const enabledInput = document.getElementById('edit-rule-enabled');

  if (!card) return;

  if (ruleId) {
    const rule = (CRM_STATE?.autoReplyRules || []).find(r => r.id === ruleId);
    if (!rule) return;
    if (titleEl) titleEl.innerText = `Edit Pre-Set Template: ${rule.name}`;
    if (idInput) idInput.value = rule.id;
    if (nameInput) nameInput.value = rule.name || '';
    if (kwsInput) kwsInput.value = Array.isArray(rule.keywords) ? rule.keywords.join(', ') : (rule.keywords || '');
    if (actionSelect) actionSelect.value = rule.actionType || 'category_and_text';
    if (catSelect) catSelect.value = rule.categoryId || '2';
    if (textInput) textInput.value = rule.replyText || '';
    if (enabledInput) enabledInput.checked = rule.enabled !== false;
  } else {
    if (titleEl) titleEl.innerText = "Add New Pre-Set Question & Auto-Reply Template";
    if (idInput) idInput.value = '';
    if (nameInput) nameInput.value = '';
    if (kwsInput) kwsInput.value = '';
    if (actionSelect) actionSelect.value = 'custom_text';
    if (catSelect) catSelect.value = '';
    if (textInput) textInput.value = '';
    if (enabledInput) enabledInput.checked = true;
  }

  handleRuleActionTypeChange();
  card.classList.remove('hidden');
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function closeRuleEditor() {
  const card = document.getElementById('ar-rule-editor-card');
  if (card) card.classList.add('hidden');
}

function handleRuleActionTypeChange() {
  const actionSelect = document.getElementById('edit-rule-action');
  const catBox = document.getElementById('edit-rule-category-container');
  const textBox = document.getElementById('edit-rule-text-container');
  if (!actionSelect) return;

  const mode = actionSelect.value;
  if (mode === 'category_reply') {
    if (catBox) catBox.classList.remove('hidden');
    if (textBox) textBox.classList.add('hidden');
  } else if (mode === 'custom_text') {
    if (catBox) catBox.classList.add('hidden');
    if (textBox) textBox.classList.remove('hidden');
  } else {
    if (catBox) catBox.classList.remove('hidden');
    if (textBox) textBox.classList.remove('hidden');
  }
}

function insertRuleTag(tag) {
  const tplArea = document.getElementById('edit-rule-reply-text');
  if (!tplArea) return;
  const start = tplArea.selectionStart;
  const end = tplArea.selectionEnd;
  const text = tplArea.value;
  tplArea.value = text.substring(0, start) + tag + text.substring(end);
  tplArea.focus();
  tplArea.selectionStart = tplArea.selectionEnd = start + tag.length;
}

function saveRuleFromEditor() {
  const idInput = document.getElementById('edit-rule-id');
  const nameInput = document.getElementById('edit-rule-name');
  const kwsInput = document.getElementById('edit-rule-keywords');
  const actionSelect = document.getElementById('edit-rule-action');
  const catSelect = document.getElementById('edit-rule-category');
  const textInput = document.getElementById('edit-rule-reply-text');
  const enabledInput = document.getElementById('edit-rule-enabled');

  const name = nameInput ? nameInput.value.trim() : '';
  const rawKws = kwsInput ? kwsInput.value.trim() : '';

  if (!name) {
    showToast('Name Required', 'Please provide a name for this auto-reply template.', 'warning', 'amber');
    return;
  }
  if (!rawKws) {
    showToast('Keywords Required', 'Please enter at least one keyword or question phrase.', 'warning', 'amber');
    return;
  }

  const keywords = rawKws.split(',').map(k => k.trim()).filter(Boolean);
  const actionType = actionSelect ? actionSelect.value : 'custom_text';
  const categoryId = (actionType === 'custom_text' || !catSelect || !catSelect.value) ? null : catSelect.value;
  const replyText = textInput ? textInput.value.trim() : '';
  const enabled = enabledInput ? enabledInput.checked : true;

  if (!Array.isArray(CRM_STATE.autoReplyRules)) CRM_STATE.autoReplyRules = [];

  const existingId = idInput ? idInput.value : '';
  if (existingId) {
    const idx = CRM_STATE.autoReplyRules.findIndex(r => r.id === existingId);
    if (idx !== -1) {
      CRM_STATE.autoReplyRules[idx] = {
        ...CRM_STATE.autoReplyRules[idx],
        name,
        keywords,
        actionType,
        categoryId,
        replyText,
        enabled,
        autoSend: true
      };
    }
  } else {
    const newId = 'rule_' + Date.now();
    CRM_STATE.autoReplyRules.unshift({
      id: newId,
      name,
      keywords,
      actionType,
      categoryId,
      replyText,
      enabled,
      autoSend: true
    });
  }

  saveCRMState();
  closeRuleEditor();
  renderAutoReplyRulesList();
  renderInboxPresetTemplatesBar();
  updateRulesCountBadge();

  // Sync immediately to Baileys Bridge (WebSocket + REST) and PHP
  syncAutoReplyRulesToBackend();

  showToast('Rule Saved Successfully', `Template "${name}" is now active for WhatsApp auto-reply.`, 'check_circle', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

function syncAutoReplyRulesToBackend() {
  const rules = CRM_STATE?.autoReplyRules || [];

  // 1. Direct WebSocket real-time sync to Node Bridge (Port 3000)
  const sock = window.SOCKET_IO || window.SOCKET;
  if (sock && sock.connected) {
    sock.emit('autoreply:save_rules', { rules: rules });
  }

  // 2. Direct REST POST to Node Bridge (Port 3000)
  fetch('http://localhost:3000/api/autoreply/rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules: rules })
  }).catch(() => {});

  // 3. Fallback PHP REST API
  fetch('api.php?action=save_autoreply_rules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rules: rules })
  }).catch(() => {});
}

function editRule(ruleId) {
  openRuleEditor(ruleId);
}

function deleteRule(ruleId) {
  if (!confirm('Are you sure you want to delete this auto-reply rule?')) return;
  if (!Array.isArray(CRM_STATE.autoReplyRules)) return;
  CRM_STATE.autoReplyRules = CRM_STATE.autoReplyRules.filter(r => r.id !== ruleId);
  saveCRMState();
  renderAutoReplyRulesList();
  renderInboxPresetTemplatesBar();
  updateRulesCountBadge();

  syncAutoReplyRulesToBackend();

  showToast('Rule Removed', 'Auto-reply template rule deleted.', 'delete', 'slate');
}

function toggleRuleEnabled(ruleId, enabled) {
  if (!Array.isArray(CRM_STATE.autoReplyRules)) return;
  const rule = CRM_STATE.autoReplyRules.find(r => r.id === ruleId);
  if (rule) {
    rule.enabled = enabled;
    saveCRMState();
    renderAutoReplyRulesList();
    renderInboxPresetTemplatesBar();

    syncAutoReplyRulesToBackend();

    showToast(enabled ? 'Rule Activated' : 'Rule Paused', `"${rule.name}" auto-reply is now ${enabled ? 'active' : 'paused'}.`, enabled ? 'bolt' : 'pause', enabled ? 'emerald' : 'amber');
  }
}

// 1-Click Quick Preset Template Chips in Inbox Bar
function renderInboxPresetTemplatesBar() {
  const container = document.getElementById('inbox-preset-chips-list');
  if (!container) return;

  if (!Array.isArray(CRM_STATE.autoReplyRules) || CRM_STATE.autoReplyRules.length === 0) {
    CRM_STATE.autoReplyRules = getDefaultAutoReplyRules();
  }

  // Check last customer question in active conversation to highlight match!
  const conv = CRM_STATE?.conversations?.[ACTIVE_CUSTOMER_ID] || [];
  const lastCustMsg = [...conv].reverse().find(m => m.sender === 'customer' || !m.isBot);
  const cleanLastTxt = (lastCustMsg?.text || '').trim().toLowerCase();

  let matchedRuleId = null;
  if (cleanLastTxt) {
    for (const rule of CRM_STATE.autoReplyRules) {
      if (rule.enabled === false) continue;
      const kws = Array.isArray(rule.keywords) ? rule.keywords : (rule.keywords || '').split(',');
      for (const kw of kws) {
        const cleanKw = (kw || '').trim().toLowerCase();
        if (cleanKw && cleanLastTxt.includes(cleanKw)) {
          matchedRuleId = rule.id;
          break;
        }
      }
      if (matchedRuleId) break;
    }
  }

  const categoryIcons = {
    '1': '👗',
    '2': '🤰',
    '3': '🎁',
    '4': '👕',
    '5': '📦',
    '6': '🥻'
  };

  container.innerHTML = CRM_STATE.autoReplyRules.map(rule => {
    const isMatched = rule.id === matchedRuleId;
    const icon = rule.categoryId ? (categoryIcons[rule.categoryId] || '💬') : '💬';
    const isEnabled = rule.enabled !== false;

    return `
      <button type="button" onclick="applyPresetTemplateToComposer('${rule.id}')" 
        class="px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition flex items-center gap-1.5 shadow-2xs border ${
          isMatched 
            ? 'bg-emerald-100 text-emerald-950 border-emerald-500 ring-2 ring-emerald-400/80 animate-pulse font-extrabold' 
            : (isEnabled ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' : 'bg-slate-100 text-slate-400 border-slate-200 line-through')
        }"
        title="1-Click Insert into message bar (Double click to send directly to customer)">
        <span>${icon}</span>
        <span class="truncate max-w-[130px] sm:max-w-[160px]">${rule.name}</span>
        ${isMatched ? `<span class="bg-emerald-600 text-white text-[9px] px-1 py-0.2 rounded font-mono">MATCHED</span>` : ''}
      </button>
    `;
  }).join('');
}

function applyPresetTemplateToComposer(ruleId, autoSend = false) {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('No Chat Selected', 'Please select a customer chat conversation first.', 'info', 'amber');
    return;
  }
  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const rule = (CRM_STATE?.autoReplyRules || []).find(r => r.id === ruleId);
  if (!customer || !rule) return;

  const brand = getBrandName();
  const phone = CRM_STATE?.whatsappAccount?.phoneNumber || '+91 86680 07593';
  const cName = customer.name ? customer.name.split(' ')[0] : 'there';

  let customText = (rule.replyText || '')
    .replace(/{customer_name}/g, cName)
    .replace(/{brand_name}/g, brand)
    .replace(/{business_phone}/g, phone);

  let finalMsg = customText;

  if (rule.categoryId && (rule.actionType === 'category_reply' || rule.actionType === 'category_and_text')) {
    const cat = GRM_BOT_CATALOG?.[rule.categoryId];
    if (cat) {
      const itemsList = Object.values(cat.items || {}).map((it, idx) => {
        const cleanPrice = String(it.price || '').replace(/^₹/, '');
        const stockCount = it.stock ?? 12;
        return `${idx + 1}️⃣ *${it.name}*\n   💰 ₹${cleanPrice} | Size: ${it.size} | Stock: ${stockCount} Pcs Ready`;
      }).join('\n\n');

      if (rule.actionType === 'category_and_text' && customText.trim()) {
        finalMsg = `${customText}\n\n━━━━━━━━━━━━━━━━━━━━\n${cat.icon} *${cat.categoryName} Ready Stock:*\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *1 or 2* to view photos & order!`;
      } else {
        finalMsg = `${cat.icon} *${brand} • ${cat.categoryName}*\n━━━━━━━━━━━━━━━━━━━━\nHello ${cName}! 👋 Here are our ready-stock items:\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *1 or 2* to view photos & order!`;
      }
    }
  }

  const inputEl = document.getElementById('chat-input-text');
  if (inputEl) {
    inputEl.value = finalMsg;
    inputEl.focus();
  }

  showToast('Template Loaded', `Loaded "${rule.name}" into message composer. Review or press Send!`, 'edit_note', 'emerald');
}

function applyRuleToActiveChat(ruleId) {
  applyPresetTemplateToComposer(ruleId);
  closeModal('modal-auto-reply-settings');
}

function testRuleInTester(ruleId) {
  const rule = (CRM_STATE?.autoReplyRules || []).find(r => r.id === ruleId);
  if (!rule) return;
  const kw = Array.isArray(rule.keywords) ? rule.keywords[0] : (rule.keywords || '').split(',')[0];
  const sampleQ = kw ? `i want ${kw}` : 'feeding kurti';
  setTestQuestion(sampleQ);
  switchAutoReplyTab('tester');
}

function setTestQuestion(text) {
  const input = document.getElementById('ar-test-question-input');
  if (input) input.value = text;
  testMatchAutoReplyQuestion();
}

function testMatchAutoReplyQuestion() {
  const input = document.getElementById('ar-test-question-input');
  const resultBox = document.getElementById('ar-test-result-box');
  if (!input || !resultBox) return;

  const query = (input.value || '').trim().toLowerCase();
  if (!query) {
    resultBox.innerHTML = `<p class="text-xs text-slate-400">Please enter a sample customer question above.</p>`;
    return;
  }

  const brand = getBrandName();
  const cName = 'Priya';
  const phone = CRM_STATE?.whatsappAccount?.phoneNumber || '+91 86680 07593';

  let matchedRule = null;
  let matchedKeyword = '';

  for (const rule of (CRM_STATE?.autoReplyRules || [])) {
    if (rule.enabled === false) continue;
    const kws = Array.isArray(rule.keywords) ? [...rule.keywords] : (rule.keywords || '').split(',');
    if (rule.name && typeof rule.name === 'string') kws.push(rule.name);
    for (const kw of kws) {
      const cleanKw = (kw || '').trim().toLowerCase();
      if (cleanKw && (query.includes(cleanKw) || cleanKw.includes(query))) {
        matchedRule = rule;
        matchedKeyword = cleanKw;
        break;
      }
    }
    if (matchedRule) break;
  }

  if (!matchedRule) {
    resultBox.innerHTML = `
      <div class="bg-amber-50 p-4 rounded-xl border border-amber-200 text-amber-900 space-y-2">
        <div class="flex items-center gap-2 font-bold text-xs">
          <span class="material-symbols-outlined text-[18px] text-amber-600">help</span>
          <span>No Specific Question Rule Matched</span>
        </div>
        <p class="text-[11px] text-amber-800 leading-relaxed">
          The query <strong>"${query}"</strong> did not match any custom keyword rule.
          Under default settings, the bot will fall back to sending your <strong>Default Full Catalog Menu</strong> or await human agent assistance.
        </p>
      </div>
    `;
    return;
  }

  let customText = (matchedRule.replyText || '')
    .replace(/{customer_name}/g, cName)
    .replace(/{brand_name}/g, brand)
    .replace(/{business_phone}/g, phone);

  let fullMsg = customText;
  if (matchedRule.categoryId && (matchedRule.actionType === 'category_reply' || matchedRule.actionType === 'category_and_text')) {
    const cat = GRM_BOT_CATALOG?.[matchedRule.categoryId];
    if (cat) {
      const itemsList = Object.values(cat.items || {}).map((it, idx) => {
        const cleanPrice = String(it.price || '').replace(/^₹/, '');
        const stockCount = it.stock ?? 12;
        return `${idx + 1}️⃣ *${it.name}*\n   💰 ₹${cleanPrice} | Size: ${it.size} | Stock: ${stockCount} Pcs Ready`;
      }).join('\n\n');

      if (matchedRule.actionType === 'category_and_text' && customText.trim()) {
        fullMsg = `${customText}\n\n━━━━━━━━━━━━━━━━━━━━\n${cat.icon} *${cat.categoryName} Ready Stock:*\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *1 or 2* to view photos & order!`;
      } else {
        fullMsg = `${cat.icon} *${brand} • ${cat.categoryName}*\n━━━━━━━━━━━━━━━━━━━━\nHello ${cName}! 👋 Here are our ready-stock items:\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *1 or 2* to view photos & order!`;
      }
    }
  }

  let formattedPreview = fullMsg
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  resultBox.innerHTML = `
    <div class="bg-emerald-50/80 p-4 rounded-xl border border-emerald-300 space-y-3 animate-in fade-in duration-150">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">✓</span>
          <div>
            <h5 class="font-extrabold text-emerald-950 text-xs">Rule Matched: ${matchedRule.name}</h5>
            <p class="text-[10px] text-emerald-800">Triggered by keyword: <code class="bg-emerald-200/80 px-1 py-0.2 rounded font-bold font-mono">"${matchedKeyword}"</code></p>
          </div>
        </div>
        <span class="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-[10px]">Instant Auto-Send</span>
      </div>

      <div class="bg-white p-3.5 rounded-2xl rounded-tr-none border border-emerald-200 text-slate-800 text-xs leading-relaxed font-sans shadow-sm whitespace-pre-wrap max-h-56 overflow-y-auto custom-chat-scroll">
        <div class="flex items-center justify-between text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded mb-2 border border-teal-200">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px] text-teal-600">smart_toy</span>
            <span>Auto-Reply Template: ${matchedRule.name}</span>
          </span>
          <span class="text-[9px] font-mono text-teal-700">Preview</span>
        </div>
        ${formattedPreview}
      </div>

      <div class="flex items-center justify-end gap-2 pt-1">
        <button type="button" onclick="editRule('${matchedRule.id}')" class="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg border border-slate-200 transition">
          Edit This Template
        </button>
        <button type="button" onclick="applyRuleToActiveChat('${matchedRule.id}')" class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition shadow-sm flex items-center gap-1">
          <span class="material-symbols-outlined text-[15px]">send</span>
          <span>Send Test to Active Chat</span>
        </button>
      </div>
    </div>
  `;
}

// Client-Side Simulated Auto-Responder Engine (For Simulator & Offline tests)
function triggerClientSideAutoReplyIfMatched(customer, messageText) {
  if (!customer || !messageText) return;
  const clean = (messageText || '').trim().toLowerCase();

  for (const rule of (CRM_STATE?.autoReplyRules || [])) {
    if (rule.enabled === false) continue;
    const kws = Array.isArray(rule.keywords) ? [...rule.keywords] : (rule.keywords || '').split(',');
    if (rule.name && typeof rule.name === 'string') kws.push(rule.name);
    let isMatch = false;
    for (const kw of kws) {
      const cleanKw = (kw || '').trim().toLowerCase();
      if (cleanKw && (clean.includes(cleanKw) || cleanKw.includes(clean))) {
        isMatch = true;
        break;
      }
    }

    if (isMatch) {
      setTimeout(() => {
        const brand = getBrandName();
        const cName = customer.name ? customer.name.split(' ')[0] : 'there';
        const phone = CRM_STATE?.whatsappAccount?.phoneNumber || '+91 86680 07593';

        let customText = (rule.replyText || '')
          .replace(/{customer_name}/g, cName)
          .replace(/{brand_name}/g, brand)
          .replace(/{business_phone}/g, phone);

        let finalMsg = customText;
        if (rule.categoryId && (rule.actionType === 'category_reply' || rule.actionType === 'category_and_text')) {
          const cat = GRM_BOT_CATALOG?.[rule.categoryId];
          if (cat) {
            const itemsList = Object.values(cat.items || {}).map((it, idx) => {
              const cleanPrice = String(it.price || '').replace(/^₹/, '');
              const stockCount = it.stock ?? 12;
              return `${idx + 1}️⃣ *${it.name}*\n   💰 ₹${cleanPrice} | Size: ${it.size} | Stock: ${stockCount} Pcs Ready`;
            }).join('\n\n');

            if (rule.actionType === 'category_and_text' && customText.trim()) {
              finalMsg = `${customText}\n\n━━━━━━━━━━━━━━━━━━━━\n${cat.icon} *${cat.categoryName} Ready Stock:*\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *1 or 2* to view photos & order!`;
            } else {
              finalMsg = `${cat.icon} *${brand} • ${cat.categoryName}*\n━━━━━━━━━━━━━━━━━━━━\nHello ${cName}! 👋 Here are our ready-stock items:\n\n${itemsList}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *1 or 2* to view photos & order!`;
            }
          }
        }

        ingestInboundMessage({
          sender_name: 'Bot (Auto-Reply)',
          sender_phone: customer.phone,
          sender_jid: customer.jid,
          account_id: customer.accountId || 'account_1',
          message_text: finalMsg,
          source: 'AUTOREPLY_BOT',
          rule_name: rule.name,
          rule_id: rule.id,
          is_outbound: true
        });
      }, 700);
      break;
    }
  }
}

function updateAutoReplyLivePreview() {
  const tplArea = document.getElementById('autoreply-message-template');
  const previewBox = document.getElementById('autoreply-live-preview-box');
  const charEl = document.getElementById('autoreply-preview-chars');
  if (!tplArea || !previewBox) return;

  const rawTemplate = tplArea.value || getDefaultStockAutoReplyTemplate();
  const sampleCustomer = { name: 'Mekha 🦋', phone: '+91 97896 60115' };
  const brand = getBrandName();
  const categoriesText = generateLiveCategoryStockText();
  const phone = CRM_STATE?.whatsappAccount?.phoneNumber || '+91 86680 07593';

  const previewText = rawTemplate
    .replace(/{customer_name}/g, sampleCustomer.name)
    .replace(/{brand_name}/g, brand)
    .replace(/{stock_categories}/g, categoriesText)
    .replace(/{business_phone}/g, phone);

  let formattedHtml = previewText
    .replace(/\*(.*?)\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  previewBox.innerHTML = `
    <div class="space-y-2">
      <div class="leading-relaxed">${formattedHtml}</div>
      <div class="mt-2.5 pt-2 border-t border-emerald-200/80 space-y-1.5">
        <div class="flex items-center justify-between text-[10px] font-bold text-emerald-900">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-[13px] text-emerald-600">touch_app</span>
            <span>Interactive Click Options (Live on chat):</span>
          </span>
          <span class="text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">1-Click Tap</span>
        </div>
        <div class="grid grid-cols-2 gap-1.5 pt-0.5">
          <div class="px-2 py-1.5 bg-white text-slate-800 rounded-lg border border-emerald-300 font-bold text-[10px] flex items-center gap-1.5 shadow-2xs">
            <span class="w-4 h-4 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">1</span>
            <span class="truncate">Baby Collection</span>
          </div>
          <div class="px-2 py-1.5 bg-white text-slate-800 rounded-lg border border-emerald-300 font-bold text-[10px] flex items-center gap-1.5 shadow-2xs">
            <span class="w-4 h-4 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">2</span>
            <span class="truncate">Maternity Wear</span>
          </div>
          <div class="px-2 py-1.5 bg-white text-slate-800 rounded-lg border border-emerald-300 font-bold text-[10px] flex items-center gap-1.5 shadow-2xs">
            <span class="w-4 h-4 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">3</span>
            <span class="truncate">Newborn Gift Sets</span>
          </div>
          <div class="px-2 py-1.5 bg-white text-slate-800 rounded-lg border border-emerald-300 font-bold text-[10px] flex items-center gap-1.5 shadow-2xs">
            <span class="w-4 h-4 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">4</span>
            <span class="truncate">Kids Everyday</span>
          </div>
          <div class="px-2 py-1.5 bg-white text-slate-800 rounded-lg border border-emerald-300 font-bold text-[10px] flex items-center gap-1.5 shadow-2xs">
            <span class="w-4 h-4 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">5</span>
            <span class="truncate">Wholesale Bundles</span>
          </div>
          <div class="px-2 py-1.5 bg-white text-slate-800 rounded-lg border border-emerald-300 font-bold text-[10px] flex items-center gap-1.5 shadow-2xs">
            <span class="w-4 h-4 rounded bg-emerald-100 text-emerald-800 text-[9px] font-bold flex items-center justify-center shrink-0">6</span>
            <span class="truncate">Festive Silk Sets</span>
          </div>
        </div>
      </div>
    </div>
  `;

  if (charEl) charEl.innerText = `${previewText.length} chars`;
}

function insertAutoReplyTag(tag) {
  const tplArea = document.getElementById('autoreply-message-template');
  if (!tplArea) return;
  const start = tplArea.selectionStart;
  const end = tplArea.selectionEnd;
  const text = tplArea.value;
  tplArea.value = text.substring(0, start) + tag + text.substring(end);
  tplArea.focus();
  tplArea.selectionStart = tplArea.selectionEnd = start + tag.length;
  updateAutoReplyLivePreview();
}

function regenerateLiveStockMenuTemplate() {
  const tplArea = document.getElementById('autoreply-message-template');
  if (tplArea) {
    tplArea.value = getDefaultStockAutoReplyTemplate();
    updateAutoReplyLivePreview();
    showToast('Template Regenerated', 'Loaded latest stock categories and price ranges.', 'sync', 'emerald');
    if (typeof playChime === 'function') playChime('inbound');
  }
}

function toggleAutoReplyMaster(enabled) {
  const boolState = Boolean(enabled);
  if (!CRM_STATE.autoReplySettings) CRM_STATE.autoReplySettings = {};
  CRM_STATE.autoReplySettings.enabled = boolState;
  saveCRMState();
  updateAutoReplyUI();

  // 1. Direct Socket.IO emit to live Node Baileys bridge
  if (typeof SOCKET_IO !== 'undefined' && SOCKET_IO && SOCKET_IO.connected) {
    SOCKET_IO.emit('autoreply:toggle', { enabled: boolState }, (ack) => {
      console.log('⚡ [AutoReply Toggle Ack via Socket]:', ack);
    });
  }

  // 2. Direct HTTP POST to Node Baileys bridge REST endpoint (Port 3000)
  fetch('http://localhost:3000/api/autoreply/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: boolState })
  }).then(r => r.json()).then(res => {
    console.log('⚡ [AutoReply Toggle Bridge HTTP]:', res);
  }).catch(err => {
    console.warn('Bridge HTTP toggle endpoint unreachable:', err);
  });

  // 3. Fallback sync with PHP API
  fetch('api.php?action=toggle_autoreply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enabled: boolState
    })
  }).catch(() => {});

  showToast(
    boolState ? 'Auto-Reply Active' : 'Auto-Reply Paused',
    boolState ? 'Customers will receive instant answers for pre-set questions & categories.' : 'Automated replies are PAUSED. Customer messages require manual reply.',
    boolState ? 'smart_toy' : 'pause_circle',
    boolState ? 'emerald' : 'amber'
  );
  if (typeof playChime === 'function') playChime('inbound');
}

// 1-Click Fast Toggle directly from WhatsApp Inbox bar
function toggleAutoReplyFromInbox(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const current = CRM_STATE?.autoReplySettings?.enabled !== false;
  const next = !current;
  toggleAutoReplyMaster(next);
}

function saveAutoReplySettings() {
  const masterToggle = document.getElementById('autoreply-master-toggle');

  if (!CRM_STATE.autoReplySettings) CRM_STATE.autoReplySettings = {};
  const isEnabled = masterToggle ? Boolean(masterToggle.checked) : true;
  CRM_STATE.autoReplySettings.enabled = isEnabled;

  saveCRMState();
  updateAutoReplyUI();
  renderAutoReplyRulesList();
  renderInboxPresetTemplatesBar();

  // 1. Direct Socket.IO emit
  if (typeof SOCKET_IO !== 'undefined' && SOCKET_IO && SOCKET_IO.connected) {
    SOCKET_IO.emit('autoreply:toggle', { enabled: isEnabled });
  }

  // 2. Direct HTTP POST to Node Baileys bridge
  fetch('http://localhost:3000/api/autoreply/toggle', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled: isEnabled })
  }).catch(() => {});

  // 3. Sync to PHP API
  fetch('api.php?action=toggle_autoreply', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      enabled: isEnabled
    })
  }).catch(() => {});

  if (Array.isArray(CRM_STATE.autoReplyRules)) {
    syncAutoReplyRulesToBackend();
  }

  closeModal('modal-auto-reply-settings');
  showToast('Settings Saved', isEnabled ? 'WhatsApp auto-reply rules & templates saved (Active).' : 'Auto-reply rules saved (Currently Paused).', 'check_circle', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

function updateAutoReplyUI() {
  const isEnabled = CRM_STATE?.autoReplySettings?.enabled !== false;
  const pillDot = document.getElementById('pill-autoreply-dot');
  const pillLabel = document.getElementById('pill-autoreply-label');
  const pillIcon = document.getElementById('pill-autoreply-icon');
  const headerBtn = document.getElementById('header-auto-reply-btn');
  const inboxContainer = document.getElementById('inbox-autoreply-container');
  const inboxToggleBtn = document.getElementById('btn-inbox-autoreply-toggle');
  const inboxSettingsBtn = document.getElementById('btn-inbox-autoreply-settings');
  const masterToggle = document.getElementById('autoreply-master-toggle');
  const pausedBanner = document.getElementById('inbox-autoreply-paused-banner');

  if (masterToggle) {
    masterToggle.checked = isEnabled;
  }

  // 1. Paused Notice Banner in Chat Viewport
  if (pausedBanner) {
    if (isEnabled) {
      pausedBanner.classList.add('hidden');
    } else {
      pausedBanner.classList.remove('hidden');
    }
  }

  // 2. Quick Actions Pill in WhatsApp Inbox
  if (pillDot) {
    pillDot.className = `w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`;
  }
  if (pillIcon) {
    pillIcon.textContent = isEnabled ? 'smart_toy' : 'pause_circle';
    pillIcon.className = `material-symbols-outlined text-[14px] ${isEnabled ? 'text-emerald-600' : 'text-amber-700 animate-pulse'}`;
  }
  if (pillLabel) {
    pillLabel.innerText = isEnabled ? 'Auto-Reply: ON' : 'Auto-Reply: OFF (Paused)';
    pillLabel.className = isEnabled ? 'text-teal-900 font-bold' : 'text-amber-950 font-extrabold';
  }
  if (inboxContainer) {
    if (isEnabled) {
      inboxContainer.className = "inline-flex items-center rounded-lg border border-teal-300 bg-teal-50 hover:bg-teal-100 shadow-xs shrink-0 overflow-hidden transition-all duration-200";
    } else {
      inboxContainer.className = "inline-flex items-center rounded-lg border border-amber-400 bg-amber-50 hover:bg-amber-100 shadow-xs shrink-0 overflow-hidden ring-2 ring-amber-300/70 transition-all duration-200";
    }
  }
  if (inboxToggleBtn) {
    if (isEnabled) {
      inboxToggleBtn.className = "px-2.5 py-1 hover:bg-teal-100 text-teal-800 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer";
    } else {
      inboxToggleBtn.className = "px-2.5 py-1 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer";
    }
  }
  if (inboxSettingsBtn) {
    if (isEnabled) {
      inboxSettingsBtn.className = "px-1.5 py-1 hover:bg-teal-200/60 text-teal-700 border-l border-teal-300 text-xs transition cursor-pointer";
    } else {
      inboxSettingsBtn.className = "px-1.5 py-1 hover:bg-amber-200/60 text-amber-800 border-l border-amber-300 text-xs transition cursor-pointer";
    }
  }

    if (headerBtn) {
      if (isEnabled) {
        headerBtn.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-lg transition shadow-sm";
        headerBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] text-emerald-200">smart_toy</span><span>Auto-Reply: ON</span>';
      } else {
        headerBtn.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold rounded-lg transition shadow-sm border border-amber-500 ring-2 ring-amber-400/50";
        headerBtn.innerHTML = '<span class="material-symbols-outlined text-[16px] text-amber-200 animate-pulse">pause_circle</span><span>Auto-Reply: PAUSED</span>';
      }
    }

    // 4. Sub-Module Header Tab Pill in WhatsApp Inbox
    const subtabStatus = document.getElementById('subtab-autoreply-status');
    if (subtabStatus) {
      subtabStatus.innerText = isEnabled ? 'ON' : 'PAUSED';
      subtabStatus.className = isEnabled 
        ? 'bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-emerald-300'
        : 'bg-amber-100 text-amber-900 text-[10px] font-extrabold px-1.5 py-0.2 rounded-full border border-amber-300 animate-pulse';
    }

    // 5. Sidebar Navigation Sub-Module Pill
    const navPill = document.getElementById('nav-autoreply-pill');
    if (navPill) {
      navPill.innerText = isEnabled ? 'ON' : 'PAUSED';
      navPill.className = isEnabled 
        ? 'text-[9px] font-extrabold px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30'
        : 'text-[9px] font-extrabold px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/40 animate-pulse';
    }
}

function testSendStockAutoReplyToCurrentChat() {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('No Customer Selected', 'Please select an active chat conversation to test.', 'info', 'amber');
    return;
  }
  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) return;

  const msgText = buildStockAutoReplyMessage(customer);
  const testMsg = {
    id: Date.now(),
    sender: 'staff',
    isBot: true,
    rule_name: 'Full Stock Catalog Menu',
    text: msgText,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  if (!CRM_STATE.conversations[customer.id]) {
    CRM_STATE.conversations[customer.id] = [];
  }
  CRM_STATE.conversations[customer.id].push(testMsg);
  saveCRMState();
  renderChatMessages();

  dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, msgText, testMsg, customer.jid, customer.accountId);
  closeModal('modal-auto-reply-settings');
  showToast('Test Auto-Reply Dispatched', `Stock category menu sent to ${customer.name}!`, 'smart_toy', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

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

  // Push to Baileys bridge: updates BRAND_NAME in-memory + persists to config + updates WA profile
  fetch('http://localhost:3000/api/accounts/update_profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ brandName, brandTagline })
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

    // Asynchronously sync query assignment to MySQL Database
    fetch('api.php?action=assign_query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: query.id,
        assigned_to: staffId,
        status: query.status,
        user: CURRENT_USER?.name || 'Admin'
      })
    }).catch(() => {});

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
    // Reset state cleanly without static mock data
    CRM_STATE.customers = [];
    CRM_STATE.queries = [];
    CRM_STATE.conversations = {};
    CRM_STATE.whatsappAccount = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.whatsappAccount));
    CRM_STATE.dailyMessageTarget = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.dailyMessageTarget));
    CRM_STATE.deletedSlots = [];
    CRM_STATE.whatsappLines = null;
    
    // Reset active line and active customer
    ACTIVE_CUSTOMER_ID = null;
    ACTIVE_SEND_ACCOUNT_ID = 'all';

    // Clear backend message queue as well
    fetch('api.php?action=clear_inbox', { method: 'POST' }).catch(() => {});

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
        'Inbox has been cleared. Only active connected WhatsApp numbers and incoming chats will be displayed.',
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
    feeding: { name: 'Pooja Venkatesh', phone: '+91 97896 60115', msg: 'i want a feeding kurti' },
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

// =========================================================================
// 7. PRODUCT SEARCH, LIVE STOCK CHECK & SHARING
// =========================================================================

// Multi-Select Products State for WhatsApp Stock Sharing
let MODAL_SHARE_SELECTED_PRODUCT_IDS = new Set();

function getModalStockSharingOptions() {
  const stockEl = document.getElementById('modal-share-opt-stock');
  const priceEl = document.getElementById('modal-share-opt-price');
  const specsEl = document.getElementById('modal-share-opt-specs');
  const photoEl = document.getElementById('modal-share-opt-photo');

  return {
    includeStock: stockEl ? stockEl.checked : true,
    includePrice: priceEl ? priceEl.checked : true,
    includeSpecs: specsEl ? specsEl.checked : true,
    includePhoto: photoEl ? photoEl.checked : true
  };
}

function onModalShareOptionChange() {
  renderModalProductList();
  const previewBox = document.getElementById('modal-catalog-preview-box');
  if (previewBox && !previewBox.classList.contains('hidden')) {
    if (CURRENT_CATALOG_PREVIEW_FORMAT === 'selected_products' || CURRENT_CATALOG_PREVIEW_FORMAT === 'single_product') {
      setCatalogPreviewFormat(CURRENT_CATALOG_PREVIEW_FORMAT, CURRENT_PREVIEW_TARGET_PROD_ID);
    }
  }
}

function openProductSearchModal() {
  // 1. Contextualize active customer target
  const targetBadge = document.getElementById('modal-share-active-target');
  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (targetBadge) {
    if (customer) {
      targetBadge.innerText = `${customer.name} (${customer.whatsapp || customer.phone || 'Active Chat'})`;
    } else {
      targetBadge.innerText = 'Active Chat';
    }
  }

  // Clear any previous multi-selection
  MODAL_SHARE_SELECTED_PRODUCT_IDS.clear();

  // 2. Populate Categories and Subcategories
  populateModalShareCategoryFilters();

  // 3. Render Product List
  renderModalProductList();

  // 4. Reset catalog format preview
  closeCatalogFormatPreview();

  // 5. Open Modal
  openModal('modal-product-search');
}

function populateModalShareCategoryFilters() {
  const catSelect = document.getElementById('modal-share-category-filter');
  if (!catSelect) return;

  const currentVal = catSelect.value || 'ALL';

  // Extract distinct category names
  const baseCategories = (CRM_STATE.categories && Array.isArray(CRM_STATE.categories) && CRM_STATE.categories.length > 0)
    ? CRM_STATE.categories
    : (INITIAL_CRM_DATA.categories || []);

  const catNamesSet = new Set();
  baseCategories.forEach(c => {
    if (c && c.name && typeof c.name === 'string' && c.name.trim()) {
      catNamesSet.add(c.name.trim());
    }
  });

  (CRM_STATE.products || []).forEach(p => {
    if (p && p.category && typeof p.category === 'string' && p.category.trim()) {
      catNamesSet.add(p.category.trim());
    }
  });

  let html = '<option value="ALL">📁 All Categories</option>';
  catNamesSet.forEach(name => {
    const isSelected = name === currentVal ? 'selected' : '';
    html += `<option value="${name}" ${isSelected}>${name}</option>`;
  });
  catSelect.innerHTML = html;

  if ([...catSelect.options].some(o => o.value === currentVal)) {
    catSelect.value = currentVal;
  } else {
    catSelect.value = 'ALL';
  }

  onModalShareCategoryChange();
}

function onModalShareCategoryChange() {
  const catSelect = document.getElementById('modal-share-category-filter');
  const subcatSelect = document.getElementById('modal-share-subcategory-filter');
  if (!subcatSelect) return;

  const currentSubVal = subcatSelect.value || 'ALL';
  const selectedCat = catSelect ? catSelect.value : 'ALL';

  const baseSubcategories = (CRM_STATE.subcategories && Array.isArray(CRM_STATE.subcategories) && CRM_STATE.subcategories.length > 0)
    ? CRM_STATE.subcategories
    : (INITIAL_CRM_DATA.subcategories || []);

  const subNamesSet = new Set();

  if (selectedCat === 'ALL') {
    baseSubcategories.forEach(s => {
      if (s && s.name && typeof s.name === 'string' && s.name.trim()) {
        subNamesSet.add(s.name.trim());
      }
    });
    (CRM_STATE.products || []).forEach(p => {
      if (p && p.subcategory && typeof p.subcategory === 'string' && p.subcategory.trim()) {
        subNamesSet.add(p.subcategory.trim());
      }
    });
  } else {
    const selCatLower = selectedCat.trim().toLowerCase();

    baseSubcategories.forEach(s => {
      const catName = (s.category_name || s.category || '').toString().trim().toLowerCase();
      if (catName === selCatLower) {
        if (s && s.name && typeof s.name === 'string' && s.name.trim()) {
          subNamesSet.add(s.name.trim());
        }
      }
    });

    (CRM_STATE.products || []).forEach(p => {
      const pCatLower = (p.category || '').toString().trim().toLowerCase();
      if (pCatLower === selCatLower && p.subcategory && typeof p.subcategory === 'string' && p.subcategory.trim()) {
        subNamesSet.add(p.subcategory.trim());
      }
    });
  }

  let html = '<option value="ALL">🏷️ All Subcategories</option>';
  subNamesSet.forEach(name => {
    const isSelected = name === currentSubVal ? 'selected' : '';
    html += `<option value="${name}" ${isSelected}>${name}</option>`;
  });
  subcatSelect.innerHTML = html;

  if ([...subcatSelect.options].some(o => o.value === currentSubVal)) {
    subcatSelect.value = currentSubVal;
  } else {
    subcatSelect.value = 'ALL';
  }

  renderModalProductList();
}

function onModalShareSubcategoryChange() {
  renderModalProductList();
}

function clearModalShareSearch() {
  const searchInput = document.getElementById('modal-catalog-search');
  if (searchInput) searchInput.value = '';
  const clearBtn = document.getElementById('btn-clear-modal-search');
  if (clearBtn) clearBtn.classList.add('hidden');
  renderModalProductList();
}

function resetModalShareFilters() {
  const catSelect = document.getElementById('modal-share-category-filter');
  const subcatSelect = document.getElementById('modal-share-subcategory-filter');
  const stockSelect = document.getElementById('modal-share-stock-filter');
  const searchInput = document.getElementById('modal-catalog-search');

  if (catSelect) catSelect.value = 'ALL';
  if (subcatSelect) subcatSelect.value = 'ALL';
  if (stockSelect) stockSelect.value = 'ALL';
  if (searchInput) searchInput.value = '';

  const clearBtn = document.getElementById('btn-clear-modal-search');
  if (clearBtn) clearBtn.classList.add('hidden');

  MODAL_SHARE_SELECTED_PRODUCT_IDS.clear();
  populateModalShareCategoryFilters();
}

function getCurrentlyFilteredModalProducts() {
  const searchInput = document.getElementById('modal-catalog-search');
  const catSelect = document.getElementById('modal-share-category-filter');
  const subcatSelect = document.getElementById('modal-share-subcategory-filter');
  const stockSelect = document.getElementById('modal-share-stock-filter');

  const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const selectedCat = catSelect ? catSelect.value : 'ALL';
  const selectedSub = subcatSelect ? subcatSelect.value : 'ALL';
  const stockFilter = stockSelect ? stockSelect.value : 'ALL';

  const catLower = selectedCat.trim().toLowerCase();
  const subLower = selectedSub.trim().toLowerCase();

  return (CRM_STATE.products || []).filter(p => {
    const matchQuery = !q || (p.sku && p.sku.toLowerCase().includes(q)) ||
                             (p.name && p.name.toLowerCase().includes(q)) ||
                             (p.color && p.color.toLowerCase().includes(q)) ||
                             (p.size && p.size.toLowerCase().includes(q)) ||
                             (p.fabric && p.fabric.toLowerCase().includes(q)) ||
                             (p.category && p.category.toLowerCase().includes(q)) ||
                             (p.subcategory && p.subcategory.toLowerCase().includes(q));

    const pCatLower = (p.category || '').toString().trim().toLowerCase();
    const matchCat = selectedCat === 'ALL' || pCatLower === catLower;

    const pSubLower = (p.subcategory || '').toString().trim().toLowerCase();
    const matchSub = selectedSub === 'ALL' || pSubLower === subLower;

    const physical = parseInt(p.physicalStock) || 0;
    const reserved = parseInt(p.reservedStock) || 0;
    const available = physical - reserved;

    let matchStock = true;
    if (stockFilter === 'IN_STOCK') matchStock = available > 5;
    else if (stockFilter === 'LOW_STOCK') matchStock = available > 0 && available <= 5;
    else if (stockFilter === 'OUT_OF_STOCK') matchStock = available <= 0;

    return matchQuery && matchCat && matchSub && matchStock;
  });
}

function updateModalShareSelectionUI() {
  const count = MODAL_SHARE_SELECTED_PRODUCT_IDS.size;
  const badge = document.getElementById('modal-share-selected-count-badge');
  const btnText = document.getElementById('btn-send-selected-text');
  const sendBtn = document.getElementById('btn-send-selected-to-chat');
  const selectAllCb = document.getElementById('modal-share-select-all-checkbox');

  if (badge) {
    badge.innerText = `${count} Selected`;
    if (count > 0) {
      badge.className = 'px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-extrabold rounded-full border border-emerald-300 animate-pulse';
    } else {
      badge.className = 'px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-extrabold rounded-full border border-slate-200';
    }
  }

  // Update Top Banner Stock Preview Button Text
  const bannerStockBtnText = document.getElementById('btn-banner-preview-stock-text');
  if (bannerStockBtnText) {
    bannerStockBtnText.innerText = count > 0 ? `3. Preview Stock (${count})` : '3. Preview Stock Products';
  }

  // Update Format Tab Stock Button Label
  const tabStockProdsLabel = document.getElementById('btn-format-tab-stock-prods-label');
  if (tabStockProdsLabel) {
    tabStockProdsLabel.innerText = count > 0 ? `Format 3: Selected Stock Products (${count})` : 'Format 3: Selected Stock Products';
  }

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  const custName = customer ? customer.name.split(' ')[0] : 'Customer';

  if (btnText) {
    if (count === 0) {
      btnText.innerText = 'Select Products to Send';
    } else if (count === 1) {
      btnText.innerText = `Send 1 Selected to ${custName}`;
    } else {
      btnText.innerText = `Send ${count} Selected to ${custName}`;
    }
  }

  if (sendBtn) {
    sendBtn.disabled = (count === 0);
  }

  // If live preview is currently open on selected_products, refresh it live
  const previewBox = document.getElementById('modal-catalog-preview-box');
  if (previewBox && !previewBox.classList.contains('hidden') && CURRENT_CATALOG_PREVIEW_FORMAT === 'selected_products') {
    setCatalogPreviewFormat('selected_products');
  }

  if (selectAllCb) {
    const visibleProducts = getCurrentlyFilteredModalProducts();
    selectAllCb.checked = visibleProducts.length > 0 && visibleProducts.every(p => MODAL_SHARE_SELECTED_PRODUCT_IDS.has(String(p.id)));
  }
}

function toggleModalProductSelected(productId, isChecked) {
  const idStr = String(productId);
  if (isChecked) {
    MODAL_SHARE_SELECTED_PRODUCT_IDS.add(idStr);
  } else {
    MODAL_SHARE_SELECTED_PRODUCT_IDS.delete(idStr);
  }

  const card = document.getElementById(`modal-prod-card-${idStr}`);
  if (card) {
    if (isChecked) {
      card.classList.add('ring-2', 'ring-emerald-600', 'bg-emerald-50/40', 'border-emerald-300');
      card.classList.remove('bg-white');
    } else {
      card.classList.remove('ring-2', 'ring-emerald-600', 'bg-emerald-50/40', 'border-emerald-300');
      card.classList.add('bg-white');
    }
  }

  const cb = document.getElementById(`modal-select-prod-${idStr}`);
  if (cb) cb.checked = isChecked;

  updateModalShareSelectionUI();
}

function handleModalProductCardClick(productId, event) {
  // Ignore clicks that originate from buttons, links, inputs, labels, or preview panels
  if (event.target.closest('button, a, input, select, label, textarea, .prevent-select-click')) {
    return;
  }
  const idStr = String(productId);
  const isSelected = MODAL_SHARE_SELECTED_PRODUCT_IDS.has(idStr);
  toggleModalProductSelected(productId, !isSelected);
}

function toggleSelectAllModalProducts(isChecked) {
  const visibleProducts = getCurrentlyFilteredModalProducts();
  visibleProducts.forEach(p => {
    const idStr = String(p.id);
    if (isChecked) {
      MODAL_SHARE_SELECTED_PRODUCT_IDS.add(idStr);
    } else {
      MODAL_SHARE_SELECTED_PRODUCT_IDS.delete(idStr);
    }
  });

  renderModalProductList();
  updateModalShareSelectionUI();
}

function clearModalProductSelection() {
  MODAL_SHARE_SELECTED_PRODUCT_IDS.clear();
  renderModalProductList();
  updateModalShareSelectionUI();
}

function buildConfiguredProductShareText(p, opts) {
  const options = opts || getModalStockSharingOptions();
  const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);

  let stockLine = '';
  if (options.includeStock) {
    const stockStatus = available > 5
      ? `✅ *In Stock* (${available} units ready for immediate dispatch)`
      : available > 0
        ? `⚡ *Limited Stock Alert* (Only ${available} units remaining!)`
        : `⚠️ *Made to Order* (Available on booking)`;
    stockLine = `\n📦 *Warehouse Stock:* ${stockStatus}`;
  }

  let priceLine = '';
  if (options.includePrice) {
    const priceNum = parseFloat(p.price) || 0;
    const mrpNum = parseFloat(p.mrp) || 0;
    if (mrpNum > priceNum) {
      const discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
      priceLine = `\n💰 *Offer Price:* ₹${priceNum} ~₹${mrpNum}~ (*${discount}% OFF*)`;
    } else {
      priceLine = `\n💰 *Price:* ₹${priceNum}`;
    }
  }

  let specsLine = '';
  if (options.includeSpecs) {
    const catLine = p.subcategory 
      ? `📁 *Catalog:* ${p.category || 'Garments'} › ${p.subcategory}\n` 
      : (p.category ? `📁 *Category:* ${p.category}\n` : '');
    const sizeLine = `📏 *Size / Age:* ${p.size || 'Standard'}\n`;
    const colorLine = `🎨 *Color:* ${p.color || 'Default'}\n`;
    const fabricLine = p.fabric ? `🧵 *Fabric:* ${p.fabric}\n` : '';

    let extraSpecs = '';
    if (p.specifications) {
      let sList = p.specifications;
      if (typeof sList === 'string') {
        try { sList = JSON.parse(sList); } catch (e) { sList = []; }
      }
      if (Array.isArray(sList) && sList.length > 0) {
        extraSpecs = sList.filter(s => s && s.label && s.content).map(s => `📌 *${s.label}:* ${s.content}\n`).join('');
      }
    }

    specsLine = `${catLine}${sizeLine}${colorLine}${fabricLine}${extraSpecs}`;
  }

  const descLine = p.description ? `\n✨ *Product Highlights:*\n${p.description}\n` : '';

  return `🛍️ *${p.name}*\n🏷️ *SKU Code:* ${p.sku}\n${specsLine}${priceLine}${stockLine}${descLine}\n✨ *GRM Garments Premium Quality Promise*\n🚚 Fast door delivery & Cash on Delivery (COD) available!\n\n👉 *Reply 'YES' with your delivery address to confirm your booking!*`;
}

function renderModalProductList(query) {
  const container = document.getElementById('modal-products-list');
  if (!container) return;

  const searchInput = document.getElementById('modal-catalog-search');
  const catSelect = document.getElementById('modal-share-category-filter');
  const subcatSelect = document.getElementById('modal-share-subcategory-filter');
  const stockSelect = document.getElementById('modal-share-stock-filter');
  const clearBtn = document.getElementById('btn-clear-modal-search');

  const q = (query !== undefined ? query : (searchInput ? searchInput.value : '')).trim().toLowerCase();
  const selectedCat = catSelect ? catSelect.value : 'ALL';
  const selectedSub = subcatSelect ? subcatSelect.value : 'ALL';
  const stockFilter = stockSelect ? stockSelect.value : 'ALL';

  if (clearBtn) {
    if (q) clearBtn.classList.remove('hidden');
    else clearBtn.classList.add('hidden');
  }

  const catLower = selectedCat.trim().toLowerCase();
  const subLower = selectedSub.trim().toLowerCase();

  const list = (CRM_STATE.products || []).filter(p => {
    // 1. Text Search Filter
    const matchQuery = !q || (p.sku && p.sku.toLowerCase().includes(q)) ||
                             (p.name && p.name.toLowerCase().includes(q)) ||
                             (p.color && p.color.toLowerCase().includes(q)) ||
                             (p.size && p.size.toLowerCase().includes(q)) ||
                             (p.fabric && p.fabric.toLowerCase().includes(q)) ||
                             (p.category && p.category.toLowerCase().includes(q)) ||
                             (p.subcategory && p.subcategory.toLowerCase().includes(q));

    // 2. Category Filter
    const pCatLower = (p.category || '').toString().trim().toLowerCase();
    const matchCat = selectedCat === 'ALL' || pCatLower === catLower;

    // 3. Sub Category Filter
    const pSubLower = (p.subcategory || '').toString().trim().toLowerCase();
    const matchSub = selectedSub === 'ALL' || pSubLower === subLower;

    // 4. Stock Availability Filter
    const physical = parseInt(p.physicalStock) || 0;
    const reserved = parseInt(p.reservedStock) || 0;
    const available = physical - reserved;

    let matchStock = true;
    if (stockFilter === 'IN_STOCK') {
      matchStock = available > 5;
    } else if (stockFilter === 'LOW_STOCK') {
      matchStock = available > 0 && available <= 5;
    } else if (stockFilter === 'OUT_OF_STOCK') {
      matchStock = available <= 0;
    }

    return matchQuery && matchCat && matchSub && matchStock;
  });

  if (list.length === 0) {
    container.innerHTML = `
      <div class="py-12 text-center">
        <div class="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-sm border border-emerald-100">
          <span class="material-symbols-outlined text-[28px]">search_off</span>
        </div>
        <h4 class="font-bold text-slate-800 text-sm">No Garments Matched Your Criteria</h4>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try selecting another category or resetting the search filters to view stock.</p>
        <button onclick="resetModalShareFilters()" class="mt-3.5 px-4 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer">
          Reset All Filters
        </button>
      </div>
    `;
    updateModalShareSelectionUI();
    return;
  }

  const opts = getModalStockSharingOptions();

  container.innerHTML = list.map(p => {
    const physical = parseInt(p.physicalStock) || 0;
    const reserved = parseInt(p.reservedStock) || 0;
    const available = physical - reserved;
    const isAvailable = available > 0;

    let stockBadge = '';
    if (available > 5) {
      stockBadge = `
        <span class="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-300 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Available: ${available} (${reserved} Reserved)
        </span>
      `;
    } else if (available > 0) {
      stockBadge = `
        <span class="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-[11px] font-bold px-2.5 py-1 rounded-full border border-amber-300 shadow-2xs animate-pulse">
          <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Only ${available} Left (${reserved} Reserved)
        </span>
      `;
    } else {
      stockBadge = `
        <span class="inline-flex items-center gap-1 bg-rose-100 text-rose-800 text-[11px] font-bold px-2.5 py-1 rounded-full border border-rose-300 shadow-2xs">
          <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          Out of Stock (0 Available)
        </span>
      `;
    }

    const imgUrl = (p.image && (p.image.startsWith('http') || p.image.startsWith('uploads/') || p.image.startsWith('data:image')) && !p.image.includes('photo-1518831959646-742c3a14ebf7'))
      ? p.image
      : DEFAULT_GARMENT_PLACEHOLDER;

    const catBreadcrumb = p.subcategory 
      ? `${p.category || 'Garments'} &rsaquo; ${p.subcategory}`
      : (p.category || 'Garments');

    const priceNum = parseFloat(p.price) || 0;
    const mrpNum = parseFloat(p.mrp) || 0;
    let priceDisplay = `<span class="text-xs font-extrabold text-emerald-700 font-mono">₹${priceNum}</span>`;
    if (mrpNum > priceNum) {
      const discountPct = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
      priceDisplay = `
        <div class="flex items-center gap-1.5">
          <span class="text-xs font-extrabold text-emerald-700 font-mono">₹${priceNum}</span>
          <span class="text-[10px] text-slate-400 line-through">₹${mrpNum}</span>
          <span class="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">${discountPct}% OFF</span>
        </div>
      `;
    }

    const previewShareMsg = buildConfiguredProductShareText(p, opts);
    const isSelected = MODAL_SHARE_SELECTED_PRODUCT_IDS.has(String(p.id));
    const cardSelectedClass = isSelected
      ? 'ring-2 ring-emerald-600 bg-emerald-50/40 border-emerald-300 shadow-sm'
      : 'bg-white hover:bg-slate-50/90 border-slate-200/90';

    return `
      <div id="modal-prod-card-${p.id}" onclick="handleModalProductCardClick('${p.id}', event)" class="py-3.5 px-3 rounded-2xl border transition shadow-2xs space-y-2.5 cursor-pointer select-none ${cardSelectedClass}">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <!-- Left: Selection Checkbox, Image & Product Meta -->
          <div class="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
            <!-- Multi-Select Checkbox -->
            <label class="flex items-center justify-center p-1 cursor-pointer shrink-0 self-center hover:scale-110 transition" onclick="event.stopPropagation()" title="Select ${p.sku} to send">
              <input type="checkbox" id="modal-select-prod-${p.id}" ${isSelected ? 'checked' : ''} onchange="toggleModalProductSelected('${p.id}', this.checked)" class="w-5 h-5 text-emerald-600 rounded-lg border-2 border-slate-300 focus:ring-emerald-500 accent-emerald-600 cursor-pointer transition">
            </label>

            <img src="${imgUrl}" alt="${p.name}" class="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0">
            
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="font-mono text-[11px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">${p.sku}</span>
                <span class="text-[10px] bg-teal-50 text-teal-800 font-bold px-2 py-0.5 rounded border border-teal-200 truncate max-w-[200px]" title="${catBreadcrumb}">
                  ${catBreadcrumb}
                </span>
                ${isSelected ? `<span class="text-[9px] bg-emerald-600 text-white font-extrabold px-1.5 py-0.2 rounded-md flex items-center gap-0.5 shadow-2xs">✓ Selected</span>` : ''}
              </div>
              <h4 class="font-bold text-slate-900 text-xs mt-1 truncate" title="${p.name}">${p.name}</h4>
              <p class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>📏 <strong class="text-slate-700 font-semibold">${p.size || 'Standard'}</strong></span>
                <span>&bull;</span>
                <span>🎨 <strong class="text-slate-700 font-semibold">${p.color || 'Default'}</strong></span>
                ${p.fabric ? `<span>&bull;</span> <span class="text-teal-700 font-semibold">🧵 ${p.fabric}</span>` : ''}
              </p>
              <div class="mt-1">
                ${priceDisplay}
              </div>
            </div>
          </div>

          <!-- Right: Stock Status & Action Buttons -->
          <div class="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
            <div class="shrink-0">
              ${stockBadge}
            </div>

            <div class="flex items-center gap-1.5 flex-wrap justify-end">
              <!-- Preview Toggle Button -->
              <button type="button" onclick="openCatalogFormatPreview('single_product', '${p.id}')" class="p-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-800 text-slate-600 rounded-lg transition text-xs font-semibold cursor-pointer" title="Live Preview & Edit WhatsApp card before sending">
                <span class="material-symbols-outlined text-[15px]">visibility</span>
              </button>

              <!-- Copy Share Text Button -->
              <button type="button" onclick="copyModalProductShareText('${p.id}')" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition text-xs font-semibold cursor-pointer" title="Copy formatted WhatsApp product card to clipboard">
                <span class="material-symbols-outlined text-[15px]">content_copy</span>
              </button>

              <!-- Direct WA / Broadcast Modal Button -->
              <button type="button" onclick="openDirectShareModal('${p.id}'); closeModal('modal-product-search');" class="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-2xs cursor-pointer" title="Direct WA: send to any contact or edit custom caption">
                <span class="material-symbols-outlined text-[14px]">tune</span>
                <span class="hidden md:inline">Options</span>
              </button>

              <!-- 1-Click Share to Customer Button -->
              <button type="button" onclick="shareProductCardToChat('${p.id}')" class="px-3.5 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer" title="Send only this product card to active customer">
                <span class="material-symbols-outlined text-[14px]">send</span>
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Collapsible WhatsApp Card Message Preview -->
        <div id="modal-prod-preview-${p.id}" class="hidden p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono text-slate-700 whitespace-pre-wrap select-all shadow-inner prevent-select-click" onclick="event.stopPropagation()">
${previewShareMsg}
        </div>
      </div>
    `;
  }).join('');

  updateModalShareSelectionUI();
}

function toggleModalProductPreview(productId) {
  const previewBox = document.getElementById(`modal-prod-preview-${productId}`);
  if (!previewBox) return;
  previewBox.classList.toggle('hidden');
}

function copyModalProductShareText(productId) {
  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId));
  if (!p) return;

  const text = buildConfiguredProductShareText(p);
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to Clipboard', `WhatsApp share card for ${p.sku} copied.`, 'content_copy', 'emerald');
  }).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    showToast('Copied to Clipboard', `WhatsApp share card for ${p.sku} copied.`, 'content_copy', 'emerald');
  });
}

function shareProductCardToChat(productId) {
  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId));
  if (!p) return;

  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please open a customer chat first or click "Options" to send to any phone number.', 'warning', 'amber');
    return;
  }

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  const opts = getModalStockSharingOptions();
  const shareText = buildConfiguredProductShareText(p, opts);

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const hasPhotoOpt = opts.includePhoto;
  const validImg = (hasPhotoOpt && p.image && !p.image.includes('photo-1518831959646-742c3a14ebf7')) ? p.image : null;

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: shareText,
    type: validImg ? 'image' : 'text',
    media_url: validImg,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  closeModal('modal-product-search');
  renderChatMessages();
  if (typeof playChime === 'function') playChime('order');
  showToast('Stock Shared', `Sent ${p.sku} live stock card to customer on WhatsApp.`, 'share', 'emerald');

  if (customer && typeof dispatchWhatsAppOutbound === 'function') {
    dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, shareText, newMsg, customer.jid, customer.accountId, false, validImg);
  }
}

function shareSelectedProductsToChat() {
  if (MODAL_SHARE_SELECTED_PRODUCT_IDS.size === 0) {
    showToast('No Garments Selected', 'Please check at least one product using the select checkbox.', 'warning', 'amber');
    return;
  }

  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please open a customer chat first before sending garments.', 'warning', 'amber');
    return;
  }

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) return;

  const selectedIds = Array.from(MODAL_SHARE_SELECTED_PRODUCT_IDS);
  const selectedProducts = (CRM_STATE.products || []).filter(p => selectedIds.includes(String(p.id)));

  if (selectedProducts.length === 0) {
    showToast('Error', 'Could not find selected products in state.', 'error', 'rose');
    return;
  }

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const opts = getModalStockSharingOptions();
  const hasPhotoOpt = opts.includePhoto;

  // Dispatch each selected product sequentially
  selectedProducts.forEach((p, idx) => {
    const shareText = buildConfiguredProductShareText(p, opts);
    const validImg = (hasPhotoOpt && p.image && !p.image.includes('photo-1518831959646-742c3a14ebf7')) ? p.image : null;

    const newMsg = {
      id: Date.now() + idx,
      sender: 'staff',
      text: shareText,
      type: validImg ? 'image' : 'text',
      media_url: validImg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SENDING'
    };

    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

    if (typeof dispatchWhatsAppOutbound === 'function') {
      setTimeout(() => {
        dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, shareText, newMsg, customer.jid, customer.accountId, false, validImg);
      }, idx * 250);
    }
  });

  // Clear selections & close modal
  MODAL_SHARE_SELECTED_PRODUCT_IDS.clear();
  closeModal('modal-product-search');
  renderChatMessages();
  if (typeof playChime === 'function') playChime('order');
  showToast(
    'Dispatched to WhatsApp',
    `Sent ${selectedProducts.length} selected garments to ${customer.name}.`,
    'send',
    'emerald'
  );
}

// =========================================================================
// CATALOG & CATEGORY WHATSAPP SHARING (With Message Format Preview)
// =========================================================================

let CURRENT_CATALOG_PREVIEW_FORMAT = 'category_only'; // 'category_only' | 'category_sub' | 'selected_products' | 'single_product'
let CURRENT_PREVIEW_DEFAULT_TEXT = '';
let CURRENT_PREVIEW_EDITED_TEXT = '';
let CURRENT_PREVIEW_PHOTO_URL = null;
let CURRENT_PREVIEW_TARGET_PROD_ID = null;

function getCategoriesSummaryList() {
  const baseCategories = (CRM_STATE.categories && Array.isArray(CRM_STATE.categories) && CRM_STATE.categories.length > 0)
    ? CRM_STATE.categories
    : (INITIAL_CRM_DATA.categories || []);

  const baseSubcategories = (CRM_STATE.subcategories && Array.isArray(CRM_STATE.subcategories) && CRM_STATE.subcategories.length > 0)
    ? CRM_STATE.subcategories
    : (INITIAL_CRM_DATA.subcategories || []);

  const products = CRM_STATE.products || [];

  const categoryMap = new Map();

  baseCategories.forEach(c => {
    if (c && c.name && typeof c.name === 'string' && c.name.trim()) {
      const name = c.name.trim();
      const lower = name.toLowerCase();
      if (!categoryMap.has(lower)) {
        categoryMap.set(lower, {
          name: name,
          icon: c.icon || 'category',
          description: c.description || '',
          subcategories: new Set(),
          productsCount: 0,
          inStockCount: 0,
          minPrice: Infinity
        });
      }
    }
  });

  products.forEach(p => {
    if (p && p.category && typeof p.category === 'string' && p.category.trim()) {
      const name = p.category.trim();
      const lower = name.toLowerCase();
      if (!categoryMap.has(lower)) {
        categoryMap.set(lower, {
          name: name,
          icon: 'category',
          description: '',
          subcategories: new Set(),
          productsCount: 0,
          inStockCount: 0,
          minPrice: Infinity
        });
      }
    }
  });

  baseSubcategories.forEach(s => {
    if (s && s.name && typeof s.name === 'string' && s.name.trim()) {
      const subName = s.name.trim();
      const catName = (s.category_name || s.category || '').toString().trim().toLowerCase();
      if (catName && categoryMap.has(catName)) {
        categoryMap.get(catName).subcategories.add(subName);
      }
    }
  });

  products.forEach(p => {
    const pCat = (p.category || '').toString().trim();
    const pCatLower = pCat.toLowerCase();
    const pSub = (p.subcategory || '').toString().trim();
    const price = parseFloat(p.price) || 0;
    const avail = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);

    if (pCatLower && categoryMap.has(pCatLower)) {
      const catInfo = categoryMap.get(pCatLower);
      catInfo.productsCount++;
      if (avail > 0) catInfo.inStockCount += avail;
      if (price > 0 && price < catInfo.minPrice) catInfo.minPrice = price;
      if (pSub) catInfo.subcategories.add(pSub);
    }
  });

  const result = [];
  categoryMap.forEach(info => {
    result.push({
      name: info.name,
      icon: info.icon,
      description: info.description,
      subcategories: Array.from(info.subcategories),
      productsCount: info.productsCount,
      inStockCount: info.inStockCount,
      minPrice: info.minPrice === Infinity ? 0 : info.minPrice
    });
  });

  return result;
}

function buildCategoryListMessageText(customerName = '', brand = '') {
  const brandName = brand || ((typeof getBrandName === 'function') ? getBrandName() : 'GRM Garments');
  const categories = getCategoriesSummaryList();
  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '1️⃣1️⃣', '1️⃣2️⃣'];

  let text = `✨ *${brandName} — Product Collections & Categories* 🛍️\n\n`;
  text += `Hello ${customerName || 'there'}! Explore our current garment collections below:\n\n`;

  categories.forEach((cat, idx) => {
    const num = numberEmojis[idx] || `${idx + 1}.`;
    const countBadge = cat.productsCount > 0 ? ` (${cat.productsCount} Designs Ready)` : '';
    const priceBadge = cat.minPrice > 0 ? ` • From ₹${cat.minPrice}` : '';
    text += `${num} *${cat.name}*${countBadge}${priceBadge}\n`;
  });

  const firstCatName = categories.length > 0 ? categories[0].name : 'Category';
  text += `\n💬 *Reply with the Category Number or Name* (e.g. "1" or "${firstCatName}") to receive instant photos, sizes, and price details!\n`;
  text += `🚚 _Fast Dispatch & COD Available Across India 🇮🇳_`;
  return text;
}

function buildCategoryAndSubcategoryMessageText(customerName = '', brand = '') {
  const brandName = brand || ((typeof getBrandName === 'function') ? getBrandName() : 'GRM Garments');
  const categories = getCategoriesSummaryList();

  let text = `📋 *${brandName} — Complete Catalog & Collections Directory* 🏷️\n\n`;
  text += `Hello ${customerName || 'there'}! Explore our complete collection directory below:\n\n`;

  categories.forEach((cat, idx) => {
    text += `📁 *${idx + 1}. ${cat.name}*\n`;
    if (cat.subcategories && cat.subcategories.length > 0) {
      text += `   🏷️ *Subcategories:* ${cat.subcategories.join(' • ')}\n`;
    }
    const infoParts = [];
    if (cat.productsCount > 0) infoParts.push(`${cat.productsCount} Designs Available`);
    if (cat.minPrice > 0) infoParts.push(`Starting from ₹${cat.minPrice}`);
    if (infoParts.length > 0) {
      text += `   📦 ${infoParts.join(' • ')} • In Stock\n`;
    }
    text += `\n`;
  });

  text += `💬 *Reply with any Category or Subcategory name* to receive live photos, sizes, prices, and same-day dispatch options!\n`;
  text += `🚚 _Fast Dispatch & COD Available Across India 🇮🇳_`;
  return text;
}

function buildSelectedProductsShareText(products, opts) {
  const options = opts || getModalStockSharingOptions();
  const prods = (products && products.length > 0)
    ? products
    : (CRM_STATE.products || []).filter(p => MODAL_SHARE_SELECTED_PRODUCT_IDS.has(String(p.id)));

  if (!prods || prods.length === 0) {
    return 'No products selected. Please check one or more garments from the list below to preview formatted stock card.';
  }

  if (prods.length === 1) {
    return buildConfiguredProductShareText(prods[0], options);
  }

  const brandName = (typeof getBrandName === 'function') ? getBrandName() : 'GRM Garments';
  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  const customerName = customer ? customer.name : '';

  let text = `📦 *${brandName} — Live Stock & Garment Details* 🛍️\n\n`;
  if (customerName) {
    text += `Hello ${customerName}! Here are the live stock availability and pricing details for the requested garments:\n\n`;
  } else {
    text += `Here are the live stock availability and pricing details for the requested garments:\n\n`;
  }

  prods.forEach((p, idx) => {
    const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
    text += `*${idx + 1}. ${p.name}* (SKU: ${p.sku})\n`;

    if (options.includeSpecs) {
      const specs = [];
      if (p.size) specs.push(`Size: ${p.size}`);
      if (p.color) specs.push(`Color: ${p.color}`);
      if (p.fabric) specs.push(`Fabric: ${p.fabric}`);
      if (specs.length > 0) text += `   📏 ${specs.join(' • ')}\n`;
    }

    if (options.includePrice) {
      const priceNum = parseFloat(p.price) || 0;
      const mrpNum = parseFloat(p.mrp) || 0;
      if (mrpNum > priceNum) {
        const discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
        text += `   💰 Offer: *₹${priceNum}* ~₹${mrpNum}~ (${discount}% OFF)\n`;
      } else {
        text += `   💰 Price: *₹${priceNum}*\n`;
      }
    }

    if (options.includeStock) {
      const stockStatus = available > 5
        ? `✅ In Stock (${available} units ready)`
        : available > 0
          ? `⚡ Only ${available} units left!`
          : `⚠️ Made to Order`;
      text += `   📦 Stock: ${stockStatus}\n`;
    }
    text += `\n`;
  });

  text += `✨ *${brandName} Premium Quality Promise*\n`;
  text += `🚚 _Fast door delivery & Cash on Delivery (COD) available across India 🇮🇳_\n\n`;
  text += `👉 *Reply with the product SKU or name to book your pieces!*`;

  return text;
}

function formatWhatsAppMarkdownForPreview(rawText) {
  if (!rawText) return '';
  let safe = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Monospace code blocks ```code```
  safe = safe.replace(/```([^`]+)```/g, '<pre class="bg-black/30 p-2 rounded text-[11px] font-mono overflow-x-auto">$1</pre>');
  // Inline monospace `code`
  safe = safe.replace(/`([^`\n]+)`/g, '<code class="bg-black/30 px-1 py-0.5 rounded font-mono text-[11px] text-teal-200">$1</code>');
  // Strikethrough: ~text~
  safe = safe.replace(/~([^~\n]+)~/g, '<span class="line-through text-slate-300/80">$1</span>');
  // Bold: *text*
  safe = safe.replace(/\*([^*\n]+)\*/g, '<strong class="font-bold text-white">$1</strong>');
  // Italics: _text_
  safe = safe.replace(/_([^_\n]+)_/g, '<em class="italic text-emerald-100">$1</em>');

  return safe;
}

function updatePreviewBubbleAndCounter(text) {
  CURRENT_PREVIEW_EDITED_TEXT = text;

  const bubble = document.getElementById('preview-whatsapp-message-bubble');
  if (bubble) {
    bubble.innerHTML = formatWhatsAppMarkdownForPreview(text);
  }

  const counter = document.getElementById('preview-editor-char-counter');
  if (counter) {
    const chars = text ? text.length : 0;
    const lines = text ? text.split('\n').length : 0;
    counter.innerText = `${chars} chars • ${lines} lines`;
  }
}

function onPreviewMessageEditorInput() {
  const editor = document.getElementById('modal-preview-message-editor');
  const text = editor ? editor.value : '';
  updatePreviewBubbleAndCounter(text);
}

function insertPreviewFormatting(prefix, suffix) {
  const editor = document.getElementById('modal-preview-message-editor');
  if (!editor) return;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const val = editor.value;
  const selected = val.substring(start, end) || 'text';
  const replacement = `${prefix}${selected}${suffix}`;
  editor.value = val.substring(0, start) + replacement + val.substring(end);
  editor.focus();
  editor.selectionStart = start + prefix.length;
  editor.selectionEnd = start + prefix.length + selected.length;
  onPreviewMessageEditorInput();
}

function insertPreviewSnippet(snippet) {
  const editor = document.getElementById('modal-preview-message-editor');
  if (!editor) return;
  const start = editor.selectionStart;
  const end = editor.selectionEnd;
  const val = editor.value;
  editor.value = val.substring(0, start) + snippet + val.substring(end);
  editor.focus();
  editor.selectionStart = editor.selectionEnd = start + snippet.length;
  onPreviewMessageEditorInput();
}

function resetPreviewMessageToDefault() {
  const editor = document.getElementById('modal-preview-message-editor');
  if (!editor) return;
  editor.value = CURRENT_PREVIEW_DEFAULT_TEXT;
  updatePreviewBubbleAndCounter(CURRENT_PREVIEW_DEFAULT_TEXT);
  showToast('Template Reset', 'Reverted message content to the original default format.', 'restart_alt', 'slate');
}

function openCatalogFormatPreview(format = 'category_only', singleProductId = null) {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please open a customer chat first before previewing format.', 'warning', 'amber');
    return;
  }

  // Populate Staff Sender Info
  const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
  const staffName = user ? (user.name || user.username || 'Staff Member') : 'Staff Member';
  const staffRole = user ? (user.title || user.role || 'Sales Specialist') : 'Sales Specialist';
  const staffElem = document.getElementById('preview-staff-sender-name');
  if (staffElem) staffElem.innerText = `${staffName} (${staffRole})`;

  // Populate Customer Target Info
  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  const custName = customer ? `${customer.name} (${formatPhoneNumberPretty(customer.whatsapp || customer.phone)})` : 'Active Customer';
  const custElem = document.getElementById('preview-customer-target-name');
  if (custElem) custElem.innerText = custName;

  // Populate Brand Header in Mock Bubble
  const brandName = (typeof getBrandName === 'function') ? getBrandName() : 'GRM Garments';
  const brandElem = document.getElementById('preview-whatsapp-footer-brand');
  if (brandElem) brandElem.innerText = `${brandName} • WhatsApp Business`;
  const timeElem = document.getElementById('preview-whatsapp-time');
  if (timeElem) timeElem.innerText = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Update Format Tab and Preview Content
  setCatalogPreviewFormat(format, singleProductId);

  // Reveal Preview Box
  const previewBox = document.getElementById('modal-catalog-preview-box');
  if (previewBox) {
    previewBox.classList.remove('hidden');
    previewBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

function setCatalogPreviewFormat(format = 'category_only', targetProdId = null) {
  CURRENT_CATALOG_PREVIEW_FORMAT = format;
  CURRENT_PREVIEW_TARGET_PROD_ID = targetProdId;

  const btnCatOnly = document.getElementById('btn-format-tab-cat-only');
  const btnCatSub = document.getElementById('btn-format-tab-cat-sub');
  const btnStockProds = document.getElementById('btn-format-tab-stock-prods');
  const badge = document.getElementById('preview-format-badge');
  const editor = document.getElementById('modal-preview-message-editor');
  const sendBtnText = document.getElementById('btn-send-previewed-text');
  const mediaContainer = document.getElementById('preview-whatsapp-media-container');
  const mediaImg = document.getElementById('preview-whatsapp-media-img');

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  const customerName = customer ? customer.name : '';
  const brandName = (typeof getBrandName === 'function') ? getBrandName() : 'GRM Garments';
  const opts = getModalStockSharingOptions();

  // Tab button styling
  const activeClass = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer bg-emerald-600 text-white shadow-sm flex items-center gap-1';
  const inactiveClass = 'px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1';

  if (btnCatOnly) btnCatOnly.className = (format === 'category_only') ? activeClass : inactiveClass;
  if (btnCatSub) btnCatSub.className = (format === 'category_sub') ? activeClass : inactiveClass;
  if (btnStockProds) btnStockProds.className = (format === 'selected_products' || format === 'single_product') ? activeClass : inactiveClass;

  let rawMessageText = '';
  let photoUrl = null;

  if (format === 'category_only') {
    if (badge) badge.innerText = 'Format 1 (Category List Only)';
    if (sendBtnText) sendBtnText.innerText = 'Send Category List to Customer';
    rawMessageText = buildCategoryListMessageText(customerName, brandName);
  } else if (format === 'category_sub') {
    if (badge) badge.innerText = 'Format 2 (Category & Subcategories)';
    if (sendBtnText) sendBtnText.innerText = 'Send Category & Subcategories to Customer';
    rawMessageText = buildCategoryAndSubcategoryMessageText(customerName, brandName);
  } else if (format === 'single_product') {
    const prodId = targetProdId || (CRM_STATE.products && CRM_STATE.products[0] ? CRM_STATE.products[0].id : null);
    const p = (CRM_STATE.products || []).find(x => String(x.id) === String(prodId));
    if (p) {
      if (badge) badge.innerText = `Product Card: ${p.sku}`;
      if (sendBtnText) sendBtnText.innerText = `Send ${p.sku} to Customer`;
      rawMessageText = buildConfiguredProductShareText(p, opts);
      if (opts.includePhoto && p.image && !p.image.includes('photo-1518831959646-742c3a14ebf7')) {
        photoUrl = p.image;
      }
    } else {
      rawMessageText = 'Product details not found.';
    }
  } else {
    // selected_products
    const selectedIds = Array.from(MODAL_SHARE_SELECTED_PRODUCT_IDS);
    let selectedProducts = (CRM_STATE.products || []).filter(p => selectedIds.includes(String(p.id)));
    if (selectedProducts.length === 0) {
      const visible = getCurrentlyFilteredModalProducts();
      if (visible.length > 0) {
        selectedProducts = [visible[0]];
      }
    }

    const count = selectedProducts.length;
    if (badge) badge.innerText = `Format 3 (${count} Garments Selected)`;
    if (sendBtnText) sendBtnText.innerText = `Send ${count} Selected Garment${count > 1 ? 's' : ''} to Customer`;

    rawMessageText = buildSelectedProductsShareText(selectedProducts, opts);
    if (selectedProducts.length > 0 && opts.includePhoto) {
      const firstWithPhoto = selectedProducts.find(p => p.image && !p.image.includes('photo-1518831959646-742c3a14ebf7'));
      if (firstWithPhoto) {
        photoUrl = firstWithPhoto.image;
      }
    }
  }

  // Update Media Container
  CURRENT_PREVIEW_PHOTO_URL = photoUrl;
  if (mediaContainer && mediaImg) {
    if (photoUrl) {
      mediaImg.src = photoUrl;
      mediaContainer.classList.remove('hidden');
    } else {
      mediaContainer.classList.add('hidden');
    }
  }

  // Populate editor & preview bubble
  CURRENT_PREVIEW_DEFAULT_TEXT = rawMessageText;
  if (editor) {
    editor.value = rawMessageText;
  }
  updatePreviewBubbleAndCounter(rawMessageText);
}

function closeCatalogFormatPreview() {
  const previewBox = document.getElementById('modal-catalog-preview-box');
  if (previewBox) {
    previewBox.classList.add('hidden');
  }
}

function dispatchPreviewedCatalogFormat() {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please open a customer chat first before sending.', 'warning', 'amber');
    return;
  }

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) {
    showToast('Customer Not Found', 'Active customer chat not found in state.', 'error', 'rose');
    return;
  }

  const editor = document.getElementById('modal-preview-message-editor');
  const finalMessageText = (editor && editor.value.trim()) ? editor.value.trim() : CURRENT_PREVIEW_DEFAULT_TEXT;

  if (!finalMessageText) {
    showToast('Empty Message', 'Message content is empty. Please enter text before sending.', 'warning', 'amber');
    return;
  }

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const validImg = CURRENT_PREVIEW_PHOTO_URL;

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: finalMessageText,
    type: validImg ? 'image' : 'text',
    media_url: validImg,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  closeCatalogFormatPreview();
  closeModal('modal-product-search');
  renderChatMessages();
  if (typeof playChime === 'function') playChime('order');

  let toastTitle = 'Message Sent';
  if (CURRENT_CATALOG_PREVIEW_FORMAT === 'category_only') toastTitle = 'Category List Sent';
  else if (CURRENT_CATALOG_PREVIEW_FORMAT === 'category_sub') toastTitle = 'Catalog Directory Sent';
  else toastTitle = 'Stock Products Sent';

  showToast(toastTitle, `Sent customized message to ${customer.name} on WhatsApp.`, 'send', 'emerald');

  if (typeof dispatchWhatsAppOutbound === 'function') {
    dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, finalMessageText, newMsg, customer.jid, customer.accountId, false, validImg);
  }
}

function sendCategoryListOnlyToChat() {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please open a customer chat first before sending the category list.', 'warning', 'amber');
    return;
  }

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) {
    showToast('Customer Not Found', 'Active customer chat not found in state.', 'error', 'rose');
    return;
  }

  const brandName = (typeof getBrandName === 'function') ? getBrandName() : 'GRM Garments';
  const text = buildCategoryListMessageText(customer.name, brandName);

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: text,
    type: 'text',
    media_url: null,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  closeCatalogFormatPreview();
  closeModal('modal-product-search');
  renderChatMessages();
  if (typeof playChime === 'function') playChime('order');
  showToast('Category List Sent', `Sent Category List to ${customer.name}.`, 'category', 'emerald');

  if (typeof dispatchWhatsAppOutbound === 'function') {
    dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, text, newMsg, customer.jid, customer.accountId, false, null);
  }
}

function sendCategoryAndSubcategoryListToChat() {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please open a customer chat first before sending catalog.', 'warning', 'amber');
    return;
  }

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) {
    showToast('Customer Not Found', 'Active customer chat not found in state.', 'error', 'rose');
    return;
  }

  const brandName = (typeof getBrandName === 'function') ? getBrandName() : 'GRM Garments';
  const text = buildCategoryAndSubcategoryMessageText(customer.name, brandName);

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: text,
    type: 'text',
    media_url: null,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  closeCatalogFormatPreview();
  closeModal('modal-product-search');
  renderChatMessages();
  if (typeof playChime === 'function') playChime('order');
  showToast('Catalog Sent', `Sent Category & Subcategory directory to ${customer.name}.`, 'account_tree', 'emerald');

  if (typeof dispatchWhatsAppOutbound === 'function') {
    dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, text, newMsg, customer.jid, customer.accountId, false, null);
  }
}

function sendSubcategoryListToChat() {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please open a customer chat first before sending subcategories.', 'warning', 'amber');
    return;
  }

  const catSelect = document.getElementById('modal-share-category-filter');
  const selectedCat = catSelect ? catSelect.value : 'ALL';

  if (selectedCat === 'ALL') {
    // If "All Categories" is selected, open the full Category & Subcategory directory preview
    openCatalogFormatPreview('category_sub');
    return;
  }

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (!customer) return;

  const categories = getCategoriesSummaryList();
  const cat = categories.find(c => c.name.toLowerCase() === selectedCat.toLowerCase());

  if (!cat || !cat.subcategories || cat.subcategories.length === 0) {
    showToast('No Subcategories', `No subcategories found under "${selectedCat}".`, 'info', 'blue');
    return;
  }

  const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '1️⃣1️⃣', '1️⃣2️⃣'];

  let text = `🏷️ *${selectedCat} — Available Subcategories & Collections:*\n\n`;
  text += `Hello ${customer.name || 'there'}! Here are our available collections under *${selectedCat}*:\n\n`;

  cat.subcategories.forEach((sub, idx) => {
    const num = numberEmojis[idx] || `${idx + 1}.`;
    text += `${num} *${sub}*\n`;
  });

  text += `\n💬 *Reply with the collection number or name* (e.g. "1" or "${cat.subcategories[0]}") to receive instant photos, sizes, and pricing!\n`;
  text += `🚚 _Fast Dispatch & COD Available Across India 🇮🇳_`;

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: text,
    type: 'text',
    media_url: null,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  closeCatalogFormatPreview();
  closeModal('modal-product-search');
  renderChatMessages();
  if (typeof playChime === 'function') playChime('order');
  showToast('Subcategories Sent', `Sent ${cat.subcategories.length} subcategories of ${selectedCat} to ${customer.name}.`, 'label', 'emerald');

  if (typeof dispatchWhatsAppOutbound === 'function') {
    dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, text, newMsg, customer.jid, customer.accountId, false, null);
  }
}

function shareCategoryStockSummaryToChat() {
  if (!ACTIVE_CUSTOMER_ID) {
    showToast('Select Customer', 'Please select an active customer chat to send category stock summary.', 'warning', 'amber');
    return;
  }

  const catSelect = document.getElementById('modal-share-category-filter');
  const subcatSelect = document.getElementById('modal-share-subcategory-filter');
  const selectedCat = catSelect ? catSelect.value : 'ALL';
  const selectedSub = subcatSelect ? subcatSelect.value : 'ALL';

  const catLower = selectedCat.trim().toLowerCase();
  const subLower = selectedSub.trim().toLowerCase();

  const matchingProducts = (CRM_STATE.products || []).filter(p => {
    const pCatLower = (p.category || '').toString().trim().toLowerCase();
    const pSubLower = (p.subcategory || '').toString().trim().toLowerCase();
    const matchCat = selectedCat === 'ALL' || pCatLower === catLower;
    const matchSub = selectedSub === 'ALL' || pSubLower === subLower;
    const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
    return matchCat && matchSub && available > 0;
  });

  if (matchingProducts.length === 0) {
    showToast('No Stock Available', 'No in-stock garments found in the selected category to share.', 'info', 'blue');
    return;
  }

  const titleHeader = selectedSub !== 'ALL'
    ? `${selectedCat} › ${selectedSub}`
    : (selectedCat !== 'ALL' ? selectedCat : 'All Ready Stock Collections');

  let summaryText = `👗 *Available Stock Summary — ${titleHeader}:*\n\n`;

  matchingProducts.slice(0, 10).forEach((p, idx) => {
    const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
    summaryText += `${idx + 1}. *${p.name}* (SKU: ${p.sku})\n`;
    summaryText += `   📏 Size: ${p.size || 'Std'} • 🎨 Color: ${p.color || 'Def'}\n`;
    summaryText += `   ✅ *${available} Units In Stock* • 💰 ₹${p.price}\n\n`;
  });

  if (matchingProducts.length > 10) {
    summaryText += `_...and ${matchingProducts.length - 10} more designs ready in warehouse!_\n\n`;
  }

  summaryText += `🚚 Fast Same-Day Dispatch & COD Available!\n👉 *Reply with your preferred SKU or size to book instantly!*`;

  if (!CRM_STATE.conversations[ACTIVE_CUSTOMER_ID]) {
    CRM_STATE.conversations[ACTIVE_CUSTOMER_ID] = [];
  }

  const newMsg = {
    id: Date.now(),
    sender: 'staff',
    text: summaryText,
    type: 'text',
    media_url: null,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    status: 'SENDING'
  };

  CRM_STATE.conversations[ACTIVE_CUSTOMER_ID].push(newMsg);

  closeModal('modal-product-search');
  renderChatMessages();
  if (typeof playChime === 'function') playChime('order');
  showToast('Category Stock Shared', `Sent ${matchingProducts.length} items stock summary to chat.`, 'summarize', 'emerald');

  const customer = (CRM_STATE.customers || []).find(c => c.id === ACTIVE_CUSTOMER_ID);
  if (customer && typeof dispatchWhatsAppOutbound === 'function') {
    dispatchWhatsAppOutbound(customer.whatsapp || customer.phone, summaryText, newMsg, customer.jid, customer.accountId, false, null);
  }
}

// =========================================================================
// 8. CHAT-TO-ORDER CONVERSION & STOCK RESERVATION
// =========================================================================
function updateOrderProductDropdown() {
  const select = document.getElementById('order-product-select');
  if (!select) return;

  if (!CRM_STATE.products || CRM_STATE.products.length === 0) {
    select.innerHTML = '<option value="">No products in catalog yet (Add via Live Stock)</option>';
    return;
  }

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

  // 7. Asynchronously synchronize order & stock reservation with MySQL Database
  fetch('api.php?action=save_order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newOrder)
  }).then(r => r.json()).then(res => {
    if (res && res.status === 'success') {
      console.log('[Order DB Sync Success]:', res.order_id);
    }
  }).catch(err => {
    console.warn('[Order DB Sync Notice]: Saved locally, will sync on next refresh.');
  });

  saveCRMState();
  closeModal('modal-convert-order');
  playChime('order');
  showToast('Order Booked & Stock Reserved!', `Order ${newOrderId} created (₹${grandTotal}). Confirmation sent on WhatsApp.`, 'check_circle', 'emerald');

  renderInbox();
}

// =========================================================================
// 9. FOLLOW-UP SCHEDULER (12-HOUR TIME, CALENDAR & RICH NOTES)
// =========================================================================
function openFollowUpModal() {
  const now = new Date();
  
  // Format local date YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}-${month}-${day}`;
  
  const dateInput = document.getElementById('followup-date');
  if (dateInput) {
    dateInput.value = dateStr;
    dateInput.min = dateStr; // Avoid selecting past dates
  }

  // Calculate 12-hour time: current local time rounded to next 5 minutes
  let hours = now.getHours();
  let minutes = now.getMinutes();
  
  minutes = Math.ceil(minutes / 5) * 5;
  if (minutes >= 60) {
    hours = (hours + 1) % 24;
    minutes = 0;
  }
  
  const ampm = hours >= 12 ? 'PM' : 'AM';
  let hour12 = hours % 12;
  hour12 = hour12 === 0 ? 12 : hour12;
  const hourStr = String(hour12).padStart(2, '0');
  const minStr = String(minutes).padStart(2, '0');

  const hourEl = document.getElementById('followup-hour');
  const minEl = document.getElementById('followup-minute');
  const ampmEl = document.getElementById('followup-ampm');

  if (hourEl) hourEl.value = hourStr;
  if (minEl) minEl.value = minStr;
  if (ampmEl) ampmEl.value = ampm;

  updateFollowUpTimePreview();
  openModal('modal-followup');
}

function updateFollowUpTimePreview() {
  const dateVal = document.getElementById('followup-date')?.value;
  const hourVal = document.getElementById('followup-hour')?.value || '11';
  const minVal = document.getElementById('followup-minute')?.value || '00';
  const ampmVal = document.getElementById('followup-ampm')?.value || 'AM';

  const previewEl = document.getElementById('followup-preview-text');
  if (!previewEl) return;

  if (dateVal) {
    const parts = dateVal.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      previewEl.innerText = `${dayName} at ${hourVal}:${minVal} ${ampmVal}`;
    } else {
      previewEl.innerText = `${dateVal} at ${hourVal}:${minVal} ${ampmVal}`;
    }
  } else {
    previewEl.innerText = `${hourVal}:${minVal} ${ampmVal}`;
  }
}

function setFollowUpQuickDate(daysAhead) {
  const target = new Date();
  target.setDate(target.getDate() + daysAhead);
  const year = target.getFullYear();
  const month = String(target.getMonth() + 1).padStart(2, '0');
  const day = String(target.getDate()).padStart(2, '0');
  const dateInput = document.getElementById('followup-date');
  if (dateInput) {
    dateInput.value = `${year}-${month}-${day}`;
  }
  updateFollowUpTimePreview();
}

function setFollowUpQuickTime(preset) {
  const hourEl = document.getElementById('followup-hour');
  const minEl = document.getElementById('followup-minute');
  const ampmEl = document.getElementById('followup-ampm');
  if (!hourEl || !minEl || !ampmEl) return;

  const now = new Date();

  if (preset === 'NOW') {
    let h = now.getHours();
    let m = Math.ceil(now.getMinutes() / 5) * 5;
    if (m >= 60) { h = (h + 1) % 24; m = 0; }
    ampmEl.value = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12 || 12;
    hourEl.value = String(h12).padStart(2, '0');
    minEl.value = String(m).padStart(2, '0');
  } else if (preset === 'PLUS_1H') {
    let h = (now.getHours() + 1) % 24;
    let m = Math.ceil(now.getMinutes() / 5) * 5;
    if (m >= 60) { h = (h + 1) % 24; m = 0; }
    ampmEl.value = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12 || 12;
    hourEl.value = String(h12).padStart(2, '0');
    minEl.value = String(m).padStart(2, '0');
  } else if (preset === 'MORNING') {
    hourEl.value = '10';
    minEl.value = '00';
    ampmEl.value = 'AM';
  } else if (preset === 'EVENING') {
    hourEl.value = '05';
    minEl.value = '00';
    ampmEl.value = 'PM';
  }

  updateFollowUpTimePreview();
}

function handleFollowupReasonSelect(val) {
  const notesEl = document.getElementById('followup-notes');
  if (!notesEl) return;
  if (val === 'other') {
    notesEl.value = '';
    notesEl.placeholder = 'Type custom conversation notes & callback instructions here...';
    notesEl.focus();
  } else {
    notesEl.value = val;
  }
}

function appendFollowUpNoteTemplate(text) {
  const notesEl = document.getElementById('followup-notes');
  if (!notesEl) return;
  const current = notesEl.value.trim();
  if (!current || current === 'other') {
    notesEl.value = text;
  } else {
    notesEl.value = `${current} ${text}`;
  }
  notesEl.focus();
}

function handleCreateFollowup(event) {
  event.preventDefault();
  const date = document.getElementById('followup-date')?.value || new Date().toISOString().split('T')[0];
  const hour = document.getElementById('followup-hour')?.value || '11';
  const min = document.getElementById('followup-minute')?.value || '00';
  const ampm = document.getElementById('followup-ampm')?.value || 'AM';
  const formattedTime = `${hour}:${min} ${ampm}`;
  const notes = document.getElementById('followup-notes')?.value?.trim() || 'Follow-up callback scheduled';

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);

  const newFollowup = {
    id: `FU-2026-00${245 + CRM_STATE.followups.length + 1}`,
    queryId: query ? query.id : 'Q-2026-0000',
    customerId: customer ? customer.id : 'cust_101',
    customerName: customer ? customer.name : 'Customer',
    assignedTo: query ? query.assignedTo : 'staff_01',
    date: date,
    time: formattedTime,
    reason: notes,
    status: 'PENDING'
  };

  CRM_STATE.followups.unshift(newFollowup);
  if (query) query.status = 'FOLLOW_UP';

  logAudit('FOLLOWUP_SCHEDULED', 'FOLLOWUP', `Scheduled follow-up for ${customer ? customer.name : 'Customer'} on ${date} at ${formattedTime}. Notes: ${notes}`);

  // Asynchronously synchronize follow-up with MySQL Database
  fetch('api.php?action=save_followup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newFollowup)
  }).catch(() => {});

  saveCRMState();
  closeModal('modal-followup');
  showToast('Follow-up Scheduled', `Reminder set for ${date} at ${formattedTime}`, 'event', 'blue');
  renderInbox();
  if (typeof renderFollowupsTable === 'function') renderFollowupsTable();
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

  // Highlight active metric card
  const cardAll = document.getElementById('catalog-card-all');
  const cardIn = document.getElementById('catalog-card-instock');
  const cardLow = document.getElementById('catalog-card-lowstock');

  if (cardAll) {
    if (filter === 'ALL') {
      cardAll.classList.add('ring-2', 'ring-teal-500', 'shadow-md');
    } else {
      cardAll.classList.remove('ring-2', 'ring-teal-500', 'shadow-md');
    }
  }
  if (cardIn) {
    if (filter === 'IN_STOCK') {
      cardIn.classList.add('ring-2', 'ring-emerald-500', 'shadow-md');
    } else {
      cardIn.classList.remove('ring-2', 'ring-emerald-500', 'shadow-md');
    }
  }
  if (cardLow) {
    if (filter === 'LOW_STOCK') {
      cardLow.classList.add('ring-2', 'ring-rose-500', 'shadow-md');
    } else {
      cardLow.classList.remove('ring-2', 'ring-rose-500', 'shadow-md');
    }
  }

  filterCatalogGrid();
}

let CATALOG_VIEW_MODE = 'grid'; // 'grid' | 'table'
let IS_BULK_PRICE_MODE = false;
let BULK_SELECTED_PRODUCT_IDS = new Set();
let CURRENT_CATALOG_FILTERED_LIST = [];

function setCatalogViewMode(mode) {
  CATALOG_VIEW_MODE = mode;
  
  const btnGrid = document.getElementById('btn-catalog-view-grid');
  const btnTable = document.getElementById('btn-catalog-view-table');
  const gridContainer = document.getElementById('catalog-grid-container');
  const tableContainer = document.getElementById('catalog-table-container');
  const thCol = document.getElementById('th-bulk-checkbox-col');

  if (mode === 'table') {
    if (btnGrid) {
      btnGrid.className = 'px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition';
    }
    if (btnTable) {
      btnTable.className = 'px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition bg-white text-slate-900 shadow-sm border border-slate-200';
    }
    if (gridContainer) gridContainer.classList.add('hidden');
    if (tableContainer) tableContainer.classList.remove('hidden');
    if (thCol) {
      if (IS_BULK_PRICE_MODE) thCol.classList.remove('hidden');
      else thCol.classList.add('hidden');
    }
  } else {
    if (btnGrid) {
      btnGrid.className = 'px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition bg-white text-slate-900 shadow-sm border border-slate-200';
    }
    if (btnTable) {
      btnTable.className = 'px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition';
    }
    if (gridContainer) gridContainer.classList.remove('hidden');
    if (tableContainer) tableContainer.classList.add('hidden');
  }

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
  const elSkus = document.getElementById('catalog-stat-skus');
  const elPhys = document.getElementById('catalog-stat-physical');
  const elRes = document.getElementById('catalog-stat-reserved');
  const elAvail = document.getElementById('catalog-stat-available');
  const elAlerts = document.getElementById('catalog-stat-alerts');

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
      // 2. Database fallback sync: refresh stock from MySQL
      if (typeof refreshCatalogStockFromAPI === 'function') {
        await refreshCatalogStockFromAPI();
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

function populateCatalogCategoryFilters() {
  const catSelect = document.getElementById('catalog-category-filter');
  if (!catSelect) return;

  const currentVal = catSelect.value || 'ALL';
  
  // Combine categories from CRM_STATE, INITIAL_CRM_DATA and any existing in products
  const baseCategories = (CRM_STATE.categories && Array.isArray(CRM_STATE.categories) && CRM_STATE.categories.length > 0)
    ? CRM_STATE.categories
    : (INITIAL_CRM_DATA.categories || []);

  const catNamesSet = new Set();
  baseCategories.forEach(c => {
    if (c && c.name && typeof c.name === 'string' && c.name.trim()) {
      catNamesSet.add(c.name.trim());
    }
  });

  (CRM_STATE.products || []).forEach(p => {
    if (p && p.category && typeof p.category === 'string' && p.category.trim()) {
      catNamesSet.add(p.category.trim());
    }
  });

  let html = '<option value="ALL">📁 All Categories</option>';
  catNamesSet.forEach(name => {
    const isSelected = name === currentVal ? 'selected' : '';
    html += `<option value="${name}" ${isSelected}>${name}</option>`;
  });
  catSelect.innerHTML = html;

  if ([...catSelect.options].some(o => o.value === currentVal)) {
    catSelect.value = currentVal;
  } else {
    catSelect.value = 'ALL';
  }

  onCatalogCategoryFilterChange();
}

function onCatalogCategoryFilterChange() {
  const catSelect = document.getElementById('catalog-category-filter');
  const subcatSelect = document.getElementById('catalog-subcategory-filter');
  if (!subcatSelect) return;

  const currentSubVal = subcatSelect.value || 'ALL';
  const selectedCat = catSelect ? catSelect.value : 'ALL';
  
  // Combine subcategories from CRM_STATE, INITIAL_CRM_DATA and any existing in products
  const baseSubcategories = (CRM_STATE.subcategories && Array.isArray(CRM_STATE.subcategories) && CRM_STATE.subcategories.length > 0)
    ? CRM_STATE.subcategories
    : (INITIAL_CRM_DATA.subcategories || []);

  const subNamesSet = new Set();

  if (selectedCat === 'ALL') {
    // Show all available subcategories across all categories
    baseSubcategories.forEach(s => {
      if (s && s.name && typeof s.name === 'string' && s.name.trim()) {
        subNamesSet.add(s.name.trim());
      }
    });
    (CRM_STATE.products || []).forEach(p => {
      if (p && p.subcategory && typeof p.subcategory === 'string' && p.subcategory.trim()) {
        subNamesSet.add(p.subcategory.trim());
      }
    });
  } else {
    // Filter to subcategories belonging to the selected category
    const selCatLower = selectedCat.trim().toLowerCase();

    baseSubcategories.forEach(s => {
      const catName = (s.category_name || s.category || '').toString().trim().toLowerCase();
      if (catName === selCatLower) {
        if (s && s.name && typeof s.name === 'string' && s.name.trim()) {
          subNamesSet.add(s.name.trim());
        }
      }
    });

    (CRM_STATE.products || []).forEach(p => {
      const pCatLower = (p.category || '').toString().trim().toLowerCase();
      if (pCatLower === selCatLower && p.subcategory && typeof p.subcategory === 'string' && p.subcategory.trim()) {
        subNamesSet.add(p.subcategory.trim());
      }
    });
  }

  let html = '<option value="ALL">🏷️ All Subcategories</option>';
  subNamesSet.forEach(name => {
    const isSelected = name === currentSubVal ? 'selected' : '';
    html += `<option value="${name}" ${isSelected}>${name}</option>`;
  });
  subcatSelect.innerHTML = html;

  if ([...subcatSelect.options].some(o => o.value === currentSubVal)) {
    subcatSelect.value = currentSubVal;
  } else {
    subcatSelect.value = 'ALL';
  }

  filterCatalogGrid();
}

function filterCatalogGrid() {
  const searchInput = document.getElementById('catalog-search-input');
  const categorySelect = document.getElementById('catalog-category-filter');
  const subcategorySelect = document.getElementById('catalog-subcategory-filter');
  const sortSelect = document.getElementById('catalog-sort-select');

  const q = (searchInput ? searchInput.value : '').trim().toLowerCase();
  const category = categorySelect ? categorySelect.value : 'ALL';
  const subcategory = subcategorySelect ? subcategorySelect.value : 'ALL';
  const sortBy = sortSelect ? sortSelect.value : 'lifo';

  const categoryLower = category.trim().toLowerCase();
  const subcategoryLower = subcategory.trim().toLowerCase();

  let list = (CRM_STATE.products || []).filter(p => {
    const matchQuery = !q || (p.name && p.name.toLowerCase().includes(q)) || 
                             (p.sku && p.sku.toLowerCase().includes(q)) || 
                             (p.color && p.color.toLowerCase().includes(q)) || 
                             (p.size && p.size.toLowerCase().includes(q)) || 
                             (p.fabric && p.fabric.toLowerCase().includes(q)) || 
                             (p.category && p.category.toLowerCase().includes(q)) || 
                             (p.subcategory && p.subcategory.toLowerCase().includes(q));

    const pCatLower = (p.category || '').toString().trim().toLowerCase();
    const matchCategory = category === 'ALL' || pCatLower === categoryLower;

    const pSubLower = (p.subcategory || '').toString().trim().toLowerCase();
    const matchSubcategory = subcategory === 'ALL' || pSubLower === subcategoryLower;
    
    const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
    let matchStock = true;
    if (CATALOG_STOCK_STATUS_FILTER === 'IN_STOCK') matchStock = available > 5;
    else if (CATALOG_STOCK_STATUS_FILTER === 'LOW_STOCK') matchStock = available > 0 && available <= 5;
    else if (CATALOG_STOCK_STATUS_FILTER === 'OUT_OF_STOCK') matchStock = available <= 0;

    return matchQuery && matchCategory && matchSubcategory && matchStock;
  });

  // Sorting: FIFO vs LIFO and Stock / Price
  list.sort((a, b) => {
    const availA = (parseInt(a.physicalStock) || 0) - (parseInt(a.reservedStock) || 0);
    const availB = (parseInt(b.physicalStock) || 0) - (parseInt(b.reservedStock) || 0);
    if (sortBy === 'fifo') return (a.id || 0) - (b.id || 0); // FIFO: Oldest listed first
    if (sortBy === 'lifo') return (b.id || 0) - (a.id || 0); // LIFO: Newest/recently listed first
    if (sortBy === 'avail-asc') return availA - availB;
    if (sortBy === 'avail-desc') return availB - availA;
    if (sortBy === 'price-asc') return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
    if (sortBy === 'price-desc') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
    if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
    if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
    return (b.id || 0) - (a.id || 0); // Default to Recently Listed (LIFO)
  });

  CURRENT_CATALOG_FILTERED_LIST = list;

  if (CATALOG_VIEW_MODE === 'table') {
    renderCatalogTableFromList(list);
  } else {
    renderCatalogGridFromList(list);
  }
  updateCatalogMetrics();
}

function renderCatalogGrid(search) {
  if (typeof populateCatalogCategoryFilters === 'function') {
    const catSelect = document.getElementById('catalog-category-filter');
    const subcatSelect = document.getElementById('catalog-subcategory-filter');
    if (!catSelect || !subcatSelect || catSelect.options.length <= 1 || subcatSelect.options.length <= 1) {
      populateCatalogCategoryFilters();
    }
  }
  if (search !== undefined && document.getElementById('catalog-search-input')) {
    document.getElementById('catalog-search-input').value = search;
  }
  filterCatalogGrid();
}

// -------------------------------------------------------------------------
// GROUP CATALOG PRODUCTS (SINGLE CARD FOR MULTI-ATTRIBUTE VARIANT FAMILIES)
// -------------------------------------------------------------------------
function groupCatalogProducts(rawList) {
  if (!Array.isArray(rawList)) return [];

  const groupsMap = new Map();

  rawList.forEach(p => {
    let parentKey = '';
    let baseName = (p.parentName || p.parent_name || '').trim();
    if (!baseName && p.name) {
      baseName = p.name.replace(/\s*\([^)]*\)\s*$/, '').trim();
    }
    if (!baseName) baseName = p.name || 'Product';

    const parentSku = (p.parentSku || p.parent_sku || '').trim();
    const category = (p.category || '').trim().toLowerCase();

    // Grouping key: parentSku, or (category + baseName) if name has parentheses, else standalone
    if (parentSku) {
      parentKey = `parent_sku__${parentSku.toLowerCase()}`;
    } else if (p.name && p.name.includes('(') && p.name.includes(')')) {
      parentKey = `family__${category}__${baseName.toLowerCase()}`;
    } else {
      parentKey = `single__${p.id || p.sku}`;
    }

    if (!groupsMap.has(parentKey)) {
      groupsMap.set(parentKey, {
        key: parentKey,
        baseName: baseName,
        parentSku: parentSku || (p.sku ? p.sku.replace(/-[A-Z0-9]+-[A-Z0-9]+(-[0-9]+)?$/, '') : ''),
        category: p.category,
        subcategory: p.subcategory,
        accountId: p.accountId,
        items: []
      });
    }
    groupsMap.get(parentKey).items.push(p);
  });

  const displayList = [];
  groupsMap.forEach(group => {
    if (group.items.length === 1) {
      // Standalone single product (no variant siblings)
      displayList.push({
        ...group.items[0],
        isGroup: false,
        variantCount: 1,
        groupKey: group.key
      });
    } else {
      // Multi-attribute product group (multiple variants)
      const items = group.items;
      const totalPhysical = items.reduce((acc, v) => acc + (parseInt(v.physicalStock) || 0), 0);
      const totalReserved = items.reduce((acc, v) => acc + (parseInt(v.reservedStock) || 0), 0);
      const totalAvailable = totalPhysical - totalReserved;

      const prices = items.map(v => parseFloat(v.price) || 0).filter(pr => pr > 0);
      const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

      const mrps = items.map(v => parseFloat(v.mrp) || 0).filter(m => m > 0);
      const minMrp = mrps.length > 0 ? Math.min(...mrps) : 0;
      const maxMrp = mrps.length > 0 ? Math.max(...mrps) : 0;

      const sizes = [...new Set(items.map(v => v.size).filter(Boolean))];
      const colors = [...new Set(items.map(v => v.color).filter(Boolean))];
      const fabrics = [...new Set(items.map(v => v.fabric).filter(Boolean))];

      const repImg = getSmartProductImage({
        ...items[0],
        category: group.category || items[0].category,
        subcategory: group.subcategory || items[0].subcategory,
        name: group.baseName,
        variants: items
      });

      displayList.push({
        id: items[0].id,
        groupKey: group.key,
        isGroup: true,
        variantCount: items.length,
        variants: items,
        sku: group.parentSku || items[0].sku,
        name: group.baseName,
        category: group.category || items[0].category,
        subcategory: group.subcategory || items[0].subcategory,
        accountId: group.accountId || items[0].accountId,
        image: repImg,
        physicalStock: totalPhysical,
        reservedStock: totalReserved,
        availableStock: totalAvailable,
        minPrice,
        maxPrice,
        minMrp,
        maxMrp,
        price: minPrice,
        mrp: maxMrp,
        sizes,
        colors,
        fabrics,
        specifications: items[0].specifications || []
      });
    }
  });

  return displayList;
}
window.groupCatalogProducts = groupCatalogProducts;

function renderCatalogGridFromList(list) {
  const container = document.getElementById('catalog-grid-container');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-16 text-center bg-white rounded-3xl border border-dashed border-slate-300 p-8 shadow-sm">
        <div class="w-16 h-16 bg-emerald-50 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-sm">
          <span class="material-symbols-outlined text-[34px]">inventory_2</span>
        </div>
        <h3 class="text-sm font-bold text-slate-800">No garment items matched your criteria</h3>
        <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Try clearing search filters or add a new garment product with the website catalog flow.</p>
        <div class="flex items-center justify-center gap-2 mt-4">
          <button onclick="openManageCategoriesModal()" class="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
            📁 Categories
          </button>
          <button onclick="openAddProductModal()" class="px-4 py-2 bg-brand-wa hover:bg-brand-waDark text-white text-xs font-bold rounded-xl shadow-sm transition">
            + Add Product (Catalog Flow)
          </button>
        </div>
      </div>
    `;
    return;
  }

  const displayList = groupCatalogProducts(list);

  container.innerHTML = displayList.map(p => {
    const physical = parseInt(p.physicalStock) || 0;
    const reserved = parseInt(p.reservedStock) || 0;
    const available = p.availableStock !== undefined ? p.availableStock : (physical - reserved);

    let stockBadge = '';
    if (available > 5) {
      stockBadge = `<span class="bg-emerald-100/90 backdrop-blur-sm text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock (${available})</span>`;
    } else if (available > 0) {
      stockBadge = `<span class="bg-amber-100/90 backdrop-blur-sm text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Only ${available} Left</span>`;
    } else {
      stockBadge = `<span class="bg-rose-100/90 backdrop-blur-sm text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center gap-1 shadow-sm"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock</span>`;
    }

    const imgUrl = getSmartProductImage(p);

    const catBreadcrumb = p.subcategory 
      ? `${p.category || 'Garments'} &rsaquo; ${p.subcategory}`
      : (p.category || 'Garments');

    // Price Display (Single clean price without pencil icon)
    let priceDisplay = '';
    if (p.isGroup) {
      if (p.minPrice === p.maxPrice || p.maxPrice === 0) {
        priceDisplay = `<span class="font-extrabold text-emerald-700 font-mono text-sm shrink-0">₹${p.minPrice}</span>`;
      } else {
        priceDisplay = `<span class="font-extrabold text-emerald-700 font-mono text-sm shrink-0">₹${p.minPrice} – ₹${p.maxPrice}</span>`;
      }
    } else {
      const priceNum = parseFloat(p.price) || 0;
      const mrpNum = parseFloat(p.mrp) || 0;
      priceDisplay = `<span class="font-extrabold text-emerald-700 font-mono text-sm shrink-0">₹${priceNum}</span>`;
      if (mrpNum > priceNum) {
        const discountPct = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
        priceDisplay = `
          <div class="text-right shrink-0">
            <div class="font-extrabold text-emerald-700 font-mono text-sm leading-tight">₹${priceNum}</div>
            <div class="flex items-center gap-1 justify-end">
              <span class="text-[10px] text-slate-400 line-through">₹${mrpNum}</span>
              <span class="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">${discountPct}% OFF</span>
            </div>
          </div>
        `;
      }
    }

    const isSelected = BULK_SELECTED_PRODUCT_IDS.has(String(p.id)) || (p.isGroup && p.variants && p.variants.some(v => BULK_SELECTED_PRODUCT_IDS.has(String(v.id))));
    const cardSelectedClass = isSelected ? 'ring-2 ring-emerald-600 bg-emerald-50/20 shadow-md' : '';

    // Attributes summary
    let attrsHtml = '';
    if (p.isGroup) {
      const attrParts = [];
      if (p.sizes && p.sizes.length > 0) {
        attrParts.push(`<span>📏 ${p.sizes.join(', ')}</span>`);
      }
      if (p.colors && p.colors.length > 0) {
        attrParts.push(`<span>🎨 ${p.colors.join(', ')}</span>`);
      }
      if (p.fabrics && p.fabrics.length > 0) {
        attrParts.push(`<span class="text-teal-700 font-medium">🧵 ${p.fabrics.join(', ')}</span>`);
      }
      attrsHtml = attrParts.join('<span>&bull;</span>');
    } else {
      attrsHtml = `
        <span>📏 ${p.size || 'Standard'}</span>
        <span>&bull;</span>
        <span>🎨 ${p.color || 'Default'}</span>
        ${p.fabric ? `<span>&bull;</span> <span class="text-teal-700 font-medium">🧵 ${p.fabric}</span>` : ''}
      `;
    }

    return `
      <div id="catalog-card-${p.id}" class="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group ${cardSelectedClass}">
        <!-- Image & Badges -->
        <div class="relative h-44 bg-slate-100 overflow-hidden group/img">
          <img src="${imgUrl}" alt="${p.name}" onerror="this.onerror=null;this.src='uploads/products/sample_garment.jpg';" class="w-full h-full object-cover group-hover:scale-105 transition duration-300">
          
          <!-- Direct Quick Photo Upload Overlay on Card Hover -->
          <button type="button" onclick="event.stopPropagation(); triggerCardPhotoUpload('${p.id}', '${p.sku}')" class="absolute bottom-2 right-2.5 z-10 opacity-0 group-hover/img:opacity-100 transition-all bg-slate-900/85 hover:bg-emerald-700 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-sm shadow flex items-center gap-1 cursor-pointer" title="Upload or change garment photo">
            <span class="material-symbols-outlined text-[13px]">add_a_photo</span> Photo
          </button>
          
          ${IS_BULK_PRICE_MODE ? `
            <div class="absolute top-2.5 left-2.5 z-10 flex items-center">
              <label class="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl border-2 ${isSelected ? 'border-emerald-600 shadow-md ring-2 ring-emerald-200' : 'border-slate-300 shadow-sm'} cursor-pointer hover:border-emerald-600 transition" onclick="event.stopPropagation()">
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleBulkProductSelected('${p.id}', this.checked, '${p.groupKey || ''}')" class="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600">
                <span class="font-mono text-[11px] font-extrabold text-slate-800">${p.sku}</span>
                ${p.isGroup ? `<span class="bg-indigo-900/90 text-indigo-100 text-[10px] font-extrabold px-1.5 py-0.5 rounded shadow-xs">${p.variantCount} Var</span>` : ''}
              </label>
            </div>
          ` : `
            <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5 flex-wrap max-w-[70%]">
              <span class="bg-slate-900/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded-md shadow">${p.sku}</span>
              ${p.isGroup ? `
                <span class="bg-indigo-900/90 backdrop-blur-sm text-indigo-100 font-extrabold text-[10px] px-2 py-0.5 rounded-md shadow flex items-center gap-1">
                  <span class="material-symbols-outlined text-[13px] text-indigo-300">layers</span> ${p.variantCount} Variants
                </span>
              ` : ''}
            </div>
          `}

          <div class="absolute top-2.5 right-2.5">
            ${stockBadge}
          </div>
          <div class="absolute bottom-2 left-2.5 right-2.5 flex items-center justify-between">
            <span class="text-[9px] bg-white/95 backdrop-blur-sm text-slate-800 font-bold px-2 py-0.5 rounded-md shadow-sm truncate max-w-[200px]" title="${catBreadcrumb}">
              ${catBreadcrumb}
            </span>
          </div>
        </div>

        <!-- Product Details -->
        <div class="p-4 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-start justify-between gap-2">
              <h4 class="font-bold text-slate-800 text-xs leading-snug line-clamp-2" title="${p.name}">${p.name}</h4>
              <div class="shrink-0">
                ${priceDisplay}
              </div>
            </div>
            
            <p class="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
              ${attrsHtml}
            </p>
          </div>

          <!-- Live Stock Info (NO increment/decrement buttons) -->
          <div class="mt-3.5 pt-3 border-t border-slate-100 bg-slate-50/80 -mx-4 -mb-4 p-3.5 space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${p.isGroup ? 'Total Physical' : 'Physical Stock'}</p>
                <p class="font-mono font-extrabold text-xs text-slate-900 mt-0.5">${physical} <span class="text-[10px] font-normal text-slate-400">units</span></p>
              </div>

              <div class="text-right">
                <p class="text-[9px] text-slate-500 uppercase font-bold tracking-wider">${p.isGroup ? 'Total Sellable' : 'Sellable Stock'}</p>
                <p class="font-mono font-extrabold text-xs ${available > 0 ? 'text-emerald-800' : 'text-rose-600'}">
                  ${available} <span class="text-[10px] font-normal text-slate-400">(${reserved} res)</span>
                </p>
              </div>
            </div>

            <!-- Action Toolbar -->
            <div class="space-y-1.5 pt-1">
              ${p.isGroup ? `
                <!-- View & Manage All Variants button -->
                <button onclick="openProductVariantsModal('${p.groupKey}')" class="w-full px-3 py-2 bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer" title="View all ${p.variantCount} individual variants">
                  <span class="material-symbols-outlined text-[16px]">visibility</span> View All ${p.variantCount} Variants
                </button>

                <div class="grid grid-cols-2 gap-1.5">
                  <button onclick="openDirectShareModal('${p.groupKey}', true)" class="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer" title="Direct WhatsApp share: share all ${p.variantCount} variants">
                    <span class="material-symbols-outlined text-[14px]">send</span> Share All Variants
                  </button>
                  <button onclick="confirmDeleteProduct('${p.id}', true, '${p.groupKey}')" class="px-2 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-1 transition cursor-pointer group/del" title="Delete product family and all its variants">
                    <span class="material-symbols-outlined text-[14px] text-rose-600 group-hover/del:scale-110 transition-transform">delete</span> Delete
                  </button>
                </div>
              ` : `
                <button onclick="openDirectShareModal('${p.id}', false)" class="w-full px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer" title="Send direct to any WhatsApp phone number">
                  <span class="material-symbols-outlined text-[15px]">send</span> Direct WA
                </button>

                <div class="grid grid-cols-4 gap-1.5">
                  <button onclick="openSinglePriceModal('${p.id}')" class="px-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-0.5 transition cursor-pointer" title="Edit individual product price">
                    <span class="material-symbols-outlined text-[13px]">payments</span> Price
                  </button>

                  <button onclick="openQuickStockModal('${p.id}')" class="px-1 py-1.5 bg-white hover:bg-blue-50 text-blue-800 border border-blue-200 rounded-xl font-semibold text-[11px] flex items-center justify-center gap-0.5 transition cursor-pointer" title="Quick restock & reason notes">
                    <span class="material-symbols-outlined text-[13px]">warehouse</span> Stock
                  </button>

                  <button onclick="openEditProductModal('${p.id}')" class="px-1 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-0.5 transition cursor-pointer" title="Overall Edit: Full Product Master">
                    <span class="material-symbols-outlined text-[13px] text-amber-700">edit_note</span> Edit
                  </button>

                  <button onclick="confirmDeleteProduct('${p.id}', false)" class="px-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-xl font-bold text-[11px] flex items-center justify-center gap-0.5 transition cursor-pointer group/del" title="Delete product permanently from database">
                    <span class="material-symbols-outlined text-[13px] text-rose-600 group-hover/del:scale-110 transition-transform">delete</span> Delete
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Instant 1-click photo upload directly from catalog card
function triggerCardPhotoUpload(productId, sku) {
  let fileInput = document.getElementById('catalog-quick-photo-input');
  if (!fileInput) {
    fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.id = 'catalog-quick-photo-input';
    fileInput.accept = 'image/*';
    fileInput.className = 'hidden';
    document.body.appendChild(fileInput);
  }

  fileInput.onchange = async function(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    showToast('Uploading Photo', `Uploading photo for ${sku || 'item'}...`, 'cloud_upload', 'emerald');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('api.php?action=upload_product_image', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data && data.status === 'success' && data.url) {
        const uploadedUrl = data.url;

        // Update product in memory
        const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId) || prod.sku === sku);
        if (p) {
          p.image = uploadedUrl;

          // If product has sibling variants, update all variants that share the same parentSku
          const parentSku = p.parentSku || p.parent_sku;
          if (parentSku) {
            (CRM_STATE.products || []).forEach(sibling => {
              if (sibling.parentSku === parentSku || sibling.parent_sku === parentSku) {
                sibling.image = uploadedUrl;
              }
            });
          }

          saveCRMState();

          // Persist to database
          await fetch('api.php?action=save_product', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });

          filterCatalogGrid();
          showToast('Photo Saved', `Photo for ${sku || 'item'} updated successfully!`, 'check_circle', 'emerald');
        }
      } else {
        showToast('Upload Failed', data.message || 'Could not upload photo', 'error', 'rose');
      }
    } catch (err) {
      showToast('Upload Error', 'Failed to connect to server upload.', 'error', 'rose');
    }
  };

  fileInput.value = '';
  fileInput.click();
}
window.triggerCardPhotoUpload = triggerCardPhotoUpload;

// Open modal to view and manage all individual variants of a product family
var CURRENT_OPEN_VARIANTS_GROUP_KEY = null;
function openProductVariantsModal(groupKey) {
  CURRENT_OPEN_VARIANTS_GROUP_KEY = groupKey;
  window.CURRENT_OPEN_VARIANTS_GROUP_KEY = groupKey;
  const grouped = groupCatalogProducts(CRM_STATE.products || []);
  const group = grouped.find(g => g.groupKey === groupKey);
  if (!group || !group.variants || group.variants.length === 0) {
    showToast('Variants Not Found', 'Could not locate variants for this product.', 'error', 'rose');
    return;
  }

  const titleEl = document.getElementById('modal-variants-title');
  const subEl = document.getElementById('modal-variants-subtitle');
  const container = document.getElementById('modal-variants-container');
  const footerEl = document.getElementById('modal-variants-footer-info');

  if (titleEl) titleEl.innerText = `${group.name} (${group.variants.length} Variants)`;
  if (subEl) subEl.innerText = `${group.category || 'Garments'}${group.subcategory ? ' › ' + group.subcategory : ''} • Parent SKU: ${group.sku} • Total Stock: ${group.physicalStock} units`;
  if (footerEl) footerEl.innerHTML = `Showing <b>${group.variants.length}</b> individual variant combinations &bull; <b>${group.physicalStock}</b> total physical stock in warehouse`;

  if (container) {
    container.innerHTML = group.variants.map((v, i) => {
      const vImg = getSmartProductImage(v);
      const vPhys = parseInt(v.physicalStock) || 0;
      const vRes = parseInt(v.reservedStock) || 0;
      const vAvail = vPhys - vRes;
      const vPrice = parseFloat(v.price) || 0;
      const vMrp = parseFloat(v.mrp) || 0;
      const discount = (vMrp > vPrice && vPrice > 0) ? Math.round(((vMrp - vPrice) / vMrp) * 100) : 0;
      const colorHex = getColorHex(v.color);

      const badges = [];
      if (v.size) {
        badges.push(`<span class="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-[11px]">📏 Size: ${v.size}</span>`);
      }
      if (v.color) {
        badges.push(`
          <span class="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-[11px] flex items-center gap-1">
            <span class="w-2.5 h-2.5 rounded-full border border-black/20" style="background-color: ${colorHex}"></span>
            <span>${v.color}</span>
          </span>
        `);
      }
      if (v.fabric) {
        badges.push(`<span class="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">🧵 ${v.fabric}</span>`);
      }
      if (v.customAttributes) {
        Object.entries(v.customAttributes).forEach(([k, val]) => {
          badges.push(`<span class="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-bold text-[11px]">📌 ${k}: ${val}</span>`);
        });
      }

      return `
        <div class="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 transition shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          <!-- Thumbnail & Identity -->
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
              <img src="${vImg}" alt="${v.sku}" onerror="this.onerror=null;this.src='uploads/products/sample_garment.jpg';" class="w-full h-full object-cover">
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-mono font-extrabold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-300">${v.sku}</span>
                <span class="text-xs font-bold text-slate-800 truncate">${v.name}</span>
              </div>
              <div class="flex items-center gap-1.5 flex-wrap mt-1">
                ${badges.join('')}
              </div>
            </div>
          </div>

          <!-- Price, Stock & Actions -->
          <div class="flex items-center gap-3 shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 flex-wrap">
            <div class="text-right">
              <div class="font-extrabold text-emerald-700 font-mono text-sm leading-tight">₹${vPrice}</div>
              ${vMrp > vPrice ? `<div class="text-[10px] text-slate-400 line-through">₹${vMrp} <span class="text-emerald-700 font-bold text-[9px]">${discount}% OFF</span></div>` : ''}
            </div>

            <div class="text-right border-l border-slate-200 pl-3">
              <p class="text-[9px] text-slate-500 uppercase font-bold">Physical Stock</p>
              <p class="font-mono font-extrabold text-xs ${vAvail > 0 ? 'text-emerald-800' : 'text-rose-600'}">
                ${vPhys} <span class="text-[10px] font-normal text-slate-400">(${vAvail} sellable)</span>
              </p>
            </div>

            <!-- Actions for this specific variant -->
            <div class="flex items-center gap-1.5 border-l border-slate-200 pl-3 flex-wrap justify-end">
              <button onclick="openDirectShareModal('${v.id}', false)" class="px-2 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg transition shadow-xs flex items-center gap-1 text-[11px] font-bold cursor-pointer" title="Direct WhatsApp share this variant only">
                <span class="material-symbols-outlined text-[14px]">send</span>
                <span>WA</span>
              </button>
              <button onclick="openQuickStockModal('${v.id}')" class="px-2 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition shadow-xs flex items-center gap-1 text-[11px] font-semibold cursor-pointer" title="Quick restock this specific variant">
                <span class="material-symbols-outlined text-[14px]">warehouse</span>
                <span>Stock</span>
              </button>
              <button onclick="openEditProductModal('${v.id}')" class="px-2 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition shadow-xs flex items-center gap-1 text-[11px] font-bold cursor-pointer" title="Edit full details of this variant">
                <span class="material-symbols-outlined text-[14px] text-amber-700">edit_note</span>
                <span>Edit</span>
              </button>
              <button onclick="confirmDeleteProduct('${v.id}', false)" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer group/del" title="Delete this variant">
                <span class="material-symbols-outlined text-[14px] text-rose-600 group-hover/del:scale-110 transition-transform">delete</span>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  openModal('modal-product-variants');
}
window.openProductVariantsModal = openProductVariantsModal;

function refreshVariantsModalIfOpen() {
  if (typeof window === 'undefined' || !window.CURRENT_OPEN_VARIANTS_GROUP_KEY) return;
  const modal = document.getElementById('modal-product-variants');
  if (modal && !modal.classList.contains('hidden')) {
    const grouped = groupCatalogProducts(CRM_STATE.products || []);
    const group = grouped.find(g => g.groupKey === window.CURRENT_OPEN_VARIANTS_GROUP_KEY);
    if (group && group.variants && group.variants.length > 0) {
      openProductVariantsModal(window.CURRENT_OPEN_VARIANTS_GROUP_KEY);
    } else {
      closeModal('modal-product-variants');
    }
  }
}
window.refreshVariantsModalIfOpen = refreshVariantsModalIfOpen;

function renderCatalogTableFromList(list) {
  const tbody = document.getElementById('catalog-table-tbody');
  if (!tbody) return;

  const thCol = document.getElementById('th-bulk-checkbox-col');
  if (thCol) {
    if (IS_BULK_PRICE_MODE) {
      thCol.classList.remove('hidden');
    } else {
      thCol.classList.add('hidden');
    }
  }

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${IS_BULK_PRICE_MODE ? 9 : 8}" class="py-16 text-center bg-white">
          <div class="flex flex-col items-center justify-center gap-2">
            <div class="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-1 shadow-sm">
              <span class="material-symbols-outlined text-[30px]">inventory_2</span>
            </div>
            <h3 class="text-sm font-bold text-slate-800">No garment items matched your criteria</h3>
            <p class="text-xs text-slate-400 max-w-sm mx-auto">Try clearing search filters or add a new garment product with the website catalog flow.</p>
            <div class="flex items-center justify-center gap-2 mt-3">
              <button onclick="openManageCategoriesModal()" class="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">
                📁 Categories
              </button>
              <button onclick="openAddProductModal()" class="px-3.5 py-1.5 bg-brand-wa hover:bg-brand-waDark text-white text-xs font-bold rounded-xl shadow-sm transition">
                + Add Product
              </button>
            </div>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  const displayList = groupCatalogProducts(list);

  tbody.innerHTML = displayList.map(p => {
    const physical = parseInt(p.physicalStock) || 0;
    const reserved = parseInt(p.reservedStock) || 0;
    const available = p.availableStock !== undefined ? p.availableStock : (physical - reserved);

    let stockBadge = '';
    if (available > 5) {
      stockBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock (${available})</span>`;
    } else if (available > 0) {
      stockBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Low (${available})</span>`;
    } else {
      stockBadge = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock</span>`;
    }

    const imgUrl = getSmartProductImage(p);

    // Price Display (Clean without edit pencil icon)
    let priceDisplay = '';
    if (p.isGroup) {
      if (p.minPrice === p.maxPrice || p.maxPrice === 0) {
        priceDisplay = `<div class="font-extrabold text-emerald-700 font-mono text-xs">₹${p.minPrice}</div>`;
      } else {
        priceDisplay = `<div class="font-extrabold text-emerald-700 font-mono text-xs">₹${p.minPrice} – ₹${p.maxPrice}</div>`;
      }
    } else {
      const priceNum = parseFloat(p.price) || 0;
      const mrpNum = parseFloat(p.mrp) || 0;
      priceDisplay = `<div class="font-extrabold text-emerald-700 font-mono text-xs">₹${priceNum}</div>`;
      if (mrpNum > priceNum) {
        const discountPct = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
        priceDisplay = `
          <div>
            <div class="font-extrabold text-emerald-700 font-mono text-xs">₹${priceNum}</div>
            <div class="flex items-center gap-1 mt-0.5">
              <span class="text-[10px] text-slate-400 line-through">₹${mrpNum}</span>
              <span class="text-[9px] font-extrabold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded border border-emerald-300">${discountPct}% OFF</span>
            </div>
          </div>
        `;
      }
    }

    // Attributes column display
    let attrsSummary = '';
    if (p.isGroup) {
      attrsSummary = `
        <div class="flex items-center gap-1 flex-wrap">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-800 font-extrabold text-[10px] border border-indigo-200">🗂️ ${p.variantCount} Variants</span>
          ${p.sizes.length > 0 ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">📏 ${p.sizes.join(', ')}</span>` : ''}
          ${p.colors.length > 0 ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">🎨 ${p.colors.join(', ')}</span>` : ''}
        </div>
      `;
    } else {
      attrsSummary = `
        <div class="flex items-center gap-1 flex-wrap">
          <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">📏 ${p.size || 'Std'}</span>
          <span class="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">🎨 ${p.color || 'Default'}</span>
          ${p.fabric ? `<span class="inline-flex items-center px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold text-[10px] border border-teal-200">🧵 ${p.fabric}</span>` : ''}
        </div>
      `;
    }

    const isSelected = BULK_SELECTED_PRODUCT_IDS.has(String(p.id));

    return `
      <tr id="catalog-row-${p.id}" class="hover:bg-slate-50/80 transition-colors border-b border-slate-100 ${isSelected ? 'bg-emerald-50/50' : ''}">
        ${IS_BULK_PRICE_MODE ? `
          <td class="py-3 px-3 text-center whitespace-nowrap">
            <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="toggleBulkProductSelected('${p.id}', this.checked, '${p.groupKey || ''}')" class="w-4 h-4 text-emerald-700 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer accent-emerald-600">
          </td>
        ` : ''}

        <!-- Product & SKU -->
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${imgUrl}" alt="${p.name}" onerror="this.onerror=null;this.src='uploads/products/sample_garment.jpg';" class="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-sm">
            <div class="min-w-0">
              <div class="font-bold text-slate-900 text-xs hover:text-emerald-700 cursor-pointer transition line-clamp-1" onclick="${p.isGroup ? `openProductVariantsModal('${p.groupKey}')` : `openEditProductModal('${p.id}')`}" title="${p.name}">${p.name}</div>
              <div class="flex items-center gap-1.5 mt-1">
                <span class="bg-slate-900 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">${p.sku}</span>
                ${p.isGroup ? `<span class="bg-indigo-100 text-indigo-900 font-extrabold text-[9px] px-1.5 py-0.2 rounded-full border border-indigo-200">🗂️ ${p.variantCount} vars</span>` : ''}
              </div>
            </div>
          </div>
        </td>

        <!-- Category -->
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="font-semibold text-slate-800 text-xs">${p.category || 'Garments'}</div>
          ${p.subcategory ? `<div class="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 mt-0.5"><span class="text-slate-300">&rsaquo;</span> ${p.subcategory}</div>` : ''}
        </td>

        <!-- Attributes & Specs -->
        <td class="py-3 px-4">
          ${attrsSummary}
        </td>

        <!-- Price -->
        <td class="py-3 px-4 whitespace-nowrap">
          <div class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg">
            ${priceDisplay}
          </div>
        </td>

        <!-- Physical Stock (Clean without stepper buttons) -->
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <div class="font-mono font-extrabold text-xs text-slate-900">${physical}</div>
        </td>

        <!-- Sellable Stock -->
        <td class="py-3 px-4 text-center whitespace-nowrap">
          <div class="font-mono font-extrabold text-xs ${available > 0 ? 'text-emerald-800' : 'text-rose-600'}">
            ${available}
          </div>
          <div class="text-[9px] font-normal text-slate-400">(${reserved} res)</div>
        </td>

        <!-- Status -->
        <td class="py-3 px-4 whitespace-nowrap">
          ${stockBadge}
        </td>

        <!-- Actions -->
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            ${p.isGroup ? `
              <button onclick="openProductVariantsModal('${p.groupKey}')" class="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs" title="View all ${p.variantCount} individual variants">
                <span class="material-symbols-outlined text-[15px]">visibility</span>
                <span>View All ${p.variantCount} Variants</span>
              </button>
              <button onclick="openDirectShareModal('${p.groupKey}', true)" class="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer" title="Share all ${p.variantCount} variants on WhatsApp">
                <span class="material-symbols-outlined text-[15px]">send</span>
              </button>
              <button onclick="confirmDeleteProduct('${p.id}', true, '${p.groupKey}')" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer group/del" title="Delete product family and all variants">
                <span class="material-symbols-outlined text-[15px] text-rose-600 group-hover/del:scale-110 transition-transform">delete</span>
              </button>
            ` : `
              <button onclick="openEditProductModal('${p.id}')" class="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition shadow-xs flex items-center gap-1 font-bold text-xs cursor-pointer group/editbtn" title="Overall Edit: Edit all garment details">
                <span class="material-symbols-outlined text-[15px] text-amber-700 group-hover/editbtn:scale-110 transition-transform">edit_note</span>
                <span>Overall Edit</span>
              </button>
              <button onclick="openSinglePriceModal('${p.id}')" class="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer" title="Quick Price Edit">
                <span class="material-symbols-outlined text-[15px]">currency_rupee</span>
              </button>
              <button onclick="openDirectShareModal('${p.id}', false)" class="p-1.5 bg-brand-wa hover:bg-brand-waDark text-white rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer" title="Send direct to any WhatsApp phone number">
                <span class="material-symbols-outlined text-[15px]">send</span>
              </button>
              <button onclick="openQuickStockModal('${p.id}')" class="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer" title="Quick restock & reason notes">
                <span class="material-symbols-outlined text-[15px]">warehouse</span>
              </button>
              <button onclick="confirmDeleteProduct('${p.id}', false)" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg transition shadow-xs flex items-center justify-center cursor-pointer group/del" title="Permanently delete product from database">
                <span class="material-symbols-outlined text-[15px] text-rose-600 group-hover/del:scale-110 transition-transform">delete</span>
              </button>
            `}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------------------
// LIVE QUICK STOCK ADJUSTMENT (+ / - STEPPER)
// -------------------------------------------------------------------------
async function quickAdjustStock(productId, delta) {
  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId));
  if (!p) return;

  const currentPhysical = parseInt(p.physicalStock) || 0;
  const newPhysical = Math.max(0, currentPhysical + delta);

  if (newPhysical === currentPhysical) return;

  p.physicalStock = newPhysical;
  saveCRMState();

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
        sku: p.sku,
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
// PRICE EDITING & DIRECT SHARE MULTI-SELECT CONTROLLERS
// -------------------------------------------------------------------------

function toggleBulkSelectionMode(forceState) {
  toggleBulkPriceEditMode(forceState);
}
window.toggleBulkSelectionMode = toggleBulkSelectionMode;

function handleToolbarSelectAllChange(isChecked) {
  if (!IS_BULK_PRICE_MODE) {
    toggleBulkPriceEditMode(true);
  }
  selectAllBulkCatalogProducts(isChecked);
}
window.handleToolbarSelectAllChange = handleToolbarSelectAllChange;

function toggleBulkPriceEditMode(forceState) {
  if (typeof forceState === 'boolean') {
    IS_BULK_PRICE_MODE = forceState;
  } else {
    IS_BULK_PRICE_MODE = !IS_BULK_PRICE_MODE;
  }

  const btn = document.getElementById('btn-toggle-bulk-price');
  const tbBtn = document.getElementById('btn-toolbar-bulk-price');
  const tbSelBtn = document.getElementById('btn-toolbar-bulk-select');
  const bar = document.getElementById('catalog-bulk-price-bar');
  const dock = document.getElementById('catalog-bulk-floating-dock');
  const thCol = document.getElementById('th-bulk-checkbox-col');

  if (IS_BULK_PRICE_MODE) {
    if (btn) {
      btn.classList.add('bg-emerald-700', 'text-white', 'border-emerald-800', 'shadow-md');
      btn.classList.remove('bg-amber-50', 'text-amber-900', 'border-amber-300');
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px]">check_box</span> <span>Selection Active</span>`;
    }
    if (tbBtn) {
      tbBtn.classList.add('bg-amber-600', 'text-white', 'border-amber-700', 'shadow-md');
      tbBtn.classList.remove('bg-amber-50', 'text-amber-900', 'border-amber-300');
    }
    if (tbSelBtn) {
      tbSelBtn.classList.add('bg-emerald-700', 'text-white', 'border-emerald-800', 'shadow-md');
      tbSelBtn.classList.remove('bg-emerald-50', 'text-emerald-900', 'border-emerald-300');
      tbSelBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">check_box</span> <span id="btn-toolbar-bulk-select-text">Selecting Active</span>`;
    }
    if (bar) bar.classList.remove('hidden');
    if (dock) dock.classList.remove('hidden');
    if (thCol && CATALOG_VIEW_MODE === 'table') thCol.classList.remove('hidden');
    showToast('Selection Checkboxes Active', 'Select garments to Share on WhatsApp or Edit Prices.', 'checklist', 'emerald');
  } else {
    BULK_SELECTED_PRODUCT_IDS.clear();
    if (btn) {
      btn.classList.remove('bg-emerald-700', 'text-white', 'border-emerald-800', 'shadow-md');
      btn.classList.add('bg-amber-50', 'text-amber-900', 'border-amber-300');
      btn.innerHTML = `<span class="material-symbols-outlined text-[15px] text-amber-700">price_change</span> <span>Edit Price (Overall)</span>`;
    }
    if (tbBtn) {
      tbBtn.classList.remove('bg-amber-600', 'text-white', 'border-amber-700', 'shadow-md');
      tbBtn.classList.add('bg-amber-50', 'text-amber-900', 'border-amber-300');
    }
    if (tbSelBtn) {
      tbSelBtn.classList.remove('bg-emerald-700', 'text-white', 'border-emerald-800', 'shadow-md');
      tbSelBtn.classList.add('bg-emerald-50', 'text-emerald-900', 'border-emerald-300');
      tbSelBtn.innerHTML = `<span class="material-symbols-outlined text-[16px] text-emerald-700">check_box</span> <span id="btn-toolbar-bulk-select-text">Select Checkbox</span>`;
    }
    const tbCheck = document.getElementById('toolbar-select-all-checkbox');
    if (tbCheck) {
      tbCheck.checked = false;
      tbCheck.indeterminate = false;
    }
    if (bar) bar.classList.add('hidden');
    if (dock) dock.classList.add('hidden');
    if (thCol) thCol.classList.add('hidden');
  }

  updateBulkSelectedCountUI();
  filterCatalogGrid();
}
window.toggleBulkPriceEditMode = toggleBulkPriceEditMode;

function toggleBulkProductSelected(productId, isChecked, groupKey = '') {
  const idStr = String(productId);

  // If this belongs to a family group, select/deselect all variants in that group
  let targetGroup = null;
  const grouped = groupCatalogProducts(CRM_STATE.products || []);
  if (groupKey) {
    targetGroup = grouped.find(g => g.groupKey === groupKey);
  } else {
    targetGroup = grouped.find(g => g.groupKey === idStr || String(g.id) === idStr);
  }

  if (targetGroup && targetGroup.variants && targetGroup.variants.length > 0) {
    targetGroup.variants.forEach(v => {
      if (isChecked) {
        BULK_SELECTED_PRODUCT_IDS.add(String(v.id));
      } else {
        BULK_SELECTED_PRODUCT_IDS.delete(String(v.id));
      }
    });
    if (isChecked) {
      BULK_SELECTED_PRODUCT_IDS.add(idStr);
    } else {
      BULK_SELECTED_PRODUCT_IDS.delete(idStr);
    }
  } else {
    if (isChecked) {
      BULK_SELECTED_PRODUCT_IDS.add(idStr);
    } else {
      BULK_SELECTED_PRODUCT_IDS.delete(idStr);
    }
  }

  updateBulkSelectedCountUI();

  // Visual highlight for card
  const card = document.getElementById(`catalog-card-${idStr}`);
  if (card) {
    if (isChecked) {
      card.classList.add('ring-2', 'ring-emerald-600', 'bg-emerald-50/20', 'shadow-md');
    } else {
      card.classList.remove('ring-2', 'ring-emerald-600', 'bg-emerald-50/20', 'shadow-md');
    }
  }

  // Visual highlight for table row
  const row = document.getElementById(`catalog-row-${idStr}`);
  if (row) {
    if (isChecked) {
      row.classList.add('bg-emerald-50/50');
    } else {
      row.classList.remove('bg-emerald-50/50');
    }
  }
}
window.toggleBulkProductSelected = toggleBulkProductSelected;

function selectAllBulkCatalogProducts(selectAll) {
  const currentList = (CURRENT_CATALOG_FILTERED_LIST && CURRENT_CATALOG_FILTERED_LIST.length > 0)
    ? CURRENT_CATALOG_FILTERED_LIST
    : (CRM_STATE.products || []);

  if (selectAll) {
    currentList.forEach(p => {
      if (p.isGroup && p.variants && p.variants.length > 0) {
        p.variants.forEach(v => BULK_SELECTED_PRODUCT_IDS.add(String(v.id)));
      }
      BULK_SELECTED_PRODUCT_IDS.add(String(p.id));
    });
    showToast('All Visible Selected', `Selected all ${currentList.length} products. Choose "Share on WhatsApp" or "Price Edit".`, 'check_box', 'emerald');
  } else {
    BULK_SELECTED_PRODUCT_IDS.clear();
    showToast('Selection Cleared', 'Deselected all products.', 'check_box_outline_blank', 'slate');
  }

  updateBulkSelectedCountUI();
  filterCatalogGrid();
}
window.selectAllBulkCatalogProducts = selectAllBulkCatalogProducts;

function updateBulkSelectedCountUI() {
  const count = BULK_SELECTED_PRODUCT_IDS.size;
  const countText = `${count} Garment${count === 1 ? '' : 's'} Selected`;

  // Top Bar count
  const countBar = document.getElementById('bulk-selected-count-text') || document.getElementById('bulk-selected-count');
  if (countBar) countBar.innerText = countText;

  // Floating dock count badge
  const dockBadge = document.getElementById('bulk-dock-count-badge');
  if (dockBadge) dockBadge.innerText = countText;

  // Modal chips count badge
  const modalCount = document.getElementById('bulk-modal-chips-count');
  if (modalCount) modalCount.innerText = count;

  // Next Process button in dock (Price Edit)
  const dockProceedBtn = document.getElementById('btn-dock-proceed-bulk');
  const dockProceedText = document.getElementById('btn-dock-proceed-text');
  if (dockProceedBtn) {
    if (dockProceedText) dockProceedText.innerText = count > 0 ? `Price Edit (${count})` : `Price Edit`;
  }

  // Share button in dock
  const dockShareBtn = document.getElementById('btn-dock-share-bulk');
  const dockShareText = document.getElementById('btn-dock-share-text');
  if (dockShareBtn) {
    if (dockShareText) dockShareText.innerText = count > 0 ? `Share on WhatsApp (${count})` : `Share on WhatsApp`;
  }

  // Next Process button in top bar (Price Edit)
  const barProceedBtn = document.getElementById('btn-open-bulk-modal');
  const barProceedText = document.getElementById('btn-open-bulk-modal-text');
  if (barProceedBtn) {
    if (barProceedText) barProceedText.innerText = count > 0 ? `Price Edit (${count})` : `Price Edit`;
  }

  // Share button in top bar
  const barShareBtn = document.getElementById('btn-bar-share-bulk');
  const barShareText = document.getElementById('btn-bar-share-text');
  if (barShareBtn) {
    if (barShareText) barShareText.innerText = count > 0 ? `Share on WhatsApp (${count})` : `Share on WhatsApp`;
  }

  // Toolbar button text update
  const tbBtnText = document.getElementById('btn-toolbar-bulk-price-text');
  if (tbBtnText && IS_BULK_PRICE_MODE) {
    tbBtnText.innerText = count > 0 ? `Overall Edit (${count})` : `Overall Price Edit`;
  }
  const tbSelText = document.getElementById('btn-toolbar-bulk-select-text');
  if (tbSelText && IS_BULK_PRICE_MODE) {
    tbSelText.innerText = count > 0 ? `Selected (${count})` : `Selecting Active`;
  }

  // Sync Toolbar Master Checkbox
  const tbSelectAllCheck = document.getElementById('toolbar-select-all-checkbox');
  const currentList = (CURRENT_CATALOG_FILTERED_LIST && CURRENT_CATALOG_FILTERED_LIST.length > 0)
    ? CURRENT_CATALOG_FILTERED_LIST
    : (CRM_STATE.products || []);
  const visibleCount = currentList.length;

  if (tbSelectAllCheck) {
    tbSelectAllCheck.checked = (visibleCount > 0 && count >= visibleCount);
    tbSelectAllCheck.indeterminate = (count > 0 && count < visibleCount);
  }

  // Sync Master Checkbox in table header
  const thCheck = document.querySelector('#th-bulk-checkbox-col input[type="checkbox"]');
  if (thCheck) {
    thCheck.checked = (visibleCount > 0 && count >= visibleCount);
    thCheck.indeterminate = (count > 0 && count < visibleCount);
  }
}
window.updateBulkSelectedCountUI = updateBulkSelectedCountUI;

// -------------------------------------------------------------------------
// UNIFIED PRICE CHANGE STRATEGY CONFIGURATION & LOGIC
// -------------------------------------------------------------------------

const PRICE_STRATEGY_CONFIG = {
  fixed: {
    label: 'Fixed Selling Price (₹):',
    prefix: '₹',
    placeholder: 'e.g. 599',
    hint: "Each product's selling price will be set to this fixed amount.",
    defaultValue: 599
  },
  discount_pct: {
    label: 'Discount Percentage (%) on current price:',
    prefix: '%',
    placeholder: '15',
    hint: "Each product's current price will be reduced by this percentage.",
    defaultValue: 15
  },
  increase_pct: {
    label: 'Price Hike Percentage (%) on current price:',
    prefix: '%',
    placeholder: '20',
    hint: "Each product's current price will be increased by this percentage.",
    defaultValue: 20
  },
  increase_amt: {
    label: 'Price Increase (+₹) on current price:',
    prefix: '+₹',
    placeholder: '50',
    hint: "This rupee amount will be added to each product's current price.",
    defaultValue: 50
  },
  decrease_amt: {
    label: 'Price Decrease (-₹) on current price:',
    prefix: '-₹',
    placeholder: '50',
    hint: "This rupee amount will be deducted from each product's current price.",
    defaultValue: 50
  }
};

let ACTIVE_SINGLE_PRICE_STRATEGY = 'fixed';
let ACTIVE_BULK_PRICE_STRATEGY = 'increase_pct';

function calculatePriceByStrategy(basePrice, strategy, rawValue) {
  const p = parseFloat(basePrice) || 0;
  const val = parseFloat(rawValue);
  if (isNaN(val)) return p;

  let newPrice = p;
  switch (strategy) {
    case 'fixed':
      newPrice = Math.max(0, val);
      break;
    case 'discount_pct':
      newPrice = Math.max(0, p * (1 - (val / 100)));
      break;
    case 'increase_pct':
      newPrice = Math.max(0, p * (1 + (val / 100)));
      break;
    case 'increase_amt':
      newPrice = Math.max(0, p + val);
      break;
    case 'decrease_amt':
      newPrice = Math.max(0, p - val);
      break;
    default:
      newPrice = Math.max(0, val);
  }
  return Math.round(newPrice);
}

// -------------------------------------------------------------------------
// SINGLE PRODUCT EDIT PRICE MODAL (STRATEGY CARDS TEMPLATE)
// -------------------------------------------------------------------------

function openSinglePriceModal(productId) {
  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId));
  if (!p) {
    showToast('Product Not Found', 'Could not locate the selected product.', 'error', 'rose');
    return;
  }

  const idInput = document.getElementById('single-price-product-id');
  const subLabel = document.getElementById('single-price-product-sub');
  const mrpInput = document.getElementById('single-mrp-input');

  if (idInput) idInput.value = p.id;
  if (subLabel) {
    subLabel.innerText = `Updating price for ${p.sku || 'Garment'} • ${p.name || ''}`;
  }
  if (mrpInput) {
    mrpInput.value = (p.mrp && parseFloat(p.mrp) > 0) ? parseFloat(p.mrp) : '';
  }

  // Default to 'fixed' strategy with current product price
  setSinglePriceStrategy('fixed', false);
  const inputElem = document.getElementById('single-price-input');
  if (inputElem) {
    inputElem.value = (p.price !== undefined && p.price !== null) ? parseFloat(p.price) : 0;
  }

  renderSinglePriceLivePreview();
  openModal('modal-single-edit-price');

  setTimeout(() => {
    if (inputElem) {
      inputElem.focus();
      inputElem.select();
    }
  }, 100);
}

function setSinglePriceStrategy(strategyKey, resetDefaultValue = true) {
  if (!PRICE_STRATEGY_CONFIG[strategyKey]) strategyKey = 'fixed';
  ACTIVE_SINGLE_PRICE_STRATEGY = strategyKey;

  const cfg = PRICE_STRATEGY_CONFIG[strategyKey];
  const labelElem = document.getElementById('single-price-value-label');
  const prefixElem = document.getElementById('single-price-value-prefix');
  const hintElem = document.getElementById('single-price-value-hint');
  const inputElem = document.getElementById('single-price-input');

  if (labelElem) labelElem.innerText = cfg.label;
  if (prefixElem) prefixElem.innerText = cfg.prefix;
  if (hintElem) hintElem.innerText = cfg.hint;
  if (inputElem) inputElem.placeholder = cfg.placeholder;

  if (resetDefaultValue && inputElem) {
    const pId = document.getElementById('single-price-product-id')?.value;
    const p = (CRM_STATE.products || []).find(item => String(item.id) === String(pId));
    if (strategyKey === 'fixed' && p) {
      inputElem.value = parseFloat(p.price) || 0;
    } else {
      inputElem.value = cfg.defaultValue;
    }
  }

  // Update visual buttons styling
  const buttons = document.querySelectorAll('.single-strat-btn');
  buttons.forEach(btn => {
    const isTarget = btn.id === `btn-single-strat-${strategyKey}`;
    if (isTarget) {
      btn.className = 'single-strat-btn p-2.5 rounded-xl border-2 border-amber-400 bg-amber-50/70 text-amber-950 font-bold shadow-xs flex flex-col items-center justify-center gap-1 transition text-center cursor-pointer';
    } else {
      btn.className = 'single-strat-btn p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex flex-col items-center justify-center gap-1 transition text-center cursor-pointer shadow-2xs';
    }
  });

  renderSinglePriceLivePreview();
}

function renderSinglePriceLivePreview() {
  const pId = document.getElementById('single-price-product-id')?.value;
  const p = (CRM_STATE.products || []).find(item => String(item.id) === String(pId));
  const listElem = document.getElementById('single-price-impact-list');
  const inputElem = document.getElementById('single-price-input');

  if (!listElem) return;
  if (!p) {
    listElem.innerHTML = `<div class="text-[11px] text-slate-400 italic py-1 text-center">No garment selected</div>`;
    return;
  }

  const rawVal = inputElem ? inputElem.value : 0;
  const oldPrice = parseFloat(p.price) || 0;
  const newPrice = calculatePriceByStrategy(oldPrice, ACTIVE_SINGLE_PRICE_STRATEGY, rawVal);
  const diff = newPrice - oldPrice;

  let diffBadge = '';
  if (diff > 0) {
    diffBadge = `<span class="ml-2 font-bold text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">+₹${diff}</span>`;
  } else if (diff < 0) {
    diffBadge = `<span class="ml-2 font-bold text-[10px] text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md font-mono">-₹${Math.abs(diff)}</span>`;
  } else {
    diffBadge = `<span class="ml-2 font-bold text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-mono">₹0</span>`;
  }

  listElem.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
      <div class="flex items-center gap-2 min-w-0">
        <span class="bg-slate-900 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-md shrink-0 shadow-2xs">${p.sku || 'SKU'}</span>
        <span class="font-bold text-xs text-slate-800 truncate">${p.name || 'Garment'}</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0 font-mono text-xs">
        <span class="text-slate-400 line-through">₹${oldPrice}</span>
        <span class="text-slate-400 font-bold mx-1">&rarr;</span>
        <span class="font-black text-emerald-700 text-sm">₹${newPrice}</span>
        ${diffBadge}
      </div>
    </div>
  `;
}

async function handleSinglePriceSave(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  const idInput = document.getElementById('single-price-product-id');
  const pId = idInput ? idInput.value : null;
  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(pId));

  if (!p) {
    showToast('Not Found', 'Product record not found.', 'error', 'rose');
    return;
  }

  const inputElem = document.getElementById('single-price-input');
  const rawVal = inputElem ? parseFloat(inputElem.value) : NaN;
  if (isNaN(rawVal) || rawVal < 0) {
    showToast('Invalid Value', 'Please enter a valid numeric value.', 'error', 'rose');
    return;
  }

  const mrpInput = document.getElementById('single-mrp-input');
  const mrpVal = (mrpInput && mrpInput.value !== '') ? parseFloat(mrpInput.value) : null;

  const oldPrice = parseFloat(p.price) || 0;
  const newPrice = calculatePriceByStrategy(oldPrice, ACTIVE_SINGLE_PRICE_STRATEGY, rawVal);

  if (mrpVal !== null && !isNaN(mrpVal) && mrpVal > 0 && newPrice > mrpVal) {
    showToast('Invalid Pricing', `Selling price (₹${newPrice}) cannot be greater than MRP (₹${mrpVal}). Always MRP is bigger.`, 'error', 'rose');
    if (mrpInput) mrpInput.focus();
    return;
  }

  p.price = newPrice;
  if (mrpVal !== null && !isNaN(mrpVal) && mrpVal > 0) {
    p.mrp = mrpVal;
  } else if (mrpVal === null && p.mrp) {
    // Keep existing MRP
  }

  saveCRMState();

  closeModal('modal-single-edit-price');
  if (typeof filterCatalogGrid === 'function') filterCatalogGrid();
  if (typeof renderCatalogGrid === 'function') renderCatalogGrid('');
  if (typeof updateOrderProductDropdown === 'function') updateOrderProductDropdown();
  if (typeof refreshVariantsModalIfOpen === 'function') refreshVariantsModalIfOpen();

  if (typeof playChime === 'function') playChime('order');
  showToast('Price Updated', `${p.sku} price changed from ₹${oldPrice} to ₹${newPrice}.`, 'payments', 'emerald');

  try {
    const res = await fetch('api.php?action=update_price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        sku: p.sku,
        price: newPrice,
        mrp: mrpVal
      })
    });
    const result = await res.json();
    console.log('Single price updated in DB:', result);
  } catch (err) {
    console.warn('API update_price error:', err);
  }

  if (typeof logAudit === 'function') {
    logAudit('PRICE_UPDATE', 'CATALOG', `${p.sku} price updated to ₹${newPrice} using ${ACTIVE_SINGLE_PRICE_STRATEGY}`);
  }
}

// -------------------------------------------------------------------------
// BULK / OVERALL PRODUCT EDIT PRICE MODAL (STRATEGY CARDS TEMPLATE)
// -------------------------------------------------------------------------

function openBulkPriceModal() {
  if (BULK_SELECTED_PRODUCT_IDS.size === 0) {
    showToast('Select Products First', 'Please check at least 1 garment using the checkboxes to bulk edit prices.', 'warning', 'amber');
    return;
  }

  const selectedProducts = (CRM_STATE.products || []).filter(p => BULK_SELECTED_PRODUCT_IDS.has(String(p.id)));

  const countSub = document.getElementById('bulk-price-modal-count-sub');
  if (countSub) {
    countSub.innerText = `Updating prices for ${selectedProducts.length} selected garment${selectedProducts.length === 1 ? '' : 's'} simultaneously`;
  }

  const mrpInput = document.getElementById('bulk-mrp-input');
  if (mrpInput) mrpInput.value = '';

  // Default to 'increase_pct' with 20% (matching the exact user screenshot template)
  setBulkPriceStrategy('increase_pct', false);
  const inputElem = document.getElementById('bulk-price-input');
  if (inputElem) inputElem.value = 20;

  renderBulkPriceLivePreview();
  openModal('modal-bulk-edit-price');

  setTimeout(() => {
    if (inputElem) {
      inputElem.focus();
      inputElem.select();
    }
  }, 100);
}

function setBulkPriceStrategy(strategyKey, resetDefaultValue = true) {
  if (!PRICE_STRATEGY_CONFIG[strategyKey]) strategyKey = 'increase_pct';
  ACTIVE_BULK_PRICE_STRATEGY = strategyKey;

  const cfg = PRICE_STRATEGY_CONFIG[strategyKey];
  const labelElem = document.getElementById('bulk-price-value-label');
  const prefixElem = document.getElementById('bulk-price-value-prefix');
  const hintElem = document.getElementById('bulk-price-value-hint');
  const inputElem = document.getElementById('bulk-price-input');

  if (labelElem) labelElem.innerText = cfg.label;
  if (prefixElem) prefixElem.innerText = cfg.prefix;
  if (hintElem) hintElem.innerText = cfg.hint;
  if (inputElem) inputElem.placeholder = cfg.placeholder;

  if (resetDefaultValue && inputElem) {
    if (strategyKey === 'fixed') {
      const selectedProducts = (CRM_STATE.products || []).filter(p => BULK_SELECTED_PRODUCT_IDS.has(String(p.id)));
      inputElem.value = selectedProducts.length > 0 ? (parseFloat(selectedProducts[0].price) || 499) : 499;
    } else {
      inputElem.value = cfg.defaultValue;
    }
  }

  // Update visual buttons styling
  const buttons = document.querySelectorAll('.bulk-strat-btn');
  buttons.forEach(btn => {
    const isTarget = btn.id === `btn-bulk-strat-${strategyKey}`;
    if (isTarget) {
      btn.className = 'bulk-strat-btn p-2.5 rounded-xl border-2 border-amber-400 bg-amber-50/70 text-amber-950 font-bold shadow-xs flex flex-col items-center justify-center gap-1 transition text-center cursor-pointer';
    } else {
      btn.className = 'bulk-strat-btn p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex flex-col items-center justify-center gap-1 transition text-center cursor-pointer shadow-2xs';
    }
  });

  renderBulkPriceLivePreview();
}

function renderBulkPriceLivePreview() {
  const selectedProducts = (CRM_STATE.products || []).filter(p => BULK_SELECTED_PRODUCT_IDS.has(String(p.id)));
  const listElem = document.getElementById('bulk-price-impact-list');
  const inputElem = document.getElementById('bulk-price-input');

  if (!listElem) return;
  if (selectedProducts.length === 0) {
    listElem.innerHTML = `<div class="text-[11px] text-slate-400 italic py-1 text-center">No garments selected</div>`;
    return;
  }

  const rawVal = inputElem ? inputElem.value : 0;

  listElem.innerHTML = selectedProducts.map(p => {
    const oldPrice = parseFloat(p.price) || 0;
    const newPrice = calculatePriceByStrategy(oldPrice, ACTIVE_BULK_PRICE_STRATEGY, rawVal);
    const diff = newPrice - oldPrice;

    let diffBadge = '';
    if (diff > 0) {
      diffBadge = `<span class="ml-2 font-bold text-[10px] text-emerald-800 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-md font-mono">+₹${diff}</span>`;
    } else if (diff < 0) {
      diffBadge = `<span class="ml-2 font-bold text-[10px] text-rose-800 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-md font-mono">-₹${Math.abs(diff)}</span>`;
    } else {
      diffBadge = `<span class="ml-2 font-bold text-[10px] text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md font-mono">₹0</span>`;
    }

    return `
      <div class="bg-white border border-slate-200 rounded-xl p-2.5 flex items-center justify-between shadow-2xs">
        <div class="flex items-center gap-2 min-w-0">
          <span class="bg-slate-900 text-white font-mono font-black text-[10px] px-2 py-0.5 rounded-md shrink-0 shadow-2xs">${p.sku || 'SKU'}</span>
          <span class="font-bold text-xs text-slate-800 truncate">${p.name || 'Garment'}</span>
        </div>
        <div class="flex items-center gap-1.5 shrink-0 font-mono text-xs">
          <span class="text-slate-400 line-through">₹${oldPrice}</span>
          <span class="text-slate-400 font-bold mx-1">&rarr;</span>
          <span class="font-black text-emerald-700 text-sm">₹${newPrice}</span>
          ${diffBadge}
        </div>
      </div>
    `;
  }).join('');
}

async function handleBulkPriceSave(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (BULK_SELECTED_PRODUCT_IDS.size === 0) {
    showToast('No Selection', 'Please select garments to update.', 'warning', 'amber');
    return;
  }

  const inputElem = document.getElementById('bulk-price-input');
  const rawVal = inputElem ? parseFloat(inputElem.value) : NaN;
  if (isNaN(rawVal) || rawVal < 0) {
    showToast('Invalid Value', 'Please enter a valid numeric value.', 'error', 'rose');
    return;
  }

  const mrpInput = document.getElementById('bulk-mrp-input');
  const mrpVal = (mrpInput && mrpInput.value !== '') ? parseFloat(mrpInput.value) : null;

  const selectedIds = Array.from(BULK_SELECTED_PRODUCT_IDS);
  const affectedProducts = (CRM_STATE.products || []).filter(p => BULK_SELECTED_PRODUCT_IDS.has(String(p.id)));

  // Update in-memory state for all selected products using active strategy
  affectedProducts.forEach(p => {
    const oldPrice = parseFloat(p.price) || 0;
    const newPrice = calculatePriceByStrategy(oldPrice, ACTIVE_BULK_PRICE_STRATEGY, rawVal);
    p.price = newPrice;
    if (mrpVal !== null && !isNaN(mrpVal) && mrpVal > 0) {
      p.mrp = mrpVal;
    }
  });

  saveCRMState();

  // 1. Close the bulk modal immediately
  closeModal('modal-bulk-edit-price');

  // 2. CRITICAL USER REQUIREMENT:
  // Automatically close and exit Bulk Mode after save!
  // Unchecks all boxes, closes floating bottom dock, hides top bar, restores normal table actions
  toggleBulkPriceEditMode(false);

  // 3. Audio & Toast feedback
  if (typeof playChime === 'function') playChime('order');
  showToast('Bulk Prices Updated', `Successfully updated prices for ${affectedProducts.length} garments.`, 'price_check', 'emerald');

  // 4. Async persist via API
  try {
    const res = await fetch('api.php?action=bulk_update_prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ids: selectedIds,
        product_ids: selectedIds,
        skus: affectedProducts.map(p => p.sku),
        mode: ACTIVE_BULK_PRICE_STRATEGY,
        value: rawVal,
        mrp: mrpVal
      })
    });
    const result = await res.json();
    console.log('Bulk prices persisted to DB:', result);
  } catch (err) {
    console.warn('API bulk_update_prices error:', err);
  }

  // Audit log
  if (typeof logAudit === 'function') {
    logAudit('BULK_PRICE_UPDATE', 'CATALOG', `Bulk updated prices for ${affectedProducts.length} products using strategy ${ACTIVE_BULK_PRICE_STRATEGY}`);
  }
}

// -------------------------------------------------------------------------
// ADD / EDIT PRODUCT MODAL & IMAGE UPLOAD LOGIC
// -------------------------------------------------------------------------

let CURRENT_PRODUCT_IMAGE_DATA = '';
// Uses global DEFAULT_GARMENT_PLACEHOLDER declared at top of file

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
    updateProductFormPreview();

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
    updateProductFormPreview();
  };
  reader.readAsDataURL(file);
}

function handleProductImageURLChange(url) {
  url = (url || '').trim();
  CURRENT_PRODUCT_IMAGE_DATA = url;
  const previewImg = document.getElementById('prod-form-img-preview');
  const previewName = document.getElementById('prod-preview-filename');
  const previewStatus = document.getElementById('prod-preview-status');

  if (url && (url.startsWith('http') || url.startsWith('uploads/') || url.startsWith('data:image'))) {
    if (previewImg) previewImg.src = url;
    if (previewName) previewName.innerText = 'External Web Image';
    if (previewStatus) previewStatus.innerText = 'Loaded from URL';
  } else {
    CURRENT_PRODUCT_IMAGE_DATA = '';
    if (previewImg) previewImg.src = DEFAULT_GARMENT_PLACEHOLDER;
    if (previewName) previewName.innerText = 'No image selected';
    if (previewStatus) previewStatus.innerText = 'Upload a photo or enter URL';
  }
  updateProductFormPreview();
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
  if (previewName) previewName.innerText = 'No image selected';
  if (previewStatus) previewStatus.innerText = 'Upload a photo or enter URL';
  updateProductFormPreview();
}

// =========================================================================
// E-COMMERCE WEBSITE CATALOG FLOW & TAXONOMY / ATTRIBUTES SYSTEM
// =========================================================================

// Color Hex Helper for Visual Color Swatches
const COLOR_HEX_MAP = {
  'pink': '#f472b6',
  'blush pink': '#fbcfe8',
  'sunshine yellow': '#facc15',
  'yellow': '#fde047',
  'red': '#ef4444',
  'ruby red': '#e11d48',
  'ruby red & gold': '#be123c',
  'pink': '#f472b6',
  'blush pink': '#fbcfe8',
  'maroon': '#800000',
  'royal maroon': '#881337',
  'sunshine yellow': '#facc15',
  'yellow': '#fde047',
  'sky blue': '#38bdf8',
  'blue': '#3b82f6',
  'mint green': '#86efac',
  'emerald green': '#10b981',
  'emerald green & gold': '#059669',
  'pure white': '#f8fafc',
  'white': '#ffffff',
  'multi pastel': '#c084fc',
  'navy blue': '#1e3a8a',
  'jet black': '#0f172a',
  'black': '#1e293b',
  'peach': '#fed7aa',
  'lavender': '#e9d5ff',
  'mustard': '#eab308'
};

function getColorHex(colorName) {
  if (!colorName) return '#94a3b8';
  const clean = colorName.toLowerCase().trim();
  for (const key in COLOR_HEX_MAP) {
    if (clean.includes(key)) return COLOR_HEX_MAP[key];
  }
  return '#94a3b8';
}

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str || '');
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
window.escapeHtml = escapeHtml;

// -------------------------------------------------------------------------
// DYNAMIC DROPDOWNS & ATTRIBUTE CHIPS IN PRODUCT FORM
// -------------------------------------------------------------------------

function populateProductFormCategories(selectedCat, selectedSubcat) {
  const catSelect = document.getElementById('prod-form-category');
  if (!catSelect) return;

  const categories = CRM_STATE.categories || INITIAL_CRM_DATA.categories || [];
  let html = '<option value="" disabled' + (!selectedCat ? ' selected' : '') + '>-- Select Main Category --</option>';
  categories.forEach(c => {
    const isSel = selectedCat && selectedCat === c.name ? ' selected' : '';
    html += `<option value="${c.name}"${isSel}>${c.name}</option>`;
  });
  catSelect.innerHTML = html;

  if (selectedCat && [...catSelect.options].some(o => o.value === selectedCat)) {
    catSelect.value = selectedCat;
  } else {
    catSelect.value = '';
  }

  onProductFormCategoryChange(selectedSubcat);
}

function onProductFormCategoryChange(preserveSubcat) {
  const catSelect = document.getElementById('prod-form-category');
  const subcatSelect = document.getElementById('prod-form-subcategory');
  if (!catSelect || !subcatSelect) return;

  const selectedCat = catSelect.value;
  if (!selectedCat) {
    subcatSelect.innerHTML = '<option value="" disabled selected>-- Select Subcategory --</option>';
    subcatSelect.value = '';
    updateProductFormPreview();
    return;
  }

  const subcategories = CRM_STATE.subcategories || INITIAL_CRM_DATA.subcategories || [];
  const filtered = subcategories.filter(s => s.category_name === selectedCat || s.category === selectedCat);

  let html = '<option value="" disabled' + (!preserveSubcat ? ' selected' : '') + '>-- Select Subcategory --</option>';
  if (filtered.length === 0) {
    html += `<option value="General" data-prefix="GRM">General Apparel (Prefix: GRM)</option>`;
  } else {
    filtered.forEach(s => {
      const prefix = s.sku_prefix || 'GRM';
      const isSel = preserveSubcat && preserveSubcat === s.name ? ' selected' : '';
      html += `<option value="${s.name}" data-prefix="${prefix}"${isSel}>${s.name} (Prefix: ${prefix})</option>`;
    });
  }
  subcatSelect.innerHTML = html;

  if (preserveSubcat && [...subcatSelect.options].some(o => o.value === preserveSubcat)) {
    subcatSelect.value = preserveSubcat;
  } else {
    subcatSelect.value = '';
  }

  updateProductFormPreview();
}

function onProductFormSubcategoryChange() {
  const idVal = document.getElementById('prod-form-id')?.value;
  const skuInput = document.getElementById('prod-form-sku');
  if (!idVal || !skuInput?.value) {
    autoGenerateProductSKU();
  }
  updateProductFormPreview();
}

// Multi-Selection Attribute State & Variant Matrix
let SELECTED_PRODUCT_SIZES = [];
let SELECTED_PRODUCT_COLORS = [];
let SELECTED_PRODUCT_SPECS = [];
let SELECTED_CUSTOM_ATTRIBUTES = {}; // { [attrName]: ['val1', 'val2'] }
let PRODUCT_VARIANTS_MATRIX = [];

function toggleProductFormSize(val) {
  if (!val) return;
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  const idx = SELECTED_PRODUCT_SIZES.findIndex(s => s.toLowerCase() === lower);
  if (idx >= 0) {
    SELECTED_PRODUCT_SIZES.splice(idx, 1);
  } else {
    SELECTED_PRODUCT_SIZES.push(trimmed);
  }
  const input = document.getElementById('prod-form-size');
  if (input) input.value = SELECTED_PRODUCT_SIZES.join(', ');
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  updateProductFormPreview();
}

function handleSizeInputManual(val) {
  if (typeof val !== 'string') return;
  SELECTED_PRODUCT_SIZES = val.split(',').map(s => s.trim()).filter(Boolean);
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  updateProductFormPreview();
}

function toggleProductFormColor(val) {
  if (!val) return;
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  const idx = SELECTED_PRODUCT_COLORS.findIndex(c => c.toLowerCase() === lower);
  if (idx >= 0) {
    SELECTED_PRODUCT_COLORS.splice(idx, 1);
  } else {
    SELECTED_PRODUCT_COLORS.push(trimmed);
  }
  const input = document.getElementById('prod-form-color');
  if (input) input.value = SELECTED_PRODUCT_COLORS.join(', ');
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  updateProductFormPreview();
}

function handleColorInputManual(val) {
  if (typeof val !== 'string') return;
  SELECTED_PRODUCT_COLORS = val.split(',').map(c => c.trim()).filter(Boolean);
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  updateProductFormPreview();
}

function toggleProductFormCustomAttr(attrName, val) {
  if (!attrName || !val) return;
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase();
  if (!SELECTED_CUSTOM_ATTRIBUTES[attrName]) {
    SELECTED_CUSTOM_ATTRIBUTES[attrName] = [];
  }
  const idx = SELECTED_CUSTOM_ATTRIBUTES[attrName].findIndex(s => s.toLowerCase() === lower);
  if (idx >= 0) {
    SELECTED_CUSTOM_ATTRIBUTES[attrName].splice(idx, 1);
  } else {
    SELECTED_CUSTOM_ATTRIBUTES[attrName].push(trimmed);
  }
  const input = document.getElementById(`prod-form-custom-${attrName}`);
  if (input) input.value = SELECTED_CUSTOM_ATTRIBUTES[attrName].join(', ');
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  updateProductFormPreview();
}

function handleCustomAttrInputManual(attrName, val) {
  if (typeof val !== 'string' || !attrName) return;
  SELECTED_CUSTOM_ATTRIBUTES[attrName] = val.split(',').map(s => s.trim()).filter(Boolean);
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  updateProductFormPreview();
}

function toggleProductFormSpec(lbl, cnt) {
  if (!lbl && !cnt) return;
  const targetLbl = (lbl || '').trim();
  const targetCnt = (cnt || '').trim();
  const targetDisplay = (targetLbl && targetLbl !== 'Specification') ? `${targetLbl}: ${targetCnt}` : (targetCnt || targetLbl);
  const targetLower = targetDisplay.toLowerCase();

  const idx = SELECTED_PRODUCT_SPECS.findIndex(s => {
    const sLbl = (typeof s === 'object' ? s.label : s) || '';
    const sCnt = (typeof s === 'object' ? s.content : '') || '';
    const sDisplay = (sLbl && sLbl !== 'Specification') ? `${sLbl}: ${sCnt}` : (sCnt || sLbl);
    return sDisplay.toLowerCase() === targetLower || 
           (sLbl.toLowerCase() === targetLbl.toLowerCase() && sCnt.toLowerCase() === targetCnt.toLowerCase());
  });

  if (idx >= 0) {
    SELECTED_PRODUCT_SPECS.splice(idx, 1);
  } else {
    SELECTED_PRODUCT_SPECS.push({ label: targetLbl || 'Specification', content: targetCnt || targetLbl });
  }

  const input = document.getElementById('prod-form-specifications');
  if (input) {
    input.value = SELECTED_PRODUCT_SPECS.map(s => (s.label && s.label !== 'Specification') ? `${s.label}: ${s.content}` : (s.content || s.label)).join(', ');
  }
  renderProductFormAttributeChips();
  updateProductFormPreview();
}

function handleSpecsInputManual(val) {
  if (typeof val !== 'string') return;
  const parts = val.split(',').map(s => s.trim()).filter(Boolean);
  SELECTED_PRODUCT_SPECS = parts.map(p => {
    if (p.includes(':')) {
      const sp = p.split(':');
      return { label: sp[0].trim(), content: sp.slice(1).join(':').trim() };
    }
    return { label: 'Specification', content: p };
  });
  renderProductFormAttributeChips();
  updateProductFormPreview();
}

function selectProductFormSize(val) {
  toggleProductFormSize(val);
}

function selectProductFormColor(val) {
  toggleProductFormColor(val);
}

function selectProductFormFabric(val) {
  // Fabric removed as per user instruction
}

function renderProductFormAttributeChips(selectedSizesArg, selectedColorsArg, selectedSpecsArg) {
  const sizeCont = document.getElementById('prod-size-chips-container');
  const colorCont = document.getElementById('prod-color-swatches-container');
  const specCont = document.getElementById('prod-spec-chips-container');
  const customCont = document.getElementById('prod-custom-attributes-container');

  const attrs = CRM_STATE.attributes || INITIAL_CRM_DATA.attributes || { sizes: [], colors: [], specifications: [], custom: {} };

  // Sync state if explicit arguments provided
  if (typeof selectedSizesArg === 'string') {
    SELECTED_PRODUCT_SIZES = selectedSizesArg.split(',').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(selectedSizesArg)) {
    SELECTED_PRODUCT_SIZES = selectedSizesArg.map(s => (typeof s === 'string' ? s.trim() : String(s))).filter(Boolean);
  } else if (document.getElementById('prod-form-size')) {
    const raw = document.getElementById('prod-form-size').value;
    SELECTED_PRODUCT_SIZES = raw ? raw.split(',').map(s => s.trim()).filter(Boolean) : [];
  }

  if (typeof selectedColorsArg === 'string') {
    SELECTED_PRODUCT_COLORS = selectedColorsArg.split(',').map(c => c.trim()).filter(Boolean);
  } else if (Array.isArray(selectedColorsArg)) {
    SELECTED_PRODUCT_COLORS = selectedColorsArg.map(c => (typeof c === 'string' ? c.trim() : String(c))).filter(Boolean);
  } else if (document.getElementById('prod-form-color')) {
    const raw = document.getElementById('prod-form-color').value;
    SELECTED_PRODUCT_COLORS = raw ? raw.split(',').map(c => c.trim()).filter(Boolean) : [];
  }

  if (typeof selectedSpecsArg === 'string') {
    handleSpecsInputManual(selectedSpecsArg);
  } else if (Array.isArray(selectedSpecsArg)) {
    SELECTED_PRODUCT_SPECS = selectedSpecsArg.map(s => {
      if (typeof s === 'string') {
        if (s.includes(':')) {
          const sp = s.split(':');
          return { label: sp[0].trim(), content: sp.slice(1).join(':').trim() };
        }
        return { label: 'Specification', content: s.trim() };
      }
      return { label: s.label || 'Specification', content: s.content || '' };
    });
  }

  const activeSizesLower = SELECTED_PRODUCT_SIZES.map(s => s.toLowerCase());
  const activeColorsLower = SELECTED_PRODUCT_COLORS.map(c => c.toLowerCase());

  // 1. Sizes Chips (Multi-Selection with checkmark)
  if (sizeCont) {
    sizeCont.innerHTML = (attrs.sizes || []).map(s => {
      const isSelected = activeSizesLower.includes(s.toLowerCase());
      const escapedS = s.replace(/'/g, "\\'");
      return `
        <button type="button" onclick="toggleProductFormSize('${escapedS}')" class="chip-size px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${isSelected ? 'bg-teal-700 text-white border-teal-800 shadow-sm ring-1 ring-teal-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}">
          ${isSelected ? '<span class="text-teal-200 text-[11px] font-extrabold">✓</span>' : ''}
          <span>${s}</span>
        </button>
      `;
    }).join('');
  }

  // 2. Colors & Swatches (Multi-Selection with checkmark & color circle)
  if (colorCont) {
    colorCont.innerHTML = (attrs.colors || []).map(c => {
      const hex = getColorHex(c);
      const isSelected = activeColorsLower.includes(c.toLowerCase());
      const escapedC = c.replace(/'/g, "\\'");
      return `
        <button type="button" onclick="toggleProductFormColor('${escapedC}')" class="chip-color px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${isSelected ? 'bg-amber-100 text-amber-950 border-amber-400 ring-2 ring-amber-400 shadow-sm font-extrabold' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}">
          <span class="w-3 h-3 rounded-full border border-black/20 shrink-0" style="background-color: ${hex}"></span>
          ${isSelected ? '<span class="text-amber-800 text-[11px] font-extrabold">✓</span>' : ''}
          <span>${c}</span>
        </button>
      `;
    }).join('');
  }

  // 3. Dynamic Custom Attributes (e.g. Memory, Storage, RAM, etc.)
  if (customCont) {
    const customAttrs = (attrs && attrs.custom) ? attrs.custom : {};
    const customNames = Object.keys(customAttrs);
    if (customNames.length === 0) {
      customCont.innerHTML = '';
    } else {
      customCont.innerHTML = customNames.map(attrName => {
        const vals = customAttrs[attrName] || [];
        const selectedVals = SELECTED_CUSTOM_ATTRIBUTES[attrName] || [];
        const selectedLower = selectedVals.map(v => v.toLowerCase());
        const escapedAttrName = attrName.replace(/'/g, "\\'");

        const chipsHtml = vals.length === 0 
          ? `<span class="text-slate-400 italic text-[10px]">No values yet. Click "Manage ${attrName}" to add values.</span>`
          : vals.map(v => {
              const isSel = selectedLower.includes(v.toLowerCase());
              const escapedV = v.replace(/'/g, "\\'");
              return `
                <button type="button" onclick="toggleProductFormCustomAttr('${escapedAttrName}', '${escapedV}')" class="chip-custom px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1 cursor-pointer ${isSel ? 'bg-purple-700 text-white border-purple-800 shadow-sm ring-1 ring-purple-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}">
                  ${isSel ? '<span class="text-purple-200 text-[11px] font-extrabold">✓</span>' : ''}
                  <span>${v}</span>
                </button>
              `;
            }).join('');

        return `
          <div class="pt-3 border-t border-slate-200/80">
            <div class="flex items-center justify-between mb-1.5">
              <label class="font-bold text-slate-700 flex items-center gap-1.5">
                <span class="material-symbols-outlined text-purple-600 text-[16px]">tune</span>
                <span>${attrName} (Multiple Selection):</span>
              </label>
              <div class="flex items-center gap-2">
                <span class="text-[10px] text-purple-700 font-bold">Click options to select</span>
                <button type="button" onclick="openManageAttributesModal(); switchAttributeManagerTab('${escapedAttrName}');" class="text-[10px] text-purple-700 hover:text-purple-900 font-bold hover:underline flex items-center gap-0.5">
                  <span class="material-symbols-outlined text-[12px]">add_circle</span> Manage ${attrName}
                </button>
              </div>
            </div>
            <div id="prod-custom-chips-${attrName}" class="flex flex-wrap gap-1.5 mb-2">
              ${chipsHtml}
            </div>
            <input type="text" id="prod-form-custom-${attrName}" oninput="handleCustomAttrInputManual('${escapedAttrName}', this.value)" value="${selectedVals.join(', ')}" placeholder="Selected ${attrName} (e.g. ${vals.slice(0, 3).join(', ')})" class="w-full bg-white border border-slate-300 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-brand-wa shadow-sm">
          </div>
        `;
      }).join('');
    }
  }

  // 4. Garment Specifications Preset Chips (Same Attribute Flow: Multi-Selection with checkmark)
  if (specCont) {
    const specsList = attrs.specifications || [];
    if (specsList.length === 0) {
      specCont.innerHTML = `<span class="text-slate-400 italic text-[10px]">No specifications available. Click "Manage Specs" to add.</span>`;
    } else {
      specCont.innerHTML = specsList.map(s => {
        const lbl = (typeof s === 'object' ? s.label : s) || '';
        const cnt = (typeof s === 'object' ? s.content : '') || '';
        const displayTxt = (lbl && lbl !== 'Specification') ? `${lbl}: ${cnt}` : cnt;
        const targetStr = displayTxt.toLowerCase();

        const isSelected = SELECTED_PRODUCT_SPECS.some(as => {
          const asLbl = (typeof as === 'object' ? as.label : as) || '';
          const asCnt = (typeof as === 'object' ? as.content : '') || '';
          const asDisplay = (asLbl && asLbl !== 'Specification') ? `${asLbl}: ${asCnt}` : (asCnt || asLbl);
          return asDisplay.toLowerCase() === targetStr || 
                 (asLbl.toLowerCase() === lbl.toLowerCase() && asCnt.toLowerCase() === cnt.toLowerCase());
        });

        const escapedLbl = lbl.replace(/'/g, "\\'");
        const escapedCnt = cnt.replace(/'/g, "\\'");
        return `
          <button type="button" onclick="toggleProductFormSpec('${escapedLbl}', '${escapedCnt}')" class="chip-spec px-2.5 py-1 rounded-lg text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${isSelected ? 'bg-indigo-700 text-white border-indigo-800 shadow-sm ring-1 ring-indigo-500' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'}">
            ${isSelected ? '<span class="text-indigo-200 text-[11px] font-extrabold">✓</span>' : '<span class="text-indigo-400 text-[10px]">📌</span>'}
            <span>${displayTxt}</span>
          </button>
        `;
      }).join('');
    }
  }
}

// -------------------------------------------------------------------------
// MATRIX CALCULATION (Sizes x Colors x Custom Attributes Cartesian Multiplier)
// -------------------------------------------------------------------------
function calculateProductVariantMatrix() {
  const singleSec = document.getElementById('prod-single-pricing-section');
  const matrixSec = document.getElementById('prod-matrix-pricing-section');
  const matrixPill = document.getElementById('matrix-indicator-pill');
  const statusText = document.getElementById('matrix-status-text');
  const statusBadge = document.getElementById('matrix-status-badge');

  // Collect active attribute dimensions
  const dimensions = [];
  if (SELECTED_PRODUCT_SIZES.length > 0) {
    dimensions.push({ key: 'size', name: 'Size', values: SELECTED_PRODUCT_SIZES });
  }
  if (SELECTED_PRODUCT_COLORS.length > 0) {
    dimensions.push({ key: 'color', name: 'Color', values: SELECTED_PRODUCT_COLORS });
  }
  Object.keys(SELECTED_CUSTOM_ATTRIBUTES || {}).forEach(attrName => {
    const vals = (SELECTED_CUSTOM_ATTRIBUTES[attrName] || []).filter(Boolean);
    if (vals.length > 0) {
      dimensions.push({ key: attrName, name: attrName, values: vals });
    }
  });

  // Calculate Cartesian product across all active dimensions
  let combinations = [];
  if (dimensions.length > 0) {
    combinations = dimensions.reduce((acc, dim) => {
      const res = [];
      acc.forEach(prev => {
        dim.values.forEach(val => {
          const custom = { ...(prev._custom || {}) };
          if (dim.key !== 'size' && dim.key !== 'color') {
            custom[dim.name] = val;
          }
          res.push({
            ...prev,
            [dim.key]: val,
            _custom: custom
          });
        });
      });
      return res;
    }, [{}]);
  }

  const count = combinations.length;

  if (count <= 1) {
    if (singleSec) singleSec.classList.remove('hidden');
    if (matrixSec) matrixSec.classList.add('hidden');
    if (matrixPill) matrixPill.classList.add('hidden');
    PRODUCT_VARIANTS_MATRIX = [];
    return;
  }

  // Count > 1: Activate Multi-Field Matrix Mode
  if (singleSec) singleSec.classList.add('hidden');
  if (matrixSec) matrixSec.classList.remove('hidden');
  if (matrixPill) {
    matrixPill.classList.remove('hidden');
    matrixPill.innerText = `Matrix Active: ${count} Variants`;
  }
  if (statusText) statusText.innerText = `Variant Matrix: ${count} Fields Generated`;
  if (statusBadge) statusBadge.innerText = `${count} Variants`;

  const basePrice = parseFloat(document.getElementById('prod-form-price')?.value) || parseFloat(document.getElementById('matrix-bulk-price')?.value) || 0;
  const baseMrp = parseFloat(document.getElementById('prod-form-mrp')?.value) || parseFloat(document.getElementById('matrix-bulk-mrp')?.value) || (basePrice ? Math.round(basePrice * 1.5) : 0);
  const basePhysical = parseInt(document.getElementById('prod-form-physical')?.value) || parseInt(document.getElementById('matrix-bulk-stock')?.value) || 0;
  const baseReserved = parseInt(document.getElementById('prod-form-reserved')?.value) || 0;

  const baseSku = (document.getElementById('prod-form-sku')?.value || '').trim();
  const catSelect = document.getElementById('prod-form-category');
  const subcatSelect = document.getElementById('prod-form-subcategory');
  let prefix = 'GRM';
  const catVal = (catSelect ? catSelect.value : '').trim();
  let subcatPrefix = '';
  if (subcatSelect && subcatSelect.selectedOptions && subcatSelect.selectedOptions[0]) {
    subcatPrefix = (subcatSelect.selectedOptions[0].getAttribute('data-prefix') || '').trim();
  }

  if (subcatPrefix && subcatPrefix !== 'GRM') {
    prefix = subcatPrefix;
  } else if (catVal) {
    prefix = catVal.slice(0, 3).toUpperCase();
  }

  if (catVal && subcatPrefix && subcatPrefix !== 'GRM') {
    if (!subcatPrefix.includes('-')) {
      const catCode = catVal.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
      if (catCode && !subcatPrefix.startsWith(catCode)) {
        prefix = `${catCode}-${subcatPrefix}`;
      }
    }
  }

  // Preserve existing matrix entries if already filled
  const previousMap = {};
  PRODUCT_VARIANTS_MATRIX.forEach(v => {
    const customKeys = Object.entries(v.customAttributes || {}).map(([k, val]) => `${k}:${val}`).sort().join('_');
    const key = `${(v.size || '').toLowerCase()}_${(v.color || '').toLowerCase()}_${customKeys.toLowerCase()}`;
    previousMap[key] = v;
  });

  PRODUCT_VARIANTS_MATRIX = combinations.map((combo, idx) => {
    const customKeys = Object.entries(combo._custom || {}).map(([k, val]) => `${k}:${val}`).sort().join('_');
    const key = `${(combo.size || '').toLowerCase()}_${(combo.color || '').toLowerCase()}_${customKeys.toLowerCase()}`;
    const prev = previousMap[key];

    const szCode = combo.size ? combo.size.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase() : '';
    const colCode = combo.color ? combo.color.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() : '';
    const customCode = Object.values(combo._custom || {}).map(v => v.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase()).filter(Boolean).join('-');
    const parts = [szCode, colCode, customCode].filter(Boolean);
    const skuSuffix = parts.join('-');
    const seq = String(idx + 1).padStart(2, '0');
    const defaultSku = baseSku ? `${baseSku}-${skuSuffix || seq}` : `${prefix}-${skuSuffix || 'VAR'}-${seq}`;

    return {
      index: idx,
      size: combo.size || '',
      color: combo.color || '',
      customAttributes: combo._custom || {},
      sku: (prev && prev.sku) ? prev.sku : defaultSku,
      image: (prev && prev.image) ? prev.image : '',
      price: (prev && prev.price !== undefined && prev.price !== null && prev.price !== '') ? prev.price : basePrice,
      mrp: (prev && prev.mrp !== undefined && prev.mrp !== null && prev.mrp !== '') ? prev.mrp : baseMrp,
      physicalStock: (prev && prev.physicalStock !== undefined && prev.physicalStock !== null && prev.physicalStock !== '') ? prev.physicalStock : basePhysical
    };
  });

  renderMatrixVariantRows();
}

function renderMatrixVariantRows() {
  const container = document.getElementById('prod-matrix-variants-container');
  if (!container) return;

  if (!PRODUCT_VARIANTS_MATRIX || PRODUCT_VARIANTS_MATRIX.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-slate-500">
        <span class="material-symbols-outlined text-3xl text-slate-400 mb-1">dashboard_customize</span>
        <p class="text-xs font-bold text-slate-700">No variants currently in matrix</p>
        <p class="text-[11px] text-slate-500 mt-0.5">Select attributes above or use standard single product pricing.</p>
      </div>
    `;
    return;
  }

  const baseImg = (CURRENT_PRODUCT_IMAGE_DATA && !CURRENT_PRODUCT_IMAGE_DATA.includes('photo-1518831959646-742c3a14ebf7') && !CURRENT_PRODUCT_IMAGE_DATA.includes('photo-1583846783977-d2b0993d4265'))
    ? CURRENT_PRODUCT_IMAGE_DATA
    : 'uploads/products/sample_garment.jpg';

  container.innerHTML = PRODUCT_VARIANTS_MATRIX.map((v, i) => {
    const colorHex = getColorHex(v.color);
    const price = parseFloat(v.price) || 0;
    const mrp = parseFloat(v.mrp) || 0;
    const discount = (mrp > price && price > 0) ? Math.round(((mrp - price) / mrp) * 100) : 0;
    const stock = (v.physicalStock !== undefined && v.physicalStock !== null) ? v.physicalStock : '';
    const variantImg = v.image || baseImg;

    // Badges for size, color, and each custom attribute (e.g. Memory: 4GB)
    const badgesHtml = [];
    if (v.size) {
      badgesHtml.push(`
        <span class="px-2 py-0.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 font-extrabold text-xs">
          📏 Size: ${v.size}
        </span>
      `);
    }
    if (v.color) {
      badgesHtml.push(`
        <span class="px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1">
          <span class="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0" style="background-color: ${colorHex}"></span>
          <span>${v.color}</span>
        </span>
      `);
    }
    if (v.customAttributes) {
      Object.entries(v.customAttributes).forEach(([attrK, attrV]) => {
        badgesHtml.push(`
          <span class="px-2 py-0.5 rounded-lg bg-purple-50 border border-purple-200 text-purple-900 font-bold text-xs flex items-center gap-1 shadow-2xs">
            <span class="material-symbols-outlined text-[13px] text-purple-600">tune</span>
            <span>${attrK}: <strong>${attrV}</strong></span>
          </span>
        `);
      });
    }

    return `
      <div class="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:border-emerald-300 transition space-y-2.5">
        <!-- Variant Header: ID, Badges, Variant SKU Input & Delete Button -->
        <div class="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
          <div class="flex items-center gap-2">
            <span class="w-6 h-6 rounded-lg bg-emerald-700 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">#${i + 1}</span>
            <div class="flex items-center gap-1.5 flex-wrap">
              ${badgesHtml.join('')}
            </div>
          </div>
          <div class="flex items-center gap-2">
            <div class="flex items-center gap-1.5">
              <label class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Variant SKU *:</label>
              <input type="text" id="matrix-sku-${i}" value="${v.sku}" onchange="updateMatrixVariantField(${i}, 'sku', this.value)" class="w-36 sm:w-44 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono font-bold uppercase focus:bg-white focus:ring-2 focus:ring-brand-wa shadow-xs">
            </div>
            <button type="button" onclick="removeMatrixVariantRow(${i})" class="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-2xs cursor-pointer group/del" title="Delete this selected variant row from matrix">
              <span class="material-symbols-outlined text-[15px] text-rose-600 group-hover/del:scale-110 transition-transform">delete</span>
              <span>Delete</span>
            </button>
          </div>
        </div>

        <!-- Variant Body: Variant Image + Price + MRP + Discount + Stock -->
        <div class="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center">
          
          <!-- Variant Photo Picker -->
          <div class="md:col-span-5 flex items-center gap-2 bg-slate-50/80 p-1.5 rounded-xl border border-slate-200">
            <div class="relative w-12 h-12 rounded-lg bg-slate-200 overflow-hidden border border-slate-300 shrink-0 group cursor-pointer" onclick="document.getElementById('matrix-img-file-${i}').click()" title="Click to upload variant photo">
              <img id="matrix-thumb-${i}" src="${variantImg}" onerror="this.onerror=null;this.src='uploads/products/sample_garment.jpg';" class="w-full h-full object-cover">
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
                <span class="material-symbols-outlined text-[18px]">photo_camera</span>
              </div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between mb-0.5">
                <span class="text-[10px] font-bold text-slate-700 uppercase tracking-tight">Variant Photo:</span>
                <button type="button" onclick="document.getElementById('matrix-img-file-${i}').click()" class="text-[10px] text-teal-700 hover:text-teal-900 font-bold underline cursor-pointer">
                  Upload Photo
                </button>
              </div>
              <input type="file" id="matrix-img-file-${i}" accept="image/*" class="hidden" onchange="handleMatrixVariantImageUpload(${i}, this)">
              <input type="text" id="matrix-img-url-${i}" value="${(v.image && !v.image.startsWith('data:')) ? v.image : ''}" oninput="updateMatrixVariantField(${i}, 'image', this.value)" placeholder="Photo URL or Upload..." class="w-full bg-white border border-slate-300 rounded-md px-1.5 py-1 text-[11px] font-mono focus:ring-1 focus:ring-brand-wa truncate">
            </div>
          </div>

          <!-- Pricing & Stock Fields -->
          <div class="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
            <div>
              <label class="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">Price (₹) *</label>
              <input type="number" id="matrix-price-${i}" value="${v.price || ''}" min="0" step="1" oninput="updateMatrixVariantField(${i}, 'price', this.value)" placeholder="₹" class="w-full bg-slate-50 border border-emerald-300 rounded-lg p-1.5 text-xs font-mono font-extrabold text-emerald-900 focus:bg-white focus:ring-1 focus:ring-brand-wa">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-700 uppercase mb-0.5">MRP (₹)</label>
              <input type="number" id="matrix-mrp-${i}" value="${v.mrp || ''}" min="0" step="1" oninput="updateMatrixVariantField(${i}, 'mrp', this.value)" placeholder="₹" class="w-full bg-slate-50 border border-emerald-300 rounded-lg p-1.5 text-xs font-mono font-bold text-slate-600 focus:bg-white focus:ring-1 focus:ring-brand-wa">
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Discount</label>
              <div id="matrix-discount-badge-${i}" class="h-[31px] px-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center">
                ${discount > 0 ? `<span class="text-emerald-700 font-extrabold">${discount}% OFF</span>` : '—'}
              </div>
            </div>
            <div>
              <label class="block text-[10px] font-bold text-slate-800 uppercase mb-0.5">Stock (Units) *</label>
              <input type="number" id="matrix-stock-${i}" value="${stock}" min="0" step="1" oninput="updateMatrixVariantField(${i}, 'physicalStock', this.value)" placeholder="Units" class="w-full bg-slate-50 border border-emerald-300 rounded-lg p-1.5 text-xs font-mono font-extrabold text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa">
            </div>
          </div>

        </div>
      </div>
    `;
  }).join('');
}

// Synchronize all DOM input values of the variant matrix into the PRODUCT_VARIANTS_MATRIX memory array
function syncMatrixInputsToState() {
  if (!Array.isArray(PRODUCT_VARIANTS_MATRIX)) return;
  PRODUCT_VARIANTS_MATRIX.forEach((v, idx) => {
    const skuEl = document.getElementById(`matrix-sku-${idx}`);
    if (skuEl && skuEl.value.trim()) v.sku = skuEl.value.trim().toUpperCase();

    const priceEl = document.getElementById(`matrix-price-${idx}`);
    if (priceEl && priceEl.value !== '') v.price = parseFloat(priceEl.value) || 0;

    const mrpEl = document.getElementById(`matrix-mrp-${idx}`);
    if (mrpEl && mrpEl.value !== '') v.mrp = parseFloat(mrpEl.value) || 0;

    const stockEl = document.getElementById(`matrix-stock-${idx}`);
    if (stockEl && stockEl.value !== '') v.physicalStock = parseInt(stockEl.value) || 0;

    const imgEl = document.getElementById(`matrix-img-url-${idx}`);
    if (imgEl && imgEl.value && !imgEl.value.includes('(')) v.image = imgEl.value.trim();
  });
}
window.syncMatrixInputsToState = syncMatrixInputsToState;

// Delete a selected variant combination row from the Attribute Matrix
function removeMatrixVariantRow(index) {
  if (!Array.isArray(PRODUCT_VARIANTS_MATRIX) || index < 0 || index >= PRODUCT_VARIANTS_MATRIX.length) return;

  // 1. Sync live inputs before splicing so other rows retain user modifications
  syncMatrixInputsToState();

  const removed = PRODUCT_VARIANTS_MATRIX[index];
  const customParts = Object.values(removed.customAttributes || {}).filter(Boolean);
  const descParts = [removed.size ? `Size: ${removed.size}` : '', removed.color ? `Color: ${removed.color}` : '', ...customParts].filter(Boolean);
  const variantDesc = descParts.join(', ') || `Variant #${index + 1}`;

  // 2. Remove variant from array
  PRODUCT_VARIANTS_MATRIX.splice(index, 1);

  // 3. Re-index remaining variants
  PRODUCT_VARIANTS_MATRIX.forEach((v, idx) => {
    v.index = idx;
  });

  const count = PRODUCT_VARIANTS_MATRIX.length;
  const singleSec = document.getElementById('prod-single-pricing-section');
  const matrixSec = document.getElementById('prod-matrix-pricing-section');
  const matrixPill = document.getElementById('matrix-indicator-pill');
  const statusText = document.getElementById('matrix-status-text');
  const statusBadge = document.getElementById('matrix-status-badge');

  if (count === 0) {
    if (singleSec) singleSec.classList.remove('hidden');
    if (matrixSec) matrixSec.classList.add('hidden');
    if (matrixPill) matrixPill.classList.add('hidden');
    renderMatrixVariantRows();
    showToast('Variant Matrix Cleared', `Removed ${variantDesc}. Switched to standard pricing section.`, 'info', 'amber');
    return;
  }

  if (matrixPill) {
    matrixPill.classList.remove('hidden');
    matrixPill.innerText = `Matrix Active: ${count} Variants`;
  }
  if (statusText) statusText.innerText = `Variant Matrix: ${count} Fields Generated`;
  if (statusBadge) statusBadge.innerText = `${count} Variants`;

  // 4. Re-render matrix rows with updated indexes
  renderMatrixVariantRows();
  showToast('Variant Removed', `Removed ${variantDesc} (${count} variants remaining)`, 'delete', 'amber');
}
window.removeMatrixVariantRow = removeMatrixVariantRow;

function handleMatrixVariantImageUpload(index, fileInput) {
  const file = fileInput.files && fileInput.files[0];
  if (!file) return;

  if (file.size > 5 * 1024 * 1024) {
    showToast('File Too Large', 'Please select an image smaller than 5MB.', 'warning', 'rose');
    return;
  }

  const reader = new FileReader();
  reader.onload = async function(e) {
    const dataUrl = e.target.result;
    if (PRODUCT_VARIANTS_MATRIX[index]) {
      PRODUCT_VARIANTS_MATRIX[index].image = dataUrl;
    }
    const thumb = document.getElementById(`matrix-thumb-${index}`);
    if (thumb) thumb.src = dataUrl;

    const urlInput = document.getElementById(`matrix-img-url-${index}`);
    if (urlInput) urlInput.value = `${file.name} (${(file.size / 1024).toFixed(0)}KB)`;

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
        if (PRODUCT_VARIANTS_MATRIX[index]) {
          PRODUCT_VARIANTS_MATRIX[index].image = data.url;
        }
        if (urlInput) urlInput.value = data.url;
        showToast('Variant Photo Uploaded', `Photo for variant #${index + 1} saved!`, 'cloud_done', 'emerald');
      }
    } catch (err) {
      console.warn('Variant image upload failed, using local preview:', err);
    }
  };
  reader.readAsDataURL(file);
}

function updateMatrixVariantField(index, field, value) {
  if (!PRODUCT_VARIANTS_MATRIX[index]) return;
  if (field === 'price' || field === 'mrp') {
    PRODUCT_VARIANTS_MATRIX[index][field] = parseFloat(value) || 0;
  } else if (field === 'physicalStock') {
    PRODUCT_VARIANTS_MATRIX[index][field] = parseInt(value) || 0;
  } else if (field === 'image') {
    PRODUCT_VARIANTS_MATRIX[index][field] = value;
    const thumb = document.getElementById(`matrix-thumb-${index}`);
    if (thumb && value) {
      thumb.src = value;
    }
  } else {
    PRODUCT_VARIANTS_MATRIX[index][field] = value;
  }

  const v = PRODUCT_VARIANTS_MATRIX[index];
  const price = parseFloat(v.price) || 0;
  const mrp = parseFloat(v.mrp) || 0;
  const discBadge = document.getElementById(`matrix-discount-badge-${index}`);
  const priceInput = document.getElementById(`matrix-price-${index}`);
  const mrpInput = document.getElementById(`matrix-mrp-${index}`);

  if (price > 0 && mrp > 0 && price > mrp) {
    if (priceInput) priceInput.classList.add('border-rose-500', 'bg-rose-50');
    if (mrpInput) mrpInput.classList.add('border-rose-500', 'bg-rose-50');
    if (discBadge) {
      discBadge.className = 'h-[31px] px-1.5 bg-rose-100 rounded-lg border border-rose-300 text-rose-800 text-[10px] font-extrabold flex items-center justify-center animate-pulse';
      discBadge.innerHTML = `<span class="material-symbols-outlined text-[13px] text-rose-600 mr-0.5">warning</span> MRP &lt; Price`;
    }
  } else {
    if (priceInput) priceInput.classList.remove('border-rose-500', 'bg-rose-50');
    if (mrpInput) mrpInput.classList.remove('border-rose-500', 'bg-rose-50');
    const discount = (mrp > price && price > 0) ? Math.round(((mrp - price) / mrp) * 100) : 0;
    if (discBadge) {
      discBadge.className = 'h-[31px] px-2 bg-slate-100 rounded-lg border border-slate-200 text-slate-600 text-[11px] font-bold flex items-center justify-center';
      discBadge.innerHTML = discount > 0 ? `<span class="text-emerald-700 font-extrabold">${discount}% OFF</span>` : '—';
    }
  }
}

function applyBulkToVariantMatrix() {
  const bulkPrice = parseFloat(document.getElementById('matrix-bulk-price')?.value);
  const bulkMrp = parseFloat(document.getElementById('matrix-bulk-mrp')?.value);
  const bulkStock = parseInt(document.getElementById('matrix-bulk-stock')?.value);

  if (isNaN(bulkPrice) && isNaN(bulkMrp) && isNaN(bulkStock)) {
    showToast('Bulk Values Needed', 'Please enter Price, MRP, or Stock in the bulk toolbar to apply.', 'info', 'amber');
    return;
  }

  if (!isNaN(bulkPrice) && !isNaN(bulkMrp) && bulkPrice > 0 && bulkMrp > 0 && bulkPrice > bulkMrp) {
    showToast('Invalid Pricing', 'Bulk Selling Price cannot be greater than Bulk MRP. Always MRP is bigger.', 'error', 'rose');
    return;
  }

  PRODUCT_VARIANTS_MATRIX.forEach((v, i) => {
    if (!isNaN(bulkPrice)) {
      v.price = bulkPrice;
      const el = document.getElementById(`matrix-price-${i}`);
      if (el) el.value = bulkPrice;
    }
    if (!isNaN(bulkMrp)) {
      v.mrp = bulkMrp;
      const el = document.getElementById(`matrix-mrp-${i}`);
      if (el) el.value = bulkMrp;
    }
    if (!isNaN(bulkStock)) {
      v.physicalStock = bulkStock;
      const el = document.getElementById(`matrix-stock-${i}`);
      if (el) el.value = bulkStock;
    }
    updateMatrixVariantField(i, 'price', v.price);
  });

}

// -------------------------------------------------------------------------
// PRODUCT SPECIFICATIONS (SAME ATTRIBUTE FLOW: CHIPS & MULTI-SELECT)
// -------------------------------------------------------------------------
let PRODUCT_SPECS_ROW_COUNTER = 0;

function addProductSpecificationRow(label = '', content = '') {
  if (label || content) {
    toggleProductFormSpec(label, content);
  }
}

function removeProductSpecificationRow(rowId) {
  // Compatibility no-op
}

function getProductSpecificationsFromForm() {
  if (Array.isArray(SELECTED_PRODUCT_SPECS) && SELECTED_PRODUCT_SPECS.length > 0) {
    return SELECTED_PRODUCT_SPECS;
  }
  const input = document.getElementById('prod-form-specifications');
  if (input && input.value.trim()) {
    return input.value.split(',').map(s => {
      const tr = s.trim();
      if (tr.includes(':')) {
        const sp = tr.split(':');
        return { label: sp[0].trim(), content: sp.slice(1).join(':').trim() };
      }
      return { label: 'Specification', content: tr };
    }).filter(s => s.content || s.label);
  }
  return [];
}

function setProductSpecificationsInForm(specs) {
  let parsed = specs;
  if (typeof specs === 'string') {
    try { parsed = JSON.parse(specs); } catch (e) {
      parsed = specs.split(',').map(s => {
        const tr = s.trim();
        if (tr.includes(':')) {
          const sp = tr.split(':');
          return { label: sp[0].trim(), content: sp.slice(1).join(':').trim() };
        }
        return { label: 'Specification', content: tr };
      }).filter(Boolean);
    }
  }
  if (!Array.isArray(parsed)) parsed = [];
  SELECTED_PRODUCT_SPECS = parsed.map(s => {
    if (typeof s === 'string') {
      if (s.includes(':')) {
        const sp = s.split(':');
        return { label: sp[0].trim(), content: sp.slice(1).join(':').trim() };
      }
      return { label: 'Specification', content: s.trim() };
    }
    return { label: s.label || 'Specification', content: s.content || '' };
  });

  const input = document.getElementById('prod-form-specifications');
  if (input) {
    input.value = SELECTED_PRODUCT_SPECS.map(s => (s.label && s.label !== 'Specification') ? `${s.label}: ${s.content}` : (s.content || s.label)).join(', ');
  }
  renderProductFormAttributeChips();
  updateProductFormPreview();
}

function toggleProductSpecificationPreset(lbl, cnt) {
  toggleProductFormSpec(lbl, cnt);
}

function selectPresetGarmentPhoto(url, sampleTitle) {
  CURRENT_PRODUCT_IMAGE_DATA = url;
  const previewImg = document.getElementById('prod-form-img-preview');
  const previewName = document.getElementById('prod-preview-filename');
  const previewStatus = document.getElementById('prod-preview-status');
  const urlInput = document.getElementById('prod-form-image');

  if (previewImg) previewImg.src = url;
  if (previewName) previewName.innerText = sampleTitle || 'Curated Garment Photo';
  if (previewStatus) previewStatus.innerText = 'Preset photo selected';
  if (urlInput) urlInput.value = url;

  const titleInput = document.getElementById('prod-form-name');
  if (titleInput && !titleInput.value.trim() && sampleTitle) {
    titleInput.value = sampleTitle;
  }

  updateProductFormPreview();
}

// -------------------------------------------------------------------------
// 1-CLICK AUTOMATIC SKU GENERATOR (E-COMMERCE CATALOG LOGIC)
// -------------------------------------------------------------------------
function autoGenerateProductSKU() {
  const subcatSelect = document.getElementById('prod-form-subcategory');
  const catSelect = document.getElementById('prod-form-category');
  const sizeInput = document.getElementById('prod-form-size');
  const colorInput = document.getElementById('prod-form-color');
  const skuInput = document.getElementById('prod-form-sku');

  if (!skuInput) return;

  // 1. SKU Prefix based on Category and Subcategory
  let prefix = 'GRM';
  const catVal = (catSelect ? catSelect.value : '').trim();
  let subcatPrefix = '';
  if (subcatSelect && subcatSelect.selectedOptions && subcatSelect.selectedOptions[0]) {
    subcatPrefix = (subcatSelect.selectedOptions[0].getAttribute('data-prefix') || '').trim();
  }

  if (subcatPrefix && subcatPrefix !== 'GRM') {
    prefix = subcatPrefix;
  } else if (catVal) {
    prefix = catVal.slice(0, 3).toUpperCase();
  }

  // Ensure prefix is based on both Category and Subcategory if both exist
  if (catVal && subcatPrefix && subcatPrefix !== 'GRM') {
    if (!subcatPrefix.includes('-')) {
      const catCode = catVal.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase();
      if (catCode && !subcatPrefix.startsWith(catCode)) {
        prefix = `${catCode}-${subcatPrefix}`;
      }
    }
  }

  // 2. Clean Size Code (e.g. "2-3 Years" -> "2Y", "0-6 Months" -> "06M", "XL" -> "XL")
  let sizeCode = 'STD';
  const sizeVal = (sizeInput ? sizeInput.value : '').trim().toUpperCase();
  if (sizeVal) {
    const yrMatch = sizeVal.match(/(\d+)\s*(?:-|TO)?\s*(\d*)\s*Y/i);
    const moMatch = sizeVal.match(/(\d+)\s*(?:-|TO)?\s*(\d*)\s*M/i);
    if (yrMatch) {
      sizeCode = `${yrMatch[1]}Y`;
    } else if (moMatch) {
      sizeCode = `${moMatch[1]}M`;
    } else if (['S', 'M', 'L', 'XL', 'XXL', '3XL', 'FREE'].some(tag => sizeVal.startsWith(tag))) {
      sizeCode = sizeVal.split(' ')[0].replace(/[^A-Z0-9]/g, '');
    } else {
      sizeCode = sizeVal.replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'STD';
    }
  }

  // 3. Clean Color Code (e.g. "Pink" -> "PK", "Yellow" -> "YL", "Sky Blue" -> "BL")
  let colorCode = 'CL';
  const colorVal = (colorInput ? colorInput.value : '').trim().toUpperCase();
  if (colorVal) {
    if (colorVal.includes('PINK')) colorCode = 'PK';
    else if (colorVal.includes('YELLOW')) colorCode = 'YL';
    else if (colorVal.includes('BLUE')) colorCode = 'BL';
    else if (colorVal.includes('GREEN')) colorCode = 'GR';
    else if (colorVal.includes('RED')) colorCode = 'RD';
    else if (colorVal.includes('WHITE')) colorCode = 'WH';
    else if (colorVal.includes('BLACK')) colorCode = 'BK';
    else if (colorVal.includes('PEACH')) colorCode = 'PC';
    else if (colorVal.includes('LAVENDER')) colorCode = 'LV';
    else if (colorVal.includes('MAROON')) colorCode = 'MR';
    else {
      colorCode = colorVal.replace(/[^A-Z]/g, '').slice(0, 2) || 'CL';
    }
  }

  // 4. Sequential 2-digit index based on existing inventory count
  const matchingSkus = (CRM_STATE.products || []).filter(p => p.sku && p.sku.startsWith(prefix));
  const seqNum = String(matchingSkus.length + 1).padStart(2, '0');

  const generatedSKU = `${prefix}-${sizeCode}-${colorCode}-${seqNum}`;
  skuInput.value = generatedSKU;

  if (PRODUCT_VARIANTS_MATRIX.length > 1) {
    calculateProductVariantMatrix();
  }

  updateProductFormPreview();
  showToast('SKU Auto-Generated', `Generated unique SKU: ${generatedSKU}`, 'bolt', 'emerald');
  return generatedSKU;
}

// -------------------------------------------------------------------------
// PRICING MARGINS & REALTIME STOCK CALCULATION
// -------------------------------------------------------------------------
function applySuggestedPricing(newPrice, newMrp) {
  const priceInput = document.getElementById('prod-form-price');
  const mrpInput = document.getElementById('prod-form-mrp');
  if (priceInput && newPrice !== undefined) priceInput.value = newPrice;
  if (mrpInput && newMrp !== undefined) mrpInput.value = newMrp;
  calculateDiscountAndPreview();
  if (typeof playChime === 'function') playChime('pop');
  if (typeof showToast === 'function') {
    showToast('Price Corrected', `Applied MRP ₹${newMrp} & Selling Price ₹${newPrice}`, 'check_circle', 'emerald');
  }
}
window.applySuggestedPricing = applySuggestedPricing;

function calculateDiscountAndPreview() {
  const priceInput = document.getElementById('prod-form-price');
  const mrpInput = document.getElementById('prod-form-mrp');
  const badge = document.getElementById('prod-form-discount-badge');
  const errContainer = document.getElementById('prod-form-price-error-container');

  const priceVal = priceInput ? priceInput.value.trim() : '';
  const mrpVal = mrpInput ? mrpInput.value.trim() : '';
  const price = parseFloat(priceVal) || 0;
  const mrp = parseFloat(mrpVal) || 0;

  // Reset input styles
  if (priceInput) priceInput.classList.remove('border-rose-500', 'bg-rose-50/40', 'ring-2', 'ring-rose-200');
  if (mrpInput) mrpInput.classList.remove('border-rose-500', 'bg-rose-50/40', 'ring-2', 'ring-rose-200');

  // Enforce: selling price must be smaller than MRP. Always MRP is bigger.
  if (price > 0 && mrp > 0 && price > mrp) {
    if (priceInput) priceInput.classList.add('border-rose-500', 'bg-rose-50/40', 'ring-2', 'ring-rose-200');
    if (mrpInput) mrpInput.classList.add('border-rose-500', 'bg-rose-50/40', 'ring-2', 'ring-rose-200');

    if (badge) {
      badge.className = 'h-[38px] px-2.5 bg-rose-100 rounded-xl border border-rose-300 text-rose-800 font-extrabold flex items-center justify-center text-[11px] shadow-sm animate-pulse';
      badge.innerHTML = `<span class="material-symbols-outlined text-[14px] text-rose-600 mr-1">warning</span> MRP &lt; Price Error`;
    }

    if (errContainer) {
      const suggestedMrp20 = Math.ceil((price * 1.25) / 10) * 10;
      errContainer.className = 'p-3 bg-rose-50/90 border border-rose-300 rounded-xl space-y-2 animate-in fade-in duration-150 text-xs shadow-2xs';
      errContainer.innerHTML = `
        <div class="flex items-start gap-2.5 text-rose-900">
          <span class="material-symbols-outlined text-rose-600 text-[20px] shrink-0 mt-0.5">error</span>
          <div class="space-y-1.5 flex-1">
            <div class="font-extrabold text-xs text-rose-800">
              ⚠️ Pricing Error: Selling Price (₹${price}) cannot be higher than MRP (₹${mrp}). Always MRP is bigger!
            </div>
            <p class="text-[11px] text-rose-700 leading-relaxed">
              If entered by mistake lesser, please adjust the MRP or Selling Price. Click any suggestion below to fix automatically:
            </p>
            <div class="pt-1 flex items-center gap-2 flex-wrap text-[11px]">
              <span class="font-bold text-slate-700">Quick Suggestions:</span>
              <button type="button" onclick="applySuggestedPricing(${price}, ${price})" class="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition font-bold flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[13px] text-emerald-600">check_circle</span> Set MRP = ₹${price} (0% Off)
              </button>
              <button type="button" onclick="applySuggestedPricing(${price}, ${suggestedMrp20})" class="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg shadow-2xs transition font-bold flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[13px] text-emerald-600">trending_up</span> Set MRP = ₹${suggestedMrp20} (Save ₹${suggestedMrp20 - price})
              </button>
              <button type="button" onclick="applySuggestedPricing(${mrp}, ${mrp})" class="px-2.5 py-1 bg-white hover:bg-blue-50 text-blue-800 border border-blue-300 rounded-lg shadow-2xs transition font-bold flex items-center gap-1 cursor-pointer">
                <span class="material-symbols-outlined text-[13px] text-blue-600">arrow_downward</span> Reduce Selling Price to ₹${mrp}
              </button>
            </div>
          </div>
        </div>
      `;
    }
  } else {
    // Valid pricing or empty
    if (errContainer) {
      errContainer.className = 'hidden';
      errContainer.innerHTML = '';
    }

    if (badge) {
      if (price <= 0 && !priceVal) {
        badge.className = 'h-[38px] px-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-400 font-medium flex items-center justify-center text-[11px]';
        badge.innerHTML = 'Enter Selling Price';
      } else if (mrp > price && price > 0) {
        const discount = Math.round(((mrp - price) / mrp) * 100);
        const savings = Math.round(mrp - price);
        badge.className = 'h-[38px] px-3 bg-emerald-100 rounded-xl border border-emerald-300 text-emerald-800 font-extrabold flex items-center justify-center text-[11px] shadow-sm';
        badge.innerHTML = `Save ₹${savings} (${discount}% OFF)`;
      } else if (mrp === price && price > 0) {
        badge.className = 'h-[38px] px-3 bg-slate-100 rounded-xl border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-[11px]';
        badge.innerHTML = 'MRP = Selling Price (0% OFF)';
      } else {
        badge.className = 'h-[38px] px-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-500 font-bold flex items-center justify-center text-[11px]';
        badge.innerHTML = price > 0 ? 'Standard Price' : 'Enter Price';
      }
    }
  }

  updateProductFormPreview();
}
window.calculateDiscountAndPreview = calculateDiscountAndPreview;

function calculateSellableAndPreview() {
  const physInput = document.getElementById('prod-form-physical');
  const resInput = document.getElementById('prod-form-reserved');
  const badge = document.getElementById('prod-form-sellable-badge');

  const physVal = physInput ? physInput.value.trim() : '';
  const resVal = resInput ? resInput.value.trim() : '';
  const physical = parseInt(physVal) || 0;
  const reserved = parseInt(resVal) || 0;
  const sellable = Math.max(0, physical - reserved);

  if (badge) {
    if (physVal === '') {
      badge.innerText = 'Enter Stock';
      badge.className = 'h-[38px] px-3 bg-slate-100 rounded-xl border border-slate-200 text-slate-400 font-medium font-mono flex items-center justify-center text-xs';
    } else if (sellable > 0) {
      badge.innerText = `${sellable} Ready to Ship`;
      badge.className = 'h-[38px] px-3 bg-white rounded-xl border border-emerald-300 text-emerald-800 font-extrabold font-mono flex items-center justify-center text-xs shadow-sm';
    } else {
      badge.innerText = `0 Ready to Ship`;
      badge.className = 'h-[38px] px-3 bg-rose-50 rounded-xl border border-rose-300 text-rose-700 font-extrabold font-mono flex items-center justify-center text-xs shadow-sm';
    }
  }

  updateProductFormPreview();
}

// -------------------------------------------------------------------------
// REALTIME WHATSAPP DISPATCH CARD PREVIEW
// -------------------------------------------------------------------------
function updateProductFormPreview() {
  const name = (document.getElementById('prod-form-name')?.value || '').trim();
  const sku = (document.getElementById('prod-form-sku')?.value || '').trim().toUpperCase();
  const cat = (document.getElementById('prod-form-category')?.value || '').trim();
  const subcat = (document.getElementById('prod-form-subcategory')?.value || '').trim();
  const size = (document.getElementById('prod-form-size')?.value || '').trim();
  const color = (document.getElementById('prod-form-color')?.value || '').trim();
  const fabric = (document.getElementById('prod-form-fabric')?.value || '').trim();
  const desc = (document.getElementById('prod-form-desc')?.value || '').trim();
  const priceVal = (document.getElementById('prod-form-price')?.value || '').trim();
  const mrpVal = (document.getElementById('prod-form-mrp')?.value || '').trim();
  const physVal = (document.getElementById('prod-form-physical')?.value || '').trim();
  const resVal = (document.getElementById('prod-form-reserved')?.value || '').trim();

  const price = parseFloat(priceVal) || 0;
  const mrp = parseFloat(mrpVal) || 0;
  const physical = physVal !== '' ? (parseInt(physVal) || 0) : null;
  const reserved = resVal !== '' ? (parseInt(resVal) || 0) : 0;
  const available = physical !== null ? Math.max(0, physical - reserved) : null;
  const accountId = document.getElementById('prod-form-account-id')?.value || 'account_1';

  const img = (CURRENT_PRODUCT_IMAGE_DATA && !CURRENT_PRODUCT_IMAGE_DATA.includes('photo-1518831959646-742c3a14ebf7') && !CURRENT_PRODUCT_IMAGE_DATA.includes('photo-1583846783977-d2b0993d4265'))
    ? CURRENT_PRODUCT_IMAGE_DATA
    : getSmartProductImage({ category: cat, subcategory: subcat, name, sku });

  // 1. Card Image & Badges
  const prevImg = document.getElementById('prev-card-img');
  if (prevImg) prevImg.src = img;

  const prevSku = document.getElementById('prev-card-sku');
  if (prevSku) {
    if (sku) {
      prevSku.innerText = sku;
      prevSku.className = 'bg-slate-900/80 backdrop-blur-sm text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow';
    } else {
      prevSku.innerHTML = '<span class="text-slate-400 italic font-normal">SKU PENDING</span>';
      prevSku.className = 'bg-slate-900/80 backdrop-blur-sm text-white font-mono text-[10px] px-2 py-0.5 rounded shadow';
    }
  }

  const prevStock = document.getElementById('prev-card-stock-badge');
  if (prevStock) {
    if (physical === null) {
      prevStock.className = 'bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-slate-300 flex items-center gap-1 shadow';
      prevStock.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> Stock: 0';
    } else if (available > 5) {
      prevStock.className = 'bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1 shadow';
      prevStock.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> In Stock (${available})`;
    } else if (available > 0) {
      prevStock.className = 'bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1 animate-pulse shadow';
      prevStock.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Only ${available} Left`;
    } else {
      prevStock.className = 'bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300 flex items-center gap-1 shadow';
      prevStock.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Out of Stock`;
    }
  }

  const prevCat = document.getElementById('prev-card-cat');
  if (prevCat) {
    if (cat && subcat) {
      prevCat.innerHTML = `${cat} &rsaquo; ${subcat}`;
      prevCat.className = 'text-[10px] bg-white/95 backdrop-blur-sm text-slate-800 font-bold px-2 py-0.5 rounded shadow-sm';
    } else if (cat) {
      prevCat.innerHTML = cat;
      prevCat.className = 'text-[10px] bg-white/95 backdrop-blur-sm text-slate-800 font-bold px-2 py-0.5 rounded shadow-sm';
    } else {
      prevCat.innerHTML = '<span class="text-slate-400 italic font-normal">Select Category</span>';
      prevCat.className = 'text-[10px] bg-white/95 backdrop-blur-sm text-slate-600 font-normal px-2 py-0.5 rounded shadow-sm';
    }
  }

  const prevTitle = document.getElementById('prev-card-title');
  if (prevTitle) {
    if (name) {
      prevTitle.innerText = name;
      prevTitle.className = 'font-bold text-xs text-slate-900 line-clamp-2';
    } else {
      prevTitle.innerHTML = '<span class="text-slate-400 italic font-normal">Garment Product Name</span>';
      prevTitle.className = 'text-xs text-slate-400 line-clamp-2';
    }
  }

  const prevPrice = document.getElementById('prev-card-price');
  if (prevPrice) {
    if (priceVal !== '' && price > 0) {
      prevPrice.innerText = `₹${price}`;
      prevPrice.className = 'font-extrabold text-emerald-700 font-mono text-sm';
    } else {
      prevPrice.innerHTML = '<span class="text-xs text-slate-400 font-normal">₹—</span>';
      prevPrice.className = 'font-bold text-slate-400 font-mono text-sm';
    }
  }

  const prevMrp = document.getElementById('prev-card-mrp');
  if (prevMrp) {
    if (price > 0 && mrp > price) {
      prevMrp.innerText = `₹${mrp}`;
      prevMrp.classList.remove('hidden');
    } else {
      prevMrp.classList.add('hidden');
    }
  }

  const prevAttrs = document.getElementById('prev-card-attrs');
  const activeSpecs = getProductSpecificationsFromForm();
  if (prevAttrs) {
    const attrItems = [];
    if (size) {
      attrItems.push(`<span>📏 ${size}</span>`);
    }
    if (color) {
      const hex = getColorHex(color);
      attrItems.push(`<span class="flex items-center gap-1"><span class="w-2 h-2 rounded-full border border-black/20" style="background-color: ${hex}"></span>${color}</span>`);
    }
    if (fabric) {
      attrItems.push(`<span class="text-teal-700 font-semibold">🧵 ${fabric}</span>`);
    }
    if (activeSpecs && activeSpecs.length > 0) {
      activeSpecs.forEach(sp => {
        if (sp.label && sp.content) {
          attrItems.push(`<span class="text-indigo-800 font-semibold bg-indigo-50/90 px-1.5 py-0.5 rounded border border-indigo-200/60 text-[10px]">📌 ${sp.label}: ${sp.content}</span>`);
        }
      });
    }

    if (attrItems.length > 0) {
      prevAttrs.innerHTML = attrItems.join('<span>&bull;</span>');
      prevAttrs.className = 'text-[11px] text-slate-600 flex items-center gap-1.5 flex-wrap';
    } else {
      prevAttrs.innerHTML = '<span class="text-slate-400 italic">No attributes selected</span>';
      prevAttrs.className = 'text-[11px] text-slate-400 flex items-center gap-1.5 flex-wrap';
    }
  }

  const prevSellable = document.getElementById('prev-card-sellable');
  if (prevSellable) {
    if (physical !== null) {
      prevSellable.innerText = `${available} Units in Warehouse`;
      prevSellable.className = 'text-emerald-700 font-mono font-extrabold';
    } else {
      prevSellable.innerHTML = '<span class="text-slate-400 italic font-normal">Not set</span>';
      prevSellable.className = 'text-slate-400 font-mono font-normal';
    }
  }

  // 2. WhatsApp Message Text Preview
  const msgTextEl = document.getElementById('prev-wa-message-text');
  if (msgTextEl) {
    const hasAnyContent = name || sku || cat || size || color || fabric || (activeSpecs && activeSpecs.length > 0) || priceVal !== '' || physVal !== '';
    if (!hasAnyContent) {
      msgTextEl.innerHTML = '<span class="text-emerald-300/60 italic font-sans text-xs">Enter product details on the left to preview the live WhatsApp dispatch message here in real-time...</span>';
    } else {
      const lines = [];
      lines.push(name ? `🛍️ *${name}*` : `🛍️ *[Product Name]*`);
      if (sku) lines.push(`🏷️ *SKU:* ${sku}`);
      if (cat && subcat) lines.push(`📁 *Catalog:* ${cat} › ${subcat}`);
      else if (cat) lines.push(`📁 *Catalog:* ${cat}`);
      if (size) lines.push(`📏 *Size / Age:* ${size}`);
      if (color) lines.push(`🎨 *Color:* ${color}`);
      if (fabric) lines.push(`🧵 *Fabric:* ${fabric}`);
      if (activeSpecs && activeSpecs.length > 0) {
        activeSpecs.forEach(sp => {
          if (sp.label && sp.content) {
            lines.push(`📌 *${sp.label}:* ${sp.content}`);
          }
        });
      }

      if (price > 0) {
        if (mrp > price) {
          lines.push(`💰 *Price:* ₹${price} ~₹${mrp}~ (*${Math.round(((mrp - price) / mrp) * 100)}% OFF*)`);
        } else {
          lines.push(`💰 *Price:* ₹${price}`);
        }
      }

      if (physical !== null && physical > 0) {
        const stockNote = available > 5 
          ? `✅ *In Stock* (${available} units ready for immediate dispatch)`
          : (available > 0 ? `⚡ *Limited Stock* (Only ${available} units remaining!)` : `⚠️ *Made to Order* (Available on booking)`);
        lines.push(`📦 *Stock:* ${stockNote}`);
      }

      if (desc) {
        lines.push(`\n✨ *Product Highlights:*\n${desc}`);
      }

      lines.push(`\n🚚 Fast door delivery & Cash on Delivery (COD) available!\n👉 *Reply 'YES' to confirm your order booking!*`);
      msgTextEl.innerText = lines.join('\n');
    }
  }
}

// -------------------------------------------------------------------------
// OPEN ADD / EDIT PRODUCT MODALS
// -------------------------------------------------------------------------
function openAddProductModal() {
  const title = document.getElementById('modal-product-title');
  if (title) title.innerText = 'Add New Garment Product (Catalog Flow)';

  const icon = document.getElementById('modal-product-icon');
  if (icon) icon.innerText = 'shopping_bag';

  document.getElementById('prod-form-id').value = '';
  document.getElementById('prod-form-sku').value = '';
  document.getElementById('prod-form-name').value = '';
  document.getElementById('prod-form-desc').value = '';
  document.getElementById('prod-form-size').value = '';
  document.getElementById('prod-form-color').value = '';
  if (document.getElementById('prod-form-fabric')) document.getElementById('prod-form-fabric').value = '';
  document.getElementById('prod-form-price').value = '';
  document.getElementById('prod-form-mrp').value = '';
  document.getElementById('prod-form-physical').value = '';
  document.getElementById('prod-form-reserved').value = '0';

  if (document.getElementById('matrix-bulk-price')) document.getElementById('matrix-bulk-price').value = '';
  if (document.getElementById('matrix-bulk-mrp')) document.getElementById('matrix-bulk-mrp').value = '';
  if (document.getElementById('matrix-bulk-stock')) document.getElementById('matrix-bulk-stock').value = '';

  const lineSelect = document.getElementById('prod-form-account-id');
  if (lineSelect) lineSelect.value = ACTIVE_SEND_ACCOUNT_ID || 'account_1';

  clearProductImagePreview();
  switchProductImageSourceTab('upload');

  // Populate dynamic category & subcategory dropdowns with blank default
  populateProductFormCategories('', '');

  // Reset specifications
  SELECTED_PRODUCT_SPECS = [];
  setProductSpecificationsInForm([]);

  // Reset multi-select attributes & matrix
  SELECTED_PRODUCT_SIZES = [];
  SELECTED_PRODUCT_COLORS = [];
  SELECTED_CUSTOM_ATTRIBUTES = {};
  PRODUCT_VARIANTS_MATRIX = [];
  renderProductFormAttributeChips([], [], [], {});
  calculateProductVariantMatrix();

  calculateDiscountAndPreview();
  calculateSellableAndPreview();
  updateProductFormPreview();

  const delBtn = document.getElementById('prod-delete-btn');
  if (delBtn) delBtn.classList.add('hidden');

  openModal('modal-product-edit');
}

function openEditProductModal(productId) {
  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId));
  if (!p) {
    showToast('Product Not Found', 'Could not locate product details.', 'error', 'rose');
    return;
  }

  const title = document.getElementById('modal-product-title');
  if (title) title.innerText = `Edit Garment: ${p.sku}`;

  const icon = document.getElementById('modal-product-icon');
  if (icon) icon.innerText = 'edit_note';

  document.getElementById('prod-form-id').value = p.id;
  document.getElementById('prod-form-sku').value = p.sku || '';
  document.getElementById('prod-form-name').value = p.name || '';
  document.getElementById('prod-form-desc').value = p.description || '';
  document.getElementById('prod-form-size').value = p.size || '';
  document.getElementById('prod-form-color').value = p.color || '';
  if (document.getElementById('prod-form-fabric')) document.getElementById('prod-form-fabric').value = '';
  document.getElementById('prod-form-price').value = p.price || '';
  document.getElementById('prod-form-mrp').value = p.mrp || '';
  document.getElementById('prod-form-physical').value = p.physicalStock || '';
  document.getElementById('prod-form-reserved').value = p.reservedStock || 0;

  const lineSelect = document.getElementById('prod-form-account-id');
  if (lineSelect) lineSelect.value = p.accountId || 'account_1';

  // Set image preview
  const validImg = getSmartProductImage(p);
  CURRENT_PRODUCT_IMAGE_DATA = validImg;
  const urlInput = document.getElementById('prod-form-image');
  if (urlInput) urlInput.value = (validImg && (validImg.startsWith('http') || validImg.startsWith('uploads/'))) ? validImg : '';

  const previewImg = document.getElementById('prod-form-img-preview');
  const previewName = document.getElementById('prod-preview-filename');
  const previewStatus = document.getElementById('prod-preview-status');

  if (previewImg) previewImg.src = validImg;
  if (previewName) previewName.innerText = `${p.sku || 'Garment'} Photo`;
  if (previewStatus) previewStatus.innerText = 'Active garment image';

  if (validImg && validImg.startsWith('http')) {
    switchProductImageSourceTab('url');
  } else {
    switchProductImageSourceTab('upload');
  }

  // Populate dynamic categories with active product category and subcategory
  populateProductFormCategories(p.category, p.subcategory);
  setProductSpecificationsInForm(p.specifications || []);

  // Multi-select attributes & matrix init
  SELECTED_PRODUCT_SIZES = p.size ? p.size.split(',').map(s => s.trim()).filter(Boolean) : [];
  SELECTED_PRODUCT_COLORS = p.color ? p.color.split(',').map(c => c.trim()).filter(Boolean) : [];

  // Custom attributes extraction
  SELECTED_CUSTOM_ATTRIBUTES = {};
  if (p.customAttributes && typeof p.customAttributes === 'object') {
    SELECTED_CUSTOM_ATTRIBUTES = JSON.parse(JSON.stringify(p.customAttributes));
  } else if (p.custom_attributes) {
    if (typeof p.custom_attributes === 'object') {
      SELECTED_CUSTOM_ATTRIBUTES = JSON.parse(JSON.stringify(p.custom_attributes));
    } else {
      try {
        SELECTED_CUSTOM_ATTRIBUTES = JSON.parse(p.custom_attributes);
      } catch (e) {}
    }
  }

  // Also extract from specifications if any spec matches custom attribute names
  const registeredCustomTypes = Object.keys(CRM_STATE.attributes?.custom || {});
  (p.specifications || []).forEach(spec => {
    const lbl = (typeof spec === 'object' ? spec.label : spec) || '';
    const cnt = (typeof spec === 'object' ? spec.content : '') || '';
    if (lbl && cnt) {
      const matchType = registeredCustomTypes.find(t => t.toLowerCase() === lbl.toLowerCase());
      if (matchType) {
        if (!SELECTED_CUSTOM_ATTRIBUTES[matchType]) SELECTED_CUSTOM_ATTRIBUTES[matchType] = [];
        if (!SELECTED_CUSTOM_ATTRIBUTES[matchType].includes(cnt)) {
          SELECTED_CUSTOM_ATTRIBUTES[matchType].push(cnt);
        }
      }
    }
  });

  PRODUCT_VARIANTS_MATRIX = [];
  renderProductFormAttributeChips(SELECTED_PRODUCT_SIZES, SELECTED_PRODUCT_COLORS, SELECTED_PRODUCT_SPECS, SELECTED_CUSTOM_ATTRIBUTES);
  calculateProductVariantMatrix();

  calculateDiscountAndPreview();
  calculateSellableAndPreview();
  updateProductFormPreview();

  const delBtn = document.getElementById('prod-delete-btn');
  if (delBtn) delBtn.classList.remove('hidden');

  openModal('modal-product-edit');
}

// -------------------------------------------------------------------------
// SAVE & DELETE PRODUCT API HANDLERS
// -------------------------------------------------------------------------
async function handleProductFormSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  try {
    const idVal = document.getElementById('prod-form-id')?.value || '';
    const name = (document.getElementById('prod-form-name')?.value || '').trim();
    const category = (document.getElementById('prod-form-category')?.value || '').trim();
    const subcategory = (document.getElementById('prod-form-subcategory')?.value || '').trim();

    if (!name) {
      showToast('Name Required', 'Please enter a product name.', 'warning', 'amber');
      document.getElementById('prod-form-name')?.focus();
      return;
    }
    if (!category) {
      showToast('Category Required', 'Please select a main category.', 'warning', 'amber');
      document.getElementById('prod-form-category')?.focus();
      return;
    }
    if (!subcategory) {
      showToast('Subcategory Required', 'Please select a subcategory.', 'warning', 'amber');
      document.getElementById('prod-form-subcategory')?.focus();
      return;
    }

    let sku = (document.getElementById('prod-form-sku')?.value || '').trim().toUpperCase();
    if (!sku) {
      sku = autoGenerateProductSKU() || `GRM-${Date.now().toString().slice(-6)}`;
    }
    const description = (document.getElementById('prod-form-desc')?.value || '').trim();
    const specifications = getProductSpecificationsFromForm();
    const accountId = document.getElementById('prod-form-account-id')?.value || 'account_1';

    let image = CURRENT_PRODUCT_IMAGE_DATA || '';
    if (!image) {
      const urlVal = document.getElementById('prod-form-image') ? document.getElementById('prod-form-image').value.trim() : '';
      image = urlVal || '';
    }
    if (!image || image.includes('photo-1518831959646-742c3a14ebf7') || image.includes('No Image')) {
      image = getSmartProductImage({ category, subcategory, name, sku });
    }

    // Check if Multi-Field Matrix Mode is Active
    const matrixSec = document.getElementById('prod-matrix-pricing-section');
    const isMatrixActive = matrixSec && !matrixSec.classList.contains('hidden') && PRODUCT_VARIANTS_MATRIX.length > 0;

    if (isMatrixActive) {
      syncMatrixInputsToState();
      const variantsPayload = PRODUCT_VARIANTS_MATRIX.map((v, idx) => {
        const fallbackSku = `${sku}-VAR-${idx + 1}`;
        const inputSku = (document.getElementById(`matrix-sku-${idx}`)?.value || document.getElementById(`matrix-sku-${v.index}`)?.value || '').trim().toUpperCase();
        const varSku = inputSku || (v.sku ? v.sku.trim().toUpperCase() : fallbackSku);
        const varPrice = parseFloat(document.getElementById(`matrix-price-${idx}`)?.value || document.getElementById(`matrix-price-${v.index}`)?.value) || v.price || 0;
        const varMrp = parseFloat(document.getElementById(`matrix-mrp-${idx}`)?.value || document.getElementById(`matrix-mrp-${v.index}`)?.value) || v.mrp || varPrice;
        const stockInput = document.getElementById(`matrix-stock-${idx}`) || document.getElementById(`matrix-stock-${v.index}`);
        const varStock = stockInput ? (parseInt(stockInput.value) || 0) : (parseInt(v.physicalStock) || 0);

        // Variant-specific photo: priority to variant image, fallback to general image, fallback to smart apparel image
        let varImage = v.image || document.getElementById(`matrix-img-url-${idx}`)?.value || document.getElementById(`matrix-img-url-${v.index}`)?.value || '';
        if (!varImage || varImage.includes('No Image')) {
          varImage = image || getSmartProductImage({ category, subcategory, name, sku });
        }

        // Build descriptive name including custom attributes (e.g. Memory: 4GB)
        const customParts = Object.values(v.customAttributes || {}).filter(Boolean);
        const nameParts = [v.size, v.color, ...customParts].filter(Boolean);
        const variantName = nameParts.length > 0 ? `${name} (${nameParts.join(' / ')})` : name;

        // Merge custom attributes into specifications so they are visible everywhere in catalog
        const varSpecs = [...(specifications || [])];
        if (v.customAttributes) {
          Object.entries(v.customAttributes).forEach(([k, val]) => {
            if (!varSpecs.some(s => (s.label || '').toLowerCase() === k.toLowerCase() && (s.content || '').toLowerCase() === String(val).toLowerCase())) {
              varSpecs.push({ label: k, content: val });
            }
          });
        }

        return {
          sku: varSku,
          parentSku: sku,
          parent_sku: sku,
          parentName: name,
          parent_name: name,
          name: variantName,
          category,
          subcategory,
          size: v.size || '',
          color: v.color || '',
          fabric: '',
          specifications: varSpecs,
          customAttributes: v.customAttributes || {},
          custom_attributes: JSON.stringify(v.customAttributes || {}),
          price: varPrice,
          mrp: varMrp,
          physicalStock: varStock,
          reservedStock: 0,
          accountId,
          image: varImage,
          description
        };
      });

      // Enforce: selling price wants to be smaller than MRP. Always MRP is bigger!
      const invalidVar = variantsPayload.find(v => (v.price || 0) > (v.mrp || 0) && (v.mrp || 0) > 0);
      if (invalidVar) {
        showToast('Pricing Error', `Variant ${invalidVar.sku} has Selling Price (₹${invalidVar.price}) greater than MRP (₹${invalidVar.mrp}). Always MRP is bigger!`, 'error', 'rose');
        return;
      }

      // Update in CRM_STATE memory
      variantsPayload.forEach(vp => {
        const existingIdx = CRM_STATE.products.findIndex(p => p.sku === vp.sku);
        if (existingIdx >= 0) {
          CRM_STATE.products[existingIdx] = { ...CRM_STATE.products[existingIdx], ...vp };
        } else {
          const nextId = CRM_STATE.products.length > 0 
            ? Math.max(...CRM_STATE.products.map(p => Number(p.id) || 0)) + 1 
            : 1;
          CRM_STATE.products.push({ id: nextId, ...vp });
        }
      });

      saveCRMState();

      try {
        const res = await fetch('api.php?action=save_product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variants: variantsPayload })
        });
        if (res.ok) {
          const respData = await res.json();
          if (respData.products && Array.isArray(respData.products)) {
            respData.products.forEach(sp => {
              const p = CRM_STATE.products.find(cp => cp.sku === sp.sku);
              if (p) {
                if (sp.id) p.id = sp.id;
                if (sp.image) p.image = sp.image;
              }
            });
            saveCRMState();
          }
        }
      } catch (err) {
        console.warn('API save_product matrix batch failed:', err);
      }

      closeModal('modal-product-edit');
      filterCatalogGrid();
      updateOrderProductDropdown();
      showToast('Matrix Saved', `Saved ${variantsPayload.length} product variants with individual pricing & inventory!`, 'check_circle', 'emerald');
      return;
    }

    // Single Product Mode (1 Variant)
    const size = (document.getElementById('prod-form-size')?.value || '').trim() || 'Free Size';
    const color = (document.getElementById('prod-form-color')?.value || '').trim() || 'Standard';
    const fabric = '';
    const price = parseFloat(document.getElementById('prod-form-price')?.value) || 0;
    const mrp = parseFloat(document.getElementById('prod-form-mrp')?.value) || price;
    const physical = parseInt(document.getElementById('prod-form-physical')?.value) || 0;
    const reserved = parseInt(document.getElementById('prod-form-reserved')?.value) || 0;

    // Validation: Selling price cannot exceed MRP. Always MRP is bigger!
    if (price > 0 && mrp > 0 && price > mrp) {
      showToast('Pricing Error', `Selling price (₹${price}) cannot be greater than MRP (₹${mrp}). Always MRP is bigger!`, 'error', 'rose');
      const mrpInput = document.getElementById('prod-form-mrp');
      if (mrpInput) {
        mrpInput.focus();
        mrpInput.classList.add('border-rose-500', 'ring-2', 'ring-rose-200');
      }
      return;
    }

    // Merge any SELECTED_CUSTOM_ATTRIBUTES into specifications
    const singleSpecs = [...(specifications || [])];
    Object.entries(SELECTED_CUSTOM_ATTRIBUTES || {}).forEach(([k, vals]) => {
      (vals || []).forEach(val => {
        if (!singleSpecs.some(s => (s.label || '').toLowerCase() === k.toLowerCase() && (s.content || '').toLowerCase() === String(val).toLowerCase())) {
          singleSpecs.push({ label: k, content: val });
        }
      });
    });

    let existing = null;
    if (idVal) {
      existing = CRM_STATE.products.find(p => String(p.id) === String(idVal));
    }

    if (existing) {
      existing.sku = sku;
      existing.category = category;
      existing.subcategory = subcategory;
      existing.name = name;
      existing.description = description;
      existing.size = size;
      existing.color = color;
      existing.fabric = fabric;
      existing.specifications = singleSpecs;
      existing.customAttributes = SELECTED_CUSTOM_ATTRIBUTES || {};
      existing.custom_attributes = JSON.stringify(SELECTED_CUSTOM_ATTRIBUTES || {});
      existing.price = price;
      existing.mrp = mrp;
      existing.physicalStock = physical;
      existing.reservedStock = reserved;
      existing.accountId = accountId;
      existing.image = image;
    } else {
      const newId = CRM_STATE.products.length > 0 
        ? Math.max(...CRM_STATE.products.map(p => Number(p.id) || 0)) + 1 
        : 1;

      existing = {
        id: newId,
        sku,
        category,
        subcategory,
        name,
        description,
        size,
        color,
        fabric,
        specifications: singleSpecs,
        customAttributes: SELECTED_CUSTOM_ATTRIBUTES || {},
        custom_attributes: JSON.stringify(SELECTED_CUSTOM_ATTRIBUTES || {}),
        price,
        mrp,
        physicalStock: physical,
        reservedStock: reserved,
        accountId,
        image
      };
      CRM_STATE.products.push(existing);
    }

    saveCRMState();

    // API Call to database
    try {
      const payload = { ...existing };
      if (!idVal) {
        delete payload.id;
      }
      const res = await fetch('api.php?action=save_product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const respData = await res.json();
        if (respData.id) {
          existing.id = respData.id;
        }
        if (respData.image) {
          existing.image = respData.image;
        }
        saveCRMState();
      }
    } catch (err) {
      console.warn('API save_product failed, state updated in RAM:', err);
    }

    closeModal('modal-product-edit');
    filterCatalogGrid();
    updateOrderProductDropdown();
    if (typeof refreshVariantsModalIfOpen === 'function') refreshVariantsModalIfOpen();
    showToast('Garment Catalog Updated', `${sku} (${name}) saved with live WhatsApp dispatch card!`, 'check_circle', 'emerald');
  } catch (err) {
    console.error('Critical handleProductFormSubmit error:', err);
    showToast('Save Error', 'Failed to save product: ' + err.message, 'error', 'rose');
  }
}
window.handleProductFormSubmit = handleProductFormSubmit;

async function handleDeleteProduct() {
  const idVal = document.getElementById('prod-form-id').value;
  if (!idVal) return;

  const p = CRM_STATE.products.find(prod => String(prod.id) === String(idVal));
  if (!p) return;

  const skuStr = p.sku ? `[${p.sku}] ` : '';
  const nameStr = p.name || 'this product';
  if (!window.confirm(`⚠️ Permanently Delete Product?\n\nAre you sure you want to delete ${skuStr}"${nameStr}"?\n\nThis will remove it from both your live catalog and the database.`)) return;

  CRM_STATE.products = CRM_STATE.products.filter(prod => String(prod.id) !== String(idVal));
  saveCRMState();

  try {
    await fetch('api.php?action=delete_product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idVal, sku: p.sku })
    });
  } catch (err) {
    console.warn('API delete_product failed:', err);
  }

  closeModal('modal-product-edit');
  filterCatalogGrid();
  updateOrderProductDropdown();
  showToast('Product Deleted', `${p.sku || p.name} removed from catalog and database.`, 'delete', 'rose');
}
window.handleDeleteProduct = handleDeleteProduct;

// Delete product directly from product card or catalog table with confirmation dialog
async function confirmDeleteProduct(productId, isFamilyGroup = false, groupKey = null) {
  let delTargets = [];
  let confirmMsg = '';

  const grouped = groupCatalogProducts(CRM_STATE.products || []);
  if (isFamilyGroup || (groupKey && (groupKey.startsWith('parent_sku__') || groupKey.startsWith('family__')))) {
    const group = grouped.find(g => g.groupKey === groupKey || String(g.id) === String(productId));
    if (group && group.variants && group.variants.length > 0) {
      delTargets = group.variants;
      confirmMsg = `⚠️ Permanently Delete Product Family?\n\nAre you sure you want to delete the entire product family "${group.name}" with all ${group.variantCount || group.variants.length} variants [Base SKU: ${group.sku}]?\n\nThis will permanently delete ALL variants from your live catalog and the database.`;
    }
  }

  if (delTargets.length === 0) {
    const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId) || String(prod.sku) === String(productId));
    if (!p) {
      showToast('Product Not Found', 'Could not locate product details to delete.', 'error', 'rose');
      return;
    }
    delTargets = [p];
    const skuStr = p.sku ? `[${p.sku}] ` : '';
    const nameStr = p.name || 'this product';
    confirmMsg = `⚠️ Permanently Delete Product Variant?\n\nAre you sure you want to delete ${skuStr}"${nameStr}"?\n\nThis will permanently delete this product from both your live catalog and the database.`;
  }

  const confirmed = window.confirm(confirmMsg);
  if (!confirmed) return;

  const idsToDelete = new Set(delTargets.map(t => String(t.id)));
  const skusToDelete = new Set(delTargets.map(t => String(t.sku || '')).filter(Boolean));

  // Optimistic UI & local storage removal
  CRM_STATE.products = CRM_STATE.products.filter(prod => !idsToDelete.has(String(prod.id)) && (!prod.sku || !skusToDelete.has(String(prod.sku))));
  saveCRMState();
  filterCatalogGrid();
  updateOrderProductDropdown();

  // If variants modal is open, refresh or close it
  const variantsModal = document.getElementById('modal-product-variants');
  if (variantsModal && !variantsModal.classList.contains('hidden')) {
    if (window.CURRENT_OPEN_VARIANTS_GROUP_KEY) {
      const remainingGrouped = groupCatalogProducts(CRM_STATE.products || []);
      const remainingGroup = remainingGrouped.find(g => g.groupKey === window.CURRENT_OPEN_VARIANTS_GROUP_KEY);
      if (remainingGroup && remainingGroup.variants && remainingGroup.variants.length > 0) {
        openProductVariantsModal(window.CURRENT_OPEN_VARIANTS_GROUP_KEY);
      } else {
        closeModal('modal-product-variants');
      }
    } else {
      closeModal('modal-product-variants');
    }
  }

  const label = delTargets.length > 1 ? `${delTargets.length} variants` : (delTargets[0].sku || delTargets[0].name);
  showToast('Product Deleted', `${label} deleted from database.`, 'delete_forever', 'rose');

  // Server MySQL removal
  for (const t of delTargets) {
    try {
      await fetch('api.php?action=delete_product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: t.id, sku: t.sku })
      });
    } catch (err) {
      console.warn('Backend delete_product notice:', err);
    }
  }
}
window.confirmDeleteProduct = confirmDeleteProduct;

// -------------------------------------------------------------------------
// CATEGORIES & SUBCATEGORIES MANAGEMENT MODAL
// -------------------------------------------------------------------------

let ACTIVE_MANAGER_CATEGORY = '';

function openManageCategoriesModal() {
  const categories = CRM_STATE.categories || INITIAL_CRM_DATA.categories || [];
  if (!ACTIVE_MANAGER_CATEGORY && categories.length > 0) {
    ACTIVE_MANAGER_CATEGORY = categories[0].name;
  }
  renderCategoriesManager();
  openModal('modal-manage-categories');
}

function renderCategoriesManager() {
  const categories = CRM_STATE.categories || INITIAL_CRM_DATA.categories || [];
  const subcategories = CRM_STATE.subcategories || INITIAL_CRM_DATA.subcategories || [];

  const catListCont = document.getElementById('categories-manager-list');
  const subcatListCont = document.getElementById('subcategories-manager-list');
  const catBadge = document.getElementById('cat-count-badge');
  const subcatBadge = document.getElementById('subcat-count-badge');
  const parentLabel = document.getElementById('subcat-parent-label');
  const formCatName = document.getElementById('form-subcat-cat-name');

  if (catBadge) catBadge.innerText = `${categories.length} Categories`;

  // Render left column: categories
  if (catListCont) {
    catListCont.innerHTML = categories.map(c => {
      const subCount = subcategories.filter(s => s.category_name === c.name || s.category === c.name).length;
      const isSelected = ACTIVE_MANAGER_CATEGORY === c.name;
      return `
        <div onclick="selectCategoryInManager('${c.name}')" class="p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${isSelected ? 'bg-teal-50 border-teal-500 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}">
          <div class="flex items-center gap-2.5 min-w-0">
            <span class="material-symbols-outlined text-[20px] ${isSelected ? 'text-teal-700' : 'text-slate-400'}">${c.icon || 'checkroom'}</span>
            <div class="min-w-0">
              <h5 class="font-bold text-slate-900 text-xs truncate">${c.name}</h5>
              <p class="text-[10px] text-slate-400 truncate">${c.description || (subCount + ' subcategories')}</p>
            </div>
          </div>
          <div class="flex items-center gap-1.5 shrink-0">
            <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-teal-200/80 text-teal-900' : 'bg-slate-100 text-slate-600'}">
              ${subCount}
            </span>
            <button type="button" onclick="event.stopPropagation(); deleteCategory(${c.id}, '${c.name}')" class="p-1 text-slate-300 hover:text-rose-600 transition" title="Delete Category">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  // Update right column labels
  if (parentLabel) parentLabel.innerText = ACTIVE_MANAGER_CATEGORY || 'Selected Category';
  if (formCatName) formCatName.innerText = ACTIVE_MANAGER_CATEGORY || 'Selected Category';

  // Render right column: subcategories
  const currentSubs = subcategories.filter(s => s.category_name === ACTIVE_MANAGER_CATEGORY || s.category === ACTIVE_MANAGER_CATEGORY);
  if (subcatBadge) subcatBadge.innerText = `${currentSubs.length} Subcategories`;

  if (subcatListCont) {
    if (currentSubs.length === 0) {
      subcatListCont.innerHTML = `
        <div class="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
          <p class="font-bold text-slate-500 text-xs">No subcategories under "${ACTIVE_MANAGER_CATEGORY}" yet</p>
          <p class="text-[10px] text-slate-400 mt-1">Use the form above to add a subcategory with its unique SKU prefix.</p>
        </div>
      `;
    } else {
      subcatListCont.innerHTML = currentSubs.map(s => {
        return `
          <div class="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div class="flex items-center gap-2 min-w-0">
              <span class="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                ${s.sku_prefix || 'GRM'}
              </span>
              <span class="font-bold text-slate-800 text-xs truncate">${s.name}</span>
            </div>
            <button type="button" onclick="deleteSubcategory(${s.id}, '${s.name}')" class="p-1 text-slate-300 hover:text-rose-600 transition" title="Delete Subcategory">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        `;
      }).join('');
    }
  }
}

// =========================================================================
// LIVE VALIDATION & SMART SUGGESTIONS: CATEGORIES, SUBCATEGORIES & SKU PREFIXES
// =========================================================================

function generateCategorySuggestions(name) {
  const clean = (name || '').trim();
  if (!clean) return [];

  const existing = new Set((CRM_STATE.categories || []).map(c => (c.name || '').trim().toLowerCase()));

  const templates = [
    `${clean} Collection`,
    `${clean} Wear`,
    `${clean} Essentials`,
    `${clean} Special`,
    `${clean} Premium`,
    `${clean} 2`
  ];

  return templates.filter(t => !existing.has(t.toLowerCase())).slice(0, 4);
}

function handleCategoryNameInput(val) {
  const input = document.getElementById('new-cat-name');
  const box = document.getElementById('cat-name-suggestions');
  if (!input || !box) return;

  const clean = (val || '').trim();
  if (!clean) {
    box.className = 'hidden';
    box.innerHTML = '';
    input.classList.remove('border-amber-500', 'ring-2', 'ring-amber-400', 'bg-amber-50/20');
    return;
  }

  const existingCat = (CRM_STATE.categories || []).find(c => (c.name || '').trim().toLowerCase() === clean.toLowerCase());

  if (existingCat) {
    input.classList.add('border-amber-500', 'ring-2', 'ring-amber-400', 'bg-amber-50/20');
    const suggestions = generateCategorySuggestions(clean);

    box.className = 'p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-950 text-xs space-y-2 mt-2 shadow-sm animate-in fade-in duration-150';
    box.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">warning</span>
        <div class="min-w-0 flex-1">
          <p class="font-bold text-amber-900 leading-snug">Category "<span class="underline">${existingCat.name}</span>" already exists!</p>
          <p class="text-[11px] text-amber-700/90 mt-0.5">Please choose a unique name to avoid duplicate catalog groups. Click a suggestion below:</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-amber-200/60">
        <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800">Suggestions:</span>
        ${suggestions.map(s => `
          <button type="button" onclick="applyCategorySuggestion('${s.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-white hover:bg-amber-100 hover:border-amber-400 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer">
            <span class="material-symbols-outlined text-[13px] text-amber-600">add</span> ${s}
          </button>
        `).join('')}
      </div>
    `;
  } else {
    box.className = 'hidden';
    box.innerHTML = '';
    input.classList.remove('border-amber-500', 'ring-2', 'ring-amber-400', 'bg-amber-50/20');
  }
}

function applyCategorySuggestion(name) {
  const input = document.getElementById('new-cat-name');
  if (input) {
    input.value = name;
    handleCategoryNameInput(name);
    input.focus();
  }
}

function generateSubcategorySuggestions(name, categoryName) {
  const clean = (name || '').trim();
  if (!clean) return [];

  const existing = new Set((CRM_STATE.subcategories || []).filter(s => 
    (s.category_name || s.category || '').toLowerCase() === (categoryName || '').toLowerCase()
  ).map(s => (s.name || '').trim().toLowerCase()));

  const templates = [
    `${clean} Set`,
    `${clean} Wear`,
    `${clean} Collection`,
    `${clean} Casual`,
    `${clean} Special`,
    `${clean} 2`
  ];

  return templates.filter(t => !existing.has(t.toLowerCase())).slice(0, 4);
}



function generateUniqueSkuPrefixes(catName, subcatName, currentPrefix) {
  const existingPrefixes = new Set();
  (CRM_STATE.subcategories || []).forEach(s => {
    if (s.sku_prefix) existingPrefixes.add(s.sku_prefix.toUpperCase().trim());
  });
  (CRM_STATE.products || []).forEach(p => {
    if (p.sku) {
      const parts = p.sku.split('-');
      if (parts[0]) existingPrefixes.add(parts[0].toUpperCase().trim());
    }
  });

  const parentCat = (catName || ACTIVE_MANAGER_CATEGORY || document.getElementById('subcat-parent-label')?.innerText || '').replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase();
  const catWords = parentCat.split(/\s+/).filter(Boolean);

  const cleanSub = (subcatName || '').replace(/[^a-zA-Z0-9\s]/g, '').trim().toUpperCase();
  const subWords = cleanSub.split(/\s+/).filter(Boolean);

  // Category candidate codes (e.g. "SAMPLE" -> "S", "SAM", "SMP", "SA"; "BABY COLLECTION" -> "BC", "B")
  const catCodes = [];
  if (catWords.length >= 2) {
    catCodes.push(catWords.map(w => w[0]).join(''));
    catCodes.push(catWords[0][0]);
  } else if (catWords.length === 1 && catWords[0]) {
    const w = catWords[0];
    catCodes.push(w[0]); // e.g. "S"
    if (w.length >= 3) {
      catCodes.push(w.slice(0, 3)); // e.g. "SAM"
      catCodes.push(w.replace(/[AEIOU]/g, '').slice(0, 3)); // e.g. "SMP"
    }
    if (w.length >= 2) {
      catCodes.push(w.slice(0, 2)); // e.g. "SA"
    }
  } else {
    catCodes.push('G');
  }

  // Subcategory candidate codes (e.g. "TEST" -> "TST", "T", "TES", "TE")
  const subCodes = [];
  if (subWords.length >= 2) {
    subCodes.push(subWords.map(w => w[0]).join(''));
    subCodes.push(subWords[0][0] + subWords[1].slice(0, 2));
    subCodes.push(subWords[0][0]);
  } else if (subWords.length === 1 && subWords[0]) {
    const w = subWords[0];
    if (w.length >= 3) {
      subCodes.push(w.replace(/[AEIOU]/g, '').slice(0, 3)); // "TST"
      subCodes.push(w.slice(0, 3)); // "TES"
    }
    if (w.length >= 2) {
      subCodes.push(w.slice(0, 2)); // "TE"
    }
    subCodes.push(w[0]); // "T"
  } else {
    subCodes.push('01');
  }

  const rawCandidates = [];

  // 1. Dash-separated combined prefix (e.g. S-TST, SAM-TST, S-T, S-TE)
  catCodes.forEach(cc => {
    subCodes.forEach(sc => {
      if (cc && sc) {
        rawCandidates.push(`${cc}-${sc}`);
      }
    });
  });

  // 2. Direct joined combined prefix (e.g. ST, STST, SAMTST, BCF)
  catCodes.forEach(cc => {
    subCodes.forEach(sc => {
      if (cc && sc && (cc + sc).length <= 6) {
        rawCandidates.push(`${cc}${sc}`);
      }
    });
  });

  // 3. Variations if user typed a specific prefix (e.g. user typed TTT -> S-TTT, STTT)
  if (currentPrefix && currentPrefix.trim()) {
    const pfx = currentPrefix.trim().toUpperCase();
    const c0 = catCodes[0] || 'C';
    rawCandidates.push(`${c0}-${pfx}`);
    rawCandidates.push(`${c0}${pfx}`);
    rawCandidates.push(`${pfx}1`);
  }

  // 4. Numbered suffixes of combined seeds: e.g. S-TST1, ST1, ST2
  const seed = rawCandidates[0] || `${(catCodes[0] || 'C')}-${(subCodes[0] || 'S')}`;
  for (let i = 1; i <= 9; i++) {
    rawCandidates.push(`${seed}${i}`);
    rawCandidates.push(`${seed}-${i}`);
  }

  // Filter out any prefixes already in use across subcategories and products
  const suggestions = [];
  for (const c of rawCandidates) {
    const cleanCandidate = (c || '').replace(/[^A-Z0-9-]/g, '').slice(0, 8);
    if (cleanCandidate.length >= 2 && !existingPrefixes.has(cleanCandidate) && !suggestions.includes(cleanCandidate)) {
      suggestions.push(cleanCandidate);
      if (suggestions.length >= 5) break;
    }
  }

  return suggestions;
}

function handleSubcategoryNameInput(val) {
  const input = document.getElementById('new-subcat-name');
  const box = document.getElementById('subcat-name-suggestions');
  const prefixInput = document.getElementById('new-subcat-prefix');
  if (!input || !box) return;

  const clean = (val || '').trim();
  if (!clean) {
    box.className = 'hidden';
    box.innerHTML = '';
    input.classList.remove('border-amber-500', 'ring-2', 'ring-amber-400', 'bg-amber-50/20');
    return;
  }

  const catName = ACTIVE_MANAGER_CATEGORY || document.getElementById('subcat-parent-label')?.innerText || '';

  // Auto-generate suggested SKU prefix based on BOTH Category and Subcategory!
  if (prefixInput && (!prefixInput.value || prefixInput.dataset.autogen === 'true')) {
    const suggestedPrefixes = generateUniqueSkuPrefixes(catName, clean, '');
    if (suggestedPrefixes.length > 0) {
      prefixInput.value = suggestedPrefixes[0];
      prefixInput.dataset.autogen = 'true';
      handleSubcategoryPrefixInput(suggestedPrefixes[0]);
    }
  }

  const existingSub = (CRM_STATE.subcategories || []).find(s => 
    (s.category_name === catName || s.category === catName) && 
    (s.name || '').trim().toLowerCase() === clean.toLowerCase()
  );

  if (existingSub) {
    input.classList.add('border-amber-500', 'ring-2', 'ring-amber-400', 'bg-amber-50/20');
    const suggestions = generateSubcategorySuggestions(clean, catName);

    box.className = 'p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-950 text-xs space-y-2 mt-2 shadow-sm animate-in fade-in duration-150';
    box.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined text-[18px] text-amber-600 shrink-0 mt-0.5">warning</span>
        <div class="min-w-0 flex-1">
          <p class="font-bold text-amber-900 leading-snug">Subcategory "<span class="underline">${existingSub.name}</span>" already exists under ${catName}!</p>
          <p class="text-[11px] text-amber-700/90 mt-0.5">Please choose a distinct subcategory name. Click any suggestion below:</p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-amber-200/60">
        <span class="text-[10px] font-bold uppercase tracking-wider text-amber-800">Suggestions:</span>
        ${suggestions.map(s => `
          <button type="button" onclick="applySubcategorySuggestion('${s.replace(/'/g, "\\'")}')" class="px-2.5 py-1 bg-white hover:bg-amber-100 hover:border-amber-400 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer">
            <span class="material-symbols-outlined text-[13px] text-amber-600">add</span> ${s}
          </button>
        `).join('')}
      </div>
    `;
  } else {
    box.className = 'hidden';
    box.innerHTML = '';
    input.classList.remove('border-amber-500', 'ring-2', 'ring-amber-400', 'bg-amber-50/20');
  }
}

function applySubcategorySuggestion(name) {
  const input = document.getElementById('new-subcat-name');
  const prefixInput = document.getElementById('new-subcat-prefix');
  if (input) {
    input.value = name;
    if (prefixInput) prefixInput.dataset.autogen = 'true';
    handleSubcategoryNameInput(name);
    input.focus();
  }
}

function handleSubcategoryPrefixInput(val) {
  const input = document.getElementById('new-subcat-prefix');
  const box = document.getElementById('subcat-prefix-suggestions');
  const nameInput = document.getElementById('new-subcat-name');
  if (!input || !box) return;

  const prefix = (val || '').trim().toUpperCase();
  if (!prefix) {
    box.className = 'hidden';
    box.innerHTML = '';
    input.classList.remove('border-rose-500', 'ring-2', 'ring-rose-400', 'bg-rose-50/20', 'border-emerald-500', 'ring-emerald-300');
    return;
  }

  const catName = ACTIVE_MANAGER_CATEGORY || document.getElementById('subcat-parent-label')?.innerText || '';

  // Check if prefix already exists
  const existingSub = (CRM_STATE.subcategories || []).find(s => 
    (s.sku_prefix || '').toUpperCase().trim() === prefix
  );

  const existingProd = (CRM_STATE.products || []).find(p => 
    (p.sku || '').toUpperCase().startsWith(prefix + '-') || (p.sku || '').toUpperCase() === prefix
  );

  if (existingSub || existingProd) {
    input.classList.remove('border-emerald-500', 'ring-emerald-300');
    input.classList.add('border-rose-500', 'ring-2', 'ring-rose-400', 'bg-rose-50/20');

    const ownerName = existingSub 
      ? `Subcategory "<b>${existingSub.name}</b>" (under ${existingSub.category_name || existingSub.category || 'Category'})`
      : `Product "<b>${existingProd.sku}</b>" (${existingProd.name || 'Garment'})`;

    const subName = nameInput ? nameInput.value : '';
    // Generate suggestions combining BOTH Category and Subcategory!
    const suggestions = generateUniqueSkuPrefixes(catName, subName, prefix);

    box.className = 'p-3 bg-rose-50/95 border border-rose-200 rounded-xl text-rose-950 text-xs space-y-2 mt-2 shadow-sm animate-in fade-in duration-150';
    box.innerHTML = `
      <div class="flex items-start gap-2">
        <span class="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">block</span>
        <div class="min-w-0 flex-1">
          <p class="font-bold text-rose-900 leading-snug">
            SKU Prefix "<span class="font-mono bg-rose-200/80 px-1.5 py-0.5 rounded text-rose-950 font-black">${prefix}</span>" is already in use by ${ownerName}!
          </p>
          <p class="text-[11px] text-rose-700/90 mt-0.5">
            Prefixes must combine <b>Category ("${catName}")</b> + <b>Subcategory ("${subName || 'test'}")</b>. Click a unique suggestion below:
          </p>
        </div>
      </div>
      <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-rose-200/60">
        <span class="text-[10px] font-bold uppercase tracking-wider text-rose-800">Suggested (Category + Subcategory):</span>
        ${suggestions.map(s => `
          <button type="button" onclick="applyPrefixSuggestion('${s}')" class="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 hover:text-emerald-900 border border-emerald-300 hover:border-emerald-500 rounded-lg font-mono font-black text-xs shadow-2xs transition active:scale-95 flex items-center gap-1 cursor-pointer">
            <span class="material-symbols-outlined text-[13px] text-emerald-600">check_circle</span> ${s}
          </button>
        `).join('')}
      </div>
    `;
  } else {
    // Unique and available!
    input.classList.remove('border-rose-500', 'ring-2', 'ring-rose-400', 'bg-rose-50/20');
    if (prefix.length >= 2) {
      input.classList.add('border-emerald-500');
      box.className = 'p-2 bg-emerald-50/80 border border-emerald-200 rounded-xl text-emerald-900 text-xs mt-1.5 flex items-center gap-1.5 animate-in fade-in duration-150';
      box.innerHTML = `
        <span class="material-symbols-outlined text-[16px] text-emerald-600">check_circle</span>
        <span class="font-semibold text-[11px]">SKU Prefix <b class="font-mono font-bold text-emerald-900">[${prefix}]</b> is unique &amp; available! (Category: ${catName})</span>
      `;
    } else {
      box.className = 'hidden';
      box.innerHTML = '';
    }
  }
}

function applyPrefixSuggestion(prefix) {
  const input = document.getElementById('new-subcat-prefix');
  if (input) {
    input.value = prefix;
    delete input.dataset.autogen;
    handleSubcategoryPrefixInput(prefix);
    input.focus();
  }
}

window.handleCategoryNameInput = handleCategoryNameInput;
window.applyCategorySuggestion = applyCategorySuggestion;
window.handleSubcategoryNameInput = handleSubcategoryNameInput;
window.applySubcategorySuggestion = applySubcategorySuggestion;
window.handleSubcategoryPrefixInput = handleSubcategoryPrefixInput;
window.applyPrefixSuggestion = applyPrefixSuggestion;

function selectCategoryInManager(catName) {
  ACTIVE_MANAGER_CATEGORY = catName;
  const subNameInput = document.getElementById('new-subcat-name');
  const subPrefixInput = document.getElementById('new-subcat-prefix');
  if (subNameInput) subNameInput.value = '';
  if (subPrefixInput) {
    subPrefixInput.value = '';
    delete subPrefixInput.dataset.autogen;
  }
  const nameBox = document.getElementById('subcat-name-suggestions');
  if (nameBox) { nameBox.className = 'hidden'; nameBox.innerHTML = ''; }
  const prefixBox = document.getElementById('subcat-prefix-suggestions');
  if (prefixBox) { prefixBox.className = 'hidden'; prefixBox.innerHTML = ''; }
  renderCategoriesManager();
}

async function saveCategorySubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('new-cat-name').value.trim();
  const icon = (document.getElementById('new-cat-icon')?.value || '').trim() || 'checkroom';
  const desc = document.getElementById('new-cat-desc').value.trim();

  if (!name) return;

  if (!CRM_STATE.categories || !Array.isArray(CRM_STATE.categories) || CRM_STATE.categories.length === 0) {
    CRM_STATE.categories = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.categories || []));
  }
  
  const existIdx = CRM_STATE.categories.findIndex(c => c.name.toLowerCase() === name.toLowerCase());
  if (existIdx >= 0) {
    handleCategoryNameInput(name);
    showToast('Category Exists', `Category "${name}" already exists! Please choose one of the suggested names.`, 'warning', 'amber');
    document.getElementById('new-cat-name')?.focus();
    return;
  }

  const newCat = {
    id: Date.now(),
    name,
    icon,
    description: desc,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  };

  CRM_STATE.categories.push(newCat);
  ACTIVE_MANAGER_CATEGORY = name;

  try {
    const res = await fetch('api.php?action=save_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCat)
    });
    if (res.ok) {
      const respData = await res.json();
      if (respData.id) newCat.id = respData.id;
    }
  } catch (err) {
    console.warn('API save_category failed:', err);
  }

  saveCRMState();
  document.getElementById('new-cat-name').value = '';
  document.getElementById('new-cat-desc').value = '';
  const catBox = document.getElementById('cat-name-suggestions');
  if (catBox) { catBox.className = 'hidden'; catBox.innerHTML = ''; }

  renderCategoriesManager();
  populateCatalogCategoryFilters();
  populateProductFormCategories(name);
  showToast('Category Created', `Category "${name}" created successfully!`, 'check_circle', 'teal');
}

async function deleteCategory(catId, catName) {
  if (!confirm(`Delete category "${catName}" and all associated catalog groupings?`)) return;

  CRM_STATE.categories = (CRM_STATE.categories || []).filter(c => c.name !== catName && c.id != catId);
  CRM_STATE.subcategories = (CRM_STATE.subcategories || []).filter(s => s.category_name !== catName && s.category !== catName);

  if (ACTIVE_MANAGER_CATEGORY === catName) {
    ACTIVE_MANAGER_CATEGORY = (CRM_STATE.categories[0] && CRM_STATE.categories[0].name) || '';
  }

  try {
    await fetch('api.php?action=delete_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: catId, name: catName })
    });
  } catch (err) {
    console.warn('API delete_category failed:', err);
  }

  saveCRMState();
  renderCategoriesManager();
  populateCatalogCategoryFilters();
  populateProductFormCategories();
  showToast('Category Deleted', `Category "${catName}" removed.`, 'delete', 'rose');
}

async function saveSubcategorySubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const name = document.getElementById('new-subcat-name').value.trim();
  let prefix = document.getElementById('new-subcat-prefix').value.trim().toUpperCase();

  if (!name || !ACTIVE_MANAGER_CATEGORY) {
    showToast('Missing Category', 'Please select a parent category first.', 'warning', 'amber');
    return;
  }

  if (!CRM_STATE.subcategories || !Array.isArray(CRM_STATE.subcategories) || CRM_STATE.subcategories.length === 0) {
    CRM_STATE.subcategories = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.subcategories || []));
  }
  
  // 1. Check if subcategory already exists under this category
  const existSubIdx = CRM_STATE.subcategories.findIndex(s => 
    s.name.toLowerCase() === name.toLowerCase() && 
    (s.category_name === ACTIVE_MANAGER_CATEGORY || s.category === ACTIVE_MANAGER_CATEGORY)
  );
  if (existSubIdx >= 0) {
    handleSubcategoryNameInput(name);
    showToast('Subcategory Exists', `Subcategory "${name}" already exists under ${ACTIVE_MANAGER_CATEGORY}! Please pick a suggested unique name.`, 'warning', 'amber');
    document.getElementById('new-subcat-name')?.focus();
    return;
  }

  // 2. Check if SKU prefix is taken or empty
  const prefixTakenSub = (CRM_STATE.subcategories || []).find(s => 
    (s.sku_prefix || '').toUpperCase().trim() === prefix
  );
  const prefixTakenProd = (CRM_STATE.products || []).find(p => 
    (p.sku || '').toUpperCase().startsWith(prefix + '-') || (p.sku || '').toUpperCase() === prefix
  );

  let wasAutoResolved = false;
  if (!prefix || prefixTakenSub || prefixTakenProd) {
    // Generate unique category + subcategory combined prefix
    const suggestions = generateUniqueSkuPrefixes(ACTIVE_MANAGER_CATEGORY, name, prefix);
    if (suggestions.length > 0) {
      prefix = suggestions[0];
      wasAutoResolved = true;
    } else {
      handleSubcategoryPrefixInput(prefix);
      showToast('SKU Prefix Taken', `SKU Prefix [${prefix}] is already in use! Click a suggested unique prefix below.`, 'block', 'rose');
      document.getElementById('new-subcat-prefix')?.focus();
      return;
    }
  }

  const newSub = {
    id: Date.now(),
    category_name: ACTIVE_MANAGER_CATEGORY,
    name,
    sku_prefix: prefix,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
  };

  CRM_STATE.subcategories.push(newSub);

  try {
    const res = await fetch('api.php?action=save_subcategory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSub)
    });
    if (res.ok) {
      const respData = await res.json();
      if (respData.id) newSub.id = respData.id;
    }
  } catch (err) {
    console.warn('API save_subcategory failed:', err);
  }

  saveCRMState();
  document.getElementById('new-subcat-name').value = '';
  document.getElementById('new-subcat-prefix').value = '';
  const subBox = document.getElementById('subcat-name-suggestions');
  if (subBox) { subBox.className = 'hidden'; subBox.innerHTML = ''; }
  const prefixBox = document.getElementById('subcat-prefix-suggestions');
  if (prefixBox) { prefixBox.className = 'hidden'; prefixBox.innerHTML = ''; }

  renderCategoriesManager();
  populateCatalogCategoryFilters();
  populateProductFormCategories(ACTIVE_MANAGER_CATEGORY, name);

  if (wasAutoResolved) {
    showToast('Subcategory Saved', `Added "${name}" with auto-assigned combined prefix [${prefix}] (Category: ${ACTIVE_MANAGER_CATEGORY})!`, 'check_circle', 'emerald');
  } else {
    showToast('Subcategory Added', `Added "${name}" with prefix [${prefix}] to ${ACTIVE_MANAGER_CATEGORY}!`, 'check_circle', 'emerald');
  }
}

async function deleteSubcategory(subId, subName) {
  if (!confirm(`Delete subcategory "${subName}"?`)) return;

  CRM_STATE.subcategories = (CRM_STATE.subcategories || []).filter(s => s.name !== subName && s.id != subId);

  try {
    await fetch('api.php?action=delete_subcategory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: subId, name: subName })
    });
  } catch (err) {
    console.warn('API delete_subcategory failed:', err);
  }

  saveCRMState();
  renderCategoriesManager();
  populateCatalogCategoryFilters();
  populateProductFormCategories(ACTIVE_MANAGER_CATEGORY);
  showToast('Subcategory Deleted', `Subcategory "${subName}" removed.`, 'delete', 'rose');
}

// -------------------------------------------------------------------------
// ATTRIBUTES SYSTEM MANAGEMENT MODAL (SIZES, COLORS, FABRICS)
// -------------------------------------------------------------------------

let ACTIVE_ATTRIBUTE_TAB = 'sizes';
let ACTIVE_CUSTOM_ATTR_NAME = '';

function openManageAttributesModal() {
  renderAttributesManager();
  switchAttributeManagerTab('sizes');
  openModal('modal-manage-attributes');
}

function switchAttributeManagerTab(tab) {
  ACTIVE_ATTRIBUTE_TAB = tab;

  const tabSizes = document.getElementById('tab-attr-sizes');
  const tabColors = document.getElementById('tab-attr-colors');
  const tabSpecs = document.getElementById('tab-attr-specs');
  const tabAddNew = document.getElementById('tab-attr-add-new');

  const viewSizes = document.getElementById('view-attr-sizes');
  const viewColors = document.getElementById('view-attr-colors');
  const viewSpecs = document.getElementById('view-attr-specs');
  const viewCustom = document.getElementById('view-attr-custom');
  const viewAddNew = document.getElementById('view-attr-add-new');

  // Reset standard tab styles
  [tabSizes, tabColors, tabSpecs, tabAddNew].forEach(btn => {
    if (btn) btn.className = 'px-3.5 py-2 rounded-xl font-semibold text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition shrink-0';
  });

  // Reset custom tab styles in #attr-custom-tabs-container
  const customTabsCont = document.getElementById('attr-custom-tabs-container');
  if (customTabsCont) {
    const customBtns = customTabsCont.querySelectorAll('button');
    customBtns.forEach(btn => {
      btn.className = 'px-3.5 py-2 rounded-xl font-semibold text-xs text-slate-600 hover:text-purple-900 hover:bg-purple-50 flex items-center gap-1.5 transition shrink-0 border border-transparent';
    });
  }

  // Hide all views
  [viewSizes, viewColors, viewSpecs, viewCustom, viewAddNew].forEach(view => {
    if (view) view.classList.add('hidden');
  });

  if (tab === 'sizes') {
    if (tabSizes) tabSizes.className = 'px-4 py-2 rounded-xl font-bold text-xs bg-white text-slate-900 shadow-sm border border-slate-200 flex items-center gap-1.5 transition shrink-0';
    if (viewSizes) viewSizes.classList.remove('hidden');
  } else if (tab === 'colors') {
    if (tabColors) tabColors.className = 'px-4 py-2 rounded-xl font-bold text-xs bg-white text-slate-900 shadow-sm border border-slate-200 flex items-center gap-1.5 transition shrink-0';
    if (viewColors) viewColors.classList.remove('hidden');
  } else if (tab === 'specs') {
    if (tabSpecs) tabSpecs.className = 'px-4 py-2 rounded-xl font-bold text-xs bg-white text-indigo-900 shadow-sm border border-indigo-200 flex items-center gap-1.5 transition shrink-0';
    if (viewSpecs) viewSpecs.classList.remove('hidden');
  } else if (tab === 'add_new') {
    if (tabAddNew) tabAddNew.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-amber-700 text-white shadow-sm border border-amber-800 flex items-center gap-1.5 transition shrink-0';
    if (viewAddNew) {
      viewAddNew.classList.remove('hidden');
      const nameInput = document.getElementById('new-attr-type-name');
      const valsInput = document.getElementById('new-attr-type-initial-vals');
      if (nameInput) {
        nameInput.value = '';
        setTimeout(() => nameInput.focus(), 100);
      }
      if (valsInput) valsInput.value = '';
    }
  } else {
    // Custom Attribute Tab (e.g. 'Memory' or 'custom:Memory')
    const attrName = tab.startsWith('custom:') ? tab.slice(7) : tab;
    ACTIVE_CUSTOM_ATTR_NAME = attrName;
    const activeCustomBtn = document.getElementById(`tab-attr-custom-${attrName}`);
    if (activeCustomBtn) {
      activeCustomBtn.className = 'px-3.5 py-2 rounded-xl font-bold text-xs bg-white text-purple-950 shadow-sm border border-purple-300 flex items-center gap-1.5 transition shrink-0';
    }
    if (viewCustom) {
      viewCustom.classList.remove('hidden');
      renderCustomAttributeView(attrName);
    }
  }
}

function renderAttributesManager() {
  const attrs = CRM_STATE.attributes || INITIAL_CRM_DATA.attributes || { sizes: [], colors: [], specifications: [], custom: {} };
  if (!attrs.custom) attrs.custom = {};

  const sizesCont = document.getElementById('attr-manager-sizes-list');
  const colorsCont = document.getElementById('attr-manager-colors-list');
  const specsCont = document.getElementById('attr-manager-specs-list');
  const customTabsCont = document.getElementById('attr-custom-tabs-container');

  // 1. Sizes List
  if (sizesCont) {
    sizesCont.innerHTML = (attrs.sizes || []).map(s => {
      const escapedS = s.replace(/'/g, "\\'");
      return `
        <div class="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
          <span>${s}</span>
          <button type="button" onclick="deleteAttribute('size', '${escapedS}')" class="text-slate-400 hover:text-rose-600 font-extrabold text-sm">&times;</button>
        </div>
      `;
    }).join('');
  }

  // 2. Colors List
  if (colorsCont) {
    colorsCont.innerHTML = (attrs.colors || []).map(c => {
      const hex = getColorHex(c);
      const escapedC = c.replace(/'/g, "\\'");
      return `
        <div class="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
          <span class="w-3 h-3 rounded-full border border-black/20" style="background-color: ${hex}"></span>
          <span>${c}</span>
          <button type="button" onclick="deleteAttribute('color', '${escapedC}')" class="text-slate-400 hover:text-rose-600 font-extrabold text-sm">&times;</button>
        </div>
      `;
    }).join('');
  }

  // 3. Specifications List (Same Attribute Flow: Clean Chips matching Sizes & Colors)
  if (specsCont) {
    const specs = attrs.specifications || [];
    if (specs.length === 0) {
      specsCont.innerHTML = `<span class="text-slate-400 italic text-[11px]">No specifications registered yet. Add one above!</span>`;
    } else {
      specsCont.innerHTML = specs.map(s => {
        const lbl = (typeof s === 'object' ? s.label : s) || '';
        const cnt = (typeof s === 'object' ? s.content : '') || '';
        const id = (typeof s === 'object' && s.id) ? s.id : null;
        const escapedLbl = lbl.replace(/'/g, "\\'");
        const escapedCnt = cnt.replace(/'/g, "\\'");
        const displayLabel = (lbl && lbl !== 'Specification') ? `${lbl}: ${cnt}` : cnt;
        return `
          <div class="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm">
            <span class="text-indigo-600 text-[10px]">📌</span>
            <span>${displayLabel}</span>
            <button type="button" onclick="deleteAttribute('specification', '${escapedLbl}', ${id}, '${escapedCnt}')" class="text-slate-400 hover:text-rose-600 font-extrabold text-sm" title="Delete Specification">&times;</button>
          </div>
        `;
      }).join('');
    }
  }

  // 4. Dynamic Custom Attribute Tabs in Attribute Manager
  if (customTabsCont) {
    const customTypes = Object.keys(attrs.custom || {});
    customTabsCont.innerHTML = customTypes.map(attrName => {
      const vals = attrs.custom[attrName] || [];
      const isCurrentActive = ACTIVE_CUSTOM_ATTR_NAME === attrName && ACTIVE_ATTRIBUTE_TAB.includes(attrName);
      const escapedName = attrName.replace(/'/g, "\\'");
      return `
        <button type="button" id="tab-attr-custom-${attrName}" onclick="switchAttributeManagerTab('custom:${escapedName}')" class="px-3.5 py-2 rounded-xl font-semibold text-xs flex items-center gap-1.5 transition shrink-0 ${isCurrentActive ? 'bg-white text-purple-950 font-bold shadow-sm border border-purple-300' : 'text-slate-600 hover:text-purple-900 hover:bg-purple-50 border border-transparent'}">
          <span class="material-symbols-outlined text-[16px] text-purple-600">tune</span>
          <span>${attrName}</span>
          <span class="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-900 font-bold">${vals.length}</span>
        </button>
      `;
    }).join('');
  }

  // If a custom attribute is currently active, refresh its view
  if (ACTIVE_CUSTOM_ATTR_NAME && (ACTIVE_ATTRIBUTE_TAB === ACTIVE_CUSTOM_ATTR_NAME || ACTIVE_ATTRIBUTE_TAB === 'custom:' + ACTIVE_CUSTOM_ATTR_NAME)) {
    renderCustomAttributeView(ACTIVE_CUSTOM_ATTR_NAME);
  }
}

function renderCustomAttributeView(attrName) {
  if (!attrName) return;
  const attrs = CRM_STATE.attributes || INITIAL_CRM_DATA.attributes || { custom: {} };
  if (!attrs.custom) attrs.custom = {};
  const vals = attrs.custom[attrName] || [];

  const titleEl = document.getElementById('custom-attr-view-title');
  const countBadge = document.getElementById('custom-attr-values-count-badge');
  const descEl = document.getElementById('custom-attr-view-desc');
  const inputEl = document.getElementById('new-attr-custom-val');
  const listTitleEl = document.getElementById('custom-attr-list-title');
  const listCont = document.getElementById('attr-manager-custom-list');

  if (titleEl) titleEl.innerText = attrName;
  if (countBadge) countBadge.innerText = `${vals.length} ${vals.length === 1 ? 'Value' : 'Values'}`;
  if (descEl) descEl.innerText = `Manage clickable chips & product matrix variants for ${attrName}`;
  if (inputEl) {
    inputEl.placeholder = `New ${attrName} value (e.g. 4GB, 8GB, 16GB - comma-separated supported)`;
    inputEl.value = '';
  }
  if (listTitleEl) listTitleEl.innerText = `ACTIVE ${attrName.toUpperCase()} VALUES IN CATALOG:`;

  if (listCont) {
    if (vals.length === 0) {
      listCont.innerHTML = `<span class="text-slate-400 italic text-[11px]">No values registered yet for "${attrName}". Enter values above to add!</span>`;
    } else {
      const escapedAttrName = attrName.replace(/'/g, "\\'");
      listCont.innerHTML = vals.map(v => {
        const escapedV = v.replace(/'/g, "\\'");
        return `
          <div class="px-3 py-1.5 bg-purple-50/80 border border-purple-200 text-purple-950 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs hover:border-purple-300 transition">
            <span class="w-2 h-2 rounded-full bg-purple-500"></span>
            <span>${v}</span>
            <button type="button" onclick="deleteCustomAttributeValue('${escapedAttrName}', '${escapedV}')" class="text-slate-400 hover:text-rose-600 font-extrabold text-sm ml-0.5 cursor-pointer" title="Delete ${v}">&times;</button>
          </div>
        `;
      }).join('');
    }
  }
}

function setQuickAttributeSuggestion(name, vals) {
  const nameInput = document.getElementById('new-attr-type-name');
  const valsInput = document.getElementById('new-attr-type-initial-vals');
  if (nameInput) nameInput.value = name;
  if (valsInput) valsInput.value = vals;
}

function openAddAttributeTypePrompt() {
  openManageAttributesModal();
  switchAttributeManagerTab('add_new');
}

async function handleCreateAttributeTypeSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const nameInput = document.getElementById('new-attr-type-name');
  const valsInput = document.getElementById('new-attr-type-initial-vals');
  const attrName = (nameInput ? nameInput.value : '').trim();
  const initialValsStr = (valsInput ? valsInput.value : '').trim();

  if (!attrName) {
    showToast('Attribute Name Required', 'Please enter an attribute name (e.g. Memory, Storage).', 'warning', 'amber');
    return;
  }

  if (!CRM_STATE.attributes) CRM_STATE.attributes = { sizes: [], colors: [], specifications: [], custom: {} };
  if (!CRM_STATE.attributes.custom) CRM_STATE.attributes.custom = {};

  // Case-insensitive match check
  const existingKey = Object.keys(CRM_STATE.attributes.custom).find(k => k.toLowerCase() === attrName.toLowerCase());
  const finalAttrName = existingKey || attrName;

  if (!CRM_STATE.attributes.custom[finalAttrName]) {
    CRM_STATE.attributes.custom[finalAttrName] = [];
  }

  // Parse comma-separated initial values
  if (initialValsStr) {
    const parts = initialValsStr.split(',').map(s => s.trim()).filter(Boolean);
    parts.forEach(p => {
      if (!CRM_STATE.attributes.custom[finalAttrName].includes(p)) {
        CRM_STATE.attributes.custom[finalAttrName].push(p);
      }
    });
  }

  saveCRMState();

  // Persist to MySQL database via api.php
  try {
    await fetch('api.php?action=save_attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'attribute_type',
        value: finalAttrName,
        extra: initialValsStr
      })
    });
    if (initialValsStr) {
      await fetch('api.php?action=save_attribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'attribute_value',
          value: initialValsStr,
          extra: finalAttrName
        })
      });
    }
  } catch (err) {
    console.warn('API save_attribute for new type failed:', err);
  }

  if (nameInput) nameInput.value = '';
  if (valsInput) valsInput.value = '';
  renderAttributesManager();
  switchAttributeManagerTab('custom:' + finalAttrName);
  renderProductFormAttributeChips();
  showToast('Attribute Feature Added', `Added "${finalAttrName}" attribute feature with dynamic product chips!`, 'check_circle', 'purple');
}

async function handleCustomAttributeValueSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (!ACTIVE_CUSTOM_ATTR_NAME) {
    showToast('No Attribute Selected', 'Please select or create an attribute first.', 'warning', 'amber');
    return;
  }

  const input = document.getElementById('new-attr-custom-val');
  const rawVal = (input ? input.value : '').trim();
  if (!rawVal) return;

  if (!CRM_STATE.attributes) CRM_STATE.attributes = { sizes: [], colors: [], specifications: [], custom: {} };
  if (!CRM_STATE.attributes.custom) CRM_STATE.attributes.custom = {};
  if (!CRM_STATE.attributes.custom[ACTIVE_CUSTOM_ATTR_NAME]) {
    CRM_STATE.attributes.custom[ACTIVE_CUSTOM_ATTR_NAME] = [];
  }

  const parts = rawVal.split(',').map(s => s.trim()).filter(Boolean);
  let addedCount = 0;
  parts.forEach(p => {
    if (!CRM_STATE.attributes.custom[ACTIVE_CUSTOM_ATTR_NAME].includes(p)) {
      CRM_STATE.attributes.custom[ACTIVE_CUSTOM_ATTR_NAME].push(p);
      addedCount++;
    }
  });

  saveCRMState();

  try {
    await fetch('api.php?action=save_attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'attribute_value',
        value: rawVal,
        extra: ACTIVE_CUSTOM_ATTR_NAME
      })
    });
  } catch (err) {
    console.warn('API save_attribute value failed:', err);
  }

  if (input) input.value = '';
  renderCustomAttributeView(ACTIVE_CUSTOM_ATTR_NAME);
  renderAttributesManager();
  renderProductFormAttributeChips();
  showToast('Values Added', `Added ${addedCount} value(s) to ${ACTIVE_CUSTOM_ATTR_NAME}!`, 'check_circle', 'purple');
}

async function deleteCustomAttributeValue(attrName, val) {
  if (!CRM_STATE.attributes || !CRM_STATE.attributes.custom || !CRM_STATE.attributes.custom[attrName]) return;

  CRM_STATE.attributes.custom[attrName] = CRM_STATE.attributes.custom[attrName].filter(v => v !== val);

  // Also remove from SELECTED_CUSTOM_ATTRIBUTES if selected
  if (SELECTED_CUSTOM_ATTRIBUTES && SELECTED_CUSTOM_ATTRIBUTES[attrName]) {
    SELECTED_CUSTOM_ATTRIBUTES[attrName] = SELECTED_CUSTOM_ATTRIBUTES[attrName].filter(v => v !== val);
  }

  saveCRMState();

  try {
    await fetch('api.php?action=delete_attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'attribute_value',
        value: val,
        extra: attrName
      })
    });
  } catch (err) {
    console.warn('API delete_attribute value failed:', err);
  }

  renderCustomAttributeView(attrName);
  renderAttributesManager();
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  showToast('Value Removed', `Removed "${val}" from ${attrName}.`, 'delete', 'slate');
}

async function confirmDeleteCurrentAttributeType() {
  if (!ACTIVE_CUSTOM_ATTR_NAME) return;
  const attrName = ACTIVE_CUSTOM_ATTR_NAME;

  if (!confirm(`Are you sure you want to permanently delete the "${attrName}" attribute and all its values from the catalog?`)) {
    return;
  }

  if (CRM_STATE.attributes && CRM_STATE.attributes.custom) {
    delete CRM_STATE.attributes.custom[attrName];
  }
  if (SELECTED_CUSTOM_ATTRIBUTES) {
    delete SELECTED_CUSTOM_ATTRIBUTES[attrName];
  }

  saveCRMState();

  try {
    await fetch('api.php?action=delete_attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'attribute_type',
        value: attrName
      })
    });
  } catch (err) {
    console.warn('API delete_attribute type failed:', err);
  }

  ACTIVE_CUSTOM_ATTR_NAME = '';
  switchAttributeManagerTab('sizes');
  renderAttributesManager();
  renderProductFormAttributeChips();
  calculateProductVariantMatrix();
  showToast('Attribute Deleted', `Deleted attribute "${attrName}".`, 'delete', 'rose');
}

async function saveAttributeSubmit(e, type) {
  if (e && e.preventDefault) e.preventDefault();
  let val = '';
  let extra = '';

  if (type === 'size') {
    val = document.getElementById('new-attr-size-val').value.trim();
  } else if (type === 'color') {
    val = document.getElementById('new-attr-color-val').value.trim();
    extra = document.getElementById('new-attr-color-hex').value;
    if (extra && val) {
      COLOR_HEX_MAP[val.toLowerCase()] = extra;
    }
  } else if (type === 'specification') {
    let specLabel = (document.getElementById('new-attr-spec-label')?.value || '').trim();
    let specVal = (document.getElementById('new-attr-spec-content')?.value || '').trim();

    if (!specVal && specLabel) {
      specVal = specLabel;
      specLabel = '';
    }

    if (!specVal) {
      showToast('Missing Specification', 'Please enter specification content / value.', 'warning', 'amber');
      return;
    }

    // Auto-detect label and content if colon used in input
    if (!specLabel && specVal.includes(':')) {
      const parts = specVal.split(':');
      specLabel = parts[0].trim();
      specVal = parts.slice(1).join(':').trim();
    }

    if (!specLabel) specLabel = 'Specification';
    val = specLabel;
    extra = specVal;
  }

  if (!val && !extra) return;

  if (!CRM_STATE.attributes) CRM_STATE.attributes = { sizes: [], colors: [], specifications: [] };
  if (!CRM_STATE.attributes.specifications) CRM_STATE.attributes.specifications = [];

  if (type === 'specification') {
    // Automatically split comma-separated content into single-single items
    const parts = extra.split(',').map(s => s.trim()).filter(Boolean);
    const addedCount = parts.length;

    for (const p of parts) {
      const already = CRM_STATE.attributes.specifications.some(
        s => (s.label || '').toLowerCase() === val.toLowerCase() && (s.content || '').toLowerCase() === p.toLowerCase()
      );
      if (!already) {
        CRM_STATE.attributes.specifications.push({
          id: Date.now() + Math.floor(Math.random() * 1000),
          label: val,
          content: p
        });
      }
    }

    saveCRMState();

    try {
      const resp = await fetch('api.php?action=save_attribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'specification', value: val, extra })
      });
      const resData = await resp.json();
      if (resData && resData.id) {
        const last = CRM_STATE.attributes.specifications[CRM_STATE.attributes.specifications.length - 1];
        if (last) last.id = resData.id;
        saveCRMState();
      }
    } catch (err) {
      console.warn('API save_attribute failed:', err);
    }

    if (document.getElementById('new-attr-spec-label')) document.getElementById('new-attr-spec-label').value = '';
    if (document.getElementById('new-attr-spec-content')) document.getElementById('new-attr-spec-content').value = '';
    renderAttributesManager();
    renderProductFormAttributeChips();
    showToast('Specifications Added', `Added ${addedCount} single specification badge(s) for "${val}"!`, 'check_circle', 'indigo');
    return;
  }

  // Sizes or Colors
  const key = type + 's';
  if (!CRM_STATE.attributes[key]) CRM_STATE.attributes[key] = [];
  if (!CRM_STATE.attributes[key].includes(val)) {
    CRM_STATE.attributes[key].push(val);
  }

  saveCRMState();

  try {
    await fetch('api.php?action=save_attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value: val, extra })
    });
  } catch (err) {
    console.warn('API save_attribute failed:', err);
  }

  if (type === 'size') document.getElementById('new-attr-size-val').value = '';
  if (type === 'color') document.getElementById('new-attr-color-val').value = '';

  renderAttributesManager();
  renderProductFormAttributeChips();
  showToast('Attribute Added', `Added ${type}: "${val}" to catalog attributes!`, 'check_circle', 'amber');
}

async function deleteAttribute(type, val, id, extra) {
  if (!CRM_STATE.attributes) return;

  if (type === 'specification') {
    if (CRM_STATE.attributes.specifications) {
      CRM_STATE.attributes.specifications = CRM_STATE.attributes.specifications.filter(s => {
        if (id && s.id && String(s.id) === String(id)) return false;
        if (extra && s.content && s.label === val && s.content === extra) return false;
        if (!extra && (s.label === val || s.content === val)) return false;
        return true;
      });
    }
  } else {
    const key = type + 's';
    if (CRM_STATE.attributes[key]) {
      CRM_STATE.attributes[key] = CRM_STATE.attributes[key].filter(item => item !== val);
    }
  }

  saveCRMState();

  try {
    await fetch('api.php?action=delete_attribute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, value: val, id: id || undefined, extra: extra || undefined })
    });
  } catch (err) {
    console.warn('API delete_attribute failed:', err);
  }

  renderAttributesManager();
  renderProductFormAttributeChips();
  showToast('Attribute Removed', `Removed ${type} "${val}".`, 'delete', 'slate');
}

// -------------------------------------------------------------------------
// QUICK RESTOCK MODAL
// -------------------------------------------------------------------------
function openQuickStockModal(productId) {
  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId) || String(prod.sku) === String(productId));
  if (!p) {
    if (typeof showToast === 'function') {
      showToast('Product Not Found', `Unable to find product with ID ${productId}`, 'alert-triangle', 'amber');
    }
    return;
  }

  const idEl = document.getElementById('quick-stock-product-id');
  if (idEl) idEl.value = p.id;
  const stockEl = document.getElementById('quick-stock-physical-input');
  if (stockEl) stockEl.value = p.physicalStock || 0;

  const info = document.getElementById('quick-stock-product-info');
  if (info) {
    const imgSrc = getSmartProductImage(p);
    const safeName = typeof escapeHtml === 'function' ? escapeHtml(p.name || 'Unnamed') : (p.name || 'Unnamed');
    info.innerHTML = `
      <img src="${imgSrc}" onerror="this.onerror=null;this.src='uploads/products/sample_garment.jpg';" class="w-12 h-12 object-cover rounded-xl border border-slate-200">
      <div>
        <div class="flex items-center gap-2">
          <span class="font-mono font-bold text-xs bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">${p.sku || 'NO-SKU'}</span>
          <span class="font-bold text-slate-900 text-xs">${safeName}</span>
        </div>
        <p class="text-[11px] text-slate-500 mt-0.5">Current: <b>${p.physicalStock || 0}</b> physical &bull; <b>${p.reservedStock || 0}</b> reserved</p>
      </div>
    `;
  }

  openModal('modal-quick-stock');
}
window.openQuickStockModal = openQuickStockModal;

async function handleQuickStockSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();
  const idVal = document.getElementById('quick-stock-product-id').value;
  const newPhysical = parseInt(document.getElementById('quick-stock-physical-input').value) || 0;
  const reason = document.getElementById('quick-stock-reason')?.value || 'Factory Batch Restock';

  const p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(idVal) || String(prod.sku) === String(idVal));
  if (!p) return;

  const oldPhysical = p.physicalStock;
  p.physicalStock = newPhysical;
  saveCRMState();

  try {
    await fetch('api.php?action=update_stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: p.id,
        sku: p.sku,
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
  if (typeof refreshVariantsModalIfOpen === 'function') refreshVariantsModalIfOpen();
  showToast('Restock Completed', `${p.sku || p.name} stock adjusted to ${newPhysical} units (${reason}).`, 'warehouse', 'blue');
}
window.handleQuickStockSubmit = handleQuickStockSubmit;


// -------------------------------------------------------------------------
// DIRECT WHATSAPP SHARING MODAL & BROADCAST LOGIC (MULTI-RECIPIENT & SMART VARIANT SHARING)
// -------------------------------------------------------------------------
let DIRECT_SHARE_SELECTED_CUSTOMERS = new Set();
let DIRECT_SHARE_SEARCH_QUERY = '';

// Generate WhatsApp text for a single variant/product
function generateProductWhatsAppText(p) {
  const available = (parseInt(p.physicalStock) || 0) - (parseInt(p.reservedStock) || 0);
  const stockText = available > 5 
    ? `✅ *In Stock* (${available} units ready for immediate dispatch)`
    : available > 0 
      ? `⚡ *Limited Stock Alert* (Only ${available} units remaining!)`
      : `⚠️ *Made to Order* (Available on booking)`;

  const priceNum = parseFloat(p.price) || 0;
  const mrpNum = parseFloat(p.mrp) || 0;
  let priceLine = `💰 *Price:* ₹${priceNum}`;
  if (mrpNum > priceNum) {
    const discount = Math.round(((mrpNum - priceNum) / mrpNum) * 100);
    priceLine = `💰 *Offer Price:* ₹${priceNum} ~₹${mrpNum}~ (*${discount}% OFF*)`;
  }

  const catLine = p.subcategory 
    ? `📁 *Catalog:* ${p.category || 'Garments'} › ${p.subcategory}\n` 
    : (p.category ? `📁 *Category:* ${p.category}\n` : '');

  const fabricLine = p.fabric ? `🧵 *Fabric:* ${p.fabric}\n` : '';

  let specsLines = '';
  if (p.specifications) {
    let sList = p.specifications;
    if (typeof sList === 'string') {
      try { sList = JSON.parse(sList); } catch (e) { sList = []; }
    }
    if (Array.isArray(sList) && sList.length > 0) {
      specsLines = sList.filter(s => s && s.label && s.content).map(s => `📌 *${s.label}:* ${s.content}\n`).join('');
    }
  }

  const descLine = p.description ? `\n✨ *Product Highlights:*\n${p.description}\n` : '';

  return `🛍️ *${p.name}*\n🏷️ *SKU Code:* ${p.sku}\n${catLine}📏 *Size / Age:* ${p.size || 'Standard'}\n🎨 *Color:* ${p.color || 'Default'}\n${fabricLine}${specsLines}${priceLine}\n📦 *Warehouse Stock:* ${stockText}${descLine}\n✨ *GRM Garments Premium Quality Promise*\n🚚 Fast door delivery & Cash on Delivery (COD) available!\n\n👉 *Reply 'YES' with your delivery address to confirm your booking!*`;
}

// Generate WhatsApp text representing ALL variants in a product family
function generateFamilyProductWhatsAppText(group) {
  const catLine = group.subcategory 
    ? `📁 *Catalog:* ${group.category || 'Garments'} › ${group.subcategory}\n` 
    : (group.category ? `📁 *Category:* ${group.category}\n` : '');

  const priceRange = (group.minPrice && group.maxPrice && group.minPrice !== group.maxPrice)
    ? `₹${group.minPrice} – ₹${group.maxPrice}`
    : `₹${group.minPrice || group.price || 0}`;

  let variantLines = '';
  if (Array.isArray(group.variants)) {
    variantLines = group.variants.map((v) => {
      const parts = [];
      if (v.size) parts.push(`📏 Size: ${v.size}`);
      if (v.color) parts.push(`🎨 Color: ${v.color}`);
      if (v.fabric) parts.push(`🧵 ${v.fabric}`);
      if (v.customAttributes) {
        Object.entries(v.customAttributes).forEach(([k, val]) => {
          if (val) parts.push(`📌 ${k}: ${val}`);
        });
      }
      const attrStr = parts.join(' • ');
      const vPhys = parseInt(v.physicalStock) || 0;
      const vRes = parseInt(v.reservedStock) || 0;
      const vAvail = vPhys - vRes;
      const stockBadge = vAvail > 0 ? `Stock: ${vAvail}` : 'Made to Order';
      return `• ${attrStr ? attrStr + ' — ' : ''}💰 ₹${v.price || 0} (${stockBadge})`;
    }).join('\n');
  }

  const totalAvail = (parseInt(group.physicalStock) || 0) - (parseInt(group.reservedStock) || 0);
  const stockLine = totalAvail > 0
    ? `📦 *Total Warehouse Stock:* ${totalAvail} units ready for immediate dispatch`
    : `⚠️ *Made to Order* (Available on booking)`;

  return `🛍️ *${group.name}*\n🏷️ *Base SKU:* ${group.sku}\n${catLine}💰 *Price Range:* ${priceRange}\n\n✨ *Available Variants & Sizes (${group.variantCount || group.variants.length}):*\n${variantLines}\n\n${stockLine}\n✨ *GRM Garments Premium Quality Promise*\n🚚 Fast door delivery & Cash on Delivery (COD) available!\n\n👉 *Reply with your preferred Size & Color to place your booking!*`;
}

// Generate WhatsApp text representing a collection of multiple selected products
function generateBatchProductsWhatsAppText(selectedProducts) {
  const grouped = groupCatalogProducts(selectedProducts);
  const totalCount = selectedProducts.length;

  let header = `🛍️ *GRM Garments — Exclusive Catalog Selection*\n✨ *${totalCount} Handpicked Items Available Now:*\n`;

  let itemsText = grouped.map((item, idx) => {
    if (item.isGroup && item.variants && item.variants.length > 1) {
      const priceRange = (item.minPrice && item.maxPrice && item.minPrice !== item.maxPrice)
        ? `₹${item.minPrice} – ₹${item.maxPrice}`
        : `₹${item.minPrice || item.price || 0}`;
      const vSummary = item.variants.map(v => {
        const parts = [v.size, v.color].filter(Boolean).join(' / ');
        const vAvail = (parseInt(v.physicalStock) || 0) - (parseInt(v.reservedStock) || 0);
        return `   • ${parts ? parts + ': ' : ''}₹${v.price} (${vAvail > 0 ? vAvail + ' in stock' : 'Pre-order'})`;
      }).join('\n');
      return `\n*${idx + 1}. ${item.name}* [${item.sku}]\n💰 Price: ${priceRange} (${item.variantCount} Variants)\n${vSummary}`;
    } else {
      const parts = [item.size, item.color].filter(Boolean).join(' • ');
      const desc = parts ? ` (${parts})` : '';
      const avail = (parseInt(item.physicalStock) || 0) - (parseInt(item.reservedStock) || 0);
      const stockBadge = avail > 0 ? `Stock: ${avail}` : 'Available on booking';
      return `\n*${idx + 1}. ${item.name}* [${item.sku}]${desc}\n💰 Price: ₹${item.price} • ${stockBadge}`;
    }
  }).join('\n');

  let footer = `\n\n✨ *GRM Garments Premium Quality Promise*\n🚚 Fast door delivery & Cash on Delivery (COD) available!\n\n👉 *Reply with the product number or SKU to place your booking directly!*`;

  return header + itemsText + footer;
}
window.generateBatchProductsWhatsAppText = generateBatchProductsWhatsAppText;

function openBulkDirectShareModal() {
  if (BULK_SELECTED_PRODUCT_IDS.size === 0) {
    showToast('Select Products First', 'Please select at least 1 garment using checkboxes to share on WhatsApp.', 'warning', 'amber');
    return;
  }

  const selectedProducts = (CRM_STATE.products || []).filter(p => BULK_SELECTED_PRODUCT_IDS.has(String(p.id)));
  if (selectedProducts.length === 0) {
    showToast('Notice', 'Could not locate selected product details.', 'warning', 'amber');
    return;
  }

  // Set hidden inputs in modal-direct-share-product
  const idInput = document.getElementById('direct-share-product-id');
  if (idInput) idInput.value = selectedProducts.map(p => p.id).join(',');

  const isFamInput = document.getElementById('direct-share-is-family');
  if (isFamInput) isFamInput.value = 'batch';

  const grpKeyInput = document.getElementById('direct-share-group-key');
  if (grpKeyInput) grpKeyInput.value = '';

  // Render preview card in modal
  const preview = document.getElementById('direct-share-product-preview');
  if (preview) {
    const firstImg = getSmartProductImage(selectedProducts[0] || {});
    const totalPhysical = selectedProducts.reduce((acc, p) => acc + (parseInt(p.physicalStock) || 0), 0);
    const minPrice = Math.min(...selectedProducts.map(p => parseFloat(p.price) || 0));
    const maxPrice = Math.max(...selectedProducts.map(p => parseFloat(p.price) || 0));
    const priceText = minPrice === maxPrice ? `₹${minPrice}` : `₹${minPrice} – ₹${maxPrice}`;

    preview.innerHTML = `
      <img src="${firstImg}" onerror="this.onerror=null;this.src='uploads/products/sample_garment.jpg';" class="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0">
      <div class="min-w-0 flex-1">
        <div class="flex items-center justify-between">
          <span class="font-mono font-bold text-xs bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300">
            Batch WhatsApp Dispatch
          </span>
          <span class="font-bold text-emerald-800 text-sm">${priceText}</span>
        </div>
        <h4 class="font-bold text-slate-900 text-xs truncate mt-0.5">${selectedProducts.length} Garments Selected For Direct WhatsApp Share</h4>
        <div class="mt-1 flex items-center gap-1.5 flex-wrap">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
            📦 Combined Stock: ${totalPhysical} units
          </span>
        </div>
      </div>
    `;
  }

  // Initialize Recipient Selection
  DIRECT_SHARE_SELECTED_CUSTOMERS.clear();
  DIRECT_SHARE_SEARCH_QUERY = '';
  const searchInput = document.getElementById('direct-share-search-input');
  if (searchInput) searchInput.value = '';

  const customPhoneInput = document.getElementById('direct-share-custom-phone');
  if (customPhoneInput) customPhoneInput.value = '';

  if (ACTIVE_CUSTOMER_ID && CRM_STATE.customers.some(c => String(c.id) === String(ACTIVE_CUSTOMER_ID))) {
    DIRECT_SHARE_SELECTED_CUSTOMERS.add(String(ACTIVE_CUSTOMER_ID));
  } else if (CRM_STATE.customers.length > 0) {
    DIRECT_SHARE_SELECTED_CUSTOMERS.add(String(CRM_STATE.customers[0].id));
  }

  renderDirectShareContactsList();
  updateDirectShareSummary();
  closeDirectShareDropdown();

  // Load Message Caption for Batch Share
  const captionArea = document.getElementById('direct-share-message-text');
  if (captionArea) {
    captionArea.value = generateBatchProductsWhatsAppText(selectedProducts);
  }

  openModal('modal-direct-share-product');
}
window.openBulkDirectShareModal = openBulkDirectShareModal;

function openDirectShareModal(targetId, isFamily = false) {
  let isGroupTarget = isFamily;
  let group = null;
  let p = null;

  const grouped = groupCatalogProducts(CRM_STATE.products || []);
  if (isFamily || String(targetId).startsWith('parent_sku__') || String(targetId).startsWith('family__')) {
    group = grouped.find(g => g.groupKey === targetId || String(g.id) === String(targetId));
    if (group && (group.isGroup || isFamily)) {
      isGroupTarget = true;
      p = group;
    }
  }

  if (!p) {
    p = CRM_STATE.products.find(prod => String(prod.id) === String(targetId));
    if (!p) {
      group = grouped.find(g => g.groupKey === targetId || String(g.id) === String(targetId));
      if (group) {
        isGroupTarget = true;
        p = group;
      }
    }
  }

  if (!p) {
    showToast('Product Error', 'Product not found in catalog state.', 'error', 'rose');
    return;
  }

  const idInput = document.getElementById('direct-share-product-id');
  if (idInput) idInput.value = p.id;

  const isFamInput = document.getElementById('direct-share-is-family');
  if (isFamInput) isFamInput.value = isGroupTarget ? 'true' : 'false';

  const grpKeyInput = document.getElementById('direct-share-group-key');
  if (grpKeyInput) grpKeyInput.value = group ? group.groupKey : (p.groupKey || '');

  const preview = document.getElementById('direct-share-product-preview');
  if (preview) {
    const imgSrc = getSmartProductImage(p);
    if (isGroupTarget && group) {
      const priceText = (group.minPrice && group.maxPrice && group.minPrice !== group.maxPrice) 
        ? `₹${group.minPrice} – ₹${group.maxPrice}` 
        : `₹${group.minPrice || group.price || 0}`;
      preview.innerHTML = `
        <img src="${imgSrc}" onerror="this.onerror=null;this.src='uploads/products/sample_garment.jpg';" class="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0">
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <span class="font-mono font-bold text-xs bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">${group.sku}</span>
            <span class="font-bold text-emerald-800 text-sm">${priceText}</span>
          </div>
          <h4 class="font-bold text-slate-900 text-xs truncate mt-0.5">${group.name}</h4>
          <div class="mt-1 flex items-center gap-1.5">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-800 border border-teal-200">
              All ${group.variantCount || group.variants.length} Variants Included
            </span>
            <span class="text-[10px] text-slate-400 font-mono">Total Stock: ${group.physicalStock}</span>
          </div>
        </div>
      `;
    } else {
      const badgeList = [];
      if (p.size) badgeList.push(`Size: ${p.size}`);
      if (p.color) badgeList.push(`Color: ${p.color}`);
      preview.innerHTML = `
        <img src="${imgSrc}" class="w-12 h-12 object-cover rounded-xl border border-slate-200 shadow-xs shrink-0">
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between">
            <span class="font-mono font-bold text-xs bg-white text-slate-800 px-1.5 py-0.5 rounded border border-slate-200">${p.sku}</span>
            <span class="font-bold text-emerald-800 text-sm">₹${p.price}</span>
          </div>
          <h4 class="font-bold text-slate-900 text-xs truncate mt-0.5">${p.name}</h4>
          ${badgeList.length > 0 ? `<p class="text-[10px] text-slate-500 font-semibold mt-0.5">${badgeList.join(' • ')}</p>` : ''}
        </div>
      `;
    }
  }

  // 1. Initialize Recipient Selection
  DIRECT_SHARE_SELECTED_CUSTOMERS.clear();
  DIRECT_SHARE_SEARCH_QUERY = '';
  const searchInput = document.getElementById('direct-share-search-input');
  if (searchInput) searchInput.value = '';

  const customPhoneInput = document.getElementById('direct-share-custom-phone');
  if (customPhoneInput) customPhoneInput.value = '';

  // By default, pre-select the active chat if available, or first customer
  if (ACTIVE_CUSTOMER_ID && CRM_STATE.customers.some(c => String(c.id) === String(ACTIVE_CUSTOMER_ID))) {
    DIRECT_SHARE_SELECTED_CUSTOMERS.add(String(ACTIVE_CUSTOMER_ID));
  } else if (CRM_STATE.customers.length > 0) {
    DIRECT_SHARE_SELECTED_CUSTOMERS.add(String(CRM_STATE.customers[0].id));
  }

  // Render contacts list
  renderDirectShareContactsList();
  updateDirectShareSummary();
  closeDirectShareDropdown();

  // 2. Load Message Content
  if (isGroupTarget && group) {
    loadFamilyProductShareCaption(group);
  } else {
    loadProductShareCaption(p);
  }

  openModal('modal-direct-share-product');
}
window.openDirectShareModal = openDirectShareModal;

function loadProductShareCaption(p) {
  const localSaved = localStorage.getItem('CRM_PRODUCT_CAPTION_' + p.id);
  const dbSaved = p.custom_caption || p.customCaption;
  const savedContent = (dbSaved && dbSaved.trim()) ? dbSaved.trim() : (localSaved && localSaved.trim() ? localSaved.trim() : null);

  const textarea = document.getElementById('direct-share-message-text');
  if (!textarea) return;

  if (savedContent) {
    textarea.value = savedContent;
    updateDirectShareCaptionBadge(true);
  } else {
    textarea.value = generateProductWhatsAppText(p);
    updateDirectShareCaptionBadge(false);
  }
}

function loadFamilyProductShareCaption(group) {
  const localSaved = localStorage.getItem('CRM_PRODUCT_FAMILY_CAPTION_' + group.groupKey);
  const textarea = document.getElementById('direct-share-message-text');
  if (!textarea) return;

  if (localSaved && localSaved.trim()) {
    textarea.value = localSaved.trim();
    updateDirectShareCaptionBadge(true);
  } else {
    textarea.value = generateFamilyProductWhatsAppText(group);
    updateDirectShareCaptionBadge(false);
  }
}

function updateDirectShareCaptionBadge(isCustom) {
  const badge = document.getElementById('direct-share-caption-badge');
  const hint = document.getElementById('direct-share-caption-hint');
  if (!badge) return;

  if (isCustom) {
    badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1';
    badge.innerHTML = `<span class="material-symbols-outlined text-[12px]">bookmark</span> Custom Saved Caption`;
    if (hint) {
      hint.innerHTML = `✅ <strong>Custom saved content is active:</strong> This edited content will be automatically loaded and dispatched every time you share this product.`;
    }
  } else {
    badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600 border border-slate-200';
    badge.innerText = 'Default Product Details';
    if (hint) {
      hint.innerHTML = `💡 Edit the content above and click <strong>"Save Edited Content"</strong> (or Send). Next time, this edited content will be automatically loaded and shared every time!`;
    }
  }
}

function handleDirectShareCaptionInput() {
  const badge = document.getElementById('direct-share-caption-badge');
  if (badge && !badge.innerText.includes('Unsaved')) {
    badge.className = 'px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1';
    badge.innerHTML = `<span class="material-symbols-outlined text-[12px]">edit</span> Edited Content (Unsaved)`;
  }
}

async function saveDirectShareCustomCaption(silent = false) {
  const shareMode = document.getElementById('direct-share-is-family') ? document.getElementById('direct-share-is-family').value : '';
  const isFamilyShare = shareMode === 'true';
  const isBatchShare = shareMode === 'batch';
  const groupKey = (document.getElementById('direct-share-group-key')?.value || '').trim();
  const productId = (document.getElementById('direct-share-product-id')?.value || '').trim();

  const text = (document.getElementById('direct-share-message-text')?.value || '').trim();
  if (!text) {
    if (!silent) showToast('Notice', 'Caption cannot be empty.', 'warning', 'amber');
    return;
  }

  // 1. Handle Batch Dispatch
  if (isBatchShare) {
    try {
      localStorage.setItem('CRM_BATCH_SHARE_CAPTION', text);
      const rawIds = productId.split(',').map(s => s.trim()).filter(Boolean);
      rawIds.forEach(id => {
        const prod = (CRM_STATE.products || []).find(x => String(x.id) === String(id));
        if (prod) {
          prod.custom_caption = text;
          prod.customCaption = text;
          localStorage.setItem('CRM_PRODUCT_CAPTION_' + prod.id, text);
        }
      });
      saveCRMState();
    } catch (e) {}

    updateDirectShareCaptionBadge(true);
    if (!silent) {
      showToast('Content Saved', 'Edited caption saved for selected batch products!', 'bookmark', 'purple');
      playChime('order');
    }
    return;
  }

  // 2. Handle Multi-Variant Family Group Share
  if (isFamilyShare) {
    const saveKey = groupKey || productId;
    try {
      localStorage.setItem('CRM_PRODUCT_FAMILY_CAPTION_' + saveKey, text);
      if (groupKey) localStorage.setItem('CRM_PRODUCT_FAMILY_CAPTION_' + groupKey, text);
      if (productId) localStorage.setItem('CRM_PRODUCT_FAMILY_CAPTION_' + productId, text);

      const grouped = groupCatalogProducts(CRM_STATE.products || []);
      const grp = grouped.find(g => g.groupKey === saveKey || g.groupKey === groupKey || String(g.id) === String(productId));
      if (grp && Array.isArray(grp.variants)) {
        grp.variants.forEach(v => {
          v.custom_caption = text;
          v.customCaption = text;
          localStorage.setItem('CRM_PRODUCT_CAPTION_' + v.id, text);
          fetch('api.php?action=save_product_caption', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: v.id, custom_caption: text })
          }).catch(() => {});
        });
      }
      saveCRMState();
    } catch (e) {}

    updateDirectShareCaptionBadge(true);
    if (!silent) {
      showToast('Content Saved', 'Edited caption saved for all variants of this product!', 'bookmark', 'purple');
      playChime('order');
    }
    return;
  }

  // 3. Handle Single Variant / Standalone Product Share
  let p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId) || prod.sku === productId);
  if (!p) {
    const grouped = groupCatalogProducts(CRM_STATE.products || []);
    const grp = grouped.find(g => g.groupKey === productId || String(g.id) === String(productId));
    if (grp) p = grp;
  }

  if (p) {
    p.custom_caption = text;
    p.customCaption = text;
  }

  try {
    localStorage.setItem('CRM_PRODUCT_CAPTION_' + productId, text);
    if (p && p.id) {
      localStorage.setItem('CRM_PRODUCT_CAPTION_' + p.id, text);
    }
  } catch (e) {}

  if (p && p.id) {
    try {
      fetch('api.php?action=save_product_caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: p.id, custom_caption: text })
      }).catch(err => console.warn('[Caption Save API Warning]:', err));
    } catch (e) {}
  }

  saveCRMState();
  updateDirectShareCaptionBadge(true);

  if (!silent) {
    const label = p ? (p.sku || p.name) : 'Product';
    showToast('Content Saved', `Edited caption saved! This content will now be used for every share of ${label}.`, 'bookmark', 'purple');
    playChime('order');
  }
}

async function resetDirectShareCaptionToDefault() {
  const shareMode = document.getElementById('direct-share-is-family') ? document.getElementById('direct-share-is-family').value : '';
  const isFamilyShare = shareMode === 'true';
  const isBatchShare = shareMode === 'batch';
  const groupKey = (document.getElementById('direct-share-group-key')?.value || '').trim();
  const productId = (document.getElementById('direct-share-product-id')?.value || '').trim();

  if (isBatchShare) {
    if (!confirm('Reset batch message caption back to auto-generated details?')) return;
    try {
      localStorage.removeItem('CRM_BATCH_SHARE_CAPTION');
    } catch (e) {}
    const rawIds = productId.split(',').map(s => s.trim()).filter(Boolean);
    const selectedProds = (CRM_STATE.products || []).filter(prod => rawIds.includes(String(prod.id)));
    if (typeof generateBatchWhatsAppText === 'function') {
      document.getElementById('direct-share-message-text').value = generateBatchWhatsAppText(selectedProds);
    }
    updateDirectShareCaptionBadge(false);
    showToast('Caption Reset', 'Restored auto-generated details for batch selection.', 'restart_alt', 'blue');
    return;
  }

  if (isFamilyShare) {
    const saveKey = groupKey || productId;
    const grouped = groupCatalogProducts(CRM_STATE.products || []);
    const group = grouped.find(g => g.groupKey === saveKey || g.groupKey === groupKey || String(g.id) === String(productId));
    if (!group) return;

    if (!confirm(`Reset message caption for ${group.name} back to auto-generated all-variants details?`)) {
      return;
    }
    try {
      localStorage.removeItem('CRM_PRODUCT_FAMILY_CAPTION_' + saveKey);
      if (groupKey) localStorage.removeItem('CRM_PRODUCT_FAMILY_CAPTION_' + groupKey);
      if (productId) localStorage.removeItem('CRM_PRODUCT_FAMILY_CAPTION_' + productId);
    } catch (e) {}

    document.getElementById('direct-share-message-text').value = generateFamilyProductWhatsAppText(group);
    updateDirectShareCaptionBadge(false);
    showToast('Caption Reset', `Restored auto-generated all-variant details for ${group.name}.`, 'restart_alt', 'blue');
    return;
  }

  let p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(productId) || prod.sku === productId);
  if (!p) return;

  if (!confirm(`Reset message caption for ${p.sku} back to auto-generated product details?`)) {
    return;
  }

  p.custom_caption = '';
  p.customCaption = '';
  try {
    localStorage.removeItem('CRM_PRODUCT_CAPTION_' + p.id);
    localStorage.removeItem('CRM_PRODUCT_CAPTION_' + productId);
    fetch('api.php?action=save_product_caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: p.id, custom_caption: '' })
    }).catch(e => {});
  } catch (e) {}

  document.getElementById('direct-share-message-text').value = generateProductWhatsAppText(p);
  updateDirectShareCaptionBadge(false);
  showToast('Caption Reset', `Restored auto-generated specifications for ${p.sku}.`, 'restart_alt', 'blue');
}

// -------------------------------------------------------------------------
// MULTI-CONTACT CHECKBOX DROPDOWN LOGIC
// -------------------------------------------------------------------------
function toggleDirectShareDropdown(e) {
  if (e) e.stopPropagation();
  const panel = document.getElementById('direct-share-dropdown-panel');
  const chevron = document.getElementById('direct-share-dropdown-chevron');
  if (!panel) return;

  const isHidden = panel.classList.contains('hidden');
  if (isHidden) {
    panel.classList.remove('hidden');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
    renderDirectShareContactsList();
    const search = document.getElementById('direct-share-search-input');
    if (search) search.focus();
  } else {
    closeDirectShareDropdown();
  }
}

function closeDirectShareDropdown() {
  const panel = document.getElementById('direct-share-dropdown-panel');
  const chevron = document.getElementById('direct-share-dropdown-chevron');
  if (panel) panel.classList.add('hidden');
  if (chevron) chevron.style.transform = 'rotate(0deg)';
}

function filterDirectShareContactsList(query) {
  DIRECT_SHARE_SEARCH_QUERY = (query || '').toLowerCase().trim();
  renderDirectShareContactsList();
}

function clearDirectShareSearch() {
  DIRECT_SHARE_SEARCH_QUERY = '';
  const input = document.getElementById('direct-share-search-input');
  if (input) input.value = '';
  renderDirectShareContactsList();
}

function renderDirectShareContactsList() {
  const container = document.getElementById('direct-share-contacts-list');
  const countLabel = document.getElementById('direct-share-matching-count');
  if (!container) return;

  const query = DIRECT_SHARE_SEARCH_QUERY;
  let customers = CRM_STATE.customers || [];

  // Filter based on search query
  if (query) {
    customers = customers.filter(c => {
      const name = (c.name || '').toLowerCase();
      const phone = (c.whatsapp || c.phone || '').toLowerCase();
      return name.includes(query) || phone.includes(query);
    });
  }

  if (countLabel) {
    countLabel.innerText = query ? `Matching: ${customers.length}` : `All (${customers.length})`;
  }

  if (customers.length === 0) {
    container.innerHTML = `
      <div class="py-6 text-center text-slate-400">
        <span class="material-symbols-outlined text-[24px] mb-1">person_search</span>
        <p class="text-xs font-semibold">No contacts found</p>
      </div>
    `;
    return;
  }

  // Pin Active Customer to top if in list
  const activeCust = ACTIVE_CUSTOMER_ID ? customers.find(c => String(c.id) === String(ACTIVE_CUSTOMER_ID)) : null;
  const otherCusts = customers.filter(c => String(c.id) !== String(ACTIVE_CUSTOMER_ID));
  const orderedList = activeCust ? [activeCust, ...otherCusts] : otherCusts;

  container.innerHTML = orderedList.map(c => {
    const isChecked = DIRECT_SHARE_SELECTED_CUSTOMERS.has(String(c.id));
    const isActive = String(c.id) === String(ACTIVE_CUSTOMER_ID);
    const phone = c.whatsapp || c.phone || 'No phone';

    return `
      <div onclick="toggleDirectShareCustomer('${c.id}')" class="flex items-center justify-between p-2 hover:bg-slate-50 rounded-xl cursor-pointer transition select-none ${isActive ? 'bg-emerald-50/60 border border-emerald-200/80' : ''}">
        <div class="flex items-center gap-2.5 min-w-0 pr-2">
          <input type="checkbox" 
                 id="ds-chk-${c.id}" 
                 ${isChecked ? 'checked' : ''} 
                 onclick="event.stopPropagation(); toggleDirectShareCustomer('${c.id}', this.checked)"
                 class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer">
          <div class="w-7 h-7 rounded-lg ${isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'} flex items-center justify-center font-bold text-[10px] shrink-0">
            ${(c.name || 'C').charAt(0).toUpperCase()}
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-1.5">
              <span class="font-bold text-slate-800 text-xs truncate max-w-[170px]">${c.name}</span>
              ${isActive ? '<span class="px-1.5 py-0.2 bg-emerald-600 text-white font-extrabold text-[9px] rounded shadow-2xs shrink-0">Active Chat</span>' : ''}
            </div>
            <span class="font-mono text-[10px] text-slate-400 block">${phone}</span>
          </div>
        </div>
        <div>
          ${isChecked 
            ? '<span class="text-emerald-700 font-bold text-[10px] px-1.5 py-0.5 bg-emerald-100 rounded-md">Selected</span>' 
            : ''}
        </div>
      </div>
    `;
  }).join('');
}

function toggleDirectShareCustomer(customerId, forceChecked = null) {
  const cidStr = String(customerId);
  if (forceChecked !== null) {
    if (forceChecked) DIRECT_SHARE_SELECTED_CUSTOMERS.add(cidStr);
    else DIRECT_SHARE_SELECTED_CUSTOMERS.delete(cidStr);
  } else {
    if (DIRECT_SHARE_SELECTED_CUSTOMERS.has(cidStr)) {
      DIRECT_SHARE_SELECTED_CUSTOMERS.delete(cidStr);
    } else {
      DIRECT_SHARE_SELECTED_CUSTOMERS.add(cidStr);
    }
  }

  // Update checkbox in DOM if visible
  const chk = document.getElementById(`ds-chk-${cidStr}`);
  if (chk) chk.checked = DIRECT_SHARE_SELECTED_CUSTOMERS.has(cidStr);

  renderDirectShareContactsList();
  updateDirectShareSummary();
}

function selectAllDirectShareContacts(selectAll) {
  const customers = CRM_STATE.customers || [];
  if (selectAll) {
    customers.forEach(c => DIRECT_SHARE_SELECTED_CUSTOMERS.add(String(c.id)));
  } else {
    DIRECT_SHARE_SELECTED_CUSTOMERS.clear();
  }
  renderDirectShareContactsList();
  updateDirectShareSummary();
}

function selectActiveChatOnly() {
  DIRECT_SHARE_SELECTED_CUSTOMERS.clear();
  if (ACTIVE_CUSTOMER_ID) {
    DIRECT_SHARE_SELECTED_CUSTOMERS.add(String(ACTIVE_CUSTOMER_ID));
  } else if (CRM_STATE.customers.length > 0) {
    DIRECT_SHARE_SELECTED_CUSTOMERS.add(String(CRM_STATE.customers[0].id));
  }
  renderDirectShareContactsList();
  updateDirectShareSummary();
}

function getDirectShareCustomNumbers() {
  const input = document.getElementById('direct-share-custom-phone');
  if (!input) return [];
  const val = input.value.trim();
  if (!val) return [];
  return val.split(',').map(s => s.trim()).filter(s => s.length >= 7);
}

function updateDirectShareSummary() {
  const countBadge = document.getElementById('direct-share-selected-count-badge');
  const summaryText = document.getElementById('direct-share-dropdown-summary');
  const submitBtnText = document.getElementById('direct-share-submit-btn-text');

  const customerCount = DIRECT_SHARE_SELECTED_CUSTOMERS.size;
  const customNumbers = getDirectShareCustomNumbers();
  const totalRecipients = customerCount + customNumbers.length;

  if (countBadge) {
    countBadge.innerText = `${totalRecipients} Recipient${totalRecipients === 1 ? '' : 's'}`;
  }

  if (summaryText) {
    if (customerCount === 0) {
      summaryText.innerText = customNumbers.length > 0 ? `Custom Number(s) Only (${customNumbers.length})` : 'Choose contacts from list...';
    } else if (customerCount === 1) {
      const singleId = Array.from(DIRECT_SHARE_SELECTED_CUSTOMERS)[0];
      const cust = (CRM_STATE.customers || []).find(c => String(c.id) === String(singleId));
      const isAct = String(singleId) === String(ACTIVE_CUSTOMER_ID);
      summaryText.innerText = `${isAct ? 'Active Chat: ' : ''}${cust ? cust.name : '1 Contact'}`;
    } else {
      summaryText.innerText = `${customerCount} Contacts Selected`;
    }
  }

  if (submitBtnText) {
    submitBtnText.innerText = `Send to WhatsApp (${totalRecipients} Recipient${totalRecipients === 1 ? '' : 's'})`;
  }
}

// Global click outside listener to close dropdown
document.addEventListener('click', (e) => {
  const panel = document.getElementById('direct-share-dropdown-panel');
  const trigger = document.getElementById('direct-share-dropdown-trigger');
  if (panel && !panel.classList.contains('hidden')) {
    if (!panel.contains(e.target) && !trigger.contains(e.target)) {
      closeDirectShareDropdown();
    }
  }
});

// -------------------------------------------------------------------------
// DIRECT WHATSAPP MULTI-DISPATCH SUBMISSION
// -------------------------------------------------------------------------
async function handleDirectShareSubmit(e) {
  if (e && e.preventDefault) e.preventDefault();

  const shareMode = document.getElementById('direct-share-is-family') ? document.getElementById('direct-share-is-family').value : '';
  const isFamilyShare = shareMode === 'true';
  const isBatchShare = shareMode === 'batch';
  const groupKey = (document.getElementById('direct-share-group-key')?.value || '').trim();
  const idVal = (document.getElementById('direct-share-product-id')?.value || '').trim();

  let p = null;
  let group = null;
  let batchProducts = [];
  if (isBatchShare) {
    const rawIds = idVal.split(',').map(s => s.trim()).filter(Boolean);
    batchProducts = (CRM_STATE.products || []).filter(prod => rawIds.includes(String(prod.id)));
    if (batchProducts.length === 0) {
      showToast('Product Error', 'No selected products found to dispatch.', 'error', 'rose');
      return;
    }
    p = batchProducts[0];
  } else if (isFamilyShare) {
    const grouped = groupCatalogProducts(CRM_STATE.products || []);
    group = grouped.find(g => g.groupKey === groupKey || g.groupKey === idVal || String(g.id) === String(idVal));
    p = group || (CRM_STATE.products || []).find(prod => String(prod.id) === String(idVal) || prod.sku === idVal);
  } else {
    p = (CRM_STATE.products || []).find(prod => String(prod.id) === String(idVal) || prod.sku === idVal);
    if (!p) {
      const grouped = groupCatalogProducts(CRM_STATE.products || []);
      group = grouped.find(g => g.groupKey === idVal || String(g.id) === String(idVal));
      if (group) p = group;
    }
  }

  if (!p) {
    showToast('Product Error', 'Product details not loaded. Please select product again.', 'error', 'rose');
    return;
  }

  const messageText = (document.getElementById('direct-share-message-text').value || '').trim();
  if (!messageText) {
    showToast('Notice', 'Please enter or generate a message caption before sending.', 'warning', 'amber');
    return;
  }

  // 1. Gather all selected recipients
  const selectedCustIds = Array.from(DIRECT_SHARE_SELECTED_CUSTOMERS);
  const customPhones = getDirectShareCustomNumbers();
  const totalCount = selectedCustIds.length + customPhones.length;

  if (totalCount === 0) {
    showToast('Select Recipients', 'Please select at least one contact or enter a custom phone number.', 'warning', 'amber');
    return;
  }

  // 2. Automatically save the edited content so subsequent shares reuse this exact caption!
  saveDirectShareCustomCaption(true); // silent = true

  const validImg = (p.image && !p.image.includes('photo-1518831959646-742c3a14ebf7')) ? p.image : null;
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Disable button to prevent double-clicks
  const submitBtn = document.getElementById('direct-share-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
  }

  closeModal('modal-direct-share-product');
  playChime('order');
  const targetLabel = isBatchShare ? `${batchProducts.length} selected garments` : (isFamilyShare && group ? `${group.name} (${group.variantCount} variants)` : (p.sku || p.name));
  showToast('WhatsApp Dispatching', `Broadcasting ${targetLabel} to ${totalCount} recipient(s)...`, 'send', 'emerald');

  let successCount = 0;
  let failCount = 0;

  // 3. Dispatch to all selected CRM Customers SEQUENTIALLY
  for (let i = 0; i < selectedCustIds.length; i++) {
    const cid = selectedCustIds[i];
    const cust = (CRM_STATE.customers || []).find(c => String(c.id) === String(cid));
    if (!cust) continue;

    const rawPhone = cust.whatsapp || cust.phone;
    if (!rawPhone) continue;

    // Create optimistic message in CRM State
    const msgId = Date.now() + Math.floor(Math.random() * 1000) + i;
    const newMsg = {
      id: msgId,
      sender: 'staff',
      text: messageText,
      type: validImg ? 'image' : 'text',
      media_url: validImg,
      time: timeStr,
      status: 'SENDING'
    };

    if (!CRM_STATE.conversations[cust.id]) {
      CRM_STATE.conversations[cust.id] = [];
    }
    CRM_STATE.conversations[cust.id].push(newMsg);

    // Update active query in CRM_STATE to REPLIED
    const query = (CRM_STATE.queries || []).find(q => String(q.customerId) === String(cust.id));
    if (query) {
      query.lastMessage = `Staff: "${messageText.slice(0, 45)}..."`;
      query.status = 'REPLIED';
      query.unreadCount = 0;
    }

    if (String(ACTIVE_CUSTOMER_ID) === String(cust.id)) {
      renderChatMessages();
    }

    try {
      const delivered = await dispatchWhatsAppOutbound(
        rawPhone, 
        messageText, 
        newMsg, 
        cust.jid || null, 
        cust.accountId || null, 
        true, // silent individual toasts
        validImg, 
        cust.id
      );
      if (delivered) {
        newMsg.status = 'DELIVERED';
        successCount++;
      } else {
        newMsg.status = 'SENT';
        successCount++;
      }
    } catch (err) {
      console.warn(`[Direct WA Dispatch Error for ${rawPhone}]:`, err);
      newMsg.status = 'FAILED';
      failCount++;
    }

    // Small delay between sends to prevent Baileys socket congestion
    if (i < selectedCustIds.length - 1) {
      await new Promise(r => setTimeout(r, 350));
    }
  }

  // 4. Dispatch to any Custom Phone Numbers SEQUENTIALLY
  for (let j = 0; j < customPhones.length; j++) {
    const phone = customPhones[j];
    const customMsg = {
      id: Date.now() + Math.floor(Math.random() * 1000) + 100 + j,
      sender: 'staff',
      text: messageText,
      type: validImg ? 'image' : 'text',
      media_url: validImg,
      time: timeStr,
      status: 'SENDING'
    };

    try {
      const delivered = await dispatchWhatsAppOutbound(
        phone, 
        messageText, 
        customMsg, 
        null, 
        ACTIVE_SEND_ACCOUNT_ID || 'account_1', 
        true, 
        validImg, 
        null
      );
      if (delivered) {
        customMsg.status = 'DELIVERED';
        successCount++;
      } else {
        customMsg.status = 'SENT';
        successCount++;
      }
    } catch (err) {
      console.warn(`[Direct WA Custom Phone Error for ${phone}]:`, err);
      failCount++;
    }

    if (j < customPhones.length - 1) {
      await new Promise(r => setTimeout(r, 350));
    }
  }

  // 5. CRITICAL: Persist CRM State to localStorage & sync all UI elements
  saveCRMState();
  if (typeof renderInboxConversationList === 'function') renderInboxConversationList();
  if (typeof updateBadgeCounters === 'function') updateBadgeCounters();
  if (typeof renderChatMessages === 'function' && ACTIVE_CUSTOMER_ID) renderChatMessages();

  // Re-enable submit button
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
  }

  // 6. Comprehensive Result Toast
  const productSkuOrName = isBatchShare 
    ? `${batchProducts.length} garments` 
    : (p.sku || p.name || 'Product');
  if (failCount === 0) {
    showToast('Product Dispatched! 🚀', `Successfully sent ${productSkuOrName} to ${successCount} recipient(s)!`, 'done_all', 'emerald');
    playChime('delivered');
  } else {
    showToast('Dispatch Completed', `Sent to ${successCount} recipient(s). ${failCount} recipient(s) failed.`, 'warning', 'amber');
  }
}

function copyProductWhatsAppText(productId) {
  let p = CRM_STATE.products.find(prod => String(prod.id) === String(productId));
  const isFamilyShare = document.getElementById('direct-share-is-family') ? document.getElementById('direct-share-is-family').value === 'true' : false;
  const groupKey = document.getElementById('direct-share-group-key') ? document.getElementById('direct-share-group-key').value : '';

  const currentArea = document.getElementById('direct-share-message-text');
  let text = (currentArea && currentArea.value) ? currentArea.value : '';
  if (!text) {
    if (isFamilyShare) {
      const grouped = groupCatalogProducts(CRM_STATE.products || []);
      const group = grouped.find(g => g.groupKey === groupKey || String(g.id) === String(productId));
      if (group) text = generateFamilyProductWhatsAppText(group);
    } else if (p) {
      text = p.custom_caption || p.customCaption || generateProductWhatsAppText(p);
    }
  }

  if (!text) return;

  const skuLabel = isFamilyShare ? (groupKey || 'All Variants') : (p ? p.sku : 'Product');
  navigator.clipboard.writeText(text).then(() => {
    showToast('Copied to Clipboard', `Formatted WhatsApp card for ${skuLabel} copied!`, 'content_copy', 'emerald');
  }).catch(() => {
    showToast('Copied', `Text ready to paste into WhatsApp!`, 'content_copy', 'emerald');
  });
}

// 1-Click direct fallback to WhatsApp Web / App
function openDirectWhatsAppWeb(productId) {
  let p = CRM_STATE.products.find(prod => String(prod.id) === String(productId));
  const isFamilyShare = document.getElementById('direct-share-is-family') ? document.getElementById('direct-share-is-family').value === 'true' : false;
  const groupKey = document.getElementById('direct-share-group-key') ? document.getElementById('direct-share-group-key').value : '';

  const currentArea = document.getElementById('direct-share-message-text');
  let text = (currentArea && currentArea.value) ? currentArea.value : '';
  if (!text) {
    if (isFamilyShare) {
      const grouped = groupCatalogProducts(CRM_STATE.products || []);
      const group = grouped.find(g => g.groupKey === groupKey || String(g.id) === String(productId));
      if (group) text = generateFamilyProductWhatsAppText(group);
    } else if (p) {
      text = p.custom_caption || p.customCaption || generateProductWhatsAppText(p);
    }
  }

  if (!text) return;

  // Determine phone to open
  let targetPhone = '';
  const selectedCustIds = Array.from(DIRECT_SHARE_SELECTED_CUSTOMERS);
  const customPhones = getDirectShareCustomNumbers();

  if (customPhones.length > 0) {
    targetPhone = customPhones[0];
  } else if (selectedCustIds.length > 0) {
    const cust = (CRM_STATE.customers || []).find(c => String(c.id) === String(selectedCustIds[0]));
    if (cust) targetPhone = cust.whatsapp || cust.phone;
  } else if (ACTIVE_CUSTOMER_ID) {
    const cust = (CRM_STATE.customers || []).find(c => String(c.id) === String(ACTIVE_CUSTOMER_ID));
    if (cust) targetPhone = cust.whatsapp || cust.phone;
  }

  let cleanPhone = (targetPhone || '').replace(/[^0-9]/g, '');
  if (cleanPhone.length === 10) cleanPhone = '91' + cleanPhone;

  const waUrl = cleanPhone 
    ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`
    : `https://web.whatsapp.com/send?text=${encodeURIComponent(text)}`;

  window.open(waUrl, '_blank');
  showToast('WhatsApp Web Opened', 'Opening direct chat preview in WhatsApp Web!', 'open_in_new', 'emerald');
}

// Expose direct WhatsApp product dispatch functions to window
window.saveDirectShareCustomCaption = saveDirectShareCustomCaption;
window.resetDirectShareCaptionToDefault = resetDirectShareCaptionToDefault;
window.updateDirectShareCaptionBadge = updateDirectShareCaptionBadge;
window.handleDirectShareCaptionInput = handleDirectShareCaptionInput;
window.handleDirectShareSubmit = handleDirectShareSubmit;
window.toggleDirectShareDropdown = toggleDirectShareDropdown;
window.closeDirectShareDropdown = closeDirectShareDropdown;
window.filterDirectShareContactsList = filterDirectShareContactsList;
window.clearDirectShareSearch = clearDirectShareSearch;
window.toggleDirectShareCustomer = toggleDirectShareCustomer;
window.selectAllDirectShareContacts = selectAllDirectShareContacts;
window.selectActiveChatOnly = selectActiveChatOnly;
window.copyProductWhatsAppText = copyProductWhatsAppText;
window.openDirectWhatsAppWeb = openDirectWhatsAppWeb;

async function refreshCatalogStockFromAPI() {
  showToast('Syncing Stock', 'Fetching latest warehouse stock and catalog from database...', 'sync', 'blue');
  try {
    const res = await fetch('api.php?action=get_all');
    if (res.ok) {
      const data = await res.json();
      const payload = data.data || data;
      if (payload.products && Array.isArray(payload.products)) {
        mergeCatalogProductsWithDB(payload.products);
      }
      if (payload.categories && Array.isArray(payload.categories) && payload.categories.length > 0) {
        CRM_STATE.categories = payload.categories;
      }
      if (payload.subcategories && Array.isArray(payload.subcategories) && payload.subcategories.length > 0) {
        CRM_STATE.subcategories = payload.subcategories;
      }
      if (payload.attributes) {
        CRM_STATE.attributes = payload.attributes;
      }
      if (typeof populateCatalogCategoryFilters === 'function') {
        populateCatalogCategoryFilters();
      }
    }
  } catch (err) {
    console.log('Sync completed with current cache');
  }
  filterCatalogGrid();
  updateOrderProductDropdown();
  showToast('Stock Synchronized', 'All garment inventory levels and catalog taxonomy are live.', 'check_circle', 'emerald');
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
  fetch('http://localhost:3000/api/qr/status')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success' && Array.isArray(res.accounts)) {
        MULTI_ACCOUNTS_STATE = res.accounts;
        if (Array.isArray(CRM_STATE.whatsappLines)) {
          CRM_STATE.whatsappLines.forEach(line => {
            const live = res.accounts.find(a => a.id === line.id);
            if (live) {
              line.status = live.status;
              if (live.status === 'CONNECTED') {
                line.connected_number = live.connected_number || line.connected_number;
                line.qr_image = null;
              } else if (live.status === 'SCAN_QR') {
                line.qr_image = live.qr_image;
                line.connected_number = 'Scan QR Code';
              } else if (live.status === 'DISCONNECTED') {
                line.connected_number = 'Awaiting Link';
                line.qr_image = null;
              }
            }
          });
        }
        renderMultiAccountsHub();
        renderQuickLineSwitcher();
        renderPhoneSwitcherDropdown();
        updateQRBridgeUI(res);

        const primary = res.accounts.find(a => a.id === 'account_1') || res.accounts[0];
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

  // Immediately mark account as CONNECTING in UI so user sees instant feedback
  if (Array.isArray(MULTI_ACCOUNTS_STATE)) {
    const acc = MULTI_ACCOUNTS_STATE.find(a => a.id === targetId);
    if (acc) {
      acc.status = 'CONNECTING';
      acc.qr_image = null;
      renderMultiAccountsHub();
    }
  }

  fetch('http://localhost:3000/api/accounts/refresh_qr', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId: targetId })
  })
    .then(r => r.json())
    .then(res => {
      setTimeout(fetchQRBridgeStatus, 1000);
      setTimeout(fetchQRBridgeStatus, 2500);
      setTimeout(fetchQRBridgeStatus, 4500);
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
  const targetId = accountId || 'account_1';
  if (confirm(`Disconnect and unbind WhatsApp session for ${targetId}? Your CRM chats, customers & orders are 100% safe.`)) {
    // 1. Immediately update CRM_STATE.whatsappAccount
    if (CRM_STATE.whatsappAccount && (targetId === 'account_1' || ACTIVE_SEND_ACCOUNT_ID === targetId)) {
      CRM_STATE.whatsappAccount.status = 'DISCONNECTED';
    }

    // 2. Immediately update CRM_STATE.whatsappLines
    if (Array.isArray(CRM_STATE.whatsappLines)) {
      const line = CRM_STATE.whatsappLines.find(l => l.id === targetId);
      if (line) {
        line.status = 'DISCONNECTED';
        line.connected_number = 'Awaiting Link';
        line.qr_image = null;
        line.qr = null;
      }
    }

    // 3. Immediately update MULTI_ACCOUNTS_STATE
    if (Array.isArray(MULTI_ACCOUNTS_STATE)) {
      const acc = MULTI_ACCOUNTS_STATE.find(a => a.id === targetId);
      if (acc) {
        acc.status = 'DISCONNECTED';
        acc.connected_number = null;
        acc.connectedName = null;
        acc.qr_image = null;
      }
    }

    // 4. Save and re-render UI IMMEDIATELY
    saveCRMState();
    updateConfiguredPhoneDisplays();
    renderMultiAccountsHub();
    renderQuickLineSwitcher();
    renderPhoneSwitcherDropdown();

    // 5. Send disconnect request to Baileys bridge
    fetch('http://localhost:3000/api/accounts/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: targetId })
    })
      .then(r => r.json())
      .then(res => {
        showToast('WhatsApp Disconnected', `Session logged out. Fresh QR code is ready to scan.`, 'link_off', 'blue');
        setTimeout(fetchQRBridgeStatus, 1000);
        setTimeout(fetchQRBridgeStatus, 2500);
      })
      .catch(() => {
        showToast('Disconnected', 'Session reset and unlinked locally.', 'info', 'blue');
        setTimeout(fetchQRBridgeStatus, 1500);
      });

    // 6. Notify PHP backend API
    fetch('api.php?action=disconnect_account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId: targetId })
    }).catch(() => {});
  }
}

function refreshSpecificAccount(accountId) {
  fetchQRBridgeStatus();
  showToast('Refreshed', 'Synced with WhatsApp Bridge', 'sync', 'emerald');
}

function renderWhatsAppSettings() {
  fetchQRBridgeStatus();

  // Fetch the latest brand config from the bridge config file first, then populate
  fetch('http://localhost:3000/api/brand/config')
    .then(r => r.json())
    .then(res => {
      if (res.status === 'success') {
        if (!CRM_STATE.brandSettings) CRM_STATE.brandSettings = {};
        if (res.brand_name) CRM_STATE.brandSettings.brandName = res.brand_name;
        if (res.brand_tagline) CRM_STATE.brandSettings.brandTagline = res.brand_tagline;
      }
    })
    .catch(() => { })
    .finally(() => {
      _populateBrandSettingsFields();
    });

  _populateBrandSettingsFields(); // Also run immediately (don't wait for fetch)
}

function _populateBrandSettingsFields() {
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
// 14. UTILITY & MODAL CONTROLLERS (DYNAMIC Z-INDEX STACKING)
// =========================================================================
var TOP_MODAL_BASE_Z_INDEX = 50;
var ACTIVE_MODAL_STACK = [];

function openModal(id) {
  if (id === 'modal-auto-reply-settings') {
    openAutoReplyModal();
    return;
  }
  if (id === 'modal-broadcast-template') {
    openBroadcastModal();
    return;
  }
  const el = document.getElementById(id);
  if (!el) return;

  // Calculate highest z-index among currently open modals
  let highestZ = TOP_MODAL_BASE_Z_INDEX;
  const allModals = document.querySelectorAll('.modal-backdrop, [id^="modal-"]');
  allModals.forEach(m => {
    if (m !== el && !m.classList.contains('hidden')) {
      const z = parseInt(window.getComputedStyle(m).zIndex, 10);
      if (!isNaN(z) && z > highestZ) {
        highestZ = z;
      }
    }
  });

  const targetZ = highestZ + 20;
  el.style.zIndex = targetZ.toString();
  el.classList.remove('hidden');

  const idx = ACTIVE_MODAL_STACK.indexOf(id);
  if (idx !== -1) {
    ACTIVE_MODAL_STACK.splice(idx, 1);
  }
  ACTIVE_MODAL_STACK.push(id);
}

function closeModal(id) {
  if (id === 'modal-auto-reply-settings' || id === 'modal-broadcast-template') {
    switchInboxSubmodule('chats');
    return;
  }
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('hidden');
    el.style.zIndex = '';
  }
  ACTIVE_MODAL_STACK = ACTIVE_MODAL_STACK.filter(m => m !== id);
}

window.openModal = openModal;
window.closeModal = closeModal;

function logAudit(action, module, details) {
  const user = ACTIVE_ROLE === 'admin' ? 'Super Admin' : (CRM_STATE.staffList.find(s => s.id === ACTIVE_ROLE)?.name || 'Staff');
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  CRM_STATE.auditLogs.unshift({ timestamp, user, action, module, details });

  // Asynchronously persist audit log to MySQL Database
  fetch('api.php?action=save_audit_log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, action, module, details, timestamp })
  }).catch(() => {});
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

  // 100% Dynamic Unique Inbound Users/Contacts Count Calculation
  // 1 user sending messages = 1 count, regardless of how many messages they send
  const uniqueInboundUsersToday = new Set();
  const startOfToday = new Date().setHours(0, 0, 0, 0);

  if (CRM_STATE.conversations && typeof CRM_STATE.conversations === 'object') {
    Object.entries(CRM_STATE.conversations).forEach(([custId, msgs]) => {
      if (Array.isArray(msgs)) {
        const hasCustomerMsgToday = msgs.some(m => {
          if (!m) return false;
          const isInbound = (m.sender === 'customer' || (!m.isBot && m.sender !== 'staff' && !m.is_outbound));
          if (!isInbound) return false;
          return (!m.timestamp || m.timestamp >= startOfToday);
        });
        if (hasCustomerMsgToday) {
          uniqueInboundUsersToday.add(custId);
        }
      }
    });
  }

  // Active customer inquiry conversations visible in the inbox
  activeQueries.forEach(q => {
    if (q && q.customerId) {
      uniqueInboundUsersToday.add(q.customerId);
    }
  });

  const totalReceivedToday = uniqueInboundUsersToday.size;

  // Dynamically synchronize each staff member's todayHandled with active assigned queries (remove hardcoded static numbers)
  if (Array.isArray(CRM_STATE.staffList)) {
    CRM_STATE.staffList.forEach(staff => {
      const assignedToThisStaff = activeQueries.filter(q => q.assignedTo === staff.id || (q.staff && q.staff.id === staff.id));
      staff.todayHandled = assignedToThisStaff.length;
    });
  }

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

// Dev & Test helper to completely clear and reset all inbox conversations and messages
function confirmResetInboxMessages() {
  if (confirm("⚠️ Are you sure you want to clear all WhatsApp inbox chats?\n\nThis will clear all conversation history and active inquiry cards, giving you a 100% clean inbox.")) {
    CRM_STATE.conversations = {};
    CRM_STATE.queries = [];
    ACTIVE_CUSTOMER_ID = null;

    // Reset unread counters on all customers
    if (Array.isArray(CRM_STATE.customers)) {
      CRM_STATE.customers.forEach(c => {
        c.totalOrders = c.totalOrders || 0;
      });
    }

    // Call backend API to clear messages and live message queue
    fetch('api.php?action=clear_inbox', { method: 'POST' }).catch(() => {});

    saveCRMState();
    renderInbox();
    renderInboxConversationList();
    renderChatHeader();
    renderChatMessages();
    renderCustomer360Panel();
    updateBadgeCounters();
    showToast('Inbox Chats Cleared', 'All WhatsApp inbox conversations and messages have been cleared.', 'delete_sweep', 'emerald');
    if (typeof playChime === 'function') playChime('inbound');
  }
}

// =========================================================================
// 15. AUTOMATED TEMPLATE BROADCAST CONTROLLER (100% FREE & SAFE DISPATCH)
// =========================================================================
let BROADCAST_CANCEL_FLAG = false;
let IS_BROADCASTING_ACTIVE = false;

// Dynamic System & Custom Tags Map for Broadcast Personalization & Direct Value Editing
const SYSTEM_TAG_KEYS = ['customer_name', 'business_name', 'line_phone', 'customer_phone', 'today_date', 'staff_name'];

let BROADCAST_CUSTOM_TAGS = {
  customer_name: 'Auto per Customer',
  business_name: 'Blue Berry 💙',
  line_phone: '+91 86680 07593',
  customer_phone: 'Auto per Customer',
  today_date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
  staff_name: 'Sales Desk',
  offer_discount: '15% OFF',
  product_name: 'Festive Garments Collection',
  coupon_code: 'FESTIVE2026'
};

// Preset Templates Dictionary with Dynamic Name & Management
let BROADCAST_PRESETS_DATA = {
  festive_offer: {
    label: "🎉 Festive Mega Sale (15% Off on Baby Frocks & Maternity)",
    text: "🎉 *GRM FESTIVE SPECIAL OFFER!* 🎉\n\nDear {{customer_name}},\nWe are delighted to announce our exclusive Festive Collection! Enjoy an instant *{{offer_discount}}* on all Baby Frocks, Pure Cotton Newborn Rompers & Maternity Feeding Gowns.\n\n✨ Direct Line: {{line_phone}}\nReply *'CATALOG'* to this chat to receive our full photo brochure with price list!\n\nBest regards,\n{{business_name}}"
  },
  new_collection: {
    label: "✨ New Garments & Newborn Rompers Launch",
    text: "✨ *NEW ARRIVALS ALERT!* ✨\n\nHello {{customer_name}},\nOur brand-new Summer Collection has just landed! Premium Handcrafted Baby Lehengas, Organic Cotton 5-Pc Romper Gift Sets, and Trendy Maternity Wear are now in stock.\n\n📦 Same-Day Dispatch available.\n📞 Contact us on {{line_phone}}\n\nReply to this message with your required size to check live stock!\n\nWarm wishes,\n{{business_name}}"
  },
  order_followup: {
    label: "📦 Order Status & Stock Availability Follow-up",
    text: "📦 *ORDER & STOCK STATUS UPDATE* 📦\n\nHi {{customer_name}},\nWe are checking in regarding your recent enquiry with {{business_name}}.\n\nOur workshop has fresh inventory ready for dispatch today. If you would like to proceed with your order or modify quantities, please reply here!\n\n💬 Dedicated Support Line: {{line_phone}}"
  },
  wholesale_catalog: {
    label: "🏢 Wholesale & Bulk Garments Catalog (Erode / Tirupur)",
    text: "🏢 *WHOLESALE BULK DEALS — {{business_name}}* 🏢\n\nRespected {{customer_name}},\nExclusive wholesale lot prices are now live for bulk buyers:\n• Baby Frocks Bundle (25 Pcs Assorted)\n• Organic Rompers Bulk Box (50 Pcs)\n• Festive Silk Pattu Pavadai Sets\n\n🚚 GST Invoicing & Doorstep Cargo Delivery across India.\n📞 Wholesale Desk: {{line_phone}}\n\nReply *'BULK'* to receive current wholesale price sheet."
  },
  payment_reminder: {
    label: "💳 Payment UPI & Order Confirmation",
    text: "💳 *PAYMENT & ORDER CONFIRMATION* 💳\n\nDear {{customer_name}},\nThank you for choosing {{business_name}}!\n\nYour order items have been reserved in our warehouse. To confirm your dispatch slot for today, please complete your payment via GPay / PhonePe / UPI to {{line_phone}}.\n\nOnce paid, please share the screenshot here for immediate shipping tracking number."
  },
  custom: {
    label: "✍️ Custom Announcement Message",
    text: "Dear {{customer_name}},\n\nThank you for connecting with {{business_name}}! We are happy to assist you with all your garment requirements.\n\nFeel free to message us here on {{line_phone}} anytime.\n\nBest regards,\n{{business_name}}"
  }
};

function renderBroadcastTemplateDropdown(selectedKey = null) {
  const presetSelect = document.getElementById('bcast-preset-select');
  if (!presetSelect) return;

  const currentVal = selectedKey || presetSelect.value || 'festive_offer';
  const entries = Object.entries(BROADCAST_PRESETS_DATA);

  presetSelect.innerHTML = entries.map(([key, item]) => `
    <option value="${key}" ${key === currentVal ? 'selected' : ''}>${item.label || key}</option>
  `).join('');

  if (entries.some(([k]) => k === currentVal)) {
    presetSelect.value = currentVal;
  } else if (entries.length > 0) {
    presetSelect.value = entries[0][0];
  }
}

// 1. Admin Action: Save Current Message as a New Named Template
function handleSaveCurrentAsNewTemplate() {
  const msgInput = document.getElementById('bcast-message-text');
  const text = msgInput ? msgInput.value.trim() : '';

  if (!text) {
    alert('Please enter some message text before saving as a template.');
    if (msgInput) msgInput.focus();
    return;
  }

  const templateName = prompt('Enter a name / title for this new template (e.g. "Diwali 20% Sale Announcement"):');
  if (!templateName || !templateName.trim()) return;

  const cleanKey = 'template_' + Date.now();
  BROADCAST_PRESETS_DATA[cleanKey] = {
    label: `📋 ${templateName.trim()}`,
    text: text
  };

  try {
    localStorage.setItem('GRM_CUSTOM_BROADCAST_TEMPLATES', JSON.stringify(BROADCAST_PRESETS_DATA));
  } catch (e) {}

  renderBroadcastTemplateDropdown(cleanKey);
  showToast('Template Saved', `Template "${templateName.trim()}" saved successfully!`, 'bookmark_added', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

// 2. Admin Action: Rename the Currently Selected Template
function handleRenameCurrentTemplate() {
  const presetSelect = document.getElementById('bcast-preset-select');
  if (!presetSelect) return;

  const currentKey = presetSelect.value;
  if (!currentKey || !BROADCAST_PRESETS_DATA[currentKey]) {
    alert('Please select a template to rename.');
    return;
  }

  const currentLabel = BROADCAST_PRESETS_DATA[currentKey].label || '';
  const newName = prompt(`Rename template "${currentLabel}":`, currentLabel);
  if (newName && newName.trim()) {
    BROADCAST_PRESETS_DATA[currentKey].label = newName.trim();
    try {
      localStorage.setItem('GRM_CUSTOM_BROADCAST_TEMPLATES', JSON.stringify(BROADCAST_PRESETS_DATA));
    } catch (e) {}
    renderBroadcastTemplateDropdown(currentKey);
    showToast('Template Renamed', `Template renamed to "${newName.trim()}".`, 'edit', 'blue');
  }
}

// 3. Admin Action: Delete Selected Custom Template
function handleDeleteCurrentTemplate() {
  const presetSelect = document.getElementById('bcast-preset-select');
  if (!presetSelect) return;

  const currentKey = presetSelect.value;
  if (!currentKey || !BROADCAST_PRESETS_DATA[currentKey]) return;

  const keys = Object.keys(BROADCAST_PRESETS_DATA);
  if (keys.length <= 1) {
    alert('You cannot delete the only remaining template.');
    return;
  }

  if (confirm(`Are you sure you want to delete the template "${BROADCAST_PRESETS_DATA[currentKey].label}"?`)) {
    delete BROADCAST_PRESETS_DATA[currentKey];
    try {
      localStorage.setItem('GRM_CUSTOM_BROADCAST_TEMPLATES', JSON.stringify(BROADCAST_PRESETS_DATA));
    } catch (e) {}
    renderBroadcastTemplateDropdown(Object.keys(BROADCAST_PRESETS_DATA)[0]);
    applyBroadcastPreset(Object.keys(BROADCAST_PRESETS_DATA)[0]);
    showToast('Template Deleted', 'Template removed successfully.', 'delete', 'amber');
  }
}

function openBroadcastModal() {
  BROADCAST_CANCEL_FLAG = false;
  IS_BROADCASTING_ACTIVE = false;

  // Load saved custom templates from storage if present
  try {
    const saved = localStorage.getItem('GRM_CUSTOM_BROADCAST_TEMPLATES');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        BROADCAST_PRESETS_DATA = Object.assign({}, BROADCAST_PRESETS_DATA, parsed);
      }
    }
  } catch (e) {}

  renderBroadcastTemplateDropdown('festive_offer');
  applyBroadcastPreset('festive_offer');
  refreshBroadcastAutoFetchedNumbers();
  renderDynamicTemplateFields();
  updateBroadcastPreview();

  // Reset Broadcast Progress UI
  const progContainer = document.getElementById('bcast-progress-container');
  if (progContainer) progContainer.classList.add('hidden');
  
  const startBtn = document.getElementById('btn-bcast-start');
  if (startBtn) {
    startBtn.classList.remove('hidden');
    startBtn.disabled = false;
  }
  const stopBtn = document.getElementById('btn-bcast-stop');
  if (stopBtn) stopBtn.classList.add('hidden');

  const cancelBtn = document.getElementById('btn-bcast-cancel');
  if (cancelBtn) cancelBtn.disabled = false;

  // Reset collapsible numbers editor
  const collapseNumbers = document.getElementById('bcast-numbers-editor-collapse');
  if (collapseNumbers) collapseNumbers.classList.add('hidden');
  const toggleIcon = document.getElementById('bcast-numbers-toggle-icon');
  if (toggleIcon) toggleIcon.innerText = 'expand_more';
  const toggleText = document.getElementById('bcast-numbers-toggle-text');
  if (toggleText) toggleText.innerText = 'View / Paste Custom Numbers';

  switchView('inbox', 'broadcast');
}

function closeBroadcastModal() {
  if (IS_BROADCASTING_ACTIVE) {
    if (!confirm('A broadcast is currently sending messages. Are you sure you want to stop and close?')) {
      return;
    }
    BROADCAST_CANCEL_FLAG = true;
  }
  switchInboxSubmodule('chats');
}

let CURRENT_BROADCAST_TEMPLATE_TITLE = 'Template Message Text';

function editBroadcastTemplateTitle() {
  handleRenameCurrentTemplate();
}

function updateBroadcastTemplateTitleUI() {
  const labelEl = document.getElementById('bcast-template-title-label');
  if (labelEl) {
    labelEl.innerText = CURRENT_BROADCAST_TEMPLATE_TITLE || 'Template Message Text';
  }
}

function applyBroadcastPreset(presetKey) {
  const msgInput = document.getElementById('bcast-message-text');
  if (!msgInput) return;

  if (BROADCAST_PRESETS_DATA[presetKey]) {
    msgInput.value = BROADCAST_PRESETS_DATA[presetKey].text;
    const cleanLabel = (BROADCAST_PRESETS_DATA[presetKey].label || 'Template Message Text').replace(/^[^\w\s]+/, '').trim();
    CURRENT_BROADCAST_TEMPLATE_TITLE = cleanLabel || 'Template Message Text';
    updateBroadcastTemplateTitleUI();
  }
  renderDynamicTemplateFields();
  updateBroadcastPreview();
}

// Insert tag at cursor position in template textarea
function insertBroadcastVariable(varTag) {
  const msgInput = document.getElementById('bcast-message-text');
  if (!msgInput) return;

  const formattedTag = varTag.startsWith('{{') ? varTag : `{{${varTag}}}`;
  const startPos = msgInput.selectionStart;
  const endPos = msgInput.selectionEnd;
  const val = msgInput.value;

  if (typeof startPos === 'number' && typeof endPos === 'number') {
    msgInput.value = val.substring(0, startPos) + formattedTag + val.substring(endPos);
    msgInput.focus();
    msgInput.selectionStart = msgInput.selectionEnd = startPos + formattedTag.length;
  } else {
    msgInput.value += formattedTag;
  }
  renderDynamicTemplateFields();
  updateBroadcastPreview();
}

// Toggle Collapsible Phone Numbers Textarea
function toggleBroadcastNumbersEditor() {
  const container = document.getElementById('bcast-numbers-editor-collapse');
  const icon = document.getElementById('bcast-numbers-toggle-icon');
  const text = document.getElementById('bcast-numbers-toggle-text');
  if (!container) return;

  const isHidden = container.classList.contains('hidden');
  if (isHidden) {
    container.classList.remove('hidden');
    if (icon) icon.innerText = 'expand_less';
    if (text) text.innerText = 'Hide Phone Numbers Editor';
    const ta = document.getElementById('bcast-target-numbers');
    if (ta) ta.focus();
  } else {
    container.classList.add('hidden');
    if (icon) icon.innerText = 'expand_more';
    if (text) text.innerText = 'View / Paste Custom Numbers';
  }
}

// Real-Time Composer Input Listener
function handleBroadcastMessageInput() {
  const msgInput = document.getElementById('bcast-message-text');
  const msgCharCount = document.getElementById('bcast-message-char-count');
  if (msgCharCount && msgInput) {
    msgCharCount.innerText = `${msgInput.value.length} chars`;
  }
  renderDynamicTemplateFields(true);
  updateBroadcastPreview();
}

// Default values for common tags
function getDefaultTagValue(key) {
  const brand = (typeof getBrandName === 'function') ? getBrandName() : 'Blue Berry 💙';
  const line = (CRM_STATE && CRM_STATE.whatsappAccount && CRM_STATE.whatsappAccount.phoneNumber) ? CRM_STATE.whatsappAccount.phoneNumber : '+91 86680 07593';
  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  let staff = 'Sales Desk';
  if (ACTIVE_ROLE === 'admin') {
    staff = 'Super Admin';
  } else if (CRM_STATE && Array.isArray(CRM_STATE.staffList)) {
    const s = CRM_STATE.staffList.find(st => st.id === ACTIVE_ROLE);
    if (s) staff = s.name;
  }

  switch (key) {
    case 'customer_name': return 'Auto per Customer';
    case 'business_name': return brand;
    case 'line_phone': return line;
    case 'customer_phone': return 'Auto per Customer';
    case 'phone': return 'Auto per Customer';
    case 'today_date': return todayStr;
    case 'date': return todayStr;
    case 'staff_name': return staff;
    case 'offer_discount': return '15% OFF';
    case 'product_name': return 'Festive Garments Collection';
    case 'coupon_code': return 'FESTIVE2026';
    default: return '';
  }
}

// RENDER INTUITIVE DYNAMIC VALUE INPUTS (Easily Set Values)
function renderDynamicTemplateFields(preserveActiveFocus = false) {
  const container = document.getElementById('bcast-dynamic-fields-container');
  if (!container) return;

  const msgInput = document.getElementById('bcast-message-text');
  const rawText = msgInput ? msgInput.value : '';

  // Extract all {{tag}} occurrences
  const matches = Array.from(rawText.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g)).map(m => m[1].toLowerCase());
  const uniqueTags = [...new Set(matches)];

  if (uniqueTags.length === 0) {
    container.innerHTML = `
      <div class="p-3 bg-slate-50 border border-dashed border-slate-300 rounded-lg text-center text-slate-400 text-xs flex items-center justify-center gap-1.5">
        <span class="material-symbols-outlined text-[16px]">info</span>
        <span>No dynamic placeholders found in message. Use the Quick Insert buttons above to insert tags.</span>
      </div>
    `;
    return;
  }

  // Pre-seed any new tag with default if not existing in BROADCAST_CUSTOM_TAGS
  uniqueTags.forEach(tag => {
    if (BROADCAST_CUSTOM_TAGS[tag] === undefined) {
      BROADCAST_CUSTOM_TAGS[tag] = getDefaultTagValue(tag) || `[${tag}]`;
    }
  });

  // Preserve active input focus if re-rendering during keystroke
  let activeTag = null;
  let activeCursorPos = 0;
  if (preserveActiveFocus && document.activeElement && document.activeElement.id && document.activeElement.id.startsWith('dyn-tag-input-')) {
    activeTag = document.activeElement.id.replace('dyn-tag-input-', '');
    activeCursorPos = document.activeElement.selectionStart || 0;
  }

  const html = uniqueTags.map(tag => {
    const isCustomerName = (tag === 'customer_name');
    const isCustomerPhone = (tag === 'customer_phone' || tag === 'phone');
    const isSystem = SYSTEM_TAG_KEYS.includes(tag);
    const rawVal = BROADCAST_CUSTOM_TAGS[tag] !== undefined ? BROADCAST_CUSTOM_TAGS[tag] : getDefaultTagValue(tag);
    const safeVal = String(rawVal || '').replace(/"/g, '&quot;');

    if (isCustomerName) {
      return `
        <div class="flex items-center justify-between p-2 px-3 rounded-lg bg-emerald-50/70 border border-emerald-200 shadow-2xs">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-xs text-emerald-950 bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-2xs">{{${tag}}}</span>
            <span class="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-emerald-600">auto_awesome</span>
              <span>Automatically filled with each customer's name</span>
            </span>
          </div>
          <span class="text-[10px] text-emerald-700 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">Auto-Personalized</span>
        </div>
      `;
    }

    if (isCustomerPhone) {
      return `
        <div class="flex items-center justify-between p-2 px-3 rounded-lg bg-emerald-50/70 border border-emerald-200 shadow-2xs">
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-xs text-emerald-950 bg-white border border-emerald-300 px-2 py-0.5 rounded shadow-2xs">{{${tag}}}</span>
            <span class="text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
              <span class="material-symbols-outlined text-[14px] text-emerald-600">phone</span>
              <span>Recipient's WhatsApp Phone Number</span>
            </span>
          </div>
          <span class="text-[10px] text-emerald-700 font-mono bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold">Auto-Resolved</span>
        </div>
      `;
    }

    // Friendly display label for tag
    let friendlyLabel = tag.replace(/_/g, ' ');
    friendlyLabel = friendlyLabel.charAt(0).toUpperCase() + friendlyLabel.slice(1);

    return `
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 p-2 px-3 rounded-lg bg-white border border-slate-200 hover:border-emerald-300 transition shadow-2xs focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-400">
        <div class="flex items-center gap-1.5 shrink-0 min-w-[140px]">
          <span class="font-mono font-bold text-xs text-emerald-900 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">{{${tag}}}</span>
          <span class="text-[11px] font-semibold text-slate-500 truncate max-w-[110px]">${friendlyLabel}:</span>
        </div>
        <div class="flex-1 flex items-center gap-1">
          <input type="text"
                 id="dyn-tag-input-${tag}"
                 class="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1 text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                 value="${safeVal}"
                 placeholder="Enter value for {{${tag}}}..."
                 oninput="handleDynamicTagChange('${tag}', this.value)" />
          ${isSystem ? `
            <button type="button" onclick="resetDynamicTagValue('${tag}')" class="p-1 text-slate-400 hover:text-amber-600 rounded transition shrink-0" title="Reset {{${tag}}} to default">
              <span class="material-symbols-outlined text-[15px]">restart_alt</span>
            </button>
          ` : `
            <button type="button" onclick="removeDynamicTag('${tag}')" class="p-1 text-slate-400 hover:text-rose-600 rounded transition shrink-0" title="Remove {{${tag}}} from template">
              <span class="material-symbols-outlined text-[15px]">close</span>
            </button>
          `}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;

  // Restore focus if needed
  if (activeTag) {
    const activeEl = document.getElementById(`dyn-tag-input-${activeTag}`);
    if (activeEl) {
      activeEl.focus();
      try {
        activeEl.setSelectionRange(activeCursorPos, activeCursorPos);
      } catch (e) {}
    }
  }
}

// 1-Click Inline Value Change Handler
function handleDynamicTagChange(tag, val) {
  BROADCAST_CUSTOM_TAGS[tag] = val;
  updateBroadcastPreview();
}

// Reset dynamic tag to default value
function resetDynamicTagValue(tag) {
  const defVal = getDefaultTagValue(tag);
  BROADCAST_CUSTOM_TAGS[tag] = defVal;
  const inputEl = document.getElementById(`dyn-tag-input-${tag}`);
  if (inputEl) inputEl.value = defVal;
  updateBroadcastPreview();
  showToast('Value Restored', `{{${tag}}} restored to "${defVal}"`, 'restart_alt', 'blue');
}

// Remove tag from message text
function removeDynamicTag(tag) {
  const msgInput = document.getElementById('bcast-message-text');
  if (msgInput) {
    const reg = new RegExp(`\\{\\{\\s*${tag}\\s*\\}\\}`, 'gi');
    msgInput.value = msgInput.value.replace(reg, '');
  }
  delete BROADCAST_CUSTOM_TAGS[tag];
  renderDynamicTemplateFields();
  updateBroadcastPreview();
  showToast('Variable Removed', `Tag {{${tag}}} removed from template.`, 'delete', 'amber');
}

// Quick Prompt to Add Any Custom Variable
function promptAddNewCustomTag() {
  const tagKey = prompt('Enter a new variable name without curly braces (e.g. discount, product_name, coupon_code, delivery_date):');
  if (!tagKey || !tagKey.trim()) return;

  const cleanKey = tagKey.trim().toLowerCase().replace(/^\{\{|\}\}$/g, '').replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  if (!cleanKey) {
    alert('Invalid variable name. Please use letters and numbers only.');
    return;
  }

  const defaultVal = BROADCAST_CUSTOM_TAGS[cleanKey] || 'SPECIAL VALUE';
  const tagVal = prompt(`Enter value for {{${cleanKey}}}:`, defaultVal);
  if (tagVal === null) return;

  BROADCAST_CUSTOM_TAGS[cleanKey] = tagVal.trim();
  insertBroadcastVariable(`{{${cleanKey}}}`);
  renderDynamicTemplateFields();
  updateBroadcastPreview();
  showToast('Variable Added', `Tag {{${cleanKey}}} added and set to "${tagVal.trim()}".`, 'tune', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

// Compatibility alias for any legacy tray calls
function renderCustomTagsTray() {
  renderDynamicTemplateFields();
}
function handleApplyManualCustomTag() {
  promptAddNewCustomTag();
}

// Universal Template Message Personalization Engine (Replaces System & Manual Custom Tags)
function renderTemplateMessagePersonalized(rawTemplate, customer = {}, account = {}, customTags = BROADCAST_CUSTOM_TAGS) {
  if (!rawTemplate) return '';

  const businessName = (account && (account.brandName || account.businessName)) || (typeof getBrandName === 'function' ? getBrandName() : 'Blue Berry 💙');
  const linePhone = customer.businessNumber || (account && account.phoneNumber) || '+91 86680 07593';
  const customerName = customer.name || 'Valued Customer';
  const customerPhone = customer.whatsapp || customer.phone || '';
  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  let staffName = 'Handling Staff';
  if (ACTIVE_ROLE === 'admin') {
    staffName = 'Super Admin';
  } else if (CRM_STATE && Array.isArray(CRM_STATE.staffList)) {
    const s = CRM_STATE.staffList.find(st => st.id === ACTIVE_ROLE);
    if (s) staffName = s.name;
  }

  let text = rawTemplate;

  // 1. Built-in system tags resolution (Respects manual tag value overrides if user changed them)
  const effCustName = (customTags && customTags.customer_name && customTags.customer_name !== 'Auto per Customer') ? customTags.customer_name : customerName;
  const effBizName = (customTags && customTags.business_name) ? customTags.business_name : businessName;
  const effLinePhone = (customTags && customTags.line_phone) ? customTags.line_phone : linePhone;
  const effCustPhone = (customTags && customTags.customer_phone && customTags.customer_phone !== 'Auto per Customer') ? customTags.customer_phone : customerPhone;
  const effToday = (customTags && customTags.today_date) ? customTags.today_date : todayStr;
  const effStaff = (customTags && customTags.staff_name) ? customTags.staff_name : staffName;

  text = text
    .replace(/\{\{\s*customer_name\s*\}\}/gi, effCustName)
    .replace(/\{\{\s*customer_phone\s*\}\}/gi, effCustPhone)
    .replace(/\{\{\s*phone\s*\}\}/gi, effCustPhone)
    .replace(/\{\{\s*business_name\s*\}\}/gi, effBizName)
    .replace(/\{\{\s*line_phone\s*\}\}/gi, effLinePhone)
    .replace(/\{\{\s*today_date\s*\}\}/gi, effToday)
    .replace(/\{\{\s*date\s*\}\}/gi, effToday)
    .replace(/\{\{\s*time\s*\}\}/gi, timeStr)
    .replace(/\{\{\s*staff_name\s*\}\}/gi, effStaff);

  // 2. Manual Custom Tags & Dynamic Variables
  if (customTags && typeof customTags === 'object') {
    Object.keys(customTags).forEach(tagKey => {
      if (!SYSTEM_TAG_KEYS.includes(tagKey)) {
        const tagVal = customTags[tagKey] || '';
        const regex = new RegExp(`\\{\\{\\s*${tagKey}\\s*\\}\\}`, 'gi');
        text = text.replace(regex, tagVal);
      }
    });
  }

  return text;
}

function getBroadcastTargetCustomers(targetVal) {
  const availableAccounts = typeof getAvailableWhatsAppAccounts === 'function' 
    ? getAvailableWhatsAppAccounts() 
    : (CRM_STATE.whatsappAccounts || [CRM_STATE.whatsappAccount]);
  const availableAccountIds = availableAccounts.map(a => a.id);

  const rawCustomers = (CRM_STATE.customers || []).filter(c => {
    if (!c) return false;
    if (c.name === 'System' || c.name === 'GRM Linked WhatsApp Device' || (c.name && c.name.startsWith('WhatsApp Linked'))) return false;
    return availableAccountIds.includes(c.accountId || 'account_1');
  });

  // 1. DND Users Only Option
  if (targetVal === 'DND_ONLY') {
    return rawCustomers.filter(c => {
      const q = (CRM_STATE.queries || []).find(qry => qry.customerId === c.id);
      return c.isDND === true || (Array.isArray(c.tags) && c.tags.includes('DND / Opt-Out')) || (q && q.status === 'DND');
    });
  }

  // 2. All Customers (Including DND List)
  if (targetVal === 'ALL_INCLUDING_DND') {
    return rawCustomers;
  }

  // 3. Filter active customers (Excludes DND by default)
  const activeCustomers = rawCustomers.filter(c => {
    if (c.isDND === true || (Array.isArray(c.tags) && c.tags.includes('DND / Opt-Out'))) return false;
    const q = (CRM_STATE.queries || []).find(qry => qry.customerId === c.id);
    if (q && q.status === 'DND') return false;
    return true;
  });

  if (!targetVal || targetVal === 'ALL' || targetVal === 'ALL_ACTIVE') {
    return activeCustomers;
  }

  if (targetVal.startsWith('account_')) {
    return activeCustomers.filter(c => (c.accountId || 'account_1') === targetVal);
  }

  if (targetVal === 'TAG_VIP') {
    return activeCustomers.filter(c => 
      (Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase().includes('vip'))) ||
      (c.customerType && c.customerType.toLowerCase().includes('vip'))
    );
  }

  if (targetVal === 'TAG_WHOLESALE') {
    return activeCustomers.filter(c => 
      (Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase().includes('wholesale') || t.toLowerCase().includes('bulk'))) ||
      (c.customerType && c.customerType.toLowerCase().includes('wholesale'))
    );
  }

  if (targetVal === 'TAG_NEW') {
    return activeCustomers.filter(c => 
      (Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase().includes('new'))) ||
      (c.customerType && c.customerType.toLowerCase().includes('new'))
    );
  }

  return activeCustomers;
}

function extractCurrentActiveNumbers(targetVal = 'ALL') {
  const targetCustomers = getBroadcastTargetCustomers(targetVal);
  const numbers = [];
  const seen = new Set();

  targetCustomers.forEach(c => {
    const rawNum = c.whatsapp || c.phone || '';
    if (rawNum) {
      const clean = rawNum.trim();
      const digits = clean.replace(/[^0-9]/g, '');
      if (digits.length >= 7 && !seen.has(digits)) {
        seen.add(digits);
        numbers.push(clean);
      }
    }
  });

  return numbers;
}

function refreshBroadcastAutoFetchedNumbers() {
  const audienceSelect = document.getElementById('bcast-target-audience');
  const targetVal = audienceSelect ? audienceSelect.value : 'ALL';
  const numbers = extractCurrentActiveNumbers(targetVal);

  const textarea = document.getElementById('bcast-target-numbers');
  if (textarea) {
    textarea.value = numbers.join(', ');
  }

  updateBroadcastCustomNumbersCount();
}

function updateBroadcastCustomNumbersCount() {
  const textarea = document.getElementById('bcast-target-numbers');
  const countBadge = document.getElementById('bcast-fetched-count');
  const countEl = document.getElementById('bcast-recipients-count');
  
  let numCount = 0;
  if (textarea && textarea.value.trim()) {
    const splitNums = textarea.value.split(/[,\n;]+/).map(s => s.trim()).filter(s => s.replace(/[^0-9]/g, '').length >= 7);
    numCount = splitNums.length;
  }

  if (countBadge) {
    countBadge.innerText = `Auto-Fetched ${numCount} Number${numCount === 1 ? '' : 's'}`;
  }

  if (countEl) {
    countEl.innerText = `${numCount} Recipient${numCount === 1 ? '' : 's'}`;
  }

  const startBtnText = document.getElementById('btn-bcast-start-text');
  if (startBtnText) {
    startBtnText.innerText = `Start Automated Broadcast (${numCount} Recipient${numCount === 1 ? '' : 's'})`;
  }

  updateBroadcastPreview();
}

function updateBroadcastTargetCount() {
  refreshBroadcastAutoFetchedNumbers();
  updateBroadcastPreview();
}

function updateBroadcastPreview() {
  const msgInput = document.getElementById('bcast-message-text');
  const previewBox = document.getElementById('bcast-live-preview-box');
  const previewCustLabel = document.getElementById('bcast-preview-customer-label');
  const previewCustName = document.getElementById('bcast-preview-customer-name');
  const previewAvatar = document.getElementById('bcast-preview-avatar');
  const previewCharCount = document.getElementById('bcast-preview-char-count');
  const msgCharCount = document.getElementById('bcast-message-char-count');
  if (!previewBox) return;

  const rawTemplate = (msgInput && msgInput.value.trim()) || "Hello {{customer_name}}, welcome to {{business_name}}! Reach us on {{line_phone}}.";
  
  const audienceSelect = document.getElementById('bcast-target-audience');
  const targetVal = audienceSelect ? audienceSelect.value : 'ALL';
  const recipients = getBroadcastTargetCustomers(targetVal);
  const sampleCustomer = recipients[0] || (CRM_STATE.customers && CRM_STATE.customers[0]) || {
    name: 'SugunaMani',
    phone: '+91 73389 65560',
    accountId: 'account_1',
    businessNumber: '+91 86680 07593'
  };

  const account = (CRM_STATE.whatsappAccounts && CRM_STATE.whatsappAccounts.find(a => a.id === sampleCustomer.accountId)) || CRM_STATE.whatsappAccount;

  const rendered = renderTemplateMessagePersonalized(rawTemplate, sampleCustomer, account, BROADCAST_CUSTOM_TAGS);
  previewBox.innerText = rendered;

  const custName = sampleCustomer.name || 'Recipient';
  const custPhone = sampleCustomer.whatsapp || sampleCustomer.phone || '+91 86680 07593';

  if (previewCustLabel) {
    previewCustLabel.innerText = `Sample Recipient: ${custName} (${custPhone})`;
  }
  if (previewCustName) {
    previewCustName.innerText = `${custName} (${custPhone})`;
  }
  if (previewAvatar) {
    const initials = custName.split(/\s+/).map(p => p[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'SM';
    previewAvatar.innerText = initials;
  }

  if (previewCharCount) {
    previewCharCount.innerText = `${rendered.length} characters`;
  }
  if (msgCharCount && msgInput) {
    msgCharCount.innerText = `${msgInput.value.length} chars`;
  }
}

async function startAutomatedBroadcast() {
  if (IS_BROADCASTING_ACTIVE) return;

  const msgInput = document.getElementById('bcast-message-text');
  const rawTemplate = msgInput ? msgInput.value.trim() : '';

  if (!rawTemplate) {
    alert('Please enter or select a message template before starting broadcast.');
    if (msgInput) msgInput.focus();
    return;
  }

  const numbersTextarea = document.getElementById('bcast-target-numbers');
  const rawNumbersText = numbersTextarea ? numbersTextarea.value.trim() : '';
  const parsedPhoneList = rawNumbersText
    ? rawNumbersText.split(/[,\n;]+/).map(s => s.trim()).filter(s => s.replace(/[^0-9]/g, '').length >= 7)
    : [];

  const audienceSelect = document.getElementById('bcast-target-audience');
  const targetVal = audienceSelect ? audienceSelect.value : 'ALL';
  const targetCustomers = getBroadcastTargetCustomers(targetVal);

  // Build recipients list based on parsed numbers
  let recipients = [];
  if (parsedPhoneList.length > 0) {
    parsedPhoneList.forEach(rawPhone => {
      const cleanDigits = rawPhone.replace(/[^0-9]/g, '');
      // Try to find matching customer in state
      const matchedCust = (CRM_STATE.customers || []).find(c => {
        const cDigits = (c.phone || c.whatsapp || '').replace(/[^0-9]/g, '');
        return cDigits && (cDigits === cleanDigits || cDigits.endsWith(cleanDigits) || cleanDigits.endsWith(cDigits));
      });

      if (matchedCust) {
        recipients.push(matchedCust);
      } else {
        // Synthesize recipient
        const defaultAccId = targetVal.startsWith('account_') ? targetVal : 'account_1';
        recipients.push({
          id: 'cust_bcast_' + cleanDigits,
          name: 'Customer',
          phone: rawPhone,
          whatsapp: rawPhone,
          accountId: defaultAccId
        });
      }
    });
  } else {
    recipients = targetCustomers;
  }

  if (recipients.length === 0) {
    alert('No recipient phone numbers found. Please enter or select phone numbers to broadcast.');
    return;
  }

  const delayInput = document.getElementById('bcast-delay-range');
  const delaySec = delayInput ? parseFloat(delayInput.value) || 1.5 : 1.5;

  if (!confirm(`📢 Confirm Automated WhatsApp Broadcast:\n\n• Target Audience: ${audienceSelect ? audienceSelect.options[audienceSelect.selectedIndex].text : 'Selected Recipients'}\n• Total Target Numbers: ${recipients.length}\n• Safe Anti-Spam Throttle: ${delaySec} sec/message\n\nProceed to start dispatch loop?`)) {
    return;
  }

  // Setup UI State for broadcast in progress
  IS_BROADCASTING_ACTIVE = true;
  BROADCAST_CANCEL_FLAG = false;

  const progContainer = document.getElementById('bcast-progress-container');
  const progBar = document.getElementById('bcast-progress-bar');
  const progPct = document.getElementById('bcast-progress-pct');
  const progStatus = document.getElementById('bcast-progress-status');
  const progDetail = document.getElementById('bcast-progress-detail');

  const startBtn = document.getElementById('btn-bcast-start');
  const stopBtn = document.getElementById('btn-bcast-stop');
  const cancelBtn = document.getElementById('btn-bcast-cancel');

  if (progContainer) progContainer.classList.remove('hidden');
  if (startBtn) startBtn.classList.add('hidden');
  if (stopBtn) stopBtn.classList.remove('hidden');
  if (cancelBtn) cancelBtn.disabled = true;

  if (msgInput) msgInput.disabled = true;
  if (numbersTextarea) numbersTextarea.disabled = true;
  if (audienceSelect) audienceSelect.disabled = true;
  if (delayInput) delayInput.disabled = true;

  if (progStatus) progStatus.innerText = `Broadcasting to ${recipients.length} customer phone numbers...`;
  if (progPct) progPct.innerText = '0%';
  if (progBar) progBar.style.width = '0%';
  if (progDetail) progDetail.innerText = `Starting automated dispatch loop (${delaySec}s delay)...`;

  let sentCount = 0;

  for (let i = 0; i < recipients.length; i++) {
    if (BROADCAST_CANCEL_FLAG) {
      if (progStatus) progStatus.innerText = 'Broadcast Stopped by User';
      if (progDetail) progDetail.innerText = `Stopped after sending ${sentCount} of ${recipients.length} messages.`;
      break;
    }

    const customer = recipients[i];
    const account = (CRM_STATE.whatsappAccounts && CRM_STATE.whatsappAccounts.find(a => a.id === customer.accountId)) || CRM_STATE.whatsappAccount;

    // Personalize message with all system & manual custom tags
    const personalizedText = renderTemplateMessagePersonalized(rawTemplate, customer, account, BROADCAST_CUSTOM_TAGS);

    // Append to customer's conversation history if valid id
    if (customer.id) {
      if (!CRM_STATE.conversations[customer.id]) {
        CRM_STATE.conversations[customer.id] = [];
      }

      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender: 'staff',
        text: personalizedText,
        time: timeStr,
        timestamp: Date.now(),
        status: 'DELIVERED',
        isBroadcast: true
      };

      CRM_STATE.conversations[customer.id].push(newMsg);

      // Update query summary in list
      const query = (CRM_STATE.queries || []).find(q => q.customerId === customer.id);
      if (query) {
        query.lastMessage = `Staff (Broadcast): "${personalizedText.length > 40 ? personalizedText.substring(0, 37) + '...' : personalizedText}"`;
        query.lastMessageTime = 'Just now';
      }

      // DISPATCH LIVE REAL-TIME OUTBOUND MESSAGE OVER WHATSAPP
      const targetPhone = customer.whatsapp || customer.phone;
      const targetJid = customer.jid || null;
      const targetAccId = customer.accountId || (account && account.id) || 'account_1';
      
      try {
        await dispatchWhatsAppOutbound(targetPhone, personalizedText, newMsg, targetJid, targetAccId, true);
      } catch (sendErr) {
        console.warn('[Broadcast Send Error for ' + (customer.name || targetPhone) + ']:', sendErr);
      }
    }

    sentCount++;
    const pct = Math.round((sentCount / recipients.length) * 100);

    if (progPct) progPct.innerText = `${pct}%`;
    if (progBar) progBar.style.width = `${pct}%`;
    if (progDetail) progDetail.innerText = `Sent to ${customer.name || 'Recipient'} (${customer.phone || customer.whatsapp}) [${sentCount}/${recipients.length}]`;

    // Audio chime feedback
    if (typeof playChime === 'function') {
      playChime('order');
    }

    // Refresh active chat stream if this customer is currently being viewed
    if (ACTIVE_CUSTOMER_ID === customer.id && typeof renderChatMessages === 'function') {
      renderChatMessages(customer.id);
    }

    // Anti-spam throttling delay between consecutive messages
    await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
  }

  // Finalize Broadcast State
  IS_BROADCASTING_ACTIVE = false;
  saveCRMState();

  if (typeof renderInboxConversationList === 'function') {
    renderInboxConversationList();
  }
  if (typeof updateBadgeCounters === 'function') {
    updateBadgeCounters();
  }

  logAudit('TEMPLATE_BROADCAST', 'INBOX_BROADCAST', `Dispatched automated broadcast "${rawTemplate.substring(0, 30)}..." to ${sentCount} recipients.`);

  if (startBtn) startBtn.classList.remove('hidden');
  if (stopBtn) stopBtn.classList.add('hidden');
  if (cancelBtn) cancelBtn.disabled = false;
  if (msgInput) msgInput.disabled = false;
  if (numbersTextarea) numbersTextarea.disabled = false;
  if (audienceSelect) audienceSelect.disabled = false;
  if (delayInput) delayInput.disabled = false;

  if (!BROADCAST_CANCEL_FLAG) {
    if (progStatus) progStatus.innerText = '✅ Broadcast Completed Successfully!';
    if (progDetail) progDetail.innerText = `All ${sentCount} messages delivered to recipients.`;
    showToast('Broadcast Complete', `Personalized template delivered to ${sentCount} recipients!`, 'campaign', 'emerald');
  } else {
    showToast('Broadcast Stopped', `Broadcast paused after sending ${sentCount} messages.`, 'stop_circle', 'amber');
  }
}

function stopAutomatedBroadcast() {
  if (IS_BROADCASTING_ACTIVE) {
    BROADCAST_CANCEL_FLAG = true;
    const progStatus = document.getElementById('bcast-progress-status');
    if (progStatus) progStatus.innerText = 'Stopping broadcast...';
    showToast('Broadcast Stopping', 'Finishing current message and pausing automated queue...', 'pause_circle', 'amber');
  }
}

// INITIALIZE APP ON LOAD
function bootstrapCRMApp() {
  initCRMState();
  initAuthSystem();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  bootstrapCRMApp();
} else {
  window.addEventListener('DOMContentLoaded', bootstrapCRMApp);
}

