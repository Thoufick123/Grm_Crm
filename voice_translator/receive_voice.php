<?php
/**
 * Voice Translator - Receive Inbound Voice Handler
 * Processes customer voice notes received via Meta Webhook or Baileys Bridge.
 */
require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/services/AudioConversionService.php';
require_once dirname(__DIR__) . '/services/SpeechRecognitionService.php';
require_once dirname(__DIR__) . '/services/TranslationService.php';
require_once dirname(__DIR__) . '/services/TextToSpeechService.php';

header('Content-Type: application/json');

try {
    $rawInput = file_get_contents('php://input');
    $payload = json_decode($rawInput, true) ?: $_POST;

    $customerId = $payload['customer_id'] ?? '';
    $phone = $payload['sender_phone'] ?? '';
    $mediaUrl = $payload['media_url'] ?? '';
    $audioDuration = (float)($payload['duration'] ?? 10.0);
    $incomingLang = $payload['source_lang'] ?? 'auto';

    $pdo = getDBConnection();
    $audioService = new AudioConversionService();
    $speechService = new SpeechRecognitionService();
    $transService = new TranslationService();
    $ttsService = new TextToSpeechService();

    // 1. Save or download original audio
    $origAudio = null;
    if (strpos($mediaUrl, 'data:audio') === 0 || strpos($mediaUrl, 'base64') !== false) {
        $origAudio = $audioService->saveUploadedAudio($mediaUrl, 'original', 'ogg');
    } elseif (!empty($mediaUrl) && file_exists(dirname(__DIR__) . '/' . ltrim($mediaUrl, '/\\'))) {
        $origAudio = [
            'full_path' => dirname(__DIR__) . '/' . ltrim($mediaUrl, '/\\'),
            'relative_path' => ltrim($mediaUrl, '/\\'),
            'duration' => $audioDuration
        ];
    } else {
        // Sample fallback audio path
        $origAudio = $audioService->saveUploadedAudio(base64_encode('RIFF....'), 'original', 'ogg');
    }

    // 2. Determine target staff language (default: Tamil 'ta')
    $staffTargetLang = 'ta';
    if ($pdo && !empty($customerId)) {
        $qStmt = $pdo->prepare("SELECT `assigned_to` FROM `queries` WHERE `customer_id` = ? LIMIT 1");
        $qStmt->execute([$customerId]);
        $assignedStaff = $qStmt->fetchColumn();
        if ($assignedStaff) {
            $sStmt = $pdo->prepare("SELECT `default_language` FROM `voice_language_settings` WHERE `user_id` = ? LIMIT 1");
            $sStmt->execute([$assignedStaff]);
            $langVal = $sStmt->fetchColumn();
            if ($langVal) {
                $staffTargetLang = explode('-', $langVal)[0];
            }
        }
    }

    // 3. Process STT -> Translation -> TTS
    $sttResult = $speechService->transcribeAudio($origAudio['full_path'], $incomingLang);
    $detectedSource = $sttResult['language'];
    $sourceText = $sttResult['text'];

    $translatedText = $transService->translateText($sourceText, $staffTargetLang, $detectedSource);
    $ttsResult = $ttsService->generateSpeech($translatedText, $staffTargetLang);
    $transDuration = $audioService->estimateAudioDuration($ttsResult['file_path']);

    // 4. Record in voice_messages & voice_translations
    $voiceMsgId = 'vm_in_' . uniqid();
    $translationId = 'vt_in_' . uniqid();

    if ($pdo) {
        $mStmt = $pdo->prepare("
            INSERT INTO `voice_messages`
            (`id`, `conversation_id`, `customer_id`, `direction`, `original_audio_path`, `source_language`, `target_language`, `audio_duration`, `processing_status`, `created_at`, `updated_at`)
            VALUES (?, ?, ?, 'INBOUND', ?, ?, ?, ?, 'read', NOW(), NOW())
        ");
        $mStmt->execute([
            $voiceMsgId,
            'conv_' . $customerId,
            $customerId,
            $origAudio['relative_path'],
            $detectedSource,
            $staffTargetLang,
            $origAudio['duration']
        ]);

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

        // Insert into messages table with custom voice metadata for dual player
        $msgStmt = $pdo->prepare("
            INSERT INTO `messages`
            (`customer_id`, `sender`, `text`, `media_type`, `media_url`, `audio_duration`, `time_str`, `status`, `created_at`)
            VALUES (?, 'customer', ?, 'audio', ?, ?, ?, 'DELIVERED', NOW())
        ");
        $customText = '🎤 Voice Note | Original: ' . $origAudio['relative_path'] . ' | Translated: ' . $ttsResult['relative_url'] . ' | src: ' . $detectedSource . ' | tgt: ' . $staffTargetLang;
        $msgStmt->execute([
            $customerId,
            $customText,
            $origAudio['relative_path'],
            (string)$origAudio['duration'],
            date('h:i A')
        ]);
    }

    echo json_encode([
        'success' => true,
        'status' => 'success',
        'voice_message_id' => $voiceMsgId,
        'original_audio_url' => $origAudio['relative_path'],
        'translated_audio_url' => $ttsResult['relative_url'],
        'source_lang' => $detectedSource,
        'target_lang' => $staffTargetLang,
        'target_lang_name' => ($staffTargetLang === 'ta' ? 'Tamil' : ucfirst($staffTargetLang))
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
