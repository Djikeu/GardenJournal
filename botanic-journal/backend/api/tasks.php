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
require_once '../models/Task.php';

use BotanicJournal\Task;

$database = new Database();
$db = $database->getConnection();
$task = new Task($db);

$user_id = 1;
$task->user_id = $user_id;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            $stmt = $task->read();
            $tasks = $stmt->fetchAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $tasks
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch tasks: ' . $e->getMessage()
            ]);
        }
        break;

    case 'PATCH':
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->id)) {
                throw new Exception('Task ID is required');
            }
            
            $task->id = $data->id;
            
            if($task->complete()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Task completed successfully'
                ]);
            } else {
                throw new Exception('Failed to complete task');
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