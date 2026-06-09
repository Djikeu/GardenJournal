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

// Prijava, registracija i izdavanje JWT tokena
require_once '../../config/database.php';
require_once '../../config/jwt.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $action = $data['action'] ?? '';

    try {
        switch($action) {
            case 'register':
                if (!isset($data['name']) || !isset($data['email']) || !isset($data['password'])) {
                    throw new Exception('All fields are required');
                }

                $name = trim($data['name']);
                $email = trim($data['email']);
                $password = $data['password'];
                $role = 'user'; // Default role for new registrations

                if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    throw new Exception('Invalid email format');
                }

                $check_stmt = $db->prepare("SELECT id FROM users WHERE email = :email");
                $check_stmt->bindParam(':email', $email);
                $check_stmt->execute();

                if ($check_stmt->fetch()) {
                    throw new Exception('Email already exists');
                }

                $hashed_password = password_hash($password, PASSWORD_DEFAULT);

                $stmt = $db->prepare("INSERT INTO users (name, email, password, role, level, created_at, updated_at)
                                    VALUES (:name, :email, :password, :role, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
                $stmt->bindParam(':name', $name);
                $stmt->bindParam(':email', $email);
                $stmt->bindParam(':password', $hashed_password);
                $stmt->bindParam(':role', $role);

                if ($stmt->execute()) {
                    $user_id = $db->lastInsertId();

                    $user_stmt = $db->prepare("SELECT id, name, email, avatar, level, role, is_active, created_at FROM users WHERE id = :id");
                    $user_stmt->bindParam(':id', $user_id);
                    $user_stmt->execute();
                    $user = $user_stmt->fetch(PDO::FETCH_ASSOC);

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

            case 'reset_password':
                if (!isset($data['email']) || !isset($data['password'])) {
                    throw new Exception('Email and new password are required');
                }
                $email = trim($data['email']);
                $newPassword = $data['password'];
                if (strlen($newPassword) < 6) {
                    throw new Exception('Password must be at least 6 characters');
                }
                $find = $db->prepare("SELECT id FROM users WHERE email = :email");
                $find->bindParam(':email', $email);
                $find->execute();
                $found = $find->fetch(PDO::FETCH_ASSOC);
                if (!$found) {
                    throw new Exception('No account found with that email');
                }
                $newHash = password_hash($newPassword, PASSWORD_DEFAULT);
                $upd = $db->prepare("UPDATE users SET password = :p WHERE id = :id");
                $upd->bindParam(':p', $newHash);
                $upd->bindParam(':id', $found['id']);
                $upd->execute();
                echo json_encode(['success' => true, 'message' => 'Password updated successfully']);
                break;

            case 'login':
                if (!isset($data['email']) || !isset($data['password'])) {
                    throw new Exception('Email and password are required');
                }

                $email = trim($data['email']);
                $password = $data['password'];

                $stmt = $db->prepare("SELECT id, name, email, password, avatar, level, role, is_active, last_login, created_at FROM users WHERE email = :email AND is_active = 1");
                $stmt->bindParam(':email', $email);
                $stmt->execute();
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    throw new Exception('Invalid email or password');
                }

                if (!password_verify($password, $user['password'])) {
                    throw new Exception('Invalid email or password');
                }

                $update_stmt = $db->prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = :id");
                $update_stmt->bindParam(':id', $user['id']);
                $update_stmt->execute();

                unset($user['password']);

                $user['username'] = $user['name'];
                unset($user['name']); // Remove the 'name' field to avoid confusion

                $token = jwt_encode(['uid' => (int) $user['id']]);

                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Login successful',
                    'user'  => $user,
                    'token' => $token
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
