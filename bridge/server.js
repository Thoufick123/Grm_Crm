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

// Brand Configuration
let BRAND_NAME = 'Blue Berry 💙';
let BRAND_TAGLINE = 'Premium Kids & Maternity Wear';

const configFilePath = path.join(__dirname, '..', 'whatsapp_account_config.json');
function loadBrandConfig() {
    try {
        if (fs.existsSync(configFilePath)) {
            const rawCfg = JSON.parse(fs.readFileSync(configFilePath, 'utf8'));
            if (rawCfg.brand_name) BRAND_NAME = rawCfg.brand_name;
            if (rawCfg.brand_tagline) BRAND_TAGLINE = rawCfg.brand_tagline;
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

// Helper to determine destination JID
function resolveDestinationJid(phoneOrJid) {
    if (!phoneOrJid) return null;
    let target = phoneOrJid.toString().trim();

    // Already a complete JID
    if (target.includes('@s.whatsapp.net') || target.includes('@lid')) {
        return target;
    }

    // Check cached map
    if (jidMap.has(target)) {
        return jidMap.get(target);
    }

    let clean = target.replace(/[^0-9]/g, '');
    if (jidMap.has(clean)) {
        return jidMap.get(clean);
    }

    // If 14+ digits and starts with known privacy prefixes, it is a WhatsApp Privacy LID
    if (clean.length >= 14 && (clean.startsWith('156') || clean.startsWith('235') || clean.startsWith('253'))) {
        return `${clean}@lid`;
    }

    // Standard Indian phone number (10 digits)
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
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                console.log(`[QR Bridge - ${accountId}] Connection closed (status: ${statusCode}). Reconnecting: ${shouldReconnect}`);
                accountObj.status = 'DISCONNECTED';
                accountObj.qrImage = null;
                accountObj.isStarting = false;
                broadcastAccountsUpdate();

                if (statusCode === DisconnectReason.loggedOut) {
                    if (fs.existsSync(sessionDir)) {
                        fs.rmSync(sessionDir, { recursive: true, force: true });
                    }
                }

                if (shouldReconnect) {
                    setTimeout(() => {
                        initAccountSession(accountId, label);
                    }, 5000);
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

                        const cleanNumber = senderJid.split('@')[0].split(':')[0];
                        const senderNumber = '+' + cleanNumber;
                        const senderName = msg.pushName || ('Customer ' + senderNumber.slice(-4));

                        // Store in JID Cache
                        jidMap.set(senderNumber, senderJid);
                        jidMap.set(cleanNumber, senderJid);

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

    // Auto-prepend Brand Name Banner to customer WhatsApp messages
    let finalText = text;
    if (BRAND_NAME && !finalText.includes(BRAND_NAME)) {
        finalText = `🛍️ *${BRAND_NAME}* • Order Desk\n━━━━━━━━━━━━━━━━━━━━\n${finalText}\n\n_${BRAND_TAGLINE}_`;
    }

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

        if (dirs.length === 0) {
            initAccountSession('account_1', 'Primary WhatsApp');
        } else {
            dirs.forEach((dir, idx) => {
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

            // Re-initialize a fresh QR session for this slot after 1.5 seconds
            setTimeout(() => {
                initAccountSession(targetId, acc.label);
            }, 1500);

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
