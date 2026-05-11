<?php
/**
 * Daily Care Note — Gemini-generated personalized note shown on the dashboard
 *
 *   GET    ?user_id=X[&weather=clear&temp=22&humidity=60][&force=1]
 *           Returns today's note (cached) or generates a fresh one.
 *           Optional weather params provide context; if absent the note focuses on
 *           the user's plants & pending tasks.
 *           force=1 bypasses the cache (useful for a manual "regenerate" button).
 */

ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, OPTIONS");
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
ensureNoteTable($db);

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) respond(false, 'user_id required', null, 401);

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(false, 'Method not allowed', null, 405);

$today = date('Y-m-d');
$force = !empty($_GET['force']);

// Cached?
if (!$force) {
    $stmt = $db->prepare("SELECT * FROM daily_care_notes
                          WHERE user_id = :uid AND for_date = :d
                          ORDER BY id DESC LIMIT 1");
    $stmt->execute([':uid' => $user_id, ':d' => $today]);
    $cached = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($cached) respond(true, 'Cached', $cached);
}

// Build context
$weather  = isset($_GET['weather'])  ? trim($_GET['weather'])  : '';
$temp     = isset($_GET['temp'])     ? trim($_GET['temp'])     : '';
$humidity = isset($_GET['humidity']) ? trim($_GET['humidity']) : '';

$context = buildContext($db, $user_id, $weather, $temp, $humidity);

try {
    $note = callGeminiNote($context);
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// Save (overwriting any existing for today via INSERT then optional cleanup)
$db->prepare("DELETE FROM daily_care_notes WHERE user_id = :uid AND for_date = :d")
   ->execute([':uid' => $user_id, ':d' => $today]);

$ins = $db->prepare("INSERT INTO daily_care_notes (user_id, for_date, note, weather_summary, created_at)
                     VALUES (:uid, :d, :n, :w, NOW())");
$ins->execute([
    ':uid' => $user_id,
    ':d'   => $today,
    ':n'   => $note,
    ':w'   => $weather ? "$weather, $temp" . "°C, $humidity% humidity" : '',
]);

$row = $db->prepare("SELECT * FROM daily_care_notes WHERE id = :id");
$row->execute([':id' => $db->lastInsertId()]);
respond(true, 'Generated', $row->fetch(PDO::FETCH_ASSOC));

// ─────────────────────────────────────────────────────────────────────
function ensureNoteTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `daily_care_notes` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` INT UNSIGNED NOT NULL,
            `for_date` DATE NOT NULL,
            `note` TEXT NOT NULL,
            `weather_summary` VARCHAR(200) DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_user_date` (`user_id`, `for_date`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }
}

function buildContext($db, $user_id, $weather, $temp, $humidity) {
    // Plants summary
    $stmt = $db->prepare("SELECT name, species, type, light_requirements, watering_schedule, status, last_watered
                          FROM plants WHERE user_id = :uid
                          ORDER BY created_at DESC LIMIT 25");
    $stmt->execute([':uid' => $user_id]);
    $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Pending tasks (today + overdue)
    $stmt = $db->prepare("SELECT t.title, t.type, t.priority, t.due_date, p.name AS plant_name
                          FROM tasks t LEFT JOIN plants p ON t.plant_id = p.id
                          WHERE t.user_id = :uid AND t.completed = 0
                            AND (t.due_date IS NULL OR t.due_date <= CURDATE())
                          ORDER BY t.priority = 'high' DESC, t.due_date ASC
                          LIMIT 10");
    $stmt->execute([':uid' => $user_id]);
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $lines = [];

    if ($weather || $temp || $humidity) {
        $lines[] = "Today's weather: " . trim("$weather $temp" . ($temp !== '' ? '°C' : '') . ($humidity !== '' ? ", $humidity% humidity" : ''));
    }

    if (empty($plants)) {
        $lines[] = "The user has not added any plants yet — encourage them gently to start a collection.";
    } else {
        $lines[] = "User's plants (" . count($plants) . "):";
        foreach ($plants as $p) {
            $bits = [$p['name']];
            if (!empty($p['type']))               $bits[] = '(' . $p['type'] . ')';
            if (!empty($p['watering_schedule']))  $bits[] = 'water: ' . $p['watering_schedule'];
            if (!empty($p['last_watered']))       $bits[] = 'last watered: ' . $p['last_watered'];
            if (!empty($p['status']) && $p['status'] !== 'healthy') $bits[] = 'status: ' . $p['status'];
            $lines[] = '  • ' . implode(' ', $bits);
        }
    }

    if (!empty($tasks)) {
        $lines[] = "Pending tasks for today/overdue:";
        foreach ($tasks as $t) {
            $bits = ['"' . $t['title'] . '"'];
            if (!empty($t['plant_name'])) $bits[] = 'for ' . $t['plant_name'];
            if (!empty($t['priority']))   $bits[] = '[' . $t['priority'] . ']';
            $lines[] = '  • ' . implode(' ', $bits);
        }
    }

    return implode("\n", $lines);
}

function callGeminiNote($context) {
    if (!GEMINI_API_KEY || strpos(GEMINI_API_KEY, 'PASTE-YOUR-GEMINI-KEY') !== false) {
        throw new Exception('Gemini API key not configured. Edit backend/config/gemini.php.');
    }

    $systemText =
        "You are writing a single short, warm, personalized daily care note for a plant owner. " .
        "Look at their plants, their pending tasks, and today's weather. " .
        "Output 2-3 sentences (NOT bullet points, NOT a list — flowing prose). " .
        "Be specific: name 1-2 actual plants, give a concrete suggestion. " .
        "If the weather is hot/dry: suggest watering or misting. " .
        "If raining: suggest skipping outdoor watering. " .
        "If everything looks fine: be encouraging and suggest one nice ritual (rotate a pot, wipe leaves). " .
        "Tone: friendly knowledgeable friend, never bossy. No greeting (\"Hi!\") and no signoff. " .
        "Plain text only — no markdown, no emoji.";

    $payload = [
        'system_instruction' => ['parts' => [['text' => $systemText]]],
        'contents' => [[
            'role'  => 'user',
            'parts' => [['text' => "Context for today:\n" . $context]],
        ]],
        'generationConfig' => [
            'temperature'     => 0.8,
            'maxOutputTokens' => 250,
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
        CURLOPT_TIMEOUT        => 45,
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
    $text = trim($resp['candidates'][0]['content']['parts'][0]['text'] ?? '');
    return $text !== '' ? $text : "Take a moment with your plants today — even a quiet check-in counts.";
}
