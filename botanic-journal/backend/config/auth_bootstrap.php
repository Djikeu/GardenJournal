<?php

require_once __DIR__ . '/jwt.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    return;
}

$script   = $_SERVER['SCRIPT_NAME'] ?? ($_SERVER['PHP_SELF'] ?? '');
$isPublic = (strpos($script, '/users/auth.php') !== false);

function bj_bearer_token() {
    $auth = '';
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['HTTP_AUTHORIZATION'];
    } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        $auth = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
    } elseif (function_exists('getallheaders')) {
        foreach (getallheaders() as $k => $v) {
            if (strcasecmp($k, 'Authorization') === 0) { $auth = $v; break; }
        }
    }
    if (preg_match('/Bearer\s+(.+)/i', $auth, $m)) return trim($m[1]);
    return null;
}

$token   = bj_bearer_token();
$payload = $token ? jwt_decode($token) : null;

if ($payload && isset($payload['uid'])) {
    $uid = (int) $payload['uid'];
    $_GET['user_id']     = $uid;
    $_POST['user_id']    = $uid;
    $_REQUEST['user_id'] = $uid;
    $GLOBALS['AUTH_UID'] = $uid;
} elseif (!$isPublic) {
    header('Access-Control-Allow-Origin: http://localhost:5173');
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required (invalid or missing token)']);
    exit;
}
