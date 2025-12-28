<?php
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../models/Journal.php';

use BotanicJournal\Journal;

$database = new Database();
$db = $database->getConnection();
$journal = new Journal($db);

// Get user_id from request
$method = $_SERVER['REQUEST_METHOD'];
$user_id = null;

if ($method === 'GET') {
    $user_id = isset($_GET['user_id']) ? intval($_GET['user_id']) : null;
} else {
    $data = json_decode(file_get_contents("php://input"), true);
    $user_id = isset($data['user_id']) ? intval($data['user_id']) : null;
}

if (!$user_id) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required'
    ]);
    exit();
}

$journal->user_id = $user_id;

switch($method) {
    case 'GET':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        
        if ($id) {
            $journal->id = $id;
            $stmt = $journal->readOne();
            $journal_data = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($journal_data) {
                echo json_encode([
                    'success' => true,
                    'data' => $journal_data
                ]);
            } else {
                http_response_code(404);
                echo json_encode([
                    'success' => false,
                    'message' => 'Journal not found'
                ]);
            }
        } else {
            $stmt = $journal->read();
            $journals = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $journals
            ]);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"), true);
        
        if (!isset($data['title']) || !isset($data['content'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Title and content are required'
            ]);
            break;
        }
        
        $journal->title = $data['title'];
        $journal->content = $data['content'];
        $journal->plant_id = isset($data['plant_id']) ? $data['plant_id'] : null;

        if($journal_id = $journal->create()) {
            // Return the created journal data
            $journal->id = $journal_id;
            $stmt = $journal->readOne();
            $createdJournal = $stmt->fetch(PDO::FETCH_ASSOC);
            
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Journal created successfully',
                'data' => $createdJournal
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create journal'
            ]);
        }
        break;

    case 'PUT':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Journal ID is required'
            ]);
            break;
        }
        
        $data = json_decode(file_get_contents("php://input"), true);
        
        $journal->id = $id;
        $journal->title = $data['title'];
        $journal->content = $data['content'];
        $journal->plant_id = isset($data['plant_id']) ? $data['plant_id'] : null;

        if($journal->update()) {
            // Return the updated journal data
            $stmt = $journal->readOne();
            $updatedJournal = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'message' => 'Journal updated successfully',
                'data' => $updatedJournal
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update journal'
            ]);
        }
        break;

    case 'DELETE':
        $id = isset($_GET['id']) ? intval($_GET['id']) : null;
        if (!$id) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Journal ID is required'
            ]);
            break;
        }
        
        $journal->id = $id;
        
        if($journal->delete()) {
            echo json_encode([
                'success' => true,
                'message' => 'Journal deleted successfully'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to delete journal'
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode([
            'success' => false, 
            'message' => 'Method not allowed'
        ]);
        break;
}
?>