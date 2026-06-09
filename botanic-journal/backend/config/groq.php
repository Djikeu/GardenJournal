<?php
/**
 * Groq API configuration + shared chat helper.
 *
 * Groq exposes an OpenAI-compatible Chat Completions API and has a genuinely
 * free tier (no credit card, works in the EU).
 *
 * SETUP:
 * 1. Get a free API key from https://console.groq.com/keys
 * 2. Add it to your local .env file as GROQ_API_KEY=your_key
 * 3. This file reads from the environment so the key isn't committed.
 */

require_once __DIR__ . '/http.php';

if (!defined('GROQ_API_KEY')) {
    $envKey = getenv('GROQ_API_KEY');
    define('GROQ_API_KEY', $envKey ?: '');
}

if (!defined('GROQ_MODEL')) {
    // Fast, capable model on Groq's free tier. Others: 'llama-3.1-8b-instant', 'openai/gpt-oss-20b'.
    define('GROQ_MODEL', 'llama-3.3-70b-versatile');
}

if (!defined('GROQ_API_URL')) {
    define('GROQ_API_URL', 'https://api.groq.com/openai/v1/chat/completions');
}

/**
 * Call Groq's chat-completions API.
 *
 * @param string $systemText  System instruction (may be empty).
 * @param array  $turns       Ordered messages: [['role'=>'user'|'assistant'|'model', 'content'=>'...'], ...]
 * @param array  $opts        ['temperature'=>float, 'max_tokens'=>int, 'json'=>bool, 'top_p'=>float, 'timeout'=>int]
 * @return string             The assistant's reply text.
 * @throws Exception          On config / network / API errors.
 */
if (!function_exists('groqChat')) {
    function groqChat($systemText, $turns = [], $opts = []) {
        if (!GROQ_API_KEY || GROQ_API_KEY === '') {
            throw new Exception('Groq API key not configured. Please add GROQ_API_KEY to your environment or .env file.');
        }

        $wantJson = !empty($opts['json']);

        // JSON mode requires the word "json" somewhere in the prompt (OpenAI/Groq rule).
        if ($wantJson && stripos($systemText, 'json') === false) {
            $systemText = trim($systemText . "\nRespond with valid JSON only.");
        }

        $messages = [];
        if ($systemText !== '') {
            $messages[] = ['role' => 'system', 'content' => $systemText];
        }
        foreach ($turns as $t) {
            $role = (($t['role'] ?? 'user') === 'assistant' || ($t['role'] ?? '') === 'model') ? 'assistant' : 'user';
            $messages[] = ['role' => $role, 'content' => (string) ($t['content'] ?? '')];
        }
        // Groq requires at least one non-system message.
        $hasUser = false;
        foreach ($messages as $m) { if ($m['role'] !== 'system') { $hasUser = true; break; } }
        if (!$hasUser) {
            $messages[] = ['role' => 'user', 'content' => 'Hello'];
        }

        $payload = [
            'model'       => GROQ_MODEL,
            'messages'    => $messages,
            'temperature' => isset($opts['temperature']) ? (float) $opts['temperature'] : 0.7,
            'max_tokens'  => isset($opts['max_tokens']) ? (int) $opts['max_tokens'] : 1500,
        ];
        if (isset($opts['top_p'])) {
            $payload['top_p'] = (float) $opts['top_p'];
        }
        if ($wantJson) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $timeout = isset($opts['timeout']) ? (int) $opts['timeout'] : 60;

        [$body, $code, $cerr] = httpPostJson(GROQ_API_URL, $payload, $timeout, [
            'Authorization: Bearer ' . GROQ_API_KEY,
        ]);

        if ($body === false) {
            throw new Exception('Groq request failed: ' . $cerr);
        }
        if ($code < 200 || $code >= 300) {
            $err = json_decode($body, true);
            throw new Exception('Groq API error: ' . ($err['error']['message'] ?? ('HTTP ' . $code)));
        }

        $resp = json_decode($body, true);
        $text = $resp['choices'][0]['message']['content'] ?? '';
        return trim($text);
    }
}

if (!defined('GROQ_VISION_MODEL')) {
    // Vision-capable model on Groq's free tier (accepts image input).
    define('GROQ_VISION_MODEL', 'meta-llama/llama-4-scout-17b-16e-instruct');
}

/**
 * Call Groq with a single image + text prompt (vision).
 *
 * @param string $systemText    System instruction (may be empty).
 * @param string $userText      The user's text prompt.
 * @param string $imageDataUrl  Full data URL: "data:image/jpeg;base64,...."
 * @param array  $opts          ['temperature', 'max_tokens', 'json', 'model', 'timeout']
 * @return string               The assistant's reply text.
 * @throws Exception
 */
if (!function_exists('groqVision')) {
    function groqVision($systemText, $userText, $imageDataUrl, $opts = []) {
        if (!GROQ_API_KEY || GROQ_API_KEY === '') {
            throw new Exception('Groq API key not configured. Please add GROQ_API_KEY to your environment or .env file.');
        }

        $wantJson = !empty($opts['json']);
        if ($wantJson && stripos($systemText, 'json') === false) {
            $systemText = trim($systemText . "\nRespond with valid JSON only.");
        }

        $messages = [];
        if ($systemText !== '') {
            $messages[] = ['role' => 'system', 'content' => $systemText];
        }
        $messages[] = [
            'role'    => 'user',
            'content' => [
                ['type' => 'text', 'text' => $userText],
                ['type' => 'image_url', 'image_url' => ['url' => $imageDataUrl]],
            ],
        ];

        $payload = [
            'model'       => $opts['model'] ?? GROQ_VISION_MODEL,
            'messages'    => $messages,
            'temperature' => isset($opts['temperature']) ? (float) $opts['temperature'] : 0.4,
            'max_tokens'  => isset($opts['max_tokens']) ? (int) $opts['max_tokens'] : 1024,
        ];
        if ($wantJson) {
            $payload['response_format'] = ['type' => 'json_object'];
        }

        $timeout = isset($opts['timeout']) ? (int) $opts['timeout'] : 60;

        [$body, $code, $cerr] = httpPostJson(GROQ_API_URL, $payload, $timeout, [
            'Authorization: Bearer ' . GROQ_API_KEY,
        ]);

        if ($body === false) {
            throw new Exception('Groq request failed: ' . $cerr);
        }
        if ($code < 200 || $code >= 300) {
            $err = json_decode($body, true);
            throw new Exception('Groq API error: ' . ($err['error']['message'] ?? ('HTTP ' . $code)));
        }

        $resp = json_decode($body, true);
        return trim($resp['choices'][0]['message']['content'] ?? '');
    }
}