<?php
/**
 * Plant Chat — Gemini-powered gardening assistant
 *
 *   POST   ?user_id=X  body { message }    → AI reply (saves both messages to history)
 *   GET    ?user_id=X                      → full chat history (oldest → newest)
 *   DELETE ?user_id=X                      → wipe user's history
 */

ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

ini_set('display_errors', 0);
error_reporting(E_ALL);

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Fatal: ' . $error['message']]);
    }
});

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/gemini.php';

function respond($success, $message = '', $data = null, $code = 200) {
    ob_clean();
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit();
}

$db = (new Database())->getConnection();
if (!$db) respond(false, 'Database connection failed', null, 500);
ensureChatTable($db);

$method  = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    if (is_array($body) && isset($body['user_id'])) $user_id = intval($body['user_id']);
}
if (!$user_id) respond(false, 'user_id required', null, 401);

try {
    switch ($method) {
        case 'POST':   handleSendMessage($db, $user_id); break;
        case 'GET':    handleGetHistory($db, $user_id);  break;
        case 'DELETE': handleClear($db, $user_id);       break;
        default:       respond(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// ─────────────────────────────────────────────────────────────────────
function ensureChatTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `plant_chat_messages` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` INT UNSIGNED NOT NULL,
            `role` ENUM('user','assistant') NOT NULL,
            `content` TEXT NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_user_created` (`user_id`, `created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }
}

// ─────────────────────────────────────────────────────────────────────
function handleSendMessage($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    $message = isset($body['message']) ? trim($body['message']) : '';
    if ($message === '') respond(false, 'message is required', null, 400);
    if (mb_strlen($message) > 4000) respond(false, 'message too long (max 4000 chars)', null, 400);

    // Save user message first
    $ins = $db->prepare("INSERT INTO plant_chat_messages (user_id, role, content) VALUES (:uid, 'user', :c)");
    $ins->execute([':uid' => $user_id, ':c' => $message]);

    // Build context: user's plants + recent history
    $plant_context = buildPlantContext($db, $user_id);
    $history       = loadRecentHistory($db, $user_id, 16);  // last 16 turns max

    $reply = callGeminiChat($plant_context, $history);

    $db->prepare("INSERT INTO plant_chat_messages (user_id, role, content) VALUES (:uid, 'assistant', :c)")
       ->execute([':uid' => $user_id, ':c' => $reply]);

    // Return both messages so client can render immediately
    $stmt = $db->prepare("SELECT * FROM plant_chat_messages
                          WHERE user_id = :uid
                          ORDER BY id DESC LIMIT 2");
    $stmt->execute([':uid' => $user_id]);
    $latest = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));

    respond(true, 'OK', ['messages' => $latest]);
}

function handleGetHistory($db, $user_id) {
    $stmt = $db->prepare("SELECT * FROM plant_chat_messages
                          WHERE user_id = :uid
                          ORDER BY created_at ASC, id ASC
                          LIMIT 200");
    $stmt->execute([':uid' => $user_id]);
    respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function handleClear($db, $user_id) {
    $db->prepare("DELETE FROM plant_chat_messages WHERE user_id = :uid")
       ->execute([':uid' => $user_id]);
    respond(true, 'History cleared');
}

// ─────────────────────────────────────────────────────────────────────
function buildPlantContext($db, $user_id) {
    $stmt = $db->prepare("SELECT name, species, type, light_requirements, watering_schedule, status
                          FROM plants WHERE user_id = :uid
                          ORDER BY created_at DESC LIMIT 30");
    $stmt->execute([':uid' => $user_id]);
    $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);
    if (empty($plants)) return "The user has not added any plants to their collection yet.";

    $lines = ["The user's plant collection (" . count($plants) . " plants):"];
    foreach ($plants as $p) {
        $bits = [];
        $bits[] = $p['name'];
        if (!empty($p['species']))            $bits[] = '(' . $p['species'] . ')';
        if (!empty($p['type']))               $bits[] = '— ' . $p['type'];
        if (!empty($p['light_requirements'])) $bits[] = 'light: ' . $p['light_requirements'];
        if (!empty($p['watering_schedule']))  $bits[] = 'water: ' . $p['watering_schedule'];
        if (!empty($p['status']))             $bits[] = 'status: ' . $p['status'];
        $lines[] = '  • ' . implode(' ', $bits);
    }
    return implode("\n", $lines);
}

function loadRecentHistory($db, $user_id, $limit) {
    // Pull last N messages, oldest → newest
    $stmt = $db->prepare("SELECT role, content FROM (
                              SELECT id, role, content FROM plant_chat_messages
                              WHERE user_id = :uid
                              ORDER BY id DESC LIMIT :lim
                          ) t ORDER BY id ASC");
    $stmt->bindValue(':uid', $user_id, PDO::PARAM_INT);
    $stmt->bindValue(':lim', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ─────────────────────────────────────────────────────────────────────
function callGeminiChat($plantContext, $history) {
    if (!GEMINI_API_KEY || strpos(GEMINI_API_KEY, 'PASTE-YOUR-GEMINI-KEY') !== false) {
        throw new Exception('Gemini API key not configured. Edit backend/config/gemini.php.');
    }

    $systemText = "You are a friendly, knowledgeable houseplant and gardening assistant for a user of the Botanic Journal app. " .
        "Give practical, specific advice. Reference the user's actual plants when relevant — don't invent plants they don't own. " .
        "If a question is outside plant care (legal, medical, etc.), gently redirect to gardening topics. " .
        "Keep replies concise and actionable: 2-5 short paragraphs at most, or bullet points where they help. " .
        "Use plain text — no markdown headings or code fences.\n\n" .
        $plantContext;

    // Convert history to Gemini's expected role format ('model' instead of 'assistant')
    $contents = [];
    foreach ($history as $m) {
        $contents[] = [
            'role'  => $m['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $m['content']]],
        ];
    }
    if (empty($contents)) {
        // Should not happen since we just saved the user message, but be defensive
        $contents[] = ['role' => 'user', 'parts' => [['text' => 'Hello']]];
    }

    $payload = [
        'system_instruction' => ['parts' => [['text' => $systemText]]],
        'contents'           => $contents,
        'generationConfig'   => [
            'temperature'     => 0.7,
            'maxOutputTokens' => 800,
        ],
    ];

    $url = GEMINI_API_URL_BASE . '/' . GEMINI_MODEL . ':generateContent?key=' . urlencode(GEMINI_API_KEY);

    // Re-use the same SSL fallback approach as plant-doctor
    $caBundle = ini_get('curl.cainfo') ?: ini_get('openssl.cafile');
    $hasCaBundle = $caBundle && file_exists($caBundle);

    $ch = curl_init($url);
    $opts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 60,
    ];
    if ($hasCaBundle) {
        $opts[CURLOPT_CAINFO] = $caBundle;
    } else {
        $opts[CURLOPT_SSL_VERIFYPEER] = false;
        $opts[CURLOPT_SSL_VERIFYHOST] = 0;
    }
    curl_setopt_array($ch, $opts);

    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);

    if ($body === false) throw new Exception('Gemini request failed: ' . $cerr);
    if ($code < 200 || $code >= 300) {
        $err = json_decode($body, true);
        throw new Exception('Gemini API error: ' . ($err['error']['message'] ?? ('HTTP ' . $code)));
    }

    $resp = json_decode($body, true);
    $text = $resp['candidates'][0]['content']['parts'][0]['text'] ?? '';
    $text = trim($text);

    return $text !== '' ? $text : "Sorry — I didn't catch that. Could you rephrase?";
}
