<?php
/**
 * TranslationService
 * Translates intermediate text strictly between the 6 supported languages:
 * Tamil (ta), English (en), Malayalam (ml), Kannada (kn), Hindi (hi), Telugu (te)
 */

class TranslationService {
    private static $allowedLanguages = ['ta', 'en', 'ml', 'kn', 'hi', 'te'];

    public static function isSupported($lang) {
        $clean = strtolower(trim(explode('-', $lang)[0]));
        return in_array($clean, self::$allowedLanguages);
    }

    public static function normalize($lang) {
        $clean = strtolower(trim(explode('-', $lang)[0]));
        return in_array($clean, self::$allowedLanguages) ? $clean : 'en';
    }

    /**
     * Auto-detect Indic script from text if sourceLang is auto
     */
    public static function detectScriptLanguage($text) {
        // Tamil: U+0B80 - U+0BFF
        if (preg_match('/[\x{0B80}-\x{0BFF}]/u', $text)) return 'ta';
        // Malayalam: U+0D00 - U+0D7F
        if (preg_match('/[\x{0D00}-\x{0D7F}]/u', $text)) return 'ml';
        // Telugu: U+0C00 - U+0C7F
        if (preg_match('/[\x{0C00}-\x{0C7F}]/u', $text)) return 'te';
        // Kannada: U+0C80 - U+0CFF
        if (preg_match('/[\x{0C80}-\x{0CFF}]/u', $text)) return 'kn';
        // Devanagari (Hindi): U+0900 - U+097F
        if (preg_match('/[\x{0900}-\x{097F}]/u', $text)) return 'hi';
        return 'en';
    }

    /**
     * Translate text from source language to target language
     */
    public function translateText($text, $targetLang, $sourceLang = 'auto') {
        $text = trim($text);
        if (empty($text)) {
            return '';
        }

        $targetLang = self::normalize($targetLang);
        if ($sourceLang !== 'auto') {
            $sourceLang = self::normalize($sourceLang);
        } else {
            $detected = self::detectScriptLanguage($text);
            if ($detected !== 'en') {
                $sourceLang = $detected;
            }
        }

        // If source and target are identical, return original
        if ($sourceLang !== 'auto' && $sourceLang === $targetLang) {
            return $text;
        }

        $encodedText = urlencode($text);
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
        $referer = 'https://translate.google.com/';

        $slForMyMemory = ($sourceLang === 'auto') ? self::detectScriptLanguage($text) : $sourceLang;

        $endpoints = [
            [
                'type' => 'google',
                'url' => "https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl={$sourceLang}&tl={$targetLang}&dt=t&q={$encodedText}"
            ],
            [
                'type' => 'google',
                'url' => "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$sourceLang}&tl={$targetLang}&dt=t&q={$encodedText}"
            ],
            [
                'type' => 'mymemory',
                'url' => "https://api.mymemory.translated.net/get?q={$encodedText}&langpair={$slForMyMemory}|{$targetLang}&de=admin@grmgarments.com"
            ]
        ];

        foreach ($endpoints as $ep) {
            $url = $ep['url'];
            $type = $ep['type'];
            $response = null;

            if (function_exists('curl_init')) {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
                curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 4);
                curl_setopt($ch, CURLOPT_TIMEOUT, 7);
                curl_setopt($ch, CURLOPT_TCP_NODELAY, 1);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_USERAGENT, $userAgent);
                if ($type === 'google') {
                    curl_setopt($ch, CURLOPT_HTTPHEADER, [
                        "Referer: {$referer}",
                        "Accept-Language: en-US,en;q=0.9",
                        "Accept: application/json"
                    ]);
                }
                $response = curl_exec($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($code !== 200) {
                    $response = null;
                }
            } else {
                $opts = [
                    'http' => [
                        'timeout' => 6,
                        'header' => "User-Agent: {$userAgent}\r\nReferer: {$referer}\r\n"
                    ]
                ];
                $ctx = stream_context_create($opts);
                $response = @file_get_contents($url, false, $ctx);
            }

            if ($response) {
                if ($type === 'google') {
                    $data = json_decode($response, true);
                    if (is_array($data) && isset($data[0]) && is_array($data[0])) {
                        $translatedText = '';
                        foreach ($data[0] as $segment) {
                            if (isset($segment[0])) {
                                $translatedText .= $segment[0];
                            }
                        }
                        $cleanOut = trim($translatedText);
                        if (!empty($cleanOut)) {
                            return $cleanOut;
                        }
                    }
                } elseif ($type === 'mymemory') {
                    $data = json_decode($response, true);
                    if (is_array($data) && !empty($data['responseData']['translatedText'])) {
                        $myMemText = trim($data['responseData']['translatedText']);
                        if (!empty($myMemText) && stripos($myMemText, 'MYMEMORY WARNING') === false && stripos($myMemText, 'LIMIT') === false) {
                            return $myMemText;
                        }
                    }
                }
            }
        }

        // Return original text if external translation is temporarily unavailable
        return $text;
    }
}
