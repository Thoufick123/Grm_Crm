<?php
/**
 * Voice Translator - Process Voice Pipeline
 * STT -> Translation -> TTS voice synthesis across the 6 languages.
 */
require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/services/SpeechRecognitionService.php';
require_once dirname(__DIR__) . '/services/TranslationService.php';
require_once dirname(__DIR__) . '/services/TextToSpeechService.php';
require_once dirname(__DIR__) . '/services/AudioConversionService.php';

header('Content-Type: application/json');

try {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?: $_POST;

    $voiceMsgId = $input['voice_message_id'] ?? '';
    $targetLang = $input['target_lang'] ?? 'en';
    $clientHint = $input['client_transcription'] ?? '';

    $allowedLangs = ['ta', 'en', 'ml', 'kn', 'hi', 'te'];
    $cleanTarget = strtolower(trim(explode('-', $targetLang)[0]));
    if (!in_array($cleanTarget, $allowedLangs)) {
        $cleanTarget = 'ta';
    }

    $pdo = getDBConnection();
    $voiceMsg = null;
    if ($pdo && !empty($voiceMsgId)) {
        $stmt = $pdo->prepare("SELECT * FROM `voice_messages` WHERE `id` = ? LIMIT 1");
        $stmt->execute([$voiceMsgId]);
        $voiceMsg = $stmt->fetch(PDO::FETCH_ASSOC);
    }

    $originalPath = $voiceMsg['original_audio_path'] ?? ($input['audio_path'] ?? '');
    $fullOriginalPath = dirname(__DIR__) . '/' . ltrim($originalPath, '/\\');
    $sourceLang = $voiceMsg['source_language'] ?? ($input['source_lang'] ?? 'ta');

    if (!file_exists($fullOriginalPath)) {
        throw new Exception("Original audio file not found on server.");
    }

    $speechService = new SpeechRecognitionService();
    $transService = new TranslationService();
    $ttsService = new TextToSpeechService();
    $audioService = new AudioConversionService();

    // 1. STT: Transcribe Audio
    $sttResult = $speechService->transcribeAudio($fullOriginalPath, $sourceLang, $clientHint);
    $sourceText = $sttResult['text'];
    $detectedSource = $sttResult['language'] ?? $sourceLang;

    // 2. Machine Translation (strictly within the 6 languages)
    $translatedText = $transService->translateText($sourceText, $cleanTarget, $detectedSource);

    // 3. TTS: Voice Audio Generation
    $ttsResult = $ttsService->generateSpeech($translatedText, $cleanTarget);

    // Convert to native WhatsApp Opus OGG format for 100% PTT playback compatibility
    $extractedDuration = null;
    $oggFilePath = $audioService->convertToWhatsAppAudio($ttsResult['file_path'], $extractedDuration);
    if ($oggFilePath !== $ttsResult['file_path'] && file_exists($oggFilePath)) {
        $ttsResult['file_path'] = $oggFilePath;
        $ttsResult['relative_url'] = preg_replace('/\.[^.]+$/', '.ogg', $ttsResult['relative_url']);
        $ttsResult['format'] = 'ogg';
    }

    // Use duration captured during transcode or quick byte estimation (zero extra process latency)
    $transDuration = $extractedDuration ?: $audioService->estimateAudioDuration($ttsResult['file_path'], true);

    // 4. Save into voice_translations
    $translationId = 'vt_' . uniqid();
    if ($pdo) {
        $tStmt = $pdo->prepare("
            INSERT INTO `voice_translations`
            (`id`, `voice_message_id`, `translated_audio_path`, `audio_format`, `audio_duration`, `translation_status`, `intermediate_source_text`, `intermediate_translated_text`, `created_at`)
            VALUES (?, ?, ?, ?, ?, 'COMPLETED', ?, ?, NOW())
        ");
        $tStmt->execute([
            $translationId,
            $voiceMsgId,
            $ttsResult['relative_url'],
            $ttsResult['format'],
            $transDuration,
            $sourceText,
            $translatedText
        ]);

        if (!empty($voiceMsgId)) {
            $uStmt = $pdo->prepare("
                UPDATE `voice_messages` 
                SET `target_language` = ?, `processing_status` = 'preview_ready', `updated_at` = NOW()
                WHERE `id` = ?
            ");
            $uStmt->execute([$cleanTarget, $voiceMsgId]);
        }
    }

    echo json_encode([
        'success' => true,
        'voice_message_id' => $voiceMsgId,
        'translation_id' => $translationId,
        'original_audio_url' => $originalPath,
        'translated_audio_url' => $ttsResult['relative_url'],
        'duration' => $transDuration,
        'source_lang' => $detectedSource,
        'target_lang' => $cleanTarget
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
