<?php
require_once '../config/cors.php';
require_once '../config/database.php';
require_once '../models/Plant.php';

use BotanicJournal\Plant;

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->load();

$database = new Database();
$db = $database->getConnection();
$plant = new Plant($db);

// Temporary user ID (replace with actual auth later)
$user_id = 1;

$plant->user_id = $user_id;

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        $stmt = $plant->read();
        $plants = $stmt->fetchAll();
        
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'data' => $plants
        ]);
        break;

    case 'POST':
        $data = json_decode(file_get_contents("php://input"));
        
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
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to create plant'
            ]);
        }
        break;

    case 'PATCH':
        $data = json_decode(file_get_contents("php://input"));
        $plant->id = $data->id;
        $plant->is_favorite = $data->is_favorite;

        if($plant->updateFavorite()) {
            echo json_encode([
                'success' => true,
                'message' => 'Plant favorite status updated'
            ]);
        } else {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to update plant'
            ]);
        }
        break;

    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Method not allowed']);
        break;
}
?>