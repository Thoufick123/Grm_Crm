<?php
/**
 * Voice Translator - Record Voice Handler
 * Receives staff voice audio upload from CRM browser MediaRecorder.
 */
require_once dirname(__DIR__) . '/config/db.php';
require_once dirname(__DIR__) . '/services/AudioConversionService.php';
require_once dirname(__DIR__) . '/services/SpeechRecognitionService.php';

header('Content-Type: application/json');

try {
    $pdo = getDBConnection();
    $audioService = new AudioConversionService();
    $speechService = new SpeechRecognitionService();

    $customerId = $_POST['customer_id'] ?? '';
    $staffId = $_POST['staff_id'] ?? ($_SESSION['user']['id'] ?? 'staff_01');
    $sourceLang = $_POST['source_lang'] ?? 'ta';
    $clientHint = $_POST['client_transcription'] ?? '';

    if (empty($_FILES['audio']) && empty($_POST['audio_base64'])) {
        echo json_encode(['success' => false, 'error' => 'No audio data provided.']);
        exit;
    }

    $audioInput = !empty($_FILES['audio']) ? $_FILES['audio'] : $_POST['audio_base64'];
    $ext = !empty($_FILES['audio']['name']) ? pathinfo($_FILES['audio']['name'], PATHINFO_EXTENSION) : 'webm';
    if (empty($ext)) $ext = 'webm';

    $saved = $audioService->saveUploadedAudio($audioInput, 'original', $ext);

    // Create entry in voice_messages
    $msgId = 'vm_' . uniqid();
    $convId = 'conv_' . ($customerId ?: 'general');

    if ($pdo) {
        $stmt = $pdo->prepare("
            INSERT INTO `voice_messages` 
            (`id`, `conversation_id`, `customer_id`, `staff_id`, `direction`, `original_audio_path`, `source_language`, `audio_duration`, `processing_status`, `created_at`, `updated_at`)
            VALUES (?, ?, ?, ?, 'OUTBOUND', ?, ?, ?, 'downloaded', NOW(), NOW())
        ");
        $stmt->execute([
            $msgId,
            $convId,
            $customerId,
            $staffId,
            $saved['relative_path'],
            $sourceLang,
            $saved['duration']
        ]);
    }

    echo json_encode([
        'success' => true,
        'voice_message_id' => $msgId,
        'audio_url' => $saved['relative_path'],
        'duration' => $saved['duration'],
        'source_lang' => $sourceLang,
        'client_hint' => $clientHint
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
