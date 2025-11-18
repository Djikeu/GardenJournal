<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../models/Task.php';

use BotanicJournal\Task;

$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$database = new Database();
$db = $database->getConnection();
$task = new Task($db);

$user_id = 1;
$task->user_id = $user_id;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $task->read();
        $tasks = $stmt->fetchAll();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $tasks
        ]);
        break;

    case 'PATCH':
        $data = json_decode(file_get_contents("php://input"));
        $path = explode('/', $_SERVER['REQUEST_URI']);
        $task_id = end($path);
        
        if(strpos($task_id, 'complete') !== false) {
            $task->id = $data->id;
            if($task->complete()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Task completed successfully'
                ]);
            } else {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Failed to complete task'
                ]);
            }
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>