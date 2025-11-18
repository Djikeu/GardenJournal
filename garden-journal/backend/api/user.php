<?php
require_once '../config/cors.php';
require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();
$user_id = 1;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            $stmt = $db->prepare("SELECT id, email, name, avatar, level, created_at FROM users WHERE id = :id");
            $stmt->bindParam(':id', $user_id);
            $stmt->execute();
            $user = $stmt->fetch();
            
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
            $data = json_decode(file_get_contents("php://input"));
            
            $stmt = $db->prepare("UPDATE users SET name = :name, avatar = :avatar WHERE id = :id");
            $stmt->bindParam(':name', $data->name);
            $stmt->bindParam(':avatar', $data->avatar);
            $stmt->bindParam(':id', $user_id);
            
            if($stmt->execute()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Profile updated successfully'
                ]);
            } else {
                throw new Exception('Failed to update profile');
            }
        } catch (Exception $e) {
            http_response_code(500);
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