<?php
// Enable CORS
header("Access-Control-Allow-Origin: http://localhost:5173");
header("Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../models/Plant.php';

use BotanicJournal\Plant;

$database = new Database();
$db = $database->getConnection();
$plant = new Plant($db);

// Temporary user ID (replace with actual auth later)
$user_id = 1;
$plant->user_id = $user_id;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        try {
            $stmt = $plant->read();
            $plants = $stmt->fetchAll();
            
            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $plants
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch plants: ' . $e->getMessage()
            ]);
        }
        break;

    case 'POST':
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->name) || !isset($data->type)) {
                throw new Exception('Name and type are required');
            }
            
            $plant->name = $data->name;
            $plant->species = $data->species ?? null;
            $plant->type = $data->type;
            $plant->image = $data->image ?? null;
            $plant->status = $data->status ?? 'healthy';
            $plant->last_watered = $data->last_watered ?? null;
            $plant->temperature = $data->temperature ?? null;
            $plant->light = $data->light ?? null;
            $plant->humidity = $data->humidity ?? null;
            $plant->is_favorite = $data->is_favorite ?? false;

            if($plant_id = $plant->create()) {
                http_response_code(201);
                echo json_encode([
                    'success' => true,
                    'message' => 'Plant created successfully',
                    'data' => ['id' => $plant_id]
                ]);
            } else {
                throw new Exception('Failed to create plant');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => $e->getMessage()
            ]);
        }
        break;

    case 'PATCH':
        try {
            $data = json_decode(file_get_contents("php://input"));
            
            if (!isset($data->id)) {
                throw new Exception('Plant ID is required');
            }
            
            $plant->id = $data->id;
            $plant->is_favorite = $data->is_favorite;

            if($plant->updateFavorite()) {
                echo json_encode([
                    'success' => true,
                    'message' => 'Plant favorite status updated'
                ]);
            } else {
                throw new Exception('Failed to update plant');
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