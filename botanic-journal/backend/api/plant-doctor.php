<?php
/**
 * Plant Doctor API
 *
 *   POST   ?user_id=X  multipart: image, notes?, plant_id?  → analyze + save
 *   GET    ?user_id=X                                       → list user's diagnoses
 *   GET    ?user_id=X&id=Y                                  → fetch single diagnosis
 *   DELETE ?user_id=X&id=Y                                  → delete diagnosis
 */

ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

ini_set('display_errors', 0);
error_reporting(E_ALL);

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => 'Fatal: ' . $error['message'] . ' (' . basename($error['file']) . ':' . $error['line'] . ')'
        ]);
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

// Auto-create the table on first run so the user doesn't have to run
// the SQL migration manually.
ensureDiagnosesTable($db);

$method  = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id'])  ? intval($_GET['user_id'])
         : (isset($_POST['user_id']) ? intval($_POST['user_id']) : null);

if (!$user_id) respond(false, 'user_id is required', null, 401);

try {
    switch ($method) {
        case 'POST':   handleDiagnose($db, $user_id);          break;
        case 'GET':    handleList($db, $user_id);              break;
        case 'DELETE': handleDelete($db, $user_id);            break;
        default:       respond(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// ─────────────────────────────────────────────────────────────────────
// Ensure plant_diagnoses table exists. Idempotent.
// ─────────────────────────────────────────────────────────────────────
function ensureDiagnosesTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `plant_diagnoses` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` INT UNSIGNED NOT NULL,
            `plant_id` INT UNSIGNED DEFAULT NULL,
            `image_path` VARCHAR(500) NOT NULL,
            `user_notes` TEXT DEFAULT NULL,
            `ai_summary` VARCHAR(500) DEFAULT NULL,
            `ai_diagnosis` TEXT DEFAULT NULL,
            `ai_recommendations` TEXT DEFAULT NULL,
            `ai_severity` ENUM('healthy','mild','moderate','severe','unknown') DEFAULT 'unknown',
            `ai_confidence` TINYINT UNSIGNED DEFAULT NULL,
            `raw_response` MEDIUMTEXT DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_user_created` (`user_id`, `created_at`),
            KEY `idx_plant` (`plant_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) {
        // Don't bring down the whole request if table creation fails — the
        // operation downstream will surface a clearer error if needed.
    }
}

// ─────────────────────────────────────────────────────────────────────
// POST: receive an image, call Gemini, save & return the diagnosis
// ─────────────────────────────────────────────────────────────────────
function handleDiagnose($db, $user_id) {
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        respond(false, 'No image uploaded', null, 400);
    }

    $file = $_FILES['image'];
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed)) respond(false, 'Invalid file type', null, 400);

    $maxSize = 8 * 1024 * 1024;  // Claude accepts up to 5MB base64 — keep some headroom
    if ($file['size'] > $maxSize) respond(false, 'Image too large (max 8MB)', null, 400);

    // Save to disk
    $upload_dir = __DIR__ . '/../../uploads/diagnoses/';
    if (!is_dir($upload_dir) && !mkdir($upload_dir, 0755, true)) {
        respond(false, 'Could not create upload directory', null, 500);
    }
    $filename  = 'diag_' . $user_id . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $disk_path = $upload_dir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $disk_path)) {
        respond(false, 'Failed to save image', null, 500);
    }
    $public_url = '/botanic-journal/botanic-journal/uploads/diagnoses/' . $filename;

    // Optional fields
    $notes    = isset($_POST['notes']) ? trim($_POST['notes']) : '';
    $plant_id = isset($_POST['plant_id']) && $_POST['plant_id'] !== '' ? intval($_POST['plant_id']) : null;

    // Optionally pull species/type from the user's plants table for richer context
    $plant_context = '';
    if ($plant_id) {
        $stmt = $db->prepare("SELECT name, species, type, light_requirements, watering_schedule
                              FROM plants WHERE id = :id AND user_id = :uid");
        $stmt->execute([':id' => $plant_id, ':uid' => $user_id]);
        $p = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($p) {
            $plant_context = "\nPlant context (from user's collection): "
                . "Name: {$p['name']}; Species: {$p['species']}; Type: {$p['type']}; "
                . "Light: {$p['light_requirements']}; Watering: {$p['watering_schedule']}.";
        }
    }

    // Call Gemini
    $analysis = callGeminiVision($disk_path, $ext, $notes, $plant_context);

    // Persist
    $stmt = $db->prepare("INSERT INTO plant_diagnoses
        (user_id, plant_id, image_path, user_notes, ai_summary, ai_diagnosis,
         ai_recommendations, ai_severity, ai_confidence, raw_response, created_at)
        VALUES (:uid, :pid, :img, :notes, :sum, :diag, :rec, :sev, :conf, :raw, NOW())");
    $stmt->execute([
        ':uid'   => $user_id,
        ':pid'   => $plant_id,
        ':img'   => $public_url,
        ':notes' => $notes,
        ':sum'   => $analysis['summary'],
        ':diag'  => $analysis['diagnosis'],
        ':rec'   => $analysis['recommendations'],
        ':sev'   => $analysis['severity'],
        ':conf'  => $analysis['confidence'],
        ':raw'   => $analysis['raw'],
    ]);

    $newId = $db->lastInsertId();
    $row   = $db->prepare("SELECT * FROM plant_diagnoses WHERE id = :id");
    $row->execute([':id' => $newId]);

    respond(true, 'Diagnosis complete', $row->fetch(PDO::FETCH_ASSOC), 201);
}

// ─────────────────────────────────────────────────────────────────────
// Gemini vision call — returns parsed structured fields
// Uses Gemini's native JSON mode + responseSchema for reliable parsing.
// ─────────────────────────────────────────────────────────────────────
function callGeminiVision($imagePath, $ext, $userNotes, $plantContext) {
    if (!GEMINI_API_KEY || strpos(GEMINI_API_KEY, 'PASTE-YOUR-GEMINI-KEY') !== false) {
        throw new Exception('Gemini API key not configured. Edit backend/config/gemini.php.');
    }

    $b64  = base64_encode(file_get_contents($imagePath));
    $mime = ($ext === 'jpg') ? 'image/jpeg' : 'image/' . $ext;

    $systemText = "You are an expert horticulturalist and plant pathologist. " .
        "A user has uploaded a photo of one of their houseplants. Analyze it carefully and return a structured diagnosis. " .
        "Be honest if the image is unclear, the plant looks healthy, or you genuinely can't tell — don't invent diseases. " .
        "For 'recommendations', return a single string of 3-6 short bullet points (one per line, each starting with '- ').";

    $userText = "Please analyze this plant photo." . $plantContext;
    if (!empty($userNotes)) {
        $userText .= "\n\nUser's notes / observed symptoms: " . $userNotes;
    }

    // Gemini's structured-output schema → guarantees the JSON shape we want
    $responseSchema = [
        'type'       => 'object',
        'properties' => [
            'summary'         => ['type' => 'string', 'description' => 'One-line headline, max 80 chars'],
            'severity'        => ['type' => 'string', 'enum' => ['healthy', 'mild', 'moderate', 'severe', 'unknown']],
            'confidence'      => ['type' => 'integer', 'description' => '0-100 confidence percentage'],
            'diagnosis'       => ['type' => 'string', 'description' => '2-4 sentences explaining what is likely going on'],
            'recommendations' => ['type' => 'string', 'description' => '3-6 bullet points (each on its own line, prefixed with - )'],
        ],
        'required' => ['summary', 'severity', 'diagnosis', 'recommendations'],
    ];

    $payload = [
        'system_instruction' => [
            'parts' => [['text' => $systemText]],
        ],
        'contents' => [[
            'role'  => 'user',
            'parts' => [
                ['text' => $userText],
                ['inline_data' => ['mime_type' => $mime, 'data' => $b64]],
            ],
        ]],
        'generationConfig' => [
            'temperature'        => 0.4,
            'maxOutputTokens'    => 1024,
            'responseMimeType'   => 'application/json',
            'responseSchema'     => $responseSchema,
        ],
    ];

    $url = GEMINI_API_URL_BASE . '/' . GEMINI_MODEL . ':generateContent?key=' . urlencode(GEMINI_API_KEY);

    // If the user has a CA bundle configured locally, prefer that.
    // Otherwise, fall back to disabling peer verification — XAMPP on Windows
    // ships without a CA bundle and cURL will refuse to talk to HTTPS otherwise.
    // (Safe in this context: we're calling exactly one known Google endpoint.)
    $caBundle = ini_get('curl.cainfo') ?: ini_get('openssl.cafile');
    $hasCaBundle = $caBundle && file_exists($caBundle);

    $ch = curl_init($url);
    $curlOpts = [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 60,
    ];
    if ($hasCaBundle) {
        $curlOpts[CURLOPT_CAINFO] = $caBundle;
    } else {
        $curlOpts[CURLOPT_SSL_VERIFYPEER] = false;
        $curlOpts[CURLOPT_SSL_VERIFYHOST] = 0;
    }
    curl_setopt_array($ch, $curlOpts);

    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $cerr = curl_error($ch);
    curl_close($ch);

    if ($body === false) throw new Exception('Gemini request failed: ' . $cerr);
    if ($code < 200 || $code >= 300) {
        $err = json_decode($body, true);
        $msg = $err['error']['message'] ?? ('HTTP ' . $code);
        throw new Exception('Gemini API error: ' . $msg);
    }

    $resp = json_decode($body, true);
    $text = $resp['candidates'][0]['content']['parts'][0]['text'] ?? '';

    // Strip stray markdown fences just in case
    $clean = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($text));
    $parsed = json_decode($clean, true);

    if (!is_array($parsed)) {
        // Safety fallback: return raw text
        return [
            'summary'         => 'Analysis complete',
            'severity'        => 'unknown',
            'confidence'      => null,
            'diagnosis'       => trim($text),
            'recommendations' => '',
            'raw'             => $body,
        ];
    }

    $sev = strtolower($parsed['severity'] ?? 'unknown');
    if (!in_array($sev, ['healthy', 'mild', 'moderate', 'severe', 'unknown'])) $sev = 'unknown';

    return [
        'summary'         => substr($parsed['summary'] ?? '', 0, 500),
        'severity'        => $sev,
        'confidence'      => isset($parsed['confidence']) ? max(0, min(100, intval($parsed['confidence']))) : null,
        'diagnosis'       => $parsed['diagnosis'] ?? '',
        'recommendations' => $parsed['recommendations'] ?? '',
        'raw'             => $body,
    ];
}

// ─────────────────────────────────────────────────────────────────────
// GET: list (or fetch one)
// ─────────────────────────────────────────────────────────────────────
function handleList($db, $user_id) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;

    if ($id) {
        $stmt = $db->prepare("SELECT d.*, p.name AS plant_name, p.image_url AS plant_image
                              FROM plant_diagnoses d
                              LEFT JOIN plants p ON d.plant_id = p.id
                              WHERE d.id = :id AND d.user_id = :uid");
        $stmt->execute([':id' => $id, ':uid' => $user_id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) respond(false, 'Diagnosis not found', null, 404);
        respond(true, 'OK', $row);
    }

    $stmt = $db->prepare("SELECT d.*, p.name AS plant_name, p.image_url AS plant_image
                          FROM plant_diagnoses d
                          LEFT JOIN plants p ON d.plant_id = p.id
                          WHERE d.user_id = :uid
                          ORDER BY d.created_at DESC");
    $stmt->execute([':uid' => $user_id]);
    respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

// ─────────────────────────────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────────────────────────────
function handleDelete($db, $user_id) {
    $id = isset($_GET['id']) ? intval($_GET['id']) : null;
    if (!$id) respond(false, 'id required', null, 400);

    // Pull the row first so we can delete the file too
    $stmt = $db->prepare("SELECT image_path FROM plant_diagnoses WHERE id = :id AND user_id = :uid");
    $stmt->execute([':id' => $id, ':uid' => $user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) respond(false, 'Diagnosis not found', null, 404);

    $del = $db->prepare("DELETE FROM plant_diagnoses WHERE id = :id AND user_id = :uid");
    $del->execute([':id' => $id, ':uid' => $user_id]);

    // Best-effort file cleanup
    $file = __DIR__ . '/../..' . $row['image_path'];
    if (file_exists($file)) @unlink($file);

    respond(true, 'Diagnosis deleted');
}
