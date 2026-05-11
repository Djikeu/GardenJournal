<?php
/**
 * Direct Messages — 1:1 chat between users
 *
 *   GET    ?user_id=X                       → list of conversations (latest msg + other user info)
 *   GET    ?user_id=X&with=Y                → full conversation with user Y (oldest → newest)
 *   POST   ?user_id=X  body { to, content } → send a message
 *   PATCH  ?user_id=X  body { from }        → mark all messages from user `from` as read
 */

ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS");
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
ensureDmTable($db);

$method  = $_SERVER['REQUEST_METHOD'];
$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
if (!$user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    if (is_array($body) && isset($body['user_id'])) $user_id = intval($body['user_id']);
}
if (!$user_id) respond(false, 'user_id required', null, 401);

try {
    switch ($method) {
        case 'GET':   handleGet($db, $user_id);         break;
        case 'POST':  handleSend($db, $user_id);        break;
        case 'PATCH': handleMarkRead($db, $user_id);    break;
        default:      respond(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

// ─────────────────────────────────────────────────────────────────────
function ensureDmTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `direct_messages` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `sender_id` INT UNSIGNED NOT NULL,
            `recipient_id` INT UNSIGNED NOT NULL,
            `content` TEXT NOT NULL,
            `read_at` TIMESTAMP NULL DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_pair` (`sender_id`, `recipient_id`, `created_at`),
            KEY `idx_recipient_unread` (`recipient_id`, `read_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) { /* surface downstream */ }
}

// ─────────────────────────────────────────────────────────────────────
function handleGet($db, $user_id) {
    if (isset($_GET['with'])) {
        return getConversation($db, $user_id, intval($_GET['with']));
    }
    return listConversations($db, $user_id);
}

// One row per "other person", with the latest message and unread count
function listConversations($db, $user_id) {
    $sql = "
      SELECT
        u.id   AS user_id,
        u.username,
        u.avatar,
        latest.content       AS last_message,
        latest.created_at    AS last_at,
        latest.sender_id     AS last_sender,
        IFNULL(unread.unread_count, 0) AS unread_count
      FROM (
        -- Distinct other party
        SELECT DISTINCT
          CASE WHEN sender_id = :uid THEN recipient_id ELSE sender_id END AS other_id
        FROM direct_messages
        WHERE sender_id = :uid OR recipient_id = :uid
      ) c
      JOIN users u ON u.id = c.other_id
      JOIN (
        SELECT
          dm.id, dm.sender_id, dm.recipient_id, dm.content, dm.created_at
        FROM direct_messages dm
        INNER JOIN (
          SELECT
            CASE WHEN sender_id = :uid THEN recipient_id ELSE sender_id END AS other_id,
            MAX(id) AS max_id
          FROM direct_messages
          WHERE sender_id = :uid OR recipient_id = :uid
          GROUP BY other_id
        ) m ON m.max_id = dm.id
      ) latest ON latest.id IS NOT NULL
        AND ((latest.sender_id = :uid AND latest.recipient_id = c.other_id)
          OR (latest.sender_id = c.other_id AND latest.recipient_id = :uid))
      LEFT JOIN (
        SELECT sender_id, COUNT(*) AS unread_count
        FROM direct_messages
        WHERE recipient_id = :uid AND read_at IS NULL
        GROUP BY sender_id
      ) unread ON unread.sender_id = c.other_id
      ORDER BY latest.created_at DESC
    ";
    $stmt = $db->prepare($sql);
    $stmt->execute([':uid' => $user_id]);
    respond(true, 'OK', $stmt->fetchAll(PDO::FETCH_ASSOC));
}

function getConversation($db, $user_id, $other_id) {
    if ($other_id === $user_id) respond(false, 'Cannot fetch self conversation', null, 400);

    // Pull other user's basics
    $u = $db->prepare("SELECT id, username, avatar FROM users WHERE id = :id");
    $u->execute([':id' => $other_id]);
    $other = $u->fetch(PDO::FETCH_ASSOC);
    if (!$other) respond(false, 'User not found', null, 404);

    // Messages
    $stmt = $db->prepare("SELECT id, sender_id, recipient_id, content, read_at, created_at
                          FROM direct_messages
                          WHERE (sender_id = :a AND recipient_id = :b)
                             OR (sender_id = :b AND recipient_id = :a)
                          ORDER BY id ASC
                          LIMIT 500");
    $stmt->execute([':a' => $user_id, ':b' => $other_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Auto-mark messages from `other` to `me` as read while we're at it
    $upd = $db->prepare("UPDATE direct_messages
                         SET read_at = NOW()
                         WHERE recipient_id = :me AND sender_id = :other AND read_at IS NULL");
    $upd->execute([':me' => $user_id, ':other' => $other_id]);

    respond(true, 'OK', ['other' => $other, 'messages' => $messages]);
}

// ─────────────────────────────────────────────────────────────────────
function handleSend($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    $to      = isset($body['to'])      ? intval($body['to'])      : null;
    $content = isset($body['content']) ? trim($body['content'])    : '';
    if (!$to || $content === '') respond(false, 'to and content required', null, 400);
    if ($to === $user_id)        respond(false, "You can't message yourself", null, 400);
    if (mb_strlen($content) > 2000) respond(false, 'Message too long (max 2000 chars)', null, 400);

    // Make sure recipient exists
    $check = $db->prepare("SELECT 1 FROM users WHERE id = :id");
    $check->execute([':id' => $to]);
    if (!$check->fetchColumn()) respond(false, 'Recipient not found', null, 404);

    $ins = $db->prepare("INSERT INTO direct_messages (sender_id, recipient_id, content)
                         VALUES (:s, :r, :c)");
    $ins->execute([':s' => $user_id, ':r' => $to, ':c' => $content]);

    $row = $db->prepare("SELECT * FROM direct_messages WHERE id = :id");
    $row->execute([':id' => $db->lastInsertId()]);
    respond(true, 'Sent', $row->fetch(PDO::FETCH_ASSOC), 201);
}

function handleMarkRead($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    $from = isset($body['from']) ? intval($body['from']) : null;
    if (!$from) respond(false, 'from required', null, 400);

    $upd = $db->prepare("UPDATE direct_messages SET read_at = NOW()
                         WHERE recipient_id = :me AND sender_id = :from AND read_at IS NULL");
    $upd->execute([':me' => $user_id, ':from' => $from]);
    respond(true, 'Marked read');
}
