// Universal Timezone Enforcement for India Standard Time (IST, UTC+5:30)
process.env.TZ = 'Asia/Kolkata';

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

// Auto-load .env from root or bridge directory if present
[path.join(__dirname, '..', '.env'), path.join(__dirname, '.env')].forEach(envFile => {
    if (fs.existsSync(envFile)) {
        try {
            const raw = fs.readFileSync(envFile, 'utf8');
            raw.split(/\r?\n/).forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;
                const eq = trimmed.indexOf('=');
                if (eq !== -1) {
                    const k = trimmed.slice(0, eq).trim();
                    let v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
                    if (!process.env[k]) process.env[k] = v;
                }
            });
        } catch (e) {}
    }
});
const http = require('http');
const pino = require('pino');
const { Server } = require('socket.io');
const { initVoiceSignaling, generateVoiceRoomToken, VOICE_ROOMS } = require('./voice-signaling');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    DisconnectReason,
    fetchLatestBaileysVersion,
    downloadMediaMessage,
    Browsers
} = require('@whiskeysockets/baileys');

// Patch Baileys image thumbnail generator to support Jimp v1.x class constructor
try {
    const messagesMedia = require('@whiskeysockets/baileys/lib/Utils/messages-media');
    const JimpModule = require('jimp');
    if (messagesMedia && JimpModule && JimpModule.Jimp) {
        messagesMedia.extractImageThumb = async (bufferOrFilePath, width = 32) => {
            if (bufferOrFilePath && typeof bufferOrFilePath.pipe === 'function') {
                const chunks = [];
                for await (const chunk of bufferOrFilePath) chunks.push(chunk);
                bufferOrFilePath = Buffer.concat(chunks);
            }
            const img = await JimpModule.Jimp.read(bufferOrFilePath);
            const dimensions = { width: img.width, height: img.height };
            const buffer = await img.resize({ w: width, mode: JimpModule.ResizeStrategy.BILINEAR }).getBuffer('image/jpeg', { quality: 50 });
            return { buffer, original: dimensions };
        };
        console.log('[Thumbnail Engine] Baileys Jimp v1 image thumbnailer successfully patched.');
    }
} catch (e) {
    console.warn('[Thumbnail Engine Warning]:', e.message);
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
// Security Hardening: Block direct static serving of application root (.env, .php, .sql, .json)
app.use((req, res, next) => {
    const p = req.path.toLowerCase();
    if (p.endsWith('.env') || p.endsWith('.php') || p.endsWith('.sql') || p.endsWith('.json') || p.includes('/.') || p.includes('auth_sessions') || p.includes('node_modules')) {
        return res.status(403).json({ error: 'Access Denied: Static file access prohibited.' });
    }
    next();
});

// Serve only safe public assets needed by WebRTC and voice calling
app.use('/assets', express.static(path.resolve(__dirname, '../assets')));
app.get('/voice-call.html', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../voice-call.html'));
});

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
});

// --- Server-Sent Events (SSE) Client Registry & Broadcaster ---
const sseClients = new Set();

function broadcastSSE(event, data) {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data || {})}\n\n`;
    for (const client of sseClients) {
        try {
            client.write(payload);
        } catch (err) {
            sseClients.delete(client);
        }
    }
}

// Hook into io.emit to mirror all bridge events to connected SSE listeners
const originalIoEmit = io.emit.bind(io);
io.emit = function (event, ...args) {
    originalIoEmit(event, ...args);
    try {
        broadcastSSE(event, args[0] !== undefined ? args[0] : {});
    } catch (e) {}
    return true;
};

// Express SSE Endpoint (Accessible at /events and /api/events)
app.get(['/events', '/api/events'], (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=UTF-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    if (res.flushHeaders) res.flushHeaders();

    res.write('retry: 2000\n\n');
    res.write(': bridge_sse_connected\n\n');

    sseClients.add(res);

    const pingInterval = setInterval(() => {
        try {
            res.write(': ping\n\n');
        } catch (e) {
            clearInterval(pingInterval);
            sseClients.delete(res);
        }
    }, 15000);

    req.on('close', () => {
        clearInterval(pingInterval);
        sseClients.delete(res);
    });
});

// Prevent unhandled Baileys network drops from crashing bridge process
process.on('uncaughtException', (err) => {
    console.warn('[Bridge Safe Catch - uncaughtException]:', err.message);
});
process.on('unhandledRejection', (reason, promise) => {
    console.warn('[Bridge Safe Catch - unhandledRejection]:', reason?.message || reason);
});

const PORT = process.env.PORT || 3000;
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
const accountLocks = new Map(); // accountId -> { isConnecting: boolean, attempts: number }
const reconnectTimers = new Map(); // accountId -> NodeJS.Timeout

function clearReconnectTimer(accountId) {
    if (reconnectTimers.has(accountId)) {
        clearTimeout(reconnectTimers.get(accountId));
        reconnectTimers.delete(accountId);
    }
}
// Map phone/LID to destination JIDs
const jidMap = new Map();
const LID_TO_PHONE_MAP = new Map();
const PHONE_TO_LID_MAP = new Map();
const CONTACTS_CACHE = new Map(); // JID or LID -> { id, name, notify, verifiedName, phone }
const PROCESSED_MESSAGE_IDS = new Set();
// Track unread incoming message keys for two-way read receipts (Scenario B: CRM -> WhatsApp)
const UNREAD_KEYS_BY_CHAT = new Map(); // phone/jid/customer_id -> [{ key, messageTimestamp }]
// Track live inbound Baileys WhatsApp calls for instant atomic pickup & ringing control
const ACTIVE_BAILEYS_CALLS = new Map(); // callId -> { callId, accountId, sock, callFrom, chatId, callerPn, customerName, callerPhone, cleanDigits, roomToken }

// Periodic cleanup for stale calls in memory (TTL 10 mins) to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [cId, bCall] of ACTIVE_BAILEYS_CALLS.entries()) {
        const callTime = bCall.timestamp ? (bCall.timestamp > 1e11 ? bCall.timestamp : bCall.timestamp * 1000) : 0;
        if (callTime && (now - callTime) > 600000) {
            ACTIVE_BAILEYS_CALLS.delete(cId);
        }
    }
}, 300000);

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
                    } catch (e) { }
                }
            }
        }
        // Load shared root json mapping if present
        const sharedLidPath = path.resolve(__dirname, '..', 'lid_mappings.json');
        if (fs.existsSync(sharedLidPath)) {
            try {
                const shared = JSON.parse(fs.readFileSync(sharedLidPath, 'utf8'));
                for (const [k, v] of Object.entries(shared)) {
                    const kd = String(k).replace(/\D/g, '');
                    const vd = String(v).replace(/\D/g, '');
                    if (kd && vd) {
                        LID_TO_PHONE_MAP.set(kd, vd);
                        PHONE_TO_LID_MAP.set(vd, kd);
                    }
                }
            } catch (eShared) {}
        }
        console.log(`[LID Indexer] Loaded ${LID_TO_PHONE_MAP.size} bidirectional LID-to-Phone mappings into memory.`);
    } catch (e) {
        console.warn('[LID Indexer Warning]:', e.message);
    }
}
indexAllLidMappings();

const SHARED_LID_MAPPINGS_FILE = path.resolve(__dirname, '..', 'lid_mappings.json');

function saveLidMappingToDisk(lidDigits, pnDigits, accountId = null) {
    if (!lidDigits || !pnDigits) return;
    try {
        if (accountId) {
            const sDir = path.join(SESSIONS_BASE_DIR, accountId);
            if (fs.existsSync(sDir)) {
                fs.writeFileSync(path.join(sDir, `lid-mapping-${pnDigits}.json`), JSON.stringify(lidDigits));
                fs.writeFileSync(path.join(sDir, `lid-mapping-${lidDigits}_reverse.json`), JSON.stringify(pnDigits));
            }
        }
        let sharedMap = {};
        if (fs.existsSync(SHARED_LID_MAPPINGS_FILE)) {
            try { sharedMap = JSON.parse(fs.readFileSync(SHARED_LID_MAPPINGS_FILE, 'utf8')) || {}; } catch (e) {}
        }
        sharedMap[lidDigits] = pnDigits;
        sharedMap[pnDigits] = lidDigits;
        fs.writeFileSync(SHARED_LID_MAPPINGS_FILE, JSON.stringify(sharedMap, null, 2));
    } catch (e) {}
}

async function resolveLidToPhoneNumber(jidOrLid, currentSock = null, accountId = null) {
    if (!jidOrLid) return null;
    const target = jidOrLid.toString().trim();
    const cleanDigits = target.split('@')[0].replace(/\D/g, '');
    if (!cleanDigits) return null;

    // 1. Check in-memory map
    if (LID_TO_PHONE_MAP.has(cleanDigits)) {
        return LID_TO_PHONE_MAP.get(cleanDigits);
    }

    // 2. Check contacts cache
    const cachedContact = CONTACTS_CACHE.get(target) || CONTACTS_CACHE.get(cleanDigits);
    if (cachedContact?.phoneNumber) {
        const ph = cachedContact.phoneNumber.replace(/\D/g, '');
        if (ph && ph.length >= 10) {
            LID_TO_PHONE_MAP.set(cleanDigits, ph);
            PHONE_TO_LID_MAP.set(ph, cleanDigits);
            saveLidMappingToDisk(cleanDigits, ph, accountId);
            return ph;
        }
    }
    for (const [cId, cData] of CONTACTS_CACHE.entries()) {
        if (cData.lid === target || (cData.lid && cData.lid.includes(cleanDigits))) {
            if (cId.includes('@s.whatsapp.net')) {
                const ph = cId.split('@')[0].replace(/\D/g, '');
                if (ph && ph.length >= 10) {
                    LID_TO_PHONE_MAP.set(cleanDigits, ph);
                    PHONE_TO_LID_MAP.set(ph, cleanDigits);
                    saveLidMappingToDisk(cleanDigits, ph, accountId);
                    return ph;
                }
            }
        }
    }

    // 3. Query Baileys Signal Repository (Async USync)
    const activeSock = currentSock || (accountId && accounts.has(accountId) ? accounts.get(accountId)?.sock : null) || accounts.values().next().value?.sock;
    if (activeSock?.signalRepository?.lidMapping?.getPNForLID) {
        try {
            const formattedLid = target.includes('@lid') ? target : `${cleanDigits}@lid`;
            const resolvedPn = await activeSock.signalRepository.lidMapping.getPNForLID(formattedLid);
            if (resolvedPn) {
                const ph = resolvedPn.split('@')[0].replace(/\D/g, '');
                if (ph && ph.length >= 10) {
                    LID_TO_PHONE_MAP.set(cleanDigits, ph);
                    PHONE_TO_LID_MAP.set(ph, cleanDigits);
                    saveLidMappingToDisk(cleanDigits, ph, accountId);
                    console.log(`[Baileys Signal USync Hit] Resolved LID ${cleanDigits} -> PN ${ph}`);
                    return ph;
                }
            }
        } catch (eSignal) {}
    }

    // 4. Check shared JSON file on disk
    if (fs.existsSync(SHARED_LID_MAPPINGS_FILE)) {
        try {
            const sharedMap = JSON.parse(fs.readFileSync(SHARED_LID_MAPPINGS_FILE, 'utf8'));
            if (sharedMap && sharedMap[cleanDigits]) {
                const ph = String(sharedMap[cleanDigits]).replace(/\D/g, '');
                if (ph && ph.length >= 10) {
                    LID_TO_PHONE_MAP.set(cleanDigits, ph);
                    PHONE_TO_LID_MAP.set(ph, cleanDigits);
                    return ph;
                }
            }
        } catch (eDisk) {}
    }

    return null;
}

// Brand Configuration
let BRAND_NAME = 'GRM Garments'; // Overridden by whatsapp_account_config.json on load
let BRAND_TAGLINE = 'Premium Kids & Maternity Wear';

// Autonomous Server-Side Auto-Responder Configuration & Cache
const lastAutoReplyMap = new Map();
let autoReplyConfig = {
    enabled: true,
    cooldownMinutes: 0, // 0 = Instant reply on every message
    keywordMatching: true
};
let autoReplyRules = [];

// Dynamic Auto-Reply Engine: ONLY rules configured in Auto-Reply Module are matched & sent
function getInteractiveResponse(cleanMsg, custName, senderKey, senderNumber, senderJid, cleanNumber) {
    const brand = BRAND_NAME || 'GRM Garments Official';
    const name = custName ? custName.split(' ')[0] : 'there';
    const key = (cleanMsg || '').trim().toLowerCase();
    if (!key) return null;

    loadBrandConfig(); // Always ensure latest rules from whatsapp_account_config.json
    if (!Array.isArray(autoReplyRules) || autoReplyRules.length === 0) {
        return null;
    }

    for (const rule of autoReplyRules) {
        if (rule.enabled === false) continue;
        if (rule.autoSend === false) continue;

        const keywords = Array.isArray(rule.keywords)
            ? rule.keywords
            : (typeof rule.keywords === 'string' ? rule.keywords.split(',').map(k => k.trim()) : []);

        const allTriggers = [...keywords];
        if (rule.name && typeof rule.name === 'string') allTriggers.push(rule.name);

        let matched = false;
        let matchedKw = '';
        for (const kw of allTriggers) {
            const cleanKw = (kw || '').trim().toLowerCase();
            if (!cleanKw) continue;
            if (rule.matchType === 'exact') {
                if (key === cleanKw) { matched = true; matchedKw = cleanKw; break; }
            } else {
                if (key.includes(cleanKw) || cleanKw.includes(key)) { matched = true; matchedKw = cleanKw; break; }
            }
        }

        if (matched) {
            console.log(`[Auto-Reply Engine] 🎯 Matched Auto-Module Rule "${rule.name}" (kw: "${matchedKw}") for customer: "${cleanMsg}"`);
            let customText = (rule.replyText || '')
                .replace(/{customer_name}/g, name)
                .replace(/{brand_name}/g, brand)
                .replace(/{business_phone}/g, senderNumber || cleanNumber || '');

            if (customText.trim()) {
                return {
                    type: 'text',
                    ruleId: rule.id,
                    ruleName: rule.name,
                    text: customText
                };
            }
        }
    }

    // No hardcoded fallback templates! If no auto-module rule matches, return null
    return null;
}

async function getImageBuffer(url) {
    if (!url) return null;
    try {
        // 1. Data URL (Base64) - direct memory buffer decode (0 network latency)
        if (typeof url === 'string' && (url.startsWith('data:') || url.startsWith('/9j/') || url.startsWith('iVBORw0KGgo'))) {
            let base64Data = url;
            if (url.includes('base64,')) {
                base64Data = url.split('base64,')[1];
            } else if (url.startsWith('data:')) {
                base64Data = url.split(',')[1] || url;
            }
            return Buffer.from(base64Data.trim().replace(/\s+/g, ''), 'base64');
        }

        // 2. Direct local file resolution for any URL or path containing uploads/
        if (typeof url === 'string') {
            const lowerUrl = url.toLowerCase();
            const uploadIdx = lowerUrl.indexOf('uploads');
            if (uploadIdx !== -1) {
                const relPath = url.substring(uploadIdx).split('?')[0].replace(/\//g, path.sep);
                const candidates = [
                    path.resolve(__dirname, '..', relPath),
                    path.resolve(__dirname, relPath),
                    path.resolve(process.cwd(), relPath),
                    path.resolve(process.cwd(), '..', relPath),
                    path.resolve('D:\\CRM_APP\\Grm_Crm', relPath),
                    path.resolve('D:\\CRM_APP', relPath)
                ];
                for (const c of candidates) {
                    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
                        return fs.readFileSync(c);
                    }
                }
            }
        }

        // 3. General local relative path or root path
        if (typeof url === 'string') {
            const cleanPath = url.replace(/^[\/\\]+/, '').replace(/\//g, path.sep);
            const candidates = [
                path.resolve(__dirname, '..', cleanPath),
                path.resolve(__dirname, cleanPath),
                path.resolve(process.cwd(), cleanPath),
                path.resolve('D:\\CRM_APP\\Grm_Crm', cleanPath),
                path.resolve('D:\\CRM_APP', cleanPath)
            ];
            for (const candidate of candidates) {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                    return fs.readFileSync(candidate);
                }
            }
        }

        // 4. Online Web URL (http / https)
        if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
            if (typeof fetch === 'function') {
                const res = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                    }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const arrayBuf = await res.arrayBuffer();
                return Buffer.from(arrayBuf);
            }
        }

        // 5. Remote Hostinger Fallback for relative paths like uploads/media/...
        if (typeof url === 'string' && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
            const cleanRel = url.replace(/^[/\\]+/, '');
            const candidateUrls = [
                `${CRM_BASE_URL}/${cleanRel}`,
                `https://maroon-partridge-532881.hostingersite.com/${cleanRel}`,
                `http://localhost:8000/${cleanRel}`,
                `http://localhost/${cleanRel}`
            ];
            for (const remoteUrl of candidateUrls) {
                if (typeof fetch === 'function') {
                    try {
                        const res = await fetch(remoteUrl, {
                            headers: {
                                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                            }
                        });
                        if (res.ok) {
                            const arrayBuf = await res.arrayBuffer();
                            return Buffer.from(arrayBuf);
                        }
                    } catch (e) {}
                }
            }
        }
    } catch (e) {
        console.warn(`[Image Buffer Fetch Failed for ${url?.slice?.(0, 80)}]:`, e.message);
    }
    return null;
}

async function getAudioBuffer(url) {
    if (!url) return null;
    try {
        if (typeof url === 'string' && (url.startsWith('data:audio/') || url.startsWith('data:video/'))) {
            const base64Data = url.split(',')[1] || url.replace(/^data:[^;]+;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        }
        if (typeof url === 'string') {
            const rawUrl = url.split('?')[0];
            const cleanPath = rawUrl.replace(/^[/\\]+/, '').replace(/\//g, path.sep);
            const candidates = [
                path.resolve(__dirname, '..', cleanPath),
                path.resolve(__dirname, cleanPath),
                path.resolve('d:/crm-app/crm-app', cleanPath)
            ];
            for (const candidate of candidates) {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                    return fs.readFileSync(candidate);
                }
            }
        }
        if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
            if (typeof fetch === 'function') {
                const res = await fetch(url);
                if (res.ok) {
                    const arrayBuf = await res.arrayBuffer();
                    return Buffer.from(arrayBuf);
                }
            }
        }
        // Remote Hostinger Fallback for relative paths like uploads/voice/...
        if (typeof url === 'string' && !url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('data:')) {
            const remoteUrl = `${CRM_BASE_URL}/${url.replace(/^[/\\]+/, '')}`;
            if (typeof fetch === 'function') {
                try {
                    const res = await fetch(remoteUrl);
                    if (res.ok) {
                        const arrayBuf = await res.arrayBuffer();
                        return Buffer.from(arrayBuf);
                    }
                } catch (e) {}
            }
        }
    } catch (e) {
        console.warn(`[Audio Buffer Fetch Failed for ${url?.slice?.(0, 80)}]:`, e.message);
    }
    return null;
}

// Detect FFmpeg for WhatsApp PTT voice note audio transcoding
let ffmpegBinPath = null;
const possibleFfmpegPaths = [
    path.resolve(__dirname, 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.resolve(__dirname, 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
    path.resolve(__dirname, 'node_modules', '@ffmpeg-installer', 'darwin-x64', 'ffmpeg'),
    path.resolve(__dirname, '..', 'bridge', 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.resolve(__dirname, '..', 'bridge', 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
    path.resolve(__dirname, '..', 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.resolve(__dirname, '..', 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
    path.resolve(process.cwd(), 'bridge', 'node_modules', '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe'),
    path.resolve(process.cwd(), 'bridge', 'node_modules', '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg'
];
for (const p of possibleFfmpegPaths) {
    if (fs.existsSync(p)) {
        ffmpegBinPath = p;
        console.log('[FFmpeg Audio Engine] Loaded binary from direct path:', ffmpegBinPath);
        break;
    }
}
if (!ffmpegBinPath) {
    try {
        const ffmpegInstaller = require(path.resolve(__dirname, 'node_modules', '@ffmpeg-installer', 'ffmpeg'));
        if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
            ffmpegBinPath = ffmpegInstaller.path;
            console.log('[FFmpeg Audio Engine] Loaded binary from @ffmpeg-installer/ffmpeg:', ffmpegBinPath);
        }
    } catch (e) {
        try {
            const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
            if (ffmpegInstaller && ffmpegInstaller.path && fs.existsSync(ffmpegInstaller.path)) {
                ffmpegBinPath = ffmpegInstaller.path;
                console.log('[FFmpeg Audio Engine] Loaded binary from global @ffmpeg-installer/ffmpeg:', ffmpegBinPath);
            }
        } catch (e2) {
            try {
                const { execSync } = require('child_process');
                const out = execSync(process.platform === 'win32' ? 'where ffmpeg' : 'which ffmpeg', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
                const firstPath = out.split(/[\r\n]+/)[0]?.trim();
                if (firstPath && fs.existsSync(firstPath)) {
                    ffmpegBinPath = firstPath;
                    console.log('[FFmpeg Audio Engine] Loaded binary from system PATH:', ffmpegBinPath);
                }
            } catch (e3) {
                console.warn('[FFmpeg Audio Engine] Could not load FFmpeg binary:', e2.message);
            }
        }
    }
}

/**
 * Transcodes any audio (MP3, WebM, WAV, AAC) into WhatsApp-native Opus OGG format.
 * WhatsApp PTT voice notes STRICTLY require libopus inside an OGG container at 48000Hz mono.
 */
async function convertToWhatsAppOpus(inputBuffer, inputExt = 'mp3') {
    if (!inputBuffer || !inputBuffer.length) return null;

    // Detect actual container magic bytes
    let actualExt = inputExt || 'mp3';
    if (inputBuffer.length >= 4) {
        if (inputBuffer[0] === 0x1A && inputBuffer[1] === 0x45 && inputBuffer[2] === 0xDF && inputBuffer[3] === 0xA3) {
            actualExt = 'webm';
        } else if (inputBuffer[0] === 0x4F && inputBuffer[1] === 0x67 && inputBuffer[2] === 0x67 && inputBuffer[3] === 0x53) {
            actualExt = 'ogg';
        } else if (inputBuffer[0] === 0x52 && inputBuffer[1] === 0x49 && inputBuffer[2] === 0x46 && inputBuffer[3] === 0x46) {
            actualExt = 'wav';
        } else if ((inputBuffer[0] === 0x49 && inputBuffer[1] === 0x44 && inputBuffer[2] === 0x33) || (inputBuffer[0] === 0xFF && (inputBuffer[1] & 0xE0) === 0xE0)) {
            actualExt = 'mp3';
        }
    }

    // Check if ALREADY valid WhatsApp-compliant Ogg Opus (starts with OggS and contains OpusHead)
    const isAlreadyOpusOgg = (actualExt === 'ogg' && inputBuffer.length > 28 &&
        inputBuffer[0] === 0x4F && inputBuffer[1] === 0x67 && inputBuffer[2] === 0x67 && inputBuffer[3] === 0x53 &&
        inputBuffer.indexOf(Buffer.from('OpusHead')) !== -1);

    if (isAlreadyOpusOgg) {
        // Already native Ogg Opus - valid for direct WhatsApp PTT delivery
        return inputBuffer;
    }

    if (!ffmpegBinPath) {
        console.warn('[Audio Transcode] FFmpeg binary not available, falling back to raw buffer');
        return inputBuffer;
    }

    const tempDir = path.resolve(__dirname, '..', 'uploads', 'voice', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const rand = Math.random().toString(36).substring(2, 7);
    const tempIn = path.join(tempDir, `ptt_in_${Date.now()}_${rand}.${actualExt}`);
    const tempOut = path.join(tempDir, `ptt_out_${Date.now()}_${rand}.ogg`);

    try {
        fs.writeFileSync(tempIn, inputBuffer);
        const { execSync } = require('child_process');
        // Transcode to strict WhatsApp PTT standard: 48000Hz, mono, libopus in ogg container, voice-optimized voip profile
        // Include -fflags +genpts+igndts -avoid_negative_ts make_zero to handle browser MediaRecorder WebM fragmented chunks
        const cmd = `"${ffmpegBinPath}" -y -fflags +genpts+igndts -avoid_negative_ts make_zero -i "${tempIn}" -vn -c:a libopus -b:a 32k -ar 48000 -ac 1 -application voip -f ogg "${tempOut}"`;
        execSync(cmd, { stdio: 'ignore', timeout: 10000 });
        if (fs.existsSync(tempOut) && fs.statSync(tempOut).size > 0) {
            const converted = fs.readFileSync(tempOut);
            const isValidOggOpus = (converted.length > 28 &&
                converted[0] === 0x4F && converted[1] === 0x67 && converted[2] === 0x67 && converted[3] === 0x53 &&
                converted.indexOf(Buffer.from('OpusHead')) !== -1);
            if (isValidOggOpus) {
                console.log(`[Audio Transcode] Successfully transcoded ${inputBuffer.length} bytes (${actualExt}) -> ${converted.length} bytes (WhatsApp Opus OGG)`);
                return converted;
            }
        }
    } catch (err) {
        console.warn('[Audio Transcode Warning]:', err.message);
    } finally {
        try { if (fs.existsSync(tempIn)) fs.unlinkSync(tempIn); } catch (e) {}
        try { if (fs.existsSync(tempOut)) fs.unlinkSync(tempOut); } catch (e) {}
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
            if (Array.isArray(rawCfg.autoReplyRules)) autoReplyRules = rawCfg.autoReplyRules;
        }
    } catch (e) { }
}
loadBrandConfig();

const DEFAULT_ACCOUNT_DEFINITIONS = [
    { id: 'account_1', label: 'Primary WhatsApp' },
    { id: 'account_2', label: 'WhatsApp Business (account_2)' }
];

// Helper to get all accounts summary
function getAccountsSummary() {
    const list = [];
    const seen = new Set();
    for (const [id, acc] of accounts.entries()) {
        seen.add(id);
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
    // Only include Primary account (account_1) if not yet actively started
    for (const def of DEFAULT_ACCOUNT_DEFINITIONS) {
        if (!seen.has(def.id)) {
            list.push({
                id: def.id,
                label: def.label,
                status: 'DISCONNECTED',
                connected_number: null,
                connected_name: null,
                qr_image: null,
                last_active: null
            });
        }
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



function resolveCrmBaseUrl() {
    let url = process.env.CRM_URL || process.env.APP_URL || 'https://maroon-partridge-532881.hostingersite.com';
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
    }
    return url.replace(/\/+$/, '');
}
const CRM_BASE_URL = resolveCrmBaseUrl();

// Dynamic Public Base URL Resolver (Hostinger CRM Base)
function getPublicBaseUrl() {
    if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/+$/, '');
    if (process.env.APP_URL && !process.env.APP_URL.includes('localhost') && !process.env.APP_URL.includes('127.0.0.1')) {
        let u = process.env.APP_URL;
        if (!u.startsWith('http://') && !u.startsWith('https://')) u = 'https://' + u;
        return u.replace(/\/+$/, '');
    }
    return 'https://maroon-partridge-532881.hostingersite.com';
}

// Synchronize account status directly to local whatsapp_account_config.json with strict slot isolation
function syncLocalConfigFile(accountId, status, phoneNumber, qrCode, label) {
    try {
        const localCfgPath = path.join(__dirname, '..', 'whatsapp_account_config.json');
        if (fs.existsSync(localCfgPath)) {
            const cfg = JSON.parse(fs.readFileSync(localCfgPath, 'utf8'));
            if (!Array.isArray(cfg.connected_lines)) cfg.connected_lines = [];
            let line = cfg.connected_lines.find(l => l.id === accountId);
            if (!line) {
                line = { id: accountId, label: label || (accountId === 'account_1' ? 'Primary WhatsApp' : `WhatsApp Business (${accountId})`) };
                cfg.connected_lines.push(line);
            }
            line.status = status;
            if (phoneNumber) {
                line.phone_number = phoneNumber;
            } else if (status === 'DISCONNECTED') {
                line.phone_number = 'Awaiting Link';
            }
            if (qrCode) {
                line.qr_code = qrCode;
            } else if (status === 'CONNECTED' || status === 'DISCONNECTED') {
                delete line.qr_code;
            }
            if (label) line.label = label;

            // Only update root configuration if primary line (account_1)
            if (accountId === 'account_1') {
                cfg.status = status;
                if (phoneNumber && status === 'CONNECTED') cfg.phone_number = phoneNumber;
                if (status === 'DISCONNECTED') cfg.phone_number = 'Awaiting Link';
                cfg.provider = 'QR_CODE_BRIDGE';
            }
            cfg.last_sync = new Date().toISOString().replace('T', ' ').substring(0, 19);
            fs.writeFileSync(localCfgPath, JSON.stringify(cfg, null, 4), 'utf8');
            console.log(`💾 [Local Config Sync] Updated ${accountId} -> ${status} (${phoneNumber || 'No phone'})`);
        }
    } catch (e) {
        console.warn('⚠️ [Local Config Sync Notice]:', e.message);
    }
}

// Fast CRM API Dispatcher with instant local & remote sync priority
async function callCrmApi(action, postData) {
    const isRemoteEnv = Boolean(process.env.REMOTE_BRIDGE || process.env.RENDER || process.env.HOSTINGER || __dirname.includes('hostingersite'));
    let localHtdocsUrl = null;
    try {
        const normDir = path.resolve(__dirname, '..').replace(/\\/g, '/');
        if (/htdocs\//i.test(normDir)) {
            const rel = normDir.split(/htdocs\//i)[1];
            if (rel) {
                localHtdocsUrl = 'http://localhost/' + encodeURI(rel);
            }
        }
    } catch (e) {}

    const candidateUrls = isRemoteEnv ? [
        process.env.CRM_URL,
        process.env.APP_URL,
        'https://maroon-partridge-532881.hostingersite.com',
        CRM_BASE_URL
    ].filter(Boolean) : [
        localHtdocsUrl,
        'http://localhost',
        'http://127.0.0.1',
        'http://localhost:8080',
        'http://127.0.0.1:8080',
        'http://localhost:8000',
        'http://127.0.0.1:8000'
    ].filter(Boolean);

    let firstSuccess = null;
    for (const base of candidateUrls) {
        try {
            const isGet = !postData || Object.keys(postData).length === 0;
            const resp = await fetch(`${base}/api.php?action=${action}`, {
                method: isGet ? 'GET' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: isGet ? undefined : JSON.stringify(postData),
                signal: AbortSignal.timeout(3000)
            });
            if (resp.ok) {
                const data = await resp.json().catch(() => null);
                if (data && !firstSuccess) {
                    firstSuccess = data;
                }
                // For account status sync, notify both local and remote backends
                if (action !== 'sync_account_status') {
                    return data;
                }
            }
        } catch (e) {
            // try next candidate
        }
    }
    return firstSuccess;
}

// Forward inbound WhatsApp call to CRM PHP API
async function forwardCallToCRM(data) {
    try {
        await callCrmApi('simulate_incoming_call', data);
    } catch (e) {
        console.error('Error forwarding incoming call to CRM:', e.message);
    }
}

// Forward inbound call termination / hangup to CRM PHP API
async function forwardCallEndToCRM(callId) {
    try {
        await callCrmApi('dismiss_call', { call_id: callId });
    } catch (e) {
        console.error('Error forwarding call termination to CRM:', e.message);
    }
}

// Initialize WebRTC Voice Signaling & Audio Recording Ingestion Engine
initVoiceSignaling({ app, io, callCrmApi });

// Forward inbound WhatsApp message to CRM PHP API for persistent file storage


// Ensure Hostinger CRM reflects all active connected WhatsApp accounts
async function syncAccountStatusToCrm() {
    try {
        for (const [accId, accObj] of accounts.entries()) {
            if (accObj.status === 'CONNECTED' && accObj.connectedNumber) {
                await callCrmApi('sync_account_status', {
                    account_slot: accId,
                    status: 'CONNECTED',
                    phone_number: accObj.connectedNumber,
                    qr_code: null,
                    connected_name: accObj.connectedName,
                    label: accObj.label
                }).catch(() => {});
            }
        }
    } catch (e) {
        console.warn('Could not sync account status to CRM:', e.message);
    }
}
setTimeout(syncAccountStatusToCrm, 3000);
setInterval(syncAccountStatusToCrm, 5 * 60 * 1000);

// Active Live Connection Keeper: Periodically ensure Hostinger reflects all active WhatsApp sessions (gentle 60s interval to prevent firewall rate-limiting)
setInterval(async () => {
    for (const [accId, accObj] of accounts.entries()) {
        if (accObj.status === 'CONNECTED' && accObj.connectedNumber) {
            const res = await callCrmApi('sync_account_status', {
                account_slot: accId,
                status: 'CONNECTED',
                phone_number: accObj.connectedNumber,
                qr_code: null,
                connected_name: accObj.connectedName,
                label: accObj.label
            }).catch(e => ({ err: e.message }));
            if (process.env.DEBUG) console.log(`[Status Keeper] ${accId} (${accObj.connectedNumber}) -> synced:`, res?.message || res?.status);
            const sDir = path.join(SESSIONS_BASE_DIR, accId);
            backupAllSessionFiles(accId, sDir);
        }
    }
}, 60 * 1000);

// Keep-Alive Self Ping: Prevents Hostinger Passenger / CloudLinux Node.js process from sleeping / idle spin-down
setInterval(() => {
    try {
        const port = process.env.PORT || 3000;
        http.get(`http://127.0.0.1:${port}/api/health`, () => {}).on('error', () => {});
    } catch (e) {}
}, 2 * 60 * 1000);

console.log(`🚀 [Hostinger Mode]: WhatsApp Bridge connected to CRM at ${CRM_BASE_URL}`);

async function forwardToCRM(data) {
    try {
        const json = await callCrmApi('receive_message', data);
        if (json && (json.status === 'success' || json.status === 'OK')) {
            console.log(`💾 [Message Saved] Inbound message ${data.id || data.message_uid} saved to CRM database successfully (Status: ${json?.status || 'OK'})`);
        } else {
            console.log(`💾 [Message Dispatched] Inbound message ${data.id || data.message_uid} forwarded to CRM`);
        }
    } catch (e) {
        console.error('Error forwarding message to CRM:', e.message);
    }
}

// Helper to determine destination JID (Resolves WhatsApp Privacy LIDs to Standard Phone JIDs for flawless delivery)
function resolveDestinationJid(phoneOrJid) {
    if (!phoneOrJid) return null;
    let target = phoneOrJid.toString().trim();

    // Remove multi-device index if present (e.g. :0, :1, :2)
    if (target.includes(':')) {
        const parts = target.split(':');
        const afterColon = parts[1] || '';
        if (afterColon.includes('@')) {
            target = parts[0] + '@' + afterColon.split('@')[1];
        } else {
            target = parts[0];
        }
    }

    // 1. Check if target has @lid or is a 14+ digit privacy LID
    let cleanDigits = target.replace(/[^0-9]/g, '');

    // Strip trailing device index 0 artifact (e.g. 9181240385850 -> 918124038585 or 81240385850 -> 8124038585)
    if (cleanDigits.length === 13 && cleanDigits.startsWith('91') && cleanDigits.endsWith('0')) {
        cleanDigits = cleanDigits.slice(0, 12);
    } else if (cleanDigits.length === 11 && cleanDigits.endsWith('0') && !cleanDigits.startsWith('0')) {
        cleanDigits = cleanDigits.slice(0, 10);
    }

    if (target.includes('@lid') || cleanDigits.length >= 14) {
        const lidDigits = target.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
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
                        } catch (e) { }
                    }
                }
            }
        } catch (e) { }
        return `${lidDigits}@lid`;
    }

    // 2. Standard WhatsApp format
    if (target.includes('@s.whatsapp.net')) {
        let userPart = target.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
        if (userPart.length === 13 && userPart.startsWith('91') && userPart.endsWith('0')) {
            userPart = userPart.slice(0, 12);
        } else if (userPart.length === 11 && userPart.endsWith('0') && !userPart.startsWith('0')) {
            userPart = userPart.slice(0, 10);
        }
        if (userPart.length === 10) userPart = '91' + userPart;
        return `${userPart}@s.whatsapp.net`;
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

    let clean = cleanDigits;
    if (clean.length === 10) {
        clean = '91' + clean;
    }

    return `${clean}@s.whatsapp.net`;
}

// Initialize a specific WhatsApp Account session
async function initAccountSession(accountId, label = 'WhatsApp Account') {
    clearReconnectTimer(accountId);
    const lock = accountLocks.get(accountId) || { isConnecting: false, attempts: 0 };
    if (lock.isConnecting) {
        console.log(`[QR Bridge - ${accountId}] Session initialization already in progress, skipping concurrent call.`);
        return accounts.get(accountId);
    }
    lock.isConnecting = true;
    accountLocks.set(accountId, lock);

    const sessionDir = path.join(SESSIONS_BASE_DIR, accountId);
    if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true });
    }

    const existingAcc = accounts.get(accountId);
    if (existingAcc && existingAcc.sock) {
        console.log(`[QR Bridge - ${accountId}] Terminating previous socket before opening new session`);
        try {
            existingAcc.sock.ev.removeAllListeners();
            existingAcc.sock.end();
        } catch (e) {}
        existingAcc.sock = null;
    }

    const accountObj = {
        id: accountId,
        label: existingAcc?.label || label,
        status: existingAcc?.status === 'CONNECTED' ? 'CONNECTED' : (existingAcc?.connectedNumber ? 'RECONNECTING' : 'CONNECTING'),
        sock: null,
        qrImage: null,
        connectedNumber: existingAcc?.connectedNumber || null,
        connectedName: existingAcc?.connectedName || null,
        isStarting: true,
        intentionalLogout: false,
        lastActive: new Date().toISOString()
    };

    accounts.set(accountId, accountObj);
    if (!accountObj.connectedNumber) {
        broadcastAccountsUpdate();
    }

    try {
        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
        if (state.creds?.me?.id) {
            if (!state.creds.registered) {
                state.creds.registered = true;
                try { await saveCreds(); } catch (e) {}
            }
            const rawNum = state.creds.me.id.split(':')[0].split('@')[0];
            accountObj.connectedNumber = rawNum.startsWith('+') ? rawNum : ('+' + rawNum);
            accountObj.connectedName = state.creds.me.name || `${label} (${accountObj.connectedNumber})`;
        }

        let version = [2, 3000, 1015901307];
        try {
            const v = await fetchLatestBaileysVersion();
            if (v && v.version) version = v.version;
        } catch (e) {}

        const silentLogger = pino({ level: 'silent' });

        const sock = makeWASocket({
            version,
            logger: silentLogger,
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, silentLogger)
            },
            browser: Browsers.windows('Chrome'),
            syncFullHistory: false, // Prevents loading heavy history that crashes or times out after 2 min
            keepAliveIntervalMs: 25000, // Send keep-alive every 25s to keep socket alive stably
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            generateHighQualityLinkPreview: false,
            retryRequestDelayMs: 500,
            markOnlineOnConnect: true,
            getMessage: async (key) => {
                return { conversation: 'keepalive' };
            }
        });

        accountObj.sock = sock;

        sock.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                const credsFile = path.join(sessionDir, 'creds.json');
                if (fs.existsSync(credsFile)) {
                    const rawCreds = fs.readFileSync(credsFile, 'utf8');
                    backupSessionFilesToDb(accountId, { 'creds.json': rawCreds });
                }
            } catch (e) {
                console.warn(`[Creds Save Notice for ${accountId}]:`, e.message);
            }
        });

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                if (accountObj.status === 'CONNECTED' || Boolean(state.creds?.me?.id)) {
                    console.log(`[QR Bridge - ${accountId}] Ignoring spurious QR code since session is already authenticated for ${state.creds?.me?.id || accountObj.connectedNumber}.`);
                    return;
                }
                console.log(`[QR Bridge - ${accountId}] New QR Code generated for ${label}.`);
                try {
                    accountObj.qrImage = await qrcode.toDataURL(qr);
                    accountObj.status = 'SCAN_QR';
                    accountObj.isStarting = false;
                    broadcastAccountsUpdate();
                    // Sync QR code to Hostinger CRM API
                    callCrmApi('sync_account_status', {
                        account_slot: accountId,
                        status: 'SCAN_QR',
                        qr_code: accountObj.qrImage,
                        force: true,
                        label: label
                    }).catch(() => {});
                } catch (err) {
                    console.error('QR Generate Error:', err);
                }
            }

            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const isLoggedOut = (statusCode === DisconnectReason.loggedOut || statusCode === 401 || statusCode === 403);
                const isReplaced = (statusCode === DisconnectReason.connectionReplaced || statusCode === 440);
                console.log(`[QR Bridge - ${accountId}] Connection closed (status: ${statusCode}). Logged out: ${isLoggedOut}`);

                if (accountObj.intentionalLogout) {
                    console.log(`[QR Bridge - ${accountId}] Connection closed due to intentional CRM disconnect. Skipping reconnect.`);
                    return;
                }

                if (isLoggedOut) {
                    clearReconnectTimer(accountId);
                    accountLocks.set(accountId, { isConnecting: false, attempts: 0 });
                    console.log(`[QR Bridge - ${accountId}] Session unlinked / logged out on mobile phone. Cleaning session credentials...`);

                    accountObj.status = 'LOGGED_OUT';
                    accountObj.qrImage = null;
                    accountObj.connectedNumber = null;
                    accountObj.connectedName = null;
                    accountObj.isStarting = false;

                    try {
                        sock.ev.removeAllListeners();
                        sock.end();
                    } catch (e) {}
                    accountObj.sock = null;

                    try {
                        if (fs.existsSync(sessionDir)) {
                            fs.rmSync(sessionDir, { recursive: true, force: true });
                        }
                        if (accountId === 'account_1') {
                            const legacyDir = path.join(__dirname, 'auth_session');
                            if (fs.existsSync(legacyDir)) {
                                fs.rmSync(legacyDir, { recursive: true, force: true });
                            }
                        }
                    } catch (e) {
                        console.warn(`[Session Clean Error for ${accountId}]:`, e.message);
                    }

                    // Purge session from MySQL database permanently on explicit mobile logout
                    clearSessionFromDb(accountId);

                    syncLocalConfigFile(accountId, 'DISCONNECTED', null, null, label);
                    broadcastAccountsUpdate();

                    callCrmApi('sync_account_status', {
                        account_slot: accountId,
                        status: 'LOGGED_OUT',
                        phone_number: null,
                        qr_code: null,
                        disconnect_reason: `Logged out from WhatsApp mobile device (code ${statusCode})`,
                        reconnect_attempts: 0,
                        force: true,
                        force_disconnect: true,
                        label: label
                    }).catch(() => {});

                    return; // Crucial: ZERO auto-reconnection on logged out!
                }

                // If credentials don't exist on disk, we cannot reconnect anyway
                const credsFile = path.join(sessionDir, 'creds.json');
                if (!fs.existsSync(credsFile)) {
                    console.log(`[QR Bridge - ${accountId}] No session credentials on disk. Setting to DISCONNECTED.`);
                    clearReconnectTimer(accountId);
                    accountObj.status = 'DISCONNECTED';
                    accountObj.qrImage = null;
                    accountObj.connectedNumber = null;
                    accountObj.isStarting = false;
                    broadcastAccountsUpdate();
                    return;
                }

                // Temporary disconnect (network drop, 515 restartRequired, 408 timeout, 428 connection lost)
                const currentLock = accountLocks.get(accountId) || { isConnecting: false, attempts: 0 };
                currentLock.attempts = (currentLock.attempts || 0) + 1;
                currentLock.isConnecting = false;
                accountLocks.set(accountId, currentLock);

                accountObj.status = 'RECONNECTING';
                accountObj.qrImage = null;
                accountObj.isStarting = false;
                // Preserve accountObj.connectedNumber so CRM doesn't reset to "Device not linked"
                broadcastAccountsUpdate();

                const reasonStr = (statusCode === 515)
                    ? 'Baileys protocol restart (515)'
                    : (isReplaced ? 'Connection replaced / conflict (440)' : `Temporary network drop (${statusCode || 'network'})`);

                callCrmApi('sync_account_status', {
                    account_slot: accountId,
                    status: 'RECONNECTING',
                    disconnect_reason: reasonStr,
                    reconnect_attempts: currentLock.attempts,
                    label: label
                }).catch(() => {});

                clearReconnectTimer(accountId);

                let reconnectDelay = 3500;
                if (statusCode === 515) {
                    reconnectDelay = 1200;
                } else if (isReplaced) {
                    reconnectDelay = 10000;
                } else {
                    reconnectDelay = Math.min(30000, 1500 * Math.pow(1.5, Math.min(currentLock.attempts, 6))) + Math.floor(Math.random() * 800);
                }

                console.log(`[QR Bridge - ${accountId}] Scheduling reconnection attempt #${currentLock.attempts} in ${reconnectDelay}ms (${reasonStr})`);
                const timer = setTimeout(() => {
                    reconnectTimers.delete(accountId);
                    initAccountSession(accountId, label);
                }, reconnectDelay);
                reconnectTimers.set(accountId, timer);
            } else if (connection === 'open') {
                accountLocks.set(accountId, { isConnecting: false, attempts: 0 });
                clearReconnectTimer(accountId);

                accountObj.status = 'CONNECTED';
                accountObj.intentionalLogout = false;
                accountObj.qrImage = null;
                accountObj.isStarting = false;
                accountObj.lastActive = new Date().toISOString();

                const rawId = sock.user?.id || '';
                const cleanNum = rawId.split(':')[0].split('@')[0];
                accountObj.connectedNumber = cleanNum.startsWith('+') ? cleanNum : ('+' + cleanNum);
                accountObj.connectedName = sock.user?.name || `${label} (${accountObj.connectedNumber})`;

                console.log(`[QR Bridge - ${accountId}] Connected Successfully: ${accountObj.connectedNumber} (${accountObj.connectedName})`);
                broadcastAccountsUpdate();

                // Persist full session keys & credentials to MySQL database (Survives Reboots & Git Deploys)
                backupAllSessionFiles(accountId, sessionDir);

                // Persist CONNECTED status directly to local config file and CRM database
                syncLocalConfigFile(accountId, 'CONNECTED', accountObj.connectedNumber, null, label);
                callCrmApi('sync_account_status', {
                    account_slot: accountId,
                    status: 'CONNECTED',
                    phone_number: accountObj.connectedNumber,
                    qr_code: null,
                    connected_name: accountObj.connectedName,
                    disconnect_reason: null,
                    reconnect_attempts: 0,
                    force: true,
                    label: label
                }).catch(() => {});
            }
        });

        // Listen for Real Inbound Customer WhatsApp Calls on this Account
        sock.ev.on('call', async (callEvents) => {
            for (const call of callEvents) {
                console.log(`📞 [QR Bridge - ${accountId}] Baileys Inbound WhatsApp Call (${call.status}):`, call);
                const callId = call.id || ('CALL-' + Date.now());

                if (call.status === 'offer' || (call.status === 'ringing' && !ACTIVE_BAILEYS_CALLS.has(callId))) {
                    // Extract true caller phone number: Handle Privacy LID (@lid) & standard @s.whatsapp.net
                    let rawPhoneDigits = '';
                    let isLid = false;
                    let lidNumber = '';

                    // 1. Prioritize explicit callerPn from Baileys if present
                    if (call.callerPn && typeof call.callerPn === 'string') {
                        rawPhoneDigits = call.callerPn.replace(/[^0-9]/g, '');
                    }

                    // 2. Extract from call.chatId or call.from
                    const candidateJids = [call.chatId, call.from].filter(Boolean);
                    for (const cand of candidateJids) {
                        if (typeof cand === 'string' && cand.includes('@lid')) {
                            isLid = true;
                            lidNumber = cand.split('@')[0].replace(/[^0-9]/g, '');
                            if (!rawPhoneDigits && LID_TO_PHONE_MAP.has(lidNumber)) {
                                rawPhoneDigits = LID_TO_PHONE_MAP.get(lidNumber);
                            }
                        } else if (typeof cand === 'string' && !rawPhoneDigits && !cand.includes('@lid')) {
                            rawPhoneDigits = cand.split('@')[0].replace(/[^0-9]/g, '');
                        }
                    }

                    // 3. If callerPn was provided alongside LID, update bidirectional LID cache
                    if (isLid && lidNumber && rawPhoneDigits && rawPhoneDigits !== lidNumber) {
                        LID_TO_PHONE_MAP.set(lidNumber, rawPhoneDigits);
                        PHONE_TO_LID_MAP.set(rawPhoneDigits, lidNumber);
                    }

                    // 4. Format normalized phone number
                    let callerPhone = 'Unknown Caller';
                    if (rawPhoneDigits) {
                        if (rawPhoneDigits.startsWith('91') && rawPhoneDigits.length === 12) {
                            callerPhone = '+91 ' + rawPhoneDigits.slice(2, 7) + ' ' + rawPhoneDigits.slice(7);
                        } else if (rawPhoneDigits.length === 10) {
                            callerPhone = '+91 ' + rawPhoneDigits.slice(0, 5) + ' ' + rawPhoneDigits.slice(5);
                        } else {
                            callerPhone = '+' + rawPhoneDigits;
                        }
                    }

                    // 5. Attempt to resolve real customer name from WhatsApp contacts or pushName
                    let customerName = 'WhatsApp Caller';
                    try {
                        const contact = (sock.contacts && (
                            sock.contacts[`${rawPhoneDigits}@s.whatsapp.net`] ||
                            sock.contacts[call.from] ||
                            sock.contacts[call.chatId]
                        )) || null;
                        if (contact && (contact.name || contact.notify || contact.verifiedName)) {
                            customerName = contact.name || contact.notify || contact.verifiedName;
                        } else if (call.notify || call.pushName) {
                            customerName = call.notify || call.pushName;
                        }
                    } catch (e) {}

                    const cleanDigits = rawPhoneDigits || (lidNumber ? lidNumber.slice(-10) : '0000000000');
                    const customerId = 'cust_' + cleanDigits.slice(-10);
                    const maskedPhone = (cleanDigits.length >= 10)
                        ? '+91 ' + cleanDigits.slice(-10, -8) + '*** ***' + cleanDigits.slice(-2)
                        : callerPhone;

                    const nowEpoch = Date.now();
                    const cleanCallId = String(callId).replace(/[^a-zA-Z0-9]/g, '');
                    const roomToken = 'vrm_' + cleanCallId;

                    const callData = {
                        call_id: callId,
                        id: callId,
                        account_id: accountId,
                        customer_id: customerId,
                        customer_name: customerName,
                        customer_phone: callerPhone,
                        raw_caller_digits: cleanDigits,
                        masked_phone: maskedPhone,
                        virtual_number: accountObj.connectedNumber || '+91 95009 04638',
                        status: 'RINGING',
                        voice_room_token: roomToken,
                        is_video: Boolean(call.isVideo),
                        started_at: new Date(nowEpoch).toISOString(),
                        timestamp: nowEpoch,
                        timeout_seconds: 30,
                        eligible_staff_ids: ['all', 'admin', 'staff_01', 'staff_02', 'staff_03', 'staff_05']
                    };

                    // Register active Baileys inbound call for atomic pickup & ringing control
                    ACTIVE_BAILEYS_CALLS.set(callId, {
                        callId,
                        accountId,
                        sock,
                        callFrom: call.from,
                        chatId: call.chatId,
                        candidateJids,
                        callerPn: call.callerPn,
                        customerName,
                        callerPhone,
                        cleanDigits,
                        roomToken,
                        timestamp: nowEpoch
                    });

                    // Pre-register WebRTC room in memory
                    VOICE_ROOMS.set(roomToken, {
                        roomToken: roomToken,
                        callId: callId,
                        status: 'WAITING',
                        customerSocketId: null,
                        staffSocketId: null,
                        customerInfo: { name: customerName, phone: callerPhone },
                        staffInfo: {},
                        startedAt: new Date(nowEpoch).toISOString(),
                        connectedAt: null,
                        chunksCount: 0
                    });

                    console.log(`🔔 [Inbound Call Broadcast] Alerting staff for caller: ${customerName} (${callerPhone}) on Account ${accountId} [Room: ${roomToken}]`);
                    // Broadcast via Socket.IO across all connected CRM clients immediately
                    io.emit('call:incoming', callData);

                    // Forward to CRM PHP API & MySQL Persistence asynchronously in background
                    forwardCallToCRM(callData).catch(err => {
                        console.warn('⚠️ [Call CRM Forward Note]:', err.message);
                    });
                } else if (call.status === 'terminate' || call.status === 'reject' || call.status === 'timeout') {
                    console.log(`📴 [Call Ended/Terminated] Call ${callId} ended on WhatsApp (${call.status})`);
                    const existingCall = ACTIVE_BAILEYS_CALLS.get(callId);
                    const cleanCallId = String(callId).replace(/[^a-zA-Z0-9]/g, '');
                    const roomToken = existingCall?.roomToken || ('vrm_' + cleanCallId);
                    const room = VOICE_ROOMS.get(roomToken);

                    ACTIVE_BAILEYS_CALLS.delete(callId);

                    // If staff already claimed this call, it was handled natively on WhatsApp — do not mark as MISSED!
                    if (existingCall?.claimedBy) {
                        console.log(`ℹ️ [Call Signaling] Native WhatsApp call completed for claimed call ${callId}; Emitting COMPLETED to CRM.`);
                        io.emit('call:ended', {
                            call_id: callId,
                            id: callId,
                            status: 'COMPLETED',
                            reason: call.status
                        });
                        return;
                    }

                    // If staff was waiting in WebRTC room
                    if (room && (room.status === 'READY' || room.status === 'WAITING' || room.staffSocketId)) {
                        console.log(`ℹ️ [Call Signaling] WhatsApp call ended for room ${roomToken}`);
                        return;
                    }

                    io.emit('call:ended', {
                        call_id: callId,
                        id: callId,
                        status: 'MISSED',
                        reason: call.status
                    });
                    forwardCallEndToCRM(callId).catch(() => {});
                }
            }
        });

        // Maintain synced contact and chat names from mobile phone
        sock.ev.on('contacts.upsert', (contacts) => {
            for (const c of contacts) {
                if (!c.id) continue;
                const existing = CONTACTS_CACHE.get(c.id) || {};
                CONTACTS_CACHE.set(c.id, { ...existing, ...c });
                if (c.lid && c.id.includes('@s.whatsapp.net')) {
                    const ph = c.id.split('@')[0].replace(/[^0-9]/g, '');
                    const lid = c.lid.split('@')[0].replace(/[^0-9]/g, '');
                    if (ph && lid) {
                        LID_TO_PHONE_MAP.set(lid, ph);
                        PHONE_TO_LID_MAP.set(ph, lid);
                    }
                }
            }
        });
        sock.ev.on('contacts.update', (updates) => {
            for (const u of updates) {
                if (!u.id) continue;
                const existing = CONTACTS_CACHE.get(u.id) || {};
                CONTACTS_CACHE.set(u.id, { ...existing, ...u });
            }
        });
        sock.ev.on('chats.upsert', (chats) => {
            for (const ch of chats) {
                if (!ch.id) continue;
                const existing = CONTACTS_CACHE.get(ch.id) || {};
                if (ch.name) existing.name = ch.name;
                CONTACTS_CACHE.set(ch.id, existing);
            }
        });

        // =========================================================================
        // SCENARIO A: TWO-WAY READ SYNC — WHATSAPP PHONE TO CRM
        // Captures chats read/opened on WhatsApp Business mobile phone!
        // =========================================================================
        sock.ev.on('chats.update', async (chatUpdates) => {
            try {
                if (!Array.isArray(chatUpdates)) return;
                for (const cu of chatUpdates) {
                    const isMarkedRead = (cu.unreadCount === 0 || cu.unreadCount === false || (typeof cu.unreadCount === 'number' && cu.unreadCount <= 0));
                    if (isMarkedRead && cu.id) {
                        const jid = cu.id;
                        if (jid.includes('@g.us') || jid === 'status@broadcast') continue;

                        let cleanDigits = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                        if (jid.includes('@lid') && LID_TO_PHONE_MAP.has(cleanDigits)) {
                            cleanDigits = LID_TO_PHONE_MAP.get(cleanDigits);
                        }
                        const phone10 = cleanDigits.slice(-10);
                        if (phone10.length === 10) {
                            const customerId = 'cust_' + phone10;
                            console.log(`📱 [Two-Way Read Sync] Chat ${jid} marked as read on WhatsApp Business Phone! Syncing to CRM...`);

                            // Clear unread message keys in memory
                            UNREAD_KEYS_BY_CHAT.delete(phone10);
                            UNREAD_KEYS_BY_CHAT.delete(customerId);
                            UNREAD_KEYS_BY_CHAT.delete(jid);
                            UNREAD_KEYS_BY_CHAT.delete(`91${phone10}@s.whatsapp.net`);

                            // Broadcast instantly to all CRM browser tabs (Mobile & Desktop) via Socket.IO
                            io.emit('chat:read_status', {
                                customer_id: customerId,
                                user_id: 'admin',
                                phone: phone10,
                                unread_count: 0,
                                source: 'WHATSAPP_PHONE_READ',
                                timestamp: Date.now()
                            });

                            // Forward to CRM PHP API to update database
                            if (typeof callCrmApi === 'function') {
                                callCrmApi('mark_customer_read', {
                                    customer_id: customerId,
                                    user_id: 'admin',
                                    phone: phone10,
                                    source: 'whatsapp_phone'
                                }).catch(() => {});
                            }
                        }
                    }
                }
            } catch (errCu) {
                console.error('[Two-Way Read Sync - chats.update Error]:', errCu.message);
            }
        });

        // Also detect message read receipts from WhatsApp
        sock.ev.on('message-receipt.update', async (receiptUpdates) => {
            try {
                if (!Array.isArray(receiptUpdates)) return;
                for (const ru of receiptUpdates) {
                    if (ru.receipt && (ru.receipt.readTimestamp || ru.receipt.readAt)) {
                        const jid = ru.key?.remoteJid;
                        if (!jid || jid.includes('@g.us') || jid === 'status@broadcast') continue;

                        let cleanDigits = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                        if (jid.includes('@lid') && LID_TO_PHONE_MAP.has(cleanDigits)) {
                            cleanDigits = LID_TO_PHONE_MAP.get(cleanDigits);
                        }
                        const phone10 = cleanDigits.slice(-10);
                        if (phone10.length === 10) {
                            const customerId = 'cust_' + phone10;
                            UNREAD_KEYS_BY_CHAT.delete(phone10);
                            UNREAD_KEYS_BY_CHAT.delete(customerId);
                            UNREAD_KEYS_BY_CHAT.delete(jid);
                            UNREAD_KEYS_BY_CHAT.delete(`91${phone10}@s.whatsapp.net`);

                            io.emit('chat:read_status', {
                                customer_id: customerId,
                                user_id: 'admin',
                                phone: phone10,
                                unread_count: 0,
                                source: 'WHATSAPP_PHONE_READ',
                                timestamp: Date.now()
                            });

                            if (typeof callCrmApi === 'function') {
                                callCrmApi('mark_customer_read', {
                                    customer_id: customerId,
                                    user_id: 'admin',
                                    phone: phone10,
                                    source: 'whatsapp_phone'
                                }).catch(() => {});
                            }
                        }
                    }
                }
            } catch (errRu) {}
        });

        // Capture Baileys real-time LID-to-PN updates
        sock.ev.on('lid-mapping.update', (mapping) => {
            if (!mapping) return;
            const mappings = Array.isArray(mapping) ? mapping : [mapping];
            for (const m of mappings) {
                if (!m.lid || !m.pn) continue;
                const cleanLid = m.lid.split('@')[0].replace(/[^0-9]/g, '');
                const cleanPn = m.pn.split('@')[0].replace(/[^0-9]/g, '');
                if (cleanLid && cleanPn) {
                    LID_TO_PHONE_MAP.set(cleanLid, cleanPn);
                    PHONE_TO_LID_MAP.set(cleanPn, cleanLid);
                    saveLidMappingToDisk(cleanLid, cleanPn, accountId);
                    console.log(`[LID Sync Event] Mapped LID ${cleanLid} <-> PN ${cleanPn}`);
                }
            }
        });

        // Listen for Real Inbound Customer Messages on this Account
        sock.ev.on('messages.upsert', async (m) => {
            if (m.type === 'notify') {
                for (const msg of m.messages) {
                    if (!msg.key.fromMe) {
                        const msgId = msg.key?.id;
                        if (msgId) {
                            if (PROCESSED_MESSAGE_IDS.has(msgId)) continue;
                            PROCESSED_MESSAGE_IDS.add(msgId);
                            if (PROCESSED_MESSAGE_IDS.size > 5000) {
                                const firstVal = PROCESSED_MESSAGE_IDS.values().next().value;
                                PROCESSED_MESSAGE_IDS.delete(firstVal);
                            }
                        }

                        const senderJid = msg.key.remoteJid;
                        if (!senderJid) continue;
                        if (senderJid.includes('@g.us') || senderJid === 'status@broadcast') continue;

                        let cleanNumber = senderJid.split('@')[0].split(':')[0];
                        let originalLid = (senderJid.includes('@lid') || cleanNumber.length >= 14) ? cleanNumber : null;
                        let realPhone = null;

                        // Deeply resolve WhatsApp Privacy LID to genuine phone number
                        if (originalLid) {
                            // Check Baileys participantPn or direct participant fields
                            let directPn = null;
                            if (msg.key?.participantPn) directPn = msg.key.participantPn;
                            else if (msg.participantPn) directPn = msg.participantPn;
                            else if (msg.key?.participant && !msg.key.participant.includes('@lid')) directPn = msg.key.participant;
                            else if (msg.participant && !msg.participant.includes('@lid')) directPn = msg.participant;

                            if (directPn) {
                                const pnDigits = directPn.split('@')[0].replace(/\D/g, '');
                                if (pnDigits && pnDigits.length >= 10) {
                                    cleanNumber = pnDigits;
                                    LID_TO_PHONE_MAP.set(originalLid, pnDigits);
                                    PHONE_TO_LID_MAP.set(pnDigits, originalLid);
                                    saveLidMappingToDisk(originalLid, pnDigits, accountId);
                                    console.log(`[Inbound Direct Participant PN Hit] Mapped ${originalLid} -> ${cleanNumber}`);
                                }
                            }

                            if (cleanNumber === originalLid) {
                                const resolvedPn = await resolveLidToPhoneNumber(senderJid, sock, accountId);
                                if (resolvedPn) {
                                    cleanNumber = resolvedPn;
                                    console.log(`[Inbound LID Resolved] Mapped ${originalLid} -> ${cleanNumber}`);
                                }
                            }
                        }

                        let digitsOnly = cleanNumber.replace(/[^0-9]/g, '');
                        // Strip trailing device index if 13 digits starting with 91 (e.g. 9181240385850 -> 918124038585)
                        if (digitsOnly.length === 13 && digitsOnly.startsWith('91') && digitsOnly.endsWith('0')) {
                            digitsOnly = digitsOnly.slice(0, 12);
                        } else if (digitsOnly.length === 11 && digitsOnly.endsWith('0') && !digitsOnly.startsWith('0')) {
                            digitsOnly = digitsOnly.slice(0, 10);
                        }

                        // Strict validation: Indian mobile numbers strictly start with [6-9]
                        if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
                            realPhone = '+91 ' + digitsOnly.slice(0, 5) + ' ' + digitsOnly.slice(5);
                        } else if (digitsOnly.length === 12 && /^91[6-9]/.test(digitsOnly)) {
                            realPhone = '+91 ' + digitsOnly.slice(2, 7) + ' ' + digitsOnly.slice(7);
                        } else if (originalLid && cleanNumber === originalLid) {
                            // Unresolved Privacy LID: Never format as an Indian mobile number!
                            realPhone = null;
                        } else {
                            realPhone = '+' + cleanNumber;
                        }

                        const senderNumber = realPhone || (originalLid ? null : ('+' + cleanNumber));

                        let resolvedSenderName = msg.pushName;
                        if (resolvedSenderName && /whatsapp business|primary line|primary whatsapp|line \d|account_\d/i.test(resolvedSenderName)) {
                            resolvedSenderName = null;
                        }
                        if (!resolvedSenderName) {
                            const cachedC = CONTACTS_CACHE.get(senderJid) || CONTACTS_CACHE.get(cleanNumber) || (LID_TO_PHONE_MAP.has(cleanNumber) ? CONTACTS_CACHE.get(LID_TO_PHONE_MAP.get(cleanNumber)) : null);
                            if (cachedC) {
                                const candName = cachedC.name || cachedC.notify || cachedC.verifiedName;
                                if (candName && !/whatsapp business|primary line|primary whatsapp|line \d|account_\d/i.test(candName)) {
                                    resolvedSenderName = candName;
                                }
                            }
                        }
                        const senderName = resolvedSenderName || (senderNumber ? ('Customer ' + senderNumber.slice(-4)) : 'WhatsApp Customer');

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

                        // Store unread message key for Two-Way Read Sync (Scenario B: CRM -> WhatsApp)
                        const clean10 = (digitsOnly || '').slice(-10);
                        const msgKeyEntry = {
                            key: {
                                remoteJid: msg.key.remoteJid,
                                id: msg.key.id,
                                participant: msg.key.participant || undefined,
                                fromMe: false
                            },
                            messageTimestamp: Number(msg.messageTimestamp) || Math.floor(Date.now() / 1000)
                        };
                        const trackUnreadKey = (mapKey) => {
                            if (!mapKey) return;
                            if (!UNREAD_KEYS_BY_CHAT.has(mapKey)) UNREAD_KEYS_BY_CHAT.set(mapKey, []);
                            const arr = UNREAD_KEYS_BY_CHAT.get(mapKey);
                            if (!arr.some(k => k.key.id === msg.key.id)) {
                                arr.push(msgKeyEntry);
                                if (arr.length > 50) arr.shift();
                            }
                        };
                        trackUnreadKey(senderJid);
                        if (clean10) {
                            trackUnreadKey(clean10);
                            trackUnreadKey('cust_' + clean10);
                            trackUnreadKey('91' + clean10 + '@s.whatsapp.net');
                        }

                        // Unwrap nested WhatsApp message formats (Ephemeral, ViewOnce, Disappearing, Edited, Linked Device, etc.)
                        let rawMsg = msg.message || {};
                        let unwrapCycles = 10;
                        while (unwrapCycles-- > 0) {
                            if (rawMsg.ephemeralMessage?.message) {
                                rawMsg = rawMsg.ephemeralMessage.message;
                            } else if (rawMsg.viewOnceMessage?.message) {
                                rawMsg = rawMsg.viewOnceMessage.message;
                            } else if (rawMsg.viewOnceMessageV2?.message) {
                                rawMsg = rawMsg.viewOnceMessageV2.message;
                            } else if (rawMsg.viewOnceMessageV2Extension?.message) {
                                rawMsg = rawMsg.viewOnceMessageV2Extension.message;
                            } else if (rawMsg.documentWithCaptionMessage?.message) {
                                rawMsg = rawMsg.documentWithCaptionMessage.message;
                            } else if (rawMsg.deviceSentMessage?.message) {
                                rawMsg = rawMsg.deviceSentMessage.message;
                            } else if (rawMsg.editedMessage?.message?.protocolMessage?.editedMessage) {
                                rawMsg = rawMsg.editedMessage.message.protocolMessage.editedMessage;
                            } else {
                                break;
                            }
                        }

                        let messageText = '';
                        let msgType = 'text';
                        let mediaUrl = null;
                        let duration = 0;

                        // 1. Check for Voice Message / Audio (Wrapped Resilient Download + Remote Hostinger Base64 Sync)
                        if (rawMsg.audioMessage) {
                            msgType = 'audio';
                            const isPtt = rawMsg.audioMessage.ptt;
                            duration = rawMsg.audioMessage.seconds || 0;
                            messageText = isPtt ? '🎙️ Voice Message' : '🎵 Audio Message';

                            try {
                                const audioBuffer = await downloadMediaMessage(
                                    { key: msg.key, message: rawMsg },
                                    'buffer',
                                    {},
                                    { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                );
                                if (audioBuffer) {
                                    // Send base64 data URI so remote Hostinger PHP receives actual file bytes and writes to uploads/voice/
                                    mediaUrl = 'data:audio/ogg; codecs=opus;base64,' + audioBuffer.toString('base64');
                                    console.log(`[Audio Downloaded & Base64 Encoded] (${audioBuffer.length} bytes) from ${senderName}`);

                                    // Also cache locally on bridge filesystem
                                    try {
                                        const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'voice');
                                        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                                        const fileName = `voice_${Date.now()}_${Math.floor(Math.random() * 1000)}.ogg`;
                                        const filePath = path.join(uploadsDir, fileName);
                                        fs.writeFileSync(filePath, audioBuffer);

                                        // Also transcode universal MP3 copy for web browsers lacking Ogg support (Safari/iOS)
                                        if (ffmpegBinPath) {
                                            try {
                                                const mp3FileName = fileName.replace('.ogg', '.mp3');
                                                const mp3Path = path.join(uploadsDir, mp3FileName);
                                                const { execSync } = require('child_process');
                                                execSync(`"${ffmpegBinPath}" -y -i "${filePath}" -c:a libmp3lame -q:a 4 "${mp3Path}"`, { stdio: 'ignore', timeout: 6000 });
                                            } catch (eMp3) {}
                                        }
                                    } catch (e) {}
                                }
                            } catch (err) {
                                console.error('[Audio Download Error]:', err.message);
                            }
                        }
                        // 2. Check for Photo / Image Attachment (Resilient Wrapped Download + Remote Hostinger Base64 Sync)
                        else if (rawMsg.imageMessage || rawMsg.stickerMessage || (rawMsg.documentMessage && rawMsg.documentMessage.mimetype && rawMsg.documentMessage.mimetype.startsWith('image/'))) {
                            msgType = 'image';
                            const rawImgMsg = rawMsg.imageMessage || rawMsg.documentMessage || rawMsg.stickerMessage || {};
                            const imgCaption = rawImgMsg.caption || '';
                            messageText = imgCaption ? ('[Photo] ' + imgCaption) : '[Photo Attachment]';
                            try {
                                let imgBuffer = null;
                                const mediaPayload = { key: msg.key, message: rawMsg };
                                try {
                                    imgBuffer = await downloadMediaMessage(
                                        mediaPayload,
                                        'buffer',
                                        {},
                                        { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                    );
                                } catch (e1) {
                                    try {
                                        imgBuffer = await downloadMediaMessage(
                                            msg,
                                            'buffer',
                                            {},
                                            { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                        );
                                    } catch (e2) {}
                                }

                                // Fallback to embedded jpegThumbnail if network download from CDN failed
                                if (!imgBuffer && rawImgMsg.jpegThumbnail) {
                                    imgBuffer = Buffer.from(rawImgMsg.jpegThumbnail);
                                }

                                if (imgBuffer && imgBuffer.length > 0) {
                                    let ext = 'jpg';
                                    let mime = 'image/jpeg';
                                    if (rawMsg.stickerMessage || rawImgMsg.mimetype === 'image/webp') {
                                        ext = 'webp';
                                        mime = 'image/webp';
                                    } else if (rawImgMsg.mimetype === 'image/png') {
                                        ext = 'png';
                                        mime = 'image/png';
                                    }

                                    // Send base64 data URI so remote Hostinger PHP receives actual file bytes and writes to uploads/media/
                                    mediaUrl = `data:${mime};base64,` + imgBuffer.toString('base64');
                                    console.log(`[Image Downloaded & Base64 Encoded] (${imgBuffer.length} bytes, ${ext}) from ${senderName}`);
                                    
                                    // Also cache locally on bridge filesystem
                                    try {
                                        const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'media');
                                        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                                        const fileName = `img_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;
                                        fs.writeFileSync(path.join(uploadsDir, fileName), imgBuffer);
                                    } catch (e) {}
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
                        // 7. Regular text messages (Plain, formatted, interactive body, etc.)
                        else if (typeof rawMsg.conversation === 'string' && rawMsg.conversation.trim()) {
                            messageText = rawMsg.conversation;
                        } else if (typeof rawMsg.extendedTextMessage?.text === 'string' && rawMsg.extendedTextMessage.text.trim()) {
                            messageText = rawMsg.extendedTextMessage.text;
                        } else if (rawMsg.interactiveMessage?.body?.text) {
                            messageText = rawMsg.interactiveMessage.body.text;
                        } else if (rawMsg.interactiveResponseMessage?.body?.text) {
                            messageText = rawMsg.interactiveResponseMessage.body.text;
                        } else if (typeof rawMsg.text === 'string' && rawMsg.text.trim()) {
                            messageText = rawMsg.text;
                        } else {
                            // Inspect keys in rawMsg to find any text or caption field
                            for (const k of Object.keys(rawMsg)) {
                                if (rawMsg[k] && typeof rawMsg[k].text === 'string' && rawMsg[k].text.trim()) {
                                    messageText = rawMsg[k].text;
                                    break;
                                }
                                if (rawMsg[k] && typeof rawMsg[k].caption === 'string' && rawMsg[k].caption.trim()) {
                                    messageText = rawMsg[k].caption;
                                    break;
                                }
                            }
                            if (!messageText) {
                                messageText = 'Hi';
                            }
                        }

                        console.log(`[Inbound on ${accountObj.connectedNumber || accountId}] From ${senderName} (${senderJid}): "${messageText}" [${msgType}]`);

                        // WhatsApp Direct Bulk Price Request Approval / Rejection Interceptor
                        const cleanUpperMsg = (messageText || '').trim().toUpperCase();

                        // 1. Guard against garment sizes, measurements, product quantities (e.g. "2xl", "2XL", "2 pieces", "1 pc", "20", "2 meters")
                        const isGarmentSpecOrQty = /^\d+\s*(?:XL|XXL|XXXL|XS|S|M|L|PCS?|PIECES?|METERS?|MTRS?|M|KG|COMBO|SET|DRESS|SAREE|COLOR|COLOUR|INCH)\b/i.test(cleanUpperMsg) ||
                                                   /^\d+[A-Z]/i.test(cleanUpperMsg);

                        // 2. Resolve sender identity: strictly ensure sender is an authorized Admin!
                        const senderDigits10 = String(cleanNumber || senderNumber || senderJid || '').replace(/\D/g, '').slice(-10);
                        const connectedDigits10 = String(accountObj.connectedNumber || '').replace(/\D/g, '').slice(-10);
                        const authorizedAdminSet = new Set(['8124038585', '9500904638']);
                        if (connectedDigits10 && connectedDigits10.length === 10) authorizedAdminSet.add(connectedDigits10);
                        if (typeof configFilePath !== 'undefined' && fs.existsSync(configFilePath)) {
                            try {
                                const rawCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                                const p = (rawCfg.phone_number || '').replace(/\D/g, '').slice(-10);
                                if (p.length === 10) authorizedAdminSet.add(p);
                            } catch (eCfg) {}
                        }
                        const isSenderAdmin = authorizedAdminSet.has(senderDigits10) || msg.key?.fromMe === true;

                        // 3. Strict Command Matching (Never loosely check startsWith('2')!)
                        const isApproveCmd = !isGarmentSpecOrQty && isSenderAdmin && (
                            cleanUpperMsg === '1' ||
                            cleanUpperMsg === 'APPROVE' ||
                            /^APPROVE(?:\s+BPR-\d+|\s+\d+)?$/i.test(cleanUpperMsg) ||
                            /^APPROVE:\s*(?:BPR-\d+|\d+)?$/i.test(cleanUpperMsg) ||
                            /^ACCEPT(?:\s+BPR-\d+|\s+\d+)?$/i.test(cleanUpperMsg)
                        );
                        const isRejectCmd = !isGarmentSpecOrQty && isSenderAdmin && (
                            cleanUpperMsg === '2' ||
                            /^2\s+[A-Za-z0-9]/.test(cleanUpperMsg) ||
                            cleanUpperMsg === 'REJECT' ||
                            /^REJECT(?:\s+BPR-\d+)?(?:\s+.*)?$/i.test(cleanUpperMsg) ||
                            /^REJECT:\s*(?:BPR-\d+)?(?:\s+.*)?$/i.test(cleanUpperMsg) ||
                            /^DECLINE(?:\s+BPR-\d+)?(?:\s+.*)?$/i.test(cleanUpperMsg)
                        );

                        if (isApproveCmd || isRejectCmd) {
                            const codeMatch = messageText.match(/BPR-\d+/i);
                            const reqCode = codeMatch ? codeMatch[0].toUpperCase() : null;
                            const replyTargetJid = msg.key?.remoteJid || resolveDestinationJid(senderNumber || senderJid) || senderJid;

                            if (isApproveCmd) {
                                try {
                                    console.log(`[Bulk Interceptor] Processing WhatsApp APPROVE for ${reqCode || 'latest'} from ${replyTargetJid}`);
                                    let d = await callCrmApi('approve_bulk_price_request', {
                                        request_code: reqCode,
                                        approved_by: 'Super Admin (via WhatsApp)',
                                        source: 'whatsapp_cmd'
                                    });

                                    // If request details are missing, fetch from CRM database
                                    if (!d || !d.request || !d.request.product_name) {
                                        try {
                                            const getRes = await callCrmApi(`get_bulk_price_requests&code=${encodeURIComponent(reqCode || '')}`, {});
                                            if (getRes && getRes.requests && getRes.requests.length > 0) {
                                                d = d || {};
                                                d.request = getRes.requests[0];
                                            }
                                        } catch (e) {}
                                    }

                                    const r = (d && d.request) ? d.request : {};
                                    const reqPriceFormatted = parseFloat(r.requested_price || 0).toFixed(2);
                                    const totalAmtFormatted = parseFloat(r.total_requested_amount || 0).toFixed(2);
                                    const sizeStr = r.size ? ` (${r.size})` : ' (Free Size)';
                                    const prodName = r.product_name || 'Garment Product';
                                    const qty = r.quantity || 1;

                                    let confirmText = `✅ *BULK PRICE REQUEST APPROVED!*\n\n` +
                                        `Request Code: *${r.request_code || reqCode || 'BPR'}*\n`;

                                    if (parseFloat(reqPriceFormatted) > 0 || r.product_name) {
                                        confirmText += `Product: *${prodName}${sizeStr} × ${qty} pcs*\n` +
                                                       `Approved Price: *₹${reqPriceFormatted}/pc* (Total: *₹${totalAmtFormatted}*)\n\n`;
                                    }

                                    confirmText += `Status: Special price activated. Staff can now take the order.`;

                                    // Send to WhatsApp chat only if not already dispatched by API (prevents duplicate messages)
                                    const alreadyDispatched = d && d.wa_dispatch && d.wa_dispatch.dispatched_by_api === true;
                                    if (!alreadyDispatched) {
                                        // Send to Admin in same chat ONLY if reply target belongs to an authorized admin
                                        const replyTarget10 = String(replyTargetJid || '').replace(/\D/g, '').slice(-10);
                                        if (authorizedAdminSet.has(replyTarget10)) {
                                            await sock.sendMessage(replyTargetJid, { text: confirmText });
                                            console.log(`[Bulk Interceptor] Sent APPROVE confirmation with amount details to Admin ${replyTargetJid}`);
                                        }

                                        // Send to Staff WhatsApp inbox only if staff is a different person from sender (prevents duplicate messages)
                                        const staffPhone = r.staff_phone || (d && d.wa_dispatch && d.wa_dispatch.staff_phone);
                                        if (staffPhone) {
                                            const cleanStaffDigits = String(staffPhone).replace(/[^0-9]/g, '');
                                            const cleanStaff10 = cleanStaffDigits.slice(-10);
                                            const cleanSender10 = String(senderNumber || replyTargetJid || '').replace(/[^0-9]/g, '').slice(-10);
                                            const cleanStaffPhone = cleanStaffDigits.length === 10 ? ('91' + cleanStaffDigits) : cleanStaffDigits;
                                            const staffJid = resolveDestinationJid(cleanStaffPhone);
                                            const canonicalReplyJid = resolveDestinationJid(replyTargetJid) || replyTargetJid;

                                            const isSameRecipient = (cleanStaff10 && cleanSender10 && cleanStaff10 === cleanSender10) ||
                                                                    (staffJid && (staffJid === replyTargetJid || staffJid === canonicalReplyJid));

                                            if (staffJid && !isSameRecipient) {
                                                try {
                                                    await sock.sendMessage(staffJid, { text: confirmText });
                                                    console.log(`[Bulk Interceptor] Staff notification delivered to ${staffJid}`);
                                                } catch (errStaff) {
                                                    console.warn(`[Bulk Interceptor] Could not deliver to staff ${staffJid}:`, errStaff.message);
                                                }
                                            } else {
                                                console.log(`[Bulk Interceptor] Skipping duplicate dispatch to staff ${staffPhone}: sender and staff are the same recipient.`);
                                            }
                                        }
                                    }
                                    io.emit('bulk_request:updated', { status: 'APPROVED', request: r });
                                } catch (e) {
                                    console.error('[Bulk Approve via WhatsApp Error]:', e.message);
                                }
                                continue;
                            } else if (isRejectCmd) {
                                try {
                                    let reason = messageText.replace(/^2\s*/i, '').replace(/^REJECT:?\s*(BPR-\d+)?\s*/i, '').trim();
                                    if (!reason) reason = 'Price too low for this bulk order quantity amount too low';
                                    console.log(`[Bulk Interceptor] Processing WhatsApp REJECT for ${reqCode || 'latest'} (Reason: ${reason}) from ${replyTargetJid}`);
                                    let d = await callCrmApi('reject_bulk_price_request', {
                                        request_code: reqCode,
                                        rejection_reason: reason,
                                        rejected_by: 'Super Admin (via WhatsApp)',
                                        source: 'whatsapp_cmd'
                                    });

                                    // If request details are missing, fetch from CRM database
                                    if (!d || !d.request || !d.request.product_name) {
                                        try {
                                            const getRes = await callCrmApi(`get_bulk_price_requests&code=${encodeURIComponent(reqCode || '')}`, {});
                                            if (getRes && getRes.requests && getRes.requests.length > 0) {
                                                d = d || {};
                                                d.request = getRes.requests[0];
                                            }
                                        } catch (e) {}
                                    }

                                    const r = (d && d.request) ? d.request : {};
                                    const cleanReason = (reason || r.rejection_reason || 'Price too low for this bulk order quantity amount too low').trim();
                                    const sizeStr = r.size ? ` (${r.size})` : ' (Free Size)';
                                    const prodName = r.product_name || 'Garment Product';
                                    const qty = r.quantity || 1;
                                    const reqPriceFormatted = parseFloat(r.requested_price || 0).toFixed(2);
                                    const totalAmtFormatted = parseFloat(r.total_requested_amount || 0).toFixed(2);

                                    let rejectText = `❌ *BULK PRICE REQUEST REJECTED*\n\n` +
                                        `Request Code: *${r.request_code || reqCode || 'BPR'}*\n`;

                                    if (parseFloat(reqPriceFormatted) > 0 || r.product_name) {
                                        rejectText += `Product: *${prodName}${sizeStr} × ${qty} pcs*\n` +
                                                      `Requested Price: *₹${reqPriceFormatted}/pc* (Total: *₹${totalAmtFormatted}*)\n`;
                                    }

                                    rejectText += `Reason: *${cleanReason}*\n\n` +
                                                  `Staff has been informed of rejection.`;

                                    // Send to WhatsApp chat only if not already dispatched by API (prevents duplicate messages)
                                    const alreadyDispatched = d && d.wa_dispatch && d.wa_dispatch.dispatched_by_api === true;
                                    if (!alreadyDispatched) {
                                        // Send to Admin in same chat ONLY if reply target belongs to an authorized admin
                                        const replyTarget10 = String(replyTargetJid || '').replace(/\D/g, '').slice(-10);
                                        if (authorizedAdminSet.has(replyTarget10)) {
                                            await sock.sendMessage(replyTargetJid, { text: rejectText });
                                            console.log(`[Bulk Interceptor] Sent REJECT confirmation with amount details to Admin ${replyTargetJid}`);
                                        }

                                        // Send to Staff's WhatsApp inbox only if staff is a different person from sender (prevents duplicate messages)
                                        const staffPhone = r.staff_phone || (d && d.wa_dispatch && d.wa_dispatch.staff_phone);
                                        if (staffPhone) {
                                            const cleanStaffDigits = String(staffPhone).replace(/[^0-9]/g, '');
                                            const cleanStaff10 = cleanStaffDigits.slice(-10);
                                            const cleanSender10 = String(senderNumber || replyTargetJid || '').replace(/[^0-9]/g, '').slice(-10);
                                            const cleanStaffPhone = cleanStaffDigits.length === 10 ? ('91' + cleanStaffDigits) : cleanStaffDigits;
                                            const staffJid = resolveDestinationJid(cleanStaffPhone);
                                            const canonicalReplyJid = resolveDestinationJid(replyTargetJid) || replyTargetJid;

                                            const isSameRecipient = (cleanStaff10 && cleanSender10 && cleanStaff10 === cleanSender10) ||
                                                                    (staffJid && (staffJid === replyTargetJid || staffJid === canonicalReplyJid));

                                            if (staffJid && !isSameRecipient) {
                                                try {
                                                    await sock.sendMessage(staffJid, { text: rejectText });
                                                    console.log(`[Bulk Interceptor] Staff rejection notification delivered to ${staffJid}`);
                                                } catch (errStaff) {
                                                    console.warn(`[Bulk Interceptor] Could not deliver rejection to staff ${staffJid}:`, errStaff.message);
                                                }
                                            } else {
                                                console.log(`[Bulk Interceptor] Skipping duplicate dispatch to staff ${staffPhone}: sender and staff are the same recipient.`);
                                            }
                                        }
                                    }
                                    io.emit('bulk_request:updated', { status: 'REJECTED', request: r, reason: cleanReason });
                                } catch (e) {
                                    console.error('[Bulk Reject via WhatsApp Error]:', e.message);
                                }
                                continue;
                            }
                        }
                        const uniqueSuffix = '_' + Math.random().toString(36).slice(2, 7);
                        const payload = {
                            id: msgId || ('msg_' + Date.now() + uniqueSuffix),
                            message_uid: msgId || ('msg_' + Date.now() + uniqueSuffix),
                            customer_id: 'cust_' + (digitsOnly ? digitsOnly.slice(-10) : '0000000000'),
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
                            timestamp: Date.now(),
                            timestamp_epoch: Math.floor(Date.now() / 1000),
                            received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            lid: originalLid
                        };

                        console.log(`📥 [WhatsApp Inbound Received] From: "${senderName}" (${senderNumber}) | UID: ${payload.message_uid} | Type: ${msgType} | Text: "${(messageText || '').slice(0, 50)}"`);

                        // 1. Emit live to CRM UI over WebSocket (Instant!)
                        io.emit('whatsapp:inbound', payload);
                        const activeClientCount = io.sockets.sockets ? io.sockets.sockets.size : 0;
                        console.log(`📢 [Socket Event Emitted] 'whatsapp:inbound' broadcasted to ${activeClientCount} active client(s) for message UID: ${payload.message_uid}`);

                        // 2. Forward to CRM PHP API for persistent file storage
                        forwardToCRM(payload);

                        // 3. Server-Side Autonomous Intelligent Auto-Responder Engine
                        if (autoReplyConfig.enabled) {
                            const senderKey = cleanNumber || senderNumber || senderJid;
                            const lastMenuEpoch = lastAutoReplyMap.get(cleanNumber) || lastAutoReplyMap.get(senderNumber) || 0;
                            const configuredMinutes = typeof autoReplyConfig.cooldownMinutes !== 'undefined' ? Number(autoReplyConfig.cooldownMinutes) : 0;
                            const cooldownMs = configuredMinutes * 60 * 1000;
                            const isMenuCooldownPassed = (Date.now() - lastMenuEpoch) >= (cooldownMs || 3000); // minimal 3s debounce

                            let replyObj = null;
                            const cleanMsg = (messageText || '').trim().toLowerCase();

                            // 1. Check for interactive category/product responses (Level 2 & Level 3 photo card)
                            if (autoReplyConfig.keywordMatching) {
                                replyObj = getInteractiveResponse(cleanMsg, senderName, senderKey, senderNumber, senderJid, cleanNumber);
                            }

                            // Only auto-module rules are sent; no hardcoded greeting or catalog fallback

                            if (replyObj) {
                                setTimeout(async () => {
                                    try {
                                        // Use direct WhatsApp message sender remoteJid for 100% accurate chat thread delivery
                                        const directRemote = msg.key?.remoteJid;
                                        const targetJid = directRemote || resolveDestinationJid(senderNumber || senderJid);
                                        let sentRes = null;
                                        let botText = '';
                                        let botType = 'text';
                                        let botMediaUrl = null;

                                        // Ensure socket is active before transmitting over WhatsApp
                                        const isSockActive = sock && typeof sock.sendMessage === 'function' && accountObj.status === 'CONNECTED';

                                        if (replyObj.type === 'image' && replyObj.image) {
                                            botType = 'image';
                                            botMediaUrl = replyObj.image;
                                            botText = replyObj.caption;
                                            console.log(`[Auto-Reply Engine] 📸 Sending Product Photo to ${senderName} (${targetJid}): "${replyObj.caption.slice(0, 40)}..."`);

                                            if (isSockActive) {
                                                const imgBuf = await getImageBuffer(replyObj.image);
                                                if (imgBuf) {
                                                    try {
                                                        sentRes = await sock.sendMessage(targetJid, {
                                                            image: imgBuf,
                                                            caption: replyObj.caption
                                                        }, { quoted: msg });
                                                    } catch (imgErr) {
                                                        console.warn('[Image Send Failed, Falling back to Text]:', imgErr.message);
                                                    }
                                                }

                                                if (!sentRes) {
                                                    sentRes = await sock.sendMessage(targetJid, {
                                                        text: `${replyObj.caption}\n\n🖼️ *Product Image:* ${replyObj.image}`
                                                    }, { quoted: msg });
                                                }
                                            }
                                        } else {
                                            botText = replyObj.text || replyObj;
                                            console.log(`[Auto-Reply Engine] 🤖 Dispatching response to ${senderName} (${targetJid}): "${cleanMsg}"`);
                                            if (isSockActive) {
                                                sentRes = await sock.sendMessage(targetJid, { text: botText }, { quoted: msg });
                                            }
                                        }

                                        if (sentRes && sentRes.key?.id) {
                                            console.log(`[Auto-Reply Engine] ✅ Delivered to ${targetJid} (ID: ${sentRes.key.id})`);
                                        } else {
                                            console.warn(`[Auto-Reply Engine] ⚠️ WhatsApp socket for line ${accountId} is awaiting QR scan or reconnecting. Message queued for delivery.`);
                                        }

                                        const botPayload = {
                                            id: sentRes?.key?.id || ('bot_' + Date.now()),
                                            sender_name: 'Bot (Auto-Reply)',
                                            sender_phone: senderNumber,
                                            sender_jid: targetJid,
                                            message_text: botText,
                                            type: botType,
                                            media_url: botMediaUrl,
                                            account_id: accountId,
                                            source: 'AUTOREPLY_BOT',
                                            rule_name: replyObj.ruleName || 'Auto-Reply',
                                            rule_id: replyObj.ruleId || null,
                                            direction: 'outbound',
                                            is_outbound: true,
                                            status: sentRes?.key?.id ? 'DELIVERED' : 'PENDING_SCAN',
                                            timestamp_epoch: Math.floor(Date.now() / 1000),
                                            received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        };
                                        io.emit('whatsapp:inbound', botPayload);
                                        forwardToCRM(botPayload);
                                    } catch (err) {
                                        console.error('[Auto-Reply Send Error]:', err.message);
                                    }
                                }, 500);
                            }
                        }
                    } else {
                        // =========================================================================
                        // TASK 2: ADMIN DIRECT REPLY ON WHATSAPP MOBILE PHONE APP
                        // Captures outbound messages sent directly from the linked phone!
                        // =========================================================================
                        try {
                            const msgId = msg.key?.id;
                            if (msgId) {
                                if (PROCESSED_MESSAGE_IDS.has(msgId)) continue;
                                PROCESSED_MESSAGE_IDS.add(msgId);
                                if (PROCESSED_MESSAGE_IDS.size > 5000) {
                                    const firstVal = PROCESSED_MESSAGE_IDS.values().next().value;
                                    PROCESSED_MESSAGE_IDS.delete(firstVal);
                                }
                            }

                            const recipientJid = msg.key?.remoteJid;
                            if (!recipientJid || recipientJid.includes('@g.us') || recipientJid === 'status@broadcast') continue;

                            let cleanRecipient = recipientJid.split('@')[0].split(':')[0];
                            const digitsOnly = cleanRecipient.replace(/[^0-9]/g, '');

                            // Resolve Privacy LID to actual telephone number
                            let mappedDigits = digitsOnly;
                            const isLid = recipientJid.includes('@lid') || digitsOnly.length >= 14;
                            if (isLid) {
                                const resolvedPn = await resolveLidToPhoneNumber(recipientJid, sock, accountId);
                                if (resolvedPn) {
                                    mappedDigits = resolvedPn;
                                    console.log(`[Admin Phone Reply LID Resolved] Mapped ${recipientJid} -> ${mappedDigits}`);
                                }
                            }

                            let realRecipientPhone = null;
                            if (mappedDigits.length === 10) {
                                realRecipientPhone = '+91 ' + mappedDigits.slice(0, 5) + ' ' + mappedDigits.slice(5);
                            } else if (mappedDigits.length === 12 && mappedDigits.startsWith('91')) {
                                realRecipientPhone = '+91 ' + mappedDigits.slice(2, 7) + ' ' + mappedDigits.slice(7);
                            } else {
                                realRecipientPhone = '+' + mappedDigits;
                            }

                            // Resolve Contact Display Name (e.g. "வனஜா") from Baileys contacts & chats cache
                            let recipientContactName = null;
                            const cachedContact = CONTACTS_CACHE.get(recipientJid) || 
                                                  CONTACTS_CACHE.get(cleanRecipient) || 
                                                  CONTACTS_CACHE.get(digitsOnly) ||
                                                  CONTACTS_CACHE.get(mappedDigits) ||
                                                  (mappedDigits !== digitsOnly ? CONTACTS_CACHE.get(mappedDigits + '@s.whatsapp.net') : null);

                            if (cachedContact) {
                                recipientContactName = cachedContact.name || cachedContact.notify || cachedContact.verifiedName || null;
                            }

                            if (!recipientContactName) {
                                for (const [cId, cData] of CONTACTS_CACHE.entries()) {
                                    if (cData.lid === recipientJid || (cData.lid && cData.lid.includes(digitsOnly))) {
                                        recipientContactName = cData.name || cData.notify || cData.verifiedName;
                                        if (cId.includes('@s.whatsapp.net') && digitsOnly.length >= 14) {
                                            let ph = cId.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
                                            if (ph.length === 13 && ph.startsWith('91') && ph.endsWith('0')) ph = ph.slice(0, 12);
                                            else if (ph.length === 11 && ph.endsWith('0') && !ph.startsWith('0')) ph = ph.slice(0, 10);
                                            if (ph) {
                                                LID_TO_PHONE_MAP.set(digitsOnly, ph);
                                                PHONE_TO_LID_MAP.set(ph, digitsOnly);
                                                if (ph.length === 10) {
                                                    realRecipientPhone = '+91 ' + ph.slice(0, 5) + ' ' + ph.slice(5);
                                                } else if (ph.length === 12 && ph.startsWith('91')) {
                                                    realRecipientPhone = '+91 ' + ph.slice(2, 7) + ' ' + ph.slice(7);
                                                }
                                            }
                                        }
                                        break;
                                    }
                                }
                            }

                            // Unwrap message content
                            let rawMsg = msg.message || {};
                            let unwrapCycles = 10;
                            while (unwrapCycles-- > 0) {
                                if (rawMsg.ephemeralMessage?.message) rawMsg = rawMsg.ephemeralMessage.message;
                                else if (rawMsg.viewOnceMessage?.message) rawMsg = rawMsg.viewOnceMessage.message;
                                else if (rawMsg.viewOnceMessageV2?.message) rawMsg = rawMsg.viewOnceMessageV2.message;
                                else if (rawMsg.documentWithCaptionMessage?.message) rawMsg = rawMsg.documentWithCaptionMessage.message;
                                else if (rawMsg.deviceSentMessage?.message) rawMsg = rawMsg.deviceSentMessage.message;
                                else if (rawMsg.editedMessage?.message?.protocolMessage?.editedMessage) rawMsg = rawMsg.editedMessage.message.protocolMessage.editedMessage;
                                else break;
                            }

                            let outText = '';
                            let outType = 'text';
                            let outMediaUrl = null;

                            if (rawMsg.imageMessage) {
                                outType = 'image';
                                outText = rawMsg.imageMessage.caption ? ('[Photo] ' + rawMsg.imageMessage.caption) : '[Photo Attachment]';
                                let imgBuffer = null;
                                try {
                                    imgBuffer = await downloadMediaMessage(
                                        msg,
                                        'buffer',
                                        {},
                                        { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                    );
                                } catch (e1) {
                                    try {
                                        imgBuffer = await downloadMediaMessage(
                                            { key: msg.key, message: rawMsg },
                                            'buffer',
                                            {},
                                            { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                        );
                                    } catch (e2) {}
                                }

                                // Guaranteed fallback to embedded protobuf jpegThumbnail buffer
                                if (!imgBuffer && rawMsg.imageMessage.jpegThumbnail) {
                                    imgBuffer = Buffer.from(rawMsg.imageMessage.jpegThumbnail);
                                    console.log(`[Admin Phone Outbound Image] Used embedded jpegThumbnail (${imgBuffer.length} bytes)`);
                                }

                                if (imgBuffer && imgBuffer.length > 0) {
                                    outMediaUrl = 'data:image/jpeg;base64,' + imgBuffer.toString('base64');
                                    try {
                                        const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'media');
                                        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                                        const fileName = `img_out_${Date.now()}_${Math.floor(Math.random() * 1000)}.jpg`;
                                        const filePath = path.join(uploadsDir, fileName);
                                        fs.writeFileSync(filePath, imgBuffer);
                                        console.log(`[Admin Phone Outbound Image Saved Locally]: ${fileName} (${imgBuffer.length} bytes)`);
                                    } catch (eDisk) {}
                                }
                            } else if (rawMsg.audioMessage) {
                                outType = 'audio';
                                outText = rawMsg.audioMessage.ptt ? '🎙️ Voice Message' : '🎵 Audio Message';
                                try {
                                    let audioBuffer = null;
                                    try {
                                        audioBuffer = await downloadMediaMessage(
                                            msg,
                                            'buffer',
                                            {},
                                            { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                        );
                                    } catch (e1) {
                                        try {
                                            audioBuffer = await downloadMediaMessage(
                                                { key: msg.key, message: rawMsg },
                                                'buffer',
                                                {},
                                                { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                                            );
                                        } catch (e2) {}
                                    }
                                    if (audioBuffer) {
                                        outMediaUrl = 'data:audio/ogg; codecs=opus;base64,' + audioBuffer.toString('base64');
                                        try {
                                            const uploadsDir = path.resolve(__dirname, '..', 'uploads', 'voice');
                                            if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
                                            const fileName = `voice_out_${Date.now()}_${Math.floor(Math.random() * 1000)}.ogg`;
                                            const filePath = path.join(uploadsDir, fileName);
                                            fs.writeFileSync(filePath, audioBuffer);
                                            if (ffmpegBinPath) {
                                                try {
                                                    const mp3FileName = fileName.replace('.ogg', '.mp3');
                                                    const mp3Path = path.join(uploadsDir, mp3FileName);
                                                    const { execSync } = require('child_process');
                                                    execSync(`"${ffmpegBinPath}" -y -i "${filePath}" -c:a libmp3lame -q:a 4 "${mp3Path}"`, { stdio: 'ignore', timeout: 6000 });
                                                } catch (eMp3) {}
                                            }
                                        } catch (e) {}
                                    }
                                } catch (e) {}
                            } else if (rawMsg.conversation) {
                                outText = rawMsg.conversation;
                            } else if (rawMsg.extendedTextMessage?.text) {
                                outText = rawMsg.extendedTextMessage.text;
                            }

                            if (!outText && !outMediaUrl) continue;

                            console.log(`[Admin Mobile Direct Reply on ${accountId}] To ${realRecipientPhone} (${recipientContactName || 'Customer'}): "${outText}" [${outType}]`);

                            const outboundPayload = {
                                id: msgId || ('msg_out_' + Date.now()),
                                message_uid: msgId || ('msg_out_' + Date.now()),
                                sender: 'staff',
                                sender_name: 'Super Admin (WhatsApp Mobile)',
                                sender_phone: realRecipientPhone,
                                sender_jid: recipientJid,
                                customer_name: recipientContactName,
                                recipient_name: recipientContactName,
                                message_text: outText,
                                text: outText,
                                type: outType,
                                media_url: outMediaUrl,
                                mediaUrl: outMediaUrl,
                                account_id: accountId,
                                received_on_number: accountObj.connectedNumber || 'Primary',
                                direction: 'outbound',
                                is_outbound: true,
                                is_bot: false,
                                source: 'WHATSAPP_PHONE_DIRECT',
                                status: 'DELIVERED',
                                timestamp_epoch: Math.floor(Date.now() / 1000),
                                received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                lid: isLid ? digitsOnly : null
                            };

                            // Emit live to CRM UI over WebSocket (Instant!)
                            io.emit('whatsapp:outbound', outboundPayload);

                            // Forward to CRM PHP API for database & queue persistence
                            callCrmApi('record_outbound_message', {
                                phone: realRecipientPhone,
                                text: outText,
                                jid: recipientJid,
                                lid: isLid ? digitsOnly : null,
                                accountId: accountId,
                                media_url: outMediaUrl,
                                mediaUrl: outMediaUrl,
                                type: outType,
                                message_uid: msgId,
                                sender_name: 'Super Admin (WhatsApp Mobile)',
                                customer_name: recipientContactName,
                                recipient_name: recipientContactName,
                                source: 'WHATSAPP_PHONE_DIRECT'
                            }).catch(() => {});
                        } catch (errFromMe) {
                            console.warn('[Admin Phone Reply Capture Notice]:', errFromMe.message);
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

// Core Function to Send WhatsApp Message (Supports Text & Product Images)
async function sendWhatsAppMessage(target, text, accountId = null, mediaUrl = null) {
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

    let sent = null;
    const isAudioMsg = (typeof mediaUrl === 'string' && (mediaUrl.includes('audio') || mediaUrl.includes('.mp3') || mediaUrl.includes('.ogg') || mediaUrl.includes('.webm') || mediaUrl.includes('.wav') || mediaUrl.includes('/voice/') || mediaUrl.startsWith('data:audio')));
    if (mediaUrl && isAudioMsg) {
        console.log(`[Outbound Voice Send via ${activeAcc.connectedNumber || activeAcc.id}] Dispatching voice note PTT to ${jid}`);
        const rawAudioBuf = await getAudioBuffer(mediaUrl);
        if (rawAudioBuf) {
            try {
                let actualExt = 'webm';
                if (rawAudioBuf.length >= 4) {
                    if (rawAudioBuf[0] === 0x1A && rawAudioBuf[1] === 0x45 && rawAudioBuf[2] === 0xDF && rawAudioBuf[3] === 0xA3) {
                        actualExt = 'webm';
                    } else if (rawAudioBuf[0] === 0x4F && rawAudioBuf[1] === 0x67 && rawAudioBuf[2] === 0x67 && rawAudioBuf[3] === 0x53) {
                        actualExt = 'ogg';
                    } else if (rawAudioBuf[0] === 0x52 && rawAudioBuf[1] === 0x49 && rawAudioBuf[2] === 0x46 && rawAudioBuf[3] === 0x46) {
                        actualExt = 'wav';
                    } else if ((rawAudioBuf[0] === 0x49 && rawAudioBuf[1] === 0x44 && rawAudioBuf[2] === 0x33) || (rawAudioBuf[0] === 0xFF && (rawAudioBuf[1] & 0xE0) === 0xE0)) {
                        actualExt = 'mp3';
                    }
                }
                const opusAudioBuf = await convertToWhatsAppOpus(rawAudioBuf, actualExt);
                const isOpusOgg = (opusAudioBuf && opusAudioBuf.length > 28 &&
                    opusAudioBuf[0] === 0x4F && opusAudioBuf[1] === 0x67 && opusAudioBuf[2] === 0x67 && opusAudioBuf[3] === 0x53 &&
                    opusAudioBuf.indexOf(Buffer.from('OpusHead')) !== -1);

                if (isOpusOgg) {
                    sent = await activeAcc.sock.sendMessage(jid, {
                        audio: opusAudioBuf,
                        mimetype: 'audio/ogg; codecs=opus',
                        ptt: true
                    });
                    console.log(`[Outbound Voice Delivered] Voice note delivered as WhatsApp PTT to ${jid} (ID: ${sent?.key?.id})`);
                } else {
                    console.warn('[PTT Not Viable, Sending Playable Standard Audio]: Format is', actualExt);
                    let safeMime = 'audio/mpeg';
                    if (actualExt === 'ogg') safeMime = 'audio/ogg';
                    else if (actualExt === 'wav') safeMime = 'audio/wav';
                    else if (actualExt === 'mp4' || actualExt === 'm4a') safeMime = 'audio/mp4';

                    sent = await activeAcc.sock.sendMessage(jid, {
                        audio: rawAudioBuf,
                        mimetype: safeMime,
                        ptt: false
                    });
                    console.log(`[Outbound Audio Delivered] Audio delivered to ${jid} (ID: ${sent?.key?.id})`);
                }
            } catch (aErr) {
                console.warn('[Voice Send Failed]:', aErr.message);
            }
        }
    } else if (mediaUrl) {
        console.log(`[Outbound Media Send via ${activeAcc.connectedNumber || activeAcc.id}] Dispatching image to ${jid} with caption: "${finalText.slice(0, 50)}..."`);
        const imgBuf = await getImageBuffer(mediaUrl);
        if (imgBuf) {
            try {
                let mime = 'image/jpeg';
                if (imgBuf.length >= 4) {
                    if (imgBuf[0] === 0x89 && imgBuf[1] === 0x50 && imgBuf[2] === 0x4E && imgBuf[3] === 0x47) {
                        mime = 'image/png';
                    } else if (imgBuf[0] === 0x52 && imgBuf[1] === 0x49 && imgBuf[2] === 0x46 && imgBuf[3] === 0x46) {
                        mime = 'image/webp';
                    } else if (imgBuf[0] === 0x47 && imgBuf[1] === 0x49 && imgBuf[2] === 0x46) {
                        mime = 'image/gif';
                    }
                }
                const sendOptions = { 
                    image: imgBuf,
                    mimetype: mime
                };
                if (finalText && finalText.trim() && finalText !== '[Photo Attachment]') {
                    sendOptions.caption = finalText.trim();
                }
                sent = await activeAcc.sock.sendMessage(jid, sendOptions);
                console.log(`[Outbound Media Delivered] Image delivered to ${jid} (ID: ${sent?.key?.id})`);
            } catch (err) {
                console.warn('[Image Send Failed, Falling back to Text]:', err.message);
            }
        } else {
            console.warn(`[Outbound Media] Could not buffer image ${mediaUrl.slice(0, 60)}, sending text fallback`);
        }
    }

    if (!sent) {
        console.log(`[Outbound Send via ${activeAcc.connectedNumber || activeAcc.id}] Dispatching to ${jid}: "${finalText}"`);
        sent = await activeAcc.sock.sendMessage(jid, { text: finalText });
    }

    return {
        status: 'success',
        message_id: sent?.key?.id || ('wamid_' + Date.now()),
        account_id: activeAcc.id,
        sender_phone: activeAcc.connectedNumber,
        jid: jid,
        recipient: target,
        media_url: mediaUrl || null,
        timestamp: new Date().toISOString()
    };
}
// =========================================================================
// WHATSAPP BAILEYS PERSISTENT DATABASE SESSION STORE (Survives Reboots & Git Deploys)
// =========================================================================
async function backupSessionFilesToDb(accountId, fileMap) {
    if (!fileMap || Object.keys(fileMap).length === 0) return;
    try {
        await callCrmApi('save_auth_session', {
            account_slot: accountId,
            files: fileMap
        });
    } catch (e) {
        console.warn(`[Session Backup Notice for ${accountId}]:`, e.message);
    }
}

async function backupAllSessionFiles(accountId, sessionDir) {
    if (!fs.existsSync(sessionDir)) return;
    try {
        const files = fs.readdirSync(sessionDir);
        const fileMap = {};
        for (const file of files) {
            if (file.endsWith('.json') && !file.startsWith('lid-mapping-')) {
                const fullPath = path.join(sessionDir, file);
                try {
                    fileMap[file] = fs.readFileSync(fullPath, 'utf8');
                } catch (e) {}
            }
        }
        if (Object.keys(fileMap).length > 0) {
            await backupSessionFilesToDb(accountId, fileMap);
            console.log(`💾 [Session Persist] Backed up ${Object.keys(fileMap).length} auth key/creds files for ${accountId} to MySQL database.`);
        }
    } catch (e) {
        console.warn(`[Full Session Backup Error for ${accountId}]:`, e.message);
    }
}

async function restoreSessionFromDb(accountId, targetDir) {
    try {
        const res = await callCrmApi('get_auth_session', { account_slot: accountId });
        if (res && res.status === 'success' && res.files && typeof res.files === 'object') {
            const fileKeys = Object.keys(res.files);
            if (fileKeys.length > 0 && res.files['creds.json']) {
                if (!fs.existsSync(targetDir)) {
                    fs.mkdirSync(targetDir, { recursive: true });
                }
                for (const fileName of fileKeys) {
                    const filePath = path.join(targetDir, fileName);
                    fs.writeFileSync(filePath, res.files[fileName], 'utf8');
                }
                console.log(`✅ [Session Restore] Restored ${fileKeys.length} session credential files for ${accountId} from MySQL database.`);
                return true;
            }
        }
    } catch (e) {
        console.warn(`[Session Restore Notice for ${accountId}]:`, e.message);
    }
    return false;
}

async function clearSessionFromDb(accountId) {
    try {
        await callCrmApi('clear_auth_session', { account_slot: accountId });
        console.log(`🗑️ [Session DB Purge] Cleared persistent database session for ${accountId}`);
    } catch (e) {
        console.warn(`[Session Clear Notice for ${accountId}]:`, e.message);
    }
}

function hasRegisteredSession(accountId) {
    const sessionDir = path.join(SESSIONS_BASE_DIR, accountId);
    const credsFile = path.join(sessionDir, 'creds.json');
    if (!fs.existsSync(credsFile)) return false;
    try {
        const raw = fs.readFileSync(credsFile, 'utf8');
        const parsed = JSON.parse(raw);
        return Boolean(parsed && (parsed.registered || parsed.me?.id));
    } catch (e) {
        return false;
    }
}

// Initialize all saved sessions
async function initializeAllSessions() {
    try {
        // Pre-seed default accounts into memory if not present
        for (const def of DEFAULT_ACCOUNT_DEFINITIONS) {
            if (!accounts.has(def.id)) {
                accounts.set(def.id, {
                    id: def.id,
                    label: def.label,
                    status: 'DISCONNECTED',
                    sock: null,
                    qrImage: null,
                    connectedNumber: null,
                    connectedName: null,
                    isStarting: false,
                    intentionalLogout: false,
                    lastActive: null
                });
            }

            // Restore from MySQL database if disk files are missing
            const sessionDir = path.join(SESSIONS_BASE_DIR, def.id);
            const credsFile = path.join(sessionDir, 'creds.json');
            if (!fs.existsSync(credsFile)) {
                console.log(`[Bridge Boot] Checking MySQL database for persistent session: ${def.id}...`);
                await restoreSessionFromDb(def.id, sessionDir);
            }
        }

        const dirs = fs.readdirSync(SESSIONS_BASE_DIR, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        const registeredDirs = dirs.filter(dir => hasRegisteredSession(dir));

        console.log(`[Bridge Boot] Registered sessions detected on disk:`, registeredDirs.length > 0 ? registeredDirs.join(', ') : 'None (Awaiting Link)');

        if (registeredDirs.length === 0) {
            // Keep slots DISCONNECTED until user generates QR explicitly
            broadcastAccountsUpdate();
        } else {
            registeredDirs.forEach((dir, idx) => {
                const def = DEFAULT_ACCOUNT_DEFINITIONS.find(d => d.id === dir);
                const label = def ? def.label : (idx === 0 ? 'Primary WhatsApp' : `WhatsApp Business #${idx + 1}`);
                initAccountSession(dir, label);
            });
        }
    } catch (e) {
        console.warn('[Bridge Boot Notice]:', e.message);
        broadcastAccountsUpdate();
    }
}

// -------------------------------------------------------------
// CENTRALIZED CALL CLAIM PROCEDURE: NATIVE WHATSAPP VOICE & IN-CRM CALL ASSISTANT
// -------------------------------------------------------------
async function executeCallClaimProcedure(data) {
    const callId = data?.call_id || data?.id;
    const staffName = data?.assigned_staff_name || 'Support Executive';
    const staffId = data?.assigned_staff_id || 'staff_01';

    // 1. Locate active Baileys inbound call
    let baileysCall = callId ? ACTIVE_BAILEYS_CALLS.get(callId) : null;
    if (!baileysCall && data?.customer_phone) {
        const searchDigits = String(data.customer_phone).replace(/\D/g, '').slice(-10);
        for (const [cId, bCall] of ACTIVE_BAILEYS_CALLS.entries()) {
            if (bCall.cleanDigits && bCall.cleanDigits.endsWith(searchDigits)) {
                baileysCall = bCall;
                break;
            }
        }
    }
    if (!baileysCall && ACTIVE_BAILEYS_CALLS.size > 0) {
        // Fallback: pick the most recent inbound call in memory (< 45s)
        const calls = Array.from(ACTIVE_BAILEYS_CALLS.values()).sort((a, b) => b.timestamp - a.timestamp);
        if (calls.length > 0 && (Date.now() - calls[0].timestamp) < 45000) {
            baileysCall = calls[0];
            console.log(`📞 [Baileys] Auto-matched incoming call ${baileysCall.callId} from recent memory`);
        }
    }

    // 2. NATIVE WHATSAPP CALL PRESERVATION:
    // DO NOT rejectCall() — this ensures the call does NOT get cut with "No answer".
    // The incoming call will ring and be answered natively on the business phone/device!
    if (baileysCall) {
        baileysCall.claimedBy = { staffId, staffName, claimedAt: Date.now() };
        console.log(`✅ [Baileys] Call ${callId} claimed by ${staffName} (${staffId}) - Voice ringing kept active on WhatsApp line (NO rejection).`);
    }

    // 3. ZERO UNWANTED LINKS:
    // DO NOT send external trycloudflare/voice-call.html messages to customer's WhatsApp chat.
    // The CRM UI operates as the Live In-Call Assistant & CRM Logger for the staff member.
}

// -------------------------------------------------------------
// SOCKET.IO REALTIME WEBSOCKET HANDLERS
// -------------------------------------------------------------
io.on('connection', (socket) => {
    const origin = socket.handshake.headers.origin || socket.handshake.headers.referer || 'direct';
    const address = socket.handshake.address || socket.conn.remoteAddress || 'unknown';
    console.log(`⚡ [Socket Connected] Socket ID: ${socket.id} | Address: ${address} | Origin: ${origin}`);

    socket.on('disconnect', (reason) => {
        console.log(`🔌 [Socket Disconnected] Socket ID: ${socket.id} | Reason: ${reason}`);
    });

    socket.on('client:connected', (data) => {
        console.log(`👤 [Client Identified] Socket ID: ${socket.id} registered for User: ${data?.userId || 'unknown'}`);
    });

    socket.on('client:reconnected', (data) => {
        console.log(`🔄 [Socket Reconnected] Client restored connection! Socket ID: ${socket.id} | User: ${data?.userId || 'unknown'} | Attempt: ${data?.attempt || 1} | Time: ${new Date().toISOString()}`);
    });

    socket.on('whatsapp:client_ack', (ack) => {
        console.log(`✅ [Client ACK Received] Message UID: ${ack?.message_uid || ack?.id} confirmed received by Socket ID: ${socket.id} (User: ${ack?.userId || 'unknown'})`);
    });

    // Immediately send current multi-account status
    socket.emit('bridge:accounts', {
        status: 'success',
        accounts: getAccountsSummary(),
        timestamp: new Date().toISOString()
    });

    // Handle outbound message sending from CRM client over WebSocket
    socket.on('whatsapp:send', async (data, callback) => {
        try {
            const { phone, text, jid, accountId, messageUid, message_uid, mediaUrl, media_url, mediaData, media_data, image, imageUrl } = data;
            const cleanP = String(phone || '').replace(/[^0-9]/g, '');
            const directPhoneJid = (cleanP.length === 10 || (cleanP.length === 12 && cleanP.startsWith('91')))
                ? `${cleanP.length === 10 ? ('91' + cleanP) : cleanP}@s.whatsapp.net`
                : null;
            const target = directPhoneJid || (jid && !jid.includes('@lid') ? jid : (directPhoneJid || jid || phone));
            const imageTarget = mediaData || media_data || mediaUrl || media_url || image || imageUrl || null;
            const result = await sendWhatsAppMessage(target, text, accountId, imageTarget);

            if (typeof callback === 'function') {
                callback({ status: 'success', result });
            }

            const outboundMsgUid = String(message_uid || messageUid || result?.id || ('msg_out_' + Date.now()));

            // Record outbound message in CRM PHP backend so it persists in MySQL across refreshes
            callCrmApi('record_outbound_message', {
                phone: phone || '',
                text: text || '',
                jid: result?.jid || jid || null,
                accountId: accountId || 'account_1',
                media_url: imageTarget,
                customer_id: data.customerId || null,
                message_uid: outboundMsgUid
            }).catch(() => {});

            const outboundPayload = {
                id: outboundMsgUid,
                message_uid: outboundMsgUid,
                customer_id: data.customerId || null,
                sender: 'staff',
                sender_name: 'Super Admin',
                sender_phone: phone,
                sender_jid: result?.jid || jid || null,
                message_text: text || (imageTarget ? '[Photo Attachment]' : ''),
                text: text || (imageTarget ? '[Photo Attachment]' : ''),
                type: imageTarget ? 'image' : 'text',
                media_url: imageTarget,
                account_id: accountId || 'account_1',
                direction: 'outbound',
                is_outbound: true,
                source: 'CRM_OUTBOUND',
                timestamp_epoch: Math.floor(Date.now() / 1000),
                received_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: 'DELIVERED'
            };

            // Real-time broadcast to all connected staff tabs & browsers
            io.emit('whatsapp:outbound', outboundPayload);

            io.emit('whatsapp:sent_ack', {
                recipient: phone,
                jid: result?.jid || jid,
                account_id: result?.account_id || accountId,
                text: text,
                media_url: imageTarget,
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

    // Realtime User-Specific Chat Read Notification (Zero Page Refresh Badge Clear + Scenario B: WhatsApp Read Sync)
    socket.on('chat:mark_read', async (data) => {
        const { customer_id, user_id, phone } = data || {};
        if (customer_id && user_id) {
            console.log(`[Socket.IO Read Event] User "${user_id}" marked customer "${customer_id}" as READ.`);
            io.emit('chat:read_status', {
                customer_id,
                user_id,
                phone: phone || null,
                unread_count: 0,
                timestamp: Date.now()
            });

            // Forward to CRM PHP API to update chat_read_status in MySQL database
            if (typeof callCrmApi === 'function') {
                callCrmApi('mark_customer_read', { customer_id, user_id, phone: phone || null }).catch(() => {});
            }

            // =========================================================================
            // SCENARIO B: TRANSMIT READ RECEIPTS TO WHATSAPP BUSINESS VIA BAILEYS
            // Tells WhatsApp servers that messages are read & clears phone unread badge
            // =========================================================================
            try {
                const cleanDigits = String(phone || customer_id || '').replace(/\D/g, '').slice(-10);
                const targetKeys = UNREAD_KEYS_BY_CHAT.get(cleanDigits) ||
                                   UNREAD_KEYS_BY_CHAT.get(customer_id) ||
                                   (cleanDigits ? UNREAD_KEYS_BY_CHAT.get('91' + cleanDigits + '@s.whatsapp.net') : null) ||
                                   [];

                let targetSock = null;
                for (const acc of accounts.values()) {
                    if (acc.status === 'CONNECTED' && acc.sock) {
                        targetSock = acc.sock;
                        break;
                    }
                }

                if (targetSock) {
                    const destJid = resolveDestinationJid(phone || customer_id) || (cleanDigits ? `91${cleanDigits}@s.whatsapp.net` : null);
                    if (destJid) {
                        // 1. Send Baileys read receipts (blue ticks) for unread messages
                        if (targetKeys.length > 0) {
                            const keysToRead = targetKeys.map(item => item.key);
                            await targetSock.readMessages(keysToRead).catch(err => {
                                console.warn('[Baileys readMessages warning]:', err.message);
                            });
                            console.log(`[Two-Way Read Sync] Sent read receipts (blue ticks) for ${keysToRead.length} message(s) to WhatsApp chat ${destJid}`);
                        }

                        // 2. Modify chat state to mark as read on WhatsApp Business phone app
                        const lastMsgRange = targetKeys.length > 0 ? [targetKeys[targetKeys.length - 1]] : undefined;
                        await targetSock.chatModify({
                            markRead: true,
                            lastMessages: lastMsgRange
                        }, destJid).catch(err => {
                            console.warn('[Baileys chatModify warning]:', err.message);
                        });
                        console.log(`[Two-Way Read Sync] WhatsApp chat ${destJid} marked as read via chatModify`);
                    }
                }

                // Clear unread message keys in memory for this customer
                UNREAD_KEYS_BY_CHAT.delete(cleanDigits);
                UNREAD_KEYS_BY_CHAT.delete(customer_id);
                if (cleanDigits) {
                    UNREAD_KEYS_BY_CHAT.delete('cust_' + cleanDigits);
                    UNREAD_KEYS_BY_CHAT.delete('91' + cleanDigits + '@s.whatsapp.net');
                }
            } catch (errSync) {
                console.error('[Two-Way Read Sync Error]:', errSync.message);
            }
        }
    });

    // Realtime Multi-Staff Call Claim Broadcast — ATOMIC PICKUP & WHATSAPP RINGING TERMINATION
    socket.on('call:claim_broadcast', async (data) => {
        console.log('🔒 [Socket.IO Call Claimed Broadcast from Client]:', data);
        io.emit('call:claimed', data);
        await executeCallClaimProcedure(data);
    });

    // Dismiss Incoming Call Broadcast (Cuts ringing on WhatsApp if staff dismisses)
    socket.on('call:dismiss_broadcast', async (data) => {
        const callId = data?.call_id || data?.id;
        const baileysCall = callId ? ACTIVE_BAILEYS_CALLS.get(callId) : null;
        if (baileysCall && baileysCall.sock && typeof baileysCall.sock.rejectCall === 'function') {
            try {
                await baileysCall.sock.rejectCall(baileysCall.callId, baileysCall.callFrom);
                console.log(`🛑 [Baileys] Dismissed call ${callId} on WhatsApp`);
            } catch (e) {}
        }
    });

    // Resend Voice Call Link to Customer via WhatsApp
    socket.on('call:resend_voice_link', async (data) => {
        const { call_id, customer_phone, voice_room_token, staff_name } = data || {};
        let targetSock = null;
        let targetJid = null;

        const bCall = call_id ? ACTIVE_BAILEYS_CALLS.get(call_id) : null;
        if (bCall && bCall.sock) {
            targetSock = bCall.sock;
            targetJid = bCall.chatId || bCall.callFrom;
        } else {
            const primary = Array.from(accounts.values()).find(a => a.sock && a.status === 'CONNECTED');
            if (primary) {
                targetSock = primary.sock;
                const digits = String(customer_phone || '').replace(/\D/g, '');
                if (digits) {
                    targetJid = digits.length === 10 ? `91${digits}@s.whatsapp.net` : `${digits}@s.whatsapp.net`;
                }
            }
        }

        if (targetSock && targetJid) {
            const publicHost = getPublicBaseUrl();
            const roomToken = voice_room_token || bCall?.roomToken || ('vrm_' + Date.now());
            const link = `${publicHost}/voice-call.html?token=${roomToken}&autocall=1`;
            const staff = staff_name || 'Support Staff';

            const text = `📞 *VOICE CALL INVITATION*\n\n` +
                `Hello! Executive *${staff}* is waiting on the line to talk to you right now.\n\n` +
                `👉 *TAP HERE TO JOIN CALL:*\n` +
                `${link}\n\n` +
                `_No app download required. Connects directly in your phone browser._`;

            try {
                await targetSock.sendMessage(targetJid, { text });
                socket.emit('call:resend_success', { message: 'Link sent to customer WhatsApp!' });
            } catch (e) {
                socket.emit('call:resend_error', { message: e.message });
            }
        }
    });

    socket.on('call:end_broadcast', (data) => {
        console.log('📴 [Socket.IO Call Ended Broadcast from Client]:', data);
        io.emit('call:ended', data);
    });

    // Handle request to add / refresh account QR
    socket.on('accounts:add', (data) => {
        const nextId = 'account_' + (accounts.size + 1);
        const label = data?.label || `WhatsApp Business #${accounts.size + 1}`;
        initAccountSession(nextId, label);
    });

    // Handle account disconnect request from CRM over WebSocket
    socket.on('accounts:disconnect', async (data, ack) => {
        const targetId = data?.accountId || 'account_1';
        const resObj = await disconnectAccountSession(targetId);
        if (typeof ack === 'function') ack(resObj);
    });

    // Handle Auto-Reply toggle from CRM client over WebSocket
    socket.on('autoreply:toggle', (data, ack) => {
        const newState = (data && data.enabled !== undefined) ? Boolean(data.enabled) : !autoReplyConfig.enabled;
        autoReplyConfig.enabled = newState;
        if (fs.existsSync(configFilePath)) {
            try {
                const currentCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                currentCfg.autoReplyEnabled = autoReplyConfig.enabled;
                fs.writeFileSync(configFilePath, JSON.stringify(currentCfg, null, 2), 'utf8');
            } catch (e) { }
        }
        io.emit('autoreply:updated', { enabled: autoReplyConfig.enabled });
        console.log(`[Auto-Reply Engine] 🔄 Auto-Reply socket toggle: ${autoReplyConfig.enabled ? 'ON' : 'OFF'}`);
        if (typeof ack === 'function') ack({ status: 'success', enabled: autoReplyConfig.enabled });
    });

    // Handle real-time Q&A Rules Save from CRM client over WebSocket
    socket.on('autoreply:save_rules', (data, ack) => {
        try {
            const rules = data?.rules;
            if (Array.isArray(rules)) {
                autoReplyRules = rules;
                if (fs.existsSync(configFilePath)) {
                    try {
                        const currentCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                        currentCfg.autoReplyRules = rules;
                        fs.writeFileSync(configFilePath, JSON.stringify(currentCfg, null, 2), 'utf8');
                    } catch (e) {
                        console.warn('[Socket Rules Save Warning]:', e.message);
                    }
                }
                io.emit('autoreply:rules_updated', { rules: autoReplyRules });
                console.log(`[Auto-Reply Engine] 💾 Saved ${autoReplyRules.length} rules via Socket.IO from CRM Client.`);
                if (typeof ack === 'function') ack({ status: 'success', count: autoReplyRules.length });
            }
        } catch (err) {
            if (typeof ack === 'function') ack({ status: 'error', message: err.message });
        }
    });

    socket.on('disconnect', () => { });
});

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

app.get('/api/autoreply/status', (req, res) => {
    loadBrandConfig();
    res.json({
        status: 'success',
        enabled: Boolean(autoReplyConfig.enabled),
        cooldownMinutes: autoReplyConfig.cooldownMinutes,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/autoreply/toggle', (req, res) => {
    try {
        const { enabled } = req.body || {};
        autoReplyConfig.enabled = (enabled !== undefined) ? Boolean(enabled) : !autoReplyConfig.enabled;

        // Persist to whatsapp_account_config.json
        if (fs.existsSync(configFilePath)) {
            try {
                const currentCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                currentCfg.autoReplyEnabled = autoReplyConfig.enabled;
                fs.writeFileSync(configFilePath, JSON.stringify(currentCfg, null, 2), 'utf8');
            } catch (err) { }
        }

        // Broadcast to connected Socket.IO CRM clients
        io.emit('autoreply:updated', { enabled: autoReplyConfig.enabled });

        console.log(`[Auto-Reply Engine] 🔄 Auto-Reply REST toggle set to: ${autoReplyConfig.enabled ? 'ON' : 'OFF'}`);
        res.json({
            status: 'success',
            enabled: autoReplyConfig.enabled,
            message: `Auto-reply successfully toggled ${autoReplyConfig.enabled ? 'ON' : 'OFF'}`
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/autoreply/rules', (req, res) => {
    loadBrandConfig();
    res.json({
        status: 'success',
        rules: autoReplyRules,
        timestamp: new Date().toISOString()
    });
});

app.post('/api/autoreply/rules', (req, res) => {
    try {
        const { rules } = req.body || {};
        if (!Array.isArray(rules)) {
            return res.status(400).json({ status: 'error', message: 'Rules must be an array.' });
        }
        autoReplyRules = rules;

        // Persist to whatsapp_account_config.json
        if (fs.existsSync(configFilePath)) {
            try {
                const currentCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                currentCfg.autoReplyRules = rules;
                fs.writeFileSync(configFilePath, JSON.stringify(currentCfg, null, 2), 'utf8');
            } catch (err) {
                console.warn('[Bridge Rules Save Warning]:', err.message);
            }
        }

        // Broadcast to connected Socket.IO CRM clients
        io.emit('autoreply:rules_updated', { rules: autoReplyRules });

        console.log(`[Auto-Reply Engine] 📋 Updated ${autoReplyRules.length} pre-set template rules from CRM.`);
        res.json({
            status: 'success',
            message: `Successfully saved ${autoReplyRules.length} auto-reply rules.`,
            rules: autoReplyRules
        });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

app.get('/api/accounts', (req, res) => {
    res.json({
        status: 'success',
        accounts: getAccountsSummary(),
        timestamp: new Date().toISOString()
    });
});

app.post('/api/accounts/add', (req, res) => {
    const nextIdx = accounts.size + 1;
    const nextId = req.body.accountId || ('account_' + nextIdx);
    const label = req.body.label || `WhatsApp Account #${nextIdx}`;
    initAccountSession(nextId, label);
    res.json({ status: 'success', message: 'Account initialization started', account_id: nextId });
});

app.post('/api/accounts/refresh_qr', async (req, res) => {
    try {
        const { accountId, forceReset } = req.body;
        const targetId = accountId || 'account_1';
        const defaultDef = DEFAULT_ACCOUNT_DEFINITIONS.find(d => d.id === targetId);
        const label = accounts.get(targetId)?.label || (defaultDef ? defaultDef.label : (targetId === 'account_1' ? 'Primary WhatsApp' : `WhatsApp Business`));

        clearReconnectTimer(targetId);
        accountLocks.set(targetId, { isConnecting: false, attempts: 0 });

        if (accounts.has(targetId)) {
            const acc = accounts.get(targetId);
            acc.intentionalLogout = false;
            if (!forceReset && acc.status === 'CONNECTED' && acc.connectedNumber) {
                return res.json({ status: 'success', message: `Account ${targetId} is already connected (${acc.connectedNumber}).` });
            }
            if (acc.sock) {
                try { acc.sock.ev.removeAllListeners(); acc.sock.end(); } catch (e) { }
                acc.sock = null;
            }
            if (forceReset) {
                acc.status = 'DISCONNECTED';
                acc.connectedNumber = null;
                acc.connectedName = null;
                acc.qrImage = null;
            }
        }

        const sessionDir = path.join(SESSIONS_BASE_DIR, targetId);

        // When forceReset is explicitly requested, wipe stale credentials so a clean QR code is generated for new scans
        if (forceReset && fs.existsSync(sessionDir)) {
            try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) { }
            if (targetId === 'account_1') {
                const legacyDir = path.join(__dirname, 'auth_session');
                if (fs.existsSync(legacyDir)) {
                    try { fs.rmSync(legacyDir, { recursive: true, force: true }); } catch (e) { }
                }
            }
        }

        initAccountSession(targetId, label);
        res.json({ status: 'success', message: `Refreshing connection for ${targetId}` });
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
                try { await acc.sock.logout(); } catch (e) { }
                try { acc.sock.end(); } catch (e) { }
            }
            accounts.delete(accountId);
            const sessionDir = path.join(SESSIONS_BASE_DIR, accountId);
            if (fs.existsSync(sessionDir)) {
                try { fs.rmSync(sessionDir, { recursive: true, force: true }); } catch (e) { }
            }
            broadcastAccountsUpdate();
            return res.json({ status: 'success', message: `Account ${accountId} deleted successfully.` });
        }
        res.status(404).json({ status: 'error', message: 'Account not found' });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// Centralized Procedure: Disconnect and Logout WhatsApp session cleanly from WhatsApp servers & mobile phone
async function disconnectAccountSession(targetId = 'account_1') {
    try {
        console.log(`[Disconnect Request]: Disconnecting and logging out ${targetId} from WhatsApp servers & phone...`);
        clearReconnectTimer(targetId);
        accountLocks.set(targetId, { isConnecting: false, attempts: 0 });

        let acc = accounts.get(targetId);
        if (!acc) {
            acc = {
                id: targetId,
                label: targetId === 'account_1' ? 'Primary WhatsApp' : `WhatsApp Business (${targetId})`,
                status: 'DISCONNECTED',
                sock: null,
                qrImage: null,
                connectedNumber: null,
                connectedName: null,
                isStarting: false,
                intentionalLogout: true,
                lastActive: new Date().toISOString()
            };
            accounts.set(targetId, acc);
        } else {
            acc.intentionalLogout = true;
            acc.status = 'LOGGING_OUT';
            acc.isStarting = false;
        }

        // Inform clients logout is in progress
        broadcastAccountsUpdate();

        // Send remove-companion-device IQ node over active socket to unlink on the physical mobile phone
        if (acc.sock) {
            try {
                console.log(`[Disconnect] Transmitting remove-companion-device IQ to WhatsApp servers for ${targetId}...`);
                await Promise.race([
                    acc.sock.logout('User clicked Disconnect in CRM'),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Logout network timeout')), 4000))
                ]);
                console.log(`[Disconnect] WhatsApp servers successfully processed unbind for ${targetId}. Mobile phone is unlinked.`);
            } catch (e) {
                console.warn(`[Disconnect logout notice for ${targetId}]:`, e.message);
            }
            try {
                acc.sock.ev.removeAllListeners();
                acc.sock.end();
            } catch (err) {}
            acc.sock = null;
        }

        // Give WhatsApp network 400ms to propagate session termination before wiping local credentials
        await new Promise(r => setTimeout(r, 400));

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

        // Purge session from MySQL database permanently on explicit CRM disconnect
        clearSessionFromDb(targetId);

        // Also clean legacy auth folder if primary
        if (targetId === 'account_1') {
            const legacyDir = path.join(__dirname, 'auth_session');
            if (fs.existsSync(legacyDir)) {
                try { fs.rmSync(legacyDir, { recursive: true, force: true }); } catch (e) { }
            }
        }

        syncLocalConfigFile(targetId, 'DISCONNECTED', null, null, acc.label);
        broadcastAccountsUpdate();

        // Also sync directly to Hostinger CRM API with force: true
        callCrmApi('sync_account_status', {
            account_slot: targetId,
            status: 'DISCONNECTED',
            phone_number: null,
            disconnect_reason: 'Admin disconnected via CRM',
            reconnect_attempts: 0,
            force: true,
            force_disconnect: true,
            label: acc.label
        }).catch(() => {});

        return {
            status: 'success',
            message: `Account ${targetId} disconnected. Mobile phone unlinked successfully.`
        };
    } catch (e) {
        console.error('[Disconnect Error]:', e.message);
        return { status: 'error', message: e.message };
    }
}

app.post('/api/accounts/disconnect', async (req, res) => {
    const { accountId } = req.body;
    const targetId = accountId || 'account_1';
    const result = await disconnectAccountSession(targetId);
    if (result.status === 'error') {
        return res.status(500).json(result);
    }
    res.json(result);
});

app.post('/api/accounts/update_profile', async (req, res) => {
    try {
        const { brandName, brandTagline } = req.body;
        if (brandName) {
            // 1. Update in-memory BRAND_NAME so auto-replies immediately use new name
            BRAND_NAME = brandName;
            if (brandTagline) BRAND_TAGLINE = brandTagline;
            console.log(`[Brand Config] BRAND_NAME updated to: "${BRAND_NAME}"`);

            // 2. Persist to whatsapp_account_config.json
            try {
                let cfgData = {};
                if (fs.existsSync(configFilePath)) {
                    cfgData = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                }
                cfgData.brand_name = BRAND_NAME;
                if (brandTagline) cfgData.brand_tagline = BRAND_TAGLINE;
                fs.writeFileSync(configFilePath, JSON.stringify(cfgData, null, 4), 'utf8');
                console.log(`[Brand Config] Persisted brand_name to whatsapp_account_config.json`);
            } catch (saveErr) {
                console.warn('[Brand Config] Failed to persist brand name to config:', saveErr.message);
            }

            // 3. Update WhatsApp profile pushName on all connected accounts
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
        res.json({ status: 'success', brandName, brandTagline });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

// GET current brand config (so CRM UI can populate brand settings fields on load)
app.get('/api/brand/config', (req, res) => {
    loadBrandConfig(); // Always read latest from file
    res.json({
        status: 'success',
        brand_name: BRAND_NAME,
        brand_tagline: BRAND_TAGLINE,
        autoReplyEnabled: autoReplyConfig.enabled,
        cooldownMinutes: autoReplyConfig.cooldownMinutes,
        keywordMatching: autoReplyConfig.keywordMatching
    });
});

// GET current auto-reply configuration & status
app.get('/api/autoreply/status', (req, res) => {
    loadBrandConfig();
    res.json({
        status: 'success',
        enabled: autoReplyConfig.enabled,
        cooldownMinutes: autoReplyConfig.cooldownMinutes,
        keywordMatching: autoReplyConfig.keywordMatching
    });
});

// POST toggle or configure auto-reply in real-time
app.post('/api/autoreply/toggle', (req, res) => {
    try {
        const { enabled, cooldownMinutes, keywordMatching } = req.body;
        if (typeof enabled === 'boolean') {
            autoReplyConfig.enabled = enabled;
        }
        if (typeof cooldownMinutes !== 'undefined') {
            autoReplyConfig.cooldownMinutes = Number(cooldownMinutes);
        }
        if (typeof keywordMatching === 'boolean') {
            autoReplyConfig.keywordMatching = keywordMatching;
        }

        // Persist to whatsapp_account_config.json
        const configFilePath = path.join(__dirname, '..', 'whatsapp_account_config.json');
        if (fs.existsSync(configFilePath)) {
            try {
                const rawCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
                rawCfg.autoReplyEnabled = autoReplyConfig.enabled;
                rawCfg.autoReplyCooldownMinutes = autoReplyConfig.cooldownMinutes;
                rawCfg.autoReplyKeywordMatching = autoReplyConfig.keywordMatching;
                fs.writeFileSync(configFilePath, JSON.stringify(rawCfg, null, 4), 'utf8');
            } catch (err) {
                console.warn('[AutoReply Config Save Warning]:', err.message);
            }
        }

        console.log(`[AutoReply Bridge] Updated Status: ${autoReplyConfig.enabled ? 'ACTIVE (ON)' : 'PAUSED (OFF)'}`);

        // Broadcast to any connected websocket clients
        io.emit('autoreply:status', {
            enabled: autoReplyConfig.enabled,
            cooldownMinutes: autoReplyConfig.cooldownMinutes,
            keywordMatching: autoReplyConfig.keywordMatching
        });

        res.json({
            status: 'success',
            enabled: autoReplyConfig.enabled,
            cooldownMinutes: autoReplyConfig.cooldownMinutes,
            keywordMatching: autoReplyConfig.keywordMatching,
            message: `Auto-reply is now ${autoReplyConfig.enabled ? 'ON' : 'OFF'}`
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.get('/api/qr/status', (req, res) => {
    const summary = getAccountsSummary();
    const primary = summary.find(a => a.id === 'account_1') || summary[0] || { status: 'DISCONNECTED', connected_number: null, qr_image: null, connected_name: null };
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
    const primary = summary.find(a => a.id === 'account_1') || summary[0] || { status: 'DISCONNECTED', connected_number: null, qr_image: null, connected_name: null };
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

app.get('/', (req, res) => {
    res.json({
        status: 'UP',
        service: 'GRM_WHATSAPP_BAILEYS_BRIDGE',
        uptime: Math.floor(process.uptime()),
        timestamp: new Date().toISOString()
    });
});

app.get('/api/health', (req, res) => {
    const summary = getAccountsSummary();
    const connectedAccounts = summary.filter(a => a.status === 'CONNECTED');
    res.json({
        status: 'UP',
        service: 'GRM_WHATSAPP_BAILEYS_BRIDGE',
        uptime_seconds: Math.floor(process.uptime()),
        memory_usage_mb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        total_accounts: summary.length,
        connected_accounts: connectedAccounts.length,
        accounts: summary.map(a => ({ id: a.id, status: a.status, phone: a.connected_number })),
        timestamp: new Date().toISOString()
    });
});

// Broadcast Telephony Call Masking Events (call:incoming, call:claimed, call:ended)
app.post('/api/calls/event', async (req, res) => {
    try {
        const { event, data } = req.body;
        if (!event) {
            return res.status(400).json({ status: 'error', message: 'Event name is required' });
        }
        // Broadcast across all connected Socket.IO staff client browser tabs
        io.emit(event, data || {});
        console.log(`[Call Masking Socket] Broadcasted "${event}" across clients:`, data);

        // If the event is call:claimed, immediately cut WhatsApp ringing on customer's phone & dispatch voice link!
        if (event === 'call:claimed') {
            await executeCallClaimProcedure(data);
        }

        res.json({ status: 'success', event, clients: io.engine ? io.engine.clientsCount : 0 });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.post('/api/calls/initiate', async (req, res) => {
    try {
        const { customerPhone, customerName, staffName, accountId } = req.body;
        const brand = BRAND_NAME || 'Blue Berry 💙';

        let activeAcc = null;
        if (accountId && accounts.has(accountId) && accounts.get(accountId).status === 'CONNECTED') {
            activeAcc = accounts.get(accountId);
        } else {
            for (const acc of accounts.values()) {
                if (acc.status === 'CONNECTED' && acc.sock) {
                    activeAcc = acc;
                    break;
                }
            }
        }

        if (activeAcc && activeAcc.sock) {
            try {
                await activeAcc.sock.updateProfileName(brand);
            } catch (e) { }
        }

        console.log(`[Call Initiated] Brand Call to ${customerPhone} by ${staffName || 'Staff'} under identity "${brand}"`);

        res.json({
            status: 'success',
            caller_identity: brand,
            masking: 'ACTIVE',
            message: `Call session active under brand identity "${brand}". Staff personal number is 100% masked.`
        });
    } catch (e) {
        res.status(500).json({ status: 'error', message: e.message });
    }
});

app.post('/api/bulk_request/event', (req, res) => {
    try {
        const { status, request, reason } = req.body || {};
        console.log(`⚡ [Bridge Event] Bulk Request ${request ? request.request_code : ''} updated to ${status}`);
        io.emit('bulk_request:updated', { status, request, reason });
        res.json({ success: true, status, code: request ? request.request_code : null });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

app.post('/api/send', async (req, res) => {
    try {
        const { phone, text, jid, accountId, mediaUrl, media_url, mediaData, media_data, image, imageUrl } = req.body;
        if (!phone && !jid) {
            return res.status(400).json({ status: 'error', message: 'Phone or JID is required' });
        }
        if (!text && !mediaUrl && !media_url && !mediaData && !media_data && !image && !imageUrl) {
            return res.status(400).json({ status: 'error', message: 'Text or media is required' });
        }

        let finalTextToSend = text || '';
        let activeAcc = (accountId && accounts.has(accountId) && accounts.get(accountId).sock) ? accounts.get(accountId) : null;
        if (!activeAcc) {
            for (const acc of accounts.values()) {
                if (acc.status === 'CONNECTED' && acc.sock) {
                    activeAcc = acc;
                    break;
                }
            }
        }
        if (activeAcc && activeAcc.connectedNumber) {
            const cleanCrmNum = activeAcc.connectedNumber.replace(/[^0-9]/g, '');
            if (cleanCrmNum) {
                finalTextToSend = finalTextToSend.replace(/https:\/\/wa\.me\/[0-9]+/g, `https://wa.me/${cleanCrmNum}`);
            }
        }
        const imageTarget = mediaData || media_data || mediaUrl || media_url || image || imageUrl || null;
        const cleanP = String(phone || '').replace(/[^0-9]/g, '');
        const directPhoneJid = (cleanP.length === 10 || (cleanP.length === 12 && cleanP.startsWith('91')))
            ? `${cleanP.length === 10 ? ('91' + cleanP) : cleanP}@s.whatsapp.net`
            : null;
        const target = directPhoneJid || (jid && !jid.includes('@lid') ? jid : (directPhoneJid || jid || phone));
        const result = await sendWhatsAppMessage(target, finalTextToSend, accountId, imageTarget);
        callCrmApi('record_outbound_message', {
            phone: phone || '',
            text: finalTextToSend || '',
            jid: result?.jid || jid || null,
            accountId: accountId || 'account_1',
            media_url: imageTarget,
            customer_id: req.body?.customerId || null,
            message_uid: String(req.body?.message_uid || req.body?.messageUid || result?.id || ('msg_out_' + Date.now()))
        }).catch(() => {});
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
