<?php
/**
 * WhatsAppMediaService
 * Handles WhatsApp voice media downloading and outbound dispatch.
 */

class WhatsAppMediaService {
    private $bridgeUrl;

    public function __construct($bridgeUrl = null) {
        $this->bridgeUrl = $bridgeUrl ?: (defined('BRIDGE_URL') ? BRIDGE_URL : 'http://localhost:3000');
    }

    /**
     * Send voice message to customer's WhatsApp
     */
    public function sendVoiceMessage($phone, $audioUrl, $customerId = null, $accountId = 'account_1') {
        $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
        if (strlen($cleanPhone) === 10) {
            $cleanPhone = '91' . $cleanPhone;
        }

        // Call Baileys Bridge
        $ch = curl_init($this->bridgeUrl . '/api/send');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
            'phone' => $cleanPhone,
            'text' => '🎤 Voice Note',
            'mediaUrl' => $audioUrl,
            'media_type' => 'audio',
            'isVoiceNote' => true,
            'accountId' => $accountId
        ]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 3);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $result = json_decode($response, true) ?: [];
        $isSent = ($httpCode === 200 && ($result['status'] ?? '') === 'success');

        return [
            'success' => $isSent,
            'message_id' => $result['message_id'] ?? ('wamid_' . uniqid()),
            'status' => $isSent ? 'DELIVERED' : 'SENT',
            'response' => $result
        ];
    }
}
