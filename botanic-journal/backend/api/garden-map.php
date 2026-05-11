<?php
/**
 * Garden Map Designer — per-zone plant placements (drag-and-drop layouts)
 *
 *   GET    ?user_id=X[&zone=balcony]              → return placements for zone (default: 'balcony')
 *                                                   or all zones if zone omitted
 *   POST   ?user_id=X  body { zone, placements }  → replace all placements for that zone
 *   DELETE ?user_id=X&zone=balcony                → clear all placements in a zone
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

function respond($success, $message = '', $data = null, $code = 200) {
    ob_clean();
    http_response_code($code);
    echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
    exit();
}

$db = (new Database())->getConnection();
if (!$db) respond(false, 'Database connection failed', null, 500);
ensureMapTable($db);

$method  = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    if (is_array($body) && isset($body['user_id'])) $user_id = intval($body['user_id']);
}
if (!$user_id) respond(false, 'user_id required', null, 401);

$ALLOWED_ZONES = ['balcony', 'backyard', 'greenhouse', 'indoor', 'rooftop', 'other'];

try {
    switch ($method) {
        case 'GET':    handleGet($db, $user_id, $ALLOWED_ZONES);    break;
        case 'POST':   handleSave($db, $user_id, $ALLOWED_ZONES);   break;
        case 'DELETE': handleDelete($db, $user_id, $ALLOWED_ZONES); break;
        default:       respond(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// ─────────────────────────────────────────────────────────────────────
function ensureMapTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `garden_map_placements` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `user_id` INT UNSIGNED NOT NULL,
            `zone` VARCHAR(40) NOT NULL,
            `plant_id` INT UNSIGNED NOT NULL,
            `x_pos` FLOAT NOT NULL,
            `y_pos` FLOAT NOT NULL,
            `size` SMALLINT UNSIGNED DEFAULT 72,
            `rotation` SMALLINT DEFAULT 0,
            `z_index` INT DEFAULT 0,
            `note` VARCHAR(200) DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_user_zone` (`user_id`, `zone`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }
}

// ─────────────────────────────────────────────────────────────────────
function handleGet($db, $user_id, $allowedZones) {
    $zone = isset($_GET['zone']) ? strtolower(trim($_GET['zone'])) : null;

    if ($zone) {
        if (!in_array($zone, $allowedZones)) respond(false, 'Invalid zone', null, 400);
        $stmt = $db->prepare("SELECT m.*, p.name AS plant_name, p.species AS plant_species,
                                     p.type AS plant_type, p.image_url AS plant_image
                              FROM garden_map_placements m
                              LEFT JOIN plants p ON m.plant_id = p.id
                              WHERE m.user_id = :uid AND m.zone = :z
                              ORDER BY m.z_index ASC, m.id ASC");
        $stmt->execute([':uid' => $user_id, ':z' => $zone]);
        respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
    }

    // No zone filter: return everything grouped by zone
    $stmt = $db->prepare("SELECT m.*, p.name AS plant_name, p.species AS plant_species,
                                 p.type AS plant_type, p.image_url AS plant_image
                          FROM garden_map_placements m
                          LEFT JOIN plants p ON m.plant_id = p.id
                          WHERE m.user_id = :uid
                          ORDER BY m.zone, m.z_index, m.id");
    $stmt->execute([':uid' => $user_id]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $grouped = [];
    foreach ($rows as $r) {
        $grouped[$r['zone']][] = $r;
    }
    respond(true, 'OK', $grouped);
}

// ─────────────────────────────────────────────────────────────────────
function handleSave($db, $user_id, $allowedZones) {
    $body = json_decode(file_get_contents('php://input'), true);
    if (!is_array($body)) respond(false, 'Invalid JSON body', null, 400);

    $zone = isset($body['zone']) ? strtolower(trim($body['zone'])) : '';
    if (!in_array($zone, $allowedZones)) respond(false, 'Invalid or missing zone', null, 400);

    $placements = isset($body['placements']) && is_array($body['placements']) ? $body['placements'] : [];

    $db->beginTransaction();
    try {
        // Wipe existing for this zone
        $del = $db->prepare("DELETE FROM garden_map_placements WHERE user_id = :uid AND zone = :z");
        $del->execute([':uid' => $user_id, ':z' => $zone]);

        $ins = $db->prepare("INSERT INTO garden_map_placements
            (user_id, zone, plant_id, x_pos, y_pos, size, rotation, z_index, note)
            VALUES (:uid, :z, :pid, :x, :y, :sz, :rot, :zi, :note)");

        foreach ($placements as $idx => $p) {
            if (!isset($p['plant_id']) || !isset($p['x_pos']) || !isset($p['y_pos'])) continue;
            $ins->execute([
                ':uid'  => $user_id,
                ':z'    => $zone,
                ':pid'  => intval($p['plant_id']),
                ':x'    => floatval($p['x_pos']),
                ':y'    => floatval($p['y_pos']),
                ':sz'   => isset($p['size']) ? max(32, min(200, intval($p['size']))) : 72,
                ':rot'  => isset($p['rotation']) ? intval($p['rotation']) : 0,
                ':zi'   => isset($p['z_index']) ? intval($p['z_index']) : $idx,
                ':note' => isset($p['note']) ? mb_substr($p['note'], 0, 200) : null,
            ]);
        }

        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }

    // Return fresh data
    $stmt = $db->prepare("SELECT m.*, p.name AS plant_name, p.species AS plant_species,
                                 p.type AS plant_type, p.image_url AS plant_image
                          FROM garden_map_placements m
                          LEFT JOIN plants p ON m.plant_id = p.id
                          WHERE m.user_id = :uid AND m.zone = :z
                          ORDER BY m.z_index, m.id");
    $stmt->execute([':uid' => $user_id, ':z' => $zone]);
    respond(true, 'Layout saved', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

// ─────────────────────────────────────────────────────────────────────
function handleDelete($db, $user_id, $allowedZones) {
    $zone = isset($_GET['zone']) ? strtolower(trim($_GET['zone'])) : '';
    if (!in_array($zone, $allowedZones)) respond(false, 'Invalid or missing zone', null, 400);

    $del = $db->prepare("DELETE FROM garden_map_placements WHERE user_id = :uid AND zone = :z");
    $del->execute([':uid' => $user_id, ':z' => $zone]);
    respond(true, 'Zone cleared');
}
