<?php
/**
 * Plant Detective — daily AI-generated diagnostic mini-game
 *
 *   GET    ?user_id=X                            → today's snapshot { current_case?, stats, can_play_more }
 *   GET    ?user_id=X&action=stats               → stats only
 *   GET    ?user_id=X&action=history&limit=20    → recent solved cases (with correct answers + user's pick)
 *   POST   ?user_id=X&action=new                 → generate a brand-new case (returns case WITHOUT correct_index)
 *   POST   ?user_id=X&action=submit body{ case_id, chosen_index }
 *                                                → record answer; returns full case + feedback + updated stats
 */
ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

ini_set('display_errors', 0);
error_reporting(E_ALL);

register_shutdown_function(function () {
    $e = error_get_last();
    if ($e && in_array($e['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
        ob_clean();
        echo json_encode(['success' => false, 'message' => 'Fatal: ' . $e['message']]);
    }
});

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/groq.php';
require_once __DIR__ . '/../../config/http.php';

function respond($success, $message = '', $data = null, $code = 200) {
    ob_clean();
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit();
}

$db = (new Database())->getConnection();
if (!$db) respond(false, 'Database connection failed', null, 500);
ensureDetectiveTables($db);

$method  = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) respond(false, 'user_id required', null, 401);
$action  = isset($_GET['action']) ? strtolower(trim($_GET['action'])) : '';

try {
    if ($method === 'GET' && $action === 'stats')      respond(true, 'OK', getDetectiveStats($db, $user_id));
    if ($method === 'GET' && $action === 'history')    respond(true, 'OK', getDetectiveHistory($db, $user_id));
    if ($method === 'GET')                             respond(true, 'OK', getSnapshot($db, $user_id));
    if ($method === 'POST' && $action === 'new')       respond(true, 'Case generated', generateNewCase($db, $user_id));
    if ($method === 'POST' && $action === 'submit')    respond(true, 'Answer recorded', submitAnswer($db, $user_id));
    respond(false, 'Unknown action', null, 400);
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// ─────────────────────────────────────────────────────────────────────
function ensureDetectiveTables($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `plant_detective_cases` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` INT UNSIGNED NOT NULL,
            `difficulty` ENUM('easy','medium','hard') NOT NULL DEFAULT 'medium',
            `plant_subject` VARCHAR(120) NOT NULL DEFAULT '',
            `symptoms` TEXT NOT NULL,
            `environment` VARCHAR(255) DEFAULT NULL,
            `choices` TEXT NOT NULL,
            `correct_index` TINYINT UNSIGNED NOT NULL,
            `explanation` TEXT NOT NULL,
            `fun_fact` VARCHAR(500) DEFAULT NULL,
            `tags` VARCHAR(255) DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_user_created` (`user_id`, `created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }

    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `plant_detective_attempts` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `case_id` INT UNSIGNED NOT NULL,
            `user_id` INT UNSIGNED NOT NULL,
            `chosen_index` TINYINT UNSIGNED NOT NULL,
            `is_correct` TINYINT(1) NOT NULL DEFAULT 0,
            `answered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_case` (`case_id`),
            KEY `idx_user_time` (`user_id`, `answered_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }
}

// ─────────────────────────────────────────────────────────────────────
function getSnapshot($db, $user_id) {
    $stmt = $db->prepare("SELECT c.id, c.difficulty, c.plant_subject, c.symptoms, c.environment, c.choices, c.tags, c.created_at
                          FROM plant_detective_cases c
                          LEFT JOIN plant_detective_attempts a ON a.case_id = c.id
                          WHERE c.user_id = :uid AND a.id IS NULL
                          ORDER BY c.id DESC LIMIT 1");
    $stmt->execute([':uid' => $user_id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($current) {
        $current['choices'] = json_decode($current['choices'], true) ?: [];
    }

    return [
        'current_case' => $current ?: null,
        'stats'        => getDetectiveStats($db, $user_id),
    ];
}

// ─────────────────────────────────────────────────────────────────────
function getDetectiveStats($db, $user_id) {
    $stmt = $db->prepare("SELECT
                            COUNT(*)                                 AS total,
                            SUM(is_correct)                          AS correct,
                            SUM(CASE WHEN DATE(answered_at) = CURDATE() THEN 1 ELSE 0 END) AS today,
                            SUM(CASE WHEN DATE(answered_at) = CURDATE() AND is_correct = 1 THEN 1 ELSE 0 END) AS today_correct
                          FROM plant_detective_attempts WHERE user_id = :uid");
    $stmt->execute([':uid' => $user_id]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC) ?: [];
    $total   = intval($row['total']   ?? 0);
    $correct = intval($row['correct'] ?? 0);
    $today   = intval($row['today']   ?? 0);
    $today_c = intval($row['today_correct'] ?? 0);

    // current correct-streak (most recent attempts where is_correct = 1)
    $streak = 0;
    $s = $db->prepare("SELECT is_correct FROM plant_detective_attempts
                       WHERE user_id = :uid ORDER BY id DESC LIMIT 100");
    $s->execute([':uid' => $user_id]);
    foreach ($s->fetchAll(PDO::FETCH_COLUMN) as $isCorrect) {
        if ((int)$isCorrect === 1) $streak++; else break;
    }

    return [
        'total_solved'   => $total,
        'total_correct'  => $correct,
        'accuracy'       => $total > 0 ? round(($correct / $total) * 100) : 0,
        'today_solved'   => $today,
        'today_correct'  => $today_c,
        'current_streak' => $streak,
        'rank'           => rankFromTotals($total, $total > 0 ? ($correct / $total) : 0),
    ];
}

function rankFromTotals($total, $accuracyRatio) {
    if ($total >= 50 && $accuracyRatio >= 0.85) return 'Master Botanist';
    if ($total >= 25 && $accuracyRatio >= 0.75) return 'Expert Detective';
    if ($total >= 10 && $accuracyRatio >= 0.60) return 'Sharp Eye';
    if ($total >= 3)                            return 'Apprentice';
    return 'Rookie';
}

// ─────────────────────────────────────────────────────────────────────
function getDetectiveHistory($db, $user_id) {
    $limit = isset($_GET['limit']) ? max(1, min(50, intval($_GET['limit']))) : 20;
    $stmt = $db->prepare("SELECT c.id, c.difficulty, c.plant_subject, c.symptoms, c.environment,
                                 c.choices, c.correct_index, c.explanation, c.fun_fact, c.tags,
                                 a.chosen_index, a.is_correct, a.answered_at
                          FROM plant_detective_cases c
                          INNER JOIN plant_detective_attempts a ON a.case_id = c.id
                          WHERE c.user_id = :uid
                          ORDER BY a.id DESC LIMIT $limit");
    $stmt->execute([':uid' => $user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$r) {
        $r['choices'] = json_decode($r['choices'], true) ?: [];
    }
    return $rows;
}

// ─────────────────────────────────────────────────────────────────────
function generateNewCase($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $difficulty = isset($body['difficulty']) ? strtolower($body['difficulty']) : '';
    if (!in_array($difficulty, ['easy', 'medium', 'hard'], true)) {
        // Auto-pick based on user's recent accuracy
        $stats = getDetectiveStats($db, $user_id);
        $acc   = $stats['accuracy'];
        if ($acc >= 80 && $stats['total_solved'] >= 8)      $difficulty = 'hard';
        else if ($acc >= 60 && $stats['total_solved'] >= 3) $difficulty = 'medium';
        else                                                $difficulty = 'easy';
    }

    // Limit cases per day to keep it a "daily" feel (configurable — default 5/day for replay value)
    $today = $db->prepare("SELECT COUNT(*) FROM plant_detective_attempts WHERE user_id = :uid AND DATE(answered_at) = CURDATE()");
    $today->execute([':uid' => $user_id]);
    $todayCount = intval($today->fetchColumn());
    if ($todayCount >= 10) {
        throw new Exception('Daily case limit reached (10). Come back tomorrow!');
    }

    // Avoid duplicates by passing recent plant subjects + diagnoses as "do not repeat" context
    $recent = $db->prepare("SELECT plant_subject, choices, correct_index
                            FROM plant_detective_cases
                            WHERE user_id = :uid
                            ORDER BY id DESC LIMIT 12");
    $recent->execute([':uid' => $user_id]);
    $avoidLines = [];
    foreach ($recent->fetchAll(PDO::FETCH_ASSOC) as $r) {
        $ch = json_decode($r['choices'], true) ?: [];
        $correctText = $ch[intval($r['correct_index'])] ?? '';
        $avoidLines[] = '  • ' . trim($r['plant_subject'] . ' → ' . $correctText);
    }
    $avoidBlock = empty($avoidLines)
        ? "No prior cases — feel free to pick anything."
        : "AVOID repeating these recent cases (different plant AND different diagnosis):\n" . implode("\n", $avoidLines);

    [$caseData] = callGeminiForCase($difficulty, $avoidBlock);

    // Validate
    if (!isset($caseData['choices']) || !is_array($caseData['choices']) || count($caseData['choices']) !== 4) {
        throw new Exception('AI returned malformed case (need exactly 4 choices).');
    }
    $correctIdx = intval($caseData['correct_index']);
    if ($correctIdx < 0 || $correctIdx > 3) {
        throw new Exception('AI returned invalid correct_index.');
    }

    $tags = isset($caseData['tags']) && is_array($caseData['tags']) ? implode(',', array_slice($caseData['tags'], 0, 5)) : null;

    $ins = $db->prepare("INSERT INTO plant_detective_cases
        (user_id, difficulty, plant_subject, symptoms, environment, choices, correct_index, explanation, fun_fact, tags)
        VALUES (:uid, :diff, :plant, :symp, :env, :choices, :ci, :expl, :fun, :tags)");
    $ins->execute([
        ':uid'     => $user_id,
        ':diff'    => $difficulty,
        ':plant'   => mb_substr($caseData['plant_subject'] ?? 'Unknown plant', 0, 120),
        ':symp'    => $caseData['symptoms'] ?? '',
        ':env'     => isset($caseData['environment']) ? mb_substr($caseData['environment'], 0, 255) : null,
        ':choices' => json_encode($caseData['choices'], JSON_UNESCAPED_UNICODE),
        ':ci'      => $correctIdx,
        ':expl'    => $caseData['explanation'] ?? '',
        ':fun'     => isset($caseData['fun_fact']) ? mb_substr($caseData['fun_fact'], 0, 500) : null,
        ':tags'    => $tags,
    ]);
    $caseId = intval($db->lastInsertId());

    // Return WITHOUT revealing the correct answer or explanation
    return [
        'id'             => $caseId,
        'difficulty'     => $difficulty,
        'plant_subject'  => $caseData['plant_subject'] ?? '',
        'symptoms'       => $caseData['symptoms'] ?? '',
        'environment'    => $caseData['environment'] ?? null,
        'choices'        => $caseData['choices'],
        'tags'           => $tags,
        'today_count'    => $todayCount,
        'daily_limit'    => 10,
    ];
}

// ─────────────────────────────────────────────────────────────────────
function submitAnswer($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $caseId   = isset($body['case_id'])      ? intval($body['case_id'])      : 0;
    $chosen   = isset($body['chosen_index']) ? intval($body['chosen_index']) : -1;
    if ($caseId <= 0)                 respond(false, 'case_id required',      null, 400);
    if ($chosen < 0 || $chosen > 3)   respond(false, 'chosen_index must be 0-3', null, 400);

    $stmt = $db->prepare("SELECT * FROM plant_detective_cases WHERE id = :id AND user_id = :uid");
    $stmt->execute([':id' => $caseId, ':uid' => $user_id]);
    $case = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$case) respond(false, 'Case not found', null, 404);

    $existing = $db->prepare("SELECT chosen_index, is_correct FROM plant_detective_attempts WHERE case_id = :c");
    $existing->execute([':c' => $caseId]);
    $prev = $existing->fetch(PDO::FETCH_ASSOC);
    if ($prev) respond(false, 'Already answered', null, 409);

    $isCorrect = ($chosen === intval($case['correct_index'])) ? 1 : 0;
    $db->prepare("INSERT INTO plant_detective_attempts (case_id, user_id, chosen_index, is_correct)
                  VALUES (:c, :uid, :ch, :ok)")
       ->execute([':c' => $caseId, ':uid' => $user_id, ':ch' => $chosen, ':ok' => $isCorrect]);

    $choices = json_decode($case['choices'], true) ?: [];
    return [
        'case_id'        => $caseId,
        'chosen_index'   => $chosen,
        'correct_index'  => intval($case['correct_index']),
        'is_correct'     => (bool)$isCorrect,
        'correct_answer' => $choices[intval($case['correct_index'])] ?? '',
        'chosen_answer'  => $choices[$chosen] ?? '',
        'explanation'    => $case['explanation'],
        'fun_fact'       => $case['fun_fact'],
        'stats'          => getDetectiveStats($db, $user_id),
    ];
}

// ─────────────────────────────────────────────────────────────────────
// LLM call — returns one structured detective case
// ─────────────────────────────────────────────────────────────────────
function callGeminiForCase($difficulty, $avoidBlock) {
    $diffGuide = [
        'easy'   => "Symptoms are textbook and unambiguous (e.g., yellow lower leaves + soggy soil = overwatering). Distractors are clearly wrong to someone with basic plant knowledge.",
        'medium' => "Symptoms are realistic with one or two confounding signals. Distractors are plausible but distinguishable on the strongest clue.",
        'hard'   => "Symptoms could fit 2-3 of the 4 diagnoses. The correct answer is decided by ONE subtle but decisive detail (timing, leaf pattern, exact soil moisture). Make the user actually think.",
    ][$difficulty];

    $systemText =
        "You are a senior horticulturist designing a plant-diagnosis quiz for a hobbyist gardener app called Botanic Journal. " .
        "Your job: invent ONE realistic mini-case where a plant shows symptoms and the player picks the correct diagnosis from 4 choices.\n\n" .
        "STRICT RULES:\n" .
        "- 'plant_subject' = a real, common plant a hobbyist might own (e.g. 'Pothos', 'Tomato seedling', 'Fiddle Leaf Fig', 'Basil', 'Snake Plant', 'Rosemary', 'Monstera deliciosa'). Vary it across cases.\n" .
        "- 'symptoms' = 2-4 short observations a person could actually notice. Include AT LEAST one decisive clue (leaf location, color pattern, soil/touch, timing, room/light). 60-180 chars.\n" .
        "- 'environment' = 1 short sentence on care conditions (light, watering cadence, pot/soil) — optional but adds realism.\n" .
        "- 'choices' = EXACTLY 4 plausible diagnoses, each 2-7 words. ONE is correct, three are distractors. Each is distinct.\n" .
        "- 'correct_index' = integer 0..3, the index of the correct choice in 'choices'.\n" .
        "- 'explanation' = 2-4 sentences. Explain WHY the correct choice fits AND why the most-tempting distractor doesn't. Educational tone — like a teacher debriefing the player.\n" .
        "- 'fun_fact' = one short trivia line (≤140 chars) related to the plant or the correct diagnosis.\n" .
        "- 'tags' = up to 3 short tags like 'watering','pests','light','nutrient','disease'.\n\n" .
        "DIFFICULTY ($difficulty): " . $diffGuide . "\n\n" .
        $avoidBlock . "\n\n" .
        "Return ONLY the JSON object — no prose, no markdown.";

    $responseSchema = [
        'type' => 'object',
        'properties' => [
            'plant_subject'  => ['type' => 'string'],
            'symptoms'       => ['type' => 'string'],
            'environment'    => ['type' => 'string'],
            'choices'        => [
                'type' => 'array',
                'items' => ['type' => 'string'],
                'minItems' => 4, 'maxItems' => 4,
            ],
            'correct_index'  => ['type' => 'integer'],
            'explanation'    => ['type' => 'string'],
            'fun_fact'       => ['type' => 'string'],
            'tags'           => [
                'type' => 'array',
                'items' => ['type' => 'string'],
            ],
        ],
        'required' => ['plant_subject', 'symptoms', 'choices', 'correct_index', 'explanation'],
    ];

    // Strong randomness seed — embed entropy so Gemini truly varies output
    $seed = bin2hex(random_bytes(4));
    $userText = "Generate a fresh, never-before-seen plant detective case. Seed: $seed. " .
                "Pick a different plant + diagnosis combo than any listed above. Difficulty: $difficulty.";

    $text = groqChat($systemText, [['role' => 'user', 'content' => $userText]], [
        'temperature' => 1.1,
        'top_p'       => 0.95,
        'max_tokens'  => 1200,
        'json'        => true,
    ]);
    $clean = preg_replace('/^```(?:json)?\s*|\s*```$/m', '', trim($text));
    $parsed = json_decode($clean, true);
    if (!is_array($parsed)) throw new Exception('Groq returned non-JSON: ' . substr($text, 0, 300));

    return [$parsed];
}

// httpPostJson() lives in config/http.php (shared across endpoints).
