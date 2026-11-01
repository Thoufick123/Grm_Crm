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
        $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl={$sourceLang}&tl={$targetLang}&dt=t&q={$encodedText}";

        $response = null;
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
            curl_setopt($ch, CURLOPT_TIMEOUT, 4);
            curl_setopt($ch, CURLOPT_TCP_NODELAY, 1);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
            $response = curl_exec($ch);
            curl_close($ch);
        } else {
            $ctx = stream_context_create(['http' => ['timeout' => 4, 'header' => "User-Agent: Mozilla/5.0\r\n"]]);
            $response = @file_get_contents($url, false, $ctx);
        }

        if ($response) {
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
        }

        // If Google endpoint failed or timed out, return original text safely
        return $text;
    }
}
