<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = 1; // In real app, get from JWT token

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            $stmt = $db->prepare("SELECT id, email, name, avatar, level, created_at, updated_at FROM users WHERE id = :id");
            $stmt->bindParam(':id', $user_id);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$user) {
                throw new Exception('User not found');
            }
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $user
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'PUT':
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Validate input
            if (!isset($data['name']) || !isset($data['email'])) {
                throw new Exception('Name and email are required');
            }
            
            $name = trim($data['name']);
            $email = trim($data['email']);
            $avatar = isset($data['avatar']) ? trim($data['avatar']) : null;
            
            if (empty($name) || empty($email)) {
                throw new Exception('Name and email cannot be empty');
            }
            
            if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                throw new Exception('Invalid email format');
            }
            
            // Check if email already exists for other users
            $stmt = $db->prepare("SELECT id FROM users WHERE email = :email AND id != :id");
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':id', $user_id);
            $stmt->execute();
            
            if ($stmt->fetch()) {
                throw new Exception('Email already exists');
            }
            
            // Update user
            $stmt = $db->prepare("UPDATE users SET name = :name, email = :email, avatar = :avatar, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
            $stmt->bindParam(':name', $name);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':avatar', $avatar);
            $stmt->bindParam(':id', $user_id);
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile updated successfully'
                ]);
            } else {
                throw new Exception('Failed to update profile');
            }
            
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>