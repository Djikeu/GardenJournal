<?php
ob_start();

header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: POST, GET, PUT, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR])) {
        ob_clean();
        echo json_encode([
            'success' => false,
            'message' => $error['message'] . ' in ' . basename($error['file']) . ' line ' . $error['line']
        ]);
    }
});

ini_set('display_errors', 0);
error_reporting(E_ALL);

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;

if (!$user_id) {
    ob_clean();
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    try {
        $input = json_decode(file_get_contents('php://input'), true);

        if (!$input) {
            throw new Exception('Invalid request data');
        }

        $fields = [];
        $params = [':id' => $user_id];

        if (!empty($input['username'])) {
            $fields[] = 'name = :username';  
            $params[':username'] = $input['username'];
        }

        if (!empty($input['email'])) {
            $fields[] = 'email = :email';
            $params[':email'] = $input['email'];
        }

        if (!empty($input['avatar'])) {
            $fields[] = 'avatar = :avatar';
            $params[':avatar'] = $input['avatar'];
        }

        if (empty($fields)) {
            throw new Exception('No fields to update');
        }

        $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
        $stmt = $db->prepare($sql);

        if ($stmt->execute($params)) {
            $stmt2 = $db->prepare('SELECT id, name, email, avatar, role FROM users WHERE id = :id');
            $stmt2->execute([':id' => $user_id]);
            $updatedUser = $stmt2->fetch(PDO::FETCH_ASSOC);

            ob_clean();
            echo json_encode([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $updatedUser
            ]);
        } else {
            throw new Exception('Failed to update profile');
        }
    } catch (Exception $e) {
        ob_clean();
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    }
} else {
    ob_clean();
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
