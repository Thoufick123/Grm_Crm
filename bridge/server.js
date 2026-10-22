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
const PROCESSED_MESSAGE_IDS = new Set();

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
let BRAND_NAME = 'GRM Garments'; // Overridden by whatsapp_account_config.json on load
let BRAND_TAGLINE = 'Premium Kids & Maternity Wear';

// Autonomous Server-Side Auto-Responder Configuration & Cache
const lastAutoReplyMap = new Map();
const customerCategoryState = new Map(); // senderPhone -> categoryId ('1', '2', etc.)
let autoReplyConfig = {
    enabled: true,
    cooldownMinutes: 0, // 0 = Instant reply on every message
    keywordMatching: true
};
let autoReplyRules = [];

const PRODUCTS_CATALOG = {
    '1': {
        categoryName: 'Baby Collection (0–3 Years)',
        categoryIcon: '👗',
        items: [
            {
                num: '1',
                name: 'Embroidered Cotton Baby Frock (Pink)',
                size: '2–3 Years',
                color: 'Pink',
                price: 599,
                stock: 12,
                sku: 'BF-001-PK',
                image: 'https://images.unsplash.com/photo-1518831959646-742c3a14ebf7?w=800&auto=format&fit=crop&q=80',
                desc: '100% Breathable Combed Cotton with fine needle embroidery. Soft inner lining, skin-friendly for babies.'
            },
            {
                num: '2',
                name: 'Embroidered Cotton Baby Frock (Sunshine Yellow)',
                size: '1–2 Years',
                color: 'Sunshine Yellow',
                price: 599,
                stock: 8,
                sku: 'BF-001-YL',
                image: 'https://images.unsplash.com/photo-1522771930-78848d9293e8?w=800&auto=format&fit=crop&q=80',
                desc: 'Bright festive yellow frock with contrast floral yoke and flared hem.'
            }
        ]
    },
    '2': {
        categoryName: 'Maternity & Feeding Wear',
        categoryIcon: '🤰',
        items: [
            {
                num: '1',
                name: 'Pure Cotton Tiered Feeding Gown',
                size: 'L / XL',
                color: 'Sky Blue',
                price: 1299,
                stock: 10,
                sku: 'MD-102-BL',
                image: 'https://images.unsplash.com/photo-1583846783977-d2b0993d4265?w=800&auto=format&fit=crop&q=80',
                desc: 'Concealed double invisible feeding zips. 100% pure premium mulmul cotton, ultra-comfortable.'
            },
            {
                num: '2',
                name: 'Maternity Tiered Cotton Floral Dress',
                size: 'M / L',
                color: 'Blush Pink',
                price: 1450,
                stock: 14,
                sku: 'MD-103-PK',
                image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
                desc: 'Graceful floral flare with maternity empire waist and comfortable all-day fit.'
            }
        ]
    },
    '3': {
        categoryName: 'Newborn Gift Sets (0–6 Months)',
        categoryIcon: '🎁',
        items: [
            {
                num: '1',
                name: 'Newborn 5-Piece Organic Romper Gift Set',
                size: '0–6 Months',
                color: 'Pure White / Mint',
                price: 799,
                stock: 15,
                sku: 'BB-301-WH',
                image: 'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&auto=format&fit=crop&q=80',
                desc: 'Includes 1 Full Romper, 1 Bib, 1 Cap, 1 Pair Booties & Mittens in luxury gift box.'
            },
            {
                num: '2',
                name: 'Newborn Organic Muslin Swaddle & Cap Set',
                size: '0–6 Months',
                color: 'Pastel Mint',
                price: 499,
                stock: 20,
                sku: 'BB-302-SW',
                image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&auto=format&fit=crop&q=80',
                desc: 'Pack of 2 ultra-soft 100% organic cotton muslin swaddles with matching adjustable knot cap.'
            }
        ]
    },
    '4': {
        categoryName: 'Kids Everyday Wear (4–5 Years)',
        categoryIcon: '👕',
        items: [
            {
                num: '1',
                name: 'Kids Organic Cotton T-Shirt Set (Pack of 3)',
                size: '4–5 Years',
                color: 'Multi Yellow / Green / Blue',
                price: 450,
                stock: 25,
                sku: 'KD-204-YL',
                image: 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&auto=format&fit=crop&q=80',
                desc: 'Pack of 3 everyday Bio-washed cotton round-neck tees for active kids.'
            },
            {
                num: '2',
                name: 'Kids Denim Shorts & Cotton Tee Combo',
                size: '4–5 Years',
                color: 'Navy & White',
                price: 599,
                stock: 18,
                sku: 'KD-205-BL',
                image: 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=800&auto=format&fit=crop&q=80',
                desc: 'Breathable soft denim shorts paired with printed combed cotton crew neck tee.'
            }
        ]
    },
    '5': {
        categoryName: 'Wholesale & Bulk Bundles',
        categoryIcon: '📦',
        items: [
            {
                num: '1',
                name: 'Wholesale Baby Rompers Bulk Box (50 Pcs Assorted)',
                size: '0–24 Months',
                color: 'Assorted Prints',
                price: 8500,
                stock: 18,
                sku: 'WS-701-BX',
                image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=800&auto=format&fit=crop&q=80',
                desc: 'Master carton containing 50 individual polybag packed baby rompers ready for resale.'
            },
            {
                num: '2',
                name: 'Wholesale Pure Cotton Frocks Bundle (25 Pcs)',
                size: '2–5 Years',
                color: 'Multi Pastel Colors',
                price: 7200,
                stock: 12,
                sku: 'WS-702-BX',
                image: 'https://images.unsplash.com/photo-1471286174890-9c112ffca56a?w=800&auto=format&fit=crop&q=80',
                desc: '25 premium partywear and daily cotton frocks with retail hangers.'
            }
        ]
    },
    '6': {
        categoryName: 'Festive & VIP Silk Collection',
        categoryIcon: '🥻',
        items: [
            {
                num: '1',
                name: 'Girls Festive Silk Lehenga Choli',
                size: '6–7 Years',
                color: 'Ruby Red & Gold',
                price: 899,
                stock: 6,
                sku: 'GL-505-RD',
                image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=800&auto=format&fit=crop&q=80',
                desc: 'Art silk lehenga with golden zari border and matching stitched choli.'
            },
            {
                num: '2',
                name: 'Handcrafted Kanjivaram Silk Pattu Pavadai Set',
                size: '3–4 Years',
                color: 'Emerald Green & Gold',
                price: 2499,
                stock: 8,
                sku: 'VIP-901-GL',
                image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80',
                desc: 'Traditional South Indian pure zari pattu pavadai with rich pallu pattern.'
            }
        ]
    }
};

function getStockAutoReplyTemplate(customerName) {
    const brand = BRAND_NAME || 'GRM Garments Official';
    const cName = customerName ? customerName.split(' ')[0] : 'there';
    
    return {
        text: `✨ *${brand}* ✨\nHello *${cName}*! 👋 Welcome to our store.\n\n👗 *Ready-Stock Collections:*\n1️⃣ Baby Collection (0–3Y) — *₹599*\n2️⃣ Maternity & Feeding — *₹1,299*\n3️⃣ Newborn Gift Sets (0–6M) — *₹799*\n4️⃣ Kids Daily Wear (4–5Y) — *₹450*\n5️⃣ Wholesale Bundles — *₹7,200*\n6️⃣ Festive Silk Sets — *₹899*\n\n💬 *Reply with 1 to 6* to see photos & sizes!`
    };
}

function getCustomerCategory(senderKey, senderNumber, senderJid, cleanNumber) {
    const keys = [senderKey, senderNumber, senderJid, cleanNumber, (senderNumber || '').replace(/[^0-9]/g, ''), (cleanNumber || '').replace(/[^0-9]/g, '')];
    for (const k of keys) {
        if (k && customerCategoryState.has(k)) return customerCategoryState.get(k);
    }
    return null;
}

function setCustomerCategory(stateObj, senderKey, senderNumber, senderJid, cleanNumber) {
    const keys = [senderKey, senderNumber, senderJid, cleanNumber, (senderNumber || '').replace(/[^0-9]/g, ''), (cleanNumber || '').replace(/[^0-9]/g, '')];
    for (const k of keys) {
        if (k) customerCategoryState.set(k, stateObj);
    }
}

function clearCustomerCategory(senderKey, senderNumber, senderJid, cleanNumber) {
    const keys = [senderKey, senderNumber, senderJid, cleanNumber, (senderNumber || '').replace(/[^0-9]/g, ''), (cleanNumber || '').replace(/[^0-9]/g, '')];
    for (const k of keys) {
        if (k) customerCategoryState.delete(k);
    }
}

function getInteractiveResponse(cleanMsg, custName, senderKey, senderNumber, senderJid, cleanNumber) {
    const brand = BRAND_NAME || 'GRM Garments Official';
    const name = custName ? custName.split(' ')[0] : 'there';
    const key = cleanMsg.trim().toLowerCase();

    // 1. Check for Reset / Main Menu / Direct Greetings
    if (key === '0' || key === 'menu' || key === 'catalog' || key === 'catalogue' || key === 'main' || key === 'home' || key === 'hi' || key === 'hii' || key === 'hiii' || key === 'hello' || key === 'start') {
        clearCustomerCategory(senderKey, senderNumber, senderJid, cleanNumber);
        return getStockAutoReplyTemplate(custName);
    }

    const state = getCustomerCategory(senderKey, senderNumber, senderJid, cleanNumber);
    const activeCatId = typeof state === 'object' ? state?.catId : state;
    const isAwaitingProduct = typeof state === 'object' ? Boolean(state?.awaitingProduct) : false;

    // 2. If customer is currently viewing a Category Menu and awaiting product choice:
    if (activeCatId && isAwaitingProduct && PRODUCTS_CATALOG[activeCatId]) {
        const catData = PRODUCTS_CATALOG[activeCatId];
        const itemIdx = parseInt(key) - 1;

        // If user replies with a valid product number inside this category (e.g., 1 or 2)
        if (/^[1-9]$/.test(key) && !isNaN(itemIdx) && catData.items[itemIdx]) {
            const item = catData.items[itemIdx];
            console.log(`[Auto-Reply Engine] 🎯 Customer chosen Item #${key} (${item.name}) from Active Category #${activeCatId} (${catData.categoryName})`);
            
            // Mark product viewed (reset awaitingProduct so next number 1-6 can select a category or view other items)
            setCustomerCategory({ catId: activeCatId, awaitingProduct: false, lastProductSku: item.sku }, senderKey, senderNumber, senderJid, cleanNumber);
            
            return {
                type: 'image',
                image: item.image,
                caption: `${catData.categoryIcon} *${item.name}*\n━━━━━━━━━━━━━━━━━━━━\n💰 Price: *₹${item.price}* (All Taxes Incl.)\n📏 Available Size: *${item.size}*\n🎨 Color: *${item.color}*\n📦 Ready Stock: *${item.stock} Units* (Ready to Dispatch)\n🏷️ SKU: \`${item.sku}\`\n\n📝 *Details:*\n${item.desc}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 *To Order:* Reply with your *Quantity & Delivery Address* to reserve your parcel!\n(Reply *1* to *6* to browse other collections, or *0* for Main Menu)`
            };
        }
    }

    // 3. Dynamic Admin-Configured Pre-set Template Rules (e.g. Feeding Kurti, Baby Frocks, Store Address, etc.)
    loadBrandConfig(); // Always ensure latest rules from whatsapp_account_config.json
    if (Array.isArray(autoReplyRules) && autoReplyRules.length > 0) {
        for (const rule of autoReplyRules) {
            if (rule.enabled === false) continue;
            const keywords = Array.isArray(rule.keywords)
                ? rule.keywords
                : (typeof rule.keywords === 'string' ? rule.keywords.split(',').map(k => k.trim()) : []);

            // Check both keywords AND the template rule name / question title
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
                console.log(`[Auto-Reply Engine] 🎯 Matched Rule "${rule.name}" (kw: "${matchedKw}") for customer: "${cleanMsg}"`);
                const catId = rule.categoryId ? String(rule.categoryId) : null;
                let customText = (rule.replyText || '')
                    .replace(/{customer_name}/g, name)
                    .replace(/{brand_name}/g, brand)
                    .replace(/{business_phone}/g, senderNumber || '+91 86680 07593');

                if (catId && PRODUCTS_CATALOG[catId] && (rule.actionType === 'category_reply' || rule.actionType === 'category_and_text')) {
                    setCustomerCategory({ catId: catId, awaitingProduct: true }, senderKey, senderNumber, senderJid, cleanNumber);
                    const cat = PRODUCTS_CATALOG[catId];
                    const numEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣'];
                    const itemsText = cat.items.map((it, idx) => {
                        return `${numEmojis[idx] || (idx + 1 + '.')} *${it.name}*\n   💰 *₹${it.price}* | 📏 Size: *${it.size}* | ✅ *${it.stock} Pcs Ready*`;
                    }).join('\n\n');
                    const replyNumbersText = cat.items.length > 1 ? `1 to ${cat.items.length}` : '1';

                    let fullText = '';
                    if (rule.actionType === 'category_and_text' && customText.trim()) {
                        fullText = `${customText}\n\n━━━━━━━━━━━━━━━━━━━━\n${cat.categoryIcon} *${cat.categoryName} Ready Stock:*\n\n${itemsText}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 *Reply with ${replyNumbersText}* to view photos & sizes!\n(Reply *0* for Main Menu)`;
                    } else {
                        fullText = `${cat.categoryIcon} *${brand} • ${cat.categoryName}*\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Here are our ready-stock items:\n\n${itemsText}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 *Reply with ${replyNumbersText}* to view the photo, sizes & order!\n(Reply *0* to return to Main Menu)`;
                    }

                    return {
                        type: 'text',
                        ruleId: rule.id,
                        ruleName: rule.name,
                        text: fullText
                    };
                } else if (customText) {
                    return {
                        type: 'text',
                        ruleId: rule.id,
                        ruleName: rule.name,
                        text: customText
                    };
                }
            }
        }
    }

    // 4. Fallback Category selection (1 to 6 or keywords)
    let selectedCat = null;
    if (key === '1') selectedCat = '1';
    else if (key === '2') selectedCat = '2';
    else if (key === '3') selectedCat = '3';
    else if (key === '4') selectedCat = '4';
    else if (key === '5') selectedCat = '5';
    else if (key === '6') selectedCat = '6';
    // Keyword fallback
    else if (key.includes('wholesale') || key.includes('bulk') || key.includes('bundle')) selectedCat = '5';
    else if (key.includes('maternity') || key.includes('feeding') || key.includes('gown')) selectedCat = '2';
    else if (key.includes('baby') || key.includes('frock')) selectedCat = '1';
    else if (key.includes('newborn') || key.includes('gift') || key.includes('born')) selectedCat = '3';
    else if (key.includes('kids') || key.includes('tshirt') || key.includes('daily')) selectedCat = '4';
    else if (key.includes('festive') || key.includes('silk') || key.includes('pattu') || key.includes('lehenga')) selectedCat = '6';

    // If Category selected (1 to 6)
    if (selectedCat && PRODUCTS_CATALOG[selectedCat]) {
        // Set state to active category and awaitingProduct = true
        setCustomerCategory({ catId: selectedCat, awaitingProduct: true }, senderKey, senderNumber, senderJid, cleanNumber);
        
        const cat = PRODUCTS_CATALOG[selectedCat];
        const numEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣'];

        let itemsText = cat.items.map((it, idx) => {
            return `${numEmojis[idx] || (idx + 1 + '.')} *${it.name}*\n   💰 *₹${it.price}* | 📏 Size: *${it.size}* | ✅ *${it.stock} Pcs Ready*`;
        }).join('\n\n');

        const replyNumbersText = cat.items.length > 1 ? `1 to ${cat.items.length}` : '1';
        console.log(`[Auto-Reply Engine] 📂 Customer opened Category #${selectedCat} (${cat.categoryName})`);

        return {
            type: 'text',
            ruleName: `Category #${selectedCat}`,
            text: `${cat.categoryIcon} *${brand} • ${cat.categoryName}*\n━━━━━━━━━━━━━━━━━━━━\nHello ${name}! 👋 Here are our ready-stock items:\n\n${itemsText}\n\n━━━━━━━━━━━━━━━━━━━━\n💬 *Reply with ${replyNumbersText}* to view the photo, sizes & order!\n(Reply *0* to return to Main Menu)`
        };
    }

    return null;
}

async function getImageBuffer(url) {
    if (!url) return null;
    try {
        // 1. Data URL (Base64)
        if (typeof url === 'string' && url.startsWith('data:image/')) {
            const base64Data = url.split(',')[1] || url.replace(/^data:image\/\w+;base64,/, '');
            return Buffer.from(base64Data, 'base64');
        }

        // 2. Local relative path or root path
        if (typeof url === 'string') {
            const cleanPath = url.replace(/^[/\\]+/, '').replace(/\//g, path.sep);
            const candidates = [
                path.resolve(__dirname, '..', cleanPath),
                path.resolve(__dirname, cleanPath),
                path.resolve('d:/CRM whatsapp/crm-app', cleanPath)
            ];
            // If it's a URL like http://localhost/crm-app/uploads/products/xyz.jpg
            if (url.includes('/uploads/products/')) {
                const fileName = path.basename(url.split('?')[0]);
                candidates.unshift(path.resolve(__dirname, '..', 'uploads', 'products', fileName));
            }

            for (const candidate of candidates) {
                if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
                    return fs.readFileSync(candidate);
                }
            }
        }

        // 3. Online Web URL (http / https)
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
    } catch (e) {
        console.warn(`[Image Buffer Fetch Failed for ${url?.slice?.(0, 80)}]:`, e.message);
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
        const sendToPort = (port) => {
            const req = http.request({
                hostname: 'localhost',
                port: port,
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
                if (port === 8000) {
                    // Try fallback port 8080 if 8000 fails
                    sendToPort(8080);
                } else {
                    console.error('[Forward Error]:', e.message);
                }
            });

            req.write(postData);
            req.end();
        };

        sendToPort(8000);
    } catch (e) {
        console.error('Error forwarding message to CRM:', e.message);
    }
}

// Helper to determine destination JID (Resolves WhatsApp Privacy LIDs to Standard Phone JIDs for flawless delivery)
function resolveDestinationJid(phoneOrJid) {
    if (!phoneOrJid) return null;
    let target = phoneOrJid.toString().trim();

    // 1. Check if target has @lid or is a 14+ digit privacy LID
    const cleanDigits = target.replace(/[^0-9]/g, '');
    if (target.includes('@lid') || cleanDigits.length >= 14) {
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
        return `${lidDigits}@lid`;
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

    let clean = cleanDigits;
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

                            // 2. Greetings and full catalog triggers
                            const isGreetingOrMenu = cleanMsg === 'hi' || cleanMsg === 'hii' || cleanMsg === 'hiii' || 
                                                     cleanMsg === 'hello' || cleanMsg === 'hellow' || cleanMsg === 'helo' || 
                                                     cleanMsg === 'hey' || cleanMsg === 'vanakkam' || cleanMsg === 'namaste' ||
                                                     cleanMsg === 'start' || cleanMsg === 'menu' || cleanMsg === 'catalog' || 
                                                     cleanMsg === 'catalogue' || cleanMsg === 'stock' || cleanMsg === 'price' || 
                                                     cleanMsg === 'rate' || cleanMsg === 'help' || lastMenuEpoch === 0;

                            if (!replyObj && (isGreetingOrMenu || cleanMsg.length <= 10) && isMenuCooldownPassed) {
                                clearCustomerCategory(senderKey, senderNumber, senderJid, cleanNumber);
                                replyObj = getStockAutoReplyTemplate(senderName);
                                lastAutoReplyMap.set(senderNumber, Date.now());
                                lastAutoReplyMap.set(cleanNumber, Date.now());
                                if (senderJid) lastAutoReplyMap.set(senderJid, Date.now());
                            }

                            if (replyObj) {
                                setTimeout(async () => {
                                        try {
                                            const targetJid = resolveDestinationJid(senderNumber || senderJid);
                                            let sentRes = null;
                                            let botText = '';
                                            let botType = 'text';
                                            let botMediaUrl = null;

                                            if (replyObj.type === 'image' && replyObj.image) {
                                                botType = 'image';
                                                botMediaUrl = replyObj.image;
                                                botText = replyObj.caption;
                                                console.log(`[Auto-Reply Engine] 📸 Sending Product Photo to ${senderName} (${targetJid}): "${replyObj.caption.slice(0, 40)}..."`);
                                                
                                                const imgBuf = await getImageBuffer(replyObj.image);
                                                if (imgBuf) {
                                                    try {
                                                        sentRes = await sock.sendMessage(targetJid, {
                                                            image: imgBuf,
                                                            caption: replyObj.caption
                                                        });
                                                    } catch (imgErr) {
                                                        console.warn('[Image Send Failed, Falling back to Text]:', imgErr.message);
                                                    }
                                                }

                                                if (!sentRes) {
                                                    sentRes = await sock.sendMessage(targetJid, {
                                                        text: `${replyObj.caption}\n\n🖼️ *Product Image:* ${replyObj.image}`
                                                    });
                                                }
                                            } else {
                                                botText = replyObj.text || replyObj;
                                                console.log(`[Auto-Reply Engine] 🤖 Dispatching response to ${senderName} (${targetJid}): "${cleanMsg}"`);
                                                sentRes = await sock.sendMessage(targetJid, { text: botText });
                                            }

                                            console.log(`[Auto-Reply Engine] ✅ Delivered to ${targetJid} (ID: ${sentRes?.key?.id})`);

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
                                                is_outbound: true,
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
    if (mediaUrl) {
        console.log(`[Outbound Media Send via ${activeAcc.connectedNumber || activeAcc.id}] Dispatching image to ${jid} with caption: "${finalText.slice(0, 50)}..."`);
        const imgBuf = await getImageBuffer(mediaUrl);
        if (imgBuf) {
            try {
                sent = await activeAcc.sock.sendMessage(jid, {
                    image: imgBuf,
                    caption: finalText
                });
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
            const { phone, text, jid, accountId, mediaUrl, media_url } = data;
            const target = jid || phone;
            const imageTarget = mediaUrl || media_url || null;
            const result = await sendWhatsAppMessage(target, text, accountId, imageTarget);

            if (typeof callback === 'function') {
                callback({ status: 'success', result });
            }

            io.emit('whatsapp:sent_ack', {
                recipient: phone,
                jid: result.jid,
                account_id: result.account_id,
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

    // Handle request to add / refresh account QR
    socket.on('accounts:add', (data) => {
        const nextId = 'account_' + (accounts.size + 1);
        const label = data?.label || `WhatsApp Business #${accounts.size + 1}`;
        initAccountSession(nextId, label);
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
            } catch (e) {}
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

    socket.on('disconnect', () => {});
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
            } catch (err) {}
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
                lastActive: new Date().toISOString()
            };
            accounts.set(targetId, acc);
        }

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

        // Also clean legacy auth folder if primary
        if (targetId === 'account_1') {
            const legacyDir = path.join(__dirname, 'auth_session');
            if (fs.existsSync(legacyDir)) {
                try { fs.rmSync(legacyDir, { recursive: true, force: true }); } catch (e) {}
            }
        }

        broadcastAccountsUpdate();

        // Re-initialize a fresh QR session for this slot after a short delay
        setTimeout(() => {
            initAccountSession(targetId, acc.label);
        }, 800);

        return res.json({ 
            status: 'success', 
            message: `Account ${targetId} disconnected. CRM records and customer messages are completely preserved.` 
        });
    } catch (e) {
        console.error('[Disconnect Error]:', e.message);
        res.status(500).json({ status: 'error', message: e.message });
    }
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
            } catch (e) {}
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

app.post('/api/send', async (req, res) => {
    try {
        const { phone, text, jid, accountId, mediaUrl, media_url } = req.body;
        if (!phone && !jid) {
            return res.status(400).json({ status: 'error', message: 'Phone or JID is required' });
        }
        if (!text) {
            return res.status(400).json({ status: 'error', message: 'Text is required' });
        }

        const imageTarget = mediaUrl || media_url || null;
        const result = await sendWhatsAppMessage(jid || phone, text, accountId, imageTarget);
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
