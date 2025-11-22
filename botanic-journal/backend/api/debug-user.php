<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

// Get all possible user_id sources
$get_user_id = $_GET['user_id'] ?? null;
$post_data = json_decode(file_get_contents("php://input"), true);
$post_user_id = $post_data['user_id'] ?? null;
$session_user_id = $_SESSION['user_id'] ?? null;

// Check users table
$stmt = $db->query("SELECT id, username, role FROM users");
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo json_encode([
    'debug_info' => [
        'get_user_id' => $get_user_id,
        'post_user_id' => $post_user_id, 
        'session_user_id' => $session_user_id,
        'all_users' => $users
    ]
]);
?>