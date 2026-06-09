<?php

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

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/user-notifications.php';

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
    if (is_array($body) && isset($body['user_id'])) $user_id = (int)($GLOBALS['AUTH_UID'] ?? $body['user_id']);
}
if (!$user_id) respond(false, 'user_id required', null, 401);

try {
    switch ($method) {
        case 'GET':
            handleGet($db, $user_id);
            break;
        case 'POST':
            if (isset($_GET['action']) && $_GET['action'] === 'upload') {
                handleUpload($db, $user_id);
            } else {
                handleSend($db, $user_id);
            }
            break;
        case 'PATCH':
            $body = json_decode(file_get_contents('php://input'), true) ?: [];
            if (isset($body['action']) && $body['action'] === 'edit') {
                handleEdit($db, $user_id, $body);
            } else {
                handleMarkRead($db, $user_id, $body);
            }
            break;
        case 'DELETE':
            handleDelete($db, $user_id);
            break;
        default:
            respond(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    respond(false, $e->getMessage(), null, 500);
}

function ensureDmTable($db) {
    try {
        $db->exec("CREATE TABLE IF NOT EXISTS `direct_messages` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `sender_id` INT UNSIGNED NOT NULL,
            `recipient_id` INT UNSIGNED NOT NULL,
            `content` TEXT NOT NULL,
            `attachment_path` VARCHAR(500) DEFAULT NULL,
            `attachment_type` VARCHAR(50)  DEFAULT NULL,
            `read_at` TIMESTAMP NULL DEFAULT NULL,
            `edited_at` TIMESTAMP NULL DEFAULT NULL,
            `deleted_at` TIMESTAMP NULL DEFAULT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_pair` (`sender_id`, `recipient_id`, `created_at`),
            KEY `idx_recipient_unread` (`recipient_id`, `read_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    } catch (Exception $e) {  }

    foreach (['attachment_path VARCHAR(500) DEFAULT NULL',
              'attachment_type VARCHAR(50)  DEFAULT NULL',
              'edited_at  TIMESTAMP NULL DEFAULT NULL',
              'deleted_at TIMESTAMP NULL DEFAULT NULL'] as $col) {
        try { $db->exec("ALTER TABLE direct_messages ADD COLUMN $col"); }
        catch (Exception $e) {  }
    }
}

function handleGet($db, $user_id) {
    if (isset($_GET['with'])) {
        return getConversation($db, $user_id, intval($_GET['with']));
    }
    return listConversations($db, $user_id);
}

function listConversations($db, $user_id) {
    $sql = "
      SELECT
        u.id   AS user_id,
        u.name AS username,
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

    $u = $db->prepare("SELECT id, name AS username, avatar FROM users WHERE id = :id");
    $u->execute([':id' => $other_id]);
    $other = $u->fetch(PDO::FETCH_ASSOC);
    if (!$other) respond(false, 'User not found', null, 404);

    $stmt = $db->prepare("SELECT id, sender_id, recipient_id, content,
                                 attachment_path, attachment_type,
                                 read_at, edited_at, deleted_at, created_at
                          FROM direct_messages
                          WHERE (sender_id = :a AND recipient_id = :b)
                             OR (sender_id = :b AND recipient_id = :a)
                          ORDER BY id ASC
                          LIMIT 500");
    $stmt->execute([':a' => $user_id, ':b' => $other_id]);
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $upd = $db->prepare("UPDATE direct_messages
                         SET read_at = NOW()
                         WHERE recipient_id = :me AND sender_id = :other AND read_at IS NULL");
    $upd->execute([':me' => $user_id, ':other' => $other_id]);

    respond(true, 'OK', ['other' => $other, 'messages' => $messages]);
}

function handleSend($db, $user_id) {
    $body = json_decode(file_get_contents('php://input'), true);
    $to              = isset($body['to'])              ? intval($body['to'])              : null;
    $content         = isset($body['content'])         ? trim($body['content'])           : '';
    $attachmentPath  = isset($body['attachment_path']) ? trim($body['attachment_path'])   : null;
    $attachmentType  = isset($body['attachment_type']) ? trim($body['attachment_type'])   : null;

    if (!$to)                    respond(false, 'to required', null, 400);
    if ($content === '' && !$attachmentPath) respond(false, 'content or attachment required', null, 400);
    if ($to === $user_id)        respond(false, "You can't message yourself", null, 400);
    if (mb_strlen($content) > 2000) respond(false, 'Message too long (max 2000 chars)', null, 400);

    $check = $db->prepare("SELECT 1 FROM users WHERE id = :id");
    $check->execute([':id' => $to]);
    if (!$check->fetchColumn()) respond(false, 'Recipient not found', null, 404);

    $ins = $db->prepare("INSERT INTO direct_messages
        (sender_id, recipient_id, content, attachment_path, attachment_type)
        VALUES (:s, :r, :c, :ap, :at)");
    $ins->execute([
        ':s'  => $user_id,
        ':r'  => $to,
        ':c'  => $content,
        ':ap' => $attachmentPath ?: null,
        ':at' => $attachmentType ?: null,
    ]);
    $messageId = $db->lastInsertId();

    $actorStmt = $db->prepare("SELECT name FROM users WHERE id = :id");
    $actorStmt->execute([':id' => $user_id]);
    $actorName = $actorStmt->fetchColumn() ?: 'A gardener';
    $preview = mb_substr($content, 0, 80) . (mb_strlen($content) > 80 ? '…' : '');

    pushNotification(
        $db,
        $to,
        'message',
        "New message from {$actorName}",
        $preview,
        $user_id,    // related_id = the sender, so the bell can open the chat with them
        $user_id
    );

    $row = $db->prepare("SELECT * FROM direct_messages WHERE id = :id");
    $row->execute([':id' => $messageId]);
    respond(true, 'Sent', $row->fetch(PDO::FETCH_ASSOC), 201);
}

function handleMarkRead($db, $user_id, $body = null) {
    if ($body === null) $body = json_decode(file_get_contents('php://input'), true) ?: [];
    $from = isset($body['from']) ? intval($body['from']) : null;
    if (!$from) respond(false, 'from required', null, 400);

    $upd = $db->prepare("UPDATE direct_messages SET read_at = NOW()
                         WHERE recipient_id = :me AND sender_id = :from AND read_at IS NULL");
    $upd->execute([':me' => $user_id, ':from' => $from]);
    respond(true, 'Marked read');
}

function handleEdit($db, $user_id, $body) {
    $msgId   = isset($body['message_id']) ? intval($body['message_id']) : 0;
    $content = isset($body['content'])    ? trim($body['content'])      : '';
    if (!$msgId || $content === '')     respond(false, 'message_id and content required', null, 400);
    if (mb_strlen($content) > 2000)     respond(false, 'Message too long (max 2000 chars)', null, 400);

    $own = $db->prepare("SELECT sender_id, deleted_at, created_at FROM direct_messages WHERE id = :id");
    $own->execute([':id' => $msgId]);
    $row = $own->fetch(PDO::FETCH_ASSOC);
    if (!$row)                                          respond(false, 'Message not found', null, 404);
    if (intval($row['sender_id']) !== $user_id)         respond(false, 'You can only edit your own messages', null, 403);
    if (!empty($row['deleted_at']))                     respond(false, 'Cannot edit a deleted message', null, 400);

    $age = time() - strtotime($row['created_at']);
    if ($age > 15 * 60) respond(false, 'Edit window has passed (15 min)', null, 400);

    $upd = $db->prepare("UPDATE direct_messages
                         SET content = :c, edited_at = NOW()
                         WHERE id = :id");
    $upd->execute([':c' => $content, ':id' => $msgId]);

    $get = $db->prepare("SELECT * FROM direct_messages WHERE id = :id");
    $get->execute([':id' => $msgId]);
    respond(true, 'Edited', $get->fetch(PDO::FETCH_ASSOC));
}

function handleDelete($db, $user_id) {
    $msgId = isset($_GET['message_id']) ? intval($_GET['message_id']) : 0;
    if (!$msgId) respond(false, 'message_id required', null, 400);

    $own = $db->prepare("SELECT sender_id, attachment_path FROM direct_messages WHERE id = :id");
    $own->execute([':id' => $msgId]);
    $row = $own->fetch(PDO::FETCH_ASSOC);
    if (!$row)                                  respond(false, 'Message not found', null, 404);
    if (intval($row['sender_id']) !== $user_id) respond(false, 'You can only delete your own messages', null, 403);

    $upd = $db->prepare("UPDATE direct_messages
                         SET deleted_at = NOW(), content = '[deleted]', attachment_path = NULL
                         WHERE id = :id");
    $upd->execute([':id' => $msgId]);

    if (!empty($row['attachment_path'])) {
        $diskPath = __DIR__ . '/../../..' . $row['attachment_path'];
        if (file_exists($diskPath) && is_writable($diskPath)) @unlink($diskPath);
    }

    respond(true, 'Deleted', ['message_id' => $msgId]);
}

function handleUpload($db, $user_id) {
    if (empty($_FILES['file'])) respond(false, 'file required', null, 400);
    $f = $_FILES['file'];
    if ($f['error'] !== UPLOAD_ERR_OK) respond(false, 'Upload error: ' . $f['error'], null, 400);
    if ($f['size'] > 10 * 1024 * 1024) respond(false, 'File too large (max 10 MB)', null, 400);

    $allowed = [
        'image/jpeg' => 'jpg',
        'image/png'  => 'png',
        'image/webp' => 'webp',
        'image/gif'  => 'gif',
        'application/pdf' => 'pdf',
    ];
    $mime = $f['type'];
    if (!isset($allowed[$mime])) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime  = $finfo ? finfo_file($finfo, $f['tmp_name']) : $f['type'];
        if ($finfo) finfo_close($finfo);
    }
    if (!isset($allowed[$mime])) respond(false, 'Unsupported file type', null, 400);

    $ext = $allowed[$mime];
    $kind = strpos($mime, 'image/') === 0 ? 'image' : 'file';

    $relDir  = '/backend/uploads/messages';
    $diskDir = realpath(__DIR__ . '/../../..') . $relDir;
    if (!is_dir($diskDir)) @mkdir($diskDir, 0775, true);
    if (!is_dir($diskDir)) respond(false, 'Upload directory could not be created', null, 500);

    $fileName = $user_id . '_' . time() . '_' . bin2hex(random_bytes(4)) . '.' . $ext;
    $diskPath = $diskDir . DIRECTORY_SEPARATOR . $fileName;
    if (!move_uploaded_file($f['tmp_name'], $diskPath)) {
        respond(false, 'Could not move uploaded file', null, 500);
    }

    $publicPath = $relDir . '/' . $fileName;
    respond(true, 'Uploaded', [
        'path'        => $publicPath,
        'type'        => $kind,
        'mime'        => $mime,
        'original'    => $f['name'],
        'size'        => $f['size'],
    ]);
}
