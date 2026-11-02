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
        }

        // If source and target are identical, return as is
        if ($sourceLang === $targetLang) {
            return $text;
        }

        $encodedText = urlencode($text);
        
        // 1. Primary: Google Dictionary / Chrome Extension Client (Fast, avoids 429 rate limits)
        $endpoints = [
            "https://translate.googleapis.com/translate_a/single?client=dict-chrome-ex&sl={$sourceLang}&tl={$targetLang}&dt=t&q={$encodedText}",
            "https://api.mymemory.translated.net/get?q={$encodedText}&langpair=" . ($sourceLang === 'auto' ? 'en' : $sourceLang) . "|{$targetLang}",
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$sourceLang}&tl={$targetLang}&dt=t&q={$encodedText}"
        ];

        foreach ($endpoints as $url) {
            $response = null;
            if (function_exists('curl_init')) {
                $ch = curl_init();
                curl_setopt($ch, CURLOPT_URL, $url);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
                curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
                curl_setopt($ch, CURLOPT_TIMEOUT, 6);
                curl_setopt($ch, CURLOPT_TCP_NODELAY, 1);
                curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
                curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
                $response = curl_exec($ch);
                $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
                if ($code !== 200) {
                    $response = null;
                }
            } else {
                $ctx = stream_context_create(['http' => ['timeout' => 5, 'header' => "User-Agent: Mozilla/5.0\r\n"]]);
                $response = @file_get_contents($url, false, $ctx);
            }

            if ($response) {
                // Check if Google array format
                $data = json_decode($response, true);
                if (is_array($data) && isset($data[0]) && is_array($data[0])) {
                    $translatedText = '';
                    foreach ($data[0] as $segment) {
                        if (isset($segment[0])) {
                            $translatedText .= $segment[0];
                        }
                    }
                    if (!empty(trim($translatedText))) {
                        return trim($translatedText);
                    }
                }
                // Check if MyMemory response format
                if (is_array($data) && !empty($data['responseData']['translatedText'])) {
                    $myMemText = trim($data['responseData']['translatedText']);
                    if (!empty($myMemText) && stripos($myMemText, 'MYMEMORY WARNING') === false) {
                        return $myMemText;
                    }
                }
            }
        }

        // If all endpoints failed or timed out, return original text safely
        return $text;
    }
}
