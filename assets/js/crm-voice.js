/**
 * GRM WHATSAPP CRM — STAFF WEBRTC VOICE CONTROLLER
 * 
 * Manages live peer-to-peer WebRTC voice session inside CRM Softphone HUD,
 * ICE negotiation, bidirectional signaling, and automatic dual-stream recording.
 */

class CrmStaffVoiceClient {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.remoteAudioElement = null;
    this.recorder = null;
    
    this.activeCallId = null;
    this.activeRoomToken = null;
    this.isConnected = false;
    this.isMuted = false;
    
    this.iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun.services.mozilla.com' }
    ];

    this.setupRemoteAudio();
    this.bindSocketEvents();
  }

  setupRemoteAudio() {
    if (!this.remoteAudioElement) {
      this.remoteAudioElement = document.createElement('audio');
      this.remoteAudioElement.id = 'crm-remote-voice-audio';
      this.remoteAudioElement.autoplay = true;
      this.remoteAudioElement.playsInline = true;
      this.remoteAudioElement.style.display = 'none';
      document.body.appendChild(this.remoteAudioElement);
    }
  }

  getSocket() {
    return (typeof SOCKET_IO !== 'undefined' && SOCKET_IO) ? SOCKET_IO : (window.SOCKET_IO || null);
  }

  bindSocketEvents() {
    const socket = this.getSocket();
    if (!socket) {
      setTimeout(() => this.bindSocketEvents(), 1000);
      return;
    }

    // Customer Joined Room -> Create Offer
    socket.on('voice:customer-connected', async (data) => {
      console.log('👤 [Staff Voice] Customer connected to room:', data);
      this.updateHudStatus('● Customer Online • Live Voice Active', 'emerald');
      const streamStatus = document.getElementById('call-audio-stream-status');
      if (streamStatus) streamStatus.innerText = '● Customer Connected • Two-Way Live Voice Active';
      await this.createAndSendOffer();
    });

    socket.on('voice:customer-ready', async (data) => {
      console.log('👤 [Staff Voice] Customer is ready:', data);
      this.updateHudStatus('● Customer Online • Live Voice Active', 'emerald');
      const streamStatus = document.getElementById('call-audio-stream-status');
      if (streamStatus) streamStatus.innerText = '● Customer Connected • Two-Way Live Voice Active';
      await this.createAndSendOffer();
    });

    // Receive Answer from Customer
    socket.on('voice:answer', async (payload) => {
      if (!this.peerConnection || !payload.sdp) return;
      console.log('📡 [Staff Voice] Received WebRTC Answer from customer');
      try {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(payload.sdp));
        this.isConnected = true;
        this.updateHudStatus('Voice Connected (Encrypted)', 'emerald');
      } catch (err) {
        console.error('❌ [Staff Voice] Error setting remote description:', err);
      }
    });

    // ICE Candidate from Customer
    socket.on('voice:ice-candidate', async (payload) => {
      if (!this.peerConnection || !payload.candidate) return;
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err) {
        console.warn('⚠️ [Staff Voice] Error adding ICE candidate:', err);
      }
    });

    // Customer Mute / Hold State
    socket.on('voice:peer-mute-state', (payload) => {
      const banner = document.getElementById('call-peer-status-note');
      if (banner) {
        banner.innerText = payload.is_muted ? 'Customer has muted their microphone' : '';
        banner.style.display = payload.is_muted ? 'block' : 'none';
      }
    });

    // Customer Disconnect or Hangup
    socket.on('voice:peer-disconnected', (payload) => {
      console.log('⚠️ [Staff Voice] Peer disconnected:', payload);
      this.updateHudStatus('Customer Disconnected / Poor Network', 'amber');
    });

    socket.on('voice:call-ended', (payload) => {
      console.log('📴 [Staff Voice] Customer ended the call');
      this.updateHudStatus('Call Ended by Customer', 'slate');
      if (typeof hangupActiveCall === 'function') {
        hangupActiveCall();
      }
    });
  }

  /**
   * Initializes staff voice connection and joins signaling room
   */
  async startCall(callId, roomToken, customer = {}) {
    this.activeCallId = callId;
    this.activeRoomToken = roomToken || ('vrm_' + Date.now());
    const socket = this.getSocket();

    try {
      this.updateHudStatus('Requesting Microphone Access...', 'indigo');

      // 1. Get staff microphone
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });

      console.log('🎙️ [Staff Voice] Staff microphone stream captured successfully');

      // 2. Initialize RTCPeerConnection
      this.peerConnection = new RTCPeerConnection({
        iceServers: this.iceServers
      });

      // 3. Attach local audio tracks
      this.localStream.getTracks().forEach(track => {
        this.peerConnection.addTrack(track, this.localStream);
      });

      // 4. Handle remote customer audio track
      this.peerConnection.ontrack = (event) => {
        console.log('🔊 [Staff Voice] Customer audio track received:', event.streams[0]);
        this.remoteStream = event.streams[0];
        if (this.remoteAudioElement) {
          this.remoteAudioElement.srcObject = this.remoteStream;
          this.remoteAudioElement.play().catch(e => console.warn('Audio play autoplay policy:', e));
        }

        // Initialize dual-stream recording mixer
        this.startRecordingSession();
      };

      // 5. ICE Candidate exchange
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('voice:ice-candidate', {
            room_token: this.activeRoomToken,
            candidate: event.candidate
          });
        }
      };

      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection.connectionState;
        console.log(`📡 [Staff Voice] WebRTC Connection State: ${state}`);
        if (state === 'connected') {
          this.isConnected = true;
          this.updateHudStatus('Voice Connected • Live HD Audio', 'emerald');
        } else if (state === 'disconnected' || state === 'failed') {
          this.updateHudStatus('Call Interrupted / Reconnecting...', 'amber');
        }
      };

      // 6. Join Signaling Room
      const user = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
      if (socket) {
        socket.emit('voice:join', {
          room_token: this.activeRoomToken,
          role: 'staff',
          call_id: this.activeCallId,
          staff_id: user?.id || user?.staff_id || 'staff_01',
          staff_name: user?.name || 'Support Staff',
          customer_name: customer?.name || 'Customer',
          customer_phone: customer?.phone || ''
        });
      }

      this.updateHudStatus('Waiting for Customer to Join...', 'blue');
    } catch (err) {
      console.error('❌ [Staff Voice] Failed to start voice session:', err);
      this.updateHudStatus('Microphone Access Denied', 'rose');
      if (typeof showToast === 'function') {
        showToast('Microphone Error', 'Please enable microphone access in your browser settings.', 'mic_off', 'rose');
      }
    }
  }

  async createAndSendOffer() {
    if (!this.peerConnection) return;
    try {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await this.peerConnection.setLocalDescription(offer);

      const socket = this.getSocket();
      if (socket) {
        socket.emit('voice:offer', {
          room_token: this.activeRoomToken,
          sdp: offer
        });
        console.log('📡 [Staff Voice] SDP Offer sent to customer');
      }
    } catch (err) {
      console.error('❌ [Staff Voice] Error creating SDP offer:', err);
    }
  }

  startRecordingSession() {
    if (this.recorder) return;
    try {
      this.recorder = new CrmVoiceRecorder({
        callId: this.activeCallId,
        roomToken: this.activeRoomToken,
        bridgeUrl: window.BRIDGE_URL || 'http://localhost:3000'
      });
      this.recorder.start(this.localStream, this.remoteStream);
      this.showRecordingIndicator(true);
    } catch (err) {
      console.warn('⚠️ [Staff Voice] Error starting recorder:', err);
    }
  }

  setMute(isMuted) {
    this.isMuted = isMuted;
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
    const socket = this.getSocket();
    if (socket && this.activeRoomToken) {
      socket.emit('voice:mute-state', {
        room_token: this.activeRoomToken,
        is_muted: isMuted
      });
    }
  }

  async endCall(durationSeconds = 0) {
    const socket = this.getSocket();
    if (socket && this.activeRoomToken) {
      socket.emit('voice:hangup', {
        room_token: this.activeRoomToken,
        reason: 'Staff ended call'
      });
    }

    // Stop and finalize recording
    if (this.recorder) {
      try {
        await this.recorder.stopAndFinalize(durationSeconds);
      } catch (e) {}
      this.recorder = null;
    }
    this.showRecordingIndicator(false);

    // Stop all local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(t => t.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    if (this.remoteAudioElement) {
      this.remoteAudioElement.srcObject = null;
    }

    this.isConnected = false;
    this.activeCallId = null;
    this.activeRoomToken = null;
    console.log('🏁 [Staff Voice] WebRTC voice session terminated cleanly.');
  }

  updateHudStatus(text, colorName = 'slate') {
    const label = document.getElementById('call-status-label');
    if (label) {
      label.innerText = text;
      label.className = `text-xs font-bold text-${colorName}-600 flex items-center gap-1.5`;
    }
  }

  showRecordingIndicator(show = true) {
    const recDot = document.getElementById('call-recording-live-indicator');
    if (recDot) {
      recDot.style.display = show ? 'inline-flex' : 'none';
    }
  }
}

// Global Singleton Instance
window.CRM_STAFF_VOICE = new CrmStaffVoiceClient();

