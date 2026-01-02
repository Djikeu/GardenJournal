<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Check if user is admin
$current_user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

if (!$current_user_id) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Authentication required']);
    exit();
}

// Verify current user is admin
$check_admin_stmt = $db->prepare("SELECT role FROM users WHERE id = :id");
$check_admin_stmt->bindParam(':id', $current_user_id);
$check_admin_stmt->execute();
$user_role = $check_admin_stmt->fetchColumn();

if ($user_role !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        handleGetUsers($db);
        break;
    case 'PUT':
    case 'PATCH':
        handleUpdateUser($db, $current_user_id);
        break;
    case 'DELETE':
        handleDeleteUser($db, $current_user_id);
        break;
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}

function handleGetUsers($db) {
    $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 20;
    $offset = ($page - 1) * $limit;
    
    // Get total count
    $count_stmt = $db->query("SELECT COUNT(*) as total FROM users");
    $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    // Get users with pagination
    $stmt = $db->prepare("
        SELECT 
            id, name, email, avatar, level, role, 
            is_active, last_login, created_at, updated_at
        FROM users 
        ORDER BY created_at DESC 
        LIMIT :limit OFFSET :offset
    ");
    
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode([
        'success' => true,
        'data' => $users,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

function handleUpdateUser($db, $admin_id) {
    $input = json_decode(file_get_contents("php://input"), true);
    
    if (!isset($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        exit();
    }
    
    $user_id = intval($input['id']);
    
    // Prevent admin from modifying themselves (safety check)
    if ($user_id == $admin_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cannot modify your own admin account']);
        exit();
    }
    
    $allowed_fields = ['name', 'email', 'role', 'is_active', 'level'];
    $updates = [];
    $params = [':id' => $user_id];
    
    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $input[$field];
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'No valid fields to update']);
        exit();
    }
    
    $sql = "UPDATE users SET " . implode(', ', $updates) . ", updated_at = CURRENT_TIMESTAMP WHERE id = :id";
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute($params)) {
        echo json_encode(['success' => true, 'message' => 'User updated successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to update user']);
    }
}

function handleDeleteUser($db, $admin_id) {
    $user_id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$user_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID required']);
        exit();
    }
    
    // Prevent admin from deleting themselves
    if ($user_id == $admin_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cannot delete your own admin account']);
        exit();
    }
    
    // Check if user exists
    $check_stmt = $db->prepare("SELECT id FROM users WHERE id = :id");
    $check_stmt->bindParam(':id', $user_id);
    $check_stmt->execute();
    
    if (!$check_stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'User not found']);
        exit();
    }
    
    // Delete user (with cascade from foreign keys)
    $stmt = $db->prepare("DELETE FROM users WHERE id = :id");
    $stmt->bindParam(':id', $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'User deleted successfully']);
    } else {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to delete user']);
    }
}
?>