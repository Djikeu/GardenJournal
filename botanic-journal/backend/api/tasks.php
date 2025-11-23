<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once '../config/database.php';

function sendResponse($success, $message = '', $data = null, $code = 200) {
    http_response_code($code);
    echo json_encode([
        'success' => $success,
        'message' => $message,
        'data' => $data
    ]);
    exit();
}

try {
    $database = new Database();
    $db = $database->getConnection();
} catch (Exception $e) {
    sendResponse(false, 'Database connection failed: ' . $e->getMessage(), null, 500);
}

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

// Get input data
$input = json_decode(file_get_contents("php://input"), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    $input = [];
}

// Get user ID
$user_id = null;
if (isset($_GET['user_id'])) {
    $user_id = intval($_GET['user_id']);
} elseif (isset($input['user_id'])) {
    $user_id = intval($input['user_id']);
}

if (!$user_id || $user_id <= 0) {
    sendResponse(false, 'Valid user ID is required', null, 401);
}

try {
    switch($method) {
        case 'GET':
            handleGetTasks($db, $user_id);
            break;
        case 'POST':
            handleCreateTask($db, $user_id, $input);
            break;
        case 'PATCH':
            handleUpdateTask($db, $user_id, $input);
            break;
        case 'DELETE':
            handleDeleteTask($db, $user_id);
            break;
        default:
            sendResponse(false, 'Method not allowed', null, 405);
    }
} catch (Exception $e) {
    sendResponse(false, 'Server error: ' . $e->getMessage(), null, 500);
}

function handleGetTasks($db, $user_id) {
    $task_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if ($task_id) {
        // Get single task
        $stmt = $db->prepare("
            SELECT t.*, p.name as plant_name, p.image_url as plant_image
            FROM tasks t 
            LEFT JOIN plants p ON t.plant_id = p.id 
            WHERE t.id = :id AND t.user_id = :user_id
        ");
        $stmt->bindParam(':id', $task_id);
        $stmt->bindParam(':user_id', $user_id);
    } else {
        // Get all tasks for user
        $stmt = $db->prepare("
            SELECT t.*, p.name as plant_name, p.image_url as plant_image
            FROM tasks t 
            LEFT JOIN plants p ON t.plant_id = p.id 
            WHERE t.user_id = :user_id 
            ORDER BY 
                CASE 
                    WHEN t.completed = 1 THEN 2
                    WHEN t.priority = 'high' THEN 0
                    WHEN t.priority = 'medium' THEN 1
                    ELSE 2
                END,
                t.due_date ASC,
                t.created_at DESC
        ");
        $stmt->bindParam(':user_id', $user_id);
    }
    
    $stmt->execute();
    $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendResponse(true, 'Tasks retrieved successfully', $tasks);
}

function handleCreateTask($db, $user_id, $data) {
    // Validate required fields
    if (!isset($data['title']) || empty(trim($data['title']))) {
        sendResponse(false, 'Task title is required', null, 400);
    }
    
    // Set default values
    $title = trim($data['title']);
    $description = isset($data['description']) ? trim($data['description']) : '';
    $plant_id = isset($data['plant_id']) && !empty($data['plant_id']) ? intval($data['plant_id']) : null;
    $type = isset($data['type']) ? $data['type'] : 'other';
    $priority = isset($data['priority']) ? $data['priority'] : 'medium';
    $due_date = isset($data['due_date']) ? $data['due_date'] : null;
    $progress = isset($data['progress']) ? intval($data['progress']) : 0;
    $completed = isset($data['completed']) ? (bool)$data['completed'] : false;
    
    // Validate plant_id belongs to user
    if ($plant_id) {
        $checkStmt = $db->prepare("SELECT id FROM plants WHERE id = :plant_id AND user_id = :user_id");
        $checkStmt->bindParam(':plant_id', $plant_id);
        $checkStmt->bindParam(':user_id', $user_id);
        $checkStmt->execute();
        
        if (!$checkStmt->fetch()) {
            sendResponse(false, 'Plant not found or access denied', null, 404);
        }
    }
    
    // Insert task
    $stmt = $db->prepare("
        INSERT INTO tasks 
        (user_id, plant_id, title, description, type, priority, due_date, progress, completed, created_at, updated_at) 
        VALUES 
        (:user_id, :plant_id, :title, :description, :type, :priority, :due_date, :progress, :completed, NOW(), NOW())
    ");
    
    $stmt->bindParam(':user_id', $user_id);
    $stmt->bindParam(':plant_id', $plant_id);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':type', $type);
    $stmt->bindParam(':priority', $priority);
    $stmt->bindParam(':due_date', $due_date);
    $stmt->bindParam(':progress', $progress, PDO::PARAM_INT);
    $stmt->bindParam(':completed', $completed, PDO::PARAM_BOOL);
    
    if ($stmt->execute()) {
        $task_id = $db->lastInsertId();
        
        // Get the created task with plant info
        $taskStmt = $db->prepare("
            SELECT t.*, p.name as plant_name, p.image_url as plant_image
            FROM tasks t 
            LEFT JOIN plants p ON t.plant_id = p.id 
            WHERE t.id = :id
        ");
        $taskStmt->bindParam(':id', $task_id);
        $taskStmt->execute();
        $task = $taskStmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Task created successfully', $task, 201);
    } else {
        sendResponse(false, 'Failed to create task: ' . implode(', ', $stmt->errorInfo()), null, 500);
    }
}

function handleUpdateTask($db, $user_id, $data) {
    if (!isset($data['id'])) {
        sendResponse(false, 'Task ID is required', null, 400);
    }
    
    $task_id = intval($data['id']);
    
    // Check if task belongs to user
    $checkStmt = $db->prepare("SELECT id FROM tasks WHERE id = :id AND user_id = :user_id");
    $checkStmt->bindParam(':id', $task_id);
    $checkStmt->bindParam(':user_id', $user_id);
    $checkStmt->execute();
    
    if (!$checkStmt->fetch()) {
        sendResponse(false, 'Task not found or access denied', null, 404);
    }
    
    // Build dynamic update query based on provided fields
    $updates = [];
    $params = [':id' => $task_id];
    
    // List of allowed fields to update
    $allowedFields = [
        'title', 'description', 'plant_id', 'type', 'priority', 
        'due_date', 'completed', 'progress'
    ];
    
    foreach ($allowedFields as $field) {
        if (isset($data[$field])) {
            $updates[] = "$field = :$field";
            $params[":$field"] = $data[$field];
        }
    }
    
    // Handle progress auto-update when completing task
    if (isset($data['completed'])) {
        $updates[] = "progress = :progress";
        $params[":progress"] = $data['completed'] ? 100 : 0;
    }
    
    if (empty($updates)) {
        sendResponse(false, 'No valid fields to update', null, 400);
    }
    
    // Add updated_at timestamp
    $updates[] = "updated_at = NOW()";
    
    $sql = "UPDATE tasks SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    
    if ($stmt->execute($params)) {
        // Get the updated task
        $taskStmt = $db->prepare("
            SELECT t.*, p.name as plant_name, p.image_url as plant_image
            FROM tasks t 
            LEFT JOIN plants p ON t.plant_id = p.id 
            WHERE t.id = :id
        ");
        $taskStmt->bindParam(':id', $task_id);
        $taskStmt->execute();
        $task = $taskStmt->fetch(PDO::FETCH_ASSOC);
        
        sendResponse(true, 'Task updated successfully', $task);
    } else {
        sendResponse(false, 'Failed to update task: ' . implode(', ', $stmt->errorInfo()));
    }
}

function handleDeleteTask($db, $user_id) {
    $task_id = isset($_GET['id']) ? intval($_GET['id']) : null;
    
    if (!$task_id) {
        sendResponse(false, 'Task ID is required', null, 400);
    }
    
    // Check if task belongs to user
    $checkStmt = $db->prepare("SELECT id FROM tasks WHERE id = :id AND user_id = :user_id");
    $checkStmt->bindParam(':id', $task_id);
    $checkStmt->bindParam(':user_id', $user_id);
    $checkStmt->execute();
    
    if (!$checkStmt->fetch()) {
        sendResponse(false, 'Task not found or access denied', null, 404);
    }
    
    $stmt = $db->prepare("DELETE FROM tasks WHERE id = :id");
    $stmt->bindParam(':id', $task_id);
    
    if ($stmt->execute()) {
        sendResponse(true, 'Task deleted successfully');
    } else {
        sendResponse(false, 'Failed to delete task');
    }
}
?>