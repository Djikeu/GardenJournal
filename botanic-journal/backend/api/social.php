<?php
/**
 * Social — follow / unfollow / discover users / public profiles
 *
 *   GET    ?user_id=X&action=discover[&q=monstera]    → list of users (excludes self)
 *   GET    ?user_id=X&action=following                 → users I'm following
 *   GET    ?user_id=X&action=followers                 → users who follow me
 *   GET    ?user_id=X&action=profile&target=Y         → public profile of user Y
 *   POST   ?user_id=X  body { target_user_id }        → follow target
 *   DELETE ?user_id=X&target=Y                        → unfollow target
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
ensureFollowTable($db);

$method  = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    if (is_array($body) && isset($body['user_id'])) $user_id = intval($body['user_id']);
}
if (!$user_id) respond(false, 'user_id required', null, 401);

try {
    switch ($method) {
        case 'GET':    handleGet($db, $user_id);    break;
        case 'POST':   handleFollow($db, $user_id); break;
        case 'DELETE': handleUnfollow($db, $user_id); break;
        default:       respond(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// ─────────────────────────────────────────────────────────────────────
function ensureFollowTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `user_follows` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `follower_id` INT UNSIGNED NOT NULL,
            `followed_id` INT UNSIGNED NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            UNIQUE KEY `uniq_follow` (`follower_id`, `followed_id`),
            KEY `idx_followed` (`followed_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }
}

// ─────────────────────────────────────────────────────────────────────
function handleGet($db, $user_id) {
    $action = isset($_GET['action']) ? $_GET['action'] : 'discover';

    switch ($action) {
        case 'discover':  return discoverUsers($db, $user_id);
        case 'following': return listFollowing($db, $user_id);
        case 'followers': return listFollowers($db, $user_id);
        case 'profile':   return getPublicProfile($db, $user_id);
        default:          respond(false, 'Unknown action', null, 400);
    }
}

// User search / discover with stats + follow status
function discoverUsers($db, $user_id) {
    $q = isset($_GET['q']) ? trim($_GET['q']) : '';

    $sql = "SELECT u.id, u.name AS username, u.email, u.avatar, u.created_at,
                   (SELECT COUNT(*) FROM plants    p WHERE p.user_id = u.id) AS plants_count,
                   (SELECT COUNT(*) FROM journals  j WHERE j.user_id = u.id AND j.is_public = 1) AS public_journals_count,
                   (SELECT COUNT(*) FROM user_follows f WHERE f.followed_id = u.id) AS followers_count,
                   EXISTS(SELECT 1 FROM user_follows f WHERE f.follower_id = :me AND f.followed_id = u.id) AS is_following
            FROM users u
            WHERE u.id != :me ";
    $params = [':me' => $user_id];

    if ($q !== '') {
        $sql .= " AND (u.name LIKE :q OR u.email LIKE :q) ";
        $params[':q'] = "%$q%";
    }
    $sql .= " ORDER BY plants_count DESC, u.created_at DESC LIMIT 50";

    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function listFollowing($db, $user_id) {
    $stmt = $db->prepare("SELECT u.id, u.name AS username, u.avatar, u.email, f.created_at AS followed_since,
                                 (SELECT COUNT(*) FROM plants p WHERE p.user_id = u.id) AS plants_count
                          FROM user_follows f
                          JOIN users u ON u.id = f.followed_id
                          WHERE f.follower_id = :uid
                          ORDER BY f.created_at DESC");
    $stmt->execute([':uid' => $user_id]);
    respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function listFollowers($db, $user_id) {
    $stmt = $db->prepare("SELECT u.id, u.name AS username, u.avatar, u.email, f.created_at AS following_since,
                                 (SELECT COUNT(*) FROM plants p WHERE p.user_id = u.id) AS plants_count,
                                 EXISTS(SELECT 1 FROM user_follows f2 WHERE f2.follower_id = :uid AND f2.followed_id = u.id) AS i_follow_back
                          FROM user_follows f
                          JOIN users u ON u.id = f.follower_id
                          WHERE f.followed_id = :uid
                          ORDER BY f.created_at DESC");
    $stmt->execute([':uid' => $user_id]);
    respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getPublicProfile($db, $viewer_id) {
    $target = isset($_GET['target']) ? intval($_GET['target']) : null;
    if (!$target) respond(false, 'target user id required', null, 400);

    // User basic
    $stmt = $db->prepare("SELECT id, name AS username, email, avatar, created_at, role
                          FROM users WHERE id = :id");
    $stmt->execute([':id' => $target]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$user) respond(false, 'User not found', null, 404);

    // Stats
    $plants_count    = (int)$db->query("SELECT COUNT(*) FROM plants    WHERE user_id = $target")->fetchColumn();
    $journals_count  = (int)$db->query("SELECT COUNT(*) FROM journals  WHERE user_id = $target AND is_public = 1")->fetchColumn();
    $followers_count = (int)$db->query("SELECT COUNT(*) FROM user_follows WHERE followed_id = $target")->fetchColumn();
    $following_count = (int)$db->query("SELECT COUNT(*) FROM user_follows WHERE follower_id = $target")->fetchColumn();

    // Is the viewer following this user?
    $check = $db->prepare("SELECT 1 FROM user_follows WHERE follower_id = :v AND followed_id = :t");
    $check->execute([':v' => $viewer_id, ':t' => $target]);
    $is_following = (bool)$check->fetchColumn();

    // A few of the user's plants
    $stmt = $db->prepare("SELECT id, name, species, type, image_url, status
                          FROM plants WHERE user_id = :uid
                          ORDER BY created_at DESC LIMIT 12");
    $stmt->execute([':uid' => $target]);
    $plants = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Public journals
    $stmt = $db->prepare("SELECT j.id, j.title, j.content, j.created_at, j.plant_id,
                                 p.name AS plant_name, p.image_url AS plant_image
                          FROM journals j
                          LEFT JOIN plants p ON j.plant_id = p.id
                          WHERE j.user_id = :uid AND j.is_public = 1
                          ORDER BY j.created_at DESC LIMIT 20");
    $stmt->execute([':uid' => $target]);
    $journals = $stmt->fetchAll(PDO::FETCH_ASSOC);

    respond(true, 'OK', [
        'user'            => $user,
        'plants_count'    => $plants_count,
        'journals_count'  => $journals_count,
        'followers_count' => $followers_count,
        'following_count' => $following_count,
        'is_following'    => $is_following,
        'plants'          => $plants,
        'journals'        => $journals,
    ]);
}

// ─────────────────────────────────────────────────────────────────────
function handleFollow($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    $target = isset($body['target_user_id']) ? intval($body['target_user_id']) : null;
    if (!$target) respond(false, 'target_user_id required', null, 400);
    if ($target === $user_id) respond(false, "You can't follow yourself", null, 400);

    // Make sure target exists
    $check = $db->prepare("SELECT 1 FROM users WHERE id = :id");
    $check->execute([':id' => $target]);
    if (!$check->fetchColumn()) respond(false, 'User not found', null, 404);

    $ins = $db->prepare("INSERT IGNORE INTO user_follows (follower_id, followed_id) VALUES (:f, :t)");
    $ins->execute([':f' => $user_id, ':t' => $target]);

    respond(true, 'Followed', ['target_user_id' => $target, 'is_following' => true]);
}

function handleUnfollow($db, $user_id) {
    $target = isset($_GET['target']) ? intval($_GET['target']) : null;
    if (!$target) respond(false, 'target required', null, 400);

    $del = $db->prepare("DELETE FROM user_follows WHERE follower_id = :f AND followed_id = :t");
    $del->execute([':f' => $user_id, ':t' => $target]);

    respond(true, 'Unfollowed', ['target_user_id' => $target, 'is_following' => false]);
}
