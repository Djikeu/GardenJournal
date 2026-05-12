<?php
/**
 * Plant Chat — Gemini-powered gardening assistant with multi-conversation support
 *
 *   GET    ?user_id=X                          → list user's conversations
 *   GET    ?user_id=X&conversation_id=Y        → messages for a conversation
 *   POST   ?user_id=X  body { message, conversation_id? }
 *          → if conversation_id omitted, auto-creates a new conversation;
 *            title is generated from the first message.
 *   PATCH  ?user_id=X  body { conversation_id, title }   → rename a conversation
 *   DELETE ?user_id=X&conversation_id=Y        → delete a conversation (and its messages)
 */

ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
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
ensureChatTables($db);

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
        case 'GET':    handleGet($db, $user_id);         break;
        case 'PATCH':  handleRename($db, $user_id);      break;
        case 'DELETE': handleDelete($db, $user_id);      break;
        default:       respond(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// ─────────────────────────────────────────────────────────────────────
function ensureChatTables($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `plant_chat_conversations` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` INT UNSIGNED NOT NULL,
            `title` VARCHAR(200) NOT NULL DEFAULT 'New chat',
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_user_updated` (`user_id`, `updated_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }

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

    // Add the conversation_id column to messages if it isn't already there
    try {
        $db->exec("ALTER TABLE plant_chat_messages ADD COLUMN conversation_id INT UNSIGNED NULL");
    } catch (Exception $e) { /* already exists */ }
    try {
        $db->exec("CREATE INDEX idx_pcm_conv ON plant_chat_messages (conversation_id, id)");
    } catch (Exception $e) { /* already exists */ }
}

// ─────────────────────────────────────────────────────────────────────
function handleGet($db, $user_id) {
    if (isset($_GET['conversation_id'])) {
        $convId = intval($_GET['conversation_id']);
        // Verify ownership
        $own = $db->prepare("SELECT 1 FROM plant_chat_conversations WHERE id = :id AND user_id = :uid");
        $own->execute([':id' => $convId, ':uid' => $user_id]);
        if (!$own->fetchColumn()) respond(false, 'Conversation not found', null, 404);

        $stmt = $db->prepare("SELECT id, role, content, created_at
                              FROM plant_chat_messages
                              WHERE conversation_id = :c
                              ORDER BY id ASC LIMIT 500");
        $stmt->execute([':c' => $convId]);
        respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // List conversations
    $stmt = $db->prepare("SELECT c.id, c.title, c.created_at, c.updated_at,
                                 (SELECT COUNT(*) FROM plant_chat_messages m WHERE m.conversation_id = c.id) AS msg_count,
                                 (SELECT content FROM plant_chat_messages m WHERE m.conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_message
                          FROM plant_chat_conversations c
                          WHERE c.user_id = :uid
                          ORDER BY c.updated_at DESC, c.id DESC");
    $stmt->execute([':uid' => $user_id]);
    respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

// ─────────────────────────────────────────────────────────────────────
function handleSendMessage($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    $message = isset($body['message']) ? trim($body['message']) : '';
    $convId  = isset($body['conversation_id']) && $body['conversation_id'] ? intval($body['conversation_id']) : null;

    if ($message === '') respond(false, 'message is required', null, 400);
    if (mb_strlen($message) > 4000) respond(false, 'message too long (max 4000 chars)', null, 400);

    // Create conversation if needed
    if (!$convId) {
        // Auto-title from the first message
        $title = mb_substr($message, 0, 60);
        if (mb_strlen($message) > 60) $title .= '…';
        $ins = $db->prepare("INSERT INTO plant_chat_conversations (user_id, title) VALUES (:uid, :title)");
        $ins->execute([':uid' => $user_id, ':title' => $title]);
        $convId = $db->lastInsertId();
    } else {
        // Verify ownership
        $own = $db->prepare("SELECT 1 FROM plant_chat_conversations WHERE id = :id AND user_id = :uid");
        $own->execute([':id' => $convId, ':uid' => $user_id]);
        if (!$own->fetchColumn()) respond(false, 'Conversation not found', null, 404);
    }

    // Save user message
    $db->prepare("INSERT INTO plant_chat_messages (conversation_id, user_id, role, content) VALUES (:c, :uid, 'user', :ct)")
       ->execute([':c' => $convId, ':uid' => $user_id, ':ct' => $message]);

    // Build context
    $plant_context = buildPlantContext($db, $user_id);
    $history       = loadConversationHistory($db, $convId, 16);

    $reply = callGeminiChat($plant_context, $history);

    $db->prepare("INSERT INTO plant_chat_messages (conversation_id, user_id, role, content) VALUES (:c, :uid, 'assistant', :ct)")
       ->execute([':c' => $convId, ':uid' => $user_id, ':ct' => $reply]);

    // Bump conversation's updated_at
    $db->prepare("UPDATE plant_chat_conversations SET updated_at = NOW() WHERE id = :id")
       ->execute([':id' => $convId]);

    // Return the two latest rows plus the conversation id (client may have started a fresh chat)
    $stmt = $db->prepare("SELECT id, role, content, created_at FROM plant_chat_messages
                          WHERE conversation_id = :c
                          ORDER BY id DESC LIMIT 2");
    $stmt->execute([':c' => $convId]);
    $latest = array_reverse($stmt->fetchAll(PDO::FETCH_ASSOC));

    respond(true, 'OK', ['conversation_id' => $convId, 'messages' => $latest]);
}

function handleRename($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    $convId = isset($body['conversation_id']) ? intval($body['conversation_id']) : null;
    $title  = isset($body['title']) ? trim($body['title']) : '';
    if (!$convId || $title === '') respond(false, 'conversation_id and title required', null, 400);
    if (mb_strlen($title) > 200) $title = mb_substr($title, 0, 200);

    $stmt = $db->prepare("UPDATE plant_chat_conversations SET title = :t WHERE id = :id AND user_id = :uid");
    $stmt->execute([':t' => $title, ':id' => $convId, ':uid' => $user_id]);
    respond(true, 'Renamed', ['conversation_id' => $convId, 'title' => $title]);
}

function handleDelete($db, $user_id) {
    $convId = isset($_GET['conversation_id']) ? intval($_GET['conversation_id']) : null;
    if (!$convId) respond(false, 'conversation_id required', null, 400);

    // Verify ownership
    $own = $db->prepare("SELECT 1 FROM plant_chat_conversations WHERE id = :id AND user_id = :uid");
    $own->execute([':id' => $convId, ':uid' => $user_id]);
    if (!$own->fetchColumn()) respond(false, 'Conversation not found', null, 404);

    $db->prepare("DELETE FROM plant_chat_messages WHERE conversation_id = :c")->execute([':c' => $convId]);
    $db->prepare("DELETE FROM plant_chat_conversations WHERE id = :id")->execute([':id' => $convId]);
    respond(true, 'Deleted');
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

function loadConversationHistory($db, $convId, $limit) {
    $stmt = $db->prepare("SELECT role, content FROM (
                              SELECT id, role, content FROM plant_chat_messages
                              WHERE conversation_id = :c
                              ORDER BY id DESC LIMIT :lim
                          ) t ORDER BY id ASC");
    $stmt->bindValue(':c',   $convId, PDO::PARAM_INT);
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

    $contents = [];
    foreach ($history as $m) {
        $contents[] = [
            'role'  => $m['role'] === 'assistant' ? 'model' : 'user',
            'parts' => [['text' => $m['content']]],
        ];
    }
    if (empty($contents)) {
        $contents[] = ['role' => 'user', 'parts' => [['text' => 'Hello']]];
    }

    $payload = [
        'system_instruction' => ['parts' => [['text' => $systemText]]],
        'contents'           => $contents,
        'generationConfig'   => [
            'temperature'     => 0.7,
            'maxOutputTokens' => 1500,
            'thinkingConfig'  => ['thinkingBudget' => 0],
        ],
    ];

    $url = GEMINI_API_URL_BASE . '/' . GEMINI_MODEL . ':generateContent?key=' . urlencode(GEMINI_API_KEY);

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
    if ($hasCaBundle) $opts[CURLOPT_CAINFO] = $caBundle;
    else { $opts[CURLOPT_SSL_VERIFYPEER] = false; $opts[CURLOPT_SSL_VERIFYHOST] = 0; }
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
