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
require_once '../models/Journal.php';

use BotanicJournal\Journal;

$database = new Database();
$db = $database->getConnection();
$journal = new Journal($db);

$user_id = 1;
$journal->user_id = $user_id;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            $stmt = $journal->read();
            $journals = $stmt->fetchAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $journals
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch journals: ' . $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->title) || !isset($data->content)) {
                throw new Exception('Title and content are required');
            }
            
            $journal->title = $data->title;
            $journal->content = $data->content;
            $journal->plant_id = $data->plant_id ?? null;
            $journal->images = isset($data->images) ? json_encode($data->images) : null;

            if($journal_id = $journal->create()) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Journal entry created successfully',
                    'data' => ['id' => $journal_id]
                ]);
            } else {
                throw new Exception('Failed to create journal entry');
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