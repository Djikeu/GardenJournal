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

// Get user ID from session or token
$user_id = isset($_GET['user_id']) ? $_GET['user_id'] : 1;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            if (isset($_GET['id'])) {
                // Get single task
                $stmt = $db->prepare("SELECT t.*, p.name as plant_name 
                                    FROM tasks t 
                                    LEFT JOIN plants p ON t.plant_id = p.id 
                                    WHERE t.id = :id AND t.user_id = :user_id");
                $stmt->bindParam(':id', $_GET['id']);
                $stmt->bindParam(':user_id', $user_id);
            } else {
                // Get all tasks for user
                $stmt = $db->prepare("SELECT t.*, p.name as plant_name 
                                    FROM tasks t 
                                    LEFT JOIN plants p ON t.plant_id = p.id 
                                    WHERE t.user_id = :user_id 
                                    ORDER BY t.priority DESC, t.due_date ASC");
                $stmt->bindParam(':user_id', $user_id);
            }
            
            $stmt->execute();
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $tasks
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            
            // Validate required fields
            if (!isset($data['title']) || !isset($data['type'])) {
                throw new Exception('Title and type are required');
            }
            
            $stmt = $db->prepare("INSERT INTO tasks (user_id, plant_id, title, description, type, priority, due_date, completed, progress, created_at, updated_at) 
                                VALUES (:user_id, :plant_id, :title, :description, :type, :priority, :due_date, :completed, :progress, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)");
            
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':plant_id', $data['plant_id']);
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':type', $data['type']);
            $stmt->bindParam(':priority', $data['priority']);
            $stmt->bindParam(':due_date', $data['due_date']);
            $stmt->bindParam(':completed', $data['completed']);
            $stmt->bindParam(':progress', $data['progress']);
            
            if ($stmt->execute()) {
                $task_id = $db->lastInsertId();
                
                // Get the created task with plant name
                $task_stmt = $db->prepare("SELECT t.*, p.name as plant_name 
                                         FROM tasks t 
                                         LEFT JOIN plants p ON t.plant_id = p.id 
                                         WHERE t.id = :id");
                $task_stmt->bindParam(':id', $task_id);
                $task_stmt->execute();
                $task = $task_stmt->fetch(PDO::FETCH_ASSOC);
                
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Task created successfully',
                    'data' => $task
                ]);
            } else {
                throw new Exception('Failed to create task');
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'PATCH':
        try {
            $data = json_decode(file_get_contents("php://input"), true);
            $task_id = $data['id'] ?? null;
            
            if (!$task_id) {
                throw new Exception('Task ID is required');
            }
            
            // Check if task belongs to user
            $check_stmt = $db->prepare("SELECT id FROM tasks WHERE id = :id AND user_id = :user_id");
            $check_stmt->bindParam(':id', $task_id);
            $check_stmt->bindParam(':user_id', $user_id);
            $check_stmt->execute();
            
            if (!$check_stmt->fetch()) {
                throw new Exception('Task not found or access denied');
            }
            
            if (isset($data['completed'])) {
                $stmt = $db->prepare("UPDATE tasks SET completed = :completed, progress = :progress, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
                $progress = $data['completed'] ? 100 : 0;
                $stmt->bindParam(':completed', $data['completed']);
                $stmt->bindParam(':progress', $progress);
                $stmt->bindParam(':id', $task_id);
            } elseif (isset($data['is_favorite'])) {
                $stmt = $db->prepare("UPDATE tasks SET is_favorite = :is_favorite, updated_at = CURRENT_TIMESTAMP WHERE id = :id");
                $stmt->bindParam(':is_favorite', $data['is_favorite']);
                $stmt->bindParam(':id', $task_id);
            } else {
                throw new Exception('No valid field to update');
            }
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Task updated successfully'
                ]);
            } else {
                throw new Exception('Failed to update task');
            }
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'DELETE':
        try {
            $task_id = $_GET['id'] ?? null;
            
            if (!$task_id) {
                throw new Exception('Task ID is required');
            }
            
            // Check if task belongs to user
            $check_stmt = $db->prepare("SELECT id FROM tasks WHERE id = :id AND user_id = :user_id");
            $check_stmt->bindParam(':id', $task_id);
            $check_stmt->bindParam(':user_id', $user_id);
            $check_stmt->execute();
            
            if (!$check_stmt->fetch()) {
                throw new Exception('Task not found or access denied');
            }
            
            $stmt = $db->prepare("DELETE FROM tasks WHERE id = :id");
            $stmt->bindParam(':id', $task_id);
            
            if ($stmt->execute()) {
                http_response_code(200);
                echo json_encode([
                    'success' => true,
                    'message' => 'Task deleted successfully'
                ]);
            } else {
                throw new Exception('Failed to delete task');
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