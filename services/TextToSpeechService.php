<?php
/**
 * TextToSpeechService
 * Converts text into natural spoken audio strictly in the 6 supported languages:
 * Tamil (ta), English (en), Malayalam (ml), Kannada (kn), Hindi (hi), Telugu (te)
 */

class TextToSpeechService {
    private $targetDir;

    public function __construct() {
        $this->targetDir = dirname(__DIR__) . '/uploads/voice/translated';
        if (!is_dir($this->targetDir)) {
            @mkdir($this->targetDir, 0777, true);
        }
    }

    /**
     * Synthesize text into voice audio file
     */
    public function generateSpeech($text, $targetLang) {
        $text = trim($text);
        if (empty($text)) {
            throw new Exception("Text cannot be empty for voice synthesis.");
        }

        $cleanLang = strtolower(trim(explode('-', $targetLang)[0]));
        $allowed = ['ta', 'en', 'ml', 'kn', 'hi', 'te'];
        if (!in_array($cleanLang, $allowed)) {
            $cleanLang = 'en';
        }

        $fileName = 'trans_' . date('Ymd_His') . '_' . $cleanLang . '_' . bin2hex(random_bytes(3)) . '.mp3';
        $fullPath = $this->targetDir . '/' . $fileName;

        // 1. Check if Google Cloud TTS API key is configured
        $apiKey = getenv('GOOGLE_TTS_API_KEY') ?: '';
        if ($apiKey) {
            try {
                $this->generateWithGoogleCloud($text, $cleanLang, $apiKey, $fullPath);
                if (file_exists($fullPath) && filesize($fullPath) > 500) {
                    return [
                        'file_path' => $fullPath,
                        'relative_url' => 'uploads/voice/translated/' . $fileName,
                        'format' => 'audio/mp3',
                        'provider' => 'GOOGLE_CLOUD_TTS'
                    ];
                }
            } catch (Exception $e) {
                error_log("Google Cloud TTS failed, falling back to public engine: " . $e->getMessage());
            }
        }

        // 2. High-speed TTS via Google Translate TTS endpoint (Supports all 6 Indian languages)
        $encodedText = urlencode($text);
        // Truncate text to 200 chars per chunk if too long
        if (strlen($text) > 200) {
            $encodedText = urlencode(mb_substr($text, 0, 190, 'UTF-8'));
        }

        $ttsUrl = "https://translate.google.com/translate_tts?ie=UTF-8&q={$encodedText}&tl={$cleanLang}&client=tw-ob";

        $audioContent = null;
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $ttsUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_TCP_NODELAY, 1);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            $audioContent = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                $audioContent = null;
            }
        } else {
            $ctx = stream_context_create(['http' => ['timeout' => 5, 'header' => "User-Agent: Mozilla/5.0\r\n"]]);
            $audioContent = @file_get_contents($ttsUrl, false, $ctx);
        }

        if ($audioContent && strlen($audioContent) > 200) {
            file_put_contents($fullPath, $audioContent);
            return [
                'file_path' => $fullPath,
                'relative_url' => 'uploads/voice/translated/' . $fileName,
                'format' => 'audio/mp3',
                'provider' => 'GOOGLE_PUBLIC_TTS'
            ];
        }

        throw new Exception("Unable to generate translated voice audio for {$cleanLang}.");
    }

    /**
     * Google Cloud TTS API
     */
    private function generateWithGoogleCloud($text, $lang, $apiKey, $savePath) {
        $voices = [
            'ta' => ['lang' => 'ta-IN', 'name' => 'ta-IN-Wavenet-A'],
            'en' => ['lang' => 'en-IN', 'name' => 'en-IN-Wavenet-A'],
            'hi' => ['lang' => 'hi-IN', 'name' => 'hi-IN-Wavenet-A'],
            'te' => ['lang' => 'te-IN', 'name' => 'te-IN-Standard-A'],
            'ml' => ['lang' => 'ml-IN', 'name' => 'ml-IN-Standard-A'],
            'kn' => ['lang' => 'kn-IN', 'name' => 'kn-IN-Standard-A']
        ];
        $selectedVoice = $voices[$lang] ?? $voices['en'];

        $payload = [
            'input' => ['text' => $text],
            'voice' => [
                'languageCode' => $selectedVoice['lang'],
                'name' => $selectedVoice['name']
            ],
            'audioConfig' => [
                'audioEncoding' => 'MP3',
                'speakingRate' => 1.0,
                'pitch' => 0.0
            ]
        ];

        $url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" . urlencode($apiKey);
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_TIMEOUT, 12);
        $response = curl_exec($ch);
        curl_close($ch);

        if ($response) {
            $data = json_decode($response, true);
            if (!empty($data['audioContent'])) {
                file_put_contents($savePath, base64_decode($data['audioContent']));
                return;
            }
        }
        throw new Exception("Cloud TTS API call failed.");
    }
}
