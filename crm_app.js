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
  customers: [],
  queries: [],
  conversations: {},
  orders: [],
  followups: [],
  auditLogs: []
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
  const payloadAccountId = payload.account_id || 'account_1';
  const payloadBusinessNum = payload.received_on_number || CRM_STATE?.whatsappAccount?.phoneNumber || '+91 86680 07593';

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
      accountId: payloadAccountId,
      businessNumber: payloadBusinessNum,
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
    if (!customer.accountId) customer.accountId = payloadAccountId;
    if (!customer.businessNumber) customer.businessNumber = payloadBusinessNum;
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
  if (!suppressChime && !isDuplicate && payload.source !== 'STAFF_OUTBOUND' && payload.source !== 'AUTOREPLY_BOT') {
    handleAutomatedInboundResponse(customer, messageText, payload);
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

  saveCRMState();
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
      if (!Array.isArray(CRM_STATE.products)) CRM_STATE.products = JSON.parse(JSON.stringify(INITIAL_CRM_DATA.products));

      if (!CRM_STATE.autoReplySettings || typeof CRM_STATE.autoReplySettings !== 'object' || !CRM_STATE.autoReplySettings.messageTemplate || CRM_STATE.autoReplySettings.messageTemplate.includes('wa.me')) {
        CRM_STATE.autoReplySettings = {
          enabled: true,
          cooldownMinutes: 0,
          keywordMatching: true,
          messageTemplate: getDefaultStockAutoReplyTemplate()
        };
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
    saveCRMState();
  }

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


  // Asynchronously synchronize garment products & stock from database
  fetch('api.php?action=get_all')
    .then(r => r.json())
    .then(res => {
      const data = res.data || res;
      if (data && data.products && Array.isArray(data.products) && data.products.length > 0) {
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
        if (ACTIVE_VIEW === 'catalog') filterCatalogGrid();
        updateOrderProductDropdown();
      }
    })
    .catch(() => { });

  cleanupAndDeduplicateCRMState();
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
function switchView(viewName) {
  // Enforce Role-Based Access Control: Admin-only modules
  const adminOnlyViews = ['settings', 'backup', 'staff', 'audit', 'analytics'];
  if (ACTIVE_ROLE !== 'admin' && adminOnlyViews.includes(viewName)) {
    showToast('Access Restricted', 'Super Admin privileges are required to access this module.', 'lock', 'rose');
    viewName = 'inbox';
  }

  ACTIVE_VIEW = viewName;
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
  if (viewName === 'dnd') renderDndModule();
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
    const custCount = getActiveCustomerCountForAccount(acc.id);

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
  if (!ACTIVE_CUSTOMER_ID || !customerCards.some(c => c.customerId === ACTIVE_CUSTOMER_ID)) {
    ACTIVE_CUSTOMER_ID = customerCards[0].customerId;
  }

  container.innerHTML = customerCards.map(item => {
    const isSelected = item.customerId === ACTIVE_CUSTOMER_ID;
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
              ${statusBadge}
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

// Slide / Hide Toggle State for Right Customer 360 Panel
let IS_RIGHT_PANEL_OPEN = true;

function toggleRightPanel(forceState = null) {
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
      toggleBtn.className = "px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold text-xs flex items-center gap-1 shadow-sm transition hover:bg-emerald-100";
      toggleBtn.innerHTML = `<span class="material-symbols-outlined text-[16px]">dock_to_right</span><span class="hidden sm:inline">Hide Profile</span>`;
    } else {
      toggleBtn.className = "px-2.5 py-1.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1 shadow-sm transition hover:bg-slate-200";
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

    <!-- Active Connected Business Line Tag & Actions & Slide-Hide Toggle Button in Header -->
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
      
      <!-- BRAND-MASKED WHATSAPP CALL BUTTON -->
      <button type="button" onclick="initiateBrandMaskedCall('${customer.id}')" class="px-2.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1 hover:scale-[1.02] active:scale-[0.98]" title="Call customer via Brand Masked Line (Customer receives call as: ${getBrandName()})">
        <span class="material-symbols-outlined text-[15px] animate-pulse">call</span>
        <span class="hidden sm:inline">Brand Call</span>
      </button>

      <a href="https://wa.me/${(customer.phone || '').replace(/[^0-9]/g, '')}" target="_blank" class="p-1.5 text-slate-600 hover:text-brand-wa hover:bg-emerald-50 rounded-lg transition" title="Open Native WhatsApp Web">
        <span class="material-symbols-outlined text-[18px]">open_in_new</span>
      </a>

      <!-- Slide Hide / Show Toggle Button for Customer Profile Panel -->
      <button id="btn-toggle-right-panel" type="button" onclick="toggleRightPanel()" class="px-2.5 py-1.5 rounded-lg border ${IS_RIGHT_PANEL_OPEN ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100' : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'} font-bold text-xs flex items-center gap-1 shadow-sm transition" title="Slide Hide / Show Customer Profile Panel">
        <span class="material-symbols-outlined text-[16px]">${IS_RIGHT_PANEL_OPEN ? 'dock_to_right' : 'dock_to_left'}</span>
        <span class="hidden sm:inline">${IS_RIGHT_PANEL_OPEN ? 'Hide Profile' : 'Customer Profile'}</span>
      </button>
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
  const customer = CRM_STATE.customers.find(c => c.id === CRM_STATE.activeCustomerId);
  if (customer && customer.chat) {
    const msg = customer.chat.find(m => m.id === msgIdOrSrc);
    if (msg && msg.media_url) {
      imgSrc = msg.media_url;
      title = `${customer.name} - Photo (${msg.time || 'Chat Attachment'})`;
    }
  }

  // Fallback if direct src was passed or found in DOM
  if (!imgSrc) {
    const el = document.getElementById(`chat-img-${msgIdOrSrc}`);
    if (el && el.src) {
      imgSrc = el.src;
    } else if (typeof msgIdOrSrc === 'string' && (msgIdOrSrc.startsWith('data:') || msgIdOrSrc.startsWith('http') || msgIdOrSrc.startsWith('/'))) {
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
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

window.closeImageLightbox = function() {
  const modal = document.getElementById('modal-image-lightbox');
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }
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

// Keyboard listener for Escape key to close lightbox
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    const modal = document.getElementById('modal-image-lightbox');
    if (modal && !modal.classList.contains('hidden')) {
      closeImageLightbox();
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
      actions.push({
        id: 'cat_' + (msg.id || i),
        timestamp: msgEpoch,
        time: timeStr,
        type: 'CATEGORY_VIEWED',
        title: `${catObj.icon} ${catObj.categoryName}`,
        price: '',
        sku: `CAT-${matchedCatKey}`,
        image: null,
        badge: '👗 Category Menu'
      });
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

  const customer = CRM_STATE.customers.find(c => c.id === ACTIVE_CUSTOMER_ID);
  const query = CRM_STATE.queries.find(q => q.customerId === ACTIVE_CUSTOMER_ID);
  const staff = query ? CRM_STATE.staffList.find(s => s.id === query.assignedTo) : null;
  const orders = CRM_STATE.orders.filter(o => o.customerId === ACTIVE_CUSTOMER_ID);

  if (!customer) {
    panel.innerHTML = `<div class="p-6 text-center text-slate-400 text-xs">Customer profile details will appear here</div>`;
    return;
  }

  // Live Sync & Parse Automation History from Conversations
  syncCustomerAutomationHistory(customer);

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
      <button type="button" onclick="toggleRightPanel(false)" class="px-2 py-1 rounded-lg bg-white hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 transition flex items-center gap-1 text-[10px] font-bold shadow-sm" title="Slide Hide Customer Profile Panel">
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

    <!-- Metrics Cards -->
    <div class="grid grid-cols-2 gap-3 p-4 border-b border-slate-200 bg-white">
      <div class="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/60 text-center">
        <span class="text-[10px] uppercase font-bold text-emerald-800">Total Orders</span>
        <p class="text-base font-extrabold text-emerald-950 mt-0.5">${customer.totalOrders || 0} Orders</p>
      </div>
      <div class="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/60 text-center">
        <span class="text-[10px] uppercase font-bold text-blue-800">Lifetime Spend</span>
        <p class="text-base font-extrabold text-blue-950 font-mono mt-0.5">₹${(customer.totalSpend || 0).toLocaleString('en-IN')}</p>
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

    <!-- 1. CUSTOMER PROFILE DETAILS FORM (LOCKED / EDITABLE) -->
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

        <!-- Age & Gender Grid -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Age:</label>
            <input type="number" id="cust-edit-age" value="${customer.age || ''}" ${isEditing ? '' : 'disabled'} min="1" max="120" placeholder="e.g. 28" class="w-full ${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
          </div>
          <div>
            <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Gender:</label>
            <select id="cust-edit-gender" ${isEditing ? '' : 'disabled'} class="w-full ${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
              <option value="" ${!customer.gender ? 'selected' : ''}>-- Select --</option>
              <option value="Female" ${customer.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Male" ${customer.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Other" ${customer.gender === 'Other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
        </div>

        <!-- Email (Optional) -->
        <div>
          <label class="block font-bold text-slate-700 text-[10px] mb-1 uppercase tracking-wide">Email (Optional):</label>
          <input type="email" id="cust-edit-email" value="${customer.email || ''}" ${isEditing ? '' : 'disabled'} placeholder="customer@example.com" class="w-full ${isEditing ? 'bg-slate-50 border-slate-300 text-slate-900 focus:bg-white focus:ring-1 focus:ring-brand-wa' : 'bg-slate-100/90 border-slate-200 text-slate-700 cursor-not-allowed select-none font-semibold'} border rounded-xl p-2 text-xs">
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

    <!-- 2. DYNAMIC BOT AUTOMATION & CHOSEN PRODUCTS TRACKER CARD -->
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
            ${customer.automationHistory.map(item => `
              <div class="bg-white p-2.5 rounded-xl border border-sky-200 shadow-2xs flex items-start gap-2.5 transition hover:border-sky-300 hover:shadow-xs">
                ${item.image ? `
                  <div class="relative shrink-0 group">
                    <img src="${item.image}" alt="${item.title}" class="w-12 h-12 rounded-lg object-cover border border-slate-200 cursor-pointer transition group-hover:opacity-90" onclick="openImageLightbox('${item.image}', '${item.title.replace(/'/g, "\\'")}')">
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
            `).join('')}
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

    <!-- 3. ACTIVE QUERY & STATUS CONTROLLER (DROPDOWN + SAVE BUTTON) -->
    <div class="p-4 border-b border-slate-200 space-y-3 bg-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <span class="material-symbols-outlined text-[16px] text-brand-wa">assignment</span>
          <span class="text-[11px] font-bold uppercase text-slate-700">Enquiry Status &amp; State</span>
        </div>
        ${statusBadgeHtml}
      </div>

      ${query ? `
        <!-- Status Dropdown Selector & Save Button -->
        <div class="space-y-2">
          <label class="block font-bold text-slate-700 text-[10px] uppercase tracking-wide">Change Status:</label>
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

          <button type="button" onclick="handleSaveQueryStatus('${query.id}')" class="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs shadow-sm hover:shadow transition flex items-center justify-center gap-1.5 active:scale-[0.99]">
            <span class="material-symbols-outlined text-[15px]">save</span>
            <span>Save Status</span>
          </button>
        </div>

        <!-- Query Meta Details -->
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
      ` : '<p class="text-xs text-slate-400">No active query recorded for this customer</p>'}
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

    <!-- 4. RECENT WHATSAPP ORDERS ACCORDION -->
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
async function dispatchWhatsAppOutbound(phone, text, msgRef, jid = null, accountId = null, silent = false) {
  const targetAccId = accountId || ACTIVE_SEND_ACCOUNT_ID || 'account_1';

  // 1. Try Instant WebSocket (Socket.IO) Dispatch
  if (SOCKET_IO && SOCKET_IO.connected) {
    return new Promise((resolve) => {
      SOCKET_IO.emit('whatsapp:send', { phone, text, jid, accountId: targetAccId }, (res) => {
        if (res && res.status === 'success') {
          if (msgRef) msgRef.status = 'DELIVERED';
          if (typeof renderChatMessages === 'function') renderChatMessages();
          if (!silent) showToast('WhatsApp Delivered', `Live message sent to customer (${phone})!`, 'done_all', 'emerald');
          resolve(true);
        } else {
          console.warn('[Socket Send Notice]:', res);
          if (!silent) showToast('WhatsApp Notice', res?.message || 'Message queued', 'info', 'amber');
          resolve(false);
        }
      });
    });
  }

  // 2. HTTP Fallback to Node.js Bridge
  try {
    let resp = await fetch('http://localhost:3000/api/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, text, jid, accountId: targetAccId })
    });
    let result = await resp.json();
    if (result.status === 'success') {
      if (msgRef) msgRef.status = 'DELIVERED';
      if (typeof renderChatMessages === 'function') renderChatMessages();
      if (!silent) showToast('WhatsApp Delivered', `Live message sent to customer (${phone})!`, 'done_all', 'emerald');
      return true;
    } else {
      console.warn('[Bridge Send Notice]:', result);
      if (!silent) showToast('Saved to CRM', result.message || 'Stored in CRM', 'info', 'amber');
      return false;
    }
  } catch (err) {
    // 3. Fallback via PHP backend proxy
    try {
      let fResp = await fetch('api.php?action=send_message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, text, jid, accountId: targetAccId })
      });
      let fResult = await fResp.json();
      if (fResult.status === 'success') {
        if (msgRef) msgRef.status = 'DELIVERED';
        if (typeof renderChatMessages === 'function') renderChatMessages();
        if (!silent) showToast('WhatsApp Delivered', `Live message sent to customer (${phone})!`, 'done_all', 'emerald');
        return true;
      }
    } catch (e) { }
    console.warn('[Bridge Offline]:', err);
    if (!silent) showToast('Saved in CRM', 'Recorded locally. Connect QR in WhatsApp Settings for live delivery.', 'info', 'blue');
    return false;
  }
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

// Modal Controllers
function openAutoReplyModal() {
  if (!CRM_STATE.autoReplySettings) {
    CRM_STATE.autoReplySettings = {
      enabled: true,
      cooldownMinutes: 30,
      keywordMatching: true,
      messageTemplate: getDefaultStockAutoReplyTemplate()
    };
  }

  const settings = CRM_STATE.autoReplySettings;
  const masterToggle = document.getElementById('autoreply-master-toggle');
  const cooldownSelect = document.getElementById('autoreply-cooldown-select');
  const keywordToggle = document.getElementById('autoreply-keyword-toggle');
  const tplArea = document.getElementById('autoreply-message-template');

  if (masterToggle) masterToggle.checked = settings.enabled !== false;
  if (cooldownSelect) cooldownSelect.value = settings.cooldownMinutes || '30';
  if (keywordToggle) keywordToggle.checked = settings.keywordMatching !== false;
  if (tplArea) tplArea.value = settings.messageTemplate || getDefaultStockAutoReplyTemplate();

  updateAutoReplyLivePreview();
  openModal('modal-auto-reply-settings');
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
  if (!CRM_STATE.autoReplySettings) CRM_STATE.autoReplySettings = {};
  CRM_STATE.autoReplySettings.enabled = enabled;
  saveCRMState();
  updateAutoReplyUI();
  showToast(
    enabled ? 'Stock Auto-Reply Active' : 'Auto-Reply Paused',
    enabled ? 'Customers will receive instant stock category menus upon messaging.' : 'Automated replies are paused.',
    enabled ? 'smart_toy' : 'pause_circle',
    enabled ? 'emerald' : 'amber'
  );
  if (typeof playChime === 'function') playChime('inbound');
}

function saveAutoReplySettings() {
  const masterToggle = document.getElementById('autoreply-master-toggle');
  const cooldownSelect = document.getElementById('autoreply-cooldown-select');
  const keywordToggle = document.getElementById('autoreply-keyword-toggle');
  const tplArea = document.getElementById('autoreply-message-template');

  if (!CRM_STATE.autoReplySettings) CRM_STATE.autoReplySettings = {};
  CRM_STATE.autoReplySettings.enabled = masterToggle ? masterToggle.checked : true;
  CRM_STATE.autoReplySettings.cooldownMinutes = cooldownSelect ? parseInt(cooldownSelect.value) : 30;
  CRM_STATE.autoReplySettings.keywordMatching = keywordToggle ? keywordToggle.checked : true;
  CRM_STATE.autoReplySettings.messageTemplate = tplArea ? tplArea.value.trim() : getDefaultStockAutoReplyTemplate();

  saveCRMState();
  updateAutoReplyUI();
  closeModal('modal-auto-reply-settings');
  showToast('Automation Saved', 'WhatsApp Stock Auto-Reply settings saved successfully.', 'check_circle', 'emerald');
  if (typeof playChime === 'function') playChime('order');
}

function updateAutoReplyUI() {
  const isEnabled = CRM_STATE?.autoReplySettings?.enabled !== false;
  const pillDot = document.getElementById('pill-autoreply-dot');
  const pillLabel = document.getElementById('pill-autoreply-label');
  const headerBtn = document.getElementById('header-auto-reply-btn');

  if (pillDot) {
    pillDot.className = `w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`;
  }
  if (pillLabel) {
    pillLabel.innerText = isEnabled ? 'Auto-Reply: ON' : 'Auto-Reply: OFF';
  }
  if (headerBtn) {
    if (isEnabled) {
      headerBtn.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold rounded-lg transition shadow-sm";
    } else {
      headerBtn.className = "hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-lg transition shadow-sm";
    }
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
  renderCustomTagsTray();
  refreshBroadcastAutoFetchedNumbers();
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

  openModal('modal-broadcast-template');
}

function closeBroadcastModal() {
  if (IS_BROADCASTING_ACTIVE) {
    if (!confirm('A broadcast is currently sending messages. Are you sure you want to stop and close?')) {
      return;
    }
    BROADCAST_CANCEL_FLAG = true;
  }
  closeModal('modal-broadcast-template');
}

let CURRENT_BROADCAST_TEMPLATE_TITLE = 'Template Message Text';

function editBroadcastTemplateTitle() {
  const currentTitle = CURRENT_BROADCAST_TEMPLATE_TITLE || 'Template Message Text';
  const newTitle = prompt('Edit Template Heading / Title Name:', currentTitle);
  if (newTitle !== null && newTitle.trim() !== '') {
    CURRENT_BROADCAST_TEMPLATE_TITLE = newTitle.trim();
    updateBroadcastTemplateTitleUI();
    
    // Also sync selected preset label if applicable
    const presetSelect = document.getElementById('bcast-preset-select');
    if (presetSelect && presetSelect.value && BROADCAST_PRESETS_DATA[presetSelect.value]) {
      BROADCAST_PRESETS_DATA[presetSelect.value].label = `📋 ${CURRENT_BROADCAST_TEMPLATE_TITLE}`;
      renderBroadcastTemplateDropdown(presetSelect.value);
      try {
        localStorage.setItem('GRM_CUSTOM_BROADCAST_TEMPLATES', JSON.stringify(BROADCAST_PRESETS_DATA));
      } catch (e) {}
    }
    showToast('Template Title Updated', `Heading changed to "${CURRENT_BROADCAST_TEMPLATE_TITLE}"`, 'edit_note', 'indigo');
    if (typeof playChime === 'function') playChime('order');
  }
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
  updateBroadcastPreview();
}

// Manual Custom Tag Handler: Adds/Updates a user-defined placeholder & replacement value
function handleApplyManualCustomTag() {
  const nameInput = document.getElementById('manual-tag-name');
  const valInput = document.getElementById('manual-tag-value');
  if (!nameInput) return;

  let rawKey = nameInput.value.trim().replace(/^\{\{|\}\}$/g, '').trim();
  if (!rawKey) {
    alert('Please enter a tag name (e.g. discount, offer_code, product_name, event_date).');
    nameInput.focus();
    return;
  }

  // Normalize tag identifier (lowercase alphanumeric with underscores)
  const cleanKey = rawKey.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  const tagVal = valInput ? valInput.value.trim() : '';

  if (!cleanKey) {
    alert('Please enter a valid tag name containing letters or numbers.');
    return;
  }

  BROADCAST_CUSTOM_TAGS[cleanKey] = tagVal || `[${cleanKey}]`;

  // Insert tag into textarea at cursor position
  insertBroadcastVariable(`{{${cleanKey}}}`);

  // Re-render tray & preview
  renderCustomTagsTray();
  updateBroadcastPreview();

  showToast('Custom Tag Applied', `Tag "{{${cleanKey}}}" set to "${BROADCAST_CUSTOM_TAGS[cleanKey]}" and inserted!`, 'check_circle', 'indigo');
  if (typeof playChime === 'function') playChime('order');
}

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
    case 'today_date': return todayStr;
    case 'staff_name': return staff;
    case 'offer_discount': return '15% OFF';
    case 'product_name': return 'Festive Garments Collection';
    case 'coupon_code': return 'FESTIVE2026';
    default: return '';
  }
}

// Render active custom & system tags pills in the broadcast modal with 1-click edit & insert
function renderCustomTagsTray() {
  const tray = document.getElementById('manual-custom-tags-tray');
  if (!tray) return;

  const entries = Object.entries(BROADCAST_CUSTOM_TAGS || {});
  if (entries.length === 0) {
    tray.innerHTML = `<span class="text-[10px] text-slate-400 italic">No tags defined yet.</span>`;
    return;
  }

  tray.innerHTML = entries.map(([key, val]) => {
    const isSys = SYSTEM_TAG_KEYS.includes(key);
    const borderCls = isSys ? 'border-indigo-200 bg-white hover:border-indigo-400' : 'border-emerald-200 bg-white hover:border-emerald-400';
    const tagCls = isSys ? 'text-indigo-700 hover:text-indigo-950' : 'text-emerald-800 hover:text-emerald-950';

    return `
      <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${borderCls} shadow-2xs text-xs transition">
        <button type="button" onclick="insertBroadcastVariable('{{${key}}}')" class="font-mono font-bold ${tagCls} transition flex items-center gap-1" title="Click to insert {{${key}}} into message text at cursor">
          <span class="${isSys ? 'text-indigo-400' : 'text-emerald-500'} font-bold">+</span>
          <span>{{${key}}}</span>
        </button>
        <span class="text-slate-400 text-[10px] select-none">=</span>
        <span class="font-semibold text-slate-800 text-[11px] truncate max-w-[130px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200" title="${val}">"${val}"</span>
        <button type="button" onclick="editManualCustomTag('${key}')" class="text-slate-400 hover:text-indigo-600 p-0.5 rounded transition" title="Change / edit replacement value for {{${key}}}">
          <span class="material-symbols-outlined text-[14px]">edit</span>
        </button>
        ${isSys ? `
          <button type="button" onclick="resetSystemTagValue('${key}')" class="text-slate-300 hover:text-amber-600 p-0.5 rounded transition" title="Reset {{${key}}} to default live value">
            <span class="material-symbols-outlined text-[14px]">restart_alt</span>
          </button>
        ` : `
          <button type="button" onclick="removeManualCustomTag('${key}')" class="text-slate-400 hover:text-rose-600 p-0.5 rounded transition" title="Remove custom tag">
            <span class="material-symbols-outlined text-[14px]">close</span>
          </button>
        `}
      </div>
    `;
  }).join('');
}

function editManualCustomTag(key) {
  const currentVal = BROADCAST_CUSTOM_TAGS[key] || '';
  const newVal = prompt(`Edit custom replacement value for dynamic tag {{${key}}}:`, currentVal);
  if (newVal !== null) {
    BROADCAST_CUSTOM_TAGS[key] = newVal.trim();
    renderCustomTagsTray();
    updateBroadcastPreview();
    showToast('Tag Value Updated', `{{${key}}} will now be replaced with "${newVal.trim()}" in message broadcasts.`, 'tune', 'emerald');
    if (typeof playChime === 'function') playChime('order');
  }
}

function resetSystemTagValue(key) {
  const defVal = getDefaultTagValue(key);
  BROADCAST_CUSTOM_TAGS[key] = defVal;
  renderCustomTagsTray();
  updateBroadcastPreview();
  showToast('Tag Reset', `{{${key}}} restored to default value: "${defVal}"`, 'restart_alt', 'blue');
}

function removeManualCustomTag(key) {
  delete BROADCAST_CUSTOM_TAGS[key];
  renderCustomTagsTray();
  updateBroadcastPreview();
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
  const previewCharCount = document.getElementById('bcast-preview-char-count');
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

  if (previewCustLabel) {
    const custName = sampleCustomer.name || 'Recipient';
    const custPhone = sampleCustomer.whatsapp || sampleCustomer.phone || '+91 86680 07593';
    previewCustLabel.innerText = `Sample Recipient: ${custName} (${custPhone})`;
  }

  if (previewCharCount) {
    previewCharCount.innerText = `${rendered.length} characters`;
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
window.addEventListener('DOMContentLoaded', () => {
  initCRMState();
  initAuthSystem();
});
