/**
 * GRM WHATSAPP CRM — MULTI-ACCOUNT WEBSOCKET (Socket.IO) & BAILEYS LIVE BRIDGE
 * Features:
 *  - Multi-WhatsApp Account Manager: Link multiple phone numbers via individual QR codes
 *  - Real-time Bidirectional WebSocket (Socket.IO) for Instant Chat & Zero-Latency Delivery
 *  - Voice Message & Media Player: Instant download & playback of WhatsApp Voice Notes (PTT)
 *  - Supports both Standard WhatsApp Numbers (@s.whatsapp.net) & WhatsApp Privacy LIDs (@lid)
 *  - Unified Inbound Channel Tagging (Identifies which WhatsApp account received the message)
 *  - Zero API Costs • Zero Monthly Fees
 */

const express = require('express');
const cors = require('cors');
const qrcode = require('qrcode');
const fs = require('fs');
const path = require('path');
const http = require('http');
const pino = require('pino');
const { Server } = require('socket.io');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage
} = require('@whiskeysockets/baileys');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Prevent unhandled Baileys network drops from crashing bridge process
process.on('uncaughtException', (err) => {
    console.warn('[Bridge Safe Catch - uncaughtException]:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
    console.warn('[Bridge Safe Catch - unhandledRejection]:', reason?.message || reason);
});

const PORT = 3000;
const SESSIONS_BASE_DIR = path.join(__dirname, 'auth_sessions');

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_BASE_DIR)) {
    fs.mkdirSync(SESSIONS_BASE_DIR, { recursive: true });
}

// Migrate legacy single session if present
const legacyAuth = path.join(__dirname, 'auth_session');
const primaryAuth = path.join(SESSIONS_BASE_DIR, 'account_1');
if (fs.existsSync(legacyAuth) && !fs.existsSync(primaryAuth)) {
    try {
        fs.cpSync(legacyAuth, primaryAuth, { recursive: true });
    } catch (e) {
        console.warn('[Migration Notice]:', e.message);
    }
}

// Multi-Account Registry
const accounts = new Map(); // accountId -> AccountObject
// Map phone/LID to destination JIDs
const jidMap = new Map();
const LID_TO_PHONE_MAP = new Map();
const PHONE_TO_LID_MAP = new Map();

// Scan and index all Baileys LID <-> Phone mappings
function indexAllLidMappings() {
    try {
        if (!fs.existsSync(SESSIONS_BASE_DIR)) return;
        const dirs = fs.readdirSync(SESSIONS_BASE_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        for (const dir of dirs) {
            const sessionPath = path.join(SESSIONS_BASE_DIR, dir);
            if (!fs.existsSync(sessionPath)) continue;
            const files = fs.readdirSync(sessionPath);
            for (const file of files) {
                if (file.startsWith('lid-mapping-') && file.endsWith('.json')) {
                    try {
                        const fullPath = path.join(sessionPath, file);
                        const content = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
                        if (typeof content === 'string') {
                            const valDigits = content.replace(/[^0-9]/g, '');
                            if (file.endsWith('_reverse.json')) {
                                const lidDigits = file.replace('lid-mapping-', '').replace('_reverse.json', '');
                                if (lidDigits && valDigits) {
                                    LID_TO_PHONE_MAP.set(lidDigits, valDigits);
                                    PHONE_TO_LID_MAP.set(valDigits, lidDigits);
                                }
                            } else {
                                const phoneDigits = file.replace('lid-mapping-', '').replace('.json', '');
                                if (phoneDigits && valDigits) {
                                    LID_TO_PHONE_MAP.set(valDigits, phoneDigits);
                                    PHONE_TO_LID_MAP.set(phoneDigits, valDigits);
                                }
                            }
                        }
                    } catch (e) {}
                }
            }
        }
        console.log(`[LID Indexer] Loaded ${LID_TO_PHONE_MAP.size} bidirectional LID-to-Phone mappings into memory.`);
    } catch (e) {
        console.warn('[LID Indexer Warning]:', e.message);
    }
}
indexAllLidMappings();

// Brand Configuration
let BRAND_NAME = 'Blue Berry 💙';
let BRAND_TAGLINE = 'Premium Kids & Maternity Wear';

// Autonomous Server-Side Auto-Responder Configuration & Cache
const lastAutoReplyMap = new Map();
let autoReplyConfig = {
    enabled: true,
    cooldownMinutes: 0, // 0 = Instant reply on every message
    keywordMatching: true
};

function getStockAutoReplyTemplate(customerName) {
    const brand = BRAND_NAME || 'Blue Berry 💙';
    const cName = customerName ? customerName.split(' ')[0] : 'there';
    
    return `🛍️ *${brand}* • Live Stock & Collections\n━━━━━━━━━━━━━━━━━━━━\nHello ${cName}! 👋 Thank you for messaging us.\n\nHere is our live available stock & collections today:\n\n📦 *1. Baby Collection (0-3 Years)*\n• Embroidered Cotton Frocks & Soft Sets — *₹599*\n\n📦 *2. Maternity & Feeding Gowns*\n• Tiered Cotton Maxi & Feeding Gowns — *₹1299 - ₹1450*\n\n📦 *3. Newborn Gift Sets (0-6 Months)*\n• 5-Piece Organic Romper Gift Sets — *₹799*\n\n📦 *4. Kids Everyday Wear (4-5 Years)*\n• Pure Cotton T-Shirts Pack & Daily Sets — *₹450*\n\n📦 *5. Wholesale & Bulk Bundles*\n• Bulk 25 & 50 Pcs Assorted Boxes — *₹7200 - ₹8500*\n\n📦 *6. Festive & VIP Silk Collection*\n• Girls Silk Lehengas & Pattu Pavadai Sets — *₹899*\n\n━━━━━━━━━━━━━━━━━━━━\n💬 *How to Order / Inquire:*\nReply with the *Category Number (1-6)* or tell us what size you need, and our sales team will share photos & reserve your order instantly!`;
}

function getKeywordResponse(key, custName) {
    const brand = BRAND_NAME || 'Blue Berry 💙';
    const name = custName ? custName.split(' ')[0] : 'there';
    if (key === '1' || key.includes('baby') || key.includes('frock')) {
        return `🛍️ *${brand}* • Baby Collection (0-3 Years)\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Here are our top Baby Collection items in ready stock:\n\n• *Embroidered Cotton Baby Frock* (0-1 Yrs)\n  Price: *₹599* | SKU: \`BABY-FRK-01\` | ✅ Ready Stock\n\n• *Soft Cotton Romper Daily Set* (1-2 Yrs)\n  Price: *₹499* | SKU: \`BABY-RMP-02\` | ✅ Ready Stock\n\n• *Organic Cotton Dungaree Set* (2-3 Yrs)\n  Price: *₹699* | SKU: \`BABY-DNG-03\` | ✅ Ready Stock\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with the *SKU or Size* to reserve this item instantly!`;
    } else if (key === '2' || key.includes('maternity') || key.includes('feeding') || key.includes('gown')) {
        return `🛍️ *${brand}* • Maternity & Feeding Wear\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Here are our top Maternity gowns in ready stock:\n\n• *Pure Cotton Tiered Feeding Gown* (M / L / XL / XXL)\n  Price: *₹1299* | SKU: \`MAT-GWN-01\` | ✅ Ready Stock (Concealed Zips)\n\n• *Floral Pure Rayon Maxi Gown* (Free Size)\n  Price: *₹1450* | SKU: \`MAT-MAXI-02\` | ✅ Ready Stock\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with the *SKU & Size* to place your order!`;
    } else if (key === '3' || key.includes('newborn') || key.includes('romper')) {
        return `🛍️ *${brand}* • Newborn Gift Sets (0-6 Months)\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Newborn items in ready stock:\n\n• *5-Piece Organic Newborn Gift Box* (0-3M)\n  Price: *₹799* | SKU: \`NB-BOX-01\` | ✅ Ready Stock\n\n• *Newborn Pure Cotton Rompers (Pack of 3)* (3-6M)\n  Price: *₹599* | SKU: \`NB-RMP-03\` | ✅ Ready Stock\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *SKU* to book!`;
    } else if (key === '4' || key.includes('kids') || key.includes('tshirt') || key.includes('t-shirt')) {
        return `🛍️ *${brand}* • Kids Everyday Wear (4-5 Years)\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Kids wear in ready stock:\n\n• *Pure Cotton Printed T-Shirt Pack (Pack of 2)*\n  Price: *₹450* | SKU: \`KID-TEE-04\` | ✅ Ready Stock\n\n• *Everyday Shorts & Top Co-ord Set*\n  Price: *₹650* | SKU: \`KID-SET-05\` | ✅ Ready Stock\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *SKU & Size* to book!`;
    } else if (key === '5' || key.includes('wholesale') || key.includes('bulk')) {
        return `🛍️ *${brand}* • Wholesale & Bulk Bundles\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Wholesale packages available for boutique resellers:\n\n• *Assorted 25-Piece Baby Frocks Box*\n  Price: *₹7200* | SKU: \`WS-BOX-25\` | ✅ Ready for Dispatch\n\n• *Assorted 50-Piece Maternity & Kids Combo Box*\n  Price: *₹14000* | SKU: \`WS-BOX-50\` | ✅ Ready for Dispatch\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with your *Shop Name & GST Number* for wholesale dispatch!`;
    } else if (key === '6' || key.includes('festive') || key.includes('silk') || key.includes('lehenga')) {
        return `🛍️ *${brand}* • Festive & VIP Silk Collection\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Festive items in ready stock:\n\n• *Girls Pattu Pavadai Silk Set* (2-4 Yrs)\n  Price: *₹899* | SKU: \`FEST-SILK-01\` | ✅ Ready Stock\n\n• *Festive Jacquard Lehenga Choli* (4-6 Yrs)\n  Price: *₹1199* | SKU: \`FEST-LHG-02\` | ✅ Ready Stock\n\n━━━━━━━━━━━━━━━━━━━━\n💬 Reply with *SKU & Age* to order!`;
    }
    return null;
}

const configFilePath = path.join(__dirname, '..', 'whatsapp_account_config.json');
function loadBrandConfig() {
    try {
        if (fs.existsSync(configFilePath)) {
            const rawCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
            if (rawCfg.brand_name) BRAND_NAME = rawCfg.brand_name;
            if (rawCfg.brand_tagline) BRAND_TAGLINE = rawCfg.brand_tagline;
            if (typeof rawCfg.autoReplyEnabled === 'boolean') autoReplyConfig.enabled = rawCfg.autoReplyEnabled;
        }
    } catch (e) {}
}
loadBrandConfig();

// Helper to get all accounts summary
function getAccountsSummary() {
    const list = [];
    for (const [id, acc] of accounts.entries()) {
        list.push({
            id: acc.id,
            label: acc.label,
            status: acc.status,
            connected_number: acc.connectedNumber,
            connected_name: acc.connectedName,
            qr_image: acc.qrImage,
            last_active: acc.lastActive
        });
    }
    return list;
}

// Broadcast Status update to all connected Socket.IO clients
function broadcastAccountsUpdate() {
    const summary = getAccountsSummary();
    io.emit('bridge:accounts', {
        status: 'success',
        accounts: summary,
        primary_account: summary[0] || null,
        timestamp: new Date().toISOString()
    });

    const primary = summary[0] || { status: 'DISCONNECTED', connected_number: null, qr_image: null };
    io.emit('bridge:status', {
        status: 'success',
        connection: primary.status,
        qr_image: primary.qr_image,
        connected_number: primary.connected_number,
        connected_name: primary.connected_name,
        accounts_count: summary.length,
        timestamp: new Date().toISOString()
    });
}

// Forward inbound WhatsApp message to CRM PHP API for persistent file storage
function forwardToCRM(data) {
    try {
        const postData = JSON.stringify(data);
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api.php?action=receive_message',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        }, (res) => {
            res.on('data', () => {});
        });

        req.on('error', (e) => {
            console.error('[Forward Error]:', e.message);
        });

        req.write(postData);
        req.end();
    } catch (e) {
        console.error('Error forwarding message to CRM:', e.message);
    }
}

// Helper to determine destination JID (Resolves WhatsApp Privacy LIDs to Standard Phone JIDs for flawless delivery)
function resolveDestinationJid(phoneOrJid) {
    if (!phoneOrJid) return null;
    let target = phoneOrJid.toString().trim();

    // 1. Check if target has @lid or is a pure 14+ digit privacy LID
    if (target.includes('@lid') || (target.length >= 14 && (target.startsWith('156') || target.startsWith('235') || target.startsWith('253') || target.startsWith('275') || target.startsWith('967')))) {
        const lidDigits = target.split('@')[0].replace(/[^0-9]/g, '');
        if (LID_TO_PHONE_MAP.has(lidDigits)) {
            const mappedPhone = LID_TO_PHONE_MAP.get(lidDigits);
            console.log(`[JID Resolver] Resolved LID ${lidDigits} -> Standard Phone JID: ${mappedPhone}@s.whatsapp.net`);
            return `${mappedPhone}@s.whatsapp.net`;
        }
        // Check on-demand scan of session files
        try {
            for (const [id, acc] of accounts.entries()) {
                const sessionDir = path.join(SESSIONS_BASE_DIR, id);
                if (fs.existsSync(sessionDir)) {
                    const directPhoneFiles = fs.readdirSync(sessionDir).filter(f => f.startsWith('lid-mapping-') && !f.endsWith('_reverse.json'));
                    for (const pf of directPhoneFiles) {
                        try {
                            const c = JSON.parse(fs.readFileSync(path.join(sessionDir, pf), 'utf8'));
                            if (c && c.toString().replace(/[^0-9]/g, '') === lidDigits) {
                                const ph = pf.replace('lid-mapping-', '').replace('.json', '');
                                LID_TO_PHONE_MAP.set(lidDigits, ph);
                                PHONE_TO_LID_MAP.set(ph, lidDigits);
                                console.log(`[JID Resolver Disk Hit] Resolved LID ${lidDigits} -> ${ph}@s.whatsapp.net`);
                                return `${ph}@s.whatsapp.net`;
                            }
                        } catch (e) {}
                    }
                }
            }
        } catch (e) {}
        return target.includes('@lid') ? target : `${target}@lid`;
    }

    // 2. Standard WhatsApp format
    if (target.includes('@s.whatsapp.net')) {
        return target;
    }

    // 3. Check memory cache
    if (jidMap.has(target)) {
        const cached = jidMap.get(target);
        if (cached.includes('@lid')) {
            const lidDig = cached.split('@')[0].replace(/[^0-9]/g, '');
            if (LID_TO_PHONE_MAP.has(lidDig)) {
                return `${LID_TO_PHONE_MAP.get(lidDig)}@s.whatsapp.net`;
            }
        }
        return cached;
    }

    let clean = target.replace(/[^0-9]/g, '');
    if (jidMap.has(clean)) {
        return jidMap.get(clean);
    }

    // 4. Standard 10-digit Indian numbers
    if (clean.length === 10) {
        clean = '91' + clean;
    }

    return `${clean}@s.whatsapp.net`;
}

// Initialize a specific WhatsApp Account session
async function initAccountSession(accountId, label = 'WhatsApp Account') {
    if (accounts.has(accountId) && accounts.get(accountId).isStarting) {
        return accounts.get(accountId);
    }

    const sessionDir = path.join(SESSIONS_BASE_DIR, accountId);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const accountObj = {
        id: accountId,
        label: label,
        status: 'CONNECTING',
        sock: null,
        qrImage: null,
        connectedNumber: null,
        connectedName: null,
        isStarting: true,
        lastActive: new Date().toISOString()
    };

    accounts.set(accountId, accountObj);
    broadcastAccountsUpdate();

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        const { version } = await fetchLatestBaileysVersion();

        const sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: [`GRM CRM (${label})`, 'Chrome', '124.0.0.0']
        });

        accountObj.sock = sock;

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                console.log(`[QR Bridge - ${accountId}] New QR Code generated for ${label}.`);
                try {
                    accountObj.qrImage = await qrcode.toDataURL(qr);
                    accountObj.status = 'SCAN_QR';
                    accountObj.isStarting = false;
                    broadcastAccountsUpdate();
                } catch (err) {
                    console.error('QR Generate Error:', err);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403;
                console.log(`[QR Bridge - ${accountId}] Connection closed (status: ${statusCode}). Logged out: ${isLoggedOut}`);
                accountObj.status = 'DISCONNECTED';
                accountObj.qrImage = null;
                accountObj.connectedNumber = null;
                accountObj.connectedName = null;
                accountObj.isStarting = false;
                broadcastAccountsUpdate();

                if (isLoggedOut) {
                    console.log(`[QR Bridge - ${accountId}] Session unlinked / logged out on phone. Clearing credentials and generating new QR Code...`);
                    if (fs.existsSync(sessionDir)) {
                        try {
                            fs.rmSync(sessionDir, { recursive: true, force: true });
                        } catch (e) {
                            console.warn('[Session Clear Notice]:', e.message);
                        }
                    }
                    // Auto-generate fresh QR code for this slot
                    setTimeout(() => {
                        initAccountSession(accountId, label);
                    }, 1500);
                } else {
                    // Reconnect on network drops
                    setTimeout(() => {
                        initAccountSession(accountId, label);
                    }, 4000);
                }
            } else if (connection === 'open') {
                accountObj.status = 'CONNECTED';
                accountObj.qrImage = null;
                accountObj.isStarting = false;
                accountObj.lastActive = new Date().toISOString();

                const rawId = sock.user?.id || '';
                const cleanNum = rawId.split(':')[0].split('@')[0];
                accountObj.connectedNumber = cleanNum.startsWith('+') ? cleanNum : ('+' + cleanNum);
                accountObj.connectedName = sock.user?.name || `${label} (${accountObj.connectedNumber})`;

                console.log(`[QR Bridge - ${accountId}] Connected Successfully: ${accountObj.connectedNumber} (${accountObj.connectedName})`);
                broadcastAccountsUpdate();
            }
        });

        // Listen for Real Inbound Customer Messages on this Account
        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        const senderJid = msg.key.remoteJid;
                        if (!senderJid) continue;
                        if (senderJid.includes('@g.us') || senderJid === 'status@broadcast') continue;

                        let cleanNumber = senderJid.split('@')[0].split(':')[0];
                        let realPhone = null;

                        // Check Baileys LID reverse mapping file if LID format
                        if (senderJid.includes('@lid') || (cleanNumber.length >= 14 && (cleanNumber.startsWith('156') || cleanNumber.startsWith('235') || cleanNumber.startsWith('253') || cleanNumber.startsWith('275') || cleanNumber.startsWith('967')))) {
                            // 1. Check in-memory index
                            if (LID_TO_PHONE_MAP.has(cleanNumber)) {
                                const digits = LID_TO_PHONE_MAP.get(cleanNumber);
                                if (digits.length === 10) {
                                    realPhone = '+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5);
                                } else if (digits.length === 12 && digits.startsWith('91')) {
                                    realPhone = '+91 ' + digits.slice(2, 7) + ' ' + digits.slice(7);
                                } else {
                                    realPhone = '+' + digits;
                                }
                            }
                            
                            // 2. Check disk reverse file if not found
                            if (!realPhone) {
                                const reverseFile = path.join(sessionDir, `lid-mapping-${cleanNumber}_reverse.json`);
                                if (fs.existsSync(reverseFile)) {
                                    try {
                                        const rawMapped = JSON.parse(fs.readFileSync(reverseFile, 'utf8'));
                                        if (rawMapped && typeof rawMapped === 'string') {
                                            const digits = rawMapped.replace(/[^0-9]/g, '');
                                            if (digits.length >= 10) {
                                                realPhone = digits.length === 10 ? ('+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5)) : (digits.length === 12 && digits.startsWith('91') ? ('+91 ' + digits.slice(2, 7) + ' ' + digits.slice(7)) : ('+' + digits));
                                            }
                                        }
                                    } catch (e) {}
                                }
                            }

                            // 3. Check direct phone mapping files on disk
                            if (!realPhone) {
                                try {
                                    const directFiles = fs.readdirSync(sessionDir).filter(f => f.startsWith('lid-mapping-') && !f.endsWith('_reverse.json'));
                                    for (const pf of directFiles) {
                                        try {
                                            const c = JSON.parse(fs.readFileSync(path.join(sessionDir, pf), 'utf8'));
                                            if (c && c.toString().replace(/[^0-9]/g, '') === cleanNumber) {
                                                const digits = pf.replace('lid-mapping-', '').replace('.json', '');
                                                LID_TO_PHONE_MAP.set(cleanNumber, digits);
                                                PHONE_TO_LID_MAP.set(digits, cleanNumber);
                                                realPhone = digits.length === 10 ? ('+91 ' + digits.slice(0, 5) + ' ' + digits.slice(5)) : (digits.length === 12 && digits.startsWith('91') ? ('+91 ' + digits.slice(2, 7) + ' ' + digits.slice(7)) : ('+' + digits));
                                                break;
                                            }
                                        } catch (e) {}
                                    }
                                } catch (e) {}
                            }
                        }

                        if (!realPhone) {
                            const digitsOnly = cleanNumber.replace(/[^0-9]/g, '');
                            if (digitsOnly.length === 10) {
                                realPhone = '+91 ' + digitsOnly.slice(0, 5) + ' ' + digitsOnly.slice(5);
                            } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91')) {
                                realPhone = '+91 ' + digitsOnly.slice(2, 7) + ' ' + digitsOnly.slice(7);
                            } else {
                                realPhone = '+' + cleanNumber;
                            }
                        }

                        const senderNumber = realPhone;
                        const senderName = msg.pushName || ('Customer ' + senderNumber.slice(-4));

                        // Store in JID Cache (Always map to standard @s.whatsapp.net for guaranteed outbound delivery)
                        if (LID_TO_PHONE_MAP.has(cleanNumber)) {
                            const standardJid = `${LID_TO_PHONE_MAP.get(cleanNumber)}@s.whatsapp.net`;
                            jidMap.set(senderNumber, standardJid);
                            jidMap.set(cleanNumber, standardJid);
                            jidMap.set(senderJid, standardJid);
                        } else {
                            jidMap.set(senderNumber, senderJid);
                            jidMap.set(cleanNumber, senderJid);
                        }

                        // Unwrap nested WhatsApp message formats (Ephemeral, ViewOnce, Document captions, etc.)
                        let rawMsg = msg.message || {};
                        if (rawMsg.ephemeralMessage?.message) rawMsg = rawMsg.ephemeralMessage.message;
                        if (rawMsg.viewOnceMessage?.message) rawMsg = rawMsg.viewOnceMessage.message;
                        if (rawMsg.viewOnceMessageV2?.message) rawMsg = rawMsg.viewOnceMessageV2.message;
                        if (rawMsg.documentWithCaptionMessage?.message) rawMsg = rawMsg.documentWithCaptionMessage.message;

                        let messageText = '';
                        let msgType = 'text';
                        let mediaUrl = null;
                        let duration = 0;

                        // 1. Check for Voice Message / Audio
                        if (rawMsg.audioMessage) {
                            msgType = 'audio';
                            const isPtt = rawMsg.audioMessage.ptt;
                            duration = rawMsg.audioMessage.seconds || 0;
                            messageText = isPtt ? '🎙️ Voice Message' : '🎵 Audio Message';

                            try {
                                const audioBuffer = await downloadMediaMessage(
                                    msg,
                                    'buffer',
                                    {},
                                    { logger: pino({ level: 'silent' }) }
                                );
                                if (audioBuffer) {
                                    const mime = rawMsg.audioMessage.mimetype || 'audio/ogg; codecs=opus';
                                    mediaUrl = `data:${mime};base64,${audioBuffer.toString('base64')}`;
                                    console.log(`[Audio Message Downloaded] Size: ${audioBuffer.length} bytes from ${senderName}`);
                                }
                            } catch (err) {
                                console.error('[Audio Download Error]:', err.message);
                            }
                        }
                        // 2. Check for Photo / Image Attachment
                        else if (rawMsg.imageMessage) {
                            msgType = 'image';
                            messageText = rawMsg.imageMessage.caption ? ('[Photo] ' + rawMsg.imageMessage.caption) : '[Photo Attachment]';
                            try {
                                const imgBuffer = await downloadMediaMessage(
                                    msg,
                                    'buffer',
                                    {},
                                    { logger: pino({ level: 'silent' }) }
                                );
                                if (imgBuffer) {
                                    const mime = rawMsg.imageMessage.mimetype || 'image/jpeg';
                                    mediaUrl = `data:${mime};base64,${imgBuffer.toString('base64')}`;
                                    console.log(`[Image Downloaded] Size: ${imgBuffer.length} bytes from ${senderName}`);
                                }
                            } catch (err) {
                                console.error('[Image Download Error]:', err.message);
                            }
                        }
                        // 3. Check for Video Attachment
                        else if (rawMsg.videoMessage) {
                            msgType = 'video';
                            messageText = rawMsg.videoMessage.caption ? ('[Video] ' + rawMsg.videoMessage.caption) : '[Video Attachment]';
                        }
                        // 4. Check for Document
                        else if (rawMsg.documentMessage) {
                            msgType = 'document';
                            messageText = `[Document: ${rawMsg.documentMessage.fileName || 'file'}]`;
                        }
                        // 5. Check for Location
                        else if (rawMsg.locationMessage) {
                            msgType = 'location';
                            messageText = `📍 Location shared (${rawMsg.locationMessage.degreesLatitude}, ${rawMsg.locationMessage.degreesLongitude})`;
                        }
                        // 6. Check for Interactive Buttons / Lists
                        else if (rawMsg.buttonsResponseMessage) {
                            messageText = rawMsg.buttonsResponseMessage.selectedDisplayText || rawMsg.buttonsResponseMessage.selectedButtonId || '[Button Clicked]';
                        }
                        else if (rawMsg.templateButtonReplyMessage) {
                            messageText = rawMsg.templateButtonReplyMessage.selectedDisplayText || rawMsg.templateButtonReplyMessage.selectedId || '[Template Reply]';
                        }
                        else if (rawMsg.listResponseMessage) {
                            messageText = rawMsg.listResponseMessage.title || rawMsg.listResponseMessage.singleSelectReply?.selectedRowId || '[List Selected]';
                        }
                        // 7. Regular text messages
                        else if (rawMsg.conversation) {
                            messageText = rawMsg.conversation;
                        } else if (rawMsg.extendedTextMessage?.text) {
                            messageText = rawMsg.extendedTextMessage.text;
                        } else {
                            messageText = '[WhatsApp Message]';
                        }

                        console.log(`[Inbound on ${accountObj.connectedNumber || accountId}] From ${senderName} (${senderJid}): "${messageText}" [${msgType}]`);

                        const payload = {
                            sender_name: senderName,
                            sender_phone: senderNumber,
                            sender_jid: senderJid,
                            message_text: messageText,
                            type: msgType,
                            media_url: mediaUrl,
                            duration: duration,
                            account_id: accountId,
                            received_on_number: accountObj.connectedNumber || 'Primary',
                            priority: 'HIGH',
                            assigned_to: 'UNASSIGNED',
                            source: 'REAL_WHATSAPP_LIVE',
                            timestamp_epoch: Math.floor(Date.now() / 1000),
                            received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        };

                        // 1. Emit live to CRM UI over WebSocket (Instant!)
                        io.emit('whatsapp:inbound', payload);

                        // 2. Forward to CRM PHP API for persistent file storage
                        forwardToCRM(payload);

                        // 3. Server-Side Autonomous Instant Auto-Responder Engine
                        if (autoReplyConfig.enabled) {
                            const lastEpoch = lastAutoReplyMap.get(senderNumber) || 0;
                            const cooldownMs = (parseInt(autoReplyConfig.cooldownMinutes) || 0) * 60 * 1000;
                            const isCooldownPassed = cooldownMs === 0 || (Date.now() - lastEpoch) >= cooldownMs;

                            let autoReplyText = null;
                            const cleanMsg = (messageText || '').trim().toLowerCase();

                            if (autoReplyConfig.keywordMatching) {
                                autoReplyText = getKeywordResponse(cleanMsg, senderName);
                            }

                            if (!autoReplyText && isCooldownPassed) {
                                autoReplyText = getStockAutoReplyTemplate(senderName);
                            }

                            if (autoReplyText) {
                                lastAutoReplyMap.set(senderNumber, Date.now());
                                lastAutoReplyMap.set(cleanNumber, Date.now());
                                if (senderJid) lastAutoReplyMap.set(senderJid, Date.now());

                                setTimeout(async () => {
                                    try {
                                        const targetJid = resolveDestinationJid(senderNumber || senderJid);
                                        console.log(`[Auto-Reply Engine] 🤖 Dispatching automated stock reply to ${senderName} (${targetJid})...`);
                                        const sentRes = await sock.sendMessage(targetJid, { text: autoReplyText });
                                        console.log(`[Auto-Reply Engine] ✅ Successfully delivered automated stock reply to ${targetJid} (ID: ${sentRes?.key?.id})`);

                                        const botPayload = {
                                            sender_name: 'Bot (Auto-Reply)',
                                            sender_phone: senderNumber,
                                            sender_jid: targetJid,
                                            message_text: autoReplyText,
                                            type: 'text',
                                            account_id: accountId,
                                            source: 'AUTOREPLY_BOT',
                                            is_outbound: true,
                                            timestamp_epoch: Math.floor(Date.now() / 1000),
                                            received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        };
                                        io.emit('whatsapp:inbound', botPayload);
                                        forwardToCRM(botPayload);
                                    } catch (err) {
                                        console.error('[Auto-Reply Send Error]:', err.message);
                                    }
                                }, 800);
                            }
                        }
                    }
                }
            }
        });

    } catch (err) {
        console.error(`[Account ${accountId} Init Error]:`, err.message);
        accountObj.status = 'DISCONNECTED';
        accountObj.isStarting = false;
        broadcastAccountsUpdate();
    }

    return accountObj;
}

// Core Function to Send WhatsApp Message
async function sendWhatsAppMessage(target, text, accountId = null) {
    let activeAcc = null;

    if (accountId && accounts.has(accountId) && accounts.get(accountId).status === 'CONNECTED') {
        activeAcc = accounts.get(accountId);
    } else {
        // Use first available connected account
        for (const acc of accounts.values()) {
            if (acc.status === 'CONNECTED' && acc.sock) {
                activeAcc = acc;
                break;
            }
        }
    }

    if (!activeAcc || !activeAcc.sock || activeAcc.status !== 'CONNECTED') {
        throw new Error('No WhatsApp account is currently connected. Please scan QR code in WhatsApp Settings.');
    }

    const jid = resolveDestinationJid(target);
    if (!jid) {
        throw new Error('Invalid phone number or JID.');
    }

    // Send exact message from CRM without duplicate brand wrapping or bottom tagline
    let finalText = typeof text === 'string' ? text.trim() : String(text || '');

    console.log(`[Outbound Send via ${activeAcc.connectedNumber || activeAcc.id}] Dispatching to ${jid}: "${finalText}"`);
    const sent = await activeAcc.sock.sendMessage(jid, { text: finalText });

    return {
        status: 'success',
        message_id: sent?.key?.id || ('wamid_' + Date.now()),
        account_id: activeAcc.id,
        sender_phone: activeAcc.connectedNumber,
        jid: jid,
        recipient: target,
        timestamp: new Date().toISOString()
    };
}

// Initialize all saved sessions
function initializeAllSessions() {
    try {
        const dirs = fs.readdirSync(SESSIONS_BASE_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        const validDirs = dirs.filter(dir => {
            if (dir === 'account_1') return true;
            const credsFile = path.join(SESSIONS_BASE_DIR, dir, 'creds.json');
            return fs.existsSync(credsFile);
        });

        // Clean up empty extra dirs
        dirs.forEach(dir => {
            if (dir !== 'account_1') {
                const credsFile = path.join(SESSIONS_BASE_DIR, dir, 'creds.json');
                if (!fs.existsSync(credsFile)) {
                    try { fs.rmSync(path.join(SESSIONS_BASE_DIR, dir), { recursive: true, force: true }); } catch (e) {}
                }
            }
        });

        if (validDirs.length === 0) {
            initAccountSession('account_1', 'Primary WhatsApp');
        } else {
            validDirs.forEach((dir, idx) => {
                const label = idx === 0 ? 'Primary WhatsApp' : `WhatsApp Business #${idx + 1}`;
                initAccountSession(dir, label);
            });
        }
    } catch (e) {
        initAccountSession('account_1', 'Primary WhatsApp');
    }
}

// -------------------------------------------------------------
// SOCKET.IO REALTIME WEBSOCKET HANDLERS
// -------------------------------------------------------------
io.on('connection', (socket) => {
    console.log(`[Socket.IO] New CRM Client Connected (${socket.id})`);

    // Immediately send current multi-account status
    socket.emit('bridge:accounts', {
        status: 'success',
        accounts: getAccountsSummary(),
        timestamp: new Date().toISOString()
    });

    // Handle outbound message sending from CRM client over WebSocket
    socket.on('whatsapp:send', async (data, callback) => {
        try {
            const { phone, text, jid, accountId } = data;
            const target = jid || phone;
            const result = await sendWhatsAppMessage(target, text, accountId);

            if (typeof callback === 'function') {
                callback({ status: 'success', result });
            }

            io.emit('whatsapp:sent_ack', {
                recipient: phone,
                jid: result.jid,
                account_id: result.account_id,
                text: text,
                status: 'DELIVERED',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });

        } catch (err) {
            console.error('[Socket Send Error]:', err.message);
            if (typeof callback === 'function') {
                callback({ status: 'error', message: err.message });
            }
        }
    });

    // Handle request to add / refresh account QR
    socket.on('accounts:add', (data) => {
        const nextId = 'account_' + (accounts.size + 1);
        const label = data?.label || `WhatsApp Business #${accounts.size + 1}`;
        initAccountSession(nextId, label);
    });

    socket.on('disconnect', () => {});
});

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

app.get('/api/accounts', (req, res) => {
    res.json({
        status: 'success',
        accounts: getAccountsSummary(),
        timestamp: new Date().toISOString()
    });
});

app.post('/api/accounts/add', (req, res) => {
    const nextIdx = accounts.size + 1;
    const nextId = 'account_' + nextIdx;
    const label = req.body.label || `WhatsApp Account #${nextIdx}`;
    initAccountSession(nextId, label);
    res.json({ status: 'success', message: 'Account initialization started', account_id: nextId });
});

app.post('/api/accounts/refresh_qr', async (req, res) => {
    try {
        const { accountId } = req.body;
        const targetId = accountId || 'account_1';
        const label = accounts.get(targetId)?.label || (targetId === 'account_1' ? 'Primary WhatsApp' : `WhatsApp Business`);

        if (accounts.has(targetId)) {
            const acc = accounts.get(targetId);
            if (acc.sock) {
                try { await acc.sock.logout(); } catch (e) {}
                try { acc.sock.end(); } catch (e) {}
            }
        }

        const sessionDir = path.join(SESSIONS_BASE_DIR, targetId);
        if (fs.existsSync(sessionDir)) {
            try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) {}
        }

        initAccountSession(targetId, label);
        res.json({ status: 'success', message: `Generating fresh QR for ${targetId}` });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.post('/api/accounts/delete', async (req, res) => {
    try {
        const { accountId } = req.body;
        if (!accountId || accountId === 'account_1') {
            return res.status(400).json({ status: 'error', message: 'Cannot delete primary account slot. Use disconnect instead.' });
        }
        if (accounts.has(accountId)) {
            const acc = accounts.get(accountId);
            if (acc.sock) {
                try { await acc.sock.logout(); } catch (e) {}
                try { acc.sock.end(); } catch (e) {}
            }
            accounts.delete(accountId);
            const sessionDir = path.join(SESSIONS_BASE_DIR, accountId);
            if (fs.existsSync(sessionDir)) {
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) {}
            }
            broadcastAccountsUpdate();
            return res.json({ status: 'success', message: `Account ${accountId} deleted successfully.` });
        }
        res.status(404).json({ status: 'error', message: 'Account not found' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.post('/api/accounts/disconnect', async (req, res) => {
    try {
        const { accountId } = req.body;
        const targetId = accountId || 'account_1';

        console.log(`[Disconnect Request]: Disconnecting and logging out ${targetId}`);

        if (accounts.has(targetId)) {
            const acc = accounts.get(targetId);
            if (acc.sock) {
                try { await acc.sock.logout(); } catch (e) {}
                try { acc.sock.end(); } catch (e) {}
            }
            acc.sock = null;
            acc.status = 'DISCONNECTED';
            acc.connectedNumber = null;
            acc.connectedName = null;
            acc.qrImage = null;
            acc.isStarting = false;

            const sessionDir = path.join(SESSIONS_BASE_DIR, targetId);
            if (fs.existsSync(sessionDir)) {
                try {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                } catch (e) {
                    console.warn(`[Session Remove Notice for ${targetId}]:`, e.message);
                }
            }

            broadcastAccountsUpdate();

            // Re-initialize a fresh QR session for this slot after 1 second
            setTimeout(() => {
                initAccountSession(targetId, acc.label);
            }, 1000);

            return res.json({ 
                status: 'success', 
                message: `Account ${targetId} disconnected. CRM records and customer messages are completely preserved.` 
            });
        }

        res.status(404).json({ status: 'error', message: 'Account not found' });
    } catch (e) {
        console.error('[Disconnect Error]:', e.message);
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.post('/api/accounts/update_profile', async (req, res) => {
    try {
        const { brandName } = req.body;
        if (brandName) {
            for (const [id, acc] of accounts.entries()) {
                if (acc.sock && acc.status === 'CONNECTED') {
                    try {
                        await acc.sock.updateProfileName(brandName);
                        acc.connectedName = brandName;
                        console.log(`[Account ${id}] Updated WhatsApp Profile PushName to: "${brandName}"`);
                    } catch (e) {
                        console.warn(`[Account ${id} Profile Name Update Notice]:`, e.message);
                    }
                }
            }
            broadcastAccountsUpdate();
        }
        res.json({ status: 'success', brandName });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.get('/api/qr/status', (req, res) => {
    const summary = getAccountsSummary();
    const primary = summary[0] || { status: 'DISCONNECTED', connected_number: null, qr_image: null, connected_name: null };
    res.json({
        status: 'success',
        connection: primary.status,
        qr_image: primary.qr_image,
        connected_number: primary.connected_number,
        connected_name: primary.connected_name,
        accounts: summary,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/accounts', (req, res) => {
    const summary = getAccountsSummary();
    res.json({
        status: 'success',
        accounts: summary,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/status', (req, res) => {
    const summary = getAccountsSummary();
    const primary = summary[0] || { status: 'DISCONNECTED', connected_number: null, qr_image: null, connected_name: null };
    res.json({
        status: 'success',
        connection: primary.status,
        qr_image: primary.qr_image,
        connected_number: primary.connected_number,
        connected_name: primary.connected_name,
        accounts: summary,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/send', async (req, res) => {
    try {
        const { phone, text, jid, accountId } = req.body;
        if (!phone && !jid) {
            return res.status(400).json({ status: 'error', message: 'Phone or JID is required' });
        }
        if (!text) {
            return res.status(400).json({ status: 'error', message: 'Text is required' });
        }

        const result = await sendWhatsAppMessage(jid || phone, text, accountId);
        res.json(result);
    } catch (err) {
        console.error('[REST Send Error]:', err.message);
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// Start Server & All Saved WhatsApp Sessions
server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`🚀 GRM WhatsApp Multi-Account WebSocket & Baileys Bridge`);
    console.log(`📡 Server Address:  http://localhost:${PORT}`);
    console.log(`⚡ Socket.IO Ready: ws://localhost:${PORT}`);
    console.log(`🎙️ Voice Notes:     Enabled with instant download`);
    console.log(`=======================================================`);
    initializeAllSessions();
});
