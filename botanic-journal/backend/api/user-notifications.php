<?php
/**
 * User notifications — follows, direct messages, etc.
 *
 *   GET    ?user_id=X[&limit=20]   → latest notifications
 *   GET    ?user_id=X&unread=1     → unread count only (lightweight poll)
 *   PATCH  ?user_id=X              → mark all read
 *   DELETE ?user_id=X[&id=Y]       → delete one (or all if id omitted)
 *
 * Notifications are written by other endpoints via the helper:
 *   require_once 'user-notifications.php';
 *   pushNotification($db, $recipientId, $type, $title, $body, $relatedId);
 */

ob_start();
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit(); }

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/database.php';

if (!function_exists('un_respond')) {
    function un_respond($success, $message = '', $data = null, $code = 200) {
        ob_clean();
        http_response_code($code);
        echo json_encode(['success' => $success, 'message' => $message, 'data' => $data]);
        exit();
    }
}

if (!function_exists('ensureNotifTable')) {
    function ensureNotifTable($db) {
        try {
            $db->exec("CREATE TABLE IF NOT EXISTS `user_notifications` (
                `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `user_id` INT UNSIGNED NOT NULL,
                `type` VARCHAR(40) NOT NULL,
                `title` VARCHAR(200) NOT NULL,
                `body` TEXT DEFAULT NULL,
                `related_id` INT UNSIGNED DEFAULT NULL,
                `actor_id` INT UNSIGNED DEFAULT NULL,
                `read_at` TIMESTAMP NULL DEFAULT NULL,
                `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`id`),
                KEY `idx_user_unread` (`user_id`, `read_at`),
                KEY `idx_user_created` (`user_id`, `created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
        } catch (Exception $e) { /* surface downstream */ }
    }
}

/**
 * Insert a notification for `recipientId`. Safe to call from any endpoint.
 */
if (!function_exists('pushNotification')) {
    function pushNotification($db, $recipientId, $type, $title, $body = null, $relatedId = null, $actorId = null) {
        try {
            ensureNotifTable($db);
            $stmt = $db->prepare("INSERT INTO user_notifications
                (user_id, type, title, body, related_id, actor_id)
                VALUES (:uid, :t, :title, :body, :rid, :aid)");
            $stmt->execute([
                ':uid'   => $recipientId,
                ':t'     => $type,
                ':title' => $title,
                ':body'  => $body,
                ':rid'   => $relatedId,
                ':aid'   => $actorId,
            ]);
            return $db->lastInsertId();
        } catch (Exception $e) {
            // Never let notification failure break the parent request
            error_log('pushNotification failed: ' . $e->getMessage());
            return null;
        }
    }
}

// Only run the route handlers if we were called directly (not included by another endpoint)
if (basename($_SERVER['SCRIPT_NAME']) === 'user-notifications.php') {

    $db = (new Database())->getConnection();
    if (!$db) un_respond(false, 'Database connection failed', null, 500);
    ensureNotifTable($db);

    $method  = $_SERVER['REQUEST_METHOD'];
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
    if (!$user_id) un_respond(false, 'user_id required', null, 401);

    try {
        switch ($method) {
            case 'GET':
                if (!empty($_GET['unread'])) {
                    // Lightweight unread count for polling
                    $stmt = $db->prepare("SELECT COUNT(*) FROM user_notifications WHERE user_id = :uid AND read_at IS NULL");
                    $stmt->execute([':uid' => $user_id]);
                    un_respond(true, 'OK', ['unread_count' => (int)$stmt->fetchColumn()]);
                }

                $limit = isset($_GET['limit']) ? max(1, min(100, intval($_GET['limit']))) : 20;
                $stmt = $db->prepare("SELECT n.*, u.name AS actor_name, u.avatar AS actor_avatar
                                      FROM user_notifications n
                                      LEFT JOIN users u ON u.id = n.actor_id
                                      WHERE n.user_id = :uid
                                      ORDER BY n.id DESC
                                      LIMIT $limit");
                $stmt->execute([':uid' => $user_id]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
                $unread = 0;
                foreach ($rows as $r) if (empty($r['read_at'])) $unread++;
                un_respond(true, 'OK', ['items' => $rows, 'unread_count' => $unread]);
                break;

            case 'PATCH':
                $db->prepare("UPDATE user_notifications SET read_at = NOW()
                              WHERE user_id = :uid AND read_at IS NULL")
                   ->execute([':uid' => $user_id]);
                un_respond(true, 'Marked all read');
                break;

            case 'DELETE':
                $id = isset($_GET['id']) ? intval($_GET['id']) : null;
                if ($id) {
                    $db->prepare("DELETE FROM user_notifications WHERE id = :id AND user_id = :uid")
                       ->execute([':id' => $id, ':uid' => $user_id]);
                } else {
                    $db->prepare("DELETE FROM user_notifications WHERE user_id = :uid")
                       ->execute([':uid' => $user_id]);
                }
                un_respond(true, 'Deleted');
                break;

            default:
                un_respond(false, 'Method not allowed', null, 405);
        }
    } catch (Exception $e) {
        un_respond(false, $e->getMessage(), null, 500);
    }
}
