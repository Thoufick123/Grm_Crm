<?php
/**
 * SpeechRecognitionService
 * Converts spoken voice audio into text strictly for the 6 supported languages:
 * 1. Tamil (ta-IN)
 * 2. English (en-IN)
 * 3. Malayalam (ml-IN)
 * 4. Telugu (te-IN)
 * 5. Hindi (hi-IN)
 * 6. Kannada (kn-IN)
 * Supports Google Cloud Speech-to-Text and OpenAI Whisper.
 */

class SpeechRecognitionService {
    private static $supportedLanguages = [
        'ta' => ['code' => 'ta', 'bcp47' => 'ta-IN', 'name' => 'Tamil', 'native' => 'தமிழ்'],
        'en' => ['code' => 'en', 'bcp47' => 'en-IN', 'name' => 'English', 'native' => 'English'],
        'ml' => ['code' => 'ml', 'bcp47' => 'ml-IN', 'name' => 'Malayalam', 'native' => 'മലയാളം'],
        'te' => ['code' => 'te', 'bcp47' => 'te-IN', 'name' => 'Telugu', 'native' => 'తెలుగు'],
        'hi' => ['code' => 'hi', 'bcp47' => 'hi-IN', 'name' => 'Hindi', 'native' => 'हिंदी'],
        'kn' => ['code' => 'kn', 'bcp47' => 'kn-IN', 'name' => 'Kannada', 'native' => 'ಕನ್ನಡ']
    ];

    public static function getSupportedLanguages() {
        return self::$supportedLanguages;
    }

    public static function normalizeLangCode($lang) {
        $lang = strtolower(trim($lang));
        if (strpos($lang, '-') !== false) {
            $lang = explode('-', $lang)[0];
        }
        return isset(self::$supportedLanguages[$lang]) ? $lang : 'en';
    }

    public static function getBcp47($lang) {
        $clean = self::normalizeLangCode($lang);
        return self::$supportedLanguages[$clean]['bcp47'] ?? 'en-IN';
    }

    private function getApiKey($keyName) {
        $val = getenv($keyName);
        if ($val) return trim($val);

        // Check .env file directly
        $envFile = dirname(__DIR__) . '/.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                if (strpos($line, '=') !== false) {
                    list($k, $v) = explode('=', $line, 2);
                    if (trim($k) === $keyName && !empty(trim($v))) {
                        return trim($v);
                    }
                }
            }
        }

        // Check whatsapp_account_config.json
        $cfgFile = dirname(__DIR__) . '/whatsapp_account_config.json';
        if (file_exists($cfgFile)) {
            $cfg = json_decode(file_get_contents($cfgFile), true) ?: [];
            if (!empty($cfg[$keyName])) return trim($cfg[$keyName]);
            if (!empty($cfg[strtolower($keyName)])) return trim($cfg[strtolower($keyName)]);
        }

        return '';
    }

    /**
     * Transcribe voice recording into text
     */
    public function transcribeAudio($audioFilePath, $expectedLanguage = 'auto', $clientHintText = '') {
        if (!file_exists($audioFilePath)) {
            throw new Exception("Audio file not found for speech recognition: " . $audioFilePath);
        }

        // 1. Client-provided Web Speech transcription hint from browser microphone
        if (!empty(trim($clientHintText))) {
            return [
                'text' => trim($clientHintText),
                'language' => self::normalizeLangCode($expectedLanguage),
                'confidence' => 0.95,
                'provider' => 'WEB_SPEECH_CLIENT'
            ];
        }

        // 2. OpenAI Whisper API (or Groq Whisper)
        $whisperKey = $this->getApiKey('OPENAI_API_KEY') ?: $this->getApiKey('GROQ_API_KEY');
        if ($whisperKey) {
            try {
                $endpoint = $this->getApiKey('GROQ_API_KEY') ? 'https://api.groq.com/openai/v1/audio/transcriptions' : 'https://api.openai.com/v1/audio/transcriptions';
                return $this->transcribeWithOpenAIWhisper($audioFilePath, $whisperKey, $endpoint);
            } catch (Exception $wEx) {
                error_log("[Whisper STT Error]: " . $wEx->getMessage());
            }
        }

        // 3. Google Cloud Speech-to-Text API (if configured in .env)
        $googleKey = $this->getApiKey('GOOGLE_SPEECH_API_KEY');
        if ($googleKey) {
            return $this->transcribeWithGoogleCloud($audioFilePath, $expectedLanguage, $googleKey);
        }

        // 4. Return empty text if no API key is configured and no speech recognized
        return [
            'text' => '',
            'language' => self::normalizeLangCode($expectedLanguage ?: 'ta'),
            'confidence' => 0.0,
            'provider' => 'NONE'
        ];
    }

    /**
     * OpenAI Whisper API
     */
    private function transcribeWithOpenAIWhisper($audioFilePath, $apiKey, $endpoint = 'https://api.openai.com/v1/audio/transcriptions') {
        $ch = curl_init($endpoint);
        $cFile = new CURLFile($audioFilePath);
        $model = strpos($endpoint, 'groq') !== false ? 'whisper-large-v3' : 'whisper-1';
        $postData = [
            'file' => $cFile,
            'model' => $model
        ];
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . trim($apiKey)
        ]);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($ch, CURLOPT_TIMEOUT, 20);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            if (!empty($data['text'])) {
                return [
                    'text' => trim($data['text']),
                    'language' => 'auto',
                    'confidence' => 0.98,
                    'provider' => 'OPENAI_WHISPER'
                ];
            }
        }
        throw new Exception("OpenAI Whisper returned HTTP {$httpCode}: {$response}");
    }

    /**
     * Google Cloud Speech-to-Text v1 endpoint
     */
    private function transcribeWithGoogleCloud($audioFilePath, $lang, $apiKey) {
        $bcp47 = self::getBcp47($lang);
        $audioContent = base64_encode(file_get_contents($audioFilePath));

        $payload = [
            'config' => [
                'encoding' => 'WEBM_OPUS',
                'sampleRateHertz' => 48000,
                'languageCode' => $bcp47,
                'alternativeLanguageCodes' => ['ta-IN', 'en-IN', 'hi-IN', 'te-IN', 'ml-IN', 'kn-IN'],
                'enableAutomaticPunctuation' => true
            ],
            'audio' => [
                'content' => $audioContent
            ]
        ];

        $url = "https://speech.googleapis.com/v1/speech:recognize?key=" . urlencode($apiKey);

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            $transcript = '';
            if (!empty($data['results'])) {
                foreach ($data['results'] as $result) {
                    if (!empty($result['alternatives'][0]['transcript'])) {
                        $transcript .= $result['alternatives'][0]['transcript'] . ' ';
                    }
                }
                return [
                    'text' => trim($transcript),
                    'language' => self::normalizeLangCode($data['results'][0]['languageCode'] ?? $lang),
                    'confidence' => $data['results'][0]['alternatives'][0]['confidence'] ?? 0.90,
                    'provider' => 'GOOGLE_SPEECH_API'
                ];
            }
        }

        throw new Exception("Google Speech-to-Text returned no transcript or error.");
    }
}
