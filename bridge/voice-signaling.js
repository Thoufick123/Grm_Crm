/**
 * GRM WHATSAPP CRM — WEBRTC VOICE SIGNALING & AUDIO RECORDING ENGINE
 * 
 * Responsibilities:
 *  1. Socket.IO WebRTC Signaling (Offer, Answer, ICE Candidates, Mute State, Room Management)
 *  2. REST Endpoints for Chunked Audio Uploads & WebM Finalization
 *  3. Seamless integration with PHP MySQL Call Persistence
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// In-Memory WebRTC Voice Rooms Tracker
const VOICE_ROOMS = new Map();

/**
 * Initializes Voice Signaling & Audio Ingestion Engine
 * @param {Object} options
 * @param {Express.Application} options.app
 * @param {SocketIO.Server} options.io
 * @param {Function} options.callCrmApi
 */
function initVoiceSignaling({ app, io, callCrmApi }) {
    console.log('🎙️ [Voice Engine] Initializing WebRTC Voice Signaling & Recording Module...');

    // Resolve base storage paths (root CRM / storage)
    const CRM_ROOT = path.resolve(__dirname, '..');
    const STORAGE_BASE = path.join(CRM_ROOT, 'storage', 'call-recordings');
    const TEMP_STORAGE = path.join(STORAGE_BASE, 'temp');

    if (!fs.existsSync(STORAGE_BASE)) fs.mkdirSync(STORAGE_BASE, { recursive: true });
    if (!fs.existsSync(TEMP_STORAGE)) fs.mkdirSync(TEMP_STORAGE, { recursive: true });

    // -------------------------------------------------------------------------
    // 1. REST API ENDPOINTS FOR CHUNKED RECORDING & ROOM STATUS
    // -------------------------------------------------------------------------

    // Status / Health Check
    app.get('/api/voice/status', (req, res) => {
        res.json({
            status: 'online',
            engine: 'WebRTC Dual-Stream Self-Hosted Signaling',
            active_rooms_count: VOICE_ROOMS.size,
            active_rooms: Array.from(VOICE_ROOMS.entries()).map(([token, room]) => ({
                room_token: token,
                call_id: room.callId,
                status: room.status,
                staff: room.staffInfo?.name || null,
                customer: room.customerInfo?.name || null,
                chunks_received: room.chunksCount || 0
            }))
        });
    });

    // Room Status Inspection
    app.get('/api/voice/room-status/:token', (req, res) => {
        const token = req.params.token;
        const room = VOICE_ROOMS.get(token);
        if (!room) {
            return res.status(404).json({ status: 'error', message: 'Voice room not found or expired' });
        }
        res.json({
            status: 'success',
            room_token: token,
            call_id: room.callId,
            room_status: room.status,
            customer_connected: Boolean(room.customerSocketId),
            staff_connected: Boolean(room.staffSocketId),
            customer_name: room.customerInfo?.name || 'Customer',
            staff_name: room.staffInfo?.name || 'Support Staff',
            started_at: room.startedAt,
            connected_at: room.connectedAt
        });
    });

    // Chunk Upload Endpoint (Saves audio slices continuously)
    app.post('/api/voice/upload-chunk', async (req, res) => {
        try {
            const { call_id, room_token, chunk_index, audio_data, format } = req.body;

            if (!call_id || audio_data === undefined || chunk_index === undefined) {
                return res.status(400).json({ status: 'error', message: 'call_id, chunk_index, and audio_data are required' });
            }

            const cleanCallId = String(call_id).replace(/[^a-zA-Z0-9_-]/g, '_');
            const callTempDir = path.join(TEMP_STORAGE, cleanCallId);
            if (!fs.existsSync(callTempDir)) {
                fs.mkdirSync(callTempDir, { recursive: true });
            }

            // Decode base64 audio data
            const base64Content = audio_data.includes(',') ? audio_data.split(',')[1] : audio_data;
            const buffer = Buffer.from(base64Content, 'base64');

            const paddedIdx = String(chunk_index).padStart(5, '0');
            const chunkPath = path.join(callTempDir, `chunk_${paddedIdx}.webm`);
            fs.writeFileSync(chunkPath, buffer);

            // Track chunk count in active room
            if (room_token && VOICE_ROOMS.has(room_token)) {
                const room = VOICE_ROOMS.get(room_token);
                room.chunksCount = (room.chunksCount || 0) + 1;
            }

            return res.json({
                status: 'success',
                message: `Chunk ${chunk_index} received`,
                chunk_index,
                bytes: buffer.length
            });
        } catch (err) {
            console.error('❌ [Voice Engine] Error storing audio chunk:', err.message);
            return res.status(500).json({ status: 'error', message: err.message });
        }
    });

    // Finalize Recording Endpoint (Combines chunks into single webm/mp3 archive & updates PHP MySQL)
    app.post('/api/voice/finalize-recording', async (req, res) => {
        try {
            const { call_id, room_token, duration_seconds } = req.body;
            if (!call_id) {
                return res.status(400).json({ status: 'error', message: 'call_id is required' });
            }

            const cleanCallId = String(call_id).replace(/[^a-zA-Z0-9_-]/g, '_');
            const callTempDir = path.join(TEMP_STORAGE, cleanCallId);

            const now = new Date();
            const yearStr = String(now.getFullYear());
            const monthStr = String(now.getMonth() + 1).padStart(2, '0');
            const finalDir = path.join(STORAGE_BASE, yearStr, monthStr, cleanCallId);
            if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

            const finalFilePath = path.join(finalDir, 'conversation.webm');
            let totalSizeBytes = 0;

            if (fs.existsSync(callTempDir)) {
                // Collect and sort all chunk files
                const files = fs.readdirSync(callTempDir)
                    .filter(f => f.startsWith('chunk_') && f.endsWith('.webm'))
                    .sort();

                if (files.length > 0) {
                    const writeStream = fs.createWriteStream(finalFilePath);
                    for (const f of files) {
                        const chunkData = fs.readFileSync(path.join(callTempDir, f));
                        writeStream.write(chunkData);
                        totalSizeBytes += chunkData.length;
                    }
                    writeStream.end();

                    // Clean up temp directory
                    try {
                        for (const f of files) {
                            fs.unlinkSync(path.join(callTempDir, f));
                        }
                        fs.rmdirSync(callTempDir);
                    } catch (e) {}
                }
            }

            // Relative storage path for CRM portability
            const relativeRef = `storage/call-recordings/${yearStr}/${monthStr}/${cleanCallId}/conversation.webm`;
            const duration = Math.max(1, parseInt(duration_seconds) || 0);

            // Persist to MySQL database via callCrmApi
            try {
                if (typeof callCrmApi === 'function') {
                    await callCrmApi('save_call_recording', {
                        call_id: call_id,
                        room_token: room_token || '',
                        recording_reference: relativeRef,
                        duration_seconds: duration,
                        file_size_bytes: totalSizeBytes,
                        audio_format: 'webm',
                        recording_source: 'STAFF_BROWSER_MIX'
                    });
                }
            } catch (apiErr) {
                console.warn('⚠️ [Voice Engine] Warning syncing recording to PHP MySQL:', apiErr.message);
            }

            // Notify all CRM clients via Socket.IO
            io.emit('voice:recording-ready', {
                call_id: call_id,
                room_token: room_token,
                recording_url: relativeRef,
                duration_seconds: duration,
                file_size_bytes: totalSizeBytes
            });

            console.log(`✅ [Voice Engine] Finalized recording for call ${call_id}: ${relativeRef} (${totalSizeBytes} bytes, ${duration}s)`);

            return res.json({
                status: 'success',
                message: 'Recording finalized and persisted',
                recording_url: relativeRef,
                duration_seconds: duration,
                file_size_bytes: totalSizeBytes
            });
        } catch (err) {
            console.error('❌ [Voice Engine] Error finalizing recording:', err.message);
            return res.status(500).json({ status: 'error', message: err.message });
        }
    });

    // Direct Stream Playback via Node
    app.get('/api/voice/recording/:callId', (req, res) => {
        const cleanCallId = String(req.params.callId).replace(/[^a-zA-Z0-9_-]/g, '_');
        // Search in current or past folders
        function findRecordingFile(dir) {
            if (!fs.existsSync(dir)) return null;
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    if (entry.name === cleanCallId) {
                        const cand = path.join(fullPath, 'conversation.webm');
                        if (fs.existsSync(cand)) return cand;
                    }
                    const resCand = findRecordingFile(fullPath);
                    if (resCand) return resCand;
                }
            }
            return null;
        }

        const foundPath = findRecordingFile(STORAGE_BASE);
        if (!foundPath) {
            return res.status(404).json({ status: 'error', message: 'Recording not found' });
        }

        res.setHeader('Content-Type', 'audio/webm');
        const stream = fs.createReadStream(foundPath);
        stream.pipe(res);
    });

    // -------------------------------------------------------------------------
    // 2. SOCKET.IO REALTIME WEBRTC SIGNALING HANDLERS
    // -------------------------------------------------------------------------

    io.on('connection', (socket) => {
        // Staff or Customer joins a voice room
        socket.on('voice:join', (data) => {
            const { room_token, role, call_id, staff_name, staff_id, customer_name, customer_phone } = data || {};
            if (!room_token) {
                return socket.emit('voice:error', { message: 'room_token is required' });
            }

            let room = VOICE_ROOMS.get(room_token);
            if (!room) {
                room = {
                    roomToken: room_token,
                    callId: call_id || ('CALL-' + Date.now()),
                    status: 'WAITING',
                    customerSocketId: null,
                    staffSocketId: null,
                    customerInfo: {},
                    staffInfo: {},
                    startedAt: new Date().toISOString(),
                    connectedAt: null,
                    chunksCount: 0
                };
                VOICE_ROOMS.set(room_token, room);
            }

            socket.join(`voice_room_${room_token}`);
            socket.data.roomToken = room_token;
            socket.data.voiceRole = role;

            if (role === 'staff') {
                room.staffSocketId = socket.id;
                room.staffInfo = {
                    id: staff_id || 'staff_01',
                    name: staff_name || 'Support Staff'
                };
                console.log(`🎙️ [Voice Signaling] Staff joined room: ${room_token} (${room.staffInfo.name})`);

                // Inform customer if already present
                if (room.customerSocketId) {
                    room.status = 'READY';
                    io.to(room.customerSocketId).emit('voice:staff-connected', {
                        staff_name: room.staffInfo.name,
                        room_token: room_token
                    });
                    socket.emit('voice:customer-ready', {
                        customer_name: room.customerInfo.name || 'Customer',
                        room_token: room_token
                    });
                } else {
                    socket.emit('voice:waiting-for-peer', { role: 'customer' });
                }
            } else if (role === 'customer') {
                room.customerSocketId = socket.id;
                room.customerInfo = {
                    name: customer_name || 'Customer',
                    phone: customer_phone || ''
                };
                console.log(`🎙️ [Voice Signaling] Customer joined room: ${room_token} (${room.customerInfo.name})`);

                // Inform staff if already present
                if (room.staffSocketId) {
                    room.status = 'READY';
                    io.to(room.staffSocketId).emit('voice:customer-connected', {
                        customer_name: room.customerInfo.name,
                        customer_phone: room.customerInfo.phone,
                        room_token: room_token
                    });
                    socket.emit('voice:staff-ready', {
                        staff_name: room.staffInfo.name || 'Support Specialist',
                        room_token: room_token
                    });
                } else {
                    socket.emit('voice:waiting-for-peer', { role: 'staff' });
                }
            }
        });

        // WebRTC Offer Relay (Staff -> Customer)
        socket.on('voice:offer', (payload) => {
            const { room_token, sdp } = payload || {};
            const room = VOICE_ROOMS.get(room_token);
            if (room && room.customerSocketId) {
                console.log(`📡 [Voice Signaling] Forwarding SDP Offer in room ${room_token}`);
                io.to(room.customerSocketId).emit('voice:offer', { sdp, room_token });
            }
        });

        // WebRTC Answer Relay (Customer -> Staff)
        socket.on('voice:answer', (payload) => {
            const { room_token, sdp } = payload || {};
            const room = VOICE_ROOMS.get(room_token);
            if (room && room.staffSocketId) {
                console.log(`📡 [Voice Signaling] Forwarding SDP Answer in room ${room_token}`);
                room.status = 'CONNECTED';
                room.connectedAt = new Date().toISOString();
                io.to(room.staffSocketId).emit('voice:answer', { sdp, room_token });
            }
        });

        // ICE Candidate Exchange
        socket.on('voice:ice-candidate', (payload) => {
            const { room_token, candidate } = payload || {};
            const room = VOICE_ROOMS.get(room_token);
            if (!room) return;

            if (socket.id === room.staffSocketId && room.customerSocketId) {
                io.to(room.customerSocketId).emit('voice:ice-candidate', { candidate });
            } else if (socket.id === room.customerSocketId && room.staffSocketId) {
                io.to(room.staffSocketId).emit('voice:ice-candidate', { candidate });
            }
        });

        // Mute / Hold Synchronized State
        socket.on('voice:mute-state', (payload) => {
            const { room_token, is_muted, is_hold } = payload || {};
            socket.to(`voice_room_${room_token}`).emit('voice:peer-mute-state', {
                is_muted: Boolean(is_muted),
                is_hold: Boolean(is_hold)
            });
        });

        // Call Hangup / Termination
        socket.on('voice:hangup', (payload) => {
            const { room_token, reason } = payload || {};
            const room = VOICE_ROOMS.get(room_token);
            if (!room) return;

            console.log(`📴 [Voice Signaling] Call hangup received for room ${room_token} (Reason: ${reason || 'User ended'})`);
            room.status = 'ENDED';

            io.to(`voice_room_${room_token}`).emit('voice:call-ended', {
                room_token,
                reason: reason || 'Call ended by participant'
            });

            // Clean up room after short grace window
            setTimeout(() => {
                VOICE_ROOMS.delete(room_token);
            }, 60000);
        });

        // Socket Disconnect
        socket.on('disconnect', () => {
            const roomToken = socket.data.roomToken;
            const role = socket.data.voiceRole;
            if (roomToken && VOICE_ROOMS.has(roomToken)) {
                const room = VOICE_ROOMS.get(roomToken);
                if (role === 'customer' && socket.id === room.customerSocketId) {
                    room.customerSocketId = null;
                    if (room.staffSocketId) {
                        io.to(room.staffSocketId).emit('voice:peer-disconnected', { role: 'customer' });
                    }
                } else if (role === 'staff' && socket.id === room.staffSocketId) {
                    room.staffSocketId = null;
                    if (room.customerSocketId) {
                        io.to(room.customerSocketId).emit('voice:peer-disconnected', { role: 'staff' });
                    }
                }
            }
        });
    });

    console.log('✅ [Voice Engine] WebRTC Voice Signaling & Recording Module Ready.');
}

/**
 * Creates a unique cryptographically secure room token
 */
function generateVoiceRoomToken() {
    return 'vrm_' + crypto.randomBytes(16).toString('hex');
}

module.exports = {
    initVoiceSignaling,
    generateVoiceRoomToken,
    VOICE_ROOMS
};

