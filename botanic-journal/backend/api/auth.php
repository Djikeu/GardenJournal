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

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';
    
    try {
        switch($action) {
            case 'register':
                // Validate required fields
                if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                    throw new Exception('All fields are required');
                }
                
                $name = trim($data['name']);
                $email = trim($data['email']);
                $password = $data['password'];
                $role = 'user'; // Default role for new registrations
                
                // Validate email
                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception('Invalid email format');
                }
                
                // Check if email already exists
                $check_stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
                $check_stmt->bindParam(':email', $email);
                $check_stmt->execute();
                
                if ($check_stmt->fetch()) {
                    throw new Exception('Email already exists');
                }
                
                // Hash password
                $hashed_password = password_hash($password, PASSWORD_DEFAULT);
                
                // Insert new user
                $stmt = $db->prepare("INSERT INTO users (name, email, password, role, level, created_at, updated_at) 
                                    VALUES (:name, :email, :password, :role, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
                $stmt->bindParam(':name', $name);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':password', $hashed_password);
                $stmt->bindParam(':role', $role);
                
                if ($stmt->execute()) {
                    $user_id = $db->lastInsertId();
                    
                    // Get the created user
                    $user_stmt = $db->prepare("SELECT id, name, email, avatar, level, role, is_active, created_at FROM users WHERE id = :id");
                    $user_stmt->bindParam(':id', $user_id);
                    $user_stmt->execute();
                    $user = $user_stmt->fetch(PDO::FETCH_ASSOC);
                    
                    // Map 'name' to 'username' for frontend compatibility
                    $user['username'] = $user['name'];
                    unset($user['name']); // Remove the 'name' field to avoid confusion
                    
                    http_response_code(201);
                    echo json_encode([
                        'success' => true,
                        'message' => 'User registered successfully',
                        'user' => $user
                    ]);
                } else {
                    throw new Exception('Failed to create user');
                }
                break;
                
            case 'login':
                // Validate required fields
                if (!isset($data['email']) || !isset($data['password'])) {
                    throw new Exception('Email and password are required');
                }
                
                $email = trim($data['email']);
                $password = $data['password'];
                
                // Find user by email
                $stmt = $db->prepare("SELECT id, name, email, password, avatar, level, role, is_active, last_login, created_at FROM users WHERE email = :email AND is_active = 1");
                $stmt->bindParam(':email', $email);
                $stmt->execute();
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if (!$user) {
                    throw new Exception('Invalid email or password');
                }
                
                // Verify password
                if (!password_verify($password, $user['password'])) {
                    throw new Exception('Invalid email or password');
                }
                
                // Update last login
                $update_stmt = $db->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = :id");
                $update_stmt->bindParam(':id', $user['id']);
                $update_stmt->execute();
                
                // Remove password from response
                unset($user['password']);
                
                // Map 'name' to 'username' for frontend compatibility
                $user['username'] = $user['name'];
                unset($user['name']); // Remove the 'name' field to avoid confusion
                
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user' => $user
                ]);
                break;
                
            default:
                throw new Exception('Invalid action');
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>