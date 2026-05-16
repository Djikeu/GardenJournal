<?php
/**
 * AI Garden Designer — generate a starter plant list + layout from a user's space description.
 *
 *   POST ?user_id=X
 *     body { zone, space_description, preferences, count? }
 *
 *   Returns:
 *     {
 *       suggestions: [
 *         { name, species, type, reason,
 *           encyclopedia_id?,    // present if matched to an encyclopedia plant
 *           user_plant_id?,      // present if matched to user's collection
 *           x_pos, y_pos, size   // suggested layout position
 *         }, ...
 *       ],
 *       summary: "..."
 *     }
 */

ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, OPTIONS");
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

function gdRespond($success, $message = '', $data = null, $code = 200) {
    ob_clean();
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit();
}

$db = (new Database())->getConnection();
if (!$db) gdRespond(false, 'Database connection failed', null, 500);

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) gdRespond(false, 'user_id required', null, 401);

if ($_SERVER['REQUEST_METHOD'] !== 'POST') gdRespond(false, 'Method not allowed', null, 405);

$body = json_decode(file_get_contents('php://input'), true);
if (!is_array($body)) gdRespond(false, 'Invalid body', null, 400);

$zone        = isset($body['zone']) ? strtolower(trim($body['zone'])) : '';
$space       = isset($body['space_description']) ? trim($body['space_description']) : '';
$preferences = isset($body['preferences']) ? trim($body['preferences']) : '';
$count       = isset($body['count']) ? max(3, min(10, intval($body['count']))) : 6;

$ALLOWED_ZONES = ['balcony', 'backyard', 'greenhouse', 'indoor', 'rooftop', 'other'];
if (!in_array($zone, $ALLOWED_ZONES)) gdRespond(false, 'Invalid zone', null, 400);
if ($space === '') gdRespond(false, 'space_description is required', null, 400);

// ── Zone microclimate hints (same vocabulary as garden-map-tip) ─────────
$ZONE_INFO = [
    'balcony'    => 'Outdoor balcony — partial sun, exposed to wind, fluctuating temperatures, lower humidity unless misted.',
    'backyard'   => 'Open backyard ground — full sun much of the day, exposed to wind and rain, natural temperature swings.',
    'greenhouse' => 'Greenhouse — high humidity (60-80%), stable warm temperatures (20-30°C), filtered bright light.',
    'indoor'     => 'Indoor room — moderate filtered light through windows, stable temperature (18-24°C), low humidity (30-45%).',
    'rooftop'    => 'Rooftop — intense direct sun all day, strong wind exposure, dry hot conditions, large temperature swings.',
    'other'      => 'A custom area — assume mixed conditions.',
];

// ── Fetch encyclopedia plants so the model can pick from a real catalogue ──
// (Limit to ~80 to keep prompt size sane.)
$encStmt = $db->prepare("SELECT id, name, species, type, light_requirements, watering_schedule, difficulty
                         FROM plants
                         WHERE (is_encyclopedia = 1 OR user_id IS NULL)
                         ORDER BY id ASC
                         LIMIT 80");
$encStmt->execute();
$catalogue = $encStmt->fetchAll(PDO::FETCH_ASSOC);

// Build a compact catalogue string for the prompt
$catalogueLines = [];
foreach ($catalogue as $p) {
    $catalogueLines[] = "  - id=" . $p['id'] . " | " . $p['name']
        . (!empty($p['species']) ? " (" . $p['species'] . ")" : '')
        . " | type=" . ($p['type'] ?? '?')
        . " | light=" . ($p['light_requirements'] ?? '?')
        . " | water=" . ($p['watering_schedule'] ?? '?')
        . " | difficulty=" . ($p['difficulty'] ?? '?');
}
$catalogueStr = implode("\n", $catalogueLines);

// ── Build Gemini prompt ────────────────────────────────────────────────
$systemText =
    "You are an expert horticulturalist and garden designer. The user describes a real space and " .
    "what they want from it. Propose a starter plant collection that fits their microclimate and " .
    "preferences, then suggest a sensible spatial layout on a 900×560 pixel canvas.\n\n" .
    "RULES:\n" .
    "- Propose EXACTLY {$count} plants.\n" .
    "- Prefer plants from the user's encyclopedia catalogue when a good match exists — set encyclopedia_id.\n" .
    "- If no good match exists in the catalogue, you may suggest a plant by name with encyclopedia_id=null.\n" .
    "- Layout: pick coordinates inside 50..820 horizontally and 80..420 vertically. Cluster taller/back plants " .
    "  toward the back (smaller y), shorter/front plants toward the front (larger y). Space tiles ≥110 px apart.\n" .
    "- Use a size of 72 for normal plants, 88 for showcase / larger plants.\n" .
    "- 'reason' is one short sentence explaining why this plant fits this exact spot/space.\n" .
    "- 'summary' is 2 sentences summarizing the overall design approach for this user.\n" .
    "- Be honest about constraints. If user says 'cat-safe', avoid lilies, sago palm, pothos, etc.";

$userText =
    "MICROCLIMATE: " . $ZONE_INFO[$zone] . "\n\n" .
    "USER'S SPACE DESCRIPTION:\n" . $space . "\n\n" .
    "USER'S PREFERENCES:\n" . ($preferences !== '' ? $preferences : '(none specified)') . "\n\n" .
    "ENCYCLOPEDIA CATALOGUE (pick from here when possible):\n" . $catalogueStr;

$responseSchema = [
    'type' => 'object',
    'properties' => [
        'summary' => ['type' => 'string'],
        'suggestions' => [
            'type' => 'array',
            'items' => [
                'type' => 'object',
                'properties' => [
                    'name'            => ['type' => 'string'],
                    'species'         => ['type' => 'string'],
                    'type'            => ['type' => 'string', 'enum' => ['indoor','outdoor','succulent','tropical','vegetable','flowering','herb']],
                    'encyclopedia_id' => ['type' => 'integer'],
                    'reason'          => ['type' => 'string'],
                    'x_pos'           => ['type' => 'number'],
                    'y_pos'           => ['type' => 'number'],
                    'size'            => ['type' => 'integer'],
                ],
                'required' => ['name', 'type', 'reason', 'x_pos', 'y_pos'],
            ],
        ],
    ],
    'required' => ['summary', 'suggestions'],
];

$payload = [
    'system_instruction' => ['parts' => [['text' => $systemText]]],
    'contents' => [[
        'role'  => 'user',
        'parts' => [['text' => $userText]],
    ]],
    'generationConfig' => [
        'temperature'      => 0.7,
        'maxOutputTokens'  => 2500,
        'thinkingConfig'   => ['thinkingBudget' => 0],
        'responseMimeType' => 'application/json',
        'responseSchema'   => $responseSchema,
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

$bodyResp = curl_exec($ch);
$code     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($bodyResp === false || $code < 200 || $code >= 300) {
    $err = json_decode($bodyResp, true);
    gdRespond(false, $err['error']['message'] ?? "Gemini error HTTP $code", null, 500);
}

$resp = json_decode($bodyResp, true);
$text = trim($resp['candidates'][0]['content']['parts'][0]['text'] ?? '');
$clean = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', $text);
$parsed = json_decode($clean, true);

if (!is_array($parsed) || !isset($parsed['suggestions'])) {
    gdRespond(false, 'AI response could not be parsed', ['raw' => $text], 500);
}

// ── Post-process suggestions: validate / clamp coordinates, look up user plants ──
$userPlantsStmt = $db->prepare("SELECT id, name, encyclopedia_id FROM plants WHERE user_id = :uid");
$userPlantsStmt->execute([':uid' => $user_id]);
$userPlants = $userPlantsStmt->fetchAll(PDO::FETCH_ASSOC);
$byEnc = [];
foreach ($userPlants as $up) {
    if (!empty($up['encyclopedia_id'])) $byEnc[(int)$up['encyclopedia_id']] = $up;
}

$out = [];
foreach ($parsed['suggestions'] as $s) {
    $x = isset($s['x_pos']) ? floatval($s['x_pos']) : 100;
    $y = isset($s['y_pos']) ? floatval($s['y_pos']) : 200;
    $size = isset($s['size']) ? intval($s['size']) : 72;

    // Clamp to canvas
    $x = max(0, min(900 - $size, $x));
    $y = max(0, min(560 - $size, $y));

    $encId = isset($s['encyclopedia_id']) ? intval($s['encyclopedia_id']) : null;
    $userPlantId = null;
    $userPlantName = null;

    if ($encId && isset($byEnc[$encId])) {
        $userPlantId   = (int)$byEnc[$encId]['id'];
        $userPlantName = $byEnc[$encId]['name'];
    }

    $out[] = [
        'name'              => $s['name'] ?? 'Plant',
        'species'           => $s['species'] ?? '',
        'type'              => $s['type'] ?? 'indoor',
        'reason'            => $s['reason'] ?? '',
        'encyclopedia_id'   => $encId,
        'user_plant_id'     => $userPlantId,
        'user_plant_name'   => $userPlantName,
        'in_user_collection'=> $userPlantId !== null,
        'x_pos'             => $x,
        'y_pos'             => $y,
        'size'              => max(48, min(120, $size)),
    ];
}

gdRespond(true, 'OK', [
    'summary'     => $parsed['summary'] ?? '',
    'suggestions' => $out,
    'zone'        => $zone,
]);
