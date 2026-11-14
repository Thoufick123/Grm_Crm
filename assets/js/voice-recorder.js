/**
 * GRM WHATSAPP CRM — DUAL-STREAM IN-BROWSER AUDIO RECORDER
 * 
 * Mixes Staff Mic + Customer Remote Audio into a single synchronized stream
 * and uploads resilient chunk slices to Node.js backend every 6 seconds.
 */

class CrmVoiceRecorder {
  constructor(options = {}) {
    this.callId = options.callId || null;
    this.roomToken = options.roomToken || null;
    this.bridgeUrl = options.bridgeUrl || (window.BRIDGE_URL || 'http://localhost:3000');
    
    this.audioContext = null;
    this.mixerDestination = null;
    this.staffSourceNode = null;
    this.customerSourceNode = null;
    this.mediaRecorder = null;
    
    this.isRecording = false;
    this.chunkIndex = 0;
    this.recordedBytesTotal = 0;
    this.uploadQueue = [];
    this.isUploading = false;
    this.recordingStartTime = null;
  }

  /**
   * Initializes audio mixing graph and starts chunked recorder
   * @param {MediaStream} staffStream 
   * @param {MediaStream} customerStream 
   */
  start(staffStream, customerStream) {
    if (this.isRecording) return;

    try {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtxClass();
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      this.mixerDestination = this.audioContext.createMediaStreamDestination();

      // Connect staff mic to mixer destination
      if (staffStream && staffStream.getAudioTracks().length > 0) {
        this.staffSourceNode = this.audioContext.createMediaStreamSource(staffStream);
        this.staffSourceNode.connect(this.mixerDestination);
      }

      // Connect customer remote stream to mixer destination
      if (customerStream && customerStream.getAudioTracks().length > 0) {
        this.customerSourceNode = this.audioContext.createMediaStreamSource(customerStream);
        this.customerSourceNode.connect(this.mixerDestination);
      }

      // Determine best audio mime type supported by browser
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
        else if (MediaRecorder.isTypeSupported('audio/mp4')) mimeType = 'audio/mp4';
        else if (MediaRecorder.isTypeSupported('audio/ogg')) mimeType = 'audio/ogg';
        else mimeType = '';
      }

      const recorderOptions = mimeType ? { mimeType } : {};
      this.mediaRecorder = new MediaRecorder(this.mixerDestination.stream, recorderOptions);

      this.mediaRecorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          this.queueChunkUpload(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        console.log(`🎙️ [Voice Recorder] MediaRecorder stopped. Total chunks queued: ${this.chunkIndex}`);
      };

      // Emit chunk every 6 seconds (6000ms)
      this.mediaRecorder.start(6000);
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      console.log(`🎙️ [Voice Recorder] Active dual-stream recording started for call: ${this.callId} (Format: ${mimeType || 'default'})`);
    } catch (err) {
      console.error('❌ [Voice Recorder] Failed to start recorder:', err);
    }
  }

  /**
   * Enqueues chunk for resilient sequential upload
   */
  queueChunkUpload(blob) {
    const currentIndex = this.chunkIndex++;
    this.recordedBytesTotal += blob.size;

    this.uploadQueue.push({ index: currentIndex, blob });
    this.processUploadQueue();
  }

  /**
   * Processes queued chunks in sequence
   */
  async processUploadQueue() {
    if (this.isUploading || this.uploadQueue.length === 0) return;
    this.isUploading = true;

    while (this.uploadQueue.length > 0) {
      const item = this.uploadQueue.shift();
      try {
        const base64Data = await this.blobToBase64(item.blob);
        const endpoint = `${this.bridgeUrl.replace(/\/+$/, '')}/api/voice/upload-chunk`;

        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            call_id: this.callId,
            room_token: this.roomToken,
            chunk_index: item.index,
            audio_data: base64Data
          })
        });

        console.log(`📤 [Voice Recorder] Chunk #${item.index} uploaded (${item.blob.size} bytes)`);
      } catch (err) {
        console.warn(`⚠️ [Voice Recorder] Chunk #${item.index} upload failed, retrying once:`, err.message);
        // Put back to retry once
        this.uploadQueue.unshift(item);
        await new Promise(r => setTimeout(r, 1500));
        break;
      }
    }

    this.isUploading = false;
  }

  /**
   * Helper to convert Blob to Base64
   */
  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Stops recording, flushes last chunk, and triggers server-side finalization
   */
  async stopAndFinalize(durationSeconds = 0) {
    if (!this.isRecording) return null;
    this.isRecording = false;

    try {
      if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
        this.mediaRecorder.stop();
      }

      // Close audio context
      if (this.audioContext && this.audioContext.state !== 'closed') {
        this.audioContext.close().catch(() => {});
      }

      // Wait 1.5s for final chunk upload to flush
      await new Promise(r => setTimeout(r, 1500));
      await this.processUploadQueue();

      const duration = durationSeconds || Math.round((Date.now() - (this.recordingStartTime || Date.now())) / 1000);
      const finalizeUrl = `${this.bridgeUrl.replace(/\/+$/, '')}/api/voice/finalize-recording`;

      console.log(`🏁 [Voice Recorder] Finalizing recording on backend for call ${this.callId}...`);
      const resp = await fetch(finalizeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          call_id: this.callId,
          room_token: this.roomToken,
          duration_seconds: duration
        })
      });

      const resData = await resp.json();
      console.log('✅ [Voice Recorder] Finalization result:', resData);
      return resData;
    } catch (err) {
      console.error('❌ [Voice Recorder] Finalization error:', err);
      return null;
    }
  }
}

// Export to window
window.CrmVoiceRecorder = CrmVoiceRecorder;

