<?php
/**
 * Garden Map AI tip — short, plant-and-zone-aware recommendation.
 *
 *   GET ?user_id=X&plant_id=Y&zone=balcony[&force=1]
 *
 * Caches per (user_id, plant_id, zone) so the same recommendation isn't billed twice.
 * `force=1` busts the cache.
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

function gmtRespond($success, $message = '', $data = null, $code = 200) {
    ob_clean();
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit();
}

$db = (new Database())->getConnection();
if (!$db) gmtRespond(false, 'Database connection failed', null, 500);

// Auto-create the cache table
try {
    $db->exec("CREATE TABLE IF NOT EXISTS `garden_map_tips` (
        `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        `user_id` INT UNSIGNED NOT NULL,
        `plant_id` INT UNSIGNED NOT NULL,
        `zone` VARCHAR(40) NOT NULL,
        `verdict` ENUM('great','okay','poor','unknown') DEFAULT 'unknown',
        `tip` TEXT NOT NULL,
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (`id`),
        UNIQUE KEY `uniq_user_plant_zone` (`user_id`, `plant_id`, `zone`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (Exception $e) { /* ignore */ }

$user_id  = isset($_GET['user_id'])  ? intval($_GET['user_id'])  : null;
$plant_id = isset($_GET['plant_id']) ? intval($_GET['plant_id']) : null;
$zone     = isset($_GET['zone'])     ? strtolower(trim($_GET['zone'])) : '';
$force    = !empty($_GET['force']);

$ALLOWED_ZONES = ['balcony', 'backyard', 'greenhouse', 'indoor', 'rooftop', 'other'];

if (!$user_id || !$plant_id || !in_array($zone, $ALLOWED_ZONES)) {
    gmtRespond(false, 'user_id, plant_id, and valid zone are required', null, 400);
}

// Check cache
if (!$force) {
    $stmt = $db->prepare("SELECT verdict, tip, created_at FROM garden_map_tips
                          WHERE user_id = :u AND plant_id = :p AND zone = :z LIMIT 1");
    $stmt->execute([':u' => $user_id, ':p' => $plant_id, ':z' => $zone]);
    $cached = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($cached) gmtRespond(true, 'Cached', $cached);
}

// Fetch the plant
$pStmt = $db->prepare("SELECT id, name, species, type, light_requirements, watering_schedule,
                              temperature_range, humidity_requirements, description
                       FROM plants WHERE id = :p AND user_id = :u");
$pStmt->execute([':p' => $plant_id, ':u' => $user_id]);
$plant = $pStmt->fetch(PDO::FETCH_ASSOC);
if (!$plant) gmtRespond(false, 'Plant not found in your collection', null, 404);

// Microclimate definitions — give the model concrete environmental context per zone
$ZONE_INFO = [
    'balcony'    => "Outdoor balcony — partial sun (often shaded by railings or walls), exposed to wind, fluctuating temperatures, lower humidity unless misted.",
    'backyard'   => "Open backyard ground — full sun for much of the day, exposed to wind and rain, natural seasonal temperature swings, ground-level humidity.",
    'greenhouse' => "Greenhouse — controlled high humidity (60–80%), stable warm temperatures (20–30°C), filtered bright light, no wind, protected from pests.",
    'indoor'     => "Indoor room — moderate filtered light through windows, stable comfortable temperature (18–24°C), low humidity (30–45%), no wind.",
    'rooftop'    => "Rooftop — intense direct sun all day, strong wind exposure, dry hot conditions, large temperature swings, no overhead shade.",
    'other'      => "A custom outdoor or indoor area — assume mixed conditions.",
];
$zoneDesc = $ZONE_INFO[$zone];

// Build the Gemini call
try {
    $systemText =
        "You are a horticulturalist giving a quick microclimate fit assessment for ONE plant " .
        "in ONE specific spot of a user's garden. Respond with a JSON object with these exact keys:\n" .
        "  \"verdict\":  one of 'great' | 'okay' | 'poor' | 'unknown' — how well this plant fits this microclimate.\n" .
        "  \"tip\":      a single short paragraph (2-3 sentences, max ~60 words) of practical advice " .
        "    specific to this plant in this location. Be concrete. Examples:\n" .
        "    - If a great fit: highlight why and what to monitor.\n" .
        "    - If poor: warn what will go wrong AND suggest a small mitigation (e.g. 'mist daily', 'move to shade in summer').\n" .
        "  Plain text, no markdown, no emoji. Never invent species details.";

    $plantSummary =
        "Plant: " . $plant['name'] .
        (!empty($plant['species']) ? " (" . $plant['species'] . ")" : "") .
        "\nType: " . ($plant['type'] ?? 'unknown') .
        "\nLight needs: " . ($plant['light_requirements'] ?? 'unknown') .
        "\nWater needs: " . ($plant['watering_schedule'] ?? 'unknown') .
        "\nTemperature range: " . ($plant['temperature_range'] ?? 'unknown') .
        "\nHumidity needs: " . ($plant['humidity_requirements'] ?? 'unknown');

    $userText = "Microclimate of the chosen spot:\n$zoneDesc\n\n$plantSummary";

    $responseSchema = [
        'type' => 'object',
        'properties' => [
            'verdict' => ['type' => 'string', 'enum' => ['great', 'okay', 'poor', 'unknown']],
            'tip'     => ['type' => 'string'],
        ],
        'required' => ['verdict', 'tip'],
    ];

    $payload = [
        'system_instruction' => ['parts' => [['text' => $systemText]]],
        'contents' => [[
            'role'  => 'user',
            'parts' => [['text' => $userText]],
        ]],
        'generationConfig' => [
            'temperature'      => 0.5,
            'maxOutputTokens'  => 800,
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
        CURLOPT_TIMEOUT        => 30,
    ];
    if ($hasCaBundle) $opts[CURLOPT_CAINFO] = $caBundle;
    else { $opts[CURLOPT_SSL_VERIFYPEER] = false; $opts[CURLOPT_SSL_VERIFYHOST] = 0; }
    curl_setopt_array($ch, $opts);

    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $code < 200 || $code >= 300) {
        $err = json_decode($body, true);
        throw new Exception($err['error']['message'] ?? "Gemini error: HTTP $code");
    }

    $resp = json_decode($body, true);
    $text = trim($resp['candidates'][0]['content']['parts'][0]['text'] ?? '');
    $clean = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', $text);
    $parsed = json_decode($clean, true);

    $verdict = is_array($parsed) && isset($parsed['verdict']) ? strtolower($parsed['verdict']) : 'unknown';
    if (!in_array($verdict, ['great', 'okay', 'poor', 'unknown'])) $verdict = 'unknown';
    $tip = is_array($parsed) && isset($parsed['tip']) ? trim($parsed['tip']) : 'No advice available.';

    // Cache (delete + insert to handle force-refresh cleanly)
    $db->prepare("DELETE FROM garden_map_tips WHERE user_id = :u AND plant_id = :p AND zone = :z")
       ->execute([':u' => $user_id, ':p' => $plant_id, ':z' => $zone]);
    $db->prepare("INSERT INTO garden_map_tips (user_id, plant_id, zone, verdict, tip)
                  VALUES (:u, :p, :z, :v, :t)")
       ->execute([':u' => $user_id, ':p' => $plant_id, ':z' => $zone, ':v' => $verdict, ':t' => $tip]);

    gmtRespond(true, 'Generated', [
        'verdict' => $verdict,
        'tip' => $tip,
        'created_at' => date('Y-m-d H:i:s'),
    ]);

} catch (Exception $e) {
    gmtRespond(false, $e->getMessage(), null, 500);
}
